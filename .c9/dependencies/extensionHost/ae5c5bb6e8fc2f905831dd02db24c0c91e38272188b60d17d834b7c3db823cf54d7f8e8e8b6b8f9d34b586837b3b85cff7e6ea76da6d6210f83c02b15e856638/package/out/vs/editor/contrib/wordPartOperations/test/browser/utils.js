/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StaticServiceAccessor = void 0;
    class StaticServiceAccessor {
        constructor() {
            this.services = new Map();
        }
        withService(id, service) {
            this.services.set(id, service);
            return this;
        }
        get(id) {
            const value = this.services.get(id);
            if (!value) {
                throw new Error('Service does not exist');
            }
            return value;
        }
    }
    exports.StaticServiceAccessor = StaticServiceAccessor;
});
//# sourceMappingURL=utils.js.map