/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.escapeNonWindowsPath = void 0;
    function escapeNonWindowsPath(path) {
        let newPath = path;
        if (newPath.indexOf('\\') !== 0) {
            newPath = newPath.replace(/\\/g, '\\\\');
        }
        const bannedChars = /[\`\$\|\&\>\~\#\!\^\*\;\<\"\']/g;
        newPath = newPath.replace(bannedChars, '');
        return `'${newPath}'`;
    }
    exports.escapeNonWindowsPath = escapeNonWindowsPath;
});
//# sourceMappingURL=terminalEnvironment.js.map