/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.terminalStrings = exports.formatMessageForTerminal = void 0;
    /**
     * Formats a message from the product to be written to the terminal.
     */
    function formatMessageForTerminal(message, excludeLeadingNewLine = false) {
        // Wrap in bold and ensure it's on a new line
        return `${excludeLeadingNewLine ? '' : '\r\n'}\x1b[1m${message}\x1b[0m\n\r`;
    }
    exports.formatMessageForTerminal = formatMessageForTerminal;
    /**
     * An object holding strings shared by multiple parts of the terminal
     */
    exports.terminalStrings = {
        terminal: (0, nls_1.localize)('terminal', "Terminal"),
        doNotShowAgain: (0, nls_1.localize)('doNotShowAgain', 'Do Not Show Again'),
        currentSessionCategory: (0, nls_1.localize)('currentSessionCategory', 'current session'),
        previousSessionCategory: (0, nls_1.localize)('previousSessionCategory', 'previous session'),
        focus: {
            value: (0, nls_1.localize)('workbench.action.terminal.focus', "Focus Terminal"),
            original: 'Focus Terminal'
        },
        kill: {
            value: (0, nls_1.localize)('killTerminal', "Kill Terminal"),
            original: 'Kill Terminal',
            short: (0, nls_1.localize)('killTerminal.short', "Kill"),
        },
        moveToEditor: {
            value: (0, nls_1.localize)('moveToEditor', "Move Terminal into Editor Area"),
            original: 'Move Terminal into Editor Area',
        },
        moveToTerminalPanel: {
            value: (0, nls_1.localize)('workbench.action.terminal.moveToTerminalPanel', "Move Terminal into Panel"),
            original: 'Move Terminal into Panel'
        },
        changeIcon: {
            value: (0, nls_1.localize)('workbench.action.terminal.changeIcon', "Change Icon..."),
            original: 'Change Icon...'
        },
        changeColor: {
            value: (0, nls_1.localize)('workbench.action.terminal.changeColor', "Change Color..."),
            original: 'Change Color...'
        },
        split: {
            value: (0, nls_1.localize)('splitTerminal', "Split Terminal"),
            original: 'Split Terminal',
            short: (0, nls_1.localize)('splitTerminal.short', "Split"),
        },
        unsplit: {
            value: (0, nls_1.localize)('unsplitTerminal', "Unsplit Terminal"),
            original: 'Unsplit Terminal'
        },
        rename: {
            value: (0, nls_1.localize)('workbench.action.terminal.rename', "Rename..."),
            original: 'Rename...'
        },
        toggleSizeToContentWidth: {
            value: (0, nls_1.localize)('workbench.action.terminal.sizeToContentWidthInstance', "Toggle Size to Content Width"),
            original: 'Toggle Size to Content Width'
        }
    };
});
//# sourceMappingURL=terminalStrings.js.map