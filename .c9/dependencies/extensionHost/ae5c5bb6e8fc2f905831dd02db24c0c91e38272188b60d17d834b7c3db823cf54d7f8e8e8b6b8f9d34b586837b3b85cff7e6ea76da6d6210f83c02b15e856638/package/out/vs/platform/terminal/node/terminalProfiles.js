/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
define(["require", "exports", "child_process", "vs/base/common/codicons", "vs/base/common/path", "vs/base/common/platform", "vs/base/node/pfs", "vs/base/node/powershell", "vs/platform/terminal/node/terminalEnvironment", "vs/platform/theme/common/themeService"], function (require, exports, cp, codicons_1, path_1, platform_1, pfs, powershell_1, terminalEnvironment_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.detectAvailableProfiles = void 0;
    let profileSources;
    let logIfWslNotInstalled = true;
    function detectAvailableProfiles(profiles, defaultProfile, includeDetectedProfiles, configurationService, shellEnv = process.env, fsProvider, logService, variableResolver, testPwshSourcePaths) {
        fsProvider = fsProvider || {
            existsFile: pfs.SymlinkSupport.existsFile,
            readFile: pfs.Promises.readFile
        };
        if (platform_1.isWindows) {
            return detectAvailableWindowsProfiles(includeDetectedProfiles, fsProvider, shellEnv, logService, configurationService.getValue("terminal.integrated.useWslProfiles" /* TerminalSettingId.UseWslProfiles */) !== false, profiles && typeof profiles === 'object' ? Object.assign({}, profiles) : configurationService.getValue("terminal.integrated.profiles.windows" /* TerminalSettingId.ProfilesWindows */), typeof defaultProfile === 'string' ? defaultProfile : configurationService.getValue("terminal.integrated.defaultProfile.windows" /* TerminalSettingId.DefaultProfileWindows */), testPwshSourcePaths, variableResolver);
        }
        return detectAvailableUnixProfiles(fsProvider, logService, includeDetectedProfiles, profiles && typeof profiles === 'object' ? Object.assign({}, profiles) : configurationService.getValue(platform_1.isLinux ? "terminal.integrated.profiles.linux" /* TerminalSettingId.ProfilesLinux */ : "terminal.integrated.profiles.osx" /* TerminalSettingId.ProfilesMacOs */), typeof defaultProfile === 'string' ? defaultProfile : configurationService.getValue(platform_1.isLinux ? "terminal.integrated.defaultProfile.linux" /* TerminalSettingId.DefaultProfileLinux */ : "terminal.integrated.defaultProfile.osx" /* TerminalSettingId.DefaultProfileMacOs */), testPwshSourcePaths, variableResolver, shellEnv);
    }
    exports.detectAvailableProfiles = detectAvailableProfiles;
    async function detectAvailableWindowsProfiles(includeDetectedProfiles, fsProvider, shellEnv, logService, useWslProfiles, configProfiles, defaultProfileName, testPwshSourcePaths, variableResolver) {
        // Determine the correct System32 path. We want to point to Sysnative
        // when the 32-bit version of VS Code is running on a 64-bit machine.
        // The reason for this is because PowerShell's important PSReadline
        // module doesn't work if this is not the case. See #27915.
        const is32ProcessOn64Windows = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
        const system32Path = `${process.env['windir']}\\${is32ProcessOn64Windows ? 'Sysnative' : 'System32'}`;
        let useWSLexe = false;
        if ((0, terminalEnvironment_1.getWindowsBuildNumber)() >= 16299) {
            useWSLexe = true;
        }
        await initializeWindowsProfiles(testPwshSourcePaths);
        const detectedProfiles = new Map();
        // Add auto detected profiles
        if (includeDetectedProfiles) {
            detectedProfiles.set('PowerShell', {
                source: "PowerShell" /* ProfileSource.Pwsh */,
                icon: codicons_1.Codicon.terminalPowershell,
                isAutoDetected: true
            });
            detectedProfiles.set('Windows PowerShell', {
                path: `${system32Path}\\WindowsPowerShell\\v1.0\\powershell.exe`,
                icon: codicons_1.Codicon.terminalPowershell,
                isAutoDetected: true
            });
            detectedProfiles.set('Git Bash', {
                source: "Git Bash" /* ProfileSource.GitBash */,
                isAutoDetected: true
            });
            detectedProfiles.set('Cygwin', {
                path: [
                    `${process.env['HOMEDRIVE']}\\cygwin64\\bin\\bash.exe`,
                    `${process.env['HOMEDRIVE']}\\cygwin\\bin\\bash.exe`
                ],
                args: ['--login'],
                isAutoDetected: true
            });
            detectedProfiles.set('Command Prompt', {
                path: `${system32Path}\\cmd.exe`,
                icon: codicons_1.Codicon.terminalCmd,
                isAutoDetected: true
            });
        }
        applyConfigProfilesToMap(configProfiles, detectedProfiles);
        const resultProfiles = await transformToTerminalProfiles(detectedProfiles.entries(), defaultProfileName, fsProvider, shellEnv, logService, variableResolver);
        if (includeDetectedProfiles || (!includeDetectedProfiles && useWslProfiles)) {
            try {
                const result = await getWslProfiles(`${system32Path}\\${useWSLexe ? 'wsl' : 'bash'}.exe`, defaultProfileName);
                for (const wslProfile of result) {
                    if (!configProfiles || !(wslProfile.profileName in configProfiles)) {
                        resultProfiles.push(wslProfile);
                    }
                }
            }
            catch (e) {
                if (logIfWslNotInstalled) {
                    logService === null || logService === void 0 ? void 0 : logService.info('WSL is not installed, so could not detect WSL profiles');
                    logIfWslNotInstalled = false;
                }
            }
        }
        return resultProfiles;
    }
    async function transformToTerminalProfiles(entries, defaultProfileName, fsProvider, shellEnv = process.env, logService, variableResolver) {
        const resultProfiles = [];
        for (const [profileName, profile] of entries) {
            if (profile === null) {
                continue;
            }
            let originalPaths;
            let args;
            let icon = undefined;
            if ('source' in profile) {
                const source = profileSources === null || profileSources === void 0 ? void 0 : profileSources.get(profile.source);
                if (!source) {
                    continue;
                }
                originalPaths = source.paths;
                // if there are configured args, override the default ones
                args = profile.args || source.args;
                if (profile.icon) {
                    icon = validateIcon(profile.icon);
                }
                else if (source.icon) {
                    icon = source.icon;
                }
            }
            else {
                originalPaths = Array.isArray(profile.path) ? profile.path : [profile.path];
                args = platform_1.isWindows ? profile.args : Array.isArray(profile.args) ? profile.args : undefined;
                icon = validateIcon(profile.icon);
            }
            const paths = (await (variableResolver === null || variableResolver === void 0 ? void 0 : variableResolver(originalPaths))) || originalPaths.slice();
            const validatedProfile = await validateProfilePaths(profileName, defaultProfileName, paths, fsProvider, shellEnv, args, profile.env, profile.overrideName, profile.isAutoDetected, logService);
            if (validatedProfile) {
                validatedProfile.isAutoDetected = profile.isAutoDetected;
                validatedProfile.icon = icon;
                validatedProfile.color = profile.color;
                resultProfiles.push(validatedProfile);
            }
            else {
                logService === null || logService === void 0 ? void 0 : logService.trace('profile not validated', profileName, originalPaths);
            }
        }
        return resultProfiles;
    }
    function validateIcon(icon) {
        if (typeof icon === 'string') {
            return { id: icon };
        }
        return icon;
    }
    async function initializeWindowsProfiles(testPwshSourcePaths) {
        if (profileSources && !testPwshSourcePaths) {
            return;
        }
        profileSources = new Map();
        profileSources.set('Git Bash', {
            profileName: 'Git Bash',
            paths: [
                `${process.env['ProgramW6432']}\\Git\\bin\\bash.exe`,
                `${process.env['ProgramW6432']}\\Git\\usr\\bin\\bash.exe`,
                `${process.env['ProgramFiles']}\\Git\\bin\\bash.exe`,
                `${process.env['ProgramFiles']}\\Git\\usr\\bin\\bash.exe`,
                `${process.env['LocalAppData']}\\Programs\\Git\\bin\\bash.exe`,
                `${process.env['UserProfile']}\\scoop\\apps\\git-with-openssh\\current\\bin\\bash.exe`,
                `${process.env['AllUsersProfile']}\\scoop\\apps\\git-with-openssh\\current\\bin\\bash.exe`
            ],
            args: ['--login']
        });
        profileSources.set('PowerShell', {
            profileName: 'PowerShell',
            paths: testPwshSourcePaths || await getPowershellPaths(),
            icon: themeService_1.ThemeIcon.asThemeIcon(codicons_1.Codicon.terminalPowershell)
        });
    }
    async function getPowershellPaths() {
        var e_1, _a;
        const paths = [];
        try {
            // Add all of the different kinds of PowerShells
            for (var _b = __asyncValues((0, powershell_1.enumeratePowerShellInstallations)()), _c; _c = await _b.next(), !_c.done;) {
                const pwshExe = _c.value;
                paths.push(pwshExe.exePath);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return paths;
    }
    async function getWslProfiles(wslPath, defaultProfileName) {
        const profiles = [];
        const distroOutput = await new Promise((resolve, reject) => {
            // wsl.exe output is encoded in utf16le (ie. A -> 0x4100)
            cp.exec('wsl.exe -l -q', { encoding: 'utf16le', timeout: 1000 }, (err, stdout) => {
                if (err) {
                    return reject('Problem occurred when getting wsl distros');
                }
                resolve(stdout);
            });
        });
        if (!distroOutput) {
            return [];
        }
        const regex = new RegExp(/[\r?\n]/);
        const distroNames = distroOutput.split(regex).filter(t => t.trim().length > 0 && t !== '');
        for (const distroName of distroNames) {
            // Skip empty lines
            if (distroName === '') {
                continue;
            }
            // docker-desktop and docker-desktop-data are treated as implementation details of
            // Docker Desktop for Windows and therefore not exposed
            if (distroName.startsWith('docker-desktop')) {
                continue;
            }
            // Create the profile, adding the icon depending on the distro
            const profileName = `${distroName} (WSL)`;
            const profile = {
                profileName,
                path: wslPath,
                args: [`-d`, `${distroName}`],
                isDefault: profileName === defaultProfileName,
                icon: getWslIcon(distroName),
                isAutoDetected: false
            };
            // Add the profile
            profiles.push(profile);
        }
        return profiles;
    }
    function getWslIcon(distroName) {
        if (distroName.includes('Ubuntu')) {
            return themeService_1.ThemeIcon.asThemeIcon(codicons_1.Codicon.terminalUbuntu);
        }
        else if (distroName.includes('Debian')) {
            return themeService_1.ThemeIcon.asThemeIcon(codicons_1.Codicon.terminalDebian);
        }
        else {
            return themeService_1.ThemeIcon.asThemeIcon(codicons_1.Codicon.terminalLinux);
        }
    }
    async function detectAvailableUnixProfiles(fsProvider, logService, includeDetectedProfiles, configProfiles, defaultProfileName, testPaths, variableResolver, shellEnv) {
        const detectedProfiles = new Map();
        // Add non-quick launch profiles
        if (includeDetectedProfiles) {
            const contents = (await fsProvider.readFile('/etc/shells')).toString();
            const profiles = testPaths || contents.split('\n').filter(e => e.trim().indexOf('#') !== 0 && e.trim().length > 0);
            const counts = new Map();
            for (const profile of profiles) {
                let profileName = (0, path_1.basename)(profile);
                let count = counts.get(profileName) || 0;
                count++;
                if (count > 1) {
                    profileName = `${profileName} (${count})`;
                }
                counts.set(profileName, count);
                detectedProfiles.set(profileName, { path: profile, isAutoDetected: true });
            }
        }
        applyConfigProfilesToMap(configProfiles, detectedProfiles);
        return await transformToTerminalProfiles(detectedProfiles.entries(), defaultProfileName, fsProvider, shellEnv, logService, variableResolver);
    }
    function applyConfigProfilesToMap(configProfiles, profilesMap) {
        var _a;
        if (!configProfiles) {
            return;
        }
        for (const [profileName, value] of Object.entries(configProfiles)) {
            if (value === null || (!('path' in value) && !('source' in value))) {
                profilesMap.delete(profileName);
            }
            else {
                value.icon = value.icon || ((_a = profilesMap.get(profileName)) === null || _a === void 0 ? void 0 : _a.icon);
                profilesMap.set(profileName, value);
            }
        }
    }
    async function validateProfilePaths(profileName, defaultProfileName, potentialPaths, fsProvider, shellEnv, args, env, overrideName, isAutoDetected, logService) {
        if (potentialPaths.length === 0) {
            return Promise.resolve(undefined);
        }
        const path = potentialPaths.shift();
        if (path === '') {
            return validateProfilePaths(profileName, defaultProfileName, potentialPaths, fsProvider, shellEnv, args, env, overrideName, isAutoDetected);
        }
        const profile = { profileName, path, args, env, overrideName, isAutoDetected, isDefault: profileName === defaultProfileName };
        // For non-absolute paths, check if it's available on $PATH
        if ((0, path_1.basename)(path) === path) {
            // The executable isn't an absolute path, try find it on the PATH
            const envPaths = shellEnv.PATH ? shellEnv.PATH.split(path_1.delimiter) : undefined;
            const executable = await (0, terminalEnvironment_1.findExecutable)(path, undefined, envPaths, undefined, fsProvider.existsFile);
            if (!executable) {
                return validateProfilePaths(profileName, defaultProfileName, potentialPaths, fsProvider, shellEnv, args);
            }
            profile.path = executable;
            profile.isFromPath = true;
            return profile;
        }
        const result = await fsProvider.existsFile((0, path_1.normalize)(path));
        if (result) {
            return profile;
        }
        return validateProfilePaths(profileName, defaultProfileName, potentialPaths, fsProvider, shellEnv, args, env, overrideName, isAutoDetected);
    }
});
//# sourceMappingURL=terminalProfiles.js.map