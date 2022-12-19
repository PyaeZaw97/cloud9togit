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
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/lifecycle", "vs/base/common/marshalling", "vs/base/common/network", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/editOperation", "vs/editor/common/languages/modesRegistry", "vs/editor/common/services/model", "vs/editor/common/services/resolverService", "vs/editor/contrib/peekView/browser/peekView", "vs/editor/contrib/suggest/browser/suggest", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/editor/common/editor", "vs/platform/extensions/common/extensions", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/common/theme", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/contrib/interactive/browser/interactiveCommon", "vs/workbench/contrib/interactive/browser/interactiveDocumentService", "vs/workbench/contrib/interactive/browser/interactiveEditor", "vs/workbench/contrib/interactive/browser/interactiveEditorInput", "vs/workbench/contrib/interactive/browser/interactiveHistoryService", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/editor/common/editorService"], function (require, exports, buffer_1, lifecycle_1, marshalling_1, network_1, strings_1, types_1, uri_1, bulkEditService_1, editOperation_1, modesRegistry_1, model_1, resolverService_1, peekView_1, suggest_1, nls_1, actions_1, contextkey_1, editor_1, extensions_1, descriptors_1, extensions_2, instantiation_1, platform_1, colorRegistry_1, themeService_1, editor_2, contributions_1, editor_3, theme_1, bulkCellEdits_1, interactiveCommon_1, interactiveDocumentService_1, interactiveEditor_1, interactiveEditorInput_1, interactiveHistoryService_1, coreActions_1, icons, notebookCommon_1, notebookKernelService_1, notebookService_1, editorGroupColumn_1, editorGroupsService_1, editorResolverService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveEditorSerializer = exports.InteractiveDocumentContribution = void 0;
    platform_1.Registry.as(editor_3.EditorExtensions.EditorPane).registerEditorPane(editor_2.EditorPaneDescriptor.create(interactiveEditor_1.InteractiveEditor, interactiveEditor_1.InteractiveEditor.ID, 'Interactive Window'), [
        new descriptors_1.SyncDescriptor(interactiveEditorInput_1.InteractiveEditorInput)
    ]);
    let InteractiveDocumentContribution = class InteractiveDocumentContribution extends lifecycle_1.Disposable {
        constructor(notebookService, editorResolverService, editorService) {
            super();
            const contentOptions = {
                transientOutputs: true,
                transientCellMetadata: {},
                transientDocumentMetadata: {}
            };
            const controller = {
                get options() {
                    return contentOptions;
                },
                set options(newOptions) {
                    contentOptions.transientCellMetadata = newOptions.transientCellMetadata;
                    contentOptions.transientDocumentMetadata = newOptions.transientDocumentMetadata;
                    contentOptions.transientOutputs = newOptions.transientOutputs;
                },
                open: async (_uri, _backupId, _untitledDocumentData, _token) => {
                    if (_backupId instanceof buffer_1.VSBuffer) {
                        const backup = _backupId.toString();
                        try {
                            const document = JSON.parse(backup);
                            return {
                                data: {
                                    metadata: {},
                                    cells: document.cells.map(cell => ({
                                        source: cell.content,
                                        language: cell.language,
                                        cellKind: cell.kind,
                                        mime: cell.mime,
                                        outputs: cell.outputs
                                            ? cell.outputs.map(output => ({
                                                outputId: output.outputId,
                                                outputs: output.outputs.map(ot => ({
                                                    mime: ot.mime,
                                                    data: ot.data
                                                }))
                                            }))
                                            : [],
                                        metadata: cell.metadata
                                    }))
                                },
                                transientOptions: contentOptions
                            };
                        }
                        catch (_e) { }
                    }
                    return {
                        data: {
                            metadata: {},
                            cells: []
                        },
                        transientOptions: contentOptions
                    };
                },
                save: async (uri) => {
                    // trigger backup always
                    return false;
                },
                saveAs: async (uri, target, token) => {
                    // return this._proxy.$saveNotebookAs(viewType, uri, target, token);
                    return false;
                },
                backup: async (uri, token) => {
                    const doc = notebookService.listNotebookDocuments().find(document => document.uri.toString() === uri.toString());
                    if (doc) {
                        const cells = doc.cells.map(cell => ({
                            kind: cell.cellKind,
                            language: cell.language,
                            metadata: cell.metadata,
                            mine: cell.mime,
                            outputs: cell.outputs.map(output => {
                                return {
                                    outputId: output.outputId,
                                    outputs: output.outputs.map(ot => ({
                                        mime: ot.mime,
                                        data: ot.data
                                    }))
                                };
                            }),
                            content: cell.getValue()
                        }));
                        const buffer = buffer_1.VSBuffer.fromString(JSON.stringify({
                            cells: cells
                        }));
                        return buffer;
                    }
                    else {
                        return '';
                    }
                }
            };
            this._register(notebookService.registerNotebookController('interactive', {
                id: new extensions_1.ExtensionIdentifier('interactive.builtin'),
                location: undefined
            }, controller));
            const info = notebookService.getContributedNotebookType('interactive');
            if (info) {
                info.update({ selectors: ['*.interactive'] });
            }
            else {
                this._register(notebookService.registerContributedNotebookType('interactive', {
                    providerDisplayName: 'Interactive Notebook',
                    displayName: 'Interactive',
                    filenamePattern: ['*.interactive'],
                    exclusive: true
                }));
            }
            editorResolverService.registerEditor(`${network_1.Schemas.vscodeInteractiveInput}:/**`, {
                id: interactiveEditorInput_1.InteractiveEditorInput.ID,
                label: 'Interactive Editor',
                priority: editorResolverService_1.RegisteredEditorPriority.exclusive
            }, {
                canSupportResource: uri => uri.scheme === network_1.Schemas.vscodeInteractiveInput,
                singlePerResource: true
            }, ({ resource }) => {
                const editorInput = editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */).find(editor => editor.editor instanceof interactiveEditorInput_1.InteractiveEditorInput && editor.editor.inputResource.toString() === resource.toString());
                return editorInput;
            });
            editorResolverService.registerEditor(`*.interactive`, {
                id: interactiveEditorInput_1.InteractiveEditorInput.ID,
                label: 'Interactive Editor',
                priority: editorResolverService_1.RegisteredEditorPriority.exclusive
            }, {
                canSupportResource: uri => uri.scheme === network_1.Schemas.vscodeInteractive,
                singlePerResource: true
            }, ({ resource }) => {
                const editorInput = editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */).find(editor => { var _a; return editor.editor instanceof interactiveEditorInput_1.InteractiveEditorInput && ((_a = editor.editor.resource) === null || _a === void 0 ? void 0 : _a.toString()) === resource.toString(); });
                return editorInput;
            });
        }
    };
    InteractiveDocumentContribution = __decorate([
        __param(0, notebookService_1.INotebookService),
        __param(1, editorResolverService_1.IEditorResolverService),
        __param(2, editorService_1.IEditorService)
    ], InteractiveDocumentContribution);
    exports.InteractiveDocumentContribution = InteractiveDocumentContribution;
    let InteractiveInputContentProvider = class InteractiveInputContentProvider {
        constructor(textModelService, _modelService) {
            this._modelService = _modelService;
            this._registration = textModelService.registerTextModelContentProvider(network_1.Schemas.vscodeInteractiveInput, this);
        }
        dispose() {
            this._registration.dispose();
        }
        async provideTextContent(resource) {
            const existing = this._modelService.getModel(resource);
            if (existing) {
                return existing;
            }
            let result = this._modelService.createModel('', null, resource, false);
            return result;
        }
    };
    InteractiveInputContentProvider = __decorate([
        __param(0, resolverService_1.ITextModelService),
        __param(1, model_1.IModelService)
    ], InteractiveInputContentProvider);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(InteractiveDocumentContribution, 1 /* LifecyclePhase.Starting */);
    workbenchContributionsRegistry.registerWorkbenchContribution(InteractiveInputContentProvider, 1 /* LifecyclePhase.Starting */);
    class InteractiveEditorSerializer {
        canSerialize() {
            return true;
        }
        serialize(input) {
            (0, types_1.assertType)(input instanceof interactiveEditorInput_1.InteractiveEditorInput);
            return JSON.stringify({
                resource: input.primary.resource,
                inputResource: input.inputResource,
            });
        }
        deserialize(instantiationService, raw) {
            const data = (0, marshalling_1.parse)(raw);
            if (!data) {
                return undefined;
            }
            const { resource, inputResource } = data;
            if (!data || !uri_1.URI.isUri(resource) || !uri_1.URI.isUri(inputResource)) {
                return undefined;
            }
            const input = interactiveEditorInput_1.InteractiveEditorInput.create(instantiationService, resource, inputResource);
            return input;
        }
    }
    exports.InteractiveEditorSerializer = InteractiveEditorSerializer;
    // Registry.as<EditorInputFactoryRegistry>(EditorExtensions.EditorInputFactories).registerEditorInputSerializer(
    // 	InteractiveEditorInput.ID,
    // 	InteractiveEditorSerializer
    // );
    (0, extensions_2.registerSingleton)(interactiveHistoryService_1.IInteractiveHistoryService, interactiveHistoryService_1.InteractiveHistoryService);
    (0, extensions_2.registerSingleton)(interactiveDocumentService_1.IInteractiveDocumentService, interactiveDocumentService_1.InteractiveDocumentService);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: '_interactive.open',
                title: { value: (0, nls_1.localize)('interactive.open', "Open Interactive Window"), original: 'Open Interactive Window' },
                f1: false,
                category: 'Interactive',
                description: {
                    description: (0, nls_1.localize)('interactive.open', "Open Interactive Window"),
                    args: [
                        {
                            name: 'showOptions',
                            description: 'Show Options',
                            schema: {
                                type: 'object',
                                properties: {
                                    'viewColumn': {
                                        type: 'number',
                                        default: -1
                                    },
                                    'preserveFocus': {
                                        type: 'boolean',
                                        default: true
                                    }
                                },
                            }
                        },
                        {
                            name: 'resource',
                            description: 'Interactive resource Uri',
                            isOptional: true
                        },
                        {
                            name: 'controllerId',
                            description: 'Notebook controller Id',
                            isOptional: true
                        },
                        {
                            name: 'title',
                            description: 'Notebook editor title',
                            isOptional: true
                        }
                    ]
                }
            });
        }
        async run(accessor, showOptions, resource, id, title) {
            var _a, _b, _c;
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const historyService = accessor.get(interactiveHistoryService_1.IInteractiveHistoryService);
            const kernelService = accessor.get(notebookKernelService_1.INotebookKernelService);
            const group = (0, editorGroupColumn_1.columnToEditorGroup)(editorGroupService, typeof showOptions === 'number' ? showOptions : showOptions === null || showOptions === void 0 ? void 0 : showOptions.viewColumn);
            const editorOptions = {
                activation: editor_1.EditorActivation.PRESERVE,
                preserveFocus: typeof showOptions !== 'number' ? ((_a = showOptions === null || showOptions === void 0 ? void 0 : showOptions.preserveFocus) !== null && _a !== void 0 ? _a : false) : false
            };
            if (resource && resource.scheme === network_1.Schemas.vscodeInteractive) {
                const resourceUri = uri_1.URI.revive(resource);
                const editors = editorService.findEditors(resourceUri).filter(id => { var _a; return id.editor instanceof interactiveEditorInput_1.InteractiveEditorInput && ((_a = id.editor.resource) === null || _a === void 0 ? void 0 : _a.toString()) === resourceUri.toString(); });
                if (editors.length) {
                    const editorInput = editors[0].editor;
                    const currentGroup = editors[0].groupId;
                    const editor = await editorService.openEditor(editorInput, editorOptions, currentGroup);
                    const editorControl = editor === null || editor === void 0 ? void 0 : editor.getControl();
                    return {
                        notebookUri: editorInput.resource,
                        inputUri: editorInput.inputResource,
                        notebookEditorId: (_b = editorControl === null || editorControl === void 0 ? void 0 : editorControl.notebookEditor) === null || _b === void 0 ? void 0 : _b.getId()
                    };
                }
            }
            const existingNotebookDocument = new Set();
            editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */).forEach(editor => {
                if (editor.editor.resource) {
                    existingNotebookDocument.add(editor.editor.resource.toString());
                }
            });
            let notebookUri = undefined;
            let inputUri = undefined;
            let counter = 1;
            do {
                notebookUri = uri_1.URI.from({ scheme: network_1.Schemas.vscodeInteractive, path: `Interactive-${counter}.interactive` });
                inputUri = uri_1.URI.from({ scheme: network_1.Schemas.vscodeInteractiveInput, path: `/InteractiveInput-${counter}` });
                counter++;
            } while (existingNotebookDocument.has(notebookUri.toString()));
            if (id) {
                const allKernels = kernelService.getMatchingKernel({ uri: notebookUri, viewType: 'interactive' }).all;
                const preferredKernel = allKernels.find(kernel => kernel.id === id);
                if (preferredKernel) {
                    kernelService.preselectKernelForNotebook(preferredKernel, { uri: notebookUri, viewType: 'interactive' });
                }
            }
            const editorInput = interactiveEditorInput_1.InteractiveEditorInput.create(accessor.get(instantiation_1.IInstantiationService), notebookUri, inputUri, title);
            historyService.clearHistory(notebookUri);
            const editorPane = await editorService.openEditor(editorInput, editorOptions, group);
            const editorControl = editorPane === null || editorPane === void 0 ? void 0 : editorPane.getControl();
            // Extensions must retain references to these URIs to manipulate the interactive editor
            return { notebookUri, inputUri, notebookEditorId: (_c = editorControl === null || editorControl === void 0 ? void 0 : editorControl.notebookEditor) === null || _c === void 0 ? void 0 : _c.getId() };
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.execute',
                title: { value: (0, nls_1.localize)('interactive.execute', "Execute Code"), original: 'Execute Code' },
                category: 'Interactive',
                keybinding: {
                    // when: NOTEBOOK_CELL_LIST_FOCUSED,
                    when: contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.vscodeInteractive),
                    primary: 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */,
                    win: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */
                    },
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
                menu: [
                    {
                        id: actions_1.MenuId.InteractiveInputExecute
                    }
                ],
                icon: icons.executeIcon,
                f1: false
            });
        }
        async run(accessor) {
            var _a, _b;
            const editorService = accessor.get(editorService_1.IEditorService);
            const bulkEditService = accessor.get(bulkEditService_1.IBulkEditService);
            const historyService = accessor.get(interactiveHistoryService_1.IInteractiveHistoryService);
            const editorControl = (_a = editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                const notebookDocument = editorControl.notebookEditor.textModel;
                const textModel = editorControl.codeEditor.getModel();
                const activeKernel = editorControl.notebookEditor.activeKernel;
                const language = (_b = activeKernel === null || activeKernel === void 0 ? void 0 : activeKernel.supportedLanguages[0]) !== null && _b !== void 0 ? _b : modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
                if (notebookDocument && textModel) {
                    const index = notebookDocument.length;
                    const value = textModel.getValue();
                    if ((0, strings_1.isFalsyOrWhitespace)(value)) {
                        return;
                    }
                    historyService.addToHistory(notebookDocument.uri, '');
                    textModel.setValue('');
                    const collapseState = editorControl.notebookEditor.notebookOptions.getLayoutConfiguration().interactiveWindowCollapseCodeCells === 'fromEditor' ?
                        {
                            inputCollapsed: false,
                            outputCollapsed: false
                        } :
                        undefined;
                    await bulkEditService.apply([
                        new bulkCellEdits_1.ResourceNotebookCellEdit(notebookDocument.uri, {
                            editType: 1 /* CellEditType.Replace */,
                            index: index,
                            count: 0,
                            cells: [{
                                    cellKind: notebookCommon_1.CellKind.Code,
                                    mime: undefined,
                                    language,
                                    source: value,
                                    outputs: [],
                                    metadata: {},
                                    collapseState
                                }]
                        })
                    ]);
                    // reveal the cell into view first
                    editorControl.notebookEditor.revealCellRangeInView({ start: index, end: index + 1 });
                    await editorControl.notebookEditor.executeNotebookCells(editorControl.notebookEditor.getCellsInRange({ start: index, end: index + 1 }));
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.input.clear',
                title: { value: (0, nls_1.localize)('interactive.input.clear', "Clear the interactive window input editor contents"), original: 'Clear the interactive window input editor contents' },
                category: 'Interactive',
                f1: false
            });
        }
        async run(accessor) {
            var _a, _b;
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = (_a = editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                const notebookDocument = editorControl.notebookEditor.textModel;
                const textModel = editorControl.codeEditor.getModel();
                const range = (_b = editorControl.codeEditor.getModel()) === null || _b === void 0 ? void 0 : _b.getFullModelRange();
                if (notebookDocument && textModel && range) {
                    editorControl.codeEditor.executeEdits('', [editOperation_1.EditOperation.replace(range, null)]);
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.history.previous',
                title: { value: (0, nls_1.localize)('interactive.history.previous', "Previous value in history"), original: 'Previous value in history' },
                category: 'Interactive',
                f1: false,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.vscodeInteractive), interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.notEqualsTo('bottom'), interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.notEqualsTo('none'), suggest_1.Context.Visible.toNegated()),
                    primary: 16 /* KeyCode.UpArrow */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async run(accessor) {
            var _a;
            const editorService = accessor.get(editorService_1.IEditorService);
            const historyService = accessor.get(interactiveHistoryService_1.IInteractiveHistoryService);
            const editorControl = (_a = editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                const notebookDocument = editorControl.notebookEditor.textModel;
                const textModel = editorControl.codeEditor.getModel();
                if (notebookDocument && textModel) {
                    const previousValue = historyService.getPreviousValue(notebookDocument.uri);
                    if (previousValue) {
                        textModel.setValue(previousValue);
                    }
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.history.next',
                title: { value: (0, nls_1.localize)('interactive.history.next', "Next value in history"), original: 'Next value in history' },
                category: 'Interactive',
                f1: false,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.vscodeInteractive), interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.notEqualsTo('top'), interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.notEqualsTo('none'), suggest_1.Context.Visible.toNegated()),
                    primary: 18 /* KeyCode.DownArrow */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
            });
        }
        async run(accessor) {
            var _a;
            const editorService = accessor.get(editorService_1.IEditorService);
            const historyService = accessor.get(interactiveHistoryService_1.IInteractiveHistoryService);
            const editorControl = (_a = editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                const notebookDocument = editorControl.notebookEditor.textModel;
                const textModel = editorControl.codeEditor.getModel();
                if (notebookDocument && textModel) {
                    const previousValue = historyService.getNextValue(notebookDocument.uri);
                    if (previousValue) {
                        textModel.setValue(previousValue);
                    }
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.scrollToTop',
                title: (0, nls_1.localize)('interactiveScrollToTop', 'Scroll to Top'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.vscodeInteractive),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 14 /* KeyCode.Home */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                category: 'Interactive',
            });
        }
        async run(accessor) {
            var _a;
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = (_a = editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                if (editorControl.notebookEditor.getLength() === 0) {
                    return;
                }
                editorControl.notebookEditor.revealCellRangeInView({ start: 0, end: 1 });
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.scrollToBottom',
                title: (0, nls_1.localize)('interactiveScrollToBottom', 'Scroll to Bottom'),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.equals('resourceScheme', network_1.Schemas.vscodeInteractive),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 13 /* KeyCode.End */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                category: 'Interactive',
            });
        }
        async run(accessor) {
            var _a;
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = (_a = editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                if (editorControl.notebookEditor.getLength() === 0) {
                    return;
                }
                const len = editorControl.notebookEditor.getLength();
                editorControl.notebookEditor.revealCellRangeInView({ start: len - 1, end: len });
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.input.focus',
                title: { value: (0, nls_1.localize)('interactive.input.focus', "Focus input editor in the interactive window"), original: 'Focus input editor in the interactive window' },
                category: 'Interactive',
                f1: false
            });
        }
        async run(accessor) {
            var _a, _b;
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = (_a = editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                (_b = editorService.activeEditorPane) === null || _b === void 0 ? void 0 : _b.focus();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'interactive.history.focus',
                title: { value: (0, nls_1.localize)('interactive.history.focus', "Focus history in the interactive window"), original: 'Focus input editor in the interactive window' },
                category: 'Interactive',
                f1: false
            });
        }
        async run(accessor) {
            var _a;
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorControl = (_a = editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getControl();
            if (editorControl && editorControl.notebookEditor && editorControl.codeEditor) {
                editorControl.notebookEditor.focus();
            }
        }
    });
    (0, themeService_1.registerThemingParticipant)((theme) => {
        var _a, _b, _c, _d;
        (0, colorRegistry_1.registerColor)('interactive.activeCodeBorder', {
            dark: (_a = theme.getColor(peekView_1.peekViewBorder)) !== null && _a !== void 0 ? _a : '#007acc',
            light: (_b = theme.getColor(peekView_1.peekViewBorder)) !== null && _b !== void 0 ? _b : '#007acc',
            hcDark: colorRegistry_1.contrastBorder,
            hcLight: colorRegistry_1.contrastBorder
        }, (0, nls_1.localize)('interactive.activeCodeBorder', 'The border color for the current interactive code cell when the editor has focus.'));
        // registerColor('interactive.activeCodeBackground', {
        // 	dark: (theme.getColor(peekViewEditorBackground) ?? Color.fromHex('#001F33')).transparent(0.25),
        // 	light: (theme.getColor(peekViewEditorBackground) ?? Color.fromHex('#F2F8FC')).transparent(0.25),
        // 	hc: Color.black
        // }, localize('interactive.activeCodeBackground', 'The background color for the current interactive code cell when the editor has focus.'));
        (0, colorRegistry_1.registerColor)('interactive.inactiveCodeBorder', {
            dark: (_c = theme.getColor(colorRegistry_1.listInactiveSelectionBackground)) !== null && _c !== void 0 ? _c : (0, colorRegistry_1.transparent)(colorRegistry_1.listInactiveSelectionBackground, 1),
            light: (_d = theme.getColor(colorRegistry_1.listInactiveSelectionBackground)) !== null && _d !== void 0 ? _d : (0, colorRegistry_1.transparent)(colorRegistry_1.listInactiveSelectionBackground, 1),
            hcDark: theme_1.PANEL_BORDER,
            hcLight: theme_1.PANEL_BORDER
        }, (0, nls_1.localize)('interactive.inactiveCodeBorder', 'The border color for the current interactive code cell when the editor does not have focus.'));
        // registerColor('interactive.inactiveCodeBackground', {
        // 	dark: (theme.getColor(peekViewResultsBackground) ?? Color.fromHex('#252526')).transparent(0.25),
        // 	light: (theme.getColor(peekViewResultsBackground) ?? Color.fromHex('#F3F3F3')).transparent(0.25),
        // 	hc: Color.black
        // }, localize('interactive.inactiveCodeBackground', 'The backgorund color for the current interactive code cell when the editor does not have focus.'));
    });
});
//# sourceMappingURL=interactive.contribution.js.map