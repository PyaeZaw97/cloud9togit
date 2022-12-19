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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/layout/browser/layoutService", "vs/workbench/contrib/webview/browser/webview"], function (require, exports, event_1, lifecycle_1, contextkey_1, layoutService_1, webview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OverlayWebview = void 0;
    /**
     * Webview that is absolutely positioned over another element and that can creates and destroys an underlying webview as needed.
     */
    let OverlayWebview = class OverlayWebview extends lifecycle_1.Disposable {
        constructor(id, initialOptions, initialContentOptions, extension, _layoutService, _webviewService, _baseContextKeyService) {
            super();
            this.id = id;
            this._layoutService = _layoutService;
            this._webviewService = _webviewService;
            this._baseContextKeyService = _baseContextKeyService;
            this._onDidWheel = this._register(new event_1.Emitter());
            this.onDidWheel = this._onDidWheel.event;
            this._isFirstLoad = true;
            this._firstLoadPendingMessages = new Set();
            this._webview = this._register(new lifecycle_1.MutableDisposable());
            this._webviewEvents = this._register(new lifecycle_1.DisposableStore());
            this._html = '';
            this._initialScrollProgress = 0;
            this._state = undefined;
            this._owner = undefined;
            this._scopedContextKeyService = this._register(new lifecycle_1.MutableDisposable());
            this._isDisposed = false;
            this._onDidDispose = this._register(new event_1.Emitter());
            this.onDidDispose = this._onDidDispose.event;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onDidClickLink = this._register(new event_1.Emitter());
            this.onDidClickLink = this._onDidClickLink.event;
            this._onDidReload = this._register(new event_1.Emitter());
            this.onDidReload = this._onDidReload.event;
            this._onDidScroll = this._register(new event_1.Emitter());
            this.onDidScroll = this._onDidScroll.event;
            this._onDidUpdateState = this._register(new event_1.Emitter());
            this.onDidUpdateState = this._onDidUpdateState.event;
            this._onMessage = this._register(new event_1.Emitter());
            this.onMessage = this._onMessage.event;
            this._onMissingCsp = this._register(new event_1.Emitter());
            this.onMissingCsp = this._onMissingCsp.event;
            this._extension = extension;
            this._options = initialOptions;
            this._contentOptions = initialContentOptions;
        }
        get isFocused() {
            var _a;
            return !!((_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.isFocused);
        }
        dispose() {
            var _a;
            this._isDisposed = true;
            (_a = this._container) === null || _a === void 0 ? void 0 : _a.remove();
            this._container = undefined;
            for (const msg of this._firstLoadPendingMessages) {
                msg.resolve(false);
            }
            this._firstLoadPendingMessages.clear();
            this._onDidDispose.fire();
            super.dispose();
        }
        get container() {
            if (this._isDisposed) {
                throw new Error(`DynamicWebviewEditorOverlay has been disposed`);
            }
            if (!this._container) {
                this._container = document.createElement('div');
                this._container.id = `webview-${this.id}`;
                this._container.style.visibility = 'hidden';
                // Webviews cannot be reparented in the dom as it will destroy their contents.
                // Mount them to a high level node to avoid this.
                this._layoutService.container.appendChild(this._container);
            }
            return this._container;
        }
        claim(owner, scopedContextKeyService) {
            var _a, _b, _c;
            const oldOwner = this._owner;
            this._owner = owner;
            this.show();
            if (oldOwner !== owner) {
                const contextKeyService = (scopedContextKeyService || this._baseContextKeyService);
                // Explicitly clear before creating the new context.
                // Otherwise we create the new context while the old one is still around
                this._scopedContextKeyService.clear();
                this._scopedContextKeyService.value = contextKeyService.createScoped(this.container);
                (_a = this._findWidgetVisible) === null || _a === void 0 ? void 0 : _a.reset();
                this._findWidgetVisible = webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE.bindTo(contextKeyService);
                (_b = this._findWidgetEnabled) === null || _b === void 0 ? void 0 : _b.reset();
                this._findWidgetEnabled = webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_ENABLED.bindTo(contextKeyService);
                this._findWidgetEnabled.set(!!this.options.enableFindWidget);
                (_c = this._webview.value) === null || _c === void 0 ? void 0 : _c.setContextKeyService(this._scopedContextKeyService.value);
            }
        }
        release(owner) {
            if (this._owner !== owner) {
                return;
            }
            this._scopedContextKeyService.clear();
            this._owner = undefined;
            if (this._container) {
                this._container.style.visibility = 'hidden';
            }
            if (!this._options.retainContextWhenHidden) {
                this._webview.clear();
                this._webviewEvents.clear();
            }
        }
        layoutWebviewOverElement(element, dimension) {
            if (!this._container || !this._container.parentElement) {
                return;
            }
            const frameRect = element.getBoundingClientRect();
            const containerRect = this._container.parentElement.getBoundingClientRect();
            const parentBorderTop = (containerRect.height - this._container.parentElement.clientHeight) / 2.0;
            const parentBorderLeft = (containerRect.width - this._container.parentElement.clientWidth) / 2.0;
            this._container.style.position = 'absolute';
            this._container.style.overflow = 'hidden';
            this._container.style.top = `${frameRect.top - containerRect.top - parentBorderTop}px`;
            this._container.style.left = `${frameRect.left - containerRect.left - parentBorderLeft}px`;
            this._container.style.width = `${dimension ? dimension.width : frameRect.width}px`;
            this._container.style.height = `${dimension ? dimension.height : frameRect.height}px`;
        }
        show() {
            var _a;
            if (this._isDisposed) {
                throw new Error('Webview overlay is disposed');
            }
            if (!this._webview.value) {
                const webview = this._webviewService.createWebviewElement(this.id, this._options, this._contentOptions, this.extension);
                this._webview.value = webview;
                webview.state = this._state;
                if (this._scopedContextKeyService.value) {
                    this._webview.value.setContextKeyService(this._scopedContextKeyService.value);
                }
                if (this._html) {
                    webview.html = this._html;
                }
                if (this._options.tryRestoreScrollPosition) {
                    webview.initialScrollProgress = this._initialScrollProgress;
                }
                (_a = this._findWidgetEnabled) === null || _a === void 0 ? void 0 : _a.set(!!this.options.enableFindWidget);
                webview.mountTo(this.container);
                // Forward events from inner webview to outer listeners
                this._webviewEvents.clear();
                this._webviewEvents.add(webview.onDidFocus(() => { this._onDidFocus.fire(); }));
                this._webviewEvents.add(webview.onDidBlur(() => { this._onDidBlur.fire(); }));
                this._webviewEvents.add(webview.onDidClickLink(x => { this._onDidClickLink.fire(x); }));
                this._webviewEvents.add(webview.onMessage(x => { this._onMessage.fire(x); }));
                this._webviewEvents.add(webview.onMissingCsp(x => { this._onMissingCsp.fire(x); }));
                this._webviewEvents.add(webview.onDidWheel(x => { this._onDidWheel.fire(x); }));
                this._webviewEvents.add(webview.onDidReload(() => { this._onDidReload.fire(); }));
                this._webviewEvents.add(webview.onDidScroll(x => {
                    this._initialScrollProgress = x.scrollYPercentage;
                    this._onDidScroll.fire(x);
                }));
                this._webviewEvents.add(webview.onDidUpdateState(state => {
                    this._state = state;
                    this._onDidUpdateState.fire(state);
                }));
                if (this._isFirstLoad) {
                    this._firstLoadPendingMessages.forEach(async (msg) => {
                        msg.resolve(await webview.postMessage(msg.message, msg.transfer));
                    });
                }
                this._isFirstLoad = false;
                this._firstLoadPendingMessages.clear();
            }
            this.container.style.visibility = 'visible';
        }
        get html() { return this._html; }
        set html(value) {
            this._html = value;
            this.withWebview(webview => webview.html = value);
        }
        get initialScrollProgress() { return this._initialScrollProgress; }
        set initialScrollProgress(value) {
            this._initialScrollProgress = value;
            this.withWebview(webview => webview.initialScrollProgress = value);
        }
        get state() { return this._state; }
        set state(value) {
            this._state = value;
            this.withWebview(webview => webview.state = value);
        }
        get extension() { return this._extension; }
        set extension(value) {
            this._extension = value;
            this.withWebview(webview => webview.extension = value);
        }
        get options() { return this._options; }
        set options(value) { this._options = Object.assign({ customClasses: this._options.customClasses }, value); }
        get contentOptions() { return this._contentOptions; }
        set contentOptions(value) {
            this._contentOptions = value;
            this.withWebview(webview => webview.contentOptions = value);
        }
        set localResourcesRoot(resources) {
            this.withWebview(webview => webview.localResourcesRoot = resources);
        }
        async postMessage(message, transfer) {
            if (this._webview.value) {
                return this._webview.value.postMessage(message, transfer);
            }
            if (this._isFirstLoad) {
                let resolve;
                const p = new Promise(r => resolve = r);
                this._firstLoadPendingMessages.add({ message, transfer, resolve: resolve });
                return p;
            }
            return false;
        }
        focus() { var _a; (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.focus(); }
        reload() { var _a; (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.reload(); }
        selectAll() { var _a; (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.selectAll(); }
        copy() { var _a; (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.copy(); }
        paste() { var _a; (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.paste(); }
        cut() { var _a; (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.cut(); }
        undo() { var _a; (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.undo(); }
        redo() { var _a; (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.redo(); }
        showFind() {
            var _a;
            if (this._webview.value) {
                this._webview.value.showFind();
                (_a = this._findWidgetVisible) === null || _a === void 0 ? void 0 : _a.set(true);
            }
        }
        hideFind() {
            var _a, _b;
            (_a = this._findWidgetVisible) === null || _a === void 0 ? void 0 : _a.reset();
            (_b = this._webview.value) === null || _b === void 0 ? void 0 : _b.hideFind();
        }
        runFindAction(previous) { var _a; (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.runFindAction(previous); }
        withWebview(f) {
            if (this._webview.value) {
                f(this._webview.value);
            }
        }
        windowDidDragStart() {
            var _a;
            (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.windowDidDragStart();
        }
        windowDidDragEnd() {
            var _a;
            (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.windowDidDragEnd();
        }
        setContextKeyService(contextKeyService) {
            var _a;
            (_a = this._webview.value) === null || _a === void 0 ? void 0 : _a.setContextKeyService(contextKeyService);
        }
    };
    OverlayWebview = __decorate([
        __param(4, layoutService_1.ILayoutService),
        __param(5, webview_1.IWebviewService),
        __param(6, contextkey_1.IContextKeyService)
    ], OverlayWebview);
    exports.OverlayWebview = OverlayWebview;
});
//# sourceMappingURL=overlayWebview.js.map