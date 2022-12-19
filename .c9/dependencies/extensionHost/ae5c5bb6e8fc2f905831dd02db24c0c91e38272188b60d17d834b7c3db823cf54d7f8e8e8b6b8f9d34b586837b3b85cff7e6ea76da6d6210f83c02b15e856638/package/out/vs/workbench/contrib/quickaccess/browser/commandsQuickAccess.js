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
define(["require", "exports", "vs/nls", "vs/platform/quickinput/browser/commandsQuickAccess", "vs/workbench/services/editor/common/editorService", "vs/platform/actions/common/actions", "vs/workbench/services/extensions/common/extensions", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/contrib/quickAccess/browser/commandsQuickAccess", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/commands/common/commands", "vs/platform/telemetry/common/telemetry", "vs/platform/dialogs/common/dialogs", "vs/platform/quickinput/common/quickAccess", "vs/platform/configuration/common/configuration", "vs/base/common/codicons", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/workbench/services/preferences/common/preferences", "vs/base/common/iconLabels", "vs/base/browser/browser"], function (require, exports, nls_1, commandsQuickAccess_1, editorService_1, actions_1, extensions_1, async_1, lifecycle_1, commandsQuickAccess_2, platform_1, instantiation_1, keybinding_1, commands_1, telemetry_1, dialogs_1, quickAccess_1, configuration_1, codicons_1, quickInput_1, storage_1, editorGroupsService_1, pickerQuickAccess_1, preferences_1, iconLabels_1, browser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ClearCommandHistoryAction = exports.ShowAllCommandsAction = exports.CommandsQuickAccessProvider = void 0;
    let CommandsQuickAccessProvider = class CommandsQuickAccessProvider extends commandsQuickAccess_2.AbstractEditorCommandsQuickAccessProvider {
        constructor(editorService, menuService, extensionService, instantiationService, keybindingService, commandService, telemetryService, dialogService, configurationService, editorGroupService, preferencesService) {
            super({
                showAlias: !platform_1.Language.isDefaultVariant(),
                noResultsPick: {
                    label: (0, nls_1.localize)('noCommandResults', "No matching commands"),
                    commandId: ''
                }
            }, instantiationService, keybindingService, commandService, telemetryService, dialogService);
            this.editorService = editorService;
            this.menuService = menuService;
            this.extensionService = extensionService;
            this.configurationService = configurationService;
            this.editorGroupService = editorGroupService;
            this.preferencesService = preferencesService;
            // If extensions are not yet registered, we wait for a little moment to give them
            // a chance to register so that the complete set of commands shows up as result
            // We do not want to delay functionality beyond that time though to keep the commands
            // functional.
            this.extensionRegistrationRace = Promise.race([
                (0, async_1.timeout)(800),
                this.extensionService.whenInstalledExtensionsRegistered()
            ]);
        }
        get activeTextEditorControl() { return this.editorService.activeTextEditorControl; }
        get defaultFilterValue() {
            if (this.configuration.preserveInput) {
                return quickAccess_1.DefaultQuickAccessFilterValue.LAST;
            }
            return undefined;
        }
        get configuration() {
            const commandPaletteConfig = this.configurationService.getValue().workbench.commandPalette;
            return {
                preserveInput: commandPaletteConfig.preserveInput
            };
        }
        async getCommandPicks(disposables, token) {
            // wait for extensions registration or 800ms once
            await this.extensionRegistrationRace;
            if (token.isCancellationRequested) {
                return [];
            }
            return [
                ...this.getCodeEditorCommandPicks(),
                ...this.getGlobalCommandPicks(disposables)
            ].map(c => (Object.assign(Object.assign({}, c), { buttons: [{
                        iconClass: codicons_1.Codicon.gear.classNames,
                        tooltip: (0, nls_1.localize)('configure keybinding', "Configure Keybinding"),
                    }], trigger: () => {
                    this.preferencesService.openGlobalKeybindingSettings(false, { query: `@command:${c.commandId}` });
                    return pickerQuickAccess_1.TriggerAction.CLOSE_PICKER;
                } })));
        }
        getGlobalCommandPicks(disposables) {
            var _a, _b;
            const globalCommandPicks = [];
            const scopedContextKeyService = ((_a = this.editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.scopedContextKeyService) || this.editorGroupService.activeGroup.scopedContextKeyService;
            const globalCommandsMenu = this.menuService.createMenu(actions_1.MenuId.CommandPalette, scopedContextKeyService);
            const globalCommandsMenuActions = globalCommandsMenu.getActions()
                .reduce((r, [, actions]) => [...r, ...actions], [])
                .filter(action => action instanceof actions_1.MenuItemAction && action.enabled);
            for (const action of globalCommandsMenuActions) {
                // Label
                let label = (typeof action.item.title === 'string' ? action.item.title : action.item.title.value) || action.item.id;
                // Category
                const category = typeof action.item.category === 'string' ? action.item.category : (_b = action.item.category) === null || _b === void 0 ? void 0 : _b.value;
                if (category) {
                    label = (0, nls_1.localize)('commandWithCategory', "{0}: {1}", category, label);
                }
                // Alias
                const aliasLabel = typeof action.item.title !== 'string' ? action.item.title.original : undefined;
                const aliasCategory = (category && action.item.category && typeof action.item.category !== 'string') ? action.item.category.original : undefined;
                const commandAlias = (aliasLabel && category) ?
                    aliasCategory ? `${aliasCategory}: ${aliasLabel}` : `${category}: ${aliasLabel}` :
                    aliasLabel;
                globalCommandPicks.push({
                    commandId: action.item.id,
                    commandAlias,
                    label: (0, iconLabels_1.stripIcons)(label)
                });
            }
            // Cleanup
            globalCommandsMenu.dispose();
            disposables.add((0, lifecycle_1.toDisposable)(() => (0, lifecycle_1.dispose)(globalCommandsMenuActions)));
            return globalCommandPicks;
        }
    };
    CommandsQuickAccessProvider = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, actions_1.IMenuService),
        __param(2, extensions_1.IExtensionService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, keybinding_1.IKeybindingService),
        __param(5, commands_1.ICommandService),
        __param(6, telemetry_1.ITelemetryService),
        __param(7, dialogs_1.IDialogService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, editorGroupsService_1.IEditorGroupsService),
        __param(10, preferences_1.IPreferencesService)
    ], CommandsQuickAccessProvider);
    exports.CommandsQuickAccessProvider = CommandsQuickAccessProvider;
    //#region Actions
    class ShowAllCommandsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ShowAllCommandsAction.ID,
                title: { value: (0, nls_1.localize)('showTriggerActions', "Show All Commands"), original: 'Show All Commands' },
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: undefined,
                    primary: !browser_1.isFirefox ? (2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 46 /* KeyCode.KeyP */) : undefined,
                    secondary: [59 /* KeyCode.F1 */]
                }
            });
        }
        async run(accessor) {
            accessor.get(quickInput_1.IQuickInputService).quickAccess.show(CommandsQuickAccessProvider.PREFIX);
        }
    }
    exports.ShowAllCommandsAction = ShowAllCommandsAction;
    ShowAllCommandsAction.ID = 'workbench.action.showCommands';
    class ClearCommandHistoryAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.clearCommandHistory',
                title: { value: (0, nls_1.localize)('clearCommandHistory', "Clear Command History"), original: 'Clear Command History' },
                f1: true
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const storageService = accessor.get(storage_1.IStorageService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const commandHistoryLength = commandsQuickAccess_1.CommandsHistory.getConfiguredCommandHistoryLength(configurationService);
            if (commandHistoryLength > 0) {
                // Ask for confirmation
                const { confirmed } = await dialogService.confirm({
                    message: (0, nls_1.localize)('confirmClearMessage', "Do you want to clear the history of recently used commands?"),
                    detail: (0, nls_1.localize)('confirmClearDetail', "This action is irreversible!"),
                    primaryButton: (0, nls_1.localize)({ key: 'clearButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Clear"),
                    type: 'warning'
                });
                if (!confirmed) {
                    return;
                }
                commandsQuickAccess_1.CommandsHistory.clearHistory(configurationService, storageService);
            }
        }
    }
    exports.ClearCommandHistoryAction = ClearCommandHistoryAction;
});
//#endregion
//# sourceMappingURL=commandsQuickAccess.js.map