/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalBuiltinLinkType = void 0;
    var TerminalBuiltinLinkType;
    (function (TerminalBuiltinLinkType) {
        /**
         * The link is validated to be a file on the file system and will open an editor.
         */
        TerminalBuiltinLinkType[TerminalBuiltinLinkType["LocalFile"] = 0] = "LocalFile";
        /**
         * The link is validated to be a folder on the file system and is outside the workspace. It will
         * reveal the folder within the explorer.
         */
        TerminalBuiltinLinkType[TerminalBuiltinLinkType["LocalFolderOutsideWorkspace"] = 1] = "LocalFolderOutsideWorkspace";
        /**
         * The link is validated to be a folder on the file system and is within the workspace and will
         * reveal the folder within the explorer.
         */
        TerminalBuiltinLinkType[TerminalBuiltinLinkType["LocalFolderInWorkspace"] = 2] = "LocalFolderInWorkspace";
        /**
         * A low confidence link which will search for the file in the workspace. If there is a single
         * match, it will open the file; otherwise, it will present the matches in a quick pick.
         */
        TerminalBuiltinLinkType[TerminalBuiltinLinkType["Search"] = 3] = "Search";
        /**
         * A link whose text is a valid URI.
         */
        TerminalBuiltinLinkType[TerminalBuiltinLinkType["Url"] = 4] = "Url";
    })(TerminalBuiltinLinkType = exports.TerminalBuiltinLinkType || (exports.TerminalBuiltinLinkType = {}));
});
//# sourceMappingURL=links.js.map