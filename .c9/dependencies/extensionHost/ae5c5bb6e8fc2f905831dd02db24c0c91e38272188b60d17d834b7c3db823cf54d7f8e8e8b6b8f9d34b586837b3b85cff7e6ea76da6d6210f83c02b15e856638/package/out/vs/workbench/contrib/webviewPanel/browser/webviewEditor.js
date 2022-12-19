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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/uuid", "vs/platform/contextkey/common/contextkey", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/webview/browser/webviewWindowDragMonitor", "vs/workbench/contrib/webviewPanel/browser/webviewEditorInput", "vs/workbench/services/editor/browser/editorDropService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/host/browser/host", "vs/workbench/services/layout/browser/layoutService"], function (require, exports, DOM, event_1, lifecycle_1, platform_1, uuid_1, contextkey_1, storage_1, telemetry_1, themeService_1, editorPane_1, webviewWindowDragMonitor_1, webviewEditorInput_1, editorDropService_1, editorService_1, host_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewEditor = void 0;
    let WebviewEditor = class WebviewEditor extends editorPane_1.EditorPane {
        constructor(telemetryService, themeService, storageService, _editorService, _workbenchLayoutService, _editorDropService, _hostService, _contextKeyService) {
            super(WebviewEditor.ID, telemetryService, themeService, storageService);
            this._editorService = _editorService;
            this._workbenchLayoutService = _workbenchLayoutService;
            this._editorDropService = _editorDropService;
            this._hostService = _hostService;
            this._contextKeyService = _contextKeyService;
            this._visible = false;
            this._isDisposed = false;
            this._webviewVisibleDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onFocusWindowHandler = this._register(new lifecycle_1.MutableDisposable());
            this._onDidFocusWebview = this._register(new event_1.Emitter());
            this._scopedContextKeyService = this._register(new lifecycle_1.MutableDisposable());
        }
        get onDidFocus() { return this._onDidFocusWebview.event; }
        get webview() {
            return this.input instanceof webviewEditorInput_1.WebviewInput ? this.input.webview : undefined;
        }
        get scopedContextKeyService() {
            return this._scopedContextKeyService.value;
        }
        createEditor(parent) {
            const element = document.createElement('div');
            this._element = element;
            this._element.id = `webview-editor-element-${(0, uuid_1.generateUuid)()}`;
            parent.appendChild(element);
            this._scopedContextKeyService.value = this._contextKeyService.createScoped(element);
        }
        dispose() {
            var _a;
            this._isDisposed = true;
            (_a = this._element) === null || _a === void 0 ? void 0 : _a.remove();
            this._element = undefined;
            super.dispose();
        }
        layout(dimension) {
            this._dimension = dimension;
            if (this.webview && this._visible) {
                this.synchronizeWebviewContainerDimensions(this.webview, dimension);
            }
        }
        focus() {
            var _a;
            super.focus();
            if (!this._onFocusWindowHandler.value && !platform_1.isWeb) {
                // Make sure we restore focus when switching back to a VS Code window
                this._onFocusWindowHandler.value = this._hostService.onDidChangeFocus(focused => {
                    if (focused && this._editorService.activeEditorPane === this && this._workbenchLayoutService.hasFocus("workbench.parts.editor" /* Parts.EDITOR_PART */)) {
                        this.focus();
                    }
                });
            }
            (_a = this.webview) === null || _a === void 0 ? void 0 : _a.focus();
        }
        setEditorVisible(visible, group) {
            this._visible = visible;
            if (this.input instanceof webviewEditorInput_1.WebviewInput && this.webview) {
                if (visible) {
                    this.claimWebview(this.input);
                }
                else {
                    this.webview.release(this);
                }
            }
            super.setEditorVisible(visible, group);
        }
        clearInput() {
            if (this.webview) {
                this.webview.release(this);
                this._webviewVisibleDisposables.clear();
            }
            super.clearInput();
        }
        async setInput(input, options, context, token) {
            if (this.input && input.matches(this.input)) {
                return;
            }
            const alreadyOwnsWebview = input instanceof webviewEditorInput_1.WebviewInput && input.webview === this.webview;
            if (this.webview && !alreadyOwnsWebview) {
                this.webview.release(this);
            }
            await super.setInput(input, options, context, token);
            await input.resolve();
            if (token.isCancellationRequested || this._isDisposed) {
                return;
            }
            if (input instanceof webviewEditorInput_1.WebviewInput) {
                if (this.group) {
                    input.updateGroup(this.group.id);
                }
                if (!alreadyOwnsWebview) {
                    this.claimWebview(input);
                }
                if (this._dimension) {
                    this.layout(this._dimension);
                }
            }
        }
        claimWebview(input) {
            input.webview.claim(this, this.scopedContextKeyService);
            if (this._element) {
                this._element.setAttribute('aria-flowto', input.webview.container.id);
                DOM.setParentFlowTo(input.webview.container, this._element);
            }
            this._webviewVisibleDisposables.clear();
            // Webviews are not part of the normal editor dom, so we have to register our own drag and drop handler on them.
            this._webviewVisibleDisposables.add(this._editorDropService.createEditorDropTarget(input.webview.container, {
                containsGroup: (group) => { var _a; return ((_a = this.group) === null || _a === void 0 ? void 0 : _a.id) === group.id; }
            }));
            this._webviewVisibleDisposables.add(new webviewWindowDragMonitor_1.WebviewWindowDragMonitor(() => this.webview));
            this.synchronizeWebviewContainerDimensions(input.webview);
            this._webviewVisibleDisposables.add(this.trackFocus(input.webview));
        }
        synchronizeWebviewContainerDimensions(webview, dimension) {
            if (this._element) {
                webview.layoutWebviewOverElement(this._element.parentElement, dimension);
            }
        }
        trackFocus(webview) {
            const store = new lifecycle_1.DisposableStore();
            // Track focus in webview content
            const webviewContentFocusTracker = DOM.trackFocus(webview.container);
            store.add(webviewContentFocusTracker);
            store.add(webviewContentFocusTracker.onDidFocus(() => this._onDidFocusWebview.fire()));
            // Track focus in webview element
            store.add(webview.onDidFocus(() => this._onDidFocusWebview.fire()));
            return store;
        }
    };
    WebviewEditor.ID = 'WebviewEditor';
    WebviewEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, storage_1.IStorageService),
        __param(3, editorService_1.IEditorService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, editorDropService_1.IEditorDropService),
        __param(6, host_1.IHostService),
        __param(7, contextkey_1.IContextKeyService)
    ], WebviewEditor);
    exports.WebviewEditor = WebviewEditor;
});
//# sourceMappingURL=webviewEditor.js.map