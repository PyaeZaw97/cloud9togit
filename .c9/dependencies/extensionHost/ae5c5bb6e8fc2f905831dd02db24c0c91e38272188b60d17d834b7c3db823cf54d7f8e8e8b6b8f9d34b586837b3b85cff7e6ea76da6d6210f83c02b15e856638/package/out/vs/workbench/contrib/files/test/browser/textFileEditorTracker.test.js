/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/workbench/contrib/files/browser/editors/textFileEditorTracker", "vs/base/test/common/utils", "vs/workbench/services/editor/common/editorService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/async", "vs/base/common/lifecycle", "vs/workbench/services/editor/browser/editorService", "vs/base/common/resources", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/workbench/contrib/files/common/files", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/workspaces/test/common/testWorkspaceTrustService", "vs/workbench/common/editor", "vs/platform/workspace/test/common/testWorkspace", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, event_1, textFileEditorTracker_1, utils_1, editorService_1, workbenchTestServices_1, textfiles_1, files_1, editorGroupsService_1, async_1, lifecycle_1, editorService_2, resources_1, testConfigurationService_1, configuration_1, filesConfigurationService_1, mockKeybindingService_1, files_2, workspaceTrust_1, testWorkspaceTrustService_1, editor_1, testWorkspace_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - TextFileEditorTracker', () => {
        const disposables = new lifecycle_1.DisposableStore();
        class TestTextFileEditorTracker extends textFileEditorTracker_1.TextFileEditorTracker {
            getDirtyTextFileTrackerDelay() {
                return 5; // encapsulated in a method for tests to override
            }
        }
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
        });
        teardown(() => {
            disposables.clear();
        });
        async function createTracker(autoSaveEnabled = false) {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            if (autoSaveEnabled) {
                const configurationService = new testConfigurationService_1.TestConfigurationService();
                configurationService.setUserConfiguration('files', { autoSave: 'afterDelay', autoSaveDelay: 1 });
                instantiationService.stub(configuration_1.IConfigurationService, configurationService);
                instantiationService.stub(filesConfigurationService_1.IFilesConfigurationService, new workbenchTestServices_1.TestFilesConfigurationService(instantiationService.createInstance(mockKeybindingService_1.MockContextKeyService), configurationService, new workbenchTestServices_2.TestContextService(testWorkspace_1.TestWorkspace)));
            }
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustRequestService, new testWorkspaceTrustService_1.TestWorkspaceTrustRequestService(false));
            const editorService = instantiationService.createInstance(editorService_2.EditorService);
            instantiationService.stub(editorService_1.IEditorService, editorService);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            disposables.add(accessor.textFileService.files);
            disposables.add(instantiationService.createInstance(TestTextFileEditorTracker));
            return accessor;
        }
        test('file change event updates model', async function () {
            const accessor = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            const model = await accessor.textFileService.files.resolve(resource);
            model.textEditorModel.setValue('Super Good');
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), 'Super Good');
            await model.save();
            // change event (watcher)
            accessor.fileService.fireFileChanges(new files_1.FileChangesEvent([{ resource, type: 0 /* FileChangeType.UPDATED */ }], false));
            await (0, async_1.timeout)(0); // due to event updating model async
            assert.strictEqual((0, textfiles_1.snapshotToString)(model.createSnapshot()), 'Hello Html');
        });
        test('dirty text file model opens as editor', async function () {
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await testDirtyTextFileModelOpensEditorDependingOnAutoSaveSetting(resource, false, false);
        });
        test('dirty text file model does not open as editor if autosave is ON', async function () {
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await testDirtyTextFileModelOpensEditorDependingOnAutoSaveSetting(resource, true, false);
        });
        test('dirty text file model opens as editor when save fails', async function () {
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await testDirtyTextFileModelOpensEditorDependingOnAutoSaveSetting(resource, false, true);
        });
        test('dirty text file model opens as editor when save fails if autosave is ON', async function () {
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await testDirtyTextFileModelOpensEditorDependingOnAutoSaveSetting(resource, true, true);
        });
        async function testDirtyTextFileModelOpensEditorDependingOnAutoSaveSetting(resource, autoSave, error) {
            const accessor = await createTracker(autoSave);
            assert.ok(!accessor.editorService.isOpened({ resource, typeId: files_2.FILE_EDITOR_INPUT_ID, editorId: editor_1.DEFAULT_EDITOR_ASSOCIATION.id }));
            if (error) {
                accessor.textFileService.setWriteErrorOnce(new files_1.FileOperationError('fail to write', 11 /* FileOperationResult.FILE_OTHER_ERROR */));
            }
            const model = await accessor.textFileService.files.resolve(resource);
            model.textEditorModel.setValue('Super Good');
            if (autoSave) {
                await model.save();
                await (0, async_1.timeout)(10);
                if (error) {
                    assert.ok(accessor.editorService.isOpened({ resource, typeId: files_2.FILE_EDITOR_INPUT_ID, editorId: editor_1.DEFAULT_EDITOR_ASSOCIATION.id }));
                }
                else {
                    assert.ok(!accessor.editorService.isOpened({ resource, typeId: files_2.FILE_EDITOR_INPUT_ID, editorId: editor_1.DEFAULT_EDITOR_ASSOCIATION.id }));
                }
            }
            else {
                await awaitEditorOpening(accessor.editorService);
                assert.ok(accessor.editorService.isOpened({ resource, typeId: files_2.FILE_EDITOR_INPUT_ID, editorId: editor_1.DEFAULT_EDITOR_ASSOCIATION.id }));
            }
        }
        test('dirty untitled text file model opens as editor', async function () {
            var _a;
            const accessor = await createTracker();
            const untitledTextEditor = accessor.textEditorService.createTextEditor({ resource: undefined, forceUntitled: true });
            const model = disposables.add(await untitledTextEditor.resolve());
            assert.ok(!accessor.editorService.isOpened(untitledTextEditor));
            (_a = model.textEditorModel) === null || _a === void 0 ? void 0 : _a.setValue('Super Good');
            await awaitEditorOpening(accessor.editorService);
            assert.ok(accessor.editorService.isOpened(untitledTextEditor));
        });
        function awaitEditorOpening(editorService) {
            return event_1.Event.toPromise(event_1.Event.once(editorService.onDidActiveEditorChange));
        }
        test('non-dirty files reload on window focus', async function () {
            const accessor = await createTracker();
            const resource = utils_1.toResource.call(this, '/path/index.txt');
            await accessor.editorService.openEditor(accessor.textEditorService.createTextEditor({ resource, options: { override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id } }));
            accessor.hostService.setFocus(false);
            accessor.hostService.setFocus(true);
            await awaitModelResolveEvent(accessor.textFileService, resource);
        });
        function awaitModelResolveEvent(textFileService, resource) {
            return new Promise(resolve => {
                const listener = textFileService.files.onDidResolve(e => {
                    if ((0, resources_1.isEqual)(e.model.resource, resource)) {
                        listener.dispose();
                        resolve();
                    }
                });
            });
        }
    });
});
//# sourceMappingURL=textFileEditorTracker.test.js.map