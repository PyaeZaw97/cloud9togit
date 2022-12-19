/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/registry/common/platform", "vs/workbench/contrib/remote/browser/showCandidate", "vs/workbench/contrib/remote/browser/tunnelFactory", "vs/workbench/contrib/remote/browser/remote", "vs/workbench/contrib/remote/browser/remoteIndicator", "vs/workbench/contrib/remote/browser/remoteExplorer"], function (require, exports, contributions_1, platform_1, showCandidate_1, tunnelFactory_1, remote_1, remoteIndicator_1, remoteExplorer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(showCandidate_1.ShowCandidateContribution, 2 /* LifecyclePhase.Ready */);
    workbenchContributionsRegistry.registerWorkbenchContribution(tunnelFactory_1.TunnelFactoryContribution, 2 /* LifecyclePhase.Ready */);
    workbenchContributionsRegistry.registerWorkbenchContribution(remote_1.RemoteAgentConnectionStatusListener, 4 /* LifecyclePhase.Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(remoteIndicator_1.RemoteStatusIndicator, 1 /* LifecyclePhase.Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(remoteExplorer_1.ForwardedPortsView, 3 /* LifecyclePhase.Restored */);
    workbenchContributionsRegistry.registerWorkbenchContribution(remoteExplorer_1.PortRestore, 4 /* LifecyclePhase.Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(remoteExplorer_1.AutomaticPortForwarding, 4 /* LifecyclePhase.Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(remote_1.RemoteMarkers, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=remote.contribution.js.map