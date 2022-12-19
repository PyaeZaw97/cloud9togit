/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/editor", "vs/workbench/common/editor/diffEditorInput", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/network", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/base/common/lifecycle", "vs/base/test/common/utils", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/editor", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/browser/editorService", "vs/workbench/services/editor/common/editorService", "vs/workbench/common/editor/sideBySideEditorInput", "vs/platform/editor/common/editor", "vs/editor/common/core/position"], function (require, exports, assert, editor_1, diffEditorInput_1, uri_1, workbenchTestServices_1, network_1, untitledTextEditorInput_1, lifecycle_1, utils_1, descriptors_1, editor_2, editorGroupsService_1, editorService_1, editorService_2, sideBySideEditorInput_1, editor_3, position_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench editor utils', () => {
        class TestEditorInputWithPreferredResource extends workbenchTestServices_1.TestEditorInput {
            constructor(resource, preferredResource, typeId) {
                super(resource, typeId);
                this.preferredResource = preferredResource;
            }
        }
        const disposables = new lifecycle_1.DisposableStore();
        const TEST_EDITOR_ID = 'MyTestEditorForEditors';
        let instantiationService;
        let accessor;
        async function createServices() {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const part = await (0, workbenchTestServices_1.createEditorPart)(instantiationService, disposables);
            instantiationService.stub(editorGroupsService_1.IEditorGroupsService, part);
            const editorService = instantiationService.createInstance(editorService_1.EditorService);
            instantiationService.stub(editorService_2.IEditorService, editorService);
            return instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
        }
        setup(() => {
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            accessor = instantiationService.createInstance(workbenchTestServices_1.TestServiceAccessor);
            disposables.add((0, workbenchTestServices_1.registerTestFileEditor)());
            disposables.add((0, workbenchTestServices_1.registerTestSideBySideEditor)());
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
            disposables.add((0, workbenchTestServices_1.registerTestEditor)(TEST_EDITOR_ID, [new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestFileEditorInput)]));
        });
        teardown(() => {
            accessor.untitledTextEditorService.dispose();
            disposables.clear();
        });
        test('untyped check functions', () => {
            assert.ok(!(0, editor_1.isResourceEditorInput)(undefined));
            assert.ok(!(0, editor_1.isResourceEditorInput)({}));
            assert.ok(!(0, editor_1.isResourceEditorInput)({ original: { resource: uri_1.URI.file('/') }, modified: { resource: uri_1.URI.file('/') } }));
            assert.ok((0, editor_1.isResourceEditorInput)({ resource: uri_1.URI.file('/') }));
            assert.ok(!(0, editor_1.isUntitledResourceEditorInput)(undefined));
            assert.ok((0, editor_1.isUntitledResourceEditorInput)({}));
            assert.ok((0, editor_1.isUntitledResourceEditorInput)({ resource: uri_1.URI.file('/').with({ scheme: network_1.Schemas.untitled }) }));
            assert.ok((0, editor_1.isUntitledResourceEditorInput)({ resource: uri_1.URI.file('/'), forceUntitled: true }));
            assert.ok(!(0, editor_1.isResourceDiffEditorInput)(undefined));
            assert.ok(!(0, editor_1.isResourceDiffEditorInput)({}));
            assert.ok(!(0, editor_1.isResourceDiffEditorInput)({ resource: uri_1.URI.file('/') }));
            assert.ok((0, editor_1.isResourceDiffEditorInput)({ original: { resource: uri_1.URI.file('/') }, modified: { resource: uri_1.URI.file('/') } }));
            assert.ok((0, editor_1.isResourceDiffEditorInput)({ original: { resource: uri_1.URI.file('/') }, modified: { resource: uri_1.URI.file('/') }, primary: { resource: uri_1.URI.file('/') }, secondary: { resource: uri_1.URI.file('/') } }));
            assert.ok(!(0, editor_1.isResourceDiffEditorInput)({ primary: { resource: uri_1.URI.file('/') }, secondary: { resource: uri_1.URI.file('/') } }));
            assert.ok(!(0, editor_1.isResourceSideBySideEditorInput)(undefined));
            assert.ok(!(0, editor_1.isResourceSideBySideEditorInput)({}));
            assert.ok(!(0, editor_1.isResourceSideBySideEditorInput)({ resource: uri_1.URI.file('/') }));
            assert.ok((0, editor_1.isResourceSideBySideEditorInput)({ primary: { resource: uri_1.URI.file('/') }, secondary: { resource: uri_1.URI.file('/') } }));
            assert.ok(!(0, editor_1.isResourceSideBySideEditorInput)({ original: { resource: uri_1.URI.file('/') }, modified: { resource: uri_1.URI.file('/') } }));
            assert.ok(!(0, editor_1.isResourceSideBySideEditorInput)({ primary: { resource: uri_1.URI.file('/') }, secondary: { resource: uri_1.URI.file('/') }, original: { resource: uri_1.URI.file('/') }, modified: { resource: uri_1.URI.file('/') } }));
        });
        test('EditorInputCapabilities', () => {
            const testInput1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('resource1'), 'testTypeId');
            const testInput2 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('resource2'), 'testTypeId');
            testInput1.capabilities = 0 /* EditorInputCapabilities.None */;
            assert.strictEqual(testInput1.hasCapability(0 /* EditorInputCapabilities.None */), true);
            assert.strictEqual(testInput1.hasCapability(2 /* EditorInputCapabilities.Readonly */), false);
            assert.strictEqual(testInput1.hasCapability(4 /* EditorInputCapabilities.Untitled */), false);
            assert.strictEqual(testInput1.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */), false);
            assert.strictEqual(testInput1.hasCapability(8 /* EditorInputCapabilities.Singleton */), false);
            testInput1.capabilities |= 2 /* EditorInputCapabilities.Readonly */;
            assert.strictEqual(testInput1.hasCapability(2 /* EditorInputCapabilities.Readonly */), true);
            assert.strictEqual(testInput1.hasCapability(0 /* EditorInputCapabilities.None */), false);
            assert.strictEqual(testInput1.hasCapability(4 /* EditorInputCapabilities.Untitled */), false);
            assert.strictEqual(testInput1.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */), false);
            assert.strictEqual(testInput1.hasCapability(8 /* EditorInputCapabilities.Singleton */), false);
            testInput1.capabilities = 0 /* EditorInputCapabilities.None */;
            testInput2.capabilities = 0 /* EditorInputCapabilities.None */;
            const sideBySideInput = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, 'name', undefined, testInput1, testInput2);
            assert.strictEqual(sideBySideInput.hasCapability(0 /* EditorInputCapabilities.None */), true);
            assert.strictEqual(sideBySideInput.hasCapability(2 /* EditorInputCapabilities.Readonly */), false);
            assert.strictEqual(sideBySideInput.hasCapability(4 /* EditorInputCapabilities.Untitled */), false);
            assert.strictEqual(sideBySideInput.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */), false);
            assert.strictEqual(sideBySideInput.hasCapability(8 /* EditorInputCapabilities.Singleton */), false);
            testInput1.capabilities |= 2 /* EditorInputCapabilities.Readonly */;
            assert.strictEqual(sideBySideInput.hasCapability(2 /* EditorInputCapabilities.Readonly */), false);
            testInput2.capabilities |= 2 /* EditorInputCapabilities.Readonly */;
            assert.strictEqual(sideBySideInput.hasCapability(2 /* EditorInputCapabilities.Readonly */), true);
            testInput1.capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            assert.strictEqual(sideBySideInput.hasCapability(4 /* EditorInputCapabilities.Untitled */), false);
            testInput2.capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            assert.strictEqual(sideBySideInput.hasCapability(4 /* EditorInputCapabilities.Untitled */), true);
            testInput1.capabilities |= 16 /* EditorInputCapabilities.RequiresTrust */;
            assert.strictEqual(sideBySideInput.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */), true);
            testInput2.capabilities |= 16 /* EditorInputCapabilities.RequiresTrust */;
            assert.strictEqual(sideBySideInput.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */), true);
            testInput1.capabilities |= 8 /* EditorInputCapabilities.Singleton */;
            assert.strictEqual(sideBySideInput.hasCapability(8 /* EditorInputCapabilities.Singleton */), true);
            testInput2.capabilities |= 8 /* EditorInputCapabilities.Singleton */;
            assert.strictEqual(sideBySideInput.hasCapability(8 /* EditorInputCapabilities.Singleton */), true);
        });
        test('EditorResourceAccessor - typed inputs', () => {
            var _a, _b;
            const service = accessor.untitledTextEditorService;
            assert.ok(!editor_1.EditorResourceAccessor.getCanonicalUri(null));
            assert.ok(!editor_1.EditorResourceAccessor.getOriginalUri(null));
            const untitled = instantiationService.createInstance(untitledTextEditorInput_1.UntitledTextEditorInput, service.create());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled).toString(), untitled.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }).toString(), untitled.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.ANY }).toString(), untitled.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY }).toString(), untitled.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).toString(), untitled.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { filterByScheme: network_1.Schemas.untitled }).toString(), untitled.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), untitled.resource.toString());
            assert.ok(!editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { filterByScheme: network_1.Schemas.file }));
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled).toString(), untitled.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }).toString(), untitled.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.ANY }).toString(), untitled.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY }).toString(), untitled.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).toString(), untitled.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled, { filterByScheme: network_1.Schemas.untitled }).toString(), untitled.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled, { filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), untitled.resource.toString());
            assert.ok(!editor_1.EditorResourceAccessor.getOriginalUri(untitled, { filterByScheme: network_1.Schemas.file }));
            const file = new workbenchTestServices_1.TestEditorInput(uri_1.URI.file('/some/path.txt'), 'editorResourceFileTest');
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file, { supportSideBySide: editor_1.SideBySideEditor.ANY }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file, { filterByScheme: network_1.Schemas.file }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file, { filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), file.resource.toString());
            assert.ok(!editor_1.EditorResourceAccessor.getCanonicalUri(file, { filterByScheme: network_1.Schemas.untitled }));
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file, { supportSideBySide: editor_1.SideBySideEditor.ANY }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file, { filterByScheme: network_1.Schemas.file }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file, { filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), file.resource.toString());
            assert.ok(!editor_1.EditorResourceAccessor.getOriginalUri(file, { filterByScheme: network_1.Schemas.untitled }));
            const diffInput = instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, 'name', 'description', untitled, file, undefined);
            const sideBySideInput = instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, 'name', 'description', untitled, file);
            for (const input of [diffInput, sideBySideInput]) {
                assert.ok(!editor_1.EditorResourceAccessor.getCanonicalUri(input));
                assert.ok(!editor_1.EditorResourceAccessor.getCanonicalUri(input, { filterByScheme: network_1.Schemas.file }));
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }).toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY, filterByScheme: network_1.Schemas.file }).toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(input, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY }).toString(), untitled.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(input, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY, filterByScheme: network_1.Schemas.untitled }).toString(), untitled.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(input, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), untitled.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(input, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).primary.toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(input, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: network_1.Schemas.file }).primary.toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(input, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).primary.toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(input, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).secondary.toString(), untitled.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(input, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: network_1.Schemas.untitled }).secondary.toString(), untitled.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(input, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).secondary.toString(), untitled.resource.toString());
                assert.ok(!editor_1.EditorResourceAccessor.getOriginalUri(input));
                assert.ok(!editor_1.EditorResourceAccessor.getOriginalUri(input, { filterByScheme: network_1.Schemas.file }));
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }).toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY, filterByScheme: network_1.Schemas.file }).toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY }).toString(), untitled.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY, filterByScheme: network_1.Schemas.untitled }).toString(), untitled.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), untitled.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).primary.toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: network_1.Schemas.file }).primary.toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).primary.toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).secondary.toString(), untitled.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: network_1.Schemas.untitled }).secondary.toString(), untitled.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).secondary.toString(), untitled.resource.toString());
            }
            const resource = uri_1.URI.file('/some/path.txt');
            const preferredResource = uri_1.URI.file('/some/PATH.txt');
            const fileWithPreferredResource = new TestEditorInputWithPreferredResource(uri_1.URI.file('/some/path.txt'), uri_1.URI.file('/some/PATH.txt'), 'editorResourceFileTest');
            assert.strictEqual((_a = editor_1.EditorResourceAccessor.getCanonicalUri(fileWithPreferredResource)) === null || _a === void 0 ? void 0 : _a.toString(), resource.toString());
            assert.strictEqual((_b = editor_1.EditorResourceAccessor.getOriginalUri(fileWithPreferredResource)) === null || _b === void 0 ? void 0 : _b.toString(), preferredResource.toString());
        });
        test('EditorResourceAccessor - untyped inputs', () => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1;
            assert.ok(!editor_1.EditorResourceAccessor.getCanonicalUri(null));
            assert.ok(!editor_1.EditorResourceAccessor.getOriginalUri(null));
            const untitledURI = uri_1.URI.from({
                scheme: network_1.Schemas.untitled,
                authority: 'foo',
                path: '/bar'
            });
            const untitled = {
                resource: untitledURI
            };
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled).toString(), (_a = untitled.resource) === null || _a === void 0 ? void 0 : _a.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }).toString(), (_b = untitled.resource) === null || _b === void 0 ? void 0 : _b.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.ANY }).toString(), (_c = untitled.resource) === null || _c === void 0 ? void 0 : _c.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY }).toString(), (_d = untitled.resource) === null || _d === void 0 ? void 0 : _d.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).toString(), (_e = untitled.resource) === null || _e === void 0 ? void 0 : _e.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { filterByScheme: network_1.Schemas.untitled }).toString(), (_f = untitled.resource) === null || _f === void 0 ? void 0 : _f.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), (_g = untitled.resource) === null || _g === void 0 ? void 0 : _g.toString());
            assert.ok(!editor_1.EditorResourceAccessor.getCanonicalUri(untitled, { filterByScheme: network_1.Schemas.file }));
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled).toString(), (_h = untitled.resource) === null || _h === void 0 ? void 0 : _h.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }).toString(), (_j = untitled.resource) === null || _j === void 0 ? void 0 : _j.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.ANY }).toString(), (_k = untitled.resource) === null || _k === void 0 ? void 0 : _k.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY }).toString(), (_l = untitled.resource) === null || _l === void 0 ? void 0 : _l.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).toString(), (_m = untitled.resource) === null || _m === void 0 ? void 0 : _m.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled, { filterByScheme: network_1.Schemas.untitled }).toString(), (_o = untitled.resource) === null || _o === void 0 ? void 0 : _o.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untitled, { filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), (_p = untitled.resource) === null || _p === void 0 ? void 0 : _p.toString());
            assert.ok(!editor_1.EditorResourceAccessor.getOriginalUri(untitled, { filterByScheme: network_1.Schemas.file }));
            const file = {
                resource: uri_1.URI.file('/some/path.txt')
            };
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file, { supportSideBySide: editor_1.SideBySideEditor.ANY }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file, { filterByScheme: network_1.Schemas.file }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(file, { filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), file.resource.toString());
            assert.ok(!editor_1.EditorResourceAccessor.getCanonicalUri(file, { filterByScheme: network_1.Schemas.untitled }));
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file, { supportSideBySide: editor_1.SideBySideEditor.ANY }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file, { filterByScheme: network_1.Schemas.file }).toString(), file.resource.toString());
            assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(file, { filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), file.resource.toString());
            assert.ok(!editor_1.EditorResourceAccessor.getOriginalUri(file, { filterByScheme: network_1.Schemas.untitled }));
            const diffInput = { original: untitled, modified: file };
            const sideBySideInput = { primary: file, secondary: untitled };
            for (const untypedInput of [diffInput, sideBySideInput]) {
                assert.ok(!editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput));
                assert.ok(!editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput, { filterByScheme: network_1.Schemas.file }));
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }).toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY, filterByScheme: network_1.Schemas.file }).toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY }).toString(), (_q = untitled.resource) === null || _q === void 0 ? void 0 : _q.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY, filterByScheme: network_1.Schemas.untitled }).toString(), (_r = untitled.resource) === null || _r === void 0 ? void 0 : _r.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), (_s = untitled.resource) === null || _s === void 0 ? void 0 : _s.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).primary.toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: network_1.Schemas.file }).primary.toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).primary.toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).secondary.toString(), (_t = untitled.resource) === null || _t === void 0 ? void 0 : _t.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: network_1.Schemas.untitled }).secondary.toString(), (_u = untitled.resource) === null || _u === void 0 ? void 0 : _u.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getCanonicalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).secondary.toString(), (_v = untitled.resource) === null || _v === void 0 ? void 0 : _v.toString());
                assert.ok(!editor_1.EditorResourceAccessor.getOriginalUri(untypedInput));
                assert.ok(!editor_1.EditorResourceAccessor.getOriginalUri(untypedInput, { filterByScheme: network_1.Schemas.file }));
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }).toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY, filterByScheme: network_1.Schemas.file }).toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY }).toString(), (_w = untitled.resource) === null || _w === void 0 ? void 0 : _w.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY, filterByScheme: network_1.Schemas.untitled }).toString(), (_x = untitled.resource) === null || _x === void 0 ? void 0 : _x.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).toString(), (_y = untitled.resource) === null || _y === void 0 ? void 0 : _y.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).primary.toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: network_1.Schemas.file }).primary.toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).primary.toString(), file.resource.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.BOTH }).secondary.toString(), (_z = untitled.resource) === null || _z === void 0 ? void 0 : _z.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: network_1.Schemas.untitled }).secondary.toString(), (_0 = untitled.resource) === null || _0 === void 0 ? void 0 : _0.toString());
                assert.strictEqual(editor_1.EditorResourceAccessor.getOriginalUri(untypedInput, { supportSideBySide: editor_1.SideBySideEditor.BOTH, filterByScheme: [network_1.Schemas.file, network_1.Schemas.untitled] }).secondary.toString(), (_1 = untitled.resource) === null || _1 === void 0 ? void 0 : _1.toString());
            }
        });
        test('isEditorIdentifier', () => {
            assert.strictEqual((0, editor_1.isEditorIdentifier)(undefined), false);
            assert.strictEqual((0, editor_1.isEditorIdentifier)('undefined'), false);
            const testInput1 = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('resource1'), 'testTypeId');
            assert.strictEqual((0, editor_1.isEditorIdentifier)(testInput1), false);
            assert.strictEqual((0, editor_1.isEditorIdentifier)({ editor: testInput1, groupId: 3 }), true);
        });
        test('isEditorInputWithOptionsAndGroup', () => {
            const editorInput = new workbenchTestServices_1.TestFileEditorInput(uri_1.URI.file('resource1'), 'testTypeId');
            assert.strictEqual((0, editor_1.isEditorInput)(editorInput), true);
            assert.strictEqual((0, editor_1.isEditorInputWithOptions)(editorInput), false);
            assert.strictEqual((0, editor_1.isEditorInputWithOptionsAndGroup)(editorInput), false);
            const editorInputWithOptions = { editor: editorInput, options: { override: editor_3.EditorResolution.PICK } };
            assert.strictEqual((0, editor_1.isEditorInput)(editorInputWithOptions), false);
            assert.strictEqual((0, editor_1.isEditorInputWithOptions)(editorInputWithOptions), true);
            assert.strictEqual((0, editor_1.isEditorInputWithOptionsAndGroup)(editorInputWithOptions), false);
            const service = accessor.editorGroupService;
            const editorInputWithOptionsAndGroup = { editor: editorInput, options: { override: editor_3.EditorResolution.PICK }, group: service.activeGroup };
            assert.strictEqual((0, editor_1.isEditorInput)(editorInputWithOptionsAndGroup), false);
            assert.strictEqual((0, editor_1.isEditorInputWithOptions)(editorInputWithOptionsAndGroup), true);
            assert.strictEqual((0, editor_1.isEditorInputWithOptionsAndGroup)(editorInputWithOptionsAndGroup), true);
        });
        test('isTextEditorViewState', () => {
            assert.strictEqual((0, editor_1.isTextEditorViewState)(undefined), false);
            assert.strictEqual((0, editor_1.isTextEditorViewState)({}), false);
            const codeEditorViewState = {
                contributionsState: {},
                cursorState: [],
                viewState: {
                    scrollLeft: 0,
                    firstPosition: new position_1.Position(1, 1),
                    firstPositionDeltaTop: 1
                }
            };
            assert.strictEqual((0, editor_1.isTextEditorViewState)(codeEditorViewState), true);
            const diffEditorViewState = {
                original: codeEditorViewState,
                modified: codeEditorViewState
            };
            assert.strictEqual((0, editor_1.isTextEditorViewState)(diffEditorViewState), true);
        });
        test('whenEditorClosed (single editor)', async function () {
            return testWhenEditorClosed(false, false, utils_1.toResource.call(this, '/path/index.txt'));
        });
        test('whenEditorClosed (multiple editor)', async function () {
            return testWhenEditorClosed(false, false, utils_1.toResource.call(this, '/path/index.txt'), utils_1.toResource.call(this, '/test.html'));
        });
        test('whenEditorClosed (single editor, diff editor)', async function () {
            return testWhenEditorClosed(true, false, utils_1.toResource.call(this, '/path/index.txt'));
        });
        test('whenEditorClosed (multiple editor, diff editor)', async function () {
            return testWhenEditorClosed(true, false, utils_1.toResource.call(this, '/path/index.txt'), utils_1.toResource.call(this, '/test.html'));
        });
        test('whenEditorClosed (single custom editor)', async function () {
            return testWhenEditorClosed(false, true, utils_1.toResource.call(this, '/path/index.txt'));
        });
        test('whenEditorClosed (multiple custom editor)', async function () {
            return testWhenEditorClosed(false, true, utils_1.toResource.call(this, '/path/index.txt'), utils_1.toResource.call(this, '/test.html'));
        });
        async function testWhenEditorClosed(sideBySide, custom, ...resources) {
            const accessor = await createServices();
            for (const resource of resources) {
                if (custom) {
                    await accessor.editorService.openEditor(new workbenchTestServices_1.TestFileEditorInput(resource, 'testTypeId'), { pinned: true, override: editor_3.EditorResolution.DISABLED });
                }
                else if (sideBySide) {
                    await accessor.editorService.openEditor(instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, 'testSideBySideEditor', undefined, new workbenchTestServices_1.TestFileEditorInput(resource, 'testTypeId'), new workbenchTestServices_1.TestFileEditorInput(resource, 'testTypeId')), { pinned: true, override: editor_3.EditorResolution.DISABLED });
                }
                else {
                    await accessor.editorService.openEditor({ resource, options: { pinned: true } });
                }
            }
            const closedPromise = accessor.instantitionService.invokeFunction(accessor => (0, editor_2.whenEditorClosed)(accessor, resources));
            accessor.editorGroupService.activeGroup.closeAllEditors();
            await closedPromise;
        }
    });
});
//# sourceMappingURL=editor.test.js.map