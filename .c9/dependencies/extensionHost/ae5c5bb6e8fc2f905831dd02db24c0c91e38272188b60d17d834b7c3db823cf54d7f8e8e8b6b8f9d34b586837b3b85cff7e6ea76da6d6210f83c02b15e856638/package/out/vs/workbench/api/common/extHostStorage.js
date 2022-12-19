/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./extHost.protocol", "vs/base/common/event", "vs/platform/instantiation/common/instantiation"], function (require, exports, extHost_protocol_1, event_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostStorage = exports.ExtHostStorage = void 0;
    class ExtHostStorage {
        constructor(mainContext) {
            this._onDidChangeStorage = new event_1.Emitter();
            this.onDidChangeStorage = this._onDidChangeStorage.event;
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadStorage);
        }
        registerExtensionStorageKeysToSync(extension, keys) {
            this._proxy.$registerExtensionStorageKeysToSync(extension, keys);
        }
        initializeExtensionStorage(shared, key, defaultValue) {
            return this._proxy.$initializeExtensionStorage(shared, key).then(value => value || defaultValue);
        }
        setValue(shared, key, value) {
            return this._proxy.$setValue(shared, key, value);
        }
        $acceptValue(shared, key, value) {
            this._onDidChangeStorage.fire({ shared, key, value });
        }
    }
    exports.ExtHostStorage = ExtHostStorage;
    exports.IExtHostStorage = (0, instantiation_1.createDecorator)('IExtHostStorage');
});
//# sourceMappingURL=extHostStorage.js.map