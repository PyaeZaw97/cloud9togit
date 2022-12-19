/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/editor/common/editor", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/workbench/services/workspaces/test/common/testWorkspaceTrustService", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert, lifecycle_1, uri_1, editor_1, workspaceTrust_1, editorService_1, editorGroupsService_1, untitledTextEditorInput_1, workingCopyEditorService_1, testWorkspaceTrustService_1, workbenchTestServices_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('WorkingCopyEditorService', () => {
        let disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
        });
        teardown(() => {
            disposables.clear();
        });
        test('registry - basics', () => {
            const service = new workingCopyEditorService_1.WorkingCopyEditorService(new workbenchTestServices_1.TestEditorService());
            let handlerEvent = undefined;
            service.onDidRegisterHandler(handler => {
                handlerEvent = handler;
            });
            const editorHandler = {
                handles: workingCopy => false,
                isOpen: () => false,
                createEditor: workingCopy => { throw new Error(); }
            };
            const disposable = service.registerHandler(editorHandler);
            assert.strictEqual(handlerEvent, editorHandler);
            disposable.dispose();
        });
        test('findEditor', async () => {
            const disposables = new lifecycle_1.DisposableStore();
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            instantiationService.stub(workspaceTrust_1.IWorkspaceTrustRequestService, new testWorkspaceTrustService_1.TestWorkspaceTrustRequestService(false));
            const editorService = instantiationService.createInstance(editorService_1.EditorService);
            const accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            const service = new workingCopyEditorService_1.WorkingCopyEditorService(editorService);
            const resource = uri_1.URI.parse('custom://some/folder/custom.txt');
            const testWorkingCopy = new workbenchTestServices_2.TestWorkingCopy(resource, false, 'testWorkingCopyTypeId1');
            assert.strictEqual(service.findEditor(testWorkingCopy), undefined);
            const editorHandler = {
                handles: workingCopy => workingCopy === testWorkingCopy,
                isOpen: (workingCopy, editor) => workingCopy === testWorkingCopy,
                createEditor: workingCopy => { throw new Error(); }
            };
            disposables.add(service.registerHandler(editorHandler));
            const editor1 = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, accessor.untitledTextEditorService.create({ initialValue: 'foo' }));
            const editor2 = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, accessor.untitledTextEditorService.create({ initialValue: 'foo' }));
            await editorService.openEditors([{ editor: editor1, options: { override: editor_1.EditorResolution.DISABLED } }, { editor: editor2, options: { override: editor_1.EditorResolution.DISABLED } }]);
            assert.ok(service.findEditor(testWorkingCopy));
            disposables.dispose();
        });
    });
});
//# sourceMappingURL=workingCopyEditorService.test.js.map