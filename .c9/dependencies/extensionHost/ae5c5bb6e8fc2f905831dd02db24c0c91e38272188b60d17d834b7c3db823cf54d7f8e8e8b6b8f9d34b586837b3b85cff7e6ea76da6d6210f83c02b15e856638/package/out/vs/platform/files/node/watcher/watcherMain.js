/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/node/ipc.cp", "vs/platform/files/node/watcher/watcher"], function (require, exports, ipc_1, ipc_cp_1, watcher_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const server = new ipc_cp_1.Server('watcher');
    const service = new watcher_1.UniversalWatcher();
    server.registerChannel('watcher', ipc_1.ProxyChannel.fromService(service));
});
//# sourceMappingURL=watcherMain.js.map