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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations"], function (require, exports, arrays_1, async_1, cancellation_1, errors_1, event_1, lifecycle_1, types_1, nls_1, configuration_1, extensionManagementUtil_1, extensionRecommendations_1, instantiation_1, notification_1, storage_1, telemetry_1, userDataSync_1, extensionsActions_1, extensions_1, environmentService_1, extensionManagement_1, extensionRecommendations_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionRecommendationNotificationService = void 0;
    const ignoreImportantExtensionRecommendationStorageKey = 'extensionsAssistant/importantRecommendationsIgnore';
    const donotShowWorkspaceRecommendationsStorageKey = 'extensionsAssistant/workspaceRecommendationsIgnore';
    const choiceNever = (0, nls_1.localize)('neverShowAgain', "Don't Show Again");
    class RecommendationsNotification {
        constructor(severity, message, choices, notificationService) {
            this.severity = severity;
            this.message = message;
            this.choices = choices;
            this.notificationService = notificationService;
            this._onDidClose = new event_1.Emitter();
            this.onDidClose = this._onDidClose.event;
            this._onDidChangeVisibility = new event_1.Emitter();
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this.cancelled = false;
            this.onDidCloseDisposable = new lifecycle_1.MutableDisposable();
            this.onDidChangeVisibilityDisposable = new lifecycle_1.MutableDisposable();
        }
        show() {
            if (!this.notificationHandle) {
                this.updateNotificationHandle(this.notificationService.prompt(this.severity, this.message, this.choices, { sticky: true, onCancel: () => this.cancelled = true }));
            }
        }
        hide() {
            if (this.notificationHandle) {
                this.onDidCloseDisposable.clear();
                this.notificationHandle.close();
                this.cancelled = false;
                this.updateNotificationHandle(this.notificationService.prompt(this.severity, this.message, this.choices, { silent: true, sticky: false, onCancel: () => this.cancelled = true }));
            }
        }
        isCancelled() {
            return this.cancelled;
        }
        updateNotificationHandle(notificationHandle) {
            this.onDidCloseDisposable.clear();
            this.onDidChangeVisibilityDisposable.clear();
            this.notificationHandle = notificationHandle;
            this.onDidCloseDisposable.value = this.notificationHandle.onDidClose(() => {
                this.onDidCloseDisposable.dispose();
                this.onDidChangeVisibilityDisposable.dispose();
                this._onDidClose.fire();
                this._onDidClose.dispose();
                this._onDidChangeVisibility.dispose();
            });
            this.onDidChangeVisibilityDisposable.value = this.notificationHandle.onDidChangeVisibility((e) => this._onDidChangeVisibility.fire(e));
        }
    }
    let ExtensionRecommendationNotificationService = class ExtensionRecommendationNotificationService {
        constructor(configurationService, storageService, notificationService, telemetryService, instantiationService, extensionsWorkbenchService, extensionManagementService, extensionEnablementService, extensionIgnoredRecommendationsService, userDataSyncEnablementService, workbenchEnvironmentService) {
            this.configurationService = configurationService;
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.instantiationService = instantiationService;
            this.extensionsWorkbenchService = extensionsWorkbenchService;
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionIgnoredRecommendationsService = extensionIgnoredRecommendationsService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.workbenchEnvironmentService = workbenchEnvironmentService;
            this.recommendedExtensions = [];
            this.recommendationSources = [];
            this.pendingNotificaitons = [];
        }
        // Ignored Important Recommendations
        get ignoredRecommendations() {
            return (0, arrays_1.distinct)([...JSON.parse(this.storageService.get(ignoreImportantExtensionRecommendationStorageKey, 0 /* StorageScope.GLOBAL */, '[]'))].map(i => i.toLowerCase()));
        }
        hasToIgnoreRecommendationNotifications() {
            const config = this.configurationService.getValue('extensions');
            return config.ignoreRecommendations || !!config.showRecommendationsOnlyOnDemand;
        }
        async promptImportantExtensionsInstallNotification(extensionIds, message, searchValue, source) {
            const ignoredRecommendations = [...this.extensionIgnoredRecommendationsService.ignoredRecommendations, ...this.ignoredRecommendations];
            extensionIds = extensionIds.filter(id => !ignoredRecommendations.includes(id));
            if (!extensionIds.length) {
                return "ignored" /* RecommendationsNotificationResult.Ignored */;
            }
            return this.promptRecommendationsNotification(extensionIds, message, searchValue, source, {
                onDidInstallRecommendedExtensions: (extensions) => extensions.forEach(extension => this.telemetryService.publicLog2('extensionRecommendations:popup', { userReaction: 'install', extensionId: extension.identifier.id, source: (0, extensionRecommendations_1.RecommendationSourceToString)(source) })),
                onDidShowRecommendedExtensions: (extensions) => extensions.forEach(extension => this.telemetryService.publicLog2('extensionRecommendations:popup', { userReaction: 'show', extensionId: extension.identifier.id, source: (0, extensionRecommendations_1.RecommendationSourceToString)(source) })),
                onDidCancelRecommendedExtensions: (extensions) => extensions.forEach(extension => this.telemetryService.publicLog2('extensionRecommendations:popup', { userReaction: 'cancelled', extensionId: extension.identifier.id, source: (0, extensionRecommendations_1.RecommendationSourceToString)(source) })),
                onDidNeverShowRecommendedExtensionsAgain: (extensions) => {
                    for (const extension of extensions) {
                        this.addToImportantRecommendationsIgnore(extension.identifier.id);
                        this.telemetryService.publicLog2('extensionRecommendations:popup', { userReaction: 'neverShowAgain', extensionId: extension.identifier.id, source: (0, extensionRecommendations_1.RecommendationSourceToString)(source) });
                    }
                    this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('ignoreExtensionRecommendations', "Do you want to ignore all extension recommendations?"), [{
                            label: (0, nls_1.localize)('ignoreAll', "Yes, Ignore All"),
                            run: () => this.setIgnoreRecommendationsConfig(true)
                        }, {
                            label: (0, nls_1.localize)('no', "No"),
                            run: () => this.setIgnoreRecommendationsConfig(false)
                        }]);
                },
            });
        }
        async promptWorkspaceRecommendations(recommendations) {
            if (this.storageService.getBoolean(donotShowWorkspaceRecommendationsStorageKey, 1 /* StorageScope.WORKSPACE */, false)) {
                return;
            }
            let installed = await this.extensionManagementService.getInstalled();
            installed = installed.filter(l => this.extensionEnablementService.getEnablementState(l) !== 1 /* EnablementState.DisabledByExtensionKind */); // Filter extensions disabled by kind
            recommendations = recommendations.filter(extensionId => installed.every(local => !(0, extensionManagementUtil_1.areSameExtensions)({ id: extensionId }, local.identifier)));
            if (!recommendations.length) {
                return;
            }
            const message = (extensions) => extensions.length === 1 ? (0, nls_1.localize)('singleExtensionRecommended', "'{0}' extension is recommended for this repository. Do you want to install?", extensions[0].displayName) : (0, nls_1.localize)('workspaceRecommended', "Do you want to install the recommended extensions for this repository?");
            const result = await this.promptRecommendationsNotification(recommendations, message, '@recommended ', 2 /* RecommendationSource.WORKSPACE */, {
                onDidInstallRecommendedExtensions: () => this.telemetryService.publicLog2('extensionWorkspaceRecommendations:popup', { userReaction: 'install' }),
                onDidShowRecommendedExtensions: () => this.telemetryService.publicLog2('extensionWorkspaceRecommendations:popup', { userReaction: 'show' }),
                onDidCancelRecommendedExtensions: () => this.telemetryService.publicLog2('extensionWorkspaceRecommendations:popup', { userReaction: 'cancelled' }),
                onDidNeverShowRecommendedExtensionsAgain: () => this.telemetryService.publicLog2('extensionWorkspaceRecommendations:popup', { userReaction: 'neverShowAgain' }),
            });
            if (result === "reacted" /* RecommendationsNotificationResult.Accepted */) {
                this.storageService.store(donotShowWorkspaceRecommendationsStorageKey, true, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            }
        }
        async promptRecommendationsNotification(extensionIds, message, searchValue, source, recommendationsNotificationActions) {
            if (this.hasToIgnoreRecommendationNotifications()) {
                return "ignored" /* RecommendationsNotificationResult.Ignored */;
            }
            // Do not show exe based recommendations in remote window
            if (source === 3 /* RecommendationSource.EXE */ && this.workbenchEnvironmentService.remoteAuthority) {
                return "incompatibleWindow" /* RecommendationsNotificationResult.IncompatibleWindow */;
            }
            // Ignore exe recommendation if the window
            // 		=> has shown an exe based recommendation already
            // 		=> or has shown any two recommendations already
            if (source === 3 /* RecommendationSource.EXE */ && (this.recommendationSources.includes(3 /* RecommendationSource.EXE */) || this.recommendationSources.length >= 2)) {
                return "toomany" /* RecommendationsNotificationResult.TooMany */;
            }
            this.recommendationSources.push(source);
            // Ignore exe recommendation if recommendations are already shown
            if (source === 3 /* RecommendationSource.EXE */ && extensionIds.every(id => this.recommendedExtensions.includes(id))) {
                return "ignored" /* RecommendationsNotificationResult.Ignored */;
            }
            const extensions = await this.getInstallableExtensions(extensionIds);
            if (!extensions.length) {
                return "ignored" /* RecommendationsNotificationResult.Ignored */;
            }
            this.recommendedExtensions = (0, arrays_1.distinct)([...this.recommendedExtensions, ...extensionIds]);
            return (0, async_1.raceCancellablePromises)([
                this.showRecommendationsNotification(extensions, (0, types_1.isString)(message) ? message : message(extensions), searchValue, source, recommendationsNotificationActions),
                this.waitUntilRecommendationsAreInstalled(extensions)
            ]);
        }
        showRecommendationsNotification(extensions, message, searchValue, source, { onDidInstallRecommendedExtensions, onDidShowRecommendedExtensions, onDidCancelRecommendedExtensions, onDidNeverShowRecommendedExtensionsAgain }) {
            return (0, async_1.createCancelablePromise)(async (token) => {
                let accepted = false;
                const choices = [];
                const installExtensions = async (isMachineScoped) => {
                    this.runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, searchValue));
                    onDidInstallRecommendedExtensions(extensions);
                    await async_1.Promises.settled([
                        async_1.Promises.settled(extensions.map(extension => this.extensionsWorkbenchService.open(extension, { pinned: true }))),
                        this.extensionManagementService.installExtensions(extensions.map(e => e.gallery), { isMachineScoped })
                    ]);
                };
                choices.push({
                    label: (0, nls_1.localize)('install', "Install"),
                    run: () => installExtensions(),
                    menu: this.userDataSyncEnablementService.isEnabled() && this.userDataSyncEnablementService.isResourceEnabled("extensions" /* SyncResource.Extensions */) ? [{
                            label: (0, nls_1.localize)('install and do no sync', "Install (Do not sync)"),
                            run: () => installExtensions(true)
                        }] : undefined,
                });
                choices.push(...[{
                        label: (0, nls_1.localize)('show recommendations', "Show Recommendations"),
                        run: async () => {
                            onDidShowRecommendedExtensions(extensions);
                            for (const extension of extensions) {
                                this.extensionsWorkbenchService.open(extension, { pinned: true });
                            }
                            this.runAction(this.instantiationService.createInstance(extensionsActions_1.SearchExtensionsAction, searchValue));
                        }
                    }, {
                        label: choiceNever,
                        isSecondary: true,
                        run: () => {
                            onDidNeverShowRecommendedExtensionsAgain(extensions);
                        }
                    }]);
                try {
                    accepted = await this.doShowRecommendationsNotification(notification_1.Severity.Info, message, choices, source, token);
                }
                catch (error) {
                    if (!(0, errors_1.isCancellationError)(error)) {
                        throw error;
                    }
                }
                if (accepted) {
                    return "reacted" /* RecommendationsNotificationResult.Accepted */;
                }
                else {
                    onDidCancelRecommendedExtensions(extensions);
                    return "cancelled" /* RecommendationsNotificationResult.Cancelled */;
                }
            });
        }
        waitUntilRecommendationsAreInstalled(extensions) {
            const installedExtensions = [];
            const disposables = new lifecycle_1.DisposableStore();
            return (0, async_1.createCancelablePromise)(async (token) => {
                disposables.add(token.onCancellationRequested(e => disposables.dispose()));
                return new Promise((c, e) => {
                    disposables.add(this.extensionManagementService.onInstallExtension(e => {
                        installedExtensions.push(e.identifier.id.toLowerCase());
                        if (extensions.every(e => installedExtensions.includes(e.identifier.id.toLowerCase()))) {
                            c("reacted" /* RecommendationsNotificationResult.Accepted */);
                        }
                    }));
                });
            });
        }
        /**
         * Show recommendations in Queue
         * At any time only one recommendation is shown
         * If a new recommendation comes in
         * 		=> If no recommendation is visible, show it immediately
         *		=> Otherwise, add to the pending queue
         * 			=> If it is not exe based and has higher or same priority as current, hide the current notification after showing it for 3s.
         * 			=> Otherwise wait until the current notification is hidden.
         */
        async doShowRecommendationsNotification(severity, message, choices, source, token) {
            const disposables = new lifecycle_1.DisposableStore();
            try {
                const recommendationsNotification = new RecommendationsNotification(severity, message, choices, this.notificationService);
                event_1.Event.once(event_1.Event.filter(recommendationsNotification.onDidChangeVisibility, e => !e))(() => this.showNextNotification());
                if (this.visibleNotification) {
                    const index = this.pendingNotificaitons.length;
                    token.onCancellationRequested(() => this.pendingNotificaitons.splice(index, 1), disposables);
                    this.pendingNotificaitons.push({ recommendationsNotification, source, token });
                    if (source !== 3 /* RecommendationSource.EXE */ && source <= this.visibleNotification.source) {
                        this.hideVisibleNotification(3000);
                    }
                }
                else {
                    this.visibleNotification = { recommendationsNotification, source, from: Date.now() };
                    recommendationsNotification.show();
                }
                await (0, async_1.raceCancellation)(event_1.Event.toPromise(recommendationsNotification.onDidClose), token);
                return !recommendationsNotification.isCancelled();
            }
            finally {
                disposables.dispose();
            }
        }
        showNextNotification() {
            const index = this.getNextPendingNotificationIndex();
            const [nextNotificaiton] = index > -1 ? this.pendingNotificaitons.splice(index, 1) : [];
            // Show the next notification after a delay of 500ms (after the current notification is dismissed)
            (0, async_1.timeout)(nextNotificaiton ? 500 : 0)
                .then(() => {
                this.unsetVisibileNotification();
                if (nextNotificaiton) {
                    this.visibleNotification = { recommendationsNotification: nextNotificaiton.recommendationsNotification, source: nextNotificaiton.source, from: Date.now() };
                    nextNotificaiton.recommendationsNotification.show();
                }
            });
        }
        /**
         * Return the recent high priroity pending notification
         */
        getNextPendingNotificationIndex() {
            let index = this.pendingNotificaitons.length - 1;
            if (this.pendingNotificaitons.length) {
                for (let i = 0; i < this.pendingNotificaitons.length; i++) {
                    if (this.pendingNotificaitons[i].source <= this.pendingNotificaitons[index].source) {
                        index = i;
                    }
                }
            }
            return index;
        }
        hideVisibleNotification(timeInMillis) {
            if (this.visibleNotification && !this.hideVisibleNotificationPromise) {
                const visibleNotification = this.visibleNotification;
                this.hideVisibleNotificationPromise = (0, async_1.timeout)(Math.max(timeInMillis - (Date.now() - visibleNotification.from), 0));
                this.hideVisibleNotificationPromise.then(() => visibleNotification.recommendationsNotification.hide());
            }
        }
        unsetVisibileNotification() {
            var _a;
            (_a = this.hideVisibleNotificationPromise) === null || _a === void 0 ? void 0 : _a.cancel();
            this.hideVisibleNotificationPromise = undefined;
            this.visibleNotification = undefined;
        }
        async getInstallableExtensions(extensionIds) {
            const result = [];
            if (extensionIds.length) {
                const extensions = await this.extensionsWorkbenchService.getExtensions(extensionIds.map(id => ({ id })), { source: 'install-recommendations' }, cancellation_1.CancellationToken.None);
                for (const extension of extensions) {
                    if (extension.gallery && (await this.extensionManagementService.canInstall(extension.gallery))) {
                        result.push(extension);
                    }
                }
            }
            return result;
        }
        async runAction(action) {
            try {
                await action.run();
            }
            finally {
                action.dispose();
            }
        }
        addToImportantRecommendationsIgnore(id) {
            const importantRecommendationsIgnoreList = [...this.ignoredRecommendations];
            if (!importantRecommendationsIgnoreList.includes(id.toLowerCase())) {
                importantRecommendationsIgnoreList.push(id.toLowerCase());
                this.storageService.store(ignoreImportantExtensionRecommendationStorageKey, JSON.stringify(importantRecommendationsIgnoreList), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            }
        }
        setIgnoreRecommendationsConfig(configVal) {
            this.configurationService.updateValue('extensions.ignoreRecommendations', configVal);
        }
    };
    ExtensionRecommendationNotificationService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, storage_1.IStorageService),
        __param(2, notification_1.INotificationService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, extensions_1.IExtensionsWorkbenchService),
        __param(6, extensionManagement_1.IWorkbenchExtensionManagementService),
        __param(7, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(8, extensionRecommendations_2.IExtensionIgnoredRecommendationsService),
        __param(9, userDataSync_1.IUserDataSyncEnablementService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService)
    ], ExtensionRecommendationNotificationService);
    exports.ExtensionRecommendationNotificationService = ExtensionRecommendationNotificationService;
});
//# sourceMappingURL=extensionRecommendationNotificationService.js.map