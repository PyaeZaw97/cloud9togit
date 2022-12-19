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
define(["require", "exports", "vs/base/parts/ipc/electron-main/ipcMain", "vs/base/common/cancellation", "vs/platform/instantiation/common/instantiation", "vs/platform/windows/electron-main/windows", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/electron-main/workspacesManagementMainService"], function (require, exports, ipcMain_1, cancellation_1, instantiation_1, windows_1, workspace_1, workspacesManagementMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiagnosticsMainService = exports.IDiagnosticsMainService = exports.ID = void 0;
    exports.ID = 'diagnosticsMainService';
    exports.IDiagnosticsMainService = (0, instantiation_1.createDecorator)(exports.ID);
    let DiagnosticsMainService = class DiagnosticsMainService {
        constructor(windowsMainService, workspacesManagementMainService) {
            this.windowsMainService = windowsMainService;
            this.workspacesManagementMainService = workspacesManagementMainService;
        }
        async getRemoteDiagnostics(options) {
            const windows = this.windowsMainService.getWindows();
            const diagnostics = await Promise.all(windows.map(window => {
                return new Promise((resolve) => {
                    const remoteAuthority = window.remoteAuthority;
                    if (remoteAuthority) {
                        const replyChannel = `vscode:getDiagnosticInfoResponse${window.id}`;
                        const args = {
                            includeProcesses: options.includeProcesses,
                            folders: options.includeWorkspaceMetadata ? this.getFolderURIs(window) : undefined
                        };
                        window.sendWhenReady('vscode:getDiagnosticInfo', cancellation_1.CancellationToken.None, { replyChannel, args });
                        ipcMain_1.validatedIpcMain.once(replyChannel, (_, data) => {
                            // No data is returned if getting the connection fails.
                            if (!data) {
                                resolve({ hostName: remoteAuthority, errorMessage: `Unable to resolve connection to '${remoteAuthority}'.` });
                            }
                            resolve(data);
                        });
                        setTimeout(() => {
                            resolve({ hostName: remoteAuthority, errorMessage: `Connection to '${remoteAuthority}' could not be established` });
                        }, 5000);
                    }
                    else {
                        resolve(undefined);
                    }
                });
            }));
            return diagnostics.filter((x) => !!x);
        }
        getFolderURIs(window) {
            const folderURIs = [];
            const workspace = window.openedWorkspace;
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspace)) {
                folderURIs.push(workspace.uri);
            }
            else if ((0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                const resolvedWorkspace = this.workspacesManagementMainService.resolveLocalWorkspaceSync(workspace.configPath); // workspace folders can only be shown for local (resolved) workspaces
                if (resolvedWorkspace) {
                    const rootFolders = resolvedWorkspace.folders;
                    rootFolders.forEach(root => {
                        folderURIs.push(root.uri);
                    });
                }
                else {
                    //TODO@RMacfarlane: can we add the workspace file here?
                }
            }
            return folderURIs;
        }
    };
    DiagnosticsMainService = __decorate([
        __param(0, windows_1.IWindowsMainService),
        __param(1, workspacesManagementMainService_1.IWorkspacesManagementMainService)
    ], DiagnosticsMainService);
    exports.DiagnosticsMainService = DiagnosticsMainService;
});
//# sourceMappingURL=diagnosticsMainService.js.map