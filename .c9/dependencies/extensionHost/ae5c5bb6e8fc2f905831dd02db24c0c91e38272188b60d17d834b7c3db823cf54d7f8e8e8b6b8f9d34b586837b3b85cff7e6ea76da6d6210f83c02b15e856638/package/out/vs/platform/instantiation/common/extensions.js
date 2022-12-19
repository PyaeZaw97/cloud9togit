/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "./descriptors"], function (require, exports, descriptors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSingletonServiceDescriptors = exports.registerSingleton = void 0;
    const _registry = [];
    function registerSingleton(id, ctorOrDescriptor, supportsDelayedInstantiation) {
        if (!(ctorOrDescriptor instanceof descriptors_1.SyncDescriptor)) {
            ctorOrDescriptor = new descriptors_1.SyncDescriptor(ctorOrDescriptor, [], supportsDelayedInstantiation);
        }
        _registry.push([id, ctorOrDescriptor]);
    }
    exports.registerSingleton = registerSingleton;
    function getSingletonServiceDescriptors() {
        return _registry;
    }
    exports.getSingletonServiceDescriptors = getSingletonServiceDescriptors;
});
//# sourceMappingURL=extensions.js.map