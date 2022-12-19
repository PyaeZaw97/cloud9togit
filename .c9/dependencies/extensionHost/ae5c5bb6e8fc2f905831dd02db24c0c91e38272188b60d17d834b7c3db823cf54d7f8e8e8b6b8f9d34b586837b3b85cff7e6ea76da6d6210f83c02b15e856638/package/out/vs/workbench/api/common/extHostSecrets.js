/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
define(["require", "exports", "vs/platform/extensions/common/extensions", "vs/base/common/event"], function (require, exports, extensions_1, event_1) {
    "use strict";
    var _ExtensionSecrets_secretState;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionSecrets = void 0;
    class ExtensionSecrets {
        constructor(extensionDescription, secretState) {
            _ExtensionSecrets_secretState.set(this, void 0);
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._id = extensions_1.ExtensionIdentifier.toKey(extensionDescription.identifier);
            __classPrivateFieldSet(this, _ExtensionSecrets_secretState, secretState, "f");
            __classPrivateFieldGet(this, _ExtensionSecrets_secretState, "f").onDidChangePassword(e => {
                if (e.extensionId === this._id) {
                    this._onDidChange.fire({ key: e.key });
                }
            });
        }
        get(key) {
            return __classPrivateFieldGet(this, _ExtensionSecrets_secretState, "f").get(this._id, key);
        }
        store(key, value) {
            return __classPrivateFieldGet(this, _ExtensionSecrets_secretState, "f").store(this._id, key, value);
        }
        delete(key) {
            return __classPrivateFieldGet(this, _ExtensionSecrets_secretState, "f").delete(this._id, key);
        }
    }
    exports.ExtensionSecrets = ExtensionSecrets;
    _ExtensionSecrets_secretState = new WeakMap();
});
//# sourceMappingURL=extHostSecrets.js.map