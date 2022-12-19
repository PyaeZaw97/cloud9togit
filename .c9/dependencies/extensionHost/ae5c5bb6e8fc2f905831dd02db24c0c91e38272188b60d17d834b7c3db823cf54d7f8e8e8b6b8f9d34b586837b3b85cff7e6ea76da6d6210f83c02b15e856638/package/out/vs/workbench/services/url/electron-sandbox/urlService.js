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
define(["require", "exports", "vs/platform/url/common/url", "vs/base/common/uri", "vs/platform/ipc/electron-sandbox/services", "vs/platform/url/common/urlIpc", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/instantiation/common/extensions", "vs/base/parts/ipc/common/ipc", "vs/platform/native/electron-sandbox/native", "vs/platform/url/common/urlService"], function (require, exports, url_1, uri_1, services_1, urlIpc_1, opener_1, productService_1, extensions_1, ipc_1, native_1, urlService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RelayURLService = void 0;
    let RelayURLService = class RelayURLService extends urlService_1.NativeURLService {
        constructor(mainProcessService, openerService, nativeHostService, productService) {
            super(productService);
            this.nativeHostService = nativeHostService;
            this.urlService = ipc_1.ProxyChannel.toService(mainProcessService.getChannel('url'));
            mainProcessService.registerChannel('urlHandler', new urlIpc_1.URLHandlerChannel(this));
            openerService.registerOpener(this);
        }
        create(options) {
            const uri = super.create(options);
            let query = uri.query;
            if (!query) {
                query = `windowId=${encodeURIComponent(this.nativeHostService.windowId)}`;
            }
            else {
                query += `&windowId=${encodeURIComponent(this.nativeHostService.windowId)}`;
            }
            return uri.with({ query });
        }
        async open(resource, options) {
            if (!(0, opener_1.matchesScheme)(resource, this.productService.urlProtocol)) {
                return false;
            }
            if (typeof resource === 'string') {
                resource = uri_1.URI.parse(resource);
            }
            return await this.urlService.open(resource, options);
        }
        async handleURL(uri, options) {
            const result = await super.open(uri, options);
            if (result) {
                await this.nativeHostService.focusWindow({ force: true /* Application may not be active */ });
            }
            return result;
        }
    };
    RelayURLService = __decorate([
        __param(0, services_1.IMainProcessService),
        __param(1, opener_1.IOpenerService),
        __param(2, native_1.INativeHostService),
        __param(3, productService_1.IProductService)
    ], RelayURLService);
    exports.RelayURLService = RelayURLService;
    (0, extensions_1.registerSingleton)(url_1.IURLService, RelayURLService);
});
//# sourceMappingURL=urlService.js.map