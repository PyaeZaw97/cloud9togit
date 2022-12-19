/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SignService = void 0;
    class SignService {
        constructor() {
            this.validators = new Map();
        }
        vsda() {
            return new Promise((resolve, reject) => require(['vsda'], resolve, reject));
        }
        async createNewMessage(value) {
            try {
                const vsda = await this.vsda();
                const validator = new vsda.validator();
                if (validator) {
                    const id = String(SignService._nextId++);
                    this.validators.set(id, validator);
                    return {
                        id: id,
                        data: validator.createNewMessage(value)
                    };
                }
            }
            catch (e) {
                // ignore errors silently
            }
            return { id: '', data: value };
        }
        async validate(message, value) {
            if (!message.id) {
                return true;
            }
            const validator = this.validators.get(message.id);
            if (!validator) {
                return false;
            }
            this.validators.delete(message.id);
            try {
                return (validator.validate(value) === 'ok');
            }
            catch (e) {
                // ignore errors silently
                return false;
            }
        }
        async sign(value) {
            try {
                const vsda = await this.vsda();
                const signer = new vsda.signer();
                if (signer) {
                    return signer.sign(value);
                }
            }
            catch (e) {
                // ignore errors silently
            }
            return value;
        }
    }
    exports.SignService = SignService;
    SignService._nextId = 1;
});
//# sourceMappingURL=signService.js.map