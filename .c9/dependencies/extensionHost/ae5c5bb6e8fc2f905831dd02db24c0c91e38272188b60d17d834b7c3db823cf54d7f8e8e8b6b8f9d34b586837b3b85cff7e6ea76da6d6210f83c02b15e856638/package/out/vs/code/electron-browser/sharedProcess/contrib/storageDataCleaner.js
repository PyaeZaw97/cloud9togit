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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/platform/log/common/log"], function (require, exports, async_1, errors_1, lifecycle_1, path_1, pfs_1, environment_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StorageDataCleaner = void 0;
    let StorageDataCleaner = class StorageDataCleaner extends lifecycle_1.Disposable {
        constructor(backupWorkspacesPath, environmentService, logService) {
            super();
            this.backupWorkspacesPath = backupWorkspacesPath;
            this.environmentService = environmentService;
            this.logService = logService;
            const scheduler = this._register(new async_1.RunOnceScheduler(() => {
                this.cleanUpStorage();
            }, 30 * 1000 /* after 30s */));
            scheduler.schedule();
        }
        async cleanUpStorage() {
            this.logService.trace('[storage cleanup]: Starting to clean up storage folders.');
            try {
                // Leverage the backup workspace file to find out which empty workspace is currently in use to
                // determine which empty workspace storage can safely be deleted
                const contents = await pfs_1.Promises.readFile(this.backupWorkspacesPath, 'utf8');
                const workspaces = JSON.parse(contents);
                const emptyWorkspaces = workspaces.emptyWorkspaceInfos.map(emptyWorkspace => emptyWorkspace.backupFolder);
                // Read all workspace storage folders that exist & cleanup unused
                const workspaceStorageFolders = await pfs_1.Promises.readdir(this.environmentService.workspaceStorageHome.fsPath);
                await Promise.all(workspaceStorageFolders.map(async (workspaceStorageFolder) => {
                    if (workspaceStorageFolder.length === StorageDataCleaner.NON_EMPTY_WORKSPACE_ID_LENGTH || // keep non-empty workspaces
                        workspaceStorageFolder === StorageDataCleaner.EXTENSION_DEV_EMPTY_WINDOW_ID || // keep empty extension dev workspaces
                        emptyWorkspaces.indexOf(workspaceStorageFolder) >= 0 // keep empty workspaces that are in use
                    ) {
                        return;
                    }
                    this.logService.trace(`[storage cleanup]: Deleting workspace storage folder ${workspaceStorageFolder}.`);
                    await pfs_1.Promises.rm((0, path_1.join)(this.environmentService.workspaceStorageHome.fsPath, workspaceStorageFolder));
                }));
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
            }
        }
    };
    // Workspace/Folder storage names are MD5 hashes (128bits / 4 due to hex presentation)
    StorageDataCleaner.NON_EMPTY_WORKSPACE_ID_LENGTH = 128 / 4;
    // Reserved empty window workspace storage name when in extension development
    StorageDataCleaner.EXTENSION_DEV_EMPTY_WINDOW_ID = 'ext-dev';
    StorageDataCleaner = __decorate([
        __param(1, environment_1.INativeEnvironmentService),
        __param(2, log_1.ILogService)
    ], StorageDataCleaner);
    exports.StorageDataCleaner = StorageDataCleaner;
});
//# sourceMappingURL=storageDataCleaner.js.map