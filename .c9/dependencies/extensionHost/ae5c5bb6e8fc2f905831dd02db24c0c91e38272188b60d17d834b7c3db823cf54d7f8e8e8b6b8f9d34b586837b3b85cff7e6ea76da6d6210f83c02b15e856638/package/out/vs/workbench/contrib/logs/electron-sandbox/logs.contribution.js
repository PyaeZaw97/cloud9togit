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
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/workbench/contrib/logs/electron-sandbox/logsActions", "vs/workbench/common/contributions", "vs/workbench/contrib/logs/common/logConstants", "vs/base/common/lifecycle", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/base/common/uri", "vs/base/common/path", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/output/common/output"], function (require, exports, nls, platform_1, actions_1, actions_2, logsActions_1, contributions_1, Constants, lifecycle_1, files_1, log_1, uri_1, path_1, environmentService_1, output_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NativeLogOutputChannels = class NativeLogOutputChannels extends lifecycle_1.Disposable {
        constructor(environmentService, logService, fileService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.fileService = fileService;
            this.registerNativeContributions();
        }
        registerNativeContributions() {
            this.registerLogChannel(Constants.mainLogChannelId, nls.localize('mainLog', "Main"), uri_1.URI.file((0, path_1.join)(this.environmentService.logsPath, `main.log`)));
            this.registerLogChannel(Constants.sharedLogChannelId, nls.localize('sharedLog', "Shared"), uri_1.URI.file((0, path_1.join)(this.environmentService.logsPath, `sharedprocess.log`)));
        }
        registerLogChannel(id, label, file) {
            const promise = (0, output_1.registerLogChannel)(id, label, file, this.fileService, this.logService);
            this._register((0, lifecycle_1.toDisposable)(() => promise.cancel()));
        }
    };
    NativeLogOutputChannels = __decorate([
        __param(0, environmentService_1.IWorkbenchEnvironmentService),
        __param(1, log_1.ILogService),
        __param(2, files_1.IFileService)
    ], NativeLogOutputChannels);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(NativeLogOutputChannels, 3 /* LifecyclePhase.Restored */);
    const workbenchActionsRegistry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    workbenchActionsRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(logsActions_1.OpenLogsFolderAction), 'Developer: Open Logs Folder', actions_1.CATEGORIES.Developer.value);
    workbenchActionsRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(logsActions_1.OpenExtensionLogsFolderAction), 'Developer: Open Extension Logs Folder', actions_1.CATEGORIES.Developer.value);
});
//# sourceMappingURL=logs.contribution.js.map