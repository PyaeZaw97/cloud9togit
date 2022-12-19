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
define(["require", "exports", "vs/base/browser/browser", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lazy", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/services/codeEditorService", "vs/editor/common/config/fontInfo", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/workbench/common/memento", "vs/workbench/contrib/notebook/browser/extensionPoint", "vs/workbench/contrib/notebook/browser/notebookDiffEditorInput", "vs/workbench/contrib/notebook/common/model/notebookTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/workbench/contrib/notebook/common/notebookOptions", "vs/workbench/contrib/notebook/common/notebookOutputRenderer", "vs/workbench/contrib/notebook/common/notebookProvider", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, browser_1, event_1, iterator_1, lazy_1, lifecycle_1, map_1, network_1, types_1, uri_1, codeEditorService_1, fontInfo_1, accessibility_1, configuration_1, files_1, instantiation_1, storage_1, memento_1, extensionPoint_1, notebookDiffEditorInput_1, notebookTextModel_1, notebookCommon_1, notebookEditorInput_1, notebookEditorModelResolverService_1, notebookOptions_1, notebookOutputRenderer_1, notebookProvider_1, notebookService_1, editorResolverService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookService = exports.NotebookOutputRendererInfoStore = exports.NotebookProviderInfoStore = void 0;
    let NotebookProviderInfoStore = class NotebookProviderInfoStore extends lifecycle_1.Disposable {
        constructor(storageService, extensionService, _editorResolverService, _configurationService, _accessibilityService, _instantiationService, _fileService, _notebookEditorModelResolverService) {
            super();
            this._editorResolverService = _editorResolverService;
            this._configurationService = _configurationService;
            this._accessibilityService = _accessibilityService;
            this._instantiationService = _instantiationService;
            this._fileService = _fileService;
            this._notebookEditorModelResolverService = _notebookEditorModelResolverService;
            this._handled = false;
            this._contributedEditors = new Map();
            this._contributedEditorDisposables = this._register(new lifecycle_1.DisposableStore());
            this._memento = new memento_1.Memento(NotebookProviderInfoStore.CUSTOM_EDITORS_STORAGE_ID, storageService);
            const mementoObject = this._memento.getMemento(0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            for (const info of (mementoObject[NotebookProviderInfoStore.CUSTOM_EDITORS_ENTRY_ID] || [])) {
                this.add(new notebookProvider_1.NotebookProviderInfo(info));
            }
            this._register(extensionService.onDidRegisterExtensions(() => {
                if (!this._handled) {
                    // there is no extension point registered for notebook content provider
                    // clear the memento and cache
                    this._clear();
                    mementoObject[NotebookProviderInfoStore.CUSTOM_EDITORS_ENTRY_ID] = [];
                    this._memento.saveMemento();
                }
            }));
            extensionPoint_1.notebooksExtensionPoint.setHandler(extensions => this._setupHandler(extensions));
        }
        dispose() {
            this._clear();
            super.dispose();
        }
        _setupHandler(extensions) {
            var _a, _b;
            this._handled = true;
            const builtins = [...this._contributedEditors.values()].filter(info => !info.extension);
            this._clear();
            const builtinProvidersFromCache = new Map();
            builtins.forEach(builtin => {
                builtinProvidersFromCache.set(builtin.id, this.add(builtin));
            });
            for (const extension of extensions) {
                for (const notebookContribution of extension.value) {
                    if (!notebookContribution.type) {
                        extension.collector.error(`Notebook does not specify type-property`);
                        continue;
                    }
                    const existing = this.get(notebookContribution.type);
                    if (existing) {
                        if (!existing.extension && extension.description.isBuiltin && builtins.find(builtin => builtin.id === notebookContribution.type)) {
                            // we are registering an extension which is using the same view type which is already cached
                            (_a = builtinProvidersFromCache.get(notebookContribution.type)) === null || _a === void 0 ? void 0 : _a.dispose();
                        }
                        else {
                            extension.collector.error(`Notebook type '${notebookContribution.type}' already used`);
                            continue;
                        }
                    }
                    this.add(new notebookProvider_1.NotebookProviderInfo({
                        extension: extension.description.identifier,
                        id: notebookContribution.type,
                        displayName: notebookContribution.displayName,
                        selectors: notebookContribution.selector || [],
                        priority: this._convertPriority(notebookContribution.priority),
                        providerDisplayName: (_b = extension.description.displayName) !== null && _b !== void 0 ? _b : extension.description.identifier.value,
                        exclusive: false
                    }));
                }
            }
            const mementoObject = this._memento.getMemento(0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            mementoObject[NotebookProviderInfoStore.CUSTOM_EDITORS_ENTRY_ID] = Array.from(this._contributedEditors.values());
            this._memento.saveMemento();
        }
        clearEditorCache() {
            const mementoObject = this._memento.getMemento(0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            mementoObject[NotebookProviderInfoStore.CUSTOM_EDITORS_ENTRY_ID] = [];
            this._memento.saveMemento();
        }
        _convertPriority(priority) {
            if (!priority) {
                return editorResolverService_1.RegisteredEditorPriority.default;
            }
            if (priority === notebookCommon_1.NotebookEditorPriority.default) {
                return editorResolverService_1.RegisteredEditorPriority.default;
            }
            return editorResolverService_1.RegisteredEditorPriority.option;
        }
        _registerContributionPoint(notebookProviderInfo) {
            const disposables = new lifecycle_1.DisposableStore();
            for (const selector of notebookProviderInfo.selectors) {
                const globPattern = selector.include || selector;
                const notebookEditorInfo = {
                    id: notebookProviderInfo.id,
                    label: notebookProviderInfo.displayName,
                    detail: notebookProviderInfo.providerDisplayName,
                    priority: notebookProviderInfo.exclusive ? editorResolverService_1.RegisteredEditorPriority.exclusive : notebookProviderInfo.priority,
                };
                const notebookEditorOptions = {
                    canHandleDiff: () => !!this._configurationService.getValue(notebookCommon_1.NotebookSetting.textDiffEditorPreview) && !this._accessibilityService.isScreenReaderOptimized(),
                    canSupportResource: (resource) => resource.scheme === network_1.Schemas.untitled || resource.scheme === network_1.Schemas.vscodeNotebookCell || this._fileService.hasProvider(resource)
                };
                const notebookEditorInputFactory = ({ resource, options }) => {
                    const data = notebookCommon_1.CellUri.parse(resource);
                    let notebookUri = resource;
                    let cellOptions;
                    if (data) {
                        notebookUri = data.notebook;
                        cellOptions = { resource, options };
                    }
                    const notebookOptions = Object.assign(Object.assign({}, options), { cellOptions });
                    return { editor: notebookEditorInput_1.NotebookEditorInput.create(this._instantiationService, notebookUri, notebookProviderInfo.id), options: notebookOptions };
                };
                const notebookUntitledEditorFactory = async ({ resource, options }) => {
                    const ref = await this._notebookEditorModelResolverService.resolve({ untitledResource: resource }, notebookProviderInfo.id);
                    // untitled notebooks are disposed when they get saved. we should not hold a reference
                    // to such a disposed notebook and therefore dispose the reference as well
                    ref.object.notebook.onWillDispose(() => {
                        ref.dispose();
                    });
                    return { editor: notebookEditorInput_1.NotebookEditorInput.create(this._instantiationService, ref.object.resource, notebookProviderInfo.id), options };
                };
                const notebookDiffEditorInputFactory = ({ modified, original, label, description }) => {
                    return { editor: notebookDiffEditorInput_1.NotebookDiffEditorInput.create(this._instantiationService, modified.resource, label, description, original.resource, notebookProviderInfo.id) };
                };
                // Register the notebook editor
                disposables.add(this._editorResolverService.registerEditor(globPattern, notebookEditorInfo, notebookEditorOptions, notebookEditorInputFactory, notebookUntitledEditorFactory, notebookDiffEditorInputFactory));
                // Then register the schema handler as exclusive for that notebook
                disposables.add(this._editorResolverService.registerEditor(`${network_1.Schemas.vscodeNotebookCell}:/**/${globPattern}`, Object.assign(Object.assign({}, notebookEditorInfo), { priority: editorResolverService_1.RegisteredEditorPriority.exclusive }), notebookEditorOptions, notebookEditorInputFactory, undefined, notebookDiffEditorInputFactory));
            }
            return disposables;
        }
        _clear() {
            this._contributedEditors.clear();
            this._contributedEditorDisposables.clear();
        }
        get(viewType) {
            return this._contributedEditors.get(viewType);
        }
        add(info) {
            if (this._contributedEditors.has(info.id)) {
                throw new Error(`notebook type '${info.id}' ALREADY EXISTS`);
            }
            this._contributedEditors.set(info.id, info);
            const editorRegistration = this._registerContributionPoint(info);
            this._contributedEditorDisposables.add(editorRegistration);
            const mementoObject = this._memento.getMemento(0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            mementoObject[NotebookProviderInfoStore.CUSTOM_EDITORS_ENTRY_ID] = Array.from(this._contributedEditors.values());
            this._memento.saveMemento();
            return (0, lifecycle_1.toDisposable)(() => {
                const mementoObject = this._memento.getMemento(0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                mementoObject[NotebookProviderInfoStore.CUSTOM_EDITORS_ENTRY_ID] = Array.from(this._contributedEditors.values());
                this._memento.saveMemento();
                editorRegistration.dispose();
                this._contributedEditors.delete(info.id);
            });
        }
        getContributedNotebook(resource) {
            const result = [];
            for (const info of this._contributedEditors.values()) {
                if (info.matches(resource)) {
                    result.push(info);
                }
            }
            if (result.length === 0 && resource.scheme === network_1.Schemas.untitled) {
                // untitled resource and no path-specific match => all providers apply
                return Array.from(this._contributedEditors.values());
            }
            return result;
        }
        [Symbol.iterator]() {
            return this._contributedEditors.values();
        }
    };
    NotebookProviderInfoStore.CUSTOM_EDITORS_STORAGE_ID = 'notebookEditors';
    NotebookProviderInfoStore.CUSTOM_EDITORS_ENTRY_ID = 'editors';
    NotebookProviderInfoStore = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, extensions_1.IExtensionService),
        __param(2, editorResolverService_1.IEditorResolverService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, accessibility_1.IAccessibilityService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, files_1.IFileService),
        __param(7, notebookEditorModelResolverService_1.INotebookEditorModelResolverService)
    ], NotebookProviderInfoStore);
    exports.NotebookProviderInfoStore = NotebookProviderInfoStore;
    let NotebookOutputRendererInfoStore = class NotebookOutputRendererInfoStore {
        constructor(storageService) {
            this.contributedRenderers = new Map();
            this.preferredMimetype = new lazy_1.Lazy(() => this.preferredMimetypeMemento.getMemento(1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */));
            this.preferredMimetypeMemento = new memento_1.Memento('workbench.editor.notebook.preferredRenderer2', storageService);
        }
        clear() {
            this.contributedRenderers.clear();
        }
        get(rendererId) {
            return this.contributedRenderers.get(rendererId);
        }
        getAll() {
            return Array.from(this.contributedRenderers.values());
        }
        add(info) {
            if (this.contributedRenderers.has(info.id)) {
                return;
            }
            this.contributedRenderers.set(info.id, info);
        }
        /** Update and remember the preferred renderer for the given mimetype in this workspace */
        setPreferred(notebookProviderInfo, mimeType, rendererId) {
            const mementoObj = this.preferredMimetype.getValue();
            const forNotebook = mementoObj[notebookProviderInfo.id];
            if (forNotebook) {
                forNotebook[mimeType] = rendererId;
            }
            else {
                mementoObj[notebookProviderInfo.id] = { [mimeType]: rendererId };
            }
            this.preferredMimetypeMemento.saveMemento();
        }
        findBestRenderers(notebookProviderInfo, mimeType, kernelProvides) {
            var _a, _b;
            let ReuseOrder;
            (function (ReuseOrder) {
                ReuseOrder[ReuseOrder["PreviouslySelected"] = 256] = "PreviouslySelected";
                ReuseOrder[ReuseOrder["SameExtensionAsNotebook"] = 512] = "SameExtensionAsNotebook";
                ReuseOrder[ReuseOrder["BuiltIn"] = 768] = "BuiltIn";
                ReuseOrder[ReuseOrder["OtherRenderer"] = 1024] = "OtherRenderer";
            })(ReuseOrder || (ReuseOrder = {}));
            const preferred = notebookProviderInfo && ((_a = this.preferredMimetype.getValue()[notebookProviderInfo.id]) === null || _a === void 0 ? void 0 : _a[mimeType]);
            const notebookExtId = (_b = notebookProviderInfo === null || notebookProviderInfo === void 0 ? void 0 : notebookProviderInfo.extension) === null || _b === void 0 ? void 0 : _b.value;
            const notebookId = notebookProviderInfo === null || notebookProviderInfo === void 0 ? void 0 : notebookProviderInfo.id;
            const renderers = Array.from(this.contributedRenderers.values())
                .map(renderer => {
                var _a;
                const ownScore = kernelProvides === undefined
                    ? renderer.matchesWithoutKernel(mimeType)
                    : renderer.matches(mimeType, kernelProvides);
                if (ownScore === 3 /* NotebookRendererMatch.Never */) {
                    return undefined;
                }
                const rendererExtId = renderer.extensionId.value;
                const reuseScore = preferred === renderer.id
                    ? 256 /* ReuseOrder.PreviouslySelected */
                    : rendererExtId === notebookExtId || ((_a = notebookCommon_1.RENDERER_EQUIVALENT_EXTENSIONS.get(rendererExtId)) === null || _a === void 0 ? void 0 : _a.has(notebookId))
                        ? 512 /* ReuseOrder.SameExtensionAsNotebook */
                        : renderer.isBuiltin ? 768 /* ReuseOrder.BuiltIn */ : 1024 /* ReuseOrder.OtherRenderer */;
                return {
                    ordered: { mimeType, rendererId: renderer.id, isTrusted: true },
                    score: reuseScore | ownScore,
                };
            }).filter(types_1.isDefined);
            if (renderers.length === 0) {
                return [{ mimeType, rendererId: notebookCommon_1.RENDERER_NOT_AVAILABLE, isTrusted: true }];
            }
            return renderers.sort((a, b) => a.score - b.score).map(r => r.ordered);
        }
    };
    NotebookOutputRendererInfoStore = __decorate([
        __param(0, storage_1.IStorageService)
    ], NotebookOutputRendererInfoStore);
    exports.NotebookOutputRendererInfoStore = NotebookOutputRendererInfoStore;
    class ModelData {
        constructor(model, onWillDispose) {
            this.model = model;
            this._modelEventListeners = new lifecycle_1.DisposableStore();
            this._modelEventListeners.add(model.onWillDispose(() => onWillDispose(model)));
        }
        dispose() {
            this._modelEventListeners.dispose();
        }
    }
    let NotebookService = class NotebookService extends lifecycle_1.Disposable {
        constructor(_extensionService, _configurationService, _accessibilityService, _instantiationService, _codeEditorService, configurationService) {
            super();
            this._extensionService = _extensionService;
            this._configurationService = _configurationService;
            this._accessibilityService = _accessibilityService;
            this._instantiationService = _instantiationService;
            this._codeEditorService = _codeEditorService;
            this.configurationService = configurationService;
            this._notebookProviders = new Map();
            this._notebookProviderInfoStore = undefined;
            this._notebookRenderersInfoStore = this._instantiationService.createInstance(NotebookOutputRendererInfoStore);
            this._models = new map_1.ResourceMap();
            this._onWillAddNotebookDocument = this._register(new event_1.Emitter());
            this._onDidAddNotebookDocument = this._register(new event_1.Emitter());
            this._onWillRemoveNotebookDocument = this._register(new event_1.Emitter());
            this._onDidRemoveNotebookDocument = this._register(new event_1.Emitter());
            this.onWillAddNotebookDocument = this._onWillAddNotebookDocument.event;
            this.onDidAddNotebookDocument = this._onDidAddNotebookDocument.event;
            this.onDidRemoveNotebookDocument = this._onDidRemoveNotebookDocument.event;
            this.onWillRemoveNotebookDocument = this._onWillRemoveNotebookDocument.event;
            this._onAddViewType = this._register(new event_1.Emitter());
            this.onAddViewType = this._onAddViewType.event;
            this._onWillRemoveViewType = this._register(new event_1.Emitter());
            this.onWillRemoveViewType = this._onWillRemoveViewType.event;
            this._onDidChangeEditorTypes = this._register(new event_1.Emitter());
            this.onDidChangeEditorTypes = this._onDidChangeEditorTypes.event;
            this._lastClipboardIsCopy = true;
            extensionPoint_1.notebookRendererExtensionPoint.setHandler((renderers) => {
                this._notebookRenderersInfoStore.clear();
                for (const extension of renderers) {
                    for (const notebookContribution of extension.value) {
                        if (!notebookContribution.entrypoint) { // avoid crashing
                            extension.collector.error(`Notebook renderer does not specify entry point`);
                            continue;
                        }
                        const id = notebookContribution.id;
                        if (!id) {
                            extension.collector.error(`Notebook renderer does not specify id-property`);
                            continue;
                        }
                        this._notebookRenderersInfoStore.add(new notebookOutputRenderer_1.NotebookOutputRendererInfo({
                            id,
                            extension: extension.description,
                            entrypoint: notebookContribution.entrypoint,
                            displayName: notebookContribution.displayName,
                            mimeTypes: notebookContribution.mimeTypes || [],
                            dependencies: notebookContribution.dependencies,
                            optionalDependencies: notebookContribution.optionalDependencies,
                            requiresMessaging: notebookContribution.requiresMessaging,
                        }));
                    }
                }
            });
            const updateOrder = () => {
                this._displayOrder = new notebookCommon_1.MimeTypeDisplayOrder(this._configurationService.getValue(notebookCommon_1.NotebookSetting.displayOrder) || [], this._accessibilityService.isScreenReaderOptimized()
                    ? notebookCommon_1.ACCESSIBLE_NOTEBOOK_DISPLAY_ORDER
                    : notebookCommon_1.NOTEBOOK_DISPLAY_ORDER);
            };
            updateOrder();
            this._register(this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectedKeys.indexOf(notebookCommon_1.NotebookSetting.displayOrder) >= 0) {
                    updateOrder();
                }
            }));
            this._register(this._accessibilityService.onDidChangeScreenReaderOptimized(() => {
                updateOrder();
            }));
            let decorationTriggeredAdjustment = false;
            const decorationCheckSet = new Set();
            this._register(this._codeEditorService.onDecorationTypeRegistered(e => {
                if (decorationTriggeredAdjustment) {
                    return;
                }
                if (decorationCheckSet.has(e)) {
                    return;
                }
                const options = this._codeEditorService.resolveDecorationOptions(e, true);
                if (options.afterContentClassName || options.beforeContentClassName) {
                    const cssRules = this._codeEditorService.resolveDecorationCSSRules(e);
                    if (cssRules !== null) {
                        for (let i = 0; i < cssRules.length; i++) {
                            // The following ways to index into the list are equivalent
                            if ((cssRules[i].selectorText.endsWith('::after') || cssRules[i].selectorText.endsWith('::after'))
                                && cssRules[i].cssText.indexOf('top:') > -1) {
                                // there is a `::before` or `::after` text decoration whose position is above or below current line
                                // we at least make sure that the editor top padding is at least one line
                                const editorOptions = this.configurationService.getValue('editor');
                                (0, notebookOptions_1.updateEditorTopPadding)(fontInfo_1.BareFontInfo.createFromRawSettings(editorOptions, browser_1.PixelRatio.value).lineHeight + 2);
                                decorationTriggeredAdjustment = true;
                                break;
                            }
                        }
                    }
                }
                decorationCheckSet.add(e);
            }));
        }
        get notebookProviderInfoStore() {
            if (!this._notebookProviderInfoStore) {
                this._notebookProviderInfoStore = this._register(this._instantiationService.createInstance(NotebookProviderInfoStore));
            }
            return this._notebookProviderInfoStore;
        }
        getEditorTypes() {
            return [...this.notebookProviderInfoStore].map(info => ({
                id: info.id,
                displayName: info.displayName,
                providerDisplayName: info.providerDisplayName
            }));
        }
        clearEditorCache() {
            this.notebookProviderInfoStore.clearEditorCache();
        }
        _postDocumentOpenActivation(viewType) {
            // send out activations on notebook text model creation
            this._extensionService.activateByEvent(`onNotebook:${viewType}`);
            this._extensionService.activateByEvent(`onNotebook:*`);
        }
        async canResolve(viewType) {
            var _a;
            if (this._notebookProviders.has(viewType)) {
                return true;
            }
            await this._extensionService.whenInstalledExtensionsRegistered();
            const info = (_a = this._notebookProviderInfoStore) === null || _a === void 0 ? void 0 : _a.get(viewType);
            const waitFor = [event_1.Event.toPromise(event_1.Event.filter(this.onAddViewType, () => {
                    return this._notebookProviders.has(viewType);
                }))];
            if (info && info.extension) {
                const extensionManifest = await this._extensionService.getExtension(info.extension.value);
                if ((extensionManifest === null || extensionManifest === void 0 ? void 0 : extensionManifest.activationEvents) && extensionManifest.activationEvents.indexOf(`onNotebook:${viewType}`) >= 0) {
                    waitFor.push(this._extensionService._activateById(info.extension, { startup: false, activationEvent: `onNotebook:${viewType}}`, extensionId: info.extension }));
                }
            }
            await Promise.race(waitFor);
            return this._notebookProviders.has(viewType);
        }
        registerContributedNotebookType(viewType, data) {
            const info = new notebookProvider_1.NotebookProviderInfo({
                extension: data.extension,
                id: viewType,
                displayName: data.displayName,
                providerDisplayName: data.providerDisplayName,
                exclusive: data.exclusive,
                priority: editorResolverService_1.RegisteredEditorPriority.default,
                selectors: [],
            });
            info.update({ selectors: data.filenamePattern });
            const reg = this.notebookProviderInfoStore.add(info);
            this._onDidChangeEditorTypes.fire();
            return (0, lifecycle_1.toDisposable)(() => {
                reg.dispose();
                this._onDidChangeEditorTypes.fire();
            });
        }
        _registerProviderData(viewType, data) {
            if (this._notebookProviders.has(viewType)) {
                throw new Error(`notebook provider for viewtype '${viewType}' already exists`);
            }
            this._notebookProviders.set(viewType, data);
            this._onAddViewType.fire(viewType);
            return (0, lifecycle_1.toDisposable)(() => {
                this._onWillRemoveViewType.fire(viewType);
                this._notebookProviders.delete(viewType);
            });
        }
        registerNotebookController(viewType, extensionData, controller) {
            var _a;
            (_a = this.notebookProviderInfoStore.get(viewType)) === null || _a === void 0 ? void 0 : _a.update({ options: controller.options });
            return this._registerProviderData(viewType, new notebookService_1.ComplexNotebookProviderInfo(viewType, controller, extensionData));
        }
        registerNotebookSerializer(viewType, extensionData, serializer) {
            var _a;
            (_a = this.notebookProviderInfoStore.get(viewType)) === null || _a === void 0 ? void 0 : _a.update({ options: serializer.options });
            return this._registerProviderData(viewType, new notebookService_1.SimpleNotebookProviderInfo(viewType, serializer, extensionData));
        }
        async withNotebookDataProvider(viewType) {
            const selected = this.notebookProviderInfoStore.get(viewType);
            if (!selected) {
                throw new Error(`UNKNOWN notebook type '${viewType}'`);
            }
            await this.canResolve(selected.id);
            const result = this._notebookProviders.get(selected.id);
            if (!result) {
                throw new Error(`NO provider registered for view type: '${selected.id}'`);
            }
            return result;
        }
        getRendererInfo(rendererId) {
            return this._notebookRenderersInfoStore.get(rendererId);
        }
        updateMimePreferredRenderer(viewType, mimeType, rendererId, otherMimetypes) {
            const info = this.notebookProviderInfoStore.get(viewType);
            if (info) {
                this._notebookRenderersInfoStore.setPreferred(info, mimeType, rendererId);
            }
            this._displayOrder.prioritize(mimeType, otherMimetypes);
        }
        saveMimeDisplayOrder(target) {
            this._configurationService.updateValue(notebookCommon_1.NotebookSetting.displayOrder, this._displayOrder.toArray(), target);
        }
        getRenderers() {
            return this._notebookRenderersInfoStore.getAll();
        }
        // --- notebook documents: create, destory, retrieve, enumerate
        createNotebookTextModel(viewType, uri, data, transientOptions) {
            if (this._models.has(uri)) {
                throw new Error(`notebook for ${uri} already exists`);
            }
            const notebookModel = this._instantiationService.createInstance(notebookTextModel_1.NotebookTextModel, viewType, uri, data.cells, data.metadata, transientOptions);
            this._models.set(uri, new ModelData(notebookModel, this._onWillDisposeDocument.bind(this)));
            this._onWillAddNotebookDocument.fire(notebookModel);
            this._onDidAddNotebookDocument.fire(notebookModel);
            this._postDocumentOpenActivation(viewType);
            return notebookModel;
        }
        getNotebookTextModel(uri) {
            var _a;
            return (_a = this._models.get(uri)) === null || _a === void 0 ? void 0 : _a.model;
        }
        getNotebookTextModels() {
            return iterator_1.Iterable.map(this._models.values(), data => data.model);
        }
        listNotebookDocuments() {
            return [...this._models].map(e => e[1].model);
        }
        _onWillDisposeDocument(model) {
            const modelData = this._models.get(model.uri);
            if (modelData) {
                this._onWillRemoveNotebookDocument.fire(modelData.model);
                this._models.delete(model.uri);
                modelData.dispose();
                this._onDidRemoveNotebookDocument.fire(modelData.model);
            }
        }
        getOutputMimeTypeInfo(textModel, kernelProvides, output) {
            const sorted = this._displayOrder.sort(new Set(output.outputs.map(op => op.mime)));
            const notebookProviderInfo = this.notebookProviderInfoStore.get(textModel.viewType);
            return sorted
                .flatMap(mimeType => this._notebookRenderersInfoStore.findBestRenderers(notebookProviderInfo, mimeType, kernelProvides))
                .sort((a, b) => (a.rendererId === notebookCommon_1.RENDERER_NOT_AVAILABLE ? 1 : 0) - (b.rendererId === notebookCommon_1.RENDERER_NOT_AVAILABLE ? 1 : 0));
        }
        getContributedNotebookTypes(resource) {
            if (resource) {
                return this.notebookProviderInfoStore.getContributedNotebook(resource);
            }
            return [...this.notebookProviderInfoStore];
        }
        getContributedNotebookType(viewType) {
            return this.notebookProviderInfoStore.get(viewType);
        }
        getNotebookProviderResourceRoots() {
            const ret = [];
            this._notebookProviders.forEach(val => {
                if (val.extensionData.location) {
                    ret.push(uri_1.URI.revive(val.extensionData.location));
                }
            });
            return ret;
        }
        // --- copy & paste
        setToCopy(items, isCopy) {
            this._cutItems = items;
            this._lastClipboardIsCopy = isCopy;
        }
        getToCopy() {
            if (this._cutItems) {
                return { items: this._cutItems, isCopy: this._lastClipboardIsCopy };
            }
            return undefined;
        }
    };
    NotebookService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, accessibility_1.IAccessibilityService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, codeEditorService_1.ICodeEditorService),
        __param(5, configuration_1.IConfigurationService)
    ], NotebookService);
    exports.NotebookService = NotebookService;
});
//# sourceMappingURL=notebookServiceImpl.js.map