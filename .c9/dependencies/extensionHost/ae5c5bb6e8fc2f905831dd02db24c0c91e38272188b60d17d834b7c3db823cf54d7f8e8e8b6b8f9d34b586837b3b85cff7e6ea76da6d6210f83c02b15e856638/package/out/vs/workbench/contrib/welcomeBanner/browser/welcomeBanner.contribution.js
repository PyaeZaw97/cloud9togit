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
define(["require", "exports", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/banner/browser/bannerService", "vs/platform/storage/common/storage", "vs/workbench/services/environment/browser/environmentService", "vs/base/common/uri", "vs/platform/theme/common/themeService"], function (require, exports, platform_1, contributions_1, bannerService_1, storage_1, environmentService_1, uri_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let WelcomeBannerContribution = class WelcomeBannerContribution {
        constructor(bannerService, storageService, environmentService) {
            var _a;
            const welcomeBanner = (_a = environmentService.options) === null || _a === void 0 ? void 0 : _a.welcomeBanner;
            if (!welcomeBanner) {
                return; // welcome banner is not enabled
            }
            if (storageService.getBoolean(WelcomeBannerContribution.WELCOME_BANNER_DISMISSED_KEY, 0 /* StorageScope.GLOBAL */, false)) {
                return; // welcome banner dismissed
            }
            let icon = undefined;
            if (typeof welcomeBanner.icon === 'string') {
                icon = themeService_1.ThemeIcon.fromId(welcomeBanner.icon);
            }
            else if (welcomeBanner.icon) {
                icon = uri_1.URI.revive(welcomeBanner.icon);
            }
            bannerService.show({
                id: 'welcome.banner',
                message: welcomeBanner.message,
                icon,
                actions: welcomeBanner.actions,
                onClose: () => {
                    storageService.store(WelcomeBannerContribution.WELCOME_BANNER_DISMISSED_KEY, true, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                }
            });
        }
    };
    WelcomeBannerContribution.WELCOME_BANNER_DISMISSED_KEY = 'workbench.banner.welcome.dismissed';
    WelcomeBannerContribution = __decorate([
        __param(0, bannerService_1.IBannerService),
        __param(1, storage_1.IStorageService),
        __param(2, environmentService_1.IBrowserWorkbenchEnvironmentService)
    ], WelcomeBannerContribution);
    platform_1.Registry.as(contributions_1.Extensions.Workbench)
        .registerWorkbenchContribution(WelcomeBannerContribution, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=welcomeBanner.contribution.js.map