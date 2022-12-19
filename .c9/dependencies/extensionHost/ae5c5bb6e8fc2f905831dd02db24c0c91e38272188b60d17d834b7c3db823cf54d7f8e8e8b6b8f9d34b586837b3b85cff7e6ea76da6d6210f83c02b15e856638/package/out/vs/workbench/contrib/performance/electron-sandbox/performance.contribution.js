/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "./startupProfiler", "./startupTimings"], function (require, exports, platform_1, contributions_1, startupProfiler_1, startupTimings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // -- startup profiler
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(startupProfiler_1.StartupProfiler, 3 /* LifecyclePhase.Restored */);
    // -- startup timings
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(startupTimings_1.StartupTimings, 4 /* LifecyclePhase.Eventually */);
});
//# sourceMappingURL=performance.contribution.js.map