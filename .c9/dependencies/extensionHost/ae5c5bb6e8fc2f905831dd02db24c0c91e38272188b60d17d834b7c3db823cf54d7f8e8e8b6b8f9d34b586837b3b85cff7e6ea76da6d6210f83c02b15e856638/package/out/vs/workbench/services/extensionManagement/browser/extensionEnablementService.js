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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/extensionManagement/common/extensionManagement", "vs/workbench/services/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionManagementUtil", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/workbench/services/environment/common/environmentService", "vs/platform/extensions/common/extensions", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/extensionManagement/common/extensionEnablementService", "vs/workbench/services/extensions/common/extensions", "vs/platform/userDataSync/common/userDataSyncAccount", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/notification/common/notification", "vs/workbench/services/host/browser/host", "vs/workbench/services/extensionManagement/browser/extensionBisect", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/extensions/common/extensionManifestPropertiesService", "vs/platform/workspace/common/virtualWorkspace", "vs/platform/log/common/log", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls_1, event_1, lifecycle_1, extensionManagement_1, extensionManagement_2, extensionManagementUtil_1, workspace_1, storage_1, environmentService_1, extensions_1, configuration_1, extensions_2, extensionEnablementService_1, extensions_3, userDataSyncAccount_1, userDataSync_1, lifecycle_2, notification_1, host_1, extensionBisect_1, workspaceTrust_1, extensionManifestPropertiesService_1, virtualWorkspace_1, log_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionEnablementService = void 0;
    const SOURCE = 'IWorkbenchExtensionEnablementService';
    let ExtensionEnablementService = class ExtensionEnablementService extends lifecycle_1.Disposable {
        constructor(storageService, globalExtensionEnablementService, contextService, environmentService, extensionManagementService, configurationService, extensionManagementServerService, userDataSyncEnablementService, userDataSyncAccountService, lifecycleService, notificationService, hostService, extensionBisectService, workspaceTrustManagementService, workspaceTrustRequestService, extensionManifestPropertiesService, instantiationService) {
            super();
            this.globalExtensionEnablementService = globalExtensionEnablementService;
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.configurationService = configurationService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.userDataSyncAccountService = userDataSyncAccountService;
            this.lifecycleService = lifecycleService;
            this.notificationService = notificationService;
            this.hostService = hostService;
            this.extensionBisectService = extensionBisectService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.extensionManifestPropertiesService = extensionManifestPropertiesService;
            this._onEnablementChanged = new event_1.Emitter();
            this.onEnablementChanged = this._onEnablementChanged.event;
            this.storageManger = this._register(new extensionEnablementService_1.StorageManager(storageService));
            const uninstallDisposable = this._register(event_1.Event.filter(extensionManagementService.onDidUninstallExtension, e => !e.error)(({ identifier }) => this._reset(identifier)));
            let isDisposed = false;
            this._register((0, lifecycle_1.toDisposable)(() => isDisposed = true));
            this.extensionsManager = this._register(instantiationService.createInstance(ExtensionsManager));
            this.extensionsManager.whenInitialized().then(() => {
                if (!isDisposed) {
                    this._register(this.extensionsManager.onDidChangeExtensions(({ added, removed }) => this._onDidChangeExtensions(added, removed)));
                    uninstallDisposable.dispose();
                }
            });
            this._register(this.globalExtensionEnablementService.onDidChangeEnablement(({ extensions, source }) => this._onDidChangeGloballyDisabledExtensions(extensions, source)));
            // delay notification for extensions disabled until workbench restored
            if (this.allUserExtensionsDisabled) {
                this.lifecycleService.when(4 /* LifecyclePhase.Eventually */).then(() => {
                    this.notificationService.prompt(notification_1.Severity.Info, (0, nls_1.localize)('extensionsDisabled', "All installed extensions are temporarily disabled."), [{
                            label: (0, nls_1.localize)('Reload', "Reload and Enable Extensions"),
                            run: () => hostService.reload({ disableExtensions: false })
                        }]);
                });
            }
        }
        get hasWorkspace() {
            return this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */;
        }
        get allUserExtensionsDisabled() {
            return this.environmentService.disableExtensions === true;
        }
        getEnablementState(extension) {
            return this._computeEnablementState(extension, this.extensionsManager.extensions, this.getWorkspaceType());
        }
        getEnablementStates(extensions, workspaceTypeOverrides = {}) {
            const extensionsEnablements = new Map();
            const workspaceType = Object.assign(Object.assign({}, this.getWorkspaceType()), workspaceTypeOverrides);
            return extensions.map(extension => this._computeEnablementState(extension, extensions, workspaceType, extensionsEnablements));
        }
        getDependenciesEnablementStates(extension) {
            return (0, extensionManagementUtil_1.getExtensionDependencies)(this.extensionsManager.extensions, extension).map(e => [e, this.getEnablementState(e)]);
        }
        canChangeEnablement(extension) {
            try {
                this.throwErrorIfCannotChangeEnablement(extension);
                return true;
            }
            catch (error) {
                return false;
            }
        }
        canChangeWorkspaceEnablement(extension) {
            if (!this.canChangeEnablement(extension)) {
                return false;
            }
            try {
                this.throwErrorIfCannotChangeWorkspaceEnablement(extension);
                return true;
            }
            catch (error) {
                return false;
            }
        }
        throwErrorIfCannotChangeEnablement(extension, donotCheckDependencies) {
            if ((0, extensions_1.isLanguagePackExtension)(extension.manifest)) {
                throw new Error((0, nls_1.localize)('cannot disable language pack extension', "Cannot change enablement of {0} extension because it contributes language packs.", extension.manifest.displayName || extension.identifier.id));
            }
            if (this.userDataSyncEnablementService.isEnabled() && this.userDataSyncAccountService.account &&
                (0, extensions_1.isAuthenticationProviderExtension)(extension.manifest) && extension.manifest.contributes.authentication.some(a => a.id === this.userDataSyncAccountService.account.authenticationProviderId)) {
                throw new Error((0, nls_1.localize)('cannot disable auth extension', "Cannot change enablement {0} extension because Settings Sync depends on it.", extension.manifest.displayName || extension.identifier.id));
            }
            if (this._isEnabledInEnv(extension)) {
                throw new Error((0, nls_1.localize)('cannot change enablement environment', "Cannot change enablement of {0} extension because it is enabled in environment", extension.manifest.displayName || extension.identifier.id));
            }
            switch (this.getEnablementState(extension)) {
                case 2 /* EnablementState.DisabledByEnvironment */:
                    throw new Error((0, nls_1.localize)('cannot change disablement environment', "Cannot change enablement of {0} extension because it is disabled in environment", extension.manifest.displayName || extension.identifier.id));
                case 4 /* EnablementState.DisabledByVirtualWorkspace */:
                    throw new Error((0, nls_1.localize)('cannot change enablement virtual workspace', "Cannot change enablement of {0} extension because it does not support virtual workspaces", extension.manifest.displayName || extension.identifier.id));
                case 1 /* EnablementState.DisabledByExtensionKind */:
                    throw new Error((0, nls_1.localize)('cannot change enablement extension kind', "Cannot change enablement of {0} extension because of its extension kind", extension.manifest.displayName || extension.identifier.id));
                case 5 /* EnablementState.DisabledByExtensionDependency */:
                    if (donotCheckDependencies) {
                        break;
                    }
                    // Can be changed only when all its dependencies enablements can be changed
                    for (const dependency of (0, extensionManagementUtil_1.getExtensionDependencies)(this.extensionsManager.extensions, extension)) {
                        if (this.isEnabled(dependency)) {
                            continue;
                        }
                        try {
                            this.throwErrorIfCannotChangeEnablement(dependency, true);
                        }
                        catch (error) {
                            throw new Error((0, nls_1.localize)('cannot change enablement dependency', "Cannot enable '{0}' extension because it depends on '{1}' extension that cannot be enabled", extension.manifest.displayName || extension.identifier.id, dependency.manifest.displayName || dependency.identifier.id));
                        }
                    }
            }
        }
        throwErrorIfCannotChangeWorkspaceEnablement(extension) {
            if (!this.hasWorkspace) {
                throw new Error((0, nls_1.localize)('noWorkspace', "No workspace."));
            }
            if ((0, extensions_1.isAuthenticationProviderExtension)(extension.manifest)) {
                throw new Error((0, nls_1.localize)('cannot disable auth extension in workspace', "Cannot change enablement of {0} extension in workspace because it contributes authentication providers", extension.manifest.displayName || extension.identifier.id));
            }
        }
        async setEnablement(extensions, newState) {
            await this.extensionsManager.whenInitialized();
            if (newState === 8 /* EnablementState.EnabledGlobally */ || newState === 9 /* EnablementState.EnabledWorkspace */) {
                extensions.push(...this.getExtensionsToEnableRecursively(extensions, this.extensionsManager.extensions, newState, { dependencies: true, pack: true }));
            }
            const workspace = newState === 7 /* EnablementState.DisabledWorkspace */ || newState === 9 /* EnablementState.EnabledWorkspace */;
            for (const extension of extensions) {
                if (workspace) {
                    this.throwErrorIfCannotChangeWorkspaceEnablement(extension);
                }
                else {
                    this.throwErrorIfCannotChangeEnablement(extension);
                }
            }
            const result = [];
            for (const extension of extensions) {
                const enablementState = this.getEnablementState(extension);
                if (enablementState === 0 /* EnablementState.DisabledByTrustRequirement */
                    /* All its disabled dependencies are disabled by Trust Requirement */
                    || (enablementState === 5 /* EnablementState.DisabledByExtensionDependency */ && this.getDependenciesEnablementStates(extension).every(([, e]) => this.isEnabledEnablementState(e) || e === 0 /* EnablementState.DisabledByTrustRequirement */))) {
                    const trustState = await this.workspaceTrustRequestService.requestWorkspaceTrust();
                    result.push(trustState !== null && trustState !== void 0 ? trustState : false);
                }
                else {
                    result.push(await this._setUserEnablementState(extension, newState));
                }
            }
            const changedExtensions = extensions.filter((e, index) => result[index]);
            if (changedExtensions.length) {
                this._onEnablementChanged.fire(changedExtensions);
            }
            return result;
        }
        getExtensionsToEnableRecursively(extensions, allExtensions, enablementState, options, checked = []) {
            const toCheck = extensions.filter(e => checked.indexOf(e) === -1);
            if (toCheck.length) {
                for (const extension of toCheck) {
                    checked.push(extension);
                }
                const extensionsToDisable = allExtensions.filter(i => {
                    if (checked.indexOf(i) !== -1) {
                        return false;
                    }
                    if (this.getEnablementState(i) === enablementState) {
                        return false;
                    }
                    return (options.dependencies || options.pack)
                        && extensions.some(extension => {
                            var _a, _b;
                            return (options.dependencies && ((_a = extension.manifest.extensionDependencies) === null || _a === void 0 ? void 0 : _a.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, i.identifier))))
                                || (options.pack && ((_b = extension.manifest.extensionPack) === null || _b === void 0 ? void 0 : _b.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, i.identifier))));
                        });
                });
                if (extensionsToDisable.length) {
                    extensionsToDisable.push(...this.getExtensionsToEnableRecursively(extensionsToDisable, allExtensions, enablementState, options, checked));
                }
                return extensionsToDisable;
            }
            return [];
        }
        _setUserEnablementState(extension, newState) {
            const currentState = this._getUserEnablementState(extension.identifier);
            if (currentState === newState) {
                return Promise.resolve(false);
            }
            switch (newState) {
                case 8 /* EnablementState.EnabledGlobally */:
                    this._enableExtension(extension.identifier);
                    break;
                case 6 /* EnablementState.DisabledGlobally */:
                    this._disableExtension(extension.identifier);
                    break;
                case 9 /* EnablementState.EnabledWorkspace */:
                    this._enableExtensionInWorkspace(extension.identifier);
                    break;
                case 7 /* EnablementState.DisabledWorkspace */:
                    this._disableExtensionInWorkspace(extension.identifier);
                    break;
            }
            return Promise.resolve(true);
        }
        isEnabled(extension) {
            const enablementState = this.getEnablementState(extension);
            return this.isEnabledEnablementState(enablementState);
        }
        isEnabledEnablementState(enablementState) {
            return enablementState === 3 /* EnablementState.EnabledByEnvironment */ || enablementState === 9 /* EnablementState.EnabledWorkspace */ || enablementState === 8 /* EnablementState.EnabledGlobally */;
        }
        isDisabledGlobally(extension) {
            return this._isDisabledGlobally(extension.identifier);
        }
        _computeEnablementState(extension, extensions, workspaceType, computedEnablementStates) {
            computedEnablementStates = computedEnablementStates !== null && computedEnablementStates !== void 0 ? computedEnablementStates : new Map();
            let enablementState = computedEnablementStates.get(extension);
            if (enablementState !== undefined) {
                return enablementState;
            }
            enablementState = this._getUserEnablementState(extension.identifier);
            if (this.extensionBisectService.isDisabledByBisect(extension)) {
                enablementState = 2 /* EnablementState.DisabledByEnvironment */;
            }
            else if (this._isDisabledInEnv(extension)) {
                enablementState = 2 /* EnablementState.DisabledByEnvironment */;
            }
            else if (this._isDisabledByVirtualWorkspace(extension, workspaceType)) {
                enablementState = 4 /* EnablementState.DisabledByVirtualWorkspace */;
            }
            else if (this.isEnabledEnablementState(enablementState) && this._isDisabledByWorkspaceTrust(extension, workspaceType)) {
                enablementState = 0 /* EnablementState.DisabledByTrustRequirement */;
            }
            else if (this._isDisabledByExtensionKind(extension)) {
                enablementState = 1 /* EnablementState.DisabledByExtensionKind */;
            }
            else if (this.isEnabledEnablementState(enablementState) && this._isDisabledByExtensionDependency(extension, extensions, workspaceType, computedEnablementStates)) {
                enablementState = 5 /* EnablementState.DisabledByExtensionDependency */;
            }
            else if (!this.isEnabledEnablementState(enablementState) && this._isEnabledInEnv(extension)) {
                enablementState = 3 /* EnablementState.EnabledByEnvironment */;
            }
            computedEnablementStates.set(extension, enablementState);
            return enablementState;
        }
        _isDisabledInEnv(extension) {
            if (this.allUserExtensionsDisabled) {
                return !extension.isBuiltin && !(0, extensions_1.isResolverExtension)(extension.manifest, this.environmentService.remoteAuthority);
            }
            const disabledExtensions = this.environmentService.disableExtensions;
            if (Array.isArray(disabledExtensions)) {
                return disabledExtensions.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, extension.identifier));
            }
            // Check if this is the better merge extension which was migrated to a built-in extension
            if ((0, extensionManagementUtil_1.areSameExtensions)({ id: extensionManagementUtil_1.BetterMergeId.value }, extension.identifier)) {
                return true;
            }
            return false;
        }
        _isEnabledInEnv(extension) {
            const enabledExtensions = this.environmentService.enableExtensions;
            if (Array.isArray(enabledExtensions)) {
                return enabledExtensions.some(id => (0, extensionManagementUtil_1.areSameExtensions)({ id }, extension.identifier));
            }
            return false;
        }
        _isDisabledByVirtualWorkspace(extension, workspaceType) {
            // Not a virtual workspace
            if (!workspaceType.virtual) {
                return false;
            }
            // Supports virtual workspace
            if (this.extensionManifestPropertiesService.getExtensionVirtualWorkspaceSupportType(extension.manifest) !== false) {
                return false;
            }
            // Web extension from web extension management server
            if (this.extensionManagementServerService.getExtensionManagementServer(extension) === this.extensionManagementServerService.webExtensionManagementServer && this.extensionManifestPropertiesService.canExecuteOnWeb(extension.manifest)) {
                return false;
            }
            return true;
        }
        _isDisabledByExtensionKind(extension) {
            if (this.extensionManagementServerService.remoteExtensionManagementServer || this.extensionManagementServerService.webExtensionManagementServer) {
                const installLocation = this.extensionManagementServerService.getExtensionInstallLocation(extension);
                for (const extensionKind of this.extensionManifestPropertiesService.getExtensionKind(extension.manifest)) {
                    if (extensionKind === 'ui') {
                        if (installLocation === 1 /* ExtensionInstallLocation.Local */) {
                            return false;
                        }
                    }
                    if (extensionKind === 'workspace') {
                        if (installLocation === 2 /* ExtensionInstallLocation.Remote */) {
                            return false;
                        }
                    }
                    if (extensionKind === 'web') {
                        if (this.extensionManagementServerService.webExtensionManagementServer /* web */) {
                            if (installLocation === 3 /* ExtensionInstallLocation.Web */ || installLocation === 2 /* ExtensionInstallLocation.Remote */) {
                                return false;
                            }
                        }
                        else if (installLocation === 1 /* ExtensionInstallLocation.Local */) {
                            const enableLocalWebWorker = this.configurationService.getValue(extensions_3.webWorkerExtHostConfig);
                            if (enableLocalWebWorker === true || enableLocalWebWorker === 'auto') {
                                // Web extensions are enabled on all configurations
                                return false;
                            }
                        }
                    }
                }
                return true;
            }
            return false;
        }
        _isDisabledByWorkspaceTrust(extension, workspaceType) {
            if (workspaceType.trusted) {
                return false;
            }
            return this.extensionManifestPropertiesService.getExtensionUntrustedWorkspaceSupportType(extension.manifest) === false;
        }
        _isDisabledByExtensionDependency(extension, extensions, workspaceType, computedEnablementStates) {
            // Find dependencies from the same server as of the extension
            const dependencyExtensions = extension.manifest.extensionDependencies
                ? extensions.filter(e => extension.manifest.extensionDependencies.some(id => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, { id }) && this.extensionManagementServerService.getExtensionManagementServer(e) === this.extensionManagementServerService.getExtensionManagementServer(extension)))
                : [];
            if (!dependencyExtensions.length) {
                return false;
            }
            const hasEnablementState = computedEnablementStates.has(extension);
            if (!hasEnablementState) {
                // Placeholder to handle cyclic deps
                computedEnablementStates.set(extension, 8 /* EnablementState.EnabledGlobally */);
            }
            try {
                for (const dependencyExtension of dependencyExtensions) {
                    const enablementState = this._computeEnablementState(dependencyExtension, extensions, workspaceType, computedEnablementStates);
                    if (!this.isEnabledEnablementState(enablementState) && enablementState !== 1 /* EnablementState.DisabledByExtensionKind */) {
                        return true;
                    }
                }
            }
            finally {
                if (!hasEnablementState) {
                    // remove the placeholder
                    computedEnablementStates.delete(extension);
                }
            }
            return false;
        }
        _getUserEnablementState(identifier) {
            if (this.hasWorkspace) {
                if (this._getWorkspaceEnabledExtensions().filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e, identifier))[0]) {
                    return 9 /* EnablementState.EnabledWorkspace */;
                }
                if (this._getWorkspaceDisabledExtensions().filter(e => (0, extensionManagementUtil_1.areSameExtensions)(e, identifier))[0]) {
                    return 7 /* EnablementState.DisabledWorkspace */;
                }
            }
            if (this._isDisabledGlobally(identifier)) {
                return 6 /* EnablementState.DisabledGlobally */;
            }
            return 8 /* EnablementState.EnabledGlobally */;
        }
        _isDisabledGlobally(identifier) {
            return this.globalExtensionEnablementService.getDisabledExtensions().some(e => (0, extensionManagementUtil_1.areSameExtensions)(e, identifier));
        }
        _enableExtension(identifier) {
            this._removeFromWorkspaceDisabledExtensions(identifier);
            this._removeFromWorkspaceEnabledExtensions(identifier);
            return this.globalExtensionEnablementService.enableExtension(identifier, SOURCE);
        }
        _disableExtension(identifier) {
            this._removeFromWorkspaceDisabledExtensions(identifier);
            this._removeFromWorkspaceEnabledExtensions(identifier);
            return this.globalExtensionEnablementService.disableExtension(identifier, SOURCE);
        }
        _enableExtensionInWorkspace(identifier) {
            this._removeFromWorkspaceDisabledExtensions(identifier);
            this._addToWorkspaceEnabledExtensions(identifier);
        }
        _disableExtensionInWorkspace(identifier) {
            this._addToWorkspaceDisabledExtensions(identifier);
            this._removeFromWorkspaceEnabledExtensions(identifier);
        }
        _addToWorkspaceDisabledExtensions(identifier) {
            if (!this.hasWorkspace) {
                return Promise.resolve(false);
            }
            let disabledExtensions = this._getWorkspaceDisabledExtensions();
            if (disabledExtensions.every(e => !(0, extensionManagementUtil_1.areSameExtensions)(e, identifier))) {
                disabledExtensions.push(identifier);
                this._setDisabledExtensions(disabledExtensions);
                return Promise.resolve(true);
            }
            return Promise.resolve(false);
        }
        async _removeFromWorkspaceDisabledExtensions(identifier) {
            if (!this.hasWorkspace) {
                return false;
            }
            let disabledExtensions = this._getWorkspaceDisabledExtensions();
            for (let index = 0; index < disabledExtensions.length; index++) {
                const disabledExtension = disabledExtensions[index];
                if ((0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, identifier)) {
                    disabledExtensions.splice(index, 1);
                    this._setDisabledExtensions(disabledExtensions);
                    return true;
                }
            }
            return false;
        }
        _addToWorkspaceEnabledExtensions(identifier) {
            if (!this.hasWorkspace) {
                return false;
            }
            let enabledExtensions = this._getWorkspaceEnabledExtensions();
            if (enabledExtensions.every(e => !(0, extensionManagementUtil_1.areSameExtensions)(e, identifier))) {
                enabledExtensions.push(identifier);
                this._setEnabledExtensions(enabledExtensions);
                return true;
            }
            return false;
        }
        _removeFromWorkspaceEnabledExtensions(identifier) {
            if (!this.hasWorkspace) {
                return false;
            }
            let enabledExtensions = this._getWorkspaceEnabledExtensions();
            for (let index = 0; index < enabledExtensions.length; index++) {
                const disabledExtension = enabledExtensions[index];
                if ((0, extensionManagementUtil_1.areSameExtensions)(disabledExtension, identifier)) {
                    enabledExtensions.splice(index, 1);
                    this._setEnabledExtensions(enabledExtensions);
                    return true;
                }
            }
            return false;
        }
        _getWorkspaceEnabledExtensions() {
            return this._getExtensions(extensionManagement_1.ENABLED_EXTENSIONS_STORAGE_PATH);
        }
        _setEnabledExtensions(enabledExtensions) {
            this._setExtensions(extensionManagement_1.ENABLED_EXTENSIONS_STORAGE_PATH, enabledExtensions);
        }
        _getWorkspaceDisabledExtensions() {
            return this._getExtensions(extensionManagement_1.DISABLED_EXTENSIONS_STORAGE_PATH);
        }
        _setDisabledExtensions(disabledExtensions) {
            this._setExtensions(extensionManagement_1.DISABLED_EXTENSIONS_STORAGE_PATH, disabledExtensions);
        }
        _getExtensions(storageId) {
            if (!this.hasWorkspace) {
                return [];
            }
            return this.storageManger.get(storageId, 1 /* StorageScope.WORKSPACE */);
        }
        _setExtensions(storageId, extensions) {
            this.storageManger.set(storageId, extensions, 1 /* StorageScope.WORKSPACE */);
        }
        async _onDidChangeGloballyDisabledExtensions(extensionIdentifiers, source) {
            if (source !== SOURCE) {
                await this.extensionsManager.whenInitialized();
                const extensions = this.extensionsManager.extensions.filter(installedExtension => extensionIdentifiers.some(identifier => (0, extensionManagementUtil_1.areSameExtensions)(identifier, installedExtension.identifier)));
                this._onEnablementChanged.fire(extensions);
            }
        }
        _onDidChangeExtensions(added, removed) {
            const disabledByTrustExtensions = added.filter(e => this.getEnablementState(e) === 0 /* EnablementState.DisabledByTrustRequirement */);
            if (disabledByTrustExtensions.length) {
                this._onEnablementChanged.fire(disabledByTrustExtensions);
            }
            removed.forEach(({ identifier }) => this._reset(identifier));
        }
        async updateExtensionsEnablementsWhenWorkspaceTrustChanges() {
            await this.extensionsManager.whenInitialized();
            const computeEnablementStates = (workspaceType) => {
                const extensionsEnablements = new Map();
                return this.extensionsManager.extensions.map(extension => [extension, this._computeEnablementState(extension, this.extensionsManager.extensions, workspaceType, extensionsEnablements)]);
            };
            const workspaceType = this.getWorkspaceType();
            const enablementStatesWithTrustedWorkspace = computeEnablementStates(Object.assign(Object.assign({}, workspaceType), { trusted: true }));
            const enablementStatesWithUntrustedWorkspace = computeEnablementStates(Object.assign(Object.assign({}, workspaceType), { trusted: false }));
            const enablementChangedExtensionsBecauseOfTrust = enablementStatesWithTrustedWorkspace.filter(([, enablementState], index) => enablementState !== enablementStatesWithUntrustedWorkspace[index][1]).map(([extension]) => extension);
            if (enablementChangedExtensionsBecauseOfTrust.length) {
                this._onEnablementChanged.fire(enablementChangedExtensionsBecauseOfTrust);
            }
        }
        getWorkspaceType() {
            return { trusted: this.workspaceTrustManagementService.isWorkspaceTrusted(), virtual: (0, virtualWorkspace_1.isVirtualWorkspace)(this.contextService.getWorkspace()) };
        }
        _reset(extension) {
            this._removeFromWorkspaceDisabledExtensions(extension);
            this._removeFromWorkspaceEnabledExtensions(extension);
            this.globalExtensionEnablementService.enableExtension(extension);
        }
    };
    ExtensionEnablementService = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, extensionManagement_1.IGlobalExtensionEnablementService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, extensionManagement_1.IExtensionManagementService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, extensionManagement_2.IExtensionManagementServerService),
        __param(7, userDataSync_1.IUserDataSyncEnablementService),
        __param(8, userDataSyncAccount_1.IUserDataSyncAccountService),
        __param(9, lifecycle_2.ILifecycleService),
        __param(10, notification_1.INotificationService),
        __param(11, host_1.IHostService),
        __param(12, extensionBisect_1.IExtensionBisectService),
        __param(13, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(14, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(15, extensionManifestPropertiesService_1.IExtensionManifestPropertiesService),
        __param(16, instantiation_1.IInstantiationService)
    ], ExtensionEnablementService);
    exports.ExtensionEnablementService = ExtensionEnablementService;
    let ExtensionsManager = class ExtensionsManager extends lifecycle_1.Disposable {
        constructor(extensionManagementService, extensionManagementServerService, logService) {
            super();
            this.extensionManagementService = extensionManagementService;
            this.extensionManagementServerService = extensionManagementServerService;
            this.logService = logService;
            this._extensions = [];
            this._onDidChangeExtensions = this._register(new event_1.Emitter());
            this.onDidChangeExtensions = this._onDidChangeExtensions.event;
            this.disposed = false;
            this._register((0, lifecycle_1.toDisposable)(() => this.disposed = true));
            this.initializePromise = this.initialize();
        }
        get extensions() { return this._extensions; }
        whenInitialized() {
            return this.initializePromise;
        }
        async initialize() {
            try {
                this._extensions = await this.extensionManagementService.getInstalled();
                if (this.disposed) {
                    return;
                }
                this._onDidChangeExtensions.fire({ added: this.extensions, removed: [] });
            }
            catch (error) {
                this.logService.error(error);
            }
            this._register(this.extensionManagementService.onDidInstallExtensions(e => this.onDidInstallExtensions(e.reduce((result, { local, operation }) => { if (local && operation !== 4 /* InstallOperation.Migrate */) {
                result.push(local);
            } return result; }, []))));
            this._register(event_1.Event.filter(this.extensionManagementService.onDidUninstallExtension, (e => !e.error))(e => this.onDidUninstallExtension(e.identifier, e.server)));
        }
        onDidInstallExtensions(extensions) {
            if (extensions.length) {
                this._extensions.push(...extensions);
                this._onDidChangeExtensions.fire({ added: extensions, removed: [] });
            }
        }
        onDidUninstallExtension(identifier, server) {
            const index = this._extensions.findIndex(e => (0, extensionManagementUtil_1.areSameExtensions)(e.identifier, identifier) && this.extensionManagementServerService.getExtensionManagementServer(e) === server);
            if (index !== -1) {
                const removed = this._extensions.splice(index, 1);
                this._onDidChangeExtensions.fire({ added: [], removed });
            }
        }
    };
    ExtensionsManager = __decorate([
        __param(0, extensionManagement_2.IWorkbenchExtensionManagementService),
        __param(1, extensionManagement_2.IExtensionManagementServerService),
        __param(2, log_1.ILogService)
    ], ExtensionsManager);
    (0, extensions_2.registerSingleton)(extensionManagement_2.IWorkbenchExtensionEnablementService, ExtensionEnablementService);
});
//# sourceMappingURL=extensionEnablementService.js.map