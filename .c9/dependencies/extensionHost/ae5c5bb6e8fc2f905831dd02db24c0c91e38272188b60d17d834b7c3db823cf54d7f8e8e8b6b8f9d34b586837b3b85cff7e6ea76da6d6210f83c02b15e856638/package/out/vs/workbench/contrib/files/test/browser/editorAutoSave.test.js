/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/test/common/utils", "vs/workbench/services/editor/common/editorService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/lifecycle", "vs/workbench/services/editor/browser/editorService", "vs/workbench/browser/parts/editor/editorAutoSave", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/workbench/common/editor", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, event_1, utils_1, editorService_1, workbenchTestServices_1, editorGroupsService_1, lifecycle_1, editorService_2, editorAutoSave_1, configuration_1, testConfigurationService_1, filesConfigurationService_1, mockKeybindingService_1, editor_1, testWorkspace_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorAutoSave', () => {
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
        });
        teardown(() => {
            disposables.clear();
        });
        async function createEditorAutoSave(autoSaveConfig) {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            configurationService.setUserConfiguration('files', autoSaveConfig);
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(filesConfigurationService_1.IFilesConfigurationService, new workbenchTestServices_1.TestFilesConfigurationService(instantiationService.createInstance(mockKeybindingService_1.MockContextKeyService), configurationService, new workbenchTestServices_2.TestContextService(testWorkspace_1.TestWorkspace)));
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = instantiationService.createInstance(editorService_2.EditorService);
            instantiationService.stub(editorService_1.IEditorService, editorService);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            disposables.add(accessor.textFileService.files);
            disposables.add(instantiationService.createInstance(editorAutoSave_1.EditorAutoSave));
            return accessor;
        }
        test('editor auto saves after short delay if configured', async function () {
            const accessor = await createEditorAutoSave({ autoSave: 'afterDelay', autoSaveDelay: 1 });
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const model = await accessor.textFileService.files.resolve(resource);
            model.textEditorModel.setValue('Super Good');
            assert.ok(model.isDirty());
            await awaitModelSaved(model);
            assert.ok(!model.isDirty());
        });
        test('editor auto saves on focus change if configured', async function () {
            const accessor = await createEditorAutoSave({ autoSave: 'onFocusChange' });
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor({ resource, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } });
            const model = await accessor.textFileService.files.resolve(resource);
            model.textEditorModel.setValue('Super Good');
            assert.ok(model.isDirty());
            await accessor.editorService.openEditor({ resource: utils_1.toResource.call(this, '/path/index_other.txt') });
            await awaitModelSaved(model);
            assert.ok(!model.isDirty());
        });
        function awaitModelSaved(model) {
            return event_1.Event.toPromise(event_1.Event.once(model.onDidChangeDirty));
        }
    });
});
//# sourceMappingURL=editorAutoSave.test.js.map