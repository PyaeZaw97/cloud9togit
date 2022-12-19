/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/glob", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/files/node/watcher/nodejs/nodejsWatcherLib"], function (require, exports, event_1, glob_1, lifecycle_1, platform_1, nodejsWatcherLib_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeJSWatcher = void 0;
    class NodeJSWatcher extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this._onDidLogMessage = this._register(new event_1.Emitter());
            this.onDidLogMessage = this._onDidLogMessage.event;
            this.onDidError = event_1.Event.None;
            this.watchers = new Map();
            this.verboseLogging = false;
        }
        async watch(requests) {
            // Figure out duplicates to remove from the requests
            const normalizedRequests = this.normalizeRequests(requests);
            // Gather paths that we should start watching
            const requestsToStartWatching = normalizedRequests.filter(request => {
                const watcher = this.watchers.get(request.path);
                if (!watcher) {
                    return true; // not yet watching that path
                }
                // Re-watch path if excludes or includes have changed
                return !(0, glob_1.patternsEquals)(watcher.request.excludes, request.excludes) || !(0, glob_1.patternsEquals)(watcher.request.includes, request.includes);
            });
            // Gather paths that we should stop watching
            const pathsToStopWatching = Array.from(this.watchers.values()).filter(({ request }) => {
                return !normalizedRequests.find(normalizedRequest => normalizedRequest.path === request.path && (0, glob_1.patternsEquals)(normalizedRequest.excludes, request.excludes) && (0, glob_1.patternsEquals)(normalizedRequest.includes, request.includes));
            }).map(({ request }) => request.path);
            // Logging
            if (requestsToStartWatching.length) {
                this.trace(`Request to start watching: ${requestsToStartWatching.map(request => `${request.path} (excludes: ${request.excludes.length > 0 ? request.excludes : '<none>'}, includes: ${request.includes && request.includes.length > 0 ? request.includes : '<all>'})`).join(',')}`);
            }
            if (pathsToStopWatching.length) {
                this.trace(`Request to stop watching: ${pathsToStopWatching.join(',')}`);
            }
            // Stop watching as instructed
            for (const pathToStopWatching of pathsToStopWatching) {
                this.stopWatching(pathToStopWatching);
            }
            // Start watching as instructed
            for (const request of requestsToStartWatching) {
                this.startWatching(request);
            }
        }
        startWatching(request) {
            // Start via node.js lib
            const instance = new nodejsWatcherLib_1.NodeJSFileWatcherLibrary(request, changes => this._onDidChangeFile.fire(changes), msg => this._onDidLogMessage.fire(msg), this.verboseLogging);
            // Remember as watcher instance
            const watcher = { request, instance };
            this.watchers.set(request.path, watcher);
        }
        async stop() {
            for (const [path] of this.watchers) {
                this.stopWatching(path);
            }
            this.watchers.clear();
        }
        stopWatching(path) {
            const watcher = this.watchers.get(path);
            if (watcher) {
                this.watchers.delete(path);
                watcher.instance.dispose();
            }
        }
        normalizeRequests(requests) {
            const requestsMap = new Map();
            // Ignore requests for the same paths
            for (const request of requests) {
                const path = platform_1.isLinux ? request.path : request.path.toLowerCase(); // adjust for case sensitivity
                requestsMap.set(path, request);
            }
            return Array.from(requestsMap.values());
        }
        async setVerboseLogging(enabled) {
            this.verboseLogging = enabled;
            for (const [, watcher] of this.watchers) {
                watcher.instance.setVerboseLogging(enabled);
            }
        }
        trace(message) {
            if (this.verboseLogging) {
                this._onDidLogMessage.fire({ type: 'trace', message: this.toMessage(message) });
            }
        }
        toMessage(message, watcher) {
            return watcher ? `[File Watcher (node.js)] ${message} (path: ${watcher.request.path})` : `[File Watcher (node.js)] ${message}`;
        }
    }
    exports.NodeJSWatcher = NodeJSWatcher;
});
//# sourceMappingURL=nodejsWatcher.js.map