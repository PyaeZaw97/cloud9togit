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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/errorMessage", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/editor/common/services/textResourceConfiguration", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/common/editor", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/browser/notebookEditorService", "vs/workbench/contrib/notebook/browser/viewParts/notebookKernelActionViewItem", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookPerformance", "vs/workbench/services/editor/browser/editorDropService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService"], function (require, exports, DOM, actions_1, errorMessage_1, event_1, lifecycle_1, resources_1, textResourceConfiguration_1, nls_1, contextkey_1, files_1, instantiation_1, storage_1, telemetry_1, themeService_1, editorPane_1, editor_1, coreActions_1, notebookEditorService_1, notebookKernelActionViewItem_1, notebookCommon_1, notebookEditorInput_1, notebookPerformance_1, editorDropService_1, editorGroupsService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditor = void 0;
    const NOTEBOOK_EDITOR_VIEW_STATE_PREFERENCE_KEY = 'NotebookEditorViewState';
    let NotebookEditor = class NotebookEditor extends editorPane_1.EditorPane {
        constructor(telemetryService, themeService, _instantiationService, storageService, _editorService, _editorGroupService, _editorDropService, _notebookWidgetService, _contextKeyService, _fileService, configurationService) {
            super(NotebookEditor.ID, telemetryService, themeService, storageService);
            this._instantiationService = _instantiationService;
            this._editorService = _editorService;
            this._editorGroupService = _editorGroupService;
            this._editorDropService = _editorDropService;
            this._notebookWidgetService = _notebookWidgetService;
            this._contextKeyService = _contextKeyService;
            this._fileService = _fileService;
            this._groupListener = this._register(new lifecycle_1.DisposableStore());
            this._widgetDisposableStore = this._register(new lifecycle_1.DisposableStore());
            this._widget = { value: undefined };
            this._inputListener = this._register(new lifecycle_1.MutableDisposable());
            // override onDidFocus and onDidBlur to be based on the NotebookEditorWidget element
            this._onDidFocusWidget = this._register(new event_1.Emitter());
            this._onDidBlurWidget = this._register(new event_1.Emitter());
            this._onDidChangeModel = this._register(new event_1.Emitter());
            this.onDidChangeModel = this._onDidChangeModel.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._editorMemento = this.getEditorMemento(_editorGroupService, configurationService, NOTEBOOK_EDITOR_VIEW_STATE_PREFERENCE_KEY);
            this._register(this._fileService.onDidChangeFileSystemProviderCapabilities(e => this._onDidChangeFileSystemProvider(e.scheme)));
            this._register(this._fileService.onDidChangeFileSystemProviderRegistrations(e => this._onDidChangeFileSystemProvider(e.scheme)));
        }
        get onDidFocus() { return this._onDidFocusWidget.event; }
        get onDidBlur() { return this._onDidBlurWidget.event; }
        _onDidChangeFileSystemProvider(scheme) {
            var _a;
            if (this.input instanceof notebookEditorInput_1.NotebookEditorInput && ((_a = this.input.resource) === null || _a === void 0 ? void 0 : _a.scheme) === scheme) {
                this._updateReadonly(this.input);
            }
        }
        _onDidChangeInputCapabilities(input) {
            if (this.input === input) {
                this._updateReadonly(input);
            }
        }
        _updateReadonly(input) {
            if (this._widget.value) {
                this._widget.value.setOptions({ isReadOnly: input.hasCapability(2 /* EditorInputCapabilities.Readonly */) });
            }
        }
        get textModel() {
            var _a;
            return (_a = this._widget.value) === null || _a === void 0 ? void 0 : _a.textModel;
        }
        get minimumWidth() { return 220; }
        get maximumWidth() { return Number.POSITIVE_INFINITY; }
        // these setters need to exist because this extends from EditorPane
        set minimumWidth(value) { }
        set maximumWidth(value) { }
        //#region Editor Core
        get scopedContextKeyService() {
            var _a;
            return (_a = this._widget.value) === null || _a === void 0 ? void 0 : _a.scopedContextKeyService;
        }
        createEditor(parent) {
            this._rootElement = DOM.append(parent, DOM.$('.notebook-editor'));
        }
        getDomNode() {
            return this._rootElement;
        }
        getActionViewItem(action) {
            if (action.id === coreActions_1.SELECT_KERNEL_ID) {
                // this is being disposed by the consumer
                return this._instantiationService.createInstance(notebookKernelActionViewItem_1.NotebooKernelActionViewItem, action, this);
            }
            return undefined;
        }
        getControl() {
            return this._widget.value;
        }
        setEditorVisible(visible, group) {
            super.setEditorVisible(visible, group);
            if (group) {
                this._groupListener.clear();
                this._groupListener.add(group.onWillCloseEditor(e => this._saveEditorViewState(e.editor)));
                this._groupListener.add(group.onDidModelChange(() => {
                    var _a, _b;
                    if (this._editorGroupService.activeGroup !== group) {
                        (_b = (_a = this._widget) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.updateEditorFocus();
                    }
                }));
            }
            if (!visible) {
                this._saveEditorViewState(this.input);
                if (this.input && this._widget.value) {
                    // the widget is not transfered to other editor inputs
                    this._widget.value.onWillHide();
                }
            }
        }
        focus() {
            var _a;
            super.focus();
            (_a = this._widget.value) === null || _a === void 0 ? void 0 : _a.focus();
        }
        hasFocus() {
            const activeElement = document.activeElement;
            const value = this._widget.value;
            return !!value && (DOM.isAncestor(activeElement, value.getDomNode() || DOM.isAncestor(activeElement, value.getOverflowContainerDomNode())));
        }
        async setInput(input, options, context, token, noRetry) {
            var _a, _b;
            try {
                (0, notebookPerformance_1.clearMarks)(input.resource);
                (0, notebookPerformance_1.mark)(input.resource, 'startTime');
                const group = this.group;
                this._inputListener.value = input.onDidChangeCapabilities(() => this._onDidChangeInputCapabilities(input));
                this._widgetDisposableStore.clear();
                // there currently is a widget which we still own so
                // we need to hide it before getting a new widget
                if (this._widget.value) {
                    this._widget.value.onWillHide();
                }
                this._widget = this._instantiationService.invokeFunction(this._notebookWidgetService.retrieveWidget, group, input);
                this._widgetDisposableStore.add(this._widget.value.onDidChangeModel(() => this._onDidChangeModel.fire()));
                this._widgetDisposableStore.add(this._widget.value.onDidChangeActiveCell(() => this._onDidChangeSelection.fire({ reason: 2 /* EditorPaneSelectionChangeReason.USER */ })));
                if (this._dimension) {
                    this._widget.value.layout(this._dimension, this._rootElement);
                }
                // only now `setInput` and yield/await. this is AFTER the actual widget is ready. This is very important
                // so that others synchronously receive a notebook editor with the correct widget being set
                await super.setInput(input, options, context, token);
                const model = await input.resolve();
                (0, notebookPerformance_1.mark)(input.resource, 'inputLoaded');
                // Check for cancellation
                if (token.isCancellationRequested) {
                    return undefined;
                }
                // The widget has been taken away again. This can happen when the tab has been closed while
                // loading was in progress, in particular when open the same resource as different view type.
                // When this happen, retry once
                if (!this._widget.value) {
                    if (noRetry) {
                        return undefined;
                    }
                    return this.setInput(input, options, context, token, true);
                }
                if (model === null) {
                    throw new Error((0, nls_1.localize)('fail.noEditor', "Cannot open resource with notebook editor type '{0}', please check if you have the right extension installed and enabled.", input.viewType));
                }
                this._widgetDisposableStore.add(model.notebook.onDidChangeContent(() => this._onDidChangeSelection.fire({ reason: 3 /* EditorPaneSelectionChangeReason.EDIT */ })));
                const viewState = (_a = options === null || options === void 0 ? void 0 : options.viewState) !== null && _a !== void 0 ? _a : this._loadNotebookEditorViewState(input);
                (_b = this._widget.value) === null || _b === void 0 ? void 0 : _b.setParentContextKeyService(this._contextKeyService);
                await this._widget.value.setModel(model.notebook, viewState);
                const isReadOnly = input.hasCapability(2 /* EditorInputCapabilities.Readonly */);
                await this._widget.value.setOptions(Object.assign(Object.assign({}, options), { isReadOnly }));
                this._widgetDisposableStore.add(this._widget.value.onDidFocusWidget(() => this._onDidFocusWidget.fire()));
                this._widgetDisposableStore.add(this._widget.value.onDidBlurWidget(() => this._onDidBlurWidget.fire()));
                this._widgetDisposableStore.add(this._editorDropService.createEditorDropTarget(this._widget.value.getDomNode(), {
                    containsGroup: (group) => { var _a; return ((_a = this.group) === null || _a === void 0 ? void 0 : _a.id) === group.id; }
                }));
                (0, notebookPerformance_1.mark)(input.resource, 'editorLoaded');
                const perfMarks = (0, notebookPerformance_1.getAndClearMarks)(input.resource);
                if (perfMarks) {
                    const startTime = perfMarks['startTime'];
                    const extensionActivated = perfMarks['extensionActivated'];
                    const inputLoaded = perfMarks['inputLoaded'];
                    const customMarkdownLoaded = perfMarks['customMarkdownLoaded'];
                    const editorLoaded = perfMarks['editorLoaded'];
                    if (startTime !== undefined
                        && extensionActivated !== undefined
                        && inputLoaded !== undefined
                        && customMarkdownLoaded !== undefined
                        && editorLoaded !== undefined) {
                        this.telemetryService.publicLog2('notebook/editorOpenPerf', {
                            scheme: model.notebook.uri.scheme,
                            ext: (0, resources_1.extname)(model.notebook.uri),
                            viewType: model.notebook.viewType,
                            extensionActivated: extensionActivated - startTime,
                            inputLoaded: inputLoaded - startTime,
                            webviewCommLoaded: inputLoaded - startTime,
                            customMarkdownLoaded: customMarkdownLoaded - startTime,
                            editorLoaded: editorLoaded - startTime
                        });
                    }
                    else {
                        console.warn(`notebook file open perf marks are broken: startTime ${startTime}, extensionActiviated ${extensionActivated}, inputLoaded ${inputLoaded}, customMarkdownLoaded ${customMarkdownLoaded}, editorLoaded ${editorLoaded}`);
                    }
                }
            }
            catch (e) {
                const error = (0, errorMessage_1.createErrorWithActions)(e instanceof Error ? e : new Error(e.message), [
                    (0, actions_1.toAction)({
                        id: 'workbench.notebook.action.openInTextEditor', label: (0, nls_1.localize)('notebookOpenInTextEditor', "Open in Text Editor"), run: async () => {
                            var _a;
                            const activeEditorPane = this._editorService.activeEditorPane;
                            if (!activeEditorPane) {
                                return;
                            }
                            const activeEditorResource = editor_1.EditorResourceAccessor.getCanonicalUri(activeEditorPane.input);
                            if (!activeEditorResource) {
                                return;
                            }
                            if (activeEditorResource.toString() === ((_a = input.resource) === null || _a === void 0 ? void 0 : _a.toString())) {
                                // Replace the current editor with the text editor
                                return this._editorService.openEditor({
                                    resource: activeEditorResource,
                                    options: {
                                        override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id,
                                        pinned: true // new file gets pinned by default
                                    }
                                });
                            }
                            return;
                        }
                    })
                ]);
                throw error;
            }
        }
        clearInput() {
            this._inputListener.clear();
            if (this._widget.value) {
                this._saveEditorViewState(this.input);
                this._widget.value.onWillHide();
            }
            super.clearInput();
        }
        setOptions(options) {
            var _a;
            (_a = this._widget.value) === null || _a === void 0 ? void 0 : _a.setOptions(options);
            super.setOptions(options);
        }
        saveState() {
            this._saveEditorViewState(this.input);
            super.saveState();
        }
        getViewState() {
            const input = this.input;
            if (!(input instanceof notebookEditorInput_1.NotebookEditorInput)) {
                return undefined;
            }
            this._saveEditorViewState(input);
            return this._loadNotebookEditorViewState(input);
        }
        getSelection() {
            var _a;
            if (this._widget.value) {
                const cellUri = (_a = this._widget.value.getActiveCell()) === null || _a === void 0 ? void 0 : _a.uri;
                if (cellUri) {
                    return new NotebookEditorSelection(cellUri);
                }
            }
            return undefined;
        }
        _saveEditorViewState(input) {
            if (this.group && this._widget.value && input instanceof notebookEditorInput_1.NotebookEditorInput) {
                if (this._widget.value.isDisposed) {
                    return;
                }
                const state = this._widget.value.getEditorViewState();
                this._editorMemento.saveEditorState(this.group, input.resource, state);
            }
        }
        _loadNotebookEditorViewState(input) {
            var _a, _b;
            let result;
            if (this.group) {
                result = this._editorMemento.loadEditorState(this.group, input.resource);
            }
            if (result) {
                return result;
            }
            // when we don't have a view state for the group/input-tuple then we try to use an existing
            // editor for the same resource.
            for (const group of this._editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                if (group.activeEditorPane !== this && group.activeEditorPane instanceof NotebookEditor && ((_a = group.activeEditor) === null || _a === void 0 ? void 0 : _a.matches(input))) {
                    return (_b = group.activeEditorPane._widget.value) === null || _b === void 0 ? void 0 : _b.getEditorViewState();
                }
            }
            return;
        }
        layout(dimension) {
            var _a, _b;
            this._rootElement.classList.toggle('mid-width', dimension.width < 1000 && dimension.width >= 600);
            this._rootElement.classList.toggle('narrow-width', dimension.width < 600);
            this._dimension = dimension;
            if (!this._widget.value || !(this._input instanceof notebookEditorInput_1.NotebookEditorInput)) {
                return;
            }
            if (this._input.resource.toString() !== ((_a = this.textModel) === null || _a === void 0 ? void 0 : _a.uri.toString()) && ((_b = this._widget.value) === null || _b === void 0 ? void 0 : _b.hasModel())) {
                // input and widget mismatch
                // this happens when
                // 1. open document A, pin the document
                // 2. open document B
                // 3. close document B
                // 4. a layout is triggered
                return;
            }
            this._widget.value.layout(this._dimension, this._rootElement);
        }
        //#endregion
        //#region Editor Features
        //#endregion
        dispose() {
            super.dispose();
        }
    };
    NotebookEditor.ID = notebookCommon_1.NOTEBOOK_EDITOR_ID;
    NotebookEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, editorService_1.IEditorService),
        __param(5, editorGroupsService_1.IEditorGroupsService),
        __param(6, editorDropService_1.IEditorDropService),
        __param(7, notebookEditorService_1.INotebookEditorService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, files_1.IFileService),
        __param(10, textResourceConfiguration_1.ITextResourceConfigurationService)
    ], NotebookEditor);
    exports.NotebookEditor = NotebookEditor;
    class NotebookEditorSelection {
        constructor(cellUri) {
            this.cellUri = cellUri;
        }
        compare(other) {
            if (!(other instanceof NotebookEditorSelection)) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            if ((0, resources_1.isEqual)(this.cellUri, other.cellUri)) {
                return 1 /* EditorPaneSelectionCompareResult.IDENTICAL */;
            }
            return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
        }
        restore(options) {
            const notebookOptions = {
                cellOptions: {
                    resource: this.cellUri
                }
            };
            Object.assign(notebookOptions, options);
            return notebookOptions;
        }
        log() {
            return this.cellUri.fragment;
        }
    }
});
//# sourceMappingURL=notebookEditor.js.map