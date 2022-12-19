/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/editor/browser/config/tabFocus", "vs/editor/browser/editorExtensions", "vs/nls"], function (require, exports, aria_1, tabFocus_1, editorExtensions_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleTabFocusModeAction = void 0;
    class ToggleTabFocusModeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: ToggleTabFocusModeAction.ID,
                label: nls.localize({ key: 'toggle.tabMovesFocus', comment: ['Turn on/off use of tab key for moving focus around VS Code'] }, "Toggle Tab Key Moves Focus"),
                alias: 'Toggle Tab Key Moves Focus',
                precondition: undefined,
                kbOpts: {
                    kbExpr: null,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 43 /* KeyCode.KeyM */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 43 /* KeyCode.KeyM */ },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const oldValue = tabFocus_1.TabFocus.getTabFocusMode();
            const newValue = !oldValue;
            tabFocus_1.TabFocus.setTabFocusMode(newValue);
            if (newValue) {
                (0, aria_1.alert)(nls.localize('toggle.tabMovesFocus.on', "Pressing Tab will now move focus to the next focusable element"));
            }
            else {
                (0, aria_1.alert)(nls.localize('toggle.tabMovesFocus.off', "Pressing Tab will now insert the tab character"));
            }
        }
    }
    exports.ToggleTabFocusModeAction = ToggleTabFocusModeAction;
    ToggleTabFocusModeAction.ID = 'editor.action.toggleTabFocusMode';
    (0, editorExtensions_1.registerEditorAction)(ToggleTabFocusModeAction);
});
//# sourceMappingURL=toggleTabFocusMode.js.map