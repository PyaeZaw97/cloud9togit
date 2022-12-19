/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SignService = void 0;
    class SignService {
        constructor(token) {
            this._tkn = token || null;
        }
        async createNewMessage(value) {
            return { id: '', data: value };
        }
        async validate(message, value) {
            return true;
        }
        async sign(value) {
            return this._tkn || '';
        }
    }
    exports.SignService = SignService;
});
//# sourceMappingURL=signService.js.map