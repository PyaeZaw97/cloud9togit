/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "os", "vs/base/common/network", "vs/base/common/path", "vs/base/common/uri", "vs/base/node/pfs", "vs/base/test/node/testUtils", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/platform/log/common/log", "vs/platform/state/electron-main/stateMainService"], function (require, exports, assert, fs_1, os_1, network_1, path_1, uri_1, pfs_1, testUtils_1, fileService_1, diskFileSystemProvider_1, log_1, stateMainService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('StateMainService', () => {
        let testDir;
        let fileService;
        let logService;
        let diskFileSystemProvider;
        setup(() => {
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'statemainservice');
            logService = new log_1.NullLogService();
            fileService = new fileService_1.FileService(logService);
            diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
            return pfs_1.Promises.mkdir(testDir, { recursive: true });
        });
        teardown(() => {
            fileService.dispose();
            diskFileSystemProvider.dispose();
            return pfs_1.Promises.rm(testDir);
        });
        test('Basics', async function () {
            const storageFile = (0, path_1.join)(testDir, 'storage.json');
            (0, pfs_1.writeFileSync)(storageFile, '');
            let service = new stateMainService_1.FileStorage(uri_1.URI.file(storageFile), logService, fileService);
            await service.init();
            service.setItem('some.key', 'some.value');
            assert.strictEqual(service.getItem('some.key'), 'some.value');
            service.removeItem('some.key');
            assert.strictEqual(service.getItem('some.key', 'some.default'), 'some.default');
            assert.ok(!service.getItem('some.unknonw.key'));
            service.setItem('some.other.key', 'some.other.value');
            await service.close();
            service = new stateMainService_1.FileStorage(uri_1.URI.file(storageFile), logService, fileService);
            await service.init();
            assert.strictEqual(service.getItem('some.other.key'), 'some.other.value');
            service.setItem('some.other.key', 'some.other.value');
            assert.strictEqual(service.getItem('some.other.key'), 'some.other.value');
            service.setItem('some.undefined.key', undefined);
            assert.strictEqual(service.getItem('some.undefined.key', 'some.default'), 'some.default');
            service.setItem('some.null.key', null);
            assert.strictEqual(service.getItem('some.null.key', 'some.default'), 'some.default');
            service.setItems([
                { key: 'some.setItems.key1', data: 'some.value' },
                { key: 'some.setItems.key2', data: 0 },
                { key: 'some.setItems.key3', data: true },
                { key: 'some.setItems.key4', data: null },
                { key: 'some.setItems.key5', data: undefined }
            ]);
            assert.strictEqual(service.getItem('some.setItems.key1'), 'some.value');
            assert.strictEqual(service.getItem('some.setItems.key2'), 0);
            assert.strictEqual(service.getItem('some.setItems.key3'), true);
            assert.strictEqual(service.getItem('some.setItems.key4'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key5'), undefined);
            service.setItems([
                { key: 'some.setItems.key1', data: undefined },
                { key: 'some.setItems.key2', data: undefined },
                { key: 'some.setItems.key3', data: undefined },
                { key: 'some.setItems.key4', data: null },
                { key: 'some.setItems.key5', data: undefined }
            ]);
            assert.strictEqual(service.getItem('some.setItems.key1'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key2'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key3'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key4'), undefined);
            assert.strictEqual(service.getItem('some.setItems.key5'), undefined);
        });
        test('Multiple ops are buffered and applied', async function () {
            const storageFile = (0, path_1.join)(testDir, 'storage.json');
            (0, pfs_1.writeFileSync)(storageFile, '');
            let service = new stateMainService_1.FileStorage(uri_1.URI.file(storageFile), logService, fileService);
            await service.init();
            service.setItem('some.key1', 'some.value1');
            service.setItem('some.key2', 'some.value2');
            service.setItem('some.key3', 'some.value3');
            service.setItem('some.key4', 'some.value4');
            service.removeItem('some.key4');
            assert.strictEqual(service.getItem('some.key1'), 'some.value1');
            assert.strictEqual(service.getItem('some.key2'), 'some.value2');
            assert.strictEqual(service.getItem('some.key3'), 'some.value3');
            assert.strictEqual(service.getItem('some.key4'), undefined);
            await service.close();
            service = new stateMainService_1.FileStorage(uri_1.URI.file(storageFile), logService, fileService);
            await service.init();
            assert.strictEqual(service.getItem('some.key1'), 'some.value1');
            assert.strictEqual(service.getItem('some.key2'), 'some.value2');
            assert.strictEqual(service.getItem('some.key3'), 'some.value3');
            assert.strictEqual(service.getItem('some.key4'), undefined);
        });
        test('Used before init', async function () {
            const storageFile = (0, path_1.join)(testDir, 'storage.json');
            (0, pfs_1.writeFileSync)(storageFile, '');
            let service = new stateMainService_1.FileStorage(uri_1.URI.file(storageFile), logService, fileService);
            service.setItem('some.key1', 'some.value1');
            service.setItem('some.key2', 'some.value2');
            service.setItem('some.key3', 'some.value3');
            service.setItem('some.key4', 'some.value4');
            service.removeItem('some.key4');
            assert.strictEqual(service.getItem('some.key1'), 'some.value1');
            assert.strictEqual(service.getItem('some.key2'), 'some.value2');
            assert.strictEqual(service.getItem('some.key3'), 'some.value3');
            assert.strictEqual(service.getItem('some.key4'), undefined);
            await service.init();
            assert.strictEqual(service.getItem('some.key1'), 'some.value1');
            assert.strictEqual(service.getItem('some.key2'), 'some.value2');
            assert.strictEqual(service.getItem('some.key3'), 'some.value3');
            assert.strictEqual(service.getItem('some.key4'), undefined);
        });
        test('Used after close', async function () {
            const storageFile = (0, path_1.join)(testDir, 'storage.json');
            (0, pfs_1.writeFileSync)(storageFile, '');
            const service = new stateMainService_1.FileStorage(uri_1.URI.file(storageFile), logService, fileService);
            await service.init();
            service.setItem('some.key1', 'some.value1');
            service.setItem('some.key2', 'some.value2');
            service.setItem('some.key3', 'some.value3');
            service.setItem('some.key4', 'some.value4');
            await service.close();
            service.setItem('some.key5', 'some.marker');
            const contents = (0, fs_1.readFileSync)(storageFile).toString();
            assert.ok(contents.includes('some.value1'));
            assert.ok(!contents.includes('some.marker'));
            await service.close();
        });
        test('Closed before init', async function () {
            const storageFile = (0, path_1.join)(testDir, 'storage.json');
            (0, pfs_1.writeFileSync)(storageFile, '');
            const service = new stateMainService_1.FileStorage(uri_1.URI.file(storageFile), logService, fileService);
            service.setItem('some.key1', 'some.value1');
            service.setItem('some.key2', 'some.value2');
            service.setItem('some.key3', 'some.value3');
            service.setItem('some.key4', 'some.value4');
            await service.close();
            const contents = (0, fs_1.readFileSync)(storageFile).toString();
            assert.strictEqual(contents.length, 0);
        });
    });
});
//# sourceMappingURL=state.test.js.map