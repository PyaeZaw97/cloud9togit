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
define(["require", "exports", "vs/workbench/common/contributions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/registry/common/platform", "vs/platform/ipc/electron-sandbox/services", "vs/platform/userDataSync/common/userDataSyncIpc", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/native/electron-sandbox/native", "vs/platform/notification/common/notification", "vs/workbench/services/userDataSync/common/userDataSync"], function (require, exports, contributions_1, userDataSync_1, platform_1, services_1, userDataSyncIpc_1, actions_1, nls_1, environment_1, files_1, native_1, notification_1, userDataSync_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncServicesContribution = class UserDataSyncServicesContribution {
        constructor(userDataSyncUtilService, sharedProcessService) {
            sharedProcessService.registerChannel('userDataSyncUtil', new userDataSyncIpc_1.UserDataSycnUtilServiceChannel(userDataSyncUtilService));
        }
    };
    UserDataSyncServicesContribution = __decorate([
        __param(0, userDataSync_1.IUserDataSyncUtilService),
        __param(1, services_1.ISharedProcessService)
    ], UserDataSyncServicesContribution);
    const workbenchRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchRegistry.registerWorkbenchContribution(UserDataSyncServicesContribution, 1 /* LifecyclePhase.Starting */);
    (0, actions_1.registerAction2)(class OpenSyncBackupsFolder extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.userData.actions.openSyncBackupsFolder',
                title: { value: (0, nls_1.localize)('Open Backup folder', "Open Local Backups Folder"), original: 'Open Local Backups Folder' },
                category: { value: userDataSync_2.SYNC_TITLE, original: `Settings Sync` },
                menu: {
                    id: actions_1.MenuId.CommandPalette,
                    when: userDataSync_2.CONTEXT_SYNC_STATE.notEqualsTo("uninitialized" /* SyncStatus.Uninitialized */),
                }
            });
        }
        async run(accessor) {
            const syncHome = accessor.get(environment_1.IEnvironmentService).userDataSyncHome;
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const fileService = accessor.get(files_1.IFileService);
            const notificationService = accessor.get(notification_1.INotificationService);
            if (await fileService.exists(syncHome)) {
                const folderStat = await fileService.resolve(syncHome);
                const item = folderStat.children && folderStat.children[0] ? folderStat.children[0].resource : syncHome;
                return nativeHostService.showItemInFolder(item.fsPath);
            }
            else {
                notificationService.info((0, nls_1.localize)('no backups', "Local backups folder does not exist"));
            }
        }
    });
});
//# sourceMappingURL=userDataSync.contribution.js.map