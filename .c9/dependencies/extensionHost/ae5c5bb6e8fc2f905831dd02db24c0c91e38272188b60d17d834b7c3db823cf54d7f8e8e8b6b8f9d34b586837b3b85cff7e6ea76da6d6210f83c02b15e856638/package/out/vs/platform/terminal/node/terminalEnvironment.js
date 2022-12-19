/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "os", "vs/base/common/network", "vs/base/common/objects", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/process", "vs/base/common/strings", "vs/base/common/types", "vs/base/node/pfs"], function (require, exports, os, network_1, objects_1, path, platform_1, process, strings_1, types_1, pfs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shellIntegrationArgs = exports.ShellIntegrationExecutable = exports.getShellIntegrationInjection = exports.findExecutable = exports.getWindowsBuildNumber = void 0;
    function getWindowsBuildNumber() {
        const osVersion = (/(\d+)\.(\d+)\.(\d+)/g).exec(os.release());
        let buildNumber = 0;
        if (osVersion && osVersion.length === 4) {
            buildNumber = parseInt(osVersion[3]);
        }
        return buildNumber;
    }
    exports.getWindowsBuildNumber = getWindowsBuildNumber;
    async function findExecutable(command, cwd, paths, env = process.env, exists = pfs.Promises.exists) {
        // If we have an absolute path then we take it.
        if (path.isAbsolute(command)) {
            return await exists(command) ? command : undefined;
        }
        if (cwd === undefined) {
            cwd = process.cwd();
        }
        const dir = path.dirname(command);
        if (dir !== '.') {
            // We have a directory and the directory is relative (see above). Make the path absolute
            // to the current working directory.
            const fullPath = path.join(cwd, command);
            return await exists(fullPath) ? fullPath : undefined;
        }
        const envPath = (0, objects_1.getCaseInsensitive)(env, 'PATH');
        if (paths === undefined && (0, types_1.isString)(envPath)) {
            paths = envPath.split(path.delimiter);
        }
        // No PATH environment. Make path absolute to the cwd.
        if (paths === undefined || paths.length === 0) {
            const fullPath = path.join(cwd, command);
            return await exists(fullPath) ? fullPath : undefined;
        }
        // We have a simple file name. We get the path variable from the env
        // and try to find the executable on the path.
        for (let pathEntry of paths) {
            // The path entry is absolute.
            let fullPath;
            if (path.isAbsolute(pathEntry)) {
                fullPath = path.join(pathEntry, command);
            }
            else {
                fullPath = path.join(cwd, pathEntry, command);
            }
            if (await exists(fullPath)) {
                return fullPath;
            }
            if (platform_1.isWindows) {
                let withExtension = fullPath + '.com';
                if (await exists(withExtension)) {
                    return withExtension;
                }
                withExtension = fullPath + '.exe';
                if (await exists(withExtension)) {
                    return withExtension;
                }
            }
        }
        const fullPath = path.join(cwd, command);
        return await exists(fullPath) ? fullPath : undefined;
    }
    exports.findExecutable = findExecutable;
    /**
     * For a given shell launch config, returns arguments to replace and an optional environment to
     * mixin to the SLC's environment to enable shell integration. This must be run within the context
     * that creates the process to ensure accuracy. Returns undefined if shell integration cannot be
     * enabled.
     */
    function getShellIntegrationInjection(shellLaunchConfig, options, logService) {
        // Shell integration arg injection is disabled when:
        // - The global setting is disabled
        // - There is no executable (not sure what script to run)
        // - The terminal is used by a feature like tasks or debugging
        if (!options.enabled || !shellLaunchConfig.executable || shellLaunchConfig.isFeatureTerminal || shellLaunchConfig.hideFromUser) {
            return undefined;
        }
        const originalArgs = shellLaunchConfig.args;
        const shell = process.platform === 'win32' ? path.basename(shellLaunchConfig.executable).toLowerCase() : path.basename(shellLaunchConfig.executable);
        const appRoot = path.dirname(network_1.FileAccess.asFileUri('', require).fsPath);
        let newArgs;
        // Windows
        if (platform_1.isWindows) {
            if (shell === 'pwsh.exe') {
                if (!originalArgs || arePwshImpliedArgs(originalArgs)) {
                    newArgs = exports.shellIntegrationArgs.get(ShellIntegrationExecutable.WindowsPwsh);
                }
                else if (arePwshLoginArgs(originalArgs)) {
                    newArgs = exports.shellIntegrationArgs.get(ShellIntegrationExecutable.WindowsPwshLogin);
                }
                if (!newArgs) {
                    return undefined;
                }
                if (newArgs) {
                    const additionalArgs = options.showWelcome ? '' : ' -HideWelcome';
                    newArgs = [...newArgs]; // Shallow clone the array to avoid setting the default array
                    newArgs[newArgs.length - 1] = (0, strings_1.format)(newArgs[newArgs.length - 1], appRoot, additionalArgs);
                }
                return { newArgs };
            }
            logService.warn(`Shell integration cannot be enabled for executable "${shellLaunchConfig.executable}" and args`, shellLaunchConfig.args);
            return undefined;
        }
        // Linux & macOS
        const envMixin = {};
        switch (shell) {
            case 'bash': {
                if (!originalArgs || originalArgs.length === 0) {
                    newArgs = exports.shellIntegrationArgs.get(ShellIntegrationExecutable.Bash);
                }
                else if (areZshBashLoginArgs(originalArgs)) {
                    envMixin['VSCODE_SHELL_LOGIN'] = '1';
                    newArgs = exports.shellIntegrationArgs.get(ShellIntegrationExecutable.Bash);
                }
                if (!newArgs) {
                    return undefined;
                }
                newArgs = [...newArgs]; // Shallow clone the array to avoid setting the default array
                newArgs[newArgs.length - 1] = (0, strings_1.format)(newArgs[newArgs.length - 1], appRoot);
                if (!options.showWelcome) {
                    envMixin['VSCODE_SHELL_HIDE_WELCOME'] = '1';
                }
                return { newArgs, envMixin };
            }
            case 'pwsh': {
                if (!originalArgs || arePwshImpliedArgs(originalArgs)) {
                    newArgs = exports.shellIntegrationArgs.get(ShellIntegrationExecutable.Pwsh);
                }
                else if (arePwshLoginArgs(originalArgs)) {
                    newArgs = exports.shellIntegrationArgs.get(ShellIntegrationExecutable.PwshLogin);
                }
                if (!newArgs) {
                    return undefined;
                }
                const additionalArgs = options.showWelcome ? '' : ' -HideWelcome';
                newArgs = [...newArgs]; // Shallow clone the array to avoid setting the default array
                newArgs[newArgs.length - 1] = (0, strings_1.format)(newArgs[newArgs.length - 1], appRoot, additionalArgs);
                return { newArgs };
            }
            case 'zsh': {
                if (!originalArgs || originalArgs.length === 0) {
                    newArgs = exports.shellIntegrationArgs.get(ShellIntegrationExecutable.Zsh);
                }
                else if (areZshBashLoginArgs(originalArgs)) {
                    newArgs = exports.shellIntegrationArgs.get(ShellIntegrationExecutable.ZshLogin);
                }
                else if (originalArgs === exports.shellIntegrationArgs.get(ShellIntegrationExecutable.Zsh) || originalArgs === exports.shellIntegrationArgs.get(ShellIntegrationExecutable.ZshLogin)) {
                    newArgs = originalArgs;
                }
                if (!newArgs) {
                    return undefined;
                }
                newArgs = [...newArgs]; // Shallow clone the array to avoid setting the default array
                newArgs[newArgs.length - 1] = (0, strings_1.format)(newArgs[newArgs.length - 1], appRoot);
                // Move .zshrc into $ZDOTDIR as the way to activate the script
                const zdotdir = path.join(os.tmpdir(), 'vscode-zsh');
                envMixin['ZDOTDIR'] = zdotdir;
                const filesToCopy = [];
                filesToCopy.push({
                    source: path.join(appRoot, 'out/vs/workbench/contrib/terminal/browser/media/shellIntegration.zsh'),
                    dest: path.join(zdotdir, '.zshrc')
                });
                filesToCopy.push({
                    source: path.join(appRoot, 'out/vs/workbench/contrib/terminal/browser/media/shellIntegration-profile.zsh'),
                    dest: path.join(zdotdir, '.zprofile')
                });
                filesToCopy.push({
                    source: path.join(appRoot, 'out/vs/workbench/contrib/terminal/browser/media/shellIntegration-env.zsh'),
                    dest: path.join(zdotdir, '.zshenv')
                });
                if (!options.showWelcome) {
                    envMixin['VSCODE_SHELL_HIDE_WELCOME'] = '1';
                }
                return { newArgs, envMixin, filesToCopy };
            }
        }
        logService.warn(`Shell integration cannot be enabled for executable "${shellLaunchConfig.executable}" and args`, shellLaunchConfig.args);
        return undefined;
    }
    exports.getShellIntegrationInjection = getShellIntegrationInjection;
    var ShellIntegrationExecutable;
    (function (ShellIntegrationExecutable) {
        ShellIntegrationExecutable["WindowsPwsh"] = "windows-pwsh";
        ShellIntegrationExecutable["WindowsPwshLogin"] = "windows-pwsh-login";
        ShellIntegrationExecutable["Pwsh"] = "pwsh";
        ShellIntegrationExecutable["PwshLogin"] = "pwsh-login";
        ShellIntegrationExecutable["Zsh"] = "zsh";
        ShellIntegrationExecutable["ZshLogin"] = "zsh-login";
        ShellIntegrationExecutable["Bash"] = "bash";
    })(ShellIntegrationExecutable = exports.ShellIntegrationExecutable || (exports.ShellIntegrationExecutable = {}));
    exports.shellIntegrationArgs = new Map();
    exports.shellIntegrationArgs.set(ShellIntegrationExecutable.WindowsPwsh, ['-noexit', '-command', '. \"{0}\\out\\vs\\workbench\\contrib\\terminal\\browser\\media\\shellIntegration.ps1\"{1}']);
    exports.shellIntegrationArgs.set(ShellIntegrationExecutable.WindowsPwshLogin, ['-l', '-noexit', '-command', '. \"{0}\\out\\vs\\workbench\\contrib\\terminal\\browser\\media\\shellIntegration.ps1\"{1}']);
    exports.shellIntegrationArgs.set(ShellIntegrationExecutable.Pwsh, ['-noexit', '-command', '. "{0}/out/vs/workbench/contrib/terminal/browser/media/shellIntegration.ps1"{1}']);
    exports.shellIntegrationArgs.set(ShellIntegrationExecutable.PwshLogin, ['-l', '-noexit', '-command', '. "{0}/out/vs/workbench/contrib/terminal/browser/media/shellIntegration.ps1"']);
    exports.shellIntegrationArgs.set(ShellIntegrationExecutable.Zsh, ['-i']);
    exports.shellIntegrationArgs.set(ShellIntegrationExecutable.ZshLogin, ['-il']);
    exports.shellIntegrationArgs.set(ShellIntegrationExecutable.Bash, ['--init-file', '{0}/out/vs/workbench/contrib/terminal/browser/media/shellIntegration-bash.sh']);
    const loginArgs = ['-login', '-l'];
    const pwshImpliedArgs = ['-nol', '-nologo'];
    function arePwshLoginArgs(originalArgs) {
        if (typeof originalArgs === 'string') {
            return loginArgs.includes(originalArgs.toLowerCase());
        }
        else {
            return originalArgs.length === 1 && loginArgs.includes(originalArgs[0].toLowerCase()) ||
                (originalArgs.length === 2 &&
                    (((loginArgs.includes(originalArgs[0].toLowerCase())) || loginArgs.includes(originalArgs[1].toLowerCase())))
                    && ((pwshImpliedArgs.includes(originalArgs[0].toLowerCase())) || pwshImpliedArgs.includes(originalArgs[1].toLowerCase())));
        }
    }
    function arePwshImpliedArgs(originalArgs) {
        if (typeof originalArgs === 'string') {
            return pwshImpliedArgs.includes(originalArgs.toLowerCase());
        }
        else {
            return originalArgs.length === 0 || (originalArgs === null || originalArgs === void 0 ? void 0 : originalArgs.length) === 1 && pwshImpliedArgs.includes(originalArgs[0].toLowerCase());
        }
    }
    function areZshBashLoginArgs(originalArgs) {
        return originalArgs === 'string' && loginArgs.includes(originalArgs.toLowerCase())
            || typeof originalArgs !== 'string' && originalArgs.length === 1 && loginArgs.includes(originalArgs[0].toLowerCase());
    }
});
//# sourceMappingURL=terminalEnvironment.js.map