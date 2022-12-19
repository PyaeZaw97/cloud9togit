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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/nls"], function (require, exports, extensionManagement_1, extensionRecommendations_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExeBasedRecommendations = void 0;
    let ExeBasedRecommendations = class ExeBasedRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(extensionTipsService) {
            super();
            this.extensionTipsService = extensionTipsService;
            this._otherTips = [];
            this._importantTips = [];
        }
        get otherRecommendations() { return this._otherTips.map(tip => this.toExtensionRecommendation(tip)); }
        get importantRecommendations() { return this._importantTips.map(tip => this.toExtensionRecommendation(tip)); }
        get recommendations() { return [...this.importantRecommendations, ...this.otherRecommendations]; }
        getRecommendations(exe) {
            const important = this._importantTips
                .filter(tip => tip.exeName.toLowerCase() === exe.toLowerCase())
                .map(tip => this.toExtensionRecommendation(tip));
            const others = this._otherTips
                .filter(tip => tip.exeName.toLowerCase() === exe.toLowerCase())
                .map(tip => this.toExtensionRecommendation(tip));
            return { important, others };
        }
        async doActivate() {
            this._otherTips = await this.extensionTipsService.getOtherExecutableBasedTips();
            await this.fetchImportantExeBasedRecommendations();
        }
        async fetchImportantExeBasedRecommendations() {
            if (!this._importantExeBasedRecommendations) {
                this._importantExeBasedRecommendations = this.doFetchImportantExeBasedRecommendations();
            }
            return this._importantExeBasedRecommendations;
        }
        async doFetchImportantExeBasedRecommendations() {
            const importantExeBasedRecommendations = new Map();
            this._importantTips = await this.extensionTipsService.getImportantExecutableBasedTips();
            this._importantTips.forEach(tip => importantExeBasedRecommendations.set(tip.extensionId.toLowerCase(), tip));
            return importantExeBasedRecommendations;
        }
        toExtensionRecommendation(tip) {
            return {
                extensionId: tip.extensionId.toLowerCase(),
                reason: {
                    reasonId: 2 /* ExtensionRecommendationReason.Executable */,
                    reasonText: (0, nls_1.localize)('exeBasedRecommendation', "This extension is recommended because you have {0} installed.", tip.exeFriendlyName)
                }
            };
        }
    };
    ExeBasedRecommendations = __decorate([
        __param(0, extensionManagement_1.IExtensionTipsService)
    ], ExeBasedRecommendations);
    exports.ExeBasedRecommendations = ExeBasedRecommendations;
});
//# sourceMappingURL=exeBasedRecommendations.js.map