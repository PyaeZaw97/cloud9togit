/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/files/node/watcher/parcel/parcelWatcher", "vs/platform/files/node/watcher/nodejs/nodejsWatcher", "vs/base/common/async"], function (require, exports, lifecycle_1, event_1, parcelWatcher_1, nodejsWatcher_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UniversalWatcher = void 0;
    class UniversalWatcher extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.recursiveWatcher = this._register(new parcelWatcher_1.ParcelWatcher());
            this.nonRecursiveWatcher = this._register(new nodejsWatcher_1.NodeJSWatcher());
            this.onDidChangeFile = event_1.Event.any(this.recursiveWatcher.onDidChangeFile, this.nonRecursiveWatcher.onDidChangeFile);
            this.onDidLogMessage = event_1.Event.any(this.recursiveWatcher.onDidLogMessage, this.nonRecursiveWatcher.onDidLogMessage);
            this.onDidError = event_1.Event.any(this.recursiveWatcher.onDidError, this.nonRecursiveWatcher.onDidError);
        }
        async watch(requests) {
            const recursiveWatchRequests = [];
            const nonRecursiveWatchRequests = [];
            for (const request of requests) {
                if (request.recursive) {
                    recursiveWatchRequests.push(request);
                }
                else {
                    nonRecursiveWatchRequests.push(request);
                }
            }
            await async_1.Promises.settled([
                this.recursiveWatcher.watch(recursiveWatchRequests),
                this.nonRecursiveWatcher.watch(nonRecursiveWatchRequests)
            ]);
        }
        async setVerboseLogging(enabled) {
            await async_1.Promises.settled([
                this.recursiveWatcher.setVerboseLogging(enabled),
                this.nonRecursiveWatcher.setVerboseLogging(enabled)
            ]);
        }
        async stop() {
            await async_1.Promises.settled([
                this.recursiveWatcher.stop(),
                this.nonRecursiveWatcher.stop()
            ]);
        }
    }
    exports.UniversalWatcher = UniversalWatcher;
});
//# sourceMappingURL=watcher.js.map