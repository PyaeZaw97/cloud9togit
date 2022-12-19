/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Protocol = void 0;
    /**
     * The Electron `Protocol` leverages Electron style IPC communication (`ipcRenderer`, `ipcMain`)
     * for the implementation of the `IMessagePassingProtocol`. That style of API requires a channel
     * name for sending data.
     */
    class Protocol {
        constructor(sender, onMessage) {
            this.sender = sender;
            this.onMessage = onMessage;
        }
        send(message) {
            try {
                this.sender.send('vscode:message', message.buffer);
            }
            catch (e) {
                // systems are going down
            }
        }
        disconnect() {
            this.sender.send('vscode:disconnect', null);
        }
    }
    exports.Protocol = Protocol;
});
//# sourceMappingURL=ipc.electron.js.map