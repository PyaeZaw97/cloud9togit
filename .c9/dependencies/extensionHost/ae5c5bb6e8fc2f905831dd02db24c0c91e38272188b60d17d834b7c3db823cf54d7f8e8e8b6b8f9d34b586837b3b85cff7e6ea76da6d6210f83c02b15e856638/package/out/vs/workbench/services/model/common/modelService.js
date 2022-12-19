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
define(["require", "exports", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/editor/common/languages/language", "vs/editor/common/services/textResourceConfiguration", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/theme/common/themeService", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/services/path/common/pathService", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures"], function (require, exports, languageConfigurationRegistry_1, model_1, modelService_1, language_1, textResourceConfiguration_1, configuration_1, extensions_1, log_1, themeService_1, undoRedo_1, pathService_1, languageFeatureDebounce_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchModelService = void 0;
    let WorkbenchModelService = class WorkbenchModelService extends modelService_1.ModelService {
        constructor(configurationService, resourcePropertiesService, themeService, logService, undoRedoService, languageConfigurationService, languageService, languageFeatureDebounceService, languageFeaturesService, _pathService) {
            super(configurationService, resourcePropertiesService, themeService, logService, undoRedoService, languageService, languageConfigurationService, languageFeatureDebounceService, languageFeaturesService);
            this._pathService = _pathService;
        }
        _schemaShouldMaintainUndoRedoElements(resource) {
            return (super._schemaShouldMaintainUndoRedoElements(resource)
                || resource.scheme === this._pathService.defaultUriScheme);
        }
    };
    WorkbenchModelService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, textResourceConfiguration_1.ITextResourcePropertiesService),
        __param(2, themeService_1.IThemeService),
        __param(3, log_1.ILogService),
        __param(4, undoRedo_1.IUndoRedoService),
        __param(5, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(6, language_1.ILanguageService),
        __param(7, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(8, languageFeatures_1.ILanguageFeaturesService),
        __param(9, pathService_1.IPathService)
    ], WorkbenchModelService);
    exports.WorkbenchModelService = WorkbenchModelService;
    (0, extensions_1.registerSingleton)(model_1.IModelService, WorkbenchModelService, true);
});
//# sourceMappingURL=modelService.js.map