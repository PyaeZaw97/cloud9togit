/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/canIUse", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/terminal/common/terminal", "vs/platform/workspace/common/workspace", "vs/workbench/browser/actions/workspaceCommands", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/common/contextkeys", "vs/workbench/contrib/search/browser/searchActions", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalQuickAccess", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/terminal/common/terminalProfiles", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/history/common/history", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/editor/common/editorService", "vs/base/common/path", "vs/workbench/services/configurationResolver/common/variableResolver", "vs/platform/theme/common/themeService", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/common/history"], function (require, exports, canIUse_1, actions_1, codicons_1, network_1, platform_1, types_1, uri_1, codeEditorService_1, nls_1, accessibility_1, actions_2, commands_1, configuration_1, contextkey_1, label_1, listService_1, notification_1, opener_1, quickInput_1, terminal_1, workspace_1, workspaceCommands_1, editorCommands_1, contextkeys_1, searchActions_1, terminal_2, terminalQuickAccess_1, terminal_3, terminalContextKey_1, terminalProfiles_1, terminalStrings_1, configurationResolver_1, environmentService_1, history_1, preferences_1, remoteAgentService_1, editorService_1, path_1, variableResolver_1, themeService_1, terminalIcon_1, history_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.refreshTerminalActions = exports.validateTerminalName = exports.registerTerminalActions = exports.TerminalLaunchHelpAction = exports.terminalSendSequenceCommand = exports.getCwdForSplit = exports.switchTerminalShowTabsTitle = exports.switchTerminalActionViewItemSeparator = void 0;
    exports.switchTerminalActionViewItemSeparator = '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500';
    exports.switchTerminalShowTabsTitle = (0, nls_1.localize)('showTerminalTabs', "Show Tabs");
    async function getCwdForSplit(configHelper, instance, folders, commandService) {
        switch (configHelper.config.splitCwd) {
            case 'workspaceRoot':
                if (folders !== undefined && commandService !== undefined) {
                    if (folders.length === 1) {
                        return folders[0].uri;
                    }
                    else if (folders.length > 1) {
                        // Only choose a path when there's more than 1 folder
                        const options = {
                            placeHolder: (0, nls_1.localize)('workbench.action.terminal.newWorkspacePlaceholder', "Select current working directory for new terminal")
                        };
                        const workspace = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID, [options]);
                        if (!workspace) {
                            // Don't split the instance if the workspace picker was canceled
                            return undefined;
                        }
                        return Promise.resolve(workspace.uri);
                    }
                }
                return '';
            case 'initial':
                return instance.getInitialCwd();
            case 'inherited':
                return instance.getCwd();
        }
    }
    exports.getCwdForSplit = getCwdForSplit;
    const terminalSendSequenceCommand = (accessor, args) => {
        accessor.get(terminal_2.ITerminalService).doWithActiveInstance(async (t) => {
            if (!(args === null || args === void 0 ? void 0 : args.text)) {
                return;
            }
            const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
            const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
            const historyService = accessor.get(history_1.IHistoryService);
            const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(t.isRemote ? network_1.Schemas.vscodeRemote : network_1.Schemas.file);
            const lastActiveWorkspaceRoot = activeWorkspaceRootUri ? (0, types_1.withNullAsUndefined)(workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri)) : undefined;
            const resolvedText = await configurationResolverService.resolveAsync(lastActiveWorkspaceRoot, args.text);
            t.sendText(resolvedText, false);
        });
    };
    exports.terminalSendSequenceCommand = terminalSendSequenceCommand;
    const terminalIndexRe = /^([0-9]+): /;
    let TerminalLaunchHelpAction = class TerminalLaunchHelpAction extends actions_1.Action {
        constructor(_openerService) {
            super('workbench.action.terminal.launchHelp', (0, nls_1.localize)('terminalLaunchHelp', "Open Help"));
            this._openerService = _openerService;
        }
        async run() {
            this._openerService.open('https://aka.ms/vscode-troubleshoot-terminal-launch');
        }
    };
    TerminalLaunchHelpAction = __decorate([
        __param(0, opener_1.IOpenerService)
    ], TerminalLaunchHelpAction);
    exports.TerminalLaunchHelpAction = TerminalLaunchHelpAction;
    function registerTerminalActions() {
        const category = { value: terminal_3.TERMINAL_ACTION_CATEGORY, original: 'Terminal' };
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.newInActiveWorkspace" /* TerminalCommandId.NewInActiveWorkspace */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.newInActiveWorkspace', "Create New Terminal (In Active Workspace)"), original: 'Create New Terminal (In Active Workspace)' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                if (terminalService.isProcessSupportRegistered) {
                    const instance = await terminalService.createTerminal({ location: terminalService.defaultLocation });
                    if (!instance) {
                        return;
                    }
                    terminalService.setActiveInstance(instance);
                }
                await terminalGroupService.showPanel(true);
            }
        });
        // Register new with profile command
        refreshTerminalActions([]);
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.createTerminalEditor" /* TerminalCommandId.CreateTerminalEditor */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.createTerminalEditor', "Create New Terminal in Editor Area"), original: 'Create New Terminal in Editor Area' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            async run(accessor, args) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const options = (typeof args === 'object' && args && 'location' in args) ? args : { location: terminal_1.TerminalLocation.Editor };
                const instance = await terminalService.createTerminal(options);
                instance.focusWhenReady();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.createTerminalEditorSide" /* TerminalCommandId.CreateTerminalEditorSide */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.createTerminalEditorSide', "Create New Terminal in Editor Area to the Side"), original: 'Create New Terminal in Editor Area to the Side' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const instance = await terminalService.createTerminal({
                    location: { viewColumn: editorService_1.SIDE_GROUP }
                });
                instance.focusWhenReady();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.moveToEditor" /* TerminalCommandId.MoveToEditor */,
                    title: terminalStrings_1.terminalStrings.moveToEditor,
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.terminalEditorActive.toNegated(), terminalContextKey_1.TerminalContextKeys.viewShowing)
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                terminalService.doWithActiveInstance(instance => terminalService.moveToEditor(instance));
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.moveToEditorInstance" /* TerminalCommandId.MoveToEditorInstance */,
                    title: terminalStrings_1.terminalStrings.moveToEditor,
                    f1: false,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.isOpen)
                });
            }
            async run(accessor) {
                const selectedInstances = getSelectedInstances(accessor);
                if (!selectedInstances || selectedInstances.length === 0) {
                    return;
                }
                const terminalService = accessor.get(terminal_2.ITerminalService);
                for (const instance of selectedInstances) {
                    terminalService.moveToEditor(instance);
                }
                selectedInstances[selectedInstances.length - 1].focus();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.moveToTerminalPanel" /* TerminalCommandId.MoveToTerminalPanel */,
                    title: terminalStrings_1.terminalStrings.moveToTerminalPanel,
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.terminalEditorActive),
                });
            }
            async run(accessor, resource) {
                const castedResource = uri_1.URI.isUri(resource) ? resource : undefined;
                await accessor.get(terminal_2.ITerminalService).moveToTerminalView(castedResource);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.showTabs" /* TerminalCommandId.ShowTabs */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.showTabs', "Show Tabs"), original: 'Show Tabs' },
                    f1: false,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                accessor.get(terminal_2.ITerminalGroupService).showTabs();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.focusPreviousPane" /* TerminalCommandId.FocusPreviousPane */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.focusPreviousPane', "Focus Previous Terminal in Terminal Group"), original: 'Focus Previous Terminal in Terminal Group' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */,
                        secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */],
                        mac: {
                            primary: 512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */,
                            secondary: [512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */]
                        },
                        when: terminalContextKey_1.TerminalContextKeys.focus,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                var _a;
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                (_a = terminalGroupService.activeGroup) === null || _a === void 0 ? void 0 : _a.focusPreviousPane();
                await terminalGroupService.showPanel(true);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.focusNextPane" /* TerminalCommandId.FocusNextPane */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.focusNextPane', "Focus Next Terminal in Terminal Group"), original: 'Focus Next Terminal in Terminal Group' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */,
                        secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */],
                        mac: {
                            primary: 512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */,
                            secondary: [512 /* KeyMod.Alt */ | 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */]
                        },
                        when: terminalContextKey_1.TerminalContextKeys.focus,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                var _a;
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                (_a = terminalGroupService.activeGroup) === null || _a === void 0 ? void 0 : _a.focusNextPane();
                await terminalGroupService.showPanel(true);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.runRecentCommand" /* TerminalCommandId.RunRecentCommand */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.runRecentCommand', "Run Recent Command"), original: 'Run Recent Command' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const terminalEditorService = accessor.get(terminal_2.ITerminalEditorService);
                const instance = accessor.get(terminal_2.ITerminalService).activeInstance;
                if (instance) {
                    await instance.runRecent('command');
                    if ((instance === null || instance === void 0 ? void 0 : instance.target) === terminal_1.TerminalLocation.Editor) {
                        terminalEditorService.revealActiveEditor();
                    }
                    else {
                        terminalGroupService.showPanel(false);
                    }
                }
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.goToRecentDirectory" /* TerminalCommandId.GoToRecentDirectory */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.goToRecentDirectory', "Go to Recent Directory"), original: 'Go to Recent Directory' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const terminalEditorService = accessor.get(terminal_2.ITerminalEditorService);
                const instance = accessor.get(terminal_2.ITerminalService).activeInstance;
                if (instance) {
                    await instance.runRecent('cwd');
                    if ((instance === null || instance === void 0 ? void 0 : instance.target) === terminal_1.TerminalLocation.Editor) {
                        terminalEditorService.revealActiveEditor();
                    }
                    else {
                        terminalGroupService.showPanel(false);
                    }
                }
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.resizePaneLeft" /* TerminalCommandId.ResizePaneLeft */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.resizePaneLeft', "Resize Terminal Left"), original: 'Resize Terminal Left' },
                    f1: true,
                    category,
                    keybinding: {
                        linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */ },
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 15 /* KeyCode.LeftArrow */ },
                        when: terminalContextKey_1.TerminalContextKeys.focus,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalGroupService).activeGroup) === null || _a === void 0 ? void 0 : _a.resizePane(0 /* Direction.Left */);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.resizePaneRight" /* TerminalCommandId.ResizePaneRight */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.resizePaneRight', "Resize Terminal Right"), original: 'Resize Terminal Right' },
                    f1: true,
                    category,
                    keybinding: {
                        linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */ },
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 17 /* KeyCode.RightArrow */ },
                        when: terminalContextKey_1.TerminalContextKeys.focus,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalGroupService).activeGroup) === null || _a === void 0 ? void 0 : _a.resizePane(1 /* Direction.Right */);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.resizePaneUp" /* TerminalCommandId.ResizePaneUp */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.resizePaneUp', "Resize Terminal Up"), original: 'Resize Terminal Up' },
                    f1: true,
                    category,
                    keybinding: {
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 16 /* KeyCode.UpArrow */ },
                        when: terminalContextKey_1.TerminalContextKeys.focus,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalGroupService).activeGroup) === null || _a === void 0 ? void 0 : _a.resizePane(2 /* Direction.Up */);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.resizePaneDown" /* TerminalCommandId.ResizePaneDown */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.resizePaneDown', "Resize Terminal Down"), original: 'Resize Terminal Down' },
                    f1: true,
                    category,
                    keybinding: {
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 18 /* KeyCode.DownArrow */ },
                        when: terminalContextKey_1.TerminalContextKeys.focus,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalGroupService).activeGroup) === null || _a === void 0 ? void 0 : _a.resizePane(3 /* Direction.Down */);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.focus" /* TerminalCommandId.Focus */,
                    title: terminalStrings_1.terminalStrings.focus,
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const instance = terminalService.activeInstance || await terminalService.createTerminal({ location: terminal_1.TerminalLocation.Panel });
                if (!instance) {
                    return;
                }
                terminalService.setActiveInstance(instance);
                return terminalGroupService.showPanel(true);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.focusTabs" /* TerminalCommandId.FocusTabs */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.focus.tabsView', "Focus Terminal Tabs View"), original: 'Focus Terminal Tabs View' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 88 /* KeyCode.Backslash */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.tabsFocus, terminalContextKey_1.TerminalContextKeys.focus),
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                accessor.get(terminal_2.ITerminalGroupService).focusTabs();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.focusNext" /* TerminalCommandId.FocusNext */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.focusNext', "Focus Next Terminal Group"), original: 'Focus Next Terminal Group' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 12 /* KeyCode.PageDown */,
                        mac: {
                            primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 89 /* KeyCode.BracketRight */
                        },
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.editorFocus.negate()),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                });
            }
            async run(accessor) {
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                terminalGroupService.setActiveGroupToNext();
                await terminalGroupService.showPanel(true);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.focusPrevious" /* TerminalCommandId.FocusPrevious */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.focusPrevious', "Focus Previous Terminal Group"), original: 'Focus Previous Terminal Group' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 11 /* KeyCode.PageUp */,
                        mac: {
                            primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 87 /* KeyCode.BracketLeft */
                        },
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.editorFocus.negate()),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                });
            }
            async run(accessor) {
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                terminalGroupService.setActiveGroupToPrevious();
                await terminalGroupService.showPanel(true);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.runSelectedText" /* TerminalCommandId.RunSelectedText */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.runSelectedText', "Run Selected Text In Active Terminal"), original: 'Run Selected Text In Active Terminal' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const instance = await terminalService.getActiveOrCreateInstance();
                const editor = codeEditorService.getActiveCodeEditor();
                if (!editor || !editor.hasModel()) {
                    return;
                }
                const selection = editor.getSelection();
                let text;
                if (selection.isEmpty()) {
                    text = editor.getModel().getLineContent(selection.selectionStartLineNumber).trim();
                }
                else {
                    const endOfLinePreference = platform_1.isWindows ? 1 /* EndOfLinePreference.LF */ : 2 /* EndOfLinePreference.CRLF */;
                    text = editor.getModel().getValueInRange(selection, endOfLinePreference);
                }
                instance.sendText(text, true);
                return terminalGroupService.showPanel();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.runActiveFile" /* TerminalCommandId.RunActiveFile */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.runActiveFile', "Run Active File In Active Terminal"), original: 'Run Active File In Active Terminal' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const workbenchEnvironmentService = accessor.get(environmentService_1.IWorkbenchEnvironmentService);
                const editor = codeEditorService.getActiveCodeEditor();
                if (!editor || !editor.hasModel()) {
                    return;
                }
                let instance = terminalService.activeInstance;
                const isRemote = instance ? instance.isRemote : (workbenchEnvironmentService.remoteAuthority ? true : false);
                const uri = editor.getModel().uri;
                if ((!isRemote && uri.scheme !== network_1.Schemas.file) || (isRemote && uri.scheme !== network_1.Schemas.vscodeRemote)) {
                    notificationService.warn((0, nls_1.localize)('workbench.action.terminal.runActiveFile.noFile', 'Only files on disk can be run in the terminal'));
                    return;
                }
                if (!instance) {
                    instance = await terminalService.getActiveOrCreateInstance();
                }
                // TODO: Convert this to ctrl+c, ctrl+v for pwsh?
                await instance.sendPath(uri.fsPath, true);
                return terminalGroupService.showPanel();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollDown" /* TerminalCommandId.ScrollDownLine */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.scrollDown', "Scroll Down (Line)"), original: 'Scroll Down (Line)' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 12 /* KeyCode.PageDown */,
                        linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */ },
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.altBufferActive.negate()),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.scrollDownLine();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollDownPage" /* TerminalCommandId.ScrollDownPage */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.scrollDownPage', "Scroll Down (Page)"), original: 'Scroll Down (Page)' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 1024 /* KeyMod.Shift */ | 12 /* KeyCode.PageDown */,
                        mac: { primary: 12 /* KeyCode.PageDown */ },
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.altBufferActive.negate()),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.scrollDownPage();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollToBottom" /* TerminalCommandId.ScrollToBottom */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.scrollToBottom', "Scroll to Bottom"), original: 'Scroll to Bottom' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 13 /* KeyCode.End */,
                        linux: { primary: 1024 /* KeyMod.Shift */ | 13 /* KeyCode.End */ },
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.altBufferActive.negate()),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.scrollToBottom();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollUp" /* TerminalCommandId.ScrollUpLine */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.scrollUp', "Scroll Up (Line)"), original: 'Scroll Up (Line)' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 11 /* KeyCode.PageUp */,
                        linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */ },
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.altBufferActive.negate()),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.scrollUpLine();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollUpPage" /* TerminalCommandId.ScrollUpPage */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.scrollUpPage', "Scroll Up (Page)"), original: 'Scroll Up (Page)' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 1024 /* KeyMod.Shift */ | 11 /* KeyCode.PageUp */,
                        mac: { primary: 11 /* KeyCode.PageUp */ },
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.altBufferActive.negate()),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.scrollUpPage();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollToTop" /* TerminalCommandId.ScrollToTop */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.scrollToTop', "Scroll to Top"), original: 'Scroll to Top' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */,
                        linux: { primary: 1024 /* KeyMod.Shift */ | 14 /* KeyCode.Home */ },
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.altBufferActive.negate()),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.scrollToTop();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.navigationModeExit" /* TerminalCommandId.NavigationModeExit */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.navigationModeExit', "Exit Navigation Mode"), original: 'Exit Navigation Mode' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 9 /* KeyCode.Escape */,
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.a11yTreeFocus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            run(accessor) {
                var _a, _b;
                (_b = (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.navigationMode) === null || _b === void 0 ? void 0 : _b.exitNavigationMode();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.navigationModeFocusPrevious" /* TerminalCommandId.NavigationModeFocusPrevious */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.navigationModeFocusPrevious', "Focus Previous Line (Navigation Mode)"), original: 'Focus Previous Line (Navigation Mode)' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.a11yTreeFocus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED), contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED)),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            run(accessor) {
                var _a, _b;
                (_b = (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.navigationMode) === null || _b === void 0 ? void 0 : _b.focusPreviousLine();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.navigationModeFocusNext" /* TerminalCommandId.NavigationModeFocusNext */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.navigationModeFocusNext', "Focus Next Line (Navigation Mode)"), original: 'Focus Next Line (Navigation Mode)' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.a11yTreeFocus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED), contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED)),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            run(accessor) {
                var _a, _b;
                (_b = (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.navigationMode) === null || _b === void 0 ? void 0 : _b.focusNextLine();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.clearSelection" /* TerminalCommandId.ClearSelection */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.clearSelection', "Clear Selection"), original: 'Clear Selection' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 9 /* KeyCode.Escape */,
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.textSelected, terminalContextKey_1.TerminalContextKeys.notFindVisible),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                const terminalInstance = accessor.get(terminal_2.ITerminalService).activeInstance;
                if (terminalInstance && terminalInstance.hasSelection()) {
                    terminalInstance.clearSelection();
                }
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.changeIcon" /* TerminalCommandId.ChangeIcon */,
                    title: terminalStrings_1.terminalStrings.changeIcon,
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor, resource) {
                var _a;
                (_a = doWithInstance(accessor, resource)) === null || _a === void 0 ? void 0 : _a.changeIcon();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.changeIconPanel" /* TerminalCommandId.ChangeIconPanel */,
                    title: terminalStrings_1.terminalStrings.changeIcon,
                    f1: false,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                var _a;
                return (_a = accessor.get(terminal_2.ITerminalGroupService).activeInstance) === null || _a === void 0 ? void 0 : _a.changeIcon();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.changeIconInstance" /* TerminalCommandId.ChangeIconInstance */,
                    title: terminalStrings_1.terminalStrings.changeIcon,
                    f1: false,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.tabsSingularSelection)
                });
            }
            async run(accessor) {
                var _a;
                return (_a = getSelectedInstances(accessor)) === null || _a === void 0 ? void 0 : _a[0].changeIcon();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.changeColor" /* TerminalCommandId.ChangeColor */,
                    title: terminalStrings_1.terminalStrings.changeColor,
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor, resource) {
                var _a;
                (_a = doWithInstance(accessor, resource)) === null || _a === void 0 ? void 0 : _a.changeColor();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.changeColorPanel" /* TerminalCommandId.ChangeColorPanel */,
                    title: terminalStrings_1.terminalStrings.changeColor,
                    f1: false,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                var _a;
                return (_a = accessor.get(terminal_2.ITerminalGroupService).activeInstance) === null || _a === void 0 ? void 0 : _a.changeColor();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.changeColorInstance" /* TerminalCommandId.ChangeColorInstance */,
                    title: terminalStrings_1.terminalStrings.changeColor,
                    f1: false,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.tabsSingularSelection)
                });
            }
            async run(accessor) {
                var _a;
                return (_a = getSelectedInstances(accessor)) === null || _a === void 0 ? void 0 : _a[0].changeColor();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.rename" /* TerminalCommandId.Rename */,
                    title: terminalStrings_1.terminalStrings.rename,
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor, resource) {
                var _a;
                (_a = doWithInstance(accessor, resource)) === null || _a === void 0 ? void 0 : _a.rename('triggerQuickpick');
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.renamePanel" /* TerminalCommandId.RenamePanel */,
                    title: terminalStrings_1.terminalStrings.rename,
                    f1: false,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                var _a;
                return (_a = accessor.get(terminal_2.ITerminalGroupService).activeInstance) === null || _a === void 0 ? void 0 : _a.rename('triggerQuickpick');
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.renameInstance" /* TerminalCommandId.RenameInstance */,
                    title: terminalStrings_1.terminalStrings.rename,
                    f1: false,
                    category,
                    keybinding: {
                        primary: 60 /* KeyCode.F2 */,
                        mac: {
                            primary: 3 /* KeyCode.Enter */
                        },
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.tabsFocus),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.tabsSingularSelection),
                });
            }
            async run(accessor) {
                var _a;
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const instance = (_a = getSelectedInstances(accessor)) === null || _a === void 0 ? void 0 : _a[0];
                if (!instance) {
                    return;
                }
                terminalService.setEditable(instance, {
                    validationMessage: value => validateTerminalName(value),
                    onFinish: async (value, success) => {
                        // Cancel editing first as instance.rename will trigger a rerender automatically
                        terminalService.setEditable(instance, null);
                        if (success) {
                            try {
                                await instance.rename(value);
                            }
                            catch (e) {
                                notificationService.error(e);
                            }
                        }
                    }
                });
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.focusFind" /* TerminalCommandId.FindFocus */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.focusFind', "Focus Find"), original: 'Focus Find' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
                        when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.findFocus, terminalContextKey_1.TerminalContextKeys.focus),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).getFindHost().focusFindWidget();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.hideFind" /* TerminalCommandId.FindHide */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.hideFind', "Hide Find"), original: 'Hide Find' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 9 /* KeyCode.Escape */,
                        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.findVisible),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).getFindHost().hideFindWidget();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.detachSession" /* TerminalCommandId.DetachSession */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.detachSession', "Detach Session"), original: 'Detach Session' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            async run(accessor) {
                var _a;
                const terminalService = accessor.get(terminal_2.ITerminalService);
                await ((_a = terminalService.activeInstance) === null || _a === void 0 ? void 0 : _a.detachFromProcess());
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.attachToSession" /* TerminalCommandId.AttachToSession */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.attachToSession', "Attach to Session"), original: 'Attach to Session' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            async run(accessor) {
                var _a, _b;
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const labelService = accessor.get(label_1.ILabelService);
                const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const remoteAuthority = (_b = (_a = remoteAgentService.getConnection()) === null || _a === void 0 ? void 0 : _a.remoteAuthority) !== null && _b !== void 0 ? _b : undefined;
                const backend = accessor.get(terminal_2.ITerminalInstanceService).getBackend(remoteAuthority);
                if (!backend) {
                    throw new Error(`No backend registered for remote authority '${remoteAuthority}'`);
                }
                const terms = await backend.listProcesses();
                backend.reduceConnectionGraceTime();
                const unattachedTerms = terms.filter(term => !terminalService.isAttachedToTerminal(term));
                const items = unattachedTerms.map(term => {
                    const cwdLabel = labelService.getUriLabel(uri_1.URI.file(term.cwd));
                    return {
                        label: term.title,
                        detail: term.workspaceName ? `${term.workspaceName} \u2E31 ${cwdLabel}` : cwdLabel,
                        description: term.pid ? String(term.pid) : '',
                        term
                    };
                });
                if (items.length === 0) {
                    notificationService.info((0, nls_1.localize)('noUnattachedTerminals', 'There are no unattached terminals to attach to'));
                    return;
                }
                const selected = await quickInputService.pick(items, { canPickMany: false });
                if (selected) {
                    const instance = await terminalService.createTerminal({
                        config: { attachPersistentProcess: selected.term }
                    });
                    terminalService.setActiveInstance(instance);
                    if (instance.target === terminal_1.TerminalLocation.Editor) {
                        await instance.focusWhenReady(true);
                    }
                    else {
                        terminalGroupService.showPanel(true);
                    }
                }
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.quickOpenTerm" /* TerminalCommandId.QuickOpenTerm */,
                    title: { value: (0, nls_1.localize)('quickAccessTerminal', "Switch Active Terminal"), original: 'Switch Active Terminal' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                accessor.get(quickInput_1.IQuickInputService).quickAccess.show(terminalQuickAccess_1.TerminalQuickAccessProvider.PREFIX);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollToPreviousCommand" /* TerminalCommandId.ScrollToPreviousCommand */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.scrollToPreviousCommand', "Scroll To Previous Command"), original: 'Scroll To Previous Command' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */,
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => {
                    var _a;
                    (_a = t.xterm) === null || _a === void 0 ? void 0 : _a.commandTracker.scrollToPreviousCommand();
                    t.focus();
                });
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.scrollToNextCommand" /* TerminalCommandId.ScrollToNextCommand */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.scrollToNextCommand', "Scroll To Next Command"), original: 'Scroll To Next Command' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */,
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => {
                    var _a;
                    (_a = t.xterm) === null || _a === void 0 ? void 0 : _a.commandTracker.scrollToNextCommand();
                    t.focus();
                });
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.selectToPreviousCommand" /* TerminalCommandId.SelectToPreviousCommand */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.selectToPreviousCommand', "Select To Previous Command"), original: 'Select To Previous Command' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 16 /* KeyCode.UpArrow */,
                        when: terminalContextKey_1.TerminalContextKeys.focus,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => {
                    var _a;
                    (_a = t.xterm) === null || _a === void 0 ? void 0 : _a.commandTracker.selectToPreviousCommand();
                    t.focus();
                });
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.selectToNextCommand" /* TerminalCommandId.SelectToNextCommand */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.selectToNextCommand', "Select To Next Command"), original: 'Select To Next Command' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 18 /* KeyCode.DownArrow */,
                        when: terminalContextKey_1.TerminalContextKeys.focus,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => {
                    var _a;
                    (_a = t.xterm) === null || _a === void 0 ? void 0 : _a.commandTracker.selectToNextCommand();
                    t.focus();
                });
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.selectToPreviousLine" /* TerminalCommandId.SelectToPreviousLine */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.selectToPreviousLine', "Select To Previous Line"), original: 'Select To Previous Line' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => {
                    var _a;
                    (_a = t.xterm) === null || _a === void 0 ? void 0 : _a.commandTracker.selectToPreviousLine();
                    t.focus();
                });
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.selectToNextLine" /* TerminalCommandId.SelectToNextLine */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.selectToNextLine', "Select To Next Line"), original: 'Select To Next Line' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => {
                    var _a;
                    (_a = t.xterm) === null || _a === void 0 ? void 0 : _a.commandTracker.selectToNextLine();
                    t.focus();
                });
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "toggleEscapeSequenceLogging" /* TerminalCommandId.ToggleEscapeSequenceLogging */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.toggleEscapeSequenceLogging', "Toggle Escape Sequence Logging"), original: 'Toggle Escape Sequence Logging' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                await terminalService.toggleEscapeSequenceLogging();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                const title = (0, nls_1.localize)('workbench.action.terminal.sendSequence', "Send Custom Sequence To Terminal");
                super({
                    id: "workbench.action.terminal.sendSequence" /* TerminalCommandId.SendSequence */,
                    title: { value: title, original: 'Send Custom Sequence To Terminal' },
                    category,
                    description: {
                        description: title,
                        args: [{
                                name: 'args',
                                schema: {
                                    type: 'object',
                                    required: ['text'],
                                    properties: {
                                        text: { type: 'string' }
                                    },
                                }
                            }]
                    },
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            run(accessor, args) {
                (0, exports.terminalSendSequenceCommand)(accessor, args);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                const title = (0, nls_1.localize)('workbench.action.terminal.newWithCwd', "Create New Terminal Starting in a Custom Working Directory");
                super({
                    id: "workbench.action.terminal.newWithCwd" /* TerminalCommandId.NewWithCwd */,
                    title: { value: title, original: 'Create New Terminal Starting in a Custom Working Directory' },
                    category,
                    description: {
                        description: title,
                        args: [{
                                name: 'args',
                                schema: {
                                    type: 'object',
                                    required: ['cwd'],
                                    properties: {
                                        cwd: {
                                            description: (0, nls_1.localize)('workbench.action.terminal.newWithCwd.cwd', "The directory to start the terminal at"),
                                            type: 'string'
                                        }
                                    },
                                }
                            }]
                    },
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            async run(accessor, args) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                if (terminalService.isProcessSupportRegistered) {
                    const instance = await terminalService.createTerminal({
                        cwd: args === null || args === void 0 ? void 0 : args.cwd
                    });
                    if (!instance) {
                        return;
                    }
                    terminalService.setActiveInstance(instance);
                    if (instance.target === terminal_1.TerminalLocation.Editor) {
                        await instance.focusWhenReady(true);
                    }
                    else {
                        return terminalGroupService.showPanel(true);
                    }
                }
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                const title = (0, nls_1.localize)('workbench.action.terminal.renameWithArg', "Rename the Currently Active Terminal");
                super({
                    id: "workbench.action.terminal.renameWithArg" /* TerminalCommandId.RenameWithArgs */,
                    title: { value: title, original: 'Rename the Currently Active Terminal' },
                    category,
                    description: {
                        description: title,
                        args: [{
                                name: 'args',
                                schema: {
                                    type: 'object',
                                    required: ['name'],
                                    properties: {
                                        name: {
                                            description: (0, nls_1.localize)('workbench.action.terminal.renameWithArg.name', "The new name for the terminal"),
                                            type: 'string',
                                            minLength: 1
                                        }
                                    }
                                }
                            }]
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor, args) {
                var _a;
                const notificationService = accessor.get(notification_1.INotificationService);
                if (!(args === null || args === void 0 ? void 0 : args.name)) {
                    notificationService.warn((0, nls_1.localize)('workbench.action.terminal.renameWithArg.noName', "No name argument provided"));
                    return;
                }
                (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.refreshTabLabels(args.name, terminal_1.TitleEventSource.Api);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.toggleFindRegex" /* TerminalCommandId.ToggleFindRegex */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.toggleFindRegex', "Toggle Find Using Regex"), original: 'Toggle Find Using Regex' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */,
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 48 /* KeyCode.KeyR */ },
                        when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.findFocus),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const instanceHost = terminalService.getFindHost();
                const state = instanceHost.getFindState();
                state.change({ isRegex: !state.isRegex }, false);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.toggleFindWholeWord" /* TerminalCommandId.ToggleFindWholeWord */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.toggleFindWholeWord', "Toggle Find Using Whole Word"), original: 'Toggle Find Using Whole Word' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 512 /* KeyMod.Alt */ | 53 /* KeyCode.KeyW */,
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 53 /* KeyCode.KeyW */ },
                        when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.findFocus),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const instanceHost = terminalService.getFindHost();
                const state = instanceHost.getFindState();
                state.change({ wholeWord: !state.wholeWord }, false);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.toggleFindCaseSensitive" /* TerminalCommandId.ToggleFindCaseSensitive */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.toggleFindCaseSensitive', "Toggle Find Using Case Sensitive"), original: 'Toggle Find Using Case Sensitive' },
                    f1: true,
                    category,
                    keybinding: {
                        primary: 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */,
                        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 33 /* KeyCode.KeyC */ },
                        when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.findFocus),
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const instanceHost = terminalService.getFindHost();
                const state = instanceHost.getFindState();
                state.change({ matchCase: !state.matchCase }, false);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.findNext" /* TerminalCommandId.FindNext */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.findNext', "Find Next"), original: 'Find Next' },
                    f1: true,
                    category,
                    keybinding: [
                        {
                            primary: 61 /* KeyCode.F3 */,
                            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 37 /* KeyCode.KeyG */, secondary: [61 /* KeyCode.F3 */] },
                            when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.findFocus),
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */
                        },
                        {
                            primary: 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                            when: terminalContextKey_1.TerminalContextKeys.findInputFocus,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */
                        }
                    ],
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).getFindHost().findNext();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.findPrevious" /* TerminalCommandId.FindPrevious */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.findPrevious', "Find Previous"), original: 'Find Previous' },
                    f1: true,
                    category,
                    keybinding: [
                        {
                            primary: 1024 /* KeyMod.Shift */ | 61 /* KeyCode.F3 */,
                            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 37 /* KeyCode.KeyG */, secondary: [1024 /* KeyMod.Shift */ | 61 /* KeyCode.F3 */] },
                            when: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.findFocus),
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */
                        },
                        {
                            primary: 3 /* KeyCode.Enter */,
                            when: terminalContextKey_1.TerminalContextKeys.findInputFocus,
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */
                        }
                    ],
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).getFindHost().findPrevious();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.searchWorkspace" /* TerminalCommandId.SearchWorkspace */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.searchWorkspace', "Search Workspace"), original: 'Search Workspace' },
                    f1: true,
                    category,
                    keybinding: [
                        {
                            primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 36 /* KeyCode.KeyF */,
                            when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.focus, terminalContextKey_1.TerminalContextKeys.textSelected),
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50
                        }
                    ],
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            run(accessor) {
                var _a;
                const query = (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.selection;
                (0, searchActions_1.FindInFilesCommand)(accessor, { query });
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.relaunch" /* TerminalCommandId.Relaunch */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.relaunch', "Relaunch Active Terminal"), original: 'Relaunch Active Terminal' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.relaunch();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.showEnvironmentInformation" /* TerminalCommandId.ShowEnvironmentInformation */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.showEnvironmentInformation', "Show Environment Information"), original: 'Show Environment Information' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.showEnvironmentInfoHover();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                    title: terminalStrings_1.terminalStrings.split,
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile),
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 26 /* KeyCode.Digit5 */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        mac: {
                            primary: 2048 /* KeyMod.CtrlCmd */ | 88 /* KeyCode.Backslash */,
                            secondary: [256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 26 /* KeyCode.Digit5 */]
                        },
                        when: terminalContextKey_1.TerminalContextKeys.focus
                    },
                    icon: codicons_1.Codicon.splitHorizontal,
                    description: {
                        description: 'workbench.action.terminal.split',
                        args: [{
                                name: 'profile',
                                schema: {
                                    type: 'object'
                                }
                            }]
                    }
                });
            }
            async run(accessor, optionsOrProfile) {
                const commandService = accessor.get(commands_1.ICommandService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
                const options = convertOptionsOrProfileToOptions(optionsOrProfile);
                const activeInstance = terminalService.getInstanceHost(options === null || options === void 0 ? void 0 : options.location).activeInstance;
                if (!activeInstance) {
                    return;
                }
                const cwd = await getCwdForSplit(terminalService.configHelper, activeInstance, workspaceContextService.getWorkspace().folders, commandService);
                if (cwd === undefined) {
                    return undefined;
                }
                const instance = await terminalService.createTerminal({ location: { parentTerminal: activeInstance }, config: options === null || options === void 0 ? void 0 : options.config, cwd });
                if (instance) {
                    if (instance.target === terminal_1.TerminalLocation.Editor) {
                        instance.focusWhenReady();
                    }
                    else {
                        return terminalGroupService.showPanel(true);
                    }
                }
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.splitInstance" /* TerminalCommandId.SplitInstance */,
                    title: terminalStrings_1.terminalStrings.split,
                    f1: false,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 26 /* KeyCode.Digit5 */,
                        mac: {
                            primary: 2048 /* KeyMod.CtrlCmd */ | 88 /* KeyCode.Backslash */,
                            secondary: [256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 26 /* KeyCode.Digit5 */]
                        },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: terminalContextKey_1.TerminalContextKeys.tabsFocus
                    }
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const instances = getSelectedInstances(accessor);
                if (instances) {
                    for (const t of instances) {
                        terminalService.setActiveInstance(t);
                        terminalService.doWithActiveInstance(async (instance) => {
                            await terminalService.createTerminal({ location: { parentTerminal: instance } });
                            await terminalGroupService.showPanel(true);
                        });
                    }
                }
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.unsplit" /* TerminalCommandId.Unsplit */,
                    title: terminalStrings_1.terminalStrings.unsplit,
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                await accessor.get(terminal_2.ITerminalService).doWithActiveInstance(async (t) => accessor.get(terminal_2.ITerminalGroupService).unsplitInstance(t));
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.unsplitInstance" /* TerminalCommandId.UnsplitInstance */,
                    title: terminalStrings_1.terminalStrings.unsplit,
                    f1: false,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const instances = getSelectedInstances(accessor);
                // should not even need this check given the context key
                // but TS complains
                if ((instances === null || instances === void 0 ? void 0 : instances.length) === 1) {
                    const group = terminalGroupService.getGroupForInstance(instances[0]);
                    if (group && (group === null || group === void 0 ? void 0 : group.terminalInstances.length) > 1) {
                        terminalGroupService.unsplitInstance(instances[0]);
                    }
                }
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.joinInstance" /* TerminalCommandId.JoinInstance */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.joinInstance', "Join Terminals"), original: 'Join Terminals' },
                    category,
                    precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.tabsSingularSelection.toNegated())
                });
            }
            async run(accessor) {
                const instances = getSelectedInstances(accessor);
                if (instances && instances.length > 1) {
                    accessor.get(terminal_2.ITerminalGroupService).joinInstances(instances);
                }
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.join" /* TerminalCommandId.Join */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.join', "Join Terminals"), original: 'Join Terminals' },
                    category,
                    f1: true,
                    precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated))
                });
            }
            async run(accessor) {
                const themeService = accessor.get(themeService_1.IThemeService);
                const groupService = accessor.get(terminal_2.ITerminalGroupService);
                const notificationService = accessor.get(notification_1.INotificationService);
                const picks = [];
                if (groupService.instances.length <= 1) {
                    notificationService.warn((0, nls_1.localize)('workbench.action.terminal.join.insufficientTerminals', 'Insufficient terminals for the join action'));
                    return;
                }
                const otherInstances = groupService.instances.filter(i => { var _a; return i.instanceId !== ((_a = groupService.activeInstance) === null || _a === void 0 ? void 0 : _a.instanceId); });
                for (const terminal of otherInstances) {
                    const group = groupService.getGroupForInstance(terminal);
                    if ((group === null || group === void 0 ? void 0 : group.terminalInstances.length) === 1) {
                        const iconId = (0, terminalIcon_1.getIconId)(terminal);
                        const label = `$(${iconId}): ${terminal.title}`;
                        const iconClasses = [];
                        const colorClass = (0, terminalIcon_1.getColorClass)(terminal);
                        if (colorClass) {
                            iconClasses.push(colorClass);
                        }
                        const uriClasses = (0, terminalIcon_1.getUriClasses)(terminal, themeService.getColorTheme().type);
                        if (uriClasses) {
                            iconClasses.push(...uriClasses);
                        }
                        picks.push({
                            terminal,
                            label,
                            iconClasses
                        });
                    }
                }
                if (picks.length === 0) {
                    notificationService.warn((0, nls_1.localize)('workbench.action.terminal.join.onlySplits', 'All terminals are joined already'));
                    return;
                }
                const result = await accessor.get(quickInput_1.IQuickInputService).pick(picks, {});
                if (result) {
                    groupService.joinInstances([result.terminal, groupService.activeInstance]);
                }
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.splitInActiveWorkspace" /* TerminalCommandId.SplitInActiveWorkspace */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.splitInActiveWorkspace', "Split Terminal (In Active Workspace)"), original: 'Split Terminal (In Active Workspace)' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported,
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                await terminalService.doWithActiveInstance(async (t) => {
                    const instance = await terminalService.createTerminal({ location: { parentTerminal: t } });
                    if ((instance === null || instance === void 0 ? void 0 : instance.target) !== terminal_1.TerminalLocation.Editor) {
                        await terminalGroupService.showPanel(true);
                    }
                });
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.selectAll" /* TerminalCommandId.SelectAll */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.selectAll', "Select All"), original: 'Select All' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
                    keybinding: [{
                            // Don't use ctrl+a by default as that would override the common go to start
                            // of prompt shell binding
                            primary: 0,
                            // Technically this doesn't need to be here as it will fall back to this
                            // behavior anyway when handed to xterm.js, having this handled by VS Code
                            // makes it easier for users to see how it works though.
                            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 31 /* KeyCode.KeyA */ },
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                            when: terminalContextKey_1.TerminalContextKeys.focus
                        }]
                });
            }
            run(accessor) {
                var _a;
                (_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.selectAll();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.new', "Create New Terminal"), original: 'Create New Terminal' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile),
                    icon: codicons_1.Codicon.plus,
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 86 /* KeyCode.Backquote */,
                        mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 86 /* KeyCode.Backquote */ },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    },
                    description: {
                        description: 'workbench.action.terminal.new',
                        args: [{
                                name: 'eventOrOptions',
                                schema: {
                                    type: 'object'
                                }
                            }]
                    }
                });
            }
            async run(accessor, eventOrOptions) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
                const commandService = accessor.get(commands_1.ICommandService);
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
                const folders = workspaceContextService.getWorkspace().folders;
                if (eventOrOptions && eventOrOptions instanceof MouseEvent && (eventOrOptions.altKey || eventOrOptions.ctrlKey)) {
                    await terminalService.createTerminal({ location: { splitActiveTerminal: true } });
                    return;
                }
                if (terminalService.isProcessSupportRegistered) {
                    eventOrOptions = !eventOrOptions || eventOrOptions instanceof MouseEvent ? {} : eventOrOptions;
                    let instance;
                    if (folders.length <= 1) {
                        // Allow terminal service to handle the path when there is only a
                        // single root
                        instance = await terminalService.createTerminal(eventOrOptions);
                    }
                    else {
                        const options = {
                            placeHolder: (0, nls_1.localize)('workbench.action.terminal.newWorkspacePlaceholder', "Select current working directory for new terminal")
                        };
                        const workspace = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID, [options]);
                        if (!workspace) {
                            // Don't create the instance if the workspace picker was canceled
                            return;
                        }
                        eventOrOptions.cwd = workspace.uri;
                        const cwdConfig = configurationService.getValue("terminal.integrated.cwd" /* TerminalSettingId.Cwd */, { resource: workspace.uri });
                        if (typeof cwdConfig === 'string' && cwdConfig.length > 0) {
                            const resolvedCwdConfig = await configurationResolverService.resolveAsync(workspace, cwdConfig);
                            if ((0, path_1.isAbsolute)(resolvedCwdConfig) || resolvedCwdConfig.startsWith(variableResolver_1.AbstractVariableResolverService.VARIABLE_LHS)) {
                                eventOrOptions.cwd = uri_1.URI.from({
                                    scheme: workspace.uri.scheme,
                                    path: resolvedCwdConfig
                                });
                            }
                            else {
                                eventOrOptions.cwd = uri_1.URI.joinPath(workspace.uri, resolvedCwdConfig);
                            }
                        }
                        instance = await terminalService.createTerminal(eventOrOptions);
                    }
                    terminalService.setActiveInstance(instance);
                    if (instance.target === terminal_1.TerminalLocation.Editor) {
                        await instance.focusWhenReady(true);
                    }
                    else {
                        await terminalGroupService.showPanel(true);
                    }
                }
                else if (terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile) {
                    commandService.executeCommand("workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */);
                }
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.kill" /* TerminalCommandId.Kill */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.kill', "Kill the Active Terminal Instance"), original: 'Kill the Active Terminal Instance' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.isOpen),
                    icon: codicons_1.Codicon.trash
                });
            }
            async run(accessor) {
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const instance = terminalGroupService.activeInstance;
                if (!instance) {
                    return;
                }
                await terminalService.safeDisposeTerminal(instance);
                if (terminalGroupService.instances.length > 0) {
                    await terminalGroupService.showPanel(true);
                }
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.killAll" /* TerminalCommandId.KillAll */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.killAll', "Kill All Terminals"), original: 'Kill All Terminals' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.isOpen),
                    icon: codicons_1.Codicon.trash
                });
            }
            async run(accessor) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const disposePromises = [];
                for (const instance of terminalService.instances) {
                    disposePromises.push(terminalService.safeDisposeTerminal(instance));
                }
                await Promise.all(disposePromises);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.killEditor" /* TerminalCommandId.KillEditor */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.killEditor', "Kill the Active Terminal in Editor Area"), original: 'Kill the Active Terminal in Editor Area' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
                    keybinding: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */,
                        win: { primary: 2048 /* KeyMod.CtrlCmd */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */] },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeTerminal), terminalContextKey_1.TerminalContextKeys.editorFocus)
                    }
                });
            }
            async run(accessor) {
                accessor.get(commands_1.ICommandService).executeCommand(editorCommands_1.CLOSE_EDITOR_COMMAND_ID);
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.killInstance" /* TerminalCommandId.KillInstance */,
                    title: terminalStrings_1.terminalStrings.kill,
                    f1: false,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.isOpen),
                    keybinding: {
                        primary: 20 /* KeyCode.Delete */,
                        mac: {
                            primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
                            secondary: [20 /* KeyCode.Delete */]
                        },
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: terminalContextKey_1.TerminalContextKeys.tabsFocus
                    }
                });
            }
            async run(accessor) {
                const selectedInstances = getSelectedInstances(accessor);
                if (!selectedInstances) {
                    return;
                }
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const disposePromises = [];
                for (const instance of selectedInstances) {
                    disposePromises.push(terminalService.safeDisposeTerminal(instance));
                }
                await Promise.all(disposePromises);
                if (terminalService.instances.length > 0) {
                    accessor.get(terminal_2.ITerminalGroupService).focusTabs();
                    focusNext(accessor);
                }
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.clear" /* TerminalCommandId.Clear */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.clear', "Clear"), original: 'Clear' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
                    keybinding: [{
                            primary: 0,
                            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */ },
                            // Weight is higher than work workbench contributions so the keybinding remains
                            // highest priority when chords are registered afterwards
                            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 1,
                            when: terminalContextKey_1.TerminalContextKeys.focus
                        }]
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => t.clearBuffer());
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.openDetectedLink" /* TerminalCommandId.OpenDetectedLink */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.openDetectedLink', "Open Detected Link..."), original: 'Open Detected Link...' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated,
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => t.showLinkQuickpick());
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.openUrlLink" /* TerminalCommandId.OpenWebLink */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.openLastUrlLink', "Open Last Url Link"), original: 'Open Last Url Link' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated,
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => t.openRecentLink('url'));
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.openFileLink" /* TerminalCommandId.OpenFileLink */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.openLastLocalFileLink', "Open Last Local File Link"), original: 'Open Last Local File Link' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated,
                });
            }
            run(accessor) {
                accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => t.openRecentLink('localFile'));
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.selectDefaultShell" /* TerminalCommandId.SelectDefaultProfile */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.selectDefaultShell', "Select Default Profile"), original: 'Select Default Profile' },
                    f1: true,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            async run(accessor) {
                await accessor.get(terminal_2.ITerminalService).showProfileQuickPick('setDefault');
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.createProfileButton" /* TerminalCommandId.CreateWithProfileButton */,
                    title: "workbench.action.terminal.createProfileButton" /* TerminalCommandId.CreateWithProfileButton */,
                    f1: false,
                    category,
                    precondition: terminalContextKey_1.TerminalContextKeys.processSupported
                });
            }
            async run(accessor) {
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.openSettings" /* TerminalCommandId.ConfigureTerminalSettings */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.openSettings', "Configure Terminal Settings"), original: 'Configure Terminal Settings' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor) {
                await accessor.get(preferences_1.IPreferencesService).openSettings({ jsonEditor: false, query: '@feature:terminal' });
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.setDimensions" /* TerminalCommandId.SetDimensions */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.setFixedDimensions', "Set Fixed Dimensions"), original: 'Set Fixed Dimensions' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.isOpen)
                });
            }
            async run(accessor) {
                await accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => t.setFixedDimensions());
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.sizeToContentWidth" /* TerminalCommandId.SizeToContentWidth */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.sizeToContentWidth', "Toggle Size to Content Width"), original: 'Toggle Size to Content Width' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.isOpen, terminalContextKey_1.TerminalContextKeys.focus),
                    keybinding: {
                        primary: 512 /* KeyMod.Alt */ | 56 /* KeyCode.KeyZ */,
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */
                    }
                });
            }
            async run(accessor) {
                await accessor.get(terminal_2.ITerminalService).doWithActiveInstance(t => t.toggleSizeToContentWidth());
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.sizeToContentWidthInstance" /* TerminalCommandId.SizeToContentWidthInstance */,
                    title: terminalStrings_1.terminalStrings.toggleSizeToContentWidth,
                    f1: false,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.focus)
                });
            }
            async run(accessor) {
                var _a;
                return (_a = getSelectedInstances(accessor)) === null || _a === void 0 ? void 0 : _a[0].toggleSizeToContentWidth();
            }
        });
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.clearCommandHistory" /* TerminalCommandId.ClearCommandHistory */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.clearCommandHistory', "Clear Command History"), original: 'Clear Command History' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            run(accessor) {
                (0, history_2.getCommandHistory)(accessor).clear();
            }
        });
        // Some commands depend on platform features
        if (canIUse_1.BrowserFeatures.clipboard.writeText) {
            (0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: "workbench.action.terminal.copySelection" /* TerminalCommandId.CopySelection */,
                        title: { value: (0, nls_1.localize)('workbench.action.terminal.copySelection', "Copy Selection"), original: 'Copy Selection' },
                        f1: true,
                        category,
                        // TODO: Why is copy still showing up when text isn't selected?
                        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.textSelected),
                        keybinding: [{
                                primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
                                win: { primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 33 /* KeyCode.KeyC */] },
                                linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 33 /* KeyCode.KeyC */ },
                                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                                when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.textSelected, terminalContextKey_1.TerminalContextKeys.focus)
                            }]
                    });
                }
                async run(accessor) {
                    var _a;
                    await ((_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.copySelection());
                }
            });
            (0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: "workbench.action.terminal.copySelectionAsHtml" /* TerminalCommandId.CopySelectionAsHtml */,
                        title: { value: (0, nls_1.localize)('workbench.action.terminal.copySelectionAsHtml', "Copy Selection as HTML"), original: 'Copy Selection as HTML' },
                        f1: true,
                        category,
                        precondition: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated), terminalContextKey_1.TerminalContextKeys.textSelected)
                    });
                }
                async run(accessor) {
                    var _a;
                    await ((_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.copySelection(true));
                }
            });
        }
        if (canIUse_1.BrowserFeatures.clipboard.readText) {
            (0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: "workbench.action.terminal.paste" /* TerminalCommandId.Paste */,
                        title: { value: (0, nls_1.localize)('workbench.action.terminal.paste', "Paste into Active Terminal"), original: 'Paste into Active Terminal' },
                        f1: true,
                        category,
                        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
                        keybinding: [{
                                primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */,
                                win: { primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 52 /* KeyCode.KeyV */] },
                                linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 52 /* KeyCode.KeyV */ },
                                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                                when: terminalContextKey_1.TerminalContextKeys.focus
                            }],
                    });
                }
                async run(accessor) {
                    var _a;
                    await ((_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.paste());
                }
            });
        }
        if (canIUse_1.BrowserFeatures.clipboard.readText && platform_1.isLinux) {
            (0, actions_2.registerAction2)(class extends actions_2.Action2 {
                constructor() {
                    super({
                        id: "workbench.action.terminal.pasteSelection" /* TerminalCommandId.PasteSelection */,
                        title: { value: (0, nls_1.localize)('workbench.action.terminal.pasteSelection', "Paste Selection into Active Terminal"), original: 'Paste Selection into Active Terminal' },
                        f1: true,
                        category,
                        precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated),
                        keybinding: [{
                                linux: { primary: 1024 /* KeyMod.Shift */ | 19 /* KeyCode.Insert */ },
                                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                                when: terminalContextKey_1.TerminalContextKeys.focus
                            }],
                    });
                }
                async run(accessor) {
                    var _a;
                    await ((_a = accessor.get(terminal_2.ITerminalService).activeInstance) === null || _a === void 0 ? void 0 : _a.pasteSelection());
                }
            });
        }
        const switchTerminalTitle = { value: (0, nls_1.localize)('workbench.action.terminal.switchTerminal', "Switch Terminal"), original: 'Switch Terminal' };
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.switchTerminal" /* TerminalCommandId.SwitchTerminal */,
                    title: switchTerminalTitle,
                    f1: false,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.terminalHasBeenCreated)
                });
            }
            async run(accessor, item) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const terminalProfileService = accessor.get(terminal_3.ITerminalProfileService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                if (!item || !item.split) {
                    return Promise.resolve(null);
                }
                if (item === exports.switchTerminalActionViewItemSeparator) {
                    terminalService.refreshActiveGroup();
                    return Promise.resolve(null);
                }
                if (item === exports.switchTerminalShowTabsTitle) {
                    accessor.get(configuration_1.IConfigurationService).updateValue("terminal.integrated.tabs.enabled" /* TerminalSettingId.TabsEnabled */, true);
                    return;
                }
                const indexMatches = terminalIndexRe.exec(item);
                if (indexMatches) {
                    terminalGroupService.setActiveGroupByIndex(Number(indexMatches[1]) - 1);
                    return terminalGroupService.showPanel(true);
                }
                const quickSelectProfiles = terminalProfileService.availableProfiles;
                // Remove 'New ' from the selected item to get the profile name
                const profileSelection = item.substring(4);
                if (quickSelectProfiles) {
                    const profile = quickSelectProfiles.find(profile => profile.profileName === profileSelection);
                    if (profile) {
                        const instance = await terminalService.createTerminal({
                            config: profile
                        });
                        terminalService.setActiveInstance(instance);
                    }
                    else {
                        console.warn(`No profile with name "${profileSelection}"`);
                    }
                }
                else {
                    console.warn(`Unmatched terminal item: "${item}"`);
                }
                return Promise.resolve();
            }
        });
    }
    exports.registerTerminalActions = registerTerminalActions;
    function getSelectedInstances(accessor) {
        var _a;
        const listService = accessor.get(listService_1.IListService);
        const terminalService = accessor.get(terminal_2.ITerminalService);
        if (!((_a = listService.lastFocusedList) === null || _a === void 0 ? void 0 : _a.getSelection())) {
            return undefined;
        }
        const selections = listService.lastFocusedList.getSelection();
        const focused = listService.lastFocusedList.getFocus();
        const instances = [];
        if (focused.length === 1 && !selections.includes(focused[0])) {
            // focused length is always a max of 1
            // if the focused one is not in the selected list, return that item
            instances.push(terminalService.getInstanceFromIndex(focused[0]));
            return instances;
        }
        // multi-select
        for (const selection of selections) {
            instances.push(terminalService.getInstanceFromIndex(selection));
        }
        return instances;
    }
    function focusNext(accessor) {
        var _a;
        const listService = accessor.get(listService_1.IListService);
        (_a = listService.lastFocusedList) === null || _a === void 0 ? void 0 : _a.focusNext();
    }
    function validateTerminalName(name) {
        if (!name || name.trim().length === 0) {
            return {
                content: (0, nls_1.localize)('emptyTerminalNameInfo', "Providing no name will reset it to the default value"),
                severity: notification_1.Severity.Info
            };
        }
        return null;
    }
    exports.validateTerminalName = validateTerminalName;
    function convertOptionsOrProfileToOptions(optionsOrProfile) {
        if (typeof optionsOrProfile === 'object' && 'profileName' in optionsOrProfile) {
            return { config: optionsOrProfile, location: optionsOrProfile.location };
        }
        return optionsOrProfile;
    }
    let newWithProfileAction;
    function refreshTerminalActions(detectedProfiles) {
        const profileEnum = (0, terminalProfiles_1.createProfileSchemaEnums)(detectedProfiles);
        const category = { value: terminal_3.TERMINAL_ACTION_CATEGORY, original: 'Terminal' };
        newWithProfileAction === null || newWithProfileAction === void 0 ? void 0 : newWithProfileAction.dispose();
        newWithProfileAction = (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id: "workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */,
                    title: { value: (0, nls_1.localize)('workbench.action.terminal.newWithProfile', "Create New Terminal (With Profile)"), original: 'Create New Terminal (With Profile)' },
                    f1: true,
                    category,
                    precondition: contextkey_1.ContextKeyExpr.or(terminalContextKey_1.TerminalContextKeys.processSupported, terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile),
                    description: {
                        description: 'workbench.action.terminal.newWithProfile',
                        args: [{
                                name: 'args',
                                schema: {
                                    type: 'object',
                                    required: ['profileName'],
                                    properties: {
                                        profileName: {
                                            description: (0, nls_1.localize)('workbench.action.terminal.newWithProfile.profileName', "The name of the profile to create"),
                                            type: 'string',
                                            enum: profileEnum.values,
                                            markdownEnumDescriptions: profileEnum.markdownDescriptions
                                        }
                                    }
                                }
                            }]
                    },
                });
            }
            async run(accessor, eventOrOptionsOrProfile, profile) {
                const terminalService = accessor.get(terminal_2.ITerminalService);
                const terminalProfileService = accessor.get(terminal_3.ITerminalProfileService);
                const terminalGroupService = accessor.get(terminal_2.ITerminalGroupService);
                const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
                const commandService = accessor.get(commands_1.ICommandService);
                let event;
                let options;
                let instance;
                let cwd;
                if (typeof eventOrOptionsOrProfile === 'object' && eventOrOptionsOrProfile && 'profileName' in eventOrOptionsOrProfile) {
                    const config = terminalProfileService.availableProfiles.find(profile => profile.profileName === eventOrOptionsOrProfile.profileName);
                    if (!config) {
                        throw new Error(`Could not find terminal profile "${eventOrOptionsOrProfile.profileName}"`);
                    }
                    options = { config };
                }
                else if (eventOrOptionsOrProfile instanceof MouseEvent || eventOrOptionsOrProfile instanceof PointerEvent || eventOrOptionsOrProfile instanceof KeyboardEvent) {
                    event = eventOrOptionsOrProfile;
                    options = profile ? { config: profile } : undefined;
                }
                else {
                    options = convertOptionsOrProfileToOptions(eventOrOptionsOrProfile);
                }
                // split terminal
                if (event && (event.altKey || event.ctrlKey)) {
                    const parentTerminal = terminalService.activeInstance;
                    if (parentTerminal) {
                        await terminalService.createTerminal({ location: { parentTerminal }, config: options === null || options === void 0 ? void 0 : options.config });
                        return;
                    }
                }
                const folders = workspaceContextService.getWorkspace().folders;
                if (folders.length > 1) {
                    // multi-root workspace, create root picker
                    const options = {
                        placeHolder: (0, nls_1.localize)('workbench.action.terminal.newWorkspacePlaceholder', "Select current working directory for new terminal")
                    };
                    const workspace = await commandService.executeCommand(workspaceCommands_1.PICK_WORKSPACE_FOLDER_COMMAND_ID, [options]);
                    if (!workspace) {
                        // Don't create the instance if the workspace picker was canceled
                        return;
                    }
                    cwd = workspace.uri;
                }
                if (options) {
                    options.cwd = cwd;
                    instance = await terminalService.createTerminal(options);
                }
                else {
                    instance = await terminalService.showProfileQuickPick('createInstance', cwd);
                }
                if (instance) {
                    terminalService.setActiveInstance(instance);
                    if (instance.target === terminal_1.TerminalLocation.Editor) {
                        await instance.focusWhenReady(true);
                    }
                    else {
                        await terminalGroupService.showPanel(true);
                    }
                }
            }
        });
    }
    exports.refreshTerminalActions = refreshTerminalActions;
    /** doc */
    function doWithInstance(accessor, resource) {
        const terminalService = accessor.get(terminal_2.ITerminalService);
        const castedResource = uri_1.URI.isUri(resource) ? resource : undefined;
        const instance = terminalService.getInstanceFromResource(castedResource) || terminalService.activeInstance;
        return instance;
    }
});
//# sourceMappingURL=terminalActions.js.map