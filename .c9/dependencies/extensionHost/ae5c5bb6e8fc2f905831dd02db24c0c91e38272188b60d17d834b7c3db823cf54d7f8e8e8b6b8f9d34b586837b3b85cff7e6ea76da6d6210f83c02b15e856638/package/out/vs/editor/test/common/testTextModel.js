/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/common/model/textModel", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/languages/language", "vs/editor/common/services/languageService", "vs/editor/common/services/textResourceConfiguration", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/serviceCollection", "vs/platform/log/common/log", "vs/platform/notification/common/notification", "vs/platform/notification/test/common/testNotificationService", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/platform/undoRedo/common/undoRedo", "vs/platform/undoRedo/common/undoRedoService", "vs/editor/test/common/services/testTextResourcePropertiesService", "vs/editor/common/services/model", "vs/editor/common/services/modelService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/editor/common/languages/modesRegistry", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/languageFeaturesService"], function (require, exports, lifecycle_1, textModel_1, languageConfigurationRegistry_1, language_1, languageService_1, textResourceConfiguration_1, testLanguageConfigurationService_1, configuration_1, testConfigurationService_1, dialogs_1, testDialogService_1, descriptors_1, serviceCollection_1, log_1, notification_1, testNotificationService_1, themeService_1, testThemeService_1, undoRedo_1, undoRedoService_1, testTextResourcePropertiesService_1, model_1, modelService_1, instantiationServiceMock_1, modesRegistry_1, languageFeatureDebounce_1, languageFeatures_1, languageFeaturesService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createModelServices = exports.instantiateTextModel = exports.createTextModel = exports.withEditorModel = void 0;
    class TestTextModel extends textModel_1.TextModel {
        registerDisposable(disposable) {
            this._register(disposable);
        }
    }
    function withEditorModel(text, callback) {
        const model = createTextModel(text.join('\n'));
        callback(model);
        model.dispose();
    }
    exports.withEditorModel = withEditorModel;
    function resolveOptions(_options) {
        const defaultOptions = textModel_1.TextModel.DEFAULT_CREATION_OPTIONS;
        return {
            tabSize: (typeof _options.tabSize === 'undefined' ? defaultOptions.tabSize : _options.tabSize),
            indentSize: (typeof _options.indentSize === 'undefined' ? defaultOptions.indentSize : _options.indentSize),
            insertSpaces: (typeof _options.insertSpaces === 'undefined' ? defaultOptions.insertSpaces : _options.insertSpaces),
            detectIndentation: (typeof _options.detectIndentation === 'undefined' ? defaultOptions.detectIndentation : _options.detectIndentation),
            trimAutoWhitespace: (typeof _options.trimAutoWhitespace === 'undefined' ? defaultOptions.trimAutoWhitespace : _options.trimAutoWhitespace),
            defaultEOL: (typeof _options.defaultEOL === 'undefined' ? defaultOptions.defaultEOL : _options.defaultEOL),
            isForSimpleWidget: (typeof _options.isForSimpleWidget === 'undefined' ? defaultOptions.isForSimpleWidget : _options.isForSimpleWidget),
            largeFileOptimizations: (typeof _options.largeFileOptimizations === 'undefined' ? defaultOptions.largeFileOptimizations : _options.largeFileOptimizations),
            bracketPairColorizationOptions: (typeof _options.bracketColorizationOptions === 'undefined' ? defaultOptions.bracketPairColorizationOptions : _options.bracketColorizationOptions),
        };
    }
    function createTextModel(text, languageId = null, options = textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, uri = null) {
        const disposables = new lifecycle_1.DisposableStore();
        const instantiationService = createModelServices(disposables);
        const model = instantiateTextModel(instantiationService, text, languageId, options, uri);
        model.registerDisposable(disposables);
        return model;
    }
    exports.createTextModel = createTextModel;
    function instantiateTextModel(instantiationService, text, languageId = null, _options = textModel_1.TextModel.DEFAULT_CREATION_OPTIONS, uri = null) {
        const options = resolveOptions(_options);
        return instantiationService.createInstance(TestTextModel, text, languageId || modesRegistry_1.PLAINTEXT_LANGUAGE_ID, options, uri);
    }
    exports.instantiateTextModel = instantiateTextModel;
    function createModelServices(disposables, services = new serviceCollection_1.ServiceCollection()) {
        const serviceIdentifiers = [];
        const define = (id, ctor) => {
            if (!services.has(id)) {
                services.set(id, new descriptors_1.SyncDescriptor(ctor));
            }
            serviceIdentifiers.push(id);
        };
        define(notification_1.INotificationService, testNotificationService_1.TestNotificationService);
        define(dialogs_1.IDialogService, testDialogService_1.TestDialogService);
        define(undoRedo_1.IUndoRedoService, undoRedoService_1.UndoRedoService);
        define(language_1.ILanguageService, languageService_1.LanguageService);
        define(languageConfigurationRegistry_1.ILanguageConfigurationService, testLanguageConfigurationService_1.TestLanguageConfigurationService);
        define(configuration_1.IConfigurationService, testConfigurationService_1.TestConfigurationService);
        define(textResourceConfiguration_1.ITextResourcePropertiesService, testTextResourcePropertiesService_1.TestTextResourcePropertiesService);
        define(themeService_1.IThemeService, testThemeService_1.TestThemeService);
        define(log_1.ILogService, log_1.NullLogService);
        define(languageFeatureDebounce_1.ILanguageFeatureDebounceService, languageFeatureDebounce_1.LanguageFeatureDebounceService);
        define(languageFeatures_1.ILanguageFeaturesService, languageFeaturesService_1.LanguageFeaturesService);
        define(model_1.IModelService, modelService_1.ModelService);
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
    exports.createModelServices = createModelServices;
});
//# sourceMappingURL=testTextModel.js.map