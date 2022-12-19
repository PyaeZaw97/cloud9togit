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
define(["require", "exports", "vs/base/common/async", "vs/base/common/date", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/nls", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/userDataSync/common/userDataSyncMachines"], function (require, exports, async_1, date_1, errorMessage_1, errors_1, event_1, lifecycle_1, platform_1, resources_1, uri_1, nls_1, productService_1, storage_1, telemetry_1, userDataSync_1, userDataSyncAccount_1, userDataSyncMachines_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataAutoSyncService = void 0;
    const disableMachineEventuallyKey = 'sync.disableMachineEventually';
    const sessionIdKey = 'sync.sessionId';
    const storeUrlKey = 'sync.storeUrl';
    const productQualityKey = 'sync.productQuality';
    let UserDataAutoSyncService = class UserDataAutoSyncService extends lifecycle_1.Disposable {
        constructor(productService, userDataSyncStoreManagementService, userDataSyncStoreService, userDataSyncEnablementService, userDataSyncService, logService, userDataSyncAccountService, telemetryService, userDataSyncMachinesService, storageService) {
            var _a;
            super();
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataSyncService = userDataSyncService;
            this.logService = logService;
            this.userDataSyncAccountService = userDataSyncAccountService;
            this.telemetryService = telemetryService;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.storageService = storageService;
            this.autoSync = this._register(new lifecycle_1.MutableDisposable());
            this.successiveFailures = 0;
            this.lastSyncTriggerTime = undefined;
            this.suspendUntilRestart = false;
            this._onError = this._register(new event_1.Emitter());
            this.onError = this._onError.event;
            this.sources = [];
            this.syncTriggerDelayer = this._register(new async_1.ThrottledDelayer(this.getSyncTriggerDelayTime()));
            this.lastSyncUrl = this.syncUrl;
            this.syncUrl = (_a = userDataSyncStoreManagementService.userDataSyncStore) === null || _a === void 0 ? void 0 : _a.url;
            this.previousProductQuality = this.productQuality;
            this.productQuality = productService.quality;
            if (this.syncUrl) {
                this.logService.info('Using settings sync service', this.syncUrl.toString());
                this._register(userDataSyncStoreManagementService.onDidChangeUserDataSyncStore(() => {
                    var _a, _b;
                    if (!(0, resources_1.isEqual)(this.syncUrl, (_a = userDataSyncStoreManagementService.userDataSyncStore) === null || _a === void 0 ? void 0 : _a.url)) {
                        this.lastSyncUrl = this.syncUrl;
                        this.syncUrl = (_b = userDataSyncStoreManagementService.userDataSyncStore) === null || _b === void 0 ? void 0 : _b.url;
                        if (this.syncUrl) {
                            this.logService.info('Using settings sync service', this.syncUrl.toString());
                        }
                    }
                }));
                if (this.userDataSyncEnablementService.isEnabled()) {
                    this.logService.info('Auto Sync is enabled.');
                }
                else {
                    this.logService.info('Auto Sync is disabled.');
                }
                this.updateAutoSync();
                if (this.hasToDisableMachineEventually()) {
                    this.disableMachineEventually();
                }
                this._register(userDataSyncAccountService.onDidChangeAccount(() => this.updateAutoSync()));
                this._register(userDataSyncStoreService.onDidChangeDonotMakeRequestsUntil(() => this.updateAutoSync()));
                this._register(userDataSyncService.onDidChangeLocal(source => this.triggerSync([source], false, false)));
                this._register(event_1.Event.filter(this.userDataSyncEnablementService.onDidChangeResourceEnablement, ([, enabled]) => enabled)(() => this.triggerSync(['resourceEnablement'], false, false)));
                this._register(this.userDataSyncStoreManagementService.onDidChangeUserDataSyncStore(() => this.triggerSync(['userDataSyncStoreChanged'], false, false)));
            }
        }
        get syncUrl() {
            const value = this.storageService.get(storeUrlKey, 0 /* StorageScope.GLOBAL */);
            return value ? uri_1.URI.parse(value) : undefined;
        }
        set syncUrl(syncUrl) {
            if (syncUrl) {
                this.storageService.store(storeUrlKey, syncUrl.toString(), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(storeUrlKey, 0 /* StorageScope.GLOBAL */);
            }
        }
        get productQuality() {
            return this.storageService.get(productQualityKey, 0 /* StorageScope.GLOBAL */);
        }
        set productQuality(productQuality) {
            if (productQuality) {
                this.storageService.store(productQualityKey, productQuality, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(productQualityKey, 0 /* StorageScope.GLOBAL */);
            }
        }
        updateAutoSync() {
            const { enabled, message } = this.isAutoSyncEnabled();
            if (enabled) {
                if (this.autoSync.value === undefined) {
                    this.autoSync.value = new AutoSync(this.lastSyncUrl, 1000 * 60 * 5 /* 5 miutes */, this.userDataSyncStoreManagementService, this.userDataSyncStoreService, this.userDataSyncService, this.userDataSyncMachinesService, this.logService, this.storageService);
                    this.autoSync.value.register(this.autoSync.value.onDidStartSync(() => this.lastSyncTriggerTime = new Date().getTime()));
                    this.autoSync.value.register(this.autoSync.value.onDidFinishSync(e => this.onDidFinishSync(e)));
                    if (this.startAutoSync()) {
                        this.autoSync.value.start();
                    }
                }
            }
            else {
                this.syncTriggerDelayer.cancel();
                if (this.autoSync.value !== undefined) {
                    if (message) {
                        this.logService.info(message);
                    }
                    this.autoSync.clear();
                }
                /* log message when auto sync is not disabled by user */
                else if (message && this.userDataSyncEnablementService.isEnabled()) {
                    this.logService.info(message);
                }
            }
        }
        // For tests purpose only
        startAutoSync() { return true; }
        isAutoSyncEnabled() {
            if (!this.userDataSyncEnablementService.isEnabled()) {
                return { enabled: false, message: 'Auto Sync: Disabled.' };
            }
            if (!this.userDataSyncAccountService.account) {
                return { enabled: false, message: 'Auto Sync: Suspended until auth token is available.' };
            }
            if (this.userDataSyncStoreService.donotMakeRequestsUntil) {
                return { enabled: false, message: `Auto Sync: Suspended until ${(0, date_1.toLocalISOString)(this.userDataSyncStoreService.donotMakeRequestsUntil)} because server is not accepting requests until then.` };
            }
            if (this.suspendUntilRestart) {
                return { enabled: false, message: 'Auto Sync: Suspended until restart.' };
            }
            return { enabled: true };
        }
        async turnOn() {
            this.stopDisableMachineEventually();
            this.lastSyncUrl = this.syncUrl;
            this.updateEnablement(true);
        }
        async turnOff(everywhere, softTurnOffOnError, donotRemoveMachine) {
            try {
                // Remove machine
                if (this.userDataSyncAccountService.account && !donotRemoveMachine) {
                    await this.userDataSyncMachinesService.removeCurrentMachine();
                }
                // Disable Auto Sync
                this.updateEnablement(false);
                // Reset Session
                this.storageService.remove(sessionIdKey, 0 /* StorageScope.GLOBAL */);
                // Reset
                if (everywhere) {
                    this.telemetryService.publicLog2('sync/turnOffEveryWhere');
                    await this.userDataSyncService.reset();
                }
                else {
                    await this.userDataSyncService.resetLocal();
                }
            }
            catch (error) {
                if (softTurnOffOnError) {
                    this.logService.error(error);
                    this.updateEnablement(false);
                }
                else {
                    throw error;
                }
            }
        }
        updateEnablement(enabled) {
            if (this.userDataSyncEnablementService.isEnabled() !== enabled) {
                this.userDataSyncEnablementService.setEnablement(enabled);
                this.updateAutoSync();
            }
        }
        hasProductQualityChanged() {
            return !!this.previousProductQuality && !!this.productQuality && this.previousProductQuality !== this.productQuality;
        }
        async onDidFinishSync(error) {
            if (!error) {
                // Sync finished without errors
                this.successiveFailures = 0;
                return;
            }
            // Error while syncing
            const userDataSyncError = userDataSync_1.UserDataSyncError.toUserDataSyncError(error);
            // Log to telemetry
            if (userDataSyncError instanceof userDataSync_1.UserDataAutoSyncError) {
                this.telemetryService.publicLog2(`autosync/error`, { code: userDataSyncError.code, service: this.userDataSyncStoreManagementService.userDataSyncStore.url.toString() });
            }
            // Session got expired
            if (userDataSyncError.code === "SessionExpired" /* UserDataSyncErrorCode.SessionExpired */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info('Auto Sync: Turned off sync because current session is expired');
            }
            // Turned off from another device
            else if (userDataSyncError.code === "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info('Auto Sync: Turned off sync because sync is turned off in the cloud');
            }
            // Exceeded Rate Limit on Client
            else if (userDataSyncError.code === "LocalTooManyRequests" /* UserDataSyncErrorCode.LocalTooManyRequests */) {
                this.suspendUntilRestart = true;
                this.logService.info('Auto Sync: Suspended sync because of making too many requests to server');
                this.updateAutoSync();
            }
            // Exceeded Rate Limit on Server
            else if (userDataSyncError.code === "RemoteTooManyRequests" /* UserDataSyncErrorCode.TooManyRequests */) {
                await this.turnOff(false, true /* force soft turnoff on error */, true /* do not disable machine because disabling a machine makes request to server and can fail with TooManyRequests */);
                this.disableMachineEventually();
                this.logService.info('Auto Sync: Turned off sync because of making too many requests to server');
            }
            // Upgrade Required or Gone
            else if (userDataSyncError.code === "UpgradeRequired" /* UserDataSyncErrorCode.UpgradeRequired */ || userDataSyncError.code === "Gone" /* UserDataSyncErrorCode.Gone */) {
                await this.turnOff(false, true /* force soft turnoff on error */, true /* do not disable machine because disabling a machine makes request to server and can fail with upgrade required or gone */);
                this.disableMachineEventually();
                this.logService.info('Auto Sync: Turned off sync because current client is not compatible with server. Requires client upgrade.');
            }
            // Incompatible Local Content
            else if (userDataSyncError.code === "IncompatibleLocalContent" /* UserDataSyncErrorCode.IncompatibleLocalContent */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info(`Auto Sync: Turned off sync because server has ${userDataSyncError.resource} content with newer version than of client. Requires client upgrade.`);
            }
            // Incompatible Remote Content
            else if (userDataSyncError.code === "IncompatibleRemoteContent" /* UserDataSyncErrorCode.IncompatibleRemoteContent */) {
                await this.turnOff(false, true /* force soft turnoff on error */);
                this.logService.info(`Auto Sync: Turned off sync because server has ${userDataSyncError.resource} content with older version than of client. Requires server reset.`);
            }
            // Service changed
            else if (userDataSyncError.code === "ServiceChanged" /* UserDataSyncErrorCode.ServiceChanged */ || userDataSyncError.code === "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */) {
                // Check if default settings sync service has changed in web without changing the product quality
                // Then turn off settings sync and ask user to turn on again
                if (platform_1.isWeb && userDataSyncError.code === "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */ && !this.hasProductQualityChanged()) {
                    await this.turnOff(false, true /* force soft turnoff on error */);
                    this.logService.info('Auto Sync: Turned off sync because default sync service is changed.');
                }
                // Service has changed by the user. So turn off and turn on sync.
                // Show a prompt to the user about service change.
                else {
                    await this.turnOff(false, true /* force soft turnoff on error */, true /* do not disable machine */);
                    await this.turnOn();
                    this.logService.info('Auto Sync: Sync Service changed. Turned off auto sync, reset local state and turned on auto sync.');
                }
            }
            else {
                this.logService.error(userDataSyncError);
                this.successiveFailures++;
            }
            this._onError.fire(userDataSyncError);
        }
        async disableMachineEventually() {
            this.storageService.store(disableMachineEventuallyKey, true, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            await (0, async_1.timeout)(1000 * 60 * 10);
            // Return if got stopped meanwhile.
            if (!this.hasToDisableMachineEventually()) {
                return;
            }
            this.stopDisableMachineEventually();
            // disable only if sync is disabled
            if (!this.userDataSyncEnablementService.isEnabled() && this.userDataSyncAccountService.account) {
                await this.userDataSyncMachinesService.removeCurrentMachine();
            }
        }
        hasToDisableMachineEventually() {
            return this.storageService.getBoolean(disableMachineEventuallyKey, 0 /* StorageScope.GLOBAL */, false);
        }
        stopDisableMachineEventually() {
            this.storageService.remove(disableMachineEventuallyKey, 0 /* StorageScope.GLOBAL */);
        }
        async triggerSync(sources, skipIfSyncedRecently, disableCache) {
            if (this.autoSync.value === undefined) {
                return this.syncTriggerDelayer.cancel();
            }
            if (skipIfSyncedRecently && this.lastSyncTriggerTime
                && Math.round((new Date().getTime() - this.lastSyncTriggerTime) / 1000) < 10) {
                this.logService.debug('Auto Sync: Skipped. Limited to once per 10 seconds.');
                return;
            }
            this.sources.push(...sources);
            return this.syncTriggerDelayer.trigger(async () => {
                this.logService.trace('activity sources', ...this.sources);
                this.telemetryService.publicLog2('sync/triggered', { sources: this.sources });
                this.sources = [];
                if (this.autoSync.value) {
                    await this.autoSync.value.sync('Activity', disableCache);
                }
            }, this.successiveFailures
                ? this.getSyncTriggerDelayTime() * 1 * Math.min(Math.pow(2, this.successiveFailures), 60) /* Delay exponentially until max 1 minute */
                : this.getSyncTriggerDelayTime());
        }
        getSyncTriggerDelayTime() {
            return 2000; /* Debounce for 2 seconds if there are no failures */
        }
    };
    UserDataAutoSyncService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, userDataSync_1.IUserDataSyncStoreManagementService),
        __param(2, userDataSync_1.IUserDataSyncStoreService),
        __param(3, userDataSync_1.IUserDataSyncEnablementService),
        __param(4, userDataSync_1.IUserDataSyncService),
        __param(5, userDataSync_1.IUserDataSyncLogService),
        __param(6, userDataSyncAccount_1.IUserDataSyncAccountService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, userDataSyncMachines_1.IUserDataSyncMachinesService),
        __param(9, storage_1.IStorageService)
    ], UserDataAutoSyncService);
    exports.UserDataAutoSyncService = UserDataAutoSyncService;
    class AutoSync extends lifecycle_1.Disposable {
        constructor(lastSyncUrl, interval /* in milliseconds */, userDataSyncStoreManagementService, userDataSyncStoreService, userDataSyncService, userDataSyncMachinesService, logService, storageService) {
            super();
            this.lastSyncUrl = lastSyncUrl;
            this.interval = interval;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this.userDataSyncStoreService = userDataSyncStoreService;
            this.userDataSyncService = userDataSyncService;
            this.userDataSyncMachinesService = userDataSyncMachinesService;
            this.logService = logService;
            this.storageService = storageService;
            this.intervalHandler = this._register(new lifecycle_1.MutableDisposable());
            this._onDidStartSync = this._register(new event_1.Emitter());
            this.onDidStartSync = this._onDidStartSync.event;
            this._onDidFinishSync = this._register(new event_1.Emitter());
            this.onDidFinishSync = this._onDidFinishSync.event;
            this.manifest = null;
        }
        start() {
            this._register(this.onDidFinishSync(() => this.waitUntilNextIntervalAndSync()));
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (this.syncPromise) {
                    this.syncPromise.cancel();
                    this.logService.info('Auto sync: Cancelled sync that is in progress');
                    this.syncPromise = undefined;
                }
                if (this.syncTask) {
                    this.syncTask.stop();
                }
                this.logService.info('Auto Sync: Stopped');
            }));
            this.logService.info('Auto Sync: Started');
            this.sync(AutoSync.INTERVAL_SYNCING, false);
        }
        waitUntilNextIntervalAndSync() {
            this.intervalHandler.value = (0, async_1.disposableTimeout)(() => this.sync(AutoSync.INTERVAL_SYNCING, false), this.interval);
        }
        sync(reason, disableCache) {
            const syncPromise = (0, async_1.createCancelablePromise)(async (token) => {
                if (this.syncPromise) {
                    try {
                        // Wait until existing sync is finished
                        this.logService.debug('Auto Sync: Waiting until sync is finished.');
                        await this.syncPromise;
                    }
                    catch (error) {
                        if ((0, errors_1.isCancellationError)(error)) {
                            // Cancelled => Disposed. Donot continue sync.
                            return;
                        }
                    }
                }
                return this.doSync(reason, disableCache, token);
            });
            this.syncPromise = syncPromise;
            this.syncPromise.finally(() => this.syncPromise = undefined);
            return this.syncPromise;
        }
        hasSyncServiceChanged() {
            var _a;
            return this.lastSyncUrl !== undefined && !(0, resources_1.isEqual)(this.lastSyncUrl, (_a = this.userDataSyncStoreManagementService.userDataSyncStore) === null || _a === void 0 ? void 0 : _a.url);
        }
        async hasDefaultServiceChanged() {
            const previous = await this.userDataSyncStoreManagementService.getPreviousUserDataSyncStore();
            const current = this.userDataSyncStoreManagementService.userDataSyncStore;
            // check if defaults changed
            return !!current && !!previous &&
                (!(0, resources_1.isEqual)(current.defaultUrl, previous.defaultUrl) ||
                    !(0, resources_1.isEqual)(current.insidersUrl, previous.insidersUrl) ||
                    !(0, resources_1.isEqual)(current.stableUrl, previous.stableUrl));
        }
        async doSync(reason, disableCache, token) {
            this.logService.info(`Auto Sync: Triggered by ${reason}`);
            this._onDidStartSync.fire();
            let error;
            try {
                this.syncTask = await this.userDataSyncService.createSyncTask(this.manifest, disableCache);
                if (token.isCancellationRequested) {
                    return;
                }
                this.manifest = this.syncTask.manifest;
                // Server has no data but this machine was synced before
                if (this.manifest === null && await this.userDataSyncService.hasPreviouslySynced()) {
                    if (this.hasSyncServiceChanged()) {
                        if (await this.hasDefaultServiceChanged()) {
                            throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('default service changed', "Cannot sync because default service has changed"), "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */);
                        }
                        else {
                            throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('service changed', "Cannot sync because sync service has changed"), "ServiceChanged" /* UserDataSyncErrorCode.ServiceChanged */);
                        }
                    }
                    else {
                        // Sync was turned off in the cloud
                        throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('turned off', "Cannot sync because syncing is turned off in the cloud"), "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */);
                    }
                }
                const sessionId = this.storageService.get(sessionIdKey, 0 /* StorageScope.GLOBAL */);
                // Server session is different from client session
                if (sessionId && this.manifest && sessionId !== this.manifest.session) {
                    if (this.hasSyncServiceChanged()) {
                        if (await this.hasDefaultServiceChanged()) {
                            throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('default service changed', "Cannot sync because default service has changed"), "DefaultServiceChanged" /* UserDataSyncErrorCode.DefaultServiceChanged */);
                        }
                        else {
                            throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('service changed', "Cannot sync because sync service has changed"), "ServiceChanged" /* UserDataSyncErrorCode.ServiceChanged */);
                        }
                    }
                    else {
                        throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('session expired', "Cannot sync because current session is expired"), "SessionExpired" /* UserDataSyncErrorCode.SessionExpired */);
                    }
                }
                const machines = await this.userDataSyncMachinesService.getMachines(this.manifest || undefined);
                // Return if cancellation is requested
                if (token.isCancellationRequested) {
                    return;
                }
                const currentMachine = machines.find(machine => machine.isCurrent);
                // Check if sync was turned off from other machine
                if (currentMachine === null || currentMachine === void 0 ? void 0 : currentMachine.disabled) {
                    // Throw TurnedOff error
                    throw new userDataSync_1.UserDataAutoSyncError((0, nls_1.localize)('turned off machine', "Cannot sync because syncing is turned off on this machine from another machine."), "TurnedOff" /* UserDataSyncErrorCode.TurnedOff */);
                }
                await this.syncTask.run();
                // After syncing, get the manifest if it was not available before
                if (this.manifest === null) {
                    try {
                        this.manifest = await this.userDataSyncStoreService.manifest(null);
                    }
                    catch (error) {
                        throw new userDataSync_1.UserDataAutoSyncError((0, errorMessage_1.toErrorMessage)(error), error instanceof userDataSync_1.UserDataSyncError ? error.code : "Unknown" /* UserDataSyncErrorCode.Unknown */);
                    }
                }
                // Update local session id
                if (this.manifest && this.manifest.session !== sessionId) {
                    this.storageService.store(sessionIdKey, this.manifest.session, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                }
                // Return if cancellation is requested
                if (token.isCancellationRequested) {
                    return;
                }
                // Add current machine
                if (!currentMachine) {
                    await this.userDataSyncMachinesService.addCurrentMachine(this.manifest || undefined);
                }
            }
            catch (e) {
                this.logService.error(e);
                error = e;
            }
            this._onDidFinishSync.fire(error);
        }
        register(t) {
            return super._register(t);
        }
    }
    AutoSync.INTERVAL_SYNCING = 'Interval';
});
//# sourceMappingURL=userDataAutoSyncService.js.map