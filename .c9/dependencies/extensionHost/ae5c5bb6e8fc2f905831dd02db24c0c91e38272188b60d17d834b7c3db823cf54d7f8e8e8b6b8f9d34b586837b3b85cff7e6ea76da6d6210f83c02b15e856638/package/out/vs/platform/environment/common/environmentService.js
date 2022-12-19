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
define(["require", "exports", "vs/base/common/date", "vs/base/common/decorators", "vs/base/common/network", "vs/base/common/path", "vs/base/common/process", "vs/base/common/resources", "vs/base/common/uri"], function (require, exports, date_1, decorators_1, network_1, path_1, process_1, resources_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parsePtyHostPort = exports.parseSearchPort = exports.parseExtensionHostPort = exports.AbstractNativeEnvironmentService = void 0;
    class AbstractNativeEnvironmentService {
        constructor(_args, paths, productService) {
            this._args = _args;
            this.paths = paths;
            this.productService = productService;
        }
        get appRoot() { return (0, path_1.dirname)(network_1.FileAccess.asFileUri('', require).fsPath); }
        get userHome() { return uri_1.URI.file(this.paths.homeDir); }
        get userDataPath() { return this.paths.userDataDir; }
        get appSettingsHome() { return uri_1.URI.file((0, path_1.join)(this.userDataPath, 'User')); }
        get tmpDir() { return uri_1.URI.file(this.paths.tmpDir); }
        get cacheHome() { return uri_1.URI.file(this.userDataPath); }
        get userRoamingDataHome() { return this.appSettingsHome; }
        get settingsResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'settings.json'); }
        get userDataSyncHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'sync'); }
        get logsPath() {
            if (!this.args.logsPath) {
                const key = (0, date_1.toLocalISOString)(new Date()).replace(/-|:|\.\d+Z$/g, '');
                this.args.logsPath = (0, path_1.join)(this.userDataPath, 'logs', key);
            }
            return this.args.logsPath;
        }
        get userDataSyncLogResource() { return uri_1.URI.file((0, path_1.join)(this.logsPath, 'userDataSync.log')); }
        get sync() { return this.args.sync; }
        get machineSettingsResource() { return (0, resources_1.joinPath)(uri_1.URI.file((0, path_1.join)(this.userDataPath, 'Machine')), 'settings.json'); }
        get globalStorageHome() { return (0, resources_1.joinPath)(this.appSettingsHome, 'globalStorage'); }
        get workspaceStorageHome() { return (0, resources_1.joinPath)(this.appSettingsHome, 'workspaceStorage'); }
        get localHistoryHome() { return (0, resources_1.joinPath)(this.appSettingsHome, 'History'); }
        get keybindingsResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'keybindings.json'); }
        get keyboardLayoutResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'keyboardLayout.json'); }
        get argvResource() {
            const vscodePortable = process_1.env['VSCODE_PORTABLE'];
            if (vscodePortable) {
                return uri_1.URI.file((0, path_1.join)(vscodePortable, 'argv.json'));
            }
            return (0, resources_1.joinPath)(this.userHome, this.productService.dataFolderName, 'argv.json');
        }
        get snippetsHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'snippets'); }
        get isExtensionDevelopment() { return !!this.args.extensionDevelopmentPath; }
        get untitledWorkspacesHome() { return uri_1.URI.file((0, path_1.join)(this.userDataPath, 'Workspaces')); }
        get installSourcePath() { return (0, path_1.join)(this.userDataPath, 'installSource'); }
        get builtinExtensionsPath() {
            const cliBuiltinExtensionsDir = this.args['builtin-extensions-dir'];
            if (cliBuiltinExtensionsDir) {
                return (0, path_1.resolve)(cliBuiltinExtensionsDir);
            }
            return (0, path_1.normalize)((0, path_1.join)(network_1.FileAccess.asFileUri('', require).fsPath, '..', 'extensions'));
        }
        get extensionsDownloadPath() {
            const cliExtensionsDownloadDir = this.args['extensions-download-dir'];
            if (cliExtensionsDownloadDir) {
                return (0, path_1.resolve)(cliExtensionsDownloadDir);
            }
            return (0, path_1.join)(this.userDataPath, 'CachedExtensionVSIXs');
        }
        get extensionsPath() {
            const cliExtensionsDir = this.args['extensions-dir'];
            if (cliExtensionsDir) {
                return (0, path_1.resolve)(cliExtensionsDir);
            }
            const vscodeExtensions = process_1.env['VSCODE_EXTENSIONS'];
            if (vscodeExtensions) {
                return vscodeExtensions;
            }
            const vscodePortable = process_1.env['VSCODE_PORTABLE'];
            if (vscodePortable) {
                return (0, path_1.join)(vscodePortable, 'extensions');
            }
            return (0, resources_1.joinPath)(this.userHome, this.productService.dataFolderName, 'extensions').fsPath;
        }
        get extensionDevelopmentLocationURI() {
            const extensionDevelopmentPaths = this.args.extensionDevelopmentPath;
            if (Array.isArray(extensionDevelopmentPaths)) {
                return extensionDevelopmentPaths.map(extensionDevelopmentPath => {
                    if (/^[^:/?#]+?:\/\//.test(extensionDevelopmentPath)) {
                        return uri_1.URI.parse(extensionDevelopmentPath);
                    }
                    return uri_1.URI.file((0, path_1.normalize)(extensionDevelopmentPath));
                });
            }
            return undefined;
        }
        get extensionDevelopmentKind() {
            var _a;
            return (_a = this.args.extensionDevelopmentKind) === null || _a === void 0 ? void 0 : _a.map(kind => kind === 'ui' || kind === 'workspace' || kind === 'web' ? kind : 'workspace');
        }
        get extensionTestsLocationURI() {
            const extensionTestsPath = this.args.extensionTestsPath;
            if (extensionTestsPath) {
                if (/^[^:/?#]+?:\/\//.test(extensionTestsPath)) {
                    return uri_1.URI.parse(extensionTestsPath);
                }
                return uri_1.URI.file((0, path_1.normalize)(extensionTestsPath));
            }
            return undefined;
        }
        get disableExtensions() {
            if (this.args['disable-extensions']) {
                return true;
            }
            const disableExtensions = this.args['disable-extension'];
            if (disableExtensions) {
                if (typeof disableExtensions === 'string') {
                    return [disableExtensions];
                }
                if (Array.isArray(disableExtensions) && disableExtensions.length > 0) {
                    return disableExtensions;
                }
            }
            return false;
        }
        get debugExtensionHost() { return parseExtensionHostPort(this.args, this.isBuilt); }
        get debugRenderer() { return !!this.args.debugRenderer; }
        get isBuilt() { return !process_1.env['VSCODE_DEV']; }
        get verbose() { return !!this.args.verbose; }
        get logLevel() { return this.args.log; }
        get serviceMachineIdResource() { return (0, resources_1.joinPath)(uri_1.URI.file(this.userDataPath), 'machineid'); }
        get crashReporterId() { return this.args['crash-reporter-id']; }
        get crashReporterDirectory() { return this.args['crash-reporter-directory']; }
        get telemetryLogResource() { return uri_1.URI.file((0, path_1.join)(this.logsPath, 'telemetry.log')); }
        get disableTelemetry() { return !!this.args['disable-telemetry']; }
        get disableWorkspaceTrust() { return !!this.args['disable-workspace-trust']; }
        get args() { return this._args; }
    }
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "appRoot", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "userHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "userDataPath", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "appSettingsHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "tmpDir", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "cacheHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "userRoamingDataHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "settingsResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "userDataSyncHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "userDataSyncLogResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "sync", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "machineSettingsResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "globalStorageHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "workspaceStorageHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "localHistoryHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "keybindingsResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "keyboardLayoutResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "argvResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "snippetsHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "isExtensionDevelopment", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "untitledWorkspacesHome", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "installSourcePath", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "builtinExtensionsPath", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionsPath", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionDevelopmentLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionDevelopmentKind", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "extensionTestsLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "debugExtensionHost", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "serviceMachineIdResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "telemetryLogResource", null);
    __decorate([
        decorators_1.memoize
    ], AbstractNativeEnvironmentService.prototype, "disableWorkspaceTrust", null);
    exports.AbstractNativeEnvironmentService = AbstractNativeEnvironmentService;
    function parseExtensionHostPort(args, isBuild) {
        return parseDebugParams(args['inspect-extensions'], args['inspect-brk-extensions'], 5870, isBuild, args.debugId, args.extensionEnvironment);
    }
    exports.parseExtensionHostPort = parseExtensionHostPort;
    function parseSearchPort(args, isBuild) {
        return parseDebugParams(args['inspect-search'], args['inspect-brk-search'], 5876, isBuild, args.extensionEnvironment);
    }
    exports.parseSearchPort = parseSearchPort;
    function parsePtyHostPort(args, isBuild) {
        return parseDebugParams(args['inspect-ptyhost'], args['inspect-brk-ptyhost'], 5877, isBuild, args.extensionEnvironment);
    }
    exports.parsePtyHostPort = parsePtyHostPort;
    function parseDebugParams(debugArg, debugBrkArg, defaultBuildPort, isBuild, debugId, environmentString) {
        const portStr = debugBrkArg || debugArg;
        const port = Number(portStr) || (!isBuild ? defaultBuildPort : null);
        const brk = port ? Boolean(!!debugBrkArg) : false;
        let env;
        if (environmentString) {
            try {
                env = JSON.parse(environmentString);
            }
            catch (_a) {
                // ignore
            }
        }
        return { port, break: brk, debugId, env };
    }
});
//# sourceMappingURL=environmentService.js.map