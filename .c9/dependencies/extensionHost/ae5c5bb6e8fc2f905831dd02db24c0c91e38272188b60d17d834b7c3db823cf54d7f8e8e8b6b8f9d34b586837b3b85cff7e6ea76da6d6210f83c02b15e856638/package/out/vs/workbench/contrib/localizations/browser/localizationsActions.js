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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/environment/common/environment", "vs/platform/localizations/common/localizations", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/configuration/common/jsonEditing", "vs/workbench/services/host/browser/host", "vs/platform/notification/common/notification", "vs/base/common/platform", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/dialogs/common/dialogs", "vs/platform/product/common/productService", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, nls_1, actions_1, environment_1, localizations_1, quickInput_1, jsonEditing_1, host_1, notification_1, platform_1, extensions_1, dialogs_1, productService_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigureLocaleAction = void 0;
    let ConfigureLocaleAction = class ConfigureLocaleAction extends actions_1.Action {
        constructor(id, label, environmentService, localizationService, quickInputService, jsonEditingService, hostService, notificationService, paneCompositeService, dialogService, productService) {
            super(id, label);
            this.environmentService = environmentService;
            this.localizationService = localizationService;
            this.quickInputService = quickInputService;
            this.jsonEditingService = jsonEditingService;
            this.hostService = hostService;
            this.notificationService = notificationService;
            this.paneCompositeService = paneCompositeService;
            this.dialogService = dialogService;
            this.productService = productService;
        }
        async getLanguageOptions() {
            const availableLanguages = await this.localizationService.getLanguageIds();
            availableLanguages.sort();
            return availableLanguages
                .map(language => { return { label: language }; })
                .concat({ label: (0, nls_1.localize)('installAdditionalLanguages', "Install Additional Languages...") });
        }
        async run() {
            const languageOptions = await this.getLanguageOptions();
            const currentLanguageIndex = languageOptions.findIndex(l => l.label === platform_1.language);
            try {
                const selectedLanguage = await this.quickInputService.pick(languageOptions, {
                    canPickMany: false,
                    placeHolder: (0, nls_1.localize)('chooseDisplayLanguage', "Select Display Language"),
                    activeItem: languageOptions[currentLanguageIndex]
                });
                if (selectedLanguage === languageOptions[languageOptions.length - 1]) {
                    return this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true)
                        .then(viewlet => viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer())
                        .then(viewlet => {
                        const extensionsViewlet = viewlet;
                        extensionsViewlet.search('@category:"language packs"');
                        extensionsViewlet.focus();
                    });
                }
                if (selectedLanguage) {
                    await this.jsonEditingService.write(this.environmentService.argvResource, [{ path: ['locale'], value: selectedLanguage.label }], true);
                    const restart = await this.dialogService.confirm({
                        type: 'info',
                        message: (0, nls_1.localize)('relaunchDisplayLanguageMessage', "A restart is required for the change in display language to take effect."),
                        detail: (0, nls_1.localize)('relaunchDisplayLanguageDetail', "Press the restart button to restart {0} and change the display language.", this.productService.nameLong),
                        primaryButton: (0, nls_1.localize)('restart', "&&Restart")
                    });
                    if (restart.confirmed) {
                        this.hostService.restart();
                    }
                }
            }
            catch (e) {
                this.notificationService.error(e);
            }
        }
    };
    ConfigureLocaleAction.ID = 'workbench.action.configureLocale';
    ConfigureLocaleAction.LABEL = (0, nls_1.localize)('configureLocale', "Configure Display Language");
    ConfigureLocaleAction = __decorate([
        __param(2, environment_1.IEnvironmentService),
        __param(3, localizations_1.ILocalizationsService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, jsonEditing_1.IJSONEditingService),
        __param(6, host_1.IHostService),
        __param(7, notification_1.INotificationService),
        __param(8, panecomposite_1.IPaneCompositePartService),
        __param(9, dialogs_1.IDialogService),
        __param(10, productService_1.IProductService)
    ], ConfigureLocaleAction);
    exports.ConfigureLocaleAction = ConfigureLocaleAction;
});
//# sourceMappingURL=localizationsActions.js.map