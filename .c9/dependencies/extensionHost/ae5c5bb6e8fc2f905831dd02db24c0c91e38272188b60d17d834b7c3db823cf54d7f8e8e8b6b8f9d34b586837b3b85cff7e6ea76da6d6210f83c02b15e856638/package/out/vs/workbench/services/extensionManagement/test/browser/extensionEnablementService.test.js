define(["require", "exports", "assert", "sinon", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/browser/extensionEnablementService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/event", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/configuration/common/configuration", "vs/base/common/uri", "vs/base/common/network", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/extensionManagement/common/extensionEnablementService", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/workbench/services/host/browser/host", "vs/base/test/common/mock", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/workspaces/test/common/testWorkspaceTrustService", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/workbench/test/common/workbenchTestServices", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/services/extensionManagement/common/extensionManagementService", "vs/platform/log/common/log"], function (require, exports, assert, sinon, extensionManagement_1, extensionManagement_2, extensionEnablementService_1, instantiationServiceMock_1, event_1, workspace_1, environmentService_1, storage_1, types_1, extensionManagementUtil_1, configuration_1, uri_1, network_1, testConfigurationService_1, workbenchTestServices_1, extensionEnablementService_2, userDataSyncAccount_1, userDataSync_1, lifecycle_1, notification_1, testNotificationService_1, host_1, mock_1, workspaceTrust_1, testWorkspaceTrustService_1, extensionManifestPropertiesService_1, workbenchTestServices_2, testWorkspace_1, extensionManagementService_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.anExtensionManagementServerService = exports.TestExtensionEnablementService = void 0;
    function createStorageService(instantiationService) {
        let service = instantiationService.get(storage_1.IStorageService);
        if (!service) {
            let workspaceContextService = instantiationService.get(workspace_1.IWorkspaceContextService);
            if (!workspaceContextService) {
                workspaceContextService = instantiationService.stub(workspace_1.IWorkspaceContextService, {
                    getWorkbenchState: () => 2 /* WorkbenchState.FOLDER */,
                    getWorkspace: () => testWorkspace_1.TestWorkspace
                });
            }
            service = instantiationService.stub(storage_1.IStorageService, new storage_1.InMemoryStorageService());
        }
        return service;
    }
    class TestExtensionEnablementService extends extensionEnablementService_1.ExtensionEnablementService {
        constructor(instantiationService) {
            const storageService = createStorageService(instantiationService);
            const extensionManagementServerService = instantiationService.get(extensionManagement_2.IExtensionManagementServerService) ||
                instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService({
                    id: 'local',
                    label: 'local',
                    extensionManagementService: {
                        onInstallExtension: new event_1.Emitter().event,
                        onDidInstallExtensions: new event_1.Emitter().event,
                        onUninstallExtension: new event_1.Emitter().event,
                        onDidUninstallExtension: new event_1.Emitter().event,
                    },
                }, null, null));
            const extensionManagementService = instantiationService.createInstance(extensionManagementService_1.ExtensionManagementService);
            const workbenchExtensionManagementService = instantiationService.get(extensionManagement_2.IWorkbenchExtensionManagementService) || instantiationService.stub(extensionManagement_2.IWorkbenchExtensionManagementService, extensionManagementService);
            const workspaceTrustManagementService = instantiationService.get(workspaceTrust_1.IWorkspaceTrustManagementService) || instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, new testWorkspaceTrustService_1.TestWorkspaceTrustManagementService());
            super(storageService, new extensionEnablementService_2.GlobalExtensionEnablementService(storageService, extensionManagementService), instantiationService.get(workspace_1.IWorkspaceContextService) || new workbenchTestServices_2.TestContextService(), instantiationService.get(environmentService_1.IWorkbenchEnvironmentService) || instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, {}), workbenchExtensionManagementService, instantiationService.get(configuration_1.IConfigurationService), extensionManagementServerService, instantiationService.get(userDataSync_1.IUserDataSyncEnablementService) || instantiationService.stub(userDataSync_1.IUserDataSyncEnablementService, { isEnabled() { return false; } }), instantiationService.get(userDataSyncAccount_1.IUserDataSyncAccountService) || instantiationService.stub(userDataSyncAccount_1.IUserDataSyncAccountService, userDataSyncAccount_1.UserDataSyncAccountService), instantiationService.get(lifecycle_1.ILifecycleService) || instantiationService.stub(lifecycle_1.ILifecycleService, new workbenchTestServices_1.TestLifecycleService()), instantiationService.get(notification_1.INotificationService) || instantiationService.stub(notification_1.INotificationService, new testNotificationService_1.TestNotificationService()), instantiationService.get(host_1.IHostService), new class extends (0, mock_1.mock)() {
                isDisabledByBisect() { return false; }
            }, workspaceTrustManagementService, new class extends (0, mock_1.mock)() {
                requestWorkspaceTrust(options) { return Promise.resolve(true); }
            }, instantiationService.get(extensionManifestPropertiesService_1.IExtensionManifestPropertiesService) || instantiationService.stub(extensionManifestPropertiesService_1.IExtensionManifestPropertiesService, new extensionManifestPropertiesService_1.ExtensionManifestPropertiesService(workbenchTestServices_2.TestProductService, new testConfigurationService_1.TestConfigurationService(), new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService(), new log_1.NullLogService())), instantiationService);
        }
        async waitUntilInitialized() {
            await this.extensionsManager.whenInitialized();
        }
        reset() {
            let extensions = this.globalExtensionEnablementService.getDisabledExtensions();
            for (const e of this._getWorkspaceDisabledExtensions()) {
                if (!extensions.some(r => (0, extensionManagementUtil_1.areSameExtensions)(r, e))) {
                    extensions.push(e);
                }
            }
            const workspaceEnabledExtensions = this._getWorkspaceEnabledExtensions();
            if (workspaceEnabledExtensions.length) {
                extensions = extensions.filter(r => !workspaceEnabledExtensions.some(e => (0, extensionManagementUtil_1.areSameExtensions)(e, r)));
            }
            extensions.forEach(d => this.setEnablement([aLocalExtension(d.id)], 8 /* EnablementState.EnabledGlobally */));
        }
    }
    exports.TestExtensionEnablementService = TestExtensionEnablementService;
    suite('ExtensionEnablementService Test', () => {
        let instantiationService;
        let testObject;
        const didInstallEvent = new event_1.Emitter();
        const didUninstallEvent = new event_1.Emitter();
        const installed = [];
        setup(() => {
            installed.splice(0, installed.length);
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService({
                id: 'local',
                label: 'local',
                extensionManagementService: {
                    onDidInstallExtensions: didInstallEvent.event,
                    onDidUninstallExtension: didUninstallEvent.event,
                    getInstalled: () => Promise.resolve(installed)
                },
            }, null, null));
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionManagementService, instantiationService.createInstance(extensionManagementService_1.ExtensionManagementService));
            testObject = new TestExtensionEnablementService(instantiationService);
        });
        teardown(() => {
            testObject.dispose();
        });
        test('test disable an extension globally', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            assert.ok(!testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 6 /* EnablementState.DisabledGlobally */);
        });
        test('test disable an extension globally should return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(value => assert.ok(value));
        });
        test('test disable an extension globally triggers the change event', async () => {
            const target = sinon.spy();
            testObject.onEnablementChanged(target);
            await testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */);
            assert.ok(target.calledOnce);
            assert.deepStrictEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
        });
        test('test disable an extension globally again should return a falsy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */))
                .then(value => assert.ok(!value[0]));
        });
        test('test state of globally disabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 6 /* EnablementState.DisabledGlobally */));
        });
        test('test state of globally enabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 8 /* EnablementState.EnabledGlobally */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 8 /* EnablementState.EnabledGlobally */));
        });
        test('test disable an extension for workspace', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            assert.ok(!testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 7 /* EnablementState.DisabledWorkspace */);
        });
        test('test disable an extension for workspace returns a truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(value => assert.ok(value));
        });
        test('test disable an extension for workspace again should return a falsy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */))
                .then(value => assert.ok(!value[0]));
        });
        test('test state of workspace disabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 7 /* EnablementState.DisabledWorkspace */));
        });
        test('test state of workspace and globally disabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 7 /* EnablementState.DisabledWorkspace */));
        });
        test('test state of workspace enabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 9 /* EnablementState.EnabledWorkspace */));
        });
        test('test state of globally disabled and workspace enabled extension', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 9 /* EnablementState.EnabledWorkspace */));
        });
        test('test state of an extension when disabled for workspace from workspace enabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 7 /* EnablementState.DisabledWorkspace */));
        });
        test('test state of an extension when disabled globally from workspace enabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 6 /* EnablementState.DisabledGlobally */));
        });
        test('test state of an extension when disabled globally from workspace disabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 6 /* EnablementState.DisabledGlobally */));
        });
        test('test state of an extension when enabled globally from workspace enabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 8 /* EnablementState.EnabledGlobally */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 8 /* EnablementState.EnabledGlobally */));
        });
        test('test state of an extension when enabled globally from workspace disabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 8 /* EnablementState.EnabledGlobally */))
                .then(() => assert.strictEqual(testObject.getEnablementState(aLocalExtension('pub.a')), 8 /* EnablementState.EnabledGlobally */));
        });
        test('test disable an extension for workspace and then globally', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            assert.ok(!testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 6 /* EnablementState.DisabledGlobally */);
        });
        test('test disable an extension for workspace and then globally return a truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */))
                .then(value => assert.ok(value));
        });
        test('test disable an extension for workspace and then globally trigger the change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.onEnablementChanged(target))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepStrictEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test disable an extension globally and then for workspace', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            assert.ok(!testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 7 /* EnablementState.DisabledWorkspace */);
        });
        test('test disable an extension globally and then for workspace return a truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */))
                .then(value => assert.ok(value));
        });
        test('test disable an extension globally and then for workspace triggers the change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => testObject.onEnablementChanged(target))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepStrictEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test disable an extension for workspace when there is no workspace throws error', () => {
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkbenchState', 1 /* WorkbenchState.EMPTY */);
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => assert.fail('should throw an error'), error => assert.ok(error));
        });
        test('test enable an extension globally', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([extension], 8 /* EnablementState.EnabledGlobally */);
            assert.ok(testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test enable an extension globally return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 8 /* EnablementState.EnabledGlobally */))
                .then(value => assert.ok(value));
        });
        test('test enable an extension globally triggers change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => testObject.onEnablementChanged(target))
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 8 /* EnablementState.EnabledGlobally */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepStrictEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            });
        });
        test('test enable an extension globally when already enabled return falsy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 8 /* EnablementState.EnabledGlobally */)
                .then(value => assert.ok(!value[0]));
        });
        test('test enable an extension for workspace', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            await testObject.setEnablement([extension], 9 /* EnablementState.EnabledWorkspace */);
            assert.ok(testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 9 /* EnablementState.EnabledWorkspace */);
        });
        test('test enable an extension for workspace return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */))
                .then(value => assert.ok(value));
        });
        test('test enable an extension for workspace triggers change event', () => {
            const target = sinon.spy();
            return testObject.setEnablement([aLocalExtension('pub.b')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.onEnablementChanged(target))
                .then(() => testObject.setEnablement([aLocalExtension('pub.b')], 9 /* EnablementState.EnabledWorkspace */))
                .then(() => {
                assert.ok(target.calledOnce);
                assert.deepStrictEqual(target.args[0][0][0].identifier, { id: 'pub.b' });
            });
        });
        test('test enable an extension for workspace when already enabled return truthy promise', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 9 /* EnablementState.EnabledWorkspace */)
                .then(value => assert.ok(value));
        });
        test('test enable an extension for workspace when disabled in workspace and gloablly', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([extension], 9 /* EnablementState.EnabledWorkspace */);
            assert.ok(testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 9 /* EnablementState.EnabledWorkspace */);
        });
        test('test enable an extension globally when disabled in workspace and gloablly', async () => {
            const extension = aLocalExtension('pub.a');
            await testObject.setEnablement([extension], 9 /* EnablementState.EnabledWorkspace */);
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([extension], 8 /* EnablementState.EnabledGlobally */);
            assert.ok(testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test enable an extension also enables dependencies', async () => {
            installed.push(...[aLocalExtension2('pub.a', { extensionDependencies: ['pub.b'] }), aLocalExtension('pub.b')]);
            const target = installed[0];
            const dep = installed[1];
            await testObject.waitUntilInitialized();
            await testObject.setEnablement([dep, target], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([target], 8 /* EnablementState.EnabledGlobally */);
            assert.ok(testObject.isEnabled(target));
            assert.ok(testObject.isEnabled(dep));
            assert.strictEqual(testObject.getEnablementState(target), 8 /* EnablementState.EnabledGlobally */);
            assert.strictEqual(testObject.getEnablementState(dep), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test enable an extension also enables packed extensions', async () => {
            installed.push(...[aLocalExtension2('pub.a', { extensionPack: ['pub.b'] }), aLocalExtension('pub.b')]);
            const target = installed[0];
            const dep = installed[1];
            await testObject.setEnablement([dep, target], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([target], 8 /* EnablementState.EnabledGlobally */);
            assert.ok(testObject.isEnabled(target));
            assert.ok(testObject.isEnabled(dep));
            assert.strictEqual(testObject.getEnablementState(target), 8 /* EnablementState.EnabledGlobally */);
            assert.strictEqual(testObject.getEnablementState(dep), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test remove an extension from disablement list when uninstalled', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            testObject = new TestExtensionEnablementService(instantiationService);
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            didUninstallEvent.fire({ identifier: { id: 'pub.a' } });
            assert.ok(testObject.isEnabled(extension));
            assert.strictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test isEnabled return false extension is disabled globally', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 6 /* EnablementState.DisabledGlobally */)
                .then(() => assert.ok(!testObject.isEnabled(aLocalExtension('pub.a'))));
        });
        test('test isEnabled return false extension is disabled in workspace', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => assert.ok(!testObject.isEnabled(aLocalExtension('pub.a'))));
        });
        test('test isEnabled return true extension is not disabled', () => {
            return testObject.setEnablement([aLocalExtension('pub.a')], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => testObject.setEnablement([aLocalExtension('pub.c')], 6 /* EnablementState.DisabledGlobally */))
                .then(() => assert.ok(testObject.isEnabled(aLocalExtension('pub.b'))));
        });
        test('test canChangeEnablement return false for language packs', () => {
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a', { localizations: [{ languageId: 'gr', translations: [{ id: 'vscode', path: 'path' }] }] })), false);
        });
        test('test canChangeEnablement return true for auth extension', () => {
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a', { authentication: [{ id: 'a', label: 'a' }] })), true);
        });
        test('test canChangeEnablement return true for auth extension when user data sync account does not depends on it', () => {
            instantiationService.stub(userDataSyncAccount_1.IUserDataSyncAccountService, {
                account: { authenticationProviderId: 'b' }
            });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a', { authentication: [{ id: 'a', label: 'a' }] })), true);
        });
        test('test canChangeEnablement return true for auth extension when user data sync account depends on it but auto sync is off', () => {
            instantiationService.stub(userDataSyncAccount_1.IUserDataSyncAccountService, {
                account: { authenticationProviderId: 'a' }
            });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a', { authentication: [{ id: 'a', label: 'a' }] })), true);
        });
        test('test canChangeEnablement return false for auth extension and user data sync account depends on it and auto sync is on', () => {
            instantiationService.stub(userDataSync_1.IUserDataSyncEnablementService, { isEnabled() { return true; } });
            instantiationService.stub(userDataSyncAccount_1.IUserDataSyncAccountService, {
                account: { authenticationProviderId: 'a' }
            });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a', { authentication: [{ id: 'a', label: 'a' }] })), false);
        });
        test('test canChangeWorkspaceEnablement return true', () => {
            assert.strictEqual(testObject.canChangeWorkspaceEnablement(aLocalExtension('pub.a')), true);
        });
        test('test canChangeWorkspaceEnablement return false if there is no workspace', () => {
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkbenchState', 1 /* WorkbenchState.EMPTY */);
            assert.strictEqual(testObject.canChangeWorkspaceEnablement(aLocalExtension('pub.a')), false);
        });
        test('test canChangeWorkspaceEnablement return false for auth extension', () => {
            assert.strictEqual(testObject.canChangeWorkspaceEnablement(aLocalExtension('pub.a', { authentication: [{ id: 'a', label: 'a' }] })), false);
        });
        test('test canChangeEnablement return false when extensions are disabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: true });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a')), false);
        });
        test('test canChangeEnablement return false when the extension is disabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a')), false);
        });
        test('test canChangeEnablement return true for system extensions when extensions are disabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: true });
            testObject = new TestExtensionEnablementService(instantiationService);
            const extension = aLocalExtension('pub.a', undefined, 0 /* ExtensionType.System */);
            assert.strictEqual(testObject.canChangeEnablement(extension), true);
        });
        test('test canChangeEnablement return false for system extension when extension is disabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            const extension = aLocalExtension('pub.a', undefined, 0 /* ExtensionType.System */);
            assert.ok(!testObject.canChangeEnablement(extension));
        });
        test('test extension is disabled when disabled in environment', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(!testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 2 /* EnablementState.DisabledByEnvironment */);
        });
        test('test extension is enabled globally when enabled in environment', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { enableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension is enabled workspace when enabled in environment', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            await testObject.setEnablement([extension], 9 /* EnablementState.EnabledWorkspace */);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { enableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 9 /* EnablementState.EnabledWorkspace */);
        });
        test('test extension is enabled by environment when disabled globally', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            await testObject.setEnablement([extension], 6 /* EnablementState.DisabledGlobally */);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { enableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 3 /* EnablementState.EnabledByEnvironment */);
        });
        test('test extension is enabled by environment when disabled workspace', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            await testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { enableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 3 /* EnablementState.EnabledByEnvironment */);
        });
        test('test extension is disabled by environment when also enabled in environment', async () => {
            const extension = aLocalExtension('pub.a');
            installed.push(extension);
            testObject.setEnablement([extension], 7 /* EnablementState.DisabledWorkspace */);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { disableExtensions: true, enableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(!testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 2 /* EnablementState.DisabledByEnvironment */);
        });
        test('test canChangeEnablement return false when the extension is enabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { enableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.canChangeEnablement(aLocalExtension('pub.a')), false);
        });
        test('test canChangeEnablement return false for system extension when extension is disabled in environment', () => {
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, { enableExtensions: ['pub.a'] });
            testObject = new TestExtensionEnablementService(instantiationService);
            const extension = aLocalExtension('pub.a', undefined, 0 /* ExtensionType.System */);
            assert.ok(!testObject.canChangeEnablement(extension));
        });
        test('test extension does not support vitrual workspace is not enabled in virtual workspace', async () => {
            const extension = aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false } });
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(!testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 4 /* EnablementState.DisabledByVirtualWorkspace */);
        });
        test('test web extension from web extension management server and does not support vitrual workspace is enabled in virtual workspace', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(null, anExtensionManagementServer('vscode-remote', instantiationService), anExtensionManagementServer('web', instantiationService)));
            const extension = aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false }, browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'web' }) });
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test web extension from remote extension management server and does not support vitrual workspace is disabled in virtual workspace', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(null, anExtensionManagementServer('vscode-remote', instantiationService), anExtensionManagementServer('web', instantiationService)));
            const extension = aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false }, browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'vscode-remote' }) });
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(!testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 4 /* EnablementState.DisabledByVirtualWorkspace */);
        });
        test('test canChangeEnablement return false when extension is disabled in virtual workspace', () => {
            const extension = aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false } });
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(!testObject.canChangeEnablement(extension));
        });
        test('test extension does not support vitrual workspace is enabled in normal workspace', async () => {
            const extension = aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false } });
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA') }] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension supports virtual workspace is enabled in virtual workspace', async () => {
            const extension = aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: true } });
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension does not support untrusted workspaces is disabled in untrusted workspace', () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: 'hello' } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return false; } });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.getEnablementState(extension), 0 /* EnablementState.DisabledByTrustRequirement */);
        });
        test('test canChangeEnablement return true when extension is disabled by workspace trust', () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: 'hello' } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return false; } });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.canChangeEnablement(extension));
        });
        test('test extension supports untrusted workspaces is enabled in untrusted workspace', () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: true } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return false; } });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension does not support untrusted workspaces is enabled in trusted workspace', () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: '' } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return true; } });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension supports untrusted workspaces is enabled in trusted workspace', () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: true } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return true; } });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension without any value for virtual worksapce is enabled in virtual workspace', async () => {
            const extension = aLocalExtension2('pub.a');
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(extension));
            assert.deepStrictEqual(testObject.getEnablementState(extension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test local workspace extension is disabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(!testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 1 /* EnablementState.DisabledByExtensionKind */);
        });
        test('test local workspace + ui extension is enabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['workspace', 'ui'] }, { location: uri_1.URI.file(`pub.a`) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test local ui extension is not disabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test canChangeEnablement return true when the local workspace extension is disabled by kind', () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.canChangeEnablement(localWorkspaceExtension), false);
        });
        test('test canChangeEnablement return true for local ui extension', () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.canChangeEnablement(localWorkspaceExtension), true);
        });
        test('test remote ui extension is disabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(!testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 1 /* EnablementState.DisabledByExtensionKind */);
        });
        test('test remote ui+workspace extension is disabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test remote ui extension is disabled by kind when there is no local server', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(null, anExtensionManagementServer('vscode-remote', instantiationService), null));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(!testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 1 /* EnablementState.DisabledByExtensionKind */);
        });
        test('test remote workspace extension is not disabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.ok(testObject.isEnabled(localWorkspaceExtension));
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test canChangeEnablement return true when the remote ui extension is disabled by kind', () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.canChangeEnablement(localWorkspaceExtension), false);
        });
        test('test canChangeEnablement return true for remote workspace extension', () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.canChangeEnablement(localWorkspaceExtension), true);
        });
        test('test web extension on local server is disabled by kind when web worker is not enabled', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`) });
            instantiationService.get(configuration_1.IConfigurationService).setUserConfiguration('extensions', { webWorker: false });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.isEnabled(localWorkspaceExtension), false);
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 1 /* EnablementState.DisabledByExtensionKind */);
        });
        test('test web extension on local server is not disabled by kind when web worker is enabled', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, aMultiExtensionManagementServerService(instantiationService));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`) });
            instantiationService.get(configuration_1.IConfigurationService).setUserConfiguration('extensions', { webWorker: true });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.isEnabled(localWorkspaceExtension), true);
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test web extension on remote server is disabled by kind when web worker is not enabled', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(anExtensionManagementServer('vscode-local', instantiationService), anExtensionManagementServer('vscode-remote', instantiationService), null));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'vscode-remote' }) });
            instantiationService.get(configuration_1.IConfigurationService).setUserConfiguration('extensions', { webWorker: false });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.isEnabled(localWorkspaceExtension), false);
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 1 /* EnablementState.DisabledByExtensionKind */);
        });
        test('test web extension on remote server is disabled by kind when web worker is enabled', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(anExtensionManagementServer('vscode-local', instantiationService), anExtensionManagementServer('vscode-remote', instantiationService), null));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'vscode-remote' }) });
            instantiationService.get(configuration_1.IConfigurationService).setUserConfiguration('extensions', { webWorker: true });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.isEnabled(localWorkspaceExtension), false);
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 1 /* EnablementState.DisabledByExtensionKind */);
        });
        test('test web extension on remote server is enabled in web', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(anExtensionManagementServer('vscode-local', instantiationService), anExtensionManagementServer('vscode-remote', instantiationService), anExtensionManagementServer('web', instantiationService)));
            const localWorkspaceExtension = aLocalExtension2('pub.a', { browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'vscode-remote' }) });
            instantiationService.get(configuration_1.IConfigurationService).setUserConfiguration('extensions', { webWorker: false });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.isEnabled(localWorkspaceExtension), true);
            assert.deepStrictEqual(testObject.getEnablementState(localWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test web extension on web server is not disabled by kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(anExtensionManagementServer('vscode-local', instantiationService), anExtensionManagementServer('vscode-remote', instantiationService), anExtensionManagementServer('web', instantiationService)));
            const webExtension = aLocalExtension2('pub.a', { browser: 'browser.js' }, { location: uri_1.URI.file(`pub.a`).with({ scheme: 'web' }) });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.isEnabled(webExtension), true);
            assert.deepStrictEqual(testObject.getEnablementState(webExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test state of multipe extensions', async () => {
            installed.push(...[aLocalExtension('pub.a'), aLocalExtension('pub.b'), aLocalExtension('pub.c'), aLocalExtension('pub.d'), aLocalExtension('pub.e')]);
            testObject = new TestExtensionEnablementService(instantiationService);
            await testObject.waitUntilInitialized();
            await testObject.setEnablement([installed[0]], 6 /* EnablementState.DisabledGlobally */);
            await testObject.setEnablement([installed[1]], 7 /* EnablementState.DisabledWorkspace */);
            await testObject.setEnablement([installed[2]], 9 /* EnablementState.EnabledWorkspace */);
            await testObject.setEnablement([installed[3]], 8 /* EnablementState.EnabledGlobally */);
            assert.deepStrictEqual(testObject.getEnablementStates(installed), [6 /* EnablementState.DisabledGlobally */, 7 /* EnablementState.DisabledWorkspace */, 9 /* EnablementState.EnabledWorkspace */, 8 /* EnablementState.EnabledGlobally */, 8 /* EnablementState.EnabledGlobally */]);
        });
        test('test extension is disabled by dependency if it has a dependency that is disabled', async () => {
            installed.push(...[aLocalExtension2('pub.a'), aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'] })]);
            testObject = new TestExtensionEnablementService(instantiationService);
            await testObject.waitUntilInitialized();
            await testObject.setEnablement([installed[0]], 6 /* EnablementState.DisabledGlobally */);
            assert.strictEqual(testObject.getEnablementState(installed[1]), 5 /* EnablementState.DisabledByExtensionDependency */);
        });
        test('test extension is disabled by dependency if it has a dependency that is disabled by virtual workspace', async () => {
            installed.push(...[aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false } }), aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'], capabilities: { virtualWorkspaces: true } })]);
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = new TestExtensionEnablementService(instantiationService);
            await testObject.waitUntilInitialized();
            assert.strictEqual(testObject.getEnablementState(installed[0]), 4 /* EnablementState.DisabledByVirtualWorkspace */);
            assert.strictEqual(testObject.getEnablementState(installed[1]), 5 /* EnablementState.DisabledByExtensionDependency */);
        });
        test('test canChangeEnablement return false when extension is disabled by dependency if it has a dependency that is disabled by virtual workspace', async () => {
            installed.push(...[aLocalExtension2('pub.a', { capabilities: { virtualWorkspaces: false } }), aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'], capabilities: { virtualWorkspaces: true } })]);
            instantiationService.stub(workspace_1.IWorkspaceContextService, 'getWorkspace', { folders: [{ uri: uri_1.URI.file('worskapceA').with(({ scheme: 'virtual' })) }] });
            testObject = new TestExtensionEnablementService(instantiationService);
            await testObject.waitUntilInitialized();
            assert.ok(!testObject.canChangeEnablement(installed[1]));
        });
        test('test extension is disabled by dependency if it has a dependency that is disabled by workspace trust', async () => {
            installed.push(...[aLocalExtension2('pub.a', { main: 'hello.js', capabilities: { untrustedWorkspaces: { supported: false, description: '' } } }), aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'], capabilities: { untrustedWorkspaces: { supported: true } } })]);
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return false; } });
            testObject = new TestExtensionEnablementService(instantiationService);
            await testObject.waitUntilInitialized();
            assert.strictEqual(testObject.getEnablementState(installed[0]), 0 /* EnablementState.DisabledByTrustRequirement */);
            assert.strictEqual(testObject.getEnablementState(installed[1]), 5 /* EnablementState.DisabledByExtensionDependency */);
        });
        test('test extension is not disabled by dependency if it has a dependency that is disabled by extension kind', async () => {
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, anExtensionManagementServerService(anExtensionManagementServer('vscode-local', instantiationService), anExtensionManagementServer('vscode-remote', instantiationService), null));
            const localUIExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            const remoteUIExtension = aLocalExtension2('pub.a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const remoteWorkspaceExtension = aLocalExtension2('pub.n', { extensionKind: ['workspace'], extensionDependencies: ['pub.a'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            installed.push(localUIExtension, remoteUIExtension, remoteWorkspaceExtension);
            testObject = new TestExtensionEnablementService(instantiationService);
            await testObject.waitUntilInitialized();
            assert.strictEqual(testObject.getEnablementState(localUIExtension), 8 /* EnablementState.EnabledGlobally */);
            assert.strictEqual(testObject.getEnablementState(remoteUIExtension), 1 /* EnablementState.DisabledByExtensionKind */);
            assert.strictEqual(testObject.getEnablementState(remoteWorkspaceExtension), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test canChangeEnablement return true when extension is disabled by dependency if it has a dependency that is disabled by workspace trust', async () => {
            installed.push(...[aLocalExtension2('pub.a', { main: 'hello.js', capabilities: { untrustedWorkspaces: { supported: false, description: '' } } }), aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'], capabilities: { untrustedWorkspaces: { supported: true } } })]);
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return false; } });
            testObject = new TestExtensionEnablementService(instantiationService);
            await testObject.waitUntilInitialized();
            assert.ok(testObject.canChangeEnablement(installed[1]));
        });
        test('test extension is not disabled by dependency even if it has a dependency that is disabled when installed extensions are not set', async () => {
            await testObject.setEnablement([aLocalExtension2('pub.a')], 6 /* EnablementState.DisabledGlobally */);
            assert.strictEqual(testObject.getEnablementState(aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'] })), 8 /* EnablementState.EnabledGlobally */);
        });
        test('test extension is disabled by dependency if it has a dependency that is disabled when all extensions are passed', async () => {
            installed.push(...[aLocalExtension2('pub.a'), aLocalExtension2('pub.b', { extensionDependencies: ['pub.a'] })]);
            testObject = new TestExtensionEnablementService(instantiationService);
            await testObject.waitUntilInitialized();
            await testObject.setEnablement([installed[0]], 6 /* EnablementState.DisabledGlobally */);
            assert.deepStrictEqual(testObject.getEnablementStates(installed), [6 /* EnablementState.DisabledGlobally */, 5 /* EnablementState.DisabledByExtensionDependency */]);
        });
        test('test override workspace to trusted when getting extensions enablements', async () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: 'hello' } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return false; } });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.getEnablementStates([extension], { trusted: true })[0], 8 /* EnablementState.EnabledGlobally */);
        });
        test('test override workspace to not trusted when getting extensions enablements', async () => {
            const extension = aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: 'hello' } } });
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, { isWorkspaceTrusted() { return true; } });
            testObject = new TestExtensionEnablementService(instantiationService);
            assert.strictEqual(testObject.getEnablementStates([extension], { trusted: false })[0], 0 /* EnablementState.DisabledByTrustRequirement */);
        });
        test('test update extensions enablements on trust change triggers change events for extensions depending on workspace trust', async () => {
            installed.push(...[
                aLocalExtension2('pub.a', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: 'hello' } } }),
                aLocalExtension2('pub.b', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: true } } }),
                aLocalExtension2('pub.c', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: false, description: 'hello' } } }),
                aLocalExtension2('pub.d', { main: 'main.js', capabilities: { untrustedWorkspaces: { supported: true } } }),
            ]);
            testObject = new TestExtensionEnablementService(instantiationService);
            const target = sinon.spy();
            testObject.onEnablementChanged(target);
            await testObject.updateExtensionsEnablementsWhenWorkspaceTrustChanges();
            assert.strictEqual(target.args[0][0].length, 2);
            assert.deepStrictEqual(target.args[0][0][0].identifier, { id: 'pub.a' });
            assert.deepStrictEqual(target.args[0][0][1].identifier, { id: 'pub.c' });
        });
    });
    function anExtensionManagementServer(authority, instantiationService) {
        return {
            id: authority,
            label: authority,
            extensionManagementService: instantiationService.get(extensionManagement_1.IExtensionManagementService),
        };
    }
    function aMultiExtensionManagementServerService(instantiationService) {
        const localExtensionManagementServer = anExtensionManagementServer('vscode-local', instantiationService);
        const remoteExtensionManagementServer = anExtensionManagementServer('vscode-remote', instantiationService);
        return anExtensionManagementServerService(localExtensionManagementServer, remoteExtensionManagementServer, null);
    }
    function anExtensionManagementServerService(localExtensionManagementServer, remoteExtensionManagementServer, webExtensionManagementServer) {
        return {
            _serviceBrand: undefined,
            localExtensionManagementServer,
            remoteExtensionManagementServer,
            webExtensionManagementServer,
            getExtensionManagementServer: (extension) => {
                if (extension.location.scheme === network_1.Schemas.file) {
                    return localExtensionManagementServer;
                }
                if (extension.location.scheme === network_1.Schemas.vscodeRemote) {
                    return remoteExtensionManagementServer;
                }
                return webExtensionManagementServer;
            },
            getExtensionInstallLocation(extension) {
                const server = this.getExtensionManagementServer(extension);
                return server === remoteExtensionManagementServer ? 2 /* ExtensionInstallLocation.Remote */
                    : server === webExtensionManagementServer ? 3 /* ExtensionInstallLocation.Web */
                        : 1 /* ExtensionInstallLocation.Local */;
            }
        };
    }
    exports.anExtensionManagementServerService = anExtensionManagementServerService;
    function aLocalExtension(id, contributes, type) {
        return aLocalExtension2(id, contributes ? { contributes } : {}, (0, types_1.isUndefinedOrNull)(type) ? {} : { type });
    }
    function aLocalExtension2(id, manifest = {}, properties = {}) {
        const [publisher, name] = id.split('.');
        manifest = Object.assign({ name, publisher }, manifest);
        properties = Object.assign({ identifier: { id }, location: uri_1.URI.file(`pub.${name}`), galleryIdentifier: { id, uuid: undefined }, type: 1 /* ExtensionType.User */ }, properties);
        properties.isBuiltin = properties.type === 0 /* ExtensionType.System */;
        return Object.create(Object.assign({ manifest }, properties));
    }
});
//# sourceMappingURL=extensionEnablementService.test.js.map