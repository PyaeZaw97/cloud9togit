/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation"], function (require, exports, event_1, lifecycle_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InteractiveDocumentService = exports.IInteractiveDocumentService = void 0;
    exports.IInteractiveDocumentService = (0, instantiation_1.createDecorator)('IInteractiveDocumentService');
    class InteractiveDocumentService extends lifecycle_1.Disposable {
        constructor() {
            super();
            this._onWillAddInteractiveDocument = this._register(new event_1.Emitter());
            this.onWillAddInteractiveDocument = this._onWillAddInteractiveDocument.event;
            this._onWillRemoveInteractiveDocument = this._register(new event_1.Emitter());
            this.onWillRemoveInteractiveDocument = this._onWillRemoveInteractiveDocument.event;
        }
        willCreateInteractiveDocument(notebookUri, inputUri, languageId) {
            this._onWillAddInteractiveDocument.fire({
                notebookUri,
                inputUri,
                languageId
            });
        }
        willRemoveInteractiveDocument(notebookUri, inputUri) {
            this._onWillRemoveInteractiveDocument.fire({
                notebookUri,
                inputUri
            });
        }
    }
    exports.InteractiveDocumentService = InteractiveDocumentService;
});
//# sourceMappingURL=interactiveDocumentService.js.map