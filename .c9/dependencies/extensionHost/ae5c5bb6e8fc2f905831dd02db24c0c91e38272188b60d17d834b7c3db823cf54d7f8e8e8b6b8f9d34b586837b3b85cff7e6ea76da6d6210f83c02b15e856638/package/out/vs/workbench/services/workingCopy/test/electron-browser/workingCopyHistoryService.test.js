/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/workbench/test/electron-browser/workbenchTestServices", "vs/workbench/test/common/workbenchTestServices", "vs/platform/log/common/log", "vs/platform/files/common/fileService", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/network", "vs/base/test/node/testUtils", "os", "vs/base/common/path", "vs/base/node/pfs", "vs/base/common/uri", "vs/base/common/cancellation", "fs", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/services/label/common/labelService", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/services/workingCopy/electron-sandbox/workingCopyHistoryService", "vs/base/common/resources", "vs/base/common/arrays"], function (require, exports, assert, environmentService_1, workbenchTestServices_1, workbenchTestServices_2, log_1, fileService_1, diskFileSystemProvider_1, network_1, testUtils_1, os_1, path_1, pfs_1, uri_1, cancellation_1, fs_1, uriIdentityService_1, labelService_1, workbenchTestServices_3, testConfigurationService_1, workingCopyHistoryService_1, resources_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestWorkingCopyHistoryService = void 0;
    class TestWorkbenchEnvironmentService extends environmentService_1.NativeWorkbenchEnvironmentService {
        constructor(testDir) {
            super(Object.assign(Object.assign({}, workbenchTestServices_1.TestNativeWindowConfiguration), { 'user-data-dir': testDir }), workbenchTestServices_2.TestProductService);
            this.testDir = testDir;
        }
        get localHistoryHome() {
            return (0, resources_1.joinPath)(uri_1.URI.file(this.testDir), 'History');
        }
    }
    class TestWorkingCopyHistoryService extends workingCopyHistoryService_1.NativeWorkingCopyHistoryService {
        constructor(testDir) {
            const environmentService = new TestWorkbenchEnvironmentService(testDir);
            const logService = new log_1.NullLogService();
            const fileService = new fileService_1.FileService(logService);
            const diskFileSystemProvider = new diskFileSystemProvider_1.DiskFileSystemProvider(logService);
            fileService.registerProvider(network_1.Schemas.file, diskFileSystemProvider);
            const remoteAgentService = new workbenchTestServices_3.TestRemoteAgentService();
            const uriIdentityService = new uriIdentityService_1.UriIdentityService(fileService);
            const labelService = new labelService_1.LabelService(environmentService, new workbenchTestServices_2.TestContextService(), new workbenchTestServices_1.TestNativePathService(), new workbenchTestServices_3.TestRemoteAgentService());
            const lifecycleService = new workbenchTestServices_3.TestLifecycleService();
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            super(fileService, remoteAgentService, environmentService, uriIdentityService, labelService, lifecycleService, logService, configurationService);
            this._fileService = fileService;
            this._configurationService = configurationService;
            this._lifecycleService = lifecycleService;
        }
    }
    exports.TestWorkingCopyHistoryService = TestWorkingCopyHistoryService;
    (0, testUtils_1.flakySuite)('WorkingCopyHistoryService', () => {
        let testDir;
        let historyHome;
        let workHome;
        let service;
        let testFile1Path;
        let testFile2Path;
        let testFile3Path;
        const testFile1PathContents = 'Hello Foo';
        const testFile2PathContents = [
            'Lorem ipsum ',
            'dolor öäü sit amet ',
            'adipiscing ßß elit',
            'consectetur '
        ].join('');
        const testFile3PathContents = 'Hello Bar';
        setup(async () => {
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'workingcopyhistoryservice');
            historyHome = (0, path_1.join)(testDir, 'User', 'History');
            workHome = (0, path_1.join)(testDir, 'work');
            service = new TestWorkingCopyHistoryService(testDir);
            await pfs_1.Promises.mkdir(historyHome, { recursive: true });
            await pfs_1.Promises.mkdir(workHome, { recursive: true });
            testFile1Path = (0, path_1.join)(workHome, 'foo.txt');
            testFile2Path = (0, path_1.join)(workHome, 'bar.txt');
            testFile3Path = (0, path_1.join)(workHome, 'foo-bar.txt');
            await pfs_1.Promises.writeFile(testFile1Path, testFile1PathContents);
            await pfs_1.Promises.writeFile(testFile2Path, testFile2PathContents);
            await pfs_1.Promises.writeFile(testFile3Path, testFile3PathContents);
        });
        let increasingTimestampCounter = 1;
        async function addEntry(descriptor, token, expectEntryAdded = true) {
            const entry = await service.addEntry(Object.assign(Object.assign({}, descriptor), { timestamp: increasingTimestampCounter++ // very important to get tests to not be flaky with stable sort order
             }), token);
            if (expectEntryAdded) {
                assert.ok(entry, 'Unexpected undefined local history entry');
                assert.strictEqual((0, fs_1.existsSync)(entry.location.fsPath), true, 'Unexpected local history not stored on disk');
            }
            return entry;
        }
        teardown(() => {
            service.dispose();
            return pfs_1.Promises.rm(testDir);
        });
        test('addEntry', async () => {
            let addEvents = [];
            service.onDidAddEntry(e => addEvents.push(e));
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const workingCopy2 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile2Path));
            // Add Entry works
            const entry1A = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            const entry2A = await addEntry({ resource: workingCopy2.resource, source: 'My Source' }, cancellation_1.CancellationToken.None);
            assert.strictEqual((0, fs_1.readFileSync)(entry1A.location.fsPath).toString(), testFile1PathContents);
            assert.strictEqual((0, fs_1.readFileSync)(entry2A.location.fsPath).toString(), testFile2PathContents);
            assert.strictEqual(addEvents.length, 2);
            assert.strictEqual(addEvents[0].entry.workingCopy.resource.toString(), workingCopy1.resource.toString());
            assert.strictEqual(addEvents[1].entry.workingCopy.resource.toString(), workingCopy2.resource.toString());
            assert.strictEqual(addEvents[1].entry.source, 'My Source');
            const entry1B = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            const entry2B = await addEntry({ resource: workingCopy2.resource }, cancellation_1.CancellationToken.None);
            assert.strictEqual((0, fs_1.readFileSync)(entry1B.location.fsPath).toString(), testFile1PathContents);
            assert.strictEqual((0, fs_1.readFileSync)(entry2B.location.fsPath).toString(), testFile2PathContents);
            assert.strictEqual(addEvents.length, 4);
            assert.strictEqual(addEvents[2].entry.workingCopy.resource.toString(), workingCopy1.resource.toString());
            assert.strictEqual(addEvents[3].entry.workingCopy.resource.toString(), workingCopy2.resource.toString());
            // Cancellation works
            const cts = new cancellation_1.CancellationTokenSource();
            const entry1CPromise = addEntry({ resource: workingCopy1.resource }, cts.token, false);
            cts.dispose(true);
            const entry1C = await entry1CPromise;
            assert.ok(!entry1C);
            assert.strictEqual(addEvents.length, 4);
            // Invalid working copies are ignored
            const workingCopy3 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile2Path).with({ scheme: 'unsupported' }));
            const entry3A = await addEntry({ resource: workingCopy3.resource }, cancellation_1.CancellationToken.None, false);
            assert.ok(!entry3A);
            assert.strictEqual(addEvents.length, 4);
        });
        test('renameEntry', async () => {
            let changeEvents = [];
            service.onDidChangeEntry(e => changeEvents.push(e));
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const entry = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource, source: 'My Source' }, cancellation_1.CancellationToken.None);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            await service.updateEntry(entry, { source: 'Hello Rename' }, cancellation_1.CancellationToken.None);
            assert.strictEqual(changeEvents.length, 1);
            assert.strictEqual(changeEvents[0].entry, entry);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries[0].source, 'Hello Rename');
            // Simulate shutdown
            const event = new workbenchTestServices_3.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from disk fresh and verify again
            service.dispose();
            service = new TestWorkingCopyHistoryService(testDir);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            assert.strictEqual(entries[0].source, 'Hello Rename');
        });
        test('removeEntry', async () => {
            let removeEvents = [];
            service.onDidRemoveEntry(e => removeEvents.push(e));
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource, source: 'My Source' }, cancellation_1.CancellationToken.None);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
            let removed = await service.removeEntry(entry2, cancellation_1.CancellationToken.None);
            assert.strictEqual(removed, true);
            assert.strictEqual(removeEvents.length, 1);
            assert.strictEqual(removeEvents[0].entry, entry2);
            // Cannot remove same entry again
            removed = await service.removeEntry(entry2, cancellation_1.CancellationToken.None);
            assert.strictEqual(removed, false);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            // Simulate shutdown
            const event = new workbenchTestServices_3.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from disk fresh and verify again
            service.dispose();
            service = new TestWorkingCopyHistoryService(testDir);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
        });
        test('removeEntry - deletes history entries folder when last entry removed', async () => {
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            let entry = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            let event = new workbenchTestServices_3.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from disk fresh and verify again
            service.dispose();
            service = new TestWorkingCopyHistoryService(testDir);
            assert.strictEqual((0, fs_1.existsSync)((0, path_1.dirname)(entry.location.fsPath)), true);
            entry = (0, arrays_1.firstOrDefault)(await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None));
            assert.ok(entry);
            await service.removeEntry(entry, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            event = new workbenchTestServices_3.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from disk fresh and verify again
            service.dispose();
            service = new TestWorkingCopyHistoryService(testDir);
            assert.strictEqual((0, fs_1.existsSync)((0, path_1.dirname)(entry.location.fsPath)), false);
        });
        test('removeAll', async () => {
            let removed = false;
            service.onDidRemoveEntries(() => removed = true);
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const workingCopy2 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile2Path));
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy2.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy2.resource, source: 'My Source' }, cancellation_1.CancellationToken.None);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 2);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 2);
            await service.removeAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(removed, true);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            // Simulate shutdown
            const event = new workbenchTestServices_3.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from disk fresh and verify again
            service.dispose();
            service = new TestWorkingCopyHistoryService(testDir);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
        });
        test('getEntries - simple', async () => {
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const workingCopy2 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile2Path));
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            const entry1 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 1);
            assertEntryEqual(entries[0], entry1);
            const entry2 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 2);
            assertEntryEqual(entries[1], entry2);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            const entry3 = await addEntry({ resource: workingCopy2.resource, source: 'other-test-source' }, cancellation_1.CancellationToken.None);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 1);
            assertEntryEqual(entries[0], entry3);
        });
        test('getEntries - metadata preserved when stored', async () => {
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const workingCopy2 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile2Path));
            const entry1 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy2.resource }, cancellation_1.CancellationToken.None);
            const entry3 = await addEntry({ resource: workingCopy2.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            const event = new workbenchTestServices_3.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from disk fresh and verify again
            service.dispose();
            service = new TestWorkingCopyHistoryService(testDir);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 1);
            assertEntryEqual(entries[0], entry1);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 2);
            assertEntryEqual(entries[0], entry2);
            assertEntryEqual(entries[1], entry3);
        });
        test('getEntries - corrupt meta.json is no problem', async () => {
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const entry1 = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            const event = new workbenchTestServices_3.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from disk fresh and verify again
            service.dispose();
            service = new TestWorkingCopyHistoryService(testDir);
            const metaFile = (0, path_1.join)((0, path_1.dirname)(entry1.location.fsPath), 'entries.json');
            assert.ok((0, fs_1.existsSync)(metaFile));
            (0, fs_1.unlinkSync)(metaFile);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 1);
            assertEntryEqual(entries[0], entry1, false /* skip timestamp that is unreliable when entries.json is gone */);
        });
        test('getEntries - missing entries from meta.json is no problem', async () => {
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const entry1 = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            const event = new workbenchTestServices_3.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from disk fresh and verify again
            service.dispose();
            service = new TestWorkingCopyHistoryService(testDir);
            (0, fs_1.unlinkSync)(entry1.location.fsPath);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 1);
            assertEntryEqual(entries[0], entry2);
        });
        test('getEntries - in-memory and on-disk entries are merged', async () => {
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const entry1 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy1.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            const event = new workbenchTestServices_3.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from disk fresh and verify again
            service.dispose();
            service = new TestWorkingCopyHistoryService(testDir);
            const entry3 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry4 = await addEntry({ resource: workingCopy1.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
            assertEntryEqual(entries[0], entry1);
            assertEntryEqual(entries[1], entry2);
            assertEntryEqual(entries[2], entry3);
            assertEntryEqual(entries[3], entry4);
        });
        test('getEntries - configured max entries respected', async () => {
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            const entry3 = await addEntry({ resource: workingCopy1.resource, source: 'Test source' }, cancellation_1.CancellationToken.None);
            const entry4 = await addEntry({ resource: workingCopy1.resource }, cancellation_1.CancellationToken.None);
            service._configurationService.setUserConfiguration('workbench.localHistory.maxFileEntries', 2);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 2);
            assertEntryEqual(entries[0], entry3);
            assertEntryEqual(entries[1], entry4);
            service._configurationService.setUserConfiguration('workbench.localHistory.maxFileEntries', 4);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
            service._configurationService.setUserConfiguration('workbench.localHistory.maxFileEntries', 5);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
        });
        test('getAll', async () => {
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const workingCopy2 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile2Path));
            let resources = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(resources.length, 0);
            await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            resources = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(resources.length, 2);
            for (const resource of resources) {
                if (resource.toString() !== workingCopy1.resource.toString() && resource.toString() !== workingCopy2.resource.toString()) {
                    assert.fail(`Unexpected history resource: ${resource.toString()}`);
                }
            }
            // Simulate shutdown
            const event = new workbenchTestServices_3.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from disk fresh and verify again
            service.dispose();
            service = new TestWorkingCopyHistoryService(testDir);
            const workingCopy3 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile3Path));
            await addEntry({ resource: workingCopy3.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            resources = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(resources.length, 3);
            for (const resource of resources) {
                if (resource.toString() !== workingCopy1.resource.toString() && resource.toString() !== workingCopy2.resource.toString() && resource.toString() !== workingCopy3.resource.toString()) {
                    assert.fail(`Unexpected history resource: ${resource.toString()}`);
                }
            }
        });
        test('getAll - ignores resource when no entries exist', async () => {
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const entry = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            let resources = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(resources.length, 1);
            await service.removeEntry(entry, cancellation_1.CancellationToken.None);
            resources = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(resources.length, 0);
            // Simulate shutdown
            const event = new workbenchTestServices_3.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            // Resolve from disk fresh and verify again
            service.dispose();
            service = new TestWorkingCopyHistoryService(testDir);
            resources = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(resources.length, 0);
        });
        function assertEntryEqual(entryA, entryB, assertTimestamp = true) {
            assert.strictEqual(entryA.id, entryB.id);
            assert.strictEqual(entryA.location.toString(), entryB.location.toString());
            if (assertTimestamp) {
                assert.strictEqual(entryA.timestamp, entryB.timestamp);
            }
            assert.strictEqual(entryA.source, entryB.source);
            assert.strictEqual(entryA.workingCopy.name, entryB.workingCopy.name);
            assert.strictEqual(entryA.workingCopy.resource.toString(), entryB.workingCopy.resource.toString());
        }
        test('entries cleaned up on shutdown', async () => {
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const entry1 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy1.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            const entry3 = await addEntry({ resource: workingCopy1.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            const entry4 = await addEntry({ resource: workingCopy1.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            service._configurationService.setUserConfiguration('workbench.localHistory.maxFileEntries', 2);
            // Simulate shutdown
            let event = new workbenchTestServices_3.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            assert.ok(!(0, fs_1.existsSync)(entry1.location.fsPath));
            assert.ok(!(0, fs_1.existsSync)(entry2.location.fsPath));
            assert.ok((0, fs_1.existsSync)(entry3.location.fsPath));
            assert.ok((0, fs_1.existsSync)(entry4.location.fsPath));
            // Resolve from disk fresh and verify again
            service.dispose();
            service = new TestWorkingCopyHistoryService(testDir);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 2);
            assertEntryEqual(entries[0], entry3);
            assertEntryEqual(entries[1], entry4);
            service._configurationService.setUserConfiguration('workbench.localHistory.maxFileEntries', 3);
            const entry5 = await addEntry({ resource: workingCopy1.resource, source: 'other-source' }, cancellation_1.CancellationToken.None);
            // Simulate shutdown
            event = new workbenchTestServices_3.TestWillShutdownEvent();
            service._lifecycleService.fireWillShutdown(event);
            await Promise.allSettled(event.value);
            assert.ok((0, fs_1.existsSync)(entry3.location.fsPath));
            assert.ok((0, fs_1.existsSync)(entry4.location.fsPath));
            assert.ok((0, fs_1.existsSync)(entry5.location.fsPath));
            // Resolve from disk fresh and verify again
            service.dispose();
            service = new TestWorkingCopyHistoryService(testDir);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            assertEntryEqual(entries[0], entry3);
            assertEntryEqual(entries[1], entry4);
            assertEntryEqual(entries[2], entry5);
        });
        test('entries are merged when source is same', async () => {
            let replaced = undefined;
            service.onDidReplaceEntry(e => replaced = e.entry);
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            service._configurationService.setUserConfiguration('workbench.localHistory.mergeWindow', 1);
            const entry1 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            assert.strictEqual(replaced, undefined);
            const entry2 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            assert.strictEqual(replaced, entry1);
            const entry3 = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            assert.strictEqual(replaced, entry2);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 1);
            assertEntryEqual(entries[0], entry3);
            service._configurationService.setUserConfiguration('workbench.localHistory.mergeWindow', undefined);
            await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
        });
        test('move entries (file rename)', async () => {
            const workingCopy = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const entry1 = await addEntry({ resource: workingCopy.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry3 = await addEntry({ resource: workingCopy.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            let entries = await service.getEntries(workingCopy.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            const renamedWorkingCopyResource = (0, resources_1.joinPath)((0, resources_1.dirname)(workingCopy.resource), 'renamed.txt');
            await service._fileService.move(workingCopy.resource, renamedWorkingCopyResource);
            const result = await service.moveEntries(workingCopy.resource, renamedWorkingCopyResource);
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].toString(), renamedWorkingCopyResource.toString());
            entries = await service.getEntries(workingCopy.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await service.getEntries(renamedWorkingCopyResource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
            assert.strictEqual(entries[0].id, entry1.id);
            assert.strictEqual(entries[0].timestamp, entry1.timestamp);
            assert.strictEqual(entries[0].source, entry1.source);
            assert.notStrictEqual(entries[0].location, entry1.location);
            assert.strictEqual(entries[0].workingCopy.resource.toString(), renamedWorkingCopyResource.toString());
            assert.strictEqual(entries[1].id, entry2.id);
            assert.strictEqual(entries[1].timestamp, entry2.timestamp);
            assert.strictEqual(entries[1].source, entry2.source);
            assert.notStrictEqual(entries[1].location, entry2.location);
            assert.strictEqual(entries[1].workingCopy.resource.toString(), renamedWorkingCopyResource.toString());
            assert.strictEqual(entries[2].id, entry3.id);
            assert.strictEqual(entries[2].timestamp, entry3.timestamp);
            assert.strictEqual(entries[2].source, entry3.source);
            assert.notStrictEqual(entries[2].location, entry3.location);
            assert.strictEqual(entries[2].workingCopy.resource.toString(), renamedWorkingCopyResource.toString());
            const all = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(all.length, 1);
            assert.strictEqual(all[0].toString(), renamedWorkingCopyResource.toString());
        });
        test('entries moved (folder rename)', async () => {
            const workingCopy1 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const workingCopy2 = new workbenchTestServices_2.TestWorkingCopy(uri_1.URI.file(testFile2Path));
            const entry1A = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2A = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry3A = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry1B = await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2B = await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry3B = await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            let entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            const renamedWorkHome = (0, resources_1.joinPath)((0, resources_1.dirname)(uri_1.URI.file(workHome)), 'renamed');
            await service._fileService.move(uri_1.URI.file(workHome), renamedWorkHome);
            const resources = await service.moveEntries(uri_1.URI.file(workHome), renamedWorkHome);
            const renamedWorkingCopy1Resource = (0, resources_1.joinPath)(renamedWorkHome, (0, resources_1.basename)(workingCopy1.resource));
            const renamedWorkingCopy2Resource = (0, resources_1.joinPath)(renamedWorkHome, (0, resources_1.basename)(workingCopy2.resource));
            assert.strictEqual(resources.length, 2);
            for (const resource of resources) {
                if (resource.toString() !== renamedWorkingCopy1Resource.toString() && resource.toString() !== renamedWorkingCopy2Resource.toString()) {
                    assert.fail(`Unexpected history resource: ${resource.toString()}`);
                }
            }
            entries = await service.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await service.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await service.getEntries(renamedWorkingCopy1Resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
            assert.strictEqual(entries[0].id, entry1A.id);
            assert.strictEqual(entries[0].timestamp, entry1A.timestamp);
            assert.strictEqual(entries[0].source, entry1A.source);
            assert.notStrictEqual(entries[0].location, entry1A.location);
            assert.strictEqual(entries[0].workingCopy.resource.toString(), renamedWorkingCopy1Resource.toString());
            assert.strictEqual(entries[1].id, entry2A.id);
            assert.strictEqual(entries[1].timestamp, entry2A.timestamp);
            assert.strictEqual(entries[1].source, entry2A.source);
            assert.notStrictEqual(entries[1].location, entry2A.location);
            assert.strictEqual(entries[1].workingCopy.resource.toString(), renamedWorkingCopy1Resource.toString());
            assert.strictEqual(entries[2].id, entry3A.id);
            assert.strictEqual(entries[2].timestamp, entry3A.timestamp);
            assert.strictEqual(entries[2].source, entry3A.source);
            assert.notStrictEqual(entries[2].location, entry3A.location);
            assert.strictEqual(entries[2].workingCopy.resource.toString(), renamedWorkingCopy1Resource.toString());
            entries = await service.getEntries(renamedWorkingCopy2Resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 4);
            assert.strictEqual(entries[0].id, entry1B.id);
            assert.strictEqual(entries[0].timestamp, entry1B.timestamp);
            assert.strictEqual(entries[0].source, entry1B.source);
            assert.notStrictEqual(entries[0].location, entry1B.location);
            assert.strictEqual(entries[0].workingCopy.resource.toString(), renamedWorkingCopy2Resource.toString());
            assert.strictEqual(entries[1].id, entry2B.id);
            assert.strictEqual(entries[1].timestamp, entry2B.timestamp);
            assert.strictEqual(entries[1].source, entry2B.source);
            assert.notStrictEqual(entries[1].location, entry2B.location);
            assert.strictEqual(entries[1].workingCopy.resource.toString(), renamedWorkingCopy2Resource.toString());
            assert.strictEqual(entries[2].id, entry3B.id);
            assert.strictEqual(entries[2].timestamp, entry3B.timestamp);
            assert.strictEqual(entries[2].source, entry3B.source);
            assert.notStrictEqual(entries[2].location, entry3B.location);
            assert.strictEqual(entries[2].workingCopy.resource.toString(), renamedWorkingCopy2Resource.toString());
            const all = await service.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(all.length, 2);
            for (const resource of all) {
                if (resource.toString() !== renamedWorkingCopy1Resource.toString() && resource.toString() !== renamedWorkingCopy2Resource.toString()) {
                    assert.fail(`Unexpected history resource: ${resource.toString()}`);
                }
            }
        });
    });
});
//# sourceMappingURL=workingCopyHistoryService.test.js.map