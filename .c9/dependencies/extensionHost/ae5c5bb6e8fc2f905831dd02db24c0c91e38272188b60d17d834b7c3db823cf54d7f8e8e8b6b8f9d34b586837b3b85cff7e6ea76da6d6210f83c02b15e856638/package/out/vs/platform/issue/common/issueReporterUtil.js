/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.normalizeGitHubUrl = void 0;
    function normalizeGitHubUrl(url) {
        // If the url has a .git suffix, remove it
        if (url.endsWith('.git')) {
            url = url.substr(0, url.length - 4);
        }
        // Remove trailing slash
        url = (0, strings_1.rtrim)(url, '/');
        if (url.endsWith('/new')) {
            url = (0, strings_1.rtrim)(url, '/new');
        }
        if (url.endsWith('/issues')) {
            url = (0, strings_1.rtrim)(url, '/issues');
        }
        return url;
    }
    exports.normalizeGitHubUrl = normalizeGitHubUrl;
});
//# sourceMappingURL=issueReporterUtil.js.map