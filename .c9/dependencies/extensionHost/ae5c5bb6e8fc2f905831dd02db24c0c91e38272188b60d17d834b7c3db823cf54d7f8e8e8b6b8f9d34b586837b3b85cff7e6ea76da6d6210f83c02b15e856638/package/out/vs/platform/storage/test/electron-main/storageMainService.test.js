/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/event", "vs/base/common/uuid", "vs/platform/environment/node/argv", "vs/platform/environment/node/environmentService", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/storage/common/storage", "vs/platform/storage/electron-main/storageMainService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, assert_1, async_1, event_1, uuid_1, argv_1, environmentService_1, fileService_1, log_1, product_1, storage_1, storageMainService_1, telemetry_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('StorageMainService', function () {
        const productService = Object.assign({ _serviceBrand: undefined }, product_1.default);
        class TestStorageMainService extends storageMainService_1.StorageMainService {
            getStorageOptions() {
                return {
                    useInMemoryStorage: true
                };
            }
        }
        class StorageTestLifecycleMainService {
            constructor() {
                this.onBeforeShutdown = event_1.Event.None;
                this._onWillShutdown = new event_1.Emitter();
                this.onWillShutdown = this._onWillShutdown.event;
                this.onWillLoadWindow = event_1.Event.None;
                this.onBeforeCloseWindow = event_1.Event.None;
                this.wasRestarted = false;
                this.quitRequested = false;
                this.phase = 2 /* LifecycleMainPhase.Ready */;
            }
            async fireOnWillShutdown() {
                const joiners = [];
                this._onWillShutdown.fire({
                    reason: 1 /* ShutdownReason.QUIT */,
                    join(promise) {
                        joiners.push(promise);
                    }
                });
                await async_1.Promises.settled(joiners);
            }
            registerWindow(window) { }
            async reload(window, cli) { }
            async unload(window, reason) { return true; }
            async relaunch(options) { }
            async quit(willRestart) { return true; }
            async kill(code) { }
            async when(phase) { }
        }
        async function testStorage(storage, isGlobal) {
            // Telemetry: added after init
            if (isGlobal) {
                (0, assert_1.strictEqual)(storage.items.size, 0);
                await storage.init();
                (0, assert_1.strictEqual)(typeof storage.get(telemetry_1.firstSessionDateStorageKey), 'string');
                (0, assert_1.strictEqual)(typeof storage.get(telemetry_1.currentSessionDateStorageKey), 'string');
            }
            else {
                await storage.init();
            }
            let storageChangeEvent = undefined;
            const storageChangeListener = storage.onDidChangeStorage(e => {
                storageChangeEvent = e;
            });
            let storageDidClose = false;
            const storageCloseListener = storage.onDidCloseStorage(() => storageDidClose = true);
            // Basic store/get/remove
            const size = storage.items.size;
            storage.set('bar', 'foo');
            (0, assert_1.strictEqual)(storageChangeEvent.key, 'bar');
            storage.set('barNumber', 55);
            storage.set('barBoolean', true);
            (0, assert_1.strictEqual)(storage.get('bar'), 'foo');
            (0, assert_1.strictEqual)(storage.get('barNumber'), '55');
            (0, assert_1.strictEqual)(storage.get('barBoolean'), 'true');
            (0, assert_1.strictEqual)(storage.items.size, size + 3);
            storage.delete('bar');
            (0, assert_1.strictEqual)(storage.get('bar'), undefined);
            (0, assert_1.strictEqual)(storage.items.size, size + 2);
            // IS_NEW
            (0, assert_1.strictEqual)(storage.get(storage_1.IS_NEW_KEY), 'true');
            // Close
            await storage.close();
            (0, assert_1.strictEqual)(storageDidClose, true);
            storageChangeListener.dispose();
            storageCloseListener.dispose();
        }
        function createStorageService(lifecycleMainService = new StorageTestLifecycleMainService()) {
            return new TestStorageMainService(new log_1.NullLogService(), new environmentService_1.NativeEnvironmentService((0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS), productService), lifecycleMainService, new fileService_1.FileService(new log_1.NullLogService()), telemetryUtils_1.NullTelemetryService);
        }
        test('basics (global)', function () {
            const storageMainService = createStorageService();
            return testStorage(storageMainService.globalStorage, true);
        });
        test('basics (workspace)', function () {
            const workspace = { id: (0, uuid_1.generateUuid)() };
            const storageMainService = createStorageService();
            return testStorage(storageMainService.workspaceStorage(workspace), false);
        });
        test('storage closed onWillShutdown', async function () {
            const lifecycleMainService = new StorageTestLifecycleMainService();
            const workspace = { id: (0, uuid_1.generateUuid)() };
            const storageMainService = createStorageService(lifecycleMainService);
            let workspaceStorage = storageMainService.workspaceStorage(workspace);
            let didCloseWorkspaceStorage = false;
            workspaceStorage.onDidCloseStorage(() => {
                didCloseWorkspaceStorage = true;
            });
            let globalStorage = storageMainService.globalStorage;
            let didCloseGlobalStorage = false;
            globalStorage.onDidCloseStorage(() => {
                didCloseGlobalStorage = true;
            });
            (0, assert_1.strictEqual)(workspaceStorage, storageMainService.workspaceStorage(workspace)); // same instance as long as not closed
            await globalStorage.init();
            await workspaceStorage.init();
            await lifecycleMainService.fireOnWillShutdown();
            (0, assert_1.strictEqual)(didCloseGlobalStorage, true);
            (0, assert_1.strictEqual)(didCloseWorkspaceStorage, true);
            let storage2 = storageMainService.workspaceStorage(workspace);
            (0, assert_1.notStrictEqual)(workspaceStorage, storage2);
            return storage2.close();
        });
        test('storage closed before init works', async function () {
            const storageMainService = createStorageService();
            const workspace = { id: (0, uuid_1.generateUuid)() };
            let workspaceStorage = storageMainService.workspaceStorage(workspace);
            let didCloseWorkspaceStorage = false;
            workspaceStorage.onDidCloseStorage(() => {
                didCloseWorkspaceStorage = true;
            });
            let globalStorage = storageMainService.globalStorage;
            let didCloseGlobalStorage = false;
            globalStorage.onDidCloseStorage(() => {
                didCloseGlobalStorage = true;
            });
            await globalStorage.close();
            await workspaceStorage.close();
            (0, assert_1.strictEqual)(didCloseGlobalStorage, true);
            (0, assert_1.strictEqual)(didCloseWorkspaceStorage, true);
        });
        test('storage closed before init awaits works', async function () {
            const storageMainService = createStorageService();
            const workspace = { id: (0, uuid_1.generateUuid)() };
            let workspaceStorage = storageMainService.workspaceStorage(workspace);
            let didCloseWorkspaceStorage = false;
            workspaceStorage.onDidCloseStorage(() => {
                didCloseWorkspaceStorage = true;
            });
            let globalStorage = storageMainService.globalStorage;
            let didCloseGlobalStorage = false;
            globalStorage.onDidCloseStorage(() => {
                didCloseGlobalStorage = true;
            });
            globalStorage.init();
            workspaceStorage.init();
            await globalStorage.close();
            await workspaceStorage.close();
            (0, assert_1.strictEqual)(didCloseGlobalStorage, true);
            (0, assert_1.strictEqual)(didCloseWorkspaceStorage, true);
        });
    });
});
//# sourceMappingURL=storageMainService.test.js.map