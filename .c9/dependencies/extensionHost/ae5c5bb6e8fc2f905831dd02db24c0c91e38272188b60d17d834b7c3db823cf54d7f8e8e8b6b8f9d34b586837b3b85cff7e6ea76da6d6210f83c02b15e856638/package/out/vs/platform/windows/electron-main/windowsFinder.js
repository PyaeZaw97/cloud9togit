/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/workspace/common/workspace"], function (require, exports, resources_1, uri_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findWindowOnExtensionDevelopmentPath = exports.findWindowOnWorkspaceOrFolder = exports.findWindowOnFile = void 0;
    function findWindowOnFile(windows, fileUri, localWorkspaceResolver) {
        // First check for windows with workspaces that have a parent folder of the provided path opened
        for (const window of windows) {
            const workspace = window.openedWorkspace;
            if ((0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                const resolvedWorkspace = localWorkspaceResolver(workspace);
                // resolved workspace: folders are known and can be compared with
                if (resolvedWorkspace) {
                    if (resolvedWorkspace.folders.some(folder => resources_1.extUriBiasedIgnorePathCase.isEqualOrParent(fileUri, folder.uri))) {
                        return window;
                    }
                }
                // unresolved: can only compare with workspace location
                else {
                    if (resources_1.extUriBiasedIgnorePathCase.isEqualOrParent(fileUri, workspace.configPath)) {
                        return window;
                    }
                }
            }
        }
        // Then go with single folder windows that are parent of the provided file path
        const singleFolderWindowsOnFilePath = windows.filter(window => (0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.openedWorkspace) && resources_1.extUriBiasedIgnorePathCase.isEqualOrParent(fileUri, window.openedWorkspace.uri));
        if (singleFolderWindowsOnFilePath.length) {
            return singleFolderWindowsOnFilePath.sort((windowA, windowB) => -(windowA.openedWorkspace.uri.path.length - windowB.openedWorkspace.uri.path.length))[0];
        }
        return undefined;
    }
    exports.findWindowOnFile = findWindowOnFile;
    function findWindowOnWorkspaceOrFolder(windows, folderOrWorkspaceConfigUri) {
        for (const window of windows) {
            // check for workspace config path
            if ((0, workspace_1.isWorkspaceIdentifier)(window.openedWorkspace) && resources_1.extUriBiasedIgnorePathCase.isEqual(window.openedWorkspace.configPath, folderOrWorkspaceConfigUri)) {
                return window;
            }
            // check for folder path
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(window.openedWorkspace) && resources_1.extUriBiasedIgnorePathCase.isEqual(window.openedWorkspace.uri, folderOrWorkspaceConfigUri)) {
                return window;
            }
        }
        return undefined;
    }
    exports.findWindowOnWorkspaceOrFolder = findWindowOnWorkspaceOrFolder;
    function findWindowOnExtensionDevelopmentPath(windows, extensionDevelopmentPaths) {
        var _a, _b;
        const matches = (uriString) => {
            return extensionDevelopmentPaths.some(path => resources_1.extUriBiasedIgnorePathCase.isEqual(uri_1.URI.file(path), uri_1.URI.file(uriString)));
        };
        for (const window of windows) {
            // match on extension development path. the path can be one or more paths
            // so we check if any of the paths match on any of the provided ones
            if ((_b = (_a = window.config) === null || _a === void 0 ? void 0 : _a.extensionDevelopmentPath) === null || _b === void 0 ? void 0 : _b.some(path => matches(path))) {
                return window;
            }
        }
        return undefined;
    }
    exports.findWindowOnExtensionDevelopmentPath = findWindowOnExtensionDevelopmentPath;
});
//# sourceMappingURL=windowsFinder.js.map