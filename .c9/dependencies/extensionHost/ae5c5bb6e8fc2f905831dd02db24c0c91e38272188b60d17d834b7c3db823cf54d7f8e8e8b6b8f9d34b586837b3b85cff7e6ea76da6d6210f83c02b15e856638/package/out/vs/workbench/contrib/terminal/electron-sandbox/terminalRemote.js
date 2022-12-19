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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/actions", "vs/workbench/contrib/terminal/browser/terminal", "vs/platform/environment/common/environment", "vs/platform/remote/common/remoteAuthorityResolver", "vs/workbench/services/history/common/history", "vs/base/common/network"], function (require, exports, nls, platform_1, actions_1, actions_2, terminal_1, actions_3, terminal_2, environment_1, remoteAuthorityResolver_1, history_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CreateNewLocalTerminalAction = exports.registerRemoteContributions = void 0;
    function registerRemoteContributions() {
        const actionRegistry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
        actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(CreateNewLocalTerminalAction), 'Terminal: Create New Integrated Terminal (Local)', terminal_1.TERMINAL_ACTION_CATEGORY);
    }
    exports.registerRemoteContributions = registerRemoteContributions;
    let CreateNewLocalTerminalAction = class CreateNewLocalTerminalAction extends actions_3.Action {
        constructor(id, label, _terminalService, _terminalGroupService, _nativeEnvironmentService, _remoteAuthorityResolverService, _historyService) {
            super(id, label);
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._nativeEnvironmentService = _nativeEnvironmentService;
            this._remoteAuthorityResolverService = _remoteAuthorityResolverService;
            this._historyService = _historyService;
        }
        async run() {
            let cwd;
            try {
                const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot(network_1.Schemas.vscodeRemote);
                if (activeWorkspaceRootUri) {
                    const canonicalUri = await this._remoteAuthorityResolverService.getCanonicalURI(activeWorkspaceRootUri);
                    if (canonicalUri.scheme === network_1.Schemas.file) {
                        cwd = canonicalUri;
                    }
                }
            }
            catch (_a) { }
            if (!cwd) {
                cwd = this._nativeEnvironmentService.userHome;
            }
            const instance = await this._terminalService.createTerminal({ cwd });
            if (!instance) {
                return Promise.resolve(undefined);
            }
            this._terminalService.setActiveInstance(instance);
            return this._terminalGroupService.showPanel(true);
        }
    };
    CreateNewLocalTerminalAction.ID = "workbench.action.terminal.newLocal" /* TerminalCommandId.NewLocal */;
    CreateNewLocalTerminalAction.LABEL = nls.localize('workbench.action.terminal.newLocal', "Create New Integrated Terminal (Local)");
    CreateNewLocalTerminalAction = __decorate([
        __param(2, terminal_2.ITerminalService),
        __param(3, terminal_2.ITerminalGroupService),
        __param(4, environment_1.INativeEnvironmentService),
        __param(5, remoteAuthorityResolver_1.IRemoteAuthorityResolverService),
        __param(6, history_1.IHistoryService)
    ], CreateNewLocalTerminalAction);
    exports.CreateNewLocalTerminalAction = CreateNewLocalTerminalAction;
});
//# sourceMappingURL=terminalRemote.js.map