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
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/base/common/uri", "vs/platform/actions/common/actions", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/common/contextkeys", "vs/platform/files/common/files", "vs/platform/list/browser/listService", "vs/workbench/contrib/files/browser/files", "vs/platform/commands/common/commands", "vs/base/common/network", "vs/base/common/arrays", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/remote/common/remoteAgentService", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/contributions", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/path", "vs/platform/registry/common/platform", "vs/platform/externalTerminal/common/externalTerminal", "vs/platform/terminal/common/terminal"], function (require, exports, nls, configuration_1, uri_1, actions_1, terminal_1, contextkeys_1, files_1, listService_1, files_2, commands_1, network_1, arrays_1, editorService_1, remoteAgentService_1, contextkey_1, contributions_1, lifecycle_1, platform_1, path_1, platform_2, externalTerminal_1, terminal_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExternalTerminalContribution = void 0;
    const OPEN_IN_TERMINAL_COMMAND_ID = 'openInTerminal';
    commands_1.CommandsRegistry.registerCommand({
        id: OPEN_IN_TERMINAL_COMMAND_ID,
        handler: async (accessor, resource) => {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const fileService = accessor.get(files_1.IFileService);
            const integratedTerminalService = accessor.get(terminal_1.ITerminalService);
            const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
            const terminalGroupService = accessor.get(terminal_1.ITerminalGroupService);
            let externalTerminalService = undefined;
            try {
                externalTerminalService = accessor.get(externalTerminal_1.IExternalTerminalService);
            }
            catch (_a) {
            }
            const resources = (0, files_2.getMultiSelectedResources)(resource, accessor.get(listService_1.IListService), editorService, accessor.get(files_2.IExplorerService));
            return fileService.resolveAll(resources.map(r => ({ resource: r }))).then(async (stats) => {
                const targets = (0, arrays_1.distinct)(stats.filter(data => data.success));
                // Always use integrated terminal when using a remote
                const config = configurationService.getValue();
                const useIntegratedTerminal = remoteAgentService.getConnection() || config.terminal.explorerKind === 'integrated';
                if (useIntegratedTerminal) {
                    // TODO: Use uri for cwd in createterminal
                    const opened = {};
                    const cwds = targets.map(({ stat }) => {
                        const resource = stat.resource;
                        if (stat.isDirectory) {
                            return resource;
                        }
                        return uri_1.URI.from({
                            scheme: resource.scheme,
                            authority: resource.authority,
                            fragment: resource.fragment,
                            query: resource.query,
                            path: (0, path_1.dirname)(resource.path)
                        });
                    });
                    for (const cwd of cwds) {
                        if (opened[cwd.path]) {
                            return;
                        }
                        opened[cwd.path] = true;
                        const instance = await integratedTerminalService.createTerminal({ config: { cwd } });
                        if (instance && instance.target !== terminal_2.TerminalLocation.Editor && (resources.length === 1 || !resource || cwd.path === resource.path || cwd.path === (0, path_1.dirname)(resource.path))) {
                            integratedTerminalService.setActiveInstance(instance);
                            terminalGroupService.showPanel(true);
                        }
                    }
                }
                else if (externalTerminalService) {
                    (0, arrays_1.distinct)(targets.map(({ stat }) => stat.isDirectory ? stat.resource.fsPath : (0, path_1.dirname)(stat.resource.fsPath))).forEach(cwd => {
                        externalTerminalService.openTerminal(config.terminal.external, cwd);
                    });
                }
            });
        }
    });
    let ExternalTerminalContribution = class ExternalTerminalContribution extends lifecycle_1.Disposable {
        constructor(_configurationService) {
            super();
            this._configurationService = _configurationService;
            this._openInTerminalMenuItem = {
                group: 'navigation',
                order: 30,
                command: {
                    id: OPEN_IN_TERMINAL_COMMAND_ID,
                    title: nls.localize('scopedConsoleAction', "Open in Terminal")
                },
                when: contextkey_1.ContextKeyExpr.or(contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.file), contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.vscodeRemote))
            };
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, this._openInTerminalMenuItem);
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, this._openInTerminalMenuItem);
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('terminal.explorerKind') || e.affectsConfiguration('terminal.external')) {
                    this._refreshOpenInTerminalMenuItemTitle();
                }
            });
            this._refreshOpenInTerminalMenuItemTitle();
        }
        _refreshOpenInTerminalMenuItemTitle() {
            var _a;
            if (platform_1.isWeb) {
                this._openInTerminalMenuItem.command.title = nls.localize('scopedConsoleAction.integrated', "Open in Integrated Terminal");
                return;
            }
            const config = this._configurationService.getValue().terminal;
            if (config.explorerKind === 'integrated') {
                this._openInTerminalMenuItem.command.title = nls.localize('scopedConsoleAction.integrated', "Open in Integrated Terminal");
                return;
            }
            if (platform_1.isWindows && ((_a = config.external) === null || _a === void 0 ? void 0 : _a.windowsExec)) {
                const file = (0, path_1.basename)(config.external.windowsExec);
                if (file === 'wt' || file === 'wt.exe') {
                    this._openInTerminalMenuItem.command.title = nls.localize('scopedConsoleAction.wt', "Open in Windows Terminal");
                    return;
                }
            }
            this._openInTerminalMenuItem.command.title = nls.localize('scopedConsoleAction.external', "Open in External Terminal");
        }
    };
    ExternalTerminalContribution = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], ExternalTerminalContribution);
    exports.ExternalTerminalContribution = ExternalTerminalContribution;
    platform_2.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(ExternalTerminalContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=externalTerminal.contribution.js.map