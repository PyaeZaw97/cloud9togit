/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionRecommendations = void 0;
    class ExtensionRecommendations extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._activationPromise = null;
        }
        get activated() { return this._activationPromise !== null; }
        activate() {
            if (!this._activationPromise) {
                this._activationPromise = this.doActivate();
            }
            return this._activationPromise;
        }
    }
    exports.ExtensionRecommendations = ExtensionRecommendations;
});
//# sourceMappingURL=extensionRecommendations.js.map