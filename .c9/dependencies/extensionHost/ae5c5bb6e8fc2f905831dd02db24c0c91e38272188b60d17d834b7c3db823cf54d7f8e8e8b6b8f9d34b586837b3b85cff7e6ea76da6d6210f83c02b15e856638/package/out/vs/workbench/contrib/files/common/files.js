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
define(["require", "exports", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/workbench/services/textfile/common/textfiles", "vs/platform/contextkey/common/contextkeys", "vs/base/common/functional", "vs/nls"], function (require, exports, editor_1, files_1, contextkey_1, lifecycle_1, model_1, language_1, textfiles_1, contextkeys_1, functional_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenEditor = exports.TextFileContentProvider = exports.LexicographicOptions = exports.UndoConfirmLevel = exports.SortOrder = exports.BINARY_TEXT_FILE_MODE = exports.BINARY_FILE_EDITOR_ID = exports.FILE_EDITOR_INPUT_ID = exports.TEXT_FILE_EDITOR_ID = exports.ExplorerFocusCondition = exports.FilesExplorerFocusCondition = exports.ExplorerCompressedLastFocusContext = exports.ExplorerCompressedFirstFocusContext = exports.ExplorerCompressedFocusContext = exports.ExplorerFocusedContext = exports.OpenEditorsFocusedContext = exports.OpenEditorsVisibleContext = exports.FilesExplorerFocusedContext = exports.ExplorerResourceMoveableToTrash = exports.ExplorerResourceCut = exports.ExplorerRootContext = exports.ExplorerResourceAvailableEditorIdsContext = exports.ExplorerResourceNotReadonlyContext = exports.ExplorerResourceReadonlyContext = exports.ExplorerFolderContext = exports.ExplorerViewletVisibleContext = exports.VIEW_ID = exports.VIEWLET_ID = void 0;
    /**
     * Explorer viewlet id.
     */
    exports.VIEWLET_ID = 'workbench.view.explorer';
    /**
     * Explorer file view id.
     */
    exports.VIEW_ID = 'workbench.explorer.fileView';
    /**
     * Context Keys to use with keybindings for the Explorer and Open Editors view
     */
    exports.ExplorerViewletVisibleContext = new contextkey_1.RawContextKey('explorerViewletVisible', true, { type: 'boolean', description: (0, nls_1.localize)('explorerViewletVisible', "True when the EXPLORER viewlet is visible.") });
    exports.ExplorerFolderContext = new contextkey_1.RawContextKey('explorerResourceIsFolder', false, { type: 'boolean', description: (0, nls_1.localize)('explorerResourceIsFolder', "True when the focused item in the EXPLORER is a folder.") });
    exports.ExplorerResourceReadonlyContext = new contextkey_1.RawContextKey('explorerResourceReadonly', false, { type: 'boolean', description: (0, nls_1.localize)('explorerResourceReadonly', "True when the focused item in the EXPLORER is readonly.") });
    exports.ExplorerResourceNotReadonlyContext = exports.ExplorerResourceReadonlyContext.toNegated();
    /**
     * Comma separated list of editor ids that can be used for the selected explorer resource.
     */
    exports.ExplorerResourceAvailableEditorIdsContext = new contextkey_1.RawContextKey('explorerResourceAvailableEditorIds', '');
    exports.ExplorerRootContext = new contextkey_1.RawContextKey('explorerResourceIsRoot', false, { type: 'boolean', description: (0, nls_1.localize)('explorerResourceIsRoot', "True when the focused item in the EXPLORER is a root folder.") });
    exports.ExplorerResourceCut = new contextkey_1.RawContextKey('explorerResourceCut', false, { type: 'boolean', description: (0, nls_1.localize)('explorerResourceCut', "True when an item in the EXPLORER has been cut for cut and paste.") });
    exports.ExplorerResourceMoveableToTrash = new contextkey_1.RawContextKey('explorerResourceMoveableToTrash', false, { type: 'boolean', description: (0, nls_1.localize)('explorerResourceMoveableToTrash', "True when the focused item in the EXPLORER can be moved to trash.") });
    exports.FilesExplorerFocusedContext = new contextkey_1.RawContextKey('filesExplorerFocus', true, { type: 'boolean', description: (0, nls_1.localize)('filesExplorerFocus', "True when the focus is inside the EXPLORER view.") });
    exports.OpenEditorsVisibleContext = new contextkey_1.RawContextKey('openEditorsVisible', false, { type: 'boolean', description: (0, nls_1.localize)('openEditorsVisible', "True when the OPEN EDITORS view is visible.") });
    exports.OpenEditorsFocusedContext = new contextkey_1.RawContextKey('openEditorsFocus', true, { type: 'boolean', description: (0, nls_1.localize)('openEditorsFocus', "True when the focus is inside the OPEN EDITORS view.") });
    exports.ExplorerFocusedContext = new contextkey_1.RawContextKey('explorerViewletFocus', true, { type: 'boolean', description: (0, nls_1.localize)('explorerViewletFocus', "True when the focus is inside the EXPLORER viewlet.") });
    // compressed nodes
    exports.ExplorerCompressedFocusContext = new contextkey_1.RawContextKey('explorerViewletCompressedFocus', true, { type: 'boolean', description: (0, nls_1.localize)('explorerViewletCompressedFocus', "True when the focused item in the EXPLORER view is a compact item.") });
    exports.ExplorerCompressedFirstFocusContext = new contextkey_1.RawContextKey('explorerViewletCompressedFirstFocus', true, { type: 'boolean', description: (0, nls_1.localize)('explorerViewletCompressedFirstFocus', "True when the focus is inside a compact item's first part in the EXPLORER view.") });
    exports.ExplorerCompressedLastFocusContext = new contextkey_1.RawContextKey('explorerViewletCompressedLastFocus', true, { type: 'boolean', description: (0, nls_1.localize)('explorerViewletCompressedLastFocus', "True when the focus is inside a compact item's last part in the EXPLORER view.") });
    exports.FilesExplorerFocusCondition = contextkey_1.ContextKeyExpr.and(exports.ExplorerViewletVisibleContext, exports.FilesExplorerFocusedContext, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey));
    exports.ExplorerFocusCondition = contextkey_1.ContextKeyExpr.and(exports.ExplorerViewletVisibleContext, exports.ExplorerFocusedContext, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey));
    /**
     * Text file editor id.
     */
    exports.TEXT_FILE_EDITOR_ID = 'workbench.editors.files.textFileEditor';
    /**
     * File editor input id.
     */
    exports.FILE_EDITOR_INPUT_ID = 'workbench.editors.files.fileEditorInput';
    /**
     * Binary file editor id.
     */
    exports.BINARY_FILE_EDITOR_ID = 'workbench.editors.files.binaryFileEditor';
    /**
     * Language identifier for binary files opened as text.
     */
    exports.BINARY_TEXT_FILE_MODE = 'code-text-binary';
    var SortOrder;
    (function (SortOrder) {
        SortOrder["Default"] = "default";
        SortOrder["Mixed"] = "mixed";
        SortOrder["FilesFirst"] = "filesFirst";
        SortOrder["Type"] = "type";
        SortOrder["Modified"] = "modified";
        SortOrder["FoldersNestsFiles"] = "foldersNestsFiles";
    })(SortOrder = exports.SortOrder || (exports.SortOrder = {}));
    var UndoConfirmLevel;
    (function (UndoConfirmLevel) {
        UndoConfirmLevel["Verbose"] = "verbose";
        UndoConfirmLevel["Default"] = "default";
        UndoConfirmLevel["Light"] = "light";
    })(UndoConfirmLevel = exports.UndoConfirmLevel || (exports.UndoConfirmLevel = {}));
    var LexicographicOptions;
    (function (LexicographicOptions) {
        LexicographicOptions["Default"] = "default";
        LexicographicOptions["Upper"] = "upper";
        LexicographicOptions["Lower"] = "lower";
        LexicographicOptions["Unicode"] = "unicode";
    })(LexicographicOptions = exports.LexicographicOptions || (exports.LexicographicOptions = {}));
    let TextFileContentProvider = class TextFileContentProvider extends lifecycle_1.Disposable {
        constructor(textFileService, fileService, languageService, modelService) {
            super();
            this.textFileService = textFileService;
            this.fileService = fileService;
            this.languageService = languageService;
            this.modelService = modelService;
            this.fileWatcherDisposable = this._register(new lifecycle_1.MutableDisposable());
        }
        static async open(resource, scheme, label, editorService, options) {
            await editorService.openEditor({
                original: { resource: TextFileContentProvider.resourceToTextFile(scheme, resource) },
                modified: { resource },
                label,
                options
            });
        }
        static resourceToTextFile(scheme, resource) {
            return resource.with({ scheme, query: JSON.stringify({ scheme: resource.scheme, query: resource.query }) });
        }
        static textFileToResource(resource) {
            const { scheme, query } = JSON.parse(resource.query);
            return resource.with({ scheme, query });
        }
        async provideTextContent(resource) {
            if (!resource.query) {
                // We require the URI to use the `query` to transport the original scheme and query
                // as done by `resourceToTextFile`
                return null;
            }
            const savedFileResource = TextFileContentProvider.textFileToResource(resource);
            // Make sure our text file is resolved up to date
            const codeEditorModel = await this.resolveEditorModel(resource);
            // Make sure to keep contents up to date when it changes
            if (!this.fileWatcherDisposable.value) {
                this.fileWatcherDisposable.value = this.fileService.onDidFilesChange(changes => {
                    if (changes.contains(savedFileResource, 0 /* FileChangeType.UPDATED */)) {
                        this.resolveEditorModel(resource, false /* do not create if missing */); // update model when resource changes
                    }
                });
                if (codeEditorModel) {
                    (0, functional_1.once)(codeEditorModel.onWillDispose)(() => this.fileWatcherDisposable.clear());
                }
            }
            return codeEditorModel;
        }
        async resolveEditorModel(resource, createAsNeeded = true) {
            const savedFileResource = TextFileContentProvider.textFileToResource(resource);
            const content = await this.textFileService.readStream(savedFileResource);
            let codeEditorModel = this.modelService.getModel(resource);
            if (codeEditorModel) {
                this.modelService.updateModel(codeEditorModel, content.value);
            }
            else if (createAsNeeded) {
                const textFileModel = this.modelService.getModel(savedFileResource);
                let languageSelector;
                if (textFileModel) {
                    languageSelector = this.languageService.createById(textFileModel.getLanguageId());
                }
                else {
                    languageSelector = this.languageService.createByFilepathOrFirstLine(savedFileResource);
                }
                codeEditorModel = this.modelService.createModel(content.value, languageSelector, resource);
            }
            return codeEditorModel;
        }
    };
    TextFileContentProvider = __decorate([
        __param(0, textfiles_1.ITextFileService),
        __param(1, files_1.IFileService),
        __param(2, language_1.ILanguageService),
        __param(3, model_1.IModelService)
    ], TextFileContentProvider);
    exports.TextFileContentProvider = TextFileContentProvider;
    class OpenEditor {
        constructor(_editor, _group) {
            this._editor = _editor;
            this._group = _group;
            this.id = OpenEditor.COUNTER++;
        }
        get editor() {
            return this._editor;
        }
        get group() {
            return this._group;
        }
        get groupId() {
            return this._group.id;
        }
        getId() {
            return `openeditor:${this.groupId}:${this.id}`;
        }
        isPreview() {
            return !this._group.isPinned(this.editor);
        }
        isSticky() {
            return this._group.isSticky(this.editor);
        }
        getResource() {
            return editor_1.EditorResourceAccessor.getOriginalUri(this.editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
        }
    }
    exports.OpenEditor = OpenEditor;
    OpenEditor.COUNTER = 0;
});
//# sourceMappingURL=files.js.map