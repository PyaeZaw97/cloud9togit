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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/map", "vs/editor/common/languages/language", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService"], function (require, exports, lifecycle_1, map_1, language_1, nls_1, configuration_1, instantiation_1, keybinding_1, platform_1, contributions_1, notebookBrowser_1, notebookCellStatusBarService_1, notebookCommon_1, notebookKernelService_1, notebookService_1, languageDetectionWorkerService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let CellStatusBarLanguagePickerProvider = class CellStatusBarLanguagePickerProvider {
        constructor(_notebookService, _languageService) {
            this._notebookService = _notebookService;
            this._languageService = _languageService;
            this.viewType = '*';
        }
        async provideCellStatusBarItems(uri, index, _token) {
            const doc = this._notebookService.getNotebookTextModel(uri);
            const cell = doc === null || doc === void 0 ? void 0 : doc.cells[index];
            if (!cell) {
                return;
            }
            const languageId = cell.cellKind === notebookCommon_1.CellKind.Markup ?
                'markdown' :
                (this._languageService.getLanguageIdByLanguageName(cell.language) || cell.language);
            const text = this._languageService.getLanguageName(languageId) || languageId;
            const item = {
                text,
                command: notebookBrowser_1.CHANGE_CELL_LANGUAGE,
                tooltip: (0, nls_1.localize)('notebook.cell.status.language', "Select Cell Language Mode"),
                alignment: 2 /* CellStatusbarAlignment.Right */,
                priority: -Number.MAX_SAFE_INTEGER
            };
            return {
                items: [item]
            };
        }
    };
    CellStatusBarLanguagePickerProvider = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, language_1.ILanguageService)
    ], CellStatusBarLanguagePickerProvider);
    let CellStatusBarLanguageDetectionProvider = class CellStatusBarLanguageDetectionProvider {
        constructor(_notebookService, _notebookKernelService, _languageService, _configurationService, _languageDetectionService, _keybindingService) {
            this._notebookService = _notebookService;
            this._notebookKernelService = _notebookKernelService;
            this._languageService = _languageService;
            this._configurationService = _configurationService;
            this._languageDetectionService = _languageDetectionService;
            this._keybindingService = _keybindingService;
            this.viewType = '*';
            this.cache = new map_1.ResourceMap();
        }
        async provideCellStatusBarItems(uri, index, token) {
            const doc = this._notebookService.getNotebookTextModel(uri);
            const cell = doc === null || doc === void 0 ? void 0 : doc.cells[index];
            if (!cell) {
                return;
            }
            const enablementConfig = this._configurationService.getValue('workbench.editor.languageDetectionHints');
            const enabled = typeof enablementConfig === 'object' && (enablementConfig === null || enablementConfig === void 0 ? void 0 : enablementConfig.notebookEditors);
            if (!enabled) {
                return;
            }
            const currentLanguageId = cell.cellKind === notebookCommon_1.CellKind.Markup ?
                'markdown' :
                (this._languageService.getLanguageIdByLanguageName(cell.language) || cell.language);
            if (!this.cache.has(uri)) {
                this.cache.set(uri, { lastCellLang: currentLanguageId, lastUpdate: 0 });
            }
            const cached = this.cache.get(uri);
            if (cached.lastUpdate < Date.now() - 1000 || cached.lastCellLang !== currentLanguageId) {
                cached.lastUpdate = Date.now();
                cached.lastCellLang = currentLanguageId;
                const kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(doc);
                if (kernel) {
                    const availableLangs = [];
                    availableLangs.push(...kernel.supportedLanguages, 'markdown');
                    cached.lastGuess = await this._languageDetectionService.detectLanguage(cell.uri, availableLangs);
                }
            }
            const items = [];
            if (cached.lastGuess && currentLanguageId !== cached.lastGuess) {
                const detectedName = this._languageService.getLanguageName(cached.lastGuess) || cached.lastGuess;
                let tooltip = (0, nls_1.localize)('notebook.cell.status.autoDetectLanguage', "Accept Detected Language: {0}", detectedName);
                const keybinding = this._keybindingService.lookupKeybinding(notebookBrowser_1.DETECT_CELL_LANGUAGE);
                const label = keybinding === null || keybinding === void 0 ? void 0 : keybinding.getLabel();
                if (label) {
                    tooltip += ` (${label})`;
                }
                items.push({
                    text: '$(lightbulb-autofix)',
                    command: notebookBrowser_1.DETECT_CELL_LANGUAGE,
                    tooltip,
                    alignment: 2 /* CellStatusbarAlignment.Right */,
                    priority: -Number.MAX_SAFE_INTEGER + 1
                });
            }
            return { items };
        }
    };
    CellStatusBarLanguageDetectionProvider = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, notebookKernelService_1.INotebookKernelService),
        __param(2, language_1.ILanguageService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(5, keybinding_1.IKeybindingService)
    ], CellStatusBarLanguageDetectionProvider);
    let BuiltinCellStatusBarProviders = class BuiltinCellStatusBarProviders extends lifecycle_1.Disposable {
        constructor(instantiationService, notebookCellStatusBarService) {
            super();
            const builtinProviders = [
                CellStatusBarLanguagePickerProvider,
                CellStatusBarLanguageDetectionProvider,
            ];
            builtinProviders.forEach(p => {
                this._register(notebookCellStatusBarService.registerCellStatusBarItemProvider(instantiationService.createInstance(p)));
            });
        }
    };
    BuiltinCellStatusBarProviders = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, notebookCellStatusBarService_1.INotebookCellStatusBarService)
    ], BuiltinCellStatusBarProviders);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(BuiltinCellStatusBarProviders, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=statusBarProviders.js.map