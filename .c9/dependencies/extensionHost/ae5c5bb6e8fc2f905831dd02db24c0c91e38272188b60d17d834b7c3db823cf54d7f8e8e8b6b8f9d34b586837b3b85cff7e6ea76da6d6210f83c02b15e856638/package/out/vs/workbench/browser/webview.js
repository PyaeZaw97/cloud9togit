define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parentOriginHash = void 0;
    /*---------------------------------------------------------------------------------------------
     *  Copyright (c) Microsoft Corporation. All rights reserved.
     *  Licensed under the MIT License. See License.txt in the project root for license information.
     *--------------------------------------------------------------------------------------------*/
    /**
     * Returns a sha-256 composed of `parentOrigin` and `salt` converted to base 32
     */
    async function parentOriginHash(parentOrigin, salt) {
        // This same code is also inlined at `src/vs/workbench/services/extensions/worker/webWorkerExtensionHostIframe.html`
        if (!crypto.subtle) {
            throw new Error(`Can't compute sha-256`);
        }
        const strData = JSON.stringify({ parentOrigin, salt });
        const encoder = new TextEncoder();
        const arrData = encoder.encode(strData);
        const hash = await crypto.subtle.digest('sha-256', arrData);
        return sha256AsBase32(hash);
    }
    exports.parentOriginHash = parentOriginHash;
    function sha256AsBase32(bytes) {
        const array = Array.from(new Uint8Array(bytes));
        const hexArray = array.map(b => b.toString(16).padStart(2, '0')).join('');
        // sha256 has 256 bits, so we need at most ceil(lg(2^256-1)/lg(32)) = 52 chars to represent it in base 32
        return BigInt(`0x${hexArray}`).toString(32).padStart(52, '0');
    }
});
//# sourceMappingURL=webview.js.map