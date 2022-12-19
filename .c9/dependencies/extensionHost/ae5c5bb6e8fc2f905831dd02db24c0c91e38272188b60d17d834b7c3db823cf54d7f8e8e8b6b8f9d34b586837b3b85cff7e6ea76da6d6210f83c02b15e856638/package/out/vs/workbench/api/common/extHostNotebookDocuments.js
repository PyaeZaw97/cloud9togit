/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/uri"], function (require, exports, event_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostNotebookDocuments = void 0;
    class ExtHostNotebookDocuments {
        constructor(_notebooksAndEditors) {
            this._notebooksAndEditors = _notebooksAndEditors;
            this._onDidSaveNotebookDocument = new event_1.Emitter();
            this.onDidSaveNotebookDocument = this._onDidSaveNotebookDocument.event;
            this._onDidChangeNotebookDocument = new event_1.Emitter();
            this.onDidChangeNotebookDocument = this._onDidChangeNotebookDocument.event;
        }
        $acceptModelChanged(uri, event, isDirty, newMetadata) {
            const document = this._notebooksAndEditors.getNotebookDocument(uri_1.URI.revive(uri));
            const e = document.acceptModelChanged(event.value, isDirty, newMetadata);
            this._onDidChangeNotebookDocument.fire(e);
        }
        $acceptDirtyStateChanged(uri, isDirty) {
            const document = this._notebooksAndEditors.getNotebookDocument(uri_1.URI.revive(uri));
            document.acceptDirty(isDirty);
        }
        $acceptModelSaved(uri) {
            const document = this._notebooksAndEditors.getNotebookDocument(uri_1.URI.revive(uri));
            this._onDidSaveNotebookDocument.fire(document.apiNotebook);
        }
    }
    exports.ExtHostNotebookDocuments = ExtHostNotebookDocuments;
});
//# sourceMappingURL=extHostNotebookDocuments.js.map