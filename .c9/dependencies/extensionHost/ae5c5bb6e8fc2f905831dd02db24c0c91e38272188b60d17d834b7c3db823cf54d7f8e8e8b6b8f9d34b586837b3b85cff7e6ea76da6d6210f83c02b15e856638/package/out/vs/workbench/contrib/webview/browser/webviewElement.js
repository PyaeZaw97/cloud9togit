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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "vs/base/common/uuid", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/remote/common/remoteAuthorityResolver", "vs/platform/telemetry/common/telemetry", "vs/platform/tunnel/common/tunnel", "vs/platform/webview/common/webviewPortMapping", "vs/workbench/browser/webview", "vs/workbench/common/webview", "vs/workbench/contrib/webview/browser/resourceLoading", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewFindWidget", "vs/workbench/services/environment/common/environmentService"], function (require, exports, browser_1, dom_1, async_1, buffer_1, cancellation_1, event_1, lifecycle_1, network_1, uri_1, uuid_1, nls_1, accessibility_1, menuEntryActionViewItem_1, actions_1, configuration_1, contextView_1, files_1, instantiation_1, log_1, notification_1, remoteAuthorityResolver_1, telemetry_1, tunnel_1, webviewPortMapping_1, webview_1, webview_2, resourceLoading_1, webview_3, webviewFindWidget_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewElement = exports.WebviewMessageChannels = void 0;
    var WebviewMessageChannels;
    (function (WebviewMessageChannels) {
        WebviewMessageChannels["onmessage"] = "onmessage";
        WebviewMessageChannels["didClickLink"] = "did-click-link";
        WebviewMessageChannels["didScroll"] = "did-scroll";
        WebviewMessageChannels["didFocus"] = "did-focus";
        WebviewMessageChannels["didBlur"] = "did-blur";
        WebviewMessageChannels["didLoad"] = "did-load";
        WebviewMessageChannels["didFind"] = "did-find";
        WebviewMessageChannels["doUpdateState"] = "do-update-state";
        WebviewMessageChannels["doReload"] = "do-reload";
        WebviewMessageChannels["setConfirmBeforeClose"] = "set-confirm-before-close";
        WebviewMessageChannels["loadResource"] = "load-resource";
        WebviewMessageChannels["loadLocalhost"] = "load-localhost";
        WebviewMessageChannels["webviewReady"] = "webview-ready";
        WebviewMessageChannels["wheel"] = "did-scroll-wheel";
        WebviewMessageChannels["fatalError"] = "fatal-error";
        WebviewMessageChannels["noCspFound"] = "no-csp-found";
        WebviewMessageChannels["didKeydown"] = "did-keydown";
        WebviewMessageChannels["didKeyup"] = "did-keyup";
        WebviewMessageChannels["didContextMenu"] = "did-context-menu";
        WebviewMessageChannels["dragStart"] = "drag-start";
    })(WebviewMessageChannels = exports.WebviewMessageChannels || (exports.WebviewMessageChannels = {}));
    var WebviewState;
    (function (WebviewState) {
        let Type;
        (function (Type) {
            Type[Type["Initializing"] = 0] = "Initializing";
            Type[Type["Ready"] = 1] = "Ready";
        })(Type = WebviewState.Type || (WebviewState.Type = {}));
        class Initializing {
            constructor(pendingMessages) {
                this.pendingMessages = pendingMessages;
                this.type = 0 /* Type.Initializing */;
            }
        }
        WebviewState.Initializing = Initializing;
        WebviewState.Ready = { type: 1 /* Type.Ready */ };
    })(WebviewState || (WebviewState = {}));
    let WebviewElement = class WebviewElement extends lifecycle_1.Disposable {
        constructor(id, options, contentOptions, extension, webviewThemeDataProvider, configurationService, contextMenuService, menuService, notificationService, _environmentService, _fileService, _logService, _remoteAuthorityResolverService, _telemetryService, _tunnelService, instantiationService, _accessibilityService) {
            super();
            this.options = options;
            this.extension = extension;
            this.webviewThemeDataProvider = webviewThemeDataProvider;
            this._environmentService = _environmentService;
            this._fileService = _fileService;
            this._logService = _logService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._telemetryService = _telemetryService;
            this._tunnelService = _tunnelService;
            this._accessibilityService = _accessibilityService;
            this._expectedServiceWorkerVersion = 4; // Keep this in sync with the version in service-worker.js
            this._state = new WebviewState.Initializing([]);
            this._resourceLoadingCts = this._register(new cancellation_1.CancellationTokenSource());
            this._focusDelayer = this._register(new async_1.ThrottledDelayer(50));
            this._onDidHtmlChange = this._register(new event_1.Emitter());
            this.onDidHtmlChange = this._onDidHtmlChange.event;
            this._messageHandlers = new Map();
            this.checkImeCompletionState = true;
            this._disposed = false;
            this._onMissingCsp = this._register(new event_1.Emitter());
            this.onMissingCsp = this._onMissingCsp.event;
            this._onDidClickLink = this._register(new event_1.Emitter());
            this.onDidClickLink = this._onDidClickLink.event;
            this._onDidReload = this._register(new event_1.Emitter());
            this.onDidReload = this._onDidReload.event;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this._onDidWheel = this._register(new event_1.Emitter());
            this.onDidWheel = this._onDidWheel.event;
            this._onDidUpdateState = this._register(new event_1.Emitter());
            this.onDidUpdateState = this._onDidUpdateState.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this._onDidDispose.event;
            this._hasAlertedAboutMissingCsp = false;
            this._hasFindResult = this._register(new event_1.Emitter());
            this.hasFindResult = this._hasFindResult.event;
            this._onDidStopFind = this._register(new event_1.Emitter());
            this.onDidStopFind = this._onDidStopFind.event;
            this.id = id;
            this.iframeId = (0, uuid_1.generateUuid)();
            this.encodedWebviewOriginPromise = (0, webview_1.parentOriginHash)(window.origin, this.iframeId).then(id => this.encodedWebviewOrigin = id);
            this.content = {
                html: '',
                options: contentOptions,
                state: undefined
            };
            this._portMappingManager = this._register(new webviewPortMapping_1.WebviewPortMappingManager(() => { var _a; return (_a = this.extension) === null || _a === void 0 ? void 0 : _a.location; }, () => this.content.options.portMapping || [], this._tunnelService));
            this._element = this.createElement(options, contentOptions);
            const subscription = this._register((0, dom_1.addDisposableListener)(window, 'message', (e) => {
                var _a, _b;
                if (!this.encodedWebviewOrigin || ((_a = e === null || e === void 0 ? void 0 : e.data) === null || _a === void 0 ? void 0 : _a.target) !== this.iframeId) {
                    return;
                }
                if (e.origin !== this.webviewContentOrigin(this.encodedWebviewOrigin)) {
                    console.log(`Skipped renderer receiving message due to mismatched origins: ${e.origin} ${this.webviewContentOrigin}`);
                    return;
                }
                if (e.data.channel === "webview-ready" /* WebviewMessageChannels.webviewReady */) {
                    if (this.messagePort) {
                        return;
                    }
                    this._logService.debug(`Webview(${this.id}): webview ready`);
                    this.messagePort = e.ports[0];
                    this.messagePort.onmessage = (e) => {
                        const handlers = this._messageHandlers.get(e.data.channel);
                        if (!handlers) {
                            console.log(`No handlers found for '${e.data.channel}'`);
                            return;
                        }
                        handlers === null || handlers === void 0 ? void 0 : handlers.forEach(handler => handler(e.data.data, e));
                    };
                    (_b = this.element) === null || _b === void 0 ? void 0 : _b.classList.add('ready');
                    if (this._state.type === 0 /* WebviewState.Type.Initializing */) {
                        this._state.pendingMessages.forEach(({ channel, data }) => this.doPostMessage(channel, data));
                    }
                    this._state = WebviewState.Ready;
                    subscription.dispose();
                }
            }));
            this._register(this.on("no-csp-found" /* WebviewMessageChannels.noCspFound */, () => {
                this.handleNoCspFound();
            }));
            this._register(this.on("did-click-link" /* WebviewMessageChannels.didClickLink */, (uri) => {
                this._onDidClickLink.fire(uri);
            }));
            this._register(this.on("onmessage" /* WebviewMessageChannels.onmessage */, (data) => {
                this._onMessage.fire({
                    message: data.message,
                    transfer: data.transfer,
                });
            }));
            this._register(this.on("did-scroll" /* WebviewMessageChannels.didScroll */, (scrollYPercentage) => {
                this._onDidScroll.fire({ scrollYPercentage: scrollYPercentage });
            }));
            this._register(this.on("do-reload" /* WebviewMessageChannels.doReload */, () => {
                this.reload();
            }));
            this._register(this.on("do-update-state" /* WebviewMessageChannels.doUpdateState */, (state) => {
                this.state = state;
                this._onDidUpdateState.fire(state);
            }));
            this._register(this.on("did-focus" /* WebviewMessageChannels.didFocus */, () => {
                this.handleFocusChange(true);
            }));
            this._register(this.on("did-scroll-wheel" /* WebviewMessageChannels.wheel */, (event) => {
                this._onDidWheel.fire(event);
            }));
            this._register(this.on("did-blur" /* WebviewMessageChannels.didBlur */, () => {
                this.handleFocusChange(false);
            }));
            this._register(this.on("did-find" /* WebviewMessageChannels.didFind */, (didFind) => {
                this._hasFindResult.fire(didFind);
            }));
            this._register(this.on("fatal-error" /* WebviewMessageChannels.fatalError */, (e) => {
                notificationService.error((0, nls_1.localize)('fatalErrorMessage', "Error loading webview: {0}", e.message));
            }));
            this._register(this.on("did-keydown" /* WebviewMessageChannels.didKeydown */, (data) => {
                // Electron: workaround for https://github.com/electron/electron/issues/14258
                // We have to detect keyboard events in the <webview> and dispatch them to our
                // keybinding service because these events do not bubble to the parent window anymore.
                this.handleKeyEvent('keydown', data);
            }));
            this._register(this.on("did-keyup" /* WebviewMessageChannels.didKeyup */, (data) => {
                this.handleKeyEvent('keyup', data);
            }));
            this._register(this.on("did-context-menu" /* WebviewMessageChannels.didContextMenu */, (data) => {
                if (!this.element) {
                    return;
                }
                if (!this._contextKeyService) {
                    return;
                }
                const elementBox = this.element.getBoundingClientRect();
                contextMenuService.showContextMenu({
                    getActions: () => {
                        const result = [];
                        const menu = menuService.createMenu(actions_1.MenuId.WebviewContext, this._contextKeyService);
                        (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, undefined, result);
                        menu.dispose();
                        return result;
                    },
                    getAnchor: () => ({
                        x: elementBox.x + data.clientX,
                        y: elementBox.y + data.clientY
                    })
                });
            }));
            this._register(this.on("load-resource" /* WebviewMessageChannels.loadResource */, async (entry) => {
                try {
                    // Restore the authority we previously encoded
                    const authority = (0, webview_2.decodeAuthority)(entry.authority);
                    const uri = uri_1.URI.from({
                        scheme: entry.scheme,
                        authority: authority,
                        path: decodeURIComponent(entry.path),
                        query: entry.query ? decodeURIComponent(entry.query) : entry.query,
                    });
                    this.loadResource(entry.id, uri, entry.ifNoneMatch);
                }
                catch (e) {
                    this._send('did-load-resource', {
                        id: entry.id,
                        status: 404,
                        path: entry.path,
                    });
                }
            }));
            this._register(this.on("load-localhost" /* WebviewMessageChannels.loadLocalhost */, (entry) => {
                this.localLocalhost(entry.id, entry.origin);
            }));
            this._register(event_1.Event.runAndSubscribe(webviewThemeDataProvider.onThemeDataChanged, () => this.style()));
            this._register(_accessibilityService.onDidChangeReducedMotion(() => this.style()));
            this._register(_accessibilityService.onDidChangeScreenReaderOptimized(() => this.style()));
            this._confirmBeforeClose = configurationService.getValue('window.confirmBeforeClose');
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.confirmBeforeClose')) {
                    this._confirmBeforeClose = configurationService.getValue('window.confirmBeforeClose');
                    this._send("set-confirm-before-close" /* WebviewMessageChannels.setConfirmBeforeClose */, this._confirmBeforeClose);
                }
            }));
            this._register(this.on("drag-start" /* WebviewMessageChannels.dragStart */, () => {
                this.startBlockingIframeDragEvents();
            }));
            if (options.enableFindWidget) {
                this._webviewFindWidget = this._register(instantiationService.createInstance(webviewFindWidget_1.WebviewFindWidget, this));
                this.styledFindWidget();
            }
            this.encodedWebviewOriginPromise.then(encodedWebviewOrigin => {
                if (!this._disposed) {
                    this.initElement(encodedWebviewOrigin, extension, options);
                }
            });
        }
        get platform() { return 'browser'; }
        get element() { return this._element; }
        get isFocused() {
            if (!this._focused) {
                return false;
            }
            if (document.activeElement && document.activeElement !== this.element) {
                // looks like https://github.com/microsoft/vscode/issues/132641
                // where the focus is actually not in the `<iframe>`
                return false;
            }
            return true;
        }
        dispose() {
            var _a;
            this._disposed = true;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.remove();
            this._element = undefined;
            this.messagePort = undefined;
            if (this._state.type === 0 /* WebviewState.Type.Initializing */) {
                for (const message of this._state.pendingMessages) {
                    message.resolve(false);
                }
                this._state.pendingMessages = [];
            }
            this._onDidDispose.fire();
            this._resourceLoadingCts.dispose(true);
            super.dispose();
        }
        setContextKeyService(contextKeyService) {
            this._contextKeyService = contextKeyService;
        }
        postMessage(message, transfer) {
            return this._send('message', { message, transfer });
        }
        async _send(channel, data, transferable = []) {
            if (this._state.type === 0 /* WebviewState.Type.Initializing */) {
                let resolve;
                const promise = new Promise(r => resolve = r);
                this._state.pendingMessages.push({ channel, data, transferable, resolve: resolve });
                return promise;
            }
            else {
                return this.doPostMessage(channel, data, transferable);
            }
        }
        createElement(options, _contentOptions) {
            // Do not start loading the webview yet.
            // Wait the end of the ctor when all listeners have been hooked up.
            const element = document.createElement('iframe');
            element.name = this.id;
            element.className = `webview ${options.customClasses || ''}`;
            element.sandbox.add('allow-scripts', 'allow-same-origin', 'allow-forms', 'allow-pointer-lock', 'allow-downloads');
            if (!browser_1.isFirefox) {
                element.setAttribute('allow', 'clipboard-read; clipboard-write;');
            }
            element.style.border = 'none';
            element.style.width = '100%';
            element.style.height = '100%';
            element.focus = () => {
                this.doFocus();
            };
            return element;
        }
        initElement(encodedWebviewOrigin, extension, options) {
            var _a;
            // The extensionId and purpose in the URL are used for filtering in js-debug:
            const params = {
                id: this.iframeId,
                swVersion: String(this._expectedServiceWorkerVersion),
                extensionId: (_a = extension === null || extension === void 0 ? void 0 : extension.id.value) !== null && _a !== void 0 ? _a : '',
                platform: this.platform,
                'vscode-resource-base-authority': webview_2.webviewRootResourceAuthority,
                parentOrigin: window.origin,
            };
            if (this._environmentService.remoteAuthority) {
                params.remoteAuthority = this._environmentService.remoteAuthority;
            }
            if (options.purpose) {
                params.purpose = options.purpose;
            }
            const queryString = new URLSearchParams(params).toString();
            // Workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1754872
            const fileName = browser_1.isFirefox ? 'index-no-csp.html' : 'index.html';
            this.element.setAttribute('src', `${this.webviewContentEndpoint(encodedWebviewOrigin)}/${fileName}?${queryString}`);
        }
        mountTo(parent) {
            if (!this.element) {
                return;
            }
            if (this._webviewFindWidget) {
                parent.appendChild(this._webviewFindWidget.getDomNode());
            }
            [dom_1.EventType.MOUSE_DOWN, dom_1.EventType.MOUSE_MOVE, dom_1.EventType.DROP].forEach(eventName => {
                this._register((0, dom_1.addDisposableListener)(parent, eventName, () => {
                    this.stopBlockingIframeDragEvents();
                }));
            });
            [parent, window].forEach(node => this._register((0, dom_1.addDisposableListener)(node, dom_1.EventType.DRAG_END, () => {
                this.stopBlockingIframeDragEvents();
            })));
            parent.appendChild(this.element);
        }
        startBlockingIframeDragEvents() {
            if (this.element) {
                this.element.style.pointerEvents = 'none';
            }
        }
        stopBlockingIframeDragEvents() {
            if (this.element) {
                this.element.style.pointerEvents = 'auto';
            }
        }
        webviewContentEndpoint(encodedWebviewOrigin) {
            const endpoint = this._environmentService.webviewExternalEndpoint.replace('{{uuid}}', encodedWebviewOrigin);
            if (endpoint[endpoint.length - 1] === '/') {
                return endpoint.slice(0, endpoint.length - 1);
            }
            return endpoint;
        }
        webviewContentOrigin(encodedWebviewOrigin) {
            const uri = uri_1.URI.parse(this.webviewContentEndpoint(encodedWebviewOrigin));
            return uri.scheme + '://' + uri.authority.toLowerCase();
        }
        doPostMessage(channel, data, transferable = []) {
            if (this.element && this.messagePort) {
                this.messagePort.postMessage({ channel, args: data }, transferable);
                return true;
            }
            return false;
        }
        on(channel, handler) {
            let handlers = this._messageHandlers.get(channel);
            if (!handlers) {
                handlers = new Set();
                this._messageHandlers.set(channel, handlers);
            }
            handlers.add(handler);
            return (0, lifecycle_1.toDisposable)(() => {
                var _a;
                (_a = this._messageHandlers.get(channel)) === null || _a === void 0 ? void 0 : _a.delete(handler);
            });
        }
        handleNoCspFound() {
            var _a;
            if (this._hasAlertedAboutMissingCsp) {
                return;
            }
            this._hasAlertedAboutMissingCsp = true;
            if ((_a = this.extension) === null || _a === void 0 ? void 0 : _a.id) {
                if (this._environmentService.isExtensionDevelopment) {
                    this._onMissingCsp.fire(this.extension.id);
                }
                const payload = {
                    extension: this.extension.id.value
                };
                this._telemetryService.publicLog2('webviewMissingCsp', payload);
            }
        }
        reload() {
            this.doUpdateContent(this.content);
            const subscription = this._register(this.on("did-load" /* WebviewMessageChannels.didLoad */, () => {
                this._onDidReload.fire();
                subscription.dispose();
            }));
        }
        set html(value) {
            const rewrittenHtml = this.rewriteVsCodeResourceUrls(value);
            this.doUpdateContent({
                html: rewrittenHtml,
                options: this.content.options,
                state: this.content.state,
            });
            this._onDidHtmlChange.fire(value);
        }
        rewriteVsCodeResourceUrls(value) {
            var _a, _b, _c, _d;
            const isRemote = ((_b = (_a = this.extension) === null || _a === void 0 ? void 0 : _a.location) === null || _b === void 0 ? void 0 : _b.scheme) === network_1.Schemas.vscodeRemote;
            const remoteAuthority = ((_d = (_c = this.extension) === null || _c === void 0 ? void 0 : _c.location) === null || _d === void 0 ? void 0 : _d.scheme) === network_1.Schemas.vscodeRemote ? this.extension.location.authority : undefined;
            return value
                .replace(/(["'])(?:vscode-resource):(\/\/([^\s\/'"]+?)(?=\/))?([^\s'"]+?)(["'])/gi, (_match, startQuote, _1, scheme, path, endQuote) => {
                const uri = uri_1.URI.from({
                    scheme: scheme || 'file',
                    path: decodeURIComponent(path),
                });
                const webviewUri = (0, webview_2.asWebviewUri)(uri, { isRemote, authority: remoteAuthority }).toString();
                return `${startQuote}${webviewUri}${endQuote}`;
            })
                .replace(/(["'])(?:vscode-webview-resource):(\/\/[^\s\/'"]+\/([^\s\/'"]+?)(?=\/))?([^\s'"]+?)(["'])/gi, (_match, startQuote, _1, scheme, path, endQuote) => {
                const uri = uri_1.URI.from({
                    scheme: scheme || 'file',
                    path: decodeURIComponent(path),
                });
                const webviewUri = (0, webview_2.asWebviewUri)(uri, { isRemote, authority: remoteAuthority }).toString();
                return `${startQuote}${webviewUri}${endQuote}`;
            });
        }
        set contentOptions(options) {
            this._logService.debug(`Webview(${this.id}): will update content options`);
            if ((0, webview_3.areWebviewContentOptionsEqual)(options, this.content.options)) {
                this._logService.debug(`Webview(${this.id}): skipping content options update`);
                return;
            }
            this.doUpdateContent({
                html: this.content.html,
                options: options,
                state: this.content.state,
            });
        }
        set localResourcesRoot(resources) {
            this.content = Object.assign(Object.assign({}, this.content), { options: Object.assign(Object.assign({}, this.content.options), { localResourceRoots: resources }) });
        }
        set state(state) {
            this.content = {
                html: this.content.html,
                options: this.content.options,
                state,
            };
        }
        set initialScrollProgress(value) {
            this._send('initial-scroll-position', value);
        }
        doUpdateContent(newContent) {
            var _a;
            this._logService.debug(`Webview(${this.id}): will update content`);
            this.content = newContent;
            const allowScripts = !!this.content.options.allowScripts;
            this._send('content', {
                contents: this.content.html,
                options: {
                    allowMultipleAPIAcquire: !!this.content.options.allowMultipleAPIAcquire,
                    allowScripts: allowScripts,
                    allowForms: (_a = this.content.options.allowForms) !== null && _a !== void 0 ? _a : allowScripts, // For back compat, we allow forms by default when scripts are enabled
                },
                state: this.content.state,
                cspSource: webview_2.webviewGenericCspSource,
                confirmBeforeClose: this._confirmBeforeClose,
            });
        }
        style() {
            let { styles, activeTheme, themeLabel } = this.webviewThemeDataProvider.getWebviewThemeData();
            if (this.options.transformCssVariables) {
                styles = this.options.transformCssVariables(styles);
            }
            const reduceMotion = this._accessibilityService.isMotionReduced();
            const screenReader = this._accessibilityService.isScreenReaderOptimized();
            this._send('styles', { styles, activeTheme, themeName: themeLabel, reduceMotion, screenReader });
            this.styledFindWidget();
        }
        styledFindWidget() {
            var _a;
            (_a = this._webviewFindWidget) === null || _a === void 0 ? void 0 : _a.updateTheme(this.webviewThemeDataProvider.getTheme());
        }
        handleFocusChange(isFocused) {
            this._focused = isFocused;
            if (isFocused) {
                this._onDidFocus.fire();
            }
            else {
                this._onDidBlur.fire();
            }
        }
        handleKeyEvent(type, event) {
            // Create a fake KeyboardEvent from the data provided
            const emulatedKeyboardEvent = new KeyboardEvent(type, event);
            // Force override the target
            Object.defineProperty(emulatedKeyboardEvent, 'target', {
                get: () => this.element,
            });
            // And re-dispatch
            window.dispatchEvent(emulatedKeyboardEvent);
        }
        windowDidDragStart() {
            // Webview break drag and dropping around the main window (no events are generated when you are over them)
            // Work around this by disabling pointer events during the drag.
            // https://github.com/electron/electron/issues/18226
            this.startBlockingIframeDragEvents();
        }
        windowDidDragEnd() {
            this.stopBlockingIframeDragEvents();
        }
        selectAll() {
            this.execCommand('selectAll');
        }
        copy() {
            this.execCommand('copy');
        }
        paste() {
            this.execCommand('paste');
        }
        cut() {
            this.execCommand('cut');
        }
        undo() {
            this.execCommand('undo');
        }
        redo() {
            this.execCommand('redo');
        }
        execCommand(command) {
            if (this.element) {
                this._send('execCommand', command);
            }
        }
        async loadResource(id, uri, ifNoneMatch) {
            try {
                const result = await (0, resourceLoading_1.loadLocalResource)(uri, {
                    ifNoneMatch,
                    roots: this.content.options.localResourceRoots || [],
                }, this._fileService, this._logService, this._resourceLoadingCts.token);
                switch (result.type) {
                    case resourceLoading_1.WebviewResourceResponse.Type.Success: {
                        const buffer = await this.streamToBuffer(result.stream);
                        return this._send('did-load-resource', {
                            id,
                            status: 200,
                            path: uri.path,
                            mime: result.mimeType,
                            data: buffer,
                            etag: result.etag,
                            mtime: result.mtime
                        }, [buffer]);
                    }
                    case resourceLoading_1.WebviewResourceResponse.Type.NotModified: {
                        return this._send('did-load-resource', {
                            id,
                            status: 304,
                            path: uri.path,
                            mime: result.mimeType,
                            mtime: result.mtime
                        });
                    }
                    case resourceLoading_1.WebviewResourceResponse.Type.AccessDenied: {
                        return this._send('did-load-resource', {
                            id,
                            status: 401,
                            path: uri.path,
                        });
                    }
                }
            }
            catch (_a) {
                // noop
            }
            return this._send('did-load-resource', {
                id,
                status: 404,
                path: uri.path,
            });
        }
        async streamToBuffer(stream) {
            const vsBuffer = await (0, buffer_1.streamToBuffer)(stream);
            return vsBuffer.buffer.buffer;
        }
        async localLocalhost(id, origin) {
            const authority = this._environmentService.remoteAuthority;
            const resolveAuthority = authority ? await this._remoteAuthorityResolverService.resolveAuthority(authority) : undefined;
            const redirect = resolveAuthority ? await this._portMappingManager.getRedirect(resolveAuthority.authority, origin) : undefined;
            return this._send('did-load-localhost', {
                id,
                origin,
                location: redirect
            });
        }
        focus() {
            this.doFocus();
            // Handle focus change programmatically (do not rely on event from <webview>)
            this.handleFocusChange(true);
        }
        doFocus() {
            var _a;
            if (!this.element) {
                return;
            }
            try {
                (_a = this.element.contentWindow) === null || _a === void 0 ? void 0 : _a.focus();
            }
            catch (_b) {
                // noop
            }
            // Workaround for https://github.com/microsoft/vscode/issues/75209
            // Focusing the inner webview is async so for a sequence of actions such as:
            //
            // 1. Open webview
            // 1. Show quick pick from command palette
            //
            // We end up focusing the webview after showing the quick pick, which causes
            // the quick pick to instantly dismiss.
            //
            // Workaround this by debouncing the focus and making sure we are not focused on an input
            // when we try to re-focus.
            this._focusDelayer.trigger(async () => {
                var _a;
                if (!this.isFocused || !this.element) {
                    return;
                }
                if (document.activeElement && document.activeElement !== this.element && ((_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.tagName) !== 'BODY') {
                    return;
                }
                this._send('focus');
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
            this._send('find', { value, previous });
        }
        updateFind(value) {
            if (!value || !this.element) {
                return;
            }
            this._send('find', { value });
        }
        stopFind(keepSelection) {
            if (!this.element) {
                return;
            }
            this._send('find-stop', { keepSelection });
            this._onDidStopFind.fire();
        }
        showFind() {
            var _a;
            (_a = this._webviewFindWidget) === null || _a === void 0 ? void 0 : _a.reveal();
        }
        hideFind() {
            var _a;
            (_a = this._webviewFindWidget) === null || _a === void 0 ? void 0 : _a.hide();
        }
        runFindAction(previous) {
            var _a;
            (_a = this._webviewFindWidget) === null || _a === void 0 ? void 0 : _a.find(previous);
        }
    };
    WebviewElement = __decorate([
        __param(5, configuration_1.IConfigurationService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, actions_1.IMenuService),
        __param(8, notification_1.INotificationService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, files_1.IFileService),
        __param(11, log_1.ILogService),
        __param(12, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(13, telemetry_1.ITelemetryService),
        __param(14, tunnel_1.ITunnelService),
        __param(15, instantiation_1.IInstantiationService),
        __param(16, accessibility_1.IAccessibilityService)
    ], WebviewElement);
    exports.WebviewElement = WebviewElement;
});
//# sourceMappingURL=webviewElement.js.map