/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/workbench/services/lifecycle/electron-sandbox/lifecycleService", "vs/workbench/test/electron-browser/workbenchTestServices"], function (require, exports, assert, lifecycle_1, lifecycleService_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Lifecycleservice', function () {
        let lifecycleService;
        let disposables;
        class TestLifecycleService extends lifecycleService_1.NativeLifecycleService {
            handleBeforeShutdown(reason) {
                return super.handleBeforeShutdown(reason);
            }
            handleWillShutdown(reason) {
                return super.handleWillShutdown(reason);
            }
        }
        setup(async () => {
            disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(disposables);
            lifecycleService = instantiationService.createInstance(TestLifecycleService);
        });
        teardown(async () => {
            disposables.dispose();
        });
        test('onBeforeShutdown - final veto called after other vetos', async function () {
            let vetoCalled = false;
            let finalVetoCalled = false;
            const order = [];
            lifecycleService.onBeforeShutdown(e => {
                e.veto(new Promise(resolve => {
                    vetoCalled = true;
                    order.push(1);
                    resolve(false);
                }), 'test');
            });
            lifecycleService.onBeforeShutdown(e => {
                e.finalVeto(() => {
                    return new Promise(resolve => {
                        finalVetoCalled = true;
                        order.push(2);
                        resolve(true);
                    });
                }, 'test');
            });
            const veto = await lifecycleService.handleBeforeShutdown(2 /* ShutdownReason.QUIT */);
            assert.strictEqual(veto, true);
            assert.strictEqual(vetoCalled, true);
            assert.strictEqual(finalVetoCalled, true);
            assert.strictEqual(order[0], 1);
            assert.strictEqual(order[1], 2);
        });
        test('onBeforeShutdown - final veto not called when veto happened before', async function () {
            let vetoCalled = false;
            let finalVetoCalled = false;
            lifecycleService.onBeforeShutdown(e => {
                e.veto(new Promise(resolve => {
                    vetoCalled = true;
                    resolve(true);
                }), 'test');
            });
            lifecycleService.onBeforeShutdown(e => {
                e.finalVeto(() => {
                    return new Promise(resolve => {
                        finalVetoCalled = true;
                        resolve(true);
                    });
                }, 'test');
            });
            const veto = await lifecycleService.handleBeforeShutdown(2 /* ShutdownReason.QUIT */);
            assert.strictEqual(veto, true);
            assert.strictEqual(vetoCalled, true);
            assert.strictEqual(finalVetoCalled, false);
        });
        test('onBeforeShutdown - veto with error is treated as veto', async function () {
            lifecycleService.onBeforeShutdown(e => {
                e.veto(new Promise((resolve, reject) => {
                    reject(new Error('Fail'));
                }), 'test');
            });
            const veto = await lifecycleService.handleBeforeShutdown(2 /* ShutdownReason.QUIT */);
            assert.strictEqual(veto, true);
        });
        test('onBeforeShutdown - final veto with error is treated as veto', async function () {
            lifecycleService.onBeforeShutdown(e => {
                e.finalVeto(() => new Promise((resolve, reject) => {
                    reject(new Error('Fail'));
                }), 'test');
            });
            const veto = await lifecycleService.handleBeforeShutdown(2 /* ShutdownReason.QUIT */);
            assert.strictEqual(veto, true);
        });
        test('onWillShutdown - join', async function () {
            let joinCalled = false;
            lifecycleService.onWillShutdown(e => {
                e.join(new Promise(resolve => {
                    joinCalled = true;
                    resolve();
                }), { id: 'test', label: 'test' });
            });
            await lifecycleService.handleWillShutdown(2 /* ShutdownReason.QUIT */);
            assert.strictEqual(joinCalled, true);
        });
        test('onWillShutdown - join with error is handled', async function () {
            let joinCalled = false;
            lifecycleService.onWillShutdown(e => {
                e.join(new Promise((resolve, reject) => {
                    joinCalled = true;
                    reject(new Error('Fail'));
                }), { id: 'test', label: 'test' });
            });
            await lifecycleService.handleWillShutdown(2 /* ShutdownReason.QUIT */);
            assert.strictEqual(joinCalled, true);
        });
    });
});
//# sourceMappingURL=lifecycleService.test.js.map