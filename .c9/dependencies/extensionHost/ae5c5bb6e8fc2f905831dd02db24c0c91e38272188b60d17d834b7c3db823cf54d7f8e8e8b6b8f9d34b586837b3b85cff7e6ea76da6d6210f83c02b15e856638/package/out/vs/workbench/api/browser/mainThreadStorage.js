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
define(["require", "exports", "vs/platform/storage/common/storage", "../common/extHost.protocol", "vs/workbench/services/extensions/common/extHostCustomers", "vs/base/common/platform", "vs/platform/extensionManagement/common/extensionStorage", "vs/workbench/services/extensions/common/extensionStorageMigration", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log"], function (require, exports, storage_1, extHost_protocol_1, extHostCustomers_1, platform_1, extensionStorage_1, extensionStorageMigration_1, instantiation_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadStorage = void 0;
    let MainThreadStorage = class MainThreadStorage {
        constructor(extHostContext, _extensionStorageService, _storageService, _instantiationService, _logService) {
            this._extensionStorageService = _extensionStorageService;
            this._storageService = _storageService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._sharedStorageKeysToWatch = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostStorage);
            this._storageListener = this._storageService.onDidChangeValue(e => {
                const shared = e.scope === 0 /* StorageScope.GLOBAL */;
                if (shared && this._sharedStorageKeysToWatch.has(e.key)) {
                    this._proxy.$acceptValue(shared, e.key, this._extensionStorageService.getExtensionState(e.key, shared));
                }
            });
        }
        dispose() {
            this._storageListener.dispose();
        }
        async $initializeExtensionStorage(shared, extensionId) {
            await this.checkAndMigrateExtensionStorage(extensionId, shared);
            if (shared) {
                this._sharedStorageKeysToWatch.set(extensionId, true);
            }
            return this._extensionStorageService.getExtensionState(extensionId, shared);
        }
        async $setValue(shared, key, value) {
            this._extensionStorageService.setExtensionState(key, value, shared);
        }
        $registerExtensionStorageKeysToSync(extension, keys) {
            this._extensionStorageService.setKeysForSync(extension, keys);
        }
        async checkAndMigrateExtensionStorage(extensionId, shared) {
            try {
                let sourceExtensionId = this._extensionStorageService.getSourceExtensionToMigrate(extensionId);
                // TODO: @sandy081 - Remove it after 6 months
                // If current extension does not have any migration requested
                // Then check if the extension has to be migrated for using lower case in web
                // If so, migrate the extension state from lower case id to its normal id.
                if (!sourceExtensionId && platform_1.isWeb && extensionId !== extensionId.toLowerCase()) {
                    sourceExtensionId = extensionId.toLowerCase();
                }
                if (sourceExtensionId) {
                    // TODO: @sandy081 - Remove it after 6 months
                    // In Web, extension state was used to be stored in lower case extension id.
                    // Hence check that if the lower cased source extension was not yet migrated in web
                    // If not take the lower cased source extension id for migration
                    if (platform_1.isWeb && sourceExtensionId !== sourceExtensionId.toLowerCase() && this._extensionStorageService.getExtensionState(sourceExtensionId.toLowerCase(), shared) && !this._extensionStorageService.getExtensionState(sourceExtensionId, shared)) {
                        sourceExtensionId = sourceExtensionId.toLowerCase();
                    }
                    await (0, extensionStorageMigration_1.migrateExtensionStorage)(sourceExtensionId, extensionId, shared, this._instantiationService);
                }
            }
            catch (error) {
                this._logService.error(error);
            }
        }
    };
    MainThreadStorage = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadStorage),
        __param(1, extensionStorage_1.IExtensionStorageService),
        __param(2, storage_1.IStorageService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, log_1.ILogService)
    ], MainThreadStorage);
    exports.MainThreadStorage = MainThreadStorage;
});
//# sourceMappingURL=mainThreadStorage.js.map