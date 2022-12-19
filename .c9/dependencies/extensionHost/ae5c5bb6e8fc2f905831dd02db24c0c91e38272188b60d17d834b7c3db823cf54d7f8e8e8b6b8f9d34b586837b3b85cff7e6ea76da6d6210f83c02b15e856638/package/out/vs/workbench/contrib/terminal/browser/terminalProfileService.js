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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/terminal/common/terminalPlatformConfiguration", "vs/platform/terminal/common/terminalProfiles", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/common/terminalExtensionPoints", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, arrays_1, async_1, decorators_1, event_1, lifecycle_1, platform_1, configuration_1, contextkey_1, terminalPlatformConfiguration_1, terminalProfiles_1, terminal_1, terminalActions_1, terminalContextKey_1, terminalExtensionPoints_1, environmentService_1, extensions_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalProfileService = void 0;
    /*
    * Links TerminalService with TerminalProfileResolverService
    * and keeps the available terminal profiles updated
    */
    let TerminalProfileService = class TerminalProfileService {
        constructor(_contextKeyService, _configurationService, _terminalContributionService, _extensionService, _remoteAgentService, _environmentService, _terminalInstanceService) {
            this._contextKeyService = _contextKeyService;
            this._configurationService = _configurationService;
            this._terminalContributionService = _terminalContributionService;
            this._extensionService = _extensionService;
            this._remoteAgentService = _remoteAgentService;
            this._environmentService = _environmentService;
            this._terminalInstanceService = _terminalInstanceService;
            this._contributedProfiles = [];
            this._platformConfigJustRefreshed = false;
            this._profileProviders = new Map();
            this._onDidChangeAvailableProfiles = new event_1.Emitter();
            // in web, we don't want to show the dropdown unless there's a web extension
            // that contributes a profile
            this._extensionService.onDidChangeExtensions(() => this.refreshAvailableProfiles());
            this._webExtensionContributedProfileContextKey = terminalContextKey_1.TerminalContextKeys.webExtensionContributedProfile.bindTo(this._contextKeyService);
            this._updateWebContextKey();
            // Wait up to 5 seconds for profiles to be ready so it's assured that we know the actual
            // default terminal before launching the first terminal. This isn't expected to ever take
            // this long.
            this._profilesReadyBarrier = new async_1.AutoOpenBarrier(5000);
            this.refreshAvailableProfiles();
            this._setupConfigListener();
        }
        get onDidChangeAvailableProfiles() { return this._onDidChangeAvailableProfiles.event; }
        get profilesReady() { return this._profilesReadyBarrier.wait().then(() => { }); }
        get availableProfiles() {
            if (!this._platformConfigJustRefreshed) {
                this.refreshAvailableProfiles();
            }
            return this._availableProfiles || [];
        }
        get contributedProfiles() {
            return this._contributedProfiles || [];
        }
        async _setupConfigListener() {
            const platformKey = await this.getPlatformKey();
            this._configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration("terminal.integrated.defaultProfile." /* TerminalSettingPrefix.DefaultProfile */ + platformKey) ||
                    e.affectsConfiguration("terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */ + platformKey) ||
                    e.affectsConfiguration("terminal.integrated.useWslProfiles" /* TerminalSettingId.UseWslProfiles */)) {
                    if (e.source !== 6 /* ConfigurationTarget.DEFAULT */) {
                        // when _refreshPlatformConfig is called within refreshAvailableProfiles
                        // on did change configuration is fired. this can lead to an infinite recursion
                        this.refreshAvailableProfiles();
                        this._platformConfigJustRefreshed = false;
                    }
                    else {
                        this._platformConfigJustRefreshed = true;
                    }
                }
            });
        }
        getDefaultProfileName() {
            return this._defaultProfileName;
        }
        refreshAvailableProfiles() {
            this._refreshAvailableProfilesNow();
        }
        async _refreshAvailableProfilesNow() {
            const profiles = await this._detectProfiles(true);
            const profilesChanged = !((0, arrays_1.equals)(profiles, this._availableProfiles, profilesEqual));
            const contributedProfilesChanged = await this._updateContributedProfiles();
            if (profilesChanged || contributedProfilesChanged) {
                this._availableProfiles = profiles;
                this._onDidChangeAvailableProfiles.fire(this._availableProfiles);
                this._profilesReadyBarrier.open();
                this._updateWebContextKey();
                await this._refreshPlatformConfig(this._availableProfiles);
            }
        }
        async _updateContributedProfiles() {
            const platformKey = await this.getPlatformKey();
            const excludedContributedProfiles = [];
            const configProfiles = this._configurationService.getValue("terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */ + platformKey);
            for (const [profileName, value] of Object.entries(configProfiles)) {
                if (value === null) {
                    excludedContributedProfiles.push(profileName);
                }
            }
            const filteredContributedProfiles = Array.from(this._terminalContributionService.terminalProfiles.filter(p => !excludedContributedProfiles.includes(p.title)));
            const contributedProfilesChanged = !(0, arrays_1.equals)(filteredContributedProfiles, this._contributedProfiles, contributedProfilesEqual);
            this._contributedProfiles = filteredContributedProfiles;
            return contributedProfilesChanged;
        }
        getContributedProfileProvider(extensionIdentifier, id) {
            const extMap = this._profileProviders.get(extensionIdentifier);
            return extMap === null || extMap === void 0 ? void 0 : extMap.get(id);
        }
        async _detectProfiles(includeDetectedProfiles) {
            var _a;
            const primaryBackend = this._terminalInstanceService.getBackend(this._environmentService.remoteAuthority);
            if (!primaryBackend) {
                return this._availableProfiles || [];
            }
            const platform = await this.getPlatformKey();
            this._defaultProfileName = (_a = this._configurationService.getValue(`${"terminal.integrated.defaultProfile." /* TerminalSettingPrefix.DefaultProfile */}${platform}`)) !== null && _a !== void 0 ? _a : undefined;
            return primaryBackend.getProfiles(this._configurationService.getValue(`${"terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */}${platform}`), this._defaultProfileName, includeDetectedProfiles);
        }
        _updateWebContextKey() {
            this._webExtensionContributedProfileContextKey.set(platform_1.isWeb && this._contributedProfiles.length > 0);
        }
        async _refreshPlatformConfig(profiles) {
            const env = await this._remoteAgentService.getEnvironment();
            (0, terminalPlatformConfiguration_1.registerTerminalDefaultProfileConfiguration)({ os: (env === null || env === void 0 ? void 0 : env.os) || platform_1.OS, profiles }, this._contributedProfiles);
            (0, terminalActions_1.refreshTerminalActions)(profiles);
        }
        async getPlatformKey() {
            const env = await this._remoteAgentService.getEnvironment();
            if (env) {
                return env.os === 1 /* OperatingSystem.Windows */ ? 'windows' : (env.os === 2 /* OperatingSystem.Macintosh */ ? 'osx' : 'linux');
            }
            return platform_1.isWindows ? 'windows' : (platform_1.isMacintosh ? 'osx' : 'linux');
        }
        registerTerminalProfileProvider(extensionIdentifier, id, profileProvider) {
            let extMap = this._profileProviders.get(extensionIdentifier);
            if (!extMap) {
                extMap = new Map();
                this._profileProviders.set(extensionIdentifier, extMap);
            }
            extMap.set(id, profileProvider);
            return (0, lifecycle_1.toDisposable)(() => this._profileProviders.delete(id));
        }
        async registerContributedProfile(args) {
            const platformKey = await this.getPlatformKey();
            const profilesConfig = await this._configurationService.getValue(`${"terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */}${platformKey}`);
            if (typeof profilesConfig === 'object') {
                const newProfile = {
                    extensionIdentifier: args.extensionIdentifier,
                    icon: args.options.icon,
                    id: args.id,
                    title: args.title,
                    color: args.options.color
                };
                profilesConfig[args.title] = newProfile;
            }
            await this._configurationService.updateValue(`${"terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */}${platformKey}`, profilesConfig, 1 /* ConfigurationTarget.USER */);
            return;
        }
        async getContributedDefaultProfile(shellLaunchConfig) {
            // prevents recursion with the MainThreadTerminalService call to create terminal
            // and defers to the provided launch config when an executable is provided
            if (shellLaunchConfig && !shellLaunchConfig.extHostTerminalId && !('executable' in shellLaunchConfig)) {
                const key = await this.getPlatformKey();
                const defaultProfileName = this._configurationService.getValue(`${"terminal.integrated.defaultProfile." /* TerminalSettingPrefix.DefaultProfile */}${key}`);
                const contributedDefaultProfile = this.contributedProfiles.find(p => p.title === defaultProfileName);
                return contributedDefaultProfile;
            }
            return undefined;
        }
    };
    __decorate([
        (0, decorators_1.throttle)(2000)
    ], TerminalProfileService.prototype, "refreshAvailableProfiles", null);
    TerminalProfileService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, terminalExtensionPoints_1.ITerminalContributionService),
        __param(3, extensions_1.IExtensionService),
        __param(4, remoteAgentService_1.IRemoteAgentService),
        __param(5, environmentService_1.IWorkbenchEnvironmentService),
        __param(6, terminal_1.ITerminalInstanceService)
    ], TerminalProfileService);
    exports.TerminalProfileService = TerminalProfileService;
    function profilesEqual(one, other) {
        return one.profileName === other.profileName &&
            (0, terminalProfiles_1.terminalProfileArgsMatch)(one.args, other.args) &&
            one.color === other.color &&
            (0, terminalProfiles_1.terminalIconsEqual)(one.icon, other.icon) &&
            one.isAutoDetected === other.isAutoDetected &&
            one.isDefault === other.isDefault &&
            one.overrideName === other.overrideName &&
            one.path === other.path;
    }
    function contributedProfilesEqual(one, other) {
        return one.extensionIdentifier === other.extensionIdentifier &&
            one.color === other.color &&
            one.icon === other.icon &&
            one.id === other.id &&
            one.title === other.title;
    }
});
//# sourceMappingURL=terminalProfileService.js.map