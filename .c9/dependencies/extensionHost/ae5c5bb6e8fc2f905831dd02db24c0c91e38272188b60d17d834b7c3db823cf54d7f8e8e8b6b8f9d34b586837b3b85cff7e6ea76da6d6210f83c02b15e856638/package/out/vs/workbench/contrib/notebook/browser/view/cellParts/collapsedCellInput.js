/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/workbench/contrib/notebook/browser/view/cellPart"], function (require, exports, DOM, cellPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollapsedCellInput = void 0;
    class CollapsedCellInput extends cellPart_1.CellPart {
        constructor(notebookEditor, cellInputCollapsedContainer) {
            super();
            this.notebookEditor = notebookEditor;
            this._register(DOM.addDisposableListener(cellInputCollapsedContainer, DOM.EventType.DBLCLICK, e => {
                if (!this.currentCell || !this.notebookEditor.hasModel()) {
                    return;
                }
                if (this.currentCell.isInputCollapsed) {
                    this.currentCell.isInputCollapsed = false;
                }
                else {
                    this.currentCell.isOutputCollapsed = false;
                }
            }));
            this._register(DOM.addDisposableListener(cellInputCollapsedContainer, DOM.EventType.CLICK, e => {
                if (!this.currentCell || !this.notebookEditor.hasModel()) {
                    return;
                }
                const element = e.target;
                if (element && element.classList && element.classList.contains('expandInputIcon')) {
                    // clicked on the expand icon
                    this.currentCell.isInputCollapsed = false;
                }
            }));
        }
    }
    exports.CollapsedCellInput = CollapsedCellInput;
});
//# sourceMappingURL=collapsedCellInput.js.map