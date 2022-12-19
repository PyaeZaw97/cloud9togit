/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalContextKeys = exports.TerminalContextKeyStrings = void 0;
    var TerminalContextKeyStrings;
    (function (TerminalContextKeyStrings) {
        TerminalContextKeyStrings["IsOpen"] = "terminalIsOpen";
        TerminalContextKeyStrings["Count"] = "terminalCount";
        TerminalContextKeyStrings["GroupCount"] = "terminalGroupCount";
        TerminalContextKeyStrings["TabsNarrow"] = "isTerminalTabsNarrow";
        TerminalContextKeyStrings["HasFixedWidth"] = "terminalHasFixedWidth";
        TerminalContextKeyStrings["ProcessSupported"] = "terminalProcessSupported";
        TerminalContextKeyStrings["Focus"] = "terminalFocus";
        TerminalContextKeyStrings["EditorFocus"] = "terminalEditorFocus";
        TerminalContextKeyStrings["TabsFocus"] = "terminalTabsFocus";
        TerminalContextKeyStrings["WebExtensionContributedProfile"] = "terminalWebExtensionContributedProfile";
        TerminalContextKeyStrings["TerminalHasBeenCreated"] = "terminalHasBeenCreated";
        TerminalContextKeyStrings["TerminalEditorActive"] = "terminalEditorActive";
        TerminalContextKeyStrings["TabsMouse"] = "terminalTabsMouse";
        TerminalContextKeyStrings["AltBufferActive"] = "terminalAltBufferActive";
        TerminalContextKeyStrings["A11yTreeFocus"] = "terminalA11yTreeFocus";
        TerminalContextKeyStrings["ViewShowing"] = "terminalViewShowing";
        TerminalContextKeyStrings["TextSelected"] = "terminalTextSelected";
        TerminalContextKeyStrings["FindVisible"] = "terminalFindVisible";
        TerminalContextKeyStrings["FindInputFocused"] = "terminalFindInputFocused";
        TerminalContextKeyStrings["FindFocused"] = "terminalFindFocused";
        TerminalContextKeyStrings["TabsSingularSelection"] = "terminalTabsSingularSelection";
        TerminalContextKeyStrings["SplitTerminal"] = "terminalSplitTerminal";
        TerminalContextKeyStrings["ShellType"] = "terminalShellType";
    })(TerminalContextKeyStrings = exports.TerminalContextKeyStrings || (exports.TerminalContextKeyStrings = {}));
    var TerminalContextKeys;
    (function (TerminalContextKeys) {
        /** Whether there is at least one opened terminal. */
        TerminalContextKeys.isOpen = new contextkey_1.RawContextKey("terminalIsOpen" /* TerminalContextKeyStrings.IsOpen */, false, true);
        /** Whether the terminal is focused. */
        TerminalContextKeys.focus = new contextkey_1.RawContextKey("terminalFocus" /* TerminalContextKeyStrings.Focus */, false, (0, nls_1.localize)('terminalFocusContextKey', "Whether the terminal is focused."));
        /** Whether a terminal in the editor area is focused. */
        TerminalContextKeys.editorFocus = new contextkey_1.RawContextKey("terminalEditorFocus" /* TerminalContextKeyStrings.EditorFocus */, false, (0, nls_1.localize)('terminalEditorFocusContextKey', "Whether a terminal in the editor area is focused."));
        /** The current number of terminals. */
        TerminalContextKeys.count = new contextkey_1.RawContextKey("terminalCount" /* TerminalContextKeyStrings.Count */, 0, (0, nls_1.localize)('terminalCountContextKey', "The current number of terminals."));
        /** The current number of terminal groups. */
        TerminalContextKeys.groupCount = new contextkey_1.RawContextKey("terminalGroupCount" /* TerminalContextKeyStrings.GroupCount */, 0, true);
        /** Whether the terminal tabs view is narrow. */
        TerminalContextKeys.tabsNarrow = new contextkey_1.RawContextKey("isTerminalTabsNarrow" /* TerminalContextKeyStrings.TabsNarrow */, false, true);
        /** Whether the terminal tabs view is narrow. */
        TerminalContextKeys.terminalHasFixedWidth = new contextkey_1.RawContextKey("terminalHasFixedWidth" /* TerminalContextKeyStrings.HasFixedWidth */, false, true);
        /** Whether the terminal tabs widget is focused. */
        TerminalContextKeys.tabsFocus = new contextkey_1.RawContextKey("terminalTabsFocus" /* TerminalContextKeyStrings.TabsFocus */, false, (0, nls_1.localize)('terminalTabsFocusContextKey', "Whether the terminal tabs widget is focused."));
        /** Whether a web extension has contributed a profile */
        TerminalContextKeys.webExtensionContributedProfile = new contextkey_1.RawContextKey("terminalWebExtensionContributedProfile" /* TerminalContextKeyStrings.WebExtensionContributedProfile */, false, true);
        /** Whether at least one terminal has been created */
        TerminalContextKeys.terminalHasBeenCreated = new contextkey_1.RawContextKey("terminalHasBeenCreated" /* TerminalContextKeyStrings.TerminalHasBeenCreated */, false, true);
        /** Whether at least one terminal has been created */
        TerminalContextKeys.terminalEditorActive = new contextkey_1.RawContextKey("terminalEditorActive" /* TerminalContextKeyStrings.TerminalEditorActive */, false, true);
        /** Whether the mouse is within the terminal tabs list. */
        TerminalContextKeys.tabsMouse = new contextkey_1.RawContextKey("terminalTabsMouse" /* TerminalContextKeyStrings.TabsMouse */, false, true);
        /** The shell type of the active terminal, this is set to the last known value when no terminals exist. */
        TerminalContextKeys.shellType = new contextkey_1.RawContextKey("terminalShellType" /* TerminalContextKeyStrings.ShellType */, undefined, { type: 'string', description: (0, nls_1.localize)('terminalShellTypeContextKey', "The shell type of the active terminal, this is set to the last known value when no terminals exist.") });
        /** Whether the terminal's alt buffer is active. */
        TerminalContextKeys.altBufferActive = new contextkey_1.RawContextKey("terminalAltBufferActive" /* TerminalContextKeyStrings.AltBufferActive */, false, (0, nls_1.localize)('terminalAltBufferActive', "Whether the terminal's alt buffer is active."));
        /** Whether the terminal is NOT focused. */
        TerminalContextKeys.notFocus = TerminalContextKeys.focus.toNegated();
        /** Whether the terminal view is showing. */
        TerminalContextKeys.viewShowing = new contextkey_1.RawContextKey("terminalViewShowing" /* TerminalContextKeyStrings.ViewShowing */, false, (0, nls_1.localize)('terminalViewShowing', "Whether the terminal view is showing"));
        /** Whether the user is navigating a terminal's the accessibility tree. */
        TerminalContextKeys.a11yTreeFocus = new contextkey_1.RawContextKey("terminalA11yTreeFocus" /* TerminalContextKeyStrings.A11yTreeFocus */, false, true);
        /** Whether text is selected in the active terminal. */
        TerminalContextKeys.textSelected = new contextkey_1.RawContextKey("terminalTextSelected" /* TerminalContextKeyStrings.TextSelected */, false, (0, nls_1.localize)('terminalTextSelectedContextKey', "Whether text is selected in the active terminal."));
        /** Whether text is NOT selected in the active terminal. */
        TerminalContextKeys.notTextSelected = TerminalContextKeys.textSelected.toNegated();
        /** Whether the active terminal's find widget is visible. */
        TerminalContextKeys.findVisible = new contextkey_1.RawContextKey("terminalFindVisible" /* TerminalContextKeyStrings.FindVisible */, false, true);
        /** Whether the active terminal's find widget is NOT visible. */
        TerminalContextKeys.notFindVisible = TerminalContextKeys.findVisible.toNegated();
        /** Whether the active terminal's find widget text input is focused. */
        TerminalContextKeys.findInputFocus = new contextkey_1.RawContextKey("terminalFindInputFocused" /* TerminalContextKeyStrings.FindInputFocused */, false, true);
        /** Whether an element iwhtin the active terminal's find widget is focused. */
        TerminalContextKeys.findFocus = new contextkey_1.RawContextKey("terminalFindFocused" /* TerminalContextKeyStrings.FindFocused */, false, true);
        /** Whether NO elements within the active terminal's find widget is focused. */
        TerminalContextKeys.notFindFocus = TerminalContextKeys.findInputFocus.toNegated();
        /** Whether terminal processes can be launched in the current workspace. */
        TerminalContextKeys.processSupported = new contextkey_1.RawContextKey("terminalProcessSupported" /* TerminalContextKeyStrings.ProcessSupported */, false, (0, nls_1.localize)('terminalProcessSupportedContextKey', "Whether terminal processes can be launched in the current workspace."));
        /** Whether one terminal is selected in the terminal tabs list. */
        TerminalContextKeys.tabsSingularSelection = new contextkey_1.RawContextKey("terminalTabsSingularSelection" /* TerminalContextKeyStrings.TabsSingularSelection */, false, (0, nls_1.localize)('terminalTabsSingularSelectedContextKey', "Whether one terminal is selected in the terminal tabs list."));
        /** Whether the focused tab's terminal is a split terminal. */
        TerminalContextKeys.splitTerminal = new contextkey_1.RawContextKey("terminalSplitTerminal" /* TerminalContextKeyStrings.SplitTerminal */, false, (0, nls_1.localize)('isSplitTerminalContextKey', "Whether the focused tab's terminal is a split terminal."));
    })(TerminalContextKeys = exports.TerminalContextKeys || (exports.TerminalContextKeys = {}));
});
//# sourceMappingURL=terminalContextKey.js.map