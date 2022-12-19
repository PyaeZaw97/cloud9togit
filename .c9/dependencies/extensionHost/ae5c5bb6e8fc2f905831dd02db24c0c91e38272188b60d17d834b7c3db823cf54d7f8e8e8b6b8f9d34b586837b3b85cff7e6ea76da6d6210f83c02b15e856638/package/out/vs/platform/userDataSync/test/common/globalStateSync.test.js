/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, buffer_1, lifecycle_1, environment_1, files_1, storage_1, userDataSync_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('GlobalStateSync', () => {
        const disposableStore = new lifecycle_1.DisposableStore();
        const server = new userDataSyncClient_1.UserDataSyncTestServer();
        let testClient;
        let client2;
        let testObject;
        setup(async () => {
            testClient = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await testClient.setUp(true);
            testObject = testClient.getSynchronizer("globalState" /* SyncResource.GlobalState */);
            disposableStore.add((0, lifecycle_1.toDisposable)(() => testClient.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).clear()));
            client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
        });
        teardown(() => disposableStore.clear());
        test('when global state does not exist', async () => {
            assert.deepStrictEqual(await testObject.getLastSyncUserData(), null);
            let manifest = await testClient.manifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, [
                { type: 'GET', url: `${server.url}/v1/resource/${testObject.resource}/latest`, headers: {} },
            ]);
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
            assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
            assert.strictEqual(lastSyncUserData.syncData, null);
            manifest = await testClient.manifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, []);
            manifest = await testClient.manifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, []);
        });
        test('when global state is created after first sync', async () => {
            await testObject.sync(await testClient.manifest());
            updateUserStorage('a', 'value1', testClient);
            let lastSyncUserData = await testObject.getLastSyncUserData();
            const manifest = await testClient.manifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, [
                { type: 'POST', url: `${server.url}/v1/resource/${testObject.resource}`, headers: { 'If-Match': lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref } },
            ]);
            lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
            assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
            assert.deepStrictEqual(JSON.parse(lastSyncUserData.syncData.content).storage, { 'a': { version: 1, value: 'value1' } });
        });
        test('first time sync - outgoing to server (no state)', async () => {
            updateUserStorage('a', 'value1', testClient);
            updateMachineStorage('b', 'value1', testClient);
            await updateLocale(testClient);
            await testObject.sync(await testClient.manifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts, []);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseGlobalState(content);
            assert.deepStrictEqual(actual.storage, { 'globalState.argv.locale': { version: 1, value: 'en' }, 'a': { version: 1, value: 'value1' } });
        });
        test('first time sync - incoming from server (no state)', async () => {
            updateUserStorage('a', 'value1', client2);
            await updateLocale(client2);
            await client2.sync();
            await testObject.sync(await testClient.manifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts, []);
            assert.strictEqual(readStorage('a', testClient), 'value1');
            assert.strictEqual(await readLocale(testClient), 'en');
        });
        test('first time sync when storage exists', async () => {
            updateUserStorage('a', 'value1', client2);
            await client2.sync();
            updateUserStorage('b', 'value2', testClient);
            await testObject.sync(await testClient.manifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts, []);
            assert.strictEqual(readStorage('a', testClient), 'value1');
            assert.strictEqual(readStorage('b', testClient), 'value2');
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseGlobalState(content);
            assert.deepStrictEqual(actual.storage, { 'a': { version: 1, value: 'value1' }, 'b': { version: 1, value: 'value2' } });
        });
        test('first time sync when storage exists - has conflicts', async () => {
            updateUserStorage('a', 'value1', client2);
            await client2.sync();
            updateUserStorage('a', 'value2', client2);
            await testObject.sync(await testClient.manifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts, []);
            assert.strictEqual(readStorage('a', testClient), 'value1');
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseGlobalState(content);
            assert.deepStrictEqual(actual.storage, { 'a': { version: 1, value: 'value1' } });
        });
        test('sync adding a storage value', async () => {
            updateUserStorage('a', 'value1', testClient);
            await testObject.sync(await testClient.manifest());
            updateUserStorage('b', 'value2', testClient);
            await testObject.sync(await testClient.manifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts, []);
            assert.strictEqual(readStorage('a', testClient), 'value1');
            assert.strictEqual(readStorage('b', testClient), 'value2');
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseGlobalState(content);
            assert.deepStrictEqual(actual.storage, { 'a': { version: 1, value: 'value1' }, 'b': { version: 1, value: 'value2' } });
        });
        test('sync updating a storage value', async () => {
            updateUserStorage('a', 'value1', testClient);
            await testObject.sync(await testClient.manifest());
            updateUserStorage('a', 'value2', testClient);
            await testObject.sync(await testClient.manifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts, []);
            assert.strictEqual(readStorage('a', testClient), 'value2');
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseGlobalState(content);
            assert.deepStrictEqual(actual.storage, { 'a': { version: 1, value: 'value2' } });
        });
        test('sync removing a storage value', async () => {
            updateUserStorage('a', 'value1', testClient);
            updateUserStorage('b', 'value2', testClient);
            await testObject.sync(await testClient.manifest());
            removeStorage('b', testClient);
            await testObject.sync(await testClient.manifest());
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.deepStrictEqual(testObject.conflicts, []);
            assert.strictEqual(readStorage('a', testClient), 'value1');
            assert.strictEqual(readStorage('b', testClient), undefined);
            const { content } = await testClient.read(testObject.resource);
            assert.ok(content !== null);
            const actual = parseGlobalState(content);
            assert.deepStrictEqual(actual.storage, { 'a': { version: 1, value: 'value1' } });
        });
        function parseGlobalState(content) {
            const syncData = JSON.parse(content);
            return JSON.parse(syncData.content);
        }
        async function updateLocale(client) {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const environmentService = client.instantiationService.get(environment_1.IEnvironmentService);
            await fileService.writeFile(environmentService.argvResource, buffer_1.VSBuffer.fromString(JSON.stringify({ 'locale': 'en' })));
        }
        function updateUserStorage(key, value, client) {
            const storageService = client.instantiationService.get(storage_1.IStorageService);
            storageService.store(key, value, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
        }
        function updateMachineStorage(key, value, client) {
            const storageService = client.instantiationService.get(storage_1.IStorageService);
            storageService.store(key, value, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
        function removeStorage(key, client) {
            const storageService = client.instantiationService.get(storage_1.IStorageService);
            storageService.remove(key, 0 /* StorageScope.GLOBAL */);
        }
        function readStorage(key, client) {
            const storageService = client.instantiationService.get(storage_1.IStorageService);
            return storageService.get(key, 0 /* StorageScope.GLOBAL */);
        }
        async function readLocale(client) {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const environmentService = client.instantiationService.get(environment_1.IEnvironmentService);
            const content = await fileService.readFile(environmentService.argvResource);
            return JSON.parse(content.value.toString()).locale;
        }
    });
});
//# sourceMappingURL=globalStateSync.test.js.map