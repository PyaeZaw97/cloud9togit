/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/workbench/services/configuration/browser/configuration", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, event_1, resources_1, uri_1, configurationRegistry_1, platform_1, configuration_1, environmentService_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationCache = void 0;
    class ConfigurationCache {
        constructor() {
            this.cache = new Map();
        }
        needsCaching(resource) { return false; }
        async read({ type, key }) { return this.cache.get(`${type}:${key}`) || ''; }
        async write({ type, key }, content) { this.cache.set(`${type}:${key}`, content); }
        async remove({ type, key }) { this.cache.delete(`${type}:${key}`); }
    }
    exports.ConfigurationCache = ConfigurationCache;
    suite('DefaultConfiguration', () => {
        const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
        const cacheKey = { type: 'defaults', key: 'configurationDefaultsOverrides' };
        let configurationCache;
        setup(() => {
            configurationCache = new ConfigurationCache();
            configurationRegistry.registerConfiguration({
                'id': 'test.configurationDefaultsOverride',
                'type': 'object',
                'properties': {
                    'test.configurationDefaultsOverride': {
                        'type': 'string',
                        'default': 'defaultValue',
                    }
                }
            });
        });
        teardown(() => {
            configurationRegistry.deregisterConfigurations(configurationRegistry.getConfigurations());
            const configurationDefaultsOverrides = configurationRegistry.getConfigurationDefaultsOverrides();
            configurationRegistry.deregisterDefaultConfigurations([...configurationDefaultsOverrides.keys()].map(key => { var _a, _b; return ({ extensionId: (_a = configurationDefaultsOverrides.get(key)) === null || _a === void 0 ? void 0 : _a.source, overrides: { [key]: (_b = configurationDefaultsOverrides.get(key)) === null || _b === void 0 ? void 0 : _b.value } }); }));
        });
        test('configuration default overrides are read from environment', async () => {
            const environmentService = new environmentService_1.BrowserWorkbenchEnvironmentService('', (0, resources_1.joinPath)(uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }), 'logs'), { configurationDefaults: { 'test.configurationDefaultsOverride': 'envOverrideValue' } }, workbenchTestServices_2.TestProductService);
            const testObject = new configuration_1.DefaultConfiguration(configurationCache, environmentService);
            assert.deepStrictEqual(testObject.configurationModel.getValue('test.configurationDefaultsOverride'), 'envOverrideValue');
        });
        test('configuration default overrides are read from cache', async () => {
            window.localStorage.setItem(configuration_1.DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
            await configurationCache.write(cacheKey, JSON.stringify({ 'test.configurationDefaultsOverride': 'overrideValue' }));
            const testObject = new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService);
            const actual = await testObject.initialize();
            assert.deepStrictEqual(actual.getValue('test.configurationDefaultsOverride'), 'overrideValue');
        });
        test('configuration default overrides are read from cache when model is read before initialize', async () => {
            window.localStorage.setItem(configuration_1.DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
            await configurationCache.write(cacheKey, JSON.stringify({ 'test.configurationDefaultsOverride': 'overrideValue' }));
            const testObject = new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService);
            assert.deepStrictEqual(testObject.configurationModel.getValue('test.configurationDefaultsOverride'), 'defaultValue');
            const actual = await testObject.initialize();
            assert.deepStrictEqual(actual.getValue('test.configurationDefaultsOverride'), 'overrideValue');
            assert.deepStrictEqual(testObject.configurationModel.getValue('test.configurationDefaultsOverride'), 'overrideValue');
        });
        test('configuration default overrides are read from cache', async () => {
            window.localStorage.setItem(configuration_1.DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
            await configurationCache.write(cacheKey, JSON.stringify({ 'test.configurationDefaultsOverride': 'overrideValue' }));
            const testObject = new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService);
            const actual = await testObject.initialize();
            assert.deepStrictEqual(actual.getValue('test.configurationDefaultsOverride'), 'overrideValue');
        });
        test('configuration default overrides read from cache override environment', async () => {
            const environmentService = new environmentService_1.BrowserWorkbenchEnvironmentService('', (0, resources_1.joinPath)(uri_1.URI.file('tests').with({ scheme: 'vscode-tests' }), 'logs'), { configurationDefaults: { 'test.configurationDefaultsOverride': 'envOverrideValue' } }, workbenchTestServices_2.TestProductService);
            window.localStorage.setItem(configuration_1.DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
            await configurationCache.write(cacheKey, JSON.stringify({ 'test.configurationDefaultsOverride': 'overrideValue' }));
            const testObject = new configuration_1.DefaultConfiguration(configurationCache, environmentService);
            const actual = await testObject.initialize();
            assert.deepStrictEqual(actual.getValue('test.configurationDefaultsOverride'), 'overrideValue');
        });
        test('configuration default overrides are read from cache when default configuration changed', async () => {
            window.localStorage.setItem(configuration_1.DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
            await configurationCache.write(cacheKey, JSON.stringify({ 'test.configurationDefaultsOverride': 'overrideValue' }));
            const testObject = new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService);
            await testObject.initialize();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            configurationRegistry.registerConfiguration({
                'id': 'test.configurationDefaultsOverride',
                'type': 'object',
                'properties': {
                    'test.configurationDefaultsOverride1': {
                        'type': 'string',
                        'default': 'defaultValue',
                    }
                }
            });
            const { defaults: actual } = await promise;
            assert.deepStrictEqual(actual.getValue('test.configurationDefaultsOverride'), 'overrideValue');
        });
        test('configuration default overrides are not read from cache after reload', async () => {
            window.localStorage.setItem(configuration_1.DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
            await configurationCache.write(cacheKey, JSON.stringify({ 'test.configurationDefaultsOverride': 'overrideValue' }));
            const testObject = new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService);
            await testObject.initialize();
            const actual = testObject.reload();
            assert.deepStrictEqual(actual.getValue('test.configurationDefaultsOverride'), 'defaultValue');
        });
        test('cache is reset after reload', async () => {
            window.localStorage.setItem(configuration_1.DefaultConfiguration.DEFAULT_OVERRIDES_CACHE_EXISTS_KEY, 'yes');
            await configurationCache.write(cacheKey, JSON.stringify({ 'test.configurationDefaultsOverride': 'overrideValue' }));
            const testObject = new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService);
            await testObject.initialize();
            testObject.reload();
            assert.deepStrictEqual(await configurationCache.read(cacheKey), '');
        });
        test('configuration default overrides are written in cache', async () => {
            const testObject = new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService);
            await testObject.initialize();
            testObject.reload();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            configurationRegistry.registerDefaultConfigurations([{ overrides: { 'test.configurationDefaultsOverride': 'newoverrideValue' } }]);
            await promise;
            const actual = JSON.parse(await configurationCache.read(cacheKey));
            assert.deepStrictEqual(actual, { 'test.configurationDefaultsOverride': 'newoverrideValue' });
        });
        test('configuration default overrides are removed from cache if there are no overrides', async () => {
            const testObject = new configuration_1.DefaultConfiguration(configurationCache, workbenchTestServices_1.TestEnvironmentService);
            await testObject.initialize();
            const promise = event_1.Event.toPromise(testObject.onDidChangeConfiguration);
            configurationRegistry.registerConfiguration({
                'id': 'test.configurationDefaultsOverride',
                'type': 'object',
                'properties': {
                    'test.configurationDefaultsOverride1': {
                        'type': 'string',
                        'default': 'defaultValue',
                    }
                }
            });
            await promise;
            assert.deepStrictEqual(await configurationCache.read(cacheKey), '');
        });
    });
});
//# sourceMappingURL=configuration.test.js.map