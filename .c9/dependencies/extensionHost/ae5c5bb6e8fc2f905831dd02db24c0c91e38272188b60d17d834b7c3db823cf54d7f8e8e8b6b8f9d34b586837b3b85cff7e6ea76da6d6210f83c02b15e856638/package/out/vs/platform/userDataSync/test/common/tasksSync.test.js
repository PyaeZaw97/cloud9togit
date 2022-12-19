/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/userDataSync/common/tasksSync", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, buffer_1, lifecycle_1, environment_1, files_1, log_1, uriIdentity_1, tasksSync_1, userDataSync_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TasksSync', () => {
        const disposableStore = new lifecycle_1.DisposableStore();
        const server = new userDataSyncClient_1.UserDataSyncTestServer();
        let client;
        let testObject;
        setup(async () => {
            client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client.setUp(true);
            testObject = client.getSynchronizer("tasks" /* SyncResource.Tasks */);
            disposableStore.add((0, lifecycle_1.toDisposable)(() => client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService).clear()));
        });
        teardown(() => disposableStore.clear());
        test('when tasks file does not exist', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const uriIdentityService = client.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource = uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            assert.deepStrictEqual(await testObject.getLastSyncUserData(), null);
            let manifest = await client.manifest();
            server.reset();
            await testObject.sync(manifest);
            assert.deepStrictEqual(server.requests, [
                { type: 'GET', url: `${server.url}/v1/resource/${testObject.resource}/latest`, headers: {} },
            ]);
            assert.ok(!await fileService.exists(tasksResource));
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
        test('when tasks file does not exist and remote has changes', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const content = JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                        'label': 'Watch'
                    }]
            });
            const uriIdentityService2 = client2.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource2 = uriIdentityService2.extUri.joinPath(uriIdentityService2.extUri.dirname(client2.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            await client2.instantiationService.get(files_1.IFileService).writeFile(tasksResource2, buffer_1.VSBuffer.fromString(content));
            await client2.sync();
            const fileService = client.instantiationService.get(files_1.IFileService);
            const uriIdentityService = client.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource = uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
        });
        test('when tasks file exists locally and remote has no tasks', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const uriIdentityService = client.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource = uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            const content = JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                        'label': 'Watch'
                    }]
            });
            fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(content));
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
        });
        test('first time sync: when tasks file exists locally with same content as remote', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const content = JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                        'label': 'Watch'
                    }]
            });
            const uriIdentityService2 = client2.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource2 = uriIdentityService2.extUri.joinPath(uriIdentityService2.extUri.dirname(client2.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            await client2.instantiationService.get(files_1.IFileService).writeFile(tasksResource2, buffer_1.VSBuffer.fromString(content));
            await client2.sync();
            const fileService = client.instantiationService.get(files_1.IFileService);
            const uriIdentityService = client.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource = uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            await fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(content));
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
        });
        test('when tasks file locally has moved forward', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const uriIdentityService = client.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource = uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(JSON.stringify({
                'version': '2.0.0',
                'tasks': []
            })));
            await testObject.sync(await client.manifest());
            const content = JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                        'label': 'Watch'
                    }]
            });
            fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(content));
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
        });
        test('when tasks file remotely has moved forward', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const uriIdentityService2 = client2.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource2 = uriIdentityService2.extUri.joinPath(uriIdentityService2.extUri.dirname(client2.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            const fileService2 = client2.instantiationService.get(files_1.IFileService);
            await fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                'version': '2.0.0',
                'tasks': []
            })));
            const fileService = client.instantiationService.get(files_1.IFileService);
            const uriIdentityService = client.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource = uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            await client2.sync();
            await testObject.sync(await client.manifest());
            const content = JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                        'label': 'Watch'
                    }]
            });
            fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(content));
            await client2.sync();
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
        });
        test('when tasks file has moved forward locally and remotely with same changes', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const uriIdentityService2 = client2.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource2 = uriIdentityService2.extUri.joinPath(uriIdentityService2.extUri.dirname(client2.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            const fileService2 = client2.instantiationService.get(files_1.IFileService);
            await fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                'version': '2.0.0',
                'tasks': []
            })));
            const fileService = client.instantiationService.get(files_1.IFileService);
            const uriIdentityService = client.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource = uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            await client2.sync();
            await testObject.sync(await client.manifest());
            const content = JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                        'label': 'Watch'
                    }]
            });
            fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(content));
            await client2.sync();
            fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(content));
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
        });
        test('when tasks file has moved forward locally and remotely - accept preview', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const uriIdentityService2 = client2.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource2 = uriIdentityService2.extUri.joinPath(uriIdentityService2.extUri.dirname(client2.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            const fileService2 = client2.instantiationService.get(files_1.IFileService);
            await fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                'version': '2.0.0',
                'tasks': []
            })));
            const fileService = client.instantiationService.get(files_1.IFileService);
            const uriIdentityService = client.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource = uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            await client2.sync();
            await testObject.sync(await client.manifest());
            fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                    }]
            })));
            await client2.sync();
            const content = JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                        'label': 'Watch'
                    }]
            });
            fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(content));
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            assert.deepStrictEqual(testObject.conflicts.length, 1);
            assert.deepStrictEqual(testObject.conflicts[0].mergeState, "conflict" /* MergeState.Conflict */);
            assert.deepStrictEqual(testObject.conflicts[0].localChange, 2 /* Change.Modified */);
            assert.deepStrictEqual(testObject.conflicts[0].remoteChange, 2 /* Change.Modified */);
            assert.deepStrictEqual((await fileService.readFile(testObject.conflicts[0].previewResource)).value.toString(), content);
            await testObject.accept(testObject.conflicts[0].previewResource);
            await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
        });
        test('when tasks file has moved forward locally and remotely - accept modified preview', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const uriIdentityService2 = client2.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource2 = uriIdentityService2.extUri.joinPath(uriIdentityService2.extUri.dirname(client2.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            const fileService2 = client2.instantiationService.get(files_1.IFileService);
            await fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                'version': '2.0.0',
                'tasks': []
            })));
            const fileService = client.instantiationService.get(files_1.IFileService);
            const uriIdentityService = client.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource = uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            await client2.sync();
            await testObject.sync(await client.manifest());
            fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                    }]
            })));
            await client2.sync();
            fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                        'label': 'Watch'
                    }]
            })));
            await testObject.sync(await client.manifest());
            const content = JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                        'label': 'Watch 2'
                    }]
            });
            await testObject.accept(testObject.conflicts[0].previewResource, content);
            await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
        });
        test('when tasks file has moved forward locally and remotely - accept remote', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const uriIdentityService2 = client2.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource2 = uriIdentityService2.extUri.joinPath(uriIdentityService2.extUri.dirname(client2.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            const fileService2 = client2.instantiationService.get(files_1.IFileService);
            await fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                'version': '2.0.0',
                'tasks': []
            })));
            const fileService = client.instantiationService.get(files_1.IFileService);
            const uriIdentityService = client.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource = uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            await client2.sync();
            await testObject.sync(await client.manifest());
            const content = JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                    }]
            });
            fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(content));
            await client2.sync();
            fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                        'label': 'Watch'
                    }]
            })));
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            await testObject.accept(testObject.conflicts[0].remoteResource);
            await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
        });
        test('when tasks file has moved forward locally and remotely - accept local', async () => {
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client2.setUp(true);
            const uriIdentityService2 = client2.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource2 = uriIdentityService2.extUri.joinPath(uriIdentityService2.extUri.dirname(client2.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            const fileService2 = client2.instantiationService.get(files_1.IFileService);
            await fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                'version': '2.0.0',
                'tasks': []
            })));
            const fileService = client.instantiationService.get(files_1.IFileService);
            const uriIdentityService = client.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource = uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            await client2.sync();
            await testObject.sync(await client.manifest());
            fileService2.writeFile(tasksResource2, buffer_1.VSBuffer.fromString(JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                    }]
            })));
            await client2.sync();
            const content = JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                        'label': 'Watch'
                    }]
            });
            fileService.writeFile(tasksResource, buffer_1.VSBuffer.fromString(content));
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            await testObject.accept(testObject.conflicts[0].localResource);
            await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            const lastSyncUserData = await testObject.getLastSyncUserData();
            const remoteUserData = await testObject.getRemoteUserData(null);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(remoteUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
            assert.strictEqual((await fileService.readFile(tasksResource)).value.toString(), content);
        });
        test('when tasks file is created after first sync', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const uriIdentityService = client.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource = uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            await testObject.sync(await client.manifest());
            const content = JSON.stringify({
                'version': '2.0.0',
                'tasks': [{
                        'type': 'npm',
                        'script': 'watch',
                        'label': 'Watch'
                    }]
            });
            await fileService.createFile(tasksResource, buffer_1.VSBuffer.fromString(content));
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
            assert.strictEqual((0, tasksSync_1.getTasksContentFromSyncContent)(lastSyncUserData.syncData.content, client.instantiationService.get(log_1.ILogService)), content);
        });
        test('apply remote when tasks file does not exist', async () => {
            const fileService = client.instantiationService.get(files_1.IFileService);
            const uriIdentityService = client.instantiationService.get(uriIdentity_1.IUriIdentityService);
            const tasksResource = uriIdentityService.extUri.joinPath(uriIdentityService.extUri.dirname(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource), 'tasks.json');
            if (await fileService.exists(tasksResource)) {
                await fileService.del(tasksResource);
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
//# sourceMappingURL=tasksSync.test.js.map