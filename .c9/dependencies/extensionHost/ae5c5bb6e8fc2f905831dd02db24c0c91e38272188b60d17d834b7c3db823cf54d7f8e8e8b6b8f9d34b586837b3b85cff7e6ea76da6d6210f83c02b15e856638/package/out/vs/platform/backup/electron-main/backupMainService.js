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
define(["require", "exports", "crypto", "fs", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/node/pfs", "vs/platform/backup/node/backup", "vs/platform/configuration/common/configuration", "vs/platform/environment/electron-main/environmentMainService", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/backup/common/backup", "vs/platform/workspace/common/workspace"], function (require, exports, crypto_1, fs, extpath_1, network_1, path_1, platform_1, resources_1, uri_1, pfs_1, backup_1, configuration_1, environmentMainService_1, files_1, log_1, backup_2, workspace_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BackupMainService = void 0;
    let BackupMainService = class BackupMainService {
        constructor(environmentMainService, configurationService, logService) {
            this.configurationService = configurationService;
            this.logService = logService;
            this.workspaces = [];
            this.folders = [];
            this.emptyWindows = [];
            // Comparers for paths and resources that will
            // - ignore path casing on Windows/macOS
            // - respect path casing on Linux
            this.backupUriComparer = resources_1.extUriBiasedIgnorePathCase;
            this.backupPathComparer = { isEqual: (pathA, pathB) => (0, extpath_1.isEqual)(pathA, pathB, !platform_1.isLinux) };
            this.backupHome = environmentMainService.backupHome;
            this.workspacesJsonPath = environmentMainService.backupWorkspacesPath;
        }
        async initialize() {
            let backups;
            try {
                backups = JSON.parse(await pfs_1.Promises.readFile(this.workspacesJsonPath, 'utf8')); // invalid JSON or permission issue can happen here
            }
            catch (error) {
                backups = Object.create(null);
            }
            // validate empty workspaces backups first
            this.emptyWindows = await this.validateEmptyWorkspaces(backups.emptyWorkspaceInfos);
            // read workspace backups
            let rootWorkspaces = [];
            try {
                if (Array.isArray(backups.rootURIWorkspaces)) {
                    rootWorkspaces = backups.rootURIWorkspaces.map(workspace => ({
                        workspace: { id: workspace.id, configPath: uri_1.URI.parse(workspace.configURIPath) },
                        remoteAuthority: workspace.remoteAuthority
                    }));
                }
            }
            catch (e) {
                // ignore URI parsing exceptions
            }
            // validate workspace backups
            this.workspaces = await this.validateWorkspaces(rootWorkspaces);
            // read folder backups
            let workspaceFolders = [];
            try {
                if (Array.isArray(backups.folderWorkspaceInfos)) {
                    workspaceFolders = backups.folderWorkspaceInfos.map(folder => ({ folderUri: uri_1.URI.parse(folder.folderUri), remoteAuthority: folder.remoteAuthority }));
                }
                else if (Array.isArray(backups.folderURIWorkspaces)) {
                    workspaceFolders = backups.folderURIWorkspaces.map(folder => ({ folderUri: uri_1.URI.parse(folder), remoteAuthority: undefined }));
                }
            }
            catch (e) {
                // ignore URI parsing exceptions
            }
            // validate folder backups
            this.folders = await this.validateFolders(workspaceFolders);
            // save again in case some workspaces or folders have been removed
            await this.save();
        }
        getWorkspaceBackups() {
            if (this.isHotExitOnExitAndWindowClose()) {
                // Only non-folder windows are restored on main process launch when
                // hot exit is configured as onExitAndWindowClose.
                return [];
            }
            return this.workspaces.slice(0); // return a copy
        }
        getFolderBackupPaths() {
            if (this.isHotExitOnExitAndWindowClose()) {
                // Only non-folder windows are restored on main process launch when
                // hot exit is configured as onExitAndWindowClose.
                return [];
            }
            return this.folders.slice(0); // return a copy
        }
        isHotExitEnabled() {
            return this.getHotExitConfig() !== files_1.HotExitConfiguration.OFF;
        }
        isHotExitOnExitAndWindowClose() {
            return this.getHotExitConfig() === files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE;
        }
        getHotExitConfig() {
            var _a;
            const config = this.configurationService.getValue();
            return ((_a = config === null || config === void 0 ? void 0 : config.files) === null || _a === void 0 ? void 0 : _a.hotExit) || files_1.HotExitConfiguration.ON_EXIT;
        }
        getEmptyWindowBackupPaths() {
            return this.emptyWindows.slice(0); // return a copy
        }
        registerWorkspaceBackupSync(workspaceInfo, migrateFrom) {
            if (!this.workspaces.some(workspace => workspaceInfo.workspace.id === workspace.workspace.id)) {
                this.workspaces.push(workspaceInfo);
                this.saveSync();
            }
            const backupPath = this.getBackupPath(workspaceInfo.workspace.id);
            if (migrateFrom) {
                this.moveBackupFolderSync(backupPath, migrateFrom);
            }
            return backupPath;
        }
        moveBackupFolderSync(backupPath, moveFromPath) {
            // Target exists: make sure to convert existing backups to empty window backups
            if (fs.existsSync(backupPath)) {
                this.convertToEmptyWindowBackupSync(backupPath);
            }
            // When we have data to migrate from, move it over to the target location
            if (fs.existsSync(moveFromPath)) {
                try {
                    fs.renameSync(moveFromPath, backupPath);
                }
                catch (error) {
                    this.logService.error(`Backup: Could not move backup folder to new location: ${error.toString()}`);
                }
            }
        }
        unregisterWorkspaceBackupSync(workspace) {
            const id = workspace.id;
            const index = this.workspaces.findIndex(workspace => workspace.workspace.id === id);
            if (index !== -1) {
                this.workspaces.splice(index, 1);
                this.saveSync();
            }
        }
        registerFolderBackupSync(folderInfo) {
            if (!this.folders.some(folder => this.backupUriComparer.isEqual(folderInfo.folderUri, folder.folderUri))) {
                this.folders.push(folderInfo);
                this.saveSync();
            }
            return this.getBackupPath(this.getFolderHash(folderInfo));
        }
        unregisterFolderBackupSync(folderUri) {
            const index = this.folders.findIndex(folder => this.backupUriComparer.isEqual(folderUri, folder.folderUri));
            if (index !== -1) {
                this.folders.splice(index, 1);
                this.saveSync();
            }
        }
        registerEmptyWindowBackupSync(backupFolderCandidate, remoteAuthority) {
            // Generate a new folder if this is a new empty workspace
            const backupFolder = backupFolderCandidate || this.getRandomEmptyWindowId();
            if (!this.emptyWindows.some(emptyWindow => !!emptyWindow.backupFolder && this.backupPathComparer.isEqual(emptyWindow.backupFolder, backupFolder))) {
                this.emptyWindows.push({ backupFolder, remoteAuthority });
                this.saveSync();
            }
            return this.getBackupPath(backupFolder);
        }
        unregisterEmptyWindowBackupSync(backupFolder) {
            const index = this.emptyWindows.findIndex(emptyWindow => !!emptyWindow.backupFolder && this.backupPathComparer.isEqual(emptyWindow.backupFolder, backupFolder));
            if (index !== -1) {
                this.emptyWindows.splice(index, 1);
                this.saveSync();
            }
        }
        getBackupPath(oldFolderHash) {
            return (0, path_1.join)(this.backupHome, oldFolderHash);
        }
        async validateWorkspaces(rootWorkspaces) {
            if (!Array.isArray(rootWorkspaces)) {
                return [];
            }
            const seenIds = new Set();
            const result = [];
            // Validate Workspaces
            for (let workspaceInfo of rootWorkspaces) {
                const workspace = workspaceInfo.workspace;
                if (!(0, workspace_1.isWorkspaceIdentifier)(workspace)) {
                    return []; // wrong format, skip all entries
                }
                if (!seenIds.has(workspace.id)) {
                    seenIds.add(workspace.id);
                    const backupPath = this.getBackupPath(workspace.id);
                    const hasBackups = await this.doHasBackups(backupPath);
                    // If the workspace has no backups, ignore it
                    if (hasBackups) {
                        if (workspace.configPath.scheme !== network_1.Schemas.file || await pfs_1.Promises.exists(workspace.configPath.fsPath)) {
                            result.push(workspaceInfo);
                        }
                        else {
                            // If the workspace has backups, but the target workspace is missing, convert backups to empty ones
                            await this.convertToEmptyWindowBackup(backupPath);
                        }
                    }
                    else {
                        await this.deleteStaleBackup(backupPath);
                    }
                }
            }
            return result;
        }
        async validateFolders(folderWorkspaces) {
            if (!Array.isArray(folderWorkspaces)) {
                return [];
            }
            const result = [];
            const seenIds = new Set();
            for (let folderInfo of folderWorkspaces) {
                const folderURI = folderInfo.folderUri;
                const key = this.backupUriComparer.getComparisonKey(folderURI);
                if (!seenIds.has(key)) {
                    seenIds.add(key);
                    const backupPath = this.getBackupPath(this.getFolderHash(folderInfo));
                    const hasBackups = await this.doHasBackups(backupPath);
                    // If the folder has no backups, ignore it
                    if (hasBackups) {
                        if (folderURI.scheme !== network_1.Schemas.file || await pfs_1.Promises.exists(folderURI.fsPath)) {
                            result.push(folderInfo);
                        }
                        else {
                            // If the folder has backups, but the target workspace is missing, convert backups to empty ones
                            await this.convertToEmptyWindowBackup(backupPath);
                        }
                    }
                    else {
                        await this.deleteStaleBackup(backupPath);
                    }
                }
            }
            return result;
        }
        async validateEmptyWorkspaces(emptyWorkspaces) {
            if (!Array.isArray(emptyWorkspaces)) {
                return [];
            }
            const result = [];
            const seenIds = new Set();
            // Validate Empty Windows
            for (let backupInfo of emptyWorkspaces) {
                const backupFolder = backupInfo.backupFolder;
                if (typeof backupFolder !== 'string') {
                    return [];
                }
                if (!seenIds.has(backupFolder)) {
                    seenIds.add(backupFolder);
                    const backupPath = this.getBackupPath(backupFolder);
                    if (await this.doHasBackups(backupPath)) {
                        result.push(backupInfo);
                    }
                    else {
                        await this.deleteStaleBackup(backupPath);
                    }
                }
            }
            return result;
        }
        async deleteStaleBackup(backupPath) {
            try {
                if (await pfs_1.Promises.exists(backupPath)) {
                    await pfs_1.Promises.rm(backupPath, pfs_1.RimRafMode.MOVE);
                }
            }
            catch (error) {
                this.logService.error(`Backup: Could not delete stale backup: ${error.toString()}`);
            }
        }
        async convertToEmptyWindowBackup(backupPath) {
            // New empty window backup
            let newBackupFolder = this.getRandomEmptyWindowId();
            while (this.emptyWindows.some(emptyWindow => !!emptyWindow.backupFolder && this.backupPathComparer.isEqual(emptyWindow.backupFolder, newBackupFolder))) {
                newBackupFolder = this.getRandomEmptyWindowId();
            }
            // Rename backupPath to new empty window backup path
            const newEmptyWindowBackupPath = this.getBackupPath(newBackupFolder);
            try {
                await pfs_1.Promises.rename(backupPath, newEmptyWindowBackupPath);
            }
            catch (error) {
                this.logService.error(`Backup: Could not rename backup folder: ${error.toString()}`);
                return false;
            }
            this.emptyWindows.push({ backupFolder: newBackupFolder });
            return true;
        }
        convertToEmptyWindowBackupSync(backupPath) {
            // New empty window backup
            let newBackupFolder = this.getRandomEmptyWindowId();
            while (this.emptyWindows.some(emptyWindow => !!emptyWindow.backupFolder && this.backupPathComparer.isEqual(emptyWindow.backupFolder, newBackupFolder))) {
                newBackupFolder = this.getRandomEmptyWindowId();
            }
            // Rename backupPath to new empty window backup path
            const newEmptyWindowBackupPath = this.getBackupPath(newBackupFolder);
            try {
                fs.renameSync(backupPath, newEmptyWindowBackupPath);
            }
            catch (error) {
                this.logService.error(`Backup: Could not rename backup folder: ${error.toString()}`);
                return false;
            }
            this.emptyWindows.push({ backupFolder: newBackupFolder });
            return true;
        }
        async getDirtyWorkspaces() {
            const dirtyWorkspaces = [];
            // Workspaces with backups
            for (const workspace of this.workspaces) {
                if ((await this.hasBackups(workspace))) {
                    dirtyWorkspaces.push(workspace);
                }
            }
            // Folders with backups
            for (const folder of this.folders) {
                if ((await this.hasBackups(folder))) {
                    dirtyWorkspaces.push(folder);
                }
            }
            return dirtyWorkspaces;
        }
        hasBackups(backupLocation) {
            let backupPath;
            // Empty
            if ((0, backup_1.isEmptyWindowBackupInfo)(backupLocation)) {
                backupPath = backupLocation.backupFolder;
            }
            // Folder
            else if ((0, backup_2.isFolderBackupInfo)(backupLocation)) {
                backupPath = this.getBackupPath(this.getFolderHash(backupLocation));
            }
            // Workspace
            else {
                backupPath = this.getBackupPath(backupLocation.workspace.id);
            }
            return this.doHasBackups(backupPath);
        }
        async doHasBackups(backupPath) {
            try {
                const backupSchemas = await pfs_1.Promises.readdir(backupPath);
                for (const backupSchema of backupSchemas) {
                    try {
                        const backupSchemaChildren = await pfs_1.Promises.readdir((0, path_1.join)(backupPath, backupSchema));
                        if (backupSchemaChildren.length > 0) {
                            return true;
                        }
                    }
                    catch (error) {
                        // invalid folder
                    }
                }
            }
            catch (error) {
                // backup path does not exist
            }
            return false;
        }
        saveSync() {
            try {
                (0, pfs_1.writeFileSync)(this.workspacesJsonPath, JSON.stringify(this.serializeBackups()));
            }
            catch (error) {
                this.logService.error(`Backup: Could not save workspaces.json: ${error.toString()}`);
            }
        }
        async save() {
            try {
                await pfs_1.Promises.writeFile(this.workspacesJsonPath, JSON.stringify(this.serializeBackups()));
            }
            catch (error) {
                this.logService.error(`Backup: Could not save workspaces.json: ${error.toString()}`);
            }
        }
        serializeBackups() {
            return {
                rootURIWorkspaces: this.workspaces.map(workspace => ({ id: workspace.workspace.id, configURIPath: workspace.workspace.configPath.toString(), remoteAuthority: workspace.remoteAuthority })),
                folderWorkspaceInfos: this.folders.map(folder => ({ folderUri: folder.folderUri.toString(), remoteAuthority: folder.remoteAuthority })),
                emptyWorkspaceInfos: this.emptyWindows
            };
        }
        getRandomEmptyWindowId() {
            return (Date.now() + Math.round(Math.random() * 1000)).toString();
        }
        getFolderHash(folder) {
            const folderUri = folder.folderUri;
            let key;
            if (folderUri.scheme === network_1.Schemas.file) {
                // for backward compatibility, use the fspath as key
                key = platform_1.isLinux ? folderUri.fsPath : folderUri.fsPath.toLowerCase();
            }
            else {
                key = folderUri.toString().toLowerCase();
            }
            return (0, crypto_1.createHash)('md5').update(key).digest('hex');
        }
    };
    BackupMainService = __decorate([
        __param(0, environmentMainService_1.IEnvironmentMainService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, log_1.ILogService)
    ], BackupMainService);
    exports.BackupMainService = BackupMainService;
});
//# sourceMappingURL=backupMainService.js.map