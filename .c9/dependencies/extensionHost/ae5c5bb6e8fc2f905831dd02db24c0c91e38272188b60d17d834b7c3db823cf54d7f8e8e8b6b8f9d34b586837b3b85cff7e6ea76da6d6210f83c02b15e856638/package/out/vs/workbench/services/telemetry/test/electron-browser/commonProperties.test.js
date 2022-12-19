/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "vs/base/common/path", "os", "vs/workbench/services/telemetry/electron-sandbox/workbenchCommonProperties", "vs/base/test/node/testUtils", "vs/platform/storage/common/storage", "vs/base/node/pfs", "vs/base/common/async", "vs/platform/files/common/fileService", "vs/platform/log/common/log", "vs/base/common/network", "vs/platform/files/node/diskFileSystemProvider"], function (require, exports, assert, fs, path_1, os_1, workbenchCommonProperties_1, testUtils_1, storage_1, pfs_1, async_1, fileService_1, log_1, network_1, diskFileSystemProvider_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Telemetry - common properties', function () {
        const parentDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'telemetryservice');
        const installSource = (0, path_1.join)(parentDir, 'installSource');
        const commit = (undefined);
        const version = (undefined);
        let testStorageService;
        let testFileService;
        let diskFileSystemProvider;
        setup(() => {
            testStorageService = new storage_1.InMemoryStorageService();
            const logService = new log_1.NullLogService();
            testFileService = new fileService_1.FileService(logService);
            diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
            testFileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
        });
        teardown(() => {
            diskFileSystemProvider.dispose();
            return pfs_1.Promises.rm(parentDir);
        });
        test('default', async function () {
            await pfs_1.Promises.mkdir(parentDir, { recursive: true });
            fs.writeFileSync(installSource, 'my.install.source');
            const props = await (0, workbenchCommonProperties_1.resolveWorkbenchCommonProperties)(testStorageService, testFileService, (0, os_1.release)(), (0, os_1.hostname)(), commit, version, 'someMachineId', undefined, installSource);
            assert.ok('commitHash' in props);
            assert.ok('sessionID' in props);
            assert.ok('timestamp' in props);
            assert.ok('common.platform' in props);
            assert.ok('common.nodePlatform' in props);
            assert.ok('common.nodeArch' in props);
            assert.ok('common.timesincesessionstart' in props);
            assert.ok('common.sequence' in props);
            // assert.ok('common.version.shell' in first.data); // only when running on electron
            // assert.ok('common.version.renderer' in first.data);
            assert.ok('common.platformVersion' in props, 'platformVersion');
            assert.ok('version' in props);
            assert.strictEqual(props['common.source'], 'my.install.source');
            assert.ok('common.firstSessionDate' in props, 'firstSessionDate');
            assert.ok('common.lastSessionDate' in props, 'lastSessionDate'); // conditional, see below, 'lastSessionDate'ow
            assert.ok('common.isNewSession' in props, 'isNewSession');
            // machine id et al
            assert.ok('common.machineId' in props, 'machineId');
            fs.unlinkSync(installSource);
            const props_1 = await (0, workbenchCommonProperties_1.resolveWorkbenchCommonProperties)(testStorageService, testFileService, (0, os_1.release)(), (0, os_1.hostname)(), commit, version, 'someMachineId', undefined, installSource);
            assert.ok(!('common.source' in props_1));
        });
        test('lastSessionDate when available', async function () {
            testStorageService.store('telemetry.lastSessionDate', new Date().toUTCString(), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            const props = await (0, workbenchCommonProperties_1.resolveWorkbenchCommonProperties)(testStorageService, testFileService, (0, os_1.release)(), (0, os_1.hostname)(), commit, version, 'someMachineId', undefined, installSource);
            assert.ok('common.lastSessionDate' in props); // conditional, see below
            assert.ok('common.isNewSession' in props);
            assert.strictEqual(props['common.isNewSession'], '0');
        });
        test('values chance on ask', async function () {
            const props = await (0, workbenchCommonProperties_1.resolveWorkbenchCommonProperties)(testStorageService, testFileService, (0, os_1.release)(), (0, os_1.hostname)(), commit, version, 'someMachineId', undefined, installSource);
            let value1 = props['common.sequence'];
            let value2 = props['common.sequence'];
            assert.ok(value1 !== value2, 'seq');
            value1 = props['timestamp'];
            value2 = props['timestamp'];
            assert.ok(value1 !== value2, 'timestamp');
            value1 = props['common.timesincesessionstart'];
            await (0, async_1.timeout)(10);
            value2 = props['common.timesincesessionstart'];
            assert.ok(value1 !== value2, 'timesincesessionstart');
        });
    });
});
//# sourceMappingURL=commonProperties.test.js.map