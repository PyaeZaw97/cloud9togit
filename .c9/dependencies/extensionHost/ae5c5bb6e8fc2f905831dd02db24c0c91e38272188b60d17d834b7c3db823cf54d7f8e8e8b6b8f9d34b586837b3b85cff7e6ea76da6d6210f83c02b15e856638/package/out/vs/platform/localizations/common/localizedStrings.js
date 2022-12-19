/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * These are some predefined strings that we test during smoke testing that they are localized
     * correctly. Don't change these strings!!
     */
    const open = nls.localize('open', 'open');
    const close = nls.localize('close', 'close');
    const find = nls.localize('find', 'find');
    exports.default = {
        open: open,
        close: close,
        find: find
    };
});
//# sourceMappingURL=localizedStrings.js.map