/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/platform/files/common/files", "vs/base/common/network", "vs/platform/instantiation/common/serviceCollection", "vs/base/node/pfs", "vs/base/common/lifecycle", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/base/test/node/testUtils", "vs/platform/files/node/diskFileSystemProvider", "vs/workbench/services/textfile/test/node/encoding/encoding.test", "vs/workbench/test/electron-browser/workbenchTestServices", "vs/workbench/services/textfile/test/common/textFileService.io.test", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/uriIdentity/common/uriIdentityService"], function (require, exports, os_1, files_1, network_1, serviceCollection_1, pfs_1, lifecycle_1, fileService_1, log_1, testUtils_1, diskFileSystemProvider_1, encoding_test_1, workbenchTestServices_1, textFileService_io_test_1, workingCopyFileService_1, workingCopyService_1, uriIdentityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('Files - NativeTextFileService i/o', function () {
        const disposables = new lifecycle_1.DisposableStore();
        let service;
        let testDir;
        function readFile(path, encoding) {
            return pfs_1.Promises.readFile(path, encoding);
        }
        (0, textFileService_io_test_1.default)({
            setup: async () => {
                const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(disposables);
                const logService = new log_1.NullLogService();
                const fileService = new fileService_1.FileService(logService);
                const fileProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
                disposables.add(fileService.registerProvider(network_1.Schemas.file, fileProvider));
                disposables.add(fileProvider);
                const collection = new serviceCollection_1.ServiceCollection();
                collection.set(files_1.IFileService, fileService);
                collection.set(workingCopyFileService_1.IWorkingCopyFileService, new workingCopyFileService_1.WorkingCopyFileService(fileService, new workingCopyService_1.WorkingCopyService(), instantiationService, new uriIdentityService_1.UriIdentityService(fileService)));
                service = instantiationService.createChild(collection).createInstance(workbenchTestServices_1.TestNativeTextFileServiceWithEncodingOverrides);
                testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'textfileservice');
                const sourceDir = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures');
                await pfs_1.Promises.copy(sourceDir, testDir, { preserveSymlinks: false });
                return { service, testDir };
            },
            teardown: () => {
                service.files.dispose();
                disposables.clear();
                return pfs_1.Promises.rm(testDir);
            },
            exists: pfs_1.Promises.exists,
            stat: pfs_1.Promises.stat,
            readFile,
            detectEncodingByBOM: encoding_test_1.detectEncodingByBOM
        });
    });
});
//# sourceMappingURL=nativeTextFileService.io.test.js.map