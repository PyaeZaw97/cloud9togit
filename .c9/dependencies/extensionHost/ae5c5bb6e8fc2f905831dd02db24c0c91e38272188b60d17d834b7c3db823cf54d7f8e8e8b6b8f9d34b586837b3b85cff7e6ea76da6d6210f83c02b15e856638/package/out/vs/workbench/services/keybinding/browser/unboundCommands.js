/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/commands/common/commands", "vs/base/common/arrays", "vs/editor/browser/editorExtensions", "vs/platform/actions/common/actions"], function (require, exports, commands_1, arrays_1, editorExtensions_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getAllUnboundCommands = void 0;
    function getAllUnboundCommands(boundCommands) {
        const unboundCommands = [];
        const seenMap = new Map();
        const addCommand = (id, includeCommandWithArgs) => {
            if (seenMap.has(id)) {
                return;
            }
            seenMap.set(id, true);
            if (id[0] === '_' || id.indexOf('vscode.') === 0) { // private command
                return;
            }
            if (boundCommands.get(id) === true) {
                return;
            }
            if (!includeCommandWithArgs) {
                const command = commands_1.CommandsRegistry.getCommand(id);
                if (command && typeof command.description === 'object'
                    && (0, arrays_1.isNonEmptyArray)(command.description.args)) { // command with args
                    return;
                }
            }
            unboundCommands.push(id);
        };
        // Add all commands from Command Palette
        for (const menuItem of actions_1.MenuRegistry.getMenuItems(actions_1.MenuId.CommandPalette)) {
            if ((0, actions_1.isIMenuItem)(menuItem)) {
                addCommand(menuItem.command.id, true);
            }
        }
        // Add all editor actions
        for (const editorAction of editorExtensions_1.EditorExtensionsRegistry.getEditorActions()) {
            addCommand(editorAction.id, true);
        }
        for (const id of commands_1.CommandsRegistry.getCommands().keys()) {
            addCommand(id, false);
        }
        return unboundCommands;
    }
    exports.getAllUnboundCommands = getAllUnboundCommands;
});
//# sourceMappingURL=unboundCommands.js.map