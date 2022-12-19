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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/indexedDB", "vs/base/common/async", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/parts/storage/common/storage", "vs/platform/log/common/log", "vs/platform/storage/common/storage"], function (require, exports, browser_1, indexedDB_1, async_1, errorMessage_1, event_1, lifecycle_1, storage_1, log_1, storage_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexedDBStorageDatabase = exports.BrowserStorageService = void 0;
    let BrowserStorageService = class BrowserStorageService extends storage_2.AbstractStorageService {
        constructor(payload, logService) {
            super({ flushInterval: BrowserStorageService.BROWSER_DEFAULT_FLUSH_INTERVAL });
            this.payload = payload;
            this.logService = logService;
        }
        get hasPendingUpdate() {
            var _a, _b;
            return Boolean(((_a = this.globalStorageDatabase) === null || _a === void 0 ? void 0 : _a.hasPendingUpdate) || ((_b = this.workspaceStorageDatabase) === null || _b === void 0 ? void 0 : _b.hasPendingUpdate));
        }
        getId(scope) {
            return scope === 0 /* StorageScope.GLOBAL */ ? 'global' : this.payload.id;
        }
        async doInitialize() {
            // Create Storage in Parallel
            const [workspaceStorageDatabase, globalStorageDatabase] = await async_1.Promises.settled([
                IndexedDBStorageDatabase.create({ id: this.getId(1 /* StorageScope.WORKSPACE */) }, this.logService),
                IndexedDBStorageDatabase.create({ id: this.getId(0 /* StorageScope.GLOBAL */), broadcastChanges: true /* only for global storage */ }, this.logService)
            ]);
            // Workspace Storage
            this.workspaceStorageDatabase = this._register(workspaceStorageDatabase);
            this.workspaceStorage = this._register(new storage_1.Storage(this.workspaceStorageDatabase));
            this._register(this.workspaceStorage.onDidChangeStorage(key => this.emitDidChangeValue(1 /* StorageScope.WORKSPACE */, key)));
            // Global Storage
            this.globalStorageDatabase = this._register(globalStorageDatabase);
            this.globalStorage = this._register(new storage_1.Storage(this.globalStorageDatabase));
            this._register(this.globalStorage.onDidChangeStorage(key => this.emitDidChangeValue(0 /* StorageScope.GLOBAL */, key)));
            // Init both
            await async_1.Promises.settled([
                this.workspaceStorage.init(),
                this.globalStorage.init()
            ]);
            // Check to see if this is the first time we are "opening" the application
            const firstOpen = this.globalStorage.getBoolean(storage_2.IS_NEW_KEY);
            if (firstOpen === undefined) {
                this.globalStorage.set(storage_2.IS_NEW_KEY, true);
            }
            else if (firstOpen) {
                this.globalStorage.set(storage_2.IS_NEW_KEY, false);
            }
            // Check to see if this is the first time we are "opening" this workspace
            const firstWorkspaceOpen = this.workspaceStorage.getBoolean(storage_2.IS_NEW_KEY);
            if (firstWorkspaceOpen === undefined) {
                this.workspaceStorage.set(storage_2.IS_NEW_KEY, true);
            }
            else if (firstWorkspaceOpen) {
                this.workspaceStorage.set(storage_2.IS_NEW_KEY, false);
            }
        }
        getStorage(scope) {
            return scope === 0 /* StorageScope.GLOBAL */ ? this.globalStorage : this.workspaceStorage;
        }
        getLogDetails(scope) {
            return this.getId(scope);
        }
        async migrate(toWorkspace) {
            throw new Error('Migrating storage is currently unsupported in Web');
        }
        shouldFlushWhenIdle() {
            // this flush() will potentially cause new state to be stored
            // since new state will only be created while the document
            // has focus, one optimization is to not run this when the
            // document has no focus, assuming that state has not changed
            //
            // another optimization is to not collect more state if we
            // have a pending update already running which indicates
            // that the connection is either slow or disconnected and
            // thus unhealthy.
            return document.hasFocus() && !this.hasPendingUpdate;
        }
        close() {
            var _a, _b;
            // Safari: there is an issue where the page can hang on load when
            // a previous session has kept IndexedDB transactions running.
            // The only fix seems to be to cancel any pending transactions
            // (https://github.com/microsoft/vscode/issues/136295)
            //
            // On all other browsers, we keep the databases opened because
            // we expect data to be written when the unload happens.
            if (browser_1.isSafari) {
                (_a = this.globalStorageDatabase) === null || _a === void 0 ? void 0 : _a.close();
                (_b = this.workspaceStorageDatabase) === null || _b === void 0 ? void 0 : _b.close();
            }
            // Always dispose to ensure that no timeouts or callbacks
            // get triggered in this phase.
            this.dispose();
        }
        async clear() {
            var _a, _b, _c, _d, _e;
            // Clear key/values
            for (const scope of [0 /* StorageScope.GLOBAL */, 1 /* StorageScope.WORKSPACE */]) {
                for (const target of [0 /* StorageTarget.USER */, 1 /* StorageTarget.MACHINE */]) {
                    for (const key of this.keys(scope, target)) {
                        this.remove(key, scope);
                    }
                }
                await ((_a = this.getStorage(scope)) === null || _a === void 0 ? void 0 : _a.whenFlushed());
            }
            // Clear databases
            await async_1.Promises.settled([
                (_c = (_b = this.globalStorageDatabase) === null || _b === void 0 ? void 0 : _b.clear()) !== null && _c !== void 0 ? _c : Promise.resolve(),
                (_e = (_d = this.workspaceStorageDatabase) === null || _d === void 0 ? void 0 : _d.clear()) !== null && _e !== void 0 ? _e : Promise.resolve()
            ]);
        }
    };
    BrowserStorageService.BROWSER_DEFAULT_FLUSH_INTERVAL = 5 * 1000; // every 5s because async operations are not permitted on shutdown
    BrowserStorageService = __decorate([
        __param(1, log_1.ILogService)
    ], BrowserStorageService);
    exports.BrowserStorageService = BrowserStorageService;
    class InMemoryIndexedDBStorageDatabase extends storage_1.InMemoryStorageDatabase {
        constructor() {
            super(...arguments);
            this.hasPendingUpdate = false;
        }
        async clear() {
            (await this.getItems()).clear();
        }
        dispose() {
            // No-op
        }
    }
    class IndexedDBStorageDatabase extends lifecycle_1.Disposable {
        constructor(options, logService) {
            super();
            this.logService = logService;
            this._onDidChangeItemsExternal = this._register(new event_1.Emitter());
            this.onDidChangeItemsExternal = this._onDidChangeItemsExternal.event;
            this.pendingUpdate = undefined;
            this.name = `${IndexedDBStorageDatabase.STORAGE_DATABASE_PREFIX}${options.id}`;
            this.broadcastChannel = options.broadcastChanges && ('BroadcastChannel' in window) ? new BroadcastChannel(IndexedDBStorageDatabase.STORAGE_BROADCAST_CHANNEL) : undefined;
            this.whenConnected = this.connect();
            this.registerListeners();
        }
        static async create(options, logService) {
            try {
                const database = new IndexedDBStorageDatabase(options, logService);
                await database.whenConnected;
                return database;
            }
            catch (error) {
                logService.error(`[IndexedDB Storage ${options.id}] create(): ${(0, errorMessage_1.toErrorMessage)(error, true)}`);
                return new InMemoryIndexedDBStorageDatabase();
            }
        }
        get hasPendingUpdate() { return !!this.pendingUpdate; }
        registerListeners() {
            // Check for global storage change events from other
            // windows/tabs via `BroadcastChannel` mechanisms.
            if (this.broadcastChannel) {
                const listener = (event) => {
                    if ((0, storage_1.isStorageItemsChangeEvent)(event.data)) {
                        this._onDidChangeItemsExternal.fire(event.data);
                    }
                };
                this.broadcastChannel.addEventListener('message', listener);
                this._register((0, lifecycle_1.toDisposable)(() => {
                    var _a, _b;
                    (_a = this.broadcastChannel) === null || _a === void 0 ? void 0 : _a.removeEventListener('message', listener);
                    (_b = this.broadcastChannel) === null || _b === void 0 ? void 0 : _b.close();
                }));
            }
        }
        async connect() {
            try {
                return await indexedDB_1.IndexedDB.create(this.name, undefined, [IndexedDBStorageDatabase.STORAGE_OBJECT_STORE]);
            }
            catch (error) {
                this.logService.error(`[IndexedDB Storage ${this.name}] connect() error: ${(0, errorMessage_1.toErrorMessage)(error)}`);
                throw error;
            }
        }
        async getItems() {
            const db = await this.whenConnected;
            function isValid(value) {
                return typeof value === 'string';
            }
            return db.getKeyValues(IndexedDBStorageDatabase.STORAGE_OBJECT_STORE, isValid);
        }
        async updateItems(request) {
            // Run the update
            let didUpdate = false;
            this.pendingUpdate = this.doUpdateItems(request);
            try {
                didUpdate = await this.pendingUpdate;
            }
            finally {
                this.pendingUpdate = undefined;
            }
            // Broadcast changes to other windows/tabs if enabled
            // and only if we actually did update storage items.
            if (this.broadcastChannel && didUpdate) {
                const event = {
                    changed: request.insert,
                    deleted: request.delete
                };
                this.broadcastChannel.postMessage(event);
            }
        }
        async doUpdateItems(request) {
            // Return early if the request is empty
            const toInsert = request.insert;
            const toDelete = request.delete;
            if ((!toInsert && !toDelete) || ((toInsert === null || toInsert === void 0 ? void 0 : toInsert.size) === 0 && (toDelete === null || toDelete === void 0 ? void 0 : toDelete.size) === 0)) {
                return false;
            }
            const db = await this.whenConnected;
            // Update `ItemTable` with inserts and/or deletes
            await db.runInTransaction(IndexedDBStorageDatabase.STORAGE_OBJECT_STORE, 'readwrite', objectStore => {
                const requests = [];
                // Inserts
                if (toInsert) {
                    for (const [key, value] of toInsert) {
                        requests.push(objectStore.put(value, key));
                    }
                }
                // Deletes
                if (toDelete) {
                    for (const key of toDelete) {
                        requests.push(objectStore.delete(key));
                    }
                }
                return requests;
            });
            return true;
        }
        async close() {
            const db = await this.whenConnected;
            // Wait for pending updates to having finished
            await this.pendingUpdate;
            // Finally, close IndexedDB
            return db.close();
        }
        async clear() {
            const db = await this.whenConnected;
            await db.runInTransaction(IndexedDBStorageDatabase.STORAGE_OBJECT_STORE, 'readwrite', objectStore => objectStore.clear());
        }
    }
    exports.IndexedDBStorageDatabase = IndexedDBStorageDatabase;
    IndexedDBStorageDatabase.STORAGE_DATABASE_PREFIX = 'vscode-web-state-db-';
    IndexedDBStorageDatabase.STORAGE_OBJECT_STORE = 'ItemTable';
    IndexedDBStorageDatabase.STORAGE_BROADCAST_CHANNEL = 'vscode.web.state.changes';
});
//# sourceMappingURL=storageService.js.map