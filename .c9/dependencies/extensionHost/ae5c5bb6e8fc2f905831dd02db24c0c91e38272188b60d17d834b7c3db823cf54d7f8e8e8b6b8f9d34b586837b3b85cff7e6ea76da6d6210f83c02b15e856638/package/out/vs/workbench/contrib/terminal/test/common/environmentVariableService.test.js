/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/contrib/terminal/common/environmentVariableService", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/platform/storage/common/storage", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/services/extensions/common/extensions", "vs/base/common/event"], function (require, exports, assert_1, workbenchTestServices_1, environmentVariableService_1, environmentVariable_1, storage_1, instantiationServiceMock_1, extensions_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestEnvironmentVariableService extends environmentVariableService_1.EnvironmentVariableService {
        persistCollections() { this._persistCollections(); }
        notifyCollectionUpdates() { this._notifyCollectionUpdates(); }
    }
    suite('EnvironmentVariable - EnvironmentVariableService', () => {
        let instantiationService;
        let environmentVariableService;
        let storageService;
        let changeExtensionsEvent;
        setup(() => {
            changeExtensionsEvent = new event_1.Emitter();
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(extensions_1.IExtensionService, workbenchTestServices_1.TestExtensionService);
            storageService = new workbenchTestServices_1.TestStorageService();
            instantiationService.stub(storage_1.IStorageService, storageService);
            instantiationService.stub(extensions_1.IExtensionService, workbenchTestServices_1.TestExtensionService);
            instantiationService.stub(extensions_1.IExtensionService, 'onDidChangeExtensions', changeExtensionsEvent.event);
            instantiationService.stub(extensions_1.IExtensionService, 'getExtensions', [
                { identifier: { value: 'ext1' } },
                { identifier: { value: 'ext2' } },
                { identifier: { value: 'ext3' } }
            ]);
            environmentVariableService = instantiationService.createInstance(TestEnvironmentVariableService);
        });
        test('should persist collections to the storage service and be able to restore from them', () => {
            const collection = new Map();
            collection.set('A', { value: 'a', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace });
            collection.set('B', { value: 'b', type: environmentVariable_1.EnvironmentVariableMutatorType.Append });
            collection.set('C', { value: 'c', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend });
            environmentVariableService.set('ext1', { map: collection, persistent: true });
            (0, assert_1.deepStrictEqual)([...environmentVariableService.mergedCollection.map.entries()], [
                ['A', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, value: 'a' }]],
                ['B', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'b' }]],
                ['C', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'c' }]]
            ]);
            // Persist with old service, create a new service with the same storage service to verify restore
            environmentVariableService.persistCollections();
            const service2 = instantiationService.createInstance(TestEnvironmentVariableService);
            (0, assert_1.deepStrictEqual)([...service2.mergedCollection.map.entries()], [
                ['A', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, value: 'a' }]],
                ['B', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'b' }]],
                ['C', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'c' }]]
            ]);
        });
        suite('mergedCollection', () => {
            test('should overwrite any other variable with the first extension that replaces', () => {
                const collection1 = new Map();
                const collection2 = new Map();
                const collection3 = new Map();
                collection1.set('A', { value: 'a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append });
                collection1.set('B', { value: 'b1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace });
                collection2.set('A', { value: 'a2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace });
                collection2.set('B', { value: 'b2', type: environmentVariable_1.EnvironmentVariableMutatorType.Append });
                collection3.set('A', { value: 'a3', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend });
                collection3.set('B', { value: 'b3', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace });
                environmentVariableService.set('ext1', { map: collection1, persistent: true });
                environmentVariableService.set('ext2', { map: collection2, persistent: true });
                environmentVariableService.set('ext3', { map: collection3, persistent: true });
                (0, assert_1.deepStrictEqual)([...environmentVariableService.mergedCollection.map.entries()], [
                    ['A', [
                            { extensionIdentifier: 'ext2', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, value: 'a2' },
                            { extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: 'a1' }
                        ]],
                    ['B', [{ extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, value: 'b1' }]]
                ]);
            });
            test('should correctly apply the environment values from multiple extension contributions in the correct order', async () => {
                const collection1 = new Map();
                const collection2 = new Map();
                const collection3 = new Map();
                collection1.set('A', { value: ':a1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append });
                collection2.set('A', { value: 'a2:', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend });
                collection3.set('A', { value: 'a3', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace });
                environmentVariableService.set('ext1', { map: collection1, persistent: true });
                environmentVariableService.set('ext2', { map: collection2, persistent: true });
                environmentVariableService.set('ext3', { map: collection3, persistent: true });
                // The entries should be ordered in the order they are applied
                (0, assert_1.deepStrictEqual)([...environmentVariableService.mergedCollection.map.entries()], [
                    ['A', [
                            { extensionIdentifier: 'ext3', type: environmentVariable_1.EnvironmentVariableMutatorType.Replace, value: 'a3' },
                            { extensionIdentifier: 'ext2', type: environmentVariable_1.EnvironmentVariableMutatorType.Prepend, value: 'a2:' },
                            { extensionIdentifier: 'ext1', type: environmentVariable_1.EnvironmentVariableMutatorType.Append, value: ':a1' }
                        ]]
                ]);
                // Verify the entries get applied to the environment as expected
                const env = { A: 'foo' };
                await environmentVariableService.mergedCollection.applyToProcessEnvironment(env);
                (0, assert_1.deepStrictEqual)(env, { A: 'a2:a3:a1' });
            });
        });
    });
});
//# sourceMappingURL=environmentVariableService.test.js.map