/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/common/editor/textEditorModel", "vs/editor/common/languages/language", "vs/editor/common/services/languageService", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/editor/common/services/modelService", "vs/editor/common/model/textModel", "vs/editor/common/services/textResourceConfiguration", "vs/platform/undoRedo/common/undoRedo", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/test/common/testNotificationService", "vs/platform/notification/common/notification", "vs/workbench/test/common/workbenchTestServices", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/workbench/common/editor/editorModel", "vs/base/common/mime", "vs/workbench/services/languageDetection/browser/languageDetectionWorkerServiceImpl", "vs/workbench/services/environment/common/environmentService", "vs/workbench/test/browser/workbenchTestServices", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/editor/common/languages/languageConfigurationRegistry", "vs/platform/accessibility/test/common/testAccessibilityService", "vs/workbench/services/editor/common/editorService", "vs/platform/storage/common/storage"], function (require, exports, assert, instantiationServiceMock_1, textEditorModel_1, language_1, languageService_1, configuration_1, testConfigurationService_1, modelService_1, textModel_1, textResourceConfiguration_1, undoRedo_1, undoRedoService_1, testDialogService_1, dialogs_1, testNotificationService_1, notification_1, workbenchTestServices_1, themeService_1, testThemeService_1, editorModel_1, mime_1, languageDetectionWorkerServiceImpl_1, environmentService_1, workbenchTestServices_2, testLanguageConfigurationService_1, languageConfigurationRegistry_1, testAccessibilityService_1, editorService_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditorModel', () => {
        class MyEditorModel extends editorModel_1.EditorModel {
        }
        class MyTextEditorModel extends textEditorModel_1.BaseTextEditorModel {
            createTextEditorModel(value, resource, preferredLanguageId) {
                return super.createTextEditorModel(value, resource, preferredLanguageId);
            }
            isReadonly() {
                return false;
            }
        }
        function stubModelService(instantiationService) {
            const dialogService = new testDialogService_1.TestDialogService();
            const notificationService = new testNotificationService_1.TestNotificationService();
            const undoRedoService = new undoRedoService_1.UndoRedoService(dialogService, notificationService);
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, workbenchTestServices_2.TestEnvironmentService);
            instantiationService.stub(configuration_1.IConfigurationService, new testConfigurationService_1.TestConfigurationService());
            instantiationService.stub(textResourceConfiguration_1.ITextResourcePropertiesService, new workbenchTestServices_1.TestTextResourcePropertiesService(instantiationService.get(configuration_1.IConfigurationService)));
            instantiationService.stub(dialogs_1.IDialogService, dialogService);
            instantiationService.stub(notification_1.INotificationService, notificationService);
            instantiationService.stub(undoRedo_1.IUndoRedoService, undoRedoService);
            instantiationService.stub(editorService_1.IEditorService, new workbenchTestServices_2.TestEditorService());
            instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
            instantiationService.stub(languageConfigurationRegistry_1.ILanguageConfigurationService, new testLanguageConfigurationService_1.TestLanguageConfigurationService());
            instantiationService.stub(storage_1.IStorageService, new workbenchTestServices_1.TestStorageService());
            return instantiationService.createInstance(modelService_1.ModelService);
        }
        let instantiationService;
        let languageService;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            languageService = instantiationService.stub(language_1.ILanguageService, languageService_1.LanguageService);
        });
        test('basics', async () => {
            let counter = 0;
            const model = new MyEditorModel();
            model.onWillDispose(() => {
                assert(true);
                counter++;
            });
            await model.resolve();
            assert.strictEqual(model.isDisposed(), false);
            assert.strictEqual(model.isResolved(), true);
            model.dispose();
            assert.strictEqual(counter, 1);
            assert.strictEqual(model.isDisposed(), true);
        });
        test('BaseTextEditorModel', async () => {
            let modelService = stubModelService(instantiationService);
            const model = new MyTextEditorModel(modelService, languageService, instantiationService.createInstance(languageDetectionWorkerServiceImpl_1.LanguageDetectionService), instantiationService.createInstance(testAccessibilityService_1.TestAccessibilityService));
            await model.resolve();
            model.createTextEditorModel((0, textModel_1.createTextBufferFactory)('foo'), null, mime_1.Mimes.text);
            assert.strictEqual(model.isResolved(), true);
            model.dispose();
        });
    });
});
//# sourceMappingURL=editorModel.test.js.map