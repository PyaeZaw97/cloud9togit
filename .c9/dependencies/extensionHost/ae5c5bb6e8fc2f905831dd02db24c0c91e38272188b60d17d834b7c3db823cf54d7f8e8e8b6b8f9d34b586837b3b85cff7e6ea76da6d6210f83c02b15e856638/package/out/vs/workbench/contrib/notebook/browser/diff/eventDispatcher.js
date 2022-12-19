/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookDiffEditorEventDispatcher = exports.NotebookCellLayoutChangedEvent = exports.NotebookDiffLayoutChangedEvent = exports.NotebookDiffViewEventType = void 0;
    var NotebookDiffViewEventType;
    (function (NotebookDiffViewEventType) {
        NotebookDiffViewEventType[NotebookDiffViewEventType["LayoutChanged"] = 1] = "LayoutChanged";
        NotebookDiffViewEventType[NotebookDiffViewEventType["CellLayoutChanged"] = 2] = "CellLayoutChanged";
        // MetadataChanged = 2,
        // CellStateChanged = 3
    })(NotebookDiffViewEventType = exports.NotebookDiffViewEventType || (exports.NotebookDiffViewEventType = {}));
    class NotebookDiffLayoutChangedEvent {
        constructor(source, value) {
            this.source = source;
            this.value = value;
            this.type = NotebookDiffViewEventType.LayoutChanged;
        }
    }
    exports.NotebookDiffLayoutChangedEvent = NotebookDiffLayoutChangedEvent;
    class NotebookCellLayoutChangedEvent {
        constructor(source) {
            this.source = source;
            this.type = NotebookDiffViewEventType.CellLayoutChanged;
        }
    }
    exports.NotebookCellLayoutChangedEvent = NotebookCellLayoutChangedEvent;
    class NotebookDiffEditorEventDispatcher extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeLayout = this._register(new event_1.Emitter());
            this.onDidChangeLayout = this._onDidChangeLayout.event;
            this._onDidChangeCellLayout = this._register(new event_1.Emitter());
            this.onDidChangeCellLayout = this._onDidChangeCellLayout.event;
        }
        emit(events) {
            for (let i = 0, len = events.length; i < len; i++) {
                const e = events[i];
                switch (e.type) {
                    case NotebookDiffViewEventType.LayoutChanged:
                        this._onDidChangeLayout.fire(e);
                        break;
                    case NotebookDiffViewEventType.CellLayoutChanged:
                        this._onDidChangeCellLayout.fire(e);
                        break;
                }
            }
        }
    }
    exports.NotebookDiffEditorEventDispatcher = NotebookDiffEditorEventDispatcher;
});
//# sourceMappingURL=eventDispatcher.js.map