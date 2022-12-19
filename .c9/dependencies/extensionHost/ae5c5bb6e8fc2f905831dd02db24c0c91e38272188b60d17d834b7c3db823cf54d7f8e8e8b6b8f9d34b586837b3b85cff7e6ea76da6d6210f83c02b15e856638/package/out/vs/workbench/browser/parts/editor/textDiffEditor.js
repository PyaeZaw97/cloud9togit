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
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/types", "vs/editor/browser/editorBrowser", "vs/workbench/browser/parts/editor/textEditor", "vs/workbench/common/editor", "vs/workbench/common/editor/editorOptions", "vs/workbench/common/editor/diffEditorInput", "vs/editor/browser/widget/diffNavigator", "vs/editor/browser/widget/diffEditorWidget", "vs/workbench/common/editor/textDiffEditorModel", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/base/common/uri", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/editor/common/editor", "vs/platform/contextkey/common/contextkey", "vs/base/common/resources", "vs/base/browser/dom", "vs/platform/files/common/files"], function (require, exports, nls_1, objects_1, types_1, editorBrowser_1, textEditor_1, editor_1, editorOptions_1, diffEditorInput_1, diffNavigator_1, diffEditorWidget_1, textDiffEditorModel_1, telemetry_1, storage_1, textResourceConfiguration_1, instantiation_1, themeService_1, lifecycle_1, platform_1, uri_1, editorGroupsService_1, editorService_1, editor_2, contextkey_1, resources_1, dom_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextDiffEditor = void 0;
    /**
     * The text editor that leverages the diff text editor for the editing experience.
     */
    let TextDiffEditor = class TextDiffEditor extends textEditor_1.BaseTextEditor {
        constructor(telemetryService, instantiationService, storageService, configurationService, editorService, themeService, editorGroupService, fileService) {
            super(TextDiffEditor.ID, telemetryService, instantiationService, storageService, configurationService, themeService, editorService, editorGroupService);
            this.fileService = fileService;
            this.diffNavigatorDisposables = this._register(new lifecycle_1.DisposableStore());
            this.inputListener = this._register(new lifecycle_1.MutableDisposable());
            // Listen to file system provider changes
            this._register(this.fileService.onDidChangeFileSystemProviderCapabilities(e => this.onDidChangeFileSystemProvider(e.scheme)));
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(e => this.onDidChangeFileSystemProvider(e.scheme)));
        }
        get scopedContextKeyService() {
            const control = this.getControl();
            if (!control) {
                return undefined;
            }
            const originalEditor = control.getOriginalEditor();
            const modifiedEditor = control.getModifiedEditor();
            return (originalEditor.hasTextFocus() ? originalEditor : modifiedEditor).invokeWithinContext(accessor => accessor.get(contextkey_1.IContextKeyService));
        }
        onDidChangeFileSystemProvider(scheme) {
            var _a, _b;
            if (this.input instanceof diffEditorInput_1.DiffEditorInput && (((_a = this.input.original.resource) === null || _a === void 0 ? void 0 : _a.scheme) === scheme || ((_b = this.input.modified.resource) === null || _b === void 0 ? void 0 : _b.scheme) === scheme)) {
                this.updateReadonly(this.input);
            }
        }
        onDidChangeInputCapabilities(input) {
            if (this.input === input) {
                this.updateReadonly(input);
            }
        }
        updateReadonly(input) {
            const control = this.getControl();
            if (control) {
                control.updateOptions({
                    readOnly: input.modified.hasCapability(2 /* EditorInputCapabilities.Readonly */),
                    originalEditable: !input.original.hasCapability(2 /* EditorInputCapabilities.Readonly */)
                });
            }
        }
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return (0, nls_1.localize)('textDiffEditor', "Text Diff Editor");
        }
        createEditorControl(parent, configuration) {
            return this.instantiationService.createInstance(diffEditorWidget_1.DiffEditorWidget, parent, configuration, {});
        }
        async setInput(input, options, context, token) {
            var _a, _b;
            // Update our listener for input capabilities
            this.inputListener.value = input.onDidChangeCapabilities(() => this.onDidChangeInputCapabilities(input));
            // Dispose previous diff navigator
            this.diffNavigatorDisposables.clear();
            // Set input and resolve
            await super.setInput(input, options, context, token);
            try {
                const resolvedModel = await input.resolve();
                // Check for cancellation
                if (token.isCancellationRequested) {
                    return undefined;
                }
                // Fallback to open as binary if not text
                if (!(resolvedModel instanceof textDiffEditorModel_1.TextDiffEditorModel)) {
                    this.openAsBinary(input, options);
                    return undefined;
                }
                // Set Editor Model
                const diffEditor = (0, types_1.assertIsDefined)(this.getControl());
                const resolvedDiffEditorModel = resolvedModel;
                diffEditor.setModel((0, types_1.withUndefinedAsNull)(resolvedDiffEditorModel.textDiffEditorModel));
                // Restore view state (unless provided by options)
                let hasPreviousViewState = false;
                if (!(0, editor_1.isTextEditorViewState)(options === null || options === void 0 ? void 0 : options.viewState)) {
                    hasPreviousViewState = this.restoreTextDiffEditorViewState(input, options, context, diffEditor);
                }
                // Apply options to editor if any
                let optionsGotApplied = false;
                if (options) {
                    optionsGotApplied = (0, editorOptions_1.applyTextEditorOptions)(options, diffEditor, 1 /* ScrollType.Immediate */);
                }
                // Diff navigator
                this.diffNavigator = new diffNavigator_1.DiffNavigator(diffEditor, {
                    alwaysRevealFirst: !optionsGotApplied && !hasPreviousViewState // only reveal first change if we had no options or viewstate
                });
                this.diffNavigatorDisposables.add(this.diffNavigator);
                // Since the resolved model provides information about being readonly
                // or not, we apply it here to the editor even though the editor input
                // was already asked for being readonly or not. The rationale is that
                // a resolved model might have more specific information about being
                // readonly or not that the input did not have.
                diffEditor.updateOptions({
                    readOnly: (_a = resolvedDiffEditorModel.modifiedModel) === null || _a === void 0 ? void 0 : _a.isReadonly(),
                    originalEditable: !((_b = resolvedDiffEditorModel.originalModel) === null || _b === void 0 ? void 0 : _b.isReadonly())
                });
            }
            catch (error) {
                // In case we tried to open a file and the response indicates that this is not a text file, fallback to binary diff.
                if (this.isFileBinaryError(error)) {
                    this.openAsBinary(input, options);
                    return;
                }
                throw error;
            }
        }
        restoreTextDiffEditorViewState(editor, options, context, control) {
            const editorViewState = this.loadEditorViewState(editor, context);
            if (editorViewState) {
                if ((options === null || options === void 0 ? void 0 : options.selection) && editorViewState.modified) {
                    editorViewState.modified.cursorState = []; // prevent duplicate selections via options
                }
                control.restoreViewState(editorViewState);
                return true;
            }
            return false;
        }
        openAsBinary(input, options) {
            var _a, _b, _c;
            const original = input.original;
            const modified = input.modified;
            const binaryDiffInput = this.instantiationService.createInstance(diffEditorInput_1.DiffEditorInput, input.getName(), input.getDescription(), original, modified, true);
            // Forward binary flag to input if supported
            const fileEditorFactory = platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).getFileEditorFactory();
            if (fileEditorFactory.isFileEditor(original)) {
                original.setForceOpenAsBinary();
            }
            if (fileEditorFactory.isFileEditor(modified)) {
                modified.setForceOpenAsBinary();
            }
            // Replace this editor with the binary one
            ((_a = this.group) !== null && _a !== void 0 ? _a : this.editorGroupService.activeGroup).replaceEditors([{
                    editor: input,
                    replacement: binaryDiffInput,
                    options: Object.assign(Object.assign({}, options), { 
                        // Make sure to not steal away the currently active group
                        // because we are triggering another openEditor() call
                        // and do not control the initial intent that resulted
                        // in us now opening as binary.
                        activation: editor_2.EditorActivation.PRESERVE, pinned: (_b = this.group) === null || _b === void 0 ? void 0 : _b.isPinned(input), sticky: (_c = this.group) === null || _c === void 0 ? void 0 : _c.isSticky(input) })
                }]);
        }
        computeConfiguration(configuration) {
            const editorConfiguration = super.computeConfiguration(configuration);
            // Handle diff editor specially by merging in diffEditor configuration
            if ((0, types_1.isObject)(configuration.diffEditor)) {
                const diffEditorConfiguration = (0, objects_1.deepClone)(configuration.diffEditor);
                // User settings defines `diffEditor.codeLens`, but here we rename that to `diffEditor.diffCodeLens` to avoid collisions with `editor.codeLens`.
                diffEditorConfiguration.diffCodeLens = diffEditorConfiguration.codeLens;
                delete diffEditorConfiguration.codeLens;
                // User settings defines `diffEditor.wordWrap`, but here we rename that to `diffEditor.diffWordWrap` to avoid collisions with `editor.wordWrap`.
                diffEditorConfiguration.diffWordWrap = diffEditorConfiguration.wordWrap;
                delete diffEditorConfiguration.wordWrap;
                Object.assign(editorConfiguration, diffEditorConfiguration);
            }
            return editorConfiguration;
        }
        getConfigurationOverrides() {
            const options = super.getConfigurationOverrides();
            options.readOnly = this.input instanceof diffEditorInput_1.DiffEditorInput && this.input.modified.hasCapability(2 /* EditorInputCapabilities.Readonly */);
            options.originalEditable = this.input instanceof diffEditorInput_1.DiffEditorInput && !this.input.original.hasCapability(2 /* EditorInputCapabilities.Readonly */);
            options.lineDecorationsWidth = '2ch';
            return options;
        }
        isFileBinaryError(error) {
            if ((0, types_1.isArray)(error)) {
                const errors = error;
                return errors.some(error => this.isFileBinaryError(error));
            }
            return error.textFileOperationResult === 0 /* TextFileOperationResult.FILE_IS_BINARY */;
        }
        clearInput() {
            super.clearInput();
            // Clear input listener
            this.inputListener.clear();
            // Dispose previous diff navigator
            this.diffNavigatorDisposables.clear();
            // Clear Model
            const diffEditor = this.getControl();
            diffEditor === null || diffEditor === void 0 ? void 0 : diffEditor.setModel(null);
        }
        getDiffNavigator() {
            return this.diffNavigator;
        }
        getControl() {
            return super.getControl();
        }
        tracksEditorViewState(input) {
            return input instanceof diffEditorInput_1.DiffEditorInput;
        }
        computeEditorViewState(resource) {
            const control = this.getControl();
            if (!(0, editorBrowser_1.isDiffEditor)(control)) {
                return undefined;
            }
            const model = control.getModel();
            if (!model || !model.modified || !model.original) {
                return undefined; // view state always needs a model
            }
            const modelUri = this.toEditorViewStateResource(model);
            if (!modelUri) {
                return undefined; // model URI is needed to make sure we save the view state correctly
            }
            if (!(0, resources_1.isEqual)(modelUri, resource)) {
                return undefined; // prevent saving view state for a model that is not the expected one
            }
            return (0, types_1.withNullAsUndefined)(control.saveViewState());
        }
        toEditorViewStateResource(modelOrInput) {
            let original;
            let modified;
            if (modelOrInput instanceof diffEditorInput_1.DiffEditorInput) {
                original = modelOrInput.original.resource;
                modified = modelOrInput.modified.resource;
            }
            else if (!(0, editor_1.isEditorInput)(modelOrInput)) {
                original = modelOrInput.original.uri;
                modified = modelOrInput.modified.uri;
            }
            if (!original || !modified) {
                return undefined;
            }
            // create a URI that is the Base64 concatenation of original + modified resource
            return uri_1.URI.from({ scheme: 'diff', path: `${(0, dom_1.multibyteAwareBtoa)(original.toString())}${(0, dom_1.multibyteAwareBtoa)(modified.toString())}` });
        }
    };
    TextDiffEditor.ID = editor_1.TEXT_DIFF_EDITOR_ID;
    TextDiffEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, storage_1.IStorageService),
        __param(3, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(4, editorService_1.IEditorService),
        __param(5, themeService_1.IThemeService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, files_1.IFileService)
    ], TextDiffEditor);
    exports.TextDiffEditor = TextDiffEditor;
});
//# sourceMappingURL=textDiffEditor.js.map