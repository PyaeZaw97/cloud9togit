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
define(["require", "exports", "vs/base/common/collections", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/browser/mainThreadNotebookDocuments", "vs/workbench/api/browser/mainThreadNotebookDto", "vs/workbench/api/browser/mainThreadNotebookEditors", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "../common/extHost.protocol", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, collections_1, lifecycle_1, instantiation_1, mainThreadNotebookDocuments_1, mainThreadNotebookDto_1, mainThreadNotebookEditors_1, extHostCustomers_1, editorGroupColumn_1, notebookBrowser_1, notebookEditorService_1, notebookService_1, editorGroupsService_1, editorService_1, extHost_protocol_1, proxyIdentifier_1) {
    "use strict";
    var MainThreadNotebooksAndEditors_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebooksAndEditors = void 0;
    class NotebookAndEditorState {
        constructor(documents, textEditors, activeEditor, visibleEditors) {
            this.documents = documents;
            this.textEditors = textEditors;
            this.activeEditor = activeEditor;
            this.visibleEditors = visibleEditors;
            //
        }
        static delta(before, after) {
            if (!before) {
                return {
                    addedDocuments: [...after.documents],
                    removedDocuments: [],
                    addedEditors: [...after.textEditors.values()],
                    removedEditors: [],
                    visibleEditors: [...after.visibleEditors].map(editor => editor[0])
                };
            }
            const documentDelta = (0, collections_1.diffSets)(before.documents, after.documents);
            const editorDelta = (0, collections_1.diffMaps)(before.textEditors, after.textEditors);
            const newActiveEditor = before.activeEditor !== after.activeEditor ? after.activeEditor : undefined;
            const visibleEditorDelta = (0, collections_1.diffMaps)(before.visibleEditors, after.visibleEditors);
            return {
                addedDocuments: documentDelta.added,
                removedDocuments: documentDelta.removed.map(e => e.uri),
                addedEditors: editorDelta.added,
                removedEditors: editorDelta.removed.map(removed => removed.getId()),
                newActiveEditor: newActiveEditor,
                visibleEditors: visibleEditorDelta.added.length === 0 && visibleEditorDelta.removed.length === 0
                    ? undefined
                    : [...after.visibleEditors].map(editor => editor[0])
            };
        }
    }
    let MainThreadNotebooksAndEditors = MainThreadNotebooksAndEditors_1 = class MainThreadNotebooksAndEditors {
        constructor(extHostContext, instantiationService, _notebookService, _notebookEditorService, _editorService, _editorGroupService) {
            this._notebookService = _notebookService;
            this._notebookEditorService = _notebookEditorService;
            this._editorService = _editorService;
            this._editorGroupService = _editorGroupService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._editorListeners = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebook);
            this._mainThreadNotebooks = instantiationService.createInstance(mainThreadNotebookDocuments_1.MainThreadNotebookDocuments, extHostContext);
            this._mainThreadEditors = instantiationService.createInstance(mainThreadNotebookEditors_1.MainThreadNotebookEditors, extHostContext);
            extHostContext.set(extHost_protocol_1.MainContext.MainThreadNotebookDocuments, this._mainThreadNotebooks);
            extHostContext.set(extHost_protocol_1.MainContext.MainThreadNotebookEditors, this._mainThreadEditors);
            this._notebookService.onWillAddNotebookDocument(() => this._updateState(), this, this._disposables);
            this._notebookService.onDidRemoveNotebookDocument(() => this._updateState(), this, this._disposables);
            this._editorService.onDidActiveEditorChange(() => this._updateState(), this, this._disposables);
            this._editorService.onDidVisibleEditorsChange(() => this._updateState(), this, this._disposables);
            this._notebookEditorService.onDidAddNotebookEditor(this._handleEditorAdd, this, this._disposables);
            this._notebookEditorService.onDidRemoveNotebookEditor(this._handleEditorRemove, this, this._disposables);
            this._updateState();
        }
        dispose() {
            this._mainThreadNotebooks.dispose();
            this._mainThreadEditors.dispose();
            this._disposables.dispose();
        }
        _handleEditorAdd(editor) {
            this._editorListeners.set(editor.getId(), (0, lifecycle_1.combinedDisposable)(editor.onDidChangeModel(() => this._updateState()), editor.onDidFocusWidget(() => this._updateState(editor))));
            this._updateState();
        }
        _handleEditorRemove(editor) {
            var _a;
            (_a = this._editorListeners.get(editor.getId())) === null || _a === void 0 ? void 0 : _a.dispose();
            this._editorListeners.delete(editor.getId());
            this._updateState();
        }
        _updateState(focusedEditor) {
            const editors = new Map();
            const visibleEditorsMap = new Map();
            for (const editor of this._notebookEditorService.listNotebookEditors()) {
                if (editor.hasModel()) {
                    editors.set(editor.getId(), editor);
                }
            }
            const activeNotebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            let activeEditor = null;
            if (activeNotebookEditor) {
                activeEditor = activeNotebookEditor.getId();
            }
            else if (focusedEditor === null || focusedEditor === void 0 ? void 0 : focusedEditor.textModel) {
                activeEditor = focusedEditor.getId();
            }
            if (activeEditor && !editors.has(activeEditor)) {
                activeEditor = null;
            }
            for (const editorPane of this._editorService.visibleEditorPanes) {
                const notebookEditor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorPane);
                if ((notebookEditor === null || notebookEditor === void 0 ? void 0 : notebookEditor.hasModel()) && editors.has(notebookEditor.getId())) {
                    visibleEditorsMap.set(notebookEditor.getId(), notebookEditor);
                }
            }
            const newState = new NotebookAndEditorState(new Set(this._notebookService.listNotebookDocuments()), editors, activeEditor, visibleEditorsMap);
            this._onDelta(NotebookAndEditorState.delta(this._currentState, newState));
            this._currentState = newState;
        }
        _onDelta(delta) {
            if (MainThreadNotebooksAndEditors_1._isDeltaEmpty(delta)) {
                return;
            }
            const dto = {
                removedDocuments: delta.removedDocuments,
                removedEditors: delta.removedEditors,
                newActiveEditor: delta.newActiveEditor,
                visibleEditors: delta.visibleEditors,
                addedDocuments: delta.addedDocuments.map(MainThreadNotebooksAndEditors_1._asModelAddData),
                addedEditors: delta.addedEditors.map(this._asEditorAddData, this),
            };
            // send to extension FIRST
            this._proxy.$acceptDocumentAndEditorsDelta(new proxyIdentifier_1.SerializableObjectWithBuffers(dto));
            // handle internally
            this._mainThreadEditors.handleEditorsRemoved(delta.removedEditors);
            this._mainThreadNotebooks.handleNotebooksRemoved(delta.removedDocuments);
            this._mainThreadNotebooks.handleNotebooksAdded(delta.addedDocuments);
            this._mainThreadEditors.handleEditorsAdded(delta.addedEditors);
        }
        static _isDeltaEmpty(delta) {
            if (delta.addedDocuments !== undefined && delta.addedDocuments.length > 0) {
                return false;
            }
            if (delta.removedDocuments !== undefined && delta.removedDocuments.length > 0) {
                return false;
            }
            if (delta.addedEditors !== undefined && delta.addedEditors.length > 0) {
                return false;
            }
            if (delta.removedEditors !== undefined && delta.removedEditors.length > 0) {
                return false;
            }
            if (delta.visibleEditors !== undefined && delta.visibleEditors.length > 0) {
                return false;
            }
            if (delta.newActiveEditor !== undefined) {
                return false;
            }
            return true;
        }
        static _asModelAddData(e) {
            return {
                viewType: e.viewType,
                uri: e.uri,
                metadata: e.metadata,
                versionId: e.versionId,
                cells: e.cells.map(mainThreadNotebookDto_1.NotebookDto.toNotebookCellDto)
            };
        }
        _asEditorAddData(add) {
            const pane = this._editorService.visibleEditorPanes.find(pane => (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(pane) === add);
            return {
                id: add.getId(),
                documentUri: add.textModel.uri,
                selections: add.getSelections(),
                visibleRanges: add.visibleRanges,
                viewColumn: pane && (0, editorGroupColumn_1.editorGroupToColumn)(this._editorGroupService, pane.group)
            };
        }
    };
    MainThreadNotebooksAndEditors = MainThreadNotebooksAndEditors_1 = __decorate([
        extHostCustomers_1.extHostCustomer,
        __param(1, instantiation_1.IInstantiationService),
        __param(2, notebookService_1.INotebookService),
        __param(3, notebookEditorService_1.INotebookEditorService),
        __param(4, editorService_1.IEditorService),
        __param(5, editorGroupsService_1.IEditorGroupsService)
    ], MainThreadNotebooksAndEditors);
    exports.MainThreadNotebooksAndEditors = MainThreadNotebooksAndEditors;
});
//# sourceMappingURL=mainThreadNotebookDocumentsAndEditors.js.map