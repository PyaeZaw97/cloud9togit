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
define(["require", "exports", "electron", "vs/base/parts/ipc/electron-main/ipcMain", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/environment/common/environment", "vs/platform/log/common/log"], function (require, exports, electron_1, ipcMain_1, lifecycle_1, map_1, network_1, path_1, platform_1, uri_1, uuid_1, environment_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProtocolMainService = void 0;
    let ProtocolMainService = class ProtocolMainService extends lifecycle_1.Disposable {
        constructor(environmentService, logService) {
            super();
            this.logService = logService;
            this.validRoots = map_1.TernarySearchTree.forPaths(!platform_1.isLinux);
            this.validExtensions = new Set(['.svg', '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']); // https://github.com/microsoft/vscode/issues/119384
            // Define an initial set of roots we allow loading from
            // - appRoot	: all files installed as part of the app
            // - extensions : all files shipped from extensions
            // - storage    : all files in global and workspace storage (https://github.com/microsoft/vscode/issues/116735)
            this.addValidFileRoot(environmentService.appRoot);
            this.addValidFileRoot(environmentService.extensionsPath);
            this.addValidFileRoot(environmentService.globalStorageHome.fsPath);
            this.addValidFileRoot(environmentService.workspaceStorageHome.fsPath);
            // Handle protocols
            this.handleProtocols();
        }
        handleProtocols() {
            const { defaultSession } = electron_1.session;
            // Register vscode-file:// handler
            defaultSession.protocol.registerFileProtocol(network_1.Schemas.vscodeFileResource, (request, callback) => this.handleResourceRequest(request, callback));
            // Block any file:// access
            defaultSession.protocol.interceptFileProtocol(network_1.Schemas.file, (request, callback) => this.handleFileRequest(request, callback));
            // Cleanup
            this._register((0, lifecycle_1.toDisposable)(() => {
                defaultSession.protocol.unregisterProtocol(network_1.Schemas.vscodeFileResource);
                defaultSession.protocol.uninterceptProtocol(network_1.Schemas.file);
            }));
        }
        addValidFileRoot(root) {
            // Pass to `normalize` because we later also do the
            // same for all paths to check against.
            const normalizedRoot = (0, path_1.normalize)(root);
            if (!this.validRoots.get(normalizedRoot)) {
                this.validRoots.set(normalizedRoot, true);
                return (0, lifecycle_1.toDisposable)(() => this.validRoots.delete(normalizedRoot));
            }
            return lifecycle_1.Disposable.None;
        }
        //#region file://
        handleFileRequest(request, callback) {
            const uri = uri_1.URI.parse(request.url);
            this.logService.error(`Refused to load resource ${uri.fsPath} from ${network_1.Schemas.file}: protocol (original URL: ${request.url})`);
            return callback({ error: -3 /* ABORTED */ });
        }
        //#endregion
        //#region vscode-file://
        handleResourceRequest(request, callback) {
            const path = this.requestToNormalizedFilePath(request);
            // first check by validRoots
            if (this.validRoots.findSubstr(path)) {
                return callback({ path });
            }
            // then check by validExtensions
            if (this.validExtensions.has((0, path_1.extname)(path))) {
                return callback({ path });
            }
            // finally block to load the resource
            this.logService.error(`${network_1.Schemas.vscodeFileResource}: Refused to load resource ${path} from ${network_1.Schemas.vscodeFileResource}: protocol (original URL: ${request.url})`);
            return callback({ error: -3 /* ABORTED */ });
        }
        requestToNormalizedFilePath(request) {
            // 1.) Use `URI.parse()` util from us to convert the raw
            //     URL into our URI.
            const requestUri = uri_1.URI.parse(request.url);
            // 2.) Use `FileAccess.asFileUri` to convert back from a
            //     `vscode-file:` URI to a `file:` URI.
            const unnormalizedFileUri = network_1.FileAccess.asFileUri(requestUri);
            // 3.) Strip anything from the URI that could result in
            //     relative paths (such as "..") by using `normalize`
            return (0, path_1.normalize)(unnormalizedFileUri.fsPath);
        }
        //#endregion
        //#region IPC Object URLs
        createIPCObjectUrl() {
            let obj = undefined;
            // Create unique URI
            const resource = uri_1.URI.from({
                scheme: 'vscode',
                path: (0, uuid_1.generateUuid)()
            });
            // Install IPC handler
            const channel = resource.toString();
            const handler = async () => obj;
            ipcMain_1.validatedIpcMain.handle(channel, handler);
            this.logService.trace(`IPC Object URL: Registered new channel ${channel}.`);
            return {
                resource,
                update: updatedObj => obj = updatedObj,
                dispose: () => {
                    this.logService.trace(`IPC Object URL: Removed channel ${channel}.`);
                    ipcMain_1.validatedIpcMain.removeHandler(channel);
                }
            };
        }
    };
    ProtocolMainService = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, log_1.ILogService)
    ], ProtocolMainService);
    exports.ProtocolMainService = ProtocolMainService;
});
//# sourceMappingURL=protocolMainService.js.map