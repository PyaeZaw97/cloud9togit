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
define(["require", "exports", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/lifecycle/electron-main/lifecycleMainService", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/storage/electron-main/storageMain", "vs/platform/telemetry/common/telemetry"], function (require, exports, functional_1, lifecycle_1, environment_1, environmentMainService_1, files_1, instantiation_1, lifecycleMainService_1, log_1, storage_1, storageMain_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlobalStorageMainService = exports.IGlobalStorageMainService = exports.StorageMainService = exports.IStorageMainService = void 0;
    //#region Storage Main Service (intent: make global and workspace storage accessible to windows from main process)
    exports.IStorageMainService = (0, instantiation_1.createDecorator)('storageMainService');
    let StorageMainService = class StorageMainService extends lifecycle_1.Disposable {
        constructor(logService, environmentService, lifecycleMainService, fileService, telemetryService) {
            super();
            this.logService = logService;
            this.environmentService = environmentService;
            this.lifecycleMainService = lifecycleMainService;
            this.fileService = fileService;
            this.telemetryService = telemetryService;
            this.shutdownReason = undefined;
            //#region Global Storage
            this.globalStorage = this.createGlobalStorage();
            //#endregion
            //#region Workspace Storage
            this.mapWorkspaceToStorage = new Map();
            this.registerListeners();
        }
        getStorageOptions() {
            return {
                useInMemoryStorage: !!this.environmentService.extensionTestsLocationURI // no storage during extension tests!
            };
        }
        registerListeners() {
            // Global Storage: Warmup when any window opens
            (async () => {
                await this.lifecycleMainService.when(3 /* LifecycleMainPhase.AfterWindowOpen */);
                this.globalStorage.init();
            })();
            // Workspace Storage: Warmup when related window with workspace loads
            this._register(this.lifecycleMainService.onWillLoadWindow(e => {
                if (e.workspace) {
                    this.workspaceStorage(e.workspace).init();
                }
            }));
            // All Storage: Close when shutting down
            this._register(this.lifecycleMainService.onWillShutdown(e => {
                this.logService.trace('storageMainService#onWillShutdown()');
                // Remember shutdown reason
                this.shutdownReason = e.reason;
                // Global Storage
                e.join(this.globalStorage.close());
                // Workspace Storage(s)
                for (const [, storage] of this.mapWorkspaceToStorage) {
                    e.join(storage.close());
                }
            }));
        }
        createGlobalStorage() {
            this.logService.trace(`StorageMainService: creating global storage`);
            const globalStorage = new storageMain_1.GlobalStorageMain(this.getStorageOptions(), this.logService, this.environmentService, this.fileService, this.telemetryService);
            (0, functional_1.once)(globalStorage.onDidCloseStorage)(() => {
                this.logService.trace(`StorageMainService: closed global storage`);
            });
            return globalStorage;
        }
        workspaceStorage(workspace) {
            let workspaceStorage = this.mapWorkspaceToStorage.get(workspace.id);
            if (!workspaceStorage) {
                this.logService.trace(`StorageMainService: creating workspace storage (${workspace.id})`);
                workspaceStorage = this.createWorkspaceStorage(workspace);
                this.mapWorkspaceToStorage.set(workspace.id, workspaceStorage);
                (0, functional_1.once)(workspaceStorage.onDidCloseStorage)(() => {
                    this.logService.trace(`StorageMainService: closed workspace storage (${workspace.id})`);
                    this.mapWorkspaceToStorage.delete(workspace.id);
                });
            }
            return workspaceStorage;
        }
        createWorkspaceStorage(workspace) {
            if (this.shutdownReason === 2 /* ShutdownReason.KILL */) {
                // Workaround for native crashes that we see when
                // SQLite DBs are being created even after shutdown
                // https://github.com/microsoft/vscode/issues/143186
                return new storageMain_1.InMemoryStorageMain(this.logService, this.fileService, this.telemetryService);
            }
            return new storageMain_1.WorkspaceStorageMain(workspace, this.getStorageOptions(), this.logService, this.environmentService, this.fileService, this.telemetryService);
        }
    };
    StorageMainService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, lifecycleMainService_1.ILifecycleMainService),
        __param(3, files_1.IFileService),
        __param(4, telemetry_1.ITelemetryService)
    ], StorageMainService);
    exports.StorageMainService = StorageMainService;
    //#endregion
    //#region Global Main Storage Service (intent: use global storage from main process)
    exports.IGlobalStorageMainService = (0, instantiation_1.createDecorator)('globalStorageMainService');
    let GlobalStorageMainService = class GlobalStorageMainService extends storage_1.AbstractStorageService {
        constructor(environmentMainService, storageMainService) {
            super();
            this.environmentMainService = environmentMainService;
            this.storageMainService = storageMainService;
            this.whenReady = this.storageMainService.globalStorage.whenInit;
        }
        doInitialize() {
            // global storage is being initialized as part
            // of the first window opening, so we do not
            // trigger it here but can join it
            return this.storageMainService.globalStorage.whenInit;
        }
        getStorage(scope) {
            switch (scope) {
                case 0 /* StorageScope.GLOBAL */:
                    return this.storageMainService.globalStorage.storage;
                case 1 /* StorageScope.WORKSPACE */:
                    return undefined; // unsupported from main process
            }
        }
        getLogDetails(scope) {
            return scope === 0 /* StorageScope.GLOBAL */ ? this.environmentMainService.globalStorageHome.fsPath : undefined;
        }
        shouldFlushWhenIdle() {
            return false; // not needed here, will be triggered from any window that is opened
        }
        migrate() {
            throw new Error('Migrating storage is unsupported from main process');
        }
    };
    GlobalStorageMainService = __decorate([
        __param(0, environmentMainService_1.IEnvironmentMainService),
        __param(1, exports.IStorageMainService)
    ], GlobalStorageMainService);
    exports.GlobalStorageMainService = GlobalStorageMainService;
});
//# sourceMappingURL=storageMainService.js.map