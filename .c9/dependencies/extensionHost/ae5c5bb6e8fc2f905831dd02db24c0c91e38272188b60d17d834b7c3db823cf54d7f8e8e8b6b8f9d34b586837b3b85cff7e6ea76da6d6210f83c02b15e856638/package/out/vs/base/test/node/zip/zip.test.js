/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "os", "vs/base/common/async", "vs/base/common/path", "vs/base/node/pfs", "vs/base/node/zip", "vs/base/test/node/testUtils"], function (require, exports, assert, os_1, async_1, path, pfs_1, zip_1, testUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Zip', () => {
        let testDir;
        setup(() => {
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'zip');
            return pfs_1.Promises.mkdir(testDir, { recursive: true });
        });
        teardown(() => {
            return pfs_1.Promises.rm(testDir);
        });
        test('extract should handle directories', async () => {
            const fixtures = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures');
            const fixture = path.join(fixtures, 'extract.zip');
            await (0, async_1.createCancelablePromise)(token => (0, zip_1.extract)(fixture, testDir, {}, token));
            const doesExist = await pfs_1.Promises.exists(path.join(testDir, 'extension'));
            assert(doesExist);
        });
    });
});
//# sourceMappingURL=zip.test.js.map