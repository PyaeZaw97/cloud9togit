/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/event", "vs/platform/storage/common/storage"], function (require, exports, event_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StoredValue = void 0;
    const defaultSerialization = {
        deserialize: d => JSON.parse(d),
        serialize: d => JSON.stringify(d),
    };
    /**
     * todo@connor4312: is this worthy to be in common?
     */
    let StoredValue = class StoredValue {
        constructor(options, storage) {
            var _a;
            this.storage = storage;
            /**
             * Emitted whenever the value is updated or deleted.
             */
            this.onDidChange = event_1.Event.filter(this.storage.onDidChangeValue, e => e.key === this.key);
            this.key = options.key;
            this.scope = options.scope;
            this.target = options.target;
            this.serialization = (_a = options.serialization) !== null && _a !== void 0 ? _a : defaultSerialization;
        }
        get(defaultValue) {
            const value = this.storage.get(this.key, this.scope);
            return value === undefined ? defaultValue : this.serialization.deserialize(value);
        }
        /**
         * Persists changes to the value.
         * @param value
         */
        store(value) {
            this.storage.store(this.key, this.serialization.serialize(value), this.scope, this.target);
        }
        /**
         * Delete an element stored under the provided key from storage.
         */
        delete() {
            this.storage.remove(this.key, this.scope);
        }
    };
    StoredValue = __decorate([
        __param(1, storage_1.IStorageService)
    ], StoredValue);
    exports.StoredValue = StoredValue;
});
//# sourceMappingURL=storedValue.js.map