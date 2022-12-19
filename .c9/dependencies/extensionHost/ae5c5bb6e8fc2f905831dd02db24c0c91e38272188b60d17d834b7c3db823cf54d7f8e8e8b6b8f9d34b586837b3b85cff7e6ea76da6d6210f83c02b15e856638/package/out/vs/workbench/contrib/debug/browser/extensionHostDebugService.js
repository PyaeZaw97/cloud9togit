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
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri", "vs/platform/debug/common/extensionHostDebug", "vs/platform/debug/common/extensionHostDebugIpc", "vs/platform/files/common/files", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/window/common/window", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/host/browser/host", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, event_1, uri_1, extensionHostDebug_1, extensionHostDebugIpc_1, files_1, extensions_1, log_1, storage_1, window_1, workspace_1, environmentService_1, host_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let BrowserExtensionHostDebugService = class BrowserExtensionHostDebugService extends extensionHostDebugIpc_1.ExtensionHostDebugChannelClient {
        constructor(remoteAgentService, environmentService, logService, hostService, contextService, storageService, fileService) {
            const connection = remoteAgentService.getConnection();
            let channel;
            if (connection) {
                channel = connection.getChannel(extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel.ChannelName);
            }
            else {
                // Extension host debugging not supported in serverless.
                channel = { call: async () => undefined, listen: () => event_1.Event.None };
            }
            super(channel);
            this.storageService = storageService;
            this.fileService = fileService;
            if (environmentService.options && environmentService.options.workspaceProvider) {
                this.workspaceProvider = environmentService.options.workspaceProvider;
            }
            else {
                this.workspaceProvider = { open: async () => true, workspace: undefined, trusted: undefined };
                logService.warn('Extension Host Debugging not available due to missing workspace provider.');
            }
            // Reload window on reload request
            this._register(this.onReload(event => {
                if (environmentService.isExtensionDevelopment && environmentService.debugExtensionHost.debugId === event.sessionId) {
                    hostService.reload();
                }
            }));
            // Close window on close request
            this._register(this.onClose(event => {
                if (environmentService.isExtensionDevelopment && environmentService.debugExtensionHost.debugId === event.sessionId) {
                    hostService.close();
                }
            }));
            // Remember workspace as last used for extension development
            // (unless this is API tests) to restore for a future session
            if (environmentService.isExtensionDevelopment && !environmentService.extensionTestsLocationURI) {
                const workspaceId = (0, workspace_1.toWorkspaceIdentifier)(contextService.getWorkspace());
                if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceId) || (0, workspace_1.isWorkspaceIdentifier)(workspaceId)) {
                    const serializedWorkspace = (0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceId) ? { folderUri: workspaceId.uri.toJSON() } : { workspaceUri: workspaceId.configPath.toJSON() };
                    storageService.store(BrowserExtensionHostDebugService.LAST_EXTENSION_DEVELOPMENT_WORKSPACE_KEY, JSON.stringify(serializedWorkspace), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                }
                else {
                    storageService.remove(BrowserExtensionHostDebugService.LAST_EXTENSION_DEVELOPMENT_WORKSPACE_KEY, 0 /* StorageScope.GLOBAL */);
                }
            }
        }
        async openExtensionDevelopmentHostWindow(args, _debugRenderer) {
            // Add environment parameters required for debug to work
            const environment = new Map();
            const fileUriArg = this.findArgument('file-uri', args);
            if (fileUriArg && !(0, workspace_1.hasWorkspaceFileExtension)(fileUriArg)) {
                environment.set('openFile', fileUriArg);
            }
            const copyArgs = [
                'extensionDevelopmentPath',
                'extensionTestsPath',
                'extensionEnvironment',
                'debugId',
                'inspect-brk-extensions',
                'inspect-extensions',
            ];
            for (const argName of copyArgs) {
                const value = this.findArgument(argName, args);
                if (value) {
                    environment.set(argName, value);
                }
            }
            // Find out which workspace to open debug window on
            let debugWorkspace = undefined;
            const folderUriArg = this.findArgument('folder-uri', args);
            if (folderUriArg) {
                debugWorkspace = { folderUri: uri_1.URI.parse(folderUriArg) };
            }
            else {
                const fileUriArg = this.findArgument('file-uri', args);
                if (fileUriArg && (0, workspace_1.hasWorkspaceFileExtension)(fileUriArg)) {
                    debugWorkspace = { workspaceUri: uri_1.URI.parse(fileUriArg) };
                }
            }
            const extensionTestsPath = this.findArgument('extensionTestsPath', args);
            if (!debugWorkspace && !extensionTestsPath) {
                const lastExtensionDevelopmentWorkspace = this.storageService.get(BrowserExtensionHostDebugService.LAST_EXTENSION_DEVELOPMENT_WORKSPACE_KEY, 0 /* StorageScope.GLOBAL */);
                if (lastExtensionDevelopmentWorkspace) {
                    try {
                        const serializedWorkspace = JSON.parse(lastExtensionDevelopmentWorkspace);
                        if (serializedWorkspace.workspaceUri) {
                            debugWorkspace = { workspaceUri: uri_1.URI.revive(serializedWorkspace.workspaceUri) };
                        }
                        else if (serializedWorkspace.folderUri) {
                            debugWorkspace = { folderUri: uri_1.URI.revive(serializedWorkspace.folderUri) };
                        }
                    }
                    catch (error) {
                        // ignore
                    }
                }
            }
            // Validate workspace exists
            if (debugWorkspace) {
                const debugWorkspaceResource = (0, window_1.isFolderToOpen)(debugWorkspace) ? debugWorkspace.folderUri : (0, window_1.isWorkspaceToOpen)(debugWorkspace) ? debugWorkspace.workspaceUri : undefined;
                if (debugWorkspaceResource) {
                    const workspaceExists = await this.fileService.exists(debugWorkspaceResource);
                    if (!workspaceExists) {
                        debugWorkspace = undefined;
                    }
                }
            }
            // Open debug window as new window. Pass arguments over.
            const success = await this.workspaceProvider.open(debugWorkspace, {
                reuse: false,
                payload: Array.from(environment.entries()) // mandatory properties to enable debugging
            });
            return { success };
        }
        findArgument(key, args) {
            for (const a of args) {
                const k = `--${key}=`;
                if (a.indexOf(k) === 0) {
                    return a.substring(k.length);
                }
            }
            return undefined;
        }
    };
    BrowserExtensionHostDebugService.LAST_EXTENSION_DEVELOPMENT_WORKSPACE_KEY = 'debug.lastExtensionDevelopmentWorkspace';
    BrowserExtensionHostDebugService = __decorate([
        __param(0, remoteAgentService_1.IRemoteAgentService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(2, log_1.ILogService),
        __param(3, host_1.IHostService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, storage_1.IStorageService),
        __param(6, files_1.IFileService)
    ], BrowserExtensionHostDebugService);
    (0, extensions_1.registerSingleton)(extensionHostDebug_1.IExtensionHostDebugService, BrowserExtensionHostDebugService, true);
});
//# sourceMappingURL=extensionHostDebugService.js.map