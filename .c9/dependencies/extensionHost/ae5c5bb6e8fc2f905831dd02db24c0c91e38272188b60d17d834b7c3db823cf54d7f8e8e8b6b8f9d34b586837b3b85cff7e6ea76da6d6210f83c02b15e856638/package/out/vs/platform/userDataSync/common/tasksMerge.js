/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.merge = void 0;
    function merge(originalLocalContent, originalRemoteContent, baseContent) {
        const localForwarded = baseContent !== originalLocalContent;
        const remoteForwarded = baseContent !== originalRemoteContent;
        /* no changes */
        if (!localForwarded && !remoteForwarded) {
            return { localContent: null, remoteContent: null, hasConflicts: false };
        }
        /* local has changed and remote has not */
        if (localForwarded && !remoteForwarded) {
            return { localContent: null, remoteContent: originalLocalContent, hasConflicts: false };
        }
        /* remote has changed and local has not */
        if (remoteForwarded && !localForwarded) {
            return { localContent: originalRemoteContent, remoteContent: null, hasConflicts: false };
        }
        return { localContent: originalLocalContent, remoteContent: originalRemoteContent, hasConflicts: true };
    }
    exports.merge = merge;
});
//# sourceMappingURL=tasksMerge.js.map