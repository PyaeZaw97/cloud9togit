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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/product/common/productService"], function (require, exports, async_1, lifecycle_1, uri_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeURLService = exports.AbstractURLService = void 0;
    class AbstractURLService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.handlers = new Set();
        }
        open(uri, options) {
            const handlers = [...this.handlers.values()];
            return (0, async_1.first)(handlers.map(h => () => h.handleURL(uri, options)), undefined, false).then(val => val || false);
        }
        registerHandler(handler) {
            this.handlers.add(handler);
            return (0, lifecycle_1.toDisposable)(() => this.handlers.delete(handler));
        }
    }
    exports.AbstractURLService = AbstractURLService;
    let NativeURLService = class NativeURLService extends AbstractURLService {
        constructor(productService) {
            super();
            this.productService = productService;
        }
        create(options) {
            let { authority, path, query, fragment } = options ? options : { authority: undefined, path: undefined, query: undefined, fragment: undefined };
            if (authority && path && path.indexOf('/') !== 0) {
                path = `/${path}`; // URI validation requires a path if there is an authority
            }
            return uri_1.URI.from({ scheme: this.productService.urlProtocol, authority, path, query, fragment });
        }
    };
    NativeURLService = __decorate([
        __param(0, productService_1.IProductService)
    ], NativeURLService);
    exports.NativeURLService = NativeURLService;
});
//# sourceMappingURL=urlService.js.map