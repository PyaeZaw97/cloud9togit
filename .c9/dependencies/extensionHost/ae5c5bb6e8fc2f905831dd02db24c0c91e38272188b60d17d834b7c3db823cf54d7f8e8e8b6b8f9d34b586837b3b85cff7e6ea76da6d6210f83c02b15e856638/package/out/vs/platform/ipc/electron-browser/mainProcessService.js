/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MessagePortMainProcessService = void 0;
    /**
     * An implementation of `IMainProcessService` that leverages MessagePorts.
     */
    class MessagePortMainProcessService {
        constructor(server, router) {
            this.server = server;
            this.router = router;
        }
        getChannel(channelName) {
            return this.server.getChannel(channelName, this.router);
        }
        registerChannel(channelName, channel) {
            this.server.registerChannel(channelName, channel);
        }
    }
    exports.MessagePortMainProcessService = MessagePortMainProcessService;
});
//# sourceMappingURL=mainProcessService.js.map