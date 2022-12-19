/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/parts/ipc/electron-sandbox/ipc.electron"], function (require, exports, lifecycle_1, ipc_electron_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ElectronIPCMainProcessService = void 0;
    /**
     * An implementation of `IMainProcessService` that leverages Electron's IPC.
     */
    class ElectronIPCMainProcessService extends lifecycle_1.Disposable {
        constructor(windowId) {
            super();
            this.mainProcessConnection = this._register(new ipc_electron_1.Client(`window:${windowId}`));
        }
        getChannel(channelName) {
            return this.mainProcessConnection.getChannel(channelName);
        }
        registerChannel(channelName, channel) {
            this.mainProcessConnection.registerChannel(channelName, channel);
        }
    }
    exports.ElectronIPCMainProcessService = ElectronIPCMainProcessService;
});
//# sourceMappingURL=mainProcessService.js.map