/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle"], function (require, exports, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellPart = void 0;
    class CellPart extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.cellDisposables = new lifecycle_1.DisposableStore();
        }
        /**
         * Update the DOM for the cell `element`
         */
        renderCell(element) {
            this.currentCell = element;
            this.didRenderCell(element);
        }
        didRenderCell(element) { }
        /**
         * Dispose any disposables generated from `didRenderCell`
         */
        unrenderCell(element) {
            this.currentCell = undefined;
            this.cellDisposables.clear();
        }
        /**
         * Perform DOM read operations to prepare for the list/cell layout update.
         */
        prepareLayout() { }
        /**
         * Update internal DOM (top positions) per cell layout info change
         * Note that a cell part doesn't need to call `DOM.scheduleNextFrame`,
         * the list view will ensure that layout call is invoked in the right frame
         */
        updateInternalLayoutNow(element) { }
        /**
         * Update per cell state change
         */
        updateState(element, e) { }
        /**
         * Update per execution state change.
         */
        updateForExecutionState(element, e) { }
    }
    exports.CellPart = CellPart;
});
//# sourceMappingURL=cellPart.js.map