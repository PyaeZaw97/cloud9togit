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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/services/workingCopy/common/untitledFileWorkingCopy", "vs/base/common/event", "vs/base/common/network", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/platform/files/common/files", "vs/workbench/services/workingCopy/common/abstractFileWorkingCopyManager", "vs/base/common/map"], function (require, exports, lifecycle_1, uri_1, untitledFileWorkingCopy_1, event_1, network_1, workingCopyService_1, label_1, log_1, workingCopyBackup_1, files_1, abstractFileWorkingCopyManager_1, map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UntitledFileWorkingCopyManager = void 0;
    let UntitledFileWorkingCopyManager = class UntitledFileWorkingCopyManager extends abstractFileWorkingCopyManager_1.BaseFileWorkingCopyManager {
        constructor(workingCopyTypeId, modelFactory, saveDelegate, fileService, labelService, logService, workingCopyBackupService, workingCopyService) {
            super(fileService, logService, workingCopyBackupService);
            this.workingCopyTypeId = workingCopyTypeId;
            this.modelFactory = modelFactory;
            this.saveDelegate = saveDelegate;
            this.labelService = labelService;
            this.workingCopyService = workingCopyService;
            //#region Events
            this._onDidChangeDirty = this._register(new event_1.Emitter());
            this.onDidChangeDirty = this._onDidChangeDirty.event;
            this._onWillDispose = this._register(new event_1.Emitter());
            this.onWillDispose = this._onWillDispose.event;
            //#endregion
            this.mapResourceToWorkingCopyListeners = new map_1.ResourceMap();
        }
        async resolve(options) {
            const workingCopy = this.doCreateOrGet(options);
            await workingCopy.resolve();
            return workingCopy;
        }
        doCreateOrGet(options = Object.create(null)) {
            const massagedOptions = this.massageOptions(options);
            // Return existing instance if asked for it
            if (massagedOptions.untitledResource) {
                const existingWorkingCopy = this.get(massagedOptions.untitledResource);
                if (existingWorkingCopy) {
                    return existingWorkingCopy;
                }
            }
            // Create new instance otherwise
            return this.doCreate(massagedOptions);
        }
        massageOptions(options) {
            var _a;
            const massagedOptions = Object.create(null);
            // Handle associated resource
            if (options.associatedResource) {
                massagedOptions.untitledResource = uri_1.URI.from({
                    scheme: network_1.Schemas.untitled,
                    authority: options.associatedResource.authority,
                    fragment: options.associatedResource.fragment,
                    path: options.associatedResource.path,
                    query: options.associatedResource.query
                });
                massagedOptions.associatedResource = options.associatedResource;
            }
            // Handle untitled resource
            else if (((_a = options.untitledResource) === null || _a === void 0 ? void 0 : _a.scheme) === network_1.Schemas.untitled) {
                massagedOptions.untitledResource = options.untitledResource;
            }
            // Take over initial value
            massagedOptions.contents = options.contents;
            return massagedOptions;
        }
        doCreate(options) {
            // Create a new untitled resource if none is provided
            let untitledResource = options.untitledResource;
            if (!untitledResource) {
                let counter = 1;
                do {
                    untitledResource = uri_1.URI.from({
                        scheme: network_1.Schemas.untitled,
                        path: `Untitled-${counter}`,
                        query: this.workingCopyTypeId ?
                            `typeId=${this.workingCopyTypeId}` : // distinguish untitled resources among others by encoding the `typeId` as query param
                            undefined // keep untitled resources for text files as they are (when `typeId === ''`)
                    });
                    counter++;
                } while (this.has(untitledResource));
            }
            // Create new working copy with provided options
            const workingCopy = new untitledFileWorkingCopy_1.UntitledFileWorkingCopy(this.workingCopyTypeId, untitledResource, this.labelService.getUriBasenameLabel(untitledResource), !!options.associatedResource, options.contents, this.modelFactory, this.saveDelegate, this.workingCopyService, this.workingCopyBackupService, this.logService);
            // Register
            this.registerWorkingCopy(workingCopy);
            return workingCopy;
        }
        registerWorkingCopy(workingCopy) {
            // Install working copy listeners
            const workingCopyListeners = new lifecycle_1.DisposableStore();
            workingCopyListeners.add(workingCopy.onDidChangeDirty(() => this._onDidChangeDirty.fire(workingCopy)));
            workingCopyListeners.add(workingCopy.onWillDispose(() => this._onWillDispose.fire(workingCopy)));
            // Keep for disposal
            this.mapResourceToWorkingCopyListeners.set(workingCopy.resource, workingCopyListeners);
            // Add to cache
            this.add(workingCopy.resource, workingCopy);
            // If the working copy is dirty right from the beginning,
            // make sure to emit this as an event
            if (workingCopy.isDirty()) {
                this._onDidChangeDirty.fire(workingCopy);
            }
        }
        remove(resource) {
            const removed = super.remove(resource);
            // Dispose any exsting working copy listeners
            const workingCopyListener = this.mapResourceToWorkingCopyListeners.get(resource);
            if (workingCopyListener) {
                (0, lifecycle_1.dispose)(workingCopyListener);
                this.mapResourceToWorkingCopyListeners.delete(resource);
            }
            return removed;
        }
        //#endregion
        //#region Lifecycle
        dispose() {
            super.dispose();
            // Dispose the working copy change listeners
            (0, lifecycle_1.dispose)(this.mapResourceToWorkingCopyListeners.values());
            this.mapResourceToWorkingCopyListeners.clear();
        }
    };
    UntitledFileWorkingCopyManager = __decorate([
        __param(3, files_1.IFileService),
        __param(4, label_1.ILabelService),
        __param(5, log_1.ILogService),
        __param(6, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(7, workingCopyService_1.IWorkingCopyService)
    ], UntitledFileWorkingCopyManager);
    exports.UntitledFileWorkingCopyManager = UntitledFileWorkingCopyManager;
});
//# sourceMappingURL=untitledFileWorkingCopyManager.js.map