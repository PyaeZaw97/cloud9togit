/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabFocus = void 0;
    class TabFocusImpl {
        constructor() {
            this._tabFocus = false;
            this._onDidChangeTabFocus = new event_1.Emitter();
            this.onDidChangeTabFocus = this._onDidChangeTabFocus.event;
        }
        getTabFocusMode() {
            return this._tabFocus;
        }
        setTabFocusMode(tabFocusMode) {
            if (this._tabFocus === tabFocusMode) {
                return;
            }
            this._tabFocus = tabFocusMode;
            this._onDidChangeTabFocus.fire(this._tabFocus);
        }
    }
    /**
     * Control what pressing Tab does.
     * If it is false, pressing Tab or Shift-Tab will be handled by the editor.
     * If it is true, pressing Tab or Shift-Tab will move the browser focus.
     * Defaults to false.
     */
    exports.TabFocus = new TabFocusImpl();
});
//# sourceMappingURL=tabFocus.js.map