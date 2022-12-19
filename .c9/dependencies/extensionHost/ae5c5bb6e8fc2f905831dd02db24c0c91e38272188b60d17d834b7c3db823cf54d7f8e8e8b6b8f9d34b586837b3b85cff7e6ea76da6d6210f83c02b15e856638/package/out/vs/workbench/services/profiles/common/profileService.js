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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/workbench/services/profiles/common/extensionsProfile", "vs/workbench/services/profiles/common/globalStateProfile", "vs/workbench/services/profiles/common/profile", "vs/workbench/services/profiles/common/settingsProfile"], function (require, exports, nls_1, extensions_1, instantiation_1, notification_1, progress_1, extensionsProfile_1, globalStateProfile_1, profile_1, settingsProfile_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchProfileService = void 0;
    let WorkbenchProfileService = class WorkbenchProfileService {
        constructor(instantiationService, progressService, notificationService) {
            this.progressService = progressService;
            this.notificationService = notificationService;
            this.settingsProfile = instantiationService.createInstance(settingsProfile_1.SettingsProfile);
            this.globalStateProfile = instantiationService.createInstance(globalStateProfile_1.GlobalStateProfile);
            this.extensionsProfile = instantiationService.createInstance(extensionsProfile_1.ExtensionsProfile);
        }
        async createProfile(options) {
            const settings = await this.settingsProfile.getProfileContent(options);
            const globalState = await this.globalStateProfile.getProfileContent();
            const extensions = await this.extensionsProfile.getProfileContent();
            return {
                settings,
                globalState,
                extensions
            };
        }
        async setProfile(profile) {
            await this.progressService.withProgress({
                location: 15 /* ProgressLocation.Notification */,
                title: (0, nls_1.localize)('profiles.applying', "{0}: Applying...", profile_1.PROFILES_CATEGORY),
            }, async (progress) => {
                if (profile.settings) {
                    await this.settingsProfile.applyProfile(profile.settings);
                }
                if (profile.globalState) {
                    await this.globalStateProfile.applyProfile(profile.globalState);
                }
                if (profile.extensions) {
                    await this.extensionsProfile.applyProfile(profile.extensions);
                }
            });
            this.notificationService.info((0, nls_1.localize)('applied profile', "{0}: Applied successfully.", profile_1.PROFILES_CATEGORY));
        }
    };
    WorkbenchProfileService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, progress_1.IProgressService),
        __param(2, notification_1.INotificationService)
    ], WorkbenchProfileService);
    exports.WorkbenchProfileService = WorkbenchProfileService;
    (0, extensions_1.registerSingleton)(profile_1.IWorkbenchProfileService, WorkbenchProfileService);
});
//# sourceMappingURL=profileService.js.map