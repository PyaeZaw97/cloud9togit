/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/resources", "vs/base/common/buffer", "vs/base/common/async"], function (require, exports, resources_1, buffer_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationCache = void 0;
    class ConfigurationCache {
        constructor(donotCacheResourcesWithSchemes, environmentService, fileService) {
            this.donotCacheResourcesWithSchemes = donotCacheResourcesWithSchemes;
            this.fileService = fileService;
            this.cachedConfigurations = new Map();
            this.cacheHome = environmentService.cacheHome;
        }
        needsCaching(resource) {
            // Cache all non native resources
            return !this.donotCacheResourcesWithSchemes.includes(resource.scheme);
        }
        read(key) {
            return this.getCachedConfiguration(key).read();
        }
        write(key, content) {
            return this.getCachedConfiguration(key).save(content);
        }
        remove(key) {
            return this.getCachedConfiguration(key).remove();
        }
        getCachedConfiguration({ type, key }) {
            const k = `${type}:${key}`;
            let cachedConfiguration = this.cachedConfigurations.get(k);
            if (!cachedConfiguration) {
                cachedConfiguration = new CachedConfiguration({ type, key }, this.cacheHome, this.fileService);
                this.cachedConfigurations.set(k, cachedConfiguration);
            }
            return cachedConfiguration;
        }
    }
    exports.ConfigurationCache = ConfigurationCache;
    class CachedConfiguration {
        constructor({ type, key }, cacheHome, fileService) {
            this.fileService = fileService;
            this.cachedConfigurationFolderResource = (0, resources_1.joinPath)(cacheHome, 'CachedConfigurations', type, key);
            this.cachedConfigurationFileResource = (0, resources_1.joinPath)(this.cachedConfigurationFolderResource, type === 'workspaces' ? 'workspace.json' : 'configuration.json');
            this.queue = new async_1.Queue();
        }
        async read() {
            try {
                const content = await this.fileService.readFile(this.cachedConfigurationFileResource);
                return content.value.toString();
            }
            catch (e) {
                return '';
            }
        }
        async save(content) {
            const created = await this.createCachedFolder();
            if (created) {
                await this.queue.queue(async () => {
                    await this.fileService.writeFile(this.cachedConfigurationFileResource, buffer_1.VSBuffer.fromString(content));
                });
            }
        }
        async remove() {
            try {
                await this.queue.queue(() => this.fileService.del(this.cachedConfigurationFolderResource, { recursive: true, useTrash: false }));
            }
            catch (error) {
                if (error.fileOperationResult !== 1 /* FileOperationResult.FILE_NOT_FOUND */) {
                    throw error;
                }
            }
        }
        async createCachedFolder() {
            if (await this.fileService.exists(this.cachedConfigurationFolderResource)) {
                return true;
            }
            try {
                await this.fileService.createFolder(this.cachedConfigurationFolderResource);
                return true;
            }
            catch (error) {
                return false;
            }
        }
    }
});
//# sourceMappingURL=configurationCache.js.map