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
define(["require", "exports", "vs/platform/environment/common/environment", "vs/platform/instantiation/common/instantiation", "vs/platform/environment/common/environmentService", "vs/base/common/decorators", "vs/base/common/uri", "vs/base/common/network", "vs/base/common/path"], function (require, exports, environment_1, instantiation_1, environmentService_1, decorators_1, uri_1, network_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkbenchEnvironmentService = exports.INativeWorkbenchEnvironmentService = void 0;
    exports.INativeWorkbenchEnvironmentService = (0, instantiation_1.refineServiceDecorator)(environment_1.IEnvironmentService);
    class NativeWorkbenchEnvironmentService extends environmentService_1.AbstractNativeEnvironmentService {
        constructor(configuration, productService) {
            super(configuration, { homeDir: configuration.homeDir, tmpDir: configuration.tmpDir, userDataDir: configuration.userDataDir }, productService);
            this.configuration = configuration;
        }
        get mainPid() { return this.configuration.mainPid; }
        get machineId() { return this.configuration.machineId; }
        get remoteAuthority() { return this.configuration.remoteAuthority; }
        get execPath() { return this.configuration.execPath; }
        get backupPath() { return this.configuration.backupPath; }
        get window() {
            return {
                id: this.configuration.windowId,
                colorScheme: this.configuration.colorScheme,
                maximized: this.configuration.maximized,
                accessibilitySupport: this.configuration.accessibilitySupport,
                perfMarks: this.configuration.perfMarks,
                isInitialStartup: this.configuration.isInitialStartup,
                isCodeCaching: typeof this.configuration.codeCachePath === 'string'
            };
        }
        get userRoamingDataHome() { return this.appSettingsHome.with({ scheme: network_1.Schemas.vscodeUserData }); }
        get logFile() { return uri_1.URI.file((0, path_1.join)(this.logsPath, `renderer${this.configuration.windowId}.log`)); }
        get extHostLogsPath() { return uri_1.URI.file((0, path_1.join)(this.logsPath, `exthost${this.configuration.windowId}`)); }
        get webviewExternalEndpoint() { return `${network_1.Schemas.vscodeWebview}://{{uuid}}`; }
        get skipReleaseNotes() { return !!this.args['skip-release-notes']; }
        get skipWelcome() { return !!this.args['skip-welcome']; }
        get logExtensionHostCommunication() { return !!this.args.logExtensionHostCommunication; }
        get enableSmokeTestDriver() { return !!this.args['enable-smoke-test-driver']; }
        get extensionEnabledProposedApi() {
            if (Array.isArray(this.args['enable-proposed-api'])) {
                return this.args['enable-proposed-api'];
            }
            if ('enable-proposed-api' in this.args) {
                return [];
            }
            return undefined;
        }
        get os() { return this.configuration.os; }
        get filesToOpenOrCreate() { return this.configuration.filesToOpenOrCreate; }
        get filesToDiff() { return this.configuration.filesToDiff; }
        get filesToWait() { return this.configuration.filesToWait; }
    }
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "mainPid", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "machineId", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "remoteAuthority", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "execPath", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "backupPath", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "window", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "userRoamingDataHome", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "logFile", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "extHostLogsPath", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "webviewExternalEndpoint", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "skipReleaseNotes", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "skipWelcome", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "logExtensionHostCommunication", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "enableSmokeTestDriver", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "extensionEnabledProposedApi", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "os", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "filesToOpenOrCreate", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "filesToDiff", null);
    __decorate([
        decorators_1.memoize
    ], NativeWorkbenchEnvironmentService.prototype, "filesToWait", null);
    exports.NativeWorkbenchEnvironmentService = NativeWorkbenchEnvironmentService;
});
//# sourceMappingURL=environmentService.js.map