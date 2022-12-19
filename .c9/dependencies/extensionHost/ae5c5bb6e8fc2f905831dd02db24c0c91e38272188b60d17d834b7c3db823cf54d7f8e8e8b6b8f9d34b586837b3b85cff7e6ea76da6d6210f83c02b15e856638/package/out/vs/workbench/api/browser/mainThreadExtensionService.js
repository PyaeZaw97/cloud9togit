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
define(["require", "exports", "vs/base/common/severity", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/api/common/extHost.protocol", "vs/workbench/services/extensions/common/extensions", "vs/platform/notification/common/notification", "vs/nls", "vs/base/common/actions", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/workbench/services/host/browser/host", "vs/workbench/contrib/extensions/common/extensions", "vs/base/common/cancellation", "vs/workbench/services/timer/browser/timerService", "vs/workbench/services/environment/common/environmentService", "vs/platform/commands/common/commands", "vs/base/common/uri", "vs/base/common/network"], function (require, exports, severity_1, extHostCustomers_1, extHost_protocol_1, extensions_1, notification_1, nls_1, actions_1, extensionManagement_1, extensionManagementUtil_1, host_1, extensions_2, cancellation_1, timerService_1, environmentService_1, commands_1, uri_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadExtensionService = void 0;
    let MainThreadExtensionService = class MainThreadExtensionService {
        constructor(extHostContext, _extensionService, _notificationService, _extensionsWorkbenchService, _hostService, _extensionEnablementService, _timerService, _commandService, _environmentService) {
            this._extensionService = _extensionService;
            this._notificationService = _notificationService;
            this._extensionsWorkbenchService = _extensionsWorkbenchService;
            this._hostService = _hostService;
            this._extensionEnablementService = _extensionEnablementService;
            this._timerService = _timerService;
            this._commandService = _commandService;
            this._environmentService = _environmentService;
            this._extensionHostKind = extHostContext.extensionHostKind;
            const internalExtHostContext = extHostContext;
            this._internalExtensionService = internalExtHostContext.internalExtensionService;
            internalExtHostContext._setExtensionHostProxy(new ExtensionHostProxy(extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostExtensionService)));
            internalExtHostContext._setAllMainProxyIdentifiers(Object.keys(extHost_protocol_1.MainContext).map((key) => extHost_protocol_1.MainContext[key]));
        }
        dispose() {
        }
        $getExtension(extensionId) {
            return this._extensionService.getExtension(extensionId);
        }
        $activateExtension(extensionId, reason) {
            return this._internalExtensionService._activateById(extensionId, reason);
        }
        async $onWillActivateExtension(extensionId) {
            this._internalExtensionService._onWillActivateExtension(extensionId);
        }
        $onDidActivateExtension(extensionId, codeLoadingTime, activateCallTime, activateResolvedTime, activationReason) {
            this._internalExtensionService._onDidActivateExtension(extensionId, codeLoadingTime, activateCallTime, activateResolvedTime, activationReason);
        }
        $onExtensionRuntimeError(extensionId, data) {
            const error = new Error();
            error.name = data.name;
            error.message = data.message;
            error.stack = data.stack;
            this._internalExtensionService._onExtensionRuntimeError(extensionId, error);
            console.error(`[${extensionId}]${error.message}`);
            console.error(error.stack);
        }
        async $onExtensionActivationError(extensionId, data, missingExtensionDependency) {
            const error = new Error();
            error.name = data.name;
            error.message = data.message;
            error.stack = data.stack;
            this._internalExtensionService._onDidActivateExtensionError(extensionId, error);
            if (missingExtensionDependency) {
                const extension = await this._extensionService.getExtension(extensionId.value);
                if (extension) {
                    const local = await this._extensionsWorkbenchService.queryLocal();
                    const installedDependency = local.find(i => (0, extensionManagementUtil_1.areSameExtensions)(i.identifier, { id: missingExtensionDependency.dependency }));
                    if (installedDependency === null || installedDependency === void 0 ? void 0 : installedDependency.local) {
                        await this._handleMissingInstalledDependency(extension, installedDependency.local);
                        return;
                    }
                    else {
                        await this._handleMissingNotInstalledDependency(extension, missingExtensionDependency.dependency);
                        return;
                    }
                }
            }
            const isDev = !this._environmentService.isBuilt || this._environmentService.isExtensionDevelopment;
            if (isDev) {
                this._notificationService.error(error);
                return;
            }
            console.error(error.message);
        }
        async _handleMissingInstalledDependency(extension, missingInstalledDependency) {
            const extName = extension.displayName || extension.name;
            if (this._extensionEnablementService.isEnabled(missingInstalledDependency)) {
                this._notificationService.notify({
                    severity: severity_1.default.Error,
                    message: (0, nls_1.localize)('reload window', "Cannot activate the '{0}' extension because it depends on the '{1}' extension, which is not loaded. Would you like to reload the window to load the extension?", extName, missingInstalledDependency.manifest.displayName || missingInstalledDependency.manifest.name),
                    actions: {
                        primary: [new actions_1.Action('reload', (0, nls_1.localize)('reload', "Reload Window"), '', true, () => this._hostService.reload())]
                    }
                });
            }
            else {
                const enablementState = this._extensionEnablementService.getEnablementState(missingInstalledDependency);
                if (enablementState === 4 /* EnablementState.DisabledByVirtualWorkspace */) {
                    this._notificationService.notify({
                        severity: severity_1.default.Error,
                        message: (0, nls_1.localize)('notSupportedInWorkspace', "Cannot activate the '{0}' extension because it depends on the '{1}' extension which is not supported in the current workspace", extName, missingInstalledDependency.manifest.displayName || missingInstalledDependency.manifest.name),
                    });
                }
                else if (enablementState === 0 /* EnablementState.DisabledByTrustRequirement */) {
                    this._notificationService.notify({
                        severity: severity_1.default.Error,
                        message: (0, nls_1.localize)('restrictedMode', "Cannot activate the '{0}' extension because it depends on the '{1}' extension which is not supported in Restricted Mode", extName, missingInstalledDependency.manifest.displayName || missingInstalledDependency.manifest.name),
                        actions: {
                            primary: [new actions_1.Action('manageWorkspaceTrust', (0, nls_1.localize)('manageWorkspaceTrust', "Manage Workspace Trust"), '', true, () => this._commandService.executeCommand('workbench.trust.manage'))]
                        }
                    });
                }
                else if (this._extensionEnablementService.canChangeEnablement(missingInstalledDependency)) {
                    this._notificationService.notify({
                        severity: severity_1.default.Error,
                        message: (0, nls_1.localize)('disabledDep', "Cannot activate the '{0}' extension because it depends on the '{1}' extension which is disabled. Would you like to enable the extension and reload the window?", extName, missingInstalledDependency.manifest.displayName || missingInstalledDependency.manifest.name),
                        actions: {
                            primary: [new actions_1.Action('enable', (0, nls_1.localize)('enable dep', "Enable and Reload"), '', true, () => this._extensionEnablementService.setEnablement([missingInstalledDependency], enablementState === 6 /* EnablementState.DisabledGlobally */ ? 8 /* EnablementState.EnabledGlobally */ : 9 /* EnablementState.EnabledWorkspace */)
                                    .then(() => this._hostService.reload(), e => this._notificationService.error(e)))]
                        }
                    });
                }
                else {
                    this._notificationService.notify({
                        severity: severity_1.default.Error,
                        message: (0, nls_1.localize)('disabledDepNoAction', "Cannot activate the '{0}' extension because it depends on the '{1}' extension which is disabled.", extName, missingInstalledDependency.manifest.displayName || missingInstalledDependency.manifest.name),
                    });
                }
            }
        }
        async _handleMissingNotInstalledDependency(extension, missingDependency) {
            const extName = extension.displayName || extension.name;
            let dependencyExtension = null;
            try {
                dependencyExtension = (await this._extensionsWorkbenchService.getExtensions([{ id: missingDependency }], cancellation_1.CancellationToken.None))[0];
            }
            catch (err) {
            }
            if (dependencyExtension) {
                this._notificationService.notify({
                    severity: severity_1.default.Error,
                    message: (0, nls_1.localize)('uninstalledDep', "Cannot activate the '{0}' extension because it depends on the '{1}' extension, which is not installed. Would you like to install the extension and reload the window?", extName, dependencyExtension.displayName),
                    actions: {
                        primary: [new actions_1.Action('install', (0, nls_1.localize)('install missing dep', "Install and Reload"), '', true, () => this._extensionsWorkbenchService.install(dependencyExtension)
                                .then(() => this._hostService.reload(), e => this._notificationService.error(e)))]
                    }
                });
            }
            else {
                this._notificationService.error((0, nls_1.localize)('unknownDep', "Cannot activate the '{0}' extension because it depends on an unknown '{1}' extension.", extName, missingDependency));
            }
        }
        async $setPerformanceMarks(marks) {
            if (this._extensionHostKind === 1 /* ExtensionHostKind.LocalProcess */) {
                this._timerService.setPerformanceMarks('localExtHost', marks);
            }
            else if (this._extensionHostKind === 2 /* ExtensionHostKind.LocalWebWorker */) {
                this._timerService.setPerformanceMarks('workerExtHost', marks);
            }
            else {
                this._timerService.setPerformanceMarks('remoteExtHost', marks);
            }
        }
        async $asBrowserUri(uri) {
            return network_1.FileAccess.asBrowserUri(uri_1.URI.revive(uri));
        }
    };
    MainThreadExtensionService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadExtensionService),
        __param(1, extensions_1.IExtensionService),
        __param(2, notification_1.INotificationService),
        __param(3, extensions_2.IExtensionsWorkbenchService),
        __param(4, host_1.IHostService),
        __param(5, extensionManagement_1.IWorkbenchExtensionEnablementService),
        __param(6, timerService_1.ITimerService),
        __param(7, commands_1.ICommandService),
        __param(8, environmentService_1.IWorkbenchEnvironmentService)
    ], MainThreadExtensionService);
    exports.MainThreadExtensionService = MainThreadExtensionService;
    class ExtensionHostProxy {
        constructor(_actual) {
            this._actual = _actual;
        }
        resolveAuthority(remoteAuthority, resolveAttempt) {
            return this._actual.$resolveAuthority(remoteAuthority, resolveAttempt);
        }
        async getCanonicalURI(remoteAuthority, uri) {
            const uriComponents = await this._actual.$getCanonicalURI(remoteAuthority, uri);
            return (uriComponents ? uri_1.URI.revive(uriComponents) : uriComponents);
        }
        startExtensionHost(extensionsDelta) {
            return this._actual.$startExtensionHost(extensionsDelta);
        }
        extensionTestsExecute() {
            return this._actual.$extensionTestsExecute();
        }
        extensionTestsExit(code) {
            return this._actual.$extensionTestsExit(code);
        }
        activateByEvent(activationEvent, activationKind) {
            return this._actual.$activateByEvent(activationEvent, activationKind);
        }
        activate(extensionId, reason) {
            return this._actual.$activate(extensionId, reason);
        }
        setRemoteEnvironment(env) {
            return this._actual.$setRemoteEnvironment(env);
        }
        updateRemoteConnectionData(connectionData) {
            return this._actual.$updateRemoteConnectionData(connectionData);
        }
        deltaExtensions(extensionsDelta) {
            return this._actual.$deltaExtensions(extensionsDelta);
        }
        test_latency(n) {
            return this._actual.$test_latency(n);
        }
        test_up(b) {
            return this._actual.$test_up(b);
        }
        test_down(size) {
            return this._actual.$test_down(size);
        }
    }
});
//# sourceMappingURL=mainThreadExtensionService.js.map