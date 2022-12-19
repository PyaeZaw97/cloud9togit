/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/path", "vs/platform/files/common/watcher", "vs/platform/log/common/log"], function (require, exports, arrays_1, async_1, errors_1, event_1, lifecycle_1, path_1, watcher_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractDiskFileSystemProvider = void 0;
    class AbstractDiskFileSystemProvider extends lifecycle_1.Disposable {
        constructor(logService, options) {
            super();
            this.logService = logService;
            this.options = options;
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this._onDidWatchError = this._register(new event_1.Emitter());
            this.onDidWatchError = this._onDidWatchError.event;
            this.universalPathsToWatch = [];
            this.universalWatchRequestDelayer = this._register(new async_1.ThrottledDelayer(0));
            this.nonRecursivePathsToWatch = [];
            this.nonRecursiveWatchRequestDelayer = this._register(new async_1.ThrottledDelayer(0));
        }
        watch(resource, opts) {
            var _a, _b;
            if (opts.recursive || ((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.watcher) === null || _b === void 0 ? void 0 : _b.forceUniversal)) {
                return this.watchUniversal(resource, opts);
            }
            return this.watchNonRecursive(resource, opts);
        }
        watchUniversal(resource, opts) {
            // Add to list of paths to watch universally
            const pathToWatch = { path: this.toFilePath(resource), excludes: opts.excludes, includes: opts.includes, recursive: opts.recursive };
            const remove = (0, arrays_1.insert)(this.universalPathsToWatch, pathToWatch);
            // Trigger update
            this.refreshUniversalWatchers();
            return (0, lifecycle_1.toDisposable)(() => {
                // Remove from list of paths to watch universally
                remove();
                // Trigger update
                this.refreshUniversalWatchers();
            });
        }
        refreshUniversalWatchers() {
            // Buffer requests for universal watching to decide on right watcher
            // that supports potentially watching more than one path at once
            this.universalWatchRequestDelayer.trigger(() => {
                return this.doRefreshUniversalWatchers();
            }).catch(error => (0, errors_1.onUnexpectedError)(error));
        }
        doRefreshUniversalWatchers() {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            // Create watcher if this is the first time
            if (!this.universalWatcher) {
                this.universalWatcher = this._register(this.createUniversalWatcher(changes => this._onDidChangeFile.fire((0, watcher_1.toFileChanges)(changes)), msg => this.onWatcherLogMessage(msg), this.logService.getLevel() === log_1.LogLevel.Trace));
                // Apply log levels dynamically
                this._register(this.logService.onDidChangeLogLevel(() => {
                    var _a;
                    (_a = this.universalWatcher) === null || _a === void 0 ? void 0 : _a.setVerboseLogging(this.logService.getLevel() === log_1.LogLevel.Trace);
                }));
            }
            // Adjust for polling
            const usePolling = (_c = (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.watcher) === null || _b === void 0 ? void 0 : _b.recursive) === null || _c === void 0 ? void 0 : _c.usePolling;
            if (usePolling === true) {
                for (const request of this.universalPathsToWatch) {
                    if ((0, watcher_1.isRecursiveWatchRequest)(request)) {
                        request.pollingInterval = (_g = (_f = (_e = (_d = this.options) === null || _d === void 0 ? void 0 : _d.watcher) === null || _e === void 0 ? void 0 : _e.recursive) === null || _f === void 0 ? void 0 : _f.pollingInterval) !== null && _g !== void 0 ? _g : 5000;
                    }
                }
            }
            else if (Array.isArray(usePolling)) {
                for (const request of this.universalPathsToWatch) {
                    if ((0, watcher_1.isRecursiveWatchRequest)(request)) {
                        if (usePolling.includes(request.path)) {
                            request.pollingInterval = (_l = (_k = (_j = (_h = this.options) === null || _h === void 0 ? void 0 : _h.watcher) === null || _j === void 0 ? void 0 : _j.recursive) === null || _k === void 0 ? void 0 : _k.pollingInterval) !== null && _l !== void 0 ? _l : 5000;
                        }
                    }
                }
            }
            // Ask to watch the provided paths
            return this.universalWatcher.watch(this.universalPathsToWatch);
        }
        watchNonRecursive(resource, opts) {
            // Add to list of paths to watch non-recursively
            const pathToWatch = { path: this.toFilePath(resource), excludes: opts.excludes, includes: opts.includes, recursive: false };
            const remove = (0, arrays_1.insert)(this.nonRecursivePathsToWatch, pathToWatch);
            // Trigger update
            this.refreshNonRecursiveWatchers();
            return (0, lifecycle_1.toDisposable)(() => {
                // Remove from list of paths to watch non-recursively
                remove();
                // Trigger update
                this.refreshNonRecursiveWatchers();
            });
        }
        refreshNonRecursiveWatchers() {
            // Buffer requests for nonrecursive watching to decide on right watcher
            // that supports potentially watching more than one path at once
            this.nonRecursiveWatchRequestDelayer.trigger(() => {
                return this.doRefreshNonRecursiveWatchers();
            }).catch(error => (0, errors_1.onUnexpectedError)(error));
        }
        doRefreshNonRecursiveWatchers() {
            // Create watcher if this is the first time
            if (!this.nonRecursiveWatcher) {
                this.nonRecursiveWatcher = this._register(this.createNonRecursiveWatcher(changes => this._onDidChangeFile.fire((0, watcher_1.toFileChanges)(changes)), msg => this.onWatcherLogMessage(msg), this.logService.getLevel() === log_1.LogLevel.Trace));
                // Apply log levels dynamically
                this._register(this.logService.onDidChangeLogLevel(() => {
                    var _a;
                    (_a = this.nonRecursiveWatcher) === null || _a === void 0 ? void 0 : _a.setVerboseLogging(this.logService.getLevel() === log_1.LogLevel.Trace);
                }));
            }
            // Ask to watch the provided paths
            return this.nonRecursiveWatcher.watch(this.nonRecursivePathsToWatch);
        }
        //#endregion
        onWatcherLogMessage(msg) {
            if (msg.type === 'error') {
                this._onDidWatchError.fire(msg.message);
            }
            this.logService[msg.type](msg.message);
        }
        toFilePath(resource) {
            return (0, path_1.normalize)(resource.fsPath);
        }
    }
    exports.AbstractDiskFileSystemProvider = AbstractDiskFileSystemProvider;
});
//# sourceMappingURL=diskFileSystemProvider.js.map