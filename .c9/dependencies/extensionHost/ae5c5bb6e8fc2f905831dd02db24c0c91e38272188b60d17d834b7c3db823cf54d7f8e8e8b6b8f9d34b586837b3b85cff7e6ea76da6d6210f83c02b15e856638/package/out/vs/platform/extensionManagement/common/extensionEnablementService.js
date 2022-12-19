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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/storage/common/storage"], function (require, exports, event_1, lifecycle_1, types_1, extensionManagement_1, extensionManagementUtil_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageManager = exports.GlobalExtensionEnablementService = void 0;
    let GlobalExtensionEnablementService = class GlobalExtensionEnablementService extends lifecycle_1.Disposable {
        constructor(storageService, extensionManagementService) {
            super();
            this._onDidChangeEnablement = new event_1.Emitter();
            this.onDidChangeEnablement = this._onDidChangeEnablement.event;
            this.storageManger = this._register(new StorageManager(storageService));
            this._register(this.storageManger.onDidChange(extensions => this._onDidChangeEnablement.fire({ extensions, source: 'storage' })));
            this._register(extensionManagementService.onDidInstallExtensions(e => e.forEach(({ local, operation }) => {
                if (local && operation === 4 /* InstallOperation.Migrate */) {
                    this._removeFromDisabledExtensions(local.identifier); /* Reset migrated extensions */
                }
            })));
        }
        async enableExtension(extension, source) {
            if (this._removeFromDisabledExtensions(extension)) {
                this._onDidChangeEnablement.fire({ extensions: [extension], source });
                return true;
            }
            return false;
        }
        async disableExtension(extension, source) {
            if (this._addToDisabledExtensions(extension)) {
                this._onDidChangeEnablement.fire({ extensions: [extension], source });
                return true;
            }
            return false;
        }
        getDisabledExtensions() {
            return this._getExtensions(extensionManagement_1.DISABLED_EXTENSIONS_STORAGE_PATH);
        }
        async getDisabledExtensionsAsync() {
            return this.getDisabledExtensions();
        }
        _addToDisabledExtensions(identifier) {
            let disabledExtensions = this.getDisabledExtensions();
            if (disabledExtensions.every(e => !(0, extensionManagementUtil_1.areSameExtensions)(e, identifier))) {
                disabledExtensions.push(identifier);
                this._setDisabledExtensions(disabledExtensions);
                return true;
            }
            return false;
        }
        _removeFromDisabledExtensions(identifier) {
            let disabledExtensions = this.getDisabledExtensions();
            for (let index = 0; index < disabledExtensions.length; index++) {
                const disabledExtension = disabledExtensions[index];
                if ((0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, identifier)) {
                    disabledExtensions.splice(index, 1);
                    this._setDisabledExtensions(disabledExtensions);
                    return true;
                }
            }
            return false;
        }
        _setDisabledExtensions(disabledExtensions) {
            this._setExtensions(extensionManagement_1.DISABLED_EXTENSIONS_STORAGE_PATH, disabledExtensions);
        }
        _getExtensions(storageId) {
            return this.storageManger.get(storageId, 0 /* StorageScope.GLOBAL */);
        }
        _setExtensions(storageId, extensions) {
            this.storageManger.set(storageId, extensions, 0 /* StorageScope.GLOBAL */);
        }
    };
    GlobalExtensionEnablementService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, extensionManagement_1.IExtensionManagementService)
    ], GlobalExtensionEnablementService);
    exports.GlobalExtensionEnablementService = GlobalExtensionEnablementService;
    class StorageManager extends lifecycle_1.Disposable {
        constructor(storageService) {
            super();
            this.storageService = storageService;
            this.storage = Object.create(null);
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._register(storageService.onDidChangeValue(e => this.onDidStorageChange(e)));
        }
        get(key, scope) {
            let value;
            if (scope === 0 /* StorageScope.GLOBAL */) {
                if ((0, types_1.isUndefinedOrNull)(this.storage[key])) {
                    this.storage[key] = this._get(key, scope);
                }
                value = this.storage[key];
            }
            else {
                value = this._get(key, scope);
            }
            return JSON.parse(value);
        }
        set(key, value, scope) {
            let newValue = JSON.stringify(value.map(({ id, uuid }) => ({ id, uuid })));
            const oldValue = this._get(key, scope);
            if (oldValue !== newValue) {
                if (scope === 0 /* StorageScope.GLOBAL */) {
                    if (value.length) {
                        this.storage[key] = newValue;
                    }
                    else {
                        delete this.storage[key];
                    }
                }
                this._set(key, value.length ? newValue : undefined, scope);
            }
        }
        onDidStorageChange(storageChangeEvent) {
            if (storageChangeEvent.scope === 0 /* StorageScope.GLOBAL */) {
                if (!(0, types_1.isUndefinedOrNull)(this.storage[storageChangeEvent.key])) {
                    const newValue = this._get(storageChangeEvent.key, storageChangeEvent.scope);
                    if (newValue !== this.storage[storageChangeEvent.key]) {
                        const oldValues = this.get(storageChangeEvent.key, storageChangeEvent.scope);
                        delete this.storage[storageChangeEvent.key];
                        const newValues = this.get(storageChangeEvent.key, storageChangeEvent.scope);
                        const added = oldValues.filter(oldValue => !newValues.some(newValue => (0, extensionManagementUtil_1.areSameExtensions)(oldValue, newValue)));
                        const removed = newValues.filter(newValue => !oldValues.some(oldValue => (0, extensionManagementUtil_1.areSameExtensions)(oldValue, newValue)));
                        if (added.length || removed.length) {
                            this._onDidChange.fire([...added, ...removed]);
                        }
                    }
                }
            }
        }
        _get(key, scope) {
            return this.storageService.get(key, scope, '[]');
        }
        _set(key, value, scope) {
            if (value) {
                // Enablement state is synced separately through extensions
                this.storageService.store(key, value, scope, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(key, scope);
            }
        }
    }
    exports.StorageManager = StorageManager;
});
//# sourceMappingURL=extensionEnablementService.js.map