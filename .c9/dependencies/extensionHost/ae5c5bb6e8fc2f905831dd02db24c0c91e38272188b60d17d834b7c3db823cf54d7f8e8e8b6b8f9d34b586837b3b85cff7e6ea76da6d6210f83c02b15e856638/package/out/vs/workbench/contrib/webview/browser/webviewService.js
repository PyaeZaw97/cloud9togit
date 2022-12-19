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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/webview/browser/themeing", "vs/workbench/contrib/webview/browser/webviewElement", "./overlayWebview"], function (require, exports, event_1, lifecycle_1, instantiation_1, themeing_1, webviewElement_1, overlayWebview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewService = void 0;
    let WebviewService = class WebviewService extends lifecycle_1.Disposable {
        constructor(_instantiationService) {
            super();
            this._instantiationService = _instantiationService;
            this._webviews = new Set();
            this._onDidChangeActiveWebview = this._register(new event_1.Emitter());
            this.onDidChangeActiveWebview = this._onDidChangeActiveWebview.event;
            this._webviewThemeDataProvider = this._instantiationService.createInstance(themeing_1.WebviewThemeDataProvider);
        }
        get activeWebview() { return this._activeWebview; }
        updateActiveWebview(value) {
            if (value !== this._activeWebview) {
                this._activeWebview = value;
                this._onDidChangeActiveWebview.fire(value);
            }
        }
        get webviews() {
            return this._webviews.values();
        }
        createWebviewElement(id, options, contentOptions, extension) {
            const webview = this._instantiationService.createInstance(webviewElement_1.WebviewElement, id, options, contentOptions, extension, this._webviewThemeDataProvider);
            this.registerNewWebview(webview);
            return webview;
        }
        createWebviewOverlay(id, options, contentOptions, extension) {
            const webview = this._instantiationService.createInstance(overlayWebview_1.OverlayWebview, id, options, contentOptions, extension);
            this.registerNewWebview(webview);
            return webview;
        }
        registerNewWebview(webview) {
            this._webviews.add(webview);
            webview.onDidFocus(() => {
                this.updateActiveWebview(webview);
            });
            const onBlur = () => {
                if (this._activeWebview === webview) {
                    this.updateActiveWebview(undefined);
                }
            };
            webview.onDidBlur(onBlur);
            webview.onDidDispose(() => {
                onBlur();
                this._webviews.delete(webview);
            });
        }
    };
    WebviewService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], WebviewService);
    exports.WebviewService = WebviewService;
});
//# sourceMappingURL=webviewService.js.map