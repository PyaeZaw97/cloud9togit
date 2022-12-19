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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/cancellation", "vs/base/common/collections", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/platform/extensionManagement/common/configRemotes", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/request/common/request"], function (require, exports, arrays_1, cancellation_1, collections_1, lifecycle_1, resources_1, configRemotes_1, files_1, log_1, productService_1, request_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionTipsService = void 0;
    let ExtensionTipsService = class ExtensionTipsService extends lifecycle_1.Disposable {
        constructor(fileService, productService, requestService, logService) {
            super();
            this.fileService = fileService;
            this.productService = productService;
            this.requestService = requestService;
            this.logService = logService;
            this.allConfigBasedTips = new Map();
            if (this.productService.configBasedExtensionTips) {
                (0, collections_1.forEach)(this.productService.configBasedExtensionTips, ({ value }) => this.allConfigBasedTips.set(value.configPath, value));
            }
        }
        getConfigBasedTips(folder) {
            return this.getValidConfigBasedTips(folder);
        }
        getAllWorkspacesTips() {
            return this.fetchWorkspacesTips();
        }
        async getImportantExecutableBasedTips() {
            return [];
        }
        async getOtherExecutableBasedTips() {
            return [];
        }
        async getValidConfigBasedTips(folder) {
            const result = [];
            for (const [configPath, tip] of this.allConfigBasedTips) {
                if (tip.configScheme && tip.configScheme !== folder.scheme) {
                    continue;
                }
                try {
                    const content = await this.fileService.readFile((0, resources_1.joinPath)(folder, configPath));
                    const recommendationByRemote = new Map();
                    (0, collections_1.forEach)(tip.recommendations, ({ key, value }) => {
                        if ((0, arrays_1.isNonEmptyArray)(value.remotes)) {
                            for (const remote of value.remotes) {
                                recommendationByRemote.set(remote, {
                                    extensionId: key,
                                    extensionName: value.name,
                                    configName: tip.configName,
                                    important: !!value.important,
                                    isExtensionPack: !!value.isExtensionPack,
                                    whenNotInstalled: value.whenNotInstalled
                                });
                            }
                        }
                        else {
                            result.push({
                                extensionId: key,
                                extensionName: value.name,
                                configName: tip.configName,
                                important: !!value.important,
                                isExtensionPack: !!value.isExtensionPack,
                                whenNotInstalled: value.whenNotInstalled
                            });
                        }
                    });
                    const domains = (0, configRemotes_1.getDomainsOfRemotes)(content.value.toString(), [...recommendationByRemote.keys()]);
                    for (const domain of domains) {
                        const remote = recommendationByRemote.get(domain);
                        if (remote) {
                            result.push(remote);
                        }
                    }
                }
                catch (error) { /* Ignore */ }
            }
            return result;
        }
        async fetchWorkspacesTips() {
            var _a, _b;
            if (!((_a = this.productService.extensionsGallery) === null || _a === void 0 ? void 0 : _a.recommendationsUrl)) {
                return [];
            }
            try {
                const context = await this.requestService.request({ type: 'GET', url: (_b = this.productService.extensionsGallery) === null || _b === void 0 ? void 0 : _b.recommendationsUrl }, cancellation_1.CancellationToken.None);
                if (context.res.statusCode !== 200) {
                    return [];
                }
                const result = await (0, request_1.asJson)(context);
                if (!result) {
                    return [];
                }
                return result.workspaceRecommendations || [];
            }
            catch (error) {
                this.logService.error(error);
                return [];
            }
        }
    };
    ExtensionTipsService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, productService_1.IProductService),
        __param(2, request_1.IRequestService),
        __param(3, log_1.ILogService)
    ], ExtensionTipsService);
    exports.ExtensionTipsService = ExtensionTipsService;
});
//# sourceMappingURL=extensionTipsService.js.map