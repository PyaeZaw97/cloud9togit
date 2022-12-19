/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/parts/storage/common/storage", "vs/platform/storage/common/storage", "vs/platform/storage/common/storageIpc"], function (require, exports, async_1, lifecycle_1, resources_1, storage_1, storage_2, storageIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeStorageService = void 0;
    class NativeStorageService extends storage_2.AbstractStorageService {
        constructor(workspace, mainProcessService, environmentService) {
            super();
            this.mainProcessService = mainProcessService;
            this.environmentService = environmentService;
            // Workspace Storage is scoped to a window but can change
            // in the current window, when entering a workspace!
            this.workspaceStorage = undefined;
            this.workspaceStorageId = undefined;
            this.workspaceStorageDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.globalStorage = this.createGlobalStorage();
            this.workspaceStorage = this.createWorkspaceStorage(workspace);
        }
        createGlobalStorage() {
            const storageDataBaseClient = new storageIpc_1.StorageDatabaseChannelClient(this.mainProcessService.getChannel('storage'), undefined);
            const globalStorage = new storage_1.Storage(storageDataBaseClient.globalStorage);
            this._register(globalStorage.onDidChangeStorage(key => this.emitDidChangeValue(0 /* StorageScope.GLOBAL */, key)));
            return globalStorage;
        }
        createWorkspaceStorage(workspace) {
            const storageDataBaseClient = new storageIpc_1.StorageDatabaseChannelClient(this.mainProcessService.getChannel('storage'), workspace);
            if (storageDataBaseClient.workspaceStorage) {
                const workspaceStorage = new storage_1.Storage(storageDataBaseClient.workspaceStorage);
                this.workspaceStorageDisposable.value = workspaceStorage.onDidChangeStorage(key => this.emitDidChangeValue(1 /* StorageScope.WORKSPACE */, key));
                this.workspaceStorageId = workspace === null || workspace === void 0 ? void 0 : workspace.id;
                return workspaceStorage;
            }
            else {
                this.workspaceStorageDisposable.clear();
                this.workspaceStorageId = undefined;
                return undefined;
            }
        }
        async doInitialize() {
            var _a, _b;
            // Init all storage locations
            await async_1.Promises.settled([
                this.globalStorage.init(),
                (_b = (_a = this.workspaceStorage) === null || _a === void 0 ? void 0 : _a.init()) !== null && _b !== void 0 ? _b : Promise.resolve()
            ]);
        }
        getStorage(scope) {
            return scope === 0 /* StorageScope.GLOBAL */ ? this.globalStorage : this.workspaceStorage;
        }
        getLogDetails(scope) {
            return scope === 0 /* StorageScope.GLOBAL */ ? this.environmentService.globalStorageHome.fsPath : this.workspaceStorageId ? `${(0, resources_1.joinPath)(this.environmentService.workspaceStorageHome, this.workspaceStorageId, 'state.vscdb').fsPath}` : undefined;
        }
        async close() {
            var _a, _b;
            // Stop periodic scheduler and idle runner as we now collect state normally
            this.stopFlushWhenIdle();
            // Signal as event so that clients can still store data
            this.emitWillSaveState(storage_2.WillSaveStateReason.SHUTDOWN);
            // Do it
            await async_1.Promises.settled([
                this.globalStorage.close(),
                (_b = (_a = this.workspaceStorage) === null || _a === void 0 ? void 0 : _a.close()) !== null && _b !== void 0 ? _b : Promise.resolve()
            ]);
        }
        async migrate(toWorkspace) {
            var _a;
            // Keep current workspace storage items around to restore
            const oldWorkspaceStorage = this.workspaceStorage;
            const oldItems = (_a = oldWorkspaceStorage === null || oldWorkspaceStorage === void 0 ? void 0 : oldWorkspaceStorage.items) !== null && _a !== void 0 ? _a : new Map();
            // Close current which will change to new workspace storage
            if (oldWorkspaceStorage) {
                await oldWorkspaceStorage.close();
                oldWorkspaceStorage.dispose();
            }
            // Create new workspace storage & init
            this.workspaceStorage = this.createWorkspaceStorage(toWorkspace);
            await this.workspaceStorage.init();
            // Copy over previous keys
            for (const [key, value] of oldItems) {
                this.workspaceStorage.set(key, value);
            }
        }
    }
    exports.NativeStorageService = NativeStorageService;
});
//# sourceMappingURL=storageService.js.map