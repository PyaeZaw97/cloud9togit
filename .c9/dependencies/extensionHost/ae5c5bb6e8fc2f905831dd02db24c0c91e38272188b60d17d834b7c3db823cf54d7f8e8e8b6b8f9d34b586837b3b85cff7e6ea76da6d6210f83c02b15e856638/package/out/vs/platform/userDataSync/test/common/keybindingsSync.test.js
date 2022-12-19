/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/userDataSync/common/keybindingsSync", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, buffer_1, lifecycle_1, environment_1, files_1, log_1, keybindingsSync_1, userDataSync_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('KeybindingsSync', () => {
        const disposableStore = new lifecycle_1.DisposableStore();
        const server = new userDataSyncClient_1.UserDataSyncTestServer();
        let client;
        let testObject;
        setup(async () => {
            client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client.setUp(true);
            testObject = client.getSynchronizer("keybindings" /* SyncResource.Keybindings */);
            disposableStore.add((0, lifecycle_1.toDisposable)(() => client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).clear()));
        });
        teardown(() => disposableStore.clear());
        test('when keybindings file does not exist', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(environment_1.IEnvironmentService).keybindingsResource;
            assert.deepStrictEqual(await testObject.getLastSyncUserData(), null);
            let manifest = await client.manifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, [
                { type: 'GET', url: `${server.url}/v1/resource/${testObject.resource}/latest`, headers: {} },
            ]);
            assert.ok(!await fileService.exists(keybindingsResource));
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
            assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
            assert.strictEqual(lastSyncUserData.syncData, null);
            manifest = await client.manifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, []);
            manifest = await client.manifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, []);
        });
        test('when keybindings file is empty and remote has no changes', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(environment_1.IEnvironmentService).keybindingsResource;
            await fileService.writeFile(keybindingsResource, buffer_1.VSBuffer.fromString(''));
            await testObject.sync(await client.manifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(lastSyncUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), '[]');
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(remoteUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), '[]');
            assert.strictEqual((await fileService.readFile(keybindingsResource)).value.toString(), '');
        });
        test('when keybindings file is empty and remote has changes', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const content = JSON.stringify([
                {
                    'key': 'shift+cmd+w',
                    'command': 'workbench.action.closeAllEditors',
                }
            ]);
            await client2.instantiationService.get(files_1.IFileService).writeFile(client2.instantiationService.get(environment_1.IEnvironmentService).keybindingsResource, buffer_1.VSBuffer.fromString(content));
            await client2.sync();
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(environment_1.IEnvironmentService).keybindingsResource;
            await fileService.writeFile(keybindingsResource, buffer_1.VSBuffer.fromString(''));
            await testObject.sync(await client.manifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(lastSyncUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(remoteUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(keybindingsResource)).value.toString(), content);
        });
        test('when keybindings file is empty with comment and remote has no changes', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(environment_1.IEnvironmentService).keybindingsResource;
            const expectedContent = '// Empty Keybindings';
            await fileService.writeFile(keybindingsResource, buffer_1.VSBuffer.fromString(expectedContent));
            await testObject.sync(await client.manifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(lastSyncUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), expectedContent);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(remoteUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), expectedContent);
            assert.strictEqual((await fileService.readFile(keybindingsResource)).value.toString(), expectedContent);
        });
        test('when keybindings file is empty and remote has keybindings', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const content = JSON.stringify([
                {
                    'key': 'shift+cmd+w',
                    'command': 'workbench.action.closeAllEditors',
                }
            ]);
            await client2.instantiationService.get(files_1.IFileService).writeFile(client2.instantiationService.get(environment_1.IEnvironmentService).keybindingsResource, buffer_1.VSBuffer.fromString(content));
            await client2.sync();
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(environment_1.IEnvironmentService).keybindingsResource;
            await fileService.writeFile(keybindingsResource, buffer_1.VSBuffer.fromString('// Empty Keybindings'));
            await testObject.sync(await client.manifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(lastSyncUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(remoteUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(keybindingsResource)).value.toString(), content);
        });
        test('when keybindings file is empty and remote has empty array', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const content = `// Place your key bindings in this file to override the defaults
[
]`;
            await client2.instantiationService.get(files_1.IFileService).writeFile(client2.instantiationService.get(environment_1.IEnvironmentService).keybindingsResource, buffer_1.VSBuffer.fromString(content));
            await client2.sync();
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(environment_1.IEnvironmentService).keybindingsResource;
            const expectedLocalContent = '// Empty Keybindings';
            await fileService.writeFile(keybindingsResource, buffer_1.VSBuffer.fromString(expectedLocalContent));
            await testObject.sync(await client.manifest());
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(lastSyncUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(remoteUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(keybindingsResource)).value.toString(), expectedLocalContent);
        });
        test('when keybindings file is created after first sync', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(environment_1.IEnvironmentService).keybindingsResource;
            await testObject.sync(await client.manifest());
            await fileService.createFile(keybindingsResource, buffer_1.VSBuffer.fromString('[]'));
            let lastSyncUserData = await testObject.getLastSyncUserData();
            const manifest = await client.manifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, [
                { type: 'POST', url: `${server.url}/v1/resource/${testObject.resource}`, headers: { 'If-Match': lastSyncUserData === null || lastSyncUserData === void 0 ? void 0 : lastSyncUserData.ref } },
            ]);
            lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.deepStrictEqual(lastSyncUserData.ref, remoteUserData.ref);
            assert.deepStrictEqual(lastSyncUserData.syncData, remoteUserData.syncData);
            assert.strictEqual((0, keybindingsSync_1.getKeybindingsContentFromSyncContent)(lastSyncUserData.syncData.content, true, client.instantiationService.get(log_1.ILogService)), '[]');
        });
        test('test apply remote when keybindings file does not exist', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const keybindingsResource = client.instantiationService.get(environment_1.IEnvironmentService).keybindingsResource;
            if (await fileService.exists(keybindingsResource)) {
                await fileService.del(keybindingsResource);
            }
            const preview = (await testObject.preview(await client.manifest(), {}));
            server.reset();
            const content = await testObject.resolveContent(preview.resourcePreviews[0].remoteResource);
            await testObject.accept(preview.resourcePreviews[0].remoteResource, content);
            await testObject.apply(false);
            assert.deepStrictEqual(server.requests, []);
        });
    });
});
//# sourceMappingURL=keybindingsSync.test.js.map