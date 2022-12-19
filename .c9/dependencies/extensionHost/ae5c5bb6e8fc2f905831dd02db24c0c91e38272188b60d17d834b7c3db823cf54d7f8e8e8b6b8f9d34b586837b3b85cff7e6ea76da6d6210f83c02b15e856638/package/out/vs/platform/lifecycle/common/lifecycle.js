/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async"], function (require, exports, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.handleVetos = void 0;
    // Shared veto handling across main and renderer
    function handleVetos(vetos, onError) {
        if (vetos.length === 0) {
            return Promise.resolve(false);
        }
        const promises = [];
        let lazyValue = false;
        for (let valueOrPromise of vetos) {
            // veto, done
            if (valueOrPromise === true) {
                return Promise.resolve(true);
            }
            if ((0, async_1.isThenable)(valueOrPromise)) {
                promises.push(valueOrPromise.then(value => {
                    if (value) {
                        lazyValue = true; // veto, done
                    }
                }, err => {
                    onError(err); // error, treated like a veto, done
                    lazyValue = true;
                }));
            }
        }
        return async_1.Promises.settled(promises).then(() => lazyValue);
    }
    exports.handleVetos = handleVetos;
});
//# sourceMappingURL=lifecycle.js.map