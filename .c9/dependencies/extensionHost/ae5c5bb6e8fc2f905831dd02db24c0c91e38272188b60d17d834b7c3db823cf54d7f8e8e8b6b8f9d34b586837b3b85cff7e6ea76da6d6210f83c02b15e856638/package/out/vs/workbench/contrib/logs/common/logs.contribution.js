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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/contrib/logs/common/logsActions", "vs/workbench/contrib/logs/common/logConstants", "vs/workbench/common/contributions", "vs/workbench/services/environment/common/environmentService", "vs/platform/files/common/files", "vs/workbench/services/output/common/output", "vs/base/common/lifecycle", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/product/common/productService"], function (require, exports, nls, platform_1, actions_1, actions_2, logsActions_1, Constants, contributions_1, environmentService_1, files_1, output_1, lifecycle_1, log_1, telemetryUtils_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const workbenchActionsRegistry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    workbenchActionsRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(logsActions_1.SetLogLevelAction), 'Developer: Set Log Level...', actions_1.CATEGORIES.Developer.value);
    let LogOutputChannels = class LogOutputChannels extends lifecycle_1.Disposable {
        constructor(environmentService, productService, logService, fileService) {
            super();
            this.environmentService = environmentService;
            this.productService = productService;
            this.logService = logService;
            this.fileService = fileService;
            this.registerCommonContributions();
        }
        registerCommonContributions() {
            this.registerLogChannel(Constants.userDataSyncLogChannelId, nls.localize('userDataSyncLog', "Settings Sync"), this.environmentService.userDataSyncLogResource);
            this.registerLogChannel(Constants.rendererLogChannelId, nls.localize('rendererLog', "Window"), this.environmentService.logFile);
            const registerTelemetryChannel = () => {
                if ((0, telemetryUtils_1.supportsTelemetry)(this.productService, this.environmentService) && this.logService.getLevel() === log_1.LogLevel.Trace) {
                    this.registerLogChannel(Constants.telemetryLogChannelId, nls.localize('telemetryLog', "Telemetry"), this.environmentService.telemetryLogResource);
                    return true;
                }
                return false;
            };
            if (!registerTelemetryChannel()) {
                const disposable = this.logService.onDidChangeLogLevel(() => {
                    if (registerTelemetryChannel()) {
                        disposable.dispose();
                    }
                });
            }
            (0, actions_2.registerAction2)(class ShowWindowLogAction extends actions_2.Action2 {
                constructor() {
                    super({
                        id: Constants.showWindowLogActionId,
                        title: { value: nls.localize('show window log', "Show Window Log"), original: 'Show Window Log' },
                        category: actions_1.CATEGORIES.Developer,
                        f1: true
                    });
                }
                async run(servicesAccessor) {
                    const outputService = servicesAccessor.get(output_1.IOutputService);
                    outputService.showChannel(Constants.rendererLogChannelId);
                }
            });
        }
        registerLogChannel(id, label, file) {
            const promise = (0, output_1.registerLogChannel)(id, label, file, this.fileService, this.logService);
            this._register((0, lifecycle_1.toDisposable)(() => promise.cancel()));
        }
    };
    LogOutputChannels = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, productService_1.IProductService),
        __param(2, log_1.ILogService),
        __param(3, files_1.IFileService)
    ], LogOutputChannels);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(LogOutputChannels, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=logs.contribution.js.map