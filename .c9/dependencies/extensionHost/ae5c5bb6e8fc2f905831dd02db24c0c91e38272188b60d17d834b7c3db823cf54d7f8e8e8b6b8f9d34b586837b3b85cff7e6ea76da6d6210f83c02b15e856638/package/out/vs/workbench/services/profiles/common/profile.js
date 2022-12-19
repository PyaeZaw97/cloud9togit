/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/nls", "vs/platform/instantiation/common/instantiation"], function (require, exports, types_1, nls_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PROFILE_FILTER = exports.PROFILE_EXTENSION = exports.PROFILES_CATEGORY = exports.IWorkbenchProfileService = exports.isProfile = void 0;
    function isProfile(thing) {
        const candidate = thing;
        return !!(candidate && typeof candidate === 'object'
            && ((0, types_1.isUndefined)(candidate.name) || typeof candidate.name === 'string')
            && ((0, types_1.isUndefined)(candidate.settings) || typeof candidate.settings === 'string')
            && ((0, types_1.isUndefined)(candidate.globalState) || typeof candidate.globalState === 'string')
            && ((0, types_1.isUndefined)(candidate.extensions) || typeof candidate.extensions === 'string'));
    }
    exports.isProfile = isProfile;
    exports.IWorkbenchProfileService = (0, instantiation_1.createDecorator)('IWorkbenchProfileService');
    exports.PROFILES_CATEGORY = (0, nls_1.localize)('settings profiles', "Settings Profile");
    exports.PROFILE_EXTENSION = 'code-profile';
    exports.PROFILE_FILTER = [{ name: (0, nls_1.localize)('profile', "Settings Profile"), extensions: [exports.PROFILE_EXTENSION] }];
});
//# sourceMappingURL=profile.js.map