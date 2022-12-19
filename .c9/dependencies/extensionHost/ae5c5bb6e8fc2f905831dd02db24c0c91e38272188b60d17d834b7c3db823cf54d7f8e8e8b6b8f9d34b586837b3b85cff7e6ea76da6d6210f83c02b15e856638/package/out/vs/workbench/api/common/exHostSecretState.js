/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHost.protocol", "vs/base/common/event", "vs/platform/instantiation/common/instantiation"], function (require, exports, extHost_protocol_1, event_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostSecretState = exports.ExtHostSecretState = void 0;
    class ExtHostSecretState {
        constructor(mainContext) {
            this._onDidChangePassword = new event_1.Emitter();
            this.onDidChangePassword = this._onDidChangePassword.event;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadSecretState);
        }
        async $onDidChangePassword(e) {
            this._onDidChangePassword.fire(e);
        }
        get(extensionId, key) {
            return this._proxy.$getPassword(extensionId, key);
        }
        store(extensionId, key, value) {
            return this._proxy.$setPassword(extensionId, key, value);
        }
        delete(extensionId, key) {
            return this._proxy.$deletePassword(extensionId, key);
        }
    }
    exports.ExtHostSecretState = ExtHostSecretState;
    exports.IExtHostSecretState = (0, instantiation_1.createDecorator)('IExtHostSecretState');
});
//# sourceMappingURL=exHostSecretState.js.map