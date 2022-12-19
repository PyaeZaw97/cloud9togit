/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/workspace/common/workspace"], function (require, exports, platform_1, uri_1, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testWorkspace = exports.TestWorkspace = exports.Workspace = void 0;
    class Workspace extends workspace_1.Workspace {
        constructor(id, folders = [], configuration = null, ignorePathCasing = () => !platform_1.isLinux) {
            super(id, folders, false, configuration, ignorePathCasing);
        }
    }
    exports.Workspace = Workspace;
    const wsUri = uri_1.URI.file(platform_1.isWindows ? 'C:\\testWorkspace' : '/testWorkspace');
    exports.TestWorkspace = testWorkspace(wsUri);
    function testWorkspace(resource) {
        return new Workspace(resource.toString(), [(0, workspace_1.toWorkspaceFolder)(resource)]);
    }
    exports.testWorkspace = testWorkspace;
});
//# sourceMappingURL=testWorkspace.js.map