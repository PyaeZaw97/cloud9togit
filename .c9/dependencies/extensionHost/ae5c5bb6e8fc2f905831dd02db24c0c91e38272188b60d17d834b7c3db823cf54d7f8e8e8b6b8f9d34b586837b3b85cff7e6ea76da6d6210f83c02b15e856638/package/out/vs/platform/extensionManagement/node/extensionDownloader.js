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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/semver/semver", "vs/base/common/uri", "vs/base/common/uuid", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/files/common/files", "vs/platform/log/common/log"], function (require, exports, async_1, errors_1, lifecycle_1, platform_1, resources_1, semver, uri_1, uuid_1, pfs_1, environment_1, extensionManagement_1, extensionManagementUtil_1, files_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsDownloader = void 0;
    let ExtensionsDownloader = class ExtensionsDownloader extends lifecycle_1.Disposable {
        constructor(environmentService, fileService, extensionGalleryService, logService) {
            super();
            this.fileService = fileService;
            this.extensionGalleryService = extensionGalleryService;
            this.logService = logService;
            this.extensionsDownloadDir = uri_1.URI.file(environmentService.extensionsDownloadPath);
            this.cache = 20; // Cache 20 downloads
            this.cleanUpPromise = this.cleanUp();
        }
        async downloadExtension(extension, operation) {
            await this.cleanUpPromise;
            const vsixName = this.getName(extension);
            const location = (0, resources_1.joinPath)(this.extensionsDownloadDir, vsixName);
            // Download only if vsix does not exist
            if (!await this.fileService.exists(location)) {
                // Download to temporary location first only if vsix does not exist
                const tempLocation = (0, resources_1.joinPath)(this.extensionsDownloadDir, `.${(0, uuid_1.generateUuid)()}`);
                if (!await this.fileService.exists(tempLocation)) {
                    await this.extensionGalleryService.download(extension, tempLocation, operation);
                }
                try {
                    // Rename temp location to original
                    await this.rename(tempLocation, location, Date.now() + (2 * 60 * 1000) /* Retry for 2 minutes */);
                }
                catch (error) {
                    try {
                        await this.fileService.del(tempLocation);
                    }
                    catch (e) { /* ignore */ }
                    if (error.code === 'ENOTEMPTY') {
                        this.logService.info(`Rename failed because vsix was downloaded by another source. So ignoring renaming.`, extension.identifier.id);
                    }
                    else {
                        this.logService.info(`Rename failed because of ${(0, errors_1.getErrorMessage)(error)}. Deleted the vsix from downloaded location`, tempLocation.path);
                        throw error;
                    }
                }
            }
            return location;
        }
        async delete(location) {
            await this.cleanUpPromise;
            await this.fileService.del(location);
        }
        async rename(from, to, retryUntil) {
            try {
                await pfs_1.Promises.rename(from.fsPath, to.fsPath);
            }
            catch (error) {
                if (platform_1.isWindows && error && error.code === 'EPERM' && Date.now() < retryUntil) {
                    this.logService.info(`Failed renaming ${from} to ${to} with 'EPERM' error. Trying again...`);
                    return this.rename(from, to, retryUntil);
                }
                throw error;
            }
        }
        async cleanUp() {
            try {
                if (!(await this.fileService.exists(this.extensionsDownloadDir))) {
                    this.logService.trace('Extension VSIX downlads cache dir does not exist');
                    return;
                }
                const folderStat = await this.fileService.resolve(this.extensionsDownloadDir, { resolveMetadata: true });
                if (folderStat.children) {
                    const toDelete = [];
                    const all = [];
                    for (const stat of folderStat.children) {
                        const extension = extensionManagementUtil_1.ExtensionKey.parse(stat.name);
                        if (extension) {
                            all.push([extension, stat]);
                        }
                    }
                    const byExtension = (0, extensionManagementUtil_1.groupByExtension)(all, ([extension]) => extension);
                    const distinct = [];
                    for (const p of byExtension) {
                        p.sort((a, b) => semver.rcompare(a[0].version, b[0].version));
                        toDelete.push(...p.slice(1).map(e => e[1].resource)); // Delete outdated extensions
                        distinct.push(p[0][1]);
                    }
                    distinct.sort((a, b) => a.mtime - b.mtime); // sort by modified time
                    toDelete.push(...distinct.slice(0, Math.max(0, distinct.length - this.cache)).map(s => s.resource)); // Retain minimum cacheSize and delete the rest
                    await async_1.Promises.settled(toDelete.map(resource => {
                        this.logService.trace('Deleting vsix from cache', resource.path);
                        return this.fileService.del(resource);
                    }));
                }
            }
            catch (e) {
                this.logService.error(e);
            }
        }
        getName(extension) {
            return this.cache ? extensionManagementUtil_1.ExtensionKey.create(extension).toString().toLowerCase() : (0, uuid_1.generateUuid)();
        }
    };
    ExtensionsDownloader = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, files_1.IFileService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, log_1.ILogService)
    ], ExtensionsDownloader);
    exports.ExtensionsDownloader = ExtensionsDownloader;
});
//# sourceMappingURL=extensionDownloader.js.map