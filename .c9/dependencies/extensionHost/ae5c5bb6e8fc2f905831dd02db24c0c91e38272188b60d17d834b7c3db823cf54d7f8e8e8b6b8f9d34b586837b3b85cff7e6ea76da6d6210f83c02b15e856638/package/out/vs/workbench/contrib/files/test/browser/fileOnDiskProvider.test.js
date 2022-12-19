/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/contrib/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/lifecycle"], function (require, exports, assert, uri_1, workbenchTestServices_1, files_1, textfiles_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Files - FileOnDiskContentProvider', () => {
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
        test('provideTextContent', async () => {
            const provider = instantiationService.createInstance(files_1.TextFileContentProvider);
            const uri = uri_1.URI.parse('testFileOnDiskContentProvider://foo');
            const content = await provider.provideTextContent(uri.with({ scheme: 'conflictResolution', query: JSON.stringify({ scheme: uri.scheme }) }));
            assert.ok(content);
            assert.strictEqual((0, textfiles_1.snapshotToString)(content.createSnapshot()), 'Hello Html');
            assert.strictEqual(accessor.fileService.getLastReadFileUri().scheme, uri.scheme);
            assert.strictEqual(accessor.fileService.getLastReadFileUri().path, uri.path);
        });
    });
});
//# sourceMappingURL=fileOnDiskProvider.test.js.map