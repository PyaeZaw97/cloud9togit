/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/hash"], function (require, exports, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSingleFolderWorkspaceIdentifier = exports.getWorkspaceIdentifier = void 0;
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // NOTE: DO NOT CHANGE. IDENTIFIERS HAVE TO REMAIN STABLE
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    function getWorkspaceIdentifier(workspaceUri) {
        return {
            id: getWorkspaceId(workspaceUri),
            configPath: workspaceUri
        };
    }
    exports.getWorkspaceIdentifier = getWorkspaceIdentifier;
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // NOTE: DO NOT CHANGE. IDENTIFIERS HAVE TO REMAIN STABLE
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    function getSingleFolderWorkspaceIdentifier(folderUri) {
        return {
            id: getWorkspaceId(folderUri),
            uri: folderUri
        };
    }
    exports.getSingleFolderWorkspaceIdentifier = getSingleFolderWorkspaceIdentifier;
    function getWorkspaceId(uri) {
        return (0, hash_1.hash)(uri.toString()).toString(16);
    }
});
//# sourceMappingURL=workspaces.js.map