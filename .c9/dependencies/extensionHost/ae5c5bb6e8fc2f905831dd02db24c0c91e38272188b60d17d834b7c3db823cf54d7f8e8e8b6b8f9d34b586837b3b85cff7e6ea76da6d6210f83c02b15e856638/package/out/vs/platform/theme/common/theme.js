/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isHighContrast = exports.ColorScheme = void 0;
    /**
     * Color scheme used by the OS and by color themes.
     */
    var ColorScheme;
    (function (ColorScheme) {
        ColorScheme["DARK"] = "dark";
        ColorScheme["LIGHT"] = "light";
        ColorScheme["HIGH_CONTRAST_DARK"] = "hcDark";
        ColorScheme["HIGH_CONTRAST_LIGHT"] = "hcLight";
    })(ColorScheme = exports.ColorScheme || (exports.ColorScheme = {}));
    function isHighContrast(scheme) {
        return scheme === ColorScheme.HIGH_CONTRAST_DARK || scheme === ColorScheme.HIGH_CONTRAST_LIGHT;
    }
    exports.isHighContrast = isHighContrast;
});
//# sourceMappingURL=theme.js.map