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
define(["require", "exports", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/product/common/productService", "vs/base/common/types", "vs/nls", "vs/workbench/services/extensionManagement/common/extensionManagement"], function (require, exports, extensionRecommendations_1, productService_1, types_1, nls_1, extensionManagement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebRecommendations = void 0;
    let WebRecommendations = class WebRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(productService, extensionManagementServerService) {
            super();
            this.productService = productService;
            this.extensionManagementServerService = extensionManagementServerService;
            this._recommendations = [];
        }
        get recommendations() { return this._recommendations; }
        async doActivate() {
            const isOnlyWeb = this.extensionManagementServerService.webExtensionManagementServer && !this.extensionManagementServerService.localExtensionManagementServer && !this.extensionManagementServerService.remoteExtensionManagementServer;
            if (isOnlyWeb && (0, types_1.isArray)(this.productService.webExtensionTips)) {
                this._recommendations = this.productService.webExtensionTips.map(extensionId => ({
                    extensionId: extensionId.toLowerCase(),
                    reason: {
                        reasonId: 6 /* ExtensionRecommendationReason.Application */,
                        reasonText: (0, nls_1.localize)('reason', "This extension is recommended for {0} for the Web", this.productService.nameLong)
                    }
                }));
            }
        }
    };
    WebRecommendations = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, extensionManagement_1.IExtensionManagementServerService)
    ], WebRecommendations);
    exports.WebRecommendations = WebRecommendations;
});
//# sourceMappingURL=webRecommendations.js.map