/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/ipc/electron-sandbox/services"], function (require, exports, instantiation_1, services_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExternalTerminalMainService = void 0;
    exports.IExternalTerminalMainService = (0, instantiation_1.createDecorator)('externalTerminal');
    (0, services_1.registerMainProcessRemoteService)(exports.IExternalTerminalMainService, 'externalTerminal', { supportsDelayedInstantiation: true });
});
//# sourceMappingURL=externalTerminalMainService.js.map