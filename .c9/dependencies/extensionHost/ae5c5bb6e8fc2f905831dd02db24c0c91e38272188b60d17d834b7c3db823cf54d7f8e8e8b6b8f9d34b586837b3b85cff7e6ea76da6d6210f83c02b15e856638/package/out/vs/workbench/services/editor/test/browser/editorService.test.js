/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/editor/common/editor", "vs/base/common/uri", "vs/base/common/event", "vs/workbench/common/editor", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/base/common/async", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/workbench/services/editor/common/editorResolverService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/workspaces/test/common/testWorkspaceTrustService", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/browser/parts/editor/editorPlaceholder", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration", "vs/editor/common/languages/modesRegistry"], function (require, exports, assert, editor_1, uri_1, event_1, editor_2, workbenchTestServices_1, editorService_1, editorGroupsService_1, editorService_2, descriptors_1, fileEditorInput_1, async_1, files_1, lifecycle_1, mockKeybindingService_1, editorResolverService_1, workspaceTrust_1, testWorkspaceTrustService_1, sideBySideEditorInput_1, editorPlaceholder_1, testConfigurationService_1, configuration_1, modesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorService', () => {
        const TEST_EDITOR_ID = 'MyTestEditorForEditorService';
        const TEST_EDITOR_INPUT_ID = 'testEditorInputForEditorService';
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestEditor)(TEST_EDITOR_ID, [new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestFileEditorInput), new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestSingletonFileEditorInput)], TEST_EDITOR_INPUT_ID));
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
            disposables.add((0, workbenchTestServices_1.registerTestSideBySideEditor)());
        });
        teardown(() => {
            disposables.clear();
        });
        async function createEditorService(instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables)) {
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustRequestService, new testWorkspaceTrustService_1.TestWorkspaceTrustRequestService(false));
            const editorService = instantiationService.createInstance(editorService_1.EditorService);
            instantiationService.stub(editorService_2.IEditorService, editorService);
            return [part, editorService, instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor)];
        }
        test('openEditor() - basics', async () => {
            var _a;
            const [, service] = await createEditorService();
            let input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            let otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-basics'), TEST_EDITOR_INPUT_ID);
            let activeEditorChangeEventCounter = 0;
            const activeEditorChangeListener = service.onDidActiveEditorChange(() => {
                activeEditorChangeEventCounter++;
            });
            let visibleEditorChangeEventCounter = 0;
            const visibleEditorChangeListener = service.onDidVisibleEditorsChange(() => {
                visibleEditorChangeEventCounter++;
            });
            let didCloseEditorListenerCounter = 0;
            const didCloseEditorListener = service.onDidCloseEditor(() => {
                didCloseEditorListenerCounter++;
            });
            // Open input
            let editor = await service.openEditor(input, { pinned: true });
            assert.strictEqual(editor === null || editor === void 0 ? void 0 : editor.getId(), TEST_EDITOR_ID);
            assert.strictEqual(editor, service.activeEditorPane);
            assert.strictEqual(1, service.count);
            assert.strictEqual(input, service.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0].editor);
            assert.strictEqual(input, service.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0].editor);
            assert.strictEqual(input, service.activeEditor);
            assert.strictEqual(service.visibleEditorPanes.length, 1);
            assert.strictEqual(service.visibleEditorPanes[0], editor);
            assert.ok(!service.activeTextEditorControl);
            assert.ok(!service.activeTextEditorLanguageId);
            assert.strictEqual(service.visibleTextEditorControls.length, 0);
            assert.strictEqual(service.isOpened(input), true);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), true);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: 'unknownTypeId' }), false);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: 'unknownTypeId', editorId: input.editorId }), false);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: 'unknownTypeId', editorId: 'unknownTypeId' }), false);
            assert.strictEqual(service.isVisible(input), true);
            assert.strictEqual(service.isVisible(otherInput), false);
            assert.strictEqual(activeEditorChangeEventCounter, 1);
            assert.strictEqual(visibleEditorChangeEventCounter, 1);
            // Close input
            await ((_a = editor === null || editor === void 0 ? void 0 : editor.group) === null || _a === void 0 ? void 0 : _a.closeEditor(input));
            assert.strictEqual(0, service.count);
            assert.strictEqual(0, service.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).length);
            assert.strictEqual(0, service.getEditors(1 /* EditorsOrder.SEQUENTIAL */).length);
            assert.strictEqual(didCloseEditorListenerCounter, 1);
            assert.strictEqual(activeEditorChangeEventCounter, 2);
            assert.strictEqual(visibleEditorChangeEventCounter, 2);
            assert.ok(input.gotDisposed);
            // Open again 2 inputs (disposed editors are ignored!)
            await service.openEditor(input, { pinned: true });
            assert.strictEqual(0, service.count);
            // Open again 2 inputs (recreate because disposed)
            input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-basics'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input, { pinned: true });
            editor = await service.openEditor(otherInput, { pinned: true });
            assert.strictEqual(2, service.count);
            assert.strictEqual(otherInput, service.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[0].editor);
            assert.strictEqual(input, service.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)[1].editor);
            assert.strictEqual(input, service.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[0].editor);
            assert.strictEqual(otherInput, service.getEditors(1 /* EditorsOrder.SEQUENTIAL */)[1].editor);
            assert.strictEqual(service.visibleEditorPanes.length, 1);
            assert.strictEqual(service.isOpened(input), true);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), true);
            assert.strictEqual(service.isOpened(otherInput), true);
            assert.strictEqual(service.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), true);
            assert.strictEqual(activeEditorChangeEventCounter, 4);
            assert.strictEqual(visibleEditorChangeEventCounter, 4);
            const stickyInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource3-basics'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(stickyInput, { sticky: true });
            assert.strictEqual(3, service.count);
            const allSequentialEditors = service.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            assert.strictEqual(allSequentialEditors.length, 3);
            assert.strictEqual(stickyInput, allSequentialEditors[0].editor);
            assert.strictEqual(input, allSequentialEditors[1].editor);
            assert.strictEqual(otherInput, allSequentialEditors[2].editor);
            const sequentialEditorsExcludingSticky = service.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true });
            assert.strictEqual(sequentialEditorsExcludingSticky.length, 2);
            assert.strictEqual(input, sequentialEditorsExcludingSticky[0].editor);
            assert.strictEqual(otherInput, sequentialEditorsExcludingSticky[1].editor);
            const mruEditorsExcludingSticky = service.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true });
            assert.strictEqual(mruEditorsExcludingSticky.length, 2);
            assert.strictEqual(input, sequentialEditorsExcludingSticky[0].editor);
            assert.strictEqual(otherInput, sequentialEditorsExcludingSticky[1].editor);
            activeEditorChangeListener.dispose();
            visibleEditorChangeListener.dispose();
            didCloseEditorListener.dispose();
        });
        test('openEditor() - multiple calls are cancelled and indicated as such', async () => {
            const [, service] = await createEditorService();
            let input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            let otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-basics'), TEST_EDITOR_INPUT_ID);
            let activeEditorChangeEventCounter = 0;
            const activeEditorChangeListener = service.onDidActiveEditorChange(() => {
                activeEditorChangeEventCounter++;
            });
            let visibleEditorChangeEventCounter = 0;
            const visibleEditorChangeListener = service.onDidVisibleEditorsChange(() => {
                visibleEditorChangeEventCounter++;
            });
            const editorP1 = service.openEditor(input, { pinned: true });
            const editorP2 = service.openEditor(otherInput, { pinned: true });
            const editor1 = await editorP1;
            assert.strictEqual(editor1, undefined);
            const editor2 = await editorP2;
            assert.strictEqual(editor2 === null || editor2 === void 0 ? void 0 : editor2.input, otherInput);
            assert.strictEqual(activeEditorChangeEventCounter, 1);
            assert.strictEqual(visibleEditorChangeEventCounter, 1);
            activeEditorChangeListener.dispose();
            visibleEditorChangeListener.dispose();
        });
        test('openEditor() - same input does not cancel previous one - https://github.com/microsoft/vscode/issues/136684', async () => {
            const [, service] = await createEditorService();
            let input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            let editorP1 = service.openEditor(input, { pinned: true });
            let editorP2 = service.openEditor(input, { pinned: true });
            let editor1 = await editorP1;
            assert.strictEqual(editor1 === null || editor1 === void 0 ? void 0 : editor1.input, input);
            let editor2 = await editorP2;
            assert.strictEqual(editor2 === null || editor2 === void 0 ? void 0 : editor2.input, input);
            assert.ok(editor2.group);
            await editor2.group.closeAllEditors();
            input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            let inputSame = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-basics'), TEST_EDITOR_INPUT_ID);
            editorP1 = service.openEditor(input, { pinned: true });
            editorP2 = service.openEditor(inputSame, { pinned: true });
            editor1 = await editorP1;
            assert.strictEqual(editor1 === null || editor1 === void 0 ? void 0 : editor1.input, input);
            editor2 = await editorP2;
            assert.strictEqual(editor2 === null || editor2 === void 0 ? void 0 : editor2.input, input);
        });
        test('openEditor() - singleton typed editors reveal instead of split', async () => {
            var _a, _b;
            const [part, service] = await createEditorService();
            let input1 = new workbenchTestServices_1.TestSingletonFileEditorInput(uri_1.URI.parse('my://resource-basics1'), TEST_EDITOR_INPUT_ID);
            let input2 = new workbenchTestServices_1.TestSingletonFileEditorInput(uri_1.URI.parse('my://resource-basics2'), TEST_EDITOR_INPUT_ID);
            const input1Group = (_a = (await service.openEditor(input1, { pinned: true }))) === null || _a === void 0 ? void 0 : _a.group;
            const input2Group = (_b = (await service.openEditor(input2, { pinned: true }, editorService_2.SIDE_GROUP))) === null || _b === void 0 ? void 0 : _b.group;
            assert.strictEqual(part.activeGroup, input2Group);
            await service.openEditor(input1, { pinned: true });
            assert.strictEqual(part.activeGroup, input1Group);
        });
        test('openEditor() - locked groups', async () => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService();
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-locked-group-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, editor => ({ editor: new workbenchTestServices_1.TestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })));
            let input1 = { resource: uri_1.URI.parse('file://resource-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input2 = { resource: uri_1.URI.parse('file://resource2-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input3 = { resource: uri_1.URI.parse('file://resource3-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input4 = { resource: uri_1.URI.parse('file://resource4-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input5 = { resource: uri_1.URI.parse('file://resource5-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input6 = { resource: uri_1.URI.parse('file://resource6-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input7 = { resource: uri_1.URI.parse('file://resource7-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let editor1 = await service.openEditor(input1, { pinned: true });
            let editor2 = await service.openEditor(input2, { pinned: true }, editorService_2.SIDE_GROUP);
            const group1 = editor1 === null || editor1 === void 0 ? void 0 : editor1.group;
            assert.strictEqual(group1 === null || group1 === void 0 ? void 0 : group1.count, 1);
            const group2 = editor2 === null || editor2 === void 0 ? void 0 : editor2.group;
            assert.strictEqual(group2 === null || group2 === void 0 ? void 0 : group2.count, 1);
            group2.lock(true);
            part.activateGroup(group2.id);
            // Will open in group 1 because group 2 is locked
            await service.openEditor(input3, { pinned: true });
            assert.strictEqual(group1.count, 2);
            assert.strictEqual((_b = (_a = group1.activeEditor) === null || _a === void 0 ? void 0 : _a.resource) === null || _b === void 0 ? void 0 : _b.toString(), input3.resource.toString());
            assert.strictEqual(group2.count, 1);
            // Will open in group 2 because group was provided
            await service.openEditor(input3, { pinned: true }, group2.id);
            assert.strictEqual(group1.count, 2);
            assert.strictEqual(group2.count, 2);
            assert.strictEqual((_d = (_c = group2.activeEditor) === null || _c === void 0 ? void 0 : _c.resource) === null || _d === void 0 ? void 0 : _d.toString(), input3.resource.toString());
            // Will reveal editor in group 2 because it is contained
            await service.openEditor(input2, { pinned: true }, group2);
            await service.openEditor(input2, { pinned: true }, editorService_2.ACTIVE_GROUP);
            assert.strictEqual(group1.count, 2);
            assert.strictEqual(group2.count, 2);
            assert.strictEqual((_f = (_e = group2.activeEditor) === null || _e === void 0 ? void 0 : _e.resource) === null || _f === void 0 ? void 0 : _f.toString(), input2.resource.toString());
            // Will open a new group because side group is locked
            part.activateGroup(group1.id);
            let editor3 = await service.openEditor(input4, { pinned: true }, editorService_2.SIDE_GROUP);
            assert.strictEqual(part.count, 3);
            const group3 = editor3 === null || editor3 === void 0 ? void 0 : editor3.group;
            assert.strictEqual(group3 === null || group3 === void 0 ? void 0 : group3.count, 1);
            // Will reveal editor in group 2 because it is contained
            await service.openEditor(input3, { pinned: true }, group2);
            part.activateGroup(group1.id);
            await service.openEditor(input3, { pinned: true }, editorService_2.SIDE_GROUP);
            assert.strictEqual(part.count, 3);
            // Will open a new group if all groups are locked
            group1.lock(true);
            group2.lock(true);
            group3.lock(true);
            part.activateGroup(group1.id);
            let editor5 = await service.openEditor(input5, { pinned: true });
            const group4 = editor5 === null || editor5 === void 0 ? void 0 : editor5.group;
            assert.strictEqual(group4 === null || group4 === void 0 ? void 0 : group4.count, 1);
            assert.strictEqual((_h = (_g = group4.activeEditor) === null || _g === void 0 ? void 0 : _g.resource) === null || _h === void 0 ? void 0 : _h.toString(), input5.resource.toString());
            assert.strictEqual(part.count, 4);
            // Will open editor in most recently non-locked group
            group1.lock(false);
            group2.lock(false);
            group3.lock(false);
            group4.lock(false);
            part.activateGroup(group3.id);
            part.activateGroup(group2.id);
            part.activateGroup(group4.id);
            group4.lock(true);
            group2.lock(true);
            await service.openEditor(input6, { pinned: true });
            assert.strictEqual(part.count, 4);
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual((_k = (_j = group3.activeEditor) === null || _j === void 0 ? void 0 : _j.resource) === null || _k === void 0 ? void 0 : _k.toString(), input6.resource.toString());
            // Will find the right group where editor is already opened in when all groups are locked
            group1.lock(true);
            group2.lock(true);
            group3.lock(true);
            group4.lock(true);
            part.activateGroup(group1.id);
            await service.openEditor(input6, { pinned: true });
            assert.strictEqual(part.count, 4);
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual((_m = (_l = group3.activeEditor) === null || _l === void 0 ? void 0 : _l.resource) === null || _m === void 0 ? void 0 : _m.toString(), input6.resource.toString());
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual((_p = (_o = group3.activeEditor) === null || _o === void 0 ? void 0 : _o.resource) === null || _p === void 0 ? void 0 : _p.toString(), input6.resource.toString());
            part.activateGroup(group1.id);
            await service.openEditor(input6, { pinned: true });
            assert.strictEqual(part.count, 4);
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual((_r = (_q = group3.activeEditor) === null || _q === void 0 ? void 0 : _q.resource) === null || _r === void 0 ? void 0 : _r.toString(), input6.resource.toString());
            // Will reveal an opened editor in the active locked group
            await service.openEditor(input7, { pinned: true }, group3);
            await service.openEditor(input6, { pinned: true });
            assert.strictEqual(part.count, 4);
            assert.strictEqual(part.activeGroup, group3);
            assert.strictEqual((_t = (_s = group3.activeEditor) === null || _s === void 0 ? void 0 : _s.resource) === null || _t === void 0 ? void 0 : _t.toString(), input6.resource.toString());
        });
        test('locked groups - workbench.editor.revealIfOpen', async () => {
            var _a, _b, _c, _d;
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            await configurationService.setUserConfiguration('workbench', { 'editor': { 'revealIfOpen': true } });
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService(instantiationService);
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-locked-group-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, editor => ({ editor: new workbenchTestServices_1.TestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })));
            const rootGroup = part.activeGroup;
            let rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            part.activateGroup(rootGroup);
            let input1 = { resource: uri_1.URI.parse('file://resource-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input2 = { resource: uri_1.URI.parse('file://resource2-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input3 = { resource: uri_1.URI.parse('file://resource3-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input4 = { resource: uri_1.URI.parse('file://resource4-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            await service.openEditor(input1, rootGroup.id);
            await service.openEditor(input2, rootGroup.id);
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            await service.openEditor(input3, rightGroup.id);
            await service.openEditor(input4, rightGroup.id);
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            rootGroup.lock(true);
            rightGroup.lock(true);
            await service.openEditor(input1);
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            assert.strictEqual((_b = (_a = part.activeGroup.activeEditor) === null || _a === void 0 ? void 0 : _a.resource) === null || _b === void 0 ? void 0 : _b.toString(), input1.resource.toString());
            await service.openEditor(input3);
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            assert.strictEqual((_d = (_c = part.activeGroup.activeEditor) === null || _c === void 0 ? void 0 : _c.resource) === null || _d === void 0 ? void 0 : _d.toString(), input3.resource.toString());
            assert.strictEqual(part.groups.length, 2);
        });
        test('locked groups - revealIfVisible', async () => {
            var _a, _b, _c, _d;
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService();
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-locked-group-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, editor => ({ editor: new workbenchTestServices_1.TestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })));
            const rootGroup = part.activeGroup;
            let rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            part.activateGroup(rootGroup);
            let input1 = { resource: uri_1.URI.parse('file://resource-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input2 = { resource: uri_1.URI.parse('file://resource2-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input3 = { resource: uri_1.URI.parse('file://resource3-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input4 = { resource: uri_1.URI.parse('file://resource4-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            await service.openEditor(input1, rootGroup.id);
            await service.openEditor(input2, rootGroup.id);
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            await service.openEditor(input3, rightGroup.id);
            await service.openEditor(input4, rightGroup.id);
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            rootGroup.lock(true);
            rightGroup.lock(true);
            await service.openEditor(Object.assign(Object.assign({}, input2), { options: Object.assign(Object.assign({}, input2.options), { revealIfVisible: true }) }));
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            assert.strictEqual((_b = (_a = part.activeGroup.activeEditor) === null || _a === void 0 ? void 0 : _a.resource) === null || _b === void 0 ? void 0 : _b.toString(), input2.resource.toString());
            await service.openEditor(Object.assign(Object.assign({}, input4), { options: Object.assign(Object.assign({}, input4.options), { revealIfVisible: true }) }));
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            assert.strictEqual((_d = (_c = part.activeGroup.activeEditor) === null || _c === void 0 ? void 0 : _c.resource) === null || _d === void 0 ? void 0 : _d.toString(), input4.resource.toString());
            assert.strictEqual(part.groups.length, 2);
        });
        test('locked groups - revealIfOpened', async () => {
            var _a, _b, _c, _d;
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService();
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-locked-group-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, editor => ({ editor: new workbenchTestServices_1.TestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })));
            const rootGroup = part.activeGroup;
            let rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            part.activateGroup(rootGroup);
            let input1 = { resource: uri_1.URI.parse('file://resource-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input2 = { resource: uri_1.URI.parse('file://resource2-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input3 = { resource: uri_1.URI.parse('file://resource3-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            let input4 = { resource: uri_1.URI.parse('file://resource4-basics.editor-service-locked-group-tests'), options: { pinned: true } };
            await service.openEditor(input1, rootGroup.id);
            await service.openEditor(input2, rootGroup.id);
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            await service.openEditor(input3, rightGroup.id);
            await service.openEditor(input4, rightGroup.id);
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            rootGroup.lock(true);
            rightGroup.lock(true);
            await service.openEditor(Object.assign(Object.assign({}, input1), { options: Object.assign(Object.assign({}, input1.options), { revealIfOpened: true }) }));
            assert.strictEqual(part.activeGroup.id, rootGroup.id);
            assert.strictEqual((_b = (_a = part.activeGroup.activeEditor) === null || _a === void 0 ? void 0 : _a.resource) === null || _b === void 0 ? void 0 : _b.toString(), input1.resource.toString());
            await service.openEditor(Object.assign(Object.assign({}, input3), { options: Object.assign(Object.assign({}, input3.options), { revealIfOpened: true }) }));
            assert.strictEqual(part.activeGroup.id, rightGroup.id);
            assert.strictEqual((_d = (_c = part.activeGroup.activeEditor) === null || _c === void 0 ? void 0 : _c.resource) === null || _d === void 0 ? void 0 : _d.toString(), input3.resource.toString());
            assert.strictEqual(part.groups.length, 2);
        });
        test('openEditor() - untyped, typed', () => {
            return testOpenEditors(false);
        });
        test('openEditors() - untyped, typed', () => {
            return testOpenEditors(true);
        });
        async function testOpenEditors(useOpenEditors) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [part, service, accessor] = await createEditorService();
            let rootGroup = part.activeGroup;
            let editorFactoryCalled = 0;
            let untitledEditorFactoryCalled = 0;
            let diffEditorFactoryCalled = 0;
            let lastEditorFactoryEditor = undefined;
            let lastUntitledEditorFactoryEditor = undefined;
            let lastDiffEditorFactoryEditor = undefined;
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-override-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, { canHandleDiff: true }, editor => {
                editorFactoryCalled++;
                lastEditorFactoryEditor = editor;
                return { editor: new workbenchTestServices_1.TestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) };
            }, untitledEditor => {
                var _a;
                untitledEditorFactoryCalled++;
                lastUntitledEditorFactoryEditor = untitledEditor;
                return { editor: new workbenchTestServices_1.TestFileEditorInput((_a = untitledEditor.resource) !== null && _a !== void 0 ? _a : uri_1.URI.parse(`untitled://my-untitled-editor-${untitledEditorFactoryCalled}`), TEST_EDITOR_INPUT_ID) };
            }, diffEditor => {
                diffEditorFactoryCalled++;
                lastDiffEditorFactoryEditor = diffEditor;
                return { editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file(`diff-editor-${diffEditorFactoryCalled}`), TEST_EDITOR_INPUT_ID) };
            }));
            async function resetTestState() {
                editorFactoryCalled = 0;
                untitledEditorFactoryCalled = 0;
                diffEditorFactoryCalled = 0;
                lastEditorFactoryEditor = undefined;
                lastUntitledEditorFactoryEditor = undefined;
                lastDiffEditorFactoryEditor = undefined;
                for (const group of part.groups) {
                    await group.closeAllEditors();
                }
                for (const group of part.groups) {
                    accessor.editorGroupService.removeGroup(group);
                }
                rootGroup = part.activeGroup;
            }
            async function openEditor(editor, group) {
                if (useOpenEditors) {
                    const panes = await service.openEditors([editor], group);
                    return panes[0];
                }
                if ((0, editor_2.isEditorInputWithOptions)(editor)) {
                    return service.openEditor(editor.editor, editor.options, group);
                }
                return service.openEditor(editor, group);
            }
            // untyped
            {
                // untyped resource editor, no options, no group
                {
                    let untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests') };
                    let pane = await openEditor(untypedEditor);
                    let typedEditor = pane === null || pane === void 0 ? void 0 : pane.input;
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(typedEditor instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedEditor.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(untypedEditor);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group.activeEditor, typedEditor);
                    // replaceEditors should work too
                    let untypedEditorReplacement = { resource: uri_1.URI.file('file-replaced.editor-service-override-tests') };
                    await service.replaceEditors([{
                            editor: typedEditor,
                            replacement: untypedEditorReplacement
                        }], rootGroup);
                    typedEditor = rootGroup.activeEditor;
                    assert.ok(typedEditor instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual((_a = typedEditor === null || typedEditor === void 0 ? void 0 : typedEditor.resource) === null || _a === void 0 ? void 0 : _a.toString(), untypedEditorReplacement.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 2);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor, untypedEditorReplacement);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (override disabled), no group
                {
                    let untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { override: editor_1.EditorResolution.DISABLED } };
                    let pane = await openEditor(untypedEditor);
                    let typedEditor = pane === null || pane === void 0 ? void 0 : pane.input;
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(typedEditor instanceof fileEditorInput_1.FileEditorInput);
                    assert.strictEqual(typedEditor.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(untypedEditor);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group.activeEditor, typedEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (override disabled, sticky: true, preserveFocus: true), no group
                {
                    let untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { sticky: true, preserveFocus: true, override: editor_1.EditorResolution.DISABLED } };
                    let pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof fileEditorInput_1.FileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // untyped resource editor, options (override default), no group
                {
                    let untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { override: editor_2.DEFAULT_EDITOR_ASSOCIATION.id } };
                    let pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof fileEditorInput_1.FileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (override: TEST_EDITOR_INPUT_ID), no group
                {
                    let untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { override: TEST_EDITOR_INPUT_ID } };
                    let pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (sticky: true, preserveFocus: true), no group
                {
                    let untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { sticky: true, preserveFocus: true } };
                    let pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual((_b = lastEditorFactoryEditor.options) === null || _b === void 0 ? void 0 : _b.preserveFocus, true);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // untyped resource editor, options (override: TEST_EDITOR_INPUT_ID, sticky: true, preserveFocus: true), no group
                {
                    let untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { sticky: true, preserveFocus: true, override: TEST_EDITOR_INPUT_ID } };
                    let pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual((_c = lastEditorFactoryEditor.options) === null || _c === void 0 ? void 0 : _c.preserveFocus, true);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // untyped resource editor, no options, SIDE_GROUP
                {
                    let untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests') };
                    let pane = await openEditor(untypedEditor, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok((pane === null || pane === void 0 ? void 0 : pane.input) instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped resource editor, options (override disabled), SIDE_GROUP
                {
                    let untypedEditor = { resource: uri_1.URI.file('file.editor-service-override-tests'), options: { override: editor_1.EditorResolution.DISABLED } };
                    let pane = await openEditor(untypedEditor, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok((pane === null || pane === void 0 ? void 0 : pane.input) instanceof fileEditorInput_1.FileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), untypedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // Typed
            {
                // typed editor, no options, no group
                {
                    let typedEditor = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    let pane = await openEditor({ editor: typedEditor });
                    let typedInput = pane === null || pane === void 0 ? void 0 : pane.input;
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(typedInput instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedInput.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor.resource.toString(), typedEditor.resource.toString());
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(typedEditor);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group.activeEditor, typedInput);
                    // replaceEditors should work too
                    let typedEditorReplacement = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file-replaced.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    await service.replaceEditors([{
                            editor: typedEditor,
                            replacement: typedEditorReplacement
                        }], rootGroup);
                    typedInput = rootGroup.activeEditor;
                    assert.ok(typedInput instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedInput.resource.toString(), typedEditorReplacement.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 2);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor.resource.toString(), typedInput.resource.toString());
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // typed editor, options (override disabled), no group
                {
                    let typedEditor = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    let pane = await openEditor({ editor: typedEditor, options: { override: editor_1.EditorResolution.DISABLED } });
                    let typedInput = pane === null || pane === void 0 ? void 0 : pane.input;
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(typedInput instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedInput.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(typedEditor);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group.activeEditor, typedEditor);
                    await resetTestState();
                }
                // typed editor, options (override disabled, sticky: true, preserveFocus: true), no group
                {
                    let typedEditor = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    let pane = await openEditor({ editor: typedEditor, options: { sticky: true, preserveFocus: true, override: editor_1.EditorResolution.DISABLED } });
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // typed editor, options (override default), no group
                {
                    let typedEditor = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    let pane = await openEditor({ editor: typedEditor, options: { override: editor_2.DEFAULT_EDITOR_ASSOCIATION.id } });
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof fileEditorInput_1.FileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // typed editor, options (override: TEST_EDITOR_INPUT_ID), no group
                {
                    let typedEditor = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    let pane = await openEditor({ editor: typedEditor, options: { override: TEST_EDITOR_INPUT_ID } });
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor.resource.toString(), typedEditor.resource.toString());
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // typed editor, options (sticky: true, preserveFocus: true), no group
                {
                    let typedEditor = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    let pane = await openEditor({ editor: typedEditor, options: { sticky: true, preserveFocus: true } });
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual((_d = lastEditorFactoryEditor.options) === null || _d === void 0 ? void 0 : _d.preserveFocus, true);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // typed editor, options (override: TEST_EDITOR_INPUT_ID, sticky: true, preserveFocus: true), no group
                {
                    let typedEditor = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    let pane = await openEditor({ editor: typedEditor, options: { sticky: true, preserveFocus: true, override: TEST_EDITOR_INPUT_ID } });
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual((_e = lastEditorFactoryEditor.options) === null || _e === void 0 ? void 0 : _e.preserveFocus, true);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                    await part.activeGroup.closeEditor(pane.input);
                }
                // typed editor, no options, SIDE_GROUP
                {
                    let typedEditor = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    let pane = await openEditor({ editor: typedEditor }, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok((pane === null || pane === void 0 ? void 0 : pane.input) instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 1);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.strictEqual(lastEditorFactoryEditor.resource.toString(), typedEditor.resource.toString());
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // typed editor, options (override disabled), SIDE_GROUP
                {
                    let typedEditor = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file.editor-service-override-tests'), TEST_EDITOR_INPUT_ID);
                    let pane = await openEditor({ editor: typedEditor, options: { override: editor_1.EditorResolution.DISABLED } }, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok((pane === null || pane === void 0 ? void 0 : pane.input) instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.toString(), typedEditor.resource.toString());
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // Untyped untitled
            {
                // untyped untitled editor, no options, no group
                {
                    let untypedEditor = { resource: undefined, options: { override: TEST_EDITOR_INPUT_ID } };
                    let pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.scheme, 'untitled');
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 1);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped untitled editor, no options, SIDE_GROUP
                {
                    let untypedEditor = { resource: undefined, options: { override: TEST_EDITOR_INPUT_ID } };
                    let pane = await openEditor(untypedEditor, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok((pane === null || pane === void 0 ? void 0 : pane.input) instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.input.resource.scheme, 'untitled');
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 1);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // untyped untitled editor with associated resource, no options, no group
                {
                    let untypedEditor = { resource: uri_1.URI.file('file-original.editor-service-override-tests').with({ scheme: 'untitled' }) };
                    let pane = await openEditor(untypedEditor);
                    let typedEditor = pane === null || pane === void 0 ? void 0 : pane.input;
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(typedEditor instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(typedEditor.resource.scheme, 'untitled');
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 1);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor, untypedEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    // opening the same editor should not create
                    // a new editor input
                    await openEditor(untypedEditor);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group.activeEditor, typedEditor);
                    await resetTestState();
                }
                // untyped untitled editor, options (sticky: true, preserveFocus: true), no group
                {
                    let untypedEditor = { resource: undefined, options: { sticky: true, preserveFocus: true, override: TEST_EDITOR_INPUT_ID } };
                    let pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input.resource.scheme, 'untitled');
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 1);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.strictEqual(lastUntitledEditorFactoryEditor, untypedEditor);
                    assert.strictEqual((_f = lastUntitledEditorFactoryEditor.options) === null || _f === void 0 ? void 0 : _f.preserveFocus, true);
                    assert.strictEqual((_g = lastUntitledEditorFactoryEditor.options) === null || _g === void 0 ? void 0 : _g.sticky, true);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // Untyped diff
            {
                // untyped diff editor, no options, no group
                {
                    let untypedEditor = {
                        original: { resource: uri_1.URI.file('file-original.editor-service-override-tests') },
                        modified: { resource: uri_1.URI.file('file-modified.editor-service-override-tests') },
                        options: { override: TEST_EDITOR_INPUT_ID }
                    };
                    let pane = await openEditor(untypedEditor);
                    let typedEditor = pane === null || pane === void 0 ? void 0 : pane.input;
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(typedEditor instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 1);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.strictEqual(lastDiffEditorFactoryEditor, untypedEditor);
                    await resetTestState();
                }
                // untyped diff editor, no options, SIDE_GROUP
                {
                    let untypedEditor = {
                        original: { resource: uri_1.URI.file('file-original.editor-service-override-tests') },
                        modified: { resource: uri_1.URI.file('file-modified.editor-service-override-tests') },
                        options: { override: TEST_EDITOR_INPUT_ID }
                    };
                    let pane = await openEditor(untypedEditor, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok((pane === null || pane === void 0 ? void 0 : pane.input) instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 1);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.strictEqual(lastDiffEditorFactoryEditor, untypedEditor);
                    await resetTestState();
                }
                // untyped diff editor, options (sticky: true, preserveFocus: true), no group
                {
                    let untypedEditor = {
                        original: { resource: uri_1.URI.file('file-original.editor-service-override-tests') },
                        modified: { resource: uri_1.URI.file('file-modified.editor-service-override-tests') },
                        options: {
                            override: TEST_EDITOR_INPUT_ID, sticky: true, preserveFocus: true
                        }
                    };
                    let pane = await openEditor(untypedEditor);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.group.isSticky(pane.input), true);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 1);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.strictEqual(lastDiffEditorFactoryEditor, untypedEditor);
                    assert.strictEqual((_h = lastDiffEditorFactoryEditor.options) === null || _h === void 0 ? void 0 : _h.preserveFocus, true);
                    assert.strictEqual((_j = lastDiffEditorFactoryEditor.options) === null || _j === void 0 ? void 0 : _j.sticky, true);
                    await resetTestState();
                }
            }
            // typed editor, not registered
            {
                // no options, no group
                {
                    let typedEditor = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file.something'), TEST_EDITOR_INPUT_ID);
                    let pane = await openEditor({ editor: typedEditor });
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input, typedEditor);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // no options, SIDE_GROUP
                {
                    let typedEditor = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file.something'), TEST_EDITOR_INPUT_ID);
                    let pane = await openEditor({ editor: typedEditor }, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok((pane === null || pane === void 0 ? void 0 : pane.input) instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.input, typedEditor);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // typed editor, not supporting `toUntyped`
            {
                // no options, no group
                {
                    let typedEditor = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file.something'), TEST_EDITOR_INPUT_ID);
                    typedEditor.disableToUntyped = true;
                    let pane = await openEditor({ editor: typedEditor });
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok(pane.input instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane.input, typedEditor);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
                // no options, SIDE_GROUP
                {
                    let typedEditor = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file.something'), TEST_EDITOR_INPUT_ID);
                    typedEditor.disableToUntyped = true;
                    let pane = await openEditor({ editor: typedEditor }, editorService_2.SIDE_GROUP);
                    assert.strictEqual(accessor.editorGroupService.groups.length, 2);
                    assert.notStrictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.ok((pane === null || pane === void 0 ? void 0 : pane.input) instanceof workbenchTestServices_1.TestFileEditorInput);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.input, typedEditor);
                    assert.strictEqual(editorFactoryCalled, 0);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(!lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // openEditors with >1 editor
            if (useOpenEditors) {
                // mix of untyped and typed editors
                {
                    let untypedEditor1 = { resource: uri_1.URI.file('file1.editor-service-override-tests') };
                    let untypedEditor2 = { resource: uri_1.URI.file('file2.editor-service-override-tests'), options: { override: editor_1.EditorResolution.DISABLED } };
                    let untypedEditor3 = { editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file3.editor-service-override-tests'), TEST_EDITOR_INPUT_ID) };
                    let untypedEditor4 = { editor: new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('file4.editor-service-override-tests'), TEST_EDITOR_INPUT_ID), options: { override: editor_1.EditorResolution.DISABLED } };
                    let untypedEditor5 = { resource: uri_1.URI.file('file5.editor-service-override-tests') };
                    let pane = (await service.openEditors([untypedEditor1, untypedEditor2, untypedEditor3, untypedEditor4, untypedEditor5]))[0];
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group, rootGroup);
                    assert.strictEqual(pane === null || pane === void 0 ? void 0 : pane.group.count, 5);
                    assert.strictEqual(editorFactoryCalled, 3);
                    assert.strictEqual(untitledEditorFactoryCalled, 0);
                    assert.strictEqual(diffEditorFactoryCalled, 0);
                    assert.ok(lastEditorFactoryEditor);
                    assert.ok(!lastUntitledEditorFactoryEditor);
                    assert.ok(!lastDiffEditorFactoryEditor);
                    await resetTestState();
                }
            }
            // untyped default editor
            {
                // untyped default editor, options: revealIfVisible
                {
                    let untypedEditor1 = { resource: uri_1.URI.file('file-1'), options: { revealIfVisible: true, pinned: true } };
                    let untypedEditor2 = { resource: uri_1.URI.file('file-2'), options: { pinned: true } };
                    let rootPane = await openEditor(untypedEditor1);
                    let sidePane = await openEditor(untypedEditor2, editorService_2.SIDE_GROUP);
                    assert.strictEqual((_k = rootPane === null || rootPane === void 0 ? void 0 : rootPane.group) === null || _k === void 0 ? void 0 : _k.count, 1);
                    assert.strictEqual((_l = sidePane === null || sidePane === void 0 ? void 0 : sidePane.group) === null || _l === void 0 ? void 0 : _l.count, 1);
                    accessor.editorGroupService.activateGroup(sidePane.group);
                    await openEditor(untypedEditor1);
                    assert.strictEqual((_m = rootPane === null || rootPane === void 0 ? void 0 : rootPane.group) === null || _m === void 0 ? void 0 : _m.count, 1);
                    assert.strictEqual((_o = sidePane === null || sidePane === void 0 ? void 0 : sidePane.group) === null || _o === void 0 ? void 0 : _o.count, 1);
                    await resetTestState();
                }
                // untyped default editor, options: revealIfOpened
                {
                    let untypedEditor1 = { resource: uri_1.URI.file('file-1'), options: { revealIfOpened: true, pinned: true } };
                    let untypedEditor2 = { resource: uri_1.URI.file('file-2'), options: { pinned: true } };
                    let rootPane = await openEditor(untypedEditor1);
                    await openEditor(untypedEditor2);
                    assert.strictEqual((_r = (_q = (_p = rootPane === null || rootPane === void 0 ? void 0 : rootPane.group) === null || _p === void 0 ? void 0 : _p.activeEditor) === null || _q === void 0 ? void 0 : _q.resource) === null || _r === void 0 ? void 0 : _r.toString(), untypedEditor2.resource.toString());
                    let sidePane = await openEditor(untypedEditor2, editorService_2.SIDE_GROUP);
                    assert.strictEqual((_s = rootPane === null || rootPane === void 0 ? void 0 : rootPane.group) === null || _s === void 0 ? void 0 : _s.count, 2);
                    assert.strictEqual((_t = sidePane === null || sidePane === void 0 ? void 0 : sidePane.group) === null || _t === void 0 ? void 0 : _t.count, 1);
                    accessor.editorGroupService.activateGroup(sidePane.group);
                    await openEditor(untypedEditor1);
                    assert.strictEqual((_u = rootPane === null || rootPane === void 0 ? void 0 : rootPane.group) === null || _u === void 0 ? void 0 : _u.count, 2);
                    assert.strictEqual((_v = sidePane === null || sidePane === void 0 ? void 0 : sidePane.group) === null || _v === void 0 ? void 0 : _v.count, 1);
                    await resetTestState();
                }
            }
        }
        test('openEditor() applies options if editor already opened', async () => {
            var _a, _b, _c, _d, _e, _f, _g;
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            const [, service, accessor] = await createEditorService();
            disposables.add(accessor.editorResolverService.registerEditor('*.editor-service-override-tests', { id: TEST_EDITOR_INPUT_ID, label: 'Label', priority: editorResolverService_1.RegisteredEditorPriority.exclusive }, {}, editor => ({ editor: new workbenchTestServices_1.TestFileEditorInput(editor.resource, TEST_EDITOR_INPUT_ID) })));
            // Typed editor
            let pane = await service.openEditor(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID));
            pane = await service.openEditor(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID), { sticky: true, preserveFocus: true });
            assert.strictEqual((_a = pane === null || pane === void 0 ? void 0 : pane.options) === null || _a === void 0 ? void 0 : _a.sticky, true);
            assert.strictEqual((_b = pane === null || pane === void 0 ? void 0 : pane.options) === null || _b === void 0 ? void 0 : _b.preserveFocus, true);
            await ((_c = pane.group) === null || _c === void 0 ? void 0 : _c.closeAllEditors());
            // Untyped editor (without registered editor)
            pane = await service.openEditor({ resource: uri_1.URI.file('resource-openEditors') });
            pane = await service.openEditor({ resource: uri_1.URI.file('resource-openEditors'), options: { sticky: true, preserveFocus: true } });
            assert.ok(pane instanceof workbenchTestServices_1.TestTextFileEditor);
            assert.strictEqual((_d = pane === null || pane === void 0 ? void 0 : pane.options) === null || _d === void 0 ? void 0 : _d.sticky, true);
            assert.strictEqual((_e = pane === null || pane === void 0 ? void 0 : pane.options) === null || _e === void 0 ? void 0 : _e.preserveFocus, true);
            // Untyped editor (with registered editor)
            pane = await service.openEditor({ resource: uri_1.URI.file('file.editor-service-override-tests') });
            pane = await service.openEditor({ resource: uri_1.URI.file('file.editor-service-override-tests'), options: { sticky: true, preserveFocus: true } });
            assert.strictEqual((_f = pane === null || pane === void 0 ? void 0 : pane.options) === null || _f === void 0 ? void 0 : _f.sticky, true);
            assert.strictEqual((_g = pane === null || pane === void 0 ? void 0 : pane.options) === null || _g === void 0 ? void 0 : _g.preserveFocus, true);
        });
        test('isOpen() with side by side editor', async () => {
            var _a, _b;
            const [part, service] = await createEditorService();
            const input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput('sideBySide', '', input, otherInput, service);
            const editor1 = await service.openEditor(sideBySideInput, { pinned: true });
            assert.strictEqual(part.activeGroup.count, 1);
            assert.strictEqual(service.isOpened(input), false);
            assert.strictEqual(service.isOpened(otherInput), true);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), false);
            assert.strictEqual(service.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), true);
            const editor2 = await service.openEditor(input, { pinned: true });
            assert.strictEqual(part.activeGroup.count, 2);
            assert.strictEqual(service.isOpened(input), true);
            assert.strictEqual(service.isOpened(otherInput), true);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), true);
            assert.strictEqual(service.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), true);
            await ((_a = editor2 === null || editor2 === void 0 ? void 0 : editor2.group) === null || _a === void 0 ? void 0 : _a.closeEditor(input));
            assert.strictEqual(part.activeGroup.count, 1);
            assert.strictEqual(service.isOpened(input), false);
            assert.strictEqual(service.isOpened(otherInput), true);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), false);
            assert.strictEqual(service.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), true);
            await ((_b = editor1 === null || editor1 === void 0 ? void 0 : editor1.group) === null || _b === void 0 ? void 0 : _b.closeEditor(sideBySideInput));
            assert.strictEqual(service.isOpened(input), false);
            assert.strictEqual(service.isOpened(otherInput), false);
            assert.strictEqual(service.isOpened({ resource: input.resource, typeId: input.typeId, editorId: input.editorId }), false);
            assert.strictEqual(service.isOpened({ resource: otherInput.resource, typeId: otherInput.typeId, editorId: otherInput.editorId }), false);
        });
        test('openEditors() / replaceEditors()', async () => {
            const [part, service] = await createEditorService();
            const input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const replaceInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource3-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: otherInput, options: { override: editor_1.EditorResolution.DISABLED } }]);
            assert.strictEqual(part.activeGroup.count, 2);
            // Replace editors
            await service.replaceEditors([{ editor: input, replacement: replaceInput }], part.activeGroup);
            assert.strictEqual(part.activeGroup.count, 2);
            assert.strictEqual(part.activeGroup.getIndexOfEditor(replaceInput), 0);
        });
        test('openEditors() handles workspace trust (typed editors)', async () => {
            const [part, service, accessor] = await createEditorService();
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource1-openEditors'), TEST_EDITOR_INPUT_ID);
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const input3 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource3-openEditors'), TEST_EDITOR_INPUT_ID);
            const input4 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource4-openEditors'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput('side by side', undefined, input3, input4, service);
            const oldHandler = accessor.workspaceTrustRequestService.requestOpenUrisHandler;
            try {
                // Trust: cancel
                let trustEditorUris = [];
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => {
                    trustEditorUris = uris;
                    return 3 /* WorkspaceTrustUriResponse.Cancel */;
                };
                await service.openEditors([{ editor: input1, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: input2, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: sideBySideInput }], undefined, { validateTrust: true });
                assert.strictEqual(part.activeGroup.count, 0);
                assert.strictEqual(trustEditorUris.length, 4);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input1.resource.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input2.resource.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input3.resource.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input4.resource.toString()), true);
                // Trust: open in new window
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => 2 /* WorkspaceTrustUriResponse.OpenInNewWindow */;
                await service.openEditors([{ editor: input1, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: input2, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: sideBySideInput, options: { override: editor_1.EditorResolution.DISABLED } }], undefined, { validateTrust: true });
                assert.strictEqual(part.activeGroup.count, 0);
                // Trust: allow
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => 1 /* WorkspaceTrustUriResponse.Open */;
                await service.openEditors([{ editor: input1, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: input2, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: sideBySideInput, options: { override: editor_1.EditorResolution.DISABLED } }], undefined, { validateTrust: true });
                assert.strictEqual(part.activeGroup.count, 3);
            }
            finally {
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = oldHandler;
            }
        });
        test('openEditors() ignores trust when `validateTrust: false', async () => {
            const [part, service, accessor] = await createEditorService();
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource1-openEditors'), TEST_EDITOR_INPUT_ID);
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const input3 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource3-openEditors'), TEST_EDITOR_INPUT_ID);
            const input4 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource4-openEditors'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput('side by side', undefined, input3, input4, service);
            const oldHandler = accessor.workspaceTrustRequestService.requestOpenUrisHandler;
            try {
                // Trust: cancel
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => 3 /* WorkspaceTrustUriResponse.Cancel */;
                await service.openEditors([{ editor: input1, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: input2, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: sideBySideInput, options: { override: editor_1.EditorResolution.DISABLED } }]);
                assert.strictEqual(part.activeGroup.count, 3);
            }
            finally {
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = oldHandler;
            }
        });
        test('openEditors() extracts proper resources from untyped editors for workspace trust', async () => {
            const [, service, accessor] = await createEditorService();
            const input = { resource: uri_1.URI.parse('my://resource-openEditors') };
            const otherInput = {
                original: { resource: uri_1.URI.parse('my://resource2-openEditors') },
                modified: { resource: uri_1.URI.parse('my://resource3-openEditors') }
            };
            const oldHandler = accessor.workspaceTrustRequestService.requestOpenUrisHandler;
            try {
                let trustEditorUris = [];
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = async (uris) => {
                    trustEditorUris = uris;
                    return oldHandler(uris);
                };
                await service.openEditors([input, otherInput], undefined, { validateTrust: true });
                assert.strictEqual(trustEditorUris.length, 3);
                assert.strictEqual(trustEditorUris.some(uri => uri.toString() === input.resource.toString()), true);
                assert.strictEqual(trustEditorUris.some(uri => { var _a; return uri.toString() === ((_a = otherInput.original.resource) === null || _a === void 0 ? void 0 : _a.toString()); }), true);
                assert.strictEqual(trustEditorUris.some(uri => { var _a; return uri.toString() === ((_a = otherInput.modified.resource) === null || _a === void 0 ? void 0 : _a.toString()); }), true);
            }
            finally {
                accessor.workspaceTrustRequestService.requestOpenUrisHandler = oldHandler;
            }
        });
        test('close editor does not dispose when editor opened in other group', async () => {
            const [part, service] = await createEditorService();
            const input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-close1'), TEST_EDITOR_INPUT_ID);
            const rootGroup = part.activeGroup;
            const rightGroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            // Open input
            await service.openEditor(input, { pinned: true });
            await service.openEditor(input, { pinned: true }, rightGroup);
            const editors = service.editors;
            assert.strictEqual(editors.length, 2);
            assert.strictEqual(editors[0], input);
            assert.strictEqual(editors[1], input);
            // Close input
            await rootGroup.closeEditor(input);
            assert.strictEqual(input.isDisposed(), false);
            await rightGroup.closeEditor(input);
            assert.strictEqual(input.isDisposed(), true);
        });
        test('open to the side', async () => {
            const [part, service] = await createEditorService();
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource1-openside'), TEST_EDITOR_INPUT_ID);
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-openside'), TEST_EDITOR_INPUT_ID);
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true }, rootGroup);
            let editor = await service.openEditor(input1, { pinned: true, preserveFocus: true }, editorService_2.SIDE_GROUP);
            assert.strictEqual(part.activeGroup, rootGroup);
            assert.strictEqual(part.count, 2);
            assert.strictEqual(editor === null || editor === void 0 ? void 0 : editor.group, part.groups[1]);
            assert.strictEqual(service.isVisible(input1), true);
            assert.strictEqual(service.isOpened(input1), true);
            // Open to the side uses existing neighbour group if any
            editor = await service.openEditor(input2, { pinned: true, preserveFocus: true }, editorService_2.SIDE_GROUP);
            assert.strictEqual(part.activeGroup, rootGroup);
            assert.strictEqual(part.count, 2);
            assert.strictEqual(editor === null || editor === void 0 ? void 0 : editor.group, part.groups[1]);
            assert.strictEqual(service.isVisible(input2), true);
            assert.strictEqual(service.isOpened(input2), true);
        });
        test('editor group activation', async () => {
            const [part, service] = await createEditorService();
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource1-openside'), TEST_EDITOR_INPUT_ID);
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-openside'), TEST_EDITOR_INPUT_ID);
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true }, rootGroup);
            let editor = await service.openEditor(input2, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.ACTIVATE }, editorService_2.SIDE_GROUP);
            const sideGroup = editor === null || editor === void 0 ? void 0 : editor.group;
            assert.strictEqual(part.activeGroup, sideGroup);
            editor = await service.openEditor(input1, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.PRESERVE }, rootGroup);
            assert.strictEqual(part.activeGroup, sideGroup);
            editor = await service.openEditor(input1, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.ACTIVATE }, rootGroup);
            assert.strictEqual(part.activeGroup, rootGroup);
            editor = await service.openEditor(input2, { pinned: true, activation: editor_1.EditorActivation.PRESERVE }, sideGroup);
            assert.strictEqual(part.activeGroup, rootGroup);
            editor = await service.openEditor(input2, { pinned: true, activation: editor_1.EditorActivation.ACTIVATE }, sideGroup);
            assert.strictEqual(part.activeGroup, sideGroup);
            part.arrangeGroups(0 /* GroupsArrangement.MINIMIZE_OTHERS */);
            editor = await service.openEditor(input1, { pinned: true, preserveFocus: true, activation: editor_1.EditorActivation.RESTORE }, rootGroup);
            assert.strictEqual(part.activeGroup, sideGroup);
        });
        test('inactive editor group does not activate when closing editor (#117686)', async () => {
            var _a;
            const [part, service] = await createEditorService();
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource1-openside'), TEST_EDITOR_INPUT_ID);
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-openside'), TEST_EDITOR_INPUT_ID);
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true }, rootGroup);
            await service.openEditor(input2, { pinned: true }, rootGroup);
            const sideGroup = (_a = (await service.openEditor(input2, { pinned: true }, editorService_2.SIDE_GROUP))) === null || _a === void 0 ? void 0 : _a.group;
            assert.strictEqual(part.activeGroup, sideGroup);
            assert.notStrictEqual(rootGroup, sideGroup);
            part.arrangeGroups(0 /* GroupsArrangement.MINIMIZE_OTHERS */, part.activeGroup);
            await rootGroup.closeEditor(input2);
            assert.strictEqual(part.activeGroup, sideGroup);
            assert.strictEqual(rootGroup.isMinimized, true);
            assert.strictEqual(part.activeGroup.isMinimized, false);
        });
        test('active editor change / visible editor change events', async function () {
            const [part, service] = await createEditorService();
            let input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            let otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            let activeEditorChangeEventFired = false;
            const activeEditorChangeListener = service.onDidActiveEditorChange(() => {
                activeEditorChangeEventFired = true;
            });
            let visibleEditorChangeEventFired = false;
            const visibleEditorChangeListener = service.onDidVisibleEditorsChange(() => {
                visibleEditorChangeEventFired = true;
            });
            function assertActiveEditorChangedEvent(expected) {
                assert.strictEqual(activeEditorChangeEventFired, expected, `Unexpected active editor change state (got ${activeEditorChangeEventFired}, expected ${expected})`);
                activeEditorChangeEventFired = false;
            }
            function assertVisibleEditorsChangedEvent(expected) {
                assert.strictEqual(visibleEditorChangeEventFired, expected, `Unexpected visible editors change state (got ${visibleEditorChangeEventFired}, expected ${expected})`);
                visibleEditorChangeEventFired = false;
            }
            async function closeEditorAndWaitForNextToOpen(group, input) {
                await group.closeEditor(input);
                await (0, async_1.timeout)(0); // closing an editor will not immediately open the next one, so we need to wait
            }
            // 1.) open, open same, open other, close
            let editor = await service.openEditor(input, { pinned: true });
            const group = editor === null || editor === void 0 ? void 0 : editor.group;
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(input);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            editor = await service.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(group, otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(group, input);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 2.) open, open same (forced open) (recreate inputs that got disposed)
            input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(input, { forceReload: true });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await closeEditorAndWaitForNextToOpen(group, input);
            // 3.) open, open inactive, close (recreate inputs that got disposed)
            input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(otherInput, { inactive: true });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 4.) open, open inactive, close inactive (recreate inputs that got disposed)
            input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(otherInput, { inactive: true });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await closeEditorAndWaitForNextToOpen(group, otherInput);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 5.) add group, remove group (recreate inputs that got disposed)
            input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            let rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            rightGroup.focus();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(false);
            part.removeGroup(rightGroup);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 6.) open editor in inactive group (recreate inputs that got disposed)
            input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await rightGroup.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(rightGroup, otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 7.) activate group (recreate inputs that got disposed)
            input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await rightGroup.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            group.focus();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(false);
            await closeEditorAndWaitForNextToOpen(rightGroup, otherInput);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(true);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 8.) move editor (recreate inputs that got disposed)
            input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            editor = await service.openEditor(otherInput, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            group.moveEditor(otherInput, group, { index: 0 });
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await group.closeAllEditors();
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            // 9.) close editor in inactive group (recreate inputs that got disposed)
            input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            editor = await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(false);
            await rightGroup.openEditor(otherInput);
            assertActiveEditorChangedEvent(true);
            assertVisibleEditorsChangedEvent(true);
            await closeEditorAndWaitForNextToOpen(group, input);
            assertActiveEditorChangedEvent(false);
            assertVisibleEditorsChangedEvent(true);
            // cleanup
            activeEditorChangeListener.dispose();
            visibleEditorChangeListener.dispose();
        });
        test('editors change event', async function () {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            let input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            let otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            let editorsChangeEventCounter = 0;
            async function assertEditorsChangeEvent(fn, expected) {
                const p = event_1.Event.toPromise(service.onDidEditorsChange);
                await fn();
                await p;
                editorsChangeEventCounter++;
                assert.strictEqual(editorsChangeEventCounter, expected);
            }
            // open
            await assertEditorsChangeEvent(() => service.openEditor(input, { pinned: true }), 1);
            // open (other)
            await assertEditorsChangeEvent(() => service.openEditor(otherInput, { pinned: true }), 2);
            // close (inactive)
            await assertEditorsChangeEvent(() => rootGroup.closeEditor(input), 3);
            // close (active)
            await assertEditorsChangeEvent(() => rootGroup.closeEditor(otherInput), 4);
            input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-active'), TEST_EDITOR_INPUT_ID);
            // open editors
            await assertEditorsChangeEvent(() => service.openEditors([{ editor: input, options: { pinned: true } }, { editor: otherInput, options: { pinned: true } }]), 5);
            // active editor change
            await assertEditorsChangeEvent(() => service.openEditor(otherInput), 6);
            // move editor (in group)
            await assertEditorsChangeEvent(() => service.openEditor(input, { pinned: true, index: 1 }), 7);
            const rightGroup = part.addGroup(part.activeGroup, 3 /* GroupDirection.RIGHT */);
            await assertEditorsChangeEvent(async () => rootGroup.moveEditor(input, rightGroup), 8);
            // move group
            await assertEditorsChangeEvent(async () => part.moveGroup(rightGroup, rootGroup, 2 /* GroupDirection.LEFT */), 9);
        });
        test('two active editor change events when opening editor to the side', async function () {
            const [, service] = await createEditorService();
            let input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            let activeEditorChangeEvents = 0;
            const activeEditorChangeListener = service.onDidActiveEditorChange(() => {
                activeEditorChangeEvents++;
            });
            function assertActiveEditorChangedEvent(expected) {
                assert.strictEqual(activeEditorChangeEvents, expected, `Unexpected active editor change state (got ${activeEditorChangeEvents}, expected ${expected})`);
                activeEditorChangeEvents = 0;
            }
            await service.openEditor(input, { pinned: true });
            assertActiveEditorChangedEvent(1);
            await service.openEditor(input, { pinned: true }, editorService_2.SIDE_GROUP);
            // we expect 2 active editor change events: one for the fact that the
            // active editor is now in the side group but also one for when the
            // editor has finished loading. we used to ignore that second change
            // event, however many listeners are interested on the active editor
            // when it has fully loaded (e.g. a model is set). as such, we cannot
            // simply ignore that second event from the editor service, even though
            // the actual editor input is the same
            assertActiveEditorChangedEvent(2);
            // cleanup
            activeEditorChangeListener.dispose();
        });
        test('activeTextEditorControl / activeTextEditorMode', async () => {
            const [, service] = await createEditorService();
            // Open untitled input
            let editor = await service.openEditor({ resource: undefined });
            assert.strictEqual(service.activeEditorPane, editor);
            assert.strictEqual(service.activeTextEditorControl, editor === null || editor === void 0 ? void 0 : editor.getControl());
            assert.strictEqual(service.activeTextEditorLanguageId, modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
        });
        test('openEditor returns undefined when inactive', async function () {
            const [, service] = await createEditorService();
            const input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            const otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-inactive'), TEST_EDITOR_INPUT_ID);
            let editor = await service.openEditor(input, { pinned: true });
            assert.ok(editor);
            let otherEditor = await service.openEditor(otherInput, { inactive: true });
            assert.ok(!otherEditor);
        });
        test('openEditor shows placeholder when opening fails', async function () {
            const [, service] = await createEditorService();
            const failingInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-failing'), TEST_EDITOR_INPUT_ID);
            failingInput.setFailToOpen();
            let failingEditor = await service.openEditor(failingInput);
            assert.ok(failingEditor instanceof editorPlaceholder_1.ErrorPlaceholderEditor);
        });
        test('openEditor shows placeholder when restoring fails', async function () {
            const [, service] = await createEditorService();
            const input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-active'), TEST_EDITOR_INPUT_ID);
            const failingInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-failing'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input, { pinned: true });
            await service.openEditor(failingInput, { inactive: true });
            failingInput.setFailToOpen();
            let failingEditor = await service.openEditor(failingInput);
            assert.ok(failingEditor instanceof editorPlaceholder_1.ErrorPlaceholderEditor);
        });
        test('save, saveAll, revertAll', async function () {
            const [part, service] = await createEditorService();
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = true;
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            input2.dirty = true;
            const sameInput1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            sameInput1.dirty = true;
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true });
            await service.openEditor(input2, { pinned: true });
            await service.openEditor(sameInput1, { pinned: true }, editorService_2.SIDE_GROUP);
            await service.save({ groupId: rootGroup.id, editor: input1 });
            assert.strictEqual(input1.gotSaved, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            await service.save({ groupId: rootGroup.id, editor: input1 }, { saveAs: true });
            assert.strictEqual(input1.gotSavedAs, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            const revertRes = await service.revertAll();
            assert.strictEqual(revertRes, true);
            assert.strictEqual(input1.gotReverted, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            const saveRes = await service.saveAll();
            assert.strictEqual(saveRes, true);
            assert.strictEqual(input1.gotSaved, true);
            assert.strictEqual(input2.gotSaved, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            input2.gotSaved = false;
            input2.gotSavedAs = false;
            input2.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            await service.saveAll({ saveAs: true });
            assert.strictEqual(input1.gotSavedAs, true);
            assert.strictEqual(input2.gotSavedAs, true);
            // services dedupes inputs automatically
            assert.strictEqual(sameInput1.gotSaved, false);
            assert.strictEqual(sameInput1.gotSavedAs, false);
            assert.strictEqual(sameInput1.gotReverted, false);
        });
        test('saveAll, revertAll (sticky editor)', async function () {
            const [, service] = await createEditorService();
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = true;
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            input2.dirty = true;
            const sameInput1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            sameInput1.dirty = true;
            await service.openEditor(input1, { pinned: true, sticky: true });
            await service.openEditor(input2, { pinned: true });
            await service.openEditor(sameInput1, { pinned: true }, editorService_2.SIDE_GROUP);
            const revertRes = await service.revertAll({ excludeSticky: true });
            assert.strictEqual(revertRes, true);
            assert.strictEqual(input1.gotReverted, false);
            assert.strictEqual(sameInput1.gotReverted, true);
            input1.gotSaved = false;
            input1.gotSavedAs = false;
            input1.gotReverted = false;
            sameInput1.gotSaved = false;
            sameInput1.gotSavedAs = false;
            sameInput1.gotReverted = false;
            input1.dirty = true;
            input2.dirty = true;
            sameInput1.dirty = true;
            const saveRes = await service.saveAll({ excludeSticky: true });
            assert.strictEqual(saveRes, true);
            assert.strictEqual(input1.gotSaved, false);
            assert.strictEqual(input2.gotSaved, true);
            assert.strictEqual(sameInput1.gotSaved, true);
        });
        test('file delete closes editor', async function () {
            return testFileDeleteEditorClose(false);
        });
        test('file delete leaves dirty editors open', function () {
            return testFileDeleteEditorClose(true);
        });
        async function testFileDeleteEditorClose(dirty) {
            const [part, service, accessor] = await createEditorService();
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            input1.dirty = dirty;
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            input2.dirty = dirty;
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true });
            await service.openEditor(input2, { pinned: true });
            assert.strictEqual(rootGroup.activeEditor, input2);
            const activeEditorChangePromise = awaitActiveEditorChange(service);
            accessor.fileService.fireAfterOperation(new files_1.FileOperationEvent(input2.resource, 1 /* FileOperation.DELETE */));
            if (!dirty) {
                await activeEditorChangePromise;
            }
            if (dirty) {
                assert.strictEqual(rootGroup.activeEditor, input2);
            }
            else {
                assert.strictEqual(rootGroup.activeEditor, input1);
            }
        }
        test('file move asks input to move', async function () {
            const [part, service, accessor] = await createEditorService();
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource1'), TEST_EDITOR_INPUT_ID);
            const movedInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2'), TEST_EDITOR_INPUT_ID);
            input1.movedEditor = { editor: movedInput };
            const rootGroup = part.activeGroup;
            await service.openEditor(input1, { pinned: true });
            const activeEditorChangePromise = awaitActiveEditorChange(service);
            accessor.fileService.fireAfterOperation(new files_1.FileOperationEvent(input1.resource, 2 /* FileOperation.MOVE */, {
                resource: movedInput.resource,
                ctime: 0,
                etag: '',
                isDirectory: false,
                isFile: true,
                mtime: 0,
                name: 'resource2',
                size: 0,
                isSymbolicLink: false,
                readonly: false,
                children: undefined
            }));
            await activeEditorChangePromise;
            assert.strictEqual(rootGroup.activeEditor, movedInput);
        });
        function awaitActiveEditorChange(editorService) {
            return event_1.Event.toPromise(event_1.Event.once(editorService.onDidActiveEditorChange));
        }
        test('file watcher gets installed for out of workspace files', async function () {
            var _a;
            const [, service, accessor] = await createEditorService();
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('file://resource1'), TEST_EDITOR_INPUT_ID);
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('file://resource2'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input1, { pinned: true });
            assert.strictEqual(accessor.fileService.watches.length, 1);
            assert.strictEqual(accessor.fileService.watches[0].toString(), input1.resource.toString());
            const editor = await service.openEditor(input2, { pinned: true });
            assert.strictEqual(accessor.fileService.watches.length, 1);
            assert.strictEqual(accessor.fileService.watches[0].toString(), input2.resource.toString());
            await ((_a = editor === null || editor === void 0 ? void 0 : editor.group) === null || _a === void 0 ? void 0 : _a.closeAllEditors());
            assert.strictEqual(accessor.fileService.watches.length, 0);
        });
        test('activeEditorPane scopedContextKeyService', async function () {
            var _a, _b;
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({ contextKeyService: instantiationService => instantiationService.createInstance(mockKeybindingService_1.MockScopableContextKeyService) }, disposables);
            const [part, service] = await createEditorService(instantiationService);
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('file://resource1'), TEST_EDITOR_INPUT_ID);
            new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('file://resource2'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input1, { pinned: true });
            const editorContextKeyService = (_a = service.activeEditorPane) === null || _a === void 0 ? void 0 : _a.scopedContextKeyService;
            assert.ok(!!editorContextKeyService);
            assert.strictEqual(editorContextKeyService, (_b = part.activeGroup.activeEditorPane) === null || _b === void 0 ? void 0 : _b.scopedContextKeyService);
        });
        test('editorResolverService - openEditor', async function () {
            const [, service, accessor] = await createEditorService();
            const editorResolverService = accessor.editorResolverService;
            const textEditorService = accessor.textEditorService;
            let editorCount = 0;
            const registrationDisposable = editorResolverService.registerEditor('*.md', {
                id: 'TestEditor',
                label: 'Test Editor',
                detail: 'Test Editor Provider',
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, (editorInput) => {
                editorCount++;
                return ({ editor: textEditorService.createTextEditor(editorInput) });
            }, undefined, diffEditor => ({ editor: textEditorService.createTextEditor(diffEditor) }));
            assert.strictEqual(editorCount, 0);
            const input1 = { resource: uri_1.URI.parse('file://test/path/resource1.txt') };
            const input2 = { resource: uri_1.URI.parse('file://test/path/resource1.md') };
            // Open editor input 1 and it shouln't trigger override as the glob doesn't match
            await service.openEditor(input1);
            assert.strictEqual(editorCount, 0);
            // Open editor input 2 and it should trigger override as the glob doesn match
            await service.openEditor(input2);
            assert.strictEqual(editorCount, 1);
            // Because we specify an override we shouldn't see it triggered even if it matches
            await service.openEditor(Object.assign(Object.assign({}, input2), { options: { override: 'default' } }));
            assert.strictEqual(editorCount, 1);
            registrationDisposable.dispose();
        });
        test('editorResolverService - openEditors', async function () {
            const [, service, accessor] = await createEditorService();
            const editorResolverService = accessor.editorResolverService;
            const textEditorService = accessor.textEditorService;
            let editorCount = 0;
            const registrationDisposable = editorResolverService.registerEditor('*.md', {
                id: 'TestEditor',
                label: 'Test Editor',
                detail: 'Test Editor Provider',
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, (editorInput) => {
                editorCount++;
                return ({ editor: textEditorService.createTextEditor(editorInput) });
            }, undefined, diffEditor => ({ editor: textEditorService.createTextEditor(diffEditor) }));
            assert.strictEqual(editorCount, 0);
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('file://test/path/resource1.txt'), TEST_EDITOR_INPUT_ID);
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('file://test/path/resource2.txt'), TEST_EDITOR_INPUT_ID);
            const input3 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('file://test/path/resource3.md'), TEST_EDITOR_INPUT_ID);
            const input4 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('file://test/path/resource4.md'), TEST_EDITOR_INPUT_ID);
            // Open editor input 1 and it shouln't trigger override as the glob doesn't match
            await service.openEditors([{ editor: input1 }, { editor: input2 }, { editor: input3 }, { editor: input4 }]);
            assert.strictEqual(editorCount, 2);
            registrationDisposable.dispose();
        });
        test('editorResolverService - replaceEditors', async function () {
            const [part, service, accessor] = await createEditorService();
            const editorResolverService = accessor.editorResolverService;
            const textEditorService = accessor.textEditorService;
            let editorCount = 0;
            const registrationDisposable = editorResolverService.registerEditor('*.md', {
                id: 'TestEditor',
                label: 'Test Editor',
                detail: 'Test Editor Provider',
                priority: editorResolverService_1.RegisteredEditorPriority.builtin
            }, {}, (editorInput) => {
                editorCount++;
                return ({ editor: textEditorService.createTextEditor(editorInput) });
            }, undefined, diffEditor => ({ editor: textEditorService.createTextEditor(diffEditor) }));
            assert.strictEqual(editorCount, 0);
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('file://test/path/resource2.md'), TEST_EDITOR_INPUT_ID);
            // Open editor input 1 and it shouldn't trigger because I've disabled the override logic
            await service.openEditor(input1, { override: editor_1.EditorResolution.DISABLED });
            assert.strictEqual(editorCount, 0);
            await service.replaceEditors([{
                    editor: input1,
                    replacement: input1,
                }], part.activeGroup);
            assert.strictEqual(editorCount, 1);
            registrationDisposable.dispose();
        });
        test('closeEditor', async () => {
            const [part, service] = await createEditorService();
            const input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: otherInput, options: { override: editor_1.EditorResolution.DISABLED } }]);
            assert.strictEqual(part.activeGroup.count, 2);
            // Close editor
            await service.closeEditor({ editor: input, groupId: part.activeGroup.id });
            assert.strictEqual(part.activeGroup.count, 1);
            await service.closeEditor({ editor: input, groupId: part.activeGroup.id });
            assert.strictEqual(part.activeGroup.count, 1);
            await service.closeEditor({ editor: otherInput, groupId: part.activeGroup.id });
            assert.strictEqual(part.activeGroup.count, 0);
            await service.closeEditor({ editor: otherInput, groupId: 999 });
            assert.strictEqual(part.activeGroup.count, 0);
        });
        test('closeEditors', async () => {
            const [part, service] = await createEditorService();
            const input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: otherInput, options: { override: editor_1.EditorResolution.DISABLED } }]);
            assert.strictEqual(part.activeGroup.count, 2);
            // Close editors
            await service.closeEditors([{ editor: input, groupId: part.activeGroup.id }, { editor: otherInput, groupId: part.activeGroup.id }]);
            assert.strictEqual(part.activeGroup.count, 0);
        });
        test('findEditors (in group)', async () => {
            const [part, service] = await createEditorService();
            const input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: otherInput, options: { override: editor_1.EditorResolution.DISABLED } }]);
            assert.strictEqual(part.activeGroup.count, 2);
            // Try using find editors for opened editors
            {
                const found1 = service.findEditors(input.resource, undefined, part.activeGroup);
                assert.strictEqual(found1.length, 1);
                assert.strictEqual(found1[0], input);
                const found2 = service.findEditors(input, undefined, part.activeGroup);
                assert.strictEqual(found2, input);
            }
            {
                const found1 = service.findEditors(otherInput.resource, undefined, part.activeGroup);
                assert.strictEqual(found1.length, 1);
                assert.strictEqual(found1[0], otherInput);
                const found2 = service.findEditors(otherInput, undefined, part.activeGroup);
                assert.strictEqual(found2, otherInput);
            }
            // Make sure we don't find non-opened editors
            {
                const found1 = service.findEditors(uri_1.URI.parse('my://no-such-resource'), undefined, part.activeGroup);
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors({ resource: uri_1.URI.parse('my://no-such-resource'), typeId: '', editorId: TEST_EDITOR_INPUT_ID }, undefined, part.activeGroup);
                assert.strictEqual(found2, undefined);
            }
            // Make sure we don't find editors across groups
            {
                const newEditor = await service.openEditor(new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://other-group-resource'), TEST_EDITOR_INPUT_ID), { pinned: true, preserveFocus: true }, editorService_2.SIDE_GROUP);
                const found1 = service.findEditors(input.resource, undefined, newEditor.group.id);
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors(input, undefined, newEditor.group.id);
                assert.strictEqual(found2, undefined);
            }
            // Check we don't find editors after closing them
            await part.activeGroup.closeAllEditors();
            {
                const found1 = service.findEditors(input.resource, undefined, part.activeGroup);
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors(input, undefined, part.activeGroup);
                assert.strictEqual(found2, undefined);
            }
        });
        test('findEditors (across groups)', async () => {
            var _a, _b, _c;
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            const input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            // Open editors
            await service.openEditors([{ editor: input, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: otherInput, options: { override: editor_1.EditorResolution.DISABLED } }]);
            const sideEditor = await service.openEditor(input, { pinned: true }, editorService_2.SIDE_GROUP);
            // Try using find editors for opened editors
            {
                const found1 = service.findEditors(input.resource);
                assert.strictEqual(found1.length, 2);
                assert.strictEqual(found1[0].editor, input);
                assert.strictEqual(found1[0].groupId, (_a = sideEditor === null || sideEditor === void 0 ? void 0 : sideEditor.group) === null || _a === void 0 ? void 0 : _a.id);
                assert.strictEqual(found1[1].editor, input);
                assert.strictEqual(found1[1].groupId, rootGroup.id);
                const found2 = service.findEditors(input);
                assert.strictEqual(found2.length, 2);
                assert.strictEqual(found2[0].editor, input);
                assert.strictEqual(found2[0].groupId, (_b = sideEditor === null || sideEditor === void 0 ? void 0 : sideEditor.group) === null || _b === void 0 ? void 0 : _b.id);
                assert.strictEqual(found2[1].editor, input);
                assert.strictEqual(found2[1].groupId, rootGroup.id);
            }
            {
                const found1 = service.findEditors(otherInput.resource);
                assert.strictEqual(found1.length, 1);
                assert.strictEqual(found1[0].editor, otherInput);
                assert.strictEqual(found1[0].groupId, rootGroup.id);
                const found2 = service.findEditors(otherInput);
                assert.strictEqual(found2.length, 1);
                assert.strictEqual(found2[0].editor, otherInput);
                assert.strictEqual(found2[0].groupId, rootGroup.id);
            }
            // Make sure we don't find non-opened editors
            {
                const found1 = service.findEditors(uri_1.URI.parse('my://no-such-resource'));
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors({ resource: uri_1.URI.parse('my://no-such-resource'), typeId: '', editorId: TEST_EDITOR_INPUT_ID });
                assert.strictEqual(found2.length, 0);
            }
            // Check we don't find editors after closing them
            await rootGroup.closeAllEditors();
            await ((_c = sideEditor === null || sideEditor === void 0 ? void 0 : sideEditor.group) === null || _c === void 0 ? void 0 : _c.closeAllEditors());
            {
                const found1 = service.findEditors(input.resource);
                assert.strictEqual(found1.length, 0);
                const found2 = service.findEditors(input);
                assert.strictEqual(found2.length, 0);
            }
        });
        test('findEditors (support side by side via options)', async () => {
            const [, service] = await createEditorService();
            const secondaryInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-findEditors-secondary'), TEST_EDITOR_INPUT_ID);
            const primaryInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-findEditors-primary'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput(undefined, undefined, secondaryInput, primaryInput, service);
            await service.openEditor(sideBySideInput, { pinned: true });
            let foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-primary'));
            assert.strictEqual(foundEditors.length, 0);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-primary'), { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            assert.strictEqual(foundEditors.length, 1);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-secondary'), { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            assert.strictEqual(foundEditors.length, 0);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-primary'), { supportSideBySide: editor_2.SideBySideEditor.SECONDARY });
            assert.strictEqual(foundEditors.length, 0);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-secondary'), { supportSideBySide: editor_2.SideBySideEditor.SECONDARY });
            assert.strictEqual(foundEditors.length, 1);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-primary'), { supportSideBySide: editor_2.SideBySideEditor.ANY });
            assert.strictEqual(foundEditors.length, 1);
            foundEditors = service.findEditors(uri_1.URI.parse('my://resource-findEditors-secondary'), { supportSideBySide: editor_2.SideBySideEditor.ANY });
            assert.strictEqual(foundEditors.length, 1);
        });
        test('side by side editor is not matching all other editors (https://github.com/microsoft/vscode/issues/132859)', async () => {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            const input = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-openEditors'), TEST_EDITOR_INPUT_ID);
            const otherInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource2-openEditors'), TEST_EDITOR_INPUT_ID);
            const sideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput(undefined, undefined, input, input, service);
            const otherSideBySideInput = new sideBySideEditorInput_1.SideBySideEditorInput(undefined, undefined, otherInput, otherInput, service);
            await service.openEditor(sideBySideInput, undefined, editorService_2.SIDE_GROUP);
            part.activateGroup(rootGroup);
            await service.openEditor(otherSideBySideInput, { revealIfOpened: true, revealIfVisible: true });
            assert.strictEqual(rootGroup.count, 1);
        });
        test('onDidCloseEditor indicates proper context when moving editor across groups', async () => {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-onDidCloseEditor1'), TEST_EDITOR_INPUT_ID);
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-onDidCloseEditor2'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input1, { pinned: true });
            await service.openEditor(input2, { pinned: true });
            const sidegroup = part.addGroup(rootGroup, 3 /* GroupDirection.RIGHT */);
            const events = [];
            service.onDidCloseEditor(e => {
                events.push(e);
            });
            rootGroup.moveEditor(input1, sidegroup);
            assert.strictEqual(events[0].context, editor_2.EditorCloseContext.MOVE);
            await sidegroup.closeEditor(input1);
            assert.strictEqual(events[1].context, editor_2.EditorCloseContext.UNKNOWN);
        });
        test('onDidCloseEditor indicates proper context when replacing an editor', async () => {
            const [part, service] = await createEditorService();
            const rootGroup = part.activeGroup;
            const input1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-onDidCloseEditor1'), TEST_EDITOR_INPUT_ID);
            const input2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.parse('my://resource-onDidCloseEditor2'), TEST_EDITOR_INPUT_ID);
            await service.openEditor(input1, { pinned: true });
            const events = [];
            service.onDidCloseEditor(e => {
                events.push(e);
            });
            await rootGroup.replaceEditors([{ editor: input1, replacement: input2 }]);
            assert.strictEqual(events[0].context, editor_2.EditorCloseContext.REPLACE);
        });
    });
});
//# sourceMappingURL=editorService.test.js.map