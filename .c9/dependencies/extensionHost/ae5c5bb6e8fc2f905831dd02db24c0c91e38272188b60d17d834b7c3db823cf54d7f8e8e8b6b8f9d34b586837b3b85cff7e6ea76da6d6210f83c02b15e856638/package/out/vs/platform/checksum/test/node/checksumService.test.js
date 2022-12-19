/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/network", "vs/base/common/uri", "vs/base/test/node/testUtils", "vs/platform/checksum/node/checksumService", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/log/common/log"], function (require, exports, assert, network_1, uri_1, testUtils_1, checksumService_1, fileService_1, diskFileSystemProvider_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Checksum Service', () => {
        let diskFileSystemProvider;
        let fileService;
        setup(() => {
            const logService = new log_1.NullLogService();
            fileService = new fileService_1.FileService(logService);
            diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
        });
        teardown(() => {
            diskFileSystemProvider.dispose();
            fileService.dispose();
        });
        test('checksum', async () => {
            const checksumService = new checksumService_1.ChecksumService(fileService);
            const checksum = await checksumService.checksum(uri_1.URI.file((0, testUtils_1.getPathFromAmdModule)(require, './fixtures/lorem.txt')));
            assert.ok(checksum === '8mi5KF8kcb817zmlal1kZA' || checksum === 'DnUKbJ1bHPPNZoHgHV25sg'); // depends on line endings git config
        });
    });
});
//# sourceMappingURL=checksumService.test.js.map