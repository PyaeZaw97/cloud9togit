/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/lazy", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/log/common/log", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResult", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testResultStorage", "vs/workbench/contrib/testing/test/common/testStubs", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, async_1, buffer_1, lazy_1, mockKeybindingService_1, log_1, testId_1, testProfileService_1, testResult_1, testResultService_1, testResultStorage_1, testStubs_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.emptyOutputController = void 0;
    const emptyOutputController = () => new testResult_1.LiveOutputController(new lazy_1.Lazy(() => [(0, buffer_1.newWriteableBufferStream)(), Promise.resolve()]), () => Promise.resolve((0, buffer_1.bufferToStream)(buffer_1.VSBuffer.alloc(0))));
    exports.emptyOutputController = emptyOutputController;
    suite('Workbench - Test Results Service', () => {
        const getLabelsIn = (it) => [...it].map(t => t.item.label).sort();
        const getChangeSummary = () => [...changed]
            .map(c => ({ reason: c.reason, label: c.item.item.label }))
            .sort((a, b) => a.label.localeCompare(b.label));
        let r;
        let changed = new Set();
        let tests;
        const defaultOpts = (testIds) => ({
            targets: [{
                    profileGroup: 2 /* TestRunProfileBitset.Run */,
                    profileId: 0,
                    controllerId: 'ctrlId',
                    testIds,
                }]
        });
        class TestLiveTestResult extends testResult_1.LiveTestResult {
            setAllToState(state, taskId, when) {
                super.setAllToState(state, taskId, when);
            }
        }
        setup(async () => {
            changed = new Set();
            r = new TestLiveTestResult('foo', (0, exports.emptyOutputController)(), true, defaultOpts(['id-a']));
            r.onChange(e => changed.add(e));
            r.addTask({ id: 't', name: undefined, running: true });
            tests = testStubs_1.testStubs.nested();
            const ok = await Promise.race([
                Promise.resolve(tests.expand(tests.root.id, Infinity)).then(() => true),
                (0, async_1.timeout)(1000).then(() => false),
            ]);
            // todo@connor4312: debug for tests #137853:
            if (!ok) {
                throw new Error('timed out while expanding, diff: ' + JSON.stringify(tests.collectDiff()));
            }
            r.addTestChainToRun('ctrlId', [
                tests.root.toTestItem(),
                tests.root.children.get('id-a').toTestItem(),
                tests.root.children.get('id-a').children.get('id-aa').toTestItem(),
            ]);
            r.addTestChainToRun('ctrlId', [
                tests.root.children.get('id-a').toTestItem(),
                tests.root.children.get('id-a').children.get('id-ab').toTestItem(),
            ]);
        });
        suite('LiveTestResult', () => {
            test('is empty if no tests are yet present', async () => {
                assert.deepStrictEqual(getLabelsIn(new TestLiveTestResult('foo', (0, exports.emptyOutputController)(), false, defaultOpts(['id-a'])).tests), []);
            });
            test('initially queues with update', () => {
                assert.deepStrictEqual(getChangeSummary(), [
                    { label: 'a', reason: 0 /* TestResultItemChangeReason.ComputedStateChange */ },
                    { label: 'aa', reason: 1 /* TestResultItemChangeReason.OwnStateChange */ },
                    { label: 'ab', reason: 1 /* TestResultItemChangeReason.OwnStateChange */ },
                    { label: 'root', reason: 0 /* TestResultItemChangeReason.ComputedStateChange */ },
                ]);
            });
            test('initializes with the subtree of requested tests', () => {
                assert.deepStrictEqual(getLabelsIn(r.tests), ['a', 'aa', 'ab', 'root']);
            });
            test('initializes with valid counts', () => {
                assert.deepStrictEqual(r.counts, Object.assign(Object.assign({}, (0, testResult_1.makeEmptyCounts)()), { [1 /* TestResultState.Queued */]: 2, [0 /* TestResultState.Unset */]: 2 }));
            });
            test('setAllToState', () => {
                var _a, _b;
                changed.clear();
                r.setAllToState(1 /* TestResultState.Queued */, 't', (_, t) => t.item.label !== 'root');
                assert.deepStrictEqual(r.counts, Object.assign(Object.assign({}, (0, testResult_1.makeEmptyCounts)()), { [0 /* TestResultState.Unset */]: 1, [1 /* TestResultState.Queued */]: 3 }));
                r.setAllToState(4 /* TestResultState.Failed */, 't', (_, t) => t.item.label !== 'root');
                assert.deepStrictEqual(r.counts, Object.assign(Object.assign({}, (0, testResult_1.makeEmptyCounts)()), { [0 /* TestResultState.Unset */]: 1, [4 /* TestResultState.Failed */]: 3 }));
                assert.deepStrictEqual((_a = r.getStateById(new testId_1.TestId(['ctrlId', 'id-a']).toString())) === null || _a === void 0 ? void 0 : _a.ownComputedState, 4 /* TestResultState.Failed */);
                assert.deepStrictEqual((_b = r.getStateById(new testId_1.TestId(['ctrlId', 'id-a']).toString())) === null || _b === void 0 ? void 0 : _b.tasks[0].state, 4 /* TestResultState.Failed */);
                assert.deepStrictEqual(getChangeSummary(), [
                    { label: 'a', reason: 1 /* TestResultItemChangeReason.OwnStateChange */ },
                    { label: 'aa', reason: 1 /* TestResultItemChangeReason.OwnStateChange */ },
                    { label: 'ab', reason: 1 /* TestResultItemChangeReason.OwnStateChange */ },
                    { label: 'root', reason: 0 /* TestResultItemChangeReason.ComputedStateChange */ },
                ]);
            });
            test('updateState', () => {
                var _a, _b, _c, _d, _e;
                changed.clear();
                const testId = new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString();
                r.updateState(testId, 't', 2 /* TestResultState.Running */);
                assert.deepStrictEqual(r.counts, Object.assign(Object.assign({}, (0, testResult_1.makeEmptyCounts)()), { [0 /* TestResultState.Unset */]: 2, [2 /* TestResultState.Running */]: 1, [1 /* TestResultState.Queued */]: 1 }));
                assert.deepStrictEqual((_a = r.getStateById(testId)) === null || _a === void 0 ? void 0 : _a.ownComputedState, 2 /* TestResultState.Running */);
                // update computed state:
                assert.deepStrictEqual((_b = r.getStateById(tests.root.id)) === null || _b === void 0 ? void 0 : _b.computedState, 2 /* TestResultState.Running */);
                assert.deepStrictEqual(getChangeSummary(), [
                    { label: 'a', reason: 0 /* TestResultItemChangeReason.ComputedStateChange */ },
                    { label: 'aa', reason: 1 /* TestResultItemChangeReason.OwnStateChange */ },
                    { label: 'root', reason: 0 /* TestResultItemChangeReason.ComputedStateChange */ },
                ]);
                r.updateState(testId, 't', 3 /* TestResultState.Passed */);
                assert.deepStrictEqual((_c = r.getStateById(testId)) === null || _c === void 0 ? void 0 : _c.ownComputedState, 3 /* TestResultState.Passed */);
                r.updateState(testId, 't', 6 /* TestResultState.Errored */);
                assert.deepStrictEqual((_d = r.getStateById(testId)) === null || _d === void 0 ? void 0 : _d.ownComputedState, 6 /* TestResultState.Errored */);
                r.updateState(testId, 't', 3 /* TestResultState.Passed */);
                assert.deepStrictEqual((_e = r.getStateById(testId)) === null || _e === void 0 ? void 0 : _e.ownComputedState, 6 /* TestResultState.Errored */);
            });
            test('ignores outside run', () => {
                changed.clear();
                r.updateState(new testId_1.TestId(['ctrlId', 'id-b']).toString(), 't', 2 /* TestResultState.Running */);
                assert.deepStrictEqual(r.counts, Object.assign(Object.assign({}, (0, testResult_1.makeEmptyCounts)()), { [1 /* TestResultState.Queued */]: 2, [0 /* TestResultState.Unset */]: 2 }));
                assert.deepStrictEqual(r.getStateById(new testId_1.TestId(['ctrlId', 'id-b']).toString()), undefined);
            });
            test('markComplete', () => {
                var _a, _b;
                r.setAllToState(1 /* TestResultState.Queued */, 't', () => true);
                r.updateState(new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString(), 't', 3 /* TestResultState.Passed */);
                changed.clear();
                r.markComplete();
                assert.deepStrictEqual(r.counts, Object.assign(Object.assign({}, (0, testResult_1.makeEmptyCounts)()), { [3 /* TestResultState.Passed */]: 1, [0 /* TestResultState.Unset */]: 3 }));
                assert.deepStrictEqual((_a = r.getStateById(tests.root.id)) === null || _a === void 0 ? void 0 : _a.ownComputedState, 0 /* TestResultState.Unset */);
                assert.deepStrictEqual((_b = r.getStateById(new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString())) === null || _b === void 0 ? void 0 : _b.ownComputedState, 3 /* TestResultState.Passed */);
            });
        });
        suite('service', () => {
            let storage;
            let results;
            class TestTestResultService extends testResultService_1.TestResultService {
                constructor() {
                    super(...arguments);
                    this.persistScheduler = { schedule: () => this.persistImmediately() };
                }
            }
            setup(() => {
                storage = new testResultStorage_1.InMemoryResultStorage(new workbenchTestServices_1.TestStorageService(), new log_1.NullLogService());
                results = new TestTestResultService(new mockKeybindingService_1.MockContextKeyService(), storage, new testProfileService_1.TestProfileService(new mockKeybindingService_1.MockContextKeyService(), new workbenchTestServices_1.TestStorageService()));
            });
            test('pushes new result', () => {
                results.push(r);
                assert.deepStrictEqual(results.results, [r]);
            });
            test('serializes and re-hydrates', async () => {
                results.push(r);
                r.updateState(new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString(), 't', 3 /* TestResultState.Passed */, 42);
                r.markComplete();
                await (0, async_1.timeout)(10); // allow persistImmediately async to happen
                results = new testResultService_1.TestResultService(new mockKeybindingService_1.MockContextKeyService(), storage, new testProfileService_1.TestProfileService(new mockKeybindingService_1.MockContextKeyService(), new workbenchTestServices_1.TestStorageService()));
                assert.strictEqual(0, results.results.length);
                await (0, async_1.timeout)(10); // allow load promise to resolve
                assert.strictEqual(1, results.results.length);
                const [rehydrated, actual] = results.getStateById(tests.root.id);
                const expected = Object.assign({}, r.getStateById(tests.root.id));
                expected.item.uri = actual.item.uri;
                expected.item.children = actual.item.children;
                assert.deepStrictEqual(actual, Object.assign(Object.assign({}, expected), { children: [new testId_1.TestId(['ctrlId', 'id-a']).toString()] }));
                assert.deepStrictEqual(rehydrated.counts, r.counts);
                assert.strictEqual(typeof rehydrated.completedAt, 'number');
            });
            test('clears results but keeps ongoing tests', async () => {
                results.push(r);
                r.markComplete();
                const r2 = results.push(new testResult_1.LiveTestResult('', (0, exports.emptyOutputController)(), false, defaultOpts([])));
                results.clear();
                assert.deepStrictEqual(results.results, [r2]);
            });
            test('keeps ongoing tests on top', async () => {
                results.push(r);
                const r2 = results.push(new testResult_1.LiveTestResult('', (0, exports.emptyOutputController)(), false, defaultOpts([])));
                assert.deepStrictEqual(results.results, [r2, r]);
                r2.markComplete();
                assert.deepStrictEqual(results.results, [r, r2]);
                r.markComplete();
                assert.deepStrictEqual(results.results, [r, r2]);
            });
            const makeHydrated = async (completedAt = 42, state = 3 /* TestResultState.Passed */) => new testResult_1.HydratedTestResult({
                completedAt,
                id: 'some-id',
                tasks: [{ id: 't', messages: [], name: undefined }],
                name: 'hello world',
                request: defaultOpts([]),
                items: [Object.assign(Object.assign({}, (await (0, testStubs_1.getInitializedMainTestCollection)()).getNodeById(new testId_1.TestId(['ctrlId', 'id-a']).toString())), { tasks: [{ state, duration: 0, messages: [] }], computedState: state, ownComputedState: state, children: [] })]
            }, () => Promise.resolve((0, buffer_1.bufferToStream)(buffer_1.VSBuffer.alloc(0))));
            test('pushes hydrated results', async () => {
                results.push(r);
                const hydrated = await makeHydrated();
                results.push(hydrated);
                assert.deepStrictEqual(results.results, [r, hydrated]);
            });
            test('inserts in correct order', async () => {
                results.push(r);
                const hydrated1 = await makeHydrated();
                results.push(hydrated1);
                assert.deepStrictEqual(results.results, [r, hydrated1]);
            });
            test('inserts in correct order 2', async () => {
                results.push(r);
                const hydrated1 = await makeHydrated();
                results.push(hydrated1);
                const hydrated2 = await makeHydrated(30);
                results.push(hydrated2);
                assert.deepStrictEqual(results.results, [r, hydrated1, hydrated2]);
            });
        });
        test('resultItemParents', function () {
            assert.deepStrictEqual([...(0, testResult_1.resultItemParents)(r, r.getStateById(new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString()))], [
                r.getStateById(new testId_1.TestId(['ctrlId', 'id-a', 'id-aa']).toString()),
                r.getStateById(new testId_1.TestId(['ctrlId', 'id-a']).toString()),
                r.getStateById(new testId_1.TestId(['ctrlId']).toString()),
            ]);
            assert.deepStrictEqual([...(0, testResult_1.resultItemParents)(r, r.getStateById(tests.root.id))], [
                r.getStateById(tests.root.id),
            ]);
        });
    });
});
//# sourceMappingURL=testResultService.test.js.map