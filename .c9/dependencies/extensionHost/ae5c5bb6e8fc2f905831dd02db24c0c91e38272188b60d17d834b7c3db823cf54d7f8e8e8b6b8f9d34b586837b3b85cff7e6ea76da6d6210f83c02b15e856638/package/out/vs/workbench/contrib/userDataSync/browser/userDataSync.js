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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/browser/codeeditor", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/contrib/logs/common/logConstants", "vs/workbench/services/output/common/output", "vs/workbench/services/activity/common/activity", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/preferences/common/preferences", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/base/common/date", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/opener/common/opener", "vs/workbench/services/authentication/common/authentication", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/descriptors", "vs/workbench/common/views", "vs/workbench/contrib/userDataSync/browser/userDataSyncViews", "vs/workbench/services/userDataSync/common/userDataSync", "vs/base/common/codicons", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/editor/common/editor", "vs/workbench/common/actions", "vs/workbench/services/userData/browser/userDataInit", "vs/base/common/htmlContent", "vs/workbench/services/host/browser/host"], function (require, exports, actions_1, errors_1, event_1, lifecycle_1, resources_1, uri_1, editorExtensions_1, model_1, language_1, resolverService_1, nls_1, actions_2, commands_1, configuration_1, contextkey_1, dialogs_1, instantiation_1, notification_1, quickInput_1, telemetry_1, userDataSync_1, codeeditor_1, editor_1, diffEditorInput_1, Constants, output_1, activity_1, editorService_1, environmentService_1, preferences_1, userDataSyncAccount_1, date_1, productService_1, storage_1, opener_1, authentication_1, platform_1, descriptors_1, views_1, userDataSyncViews_1, userDataSync_2, codicons_1, viewPaneContainer_1, editor_2, actions_3, userDataInit_1, htmlContent_1, host_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncWorkbenchContribution = void 0;
    const CONTEXT_CONFLICTS_SOURCES = new contextkey_1.RawContextKey('conflictsSources', '');
    const turnOnSyncCommand = { id: 'workbench.userDataSync.actions.turnOn', title: (0, nls_1.localize)('turn on sync with category', "{0}: Turn On...", userDataSync_2.SYNC_TITLE) };
    const turnOffSyncCommand = { id: 'workbench.userDataSync.actions.turnOff', title: (0, nls_1.localize)('stop sync', "{0}: Turn Off", userDataSync_2.SYNC_TITLE) };
    const configureSyncCommand = { id: userDataSync_2.CONFIGURE_SYNC_COMMAND_ID, title: (0, nls_1.localize)('configure sync', "{0}: Configure...", userDataSync_2.SYNC_TITLE) };
    const resolveSettingsConflictsCommand = { id: 'workbench.userDataSync.actions.resolveSettingsConflicts', title: (0, nls_1.localize)('showConflicts', "{0}: Show Settings Conflicts", userDataSync_2.SYNC_TITLE) };
    const resolveKeybindingsConflictsCommand = { id: 'workbench.userDataSync.actions.resolveKeybindingsConflicts', title: (0, nls_1.localize)('showKeybindingsConflicts', "{0}: Show Keybindings Conflicts", userDataSync_2.SYNC_TITLE) };
    const resolveSnippetsConflictsCommand = { id: 'workbench.userDataSync.actions.resolveSnippetsConflicts', title: (0, nls_1.localize)('showSnippetsConflicts', "{0}: Show User Snippets Conflicts", userDataSync_2.SYNC_TITLE) };
    const resolveTasksConflictsCommand = { id: 'workbench.userDataSync.actions.resolveTasksConflicts', title: (0, nls_1.localize)('showTasksConflicts', "{0}: Show User Tasks Conflicts", userDataSync_2.SYNC_TITLE) };
    const syncNowCommand = {
        id: 'workbench.userDataSync.actions.syncNow',
        title: (0, nls_1.localize)('sync now', "{0}: Sync Now", userDataSync_2.SYNC_TITLE),
        description(userDataSyncService) {
            if (userDataSyncService.status === "syncing" /* SyncStatus.Syncing */) {
                return (0, nls_1.localize)('syncing', "syncing");
            }
            if (userDataSyncService.lastSyncTime) {
                return (0, nls_1.localize)('synced with time', "synced {0}", (0, date_1.fromNow)(userDataSyncService.lastSyncTime, true));
            }
            return undefined;
        }
    };
    const showSyncSettingsCommand = { id: 'workbench.userDataSync.actions.settings', title: (0, nls_1.localize)('sync settings', "{0}: Show Settings", userDataSync_2.SYNC_TITLE), };
    const showSyncedDataCommand = { id: 'workbench.userDataSync.actions.showSyncedData', title: (0, nls_1.localize)('show synced data', "{0}: Show Synced Data", userDataSync_2.SYNC_TITLE), };
    const CONTEXT_SYNC_AFTER_INITIALIZATION = new contextkey_1.RawContextKey('syncAfterInitialization', false);
    const CONTEXT_TURNING_ON_STATE = new contextkey_1.RawContextKey('userDataSyncTurningOn', false);
    let UserDataSyncWorkbenchContribution = class UserDataSyncWorkbenchContribution extends lifecycle_1.Disposable {
        constructor(userDataSyncEnablementService, userDataSyncService, userDataSyncWorkbenchService, contextKeyService, activityService, notificationService, editorService, environmentService, dialogService, quickInputService, instantiationService, outputService, authTokenService, userDataAutoSyncService, textModelResolverService, preferencesService, telemetryService, productService, storageService, openerService, authenticationService, userDataSyncStoreManagementService, configurationService, userDataInitializationService, hostService) {
            super();
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataSyncService = userDataSyncService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
            this.activityService = activityService;
            this.notificationService = notificationService;
            this.editorService = editorService;
            this.environmentService = environmentService;
            this.dialogService = dialogService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.outputService = outputService;
            this.authTokenService = authTokenService;
            this.preferencesService = preferencesService;
            this.telemetryService = telemetryService;
            this.productService = productService;
            this.storageService = storageService;
            this.openerService = openerService;
            this.authenticationService = authenticationService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.configurationService = configurationService;
            this.userDataInitializationService = userDataInitializationService;
            this.hostService = hostService;
            this.globalActivityBadgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.accountBadgeDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.conflictsDisposables = new Map();
            this.invalidContentErrorDisposables = new Map();
            this._snippetsConflictsActionsDisposable = new lifecycle_1.DisposableStore();
            this.syncAfterInitializationContext = CONTEXT_SYNC_AFTER_INITIALIZATION.bindTo(contextKeyService);
            this.turningOnSyncContext = CONTEXT_TURNING_ON_STATE.bindTo(contextKeyService);
            this.conflictsSources = CONTEXT_CONFLICTS_SOURCES.bindTo(contextKeyService);
            if (userDataSyncWorkbenchService.enabled) {
                (0, userDataSync_1.registerConfiguration)();
                this.initializeSyncAfterInitializationContext();
                this.updateAccountBadge();
                this.updateGlobalActivityBadge();
                this.onDidChangeConflicts(this.userDataSyncService.conflicts);
                this._register(event_1.Event.any(event_1.Event.debounce(userDataSyncService.onDidChangeStatus, () => undefined, 500), this.userDataSyncEnablementService.onDidChangeEnablement, this.userDataSyncWorkbenchService.onDidChangeAccountStatus)(() => {
                    this.updateAccountBadge();
                    this.updateGlobalActivityBadge();
                }));
                this._register(userDataSyncService.onDidChangeConflicts(() => this.onDidChangeConflicts(this.userDataSyncService.conflicts)));
                this._register(userDataSyncEnablementService.onDidChangeEnablement(() => this.onDidChangeConflicts(this.userDataSyncService.conflicts)));
                this._register(userDataSyncService.onSyncErrors(errors => this.onSynchronizerErrors(errors)));
                this._register(userDataAutoSyncService.onError(error => this.onAutoSyncError(error)));
                this.registerActions();
                this.registerViews();
                textModelResolverService.registerTextModelContentProvider(userDataSync_1.USER_DATA_SYNC_SCHEME, instantiationService.createInstance(UserDataRemoteContentProvider));
                (0, editorExtensions_1.registerEditorContribution)(AcceptChangesContribution.ID, AcceptChangesContribution);
                this._register(event_1.Event.any(userDataSyncService.onDidChangeStatus, userDataSyncEnablementService.onDidChangeEnablement)(() => this.turningOnSync = !userDataSyncEnablementService.isEnabled() && userDataSyncService.status !== "idle" /* SyncStatus.Idle */));
            }
        }
        get turningOnSync() {
            return !!this.turningOnSyncContext.get();
        }
        set turningOnSync(turningOn) {
            this.turningOnSyncContext.set(turningOn);
            this.updateGlobalActivityBadge();
        }
        async initializeSyncAfterInitializationContext() {
            const requiresInitialization = await this.userDataInitializationService.requiresInitialization();
            if (requiresInitialization && !this.userDataSyncEnablementService.isEnabled()) {
                this.updateSyncAfterInitializationContext(true);
            }
            else {
                this.updateSyncAfterInitializationContext(this.storageService.getBoolean(CONTEXT_SYNC_AFTER_INITIALIZATION.key, 0 /* StorageScope.GLOBAL */, false));
            }
            const disposable = this._register(this.userDataSyncEnablementService.onDidChangeEnablement(() => {
                if (this.userDataSyncEnablementService.isEnabled()) {
                    this.updateSyncAfterInitializationContext(false);
                    disposable.dispose();
                }
            }));
        }
        async updateSyncAfterInitializationContext(value) {
            this.storageService.store(CONTEXT_SYNC_AFTER_INITIALIZATION.key, value, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            this.syncAfterInitializationContext.set(value);
            this.updateGlobalActivityBadge();
        }
        onDidChangeConflicts(conflicts) {
            if (!this.userDataSyncEnablementService.isEnabled()) {
                return;
            }
            this.updateGlobalActivityBadge();
            if (conflicts.length) {
                const conflictsSources = conflicts.map(([syncResource]) => syncResource);
                this.conflictsSources.set(conflictsSources.join(','));
                if (conflictsSources.indexOf("snippets" /* SyncResource.Snippets */) !== -1) {
                    this.registerShowSnippetsConflictsAction();
                }
                // Clear and dispose conflicts those were cleared
                this.conflictsDisposables.forEach((disposable, conflictsSource) => {
                    if (conflictsSources.indexOf(conflictsSource) === -1) {
                        disposable.dispose();
                        this.conflictsDisposables.delete(conflictsSource);
                    }
                });
                for (const [syncResource, conflicts] of this.userDataSyncService.conflicts) {
                    const conflictsEditorInputs = this.getConflictsEditorInputs(syncResource);
                    // close stale conflicts editor previews
                    if (conflictsEditorInputs.length) {
                        conflictsEditorInputs.forEach(input => {
                            if (!conflicts.some(({ previewResource }) => (0, resources_1.isEqual)(previewResource, input.primary.resource))) {
                                input.dispose();
                            }
                        });
                    }
                    // Show conflicts notification if not shown before
                    else if (!this.conflictsDisposables.has(syncResource)) {
                        const conflictsArea = (0, userDataSync_2.getSyncAreaLabel)(syncResource);
                        const handle = this.notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('conflicts detected', "Unable to sync due to conflicts in {0}. Please resolve them to continue.", conflictsArea.toLowerCase()), [
                            {
                                label: (0, nls_1.localize)('replace remote', "Replace Remote"),
                                run: () => {
                                    this.telemetryService.publicLog2('sync/handleConflicts', { source: syncResource, action: 'acceptLocal' });
                                    this.acceptLocal(syncResource, conflicts);
                                }
                            },
                            {
                                label: (0, nls_1.localize)('replace local', "Replace Local"),
                                run: () => {
                                    this.telemetryService.publicLog2('sync/handleConflicts', { source: syncResource, action: 'acceptRemote' });
                                    this.acceptRemote(syncResource, conflicts);
                                }
                            },
                            {
                                label: (0, nls_1.localize)('show conflicts', "Show Conflicts"),
                                run: () => {
                                    this.telemetryService.publicLog2('sync/showConflicts', { source: syncResource });
                                    this.handleConflicts([syncResource, conflicts]);
                                }
                            }
                        ], {
                            sticky: true
                        });
                        this.conflictsDisposables.set(syncResource, (0, lifecycle_1.toDisposable)(() => {
                            // close the conflicts warning notification
                            handle.close();
                            // close opened conflicts editor previews
                            const conflictsEditorInputs = this.getConflictsEditorInputs(syncResource);
                            if (conflictsEditorInputs.length) {
                                conflictsEditorInputs.forEach(input => input.dispose());
                            }
                            this.conflictsDisposables.delete(syncResource);
                        }));
                    }
                }
            }
            else {
                this.conflictsSources.reset();
                this.getAllConflictsEditorInputs().forEach(input => input.dispose());
                this.conflictsDisposables.forEach(disposable => disposable.dispose());
                this.conflictsDisposables.clear();
            }
        }
        async acceptRemote(syncResource, conflicts) {
            try {
                for (const conflict of conflicts) {
                    await this.userDataSyncService.accept(syncResource, conflict.remoteResource, undefined, this.userDataSyncEnablementService.isEnabled());
                }
            }
            catch (e) {
                this.notificationService.error((0, nls_1.localize)('accept failed', "Error while accepting changes. Please check [logs]({0}) for more details.", `command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID}`));
            }
        }
        async acceptLocal(syncResource, conflicts) {
            try {
                for (const conflict of conflicts) {
                    await this.userDataSyncService.accept(syncResource, conflict.localResource, undefined, this.userDataSyncEnablementService.isEnabled());
                }
            }
            catch (e) {
                this.notificationService.error((0, nls_1.localize)('accept failed', "Error while accepting changes. Please check [logs]({0}) for more details.", `command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID}`));
            }
        }
        onAutoSyncError(error) {
            var _a;
            switch (error.code) {
                case "SessionExpired" /* UserDataSyncErrorCode.SessionExpired */:
                    this.notificationService.notify({
                        severity: notification_1.Severity.Info,
                        message: (0, nls_1.localize)('session expired', "Settings sync was turned off because current session is expired, please sign in again to turn on sync."),
                        actions: {
                            primary: [new actions_1.Action('turn on sync', (0, nls_1.localize)('turn on sync', "Turn on Settings Sync..."), undefined, true, () => this.turnOn())]
                        }
                    });
                    break;
                case "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */:
                    this.notificationService.notify({
                        severity: notification_1.Severity.Info,
                        message: (0, nls_1.localize)('turned off', "Settings sync was turned off from another device, please turn on sync again."),
                        actions: {
                            primary: [new actions_1.Action('turn on sync', (0, nls_1.localize)('turn on sync', "Turn on Settings Sync..."), undefined, true, () => this.turnOn())]
                        }
                    });
                    break;
                case "TooLarge" /* UserDataSyncErrorCode.TooLarge */:
                    if (error.resource === "keybindings" /* SyncResource.Keybindings */ || error.resource === "settings" /* SyncResource.Settings */ || error.resource === "tasks" /* SyncResource.Tasks */) {
                        this.disableSync(error.resource);
                        const sourceArea = (0, userDataSync_2.getSyncAreaLabel)(error.resource);
                        this.handleTooLargeError(error.resource, (0, nls_1.localize)('too large', "Disabled syncing {0} because size of the {1} file to sync is larger than {2}. Please open the file and reduce the size and enable sync", sourceArea.toLowerCase(), sourceArea.toLowerCase(), '100kb'), error);
                    }
                    break;
                case "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */:
                case "Gone" /* UserDataSyncErrorCode.Gone */:
                case "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */: {
                    const message = (0, nls_1.localize)('error upgrade required', "Settings sync is disabled because the current version ({0}, {1}) is not compatible with the sync service. Please update before turning on sync.", this.productService.version, this.productService.commit);
                    const operationId = error.operationId ? (0, nls_1.localize)('operationId', "Operation Id: {0}", error.operationId) : undefined;
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: operationId ? `${message} ${operationId}` : message,
                    });
                    break;
                }
                case "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */:
                    this.notificationService.notify({
                        severity: notification_1.Severity.Error,
                        message: (0, nls_1.localize)('error reset required', "Settings sync is disabled because your data in the cloud is older than that of the client. Please clear your data in the cloud before turning on sync."),
                        actions: {
                            primary: [
                                new actions_1.Action('reset', (0, nls_1.localize)('reset', "Clear Data in Cloud..."), undefined, true, () => this.userDataSyncWorkbenchService.resetSyncedData()),
                                new actions_1.Action('show synced data', (0, nls_1.localize)('show synced data action', "Show Synced Data"), undefined, true, () => this.userDataSyncWorkbenchService.showSyncActivity())
                            ]
                        }
                    });
                    return;
                case "ServiceChanged" /* UserDataSyncErrorCode.ServiceChanged */:
                    this.notificationService.notify({
                        severity: notification_1.Severity.Info,
                        message: ((_a = this.userDataSyncStoreManagementService.userDataSyncStore) === null || _a === void 0 ? void 0 : _a.type) === 'insiders' ?
                            (0, nls_1.localize)('service switched to insiders', "Settings Sync has been switched to insiders service") :
                            (0, nls_1.localize)('service switched to stable', "Settings Sync has been switched to stable service"),
                    });
                    return;
                case "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */:
                    // Settings sync is using separate service
                    if (this.userDataSyncEnablementService.isEnabled()) {
                        this.notificationService.notify({
                            severity: notification_1.Severity.Info,
                            message: (0, nls_1.localize)('using separate service', "Settings sync now uses a separate service, more information is available in the [Settings Sync Documentation](https://aka.ms/vscode-settings-sync-help#_syncing-stable-versus-insiders)."),
                        });
                    }
                    // If settings sync got turned off then ask user to turn on sync again.
                    else {
                        this.notificationService.notify({
                            severity: notification_1.Severity.Info,
                            message: (0, nls_1.localize)('service changed and turned off', "Settings sync was turned off because {0} now uses a separate service. Please turn on sync again.", this.productService.nameLong),
                            actions: {
                                primary: [new actions_1.Action('turn on sync', (0, nls_1.localize)('turn on sync', "Turn on Settings Sync..."), undefined, true, () => this.turnOn())]
                            }
                        });
                    }
                    return;
            }
        }
        handleTooLargeError(resource, message, error) {
            const operationId = error.operationId ? (0, nls_1.localize)('operationId', "Operation Id: {0}", error.operationId) : undefined;
            this.notificationService.notify({
                severity: notification_1.Severity.Error,
                message: operationId ? `${message} ${operationId}` : message,
                actions: {
                    primary: [new actions_1.Action('open sync file', (0, nls_1.localize)('open file', "Open {0} File", (0, userDataSync_2.getSyncAreaLabel)(resource)), undefined, true, () => resource === "settings" /* SyncResource.Settings */ ? this.preferencesService.openUserSettings({ jsonEditor: true }) : this.preferencesService.openGlobalKeybindingSettings(true))]
                }
            });
        }
        onSynchronizerErrors(errors) {
            if (errors.length) {
                for (const [source, error] of errors) {
                    switch (error.code) {
                        case "LocalInvalidContent" /* UserDataSyncErrorCode.LocalInvalidContent */:
                            this.handleInvalidContentError(source);
                            break;
                        default: {
                            const disposable = this.invalidContentErrorDisposables.get(source);
                            if (disposable) {
                                disposable.dispose();
                                this.invalidContentErrorDisposables.delete(source);
                            }
                        }
                    }
                }
            }
            else {
                this.invalidContentErrorDisposables.forEach(disposable => disposable.dispose());
                this.invalidContentErrorDisposables.clear();
            }
        }
        handleInvalidContentError(source) {
            if (this.invalidContentErrorDisposables.has(source)) {
                return;
            }
            if (source !== "settings" /* SyncResource.Settings */ && source !== "keybindings" /* SyncResource.Keybindings */ && source !== "tasks" /* SyncResource.Tasks */) {
                return;
            }
            if (!this.hostService.hasFocus) {
                return;
            }
            const resource = source === "settings" /* SyncResource.Settings */ ? this.environmentService.settingsResource : this.environmentService.keybindingsResource;
            if ((0, resources_1.isEqual)(resource, editor_1.EditorResourceAccessor.getCanonicalUri(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }))) {
                // Do not show notification if the file in error is active
                return;
            }
            const errorArea = (0, userDataSync_2.getSyncAreaLabel)(source);
            const handle = this.notificationService.notify({
                severity: notification_1.Severity.Error,
                message: (0, nls_1.localize)('errorInvalidConfiguration', "Unable to sync {0} because the content in the file is not valid. Please open the file and correct it.", errorArea.toLowerCase()),
                actions: {
                    primary: [new actions_1.Action('open sync file', (0, nls_1.localize)('open file', "Open {0} File", errorArea), undefined, true, () => source === "settings" /* SyncResource.Settings */ ? this.preferencesService.openUserSettings({ jsonEditor: true }) : this.preferencesService.openGlobalKeybindingSettings(true))]
                }
            });
            this.invalidContentErrorDisposables.set(source, (0, lifecycle_1.toDisposable)(() => {
                // close the error warning notification
                handle.close();
                this.invalidContentErrorDisposables.delete(source);
            }));
        }
        async updateGlobalActivityBadge() {
            this.globalActivityBadgeDisposable.clear();
            let badge = undefined;
            let clazz;
            let priority = undefined;
            if (this.userDataSyncService.conflicts.length && this.userDataSyncEnablementService.isEnabled()) {
                badge = new activity_1.NumberBadge(this.userDataSyncService.conflicts.reduce((result, [, conflicts]) => { return result + conflicts.length; }, 0), () => (0, nls_1.localize)('has conflicts', "{0}: Conflicts Detected", userDataSync_2.SYNC_TITLE));
            }
            else if (this.turningOnSync) {
                badge = new activity_1.ProgressBadge(() => (0, nls_1.localize)('turning on syncing', "Turning on Settings Sync..."));
                clazz = 'progress-badge';
                priority = 1;
            }
            else if (this.userDataSyncWorkbenchService.accountStatus === "available" /* AccountStatus.Available */ && this.syncAfterInitializationContext.get() && !this.userDataSyncEnablementService.isEnabled()) {
                badge = new activity_1.NumberBadge(1, () => (0, nls_1.localize)('settings sync is off', "Settings Sync is Off", userDataSync_2.SYNC_TITLE));
            }
            if (badge) {
                this.globalActivityBadgeDisposable.value = this.activityService.showGlobalActivity({ badge, clazz, priority });
            }
        }
        async updateAccountBadge() {
            this.accountBadgeDisposable.clear();
            let badge = undefined;
            if (this.userDataSyncService.status !== "uninitialized" /* SyncStatus.Uninitialized */ && this.userDataSyncEnablementService.isEnabled() && this.userDataSyncWorkbenchService.accountStatus === "unavailable" /* AccountStatus.Unavailable */) {
                badge = new activity_1.NumberBadge(1, () => (0, nls_1.localize)('sign in to sync', "Sign in to Sync Settings"));
            }
            if (badge) {
                this.accountBadgeDisposable.value = this.activityService.showAccountsActivity({ badge, clazz: undefined, priority: undefined });
            }
        }
        async turnOnSyncAfterInitialization() {
            this.updateSyncAfterInitializationContext(false);
            const result = await this.dialogService.show(notification_1.Severity.Info, (0, nls_1.localize)('settings sync is off', "Settings Sync is Off"), [
                (0, nls_1.localize)('turn on settings sync', "Turn On Settings Sync"),
                (0, nls_1.localize)('cancel', "Cancel"),
            ], {
                cancelId: 1,
                custom: {
                    markdownDetails: [{
                            markdown: new htmlContent_1.MarkdownString(`${(0, nls_1.localize)('turnon sync after initialization message', "Your settings, keybindings, extensions, snippets and UI State were initialized but are not getting synced. Do you want to turn on Settings Sync?")}`, { isTrusted: true })
                        }, {
                            markdown: new htmlContent_1.MarkdownString(`${(0, nls_1.localize)({ key: 'change later', comment: ['Context here is that user can change (turn on/off) settings sync later.'] }, "You can always change this later.")} [${(0, nls_1.localize)('learn more', "Learn More")}](https://aka.ms/vscode-settings-sync-help).`, { isTrusted: true })
                        }]
                }
            });
            if (result.choice === 0) {
                await this.userDataSyncWorkbenchService.turnOnUsingCurrentAccount();
            }
        }
        async turnOn() {
            var _a;
            try {
                if (!this.userDataSyncWorkbenchService.authenticationProviders.length) {
                    throw new Error((0, nls_1.localize)('no authentication providers', "No authentication providers are available."));
                }
                const turnOn = await this.askToConfigure();
                if (!turnOn) {
                    return;
                }
                if ((_a = this.userDataSyncStoreManagementService.userDataSyncStore) === null || _a === void 0 ? void 0 : _a.canSwitch) {
                    await this.selectSettingsSyncService(this.userDataSyncStoreManagementService.userDataSyncStore);
                }
                await this.userDataSyncWorkbenchService.turnOn();
            }
            catch (e) {
                if ((0, errors_1.isCancellationError)(e)) {
                    return;
                }
                if (e instanceof userDataSync_1.UserDataSyncError) {
                    switch (e.code) {
                        case "TooLarge" /* UserDataSyncErrorCode.TooLarge */:
                            if (e.resource === "keybindings" /* SyncResource.Keybindings */ || e.resource === "settings" /* SyncResource.Settings */ || e.resource === "tasks" /* SyncResource.Tasks */) {
                                this.handleTooLargeError(e.resource, (0, nls_1.localize)('too large while starting sync', "Settings sync cannot be turned on because size of the {0} file to sync is larger than {1}. Please open the file and reduce the size and turn on sync", (0, userDataSync_2.getSyncAreaLabel)(e.resource).toLowerCase(), '100kb'), e);
                                return;
                            }
                            break;
                        case "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */:
                        case "Gone" /* UserDataSyncErrorCode.Gone */:
                        case "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */: {
                            const message = (0, nls_1.localize)('error upgrade required while starting sync', "Settings sync cannot be turned on because the current version ({0}, {1}) is not compatible with the sync service. Please update before turning on sync.", this.productService.version, this.productService.commit);
                            const operationId = e.operationId ? (0, nls_1.localize)('operationId', "Operation Id: {0}", e.operationId) : undefined;
                            this.notificationService.notify({
                                severity: notification_1.Severity.Error,
                                message: operationId ? `${message} ${operationId}` : message,
                            });
                            return;
                        }
                        case "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */:
                            this.notificationService.notify({
                                severity: notification_1.Severity.Error,
                                message: (0, nls_1.localize)('error reset required while starting sync', "Settings sync cannot be turned on because your data in the cloud is older than that of the client. Please clear your data in the cloud before turning on sync."),
                                actions: {
                                    primary: [
                                        new actions_1.Action('reset', (0, nls_1.localize)('reset', "Clear Data in Cloud..."), undefined, true, () => this.userDataSyncWorkbenchService.resetSyncedData()),
                                        new actions_1.Action('show synced data', (0, nls_1.localize)('show synced data action', "Show Synced Data"), undefined, true, () => this.userDataSyncWorkbenchService.showSyncActivity())
                                    ]
                                }
                            });
                            return;
                        case "Unauthorized" /* UserDataSyncErrorCode.Unauthorized */:
                            this.notificationService.error((0, nls_1.localize)('auth failed', "Error while turning on Settings Sync: Authentication failed."));
                            return;
                    }
                    this.notificationService.error((0, nls_1.localize)('turn on failed with user data sync error', "Error while turning on Settings Sync. Please check [logs]({0}) for more details.", `command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID}`));
                }
                else {
                    this.notificationService.error((0, nls_1.localize)({ key: 'turn on failed', comment: ['Substitution is for error reason'] }, "Error while turning on Settings Sync. {0}", (0, errors_1.getErrorMessage)(e)));
                }
            }
        }
        async askToConfigure() {
            return new Promise((c, e) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = this.quickInputService.createQuickPick();
                disposables.add(quickPick);
                quickPick.title = userDataSync_2.SYNC_TITLE;
                quickPick.ok = false;
                quickPick.customButton = true;
                quickPick.customLabel = (0, nls_1.localize)('sign in and turn on', "Sign in & Turn on");
                quickPick.description = (0, nls_1.localize)('configure and turn on sync detail', "Please sign in to synchronize your data across devices.");
                quickPick.canSelectMany = true;
                quickPick.ignoreFocusOut = true;
                quickPick.hideInput = true;
                quickPick.hideCheckAll = true;
                const items = this.getConfigureSyncQuickPickItems();
                quickPick.items = items;
                quickPick.selectedItems = items.filter(item => this.userDataSyncEnablementService.isResourceEnabled(item.id));
                let accepted = false;
                disposables.add(event_1.Event.any(quickPick.onDidAccept, quickPick.onDidCustom)(() => {
                    accepted = true;
                    quickPick.hide();
                }));
                disposables.add(quickPick.onDidHide(() => {
                    try {
                        if (accepted) {
                            this.updateConfiguration(items, quickPick.selectedItems);
                        }
                        c(accepted);
                    }
                    catch (error) {
                        e(error);
                    }
                    finally {
                        disposables.dispose();
                    }
                }));
                quickPick.show();
            });
        }
        getConfigureSyncQuickPickItems() {
            return [{
                    id: "settings" /* SyncResource.Settings */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("settings" /* SyncResource.Settings */)
                }, {
                    id: "keybindings" /* SyncResource.Keybindings */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("keybindings" /* SyncResource.Keybindings */),
                    description: this.configurationService.getValue('settingsSync.keybindingsPerPlatform') ? (0, nls_1.localize)('per platform', "for each platform") : undefined
                }, {
                    id: "snippets" /* SyncResource.Snippets */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("snippets" /* SyncResource.Snippets */)
                }, {
                    id: "tasks" /* SyncResource.Tasks */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("tasks" /* SyncResource.Tasks */)
                }, {
                    id: "extensions" /* SyncResource.Extensions */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("extensions" /* SyncResource.Extensions */)
                }, {
                    id: "globalState" /* SyncResource.GlobalState */,
                    label: (0, userDataSync_2.getSyncAreaLabel)("globalState" /* SyncResource.GlobalState */),
                }];
        }
        updateConfiguration(items, selectedItems) {
            for (const item of items) {
                const wasEnabled = this.userDataSyncEnablementService.isResourceEnabled(item.id);
                const isEnabled = !!selectedItems.filter(selected => selected.id === item.id)[0];
                if (wasEnabled !== isEnabled) {
                    this.userDataSyncEnablementService.setResourceEnablement(item.id, isEnabled);
                }
            }
        }
        async configureSyncOptions() {
            return new Promise((c, e) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = this.quickInputService.createQuickPick();
                disposables.add(quickPick);
                quickPick.title = (0, nls_1.localize)('configure sync', "{0}: Configure...", userDataSync_2.SYNC_TITLE);
                quickPick.placeholder = (0, nls_1.localize)('configure sync placeholder', "Choose what to sync");
                quickPick.canSelectMany = true;
                quickPick.ignoreFocusOut = true;
                quickPick.ok = true;
                const items = this.getConfigureSyncQuickPickItems();
                quickPick.items = items;
                quickPick.selectedItems = items.filter(item => this.userDataSyncEnablementService.isResourceEnabled(item.id));
                disposables.add(quickPick.onDidAccept(async () => {
                    if (quickPick.selectedItems.length) {
                        this.updateConfiguration(items, quickPick.selectedItems);
                        quickPick.hide();
                    }
                }));
                disposables.add(quickPick.onDidHide(() => {
                    disposables.dispose();
                    c();
                }));
                quickPick.show();
            });
        }
        async turnOff() {
            const result = await this.dialogService.confirm({
                type: 'info',
                message: (0, nls_1.localize)('turn off sync confirmation', "Do you want to turn off sync?"),
                detail: (0, nls_1.localize)('turn off sync detail', "Your settings, keybindings, extensions, snippets and UI State will no longer be synced."),
                primaryButton: (0, nls_1.localize)({ key: 'turn off', comment: ['&& denotes a mnemonic'] }, "&&Turn off"),
                checkbox: this.userDataSyncWorkbenchService.accountStatus === "available" /* AccountStatus.Available */ ? {
                    label: (0, nls_1.localize)('turn off sync everywhere', "Turn off sync on all your devices and clear the data from the cloud.")
                } : undefined
            });
            if (result.confirmed) {
                return this.userDataSyncWorkbenchService.turnoff(!!result.checkboxChecked);
            }
        }
        disableSync(source) {
            switch (source) {
                case "settings" /* SyncResource.Settings */: return this.userDataSyncEnablementService.setResourceEnablement("settings" /* SyncResource.Settings */, false);
                case "keybindings" /* SyncResource.Keybindings */: return this.userDataSyncEnablementService.setResourceEnablement("keybindings" /* SyncResource.Keybindings */, false);
                case "snippets" /* SyncResource.Snippets */: return this.userDataSyncEnablementService.setResourceEnablement("snippets" /* SyncResource.Snippets */, false);
                case "tasks" /* SyncResource.Tasks */: return this.userDataSyncEnablementService.setResourceEnablement("tasks" /* SyncResource.Tasks */, false);
                case "extensions" /* SyncResource.Extensions */: return this.userDataSyncEnablementService.setResourceEnablement("extensions" /* SyncResource.Extensions */, false);
                case "globalState" /* SyncResource.GlobalState */: return this.userDataSyncEnablementService.setResourceEnablement("globalState" /* SyncResource.GlobalState */, false);
            }
        }
        getConflictsEditorInputs(syncResource) {
            return this.editorService.editors.filter(input => {
                const resource = input instanceof diffEditorInput_1.DiffEditorInput ? input.primary.resource : input.resource;
                return resource && (0, userDataSync_1.getSyncResourceFromLocalPreview)(resource, this.environmentService) === syncResource;
            });
        }
        getAllConflictsEditorInputs() {
            return this.editorService.editors.filter(input => {
                const resource = input instanceof diffEditorInput_1.DiffEditorInput ? input.primary.resource : input.resource;
                return resource && (0, userDataSync_1.getSyncResourceFromLocalPreview)(resource, this.environmentService) !== undefined;
            });
        }
        async handleSyncResourceConflicts(resource) {
            const syncResourceCoflicts = this.userDataSyncService.conflicts.filter(([syncResource]) => syncResource === resource)[0];
            if (syncResourceCoflicts) {
                this.handleConflicts(syncResourceCoflicts);
            }
        }
        async handleConflicts([syncResource, conflicts]) {
            for (const conflict of conflicts) {
                const leftResourceName = (0, nls_1.localize)({ key: 'leftResourceName', comment: ['remote as in file in cloud'] }, "{0} (Remote)", (0, resources_1.basename)(conflict.remoteResource));
                const rightResourceName = (0, nls_1.localize)('merges', "{0} (Merges)", (0, resources_1.basename)(conflict.previewResource));
                await this.editorService.openEditor({
                    original: { resource: conflict.remoteResource },
                    modified: { resource: conflict.previewResource },
                    label: (0, nls_1.localize)('sideBySideLabels', "{0} ↔ {1}", leftResourceName, rightResourceName),
                    description: (0, nls_1.localize)('sideBySideDescription', "Settings Sync"),
                    options: {
                        preserveFocus: false,
                        pinned: true,
                        revealIfVisible: true,
                        override: editor_2.EditorResolution.DISABLED
                    },
                });
            }
        }
        showSyncActivity() {
            return this.outputService.showChannel(Constants.userDataSyncLogChannelId);
        }
        async selectSettingsSyncService(userDataSyncStore) {
            return new Promise((c, e) => {
                const disposables = new lifecycle_1.DisposableStore();
                const quickPick = disposables.add(this.quickInputService.createQuickPick());
                quickPick.title = (0, nls_1.localize)('switchSyncService.title', "{0}: Select Service", userDataSync_2.SYNC_TITLE);
                quickPick.description = (0, nls_1.localize)('switchSyncService.description', "Ensure you are using the same settings sync service when syncing with multiple environments");
                quickPick.hideInput = true;
                quickPick.ignoreFocusOut = true;
                const getDescription = (url) => {
                    const isDefault = (0, resources_1.isEqual)(url, userDataSyncStore.defaultUrl);
                    if (isDefault) {
                        return (0, nls_1.localize)('default', "Default");
                    }
                    return undefined;
                };
                quickPick.items = [
                    {
                        id: 'insiders',
                        label: (0, nls_1.localize)('insiders', "Insiders"),
                        description: getDescription(userDataSyncStore.insidersUrl)
                    },
                    {
                        id: 'stable',
                        label: (0, nls_1.localize)('stable', "Stable"),
                        description: getDescription(userDataSyncStore.stableUrl)
                    }
                ];
                disposables.add(quickPick.onDidAccept(async () => {
                    try {
                        await this.userDataSyncStoreManagementService.switch(quickPick.selectedItems[0].id);
                        c();
                    }
                    catch (error) {
                        e(error);
                    }
                    finally {
                        quickPick.hide();
                    }
                }));
                disposables.add(quickPick.onDidHide(() => disposables.dispose()));
                quickPick.show();
            });
        }
        registerActions() {
            if (this.userDataSyncEnablementService.canToggleEnablement()) {
                this.registerTurnOnSyncAction();
                this.registerTurnOffSyncAction();
                this.registerTurnOnSyncAfterInitializationAction();
            }
            this.registerTurningOnSyncAction();
            this.registerSignInAction(); // When Sync is turned on from CLI
            this.registerShowSettingsConflictsAction();
            this.registerShowKeybindingsConflictsAction();
            this.registerShowSnippetsConflictsAction();
            this.registerShowTasksConflictsAction();
            this.registerEnableSyncViewsAction();
            this.registerManageSyncAction();
            this.registerSyncNowAction();
            this.registerConfigureSyncAction();
            this.registerShowSettingsAction();
            this.registerHelpAction();
            this.registerShowLogAction();
            this.registerResetSyncDataAction();
        }
        registerTurnOnSyncAction() {
            const turnOnSyncWhenContext = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT.toNegated(), userDataSync_2.CONTEXT_ACCOUNT_STATE.notEqualsTo("uninitialized" /* AccountStatus.Uninitialized */), CONTEXT_TURNING_ON_STATE.negate());
            commands_1.CommandsRegistry.registerCommand(turnOnSyncCommand.id, () => this.turnOn());
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                group: '5_sync',
                command: {
                    id: turnOnSyncCommand.id,
                    title: (0, nls_1.localize)('global activity turn on sync', "Turn on Settings Sync...")
                },
                when: contextkey_1.ContextKeyExpr.and(turnOnSyncWhenContext, CONTEXT_SYNC_AFTER_INITIALIZATION.negate()),
                order: 1
            });
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, {
                command: turnOnSyncCommand,
                when: turnOnSyncWhenContext,
            });
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarPreferencesMenu, {
                group: '5_sync',
                command: {
                    id: turnOnSyncCommand.id,
                    title: (0, nls_1.localize)('global activity turn on sync', "Turn on Settings Sync...")
                },
                when: turnOnSyncWhenContext,
            });
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.AccountsContext, {
                group: '1_sync',
                command: {
                    id: turnOnSyncCommand.id,
                    title: (0, nls_1.localize)('global activity turn on sync', "Turn on Settings Sync...")
                },
                when: turnOnSyncWhenContext
            });
        }
        registerTurnOnSyncAfterInitializationAction() {
            const that = this;
            const id = 'workbench.userData.actions.askToTunrOnAfterInit';
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT.toNegated(), userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), CONTEXT_TURNING_ON_STATE.negate(), CONTEXT_SYNC_AFTER_INITIALIZATION);
            this._register((0, actions_2.registerAction2)(class AskToTurnOnSync extends actions_2.Action2 {
                constructor() {
                    super({
                        id,
                        title: (0, nls_1.localize)('ask to turn on in global', "Settings Sync is Off (1)"),
                        menu: {
                            group: '5_sync',
                            id: actions_2.MenuId.GlobalActivity,
                            when,
                            order: 2
                        }
                    });
                }
                async run() {
                    try {
                        await that.turnOnSyncAfterInitialization();
                    }
                    catch (e) {
                        that.notificationService.error(e);
                    }
                }
            }));
        }
        registerTurningOnSyncAction() {
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT.toNegated(), userDataSync_2.CONTEXT_ACCOUNT_STATE.notEqualsTo("uninitialized" /* AccountStatus.Uninitialized */), CONTEXT_TURNING_ON_STATE);
            this._register((0, actions_2.registerAction2)(class TurningOnSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userData.actions.turningOn',
                        title: (0, nls_1.localize)('turnin on sync', "Turning on Settings Sync..."),
                        precondition: contextkey_1.ContextKeyExpr.false(),
                        menu: [{
                                group: '5_sync',
                                id: actions_2.MenuId.GlobalActivity,
                                when,
                                order: 2
                            }, {
                                group: '1_sync',
                                id: actions_2.MenuId.AccountsContext,
                                when,
                            }]
                    });
                }
                async run() { }
            }));
        }
        registerSignInAction() {
            const that = this;
            const id = 'workbench.userData.actions.signin';
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT, userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("unavailable" /* AccountStatus.Unavailable */));
            this._register((0, actions_2.registerAction2)(class StopSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userData.actions.signin',
                        title: (0, nls_1.localize)('sign in global', "Sign in to Sync Settings"),
                        menu: {
                            group: '5_sync',
                            id: actions_2.MenuId.GlobalActivity,
                            when,
                            order: 2
                        }
                    });
                }
                async run() {
                    try {
                        await that.userDataSyncWorkbenchService.signIn();
                    }
                    catch (e) {
                        that.notificationService.error(e);
                    }
                }
            }));
            this._register(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.AccountsContext, {
                group: '1_sync',
                command: {
                    id,
                    title: (0, nls_1.localize)('sign in accounts', "Sign in to Sync Settings (1)"),
                },
                when
            }));
        }
        registerShowSettingsConflictsAction() {
            const resolveSettingsConflictsWhenContext = contextkey_1.ContextKeyExpr.regex(CONTEXT_CONFLICTS_SOURCES.keys()[0], /.*settings.*/i);
            commands_1.CommandsRegistry.registerCommand(resolveSettingsConflictsCommand.id, () => this.handleSyncResourceConflicts("settings" /* SyncResource.Settings */));
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                group: '5_sync',
                command: {
                    id: resolveSettingsConflictsCommand.id,
                    title: (0, nls_1.localize)('resolveConflicts_global', "{0}: Show Settings Conflicts (1)", userDataSync_2.SYNC_TITLE),
                },
                when: resolveSettingsConflictsWhenContext,
                order: 2
            });
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarPreferencesMenu, {
                group: '5_sync',
                command: {
                    id: resolveSettingsConflictsCommand.id,
                    title: (0, nls_1.localize)('resolveConflicts_global', "{0}: Show Settings Conflicts (1)", userDataSync_2.SYNC_TITLE),
                },
                when: resolveSettingsConflictsWhenContext,
                order: 2
            });
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, {
                command: resolveSettingsConflictsCommand,
                when: resolveSettingsConflictsWhenContext,
            });
        }
        registerShowKeybindingsConflictsAction() {
            const resolveKeybindingsConflictsWhenContext = contextkey_1.ContextKeyExpr.regex(CONTEXT_CONFLICTS_SOURCES.keys()[0], /.*keybindings.*/i);
            commands_1.CommandsRegistry.registerCommand(resolveKeybindingsConflictsCommand.id, () => this.handleSyncResourceConflicts("keybindings" /* SyncResource.Keybindings */));
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                group: '5_sync',
                command: {
                    id: resolveKeybindingsConflictsCommand.id,
                    title: (0, nls_1.localize)('resolveKeybindingsConflicts_global', "{0}: Show Keybindings Conflicts (1)", userDataSync_2.SYNC_TITLE),
                },
                when: resolveKeybindingsConflictsWhenContext,
                order: 2
            });
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarPreferencesMenu, {
                group: '5_sync',
                command: {
                    id: resolveKeybindingsConflictsCommand.id,
                    title: (0, nls_1.localize)('resolveKeybindingsConflicts_global', "{0}: Show Keybindings Conflicts (1)", userDataSync_2.SYNC_TITLE),
                },
                when: resolveKeybindingsConflictsWhenContext,
                order: 2
            });
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, {
                command: resolveKeybindingsConflictsCommand,
                when: resolveKeybindingsConflictsWhenContext,
            });
        }
        registerShowTasksConflictsAction() {
            const resolveTasksConflictsWhenContext = contextkey_1.ContextKeyExpr.regex(CONTEXT_CONFLICTS_SOURCES.keys()[0], /.*tasks.*/i);
            commands_1.CommandsRegistry.registerCommand(resolveTasksConflictsCommand.id, () => this.handleSyncResourceConflicts("tasks" /* SyncResource.Tasks */));
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                group: '5_sync',
                command: {
                    id: resolveTasksConflictsCommand.id,
                    title: (0, nls_1.localize)('resolveTasksConflicts_global', "{0}: Show User Tasks Conflicts (1)", userDataSync_2.SYNC_TITLE),
                },
                when: resolveTasksConflictsWhenContext,
                order: 2
            });
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarPreferencesMenu, {
                group: '5_sync',
                command: {
                    id: resolveKeybindingsConflictsCommand.id,
                    title: (0, nls_1.localize)('resolveTasksConflicts_global', "{0}: Show User Tasks Conflicts (1)", userDataSync_2.SYNC_TITLE),
                },
                when: resolveTasksConflictsWhenContext,
                order: 2
            });
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, {
                command: resolveTasksConflictsCommand,
                when: resolveTasksConflictsWhenContext,
            });
        }
        registerShowSnippetsConflictsAction() {
            var _a;
            this._snippetsConflictsActionsDisposable.clear();
            const resolveSnippetsConflictsWhenContext = contextkey_1.ContextKeyExpr.regex(CONTEXT_CONFLICTS_SOURCES.keys()[0], /.*snippets.*/i);
            const conflicts = (_a = this.userDataSyncService.conflicts.filter(([syncResource]) => syncResource === "snippets" /* SyncResource.Snippets */)[0]) === null || _a === void 0 ? void 0 : _a[1];
            this._snippetsConflictsActionsDisposable.add(commands_1.CommandsRegistry.registerCommand(resolveSnippetsConflictsCommand.id, () => this.handleSyncResourceConflicts("snippets" /* SyncResource.Snippets */)));
            this._snippetsConflictsActionsDisposable.add(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.GlobalActivity, {
                group: '5_sync',
                command: {
                    id: resolveSnippetsConflictsCommand.id,
                    title: (0, nls_1.localize)('resolveSnippetsConflicts_global', "{0}: Show User Snippets Conflicts ({1})", userDataSync_2.SYNC_TITLE, (conflicts === null || conflicts === void 0 ? void 0 : conflicts.length) || 1),
                },
                when: resolveSnippetsConflictsWhenContext,
                order: 2
            }));
            this._snippetsConflictsActionsDisposable.add(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarPreferencesMenu, {
                group: '5_sync',
                command: {
                    id: resolveSnippetsConflictsCommand.id,
                    title: (0, nls_1.localize)('resolveSnippetsConflicts_global', "{0}: Show User Snippets Conflicts ({1})", userDataSync_2.SYNC_TITLE, (conflicts === null || conflicts === void 0 ? void 0 : conflicts.length) || 1),
                },
                when: resolveSnippetsConflictsWhenContext,
                order: 2
            }));
            this._snippetsConflictsActionsDisposable.add(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, {
                command: resolveSnippetsConflictsCommand,
                when: resolveSnippetsConflictsWhenContext,
            }));
        }
        registerManageSyncAction() {
            const that = this;
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_ENABLEMENT, userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */));
            this._register((0, actions_2.registerAction2)(class SyncStatusAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userDataSync.actions.manage',
                        title: (0, nls_1.localize)('sync is on', "Settings Sync is On"),
                        menu: [
                            {
                                id: actions_2.MenuId.GlobalActivity,
                                group: '5_sync',
                                when,
                                order: 3
                            },
                            {
                                id: actions_2.MenuId.MenubarPreferencesMenu,
                                group: '5_sync',
                                when,
                                order: 3,
                            },
                            {
                                id: actions_2.MenuId.AccountsContext,
                                group: '1_sync',
                                when,
                            }
                        ],
                    });
                }
                run(accessor) {
                    return new Promise((c, e) => {
                        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                        const commandService = accessor.get(commands_1.ICommandService);
                        const disposables = new lifecycle_1.DisposableStore();
                        const quickPick = quickInputService.createQuickPick();
                        disposables.add(quickPick);
                        const items = [];
                        if (that.userDataSyncService.conflicts.length) {
                            for (const [syncResource] of that.userDataSyncService.conflicts) {
                                switch (syncResource) {
                                    case "settings" /* SyncResource.Settings */:
                                        items.push({ id: resolveSettingsConflictsCommand.id, label: resolveSettingsConflictsCommand.title });
                                        break;
                                    case "keybindings" /* SyncResource.Keybindings */:
                                        items.push({ id: resolveKeybindingsConflictsCommand.id, label: resolveKeybindingsConflictsCommand.title });
                                        break;
                                    case "snippets" /* SyncResource.Snippets */:
                                        items.push({ id: resolveSnippetsConflictsCommand.id, label: resolveSnippetsConflictsCommand.title });
                                        break;
                                    case "tasks" /* SyncResource.Tasks */:
                                        items.push({ id: resolveTasksConflictsCommand.id, label: resolveTasksConflictsCommand.title });
                                        break;
                                }
                            }
                            items.push({ type: 'separator' });
                        }
                        items.push({ id: configureSyncCommand.id, label: configureSyncCommand.title });
                        items.push({ id: showSyncSettingsCommand.id, label: showSyncSettingsCommand.title });
                        items.push({ id: showSyncedDataCommand.id, label: showSyncedDataCommand.title });
                        items.push({ type: 'separator' });
                        items.push({ id: syncNowCommand.id, label: syncNowCommand.title, description: syncNowCommand.description(that.userDataSyncService) });
                        if (that.userDataSyncEnablementService.canToggleEnablement()) {
                            const account = that.userDataSyncWorkbenchService.current;
                            items.push({ id: turnOffSyncCommand.id, label: turnOffSyncCommand.title, description: account ? `${account.accountName} (${that.authenticationService.getLabel(account.authenticationProviderId)})` : undefined });
                        }
                        quickPick.items = items;
                        disposables.add(quickPick.onDidAccept(() => {
                            if (quickPick.selectedItems[0] && quickPick.selectedItems[0].id) {
                                commandService.executeCommand(quickPick.selectedItems[0].id);
                            }
                            quickPick.hide();
                        }));
                        disposables.add(quickPick.onDidHide(() => {
                            disposables.dispose();
                            c();
                        }));
                        quickPick.show();
                    });
                }
            }));
        }
        registerEnableSyncViewsAction() {
            const that = this;
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */));
            this._register((0, actions_2.registerAction2)(class SyncStatusAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: showSyncedDataCommand.id,
                        title: { value: (0, nls_1.localize)('workbench.action.showSyncRemoteBackup', "Show Synced Data"), original: `Show Synced Data` },
                        category: { value: userDataSync_2.SYNC_TITLE, original: `Settings Sync` },
                        precondition: when,
                        menu: {
                            id: actions_2.MenuId.CommandPalette,
                            when
                        }
                    });
                }
                run(accessor) {
                    return that.userDataSyncWorkbenchService.showSyncActivity();
                }
            }));
        }
        registerSyncNowAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class SyncNowAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: syncNowCommand.id,
                        title: syncNowCommand.title,
                        menu: {
                            id: actions_2.MenuId.CommandPalette,
                            when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_ENABLEMENT, userDataSync_2.CONTEXT_ACCOUNT_STATE.isEqualTo("available" /* AccountStatus.Available */), userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */))
                        }
                    });
                }
                run(accessor) {
                    return that.userDataSyncWorkbenchService.syncNow();
                }
            }));
        }
        registerTurnOffSyncAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class StopSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: turnOffSyncCommand.id,
                        title: turnOffSyncCommand.title,
                        menu: {
                            id: actions_2.MenuId.CommandPalette,
                            when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT),
                        },
                    });
                }
                async run() {
                    try {
                        await that.turnOff();
                    }
                    catch (e) {
                        if (!(0, errors_1.isCancellationError)(e)) {
                            that.notificationService.error((0, nls_1.localize)('turn off failed', "Error while turning off Settings Sync. Please check [logs]({0}) for more details.", `command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID}`));
                        }
                    }
                }
            }));
        }
        registerConfigureSyncAction() {
            const that = this;
            const when = contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */), userDataSync_2.CONTEXT_SYNC_ENABLEMENT);
            this._register((0, actions_2.registerAction2)(class ConfigureSyncAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: configureSyncCommand.id,
                        title: configureSyncCommand.title,
                        icon: codicons_1.Codicon.settingsGear,
                        tooltip: (0, nls_1.localize)('configure', "Configure..."),
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when
                            }, {
                                id: actions_2.MenuId.ViewContainerTitle,
                                when: contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID),
                                group: 'navigation',
                                order: 2
                            }]
                    });
                }
                run() { return that.configureSyncOptions(); }
            }));
        }
        registerShowLogAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class ShowSyncActivityAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID,
                        title: (0, nls_1.localize)('show sync log title', "{0}: Show Log", userDataSync_2.SYNC_TITLE),
                        tooltip: (0, nls_1.localize)('show sync log toolrip', "Show Log"),
                        icon: codicons_1.Codicon.output,
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */)),
                            }, {
                                id: actions_2.MenuId.ViewContainerTitle,
                                when: contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID),
                                group: 'navigation',
                                order: 1
                            }],
                    });
                }
                run() { return that.showSyncActivity(); }
            }));
        }
        registerShowSettingsAction() {
            this._register((0, actions_2.registerAction2)(class ShowSyncSettingsAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: showSyncSettingsCommand.id,
                        title: showSyncSettingsCommand.title,
                        menu: {
                            id: actions_2.MenuId.CommandPalette,
                            when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */)),
                        },
                    });
                }
                run(accessor) {
                    accessor.get(preferences_1.IPreferencesService).openUserSettings({ jsonEditor: false, query: '@tag:sync' });
                }
            }));
        }
        registerHelpAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class HelpAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.userDataSync.actions.help',
                        title: { value: userDataSync_2.SYNC_TITLE, original: 'Settings Sync' },
                        category: actions_3.CATEGORIES.Help,
                        menu: [{
                                id: actions_2.MenuId.CommandPalette,
                                when: contextkey_1.ContextKeyExpr.and(userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */)),
                            }],
                    });
                }
                run() { return that.openerService.open(uri_1.URI.parse('https://aka.ms/vscode-settings-sync-help')); }
            }));
            actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.ViewContainerTitle, {
                command: {
                    id: 'workbench.userDataSync.actions.help',
                    title: actions_3.CATEGORIES.Help.value
                },
                when: contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID),
                group: '1_help',
            });
        }
        registerViews() {
            const container = this.registerViewContainer();
            this.registerDataViews(container);
        }
        registerViewContainer() {
            return platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
                id: userDataSync_2.SYNC_VIEW_CONTAINER_ID,
                title: userDataSync_2.SYNC_TITLE,
                ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [userDataSync_2.SYNC_VIEW_CONTAINER_ID, { mergeViewWithContainerWhenSingleView: true }]),
                icon: userDataSync_2.SYNC_VIEW_ICON,
                hideIfEmpty: true,
            }, 0 /* ViewContainerLocation.Sidebar */);
        }
        registerResetSyncDataAction() {
            const that = this;
            this._register((0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: 'workbench.actions.syncData.reset',
                        title: (0, nls_1.localize)('workbench.actions.syncData.reset', "Clear Data in Cloud..."),
                        menu: [{
                                id: actions_2.MenuId.ViewContainerTitle,
                                when: contextkey_1.ContextKeyExpr.equals('viewContainer', userDataSync_2.SYNC_VIEW_CONTAINER_ID),
                                group: '0_configure',
                            }],
                    });
                }
                run() { return that.userDataSyncWorkbenchService.resetSyncedData(); }
            }));
        }
        registerDataViews(container) {
            this._register(this.instantiationService.createInstance(userDataSyncViews_1.UserDataSyncDataViews, container));
        }
    };
    UserDataSyncWorkbenchContribution = __decorate([
        __param(0, userDataSync_1.IUserDataSyncEnablementService),
        __param(1, userDataSync_1.IUserDataSyncService),
        __param(2, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, activity_1.IActivityService),
        __param(5, notification_1.INotificationService),
        __param(6, editorService_1.IEditorService),
        __param(7, environmentService_1.IWorkbenchEnvironmentService),
        __param(8, dialogs_1.IDialogService),
        __param(9, quickInput_1.IQuickInputService),
        __param(10, instantiation_1.IInstantiationService),
        __param(11, output_1.IOutputService),
        __param(12, userDataSyncAccount_1.IUserDataSyncAccountService),
        __param(13, userDataSync_1.IUserDataAutoSyncService),
        __param(14, resolverService_1.ITextModelService),
        __param(15, preferences_1.IPreferencesService),
        __param(16, telemetry_1.ITelemetryService),
        __param(17, productService_1.IProductService),
        __param(18, storage_1.IStorageService),
        __param(19, opener_1.IOpenerService),
        __param(20, authentication_1.IAuthenticationService),
        __param(21, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(22, configuration_1.IConfigurationService),
        __param(23, userDataInit_1.IUserDataInitializationService),
        __param(24, host_1.IHostService)
    ], UserDataSyncWorkbenchContribution);
    exports.UserDataSyncWorkbenchContribution = UserDataSyncWorkbenchContribution;
    let UserDataRemoteContentProvider = class UserDataRemoteContentProvider {
        constructor(userDataSyncService, modelService, languageService) {
            this.userDataSyncService = userDataSyncService;
            this.modelService = modelService;
            this.languageService = languageService;
        }
        provideTextContent(uri) {
            if (uri.scheme === userDataSync_1.USER_DATA_SYNC_SCHEME) {
                return this.userDataSyncService.resolveContent(uri).then(content => this.modelService.createModel(content || '', this.languageService.createById('jsonc'), uri));
            }
            return null;
        }
    };
    UserDataRemoteContentProvider = __decorate([
        __param(0, userDataSync_1.IUserDataSyncService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService)
    ], UserDataRemoteContentProvider);
    let AcceptChangesContribution = class AcceptChangesContribution extends lifecycle_1.Disposable {
        constructor(editor, instantiationService, userDataSyncService, notificationService, dialogService, configurationService, telemetryService, userDataSyncEnablementService) {
            super();
            this.editor = editor;
            this.instantiationService = instantiationService;
            this.userDataSyncService = userDataSyncService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.update();
            this.registerListeners();
        }
        static get(editor) {
            return editor.getContribution(AcceptChangesContribution.ID);
        }
        registerListeners() {
            this._register(this.editor.onDidChangeModel(() => this.update()));
            this._register(this.userDataSyncService.onDidChangeConflicts(() => this.update()));
            this._register(event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('diffEditor.renderSideBySide'))(() => this.update()));
        }
        update() {
            if (!this.shouldShowButton(this.editor)) {
                this.disposeAcceptChangesWidgetRenderer();
                return;
            }
            this.createAcceptChangesWidgetRenderer();
        }
        shouldShowButton(editor) {
            const model = editor.getModel();
            if (!model) {
                return false; // we need a model
            }
            if (!this.userDataSyncEnablementService.isEnabled()) {
                return false;
            }
            const syncResourceConflicts = this.getSyncResourceConflicts(model.uri);
            if (!syncResourceConflicts) {
                return false;
            }
            if (syncResourceConflicts[1].some(({ previewResource }) => (0, resources_1.isEqual)(previewResource, model.uri))) {
                return true;
            }
            if (syncResourceConflicts[1].some(({ remoteResource }) => (0, resources_1.isEqual)(remoteResource, model.uri))) {
                return this.configurationService.getValue('diffEditor.renderSideBySide');
            }
            return false;
        }
        createAcceptChangesWidgetRenderer() {
            if (!this.acceptChangesButton) {
                const resource = this.editor.getModel().uri;
                const [syncResource, conflicts] = this.getSyncResourceConflicts(resource);
                const isRemote = conflicts.some(({ remoteResource }) => (0, resources_1.isEqual)(remoteResource, resource));
                const acceptRemoteLabel = (0, nls_1.localize)('accept remote', "Accept Remote");
                const acceptMergesLabel = (0, nls_1.localize)('accept merges', "Accept Merges");
                const acceptRemoteButtonLabel = (0, nls_1.localize)('accept remote button', "Accept &&Remote");
                const acceptMergesButtonLabel = (0, nls_1.localize)('accept merges button', "Accept &&Merges");
                this.acceptChangesButton = this.instantiationService.createInstance(codeeditor_1.FloatingClickWidget, this.editor, isRemote ? acceptRemoteLabel : acceptMergesLabel, null);
                this._register(this.acceptChangesButton.onClick(async () => {
                    const model = this.editor.getModel();
                    if (model) {
                        this.telemetryService.publicLog2('sync/handleConflicts', { source: syncResource, action: isRemote ? 'acceptRemote' : 'acceptLocal' });
                        const syncAreaLabel = (0, userDataSync_2.getSyncAreaLabel)(syncResource);
                        const result = await this.dialogService.confirm({
                            type: 'info',
                            title: isRemote
                                ? (0, nls_1.localize)('Sync accept remote', "{0}: {1}", userDataSync_2.SYNC_TITLE, acceptRemoteLabel)
                                : (0, nls_1.localize)('Sync accept merges', "{0}: {1}", userDataSync_2.SYNC_TITLE, acceptMergesLabel),
                            message: isRemote
                                ? (0, nls_1.localize)('confirm replace and overwrite local', "Would you like to accept remote {0} and replace local {1}?", syncAreaLabel.toLowerCase(), syncAreaLabel.toLowerCase())
                                : (0, nls_1.localize)('confirm replace and overwrite remote', "Would you like to accept merges and replace remote {0}?", syncAreaLabel.toLowerCase()),
                            primaryButton: isRemote ? acceptRemoteButtonLabel : acceptMergesButtonLabel
                        });
                        if (result.confirmed) {
                            try {
                                await this.userDataSyncService.accept(syncResource, model.uri, model.getValue(), true);
                            }
                            catch (e) {
                                if (e instanceof userDataSync_1.UserDataSyncError && e.code === "LocalPreconditionFailed" /* UserDataSyncErrorCode.LocalPreconditionFailed */) {
                                    const syncResourceCoflicts = this.userDataSyncService.conflicts.filter(syncResourceCoflicts => syncResourceCoflicts[0] === syncResource)[0];
                                    if (syncResourceCoflicts && conflicts.some(conflict => (0, resources_1.isEqual)(conflict.previewResource, model.uri) || (0, resources_1.isEqual)(conflict.remoteResource, model.uri))) {
                                        this.notificationService.warn((0, nls_1.localize)('update conflicts', "Could not resolve conflicts as there is new local version available. Please try again."));
                                    }
                                }
                                else {
                                    this.notificationService.error((0, nls_1.localize)('accept failed', "Error while accepting changes. Please check [logs]({0}) for more details.", `command:${userDataSync_2.SHOW_SYNC_LOG_COMMAND_ID}`));
                                }
                            }
                        }
                    }
                }));
                this.acceptChangesButton.render();
            }
        }
        getSyncResourceConflicts(resource) {
            return this.userDataSyncService.conflicts.filter(([, conflicts]) => conflicts.some(({ previewResource, remoteResource }) => (0, resources_1.isEqual)(previewResource, resource) || (0, resources_1.isEqual)(remoteResource, resource)))[0];
        }
        disposeAcceptChangesWidgetRenderer() {
            (0, lifecycle_1.dispose)(this.acceptChangesButton);
            this.acceptChangesButton = undefined;
        }
        dispose() {
            this.disposeAcceptChangesWidgetRenderer();
            super.dispose();
        }
    };
    AcceptChangesContribution.ID = 'editor.contrib.acceptChangesButton';
    AcceptChangesContribution = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, userDataSync_1.IUserDataSyncService),
        __param(3, notification_1.INotificationService),
        __param(4, dialogs_1.IDialogService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, userDataSync_1.IUserDataSyncEnablementService)
    ], AcceptChangesContribution);
});
//# sourceMappingURL=userDataSync.js.map