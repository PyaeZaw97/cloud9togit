/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/performance", "vs/base/common/types", "vs/base/parts/storage/common/storage", "vs/platform/instantiation/common/instantiation"], function (require, exports, async_1, event_1, lifecycle_1, performance_1, types_1, storage_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.logStorage = exports.InMemoryStorageService = exports.AbstractStorageService = exports.StorageTarget = exports.StorageScope = exports.WillSaveStateReason = exports.IStorageService = exports.IS_NEW_KEY = void 0;
    exports.IS_NEW_KEY = '__$__isNewStorageMarker';
    const TARGET_KEY = '__$__targetStorageMarker';
    exports.IStorageService = (0, instantiation_1.createDecorator)('storageService');
    var WillSaveStateReason;
    (function (WillSaveStateReason) {
        /**
         * No specific reason to save state.
         */
        WillSaveStateReason[WillSaveStateReason["NONE"] = 0] = "NONE";
        /**
         * A hint that the workbench is about to shutdown.
         */
        WillSaveStateReason[WillSaveStateReason["SHUTDOWN"] = 1] = "SHUTDOWN";
    })(WillSaveStateReason = exports.WillSaveStateReason || (exports.WillSaveStateReason = {}));
    var StorageScope;
    (function (StorageScope) {
        /**
         * The stored data will be scoped to all workspaces.
         */
        StorageScope[StorageScope["GLOBAL"] = 0] = "GLOBAL";
        /**
         * The stored data will be scoped to the current workspace.
         */
        StorageScope[StorageScope["WORKSPACE"] = 1] = "WORKSPACE";
    })(StorageScope = exports.StorageScope || (exports.StorageScope = {}));
    var StorageTarget;
    (function (StorageTarget) {
        /**
         * The stored data is user specific and applies across machines.
         */
        StorageTarget[StorageTarget["USER"] = 0] = "USER";
        /**
         * The stored data is machine specific.
         */
        StorageTarget[StorageTarget["MACHINE"] = 1] = "MACHINE";
    })(StorageTarget = exports.StorageTarget || (exports.StorageTarget = {}));
    class AbstractStorageService extends lifecycle_1.Disposable {
        constructor(options = { flushInterval: AbstractStorageService.DEFAULT_FLUSH_INTERVAL }) {
            super();
            this.options = options;
            this._onDidChangeValue = this._register(new event_1.PauseableEmitter());
            this.onDidChangeValue = this._onDidChangeValue.event;
            this._onDidChangeTarget = this._register(new event_1.PauseableEmitter());
            this.onDidChangeTarget = this._onDidChangeTarget.event;
            this._onWillSaveState = this._register(new event_1.Emitter());
            this.onWillSaveState = this._onWillSaveState.event;
            this.flushWhenIdleScheduler = this._register(new async_1.RunOnceScheduler(() => this.doFlushWhenIdle(), this.options.flushInterval));
            this.runFlushWhenIdle = this._register(new lifecycle_1.MutableDisposable());
            this._workspaceKeyTargets = undefined;
            this._globalKeyTargets = undefined;
        }
        doFlushWhenIdle() {
            this.runFlushWhenIdle.value = (0, async_1.runWhenIdle)(() => {
                if (this.shouldFlushWhenIdle()) {
                    this.flush();
                }
                // repeat
                this.flushWhenIdleScheduler.schedule();
            });
        }
        shouldFlushWhenIdle() {
            return true;
        }
        stopFlushWhenIdle() {
            (0, lifecycle_1.dispose)([this.runFlushWhenIdle, this.flushWhenIdleScheduler]);
        }
        initialize() {
            if (!this.initializationPromise) {
                this.initializationPromise = (async () => {
                    // Init all storage locations
                    (0, performance_1.mark)('code/willInitStorage');
                    try {
                        // Ask subclasses to initialize storage
                        await this.doInitialize();
                    }
                    finally {
                        (0, performance_1.mark)('code/didInitStorage');
                    }
                    // On some OS we do not get enough time to persist state on shutdown (e.g. when
                    // Windows restarts after applying updates). In other cases, VSCode might crash,
                    // so we periodically save state to reduce the chance of loosing any state.
                    // In the browser we do not have support for long running unload sequences. As such,
                    // we cannot ask for saving state in that moment, because that would result in a
                    // long running operation.
                    // Instead, periodically ask customers to save save. The library will be clever enough
                    // to only save state that has actually changed.
                    this.flushWhenIdleScheduler.schedule();
                })();
            }
            return this.initializationPromise;
        }
        emitDidChangeValue(scope, key) {
            // Specially handle `TARGET_KEY`
            if (key === TARGET_KEY) {
                // Clear our cached version which is now out of date
                if (scope === 0 /* StorageScope.GLOBAL */) {
                    this._globalKeyTargets = undefined;
                }
                else if (scope === 1 /* StorageScope.WORKSPACE */) {
                    this._workspaceKeyTargets = undefined;
                }
                // Emit as `didChangeTarget` event
                this._onDidChangeTarget.fire({ scope });
            }
            // Emit any other key to outside
            else {
                this._onDidChangeValue.fire({ scope, key, target: this.getKeyTargets(scope)[key] });
            }
        }
        emitWillSaveState(reason) {
            this._onWillSaveState.fire({ reason });
        }
        get(key, scope, fallbackValue) {
            var _a;
            return (_a = this.getStorage(scope)) === null || _a === void 0 ? void 0 : _a.get(key, fallbackValue);
        }
        getBoolean(key, scope, fallbackValue) {
            var _a;
            return (_a = this.getStorage(scope)) === null || _a === void 0 ? void 0 : _a.getBoolean(key, fallbackValue);
        }
        getNumber(key, scope, fallbackValue) {
            var _a;
            return (_a = this.getStorage(scope)) === null || _a === void 0 ? void 0 : _a.getNumber(key, fallbackValue);
        }
        store(key, value, scope, target) {
            // We remove the key for undefined/null values
            if ((0, types_1.isUndefinedOrNull)(value)) {
                this.remove(key, scope);
                return;
            }
            // Update our datastructures but send events only after
            this.withPausedEmitters(() => {
                var _a;
                // Update key-target map
                this.updateKeyTarget(key, scope, target);
                // Store actual value
                (_a = this.getStorage(scope)) === null || _a === void 0 ? void 0 : _a.set(key, value);
            });
        }
        remove(key, scope) {
            // Update our datastructures but send events only after
            this.withPausedEmitters(() => {
                var _a;
                // Update key-target map
                this.updateKeyTarget(key, scope, undefined);
                // Remove actual key
                (_a = this.getStorage(scope)) === null || _a === void 0 ? void 0 : _a.delete(key);
            });
        }
        withPausedEmitters(fn) {
            // Pause emitters
            this._onDidChangeValue.pause();
            this._onDidChangeTarget.pause();
            try {
                fn();
            }
            finally {
                // Resume emitters
                this._onDidChangeValue.resume();
                this._onDidChangeTarget.resume();
            }
        }
        keys(scope, target) {
            const keys = [];
            const keyTargets = this.getKeyTargets(scope);
            for (const key of Object.keys(keyTargets)) {
                const keyTarget = keyTargets[key];
                if (keyTarget === target) {
                    keys.push(key);
                }
            }
            return keys;
        }
        updateKeyTarget(key, scope, target) {
            var _a, _b;
            // Add
            const keyTargets = this.getKeyTargets(scope);
            if (typeof target === 'number') {
                if (keyTargets[key] !== target) {
                    keyTargets[key] = target;
                    (_a = this.getStorage(scope)) === null || _a === void 0 ? void 0 : _a.set(TARGET_KEY, JSON.stringify(keyTargets));
                }
            }
            // Remove
            else {
                if (typeof keyTargets[key] === 'number') {
                    delete keyTargets[key];
                    (_b = this.getStorage(scope)) === null || _b === void 0 ? void 0 : _b.set(TARGET_KEY, JSON.stringify(keyTargets));
                }
            }
        }
        get workspaceKeyTargets() {
            if (!this._workspaceKeyTargets) {
                this._workspaceKeyTargets = this.loadKeyTargets(1 /* StorageScope.WORKSPACE */);
            }
            return this._workspaceKeyTargets;
        }
        get globalKeyTargets() {
            if (!this._globalKeyTargets) {
                this._globalKeyTargets = this.loadKeyTargets(0 /* StorageScope.GLOBAL */);
            }
            return this._globalKeyTargets;
        }
        getKeyTargets(scope) {
            return scope === 0 /* StorageScope.GLOBAL */ ? this.globalKeyTargets : this.workspaceKeyTargets;
        }
        loadKeyTargets(scope) {
            const keysRaw = this.get(TARGET_KEY, scope);
            if (keysRaw) {
                try {
                    return JSON.parse(keysRaw);
                }
                catch (error) {
                    // Fail gracefully
                }
            }
            return Object.create(null);
        }
        isNew(scope) {
            return this.getBoolean(exports.IS_NEW_KEY, scope) === true;
        }
        async flush(reason = WillSaveStateReason.NONE) {
            var _a, _b, _c, _d;
            // Signal event to collect changes
            this._onWillSaveState.fire({ reason });
            const globalStorage = this.getStorage(0 /* StorageScope.GLOBAL */);
            const workspaceStorage = this.getStorage(1 /* StorageScope.WORKSPACE */);
            switch (reason) {
                // Unspecific reason: just wait when data is flushed
                case WillSaveStateReason.NONE:
                    await async_1.Promises.settled([
                        (_a = globalStorage === null || globalStorage === void 0 ? void 0 : globalStorage.whenFlushed()) !== null && _a !== void 0 ? _a : Promise.resolve(),
                        (_b = workspaceStorage === null || workspaceStorage === void 0 ? void 0 : workspaceStorage.whenFlushed()) !== null && _b !== void 0 ? _b : Promise.resolve()
                    ]);
                    break;
                // Shutdown: we want to flush as soon as possible
                // and not hit any delays that might be there
                case WillSaveStateReason.SHUTDOWN:
                    await async_1.Promises.settled([
                        (_c = globalStorage === null || globalStorage === void 0 ? void 0 : globalStorage.flush(0)) !== null && _c !== void 0 ? _c : Promise.resolve(),
                        (_d = workspaceStorage === null || workspaceStorage === void 0 ? void 0 : workspaceStorage.flush(0)) !== null && _d !== void 0 ? _d : Promise.resolve()
                    ]);
                    break;
            }
        }
        async logStorage() {
            var _a, _b, _c, _d, _e, _f;
            const globalItems = (_b = (_a = this.getStorage(0 /* StorageScope.GLOBAL */)) === null || _a === void 0 ? void 0 : _a.items) !== null && _b !== void 0 ? _b : new Map();
            const workspaceItems = (_d = (_c = this.getStorage(1 /* StorageScope.WORKSPACE */)) === null || _c === void 0 ? void 0 : _c.items) !== null && _d !== void 0 ? _d : new Map();
            return logStorage(globalItems, workspaceItems, (_e = this.getLogDetails(0 /* StorageScope.GLOBAL */)) !== null && _e !== void 0 ? _e : '', (_f = this.getLogDetails(1 /* StorageScope.WORKSPACE */)) !== null && _f !== void 0 ? _f : '');
        }
    }
    exports.AbstractStorageService = AbstractStorageService;
    AbstractStorageService.DEFAULT_FLUSH_INTERVAL = 60 * 1000; // every minute
    class InMemoryStorageService extends AbstractStorageService {
        constructor() {
            super();
            this.globalStorage = this._register(new storage_1.Storage(new storage_1.InMemoryStorageDatabase()));
            this.workspaceStorage = this._register(new storage_1.Storage(new storage_1.InMemoryStorageDatabase()));
            this._register(this.workspaceStorage.onDidChangeStorage(key => this.emitDidChangeValue(1 /* StorageScope.WORKSPACE */, key)));
            this._register(this.globalStorage.onDidChangeStorage(key => this.emitDidChangeValue(0 /* StorageScope.GLOBAL */, key)));
        }
        getStorage(scope) {
            return scope === 0 /* StorageScope.GLOBAL */ ? this.globalStorage : this.workspaceStorage;
        }
        getLogDetails(scope) {
            return scope === 0 /* StorageScope.GLOBAL */ ? 'inMemory (global)' : 'inMemory (workspace)';
        }
        async doInitialize() { }
        async migrate(toWorkspace) {
            // not supported
        }
    }
    exports.InMemoryStorageService = InMemoryStorageService;
    async function logStorage(global, workspace, globalPath, workspacePath) {
        const safeParse = (value) => {
            try {
                return JSON.parse(value);
            }
            catch (error) {
                return value;
            }
        };
        const globalItems = new Map();
        const globalItemsParsed = new Map();
        global.forEach((value, key) => {
            globalItems.set(key, value);
            globalItemsParsed.set(key, safeParse(value));
        });
        const workspaceItems = new Map();
        const workspaceItemsParsed = new Map();
        workspace.forEach((value, key) => {
            workspaceItems.set(key, value);
            workspaceItemsParsed.set(key, safeParse(value));
        });
        console.group(`Storage: Global (path: ${globalPath})`);
        let globalValues = [];
        globalItems.forEach((value, key) => {
            globalValues.push({ key, value });
        });
        console.table(globalValues);
        console.groupEnd();
        console.log(globalItemsParsed);
        console.group(`Storage: Workspace (path: ${workspacePath})`);
        let workspaceValues = [];
        workspaceItems.forEach((value, key) => {
            workspaceValues.push({ key, value });
        });
        console.table(workspaceValues);
        console.groupEnd();
        console.log(workspaceItemsParsed);
    }
    exports.logStorage = logStorage;
});
//# sourceMappingURL=storage.js.map