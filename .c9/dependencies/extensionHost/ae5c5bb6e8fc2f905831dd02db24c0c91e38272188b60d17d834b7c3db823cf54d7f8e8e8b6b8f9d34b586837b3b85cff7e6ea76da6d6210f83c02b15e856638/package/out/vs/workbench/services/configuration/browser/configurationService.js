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
define(["require", "exports", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/map", "vs/base/common/objects", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/workspace/common/workspace", "vs/platform/configuration/common/configurationModels", "vs/platform/configuration/common/configuration", "vs/workbench/services/configuration/common/configurationModels", "vs/workbench/services/configuration/common/configuration", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/configuration/common/configurationEditingService", "vs/workbench/services/configuration/browser/configuration", "vs/workbench/services/configuration/common/jsonEditingService", "vs/base/common/performance", "vs/workbench/services/environment/common/environmentService", "vs/workbench/common/contributions", "vs/base/common/errorMessage", "vs/platform/workspace/common/workspaceTrust", "vs/base/common/arrays", "vs/base/common/collections", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/assignment/common/assignmentService", "vs/base/common/types", "vs/nls"], function (require, exports, uri_1, event_1, map_1, objects_1, lifecycle_1, async_1, jsonContributionRegistry_1, workspace_1, configurationModels_1, configuration_1, configurationModels_2, configuration_2, platform_1, configurationRegistry_1, workspaces_1, configurationEditingService_1, configuration_3, jsonEditingService_1, performance_1, environmentService_1, contributions_1, errorMessage_1, workspaceTrust_1, arrays_1, collections_1, extensions_1, assignmentService_1, types_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkspaceService = void 0;
    class Workspace extends workspace_1.Workspace {
        constructor() {
            super(...arguments);
            this.initialized = false;
        }
    }
    class WorkspaceService extends lifecycle_1.Disposable {
        constructor({ remoteAuthority, configurationCache }, environmentService, fileService, remoteAgentService, uriIdentityService, logService) {
            super();
            this.initialized = false;
            this.remoteUserConfiguration = null;
            this._onDidChangeConfiguration = this._register(new event_1.Emitter());
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._onWillChangeWorkspaceFolders = this._register(new event_1.Emitter());
            this.onWillChangeWorkspaceFolders = this._onWillChangeWorkspaceFolders.event;
            this._onDidChangeWorkspaceFolders = this._register(new event_1.Emitter());
            this.onDidChangeWorkspaceFolders = this._onDidChangeWorkspaceFolders.event;
            this._onDidChangeWorkspaceName = this._register(new event_1.Emitter());
            this.onDidChangeWorkspaceName = this._onDidChangeWorkspaceName.event;
            this._onDidChangeWorkbenchState = this._register(new event_1.Emitter());
            this.onDidChangeWorkbenchState = this._onDidChangeWorkbenchState.event;
            this.isWorkspaceTrusted = true;
            this._restrictedSettings = { default: [] };
            this._onDidChangeRestrictedSettings = this._register(new event_1.Emitter());
            this.onDidChangeRestrictedSettings = this._onDidChangeRestrictedSettings.event;
            this.cyclicDependency = new Promise(resolve => this.cyclicDependencyReady = resolve);
            this.configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            this.initRemoteUserConfigurationBarrier = new async_1.Barrier();
            this.completeWorkspaceBarrier = new async_1.Barrier();
            this.defaultConfiguration = new configuration_3.DefaultConfiguration(configurationCache, environmentService);
            this.configurationCache = configurationCache;
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this._configuration = new configurationModels_2.Configuration(this.defaultConfiguration.configurationModel, new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new configurationModels_1.ConfigurationModel(), new map_1.ResourceMap(), new configurationModels_1.ConfigurationModel(), new map_1.ResourceMap(), this.workspace);
            this.cachedFolderConfigs = new map_1.ResourceMap();
            this.localUserConfiguration = this._register(new configuration_3.UserConfiguration(environmentService.settingsResource, remoteAuthority ? configuration_2.LOCAL_MACHINE_SCOPES : undefined, fileService, uriIdentityService, logService));
            this._register(this.localUserConfiguration.onDidChangeConfiguration(userConfiguration => this.onLocalUserConfigurationChanged(userConfiguration)));
            if (remoteAuthority) {
                const remoteUserConfiguration = this.remoteUserConfiguration = this._register(new configuration_3.RemoteUserConfiguration(remoteAuthority, configurationCache, fileService, uriIdentityService, remoteAgentService));
                this._register(remoteUserConfiguration.onDidInitialize(remoteUserConfigurationModel => {
                    this._register(remoteUserConfiguration.onDidChangeConfiguration(remoteUserConfigurationModel => this.onRemoteUserConfigurationChanged(remoteUserConfigurationModel)));
                    this.onRemoteUserConfigurationChanged(remoteUserConfigurationModel);
                    this.initRemoteUserConfigurationBarrier.open();
                }));
            }
            else {
                this.initRemoteUserConfigurationBarrier.open();
            }
            this.workspaceConfiguration = this._register(new configuration_3.WorkspaceConfiguration(configurationCache, fileService, uriIdentityService, logService));
            this._register(this.workspaceConfiguration.onDidUpdateConfiguration(fromCache => {
                this.onWorkspaceConfigurationChanged(fromCache).then(() => {
                    this.workspace.initialized = this.workspaceConfiguration.initialized;
                    this.checkAndMarkWorkspaceComplete(fromCache);
                });
            }));
            this._register(this.defaultConfiguration.onDidChangeConfiguration(({ properties, defaults }) => this.onDefaultConfigurationChanged(defaults, properties)));
            this.workspaceEditingQueue = new async_1.Queue();
        }
        get restrictedSettings() { return this._restrictedSettings; }
        // Workspace Context Service Impl
        async getCompleteWorkspace() {
            await this.completeWorkspaceBarrier.wait();
            return this.getWorkspace();
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkbenchState() {
            // Workspace has configuration file
            if (this.workspace.configuration) {
                return 3 /* WorkbenchState.WORKSPACE */;
            }
            // Folder has single root
            if (this.workspace.folders.length === 1) {
                return 2 /* WorkbenchState.FOLDER */;
            }
            // Empty
            return 1 /* WorkbenchState.EMPTY */;
        }
        getWorkspaceFolder(resource) {
            return this.workspace.getFolder(resource);
        }
        addFolders(foldersToAdd, index) {
            return this.updateFolders(foldersToAdd, [], index);
        }
        removeFolders(foldersToRemove) {
            return this.updateFolders([], foldersToRemove);
        }
        async updateFolders(foldersToAdd, foldersToRemove, index) {
            await this.cyclicDependency;
            return this.workspaceEditingQueue.queue(() => this.doUpdateFolders(foldersToAdd, foldersToRemove, index));
        }
        isInsideWorkspace(resource) {
            return !!this.getWorkspaceFolder(resource);
        }
        isCurrentWorkspace(workspaceIdOrFolder) {
            switch (this.getWorkbenchState()) {
                case 2 /* WorkbenchState.FOLDER */: {
                    let folderUri = undefined;
                    if (uri_1.URI.isUri(workspaceIdOrFolder)) {
                        folderUri = workspaceIdOrFolder;
                    }
                    else if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(workspaceIdOrFolder)) {
                        folderUri = workspaceIdOrFolder.uri;
                    }
                    return uri_1.URI.isUri(folderUri) && this.uriIdentityService.extUri.isEqual(folderUri, this.workspace.folders[0].uri);
                }
                case 3 /* WorkbenchState.WORKSPACE */:
                    return (0, workspace_1.isWorkspaceIdentifier)(workspaceIdOrFolder) && this.workspace.id === workspaceIdOrFolder.id;
            }
            return false;
        }
        async doUpdateFolders(foldersToAdd, foldersToRemove, index) {
            if (this.getWorkbenchState() !== 3 /* WorkbenchState.WORKSPACE */) {
                return Promise.resolve(undefined); // we need a workspace to begin with
            }
            if (foldersToAdd.length + foldersToRemove.length === 0) {
                return Promise.resolve(undefined); // nothing to do
            }
            let foldersHaveChanged = false;
            // Remove first (if any)
            let currentWorkspaceFolders = this.getWorkspace().folders;
            let newStoredFolders = currentWorkspaceFolders.map(f => f.raw).filter((folder, index) => {
                if (!(0, workspaces_1.isStoredWorkspaceFolder)(folder)) {
                    return true; // keep entries which are unrelated
                }
                return !this.contains(foldersToRemove, currentWorkspaceFolders[index].uri); // keep entries which are unrelated
            });
            const slashForPath = (0, workspaces_1.useSlashForPath)(newStoredFolders);
            foldersHaveChanged = currentWorkspaceFolders.length !== newStoredFolders.length;
            // Add afterwards (if any)
            if (foldersToAdd.length) {
                // Recompute current workspace folders if we have folders to add
                const workspaceConfigPath = this.getWorkspace().configuration;
                const workspaceConfigFolder = this.uriIdentityService.extUri.dirname(workspaceConfigPath);
                currentWorkspaceFolders = (0, workspaces_1.toWorkspaceFolders)(newStoredFolders, workspaceConfigPath, this.uriIdentityService.extUri);
                const currentWorkspaceFolderUris = currentWorkspaceFolders.map(folder => folder.uri);
                const storedFoldersToAdd = [];
                for (const folderToAdd of foldersToAdd) {
                    const folderURI = folderToAdd.uri;
                    if (this.contains(currentWorkspaceFolderUris, folderURI)) {
                        continue; // already existing
                    }
                    try {
                        const result = await this.fileService.stat(folderURI);
                        if (!result.isDirectory) {
                            continue;
                        }
                    }
                    catch (e) { /* Ignore */ }
                    storedFoldersToAdd.push((0, workspaces_1.getStoredWorkspaceFolder)(folderURI, false, folderToAdd.name, workspaceConfigFolder, slashForPath, this.uriIdentityService.extUri));
                }
                // Apply to array of newStoredFolders
                if (storedFoldersToAdd.length > 0) {
                    foldersHaveChanged = true;
                    if (typeof index === 'number' && index >= 0 && index < newStoredFolders.length) {
                        newStoredFolders = newStoredFolders.slice(0);
                        newStoredFolders.splice(index, 0, ...storedFoldersToAdd);
                    }
                    else {
                        newStoredFolders = [...newStoredFolders, ...storedFoldersToAdd];
                    }
                }
            }
            // Set folders if we recorded a change
            if (foldersHaveChanged) {
                return this.setFolders(newStoredFolders);
            }
            return Promise.resolve(undefined);
        }
        async setFolders(folders) {
            await this.cyclicDependency;
            await this.workspaceConfiguration.setFolders(folders, this.jsonEditingService);
            return this.onWorkspaceConfigurationChanged(false);
        }
        contains(resources, toCheck) {
            return resources.some(resource => this.uriIdentityService.extUri.isEqual(resource, toCheck));
        }
        // Workspace Configuration Service Impl
        getConfigurationData() {
            return this._configuration.toData();
        }
        getValue(arg1, arg2) {
            const section = typeof arg1 === 'string' ? arg1 : undefined;
            const overrides = (0, configuration_1.isConfigurationOverrides)(arg1) ? arg1 : (0, configuration_1.isConfigurationOverrides)(arg2) ? arg2 : undefined;
            return this._configuration.getValue(section, overrides);
        }
        async updateValue(key, value, arg3, arg4, donotNotifyError) {
            await this.cyclicDependency;
            const overrides = (0, configuration_1.isConfigurationUpdateOverrides)(arg3) ? arg3
                : (0, configuration_1.isConfigurationOverrides)(arg3) ? { resource: arg3.resource, overrideIdentifiers: arg3.overrideIdentifier ? [arg3.overrideIdentifier] : undefined } : undefined;
            const target = overrides ? arg4 : arg3;
            const targets = target ? [target] : [];
            if (overrides === null || overrides === void 0 ? void 0 : overrides.overrideIdentifiers) {
                overrides.overrideIdentifiers = (0, arrays_1.distinct)(overrides.overrideIdentifiers);
                overrides.overrideIdentifiers = overrides.overrideIdentifiers.length ? overrides.overrideIdentifiers : undefined;
            }
            if (!targets.length) {
                if ((overrides === null || overrides === void 0 ? void 0 : overrides.overrideIdentifiers) && overrides.overrideIdentifiers.length > 1) {
                    throw new Error('Configuration Target is required while updating the value for multiple override identifiers');
                }
                const inspect = this.inspect(key, { resource: overrides === null || overrides === void 0 ? void 0 : overrides.resource, overrideIdentifier: (overrides === null || overrides === void 0 ? void 0 : overrides.overrideIdentifiers) ? overrides.overrideIdentifiers[0] : undefined });
                targets.push(...this.deriveConfigurationTargets(key, value, inspect));
                // Remove the setting, if the value is same as default value and is updated only in user target
                if ((0, objects_1.equals)(value, inspect.defaultValue) && targets.length === 1 && (targets[0] === 1 /* ConfigurationTarget.USER */ || targets[0] === 2 /* ConfigurationTarget.USER_LOCAL */)) {
                    value = undefined;
                }
            }
            await async_1.Promises.settled(targets.map(target => this.writeConfigurationValue(key, value, target, overrides, donotNotifyError)));
        }
        async reloadConfiguration(target) {
            if (target === undefined) {
                const { local, remote } = await this.reloadUserConfiguration();
                await this.reloadWorkspaceConfiguration();
                await this.loadConfiguration(local, remote);
                return;
            }
            if ((0, workspace_1.isWorkspaceFolder)(target)) {
                await this.reloadWorkspaceFolderConfiguration(target);
                return;
            }
            switch (target) {
                case 6 /* ConfigurationTarget.DEFAULT */:
                    await this.reloadDefaultConfiguration();
                    return;
                case 1 /* ConfigurationTarget.USER */: {
                    const { local, remote } = await this.reloadUserConfiguration();
                    await this.loadConfiguration(local, remote);
                    return;
                }
                case 2 /* ConfigurationTarget.USER_LOCAL */:
                    await this.reloadLocalUserConfiguration();
                    return;
                case 3 /* ConfigurationTarget.USER_REMOTE */:
                    await this.reloadRemoteUserConfiguration();
                    return;
                case 4 /* ConfigurationTarget.WORKSPACE */:
                case 5 /* ConfigurationTarget.WORKSPACE_FOLDER */:
                    await this.reloadWorkspaceConfiguration();
                    return;
            }
        }
        inspect(key, overrides) {
            return this._configuration.inspect(key, overrides);
        }
        keys() {
            return this._configuration.keys();
        }
        async whenRemoteConfigurationLoaded() {
            await this.initRemoteUserConfigurationBarrier.wait();
        }
        /**
         * At present, all workspaces (empty, single-folder, multi-root) in local and remote
         * can be initialized without requiring extension host except following case:
         *
         * A multi root workspace with .code-workspace file that has to be resolved by an extension.
         * Because of readonly `rootPath` property in extension API we have to resolve multi root workspace
         * before extension host starts so that `rootPath` can be set to first folder.
         *
         * This restriction is lifted partially for web in `MainThreadWorkspace`.
         * In web, we start extension host with empty `rootPath` in this case.
         *
         * Related root path issue discussion is being tracked here - https://github.com/microsoft/vscode/issues/69335
         */
        async initialize(arg) {
            (0, performance_1.mark)('code/willInitWorkspaceService');
            const workspace = await this.createWorkspace(arg);
            await this.updateWorkspaceAndInitializeConfiguration(workspace);
            this.checkAndMarkWorkspaceComplete(false);
            (0, performance_1.mark)('code/didInitWorkspaceService');
        }
        updateWorkspaceTrust(trusted) {
            if (this.isWorkspaceTrusted !== trusted) {
                this.isWorkspaceTrusted = trusted;
                const data = this._configuration.toData();
                const folderConfigurationModels = [];
                for (const folder of this.workspace.folders) {
                    const folderConfiguration = this.cachedFolderConfigs.get(folder.uri);
                    let configurationModel;
                    if (folderConfiguration) {
                        configurationModel = folderConfiguration.updateWorkspaceTrust(this.isWorkspaceTrusted);
                        this._configuration.updateFolderConfiguration(folder.uri, configurationModel);
                    }
                    folderConfigurationModels.push(configurationModel);
                }
                if (this.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                    if (folderConfigurationModels[0]) {
                        this._configuration.updateWorkspaceConfiguration(folderConfigurationModels[0]);
                    }
                }
                else {
                    this._configuration.updateWorkspaceConfiguration(this.workspaceConfiguration.updateWorkspaceTrust(this.isWorkspaceTrusted));
                }
                this.updateRestrictedSettings();
                let keys = [];
                if (this.restrictedSettings.userLocal) {
                    keys.push(...this.restrictedSettings.userLocal);
                }
                if (this.restrictedSettings.userRemote) {
                    keys.push(...this.restrictedSettings.userRemote);
                }
                if (this.restrictedSettings.workspace) {
                    keys.push(...this.restrictedSettings.workspace);
                }
                if (this.restrictedSettings.workspaceFolder) {
                    this.restrictedSettings.workspaceFolder.forEach((value) => keys.push(...value));
                }
                keys = (0, arrays_1.distinct)(keys);
                if (keys.length) {
                    this.triggerConfigurationChange({ keys, overrides: [] }, { data, workspace: this.workspace }, 4 /* ConfigurationTarget.WORKSPACE */);
                }
            }
        }
        acquireInstantiationService(instantiationService) {
            this.configurationEditingService = instantiationService.createInstance(configurationEditingService_1.ConfigurationEditingService);
            this.jsonEditingService = instantiationService.createInstance(jsonEditingService_1.JSONEditingService);
            if (this.cyclicDependencyReady) {
                this.cyclicDependencyReady();
            }
            else {
                this.cyclicDependency = Promise.resolve(undefined);
            }
        }
        async createWorkspace(arg) {
            if ((0, workspace_1.isWorkspaceIdentifier)(arg)) {
                return this.createMultiFolderWorkspace(arg);
            }
            if ((0, workspace_1.isSingleFolderWorkspaceIdentifier)(arg)) {
                return this.createSingleFolderWorkspace(arg);
            }
            return this.createEmptyWorkspace(arg);
        }
        async createMultiFolderWorkspace(workspaceIdentifier) {
            await this.workspaceConfiguration.initialize({ id: workspaceIdentifier.id, configPath: workspaceIdentifier.configPath }, this.isWorkspaceTrusted);
            const workspaceConfigPath = workspaceIdentifier.configPath;
            const workspaceFolders = (0, workspaces_1.toWorkspaceFolders)(this.workspaceConfiguration.getFolders(), workspaceConfigPath, this.uriIdentityService.extUri);
            const workspaceId = workspaceIdentifier.id;
            const workspace = new Workspace(workspaceId, workspaceFolders, this.workspaceConfiguration.isTransient(), workspaceConfigPath, uri => this.uriIdentityService.extUri.ignorePathCasing(uri));
            workspace.initialized = this.workspaceConfiguration.initialized;
            return workspace;
        }
        createSingleFolderWorkspace(singleFolderWorkspaceIdentifier) {
            const workspace = new Workspace(singleFolderWorkspaceIdentifier.id, [(0, workspace_1.toWorkspaceFolder)(singleFolderWorkspaceIdentifier.uri)], false, null, uri => this.uriIdentityService.extUri.ignorePathCasing(uri));
            workspace.initialized = true;
            return workspace;
        }
        createEmptyWorkspace(emptyWorkspaceIdentifier) {
            const workspace = new Workspace(emptyWorkspaceIdentifier.id, [], false, null, uri => this.uriIdentityService.extUri.ignorePathCasing(uri));
            workspace.initialized = true;
            return Promise.resolve(workspace);
        }
        checkAndMarkWorkspaceComplete(fromCache) {
            if (!this.completeWorkspaceBarrier.isOpen() && this.workspace.initialized) {
                this.completeWorkspaceBarrier.open();
                this.validateWorkspaceFoldersAndReload(fromCache);
            }
        }
        async updateWorkspaceAndInitializeConfiguration(workspace) {
            const hasWorkspaceBefore = !!this.workspace;
            let previousState;
            let previousWorkspacePath;
            let previousFolders = [];
            if (hasWorkspaceBefore) {
                previousState = this.getWorkbenchState();
                previousWorkspacePath = this.workspace.configuration ? this.workspace.configuration.fsPath : undefined;
                previousFolders = this.workspace.folders;
                this.workspace.update(workspace);
            }
            else {
                this.workspace = workspace;
            }
            await this.initializeConfiguration();
            // Trigger changes after configuration initialization so that configuration is up to date.
            if (hasWorkspaceBefore) {
                const newState = this.getWorkbenchState();
                if (previousState && newState !== previousState) {
                    this._onDidChangeWorkbenchState.fire(newState);
                }
                const newWorkspacePath = this.workspace.configuration ? this.workspace.configuration.fsPath : undefined;
                if (previousWorkspacePath && newWorkspacePath !== previousWorkspacePath || newState !== previousState) {
                    this._onDidChangeWorkspaceName.fire();
                }
                const folderChanges = this.compareFolders(previousFolders, this.workspace.folders);
                if (folderChanges && (folderChanges.added.length || folderChanges.removed.length || folderChanges.changed.length)) {
                    await this.handleWillChangeWorkspaceFolders(folderChanges, false);
                    this._onDidChangeWorkspaceFolders.fire(folderChanges);
                }
            }
            if (!this.localUserConfiguration.hasTasksLoaded) {
                // Reload local user configuration again to load user tasks
                this._register((0, async_1.runWhenIdle)(() => this.reloadLocalUserConfiguration(), 5000));
            }
        }
        compareFolders(currentFolders, newFolders) {
            const result = { added: [], removed: [], changed: [] };
            result.added = newFolders.filter(newFolder => !currentFolders.some(currentFolder => newFolder.uri.toString() === currentFolder.uri.toString()));
            for (let currentIndex = 0; currentIndex < currentFolders.length; currentIndex++) {
                let currentFolder = currentFolders[currentIndex];
                let newIndex = 0;
                for (newIndex = 0; newIndex < newFolders.length && currentFolder.uri.toString() !== newFolders[newIndex].uri.toString(); newIndex++) { }
                if (newIndex < newFolders.length) {
                    if (currentIndex !== newIndex || currentFolder.name !== newFolders[newIndex].name) {
                        result.changed.push(currentFolder);
                    }
                }
                else {
                    result.removed.push(currentFolder);
                }
            }
            return result;
        }
        async initializeConfiguration() {
            await this.defaultConfiguration.initialize();
            (0, performance_1.mark)('code/willInitUserConfiguration');
            const { local, remote } = await this.initializeUserConfiguration();
            (0, performance_1.mark)('code/didInitUserConfiguration');
            (0, performance_1.mark)('code/willInitWorkspaceConfiguration');
            await this.loadConfiguration(local, remote);
            (0, performance_1.mark)('code/didInitWorkspaceConfiguration');
        }
        async initializeUserConfiguration() {
            const [local, remote] = await Promise.all([this.localUserConfiguration.initialize(), this.remoteUserConfiguration ? this.remoteUserConfiguration.initialize() : Promise.resolve(new configurationModels_1.ConfigurationModel())]);
            return { local, remote };
        }
        async reloadDefaultConfiguration() {
            this.onDefaultConfigurationChanged(this.defaultConfiguration.reload());
        }
        async reloadUserConfiguration() {
            const [local, remote] = await Promise.all([this.reloadLocalUserConfiguration(true), this.reloadRemoteUserConfiguration(true)]);
            return { local, remote };
        }
        async reloadLocalUserConfiguration(donotTrigger) {
            const model = await this.localUserConfiguration.reload();
            if (!donotTrigger) {
                this.onLocalUserConfigurationChanged(model);
            }
            return model;
        }
        async reloadRemoteUserConfiguration(donotTrigger) {
            if (this.remoteUserConfiguration) {
                const model = await this.remoteUserConfiguration.reload();
                if (!donotTrigger) {
                    this.onRemoteUserConfigurationChanged(model);
                }
                return model;
            }
            return new configurationModels_1.ConfigurationModel();
        }
        async reloadWorkspaceConfiguration() {
            const workbenchState = this.getWorkbenchState();
            if (workbenchState === 2 /* WorkbenchState.FOLDER */) {
                return this.onWorkspaceFolderConfigurationChanged(this.workspace.folders[0]);
            }
            if (workbenchState === 3 /* WorkbenchState.WORKSPACE */) {
                return this.workspaceConfiguration.reload().then(() => this.onWorkspaceConfigurationChanged(false));
            }
        }
        reloadWorkspaceFolderConfiguration(folder) {
            return this.onWorkspaceFolderConfigurationChanged(folder);
        }
        async loadConfiguration(userConfigurationModel, remoteUserConfigurationModel) {
            // reset caches
            this.cachedFolderConfigs = new map_1.ResourceMap();
            const folders = this.workspace.folders;
            const folderConfigurations = await this.loadFolderConfigurations(folders);
            let workspaceConfiguration = this.getWorkspaceConfigurationModel(folderConfigurations);
            const folderConfigurationModels = new map_1.ResourceMap();
            folderConfigurations.forEach((folderConfiguration, index) => folderConfigurationModels.set(folders[index].uri, folderConfiguration));
            const currentConfiguration = this._configuration;
            this._configuration = new configurationModels_2.Configuration(this.defaultConfiguration.configurationModel, userConfigurationModel, remoteUserConfigurationModel, workspaceConfiguration, folderConfigurationModels, new configurationModels_1.ConfigurationModel(), new map_1.ResourceMap(), this.workspace);
            if (this.initialized) {
                const change = this._configuration.compare(currentConfiguration);
                this.triggerConfigurationChange(change, { data: currentConfiguration.toData(), workspace: this.workspace }, 4 /* ConfigurationTarget.WORKSPACE */);
            }
            else {
                this._onDidChangeConfiguration.fire(new configurationModels_1.AllKeysConfigurationChangeEvent(this._configuration, this.workspace, 4 /* ConfigurationTarget.WORKSPACE */, this.getTargetConfiguration(4 /* ConfigurationTarget.WORKSPACE */)));
                this.initialized = true;
            }
            this.updateRestrictedSettings();
        }
        getWorkspaceConfigurationModel(folderConfigurations) {
            switch (this.getWorkbenchState()) {
                case 2 /* WorkbenchState.FOLDER */:
                    return folderConfigurations[0];
                case 3 /* WorkbenchState.WORKSPACE */:
                    return this.workspaceConfiguration.getConfiguration();
                default:
                    return new configurationModels_1.ConfigurationModel();
            }
        }
        onDefaultConfigurationChanged(configurationModel, properties) {
            if (this.workspace) {
                const previousData = this._configuration.toData();
                const change = this._configuration.compareAndUpdateDefaultConfiguration(configurationModel, properties);
                if (this.remoteUserConfiguration) {
                    this._configuration.updateLocalUserConfiguration(this.localUserConfiguration.reparse());
                    this._configuration.updateRemoteUserConfiguration(this.remoteUserConfiguration.reparse());
                }
                if (this.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                    const folderConfiguration = this.cachedFolderConfigs.get(this.workspace.folders[0].uri);
                    if (folderConfiguration) {
                        this._configuration.updateWorkspaceConfiguration(folderConfiguration.reparse());
                        this._configuration.updateFolderConfiguration(this.workspace.folders[0].uri, folderConfiguration.reparse());
                    }
                }
                else {
                    this._configuration.updateWorkspaceConfiguration(this.workspaceConfiguration.reparseWorkspaceSettings());
                    for (const folder of this.workspace.folders) {
                        const folderConfiguration = this.cachedFolderConfigs.get(folder.uri);
                        if (folderConfiguration) {
                            this._configuration.updateFolderConfiguration(folder.uri, folderConfiguration.reparse());
                        }
                    }
                }
                this.triggerConfigurationChange(change, { data: previousData, workspace: this.workspace }, 6 /* ConfigurationTarget.DEFAULT */);
                this.updateRestrictedSettings();
            }
        }
        onLocalUserConfigurationChanged(userConfiguration) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdateLocalUserConfiguration(userConfiguration);
            this.triggerConfigurationChange(change, previous, 1 /* ConfigurationTarget.USER */);
        }
        onRemoteUserConfigurationChanged(userConfiguration) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdateRemoteUserConfiguration(userConfiguration);
            this.triggerConfigurationChange(change, previous, 1 /* ConfigurationTarget.USER */);
        }
        async onWorkspaceConfigurationChanged(fromCache) {
            if (this.workspace && this.workspace.configuration) {
                let newFolders = (0, workspaces_1.toWorkspaceFolders)(this.workspaceConfiguration.getFolders(), this.workspace.configuration, this.uriIdentityService.extUri);
                // Validate only if workspace is initialized
                if (this.workspace.initialized) {
                    const { added, removed, changed } = this.compareFolders(this.workspace.folders, newFolders);
                    /* If changed validate new folders */
                    if (added.length || removed.length || changed.length) {
                        newFolders = await this.toValidWorkspaceFolders(newFolders);
                    }
                    /* Otherwise use existing */
                    else {
                        newFolders = this.workspace.folders;
                    }
                }
                await this.updateWorkspaceConfiguration(newFolders, this.workspaceConfiguration.getConfiguration(), fromCache);
            }
        }
        updateRestrictedSettings() {
            var _a, _b;
            const changed = [];
            const allProperties = this.configurationRegistry.getConfigurationProperties();
            const defaultRestrictedSettings = Object.keys(allProperties).filter(key => allProperties[key].restricted).sort((a, b) => a.localeCompare(b));
            const defaultDelta = (0, arrays_1.delta)(defaultRestrictedSettings, this._restrictedSettings.default, (a, b) => a.localeCompare(b));
            changed.push(...defaultDelta.added, ...defaultDelta.removed);
            const userLocal = this.localUserConfiguration.getRestrictedSettings().sort((a, b) => a.localeCompare(b));
            const userLocalDelta = (0, arrays_1.delta)(userLocal, this._restrictedSettings.userLocal || [], (a, b) => a.localeCompare(b));
            changed.push(...userLocalDelta.added, ...userLocalDelta.removed);
            const userRemote = (((_a = this.remoteUserConfiguration) === null || _a === void 0 ? void 0 : _a.getRestrictedSettings()) || []).sort((a, b) => a.localeCompare(b));
            const userRemoteDelta = (0, arrays_1.delta)(userRemote, this._restrictedSettings.userRemote || [], (a, b) => a.localeCompare(b));
            changed.push(...userRemoteDelta.added, ...userRemoteDelta.removed);
            const workspaceFolderMap = new map_1.ResourceMap();
            for (const workspaceFolder of this.workspace.folders) {
                const cachedFolderConfig = this.cachedFolderConfigs.get(workspaceFolder.uri);
                const folderRestrictedSettings = ((cachedFolderConfig === null || cachedFolderConfig === void 0 ? void 0 : cachedFolderConfig.getRestrictedSettings()) || []).sort((a, b) => a.localeCompare(b));
                if (folderRestrictedSettings.length) {
                    workspaceFolderMap.set(workspaceFolder.uri, folderRestrictedSettings);
                }
                const previous = ((_b = this._restrictedSettings.workspaceFolder) === null || _b === void 0 ? void 0 : _b.get(workspaceFolder.uri)) || [];
                const workspaceFolderDelta = (0, arrays_1.delta)(folderRestrictedSettings, previous, (a, b) => a.localeCompare(b));
                changed.push(...workspaceFolderDelta.added, ...workspaceFolderDelta.removed);
            }
            const workspace = this.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */ ? this.workspaceConfiguration.getRestrictedSettings().sort((a, b) => a.localeCompare(b))
                : this.workspace.folders[0] ? (workspaceFolderMap.get(this.workspace.folders[0].uri) || []) : [];
            const workspaceDelta = (0, arrays_1.delta)(workspace, this._restrictedSettings.workspace || [], (a, b) => a.localeCompare(b));
            changed.push(...workspaceDelta.added, ...workspaceDelta.removed);
            if (changed.length) {
                this._restrictedSettings = {
                    default: defaultRestrictedSettings,
                    userLocal: userLocal.length ? userLocal : undefined,
                    userRemote: userRemote.length ? userRemote : undefined,
                    workspace: workspace.length ? workspace : undefined,
                    workspaceFolder: workspaceFolderMap.size ? workspaceFolderMap : undefined,
                };
                this._onDidChangeRestrictedSettings.fire(this.restrictedSettings);
            }
        }
        async updateWorkspaceConfiguration(workspaceFolders, configuration, fromCache) {
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const change = this._configuration.compareAndUpdateWorkspaceConfiguration(configuration);
            const changes = this.compareFolders(this.workspace.folders, workspaceFolders);
            if (changes.added.length || changes.removed.length || changes.changed.length) {
                this.workspace.folders = workspaceFolders;
                const change = await this.onFoldersChanged();
                await this.handleWillChangeWorkspaceFolders(changes, fromCache);
                this.triggerConfigurationChange(change, previous, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
                this._onDidChangeWorkspaceFolders.fire(changes);
            }
            else {
                this.triggerConfigurationChange(change, previous, 4 /* ConfigurationTarget.WORKSPACE */);
            }
            this.updateRestrictedSettings();
        }
        async handleWillChangeWorkspaceFolders(changes, fromCache) {
            const joiners = [];
            this._onWillChangeWorkspaceFolders.fire({
                join(updateWorkspaceTrustStatePromise) {
                    joiners.push(updateWorkspaceTrustStatePromise);
                },
                changes,
                fromCache
            });
            try {
                await async_1.Promises.settled(joiners);
            }
            catch (error) { /* Ignore */ }
        }
        async onWorkspaceFolderConfigurationChanged(folder) {
            const [folderConfiguration] = await this.loadFolderConfigurations([folder]);
            const previous = { data: this._configuration.toData(), workspace: this.workspace };
            const folderConfiguraitonChange = this._configuration.compareAndUpdateFolderConfiguration(folder.uri, folderConfiguration);
            if (this.getWorkbenchState() === 2 /* WorkbenchState.FOLDER */) {
                const workspaceConfigurationChange = this._configuration.compareAndUpdateWorkspaceConfiguration(folderConfiguration);
                this.triggerConfigurationChange((0, configurationModels_1.mergeChanges)(folderConfiguraitonChange, workspaceConfigurationChange), previous, 4 /* ConfigurationTarget.WORKSPACE */);
            }
            else {
                this.triggerConfigurationChange(folderConfiguraitonChange, previous, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            }
            this.updateRestrictedSettings();
        }
        async onFoldersChanged() {
            const changes = [];
            // Remove the configurations of deleted folders
            for (const key of this.cachedFolderConfigs.keys()) {
                if (!this.workspace.folders.filter(folder => folder.uri.toString() === key.toString())[0]) {
                    const folderConfiguration = this.cachedFolderConfigs.get(key);
                    folderConfiguration.dispose();
                    this.cachedFolderConfigs.delete(key);
                    changes.push(this._configuration.compareAndDeleteFolderConfiguration(key));
                }
            }
            const toInitialize = this.workspace.folders.filter(folder => !this.cachedFolderConfigs.has(folder.uri));
            if (toInitialize.length) {
                const folderConfigurations = await this.loadFolderConfigurations(toInitialize);
                folderConfigurations.forEach((folderConfiguration, index) => {
                    changes.push(this._configuration.compareAndUpdateFolderConfiguration(toInitialize[index].uri, folderConfiguration));
                });
            }
            return (0, configurationModels_1.mergeChanges)(...changes);
        }
        loadFolderConfigurations(folders) {
            return Promise.all([...folders.map(folder => {
                    let folderConfiguration = this.cachedFolderConfigs.get(folder.uri);
                    if (!folderConfiguration) {
                        folderConfiguration = new configuration_3.FolderConfiguration(!this.initialized, folder, configuration_2.FOLDER_CONFIG_FOLDER_NAME, this.getWorkbenchState(), this.isWorkspaceTrusted, this.fileService, this.uriIdentityService, this.logService, this.configurationCache);
                        this._register(folderConfiguration.onDidChange(() => this.onWorkspaceFolderConfigurationChanged(folder)));
                        this.cachedFolderConfigs.set(folder.uri, this._register(folderConfiguration));
                    }
                    return folderConfiguration.loadConfiguration();
                })]);
        }
        async validateWorkspaceFoldersAndReload(fromCache) {
            const validWorkspaceFolders = await this.toValidWorkspaceFolders(this.workspace.folders);
            const { removed } = this.compareFolders(this.workspace.folders, validWorkspaceFolders);
            if (removed.length) {
                await this.updateWorkspaceConfiguration(validWorkspaceFolders, this.workspaceConfiguration.getConfiguration(), fromCache);
            }
        }
        // Filter out workspace folders which are files (not directories)
        // Workspace folders those cannot be resolved are not filtered because they are handled by the Explorer.
        async toValidWorkspaceFolders(workspaceFolders) {
            const validWorkspaceFolders = [];
            for (const workspaceFolder of workspaceFolders) {
                try {
                    const result = await this.fileService.stat(workspaceFolder.uri);
                    if (!result.isDirectory) {
                        continue;
                    }
                }
                catch (e) {
                    this.logService.warn(`Ignoring the error while validating workspace folder ${workspaceFolder.uri.toString()} - ${(0, errorMessage_1.toErrorMessage)(e)}`);
                }
                validWorkspaceFolders.push(workspaceFolder);
            }
            return validWorkspaceFolders;
        }
        async writeConfigurationValue(key, value, target, overrides, donotNotifyError) {
            var _a, _b;
            if (target === 6 /* ConfigurationTarget.DEFAULT */) {
                throw new Error('Invalid configuration target');
            }
            if (target === 7 /* ConfigurationTarget.MEMORY */) {
                const previous = { data: this._configuration.toData(), workspace: this.workspace };
                this._configuration.updateValue(key, value, overrides);
                this.triggerConfigurationChange({ keys: ((_a = overrides === null || overrides === void 0 ? void 0 : overrides.overrideIdentifiers) === null || _a === void 0 ? void 0 : _a.length) ? [(0, configurationRegistry_1.keyFromOverrideIdentifiers)(overrides.overrideIdentifiers), key] : [key], overrides: ((_b = overrides === null || overrides === void 0 ? void 0 : overrides.overrideIdentifiers) === null || _b === void 0 ? void 0 : _b.length) ? overrides.overrideIdentifiers.map(overrideIdentifier => ([overrideIdentifier, [key]])) : [] }, previous, target);
                return;
            }
            const editableConfigurationTarget = this.toEditableConfigurationTarget(target, key);
            if (!editableConfigurationTarget) {
                throw new Error('Invalid configuration target');
            }
            if (editableConfigurationTarget === 2 /* EditableConfigurationTarget.USER_REMOTE */ && !this.remoteUserConfiguration) {
                throw new Error('Invalid configuration target');
            }
            await this.configurationEditingService.writeConfiguration(editableConfigurationTarget, { key, value }, { scopes: overrides, donotNotifyError });
            switch (editableConfigurationTarget) {
                case 1 /* EditableConfigurationTarget.USER_LOCAL */:
                    return this.reloadLocalUserConfiguration().then(() => undefined);
                case 2 /* EditableConfigurationTarget.USER_REMOTE */:
                    return this.reloadRemoteUserConfiguration().then(() => undefined);
                case 3 /* EditableConfigurationTarget.WORKSPACE */:
                    return this.reloadWorkspaceConfiguration();
                case 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */: {
                    const workspaceFolder = overrides && overrides.resource ? this.workspace.getFolder(overrides.resource) : null;
                    if (workspaceFolder) {
                        return this.reloadWorkspaceFolderConfiguration(workspaceFolder);
                    }
                }
            }
        }
        deriveConfigurationTargets(key, value, inspect) {
            if ((0, objects_1.equals)(value, inspect.value)) {
                return [];
            }
            const definedTargets = [];
            if (inspect.workspaceFolderValue !== undefined) {
                definedTargets.push(5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
            }
            if (inspect.workspaceValue !== undefined) {
                definedTargets.push(4 /* ConfigurationTarget.WORKSPACE */);
            }
            if (inspect.userRemoteValue !== undefined) {
                definedTargets.push(3 /* ConfigurationTarget.USER_REMOTE */);
            }
            if (inspect.userLocalValue !== undefined) {
                definedTargets.push(2 /* ConfigurationTarget.USER_LOCAL */);
            }
            if (value === undefined) {
                // Remove the setting in all defined targets
                return definedTargets;
            }
            return [definedTargets[0] || 1 /* ConfigurationTarget.USER */];
        }
        triggerConfigurationChange(change, previous, target) {
            if (change.keys.length) {
                if (target !== 6 /* ConfigurationTarget.DEFAULT */) {
                    this.logService.debug(`Configuration keys changed in ${(0, configuration_1.ConfigurationTargetToString)(target)} target`, ...change.keys);
                }
                const configurationChangeEvent = new configurationModels_1.ConfigurationChangeEvent(change, previous, this._configuration, this.workspace);
                configurationChangeEvent.source = target;
                configurationChangeEvent.sourceConfig = this.getTargetConfiguration(target);
                this._onDidChangeConfiguration.fire(configurationChangeEvent);
            }
        }
        getTargetConfiguration(target) {
            switch (target) {
                case 6 /* ConfigurationTarget.DEFAULT */:
                    return this._configuration.defaults.contents;
                case 1 /* ConfigurationTarget.USER */:
                    return this._configuration.userConfiguration.contents;
                case 4 /* ConfigurationTarget.WORKSPACE */:
                    return this._configuration.workspaceConfiguration.contents;
            }
            return {};
        }
        toEditableConfigurationTarget(target, key) {
            var _a;
            if (target === 1 /* ConfigurationTarget.USER */) {
                if (this.remoteUserConfiguration) {
                    const scope = (_a = this.configurationRegistry.getConfigurationProperties()[key]) === null || _a === void 0 ? void 0 : _a.scope;
                    if (scope === 2 /* ConfigurationScope.MACHINE */ || scope === 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */) {
                        return 2 /* EditableConfigurationTarget.USER_REMOTE */;
                    }
                    if (this.inspect(key).userRemoteValue !== undefined) {
                        return 2 /* EditableConfigurationTarget.USER_REMOTE */;
                    }
                }
                return 1 /* EditableConfigurationTarget.USER_LOCAL */;
            }
            if (target === 2 /* ConfigurationTarget.USER_LOCAL */) {
                return 1 /* EditableConfigurationTarget.USER_LOCAL */;
            }
            if (target === 3 /* ConfigurationTarget.USER_REMOTE */) {
                return 2 /* EditableConfigurationTarget.USER_REMOTE */;
            }
            if (target === 4 /* ConfigurationTarget.WORKSPACE */) {
                return 3 /* EditableConfigurationTarget.WORKSPACE */;
            }
            if (target === 5 /* ConfigurationTarget.WORKSPACE_FOLDER */) {
                return 4 /* EditableConfigurationTarget.WORKSPACE_FOLDER */;
            }
            return null;
        }
    }
    exports.WorkspaceService = WorkspaceService;
    let RegisterConfigurationSchemasContribution = class RegisterConfigurationSchemasContribution extends lifecycle_1.Disposable {
        constructor(workspaceContextService, environmentService, workspaceTrustManagementService) {
            super();
            this.workspaceContextService = workspaceContextService;
            this.environmentService = environmentService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.registerConfigurationSchemas();
            const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            this._register(configurationRegistry.onDidUpdateConfiguration(e => this.registerConfigurationSchemas()));
            this._register(configurationRegistry.onDidSchemaChange(e => this.registerConfigurationSchemas()));
            this._register(workspaceTrustManagementService.onDidChangeTrust(() => this.registerConfigurationSchemas()));
        }
        registerConfigurationSchemas() {
            const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
            const allSettingsSchema = {
                properties: configurationRegistry_1.allSettings.properties,
                patternProperties: configurationRegistry_1.allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            const userSettingsSchema = this.environmentService.remoteAuthority ?
                {
                    properties: Object.assign(Object.assign(Object.assign({}, configurationRegistry_1.applicationSettings.properties), configurationRegistry_1.windowSettings.properties), configurationRegistry_1.resourceSettings.properties),
                    patternProperties: configurationRegistry_1.allSettings.patternProperties,
                    additionalProperties: true,
                    allowTrailingCommas: true,
                    allowComments: true
                }
                : allSettingsSchema;
            const machineSettingsSchema = {
                properties: Object.assign(Object.assign(Object.assign(Object.assign({}, configurationRegistry_1.machineSettings.properties), configurationRegistry_1.machineOverridableSettings.properties), configurationRegistry_1.windowSettings.properties), configurationRegistry_1.resourceSettings.properties),
                patternProperties: configurationRegistry_1.allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            const workspaceSettingsSchema = {
                properties: Object.assign(Object.assign(Object.assign({}, this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.machineOverridableSettings.properties)), this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.windowSettings.properties)), this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.resourceSettings.properties)),
                patternProperties: configurationRegistry_1.allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            jsonRegistry.registerSchema(configuration_2.defaultSettingsSchemaId, {
                properties: Object.keys(configurationRegistry_1.allSettings.properties).reduce((result, key) => {
                    result[key] = Object.assign(Object.assign({}, configurationRegistry_1.allSettings.properties[key]), { deprecationMessage: undefined });
                    return result;
                }, {}),
                patternProperties: Object.keys(configurationRegistry_1.allSettings.patternProperties).reduce((result, key) => {
                    result[key] = Object.assign(Object.assign({}, configurationRegistry_1.allSettings.patternProperties[key]), { deprecationMessage: undefined });
                    return result;
                }, {}),
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            });
            jsonRegistry.registerSchema(configuration_2.userSettingsSchemaId, userSettingsSchema);
            jsonRegistry.registerSchema(configuration_2.machineSettingsSchemaId, machineSettingsSchema);
            if (3 /* WorkbenchState.WORKSPACE */ === this.workspaceContextService.getWorkbenchState()) {
                const folderSettingsSchema = {
                    properties: Object.assign(Object.assign({}, this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.machineOverridableSettings.properties)), this.checkAndFilterPropertiesRequiringTrust(configurationRegistry_1.resourceSettings.properties)),
                    patternProperties: configurationRegistry_1.allSettings.patternProperties,
                    additionalProperties: true,
                    allowTrailingCommas: true,
                    allowComments: true
                };
                jsonRegistry.registerSchema(configuration_2.workspaceSettingsSchemaId, workspaceSettingsSchema);
                jsonRegistry.registerSchema(configuration_2.folderSettingsSchemaId, folderSettingsSchema);
            }
            else {
                jsonRegistry.registerSchema(configuration_2.workspaceSettingsSchemaId, workspaceSettingsSchema);
                jsonRegistry.registerSchema(configuration_2.folderSettingsSchemaId, workspaceSettingsSchema);
            }
            jsonRegistry.registerSchema(configurationRegistry_1.configurationDefaultsSchemaId, {
                type: 'object',
                description: (0, nls_1.localize)('configurationDefaults.description', 'Contribute defaults for configurations'),
                properties: Object.assign(Object.assign(Object.assign({}, configurationRegistry_1.machineOverridableSettings.properties), configurationRegistry_1.windowSettings.properties), configurationRegistry_1.resourceSettings.properties),
                patternProperties: {
                    [configurationRegistry_1.OVERRIDE_PROPERTY_PATTERN]: {
                        type: 'object',
                        default: {},
                        $ref: configurationRegistry_1.resourceLanguageSettingsSchemaId,
                    }
                },
                additionalProperties: false
            });
        }
        checkAndFilterPropertiesRequiringTrust(properties) {
            if (this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                return properties;
            }
            const result = {};
            (0, collections_1.forEach)(properties, ({ key, value }) => {
                if (!value.restricted) {
                    result[key] = value;
                }
            });
            return result;
        }
    };
    RegisterConfigurationSchemasContribution = __decorate([
        __param(0, workspace_1.IWorkspaceContextService),
        __param(1, environmentService_1.IWorkbenchEnvironmentService),
        __param(2, workspaceTrust_1.IWorkspaceTrustManagementService)
    ], RegisterConfigurationSchemasContribution);
    let ResetConfigurationDefaultsOverridesCache = class ResetConfigurationDefaultsOverridesCache extends lifecycle_1.Disposable {
        constructor(configurationService, extensionService) {
            super();
            extensionService.whenInstalledExtensionsRegistered().then(() => configurationService.reloadConfiguration(6 /* ConfigurationTarget.DEFAULT */));
        }
    };
    ResetConfigurationDefaultsOverridesCache = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, extensions_1.IExtensionService)
    ], ResetConfigurationDefaultsOverridesCache);
    let UpdateExperimentalSettingsDefaults = class UpdateExperimentalSettingsDefaults extends lifecycle_1.Disposable {
        constructor(workbenchAssignmentService) {
            super();
            this.workbenchAssignmentService = workbenchAssignmentService;
            this.processedExperimentalSettings = new Set();
            this.configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
            this.processExperimentalSettings(Object.keys(this.configurationRegistry.getConfigurationProperties()));
            this._register(this.configurationRegistry.onDidUpdateConfiguration(({ properties }) => this.processExperimentalSettings(properties)));
        }
        async processExperimentalSettings(properties) {
            var _a;
            const overrides = {};
            const allProperties = this.configurationRegistry.getConfigurationProperties();
            for (const property of properties) {
                const schema = allProperties[property];
                if (!((_a = schema === null || schema === void 0 ? void 0 : schema.tags) === null || _a === void 0 ? void 0 : _a.includes('experimental'))) {
                    continue;
                }
                if (this.processedExperimentalSettings.has(property)) {
                    continue;
                }
                this.processedExperimentalSettings.add(property);
                try {
                    const value = await this.workbenchAssignmentService.getTreatment(`config.${property}`);
                    if (!(0, types_1.isUndefined)(value) && !(0, objects_1.equals)(value, schema.default)) {
                        overrides[property] = value;
                    }
                }
                catch (error) { /*ignore */ }
            }
            if (Object.keys(overrides).length) {
                this.configurationRegistry.registerDefaultConfigurations([{ overrides, source: (0, nls_1.localize)('experimental', "Experiments") }]);
            }
        }
    };
    UpdateExperimentalSettingsDefaults = __decorate([
        __param(0, assignmentService_1.IWorkbenchAssignmentService)
    ], UpdateExperimentalSettingsDefaults);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(RegisterConfigurationSchemasContribution, 3 /* LifecyclePhase.Restored */);
    workbenchContributionsRegistry.registerWorkbenchContribution(ResetConfigurationDefaultsOverridesCache, 4 /* LifecyclePhase.Eventually */);
    workbenchContributionsRegistry.registerWorkbenchContribution(UpdateExperimentalSettingsDefaults, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=configurationService.js.map