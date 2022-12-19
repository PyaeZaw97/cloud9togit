/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network"], function (require, exports, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isVirtualWorkspace = exports.getVirtualWorkspaceAuthority = exports.getVirtualWorkspaceScheme = exports.getVirtualWorkspaceLocation = exports.isVirtualResource = void 0;
    function isVirtualResource(resource) {
        return resource.scheme !== network_1.Schemas.file && resource.scheme !== network_1.Schemas.vscodeRemote;
    }
    exports.isVirtualResource = isVirtualResource;
    function getVirtualWorkspaceLocation(workspace) {
        if (workspace.folders.length) {
            return workspace.folders.every(f => isVirtualResource(f.uri)) ? workspace.folders[0].uri : undefined;
        }
        else if (workspace.configuration && isVirtualResource(workspace.configuration)) {
            return workspace.configuration;
        }
        return undefined;
    }
    exports.getVirtualWorkspaceLocation = getVirtualWorkspaceLocation;
    function getVirtualWorkspaceScheme(workspace) {
        var _a;
        return (_a = getVirtualWorkspaceLocation(workspace)) === null || _a === void 0 ? void 0 : _a.scheme;
    }
    exports.getVirtualWorkspaceScheme = getVirtualWorkspaceScheme;
    function getVirtualWorkspaceAuthority(workspace) {
        var _a;
        return (_a = getVirtualWorkspaceLocation(workspace)) === null || _a === void 0 ? void 0 : _a.authority;
    }
    exports.getVirtualWorkspaceAuthority = getVirtualWorkspaceAuthority;
    function isVirtualWorkspace(workspace) {
        return getVirtualWorkspaceLocation(workspace) !== undefined;
    }
    exports.isVirtualWorkspace = isVirtualWorkspace;
});
//# sourceMappingURL=virtualWorkspace.js.map