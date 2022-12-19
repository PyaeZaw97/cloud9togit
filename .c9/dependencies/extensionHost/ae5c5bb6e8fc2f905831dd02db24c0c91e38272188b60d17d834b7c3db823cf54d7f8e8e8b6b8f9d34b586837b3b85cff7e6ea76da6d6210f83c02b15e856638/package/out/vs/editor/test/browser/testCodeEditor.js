/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/common/languages/language", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/editorWorker", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/languageFeaturesService", "vs/editor/common/services/languageService", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/editor/common/services/textResourceConfiguration", "vs/editor/test/browser/config/testConfiguration", "vs/editor/test/browser/editorTestServices", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/editor/test/common/services/testEditorWorkerService", "vs/editor/test/common/services/testTextResourcePropertiesService", "vs/editor/test/common/testTextModel", "vs/platform/accessibility/common/accessibility", "vs/platform/accessibility/test/common/testAccessibilityService", "vs/platform/clipboard/common/clipboardService", "vs/platform/clipboard/test/common/testClipboardService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextkey/common/contextkey", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/serviceCollection", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/undoRedo/common/undoRedoService"], function (require, exports, lifecycle_1, codeEditorService_1, codeEditorWidget_1, language_1, languageConfigurationRegistry_1, editorWorker_1, languageFeatureDebounce_1, languageFeatures_1, languageFeaturesService_1, languageService_1, model_1, modelService_1, textResourceConfiguration_1, testConfiguration_1, editorTestServices_1, testLanguageConfigurationService_1, testEditorWorkerService_1, testTextResourcePropertiesService_1, testTextModel_1, accessibility_1, testAccessibilityService_1, clipboardService_1, testClipboardService_1, commands_1, configuration_1, testConfigurationService_1, contextkey_1, dialogs_1, testDialogService_1, descriptors_1, serviceCollection_1, instantiationServiceMock_1, mockKeybindingService_1, log_1, notification_1, testNotificationService_1, opener_1, telemetry_1, telemetryUtils_1, themeService_1, testThemeService_1, undoRedo_1, undoRedoService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.instantiateTestCodeEditor = exports.createTestCodeEditor = exports.createCodeEditorServices = exports.withAsyncTestCodeEditor = exports.withTestCodeEditor = exports.TestCodeEditor = void 0;
    class TestCodeEditor extends codeEditorWidget_1.CodeEditorWidget {
        constructor() {
            super(...arguments);
            this._hasTextFocus = false;
        }
        //#region testing overrides
        _createConfiguration(isSimpleWidget, options) {
            return new testConfiguration_1.TestConfiguration(options);
        }
        _createView(viewModel) {
            // Never create a view
            return [null, false];
        }
        setHasTextFocus(hasTextFocus) {
            this._hasTextFocus = hasTextFocus;
        }
        hasTextFocus() {
            return this._hasTextFocus;
        }
        //#endregion
        //#region Testing utils
        getViewModel() {
            return this._modelData ? this._modelData.viewModel : undefined;
        }
        registerAndInstantiateContribution(id, ctor) {
            const r = this._instantiationService.createInstance(ctor, this);
            this._contributions[id] = r;
            return r;
        }
        registerDisposable(disposable) {
            this._register(disposable);
        }
    }
    exports.TestCodeEditor = TestCodeEditor;
    class TestEditorDomElement {
        constructor() {
            this.parentElement = null;
        }
        setAttribute(attr, value) { }
        removeAttribute(attr) { }
        hasAttribute(attr) { return false; }
        getAttribute(attr) { return undefined; }
        addEventListener(event) { }
        removeEventListener(event) { }
    }
    function withTestCodeEditor(text, options, callback) {
        return _withTestCodeEditor(text, options, callback);
    }
    exports.withTestCodeEditor = withTestCodeEditor;
    async function withAsyncTestCodeEditor(text, options, callback) {
        return _withTestCodeEditor(text, options, callback);
    }
    exports.withAsyncTestCodeEditor = withAsyncTestCodeEditor;
    function isTextModel(arg) {
        return Boolean(arg && arg.uri);
    }
    function _withTestCodeEditor(arg, options, callback) {
        const disposables = new lifecycle_1.DisposableStore();
        const instantiationService = createCodeEditorServices(disposables, options.serviceCollection);
        delete options.serviceCollection;
        // create a model if necessary
        let model;
        if (isTextModel(arg)) {
            model = arg;
        }
        else {
            model = disposables.add((0, testTextModel_1.instantiateTextModel)(instantiationService, Array.isArray(arg) ? arg.join('\n') : arg));
        }
        const editor = disposables.add(instantiateTestCodeEditor(instantiationService, model, options));
        const viewModel = editor.getViewModel();
        viewModel.setHasFocus(true);
        const result = callback(editor, editor.getViewModel(), instantiationService);
        if (result) {
            return result.then(() => disposables.dispose());
        }
        disposables.dispose();
    }
    function createCodeEditorServices(disposables, services = new serviceCollection_1.ServiceCollection()) {
        const serviceIdentifiers = [];
        const define = (id, ctor) => {
            if (!services.has(id)) {
                services.set(id, new descriptors_1.SyncDescriptor(ctor));
            }
            serviceIdentifiers.push(id);
        };
        const defineInstance = (id, instance) => {
            if (!services.has(id)) {
                services.set(id, instance);
            }
            serviceIdentifiers.push(id);
        };
        define(accessibility_1.IAccessibilityService, testAccessibilityService_1.TestAccessibilityService);
        define(clipboardService_1.IClipboardService, testClipboardService_1.TestClipboardService);
        define(editorWorker_1.IEditorWorkerService, testEditorWorkerService_1.TestEditorWorkerService);
        defineInstance(opener_1.IOpenerService, opener_1.NullOpenerService);
        define(notification_1.INotificationService, testNotificationService_1.TestNotificationService);
        define(dialogs_1.IDialogService, testDialogService_1.TestDialogService);
        define(undoRedo_1.IUndoRedoService, undoRedoService_1.UndoRedoService);
        define(language_1.ILanguageService, languageService_1.LanguageService);
        define(languageConfigurationRegistry_1.ILanguageConfigurationService, testLanguageConfigurationService_1.TestLanguageConfigurationService);
        define(configuration_1.IConfigurationService, testConfigurationService_1.TestConfigurationService);
        define(textResourceConfiguration_1.ITextResourcePropertiesService, testTextResourcePropertiesService_1.TestTextResourcePropertiesService);
        define(themeService_1.IThemeService, testThemeService_1.TestThemeService);
        define(log_1.ILogService, log_1.NullLogService);
        define(model_1.IModelService, modelService_1.ModelService);
        define(codeEditorService_1.ICodeEditorService, editorTestServices_1.TestCodeEditorService);
        define(contextkey_1.IContextKeyService, mockKeybindingService_1.MockContextKeyService);
        define(commands_1.ICommandService, editorTestServices_1.TestCommandService);
        define(telemetry_1.ITelemetryService, telemetryUtils_1.NullTelemetryServiceShape);
        define(languageFeatureDebounce_1.ILanguageFeatureDebounceService, languageFeatureDebounce_1.LanguageFeatureDebounceService);
        define(languageFeatures_1.ILanguageFeaturesService, languageFeaturesService_1.LanguageFeaturesService);
        const instantiationService = new instantiationServiceMock_1.TestInstantiationService(services, true);
        disposables.add((0, lifecycle_1.toDisposable)(() => {
            for (const id of serviceIdentifiers) {
                const instanceOrDescriptor = services.get(id);
                if (typeof instanceOrDescriptor.dispose === 'function') {
                    instanceOrDescriptor.dispose();
                }
            }
        }));
        return instantiationService;
    }
    exports.createCodeEditorServices = createCodeEditorServices;
    function createTestCodeEditor(model, options = {}) {
        const disposables = new lifecycle_1.DisposableStore();
        const instantiationService = createCodeEditorServices(disposables, options.serviceCollection);
        delete options.serviceCollection;
        const editor = instantiateTestCodeEditor(instantiationService, model || null, options);
        editor.registerDisposable(disposables);
        return editor;
    }
    exports.createTestCodeEditor = createTestCodeEditor;
    function instantiateTestCodeEditor(instantiationService, model, options = {}) {
        const codeEditorWidgetOptions = {
            contributions: []
        };
        const editor = instantiationService.createInstance(TestCodeEditor, new TestEditorDomElement(), options, codeEditorWidgetOptions);
        if (typeof options.hasTextFocus === 'undefined') {
            options.hasTextFocus = true;
        }
        editor.setHasTextFocus(options.hasTextFocus);
        editor.setModel(model);
        const viewModel = editor.getViewModel();
        viewModel === null || viewModel === void 0 ? void 0 : viewModel.setHasFocus(options.hasTextFocus);
        return editor;
    }
    exports.instantiateTestCodeEditor = instantiateTestCodeEditor;
});
//# sourceMappingURL=testCodeEditor.js.map