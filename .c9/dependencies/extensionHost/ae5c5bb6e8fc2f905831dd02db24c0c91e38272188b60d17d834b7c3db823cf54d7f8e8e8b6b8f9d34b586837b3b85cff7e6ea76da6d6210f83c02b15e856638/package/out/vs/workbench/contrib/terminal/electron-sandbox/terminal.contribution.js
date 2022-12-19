/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/ipc/electron-sandbox/services", "vs/platform/registry/common/platform", "vs/platform/terminal/common/terminal", "vs/platform/terminal/electron-sandbox/terminal", "vs/workbench/common/contributions", "vs/workbench/contrib/externalTerminal/electron-sandbox/externalTerminal.contribution", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/electron-sandbox/terminalNativeContribution", "vs/workbench/contrib/terminal/electron-sandbox/terminalProfileResolverService", "vs/workbench/contrib/terminal/electron-sandbox/localTerminalBackend"], function (require, exports, extensions_1, services_1, platform_1, terminal_1, terminal_2, contributions_1, externalTerminal_contribution_1, terminal_3, terminalNativeContribution_1, terminalProfileResolverService_1, localTerminalBackend_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Register services
    (0, services_1.registerSharedProcessRemoteService)(terminal_2.ILocalPtyService, terminal_1.TerminalIpcChannels.LocalPty, { supportsDelayedInstantiation: true });
    (0, extensions_1.registerSingleton)(terminal_3.ITerminalProfileResolverService, terminalProfileResolverService_1.ElectronTerminalProfileResolverService, true);
    // Register workbench contributions
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(localTerminalBackend_1.LocalTerminalBackendContribution, 1 /* LifecyclePhase.Starting */);
    workbenchRegistry.registerWorkbenchContribution(terminalNativeContribution_1.TerminalNativeContribution, 2 /* LifecyclePhase.Ready */);
    workbenchRegistry.registerWorkbenchContribution(externalTerminal_contribution_1.ExternalTerminalContribution, 2 /* LifecyclePhase.Ready */);
});
//# sourceMappingURL=terminal.contribution.js.map