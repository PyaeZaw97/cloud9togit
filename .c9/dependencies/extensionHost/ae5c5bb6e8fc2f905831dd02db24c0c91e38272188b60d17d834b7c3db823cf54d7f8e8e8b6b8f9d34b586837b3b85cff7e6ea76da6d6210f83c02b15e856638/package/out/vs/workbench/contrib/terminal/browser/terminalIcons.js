/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/theme/common/iconRegistry"], function (require, exports, codicons_1, nls_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.configureTerminalProfileIcon = exports.newTerminalIcon = exports.killTerminalIcon = exports.renameTerminalIcon = exports.terminalViewIcon = void 0;
    exports.terminalViewIcon = (0, iconRegistry_1.registerIcon)('terminal-view-icon', codicons_1.Codicon.terminal, (0, nls_1.localize)('terminalViewIcon', 'View icon of the terminal view.'));
    exports.renameTerminalIcon = (0, iconRegistry_1.registerIcon)('terminal-rename', codicons_1.Codicon.gear, (0, nls_1.localize)('renameTerminalIcon', 'Icon for rename in the terminal quick menu.'));
    exports.killTerminalIcon = (0, iconRegistry_1.registerIcon)('terminal-kill', codicons_1.Codicon.trash, (0, nls_1.localize)('killTerminalIcon', 'Icon for killing a terminal instance.'));
    exports.newTerminalIcon = (0, iconRegistry_1.registerIcon)('terminal-new', codicons_1.Codicon.add, (0, nls_1.localize)('newTerminalIcon', 'Icon for creating a new terminal instance.'));
    exports.configureTerminalProfileIcon = (0, iconRegistry_1.registerIcon)('terminal-configure-profile', codicons_1.Codicon.gear, (0, nls_1.localize)('configureTerminalProfileIcon', 'Icon for creating a new terminal profile.'));
});
//# sourceMappingURL=terminalIcons.js.map