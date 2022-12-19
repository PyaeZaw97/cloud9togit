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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/map", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage"], function (require, exports, lifecycle_1, map_1, configuration_1, instantiation_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalPersistedHistory = exports.getDirectoryHistory = exports.getCommandHistory = void 0;
    var Constants;
    (function (Constants) {
        Constants[Constants["DefaultHistoryLimit"] = 100] = "DefaultHistoryLimit";
    })(Constants || (Constants = {}));
    var StorageKeys;
    (function (StorageKeys) {
        StorageKeys["Entries"] = "terminal.history.entries";
        StorageKeys["Timestamp"] = "terminal.history.timestamp";
    })(StorageKeys || (StorageKeys = {}));
    let commandHistory = undefined;
    function getCommandHistory(accessor) {
        if (!commandHistory) {
            commandHistory = accessor.get(instantiation_1.IInstantiationService).createInstance(TerminalPersistedHistory, 'commands');
        }
        return commandHistory;
    }
    exports.getCommandHistory = getCommandHistory;
    let directoryHistory = undefined;
    function getDirectoryHistory(accessor) {
        if (!directoryHistory) {
            directoryHistory = accessor.get(instantiation_1.IInstantiationService).createInstance(TerminalPersistedHistory, 'dirs');
        }
        return directoryHistory;
    }
    exports.getDirectoryHistory = getDirectoryHistory;
    let TerminalPersistedHistory = class TerminalPersistedHistory extends lifecycle_1.Disposable {
        constructor(_storageDataKey, _configurationService, _storageService) {
            super();
            this._storageDataKey = _storageDataKey;
            this._configurationService = _configurationService;
            this._storageService = _storageService;
            this._timestamp = 0;
            this._isReady = false;
            this._isStale = true;
            // Init cache
            this._entries = new map_1.LRUCache(this._getHistoryLimit());
            // Listen for config changes to set history limit
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.shellIntegration.history" /* TerminalSettingId.ShellIntegrationCommandHistory */)) {
                    this._entries.limit = this._getHistoryLimit();
                }
            });
            // Listen to cache changes from other windows
            this._storageService.onDidChangeValue(e => {
                if (e.key === this._getTimestampStorageKey() && !this._isStale) {
                    this._isStale = this._storageService.getNumber(this._getTimestampStorageKey(), 0 /* StorageScope.GLOBAL */, 0) !== this._timestamp;
                }
            });
        }
        get entries() {
            this._ensureUpToDate();
            return this._entries.entries();
        }
        add(key, value) {
            this._ensureUpToDate();
            this._entries.set(key, value);
            this._saveState();
        }
        remove(key) {
            this._ensureUpToDate();
            this._entries.delete(key);
            this._saveState();
        }
        clear() {
            this._ensureUpToDate();
            this._entries.clear();
            this._saveState();
        }
        _ensureUpToDate() {
            // Initial load
            if (!this._isReady) {
                this._loadState();
                this._isReady = true;
            }
            // React to stale cache caused by another window
            if (this._isStale) {
                // Since state is saved whenever the entries change, it's a safe assumption that no
                // merging of entries needs to happen, just loading the new state.
                this._entries.clear();
                this._loadState();
                this._isStale = false;
            }
        }
        _loadState() {
            this._timestamp = this._storageService.getNumber(this._getTimestampStorageKey(), 0 /* StorageScope.GLOBAL */, 0);
            // Load global entries plus
            const serialized = this._loadPersistedState();
            if (serialized) {
                for (const entry of serialized.entries) {
                    this._entries.set(entry.key, entry.value);
                }
            }
        }
        _loadPersistedState() {
            const raw = this._storageService.get(this._getEntriesStorageKey(), 0 /* StorageScope.GLOBAL */);
            if (raw === undefined || raw.length === 0) {
                return undefined;
            }
            let serialized = undefined;
            try {
                serialized = JSON.parse(raw);
            }
            catch (_a) {
                // Invalid data
                return undefined;
            }
            return serialized;
        }
        _saveState() {
            const serialized = { entries: [] };
            this._entries.forEach((value, key) => serialized.entries.push({ key, value }));
            this._storageService.store(this._getEntriesStorageKey(), JSON.stringify(serialized), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            this._timestamp = Date.now();
            this._storageService.store(this._getTimestampStorageKey(), this._timestamp, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
        _getHistoryLimit() {
            const historyLimit = this._configurationService.getValue("terminal.integrated.shellIntegration.history" /* TerminalSettingId.ShellIntegrationCommandHistory */);
            return typeof historyLimit === 'number' ? historyLimit : 100 /* Constants.DefaultHistoryLimit */;
        }
        _getTimestampStorageKey() {
            return `${"terminal.history.timestamp" /* StorageKeys.Timestamp */}.${this._storageDataKey}`;
        }
        _getEntriesStorageKey() {
            return `${"terminal.history.entries" /* StorageKeys.Entries */}.${this._storageDataKey}`;
        }
    };
    TerminalPersistedHistory = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, storage_1.IStorageService)
    ], TerminalPersistedHistory);
    exports.TerminalPersistedHistory = TerminalPersistedHistory;
});
//# sourceMappingURL=history.js.map