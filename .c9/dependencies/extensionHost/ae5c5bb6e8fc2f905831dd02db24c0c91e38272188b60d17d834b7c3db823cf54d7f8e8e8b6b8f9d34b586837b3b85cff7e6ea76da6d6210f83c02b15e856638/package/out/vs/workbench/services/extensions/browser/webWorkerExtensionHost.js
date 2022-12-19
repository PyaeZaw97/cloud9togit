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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/buffer", "vs/workbench/services/extensions/common/extensionHostProtocol", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/label/common/label", "vs/platform/log/common/log", "vs/base/common/platform", "vs/base/browser/dom", "vs/workbench/services/extensions/common/extensions", "vs/platform/product/common/productService", "vs/workbench/services/environment/browser/environmentService", "vs/base/common/resources", "vs/platform/registry/common/platform", "vs/workbench/services/output/common/output", "vs/nls", "vs/base/common/uuid", "vs/base/common/errors", "vs/base/common/async", "vs/platform/layout/browser/layoutService", "vs/base/common/network", "vs/platform/storage/common/storage", "vs/workbench/browser/webview"], function (require, exports, event_1, lifecycle_1, buffer_1, extensionHostProtocol_1, telemetry_1, workspace_1, label_1, log_1, platform, dom, extensions_1, productService_1, environmentService_1, resources_1, platform_1, output_1, nls_1, uuid_1, errors_1, async_1, layoutService_1, network_1, storage_1, webview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebWorkerExtensionHost = void 0;
    let WebWorkerExtensionHost = class WebWorkerExtensionHost extends lifecycle_1.Disposable {
        constructor(runningLocation, lazyStart, _initDataProvider, _telemetryService, _contextService, _labelService, _logService, _environmentService, _productService, _layoutService, _storageService) {
            super();
            this.runningLocation = runningLocation;
            this._initDataProvider = _initDataProvider;
            this._telemetryService = _telemetryService;
            this._contextService = _contextService;
            this._labelService = _labelService;
            this._logService = _logService;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._layoutService = _layoutService;
            this._storageService = _storageService;
            this.remoteAuthority = null;
            this.extensions = new extensions_1.ExtensionHostExtensions();
            this._onDidExit = this._register(new event_1.Emitter());
            this.onExit = this._onDidExit.event;
            this.lazyStart = lazyStart;
            this._isTerminating = false;
            this._protocolPromise = null;
            this._protocol = null;
            this._extensionHostLogsLocation = (0, resources_1.joinPath)(this._environmentService.extHostLogsPath, 'webWorker');
            this._extensionHostLogFile = (0, resources_1.joinPath)(this._extensionHostLogsLocation, `${extensions_1.ExtensionHostLogFileName}.log`);
        }
        async _getWebWorkerExtensionHostIframeSrc() {
            const suffix = this._environmentService.debugExtensionHost && this._environmentService.debugRenderer ? '?debugged=1' : '?';
            const iframeModulePath = 'vs/workbench/services/extensions/worker/webWorkerExtensionHostIframe.html';
            if (platform.isWeb) {
                const webEndpointUrlTemplate = this._productService.webEndpointUrlTemplate;
                const commit = this._productService.commit;
                const quality = this._productService.quality;
                if (webEndpointUrlTemplate && commit && quality) {
                    // Try to keep the web worker extension host iframe origin stable by storing it in workspace storage
                    const key = 'webWorkerExtensionHostIframeStableOriginUUID';
                    let stableOriginUUID = this._storageService.get(key, 1 /* StorageScope.WORKSPACE */);
                    if (typeof stableOriginUUID === 'undefined') {
                        stableOriginUUID = (0, uuid_1.generateUuid)();
                        this._storageService.store(key, stableOriginUUID, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                    }
                    const hash = await (0, webview_1.parentOriginHash)(window.origin, stableOriginUUID);
                    const baseUrl = (webEndpointUrlTemplate
                        .replace('{{uuid}}', `v--${hash}`) // using `v--` as a marker to require `parentOrigin`/`salt` verification
                        .replace('{{commit}}', commit)
                        .replace('{{quality}}', quality));
                    const res = new URL(`${baseUrl}/out/${iframeModulePath}${suffix}`);
                    res.searchParams.set('parentOrigin', window.origin);
                    res.searchParams.set('salt', stableOriginUUID);
                    return res.toString();
                }
                console.warn(`The web worker extension host is started in a same-origin iframe!`);
            }
            const relativeExtensionHostIframeSrc = network_1.FileAccess.asBrowserUri(iframeModulePath, require);
            return `${relativeExtensionHostIframeSrc.toString(true)}${suffix}`;
        }
        async start() {
            if (!this._protocolPromise) {
                this._protocolPromise = this._startInsideIframe();
                this._protocolPromise.then(protocol => this._protocol = protocol);
            }
            return this._protocolPromise;
        }
        async _startInsideIframe() {
            var _a, _b;
            const webWorkerExtensionHostIframeSrc = await this._getWebWorkerExtensionHostIframeSrc();
            const emitter = this._register(new event_1.Emitter());
            const iframe = document.createElement('iframe');
            iframe.setAttribute('class', 'web-worker-ext-host-iframe');
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
            iframe.setAttribute('aria-hidden', 'true');
            iframe.style.display = 'none';
            const vscodeWebWorkerExtHostId = (0, uuid_1.generateUuid)();
            iframe.setAttribute('src', `${webWorkerExtensionHostIframeSrc}&vscodeWebWorkerExtHostId=${vscodeWebWorkerExtHostId}`);
            const barrier = new async_1.Barrier();
            let port;
            let barrierError = null;
            let barrierHasError = false;
            let startTimeout = null;
            const rejectBarrier = (exitCode, error) => {
                barrierError = error;
                barrierHasError = true;
                (0, errors_1.onUnexpectedError)(barrierError);
                clearTimeout(startTimeout);
                this._onDidExit.fire([81 /* ExtensionHostExitCode.UnexpectedError */, barrierError.message]);
                barrier.open();
            };
            const resolveBarrier = (messagePort) => {
                port = messagePort;
                clearTimeout(startTimeout);
                barrier.open();
            };
            startTimeout = setTimeout(() => {
                console.warn(`The Web Worker Extension Host did not start in 60s, that might be a problem.`);
            }, 60000);
            this._register(dom.addDisposableListener(window, 'message', (event) => {
                if (event.source !== iframe.contentWindow) {
                    return;
                }
                if (event.data.vscodeWebWorkerExtHostId !== vscodeWebWorkerExtHostId) {
                    return;
                }
                if (event.data.error) {
                    const { name, message, stack } = event.data.error;
                    const err = new Error();
                    err.message = message;
                    err.name = name;
                    err.stack = stack;
                    return rejectBarrier(81 /* ExtensionHostExitCode.UnexpectedError */, err);
                }
                const { data } = event.data;
                if (barrier.isOpen() || !(data instanceof MessagePort)) {
                    console.warn('UNEXPECTED message', event);
                    const err = new Error('UNEXPECTED message');
                    return rejectBarrier(81 /* ExtensionHostExitCode.UnexpectedError */, err);
                }
                resolveBarrier(data);
            }));
            this._layoutService.container.appendChild(iframe);
            this._register((0, lifecycle_1.toDisposable)(() => iframe.remove()));
            // await MessagePort and use it to directly communicate
            // with the worker extension host
            await barrier.wait();
            if (barrierHasError) {
                throw barrierError;
            }
            // Send over message ports for extension API
            const messagePorts = (_b = (_a = this._environmentService.options) === null || _a === void 0 ? void 0 : _a.messagePorts) !== null && _b !== void 0 ? _b : new Map();
            iframe.contentWindow.postMessage({ type: 'vscode.init', data: messagePorts }, '*', [...messagePorts.values()]);
            port.onmessage = (event) => {
                const { data } = event;
                if (!(data instanceof ArrayBuffer)) {
                    console.warn('UNKNOWN data received', data);
                    this._onDidExit.fire([77, 'UNKNOWN data received']);
                    return;
                }
                emitter.fire(buffer_1.VSBuffer.wrap(new Uint8Array(data, 0, data.byteLength)));
            };
            const protocol = {
                onMessage: emitter.event,
                send: vsbuf => {
                    const data = vsbuf.buffer.buffer.slice(vsbuf.buffer.byteOffset, vsbuf.buffer.byteOffset + vsbuf.buffer.byteLength);
                    port.postMessage(data, [data]);
                }
            };
            return this._performHandshake(protocol);
        }
        async _performHandshake(protocol) {
            // extension host handshake happens below
            // (1) <== wait for: Ready
            // (2) ==> send: init data
            // (3) <== wait for: Initialized
            await event_1.Event.toPromise(event_1.Event.filter(protocol.onMessage, msg => (0, extensionHostProtocol_1.isMessageOfType)(msg, 1 /* MessageType.Ready */)));
            if (this._isTerminating) {
                throw (0, errors_1.canceled)();
            }
            protocol.send(buffer_1.VSBuffer.fromString(JSON.stringify(await this._createExtHostInitData())));
            if (this._isTerminating) {
                throw (0, errors_1.canceled)();
            }
            await event_1.Event.toPromise(event_1.Event.filter(protocol.onMessage, msg => (0, extensionHostProtocol_1.isMessageOfType)(msg, 0 /* MessageType.Initialized */)));
            if (this._isTerminating) {
                throw (0, errors_1.canceled)();
            }
            // Register log channel for web worker exthost log
            platform_1.Registry.as(output_1.Extensions.OutputChannels).registerChannel({ id: 'webWorkerExtHostLog', label: (0, nls_1.localize)('name', "Worker Extension Host"), file: this._extensionHostLogFile, log: true });
            return protocol;
        }
        dispose() {
            if (this._isTerminating) {
                return;
            }
            this._isTerminating = true;
            if (this._protocol) {
                this._protocol.send((0, extensionHostProtocol_1.createMessageOfType)(2 /* MessageType.Terminate */));
            }
            super.dispose();
        }
        getInspectPort() {
            return undefined;
        }
        enableInspectPort() {
            return Promise.resolve(false);
        }
        async _createExtHostInitData() {
            var _a;
            const [telemetryInfo, initData] = await Promise.all([this._telemetryService.getTelemetryInfo(), this._initDataProvider.getInitData()]);
            const workspace = this._contextService.getWorkspace();
            const deltaExtensions = this.extensions.set(initData.allExtensions, initData.myExtensions);
            return {
                commit: this._productService.commit,
                version: this._productService.version,
                parentPid: -1,
                environment: {
                    isExtensionDevelopmentDebug: this._environmentService.debugRenderer,
                    appName: this._productService.nameLong,
                    appHost: (_a = this._productService.embedderIdentifier) !== null && _a !== void 0 ? _a : (platform.isWeb ? 'web' : 'desktop'),
                    appUriScheme: this._productService.urlProtocol,
                    appLanguage: platform.language,
                    extensionDevelopmentLocationURI: this._environmentService.extensionDevelopmentLocationURI,
                    extensionTestsLocationURI: this._environmentService.extensionTestsLocationURI,
                    globalStorageHome: this._environmentService.globalStorageHome,
                    workspaceStorageHome: this._environmentService.workspaceStorageHome,
                },
                workspace: this._contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */ ? undefined : {
                    configuration: workspace.configuration || undefined,
                    id: workspace.id,
                    name: this._labelService.getWorkspaceLabel(workspace),
                    transient: workspace.transient
                },
                allExtensions: deltaExtensions.toAdd,
                myExtensions: deltaExtensions.myToAdd,
                telemetryInfo,
                logLevel: this._logService.getLevel(),
                logsLocation: this._extensionHostLogsLocation,
                logFile: this._extensionHostLogFile,
                autoStart: initData.autoStart,
                remote: {
                    authority: this._environmentService.remoteAuthority,
                    connectionData: null,
                    isRemote: false
                },
                uiKind: platform.isWeb ? extensionHostProtocol_1.UIKind.Web : extensionHostProtocol_1.UIKind.Desktop
            };
        }
    };
    WebWorkerExtensionHost = __decorate([
        __param(3, telemetry_1.ITelemetryService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, label_1.ILabelService),
        __param(6, log_1.ILogService),
        __param(7, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(8, productService_1.IProductService),
        __param(9, layoutService_1.ILayoutService),
        __param(10, storage_1.IStorageService)
    ], WebWorkerExtensionHost);
    exports.WebWorkerExtensionHost = WebWorkerExtensionHost;
});
//# sourceMappingURL=webWorkerExtensionHost.js.map