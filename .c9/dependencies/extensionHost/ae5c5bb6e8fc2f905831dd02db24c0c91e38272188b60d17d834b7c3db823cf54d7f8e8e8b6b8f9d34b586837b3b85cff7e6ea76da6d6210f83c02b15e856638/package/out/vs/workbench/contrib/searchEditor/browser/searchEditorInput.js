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
define(["require", "exports", "vs/base/common/event", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/common/services/model", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/workbench/common/editor", "vs/workbench/common/memento", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/searchEditor/browser/searchEditorModel", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/path/common/pathService", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/configuration/common/configuration", "vs/base/common/buffer", "vs/workbench/common/editor/editorInput", "vs/css!./media/searchEditor"], function (require, exports, event_1, path_1, resources_1, uri_1, model_1, nls_1, dialogs_1, instantiation_1, storage_1, telemetry_1, editor_1, memento_1, constants_1, searchEditorModel_1, searchEditorSerialization_1, pathService_1, textfiles_1, workingCopyService_1, configuration_1, buffer_1, editorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getOrMakeSearchEditorInput = exports.SearchEditorInput = exports.SEARCH_EDITOR_EXT = void 0;
    exports.SEARCH_EDITOR_EXT = '.code-search';
    let SearchEditorInput = class SearchEditorInput extends editorInput_1.EditorInput {
        constructor(modelUri, backingUri, modelService, textFileService, fileDialogService, instantiationService, workingCopyService, telemetryService, pathService, storageService) {
            super();
            this.modelUri = modelUri;
            this.backingUri = backingUri;
            this.modelService = modelService;
            this.textFileService = textFileService;
            this.fileDialogService = fileDialogService;
            this.instantiationService = instantiationService;
            this.workingCopyService = workingCopyService;
            this.telemetryService = telemetryService;
            this.pathService = pathService;
            this.dirty = false;
            this._onDidChangeContent = this._register(new event_1.Emitter());
            this.onDidChangeContent = this._onDidChangeContent.event;
            this._onDidSave = this._register(new event_1.Emitter());
            this.onDidSave = this._onDidSave.event;
            this.oldDecorationsIDs = [];
            this.model = instantiationService.createInstance(searchEditorModel_1.SearchEditorModel, modelUri);
            if (this.modelUri.scheme !== constants_1.SearchEditorScheme) {
                throw Error('SearchEditorInput must be invoked with a SearchEditorScheme uri');
            }
            this.memento = new memento_1.Memento(SearchEditorInput.ID, storageService);
            storageService.onWillSaveState(() => this.memento.saveMemento());
            const input = this;
            const workingCopyAdapter = new class {
                constructor() {
                    this.typeId = constants_1.SearchEditorWorkingCopyTypeId;
                    this.resource = input.modelUri;
                    this.capabilities = input.hasCapability(4 /* EditorInputCapabilities.Untitled */) ? 2 /* WorkingCopyCapabilities.Untitled */ : 0 /* WorkingCopyCapabilities.None */;
                    this.onDidChangeDirty = input.onDidChangeDirty;
                    this.onDidChangeContent = input.onDidChangeContent;
                    this.onDidSave = input.onDidSave;
                }
                get name() { return input.getName(); }
                isDirty() { return input.isDirty(); }
                backup(token) { return input.backup(token); }
                save(options) { return input.save(0, options).then(editor => !!editor); }
                revert(options) { return input.revert(0, options); }
            };
            this._register(this.workingCopyService.registerWorkingCopy(workingCopyAdapter));
        }
        get typeId() {
            return SearchEditorInput.ID;
        }
        get editorId() {
            return this.typeId;
        }
        get capabilities() {
            let capabilities = 8 /* EditorInputCapabilities.Singleton */;
            if (!this.backingUri) {
                capabilities |= 4 /* EditorInputCapabilities.Untitled */;
            }
            return capabilities;
        }
        get resource() {
            return this.backingUri || this.modelUri;
        }
        async save(group, options) {
            if (((await this.resolveModels()).resultsModel).isDisposed()) {
                return;
            }
            if (this.backingUri) {
                await this.textFileService.write(this.backingUri, await this.serializeForDisk(), options);
                this.setDirty(false);
                this._onDidSave.fire({ reason: options === null || options === void 0 ? void 0 : options.reason, source: options === null || options === void 0 ? void 0 : options.source });
                return this;
            }
            else {
                return this.saveAs(group, options);
            }
        }
        tryReadConfigSync() {
            var _a;
            return (_a = this._cachedConfigurationModel) === null || _a === void 0 ? void 0 : _a.config;
        }
        async serializeForDisk() {
            const { configurationModel, resultsModel } = await this.resolveModels();
            return (0, searchEditorSerialization_1.serializeSearchConfiguration)(configurationModel.config) + '\n' + resultsModel.getValue();
        }
        registerConfigChangeListeners(model) {
            var _a;
            (_a = this.configChangeListenerDisposable) === null || _a === void 0 ? void 0 : _a.dispose();
            if (!this.isDisposed()) {
                this.configChangeListenerDisposable = model.onConfigDidUpdate(() => {
                    const oldName = this.getName();
                    if (oldName !== this.getName()) {
                        this._onDidChangeLabel.fire();
                    }
                    this.memento.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */).searchConfig = model.config;
                });
                this._register(this.configChangeListenerDisposable);
            }
        }
        async resolveModels() {
            return this.model.resolve().then(data => {
                const oldName = this.getName();
                this._cachedResultsModel = data.resultsModel;
                this._cachedConfigurationModel = data.configurationModel;
                if (oldName !== this.getName()) {
                    this._onDidChangeLabel.fire();
                }
                this.registerConfigChangeListeners(data.configurationModel);
                return data;
            });
        }
        async saveAs(group, options) {
            const path = await this.fileDialogService.pickFileToSave(await this.suggestFileName(), options === null || options === void 0 ? void 0 : options.availableFileSystems);
            if (path) {
                this.telemetryService.publicLog2('searchEditor/saveSearchResults');
                const toWrite = await this.serializeForDisk();
                if (await this.textFileService.create([{ resource: path, value: toWrite, options: { overwrite: true } }])) {
                    this.setDirty(false);
                    if (!(0, resources_1.isEqual)(path, this.modelUri)) {
                        const input = this.instantiationService.invokeFunction(exports.getOrMakeSearchEditorInput, { fileUri: path, from: 'existingFile' });
                        input.setMatchRanges(this.getMatchRanges());
                        return input;
                    }
                    return this;
                }
            }
            return undefined;
        }
        getName(maxLength = 12) {
            var _a, _b, _c;
            const trimToMax = (label) => (label.length < maxLength ? label : `${label.slice(0, maxLength - 3)}...`);
            if (this.backingUri) {
                const originalURI = editor_1.EditorResourceAccessor.getOriginalUri(this);
                return (0, nls_1.localize)('searchTitle.withQuery', "Search: {0}", (0, path_1.basename)((originalURI !== null && originalURI !== void 0 ? originalURI : this.backingUri).path, exports.SEARCH_EDITOR_EXT));
            }
            const query = (_c = (_b = (_a = this._cachedConfigurationModel) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.query) === null || _c === void 0 ? void 0 : _c.trim();
            if (query) {
                return (0, nls_1.localize)('searchTitle.withQuery', "Search: {0}", trimToMax(query));
            }
            return (0, nls_1.localize)('searchTitle', "Search");
        }
        setDirty(dirty) {
            const wasDirty = this.dirty;
            this.dirty = dirty;
            if (wasDirty !== dirty) {
                this._onDidChangeDirty.fire();
            }
        }
        isDirty() {
            return this.dirty;
        }
        async rename(group, target) {
            if ((0, resources_1.extname)(target) === exports.SEARCH_EDITOR_EXT) {
                return {
                    editor: this.instantiationService.invokeFunction(exports.getOrMakeSearchEditorInput, { from: 'existingFile', fileUri: target })
                };
            }
            // Ignore move if editor was renamed to a different file extension
            return undefined;
        }
        dispose() {
            this.modelService.destroyModel(this.modelUri);
            super.dispose();
        }
        matches(other) {
            if (super.matches(other)) {
                return true;
            }
            if (other instanceof SearchEditorInput) {
                return !!(other.modelUri.fragment && other.modelUri.fragment === this.modelUri.fragment) || !!(other.backingUri && (0, resources_1.isEqual)(other.backingUri, this.backingUri));
            }
            return false;
        }
        getMatchRanges() {
            var _a, _b;
            return ((_b = (_a = this._cachedResultsModel) === null || _a === void 0 ? void 0 : _a.getAllDecorations()) !== null && _b !== void 0 ? _b : [])
                .filter(decoration => decoration.options.className === constants_1.SearchEditorFindMatchClass)
                .filter(({ range }) => !(range.startColumn === 1 && range.endColumn === 1))
                .map(({ range }) => range);
        }
        async setMatchRanges(ranges) {
            this.oldDecorationsIDs = (await this.resolveModels()).resultsModel.deltaDecorations(this.oldDecorationsIDs, ranges.map(range => ({ range, options: { description: 'search-editor-find-match', className: constants_1.SearchEditorFindMatchClass, stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */ } })));
        }
        async revert(group, options) {
            if (options === null || options === void 0 ? void 0 : options.soft) {
                this.setDirty(false);
                return;
            }
            if (this.backingUri) {
                const { config, text } = await this.instantiationService.invokeFunction(searchEditorSerialization_1.parseSavedSearchEditor, this.backingUri);
                const { resultsModel, configurationModel } = await this.resolveModels();
                resultsModel.setValue(text);
                configurationModel.updateConfig(config);
            }
            else {
                (await this.resolveModels()).resultsModel.setValue('');
            }
            super.revert(group, options);
            this.setDirty(false);
        }
        async backup(token) {
            const contents = await this.serializeForDisk();
            if (token.isCancellationRequested) {
                return {};
            }
            return {
                content: (0, buffer_1.bufferToReadable)(buffer_1.VSBuffer.fromString(contents))
            };
        }
        async suggestFileName() {
            const query = (await this.resolveModels()).configurationModel.config.query;
            const searchFileName = (query.replace(/[^\w \-_]+/g, '_') || 'Search') + exports.SEARCH_EDITOR_EXT;
            return (0, resources_1.joinPath)(await this.fileDialogService.defaultFilePath(this.pathService.defaultUriScheme), searchFileName);
        }
        toUntyped() {
            if (this.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                return undefined;
            }
            return {
                resource: this.resource,
                options: {
                    override: SearchEditorInput.ID
                }
            };
        }
    };
    SearchEditorInput.ID = constants_1.SearchEditorInputTypeId;
    SearchEditorInput = __decorate([
        __param(2, model_1.IModelService),
        __param(3, textfiles_1.ITextFileService),
        __param(4, dialogs_1.IFileDialogService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, workingCopyService_1.IWorkingCopyService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, pathService_1.IPathService),
        __param(9, storage_1.IStorageService)
    ], SearchEditorInput);
    exports.SearchEditorInput = SearchEditorInput;
    const getOrMakeSearchEditorInput = (accessor, existingData) => {
        var _a, _b;
        const storageService = accessor.get(storage_1.IStorageService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const modelUri = existingData.from === 'model' ? existingData.modelUri : uri_1.URI.from({ scheme: constants_1.SearchEditorScheme, fragment: `${Math.random()}` });
        if (!searchEditorModel_1.searchEditorModelFactory.models.has(modelUri)) {
            if (existingData.from === 'existingFile') {
                instantiationService.invokeFunction(accessor => searchEditorModel_1.searchEditorModelFactory.initializeModelFromExistingFile(accessor, modelUri, existingData.fileUri));
            }
            else {
                const searchEditorSettings = configurationService.getValue('search').searchEditor;
                const reuseOldSettings = searchEditorSettings.reusePriorSearchConfiguration;
                const defaultNumberOfContextLines = searchEditorSettings.defaultNumberOfContextLines;
                const priorConfig = reuseOldSettings ? new memento_1.Memento(SearchEditorInput.ID, storageService).getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */).searchConfig : {};
                const defaultConfig = (0, searchEditorSerialization_1.defaultSearchConfig)();
                const config = Object.assign(Object.assign(Object.assign({}, defaultConfig), priorConfig), existingData.config);
                if (defaultNumberOfContextLines !== null && defaultNumberOfContextLines !== undefined) {
                    config.contextLines = (_b = (_a = existingData === null || existingData === void 0 ? void 0 : existingData.config) === null || _a === void 0 ? void 0 : _a.contextLines) !== null && _b !== void 0 ? _b : defaultNumberOfContextLines;
                }
                if (existingData.from === 'rawData') {
                    if (existingData.resultsContents) {
                        config.contextLines = 0;
                    }
                    instantiationService.invokeFunction(accessor => searchEditorModel_1.searchEditorModelFactory.initializeModelFromRawData(accessor, modelUri, config, existingData.resultsContents));
                }
                else {
                    instantiationService.invokeFunction(accessor => searchEditorModel_1.searchEditorModelFactory.initializeModelFromExistingModel(accessor, modelUri, config));
                }
            }
        }
        return instantiationService.createInstance(SearchEditorInput, modelUri, existingData.from === 'existingFile'
            ? existingData.fileUri
            : existingData.from === 'model'
                ? existingData.backupOf
                : undefined);
    };
    exports.getOrMakeSearchEditorInput = getOrMakeSearchEditorInput;
});
//# sourceMappingURL=searchEditorInput.js.map