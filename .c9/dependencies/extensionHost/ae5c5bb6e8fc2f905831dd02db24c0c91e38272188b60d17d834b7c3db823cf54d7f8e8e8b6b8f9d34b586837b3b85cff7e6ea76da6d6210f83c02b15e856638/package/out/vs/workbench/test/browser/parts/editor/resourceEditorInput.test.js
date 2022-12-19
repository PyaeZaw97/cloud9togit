/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/common/editor/resourceEditorInput", "vs/platform/label/common/label", "vs/platform/files/common/files", "vs/base/common/lifecycle"], function (require, exports, assert, uri_1, workbenchTestServices_1, resourceEditorInput_1, label_1, files_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('ResourceEditorInput', () => {
        let disposables;
        let instantiationService;
        let TestResourceEditorInput = class TestResourceEditorInput extends resourceEditorInput_1.AbstractResourceEditorInput {
            constructor(resource, labelService, fileService) {
                super(resource, resource, labelService, fileService);
                this.typeId = 'test.typeId';
            }
        };
        TestResourceEditorInput = __decorate([
            __param(1, label_1.ILabelService),
            __param(2, files_1.IFileService)
        ], TestResourceEditorInput);
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
        });
        teardown(() => {
            disposables.dispose();
        });
        test('basics', async () => {
            const resource = uri_1.URI.from({ scheme: 'testResource', path: 'thePath/of/the/resource.txt' });
            const input = instantiationService.createInstance(TestResourceEditorInput, resource);
            assert.ok(input.getName().length > 0);
            assert.ok(input.getDescription(0 /* Verbosity.SHORT */).length > 0);
            assert.ok(input.getDescription(1 /* Verbosity.MEDIUM */).length > 0);
            assert.ok(input.getDescription(2 /* Verbosity.LONG */).length > 0);
            assert.ok(input.getTitle(0 /* Verbosity.SHORT */).length > 0);
            assert.ok(input.getTitle(1 /* Verbosity.MEDIUM */).length > 0);
            assert.ok(input.getTitle(2 /* Verbosity.LONG */).length > 0);
            assert.strictEqual(input.hasCapability(2 /* EditorInputCapabilities.Readonly */), false);
            assert.strictEqual(input.hasCapability(4 /* EditorInputCapabilities.Untitled */), true);
        });
    });
});
//# sourceMappingURL=resourceEditorInput.test.js.map