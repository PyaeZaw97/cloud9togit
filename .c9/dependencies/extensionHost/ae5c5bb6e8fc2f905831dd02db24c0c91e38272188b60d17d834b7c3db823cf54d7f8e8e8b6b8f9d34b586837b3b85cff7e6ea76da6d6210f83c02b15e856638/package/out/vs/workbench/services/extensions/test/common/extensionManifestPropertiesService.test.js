/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/test/common/workbenchTestServices", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/configuration/common/configuration", "vs/platform/product/common/productService", "vs/base/common/platform", "vs/workbench/services/workspaces/test/common/testWorkspaceTrustService", "vs/platform/workspace/common/workspaceTrust", "vs/platform/log/common/log"], function (require, exports, assert, extensionManifestPropertiesService_1, testConfigurationService_1, workbenchTestServices_1, instantiationServiceMock_1, configuration_1, productService_1, platform_1, testWorkspaceTrustService_1, workspaceTrust_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtensionManifestPropertiesService - ExtensionKind', () => {
        let testObject = new extensionManifestPropertiesService_1.ExtensionManifestPropertiesService(workbenchTestServices_1.TestProductService, new testConfigurationService_1.TestConfigurationService(), new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService(), new log_1.NullLogService());
        test('declarative with extension dependencies', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ extensionDependencies: ['ext1'] }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('declarative extension pack', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ extensionPack: ['ext1', 'ext2'] }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('declarative extension pack and extension dependencies', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ extensionPack: ['ext1', 'ext2'], extensionDependencies: ['ext1', 'ext2'] }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('declarative with unknown contribution point => workspace, web in web and => workspace in desktop', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ contributes: { 'unknownPoint': { something: true } } }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('declarative extension pack with unknown contribution point', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ extensionPack: ['ext1', 'ext2'], contributes: { 'unknownPoint': { something: true } } }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('simple declarative => ui, workspace, web', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({}), ['ui', 'workspace', 'web']);
        });
        test('only browser => web', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ browser: 'main.browser.js' }), ['web']);
        });
        test('only main => workspace', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ main: 'main.js' }), ['workspace']);
        });
        test('main and browser => workspace, web in web and workspace in desktop', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ main: 'main.js', browser: 'main.browser.js' }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('browser entry point with workspace extensionKind => workspace, web in web and workspace in desktop', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ main: 'main.js', browser: 'main.browser.js', extensionKind: ['workspace'] }), platform_1.isWeb ? ['workspace', 'web'] : ['workspace']);
        });
        test('only browser entry point with out extensionKind => web', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ browser: 'main.browser.js' }), ['web']);
        });
        test('simple descriptive with workspace, ui extensionKind => workspace, ui, web in web and workspace, ui in desktop', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ extensionKind: ['workspace', 'ui'] }), platform_1.isWeb ? ['workspace', 'ui', 'web'] : ['workspace', 'ui']);
        });
        test('opt out from web through settings even if it can run in web', () => {
            testObject = new extensionManifestPropertiesService_1.ExtensionManifestPropertiesService(workbenchTestServices_1.TestProductService, new testConfigurationService_1.TestConfigurationService({ remote: { extensionKind: { 'pub.a': ['-web'] } } }), new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService(), new log_1.NullLogService());
            assert.deepStrictEqual(testObject.getExtensionKind({ browser: 'main.browser.js', publisher: 'pub', name: 'a' }), ['ui', 'workspace']);
        });
        test('opt out from web and include only workspace through settings even if it can run in web', () => {
            testObject = new extensionManifestPropertiesService_1.ExtensionManifestPropertiesService(workbenchTestServices_1.TestProductService, new testConfigurationService_1.TestConfigurationService({ remote: { extensionKind: { 'pub.a': ['-web', 'workspace'] } } }), new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService(), new log_1.NullLogService());
            assert.deepStrictEqual(testObject.getExtensionKind({ browser: 'main.browser.js', publisher: 'pub', name: 'a' }), ['workspace']);
        });
        test('extension cannot opt out from web', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ browser: 'main.browser.js', extensionKind: ['-web'] }), ['web']);
        });
        test('extension cannot opt into web', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ main: 'main.js', extensionKind: ['web', 'workspace', 'ui'] }), ['workspace', 'ui']);
        });
        test('extension cannot opt into web only', () => {
            assert.deepStrictEqual(testObject.getExtensionKind({ main: 'main.js', extensionKind: ['web'] }), ['workspace']);
        });
    });
    // Workspace Trust is disabled in web at the moment
    if (!platform_1.isWeb) {
        suite('ExtensionManifestPropertiesService - ExtensionUntrustedWorkspaceSupportType', () => {
            let testObject;
            let instantiationService;
            let testConfigurationService;
            setup(async () => {
                instantiationService = new instantiationServiceMock_1.TestInstantiationService();
                testConfigurationService = new testConfigurationService_1.TestConfigurationService();
                instantiationService.stub(configuration_1.IConfigurationService, testConfigurationService);
            });
            teardown(() => testObject.dispose());
            function assertUntrustedWorkspaceSupport(extensionMaifest, expected) {
                testObject = instantiationService.createInstance(extensionManifestPropertiesService_1.ExtensionManifestPropertiesService);
                const untrustedWorkspaceSupport = testObject.getExtensionUntrustedWorkspaceSupportType(extensionMaifest);
                assert.strictEqual(untrustedWorkspaceSupport, expected);
            }
            function getExtensionManifest(properties = {}) {
                return Object.create(Object.assign({ name: 'a', publisher: 'pub', version: '1.0.0' }, properties));
            }
            test('test extension workspace trust request when main entry point is missing', () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService());
                const extensionMaifest = getExtensionManifest();
                assertUntrustedWorkspaceSupport(extensionMaifest, true);
            });
            test('test extension workspace trust request when workspace trust is disabled', async () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService(false));
                const extensionMaifest = getExtensionManifest({ main: './out/extension.js' });
                assertUntrustedWorkspaceSupport(extensionMaifest, true);
            });
            test('test extension workspace trust request when "true" override exists in settings.json', async () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService());
                await testConfigurationService.setUserConfiguration('extensions', { supportUntrustedWorkspaces: { 'pub.a': { supported: true } } });
                const extensionMaifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: 'limited' } } });
                assertUntrustedWorkspaceSupport(extensionMaifest, true);
            });
            test('test extension workspace trust request when override (false) exists in settings.json', async () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService());
                await testConfigurationService.setUserConfiguration('extensions', { supportUntrustedWorkspaces: { 'pub.a': { supported: false } } });
                const extensionMaifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: 'limited' } } });
                assertUntrustedWorkspaceSupport(extensionMaifest, false);
            });
            test('test extension workspace trust request when override (true) for the version exists in settings.json', async () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService());
                await testConfigurationService.setUserConfiguration('extensions', { supportUntrustedWorkspaces: { 'pub.a': { supported: true, version: '1.0.0' } } });
                const extensionMaifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: 'limited' } } });
                assertUntrustedWorkspaceSupport(extensionMaifest, true);
            });
            test('test extension workspace trust request when override (false) for the version exists in settings.json', async () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService());
                await testConfigurationService.setUserConfiguration('extensions', { supportUntrustedWorkspaces: { 'pub.a': { supported: false, version: '1.0.0' } } });
                const extensionMaifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: 'limited' } } });
                assertUntrustedWorkspaceSupport(extensionMaifest, false);
            });
            test('test extension workspace trust request when override for a different version exists in settings.json', async () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService());
                await testConfigurationService.setUserConfiguration('extensions', { supportUntrustedWorkspaces: { 'pub.a': { supported: true, version: '2.0.0' } } });
                const extensionMaifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: 'limited' } } });
                assertUntrustedWorkspaceSupport(extensionMaifest, 'limited');
            });
            test('test extension workspace trust request when default (true) exists in product.json', () => {
                instantiationService.stub(productService_1.IProductService, { extensionUntrustedWorkspaceSupport: { 'pub.a': { default: true } } });
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService());
                const extensionMaifest = getExtensionManifest({ main: './out/extension.js' });
                assertUntrustedWorkspaceSupport(extensionMaifest, true);
            });
            test('test extension workspace trust request when default (false) exists in product.json', () => {
                instantiationService.stub(productService_1.IProductService, { extensionUntrustedWorkspaceSupport: { 'pub.a': { default: false } } });
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService());
                const extensionMaifest = getExtensionManifest({ main: './out/extension.js' });
                assertUntrustedWorkspaceSupport(extensionMaifest, false);
            });
            test('test extension workspace trust request when override (limited) exists in product.json', () => {
                instantiationService.stub(productService_1.IProductService, { extensionUntrustedWorkspaceSupport: { 'pub.a': { override: 'limited' } } });
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService());
                const extensionMaifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: true } } });
                assertUntrustedWorkspaceSupport(extensionMaifest, 'limited');
            });
            test('test extension workspace trust request when override (false) exists in product.json', () => {
                instantiationService.stub(productService_1.IProductService, { extensionUntrustedWorkspaceSupport: { 'pub.a': { override: false } } });
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService());
                const extensionMaifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: true } } });
                assertUntrustedWorkspaceSupport(extensionMaifest, false);
            });
            test('test extension workspace trust request when value exists in package.json', () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService());
                const extensionMaifest = getExtensionManifest({ main: './out/extension.js', capabilities: { untrustedWorkspaces: { supported: 'limited' } } });
                assertUntrustedWorkspaceSupport(extensionMaifest, 'limited');
            });
            test('test extension workspace trust request when no value exists in package.json', () => {
                instantiationService.stub(productService_1.IProductService, {});
                instantiationService.stub(workspaceTrust_1.IWorkspaceTrustEnablementService, new testWorkspaceTrustService_1.TestWorkspaceTrustEnablementService());
                const extensionMaifest = getExtensionManifest({ main: './out/extension.js' });
                assertUntrustedWorkspaceSupport(extensionMaifest, false);
            });
        });
    }
});
//# sourceMappingURL=extensionManifestPropertiesService.test.js.map