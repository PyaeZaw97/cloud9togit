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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/services/activity/common/activity", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/platform/update/common/update", "vs/platform/notification/common/notification", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/contrib/update/browser/releaseNotesEditor", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/workbench/contrib/update/common/update", "vs/workbench/services/host/browser/host", "vs/platform/product/common/productService", "vs/platform/product/common/product", "vs/platform/userDataSync/common/userDataSync", "vs/platform/contextkey/common/contextkeys", "vs/base/common/async", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/event"], function (require, exports, nls, severity_1, actions_1, lifecycle_1, uri_1, activity_1, instantiation_1, opener_1, storage_1, update_1, notification_1, dialogs_1, environmentService_1, releaseNotesEditor_1, platform_1, configuration_1, contextkey_1, actions_2, commands_1, update_2, host_1, productService_1, product_1, userDataSync_1, contextkeys_1, async_1, userDataSync_2, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CheckForVSCodeUpdateAction = exports.SwitchProductQualityContribution = exports.UpdateContribution = exports.ProductContribution = exports.ShowCurrentReleaseNotesAction = exports.ShowReleaseNotesAction = exports.AbstractShowReleaseNotesAction = exports.OpenLatestReleaseNotesInBrowserAction = exports.CONTEXT_UPDATE_STATE = void 0;
    exports.CONTEXT_UPDATE_STATE = new contextkey_1.RawContextKey('updateState', "idle" /* StateType.Idle */);
    let releaseNotesManager = undefined;
    function showReleaseNotes(instantiationService, version) {
        if (!releaseNotesManager) {
            releaseNotesManager = instantiationService.createInstance(releaseNotesEditor_1.ReleaseNotesManager);
        }
        return instantiationService.invokeFunction(accessor => releaseNotesManager.show(accessor, version));
    }
    let OpenLatestReleaseNotesInBrowserAction = class OpenLatestReleaseNotesInBrowserAction extends actions_1.Action {
        constructor(openerService, productService) {
            super('update.openLatestReleaseNotes', nls.localize('releaseNotes', "Release Notes"), undefined, true);
            this.openerService = openerService;
            this.productService = productService;
        }
        async run() {
            if (this.productService.releaseNotesUrl) {
                const uri = uri_1.URI.parse(this.productService.releaseNotesUrl);
                await this.openerService.open(uri);
            }
            else {
                throw new Error(nls.localize('update.noReleaseNotesOnline', "This version of {0} does not have release notes online", this.productService.nameLong));
            }
        }
    };
    OpenLatestReleaseNotesInBrowserAction = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, productService_1.IProductService)
    ], OpenLatestReleaseNotesInBrowserAction);
    exports.OpenLatestReleaseNotesInBrowserAction = OpenLatestReleaseNotesInBrowserAction;
    let AbstractShowReleaseNotesAction = class AbstractShowReleaseNotesAction extends actions_1.Action {
        constructor(id, label, version, instantiationService) {
            super(id, label, undefined, true);
            this.version = version;
            this.instantiationService = instantiationService;
        }
        async run() {
            if (!this.enabled) {
                return;
            }
            this.enabled = false;
            try {
                await showReleaseNotes(this.instantiationService, this.version);
            }
            catch (err) {
                const action = this.instantiationService.createInstance(OpenLatestReleaseNotesInBrowserAction);
                try {
                    await action.run();
                }
                catch (err2) {
                    throw new Error(`${err.message} and ${err2.message}`);
                }
            }
        }
    };
    AbstractShowReleaseNotesAction = __decorate([
        __param(3, instantiation_1.IInstantiationService)
    ], AbstractShowReleaseNotesAction);
    exports.AbstractShowReleaseNotesAction = AbstractShowReleaseNotesAction;
    let ShowReleaseNotesAction = class ShowReleaseNotesAction extends AbstractShowReleaseNotesAction {
        constructor(version, instantiationService) {
            super('update.showReleaseNotes', nls.localize('releaseNotes', "Release Notes"), version, instantiationService);
        }
    };
    ShowReleaseNotesAction = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ShowReleaseNotesAction);
    exports.ShowReleaseNotesAction = ShowReleaseNotesAction;
    let ShowCurrentReleaseNotesAction = class ShowCurrentReleaseNotesAction extends AbstractShowReleaseNotesAction {
        constructor(id = ShowCurrentReleaseNotesAction.ID, label = ShowCurrentReleaseNotesAction.LABEL, instantiationService, productService) {
            super(id, label, productService.version, instantiationService);
        }
    };
    ShowCurrentReleaseNotesAction.ID = update_2.ShowCurrentReleaseNotesActionId;
    ShowCurrentReleaseNotesAction.LABEL = nls.localize('showReleaseNotes', "Show Release Notes");
    ShowCurrentReleaseNotesAction.AVAILABE = !!product_1.default.releaseNotesUrl;
    ShowCurrentReleaseNotesAction = __decorate([
        __param(2, instantiation_1.IInstantiationService),
        __param(3, productService_1.IProductService)
    ], ShowCurrentReleaseNotesAction);
    exports.ShowCurrentReleaseNotesAction = ShowCurrentReleaseNotesAction;
    function parseVersion(version) {
        const match = /([0-9]+)\.([0-9]+)\.([0-9]+)/.exec(version);
        if (!match) {
            return undefined;
        }
        return {
            major: parseInt(match[1]),
            minor: parseInt(match[2]),
            patch: parseInt(match[3])
        };
    }
    function isMajorMinorUpdate(before, after) {
        return before.major < after.major || before.minor < after.minor;
    }
    let ProductContribution = class ProductContribution {
        constructor(storageService, instantiationService, notificationService, environmentService, openerService, configurationService, hostService, productService) {
            hostService.hadLastFocus().then(async (hadLastFocus) => {
                if (!hadLastFocus) {
                    return;
                }
                const lastVersion = parseVersion(storageService.get(ProductContribution.KEY, 0 /* StorageScope.GLOBAL */, ''));
                const currentVersion = parseVersion(productService.version);
                const shouldShowReleaseNotes = configurationService.getValue('update.showReleaseNotes');
                const releaseNotesUrl = productService.releaseNotesUrl;
                // was there a major/minor update? if so, open release notes
                if (shouldShowReleaseNotes && !environmentService.skipReleaseNotes && releaseNotesUrl && lastVersion && currentVersion && isMajorMinorUpdate(lastVersion, currentVersion)) {
                    showReleaseNotes(instantiationService, productService.version)
                        .then(undefined, () => {
                        notificationService.prompt(severity_1.default.Info, nls.localize('read the release notes', "Welcome to {0} v{1}! Would you like to read the Release Notes?", productService.nameLong, productService.version), [{
                                label: nls.localize('releaseNotes', "Release Notes"),
                                run: () => {
                                    const uri = uri_1.URI.parse(releaseNotesUrl);
                                    openerService.open(uri);
                                }
                            }]);
                    });
                }
                storageService.store(ProductContribution.KEY, productService.version, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            });
        }
    };
    ProductContribution.KEY = 'releaseNotes/lastVersion';
    ProductContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notification_1.INotificationService),
        __param(3, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(4, opener_1.IOpenerService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, host_1.IHostService),
        __param(7, productService_1.IProductService)
    ], ProductContribution);
    exports.ProductContribution = ProductContribution;
    let UpdateContribution = class UpdateContribution extends lifecycle_1.Disposable {
        constructor(storageService, instantiationService, notificationService, dialogService, updateService, activityService, contextKeyService, productService, hostService) {
            super();
            this.storageService = storageService;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.updateService = updateService;
            this.activityService = activityService;
            this.contextKeyService = contextKeyService;
            this.productService = productService;
            this.hostService = hostService;
            this.badgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.state = updateService.state;
            this.updateStateContextKey = exports.CONTEXT_UPDATE_STATE.bindTo(this.contextKeyService);
            this._register(updateService.onStateChange(this.onUpdateStateChange, this));
            this.onUpdateStateChange(this.updateService.state);
            /*
            The `update/lastKnownVersion` and `update/updateNotificationTime` storage keys are used in
            combination to figure out when to show a message to the user that he should update.
    
            This message should appear if the user has received an update notification but hasn't
            updated since 5 days.
            */
            const currentVersion = this.productService.commit;
            const lastKnownVersion = this.storageService.get('update/lastKnownVersion', 0 /* StorageScope.GLOBAL */);
            // if current version != stored version, clear both fields
            if (currentVersion !== lastKnownVersion) {
                this.storageService.remove('update/lastKnownVersion', 0 /* StorageScope.GLOBAL */);
                this.storageService.remove('update/updateNotificationTime', 0 /* StorageScope.GLOBAL */);
            }
            this.registerGlobalActivityActions();
        }
        async onUpdateStateChange(state) {
            this.updateStateContextKey.set(state.type);
            switch (state.type) {
                case "idle" /* StateType.Idle */:
                    if (state.error) {
                        this.onError(state.error);
                    }
                    else if (this.state.type === "checking for updates" /* StateType.CheckingForUpdates */ && this.state.explicit && await this.hostService.hadLastFocus()) {
                        this.onUpdateNotAvailable();
                    }
                    break;
                case "available for download" /* StateType.AvailableForDownload */:
                    this.onUpdateAvailable(state.update);
                    break;
                case "downloaded" /* StateType.Downloaded */:
                    this.onUpdateDownloaded(state.update);
                    break;
                case "ready" /* StateType.Ready */:
                    this.onUpdateReady(state.update);
                    break;
            }
            let badge = undefined;
            let clazz;
            let priority = undefined;
            if (state.type === "available for download" /* StateType.AvailableForDownload */ || state.type === "downloaded" /* StateType.Downloaded */ || state.type === "ready" /* StateType.Ready */) {
                badge = new activity_1.NumberBadge(1, () => nls.localize('updateIsReady', "New {0} update available.", this.productService.nameShort));
            }
            else if (state.type === "checking for updates" /* StateType.CheckingForUpdates */) {
                badge = new activity_1.ProgressBadge(() => nls.localize('checkingForUpdates', "Checking for Updates..."));
                clazz = 'progress-badge';
                priority = 1;
            }
            else if (state.type === "downloading" /* StateType.Downloading */) {
                badge = new activity_1.ProgressBadge(() => nls.localize('downloading', "Downloading..."));
                clazz = 'progress-badge';
                priority = 1;
            }
            else if (state.type === "updating" /* StateType.Updating */) {
                badge = new activity_1.ProgressBadge(() => nls.localize('updating', "Updating..."));
                clazz = 'progress-badge';
                priority = 1;
            }
            this.badgeDisposable.clear();
            if (badge) {
                this.badgeDisposable.value = this.activityService.showGlobalActivity({ badge, clazz, priority });
            }
            this.state = state;
        }
        onError(error) {
            if (/The request timed out|The network connection was lost/i.test(error)) {
                return;
            }
            error = error.replace(/See https:\/\/github\.com\/Squirrel\/Squirrel\.Mac\/issues\/182 for more information/, 'This might mean the application was put on quarantine by macOS. See [this link](https://github.com/microsoft/vscode/issues/7426#issuecomment-425093469) for more information');
            this.notificationService.notify({
                severity: notification_1.Severity.Error,
                message: error,
                source: nls.localize('update service', "Update Service"),
            });
        }
        onUpdateNotAvailable() {
            this.dialogService.show(severity_1.default.Info, nls.localize('noUpdatesAvailable', "There are currently no updates available."));
        }
        // linux
        onUpdateAvailable(update) {
            if (!this.shouldShowNotification()) {
                return;
            }
            this.notificationService.prompt(severity_1.default.Info, nls.localize('thereIsUpdateAvailable', "There is an available update."), [{
                    label: nls.localize('download update', "Download Update"),
                    run: () => this.updateService.downloadUpdate()
                }, {
                    label: nls.localize('later', "Later"),
                    run: () => { }
                }, {
                    label: nls.localize('releaseNotes', "Release Notes"),
                    run: () => {
                        const action = this.instantiationService.createInstance(ShowReleaseNotesAction, update.productVersion);
                        action.run();
                        action.dispose();
                    }
                }]);
        }
        // windows fast updates (target === system)
        onUpdateDownloaded(update) {
            if (!this.shouldShowNotification()) {
                return;
            }
            this.notificationService.prompt(severity_1.default.Info, nls.localize('updateAvailable', "There's an update available: {0} {1}", this.productService.nameLong, update.productVersion), [{
                    label: nls.localize('installUpdate', "Install Update"),
                    run: () => this.updateService.applyUpdate()
                }, {
                    label: nls.localize('later', "Later"),
                    run: () => { }
                }, {
                    label: nls.localize('releaseNotes', "Release Notes"),
                    run: () => {
                        const action = this.instantiationService.createInstance(ShowReleaseNotesAction, update.productVersion);
                        action.run();
                        action.dispose();
                    }
                }]);
        }
        // windows and mac
        onUpdateReady(update) {
            if (!(platform_1.isWindows && this.productService.target !== 'user') && !this.shouldShowNotification()) {
                return;
            }
            const actions = [{
                    label: nls.localize('updateNow', "Update Now"),
                    run: () => this.updateService.quitAndInstall()
                }, {
                    label: nls.localize('later', "Later"),
                    run: () => { }
                }];
            // TODO@joao check why snap updates send `update` as falsy
            if (update.productVersion) {
                actions.push({
                    label: nls.localize('releaseNotes', "Release Notes"),
                    run: () => {
                        const action = this.instantiationService.createInstance(ShowReleaseNotesAction, update.productVersion);
                        action.run();
                        action.dispose();
                    }
                });
            }
            // windows user fast updates and mac
            this.notificationService.prompt(severity_1.default.Info, nls.localize('updateAvailableAfterRestart', "Restart {0} to apply the latest update.", this.productService.nameLong), actions, { sticky: true });
        }
        shouldShowNotification() {
            const currentVersion = this.productService.commit;
            const currentMillis = new Date().getTime();
            const lastKnownVersion = this.storageService.get('update/lastKnownVersion', 0 /* StorageScope.GLOBAL */);
            // if version != stored version, save version and date
            if (currentVersion !== lastKnownVersion) {
                this.storageService.store('update/lastKnownVersion', currentVersion, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                this.storageService.store('update/updateNotificationTime', currentMillis, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            }
            const updateNotificationMillis = this.storageService.getNumber('update/updateNotificationTime', 0 /* StorageScope.GLOBAL */, currentMillis);
            const diffDays = (currentMillis - updateNotificationMillis) / (1000 * 60 * 60 * 24);
            return diffDays > 5;
        }
        registerGlobalActivityActions() {
            commands_1.CommandsRegistry.registerCommand('update.check', () => this.updateService.checkForUpdates(true));
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                group: '7_update',
                command: {
                    id: 'update.check',
                    title: nls.localize('checkForUpdates', "Check for Updates...")
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("idle" /* StateType.Idle */)
            });
            commands_1.CommandsRegistry.registerCommand('update.checking', () => { });
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                group: '7_update',
                command: {
                    id: 'update.checking',
                    title: nls.localize('checkingForUpdates', "Checking for Updates..."),
                    precondition: contextkey_1.ContextKeyExpr.false()
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("checking for updates" /* StateType.CheckingForUpdates */)
            });
            commands_1.CommandsRegistry.registerCommand('update.downloadNow', () => this.updateService.downloadUpdate());
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                group: '7_update',
                command: {
                    id: 'update.downloadNow',
                    title: nls.localize('download update_1', "Download Update (1)")
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("available for download" /* StateType.AvailableForDownload */)
            });
            commands_1.CommandsRegistry.registerCommand('update.downloading', () => { });
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                group: '7_update',
                command: {
                    id: 'update.downloading',
                    title: nls.localize('DownloadingUpdate', "Downloading Update..."),
                    precondition: contextkey_1.ContextKeyExpr.false()
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("downloading" /* StateType.Downloading */)
            });
            commands_1.CommandsRegistry.registerCommand('update.install', () => this.updateService.applyUpdate());
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                group: '7_update',
                command: {
                    id: 'update.install',
                    title: nls.localize('installUpdate...', "Install Update... (1)")
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("downloaded" /* StateType.Downloaded */)
            });
            commands_1.CommandsRegistry.registerCommand('update.updating', () => { });
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                group: '7_update',
                command: {
                    id: 'update.updating',
                    title: nls.localize('installingUpdate', "Installing Update..."),
                    precondition: contextkey_1.ContextKeyExpr.false()
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("updating" /* StateType.Updating */)
            });
            commands_1.CommandsRegistry.registerCommand('update.restart', () => this.updateService.quitAndInstall());
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                group: '7_update',
                command: {
                    id: 'update.restart',
                    title: nls.localize('restartToUpdate', "Restart to Update (1)")
                },
                when: exports.CONTEXT_UPDATE_STATE.isEqualTo("ready" /* StateType.Ready */)
            });
        }
    };
    UpdateContribution = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notification_1.INotificationService),
        __param(3, dialogs_1.IDialogService),
        __param(4, update_1.IUpdateService),
        __param(5, activity_1.IActivityService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, productService_1.IProductService),
        __param(8, host_1.IHostService)
    ], UpdateContribution);
    exports.UpdateContribution = UpdateContribution;
    let SwitchProductQualityContribution = class SwitchProductQualityContribution extends lifecycle_1.Disposable {
        constructor(productService, environmentService) {
            super();
            this.productService = productService;
            this.environmentService = environmentService;
            this.registerGlobalActivityActions();
        }
        registerGlobalActivityActions() {
            var _a;
            const quality = this.productService.quality;
            const productQualityChangeHandler = (_a = this.environmentService.options) === null || _a === void 0 ? void 0 : _a.productQualityChangeHandler;
            if (productQualityChangeHandler && (quality === 'stable' || quality === 'insider')) {
                const newQuality = quality === 'stable' ? 'insider' : 'stable';
                const commandId = `update.switchQuality.${newQuality}`;
                const isSwitchingToInsiders = newQuality === 'insider';
                (0, actions_2.registerAction2)(class SwitchQuality extends actions_2.Action2 {
                    constructor() {
                        super({
                            id: commandId,
                            title: isSwitchingToInsiders ? nls.localize('switchToInsiders', "Switch to Insiders Version...") : nls.localize('switchToStable', "Switch to Stable Version..."),
                            precondition: contextkeys_1.IsWebContext,
                            menu: {
                                id: actions_2.MenuId.GlobalActivity,
                                when: contextkeys_1.IsWebContext,
                                group: '7_update',
                            }
                        });
                    }
                    async run(accessor) {
                        const dialogService = accessor.get(dialogs_1.IDialogService);
                        const userDataSyncEnablementService = accessor.get(userDataSync_1.IUserDataSyncEnablementService);
                        const userDataSyncStoreManagementService = accessor.get(userDataSync_1.IUserDataSyncStoreManagementService);
                        const storageService = accessor.get(storage_1.IStorageService);
                        const userDataSyncWorkbenchService = accessor.get(userDataSync_2.IUserDataSyncWorkbenchService);
                        const userDataSyncService = accessor.get(userDataSync_1.IUserDataSyncService);
                        const notificationService = accessor.get(notification_1.INotificationService);
                        try {
                            const selectSettingsSyncServiceDialogShownKey = 'switchQuality.selectSettingsSyncServiceDialogShown';
                            const userDataSyncStore = userDataSyncStoreManagementService.userDataSyncStore;
                            let userDataSyncStoreType;
                            if (userDataSyncStore && isSwitchingToInsiders && userDataSyncEnablementService.isEnabled()
                                && !storageService.getBoolean(selectSettingsSyncServiceDialogShownKey, 0 /* StorageScope.GLOBAL */, false)) {
                                userDataSyncStoreType = await this.selectSettingsSyncService(dialogService);
                                if (!userDataSyncStoreType) {
                                    return;
                                }
                                storageService.store(selectSettingsSyncServiceDialogShownKey, true, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                                if (userDataSyncStoreType === 'stable') {
                                    // Update the stable service type in the current window, so that it uses stable service after switched to insiders version (after reload).
                                    await userDataSyncStoreManagementService.switch(userDataSyncStoreType);
                                }
                            }
                            const res = await dialogService.confirm({
                                type: 'info',
                                message: nls.localize('relaunchMessage', "Changing the version requires a reload to take effect"),
                                detail: newQuality === 'insider' ?
                                    nls.localize('relaunchDetailInsiders', "Press the reload button to switch to the Insiders version of VS Code.") :
                                    nls.localize('relaunchDetailStable', "Press the reload button to switch to the Stable version of VS Code."),
                                primaryButton: nls.localize('reload', "&&Reload")
                            });
                            if (res.confirmed) {
                                const promises = [];
                                // If sync is happening wait until it is finished before reload
                                if (userDataSyncService.status === "syncing" /* SyncStatus.Syncing */) {
                                    promises.push(event_1.Event.toPromise(event_1.Event.filter(userDataSyncService.onDidChangeStatus, status => status !== "syncing" /* SyncStatus.Syncing */)));
                                }
                                // If user chose the sync service then synchronise the store type option in insiders service, so that other clients using insiders service are also updated.
                                if (isSwitchingToInsiders && userDataSyncStoreType) {
                                    promises.push(userDataSyncWorkbenchService.synchroniseUserDataSyncStoreType());
                                }
                                await async_1.Promises.settled(promises);
                                productQualityChangeHandler(newQuality);
                            }
                            else {
                                // Reset
                                if (userDataSyncStoreType) {
                                    storageService.remove(selectSettingsSyncServiceDialogShownKey, 0 /* StorageScope.GLOBAL */);
                                }
                            }
                        }
                        catch (error) {
                            notificationService.error(error);
                        }
                    }
                    async selectSettingsSyncService(dialogService) {
                        const res = await dialogService.show(notification_1.Severity.Info, nls.localize('selectSyncService.message', "Choose the settings sync service to use after changing the version"), [
                            nls.localize('use insiders', "Insiders"),
                            nls.localize('use stable', "Stable (current)"),
                            nls.localize('cancel', "Cancel"),
                        ], {
                            detail: nls.localize('selectSyncService.detail', "The Insiders version of VS Code will synchronize your settings, keybindings, extensions, snippets and UI State using separate insiders settings sync service by default."),
                            cancelId: 2
                        });
                        return res.choice === 0 ? 'insiders' : res.choice === 1 ? 'stable' : undefined;
                    }
                });
            }
        }
    };
    SwitchProductQualityContribution = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, environmentService_1.IBrowserWorkbenchEnvironmentService)
    ], SwitchProductQualityContribution);
    exports.SwitchProductQualityContribution = SwitchProductQualityContribution;
    let CheckForVSCodeUpdateAction = class CheckForVSCodeUpdateAction extends actions_1.Action {
        constructor(id, label, updateService) {
            super(id, label, undefined, true);
            this.updateService = updateService;
        }
        run() {
            return this.updateService.checkForUpdates(true);
        }
    };
    CheckForVSCodeUpdateAction.ID = update_2.CheckForVSCodeUpdateActionId;
    CheckForVSCodeUpdateAction.LABEL = nls.localize('checkForUpdates', "Check for Updates...");
    CheckForVSCodeUpdateAction = __decorate([
        __param(2, update_1.IUpdateService)
    ], CheckForVSCodeUpdateAction);
    exports.CheckForVSCodeUpdateAction = CheckForVSCodeUpdateAction;
});
//# sourceMappingURL=update.js.map