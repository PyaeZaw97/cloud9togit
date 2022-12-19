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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/environment/common/environment", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, event_1, lifecycle_1, platform_1, environment_1, storage_1, telemetry_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncEnablementService = void 0;
    const enablementKey = 'sync.enable';
    let UserDataSyncEnablementService = class UserDataSyncEnablementService extends lifecycle_1.Disposable {
        constructor(storageService, telemetryService, environmentService, userDataSyncStoreManagementService) {
            super();
            this.storageService = storageService;
            this.telemetryService = telemetryService;
            this.environmentService = environmentService;
            this.userDataSyncStoreManagementService = userDataSyncStoreManagementService;
            this._onDidChangeEnablement = new event_1.Emitter();
            this.onDidChangeEnablement = this._onDidChangeEnablement.event;
            this._onDidChangeResourceEnablement = new event_1.Emitter();
            this.onDidChangeResourceEnablement = this._onDidChangeResourceEnablement.event;
            this._register(storageService.onDidChangeValue(e => this.onDidStorageChange(e)));
        }
        isEnabled() {
            switch (this.environmentService.sync) {
                case 'on':
                    return true;
                case 'off':
                    return false;
            }
            return this.storageService.getBoolean(enablementKey, 0 /* StorageScope.GLOBAL */, false);
        }
        canToggleEnablement() {
            return this.userDataSyncStoreManagementService.userDataSyncStore !== undefined && this.environmentService.sync === undefined;
        }
        setEnablement(enabled) {
            if (enabled && !this.canToggleEnablement()) {
                return;
            }
            this.telemetryService.publicLog2(enablementKey, { enabled });
            this.storageService.store(enablementKey, enabled, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
        isResourceEnabled(resource) {
            return this.storageService.getBoolean((0, userDataSync_1.getEnablementKey)(resource), 0 /* StorageScope.GLOBAL */, true);
        }
        setResourceEnablement(resource, enabled) {
            if (this.isResourceEnabled(resource) !== enabled) {
                const resourceEnablementKey = (0, userDataSync_1.getEnablementKey)(resource);
                this.storeResourceEnablement(resourceEnablementKey, enabled);
            }
        }
        getResourceSyncStateVersion(resource) {
            return undefined;
        }
        storeResourceEnablement(resourceEnablementKey, enabled) {
            this.storageService.store(resourceEnablementKey, enabled, 0 /* StorageScope.GLOBAL */, platform_1.isWeb ? 0 /* StorageTarget.USER */ : 1 /* StorageTarget.MACHINE */);
        }
        onDidStorageChange(storageChangeEvent) {
            if (storageChangeEvent.scope !== 0 /* StorageScope.GLOBAL */) {
                return;
            }
            if (enablementKey === storageChangeEvent.key) {
                this._onDidChangeEnablement.fire(this.isEnabled());
                return;
            }
            const resourceKey = userDataSync_1.ALL_SYNC_RESOURCES.filter(resourceKey => (0, userDataSync_1.getEnablementKey)(resourceKey) === storageChangeEvent.key)[0];
            if (resourceKey) {
                this._onDidChangeResourceEnablement.fire([resourceKey, this.isResourceEnabled(resourceKey)]);
                return;
            }
        }
    };
    UserDataSyncEnablementService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, userDataSync_1.IUserDataSyncStoreManagementService)
    ], UserDataSyncEnablementService);
    exports.UserDataSyncEnablementService = UserDataSyncEnablementService;
});
//# sourceMappingURL=userDataSyncEnablementService.js.map