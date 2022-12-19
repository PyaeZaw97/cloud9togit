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
define(["require", "exports", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/electron-sandbox/terminalRemote", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/native/electron-sandbox/native", "vs/base/common/lifecycle", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, globals_1, uri_1, files_1, instantiation_1, terminalRemote_1, remoteAgentService_1, native_1, lifecycle_1, terminal_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalNativeContribution = void 0;
    let TerminalNativeContribution = class TerminalNativeContribution extends lifecycle_1.Disposable {
        constructor(_fileService, _terminalService, instantiationService, remoteAgentService, nativeHostService) {
            super();
            this._fileService = _fileService;
            this._terminalService = _terminalService;
            this.instantiationService = instantiationService;
            this.remoteAgentService = remoteAgentService;
            this.nativeHostService = nativeHostService;
            globals_1.ipcRenderer.on('vscode:openFiles', (_, request) => this._onOpenFileRequest(request));
            this._register(nativeHostService.onDidResumeOS(() => this._onOsResume()));
            this._terminalService.setNativeDelegate({
                getWindowCount: () => nativeHostService.getWindowCount(),
                openDevTools: () => nativeHostService.openDevTools(),
                toggleDevTools: () => nativeHostService.toggleDevTools()
            });
            const connection = remoteAgentService.getConnection();
            if (connection && connection.remoteAuthority) {
                (0, terminalRemote_1.registerRemoteContributions)();
            }
        }
        _onOsResume() {
            this._terminalService.instances.forEach(instance => { var _a; return (_a = instance.xterm) === null || _a === void 0 ? void 0 : _a.forceRedraw(); });
        }
        async _onOpenFileRequest(request) {
            var _a;
            // if the request to open files is coming in from the integrated terminal (identified though
            // the termProgram variable) and we are instructed to wait for editors close, wait for the
            // marker file to get deleted and then focus back to the integrated terminal.
            if (request.termProgram === 'vscode' && request.filesToWait) {
                const waitMarkerFileUri = uri_1.URI.revive(request.filesToWait.waitMarkerFileUri);
                await this._whenFileDeleted(waitMarkerFileUri);
                // Focus active terminal
                (_a = this._terminalService.activeInstance) === null || _a === void 0 ? void 0 : _a.focus();
            }
        }
        _whenFileDeleted(path) {
            // Complete when wait marker file is deleted
            return new Promise(resolve => {
                let running = false;
                const interval = setInterval(async () => {
                    if (!running) {
                        running = true;
                        const exists = await this._fileService.exists(path);
                        running = false;
                        if (!exists) {
                            clearInterval(interval);
                            resolve(undefined);
                        }
                    }
                }, 1000);
            });
        }
    };
    TerminalNativeContribution = __decorate([
        __param(0, files_1.IFileService),
        __param(1, terminal_1.ITerminalService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, remoteAgentService_1.IRemoteAgentService),
        __param(4, native_1.INativeHostService)
    ], TerminalNativeContribution);
    exports.TerminalNativeContribution = TerminalNativeContribution;
});
//# sourceMappingURL=terminalNativeContribution.js.map