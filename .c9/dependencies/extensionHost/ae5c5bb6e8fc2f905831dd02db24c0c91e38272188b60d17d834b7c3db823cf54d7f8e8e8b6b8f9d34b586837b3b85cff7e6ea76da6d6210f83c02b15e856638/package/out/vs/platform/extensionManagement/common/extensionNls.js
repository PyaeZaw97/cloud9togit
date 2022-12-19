/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects"], function (require, exports, objects_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.localizeManifest = void 0;
    const nlsRegex = /^%([\w\d.-]+)%$/i;
    function localizeManifest(manifest, translations) {
        const patcher = (value) => {
            var _a;
            if (typeof value !== 'string') {
                return undefined;
            }
            const match = nlsRegex.exec(value);
            if (!match) {
                return undefined;
            }
            const translation = (_a = translations[match[1]]) !== null && _a !== void 0 ? _a : value;
            return typeof translation === 'string' ? translation : (typeof translation.message === 'string' ? translation.message : value);
        };
        return (0, objects_1.cloneAndChange)(manifest, patcher);
    }
    exports.localizeManifest = localizeManifest;
});
//# sourceMappingURL=extensionNls.js.map