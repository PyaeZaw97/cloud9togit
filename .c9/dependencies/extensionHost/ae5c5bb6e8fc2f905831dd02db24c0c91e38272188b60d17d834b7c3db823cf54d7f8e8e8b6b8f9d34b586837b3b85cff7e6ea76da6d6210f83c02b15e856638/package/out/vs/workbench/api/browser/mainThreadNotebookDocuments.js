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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/uri", "vs/workbench/api/browser/mainThreadDocuments", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorModelResolverService", "vs/platform/uriIdentity/common/uriIdentity", "../common/extHost.protocol", "vs/workbench/api/browser/mainThreadNotebookDto", "vs/workbench/services/extensions/common/proxyIdentifier"], function (require, exports, lifecycle_1, map_1, uri_1, mainThreadDocuments_1, notebookCommon_1, notebookEditorModelResolverService_1, uriIdentity_1, extHost_protocol_1, mainThreadNotebookDto_1, proxyIdentifier_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadNotebookDocuments = void 0;
    let MainThreadNotebookDocuments = class MainThreadNotebookDocuments {
        constructor(extHostContext, _notebookEditorModelResolverService, _uriIdentityService) {
            this._notebookEditorModelResolverService = _notebookEditorModelResolverService;
            this._uriIdentityService = _uriIdentityService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._documentEventListenersMapping = new map_1.ResourceMap();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostNotebookDocuments);
            this._modelReferenceCollection = new mainThreadDocuments_1.BoundModelReferenceCollection(this._uriIdentityService.extUri);
            // forward dirty and save events
            this._disposables.add(this._notebookEditorModelResolverService.onDidChangeDirty(model => this._proxy.$acceptDirtyStateChanged(model.resource, model.isDirty())));
            this._disposables.add(this._notebookEditorModelResolverService.onDidSaveNotebook(e => this._proxy.$acceptModelSaved(e)));
            // when a conflict is going to happen RELEASE references that are held by extensions
            this._disposables.add(_notebookEditorModelResolverService.onWillFailWithConflict(e => {
                this._modelReferenceCollection.remove(e.resource);
            }));
        }
        dispose() {
            this._disposables.dispose();
            this._modelReferenceCollection.dispose();
            (0, lifecycle_1.dispose)(this._documentEventListenersMapping.values());
        }
        handleNotebooksAdded(notebooks) {
            for (const textModel of notebooks) {
                const disposableStore = new lifecycle_1.DisposableStore();
                disposableStore.add(textModel.onDidChangeContent(event => {
                    const eventDto = {
                        versionId: event.versionId,
                        rawEvents: []
                    };
                    for (const e of event.rawEvents) {
                        switch (e.kind) {
                            case notebookCommon_1.NotebookCellsChangeType.ModelChange:
                                eventDto.rawEvents.push({
                                    kind: e.kind,
                                    changes: e.changes.map(diff => [diff[0], diff[1], diff[2].map(cell => mainThreadNotebookDto_1.NotebookDto.toNotebookCellDto(cell))])
                                });
                                break;
                            case notebookCommon_1.NotebookCellsChangeType.Move:
                                eventDto.rawEvents.push({
                                    kind: e.kind,
                                    index: e.index,
                                    length: e.length,
                                    newIdx: e.newIdx,
                                });
                                break;
                            case notebookCommon_1.NotebookCellsChangeType.Output:
                                eventDto.rawEvents.push({
                                    kind: e.kind,
                                    index: e.index,
                                    outputs: e.outputs.map(mainThreadNotebookDto_1.NotebookDto.toNotebookOutputDto)
                                });
                                break;
                            case notebookCommon_1.NotebookCellsChangeType.OutputItem:
                                eventDto.rawEvents.push({
                                    kind: e.kind,
                                    index: e.index,
                                    outputId: e.outputId,
                                    outputItems: e.outputItems.map(mainThreadNotebookDto_1.NotebookDto.toNotebookOutputItemDto),
                                    append: e.append
                                });
                                break;
                            case notebookCommon_1.NotebookCellsChangeType.ChangeCellLanguage:
                            case notebookCommon_1.NotebookCellsChangeType.ChangeCellContent:
                            case notebookCommon_1.NotebookCellsChangeType.ChangeCellMetadata:
                            case notebookCommon_1.NotebookCellsChangeType.ChangeCellInternalMetadata:
                                eventDto.rawEvents.push(e);
                                break;
                        }
                    }
                    const hasDocumentMetadataChangeEvent = event.rawEvents.find(e => e.kind === notebookCommon_1.NotebookCellsChangeType.ChangeDocumentMetadata);
                    // using the model resolver service to know if the model is dirty or not.
                    // assuming this is the first listener it can mean that at first the model
                    // is marked as dirty and that another event is fired
                    this._proxy.$acceptModelChanged(textModel.uri, new proxyIdentifier_1.SerializableObjectWithBuffers(eventDto), this._notebookEditorModelResolverService.isDirty(textModel.uri), hasDocumentMetadataChangeEvent ? textModel.metadata : undefined);
                }));
                this._documentEventListenersMapping.set(textModel.uri, disposableStore);
            }
        }
        handleNotebooksRemoved(uris) {
            var _a;
            for (const uri of uris) {
                (_a = this._documentEventListenersMapping.get(uri)) === null || _a === void 0 ? void 0 : _a.dispose();
                this._documentEventListenersMapping.delete(uri);
            }
        }
        async $tryCreateNotebook(options) {
            const ref = await this._notebookEditorModelResolverService.resolve({ untitledResource: undefined }, options.viewType);
            // untitled notebooks are disposed when they get saved. we should not hold a reference
            // to such a disposed notebook and therefore dispose the reference as well
            ref.object.notebook.onWillDispose(() => {
                ref.dispose();
            });
            // untitled notebooks are dirty by default
            this._proxy.$acceptDirtyStateChanged(ref.object.resource, true);
            // apply content changes... slightly HACKY -> this triggers a change event
            if (options.content) {
                const data = mainThreadNotebookDto_1.NotebookDto.fromNotebookDataDto(options.content);
                ref.object.notebook.reset(data.cells, data.metadata, ref.object.notebook.transientOptions);
            }
            return ref.object.resource;
        }
        async $tryOpenNotebook(uriComponents) {
            const uri = uri_1.URI.revive(uriComponents);
            const ref = await this._notebookEditorModelResolverService.resolve(uri, undefined);
            this._modelReferenceCollection.add(uri, ref);
            return uri;
        }
        async $trySaveNotebook(uriComponents) {
            const uri = uri_1.URI.revive(uriComponents);
            const ref = await this._notebookEditorModelResolverService.resolve(uri);
            const saveResult = await ref.object.save();
            ref.dispose();
            return saveResult;
        }
    };
    MainThreadNotebookDocuments = __decorate([
        __param(1, notebookEditorModelResolverService_1.INotebookEditorModelResolverService),
        __param(2, uriIdentity_1.IUriIdentityService)
    ], MainThreadNotebookDocuments);
    exports.MainThreadNotebookDocuments = MainThreadNotebookDocuments;
});
//# sourceMappingURL=mainThreadNotebookDocuments.js.map