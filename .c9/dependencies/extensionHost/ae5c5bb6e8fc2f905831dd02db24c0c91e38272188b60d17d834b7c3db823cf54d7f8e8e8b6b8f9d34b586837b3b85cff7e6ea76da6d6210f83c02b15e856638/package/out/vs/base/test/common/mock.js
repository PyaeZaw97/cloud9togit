/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "sinon"], function (require, exports, sinon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mockObject = exports.mock = void 0;
    function mock() {
        return function () { };
    }
    exports.mock = mock;
    // Creates an object object that returns sinon mocks for every property. Optionally
    // takes base properties.
    const mockObject = () => (properties) => {
        return new Proxy(Object.assign({}, properties), {
            get(target, key) {
                if (!target.hasOwnProperty(key)) {
                    target[key] = (0, sinon_1.stub)();
                }
                return target[key];
            },
            set(target, key, value) {
                target[key] = value;
                return true;
            },
        });
    };
    exports.mockObject = mockObject;
});
//# sourceMappingURL=mock.js.map