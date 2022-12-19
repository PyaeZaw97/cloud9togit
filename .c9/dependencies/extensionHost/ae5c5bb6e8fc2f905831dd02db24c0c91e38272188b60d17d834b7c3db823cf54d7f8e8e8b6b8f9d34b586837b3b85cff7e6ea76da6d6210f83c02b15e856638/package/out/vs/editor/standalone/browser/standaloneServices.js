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
define(["require", "exports", "vs/base/common/strings", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/common/event", "vs/base/common/keybindings", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/severity", "vs/base/common/uri", "vs/editor/browser/services/bulkEditService", "vs/editor/common/config/editorConfigurationSchema", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/editor/common/services/textResourceConfiguration", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationModels", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/abstractKeybindingService", "vs/platform/keybinding/common/keybinding", "vs/platform/keybinding/common/keybindingResolver", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/label/common/label", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/layout/browser/layoutService", "vs/editor/common/standaloneStrings", "vs/base/common/resources", "vs/editor/browser/services/codeEditorService", "vs/platform/log/common/log", "vs/platform/workspace/common/workspaceTrust", "vs/platform/contextview/browser/contextView", "vs/platform/contextview/browser/contextViewService", "vs/editor/common/services/languageService", "vs/platform/contextview/browser/contextMenuService", "vs/platform/theme/common/themeService", "vs/platform/instantiation/common/extensions", "vs/editor/browser/services/openerService", "vs/editor/common/services/editorWorker", "vs/editor/browser/services/editorWorkerService", "vs/editor/common/languages/language", "vs/editor/common/services/markerDecorationsService", "vs/editor/common/services/markerDecorations", "vs/editor/common/services/modelService", "vs/editor/standalone/browser/quickInput/standaloneQuickInputService", "vs/editor/standalone/browser/standaloneThemeService", "vs/editor/standalone/common/standaloneTheme", "vs/platform/accessibility/browser/accessibilityService", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/common/actions", "vs/platform/actions/common/menuService", "vs/platform/clipboard/browser/clipboardService", "vs/platform/clipboard/common/clipboardService", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiationService", "vs/platform/instantiation/common/serviceCollection", "vs/platform/list/browser/listService", "vs/platform/markers/common/markers", "vs/platform/markers/common/markerService", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/base/common/observableValue", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/standalone/browser/standaloneCodeEditorService", "vs/editor/standalone/browser/standaloneLayoutService", "vs/platform/undoRedo/common/undoRedoService", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeaturesService"], function (require, exports, strings, dom, keyboardEvent_1, event_1, keybindings_1, lifecycle_1, platform_1, severity_1, uri_1, bulkEditService_1, editorConfigurationSchema_1, editOperation_1, position_1, range_1, model_1, resolverService_1, textResourceConfiguration_1, commands_1, configuration_1, configurationModels_1, contextkey_1, dialogs_1, instantiation_1, abstractKeybindingService_1, keybinding_1, keybindingResolver_1, keybindingsRegistry_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1, label_1, notification_1, progress_1, telemetry_1, workspace_1, layoutService_1, standaloneStrings_1, resources_1, codeEditorService_1, log_1, workspaceTrust_1, contextView_1, contextViewService_1, languageService_1, contextMenuService_1, themeService_1, extensions_1, openerService_1, editorWorker_1, editorWorkerService_1, language_1, markerDecorationsService_1, markerDecorations_1, modelService_1, standaloneQuickInputService_1, standaloneThemeService_1, standaloneTheme_1, accessibilityService_1, accessibility_1, actions_1, menuService_1, clipboardService_1, clipboardService_2, contextKeyService_1, descriptors_1, instantiationService_1, serviceCollection_1, listService_1, markers_1, markerService_1, opener_1, quickInput_1, storage_1, observableValue_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StandaloneServices = exports.updateConfigurationService = exports.StandaloneConfigurationService = exports.StandaloneKeybindingService = exports.StandaloneCommandService = exports.StandaloneNotificationService = void 0;
    class SimpleModel {
        constructor(model) {
            this.disposed = false;
            this.model = model;
            this._onWillDispose = new event_1.Emitter();
        }
        get onWillDispose() {
            return this._onWillDispose.event;
        }
        resolve() {
            return Promise.resolve();
        }
        get textEditorModel() {
            return this.model;
        }
        createSnapshot() {
            return this.model.createSnapshot();
        }
        isReadonly() {
            return false;
        }
        dispose() {
            this.disposed = true;
            this._onWillDispose.fire();
        }
        isDisposed() {
            return this.disposed;
        }
        isResolved() {
            return true;
        }
        getLanguageId() {
            return this.model.getLanguageId();
        }
    }
    let StandaloneTextModelService = class StandaloneTextModelService {
        constructor(modelService) {
            this.modelService = modelService;
        }
        createModelReference(resource) {
            const model = this.modelService.getModel(resource);
            if (!model) {
                return Promise.reject(new Error(`Model not found`));
            }
            return Promise.resolve(new lifecycle_1.ImmortalReference(new SimpleModel(model)));
        }
        registerTextModelContentProvider(scheme, provider) {
            return {
                dispose: function () { }
            };
        }
        canHandleResource(resource) {
            return false;
        }
    };
    StandaloneTextModelService = __decorate([
        __param(0, model_1.IModelService)
    ], StandaloneTextModelService);
    class StandaloneEditorProgressService {
        show() {
            return StandaloneEditorProgressService.NULL_PROGRESS_RUNNER;
        }
        async showWhile(promise, delay) {
            await promise;
        }
    }
    StandaloneEditorProgressService.NULL_PROGRESS_RUNNER = {
        done: () => { },
        total: () => { },
        worked: () => { }
    };
    class StandaloneDialogService {
        constructor() {
            this.onWillShowDialog = event_1.Event.None;
            this.onDidShowDialog = event_1.Event.None;
        }
        confirm(confirmation) {
            return this.doConfirm(confirmation).then(confirmed => {
                return {
                    confirmed,
                    checkboxChecked: false // unsupported
                };
            });
        }
        doConfirm(confirmation) {
            let messageText = confirmation.message;
            if (confirmation.detail) {
                messageText = messageText + '\n\n' + confirmation.detail;
            }
            return Promise.resolve(window.confirm(messageText));
        }
        show(severity, message, buttons, options) {
            return Promise.resolve({ choice: 0 });
        }
        input() {
            return Promise.resolve({ choice: 0 }); // unsupported
        }
        about() {
            return Promise.resolve(undefined);
        }
    }
    class StandaloneNotificationService {
        constructor() {
            this.onDidAddNotification = event_1.Event.None;
            this.onDidRemoveNotification = event_1.Event.None;
        }
        info(message) {
            return this.notify({ severity: severity_1.default.Info, message });
        }
        warn(message) {
            return this.notify({ severity: severity_1.default.Warning, message });
        }
        error(error) {
            return this.notify({ severity: severity_1.default.Error, message: error });
        }
        notify(notification) {
            switch (notification.severity) {
                case severity_1.default.Error:
                    console.error(notification.message);
                    break;
                case severity_1.default.Warning:
                    console.warn(notification.message);
                    break;
                default:
                    console.log(notification.message);
                    break;
            }
            return StandaloneNotificationService.NO_OP;
        }
        prompt(severity, message, choices, options) {
            return StandaloneNotificationService.NO_OP;
        }
        status(message, options) {
            return lifecycle_1.Disposable.None;
        }
        setFilter(filter) { }
    }
    exports.StandaloneNotificationService = StandaloneNotificationService;
    StandaloneNotificationService.NO_OP = new notification_1.NoOpNotification();
    let StandaloneCommandService = class StandaloneCommandService {
        constructor(instantiationService) {
            this._onWillExecuteCommand = new event_1.Emitter();
            this._onDidExecuteCommand = new event_1.Emitter();
            this.onWillExecuteCommand = this._onWillExecuteCommand.event;
            this.onDidExecuteCommand = this._onDidExecuteCommand.event;
            this._instantiationService = instantiationService;
        }
        executeCommand(id, ...args) {
            const command = commands_1.CommandsRegistry.getCommand(id);
            if (!command) {
                return Promise.reject(new Error(`command '${id}' not found`));
            }
            try {
                this._onWillExecuteCommand.fire({ commandId: id, args });
                const result = this._instantiationService.invokeFunction.apply(this._instantiationService, [command.handler, ...args]);
                this._onDidExecuteCommand.fire({ commandId: id, args });
                return Promise.resolve(result);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    };
    StandaloneCommandService = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], StandaloneCommandService);
    exports.StandaloneCommandService = StandaloneCommandService;
    let StandaloneKeybindingService = class StandaloneKeybindingService extends abstractKeybindingService_1.AbstractKeybindingService {
        constructor(contextKeyService, commandService, telemetryService, notificationService, logService, codeEditorService) {
            super(contextKeyService, commandService, telemetryService, notificationService, logService);
            this._cachedResolver = null;
            this._dynamicKeybindings = [];
            this._domNodeListeners = [];
            const addContainer = (domNode) => {
                const disposables = new lifecycle_1.DisposableStore();
                // for standard keybindings
                disposables.add(dom.addDisposableListener(domNode, dom.EventType.KEY_DOWN, (e) => {
                    const keyEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    const shouldPreventDefault = this._dispatch(keyEvent, keyEvent.target);
                    if (shouldPreventDefault) {
                        keyEvent.preventDefault();
                        keyEvent.stopPropagation();
                    }
                }));
                // for single modifier chord keybindings (e.g. shift shift)
                disposables.add(dom.addDisposableListener(domNode, dom.EventType.KEY_UP, (e) => {
                    const keyEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                    const shouldPreventDefault = this._singleModifierDispatch(keyEvent, keyEvent.target);
                    if (shouldPreventDefault) {
                        keyEvent.preventDefault();
                    }
                }));
                this._domNodeListeners.push(new DomNodeListeners(domNode, disposables));
            };
            const removeContainer = (domNode) => {
                for (let i = 0; i < this._domNodeListeners.length; i++) {
                    const domNodeListeners = this._domNodeListeners[i];
                    if (domNodeListeners.domNode === domNode) {
                        this._domNodeListeners.splice(i, 1);
                        domNodeListeners.dispose();
                    }
                }
            };
            const addCodeEditor = (codeEditor) => {
                if (codeEditor.getOption(54 /* EditorOption.inDiffEditor */)) {
                    return;
                }
                addContainer(codeEditor.getContainerDomNode());
            };
            const removeCodeEditor = (codeEditor) => {
                if (codeEditor.getOption(54 /* EditorOption.inDiffEditor */)) {
                    return;
                }
                removeContainer(codeEditor.getContainerDomNode());
            };
            this._register(codeEditorService.onCodeEditorAdd(addCodeEditor));
            this._register(codeEditorService.onCodeEditorRemove(removeCodeEditor));
            codeEditorService.listCodeEditors().forEach(addCodeEditor);
            const addDiffEditor = (diffEditor) => {
                addContainer(diffEditor.getContainerDomNode());
            };
            const removeDiffEditor = (diffEditor) => {
                removeContainer(diffEditor.getContainerDomNode());
            };
            this._register(codeEditorService.onDiffEditorAdd(addDiffEditor));
            this._register(codeEditorService.onDiffEditorRemove(removeDiffEditor));
            codeEditorService.listDiffEditors().forEach(addDiffEditor);
        }
        addDynamicKeybinding(commandId, _keybinding, handler, when) {
            const keybinding = (0, keybindings_1.createKeybinding)(_keybinding, platform_1.OS);
            const toDispose = new lifecycle_1.DisposableStore();
            if (keybinding) {
                this._dynamicKeybindings.push({
                    keybinding: keybinding.parts,
                    command: commandId,
                    when: when,
                    weight1: 1000,
                    weight2: 0,
                    extensionId: null,
                    isBuiltinExtension: false
                });
                toDispose.add((0, lifecycle_1.toDisposable)(() => {
                    for (let i = 0; i < this._dynamicKeybindings.length; i++) {
                        const kb = this._dynamicKeybindings[i];
                        if (kb.command === commandId) {
                            this._dynamicKeybindings.splice(i, 1);
                            this.updateResolver({ source: 1 /* KeybindingSource.Default */ });
                            return;
                        }
                    }
                }));
            }
            toDispose.add(commands_1.CommandsRegistry.registerCommand(commandId, handler));
            this.updateResolver({ source: 1 /* KeybindingSource.Default */ });
            return toDispose;
        }
        updateResolver(event) {
            this._cachedResolver = null;
            this._onDidUpdateKeybindings.fire(event);
        }
        _getResolver() {
            if (!this._cachedResolver) {
                const defaults = this._toNormalizedKeybindingItems(keybindingsRegistry_1.KeybindingsRegistry.getDefaultKeybindings(), true);
                const overrides = this._toNormalizedKeybindingItems(this._dynamicKeybindings, false);
                this._cachedResolver = new keybindingResolver_1.KeybindingResolver(defaults, overrides, (str) => this._log(str));
            }
            return this._cachedResolver;
        }
        _documentHasFocus() {
            return document.hasFocus();
        }
        _toNormalizedKeybindingItems(items, isDefault) {
            const result = [];
            let resultLen = 0;
            for (const item of items) {
                const when = item.when || undefined;
                const keybinding = item.keybinding;
                if (!keybinding) {
                    // This might be a removal keybinding item in user settings => accept it
                    result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(undefined, item.command, item.commandArgs, when, isDefault, null, false);
                }
                else {
                    const resolvedKeybindings = usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding.resolveUserBinding(keybinding, platform_1.OS);
                    for (const resolvedKeybinding of resolvedKeybindings) {
                        result[resultLen++] = new resolvedKeybindingItem_1.ResolvedKeybindingItem(resolvedKeybinding, item.command, item.commandArgs, when, isDefault, null, false);
                    }
                }
            }
            return result;
        }
        resolveKeybinding(keybinding) {
            return [new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keybinding, platform_1.OS)];
        }
        resolveKeyboardEvent(keyboardEvent) {
            const keybinding = new keybindings_1.SimpleKeybinding(keyboardEvent.ctrlKey, keyboardEvent.shiftKey, keyboardEvent.altKey, keyboardEvent.metaKey, keyboardEvent.keyCode).toChord();
            return new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(keybinding, platform_1.OS);
        }
        resolveUserBinding(userBinding) {
            return [];
        }
        _dumpDebugInfo() {
            return '';
        }
        _dumpDebugInfoJSON() {
            return '';
        }
        registerSchemaContribution(contribution) {
            // noop
        }
    };
    StandaloneKeybindingService = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, commands_1.ICommandService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, notification_1.INotificationService),
        __param(4, log_1.ILogService),
        __param(5, codeEditorService_1.ICodeEditorService)
    ], StandaloneKeybindingService);
    exports.StandaloneKeybindingService = StandaloneKeybindingService;
    class DomNodeListeners extends lifecycle_1.Disposable {
        constructor(domNode, disposables) {
            super();
            this.domNode = domNode;
            this._register(disposables);
        }
    }
    function isConfigurationOverrides(thing) {
        return thing
            && typeof thing === 'object'
            && (!thing.overrideIdentifier || typeof thing.overrideIdentifier === 'string')
            && (!thing.resource || thing.resource instanceof uri_1.URI);
    }
    class StandaloneConfigurationService {
        constructor() {
            this._onDidChangeConfiguration = new event_1.Emitter();
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this._configuration = new configurationModels_1.Configuration(new configurationModels_1.DefaultConfigurationModel(), new configurationModels_1.ConfigurationModel());
        }
        getValue(arg1, arg2) {
            const section = typeof arg1 === 'string' ? arg1 : undefined;
            const overrides = isConfigurationOverrides(arg1) ? arg1 : isConfigurationOverrides(arg2) ? arg2 : {};
            return this._configuration.getValue(section, overrides, undefined);
        }
        updateValues(values) {
            const previous = { data: this._configuration.toData() };
            const changedKeys = [];
            for (const entry of values) {
                const [key, value] = entry;
                if (this.getValue(key) === value) {
                    continue;
                }
                this._configuration.updateValue(key, value);
                changedKeys.push(key);
            }
            if (changedKeys.length > 0) {
                const configurationChangeEvent = new configurationModels_1.ConfigurationChangeEvent({ keys: changedKeys, overrides: [] }, previous, this._configuration);
                configurationChangeEvent.source = 7 /* ConfigurationTarget.MEMORY */;
                configurationChangeEvent.sourceConfig = null;
                this._onDidChangeConfiguration.fire(configurationChangeEvent);
            }
            return Promise.resolve();
        }
        updateValue(key, value, arg3, arg4) {
            return this.updateValues([[key, value]]);
        }
        inspect(key, options = {}) {
            return this._configuration.inspect(key, options, undefined);
        }
        keys() {
            return this._configuration.keys(undefined);
        }
        reloadConfiguration() {
            return Promise.resolve(undefined);
        }
        getConfigurationData() {
            const emptyModel = {
                contents: {},
                keys: [],
                overrides: []
            };
            return {
                defaults: emptyModel,
                user: emptyModel,
                workspace: emptyModel,
                folders: []
            };
        }
    }
    exports.StandaloneConfigurationService = StandaloneConfigurationService;
    let StandaloneResourceConfigurationService = class StandaloneResourceConfigurationService {
        constructor(configurationService) {
            this.configurationService = configurationService;
            this._onDidChangeConfiguration = new event_1.Emitter();
            this.onDidChangeConfiguration = this._onDidChangeConfiguration.event;
            this.configurationService.onDidChangeConfiguration((e) => {
                this._onDidChangeConfiguration.fire({ affectedKeys: e.affectedKeys, affectsConfiguration: (resource, configuration) => e.affectsConfiguration(configuration) });
            });
        }
        getValue(resource, arg2, arg3) {
            const position = position_1.Position.isIPosition(arg2) ? arg2 : null;
            const section = position ? (typeof arg3 === 'string' ? arg3 : undefined) : (typeof arg2 === 'string' ? arg2 : undefined);
            if (typeof section === 'undefined') {
                return this.configurationService.getValue();
            }
            return this.configurationService.getValue(section);
        }
        updateValue(resource, key, value, configurationTarget) {
            return this.configurationService.updateValue(key, value, { resource }, configurationTarget);
        }
    };
    StandaloneResourceConfigurationService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], StandaloneResourceConfigurationService);
    let StandaloneResourcePropertiesService = class StandaloneResourcePropertiesService {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        getEOL(resource, language) {
            const eol = this.configurationService.getValue('files.eol', { overrideIdentifier: language, resource });
            if (eol && typeof eol === 'string' && eol !== 'auto') {
                return eol;
            }
            return (platform_1.isLinux || platform_1.isMacintosh) ? '\n' : '\r\n';
        }
    };
    StandaloneResourcePropertiesService = __decorate([
        __param(0, configuration_1.IConfigurationService)
    ], StandaloneResourcePropertiesService);
    class StandaloneTelemetryService {
        constructor() {
            this.telemetryLevel = (0, observableValue_1.staticObservableValue)(0 /* TelemetryLevel.NONE */);
            this.sendErrorTelemetry = false;
        }
        setEnabled(value) {
        }
        setExperimentProperty(name, value) {
        }
        publicLog(eventName, data) {
            return Promise.resolve(undefined);
        }
        publicLog2(eventName, data) {
            return this.publicLog(eventName, data);
        }
        publicLogError(eventName, data) {
            return Promise.resolve(undefined);
        }
        publicLogError2(eventName, data) {
            return this.publicLogError(eventName, data);
        }
        getTelemetryInfo() {
            throw new Error(`Not available`);
        }
    }
    class StandaloneWorkspaceContextService {
        constructor() {
            this._onDidChangeWorkspaceName = new event_1.Emitter();
            this.onDidChangeWorkspaceName = this._onDidChangeWorkspaceName.event;
            this._onWillChangeWorkspaceFolders = new event_1.Emitter();
            this.onWillChangeWorkspaceFolders = this._onWillChangeWorkspaceFolders.event;
            this._onDidChangeWorkspaceFolders = new event_1.Emitter();
            this.onDidChangeWorkspaceFolders = this._onDidChangeWorkspaceFolders.event;
            this._onDidChangeWorkbenchState = new event_1.Emitter();
            this.onDidChangeWorkbenchState = this._onDidChangeWorkbenchState.event;
            const resource = uri_1.URI.from({ scheme: StandaloneWorkspaceContextService.SCHEME, authority: 'model', path: '/' });
            this.workspace = { id: '4064f6ec-cb38-4ad0-af64-ee6467e63c82', folders: [new workspace_1.WorkspaceFolder({ uri: resource, name: '', index: 0 })] };
        }
        getCompleteWorkspace() {
            return Promise.resolve(this.getWorkspace());
        }
        getWorkspace() {
            return this.workspace;
        }
        getWorkbenchState() {
            if (this.workspace) {
                if (this.workspace.configuration) {
                    return 3 /* WorkbenchState.WORKSPACE */;
                }
                return 2 /* WorkbenchState.FOLDER */;
            }
            return 1 /* WorkbenchState.EMPTY */;
        }
        getWorkspaceFolder(resource) {
            return resource && resource.scheme === StandaloneWorkspaceContextService.SCHEME ? this.workspace.folders[0] : null;
        }
        isInsideWorkspace(resource) {
            return resource && resource.scheme === StandaloneWorkspaceContextService.SCHEME;
        }
        isCurrentWorkspace(workspaceIdOrFolder) {
            return true;
        }
    }
    StandaloneWorkspaceContextService.SCHEME = 'inmemory';
    function updateConfigurationService(configurationService, source, isDiffEditor) {
        if (!source) {
            return;
        }
        if (!(configurationService instanceof StandaloneConfigurationService)) {
            return;
        }
        const toUpdate = [];
        Object.keys(source).forEach((key) => {
            if ((0, editorConfigurationSchema_1.isEditorConfigurationKey)(key)) {
                toUpdate.push([`editor.${key}`, source[key]]);
            }
            if (isDiffEditor && (0, editorConfigurationSchema_1.isDiffEditorConfigurationKey)(key)) {
                toUpdate.push([`diffEditor.${key}`, source[key]]);
            }
        });
        if (toUpdate.length > 0) {
            configurationService.updateValues(toUpdate);
        }
    }
    exports.updateConfigurationService = updateConfigurationService;
    let StandaloneBulkEditService = class StandaloneBulkEditService {
        constructor(_modelService) {
            this._modelService = _modelService;
            //
        }
        hasPreviewHandler() {
            return false;
        }
        setPreviewHandler() {
            return lifecycle_1.Disposable.None;
        }
        async apply(edits, _options) {
            const textEdits = new Map();
            for (let edit of edits) {
                if (!(edit instanceof bulkEditService_1.ResourceTextEdit)) {
                    throw new Error('bad edit - only text edits are supported');
                }
                const model = this._modelService.getModel(edit.resource);
                if (!model) {
                    throw new Error('bad edit - model not found');
                }
                if (typeof edit.versionId === 'number' && model.getVersionId() !== edit.versionId) {
                    throw new Error('bad state - model changed in the meantime');
                }
                let array = textEdits.get(model);
                if (!array) {
                    array = [];
                    textEdits.set(model, array);
                }
                array.push(editOperation_1.EditOperation.replaceMove(range_1.Range.lift(edit.textEdit.range), edit.textEdit.text));
            }
            let totalEdits = 0;
            let totalFiles = 0;
            for (const [model, edits] of textEdits) {
                model.pushStackElement();
                model.pushEditOperations([], edits, () => []);
                model.pushStackElement();
                totalFiles += 1;
                totalEdits += edits.length;
            }
            return {
                ariaSummary: strings.format(standaloneStrings_1.StandaloneServicesNLS.bulkEditServiceSummary, totalEdits, totalFiles)
            };
        }
    };
    StandaloneBulkEditService = __decorate([
        __param(0, model_1.IModelService)
    ], StandaloneBulkEditService);
    class StandaloneUriLabelService {
        constructor() {
            this.onDidChangeFormatters = event_1.Event.None;
        }
        getUriLabel(resource, options) {
            if (resource.scheme === 'file') {
                return resource.fsPath;
            }
            return resource.path;
        }
        getUriBasenameLabel(resource) {
            return (0, resources_1.basename)(resource);
        }
        getWorkspaceLabel(workspace, options) {
            return '';
        }
        getSeparator(scheme, authority) {
            return '/';
        }
        registerFormatter(formatter) {
            throw new Error('Not implemented');
        }
        getHostLabel() {
            return '';
        }
        getHostTooltip() {
            return undefined;
        }
    }
    let StandaloneContextViewService = class StandaloneContextViewService extends contextViewService_1.ContextViewService {
        constructor(layoutService, _codeEditorService) {
            super(layoutService);
            this._codeEditorService = _codeEditorService;
        }
        showContextView(delegate, container, shadowRoot) {
            if (!container) {
                const codeEditor = this._codeEditorService.getFocusedCodeEditor() || this._codeEditorService.getActiveCodeEditor();
                if (codeEditor) {
                    container = codeEditor.getContainerDomNode();
                }
            }
            return super.showContextView(delegate, container, shadowRoot);
        }
    };
    StandaloneContextViewService = __decorate([
        __param(0, layoutService_1.ILayoutService),
        __param(1, codeEditorService_1.ICodeEditorService)
    ], StandaloneContextViewService);
    class StandaloneWorkspaceTrustManagementService {
        constructor() {
            this._neverEmitter = new event_1.Emitter();
            this.onDidChangeTrust = this._neverEmitter.event;
            this.onDidChangeTrustedFolders = this._neverEmitter.event;
            this.workspaceResolved = Promise.resolve();
            this.workspaceTrustInitialized = Promise.resolve();
            this.acceptsOutOfWorkspaceFiles = true;
        }
        isWorkspaceTrusted() {
            return true;
        }
        isWorkspaceTrustForced() {
            return false;
        }
        canSetParentFolderTrust() {
            return false;
        }
        async setParentFolderTrust(trusted) {
            // noop
        }
        canSetWorkspaceTrust() {
            return false;
        }
        async setWorkspaceTrust(trusted) {
            // noop
        }
        getUriTrustInfo(uri) {
            throw new Error('Method not supported.');
        }
        async setUrisTrust(uri, trusted) {
            // noop
        }
        getTrustedUris() {
            return [];
        }
        async setTrustedUris(uris) {
            // noop
        }
        addWorkspaceTrustTransitionParticipant(participant) {
            throw new Error('Method not supported.');
        }
    }
    class StandaloneLanguageService extends languageService_1.LanguageService {
        constructor() {
            super();
        }
    }
    class StandaloneLogService extends log_1.LogService {
        constructor() {
            super(new log_1.ConsoleLogger());
        }
    }
    let StandaloneContextMenuService = class StandaloneContextMenuService extends contextMenuService_1.ContextMenuService {
        constructor(telemetryService, notificationService, contextViewService, keybindingService, themeService) {
            super(telemetryService, notificationService, contextViewService, keybindingService, themeService);
            this.configure({ blockMouse: false }); // we do not want that in the standalone editor
        }
    };
    StandaloneContextMenuService = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, notification_1.INotificationService),
        __param(2, contextView_1.IContextViewService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, themeService_1.IThemeService)
    ], StandaloneContextMenuService);
    (0, extensions_1.registerSingleton)(configuration_1.IConfigurationService, StandaloneConfigurationService);
    (0, extensions_1.registerSingleton)(textResourceConfiguration_1.ITextResourceConfigurationService, StandaloneResourceConfigurationService);
    (0, extensions_1.registerSingleton)(textResourceConfiguration_1.ITextResourcePropertiesService, StandaloneResourcePropertiesService);
    (0, extensions_1.registerSingleton)(workspace_1.IWorkspaceContextService, StandaloneWorkspaceContextService);
    (0, extensions_1.registerSingleton)(label_1.ILabelService, StandaloneUriLabelService);
    (0, extensions_1.registerSingleton)(telemetry_1.ITelemetryService, StandaloneTelemetryService);
    (0, extensions_1.registerSingleton)(dialogs_1.IDialogService, StandaloneDialogService);
    (0, extensions_1.registerSingleton)(notification_1.INotificationService, StandaloneNotificationService);
    (0, extensions_1.registerSingleton)(markers_1.IMarkerService, markerService_1.MarkerService);
    (0, extensions_1.registerSingleton)(language_1.ILanguageService, StandaloneLanguageService);
    (0, extensions_1.registerSingleton)(standaloneTheme_1.IStandaloneThemeService, standaloneThemeService_1.StandaloneThemeService);
    (0, extensions_1.registerSingleton)(log_1.ILogService, StandaloneLogService);
    (0, extensions_1.registerSingleton)(model_1.IModelService, modelService_1.ModelService);
    (0, extensions_1.registerSingleton)(markerDecorations_1.IMarkerDecorationsService, markerDecorationsService_1.MarkerDecorationsService);
    (0, extensions_1.registerSingleton)(contextkey_1.IContextKeyService, contextKeyService_1.ContextKeyService);
    (0, extensions_1.registerSingleton)(progress_1.IEditorProgressService, StandaloneEditorProgressService);
    (0, extensions_1.registerSingleton)(storage_1.IStorageService, storage_1.InMemoryStorageService);
    (0, extensions_1.registerSingleton)(editorWorker_1.IEditorWorkerService, editorWorkerService_1.EditorWorkerService);
    (0, extensions_1.registerSingleton)(bulkEditService_1.IBulkEditService, StandaloneBulkEditService);
    (0, extensions_1.registerSingleton)(workspaceTrust_1.IWorkspaceTrustManagementService, StandaloneWorkspaceTrustManagementService);
    (0, extensions_1.registerSingleton)(resolverService_1.ITextModelService, StandaloneTextModelService);
    (0, extensions_1.registerSingleton)(accessibility_1.IAccessibilityService, accessibilityService_1.AccessibilityService);
    (0, extensions_1.registerSingleton)(listService_1.IListService, listService_1.ListService);
    (0, extensions_1.registerSingleton)(commands_1.ICommandService, StandaloneCommandService);
    (0, extensions_1.registerSingleton)(keybinding_1.IKeybindingService, StandaloneKeybindingService);
    (0, extensions_1.registerSingleton)(quickInput_1.IQuickInputService, standaloneQuickInputService_1.StandaloneQuickInputService);
    (0, extensions_1.registerSingleton)(contextView_1.IContextViewService, StandaloneContextViewService);
    (0, extensions_1.registerSingleton)(opener_1.IOpenerService, openerService_1.OpenerService);
    (0, extensions_1.registerSingleton)(clipboardService_2.IClipboardService, clipboardService_1.BrowserClipboardService);
    (0, extensions_1.registerSingleton)(contextView_1.IContextMenuService, StandaloneContextMenuService);
    (0, extensions_1.registerSingleton)(actions_1.IMenuService, menuService_1.MenuService);
    /**
     * We don't want to eagerly instantiate services because embedders get a one time chance
     * to override services when they create the first editor.
     */
    var StandaloneServices;
    (function (StandaloneServices) {
        const serviceCollection = new serviceCollection_1.ServiceCollection();
        for (const [id, descriptor] of (0, extensions_1.getSingletonServiceDescriptors)()) {
            serviceCollection.set(id, descriptor);
        }
        const instantiationService = new instantiationService_1.InstantiationService(serviceCollection, true);
        serviceCollection.set(instantiation_1.IInstantiationService, instantiationService);
        function get(serviceId) {
            const r = serviceCollection.get(serviceId);
            if (!r) {
                throw new Error('Missing service ' + serviceId);
            }
            if (r instanceof descriptors_1.SyncDescriptor) {
                return instantiationService.invokeFunction((accessor) => accessor.get(serviceId));
            }
            else {
                return r;
            }
        }
        StandaloneServices.get = get;
        let initialized = false;
        function initialize(overrides) {
            if (initialized) {
                return instantiationService;
            }
            initialized = true;
            // Add singletons that were registered after this module loaded
            for (const [id, descriptor] of (0, extensions_1.getSingletonServiceDescriptors)()) {
                if (!serviceCollection.get(id)) {
                    serviceCollection.set(id, descriptor);
                }
            }
            // Initialize the service collection with the overrides, but only if the
            // service was not instantiated in the meantime.
            for (const serviceId in overrides) {
                if (overrides.hasOwnProperty(serviceId)) {
                    const serviceIdentifier = (0, instantiation_1.createDecorator)(serviceId);
                    const r = serviceCollection.get(serviceIdentifier);
                    if (r instanceof descriptors_1.SyncDescriptor) {
                        serviceCollection.set(serviceIdentifier, overrides[serviceId]);
                    }
                }
            }
            return instantiationService;
        }
        StandaloneServices.initialize = initialize;
    })(StandaloneServices = exports.StandaloneServices || (exports.StandaloneServices = {}));
});
//# sourceMappingURL=standaloneServices.js.map