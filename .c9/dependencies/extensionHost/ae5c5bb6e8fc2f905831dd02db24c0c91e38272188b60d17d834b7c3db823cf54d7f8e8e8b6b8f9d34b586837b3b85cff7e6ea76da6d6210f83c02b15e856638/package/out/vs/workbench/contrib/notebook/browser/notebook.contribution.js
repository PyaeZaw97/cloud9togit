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
define(["require", "exports", "vs/base/common/network", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/jsonFormatter", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/contrib/notebook/browser/notebookEditor", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/browser/notebookServiceImpl", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/services/editor/common/editorService", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/workbench/contrib/notebook/browser/notebookDiffEditorInput", "vs/workbench/contrib/notebook/browser/diff/notebookTextDiffEditor", "vs/workbench/contrib/notebook/common/services/notebookWorkerService", "vs/workbench/contrib/notebook/browser/services/notebookWorkerServiceImpl", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService", "vs/workbench/contrib/notebook/browser/notebookCellStatusBarServiceImpl", "vs/workbench/contrib/notebook/browser/notebookEditorService", "vs/workbench/contrib/notebook/browser/notebookEditorServiceImpl", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/base/common/event", "vs/workbench/contrib/notebook/browser/diff/diffElementViewModel", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverServiceImpl", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/browser/notebookKernelServiceImpl", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/platform/configuration/common/configuration", "vs/platform/label/common/label", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/contrib/notebook/browser/notebookRendererMessagingServiceImpl", "vs/workbench/contrib/notebook/common/notebookRendererMessagingService", "vs/editor/common/config/editorOptions", "vs/workbench/contrib/notebook/browser/notebookExecutionStateServiceImpl", "vs/workbench/contrib/notebook/browser/notebookExecutionServiceImpl", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookKeymapService", "vs/workbench/contrib/notebook/browser/services/notebookKeymapServiceImpl", "vs/editor/common/languages/modesRegistry", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/editor/common/services/languageFeatures", "vs/workbench/contrib/comments/browser/commentReply", "vs/editor/browser/services/codeEditorService", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/controller/insertCellActions", "vs/workbench/contrib/notebook/browser/controller/executeActions", "vs/workbench/contrib/notebook/browser/controller/layoutActions", "vs/workbench/contrib/notebook/browser/controller/editActions", "vs/workbench/contrib/notebook/browser/controller/apiActions", "vs/workbench/contrib/notebook/browser/controller/foldingController", "vs/workbench/contrib/notebook/browser/contrib/clipboard/notebookClipboard", "vs/workbench/contrib/notebook/browser/contrib/find/notebookFind", "vs/workbench/contrib/notebook/browser/contrib/format/formatting", "vs/workbench/contrib/notebook/browser/contrib/gettingStarted/notebookGettingStarted", "vs/workbench/contrib/notebook/browser/contrib/layout/layoutActions", "vs/workbench/contrib/notebook/browser/contrib/marker/markerProvider", "vs/workbench/contrib/notebook/browser/contrib/navigation/arrow", "vs/workbench/contrib/notebook/browser/contrib/outline/notebookOutline", "vs/workbench/contrib/notebook/browser/contrib/profile/notebookProfile", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/statusBarProviders", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/contributedStatusBarItemController", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/executionStatusBarItemController", "vs/workbench/contrib/notebook/browser/contrib/editorStatusBar/editorStatusBar", "vs/workbench/contrib/notebook/browser/contrib/undoRedo/notebookUndoRedo", "vs/workbench/contrib/notebook/browser/contrib/cellCommands/cellCommands", "vs/workbench/contrib/notebook/browser/contrib/viewportCustomMarkdown/viewportCustomMarkdown", "vs/workbench/contrib/notebook/browser/contrib/troubleshoot/layout", "vs/workbench/contrib/notebook/browser/contrib/breakpoints/notebookBreakpoints", "vs/workbench/contrib/notebook/browser/contrib/execute/executionEditorProgress", "vs/workbench/contrib/notebook/browser/diff/notebookDiffActions"], function (require, exports, network_1, lifecycle_1, marshalling_1, resources_1, types_1, uri_1, jsonFormatter_1, model_1, language_1, resolverService_1, nls, configurationRegistry_1, descriptors_1, extensions_1, instantiation_1, platform_1, editor_1, contributions_1, editor_2, notebookEditor_1, notebookEditorInput_1, notebookService_1, notebookServiceImpl_1, notebookCommon_1, editorService_1, undoRedo_1, notebookEditorModelResolverService_1, notebookDiffEditorInput_1, notebookTextDiffEditor_1, notebookWorkerService_1, notebookWorkerServiceImpl_1, notebookCellStatusBarService_1, notebookCellStatusBarServiceImpl_1, notebookEditorService_1, notebookEditorServiceImpl_1, jsonContributionRegistry_1, event_1, diffElementViewModel_1, notebookEditorModelResolverServiceImpl_1, notebookKernelService_1, notebookKernelServiceImpl_1, extensions_2, workingCopyEditorService_1, configuration_1, label_1, workingCopyBackup_1, editorGroupsService_1, notebookRendererMessagingServiceImpl_1, notebookRendererMessagingService_1, editorOptions_1, notebookExecutionStateServiceImpl_1, notebookExecutionServiceImpl_1, notebookExecutionService_1, notebookKeymapService_1, notebookKeymapServiceImpl_1, modesRegistry_1, notebookExecutionStateService_1, languageFeatures_1, commentReply_1, codeEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookContribution = void 0;
    /*--------------------------------------------------------------------------------------------- */
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(notebookEditor_1.NotebookEditor, notebookEditor_1.NotebookEditor.ID, 'Notebook Editor'), [
        new descriptors_1.SyncDescriptor(notebookEditorInput_1.NotebookEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(notebookTextDiffEditor_1.NotebookTextDiffEditor, notebookTextDiffEditor_1.NotebookTextDiffEditor.ID, 'Notebook Diff Editor'), [
        new descriptors_1.SyncDescriptor(notebookDiffEditorInput_1.NotebookDiffEditorInput)
    ]);
    class NotebookDiffEditorSerializer {
        canSerialize() {
            return true;
        }
        serialize(input) {
            (0, types_1.assertType)(input instanceof notebookDiffEditorInput_1.NotebookDiffEditorInput);
            return JSON.stringify({
                resource: input.resource,
                originalResource: input.original.resource,
                name: input.getName(),
                originalName: input.original.getName(),
                textDiffName: input.getName(),
                viewType: input.viewType,
            });
        }
        deserialize(instantiationService, raw) {
            const data = (0, marshalling_1.parse)(raw);
            if (!data) {
                return undefined;
            }
            const { resource, originalResource, name, viewType } = data;
            if (!data || !uri_1.URI.isUri(resource) || !uri_1.URI.isUri(originalResource) || typeof name !== 'string' || typeof viewType !== 'string') {
                return undefined;
            }
            const input = notebookDiffEditorInput_1.NotebookDiffEditorInput.create(instantiationService, resource, name, undefined, originalResource, viewType);
            return input;
        }
        static canResolveBackup(editorInput, backupResource) {
            return false;
        }
    }
    class NotebookEditorSerializer {
        canSerialize() {
            return true;
        }
        serialize(input) {
            (0, types_1.assertType)(input instanceof notebookEditorInput_1.NotebookEditorInput);
            const data = {
                resource: input.resource,
                viewType: input.viewType,
                options: input.options
            };
            return JSON.stringify(data);
        }
        deserialize(instantiationService, raw) {
            const data = (0, marshalling_1.parse)(raw);
            if (!data) {
                return undefined;
            }
            const { resource, viewType, options } = data;
            if (!data || !uri_1.URI.isUri(resource) || typeof viewType !== 'string') {
                return undefined;
            }
            const input = notebookEditorInput_1.NotebookEditorInput.create(instantiationService, resource, viewType, options);
            return input;
        }
    }
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(notebookEditorInput_1.NotebookEditorInput.ID, NotebookEditorSerializer);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(notebookDiffEditorInput_1.NotebookDiffEditorInput.ID, NotebookDiffEditorSerializer);
    let NotebookContribution = class NotebookContribution extends lifecycle_1.Disposable {
        constructor(undoRedoService, configurationService, codeEditorService) {
            super();
            this.codeEditorService = codeEditorService;
            this.updateCellUndoRedoComparisonKey(configurationService, undoRedoService);
            // Watch for changes to undoRedoPerCell setting
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(notebookCommon_1.NotebookSetting.undoRedoPerCell)) {
                    this.updateCellUndoRedoComparisonKey(configurationService, undoRedoService);
                }
            }));
            // register comment decoration
            this.codeEditorService.registerDecorationType('comment-controller', commentReply_1.COMMENTEDITOR_DECORATION_KEY, {});
        }
        // Add or remove the cell undo redo comparison key based on the user setting
        updateCellUndoRedoComparisonKey(configurationService, undoRedoService) {
            var _a;
            const undoRedoPerCell = configurationService.getValue(notebookCommon_1.NotebookSetting.undoRedoPerCell);
            if (!undoRedoPerCell) {
                // Add comparison key to map cell => main document
                if (!this._uriComparisonKeyComputer) {
                    this._uriComparisonKeyComputer = undoRedoService.registerUriComparisonKeyComputer(notebookCommon_1.CellUri.scheme, {
                        getComparisonKey: (uri) => {
                            if (undoRedoPerCell) {
                                return uri.toString();
                            }
                            return NotebookContribution._getCellUndoRedoComparisonKey(uri);
                        }
                    });
                }
            }
            else {
                // Dispose comparison key
                (_a = this._uriComparisonKeyComputer) === null || _a === void 0 ? void 0 : _a.dispose();
                this._uriComparisonKeyComputer = undefined;
            }
        }
        static _getCellUndoRedoComparisonKey(uri) {
            const data = notebookCommon_1.CellUri.parse(uri);
            if (!data) {
                return uri.toString();
            }
            return data.notebook.toString();
        }
        dispose() {
            var _a;
            super.dispose();
            (_a = this._uriComparisonKeyComputer) === null || _a === void 0 ? void 0 : _a.dispose();
        }
    };
    NotebookContribution = __decorate([
        __param(0, undoRedo_1.IUndoRedoService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, codeEditorService_1.ICodeEditorService)
    ], NotebookContribution);
    exports.NotebookContribution = NotebookContribution;
    let CellContentProvider = class CellContentProvider {
        constructor(textModelService, _modelService, _languageService, _notebookModelResolverService) {
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._notebookModelResolverService = _notebookModelResolverService;
            this._registration = textModelService.registerTextModelContentProvider(notebookCommon_1.CellUri.scheme, this);
        }
        dispose() {
            this._registration.dispose();
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            const data = notebookCommon_1.CellUri.parse(resource);
            // const data = parseCellUri(resource);
            if (!data) {
                return null;
            }
            const ref = await this._notebookModelResolverService.resolve(data.notebook);
            let result = null;
            for (const cell of ref.object.notebook.cells) {
                if (cell.uri.toString() === resource.toString()) {
                    const bufferFactory = {
                        create: (defaultEOL) => {
                            const newEOL = (defaultEOL === 2 /* DefaultEndOfLine.CRLF */ ? '\r\n' : '\n');
                            cell.textBuffer.setEOL(newEOL);
                            return { textBuffer: cell.textBuffer, disposable: lifecycle_1.Disposable.None };
                        },
                        getFirstLineText: (limit) => {
                            return cell.textBuffer.getLineContent(1).substring(0, limit);
                        }
                    };
                    const languageId = this._languageService.getLanguageIdByLanguageName(cell.language);
                    const languageSelection = languageId ? this._languageService.createById(languageId) : (cell.cellKind === notebookCommon_1.CellKind.Markup ? this._languageService.createById('markdown') : this._languageService.createByFilepathOrFirstLine(resource, cell.textBuffer.getLineContent(1)));
                    result = this._modelService.createModel(bufferFactory, languageSelection, resource);
                    break;
                }
            }
            if (!result) {
                ref.dispose();
                return null;
            }
            const once = event_1.Event.any(result.onWillDispose, ref.object.notebook.onWillDispose)(() => {
                once.dispose();
                ref.dispose();
            });
            return result;
        }
    };
    CellContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService),
        __param(3, notebookEditorModelResolverService_1.INotebookEditorModelResolverService)
    ], CellContentProvider);
    let CellInfoContentProvider = class CellInfoContentProvider {
        constructor(textModelService, _modelService, _languageService, _labelService, _notebookModelResolverService) {
            this._modelService = _modelService;
            this._languageService = _languageService;
            this._labelService = _labelService;
            this._notebookModelResolverService = _notebookModelResolverService;
            this._disposables = [];
            this._disposables.push(textModelService.registerTextModelContentProvider(network_1.Schemas.vscodeNotebookCellMetadata, {
                provideTextContent: this.provideMetadataTextContent.bind(this)
            }));
            this._disposables.push(textModelService.registerTextModelContentProvider(network_1.Schemas.vscodeNotebookCellOutput, {
                provideTextContent: this.provideOutputTextContent.bind(this)
            }));
            this._disposables.push(this._labelService.registerFormatter({
                scheme: network_1.Schemas.vscodeNotebookCellMetadata,
                formatting: {
                    label: '${path} (metadata)',
                    separator: '/'
                }
            }));
            this._disposables.push(this._labelService.registerFormatter({
                scheme: network_1.Schemas.vscodeNotebookCellOutput,
                formatting: {
                    label: '${path} (output)',
                    separator: '/'
                }
            }));
        }
        dispose() {
            (0, lifecycle_1.dispose)(this._disposables);
        }
        async provideMetadataTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            const data = notebookCommon_1.CellUri.parseCellUri(resource, network_1.Schemas.vscodeNotebookCellMetadata);
            if (!data) {
                return null;
            }
            const ref = await this._notebookModelResolverService.resolve(data.notebook);
            let result = null;
            const mode = this._languageService.createById('json');
            for (const cell of ref.object.notebook.cells) {
                if (cell.handle === data.handle) {
                    const metadataSource = (0, diffElementViewModel_1.getFormattedMetadataJSON)(ref.object.notebook, cell.metadata, cell.language);
                    result = this._modelService.createModel(metadataSource, mode, resource);
                    break;
                }
            }
            if (!result) {
                ref.dispose();
                return null;
            }
            const once = result.onWillDispose(() => {
                once.dispose();
                ref.dispose();
            });
            return result;
        }
        parseStreamOutput(op) {
            if (!op) {
                return;
            }
            const streamOutputData = (0, diffElementViewModel_1.getStreamOutputData)(op.outputs);
            if (streamOutputData) {
                return {
                    content: streamOutputData,
                    mode: this._languageService.createById(modesRegistry_1.PLAINTEXT_LANGUAGE_ID)
                };
            }
            return;
        }
        _getResult(data, cell) {
            let result = undefined;
            const mode = this._languageService.createById('json');
            const op = cell.outputs.find(op => op.outputId === data.outputId);
            const streamOutputData = this.parseStreamOutput(op);
            if (streamOutputData) {
                result = streamOutputData;
                return result;
            }
            const obj = cell.outputs.map(output => ({
                metadata: output.metadata,
                outputItems: output.outputs.map(opit => ({
                    mimeType: opit.mime,
                    data: opit.data.toString()
                }))
            }));
            const outputSource = (0, jsonFormatter_1.toFormattedString)(obj, {});
            result = {
                content: outputSource,
                mode
            };
            return result;
        }
        async provideOutputTextContent(resource) {
            var _a, _b;
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            const data = notebookCommon_1.CellUri.parseCellOutputUri(resource);
            if (!data) {
                return null;
            }
            const ref = await this._notebookModelResolverService.resolve(data.notebook);
            const cell = ref.object.notebook.cells.find(cell => !!cell.outputs.find(op => op.outputId === data.outputId));
            if (!cell) {
                ref.dispose();
                return null;
            }
            const result = this._getResult(data, cell);
            if (!result) {
                ref.dispose();
                return null;
            }
            const model = this._modelService.createModel(result.content, result.mode, resource);
            const cellModelListener = event_1.Event.any((_a = cell.onDidChangeOutputs) !== null && _a !== void 0 ? _a : event_1.Event.None, (_b = cell.onDidChangeOutputItems) !== null && _b !== void 0 ? _b : event_1.Event.None)(() => {
                const newResult = this._getResult(data, cell);
                if (!newResult) {
                    return;
                }
                model.setValue(newResult.content);
                model.setMode(newResult.mode.languageId);
            });
            const once = model.onWillDispose(() => {
                once.dispose();
                cellModelListener.dispose();
                ref.dispose();
            });
            return model;
        }
    };
    CellInfoContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService),
        __param(2, language_1.ILanguageService),
        __param(3, label_1.ILabelService),
        __param(4, notebookEditorModelResolverService_1.INotebookEditorModelResolverService)
    ], CellInfoContentProvider);
    class RegisterSchemasContribution extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.registerMetadataSchemas();
        }
        registerMetadataSchemas() {
            const jsonRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
            const metadataSchema = {
                properties: {
                    ['language']: {
                        type: 'string',
                        description: 'The language for the cell'
                    }
                },
                // patternProperties: allSettings.patternProperties,
                additionalProperties: true,
                allowTrailingCommas: true,
                allowComments: true
            };
            jsonRegistry.registerSchema('vscode://schemas/notebook/cellmetadata', metadataSchema);
        }
    }
    let NotebookEditorManager = class NotebookEditorManager {
        constructor(_editorService, _notebookEditorModelService, notebookService, editorGroups) {
            this._editorService = _editorService;
            this._notebookEditorModelService = _notebookEditorModelService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._disposables.add(event_1.Event.debounce(this._notebookEditorModelService.onDidChangeDirty, (last, current) => !last ? [current] : [...last, current], 100)(this._openMissingDirtyNotebookEditors, this));
            // CLOSE notebook editor for models that have no more serializer
            this._disposables.add(notebookService.onWillRemoveViewType(e => {
                for (const group of editorGroups.groups) {
                    const staleInputs = group.editors.filter(input => input instanceof notebookEditorInput_1.NotebookEditorInput && input.viewType === e);
                    group.closeEditors(staleInputs);
                }
            }));
            // CLOSE editors when we are about to open conflicting notebooks
            this._disposables.add(_notebookEditorModelService.onWillFailWithConflict(e => {
                for (const group of editorGroups.groups) {
                    const conflictInputs = group.editors.filter(input => input instanceof notebookEditorInput_1.NotebookEditorInput && input.viewType !== e.viewType && (0, resources_1.isEqual)(input.resource, e.resource));
                    const p = group.closeEditors(conflictInputs);
                    e.waitUntil(p);
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
        }
        _openMissingDirtyNotebookEditors(models) {
            const result = [];
            for (const model of models) {
                if (model.isDirty() && !this._editorService.isOpened({ resource: model.resource, typeId: notebookEditorInput_1.NotebookEditorInput.ID, editorId: model.viewType }) && model.resource.scheme !== network_1.Schemas.vscodeInteractive) {
                    result.push({
                        resource: model.resource,
                        options: { inactive: true, preserveFocus: true, pinned: true, override: model.viewType }
                    });
                }
            }
            if (result.length > 0) {
                this._editorService.openEditors(result);
            }
        }
    };
    NotebookEditorManager = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, notebookEditorModelResolverService_1.INotebookEditorModelResolverService),
        __param(2, notebookService_1.INotebookService),
        __param(3, editorGroupsService_1.IEditorGroupsService)
    ], NotebookEditorManager);
    let SimpleNotebookWorkingCopyEditorHandler = class SimpleNotebookWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        constructor(_instantiationService, _workingCopyEditorService, _extensionService) {
            super();
            this._instantiationService = _instantiationService;
            this._workingCopyEditorService = _workingCopyEditorService;
            this._extensionService = _extensionService;
            this._installHandler();
        }
        async _installHandler() {
            await this._extensionService.whenInstalledExtensionsRegistered();
            this._register(this._workingCopyEditorService.registerHandler({
                handles: workingCopy => typeof this._getViewType(workingCopy) === 'string',
                isOpen: (workingCopy, editor) => editor instanceof notebookEditorInput_1.NotebookEditorInput && editor.viewType === this._getViewType(workingCopy) && (0, resources_1.isEqual)(workingCopy.resource, editor.resource),
                createEditor: workingCopy => notebookEditorInput_1.NotebookEditorInput.create(this._instantiationService, workingCopy.resource, this._getViewType(workingCopy))
            }));
        }
        _getViewType(workingCopy) {
            return notebookCommon_1.NotebookWorkingCopyTypeIdentifier.parse(workingCopy.typeId);
        }
    };
    SimpleNotebookWorkingCopyEditorHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(2, extensions_2.IExtensionService)
    ], SimpleNotebookWorkingCopyEditorHandler);
    let ComplexNotebookWorkingCopyEditorHandler = class ComplexNotebookWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        constructor(_instantiationService, _workingCopyEditorService, _extensionService, _workingCopyBackupService) {
            super();
            this._instantiationService = _instantiationService;
            this._workingCopyEditorService = _workingCopyEditorService;
            this._extensionService = _extensionService;
            this._workingCopyBackupService = _workingCopyBackupService;
            this._installHandler();
        }
        async _installHandler() {
            await this._extensionService.whenInstalledExtensionsRegistered();
            this._register(this._workingCopyEditorService.registerHandler({
                handles: workingCopy => workingCopy.resource.scheme === network_1.Schemas.vscodeNotebook,
                isOpen: (workingCopy, editor) => {
                    if ((0, notebookEditorInput_1.isCompositeNotebookEditorInput)(editor)) {
                        return !!editor.editorInputs.find(input => (0, resources_1.isEqual)(uri_1.URI.from({ scheme: network_1.Schemas.vscodeNotebook, path: input.resource.toString() }), workingCopy.resource));
                    }
                    return editor instanceof notebookEditorInput_1.NotebookEditorInput && (0, resources_1.isEqual)(uri_1.URI.from({ scheme: network_1.Schemas.vscodeNotebook, path: editor.resource.toString() }), workingCopy.resource);
                },
                createEditor: async (workingCopy) => {
                    // TODO this is really bad and should adopt the `typeId`
                    // for backups instead of storing that information in the
                    // backup.
                    // But since complex notebooks are deprecated, not worth
                    // pushing for it and should eventually delete this code
                    // entirely.
                    const backup = await this._workingCopyBackupService.resolve(workingCopy);
                    if (!(backup === null || backup === void 0 ? void 0 : backup.meta)) {
                        throw new Error(`No backup found for Notebook editor: ${workingCopy.resource}`);
                    }
                    return notebookEditorInput_1.NotebookEditorInput.create(this._instantiationService, workingCopy.resource, backup.meta.viewType, { startDirty: true });
                }
            }));
        }
    };
    ComplexNotebookWorkingCopyEditorHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workingCopyEditorService_1.IWorkingCopyEditorService),
        __param(2, extensions_2.IExtensionService),
        __param(3, workingCopyBackup_1.IWorkingCopyBackupService)
    ], ComplexNotebookWorkingCopyEditorHandler);
    let NotebookLanguageSelectorScoreRefine = class NotebookLanguageSelectorScoreRefine {
        constructor(_notebookService, languageFeaturesService) {
            this._notebookService = _notebookService;
            languageFeaturesService.setNotebookTypeResolver(this._getNotebookInfo.bind(this));
        }
        _getNotebookInfo(uri) {
            const cellUri = notebookCommon_1.CellUri.parse(uri);
            if (!cellUri) {
                return undefined;
            }
            const notebook = this._notebookService.getNotebookTextModel(cellUri.notebook);
            if (!notebook) {
                return undefined;
            }
            return {
                uri: notebook.uri,
                type: notebook.viewType
            };
        }
    };
    NotebookLanguageSelectorScoreRefine = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, languageFeatures_1.ILanguageFeaturesService)
    ], NotebookLanguageSelectorScoreRefine);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(NotebookContribution, 1 /* LifecyclePhase.Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(CellContentProvider, 1 /* LifecyclePhase.Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(CellInfoContentProvider, 1 /* LifecyclePhase.Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(RegisterSchemasContribution, 1 /* LifecyclePhase.Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(NotebookEditorManager, 2 /* LifecyclePhase.Ready */);
    workbenchContributionsRegistry.registerWorkbenchContribution(NotebookLanguageSelectorScoreRefine, 2 /* LifecyclePhase.Ready */);
    workbenchContributionsRegistry.registerWorkbenchContribution(SimpleNotebookWorkingCopyEditorHandler, 2 /* LifecyclePhase.Ready */);
    workbenchContributionsRegistry.registerWorkbenchContribution(ComplexNotebookWorkingCopyEditorHandler, 2 /* LifecyclePhase.Ready */);
    (0, extensions_1.registerSingleton)(notebookService_1.INotebookService, notebookServiceImpl_1.NotebookService);
    (0, extensions_1.registerSingleton)(notebookWorkerService_1.INotebookEditorWorkerService, notebookWorkerServiceImpl_1.NotebookEditorWorkerServiceImpl);
    (0, extensions_1.registerSingleton)(notebookEditorModelResolverService_1.INotebookEditorModelResolverService, notebookEditorModelResolverServiceImpl_1.NotebookModelResolverServiceImpl, true);
    (0, extensions_1.registerSingleton)(notebookCellStatusBarService_1.INotebookCellStatusBarService, notebookCellStatusBarServiceImpl_1.NotebookCellStatusBarService, true);
    (0, extensions_1.registerSingleton)(notebookEditorService_1.INotebookEditorService, notebookEditorServiceImpl_1.NotebookEditorWidgetService, true);
    (0, extensions_1.registerSingleton)(notebookKernelService_1.INotebookKernelService, notebookKernelServiceImpl_1.NotebookKernelService, true);
    (0, extensions_1.registerSingleton)(notebookExecutionService_1.INotebookExecutionService, notebookExecutionServiceImpl_1.NotebookExecutionService, true);
    (0, extensions_1.registerSingleton)(notebookExecutionStateService_1.INotebookExecutionStateService, notebookExecutionStateServiceImpl_1.NotebookExecutionStateService, true);
    (0, extensions_1.registerSingleton)(notebookRendererMessagingService_1.INotebookRendererMessagingService, notebookRendererMessagingServiceImpl_1.NotebookRendererMessagingService, true);
    (0, extensions_1.registerSingleton)(notebookKeymapService_1.INotebookKeymapService, notebookKeymapServiceImpl_1.NotebookKeymapService, true);
    const schemas = {};
    function isConfigurationPropertySchema(x) {
        return (typeof x.type !== 'undefined' || typeof x.anyOf !== 'undefined');
    }
    for (const editorOption of editorOptions_1.editorOptionsRegistry) {
        const schema = editorOption.schema;
        if (schema) {
            if (isConfigurationPropertySchema(schema)) {
                schemas[`editor.${editorOption.name}`] = schema;
            }
            else {
                for (const key in schema) {
                    if (Object.hasOwnProperty.call(schema, key)) {
                        schemas[key] = schema[key];
                    }
                }
            }
        }
    }
    const editorOptionsCustomizationSchema = {
        description: nls.localize('notebook.editorOptions.experimentalCustomization', 'Settings for code editors used in notebooks. This can be used to customize most editor.* settings.'),
        default: {},
        allOf: [
            {
                properties: schemas,
            }
            // , {
            // 	patternProperties: {
            // 		'^\\[.*\\]$': {
            // 			type: 'object',
            // 			default: {},
            // 			properties: schemas
            // 		}
            // 	}
            // }
        ],
        tags: ['notebookLayout']
    };
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'notebook',
        order: 100,
        title: nls.localize('notebookConfigurationTitle', "Notebook"),
        type: 'object',
        properties: {
            [notebookCommon_1.NotebookSetting.displayOrder]: {
                description: nls.localize('notebook.displayOrder.description', "Priority list for output mime types"),
                type: 'array',
                items: {
                    type: 'string'
                },
                default: []
            },
            [notebookCommon_1.NotebookSetting.cellToolbarLocation]: {
                description: nls.localize('notebook.cellToolbarLocation.description', "Where the cell toolbar should be shown, or whether it should be hidden."),
                type: 'object',
                additionalProperties: {
                    markdownDescription: nls.localize('notebook.cellToolbarLocation.viewType', "Configure the cell toolbar position for for specific file types"),
                    type: 'string',
                    enum: ['left', 'right', 'hidden']
                },
                default: {
                    'default': 'right'
                },
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.showCellStatusBar]: {
                description: nls.localize('notebook.showCellStatusbar.description', "Whether the cell status bar should be shown."),
                type: 'string',
                enum: ['hidden', 'visible', 'visibleAfterExecute'],
                enumDescriptions: [
                    nls.localize('notebook.showCellStatusbar.hidden.description', "The cell Status bar is always hidden."),
                    nls.localize('notebook.showCellStatusbar.visible.description', "The cell Status bar is always visible."),
                    nls.localize('notebook.showCellStatusbar.visibleAfterExecute.description', "The cell Status bar is hidden until the cell has executed. Then it becomes visible to show the execution status.")
                ],
                default: 'visible',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.textDiffEditorPreview]: {
                description: nls.localize('notebook.diff.enablePreview.description', "Whether to use the enhanced text diff editor for notebook."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.cellToolbarVisibility]: {
                markdownDescription: nls.localize('notebook.cellToolbarVisibility.description', "Whether the cell toolbar should appear on hover or click."),
                type: 'string',
                enum: ['hover', 'click'],
                default: 'click',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.undoRedoPerCell]: {
                description: nls.localize('notebook.undoRedoPerCell.description', "Whether to use separate undo/redo stack for each cell."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.compactView]: {
                description: nls.localize('notebook.compactView.description', "Control whether the notebook editor should be rendered in a compact form. For example, when turned on, it will decrease the left margin width."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.focusIndicator]: {
                description: nls.localize('notebook.focusIndicator.description', "Controls where the focus indicator is rendered, either along the cell borders or on the left gutter"),
                type: 'string',
                enum: ['border', 'gutter'],
                default: 'gutter',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.insertToolbarLocation]: {
                description: nls.localize('notebook.insertToolbarPosition.description', "Control where the insert cell actions should appear."),
                type: 'string',
                enum: ['betweenCells', 'notebookToolbar', 'both', 'hidden'],
                enumDescriptions: [
                    nls.localize('insertToolbarLocation.betweenCells', "A toolbar that appears on hover between cells."),
                    nls.localize('insertToolbarLocation.notebookToolbar', "The toolbar at the top of the notebook editor."),
                    nls.localize('insertToolbarLocation.both', "Both toolbars."),
                    nls.localize('insertToolbarLocation.hidden', "The insert actions don't appear anywhere."),
                ],
                default: 'both',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.globalToolbar]: {
                description: nls.localize('notebook.globalToolbar.description', "Control whether to render a global toolbar inside the notebook editor."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.consolidatedOutputButton]: {
                description: nls.localize('notebook.consolidatedOutputButton.description', "Control whether outputs action should be rendered in the output toolbar."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.showFoldingControls]: {
                description: nls.localize('notebook.showFoldingControls.description', "Controls when the Markdown header folding arrow is shown."),
                type: 'string',
                enum: ['always', 'mouseover'],
                enumDescriptions: [
                    nls.localize('showFoldingControls.always', "The folding controls are always visible."),
                    nls.localize('showFoldingControls.mouseover', "The folding controls are visible only on mouseover."),
                ],
                default: 'mouseover',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.dragAndDropEnabled]: {
                description: nls.localize('notebook.dragAndDrop.description', "Control whether the notebook editor should allow moving cells through drag and drop."),
                type: 'boolean',
                default: true,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.consolidatedRunButton]: {
                description: nls.localize('notebook.consolidatedRunButton.description', "Control whether extra actions are shown in a dropdown next to the run button."),
                type: 'boolean',
                default: false,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.globalToolbarShowLabel]: {
                description: nls.localize('notebook.globalToolbarShowLabel', "Control whether the actions on the notebook toolbar should render label or not."),
                type: 'string',
                enum: ['always', 'never', 'dynamic'],
                default: 'always',
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.textOutputLineLimit]: {
                description: nls.localize('notebook.textOutputLineLimit', "Control how many lines of text in a text output is rendered."),
                type: 'number',
                default: 30,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.markupFontSize]: {
                markdownDescription: nls.localize('notebook.markup.fontSize', "Controls the font size in pixels of rendered markup in notebooks. When set to `0`, 120% of `#editor.fontSize#` is used."),
                type: 'number',
                default: 0,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.cellEditorOptionsCustomizations]: editorOptionsCustomizationSchema,
            [notebookCommon_1.NotebookSetting.interactiveWindowCollapseCodeCells]: {
                markdownDescription: nls.localize('notebook.interactiveWindow.collapseCodeCells', "Controls whether code cells in the interactive window are collapsed by default."),
                type: 'string',
                enum: ['always', 'never', 'fromEditor'],
                default: 'fromEditor'
            },
            [notebookCommon_1.NotebookSetting.outputLineHeight]: {
                markdownDescription: nls.localize('notebook.outputLineHeight', "Line height of the output text for notebook cells.\n - Values between 0 and 8 will be used as a multiplier with the font size.\n - Values greater than or equal to 8 will be used as effective values."),
                type: 'number',
                default: 22,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.outputFontSize]: {
                markdownDescription: nls.localize('notebook.outputFontSize', "Font size for the output text for notebook cells. When set to 0 `#editor.fontSize#` is used."),
                type: 'number',
                default: 0,
                tags: ['notebookLayout']
            },
            [notebookCommon_1.NotebookSetting.outputFontFamily]: {
                markdownDescription: nls.localize('notebook.outputFontFamily', "The font family for the output text for notebook cells. When set to empty, the `#editor.fontFamily#` is used."),
                type: 'string',
                tags: ['notebookLayout']
            },
        }
    });
});
//# sourceMappingURL=notebook.contribution.js.map