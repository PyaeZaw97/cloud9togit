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
define(["require", "exports", "electron", "fs", "vs/base/common/event", "vs/base/common/json", "vs/base/common/labels", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/types", "vs/base/node/pfs", "vs/nls", "vs/platform/backup/electron-main/backup", "vs/platform/dialogs/electron-main/dialogMainService", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/windows/electron-main/windowsFinder", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/platform/workspaces/electron-main/workspaces"], function (require, exports, electron_1, fs_1, event_1, json_1, labels_1, lifecycle_1, network_1, path_1, platform_1, resources_1, types_1, pfs_1, nls_1, backup_1, dialogMainService_1, environmentMainService_1, instantiation_1, log_1, productService_1, windowsFinder_1, workspace_1, workspaces_1, workspaces_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspacesManagementMainService = exports.IWorkspacesManagementMainService = void 0;
    exports.IWorkspacesManagementMainService = (0, instantiation_1.createDecorator)('workspacesManagementMainService');
    let WorkspacesManagementMainService = class WorkspacesManagementMainService extends lifecycle_1.Disposable {
        constructor(environmentMainService, logService, backupMainService, dialogMainService, productService) {
            super();
            this.environmentMainService = environmentMainService;
            this.logService = logService;
            this.backupMainService = backupMainService;
            this.dialogMainService = dialogMainService;
            this.productService = productService;
            this.untitledWorkspacesHome = this.environmentMainService.untitledWorkspacesHome; // local URI that contains all untitled workspaces
            this._onDidDeleteUntitledWorkspace = this._register(new event_1.Emitter());
            this.onDidDeleteUntitledWorkspace = this._onDidDeleteUntitledWorkspace.event;
            this._onDidEnterWorkspace = this._register(new event_1.Emitter());
            this.onDidEnterWorkspace = this._onDidEnterWorkspace.event;
        }
        resolveLocalWorkspaceSync(uri) {
            return this.doResolveLocalWorkspace(uri, path => (0, fs_1.readFileSync)(path, 'utf8'));
        }
        resolveLocalWorkspace(uri) {
            return this.doResolveLocalWorkspace(uri, path => pfs_1.Promises.readFile(path, 'utf8'));
        }
        doResolveLocalWorkspace(uri, contentsFn) {
            if (!this.isWorkspacePath(uri)) {
                return undefined; // does not look like a valid workspace config file
            }
            if (uri.scheme !== network_1.Schemas.file) {
                return undefined;
            }
            try {
                const contents = contentsFn(uri.fsPath);
                if (contents instanceof Promise) {
                    return contents.then(value => this.doResolveWorkspace(uri, value), error => undefined /* invalid workspace */);
                }
                else {
                    return this.doResolveWorkspace(uri, contents);
                }
            }
            catch (_a) {
                return undefined; // invalid workspace
            }
        }
        isWorkspacePath(uri) {
            return (0, workspace_1.isUntitledWorkspace)(uri, this.environmentMainService) || (0, workspace_1.hasWorkspaceFileExtension)(uri);
        }
        doResolveWorkspace(path, contents) {
            try {
                const workspace = this.doParseStoredWorkspace(path, contents);
                const workspaceIdentifier = (0, workspaces_2.getWorkspaceIdentifier)(path);
                return {
                    id: workspaceIdentifier.id,
                    configPath: workspaceIdentifier.configPath,
                    folders: (0, workspaces_1.toWorkspaceFolders)(workspace.folders, workspaceIdentifier.configPath, resources_1.extUriBiasedIgnorePathCase),
                    remoteAuthority: workspace.remoteAuthority,
                    transient: workspace.transient
                };
            }
            catch (error) {
                this.logService.warn(error.toString());
            }
            return undefined;
        }
        doParseStoredWorkspace(path, contents) {
            // Parse workspace file
            const storedWorkspace = (0, json_1.parse)(contents); // use fault tolerant parser
            // Filter out folders which do not have a path or uri set
            if (storedWorkspace && Array.isArray(storedWorkspace.folders)) {
                storedWorkspace.folders = storedWorkspace.folders.filter(folder => (0, workspaces_1.isStoredWorkspaceFolder)(folder));
            }
            else {
                throw new Error(`${path.toString(true)} looks like an invalid workspace file.`);
            }
            return storedWorkspace;
        }
        async createUntitledWorkspace(folders, remoteAuthority) {
            const { workspace, storedWorkspace } = this.newUntitledWorkspace(folders, remoteAuthority);
            const configPath = workspace.configPath.fsPath;
            await pfs_1.Promises.mkdir((0, path_1.dirname)(configPath), { recursive: true });
            await pfs_1.Promises.writeFile(configPath, JSON.stringify(storedWorkspace, null, '\t'));
            return workspace;
        }
        createUntitledWorkspaceSync(folders, remoteAuthority) {
            const { workspace, storedWorkspace } = this.newUntitledWorkspace(folders, remoteAuthority);
            const configPath = workspace.configPath.fsPath;
            (0, fs_1.mkdirSync)((0, path_1.dirname)(configPath), { recursive: true });
            (0, pfs_1.writeFileSync)(configPath, JSON.stringify(storedWorkspace, null, '\t'));
            return workspace;
        }
        newUntitledWorkspace(folders = [], remoteAuthority) {
            const randomId = (Date.now() + Math.round(Math.random() * 1000)).toString();
            const untitledWorkspaceConfigFolder = (0, resources_1.joinPath)(this.untitledWorkspacesHome, randomId);
            const untitledWorkspaceConfigPath = (0, resources_1.joinPath)(untitledWorkspaceConfigFolder, workspace_1.UNTITLED_WORKSPACE_NAME);
            const storedWorkspaceFolder = [];
            for (const folder of folders) {
                storedWorkspaceFolder.push((0, workspaces_1.getStoredWorkspaceFolder)(folder.uri, true, folder.name, untitledWorkspaceConfigFolder, !platform_1.isWindows, resources_1.extUriBiasedIgnorePathCase));
            }
            return {
                workspace: (0, workspaces_2.getWorkspaceIdentifier)(untitledWorkspaceConfigPath),
                storedWorkspace: { folders: storedWorkspaceFolder, remoteAuthority }
            };
        }
        async getWorkspaceIdentifier(configPath) {
            return (0, workspaces_2.getWorkspaceIdentifier)(configPath);
        }
        isUntitledWorkspace(workspace) {
            return (0, workspace_1.isUntitledWorkspace)(workspace.configPath, this.environmentMainService);
        }
        deleteUntitledWorkspaceSync(workspace) {
            if (!this.isUntitledWorkspace(workspace)) {
                return; // only supported for untitled workspaces
            }
            // Delete from disk
            this.doDeleteUntitledWorkspaceSync(workspace);
            // Event
            this._onDidDeleteUntitledWorkspace.fire(workspace);
        }
        async deleteUntitledWorkspace(workspace) {
            this.deleteUntitledWorkspaceSync(workspace);
        }
        doDeleteUntitledWorkspaceSync(workspace) {
            const configPath = (0, resources_1.originalFSPath)(workspace.configPath);
            try {
                // Delete Workspace
                (0, pfs_1.rimrafSync)((0, path_1.dirname)(configPath));
                // Mark Workspace Storage to be deleted
                const workspaceStoragePath = (0, path_1.join)(this.environmentMainService.workspaceStorageHome.fsPath, workspace.id);
                if ((0, fs_1.existsSync)(workspaceStoragePath)) {
                    (0, pfs_1.writeFileSync)((0, path_1.join)(workspaceStoragePath, 'obsolete'), '');
                }
            }
            catch (error) {
                this.logService.warn(`Unable to delete untitled workspace ${configPath} (${error}).`);
            }
        }
        getUntitledWorkspacesSync() {
            const untitledWorkspaces = [];
            try {
                const untitledWorkspacePaths = (0, pfs_1.readdirSync)(this.untitledWorkspacesHome.fsPath).map(folder => (0, resources_1.joinPath)(this.untitledWorkspacesHome, folder, workspace_1.UNTITLED_WORKSPACE_NAME));
                for (const untitledWorkspacePath of untitledWorkspacePaths) {
                    const workspace = (0, workspaces_2.getWorkspaceIdentifier)(untitledWorkspacePath);
                    const resolvedWorkspace = this.resolveLocalWorkspaceSync(untitledWorkspacePath);
                    if (!resolvedWorkspace) {
                        this.doDeleteUntitledWorkspaceSync(workspace);
                    }
                    else {
                        untitledWorkspaces.push({ workspace, remoteAuthority: resolvedWorkspace.remoteAuthority });
                    }
                }
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    this.logService.warn(`Unable to read folders in ${this.untitledWorkspacesHome} (${error}).`);
                }
            }
            return untitledWorkspaces;
        }
        async enterWorkspace(window, windows, path) {
            if (!window || !window.win || !window.isReady) {
                return undefined; // return early if the window is not ready or disposed
            }
            const isValid = await this.isValidTargetWorkspacePath(window, windows, path);
            if (!isValid) {
                return undefined; // return early if the workspace is not valid
            }
            const result = this.doEnterWorkspace(window, (0, workspaces_2.getWorkspaceIdentifier)(path));
            if (!result) {
                return undefined;
            }
            // Emit as event
            this._onDidEnterWorkspace.fire({ window, workspace: result.workspace });
            return result;
        }
        async isValidTargetWorkspacePath(window, windows, workspacePath) {
            if (!workspacePath) {
                return true;
            }
            if ((0, workspace_1.isWorkspaceIdentifier)(window.openedWorkspace) && resources_1.extUriBiasedIgnorePathCase.isEqual(window.openedWorkspace.configPath, workspacePath)) {
                return false; // window is already opened on a workspace with that path
            }
            // Prevent overwriting a workspace that is currently opened in another window
            if ((0, windowsFinder_1.findWindowOnWorkspaceOrFolder)(windows, workspacePath)) {
                const options = {
                    title: this.productService.nameLong,
                    type: 'info',
                    buttons: [(0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)({ key: 'ok', comment: ['&& denotes a mnemonic'] }, "&&OK"))],
                    message: (0, nls_1.localize)('workspaceOpenedMessage', "Unable to save workspace '{0}'", (0, resources_1.basename)(workspacePath)),
                    detail: (0, nls_1.localize)('workspaceOpenedDetail', "The workspace is already opened in another window. Please close that window first and then try again."),
                    noLink: true,
                    defaultId: 0
                };
                await this.dialogMainService.showMessageBox(options, (0, types_1.withNullAsUndefined)(electron_1.BrowserWindow.getFocusedWindow()));
                return false;
            }
            return true; // OK
        }
        doEnterWorkspace(window, workspace) {
            if (!window.config) {
                return undefined;
            }
            window.focus();
            // Register window for backups and migrate current backups over
            let backupPath;
            if (!window.config.extensionDevelopmentPath) {
                backupPath = this.backupMainService.registerWorkspaceBackupSync({ workspace, remoteAuthority: window.remoteAuthority }, window.config.backupPath);
            }
            // if the window was opened on an untitled workspace, delete it.
            if ((0, workspace_1.isWorkspaceIdentifier)(window.openedWorkspace) && this.isUntitledWorkspace(window.openedWorkspace)) {
                this.deleteUntitledWorkspaceSync(window.openedWorkspace);
            }
            // Update window configuration properly based on transition to workspace
            window.config.workspace = workspace;
            window.config.backupPath = backupPath;
            return { workspace, backupPath };
        }
    };
    WorkspacesManagementMainService = __decorate([
        __param(0, environmentMainService_1.IEnvironmentMainService),
        __param(1, log_1.ILogService),
        __param(2, backup_1.IBackupMainService),
        __param(3, dialogMainService_1.IDialogMainService),
        __param(4, productService_1.IProductService)
    ], WorkspacesManagementMainService);
    exports.WorkspacesManagementMainService = WorkspacesManagementMainService;
});
//# sourceMappingURL=workspacesManagementMainService.js.map