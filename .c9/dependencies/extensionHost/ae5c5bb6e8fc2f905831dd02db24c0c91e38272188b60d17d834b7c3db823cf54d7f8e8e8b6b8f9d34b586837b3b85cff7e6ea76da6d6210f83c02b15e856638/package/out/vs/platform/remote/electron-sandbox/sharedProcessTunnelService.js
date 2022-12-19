/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/ipc/electron-sandbox/services", "vs/platform/remote/common/sharedProcessTunnelService"], function (require, exports, services_1, sharedProcessTunnelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, services_1.registerSharedProcessRemoteService)(sharedProcessTunnelService_1.ISharedProcessTunnelService, sharedProcessTunnelService_1.ipcSharedProcessTunnelChannelName, { supportsDelayedInstantiation: true });
});
//# sourceMappingURL=sharedProcessTunnelService.js.map