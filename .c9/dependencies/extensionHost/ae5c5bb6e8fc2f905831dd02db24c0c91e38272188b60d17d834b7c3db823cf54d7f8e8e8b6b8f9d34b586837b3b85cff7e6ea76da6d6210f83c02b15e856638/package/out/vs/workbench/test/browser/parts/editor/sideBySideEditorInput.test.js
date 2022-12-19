/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, lifecycle_1, uri_1, editor_1, editorInput_1, sideBySideEditorInput_1, workbenchTestServices_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('SideBySideEditorInput', () => {
        let disposables;
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
        });
        teardown(() => {
            disposables.dispose();
        });
        class MyEditorInput extends editorInput_1.EditorInput {
            constructor(resource = undefined) {
                super();
                this.resource = resource;
            }
            fireCapabilitiesChangeEvent() {
                this._onDidChangeCapabilities.fire();
            }
            fireDirtyChangeEvent() {
                this._onDidChangeDirty.fire();
            }
            fireLabelChangeEvent() {
                this._onDidChangeLabel.fire();
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
        test('basics', () => {
            var _a, _b;
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            let counter = 0;
            const input = new MyEditorInput(uri_1.URI.file('/fake'));
            input.onWillDispose(() => {
                assert(true);
                counter++;
            });
            const otherInput = new MyEditorInput(uri_1.URI.file('/fake2'));
            otherInput.onWillDispose(() => {
                assert(true);
                counter++;
            });
            const sideBySideInput = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, 'name', 'description', input, otherInput);
            assert.strictEqual(sideBySideInput.getName(), 'name');
            assert.strictEqual(sideBySideInput.getDescription(), 'description');
            assert.ok((0, editor_1.isSideBySideEditorInput)(sideBySideInput));
            assert.ok(!(0, editor_1.isSideBySideEditorInput)(input));
            assert.strictEqual(sideBySideInput.secondary, input);
            assert.strictEqual(sideBySideInput.primary, otherInput);
            assert(sideBySideInput.matches(sideBySideInput));
            assert(!sideBySideInput.matches(otherInput));
            sideBySideInput.dispose();
            assert.strictEqual(counter, 0);
            const sideBySideInputSame = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, undefined, undefined, input, input);
            assert.strictEqual(sideBySideInputSame.getName(), input.getName());
            assert.strictEqual(sideBySideInputSame.getDescription(), input.getDescription());
            assert.strictEqual(sideBySideInputSame.getTitle(), input.getTitle());
            assert.strictEqual((_a = sideBySideInputSame.resource) === null || _a === void 0 ? void 0 : _a.toString(), (_b = input.resource) === null || _b === void 0 ? void 0 : _b.toString());
        });
        test('events dispatching', () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            let input = new MyEditorInput();
            let otherInput = new MyEditorInput();
            const sideBySideInut = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, 'name', 'description', otherInput, input);
            assert.ok((0, editor_1.isSideBySideEditorInput)(sideBySideInut));
            let capabilitiesChangeCounter = 0;
            sideBySideInut.onDidChangeCapabilities(() => capabilitiesChangeCounter++);
            let dirtyChangeCounter = 0;
            sideBySideInut.onDidChangeDirty(() => dirtyChangeCounter++);
            let labelChangeCounter = 0;
            sideBySideInut.onDidChangeLabel(() => labelChangeCounter++);
            input.fireCapabilitiesChangeEvent();
            assert.strictEqual(capabilitiesChangeCounter, 1);
            otherInput.fireCapabilitiesChangeEvent();
            assert.strictEqual(capabilitiesChangeCounter, 2);
            input.fireDirtyChangeEvent();
            otherInput.fireDirtyChangeEvent();
            assert.strictEqual(dirtyChangeCounter, 1);
            input.fireLabelChangeEvent();
            otherInput.fireLabelChangeEvent();
            assert.strictEqual(labelChangeCounter, 2);
        });
        test('toUntyped', () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const primaryInput = new MyEditorInput(uri_1.URI.file('/fake'));
            const secondaryInput = new MyEditorInput(uri_1.URI.file('/fake2'));
            const sideBySideInput = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, 'Side By Side Test', undefined, secondaryInput, primaryInput);
            const untypedSideBySideInput = sideBySideInput.toUntyped();
            assert.ok((0, editor_1.isResourceSideBySideEditorInput)(untypedSideBySideInput));
        });
        test('untyped matches', () => {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const primaryInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('/fake'), 'primaryId');
            const secondaryInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('/fake2'), 'secondaryId');
            const sideBySideInput = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, 'Side By Side Test', undefined, secondaryInput, primaryInput);
            const primaryUntypedInput = { resource: uri_1.URI.file('/fake'), options: { override: 'primaryId' } };
            const secondaryUntypedInput = { resource: uri_1.URI.file('/fake2'), options: { override: 'secondaryId' } };
            const sideBySideUntyped = { primary: primaryUntypedInput, secondary: secondaryUntypedInput };
            assert.ok(sideBySideInput.matches(sideBySideUntyped));
            const primaryUntypedInput2 = { resource: uri_1.URI.file('/fake'), options: { override: 'primaryIdWrong' } };
            const secondaryUntypedInput2 = { resource: uri_1.URI.file('/fake2'), options: { override: 'secondaryId' } };
            const sideBySideUntyped2 = { primary: primaryUntypedInput2, secondary: secondaryUntypedInput2 };
            assert.ok(!sideBySideInput.matches(sideBySideUntyped2));
            const primaryUntypedInput3 = { resource: uri_1.URI.file('/fake'), options: { override: 'primaryId' } };
            const secondaryUntypedInput3 = { resource: uri_1.URI.file('/fake2Wrong'), options: { override: 'secondaryId' } };
            const sideBySideUntyped3 = { primary: primaryUntypedInput3, secondary: secondaryUntypedInput3 };
            assert.ok(!sideBySideInput.matches(sideBySideUntyped3));
        });
    });
});
//# sourceMappingURL=sideBySideEditorInput.test.js.map