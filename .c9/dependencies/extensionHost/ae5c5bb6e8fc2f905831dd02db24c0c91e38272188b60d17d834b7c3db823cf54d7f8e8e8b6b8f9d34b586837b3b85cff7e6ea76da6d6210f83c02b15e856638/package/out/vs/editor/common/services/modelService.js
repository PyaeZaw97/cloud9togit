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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/errors", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/core/textModelDefaults", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/editor/common/services/textResourceConfiguration", "vs/platform/configuration/common/configuration", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/theme/common/themeService", "vs/platform/log/common/log", "vs/platform/undoRedo/common/undoRedo", "vs/base/common/hash", "vs/editor/common/model/editStack", "vs/base/common/network", "vs/editor/common/services/semanticTokensProviderStyling", "vs/editor/common/services/getSemanticTokens", "vs/base/common/objects", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatureDebounce", "vs/base/common/stopwatch", "vs/editor/common/services/languageFeatures"], function (require, exports, event_1, lifecycle_1, platform, errors, editOperation_1, range_1, textModel_1, textModelDefaults_1, modesRegistry_1, language_1, model_1, textResourceConfiguration_1, configuration_1, async_1, cancellation_1, themeService_1, log_1, undoRedo_1, hash_1, editStack_1, network_1, semanticTokensProviderStyling_1, getSemanticTokens_1, objects_1, languageConfigurationRegistry_1, languageFeatureDebounce_1, stopwatch_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModelSemanticColoring = exports.isSemanticColoringEnabled = exports.SEMANTIC_HIGHLIGHTING_SETTING_ID = exports.ModelService = void 0;
    function MODEL_ID(resource) {
        return resource.toString();
    }
    function computeModelSha1(model) {
        // compute the sha1
        const shaComputer = new hash_1.StringSHA1();
        const snapshot = model.createSnapshot();
        let text;
        while ((text = snapshot.read())) {
            shaComputer.update(text);
        }
        return shaComputer.digest();
    }
    class ModelData {
        constructor(model, onWillDispose, onDidChangeLanguage) {
            this._modelEventListeners = new lifecycle_1.DisposableStore();
            this.model = model;
            this._languageSelection = null;
            this._languageSelectionListener = null;
            this._modelEventListeners.add(model.onWillDispose(() => onWillDispose(model)));
            this._modelEventListeners.add(model.onDidChangeLanguage((e) => onDidChangeLanguage(model, e)));
        }
        _disposeLanguageSelection() {
            if (this._languageSelectionListener) {
                this._languageSelectionListener.dispose();
                this._languageSelectionListener = null;
            }
        }
        dispose() {
            this._modelEventListeners.dispose();
            this._disposeLanguageSelection();
        }
        setLanguage(languageSelection) {
            this._disposeLanguageSelection();
            this._languageSelection = languageSelection;
            this._languageSelectionListener = this._languageSelection.onDidChange(() => this.model.setMode(languageSelection.languageId));
            this.model.setMode(languageSelection.languageId);
        }
    }
    const DEFAULT_EOL = (platform.isLinux || platform.isMacintosh) ? 1 /* DefaultEndOfLine.LF */ : 2 /* DefaultEndOfLine.CRLF */;
    class DisposedModelInfo {
        constructor(uri, initialUndoRedoSnapshot, time, sharesUndoRedoStack, heapSize, sha1, versionId, alternativeVersionId) {
            this.uri = uri;
            this.initialUndoRedoSnapshot = initialUndoRedoSnapshot;
            this.time = time;
            this.sharesUndoRedoStack = sharesUndoRedoStack;
            this.heapSize = heapSize;
            this.sha1 = sha1;
            this.versionId = versionId;
            this.alternativeVersionId = alternativeVersionId;
        }
    }
    let ModelService = class ModelService extends lifecycle_1.Disposable {
        constructor(_configurationService, _resourcePropertiesService, _themeService, _logService, _undoRedoService, _languageService, _languageConfigurationService, _languageFeatureDebounceService, languageFeaturesService) {
            super();
            this._configurationService = _configurationService;
            this._resourcePropertiesService = _resourcePropertiesService;
            this._themeService = _themeService;
            this._logService = _logService;
            this._undoRedoService = _undoRedoService;
            this._languageService = _languageService;
            this._languageConfigurationService = _languageConfigurationService;
            this._languageFeatureDebounceService = _languageFeatureDebounceService;
            this._onModelAdded = this._register(new event_1.Emitter());
            this.onModelAdded = this._onModelAdded.event;
            this._onModelRemoved = this._register(new event_1.Emitter());
            this.onModelRemoved = this._onModelRemoved.event;
            this._onModelModeChanged = this._register(new event_1.Emitter());
            this.onModelLanguageChanged = this._onModelModeChanged.event;
            this._modelCreationOptionsByLanguageAndResource = Object.create(null);
            this._models = {};
            this._disposedModels = new Map();
            this._disposedModelsHeapSize = 0;
            this._semanticStyling = this._register(new SemanticStyling(this._themeService, this._languageService, this._logService));
            this._register(this._configurationService.onDidChangeConfiguration(() => this._updateModelOptions()));
            this._updateModelOptions();
            this._register(new SemanticColoringFeature(this._semanticStyling, this, this._themeService, this._configurationService, this._languageFeatureDebounceService, languageFeaturesService));
        }
        static _readModelOptions(config, isForSimpleWidget) {
            var _a;
            let tabSize = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.tabSize;
            if (config.editor && typeof config.editor.tabSize !== 'undefined') {
                const parsedTabSize = parseInt(config.editor.tabSize, 10);
                if (!isNaN(parsedTabSize)) {
                    tabSize = parsedTabSize;
                }
                if (tabSize < 1) {
                    tabSize = 1;
                }
            }
            let indentSize = tabSize;
            if (config.editor && typeof config.editor.indentSize !== 'undefined' && config.editor.indentSize !== 'tabSize') {
                const parsedIndentSize = parseInt(config.editor.indentSize, 10);
                if (!isNaN(parsedIndentSize)) {
                    indentSize = parsedIndentSize;
                }
                if (indentSize < 1) {
                    indentSize = 1;
                }
            }
            let insertSpaces = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.insertSpaces;
            if (config.editor && typeof config.editor.insertSpaces !== 'undefined') {
                insertSpaces = (config.editor.insertSpaces === 'false' ? false : Boolean(config.editor.insertSpaces));
            }
            let newDefaultEOL = DEFAULT_EOL;
            const eol = config.eol;
            if (eol === '\r\n') {
                newDefaultEOL = 2 /* DefaultEndOfLine.CRLF */;
            }
            else if (eol === '\n') {
                newDefaultEOL = 1 /* DefaultEndOfLine.LF */;
            }
            let trimAutoWhitespace = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.trimAutoWhitespace;
            if (config.editor && typeof config.editor.trimAutoWhitespace !== 'undefined') {
                trimAutoWhitespace = (config.editor.trimAutoWhitespace === 'false' ? false : Boolean(config.editor.trimAutoWhitespace));
            }
            let detectIndentation = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.detectIndentation;
            if (config.editor && typeof config.editor.detectIndentation !== 'undefined') {
                detectIndentation = (config.editor.detectIndentation === 'false' ? false : Boolean(config.editor.detectIndentation));
            }
            let largeFileOptimizations = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.largeFileOptimizations;
            if (config.editor && typeof config.editor.largeFileOptimizations !== 'undefined') {
                largeFileOptimizations = (config.editor.largeFileOptimizations === 'false' ? false : Boolean(config.editor.largeFileOptimizations));
            }
            let bracketPairColorizationOptions = textModelDefaults_1.EDITOR_MODEL_DEFAULTS.bracketPairColorizationOptions;
            if (((_a = config.editor) === null || _a === void 0 ? void 0 : _a.bracketPairColorization) && typeof config.editor.bracketPairColorization === 'object') {
                bracketPairColorizationOptions = {
                    enabled: !!config.editor.bracketPairColorization.enabled,
                    independentColorPoolPerBracketType: !!config.editor.bracketPairColorization.independentColorPoolPerBracketType
                };
            }
            return {
                isForSimpleWidget: isForSimpleWidget,
                tabSize: tabSize,
                indentSize: indentSize,
                insertSpaces: insertSpaces,
                detectIndentation: detectIndentation,
                defaultEOL: newDefaultEOL,
                trimAutoWhitespace: trimAutoWhitespace,
                largeFileOptimizations: largeFileOptimizations,
                bracketPairColorizationOptions
            };
        }
        _getEOL(resource, language) {
            if (resource) {
                return this._resourcePropertiesService.getEOL(resource, language);
            }
            const eol = this._configurationService.getValue('files.eol', { overrideIdentifier: language });
            if (eol && typeof eol === 'string' && eol !== 'auto') {
                return eol;
            }
            return platform.OS === 3 /* platform.OperatingSystem.Linux */ || platform.OS === 2 /* platform.OperatingSystem.Macintosh */ ? '\n' : '\r\n';
        }
        _shouldRestoreUndoStack() {
            const result = this._configurationService.getValue('files.restoreUndoStack');
            if (typeof result === 'boolean') {
                return result;
            }
            return true;
        }
        getCreationOptions(language, resource, isForSimpleWidget) {
            let creationOptions = this._modelCreationOptionsByLanguageAndResource[language + resource];
            if (!creationOptions) {
                const editor = this._configurationService.getValue('editor', { overrideIdentifier: language, resource });
                const eol = this._getEOL(resource, language);
                creationOptions = ModelService._readModelOptions({ editor, eol }, isForSimpleWidget);
                this._modelCreationOptionsByLanguageAndResource[language + resource] = creationOptions;
            }
            return creationOptions;
        }
        _updateModelOptions() {
            const oldOptionsByLanguageAndResource = this._modelCreationOptionsByLanguageAndResource;
            this._modelCreationOptionsByLanguageAndResource = Object.create(null);
            // Update options on all models
            const keys = Object.keys(this._models);
            for (let i = 0, len = keys.length; i < len; i++) {
                const modelId = keys[i];
                const modelData = this._models[modelId];
                const language = modelData.model.getLanguageId();
                const uri = modelData.model.uri;
                const oldOptions = oldOptionsByLanguageAndResource[language + uri];
                const newOptions = this.getCreationOptions(language, uri, modelData.model.isForSimpleWidget);
                ModelService._setModelOptionsForModel(modelData.model, newOptions, oldOptions);
            }
        }
        static _setModelOptionsForModel(model, newOptions, currentOptions) {
            if (currentOptions && currentOptions.defaultEOL !== newOptions.defaultEOL && model.getLineCount() === 1) {
                model.setEOL(newOptions.defaultEOL === 1 /* DefaultEndOfLine.LF */ ? 0 /* EndOfLineSequence.LF */ : 1 /* EndOfLineSequence.CRLF */);
            }
            if (currentOptions
                && (currentOptions.detectIndentation === newOptions.detectIndentation)
                && (currentOptions.insertSpaces === newOptions.insertSpaces)
                && (currentOptions.tabSize === newOptions.tabSize)
                && (currentOptions.indentSize === newOptions.indentSize)
                && (currentOptions.trimAutoWhitespace === newOptions.trimAutoWhitespace)
                && (0, objects_1.equals)(currentOptions.bracketPairColorizationOptions, newOptions.bracketPairColorizationOptions)) {
                // Same indent opts, no need to touch the model
                return;
            }
            if (newOptions.detectIndentation) {
                model.detectIndentation(newOptions.insertSpaces, newOptions.tabSize);
                model.updateOptions({
                    trimAutoWhitespace: newOptions.trimAutoWhitespace,
                    bracketColorizationOptions: newOptions.bracketPairColorizationOptions
                });
            }
            else {
                model.updateOptions({
                    insertSpaces: newOptions.insertSpaces,
                    tabSize: newOptions.tabSize,
                    indentSize: newOptions.indentSize,
                    trimAutoWhitespace: newOptions.trimAutoWhitespace,
                    bracketColorizationOptions: newOptions.bracketPairColorizationOptions
                });
            }
        }
        // --- begin IModelService
        _insertDisposedModel(disposedModelData) {
            this._disposedModels.set(MODEL_ID(disposedModelData.uri), disposedModelData);
            this._disposedModelsHeapSize += disposedModelData.heapSize;
        }
        _removeDisposedModel(resource) {
            const disposedModelData = this._disposedModels.get(MODEL_ID(resource));
            if (disposedModelData) {
                this._disposedModelsHeapSize -= disposedModelData.heapSize;
            }
            this._disposedModels.delete(MODEL_ID(resource));
            return disposedModelData;
        }
        _ensureDisposedModelsHeapSize(maxModelsHeapSize) {
            if (this._disposedModelsHeapSize > maxModelsHeapSize) {
                // we must remove some old undo stack elements to free up some memory
                const disposedModels = [];
                this._disposedModels.forEach(entry => {
                    if (!entry.sharesUndoRedoStack) {
                        disposedModels.push(entry);
                    }
                });
                disposedModels.sort((a, b) => a.time - b.time);
                while (disposedModels.length > 0 && this._disposedModelsHeapSize > maxModelsHeapSize) {
                    const disposedModel = disposedModels.shift();
                    this._removeDisposedModel(disposedModel.uri);
                    if (disposedModel.initialUndoRedoSnapshot !== null) {
                        this._undoRedoService.restoreSnapshot(disposedModel.initialUndoRedoSnapshot);
                    }
                }
            }
        }
        _createModelData(value, languageId, resource, isForSimpleWidget) {
            // create & save the model
            const options = this.getCreationOptions(languageId, resource, isForSimpleWidget);
            const model = new textModel_1.TextModel(value, languageId, options, resource, this._undoRedoService, this._languageService, this._languageConfigurationService);
            if (resource && this._disposedModels.has(MODEL_ID(resource))) {
                const disposedModelData = this._removeDisposedModel(resource);
                const elements = this._undoRedoService.getElements(resource);
                const sha1IsEqual = (computeModelSha1(model) === disposedModelData.sha1);
                if (sha1IsEqual || disposedModelData.sharesUndoRedoStack) {
                    for (const element of elements.past) {
                        if ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(resource)) {
                            element.setModel(model);
                        }
                    }
                    for (const element of elements.future) {
                        if ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(resource)) {
                            element.setModel(model);
                        }
                    }
                    this._undoRedoService.setElementsValidFlag(resource, true, (element) => ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(resource)));
                    if (sha1IsEqual) {
                        model._overwriteVersionId(disposedModelData.versionId);
                        model._overwriteAlternativeVersionId(disposedModelData.alternativeVersionId);
                        model._overwriteInitialUndoRedoSnapshot(disposedModelData.initialUndoRedoSnapshot);
                    }
                }
                else {
                    if (disposedModelData.initialUndoRedoSnapshot !== null) {
                        this._undoRedoService.restoreSnapshot(disposedModelData.initialUndoRedoSnapshot);
                    }
                }
            }
            const modelId = MODEL_ID(model.uri);
            if (this._models[modelId]) {
                // There already exists a model with this id => this is a programmer error
                throw new Error('ModelService: Cannot add model because it already exists!');
            }
            const modelData = new ModelData(model, (model) => this._onWillDispose(model), (model, e) => this._onDidChangeLanguage(model, e));
            this._models[modelId] = modelData;
            return modelData;
        }
        updateModel(model, value) {
            const options = this.getCreationOptions(model.getLanguageId(), model.uri, model.isForSimpleWidget);
            const { textBuffer, disposable } = (0, textModel_1.createTextBuffer)(value, options.defaultEOL);
            // Return early if the text is already set in that form
            if (model.equalsTextBuffer(textBuffer)) {
                disposable.dispose();
                return;
            }
            // Otherwise find a diff between the values and update model
            model.pushStackElement();
            model.pushEOL(textBuffer.getEOL() === '\r\n' ? 1 /* EndOfLineSequence.CRLF */ : 0 /* EndOfLineSequence.LF */);
            model.pushEditOperations([], ModelService._computeEdits(model, textBuffer), () => []);
            model.pushStackElement();
            disposable.dispose();
        }
        static _commonPrefix(a, aLen, aDelta, b, bLen, bDelta) {
            const maxResult = Math.min(aLen, bLen);
            let result = 0;
            for (let i = 0; i < maxResult && a.getLineContent(aDelta + i) === b.getLineContent(bDelta + i); i++) {
                result++;
            }
            return result;
        }
        static _commonSuffix(a, aLen, aDelta, b, bLen, bDelta) {
            const maxResult = Math.min(aLen, bLen);
            let result = 0;
            for (let i = 0; i < maxResult && a.getLineContent(aDelta + aLen - i) === b.getLineContent(bDelta + bLen - i); i++) {
                result++;
            }
            return result;
        }
        /**
         * Compute edits to bring `model` to the state of `textSource`.
         */
        static _computeEdits(model, textBuffer) {
            const modelLineCount = model.getLineCount();
            const textBufferLineCount = textBuffer.getLineCount();
            const commonPrefix = this._commonPrefix(model, modelLineCount, 1, textBuffer, textBufferLineCount, 1);
            if (modelLineCount === textBufferLineCount && commonPrefix === modelLineCount) {
                // equality case
                return [];
            }
            const commonSuffix = this._commonSuffix(model, modelLineCount - commonPrefix, commonPrefix, textBuffer, textBufferLineCount - commonPrefix, commonPrefix);
            let oldRange;
            let newRange;
            if (commonSuffix > 0) {
                oldRange = new range_1.Range(commonPrefix + 1, 1, modelLineCount - commonSuffix + 1, 1);
                newRange = new range_1.Range(commonPrefix + 1, 1, textBufferLineCount - commonSuffix + 1, 1);
            }
            else if (commonPrefix > 0) {
                oldRange = new range_1.Range(commonPrefix, model.getLineMaxColumn(commonPrefix), modelLineCount, model.getLineMaxColumn(modelLineCount));
                newRange = new range_1.Range(commonPrefix, 1 + textBuffer.getLineLength(commonPrefix), textBufferLineCount, 1 + textBuffer.getLineLength(textBufferLineCount));
            }
            else {
                oldRange = new range_1.Range(1, 1, modelLineCount, model.getLineMaxColumn(modelLineCount));
                newRange = new range_1.Range(1, 1, textBufferLineCount, 1 + textBuffer.getLineLength(textBufferLineCount));
            }
            return [editOperation_1.EditOperation.replaceMove(oldRange, textBuffer.getValueInRange(newRange, 0 /* EndOfLinePreference.TextDefined */))];
        }
        createModel(value, languageSelection, resource, isForSimpleWidget = false) {
            let modelData;
            if (languageSelection) {
                modelData = this._createModelData(value, languageSelection.languageId, resource, isForSimpleWidget);
                this.setMode(modelData.model, languageSelection);
            }
            else {
                modelData = this._createModelData(value, modesRegistry_1.PLAINTEXT_LANGUAGE_ID, resource, isForSimpleWidget);
            }
            this._onModelAdded.fire(modelData.model);
            return modelData.model;
        }
        setMode(model, languageSelection) {
            if (!languageSelection) {
                return;
            }
            const modelData = this._models[MODEL_ID(model.uri)];
            if (!modelData) {
                return;
            }
            modelData.setLanguage(languageSelection);
        }
        destroyModel(resource) {
            // We need to support that not all models get disposed through this service (i.e. model.dispose() should work!)
            const modelData = this._models[MODEL_ID(resource)];
            if (!modelData) {
                return;
            }
            modelData.model.dispose();
        }
        getModels() {
            const ret = [];
            const keys = Object.keys(this._models);
            for (let i = 0, len = keys.length; i < len; i++) {
                const modelId = keys[i];
                ret.push(this._models[modelId].model);
            }
            return ret;
        }
        getModel(resource) {
            const modelId = MODEL_ID(resource);
            const modelData = this._models[modelId];
            if (!modelData) {
                return null;
            }
            return modelData.model;
        }
        getSemanticTokensProviderStyling(provider) {
            return this._semanticStyling.get(provider);
        }
        // --- end IModelService
        _schemaShouldMaintainUndoRedoElements(resource) {
            return (resource.scheme === network_1.Schemas.file
                || resource.scheme === network_1.Schemas.vscodeRemote
                || resource.scheme === network_1.Schemas.vscodeUserData
                || resource.scheme === network_1.Schemas.vscodeNotebookCell
                || resource.scheme === 'fake-fs' // for tests
            );
        }
        _onWillDispose(model) {
            const modelId = MODEL_ID(model.uri);
            const modelData = this._models[modelId];
            const sharesUndoRedoStack = (this._undoRedoService.getUriComparisonKey(model.uri) !== model.uri.toString());
            let maintainUndoRedoStack = false;
            let heapSize = 0;
            if (sharesUndoRedoStack || (this._shouldRestoreUndoStack() && this._schemaShouldMaintainUndoRedoElements(model.uri))) {
                const elements = this._undoRedoService.getElements(model.uri);
                if (elements.past.length > 0 || elements.future.length > 0) {
                    for (const element of elements.past) {
                        if ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(model.uri)) {
                            maintainUndoRedoStack = true;
                            heapSize += element.heapSize(model.uri);
                            element.setModel(model.uri); // remove reference from text buffer instance
                        }
                    }
                    for (const element of elements.future) {
                        if ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(model.uri)) {
                            maintainUndoRedoStack = true;
                            heapSize += element.heapSize(model.uri);
                            element.setModel(model.uri); // remove reference from text buffer instance
                        }
                    }
                }
            }
            const maxMemory = ModelService.MAX_MEMORY_FOR_CLOSED_FILES_UNDO_STACK;
            if (!maintainUndoRedoStack) {
                if (!sharesUndoRedoStack) {
                    const initialUndoRedoSnapshot = modelData.model.getInitialUndoRedoSnapshot();
                    if (initialUndoRedoSnapshot !== null) {
                        this._undoRedoService.restoreSnapshot(initialUndoRedoSnapshot);
                    }
                }
            }
            else if (!sharesUndoRedoStack && heapSize > maxMemory) {
                // the undo stack for this file would never fit in the configured memory, so don't bother with it.
                const initialUndoRedoSnapshot = modelData.model.getInitialUndoRedoSnapshot();
                if (initialUndoRedoSnapshot !== null) {
                    this._undoRedoService.restoreSnapshot(initialUndoRedoSnapshot);
                }
            }
            else {
                this._ensureDisposedModelsHeapSize(maxMemory - heapSize);
                // We only invalidate the elements, but they remain in the undo-redo service.
                this._undoRedoService.setElementsValidFlag(model.uri, false, (element) => ((0, editStack_1.isEditStackElement)(element) && element.matchesResource(model.uri)));
                this._insertDisposedModel(new DisposedModelInfo(model.uri, modelData.model.getInitialUndoRedoSnapshot(), Date.now(), sharesUndoRedoStack, heapSize, computeModelSha1(model), model.getVersionId(), model.getAlternativeVersionId()));
            }
            delete this._models[modelId];
            modelData.dispose();
            // clean up cache
            delete this._modelCreationOptionsByLanguageAndResource[model.getLanguageId() + model.uri];
            this._onModelRemoved.fire(model);
        }
        _onDidChangeLanguage(model, e) {
            const oldLanguageId = e.oldLanguage;
            const newLanguageId = model.getLanguageId();
            const oldOptions = this.getCreationOptions(oldLanguageId, model.uri, model.isForSimpleWidget);
            const newOptions = this.getCreationOptions(newLanguageId, model.uri, model.isForSimpleWidget);
            ModelService._setModelOptionsForModel(model, newOptions, oldOptions);
            this._onModelModeChanged.fire({ model, oldLanguageId: oldLanguageId });
        }
    };
    ModelService.MAX_MEMORY_FOR_CLOSED_FILES_UNDO_STACK = 20 * 1024 * 1024;
    ModelService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, textResourceConfiguration_1.ITextResourcePropertiesService),
        __param(2, themeService_1.IThemeService),
        __param(3, log_1.ILogService),
        __param(4, undoRedo_1.IUndoRedoService),
        __param(5, language_1.ILanguageService),
        __param(6, languageConfigurationRegistry_1.ILanguageConfigurationService),
        __param(7, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(8, languageFeatures_1.ILanguageFeaturesService)
    ], ModelService);
    exports.ModelService = ModelService;
    exports.SEMANTIC_HIGHLIGHTING_SETTING_ID = 'editor.semanticHighlighting';
    function isSemanticColoringEnabled(model, themeService, configurationService) {
        var _a;
        const setting = (_a = configurationService.getValue(exports.SEMANTIC_HIGHLIGHTING_SETTING_ID, { overrideIdentifier: model.getLanguageId(), resource: model.uri })) === null || _a === void 0 ? void 0 : _a.enabled;
        if (typeof setting === 'boolean') {
            return setting;
        }
        return themeService.getColorTheme().semanticHighlighting;
    }
    exports.isSemanticColoringEnabled = isSemanticColoringEnabled;
    let SemanticColoringFeature = class SemanticColoringFeature extends lifecycle_1.Disposable {
        constructor(semanticStyling, modelService, themeService, configurationService, languageFeatureDebounceService, languageFeaturesService) {
            super();
            this._watchers = Object.create(null);
            this._semanticStyling = semanticStyling;
            const register = (model) => {
                this._watchers[model.uri.toString()] = new ModelSemanticColoring(model, this._semanticStyling, themeService, languageFeatureDebounceService, languageFeaturesService);
            };
            const deregister = (model, modelSemanticColoring) => {
                modelSemanticColoring.dispose();
                delete this._watchers[model.uri.toString()];
            };
            const handleSettingOrThemeChange = () => {
                for (let model of modelService.getModels()) {
                    const curr = this._watchers[model.uri.toString()];
                    if (isSemanticColoringEnabled(model, themeService, configurationService)) {
                        if (!curr) {
                            register(model);
                        }
                    }
                    else {
                        if (curr) {
                            deregister(model, curr);
                        }
                    }
                }
            };
            this._register(modelService.onModelAdded((model) => {
                if (isSemanticColoringEnabled(model, themeService, configurationService)) {
                    register(model);
                }
            }));
            this._register(modelService.onModelRemoved((model) => {
                const curr = this._watchers[model.uri.toString()];
                if (curr) {
                    deregister(model, curr);
                }
            }));
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(exports.SEMANTIC_HIGHLIGHTING_SETTING_ID)) {
                    handleSettingOrThemeChange();
                }
            }));
            this._register(themeService.onDidColorThemeChange(handleSettingOrThemeChange));
        }
    };
    SemanticColoringFeature = __decorate([
        __param(1, model_1.IModelService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(5, languageFeatures_1.ILanguageFeaturesService)
    ], SemanticColoringFeature);
    class SemanticStyling extends lifecycle_1.Disposable {
        constructor(_themeService, _languageService, _logService) {
            super();
            this._themeService = _themeService;
            this._languageService = _languageService;
            this._logService = _logService;
            this._caches = new WeakMap();
            this._register(this._themeService.onDidColorThemeChange(() => {
                this._caches = new WeakMap();
            }));
        }
        get(provider) {
            if (!this._caches.has(provider)) {
                this._caches.set(provider, new semanticTokensProviderStyling_1.SemanticTokensProviderStyling(provider.getLegend(), this._themeService, this._languageService, this._logService));
            }
            return this._caches.get(provider);
        }
    }
    class SemanticTokensResponse {
        constructor(provider, resultId, data) {
            this.provider = provider;
            this.resultId = resultId;
            this.data = data;
        }
        dispose() {
            this.provider.releaseDocumentSemanticTokens(this.resultId);
        }
    }
    let ModelSemanticColoring = class ModelSemanticColoring extends lifecycle_1.Disposable {
        constructor(model, stylingProvider, themeService, languageFeatureDebounceService, languageFeaturesService) {
            super();
            this._isDisposed = false;
            this._model = model;
            this._semanticStyling = stylingProvider;
            this._provider = languageFeaturesService.documentSemanticTokensProvider;
            this._debounceInformation = languageFeatureDebounceService.for(this._provider, 'DocumentSemanticTokens', { min: ModelSemanticColoring.REQUEST_MIN_DELAY, max: ModelSemanticColoring.REQUEST_MAX_DELAY });
            this._fetchDocumentSemanticTokens = this._register(new async_1.RunOnceScheduler(() => this._fetchDocumentSemanticTokensNow(), ModelSemanticColoring.REQUEST_MIN_DELAY));
            this._currentDocumentResponse = null;
            this._currentDocumentRequestCancellationTokenSource = null;
            this._documentProvidersChangeListeners = [];
            this._register(this._model.onDidChangeContent(() => {
                if (!this._fetchDocumentSemanticTokens.isScheduled()) {
                    this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
                }
            }));
            this._register(this._model.onDidChangeLanguage(() => {
                // clear any outstanding state
                if (this._currentDocumentResponse) {
                    this._currentDocumentResponse.dispose();
                    this._currentDocumentResponse = null;
                }
                if (this._currentDocumentRequestCancellationTokenSource) {
                    this._currentDocumentRequestCancellationTokenSource.cancel();
                    this._currentDocumentRequestCancellationTokenSource = null;
                }
                this._setDocumentSemanticTokens(null, null, null, []);
                this._fetchDocumentSemanticTokens.schedule(0);
            }));
            const bindDocumentChangeListeners = () => {
                (0, lifecycle_1.dispose)(this._documentProvidersChangeListeners);
                this._documentProvidersChangeListeners = [];
                for (const provider of this._provider.all(model)) {
                    if (typeof provider.onDidChange === 'function') {
                        this._documentProvidersChangeListeners.push(provider.onDidChange(() => this._fetchDocumentSemanticTokens.schedule(0)));
                    }
                }
            };
            bindDocumentChangeListeners();
            this._register(this._provider.onDidChange(() => {
                bindDocumentChangeListeners();
                this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
            }));
            this._register(themeService.onDidColorThemeChange(_ => {
                // clear out existing tokens
                this._setDocumentSemanticTokens(null, null, null, []);
                this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
            }));
            this._fetchDocumentSemanticTokens.schedule(0);
        }
        dispose() {
            if (this._currentDocumentResponse) {
                this._currentDocumentResponse.dispose();
                this._currentDocumentResponse = null;
            }
            if (this._currentDocumentRequestCancellationTokenSource) {
                this._currentDocumentRequestCancellationTokenSource.cancel();
                this._currentDocumentRequestCancellationTokenSource = null;
            }
            this._setDocumentSemanticTokens(null, null, null, []);
            this._isDisposed = true;
            super.dispose();
        }
        _fetchDocumentSemanticTokensNow() {
            if (this._currentDocumentRequestCancellationTokenSource) {
                // there is already a request running, let it finish...
                return;
            }
            if (!(0, getSemanticTokens_1.hasDocumentSemanticTokensProvider)(this._provider, this._model)) {
                // there is no provider
                if (this._currentDocumentResponse) {
                    // there are semantic tokens set
                    this._model.tokenization.setSemanticTokens(null, false);
                }
                return;
            }
            const cancellationTokenSource = new cancellation_1.CancellationTokenSource();
            const lastProvider = this._currentDocumentResponse ? this._currentDocumentResponse.provider : null;
            const lastResultId = this._currentDocumentResponse ? this._currentDocumentResponse.resultId || null : null;
            const request = (0, getSemanticTokens_1.getDocumentSemanticTokens)(this._provider, this._model, lastProvider, lastResultId, cancellationTokenSource.token);
            this._currentDocumentRequestCancellationTokenSource = cancellationTokenSource;
            const pendingChanges = [];
            const contentChangeListener = this._model.onDidChangeContent((e) => {
                pendingChanges.push(e);
            });
            const sw = new stopwatch_1.StopWatch(false);
            request.then((res) => {
                this._debounceInformation.update(this._model, sw.elapsed());
                this._currentDocumentRequestCancellationTokenSource = null;
                contentChangeListener.dispose();
                if (!res) {
                    this._setDocumentSemanticTokens(null, null, null, pendingChanges);
                }
                else {
                    const { provider, tokens } = res;
                    const styling = this._semanticStyling.get(provider);
                    this._setDocumentSemanticTokens(provider, tokens || null, styling, pendingChanges);
                }
            }, (err) => {
                const isExpectedError = err && (errors.isCancellationError(err) || (typeof err.message === 'string' && err.message.indexOf('busy') !== -1));
                if (!isExpectedError) {
                    errors.onUnexpectedError(err);
                }
                // Semantic tokens eats up all errors and considers errors to mean that the result is temporarily not available
                // The API does not have a special error kind to express this...
                this._currentDocumentRequestCancellationTokenSource = null;
                contentChangeListener.dispose();
                if (pendingChanges.length > 0) {
                    // More changes occurred while the request was running
                    if (!this._fetchDocumentSemanticTokens.isScheduled()) {
                        this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
                    }
                }
            });
        }
        static _copy(src, srcOffset, dest, destOffset, length) {
            for (let i = 0; i < length; i++) {
                dest[destOffset + i] = src[srcOffset + i];
            }
        }
        _setDocumentSemanticTokens(provider, tokens, styling, pendingChanges) {
            const currentResponse = this._currentDocumentResponse;
            const rescheduleIfNeeded = () => {
                if (pendingChanges.length > 0 && !this._fetchDocumentSemanticTokens.isScheduled()) {
                    this._fetchDocumentSemanticTokens.schedule(this._debounceInformation.get(this._model));
                }
            };
            if (this._currentDocumentResponse) {
                this._currentDocumentResponse.dispose();
                this._currentDocumentResponse = null;
            }
            if (this._isDisposed) {
                // disposed!
                if (provider && tokens) {
                    provider.releaseDocumentSemanticTokens(tokens.resultId);
                }
                return;
            }
            if (!provider || !styling) {
                this._model.tokenization.setSemanticTokens(null, false);
                return;
            }
            if (!tokens) {
                this._model.tokenization.setSemanticTokens(null, true);
                rescheduleIfNeeded();
                return;
            }
            if ((0, getSemanticTokens_1.isSemanticTokensEdits)(tokens)) {
                if (!currentResponse) {
                    // not possible!
                    this._model.tokenization.setSemanticTokens(null, true);
                    return;
                }
                if (tokens.edits.length === 0) {
                    // nothing to do!
                    tokens = {
                        resultId: tokens.resultId,
                        data: currentResponse.data
                    };
                }
                else {
                    let deltaLength = 0;
                    for (const edit of tokens.edits) {
                        deltaLength += (edit.data ? edit.data.length : 0) - edit.deleteCount;
                    }
                    const srcData = currentResponse.data;
                    const destData = new Uint32Array(srcData.length + deltaLength);
                    let srcLastStart = srcData.length;
                    let destLastStart = destData.length;
                    for (let i = tokens.edits.length - 1; i >= 0; i--) {
                        const edit = tokens.edits[i];
                        const copyCount = srcLastStart - (edit.start + edit.deleteCount);
                        if (copyCount > 0) {
                            ModelSemanticColoring._copy(srcData, srcLastStart - copyCount, destData, destLastStart - copyCount, copyCount);
                            destLastStart -= copyCount;
                        }
                        if (edit.data) {
                            ModelSemanticColoring._copy(edit.data, 0, destData, destLastStart - edit.data.length, edit.data.length);
                            destLastStart -= edit.data.length;
                        }
                        srcLastStart = edit.start;
                    }
                    if (srcLastStart > 0) {
                        ModelSemanticColoring._copy(srcData, 0, destData, 0, srcLastStart);
                    }
                    tokens = {
                        resultId: tokens.resultId,
                        data: destData
                    };
                }
            }
            if ((0, getSemanticTokens_1.isSemanticTokens)(tokens)) {
                this._currentDocumentResponse = new SemanticTokensResponse(provider, tokens.resultId, tokens.data);
                const result = (0, semanticTokensProviderStyling_1.toMultilineTokens2)(tokens, styling, this._model.getLanguageId());
                // Adjust incoming semantic tokens
                if (pendingChanges.length > 0) {
                    // More changes occurred while the request was running
                    // We need to:
                    // 1. Adjust incoming semantic tokens
                    // 2. Request them again
                    for (const change of pendingChanges) {
                        for (const area of result) {
                            for (const singleChange of change.changes) {
                                area.applyEdit(singleChange.range, singleChange.text);
                            }
                        }
                    }
                }
                this._model.tokenization.setSemanticTokens(result, true);
            }
            else {
                this._model.tokenization.setSemanticTokens(null, true);
            }
            rescheduleIfNeeded();
        }
    };
    ModelSemanticColoring.REQUEST_MIN_DELAY = 300;
    ModelSemanticColoring.REQUEST_MAX_DELAY = 2000;
    ModelSemanticColoring = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(4, languageFeatures_1.ILanguageFeaturesService)
    ], ModelSemanticColoring);
    exports.ModelSemanticColoring = ModelSemanticColoring;
});
//# sourceMappingURL=modelService.js.map