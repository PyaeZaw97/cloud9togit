/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/services/statusbar/browser/statusbar", "vs/base/common/actions", "vs/workbench/services/layout/browser/layoutService", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/services/editor/common/editorService", "vs/workbench/common/contextkeys"], function (require, exports, nls_1, statusbar_1, actions_1, layoutService_1, keybindingsRegistry_1, actions_2, actions_3, editorService_1, contextkeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HideStatusbarEntryAction = exports.ToggleStatusbarEntryVisibilityAction = void 0;
    class ToggleStatusbarEntryVisibilityAction extends actions_1.Action {
        constructor(id, label, model) {
            super(id, label, undefined, true);
            this.model = model;
            this.checked = !model.isHidden(id);
        }
        async run() {
            if (this.model.isHidden(this.id)) {
                this.model.show(this.id);
            }
            else {
                this.model.hide(this.id);
            }
        }
    }
    exports.ToggleStatusbarEntryVisibilityAction = ToggleStatusbarEntryVisibilityAction;
    class HideStatusbarEntryAction extends actions_1.Action {
        constructor(id, name, model) {
            super(id, (0, nls_1.localize)('hide', "Hide '{0}'", name), undefined, true);
            this.model = model;
        }
        async run() {
            this.model.hide(this.id);
        }
    }
    exports.HideStatusbarEntryAction = HideStatusbarEntryAction;
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.focusPrevious',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 15 /* KeyCode.LeftArrow */,
        secondary: [16 /* KeyCode.UpArrow */],
        when: contextkeys_1.StatusBarFocused,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            statusBarService.focusPreviousEntry();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.focusNext',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 17 /* KeyCode.RightArrow */,
        secondary: [18 /* KeyCode.DownArrow */],
        when: contextkeys_1.StatusBarFocused,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            statusBarService.focusNextEntry();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.focusFirst',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 14 /* KeyCode.Home */,
        when: contextkeys_1.StatusBarFocused,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            statusBarService.focus(false);
            statusBarService.focusNextEntry();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.focusLast',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 13 /* KeyCode.End */,
        when: contextkeys_1.StatusBarFocused,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            statusBarService.focus(false);
            statusBarService.focusPreviousEntry();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.statusBar.clearFocus',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 9 /* KeyCode.Escape */,
        when: contextkeys_1.StatusBarFocused,
        handler: (accessor) => {
            const statusBarService = accessor.get(statusbar_1.IStatusbarService);
            const editorService = accessor.get(editorService_1.IEditorService);
            if (statusBarService.isEntryFocused()) {
                statusBarService.focus(false);
            }
            else if (editorService.activeEditorPane) {
                editorService.activeEditorPane.focus();
            }
        }
    });
    class FocusStatusBarAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.focusStatusBar',
                title: { value: (0, nls_1.localize)('focusStatusBar', "Focus Status Bar"), original: 'Focus Status Bar' },
                category: actions_3.CATEGORIES.View,
                f1: true
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.focusPart("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */);
        }
    }
    (0, actions_2.registerAction2)(FocusStatusBarAction);
});
//# sourceMappingURL=statusbarActions.js.map