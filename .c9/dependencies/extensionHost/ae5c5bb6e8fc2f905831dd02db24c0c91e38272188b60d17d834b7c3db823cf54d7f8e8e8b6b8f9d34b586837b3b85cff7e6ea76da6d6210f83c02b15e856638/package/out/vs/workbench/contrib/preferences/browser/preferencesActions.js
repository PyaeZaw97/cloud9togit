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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/uri", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/preferences/common/preferences"], function (require, exports, actions_1, uri_1, getIconClasses_1, model_1, language_1, nls, quickInput_1, preferences_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigureLanguageBasedSettingsAction = void 0;
    let ConfigureLanguageBasedSettingsAction = class ConfigureLanguageBasedSettingsAction extends actions_1.Action {
        constructor(id, label, modelService, languageService, quickInputService, preferencesService) {
            super(id, label);
            this.modelService = modelService;
            this.languageService = languageService;
            this.quickInputService = quickInputService;
            this.preferencesService = preferencesService;
        }
        async run() {
            const languages = this.languageService.getSortedRegisteredLanguageNames();
            const picks = languages.map(({ languageName, languageId }) => {
                const description = nls.localize('languageDescriptionConfigured', "({0})", languageId);
                // construct a fake resource to be able to show nice icons if any
                let fakeResource;
                const extensions = this.languageService.getExtensions(languageId);
                if (extensions.length) {
                    fakeResource = uri_1.URI.file(extensions[0]);
                }
                else {
                    const filenames = this.languageService.getFilenames(languageId);
                    if (filenames.length) {
                        fakeResource = uri_1.URI.file(filenames[0]);
                    }
                }
                return {
                    label: languageName,
                    iconClasses: (0, getIconClasses_1.getIconClasses)(this.modelService, this.languageService, fakeResource),
                    description
                };
            });
            await this.quickInputService.pick(picks, { placeHolder: nls.localize('pickLanguage', "Select Language") })
                .then(pick => {
                if (pick) {
                    const languageId = this.languageService.getLanguageIdByLanguageName(pick.label);
                    if (typeof languageId === 'string') {
                        return this.preferencesService.openLanguageSpecificSettings(languageId);
                    }
                }
                return undefined;
            });
        }
    };
    ConfigureLanguageBasedSettingsAction.ID = 'workbench.action.configureLanguageBasedSettings';
    ConfigureLanguageBasedSettingsAction.LABEL = { value: nls.localize('configureLanguageBasedSettings', "Configure Language Specific Settings..."), original: 'Configure Language Specific Settings...' };
    ConfigureLanguageBasedSettingsAction = __decorate([
        __param(2, model_1.IModelService),
        __param(3, language_1.ILanguageService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, preferences_1.IPreferencesService)
    ], ConfigureLanguageBasedSettingsAction);
    exports.ConfigureLanguageBasedSettingsAction = ConfigureLanguageBasedSettingsAction;
});
//# sourceMappingURL=preferencesActions.js.map