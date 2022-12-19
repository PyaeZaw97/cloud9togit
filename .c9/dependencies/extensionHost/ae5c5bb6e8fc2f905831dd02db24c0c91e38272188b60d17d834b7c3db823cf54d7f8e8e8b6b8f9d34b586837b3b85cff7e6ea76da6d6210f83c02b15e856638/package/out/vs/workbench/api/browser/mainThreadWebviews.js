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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/nls", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostWebviewMessaging", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, lifecycle_1, network_1, platform_1, strings_1, uri_1, nls_1, opener_1, productService_1, extHostProtocol, extHostWebviewMessaging_1, proxyIdentifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reviveWebviewContentOptions = exports.reviveWebviewExtension = exports.MainThreadWebviews = void 0;
    let MainThreadWebviews = class MainThreadWebviews extends lifecycle_1.Disposable {
        constructor(context, _openerService, _productService) {
            super();
            this._openerService = _openerService;
            this._productService = _productService;
            this._webviews = new Map();
            this._proxy = context.getProxy(extHostProtocol.ExtHostContext.ExtHostWebviews);
        }
        addWebview(handle, webview, options) {
            if (this._webviews.has(handle)) {
                throw new Error('Webview already registered');
            }
            this._webviews.set(handle, webview);
            this.hookupWebviewEventDelegate(handle, webview, options);
        }
        $setHtml(handle, value) {
            const webview = this.getWebview(handle);
            webview.html = value;
        }
        $setOptions(handle, options) {
            const webview = this.getWebview(handle);
            webview.contentOptions = reviveWebviewContentOptions(options);
        }
        async $postMessage(handle, jsonMessage, ...buffers) {
            const webview = this.getWebview(handle);
            const { message, arrayBuffers } = (0, extHostWebviewMessaging_1.deserializeWebviewMessage)(jsonMessage, buffers);
            return webview.postMessage(message, arrayBuffers);
        }
        hookupWebviewEventDelegate(handle, webview, options) {
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(webview.onDidClickLink((uri) => this.onDidClickLink(handle, uri)));
            disposables.add(webview.onMessage((message) => {
                const serialized = (0, extHostWebviewMessaging_1.serializeWebviewMessage)(message.message, options);
                this._proxy.$onMessage(handle, serialized.message, new proxyIdentifier_1.SerializableObjectWithBuffers(serialized.buffers));
            }));
            disposables.add(webview.onMissingCsp((extension) => this._proxy.$onMissingCsp(handle, extension.value)));
            disposables.add(webview.onDidDispose(() => {
                disposables.dispose();
                this._webviews.delete(handle);
            }));
        }
        onDidClickLink(handle, link) {
            const webview = this.getWebview(handle);
            if (this.isSupportedLink(webview, uri_1.URI.parse(link))) {
                this._openerService.open(link, { fromUserGesture: true, allowContributedOpeners: true, allowCommands: true });
            }
        }
        isSupportedLink(webview, link) {
            if (MainThreadWebviews.standardSupportedLinkSchemes.has(link.scheme)) {
                return true;
            }
            if (!platform_1.isWeb && this._productService.urlProtocol === link.scheme) {
                return true;
            }
            return !!webview.contentOptions.enableCommandUris && link.scheme === network_1.Schemas.command;
        }
        getWebview(handle) {
            const webview = this._webviews.get(handle);
            if (!webview) {
                throw new Error(`Unknown webview handle:${handle}`);
            }
            return webview;
        }
        getWebviewResolvedFailedContent(viewType) {
            return `<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none';">
			</head>
			<body>${(0, nls_1.localize)('errorMessage', "An error occurred while loading view: {0}", (0, strings_1.escape)(viewType))}</body>
		</html>`;
        }
    };
    MainThreadWebviews.standardSupportedLinkSchemes = new Set([
        network_1.Schemas.http,
        network_1.Schemas.https,
        network_1.Schemas.mailto,
        network_1.Schemas.vscode,
        'vscode-insider',
    ]);
    MainThreadWebviews = __decorate([
        __param(1, opener_1.IOpenerService),
        __param(2, productService_1.IProductService)
    ], MainThreadWebviews);
    exports.MainThreadWebviews = MainThreadWebviews;
    function reviveWebviewExtension(extensionData) {
        return {
            id: extensionData.id,
            location: uri_1.URI.revive(extensionData.location),
        };
    }
    exports.reviveWebviewExtension = reviveWebviewExtension;
    function reviveWebviewContentOptions(webviewOptions) {
        return {
            allowScripts: webviewOptions.enableScripts,
            allowForms: webviewOptions.enableForms,
            enableCommandUris: webviewOptions.enableCommandUris,
            localResourceRoots: Array.isArray(webviewOptions.localResourceRoots) ? webviewOptions.localResourceRoots.map(r => uri_1.URI.revive(r)) : undefined,
            portMapping: webviewOptions.portMapping,
        };
    }
    exports.reviveWebviewContentOptions = reviveWebviewContentOptions;
});
//# sourceMappingURL=mainThreadWebviews.js.map