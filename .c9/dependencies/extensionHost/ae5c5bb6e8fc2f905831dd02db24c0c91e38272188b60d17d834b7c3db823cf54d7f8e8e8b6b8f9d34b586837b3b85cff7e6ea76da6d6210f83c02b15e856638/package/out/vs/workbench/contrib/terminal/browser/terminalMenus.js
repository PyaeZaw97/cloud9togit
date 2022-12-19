/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/network", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/terminal/common/terminal", "vs/workbench/common/contextkeys", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/services/editor/common/editorService"], function (require, exports, actions_1, codicons_1, network_1, nls_1, actions_2, contextkey_1, terminal_1, contextkeys_1, terminal_2, terminalContextKey_1, terminalStrings_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getTerminalActionBarArgs = exports.setupTerminalMenus = exports.TerminalMenuBarGroup = exports.TerminalTabContextMenuGroup = void 0;
    var ContextMenuGroup;
    (function (ContextMenuGroup) {
        ContextMenuGroup["Create"] = "1_create";
        ContextMenuGroup["Edit"] = "2_edit";
        ContextMenuGroup["Clear"] = "3_clear";
        ContextMenuGroup["Kill"] = "4_kill";
        ContextMenuGroup["Config"] = "5_config";
    })(ContextMenuGroup || (ContextMenuGroup = {}));
    var TerminalTabContextMenuGroup;
    (function (TerminalTabContextMenuGroup) {
        TerminalTabContextMenuGroup["Default"] = "1_create_default";
        TerminalTabContextMenuGroup["Profile"] = "2_create_profile";
        TerminalTabContextMenuGroup["Configure"] = "3_configure";
    })(TerminalTabContextMenuGroup = exports.TerminalTabContextMenuGroup || (exports.TerminalTabContextMenuGroup = {}));
    var TerminalMenuBarGroup;
    (function (TerminalMenuBarGroup) {
        TerminalMenuBarGroup["Create"] = "1_create";
        TerminalMenuBarGroup["Run"] = "2_run";
        TerminalMenuBarGroup["Manage"] = "3_manage";
        TerminalMenuBarGroup["Configure"] = "4_configure";
    })(TerminalMenuBarGroup = exports.TerminalMenuBarGroup || (exports.TerminalMenuBarGroup = {}));
    function setupTerminalMenus() {
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.MenubarTerminalMenu,
                item: {
                    group: "1_create" /* TerminalMenuBarGroup.Create */,
                    command: {
                        id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
                        title: (0, nls_1.localize)({ key: 'miNewTerminal', comment: ['&& denotes a mnemonic'] }, "&&New Terminal")
                    },
                    order: 1
                }
            },
            {
                id: actions_2.MenuId.MenubarTerminalMenu,
                item: {
                    group: "1_create" /* TerminalMenuBarGroup.Create */,
                    command: {
                        id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                        title: (0, nls_1.localize)({ key: 'miSplitTerminal', comment: ['&& denotes a mnemonic'] }, "&&Split Terminal"),
                        precondition: contextkey_1.ContextKeyExpr.has("terminalIsOpen" /* TerminalContextKeyStrings.IsOpen */)
                    },
                    order: 2,
                    when: terminalContextKey_1.TerminalContextKeys.processSupported
                }
            },
            {
                id: actions_2.MenuId.MenubarTerminalMenu,
                item: {
                    group: "2_run" /* TerminalMenuBarGroup.Run */,
                    command: {
                        id: "workbench.action.terminal.runActiveFile" /* TerminalCommandId.RunActiveFile */,
                        title: (0, nls_1.localize)({ key: 'miRunActiveFile', comment: ['&& denotes a mnemonic'] }, "Run &&Active File")
                    },
                    order: 3,
                    when: terminalContextKey_1.TerminalContextKeys.processSupported
                }
            },
            {
                id: actions_2.MenuId.MenubarTerminalMenu,
                item: {
                    group: "2_run" /* TerminalMenuBarGroup.Run */,
                    command: {
                        id: "workbench.action.terminal.runSelectedText" /* TerminalCommandId.RunSelectedText */,
                        title: (0, nls_1.localize)({ key: 'miRunSelectedText', comment: ['&& denotes a mnemonic'] }, "Run &&Selected Text")
                    },
                    order: 4,
                    when: terminalContextKey_1.TerminalContextKeys.processSupported
                }
            }
        ]);
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    group: "1_create" /* ContextMenuGroup.Create */,
                    command: {
                        id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                        title: terminalStrings_1.terminalStrings.split.value
                    }
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
                        title: (0, nls_1.localize)('workbench.action.terminal.new.short', "New Terminal")
                    },
                    group: "1_create" /* ContextMenuGroup.Create */
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.kill" /* TerminalCommandId.Kill */,
                        title: terminalStrings_1.terminalStrings.kill.value
                    },
                    group: "4_kill" /* ContextMenuGroup.Kill */
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.copySelection" /* TerminalCommandId.CopySelection */,
                        title: (0, nls_1.localize)('workbench.action.terminal.copySelection.short', "Copy")
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */,
                    order: 1
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.copySelectionAsHtml" /* TerminalCommandId.CopySelectionAsHtml */,
                        title: (0, nls_1.localize)('workbench.action.terminal.copySelectionAsHtml', "Copy as HTML")
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */,
                    order: 2
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.paste" /* TerminalCommandId.Paste */,
                        title: (0, nls_1.localize)('workbench.action.terminal.paste.short', "Paste")
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */,
                    order: 3
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.clear" /* TerminalCommandId.Clear */,
                        title: (0, nls_1.localize)('workbench.action.terminal.clear', "Clear")
                    },
                    group: "3_clear" /* ContextMenuGroup.Clear */,
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.showTabs" /* TerminalCommandId.ShowTabs */,
                        title: (0, nls_1.localize)('workbench.action.terminal.showsTabs', "Show Tabs")
                    },
                    when: contextkey_1.ContextKeyExpr.not(`config.${"terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */}`),
                    group: "5_config" /* ContextMenuGroup.Config */
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.sizeToContentWidth" /* TerminalCommandId.SizeToContentWidth */,
                        title: terminalStrings_1.terminalStrings.toggleSizeToContentWidth
                    },
                    group: "5_config" /* ContextMenuGroup.Config */
                }
            },
            {
                id: actions_2.MenuId.TerminalInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.selectAll" /* TerminalCommandId.SelectAll */,
                        title: (0, nls_1.localize)('workbench.action.terminal.selectAll', "Select All"),
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */,
                    order: 3
                }
            },
        ]);
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    group: "1_create" /* ContextMenuGroup.Create */,
                    command: {
                        id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                        title: terminalStrings_1.terminalStrings.split.value
                    }
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
                        title: (0, nls_1.localize)('workbench.action.terminal.new.short', "New Terminal")
                    },
                    group: "1_create" /* ContextMenuGroup.Create */
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.killEditor" /* TerminalCommandId.KillEditor */,
                        title: terminalStrings_1.terminalStrings.kill.value
                    },
                    group: "4_kill" /* ContextMenuGroup.Kill */
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.copySelection" /* TerminalCommandId.CopySelection */,
                        title: (0, nls_1.localize)('workbench.action.terminal.copySelection.short', "Copy")
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */,
                    order: 1
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.copySelectionAsHtml" /* TerminalCommandId.CopySelectionAsHtml */,
                        title: (0, nls_1.localize)('workbench.action.terminal.copySelectionAsHtml', "Copy as HTML")
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */,
                    order: 2
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.paste" /* TerminalCommandId.Paste */,
                        title: (0, nls_1.localize)('workbench.action.terminal.paste.short', "Paste")
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */,
                    order: 3
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.clear" /* TerminalCommandId.Clear */,
                        title: (0, nls_1.localize)('workbench.action.terminal.clear', "Clear")
                    },
                    group: "3_clear" /* ContextMenuGroup.Clear */,
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.selectAll" /* TerminalCommandId.SelectAll */,
                        title: (0, nls_1.localize)('workbench.action.terminal.selectAll', "Select All"),
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */,
                    order: 3
                }
            },
            {
                id: actions_2.MenuId.TerminalEditorInstanceContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.sizeToContentWidth" /* TerminalCommandId.SizeToContentWidth */,
                        title: terminalStrings_1.terminalStrings.toggleSizeToContentWidth
                    },
                    group: "5_config" /* ContextMenuGroup.Config */
                }
            }
        ]);
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.TerminalTabEmptyAreaContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */,
                        title: (0, nls_1.localize)('workbench.action.terminal.newWithProfile.short', "New Terminal With Profile")
                    },
                    group: "1_create" /* ContextMenuGroup.Create */
                }
            },
            {
                id: actions_2.MenuId.TerminalTabEmptyAreaContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
                        title: (0, nls_1.localize)('workbench.action.terminal.new.short', "New Terminal")
                    },
                    group: "1_create" /* ContextMenuGroup.Create */
                }
            }
        ]);
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.TerminalNewDropdownContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.selectDefaultShell" /* TerminalCommandId.SelectDefaultProfile */,
                        title: { value: (0, nls_1.localize)('workbench.action.terminal.selectDefaultProfile', "Select Default Profile"), original: 'Select Default Profile' }
                    },
                    group: "3_configure" /* TerminalTabContextMenuGroup.Configure */
                }
            },
            {
                id: actions_2.MenuId.TerminalNewDropdownContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.openSettings" /* TerminalCommandId.ConfigureTerminalSettings */,
                        title: (0, nls_1.localize)('workbench.action.terminal.openSettings', "Configure Terminal Settings")
                    },
                    group: "3_configure" /* TerminalTabContextMenuGroup.Configure */
                }
            }
        ]);
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.ViewTitle,
                item: {
                    command: {
                        id: "workbench.action.terminal.switchTerminal" /* TerminalCommandId.SwitchTerminal */,
                        title: { value: (0, nls_1.localize)('workbench.action.terminal.switchTerminal', "Switch Terminal"), original: 'Switch Terminal' }
                    },
                    group: 'navigation',
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', terminal_2.TERMINAL_VIEW_ID), contextkey_1.ContextKeyExpr.not(`config.${"terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */}`)),
                }
            },
            {
                // This is used to show instead of tabs when there is only a single terminal
                id: actions_2.MenuId.ViewTitle,
                item: {
                    command: {
                        id: "workbench.action.terminal.focus" /* TerminalCommandId.Focus */,
                        title: terminalStrings_1.terminalStrings.focus
                    },
                    group: 'navigation',
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', terminal_2.TERMINAL_VIEW_ID), contextkey_1.ContextKeyExpr.has(`config.${"terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */}`), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActiveTerminal" /* TerminalSettingId.TabsShowActiveTerminal */}`, 'singleTerminal'), contextkey_1.ContextKeyExpr.equals("terminalCount" /* TerminalContextKeyStrings.Count */, 1)), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActiveTerminal" /* TerminalSettingId.TabsShowActiveTerminal */}`, 'singleTerminalOrNarrow'), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals("terminalCount" /* TerminalContextKeyStrings.Count */, 1), contextkey_1.ContextKeyExpr.has("isTerminalTabsNarrow" /* TerminalContextKeyStrings.TabsNarrow */))), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActiveTerminal" /* TerminalSettingId.TabsShowActiveTerminal */}`, 'singleGroup'), contextkey_1.ContextKeyExpr.equals("terminalGroupCount" /* TerminalContextKeyStrings.GroupCount */, 1)), contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActiveTerminal" /* TerminalSettingId.TabsShowActiveTerminal */}`, 'always'))),
                }
            },
            {
                id: actions_2.MenuId.ViewTitle,
                item: {
                    command: {
                        id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                        title: terminalStrings_1.terminalStrings.split,
                        icon: codicons_1.Codicon.splitHorizontal
                    },
                    group: 'navigation',
                    order: 2,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', terminal_2.TERMINAL_VIEW_ID), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.not(`config.${"terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */}`), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */}`, 'singleTerminal'), contextkey_1.ContextKeyExpr.equals("terminalCount" /* TerminalContextKeyStrings.Count */, 1)), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */}`, 'singleTerminalOrNarrow'), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals("terminalCount" /* TerminalContextKeyStrings.Count */, 1), contextkey_1.ContextKeyExpr.has("isTerminalTabsNarrow" /* TerminalContextKeyStrings.TabsNarrow */))), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */}`, 'singleGroup'), contextkey_1.ContextKeyExpr.equals("terminalGroupCount" /* TerminalContextKeyStrings.GroupCount */, 1)), contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */}`, 'always')))
                }
            },
            {
                id: actions_2.MenuId.ViewTitle,
                item: {
                    command: {
                        id: "workbench.action.terminal.kill" /* TerminalCommandId.Kill */,
                        title: terminalStrings_1.terminalStrings.kill,
                        icon: codicons_1.Codicon.trash
                    },
                    group: 'navigation',
                    order: 3,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', terminal_2.TERMINAL_VIEW_ID), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.not(`config.${"terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */}`), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */}`, 'singleTerminal'), contextkey_1.ContextKeyExpr.equals("terminalCount" /* TerminalContextKeyStrings.Count */, 1)), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */}`, 'singleTerminalOrNarrow'), contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals("terminalCount" /* TerminalContextKeyStrings.Count */, 1), contextkey_1.ContextKeyExpr.has("isTerminalTabsNarrow" /* TerminalContextKeyStrings.TabsNarrow */))), contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */}`, 'singleGroup'), contextkey_1.ContextKeyExpr.equals("terminalGroupCount" /* TerminalContextKeyStrings.GroupCount */, 1)), contextkey_1.ContextKeyExpr.equals(`config.${"terminal.integrated.tabs.showActions" /* TerminalSettingId.TabsShowActions */}`, 'always')))
                }
            },
            {
                id: actions_2.MenuId.ViewTitle,
                item: {
                    command: {
                        id: "workbench.action.terminal.createProfileButton" /* TerminalCommandId.CreateWithProfileButton */,
                        title: "workbench.action.terminal.createProfileButton" /* TerminalCommandId.CreateWithProfileButton */
                    },
                    group: 'navigation',
                    order: 0,
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', terminal_2.TERMINAL_VIEW_ID), contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile, terminalContextKey_1.TerminalContextKeys.processSupported))
                }
            }
        ]);
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.TerminalInlineTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                        title: terminalStrings_1.terminalStrings.split.value
                    },
                    group: "1_create" /* ContextMenuGroup.Create */,
                    order: 1
                }
            },
            {
                id: actions_2.MenuId.TerminalInlineTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.moveToEditor" /* TerminalCommandId.MoveToEditor */,
                        title: terminalStrings_1.terminalStrings.moveToEditor.value
                    },
                    group: "1_create" /* ContextMenuGroup.Create */,
                    order: 2
                }
            },
            {
                id: actions_2.MenuId.TerminalInlineTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.changeIconPanel" /* TerminalCommandId.ChangeIconPanel */,
                        title: terminalStrings_1.terminalStrings.changeIcon.value
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */
                }
            },
            {
                id: actions_2.MenuId.TerminalInlineTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.changeColorPanel" /* TerminalCommandId.ChangeColorPanel */,
                        title: terminalStrings_1.terminalStrings.changeColor.value
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */
                }
            },
            {
                id: actions_2.MenuId.TerminalInlineTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.renamePanel" /* TerminalCommandId.RenamePanel */,
                        title: terminalStrings_1.terminalStrings.rename.value
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */
                }
            },
            {
                id: actions_2.MenuId.TerminalInlineTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.sizeToContentWidthInstance" /* TerminalCommandId.SizeToContentWidthInstance */,
                        title: (0, nls_1.localize)('workbench.action.terminal.sizeToContentWidthInstance', "Toggle Size to Content Width")
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */
                }
            },
            {
                id: actions_2.MenuId.TerminalInlineTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.kill" /* TerminalCommandId.Kill */,
                        title: terminalStrings_1.terminalStrings.kill.value
                    },
                    group: "4_kill" /* ContextMenuGroup.Kill */
                }
            }
        ]);
        actions_2.MenuRegistry.appendMenuItems([
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.splitInstance" /* TerminalCommandId.SplitInstance */,
                        title: terminalStrings_1.terminalStrings.split.value,
                    },
                    group: "1_create" /* ContextMenuGroup.Create */,
                    order: 1
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.moveToEditorInstance" /* TerminalCommandId.MoveToEditorInstance */,
                        title: terminalStrings_1.terminalStrings.moveToEditor.value
                    },
                    group: "1_create" /* ContextMenuGroup.Create */,
                    order: 2
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.renameInstance" /* TerminalCommandId.RenameInstance */,
                        title: (0, nls_1.localize)('workbench.action.terminal.renameInstance', "Rename...")
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.changeIconInstance" /* TerminalCommandId.ChangeIconInstance */,
                        title: (0, nls_1.localize)('workbench.action.terminal.changeIcon', "Change Icon...")
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.changeColorInstance" /* TerminalCommandId.ChangeColorInstance */,
                        title: (0, nls_1.localize)('workbench.action.terminal.changeColor', "Change Color...")
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.sizeToContentWidthInstance" /* TerminalCommandId.SizeToContentWidthInstance */,
                        title: (0, nls_1.localize)('workbench.action.terminal.sizeToContentWidthInstance', "Toggle Size to Content Width")
                    },
                    group: "2_edit" /* ContextMenuGroup.Edit */
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    group: "5_config" /* ContextMenuGroup.Config */,
                    command: {
                        id: "workbench.action.terminal.joinInstance" /* TerminalCommandId.JoinInstance */,
                        title: (0, nls_1.localize)('workbench.action.terminal.joinInstance', "Join Terminals")
                    },
                    when: terminalContextKey_1.TerminalContextKeys.tabsSingularSelection.toNegated()
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    group: "5_config" /* ContextMenuGroup.Config */,
                    command: {
                        id: "workbench.action.terminal.unsplitInstance" /* TerminalCommandId.UnsplitInstance */,
                        title: terminalStrings_1.terminalStrings.unsplit.value
                    },
                    when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.tabsSingularSelection, terminalContextKey_1.TerminalContextKeys.splitTerminal)
                }
            },
            {
                id: actions_2.MenuId.TerminalTabContext,
                item: {
                    command: {
                        id: "workbench.action.terminal.killInstance" /* TerminalCommandId.KillInstance */,
                        title: terminalStrings_1.terminalStrings.kill.value
                    },
                    group: "4_kill" /* ContextMenuGroup.Kill */,
                }
            }
        ]);
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, {
            command: {
                id: "workbench.action.terminal.moveToTerminalPanel" /* TerminalCommandId.MoveToTerminalPanel */,
                title: terminalStrings_1.terminalStrings.moveToTerminalPanel
            },
            when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeTerminal),
            group: '2_files'
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, {
            command: {
                id: "workbench.action.terminal.rename" /* TerminalCommandId.Rename */,
                title: terminalStrings_1.terminalStrings.rename
            },
            when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeTerminal),
            group: '3_files'
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, {
            command: {
                id: "workbench.action.terminal.changeColor" /* TerminalCommandId.ChangeColor */,
                title: terminalStrings_1.terminalStrings.changeColor
            },
            when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeTerminal),
            group: '3_files'
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, {
            command: {
                id: "workbench.action.terminal.changeIcon" /* TerminalCommandId.ChangeIcon */,
                title: terminalStrings_1.terminalStrings.changeIcon
            },
            when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeTerminal),
            group: '3_files'
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, {
            command: {
                id: "workbench.action.terminal.sizeToContentWidth" /* TerminalCommandId.SizeToContentWidth */,
                title: terminalStrings_1.terminalStrings.toggleSizeToContentWidth
            },
            when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeTerminal),
            group: '3_files'
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, {
            command: {
                id: "workbench.action.terminal.createProfileButton" /* TerminalCommandId.CreateWithProfileButton */,
                title: "workbench.action.terminal.createProfileButton" /* TerminalCommandId.CreateWithProfileButton */
            },
            group: 'navigation',
            order: 0,
            when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeTerminal)
        });
    }
    exports.setupTerminalMenus = setupTerminalMenus;
    function getTerminalActionBarArgs(location, profiles, defaultProfileName, contributedProfiles, instantiationService, terminalService, contextKeyService, commandService, dropdownMenu) {
        let dropdownActions = [];
        let submenuActions = [];
        profiles = profiles.filter(e => !e.isAutoDetected);
        const splitLocation = (location === terminal_1.TerminalLocation.Editor || (typeof location === 'object' && 'viewColumn' in location && location.viewColumn === editorService_1.ACTIVE_GROUP)) ? { viewColumn: editorService_1.SIDE_GROUP } : { splitActiveTerminal: true };
        for (const p of profiles) {
            const isDefault = p.profileName === defaultProfileName;
            const options = {
                arg: {
                    config: p,
                    location
                },
                shouldForwardArgs: true
            };
            const splitOptions = {
                arg: {
                    config: p,
                    splitLocation
                },
                shouldForwardArgs: true
            };
            if (isDefault) {
                dropdownActions.unshift(new actions_2.MenuItemAction({ id: "workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */, title: (0, nls_1.localize)('defaultTerminalProfile', "{0} (Default)", p.profileName), category: "2_create_profile" /* TerminalTabContextMenuGroup.Profile */ }, undefined, options, contextKeyService, commandService));
                submenuActions.unshift(new actions_2.MenuItemAction({ id: "workbench.action.terminal.split" /* TerminalCommandId.Split */, title: (0, nls_1.localize)('defaultTerminalProfile', "{0} (Default)", p.profileName), category: "2_create_profile" /* TerminalTabContextMenuGroup.Profile */ }, undefined, splitOptions, contextKeyService, commandService));
            }
            else {
                dropdownActions.push(new actions_2.MenuItemAction({ id: "workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */, title: p.profileName.replace(/[\n\r\t]/g, ''), category: "2_create_profile" /* TerminalTabContextMenuGroup.Profile */ }, undefined, options, contextKeyService, commandService));
                submenuActions.push(new actions_2.MenuItemAction({ id: "workbench.action.terminal.split" /* TerminalCommandId.Split */, title: p.profileName.replace(/[\n\r\t]/g, ''), category: "2_create_profile" /* TerminalTabContextMenuGroup.Profile */ }, undefined, splitOptions, contextKeyService, commandService));
            }
        }
        for (const contributed of contributedProfiles) {
            const isDefault = contributed.title === defaultProfileName;
            const title = isDefault ? (0, nls_1.localize)('defaultTerminalProfile', "{0} (Default)", contributed.title.replace(/[\n\r\t]/g, '')) : contributed.title.replace(/[\n\r\t]/g, '');
            dropdownActions.push(new actions_1.Action('contributed', title, undefined, true, () => terminalService.createTerminal({
                config: {
                    extensionIdentifier: contributed.extensionIdentifier,
                    id: contributed.id,
                    title
                },
                location
            })));
            submenuActions.push(new actions_1.Action('contributed-split', title, undefined, true, () => terminalService.createTerminal({
                config: {
                    extensionIdentifier: contributed.extensionIdentifier,
                    id: contributed.id,
                    title
                },
                location: splitLocation
            })));
        }
        const defaultProfileAction = dropdownActions.find(d => d.label.endsWith('(Default)'));
        if (defaultProfileAction) {
            dropdownActions = dropdownActions.filter(d => d !== defaultProfileAction).sort((a, b) => a.label.localeCompare(b.label));
            dropdownActions.unshift(defaultProfileAction);
        }
        if (dropdownActions.length > 0) {
            dropdownActions.push(new actions_1.SubmenuAction('split.profile', (0, nls_1.localize)('splitTerminal', 'Split Terminal'), submenuActions));
            dropdownActions.push(new actions_1.Separator());
        }
        for (const [, configureActions] of dropdownMenu.getActions()) {
            for (const action of configureActions) {
                // make sure the action is a MenuItemAction
                if ('alt' in action) {
                    dropdownActions.push(action);
                }
            }
        }
        const defaultSubmenuProfileAction = submenuActions.find(d => d.label.endsWith('(Default)'));
        if (defaultSubmenuProfileAction) {
            submenuActions = submenuActions.filter(d => d !== defaultSubmenuProfileAction).sort((a, b) => a.label.localeCompare(b.label));
            submenuActions.unshift(defaultSubmenuProfileAction);
        }
        const primaryActionLocation = terminalService.resolveLocation(location);
        const primaryAction = instantiationService.createInstance(actions_2.MenuItemAction, {
            id: primaryActionLocation === terminal_1.TerminalLocation.Editor ? "workbench.action.createTerminalEditor" /* TerminalCommandId.CreateTerminalEditor */ : "workbench.action.terminal.new" /* TerminalCommandId.New */,
            title: (0, nls_1.localize)('terminal.new', "New Terminal"),
            icon: codicons_1.Codicon.plus
        }, {
            id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
            title: terminalStrings_1.terminalStrings.split.value,
            icon: codicons_1.Codicon.splitHorizontal
        }, {
            shouldForwardArgs: true,
            arg: { location },
        });
        const dropdownAction = new actions_1.Action('refresh profiles', 'Launch Profile...', 'codicon-chevron-down', true);
        return { primaryAction, dropdownAction, dropdownMenuActions: dropdownActions, className: `terminal-tab-actions-${terminalService.resolveLocation(location)}` };
    }
    exports.getTerminalActionBarArgs = getTerminalActionBarArgs;
});
//# sourceMappingURL=terminalMenus.js.map