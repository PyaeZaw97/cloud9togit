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
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/common/editor", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/common/editor/textResourceEditorInput", "vs/platform/instantiation/common/descriptors", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/base/test/common/utils", "vs/platform/files/common/files", "vs/base/common/lifecycle", "vs/platform/files/test/common/nullFileSystemProvider", "vs/workbench/common/editor/diffEditorInput", "vs/base/common/platform", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/services/textfile/common/textEditorService", "vs/editor/common/languages/language"], function (require, exports, assert, uri_1, editor_1, workbenchTestServices_1, textResourceEditorInput_1, descriptors_1, fileEditorInput_1, untitledTextEditorInput_1, utils_1, files_1, lifecycle_1, nullFileSystemProvider_1, diffEditorInput_1, platform_1, sideBySideEditorInput_1, textEditorService_1, language_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('TextEditorService', () => {
        const TEST_EDITOR_ID = 'MyTestEditorForEditorService';
        const TEST_EDITOR_INPUT_ID = 'testEditorInputForEditorService';
        let FileServiceProvider = class FileServiceProvider extends lifecycle_1.Disposable {
            constructor(scheme, fileService) {
                super();
                this._register(fileService.registerProvider(scheme, new nullFileSystemProvider_1.NullFileSystemProvider()));
            }
        };
        FileServiceProvider = __decorate([
            __param(1, files_1.IFileService)
        ], FileServiceProvider);
        const disposables = new lifecycle_1.DisposableStore();
        setup(() => {
            disposables.add((0, workbenchTestServices_1.registerTestEditor)(TEST_EDITOR_ID, [new descriptors_1.SyncDescriptor(workbenchTestServices_1.TestFileEditorInput)], TEST_EDITOR_INPUT_ID));
            disposables.add((0, workbenchTestServices_1.registerTestResourceEditor)());
            disposables.add((0, workbenchTestServices_1.registerTestSideBySideEditor)());
        });
        teardown(() => {
            disposables.clear();
        });
        test('createTextEditor - basics', async function () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const languageService = instantiationService.get(language_1.ILanguageService);
            const service = instantiationService.createInstance(textEditorService_1.TextEditorService);
            const languageId = 'create-input-test';
            const registration = languageService.registerLanguage({
                id: languageId,
            });
            // Untyped Input (file)
            let input = service.createTextEditor({ resource: utils_1.toResource.call(this, '/index.html'), options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            let contentInput = input;
            assert.strictEqual(contentInput.resource.fsPath, utils_1.toResource.call(this, '/index.html').fsPath);
            // Untyped Input (file casing)
            input = service.createTextEditor({ resource: utils_1.toResource.call(this, '/index.html') });
            let inputDifferentCase = service.createTextEditor({ resource: utils_1.toResource.call(this, '/INDEX.html') });
            if (!platform_1.isLinux) {
                assert.strictEqual(input, inputDifferentCase);
                assert.strictEqual((_a = input.resource) === null || _a === void 0 ? void 0 : _a.toString(), (_b = inputDifferentCase.resource) === null || _b === void 0 ? void 0 : _b.toString());
            }
            else {
                assert.notStrictEqual(input, inputDifferentCase);
                assert.notStrictEqual((_c = input.resource) === null || _c === void 0 ? void 0 : _c.toString(), (_d = inputDifferentCase.resource) === null || _d === void 0 ? void 0 : _d.toString());
            }
            // Typed Input
            assert.strictEqual(service.createTextEditor(input), input);
            // Untyped Input (file, encoding)
            input = service.createTextEditor({ resource: utils_1.toResource.call(this, '/index.html'), encoding: 'utf16le', options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            contentInput = input;
            assert.strictEqual(contentInput.getPreferredEncoding(), 'utf16le');
            // Untyped Input (file, language)
            input = service.createTextEditor({ resource: utils_1.toResource.call(this, '/index.html'), languageId: languageId });
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            contentInput = input;
            assert.strictEqual(contentInput.getPreferredLanguageId(), languageId);
            let fileModel = await contentInput.resolve();
            assert.strictEqual((_e = fileModel.textEditorModel) === null || _e === void 0 ? void 0 : _e.getLanguageId(), languageId);
            // Untyped Input (file, contents)
            input = service.createTextEditor({ resource: utils_1.toResource.call(this, '/index.html'), contents: 'My contents' });
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            contentInput = input;
            fileModel = await contentInput.resolve();
            assert.strictEqual((_f = fileModel.textEditorModel) === null || _f === void 0 ? void 0 : _f.getValue(), 'My contents');
            assert.strictEqual(fileModel.isDirty(), true);
            // Untyped Input (file, different language)
            input = service.createTextEditor({ resource: utils_1.toResource.call(this, '/index.html'), languageId: 'text' });
            assert(input instanceof fileEditorInput_1.FileEditorInput);
            contentInput = input;
            assert.strictEqual(contentInput.getPreferredLanguageId(), 'text');
            // Untyped Input (untitled)
            input = service.createTextEditor({ resource: undefined, options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            // Untyped Input (untitled with contents)
            let untypedInput = { contents: 'Hello Untitled', options: { selection: { startLineNumber: 1, startColumn: 1 } } };
            input = service.createTextEditor(untypedInput);
            assert.ok((0, editor_1.isUntitledResourceEditorInput)(untypedInput));
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            let model = await input.resolve();
            assert.strictEqual((_g = model.textEditorModel) === null || _g === void 0 ? void 0 : _g.getValue(), 'Hello Untitled');
            // Untyped Input (untitled withtoUntyped2
            input = service.createTextEditor({ resource: undefined, languageId: languageId, options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            model = await input.resolve();
            assert.strictEqual(model.getLanguageId(), languageId);
            // Untyped Input (untitled with file path)
            input = service.createTextEditor({ resource: uri_1.URI.file('/some/path.txt'), forceUntitled: true, options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            assert.ok(input.model.hasAssociatedFilePath);
            // Untyped Input (untitled with untitled resource)
            untypedInput = { resource: uri_1.URI.parse('untitled://Untitled-1'), forceUntitled: true, options: { selection: { startLineNumber: 1, startColumn: 1 } } };
            assert.ok((0, editor_1.isUntitledResourceEditorInput)(untypedInput));
            input = service.createTextEditor(untypedInput);
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            assert.ok(!input.model.hasAssociatedFilePath);
            // Untyped input (untitled with custom resource, but forceUntitled)
            untypedInput = { resource: uri_1.URI.file('/fake'), forceUntitled: true };
            assert.ok((0, editor_1.isUntitledResourceEditorInput)(untypedInput));
            input = service.createTextEditor(untypedInput);
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            // Untyped Input (untitled with custom resource)
            const provider = instantiationService.createInstance(FileServiceProvider, 'untitled-custom');
            input = service.createTextEditor({ resource: uri_1.URI.parse('untitled-custom://some/path'), forceUntitled: true, options: { selection: { startLineNumber: 1, startColumn: 1 } } });
            assert(input instanceof untitledTextEditorInput_1.UntitledTextEditorInput);
            assert.ok(input.model.hasAssociatedFilePath);
            provider.dispose();
            // Untyped Input (resource)
            input = service.createTextEditor({ resource: uri_1.URI.parse('custom:resource') });
            assert(input instanceof textResourceEditorInput_1.TextResourceEditorInput);
            // Untyped Input (diff)
            const resourceDiffInput = {
                modified: { resource: utils_1.toResource.call(this, '/modified.html') },
                original: { resource: utils_1.toResource.call(this, '/original.html') }
            };
            assert.strictEqual((0, editor_1.isResourceDiffEditorInput)(resourceDiffInput), true);
            input = service.createTextEditor(resourceDiffInput);
            assert(input instanceof diffEditorInput_1.DiffEditorInput);
            assert.strictEqual((_h = input.original.resource) === null || _h === void 0 ? void 0 : _h.toString(), resourceDiffInput.original.resource.toString());
            assert.strictEqual((_j = input.modified.resource) === null || _j === void 0 ? void 0 : _j.toString(), resourceDiffInput.modified.resource.toString());
            const untypedDiffInput = input.toUntyped();
            assert.strictEqual((_k = untypedDiffInput.original.resource) === null || _k === void 0 ? void 0 : _k.toString(), resourceDiffInput.original.resource.toString());
            assert.strictEqual((_l = untypedDiffInput.modified.resource) === null || _l === void 0 ? void 0 : _l.toString(), resourceDiffInput.modified.resource.toString());
            // Untyped Input (side by side)
            const sideBySideResourceInput = {
                primary: { resource: utils_1.toResource.call(this, '/primary.html') },
                secondary: { resource: utils_1.toResource.call(this, '/secondary.html') }
            };
            assert.strictEqual((0, editor_1.isResourceSideBySideEditorInput)(sideBySideResourceInput), true);
            input = service.createTextEditor(sideBySideResourceInput);
            assert(input instanceof sideBySideEditorInput_1.SideBySideEditorInput);
            assert.strictEqual((_m = input.primary.resource) === null || _m === void 0 ? void 0 : _m.toString(), sideBySideResourceInput.primary.resource.toString());
            assert.strictEqual((_o = input.secondary.resource) === null || _o === void 0 ? void 0 : _o.toString(), sideBySideResourceInput.secondary.resource.toString());
            const untypedSideBySideInput = input.toUntyped();
            assert.strictEqual((_p = untypedSideBySideInput.primary.resource) === null || _p === void 0 ? void 0 : _p.toString(), sideBySideResourceInput.primary.resource.toString());
            assert.strictEqual((_q = untypedSideBySideInput.secondary.resource) === null || _q === void 0 ? void 0 : _q.toString(), sideBySideResourceInput.secondary.resource.toString());
            registration.dispose();
        });
        test('createTextEditor- caching', function () {
            const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const service = instantiationService.createInstance(textEditorService_1.TextEditorService);
            // Cached Input (Files)
            const fileResource1 = utils_1.toResource.call(this, '/foo/bar/cache1.js');
            const fileEditorInput1 = service.createTextEditor({ resource: fileResource1 });
            assert.ok(fileEditorInput1);
            const fileResource2 = utils_1.toResource.call(this, '/foo/bar/cache2.js');
            const fileEditorInput2 = service.createTextEditor({ resource: fileResource2 });
            assert.ok(fileEditorInput2);
            assert.notStrictEqual(fileEditorInput1, fileEditorInput2);
            const fileEditorInput1Again = service.createTextEditor({ resource: fileResource1 });
            assert.strictEqual(fileEditorInput1Again, fileEditorInput1);
            fileEditorInput1Again.dispose();
            assert.ok(fileEditorInput1.isDisposed());
            const fileEditorInput1AgainAndAgain = service.createTextEditor({ resource: fileResource1 });
            assert.notStrictEqual(fileEditorInput1AgainAndAgain, fileEditorInput1);
            assert.ok(!fileEditorInput1AgainAndAgain.isDisposed());
            // Cached Input (Resource)
            const resource1 = uri_1.URI.from({ scheme: 'custom', path: '/foo/bar/cache1.js' });
            const input1 = service.createTextEditor({ resource: resource1 });
            assert.ok(input1);
            const resource2 = uri_1.URI.from({ scheme: 'custom', path: '/foo/bar/cache2.js' });
            const input2 = service.createTextEditor({ resource: resource2 });
            assert.ok(input2);
            assert.notStrictEqual(input1, input2);
            const input1Again = service.createTextEditor({ resource: resource1 });
            assert.strictEqual(input1Again, input1);
            input1Again.dispose();
            assert.ok(input1.isDisposed());
            const input1AgainAndAgain = service.createTextEditor({ resource: resource1 });
            assert.notStrictEqual(input1AgainAndAgain, input1);
            assert.ok(!input1AgainAndAgain.isDisposed());
        });
    });
});
//# sourceMappingURL=textEditorService.test.js.map