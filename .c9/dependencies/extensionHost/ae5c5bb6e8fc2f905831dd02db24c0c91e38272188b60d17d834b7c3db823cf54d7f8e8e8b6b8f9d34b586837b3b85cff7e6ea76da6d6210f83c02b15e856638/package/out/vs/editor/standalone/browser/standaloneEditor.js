/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/editor/browser/config/fontMeasurements", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/diffNavigator", "vs/editor/common/config/editorOptions", "vs/editor/common/config/fontInfo", "vs/editor/common/editorCommon", "vs/editor/common/model", "vs/editor/common/languages", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/nullTokenize", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/editor/browser/services/webWorker", "vs/editor/common/standalone/standaloneEnums", "vs/editor/standalone/browser/colorizer", "vs/editor/standalone/browser/standaloneCodeEditor", "vs/editor/standalone/browser/standaloneServices", "vs/editor/standalone/common/standaloneTheme", "vs/platform/commands/common/commands", "vs/platform/markers/common/markers", "vs/css!./standalone-tokens"], function (require, exports, strings_1, fontMeasurements_1, codeEditorService_1, diffNavigator_1, editorOptions_1, fontInfo_1, editorCommon_1, model_1, languages, languageConfigurationRegistry_1, nullTokenize_1, language_1, model_2, webWorker_1, standaloneEnums, colorizer_1, standaloneCodeEditor_1, standaloneServices_1, standaloneTheme_1, commands_1, markers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createMonacoEditorAPI = exports.registerCommand = exports.remeasureFonts = exports.setTheme = exports.defineTheme = exports.tokenize = exports.colorizeModelLine = exports.colorize = exports.colorizeElement = exports.createWebWorker = exports.onDidChangeModelLanguage = exports.onWillDisposeModel = exports.onDidCreateModel = exports.getModels = exports.getModel = exports.onDidChangeMarkers = exports.getModelMarkers = exports.setModelMarkers = exports.setModelLanguage = exports.createModel = exports.createDiffNavigator = exports.createDiffEditor = exports.onDidCreateEditor = exports.create = void 0;
    /**
     * Create a new editor under `domElement`.
     * `domElement` should be empty (not contain other dom nodes).
     * The editor will read the size of `domElement`.
     */
    function create(domElement, options, override) {
        const instantiationService = standaloneServices_1.StandaloneServices.initialize(override || {});
        return instantiationService.createInstance(standaloneCodeEditor_1.StandaloneEditor, domElement, options);
    }
    exports.create = create;
    /**
     * Emitted when an editor is created.
     * Creating a diff editor might cause this listener to be invoked with the two editors.
     * @event
     */
    function onDidCreateEditor(listener) {
        const codeEditorService = standaloneServices_1.StandaloneServices.get(codeEditorService_1.ICodeEditorService);
        return codeEditorService.onCodeEditorAdd((editor) => {
            listener(editor);
        });
    }
    exports.onDidCreateEditor = onDidCreateEditor;
    /**
     * Create a new diff editor under `domElement`.
     * `domElement` should be empty (not contain other dom nodes).
     * The editor will read the size of `domElement`.
     */
    function createDiffEditor(domElement, options, override) {
        const instantiationService = standaloneServices_1.StandaloneServices.initialize(override || {});
        return instantiationService.createInstance(standaloneCodeEditor_1.StandaloneDiffEditor, domElement, options);
    }
    exports.createDiffEditor = createDiffEditor;
    function createDiffNavigator(diffEditor, opts) {
        return new diffNavigator_1.DiffNavigator(diffEditor, opts);
    }
    exports.createDiffNavigator = createDiffNavigator;
    /**
     * Create a new editor model.
     * You can specify the language that should be set for this model or let the language be inferred from the `uri`.
     */
    function createModel(value, language, uri) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        const languageId = languageService.getLanguageIdByMimeType(language) || language;
        return (0, standaloneCodeEditor_1.createTextModel)(standaloneServices_1.StandaloneServices.get(model_2.IModelService), languageService, value, languageId, uri);
    }
    exports.createModel = createModel;
    /**
     * Change the language for a model.
     */
    function setModelLanguage(model, languageId) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        modelService.setMode(model, languageService.createById(languageId));
    }
    exports.setModelLanguage = setModelLanguage;
    /**
     * Set the markers for a model.
     */
    function setModelMarkers(model, owner, markers) {
        if (model) {
            const markerService = standaloneServices_1.StandaloneServices.get(markers_1.IMarkerService);
            markerService.changeOne(owner, model.uri, markers);
        }
    }
    exports.setModelMarkers = setModelMarkers;
    /**
     * Get markers for owner and/or resource
     *
     * @returns list of markers
     */
    function getModelMarkers(filter) {
        const markerService = standaloneServices_1.StandaloneServices.get(markers_1.IMarkerService);
        return markerService.read(filter);
    }
    exports.getModelMarkers = getModelMarkers;
    /**
     * Emitted when markers change for a model.
     * @event
     */
    function onDidChangeMarkers(listener) {
        const markerService = standaloneServices_1.StandaloneServices.get(markers_1.IMarkerService);
        return markerService.onMarkerChanged(listener);
    }
    exports.onDidChangeMarkers = onDidChangeMarkers;
    /**
     * Get the model that has `uri` if it exists.
     */
    function getModel(uri) {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.getModel(uri);
    }
    exports.getModel = getModel;
    /**
     * Get all the created models.
     */
    function getModels() {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.getModels();
    }
    exports.getModels = getModels;
    /**
     * Emitted when a model is created.
     * @event
     */
    function onDidCreateModel(listener) {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.onModelAdded(listener);
    }
    exports.onDidCreateModel = onDidCreateModel;
    /**
     * Emitted right before a model is disposed.
     * @event
     */
    function onWillDisposeModel(listener) {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.onModelRemoved(listener);
    }
    exports.onWillDisposeModel = onWillDisposeModel;
    /**
     * Emitted when a different language is set to a model.
     * @event
     */
    function onDidChangeModelLanguage(listener) {
        const modelService = standaloneServices_1.StandaloneServices.get(model_2.IModelService);
        return modelService.onModelLanguageChanged((e) => {
            listener({
                model: e.model,
                oldLanguage: e.oldLanguageId
            });
        });
    }
    exports.onDidChangeModelLanguage = onDidChangeModelLanguage;
    /**
     * Create a new web worker that has model syncing capabilities built in.
     * Specify an AMD module to load that will `create` an object that will be proxied.
     */
    function createWebWorker(opts) {
        return (0, webWorker_1.createWebWorker)(standaloneServices_1.StandaloneServices.get(model_2.IModelService), standaloneServices_1.StandaloneServices.get(languageConfigurationRegistry_1.ILanguageConfigurationService), opts);
    }
    exports.createWebWorker = createWebWorker;
    /**
     * Colorize the contents of `domNode` using attribute `data-lang`.
     */
    function colorizeElement(domNode, options) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        const themeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        themeService.registerEditorContainer(domNode);
        return colorizer_1.Colorizer.colorizeElement(themeService, languageService, domNode, options);
    }
    exports.colorizeElement = colorizeElement;
    /**
     * Colorize `text` using language `languageId`.
     */
    function colorize(text, languageId, options) {
        const languageService = standaloneServices_1.StandaloneServices.get(language_1.ILanguageService);
        const themeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        themeService.registerEditorContainer(document.body);
        return colorizer_1.Colorizer.colorize(languageService, text, languageId, options);
    }
    exports.colorize = colorize;
    /**
     * Colorize a line in a model.
     */
    function colorizeModelLine(model, lineNumber, tabSize = 4) {
        const themeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        themeService.registerEditorContainer(document.body);
        return colorizer_1.Colorizer.colorizeModelLine(model, lineNumber, tabSize);
    }
    exports.colorizeModelLine = colorizeModelLine;
    /**
     * @internal
     */
    function getSafeTokenizationSupport(language) {
        const tokenizationSupport = languages.TokenizationRegistry.get(language);
        if (tokenizationSupport) {
            return tokenizationSupport;
        }
        return {
            getInitialState: () => nullTokenize_1.NullState,
            tokenize: (line, hasEOL, state) => (0, nullTokenize_1.nullTokenize)(language, state)
        };
    }
    /**
     * Tokenize `text` using language `languageId`
     */
    function tokenize(text, languageId) {
        // Needed in order to get the mode registered for subsequent look-ups
        languages.TokenizationRegistry.getOrCreate(languageId);
        const tokenizationSupport = getSafeTokenizationSupport(languageId);
        const lines = (0, strings_1.splitLines)(text);
        const result = [];
        let state = tokenizationSupport.getInitialState();
        for (let i = 0, len = lines.length; i < len; i++) {
            const line = lines[i];
            const tokenizationResult = tokenizationSupport.tokenize(line, true, state);
            result[i] = tokenizationResult.tokens;
            state = tokenizationResult.endState;
        }
        return result;
    }
    exports.tokenize = tokenize;
    /**
     * Define a new theme or update an existing theme.
     */
    function defineTheme(themeName, themeData) {
        const standaloneThemeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        standaloneThemeService.defineTheme(themeName, themeData);
    }
    exports.defineTheme = defineTheme;
    /**
     * Switches to a theme.
     */
    function setTheme(themeName) {
        const standaloneThemeService = standaloneServices_1.StandaloneServices.get(standaloneTheme_1.IStandaloneThemeService);
        standaloneThemeService.setTheme(themeName);
    }
    exports.setTheme = setTheme;
    /**
     * Clears all cached font measurements and triggers re-measurement.
     */
    function remeasureFonts() {
        fontMeasurements_1.FontMeasurements.clearAllFontInfos();
    }
    exports.remeasureFonts = remeasureFonts;
    /**
     * Register a command.
     */
    function registerCommand(id, handler) {
        return commands_1.CommandsRegistry.registerCommand({ id, handler });
    }
    exports.registerCommand = registerCommand;
    /**
     * @internal
     */
    function createMonacoEditorAPI() {
        return {
            // methods
            create: create,
            onDidCreateEditor: onDidCreateEditor,
            createDiffEditor: createDiffEditor,
            createDiffNavigator: createDiffNavigator,
            createModel: createModel,
            setModelLanguage: setModelLanguage,
            setModelMarkers: setModelMarkers,
            getModelMarkers: getModelMarkers,
            onDidChangeMarkers: onDidChangeMarkers,
            getModels: getModels,
            getModel: getModel,
            onDidCreateModel: onDidCreateModel,
            onWillDisposeModel: onWillDisposeModel,
            onDidChangeModelLanguage: onDidChangeModelLanguage,
            createWebWorker: createWebWorker,
            colorizeElement: colorizeElement,
            colorize: colorize,
            colorizeModelLine: colorizeModelLine,
            tokenize: tokenize,
            defineTheme: defineTheme,
            setTheme: setTheme,
            remeasureFonts: remeasureFonts,
            registerCommand: registerCommand,
            // enums
            AccessibilitySupport: standaloneEnums.AccessibilitySupport,
            ContentWidgetPositionPreference: standaloneEnums.ContentWidgetPositionPreference,
            CursorChangeReason: standaloneEnums.CursorChangeReason,
            DefaultEndOfLine: standaloneEnums.DefaultEndOfLine,
            EditorAutoIndentStrategy: standaloneEnums.EditorAutoIndentStrategy,
            EditorOption: standaloneEnums.EditorOption,
            EndOfLinePreference: standaloneEnums.EndOfLinePreference,
            EndOfLineSequence: standaloneEnums.EndOfLineSequence,
            MinimapPosition: standaloneEnums.MinimapPosition,
            MouseTargetType: standaloneEnums.MouseTargetType,
            OverlayWidgetPositionPreference: standaloneEnums.OverlayWidgetPositionPreference,
            OverviewRulerLane: standaloneEnums.OverviewRulerLane,
            RenderLineNumbersType: standaloneEnums.RenderLineNumbersType,
            RenderMinimap: standaloneEnums.RenderMinimap,
            ScrollbarVisibility: standaloneEnums.ScrollbarVisibility,
            ScrollType: standaloneEnums.ScrollType,
            TextEditorCursorBlinkingStyle: standaloneEnums.TextEditorCursorBlinkingStyle,
            TextEditorCursorStyle: standaloneEnums.TextEditorCursorStyle,
            TrackedRangeStickiness: standaloneEnums.TrackedRangeStickiness,
            WrappingIndent: standaloneEnums.WrappingIndent,
            InjectedTextCursorStops: standaloneEnums.InjectedTextCursorStops,
            PositionAffinity: standaloneEnums.PositionAffinity,
            // classes
            ConfigurationChangedEvent: editorOptions_1.ConfigurationChangedEvent,
            BareFontInfo: fontInfo_1.BareFontInfo,
            FontInfo: fontInfo_1.FontInfo,
            TextModelResolvedOptions: model_1.TextModelResolvedOptions,
            FindMatch: model_1.FindMatch,
            ApplyUpdateResult: editorOptions_1.ApplyUpdateResult,
            // vars
            EditorType: editorCommon_1.EditorType,
            EditorOptions: editorOptions_1.EditorOptions
        };
    }
    exports.createMonacoEditorAPI = createMonacoEditorAPI;
});
//# sourceMappingURL=standaloneEditor.js.map