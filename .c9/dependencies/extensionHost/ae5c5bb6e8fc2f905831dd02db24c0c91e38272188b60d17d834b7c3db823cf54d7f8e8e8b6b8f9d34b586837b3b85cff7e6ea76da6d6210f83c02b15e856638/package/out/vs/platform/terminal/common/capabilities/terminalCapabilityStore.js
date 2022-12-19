/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalCapabilityStoreMultiplexer = exports.TerminalCapabilityStore = void 0;
    class TerminalCapabilityStore extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._map = new Map();
            this._onDidRemoveCapability = this._register(new event_1.Emitter());
            this.onDidRemoveCapability = this._onDidRemoveCapability.event;
            this._onDidAddCapability = this._register(new event_1.Emitter());
            this.onDidAddCapability = this._onDidAddCapability.event;
        }
        get items() {
            return this._map.keys();
        }
        add(capability, impl) {
            this._map.set(capability, impl);
            this._onDidAddCapability.fire(capability);
        }
        get(capability) {
            // HACK: This isn't totally safe since the Map key and value are not connected
            return this._map.get(capability);
        }
        remove(capability) {
            if (!this._map.has(capability)) {
                return;
            }
            this._map.delete(capability);
            this._onDidRemoveCapability.fire(capability);
        }
        has(capability) {
            return this._map.has(capability);
        }
    }
    exports.TerminalCapabilityStore = TerminalCapabilityStore;
    class TerminalCapabilityStoreMultiplexer extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._stores = [];
            this._onDidRemoveCapability = this._register(new event_1.Emitter());
            this.onDidRemoveCapability = this._onDidRemoveCapability.event;
            this._onDidAddCapability = this._register(new event_1.Emitter());
            this.onDidAddCapability = this._onDidAddCapability.event;
        }
        get items() {
            return this._items();
        }
        *_items() {
            for (const store of this._stores) {
                for (const c of store.items) {
                    yield c;
                }
            }
        }
        has(capability) {
            for (const store of this._stores) {
                for (const c of store.items) {
                    if (c === capability) {
                        return true;
                    }
                }
            }
            return false;
        }
        get(capability) {
            for (const store of this._stores) {
                const c = store.get(capability);
                if (c) {
                    return c;
                }
            }
            return undefined;
        }
        add(store) {
            this._stores.push(store);
            for (const capability of store.items) {
                this._onDidAddCapability.fire(capability);
            }
            store.onDidAddCapability(e => this._onDidAddCapability.fire(e));
            store.onDidRemoveCapability(e => this._onDidRemoveCapability.fire(e));
        }
    }
    exports.TerminalCapabilityStoreMultiplexer = TerminalCapabilityStoreMultiplexer;
});
//# sourceMappingURL=terminalCapabilityStore.js.map