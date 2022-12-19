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
define(["require", "exports", "vs/platform/url/common/url", "vs/base/common/uri", "vs/platform/instantiation/common/extensions", "vs/platform/url/common/urlService", "vs/workbench/services/environment/browser/environmentService", "vs/platform/opener/common/opener", "vs/platform/product/common/productService"], function (require, exports, url_1, uri_1, extensions_1, urlService_1, environmentService_1, opener_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserURLService = void 0;
    class BrowserURLOpener {
        constructor(urlService, productService) {
            this.urlService = urlService;
            this.productService = productService;
        }
        async open(resource, options) {
            if (options === null || options === void 0 ? void 0 : options.openExternal) {
                return false;
            }
            if (!(0, opener_1.matchesScheme)(resource, this.productService.urlProtocol)) {
                return false;
            }
            if (typeof resource === 'string') {
                resource = uri_1.URI.parse(resource);
            }
            return this.urlService.open(resource, { trusted: true });
        }
    }
    let BrowserURLService = class BrowserURLService extends urlService_1.AbstractURLService {
        constructor(environmentService, openerService, productService) {
            var _a;
            super();
            this.provider = (_a = environmentService.options) === null || _a === void 0 ? void 0 : _a.urlCallbackProvider;
            if (this.provider) {
                this._register(this.provider.onCallback(uri => this.open(uri, { trusted: true })));
            }
            this._register(openerService.registerOpener(new BrowserURLOpener(this, productService)));
        }
        create(options) {
            if (this.provider) {
                return this.provider.create(options);
            }
            return uri_1.URI.parse('unsupported://');
        }
    };
    BrowserURLService = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, opener_1.IOpenerService),
        __param(2, productService_1.IProductService)
    ], BrowserURLService);
    exports.BrowserURLService = BrowserURLService;
    (0, extensions_1.registerSingleton)(url_1.IURLService, BrowserURLService, true);
});
//# sourceMappingURL=urlService.js.map