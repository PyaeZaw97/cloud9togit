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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/severity", "vs/base/common/strings", "vs/editor/browser/editorBrowser", "vs/editor/common/languages/language", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/quickinput/common/quickInput", "vs/platform/registry/common/platform", "vs/workbench/contrib/debug/common/breakpoints", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugger", "vs/workbench/contrib/debug/common/debugSchemas", "vs/workbench/contrib/tasks/common/taskDefinitionRegistry", "vs/workbench/services/configuration/common/configuration", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, event_1, lifecycle_1, severity_1, strings, editorBrowser_1, language_1, nls, commands_1, configuration_1, contextkey_1, dialogs_1, instantiation_1, jsonContributionRegistry_1, quickInput_1, platform_1, breakpoints_1, debug_1, debugger_1, debugSchemas_1, taskDefinitionRegistry_1, configuration_2, editorService_1, extensions_1, lifecycle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AdapterManager = void 0;
    const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    let AdapterManager = class AdapterManager extends lifecycle_1.Disposable {
        constructor(editorService, configurationService, quickInputService, instantiationService, commandService, extensionService, contextKeyService, languageService, dialogService, lifecycleService) {
            super();
            this.editorService = editorService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            this.extensionService = extensionService;
            this.contextKeyService = contextKeyService;
            this.languageService = languageService;
            this.dialogService = dialogService;
            this.lifecycleService = lifecycleService;
            this.debugAdapterFactories = new Map();
            this._onDidRegisterDebugger = new event_1.Emitter();
            this._onDidDebuggersExtPointRead = new event_1.Emitter();
            this.breakpointContributions = [];
            this.debuggerWhenKeys = new Set();
            this.adapterDescriptorFactories = [];
            this.debuggers = [];
            this.registerListeners();
            this.debuggersAvailable = debug_1.CONTEXT_DEBUGGERS_AVAILABLE.bindTo(contextKeyService);
            this._register(this.contextKeyService.onDidChangeContext(e => {
                if (e.affectsSome(this.debuggerWhenKeys)) {
                    this.debuggersAvailable.set(this.hasEnabledDebuggers());
                    this.updateDebugAdapterSchema();
                }
            }));
            this.debugExtensionsAvailable = debug_1.CONTEXT_DEBUG_EXTENSION_AVAILABLE.bindTo(contextKeyService);
            this.debugExtensionsAvailable.set(true); // Avoid a flash of the default message before extensions load.
            this._register(this.onDidDebuggersExtPointRead(() => {
                this.debugExtensionsAvailable.set(this.debuggers.length > 0);
            }));
            this.lifecycleService.when(4 /* LifecyclePhase.Eventually */)
                .then(() => this.debugExtensionsAvailable.set(this.debuggers.length > 0)); // If no extensions with a debugger contribution are loaded
        }
        registerListeners() {
            debugSchemas_1.debuggersExtPoint.setHandler((extensions, delta) => {
                delta.added.forEach(added => {
                    added.value.forEach(rawAdapter => {
                        var _a;
                        if (!rawAdapter.type || (typeof rawAdapter.type !== 'string')) {
                            added.collector.error(nls.localize('debugNoType', "Debugger 'type' can not be omitted and must be of type 'string'."));
                        }
                        if (rawAdapter.type !== '*') {
                            const existing = this.getDebugger(rawAdapter.type);
                            if (existing) {
                                existing.merge(rawAdapter, added.description);
                            }
                            else {
                                const dbg = this.instantiationService.createInstance(debugger_1.Debugger, this, rawAdapter, added.description);
                                (_a = dbg.when) === null || _a === void 0 ? void 0 : _a.keys().forEach(key => this.debuggerWhenKeys.add(key));
                                this.debuggers.push(dbg);
                            }
                        }
                    });
                });
                // take care of all wildcard contributions
                extensions.forEach(extension => {
                    extension.value.forEach(rawAdapter => {
                        if (rawAdapter.type === '*') {
                            this.debuggers.forEach(dbg => dbg.merge(rawAdapter, extension.description));
                        }
                    });
                });
                delta.removed.forEach(removed => {
                    const removedTypes = removed.value.map(rawAdapter => rawAdapter.type);
                    this.debuggers = this.debuggers.filter(d => removedTypes.indexOf(d.type) === -1);
                });
                this.updateDebugAdapterSchema();
                this._onDidDebuggersExtPointRead.fire();
            });
            debugSchemas_1.breakpointsExtPoint.setHandler(extensions => {
                this.breakpointContributions = extensions.flatMap(ext => ext.value.map(breakpoint => this.instantiationService.createInstance(breakpoints_1.Breakpoints, breakpoint)));
            });
        }
        updateDebugAdapterSchema() {
            // update the schema to include all attributes, snippets and types from extensions.
            const items = debugSchemas_1.launchSchema.properties['configurations'].items;
            const taskSchema = taskDefinitionRegistry_1.TaskDefinitionRegistry.getJsonSchema();
            const definitions = {
                'common': {
                    properties: {
                        'name': {
                            type: 'string',
                            description: nls.localize('debugName', "Name of configuration; appears in the launch configuration dropdown menu."),
                            default: 'Launch'
                        },
                        'debugServer': {
                            type: 'number',
                            description: nls.localize('debugServer', "For debug extension development only: if a port is specified VS Code tries to connect to a debug adapter running in server mode"),
                            default: 4711
                        },
                        'preLaunchTask': {
                            anyOf: [taskSchema, {
                                    type: ['string']
                                }],
                            default: '',
                            defaultSnippets: [{ body: { task: '', type: '' } }],
                            description: nls.localize('debugPrelaunchTask', "Task to run before debug session starts.")
                        },
                        'postDebugTask': {
                            anyOf: [taskSchema, {
                                    type: ['string'],
                                }],
                            default: '',
                            defaultSnippets: [{ body: { task: '', type: '' } }],
                            description: nls.localize('debugPostDebugTask', "Task to run after debug session ends.")
                        },
                        'presentation': debugSchemas_1.presentationSchema,
                        'internalConsoleOptions': debug_1.INTERNAL_CONSOLE_OPTIONS_SCHEMA,
                    }
                }
            };
            debugSchemas_1.launchSchema.definitions = definitions;
            items.oneOf = [];
            items.defaultSnippets = [];
            this.debuggers.forEach(adapter => {
                const schemaAttributes = adapter.getSchemaAttributes(definitions);
                if (schemaAttributes && items.oneOf) {
                    items.oneOf.push(...schemaAttributes);
                }
                const configurationSnippets = adapter.configurationSnippets;
                if (configurationSnippets && items.defaultSnippets) {
                    items.defaultSnippets.push(...configurationSnippets);
                }
            });
            jsonRegistry.registerSchema(configuration_2.launchSchemaId, debugSchemas_1.launchSchema);
        }
        registerDebugAdapterFactory(debugTypes, debugAdapterLauncher) {
            debugTypes.forEach(debugType => this.debugAdapterFactories.set(debugType, debugAdapterLauncher));
            this.debuggersAvailable.set(this.hasEnabledDebuggers());
            this._onDidRegisterDebugger.fire();
            return {
                dispose: () => {
                    debugTypes.forEach(debugType => this.debugAdapterFactories.delete(debugType));
                }
            };
        }
        hasEnabledDebuggers() {
            for (const [type] of this.debugAdapterFactories) {
                const dbg = this.getDebugger(type);
                if (dbg && dbg.enabled) {
                    return true;
                }
            }
            return false;
        }
        createDebugAdapter(session) {
            const factory = this.debugAdapterFactories.get(session.configuration.type);
            if (factory) {
                return factory.createDebugAdapter(session);
            }
            return undefined;
        }
        substituteVariables(debugType, folder, config) {
            const factory = this.debugAdapterFactories.get(debugType);
            if (factory) {
                return factory.substituteVariables(folder, config);
            }
            return Promise.resolve(config);
        }
        runInTerminal(debugType, args, sessionId) {
            const factory = this.debugAdapterFactories.get(debugType);
            if (factory) {
                return factory.runInTerminal(args, sessionId);
            }
            return Promise.resolve(void 0);
        }
        registerDebugAdapterDescriptorFactory(debugAdapterProvider) {
            this.adapterDescriptorFactories.push(debugAdapterProvider);
            return {
                dispose: () => {
                    this.unregisterDebugAdapterDescriptorFactory(debugAdapterProvider);
                }
            };
        }
        unregisterDebugAdapterDescriptorFactory(debugAdapterProvider) {
            const ix = this.adapterDescriptorFactories.indexOf(debugAdapterProvider);
            if (ix >= 0) {
                this.adapterDescriptorFactories.splice(ix, 1);
            }
        }
        getDebugAdapterDescriptor(session) {
            const config = session.configuration;
            const providers = this.adapterDescriptorFactories.filter(p => p.type === config.type && p.createDebugAdapterDescriptor);
            if (providers.length === 1) {
                return providers[0].createDebugAdapterDescriptor(session);
            }
            else {
                // TODO@AW handle n > 1 case
            }
            return Promise.resolve(undefined);
        }
        getDebuggerLabel(type) {
            const dbgr = this.getDebugger(type);
            if (dbgr) {
                return dbgr.label;
            }
            return undefined;
        }
        get onDidRegisterDebugger() {
            return this._onDidRegisterDebugger.event;
        }
        get onDidDebuggersExtPointRead() {
            return this._onDidDebuggersExtPointRead.event;
        }
        canSetBreakpointsIn(model) {
            const languageId = model.getLanguageId();
            if (!languageId || languageId === 'jsonc' || languageId === 'log') {
                // do not allow breakpoints in our settings files and output
                return false;
            }
            if (this.configurationService.getValue('debug').allowBreakpointsEverywhere) {
                return true;
            }
            return this.breakpointContributions.some(breakpoints => breakpoints.language === languageId && breakpoints.enabled);
        }
        getDebugger(type) {
            return this.debuggers.find(dbg => strings.equalsIgnoreCase(dbg.type, type));
        }
        isDebuggerInterestedInLanguage(language) {
            return !!this.debuggers
                .filter(d => d.enabled)
                .find(a => language && a.languages && a.languages.indexOf(language) >= 0);
        }
        async guessDebugger(gettingConfigurations, type) {
            if (type) {
                const adapter = this.getDebugger(type);
                return adapter && adapter.enabled ? adapter : undefined;
            }
            const activeTextEditorControl = this.editorService.activeTextEditorControl;
            let candidates = [];
            let languageLabel = null;
            let model = null;
            if ((0, editorBrowser_1.isCodeEditor)(activeTextEditorControl)) {
                model = activeTextEditorControl.getModel();
                const language = model ? model.getLanguageId() : undefined;
                if (language) {
                    languageLabel = this.languageService.getLanguageName(language);
                }
                const adapters = this.debuggers
                    .filter(a => a.enabled)
                    .filter(a => language && a.languages && a.languages.indexOf(language) >= 0);
                if (adapters.length === 1) {
                    return adapters[0];
                }
                if (adapters.length > 1) {
                    candidates = adapters;
                }
            }
            // We want to get the debuggers that have configuration providers in the case we are fetching configurations
            // Or if a breakpoint can be set in the current file (good hint that an extension can handle it)
            if ((!languageLabel || gettingConfigurations || (model && this.canSetBreakpointsIn(model))) && candidates.length === 0) {
                await this.activateDebuggers('onDebugInitialConfigurations');
                candidates = this.debuggers
                    .filter(a => a.enabled)
                    .filter(dbg => dbg.hasInitialConfiguration() || dbg.hasConfigurationProvider());
            }
            candidates.sort((first, second) => first.label.localeCompare(second.label));
            const picks = candidates.map(c => ({ label: c.label, debugger: c }));
            if (picks.length === 0 && languageLabel) {
                if (languageLabel.indexOf(' ') >= 0) {
                    languageLabel = `'${languageLabel}'`;
                }
                const message = nls.localize('CouldNotFindLanguage', "You don't have an extension for debugging {0}. Should we find a {0} extension in the Marketplace?", languageLabel);
                const buttonLabel = nls.localize('findExtension', "Find {0} extension", languageLabel);
                const showResult = await this.dialogService.show(severity_1.default.Warning, message, [buttonLabel, nls.localize('cancel', "Cancel")], { cancelId: 1 });
                if (showResult.choice === 0) {
                    await this.commandService.executeCommand('debug.installAdditionalDebuggers', languageLabel);
                }
                return undefined;
            }
            picks.push({ type: 'separator', label: '' });
            const placeHolder = nls.localize('selectDebug', "Select environment");
            picks.push({ label: languageLabel ? nls.localize('installLanguage', "Install an extension for {0}...", languageLabel) : nls.localize('installExt', "Install extension...") });
            return this.quickInputService.pick(picks, { activeItem: picks[0], placeHolder })
                .then(picked => {
                if (picked && picked.debugger) {
                    return picked.debugger;
                }
                if (picked) {
                    this.commandService.executeCommand('debug.installAdditionalDebuggers', languageLabel);
                }
                return undefined;
            });
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
    };
    AdapterManager = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, quickInput_1.IQuickInputService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, commands_1.ICommandService),
        __param(5, extensions_1.IExtensionService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, language_1.ILanguageService),
        __param(8, dialogs_1.IDialogService),
        __param(9, lifecycle_2.ILifecycleService)
    ], AdapterManager);
    exports.AdapterManager = AdapterManager;
});
//# sourceMappingURL=debugAdapterManager.js.map