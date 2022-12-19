/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uuid", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/workbench/contrib/extensions/browser/extensionsWorkbenchService", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/services/extensionManagement/test/browser/extensionEnablementService.test", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/url/common/url", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/extensions/common/extensions", "vs/platform/workspace/common/workspace", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/test/electron-browser/workbenchTestServices", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/url/common/urlService", "vs/base/common/uri", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/remote/electron-sandbox/remoteAgentService", "vs/platform/extensions/common/extensions", "vs/platform/ipc/electron-sandbox/services", "vs/base/common/cancellation", "vs/platform/label/common/label", "vs/platform/product/common/productService", "vs/base/common/network", "vs/platform/progress/common/progress", "vs/workbench/services/progress/browser/progressService", "vs/workbench/contrib/experiments/test/electron-browser/experimentService.test", "vs/workbench/contrib/experiments/common/experimentService", "vs/platform/extensionManagement/electron-sandbox/extensionTipsService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/lifecycle", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/services/environment/common/environmentService", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncEnablementService", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/workspaces/test/common/testWorkspaceTrustService", "vs/platform/environment/common/environment", "vs/base/common/platform", "vs/base/common/process"], function (require, exports, assert, uuid_1, extensions_1, ExtensionsActions, extensionsWorkbenchService_1, extensionManagement_1, extensionManagement_2, extensionRecommendations_1, extensionManagementUtil_1, extensionEnablementService_test_1, extensionGalleryService_1, url_1, instantiationServiceMock_1, event_1, telemetry_1, telemetryUtils_1, extensions_2, workspace_1, workbenchTestServices_1, workbenchTestServices_2, configuration_1, log_1, urlService_1, uri_1, testConfigurationService_1, remoteAgentService_1, remoteAgentService_2, extensions_3, services_1, cancellation_1, label_1, productService_1, network_1, progress_1, progressService_1, experimentService_test_1, experimentService_1, extensionTipsService_1, lifecycle_1, workbenchTestServices_3, lifecycle_2, environmentService_1, environmentService_2, userDataSync_1, userDataSyncEnablementService_1, contextkey_1, mockKeybindingService_1, workspaceTrust_1, testWorkspaceTrustService_1, environment_1, platform_1, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let instantiationService;
    let installEvent, didInstallEvent, uninstallEvent, didUninstallEvent;
    let disposables;
    async function setupTest() {
        disposables = new lifecycle_2.DisposableStore();
        installEvent = new event_1.Emitter();
        didInstallEvent = new event_1.Emitter();
        uninstallEvent = new event_1.Emitter();
        didUninstallEvent = new event_1.Emitter();
        instantiationService = new instantiationServiceMock_1.TestInstantiationService();
        instantiationService.stub(environment_1.IEnvironmentService, workbenchTestServices_2.TestEnvironmentService);
        instantiationService.stub(environment_1.INativeEnvironmentService, workbenchTestServices_2.TestEnvironmentService);
        instantiationService.stub(environmentService_2.IWorkbenchEnvironmentService, workbenchTestServices_2.TestEnvironmentService);
        instantiationService.stub(environmentService_1.INativeWorkbenchEnvironmentService, workbenchTestServices_2.TestEnvironmentService);
        instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
        instantiationService.stub(log_1.ILogService, log_1.NullLogService);
        instantiationService.stub(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
        instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
        instantiationService.stub(progress_1.IProgressService, progressService_1.ProgressService);
        instantiationService.stub(productService_1.IProductService, {});
        instantiationService.stub(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
        instantiationService.stub(extensionManagement_1.IExtensionGalleryService, extensionGalleryService_1.ExtensionGalleryService);
        instantiationService.stub(services_1.ISharedProcessService, workbenchTestServices_2.TestSharedProcessService);
        instantiationService.stub(extensionManagement_1.IExtensionManagementService, {
            onInstallExtension: installEvent.event,
            onDidInstallExtensions: didInstallEvent.event,
            onUninstallExtension: uninstallEvent.event,
            onDidUninstallExtension: didUninstallEvent.event,
            async getInstalled() { return []; },
            async getExtensionsControlManifest() { return { malicious: [] }; },
            async updateMetadata(local, metadata) {
                local.identifier.uuid = metadata.id;
                local.publisherDisplayName = metadata.publisherDisplayName;
                local.publisherId = metadata.publisherId;
                return local;
            },
            async canInstall() { return true; },
            async getTargetPlatform() { return (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch); },
        });
        instantiationService.stub(remoteAgentService_1.IRemoteAgentService, remoteAgentService_2.RemoteAgentService);
        const localExtensionManagementServer = { extensionManagementService: instantiationService.get(extensionManagement_1.IExtensionManagementService), label: 'local', id: 'vscode-local' };
        instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, {
            get localExtensionManagementServer() {
                return localExtensionManagementServer;
            },
            getExtensionManagementServer(extension) {
                if (extension.location.scheme === network_1.Schemas.file) {
                    return localExtensionManagementServer;
                }
                throw new Error(`Invalid Extension ${extension.location}`);
            }
        });
        instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
        instantiationService.stub(label_1.ILabelService, { onDidChangeFormatters: new event_1.Emitter().event });
        instantiationService.stub(lifecycle_1.ILifecycleService, new workbenchTestServices_3.TestLifecycleService());
        instantiationService.stub(experimentService_1.IExperimentService, instantiationService.createInstance(experimentService_test_1.TestExperimentService));
        instantiationService.stub(extensionManagement_1.IExtensionTipsService, instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService));
        instantiationService.stub(extensionRecommendations_1.IExtensionRecommendationsService, {});
        instantiationService.stub(url_1.IURLService, urlService_1.NativeURLService);
        instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage());
        instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getExtensions', []);
        instantiationService.stub(extensions_2.IExtensionService, { getExtensions: () => Promise.resolve([]), onDidChangeExtensions: new event_1.Emitter().event, canAddExtension: (extension) => false, canRemoveExtension: (extension) => false });
        instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).reset();
        instantiationService.stub(userDataSync_1.IUserDataSyncEnablementService, instantiationService.createInstance(userDataSyncEnablementService_1.UserDataSyncEnablementService));
        instantiationService.set(extensions_1.IExtensionsWorkbenchService, disposables.add(instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService)));
        instantiationService.stub(workspaceTrust_1.IWorkspaceTrustManagementService, new testWorkspaceTrustService_1.TestWorkspaceTrustManagementService());
    }
    suite('ExtensionsActions', () => {
        setup(setupTest);
        teardown(() => disposables.dispose());
        test('Install action is disabled when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction, false);
            assert.ok(!testObject.enabled);
        });
        test('Test Install action when state is installed', () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return workbenchService.queryLocal()
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier })));
                return workbenchService.queryGallery(cancellation_1.CancellationToken.None)
                    .then((paged) => {
                    testObject.extension = paged.firstPage[0];
                    assert.ok(!testObject.enabled);
                    assert.strictEqual('Install', testObject.label);
                    assert.strictEqual('extension-action label prominent install', testObject.class);
                });
            });
        });
        test('Test InstallingLabelAction when state is installing', () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallingLabelAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return workbenchService.queryGallery(cancellation_1.CancellationToken.None)
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                assert.ok(!testObject.enabled);
                assert.strictEqual('Installing', testObject.label);
                assert.strictEqual('extension-action label install installing', testObject.class);
            });
        });
        test('Test Install action when state is uninstalled', async () => {
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const promise = event_1.Event.toPromise(testObject.onDidChange);
            testObject.extension = paged.firstPage[0];
            await promise;
            assert.ok(testObject.enabled);
            assert.strictEqual('Install', testObject.label);
        });
        test('Test Install action when extension is system action', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', {}, { type: 0 /* ExtensionType.System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                uninstallEvent.fire(local.identifier);
                didUninstallEvent.fire({ identifier: local.identifier });
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test Install action when extension doesnot has gallery', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.InstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                uninstallEvent.fire(local.identifier);
                didUninstallEvent.fire({ identifier: local.identifier });
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Uninstall action is disabled when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            assert.ok(!testObject.enabled);
        });
        test('Test Uninstall action when state is uninstalling', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
                assert.strictEqual('Uninstalling', testObject.label);
                assert.strictEqual('extension-action label uninstall uninstalling', testObject.class);
            });
        });
        test('Test Uninstall action when state is installed and is user extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.strictEqual('Uninstall', testObject.label);
                assert.strictEqual('extension-action label uninstall', testObject.class);
            });
        });
        test('Test Uninstall action when state is installed and is system extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', {}, { type: 0 /* ExtensionType.System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
                assert.strictEqual('Uninstall', testObject.label);
                assert.strictEqual('extension-action label uninstall', testObject.class);
            });
        });
        test('Test Uninstall action when state is installing and is user extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const gallery = aGalleryExtension('a');
                const extension = extensions[0];
                extension.gallery = gallery;
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                testObject.extension = extension;
                assert.ok(!testObject.enabled);
            });
        });
        test('Test Uninstall action after extension is installed', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UninstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(paged => {
                testObject.extension = paged.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, gallery) }]);
                assert.ok(testObject.enabled);
                assert.strictEqual('Uninstall', testObject.label);
                assert.strictEqual('extension-action label uninstall', testObject.class);
            });
        });
        test('Test UpdateAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            assert.ok(!testObject.enabled);
        });
        test('Test UpdateAction when extension is uninstalled', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then((paged) => {
                testObject.extension = paged.firstPage[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test UpdateAction when extension is installed and not outdated', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier, version: local.manifest.version })));
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                    .then(extensions => assert.ok(!testObject.enabled));
            });
        });
        test('Test UpdateAction when extension is installed outdated and system extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', { version: '1.0.0' }, { type: 0 /* ExtensionType.System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: local.identifier, version: '1.0.1' })));
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                    .then(extensions => assert.ok(!testObject.enabled));
            });
        });
        test('Test UpdateAction when extension is installed outdated and user extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            return workbenchService.queryLocal()
                .then(async (extensions) => {
                testObject.extension = extensions[0];
                const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.1' });
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getCompatibleExtension', gallery);
                instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getExtensions', [gallery]);
                assert.ok(!testObject.enabled);
                return new Promise(c => {
                    testObject.onDidChange(() => {
                        if (testObject.enabled) {
                            c();
                        }
                    });
                    instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
                });
            });
        });
        test('Test UpdateAction when extension is installing and outdated and user extension', async () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.UpdateAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', { version: '1.0.0' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.1' });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getCompatibleExtension', gallery);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getExtensions', [gallery]);
            await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            const promise = event_1.Event.toPromise(testObject.onDidChange);
            installEvent.fire({ identifier: local.identifier, source: gallery });
            await promise;
            assert.ok(!testObject.enabled);
        });
        test('Test ManageExtensionAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            assert.ok(!testObject.enabled);
        });
        test('Test ManageExtensionAction when extension is installed', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.strictEqual('extension-action icon manage codicon codicon-extensions-manage', testObject.class);
                assert.strictEqual('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is uninstalled', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                testObject.extension = page.firstPage[0];
                assert.ok(!testObject.enabled);
                assert.strictEqual('extension-action icon manage codicon codicon-extensions-manage hide', testObject.class);
                assert.strictEqual('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is installing', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                testObject.extension = page.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                assert.ok(!testObject.enabled);
                assert.strictEqual('extension-action icon manage codicon codicon-extensions-manage hide', testObject.class);
                assert.strictEqual('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is queried from gallery and installed', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                testObject.extension = page.firstPage[0];
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, gallery) }]);
                assert.ok(testObject.enabled);
                assert.strictEqual('extension-action icon manage codicon codicon-extensions-manage', testObject.class);
                assert.strictEqual('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is system extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', {}, { type: 0 /* ExtensionType.System */ });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
                assert.strictEqual('extension-action icon manage codicon codicon-extensions-manage', testObject.class);
                assert.strictEqual('', testObject.tooltip);
            });
        });
        test('Test ManageExtensionAction when extension is uninstalling', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ManageExtensionAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                testObject.extension = extensions[0];
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
                assert.strictEqual('extension-action icon manage codicon codicon-extensions-manage', testObject.class);
                assert.strictEqual('Uninstalling', testObject.tooltip);
            });
        });
        test('Test EnableForWorkspaceAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
            assert.ok(!testObject.enabled);
        });
        test('Test EnableForWorkspaceAction when there extension is not disabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableForWorkspaceAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableForWorkspaceAction when extension is disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableForWorkspaceAction when the extension is disabled globally and workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 7 /* EnablementState.DisabledWorkspace */))
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableForWorkspaceAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableGloballyAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
            assert.ok(!testObject.enabled);
        });
        test('Test EnableGloballyAction when the extension is not disabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableGloballyAction when the extension is disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test EnableGloballyAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableGloballyAction when the extension is disabled in both', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 7 /* EnablementState.DisabledWorkspace */))
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableGloballyAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
            assert.ok(!testObject.enabled);
        });
        test('Test EnableDropDownAction when extension is installed and enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                testObject.extension = extensions[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableDropDownAction when extension is installed and disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableDropDownAction when extension is installed and disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                    testObject.extension = extensions[0];
                    assert.ok(testObject.enabled);
                });
            });
        });
        test('Test EnableDropDownAction when extension is uninstalled', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                testObject.extension = page.firstPage[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableDropDownAction when extension is installing', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                testObject.extension = page.firstPage[0];
                instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                assert.ok(!testObject.enabled);
            });
        });
        test('Test EnableDropDownAction when extension is uninstalling', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.EnableDropDownAction);
                testObject.extension = extensions[0];
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
            });
        });
        test('Test DisableForWorkspaceAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction, []);
            assert.ok(!testObject.enabled);
        });
        test('Test DisableForWorkspaceAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction, []);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableForWorkspaceAction when the extension is disabled workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction, []);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableForWorkspaceAction when extension is enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableForWorkspaceAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
            });
        });
        test('Test DisableGloballyAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, []);
            assert.ok(!testObject.enabled);
        });
        test('Test DisableGloballyAction when the extension is disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, []);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableGloballyAction when the extension is disabled for workspace', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 7 /* EnablementState.DisabledWorkspace */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, []);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableGloballyAction when the extension is enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
            });
        });
        test('Test DisableGloballyAction when extension is installed and enabled', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = extensions[0];
                assert.ok(testObject.enabled);
            });
        });
        test('Test DisableGloballyAction when extension is installed and disabled globally', () => {
            const local = aLocalExtension('a');
            return instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */)
                .then(() => {
                instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
                return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                    .then(extensions => {
                    const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                    testObject.extension = extensions[0];
                    assert.ok(!testObject.enabled);
                });
            });
        });
        test('Test DisableGloballyAction when extension is uninstalled', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = page.firstPage[0];
                assert.ok(!testObject.enabled);
            });
        });
        test('Test DisableGloballyAction when extension is installing', () => {
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None)
                .then(page => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = page.firstPage[0];
                instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                assert.ok(!testObject.enabled);
            });
        });
        test('Test DisableGloballyAction when extension is uninstalling', () => {
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            return instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal()
                .then(extensions => {
                const testObject = instantiationService.createInstance(ExtensionsActions.DisableGloballyAction, [{ identifier: new extensions_3.ExtensionIdentifier('pub.a'), extensionLocation: uri_1.URI.file('pub.a') }]);
                testObject.extension = extensions[0];
                instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
                uninstallEvent.fire(local.identifier);
                assert.ok(!testObject.enabled);
            });
        });
    });
    suite('ReloadAction', () => {
        setup(setupTest);
        teardown(() => disposables.dispose());
        test('Test ReloadAction when there is no extension', () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension state is installing', async () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension state is uninstalling', async () => {
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            uninstallEvent.fire(local.identifier);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is newly installed', async () => {
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            const runningExtensions = [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))];
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve(runningExtensions),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            assert.ok(!testObject.enabled);
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, gallery) }]);
            assert.ok(testObject.enabled);
            assert.strictEqual(testObject.tooltip, 'Please reload Visual Studio Code to enable this extension.');
        });
        test('Test ReloadAction when extension is newly installed and reload is not required', async () => {
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            const runningExtensions = [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))];
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve(runningExtensions),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => true
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            assert.ok(!testObject.enabled);
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, gallery) }]);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is installed and uninstalled', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            const identifier = gallery.identifier;
            installEvent.fire({ identifier, source: gallery });
            didInstallEvent.fire([{ identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, { identifier }) }]);
            uninstallEvent.fire(identifier);
            didUninstallEvent.fire({ identifier });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is uninstalled', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [(0, extensions_2.toExtensionDescription)(aLocalExtension('a', { version: '1.0.0' }))]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            uninstallEvent.fire(local.identifier);
            didUninstallEvent.fire({ identifier: local.identifier });
            assert.ok(testObject.enabled);
            assert.strictEqual(testObject.tooltip, 'Please reload Visual Studio Code to complete the uninstallation of this extension.');
        });
        test('Test ReloadAction when extension is uninstalled and can be removed', async () => {
            const local = aLocalExtension('a');
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve([(0, extensions_2.toExtensionDescription)(local)]),
                onDidChangeExtensions: new event_1.Emitter().event,
                canRemoveExtension: (extension) => true,
                canAddExtension: (extension) => true
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            uninstallEvent.fire(local.identifier);
            didUninstallEvent.fire({ identifier: local.identifier });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is uninstalled and installed', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [(0, extensions_2.toExtensionDescription)(aLocalExtension('a', { version: '1.0.0' }))]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryLocal();
            testObject.extension = extensions[0];
            uninstallEvent.fire(local.identifier);
            didUninstallEvent.fire({ identifier: local.identifier });
            const gallery = aGalleryExtension('a');
            const identifier = gallery.identifier;
            installEvent.fire({ identifier, source: gallery });
            didInstallEvent.fire([{ identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local }]);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is updated while running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [(0, extensions_2.toExtensionDescription)(aLocalExtension('a', { version: '1.0.1' }))]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', { version: '1.0.1' });
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            return new Promise(c => {
                testObject.onDidChange(() => {
                    if (testObject.enabled && testObject.tooltip === 'Please reload Visual Studio Code to enable the updated extension.') {
                        c();
                    }
                });
                const gallery = aGalleryExtension('a', { uuid: local.identifier.id, version: '1.0.2' });
                installEvent.fire({ identifier: gallery.identifier, source: gallery });
                didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, gallery) }]);
            });
        });
        test('Test ReloadAction when extension is updated when not running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))]);
            const local = aLocalExtension('a', { version: '1.0.1' });
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.2' });
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 3 /* InstallOperation.Update */, local: aLocalExtension('a', gallery, gallery) }]);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is disabled when running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [(0, extensions_2.toExtensionDescription)(aLocalExtension('a'))]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            await workbenchService.setEnablement(extensions[0], 6 /* EnablementState.DisabledGlobally */);
            await testObject.update();
            assert.ok(testObject.enabled);
            assert.strictEqual('Please reload Visual Studio Code to disable this extension.', testObject.tooltip);
        });
        test('Test ReloadAction when extension enablement is toggled when running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [(0, extensions_2.toExtensionDescription)(aLocalExtension('a', { version: '1.0.0' }))]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a');
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            await workbenchService.setEnablement(extensions[0], 6 /* EnablementState.DisabledGlobally */);
            await workbenchService.setEnablement(extensions[0], 8 /* EnablementState.EnabledGlobally */);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is enabled when not running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))]);
            const local = aLocalExtension('a');
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            await workbenchService.setEnablement(extensions[0], 8 /* EnablementState.EnabledGlobally */);
            await testObject.update();
            assert.ok(testObject.enabled);
            assert.strictEqual('Please reload Visual Studio Code to enable this extension.', testObject.tooltip);
        });
        test('Test ReloadAction when extension enablement is toggled when not running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))]);
            const local = aLocalExtension('a');
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            await workbenchService.setEnablement(extensions[0], 8 /* EnablementState.EnabledGlobally */);
            await workbenchService.setEnablement(extensions[0], 6 /* EnablementState.DisabledGlobally */);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is updated when not running and enabled', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))]);
            const local = aLocalExtension('a', { version: '1.0.1' });
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([local], 6 /* EnablementState.DisabledGlobally */);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            const gallery = aGalleryExtension('a', { identifier: local.identifier, version: '1.0.2' });
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', gallery, gallery) }]);
            await workbenchService.setEnablement(extensions[0], 8 /* EnablementState.EnabledGlobally */);
            await testObject.update();
            assert.ok(testObject.enabled);
            assert.strictEqual('Please reload Visual Studio Code to enable this extension.', testObject.tooltip);
        });
        test('Test ReloadAction when a localization extension is newly installed', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [(0, extensions_2.toExtensionDescription)(aLocalExtension('b'))]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const gallery = aGalleryExtension('a');
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const paged = await instantiationService.get(extensions_1.IExtensionsWorkbenchService).queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = paged.firstPage[0];
            assert.ok(!testObject.enabled);
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', Object.assign(Object.assign({}, gallery), { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }), gallery) }]);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when a localization extension is updated while running', async () => {
            instantiationService.stubPromise(extensions_2.IExtensionService, 'getExtensions', [(0, extensions_2.toExtensionDescription)(aLocalExtension('a', { version: '1.0.1' }))]);
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const local = aLocalExtension('a', { version: '1.0.1', contributes: { localizations: [{ languageId: 'de', translations: [] }] } });
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [local]);
            const extensions = await workbenchService.queryLocal();
            testObject.extension = extensions[0];
            const gallery = aGalleryExtension('a', { uuid: local.identifier.id, version: '1.0.2' });
            installEvent.fire({ identifier: gallery.identifier, source: gallery });
            didInstallEvent.fire([{ identifier: gallery.identifier, source: gallery, operation: 2 /* InstallOperation.Install */, local: aLocalExtension('a', Object.assign(Object.assign({}, gallery), { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }), gallery) }]);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is not installed but extension from different server is installed and running', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file('pub.a') });
            const remoteExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localExtension]), createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            const runningExtensions = [(0, extensions_2.toExtensionDescription)(remoteExtension)];
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve(runningExtensions),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when extension is uninstalled but extension from different server is installed and running', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file('pub.a') });
            const remoteExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const localExtensionManagementService = createExtensionManagementService([localExtension]);
            const uninstallEvent = new event_1.Emitter();
            const onDidUninstallEvent = new event_1.Emitter();
            localExtensionManagementService.onUninstallExtension = uninstallEvent.event;
            localExtensionManagementService.onDidUninstallExtension = onDidUninstallEvent.event;
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            const runningExtensions = [(0, extensions_2.toExtensionDescription)(remoteExtension)];
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve(runningExtensions),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
            uninstallEvent.fire(localExtension.identifier);
            didUninstallEvent.fire({ identifier: localExtension.identifier });
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction when workspace extension is disabled on local server and installed in remote server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const remoteExtensionManagementService = createExtensionManagementService([]);
            const onDidInstallEvent = new event_1.Emitter();
            remoteExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const localExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file('pub.a') });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localExtension]), remoteExtensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve([]),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
            const remoteExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            onDidInstallEvent.fire([{ identifier: remoteExtension.identifier, local: remoteExtension, operation: 2 /* InstallOperation.Install */ }]);
            assert.ok(testObject.enabled);
            assert.strictEqual(testObject.tooltip, 'Please reload Visual Studio Code to enable this extension.');
        });
        test('Test ReloadAction when ui extension is disabled on remote server and installed in local server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtensionManagementService = createExtensionManagementService([]);
            const onDidInstallEvent = new event_1.Emitter();
            localExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const remoteExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve([]),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
            const localExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file('pub.a') });
            onDidInstallEvent.fire([{ identifier: localExtension.identifier, local: localExtension, operation: 2 /* InstallOperation.Install */ }]);
            assert.ok(testObject.enabled);
            assert.strictEqual(testObject.tooltip, 'Please reload Visual Studio Code to enable this extension.');
        });
        test('Test ReloadAction for remote ui extension is disabled when it is installed and enabled in local server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file('pub.a') });
            const localExtensionManagementService = createExtensionManagementService([localExtension]);
            const onDidInstallEvent = new event_1.Emitter();
            localExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const remoteExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve([(0, extensions_2.toExtensionDescription)(localExtension)]),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test ReloadAction for remote workspace+ui extension is enabled when it is installed and enabled in local server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['workspace', 'ui'] }, { location: uri_1.URI.file('pub.a') });
            const localExtensionManagementService = createExtensionManagementService([localExtension]);
            const onDidInstallEvent = new event_1.Emitter();
            localExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const remoteExtension = aLocalExtension('a', { extensionKind: ['workspace', 'ui'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve([(0, extensions_2.toExtensionDescription)(localExtension)]),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(testObject.enabled);
        });
        test('Test ReloadAction for local ui+workspace extension is enabled when it is installed and enabled in remote server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file('pub.a') });
            const remoteExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const remoteExtensionManagementService = createExtensionManagementService([remoteExtension]);
            const onDidInstallEvent = new event_1.Emitter();
            remoteExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localExtension]), remoteExtensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve([(0, extensions_2.toExtensionDescription)(remoteExtension)]),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(testObject.enabled);
        });
        test('Test ReloadAction for local workspace+ui extension is enabled when it is installed in both servers but running in local server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['workspace', 'ui'] }, { location: uri_1.URI.file('pub.a') });
            const localExtensionManagementService = createExtensionManagementService([localExtension]);
            const onDidInstallEvent = new event_1.Emitter();
            localExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const remoteExtension = aLocalExtension('a', { extensionKind: ['workspace', 'ui'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve([(0, extensions_2.toExtensionDescription)(localExtension)]),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(testObject.enabled);
        });
        test('Test ReloadAction for remote ui+workspace extension is enabled when it is installed on both servers but running in remote server', async () => {
            // multi server setup
            const gallery = aGalleryExtension('a');
            const localExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file('pub.a') });
            const remoteExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file('pub.a').with({ scheme: network_1.Schemas.vscodeRemote }) });
            const remoteExtensionManagementService = createExtensionManagementService([remoteExtension]);
            const onDidInstallEvent = new event_1.Emitter();
            remoteExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localExtension]), remoteExtensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const onDidChangeExtensionsEmitter = new event_1.Emitter();
            instantiationService.stub(extensions_2.IExtensionService, {
                getExtensions: () => Promise.resolve([(0, extensions_2.toExtensionDescription)(remoteExtension)]),
                onDidChangeExtensions: onDidChangeExtensionsEmitter.event,
                canAddExtension: (extension) => false
            });
            const testObject = instantiationService.createInstance(ExtensionsActions.ReloadAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(testObject.enabled);
        });
    });
    suite('RemoteInstallAction', () => {
        setup(setupTest);
        teardown(() => disposables.dispose());
        test('Test remote install action is enabled for local workspace extension', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test remote install action when installing local workspace extension', async () => {
            // multi server setup
            const remoteExtensionManagementService = createExtensionManagementService();
            const onInstallExtension = new event_1.Emitter();
            remoteExtensionManagementService.onInstallExtension = onInstallExtension.event;
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]), remoteExtensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.stub(extensions_1.IExtensionsWorkbenchService, workbenchService, 'open', undefined);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const gallery = aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
            onInstallExtension.fire({ identifier: localWorkspaceExtension.identifier, source: gallery });
            assert.ok(testObject.enabled);
            assert.strictEqual('Installing', testObject.label);
            assert.strictEqual('extension-action label install installing', testObject.class);
        });
        test('Test remote install action when installing local workspace extension is finished', async () => {
            // multi server setup
            const remoteExtensionManagementService = createExtensionManagementService();
            const onInstallExtension = new event_1.Emitter();
            remoteExtensionManagementService.onInstallExtension = onInstallExtension.event;
            const onDidInstallEvent = new event_1.Emitter();
            remoteExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]), remoteExtensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.stub(extensions_1.IExtensionsWorkbenchService, workbenchService, 'open', undefined);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const gallery = aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
            onInstallExtension.fire({ identifier: localWorkspaceExtension.identifier, source: gallery });
            assert.ok(testObject.enabled);
            assert.strictEqual('Installing', testObject.label);
            assert.strictEqual('extension-action label install installing', testObject.class);
            const installedExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            onDidInstallEvent.fire([{ identifier: installedExtension.identifier, local: installedExtension, operation: 2 /* InstallOperation.Install */ }]);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is enabled for disabled local workspace extension', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const remoteWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([remoteWorkspaceExtension], 6 /* EnablementState.DisabledGlobally */);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test remote install action is enabled local workspace+ui extension', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace', 'ui'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([localWorkspaceExtension], 6 /* EnablementState.DisabledGlobally */);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test remote install action is enabled for local ui+workapace extension if can install is true', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([localWorkspaceExtension], 6 /* EnablementState.DisabledGlobally */);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, true);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test remote install action is disabled for local ui+workapace extension if can install is false', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([localWorkspaceExtension], 6 /* EnablementState.DisabledGlobally */);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled when extension is not set', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for extension which is not installed', async () => {
            // multi server setup
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a')));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const pager = await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = pager.firstPage[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local workspace extension which is disabled in env', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            const environmentService = { disableExtensions: true };
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            instantiationService.stub(environment_1.INativeEnvironmentService, environmentService);
            instantiationService.stub(environmentService_2.IWorkbenchEnvironmentService, environmentService);
            instantiationService.stub(environmentService_1.INativeWorkbenchEnvironmentService, environmentService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled when remote server is not available', async () => {
            // single server setup
            const workbenchService = instantiationService.get(extensions_1.IExtensionsWorkbenchService);
            const extensionManagementServerService = instantiationService.get(extensionManagement_2.IExtensionManagementServerService);
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localWorkspaceExtension]);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local workspace extension if it is uninstalled locally', async () => {
            // multi server setup
            const extensionManagementService = instantiationService.get(extensionManagement_1.IExtensionManagementService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, extensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [localWorkspaceExtension]);
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            uninstallEvent.fire(localWorkspaceExtension.identifier);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local workspace extension if it is installed in remote', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const remoteWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]), createExtensionManagementService([remoteWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is enabled for local workspace extension if it has not gallery', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(testObject.enabled);
        });
        test('Test remote install action is disabled for local workspace system extension', async () => {
            // multi server setup
            const localWorkspaceSystemExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`), type: 0 /* ExtensionType.System */ });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceSystemExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceSystemExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local ui extension if it is not installed in remote', async () => {
            // multi server setup
            const localUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is disabled for local ui extension if it is also installed in remote', async () => {
            // multi server setup
            const localUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localUIExtension]), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test remote install action is enabled for locally installed language pack extension', async () => {
            // multi server setup
            const languagePackExtension = aLocalExtension('a', { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }, { location: uri_1.URI.file(`pub.a`) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([languagePackExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: languagePackExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test remote install action is disabled if local language pack extension is uninstalled', async () => {
            // multi server setup
            const extensionManagementService = instantiationService.get(extensionManagement_1.IExtensionManagementService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, extensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const languagePackExtension = aLocalExtension('a', { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }, { location: uri_1.URI.file(`pub.a`) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [languagePackExtension]);
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: languagePackExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.RemoteInstallAction, false);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.localExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install in remote', testObject.label);
            uninstallEvent.fire(languagePackExtension.identifier);
            assert.ok(!testObject.enabled);
        });
    });
    suite('LocalInstallAction', () => {
        setup(setupTest);
        teardown(() => disposables.dispose());
        test('Test local install action is enabled for remote ui extension', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test local install action is enabled for remote ui+workspace extension', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui', 'workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test local install action when installing remote ui extension', async () => {
            // multi server setup
            const localExtensionManagementService = createExtensionManagementService();
            const onInstallExtension = new event_1.Emitter();
            localExtensionManagementService.onInstallExtension = onInstallExtension.event;
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.stub(extensions_1.IExtensionsWorkbenchService, workbenchService, 'open', undefined);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const gallery = aGalleryExtension('a', { identifier: remoteUIExtension.identifier });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
            onInstallExtension.fire({ identifier: remoteUIExtension.identifier, source: gallery });
            assert.ok(testObject.enabled);
            assert.strictEqual('Installing', testObject.label);
            assert.strictEqual('extension-action label install installing', testObject.class);
        });
        test('Test local install action when installing remote ui extension is finished', async () => {
            // multi server setup
            const localExtensionManagementService = createExtensionManagementService();
            const onInstallExtension = new event_1.Emitter();
            localExtensionManagementService.onInstallExtension = onInstallExtension.event;
            const onDidInstallEvent = new event_1.Emitter();
            localExtensionManagementService.onDidInstallExtensions = onDidInstallEvent.event;
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.stub(extensions_1.IExtensionsWorkbenchService, workbenchService, 'open', undefined);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const gallery = aGalleryExtension('a', { identifier: remoteUIExtension.identifier });
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(gallery));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
            onInstallExtension.fire({ identifier: remoteUIExtension.identifier, source: gallery });
            assert.ok(testObject.enabled);
            assert.strictEqual('Installing', testObject.label);
            assert.strictEqual('extension-action label install installing', testObject.class);
            const installedExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            onDidInstallEvent.fire([{ identifier: installedExtension.identifier, local: installedExtension, operation: 2 /* InstallOperation.Install */ }]);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is enabled for disabled remote ui extension', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            const localUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            await instantiationService.get(extensionManagement_2.IWorkbenchExtensionEnablementService).setEnablement([localUIExtension], 6 /* EnablementState.DisabledGlobally */);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test local install action is disabled when extension is not set', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for extension which is not installed', async () => {
            // multi server setup
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a')));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const pager = await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = pager.firstPage[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote ui extension which is disabled in env', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const environmentService = { disableExtensions: true };
            instantiationService.stub(environment_1.IEnvironmentService, environmentService);
            instantiationService.stub(environment_1.INativeEnvironmentService, environmentService);
            instantiationService.stub(environmentService_2.IWorkbenchEnvironmentService, environmentService);
            instantiationService.stub(environmentService_1.INativeWorkbenchEnvironmentService, environmentService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled when local server is not available', async () => {
            // single server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aSingleRemoteExtensionManagementServerService(instantiationService, createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote ui extension if it is installed in local', async () => {
            // multi server setup
            const localUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`) });
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localUIExtension]), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remoteUI extension if it is uninstalled locally', async () => {
            // multi server setup
            const extensionManagementService = instantiationService.get(extensionManagement_1.IExtensionManagementService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), extensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [remoteUIExtension]);
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            uninstallEvent.fire(remoteUIExtension.identifier);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is enabled for remote UI extension if it has gallery', async () => {
            // multi server setup
            const remoteUIExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUIExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUIExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(testObject.enabled);
        });
        test('Test local install action is disabled for remote UI system extension', async () => {
            // multi server setup
            const remoteUISystemExtension = aLocalExtension('a', { extensionKind: ['ui'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }), type: 0 /* ExtensionType.System */ });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteUISystemExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteUISystemExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote workspace extension if it is not installed in local', async () => {
            // multi server setup
            const remoteWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([remoteWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: remoteWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is disabled for remote workspace extension if it is also installed in local', async () => {
            // multi server setup
            const localWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspae'] }, { location: uri_1.URI.file(`pub.a`) });
            const remoteWorkspaceExtension = aLocalExtension('a', { extensionKind: ['workspace'] }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService([localWorkspaceExtension]), createExtensionManagementService([remoteWorkspaceExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: localWorkspaceExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            testObject.extension = extensions[0];
            assert.ok(testObject.extension);
            assert.ok(!testObject.enabled);
        });
        test('Test local install action is enabled for remotely installed language pack extension', async () => {
            // multi server setup
            const languagePackExtension = aLocalExtension('a', { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), createExtensionManagementService([languagePackExtension]));
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: languagePackExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            assert.strictEqual('extension-action label prominent install', testObject.class);
        });
        test('Test local install action is disabled if remote language pack extension is uninstalled', async () => {
            // multi server setup
            const extensionManagementService = instantiationService.get(extensionManagement_1.IExtensionManagementService);
            const extensionManagementServerService = aMultiExtensionManagementServerService(instantiationService, createExtensionManagementService(), extensionManagementService);
            instantiationService.stub(extensionManagement_2.IExtensionManagementServerService, extensionManagementServerService);
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            const languagePackExtension = aLocalExtension('a', { contributes: { localizations: [{ languageId: 'de', translations: [] }] } }, { location: uri_1.URI.file(`pub.a`).with({ scheme: network_1.Schemas.vscodeRemote }) });
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', [languagePackExtension]);
            const workbenchService = instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, workbenchService);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(aGalleryExtension('a', { identifier: languagePackExtension.identifier })));
            const testObject = instantiationService.createInstance(ExtensionsActions.LocalInstallAction);
            instantiationService.createInstance(extensions_1.ExtensionContainers, [testObject]);
            const extensions = await workbenchService.queryLocal(extensionManagementServerService.remoteExtensionManagementServer);
            await workbenchService.queryGallery(cancellation_1.CancellationToken.None);
            testObject.extension = extensions[0];
            assert.ok(testObject.enabled);
            assert.strictEqual('Install Locally', testObject.label);
            uninstallEvent.fire(languagePackExtension.identifier);
            assert.ok(!testObject.enabled);
        });
    });
    function aLocalExtension(name = 'someext', manifest = {}, properties = {}) {
        manifest = Object.assign({ name, publisher: 'pub', version: '1.0.0' }, manifest);
        properties = Object.assign({ type: 1 /* ExtensionType.User */, location: uri_1.URI.file(`pub.${name}`), identifier: { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(manifest.publisher, manifest.name) } }, properties);
        properties.isBuiltin = properties.type === 0 /* ExtensionType.System */;
        return Object.create(Object.assign({ manifest }, properties));
    }
    function aGalleryExtension(name, properties = {}, galleryExtensionProperties = {}, assets = {}) {
        const targetPlatform = (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch);
        const galleryExtension = Object.create(Object.assign({ name, publisher: 'pub', version: '1.0.0', allTargetPlatforms: [targetPlatform], properties: {}, assets: {} }, properties));
        galleryExtension.properties = Object.assign(Object.assign(Object.assign({}, galleryExtension.properties), { dependencies: [], targetPlatform }), galleryExtensionProperties);
        galleryExtension.assets = Object.assign(Object.assign({}, galleryExtension.assets), assets);
        galleryExtension.identifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(galleryExtension.publisher, galleryExtension.name), uuid: (0, uuid_1.generateUuid)() };
        galleryExtension.hasReleaseVersion = true;
        return galleryExtension;
    }
    function aPage(...objects) {
        return { firstPage: objects, total: objects.length, pageSize: objects.length, getPage: () => null };
    }
    function aSingleRemoteExtensionManagementServerService(instantiationService, remoteExtensionManagementService) {
        const remoteExtensionManagementServer = {
            id: 'vscode-remote',
            label: 'remote',
            extensionManagementService: remoteExtensionManagementService || createExtensionManagementService(),
        };
        return {
            _serviceBrand: undefined,
            localExtensionManagementServer: null,
            remoteExtensionManagementServer,
            webExtensionManagementServer: null,
            getExtensionManagementServer: (extension) => {
                if (extension.location.scheme === network_1.Schemas.vscodeRemote) {
                    return remoteExtensionManagementServer;
                }
                return null;
            },
            getExtensionInstallLocation(extension) {
                const server = this.getExtensionManagementServer(extension);
                return server === remoteExtensionManagementServer ? 2 /* ExtensionInstallLocation.Remote */ : 1 /* ExtensionInstallLocation.Local */;
            }
        };
    }
    function aMultiExtensionManagementServerService(instantiationService, localExtensionManagementService, remoteExtensionManagementService) {
        const localExtensionManagementServer = {
            id: 'vscode-local',
            label: 'local',
            extensionManagementService: localExtensionManagementService || createExtensionManagementService(),
        };
        const remoteExtensionManagementServer = {
            id: 'vscode-remote',
            label: 'remote',
            extensionManagementService: remoteExtensionManagementService || createExtensionManagementService(),
        };
        return {
            _serviceBrand: undefined,
            localExtensionManagementServer,
            remoteExtensionManagementServer,
            webExtensionManagementServer: null,
            getExtensionManagementServer: (extension) => {
                if (extension.location.scheme === network_1.Schemas.file) {
                    return localExtensionManagementServer;
                }
                if (extension.location.scheme === network_1.Schemas.vscodeRemote) {
                    return remoteExtensionManagementServer;
                }
                throw new Error('');
            },
            getExtensionInstallLocation(extension) {
                const server = this.getExtensionManagementServer(extension);
                return server === remoteExtensionManagementServer ? 2 /* ExtensionInstallLocation.Remote */ : 1 /* ExtensionInstallLocation.Local */;
            }
        };
    }
    function createExtensionManagementService(installed = []) {
        return {
            onInstallExtension: event_1.Event.None,
            onDidInstallExtensions: event_1.Event.None,
            onUninstallExtension: event_1.Event.None,
            onDidUninstallExtension: event_1.Event.None,
            getInstalled: () => Promise.resolve(installed),
            canInstall: async (extension) => { return true; },
            installFromGallery: (extension) => Promise.reject(new Error('not supported')),
            updateMetadata: async (local, metadata) => {
                local.identifier.uuid = metadata.id;
                local.publisherDisplayName = metadata.publisherDisplayName;
                local.publisherId = metadata.publisherId;
                return local;
            },
            async getTargetPlatform() { return (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch); },
            async getExtensionsControlManifest() { return { malicious: [] }; },
        };
    }
});
//# sourceMappingURL=extensionsActions.test.js.map