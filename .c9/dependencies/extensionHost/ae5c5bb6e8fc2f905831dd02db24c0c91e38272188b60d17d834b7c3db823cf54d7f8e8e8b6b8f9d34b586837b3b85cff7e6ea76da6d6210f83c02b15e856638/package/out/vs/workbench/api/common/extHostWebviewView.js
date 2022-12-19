/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/api/common/extHostWebview", "vs/workbench/services/extensions/common/extensions", "vs/workbench/api/common/extHostTypeConverters", "./extHost.protocol", "./extHostTypes"], function (require, exports, event_1, lifecycle_1, extHostWebview_1, extensions_1, extHostTypeConverters_1, extHostProtocol, extHostTypes) {
    "use strict";
    var _ExtHostWebviewView_handle, _ExtHostWebviewView_proxy, _ExtHostWebviewView_viewType, _ExtHostWebviewView_webview, _ExtHostWebviewView_extension, _ExtHostWebviewView_isDisposed, _ExtHostWebviewView_isVisible, _ExtHostWebviewView_title, _ExtHostWebviewView_description, _ExtHostWebviewView_badge, _ExtHostWebviewView_onDidChangeVisibility, _ExtHostWebviewView_onDidDispose;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostWebviewViews = void 0;
    class ExtHostWebviewView extends lifecycle_1.Disposable {
        constructor(handle, proxy, viewType, title, webview, extension, isVisible) {
            super();
            _ExtHostWebviewView_handle.set(this, void 0);
            _ExtHostWebviewView_proxy.set(this, void 0);
            _ExtHostWebviewView_viewType.set(this, void 0);
            _ExtHostWebviewView_webview.set(this, void 0);
            _ExtHostWebviewView_extension.set(this, void 0);
            _ExtHostWebviewView_isDisposed.set(this, false);
            _ExtHostWebviewView_isVisible.set(this, void 0);
            _ExtHostWebviewView_title.set(this, void 0);
            _ExtHostWebviewView_description.set(this, void 0);
            _ExtHostWebviewView_badge.set(this, void 0);
            _ExtHostWebviewView_onDidChangeVisibility.set(this, this._register(new event_1.Emitter()));
            this.onDidChangeVisibility = __classPrivateFieldGet(this, _ExtHostWebviewView_onDidChangeVisibility, "f").event;
            _ExtHostWebviewView_onDidDispose.set(this, this._register(new event_1.Emitter()));
            this.onDidDispose = __classPrivateFieldGet(this, _ExtHostWebviewView_onDidDispose, "f").event;
            __classPrivateFieldSet(this, _ExtHostWebviewView_viewType, viewType, "f");
            __classPrivateFieldSet(this, _ExtHostWebviewView_title, title, "f");
            __classPrivateFieldSet(this, _ExtHostWebviewView_handle, handle, "f");
            __classPrivateFieldSet(this, _ExtHostWebviewView_proxy, proxy, "f");
            __classPrivateFieldSet(this, _ExtHostWebviewView_webview, webview, "f");
            __classPrivateFieldSet(this, _ExtHostWebviewView_extension, extension, "f");
            __classPrivateFieldSet(this, _ExtHostWebviewView_isVisible, isVisible, "f");
        }
        dispose() {
            if (__classPrivateFieldGet(this, _ExtHostWebviewView_isDisposed, "f")) {
                return;
            }
            __classPrivateFieldSet(this, _ExtHostWebviewView_isDisposed, true, "f");
            __classPrivateFieldGet(this, _ExtHostWebviewView_onDidDispose, "f").fire();
            __classPrivateFieldGet(this, _ExtHostWebviewView_webview, "f").dispose();
            super.dispose();
        }
        get title() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _ExtHostWebviewView_title, "f");
        }
        set title(value) {
            this.assertNotDisposed();
            if (__classPrivateFieldGet(this, _ExtHostWebviewView_title, "f") !== value) {
                __classPrivateFieldSet(this, _ExtHostWebviewView_title, value, "f");
                __classPrivateFieldGet(this, _ExtHostWebviewView_proxy, "f").$setWebviewViewTitle(__classPrivateFieldGet(this, _ExtHostWebviewView_handle, "f"), value);
            }
        }
        get description() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _ExtHostWebviewView_description, "f");
        }
        set description(value) {
            this.assertNotDisposed();
            if (__classPrivateFieldGet(this, _ExtHostWebviewView_description, "f") !== value) {
                __classPrivateFieldSet(this, _ExtHostWebviewView_description, value, "f");
                __classPrivateFieldGet(this, _ExtHostWebviewView_proxy, "f").$setWebviewViewDescription(__classPrivateFieldGet(this, _ExtHostWebviewView_handle, "f"), value);
            }
        }
        get visible() { return __classPrivateFieldGet(this, _ExtHostWebviewView_isVisible, "f"); }
        get webview() { return __classPrivateFieldGet(this, _ExtHostWebviewView_webview, "f"); }
        get viewType() { return __classPrivateFieldGet(this, _ExtHostWebviewView_viewType, "f"); }
        /* internal */ _setVisible(visible) {
            if (visible === __classPrivateFieldGet(this, _ExtHostWebviewView_isVisible, "f") || __classPrivateFieldGet(this, _ExtHostWebviewView_isDisposed, "f")) {
                return;
            }
            __classPrivateFieldSet(this, _ExtHostWebviewView_isVisible, visible, "f");
            __classPrivateFieldGet(this, _ExtHostWebviewView_onDidChangeVisibility, "f").fire();
        }
        get badge() {
            this.assertNotDisposed();
            (0, extensions_1.checkProposedApiEnabled)(__classPrivateFieldGet(this, _ExtHostWebviewView_extension, "f"), 'badges');
            return __classPrivateFieldGet(this, _ExtHostWebviewView_badge, "f");
        }
        set badge(badge) {
            var _a, _b;
            this.assertNotDisposed();
            (0, extensions_1.checkProposedApiEnabled)(__classPrivateFieldGet(this, _ExtHostWebviewView_extension, "f"), 'badges');
            if ((badge === null || badge === void 0 ? void 0 : badge.value) === ((_a = __classPrivateFieldGet(this, _ExtHostWebviewView_badge, "f")) === null || _a === void 0 ? void 0 : _a.value) &&
                (badge === null || badge === void 0 ? void 0 : badge.tooltip) === ((_b = __classPrivateFieldGet(this, _ExtHostWebviewView_badge, "f")) === null || _b === void 0 ? void 0 : _b.tooltip)) {
                return;
            }
            __classPrivateFieldSet(this, _ExtHostWebviewView_badge, extHostTypeConverters_1.ViewBadge.from(badge), "f");
            __classPrivateFieldGet(this, _ExtHostWebviewView_proxy, "f").$setWebviewViewBadge(__classPrivateFieldGet(this, _ExtHostWebviewView_handle, "f"), badge);
        }
        show(preserveFocus) {
            this.assertNotDisposed();
            __classPrivateFieldGet(this, _ExtHostWebviewView_proxy, "f").$show(__classPrivateFieldGet(this, _ExtHostWebviewView_handle, "f"), !!preserveFocus);
        }
        assertNotDisposed() {
            if (__classPrivateFieldGet(this, _ExtHostWebviewView_isDisposed, "f")) {
                throw new Error('Webview is disposed');
            }
        }
    }
    _ExtHostWebviewView_handle = new WeakMap(), _ExtHostWebviewView_proxy = new WeakMap(), _ExtHostWebviewView_viewType = new WeakMap(), _ExtHostWebviewView_webview = new WeakMap(), _ExtHostWebviewView_extension = new WeakMap(), _ExtHostWebviewView_isDisposed = new WeakMap(), _ExtHostWebviewView_isVisible = new WeakMap(), _ExtHostWebviewView_title = new WeakMap(), _ExtHostWebviewView_description = new WeakMap(), _ExtHostWebviewView_badge = new WeakMap(), _ExtHostWebviewView_onDidChangeVisibility = new WeakMap(), _ExtHostWebviewView_onDidDispose = new WeakMap();
    class ExtHostWebviewViews {
        constructor(mainContext, _extHostWebview) {
            this._extHostWebview = _extHostWebview;
            this._viewProviders = new Map();
            this._webviewViews = new Map();
            this._proxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadWebviewViews);
        }
        registerWebviewViewProvider(extension, viewType, provider, webviewOptions) {
            if (this._viewProviders.has(viewType)) {
                throw new Error(`View provider for '${viewType}' already registered`);
            }
            this._viewProviders.set(viewType, { provider, extension });
            this._proxy.$registerWebviewViewProvider((0, extHostWebview_1.toExtensionData)(extension), viewType, {
                retainContextWhenHidden: webviewOptions === null || webviewOptions === void 0 ? void 0 : webviewOptions.retainContextWhenHidden,
                serializeBuffersForPostMessage: false,
            });
            return new extHostTypes.Disposable(() => {
                this._viewProviders.delete(viewType);
                this._proxy.$unregisterWebviewViewProvider(viewType);
            });
        }
        async $resolveWebviewView(webviewHandle, viewType, title, state, cancellation) {
            const entry = this._viewProviders.get(viewType);
            if (!entry) {
                throw new Error(`No view provider found for '${viewType}'`);
            }
            const { provider, extension } = entry;
            const webview = this._extHostWebview.createNewWebview(webviewHandle, { /* todo */}, extension);
            const revivedView = new ExtHostWebviewView(webviewHandle, this._proxy, viewType, title, webview, extension, true);
            this._webviewViews.set(webviewHandle, revivedView);
            await provider.resolveWebviewView(revivedView, { state }, cancellation);
        }
        async $onDidChangeWebviewViewVisibility(webviewHandle, visible) {
            const webviewView = this.getWebviewView(webviewHandle);
            webviewView._setVisible(visible);
        }
        async $disposeWebviewView(webviewHandle) {
            const webviewView = this.getWebviewView(webviewHandle);
            this._webviewViews.delete(webviewHandle);
            webviewView.dispose();
            this._extHostWebview.deleteWebview(webviewHandle);
        }
        getWebviewView(handle) {
            const entry = this._webviewViews.get(handle);
            if (!entry) {
                throw new Error('No webview found');
            }
            return entry;
        }
    }
    exports.ExtHostWebviewViews = ExtHostWebviewViews;
});
//# sourceMappingURL=extHostWebviewView.js.map