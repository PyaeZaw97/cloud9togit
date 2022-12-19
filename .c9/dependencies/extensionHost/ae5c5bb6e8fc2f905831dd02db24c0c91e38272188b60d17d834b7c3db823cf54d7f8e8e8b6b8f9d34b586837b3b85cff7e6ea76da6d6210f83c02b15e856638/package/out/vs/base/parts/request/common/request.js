/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OfflineError = exports.isOfflineError = void 0;
    const offlineName = 'Offline';
    /**
     * Checks if the given error is offline error
     */
    function isOfflineError(error) {
        if (error instanceof OfflineError) {
            return true;
        }
        return error instanceof Error && error.name === offlineName && error.message === offlineName;
    }
    exports.isOfflineError = isOfflineError;
    class OfflineError extends Error {
        constructor() {
            super(offlineName);
            this.name = this.message;
        }
    }
    exports.OfflineError = OfflineError;
});
//# sourceMappingURL=request.js.map