/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellSelectionCollection = void 0;
    function rangesEqual(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (a[i].start !== b[i].start || a[i].end !== b[i].end) {
                return false;
            }
        }
        return true;
    }
    // Handle first, then we migrate to ICellRange competely
    // Challenge is List View talks about `element`, which needs extra work to convert to ICellRange as we support Folding and Cell Move
    class NotebookCellSelectionCollection extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this._primary = null;
            this._selections = [];
        }
        get onDidChangeSelection() { return this._onDidChangeSelection.event; }
        get selections() {
            return this._selections;
        }
        get selection() {
            return this._selections[0];
        }
        get focus() {
            var _a;
            return (_a = this._primary) !== null && _a !== void 0 ? _a : { start: 0, end: 0 };
        }
        setState(primary, selections, forceEventEmit, source) {
            const changed = primary !== this._primary || !rangesEqual(this._selections, selections);
            this._primary = primary;
            this._selections = selections;
            if (changed || forceEventEmit) {
                this._onDidChangeSelection.fire(source);
            }
        }
        setFocus(selection, forceEventEmit, source) {
            this.setState(selection, this._selections, forceEventEmit, source);
        }
        setSelections(selections, forceEventEmit, source) {
            this.setState(this._primary, selections, forceEventEmit, source);
        }
    }
    exports.NotebookCellSelectionCollection = NotebookCellSelectionCollection;
});
//# sourceMappingURL=cellSelectionCollection.js.map