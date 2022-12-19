/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/base/common/event", "vs/base/parts/ipc/common/ipc", "vs/base/parts/ipc/common/ipc.mp"], function (require, exports, electron_1, event_1, ipc_1, ipc_mp_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Server = void 0;
    /**
     * An implementation of a `IPCServer` on top of MessagePort style IPC communication.
     * The clients register themselves via Electron IPC transfer.
     */
    class Server extends ipc_1.IPCServer {
        static getOnDidClientConnect() {
            // Clients connect via `vscode:createMessageChannel` to get a
            // `MessagePort` that is ready to be used. For every connection
            // we create a pair of message ports and send it back.
            //
            // The `nonce` is included so that the main side has a chance to
            // correlate the response back to the sender.
            const onCreateMessageChannel = event_1.Event.fromNodeEventEmitter(electron_1.ipcRenderer, 'vscode:createMessageChannel', (_, nonce) => nonce);
            return event_1.Event.map(onCreateMessageChannel, nonce => {
                // Create a new pair of ports and protocol for this connection
                const { port1: incomingPort, port2: outgoingPort } = new MessageChannel();
                const protocol = new ipc_mp_1.Protocol(incomingPort);
                const result = {
                    protocol,
                    // Not part of the standard spec, but in Electron we get a `close` event
                    // when the other side closes. We can use this to detect disconnects
                    // (https://github.com/electron/electron/blob/11-x-y/docs/api/message-port-main.md#event-close)
                    onDidClientDisconnect: event_1.Event.fromDOMEventEmitter(incomingPort, 'close')
                };
                // Send one port back to the requestor
                // Note: we intentionally use `electron` APIs here because
                // transferables like the `MessagePort` cannot be transferred
                // over preload scripts when `contextIsolation: true`
                electron_1.ipcRenderer.postMessage('vscode:createMessageChannelResult', nonce, [outgoingPort]);
                return result;
            });
        }
        constructor() {
            super(Server.getOnDidClientConnect());
        }
    }
    exports.Server = Server;
});
//# sourceMappingURL=ipc.mp.js.map