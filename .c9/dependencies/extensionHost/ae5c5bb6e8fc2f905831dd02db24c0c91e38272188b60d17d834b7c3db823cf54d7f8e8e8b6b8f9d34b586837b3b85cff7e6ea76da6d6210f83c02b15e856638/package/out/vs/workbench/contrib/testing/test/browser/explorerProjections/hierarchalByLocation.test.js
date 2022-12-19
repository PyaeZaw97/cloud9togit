/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/tree/abstractTree", "vs/base/common/event", "vs/workbench/contrib/testing/browser/explorerProjections/hierarchalByLocation", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/test/browser/testObjectTree", "vs/workbench/contrib/testing/test/common/testStubs"], function (require, exports, assert, abstractTree_1, event_1, hierarchalByLocation_1, testId_1, testObjectTree_1, testStubs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestHierarchicalByLocationProjection extends hierarchalByLocation_1.HierarchicalByLocationProjection {
    }
    suite('Workbench - Testing Explorer Hierarchal by Location Projection', () => {
        let harness;
        let onTestChanged;
        let resultsService;
        setup(() => {
            onTestChanged = new event_1.Emitter();
            resultsService = {
                onResultsChanged: () => undefined,
                onTestChanged: onTestChanged.event,
                getStateById: () => ({ state: { state: 0 }, computedState: 0 }),
            };
            harness = new testObjectTree_1.TestTreeTestHarness(l => new TestHierarchicalByLocationProjection(abstractTree_1.AbstractTreeViewState.empty(), l, resultsService));
        });
        teardown(() => {
            harness.dispose();
        });
        test('renders initial tree', async () => {
            harness.flush();
            assert.deepStrictEqual(harness.tree.getRendered(), [
                { e: 'a' }, { e: 'b' }
            ]);
        });
        test('expands children', async () => {
            harness.flush();
            harness.tree.expand(harness.projection.getElementByTestId(new testId_1.TestId(['ctrlId', 'id-a']).toString()));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'aa' }, { e: 'ab' }] }, { e: 'b' }
            ]);
        });
        test('updates render if second test provider appears', async () => {
            harness.flush();
            harness.pushDiff({
                op: 0 /* TestDiffOpType.Add */,
                item: { controllerId: 'ctrl2', parent: null, expand: 3 /* TestItemExpandState.Expanded */, item: new testStubs_1.TestTestItem('ctrl2', 'c', 'c').toTestItem() },
            }, {
                op: 0 /* TestDiffOpType.Add */,
                item: { controllerId: 'ctrl2', parent: new testId_1.TestId(['ctrl2', 'c']).toString(), expand: 0 /* TestItemExpandState.NotExpandable */, item: new testStubs_1.TestTestItem('ctrl2', 'c-a', 'ca').toTestItem() },
            });
            assert.deepStrictEqual(harness.flush(), [
                { e: 'c', children: [{ e: 'ca' }] },
                { e: 'root', children: [{ e: 'a' }, { e: 'b' }] }
            ]);
        });
        test('updates nodes if they add children', async () => {
            harness.flush();
            harness.tree.expand(harness.projection.getElementByTestId(new testId_1.TestId(['ctrlId', 'id-a']).toString()));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'aa' }, { e: 'ab' }] },
                { e: 'b' }
            ]);
            harness.c.root.children.get('id-a').children.add(new testStubs_1.TestTestItem('ctrlId', 'ac', 'ac'));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'aa' }, { e: 'ab' }, { e: 'ac' }] },
                { e: 'b' }
            ]);
        });
        test('updates nodes if they remove children', async () => {
            harness.flush();
            harness.tree.expand(harness.projection.getElementByTestId(new testId_1.TestId(['ctrlId', 'id-a']).toString()));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'aa' }, { e: 'ab' }] },
                { e: 'b' }
            ]);
            harness.c.root.children.get('id-a').children.delete('id-ab');
            assert.deepStrictEqual(harness.flush(), [
                { e: 'a', children: [{ e: 'aa' }] },
                { e: 'b' }
            ]);
        });
        test('applies state changes', async () => {
            harness.flush();
            resultsService.getStateById = () => [undefined, resultInState(4 /* TestResultState.Failed */)];
            const resultInState = (state) => ({
                item: {
                    extId: new testId_1.TestId(['ctrlId', 'id-a']).toString(),
                    busy: false,
                    description: null,
                    error: null,
                    label: 'a',
                    range: null,
                    sortText: null,
                    tags: [],
                    uri: undefined,
                },
                parent: 'id-root',
                tasks: [],
                ownComputedState: state,
                computedState: state,
                expand: 0,
                controllerId: 'ctrl',
            });
            // Applies the change:
            onTestChanged.fire({
                reason: 1 /* TestResultItemChangeReason.OwnStateChange */,
                result: null,
                previousState: 0 /* TestResultState.Unset */,
                item: resultInState(1 /* TestResultState.Queued */),
                previousOwnDuration: undefined,
            });
            harness.projection.applyTo(harness.tree);
            assert.deepStrictEqual(harness.tree.getRendered('state'), [
                { e: 'a', data: String(1 /* TestResultState.Queued */) },
                { e: 'b', data: String(0 /* TestResultState.Unset */) }
            ]);
            // Falls back if moved into unset state:
            onTestChanged.fire({
                reason: 1 /* TestResultItemChangeReason.OwnStateChange */,
                result: null,
                previousState: 1 /* TestResultState.Queued */,
                item: resultInState(0 /* TestResultState.Unset */),
                previousOwnDuration: undefined,
            });
            harness.projection.applyTo(harness.tree);
            assert.deepStrictEqual(harness.tree.getRendered('state'), [
                { e: 'a', data: String(4 /* TestResultState.Failed */) },
                { e: 'b', data: String(0 /* TestResultState.Unset */) }
            ]);
        });
    });
});
//# sourceMappingURL=hierarchalByLocation.test.js.map