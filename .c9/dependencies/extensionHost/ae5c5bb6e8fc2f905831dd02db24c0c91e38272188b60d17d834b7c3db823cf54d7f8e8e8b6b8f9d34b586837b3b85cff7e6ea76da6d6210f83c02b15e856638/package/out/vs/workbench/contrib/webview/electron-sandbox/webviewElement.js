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
define(["require", "exports", "vs/base/common/async", "vs/base/common/network", "vs/base/common/stream", "vs/base/parts/ipc/common/ipc", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/ipc/electron-sandbox/services", "vs/platform/log/common/log", "vs/platform/native/electron-sandbox/native", "vs/platform/notification/common/notification", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/telemetry/common/telemetry", "vs/platform/tunnel/common/tunnel", "vs/workbench/contrib/webview/browser/webviewElement", "vs/workbench/contrib/webview/electron-sandbox/windowIgnoreMenuShortcutsManager", "vs/workbench/services/environment/common/environmentService"], function (require, exports, async_1, network_1, stream_1, ipc_1, accessibility_1, actions_1, configuration_1, contextView_1, files_1, instantiation_1, services_1, log_1, native_1, notification_1, remoteAuthorityResolver_1, telemetry_1, tunnel_1, webviewElement_1, windowIgnoreMenuShortcutsManager_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronWebviewElement = void 0;
    /**
     * Webview backed by an iframe but that uses Electron APIs to power the webview.
     */
    let ElectronWebviewElement = class ElectronWebviewElement extends webviewElement_1.WebviewElement {
        constructor(id, options, contentOptions, extension, webviewThemeDataProvider, contextMenuService, tunnelService, fileService, telemetryService, environmentService, remoteAuthorityResolverService, menuService, logService, configurationService, mainProcessService, notificationService, nativeHostService, instantiationService, accessibilityService) {
            super(id, options, contentOptions, extension, webviewThemeDataProvider, configurationService, contextMenuService, menuService, notificationService, environmentService, fileService, logService, remoteAuthorityResolverService, telemetryService, tunnelService, instantiationService, accessibilityService);
            this.nativeHostService = nativeHostService;
            this._findStarted = false;
            this._iframeDelayer = this._register(new async_1.Delayer(200));
            this._webviewKeyboardHandler = new windowIgnoreMenuShortcutsManager_1.WindowIgnoreMenuShortcutsManager(configurationService, mainProcessService, nativeHostService);
            this._webviewMainService = ipc_1.ProxyChannel.toService(mainProcessService.getChannel('webview'));
            this._register(this.on("did-focus" /* WebviewMessageChannels.didFocus */, () => {
                this._webviewKeyboardHandler.didFocus();
            }));
            this._register(this.on("did-blur" /* WebviewMessageChannels.didBlur */, () => {
                this._webviewKeyboardHandler.didBlur();
            }));
            if (options.enableFindWidget) {
                this._register(this.onDidHtmlChange((newContent) => {
                    if (this._findStarted && this._cachedHtmlContent !== newContent) {
                        this.stopFind(false);
                        this._cachedHtmlContent = newContent;
                    }
                }));
                this._register(this._webviewMainService.onFoundInFrame((result) => {
                    this._hasFindResult.fire(result.matches > 0);
                }));
            }
        }
        get platform() { return 'electron'; }
        webviewContentEndpoint(iframeId) {
            return `${network_1.Schemas.vscodeWebview}://${iframeId}`;
        }
        streamToBuffer(stream) {
            // Join buffers from stream without using the Node.js backing pool.
            // This lets us transfer the resulting buffer to the webview.
            return (0, stream_1.consumeStream)(stream, (buffers) => {
                const totalLength = buffers.reduce((prev, curr) => prev + curr.byteLength, 0);
                const ret = new ArrayBuffer(totalLength);
                const view = new Uint8Array(ret);
                let offset = 0;
                for (const element of buffers) {
                    view.set(element.buffer, offset);
                    offset += element.byteLength;
                }
                return ret;
            });
        }
        /**
         * Webviews expose a stateful find API.
         * Successive calls to find will move forward or backward through onFindResults
         * depending on the supplied options.
         *
         * @param value The string to search for. Empty strings are ignored.
         */
        find(value, previous) {
            if (!this.element) {
                return;
            }
            if (!this._findStarted) {
                this.updateFind(value);
            }
            else {
                // continuing the find, so set findNext to false
                const options = { forward: !previous, findNext: false, matchCase: false };
                this._webviewMainService.findInFrame({ windowId: this.nativeHostService.windowId }, this.id, value, options);
            }
        }
        updateFind(value) {
            if (!value || !this.element) {
                return;
            }
            // FindNext must be true for a first request
            const options = {
                forward: true,
                findNext: true,
                matchCase: false
            };
            this._iframeDelayer.trigger(() => {
                this._findStarted = true;
                this._webviewMainService.findInFrame({ windowId: this.nativeHostService.windowId }, this.id, value, options);
            });
        }
        stopFind(keepSelection) {
            if (!this.element) {
                return;
            }
            this._iframeDelayer.cancel();
            this._findStarted = false;
            this._webviewMainService.stopFindInFrame({ windowId: this.nativeHostService.windowId }, this.id, {
                keepSelection
            });
            this._onDidStopFind.fire();
        }
    };
    ElectronWebviewElement = __decorate([
        __param(5, contextView_1.IContextMenuService),
        __param(6, tunnel_1.ITunnelService),
        __param(7, files_1.IFileService),
        __param(8, telemetry_1.ITelemetryService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(11, actions_1.IMenuService),
        __param(12, log_1.ILogService),
        __param(13, configuration_1.IConfigurationService),
        __param(14, services_1.IMainProcessService),
        __param(15, notification_1.INotificationService),
        __param(16, native_1.INativeHostService),
        __param(17, instantiation_1.IInstantiationService),
        __param(18, accessibility_1.IAccessibilityService)
    ], ElectronWebviewElement);
    exports.ElectronWebviewElement = ElectronWebviewElement;
});
//# sourceMappingURL=webviewElement.js.map