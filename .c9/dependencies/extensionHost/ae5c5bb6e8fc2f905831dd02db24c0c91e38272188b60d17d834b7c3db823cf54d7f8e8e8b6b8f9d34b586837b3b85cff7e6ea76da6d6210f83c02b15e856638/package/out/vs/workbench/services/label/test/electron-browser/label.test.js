/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/workspace/test/common/testWorkspace", "vs/base/common/uri", "vs/base/common/path", "vs/base/common/platform", "vs/workbench/services/label/common/labelService", "vs/workbench/test/common/workbenchTestServices", "vs/workbench/test/electron-browser/workbenchTestServices", "vs/workbench/test/browser/workbenchTestServices"], function (require, exports, assert, testWorkspace_1, uri_1, path_1, platform_1, labelService_1, workbenchTestServices_1, workbenchTestServices_2, workbenchTestServices_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('URI Label', () => {
        let labelService;
        setup(() => {
            labelService = new labelService_1.LabelService(workbenchTestServices_2.TestEnvironmentService, new workbenchTestServices_1.TestContextService(), new workbenchTestServices_2.TestNativePathService(), new workbenchTestServices_3.TestRemoteAgentService());
        });
        test('file scheme', function () {
            labelService.registerFormatter({
                scheme: 'file',
                formatting: {
                    label: '${path}',
                    separator: path_1.sep,
                    tildify: !platform_1.isWindows,
                    normalizeDriveLetter: platform_1.isWindows
                }
            });
            const uri1 = testWorkspace_1.TestWorkspace.folders[0].uri.with({ path: testWorkspace_1.TestWorkspace.folders[0].uri.path.concat('/a/b/c/d') });
            assert.strictEqual(labelService.getUriLabel(uri1, { relative: true }), platform_1.isWindows ? 'a\\b\\c\\d' : 'a/b/c/d');
            assert.strictEqual(labelService.getUriLabel(uri1, { relative: false }), platform_1.isWindows ? 'C:\\testWorkspace\\a\\b\\c\\d' : '/testWorkspace/a/b/c/d');
            assert.strictEqual(labelService.getUriBasenameLabel(uri1), 'd');
            const uri2 = uri_1.URI.file('c:\\1/2/3');
            assert.strictEqual(labelService.getUriLabel(uri2, { relative: false }), platform_1.isWindows ? 'C:\\1\\2\\3' : '/c:\\1/2/3');
            assert.strictEqual(labelService.getUriBasenameLabel(uri2), '3');
        });
    });
});
//# sourceMappingURL=label.test.js.map