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
define(["require", "exports", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/workbench/api/browser/mainThreadWebviews", "vs/workbench/api/common/extHost.protocol", "vs/workbench/contrib/webviewView/browser/webviewViewService"], function (require, exports, errors_1, lifecycle_1, mainThreadWebviews_1, extHostProtocol, webviewViewService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadWebviewsViews = void 0;
    let MainThreadWebviewsViews = class MainThreadWebviewsViews extends lifecycle_1.Disposable {
        constructor(context, mainThreadWebviews, _webviewViewService) {
            super();
            this.mainThreadWebviews = mainThreadWebviews;
            this._webviewViewService = _webviewViewService;
            this._webviewViews = new Map();
            this._webviewViewProviders = new Map();
            this._proxy = context.getProxy(extHostProtocol.ExtHostContext.ExtHostWebviewViews);
        }
        dispose() {
            super.dispose();
            (0, lifecycle_1.dispose)(this._webviewViewProviders.values());
            this._webviewViewProviders.clear();
            (0, lifecycle_1.dispose)(this._webviewViews.values());
        }
        $setWebviewViewTitle(handle, value) {
            const webviewView = this.getWebviewView(handle);
            webviewView.title = value;
        }
        $setWebviewViewDescription(handle, value) {
            const webviewView = this.getWebviewView(handle);
            webviewView.description = value;
        }
        $setWebviewViewBadge(handle, badge) {
            const webviewView = this.getWebviewView(handle);
            webviewView.badge = badge;
        }
        $show(handle, preserveFocus) {
            const webviewView = this.getWebviewView(handle);
            webviewView.show(preserveFocus);
        }
        $registerWebviewViewProvider(extensionData, viewType, options) {
            if (this._webviewViewProviders.has(viewType)) {
                throw new Error(`View provider for ${viewType} already registered`);
            }
            const extension = (0, mainThreadWebviews_1.reviveWebviewExtension)(extensionData);
            const registration = this._webviewViewService.register(viewType, {
                resolve: async (webviewView, cancellation) => {
                    const handle = webviewView.webview.id;
                    this._webviewViews.set(handle, webviewView);
                    this.mainThreadWebviews.addWebview(handle, webviewView.webview, { serializeBuffersForPostMessage: options.serializeBuffersForPostMessage });
                    let state = undefined;
                    if (webviewView.webview.state) {
                        try {
                            state = JSON.parse(webviewView.webview.state);
                        }
                        catch (e) {
                            console.error('Could not load webview state', e, webviewView.webview.state);
                        }
                    }
                    webviewView.webview.extension = extension;
                    if (options) {
                        webviewView.webview.options = options;
                    }
                    webviewView.onDidChangeVisibility(visible => {
                        this._proxy.$onDidChangeWebviewViewVisibility(handle, visible);
                    });
                    webviewView.onDispose(() => {
                        this._proxy.$disposeWebviewView(handle);
                        this._webviewViews.delete(handle);
                    });
                    try {
                        await this._proxy.$resolveWebviewView(handle, viewType, webviewView.title, state, cancellation);
                    }
                    catch (error) {
                        (0, errors_1.onUnexpectedError)(error);
                        webviewView.webview.html = this.mainThreadWebviews.getWebviewResolvedFailedContent(viewType);
                    }
                }
            });
            this._webviewViewProviders.set(viewType, registration);
        }
        $unregisterWebviewViewProvider(viewType) {
            const provider = this._webviewViewProviders.get(viewType);
            if (!provider) {
                throw new Error(`No view provider for ${viewType} registered`);
            }
            provider.dispose();
            this._webviewViewProviders.delete(viewType);
        }
        getWebviewView(handle) {
            const webviewView = this._webviewViews.get(handle);
            if (!webviewView) {
                throw new Error('unknown webview view');
            }
            return webviewView;
        }
    };
    MainThreadWebviewsViews = __decorate([
        __param(2, webviewViewService_1.IWebviewViewService)
    ], MainThreadWebviewsViews);
    exports.MainThreadWebviewsViews = MainThreadWebviewsViews;
});
//# sourceMappingURL=mainThreadWebviewViews.js.map