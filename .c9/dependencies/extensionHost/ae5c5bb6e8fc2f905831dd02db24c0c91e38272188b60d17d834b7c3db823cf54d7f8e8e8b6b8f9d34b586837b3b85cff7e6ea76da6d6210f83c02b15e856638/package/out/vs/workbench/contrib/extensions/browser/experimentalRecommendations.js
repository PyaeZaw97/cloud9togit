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
define(["require", "exports", "vs/base/common/arrays", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/workbench/contrib/experiments/common/experimentService", "vs/base/common/types", "vs/platform/extensionManagement/common/extensionManagement"], function (require, exports, arrays_1, extensionRecommendations_1, experimentService_1, types_1, extensionManagement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExperimentalRecommendations = void 0;
    let ExperimentalRecommendations = class ExperimentalRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(experimentService) {
            super();
            this.experimentService = experimentService;
            this._recommendations = [];
        }
        get recommendations() { return this._recommendations; }
        /**
         * Fetch extensions used by others on the same workspace as recommendations
         */
        async doActivate() {
            var _a, _b;
            const experiments = await this.experimentService.getExperimentsByType(experimentService_1.ExperimentActionType.AddToRecommendations);
            for (const { action, state } of experiments) {
                if (state === 2 /* ExperimentState.Run */ && (0, arrays_1.isNonEmptyArray)((_a = action === null || action === void 0 ? void 0 : action.properties) === null || _a === void 0 ? void 0 : _a.recommendations) && ((_b = action === null || action === void 0 ? void 0 : action.properties) === null || _b === void 0 ? void 0 : _b.recommendationReason)) {
                    for (const extensionId of action.properties.recommendations) {
                        try {
                            if ((0, types_1.isString)(extensionId) && extensionManagement_1.EXTENSION_IDENTIFIER_REGEX.test(extensionId)) {
                                this._recommendations.push({
                                    extensionId: extensionId.toLowerCase(),
                                    reason: {
                                        reasonId: 5 /* ExtensionRecommendationReason.Experimental */,
                                        reasonText: action.properties.recommendationReason
                                    }
                                });
                            }
                        }
                        catch (error) { /* ignore */ }
                    }
                }
            }
        }
    };
    ExperimentalRecommendations = __decorate([
        __param(0, experimentService_1.IExperimentService)
    ], ExperimentalRecommendations);
    exports.ExperimentalRecommendations = ExperimentalRecommendations;
});
//# sourceMappingURL=experimentalRecommendations.js.map