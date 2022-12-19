/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/storage/common/storage"], function (require, exports, assert_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createSuite = void 0;
    function createSuite(params) {
        let storageService;
        setup(async () => {
            storageService = await params.setup();
        });
        teardown(() => {
            return params.teardown(storageService);
        });
        test('Get Data, Integer, Boolean (global)', () => {
            storeData(0 /* StorageScope.GLOBAL */);
        });
        test('Get Data, Integer, Boolean (workspace)', () => {
            storeData(1 /* StorageScope.WORKSPACE */);
        });
        function storeData(scope) {
            let storageValueChangeEvents = [];
            storageService.onDidChangeValue(e => storageValueChangeEvents.push(e));
            (0, assert_1.strictEqual)(storageService.get('test.get', scope, 'foobar'), 'foobar');
            (0, assert_1.strictEqual)(storageService.get('test.get', scope, ''), '');
            (0, assert_1.strictEqual)(storageService.getNumber('test.getNumber', scope, 5), 5);
            (0, assert_1.strictEqual)(storageService.getNumber('test.getNumber', scope, 0), 0);
            (0, assert_1.strictEqual)(storageService.getBoolean('test.getBoolean', scope, true), true);
            (0, assert_1.strictEqual)(storageService.getBoolean('test.getBoolean', scope, false), false);
            storageService.store('test.get', 'foobar', scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)(storageService.get('test.get', scope, (undefined)), 'foobar');
            let storageValueChangeEvent = storageValueChangeEvents.find(e => e.key === 'test.get');
            (0, assert_1.strictEqual)(storageValueChangeEvent === null || storageValueChangeEvent === void 0 ? void 0 : storageValueChangeEvent.scope, scope);
            (0, assert_1.strictEqual)(storageValueChangeEvent === null || storageValueChangeEvent === void 0 ? void 0 : storageValueChangeEvent.key, 'test.get');
            storageValueChangeEvents = [];
            storageService.store('test.get', '', scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)(storageService.get('test.get', scope, (undefined)), '');
            storageValueChangeEvent = storageValueChangeEvents.find(e => e.key === 'test.get');
            (0, assert_1.strictEqual)(storageValueChangeEvent.scope, scope);
            (0, assert_1.strictEqual)(storageValueChangeEvent.key, 'test.get');
            storageService.store('test.getNumber', 5, scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)(storageService.getNumber('test.getNumber', scope, (undefined)), 5);
            storageService.store('test.getNumber', 0, scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)(storageService.getNumber('test.getNumber', scope, (undefined)), 0);
            storageService.store('test.getBoolean', true, scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)(storageService.getBoolean('test.getBoolean', scope, (undefined)), true);
            storageService.store('test.getBoolean', false, scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)(storageService.getBoolean('test.getBoolean', scope, (undefined)), false);
            (0, assert_1.strictEqual)(storageService.get('test.getDefault', scope, 'getDefault'), 'getDefault');
            (0, assert_1.strictEqual)(storageService.getNumber('test.getNumberDefault', scope, 5), 5);
            (0, assert_1.strictEqual)(storageService.getBoolean('test.getBooleanDefault', scope, true), true);
        }
        test('Remove Data (global)', () => {
            removeData(0 /* StorageScope.GLOBAL */);
        });
        test('Remove Data (workspace)', () => {
            removeData(1 /* StorageScope.WORKSPACE */);
        });
        function removeData(scope) {
            let storageValueChangeEvents = [];
            storageService.onDidChangeValue(e => storageValueChangeEvents.push(e));
            storageService.store('test.remove', 'foobar', scope, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.strictEqual)('foobar', storageService.get('test.remove', scope, (undefined)));
            storageService.remove('test.remove', scope);
            (0, assert_1.ok)(!storageService.get('test.remove', scope, (undefined)));
            let storageValueChangeEvent = storageValueChangeEvents.find(e => e.key === 'test.remove');
            (0, assert_1.strictEqual)(storageValueChangeEvent === null || storageValueChangeEvent === void 0 ? void 0 : storageValueChangeEvent.scope, scope);
            (0, assert_1.strictEqual)(storageValueChangeEvent === null || storageValueChangeEvent === void 0 ? void 0 : storageValueChangeEvent.key, 'test.remove');
        }
        test('Keys (in-memory)', () => {
            let storageTargetEvent = undefined;
            storageService.onDidChangeTarget(e => storageTargetEvent = e);
            let storageValueChangeEvent = undefined;
            storageService.onDidChangeValue(e => storageValueChangeEvent = e);
            // Empty
            for (const scope of [1 /* StorageScope.WORKSPACE */, 0 /* StorageScope.GLOBAL */]) {
                for (const target of [1 /* StorageTarget.MACHINE */, 0 /* StorageTarget.USER */]) {
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 0);
                }
            }
            // Add values
            for (const scope of [1 /* StorageScope.WORKSPACE */, 0 /* StorageScope.GLOBAL */]) {
                for (const target of [1 /* StorageTarget.MACHINE */, 0 /* StorageTarget.USER */]) {
                    storageTargetEvent = Object.create(null);
                    storageValueChangeEvent = Object.create(null);
                    storageService.store('test.target1', 'value1', scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 1);
                    (0, assert_1.strictEqual)(storageTargetEvent === null || storageTargetEvent === void 0 ? void 0 : storageTargetEvent.scope, scope);
                    (0, assert_1.strictEqual)(storageValueChangeEvent === null || storageValueChangeEvent === void 0 ? void 0 : storageValueChangeEvent.key, 'test.target1');
                    (0, assert_1.strictEqual)(storageValueChangeEvent === null || storageValueChangeEvent === void 0 ? void 0 : storageValueChangeEvent.scope, scope);
                    (0, assert_1.strictEqual)(storageValueChangeEvent === null || storageValueChangeEvent === void 0 ? void 0 : storageValueChangeEvent.target, target);
                    storageTargetEvent = undefined;
                    storageValueChangeEvent = Object.create(null);
                    storageService.store('test.target1', 'otherValue1', scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 1);
                    (0, assert_1.strictEqual)(storageTargetEvent, undefined);
                    (0, assert_1.strictEqual)(storageValueChangeEvent === null || storageValueChangeEvent === void 0 ? void 0 : storageValueChangeEvent.key, 'test.target1');
                    (0, assert_1.strictEqual)(storageValueChangeEvent === null || storageValueChangeEvent === void 0 ? void 0 : storageValueChangeEvent.scope, scope);
                    (0, assert_1.strictEqual)(storageValueChangeEvent === null || storageValueChangeEvent === void 0 ? void 0 : storageValueChangeEvent.target, target);
                    storageService.store('test.target2', 'value2', scope, target);
                    storageService.store('test.target3', 'value3', scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 3);
                }
            }
            // Remove values
            for (const scope of [1 /* StorageScope.WORKSPACE */, 0 /* StorageScope.GLOBAL */]) {
                for (const target of [1 /* StorageTarget.MACHINE */, 0 /* StorageTarget.USER */]) {
                    const keysLength = storageService.keys(scope, target).length;
                    storageService.store('test.target4', 'value1', scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, keysLength + 1);
                    storageTargetEvent = Object.create(null);
                    storageValueChangeEvent = Object.create(null);
                    storageService.remove('test.target4', scope);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, keysLength);
                    (0, assert_1.strictEqual)(storageTargetEvent === null || storageTargetEvent === void 0 ? void 0 : storageTargetEvent.scope, scope);
                    (0, assert_1.strictEqual)(storageValueChangeEvent === null || storageValueChangeEvent === void 0 ? void 0 : storageValueChangeEvent.key, 'test.target4');
                    (0, assert_1.strictEqual)(storageValueChangeEvent === null || storageValueChangeEvent === void 0 ? void 0 : storageValueChangeEvent.scope, scope);
                }
            }
            // Remove all
            for (const scope of [1 /* StorageScope.WORKSPACE */, 0 /* StorageScope.GLOBAL */]) {
                for (const target of [1 /* StorageTarget.MACHINE */, 0 /* StorageTarget.USER */]) {
                    const keys = storageService.keys(scope, target);
                    for (const key of keys) {
                        storageService.remove(key, scope);
                    }
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 0);
                }
            }
            // Adding undefined or null removes value
            for (const scope of [1 /* StorageScope.WORKSPACE */, 0 /* StorageScope.GLOBAL */]) {
                for (const target of [1 /* StorageTarget.MACHINE */, 0 /* StorageTarget.USER */]) {
                    storageService.store('test.target1', 'value1', scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 1);
                    storageTargetEvent = Object.create(null);
                    storageService.store('test.target1', undefined, scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 0);
                    (0, assert_1.strictEqual)(storageTargetEvent === null || storageTargetEvent === void 0 ? void 0 : storageTargetEvent.scope, scope);
                    storageService.store('test.target1', '', scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 1);
                    storageService.store('test.target1', null, scope, target);
                    (0, assert_1.strictEqual)(storageService.keys(scope, target).length, 0);
                }
            }
            // Target change
            storageTargetEvent = undefined;
            storageService.store('test.target5', 'value1', 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.ok)(storageTargetEvent);
            storageTargetEvent = undefined;
            storageService.store('test.target5', 'value1', 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            (0, assert_1.ok)(storageTargetEvent);
            storageTargetEvent = undefined;
            storageService.store('test.target5', 'value1', 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.ok)(storageTargetEvent);
            storageTargetEvent = undefined;
            storageService.store('test.target5', 'value1', 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            (0, assert_1.ok)(!storageTargetEvent); // no change in target
        });
    }
    exports.createSuite = createSuite;
    suite('StorageService (in-memory)', function () {
        createSuite({
            setup: async () => new storage_1.InMemoryStorageService(),
            teardown: async () => { }
        });
    });
});
//# sourceMappingURL=storageService.test.js.map