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
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/workbench/browser/parts/editor/editorPane", "vs/platform/telemetry/common/telemetry", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/platform/theme/common/themeService", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/commands/common/commands", "vs/platform/workspace/common/workspace", "vs/platform/editor/common/editor", "vs/workbench/browser/editor", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/browser/link", "vs/base/browser/ui/iconLabel/simpleIconLabel", "vs/platform/theme/common/colorRegistry", "vs/base/common/codicons", "vs/platform/files/common/files", "vs/base/common/errorMessage", "vs/platform/dialogs/common/dialogs", "vs/css!./media/editorplaceholder"], function (require, exports, nls_1, severity_1, editorPane_1, telemetry_1, scrollableElement_1, themeService_1, dom_1, lifecycle_1, storage_1, types_1, commands_1, workspace_1, editor_1, editor_2, instantiation_1, link_1, simpleIconLabel_1, colorRegistry_1, codicons_1, files_1, errorMessage_1, dialogs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ErrorPlaceholderEditor = exports.WorkspaceTrustRequiredPlaceholderEditor = exports.EditorPlaceholder = void 0;
    let EditorPlaceholder = class EditorPlaceholder extends editorPane_1.EditorPane {
        constructor(id, telemetryService, themeService, storageService, instantiationService) {
            super(id, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.inputDisposable = this._register(new lifecycle_1.MutableDisposable());
        }
        createEditor(parent) {
            // Container
            this.container = document.createElement('div');
            this.container.className = 'monaco-editor-pane-placeholder';
            this.container.style.outline = 'none';
            this.container.tabIndex = 0; // enable focus support from the editor part (do not remove)
            // Custom Scrollbars
            this.scrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.container, { horizontal: 1 /* ScrollbarVisibility.Auto */, vertical: 1 /* ScrollbarVisibility.Auto */ }));
            parent.appendChild(this.scrollbar.getDomNode());
        }
        async setInput(input, options, context, token) {
            await super.setInput(input, options, context, token);
            // Check for cancellation
            if (token.isCancellationRequested) {
                return;
            }
            // Render Input
            this.inputDisposable.value = await this.renderInput(input, options);
        }
        async renderInput(input, options) {
            const [container, scrollbar] = (0, types_1.assertAllDefined)(this.container, this.scrollbar);
            // Reset any previous contents
            (0, dom_1.clearNode)(container);
            // Delegate to implementation for contents
            const disposables = new lifecycle_1.DisposableStore();
            const { icon, label, actions } = await this.getContents(input, options, disposables);
            // Icon
            const iconContainer = container.appendChild((0, dom_1.$)('.editor-placeholder-icon-container'));
            const iconWidget = new simpleIconLabel_1.SimpleIconLabel(iconContainer);
            iconWidget.text = icon;
            // Label
            const labelContainer = container.appendChild((0, dom_1.$)('.editor-placeholder-label-container'));
            const labelWidget = document.createElement('span');
            labelWidget.textContent = label;
            labelContainer.appendChild(labelWidget);
            // ARIA label
            container.setAttribute('aria-label', `${(0, editor_2.computeEditorAriaLabel)(input, undefined, this.group, undefined)}, ${label}`);
            // Actions
            const actionsContainer = container.appendChild((0, dom_1.$)('.editor-placeholder-actions-container'));
            for (const action of actions) {
                disposables.add(this.instantiationService.createInstance(link_1.Link, actionsContainer, {
                    label: action.label,
                    href: ''
                }, {
                    opener: () => action.run()
                }));
            }
            // Adjust scrollbar
            scrollbar.scanDomNode();
            return disposables;
        }
        clearInput() {
            if (this.container) {
                (0, dom_1.clearNode)(this.container);
            }
            this.inputDisposable.clear();
            super.clearInput();
        }
        layout(dimension) {
            const [container, scrollbar] = (0, types_1.assertAllDefined)(this.container, this.scrollbar);
            // Pass on to Container
            (0, dom_1.size)(container, dimension.width, dimension.height);
            // Adjust scrollbar
            scrollbar.scanDomNode();
            // Toggle responsive class
            container.classList.toggle('max-height-200px', dimension.height <= 200);
        }
        focus() {
            const container = (0, types_1.assertIsDefined)(this.container);
            container.focus();
        }
        dispose() {
            var _a;
            (_a = this.container) === null || _a === void 0 ? void 0 : _a.remove();
            super.dispose();
        }
    };
    EditorPlaceholder = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, instantiation_1.IInstantiationService)
    ], EditorPlaceholder);
    exports.EditorPlaceholder = EditorPlaceholder;
    let WorkspaceTrustRequiredPlaceholderEditor = class WorkspaceTrustRequiredPlaceholderEditor extends EditorPlaceholder {
        constructor(telemetryService, themeService, commandService, workspaceService, storageService, instantiationService) {
            super(WorkspaceTrustRequiredPlaceholderEditor.ID, telemetryService, themeService, storageService, instantiationService);
            this.commandService = commandService;
            this.workspaceService = workspaceService;
        }
        getTitle() {
            return WorkspaceTrustRequiredPlaceholderEditor.LABEL;
        }
        async getContents() {
            return {
                icon: '$(workspace-untrusted)',
                label: (0, workspace_1.isSingleFolderWorkspaceIdentifier)((0, workspace_1.toWorkspaceIdentifier)(this.workspaceService.getWorkspace())) ?
                    (0, nls_1.localize)('requiresFolderTrustText', "The file is not displayed in the editor because trust has not been granted to the folder.") :
                    (0, nls_1.localize)('requiresWorkspaceTrustText', "The file is not displayed in the editor because trust has not been granted to the workspace."),
                actions: [
                    {
                        label: (0, nls_1.localize)('manageTrust', "Manage Workspace Trust"),
                        run: () => this.commandService.executeCommand('workbench.trust.manage')
                    }
                ]
            };
        }
    };
    WorkspaceTrustRequiredPlaceholderEditor.ID = 'workbench.editors.workspaceTrustRequiredEditor';
    WorkspaceTrustRequiredPlaceholderEditor.LABEL = (0, nls_1.localize)('trustRequiredEditor', "Workspace Trust Required");
    WorkspaceTrustRequiredPlaceholderEditor.DESCRIPTOR = editor_2.EditorPaneDescriptor.create(WorkspaceTrustRequiredPlaceholderEditor, WorkspaceTrustRequiredPlaceholderEditor.ID, WorkspaceTrustRequiredPlaceholderEditor.LABEL);
    WorkspaceTrustRequiredPlaceholderEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, commands_1.ICommandService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, storage_1.IStorageService),
        __param(5, instantiation_1.IInstantiationService)
    ], WorkspaceTrustRequiredPlaceholderEditor);
    exports.WorkspaceTrustRequiredPlaceholderEditor = WorkspaceTrustRequiredPlaceholderEditor;
    let ErrorPlaceholderEditor = class ErrorPlaceholderEditor extends EditorPlaceholder {
        constructor(telemetryService, themeService, storageService, instantiationService, fileService, dialogService) {
            super(ErrorPlaceholderEditor.ID, telemetryService, themeService, storageService, instantiationService);
            this.fileService = fileService;
            this.dialogService = dialogService;
        }
        async getContents(input, options, disposables) {
            const resource = input.resource;
            const group = this.group;
            const error = options.error;
            const isFileNotFound = error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */;
            // Error Label
            let label;
            if (isFileNotFound) {
                label = (0, nls_1.localize)('unavailableResourceErrorEditorText', "The editor could not be opened because the file was not found.");
            }
            else if (error) {
                label = (0, nls_1.localize)('unknownErrorEditorTextWithError', "The editor could not be opened due to an unexpected error: {0}", (0, errorMessage_1.toErrorMessage)(error));
            }
            else {
                label = (0, nls_1.localize)('unknownErrorEditorTextWithoutError', "The editor could not be opened due to an unexpected error.");
            }
            // Actions
            let actions = undefined;
            if ((0, errorMessage_1.isErrorWithActions)(error) && error.actions.length > 0) {
                actions = error.actions.map(action => {
                    return {
                        label: action.label,
                        run: () => {
                            const result = action.run();
                            if (result instanceof Promise) {
                                result.catch(error => this.dialogService.show(severity_1.default.Error, (0, errorMessage_1.toErrorMessage)(error)));
                            }
                        }
                    };
                });
            }
            else if (group) {
                actions = [
                    {
                        label: (0, nls_1.localize)('retry', "Try Again"),
                        run: () => group.openEditor(input, Object.assign(Object.assign({}, options), { source: editor_1.EditorOpenSource.USER /* explicit user gesture */ }))
                    }
                ];
            }
            // Auto-reload when file is added
            if (group && isFileNotFound && resource && this.fileService.hasProvider(resource)) {
                disposables.add(this.fileService.onDidFilesChange(e => {
                    if (e.contains(resource, 1 /* FileChangeType.ADDED */, 0 /* FileChangeType.UPDATED */)) {
                        group.openEditor(input, options);
                    }
                }));
            }
            return { icon: '$(error)', label, actions: actions !== null && actions !== void 0 ? actions : [] };
        }
    };
    ErrorPlaceholderEditor.ID = 'workbench.editors.errorEditor';
    ErrorPlaceholderEditor.LABEL = (0, nls_1.localize)('errorEditor', "Error Editor");
    ErrorPlaceholderEditor.DESCRIPTOR = editor_2.EditorPaneDescriptor.create(ErrorPlaceholderEditor, ErrorPlaceholderEditor.ID, ErrorPlaceholderEditor.LABEL);
    ErrorPlaceholderEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, storage_1.IStorageService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, files_1.IFileService),
        __param(5, dialogs_1.IDialogService)
    ], ErrorPlaceholderEditor);
    exports.ErrorPlaceholderEditor = ErrorPlaceholderEditor;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        // Editor Placeholder Error Icon
        const editorErrorIconForegroundColor = theme.getColor(colorRegistry_1.editorErrorForeground);
        if (editorErrorIconForegroundColor) {
            collector.addRule(`
		.monaco-editor-pane-placeholder .editor-placeholder-icon-container ${codicons_1.Codicon.error.cssSelector} {
			color: ${editorErrorIconForegroundColor};
		}`);
        }
        // Editor Placeholder Warning Icon
        const editorWarningIconForegroundColor = theme.getColor(colorRegistry_1.editorWarningForeground);
        if (editorWarningIconForegroundColor) {
            collector.addRule(`
		.monaco-editor-pane-placeholder .editor-placeholder-icon-container ${codicons_1.Codicon.warning.cssSelector} {
			color: ${editorWarningIconForegroundColor};
		}`);
        }
        // Editor Placeholder Info/Trust Icon
        const editorInfoIconForegroundColor = theme.getColor(colorRegistry_1.editorInfoForeground);
        if (editorInfoIconForegroundColor) {
            collector.addRule(`
		.monaco-editor-pane-placeholder .editor-placeholder-icon-container ${codicons_1.Codicon.info.cssSelector},
		.monaco-editor-pane-placeholder .editor-placeholder-icon-container ${codicons_1.Codicon.workspaceUntrusted.cssSelector} {
			color: ${editorInfoIconForegroundColor};
		}`);
        }
    });
});
//# sourceMappingURL=editorPlaceholder.js.map