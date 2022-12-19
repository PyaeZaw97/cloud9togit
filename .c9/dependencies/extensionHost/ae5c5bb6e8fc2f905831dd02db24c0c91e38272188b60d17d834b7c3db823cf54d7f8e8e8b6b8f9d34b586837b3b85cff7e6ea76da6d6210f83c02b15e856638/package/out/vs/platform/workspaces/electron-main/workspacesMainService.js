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
define(["require", "exports", "vs/platform/backup/electron-main/backup", "vs/platform/windows/electron-main/windows", "vs/platform/workspaces/electron-main/workspacesHistoryMainService", "vs/platform/workspaces/electron-main/workspacesManagementMainService"], function (require, exports, backup_1, windows_1, workspacesHistoryMainService_1, workspacesManagementMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspacesMainService = void 0;
    let WorkspacesMainService = class WorkspacesMainService {
        constructor(workspacesManagementMainService, windowsMainService, workspacesHistoryMainService, backupMainService) {
            this.workspacesManagementMainService = workspacesManagementMainService;
            this.windowsMainService = windowsMainService;
            this.workspacesHistoryMainService = workspacesHistoryMainService;
            this.backupMainService = backupMainService;
            //#endregion
            //#region Workspaces History
            this.onDidChangeRecentlyOpened = this.workspacesHistoryMainService.onDidChangeRecentlyOpened;
        }
        //#region Workspace Management
        async enterWorkspace(windowId, path) {
            const window = this.windowsMainService.getWindowById(windowId);
            if (window) {
                return this.workspacesManagementMainService.enterWorkspace(window, this.windowsMainService.getWindows(), path);
            }
            return undefined;
        }
        createUntitledWorkspace(windowId, folders, remoteAuthority) {
            return this.workspacesManagementMainService.createUntitledWorkspace(folders, remoteAuthority);
        }
        deleteUntitledWorkspace(windowId, workspace) {
            return this.workspacesManagementMainService.deleteUntitledWorkspace(workspace);
        }
        getWorkspaceIdentifier(windowId, workspacePath) {
            return this.workspacesManagementMainService.getWorkspaceIdentifier(workspacePath);
        }
        getRecentlyOpened(windowId) {
            return this.workspacesHistoryMainService.getRecentlyOpened(this.windowsMainService.getWindowById(windowId));
        }
        addRecentlyOpened(windowId, recents) {
            return this.workspacesHistoryMainService.addRecentlyOpened(recents);
        }
        removeRecentlyOpened(windowId, paths) {
            return this.workspacesHistoryMainService.removeRecentlyOpened(paths);
        }
        clearRecentlyOpened(windowId) {
            return this.workspacesHistoryMainService.clearRecentlyOpened();
        }
        //#endregion
        //#region Dirty Workspaces
        async getDirtyWorkspaces() {
            return this.backupMainService.getDirtyWorkspaces();
        }
    };
    WorkspacesMainService = __decorate([
        __param(0, workspacesManagementMainService_1.IWorkspacesManagementMainService),
        __param(1, windows_1.IWindowsMainService),
        __param(2, workspacesHistoryMainService_1.IWorkspacesHistoryMainService),
        __param(3, backup_1.IBackupMainService)
    ], WorkspacesMainService);
    exports.WorkspacesMainService = WorkspacesMainService;
});
//# sourceMappingURL=workspacesMainService.js.map