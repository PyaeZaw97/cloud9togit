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
define(["require", "exports", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/extensions/browser/extensionRecommendations", "vs/platform/notification/common/notification", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/workbench/contrib/extensions/common/extensions", "vs/base/common/cancellation", "vs/nls", "vs/platform/storage/common/storage", "vs/platform/product/common/productService", "vs/base/common/collections", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/glob", "vs/base/common/mime", "vs/editor/common/services/languagesAssociations", "vs/workbench/services/extensions/common/extensions", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/workbench/services/assignment/common/assignmentService", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/base/common/async", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/workspace/common/workspace", "vs/platform/extensionManagement/common/extensionManagementUtil"], function (require, exports, telemetry_1, extensionRecommendations_1, notification_1, extensionManagement_1, extensionRecommendations_2, extensions_1, cancellation_1, nls_1, storage_1, productService_1, collections_1, network_1, resources_1, glob_1, mime_1, languagesAssociations_1, extensions_2, model_1, language_1, extensionRecommendations_3, assignmentService_1, arrays_1, lifecycle_1, notebookCommon_1, async_1, panecomposite_1, workspace_1, extensionManagementUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileBasedRecommendations = void 0;
    const promptedRecommendationsStorageKey = 'fileBasedRecommendations/promptedRecommendations';
    const promptedFileExtensionsStorageKey = 'fileBasedRecommendations/promptedFileExtensions';
    const recommendationsStorageKey = 'extensionsAssistant/recommendations';
    const searchMarketplace = (0, nls_1.localize)('searchMarketplace', "Search Marketplace");
    const milliSecondsInADay = 1000 * 60 * 60 * 24;
    let FileBasedRecommendations = class FileBasedRecommendations extends extensionRecommendations_1.ExtensionRecommendations {
        constructor(extensionsWorkbenchService, extensionService, paneCompositeService, modelService, languageService, productService, notificationService, telemetryService, storageService, extensionRecommendationNotificationService, extensionIgnoredRecommendationsService, tasExperimentService, workspaceContextService, extensionManagementServerService) {
            super();
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionService = extensionService;
            this.paneCompositeService = paneCompositeService;
            this.modelService = modelService;
            this.languageService = languageService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.storageService = storageService;
            this.extensionRecommendationNotificationService = extensionRecommendationNotificationService;
            this.extensionIgnoredRecommendationsService = extensionIgnoredRecommendationsService;
            this.tasExperimentService = tasExperimentService;
            this.workspaceContextService = workspaceContextService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.extensionTips = new Map();
            this.importantExtensionTips = new Map();
            this.fileBasedRecommendationsByPattern = new Map();
            this.fileBasedRecommendationsByLanguage = new Map();
            this.fileBasedRecommendations = new Map();
            this.processedFileExtensions = [];
            this.processedLanguages = [];
            this.tasExperimentService = tasExperimentService;
            if (productService.extensionTips) {
                (0, collections_1.forEach)(productService.extensionTips, ({ key, value }) => this.extensionTips.set(key.toLowerCase(), value));
            }
            if (productService.extensionImportantTips) {
                (0, collections_1.forEach)(productService.extensionImportantTips, ({ key, value }) => this.importantExtensionTips.set(key.toLowerCase(), value));
            }
        }
        get recommendations() {
            const recommendations = [];
            [...this.fileBasedRecommendations.keys()]
                .sort((a, b) => {
                if (this.fileBasedRecommendations.get(a).recommendedTime === this.fileBasedRecommendations.get(b).recommendedTime) {
                    if (this.importantExtensionTips.has(a)) {
                        return -1;
                    }
                    if (this.importantExtensionTips.has(b)) {
                        return 1;
                    }
                }
                return this.fileBasedRecommendations.get(a).recommendedTime > this.fileBasedRecommendations.get(b).recommendedTime ? -1 : 1;
            })
                .forEach(extensionId => {
                recommendations.push({
                    extensionId,
                    reason: {
                        reasonId: 1 /* ExtensionRecommendationReason.File */,
                        reasonText: (0, nls_1.localize)('fileBasedRecommendation', "This extension is recommended based on the files you recently opened.")
                    }
                });
            });
            return recommendations;
        }
        get importantRecommendations() {
            return this.recommendations.filter(e => this.importantExtensionTips.has(e.extensionId));
        }
        get otherRecommendations() {
            return this.recommendations.filter(e => !this.importantExtensionTips.has(e.extensionId));
        }
        async doActivate() {
            await this.extensionService.whenInstalledExtensionsRegistered();
            const allRecommendations = [];
            // group extension recommendations by pattern, like {**/*.md} -> [ext.foo1, ext.bar2]
            for (const [extensionId, pattern] of this.extensionTips) {
                const ids = this.fileBasedRecommendationsByPattern.get(pattern) || [];
                ids.push(extensionId);
                this.fileBasedRecommendationsByPattern.set(pattern, ids);
                allRecommendations.push(extensionId);
            }
            for (const [extensionId, value] of this.importantExtensionTips) {
                if (value.pattern) {
                    const ids = this.fileBasedRecommendationsByPattern.get(value.pattern) || [];
                    ids.push(extensionId);
                    this.fileBasedRecommendationsByPattern.set(value.pattern, ids);
                }
                if (value.languages) {
                    for (const language of value.languages) {
                        const ids = this.fileBasedRecommendationsByLanguage.get(language) || [];
                        ids.push(extensionId);
                        this.fileBasedRecommendationsByLanguage.set(language, ids);
                    }
                }
                allRecommendations.push(extensionId);
            }
            const cachedRecommendations = this.getCachedRecommendations();
            const now = Date.now();
            // Retire existing recommendations if they are older than a week or are not part of this.productService.extensionTips anymore
            (0, collections_1.forEach)(cachedRecommendations, ({ key, value }) => {
                const diff = (now - value) / milliSecondsInADay;
                if (diff <= 7 && allRecommendations.indexOf(key) > -1) {
                    this.fileBasedRecommendations.set(key.toLowerCase(), { recommendedTime: value });
                }
            });
            this._register(this.modelService.onModelAdded(model => this.onModelAdded(model)));
            this.modelService.getModels().forEach(model => this.onModelAdded(model));
        }
        onModelAdded(model) {
            var _a;
            const uri = model.uri.scheme === network_1.Schemas.vscodeNotebookCell ? (_a = notebookCommon_1.CellUri.parse(model.uri)) === null || _a === void 0 ? void 0 : _a.notebook : model.uri;
            if (!uri) {
                return;
            }
            const supportedSchemes = (0, arrays_1.distinct)([network_1.Schemas.untitled, network_1.Schemas.file, network_1.Schemas.vscodeRemote, ...this.workspaceContextService.getWorkspace().folders.map(folder => folder.uri.scheme)]);
            if (!uri || !supportedSchemes.includes(uri.scheme)) {
                return;
            }
            this.promptRecommendationsForModel(model);
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(model.onDidChangeLanguage(() => this.promptRecommendationsForModel(model)));
            disposables.add(model.onWillDispose(() => disposables.dispose()));
        }
        /**
         * Prompt the user to either install the recommended extension for the file type in the current editor model
         * or prompt to search the marketplace if it has extensions that can support the file type
         */
        promptRecommendationsForModel(model) {
            const uri = model.uri;
            const language = model.getLanguageId();
            const fileExtension = (0, resources_1.extname)(uri).toLowerCase();
            if (this.processedLanguages.includes(language) && this.processedFileExtensions.includes(fileExtension)) {
                return;
            }
            this.processedLanguages.push(language);
            this.processedFileExtensions.push(fileExtension);
            // re-schedule this bit of the operation to be off the critical path - in case glob-match is slow
            this._register((0, async_1.disposableTimeout)(() => this.promptRecommendations(uri, language, fileExtension), 0));
        }
        async promptRecommendations(uri, language, fileExtension) {
            const installed = await this.extensionsWorkbenchService.queryLocal();
            const importantRecommendations = (this.fileBasedRecommendationsByLanguage.get(language) || [])
                .filter(extensionId => {
                const importantTip = this.importantExtensionTips.get(extensionId);
                if (importantTip) {
                    return !importantTip.whenNotInstalled || importantTip.whenNotInstalled.every(id => installed.every(local => !(0, extensionManagementUtil_1.areSameExtensions)(local.identifier, { id })));
                }
                return false;
            });
            let languageName = importantRecommendations.length ? this.languageService.getLanguageName(language) : null;
            const fileBasedRecommendations = [...importantRecommendations];
            for (let [pattern, extensionIds] of this.fileBasedRecommendationsByPattern) {
                extensionIds = extensionIds.filter(extensionId => !importantRecommendations.includes(extensionId));
                if (!extensionIds.length) {
                    continue;
                }
                if (!(0, glob_1.match)(pattern, uri.with({ fragment: '' }).toString())) {
                    continue;
                }
                for (const extensionId of extensionIds) {
                    fileBasedRecommendations.push(extensionId);
                    const importantExtensionTip = this.importantExtensionTips.get(extensionId);
                    if (importantExtensionTip && importantExtensionTip.pattern === pattern) {
                        importantRecommendations.push(extensionId);
                    }
                }
            }
            // Update file based recommendations
            for (const recommendation of fileBasedRecommendations) {
                const filedBasedRecommendation = this.fileBasedRecommendations.get(recommendation) || { recommendedTime: Date.now(), sources: [] };
                filedBasedRecommendation.recommendedTime = Date.now();
                this.fileBasedRecommendations.set(recommendation, filedBasedRecommendation);
            }
            this.storeCachedRecommendations();
            if (this.extensionRecommendationNotificationService.hasToIgnoreRecommendationNotifications()) {
                return;
            }
            if (importantRecommendations.length &&
                await this.promptRecommendedExtensionForFileType(languageName || (0, resources_1.basename)(uri), language, importantRecommendations, installed)) {
                return;
            }
            this.promptRecommendedExtensionForFileExtension(uri, fileExtension, installed);
        }
        async promptRecommendedExtensionForFileType(name, language, recommendations, installed) {
            recommendations = this.filterIgnoredOrNotAllowed(recommendations);
            if (recommendations.length === 0) {
                return false;
            }
            recommendations = this.filterInstalled(recommendations, installed);
            if (recommendations.length === 0) {
                return false;
            }
            const extensionId = recommendations[0];
            const entry = this.importantExtensionTips.get(extensionId);
            if (!entry) {
                return false;
            }
            const promptedRecommendations = this.getPromptedRecommendations();
            if (promptedRecommendations[language] && promptedRecommendations[language].includes(extensionId)) {
                return false;
            }
            const treatmentMessage = await this.tasExperimentService.getTreatment('languageRecommendationMessage');
            const message = treatmentMessage ? treatmentMessage.replace('{0}', name) : (0, nls_1.localize)('reallyRecommended', "Do you want to install the recommended extensions for {0}?", name);
            this.extensionRecommendationNotificationService.promptImportantExtensionsInstallNotification([extensionId], message, `@id:${extensionId}`, 1 /* RecommendationSource.FILE */)
                .then(result => {
                if (result === "reacted" /* RecommendationsNotificationResult.Accepted */) {
                    this.addToPromptedRecommendations(language, [extensionId]);
                }
            });
            return true;
        }
        getPromptedRecommendations() {
            return JSON.parse(this.storageService.get(promptedRecommendationsStorageKey, 0 /* StorageScope.GLOBAL */, '{}'));
        }
        addToPromptedRecommendations(exeName, extensions) {
            const promptedRecommendations = this.getPromptedRecommendations();
            promptedRecommendations[exeName] = extensions;
            this.storageService.store(promptedRecommendationsStorageKey, JSON.stringify(promptedRecommendations), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
        }
        getPromptedFileExtensions() {
            return JSON.parse(this.storageService.get(promptedFileExtensionsStorageKey, 0 /* StorageScope.GLOBAL */, '[]'));
        }
        addToPromptedFileExtensions(fileExtension) {
            const promptedFileExtensions = this.getPromptedFileExtensions();
            promptedFileExtensions.push(fileExtension);
            this.storageService.store(promptedFileExtensionsStorageKey, JSON.stringify((0, arrays_1.distinct)(promptedFileExtensions)), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
        }
        async promptRecommendedExtensionForFileExtension(uri, fileExtension, installed) {
            // Do not prompt when there is no local and remote extension management servers
            if (!this.extensionManagementServerService.localExtensionManagementServer && !this.extensionManagementServerService.remoteExtensionManagementServer) {
                return;
            }
            fileExtension = fileExtension.substring(1); // Strip the dot
            if (!fileExtension) {
                return;
            }
            const mimeTypes = (0, languagesAssociations_1.getMimeTypes)(uri);
            if (mimeTypes.length !== 1 || mimeTypes[0] !== mime_1.Mimes.unknown) {
                return;
            }
            const fileExtensionSuggestionIgnoreList = JSON.parse(this.storageService.get('extensionsAssistant/fileExtensionsSuggestionIgnore', 0 /* StorageScope.GLOBAL */, '[]'));
            if (fileExtensionSuggestionIgnoreList.indexOf(fileExtension) > -1) {
                return;
            }
            const promptedFileExtensions = this.getPromptedFileExtensions();
            if (promptedFileExtensions.includes(fileExtension)) {
                return;
            }
            const text = `ext:${fileExtension}`;
            const pager = await this.extensionsWorkbenchService.queryGallery({ text, pageSize: 100 }, cancellation_1.CancellationToken.None);
            if (pager.firstPage.length === 0) {
                return;
            }
            const installedExtensionsIds = installed.reduce((result, i) => { result.add(i.identifier.id.toLowerCase()); return result; }, new Set());
            if (pager.firstPage.some(e => installedExtensionsIds.has(e.identifier.id.toLowerCase()))) {
                return;
            }
            this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('showLanguageExtensions', "The Marketplace has extensions that can help with '.{0}' files", fileExtension), [{
                    label: searchMarketplace,
                    run: () => {
                        this.addToPromptedFileExtensions(fileExtension);
                        this.telemetryService.publicLog2('fileExtensionSuggestion:popup', { userReaction: 'ok', fileExtension });
                        this.paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true)
                            .then(viewlet => viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer())
                            .then(viewlet => {
                            viewlet.search(`ext:${fileExtension}`);
                            viewlet.focus();
                        });
                    }
                }, {
                    label: (0, nls_1.localize)('dontShowAgainExtension', "Don't Show Again for '.{0}' files", fileExtension),
                    run: () => {
                        fileExtensionSuggestionIgnoreList.push(fileExtension);
                        this.storageService.store('extensionsAssistant/fileExtensionsSuggestionIgnore', JSON.stringify(fileExtensionSuggestionIgnoreList), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                        this.telemetryService.publicLog2('fileExtensionSuggestion:popup', { userReaction: 'neverShowAgain', fileExtension });
                    }
                }], {
                sticky: true,
                onCancel: () => {
                    this.telemetryService.publicLog2('fileExtensionSuggestion:popup', { userReaction: 'cancelled', fileExtension });
                }
            });
        }
        filterIgnoredOrNotAllowed(recommendationsToSuggest) {
            const ignoredRecommendations = [...this.extensionIgnoredRecommendationsService.ignoredRecommendations, ...this.extensionRecommendationNotificationService.ignoredRecommendations];
            return recommendationsToSuggest.filter(id => !ignoredRecommendations.includes(id));
        }
        filterInstalled(recommendationsToSuggest, installed) {
            const installedExtensionsIds = installed.reduce((result, i) => {
                if (i.enablementState !== 1 /* EnablementState.DisabledByExtensionKind */) {
                    result.add(i.identifier.id.toLowerCase());
                }
                return result;
            }, new Set());
            return recommendationsToSuggest.filter(id => !installedExtensionsIds.has(id.toLowerCase()));
        }
        getCachedRecommendations() {
            let storedRecommendations = JSON.parse(this.storageService.get(recommendationsStorageKey, 0 /* StorageScope.GLOBAL */, '[]'));
            if (Array.isArray(storedRecommendations)) {
                storedRecommendations = storedRecommendations.reduce((result, id) => { result[id] = Date.now(); return result; }, {});
            }
            const result = {};
            (0, collections_1.forEach)(storedRecommendations, ({ key, value }) => {
                if (typeof value === 'number') {
                    result[key.toLowerCase()] = value;
                }
            });
            return result;
        }
        storeCachedRecommendations() {
            const storedRecommendations = {};
            this.fileBasedRecommendations.forEach((value, key) => storedRecommendations[key] = value.recommendedTime);
            this.storageService.store(recommendationsStorageKey, JSON.stringify(storedRecommendations), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
    };
    FileBasedRecommendations = __decorate([
        __param(0, extensions_1.IExtensionsWorkbenchService),
        __param(1, extensions_2.IExtensionService),
        __param(2, panecomposite_1.IPaneCompositePartService),
        __param(3, model_1.IModelService),
        __param(4, language_1.ILanguageService),
        __param(5, productService_1.IProductService),
        __param(6, notification_1.INotificationService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, storage_1.IStorageService),
        __param(9, extensionRecommendations_3.IExtensionRecommendationNotificationService),
        __param(10, extensionRecommendations_2.IExtensionIgnoredRecommendationsService),
        __param(11, assignmentService_1.IWorkbenchAssignmentService),
        __param(12, workspace_1.IWorkspaceContextService),
        __param(13, extensionManagement_1.IExtensionManagementServerService)
    ], FileBasedRecommendations);
    exports.FileBasedRecommendations = FileBasedRecommendations;
});
//# sourceMappingURL=fileBasedRecommendations.js.map