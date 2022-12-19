/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextModelPart = void 0;
    class TextModelPart extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._isDisposed = false;
        }
        dispose() {
            super.dispose();
            this._isDisposed = true;
        }
        assertNotDisposed() {
            if (this._isDisposed) {
                throw new Error('TextModelPart is disposed!');
            }
        }
    }
    exports.TextModelPart = TextModelPart;
});
//# sourceMappingURL=textModelPart.js.map