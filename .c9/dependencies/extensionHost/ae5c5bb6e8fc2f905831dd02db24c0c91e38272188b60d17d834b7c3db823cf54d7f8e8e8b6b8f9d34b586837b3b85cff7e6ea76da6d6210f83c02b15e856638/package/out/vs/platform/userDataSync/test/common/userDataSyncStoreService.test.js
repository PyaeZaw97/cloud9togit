/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/cancellation", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/uri", "vs/base/test/common/timeTravelScheduler", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/userDataSync/test/common/userDataSyncClient"], function (require, exports, assert, async_1, buffer_1, cancellation_1, event_1, lifecycle_1, platform_1, uri_1, timeTravelScheduler_1, configuration_1, environment_1, files_1, log_1, product_1, productService_1, userDataSync_1, userDataSyncStoreService_1, userDataSyncClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('UserDataSyncStoreManagementService', () => {
        const disposableStore = new lifecycle_1.DisposableStore();
        teardown(() => disposableStore.clear());
        test('test sync store is read from settings', async () => {
            var _a, _b, _c;
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(new userDataSyncClient_1.UserDataSyncTestServer()));
            await client.setUp();
            client.instantiationService.stub(productService_1.IProductService, Object.assign(Object.assign({ _serviceBrand: undefined }, product_1.default), {
                'configurationSync.store': undefined
            }));
            const configuredStore = {
                url: 'http://configureHost:3000',
                stableUrl: 'http://configureHost:3000',
                insidersUrl: 'http://configureHost:3000',
                canSwitch: false,
                authenticationProviders: { 'configuredAuthProvider': { scopes: [] } }
            };
            await client.instantiationService.get(files_1.IFileService).writeFile(client.instantiationService.get(environment_1.IEnvironmentService).settingsResource, buffer_1.VSBuffer.fromString(JSON.stringify({
                'configurationSync.store': configuredStore
            })));
            await client.instantiationService.get(configuration_1.IConfigurationService).reloadConfiguration();
            const expected = {
                url: uri_1.URI.parse('http://configureHost:3000'),
                type: 'stable',
                defaultUrl: uri_1.URI.parse('http://configureHost:3000'),
                stableUrl: uri_1.URI.parse('http://configureHost:3000'),
                insidersUrl: uri_1.URI.parse('http://configureHost:3000'),
                canSwitch: false,
                authenticationProviders: [{ id: 'configuredAuthProvider', scopes: [] }]
            };
            const testObject = disposableStore.add(client.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreManagementService));
            assert.strictEqual((_a = testObject.userDataSyncStore) === null || _a === void 0 ? void 0 : _a.url.toString(), expected.url.toString());
            assert.strictEqual((_b = testObject.userDataSyncStore) === null || _b === void 0 ? void 0 : _b.defaultUrl.toString(), expected.defaultUrl.toString());
            assert.deepStrictEqual((_c = testObject.userDataSyncStore) === null || _c === void 0 ? void 0 : _c.authenticationProviders, expected.authenticationProviders);
        });
    });
    suite('UserDataSyncStoreService', () => {
        const disposableStore = new lifecycle_1.DisposableStore();
        teardown(() => disposableStore.clear());
        test('test read manifest for the first time', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            const productService = client.instantiationService.get(productService_1.IProductService);
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Client-Name'], `${productService.applicationName}${platform_1.isWeb ? '-web' : ''}`);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Client-Version'], productService.version);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test read manifest for the second time when session is not yet created', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test session id header is not set in the first manifest request after session is created', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            await testObject.write("settings" /* SyncResource.Settings */, 'some content', null);
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test session id header is set from the second manifest request after session is created', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            await testObject.write("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test headers are send for write request', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            await testObject.write("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            await testObject.manifest(null);
            target.reset();
            await testObject.write("settings" /* SyncResource.Settings */, 'some content', null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test headers are send for read request', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            await testObject.write("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            await testObject.manifest(null);
            target.reset();
            await testObject.read("settings" /* SyncResource.Settings */, null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test headers are reset after session is cleared ', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            await testObject.write("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            await testObject.manifest(null);
            await testObject.clear();
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test old headers are sent after session is changed on server ', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            await testObject.write("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            const userSessionId = target.requestsWithAllHeaders[0].headers['X-User-Session-Id'];
            await target.clear();
            // client 2
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client2.setUp();
            const testObject2 = client2.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject2.write("settings" /* SyncResource.Settings */, 'some content', null);
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], userSessionId);
        });
        test('test old headers are reset from second request after session is changed on server ', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            await testObject.write("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            const userSessionId = target.requestsWithAllHeaders[0].headers['X-User-Session-Id'];
            await target.clear();
            // client 2
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client2.setUp();
            const testObject2 = client2.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject2.write("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], userSessionId);
        });
        test('test old headers are sent after session is cleared from another server ', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            await testObject.write("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            const userSessionId = target.requestsWithAllHeaders[0].headers['X-User-Session-Id'];
            // client 2
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client2.setUp();
            const testObject2 = client2.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject2.clear();
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], userSessionId);
        });
        test('test headers are reset after session is cleared from another server ', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            await testObject.write("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            // client 2
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client2.setUp();
            const testObject2 = client2.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject2.clear();
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.strictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test headers are reset after session is cleared from another server - started syncing again', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            await testObject.write("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            const machineSessionId = target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'];
            const userSessionId = target.requestsWithAllHeaders[0].headers['X-User-Session-Id'];
            // client 2
            const client2 = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client2.setUp();
            const testObject2 = client2.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject2.clear();
            await testObject.manifest(null);
            await testObject.write("settings" /* SyncResource.Settings */, 'some content', null);
            await testObject.manifest(null);
            target.reset();
            await testObject.manifest(null);
            assert.strictEqual(target.requestsWithAllHeaders.length, 1);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], undefined);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-Machine-Session-Id'], machineSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], userSessionId);
            assert.notStrictEqual(target.requestsWithAllHeaders[0].headers['X-User-Session-Id'], undefined);
        });
        test('test rate limit on server with retry after', async () => {
            const target = new userDataSyncClient_1.UserDataSyncTestServer(1, 1);
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            const promise = event_1.Event.toPromise(testObject.onDidChangeDonotMakeRequestsUntil);
            try {
                await testObject.manifest(null);
                assert.fail('should fail');
            }
            catch (e) {
                assert.ok(e instanceof userDataSync_1.UserDataSyncStoreError);
                assert.deepStrictEqual(e.code, "TooManyRequestsAndRetryAfter" /* UserDataSyncErrorCode.TooManyRequestsAndRetryAfter */);
                await promise;
                assert.ok(!!testObject.donotMakeRequestsUntil);
            }
        });
        test('test donotMakeRequestsUntil is reset after retry time is finished', async () => {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(new userDataSyncClient_1.UserDataSyncTestServer(1, 0.25)));
                await client.setUp();
                const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
                await testObject.manifest(null);
                try {
                    await testObject.manifest(null);
                    assert.fail('should fail');
                }
                catch (e) { }
                const promise = event_1.Event.toPromise(testObject.onDidChangeDonotMakeRequestsUntil);
                await (0, async_1.timeout)(300);
                await promise;
                assert.ok(!testObject.donotMakeRequestsUntil);
            });
        });
        test('test donotMakeRequestsUntil is retrieved', async () => {
            var _a, _b;
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(new userDataSyncClient_1.UserDataSyncTestServer(1, 1)));
            await client.setUp();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            await testObject.manifest(null);
            try {
                await testObject.manifest(null);
            }
            catch (e) { }
            const target = disposableStore.add(client.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreService));
            assert.strictEqual((_a = target.donotMakeRequestsUntil) === null || _a === void 0 ? void 0 : _a.getTime(), (_b = testObject.donotMakeRequestsUntil) === null || _b === void 0 ? void 0 : _b.getTime());
        });
        test('test donotMakeRequestsUntil is checked and reset after retreived', async () => {
            return (0, timeTravelScheduler_1.runWithFakedTimers)({ useFakeTimers: true }, async () => {
                const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(new userDataSyncClient_1.UserDataSyncTestServer(1, 0.25)));
                await client.setUp();
                const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
                await testObject.manifest(null);
                try {
                    await testObject.manifest(null);
                    assert.fail('should fail');
                }
                catch (e) { }
                await (0, async_1.timeout)(300);
                const target = disposableStore.add(client.instantiationService.createInstance(userDataSyncStoreService_1.UserDataSyncStoreService));
                assert.ok(!target.donotMakeRequestsUntil);
            });
        });
        test('test read resource request handles 304', async () => {
            // Setup the client
            const target = new userDataSyncClient_1.UserDataSyncTestServer();
            const client = disposableStore.add(new userDataSyncClient_1.UserDataSyncClient(target));
            await client.setUp();
            await client.sync();
            const testObject = client.instantiationService.get(userDataSync_1.IUserDataSyncStoreService);
            const expected = await testObject.read("settings" /* SyncResource.Settings */, null);
            const actual = await testObject.read("settings" /* SyncResource.Settings */, expected);
            assert.strictEqual(actual, expected);
        });
    });
    suite('UserDataSyncRequestsSession', () => {
        const requestService = {
            _serviceBrand: undefined,
            async request() { return { res: { headers: {} }, stream: (0, buffer_1.newWriteableBufferStream)() }; },
            async resolveProxy() { return undefined; }
        };
        test('too many requests are thrown when limit exceeded', async () => {
            const testObject = new userDataSyncStoreService_1.RequestsSession(1, 500, requestService, new log_1.NullLogService());
            await testObject.request('url', {}, cancellation_1.CancellationToken.None);
            try {
                await testObject.request('url', {}, cancellation_1.CancellationToken.None);
            }
            catch (error) {
                assert.ok(error instanceof userDataSync_1.UserDataSyncStoreError);
                assert.strictEqual(error.code, "LocalTooManyRequests" /* UserDataSyncErrorCode.LocalTooManyRequests */);
                return;
            }
            assert.fail('Should fail with limit exceeded');
        });
        test('requests are handled after session is expired', async () => {
            const testObject = new userDataSyncStoreService_1.RequestsSession(1, 100, requestService, new log_1.NullLogService());
            await testObject.request('url', {}, cancellation_1.CancellationToken.None);
            await (0, async_1.timeout)(125);
            await testObject.request('url', {}, cancellation_1.CancellationToken.None);
        });
        test('too many requests are thrown after session is expired', async () => {
            const testObject = new userDataSyncStoreService_1.RequestsSession(1, 100, requestService, new log_1.NullLogService());
            await testObject.request('url', {}, cancellation_1.CancellationToken.None);
            await (0, async_1.timeout)(125);
            await testObject.request('url', {}, cancellation_1.CancellationToken.None);
            try {
                await testObject.request('url', {}, cancellation_1.CancellationToken.None);
            }
            catch (error) {
                assert.ok(error instanceof userDataSync_1.UserDataSyncStoreError);
                assert.strictEqual(error.code, "LocalTooManyRequests" /* UserDataSyncErrorCode.LocalTooManyRequests */);
                return;
            }
            assert.fail('Should fail with limit exceeded');
        });
    });
});
//# sourceMappingURL=userDataSyncStoreService.test.js.map