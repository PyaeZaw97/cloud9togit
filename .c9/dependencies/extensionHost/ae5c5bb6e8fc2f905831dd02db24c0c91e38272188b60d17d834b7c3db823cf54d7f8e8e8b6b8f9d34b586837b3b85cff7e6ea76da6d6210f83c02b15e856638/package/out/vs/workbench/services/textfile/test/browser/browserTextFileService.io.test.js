/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/log/common/log", "vs/platform/files/common/fileService", "vs/base/common/network", "vs/base/common/lifecycle", "vs/platform/instantiation/common/serviceCollection", "vs/platform/files/common/files", "vs/base/common/uri", "vs/base/common/path", "vs/workbench/services/textfile/common/encoding", "vs/base/common/buffer", "vs/workbench/services/textfile/test/browser/fixtures/files", "vs/workbench/services/textfile/test/common/textFileService.io.test", "vs/base/common/platform", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/uriIdentity/common/uriIdentityService"], function (require, exports, workbenchTestServices_1, log_1, fileService_1, network_1, lifecycle_1, serviceCollection_1, files_1, uri_1, path_1, encoding_1, buffer_1, files_2, textFileService_io_test_1, platform_1, workingCopyFileService_1, workingCopyService_1, uriIdentityService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // optimization: we don't need to run this suite in native environment,
    // because we have nativeTextFileService.io.test.ts for it,
    // so our tests run faster
    if (platform_1.isWeb) {
        suite('Files - BrowserTextFileService i/o', function () {
            const disposables = new lifecycle_1.DisposableStore();
            let service;
            let fileProvider;
            const testDir = 'test';
            (0, textFileService_io_test_1.default)({
                setup: async () => {
                    const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
                    const logService = new log_1.NullLogService();
                    const fileService = new fileService_1.FileService(logService);
                    fileProvider = new workbenchTestServices_1.TestInMemoryFileSystemProvider();
                    disposables.add(fileService.registerProvider(network_1.Schemas.file, fileProvider));
                    disposables.add(fileProvider);
                    const collection = new serviceCollection_1.ServiceCollection();
                    collection.set(files_1.IFileService, fileService);
                    collection.set(workingCopyFileService_1.IWorkingCopyFileService, new workingCopyFileService_1.WorkingCopyFileService(fileService, new workingCopyService_1.WorkingCopyService(), instantiationService, new uriIdentityService_1.UriIdentityService(fileService)));
                    service = instantiationService.createChild(collection).createInstance(workbenchTestServices_1.TestBrowserTextFileServiceWithEncodingOverrides);
                    await fileProvider.mkdir(uri_1.URI.file(testDir));
                    for (let fileName in files_2.default) {
                        await fileProvider.writeFile(uri_1.URI.file((0, path_1.join)(testDir, fileName)), files_2.default[fileName], { create: true, overwrite: false, unlock: false });
                    }
                    return { service, testDir };
                },
                teardown: async () => {
                    service.files.dispose();
                    disposables.clear();
                },
                exists,
                stat,
                readFile,
                detectEncodingByBOM
            });
            async function exists(fsPath) {
                try {
                    await fileProvider.readFile(uri_1.URI.file(fsPath));
                    return true;
                }
                catch (e) {
                    return false;
                }
            }
            async function readFile(fsPath, encoding) {
                const file = await fileProvider.readFile(uri_1.URI.file(fsPath));
                if (!encoding) {
                    return buffer_1.VSBuffer.wrap(file);
                }
                return new TextDecoder((0, encoding_1.toCanonicalName)(encoding)).decode(file);
            }
            async function stat(fsPath) {
                return fileProvider.stat(uri_1.URI.file(fsPath));
            }
            async function detectEncodingByBOM(fsPath) {
                try {
                    const buffer = await readFile(fsPath);
                    return (0, encoding_1.detectEncodingByBOMFromBuffer)(buffer.slice(0, 3), 3);
                }
                catch (error) {
                    return null; // ignore errors (like file not found)
                }
            }
        });
    }
});
//# sourceMappingURL=browserTextFileService.io.test.js.map