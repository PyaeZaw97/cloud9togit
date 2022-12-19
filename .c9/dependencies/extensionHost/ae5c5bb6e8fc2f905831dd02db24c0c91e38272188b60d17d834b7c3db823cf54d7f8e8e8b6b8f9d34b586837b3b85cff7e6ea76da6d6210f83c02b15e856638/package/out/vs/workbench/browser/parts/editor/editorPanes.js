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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/base/common/severity", "vs/base/common/lifecycle", "vs/workbench/common/editor", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/workbench/browser/parts/editor/editor", "vs/base/common/types", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/browser/parts/editor/editorPlaceholder", "vs/platform/editor/common/editor", "vs/base/common/errors", "vs/base/common/errorMessage", "vs/platform/log/common/log", "vs/platform/dialogs/common/dialogs"], function (require, exports, nls_1, event_1, severity_1, lifecycle_1, editor_1, dom_1, platform_1, layoutService_1, instantiation_1, progress_1, editor_2, types_1, workspaceTrust_1, editorPlaceholder_1, editor_3, errors_1, errorMessage_1, log_1, dialogs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorPanes = void 0;
    let EditorPanes = class EditorPanes extends lifecycle_1.Disposable {
        constructor(parent, groupView, layoutService, instantiationService, editorProgressService, workspaceTrustService, logService, dialogService) {
            super();
            this.parent = parent;
            this.groupView = groupView;
            this.layoutService = layoutService;
            this.instantiationService = instantiationService;
            this.editorProgressService = editorProgressService;
            this.workspaceTrustService = workspaceTrustService;
            this.logService = logService;
            this.dialogService = dialogService;
            //#region Events
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidChangeSizeConstraints = this._register(new event_1.Emitter());
            this.onDidChangeSizeConstraints = this._onDidChangeSizeConstraints.event;
            this._activeEditorPane = null;
            this.editorPanes = [];
            this.activeEditorPaneDisposables = this._register(new lifecycle_1.DisposableStore());
            this.editorOperation = this._register(new progress_1.LongRunningOperation(this.editorProgressService));
            this.editorPanesRegistry = platform_1.Registry.as(editor_1.EditorExtensions.EditorPane);
            this.registerListeners();
        }
        //#endregion
        get minimumWidth() { var _a, _b; return (_b = (_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.minimumWidth) !== null && _b !== void 0 ? _b : editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width; }
        get minimumHeight() { var _a, _b; return (_b = (_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.minimumHeight) !== null && _b !== void 0 ? _b : editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height; }
        get maximumWidth() { var _a, _b; return (_b = (_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.maximumWidth) !== null && _b !== void 0 ? _b : editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.width; }
        get maximumHeight() { var _a, _b; return (_b = (_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.maximumHeight) !== null && _b !== void 0 ? _b : editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.height; }
        get activeEditorPane() { return this._activeEditorPane; }
        registerListeners() {
            this._register(this.workspaceTrustService.onDidChangeTrust(() => this.onDidChangeWorkspaceTrust()));
        }
        onDidChangeWorkspaceTrust() {
            var _a, _b;
            // If the active editor pane requires workspace trust
            // we need to re-open it anytime trust changes to
            // account for it.
            // For that we explicitly call into the group-view
            // to handle errors properly.
            const editor = (_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.input;
            const options = (_b = this._activeEditorPane) === null || _b === void 0 ? void 0 : _b.options;
            if (editor === null || editor === void 0 ? void 0 : editor.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */)) {
                this.groupView.openEditor(editor, options);
            }
        }
        async openEditor(editor, options, context = Object.create(null)) {
            try {
                return await this.doOpenEditor(this.getEditorPaneDescriptor(editor), editor, options, context);
            }
            catch (error) {
                // First check if caller instructed us to ignore error handling
                if (options === null || options === void 0 ? void 0 : options.ignoreError) {
                    return { error };
                }
                // In case of an error when opening an editor, we still want to show
                // an editor in the desired location to preserve the user intent and
                // view state (e.g. when restoring).
                //
                // For that reason we have place holder editors that can convey a
                // message with actions the user can click on.
                return this.doShowError(error, editor, options, context);
            }
        }
        async doShowError(error, editor, options, context) {
            // Always log the error to figure out what is going on
            this.logService.error(error);
            // Show as modal dialog when explicit user action
            let errorHandled = false;
            if ((options === null || options === void 0 ? void 0 : options.source) === editor_3.EditorOpenSource.USER) {
                // Extract possible error actions from the error
                let errorActions = undefined;
                if ((0, errorMessage_1.isErrorWithActions)(error)) {
                    errorActions = error.actions;
                }
                const buttons = [];
                if (errorActions && errorActions.length > 0) {
                    for (const errorAction of errorActions) {
                        buttons.push(errorAction.label);
                    }
                }
                else {
                    buttons.push((0, nls_1.localize)('ok', 'OK'));
                }
                let cancelId = undefined;
                if (buttons.length === 1) {
                    buttons.push((0, nls_1.localize)('cancel', "Cancel"));
                    cancelId = 1;
                }
                const result = await this.dialogService.show(severity_1.default.Error, (0, nls_1.localize)('editorOpenErrorDialog', "Unable to open '{0}'", editor.getName()), buttons, {
                    detail: (0, errorMessage_1.toErrorMessage)(error),
                    cancelId
                });
                // Make sure to run any error action if present
                if (result.choice !== cancelId && errorActions) {
                    const errorAction = errorActions[result.choice];
                    if (errorAction) {
                        const result = errorAction.run();
                        if (result instanceof Promise) {
                            result.catch(error => this.dialogService.show(severity_1.default.Error, (0, errorMessage_1.toErrorMessage)(error)));
                        }
                        errorHandled = true; // consider the error as handled!
                    }
                }
            }
            // Return early if the user dealt with the error already
            if (errorHandled) {
                return { error };
            }
            // Show as editor placeholder: pass over the error to display
            const editorPlaceholderOptions = Object.assign({}, options);
            if (!(0, errors_1.isCancellationError)(error)) {
                editorPlaceholderOptions.error = error;
            }
            return Object.assign(Object.assign({}, (await this.doOpenEditor(editorPlaceholder_1.ErrorPlaceholderEditor.DESCRIPTOR, editor, editorPlaceholderOptions, context))), { error });
        }
        async doOpenEditor(descriptor, editor, options, context = Object.create(null)) {
            // Editor pane
            const pane = this.doShowEditorPane(descriptor);
            // Apply input to pane
            const { changed, cancelled } = await this.doSetInput(pane, editor, options, context);
            // Focus unless cancelled
            if (!cancelled) {
                const focus = !options || !options.preserveFocus;
                if (focus) {
                    pane.focus();
                }
            }
            return { pane, changed, cancelled };
        }
        getEditorPaneDescriptor(editor) {
            if (editor.hasCapability(16 /* EditorInputCapabilities.RequiresTrust */) && !this.workspaceTrustService.isWorkspaceTrusted()) {
                // Workspace trust: if an editor signals it needs workspace trust
                // but the current workspace is untrusted, we fallback to a generic
                // editor descriptor to indicate this an do NOT load the registered
                // editor.
                return editorPlaceholder_1.WorkspaceTrustRequiredPlaceholderEditor.DESCRIPTOR;
            }
            return (0, types_1.assertIsDefined)(this.editorPanesRegistry.getEditorPane(editor));
        }
        doShowEditorPane(descriptor) {
            // Return early if the currently active editor pane can handle the input
            if (this._activeEditorPane && descriptor.describes(this._activeEditorPane)) {
                return this._activeEditorPane;
            }
            // Hide active one first
            this.doHideActiveEditorPane();
            // Create editor pane
            const editorPane = this.doCreateEditorPane(descriptor);
            // Set editor as active
            this.doSetActiveEditorPane(editorPane);
            // Show editor
            const container = (0, types_1.assertIsDefined)(editorPane.getContainer());
            this.parent.appendChild(container);
            (0, dom_1.show)(container);
            // Indicate to editor that it is now visible
            editorPane.setVisible(true, this.groupView);
            // Layout
            if (this.dimension) {
                editorPane.layout(this.dimension);
            }
            return editorPane;
        }
        doCreateEditorPane(descriptor) {
            // Instantiate editor
            const editorPane = this.doInstantiateEditorPane(descriptor);
            // Create editor container as needed
            if (!editorPane.getContainer()) {
                const editorPaneContainer = document.createElement('div');
                editorPaneContainer.classList.add('editor-instance');
                editorPane.create(editorPaneContainer);
            }
            return editorPane;
        }
        doInstantiateEditorPane(descriptor) {
            // Return early if already instantiated
            const existingEditorPane = this.editorPanes.find(editorPane => descriptor.describes(editorPane));
            if (existingEditorPane) {
                return existingEditorPane;
            }
            // Otherwise instantiate new
            const editorPane = this._register(descriptor.instantiate(this.instantiationService));
            this.editorPanes.push(editorPane);
            return editorPane;
        }
        doSetActiveEditorPane(editorPane) {
            this._activeEditorPane = editorPane;
            // Clear out previous active editor pane listeners
            this.activeEditorPaneDisposables.clear();
            // Listen to editor pane changes
            if (editorPane) {
                this.activeEditorPaneDisposables.add(editorPane.onDidChangeSizeConstraints(e => this._onDidChangeSizeConstraints.fire(e)));
                this.activeEditorPaneDisposables.add(editorPane.onDidFocus(() => this._onDidFocus.fire()));
            }
            // Indicate that size constraints could have changed due to new editor
            this._onDidChangeSizeConstraints.fire(undefined);
        }
        async doSetInput(editorPane, editor, options, context) {
            var _a;
            // If the input did not change, return early and only
            // apply the options unless the options instruct us to
            // force open it even if it is the same
            const inputMatches = (_a = editorPane.input) === null || _a === void 0 ? void 0 : _a.matches(editor);
            if (inputMatches && !(options === null || options === void 0 ? void 0 : options.forceReload)) {
                editorPane.setOptions(options);
                return { changed: false, cancelled: false };
            }
            // Start a new editor input operation to report progress
            // and to support cancellation. Any new operation that is
            // started will cancel the previous one.
            const operation = this.editorOperation.start(this.layoutService.isRestored() ? 800 : 3200);
            let cancelled = false;
            try {
                // Clear the current input before setting new input
                // This ensures that a slow loading input will not
                // be visible for the duration of the new input to
                // load (https://github.com/microsoft/vscode/issues/34697)
                editorPane.clearInput();
                // Set the input to the editor pane
                await editorPane.setInput(editor, options, context, operation.token);
                if (!operation.isCurrent()) {
                    cancelled = true;
                }
            }
            finally {
                operation.stop();
            }
            return { changed: !inputMatches, cancelled };
        }
        doHideActiveEditorPane() {
            if (!this._activeEditorPane) {
                return;
            }
            // Stop any running operation
            this.editorOperation.stop();
            // Indicate to editor pane before removing the editor from
            // the DOM to give a chance to persist certain state that
            // might depend on still being the active DOM element.
            this._activeEditorPane.clearInput();
            this._activeEditorPane.setVisible(false, this.groupView);
            // Remove editor pane from parent
            const editorPaneContainer = this._activeEditorPane.getContainer();
            if (editorPaneContainer) {
                this.parent.removeChild(editorPaneContainer);
                (0, dom_1.hide)(editorPaneContainer);
            }
            // Clear active editor pane
            this.doSetActiveEditorPane(null);
        }
        closeEditor(editor) {
            var _a;
            if (((_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.input) && editor.matches(this._activeEditorPane.input)) {
                this.doHideActiveEditorPane();
            }
        }
        setVisible(visible) {
            var _a;
            (_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.setVisible(visible, this.groupView);
        }
        layout(dimension) {
            var _a;
            this.dimension = dimension;
            (_a = this._activeEditorPane) === null || _a === void 0 ? void 0 : _a.layout(dimension);
        }
    };
    EditorPanes = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, progress_1.IEditorProgressService),
        __param(5, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(6, log_1.ILogService),
        __param(7, dialogs_1.IDialogService)
    ], EditorPanes);
    exports.EditorPanes = EditorPanes;
});
//# sourceMappingURL=editorPanes.js.map