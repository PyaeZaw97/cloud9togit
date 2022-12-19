/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/stopwatch", "vs/base/common/uri", "vs/base/node/pfs", "vs/base/parts/storage/common/storage", "vs/base/parts/storage/node/storage", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace"], function (require, exports, arrays_1, async_1, event_1, lifecycle_1, path_1, stopwatch_1, uri_1, pfs_1, storage_1, storage_2, log_1, storage_3, telemetry_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InMemoryStorageMain = exports.WorkspaceStorageMain = exports.GlobalStorageMain = void 0;
    class BaseStorageMain extends lifecycle_1.Disposable {
        constructor(logService, fileService, telemetryService) {
            super();
            this.logService = logService;
            this.fileService = fileService;
            this.telemetryService = telemetryService;
            this._onDidChangeStorage = this._register(new event_1.Emitter());
            this.onDidChangeStorage = this._onDidChangeStorage.event;
            this._onDidCloseStorage = this._register(new event_1.Emitter());
            this.onDidCloseStorage = this._onDidCloseStorage.event;
            this._storage = new storage_1.Storage(new storage_1.InMemoryStorageDatabase()); // storage is in-memory until initialized
            this.initializePromise = undefined;
            this.whenInitPromise = new async_1.DeferredPromise();
            this.whenInit = this.whenInitPromise.p;
            this.state = storage_1.StorageState.None;
        }
        get storage() { return this._storage; }
        init() {
            if (!this.initializePromise) {
                this.initializePromise = (async () => {
                    if (this.state !== storage_1.StorageState.None) {
                        return; // either closed or already initialized
                    }
                    try {
                        // Create storage via subclasses
                        const storage = await this.doCreate();
                        // Replace our in-memory storage with the real
                        // once as soon as possible without awaiting
                        // the init call.
                        this._storage.dispose();
                        this._storage = storage;
                        // Re-emit storage changes via event
                        this._register(storage.onDidChangeStorage(key => this._onDidChangeStorage.fire({ key })));
                        // Await storage init
                        await this.doInit(storage);
                        // Ensure we track wether storage is new or not
                        const isNewStorage = storage.getBoolean(storage_3.IS_NEW_KEY);
                        if (isNewStorage === undefined) {
                            storage.set(storage_3.IS_NEW_KEY, true);
                        }
                        else if (isNewStorage) {
                            storage.set(storage_3.IS_NEW_KEY, false);
                        }
                    }
                    catch (error) {
                        this.logService.error(`[storage main] initialize(): Unable to init storage due to ${error}`);
                    }
                    finally {
                        // Update state
                        this.state = storage_1.StorageState.Initialized;
                        // Mark init promise as completed
                        this.whenInitPromise.complete();
                    }
                })();
            }
            return this.initializePromise;
        }
        createLoggingOptions() {
            return {
                logTrace: (this.logService.getLevel() === log_1.LogLevel.Trace) ? msg => this.logService.trace(msg) : undefined,
                logError: error => this.logService.error(error)
            };
        }
        doInit(storage) {
            return storage.init();
        }
        get items() { return this._storage.items; }
        get(key, fallbackValue) {
            return this._storage.get(key, fallbackValue);
        }
        set(key, value) {
            return this._storage.set(key, value);
        }
        delete(key) {
            return this._storage.delete(key);
        }
        async close() {
            // Measure how long it takes to close storage
            const watch = new stopwatch_1.StopWatch(false);
            await this.doClose();
            watch.stop();
            // If close() is taking a long time, there is
            // a chance that the underlying DB is large
            // either on disk or in general. In that case
            // log some additional info to further diagnose
            if (watch.elapsed() > BaseStorageMain.LOG_SLOW_CLOSE_THRESHOLD) {
                await this.logSlowClose(watch);
            }
            // Signal as event
            this._onDidCloseStorage.fire();
        }
        async logSlowClose(watch) {
            if (!this.path) {
                return;
            }
            try {
                const largestEntries = (0, arrays_1.top)(Array.from(this._storage.items.entries())
                    .map(([key, value]) => ({ key, length: value.length })), (entryA, entryB) => entryB.length - entryA.length, 5)
                    .map(entry => `${entry.key}:${entry.length}`).join(', ');
                const dbSize = (await this.fileService.stat(uri_1.URI.file(this.path))).size;
                this.logService.warn(`[storage main] detected slow close() operation: Time: ${watch.elapsed()}ms, DB size: ${dbSize}b, Large Keys: ${largestEntries}`);
                this.telemetryService.publicLog2('storageSlowClose', {
                    duration: watch.elapsed(),
                    size: dbSize,
                    largestEntries
                });
            }
            catch (error) {
                this.logService.error('[storage main] figuring out stats for slow DB on close() resulted in an error', error);
            }
        }
        async doClose() {
            // Ensure we are not accidentally leaving
            // a pending initialized storage behind in
            // case `close()` was called before `init()`
            // finishes.
            if (this.initializePromise) {
                await this.initializePromise;
            }
            // Update state
            this.state = storage_1.StorageState.Closed;
            // Propagate to storage lib
            await this._storage.close();
        }
    }
    BaseStorageMain.LOG_SLOW_CLOSE_THRESHOLD = 300;
    class GlobalStorageMain extends BaseStorageMain {
        constructor(options, logService, environmentService, fileService, telemetryService) {
            super(logService, fileService, telemetryService);
            this.options = options;
            this.environmentService = environmentService;
        }
        get path() {
            if (!this.options.useInMemoryStorage) {
                return (0, path_1.join)(this.environmentService.globalStorageHome.fsPath, GlobalStorageMain.STORAGE_NAME);
            }
            return undefined;
        }
        async doCreate() {
            var _a;
            return new storage_1.Storage(new storage_2.SQLiteStorageDatabase((_a = this.path) !== null && _a !== void 0 ? _a : storage_2.SQLiteStorageDatabase.IN_MEMORY_PATH, {
                logging: this.createLoggingOptions()
            }));
        }
        async doInit(storage) {
            await super.doInit(storage);
            // Apply global telemetry values as part of the initialization
            this.updateTelemetryState(storage);
        }
        updateTelemetryState(storage) {
            // First session date (once)
            const firstSessionDate = storage.get(telemetry_1.firstSessionDateStorageKey, undefined);
            if (firstSessionDate === undefined) {
                storage.set(telemetry_1.firstSessionDateStorageKey, new Date().toUTCString());
            }
            // Last / current session (always)
            // previous session date was the "current" one at that time
            // current session date is "now"
            const lastSessionDate = storage.get(telemetry_1.currentSessionDateStorageKey, undefined);
            const currentSessionDate = new Date().toUTCString();
            storage.set(telemetry_1.lastSessionDateStorageKey, typeof lastSessionDate === 'undefined' ? null : lastSessionDate);
            storage.set(telemetry_1.currentSessionDateStorageKey, currentSessionDate);
        }
    }
    exports.GlobalStorageMain = GlobalStorageMain;
    GlobalStorageMain.STORAGE_NAME = 'state.vscdb';
    class WorkspaceStorageMain extends BaseStorageMain {
        constructor(workspace, options, logService, environmentService, fileService, telemetryService) {
            super(logService, fileService, telemetryService);
            this.workspace = workspace;
            this.options = options;
            this.environmentService = environmentService;
        }
        get path() {
            if (!this.options.useInMemoryStorage) {
                return (0, path_1.join)(this.environmentService.workspaceStorageHome.fsPath, this.workspace.id, WorkspaceStorageMain.WORKSPACE_STORAGE_NAME);
            }
            return undefined;
        }
        async doCreate() {
            const { storageFilePath, wasCreated } = await this.prepareWorkspaceStorageFolder();
            return new storage_1.Storage(new storage_2.SQLiteStorageDatabase(storageFilePath, {
                logging: this.createLoggingOptions()
            }), { hint: wasCreated ? storage_1.StorageHint.STORAGE_DOES_NOT_EXIST : undefined });
        }
        async prepareWorkspaceStorageFolder() {
            // Return early if using inMemory storage
            if (this.options.useInMemoryStorage) {
                return { storageFilePath: storage_2.SQLiteStorageDatabase.IN_MEMORY_PATH, wasCreated: true };
            }
            // Otherwise, ensure the storage folder exists on disk
            const workspaceStorageFolderPath = (0, path_1.join)(this.environmentService.workspaceStorageHome.fsPath, this.workspace.id);
            const workspaceStorageDatabasePath = (0, path_1.join)(workspaceStorageFolderPath, WorkspaceStorageMain.WORKSPACE_STORAGE_NAME);
            const storageExists = await pfs_1.Promises.exists(workspaceStorageFolderPath);
            if (storageExists) {
                return { storageFilePath: workspaceStorageDatabasePath, wasCreated: false };
            }
            // Ensure storage folder exists
            await pfs_1.Promises.mkdir(workspaceStorageFolderPath, { recursive: true });
            // Write metadata into folder (but do not await)
            this.ensureWorkspaceStorageFolderMeta(workspaceStorageFolderPath);
            return { storageFilePath: workspaceStorageDatabasePath, wasCreated: true };
        }
        async ensureWorkspaceStorageFolderMeta(workspaceStorageFolderPath) {
            let meta = undefined;
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(this.workspace)) {
                meta = { folder: this.workspace.uri.toString() };
            }
            else if ((0, workspace_1.isWorkspaceIdentifier)(this.workspace)) {
                meta = { workspace: this.workspace.configPath.toString() };
            }
            if (meta) {
                try {
                    const workspaceStorageMetaPath = (0, path_1.join)(workspaceStorageFolderPath, WorkspaceStorageMain.WORKSPACE_META_NAME);
                    const storageExists = await pfs_1.Promises.exists(workspaceStorageMetaPath);
                    if (!storageExists) {
                        await pfs_1.Promises.writeFile(workspaceStorageMetaPath, JSON.stringify(meta, undefined, 2));
                    }
                }
                catch (error) {
                    this.logService.error(`[storage main] ensureWorkspaceStorageFolderMeta(): Unable to create workspace storage metadata due to ${error}`);
                }
            }
        }
    }
    exports.WorkspaceStorageMain = WorkspaceStorageMain;
    WorkspaceStorageMain.WORKSPACE_STORAGE_NAME = 'state.vscdb';
    WorkspaceStorageMain.WORKSPACE_META_NAME = 'workspace.json';
    class InMemoryStorageMain extends BaseStorageMain {
        get path() {
            return undefined; // in-memory has no path
        }
        async doCreate() {
            return new storage_1.Storage(new storage_1.InMemoryStorageDatabase());
        }
    }
    exports.InMemoryStorageMain = InMemoryStorageMain;
});
//# sourceMappingURL=storageMain.js.map