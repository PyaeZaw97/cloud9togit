/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isEmptyWindowBackupInfo = void 0;
    function isEmptyWindowBackupInfo(obj) {
        const candidate = obj;
        return typeof (candidate === null || candidate === void 0 ? void 0 : candidate.backupFolder) === 'string';
    }
    exports.isEmptyWindowBackupInfo = isEmptyWindowBackupInfo;
});
//# sourceMappingURL=backup.js.map