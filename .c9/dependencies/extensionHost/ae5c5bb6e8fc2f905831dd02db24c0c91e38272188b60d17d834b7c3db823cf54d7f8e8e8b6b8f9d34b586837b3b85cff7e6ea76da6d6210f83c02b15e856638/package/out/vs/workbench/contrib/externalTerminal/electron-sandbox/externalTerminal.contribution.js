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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/platform/externalTerminal/common/externalTerminal", "vs/platform/actions/common/actions", "vs/workbench/services/history/common/history", "vs/platform/keybinding/common/keybindingsRegistry", "vs/base/common/network", "vs/platform/configuration/common/configurationRegistry", "vs/platform/registry/common/platform", "vs/platform/externalTerminal/electron-sandbox/externalTerminalMainService", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/remote/common/remoteAuthorityResolver"], function (require, exports, nls, paths, externalTerminal_1, actions_1, history_1, keybindingsRegistry_1, network_1, configurationRegistry_1, platform_1, externalTerminalMainService_1, configuration_1, terminalContextKey_1, remoteAuthorityResolver_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExternalTerminalContribution = void 0;
    const OPEN_NATIVE_CONSOLE_COMMAND_ID = 'workbench.action.terminal.openNativeConsole';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: OPEN_NATIVE_CONSOLE_COMMAND_ID,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 33 /* KeyCode.KeyC */,
        when: terminalContextKey_1.TerminalContextKeys.notFocus,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        handler: async (accessor) => {
            const historyService = accessor.get(history_1.IHistoryService);
            // Open external terminal in local workspaces
            const terminalService = accessor.get(externalTerminal_1.IExternalTerminalService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const remoteAuthorityResolverService = accessor.get(remoteAuthorityResolver_1.IRemoteAuthorityResolverService);
            const root = historyService.getLastActiveWorkspaceRoot();
            const config = configurationService.getValue('terminal.external');
            // It's a local workspace, open the root
            if ((root === null || root === void 0 ? void 0 : root.scheme) === network_1.Schemas.file) {
                terminalService.openTerminal(config, root.fsPath);
                return;
            }
            // If it's a remote workspace, open the canonical URI if it is a local folder
            try {
                if ((root === null || root === void 0 ? void 0 : root.scheme) === network_1.Schemas.vscodeRemote) {
                    const canonicalUri = await remoteAuthorityResolverService.getCanonicalURI(root);
                    if (canonicalUri.scheme === network_1.Schemas.file) {
                        terminalService.openTerminal(config, canonicalUri.fsPath);
                        return;
                    }
                }
            }
            catch (_a) { }
            // Open the current file's folder if it's local or its canonical URI is local
            // Opens current file's folder, if no folder is open in editor
            const activeFile = historyService.getLastActiveFile(network_1.Schemas.file);
            if ((activeFile === null || activeFile === void 0 ? void 0 : activeFile.scheme) === network_1.Schemas.file) {
                terminalService.openTerminal(config, paths.dirname(activeFile.fsPath));
                return;
            }
            try {
                if ((activeFile === null || activeFile === void 0 ? void 0 : activeFile.scheme) === network_1.Schemas.vscodeRemote) {
                    const canonicalUri = await remoteAuthorityResolverService.getCanonicalURI(activeFile);
                    if (canonicalUri.scheme === network_1.Schemas.file) {
                        terminalService.openTerminal(config, canonicalUri.fsPath);
                        return;
                    }
                }
            }
            catch (_b) { }
            // Fallback to opening without a cwd which will end up using the local home path
            terminalService.openTerminal(config, undefined);
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
        command: {
            id: OPEN_NATIVE_CONSOLE_COMMAND_ID,
            title: { value: nls.localize('globalConsoleAction', "Open New External Terminal"), original: 'Open New External Terminal' }
        }
    });
    let ExternalTerminalContribution = class ExternalTerminalContribution {
        constructor(_externalTerminalService) {
            this._externalTerminalService = _externalTerminalService;
            this._updateConfiguration();
        }
        async _updateConfiguration() {
            const terminals = await this._externalTerminalService.getDefaultTerminalForPlatforms();
            let configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            configurationRegistry.registerConfiguration({
                id: 'externalTerminal',
                order: 100,
                title: nls.localize('terminalConfigurationTitle', "External Terminal"),
                type: 'object',
                properties: {
                    'terminal.explorerKind': {
                        type: 'string',
                        enum: [
                            'integrated',
                            'external'
                        ],
                        enumDescriptions: [
                            nls.localize('terminal.explorerKind.integrated', "Use VS Code's integrated terminal."),
                            nls.localize('terminal.explorerKind.external', "Use the configured external terminal.")
                        ],
                        description: nls.localize('explorer.openInTerminalKind', "When opening a file from the explorer in a terminal, determines what kind of terminal will be launched"),
                        default: 'integrated'
                    },
                    'terminal.external.windowsExec': {
                        type: 'string',
                        description: nls.localize('terminal.external.windowsExec', "Customizes which terminal to run on Windows."),
                        default: terminals.windows,
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'terminal.external.osxExec': {
                        type: 'string',
                        description: nls.localize('terminal.external.osxExec', "Customizes which terminal application to run on macOS."),
                        default: externalTerminal_1.DEFAULT_TERMINAL_OSX,
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    },
                    'terminal.external.linuxExec': {
                        type: 'string',
                        description: nls.localize('terminal.external.linuxExec', "Customizes which terminal to run on Linux."),
                        default: terminals.linux,
                        scope: 1 /* ConfigurationScope.APPLICATION */
                    }
                }
            });
        }
    };
    ExternalTerminalContribution = __decorate([
        __param(0, externalTerminalMainService_1.IExternalTerminalMainService)
    ], ExternalTerminalContribution);
    exports.ExternalTerminalContribution = ExternalTerminalContribution;
});
//# sourceMappingURL=externalTerminal.contribution.js.map