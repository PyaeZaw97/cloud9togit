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
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/workspaces/common/workspaces", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/platform/workspace/common/workspace", "vs/platform/log/common/log", "vs/base/common/lifecycle", "vs/workbench/services/workspaces/browser/workspaces", "vs/platform/files/common/files", "vs/workbench/services/environment/common/environmentService", "vs/base/common/resources", "vs/base/common/buffer", "vs/base/common/platform", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/network"], function (require, exports, extensions_1, workspaces_1, event_1, storage_1, workspace_1, log_1, lifecycle_1, workspaces_2, files_1, environmentService_1, resources_1, buffer_1, platform_1, uriIdentity_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWorkspacesService = void 0;
    let BrowserWorkspacesService = class BrowserWorkspacesService extends lifecycle_1.Disposable {
        constructor(storageService, contextService, logService, fileService, environmentService, uriIdentityService) {
            super();
            this.storageService = storageService;
            this.contextService = contextService;
            this.logService = logService;
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.uriIdentityService = uriIdentityService;
            this._onRecentlyOpenedChange = this._register(new event_1.Emitter());
            this.onDidChangeRecentlyOpened = this._onRecentlyOpenedChange.event;
            // Opening a workspace should push it as most
            // recently used to the workspaces history
            this.addWorkspaceToRecentlyOpened();
            this.registerListeners();
        }
        registerListeners() {
            // Storage
            this._register(this.storageService.onDidChangeValue(e => this.onDidChangeStorage(e)));
            // Workspace
            this._register(this.contextService.onDidChangeWorkspaceFolders(e => this.onDidChangeWorkspaceFolders(e)));
        }
        onDidChangeStorage(e) {
            if (e.key === BrowserWorkspacesService.RECENTLY_OPENED_KEY && e.scope === 0 /* StorageScope.GLOBAL */) {
                this._onRecentlyOpenedChange.fire();
            }
        }
        onDidChangeWorkspaceFolders(e) {
            if (!(0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace())) {
                return;
            }
            // When in a temporary workspace, make sure to track folder changes
            // in the history so that these can later be restored.
            for (const folder of e.added) {
                this.addRecentlyOpened([{ folderUri: folder.uri }]);
            }
        }
        addWorkspaceToRecentlyOpened() {
            const workspace = this.contextService.getWorkspace();
            const remoteAuthority = this.environmentService.remoteAuthority;
            switch (this.contextService.getWorkbenchState()) {
                case 2 /* WorkbenchState.FOLDER */:
                    this.addRecentlyOpened([{ folderUri: workspace.folders[0].uri, remoteAuthority }]);
                    break;
                case 3 /* WorkbenchState.WORKSPACE */:
                    this.addRecentlyOpened([{ workspace: { id: workspace.id, configPath: workspace.configuration }, remoteAuthority }]);
                    break;
            }
        }
        //#region Workspaces History
        async getRecentlyOpened() {
            const recentlyOpenedRaw = this.storageService.get(BrowserWorkspacesService.RECENTLY_OPENED_KEY, 0 /* StorageScope.GLOBAL */);
            if (recentlyOpenedRaw) {
                const recentlyOpened = (0, workspaces_1.restoreRecentlyOpened)(JSON.parse(recentlyOpenedRaw), this.logService);
                recentlyOpened.workspaces = recentlyOpened.workspaces.filter(recent => {
                    // In web, unless we are in a temporary workspace, we cannot support
                    // to switch to local folders because this would require a window
                    // reload and local file access only works with explicit user gesture
                    // from the current session.
                    if ((0, workspaces_1.isRecentFolder)(recent) && recent.folderUri.scheme === network_1.Schemas.file && !(0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace())) {
                        return false;
                    }
                    // Never offer temporary workspaces in the history
                    if ((0, workspaces_1.isRecentWorkspace)(recent) && (0, workspace_1.isTemporaryWorkspace)(recent.workspace.configPath)) {
                        return false;
                    }
                    return true;
                });
                return recentlyOpened;
            }
            return { workspaces: [], files: [] };
        }
        async addRecentlyOpened(recents) {
            const recentlyOpened = await this.getRecentlyOpened();
            for (const recent of recents) {
                if ((0, workspaces_1.isRecentFile)(recent)) {
                    this.doRemoveRecentlyOpened(recentlyOpened, [recent.fileUri]);
                    recentlyOpened.files.unshift(recent);
                }
                else if ((0, workspaces_1.isRecentFolder)(recent)) {
                    this.doRemoveRecentlyOpened(recentlyOpened, [recent.folderUri]);
                    recentlyOpened.workspaces.unshift(recent);
                }
                else {
                    this.doRemoveRecentlyOpened(recentlyOpened, [recent.workspace.configPath]);
                    recentlyOpened.workspaces.unshift(recent);
                }
            }
            return this.saveRecentlyOpened(recentlyOpened);
        }
        async removeRecentlyOpened(paths) {
            const recentlyOpened = await this.getRecentlyOpened();
            this.doRemoveRecentlyOpened(recentlyOpened, paths);
            return this.saveRecentlyOpened(recentlyOpened);
        }
        doRemoveRecentlyOpened(recentlyOpened, paths) {
            recentlyOpened.files = recentlyOpened.files.filter(file => {
                return !paths.some(path => path.toString() === file.fileUri.toString());
            });
            recentlyOpened.workspaces = recentlyOpened.workspaces.filter(workspace => {
                return !paths.some(path => path.toString() === ((0, workspaces_1.isRecentFolder)(workspace) ? workspace.folderUri.toString() : workspace.workspace.configPath.toString()));
            });
        }
        async saveRecentlyOpened(data) {
            return this.storageService.store(BrowserWorkspacesService.RECENTLY_OPENED_KEY, JSON.stringify((0, workspaces_1.toStoreData)(data)), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
        }
        async clearRecentlyOpened() {
            this.storageService.remove(BrowserWorkspacesService.RECENTLY_OPENED_KEY, 0 /* StorageScope.GLOBAL */);
        }
        //#endregion
        //#region Workspace Management
        async enterWorkspace(workspaceUri) {
            return { workspace: await this.getWorkspaceIdentifier(workspaceUri) };
        }
        async createUntitledWorkspace(folders, remoteAuthority) {
            const randomId = (Date.now() + Math.round(Math.random() * 1000)).toString();
            const newUntitledWorkspacePath = (0, resources_1.joinPath)(this.environmentService.untitledWorkspacesHome, `Untitled-${randomId}.${workspace_1.WORKSPACE_EXTENSION}`);
            // Build array of workspace folders to store
            const storedWorkspaceFolder = [];
            if (folders) {
                for (const folder of folders) {
                    storedWorkspaceFolder.push((0, workspaces_1.getStoredWorkspaceFolder)(folder.uri, true, folder.name, this.environmentService.untitledWorkspacesHome, !platform_1.isWindows, this.uriIdentityService.extUri));
                }
            }
            // Store at untitled workspaces location
            const storedWorkspace = { folders: storedWorkspaceFolder, remoteAuthority };
            await this.fileService.writeFile(newUntitledWorkspacePath, buffer_1.VSBuffer.fromString(JSON.stringify(storedWorkspace, null, '\t')));
            return this.getWorkspaceIdentifier(newUntitledWorkspacePath);
        }
        async deleteUntitledWorkspace(workspace) {
            try {
                await this.fileService.del(workspace.configPath);
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    throw error; // re-throw any other error than file not found which is OK
                }
            }
        }
        async getWorkspaceIdentifier(workspaceUri) {
            return (0, workspaces_2.getWorkspaceIdentifier)(workspaceUri);
        }
        //#endregion
        //#region Dirty Workspaces
        async getDirtyWorkspaces() {
            return []; // Currently not supported in web
        }
    };
    BrowserWorkspacesService.RECENTLY_OPENED_KEY = 'recently.opened';
    BrowserWorkspacesService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, log_1.ILogService),
        __param(3, files_1.IFileService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, uriIdentity_1.IUriIdentityService)
    ], BrowserWorkspacesService);
    exports.BrowserWorkspacesService = BrowserWorkspacesService;
    (0, extensions_1.registerSingleton)(workspaces_1.IWorkspacesService, BrowserWorkspacesService, true);
});
//# sourceMappingURL=workspacesService.js.map