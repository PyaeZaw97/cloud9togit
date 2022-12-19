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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/product/common/productService", "vs/base/common/arrays", "vs/platform/log/common/log", "vs/base/common/types"], function (require, exports, instantiation_1, event_1, lifecycle_1, storage_1, extensionManagementUtil_1, productService_1, arrays_1, log_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionStorageService = exports.IExtensionStorageService = void 0;
    exports.IExtensionStorageService = (0, instantiation_1.createDecorator)('IExtensionStorageService');
    const EXTENSION_KEYS_ID_VERSION_REGEX = /^extensionKeys\/([^.]+\..+)@(\d+\.\d+\.\d+(-.*)?)$/;
    let ExtensionStorageService = class ExtensionStorageService extends lifecycle_1.Disposable {
        constructor(storageService, productService, logService) {
            super();
            this.storageService = storageService;
            this.productService = productService;
            this.logService = logService;
            this._onDidChangeExtensionStorageToSync = this._register(new event_1.Emitter());
            this.onDidChangeExtensionStorageToSync = this._onDidChangeExtensionStorageToSync.event;
            this.extensionsWithKeysForSync = ExtensionStorageService.readAllExtensionsWithKeysForSync(storageService);
            this._register(this.storageService.onDidChangeValue(e => this.onDidChangeStorageValue(e)));
        }
        static toKey(extension) {
            return `extensionKeys/${(0, extensionManagementUtil_1.adoptToGalleryExtensionId)(extension.id)}@${extension.version}`;
        }
        static fromKey(key) {
            const matches = EXTENSION_KEYS_ID_VERSION_REGEX.exec(key);
            if (matches && matches[1]) {
                return { id: matches[1], version: matches[2] };
            }
            return undefined;
        }
        static async removeOutdatedExtensionVersions(extensionManagementService, storageService) {
            var _a;
            const extensions = await extensionManagementService.getInstalled();
            const extensionVersionsToRemove = [];
            for (const [id, versions] of ExtensionStorageService.readAllExtensionsWithKeysForSync(storageService)) {
                const extensionVersion = (_a = extensions.find(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }))) === null || _a === void 0 ? void 0 : _a.manifest.version;
                for (const version of versions) {
                    if (extensionVersion !== version) {
                        extensionVersionsToRemove.push(ExtensionStorageService.toKey({ id, version }));
                    }
                }
            }
            for (const key of extensionVersionsToRemove) {
                storageService.remove(key, 0 /* StorageScope.GLOBAL */);
            }
        }
        static readAllExtensionsWithKeysForSync(storageService) {
            const extensionsWithKeysForSync = new Map();
            const keys = storageService.keys(0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            for (const key of keys) {
                const extensionIdWithVersion = ExtensionStorageService.fromKey(key);
                if (extensionIdWithVersion) {
                    let versions = extensionsWithKeysForSync.get(extensionIdWithVersion.id.toLowerCase());
                    if (!versions) {
                        extensionsWithKeysForSync.set(extensionIdWithVersion.id.toLowerCase(), versions = []);
                    }
                    versions.push(extensionIdWithVersion.version);
                }
            }
            return extensionsWithKeysForSync;
        }
        onDidChangeStorageValue(e) {
            if (e.scope !== 0 /* StorageScope.GLOBAL */) {
                return;
            }
            // State of extension with keys for sync has changed
            if (this.extensionsWithKeysForSync.has(e.key.toLowerCase())) {
                this._onDidChangeExtensionStorageToSync.fire();
                return;
            }
            // Keys for sync of an extension has changed
            const extensionIdWithVersion = ExtensionStorageService.fromKey(e.key);
            if (extensionIdWithVersion) {
                if (this.storageService.get(e.key, 0 /* StorageScope.GLOBAL */) === undefined) {
                    this.extensionsWithKeysForSync.delete(extensionIdWithVersion.id.toLowerCase());
                }
                else {
                    let versions = this.extensionsWithKeysForSync.get(extensionIdWithVersion.id.toLowerCase());
                    if (!versions) {
                        this.extensionsWithKeysForSync.set(extensionIdWithVersion.id.toLowerCase(), versions = []);
                    }
                    versions.push(extensionIdWithVersion.version);
                    this._onDidChangeExtensionStorageToSync.fire();
                }
                return;
            }
        }
        getExtensionId(extension) {
            if ((0, types_1.isString)(extension)) {
                return extension;
            }
            const publisher = extension.manifest ? extension.manifest.publisher : extension.publisher;
            const name = extension.manifest ? extension.manifest.name : extension.name;
            return (0, extensionManagementUtil_1.getExtensionId)(publisher, name);
        }
        getExtensionState(extension, global) {
            const extensionId = this.getExtensionId(extension);
            const jsonValue = this.storageService.get(extensionId, global ? 0 /* StorageScope.GLOBAL */ : 1 /* StorageScope.WORKSPACE */);
            if (jsonValue) {
                try {
                    return JSON.parse(jsonValue);
                }
                catch (error) {
                    // Do not fail this call but log it for diagnostics
                    // https://github.com/microsoft/vscode/issues/132777
                    this.logService.error(`[mainThreadStorage] unexpected error parsing storage contents (extensionId: ${extensionId}, global: ${global}): ${error}`);
                }
            }
            return undefined;
        }
        setExtensionState(extension, state, global) {
            const extensionId = this.getExtensionId(extension);
            if (state === undefined) {
                this.storageService.remove(extensionId, global ? 0 /* StorageScope.GLOBAL */ : 1 /* StorageScope.WORKSPACE */);
            }
            else {
                this.storageService.store(extensionId, JSON.stringify(state), global ? 0 /* StorageScope.GLOBAL */ : 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
        }
        setKeysForSync(extensionIdWithVersion, keys) {
            this.storageService.store(ExtensionStorageService.toKey(extensionIdWithVersion), JSON.stringify(keys), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
        getKeysForSync(extensionIdWithVersion) {
            var _a;
            const extensionKeysForSyncFromProduct = (_a = this.productService.extensionSyncedKeys) === null || _a === void 0 ? void 0 : _a[extensionIdWithVersion.id.toLowerCase()];
            const extensionKeysForSyncFromStorageValue = this.storageService.get(ExtensionStorageService.toKey(extensionIdWithVersion), 0 /* StorageScope.GLOBAL */);
            const extensionKeysForSyncFromStorage = extensionKeysForSyncFromStorageValue ? JSON.parse(extensionKeysForSyncFromStorageValue) : undefined;
            return extensionKeysForSyncFromStorage && extensionKeysForSyncFromProduct
                ? (0, arrays_1.distinct)([...extensionKeysForSyncFromStorage, ...extensionKeysForSyncFromProduct])
                : (extensionKeysForSyncFromStorage || extensionKeysForSyncFromProduct);
        }
        addToMigrationList(from, to) {
            if (from !== to) {
                // remove the duplicates
                const migrationList = this.migrationList.filter(entry => !entry.includes(from) && !entry.includes(to));
                migrationList.push([from, to]);
                this.migrationList = migrationList;
            }
        }
        getSourceExtensionToMigrate(toExtensionId) {
            const entry = this.migrationList.find(([, to]) => toExtensionId === to);
            return entry ? entry[0] : undefined;
        }
        get migrationList() {
            const value = this.storageService.get('extensionStorage.migrationList', 0 /* StorageScope.GLOBAL */, '[]');
            try {
                const migrationList = JSON.parse(value);
                if ((0, types_1.isArray)(migrationList)) {
                    return migrationList;
                }
            }
            catch (error) { /* ignore */ }
            return [];
        }
        set migrationList(migrationList) {
            if (migrationList.length) {
                this.storageService.store('extensionStorage.migrationList', JSON.stringify(migrationList), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove('extensionStorage.migrationList', 0 /* StorageScope.GLOBAL */);
            }
        }
    };
    ExtensionStorageService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, productService_1.IProductService),
        __param(2, log_1.ILogService)
    ], ExtensionStorageService);
    exports.ExtensionStorageService = ExtensionStorageService;
});
//# sourceMappingURL=extensionStorage.js.map