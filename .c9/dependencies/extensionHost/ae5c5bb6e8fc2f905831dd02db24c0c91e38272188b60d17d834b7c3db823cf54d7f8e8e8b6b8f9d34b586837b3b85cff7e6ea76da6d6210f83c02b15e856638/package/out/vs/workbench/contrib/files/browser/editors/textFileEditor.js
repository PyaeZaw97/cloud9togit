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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/workbench/services/path/common/pathService", "vs/base/common/actions", "vs/workbench/contrib/files/common/files", "vs/workbench/services/textfile/common/textfiles", "vs/workbench/browser/parts/editor/textEditor", "vs/workbench/common/editor", "vs/workbench/common/editor/editorOptions", "vs/workbench/common/editor/binaryEditorModel", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/platform/files/common/files", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/platform/storage/common/storage", "vs/editor/common/services/textResourceConfiguration", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/errorMessage", "vs/platform/editor/common/editor", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/files/browser/files", "vs/base/common/lifecycle", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/configuration/common/configuration"], function (require, exports, nls_1, types_1, pathService_1, actions_1, files_1, textfiles_1, textEditor_1, editor_1, editorOptions_1, binaryEditorModel_1, fileEditorInput_1, files_2, telemetry_1, workspace_1, storage_1, textResourceConfiguration_1, instantiation_1, themeService_1, editorService_1, editorGroupsService_1, errorMessage_1, editor_2, uriIdentity_1, files_3, lifecycle_1, panecomposite_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextFileEditor = void 0;
    /**
     * An implementation of editor for file system resources.
     */
    let TextFileEditor = class TextFileEditor extends textEditor_1.BaseTextEditor {
        constructor(telemetryService, fileService, paneCompositeService, instantiationService, contextService, storageService, textResourceConfigurationService, editorService, themeService, editorGroupService, textFileService, explorerService, uriIdentityService, pathService, configurationService) {
            super(TextFileEditor.ID, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService);
            this.fileService = fileService;
            this.paneCompositeService = paneCompositeService;
            this.contextService = contextService;
            this.textFileService = textFileService;
            this.explorerService = explorerService;
            this.uriIdentityService = uriIdentityService;
            this.pathService = pathService;
            this.configurationService = configurationService;
            this.inputListener = this._register(new lifecycle_1.MutableDisposable());
            // Clear view state for deleted files
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            // Move view state for moved files
            this._register(this.fileService.onDidRunOperation(e => this.onDidRunOperation(e)));
            // Listen to file system provider changes
            this._register(this.fileService.onDidChangeFileSystemProviderCapabilities(e => this.onDidChangeFileSystemProvider(e.scheme)));
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(e => this.onDidChangeFileSystemProvider(e.scheme)));
        }
        onDidFilesChange(e) {
            for (const resource of e.rawDeleted) {
                this.clearEditorViewState(resource);
            }
        }
        onDidRunOperation(e) {
            if (e.operation === 2 /* FileOperation.MOVE */ && e.target) {
                this.moveEditorViewState(e.resource, e.target.resource, this.uriIdentityService.extUri);
            }
        }
        onDidChangeFileSystemProvider(scheme) {
            var _a;
            if (((_a = this.input) === null || _a === void 0 ? void 0 : _a.resource.scheme) === scheme) {
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
                control.updateOptions({ readOnly: input.hasCapability(2 /* EditorInputCapabilities.Readonly */) });
            }
        }
        getTitle() {
            return this.input ? this.input.getName() : (0, nls_1.localize)('textFileEditor', "Text File Editor");
        }
        get input() {
            return this._input;
        }
        async setInput(input, options, context, token) {
            // Update our listener for input capabilities
            this.inputListener.value = input.onDidChangeCapabilities(() => this.onDidChangeInputCapabilities(input));
            // Set input and resolve
            await super.setInput(input, options, context, token);
            try {
                const resolvedModel = await input.resolve();
                // Check for cancellation
                if (token.isCancellationRequested) {
                    return;
                }
                // There is a special case where the text editor has to handle binary file editor input: if a binary file
                // has been resolved and cached before, it maybe an actual instance of BinaryEditorModel. In this case our text
                // editor has to open this model using the binary editor. We return early in this case.
                if (resolvedModel instanceof binaryEditorModel_1.BinaryEditorModel) {
                    return this.openAsBinary(input, options);
                }
                const textFileModel = resolvedModel;
                // Editor
                const textEditor = (0, types_1.assertIsDefined)(this.getControl());
                textEditor.setModel(textFileModel.textEditorModel);
                // Restore view state (unless provided by options)
                if (!(0, editor_1.isTextEditorViewState)(options === null || options === void 0 ? void 0 : options.viewState)) {
                    const editorViewState = this.loadEditorViewState(input, context);
                    if (editorViewState) {
                        if (options === null || options === void 0 ? void 0 : options.selection) {
                            editorViewState.cursorState = []; // prevent duplicate selections via options
                        }
                        textEditor.restoreViewState(editorViewState);
                    }
                }
                // Apply options to editor if any
                if (options) {
                    (0, editorOptions_1.applyTextEditorOptions)(options, textEditor, 1 /* ScrollType.Immediate */);
                }
                // Since the resolved model provides information about being readonly
                // or not, we apply it here to the editor even though the editor input
                // was already asked for being readonly or not. The rationale is that
                // a resolved model might have more specific information about being
                // readonly or not that the input did not have.
                textEditor.updateOptions({ readOnly: textFileModel.isReadonly() });
            }
            catch (error) {
                await this.handleSetInputError(error, input, options);
            }
        }
        async handleSetInputError(error, input, options) {
            // In case we tried to open a file inside the text editor and the response
            // indicates that this is not a text file, reopen the file through the binary
            // editor.
            if (error.textFileOperationResult === 0 /* TextFileOperationResult.FILE_IS_BINARY */) {
                return this.openAsBinary(input, options);
            }
            // Similar, handle case where we were asked to open a folder in the text editor.
            if (error.fileOperationResult === 0 /* FileOperationResult.FILE_IS_DIRECTORY */) {
                let action;
                if (this.contextService.isInsideWorkspace(input.preferredResource)) {
                    action = (0, actions_1.toAction)({
                        id: 'workbench.files.action.reveal', label: (0, nls_1.localize)('reveal', "Reveal in Explorer View"), run: async () => {
                            await this.paneCompositeService.openPaneComposite(files_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
                            return this.explorerService.select(input.preferredResource, true);
                        }
                    });
                }
                else {
                    action = (0, actions_1.toAction)({
                        id: 'workbench.files.action.ok', label: (0, nls_1.localize)('ok', "OK"), run: async () => {
                            // No operation possible, but clicking OK will close the editor
                        }
                    });
                }
                throw (0, errorMessage_1.createErrorWithActions)(new files_2.FileOperationError((0, nls_1.localize)('fileIsDirectoryError', "File is a directory"), 0 /* FileOperationResult.FILE_IS_DIRECTORY */), [action]);
            }
            // Offer to create a file from the error if we have a file not found and the name is valid
            if (error.fileOperationResult === 1 /* FileOperationResult.FILE_NOT_FOUND */ && await this.pathService.hasValidBasename(input.preferredResource)) {
                const fileNotFoundError = (0, errorMessage_1.createErrorWithActions)(new files_2.FileOperationError((0, nls_1.localize)('fileNotFoundError', "File not found"), 1 /* FileOperationResult.FILE_NOT_FOUND */), [
                    (0, actions_1.toAction)({
                        id: 'workbench.files.action.createMissingFile', label: (0, nls_1.localize)('createFile', "Create File"), run: async () => {
                            await this.textFileService.create([{ resource: input.preferredResource }]);
                            return this.editorService.openEditor({
                                resource: input.preferredResource,
                                options: {
                                    pinned: true // new file gets pinned by default
                                }
                            });
                        }
                    })
                ]);
                throw fileNotFoundError;
            }
            // Otherwise make sure the error bubbles up
            throw error;
        }
        openAsBinary(input, options) {
            var _a;
            const defaultBinaryEditor = this.configurationService.getValue('workbench.editor.defaultBinaryEditor');
            const group = (_a = this.group) !== null && _a !== void 0 ? _a : this.editorGroupService.activeGroup;
            let editorOptions = Object.assign(Object.assign({}, options), { 
                // Make sure to not steal away the currently active group
                // because we are triggering another openEditor() call
                // and do not control the initial intent that resulted
                // in us now opening as binary.
                activation: editor_2.EditorActivation.PRESERVE });
            // Check configuration and determine whether we open the binary
            // file input in a different editor or going through the same
            // editor.
            // Going through the same editor is debt, and a better solution
            // would be to introduce a real editor for the binary case
            // and avoid enforcing binary or text on the file editor input.
            if (defaultBinaryEditor && defaultBinaryEditor !== '' && defaultBinaryEditor !== editor_1.DEFAULT_EDITOR_ASSOCIATION.id) {
                this.doOpenAsBinaryInDifferentEditor(group, defaultBinaryEditor, input, editorOptions);
            }
            else {
                this.doOpenAsBinaryInSameEditor(group, defaultBinaryEditor, input, editorOptions);
            }
        }
        doOpenAsBinaryInDifferentEditor(group, editorId, editor, editorOptions) {
            this.editorService.replaceEditors([{
                    editor,
                    replacement: { resource: editor.resource, options: Object.assign(Object.assign({}, editorOptions), { override: editorId }) }
                }], group);
        }
        doOpenAsBinaryInSameEditor(group, editorId, editor, editorOptions) {
            // Open binary as text
            if (editorId === editor_1.DEFAULT_EDITOR_ASSOCIATION.id) {
                editor.setForceOpenAsText();
                editor.setPreferredLanguageId(files_1.BINARY_TEXT_FILE_MODE); // https://github.com/microsoft/vscode/issues/131076
                editorOptions = Object.assign(Object.assign({}, editorOptions), { forceReload: true }); // Same pane and same input, must force reload to clear cached state
            }
            // Open as binary
            else {
                editor.setForceOpenAsBinary();
            }
            group.openEditor(editor, editorOptions);
        }
        clearInput() {
            super.clearInput();
            // Clear input listener
            this.inputListener.clear();
            // Clear Model
            const textEditor = this.getControl();
            if (textEditor) {
                textEditor.setModel(null);
            }
        }
        tracksEditorViewState(input) {
            return input instanceof fileEditorInput_1.FileEditorInput;
        }
        tracksDisposedEditorViewState() {
            return true; // track view state even for disposed editors
        }
    };
    TextFileEditor.ID = files_1.TEXT_FILE_EDITOR_ID;
    TextFileEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, files_2.IFileService),
        __param(2, panecomposite_1.IPaneCompositePartService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, storage_1.IStorageService),
        __param(6, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(7, editorService_1.IEditorService),
        __param(8, themeService_1.IThemeService),
        __param(9, editorGroupsService_1.IEditorGroupsService),
        __param(10, textfiles_1.ITextFileService),
        __param(11, files_3.IExplorerService),
        __param(12, uriIdentity_1.IUriIdentityService),
        __param(13, pathService_1.IPathService),
        __param(14, configuration_1.IConfigurationService)
    ], TextFileEditor);
    exports.TextFileEditor = TextFileEditor;
});
//# sourceMappingURL=textFileEditor.js.map