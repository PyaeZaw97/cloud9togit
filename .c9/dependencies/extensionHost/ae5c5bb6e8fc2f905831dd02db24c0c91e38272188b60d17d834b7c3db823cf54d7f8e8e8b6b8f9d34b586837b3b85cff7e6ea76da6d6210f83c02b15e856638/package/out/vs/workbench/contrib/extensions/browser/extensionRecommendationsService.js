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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/base/common/arrays", "vs/base/common/event", "vs/platform/environment/common/environment", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/contrib/extensions/browser/dynamicWorkspaceRecommendations", "vs/workbench/contrib/extensions/browser/exeBasedRecommendations", "vs/workbench/contrib/extensions/browser/experimentalRecommendations", "vs/workbench/contrib/extensions/browser/workspaceRecommendations", "vs/workbench/contrib/extensions/browser/fileBasedRecommendations", "vs/workbench/contrib/extensions/browser/keymapRecommendations", "vs/workbench/contrib/extensions/browser/languageRecommendations", "vs/workbench/contrib/extensions/browser/configBasedRecommendations", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/base/common/async", "vs/base/common/uri", "vs/workbench/contrib/extensions/browser/webRecommendations", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagementUtil"], function (require, exports, lifecycle_1, extensionManagement_1, extensionRecommendations_1, instantiation_1, telemetry_1, arrays_1, event_1, environment_1, lifecycle_2, dynamicWorkspaceRecommendations_1, exeBasedRecommendations_1, experimentalRecommendations_1, workspaceRecommendations_1, fileBasedRecommendations_1, keymapRecommendations_1, languageRecommendations_1, configBasedRecommendations_1, extensionRecommendations_2, async_1, uri_1, webRecommendations_1, extensions_1, extensionManagementUtil_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionRecommendationsService = void 0;
    let ExtensionRecommendationsService = class ExtensionRecommendationsService extends lifecycle_1.Disposable {
        constructor(instantiationService, lifecycleService, galleryService, telemetryService, environmentService, extensionManagementService, extensionRecommendationsManagementService, extensionRecommendationNotificationService, extensionsWorkbenchService) {
            super();
            this.lifecycleService = lifecycleService;
            this.galleryService = galleryService;
            this.telemetryService = telemetryService;
            this.environmentService = environmentService;
            this.extensionManagementService = extensionManagementService;
            this.extensionRecommendationsManagementService = extensionRecommendationsManagementService;
            this.extensionRecommendationNotificationService = extensionRecommendationNotificationService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this._onDidChangeRecommendations = this._register(new event_1.Emitter());
            this.onDidChangeRecommendations = this._onDidChangeRecommendations.event;
            this.workspaceRecommendations = instantiationService.createInstance(workspaceRecommendations_1.WorkspaceRecommendations);
            this.fileBasedRecommendations = instantiationService.createInstance(fileBasedRecommendations_1.FileBasedRecommendations);
            this.experimentalRecommendations = instantiationService.createInstance(experimentalRecommendations_1.ExperimentalRecommendations);
            this.configBasedRecommendations = instantiationService.createInstance(configBasedRecommendations_1.ConfigBasedRecommendations);
            this.exeBasedRecommendations = instantiationService.createInstance(exeBasedRecommendations_1.ExeBasedRecommendations);
            this.dynamicWorkspaceRecommendations = instantiationService.createInstance(dynamicWorkspaceRecommendations_1.DynamicWorkspaceRecommendations);
            this.keymapRecommendations = instantiationService.createInstance(keymapRecommendations_1.KeymapRecommendations);
            this.webRecommendations = instantiationService.createInstance(webRecommendations_1.WebRecommendations);
            this.languageRecommendations = instantiationService.createInstance(languageRecommendations_1.LanguageRecommendations);
            if (!this.isEnabled()) {
                this.sessionSeed = 0;
                this.activationPromise = Promise.resolve();
                return;
            }
            this.sessionSeed = +new Date();
            // Activation
            this.activationPromise = this.activate();
            this._register(this.extensionManagementService.onDidInstallExtensions(e => this.onDidInstallExtensions(e)));
        }
        async activate() {
            await this.lifecycleService.when(3 /* LifecyclePhase.Restored */);
            // activate all recommendations
            await Promise.all([
                this.workspaceRecommendations.activate(),
                this.configBasedRecommendations.activate(),
                this.fileBasedRecommendations.activate(),
                this.experimentalRecommendations.activate(),
                this.keymapRecommendations.activate(),
                this.languageRecommendations.activate(),
                this.webRecommendations.activate()
            ]);
            this._register(event_1.Event.any(this.workspaceRecommendations.onDidChangeRecommendations, this.configBasedRecommendations.onDidChangeRecommendations, this.extensionRecommendationsManagementService.onDidChangeIgnoredRecommendations)(() => this._onDidChangeRecommendations.fire()));
            this._register(this.extensionRecommendationsManagementService.onDidChangeGlobalIgnoredRecommendation(({ extensionId, isRecommended }) => {
                if (!isRecommended) {
                    const reason = this.getAllRecommendationsWithReason()[extensionId];
                    if (reason && reason.reasonId) {
                        this.telemetryService.publicLog2('extensionsRecommendations:ignoreRecommendation', { extensionId, recommendationReason: reason.reasonId });
                    }
                }
            }));
            this.promptWorkspaceRecommendations();
        }
        isEnabled() {
            return this.galleryService.isEnabled() && !this.environmentService.isExtensionDevelopment;
        }
        async activateProactiveRecommendations() {
            await Promise.all([this.dynamicWorkspaceRecommendations.activate(), this.exeBasedRecommendations.activate(), this.configBasedRecommendations.activate()]);
        }
        getAllRecommendationsWithReason() {
            /* Activate proactive recommendations */
            this.activateProactiveRecommendations();
            const output = Object.create(null);
            const allRecommendations = [
                ...this.dynamicWorkspaceRecommendations.recommendations,
                ...this.configBasedRecommendations.recommendations,
                ...this.exeBasedRecommendations.recommendations,
                ...this.experimentalRecommendations.recommendations,
                ...this.fileBasedRecommendations.recommendations,
                ...this.workspaceRecommendations.recommendations,
                ...this.keymapRecommendations.recommendations,
                ...this.languageRecommendations.recommendations,
                ...this.webRecommendations.recommendations,
            ];
            for (const { extensionId, reason } of allRecommendations) {
                if (this.isExtensionAllowedToBeRecommended(extensionId)) {
                    output[extensionId.toLowerCase()] = reason;
                }
            }
            return output;
        }
        async getConfigBasedRecommendations() {
            await this.configBasedRecommendations.activate();
            return {
                important: this.toExtensionRecommendations(this.configBasedRecommendations.importantRecommendations),
                others: this.toExtensionRecommendations(this.configBasedRecommendations.otherRecommendations)
            };
        }
        async getOtherRecommendations() {
            await this.activationPromise;
            await this.activateProactiveRecommendations();
            const recommendations = [
                ...this.configBasedRecommendations.otherRecommendations,
                ...this.exeBasedRecommendations.otherRecommendations,
                ...this.dynamicWorkspaceRecommendations.recommendations,
                ...this.experimentalRecommendations.recommendations,
                ...this.webRecommendations.recommendations
            ];
            const extensionIds = (0, arrays_1.distinct)(recommendations.map(e => e.extensionId))
                .filter(extensionId => this.isExtensionAllowedToBeRecommended(extensionId));
            (0, arrays_1.shuffle)(extensionIds, this.sessionSeed);
            return extensionIds;
        }
        async getImportantRecommendations() {
            await this.activateProactiveRecommendations();
            const recommendations = [
                ...this.fileBasedRecommendations.importantRecommendations,
                ...this.configBasedRecommendations.importantRecommendations,
                ...this.exeBasedRecommendations.importantRecommendations,
            ];
            const extensionIds = (0, arrays_1.distinct)(recommendations.map(e => e.extensionId))
                .filter(extensionId => this.isExtensionAllowedToBeRecommended(extensionId));
            (0, arrays_1.shuffle)(extensionIds, this.sessionSeed);
            return extensionIds;
        }
        getKeymapRecommendations() {
            return this.toExtensionRecommendations(this.keymapRecommendations.recommendations);
        }
        getLanguageRecommendations() {
            return this.toExtensionRecommendations(this.languageRecommendations.recommendations);
        }
        async getWorkspaceRecommendations() {
            if (!this.isEnabled()) {
                return [];
            }
            await this.workspaceRecommendations.activate();
            return this.toExtensionRecommendations(this.workspaceRecommendations.recommendations);
        }
        async getExeBasedRecommendations(exe) {
            await this.exeBasedRecommendations.activate();
            const { important, others } = exe ? this.exeBasedRecommendations.getRecommendations(exe)
                : { important: this.exeBasedRecommendations.importantRecommendations, others: this.exeBasedRecommendations.otherRecommendations };
            return { important: this.toExtensionRecommendations(important), others: this.toExtensionRecommendations(others) };
        }
        getFileBasedRecommendations() {
            return this.toExtensionRecommendations(this.fileBasedRecommendations.recommendations);
        }
        onDidInstallExtensions(results) {
            for (const e of results) {
                if (e.source && !uri_1.URI.isUri(e.source) && e.operation === 2 /* InstallOperation.Install */) {
                    const extRecommendations = this.getAllRecommendationsWithReason() || {};
                    const recommendationReason = extRecommendations[e.source.identifier.id.toLowerCase()];
                    if (recommendationReason) {
                        /* __GDPR__
                            "extensionGallery:install:recommendations" : {
                                "recommendationReason": { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true },
                                "${include}": [
                                    "${GalleryExtensionTelemetryData}"
                                ]
                            }
                        */
                        this.telemetryService.publicLog('extensionGallery:install:recommendations', Object.assign(Object.assign({}, e.source.telemetryData), { recommendationReason: recommendationReason.reasonId }));
                    }
                }
            }
        }
        toExtensionRecommendations(recommendations) {
            const extensionIds = (0, arrays_1.distinct)(recommendations.map(e => e.extensionId))
                .filter(extensionId => this.isExtensionAllowedToBeRecommended(extensionId));
            return extensionIds;
        }
        isExtensionAllowedToBeRecommended(extensionId) {
            return !this.extensionRecommendationsManagementService.ignoredRecommendations.includes(extensionId.toLowerCase());
        }
        // for testing
        get workbenchRecommendationDelay() {
            // remote extensions might still being installed #124119
            return 5000;
        }
        async promptWorkspaceRecommendations() {
            const installed = await this.extensionsWorkbenchService.queryLocal();
            const allowedRecommendations = [
                ...this.workspaceRecommendations.recommendations,
                ...this.configBasedRecommendations.importantRecommendations.filter(recommendation => !recommendation.whenNotInstalled || recommendation.whenNotInstalled.every(id => installed.every(local => !(0, extensionManagementUtil_1.areSameExtensions)(local.identifier, { id }))))
            ]
                .map(({ extensionId }) => extensionId)
                .filter(extensionId => this.isExtensionAllowedToBeRecommended(extensionId));
            if (allowedRecommendations.length) {
                await (0, async_1.timeout)(this.workbenchRecommendationDelay);
                await this.extensionRecommendationNotificationService.promptWorkspaceRecommendations(allowedRecommendations);
            }
        }
    };
    ExtensionRecommendationsService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, lifecycle_2.ILifecycleService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, environment_1.IEnvironmentService),
        __param(5, extensionManagement_1.IExtensionManagementService),
        __param(6, extensionRecommendations_1.IExtensionIgnoredRecommendationsService),
        __param(7, extensionRecommendations_2.IExtensionRecommendationNotificationService),
        __param(8, extensions_1.IExtensionsWorkbenchService)
    ], ExtensionRecommendationsService);
    exports.ExtensionRecommendationsService = ExtensionRecommendationsService;
});
//# sourceMappingURL=extensionRecommendationsService.js.map