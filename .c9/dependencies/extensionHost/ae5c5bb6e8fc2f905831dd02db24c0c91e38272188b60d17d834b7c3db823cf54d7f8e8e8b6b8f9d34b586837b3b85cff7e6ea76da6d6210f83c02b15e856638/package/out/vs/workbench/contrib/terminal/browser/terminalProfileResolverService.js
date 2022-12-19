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
define(["require", "exports", "vs/base/common/network", "vs/base/common/process", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/platform/log/common/log", "vs/platform/workspace/common/workspace", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/history/common/history", "vs/base/common/platform", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/path", "vs/base/common/codicons", "vs/workbench/services/remote/common/remoteAgentService", "vs/base/common/decorators", "vs/platform/theme/common/themeService", "vs/base/common/uri", "vs/base/common/arrays", "vs/platform/storage/common/storage", "vs/base/common/severity", "vs/platform/notification/common/notification", "vs/nls", "vs/base/common/objects", "vs/platform/terminal/common/terminalProfiles", "vs/workbench/contrib/terminal/browser/terminal"], function (require, exports, network_1, process_1, types_1, configuration_1, log_1, workspace_1, configurationResolver_1, history_1, platform_1, terminal_1, path, codicons_1, remoteAgentService_1, decorators_1, themeService_1, uri_1, arrays_1, storage_1, severity_1, notification_1, nls_1, objects_1, terminalProfiles_1, terminal_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserTerminalProfileResolverService = exports.BaseTerminalProfileResolverService = void 0;
    const generatedProfileName = 'Generated';
    /*
    * Resolves terminal shell launch config and terminal
    * profiles for the given operating system,
    * environment, and user configuration
    */
    const SHOULD_PROMPT_FOR_PROFILE_MIGRATION_KEY = 'terminals.integrated.profile-migration';
    let migrationMessageShown = false;
    class BaseTerminalProfileResolverService {
        constructor(_context, _configurationService, _configurationResolverService, _historyService, _logService, _terminalProfileService, _workspaceContextService, _remoteAgentService, _storageService, _notificationService) {
            this._context = _context;
            this._configurationService = _configurationService;
            this._configurationResolverService = _configurationResolverService;
            this._historyService = _historyService;
            this._logService = _logService;
            this._terminalProfileService = _terminalProfileService;
            this._workspaceContextService = _workspaceContextService;
            this._remoteAgentService = _remoteAgentService;
            this._storageService = _storageService;
            this._notificationService = _notificationService;
            if (this._remoteAgentService.getConnection()) {
                this._remoteAgentService.getEnvironment().then(env => this._primaryBackendOs = (env === null || env === void 0 ? void 0 : env.os) || platform_1.OS);
            }
            else {
                this._primaryBackendOs = platform_1.OS;
            }
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.defaultProfile.windows" /* TerminalSettingId.DefaultProfileWindows */) ||
                    e.affectsConfiguration("terminal.integrated.defaultProfile.osx" /* TerminalSettingId.DefaultProfileMacOs */) ||
                    e.affectsConfiguration("terminal.integrated.defaultProfile.linux" /* TerminalSettingId.DefaultProfileLinux */)) {
                    this._refreshDefaultProfileName();
                }
            });
            this._terminalProfileService.onDidChangeAvailableProfiles(() => this._refreshDefaultProfileName());
            this.showProfileMigrationNotification();
        }
        get defaultProfileName() { return this._defaultProfileName; }
        async _refreshDefaultProfileName() {
            var _a, _b;
            if (this._primaryBackendOs) {
                this._defaultProfileName = (_b = (await this.getDefaultProfile({
                    remoteAuthority: (_a = this._remoteAgentService.getConnection()) === null || _a === void 0 ? void 0 : _a.remoteAuthority,
                    os: this._primaryBackendOs
                }))) === null || _b === void 0 ? void 0 : _b.profileName;
            }
        }
        resolveIcon(shellLaunchConfig, os) {
            if (shellLaunchConfig.icon) {
                shellLaunchConfig.icon = this._getCustomIcon(shellLaunchConfig.icon) || codicons_1.Codicon.terminal;
                return;
            }
            if (shellLaunchConfig.customPtyImplementation) {
                shellLaunchConfig.icon = codicons_1.Codicon.terminal;
                return;
            }
            if (shellLaunchConfig.executable) {
                return;
            }
            const defaultProfile = this._getUnresolvedRealDefaultProfile(os);
            if (defaultProfile) {
                shellLaunchConfig.icon = defaultProfile.icon;
            }
        }
        async resolveShellLaunchConfig(shellLaunchConfig, options) {
            // Resolve the shell and shell args
            let resolvedProfile;
            if (shellLaunchConfig.executable) {
                resolvedProfile = await this._resolveProfile({
                    path: shellLaunchConfig.executable,
                    args: shellLaunchConfig.args,
                    profileName: generatedProfileName,
                    isDefault: false
                }, options);
            }
            else {
                resolvedProfile = await this.getDefaultProfile(options);
            }
            shellLaunchConfig.executable = resolvedProfile.path;
            shellLaunchConfig.args = resolvedProfile.args;
            if (resolvedProfile.env) {
                if (shellLaunchConfig.env) {
                    shellLaunchConfig.env = Object.assign(Object.assign({}, shellLaunchConfig.env), resolvedProfile.env);
                }
                else {
                    shellLaunchConfig.env = resolvedProfile.env;
                }
            }
            // Verify the icon is valid, and fallback correctly to the generic terminal id if there is
            // an issue
            shellLaunchConfig.icon = this._getCustomIcon(shellLaunchConfig.icon) || this._getCustomIcon(resolvedProfile.icon) || codicons_1.Codicon.terminal;
            // Override the name if specified
            if (resolvedProfile.overrideName) {
                shellLaunchConfig.name = resolvedProfile.profileName;
            }
            // Apply the color
            shellLaunchConfig.color = shellLaunchConfig.color || resolvedProfile.color;
            // Resolve useShellEnvironment based on the setting if it's not set
            if (shellLaunchConfig.useShellEnvironment === undefined) {
                shellLaunchConfig.useShellEnvironment = this._configurationService.getValue("terminal.integrated.inheritEnv" /* TerminalSettingId.InheritEnv */);
            }
        }
        async getDefaultShell(options) {
            return (await this.getDefaultProfile(options)).path;
        }
        async getDefaultShellArgs(options) {
            return (await this.getDefaultProfile(options)).args || [];
        }
        async getDefaultProfile(options) {
            return this._resolveProfile(await this._getUnresolvedDefaultProfile(options), options);
        }
        getEnvironment(remoteAuthority) {
            return this._context.getEnvironment(remoteAuthority);
        }
        _getCustomIcon(icon) {
            if (!icon) {
                return undefined;
            }
            if (typeof icon === 'string') {
                return themeService_1.ThemeIcon.fromId(icon);
            }
            if (themeService_1.ThemeIcon.isThemeIcon(icon)) {
                return icon;
            }
            if (uri_1.URI.isUri(icon) || (0, terminalProfiles_1.isUriComponents)(icon)) {
                return uri_1.URI.revive(icon);
            }
            if (typeof icon === 'object' && icon && 'light' in icon && 'dark' in icon) {
                const castedIcon = icon;
                if ((uri_1.URI.isUri(castedIcon.light) || (0, terminalProfiles_1.isUriComponents)(castedIcon.light)) && (uri_1.URI.isUri(castedIcon.dark) || (0, terminalProfiles_1.isUriComponents)(castedIcon.dark))) {
                    return { light: uri_1.URI.revive(castedIcon.light), dark: uri_1.URI.revive(castedIcon.dark) };
                }
            }
            return undefined;
        }
        async _getUnresolvedDefaultProfile(options) {
            // If automation shell is allowed, prefer that
            if (options.allowAutomationShell) {
                const automationShellProfile = this._getUnresolvedAutomationShellProfile(options);
                if (automationShellProfile) {
                    return automationShellProfile;
                }
            }
            // If either shell or shellArgs are specified, they will take priority for now until we
            // allow users to migrate, see https://github.com/microsoft/vscode/issues/123171
            const shellSettingProfile = await this._getUnresolvedShellSettingDefaultProfile(options);
            if (shellSettingProfile) {
                return this._setIconForAutomation(options, shellSettingProfile);
            }
            // Return the real default profile if it exists and is valid, wait for profiles to be ready
            // if the window just opened
            await this._terminalProfileService.profilesReady;
            const defaultProfile = this._getUnresolvedRealDefaultProfile(options.os);
            if (defaultProfile) {
                return this._setIconForAutomation(options, defaultProfile);
            }
            // If there is no real default profile, create a fallback default profile based on the shell
            // and shellArgs settings in addition to the current environment.
            return this._setIconForAutomation(options, await this._getUnresolvedFallbackDefaultProfile(options));
        }
        _setIconForAutomation(options, profile) {
            if (options.allowAutomationShell) {
                const profileClone = (0, objects_1.deepClone)(profile);
                profileClone.icon = codicons_1.Codicon.tools;
                return profileClone;
            }
            return profile;
        }
        _getUnresolvedRealDefaultProfile(os) {
            const defaultProfileName = this._configurationService.getValue(`${"terminal.integrated.defaultProfile." /* TerminalSettingPrefix.DefaultProfile */}${this._getOsKey(os)}`);
            if (defaultProfileName && typeof defaultProfileName === 'string') {
                return this._terminalProfileService.availableProfiles.find(e => e.profileName === defaultProfileName);
            }
            return undefined;
        }
        async _getUnresolvedShellSettingDefaultProfile(options) {
            let executable = this._configurationService.getValue(`${"terminal.integrated.shell." /* TerminalSettingPrefix.Shell */}${this._getOsKey(options.os)}`);
            if (!this._isValidShell(executable)) {
                const shellArgs = this._configurationService.inspect(`${"terminal.integrated.shellArgs." /* TerminalSettingPrefix.ShellArgs */}${this._getOsKey(options.os)}`);
                //  && !this.getSafeConfigValue('shellArgs', options.os, false)) {
                if (!shellArgs.userValue && !shellArgs.workspaceValue) {
                    return undefined;
                }
            }
            if (!executable || !this._isValidShell(executable)) {
                executable = await this._context.getDefaultSystemShell(options.remoteAuthority, options.os);
            }
            let args;
            const shellArgsSetting = this._configurationService.getValue(`${"terminal.integrated.shellArgs." /* TerminalSettingPrefix.ShellArgs */}${this._getOsKey(options.os)}`);
            if (this._isValidShellArgs(shellArgsSetting, options.os)) {
                args = shellArgsSetting;
            }
            if (args === undefined) {
                if (options.os === 2 /* OperatingSystem.Macintosh */ && args === undefined && path.parse(executable).name.match(/(zsh|bash|fish)/)) {
                    // macOS should launch a login shell by default
                    args = ['--login'];
                }
                else {
                    // Resolve undefined to []
                    args = [];
                }
            }
            const icon = this._guessProfileIcon(executable);
            return {
                profileName: generatedProfileName,
                path: executable,
                args,
                icon,
                isDefault: false
            };
        }
        async _getUnresolvedFallbackDefaultProfile(options) {
            const executable = await this._context.getDefaultSystemShell(options.remoteAuthority, options.os);
            // Try select an existing profile to fallback to, based on the default system shell
            let existingProfile = this._terminalProfileService.availableProfiles.find(e => path.parse(e.path).name === path.parse(executable).name);
            if (existingProfile) {
                if (options.allowAutomationShell) {
                    existingProfile = (0, objects_1.deepClone)(existingProfile);
                    existingProfile.icon = codicons_1.Codicon.tools;
                }
                return existingProfile;
            }
            // Finally fallback to a generated profile
            let args;
            if (options.os === 2 /* OperatingSystem.Macintosh */ && path.parse(executable).name.match(/(zsh|bash)/)) {
                // macOS should launch a login shell by default
                args = ['--login'];
            }
            else {
                // Resolve undefined to []
                args = [];
            }
            const icon = this._guessProfileIcon(executable);
            return {
                profileName: generatedProfileName,
                path: executable,
                args,
                icon,
                isDefault: false
            };
        }
        _getUnresolvedAutomationShellProfile(options) {
            const automationShell = this._configurationService.getValue(`terminal.integrated.automationShell.${this._getOsKey(options.os)}`);
            if (automationShell && typeof automationShell === 'string') {
                return {
                    path: automationShell,
                    profileName: generatedProfileName,
                    isDefault: false,
                    icon: codicons_1.Codicon.tools
                };
            }
            // Use automationProfile second
            const automationProfile = this._configurationService.getValue(`terminal.integrated.automationProfile.${this._getOsKey(options.os)}`);
            if (this._isValidAutomationProfile(automationProfile, options.os)) {
                automationProfile.icon = this._getCustomIcon(automationProfile.icon) || codicons_1.Codicon.tools;
                return automationProfile;
            }
            return undefined;
        }
        async _resolveProfile(profile, options) {
            if (options.os === 1 /* OperatingSystem.Windows */) {
                // Change Sysnative to System32 if the OS is Windows but NOT WoW64. It's
                // safe to assume that this was used by accident as Sysnative does not
                // exist and will break the terminal in non-WoW64 environments.
                const env = await this._context.getEnvironment(options.remoteAuthority);
                const isWoW64 = !!env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
                const windir = env.windir;
                if (!isWoW64 && windir) {
                    const sysnativePath = path.join(windir, 'Sysnative').replace(/\//g, '\\').toLowerCase();
                    if (profile.path && profile.path.toLowerCase().indexOf(sysnativePath) === 0) {
                        profile.path = path.join(windir, 'System32', profile.path.substr(sysnativePath.length + 1));
                    }
                }
                // Convert / to \ on Windows for convenience
                if (profile.path) {
                    profile.path = profile.path.replace(/\//g, '\\');
                }
            }
            // Resolve path variables
            const env = await this._context.getEnvironment(options.remoteAuthority);
            const activeWorkspaceRootUri = this._historyService.getLastActiveWorkspaceRoot(options.remoteAuthority ? network_1.Schemas.vscodeRemote : network_1.Schemas.file);
            const lastActiveWorkspace = activeWorkspaceRootUri ? (0, types_1.withNullAsUndefined)(this._workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri)) : undefined;
            profile.path = await this._resolveVariables(profile.path, env, lastActiveWorkspace);
            // Resolve args variables
            if (profile.args) {
                if (typeof profile.args === 'string') {
                    profile.args = await this._resolveVariables(profile.args, env, lastActiveWorkspace);
                }
                else {
                    profile.args = await Promise.all(profile.args.map(arg => this._resolveVariables(arg, env, lastActiveWorkspace)));
                }
            }
            return profile;
        }
        async _resolveVariables(value, env, lastActiveWorkspace) {
            try {
                value = await this._configurationResolverService.resolveWithEnvironment(env, lastActiveWorkspace, value);
            }
            catch (e) {
                this._logService.error(`Could not resolve shell`, e);
            }
            return value;
        }
        _getOsKey(os) {
            switch (os) {
                case 3 /* OperatingSystem.Linux */: return 'linux';
                case 2 /* OperatingSystem.Macintosh */: return 'osx';
                case 1 /* OperatingSystem.Windows */: return 'windows';
            }
        }
        _guessProfileIcon(shell) {
            const file = path.parse(shell).name;
            switch (file) {
                case 'bash':
                    return codicons_1.Codicon.terminalBash;
                case 'pwsh':
                case 'powershell':
                    return codicons_1.Codicon.terminalPowershell;
                case 'tmux':
                    return codicons_1.Codicon.terminalTmux;
                case 'cmd':
                    return codicons_1.Codicon.terminalCmd;
                default:
                    return undefined;
            }
        }
        _isValidShell(shell) {
            if (!shell) {
                return false;
            }
            return typeof shell === 'string';
        }
        _isValidShellArgs(shellArgs, os) {
            if (shellArgs === undefined) {
                return true;
            }
            if (os === 1 /* OperatingSystem.Windows */ && typeof shellArgs === 'string') {
                return true;
            }
            if (Array.isArray(shellArgs) && shellArgs.every(e => typeof e === 'string')) {
                return true;
            }
            return false;
        }
        async createProfileFromShellAndShellArgs(shell, shellArgs) {
            var _a, _b;
            const detectedProfile = (_a = this._terminalProfileService.availableProfiles) === null || _a === void 0 ? void 0 : _a.find(p => {
                if (p.path !== shell) {
                    return false;
                }
                if (p.args === undefined || typeof p.args === 'string') {
                    return p.args === shellArgs;
                }
                return p.path === shell && (0, arrays_1.equals)(p.args, (shellArgs || []));
            });
            const fallbackProfile = (await this.getDefaultProfile({
                remoteAuthority: (_b = this._remoteAgentService.getConnection()) === null || _b === void 0 ? void 0 : _b.remoteAuthority,
                os: this._primaryBackendOs
            }));
            fallbackProfile.profileName = `${fallbackProfile.path} (migrated)`;
            const profile = detectedProfile || fallbackProfile;
            const args = this._isValidShellArgs(shellArgs, this._primaryBackendOs) ? shellArgs : profile.args;
            const createdProfile = {
                profileName: profile.profileName,
                path: profile.path,
                args,
                isDefault: true
            };
            if (detectedProfile && detectedProfile.profileName === createdProfile.profileName && detectedProfile.path === createdProfile.path && (0, terminalProfiles_1.terminalProfileArgsMatch)(detectedProfile.args, createdProfile.args)) {
                return detectedProfile.profileName;
            }
            return createdProfile;
        }
        _isValidAutomationProfile(profile, os) {
            if (!profile === undefined || typeof profile !== 'object' || profile === null) {
                return false;
            }
            if ('path' in profile && typeof profile.path === 'string') {
                return true;
            }
            return false;
        }
        async showProfileMigrationNotification() {
            const shouldMigrateToProfile = (!!this._configurationService.getValue("terminal.integrated.shell." /* TerminalSettingPrefix.Shell */ + this._primaryBackendOs) ||
                !!this._configurationService.inspect("terminal.integrated.shellArgs." /* TerminalSettingPrefix.ShellArgs */ + this._primaryBackendOs).userValue) &&
                !!this._configurationService.getValue("terminal.integrated.defaultProfile." /* TerminalSettingPrefix.DefaultProfile */ + this._primaryBackendOs);
            if (shouldMigrateToProfile && this._storageService.getBoolean(SHOULD_PROMPT_FOR_PROFILE_MIGRATION_KEY, 1 /* StorageScope.WORKSPACE */, true) && !migrationMessageShown) {
                this._notificationService.prompt(severity_1.default.Info, (0, nls_1.localize)('terminalProfileMigration', "The terminal is using deprecated shell/shellArgs settings, do you want to migrate it to a profile?"), [
                    {
                        label: (0, nls_1.localize)('migrateToProfile', "Migrate"),
                        run: async () => {
                            const shell = this._configurationService.getValue("terminal.integrated.shell." /* TerminalSettingPrefix.Shell */ + this._primaryBackendOs);
                            const shellArgs = this._configurationService.getValue("terminal.integrated.shellArgs." /* TerminalSettingPrefix.ShellArgs */ + this._primaryBackendOs);
                            const profile = await this.createProfileFromShellAndShellArgs(shell, shellArgs);
                            if (typeof profile === 'string') {
                                await this._configurationService.updateValue("terminal.integrated.defaultProfile." /* TerminalSettingPrefix.DefaultProfile */ + this._primaryBackendOs, profile);
                                this._logService.trace(`migrated from shell/shellArgs, using existing profile ${profile}`);
                            }
                            else {
                                const profiles = Object.assign({}, this._configurationService.inspect("terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */ + this._primaryBackendOs).userValue) || {};
                                const profileConfig = { path: profile.path };
                                if (profile.args) {
                                    profileConfig.args = profile.args;
                                }
                                profiles[profile.profileName] = profileConfig;
                                await this._configurationService.updateValue("terminal.integrated.profiles." /* TerminalSettingPrefix.Profiles */ + this._primaryBackendOs, profiles);
                                await this._configurationService.updateValue("terminal.integrated.defaultProfile." /* TerminalSettingPrefix.DefaultProfile */ + this._primaryBackendOs, profile.profileName);
                                this._logService.trace(`migrated from shell/shellArgs, ${shell} ${shellArgs} to profile ${JSON.stringify(profile)}`);
                            }
                            await this._configurationService.updateValue("terminal.integrated.shell." /* TerminalSettingPrefix.Shell */ + this._primaryBackendOs, undefined);
                            await this._configurationService.updateValue("terminal.integrated.shellArgs." /* TerminalSettingPrefix.ShellArgs */ + this._primaryBackendOs, undefined);
                        }
                    },
                ], {
                    neverShowAgain: { id: SHOULD_PROMPT_FOR_PROFILE_MIGRATION_KEY, scope: notification_1.NeverShowAgainScope.WORKSPACE }
                });
                migrationMessageShown = true;
            }
        }
    }
    __decorate([
        (0, decorators_1.debounce)(200)
    ], BaseTerminalProfileResolverService.prototype, "_refreshDefaultProfileName", null);
    exports.BaseTerminalProfileResolverService = BaseTerminalProfileResolverService;
    let BrowserTerminalProfileResolverService = class BrowserTerminalProfileResolverService extends BaseTerminalProfileResolverService {
        constructor(configurationResolverService, configurationService, historyService, logService, terminalInstanceService, terminalProfileService, workspaceContextService, remoteAgentService, storageService, notificationService) {
            super({
                getDefaultSystemShell: async (remoteAuthority, os) => {
                    const backend = terminalInstanceService.getBackend(remoteAuthority);
                    if (!remoteAuthority || !backend) {
                        // Just return basic values, this is only for serverless web and wouldn't be used
                        return os === 1 /* OperatingSystem.Windows */ ? 'pwsh' : 'bash';
                    }
                    return backend.getDefaultSystemShell(os);
                },
                getEnvironment: async (remoteAuthority) => {
                    const backend = terminalInstanceService.getBackend(remoteAuthority);
                    if (!remoteAuthority || !backend) {
                        return process_1.env;
                    }
                    return backend.getEnvironment();
                }
            }, configurationService, configurationResolverService, historyService, logService, terminalProfileService, workspaceContextService, remoteAgentService, storageService, notificationService);
        }
    };
    BrowserTerminalProfileResolverService = __decorate([
        __param(0, configurationResolver_1.IConfigurationResolverService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, history_1.IHistoryService),
        __param(3, log_1.ILogService),
        __param(4, terminal_2.ITerminalInstanceService),
        __param(5, terminal_1.ITerminalProfileService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, remoteAgentService_1.IRemoteAgentService),
        __param(8, storage_1.IStorageService),
        __param(9, notification_1.INotificationService)
    ], BrowserTerminalProfileResolverService);
    exports.BrowserTerminalProfileResolverService = BrowserTerminalProfileResolverService;
});
//# sourceMappingURL=terminalProfileResolverService.js.map