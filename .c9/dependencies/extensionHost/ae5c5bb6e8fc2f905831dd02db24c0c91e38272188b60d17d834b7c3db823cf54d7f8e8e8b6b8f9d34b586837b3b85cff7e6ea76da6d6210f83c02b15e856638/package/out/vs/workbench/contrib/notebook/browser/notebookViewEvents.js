/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellStateChangedEvent = exports.NotebookMetadataChangedEvent = exports.NotebookLayoutChangedEvent = exports.NotebookViewEventType = void 0;
    var NotebookViewEventType;
    (function (NotebookViewEventType) {
        NotebookViewEventType[NotebookViewEventType["LayoutChanged"] = 1] = "LayoutChanged";
        NotebookViewEventType[NotebookViewEventType["MetadataChanged"] = 2] = "MetadataChanged";
        NotebookViewEventType[NotebookViewEventType["CellStateChanged"] = 3] = "CellStateChanged";
    })(NotebookViewEventType = exports.NotebookViewEventType || (exports.NotebookViewEventType = {}));
    class NotebookLayoutChangedEvent {
        constructor(source, value) {
            this.source = source;
            this.value = value;
            this.type = NotebookViewEventType.LayoutChanged;
        }
    }
    exports.NotebookLayoutChangedEvent = NotebookLayoutChangedEvent;
    class NotebookMetadataChangedEvent {
        constructor(source) {
            this.source = source;
            this.type = NotebookViewEventType.MetadataChanged;
        }
    }
    exports.NotebookMetadataChangedEvent = NotebookMetadataChangedEvent;
    class NotebookCellStateChangedEvent {
        constructor(source, cell) {
            this.source = source;
            this.cell = cell;
            this.type = NotebookViewEventType.CellStateChanged;
        }
    }
    exports.NotebookCellStateChangedEvent = NotebookCellStateChangedEvent;
});
//# sourceMappingURL=notebookViewEvents.js.map