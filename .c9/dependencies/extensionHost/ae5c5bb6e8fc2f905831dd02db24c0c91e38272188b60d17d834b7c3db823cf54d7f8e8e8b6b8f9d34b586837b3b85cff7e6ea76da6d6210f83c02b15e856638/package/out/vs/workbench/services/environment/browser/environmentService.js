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
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/environment/common/environment", "vs/base/common/decorators", "vs/base/common/errors", "vs/base/common/extpath", "vs/platform/log/common/log", "vs/base/common/types", "vs/platform/instantiation/common/instantiation"], function (require, exports, network_1, resources_1, uri_1, environment_1, decorators_1, errors_1, extpath_1, log_1, types_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BrowserWorkbenchEnvironmentService = exports.IBrowserWorkbenchEnvironmentService = void 0;
    exports.IBrowserWorkbenchEnvironmentService = (0, instantiation_1.refineServiceDecorator)(environment_1.IEnvironmentService);
    class BrowserWorkbenchEnvironmentService {
        constructor(workspaceId, logsHome, options, productService) {
            this.workspaceId = workspaceId;
            this.logsHome = logsHome;
            this.options = options;
            this.productService = productService;
            this.extensionHostDebugEnvironment = undefined;
            if (options.workspaceProvider && Array.isArray(options.workspaceProvider.payload)) {
                try {
                    this.payload = new Map(options.workspaceProvider.payload);
                }
                catch (error) {
                    (0, errors_1.onUnexpectedError)(error); // possible invalid payload for map
                }
            }
        }
        get remoteAuthority() { return this.options.remoteAuthority; }
        get isBuilt() { return !!this.productService.commit; }
        get logsPath() { return this.logsHome.path; }
        get logLevel() { var _a, _b, _c; return ((_a = this.payload) === null || _a === void 0 ? void 0 : _a.get('logLevel')) || (((_b = this.options.developmentOptions) === null || _b === void 0 ? void 0 : _b.logLevel) !== undefined ? (0, log_1.LogLevelToString)((_c = this.options.developmentOptions) === null || _c === void 0 ? void 0 : _c.logLevel) : undefined); }
        get logFile() { return (0, resources_1.joinPath)(this.logsHome, 'window.log'); }
        get userRoamingDataHome() { return uri_1.URI.file('/User').with({ scheme: network_1.Schemas.vscodeUserData }); }
        get settingsResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'settings.json'); }
        get argvResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'argv.json'); }
        get snippetsHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'snippets'); }
        get cacheHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'caches'); }
        get globalStorageHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'globalStorage'); }
        get workspaceStorageHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'workspaceStorage'); }
        get localHistoryHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'History'); }
        /**
         * In Web every workspace can potentially have scoped user-data
         * and/or extensions and if Sync state is shared then it can make
         * Sync error prone - say removing extensions from another workspace.
         * Hence scope Sync state per workspace. Sync scoped to a workspace
         * is capable of handling opening same workspace in multiple windows.
         */
        get userDataSyncHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'sync', this.workspaceId); }
        get userDataSyncLogResource() { return (0, resources_1.joinPath)(this.logsHome, 'userDataSync.log'); }
        get sync() { return undefined; }
        get keybindingsResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'keybindings.json'); }
        get keyboardLayoutResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'keyboardLayout.json'); }
        get untitledWorkspacesHome() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'Workspaces'); }
        get serviceMachineIdResource() { return (0, resources_1.joinPath)(this.userRoamingDataHome, 'machineid'); }
        get extHostLogsPath() { return (0, resources_1.joinPath)(this.logsHome, 'exthost'); }
        get debugExtensionHost() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.params;
        }
        get isExtensionDevelopment() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.isExtensionDevelopment;
        }
        get extensionDevelopmentLocationURI() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.extensionDevelopmentLocationURI;
        }
        get extensionDevelopmentLocationKind() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.extensionDevelopmentKind;
        }
        get extensionTestsLocationURI() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.extensionTestsLocationURI;
        }
        get extensionEnabledProposedApi() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.extensionEnabledProposedApi;
        }
        get debugRenderer() {
            if (!this.extensionHostDebugEnvironment) {
                this.extensionHostDebugEnvironment = this.resolveExtensionHostDebugEnvironment();
            }
            return this.extensionHostDebugEnvironment.debugRenderer;
        }
        get enableSmokeTestDriver() { var _a; return (_a = this.options.developmentOptions) === null || _a === void 0 ? void 0 : _a.enableSmokeTestDriver; }
        get disableExtensions() { var _a; return ((_a = this.payload) === null || _a === void 0 ? void 0 : _a.get('disableExtensions')) === 'true'; }
        get enableExtensions() { return this.options.enabledExtensions; }
        get webviewExternalEndpoint() {
            var _a, _b, _c;
            const endpoint = this.options.webviewEndpoint
                || this.productService.webviewContentExternalBaseUrlTemplate
                || 'https://{{uuid}}.vscode-cdn.net/{{quality}}/{{commit}}/out/vs/workbench/contrib/webview/browser/pre/';
            const webviewExternalEndpointCommit = (_a = this.payload) === null || _a === void 0 ? void 0 : _a.get('webviewExternalEndpointCommit');
            return endpoint
                .replace('{{commit}}', (_b = webviewExternalEndpointCommit !== null && webviewExternalEndpointCommit !== void 0 ? webviewExternalEndpointCommit : this.productService.commit) !== null && _b !== void 0 ? _b : '181b43c0e2949e36ecb623d8cc6de29d4fa2bae8')
                .replace('{{quality}}', (_c = (webviewExternalEndpointCommit ? 'insider' : this.productService.quality)) !== null && _c !== void 0 ? _c : 'insider');
        }
        get telemetryLogResource() { return (0, resources_1.joinPath)(this.logsHome, 'telemetry.log'); }
        get disableTelemetry() { return false; }
        get verbose() { var _a; return ((_a = this.payload) === null || _a === void 0 ? void 0 : _a.get('verbose')) === 'true'; }
        get logExtensionHostCommunication() { var _a; return ((_a = this.payload) === null || _a === void 0 ? void 0 : _a.get('logExtensionHostCommunication')) === 'true'; }
        get skipReleaseNotes() { var _a; return ((_a = this.payload) === null || _a === void 0 ? void 0 : _a.get('skipReleaseNotes')) === 'true'; }
        get skipWelcome() { var _a; return ((_a = this.payload) === null || _a === void 0 ? void 0 : _a.get('skipWelcome')) === 'true'; }
        get disableWorkspaceTrust() { return !this.options.enableWorkspaceTrust; }
        resolveExtensionHostDebugEnvironment() {
            var _a;
            const extensionHostDebugEnvironment = {
                params: {
                    port: null,
                    break: false
                },
                debugRenderer: false,
                isExtensionDevelopment: false,
                extensionDevelopmentLocationURI: undefined,
                extensionDevelopmentKind: undefined
            };
            // Fill in selected extra environmental properties
            if (this.payload) {
                for (const [key, value] of this.payload) {
                    switch (key) {
                        case 'extensionDevelopmentPath':
                            if (!extensionHostDebugEnvironment.extensionDevelopmentLocationURI) {
                                extensionHostDebugEnvironment.extensionDevelopmentLocationURI = [];
                            }
                            extensionHostDebugEnvironment.extensionDevelopmentLocationURI.push(uri_1.URI.parse(value));
                            extensionHostDebugEnvironment.isExtensionDevelopment = true;
                            break;
                        case 'extensionDevelopmentKind':
                            extensionHostDebugEnvironment.extensionDevelopmentKind = [value];
                            break;
                        case 'extensionTestsPath':
                            extensionHostDebugEnvironment.extensionTestsLocationURI = uri_1.URI.parse(value);
                            break;
                        case 'debugRenderer':
                            extensionHostDebugEnvironment.debugRenderer = value === 'true';
                            break;
                        case 'debugId':
                            extensionHostDebugEnvironment.params.debugId = value;
                            break;
                        case 'inspect-brk-extensions':
                            extensionHostDebugEnvironment.params.port = parseInt(value);
                            extensionHostDebugEnvironment.params.break = true;
                            break;
                        case 'inspect-extensions':
                            extensionHostDebugEnvironment.params.port = parseInt(value);
                            break;
                        case 'enableProposedApi':
                            extensionHostDebugEnvironment.extensionEnabledProposedApi = [];
                            break;
                    }
                }
            }
            const developmentOptions = this.options.developmentOptions;
            if (developmentOptions && !extensionHostDebugEnvironment.isExtensionDevelopment) {
                if ((_a = developmentOptions.extensions) === null || _a === void 0 ? void 0 : _a.length) {
                    extensionHostDebugEnvironment.extensionDevelopmentLocationURI = developmentOptions.extensions.map(e => uri_1.URI.revive(e));
                    extensionHostDebugEnvironment.isExtensionDevelopment = true;
                }
                if (developmentOptions.extensionTestsPath) {
                    extensionHostDebugEnvironment.extensionTestsLocationURI = uri_1.URI.revive(developmentOptions.extensionTestsPath);
                }
            }
            return extensionHostDebugEnvironment;
        }
        get filesToOpenOrCreate() {
            if (this.payload) {
                const fileToOpen = this.payload.get('openFile');
                if (fileToOpen) {
                    const fileUri = uri_1.URI.parse(fileToOpen);
                    // Support: --goto parameter to open on line/col
                    if (this.payload.has('gotoLineMode')) {
                        const pathColumnAware = (0, extpath_1.parseLineAndColumnAware)(fileUri.path);
                        return [{
                                fileUri: fileUri.with({ path: pathColumnAware.path }),
                                options: {
                                    selection: !(0, types_1.isUndefined)(pathColumnAware.line) ? { startLineNumber: pathColumnAware.line, startColumn: pathColumnAware.column || 1 } : undefined
                                }
                            }];
                    }
                    return [{ fileUri }];
                }
            }
            return undefined;
        }
        get filesToDiff() {
            if (this.payload) {
                const fileToDiffPrimary = this.payload.get('diffFilePrimary');
                const fileToDiffSecondary = this.payload.get('diffFileSecondary');
                if (fileToDiffPrimary && fileToDiffSecondary) {
                    return [
                        { fileUri: uri_1.URI.parse(fileToDiffSecondary) },
                        { fileUri: uri_1.URI.parse(fileToDiffPrimary) }
                    ];
                }
            }
            return undefined;
        }
    }
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "remoteAuthority", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "isBuilt", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logsPath", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logLevel", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logFile", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "userRoamingDataHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "settingsResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "argvResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "snippetsHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "cacheHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "globalStorageHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "workspaceStorageHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "localHistoryHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "userDataSyncHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "userDataSyncLogResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "sync", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "keybindingsResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "keyboardLayoutResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "untitledWorkspacesHome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "serviceMachineIdResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extHostLogsPath", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "debugExtensionHost", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "isExtensionDevelopment", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionDevelopmentLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionDevelopmentLocationKind", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionTestsLocationURI", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "extensionEnabledProposedApi", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "debugRenderer", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "enableSmokeTestDriver", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "disableExtensions", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "enableExtensions", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "webviewExternalEndpoint", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "telemetryLogResource", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "disableTelemetry", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "verbose", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "logExtensionHostCommunication", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "skipReleaseNotes", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "skipWelcome", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "disableWorkspaceTrust", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "filesToOpenOrCreate", null);
    __decorate([
        decorators_1.memoize
    ], BrowserWorkbenchEnvironmentService.prototype, "filesToDiff", null);
    exports.BrowserWorkbenchEnvironmentService = BrowserWorkbenchEnvironmentService;
});
//# sourceMappingURL=environmentService.js.map