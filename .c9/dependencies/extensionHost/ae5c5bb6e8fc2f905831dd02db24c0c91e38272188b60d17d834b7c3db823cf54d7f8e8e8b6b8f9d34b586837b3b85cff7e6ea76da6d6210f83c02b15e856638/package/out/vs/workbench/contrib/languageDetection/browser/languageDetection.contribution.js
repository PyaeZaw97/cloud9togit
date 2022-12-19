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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/statusbar/browser/statusbar", "vs/workbench/services/languageDetection/common/languageDetectionWorkerService", "vs/base/common/async", "vs/editor/common/languages/language", "vs/platform/keybinding/common/keybinding", "vs/platform/actions/common/actions", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/editor/common/editorContextKeys", "vs/base/common/network", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, editorBrowser_1, nls_1, platform_1, contributions_1, editorService_1, statusbar_1, languageDetectionWorkerService_1, async_1, language_1, keybinding_1, actions_1, notification_1, contextkey_1, notebookContextKeys_1, editorContextKeys_1, network_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const detectLanguageCommandId = 'editor.detectLanguage';
    let LanguageDetectionStatusContribution = class LanguageDetectionStatusContribution {
        constructor(_languageDetectionService, _statusBarService, _configurationService, _editorService, _languageService, _keybindingService) {
            this._languageDetectionService = _languageDetectionService;
            this._statusBarService = _statusBarService;
            this._configurationService = _configurationService;
            this._editorService = _editorService;
            this._languageService = _languageService;
            this._keybindingService = _keybindingService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._delayer = new async_1.ThrottledDelayer(1000);
            this._renderDisposables = new lifecycle_1.DisposableStore();
            _editorService.onDidActiveEditorChange(() => this._update(true), this, this._disposables);
            this._update(false);
        }
        dispose() {
            var _a;
            this._disposables.dispose();
            this._delayer.dispose();
            (_a = this._combinedEntry) === null || _a === void 0 ? void 0 : _a.dispose();
            this._renderDisposables.dispose();
        }
        _update(clear) {
            var _a;
            if (clear) {
                (_a = this._combinedEntry) === null || _a === void 0 ? void 0 : _a.dispose();
                this._combinedEntry = undefined;
            }
            this._delayer.trigger(() => this._doUpdate());
        }
        async _doUpdate() {
            var _a, _b;
            const editor = (0, editorBrowser_1.getCodeEditor)(this._editorService.activeTextEditorControl);
            this._renderDisposables.clear();
            // update when editor language changes
            editor === null || editor === void 0 ? void 0 : editor.onDidChangeModelLanguage(() => this._update(true), this, this._renderDisposables);
            editor === null || editor === void 0 ? void 0 : editor.onDidChangeModelContent(() => this._update(false), this, this._renderDisposables);
            const editorModel = editor === null || editor === void 0 ? void 0 : editor.getModel();
            const editorUri = editorModel === null || editorModel === void 0 ? void 0 : editorModel.uri;
            const existingId = editorModel === null || editorModel === void 0 ? void 0 : editorModel.getLanguageId();
            const enablementConfig = this._configurationService.getValue('workbench.editor.languageDetectionHints');
            const enabled = typeof enablementConfig === 'object' && (enablementConfig === null || enablementConfig === void 0 ? void 0 : enablementConfig.untitledEditors);
            const disableLightbulb = !enabled || (editorUri === null || editorUri === void 0 ? void 0 : editorUri.scheme) !== network_1.Schemas.untitled || !existingId;
            if (disableLightbulb || !editorUri) {
                (_a = this._combinedEntry) === null || _a === void 0 ? void 0 : _a.dispose();
                this._combinedEntry = undefined;
            }
            else {
                const lang = await this._languageDetectionService.detectLanguage(editorUri);
                const skip = { 'jsonc': 'json' };
                const existing = editorModel.getLanguageId();
                if (lang && lang !== existing && skip[existing] !== lang) {
                    const detectedName = this._languageService.getLanguageName(lang) || lang;
                    let tooltip = (0, nls_1.localize)('status.autoDetectLanguage', "Accept Detected Language: {0}", detectedName);
                    const keybinding = this._keybindingService.lookupKeybinding(detectLanguageCommandId);
                    const label = keybinding === null || keybinding === void 0 ? void 0 : keybinding.getLabel();
                    if (label) {
                        tooltip += ` (${label})`;
                    }
                    const props = {
                        name: (0, nls_1.localize)('langDetection.name', "Language Detection"),
                        ariaLabel: (0, nls_1.localize)('langDetection.aria', "Change to Detected Language: {0}", lang),
                        tooltip,
                        command: detectLanguageCommandId,
                        text: '$(lightbulb-autofix)',
                    };
                    if (!this._combinedEntry) {
                        this._combinedEntry = this._statusBarService.addEntry(props, LanguageDetectionStatusContribution._id, 1 /* StatusbarAlignment.RIGHT */, { id: 'status.editor.mode', alignment: 1 /* StatusbarAlignment.RIGHT */, compact: true });
                    }
                    else {
                        this._combinedEntry.update(props);
                    }
                }
                else {
                    (_b = this._combinedEntry) === null || _b === void 0 ? void 0 : _b.dispose();
                    this._combinedEntry = undefined;
                }
            }
        }
    };
    LanguageDetectionStatusContribution._id = 'status.languageDetectionStatus';
    LanguageDetectionStatusContribution = __decorate([
        __param(0, languageDetectionWorkerService_1.ILanguageDetectionService),
        __param(1, statusbar_1.IStatusbarService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, editorService_1.IEditorService),
        __param(4, language_1.ILanguageService),
        __param(5, keybinding_1.IKeybindingService)
    ], LanguageDetectionStatusContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LanguageDetectionStatusContribution, 3 /* LifecyclePhase.Restored */);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: detectLanguageCommandId,
                title: (0, nls_1.localize)('detectlang', 'Detect Language from Content'),
                f1: true,
                precondition: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE.toNegated(), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                keybinding: { primary: 34 /* KeyCode.KeyD */ | 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */, weight: 200 /* KeybindingWeight.WorkbenchContrib */ }
            });
        }
        async run(accessor) {
            var _a, _b;
            const editorService = accessor.get(editorService_1.IEditorService);
            const languageDetectionService = accessor.get(languageDetectionWorkerService_1.ILanguageDetectionService);
            const editor = (0, editorBrowser_1.getCodeEditor)(editorService.activeTextEditorControl);
            const notificationService = accessor.get(notification_1.INotificationService);
            const editorUri = (_a = editor === null || editor === void 0 ? void 0 : editor.getModel()) === null || _a === void 0 ? void 0 : _a.uri;
            if (editorUri) {
                const lang = await languageDetectionService.detectLanguage(editorUri);
                if (lang) {
                    (_b = editor.getModel()) === null || _b === void 0 ? void 0 : _b.setMode(lang);
                }
                else {
                    notificationService.warn((0, nls_1.localize)('noDetection', "Unable to detect editor language"));
                }
            }
        }
    });
});
//# sourceMappingURL=languageDetection.contribution.js.map