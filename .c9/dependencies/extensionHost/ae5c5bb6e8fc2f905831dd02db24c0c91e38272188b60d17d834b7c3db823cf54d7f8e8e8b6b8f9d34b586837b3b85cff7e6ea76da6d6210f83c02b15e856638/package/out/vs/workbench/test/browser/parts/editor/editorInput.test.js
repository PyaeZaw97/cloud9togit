/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, uri_1, editor_1, editorInput_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorInput', () => {
        class MyEditorInput extends editorInput_1.EditorInput {
            constructor() {
                super(...arguments);
                this.resource = undefined;
            }
            get typeId() { return 'myEditorInput'; }
            resolve() { return null; }
        }
        test('basics', () => {
            let counter = 0;
            let input = new MyEditorInput();
            let otherInput = new MyEditorInput();
            assert.ok((0, editor_1.isEditorInput)(input));
            assert.ok(!(0, editor_1.isEditorInput)(undefined));
            assert.ok(!(0, editor_1.isEditorInput)({ resource: uri_1.URI.file('/') }));
            assert.ok(!(0, editor_1.isEditorInput)({}));
            assert.ok(!(0, editor_1.isResourceEditorInput)(input));
            assert.ok(!(0, editor_1.isUntitledResourceEditorInput)(input));
            assert.ok(!(0, editor_1.isResourceDiffEditorInput)(input));
            assert.ok(!(0, editor_1.isResourceSideBySideEditorInput)(input));
            assert(input.matches(input));
            assert(!input.matches(otherInput));
            assert(input.getName());
            input.onWillDispose(() => {
                assert(true);
                counter++;
            });
            input.dispose();
            assert.strictEqual(counter, 1);
        });
        test('untyped matches', () => {
            const testInputID = 'untypedMatches';
            const testInputResource = uri_1.URI.file('/fake');
            const testInput = new workbenchTestServices_1.TestEditorInput(testInputResource, testInputID);
            const testUntypedInput = { resource: testInputResource, options: { override: testInputID } };
            const tetUntypedInputWrongResource = { resource: uri_1.URI.file('/incorrectFake'), options: { override: testInputID } };
            const testUntypedInputWrongId = { resource: testInputResource, options: { override: 'wrongId' } };
            const testUntypedInputWrong = { resource: uri_1.URI.file('/incorrectFake'), options: { override: 'wrongId' } };
            assert(testInput.matches(testUntypedInput));
            assert.ok(!testInput.matches(tetUntypedInputWrongResource));
            assert.ok(!testInput.matches(testUntypedInputWrongId));
            assert.ok(!testInput.matches(testUntypedInputWrong));
        });
    });
});
//# sourceMappingURL=editorInput.test.js.map