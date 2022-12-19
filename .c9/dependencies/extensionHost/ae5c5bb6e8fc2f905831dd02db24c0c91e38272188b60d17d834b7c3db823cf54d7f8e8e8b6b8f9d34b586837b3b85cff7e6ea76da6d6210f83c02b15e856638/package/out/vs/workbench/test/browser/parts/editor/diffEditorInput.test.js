/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/common/editor", "vs/base/common/uri", "vs/base/common/lifecycle"], function (require, exports, assert, editorInput_1, diffEditorInput_1, workbenchTestServices_1, editor_1, uri_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Diff editor input', () => {
        class MyEditorInput extends editorInput_1.EditorInput {
            constructor(resource = undefined) {
                super();
                this.resource = resource;
            }
            get typeId() { return 'myEditorInput'; }
            resolve() { return null; }
            toUntyped() {
                return { resource: this.resource, options: { override: this.typeId } };
            }
            matches(otherInput) {
                var _a;
                if (super.matches(otherInput)) {
                    return true;
                }
                const resource = editor_1.EditorResourceAccessor.getCanonicalUri(otherInput);
                return (resource === null || resource === void 0 ? void 0 : resource.toString()) === ((_a = this.resource) === null || _a === void 0 ? void 0 : _a.toString());
            }
        }
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        test('basics', () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            let counter = 0;
            const input = new MyEditorInput();
            input.onWillDispose(() => {
                assert(true);
                counter++;
            });
            const otherInput = new MyEditorInput();
            otherInput.onWillDispose(() => {
                assert(true);
                counter++;
            });
            const diffInput = instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', input, otherInput, undefined);
            assert.ok((0, editor_1.isDiffEditorInput)(diffInput));
            assert.ok(!(0, editor_1.isDiffEditorInput)(input));
            assert.strictEqual(diffInput.original, input);
            assert.strictEqual(diffInput.modified, otherInput);
            assert(diffInput.matches(diffInput));
            assert(!diffInput.matches(otherInput));
            diffInput.dispose();
            assert.strictEqual(counter, 0);
        });
        test('toUntyped', () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const input = new MyEditorInput(uri_1.URI.file('foo/bar1'));
            const otherInput = new MyEditorInput(uri_1.URI.file('foo/bar2'));
            const diffInput = instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', input, otherInput, undefined);
            const untypedDiffInput = diffInput.toUntyped();
            assert.ok((0, editor_1.isResourceDiffEditorInput)(untypedDiffInput));
            assert.ok(!(0, editor_1.isResourceSideBySideEditorInput)(untypedDiffInput));
            assert.ok(diffInput.matches(untypedDiffInput));
        });
        test('disposes when input inside disposes', function () {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            let counter = 0;
            let input = new MyEditorInput();
            let otherInput = new MyEditorInput();
            let diffInput = instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', input, otherInput, undefined);
            diffInput.onWillDispose(() => {
                counter++;
                assert(true);
            });
            input.dispose();
            input = new MyEditorInput();
            otherInput = new MyEditorInput();
            let diffInput2 = instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', input, otherInput, undefined);
            diffInput2.onWillDispose(() => {
                counter++;
                assert(true);
            });
            otherInput.dispose();
            assert.strictEqual(counter, 2);
        });
    });
});
//# sourceMappingURL=diffEditorInput.test.js.map