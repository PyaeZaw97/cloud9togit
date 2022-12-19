/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/common/normalization", "vs/base/common/path", "vs/base/common/platform", "vs/base/node/extpath", "vs/base/node/pfs", "vs/platform/files/common/watcher"], function (require, exports, fs_1, async_1, cancellation_1, extpath_1, lifecycle_1, normalization_1, path_1, platform_1, extpath_2, pfs_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.watchFileContents = exports.NodeJSFileWatcherLibrary = void 0;
    class NodeJSFileWatcherLibrary extends lifecycle_1.Disposable {
        constructor(request, onDidFilesChange, onLogMessage, verboseLogging) {
            super();
            this.request = request;
            this.onDidFilesChange = onDidFilesChange;
            this.onLogMessage = onLogMessage;
            this.verboseLogging = verboseLogging;
            // Reduce likelyhood of spam from file events via throttling.
            // These numbers are a bit more aggressive compared to the
            // recursive watcher because we can have many individual
            // node.js watchers per request.
            // (https://github.com/microsoft/vscode/issues/124723)
            this.throttledFileChangesWorker = new async_1.ThrottledWorker({
                maxWorkChunkSize: 100,
                throttleDelay: 200,
                maxBufferedWork: 10000 // ...but never buffering more than 10000 events in memory
            }, events => this.onDidFilesChange(events));
            this.fileChangesDelayer = this._register(new async_1.ThrottledDelayer(NodeJSFileWatcherLibrary.FILE_CHANGES_HANDLER_DELAY));
            this.fileChangesBuffer = [];
            this.excludes = (0, watcher_1.parseWatcherPatterns)(this.request.path, this.request.excludes);
            this.includes = this.request.includes ? (0, watcher_1.parseWatcherPatterns)(this.request.path, this.request.includes) : undefined;
            this.cts = new cancellation_1.CancellationTokenSource();
            this.ready = this.watch();
        }
        async watch() {
            try {
                const realPath = await this.normalizePath(this.request);
                if (this.cts.token.isCancellationRequested) {
                    return;
                }
                // Watch via node.js
                const stat = await pfs_1.Promises.stat(realPath);
                this._register(await this.doWatch(realPath, stat.isDirectory()));
            }
            catch (error) {
                if (error.code !== 'ENOENT') {
                    this.error(error);
                }
                else {
                    this.trace(error);
                }
            }
        }
        async normalizePath(request) {
            var _a;
            let realPath = request.path;
            try {
                // First check for symbolic link
                realPath = await pfs_1.Promises.realpath(request.path);
                // Second check for casing difference
                // Note: this will be a no-op on Linux platforms
                if (request.path === realPath) {
                    realPath = (_a = await (0, extpath_2.realcase)(request.path)) !== null && _a !== void 0 ? _a : request.path;
                }
                // Correct watch path as needed
                if (request.path !== realPath) {
                    this.trace(`correcting a path to watch that seems to be a symbolic link or wrong casing (original: ${request.path}, real: ${realPath})`);
                }
            }
            catch (error) {
                // ignore
            }
            return realPath;
        }
        async doWatch(path, isDirectory) {
            // macOS: watching samba shares can crash VSCode so we do
            // a simple check for the file path pointing to /Volumes
            // (https://github.com/microsoft/vscode/issues/106879)
            // TODO@electron this needs a revisit when the crash is
            // fixed or mitigated upstream.
            if (platform_1.isMacintosh && (0, extpath_1.isEqualOrParent)(path, '/Volumes/', true)) {
                this.error(`Refusing to watch ${path} for changes using fs.watch() for possibly being a network share where watching is unreliable and unstable.`);
                return lifecycle_1.Disposable.None;
            }
            const cts = new cancellation_1.CancellationTokenSource(this.cts.token);
            let disposables = new lifecycle_1.DisposableStore();
            try {
                const pathBasename = (0, path_1.basename)(path);
                // Creating watcher can fail with an exception
                const watcher = (0, fs_1.watch)(path);
                disposables.add((0, lifecycle_1.toDisposable)(() => {
                    watcher.removeAllListeners();
                    watcher.close();
                }));
                this.trace(`Started watching: '${path}'`);
                // Folder: resolve children to emit proper events
                const folderChildren = new Set();
                if (isDirectory) {
                    try {
                        for (const child of await pfs_1.Promises.readdir(path)) {
                            folderChildren.add(child);
                        }
                    }
                    catch (error) {
                        this.error(error);
                    }
                }
                const mapPathToStatDisposable = new Map();
                disposables.add((0, lifecycle_1.toDisposable)(() => {
                    for (const [, disposable] of mapPathToStatDisposable) {
                        disposable.dispose();
                    }
                    mapPathToStatDisposable.clear();
                }));
                watcher.on('error', (code, signal) => {
                    this.error(`Failed to watch ${path} for changes using fs.watch() (${code}, ${signal})`);
                    // The watcher is no longer functional reliably
                    // so we go ahead and dispose it
                    this.dispose();
                });
                watcher.on('change', (type, raw) => {
                    var _a;
                    if (cts.token.isCancellationRequested) {
                        return; // ignore if already disposed
                    }
                    this.trace(`[raw] ["${type}"] ${raw}`);
                    // Normalize file name
                    let changedFileName = '';
                    if (raw) { // https://github.com/microsoft/vscode/issues/38191
                        changedFileName = raw.toString();
                        if (platform_1.isMacintosh) {
                            // Mac: uses NFD unicode form on disk, but we want NFC
                            // See also https://github.com/nodejs/node/issues/2165
                            changedFileName = (0, normalization_1.normalizeNFC)(changedFileName);
                        }
                    }
                    if (!changedFileName || (type !== 'change' && type !== 'rename')) {
                        return; // ignore unexpected events
                    }
                    // Folder
                    if (isDirectory) {
                        // Folder child added/deleted
                        if (type === 'rename') {
                            // Cancel any previous stats for this file if existing
                            (_a = mapPathToStatDisposable.get(changedFileName)) === null || _a === void 0 ? void 0 : _a.dispose();
                            // Wait a bit and try see if the file still exists on disk
                            // to decide on the resulting event
                            const timeoutHandle = setTimeout(async () => {
                                mapPathToStatDisposable.delete(changedFileName);
                                // Depending on the OS the watcher runs on, there
                                // is different behaviour for when the watched
                                // folder path is being deleted:
                                //
                                // -   macOS: not reported but events continue to
                                //            work even when the folder is brought
                                //            back, though it seems every change
                                //            to a file is reported as "rename"
                                // -   Linux: "rename" event is reported with the
                                //            name of the folder and events stop
                                //            working
                                // - Windows: an EPERM error is thrown that we
                                //            handle from the `on('error')` event
                                //
                                // We do not re-attach the watcher after timeout
                                // though as we do for file watches because for
                                // file watching specifically we want to handle
                                // the atomic-write cases where the file is being
                                // deleted and recreated with different contents.
                                //
                                // Same as with recursive watching, we do not
                                // emit a delete event in this case.
                                if (changedFileName === pathBasename && !await pfs_1.Promises.exists(path)) {
                                    this.warn('Watcher shutdown because watched path got deleted');
                                    // The watcher is no longer functional reliably
                                    // so we go ahead and dispose it
                                    this.dispose();
                                    return;
                                }
                                // In order to properly detect renames on a case-insensitive
                                // file system, we need to use `existsChildStrictCase` helper
                                // because otherwise we would wrongly assume a file exists
                                // when it was renamed to same name but different case.
                                const fileExists = await this.existsChildStrictCase((0, path_1.join)(path, changedFileName));
                                if (cts.token.isCancellationRequested) {
                                    return; // ignore if disposed by now
                                }
                                // Figure out the correct event type:
                                // File Exists: either 'added' or 'updated' if known before
                                // File Does not Exist: always 'deleted'
                                let type;
                                if (fileExists) {
                                    if (folderChildren.has(changedFileName)) {
                                        type = 0 /* FileChangeType.UPDATED */;
                                    }
                                    else {
                                        type = 1 /* FileChangeType.ADDED */;
                                        folderChildren.add(changedFileName);
                                    }
                                }
                                else {
                                    folderChildren.delete(changedFileName);
                                    type = 2 /* FileChangeType.DELETED */;
                                }
                                this.onFileChange({ path: (0, path_1.join)(this.request.path, changedFileName), type });
                            }, NodeJSFileWatcherLibrary.FILE_DELETE_HANDLER_DELAY);
                            mapPathToStatDisposable.set(changedFileName, (0, lifecycle_1.toDisposable)(() => clearTimeout(timeoutHandle)));
                        }
                        // Folder child changed
                        else {
                            // Figure out the correct event type: if this is the
                            // first time we see this child, it can only be added
                            let type;
                            if (folderChildren.has(changedFileName)) {
                                type = 0 /* FileChangeType.UPDATED */;
                            }
                            else {
                                type = 1 /* FileChangeType.ADDED */;
                                folderChildren.add(changedFileName);
                            }
                            this.onFileChange({ path: (0, path_1.join)(this.request.path, changedFileName), type });
                        }
                    }
                    // File
                    else {
                        // File added/deleted
                        if (type === 'rename' || changedFileName !== pathBasename) {
                            // Depending on the OS the watcher runs on, there
                            // is different behaviour for when the watched
                            // file path is being deleted:
                            //
                            // -   macOS: "rename" event is reported and events
                            //            stop working
                            // -   Linux: "rename" event is reported and events
                            //            stop working
                            // - Windows: "rename" event is reported and events
                            //            continue to work when file is restored
                            //
                            // As opposed to folder watching, we re-attach the
                            // watcher after brief timeout to support "atomic save"
                            // operations where a tool may decide to delete a file
                            // and then create it with the updated contents.
                            //
                            // Different to folder watching, we emit a delete event
                            // though we never detect when the file is brought back
                            // because the watcher is disposed then.
                            const timeoutHandle = setTimeout(async () => {
                                const fileExists = await pfs_1.Promises.exists(path);
                                if (cts.token.isCancellationRequested) {
                                    return; // ignore if disposed by now
                                }
                                // File still exists, so emit as change event and reapply the watcher
                                if (fileExists) {
                                    this.onFileChange({ path: this.request.path, type: 0 /* FileChangeType.UPDATED */ }, true /* skip excludes/includes (file is explicitly watched) */);
                                    disposables.add(await this.doWatch(path, false));
                                }
                                // File seems to be really gone, so emit a deleted event and dispose
                                else {
                                    const eventPromise = this.onFileChange({ path: this.request.path, type: 2 /* FileChangeType.DELETED */ }, true /* skip excludes/includes (file is explicitly watched) */);
                                    // Important to await the event delivery
                                    // before disposing the watcher, otherwise
                                    // we will loose this event.
                                    await eventPromise;
                                    this.dispose();
                                }
                            }, NodeJSFileWatcherLibrary.FILE_DELETE_HANDLER_DELAY);
                            // Very important to dispose the watcher which now points to a stale inode
                            // and wire in a new disposable that tracks our timeout that is installed
                            disposables.clear();
                            disposables.add((0, lifecycle_1.toDisposable)(() => clearTimeout(timeoutHandle)));
                        }
                        // File changed
                        else {
                            this.onFileChange({ path: this.request.path, type: 0 /* FileChangeType.UPDATED */ }, true /* skip excludes/includes (file is explicitly watched) */);
                        }
                    }
                });
            }
            catch (error) {
                if (await pfs_1.Promises.exists(path) && !cts.token.isCancellationRequested) {
                    this.error(`Failed to watch ${path} for changes using fs.watch() (${error.toString()})`);
                }
            }
            return (0, lifecycle_1.toDisposable)(() => {
                cts.dispose(true);
                disposables.dispose();
            });
        }
        async onFileChange(event, skipIncludeExcludeChecks = false) {
            if (this.cts.token.isCancellationRequested) {
                return;
            }
            // Logging
            if (this.verboseLogging) {
                this.trace(`${event.type === 1 /* FileChangeType.ADDED */ ? '[ADDED]' : event.type === 2 /* FileChangeType.DELETED */ ? '[DELETED]' : '[CHANGED]'} ${event.path}`);
            }
            // Add to buffer unless excluded or not included (not if explicitly disabled)
            if (!skipIncludeExcludeChecks && this.excludes.some(exclude => exclude(event.path))) {
                if (this.verboseLogging) {
                    this.trace(` >> ignored (excluded) ${event.path}`);
                }
            }
            else if (!skipIncludeExcludeChecks && this.includes && this.includes.length > 0 && !this.includes.some(include => include(event.path))) {
                if (this.verboseLogging) {
                    this.trace(` >> ignored (not included) ${event.path}`);
                }
            }
            else {
                this.fileChangesBuffer.push(event);
            }
            // Handle emit through delayer to accommodate for bulk changes and thus reduce spam
            try {
                await this.fileChangesDelayer.trigger(async () => {
                    const fileChanges = this.fileChangesBuffer;
                    this.fileChangesBuffer = [];
                    // Coalesce events: merge events of same kind
                    const coalescedFileChanges = (0, watcher_1.coalesceEvents)(fileChanges);
                    if (coalescedFileChanges.length > 0) {
                        // Logging
                        if (this.verboseLogging) {
                            for (const event of coalescedFileChanges) {
                                this.trace(`>> normalized ${event.type === 1 /* FileChangeType.ADDED */ ? '[ADDED]' : event.type === 2 /* FileChangeType.DELETED */ ? '[DELETED]' : '[CHANGED]'} ${event.path}`);
                            }
                        }
                        // Broadcast to clients via throttler
                        const worked = this.throttledFileChangesWorker.work(coalescedFileChanges);
                        // Logging
                        if (!worked) {
                            this.warn(`started ignoring events due to too many file change events at once (incoming: ${coalescedFileChanges.length}, most recent change: ${coalescedFileChanges[0].path}). Use 'files.watcherExclude' setting to exclude folders with lots of changing files (e.g. compilation output).`);
                        }
                        else {
                            if (this.throttledFileChangesWorker.pending > 0) {
                                this.trace(`started throttling events due to large amount of file change events at once (pending: ${this.throttledFileChangesWorker.pending}, most recent change: ${coalescedFileChanges[0].path}). Use 'files.watcherExclude' setting to exclude folders with lots of changing files (e.g. compilation output).`);
                            }
                        }
                    }
                });
            }
            catch (error) {
                // ignore (we are likely disposed and cancelled)
            }
        }
        async existsChildStrictCase(path) {
            if (platform_1.isLinux) {
                return pfs_1.Promises.exists(path);
            }
            try {
                const pathBasename = (0, path_1.basename)(path);
                const children = await pfs_1.Promises.readdir((0, path_1.dirname)(path));
                return children.some(child => child === pathBasename);
            }
            catch (error) {
                this.trace(error);
                return false;
            }
        }
        setVerboseLogging(verboseLogging) {
            this.verboseLogging = verboseLogging;
        }
        error(error) {
            var _a;
            if (!this.cts.token.isCancellationRequested) {
                (_a = this.onLogMessage) === null || _a === void 0 ? void 0 : _a.call(this, { type: 'error', message: `[File Watcher (node.js)] ${error}` });
            }
        }
        warn(message) {
            var _a;
            if (!this.cts.token.isCancellationRequested) {
                (_a = this.onLogMessage) === null || _a === void 0 ? void 0 : _a.call(this, { type: 'warn', message: `[File Watcher (node.js)] ${message}` });
            }
        }
        trace(message) {
            var _a;
            if (!this.cts.token.isCancellationRequested && this.verboseLogging) {
                (_a = this.onLogMessage) === null || _a === void 0 ? void 0 : _a.call(this, { type: 'trace', message: `[File Watcher (node.js)] ${message}` });
            }
        }
        dispose() {
            this.trace(`stopping file watcher on ${this.request.path}`);
            this.cts.dispose(true);
            super.dispose();
        }
    }
    exports.NodeJSFileWatcherLibrary = NodeJSFileWatcherLibrary;
    // A delay in reacting to file deletes to support
    // atomic save operations where a tool may chose
    // to delete a file before creating it again for
    // an update.
    NodeJSFileWatcherLibrary.FILE_DELETE_HANDLER_DELAY = 100;
    // A delay for collecting file changes from node.js
    // before collecting them for coalescing and emitting
    // (same delay as Parcel is using)
    NodeJSFileWatcherLibrary.FILE_CHANGES_HANDLER_DELAY = 50;
    /**
     * Watch the provided `path` for changes and return
     * the data in chunks of `Uint8Array` for further use.
     */
    async function watchFileContents(path, onData, onReady, token, bufferSize = 512) {
        const handle = await pfs_1.Promises.open(path, 'r');
        const buffer = Buffer.allocUnsafe(bufferSize);
        const cts = new cancellation_1.CancellationTokenSource(token);
        let error = undefined;
        let isReading = false;
        const request = { path, excludes: [], recursive: false };
        const watcher = new NodeJSFileWatcherLibrary(request, changes => {
            (async () => {
                for (const { type } of changes) {
                    if (type === 0 /* FileChangeType.UPDATED */) {
                        if (isReading) {
                            return; // return early if we are already reading the output
                        }
                        isReading = true;
                        try {
                            // Consume the new contents of the file until finished
                            // everytime there is a change event signalling a change
                            while (!cts.token.isCancellationRequested) {
                                const { bytesRead } = await pfs_1.Promises.read(handle, buffer, 0, bufferSize, null);
                                if (!bytesRead || cts.token.isCancellationRequested) {
                                    break;
                                }
                                onData(buffer.slice(0, bytesRead));
                            }
                        }
                        catch (err) {
                            error = new Error(err);
                            cts.dispose(true);
                        }
                        finally {
                            isReading = false;
                        }
                    }
                }
            })();
        });
        await watcher.ready;
        onReady();
        return new Promise((resolve, reject) => {
            cts.token.onCancellationRequested(async () => {
                watcher.dispose();
                try {
                    await pfs_1.Promises.close(handle);
                }
                catch (err) {
                    error = new Error(err);
                }
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    exports.watchFileContents = watchFileContents;
});
//# sourceMappingURL=nodejsWatcherLib.js.map