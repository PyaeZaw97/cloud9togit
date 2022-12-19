/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/nls", "vs/platform/contextkey/common/contextkey"], function (require, exports, platform_1, nls_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InputFocusedContext = exports.InputFocusedContextKey = exports.IsDevelopmentContext = exports.IsIOSContext = exports.IsMacNativeContext = exports.IsWebContext = exports.IsWindowsContext = exports.IsLinuxContext = exports.IsMacContext = void 0;
    exports.IsMacContext = new contextkey_1.RawContextKey('isMac', platform_1.isMacintosh, (0, nls_1.localize)('isMac', "Whether the operating system is macOS"));
    exports.IsLinuxContext = new contextkey_1.RawContextKey('isLinux', platform_1.isLinux, (0, nls_1.localize)('isLinux', "Whether the operating system is Linux"));
    exports.IsWindowsContext = new contextkey_1.RawContextKey('isWindows', platform_1.isWindows, (0, nls_1.localize)('isWindows', "Whether the operating system is Windows"));
    exports.IsWebContext = new contextkey_1.RawContextKey('isWeb', platform_1.isWeb, (0, nls_1.localize)('isWeb', "Whether the platform is a web browser"));
    exports.IsMacNativeContext = new contextkey_1.RawContextKey('isMacNative', platform_1.isMacintosh && !platform_1.isWeb, (0, nls_1.localize)('isMacNative', "Whether the operating system is macOS on a non-browser platform"));
    exports.IsIOSContext = new contextkey_1.RawContextKey('isIOS', platform_1.isIOS, (0, nls_1.localize)('isIOS', "Whether the operating system is iOS"));
    exports.IsDevelopmentContext = new contextkey_1.RawContextKey('isDevelopment', false, true);
    exports.InputFocusedContextKey = 'inputFocus';
    exports.InputFocusedContext = new contextkey_1.RawContextKey(exports.InputFocusedContextKey, false, (0, nls_1.localize)('inputFocus', "Whether keyboard focus is inside an input box"));
});
//# sourceMappingURL=contextkeys.js.map