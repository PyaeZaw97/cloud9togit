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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/common/uuid", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostWebview", "./extHost.protocol", "./extHostTypes"], function (require, exports, event_1, lifecycle_1, uri_1, uuid_1, typeConverters, extHostWebview_1, extHostProtocol, extHostTypes) {
    "use strict";
    var _ExtHostWebviewPanel_handle, _ExtHostWebviewPanel_proxy, _ExtHostWebviewPanel_viewType, _ExtHostWebviewPanel_webview, _ExtHostWebviewPanel_options, _ExtHostWebviewPanel_title, _ExtHostWebviewPanel_iconPath, _ExtHostWebviewPanel_viewColumn, _ExtHostWebviewPanel_visible, _ExtHostWebviewPanel_active, _ExtHostWebviewPanel_isDisposed, _ExtHostWebviewPanel_onDidDispose, _ExtHostWebviewPanel_onDidChangeViewState;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostWebviewPanels = void 0;
    class ExtHostWebviewPanel extends lifecycle_1.Disposable {
        constructor(handle, proxy, webview, params) {
            super();
            _ExtHostWebviewPanel_handle.set(this, void 0);
            _ExtHostWebviewPanel_proxy.set(this, void 0);
            _ExtHostWebviewPanel_viewType.set(this, void 0);
            _ExtHostWebviewPanel_webview.set(this, void 0);
            _ExtHostWebviewPanel_options.set(this, void 0);
            _ExtHostWebviewPanel_title.set(this, void 0);
            _ExtHostWebviewPanel_iconPath.set(this, void 0);
            _ExtHostWebviewPanel_viewColumn.set(this, undefined);
            _ExtHostWebviewPanel_visible.set(this, true);
            _ExtHostWebviewPanel_active.set(this, void 0);
            _ExtHostWebviewPanel_isDisposed.set(this, false);
            _ExtHostWebviewPanel_onDidDispose.set(this, this._register(new event_1.Emitter()));
            this.onDidDispose = __classPrivateFieldGet(this, _ExtHostWebviewPanel_onDidDispose, "f").event;
            _ExtHostWebviewPanel_onDidChangeViewState.set(this, this._register(new event_1.Emitter()));
            this.onDidChangeViewState = __classPrivateFieldGet(this, _ExtHostWebviewPanel_onDidChangeViewState, "f").event;
            __classPrivateFieldSet(this, _ExtHostWebviewPanel_handle, handle, "f");
            __classPrivateFieldSet(this, _ExtHostWebviewPanel_proxy, proxy, "f");
            __classPrivateFieldSet(this, _ExtHostWebviewPanel_webview, webview, "f");
            __classPrivateFieldSet(this, _ExtHostWebviewPanel_viewType, params.viewType, "f");
            __classPrivateFieldSet(this, _ExtHostWebviewPanel_options, params.panelOptions, "f");
            __classPrivateFieldSet(this, _ExtHostWebviewPanel_viewColumn, params.viewColumn, "f");
            __classPrivateFieldSet(this, _ExtHostWebviewPanel_title, params.title, "f");
            __classPrivateFieldSet(this, _ExtHostWebviewPanel_active, params.active, "f");
        }
        dispose() {
            if (__classPrivateFieldGet(this, _ExtHostWebviewPanel_isDisposed, "f")) {
                return;
            }
            __classPrivateFieldSet(this, _ExtHostWebviewPanel_isDisposed, true, "f");
            __classPrivateFieldGet(this, _ExtHostWebviewPanel_onDidDispose, "f").fire();
            __classPrivateFieldGet(this, _ExtHostWebviewPanel_proxy, "f").$disposeWebview(__classPrivateFieldGet(this, _ExtHostWebviewPanel_handle, "f"));
            __classPrivateFieldGet(this, _ExtHostWebviewPanel_webview, "f").dispose();
            super.dispose();
        }
        get webview() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _ExtHostWebviewPanel_webview, "f");
        }
        get viewType() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _ExtHostWebviewPanel_viewType, "f");
        }
        get title() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _ExtHostWebviewPanel_title, "f");
        }
        set title(value) {
            this.assertNotDisposed();
            if (__classPrivateFieldGet(this, _ExtHostWebviewPanel_title, "f") !== value) {
                __classPrivateFieldSet(this, _ExtHostWebviewPanel_title, value, "f");
                __classPrivateFieldGet(this, _ExtHostWebviewPanel_proxy, "f").$setTitle(__classPrivateFieldGet(this, _ExtHostWebviewPanel_handle, "f"), value);
            }
        }
        get iconPath() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _ExtHostWebviewPanel_iconPath, "f");
        }
        set iconPath(value) {
            this.assertNotDisposed();
            if (__classPrivateFieldGet(this, _ExtHostWebviewPanel_iconPath, "f") !== value) {
                __classPrivateFieldSet(this, _ExtHostWebviewPanel_iconPath, value, "f");
                __classPrivateFieldGet(this, _ExtHostWebviewPanel_proxy, "f").$setIconPath(__classPrivateFieldGet(this, _ExtHostWebviewPanel_handle, "f"), uri_1.URI.isUri(value) ? { light: value, dark: value } : value);
            }
        }
        get options() {
            return __classPrivateFieldGet(this, _ExtHostWebviewPanel_options, "f");
        }
        get viewColumn() {
            this.assertNotDisposed();
            if (typeof __classPrivateFieldGet(this, _ExtHostWebviewPanel_viewColumn, "f") === 'number' && __classPrivateFieldGet(this, _ExtHostWebviewPanel_viewColumn, "f") < 0) {
                // We are using a symbolic view column
                // Return undefined instead to indicate that the real view column is currently unknown but will be resolved.
                return undefined;
            }
            return __classPrivateFieldGet(this, _ExtHostWebviewPanel_viewColumn, "f");
        }
        get active() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _ExtHostWebviewPanel_active, "f");
        }
        get visible() {
            this.assertNotDisposed();
            return __classPrivateFieldGet(this, _ExtHostWebviewPanel_visible, "f");
        }
        _updateViewState(newState) {
            if (__classPrivateFieldGet(this, _ExtHostWebviewPanel_isDisposed, "f")) {
                return;
            }
            if (this.active !== newState.active || this.visible !== newState.visible || this.viewColumn !== newState.viewColumn) {
                __classPrivateFieldSet(this, _ExtHostWebviewPanel_active, newState.active, "f");
                __classPrivateFieldSet(this, _ExtHostWebviewPanel_visible, newState.visible, "f");
                __classPrivateFieldSet(this, _ExtHostWebviewPanel_viewColumn, newState.viewColumn, "f");
                __classPrivateFieldGet(this, _ExtHostWebviewPanel_onDidChangeViewState, "f").fire({ webviewPanel: this });
            }
        }
        reveal(viewColumn, preserveFocus) {
            this.assertNotDisposed();
            __classPrivateFieldGet(this, _ExtHostWebviewPanel_proxy, "f").$reveal(__classPrivateFieldGet(this, _ExtHostWebviewPanel_handle, "f"), {
                viewColumn: typeof viewColumn === 'undefined' ? undefined : typeConverters.ViewColumn.from(viewColumn),
                preserveFocus: !!preserveFocus
            });
        }
        assertNotDisposed() {
            if (__classPrivateFieldGet(this, _ExtHostWebviewPanel_isDisposed, "f")) {
                throw new Error('Webview is disposed');
            }
        }
    }
    _ExtHostWebviewPanel_handle = new WeakMap(), _ExtHostWebviewPanel_proxy = new WeakMap(), _ExtHostWebviewPanel_viewType = new WeakMap(), _ExtHostWebviewPanel_webview = new WeakMap(), _ExtHostWebviewPanel_options = new WeakMap(), _ExtHostWebviewPanel_title = new WeakMap(), _ExtHostWebviewPanel_iconPath = new WeakMap(), _ExtHostWebviewPanel_viewColumn = new WeakMap(), _ExtHostWebviewPanel_visible = new WeakMap(), _ExtHostWebviewPanel_active = new WeakMap(), _ExtHostWebviewPanel_isDisposed = new WeakMap(), _ExtHostWebviewPanel_onDidDispose = new WeakMap(), _ExtHostWebviewPanel_onDidChangeViewState = new WeakMap();
    class ExtHostWebviewPanels {
        constructor(mainContext, webviews, workspace) {
            this.webviews = webviews;
            this.workspace = workspace;
            this._webviewPanels = new Map();
            this._serializers = new Map();
            this._proxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadWebviewPanels);
        }
        static newHandle() {
            return (0, uuid_1.generateUuid)();
        }
        createWebviewPanel(extension, viewType, title, showOptions, options = {}) {
            const viewColumn = typeof showOptions === 'object' ? showOptions.viewColumn : showOptions;
            const webviewShowOptions = {
                viewColumn: typeConverters.ViewColumn.from(viewColumn),
                preserveFocus: typeof showOptions === 'object' && !!showOptions.preserveFocus
            };
            const serializeBuffersForPostMessage = (0, extHostWebview_1.shouldSerializeBuffersForPostMessage)(extension);
            const handle = ExtHostWebviewPanels.newHandle();
            this._proxy.$createWebviewPanel((0, extHostWebview_1.toExtensionData)(extension), handle, viewType, {
                title,
                panelOptions: serializeWebviewPanelOptions(options),
                webviewOptions: (0, extHostWebview_1.serializeWebviewOptions)(extension, this.workspace, options),
                serializeBuffersForPostMessage,
            }, webviewShowOptions);
            const webview = this.webviews.createNewWebview(handle, options, extension);
            const panel = this.createNewWebviewPanel(handle, viewType, title, viewColumn, options, webview, true);
            return panel;
        }
        $onDidChangeWebviewPanelViewStates(newStates) {
            const handles = Object.keys(newStates);
            // Notify webviews of state changes in the following order:
            // - Non-visible
            // - Visible
            // - Active
            handles.sort((a, b) => {
                const stateA = newStates[a];
                const stateB = newStates[b];
                if (stateA.active) {
                    return 1;
                }
                if (stateB.active) {
                    return -1;
                }
                return (+stateA.visible) - (+stateB.visible);
            });
            for (const handle of handles) {
                const panel = this.getWebviewPanel(handle);
                if (!panel) {
                    continue;
                }
                const newState = newStates[handle];
                panel._updateViewState({
                    active: newState.active,
                    visible: newState.visible,
                    viewColumn: typeConverters.ViewColumn.to(newState.position),
                });
            }
        }
        async $onDidDisposeWebviewPanel(handle) {
            const panel = this.getWebviewPanel(handle);
            panel === null || panel === void 0 ? void 0 : panel.dispose();
            this._webviewPanels.delete(handle);
            this.webviews.deleteWebview(handle);
        }
        registerWebviewPanelSerializer(extension, viewType, serializer) {
            if (this._serializers.has(viewType)) {
                throw new Error(`Serializer for '${viewType}' already registered`);
            }
            this._serializers.set(viewType, { serializer, extension });
            this._proxy.$registerSerializer(viewType, {
                serializeBuffersForPostMessage: (0, extHostWebview_1.shouldSerializeBuffersForPostMessage)(extension)
            });
            return new extHostTypes.Disposable(() => {
                this._serializers.delete(viewType);
                this._proxy.$unregisterSerializer(viewType);
            });
        }
        async $deserializeWebviewPanel(webviewHandle, viewType, initData, position) {
            const entry = this._serializers.get(viewType);
            if (!entry) {
                throw new Error(`No serializer found for '${viewType}'`);
            }
            const { serializer, extension } = entry;
            const webview = this.webviews.createNewWebview(webviewHandle, initData.webviewOptions, extension);
            const revivedPanel = this.createNewWebviewPanel(webviewHandle, viewType, initData.title, position, initData.panelOptions, webview, initData.active);
            await serializer.deserializeWebviewPanel(revivedPanel, initData.state);
        }
        createNewWebviewPanel(webviewHandle, viewType, title, position, options, webview, active) {
            const panel = new ExtHostWebviewPanel(webviewHandle, this._proxy, webview, { viewType, title, viewColumn: position, panelOptions: options, active });
            this._webviewPanels.set(webviewHandle, panel);
            return panel;
        }
        getWebviewPanel(handle) {
            return this._webviewPanels.get(handle);
        }
    }
    exports.ExtHostWebviewPanels = ExtHostWebviewPanels;
    function serializeWebviewPanelOptions(options) {
        return {
            enableFindWidget: options.enableFindWidget,
            retainContextWhenHidden: options.retainContextWhenHidden,
        };
    }
});
//# sourceMappingURL=extHostWebviewPanels.js.map