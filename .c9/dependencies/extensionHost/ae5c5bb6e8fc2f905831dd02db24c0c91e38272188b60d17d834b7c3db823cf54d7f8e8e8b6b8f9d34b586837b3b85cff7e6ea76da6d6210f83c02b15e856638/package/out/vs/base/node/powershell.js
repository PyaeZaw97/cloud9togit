/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
define(["require", "exports", "os", "vs/base/common/path", "vs/base/node/pfs"], function (require, exports, os, path, pfs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getFirstAvailablePowerShellInstallation = exports.enumeratePowerShellInstallations = void 0;
    // This is required, since parseInt("7-preview") will return 7.
    const IntRegex = /^\d+$/;
    const PwshMsixRegex = /^Microsoft.PowerShell_.*/;
    const PwshPreviewMsixRegex = /^Microsoft.PowerShellPreview_.*/;
    var Arch;
    (function (Arch) {
        Arch[Arch["x64"] = 0] = "x64";
        Arch[Arch["x86"] = 1] = "x86";
        Arch[Arch["ARM"] = 2] = "ARM";
    })(Arch || (Arch = {}));
    let processArch;
    switch (process.arch) {
        case 'ia32':
        case 'x32':
            processArch = 1 /* Arch.x86 */;
            break;
        case 'arm':
        case 'arm64':
            processArch = 2 /* Arch.ARM */;
            break;
        default:
            processArch = 0 /* Arch.x64 */;
            break;
    }
    /*
    Currently, here are the values for these environment variables on their respective archs:
    
    On x86 process on x86:
    PROCESSOR_ARCHITECTURE is X86
    PROCESSOR_ARCHITEW6432 is undefined
    
    On x86 process on x64:
    PROCESSOR_ARCHITECTURE is X86
    PROCESSOR_ARCHITEW6432 is AMD64
    
    On x64 process on x64:
    PROCESSOR_ARCHITECTURE is AMD64
    PROCESSOR_ARCHITEW6432 is undefined
    
    On ARM process on ARM:
    PROCESSOR_ARCHITECTURE is ARM64
    PROCESSOR_ARCHITEW6432 is undefined
    
    On x86 process on ARM:
    PROCESSOR_ARCHITECTURE is X86
    PROCESSOR_ARCHITEW6432 is ARM64
    
    On x64 process on ARM:
    PROCESSOR_ARCHITECTURE is ARM64
    PROCESSOR_ARCHITEW6432 is undefined
    */
    let osArch;
    if (process.env['PROCESSOR_ARCHITEW6432']) {
        osArch = process.env['PROCESSOR_ARCHITEW6432'] === 'ARM64'
            ? 2 /* Arch.ARM */
            : 0 /* Arch.x64 */;
    }
    else if (process.env['PROCESSOR_ARCHITECTURE'] === 'ARM64') {
        osArch = 2 /* Arch.ARM */;
    }
    else if (process.env['PROCESSOR_ARCHITECTURE'] === 'X86') {
        osArch = 1 /* Arch.x86 */;
    }
    else {
        osArch = 0 /* Arch.x64 */;
    }
    class PossiblePowerShellExe {
        constructor(exePath, displayName, knownToExist) {
            this.exePath = exePath;
            this.displayName = displayName;
            this.knownToExist = knownToExist;
        }
        async exists() {
            if (this.knownToExist === undefined) {
                this.knownToExist = await pfs.SymlinkSupport.existsFile(this.exePath);
            }
            return this.knownToExist;
        }
    }
    function getProgramFilesPath({ useAlternateBitness = false } = {}) {
        if (!useAlternateBitness) {
            // Just use the native system bitness
            return process.env.ProgramFiles || null;
        }
        // We might be a 64-bit process looking for 32-bit program files
        if (processArch === 0 /* Arch.x64 */) {
            return process.env['ProgramFiles(x86)'] || null;
        }
        // We might be a 32-bit process looking for 64-bit program files
        if (osArch === 0 /* Arch.x64 */) {
            return process.env.ProgramW6432 || null;
        }
        // We're a 32-bit process on 32-bit Windows, there is no other Program Files dir
        return null;
    }
    async function findPSCoreWindowsInstallation({ useAlternateBitness = false, findPreview = false } = {}) {
        const programFilesPath = getProgramFilesPath({ useAlternateBitness });
        if (!programFilesPath) {
            return null;
        }
        const powerShellInstallBaseDir = path.join(programFilesPath, 'PowerShell');
        // Ensure the base directory exists
        if (!await pfs.SymlinkSupport.existsDirectory(powerShellInstallBaseDir)) {
            return null;
        }
        let highestSeenVersion = -1;
        let pwshExePath = null;
        for (const item of await pfs.Promises.readdir(powerShellInstallBaseDir)) {
            let currentVersion = -1;
            if (findPreview) {
                // We are looking for something like "7-preview"
                // Preview dirs all have dashes in them
                const dashIndex = item.indexOf('-');
                if (dashIndex < 0) {
                    continue;
                }
                // Verify that the part before the dash is an integer
                // and that the part after the dash is "preview"
                const intPart = item.substring(0, dashIndex);
                if (!IntRegex.test(intPart) || item.substring(dashIndex + 1) !== 'preview') {
                    continue;
                }
                currentVersion = parseInt(intPart, 10);
            }
            else {
                // Search for a directory like "6" or "7"
                if (!IntRegex.test(item)) {
                    continue;
                }
                currentVersion = parseInt(item, 10);
            }
            // Ensure we haven't already seen a higher version
            if (currentVersion <= highestSeenVersion) {
                continue;
            }
            // Now look for the file
            const exePath = path.join(powerShellInstallBaseDir, item, 'pwsh.exe');
            if (!await pfs.SymlinkSupport.existsFile(exePath)) {
                continue;
            }
            pwshExePath = exePath;
            highestSeenVersion = currentVersion;
        }
        if (!pwshExePath) {
            return null;
        }
        const bitness = programFilesPath.includes('x86') ? ' (x86)' : '';
        const preview = findPreview ? ' Preview' : '';
        return new PossiblePowerShellExe(pwshExePath, `PowerShell${preview}${bitness}`, true);
    }
    async function findPSCoreMsix({ findPreview } = {}) {
        // We can't proceed if there's no LOCALAPPDATA path
        if (!process.env.LOCALAPPDATA) {
            return null;
        }
        // Find the base directory for MSIX application exe shortcuts
        const msixAppDir = path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WindowsApps');
        if (!await pfs.SymlinkSupport.existsDirectory(msixAppDir)) {
            return null;
        }
        // Define whether we're looking for the preview or the stable
        const { pwshMsixDirRegex, pwshMsixName } = findPreview
            ? { pwshMsixDirRegex: PwshPreviewMsixRegex, pwshMsixName: 'PowerShell Preview (Store)' }
            : { pwshMsixDirRegex: PwshMsixRegex, pwshMsixName: 'PowerShell (Store)' };
        // We should find only one such application, so return on the first one
        for (const subdir of await pfs.Promises.readdir(msixAppDir)) {
            if (pwshMsixDirRegex.test(subdir)) {
                const pwshMsixPath = path.join(msixAppDir, subdir, 'pwsh.exe');
                return new PossiblePowerShellExe(pwshMsixPath, pwshMsixName);
            }
        }
        // If we find nothing, return null
        return null;
    }
    function findPSCoreDotnetGlobalTool() {
        const dotnetGlobalToolExePath = path.join(os.homedir(), '.dotnet', 'tools', 'pwsh.exe');
        return new PossiblePowerShellExe(dotnetGlobalToolExePath, '.NET Core PowerShell Global Tool');
    }
    function findWinPS() {
        const winPSPath = path.join(process.env.windir, processArch === 1 /* Arch.x86 */ && osArch !== 1 /* Arch.x86 */ ? 'SysNative' : 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
        return new PossiblePowerShellExe(winPSPath, 'Windows PowerShell', true);
    }
    /**
     * Iterates through all the possible well-known PowerShell installations on a machine.
     * Returned values may not exist, but come with an .exists property
     * which will check whether the executable exists.
     */
    function enumerateDefaultPowerShellInstallations() {
        return __asyncGenerator(this, arguments, function* enumerateDefaultPowerShellInstallations_1() {
            // Find PSCore stable first
            let pwshExe = yield __await(findPSCoreWindowsInstallation());
            if (pwshExe) {
                yield yield __await(pwshExe);
            }
            // Windows may have a 32-bit pwsh.exe
            pwshExe = yield __await(findPSCoreWindowsInstallation({ useAlternateBitness: true }));
            if (pwshExe) {
                yield yield __await(pwshExe);
            }
            // Also look for the MSIX/UWP installation
            pwshExe = yield __await(findPSCoreMsix());
            if (pwshExe) {
                yield yield __await(pwshExe);
            }
            // Look for the .NET global tool
            // Some older versions of PowerShell have a bug in this where startup will fail,
            // but this is fixed in newer versions
            pwshExe = findPSCoreDotnetGlobalTool();
            if (pwshExe) {
                yield yield __await(pwshExe);
            }
            // Look for PSCore preview
            pwshExe = yield __await(findPSCoreWindowsInstallation({ findPreview: true }));
            if (pwshExe) {
                yield yield __await(pwshExe);
            }
            // Find a preview MSIX
            pwshExe = yield __await(findPSCoreMsix({ findPreview: true }));
            if (pwshExe) {
                yield yield __await(pwshExe);
            }
            // Look for pwsh-preview with the opposite bitness
            pwshExe = yield __await(findPSCoreWindowsInstallation({ useAlternateBitness: true, findPreview: true }));
            if (pwshExe) {
                yield yield __await(pwshExe);
            }
            // Finally, get Windows PowerShell
            pwshExe = findWinPS();
            if (pwshExe) {
                yield yield __await(pwshExe);
            }
        });
    }
    /**
     * Iterates through PowerShell installations on the machine according
     * to configuration passed in through the constructor.
     * PowerShell items returned by this object are verified
     * to exist on the filesystem.
     */
    function enumeratePowerShellInstallations() {
        return __asyncGenerator(this, arguments, function* enumeratePowerShellInstallations_1() {
            var e_1, _a;
            try {
                // Get the default PowerShell installations first
                for (var _b = __asyncValues(enumerateDefaultPowerShellInstallations()), _c; _c = yield __await(_b.next()), !_c.done;) {
                    const defaultPwsh = _c.value;
                    if (yield __await(defaultPwsh.exists())) {
                        yield yield __await(defaultPwsh);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield __await(_a.call(_b));
                }
                finally { if (e_1) throw e_1.error; }
            }
        });
    }
    exports.enumeratePowerShellInstallations = enumeratePowerShellInstallations;
    /**
    * Returns the first available PowerShell executable found in the search order.
    */
    async function getFirstAvailablePowerShellInstallation() {
        var e_2, _a;
        try {
            for (var _b = __asyncValues(enumeratePowerShellInstallations()), _c; _c = await _b.next(), !_c.done;) {
                const pwsh = _c.value;
                return pwsh;
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) await _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return null;
    }
    exports.getFirstAvailablePowerShellInstallation = getFirstAvailablePowerShellInstallation;
});
//# sourceMappingURL=powershell.js.map