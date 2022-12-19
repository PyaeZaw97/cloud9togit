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
define(["require", "exports", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/severity", "vs/base/common/types", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/quickinput/browser/pickerQuickAccess", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry"], function (require, exports, errorMessage_1, errors_1, filters_1, lifecycle_1, map_1, severity_1, types_1, nls_1, commands_1, configuration_1, dialogs_1, instantiation_1, keybinding_1, pickerQuickAccess_1, storage_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandsHistory = exports.AbstractCommandsQuickAccessProvider = void 0;
    let AbstractCommandsQuickAccessProvider = class AbstractCommandsQuickAccessProvider extends pickerQuickAccess_1.PickerQuickAccessProvider {
        constructor(options, instantiationService, keybindingService, commandService, telemetryService, dialogService) {
            super(AbstractCommandsQuickAccessProvider.PREFIX, options);
            this.instantiationService = instantiationService;
            this.keybindingService = keybindingService;
            this.commandService = commandService;
            this.telemetryService = telemetryService;
            this.dialogService = dialogService;
            this.commandsHistory = this._register(this.instantiationService.createInstance(CommandsHistory));
            this.options = options;
        }
        async _getPicks(filter, disposables, token) {
            // Ask subclass for all command picks
            const allCommandPicks = await this.getCommandPicks(disposables, token);
            if (token.isCancellationRequested) {
                return [];
            }
            // Filter
            const filteredCommandPicks = [];
            for (const commandPick of allCommandPicks) {
                const labelHighlights = (0, types_1.withNullAsUndefined)(AbstractCommandsQuickAccessProvider.WORD_FILTER(filter, commandPick.label));
                const aliasHighlights = commandPick.commandAlias ? (0, types_1.withNullAsUndefined)(AbstractCommandsQuickAccessProvider.WORD_FILTER(filter, commandPick.commandAlias)) : undefined;
                // Add if matching in label or alias
                if (labelHighlights || aliasHighlights) {
                    commandPick.highlights = {
                        label: labelHighlights,
                        detail: this.options.showAlias ? aliasHighlights : undefined
                    };
                    filteredCommandPicks.push(commandPick);
                }
                // Also add if we have a 100% command ID match
                else if (filter === commandPick.commandId) {
                    filteredCommandPicks.push(commandPick);
                }
            }
            // Add description to commands that have duplicate labels
            const mapLabelToCommand = new Map();
            for (const commandPick of filteredCommandPicks) {
                const existingCommandForLabel = mapLabelToCommand.get(commandPick.label);
                if (existingCommandForLabel) {
                    commandPick.description = commandPick.commandId;
                    existingCommandForLabel.description = existingCommandForLabel.commandId;
                }
                else {
                    mapLabelToCommand.set(commandPick.label, commandPick);
                }
            }
            // Sort by MRU order and fallback to name otherwise
            filteredCommandPicks.sort((commandPickA, commandPickB) => {
                const commandACounter = this.commandsHistory.peek(commandPickA.commandId);
                const commandBCounter = this.commandsHistory.peek(commandPickB.commandId);
                if (commandACounter && commandBCounter) {
                    return commandACounter > commandBCounter ? -1 : 1; // use more recently used command before older
                }
                if (commandACounter) {
                    return -1; // first command was used, so it wins over the non used one
                }
                if (commandBCounter) {
                    return 1; // other command was used so it wins over the command
                }
                // both commands were never used, so we sort by name
                return commandPickA.label.localeCompare(commandPickB.label);
            });
            const commandPicks = [];
            let addSeparator = false;
            for (let i = 0; i < filteredCommandPicks.length; i++) {
                const commandPick = filteredCommandPicks[i];
                const keybinding = this.keybindingService.lookupKeybinding(commandPick.commandId);
                const ariaLabel = keybinding ?
                    (0, nls_1.localize)('commandPickAriaLabelWithKeybinding', "{0}, {1}", commandPick.label, keybinding.getAriaLabel()) :
                    commandPick.label;
                // Separator: recently used
                if (i === 0 && this.commandsHistory.peek(commandPick.commandId)) {
                    commandPicks.push({ type: 'separator', label: (0, nls_1.localize)('recentlyUsed', "recently used") });
                    addSeparator = true;
                }
                // Separator: other commands
                if (i !== 0 && addSeparator && !this.commandsHistory.peek(commandPick.commandId)) {
                    commandPicks.push({ type: 'separator', label: (0, nls_1.localize)('morecCommands', "other commands") });
                    addSeparator = false; // only once
                }
                // Command
                commandPicks.push(Object.assign(Object.assign({}, commandPick), { ariaLabel, detail: this.options.showAlias && commandPick.commandAlias !== commandPick.label ? commandPick.commandAlias : undefined, keybinding, accept: async () => {
                        // Add to history
                        this.commandsHistory.push(commandPick.commandId);
                        // Telementry
                        this.telemetryService.publicLog2('workbenchActionExecuted', {
                            id: commandPick.commandId,
                            from: 'quick open'
                        });
                        // Run
                        try {
                            await this.commandService.executeCommand(commandPick.commandId);
                        }
                        catch (error) {
                            if (!(0, errors_1.isCancellationError)(error)) {
                                this.dialogService.show(severity_1.default.Error, (0, nls_1.localize)('canNotRun', "Command '{0}' resulted in an error ({1})", commandPick.label, (0, errorMessage_1.toErrorMessage)(error)));
                            }
                        }
                    } }));
            }
            return commandPicks;
        }
    };
    AbstractCommandsQuickAccessProvider.PREFIX = '>';
    AbstractCommandsQuickAccessProvider.WORD_FILTER = (0, filters_1.or)(filters_1.matchesPrefix, filters_1.matchesWords, filters_1.matchesContiguousSubString);
    AbstractCommandsQuickAccessProvider = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, commands_1.ICommandService),
        __param(4, telemetry_1.ITelemetryService),
        __param(5, dialogs_1.IDialogService)
    ], AbstractCommandsQuickAccessProvider);
    exports.AbstractCommandsQuickAccessProvider = AbstractCommandsQuickAccessProvider;
    let CommandsHistory = class CommandsHistory extends lifecycle_1.Disposable {
        constructor(storageService, configurationService) {
            super();
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.configuredCommandsHistoryLength = 0;
            this.updateConfiguration();
            this.load();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(() => this.updateConfiguration()));
        }
        updateConfiguration() {
            this.configuredCommandsHistoryLength = CommandsHistory.getConfiguredCommandHistoryLength(this.configurationService);
            if (CommandsHistory.cache && CommandsHistory.cache.limit !== this.configuredCommandsHistoryLength) {
                CommandsHistory.cache.limit = this.configuredCommandsHistoryLength;
                CommandsHistory.saveState(this.storageService);
            }
        }
        load() {
            const raw = this.storageService.get(CommandsHistory.PREF_KEY_CACHE, 0 /* StorageScope.GLOBAL */);
            let serializedCache;
            if (raw) {
                try {
                    serializedCache = JSON.parse(raw);
                }
                catch (error) {
                    // invalid data
                }
            }
            const cache = CommandsHistory.cache = new map_1.LRUCache(this.configuredCommandsHistoryLength, 1);
            if (serializedCache) {
                let entries;
                if (serializedCache.usesLRU) {
                    entries = serializedCache.entries;
                }
                else {
                    entries = serializedCache.entries.sort((a, b) => a.value - b.value);
                }
                entries.forEach(entry => cache.set(entry.key, entry.value));
            }
            CommandsHistory.counter = this.storageService.getNumber(CommandsHistory.PREF_KEY_COUNTER, 0 /* StorageScope.GLOBAL */, CommandsHistory.counter);
        }
        push(commandId) {
            if (!CommandsHistory.cache) {
                return;
            }
            CommandsHistory.cache.set(commandId, CommandsHistory.counter++); // set counter to command
            CommandsHistory.saveState(this.storageService);
        }
        peek(commandId) {
            var _a;
            return (_a = CommandsHistory.cache) === null || _a === void 0 ? void 0 : _a.peek(commandId);
        }
        static saveState(storageService) {
            if (!CommandsHistory.cache) {
                return;
            }
            const serializedCache = { usesLRU: true, entries: [] };
            CommandsHistory.cache.forEach((value, key) => serializedCache.entries.push({ key, value }));
            storageService.store(CommandsHistory.PREF_KEY_CACHE, JSON.stringify(serializedCache), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            storageService.store(CommandsHistory.PREF_KEY_COUNTER, CommandsHistory.counter, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
        }
        static getConfiguredCommandHistoryLength(configurationService) {
            var _a, _b;
            const config = configurationService.getValue();
            const configuredCommandHistoryLength = (_b = (_a = config.workbench) === null || _a === void 0 ? void 0 : _a.commandPalette) === null || _b === void 0 ? void 0 : _b.history;
            if (typeof configuredCommandHistoryLength === 'number') {
                return configuredCommandHistoryLength;
            }
            return CommandsHistory.DEFAULT_COMMANDS_HISTORY_LENGTH;
        }
        static clearHistory(configurationService, storageService) {
            const commandHistoryLength = CommandsHistory.getConfiguredCommandHistoryLength(configurationService);
            CommandsHistory.cache = new map_1.LRUCache(commandHistoryLength);
            CommandsHistory.counter = 1;
            CommandsHistory.saveState(storageService);
        }
    };
    CommandsHistory.DEFAULT_COMMANDS_HISTORY_LENGTH = 50;
    CommandsHistory.PREF_KEY_CACHE = 'commandPalette.mru.cache';
    CommandsHistory.PREF_KEY_COUNTER = 'commandPalette.mru.counter';
    CommandsHistory.counter = 1;
    CommandsHistory = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, configuration_1.IConfigurationService)
    ], CommandsHistory);
    exports.CommandsHistory = CommandsHistory;
});
//# sourceMappingURL=commandsQuickAccess.js.map