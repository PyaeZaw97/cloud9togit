/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguageDetectionStatsId = exports.AutomaticLanguageDetectionLikelyWrongId = exports.ILanguageDetectionService = void 0;
    exports.ILanguageDetectionService = (0, instantiation_1.createDecorator)('ILanguageDetectionService');
    //#region Telemetry events
    exports.AutomaticLanguageDetectionLikelyWrongId = 'automaticlanguagedetection.likelywrong';
    exports.LanguageDetectionStatsId = 'automaticlanguagedetection.stats';
});
//#endregion
//# sourceMappingURL=languageDetectionWorkerService.js.map