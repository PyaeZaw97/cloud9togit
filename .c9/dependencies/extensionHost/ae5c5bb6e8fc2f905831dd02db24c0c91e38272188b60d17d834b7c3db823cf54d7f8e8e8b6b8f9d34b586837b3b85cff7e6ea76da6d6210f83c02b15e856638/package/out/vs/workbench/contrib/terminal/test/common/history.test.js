/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/storage/common/storage", "vs/workbench/contrib/terminal/common/history", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, storage_1, history_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getConfig(limit) {
        return {
            terminal: {
                integrated: {
                    shellIntegration: {
                        history: limit
                    }
                }
            }
        };
    }
    suite('TerminalPersistedHistory', () => {
        let history;
        let instantiationService;
        let storageService;
        let configurationService;
        setup(() => {
            configurationService = new testConfigurationService_1.TestConfigurationService(getConfig(5));
            storageService = new workbenchTestServices_1.TestStorageService();
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.set(configuration_1.IConfigurationService, configurationService);
            instantiationService.set(storage_1.IStorageService, storageService);
            history = instantiationService.createInstance(history_1.TerminalPersistedHistory, 'test');
        });
        test('should support adding items to the cache and respect LRU', () => {
            history.add('foo', 1);
            (0, assert_1.deepStrictEqual)(Array.from(history.entries), [
                ['foo', 1]
            ]);
            history.add('bar', 2);
            (0, assert_1.deepStrictEqual)(Array.from(history.entries), [
                ['foo', 1],
                ['bar', 2]
            ]);
            history.add('foo', 1);
            (0, assert_1.deepStrictEqual)(Array.from(history.entries), [
                ['bar', 2],
                ['foo', 1]
            ]);
        });
        test('should support removing specific items', () => {
            history.add('1', 1);
            history.add('2', 2);
            history.add('3', 3);
            history.add('4', 4);
            history.add('5', 5);
            (0, assert_1.strictEqual)(Array.from(history.entries).length, 5);
            history.add('6', 6);
            (0, assert_1.strictEqual)(Array.from(history.entries).length, 5);
        });
        test('should limit the number of entries based on config', () => {
            history.add('1', 1);
            history.add('2', 2);
            history.add('3', 3);
            history.add('4', 4);
            history.add('5', 5);
            (0, assert_1.strictEqual)(Array.from(history.entries).length, 5);
            history.add('6', 6);
            (0, assert_1.strictEqual)(Array.from(history.entries).length, 5);
            configurationService.setUserConfiguration('terminal', getConfig(2).terminal);
            configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true });
            (0, assert_1.strictEqual)(Array.from(history.entries).length, 2);
            history.add('7', 7);
            (0, assert_1.strictEqual)(Array.from(history.entries).length, 2);
            configurationService.setUserConfiguration('terminal', getConfig(3).terminal);
            configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true });
            (0, assert_1.strictEqual)(Array.from(history.entries).length, 2);
            history.add('8', 8);
            (0, assert_1.strictEqual)(Array.from(history.entries).length, 3);
            history.add('9', 9);
            (0, assert_1.strictEqual)(Array.from(history.entries).length, 3);
        });
        test('should reload from storage service after recreation', () => {
            history.add('1', 1);
            history.add('2', 2);
            history.add('3', 3);
            (0, assert_1.strictEqual)(Array.from(history.entries).length, 3);
            const history2 = instantiationService.createInstance(history_1.TerminalPersistedHistory, 'test');
            (0, assert_1.strictEqual)(Array.from(history2.entries).length, 3);
        });
    });
});
//# sourceMappingURL=history.test.js.map