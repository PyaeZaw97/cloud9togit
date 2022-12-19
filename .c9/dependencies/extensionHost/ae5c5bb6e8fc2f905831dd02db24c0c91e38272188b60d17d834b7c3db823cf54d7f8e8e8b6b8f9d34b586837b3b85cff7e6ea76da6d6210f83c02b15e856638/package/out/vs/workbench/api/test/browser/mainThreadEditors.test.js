/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/api/test/common/testRPCProtocol", "vs/platform/configuration/test/common/testConfigurationService", "vs/editor/common/services/modelService", "vs/editor/test/browser/editorTestServices", "vs/workbench/services/textfile/common/textfiles", "vs/base/test/common/mock", "vs/base/common/event", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/core/position", "vs/editor/common/services/model", "vs/editor/common/core/editOperation", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/contrib/bulkEdit/browser/bulkEditService", "vs/platform/log/common/log", "vs/editor/common/services/resolverService", "vs/base/common/lifecycle", "vs/workbench/services/label/common/labelService", "vs/platform/theme/test/common/testThemeService", "vs/editor/common/services/editorWorker", "vs/platform/instantiation/common/serviceCollection", "vs/platform/configuration/common/configuration", "vs/editor/browser/services/codeEditorService", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/instantiation/common/instantiationService", "vs/editor/browser/services/bulkEditService", "vs/platform/instantiation/common/descriptors", "vs/platform/workspace/common/workspace", "vs/workbench/services/environment/common/environmentService", "vs/platform/label/common/label", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/undoRedo/common/undoRedoService", "vs/platform/dialogs/test/common/testDialogService", "vs/platform/dialogs/common/dialogs", "vs/platform/undoRedo/common/undoRedo", "vs/platform/notification/test/common/testNotificationService", "vs/platform/notification/common/notification", "vs/workbench/test/common/workbenchTestServices", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/resources", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/environment/common/environment", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/editor/test/common/modes/testLanguageConfigurationService", "vs/editor/common/services/languageService", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeaturesService", "vs/workbench/api/browser/mainThreadBulkEdits"], function (require, exports, assert, testRPCProtocol_1, testConfigurationService_1, modelService_1, editorTestServices_1, textfiles_1, mock_1, event_1, uri_1, range_1, position_1, model_1, editOperation_1, workbenchTestServices_1, bulkEditService_1, log_1, resolverService_1, lifecycle_1, labelService_1, testThemeService_1, editorWorker_1, serviceCollection_1, configuration_1, codeEditorService_1, files_1, editorGroupsService_1, editorService_1, instantiationService_1, bulkEditService_2, descriptors_1, workspace_1, environmentService_1, label_1, workingCopyFileService_1, undoRedoService_1, testDialogService_1, dialogs_1, undoRedo_1, testNotificationService_1, notification_1, workbenchTestServices_2, uriIdentity_1, resources_1, lifecycle_2, environment_1, panecomposite_1, testLanguageConfigurationService_1, languageService_1, languageFeatureDebounce_1, languageFeaturesService_1, mainThreadBulkEdits_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('MainThreadEditors', () => {
        let disposables;
        const resource = uri_1.URI.parse('foo:bar');
        let modelService;
        let bulkEdits;
        const movedResources = new Map();
        const copiedResources = new Map();
        const createdResources = new Set();
        const deletedResources = new Set();
        setup(() => {
            disposables = new lifecycle_1.DisposableStore();
            movedResources.clear();
            copiedResources.clear();
            createdResources.clear();
            deletedResources.clear();
            const configService = new testConfigurationService_1.TestConfigurationService();
            const dialogService = new testDialogService_1.TestDialogService();
            const notificationService = new testNotificationService_1.TestNotificationService();
            const undoRedoService = new undoRedoService_1.UndoRedoService(dialogService, notificationService);
            const themeService = new testThemeService_1.TestThemeService();
            const logService = new log_1.NullLogService();
            modelService = new modelService_1.ModelService(configService, new workbenchTestServices_2.TestTextResourcePropertiesService(configService), themeService, logService, undoRedoService, disposables.add(new languageService_1.LanguageService()), new testLanguageConfigurationService_1.TestLanguageConfigurationService(), new languageFeatureDebounce_1.LanguageFeatureDebounceService(logService), new languageFeaturesService_1.LanguageFeaturesService());
            const services = new serviceCollection_1.ServiceCollection();
            services.set(bulkEditService_2.IBulkEditService, new descriptors_1.SyncDescriptor(bulkEditService_1.BulkEditService));
            services.set(label_1.ILabelService, new descriptors_1.SyncDescriptor(labelService_1.LabelService));
            services.set(log_1.ILogService, new log_1.NullLogService());
            services.set(workspace_1.IWorkspaceContextService, new workbenchTestServices_2.TestContextService());
            services.set(environment_1.IEnvironmentService, workbenchTestServices_1.TestEnvironmentService);
            services.set(environmentService_1.IWorkbenchEnvironmentService, workbenchTestServices_1.TestEnvironmentService);
            services.set(configuration_1.IConfigurationService, configService);
            services.set(dialogs_1.IDialogService, dialogService);
            services.set(notification_1.INotificationService, notificationService);
            services.set(undoRedo_1.IUndoRedoService, undoRedoService);
            services.set(model_1.IModelService, modelService);
            services.set(codeEditorService_1.ICodeEditorService, new editorTestServices_1.TestCodeEditorService(themeService));
            services.set(files_1.IFileService, new workbenchTestServices_1.TestFileService());
            services.set(editorService_1.IEditorService, new workbenchTestServices_1.TestEditorService());
            services.set(lifecycle_2.ILifecycleService, new workbenchTestServices_1.TestLifecycleService());
            services.set(editorGroupsService_1.IEditorGroupsService, new workbenchTestServices_1.TestEditorGroupsService());
            services.set(textfiles_1.ITextFileService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.files = {
                        onDidSave: event_1.Event.None,
                        onDidRevert: event_1.Event.None,
                        onDidChangeDirty: event_1.Event.None
                    };
                }
                isDirty() { return false; }
                create(operations) {
                    for (const o of operations) {
                        createdResources.add(o.resource);
                    }
                    return Promise.resolve(Object.create(null));
                }
                async getEncodedReadable(resource, value) {
                    return undefined;
                }
            });
            services.set(workingCopyFileService_1.IWorkingCopyFileService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidRunWorkingCopyFileOperation = event_1.Event.None;
                }
                createFolder(operations) {
                    this.create(operations);
                }
                create(operations) {
                    for (const operation of operations) {
                        createdResources.add(operation.resource);
                    }
                    return Promise.resolve(Object.create(null));
                }
                move(operations) {
                    const { source, target } = operations[0].file;
                    movedResources.set(source, target);
                    return Promise.resolve(Object.create(null));
                }
                copy(operations) {
                    const { source, target } = operations[0].file;
                    copiedResources.set(source, target);
                    return Promise.resolve(Object.create(null));
                }
                delete(operations) {
                    for (const operation of operations) {
                        deletedResources.add(operation.resource);
                    }
                    return Promise.resolve(undefined);
                }
            });
            services.set(resolverService_1.ITextModelService, new class extends (0, mock_1.mock)() {
                createModelReference(resource) {
                    const textEditorModel = new class extends (0, mock_1.mock)() {
                        constructor() {
                            super(...arguments);
                            this.textEditorModel = modelService.getModel(resource);
                        }
                    };
                    textEditorModel.isReadonly = () => false;
                    return Promise.resolve(new lifecycle_1.ImmortalReference(textEditorModel));
                }
            });
            services.set(editorWorker_1.IEditorWorkerService, new class extends (0, mock_1.mock)() {
            });
            services.set(panecomposite_1.IPaneCompositePartService, new class extends (0, mock_1.mock)() {
                constructor() {
                    super(...arguments);
                    this.onDidPaneCompositeOpen = event_1.Event.None;
                    this.onDidPaneCompositeClose = event_1.Event.None;
                }
                getActivePaneComposite() {
                    return undefined;
                }
            });
            services.set(uriIdentity_1.IUriIdentityService, new class extends (0, mock_1.mock)() {
                get extUri() { return resources_1.extUri; }
            });
            const instaService = new instantiationService_1.InstantiationService(services);
            bulkEdits = instaService.createInstance(mainThreadBulkEdits_1.MainThreadBulkEdits, (0, testRPCProtocol_1.SingleProxyRPCProtocol)(null));
        });
        teardown(() => {
            disposables.dispose();
        });
        test(`applyWorkspaceEdit returns false if model is changed by user`, () => {
            let model = modelService.createModel('something', null, resource);
            let workspaceResourceEdit = {
                _type: 2 /* WorkspaceEditType.Text */,
                resource: resource,
                modelVersionId: model.getVersionId(),
                edit: {
                    text: 'asdfg',
                    range: new range_1.Range(1, 1, 1, 1)
                }
            };
            // Act as if the user edited the model
            model.applyEdits([editOperation_1.EditOperation.insert(new position_1.Position(0, 0), 'something')]);
            return bulkEdits.$tryApplyWorkspaceEdit({ edits: [workspaceResourceEdit] }).then((result) => {
                assert.strictEqual(result, false);
            });
        });
        test(`issue #54773: applyWorkspaceEdit checks model version in race situation`, () => {
            let model = modelService.createModel('something', null, resource);
            let workspaceResourceEdit1 = {
                _type: 2 /* WorkspaceEditType.Text */,
                resource: resource,
                modelVersionId: model.getVersionId(),
                edit: {
                    text: 'asdfg',
                    range: new range_1.Range(1, 1, 1, 1)
                }
            };
            let workspaceResourceEdit2 = {
                _type: 2 /* WorkspaceEditType.Text */,
                resource: resource,
                modelVersionId: model.getVersionId(),
                edit: {
                    text: 'asdfg',
                    range: new range_1.Range(1, 1, 1, 1)
                }
            };
            let p1 = bulkEdits.$tryApplyWorkspaceEdit({ edits: [workspaceResourceEdit1] }).then((result) => {
                // first edit request succeeds
                assert.strictEqual(result, true);
            });
            let p2 = bulkEdits.$tryApplyWorkspaceEdit({ edits: [workspaceResourceEdit2] }).then((result) => {
                // second edit request fails
                assert.strictEqual(result, false);
            });
            return Promise.all([p1, p2]);
        });
        test(`applyWorkspaceEdit with only resource edit`, () => {
            return bulkEdits.$tryApplyWorkspaceEdit({
                edits: [
                    { _type: 1 /* WorkspaceEditType.File */, oldUri: resource, newUri: resource, options: undefined },
                    { _type: 1 /* WorkspaceEditType.File */, oldUri: undefined, newUri: resource, options: undefined },
                    { _type: 1 /* WorkspaceEditType.File */, oldUri: resource, newUri: undefined, options: undefined }
                ]
            }).then((result) => {
                assert.strictEqual(result, true);
                assert.strictEqual(movedResources.get(resource), resource);
                assert.strictEqual(createdResources.has(resource), true);
                assert.strictEqual(deletedResources.has(resource), true);
            });
        });
    });
});
//# sourceMappingURL=mainThreadEditors.test.js.map