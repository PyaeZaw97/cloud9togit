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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/log/common/log", "vs/platform/product/common/productService"], function (require, exports, async_1, errors_1, lifecycle_1, path_1, pfs_1, log_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeCacheCleaner = void 0;
    let CodeCacheCleaner = class CodeCacheCleaner extends lifecycle_1.Disposable {
        constructor(currentCodeCachePath, productService, logService) {
            super();
            this.productService = productService;
            this.logService = logService;
            this._DataMaxAge = this.productService.quality !== 'stable'
                ? 1000 * 60 * 60 * 24 * 7 // roughly 1 week (insiders)
                : 1000 * 60 * 60 * 24 * 30 * 3; // roughly 3 months (stable)
            // Cached data is stored as user data and we run a cleanup task every time
            // the editor starts. The strategy is to delete all files that are older than
            // 3 months (1 week respectively)
            if (currentCodeCachePath) {
                const scheduler = this._register(new async_1.RunOnceScheduler(() => {
                    this.cleanUpCodeCaches(currentCodeCachePath);
                }, 30 * 1000 /* after 30s */));
                scheduler.schedule();
            }
        }
        async cleanUpCodeCaches(currentCodeCachePath) {
            this.logService.trace('[code cache cleanup]: Starting to clean up old code cache folders.');
            try {
                const now = Date.now();
                // The folder which contains folders of cached data.
                // Each of these folders is partioned per commit
                const codeCacheRootPath = (0, path_1.dirname)(currentCodeCachePath);
                const currentCodeCache = (0, path_1.basename)(currentCodeCachePath);
                const codeCaches = await pfs_1.Promises.readdir(codeCacheRootPath);
                await Promise.all(codeCaches.map(async (codeCache) => {
                    if (codeCache === currentCodeCache) {
                        return; // not the current cache folder
                    }
                    // Delete cache folder if old enough
                    const codeCacheEntryPath = (0, path_1.join)(codeCacheRootPath, codeCache);
                    const codeCacheEntryStat = await pfs_1.Promises.stat(codeCacheEntryPath);
                    if (codeCacheEntryStat.isDirectory() && (now - codeCacheEntryStat.mtime.getTime()) > this._DataMaxAge) {
                        this.logService.trace(`[code cache cleanup]: Removing code cache folder ${codeCache}.`);
                        return pfs_1.Promises.rm(codeCacheEntryPath);
                    }
                }));
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
            }
        }
    };
    CodeCacheCleaner = __decorate([
        __param(1, productService_1.IProductService),
        __param(2, log_1.ILogService)
    ], CodeCacheCleaner);
    exports.CodeCacheCleaner = CodeCacheCleaner;
});
//# sourceMappingURL=codeCacheCleaner.js.map