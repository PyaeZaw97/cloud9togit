/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "sinon", "assert", "vs/base/common/uuid", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionGalleryService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/base/common/event", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/workspace/common/workspace", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/test/electron-browser/workbenchTestServices", "vs/platform/notification/test/common/testNotificationService", "vs/platform/configuration/common/configuration", "vs/base/common/uri", "vs/platform/workspace/test/common/testWorkspace", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/environment/common/environment", "vs/workbench/contrib/extensions/common/extensions", "vs/workbench/services/extensionManagement/test/browser/extensionEnablementService.test", "vs/platform/url/common/url", "vs/editor/common/services/model", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/url/common/urlService", "vs/workbench/contrib/experiments/common/experimentService", "vs/workbench/contrib/experiments/test/electron-browser/experimentService.test", "vs/platform/storage/common/storage", "vs/platform/ipc/electron-sandbox/services", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/platform/files/common/files", "vs/platform/product/common/productService", "vs/platform/extensionManagement/electron-sandbox/extensionTipsService", "vs/workbench/contrib/extensions/browser/extensionRecommendationsService", "vs/workbench/contrib/tags/browser/workspaceTagsService", "vs/workbench/contrib/tags/common/workspaceTags", "vs/workbench/contrib/extensions/browser/extensionsWorkbenchService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/extensionRecommendations/common/workspaceExtensionsConfig", "vs/workbench/services/extensionRecommendations/common/extensionRecommendations", "vs/workbench/services/extensionRecommendations/common/extensionIgnoredRecommendationsService", "vs/platform/extensionRecommendations/common/extensionRecommendations", "vs/workbench/contrib/extensions/browser/extensionRecommendationNotificationService", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/files/common/inMemoryFilesystemProvider", "vs/base/common/resources", "vs/base/common/buffer", "vs/base/common/platform", "vs/base/common/process"], function (require, exports, sinon, assert, uuid, extensionManagement_1, extensionManagement_2, extensionGalleryService_1, instantiationServiceMock_1, event_1, telemetry_1, telemetryUtils_1, workspace_1, workbenchTestServices_1, workbenchTestServices_2, workbenchTestServices_3, testNotificationService_1, configuration_1, uri_1, testWorkspace_1, testConfigurationService_1, extensionManagementUtil_1, environment_1, extensions_1, extensionEnablementService_test_1, url_1, model_1, lifecycle_1, notification_1, urlService_1, experimentService_1, experimentService_test_1, storage_1, services_1, fileService_1, log_1, files_1, productService_1, extensionTipsService_1, extensionRecommendationsService_1, workspaceTagsService_1, workspaceTags_1, extensionsWorkbenchService_1, extensions_2, workspaceExtensionsConfig_1, extensionRecommendations_1, extensionIgnoredRecommendationsService_1, extensionRecommendations_2, extensionRecommendationNotificationService_1, contextkey_1, mockKeybindingService_1, inMemoryFilesystemProvider_1, resources_1, buffer_1, platform_1, process_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const mockExtensionGallery = [
        aGalleryExtension('MockExtension1', {
            displayName: 'Mock Extension 1',
            version: '1.5',
            publisherId: 'mockPublisher1Id',
            publisher: 'mockPublisher1',
            publisherDisplayName: 'Mock Publisher 1',
            description: 'Mock Description',
            installCount: 1000,
            rating: 4,
            ratingCount: 100
        }, {
            dependencies: ['pub.1'],
        }, {
            manifest: { uri: 'uri:manifest', fallbackUri: 'fallback:manifest' },
            readme: { uri: 'uri:readme', fallbackUri: 'fallback:readme' },
            changelog: { uri: 'uri:changelog', fallbackUri: 'fallback:changlog' },
            download: { uri: 'uri:download', fallbackUri: 'fallback:download' },
            icon: { uri: 'uri:icon', fallbackUri: 'fallback:icon' },
            license: { uri: 'uri:license', fallbackUri: 'fallback:license' },
            repository: { uri: 'uri:repository', fallbackUri: 'fallback:repository' },
            coreTranslations: []
        }),
        aGalleryExtension('MockExtension2', {
            displayName: 'Mock Extension 2',
            version: '1.5',
            publisherId: 'mockPublisher2Id',
            publisher: 'mockPublisher2',
            publisherDisplayName: 'Mock Publisher 2',
            description: 'Mock Description',
            installCount: 1000,
            rating: 4,
            ratingCount: 100
        }, {
            dependencies: ['pub.1', 'pub.2'],
        }, {
            manifest: { uri: 'uri:manifest', fallbackUri: 'fallback:manifest' },
            readme: { uri: 'uri:readme', fallbackUri: 'fallback:readme' },
            changelog: { uri: 'uri:changelog', fallbackUri: 'fallback:changlog' },
            download: { uri: 'uri:download', fallbackUri: 'fallback:download' },
            icon: { uri: 'uri:icon', fallbackUri: 'fallback:icon' },
            license: { uri: 'uri:license', fallbackUri: 'fallback:license' },
            repository: { uri: 'uri:repository', fallbackUri: 'fallback:repository' },
            coreTranslations: []
        })
    ];
    const mockExtensionLocal = [
        {
            type: 1 /* ExtensionType.User */,
            identifier: mockExtensionGallery[0].identifier,
            manifest: {
                name: mockExtensionGallery[0].name,
                publisher: mockExtensionGallery[0].publisher,
                version: mockExtensionGallery[0].version
            },
            metadata: null,
            path: 'somepath',
            readmeUrl: 'some readmeUrl',
            changelogUrl: 'some changelogUrl'
        },
        {
            type: 1 /* ExtensionType.User */,
            identifier: mockExtensionGallery[1].identifier,
            manifest: {
                name: mockExtensionGallery[1].name,
                publisher: mockExtensionGallery[1].publisher,
                version: mockExtensionGallery[1].version
            },
            metadata: null,
            path: 'somepath',
            readmeUrl: 'some readmeUrl',
            changelogUrl: 'some changelogUrl'
        }
    ];
    const mockTestData = {
        recommendedExtensions: [
            'mockPublisher1.mockExtension1',
            'MOCKPUBLISHER2.mockextension2',
            'badlyformattedextension',
            'MOCKPUBLISHER2.mockextension2',
            'unknown.extension'
        ],
        validRecommendedExtensions: [
            'mockPublisher1.mockExtension1',
            'MOCKPUBLISHER2.mockextension2'
        ]
    };
    function aPage(...objects) {
        return { firstPage: objects, total: objects.length, pageSize: objects.length, getPage: () => null };
    }
    const noAssets = {
        changelog: null,
        download: null,
        icon: null,
        license: null,
        manifest: null,
        readme: null,
        repository: null,
        coreTranslations: []
    };
    function aGalleryExtension(name, properties = {}, galleryExtensionProperties = {}, assets = noAssets) {
        const targetPlatform = (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch);
        const galleryExtension = Object.create(Object.assign({ name, publisher: 'pub', version: '1.0.0', allTargetPlatforms: [targetPlatform], properties: {}, assets: {} }, properties));
        galleryExtension.properties = Object.assign(Object.assign(Object.assign({}, galleryExtension.properties), { dependencies: [], targetPlatform }), galleryExtensionProperties);
        galleryExtension.assets = Object.assign(Object.assign({}, galleryExtension.assets), assets);
        galleryExtension.identifier = { id: (0, extensionManagementUtil_1.getGalleryExtensionId)(galleryExtension.publisher, galleryExtension.name), uuid: uuid.generateUuid() };
        return galleryExtension;
    }
    class TestExtensionRecommendationsService extends extensionRecommendationsService_1.ExtensionRecommendationsService {
        get workbenchRecommendationDelay() {
            return 0;
        }
    }
    suite('ExtensionRecommendationsService Test', () => {
        let workspaceService;
        let instantiationService;
        let testConfigurationService;
        let testObject;
        let installEvent, didInstallEvent, uninstallEvent, didUninstallEvent;
        let prompted;
        let promptedEmitter = new event_1.Emitter();
        let onModelAddedEvent;
        let experimentService;
        suiteSetup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            installEvent = new event_1.Emitter();
            didInstallEvent = new event_1.Emitter();
            uninstallEvent = new event_1.Emitter();
            didUninstallEvent = new event_1.Emitter();
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, extensionGalleryService_1.ExtensionGalleryService);
            instantiationService.stub(services_1.ISharedProcessService, workbenchTestServices_3.TestSharedProcessService);
            instantiationService.stub(lifecycle_1.ILifecycleService, new workbenchTestServices_1.TestLifecycleService());
            testConfigurationService = new testConfigurationService_1.TestConfigurationService();
            instantiationService.stub(configuration_1.IConfigurationService, testConfigurationService);
            instantiationService.stub(notification_1.INotificationService, new testNotificationService_1.TestNotificationService());
            instantiationService.stub(contextkey_1.IContextKeyService, new mockKeybindingService_1.MockContextKeyService());
            instantiationService.stub(extensionManagement_1.IExtensionManagementService, {
                onInstallExtension: installEvent.event,
                onDidInstallExtensions: didInstallEvent.event,
                onUninstallExtension: uninstallEvent.event,
                onDidUninstallExtension: didUninstallEvent.event,
                async getInstalled() { return []; },
                async canInstall() { return true; },
                async getExtensionsControlManifest() { return { malicious: [] }; },
                async getTargetPlatform() { return (0, extensionManagement_1.getTargetPlatform)(platform_1.platform, process_1.arch); }
            });
            instantiationService.stub(extensions_2.IExtensionService, {
                async whenInstalledExtensionsRegistered() { return true; }
            });
            instantiationService.stub(extensionManagement_2.IWorkbenchExtensionEnablementService, new extensionEnablementService_test_1.TestExtensionEnablementService(instantiationService));
            instantiationService.stub(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryService);
            instantiationService.stub(url_1.IURLService, urlService_1.NativeURLService);
            instantiationService.stub(workspaceTags_1.IWorkspaceTagsService, new workspaceTagsService_1.NoOpWorkspaceTagsService());
            instantiationService.stub(storage_1.IStorageService, new workbenchTestServices_2.TestStorageService());
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            instantiationService.stub(productService_1.IProductService, {
                extensionTips: {
                    'ms-dotnettools.csharp': '{**/*.cs,**/project.json,**/global.json,**/*.csproj,**/*.sln,**/appsettings.json}',
                    'msjsdiag.debugger-for-chrome': '{**/*.ts,**/*.tsx,**/*.js,**/*.jsx,**/*.es6,**/*.mjs,**/*.cjs,**/.babelrc}',
                    'lukehoban.Go': '**/*.go'
                },
                extensionImportantTips: {
                    'ms-python.python': {
                        'name': 'Python',
                        'pattern': '{**/*.py}'
                    },
                    'ms-vscode.PowerShell': {
                        'name': 'PowerShell',
                        'pattern': '{**/*.ps,**/*.ps1}'
                    }
                }
            });
            experimentService = instantiationService.createInstance(experimentService_test_1.TestExperimentService);
            instantiationService.stub(experimentService_1.IExperimentService, experimentService);
            instantiationService.set(extensions_1.IExtensionsWorkbenchService, instantiationService.createInstance(extensionsWorkbenchService_1.ExtensionsWorkbenchService));
            instantiationService.stub(extensionManagement_1.IExtensionTipsService, instantiationService.createInstance(extensionTipsService_1.ExtensionTipsService));
            onModelAddedEvent = new event_1.Emitter();
        });
        suiteTeardown(() => {
            if (experimentService) {
                experimentService.dispose();
            }
        });
        setup(() => {
            instantiationService.stub(environment_1.IEnvironmentService, {});
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', []);
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, 'isEnabled', true);
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'query', aPage(...mockExtensionGallery));
            instantiationService.stubPromise(extensionManagement_1.IExtensionGalleryService, 'getExtensions', mockExtensionGallery);
            prompted = false;
            class TestNotificationService2 extends testNotificationService_1.TestNotificationService {
                prompt(severity, message, choices, options) {
                    prompted = true;
                    promptedEmitter.fire();
                    return super.prompt(severity, message, choices, options);
                }
            }
            instantiationService.stub(notification_1.INotificationService, new TestNotificationService2());
            testConfigurationService.setUserConfiguration(extensions_1.ConfigurationKey, { ignoreRecommendations: false });
            instantiationService.stub(model_1.IModelService, {
                getModels() { return []; },
                onModelAdded: onModelAddedEvent.event
            });
        });
        teardown(() => testObject.dispose());
        function setUpFolderWorkspace(folderName, recommendedExtensions, ignoredRecommendations = []) {
            return setUpFolder(folderName, recommendedExtensions, ignoredRecommendations);
        }
        async function setUpFolder(folderName, recommendedExtensions, ignoredRecommendations = []) {
            const ROOT = uri_1.URI.file('tests').with({ scheme: 'vscode-tests' });
            const logService = new log_1.NullLogService();
            const fileService = new fileService_1.FileService(logService);
            const fileSystemProvider = new inMemoryFilesystemProvider_1.InMemoryFileSystemProvider();
            fileService.registerProvider(ROOT.scheme, fileSystemProvider);
            const folderDir = (0, resources_1.joinPath)(ROOT, folderName);
            const workspaceSettingsDir = (0, resources_1.joinPath)(folderDir, '.vscode');
            await fileService.createFolder(workspaceSettingsDir);
            const configPath = (0, resources_1.joinPath)(workspaceSettingsDir, 'extensions.json');
            await fileService.writeFile(configPath, buffer_1.VSBuffer.fromString(JSON.stringify({
                'recommendations': recommendedExtensions,
                'unwantedRecommendations': ignoredRecommendations,
            }, null, '\t')));
            const myWorkspace = (0, testWorkspace_1.testWorkspace)(folderDir);
            instantiationService.stub(files_1.IFileService, fileService);
            workspaceService = new workbenchTestServices_2.TestContextService(myWorkspace);
            instantiationService.stub(workspace_1.IWorkspaceContextService, workspaceService);
            instantiationService.stub(workspaceExtensionsConfig_1.IWorkspaceExtensionsConfigService, instantiationService.createInstance(workspaceExtensionsConfig_1.WorkspaceExtensionsConfigService));
            instantiationService.stub(extensionRecommendations_1.IExtensionIgnoredRecommendationsService, instantiationService.createInstance(extensionIgnoredRecommendationsService_1.ExtensionIgnoredRecommendationsService));
            instantiationService.stub(extensionRecommendations_2.IExtensionRecommendationNotificationService, instantiationService.createInstance(extensionRecommendationNotificationService_1.ExtensionRecommendationNotificationService));
        }
        function testNoPromptForValidRecommendations(recommendations) {
            return setUpFolderWorkspace('myFolder', recommendations).then(() => {
                testObject = instantiationService.createInstance(TestExtensionRecommendationsService);
                return testObject.activationPromise.then(() => {
                    assert.strictEqual(Object.keys(testObject.getAllRecommendationsWithReason()).length, recommendations.length);
                    assert.ok(!prompted);
                });
            });
        }
        function testNoPromptOrRecommendationsForValidRecommendations(recommendations) {
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions).then(() => {
                testObject = instantiationService.createInstance(TestExtensionRecommendationsService);
                assert.ok(!prompted);
                return testObject.getWorkspaceRecommendations().then(() => {
                    assert.strictEqual(Object.keys(testObject.getAllRecommendationsWithReason()).length, 0);
                    assert.ok(!prompted);
                });
            });
        }
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations when galleryService is absent', () => {
            const galleryQuerySpy = sinon.spy();
            instantiationService.stub(extensionManagement_1.IExtensionGalleryService, { query: galleryQuerySpy, isEnabled: () => false });
            return testNoPromptOrRecommendationsForValidRecommendations(mockTestData.validRecommendedExtensions)
                .then(() => assert.ok(galleryQuerySpy.notCalled));
        });
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations during extension development', () => {
            instantiationService.stub(environment_1.IEnvironmentService, { extensionDevelopmentLocationURI: [uri_1.URI.file('/folder/file')], isExtensionDevelopment: true });
            return testNoPromptOrRecommendationsForValidRecommendations(mockTestData.validRecommendedExtensions);
        });
        test('ExtensionRecommendationsService: No workspace recommendations or prompts when extensions.json has empty array', () => {
            return testNoPromptForValidRecommendations([]);
        });
        test('ExtensionRecommendationsService: Prompt for valid workspace recommendations', async () => {
            await setUpFolderWorkspace('myFolder', mockTestData.recommendedExtensions);
            testObject = instantiationService.createInstance(TestExtensionRecommendationsService);
            await event_1.Event.toPromise(promptedEmitter.event);
            const recommendations = Object.keys(testObject.getAllRecommendationsWithReason());
            assert.strictEqual(recommendations.length, mockTestData.validRecommendedExtensions.length);
            mockTestData.validRecommendedExtensions.forEach(x => {
                assert.strictEqual(recommendations.indexOf(x.toLowerCase()) > -1, true);
            });
        });
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations if they are already installed', () => {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', mockExtensionLocal);
            return testNoPromptForValidRecommendations(mockTestData.validRecommendedExtensions);
        });
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations with casing mismatch if they are already installed', () => {
            instantiationService.stubPromise(extensionManagement_1.IExtensionManagementService, 'getInstalled', mockExtensionLocal);
            return testNoPromptForValidRecommendations(mockTestData.validRecommendedExtensions.map(x => x.toUpperCase()));
        });
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations if ignoreRecommendations is set', () => {
            testConfigurationService.setUserConfiguration(extensions_1.ConfigurationKey, { ignoreRecommendations: true });
            return testNoPromptForValidRecommendations(mockTestData.validRecommendedExtensions);
        });
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations if ignoreRecommendations is set', () => {
            testConfigurationService.setUserConfiguration(extensions_1.ConfigurationKey, { ignoreRecommendations: true });
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions).then(() => {
                testObject = instantiationService.createInstance(TestExtensionRecommendationsService);
                return testObject.activationPromise.then(() => {
                    assert.ok(!prompted);
                });
            });
        });
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations if showRecommendationsOnlyOnDemand is set', () => {
            testConfigurationService.setUserConfiguration(extensions_1.ConfigurationKey, { showRecommendationsOnlyOnDemand: true });
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions).then(() => {
                testObject = instantiationService.createInstance(TestExtensionRecommendationsService);
                return testObject.activationPromise.then(() => {
                    assert.ok(!prompted);
                });
            });
        });
        test('ExtensionRecommendationsService: No Prompt for valid workspace recommendations if ignoreRecommendations is set for current workspace', () => {
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/workspaceRecommendationsIgnore', true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            return testNoPromptForValidRecommendations(mockTestData.validRecommendedExtensions);
        });
        test('ExtensionRecommendationsService: No Recommendations of globally ignored recommendations', () => {
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/workspaceRecommendationsIgnore', true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/recommendations', '["ms-dotnettools.csharp", "ms-python.python", "ms-vscode.vscode-typescript-tslint-plugin"]', 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/ignored_recommendations', '["ms-dotnettools.csharp", "mockpublisher2.mockextension2"]', 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions).then(() => {
                testObject = instantiationService.createInstance(TestExtensionRecommendationsService);
                return testObject.activationPromise.then(() => {
                    const recommendations = testObject.getAllRecommendationsWithReason();
                    assert.ok(!recommendations['ms-dotnettools.csharp']); // stored recommendation that has been globally ignored
                    assert.ok(recommendations['ms-python.python']); // stored recommendation
                    assert.ok(recommendations['mockpublisher1.mockextension1']); // workspace recommendation
                    assert.ok(!recommendations['mockpublisher2.mockextension2']); // workspace recommendation that has been globally ignored
                });
            });
        });
        test('ExtensionRecommendationsService: No Recommendations of workspace ignored recommendations', () => {
            const ignoredRecommendations = ['ms-dotnettools.csharp', 'mockpublisher2.mockextension2']; // ignore a stored recommendation and a workspace recommendation.
            const storedRecommendations = '["ms-dotnettools.csharp", "ms-python.python"]';
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/workspaceRecommendationsIgnore', true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/recommendations', storedRecommendations, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            return setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions, ignoredRecommendations).then(() => {
                testObject = instantiationService.createInstance(TestExtensionRecommendationsService);
                return testObject.activationPromise.then(() => {
                    const recommendations = testObject.getAllRecommendationsWithReason();
                    assert.ok(!recommendations['ms-dotnettools.csharp']); // stored recommendation that has been workspace ignored
                    assert.ok(recommendations['ms-python.python']); // stored recommendation
                    assert.ok(recommendations['mockpublisher1.mockextension1']); // workspace recommendation
                    assert.ok(!recommendations['mockpublisher2.mockextension2']); // workspace recommendation that has been workspace ignored
                });
            });
        });
        test.skip('ExtensionRecommendationsService: Able to retrieve collection of all ignored recommendations', async () => {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const workspaceIgnoredRecommendations = ['ms-dotnettools.csharp']; // ignore a stored recommendation and a workspace recommendation.
            const storedRecommendations = '["ms-dotnettools.csharp", "ms-python.python"]';
            const globallyIgnoredRecommendations = '["mockpublisher2.mockextension2"]'; // ignore a workspace recommendation.
            storageService.store('extensionsAssistant/workspaceRecommendationsIgnore', true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            storageService.store('extensionsAssistant/recommendations', storedRecommendations, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            storageService.store('extensionsAssistant/ignored_recommendations', globallyIgnoredRecommendations, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            await setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions, workspaceIgnoredRecommendations);
            testObject = instantiationService.createInstance(TestExtensionRecommendationsService);
            await testObject.activationPromise;
            const recommendations = testObject.getAllRecommendationsWithReason();
            assert.ok(recommendations['ms-python.python'], 'ms-python.python extension shall exist');
            assert.ok(!recommendations['mockpublisher2.mockextension2'], 'mockpublisher2.mockextension2 extension shall not exist');
            assert.ok(!recommendations['ms-dotnettools.csharp'], 'ms-dotnettools.csharp extension shall not exist');
        });
        test('ExtensionRecommendationsService: Able to dynamically ignore/unignore global recommendations', async () => {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const storedRecommendations = '["ms-dotnettools.csharp", "ms-python.python"]';
            const globallyIgnoredRecommendations = '["mockpublisher2.mockextension2"]'; // ignore a workspace recommendation.
            storageService.store('extensionsAssistant/workspaceRecommendationsIgnore', true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            storageService.store('extensionsAssistant/recommendations', storedRecommendations, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            storageService.store('extensionsAssistant/ignored_recommendations', globallyIgnoredRecommendations, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            await setUpFolderWorkspace('myFolder', mockTestData.validRecommendedExtensions);
            const extensionIgnoredRecommendationsService = instantiationService.get(extensionRecommendations_1.IExtensionIgnoredRecommendationsService);
            testObject = instantiationService.createInstance(TestExtensionRecommendationsService);
            await testObject.activationPromise;
            let recommendations = testObject.getAllRecommendationsWithReason();
            assert.ok(recommendations['ms-python.python']);
            assert.ok(recommendations['mockpublisher1.mockextension1']);
            assert.ok(!recommendations['mockpublisher2.mockextension2']);
            extensionIgnoredRecommendationsService.toggleGlobalIgnoredRecommendation('mockpublisher1.mockextension1', true);
            recommendations = testObject.getAllRecommendationsWithReason();
            assert.ok(recommendations['ms-python.python']);
            assert.ok(!recommendations['mockpublisher1.mockextension1']);
            assert.ok(!recommendations['mockpublisher2.mockextension2']);
            extensionIgnoredRecommendationsService.toggleGlobalIgnoredRecommendation('mockpublisher1.mockextension1', false);
            recommendations = testObject.getAllRecommendationsWithReason();
            assert.ok(recommendations['ms-python.python']);
            assert.ok(recommendations['mockpublisher1.mockextension1']);
            assert.ok(!recommendations['mockpublisher2.mockextension2']);
        });
        test('test global extensions are modified and recommendation change event is fired when an extension is ignored', async () => {
            const storageService = instantiationService.get(storage_1.IStorageService);
            const changeHandlerTarget = sinon.spy();
            const ignoredExtensionId = 'Some.Extension';
            storageService.store('extensionsAssistant/workspaceRecommendationsIgnore', true, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            storageService.store('extensionsAssistant/ignored_recommendations', '["ms-vscode.vscode"]', 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            await setUpFolderWorkspace('myFolder', []);
            testObject = instantiationService.createInstance(TestExtensionRecommendationsService);
            const extensionIgnoredRecommendationsService = instantiationService.get(extensionRecommendations_1.IExtensionIgnoredRecommendationsService);
            extensionIgnoredRecommendationsService.onDidChangeGlobalIgnoredRecommendation(changeHandlerTarget);
            extensionIgnoredRecommendationsService.toggleGlobalIgnoredRecommendation(ignoredExtensionId, true);
            await testObject.activationPromise;
            assert.ok(changeHandlerTarget.calledOnce);
            assert.ok(changeHandlerTarget.getCall(0).calledWithMatch({ extensionId: ignoredExtensionId.toLowerCase(), isRecommended: false }));
        });
        test('ExtensionRecommendationsService: Get file based recommendations from storage (old format)', () => {
            const storedRecommendations = '["ms-dotnettools.csharp", "ms-python.python", "ms-vscode.vscode-typescript-tslint-plugin"]';
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/recommendations', storedRecommendations, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            return setUpFolderWorkspace('myFolder', []).then(() => {
                testObject = instantiationService.createInstance(TestExtensionRecommendationsService);
                return testObject.activationPromise.then(() => {
                    const recommendations = testObject.getFileBasedRecommendations();
                    assert.strictEqual(recommendations.length, 2);
                    assert.ok(recommendations.some(extensionId => extensionId === 'ms-dotnettools.csharp')); // stored recommendation that exists in product.extensionTips
                    assert.ok(recommendations.some(extensionId => extensionId === 'ms-python.python')); // stored recommendation that exists in product.extensionImportantTips
                    assert.ok(recommendations.every(extensionId => extensionId !== 'ms-vscode.vscode-typescript-tslint-plugin')); // stored recommendation that is no longer in neither product.extensionTips nor product.extensionImportantTips
                });
            });
        });
        test('ExtensionRecommendationsService: Get file based recommendations from storage (new format)', () => {
            const milliSecondsInADay = 1000 * 60 * 60 * 24;
            const now = Date.now();
            const tenDaysOld = 10 * milliSecondsInADay;
            const storedRecommendations = `{"ms-dotnettools.csharp": ${now}, "ms-python.python": ${now}, "ms-vscode.vscode-typescript-tslint-plugin": ${now}, "lukehoban.Go": ${tenDaysOld}}`;
            instantiationService.get(storage_1.IStorageService).store('extensionsAssistant/recommendations', storedRecommendations, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            return setUpFolderWorkspace('myFolder', []).then(() => {
                testObject = instantiationService.createInstance(TestExtensionRecommendationsService);
                return testObject.activationPromise.then(() => {
                    const recommendations = testObject.getFileBasedRecommendations();
                    assert.strictEqual(recommendations.length, 2);
                    assert.ok(recommendations.some(extensionId => extensionId === 'ms-dotnettools.csharp')); // stored recommendation that exists in product.extensionTips
                    assert.ok(recommendations.some(extensionId => extensionId === 'ms-python.python')); // stored recommendation that exists in product.extensionImportantTips
                    assert.ok(recommendations.every(extensionId => extensionId !== 'ms-vscode.vscode-typescript-tslint-plugin')); // stored recommendation that is no longer in neither product.extensionTips nor product.extensionImportantTips
                    assert.ok(recommendations.every(extensionId => extensionId !== 'lukehoban.Go')); //stored recommendation that is older than a week
                });
            });
        });
    });
});
//# sourceMappingURL=extensionRecommendationsService.test.js.map