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
define(["require", "exports", "vs/base/common/cancellation", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/log/common/log", "vs/workbench/services/extensionManagement/common/extensionManagement"], function (require, exports, cancellation_1, extensionManagement_1, extensionManagementUtil_1, log_1, extensionManagement_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsProfile = void 0;
    let ExtensionsProfile = class ExtensionsProfile {
        constructor(extensionManagementService, extensionEnablementService, extensionGalleryService, logService) {
            this.extensionManagementService = extensionManagementService;
            this.extensionEnablementService = extensionEnablementService;
            this.extensionGalleryService = extensionGalleryService;
            this.logService = logService;
        }
        async getProfileContent() {
            const extensions = await this.getLocalExtensions();
            return JSON.stringify(extensions);
        }
        async applyProfile(content) {
            const profileExtensions = JSON.parse(content);
            const installedExtensions = await this.extensionManagementService.getInstalled();
            const extensionsToEnableOrDisable = [];
            const extensionsToInstall = [];
            for (const e of profileExtensions) {
                const installedExtension = installedExtensions.find(installed => (0, extensionManagementUtil_1.areSameExtensions)(installed.identifier, e.identifier));
                if (!installedExtension || installedExtension.preRelease !== e.preRelease) {
                    extensionsToInstall.push(e);
                }
                if (installedExtension && this.extensionEnablementService.isEnabled(installedExtension) !== !e.disabled) {
                    extensionsToEnableOrDisable.push({ extension: installedExtension, enablementState: e.disabled ? 6 /* EnablementState.DisabledGlobally */ : 8 /* EnablementState.EnabledGlobally */ });
                }
            }
            const extensionsToUninstall = installedExtensions.filter(extension => extension.type === 1 /* ExtensionType.User */ && !profileExtensions.some(({ identifier }) => (0, extensionManagementUtil_1.areSameExtensions)(identifier, extension.identifier)));
            for (const { extension, enablementState } of extensionsToEnableOrDisable) {
                this.logService.trace(`Profile: Updating extension enablement...`, extension.identifier.id);
                await this.extensionEnablementService.setEnablement([extension], enablementState);
                this.logService.info(`Profile: Updated extension enablement`, extension.identifier.id);
            }
            if (extensionsToInstall.length) {
                const galleryExtensions = await this.extensionGalleryService.getExtensions(extensionsToInstall.map(e => (Object.assign(Object.assign({}, e.identifier), { hasPreRelease: e.preRelease }))), cancellation_1.CancellationToken.None);
                await Promise.all(extensionsToInstall.map(async (e) => {
                    const extension = galleryExtensions.find(galleryExtension => (0, extensionManagementUtil_1.areSameExtensions)(galleryExtension.identifier, e.identifier));
                    if (!extension) {
                        return;
                    }
                    if (await this.extensionManagementService.canInstall(extension)) {
                        this.logService.trace(`Profile: Installing extension...`, e.identifier.id, extension.version);
                        await this.extensionManagementService.installFromGallery(extension, { isMachineScoped: false, donotIncludePackAndDependencies: true, installPreReleaseVersion: e.preRelease } /* set isMachineScoped value to prevent install and sync dialog in web */);
                        this.logService.info(`Profile: Installed extension.`, e.identifier.id, extension.version);
                    }
                    else {
                        this.logService.info(`Profile: Skipped installing extension because it cannot be installed.`, extension.displayName || extension.identifier.id);
                    }
                }));
            }
            if (extensionsToUninstall.length) {
                await Promise.all(extensionsToUninstall.map(e => this.extensionManagementService.uninstall(e)));
            }
        }
        async getLocalExtensions() {
            const result = [];
            const installedExtensions = await this.extensionManagementService.getInstalled(undefined, true);
            for (const extension of installedExtensions) {
                const { identifier, preRelease } = extension;
                const enablementState = this.extensionEnablementService.getEnablementState(extension);
                const disabled = !this.extensionEnablementService.isEnabledEnablementState(enablementState);
                if (!disabled && extension.type === 0 /* ExtensionType.System */) {
                    // skip enabled system extensions
                    continue;
                }
                if (disabled && enablementState !== 6 /* EnablementState.DisabledGlobally */ && enablementState !== 7 /* EnablementState.DisabledWorkspace */) {
                    //skip extensions that are not disabled by user
                    continue;
                }
                const profileExtension = { identifier };
                if (disabled) {
                    profileExtension.disabled = true;
                }
                if (preRelease) {
                    profileExtension.preRelease = true;
                }
                result.push(profileExtension);
            }
            return result;
        }
    };
    ExtensionsProfile = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, extensionManagement_2.IWorkbenchExtensionEnablementService),
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, log_1.ILogService)
    ], ExtensionsProfile);
    exports.ExtensionsProfile = ExtensionsProfile;
});
//# sourceMappingURL=extensionsProfile.js.map