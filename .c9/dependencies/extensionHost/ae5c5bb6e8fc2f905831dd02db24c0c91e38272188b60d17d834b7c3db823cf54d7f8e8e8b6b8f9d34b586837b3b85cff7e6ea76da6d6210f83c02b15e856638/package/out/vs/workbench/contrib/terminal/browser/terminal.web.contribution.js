/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/terminal/browser/terminalProfileResolverService", "vs/workbench/contrib/terminal/common/terminalContextKey"], function (require, exports, keybindingsRegistry_1, terminal_1, extensions_1, terminalProfileResolverService_1, terminalContextKey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, extensions_1.registerSingleton)(terminal_1.ITerminalProfileResolverService, terminalProfileResolverService_1.BrowserTerminalProfileResolverService, true);
    // Register standard external terminal keybinding as integrated terminal when in web as the
    // external terminal is not available
    keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
        id: "workbench.action.terminal.new" /* TerminalCommandId.New */,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: terminalContextKey_1.TerminalContextKeys.notFocus,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 33 /* KeyCode.KeyC */
    });
});
//# sourceMappingURL=terminal.web.contribution.js.map