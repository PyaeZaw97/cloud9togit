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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/configuration/common/configuration", "vs/platform/undoRedo/common/undoRedo", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/common/editor", "vs/workbench/services/path/common/pathService", "vs/workbench/services/workingCopy/common/storedFileWorkingCopy", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/network", "vs/workbench/common/resources", "vs/platform/workspace/common/workspace", "vs/platform/files/common/files"], function (require, exports, nls_1, async_1, cancellation_1, lifecycle_1, map_1, configuration_1, undoRedo_1, uriIdentity_1, editor_1, pathService_1, storedFileWorkingCopy_1, workingCopyHistory_1, workingCopyService_1, network_1, resources_1, workspace_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkingCopyHistoryTracker = void 0;
    let WorkingCopyHistoryTracker = class WorkingCopyHistoryTracker extends lifecycle_1.Disposable {
        constructor(workingCopyService, workingCopyHistoryService, uriIdentityService, pathService, configurationService, undoRedoService, contextService, fileService) {
            super();
            this.workingCopyService = workingCopyService;
            this.workingCopyHistoryService = workingCopyHistoryService;
            this.uriIdentityService = uriIdentityService;
            this.pathService = pathService;
            this.configurationService = configurationService;
            this.undoRedoService = undoRedoService;
            this.contextService = contextService;
            this.fileService = fileService;
            this.limiter = this._register(new async_1.Limiter(workingCopyHistory_1.MAX_PARALLEL_HISTORY_IO_OPS));
            this.resourceExcludeMatcher = this._register(new async_1.IdleValue(() => {
                const matcher = this._register(new resources_1.ResourceGlobMatcher(root => this.configurationService.getValue(WorkingCopyHistoryTracker.SETTINGS.EXCLUDES, { resource: root }), event => event.affectsConfiguration(WorkingCopyHistoryTracker.SETTINGS.EXCLUDES), this.contextService, this.configurationService));
                return matcher;
            }));
            this.pendingAddHistoryEntryOperations = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            this.workingCopyContentVersion = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            this.historyEntryContentVersion = new map_1.ResourceMap(resource => this.uriIdentityService.extUri.getComparisonKey(resource));
            this.registerListeners();
        }
        registerListeners() {
            // File Events
            this._register(this.fileService.onDidRunOperation(e => this.onDidRunFileOperation(e)));
            // Working Copy Events
            this._register(this.workingCopyService.onDidChangeContent(workingCopy => this.onDidChangeContent(workingCopy)));
            this._register(this.workingCopyService.onDidSave(e => this.onDidSave(e)));
        }
        async onDidRunFileOperation(e) {
            if (!this.shouldTrackHistoryFromFileOperationEvent(e)) {
                return; // return early for working copies we are not interested in
            }
            const source = e.resource;
            const target = e.target.resource;
            // Move working copy history entries for this file move event
            const resources = await this.workingCopyHistoryService.moveEntries(source, target);
            // Make sure to track the content version of each entry that
            // was moved in our map. This ensures that a subsequent save
            // without a content change does not add a redundant entry
            // (https://github.com/microsoft/vscode/issues/145881)
            for (const resource of resources) {
                const contentVersion = this.getContentVersion(resource);
                this.historyEntryContentVersion.set(resource, contentVersion);
            }
        }
        onDidChangeContent(workingCopy) {
            // Increment content version ID for resource
            const contentVersionId = this.getContentVersion(workingCopy.resource);
            this.workingCopyContentVersion.set(workingCopy.resource, contentVersionId + 1);
        }
        getContentVersion(resource) {
            return this.workingCopyContentVersion.get(resource) || 0;
        }
        onDidSave(e) {
            var _a;
            if (!this.shouldTrackHistoryFromSaveEvent(e)) {
                return; // return early for working copies we are not interested in
            }
            const contentVersion = this.getContentVersion(e.workingCopy.resource);
            if (this.historyEntryContentVersion.get(e.workingCopy.resource) === contentVersion) {
                return; // return early when content version already has associated history entry
            }
            // Cancel any previous operation for this resource
            (_a = this.pendingAddHistoryEntryOperations.get(e.workingCopy.resource)) === null || _a === void 0 ? void 0 : _a.dispose(true);
            // Create new cancellation token support and remember
            const cts = new cancellation_1.CancellationTokenSource();
            this.pendingAddHistoryEntryOperations.set(e.workingCopy.resource, cts);
            // Queue new operation to add to history
            this.limiter.queue(async () => {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                const contentVersion = this.getContentVersion(e.workingCopy.resource);
                // Figure out source of save operation if not provided already
                let source = e.source;
                if (!e.source) {
                    source = this.resolveSourceFromUndoRedo(e);
                }
                // Add entry
                await this.workingCopyHistoryService.addEntry({ resource: e.workingCopy.resource, source, timestamp: e.stat.mtime }, cts.token);
                // Remember content version as being added to history
                this.historyEntryContentVersion.set(e.workingCopy.resource, contentVersion);
                if (cts.token.isCancellationRequested) {
                    return;
                }
                // Finally remove from pending operations
                this.pendingAddHistoryEntryOperations.delete(e.workingCopy.resource);
            });
        }
        resolveSourceFromUndoRedo(e) {
            const lastStackElement = this.undoRedoService.getLastElement(e.workingCopy.resource);
            if (lastStackElement) {
                if (lastStackElement.code === 'undoredo.textBufferEdit') {
                    return undefined; // ignore any unspecific stack element that resulted just from typing
                }
                return lastStackElement.label;
            }
            const allStackElements = this.undoRedoService.getElements(e.workingCopy.resource);
            if (allStackElements.future.length > 0 || allStackElements.past.length > 0) {
                return WorkingCopyHistoryTracker.UNDO_REDO_SAVE_SOURCE;
            }
            return undefined;
        }
        shouldTrackHistoryFromSaveEvent(e) {
            if (!(0, storedFileWorkingCopy_1.isStoredFileWorkingCopySaveEvent)(e)) {
                return false; // only support working copies that are backed by stored files
            }
            return this.shouldTrackHistory(e.workingCopy.resource, e.stat);
        }
        shouldTrackHistoryFromFileOperationEvent(e) {
            if (!e.isOperation(2 /* FileOperation.MOVE */)) {
                return false; // only interested in move operations
            }
            return this.shouldTrackHistory(e.target.resource, e.target);
        }
        shouldTrackHistory(resource, stat) {
            if (resource.scheme !== this.pathService.defaultUriScheme && // track history for all workspace resources
                resource.scheme !== network_1.Schemas.vscodeUserData // track history for all settings
            ) {
                return false; // do not support unknown resources
            }
            const configuredMaxFileSizeInBytes = 1024 * this.configurationService.getValue(WorkingCopyHistoryTracker.SETTINGS.SIZE_LIMIT, { resource });
            if (stat.size > configuredMaxFileSizeInBytes) {
                return false; // only track files that are not too large
            }
            if (this.configurationService.getValue(WorkingCopyHistoryTracker.SETTINGS.ENABLED, { resource }) === false) {
                return false; // do not track when history is disabled
            }
            // Finally check for exclude setting
            return !this.resourceExcludeMatcher.value.matches(resource);
        }
    };
    WorkingCopyHistoryTracker.SETTINGS = {
        ENABLED: 'workbench.localHistory.enabled',
        SIZE_LIMIT: 'workbench.localHistory.maxFileSize',
        EXCLUDES: 'workbench.localHistory.exclude'
    };
    WorkingCopyHistoryTracker.UNDO_REDO_SAVE_SOURCE = editor_1.SaveSourceRegistry.registerSource('undoRedo.source', (0, nls_1.localize)('undoRedo.source', "Undo / Redo"));
    WorkingCopyHistoryTracker = __decorate([
        __param(0, workingCopyService_1.IWorkingCopyService),
        __param(1, workingCopyHistory_1.IWorkingCopyHistoryService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, pathService_1.IPathService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, undoRedo_1.IUndoRedoService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, files_1.IFileService)
    ], WorkingCopyHistoryTracker);
    exports.WorkingCopyHistoryTracker = WorkingCopyHistoryTracker;
});
//# sourceMappingURL=workingCopyHistoryTracker.js.map