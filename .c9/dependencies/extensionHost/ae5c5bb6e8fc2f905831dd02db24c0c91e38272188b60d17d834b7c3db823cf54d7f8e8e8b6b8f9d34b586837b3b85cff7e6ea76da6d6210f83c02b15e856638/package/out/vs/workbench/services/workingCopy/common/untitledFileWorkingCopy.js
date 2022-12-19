/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/cancellation", "vs/base/common/async", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/base/common/stream"], function (require, exports, event_1, lifecycle_1, workingCopyService_1, cancellation_1, async_1, log_1, workingCopyBackup_1, stream_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledFileWorkingCopy = void 0;
    let UntitledFileWorkingCopy = class UntitledFileWorkingCopy extends lifecycle_1.Disposable {
        //#endregion
        constructor(typeId, resource, name, hasAssociatedFilePath, initialContents, modelFactory, saveDelegate, workingCopyService, workingCopyBackupService, logService) {
            super();
            this.typeId = typeId;
            this.resource = resource;
            this.name = name;
            this.hasAssociatedFilePath = hasAssociatedFilePath;
            this.initialContents = initialContents;
            this.modelFactory = modelFactory;
            this.saveDelegate = saveDelegate;
            this.workingCopyBackupService = workingCopyBackupService;
            this.logService = logService;
            this.capabilities = 2 /* WorkingCopyCapabilities.Untitled */;
            this._model = undefined;
            //#region Events
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this._onDidRevert = this._register(new event_1.Emitter());
            this.onDidRevert = this._onDidRevert.event;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            //#region Dirty
            this.dirty = this.hasAssociatedFilePath || Boolean(this.initialContents && this.initialContents.markDirty !== false);
            // Make known to working copy service
            this._register(workingCopyService.registerWorkingCopy(this));
        }
        get model() { return this._model; }
        isDirty() {
            return this.dirty;
        }
        setDirty(dirty) {
            if (this.dirty === dirty) {
                return;
            }
            this.dirty = dirty;
            this._onDidChangeDirty.fire();
        }
        //#endregion
        //#region Resolve
        async resolve() {
            var _a;
            this.trace('resolve()');
            if (this.isResolved()) {
                this.trace('resolve() - exit (already resolved)');
                // return early if the untitled file working copy is already
                // resolved assuming that the contents have meanwhile changed
                // in the underlying model. we only resolve untitled once.
                return;
            }
            let untitledContents;
            // Check for backups or use initial value or empty
            const backup = await this.workingCopyBackupService.resolve(this);
            if (backup) {
                this.trace('resolve() - with backup');
                untitledContents = backup.value;
            }
            else if ((_a = this.initialContents) === null || _a === void 0 ? void 0 : _a.value) {
                this.trace('resolve() - with initial contents');
                untitledContents = this.initialContents.value;
            }
            else {
                this.trace('resolve() - empty');
                untitledContents = (0, stream_1.emptyStream)();
            }
            // Create model
            await this.doCreateModel(untitledContents);
            // Untitled associated to file path are dirty right away as well as untitled with content
            this.setDirty(this.hasAssociatedFilePath || !!backup || Boolean(this.initialContents && this.initialContents.markDirty !== false));
            // If we have initial contents, make sure to emit this
            // as the appropriate events to the outside.
            if (!!backup || this.initialContents) {
                this._onDidChangeContent.fire();
            }
        }
        async doCreateModel(contents) {
            this.trace('doCreateModel()');
            // Create model and dispose it when we get disposed
            this._model = this._register(await this.modelFactory.createModel(this.resource, contents, cancellation_1.CancellationToken.None));
            // Model listeners
            this.installModelListeners(this._model);
        }
        installModelListeners(model) {
            // Content Change
            this._register(model.onDidChangeContent(e => this.onModelContentChanged(e)));
            // Lifecycle
            this._register(model.onWillDispose(() => this.dispose()));
        }
        onModelContentChanged(e) {
            // Mark the untitled file working copy as non-dirty once its
            // in case provided by the change event and in case we do not
            // have an associated path set
            if (!this.hasAssociatedFilePath && e.isInitial) {
                this.setDirty(false);
            }
            // Turn dirty otherwise
            else {
                this.setDirty(true);
            }
            // Emit as general content change event
            this._onDidChangeContent.fire();
        }
        isResolved() {
            return !!this.model;
        }
        //#endregion
        //#region Backup
        async backup(token) {
            let content = undefined;
            // Make sure to check whether this working copy has been
            // resolved or not and fallback to the initial value -
            // if any - to prevent backing up an unresolved working
            // copy and loosing the initial value.
            if (this.isResolved()) {
                content = await (0, async_1.raceCancellation)(this.model.snapshot(token), token);
            }
            else if (this.initialContents) {
                content = this.initialContents.value;
            }
            return { content };
        }
        //#endregion
        //#region Save
        async save(options) {
            this.trace('save()');
            const result = await this.saveDelegate(this, options);
            // Emit Save Event
            if (result) {
                this._onDidSave.fire({ reason: options === null || options === void 0 ? void 0 : options.reason, source: options === null || options === void 0 ? void 0 : options.source });
            }
            return result;
        }
        //#endregion
        //#region Revert
        async revert() {
            this.trace('revert()');
            // No longer dirty
            this.setDirty(false);
            // Emit as event
            this._onDidRevert.fire();
            // A reverted untitled file working copy is invalid
            // because it has no actual source on disk to revert to.
            // As such we dispose the model.
            this.dispose();
        }
        //#endregion
        dispose() {
            this.trace('dispose()');
            this._onWillDispose.fire();
            super.dispose();
        }
        trace(msg) {
            this.logService.trace(`[untitled file working copy] ${msg}`, this.resource.toString(), this.typeId);
        }
    };
    UntitledFileWorkingCopy = __decorate([
        __param(7, workingCopyService_1.IWorkingCopyService),
        __param(8, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(9, log_1.ILogService)
    ], UntitledFileWorkingCopy);
    exports.UntitledFileWorkingCopy = UntitledFileWorkingCopy;
});
//# sourceMappingURL=untitledFileWorkingCopy.js.map