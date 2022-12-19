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
define(["require", "exports", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/product/common/productService"], function (require, exports, async_1, errors_1, lifecycle_1, path_1, pfs_1, environment_1, log_1, productService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LanguagePackCachedDataCleaner = void 0;
    let LanguagePackCachedDataCleaner = class LanguagePackCachedDataCleaner extends lifecycle_1.Disposable {
        constructor(environmentService, logService, productService) {
            super();
            this.environmentService = environmentService;
            this.logService = logService;
            this.productService = productService;
            this._DataMaxAge = this.productService.quality !== 'stable'
                ? 1000 * 60 * 60 * 24 * 7 // roughly 1 week (insiders)
                : 1000 * 60 * 60 * 24 * 30 * 3; // roughly 3 months (stable)
            // We have no Language pack support for dev version (run from source)
            // So only cleanup when we have a build version.
            if (this.environmentService.isBuilt) {
                const scheduler = this._register(new async_1.RunOnceScheduler(() => {
                    this.cleanUpLanguagePackCache();
                }, 40 * 1000 /* after 40s */));
                scheduler.schedule();
            }
        }
        async cleanUpLanguagePackCache() {
            this.logService.trace('[language pack cache cleanup]: Starting to clean up unused language packs.');
            try {
                const installed = Object.create(null);
                const metaData = JSON.parse(await pfs_1.Promises.readFile((0, path_1.join)(this.environmentService.userDataPath, 'languagepacks.json'), 'utf8'));
                for (let locale of Object.keys(metaData)) {
                    const entry = metaData[locale];
                    installed[`${entry.hash}.${locale}`] = true;
                }
                // Cleanup entries for language packs that aren't installed anymore
                const cacheDir = (0, path_1.join)(this.environmentService.userDataPath, 'clp');
                const cacheDirExists = await pfs_1.Promises.exists(cacheDir);
                if (!cacheDirExists) {
                    return;
                }
                const entries = await pfs_1.Promises.readdir(cacheDir);
                for (const entry of entries) {
                    if (installed[entry]) {
                        this.logService.trace(`[language pack cache cleanup]: Skipping folder ${entry}. Language pack still in use.`);
                        continue;
                    }
                    this.logService.trace(`[language pack cache cleanup]: Removing unused language pack: ${entry}`);
                    await pfs_1.Promises.rm((0, path_1.join)(cacheDir, entry));
                }
                const now = Date.now();
                for (const packEntry of Object.keys(installed)) {
                    const folder = (0, path_1.join)(cacheDir, packEntry);
                    const entries = await pfs_1.Promises.readdir(folder);
                    for (const entry of entries) {
                        if (entry === 'tcf.json') {
                            continue;
                        }
                        const candidate = (0, path_1.join)(folder, entry);
                        const stat = await pfs_1.Promises.stat(candidate);
                        if (stat.isDirectory() && (now - stat.mtime.getTime()) > this._DataMaxAge) {
                            this.logService.trace(`[language pack cache cleanup]: Removing language pack cache folder: ${(0, path_1.join)(packEntry, entry)}`);
                            await pfs_1.Promises.rm(candidate);
                        }
                    }
                }
            }
            catch (error) {
                (0, errors_1.onUnexpectedError)(error);
            }
        }
    };
    LanguagePackCachedDataCleaner = __decorate([
        __param(0, environment_1.INativeEnvironmentService),
        __param(1, log_1.ILogService),
        __param(2, productService_1.IProductService)
    ], LanguagePackCachedDataCleaner);
    exports.LanguagePackCachedDataCleaner = LanguagePackCachedDataCleaner;
});
//# sourceMappingURL=languagePackCachedDataCleaner.js.map