/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "fs", "os", "vs/base/common/async", "vs/base/common/path", "vs/base/common/platform", "vs/base/node/pfs", "vs/base/test/node/testUtils", "vs/platform/files/node/watcher/parcel/parcelWatcher", "vs/base/common/extpath", "vs/base/common/strings"], function (require, exports, assert, fs_1, os_1, async_1, path_1, platform_1, pfs_1, testUtils_1, parcelWatcher_1, extpath_1, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // this suite has shown flaky runs in Azure pipelines where
    // tasks would just hang and timeout after a while (not in
    // mocha but generally). as such they will run only on demand
    // whenever we update the watcher library.
    ((process.env['BUILD_SOURCEVERSION'] || process.env['CI']) ? suite.skip : testUtils_1.flakySuite)('File Watcher (parcel)', () => {
        class TestParcelWatcher extends parcelWatcher_1.ParcelWatcher {
            testNormalizePaths(paths) {
                // Work with strings as paths to simplify testing
                const requests = paths.map(path => {
                    return { path, excludes: [], recursive: true };
                });
                return this.normalizeRequests(requests).map(request => request.path);
            }
            async watch(requests) {
                await super.watch(requests);
                await this.whenReady();
            }
            async whenReady() {
                for (const [, watcher] of this.watchers) {
                    await watcher.ready;
                }
            }
            toExcludePaths(path, excludes) {
                return super.toExcludePaths(path, excludes);
            }
            restartWatching(watcher, delay = 10) {
                return super.restartWatching(watcher, delay);
            }
        }
        let testDir;
        let watcher;
        let loggingEnabled = false;
        function enableLogging(enable) {
            loggingEnabled = enable;
            watcher === null || watcher === void 0 ? void 0 : watcher.setVerboseLogging(enable);
        }
        enableLogging(false);
        setup(async () => {
            watcher = new TestParcelWatcher();
            watcher.onDidLogMessage(e => {
                if (loggingEnabled) {
                    console.log(`[recursive watcher test message] ${e.message}`);
                }
            });
            watcher.onDidError(e => {
                if (loggingEnabled) {
                    console.log(`[recursive watcher test error] ${e}`);
                }
            });
            testDir = (0, testUtils_1.getRandomTestPath)((0, os_1.tmpdir)(), 'vsctests', 'filewatcher');
            const sourceDir = (0, testUtils_1.getPathFromAmdModule)(require, './fixtures/service');
            await pfs_1.Promises.copy(sourceDir, testDir, { preserveSymlinks: false });
        });
        teardown(async () => {
            await watcher.stop();
            watcher.dispose();
            // Possible that the file watcher is still holding
            // onto the folders on Windows specifically and the
            // unlink would fail. In that case, do not fail the
            // test suite.
            return pfs_1.Promises.rm(testDir).catch(error => console.error(error));
        });
        function toMsg(type) {
            switch (type) {
                case 1 /* FileChangeType.ADDED */: return 'added';
                case 2 /* FileChangeType.DELETED */: return 'deleted';
                default: return 'changed';
            }
        }
        async function awaitEvent(service, path, type, failOnEventReason) {
            if (loggingEnabled) {
                console.log(`Awaiting change type '${toMsg(type)}' on file '${path}'`);
            }
            // Await the event
            await new Promise((resolve, reject) => {
                const disposable = service.onDidChangeFile(events => {
                    for (const event of events) {
                        if (event.path === path && event.type === type) {
                            disposable.dispose();
                            if (failOnEventReason) {
                                reject(new Error(`Unexpected file event: ${failOnEventReason}`));
                            }
                            else {
                                setImmediate(() => resolve()); // copied from parcel watcher tests, seems to drop unrelated events on macOS
                            }
                            break;
                        }
                    }
                });
            });
            // Unwind from the event call stack: we have seen crashes in Parcel
            // when e.g. calling `unsubscribe` directly from the stack of a file
            // change event
            // Refs: https://github.com/microsoft/vscode/issues/137430
            await (0, async_1.timeout)(1);
        }
        function awaitMessage(service, type) {
            if (loggingEnabled) {
                console.log(`Awaiting message of type ${type}`);
            }
            // Await the message
            return new Promise(resolve => {
                const disposable = service.onDidLogMessage(msg => {
                    if (msg.type === type) {
                        disposable.dispose();
                        resolve();
                    }
                });
            });
        }
        test('basics', async function () {
            await watcher.watch([{ path: testDir, excludes: [], recursive: true }]); //
            // New file
            const newFilePath = (0, path_1.join)(testDir, 'deep', 'newFile.txt');
            let changeFuture = awaitEvent(watcher, newFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(newFilePath, 'Hello World');
            await changeFuture;
            // New folder
            const newFolderPath = (0, path_1.join)(testDir, 'deep', 'New Folder');
            changeFuture = awaitEvent(watcher, newFolderPath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.mkdir(newFolderPath);
            await changeFuture;
            // Rename file
            let renamedFilePath = (0, path_1.join)(testDir, 'deep', 'renamedFile.txt');
            changeFuture = Promise.all([
                awaitEvent(watcher, newFilePath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, renamedFilePath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(newFilePath, renamedFilePath);
            await changeFuture;
            // Rename folder
            let renamedFolderPath = (0, path_1.join)(testDir, 'deep', 'Renamed Folder');
            changeFuture = Promise.all([
                awaitEvent(watcher, newFolderPath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, renamedFolderPath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(newFolderPath, renamedFolderPath);
            await changeFuture;
            // Rename file (same name, different case)
            const caseRenamedFilePath = (0, path_1.join)(testDir, 'deep', 'RenamedFile.txt');
            changeFuture = Promise.all([
                awaitEvent(watcher, renamedFilePath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, caseRenamedFilePath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(renamedFilePath, caseRenamedFilePath);
            await changeFuture;
            renamedFilePath = caseRenamedFilePath;
            // Rename folder (same name, different case)
            const caseRenamedFolderPath = (0, path_1.join)(testDir, 'deep', 'REnamed Folder');
            changeFuture = Promise.all([
                awaitEvent(watcher, renamedFolderPath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, caseRenamedFolderPath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(renamedFolderPath, caseRenamedFolderPath);
            await changeFuture;
            renamedFolderPath = caseRenamedFolderPath;
            // Move file
            const movedFilepath = (0, path_1.join)(testDir, 'movedFile.txt');
            changeFuture = Promise.all([
                awaitEvent(watcher, renamedFilePath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, movedFilepath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(renamedFilePath, movedFilepath);
            await changeFuture;
            // Move folder
            const movedFolderpath = (0, path_1.join)(testDir, 'Moved Folder');
            changeFuture = Promise.all([
                awaitEvent(watcher, renamedFolderPath, 2 /* FileChangeType.DELETED */),
                awaitEvent(watcher, movedFolderpath, 1 /* FileChangeType.ADDED */)
            ]);
            await pfs_1.Promises.rename(renamedFolderPath, movedFolderpath);
            await changeFuture;
            // Copy file
            const copiedFilepath = (0, path_1.join)(testDir, 'deep', 'copiedFile.txt');
            changeFuture = awaitEvent(watcher, copiedFilepath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.copyFile(movedFilepath, copiedFilepath);
            await changeFuture;
            // Copy folder
            const copiedFolderpath = (0, path_1.join)(testDir, 'deep', 'Copied Folder');
            changeFuture = awaitEvent(watcher, copiedFolderpath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.copy(movedFolderpath, copiedFolderpath, { preserveSymlinks: false });
            await changeFuture;
            // Change file
            changeFuture = awaitEvent(watcher, copiedFilepath, 0 /* FileChangeType.UPDATED */);
            await pfs_1.Promises.writeFile(copiedFilepath, 'Hello Change');
            await changeFuture;
            // Create new file
            const anotherNewFilePath = (0, path_1.join)(testDir, 'deep', 'anotherNewFile.txt');
            changeFuture = awaitEvent(watcher, anotherNewFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(anotherNewFilePath, 'Hello Another World');
            await changeFuture;
            // Skip following asserts on macOS where the fs-events service
            // does not really give a full guarantee about the correlation
            // of an event to a change.
            if (!platform_1.isMacintosh) {
                // Read file does not emit event
                changeFuture = awaitEvent(watcher, anotherNewFilePath, 0 /* FileChangeType.UPDATED */, 'unexpected-event-from-read-file');
                await pfs_1.Promises.readFile(anotherNewFilePath);
                await Promise.race([(0, async_1.timeout)(100), changeFuture]);
                // Stat file does not emit event
                changeFuture = awaitEvent(watcher, anotherNewFilePath, 0 /* FileChangeType.UPDATED */, 'unexpected-event-from-stat');
                await pfs_1.Promises.stat(anotherNewFilePath);
                await Promise.race([(0, async_1.timeout)(100), changeFuture]);
                // Stat folder does not emit event
                changeFuture = awaitEvent(watcher, copiedFolderpath, 0 /* FileChangeType.UPDATED */, 'unexpected-event-from-stat');
                await pfs_1.Promises.stat(copiedFolderpath);
                await Promise.race([(0, async_1.timeout)(100), changeFuture]);
            }
            // Delete file
            changeFuture = awaitEvent(watcher, copiedFilepath, 2 /* FileChangeType.DELETED */);
            await pfs_1.Promises.unlink(copiedFilepath);
            await changeFuture;
            // Delete folder
            changeFuture = awaitEvent(watcher, copiedFolderpath, 2 /* FileChangeType.DELETED */);
            await pfs_1.Promises.rmdir(copiedFolderpath);
            await changeFuture;
        });
        (platform_1.isMacintosh /* this test seems not possible with fsevents backend */ ? test.skip : test)('basics (atomic writes)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], recursive: true }]);
            // Delete + Recreate file
            const newFilePath = (0, path_1.join)(testDir, 'deep', 'conway.js');
            let changeFuture = awaitEvent(watcher, newFilePath, 0 /* FileChangeType.UPDATED */);
            await pfs_1.Promises.unlink(newFilePath);
            pfs_1.Promises.writeFile(newFilePath, 'Hello Atomic World');
            await changeFuture;
        });
        (!platform_1.isLinux /* polling is only used in linux environments (WSL) */ ? test.skip : test)('basics (polling)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], pollingInterval: 100, recursive: true }]);
            return basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'));
        });
        async function basicCrudTest(filePath) {
            // New file
            let changeFuture = awaitEvent(watcher, filePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(filePath, 'Hello World');
            await changeFuture;
            // Change file
            changeFuture = awaitEvent(watcher, filePath, 0 /* FileChangeType.UPDATED */);
            await pfs_1.Promises.writeFile(filePath, 'Hello Change');
            await changeFuture;
            // Delete file
            changeFuture = awaitEvent(watcher, filePath, 2 /* FileChangeType.DELETED */);
            await pfs_1.Promises.unlink(filePath);
            await changeFuture;
        }
        test('multiple events', async function () {
            await watcher.watch([{ path: testDir, excludes: [], recursive: true }]);
            await pfs_1.Promises.mkdir((0, path_1.join)(testDir, 'deep-multiple'));
            // multiple add
            const newFilePath1 = (0, path_1.join)(testDir, 'newFile-1.txt');
            const newFilePath2 = (0, path_1.join)(testDir, 'newFile-2.txt');
            const newFilePath3 = (0, path_1.join)(testDir, 'newFile-3.txt');
            const newFilePath4 = (0, path_1.join)(testDir, 'deep-multiple', 'newFile-1.txt');
            const newFilePath5 = (0, path_1.join)(testDir, 'deep-multiple', 'newFile-2.txt');
            const newFilePath6 = (0, path_1.join)(testDir, 'deep-multiple', 'newFile-3.txt');
            const addedFuture1 = awaitEvent(watcher, newFilePath1, 1 /* FileChangeType.ADDED */);
            const addedFuture2 = awaitEvent(watcher, newFilePath2, 1 /* FileChangeType.ADDED */);
            const addedFuture3 = awaitEvent(watcher, newFilePath3, 1 /* FileChangeType.ADDED */);
            const addedFuture4 = awaitEvent(watcher, newFilePath4, 1 /* FileChangeType.ADDED */);
            const addedFuture5 = awaitEvent(watcher, newFilePath5, 1 /* FileChangeType.ADDED */);
            const addedFuture6 = awaitEvent(watcher, newFilePath6, 1 /* FileChangeType.ADDED */);
            await Promise.all([
                await pfs_1.Promises.writeFile(newFilePath1, 'Hello World 1'),
                await pfs_1.Promises.writeFile(newFilePath2, 'Hello World 2'),
                await pfs_1.Promises.writeFile(newFilePath3, 'Hello World 3'),
                await pfs_1.Promises.writeFile(newFilePath4, 'Hello World 4'),
                await pfs_1.Promises.writeFile(newFilePath5, 'Hello World 5'),
                await pfs_1.Promises.writeFile(newFilePath6, 'Hello World 6')
            ]);
            await Promise.all([addedFuture1, addedFuture2, addedFuture3, addedFuture4, addedFuture5, addedFuture6]);
            // multiple change
            const changeFuture1 = awaitEvent(watcher, newFilePath1, 0 /* FileChangeType.UPDATED */);
            const changeFuture2 = awaitEvent(watcher, newFilePath2, 0 /* FileChangeType.UPDATED */);
            const changeFuture3 = awaitEvent(watcher, newFilePath3, 0 /* FileChangeType.UPDATED */);
            const changeFuture4 = awaitEvent(watcher, newFilePath4, 0 /* FileChangeType.UPDATED */);
            const changeFuture5 = awaitEvent(watcher, newFilePath5, 0 /* FileChangeType.UPDATED */);
            const changeFuture6 = awaitEvent(watcher, newFilePath6, 0 /* FileChangeType.UPDATED */);
            await Promise.all([
                await pfs_1.Promises.writeFile(newFilePath1, 'Hello Update 1'),
                await pfs_1.Promises.writeFile(newFilePath2, 'Hello Update 2'),
                await pfs_1.Promises.writeFile(newFilePath3, 'Hello Update 3'),
                await pfs_1.Promises.writeFile(newFilePath4, 'Hello Update 4'),
                await pfs_1.Promises.writeFile(newFilePath5, 'Hello Update 5'),
                await pfs_1.Promises.writeFile(newFilePath6, 'Hello Update 6')
            ]);
            await Promise.all([changeFuture1, changeFuture2, changeFuture3, changeFuture4, changeFuture5, changeFuture6]);
            // copy with multiple files
            const copyFuture1 = awaitEvent(watcher, (0, path_1.join)(testDir, 'deep-multiple-copy', 'newFile-1.txt'), 1 /* FileChangeType.ADDED */);
            const copyFuture2 = awaitEvent(watcher, (0, path_1.join)(testDir, 'deep-multiple-copy', 'newFile-2.txt'), 1 /* FileChangeType.ADDED */);
            const copyFuture3 = awaitEvent(watcher, (0, path_1.join)(testDir, 'deep-multiple-copy', 'newFile-3.txt'), 1 /* FileChangeType.ADDED */);
            const copyFuture4 = awaitEvent(watcher, (0, path_1.join)(testDir, 'deep-multiple-copy'), 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.copy((0, path_1.join)(testDir, 'deep-multiple'), (0, path_1.join)(testDir, 'deep-multiple-copy'), { preserveSymlinks: false });
            await Promise.all([copyFuture1, copyFuture2, copyFuture3, copyFuture4]);
            // multiple delete (single files)
            const deleteFuture1 = awaitEvent(watcher, newFilePath1, 2 /* FileChangeType.DELETED */);
            const deleteFuture2 = awaitEvent(watcher, newFilePath2, 2 /* FileChangeType.DELETED */);
            const deleteFuture3 = awaitEvent(watcher, newFilePath3, 2 /* FileChangeType.DELETED */);
            const deleteFuture4 = awaitEvent(watcher, newFilePath4, 2 /* FileChangeType.DELETED */);
            const deleteFuture5 = awaitEvent(watcher, newFilePath5, 2 /* FileChangeType.DELETED */);
            const deleteFuture6 = awaitEvent(watcher, newFilePath6, 2 /* FileChangeType.DELETED */);
            await Promise.all([
                await pfs_1.Promises.unlink(newFilePath1),
                await pfs_1.Promises.unlink(newFilePath2),
                await pfs_1.Promises.unlink(newFilePath3),
                await pfs_1.Promises.unlink(newFilePath4),
                await pfs_1.Promises.unlink(newFilePath5),
                await pfs_1.Promises.unlink(newFilePath6)
            ]);
            await Promise.all([deleteFuture1, deleteFuture2, deleteFuture3, deleteFuture4, deleteFuture5, deleteFuture6]);
            // multiple delete (folder)
            const deleteFolderFuture1 = awaitEvent(watcher, (0, path_1.join)(testDir, 'deep-multiple'), 2 /* FileChangeType.DELETED */);
            const deleteFolderFuture2 = awaitEvent(watcher, (0, path_1.join)(testDir, 'deep-multiple-copy'), 2 /* FileChangeType.DELETED */);
            await Promise.all([pfs_1.Promises.rm((0, path_1.join)(testDir, 'deep-multiple'), pfs_1.RimRafMode.UNLINK), pfs_1.Promises.rm((0, path_1.join)(testDir, 'deep-multiple-copy'), pfs_1.RimRafMode.UNLINK)]);
            await Promise.all([deleteFolderFuture1, deleteFolderFuture2]);
        });
        test('subsequent watch updates watchers (path)', async function () {
            await watcher.watch([{ path: testDir, excludes: [(0, path_1.join)((0, fs_1.realpathSync)(testDir), 'unrelated')], recursive: true }]);
            // New file (*.txt)
            let newTextFilePath = (0, path_1.join)(testDir, 'deep', 'newFile.txt');
            let changeFuture = awaitEvent(watcher, newTextFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(newTextFilePath, 'Hello World');
            await changeFuture;
            await watcher.watch([{ path: (0, path_1.join)(testDir, 'deep'), excludes: [(0, path_1.join)((0, fs_1.realpathSync)(testDir), 'unrelated')], recursive: true }]);
            newTextFilePath = (0, path_1.join)(testDir, 'deep', 'newFile2.txt');
            changeFuture = awaitEvent(watcher, newTextFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(newTextFilePath, 'Hello World');
            await changeFuture;
            await watcher.watch([{ path: (0, path_1.join)(testDir, 'deep'), excludes: [(0, fs_1.realpathSync)(testDir)], recursive: true }]);
            await watcher.watch([{ path: (0, path_1.join)(testDir, 'deep'), excludes: [], recursive: true }]);
            newTextFilePath = (0, path_1.join)(testDir, 'deep', 'newFile3.txt');
            changeFuture = awaitEvent(watcher, newTextFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(newTextFilePath, 'Hello World');
            await changeFuture;
        });
        test('subsequent watch updates watchers (excludes)', async function () {
            await watcher.watch([{ path: testDir, excludes: [(0, fs_1.realpathSync)(testDir)], recursive: true }]);
            await watcher.watch([{ path: testDir, excludes: [], recursive: true }]);
            return basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'));
        });
        test('subsequent watch updates watchers (includes)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], includes: ['nothing'], recursive: true }]);
            await watcher.watch([{ path: testDir, excludes: [], recursive: true }]);
            return basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'));
        });
        test('includes are supported', async function () {
            await watcher.watch([{ path: testDir, excludes: [], includes: ['**/deep/**'], recursive: true }]);
            return basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'));
        });
        test('includes are supported (relative pattern explicit)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], includes: [{ base: testDir, pattern: 'deep/newFile.txt' }], recursive: true }]);
            return basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'));
        });
        test('includes are supported (relative pattern implicit)', async function () {
            await watcher.watch([{ path: testDir, excludes: [], includes: ['deep/newFile.txt'], recursive: true }]);
            return basicCrudTest((0, path_1.join)(testDir, 'deep', 'newFile.txt'));
        });
        (platform_1.isWindows /* windows: cannot create file symbolic link without elevated context */ ? test.skip : test)('symlink support (root)', async function () {
            const link = (0, path_1.join)(testDir, 'deep-linked');
            const linkTarget = (0, path_1.join)(testDir, 'deep');
            await pfs_1.Promises.symlink(linkTarget, link);
            await watcher.watch([{ path: link, excludes: [], recursive: true }]);
            return basicCrudTest((0, path_1.join)(link, 'newFile.txt'));
        });
        (platform_1.isWindows /* windows: cannot create file symbolic link without elevated context */ ? test.skip : test)('symlink support (via extra watch)', async function () {
            const link = (0, path_1.join)(testDir, 'deep-linked');
            const linkTarget = (0, path_1.join)(testDir, 'deep');
            await pfs_1.Promises.symlink(linkTarget, link);
            await watcher.watch([{ path: testDir, excludes: [], recursive: true }, { path: link, excludes: [], recursive: true }]);
            return basicCrudTest((0, path_1.join)(link, 'newFile.txt'));
        });
        (!platform_1.isWindows /* UNC is windows only */ ? test.skip : test)('unc support', async function () {
            var _a;
            // Local UNC paths are in the form of: \\localhost\c$\my_dir
            const uncPath = `\\\\localhost\\${(_a = (0, extpath_1.getDriveLetter)(testDir)) === null || _a === void 0 ? void 0 : _a.toLowerCase()}$\\${(0, strings_1.ltrim)(testDir.substr(testDir.indexOf(':') + 1), '\\')}`;
            await watcher.watch([{ path: uncPath, excludes: [], recursive: true }]);
            return basicCrudTest((0, path_1.join)(uncPath, 'deep', 'newFile.txt'));
        });
        (platform_1.isLinux /* linux: is case sensitive */ ? test.skip : test)('wrong casing', async function () {
            const deepWrongCasedPath = (0, path_1.join)(testDir, 'DEEP');
            await watcher.watch([{ path: deepWrongCasedPath, excludes: [], recursive: true }]);
            return basicCrudTest((0, path_1.join)(deepWrongCasedPath, 'newFile.txt'));
        });
        test('invalid folder does not explode', async function () {
            const invalidPath = (0, path_1.join)(testDir, 'invalid');
            await watcher.watch([{ path: invalidPath, excludes: [], recursive: true }]);
        });
        test('deleting watched path is handled properly', async function () {
            const watchedPath = (0, path_1.join)(testDir, 'deep');
            await watcher.watch([{ path: watchedPath, excludes: [], recursive: true }]);
            // Delete watched path and await
            const warnFuture = awaitMessage(watcher, 'warn');
            await pfs_1.Promises.rm(watchedPath, pfs_1.RimRafMode.UNLINK);
            await warnFuture;
            // Restore watched path
            await (0, async_1.timeout)(1500); // node.js watcher used for monitoring folder restore is async
            await pfs_1.Promises.mkdir(watchedPath);
            await (0, async_1.timeout)(1500); // restart is delayed
            await watcher.whenReady();
            // Verify events come in again
            const newFilePath = (0, path_1.join)(watchedPath, 'newFile.txt');
            const changeFuture = awaitEvent(watcher, newFilePath, 1 /* FileChangeType.ADDED */);
            await pfs_1.Promises.writeFile(newFilePath, 'Hello World');
            await changeFuture;
        });
        test('should not exclude roots that do not overlap', () => {
            if (platform_1.isWindows) {
                assert.deepStrictEqual(watcher.testNormalizePaths(['C:\\a']), ['C:\\a']);
                assert.deepStrictEqual(watcher.testNormalizePaths(['C:\\a', 'C:\\b']), ['C:\\a', 'C:\\b']);
                assert.deepStrictEqual(watcher.testNormalizePaths(['C:\\a', 'C:\\b', 'C:\\c\\d\\e']), ['C:\\a', 'C:\\b', 'C:\\c\\d\\e']);
            }
            else {
                assert.deepStrictEqual(watcher.testNormalizePaths(['/a']), ['/a']);
                assert.deepStrictEqual(watcher.testNormalizePaths(['/a', '/b']), ['/a', '/b']);
                assert.deepStrictEqual(watcher.testNormalizePaths(['/a', '/b', '/c/d/e']), ['/a', '/b', '/c/d/e']);
            }
        });
        test('should remove sub-folders of other paths', () => {
            if (platform_1.isWindows) {
                assert.deepStrictEqual(watcher.testNormalizePaths(['C:\\a', 'C:\\a\\b']), ['C:\\a']);
                assert.deepStrictEqual(watcher.testNormalizePaths(['C:\\a', 'C:\\b', 'C:\\a\\b']), ['C:\\a', 'C:\\b']);
                assert.deepStrictEqual(watcher.testNormalizePaths(['C:\\b\\a', 'C:\\a', 'C:\\b', 'C:\\a\\b']), ['C:\\a', 'C:\\b']);
                assert.deepStrictEqual(watcher.testNormalizePaths(['C:\\a', 'C:\\a\\b', 'C:\\a\\c\\d']), ['C:\\a']);
            }
            else {
                assert.deepStrictEqual(watcher.testNormalizePaths(['/a', '/a/b']), ['/a']);
                assert.deepStrictEqual(watcher.testNormalizePaths(['/a', '/b', '/a/b']), ['/a', '/b']);
                assert.deepStrictEqual(watcher.testNormalizePaths(['/b/a', '/a', '/b', '/a/b']), ['/a', '/b']);
                assert.deepStrictEqual(watcher.testNormalizePaths(['/a', '/a/b', '/a/c/d']), ['/a']);
            }
        });
        test('excludes are converted to absolute paths', () => {
            // undefined / empty
            assert.strictEqual(watcher.toExcludePaths(testDir, undefined), undefined);
            assert.strictEqual(watcher.toExcludePaths(testDir, []), undefined);
            // absolute paths
            let excludes = watcher.toExcludePaths(testDir, [testDir]);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
            assert.strictEqual(excludes[0], testDir);
            excludes = watcher.toExcludePaths(testDir, [`${testDir}${path_1.sep}`, (0, path_1.join)(testDir, 'foo', 'bar'), `${(0, path_1.join)(testDir, 'other', 'deep')}${path_1.sep}`]);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 3);
            assert.strictEqual(excludes[0], testDir);
            assert.strictEqual(excludes[1], (0, path_1.join)(testDir, 'foo', 'bar'));
            assert.strictEqual(excludes[2], (0, path_1.join)(testDir, 'other', 'deep'));
            // wrong casing is normalized for root
            if (!platform_1.isLinux) {
                excludes = watcher.toExcludePaths(testDir, [(0, path_1.join)(testDir.toUpperCase(), 'node_modules', '**')]);
                assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
                assert.strictEqual(excludes[0], (0, path_1.join)(testDir, 'node_modules'));
            }
            // exclude ignored if not parent of watched dir
            excludes = watcher.toExcludePaths(testDir, [(0, path_1.join)((0, path_1.dirname)(testDir), 'node_modules', '**')]);
            assert.strictEqual(excludes, undefined);
            // relative paths
            excludes = watcher.toExcludePaths(testDir, ['.']);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
            assert.strictEqual(excludes[0], testDir);
            excludes = watcher.toExcludePaths(testDir, ['foo', `bar${path_1.sep}`, (0, path_1.join)('foo', 'bar'), `${(0, path_1.join)('other', 'deep')}${path_1.sep}`]);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 4);
            assert.strictEqual(excludes[0], (0, path_1.join)(testDir, 'foo'));
            assert.strictEqual(excludes[1], (0, path_1.join)(testDir, 'bar'));
            assert.strictEqual(excludes[2], (0, path_1.join)(testDir, 'foo', 'bar'));
            assert.strictEqual(excludes[3], (0, path_1.join)(testDir, 'other', 'deep'));
            // simple globs (relative)
            excludes = watcher.toExcludePaths(testDir, ['**']);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
            assert.strictEqual(excludes[0], testDir);
            excludes = watcher.toExcludePaths(testDir, ['**/**']);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
            assert.strictEqual(excludes[0], testDir);
            excludes = watcher.toExcludePaths(testDir, ['**\\**']);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
            assert.strictEqual(excludes[0], testDir);
            excludes = watcher.toExcludePaths(testDir, ['**/node_modules/**']);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
            assert.strictEqual(excludes[0], (0, path_1.join)(testDir, 'node_modules'));
            excludes = watcher.toExcludePaths(testDir, ['**/.git/objects/**']);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
            assert.strictEqual(excludes[0], (0, path_1.join)(testDir, '.git', 'objects'));
            excludes = watcher.toExcludePaths(testDir, ['**/node_modules']);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
            assert.strictEqual(excludes[0], (0, path_1.join)(testDir, 'node_modules'));
            excludes = watcher.toExcludePaths(testDir, ['**/.git/objects']);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
            assert.strictEqual(excludes[0], (0, path_1.join)(testDir, '.git', 'objects'));
            excludes = watcher.toExcludePaths(testDir, ['node_modules/**']);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
            assert.strictEqual(excludes[0], (0, path_1.join)(testDir, 'node_modules'));
            excludes = watcher.toExcludePaths(testDir, ['.git/objects/**']);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
            assert.strictEqual(excludes[0], (0, path_1.join)(testDir, '.git', 'objects'));
            // simple globs (absolute)
            excludes = watcher.toExcludePaths(testDir, [(0, path_1.join)(testDir, 'node_modules', '**')]);
            assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
            assert.strictEqual(excludes[0], (0, path_1.join)(testDir, 'node_modules'));
            // Linux: more restrictive glob treatment
            if (platform_1.isLinux) {
                excludes = watcher.toExcludePaths(testDir, ['**/node_modules/*/**']);
                assert.strictEqual(excludes === null || excludes === void 0 ? void 0 : excludes.length, 1);
                assert.strictEqual(excludes[0], (0, path_1.join)(testDir, 'node_modules'));
            }
            // unsupported globs
            else {
                excludes = watcher.toExcludePaths(testDir, ['**/node_modules/*/**']);
                assert.strictEqual(excludes, undefined);
            }
            excludes = watcher.toExcludePaths(testDir, ['**/*.js']);
            assert.strictEqual(excludes, undefined);
            excludes = watcher.toExcludePaths(testDir, ['*.js']);
            assert.strictEqual(excludes, undefined);
            excludes = watcher.toExcludePaths(testDir, ['*']);
            assert.strictEqual(excludes, undefined);
        });
    });
});
//# sourceMappingURL=parcelWatcher.integrationTest.js.map