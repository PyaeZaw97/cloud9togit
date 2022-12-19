/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/parts/ipc/common/ipc.mp"], function (require, exports, ipc_mp_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Client = void 0;
    /**
     * An implementation of a `IPCClient` on top of DOM `MessagePort`.
     */
    class Client extends ipc_mp_1.Client {
        /**
         * @param clientId a way to uniquely identify this client among
         * other clients. this is important for routing because every
         * client can also be a server
         */
        constructor(port, clientId) {
            super(port, clientId);
        }
    }
    exports.Client = Client;
});
//# sourceMappingURL=ipc.mp.js.map