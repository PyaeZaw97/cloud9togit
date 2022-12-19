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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/editor/common/languages/language", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/platform/notification/common/notification", "vs/workbench/services/textfile/common/textfiles", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/base/common/process", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/extensions/common/extensions"], function (require, exports, nls_1, platform_1, language_1, contributions_1, platform_2, telemetry_1, storage_1, productService_1, notification_1, textfiles_1, opener_1, uri_1, process_1, async_1, lifecycle_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class LanguageSurvey extends lifecycle_1.Disposable {
        constructor(data, storageService, notificationService, telemetryService, languageService, textFileService, openerService, productService) {
            var _a;
            super();
            const SESSION_COUNT_KEY = `${data.surveyId}.sessionCount`;
            const LAST_SESSION_DATE_KEY = `${data.surveyId}.lastSessionDate`;
            const SKIP_VERSION_KEY = `${data.surveyId}.skipVersion`;
            const IS_CANDIDATE_KEY = `${data.surveyId}.isCandidate`;
            const EDITED_LANGUAGE_COUNT_KEY = `${data.surveyId}.editedCount`;
            const EDITED_LANGUAGE_DATE_KEY = `${data.surveyId}.editedDate`;
            const skipVersion = storageService.get(SKIP_VERSION_KEY, 0 /* StorageScope.GLOBAL */, '');
            if (skipVersion) {
                return;
            }
            const date = new Date().toDateString();
            if (storageService.getNumber(EDITED_LANGUAGE_COUNT_KEY, 0 /* StorageScope.GLOBAL */, 0) < data.editCount) {
                // Process model-save event every 250ms to reduce load
                const onModelsSavedWorker = this._register(new async_1.RunOnceWorker(models => {
                    models.forEach(m => {
                        if (m.getLanguageId() === data.languageId && date !== storageService.get(EDITED_LANGUAGE_DATE_KEY, 0 /* StorageScope.GLOBAL */)) {
                            const editedCount = storageService.getNumber(EDITED_LANGUAGE_COUNT_KEY, 0 /* StorageScope.GLOBAL */, 0) + 1;
                            storageService.store(EDITED_LANGUAGE_COUNT_KEY, editedCount, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                            storageService.store(EDITED_LANGUAGE_DATE_KEY, date, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                        }
                    });
                }, 250));
                this._register(textFileService.files.onDidSave(e => onModelsSavedWorker.work(e.model)));
            }
            const lastSessionDate = storageService.get(LAST_SESSION_DATE_KEY, 0 /* StorageScope.GLOBAL */, new Date(0).toDateString());
            if (date === lastSessionDate) {
                return;
            }
            const sessionCount = storageService.getNumber(SESSION_COUNT_KEY, 0 /* StorageScope.GLOBAL */, 0) + 1;
            storageService.store(LAST_SESSION_DATE_KEY, date, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            storageService.store(SESSION_COUNT_KEY, sessionCount, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            if (sessionCount < 9) {
                return;
            }
            if (storageService.getNumber(EDITED_LANGUAGE_COUNT_KEY, 0 /* StorageScope.GLOBAL */, 0) < data.editCount) {
                return;
            }
            const isCandidate = storageService.getBoolean(IS_CANDIDATE_KEY, 0 /* StorageScope.GLOBAL */, false)
                || Math.random() < data.userProbability;
            storageService.store(IS_CANDIDATE_KEY, isCandidate, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            if (!isCandidate) {
                storageService.store(SKIP_VERSION_KEY, productService.version, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                return;
            }
            notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('helpUs', "Help us improve our support for {0}", (_a = languageService.getLanguageName(data.languageId)) !== null && _a !== void 0 ? _a : data.languageId), [{
                    label: (0, nls_1.localize)('takeShortSurvey', "Take Short Survey"),
                    run: () => {
                        telemetryService.publicLog(`${data.surveyId}.survey/takeShortSurvey`);
                        telemetryService.getTelemetryInfo().then(info => {
                            openerService.open(uri_1.URI.parse(`${data.surveyUrl}?o=${encodeURIComponent(process_1.platform)}&v=${encodeURIComponent(productService.version)}&m=${encodeURIComponent(info.machineId)}`));
                            storageService.store(IS_CANDIDATE_KEY, false, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                            storageService.store(SKIP_VERSION_KEY, productService.version, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                        });
                    }
                }, {
                    label: (0, nls_1.localize)('remindLater', "Remind Me later"),
                    run: () => {
                        telemetryService.publicLog(`${data.surveyId}.survey/remindMeLater`);
                        storageService.store(SESSION_COUNT_KEY, sessionCount - 3, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                    }
                }, {
                    label: (0, nls_1.localize)('neverAgain', "Don't Show Again"),
                    isSecondary: true,
                    run: () => {
                        telemetryService.publicLog(`${data.surveyId}.survey/dontShowAgain`);
                        storageService.store(IS_CANDIDATE_KEY, false, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                        storageService.store(SKIP_VERSION_KEY, productService.version, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                    }
                }], { sticky: true });
        }
    }
    let LanguageSurveysContribution = class LanguageSurveysContribution {
        constructor(storageService, notificationService, telemetryService, textFileService, openerService, productService, languageService, extensionService) {
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.textFileService = textFileService;
            this.openerService = openerService;
            this.productService = productService;
            this.languageService = languageService;
            this.extensionService = extensionService;
            this.handleSurveys();
        }
        async handleSurveys() {
            if (!this.productService.surveys) {
                return;
            }
            // Make sure to wait for installed extensions
            // being registered to show notifications
            // properly (https://github.com/microsoft/vscode/issues/121216)
            await this.extensionService.whenInstalledExtensionsRegistered();
            // Handle surveys
            this.productService.surveys
                .filter(surveyData => surveyData.surveyId && surveyData.editCount && surveyData.languageId && surveyData.surveyUrl && surveyData.userProbability)
                .map(surveyData => new LanguageSurvey(surveyData, this.storageService, this.notificationService, this.telemetryService, this.languageService, this.textFileService, this.openerService, this.productService));
        }
    };
    LanguageSurveysContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, notification_1.INotificationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, opener_1.IOpenerService),
        __param(5, productService_1.IProductService),
        __param(6, language_1.ILanguageService),
        __param(7, extensions_1.IExtensionService)
    ], LanguageSurveysContribution);
    if (platform_1.language === 'en') {
        const workbenchRegistry = platform_2.Registry.as(contributions_1.Extensions.Workbench);
        workbenchRegistry.registerWorkbenchContribution(LanguageSurveysContribution, 3 /* LifecyclePhase.Restored */);
    }
});
//# sourceMappingURL=languageSurveys.contribution.js.map