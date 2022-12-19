/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/registry/common/platform", "vs/workbench/browser/quickaccess", "vs/workbench/common/views", "vs/workbench/browser/dnd", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/browser/terminalView", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/workbench/contrib/terminal/browser/terminalCommands", "vs/workbench/contrib/terminal/browser/terminalService", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/terminal/browser/terminal", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/quickinput/common/quickAccess", "vs/workbench/contrib/terminal/browser/terminalQuickAccess", "vs/workbench/contrib/terminal/common/terminalConfiguration", "vs/platform/accessibility/common/accessibility", "vs/workbench/contrib/terminal/browser/terminalIcons", "vs/base/common/platform", "vs/workbench/contrib/terminal/browser/terminalMenus", "vs/workbench/contrib/terminal/browser/terminalInstanceService", "vs/platform/terminal/common/terminalPlatformConfiguration", "vs/workbench/common/editor", "vs/workbench/browser/editor", "vs/workbench/contrib/terminal/browser/terminalEditor", "vs/workbench/contrib/terminal/browser/terminalEditorInput", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/workbench/contrib/terminal/browser/terminalEditorService", "vs/workbench/contrib/terminal/browser/terminalEditorSerializer", "vs/workbench/contrib/terminal/browser/terminalGroupService", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/browser/terminalProfileService", "vs/workbench/common/contributions", "vs/workbench/contrib/terminal/browser/remoteTerminalBackend", "vs/workbench/contrib/terminal/browser/terminalMainContribution", "vs/base/common/network", "vs/css!./media/scrollbar", "vs/css!./media/terminal", "vs/css!./media/widgets", "vs/css!./media/xterm"], function (require, exports, nls, uri_1, commands_1, contextkey_1, keybindingsRegistry_1, platform_1, quickaccess_1, views_1, dnd_1, terminalActions_1, terminalView_1, terminal_1, terminalColorRegistry_1, terminalCommands_1, terminalService_1, extensions_1, terminal_2, descriptors_1, viewPaneContainer_1, quickAccess_1, terminalQuickAccess_1, terminalConfiguration_1, accessibility_1, terminalIcons_1, platform_2, terminalMenus_1, terminalInstanceService_1, terminalPlatformConfiguration_1, editor_1, editor_2, terminalEditor_1, terminalEditorInput_1, terminalStrings_1, terminalEditorService_1, terminalEditorSerializer_1, terminalGroupService_1, terminalContextKey_1, terminalProfileService_1, contributions_1, remoteTerminalBackend_1, terminalMainContribution_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register services
    (0, extensions_1.registerSingleton)(terminal_2.ITerminalService, terminalService_1.TerminalService, true);
    (0, extensions_1.registerSingleton)(terminal_2.ITerminalEditorService, terminalEditorService_1.TerminalEditorService, true);
    (0, extensions_1.registerSingleton)(terminal_2.ITerminalGroupService, terminalGroupService_1.TerminalGroupService, true);
    (0, extensions_1.registerSingleton)(terminal_2.ITerminalInstanceService, terminalInstanceService_1.TerminalInstanceService, true);
    (0, extensions_1.registerSingleton)(terminal_1.ITerminalProfileService, terminalProfileService_1.TerminalProfileService, true);
    // Register quick accesses
    const quickAccessRegistry = (platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess));
    const inTerminalsPicker = 'inTerminalPicker';
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: terminalQuickAccess_1.TerminalQuickAccessProvider,
        prefix: terminalQuickAccess_1.TerminalQuickAccessProvider.PREFIX,
        contextKey: inTerminalsPicker,
        placeholder: nls.localize('tasksQuickAccessPlaceholder', "Type the name of a terminal to open."),
        helpEntries: [{ description: nls.localize('tasksQuickAccessHelp', "Show All Opened Terminals"), needsEditor: false }]
    });
    const quickAccessNavigateNextInTerminalPickerId = 'workbench.action.quickOpenNavigateNextInTerminalPicker';
    commands_1.CommandsRegistry.registerCommand({ id: quickAccessNavigateNextInTerminalPickerId, handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigateNextInTerminalPickerId, true) });
    const quickAccessNavigatePreviousInTerminalPickerId = 'workbench.action.quickOpenNavigatePreviousInTerminalPicker';
    commands_1.CommandsRegistry.registerCommand({ id: quickAccessNavigatePreviousInTerminalPickerId, handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigatePreviousInTerminalPickerId, false) });
    // Register workbench contributions
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(terminalMainContribution_1.TerminalMainContribution, 1 /* LifecyclePhase.Starting */);
    workbenchRegistry.registerWorkbenchContribution(remoteTerminalBackend_1.RemoteTerminalBackendContribution, 1 /* LifecyclePhase.Starting */);
    // Register configurations
    (0, terminalPlatformConfiguration_1.registerTerminalPlatformConfiguration)();
    (0, terminalConfiguration_1.registerTerminalConfiguration)();
    // Register editor/dnd contributions
    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer(terminalEditorInput_1.TerminalEditorInput.ID, terminalEditorSerializer_1.TerminalInputSerializer);
    platform_1.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_2.EditorPaneDescriptor.create(terminalEditor_1.TerminalEditor, terminal_2.terminalEditorId, terminalStrings_1.terminalStrings.terminal), [
        new descriptors_1.SyncDescriptor(terminalEditorInput_1.TerminalEditorInput)
    ]);
    platform_1.Registry.as(dnd_1.Extensions.DragAndDropContribution).register({
        dataFormatKey: "Terminals" /* TerminalDataTransfers.Terminals */,
        getEditorInputs(data) {
            const editors = [];
            try {
                const terminalEditors = JSON.parse(data);
                for (const terminalEditor of terminalEditors) {
                    editors.push({ resource: uri_1.URI.parse(terminalEditor) });
                }
            }
            catch (error) {
                // Invalid transfer
            }
            return editors;
        },
        setData(resources, event) {
            var _a;
            const terminalResources = resources.filter(({ resource }) => resource.scheme === network_1.Schemas.vscodeTerminal);
            if (terminalResources.length) {
                (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData("Terminals" /* TerminalDataTransfers.Terminals */, JSON.stringify(terminalResources.map(({ resource }) => resource.toString())));
            }
        }
    });
    // Register views
    const VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: terminal_1.TERMINAL_VIEW_ID,
        title: nls.localize('terminal', "Terminal"),
        icon: terminalIcons_1.terminalViewIcon,
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [terminal_1.TERMINAL_VIEW_ID, { mergeViewWithContainerWhenSingleView: true, donotShowContainerTitleWhenMergedWithContainer: true }]),
        storageId: terminal_1.TERMINAL_VIEW_ID,
        hideIfEmpty: true,
        order: 3,
    }, 1 /* ViewContainerLocation.Panel */, { donotRegisterOpenCommand: true, isDefault: true });
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
            id: terminal_1.TERMINAL_VIEW_ID,
            name: nls.localize('terminal', "Terminal"),
            containerIcon: terminalIcons_1.terminalViewIcon,
            canToggleVisibility: false,
            canMoveView: true,
            ctorDescriptor: new descriptors_1.SyncDescriptor(terminalView_1.TerminalViewPane),
            openCommandActionDescriptor: {
                id: "workbench.action.terminal.toggleTerminal" /* TerminalCommandId.Toggle */,
                mnemonicTitle: nls.localize({ key: 'miToggleIntegratedTerminal', comment: ['&& denotes a mnemonic'] }, "&&Terminal"),
                keybindings: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 86 /* KeyCode.Backquote */,
                    mac: { primary: 256 /* KeyMod.WinCtrl */ | 86 /* KeyCode.Backquote */ }
                },
                order: 3
            }
        }], VIEW_CONTAINER);
    // Register actions
    (0, terminalActions_1.registerTerminalActions)();
    function registerSendSequenceKeybinding(text, rule) {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: "workbench.action.terminal.sendSequence" /* TerminalCommandId.SendSequence */,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: rule.when || terminalContextKey_1.TerminalContextKeys.focus,
            primary: rule.primary,
            mac: rule.mac,
            linux: rule.linux,
            win: rule.win,
            handler: terminalActions_1.terminalSendSequenceCommand,
            args: { text }
        });
    }
    // The text representation of `^<letter>` is `'A'.charCodeAt(0) + 1`.
    const CTRL_LETTER_OFFSET = 64;
    // An extra Windows-only ctrl+v keybinding is used for pwsh that sends ctrl+v directly to the
    // shell, this gets handled by PSReadLine which properly handles multi-line pastes. This is
    // disabled in accessibility mode as PowerShell does not run PSReadLine when it detects a screen
    // reader. This works even when clipboard.readText is not supported.
    if (platform_2.isWindows) {
        registerSendSequenceKeybinding(String.fromCharCode('V'.charCodeAt(0) - CTRL_LETTER_OFFSET), {
            when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.equals("terminalShellType" /* TerminalContextKeyStrings.ShellType */, "pwsh" /* WindowsShellType.PowerShell */), accessibility_1.CONTEXT_ACCESSIBILITY_MODE_ENABLED.negate()),
            primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */
        });
    }
    // send ctrl+c to the iPad when the terminal is focused and ctrl+c is pressed to kill the process (work around for #114009)
    if (platform_2.isIOS) {
        registerSendSequenceKeybinding(String.fromCharCode('C'.charCodeAt(0) - CTRL_LETTER_OFFSET), {
            when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus),
            primary: 256 /* KeyMod.WinCtrl */ | 33 /* KeyCode.KeyC */
        });
    }
    // Delete word left: ctrl+w
    registerSendSequenceKeybinding(String.fromCharCode('W'.charCodeAt(0) - CTRL_LETTER_OFFSET), {
        primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
        mac: { primary: 512 /* KeyMod.Alt */ | 1 /* KeyCode.Backspace */ }
    });
    if (platform_2.isWindows) {
        // Delete word left: ctrl+h
        // Windows cmd.exe requires ^H to delete full word left
        registerSendSequenceKeybinding(String.fromCharCode('H'.charCodeAt(0) - CTRL_LETTER_OFFSET), {
            when: contextkey_1.ContextKeyExpr.and(terminalContextKey_1.TerminalContextKeys.focus, contextkey_1.ContextKeyExpr.equals("terminalShellType" /* TerminalContextKeyStrings.ShellType */, "cmd" /* WindowsShellType.CommandPrompt */)),
            primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
        });
    }
    // Delete word right: alt+d [27, 100]
    registerSendSequenceKeybinding('\u001bd', {
        primary: 2048 /* KeyMod.CtrlCmd */ | 20 /* KeyCode.Delete */,
        mac: { primary: 512 /* KeyMod.Alt */ | 20 /* KeyCode.Delete */ }
    });
    // Delete to line start: ctrl+u
    registerSendSequenceKeybinding('\u0015', {
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */ }
    });
    // Move to line start: ctrl+A
    registerSendSequenceKeybinding(String.fromCharCode('A'.charCodeAt(0) - 64), {
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */ }
    });
    // Move to line end: ctrl+E
    registerSendSequenceKeybinding(String.fromCharCode('E'.charCodeAt(0) - 64), {
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */ }
    });
    // Break: ctrl+C
    registerSendSequenceKeybinding(String.fromCharCode('C'.charCodeAt(0) - 64), {
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 84 /* KeyCode.Period */ }
    });
    // NUL: ctrl+shift+2
    registerSendSequenceKeybinding('\u0000', {
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 23 /* KeyCode.Digit2 */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 23 /* KeyCode.Digit2 */ }
    });
    // RS: ctrl+shift+6
    registerSendSequenceKeybinding('\u001e', {
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 27 /* KeyCode.Digit6 */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 27 /* KeyCode.Digit6 */ }
    });
    // US (Undo): ctrl+/
    registerSendSequenceKeybinding('\u001f', {
        primary: 2048 /* KeyMod.CtrlCmd */ | 85 /* KeyCode.Slash */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 85 /* KeyCode.Slash */ }
    });
    (0, terminalCommands_1.setupTerminalCommands)();
    (0, terminalMenus_1.setupTerminalMenus)();
    (0, terminalColorRegistry_1.registerColors)();
});
//# sourceMappingURL=terminal.contribution.js.map