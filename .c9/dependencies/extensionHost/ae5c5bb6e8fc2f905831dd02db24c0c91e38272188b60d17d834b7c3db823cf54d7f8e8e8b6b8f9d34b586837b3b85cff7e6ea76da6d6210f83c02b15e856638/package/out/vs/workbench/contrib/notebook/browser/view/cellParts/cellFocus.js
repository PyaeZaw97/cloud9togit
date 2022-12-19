/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/workbench/contrib/notebook/browser/view/cellPart"], function (require, exports, DOM, cellPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellFocusPart = void 0;
    class CellFocusPart extends cellPart_1.CellPart {
        constructor(containerElement, focusSinkElement, notebookEditor) {
            super();
            this._register(DOM.addDisposableListener(containerElement, DOM.EventType.FOCUS, () => {
                if (this.currentCell) {
                    notebookEditor.focusElement(this.currentCell);
                }
            }, true));
            if (focusSinkElement) {
                this._register(DOM.addDisposableListener(focusSinkElement, DOM.EventType.FOCUS, () => {
                    if (this.currentCell && this.currentCell.outputsViewModels.length) {
                        notebookEditor.focusNotebookCell(this.currentCell, 'output');
                    }
                }));
            }
        }
    }
    exports.CellFocusPart = CellFocusPart;
});
//# sourceMappingURL=cellFocus.js.map