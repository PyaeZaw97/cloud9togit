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
define(["require", "exports", "vs/base/common/assert", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostDocumentData", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostTextEditor", "vs/workbench/api/common/extHostTypeConverters", "vs/platform/log/common/log", "vs/base/common/map", "vs/base/common/network", "vs/base/common/iterator", "vs/base/common/lazy"], function (require, exports, assert, event_1, lifecycle_1, uri_1, instantiation_1, extHost_protocol_1, extHostDocumentData_1, extHostRpcService_1, extHostTextEditor_1, typeConverters, log_1, map_1, network_1, iterator_1, lazy_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostDocumentsAndEditors = exports.ExtHostDocumentsAndEditors = void 0;
    class Reference {
        constructor(value) {
            this.value = value;
            this._count = 0;
        }
        ref() {
            this._count++;
        }
        unref() {
            return --this._count === 0;
        }
    }
    let ExtHostDocumentsAndEditors = class ExtHostDocumentsAndEditors {
        constructor(_extHostRpc, _logService) {
            this._extHostRpc = _extHostRpc;
            this._logService = _logService;
            this._activeEditorId = null;
            this._editors = new Map();
            this._documents = new map_1.ResourceMap();
            this._onDidAddDocuments = new event_1.Emitter();
            this._onDidRemoveDocuments = new event_1.Emitter();
            this._onDidChangeVisibleTextEditors = new event_1.Emitter();
            this._onDidChangeActiveTextEditor = new event_1.Emitter();
            this.onDidAddDocuments = this._onDidAddDocuments.event;
            this.onDidRemoveDocuments = this._onDidRemoveDocuments.event;
            this.onDidChangeVisibleTextEditors = this._onDidChangeVisibleTextEditors.event;
            this.onDidChangeActiveTextEditor = this._onDidChangeActiveTextEditor.event;
        }
        $acceptDocumentsAndEditorsDelta(delta) {
            this.acceptDocumentsAndEditorsDelta(delta);
        }
        acceptDocumentsAndEditorsDelta(delta) {
            const removedDocuments = [];
            const addedDocuments = [];
            const removedEditors = [];
            if (delta.removedDocuments) {
                for (const uriComponent of delta.removedDocuments) {
                    const uri = uri_1.URI.revive(uriComponent);
                    const data = this._documents.get(uri);
                    if (data === null || data === void 0 ? void 0 : data.unref()) {
                        this._documents.delete(uri);
                        removedDocuments.push(data.value);
                    }
                }
            }
            if (delta.addedDocuments) {
                for (const data of delta.addedDocuments) {
                    const resource = uri_1.URI.revive(data.uri);
                    let ref = this._documents.get(resource);
                    // double check -> only notebook cell documents should be
                    // referenced/opened more than once...
                    if (ref) {
                        if (resource.scheme !== network_1.Schemas.vscodeNotebookCell && resource.scheme !== network_1.Schemas.vscodeInteractiveInput) {
                            throw new Error(`document '${resource} already exists!'`);
                        }
                    }
                    if (!ref) {
                        ref = new Reference(new extHostDocumentData_1.ExtHostDocumentData(this._extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadDocuments), resource, data.lines, data.EOL, data.versionId, data.languageId, data.isDirty, data.notebook));
                        this._documents.set(resource, ref);
                        addedDocuments.push(ref.value);
                    }
                    ref.ref();
                }
            }
            if (delta.removedEditors) {
                for (const id of delta.removedEditors) {
                    const editor = this._editors.get(id);
                    this._editors.delete(id);
                    if (editor) {
                        removedEditors.push(editor);
                    }
                }
            }
            if (delta.addedEditors) {
                for (const data of delta.addedEditors) {
                    const resource = uri_1.URI.revive(data.documentUri);
                    assert.ok(this._documents.has(resource), `document '${resource}' does not exist`);
                    assert.ok(!this._editors.has(data.id), `editor '${data.id}' already exists!`);
                    const documentData = this._documents.get(resource).value;
                    const editor = new extHostTextEditor_1.ExtHostTextEditor(data.id, this._extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadTextEditors), this._logService, new lazy_1.Lazy(() => documentData.document), data.selections.map(typeConverters.Selection.to), data.options, data.visibleRanges.map(range => typeConverters.Range.to(range)), typeof data.editorPosition === 'number' ? typeConverters.ViewColumn.to(data.editorPosition) : undefined);
                    this._editors.set(data.id, editor);
                }
            }
            if (delta.newActiveEditor !== undefined) {
                assert.ok(delta.newActiveEditor === null || this._editors.has(delta.newActiveEditor), `active editor '${delta.newActiveEditor}' does not exist`);
                this._activeEditorId = delta.newActiveEditor;
            }
            (0, lifecycle_1.dispose)(removedDocuments);
            (0, lifecycle_1.dispose)(removedEditors);
            // now that the internal state is complete, fire events
            if (delta.removedDocuments) {
                this._onDidRemoveDocuments.fire(removedDocuments);
            }
            if (delta.addedDocuments) {
                this._onDidAddDocuments.fire(addedDocuments);
            }
            if (delta.removedEditors || delta.addedEditors) {
                this._onDidChangeVisibleTextEditors.fire(this.allEditors().map(editor => editor.value));
            }
            if (delta.newActiveEditor !== undefined) {
                this._onDidChangeActiveTextEditor.fire(this.activeEditor());
            }
        }
        getDocument(uri) {
            var _a;
            return (_a = this._documents.get(uri)) === null || _a === void 0 ? void 0 : _a.value;
        }
        allDocuments() {
            return iterator_1.Iterable.map(this._documents.values(), ref => ref.value);
        }
        getEditor(id) {
            return this._editors.get(id);
        }
        activeEditor(internal) {
            if (!this._activeEditorId) {
                return undefined;
            }
            const editor = this._editors.get(this._activeEditorId);
            if (internal) {
                return editor;
            }
            else {
                return editor === null || editor === void 0 ? void 0 : editor.value;
            }
        }
        allEditors() {
            return [...this._editors.values()];
        }
    };
    ExtHostDocumentsAndEditors = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService)
    ], ExtHostDocumentsAndEditors);
    exports.ExtHostDocumentsAndEditors = ExtHostDocumentsAndEditors;
    exports.IExtHostDocumentsAndEditors = (0, instantiation_1.createDecorator)('IExtHostDocumentsAndEditors');
});
//# sourceMappingURL=extHostDocumentsAndEditors.js.map