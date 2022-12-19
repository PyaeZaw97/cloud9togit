/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/common/ipc.electron", "vs/base/parts/sandbox/electron-sandbox/globals"], function (require, exports, buffer_1, event_1, ipc_1, ipc_electron_1, globals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Client = void 0;
    /**
     * An implementation of `IPCClient` on top of Electron `ipcRenderer` IPC communication
     * provided from sandbox globals (via preload script).
     */
    class Client extends ipc_1.IPCClient {
        constructor(id) {
            const protocol = Client.createProtocol();
            super(protocol, id);
            this.protocol = protocol;
        }
        static createProtocol() {
            const onMessage = event_1.Event.fromNodeEventEmitter(globals_1.ipcRenderer, 'vscode:message', (_, message) => buffer_1.VSBuffer.wrap(message));
            globals_1.ipcRenderer.send('vscode:hello');
            return new ipc_electron_1.Protocol(globals_1.ipcRenderer, onMessage);
        }
        dispose() {
            this.protocol.disconnect();
        }
    }
    exports.Client = Client;
});
//# sourceMappingURL=ipc.electron.js.map