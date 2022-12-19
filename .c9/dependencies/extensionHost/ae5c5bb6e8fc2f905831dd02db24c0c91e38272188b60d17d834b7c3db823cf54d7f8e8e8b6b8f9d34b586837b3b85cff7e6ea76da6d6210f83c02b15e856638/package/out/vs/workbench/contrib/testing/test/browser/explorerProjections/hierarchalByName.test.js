/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/tree/abstractTree", "vs/base/common/event", "vs/workbench/contrib/testing/browser/explorerProjections/hierarchalByName", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/test/browser/testObjectTree", "vs/workbench/contrib/testing/test/common/testStubs"], function (require, exports, assert, abstractTree_1, event_1, hierarchalByName_1, testId_1, testObjectTree_1, testStubs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - Testing Explorer Hierarchal by Name Projection', () => {
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
            harness = new testObjectTree_1.TestTreeTestHarness(l => new hierarchalByName_1.HierarchicalByNameProjection(abstractTree_1.AbstractTreeViewState.empty(), l, resultsService));
        });
        teardown(() => {
            harness.dispose();
        });
        test('renders initial tree', () => {
            harness.flush();
            assert.deepStrictEqual(harness.tree.getRendered(), [
                { e: 'aa' }, { e: 'ab' }, { e: 'b' }
            ]);
        });
        test('updates render if second test provider appears', async () => {
            harness.flush();
            harness.pushDiff({
                op: 0 /* TestDiffOpType.Add */,
                item: { controllerId: 'ctrl2', parent: null, expand: 3 /* TestItemExpandState.Expanded */, item: new testStubs_1.TestTestItem('ctrl2', 'c', 'root2').toTestItem() },
            }, {
                op: 0 /* TestDiffOpType.Add */,
                item: { controllerId: 'ctrl2', parent: new testId_1.TestId(['ctrl2', 'c']).toString(), expand: 0 /* TestItemExpandState.NotExpandable */, item: new testStubs_1.TestTestItem('ctrl2', 'c-a', 'c', undefined).toTestItem() },
            });
            assert.deepStrictEqual(harness.flush(), [
                { e: 'root', children: [{ e: 'aa' }, { e: 'ab' }, { e: 'b' }] },
                { e: 'root2', children: [{ e: 'c' }] },
            ]);
        });
        test('updates nodes if they add children', async () => {
            harness.flush();
            harness.c.root.children.get('id-a').children.add(new testStubs_1.TestTestItem('ctrl2', 'ac', 'ac'));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'aa' },
                { e: 'ab' },
                { e: 'ac' },
                { e: 'b' }
            ]);
        });
        test('updates nodes if they remove children', async () => {
            harness.flush();
            harness.c.root.children.get('id-a').children.delete('id-ab');
            assert.deepStrictEqual(harness.flush(), [
                { e: 'aa' },
                { e: 'b' }
            ]);
        });
        test('swaps when node is no longer leaf', async () => {
            harness.flush();
            harness.c.root.children.get('id-b').children.add(new testStubs_1.TestTestItem('ctrl2', 'ba', 'ba'));
            assert.deepStrictEqual(harness.flush(), [
                { e: 'aa' },
                { e: 'ab' },
                { e: 'ba' },
            ]);
        });
    });
});
//# sourceMappingURL=hierarchalByName.test.js.map