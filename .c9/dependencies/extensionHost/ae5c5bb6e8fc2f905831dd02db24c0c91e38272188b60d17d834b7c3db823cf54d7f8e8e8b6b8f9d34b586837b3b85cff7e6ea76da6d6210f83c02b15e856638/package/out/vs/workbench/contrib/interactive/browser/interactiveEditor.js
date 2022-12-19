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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditorWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/workbench/contrib/interactive/browser/interactiveEditorInput", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/browser/notebookEditorService", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/executionStatusBarItemController", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/editor/common/languages/modesRegistry", "vs/editor/common/languages/language", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/interactive/browser/interactiveCommon", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/common/notebookOptions", "vs/base/browser/ui/toolbar/toolbar", "vs/platform/contextview/browser/contextView", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/editor/browser/editorExtensions", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/suggest/browser/suggestController", "vs/editor/contrib/snippet/browser/snippetController2", "vs/workbench/contrib/snippets/browser/tabCompletion", "vs/editor/contrib/hover/browser/hover", "vs/editor/contrib/gotoError/browser/gotoError", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/css!./media/interactive"], function (require, exports, nls, DOM, event_1, lifecycle_1, codeEditorService_1, codeEditorWidget_1, contextkey_1, instantiation_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, editorPane_1, simpleEditorOptions_1, interactiveEditorInput_1, notebookEditorExtensions_1, notebookEditorService_1, notebookEditorWidget_1, editorGroupsService_1, executionStatusBarItemController_1, notebookKernelService_1, modesRegistry_1, language_1, actions_1, keybinding_1, interactiveCommon_1, notebookCommon_1, configuration_1, notebookOptions_1, toolbar_1, contextView_1, menuEntryActionViewItem_1, codeCellViewModel_1, editorExtensions_1, menuPreventer_1, selectionClipboard_1, contextmenu_1, suggestController_1, snippetController2_1, tabCompletion_1, hover_1, gotoError_1, textResourceConfiguration_1, notebookExecutionStateService_1, notebookContextKeys_1) {
    "use strict";
    var _InteractiveEditor_instances, _InteractiveEditor_rootElement, _InteractiveEditor_styleElement, _InteractiveEditor_notebookEditorContainer, _InteractiveEditor_notebookWidget, _InteractiveEditor_inputCellContainer, _InteractiveEditor_inputFocusIndicator, _InteractiveEditor_inputRunButtonContainer, _InteractiveEditor_inputEditorContainer, _InteractiveEditor_codeEditorWidget, _InteractiveEditor_notebookWidgetService, _InteractiveEditor_instantiationService, _InteractiveEditor_languageService, _InteractiveEditor_contextKeyService, _InteractiveEditor_notebookKernelService, _InteractiveEditor_keybindingService, _InteractiveEditor_menuService, _InteractiveEditor_contextMenuService, _InteractiveEditor_editorGroupService, _InteractiveEditor_notebookExecutionStateService, _InteractiveEditor_widgetDisposableStore, _InteractiveEditor_dimension, _InteractiveEditor_notebookOptions, _InteractiveEditor_editorMemento, _InteractiveEditor_groupListener, _InteractiveEditor_onDidFocusWidget, _InteractiveEditor_onDidChangeSelection, _InteractiveEditor_inputCellContainerHeight_get, _InteractiveEditor_inputCellEditorHeight_get, _InteractiveEditor_setupRunButtonToolbar, _InteractiveEditor_createLayoutStyles, _InteractiveEditor_saveEditorViewState, _InteractiveEditor_loadNotebookEditorViewState, _InteractiveEditor_toEditorPaneSelectionChangeReason, _InteractiveEditor_lastCell, _InteractiveEditor_lastCellDisposable, _InteractiveEditor_state, _InteractiveEditor_cellAtBottom, _InteractiveEditor_registerExecutionScrollListener, _InteractiveEditor_registerListenerForCell, _InteractiveEditor_syncWithKernel, _InteractiveEditor_layoutWidgets, _InteractiveEditor_validateDimension, _InteractiveEditor_updateInputDecoration;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveEditor = void 0;
    const DECORATION_KEY = 'interactiveInputDecoration';
    const INTERACTIVE_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'InteractiveEditorViewState';
    var ScrollingState;
    (function (ScrollingState) {
        ScrollingState[ScrollingState["Initial"] = 0] = "Initial";
        ScrollingState[ScrollingState["StickyToBottom"] = 1] = "StickyToBottom";
    })(ScrollingState || (ScrollingState = {}));
    const INPUT_CELL_VERTICAL_PADDING = 8;
    const INPUT_CELL_HORIZONTAL_PADDING_RIGHT = 10;
    const INPUT_EDITOR_PADDING = 8;
    let InteractiveEditor = class InteractiveEditor extends editorPane_1.EditorPane {
        constructor(telemetryService, themeService, storageService, instantiationService, notebookWidgetService, contextKeyService, codeEditorService, notebookKernelService, languageService, keybindingService, configurationService, menuService, contextMenuService, editorGroupService, textResourceConfigurationService, notebookExecutionStateService) {
            super(InteractiveEditor.ID, telemetryService, themeService, storageService);
            _InteractiveEditor_instances.add(this);
            _InteractiveEditor_rootElement.set(this, void 0);
            _InteractiveEditor_styleElement.set(this, void 0);
            _InteractiveEditor_notebookEditorContainer.set(this, void 0);
            _InteractiveEditor_notebookWidget.set(this, { value: undefined });
            _InteractiveEditor_inputCellContainer.set(this, void 0);
            _InteractiveEditor_inputFocusIndicator.set(this, void 0);
            _InteractiveEditor_inputRunButtonContainer.set(this, void 0);
            _InteractiveEditor_inputEditorContainer.set(this, void 0);
            _InteractiveEditor_codeEditorWidget.set(this, void 0);
            // #inputLineCount = 1;
            _InteractiveEditor_notebookWidgetService.set(this, void 0);
            _InteractiveEditor_instantiationService.set(this, void 0);
            _InteractiveEditor_languageService.set(this, void 0);
            _InteractiveEditor_contextKeyService.set(this, void 0);
            _InteractiveEditor_notebookKernelService.set(this, void 0);
            _InteractiveEditor_keybindingService.set(this, void 0);
            _InteractiveEditor_menuService.set(this, void 0);
            _InteractiveEditor_contextMenuService.set(this, void 0);
            _InteractiveEditor_editorGroupService.set(this, void 0);
            _InteractiveEditor_notebookExecutionStateService.set(this, void 0);
            _InteractiveEditor_widgetDisposableStore.set(this, this._register(new lifecycle_1.DisposableStore()));
            _InteractiveEditor_dimension.set(this, void 0);
            _InteractiveEditor_notebookOptions.set(this, void 0);
            _InteractiveEditor_editorMemento.set(this, void 0);
            _InteractiveEditor_groupListener.set(this, this._register(new lifecycle_1.DisposableStore()));
            _InteractiveEditor_onDidFocusWidget.set(this, this._register(new event_1.Emitter()));
            _InteractiveEditor_onDidChangeSelection.set(this, this._register(new event_1.Emitter()));
            this.onDidChangeSelection = __classPrivateFieldGet(this, _InteractiveEditor_onDidChangeSelection, "f").event;
            _InteractiveEditor_lastCell.set(this, undefined);
            _InteractiveEditor_lastCellDisposable.set(this, new lifecycle_1.DisposableStore());
            _InteractiveEditor_state.set(this, 0 /* ScrollingState.Initial */);
            __classPrivateFieldSet(this, _InteractiveEditor_instantiationService, instantiationService, "f");
            __classPrivateFieldSet(this, _InteractiveEditor_notebookWidgetService, notebookWidgetService, "f");
            __classPrivateFieldSet(this, _InteractiveEditor_contextKeyService, contextKeyService, "f");
            __classPrivateFieldSet(this, _InteractiveEditor_notebookKernelService, notebookKernelService, "f");
            __classPrivateFieldSet(this, _InteractiveEditor_languageService, languageService, "f");
            __classPrivateFieldSet(this, _InteractiveEditor_keybindingService, keybindingService, "f");
            __classPrivateFieldSet(this, _InteractiveEditor_menuService, menuService, "f");
            __classPrivateFieldSet(this, _InteractiveEditor_contextMenuService, contextMenuService, "f");
            __classPrivateFieldSet(this, _InteractiveEditor_editorGroupService, editorGroupService, "f");
            __classPrivateFieldSet(this, _InteractiveEditor_notebookExecutionStateService, notebookExecutionStateService, "f");
            __classPrivateFieldSet(this, _InteractiveEditor_notebookOptions, new notebookOptions_1.NotebookOptions(configurationService, notebookExecutionStateService, { cellToolbarInteraction: 'hover', globalToolbar: true, defaultCellCollapseConfig: { codeCell: { inputCollapsed: true } } }), "f");
            __classPrivateFieldSet(this, _InteractiveEditor_editorMemento, this.getEditorMemento(editorGroupService, textResourceConfigurationService, INTERACTIVE_EDITOR_VIEW_STATE_PREFERENCE_KEY), "f");
            codeEditorService.registerDecorationType('interactive-decoration', DECORATION_KEY, {});
            this._register(__classPrivateFieldGet(this, _InteractiveEditor_keybindingService, "f").onDidUpdateKeybindings(__classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_updateInputDecoration), this));
        }
        get onDidFocus() { return __classPrivateFieldGet(this, _InteractiveEditor_onDidFocusWidget, "f").event; }
        createEditor(parent) {
            __classPrivateFieldSet(this, _InteractiveEditor_rootElement, DOM.append(parent, DOM.$('.interactive-editor')), "f");
            __classPrivateFieldGet(this, _InteractiveEditor_rootElement, "f").style.position = 'relative';
            __classPrivateFieldSet(this, _InteractiveEditor_notebookEditorContainer, DOM.append(__classPrivateFieldGet(this, _InteractiveEditor_rootElement, "f"), DOM.$('.notebook-editor-container')), "f");
            __classPrivateFieldSet(this, _InteractiveEditor_inputCellContainer, DOM.append(__classPrivateFieldGet(this, _InteractiveEditor_rootElement, "f"), DOM.$('.input-cell-container')), "f");
            __classPrivateFieldGet(this, _InteractiveEditor_inputCellContainer, "f").style.position = 'absolute';
            __classPrivateFieldGet(this, _InteractiveEditor_inputCellContainer, "f").style.height = `${__classPrivateFieldGet(this, _InteractiveEditor_instances, "a", _InteractiveEditor_inputCellContainerHeight_get)}px`;
            __classPrivateFieldSet(this, _InteractiveEditor_inputFocusIndicator, DOM.append(__classPrivateFieldGet(this, _InteractiveEditor_inputCellContainer, "f"), DOM.$('.input-focus-indicator')), "f");
            __classPrivateFieldSet(this, _InteractiveEditor_inputRunButtonContainer, DOM.append(__classPrivateFieldGet(this, _InteractiveEditor_inputCellContainer, "f"), DOM.$('.run-button-container')), "f");
            __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_setupRunButtonToolbar).call(this, __classPrivateFieldGet(this, _InteractiveEditor_inputRunButtonContainer, "f"));
            __classPrivateFieldSet(this, _InteractiveEditor_inputEditorContainer, DOM.append(__classPrivateFieldGet(this, _InteractiveEditor_inputCellContainer, "f"), DOM.$('.input-editor-container')), "f");
            __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_createLayoutStyles).call(this);
        }
        saveState() {
            __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_saveEditorViewState).call(this, this.input);
            super.saveState();
        }
        getViewState() {
            const input = this.input;
            if (!(input instanceof interactiveEditorInput_1.InteractiveEditorInput)) {
                return undefined;
            }
            __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_saveEditorViewState).call(this, input);
            return __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_loadNotebookEditorViewState).call(this, input);
        }
        async setInput(input, options, context, token) {
            var _a, _b, _c, _d, _e, _f;
            const group = this.group;
            const notebookInput = input.notebookEditorInput;
            // there currently is a widget which we still own so
            // we need to hide it before getting a new widget
            if (__classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value) {
                __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.onWillHide();
            }
            if (__classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f")) {
                __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").dispose();
            }
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").clear();
            __classPrivateFieldSet(this, _InteractiveEditor_notebookWidget, __classPrivateFieldGet(this, _InteractiveEditor_instantiationService, "f").invokeFunction(__classPrivateFieldGet(this, _InteractiveEditor_notebookWidgetService, "f").retrieveWidget, group, notebookInput, {
                isEmbedded: true,
                isReadOnly: true,
                contributions: notebookEditorExtensions_1.NotebookEditorExtensionsRegistry.getSomeEditorContributions([
                    executionStatusBarItemController_1.ExecutionStateCellStatusBarContrib.id,
                    executionStatusBarItemController_1.TimerCellStatusBarContrib.id
                ]),
                menuIds: {
                    notebookToolbar: actions_1.MenuId.InteractiveToolbar,
                    cellTitleToolbar: actions_1.MenuId.InteractiveCellTitle,
                    cellInsertToolbar: actions_1.MenuId.NotebookCellBetween,
                    cellTopInsertToolbar: actions_1.MenuId.NotebookCellListTop,
                    cellExecuteToolbar: actions_1.MenuId.InteractiveCellExecute,
                    cellExecutePrimary: undefined
                },
                cellEditorContributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    selectionClipboard_1.SelectionClipboardContributionID,
                    contextmenu_1.ContextMenuController.ID,
                    hover_1.ModesHoverController.ID,
                    gotoError_1.MarkerController.ID
                ]),
                options: __classPrivateFieldGet(this, _InteractiveEditor_notebookOptions, "f")
            }), "f");
            __classPrivateFieldSet(this, _InteractiveEditor_codeEditorWidget, __classPrivateFieldGet(this, _InteractiveEditor_instantiationService, "f").createInstance(codeEditorWidget_1.CodeEditorWidget, __classPrivateFieldGet(this, _InteractiveEditor_inputEditorContainer, "f"), Object.assign(Object.assign({}, (0, simpleEditorOptions_1.getSimpleEditorOptions)()), {
                glyphMargin: true,
                padding: {
                    top: INPUT_EDITOR_PADDING,
                    bottom: INPUT_EDITOR_PADDING
                },
                hover: {
                    enabled: true
                }
            }), Object.assign({
                isSimpleWidget: false,
                contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    menuPreventer_1.MenuPreventer.ID,
                    selectionClipboard_1.SelectionClipboardContributionID,
                    contextmenu_1.ContextMenuController.ID,
                    suggestController_1.SuggestController.ID,
                    snippetController2_1.SnippetController2.ID,
                    tabCompletion_1.TabCompletionController.ID,
                    hover_1.ModesHoverController.ID,
                    gotoError_1.MarkerController.ID
                ])
            })), "f");
            if (__classPrivateFieldGet(this, _InteractiveEditor_dimension, "f")) {
                __classPrivateFieldGet(this, _InteractiveEditor_notebookEditorContainer, "f").style.height = `${__classPrivateFieldGet(this, _InteractiveEditor_dimension, "f").height - __classPrivateFieldGet(this, _InteractiveEditor_instances, "a", _InteractiveEditor_inputCellContainerHeight_get)}px`;
                __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.layout(__classPrivateFieldGet(this, _InteractiveEditor_dimension, "f").with(__classPrivateFieldGet(this, _InteractiveEditor_dimension, "f").width, __classPrivateFieldGet(this, _InteractiveEditor_dimension, "f").height - __classPrivateFieldGet(this, _InteractiveEditor_instances, "a", _InteractiveEditor_inputCellContainerHeight_get)), __classPrivateFieldGet(this, _InteractiveEditor_notebookEditorContainer, "f"));
                const { codeCellLeftMargin, cellRunGutter } = __classPrivateFieldGet(this, _InteractiveEditor_notebookOptions, "f").getLayoutConfiguration();
                const leftMargin = codeCellLeftMargin + cellRunGutter;
                const maxHeight = Math.min(__classPrivateFieldGet(this, _InteractiveEditor_dimension, "f").height / 2, __classPrivateFieldGet(this, _InteractiveEditor_instances, "a", _InteractiveEditor_inputCellEditorHeight_get));
                __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").layout(__classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_validateDimension).call(this, __classPrivateFieldGet(this, _InteractiveEditor_dimension, "f").width - leftMargin - INPUT_CELL_HORIZONTAL_PADDING_RIGHT, maxHeight));
                __classPrivateFieldGet(this, _InteractiveEditor_inputFocusIndicator, "f").style.height = `${__classPrivateFieldGet(this, _InteractiveEditor_instances, "a", _InteractiveEditor_inputCellEditorHeight_get)}px`;
                __classPrivateFieldGet(this, _InteractiveEditor_inputCellContainer, "f").style.top = `${__classPrivateFieldGet(this, _InteractiveEditor_dimension, "f").height - __classPrivateFieldGet(this, _InteractiveEditor_instances, "a", _InteractiveEditor_inputCellContainerHeight_get)}px`;
                __classPrivateFieldGet(this, _InteractiveEditor_inputCellContainer, "f").style.width = `${__classPrivateFieldGet(this, _InteractiveEditor_dimension, "f").width}px`;
            }
            await super.setInput(input, options, context, token);
            const model = await input.resolve();
            if (model === null) {
                throw new Error('?');
            }
            (_a = __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value) === null || _a === void 0 ? void 0 : _a.setParentContextKeyService(__classPrivateFieldGet(this, _InteractiveEditor_contextKeyService, "f"));
            const viewState = (_b = options === null || options === void 0 ? void 0 : options.viewState) !== null && _b !== void 0 ? _b : __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_loadNotebookEditorViewState).call(this, input);
            await __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.setModel(model.notebook, viewState === null || viewState === void 0 ? void 0 : viewState.notebook);
            model.notebook.setCellCollapseDefault(__classPrivateFieldGet(this, _InteractiveEditor_notebookOptions, "f").getCellCollapseDefault());
            __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.setOptions({
                isReadOnly: true
            });
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(__classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.onDidFocusWidget(() => __classPrivateFieldGet(this, _InteractiveEditor_onDidFocusWidget, "f").fire()));
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(model.notebook.onDidChangeContent(() => {
                model.setDirty(false);
            }));
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(__classPrivateFieldGet(this, _InteractiveEditor_notebookOptions, "f").onDidChangeOptions(e => {
                var _a;
                if (e.compactView || e.focusIndicator) {
                    // update the styling
                    (_a = __classPrivateFieldGet(this, _InteractiveEditor_styleElement, "f")) === null || _a === void 0 ? void 0 : _a.remove();
                    __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_createLayoutStyles).call(this);
                }
                if (__classPrivateFieldGet(this, _InteractiveEditor_dimension, "f") && this.isVisible()) {
                    this.layout(__classPrivateFieldGet(this, _InteractiveEditor_dimension, "f"));
                }
                if (e.interactiveWindowCollapseCodeCells) {
                    model.notebook.setCellCollapseDefault(__classPrivateFieldGet(this, _InteractiveEditor_notebookOptions, "f").getCellCollapseDefault());
                }
            }));
            const editorModel = await input.resolveInput((_e = (_d = (_c = __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value) === null || _c === void 0 ? void 0 : _c.activeKernel) === null || _d === void 0 ? void 0 : _d.supportedLanguages[0]) !== null && _e !== void 0 ? _e : modesRegistry_1.PLAINTEXT_LANGUAGE_ID);
            __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").setModel(editorModel);
            if (viewState === null || viewState === void 0 ? void 0 : viewState.input) {
                __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").restoreViewState(viewState.input);
            }
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(__classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").onDidFocusEditorWidget(() => __classPrivateFieldGet(this, _InteractiveEditor_onDidFocusWidget, "f").fire()));
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(__classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").onDidContentSizeChange(e => {
                if (!e.contentHeightChanged) {
                    return;
                }
                if (__classPrivateFieldGet(this, _InteractiveEditor_dimension, "f")) {
                    __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_layoutWidgets).call(this, __classPrivateFieldGet(this, _InteractiveEditor_dimension, "f"));
                }
            }));
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(__classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").onDidChangeCursorPosition(e => __classPrivateFieldGet(this, _InteractiveEditor_onDidChangeSelection, "f").fire({ reason: __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_toEditorPaneSelectionChangeReason).call(this, e) })));
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(__classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").onDidChangeModelContent(() => __classPrivateFieldGet(this, _InteractiveEditor_onDidChangeSelection, "f").fire({ reason: 3 /* EditorPaneSelectionChangeReason.EDIT */ })));
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(__classPrivateFieldGet(this, _InteractiveEditor_notebookKernelService, "f").onDidChangeNotebookAffinity(__classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_syncWithKernel), this));
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(__classPrivateFieldGet(this, _InteractiveEditor_notebookKernelService, "f").onDidChangeSelectedNotebooks(__classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_syncWithKernel), this));
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(this.themeService.onDidColorThemeChange(() => {
                if (this.isVisible()) {
                    __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_updateInputDecoration).call(this);
                }
            }));
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(__classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").onDidChangeModelContent(() => {
                if (this.isVisible()) {
                    __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_updateInputDecoration).call(this);
                }
            }));
            if ((_f = __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value) === null || _f === void 0 ? void 0 : _f.hasModel()) {
                __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_registerExecutionScrollListener).call(this, __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value);
            }
            const cursorAtBoundaryContext = interactiveCommon_1.INTERACTIVE_INPUT_CURSOR_BOUNDARY.bindTo(__classPrivateFieldGet(this, _InteractiveEditor_contextKeyService, "f"));
            if (input.resource && input.historyService.has(input.resource)) {
                cursorAtBoundaryContext.set('top');
            }
            else {
                cursorAtBoundaryContext.set('none');
            }
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(__classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").onDidChangeCursorPosition(({ position }) => {
                const viewModel = __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f")._getViewModel();
                const lastLineNumber = viewModel.getLineCount();
                const lastLineCol = viewModel.getLineContent(lastLineNumber).length + 1;
                const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(position);
                const firstLine = viewPosition.lineNumber === 1 && viewPosition.column === 1;
                const lastLine = viewPosition.lineNumber === lastLineNumber && viewPosition.column === lastLineCol;
                if (firstLine) {
                    if (lastLine) {
                        cursorAtBoundaryContext.set('both');
                    }
                    else {
                        cursorAtBoundaryContext.set('top');
                    }
                }
                else {
                    if (lastLine) {
                        cursorAtBoundaryContext.set('bottom');
                    }
                    else {
                        cursorAtBoundaryContext.set('none');
                    }
                }
            }));
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(editorModel.onDidChangeContent(() => {
                var _a;
                const value = editorModel.getValue();
                if (((_a = this.input) === null || _a === void 0 ? void 0 : _a.resource) && value !== '') {
                    this.input.historyService.replaceLast(this.input.resource, value);
                }
            }));
            __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_syncWithKernel).call(this);
        }
        layout(dimension) {
            __classPrivateFieldGet(this, _InteractiveEditor_rootElement, "f").classList.toggle('mid-width', dimension.width < 1000 && dimension.width >= 600);
            __classPrivateFieldGet(this, _InteractiveEditor_rootElement, "f").classList.toggle('narrow-width', dimension.width < 600);
            __classPrivateFieldSet(this, _InteractiveEditor_dimension, dimension, "f");
            if (!__classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value) {
                return;
            }
            __classPrivateFieldGet(this, _InteractiveEditor_notebookEditorContainer, "f").style.height = `${__classPrivateFieldGet(this, _InteractiveEditor_dimension, "f").height - __classPrivateFieldGet(this, _InteractiveEditor_instances, "a", _InteractiveEditor_inputCellContainerHeight_get)}px`;
            __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_layoutWidgets).call(this, dimension);
        }
        focus() {
            __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").focus();
        }
        focusHistory() {
            __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.focus();
        }
        setEditorVisible(visible, group) {
            super.setEditorVisible(visible, group);
            if (group) {
                __classPrivateFieldGet(this, _InteractiveEditor_groupListener, "f").clear();
                __classPrivateFieldGet(this, _InteractiveEditor_groupListener, "f").add(group.onWillCloseEditor(e => __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_saveEditorViewState).call(this, e.editor)));
            }
            if (!visible) {
                __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_saveEditorViewState).call(this, this.input);
                if (this.input && __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value) {
                    __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.onWillHide();
                }
            }
        }
        clearInput() {
            if (__classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value) {
                __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_saveEditorViewState).call(this, this.input);
                __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.onWillHide();
            }
            if (__classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f")) {
                __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").dispose();
            }
            __classPrivateFieldSet(this, _InteractiveEditor_notebookWidget, { value: undefined }, "f");
            __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").clear();
            super.clearInput();
        }
        getControl() {
            return {
                notebookEditor: __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value,
                codeEditor: __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f")
            };
        }
    };
    _InteractiveEditor_rootElement = new WeakMap(), _InteractiveEditor_styleElement = new WeakMap(), _InteractiveEditor_notebookEditorContainer = new WeakMap(), _InteractiveEditor_notebookWidget = new WeakMap(), _InteractiveEditor_inputCellContainer = new WeakMap(), _InteractiveEditor_inputFocusIndicator = new WeakMap(), _InteractiveEditor_inputRunButtonContainer = new WeakMap(), _InteractiveEditor_inputEditorContainer = new WeakMap(), _InteractiveEditor_codeEditorWidget = new WeakMap(), _InteractiveEditor_notebookWidgetService = new WeakMap(), _InteractiveEditor_instantiationService = new WeakMap(), _InteractiveEditor_languageService = new WeakMap(), _InteractiveEditor_contextKeyService = new WeakMap(), _InteractiveEditor_notebookKernelService = new WeakMap(), _InteractiveEditor_keybindingService = new WeakMap(), _InteractiveEditor_menuService = new WeakMap(), _InteractiveEditor_contextMenuService = new WeakMap(), _InteractiveEditor_editorGroupService = new WeakMap(), _InteractiveEditor_notebookExecutionStateService = new WeakMap(), _InteractiveEditor_widgetDisposableStore = new WeakMap(), _InteractiveEditor_dimension = new WeakMap(), _InteractiveEditor_notebookOptions = new WeakMap(), _InteractiveEditor_editorMemento = new WeakMap(), _InteractiveEditor_groupListener = new WeakMap(), _InteractiveEditor_onDidFocusWidget = new WeakMap(), _InteractiveEditor_onDidChangeSelection = new WeakMap(), _InteractiveEditor_lastCell = new WeakMap(), _InteractiveEditor_lastCellDisposable = new WeakMap(), _InteractiveEditor_state = new WeakMap(), _InteractiveEditor_instances = new WeakSet(), _InteractiveEditor_inputCellContainerHeight_get = function _InteractiveEditor_inputCellContainerHeight_get() {
        return 19 + 2 + INPUT_CELL_VERTICAL_PADDING * 2 + INPUT_EDITOR_PADDING * 2;
    }, _InteractiveEditor_inputCellEditorHeight_get = function _InteractiveEditor_inputCellEditorHeight_get() {
        return 19 + INPUT_EDITOR_PADDING * 2;
    }, _InteractiveEditor_setupRunButtonToolbar = function _InteractiveEditor_setupRunButtonToolbar(runButtonContainer) {
        const menu = this._register(__classPrivateFieldGet(this, _InteractiveEditor_menuService, "f").createMenu(actions_1.MenuId.InteractiveInputExecute, __classPrivateFieldGet(this, _InteractiveEditor_contextKeyService, "f")));
        const toolbar = this._register(new toolbar_1.ToolBar(runButtonContainer, __classPrivateFieldGet(this, _InteractiveEditor_contextMenuService, "f"), {
            getKeyBinding: action => __classPrivateFieldGet(this, _InteractiveEditor_keybindingService, "f").lookupKeybinding(action.id),
            actionViewItemProvider: action => {
                return (0, menuEntryActionViewItem_1.createActionViewItem)(__classPrivateFieldGet(this, _InteractiveEditor_instantiationService, "f"), action);
            },
            renderDropdownAsChildElement: true
        }));
        const primary = [];
        const secondary = [];
        const result = { primary, secondary };
        (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result);
        toolbar.setActions([...primary, ...secondary]);
    }, _InteractiveEditor_createLayoutStyles = function _InteractiveEditor_createLayoutStyles() {
        __classPrivateFieldSet(this, _InteractiveEditor_styleElement, DOM.createStyleSheet(__classPrivateFieldGet(this, _InteractiveEditor_rootElement, "f")), "f");
        const styleSheets = [];
        const { focusIndicator, codeCellLeftMargin, cellRunGutter } = __classPrivateFieldGet(this, _InteractiveEditor_notebookOptions, "f").getLayoutConfiguration();
        const leftMargin = codeCellLeftMargin + cellRunGutter;
        styleSheets.push(`
			.interactive-editor .input-cell-container {
				padding: ${INPUT_CELL_VERTICAL_PADDING}px ${INPUT_CELL_HORIZONTAL_PADDING_RIGHT}px ${INPUT_CELL_VERTICAL_PADDING}px ${leftMargin}px;
			}
		`);
        if (focusIndicator === 'gutter') {
            styleSheets.push(`
				.interactive-editor .input-cell-container:focus-within .input-focus-indicator::before {
					border-color: var(--notebook-focused-cell-border-color) !important;
				}
				.interactive-editor .input-focus-indicator::before {
					border-color: var(--notebook-inactive-focused-cell-border-color) !important;
				}
				.interactive-editor .input-cell-container .input-focus-indicator {
					display: block;
					top: ${INPUT_CELL_VERTICAL_PADDING}px;
				}
				.interactive-editor .input-cell-container {
					border-top: 1px solid var(--notebook-inactive-focused-cell-border-color);
				}
			`);
        }
        else {
            // border
            styleSheets.push(`
				.interactive-editor .input-cell-container {
					border-top: 1px solid var(--notebook-inactive-focused-cell-border-color);
				}
				.interactive-editor .input-cell-container .input-focus-indicator {
					display: none;
				}
			`);
        }
        styleSheets.push(`
			.interactive-editor .input-cell-container .run-button-container {
				width: ${cellRunGutter}px;
				left: ${codeCellLeftMargin}px;
				margin-top: ${INPUT_EDITOR_PADDING - 2}px;
			}
		`);
        __classPrivateFieldGet(this, _InteractiveEditor_styleElement, "f").textContent = styleSheets.join('\n');
    }, _InteractiveEditor_saveEditorViewState = function _InteractiveEditor_saveEditorViewState(input) {
        if (this.group && __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value && input instanceof interactiveEditorInput_1.InteractiveEditorInput) {
            if (__classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.isDisposed) {
                return;
            }
            const state = __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.getEditorViewState();
            const editorState = __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").saveViewState();
            __classPrivateFieldGet(this, _InteractiveEditor_editorMemento, "f").saveEditorState(this.group, input.notebookEditorInput.resource, {
                notebook: state,
                input: editorState
            });
        }
    }, _InteractiveEditor_loadNotebookEditorViewState = function _InteractiveEditor_loadNotebookEditorViewState(input) {
        var _a, _b;
        let result;
        if (this.group) {
            result = __classPrivateFieldGet(this, _InteractiveEditor_editorMemento, "f").loadEditorState(this.group, input.notebookEditorInput.resource);
        }
        if (result) {
            return result;
        }
        // when we don't have a view state for the group/input-tuple then we try to use an existing
        // editor for the same resource.
        for (const group of __classPrivateFieldGet(this, _InteractiveEditor_editorGroupService, "f").getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
            if (group.activeEditorPane !== this && group.activeEditorPane === this && ((_a = group.activeEditor) === null || _a === void 0 ? void 0 : _a.matches(input))) {
                const notebook = (_b = __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value) === null || _b === void 0 ? void 0 : _b.getEditorViewState();
                const input = __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").saveViewState();
                return {
                    notebook,
                    input
                };
            }
        }
        return;
    }, _InteractiveEditor_toEditorPaneSelectionChangeReason = function _InteractiveEditor_toEditorPaneSelectionChangeReason(e) {
        switch (e.source) {
            case "api" /* TextEditorSelectionSource.PROGRAMMATIC */: return 1 /* EditorPaneSelectionChangeReason.PROGRAMMATIC */;
            case "code.navigation" /* TextEditorSelectionSource.NAVIGATION */: return 4 /* EditorPaneSelectionChangeReason.NAVIGATION */;
            case "code.jump" /* TextEditorSelectionSource.JUMP */: return 5 /* EditorPaneSelectionChangeReason.JUMP */;
            default: return 2 /* EditorPaneSelectionChangeReason.USER */;
        }
    }, _InteractiveEditor_cellAtBottom = function _InteractiveEditor_cellAtBottom(widget, cell) {
        const visibleRanges = widget.visibleRanges;
        const cellIndex = widget.getCellIndex(cell);
        if (cellIndex === Math.max(...visibleRanges.map(range => range.end))) {
            return true;
        }
        return false;
    }, _InteractiveEditor_registerExecutionScrollListener = function _InteractiveEditor_registerExecutionScrollListener(widget) {
        __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(widget.textModel.onWillAddRemoveCells(e => {
            const lastViewCell = widget.cellAt(widget.getLength() - 1);
            // check if the last cell is at the bottom
            if (lastViewCell && __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_cellAtBottom).call(this, widget, lastViewCell)) {
                __classPrivateFieldSet(this, _InteractiveEditor_state, 1 /* ScrollingState.StickyToBottom */, "f");
            }
            else {
                __classPrivateFieldSet(this, _InteractiveEditor_state, 0 /* ScrollingState.Initial */, "f");
            }
        }));
        __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(widget.onDidScroll(() => {
            const lastViewCell = widget.cellAt(widget.getLength() - 1);
            // check if the last cell is at the bottom
            if (lastViewCell && __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_cellAtBottom).call(this, widget, lastViewCell)) {
                __classPrivateFieldSet(this, _InteractiveEditor_state, 1 /* ScrollingState.StickyToBottom */, "f");
            }
            else {
                __classPrivateFieldSet(this, _InteractiveEditor_state, 0 /* ScrollingState.Initial */, "f");
            }
        }));
        __classPrivateFieldGet(this, _InteractiveEditor_widgetDisposableStore, "f").add(widget.textModel.onDidChangeContent(e => {
            var _a;
            for (let i = 0; i < e.rawEvents.length; i++) {
                const event = e.rawEvents[i];
                if (event.kind === notebookCommon_1.NotebookCellsChangeType.ModelChange && ((_a = __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value) === null || _a === void 0 ? void 0 : _a.hasModel())) {
                    const lastViewCell = __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.cellAt(__classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.getLength() - 1);
                    if (lastViewCell !== __classPrivateFieldGet(this, _InteractiveEditor_lastCell, "f")) {
                        __classPrivateFieldGet(this, _InteractiveEditor_lastCellDisposable, "f").clear();
                        __classPrivateFieldSet(this, _InteractiveEditor_lastCell, lastViewCell, "f");
                        __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_registerListenerForCell).call(this);
                    }
                }
            }
        }));
    }, _InteractiveEditor_registerListenerForCell = function _InteractiveEditor_registerListenerForCell() {
        if (!__classPrivateFieldGet(this, _InteractiveEditor_lastCell, "f")) {
            return;
        }
        __classPrivateFieldGet(this, _InteractiveEditor_lastCellDisposable, "f").add(__classPrivateFieldGet(this, _InteractiveEditor_lastCell, "f").onDidChangeLayout((e) => {
            var _a;
            if (e.totalHeight === undefined) {
                // not cell height change
                return;
            }
            if (!__classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value) {
                return;
            }
            if (__classPrivateFieldGet(this, _InteractiveEditor_lastCell, "f") instanceof codeCellViewModel_1.CodeCellViewModel && e.outputHeight === undefined && !__classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.isScrolledToBottom()) {
                return;
            }
            if (__classPrivateFieldGet(this, _InteractiveEditor_state, "f") !== 1 /* ScrollingState.StickyToBottom */) {
                return;
            }
            if (__classPrivateFieldGet(this, _InteractiveEditor_lastCell, "f")) {
                const runState = (_a = __classPrivateFieldGet(this, _InteractiveEditor_notebookExecutionStateService, "f").getCellExecution(__classPrivateFieldGet(this, _InteractiveEditor_lastCell, "f").uri)) === null || _a === void 0 ? void 0 : _a.state;
                if (runState === notebookCommon_1.NotebookCellExecutionState.Executing) {
                    return;
                }
            }
            // scroll to bottom
            // postpone to next tick as the list view might not process the output height change yet
            // e.g., when we register this listener later than the list view
            __classPrivateFieldGet(this, _InteractiveEditor_lastCellDisposable, "f").add(DOM.scheduleAtNextAnimationFrame(() => {
                if (__classPrivateFieldGet(this, _InteractiveEditor_state, "f") === 1 /* ScrollingState.StickyToBottom */) {
                    __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.scrollToBottom();
                }
            }));
        }));
    }, _InteractiveEditor_syncWithKernel = function _InteractiveEditor_syncWithKernel() {
        var _a, _b;
        const notebook = (_a = __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value) === null || _a === void 0 ? void 0 : _a.textModel;
        const textModel = __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").getModel();
        if (notebook && textModel) {
            const info = __classPrivateFieldGet(this, _InteractiveEditor_notebookKernelService, "f").getMatchingKernel(notebook);
            const selectedOrSuggested = (_b = info.selected) !== null && _b !== void 0 ? _b : info.suggestions[0];
            if (selectedOrSuggested) {
                const language = selectedOrSuggested.supportedLanguages[0];
                const newMode = language ? __classPrivateFieldGet(this, _InteractiveEditor_languageService, "f").createById(language).languageId : modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
                textModel.setMode(newMode);
                notebookContextKeys_1.NOTEBOOK_KERNEL.bindTo(__classPrivateFieldGet(this, _InteractiveEditor_contextKeyService, "f")).set(selectedOrSuggested.id);
            }
        }
        __classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_updateInputDecoration).call(this);
    }, _InteractiveEditor_layoutWidgets = function _InteractiveEditor_layoutWidgets(dimension) {
        const contentHeight = __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").hasModel() ? __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").getContentHeight() : __classPrivateFieldGet(this, _InteractiveEditor_instances, "a", _InteractiveEditor_inputCellEditorHeight_get);
        const maxHeight = Math.min(dimension.height / 2, contentHeight);
        const { codeCellLeftMargin, cellRunGutter } = __classPrivateFieldGet(this, _InteractiveEditor_notebookOptions, "f").getLayoutConfiguration();
        const leftMargin = codeCellLeftMargin + cellRunGutter;
        const inputCellContainerHeight = maxHeight + INPUT_CELL_VERTICAL_PADDING * 2;
        __classPrivateFieldGet(this, _InteractiveEditor_notebookEditorContainer, "f").style.height = `${dimension.height - inputCellContainerHeight}px`;
        __classPrivateFieldGet(this, _InteractiveEditor_notebookWidget, "f").value.layout(dimension.with(dimension.width, dimension.height - inputCellContainerHeight), __classPrivateFieldGet(this, _InteractiveEditor_notebookEditorContainer, "f"));
        __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").layout(__classPrivateFieldGet(this, _InteractiveEditor_instances, "m", _InteractiveEditor_validateDimension).call(this, dimension.width - leftMargin - INPUT_CELL_HORIZONTAL_PADDING_RIGHT, maxHeight));
        __classPrivateFieldGet(this, _InteractiveEditor_inputFocusIndicator, "f").style.height = `${contentHeight}px`;
        __classPrivateFieldGet(this, _InteractiveEditor_inputCellContainer, "f").style.top = `${dimension.height - inputCellContainerHeight}px`;
        __classPrivateFieldGet(this, _InteractiveEditor_inputCellContainer, "f").style.width = `${dimension.width}px`;
    }, _InteractiveEditor_validateDimension = function _InteractiveEditor_validateDimension(width, height) {
        return new DOM.Dimension(Math.max(0, width), Math.max(0, height));
    }, _InteractiveEditor_updateInputDecoration = function _InteractiveEditor_updateInputDecoration() {
        var _a, _b;
        if (!__classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f")) {
            return;
        }
        if (!__classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").hasModel()) {
            return;
        }
        const model = __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").getModel();
        const decorations = [];
        if ((model === null || model === void 0 ? void 0 : model.getValueLength()) === 0) {
            const transparentForeground = (_a = (0, colorRegistry_1.resolveColorValue)(colorRegistry_1.editorForeground, this.themeService.getColorTheme())) === null || _a === void 0 ? void 0 : _a.transparent(0.4);
            const languageId = model.getLanguageId();
            const keybinding = (_b = __classPrivateFieldGet(this, _InteractiveEditor_keybindingService, "f").lookupKeybinding('interactive.execute', __classPrivateFieldGet(this, _InteractiveEditor_contextKeyService, "f"))) === null || _b === void 0 ? void 0 : _b.getLabel();
            const text = nls.localize('interactiveInputPlaceHolder', "Type '{0}' code here and press {1} to run", languageId, keybinding !== null && keybinding !== void 0 ? keybinding : 'ctrl+enter');
            decorations.push({
                range: {
                    startLineNumber: 0,
                    endLineNumber: 0,
                    startColumn: 0,
                    endColumn: 1
                },
                renderOptions: {
                    after: {
                        contentText: text,
                        color: transparentForeground ? transparentForeground.toString() : undefined
                    }
                }
            });
        }
        __classPrivateFieldGet(this, _InteractiveEditor_codeEditorWidget, "f").setDecorations('interactive-decoration', DECORATION_KEY, decorations);
    };
    InteractiveEditor.ID = 'workbench.editor.interactive';
    InteractiveEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, storage_1.IStorageService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, notebookEditorService_1.INotebookEditorService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, codeEditorService_1.ICodeEditorService),
        __param(7, notebookKernelService_1.INotebookKernelService),
        __param(8, language_1.ILanguageService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, actions_1.IMenuService),
        __param(12, contextView_1.IContextMenuService),
        __param(13, editorGroupsService_1.IEditorGroupsService),
        __param(14, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(15, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], InteractiveEditor);
    exports.InteractiveEditor = InteractiveEditor;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        var _a;
        collector.addRule(`
	.interactive-editor .input-cell-container:focus-within .input-editor-container .monaco-editor {
		outline: solid 1px var(--notebook-focused-cell-border-color);
	}
	.interactive-editor .input-cell-container .input-editor-container .monaco-editor {
		outline: solid 1px var(--notebook-inactive-focused-cell-border-color);
	}
	.interactive-editor .input-cell-container .input-focus-indicator {
		top: ${INPUT_CELL_VERTICAL_PADDING}px;
	}
	`);
        const editorBackgroundColor = (_a = theme.getColor(notebookEditorWidget_1.cellEditorBackground)) !== null && _a !== void 0 ? _a : theme.getColor(colorRegistry_1.editorBackground);
        if (editorBackgroundColor) {
            collector.addRule(`.interactive-editor .input-cell-container .monaco-editor-background,
		.interactive-editor .input-cell-container .margin-view-overlays {
			background: ${editorBackgroundColor};
		}`);
        }
    });
});
//# sourceMappingURL=interactiveEditor.js.map