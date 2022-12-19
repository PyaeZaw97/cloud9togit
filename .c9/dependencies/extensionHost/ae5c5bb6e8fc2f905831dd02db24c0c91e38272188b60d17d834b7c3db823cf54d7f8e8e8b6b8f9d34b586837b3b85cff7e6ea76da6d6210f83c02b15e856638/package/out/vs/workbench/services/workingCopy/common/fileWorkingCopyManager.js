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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/workbench/common/editor", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/path/common/pathService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/workingCopy/common/storedFileWorkingCopyManager", "vs/workbench/services/workingCopy/common/untitledFileWorkingCopy", "vs/workbench/services/workingCopy/common/untitledFileWorkingCopyManager", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/files/common/elevatedFileService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/network", "vs/workbench/services/decorations/common/decorations", "vs/base/common/codicons", "vs/platform/theme/common/colorRegistry"], function (require, exports, nls_1, event_1, async_1, cancellation_1, lifecycle_1, resources_1, uri_1, dialogs_1, files_1, editor_1, environmentService_1, pathService_1, uriIdentity_1, storedFileWorkingCopyManager_1, untitledFileWorkingCopy_1, untitledFileWorkingCopyManager_1, workingCopyFileService_1, label_1, log_1, notification_1, editorService_1, elevatedFileService_1, filesConfigurationService_1, lifecycle_2, workingCopyBackup_1, workingCopyEditorService_1, workingCopyService_1, network_1, decorations_1, codicons_1, colorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileWorkingCopyManager = void 0;
    let FileWorkingCopyManager = class FileWorkingCopyManager extends lifecycle_1.Disposable {
        constructor(workingCopyTypeId, storedWorkingCopyModelFactory, untitledWorkingCopyModelFactory, fileService, lifecycleService, labelService, logService, workingCopyFileService, workingCopyBackupService, uriIdentityService, fileDialogService, filesConfigurationService, workingCopyService, notificationService, workingCopyEditorService, editorService, elevatedFileService, pathService, environmentService, dialogService, decorationsService) {
            super();
            this.workingCopyTypeId = workingCopyTypeId;
            this.storedWorkingCopyModelFactory = storedWorkingCopyModelFactory;
            this.untitledWorkingCopyModelFactory = untitledWorkingCopyModelFactory;
            this.fileService = fileService;
            this.workingCopyFileService = workingCopyFileService;
            this.uriIdentityService = uriIdentityService;
            this.fileDialogService = fileDialogService;
            this.pathService = pathService;
            this.environmentService = environmentService;
            this.dialogService = dialogService;
            this.decorationsService = decorationsService;
            // Stored file working copies manager
            this.stored = this._register(new storedFileWorkingCopyManager_1.StoredFileWorkingCopyManager(this.workingCopyTypeId, this.storedWorkingCopyModelFactory, fileService, lifecycleService, labelService, logService, workingCopyFileService, workingCopyBackupService, uriIdentityService, filesConfigurationService, workingCopyService, notificationService, workingCopyEditorService, editorService, elevatedFileService));
            // Untitled file working copies manager
            this.untitled = this._register(new untitledFileWorkingCopyManager_1.UntitledFileWorkingCopyManager(this.workingCopyTypeId, this.untitledWorkingCopyModelFactory, async (workingCopy, options) => {
                const result = await this.saveAs(workingCopy.resource, undefined, options);
                return result ? true : false;
            }, fileService, labelService, logService, workingCopyBackupService, workingCopyService));
            // Events
            this.onDidCreate = event_1.Event.any(this.stored.onDidCreate, this.untitled.onDidCreate);
            // Decorations
            this.provideDecorations();
        }
        //#region decorations
        provideDecorations() {
            // File working copy decorations
            this.decorationsService.registerDecorationsProvider(new class extends lifecycle_1.Disposable {
                constructor(stored) {
                    super();
                    this.stored = stored;
                    this.label = (0, nls_1.localize)('fileWorkingCopyDecorations', "File Working Copy Decorations");
                    this._onDidChange = this._register(new event_1.Emitter());
                    this.onDidChange = this._onDidChange.event;
                    this.registerListeners();
                }
                registerListeners() {
                    // Creates
                    this._register(this.stored.onDidResolve(workingCopy => {
                        if (workingCopy.isReadonly() || workingCopy.hasState(4 /* StoredFileWorkingCopyState.ORPHAN */)) {
                            this._onDidChange.fire([workingCopy.resource]);
                        }
                    }));
                    // Removals: once a stored working copy is no longer
                    // under our control, make sure to signal this as
                    // decoration change because from this point on we
                    // have no way of updating the decoration anymore.
                    this._register(this.stored.onDidRemove(workingCopyUri => this._onDidChange.fire([workingCopyUri])));
                    // Changes
                    this._register(this.stored.onDidChangeReadonly(workingCopy => this._onDidChange.fire([workingCopy.resource])));
                    this._register(this.stored.onDidChangeOrphaned(workingCopy => this._onDidChange.fire([workingCopy.resource])));
                }
                provideDecorations(uri) {
                    const workingCopy = this.stored.get(uri);
                    if (!workingCopy || workingCopy.isDisposed()) {
                        return undefined;
                    }
                    const isReadonly = workingCopy.isReadonly();
                    const isOrphaned = workingCopy.hasState(4 /* StoredFileWorkingCopyState.ORPHAN */);
                    // Readonly + Orphaned
                    if (isReadonly && isOrphaned) {
                        return {
                            color: colorRegistry_1.listErrorForeground,
                            letter: codicons_1.Codicon.lockSmall,
                            strikethrough: true,
                            tooltip: (0, nls_1.localize)('readonlyAndDeleted', "Deleted, Read Only"),
                        };
                    }
                    // Readonly
                    else if (isReadonly) {
                        return {
                            letter: codicons_1.Codicon.lockSmall,
                            tooltip: (0, nls_1.localize)('readonly', "Read Only"),
                        };
                    }
                    // Orphaned
                    else if (isOrphaned) {
                        return {
                            color: colorRegistry_1.listErrorForeground,
                            strikethrough: true,
                            tooltip: (0, nls_1.localize)('deleted', "Deleted"),
                        };
                    }
                    return undefined;
                }
            }(this.stored));
        }
        //#endregin
        //#region get / get all
        get workingCopies() {
            return [...this.stored.workingCopies, ...this.untitled.workingCopies];
        }
        get(resource) {
            var _a;
            return (_a = this.stored.get(resource)) !== null && _a !== void 0 ? _a : this.untitled.get(resource);
        }
        resolve(arg1, arg2) {
            if (uri_1.URI.isUri(arg1)) {
                // Untitled: via untitled manager
                if (arg1.scheme === network_1.Schemas.untitled) {
                    return this.untitled.resolve({ untitledResource: arg1 });
                }
                // else: via stored file manager
                else {
                    return this.stored.resolve(arg1, arg2);
                }
            }
            return this.untitled.resolve(arg1);
        }
        //#endregion
        //#region Save
        async saveAs(source, target, options) {
            var _a, _b;
            // Get to target resource
            if (!target) {
                const workingCopy = this.get(source);
                if (workingCopy instanceof untitledFileWorkingCopy_1.UntitledFileWorkingCopy && workingCopy.hasAssociatedFilePath) {
                    target = await this.suggestSavePath(source);
                }
                else {
                    target = await this.fileDialogService.pickFileToSave(await this.suggestSavePath((_a = options === null || options === void 0 ? void 0 : options.suggestedTarget) !== null && _a !== void 0 ? _a : source), options === null || options === void 0 ? void 0 : options.availableFileSystems);
                }
            }
            if (!target) {
                return; // user canceled
            }
            // Just save if target is same as working copies own resource
            // and we are not saving an untitled file working copy
            if (this.fileService.hasProvider(source) && (0, resources_1.isEqual)(source, target)) {
                return this.doSave(source, Object.assign(Object.assign({}, options), { force: true /* force to save, even if not dirty (https://github.com/microsoft/vscode/issues/99619) */ }));
            }
            // If the target is different but of same identity, we
            // move the source to the target, knowing that the
            // underlying file system cannot have both and then save.
            // However, this will only work if the source exists
            // and is not orphaned, so we need to check that too.
            if (this.fileService.hasProvider(source) && this.uriIdentityService.extUri.isEqual(source, target) && (await this.fileService.exists(source))) {
                // Move via working copy file service to enable participants
                await this.workingCopyFileService.move([{ file: { source, target } }], cancellation_1.CancellationToken.None);
                // At this point we don't know whether we have a
                // working copy for the source or the target URI so we
                // simply try to save with both resources.
                return (_b = (await this.doSave(source, options))) !== null && _b !== void 0 ? _b : (await this.doSave(target, options));
            }
            // Perform normal "Save As"
            return this.doSaveAs(source, target, options);
        }
        async doSave(resource, options) {
            // Save is only possible with stored file working copies,
            // any other have to go via `saveAs` flow.
            const storedFileWorkingCopy = this.stored.get(resource);
            if (storedFileWorkingCopy) {
                const success = await storedFileWorkingCopy.save(options);
                if (success) {
                    return storedFileWorkingCopy;
                }
            }
            return undefined;
        }
        async doSaveAs(source, target, options) {
            var _a;
            let sourceContents;
            // If the source is an existing file working copy, we can directly
            // use that to copy the contents to the target destination
            const sourceWorkingCopy = this.get(source);
            if (sourceWorkingCopy === null || sourceWorkingCopy === void 0 ? void 0 : sourceWorkingCopy.isResolved()) {
                sourceContents = await sourceWorkingCopy.model.snapshot(cancellation_1.CancellationToken.None);
            }
            // Otherwise we resolve the contents from the underlying file
            else {
                sourceContents = (await this.fileService.readFileStream(source)).value;
            }
            // Resolve target
            const { targetFileExists, targetStoredFileWorkingCopy } = await this.doResolveSaveTarget(source, target);
            // Confirm to overwrite if we have an untitled file working copy with associated path where
            // the file actually exists on disk and we are instructed to save to that file path.
            // This can happen if the file was created after the untitled file was opened.
            // See https://github.com/microsoft/vscode/issues/67946
            if (sourceWorkingCopy instanceof untitledFileWorkingCopy_1.UntitledFileWorkingCopy &&
                sourceWorkingCopy.hasAssociatedFilePath &&
                targetFileExists &&
                this.uriIdentityService.extUri.isEqual(target, (0, resources_1.toLocalResource)(sourceWorkingCopy.resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme))) {
                const overwrite = await this.confirmOverwrite(target);
                if (!overwrite) {
                    return undefined;
                }
            }
            // Take over content from source to target
            await ((_a = targetStoredFileWorkingCopy.model) === null || _a === void 0 ? void 0 : _a.update(sourceContents, cancellation_1.CancellationToken.None));
            // Set source options depending on target exists or not
            if (!(options === null || options === void 0 ? void 0 : options.source)) {
                options = Object.assign(Object.assign({}, options), { source: targetFileExists ? FileWorkingCopyManager.FILE_WORKING_COPY_SAVE_REPLACE_SOURCE : FileWorkingCopyManager.FILE_WORKING_COPY_SAVE_CREATE_SOURCE });
            }
            // Save target
            const success = await targetStoredFileWorkingCopy.save(Object.assign(Object.assign({}, options), { force: true /* force to save, even if not dirty (https://github.com/microsoft/vscode/issues/99619) */ }));
            if (!success) {
                return undefined;
            }
            // Revert the source
            await (sourceWorkingCopy === null || sourceWorkingCopy === void 0 ? void 0 : sourceWorkingCopy.revert());
            return targetStoredFileWorkingCopy;
        }
        async doResolveSaveTarget(source, target) {
            // Prefer an existing stored file working copy if it is already resolved
            // for the given target resource
            let targetFileExists = false;
            let targetStoredFileWorkingCopy = this.stored.get(target);
            if (targetStoredFileWorkingCopy === null || targetStoredFileWorkingCopy === void 0 ? void 0 : targetStoredFileWorkingCopy.isResolved()) {
                targetFileExists = true;
            }
            // Otherwise create the target working copy empty if
            // it does not exist already and resolve it from there
            else {
                targetFileExists = await this.fileService.exists(target);
                // Create target file adhoc if it does not exist yet
                if (!targetFileExists) {
                    await this.workingCopyFileService.create([{ resource: target }], cancellation_1.CancellationToken.None);
                }
                // At this point we need to resolve the target working copy
                // and we have to do an explicit check if the source URI
                // equals the target via URI identity. If they match and we
                // have had an existing working copy with the source, we
                // prefer that one over resolving the target. Otherwise we
                // would potentially introduce a
                if (this.uriIdentityService.extUri.isEqual(source, target) && this.get(source)) {
                    targetStoredFileWorkingCopy = await this.stored.resolve(source);
                }
                else {
                    targetStoredFileWorkingCopy = await this.stored.resolve(target);
                }
            }
            return { targetFileExists, targetStoredFileWorkingCopy };
        }
        async confirmOverwrite(resource) {
            const confirm = {
                message: (0, nls_1.localize)('confirmOverwrite', "'{0}' already exists. Do you want to replace it?", (0, resources_1.basename)(resource)),
                detail: (0, nls_1.localize)('irreversible', "A file or folder with the name '{0}' already exists in the folder '{1}'. Replacing it will overwrite its current contents.", (0, resources_1.basename)(resource), (0, resources_1.basename)((0, resources_1.dirname)(resource))),
                primaryButton: (0, nls_1.localize)({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
                type: 'warning'
            };
            const result = await this.dialogService.confirm(confirm);
            return result.confirmed;
        }
        async suggestSavePath(resource) {
            // 1.) Just take the resource as is if the file service can handle it
            if (this.fileService.hasProvider(resource)) {
                return resource;
            }
            // 2.) Pick the associated file path for untitled working copies if any
            const workingCopy = this.get(resource);
            if (workingCopy instanceof untitledFileWorkingCopy_1.UntitledFileWorkingCopy && workingCopy.hasAssociatedFilePath) {
                return (0, resources_1.toLocalResource)(resource, this.environmentService.remoteAuthority, this.pathService.defaultUriScheme);
            }
            const defaultFilePath = await this.fileDialogService.defaultFilePath();
            // 3.) Pick the working copy name if valid joined with default path
            if (workingCopy) {
                const candidatePath = (0, resources_1.joinPath)(defaultFilePath, workingCopy.name);
                if (await this.pathService.hasValidBasename(candidatePath, workingCopy.name)) {
                    return candidatePath;
                }
            }
            // 4.) Finally fallback to the name of the resource joined with default path
            return (0, resources_1.joinPath)(defaultFilePath, (0, resources_1.basename)(resource));
        }
        //#endregion
        //#region Lifecycle
        async destroy() {
            await async_1.Promises.settled([
                this.stored.destroy(),
                this.untitled.destroy()
            ]);
        }
    };
    FileWorkingCopyManager.FILE_WORKING_COPY_SAVE_CREATE_SOURCE = editor_1.SaveSourceRegistry.registerSource('fileWorkingCopyCreate.source', (0, nls_1.localize)('fileWorkingCopyCreate.source', "File Created"));
    FileWorkingCopyManager.FILE_WORKING_COPY_SAVE_REPLACE_SOURCE = editor_1.SaveSourceRegistry.registerSource('fileWorkingCopyReplace.source', (0, nls_1.localize)('fileWorkingCopyReplace.source', "File Replaced"));
    FileWorkingCopyManager = __decorate([
        __param(3, files_1.IFileService),
        __param(4, lifecycle_2.ILifecycleService),
        __param(5, label_1.ILabelService),
        __param(6, log_1.ILogService),
        __param(7, workingCopyFileService_1.IWorkingCopyFileService),
        __param(8, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(9, uriIdentity_1.IUriIdentityService),
        __param(10, dialogs_1.IFileDialogService),
        __param(11, filesConfigurationService_1.IFilesConfigurationService),
        __param(12, workingCopyService_1.IWorkingCopyService),
        __param(13, notification_1.INotificationService),
        __param(14, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(15, editorService_1.IEditorService),
        __param(16, elevatedFileService_1.IElevatedFileService),
        __param(17, pathService_1.IPathService),
        __param(18, environmentService_1.IWorkbenchEnvironmentService),
        __param(19, dialogs_1.IDialogService),
        __param(20, decorations_1.IDecorationsService)
    ], FileWorkingCopyManager);
    exports.FileWorkingCopyManager = FileWorkingCopyManager;
});
//# sourceMappingURL=fileWorkingCopyManager.js.map