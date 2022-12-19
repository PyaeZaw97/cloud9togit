/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/registry/common/platform"], function (require, exports, event_1, lifecycle_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Extensions = void 0;
    var Extensions;
    (function (Extensions) {
        Extensions.ProfileStorageRegistry = 'workbench.registry.profile.storage';
    })(Extensions = exports.Extensions || (exports.Extensions = {}));
    class ProfileStorageRegistryImpl extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidRegister = this._register(new event_1.Emitter());
            this.onDidRegister = this._onDidRegister.event;
            this.storageKeys = new Map();
        }
        get all() {
            return [...this.storageKeys.values()].flat();
        }
        registerKeys(keys) {
            for (const key of keys) {
                this.storageKeys.set(key.key, key);
            }
            this._onDidRegister.fire(keys);
        }
    }
    platform_1.Registry.add(Extensions.ProfileStorageRegistry, new ProfileStorageRegistryImpl());
});
//# sourceMappingURL=profileStorageRegistry.js.map