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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/json", "vs/base/common/uri", "vs/base/common/resources", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/workspace/common/workspace", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/preferences/common/preferences", "vs/platform/registry/common/platform", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/workbench/contrib/debug/common/debugSchemas", "vs/platform/quickinput/common/quickInput", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/cancellation", "vs/base/common/types", "vs/base/common/async", "vs/workbench/services/history/common/history", "vs/base/common/arrays", "vs/workbench/contrib/debug/common/debugUtils", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/debug/browser/debugIcons", "vs/platform/theme/common/themeService"], function (require, exports, nls, lifecycle_1, event_1, objects, json, uri_1, resources, storage_1, extensions_1, configuration_1, files_1, workspace_1, instantiation_1, debug_1, editorService_1, configuration_2, preferences_1, platform_1, jsonContributionRegistry_1, debugSchemas_1, quickInput_1, contextkey_1, textfiles_1, cancellation_1, types_1, async_1, history_1, arrays_1, debugUtils_1, uriIdentity_1, debugIcons_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ConfigurationManager = void 0;
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    jsonRegistry.registerSchema(configuration_2.launchSchemaId, debugSchemas_1.launchSchema);
    const DEBUG_SELECTED_CONFIG_NAME_KEY = 'debug.selectedconfigname';
    const DEBUG_SELECTED_ROOT = 'debug.selectedroot';
    // Debug type is only stored if a dynamic configuration is used for better restore
    const DEBUG_SELECTED_TYPE = 'debug.selectedtype';
    const DEBUG_RECENT_DYNAMIC_CONFIGURATIONS = 'debug.recentdynamicconfigurations';
    let ConfigurationManager = class ConfigurationManager {
        constructor(adapterManager, contextService, configurationService, quickInputService, instantiationService, storageService, extensionService, historyService, uriIdentityService, contextKeyService) {
            this.adapterManager = adapterManager;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.historyService = historyService;
            this.uriIdentityService = uriIdentityService;
            this.getSelectedConfig = () => Promise.resolve(undefined);
            this._onDidSelectConfigurationName = new event_1.Emitter();
            this.configProviders = [];
            this.toDispose = [];
            this.initLaunches();
            this.registerListeners();
            const previousSelectedRoot = this.storageService.get(DEBUG_SELECTED_ROOT, 1 /* StorageScope.WORKSPACE */);
            const previousSelectedType = this.storageService.get(DEBUG_SELECTED_TYPE, 1 /* StorageScope.WORKSPACE */);
            const previousSelectedLaunch = this.launches.find(l => l.uri.toString() === previousSelectedRoot);
            const previousSelectedName = this.storageService.get(DEBUG_SELECTED_CONFIG_NAME_KEY, 1 /* StorageScope.WORKSPACE */);
            this.debugConfigurationTypeContext = debug_1.CONTEXT_DEBUG_CONFIGURATION_TYPE.bindTo(contextKeyService);
            const dynamicConfig = previousSelectedType ? { type: previousSelectedType } : undefined;
            if (previousSelectedLaunch && previousSelectedLaunch.getConfigurationNames().length) {
                this.selectConfiguration(previousSelectedLaunch, previousSelectedName, undefined, dynamicConfig);
            }
            else if (this.launches.length > 0) {
                this.selectConfiguration(undefined, previousSelectedName, undefined, dynamicConfig);
            }
        }
        registerDebugConfigurationProvider(debugConfigurationProvider) {
            this.configProviders.push(debugConfigurationProvider);
            return {
                dispose: () => {
                    this.unregisterDebugConfigurationProvider(debugConfigurationProvider);
                }
            };
        }
        unregisterDebugConfigurationProvider(debugConfigurationProvider) {
            const ix = this.configProviders.indexOf(debugConfigurationProvider);
            if (ix >= 0) {
                this.configProviders.splice(ix, 1);
            }
        }
        /**
         * if scope is not specified,a value of DebugConfigurationProvideTrigger.Initial is assumed.
         */
        hasDebugConfigurationProvider(debugType, triggerKind) {
            if (triggerKind === undefined) {
                triggerKind = debug_1.DebugConfigurationProviderTriggerKind.Initial;
            }
            // check if there are providers for the given type that contribute a provideDebugConfigurations method
            const provider = this.configProviders.find(p => p.provideDebugConfigurations && (p.type === debugType) && (p.triggerKind === triggerKind));
            return !!provider;
        }
        async resolveConfigurationByProviders(folderUri, type, config, token) {
            await this.activateDebuggers('onDebugResolve', type);
            // pipe the config through the promises sequentially. Append at the end the '*' types
            const providers = this.configProviders.filter(p => p.type === type && p.resolveDebugConfiguration)
                .concat(this.configProviders.filter(p => p.type === '*' && p.resolveDebugConfiguration));
            let result = config;
            await (0, async_1.sequence)(providers.map(provider => async () => {
                // If any provider returned undefined or null make sure to respect that and do not pass the result to more resolver
                if (result) {
                    result = await provider.resolveDebugConfiguration(folderUri, result, token);
                }
            }));
            // The resolver can change the type, ensure activation happens, #135090
            if ((result === null || result === void 0 ? void 0 : result.type) && result.type !== config.type) {
                await this.activateDebuggers('onDebugResolve', result.type);
            }
            return result;
        }
        async resolveDebugConfigurationWithSubstitutedVariables(folderUri, type, config, token) {
            // pipe the config through the promises sequentially. Append at the end the '*' types
            const providers = this.configProviders.filter(p => p.type === type && p.resolveDebugConfigurationWithSubstitutedVariables)
                .concat(this.configProviders.filter(p => p.type === '*' && p.resolveDebugConfigurationWithSubstitutedVariables));
            let result = config;
            await (0, async_1.sequence)(providers.map(provider => async () => {
                // If any provider returned undefined or null make sure to respect that and do not pass the result to more resolver
                if (result) {
                    result = await provider.resolveDebugConfigurationWithSubstitutedVariables(folderUri, result, token);
                }
            }));
            return result;
        }
        async provideDebugConfigurations(folderUri, type, token) {
            await this.activateDebuggers('onDebugInitialConfigurations');
            const results = await Promise.all(this.configProviders.filter(p => p.type === type && p.triggerKind === debug_1.DebugConfigurationProviderTriggerKind.Initial && p.provideDebugConfigurations).map(p => p.provideDebugConfigurations(folderUri, token)));
            return results.reduce((first, second) => first.concat(second), []);
        }
        async getDynamicProviders() {
            const extensions = await this.extensionService.getExtensions();
            const onDebugDynamicConfigurationsName = 'onDebugDynamicConfigurations';
            const debugDynamicExtensionsTypes = extensions.reduce((acc, e) => {
                var _a, _b;
                if (!e.activationEvents) {
                    return acc;
                }
                const explicitTypes = [];
                let hasGenericEvent = false;
                for (const event of e.activationEvents) {
                    if (event === onDebugDynamicConfigurationsName) {
                        hasGenericEvent = true;
                    }
                    else if (event.startsWith(`${onDebugDynamicConfigurationsName}:`)) {
                        explicitTypes.push(event.slice(onDebugDynamicConfigurationsName.length + 1));
                    }
                }
                if (explicitTypes.length) {
                    return acc.concat(explicitTypes);
                }
                if (hasGenericEvent) {
                    const debuggerType = (_b = (_a = e.contributes) === null || _a === void 0 ? void 0 : _a.debuggers) === null || _b === void 0 ? void 0 : _b[0].type;
                    return debuggerType ? acc.concat(debuggerType) : acc;
                }
                return acc;
            }, []);
            return debugDynamicExtensionsTypes.map(type => {
                return {
                    label: this.adapterManager.getDebuggerLabel(type),
                    getProvider: async () => {
                        await this.activateDebuggers(onDebugDynamicConfigurationsName, type);
                        return this.configProviders.find(p => p.type === type && p.triggerKind === debug_1.DebugConfigurationProviderTriggerKind.Dynamic && p.provideDebugConfigurations);
                    },
                    type,
                    pick: async () => {
                        // Do a late 'onDebugDynamicConfigurationsName' activation so extensions are not activated too early #108578
                        await this.activateDebuggers(onDebugDynamicConfigurationsName, type);
                        const disposables = new lifecycle_1.DisposableStore();
                        const input = disposables.add(this.quickInputService.createQuickPick());
                        input.busy = true;
                        input.placeholder = nls.localize('selectConfiguration', "Select Launch Configuration");
                        input.show();
                        const chosenPromise = new Promise(resolve => {
                            disposables.add(input.onDidAccept(() => resolve(input.activeItems[0])));
                            disposables.add(input.onDidTriggerItemButton(async (context) => {
                                resolve(undefined);
                                const { launch, config } = context.item;
                                await launch.openConfigFile(false, config.type);
                                // Only Launch have a pin trigger button
                                await launch.writeConfiguration(config);
                                await this.selectConfiguration(launch, config.name);
                            }));
                        });
                        const token = new cancellation_1.CancellationTokenSource();
                        const picks = [];
                        const provider = this.configProviders.find(p => p.type === type && p.triggerKind === debug_1.DebugConfigurationProviderTriggerKind.Dynamic && p.provideDebugConfigurations);
                        this.getLaunches().forEach(launch => {
                            if (launch.workspace && provider) {
                                picks.push(provider.provideDebugConfigurations(launch.workspace.uri, token.token).then(configurations => configurations.map(config => ({
                                    label: config.name,
                                    description: launch.name,
                                    config,
                                    buttons: [{
                                            iconClass: themeService_1.ThemeIcon.asClassName(debugIcons_1.debugConfigure),
                                            tooltip: nls.localize('editLaunchConfig', "Edit Debug Configuration in launch.json")
                                        }],
                                    launch
                                }))));
                            }
                        });
                        const nestedPicks = await Promise.all(picks);
                        const items = (0, arrays_1.flatten)(nestedPicks);
                        input.items = items;
                        input.busy = false;
                        const chosen = await chosenPromise;
                        disposables.dispose();
                        if (!chosen) {
                            // User canceled quick input we should notify the provider to cancel computing configurations
                            token.cancel();
                            return;
                        }
                        return chosen;
                    }
                };
            });
        }
        getAllConfigurations() {
            const all = [];
            for (const l of this.launches) {
                for (const name of l.getConfigurationNames()) {
                    const config = l.getConfiguration(name) || l.getCompound(name);
                    if (config) {
                        all.push({ launch: l, name, presentation: config.presentation });
                    }
                }
            }
            return (0, debugUtils_1.getVisibleAndSorted)(all);
        }
        removeRecentDynamicConfigurations(name, type) {
            const remaining = this.getRecentDynamicConfigurations().filter(c => c.name !== name || c.type !== type);
            this.storageService.store(DEBUG_RECENT_DYNAMIC_CONFIGURATIONS, JSON.stringify(remaining), 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            if (this.selectedConfiguration.name === name && this.selectedType === type) {
                this.selectConfiguration(undefined, undefined);
            }
            else {
                this._onDidSelectConfigurationName.fire();
            }
        }
        getRecentDynamicConfigurations() {
            return JSON.parse(this.storageService.get(DEBUG_RECENT_DYNAMIC_CONFIGURATIONS, 1 /* StorageScope.WORKSPACE */, '[]'));
        }
        registerListeners() {
            this.toDispose.push(event_1.Event.any(this.contextService.onDidChangeWorkspaceFolders, this.contextService.onDidChangeWorkbenchState)(() => {
                this.initLaunches();
                this.selectConfiguration(undefined);
                this.setCompoundSchemaValues();
            }));
            this.toDispose.push(this.configurationService.onDidChangeConfiguration(async (e) => {
                if (e.affectsConfiguration('launch')) {
                    // A change happen in the launch.json. If there is already a launch configuration selected, do not change the selection.
                    await this.selectConfiguration(undefined);
                    this.setCompoundSchemaValues();
                }
            }));
            this.toDispose.push(this.adapterManager.onDidDebuggersExtPointRead(() => {
                this.setCompoundSchemaValues();
            }));
        }
        initLaunches() {
            this.launches = this.contextService.getWorkspace().folders.map(folder => this.instantiationService.createInstance(Launch, this, this.adapterManager, folder));
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                this.launches.push(this.instantiationService.createInstance(WorkspaceLaunch, this, this.adapterManager));
            }
            this.launches.push(this.instantiationService.createInstance(UserLaunch, this, this.adapterManager));
            if (this.selectedLaunch && this.launches.indexOf(this.selectedLaunch) === -1) {
                this.selectConfiguration(undefined);
            }
        }
        setCompoundSchemaValues() {
            const compoundConfigurationsSchema = debugSchemas_1.launchSchema.properties['compounds'].items.properties['configurations'];
            const launchNames = this.launches.map(l => l.getConfigurationNames(true)).reduce((first, second) => first.concat(second), []);
            compoundConfigurationsSchema.items.oneOf[0].enum = launchNames;
            compoundConfigurationsSchema.items.oneOf[1].properties.name.enum = launchNames;
            const folderNames = this.contextService.getWorkspace().folders.map(f => f.name);
            compoundConfigurationsSchema.items.oneOf[1].properties.folder.enum = folderNames;
            jsonRegistry.registerSchema(configuration_2.launchSchemaId, debugSchemas_1.launchSchema);
        }
        getLaunches() {
            return this.launches;
        }
        getLaunch(workspaceUri) {
            if (!uri_1.URI.isUri(workspaceUri)) {
                return undefined;
            }
            return this.launches.find(l => l.workspace && this.uriIdentityService.extUri.isEqual(l.workspace.uri, workspaceUri));
        }
        get selectedConfiguration() {
            return {
                launch: this.selectedLaunch,
                name: this.selectedName,
                getConfig: this.getSelectedConfig,
                type: this.selectedType
            };
        }
        get onDidSelectConfiguration() {
            return this._onDidSelectConfigurationName.event;
        }
        getWorkspaceLaunch() {
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                return this.launches[this.launches.length - 1];
            }
            return undefined;
        }
        async selectConfiguration(launch, name, config, dynamicConfig) {
            if (typeof launch === 'undefined') {
                const rootUri = this.historyService.getLastActiveWorkspaceRoot();
                launch = this.getLaunch(rootUri);
                if (!launch || launch.getConfigurationNames().length === 0) {
                    launch = this.launches.find(l => !!(l && l.getConfigurationNames().length)) || launch || this.launches[0];
                }
            }
            const previousLaunch = this.selectedLaunch;
            const previousName = this.selectedName;
            this.selectedLaunch = launch;
            if (this.selectedLaunch) {
                this.storageService.store(DEBUG_SELECTED_ROOT, this.selectedLaunch.uri.toString(), 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(DEBUG_SELECTED_ROOT, 1 /* StorageScope.WORKSPACE */);
            }
            const names = launch ? launch.getConfigurationNames() : [];
            this.getSelectedConfig = () => {
                const selected = this.selectedName ? launch === null || launch === void 0 ? void 0 : launch.getConfiguration(this.selectedName) : undefined;
                return Promise.resolve(selected || config);
            };
            let type = config === null || config === void 0 ? void 0 : config.type;
            if (name && names.indexOf(name) >= 0) {
                this.setSelectedLaunchName(name);
            }
            else if (dynamicConfig && dynamicConfig.type) {
                // We could not find the previously used name and config is not passed. We should get all dynamic configurations from providers
                // And potentially auto select the previously used dynamic configuration #96293
                type = dynamicConfig.type;
                if (!config) {
                    const providers = (await this.getDynamicProviders()).filter(p => p.type === type);
                    this.getSelectedConfig = async () => {
                        const activatedProviders = await Promise.all(providers.map(p => p.getProvider()));
                        const provider = activatedProviders.length > 0 ? activatedProviders[0] : undefined;
                        if (provider && launch && launch.workspace) {
                            const token = new cancellation_1.CancellationTokenSource();
                            const dynamicConfigs = await provider.provideDebugConfigurations(launch.workspace.uri, token.token);
                            const dynamicConfig = dynamicConfigs.find(c => c.name === name);
                            if (dynamicConfig) {
                                return dynamicConfig;
                            }
                        }
                        return undefined;
                    };
                }
                this.setSelectedLaunchName(name);
                let recentDynamicProviders = this.getRecentDynamicConfigurations();
                if (name && dynamicConfig.type) {
                    // We need to store the recently used dynamic configurations to be able to show them in UI #110009
                    recentDynamicProviders.unshift({ name, type: dynamicConfig.type });
                    recentDynamicProviders = (0, arrays_1.distinct)(recentDynamicProviders, t => `${t.name} : ${t.type}`);
                    this.storageService.store(DEBUG_RECENT_DYNAMIC_CONFIGURATIONS, JSON.stringify(recentDynamicProviders), 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
                }
            }
            else if (!this.selectedName || names.indexOf(this.selectedName) === -1) {
                // We could not find the configuration to select, pick the first one, or reset the selection if there is no launch configuration
                const nameToSet = names.length ? names[0] : undefined;
                this.setSelectedLaunchName(nameToSet);
            }
            if (!config && launch && this.selectedName) {
                config = launch.getConfiguration(this.selectedName);
                type = config === null || config === void 0 ? void 0 : config.type;
            }
            this.selectedType = (dynamicConfig === null || dynamicConfig === void 0 ? void 0 : dynamicConfig.type) || (config === null || config === void 0 ? void 0 : config.type);
            // Only store the selected type if we are having a dynamic configuration. Otherwise restoring this configuration from storage might be misindentified as a dynamic configuration
            this.storageService.store(DEBUG_SELECTED_TYPE, dynamicConfig ? this.selectedType : undefined, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            if (type) {
                this.debugConfigurationTypeContext.set(type);
            }
            else {
                this.debugConfigurationTypeContext.reset();
            }
            if (this.selectedLaunch !== previousLaunch || this.selectedName !== previousName) {
                this._onDidSelectConfigurationName.fire();
            }
        }
        async activateDebuggers(activationEvent, debugType) {
            const promises = [
                this.extensionService.activateByEvent(activationEvent),
                this.extensionService.activateByEvent('onDebug')
            ];
            if (debugType) {
                promises.push(this.extensionService.activateByEvent(`${activationEvent}:${debugType}`));
            }
            await Promise.all(promises);
        }
        setSelectedLaunchName(selectedName) {
            this.selectedName = selectedName;
            if (this.selectedName) {
                this.storageService.store(DEBUG_SELECTED_CONFIG_NAME_KEY, this.selectedName, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
            }
            else {
                this.storageService.remove(DEBUG_SELECTED_CONFIG_NAME_KEY, 1 /* StorageScope.WORKSPACE */);
            }
        }
        dispose() {
            this.toDispose = (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    ConfigurationManager = __decorate([
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, storage_1.IStorageService),
        __param(6, extensions_1.IExtensionService),
        __param(7, history_1.IHistoryService),
        __param(8, uriIdentity_1.IUriIdentityService),
        __param(9, contextkey_1.IContextKeyService)
    ], ConfigurationManager);
    exports.ConfigurationManager = ConfigurationManager;
    class AbstractLaunch {
        constructor(configurationManager, adapterManager) {
            this.configurationManager = configurationManager;
            this.adapterManager = adapterManager;
        }
        getCompound(name) {
            const config = this.getConfig();
            if (!config || !config.compounds) {
                return undefined;
            }
            return config.compounds.find(compound => compound.name === name);
        }
        getConfigurationNames(ignoreCompoundsAndPresentation = false) {
            const config = this.getConfig();
            if (!config || (!Array.isArray(config.configurations) && !Array.isArray(config.compounds))) {
                return [];
            }
            else {
                const configurations = [];
                if (config.configurations) {
                    configurations.push(...config.configurations.filter(cfg => cfg && typeof cfg.name === 'string'));
                }
                if (ignoreCompoundsAndPresentation) {
                    return configurations.map(c => c.name);
                }
                if (config.compounds) {
                    configurations.push(...config.compounds.filter(compound => typeof compound.name === 'string' && compound.configurations && compound.configurations.length));
                }
                return (0, debugUtils_1.getVisibleAndSorted)(configurations).map(c => c.name);
            }
        }
        getConfiguration(name) {
            // We need to clone the configuration in order to be able to make changes to it #42198
            const config = objects.deepClone(this.getConfig());
            if (!config || !config.configurations) {
                return undefined;
            }
            const configuration = config.configurations.find(config => config && config.name === name);
            if (configuration) {
                if (this instanceof UserLaunch) {
                    configuration.__configurationTarget = 1 /* ConfigurationTarget.USER */;
                }
                else if (this instanceof WorkspaceLaunch) {
                    configuration.__configurationTarget = 4 /* ConfigurationTarget.WORKSPACE */;
                }
                else {
                    configuration.__configurationTarget = 5 /* ConfigurationTarget.WORKSPACE_FOLDER */;
                }
            }
            return configuration;
        }
        async getInitialConfigurationContent(folderUri, type, token) {
            let content = '';
            const adapter = await this.adapterManager.guessDebugger(true, type);
            if (adapter) {
                const initialConfigs = await this.configurationManager.provideDebugConfigurations(folderUri, adapter.type, token || cancellation_1.CancellationToken.None);
                content = await adapter.getInitialConfigurationContent(initialConfigs);
            }
            return content;
        }
        get hidden() {
            return false;
        }
    }
    let Launch = class Launch extends AbstractLaunch {
        constructor(configurationManager, adapterManager, workspace, fileService, textFileService, editorService, configurationService) {
            super(configurationManager, adapterManager);
            this.workspace = workspace;
            this.fileService = fileService;
            this.textFileService = textFileService;
            this.editorService = editorService;
            this.configurationService = configurationService;
        }
        get uri() {
            return resources.joinPath(this.workspace.uri, '/.vscode/launch.json');
        }
        get name() {
            return this.workspace.name;
        }
        getConfig() {
            return this.configurationService.inspect('launch', { resource: this.workspace.uri }).workspaceFolderValue;
        }
        async openConfigFile(preserveFocus, type, token) {
            const resource = this.uri;
            let created = false;
            let content = '';
            try {
                const fileContent = await this.fileService.readFile(resource);
                content = fileContent.value.toString();
            }
            catch (_a) {
                // launch.json not found: create one by collecting launch configs from debugConfigProviders
                content = await this.getInitialConfigurationContent(this.workspace.uri, type, token);
                if (!content) {
                    // Cancelled
                    return { editor: null, created: false };
                }
                created = true; // pin only if config file is created #8727
                try {
                    await this.textFileService.write(resource, content);
                }
                catch (error) {
                    throw new Error(nls.localize('DebugConfig.failed', "Unable to create 'launch.json' file inside the '.vscode' folder ({0}).", error.message));
                }
            }
            const index = content.indexOf(`"${this.configurationManager.selectedConfiguration.name}"`);
            let startLineNumber = 1;
            for (let i = 0; i < index; i++) {
                if (content.charAt(i) === '\n') {
                    startLineNumber++;
                }
            }
            const selection = startLineNumber > 1 ? { startLineNumber, startColumn: 4 } : undefined;
            const editor = await this.editorService.openEditor({
                resource,
                options: {
                    selection,
                    preserveFocus,
                    pinned: created,
                    revealIfVisible: true
                },
            }, editorService_1.ACTIVE_GROUP);
            return ({
                editor: (0, types_1.withUndefinedAsNull)(editor),
                created
            });
        }
        async writeConfiguration(configuration) {
            const fullConfig = objects.deepClone(this.getConfig());
            if (!fullConfig.configurations) {
                fullConfig.configurations = [];
            }
            fullConfig.configurations.push(configuration);
            await this.configurationService.updateValue('launch', fullConfig, { resource: this.workspace.uri }, 5 /* ConfigurationTarget.WORKSPACE_FOLDER */);
        }
    };
    Launch = __decorate([
        __param(3, files_1.IFileService),
        __param(4, textfiles_1.ITextFileService),
        __param(5, editorService_1.IEditorService),
        __param(6, configuration_1.IConfigurationService)
    ], Launch);
    let WorkspaceLaunch = class WorkspaceLaunch extends AbstractLaunch {
        constructor(configurationManager, adapterManager, editorService, configurationService, contextService) {
            super(configurationManager, adapterManager);
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.contextService = contextService;
        }
        get workspace() {
            return undefined;
        }
        get uri() {
            return this.contextService.getWorkspace().configuration;
        }
        get name() {
            return nls.localize('workspace', "workspace");
        }
        getConfig() {
            return this.configurationService.inspect('launch').workspaceValue;
        }
        async openConfigFile(preserveFocus, type, token) {
            const launchExistInFile = !!this.getConfig();
            if (!launchExistInFile) {
                // Launch property in workspace config not found: create one by collecting launch configs from debugConfigProviders
                const content = await this.getInitialConfigurationContent(undefined, type, token);
                if (content) {
                    await this.configurationService.updateValue('launch', json.parse(content), 4 /* ConfigurationTarget.WORKSPACE */);
                }
                else {
                    return { editor: null, created: false };
                }
            }
            const editor = await this.editorService.openEditor({
                resource: this.contextService.getWorkspace().configuration,
                options: { preserveFocus }
            }, editorService_1.ACTIVE_GROUP);
            return ({
                editor: (0, types_1.withUndefinedAsNull)(editor),
                created: false
            });
        }
    };
    WorkspaceLaunch = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, workspace_1.IWorkspaceContextService)
    ], WorkspaceLaunch);
    let UserLaunch = class UserLaunch extends AbstractLaunch {
        constructor(configurationManager, adapterManager, configurationService, preferencesService) {
            super(configurationManager, adapterManager);
            this.configurationService = configurationService;
            this.preferencesService = preferencesService;
        }
        get workspace() {
            return undefined;
        }
        get uri() {
            return this.preferencesService.userSettingsResource;
        }
        get name() {
            return nls.localize('user settings', "user settings");
        }
        get hidden() {
            return true;
        }
        getConfig() {
            return this.configurationService.inspect('launch').userValue;
        }
        async openConfigFile(preserveFocus) {
            const editor = await this.preferencesService.openUserSettings({ jsonEditor: true, preserveFocus, revealSetting: { key: 'launch' } });
            return ({
                editor: (0, types_1.withUndefinedAsNull)(editor),
                created: false
            });
        }
    };
    UserLaunch = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, preferences_1.IPreferencesService)
    ], UserLaunch);
});
//# sourceMappingURL=debugConfigurationManager.js.map