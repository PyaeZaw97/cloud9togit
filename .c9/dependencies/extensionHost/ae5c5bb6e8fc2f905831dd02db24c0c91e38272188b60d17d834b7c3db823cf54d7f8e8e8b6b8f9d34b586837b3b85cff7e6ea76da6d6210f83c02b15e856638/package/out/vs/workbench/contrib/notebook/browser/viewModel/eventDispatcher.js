/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/notebookViewEvents"], function (require, exports, event_1, lifecycle_1, notebookViewEvents_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEventDispatcher = void 0;
    class NotebookEventDispatcher extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeLayout = this._register(new event_1.Emitter());
            this.onDidChangeLayout = this._onDidChangeLayout.event;
            this._onDidChangeMetadata = this._register(new event_1.Emitter());
            this.onDidChangeMetadata = this._onDidChangeMetadata.event;
            this._onDidChangeCellState = this._register(new event_1.Emitter());
            this.onDidChangeCellState = this._onDidChangeCellState.event;
        }
        emit(events) {
            for (let i = 0, len = events.length; i < len; i++) {
                const e = events[i];
                switch (e.type) {
                    case notebookViewEvents_1.NotebookViewEventType.LayoutChanged:
                        this._onDidChangeLayout.fire(e);
                        break;
                    case notebookViewEvents_1.NotebookViewEventType.MetadataChanged:
                        this._onDidChangeMetadata.fire(e);
                        break;
                    case notebookViewEvents_1.NotebookViewEventType.CellStateChanged:
                        this._onDidChangeCellState.fire(e);
                        break;
                }
            }
        }
    }
    exports.NotebookEventDispatcher = NotebookEventDispatcher;
});
//# sourceMappingURL=eventDispatcher.js.map