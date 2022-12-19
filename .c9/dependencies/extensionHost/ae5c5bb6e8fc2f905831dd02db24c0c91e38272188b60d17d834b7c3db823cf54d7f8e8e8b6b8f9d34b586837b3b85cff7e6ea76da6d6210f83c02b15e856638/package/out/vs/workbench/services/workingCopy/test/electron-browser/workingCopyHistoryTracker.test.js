/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/base/test/common/testUtils", "vs/workbench/test/common/workbenchTestServices", "vs/base/test/node/testUtils", "os", "vs/base/common/path", "vs/base/node/pfs", "vs/base/common/uri", "vs/workbench/services/workingCopy/test/electron-browser/workingCopyHistoryService.test", "vs/workbench/services/workingCopy/common/workingCopyHistoryTracker", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/uriIdentity/common/uriIdentityService", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/async", "vs/base/common/network", "vs/base/common/resources", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/notification/test/common/testNotificationService", "vs/base/common/cancellation", "vs/base/common/types"], function (require, exports, assert, event_1, testUtils_1, workbenchTestServices_1, testUtils_2, os_1, path_1, pfs_1, uri_1, workingCopyHistoryService_test_1, workingCopyHistoryTracker_1, workingCopyService_1, uriIdentityService_1, workbenchTestServices_2, async_1, network_1, resources_1, undoRedoService_1, testDialogService_1, testNotificationService_1, cancellation_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, testUtils_1.flakySuite)('WorkingCopyHistoryTracker', () => {
        let testDir;
        let historyHome;
        let workHome;
        let workingCopyHistoryService;
        let workingCopyService;
        let fileService;
        let configurationService;
        let tracker;
        let testFile1Path;
        let testFile2Path;
        const testFile1PathContents = 'Hello Foo';
        const testFile2PathContents = [
            'Lorem ipsum ',
            'dolor öäü sit amet ',
            'adipiscing ßß elit',
            'consectetur '
        ].join('').repeat(1000);
        let increasingTimestampCounter = 1;
        async function addEntry(descriptor, token) {
            const entry = await workingCopyHistoryService.addEntry(Object.assign(Object.assign({}, descriptor), { timestamp: increasingTimestampCounter++ // very important to get tests to not be flaky with stable sort order
             }), token);
            return (0, types_1.assertIsDefined)(entry);
        }
        setup(async () => {
            testDir = (0, testUtils_2.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'workingcopyhistorytracker');
            historyHome = (0, path_1.join)(testDir, 'User', 'History');
            workHome = (0, path_1.join)(testDir, 'work');
            workingCopyHistoryService = new workingCopyHistoryService_test_1.TestWorkingCopyHistoryService(testDir);
            workingCopyService = new workingCopyService_1.WorkingCopyService();
            fileService = workingCopyHistoryService._fileService;
            configurationService = workingCopyHistoryService._configurationService;
            tracker = createTracker();
            await pfs_1.Promises.mkdir(historyHome, { recursive: true });
            await pfs_1.Promises.mkdir(workHome, { recursive: true });
            testFile1Path = (0, path_1.join)(workHome, 'foo.txt');
            testFile2Path = (0, path_1.join)(workHome, 'bar.txt');
            await pfs_1.Promises.writeFile(testFile1Path, testFile1PathContents);
            await pfs_1.Promises.writeFile(testFile2Path, testFile2PathContents);
        });
        function createTracker() {
            return new workingCopyHistoryTracker_1.WorkingCopyHistoryTracker(workingCopyService, workingCopyHistoryService, new uriIdentityService_1.UriIdentityService(new workbenchTestServices_2.TestFileService()), new workbenchTestServices_2.TestPathService(undefined, network_1.Schemas.file), configurationService, new undoRedoService_1.UndoRedoService(new testDialogService_1.TestDialogService(), new testNotificationService_1.TestNotificationService()), new workbenchTestServices_1.TestContextService(), workingCopyHistoryService._fileService);
        }
        teardown(() => {
            workingCopyHistoryService.dispose();
            workingCopyService.dispose();
            tracker.dispose();
            return pfs_1.Promises.rm(testDir);
        });
        test('history entry added on save', async () => {
            const workingCopy1 = new workbenchTestServices_1.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const workingCopy2 = new workbenchTestServices_1.TestWorkingCopy(uri_1.URI.file(testFile2Path));
            const stat1 = await fileService.resolve(workingCopy1.resource, { resolveMetadata: true });
            const stat2 = await fileService.resolve(workingCopy2.resource, { resolveMetadata: true });
            workingCopyService.registerWorkingCopy(workingCopy1);
            workingCopyService.registerWorkingCopy(workingCopy2);
            const saveResult = new async_1.DeferredPromise();
            let addedCounter = 0;
            workingCopyHistoryService.onDidAddEntry(e => {
                if ((0, resources_1.isEqual)(e.entry.workingCopy.resource, workingCopy1.resource) || (0, resources_1.isEqual)(e.entry.workingCopy.resource, workingCopy2.resource)) {
                    addedCounter++;
                    if (addedCounter === 2) {
                        saveResult.complete();
                    }
                }
            });
            await workingCopy1.save(undefined, stat1);
            await workingCopy2.save(undefined, stat2);
            await saveResult.p;
        });
        test('history entry skipped when setting disabled (globally)', async () => {
            configurationService.setUserConfiguration('workbench.localHistory.enabled', false, uri_1.URI.file(testFile1Path));
            return assertNoLocalHistoryEntryAddedWithSettingsConfigured();
        });
        test('history entry skipped when setting disabled (exclude)', () => {
            configurationService.setUserConfiguration('workbench.localHistory.exclude', { '**/foo.txt': true });
            // Recreate to apply settings
            tracker.dispose();
            tracker = createTracker();
            return assertNoLocalHistoryEntryAddedWithSettingsConfigured();
        });
        test('history entry skipped when too large', async () => {
            configurationService.setUserConfiguration('workbench.localHistory.maxFileSize', 0, uri_1.URI.file(testFile1Path));
            return assertNoLocalHistoryEntryAddedWithSettingsConfigured();
        });
        async function assertNoLocalHistoryEntryAddedWithSettingsConfigured() {
            const workingCopy1 = new workbenchTestServices_1.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const workingCopy2 = new workbenchTestServices_1.TestWorkingCopy(uri_1.URI.file(testFile2Path));
            const stat1 = await fileService.resolve(workingCopy1.resource, { resolveMetadata: true });
            const stat2 = await fileService.resolve(workingCopy2.resource, { resolveMetadata: true });
            workingCopyService.registerWorkingCopy(workingCopy1);
            workingCopyService.registerWorkingCopy(workingCopy2);
            const saveResult = new async_1.DeferredPromise();
            workingCopyHistoryService.onDidAddEntry(e => {
                if ((0, resources_1.isEqual)(e.entry.workingCopy.resource, workingCopy1.resource)) {
                    assert.fail('Unexpected working copy history entry: ' + e.entry.workingCopy.resource.toString());
                }
                if ((0, resources_1.isEqual)(e.entry.workingCopy.resource, workingCopy2.resource)) {
                    saveResult.complete();
                }
            });
            await workingCopy1.save(undefined, stat1);
            await workingCopy2.save(undefined, stat2);
            await saveResult.p;
        }
        test('entries moved (file rename)', async () => {
            const entriesMoved = event_1.Event.toPromise(workingCopyHistoryService.onDidMoveEntries);
            const workingCopy = new workbenchTestServices_1.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const entry1 = await addEntry({ resource: workingCopy.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2 = await addEntry({ resource: workingCopy.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry3 = await addEntry({ resource: workingCopy.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            let entries = await workingCopyHistoryService.getEntries(workingCopy.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            const renamedWorkingCopyResource = (0, resources_1.joinPath)((0, resources_1.dirname)(workingCopy.resource), 'renamed.txt');
            await workingCopyHistoryService._fileService.move(workingCopy.resource, renamedWorkingCopyResource);
            await entriesMoved;
            entries = await workingCopyHistoryService.getEntries(workingCopy.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await workingCopyHistoryService.getEntries(renamedWorkingCopyResource, cancellation_1.CancellationToken.None);
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
            const all = await workingCopyHistoryService.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(all.length, 1);
            assert.strictEqual(all[0].toString(), renamedWorkingCopyResource.toString());
        });
        test('entries moved (folder rename)', async () => {
            const entriesMoved = event_1.Event.toPromise(workingCopyHistoryService.onDidMoveEntries);
            const workingCopy1 = new workbenchTestServices_1.TestWorkingCopy(uri_1.URI.file(testFile1Path));
            const workingCopy2 = new workbenchTestServices_1.TestWorkingCopy(uri_1.URI.file(testFile2Path));
            const entry1A = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2A = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry3A = await addEntry({ resource: workingCopy1.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry1B = await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry2B = await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            const entry3B = await addEntry({ resource: workingCopy2.resource, source: 'test-source' }, cancellation_1.CancellationToken.None);
            let entries = await workingCopyHistoryService.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            entries = await workingCopyHistoryService.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 3);
            const renamedWorkHome = (0, resources_1.joinPath)((0, resources_1.dirname)(uri_1.URI.file(workHome)), 'renamed');
            await workingCopyHistoryService._fileService.move(uri_1.URI.file(workHome), renamedWorkHome);
            const renamedWorkingCopy1Resource = (0, resources_1.joinPath)(renamedWorkHome, (0, resources_1.basename)(workingCopy1.resource));
            const renamedWorkingCopy2Resource = (0, resources_1.joinPath)(renamedWorkHome, (0, resources_1.basename)(workingCopy2.resource));
            await entriesMoved;
            entries = await workingCopyHistoryService.getEntries(workingCopy1.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await workingCopyHistoryService.getEntries(workingCopy2.resource, cancellation_1.CancellationToken.None);
            assert.strictEqual(entries.length, 0);
            entries = await workingCopyHistoryService.getEntries(renamedWorkingCopy1Resource, cancellation_1.CancellationToken.None);
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
            entries = await workingCopyHistoryService.getEntries(renamedWorkingCopy2Resource, cancellation_1.CancellationToken.None);
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
            const all = await workingCopyHistoryService.getAll(cancellation_1.CancellationToken.None);
            assert.strictEqual(all.length, 2);
            for (const resource of all) {
                if (resource.toString() !== renamedWorkingCopy1Resource.toString() && resource.toString() !== renamedWorkingCopy2Resource.toString()) {
                    assert.fail(`Unexpected history resource: ${resource.toString()}`);
                }
            }
        });
    });
});
//# sourceMappingURL=workingCopyHistoryTracker.test.js.map