/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/base/test/common/mock", "vs/workbench/api/common/extHostEditorTabs", "vs/workbench/api/test/common/testRPCProtocol", "vs/workbench/api/common/extHostTypes"], function (require, exports, assert, uri_1, mock_1, extHostEditorTabs_1, testRPCProtocol_1, extHostTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ExtHostEditorTabs', function () {
        const defaultTabDto = {
            id: 'uniquestring',
            input: { kind: 1 /* TabInputKind.TextInput */, uri: uri_1.URI.parse('file://abc/def.txt') },
            isActive: true,
            isDirty: true,
            isPinned: true,
            isPreview: false,
            label: 'label1',
        };
        function createTabDto(dto) {
            return Object.assign(Object.assign({}, defaultTabDto), dto);
        }
        test('Ensure empty model throws when accessing active group', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 0);
            // Active group should never be undefined (there is always an active group). Ensure accessing it undefined throws.
            // TODO @lramos15 Add a throw on the main side when a model is sent without an active group
            assert.throws(() => extHostEditorTabs.tabGroups.activeTabGroup);
        });
        test('single tab', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tab = createTabDto({
                id: 'uniquestring',
                isActive: true,
                isDirty: true,
                isPinned: true,
                label: 'label1',
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            const [first] = extHostEditorTabs.tabGroups.all;
            assert.ok(first.activeTab);
            assert.strictEqual(first.tabs.indexOf(first.activeTab), 0);
            {
                extHostEditorTabs.$acceptEditorTabModel([{
                        isActive: true,
                        viewColumn: 0,
                        groupId: 12,
                        tabs: [tab]
                    }]);
                assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
                const [first] = extHostEditorTabs.tabGroups.all;
                assert.ok(first.activeTab);
                assert.strictEqual(first.tabs.indexOf(first.activeTab), 0);
            }
        });
        test('Empty tab group', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: []
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            const [first] = extHostEditorTabs.tabGroups.all;
            assert.strictEqual(first.activeTab, undefined);
            assert.strictEqual(first.tabs.length, 0);
        });
        test('Ensure tabGroup change events fires', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            let count = 0;
            extHostEditorTabs.tabGroups.onDidChangeTabGroups(() => count++);
            assert.strictEqual(count, 0);
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: []
                }]);
            assert.ok(extHostEditorTabs.tabGroups.activeTabGroup);
            const activeTabGroup = extHostEditorTabs.tabGroups.activeTabGroup;
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(activeTabGroup.tabs.length, 0);
            assert.strictEqual(count, 1);
        });
        test('Check TabGroupChangeEvent properties', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const group1Data = {
                isActive: true,
                viewColumn: 0,
                groupId: 12,
                tabs: []
            };
            const group2Data = Object.assign(Object.assign({}, group1Data), { groupId: 13 });
            const events = [];
            extHostEditorTabs.tabGroups.onDidChangeTabGroups(e => events.push(e));
            // OPEN
            extHostEditorTabs.$acceptEditorTabModel([group1Data]);
            assert.deepStrictEqual(events, [{
                    changed: [],
                    closed: [],
                    opened: [extHostEditorTabs.tabGroups.activeTabGroup]
                }]);
            // OPEN, CHANGE
            events.length = 0;
            extHostEditorTabs.$acceptEditorTabModel([Object.assign(Object.assign({}, group1Data), { isActive: false }), group2Data]);
            assert.deepStrictEqual(events, [{
                    changed: [extHostEditorTabs.tabGroups.all[0]],
                    closed: [],
                    opened: [extHostEditorTabs.tabGroups.all[1]]
                }]);
            // CHANGE
            events.length = 0;
            extHostEditorTabs.$acceptEditorTabModel([group1Data, Object.assign(Object.assign({}, group2Data), { isActive: false })]);
            assert.deepStrictEqual(events, [{
                    changed: extHostEditorTabs.tabGroups.all,
                    closed: [],
                    opened: []
                }]);
            // CLOSE, CHANGE
            events.length = 0;
            const oldActiveGroup = extHostEditorTabs.tabGroups.activeTabGroup;
            extHostEditorTabs.$acceptEditorTabModel([group2Data]);
            assert.deepStrictEqual(events, [{
                    changed: extHostEditorTabs.tabGroups.all,
                    closed: [oldActiveGroup],
                    opened: []
                }]);
        });
        test('Ensure reference equality for activeTab and activeGroup', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tab = createTabDto({
                id: 'uniquestring',
                isActive: true,
                isDirty: true,
                isPinned: true,
                label: 'label1',
                editorId: 'default',
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            const [first] = extHostEditorTabs.tabGroups.all;
            assert.ok(first.activeTab);
            assert.strictEqual(first.tabs.indexOf(first.activeTab), 0);
            assert.strictEqual(first.activeTab, first.tabs[0]);
            assert.strictEqual(extHostEditorTabs.tabGroups.activeTabGroup, first);
        });
        test('Ensure reference stability', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tabDto = createTabDto();
            // single dirty tab
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tabDto]
                }]);
            let all = extHostEditorTabs.tabGroups.all.map(group => group.tabs).flat();
            assert.strictEqual(all.length, 1);
            const apiTab1 = all[0];
            assert.ok(apiTab1.input instanceof extHostTypes_1.TextTabInput);
            assert.strictEqual(tabDto.input.kind, 1 /* TabInputKind.TextInput */);
            const dtoResource = tabDto.input.uri;
            assert.strictEqual(apiTab1.input.uri.toString(), uri_1.URI.revive(dtoResource).toString());
            assert.strictEqual(apiTab1.isDirty, true);
            // NOT DIRTY anymore
            const tabDto2 = Object.assign(Object.assign({}, tabDto), { isDirty: false });
            // Accept a simple update
            extHostEditorTabs.$acceptTabOperation({
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */,
                index: 0,
                tabDto: tabDto2,
                groupId: 12
            });
            all = extHostEditorTabs.tabGroups.all.map(group => group.tabs).flat();
            assert.strictEqual(all.length, 1);
            const apiTab2 = all[0];
            assert.ok(apiTab1.input instanceof extHostTypes_1.TextTabInput);
            assert.strictEqual(apiTab1.input.uri.toString(), uri_1.URI.revive(dtoResource).toString());
            assert.strictEqual(apiTab2.isDirty, false);
            assert.strictEqual(apiTab1 === apiTab2, true);
        });
        test('Tab.isActive working', function () {
            var _a, _b, _c, _d, _e, _f;
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tabDtoAAA = createTabDto({
                id: 'AAA',
                isActive: true,
                isDirty: true,
                isPinned: true,
                label: 'label1',
                input: { kind: 1 /* TabInputKind.TextInput */, uri: uri_1.URI.parse('file://abc/AAA.txt') },
                editorId: 'default'
            });
            const tabDtoBBB = createTabDto({
                id: 'BBB',
                isActive: false,
                isDirty: true,
                isPinned: true,
                label: 'label1',
                input: { kind: 1 /* TabInputKind.TextInput */, uri: uri_1.URI.parse('file://abc/BBB.txt') },
                editorId: 'default'
            });
            // single dirty tab
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tabDtoAAA, tabDtoBBB]
                }]);
            let all = extHostEditorTabs.tabGroups.all.map(group => group.tabs).flat();
            assert.strictEqual(all.length, 2);
            const activeTab1 = (_a = extHostEditorTabs.tabGroups.activeTabGroup) === null || _a === void 0 ? void 0 : _a.activeTab;
            assert.ok((activeTab1 === null || activeTab1 === void 0 ? void 0 : activeTab1.input) instanceof extHostTypes_1.TextTabInput);
            assert.strictEqual(tabDtoAAA.input.kind, 1 /* TabInputKind.TextInput */);
            const dtoAAAResource = tabDtoAAA.input.uri;
            assert.strictEqual((_b = activeTab1 === null || activeTab1 === void 0 ? void 0 : activeTab1.input) === null || _b === void 0 ? void 0 : _b.uri.toString(), (_c = uri_1.URI.revive(dtoAAAResource)) === null || _c === void 0 ? void 0 : _c.toString());
            assert.strictEqual(activeTab1 === null || activeTab1 === void 0 ? void 0 : activeTab1.isActive, true);
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 1,
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */,
                tabDto: Object.assign(Object.assign({}, tabDtoBBB), { isActive: true }) /// BBB is now active
            });
            const activeTab2 = (_d = extHostEditorTabs.tabGroups.activeTabGroup) === null || _d === void 0 ? void 0 : _d.activeTab;
            assert.ok((activeTab2 === null || activeTab2 === void 0 ? void 0 : activeTab2.input) instanceof extHostTypes_1.TextTabInput);
            assert.strictEqual(tabDtoBBB.input.kind, 1 /* TabInputKind.TextInput */);
            const dtoBBBResource = tabDtoBBB.input.uri;
            assert.strictEqual((_e = activeTab2 === null || activeTab2 === void 0 ? void 0 : activeTab2.input) === null || _e === void 0 ? void 0 : _e.uri.toString(), (_f = uri_1.URI.revive(dtoBBBResource)) === null || _f === void 0 ? void 0 : _f.toString());
            assert.strictEqual(activeTab2 === null || activeTab2 === void 0 ? void 0 : activeTab2.isActive, true);
            assert.strictEqual(activeTab1 === null || activeTab1 === void 0 ? void 0 : activeTab1.isActive, false);
        });
        test('vscode.window.tagGroups is immutable', function () {
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            assert.throws(() => {
                // @ts-expect-error write to readonly prop
                extHostEditorTabs.tabGroups.activeTabGroup = undefined;
            });
            assert.throws(() => {
                // @ts-expect-error write to readonly prop
                extHostEditorTabs.tabGroups.all.length = 0;
            });
            assert.throws(() => {
                // @ts-expect-error write to readonly prop
                extHostEditorTabs.tabGroups.onDidChangeActiveTabGroup = undefined;
            });
            assert.throws(() => {
                // @ts-expect-error write to readonly prop
                extHostEditorTabs.tabGroups.onDidChangeTabGroups = undefined;
            });
        });
        test('Ensure close is called with all tab ids', function () {
            var _a;
            let closedTabIds = [];
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
                // override/implement $moveTab or $closeTab
                async $closeTab(tabIds, preserveFocus) {
                    closedTabIds.push(tabIds);
                    return true;
                }
            }));
            const tab = createTabDto({
                id: 'uniquestring',
                isActive: true,
                isDirty: true,
                isPinned: true,
                label: 'label1',
                editorId: 'default'
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            const activeTab = (_a = extHostEditorTabs.tabGroups.activeTabGroup) === null || _a === void 0 ? void 0 : _a.activeTab;
            assert.ok(activeTab);
            extHostEditorTabs.tabGroups.close(activeTab, false);
            assert.strictEqual(closedTabIds.length, 1);
            assert.deepStrictEqual(closedTabIds[0], ['uniquestring']);
            // Close with array
            extHostEditorTabs.tabGroups.close([activeTab], false);
            assert.strictEqual(closedTabIds.length, 2);
            assert.deepStrictEqual(closedTabIds[1], ['uniquestring']);
        });
        test('Update tab only sends tab change event', async function () {
            let closedTabIds = [];
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
                // override/implement $moveTab or $closeTab
                async $closeTab(tabIds, preserveFocus) {
                    closedTabIds.push(tabIds);
                    return true;
                }
            }));
            const tabDto = createTabDto({
                id: 'uniquestring',
                isActive: true,
                isDirty: true,
                isPinned: true,
                label: 'label1',
                editorId: 'default'
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tabDto]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 1);
            const tab = extHostEditorTabs.tabGroups.all[0].tabs[0];
            const p = new Promise(resolve => extHostEditorTabs.tabGroups.onDidChangeTabs(resolve));
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 0,
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */,
                tabDto: Object.assign(Object.assign({}, tabDto), { label: 'NEW LABEL' })
            });
            const changedTab = (await p).changed[0];
            assert.ok(tab === changedTab);
            assert.strictEqual(changedTab.label, 'NEW LABEL');
        });
        test('Active tab', function () {
            var _a, _b, _c, _d, _e, _f, _g;
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tab1 = createTabDto({
                id: 'uniquestring',
                isActive: true,
                isDirty: true,
                isPinned: true,
                label: 'label1',
            });
            const tab2 = createTabDto({
                isActive: false,
                id: 'uniquestring2',
            });
            const tab3 = createTabDto({
                isActive: false,
                id: 'uniquestring3',
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab1, tab2, tab3]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 3);
            // Active tab is correct
            assert.strictEqual((_a = extHostEditorTabs.tabGroups.activeTabGroup) === null || _a === void 0 ? void 0 : _a.activeTab, (_b = extHostEditorTabs.tabGroups.activeTabGroup) === null || _b === void 0 ? void 0 : _b.tabs[0]);
            // Switching active tab works
            tab1.isActive = false;
            tab2.isActive = true;
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 0,
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */,
                tabDto: tab1
            });
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 1,
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */,
                tabDto: tab2
            });
            assert.strictEqual((_c = extHostEditorTabs.tabGroups.activeTabGroup) === null || _c === void 0 ? void 0 : _c.activeTab, (_d = extHostEditorTabs.tabGroups.activeTabGroup) === null || _d === void 0 ? void 0 : _d.tabs[1]);
            //Closing tabs out works
            tab3.isActive = true;
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab3]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 1);
            assert.strictEqual((_e = extHostEditorTabs.tabGroups.activeTabGroup) === null || _e === void 0 ? void 0 : _e.activeTab, (_f = extHostEditorTabs.tabGroups.activeTabGroup) === null || _f === void 0 ? void 0 : _f.tabs[0]);
            // Closing out all tabs returns undefine active tab
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: []
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 0);
            assert.strictEqual((_g = extHostEditorTabs.tabGroups.activeTabGroup) === null || _g === void 0 ? void 0 : _g.activeTab, undefined);
        });
        test('Tab operations patches open and close correctly', function () {
            var _a, _b, _c, _d;
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tab1 = createTabDto({
                id: 'uniquestring',
                isActive: true,
                label: 'label1',
            });
            const tab2 = createTabDto({
                isActive: false,
                id: 'uniquestring2',
                label: 'label2',
            });
            const tab3 = createTabDto({
                isActive: false,
                id: 'uniquestring3',
                label: 'label3',
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab1, tab2, tab3]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 3);
            // Close tab 2
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 1,
                kind: 1 /* TabModelOperationKind.TAB_CLOSE */,
                tabDto: tab2
            });
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 2);
            // Close active tab and update tab 3 to be active
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 0,
                kind: 1 /* TabModelOperationKind.TAB_CLOSE */,
                tabDto: tab1
            });
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 1);
            tab3.isActive = true;
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 0,
                kind: 2 /* TabModelOperationKind.TAB_UPDATE */,
                tabDto: tab3
            });
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 1);
            assert.strictEqual((_b = (_a = extHostEditorTabs.tabGroups.all[0]) === null || _a === void 0 ? void 0 : _a.activeTab) === null || _b === void 0 ? void 0 : _b.label, 'label3');
            // Open tab 2 back
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 1,
                kind: 0 /* TabModelOperationKind.TAB_OPEN */,
                tabDto: tab2
            });
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 2);
            assert.strictEqual((_d = (_c = extHostEditorTabs.tabGroups.all[0]) === null || _c === void 0 ? void 0 : _c.tabs[1]) === null || _d === void 0 ? void 0 : _d.label, 'label2');
        });
        test('Tab operations patches move correctly', function () {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const extHostEditorTabs = new extHostEditorTabs_1.ExtHostEditorTabs((0, testRPCProtocol_1.SingleProxyRPCProtocol)(new class extends (0, mock_1.mock)() {
            }));
            const tab1 = createTabDto({
                id: 'uniquestring',
                isActive: true,
                label: 'label1',
            });
            const tab2 = createTabDto({
                isActive: false,
                id: 'uniquestring2',
                label: 'label2',
            });
            const tab3 = createTabDto({
                isActive: false,
                id: 'uniquestring3',
                label: 'label3',
            });
            extHostEditorTabs.$acceptEditorTabModel([{
                    isActive: true,
                    viewColumn: 0,
                    groupId: 12,
                    tabs: [tab1, tab2, tab3]
                }]);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 3);
            // Move tab 2 to index 0
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 0,
                oldIndex: 1,
                kind: 3 /* TabModelOperationKind.TAB_MOVE */,
                tabDto: tab2
            });
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 3);
            assert.strictEqual((_b = (_a = extHostEditorTabs.tabGroups.all[0]) === null || _a === void 0 ? void 0 : _a.tabs[0]) === null || _b === void 0 ? void 0 : _b.label, 'label2');
            // Move tab 3 to index 1
            extHostEditorTabs.$acceptTabOperation({
                groupId: 12,
                index: 1,
                oldIndex: 2,
                kind: 3 /* TabModelOperationKind.TAB_MOVE */,
                tabDto: tab3
            });
            assert.strictEqual(extHostEditorTabs.tabGroups.all.length, 1);
            assert.strictEqual(extHostEditorTabs.tabGroups.all.map(g => g.tabs).flat().length, 3);
            assert.strictEqual((_d = (_c = extHostEditorTabs.tabGroups.all[0]) === null || _c === void 0 ? void 0 : _c.tabs[1]) === null || _d === void 0 ? void 0 : _d.label, 'label3');
            assert.strictEqual((_f = (_e = extHostEditorTabs.tabGroups.all[0]) === null || _e === void 0 ? void 0 : _e.tabs[0]) === null || _f === void 0 ? void 0 : _f.label, 'label2');
            assert.strictEqual((_h = (_g = extHostEditorTabs.tabGroups.all[0]) === null || _g === void 0 ? void 0 : _g.tabs[2]) === null || _h === void 0 ? void 0 : _h.label, 'label1');
        });
    });
});
//# sourceMappingURL=extHostEditorTabs.test.js.map