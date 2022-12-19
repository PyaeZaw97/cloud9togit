/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/platform/files/common/files", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/platform/userDataSync/common/abstractSynchronizer", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, async_1, buffer_1, event_1, lifecycle_1, resources_1, files_1, inMemoryFilesystemProvider_1, abstractSynchronizer_1, userDataSync_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestSynchroniser extends abstractSynchronizer_1.AbstractSynchroniser {
        constructor() {
            super(...arguments);
            this.syncBarrier = new async_1.Barrier();
            this.syncResult = { hasConflicts: false, hasError: false };
            this.onDoSyncCall = this._register(new event_1.Emitter());
            this.failWhenGettingLatestRemoteUserData = false;
            this.resource = "settings" /* SyncResource.Settings */;
            this.version = 1;
            this.cancelled = false;
            this.localResource = (0, resources_1.joinPath)(this.environmentService.userRoamingDataHome, 'testResource.json');
            this.onDidTriggerLocalChangeCall = this._register(new event_1.Emitter());
        }
        getLatestRemoteUserData(manifest, lastSyncUserData) {
            if (this.failWhenGettingLatestRemoteUserData) {
                throw new Error();
            }
            return super.getLatestRemoteUserData(manifest, lastSyncUserData);
        }
        async doSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration) {
            this.cancelled = false;
            this.onDoSyncCall.fire();
            await this.syncBarrier.wait();
            if (this.cancelled) {
                return "idle" /* SyncStatus.Idle */;
            }
            return super.doSync(remoteUserData, lastSyncUserData, apply, userDataSyncConfiguration);
        }
        async generateSyncPreview(remoteUserData) {
            if (this.syncResult.hasError) {
                throw new Error('failed');
            }
            let fileContent = null;
            try {
                fileContent = await this.fileService.readFile(this.localResource);
            }
            catch (error) { }
            return [{
                    localResource: this.localResource,
                    localContent: fileContent ? fileContent.value.toString() : null,
                    remoteResource: this.localResource.with(({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'remote' })),
                    remoteContent: remoteUserData.syncData ? remoteUserData.syncData.content : null,
                    previewResource: this.localResource.with(({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'preview' })),
                    ref: remoteUserData.ref,
                    localChange: 2 /* Change.Modified */,
                    remoteChange: 2 /* Change.Modified */,
                    acceptedResource: this.localResource.with(({ scheme: userDataSync_1.USER_DATA_SYNC_SCHEME, authority: 'accepted' })),
                }];
        }
        async hasRemoteChanged(lastSyncUserData) {
            return true;
        }
        async getMergeResult(resourcePreview, token) {
            return {
                content: resourcePreview.ref,
                localChange: 2 /* Change.Modified */,
                remoteChange: 2 /* Change.Modified */,
                hasConflicts: this.syncResult.hasConflicts,
            };
        }
        async getAcceptResult(resourcePreview, resource, content, token) {
            if ((0, resources_1.isEqual)(resource, resourcePreview.localResource)) {
                return {
                    content: resourcePreview.localContent,
                    localChange: 0 /* Change.None */,
                    remoteChange: resourcePreview.localContent === null ? 3 /* Change.Deleted */ : 2 /* Change.Modified */,
                };
            }
            if ((0, resources_1.isEqual)(resource, resourcePreview.remoteResource)) {
                return {
                    content: resourcePreview.remoteContent,
                    localChange: resourcePreview.remoteContent === null ? 3 /* Change.Deleted */ : 2 /* Change.Modified */,
                    remoteChange: 0 /* Change.None */,
                };
            }
            if ((0, resources_1.isEqual)(resource, resourcePreview.previewResource)) {
                if (content === undefined) {
                    return {
                        content: resourcePreview.ref,
                        localChange: 2 /* Change.Modified */,
                        remoteChange: 2 /* Change.Modified */,
                    };
                }
                else {
                    return {
                        content,
                        localChange: content === null ? resourcePreview.localContent !== null ? 3 /* Change.Deleted */ : 0 /* Change.None */ : 2 /* Change.Modified */,
                        remoteChange: content === null ? resourcePreview.remoteContent !== null ? 3 /* Change.Deleted */ : 0 /* Change.None */ : 2 /* Change.Modified */,
                    };
                }
            }
            throw new Error(`Invalid Resource: ${resource.toString()}`);
        }
        async applyResult(remoteUserData, lastSyncUserData, resourcePreviews, force) {
            if (resourcePreviews[0][1].localChange === 3 /* Change.Deleted */) {
                await this.fileService.del(this.localResource);
            }
            if (resourcePreviews[0][1].localChange === 1 /* Change.Added */ || resourcePreviews[0][1].localChange === 2 /* Change.Modified */) {
                await this.fileService.writeFile(this.localResource, buffer_1.VSBuffer.fromString(resourcePreviews[0][1].content));
            }
            if (resourcePreviews[0][1].remoteChange === 3 /* Change.Deleted */) {
                await this.applyRef(null, remoteUserData.ref);
            }
            if (resourcePreviews[0][1].remoteChange === 1 /* Change.Added */ || resourcePreviews[0][1].remoteChange === 2 /* Change.Modified */) {
                await this.applyRef(resourcePreviews[0][1].content, remoteUserData.ref);
            }
        }
        async applyRef(content, ref) {
            const remoteUserData = await this.updateRemoteUserData(content === null ? '' : content, ref);
            await this.updateLastSyncUserData(remoteUserData);
        }
        async stop() {
            this.cancelled = true;
            this.syncBarrier.open();
            super.stop();
        }
        async triggerLocalChange() {
            super.triggerLocalChange();
        }
        async doTriggerLocalChange() {
            await super.doTriggerLocalChange();
            this.onDidTriggerLocalChangeCall.fire();
        }
        hasLocalData() { throw new Error('not implemented'); }
        getAssociatedResources() { throw new Error('not implemented'); }
    }
    suite('TestSynchronizer - Auto Sync', () => {
        const disposableStore = new lifecycle_1.DisposableStore();
        const server = new userDataSyncClient_1.UserDataSyncTestServer();
        let client;
        let userDataSyncStoreService;
        setup(async () => {
            client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client.setUp();
            userDataSyncStoreService = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            disposableStore.add((0, lifecycle_1.toDisposable)(() => userDataSyncStoreService.clear()));
            client.instantiationService.get(files_1.IFileService).registerProvider(userDataSync_1.USER_DATA_SYNC_SCHEME, new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
        });
        teardown(() => disposableStore.clear());
        test('status is syncing', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            const actual = [];
            disposableStore.add(testObject.onDidChangeStatus(status => actual.push(status)));
            const promise = event_1.Event.toPromise(testObject.onDoSyncCall.event);
            testObject.sync(await client.manifest());
            await promise;
            assert.deepStrictEqual(actual, ["syncing" /* SyncStatus.Syncing */]);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            testObject.stop();
        });
        test('status is set correctly when sync is finished', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncBarrier.open();
            const actual = [];
            disposableStore.add(testObject.onDidChangeStatus(status => actual.push(status)));
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(actual, ["syncing" /* SyncStatus.Syncing */, "idle" /* SyncStatus.Idle */]);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
        });
        test('status is set correctly when sync has errors', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasError: true, hasConflicts: false };
            testObject.syncBarrier.open();
            const actual = [];
            disposableStore.add(testObject.onDidChangeStatus(status => actual.push(status)));
            try {
                await testObject.sync(await client.manifest());
                assert.fail('Should fail');
            }
            catch (e) {
                assert.deepStrictEqual(actual, ["syncing" /* SyncStatus.Syncing */, "idle" /* SyncStatus.Idle */]);
                assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            }
        });
        test('status is set to hasConflicts when asked to sync if there are conflicts', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            assertConflicts(testObject.conflicts, [testObject.localResource]);
        });
        test('sync should not run if syncing already', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            const promise = event_1.Event.toPromise(testObject.onDoSyncCall.event);
            testObject.sync(await client.manifest());
            await promise;
            const actual = [];
            disposableStore.add(testObject.onDidChangeStatus(status => actual.push(status)));
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(actual, []);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            await testObject.stop();
        });
        test('sync should not run if there are conflicts', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const actual = [];
            disposableStore.add(testObject.onDidChangeStatus(status => actual.push(status)));
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(actual, []);
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
        });
        test('accept preview during conflicts', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            await testObject.accept(testObject.conflicts[0].previewResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertConflicts(testObject.conflicts, []);
            await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            const fileService = client.instantiationService.get(files_1.IFileService);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, (await fileService.readFile(testObject.localResource)).value.toString());
        });
        test('accept remote during conflicts', async () => {
            var _a, _b;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const fileService = client.instantiationService.get(files_1.IFileService);
            const currentRemoteContent = (_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content;
            const newLocalContent = 'conflict';
            await fileService.writeFile(testObject.localResource, buffer_1.VSBuffer.fromString(newLocalContent));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            await testObject.accept(testObject.conflicts[0].remoteResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertConflicts(testObject.conflicts, []);
            await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual((_b = (await testObject.getRemoteUserData(null)).syncData) === null || _b === void 0 ? void 0 : _b.content, currentRemoteContent);
            assert.strictEqual((await fileService.readFile(testObject.localResource)).value.toString(), currentRemoteContent);
        });
        test('accept local during conflicts', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const fileService = client.instantiationService.get(files_1.IFileService);
            const newLocalContent = 'conflict';
            await fileService.writeFile(testObject.localResource, buffer_1.VSBuffer.fromString(newLocalContent));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            await testObject.accept(testObject.conflicts[0].localResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertConflicts(testObject.conflicts, []);
            await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, newLocalContent);
            assert.strictEqual((await fileService.readFile(testObject.localResource)).value.toString(), newLocalContent);
        });
        test('accept new content during conflicts', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const fileService = client.instantiationService.get(files_1.IFileService);
            const newLocalContent = 'conflict';
            await fileService.writeFile(testObject.localResource, buffer_1.VSBuffer.fromString(newLocalContent));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            const mergeContent = 'newContent';
            await testObject.accept(testObject.conflicts[0].previewResource, mergeContent);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertConflicts(testObject.conflicts, []);
            await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, mergeContent);
            assert.strictEqual((await fileService.readFile(testObject.localResource)).value.toString(), mergeContent);
        });
        test('accept delete during conflicts', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const fileService = client.instantiationService.get(files_1.IFileService);
            const newLocalContent = 'conflict';
            await fileService.writeFile(testObject.localResource, buffer_1.VSBuffer.fromString(newLocalContent));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            await testObject.accept(testObject.conflicts[0].previewResource, null);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertConflicts(testObject.conflicts, []);
            await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, '');
            assert.ok(!(await fileService.exists(testObject.localResource)));
        });
        test('accept deleted local during conflicts', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const fileService = client.instantiationService.get(files_1.IFileService);
            await fileService.del(testObject.localResource);
            testObject.syncResult = { hasConflicts: true, hasError: false };
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            await testObject.accept(testObject.conflicts[0].localResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertConflicts(testObject.conflicts, []);
            await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, '');
            assert.ok(!(await fileService.exists(testObject.localResource)));
        });
        test('accept deleted remote during conflicts', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncBarrier.open();
            const fileService = client.instantiationService.get(files_1.IFileService);
            await fileService.writeFile(testObject.localResource, buffer_1.VSBuffer.fromString('some content'));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            await testObject.accept(testObject.conflicts[0].remoteResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertConflicts(testObject.conflicts, []);
            await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual((await testObject.getRemoteUserData(null)).syncData, null);
            assert.ok(!(await fileService.exists(testObject.localResource)));
        });
        test('request latest data on precondition failure', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            // Sync once
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            testObject.syncBarrier = new async_1.Barrier();
            // update remote data before syncing so that 412 is thrown by server
            const disposable = testObject.onDoSyncCall.event(async () => {
                disposable.dispose();
                await testObject.applyRef(ref, ref);
                server.reset();
                testObject.syncBarrier.open();
            });
            // Start sycing
            const manifest = await client.manifest();
            const ref = manifest.latest[testObject.resource];
            await testObject.sync(await client.manifest());
            assert.deepStrictEqual(server.requests, [
                { type: 'POST', url: `${server.url}/v1/resource/${testObject.resource}`, headers: { 'If-Match': ref } },
                { type: 'GET', url: `${server.url}/v1/resource/${testObject.resource}/latest`, headers: {} },
                { type: 'POST', url: `${server.url}/v1/resource/${testObject.resource}`, headers: { 'If-Match': `${parseInt(ref) + 1}` } },
            ]);
        });
        test('no requests are made to server when local change is triggered', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            server.reset();
            const promise = event_1.Event.toPromise(testObject.onDidTriggerLocalChangeCall.event);
            await testObject.triggerLocalChange();
            await promise;
            assert.deepStrictEqual(server.requests, []);
        });
        test('status is reset when getting latest remote data fails', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.failWhenGettingLatestRemoteUserData = true;
            try {
                await testObject.sync(await client.manifest());
                assert.fail('Should throw an error');
            }
            catch (error) {
            }
            assert.strictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
        });
    });
    suite('TestSynchronizer - Manual Sync', () => {
        const disposableStore = new lifecycle_1.DisposableStore();
        const server = new userDataSyncClient_1.UserDataSyncTestServer();
        let client;
        let userDataSyncStoreService;
        setup(async () => {
            client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(server));
            await client.setUp();
            userDataSyncStoreService = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            disposableStore.add((0, lifecycle_1.toDisposable)(() => userDataSyncStoreService.clear()));
            client.instantiationService.get(files_1.IFileService).registerProvider(userDataSync_1.USER_DATA_SYNC_SCHEME, new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider());
        });
        teardown(() => disposableStore.clear());
        test('preview', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            const preview = await testObject.preview(await client.manifest(), {});
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assertConflicts(testObject.conflicts, []);
        });
        test('preview -> merge', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "accepted" /* MergeState.Accepted */);
            assertConflicts(testObject.conflicts, []);
        });
        test('preview -> accept', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "accepted" /* MergeState.Accepted */);
            assertConflicts(testObject.conflicts, []);
        });
        test('preview -> merge -> accept', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].localResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "accepted" /* MergeState.Accepted */);
            assertConflicts(testObject.conflicts, []);
        });
        test('preview -> merge -> apply', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const manifest = await client.manifest();
            let preview = await testObject.preview(manifest, {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assertConflicts(testObject.conflicts, []);
            const expectedContent = manifest.latest[testObject.resource];
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, expectedContent);
            assert.strictEqual((await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString(), expectedContent);
        });
        test('preview -> accept -> apply', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const manifest = await client.manifest();
            const expectedContent = manifest.latest[testObject.resource];
            let preview = await testObject.preview(manifest, {});
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            preview = await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assertConflicts(testObject.conflicts, []);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, expectedContent);
            assert.strictEqual((await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString(), expectedContent);
        });
        test('preview -> merge -> accept -> apply', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const expectedContent = (await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].localResource);
            preview = await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assertConflicts(testObject.conflicts, []);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, expectedContent);
            assert.strictEqual((await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString(), expectedContent);
        });
        test('preview -> accept', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assertConflicts(testObject.conflicts, []);
        });
        test('preview -> accept -> apply', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const manifest = await client.manifest();
            const expectedContent = manifest.latest[testObject.resource];
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            preview = await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assertConflicts(testObject.conflicts, []);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, expectedContent);
            assert.strictEqual((await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString(), expectedContent);
        });
        test('preivew -> merge -> discard', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "preview" /* MergeState.Preview */);
            assertConflicts(testObject.conflicts, []);
        });
        test('preivew -> merge -> discard -> accept', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].remoteResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "accepted" /* MergeState.Accepted */);
            assertConflicts(testObject.conflicts, []);
        });
        test('preivew -> accept -> discard', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "preview" /* MergeState.Preview */);
            assertConflicts(testObject.conflicts, []);
        });
        test('preivew -> accept -> discard -> accept', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].remoteResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "accepted" /* MergeState.Accepted */);
            assertConflicts(testObject.conflicts, []);
        });
        test('preivew -> accept -> discard -> merge', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            preview = await testObject.merge(preview.resourcePreviews[0].remoteResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "accepted" /* MergeState.Accepted */);
            assertConflicts(testObject.conflicts, []);
        });
        test('preivew -> merge -> accept -> discard', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].remoteResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "preview" /* MergeState.Preview */);
            assertConflicts(testObject.conflicts, []);
        });
        test('preivew -> merge -> discard -> accept -> apply', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const expectedContent = (await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].localResource);
            preview = await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assertConflicts(testObject.conflicts, []);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, expectedContent);
            assert.strictEqual((await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString(), expectedContent);
        });
        test('preivew -> accept -> discard -> accept -> apply', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const expectedContent = (await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].remoteResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].localResource);
            preview = await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assertConflicts(testObject.conflicts, []);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, expectedContent);
            assert.strictEqual((await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString(), expectedContent);
        });
        test('preivew -> accept -> discard -> merge -> apply', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const manifest = await client.manifest();
            const expectedContent = manifest.latest[testObject.resource];
            let preview = await testObject.preview(manifest, {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].remoteResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            preview = await testObject.merge(preview.resourcePreviews[0].localResource);
            preview = await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assertConflicts(testObject.conflicts, []);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, expectedContent);
            assert.strictEqual((await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString(), expectedContent);
        });
        test('conflicts: preview', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            const preview = await testObject.preview(await client.manifest(), {});
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assertConflicts(testObject.conflicts, []);
        });
        test('conflicts: preview -> merge', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "conflict" /* MergeState.Conflict */);
            assertConflicts(testObject.conflicts, [preview.resourcePreviews[0].localResource]);
        });
        test('conflicts: preview -> merge -> discard', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            const preview = await testObject.preview(await client.manifest(), {});
            await testObject.merge(preview.resourcePreviews[0].previewResource);
            await testObject.discard(preview.resourcePreviews[0].previewResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "preview" /* MergeState.Preview */);
            assertConflicts(testObject.conflicts, []);
        });
        test('conflicts: preview -> accept', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            await testObject.merge(preview.resourcePreviews[0].previewResource);
            const content = await testObject.resolveContent(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource, content);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.deepStrictEqual(testObject.conflicts, []);
        });
        test('conflicts: preview -> merge -> accept -> apply', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            testObject.syncResult = { hasConflicts: true, hasError: false };
            const manifest = await client.manifest();
            const expectedContent = manifest.latest[testObject.resource];
            let preview = await testObject.preview(manifest, {});
            await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            preview = await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assertConflicts(testObject.conflicts, []);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, expectedContent);
            assert.strictEqual((await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString(), expectedContent);
        });
        test('conflicts: preview -> accept', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            const content = await testObject.resolveContent(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource, content);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assertConflicts(testObject.conflicts, []);
        });
        test('conflicts: preview -> accept -> apply', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            testObject.syncResult = { hasConflicts: true, hasError: false };
            const manifest = await client.manifest();
            const expectedContent = manifest.latest[testObject.resource];
            let preview = await testObject.preview(manifest, {});
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            preview = await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assertConflicts(testObject.conflicts, []);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, expectedContent);
            assert.strictEqual((await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString(), expectedContent);
        });
        test('conflicts: preivew -> merge -> discard', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "preview" /* MergeState.Preview */);
            assertConflicts(testObject.conflicts, []);
        });
        test('conflicts: preivew -> merge -> discard -> accept', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].remoteResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "accepted" /* MergeState.Accepted */);
            assertConflicts(testObject.conflicts, []);
        });
        test('conflicts: preivew -> accept -> discard', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "preview" /* MergeState.Preview */);
            assertConflicts(testObject.conflicts, []);
        });
        test('conflicts: preivew -> accept -> discard -> accept', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].remoteResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "accepted" /* MergeState.Accepted */);
            assertConflicts(testObject.conflicts, []);
        });
        test('conflicts: preivew -> accept -> discard -> merge', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.accept(preview.resourcePreviews[0].previewResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            preview = await testObject.merge(preview.resourcePreviews[0].remoteResource);
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "conflict" /* MergeState.Conflict */);
            assertConflicts(testObject.conflicts, [preview.resourcePreviews[0].localResource]);
        });
        test('conflicts: preivew -> merge -> discard -> merge', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: true, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            preview = await testObject.merge(preview.resourcePreviews[0].remoteResource);
            assert.deepStrictEqual(testObject.status, "hasConflicts" /* SyncStatus.HasConflicts */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "conflict" /* MergeState.Conflict */);
            assertConflicts(testObject.conflicts, [preview.resourcePreviews[0].localResource]);
        });
        test('conflicts: preivew -> merge -> accept -> discard', async () => {
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].remoteResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            assert.deepStrictEqual(testObject.status, "syncing" /* SyncStatus.Syncing */);
            assertPreviews(preview.resourcePreviews, [testObject.localResource]);
            assert.strictEqual(preview.resourcePreviews[0].mergeState, "preview" /* MergeState.Preview */);
            assertConflicts(testObject.conflicts, []);
        });
        test('conflicts: preivew -> merge -> discard -> accept -> apply', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const expectedContent = (await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].localResource);
            preview = await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assertConflicts(testObject.conflicts, []);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, expectedContent);
            assert.strictEqual((await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString(), expectedContent);
        });
        test('conflicts: preivew -> accept -> discard -> accept -> apply', async () => {
            var _a;
            const testObject = disposableStore.add(client.instantiationService.createInstance(TestSynchroniser, "settings" /* SyncResource.Settings */));
            testObject.syncResult = { hasConflicts: false, hasError: false };
            testObject.syncBarrier.open();
            await testObject.sync(await client.manifest());
            const expectedContent = (await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString();
            let preview = await testObject.preview(await client.manifest(), {});
            preview = await testObject.merge(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].remoteResource);
            preview = await testObject.discard(preview.resourcePreviews[0].previewResource);
            preview = await testObject.accept(preview.resourcePreviews[0].localResource);
            preview = await testObject.apply(false);
            assert.deepStrictEqual(testObject.status, "idle" /* SyncStatus.Idle */);
            assert.strictEqual(preview, null);
            assertConflicts(testObject.conflicts, []);
            assert.strictEqual((_a = (await testObject.getRemoteUserData(null)).syncData) === null || _a === void 0 ? void 0 : _a.content, expectedContent);
            assert.strictEqual((await client.instantiationService.get(files_1.IFileService).readFile(testObject.localResource)).value.toString(), expectedContent);
        });
    });
    function assertConflicts(actual, expected) {
        assert.deepStrictEqual(actual.map(({ localResource }) => localResource.toString()), expected.map(uri => uri.toString()));
    }
    function assertPreviews(actual, expected) {
        assert.deepStrictEqual(actual.map(({ localResource }) => localResource.toString()), expected.map(uri => uri.toString()));
    }
});
//# sourceMappingURL=synchronizer.test.js.map