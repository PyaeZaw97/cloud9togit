/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/path", "vs/base/common/uri", "vs/base/test/common/testUtils"], function (require, exports, extpath_1, path_1, uri_1, testUtils) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.flakySuite = exports.getPathFromAmdModule = exports.getRandomTestPath = void 0;
    function getRandomTestPath(tmpdir, ...segments) {
        return (0, extpath_1.randomPath)((0, path_1.join)(tmpdir, ...segments));
    }
    exports.getRandomTestPath = getRandomTestPath;
    function getPathFromAmdModule(requirefn, relativePath) {
        return uri_1.URI.parse(requirefn.toUrl(relativePath)).fsPath;
    }
    exports.getPathFromAmdModule = getPathFromAmdModule;
    exports.flakySuite = testUtils.flakySuite;
});
//# sourceMappingURL=testUtils.js.map