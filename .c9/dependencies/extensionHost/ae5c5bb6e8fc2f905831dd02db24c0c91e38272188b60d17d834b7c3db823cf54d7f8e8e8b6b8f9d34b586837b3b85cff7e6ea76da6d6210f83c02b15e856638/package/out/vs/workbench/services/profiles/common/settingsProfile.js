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
define(["require", "exports", "vs/base/common/buffer", "vs/platform/configuration/common/configurationRegistry", "vs/platform/environment/common/environment", "vs/platform/files/common/files", "vs/platform/log/common/log", "vs/platform/registry/common/platform", "vs/platform/userDataSync/common/settingsMerge", "vs/platform/userDataSync/common/userDataSync"], function (require, exports, buffer_1, configurationRegistry_1, environment_1, files_1, log_1, platform_1, settingsMerge_1, userDataSync_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsProfile = void 0;
    let SettingsProfile = class SettingsProfile {
        constructor(fileService, environmentService, userDataSyncUtilService, logService) {
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.userDataSyncUtilService = userDataSyncUtilService;
            this.logService = logService;
        }
        async getProfileContent(options) {
            const ignoredSettings = this.getIgnoredSettings();
            const formattingOptions = await this.userDataSyncUtilService.resolveFormattingOptions(this.environmentService.settingsResource);
            const localContent = await this.getLocalFileContent();
            let settingsProfileContent = (0, settingsMerge_1.updateIgnoredSettings)(localContent || '{}', '{}', ignoredSettings, formattingOptions);
            if (options === null || options === void 0 ? void 0 : options.skipComments) {
                settingsProfileContent = (0, settingsMerge_1.removeComments)(settingsProfileContent, formattingOptions);
            }
            const settingsContent = {
                settings: settingsProfileContent
            };
            return JSON.stringify(settingsContent);
        }
        async applyProfile(content) {
            const settingsContent = JSON.parse(content);
            this.logService.trace(`Profile: Applying settings...`);
            const localSettingsContent = await this.getLocalFileContent();
            const formattingOptions = await this.userDataSyncUtilService.resolveFormattingOptions(this.environmentService.settingsResource);
            const contentToUpdate = (0, settingsMerge_1.updateIgnoredSettings)(settingsContent.settings, localSettingsContent || '{}', this.getIgnoredSettings(), formattingOptions);
            await this.fileService.writeFile(this.environmentService.settingsResource, buffer_1.VSBuffer.fromString(contentToUpdate));
            this.logService.info(`Profile: Applied settings`);
        }
        getIgnoredSettings() {
            const allSettings = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration).getConfigurationProperties();
            const ignoredSettings = Object.keys(allSettings).filter(key => { var _a, _b; return ((_a = allSettings[key]) === null || _a === void 0 ? void 0 : _a.scope) === 2 /* ConfigurationScope.MACHINE */ || ((_b = allSettings[key]) === null || _b === void 0 ? void 0 : _b.scope) === 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */; });
            return ignoredSettings;
        }
        async getLocalFileContent() {
            try {
                const content = await this.fileService.readFile(this.environmentService.settingsResource);
                return content.value.toString();
            }
            catch (error) {
                return null;
            }
        }
    };
    SettingsProfile = __decorate([
        __param(0, files_1.IFileService),
        __param(1, environment_1.IEnvironmentService),
        __param(2, userDataSync_1.IUserDataSyncUtilService),
        __param(3, log_1.ILogService)
    ], SettingsProfile);
    exports.SettingsProfile = SettingsProfile;
});
//# sourceMappingURL=settingsProfile.js.map