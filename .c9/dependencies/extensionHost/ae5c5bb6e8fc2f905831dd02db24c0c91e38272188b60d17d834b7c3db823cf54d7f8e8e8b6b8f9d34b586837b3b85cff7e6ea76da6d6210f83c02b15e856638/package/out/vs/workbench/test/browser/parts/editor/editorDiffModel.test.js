/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/editor/textDiffEditorModel", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/common/editor/textResourceEditorInput", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/lifecycle"], function (require, exports, assert, textDiffEditorModel_1, diffEditorInput_1, textResourceEditorInput_1, uri_1, workbenchTestServices_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TextDiffEditorModel', () => {
        let disposables;
        let instantiationService;
        let accessor;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
        });
        teardown(() => {
            disposables.dispose();
        });
        test('basics', async () => {
            const dispose = accessor.textModelResolverService.registerTextModelContentProvider('test', {
                provideTextContent: async function (resource) {
                    if (resource.scheme === 'test') {
                        let modelContent = 'Hello Test';
                        let languageSelection = accessor.languageService.createById('json');
                        return accessor.modelService.createModel(modelContent, languageSelection, resource);
                    }
                    return null;
                }
            });
            let input = instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, uri_1.URI.from({ scheme: 'test', authority: null, path: 'thePath' }), 'name', 'description', undefined, undefined);
            let otherInput = instantiationService.createInstance(textResourceEditorInput_1.TextResourceEditorInput, uri_1.URI.from({ scheme: 'test', authority: null, path: 'thePath' }), 'name2', 'description', undefined, undefined);
            let diffInput = instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', input, otherInput, undefined);
            let model = await diffInput.resolve();
            assert(model);
            assert(model instanceof textDiffEditorModel_1.TextDiffEditorModel);
            let diffEditorModel = model.textDiffEditorModel;
            assert(diffEditorModel.original);
            assert(diffEditorModel.modified);
            model = await diffInput.resolve();
            assert(model.isResolved());
            assert(diffEditorModel !== model.textDiffEditorModel);
            diffInput.dispose();
            assert(!model.textDiffEditorModel);
            dispose.dispose();
        });
    });
});
//# sourceMappingURL=editorDiffModel.test.js.map