/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/debug/common/extensionHostDebug", "vs/platform/ipc/electron-sandbox/services", "vs/platform/debug/common/extensionHostDebugIpc"], function (require, exports, extensionHostDebug_1, services_1, extensionHostDebugIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, services_1.registerMainProcessRemoteService)(extensionHostDebug_1.IExtensionHostDebugService, extensionHostDebugIpc_1.ExtensionHostDebugBroadcastChannel.ChannelName, { supportsDelayedInstantiation: true, channelClientCtor: extensionHostDebugIpc_1.ExtensionHostDebugChannelClient });
});
//# sourceMappingURL=extensionHostDebugService.js.map