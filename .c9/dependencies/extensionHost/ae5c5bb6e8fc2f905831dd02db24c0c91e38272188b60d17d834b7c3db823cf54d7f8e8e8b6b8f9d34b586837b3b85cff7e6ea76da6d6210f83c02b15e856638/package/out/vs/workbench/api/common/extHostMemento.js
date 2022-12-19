/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async"], function (require, exports, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionGlobalMemento = exports.ExtensionMemento = void 0;
    class ExtensionMemento {
        constructor(id, global, storage) {
            this._deferredPromises = new Map();
            this._id = id;
            this._shared = global;
            this._storage = storage;
            this._init = this._storage.initializeExtensionStorage(this._shared, this._id, Object.create(null)).then(value => {
                this._value = value;
                return this;
            });
            this._storageListener = this._storage.onDidChangeStorage(e => {
                if (e.shared === this._shared && e.key === this._id) {
                    this._value = e.value;
                }
            });
            this._scheduler = new async_1.RunOnceScheduler(() => {
                const records = this._deferredPromises;
                this._deferredPromises = new Map();
                (async () => {
                    try {
                        await this._storage.setValue(this._shared, this._id, this._value);
                        for (const value of records.values()) {
                            value.complete();
                        }
                    }
                    catch (e) {
                        for (const value of records.values()) {
                            value.error(e);
                        }
                    }
                })();
            }, 0);
        }
        keys() {
            var _a;
            // Filter out `undefined` values, as they can stick around in the `_value` until the `onDidChangeStorage` event runs
            return Object.entries((_a = this._value) !== null && _a !== void 0 ? _a : {}).filter(([, value]) => value !== undefined).map(([key]) => key);
        }
        get whenReady() {
            return this._init;
        }
        get(key, defaultValue) {
            let value = this._value[key];
            if (typeof value === 'undefined') {
                value = defaultValue;
            }
            return value;
        }
        update(key, value) {
            this._value[key] = value;
            let record = this._deferredPromises.get(key);
            if (record !== undefined) {
                return record.p;
            }
            const promise = new async_1.DeferredPromise();
            this._deferredPromises.set(key, promise);
            if (!this._scheduler.isScheduled()) {
                this._scheduler.schedule();
            }
            return promise.p;
        }
        dispose() {
            this._storageListener.dispose();
        }
    }
    exports.ExtensionMemento = ExtensionMemento;
    class ExtensionGlobalMemento extends ExtensionMemento {
        constructor(extensionDescription, storage) {
            super(extensionDescription.identifier.value, true, storage);
            this._extension = extensionDescription;
        }
        setKeysForSync(keys) {
            this._storage.registerExtensionStorageKeysToSync({ id: this._id, version: this._extension.version }, keys);
        }
    }
    exports.ExtensionGlobalMemento = ExtensionGlobalMemento;
});
//# sourceMappingURL=extHostMemento.js.map