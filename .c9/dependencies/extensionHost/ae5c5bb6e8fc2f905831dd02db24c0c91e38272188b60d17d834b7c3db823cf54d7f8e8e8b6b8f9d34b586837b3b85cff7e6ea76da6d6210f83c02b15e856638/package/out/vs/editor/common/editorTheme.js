/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorTheme = void 0;
    class EditorTheme {
        constructor(theme) {
            this._theme = theme;
        }
        get type() {
            return this._theme.type;
        }
        get value() {
            return this._theme;
        }
        update(theme) {
            this._theme = theme;
        }
        getColor(color) {
            return this._theme.getColor(color);
        }
    }
    exports.EditorTheme = EditorTheme;
});
//# sourceMappingURL=editorTheme.js.map