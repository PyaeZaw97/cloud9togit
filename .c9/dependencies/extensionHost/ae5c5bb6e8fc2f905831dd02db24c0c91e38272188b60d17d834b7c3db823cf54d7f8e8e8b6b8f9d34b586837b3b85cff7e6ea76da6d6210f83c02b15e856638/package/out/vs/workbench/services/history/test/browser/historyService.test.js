/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/utils", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/instantiation/common/descriptors", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/history/browser/historyService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/browser/editorService", "vs/base/common/lifecycle", "vs/workbench/services/history/common/history", "vs/base/common/async", "vs/base/common/event", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/platform/files/common/files", "vs/base/common/platform", "vs/editor/common/core/selection", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration"], function (require, exports, assert, utils_1, uri_1, workbenchTestServices_1, descriptors_1, editorGroupsService_1, historyService_1, editorService_1, editorService_2, lifecycle_1, history_1, async_1, event_1, editor_1, editorInput_1, files_1, platform_1, selection_1, testConfigurationService_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('HistoryService', function () {
        const TEST_EDITOR_ID = 'MyTestEditorForEditorHistory';
        const TEST_EDITOR_INPUT_ID = 'testEditorInputForHistoyService';
        async function createServices(scope = 0 /* GoScope.DEFAULT */) {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = instantiationService.createInstance(editorService_2.EditorService);
            instantiationService.stub(editorService_1.IEditorService, editorService);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            if (scope === 1 /* GoScope.EDITOR_GROUP */) {
                configurationService.setUserConfiguration('workbench.editor.navigationScope', 'editorGroup');
            }
            else if (scope === 2 /* GoScope.EDITOR */) {
                configurationService.setUserConfiguration('workbench.editor.navigationScope', 'editor');
            }
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            const historyService = instantiationService.createInstance(historyService_1.HistoryService);
            instantiationService.stub(history_1.IHistoryService, historyService);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            return [part, historyService, editorService, accessor.textFileService, instantiationService];
        }
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestEditor)(TEST_EDITOR_ID, [new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestFileEditorInput)]));
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
        });
        teardown(() => {
            disposables.clear();
        });
        test('back / forward: basics', async () => {
            const [part, historyService] = await createServices();
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar1'), TEST_EDITOR_INPUT_ID);
            await part.activeGroup.openEditor(input1, { pinned: true });
            assert.strictEqual(part.activeGroup.activeEditor, input1);
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar2'), TEST_EDITOR_INPUT_ID);
            await part.activeGroup.openEditor(input2, { pinned: true });
            assert.strictEqual(part.activeGroup.activeEditor, input2);
            await historyService.goBack();
            assert.strictEqual(part.activeGroup.activeEditor, input1);
            await historyService.goForward();
            assert.strictEqual(part.activeGroup.activeEditor, input2);
        });
        test('back / forward: is editor group aware', async function () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            const [part, historyService, editorService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const otherResource = utils_1.toResource.call(this, '/path/other.html');
            const pane1 = await editorService.openEditor({ resource, options: { pinned: true } });
            const pane2 = await editorService.openEditor({ resource, options: { pinned: true } }, editorService_1.SIDE_GROUP);
            // [index.txt] | [>index.txt<]
            assert.notStrictEqual(pane1, pane2);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } }, pane2 === null || pane2 === void 0 ? void 0 : pane2.group);
            // [index.txt] | [index.txt] [>other.html<]
            await historyService.goBack();
            // [index.txt] | [>index.txt<] [other.html]
            assert.strictEqual(part.activeGroup.id, (_a = pane2 === null || pane2 === void 0 ? void 0 : pane2.group) === null || _a === void 0 ? void 0 : _a.id);
            assert.strictEqual((_c = (_b = part.activeGroup.activeEditor) === null || _b === void 0 ? void 0 : _b.resource) === null || _c === void 0 ? void 0 : _c.toString(), resource.toString());
            await historyService.goBack();
            // [>index.txt<] | [index.txt] [other.html]
            assert.strictEqual(part.activeGroup.id, (_d = pane1 === null || pane1 === void 0 ? void 0 : pane1.group) === null || _d === void 0 ? void 0 : _d.id);
            assert.strictEqual((_f = (_e = part.activeGroup.activeEditor) === null || _e === void 0 ? void 0 : _e.resource) === null || _f === void 0 ? void 0 : _f.toString(), resource.toString());
            await historyService.goForward();
            // [index.txt] | [>index.txt<] [other.html]
            assert.strictEqual(part.activeGroup.id, (_g = pane2 === null || pane2 === void 0 ? void 0 : pane2.group) === null || _g === void 0 ? void 0 : _g.id);
            assert.strictEqual((_j = (_h = part.activeGroup.activeEditor) === null || _h === void 0 ? void 0 : _h.resource) === null || _j === void 0 ? void 0 : _j.toString(), resource.toString());
            await historyService.goForward();
            // [index.txt] | [index.txt] [>other.html<]
            assert.strictEqual(part.activeGroup.id, (_k = pane2 === null || pane2 === void 0 ? void 0 : pane2.group) === null || _k === void 0 ? void 0 : _k.id);
            assert.strictEqual((_m = (_l = part.activeGroup.activeEditor) === null || _l === void 0 ? void 0 : _l.resource) === null || _m === void 0 ? void 0 : _m.toString(), otherResource.toString());
        });
        test('back / forward: in-editor text selection changes (user)', async function () {
            const [, historyService, editorService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(1, 2, 1, 2));
            await setTextSelection(historyService, pane, new selection_1.Selection(15, 1, 15, 1)); // will be merged and dropped
            await setTextSelection(historyService, pane, new selection_1.Selection(16, 1, 16, 1)); // will be merged and dropped
            await setTextSelection(historyService, pane, new selection_1.Selection(17, 1, 17, 1));
            await setTextSelection(historyService, pane, new selection_1.Selection(30, 5, 30, 8));
            await setTextSelection(historyService, pane, new selection_1.Selection(40, 1, 40, 1));
            await historyService.goBack(0 /* GoFilter.NONE */);
            assertTextSelection(new selection_1.Selection(30, 5, 30, 8), pane);
            await historyService.goBack(0 /* GoFilter.NONE */);
            assertTextSelection(new selection_1.Selection(17, 1, 17, 1), pane);
            await historyService.goBack(0 /* GoFilter.NONE */);
            assertTextSelection(new selection_1.Selection(1, 2, 1, 2), pane);
            await historyService.goForward(0 /* GoFilter.NONE */);
            assertTextSelection(new selection_1.Selection(17, 1, 17, 1), pane);
        });
        test('back / forward: in-editor text selection changes (navigation)', async function () {
            const [, historyService, editorService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(2, 2, 2, 10)); // this is our starting point
            await setTextSelection(historyService, pane, new selection_1.Selection(5, 3, 5, 20), 4 /* EditorPaneSelectionChangeReason.NAVIGATION */); // this is our first target definition
            await setTextSelection(historyService, pane, new selection_1.Selection(120, 8, 120, 18), 4 /* EditorPaneSelectionChangeReason.NAVIGATION */); // this is our second target definition
            await setTextSelection(historyService, pane, new selection_1.Selection(300, 3, 300, 20)); // unrelated user navigation
            await setTextSelection(historyService, pane, new selection_1.Selection(500, 3, 500, 20)); // unrelated user navigation
            await setTextSelection(historyService, pane, new selection_1.Selection(200, 3, 200, 20)); // unrelated user navigation
            await historyService.goBack(2 /* GoFilter.NAVIGATION */); // this should reveal the last navigation entry because we are not at it currently
            assertTextSelection(new selection_1.Selection(120, 8, 120, 18), pane);
            await historyService.goBack(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goBack(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goForward(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(120, 8, 120, 18), pane);
            await historyService.goPrevious(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goPrevious(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(120, 8, 120, 18), pane);
        });
        test('back / forward: in-editor text selection changes (jump)', async function () {
            const [, historyService, editorService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(2, 2, 2, 10), 2 /* EditorPaneSelectionChangeReason.USER */);
            await setTextSelection(historyService, pane, new selection_1.Selection(5, 3, 5, 20), 5 /* EditorPaneSelectionChangeReason.JUMP */);
            await setTextSelection(historyService, pane, new selection_1.Selection(120, 8, 120, 18), 5 /* EditorPaneSelectionChangeReason.JUMP */);
            await historyService.goBack(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goBack(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(2, 2, 2, 10), pane);
            await historyService.goForward(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goLast(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(120, 8, 120, 18), pane);
            await historyService.goPrevious(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goPrevious(2 /* GoFilter.NAVIGATION */);
            assertTextSelection(new selection_1.Selection(120, 8, 120, 18), pane);
        });
        test('back / forward: selection changes with JUMP or NAVIGATION source are not merged (#143833)', async function () {
            const [, historyService, editorService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(2, 2, 2, 10), 2 /* EditorPaneSelectionChangeReason.USER */);
            await setTextSelection(historyService, pane, new selection_1.Selection(5, 3, 5, 20), 5 /* EditorPaneSelectionChangeReason.JUMP */);
            await setTextSelection(historyService, pane, new selection_1.Selection(6, 3, 6, 20), 4 /* EditorPaneSelectionChangeReason.NAVIGATION */);
            await historyService.goBack(0 /* GoFilter.NONE */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goBack(0 /* GoFilter.NONE */);
            assertTextSelection(new selection_1.Selection(2, 2, 2, 10), pane);
        });
        test('back / forward: edit selection changes', async function () {
            const [, historyService, editorService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(2, 2, 2, 10));
            await setTextSelection(historyService, pane, new selection_1.Selection(50, 3, 50, 20), 3 /* EditorPaneSelectionChangeReason.EDIT */);
            await setTextSelection(historyService, pane, new selection_1.Selection(300, 3, 300, 20)); // unrelated user navigation
            await setTextSelection(historyService, pane, new selection_1.Selection(500, 3, 500, 20)); // unrelated user navigation
            await setTextSelection(historyService, pane, new selection_1.Selection(200, 3, 200, 20)); // unrelated user navigation
            await setTextSelection(historyService, pane, new selection_1.Selection(5, 3, 5, 20), 3 /* EditorPaneSelectionChangeReason.EDIT */);
            await setTextSelection(historyService, pane, new selection_1.Selection(200, 3, 200, 20)); // unrelated user navigation
            await historyService.goBack(1 /* GoFilter.EDITS */); // this should reveal the last navigation entry because we are not at it currently
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
            await historyService.goBack(1 /* GoFilter.EDITS */);
            assertTextSelection(new selection_1.Selection(50, 3, 50, 20), pane);
            await historyService.goForward(1 /* GoFilter.EDITS */);
            assertTextSelection(new selection_1.Selection(5, 3, 5, 20), pane);
        });
        async function setTextSelection(historyService, pane, selection, reason = 2 /* EditorPaneSelectionChangeReason.USER */) {
            const promise = event_1.Event.toPromise(historyService.onDidChangeEditorNavigationStack);
            pane.setSelection(selection, reason);
            await promise;
        }
        function assertTextSelection(expected, pane) {
            var _a, _b, _c, _d;
            const options = pane.options;
            if (!options) {
                assert.fail('EditorPane has no selection');
            }
            assert.strictEqual((_a = options.selection) === null || _a === void 0 ? void 0 : _a.startLineNumber, expected.startLineNumber);
            assert.strictEqual((_b = options.selection) === null || _b === void 0 ? void 0 : _b.startColumn, expected.startColumn);
            assert.strictEqual((_c = options.selection) === null || _c === void 0 ? void 0 : _c.endLineNumber, expected.endLineNumber);
            assert.strictEqual((_d = options.selection) === null || _d === void 0 ? void 0 : _d.endColumn, expected.endColumn);
        }
        test('back / forward: tracks editor moves across groups', async function () {
            var _a, _b, _c, _d;
            const [part, historyService, editorService] = await createServices();
            const resource1 = utils_1.toResource.call(this, '/path/one.txt');
            const resource2 = utils_1.toResource.call(this, '/path/two.html');
            const pane1 = await editorService.openEditor({ resource: resource1, options: { pinned: true } });
            await editorService.openEditor({ resource: resource2, options: { pinned: true } });
            // [one.txt] [>two.html<]
            const sideGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            // [one.txt] [>two.html<] | <empty>
            let editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            (_a = pane1 === null || pane1 === void 0 ? void 0 : pane1.group) === null || _a === void 0 ? void 0 : _a.moveEditor(pane1.input, sideGroup);
            await editorChangePromise;
            // [one.txt] | [>two.html<]
            await historyService.goBack();
            // [>one.txt<] | [two.html]
            assert.strictEqual(part.activeGroup.id, (_b = pane1 === null || pane1 === void 0 ? void 0 : pane1.group) === null || _b === void 0 ? void 0 : _b.id);
            assert.strictEqual((_d = (_c = part.activeGroup.activeEditor) === null || _c === void 0 ? void 0 : _c.resource) === null || _d === void 0 ? void 0 : _d.toString(), resource1.toString());
        });
        test('back / forward: tracks group removals', async function () {
            var _a, _b, _c, _d;
            const [part, historyService, editorService] = await createServices();
            const resource1 = utils_1.toResource.call(this, '/path/one.txt');
            const resource2 = utils_1.toResource.call(this, '/path/two.html');
            const pane1 = await editorService.openEditor({ resource: resource1, options: { pinned: true } });
            const pane2 = await editorService.openEditor({ resource: resource2, options: { pinned: true } }, editorService_1.SIDE_GROUP);
            // [one.txt] | [>two.html<]
            assert.notStrictEqual(pane1, pane2);
            await ((_a = pane1 === null || pane1 === void 0 ? void 0 : pane1.group) === null || _a === void 0 ? void 0 : _a.closeAllEditors());
            // [>two.html<]
            await historyService.goBack();
            // [>two.html<]
            assert.strictEqual(part.activeGroup.id, (_b = pane2 === null || pane2 === void 0 ? void 0 : pane2.group) === null || _b === void 0 ? void 0 : _b.id);
            assert.strictEqual((_d = (_c = part.activeGroup.activeEditor) === null || _c === void 0 ? void 0 : _c.resource) === null || _d === void 0 ? void 0 : _d.toString(), resource2.toString());
        });
        test('back / forward: editor navigation stack - navigation', async function () {
            const [, , editorService, , instantiationService] = await createServices();
            const stack = instantiationService.createInstance(historyService_1.EditorNavigationStack, 0 /* GoFilter.NONE */, 0 /* GoScope.DEFAULT */);
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const otherResource = utils_1.toResource.call(this, '/path/index.html');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            let changed = false;
            stack.onDidChange(() => changed = true);
            assert.strictEqual(stack.canGoBack(), false);
            assert.strictEqual(stack.canGoForward(), false);
            assert.strictEqual(stack.canGoLast(), false);
            // Opening our first editor emits change event
            stack.notifyNavigation(pane, { reason: 2 /* EditorPaneSelectionChangeReason.USER */ });
            assert.strictEqual(changed, true);
            changed = false;
            assert.strictEqual(stack.canGoBack(), false);
            assert.strictEqual(stack.canGoLast(), true);
            // Opening same editor is not treated as new history stop
            stack.notifyNavigation(pane, { reason: 2 /* EditorPaneSelectionChangeReason.USER */ });
            assert.strictEqual(stack.canGoBack(), false);
            // Opening different editor allows to go back
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane, { reason: 2 /* EditorPaneSelectionChangeReason.USER */ });
            assert.strictEqual(changed, true);
            changed = false;
            assert.strictEqual(stack.canGoBack(), true);
            await stack.goBack();
            assert.strictEqual(stack.canGoBack(), false);
            assert.strictEqual(stack.canGoForward(), true);
            assert.strictEqual(stack.canGoLast(), true);
            await stack.goForward();
            assert.strictEqual(stack.canGoBack(), true);
            assert.strictEqual(stack.canGoForward(), false);
            await stack.goPrevious();
            assert.strictEqual(stack.canGoBack(), false);
            assert.strictEqual(stack.canGoForward(), true);
            await stack.goPrevious();
            assert.strictEqual(stack.canGoBack(), true);
            assert.strictEqual(stack.canGoForward(), false);
            await stack.goBack();
            await stack.goLast();
            assert.strictEqual(stack.canGoBack(), true);
            assert.strictEqual(stack.canGoForward(), false);
            stack.dispose();
            assert.strictEqual(stack.canGoBack(), false);
        });
        test('back / forward: editor navigation stack - mutations', async function () {
            var _a, _b;
            const [, , editorService, , instantiationService] = await createServices();
            const stack = instantiationService.createInstance(historyService_1.EditorNavigationStack, 0 /* GoFilter.NONE */, 0 /* GoScope.DEFAULT */);
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const otherResource = utils_1.toResource.call(this, '/path/index.html');
            const pane = await editorService.openEditor({ resource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            // Clear
            assert.strictEqual(stack.canGoBack(), true);
            stack.clear();
            assert.strictEqual(stack.canGoBack(), false);
            await editorService.openEditor({ resource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            // Remove (via internal event)
            assert.strictEqual(stack.canGoBack(), true);
            stack.remove(new files_1.FileOperationEvent(resource, 1 /* FileOperation.DELETE */));
            assert.strictEqual(stack.canGoBack(), false);
            stack.clear();
            await editorService.openEditor({ resource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            // Remove (via external event)
            assert.strictEqual(stack.canGoBack(), true);
            stack.remove(new files_1.FileChangesEvent([{ resource, type: 2 /* FileChangeType.DELETED */ }], !platform_1.isLinux));
            assert.strictEqual(stack.canGoBack(), false);
            stack.clear();
            await editorService.openEditor({ resource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            // Remove (via editor)
            assert.strictEqual(stack.canGoBack(), true);
            stack.remove(pane.input);
            assert.strictEqual(stack.canGoBack(), false);
            stack.clear();
            await editorService.openEditor({ resource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            // Remove (via group)
            assert.strictEqual(stack.canGoBack(), true);
            stack.remove(pane.group.id);
            assert.strictEqual(stack.canGoBack(), false);
            stack.clear();
            await editorService.openEditor({ resource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            await editorService.openEditor({ resource: otherResource, options: { pinned: true } });
            stack.notifyNavigation(pane);
            // Move
            const stat = {
                ctime: 0,
                etag: '',
                mtime: 0,
                isDirectory: false,
                isFile: true,
                isSymbolicLink: false,
                name: 'other.txt',
                readonly: false,
                size: 0,
                resource: utils_1.toResource.call(this, '/path/other.txt'),
                children: undefined
            };
            stack.move(new files_1.FileOperationEvent(resource, 2 /* FileOperation.MOVE */, stat));
            await stack.goBack();
            assert.strictEqual((_b = (_a = pane === null || pane === void 0 ? void 0 : pane.input) === null || _a === void 0 ? void 0 : _a.resource) === null || _b === void 0 ? void 0 : _b.toString(), stat.resource.toString());
        });
        test('back / forward: editor group scope', async function () {
            var _a, _b, _c, _d, _e, _f;
            const [part, historyService, editorService] = await createServices(1 /* GoScope.EDITOR_GROUP */);
            const resource1 = utils_1.toResource.call(this, '/path/one.txt');
            const resource2 = utils_1.toResource.call(this, '/path/two.html');
            const resource3 = utils_1.toResource.call(this, '/path/three.html');
            const pane1 = await editorService.openEditor({ resource: resource1, options: { pinned: true } });
            await editorService.openEditor({ resource: resource2, options: { pinned: true } });
            await editorService.openEditor({ resource: resource3, options: { pinned: true } });
            // [one.txt] [two.html] [>three.html<]
            const sideGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            // [one.txt] [two.html] [>three.html<] | <empty>
            const pane2 = await editorService.openEditor({ resource: resource1, options: { pinned: true } }, sideGroup);
            await editorService.openEditor({ resource: resource2, options: { pinned: true } });
            await editorService.openEditor({ resource: resource3, options: { pinned: true } });
            // [one.txt] [two.html] [>three.html<] | [one.txt] [two.html] [>three.html<]
            await historyService.goBack();
            await historyService.goBack();
            await historyService.goBack();
            assert.strictEqual(part.activeGroup.id, (_a = pane2 === null || pane2 === void 0 ? void 0 : pane2.group) === null || _a === void 0 ? void 0 : _a.id);
            assert.strictEqual((_c = (_b = part.activeGroup.activeEditor) === null || _b === void 0 ? void 0 : _b.resource) === null || _c === void 0 ? void 0 : _c.toString(), resource1.toString());
            // [one.txt] [two.html] [>three.html<] | [>one.txt<] [two.html] [three.html]
            await editorService.openEditor({ resource: resource3, options: { pinned: true } }, pane1 === null || pane1 === void 0 ? void 0 : pane1.group);
            await historyService.goBack();
            await historyService.goBack();
            await historyService.goBack();
            assert.strictEqual(part.activeGroup.id, (_d = pane1 === null || pane1 === void 0 ? void 0 : pane1.group) === null || _d === void 0 ? void 0 : _d.id);
            assert.strictEqual((_f = (_e = part.activeGroup.activeEditor) === null || _e === void 0 ? void 0 : _e.resource) === null || _f === void 0 ? void 0 : _f.toString(), resource1.toString());
        });
        test('back / forward: editor  scope', async function () {
            var _a, _b, _c, _d;
            const [part, historyService, editorService] = await createServices(2 /* GoScope.EDITOR */);
            const resource1 = utils_1.toResource.call(this, '/path/one.txt');
            const resource2 = utils_1.toResource.call(this, '/path/two.html');
            const pane = await editorService.openEditor({ resource: resource1, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(2, 2, 2, 10));
            await setTextSelection(historyService, pane, new selection_1.Selection(50, 3, 50, 20));
            await editorService.openEditor({ resource: resource2, options: { pinned: true } });
            await setTextSelection(historyService, pane, new selection_1.Selection(12, 2, 12, 10));
            await setTextSelection(historyService, pane, new selection_1.Selection(150, 3, 150, 20));
            await historyService.goBack();
            assertTextSelection(new selection_1.Selection(12, 2, 12, 10), pane);
            await historyService.goBack();
            assertTextSelection(new selection_1.Selection(12, 2, 12, 10), pane); // no change
            assert.strictEqual((_b = (_a = part.activeGroup.activeEditor) === null || _a === void 0 ? void 0 : _a.resource) === null || _b === void 0 ? void 0 : _b.toString(), resource2.toString());
            await editorService.openEditor({ resource: resource1, options: { pinned: true } });
            await historyService.goBack();
            assertTextSelection(new selection_1.Selection(2, 2, 2, 10), pane);
            await historyService.goBack();
            assertTextSelection(new selection_1.Selection(2, 2, 2, 10), pane); // no change
            assert.strictEqual((_d = (_c = part.activeGroup.activeEditor) === null || _c === void 0 ? void 0 : _c.resource) === null || _d === void 0 ? void 0 : _d.toString(), resource1.toString());
        });
        test('go to last edit location', async function () {
            var _a, _b;
            const [, historyService, editorService, textFileService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const otherResource = utils_1.toResource.call(this, '/path/index.html');
            await editorService.openEditor({ resource });
            const model = await textFileService.files.resolve(resource);
            model.textEditorModel.setValue('Hello World');
            await (0, async_1.timeout)(10); // history debounces change events
            await editorService.openEditor({ resource: otherResource });
            const onDidActiveEditorChange = new async_1.DeferredPromise();
            editorService.onDidActiveEditorChange(e => {
                onDidActiveEditorChange.complete(e);
            });
            historyService.goLast(1 /* GoFilter.EDITS */);
            await onDidActiveEditorChange.p;
            assert.strictEqual((_b = (_a = editorService.activeEditor) === null || _a === void 0 ? void 0 : _a.resource) === null || _b === void 0 ? void 0 : _b.toString(), resource.toString());
        });
        test('reopen closed editor', async function () {
            var _a, _b, _c;
            const [, historyService, editorService] = await createServices();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const pane = await editorService.openEditor({ resource });
            await ((_a = pane === null || pane === void 0 ? void 0 : pane.group) === null || _a === void 0 ? void 0 : _a.closeAllEditors());
            const onDidActiveEditorChange = new async_1.DeferredPromise();
            editorService.onDidActiveEditorChange(e => {
                onDidActiveEditorChange.complete(e);
            });
            historyService.reopenLastClosedEditor();
            await onDidActiveEditorChange.p;
            assert.strictEqual((_c = (_b = editorService.activeEditor) === null || _b === void 0 ? void 0 : _b.resource) === null || _c === void 0 ? void 0 : _c.toString(), resource.toString());
        });
        test('getHistory', async () => {
            var _a, _b;
            class TestFileEditorInputWithUntyped extends workbenchTestServices_1.TestFileEditorInput {
                toUntyped() {
                    return {
                        resource: this.resource,
                        options: {
                            override: 'testOverride'
                        }
                    };
                }
            }
            const [part, historyService] = await createServices();
            let history = historyService.getHistory();
            assert.strictEqual(history.length, 0);
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar1'), TEST_EDITOR_INPUT_ID);
            await part.activeGroup.openEditor(input1, { pinned: true });
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar2'), TEST_EDITOR_INPUT_ID);
            await part.activeGroup.openEditor(input2, { pinned: true });
            const input3 = new TestFileEditorInputWithUntyped(uri_1.URI.parse('foo://bar3'), TEST_EDITOR_INPUT_ID);
            await part.activeGroup.openEditor(input3, { pinned: true });
            const input4 = new TestFileEditorInputWithUntyped(uri_1.URI.file('bar4'), TEST_EDITOR_INPUT_ID);
            await part.activeGroup.openEditor(input4, { pinned: true });
            history = historyService.getHistory();
            assert.strictEqual(history.length, 4);
            // first entry is untyped because it implements `toUntyped` and has a supported scheme
            assert.strictEqual((0, editor_1.isResourceEditorInput)(history[0]) && !(history[0] instanceof editorInput_1.EditorInput), true);
            assert.strictEqual((_a = history[0].options) === null || _a === void 0 ? void 0 : _a.override, 'testOverride');
            // second entry is not untyped even though it implements `toUntyped` but has unsupported scheme
            assert.strictEqual(history[1] instanceof editorInput_1.EditorInput, true);
            assert.strictEqual(history[2] instanceof editorInput_1.EditorInput, true);
            assert.strictEqual(history[3] instanceof editorInput_1.EditorInput, true);
            historyService.removeFromHistory(input2);
            history = historyService.getHistory();
            assert.strictEqual(history.length, 3);
            assert.strictEqual((_b = history[0].resource) === null || _b === void 0 ? void 0 : _b.toString(), input4.resource.toString());
        });
        test('getLastActiveFile', async () => {
            var _a;
            const [part, historyService] = await createServices();
            assert.ok(!historyService.getLastActiveFile('foo'));
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar1'), TEST_EDITOR_INPUT_ID);
            await part.activeGroup.openEditor(input1, { pinned: true });
            assert.strictEqual((_a = historyService.getLastActiveFile('foo')) === null || _a === void 0 ? void 0 : _a.toString(), input1.resource.toString());
        });
        test('open next/previous recently used editor (single group)', async () => {
            const [part, historyService, editorService] = await createServices();
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar2'), TEST_EDITOR_INPUT_ID);
            await part.activeGroup.openEditor(input1, { pinned: true });
            assert.strictEqual(part.activeGroup.activeEditor, input1);
            await part.activeGroup.openEditor(input2, { pinned: true });
            assert.strictEqual(part.activeGroup.activeEditor, input2);
            let editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openPreviouslyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input1);
            editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openNextRecentlyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input2);
            editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openPreviouslyUsedEditor(part.activeGroup.id);
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input1);
            editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openNextRecentlyUsedEditor(part.activeGroup.id);
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input2);
        });
        test('open next/previous recently used editor (multi group)', async () => {
            const [part, historyService, editorService] = await createServices();
            const rootGroup = part.activeGroup;
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar2'), TEST_EDITOR_INPUT_ID);
            const sideGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            await rootGroup.openEditor(input1, { pinned: true });
            await sideGroup.openEditor(input2, { pinned: true });
            let editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openPreviouslyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup, rootGroup);
            assert.strictEqual(rootGroup.activeEditor, input1);
            editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openNextRecentlyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup, sideGroup);
            assert.strictEqual(sideGroup.activeEditor, input2);
        });
        test('open next/previous recently is reset when other input opens', async () => {
            const [part, historyService, editorService] = await createServices();
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar1'), TEST_EDITOR_INPUT_ID);
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar2'), TEST_EDITOR_INPUT_ID);
            const input3 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar3'), TEST_EDITOR_INPUT_ID);
            const input4 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('foo://bar4'), TEST_EDITOR_INPUT_ID);
            await part.activeGroup.openEditor(input1, { pinned: true });
            await part.activeGroup.openEditor(input2, { pinned: true });
            await part.activeGroup.openEditor(input3, { pinned: true });
            let editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openPreviouslyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input2);
            await (0, async_1.timeout)(0);
            await part.activeGroup.openEditor(input4, { pinned: true });
            editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openPreviouslyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input2);
            editorChangePromise = event_1.Event.toPromise(editorService.onDidActiveEditorChange);
            historyService.openNextRecentlyUsedEditor();
            await editorChangePromise;
            assert.strictEqual(part.activeGroup.activeEditor, input4);
        });
    });
});
//# sourceMappingURL=historyService.test.js.map