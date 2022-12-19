/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/files/common/watcher", "vs/platform/files/node/watcher/nodejs/nodejsWatcher"], function (require, exports, watcher_1, nodejsWatcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NodeJSWatcherClient = void 0;
    class NodeJSWatcherClient extends watcher_1.AbstractNonRecursiveWatcherClient {
        constructor(onFileChanges, onLogMessage, verboseLogging) {
            super(onFileChanges, onLogMessage, verboseLogging);
            this.init();
        }
        createWatcher() {
            return new nodejsWatcher_1.NodeJSWatcher();
        }
    }
    exports.NodeJSWatcherClient = NodeJSWatcherClient;
});
//# sourceMappingURL=nodejsClient.js.map