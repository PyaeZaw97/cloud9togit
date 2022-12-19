/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionHostStatusService = exports.IExtensionHostStatusService = void 0;
    exports.IExtensionHostStatusService = (0, instantiation_1.createDecorator)('extensionHostStatusService');
    class ExtensionHostStatusService {
        constructor() {
            this._exitInfo = new Map();
        }
        setExitInfo(reconnectionToken, info) {
            this._exitInfo.set(reconnectionToken, info);
        }
        getExitInfo(reconnectionToken) {
            return this._exitInfo.get(reconnectionToken) || null;
        }
    }
    exports.ExtensionHostStatusService = ExtensionHostStatusService;
});
//# sourceMappingURL=extensionHostStatusService.js.map