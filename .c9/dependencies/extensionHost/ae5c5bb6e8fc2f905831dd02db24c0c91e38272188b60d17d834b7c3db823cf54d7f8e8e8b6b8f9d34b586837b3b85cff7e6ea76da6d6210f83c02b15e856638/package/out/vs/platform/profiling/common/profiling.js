/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/platform/instantiation/common/instantiation"], function (require, exports, path_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Utils = exports.IV8InspectProfilingService = void 0;
    exports.IV8InspectProfilingService = (0, instantiation_1.createDecorator)('IV8InspectProfilingService');
    var Utils;
    (function (Utils) {
        function rewriteAbsolutePaths(profile, replace = 'noAbsolutePaths') {
            for (const node of profile.nodes) {
                if (node.callFrame && node.callFrame.url) {
                    if ((0, path_1.isAbsolute)(node.callFrame.url) || /^\w[\w\d+.-]*:\/\/\//.test(node.callFrame.url)) {
                        node.callFrame.url = (0, path_1.join)(replace, (0, path_1.basename)(node.callFrame.url));
                    }
                }
            }
            return profile;
        }
        Utils.rewriteAbsolutePaths = rewriteAbsolutePaths;
    })(Utils = exports.Utils || (exports.Utils = {}));
});
//# sourceMappingURL=profiling.js.map