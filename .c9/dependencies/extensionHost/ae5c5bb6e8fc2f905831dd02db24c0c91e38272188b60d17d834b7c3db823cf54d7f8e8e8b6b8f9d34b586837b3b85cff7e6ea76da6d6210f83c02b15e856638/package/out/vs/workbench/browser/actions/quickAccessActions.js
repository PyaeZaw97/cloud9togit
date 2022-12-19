/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/quickinput/common/quickInput", "vs/platform/keybinding/common/keybinding", "vs/platform/commands/common/commands", "vs/workbench/browser/quickaccess"], function (require, exports, nls_1, actions_1, keybindingsRegistry_1, quickInput_1, keybinding_1, commands_1, quickaccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Quick access management commands and keys
    const globalQuickAccessKeybinding = {
        primary: 2048 /* KeyMod.CtrlCmd */ | 46 /* KeyCode.KeyP */,
        secondary: [2048 /* KeyMod.CtrlCmd */ | 35 /* KeyCode.KeyE */],
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 46 /* KeyCode.KeyP */, secondary: undefined }
    };
    const QUICKACCESS_ACTION_ID = 'workbench.action.quickOpen';
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: { id: QUICKACCESS_ACTION_ID, title: { value: (0, nls_1.localize)('quickOpen', "Go to File..."), original: 'Go to File...' } }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: QUICKACCESS_ACTION_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: undefined,
        primary: globalQuickAccessKeybinding.primary,
        secondary: globalQuickAccessKeybinding.secondary,
        mac: globalQuickAccessKeybinding.mac
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.closeQuickOpen',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: quickaccess_1.inQuickPickContext,
        primary: 9 /* KeyCode.Escape */, secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
        handler: accessor => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            return quickInputService.cancel();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.acceptSelectedQuickOpenItem',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: quickaccess_1.inQuickPickContext,
        primary: 0,
        handler: accessor => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            return quickInputService.accept();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.alternativeAcceptSelectedQuickOpenItem',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: quickaccess_1.inQuickPickContext,
        primary: 0,
        handler: accessor => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            return quickInputService.accept({ ctrlCmd: true, alt: false });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.focusQuickOpen',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: quickaccess_1.inQuickPickContext,
        primary: 0,
        handler: accessor => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.focus();
        }
    });
    const quickAccessNavigateNextInFilePickerId = 'workbench.action.quickOpenNavigateNextInFilePicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigateNextInFilePickerId,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigateNextInFilePickerId, true),
        when: quickaccess_1.defaultQuickAccessContext,
        primary: globalQuickAccessKeybinding.primary,
        secondary: globalQuickAccessKeybinding.secondary,
        mac: globalQuickAccessKeybinding.mac
    });
    const quickAccessNavigatePreviousInFilePickerId = 'workbench.action.quickOpenNavigatePreviousInFilePicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigatePreviousInFilePickerId,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigatePreviousInFilePickerId, false),
        when: quickaccess_1.defaultQuickAccessContext,
        primary: globalQuickAccessKeybinding.primary | 1024 /* KeyMod.Shift */,
        secondary: [globalQuickAccessKeybinding.secondary[0] | 1024 /* KeyMod.Shift */],
        mac: {
            primary: globalQuickAccessKeybinding.mac.primary | 1024 /* KeyMod.Shift */,
            secondary: undefined
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.quickPickManyToggle',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: quickaccess_1.inQuickPickContext,
        primary: 0,
        handler: accessor => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.toggle();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.quickInputBack',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        when: quickaccess_1.inQuickPickContext,
        primary: 0,
        win: { primary: 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */ },
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 83 /* KeyCode.Minus */ },
        linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 83 /* KeyCode.Minus */ },
        handler: accessor => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.back();
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: QUICKACCESS_ACTION_ID,
        handler: async function (accessor, prefix) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.quickAccess.show(typeof prefix === 'string' ? prefix : undefined, { preserveValue: typeof prefix === 'string' /* preserve as is if provided */ });
        },
        description: {
            description: `Quick access`,
            args: [{
                    name: 'prefix',
                    schema: {
                        'type': 'string'
                    }
                }]
        }
    });
    commands_1.CommandsRegistry.registerCommand('workbench.action.quickOpenPreviousEditor', async (accessor) => {
        const quickInputService = accessor.get(quickInput_1.IQuickInputService);
        quickInputService.quickAccess.show('', { itemActivation: quickInput_1.ItemActivation.SECOND });
    });
    //#endregion
    //#region Workbench actions
    class BaseQuickAccessNavigateAction extends actions_1.Action2 {
        constructor(id, title, next, quickNavigate, keybinding) {
            super({ id, title, f1: true, keybinding });
            this.id = id;
            this.next = next;
            this.quickNavigate = quickNavigate;
        }
        async run(accessor) {
            const keybindingService = accessor.get(keybinding_1.IKeybindingService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const keys = keybindingService.lookupKeybindings(this.id);
            const quickNavigate = this.quickNavigate ? { keybindings: keys } : undefined;
            quickInputService.navigate(this.next, quickNavigate);
        }
    }
    class QuickAccessNavigateNextAction extends BaseQuickAccessNavigateAction {
        constructor() {
            super('workbench.action.quickOpenNavigateNext', { value: (0, nls_1.localize)('quickNavigateNext', "Navigate Next in Quick Open"), original: 'Navigate Next in Quick Open' }, true, true);
        }
    }
    class QuickAccessNavigatePreviousAction extends BaseQuickAccessNavigateAction {
        constructor() {
            super('workbench.action.quickOpenNavigatePrevious', { value: (0, nls_1.localize)('quickNavigatePrevious', "Navigate Previous in Quick Open"), original: 'Navigate Previous in Quick Open' }, false, true);
        }
    }
    class QuickAccessSelectNextAction extends BaseQuickAccessNavigateAction {
        constructor() {
            super('workbench.action.quickOpenSelectNext', { value: (0, nls_1.localize)('quickSelectNext', "Select Next in Quick Open"), original: 'Select Next in Quick Open' }, true, false, {
                weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
                when: quickaccess_1.inQuickPickContext,
                primary: 0,
                mac: { primary: 256 /* KeyMod.WinCtrl */ | 44 /* KeyCode.KeyN */ }
            });
        }
    }
    class QuickAccessSelectPreviousAction extends BaseQuickAccessNavigateAction {
        constructor() {
            super('workbench.action.quickOpenSelectPrevious', { value: (0, nls_1.localize)('quickSelectPrevious', "Select Previous in Quick Open"), original: 'Select Previous in Quick Open' }, false, false, {
                weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
                when: quickaccess_1.inQuickPickContext,
                primary: 0,
                mac: { primary: 256 /* KeyMod.WinCtrl */ | 46 /* KeyCode.KeyP */ }
            });
        }
    }
    (0, actions_1.registerAction2)(QuickAccessSelectNextAction);
    (0, actions_1.registerAction2)(QuickAccessSelectPreviousAction);
    (0, actions_1.registerAction2)(QuickAccessNavigateNextAction);
    (0, actions_1.registerAction2)(QuickAccessNavigatePreviousAction);
});
//#endregion
//# sourceMappingURL=quickAccessActions.js.map