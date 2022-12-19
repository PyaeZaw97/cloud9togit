/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/parts/ipc/common/ipc"], function (require, exports, buffer_1, event_1, ipc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Client = exports.Protocol = void 0;
    /**
     * The MessagePort `Protocol` leverages MessagePort style IPC communication
     * for the implementation of the `IMessagePassingProtocol`. That style of API
     * is a simple `onmessage` / `postMessage` pattern.
     */
    class Protocol {
        constructor(port) {
            this.port = port;
            this.onMessage = event_1.Event.fromDOMEventEmitter(this.port, 'message', (e) => buffer_1.VSBuffer.wrap(e.data));
            // we must call start() to ensure messages are flowing
            port.start();
        }
        send(message) {
            this.port.postMessage(message.buffer);
        }
        disconnect() {
            this.port.close();
        }
    }
    exports.Protocol = Protocol;
    /**
     * An implementation of a `IPCClient` on top of MessagePort style IPC communication.
     */
    class Client extends ipc_1.IPCClient {
        constructor(port, clientId) {
            const protocol = new Protocol(port);
            super(protocol, clientId);
            this.protocol = protocol;
        }
        dispose() {
            this.protocol.disconnect();
        }
    }
    exports.Client = Client;
});
//# sourceMappingURL=ipc.mp.js.map