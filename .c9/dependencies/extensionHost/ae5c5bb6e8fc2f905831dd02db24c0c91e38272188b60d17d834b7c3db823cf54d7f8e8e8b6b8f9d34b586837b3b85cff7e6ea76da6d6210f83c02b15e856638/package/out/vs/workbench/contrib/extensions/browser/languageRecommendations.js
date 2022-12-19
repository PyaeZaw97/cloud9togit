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
define(["require", "exports", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/product/common/productService"], function (require, exports, extensionRecommendations_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageRecommendations = void 0;
    let LanguageRecommendations = class LanguageRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(productService) {
            super();
            this.productService = productService;
            this._recommendations = [];
        }
        get recommendations() { return this._recommendations; }
        async doActivate() {
            if (this.productService.languageExtensionTips) {
                this._recommendations = this.productService.languageExtensionTips.map(extensionId => ({
                    extensionId: extensionId.toLowerCase(),
                    reason: {
                        reasonId: 6 /* ExtensionRecommendationReason.Application */,
                        reasonText: ''
                    }
                }));
            }
        }
    };
    LanguageRecommendations = __decorate([
        __param(0, productService_1.IProductService)
    ], LanguageRecommendations);
    exports.LanguageRecommendations = LanguageRecommendations;
});
//# sourceMappingURL=languageRecommendations.js.map