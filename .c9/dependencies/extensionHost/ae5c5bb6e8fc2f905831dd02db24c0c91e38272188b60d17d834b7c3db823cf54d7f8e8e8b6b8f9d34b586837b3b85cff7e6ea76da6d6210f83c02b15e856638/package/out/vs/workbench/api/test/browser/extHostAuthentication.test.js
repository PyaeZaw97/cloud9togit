/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/api/browser/mainThreadAuthentication", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostAuthentication", "vs/workbench/services/activity/common/activity", "vs/workbench/services/authentication/browser/authenticationService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/api/test/common/testRPCProtocol", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, lifecycle_1, dialogs_1, testDialogService_1, instantiationServiceMock_1, notification_1, testNotificationService_1, quickInput_1, storage_1, telemetry_1, telemetryUtils_1, mainThreadAuthentication_1, extHost_protocol_1, extHostAuthentication_1, activity_1, authenticationService_1, authentication_1, extensions_1, remoteAgentService_1, testRPCProtocol_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AuthQuickPick {
        constructor() {
            this.items = [];
        }
        get selectedItems() {
            return this.items;
        }
        onDidAccept(listener) {
            this.listener = listener;
        }
        onDidHide(listener) {
        }
        dispose() {
        }
        show() {
            this.listener({
                inBackground: false
            });
        }
    }
    class AuthTestQuickInputService extends workbenchTestServices_1.TestQuickInputService {
        createQuickPick() {
            return new AuthQuickPick();
        }
    }
    class TestAuthProvider {
        constructor() {
            this.id = 1;
            this.sessions = new Map();
            this.onDidChangeSessions = () => { return { dispose() { } }; };
        }
        async getSessions(scopes) {
            if (!scopes) {
                return [...this.sessions.values()];
            }
            if (scopes[0] === 'return multiple') {
                return [...this.sessions.values()];
            }
            const sessions = this.sessions.get(scopes.join(' '));
            return sessions ? [sessions] : [];
        }
        async createSession(scopes) {
            const scopesStr = scopes.join(' ');
            const session = {
                scopes,
                id: `${this.id}`,
                account: {
                    label: `${this.id}`,
                    id: `${this.id}`,
                },
                accessToken: Math.random() + '',
            };
            this.sessions.set(scopesStr, session);
            this.id++;
            return session;
        }
        async removeSession(sessionId) {
            this.sessions.delete(sessionId);
        }
    }
    suite('ExtHostAuthentication', () => {
        let disposables;
        let extHostAuthentication;
        let instantiationService;
        suiteSetup(async () => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(dialogs_1.IDialogService, new testDialogService_1.TestDialogService());
            instantiationService.stub(storage_1.IStorageService, new workbenchTestServices_2.TestStorageService());
            instantiationService.stub(quickInput_1.IQuickInputService, new AuthTestQuickInputService());
            instantiationService.stub(extensions_1.IExtensionService, new workbenchTestServices_2.TestExtensionService());
            instantiationService.stub(activity_1.IActivityService, new workbenchTestServices_2.TestActivityService());
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, new workbenchTestServices_1.TestRemoteAgentService());
            instantiationService.stub(notification_1.INotificationService, new testNotificationService_1.TestNotificationService());
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            const rpcProtocol = new testRPCProtocol_1.TestRPCProtocol();
            instantiationService.stub(authentication_1.IAuthenticationService, instantiationService.createInstance(authenticationService_1.AuthenticationService));
            rpcProtocol.set(extHost_protocol_1.MainContext.MainThreadAuthentication, instantiationService.createInstance(mainThreadAuthentication_1.MainThreadAuthentication, rpcProtocol));
            extHostAuthentication = new extHostAuthentication_1.ExtHostAuthentication(rpcProtocol);
            rpcProtocol.set(extHost_protocol_1.ExtHostContext.ExtHostAuthentication, extHostAuthentication);
        });
        setup(async () => {
            disposables = new lifecycle_1.DisposableStore();
            disposables.add(extHostAuthentication.registerAuthenticationProvider('test', 'test provider', new TestAuthProvider()));
            disposables.add(extHostAuthentication.registerAuthenticationProvider('test-multiple', 'test multiple provider', new TestAuthProvider(), { supportsMultipleAccounts: true }));
        });
        teardown(() => {
            disposables.dispose();
        });
        test('createIfNone - true', async () => {
            const scopes = ['foo'];
            const session = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', scopes, {
                createIfNone: true
            });
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.id, '1');
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.scopes[0], 'foo');
        });
        test('createIfNone - false', async () => {
            const scopes = ['foo'];
            const nosession = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', scopes, {});
            assert.strictEqual(nosession, undefined);
            // Now create the session
            const session = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', scopes, {
                createIfNone: true
            });
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.id, '1');
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.scopes[0], 'foo');
            const session2 = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', scopes, {});
            assert.strictEqual(session.id, session2 === null || session2 === void 0 ? void 0 : session2.id);
            assert.strictEqual(session.scopes[0], session2 === null || session2 === void 0 ? void 0 : session2.scopes[0]);
            assert.strictEqual(session.accessToken, session2 === null || session2 === void 0 ? void 0 : session2.accessToken);
        });
        // should behave the same as createIfNone: false
        test('silent - true', async () => {
            const scopes = ['foo'];
            const nosession = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', scopes, {
                silent: true
            });
            assert.strictEqual(nosession, undefined);
            // Now create the session
            const session = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', scopes, {
                createIfNone: true
            });
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.id, '1');
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.scopes[0], 'foo');
            const session2 = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', scopes, {
                silent: true
            });
            assert.strictEqual(session.id, session2 === null || session2 === void 0 ? void 0 : session2.id);
            assert.strictEqual(session.scopes[0], session2 === null || session2 === void 0 ? void 0 : session2.scopes[0]);
        });
        test('forceNewSession - true', async () => {
            const scopes = ['foo'];
            const session1 = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', scopes, {
                createIfNone: true
            });
            // Now create the session
            const session2 = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', scopes, {
                forceNewSession: true
            });
            assert.strictEqual(session2 === null || session2 === void 0 ? void 0 : session2.id, '2');
            assert.strictEqual(session2 === null || session2 === void 0 ? void 0 : session2.scopes[0], 'foo');
            assert.notStrictEqual(session1.accessToken, session2 === null || session2 === void 0 ? void 0 : session2.accessToken);
        });
        test('forceNewSession - detail', async () => {
            const scopes = ['foo'];
            const session1 = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', scopes, {
                createIfNone: true
            });
            // Now create the session
            const session2 = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', scopes, {
                forceNewSession: { detail: 'bar' }
            });
            assert.strictEqual(session2 === null || session2 === void 0 ? void 0 : session2.id, '2');
            assert.strictEqual(session2 === null || session2 === void 0 ? void 0 : session2.scopes[0], 'foo');
            assert.notStrictEqual(session1.accessToken, session2 === null || session2 === void 0 ? void 0 : session2.accessToken);
        });
        //#region Multi-Account AuthProvider
        test('clearSessionPreference - true', async () => {
            const scopes = ['foo'];
            // Now create the session
            const session = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test-multiple', scopes, {
                createIfNone: true
            });
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.id, '1');
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.scopes[0], scopes[0]);
            const scopes2 = ['bar'];
            const session2 = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test-multiple', scopes2, {
                createIfNone: true
            });
            assert.strictEqual(session2 === null || session2 === void 0 ? void 0 : session2.id, '2');
            assert.strictEqual(session2 === null || session2 === void 0 ? void 0 : session2.scopes[0], scopes2[0]);
            const session3 = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test-multiple', ['return multiple'], {
                clearSessionPreference: true,
                createIfNone: true
            });
            // clearing session preference causes us to get the first session
            // because it would normally show a quick pick for the user to choose
            assert.strictEqual(session.id, session3 === null || session3 === void 0 ? void 0 : session3.id);
            assert.strictEqual(session.scopes[0], session3 === null || session3 === void 0 ? void 0 : session3.scopes[0]);
            assert.strictEqual(session.accessToken, session3 === null || session3 === void 0 ? void 0 : session3.accessToken);
        });
        test('silently getting session should return a session (if any) regardless of preference - fixes #137819', async () => {
            const scopes = ['foo'];
            // Now create the session
            const session = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test-multiple', scopes, {
                createIfNone: true
            });
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.id, '1');
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.scopes[0], scopes[0]);
            const scopes2 = ['bar'];
            const session2 = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test-multiple', scopes2, {
                createIfNone: true
            });
            assert.strictEqual(session2 === null || session2 === void 0 ? void 0 : session2.id, '2');
            assert.strictEqual(session2 === null || session2 === void 0 ? void 0 : session2.scopes[0], scopes2[0]);
            const shouldBeSession1 = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test-multiple', scopes, {});
            assert.strictEqual(session.id, shouldBeSession1 === null || shouldBeSession1 === void 0 ? void 0 : shouldBeSession1.id);
            assert.strictEqual(session.scopes[0], shouldBeSession1 === null || shouldBeSession1 === void 0 ? void 0 : shouldBeSession1.scopes[0]);
            assert.strictEqual(session.accessToken, shouldBeSession1 === null || shouldBeSession1 === void 0 ? void 0 : shouldBeSession1.accessToken);
            const shouldBeSession2 = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test-multiple', scopes2, {});
            assert.strictEqual(session2.id, shouldBeSession2 === null || shouldBeSession2 === void 0 ? void 0 : shouldBeSession2.id);
            assert.strictEqual(session2.scopes[0], shouldBeSession2 === null || shouldBeSession2 === void 0 ? void 0 : shouldBeSession2.scopes[0]);
            assert.strictEqual(session2.accessToken, shouldBeSession2 === null || shouldBeSession2 === void 0 ? void 0 : shouldBeSession2.accessToken);
        });
        //#endregion
        //#region error cases
        test('forceNewSession with no sessions', async () => {
            try {
                await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', ['foo'], {
                    forceNewSession: true
                });
                assert.fail('should have thrown an Error.');
            }
            catch (e) {
                assert.strictEqual(e.message, 'No existing sessions found.');
            }
        });
        test('createIfNone and forceNewSession', async () => {
            try {
                await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', ['foo'], {
                    createIfNone: true,
                    forceNewSession: true
                });
                assert.fail('should have thrown an Error.');
            }
            catch (e) {
                assert.ok(e);
            }
        });
        test('forceNewSession and silent', async () => {
            try {
                await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', ['foo'], {
                    forceNewSession: true,
                    silent: true
                });
                assert.fail('should have thrown an Error.');
            }
            catch (e) {
                assert.ok(e);
            }
        });
        test('createIfNone and silent', async () => {
            try {
                await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test', ['foo'], {
                    createIfNone: true,
                    silent: true
                });
                assert.fail('should have thrown an Error.');
            }
            catch (e) {
                assert.ok(e);
            }
        });
        test('Can get multiple sessions (with different scopes) in one extension', async () => {
            let session = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test-multiple', ['foo'], {
                createIfNone: true
            });
            session = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test-multiple', ['bar'], {
                createIfNone: true
            });
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.id, '2');
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.scopes[0], 'bar');
            session = await extHostAuthentication.getSession(extensions_1.nullExtensionDescription, 'test-multiple', ['foo'], {
                createIfNone: false
            });
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.id, '1');
            assert.strictEqual(session === null || session === void 0 ? void 0 : session.scopes[0], 'foo');
        });
        //#endregion
    });
});
//# sourceMappingURL=extHostAuthentication.test.js.map