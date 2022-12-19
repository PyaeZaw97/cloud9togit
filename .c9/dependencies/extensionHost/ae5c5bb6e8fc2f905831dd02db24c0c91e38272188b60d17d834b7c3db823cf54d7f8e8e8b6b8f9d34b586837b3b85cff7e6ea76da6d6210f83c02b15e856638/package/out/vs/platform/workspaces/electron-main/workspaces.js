/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "crypto", "fs", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/resources"], function (require, exports, crypto_1, fs_1, network_1, platform_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSingleFolderWorkspaceIdentifier = exports.getWorkspaceIdentifier = void 0;
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // NOTE: DO NOT CHANGE. IDENTIFIERS HAVE TO REMAIN STABLE
    // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    function getWorkspaceIdentifier(configPath) {
        function getWorkspaceId() {
            let configPathStr = configPath.scheme === network_1.Schemas.file ? (0, resources_1.originalFSPath)(configPath) : configPath.toString();
            if (!platform_1.isLinux) {
                configPathStr = configPathStr.toLowerCase(); // sanitize for platform file system
            }
            return (0, crypto_1.createHash)('md5').update(configPathStr).digest('hex');
        }
        return {
            id: getWorkspaceId(),
            configPath
        };
    }
    exports.getWorkspaceIdentifier = getWorkspaceIdentifier;
    function getSingleFolderWorkspaceIdentifier(folderUri, folderStat) {
        function getFolderId() {
            // Remote: produce a hash from the entire URI
            if (folderUri.scheme !== network_1.Schemas.file) {
                return (0, crypto_1.createHash)('md5').update(folderUri.toString()).digest('hex');
            }
            // Local: produce a hash from the path and include creation time as salt
            if (!folderStat) {
                try {
                    folderStat = (0, fs_1.statSync)(folderUri.fsPath);
                }
                catch (error) {
                    return undefined; // folder does not exist
                }
            }
            let ctime;
            if (platform_1.isLinux) {
                ctime = folderStat.ino; // Linux: birthtime is ctime, so we cannot use it! We use the ino instead!
            }
            else if (platform_1.isMacintosh) {
                ctime = folderStat.birthtime.getTime(); // macOS: birthtime is fine to use as is
            }
            else if (platform_1.isWindows) {
                if (typeof folderStat.birthtimeMs === 'number') {
                    ctime = Math.floor(folderStat.birthtimeMs); // Windows: fix precision issue in node.js 8.x to get 7.x results (see https://github.com/nodejs/node/issues/19897)
                }
                else {
                    ctime = folderStat.birthtime.getTime();
                }
            }
            // we use the ctime as extra salt to the ID so that we catch the case of a folder getting
            // deleted and recreated. in that case we do not want to carry over previous state
            return (0, crypto_1.createHash)('md5').update(folderUri.fsPath).update(ctime ? String(ctime) : '').digest('hex');
        }
        const folderId = getFolderId();
        if (typeof folderId === 'string') {
            return {
                id: folderId,
                uri: folderUri
            };
        }
        return undefined; // invalid folder
    }
    exports.getSingleFolderWorkspaceIdentifier = getSingleFolderWorkspaceIdentifier;
});
//# sourceMappingURL=workspaces.js.map