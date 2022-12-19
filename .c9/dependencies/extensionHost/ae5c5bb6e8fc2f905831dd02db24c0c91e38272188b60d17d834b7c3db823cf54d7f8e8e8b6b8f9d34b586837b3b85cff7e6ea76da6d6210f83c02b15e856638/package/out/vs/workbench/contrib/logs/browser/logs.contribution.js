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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/contrib/logs/common/logsActions", "vs/workbench/common/contributions", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/logs/common/logsDataCleaner"], function (require, exports, platform_1, actions_1, actions_2, logsActions_1, contributions_1, lifecycle_1, instantiation_1, logsDataCleaner_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WebLogOutputChannels = class WebLogOutputChannels extends lifecycle_1.Disposable {
        constructor(instantiationService) {
            super();
            this.instantiationService = instantiationService;
            this.registerWebContributions();
        }
        registerWebContributions() {
            this.instantiationService.createInstance(logsDataCleaner_1.LogsDataCleaner);
            const workbenchActionsRegistry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
            workbenchActionsRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(logsActions_1.OpenWindowSessionLogFileAction), 'Developer: Open Window Log File (Session)...', actions_1.CATEGORIES.Developer.value);
        }
    };
    WebLogOutputChannels = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], WebLogOutputChannels);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(WebLogOutputChannels, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=logs.contribution.js.map