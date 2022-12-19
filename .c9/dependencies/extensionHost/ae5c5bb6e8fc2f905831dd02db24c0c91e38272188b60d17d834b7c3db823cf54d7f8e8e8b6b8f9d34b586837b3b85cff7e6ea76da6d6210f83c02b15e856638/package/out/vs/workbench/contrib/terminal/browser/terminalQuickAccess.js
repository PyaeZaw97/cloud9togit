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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/base/common/filters", "vs/workbench/contrib/terminal/browser/terminal", "vs/platform/commands/common/commands", "vs/platform/theme/common/themeService", "vs/workbench/contrib/terminal/browser/terminalIcons", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/platform/terminal/common/terminal", "vs/workbench/services/editor/common/editorService"], function (require, exports, nls_1, pickerQuickAccess_1, filters_1, terminal_1, commands_1, themeService_1, terminalIcons_1, terminalIcon_1, terminalStrings_1, terminal_2, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalQuickAccessProvider = void 0;
    let terminalPicks = [];
    let TerminalQuickAccessProvider = class TerminalQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(_editorService, _terminalEditorService, _terminalGroupService, _commandService, _themeService) {
            super(TerminalQuickAccessProvider.PREFIX, { canAcceptInBackground: true });
            this._editorService = _editorService;
            this._terminalEditorService = _terminalEditorService;
            this._terminalGroupService = _terminalGroupService;
            this._commandService = _commandService;
            this._themeService = _themeService;
        }
        _getPicks(filter) {
            terminalPicks = [];
            terminalPicks.push({ type: 'separator', label: 'panel' });
            const terminalGroups = this._terminalGroupService.groups;
            for (let groupIndex = 0; groupIndex < terminalGroups.length; groupIndex++) {
                const terminalGroup = terminalGroups[groupIndex];
                for (let terminalIndex = 0; terminalIndex < terminalGroup.terminalInstances.length; terminalIndex++) {
                    const terminal = terminalGroup.terminalInstances[terminalIndex];
                    const pick = this._createPick(terminal, terminalIndex, filter, groupIndex);
                    if (pick) {
                        terminalPicks.push(pick);
                    }
                }
            }
            if (terminalPicks.length > 0) {
                terminalPicks.push({ type: 'separator', label: 'editor' });
            }
            const terminalEditors = this._terminalEditorService.instances;
            for (let editorIndex = 0; editorIndex < terminalEditors.length; editorIndex++) {
                const term = terminalEditors[editorIndex];
                term.target = terminal_2.TerminalLocation.Editor;
                const pick = this._createPick(term, editorIndex, filter);
                if (pick) {
                    terminalPicks.push(pick);
                }
            }
            if (terminalPicks.length > 0) {
                terminalPicks.push({ type: 'separator' });
            }
            const createTerminalLabel = (0, nls_1.localize)("workbench.action.terminal.newplus", "Create New Terminal");
            terminalPicks.push({
                label: `$(plus) ${createTerminalLabel}`,
                ariaLabel: createTerminalLabel,
                accept: () => this._commandService.executeCommand("workbench.action.terminal.new" /* TerminalCommandId.New */)
            });
            const createWithProfileLabel = (0, nls_1.localize)("workbench.action.terminal.newWithProfilePlus", "Create New Terminal With Profile");
            terminalPicks.push({
                label: `$(plus) ${createWithProfileLabel}`,
                ariaLabel: createWithProfileLabel,
                accept: () => this._commandService.executeCommand("workbench.action.terminal.newWithProfile" /* TerminalCommandId.NewWithProfile */)
            });
            return terminalPicks;
        }
        _createPick(terminal, terminalIndex, filter, groupIndex) {
            const iconId = (0, terminalIcon_1.getIconId)(terminal);
            const label = groupIndex ? `$(${iconId}) ${groupIndex + 1}.${terminalIndex + 1}: ${terminal.title}` : `$(${iconId}) ${terminalIndex + 1}: ${terminal.title}`;
            const iconClasses = [];
            const colorClass = (0, terminalIcon_1.getColorClass)(terminal);
            if (colorClass) {
                iconClasses.push(colorClass);
            }
            const uriClasses = (0, terminalIcon_1.getUriClasses)(terminal, this._themeService.getColorTheme().type);
            if (uriClasses) {
                iconClasses.push(...uriClasses);
            }
            const highlights = (0, filters_1.matchesFuzzy)(filter, label, true);
            if (highlights) {
                return {
                    label,
                    description: terminal.description,
                    highlights: { label: highlights },
                    buttons: [
                        {
                            iconClass: themeService_1.ThemeIcon.asClassName(terminalIcons_1.renameTerminalIcon),
                            tooltip: (0, nls_1.localize)('renameTerminal', "Rename Terminal")
                        },
                        {
                            iconClass: themeService_1.ThemeIcon.asClassName(terminalIcons_1.killTerminalIcon),
                            tooltip: terminalStrings_1.terminalStrings.kill.value
                        }
                    ],
                    iconClasses,
                    trigger: buttonIndex => {
                        switch (buttonIndex) {
                            case 0:
                                this._commandService.executeCommand("workbench.action.terminal.rename" /* TerminalCommandId.Rename */, terminal);
                                return pickerQuickAccess_1.TriggerAction.NO_ACTION;
                            case 1:
                                terminal.dispose(true);
                                return pickerQuickAccess_1.TriggerAction.REMOVE_ITEM;
                        }
                        return pickerQuickAccess_1.TriggerAction.NO_ACTION;
                    },
                    accept: (keyMod, event) => {
                        if (terminal.target === terminal_2.TerminalLocation.Editor) {
                            const existingEditors = this._editorService.findEditors(terminal.resource);
                            this._terminalEditorService.openEditor(terminal, { viewColumn: existingEditors === null || existingEditors === void 0 ? void 0 : existingEditors[0].groupId });
                            this._terminalEditorService.setActiveInstance(terminal);
                        }
                        else {
                            this._terminalGroupService.showPanel(!event.inBackground);
                            this._terminalGroupService.setActiveInstance(terminal);
                        }
                    }
                };
            }
            return undefined;
        }
    };
    TerminalQuickAccessProvider.PREFIX = 'term ';
    TerminalQuickAccessProvider = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, terminal_1.ITerminalEditorService),
        __param(2, terminal_1.ITerminalGroupService),
        __param(3, commands_1.ICommandService),
        __param(4, themeService_1.IThemeService)
    ], TerminalQuickAccessProvider);
    exports.TerminalQuickAccessProvider = TerminalQuickAccessProvider;
});
//# sourceMappingURL=terminalQuickAccess.js.map