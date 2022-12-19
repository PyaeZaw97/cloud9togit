/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.flakySuite = void 0;
    function flakySuite(title, fn) {
        return suite(title, function () {
            // Flaky suites need retries and timeout to complete
            // e.g. because they access browser features which can
            // be unreliable depending on the environment.
            this.retries(3);
            this.timeout(1000 * 20);
            // Invoke suite ensuring that `this` is
            // properly wired in.
            fn.call(this);
        });
    }
    exports.flakySuite = flakySuite;
});
//# sourceMappingURL=testUtils.js.map