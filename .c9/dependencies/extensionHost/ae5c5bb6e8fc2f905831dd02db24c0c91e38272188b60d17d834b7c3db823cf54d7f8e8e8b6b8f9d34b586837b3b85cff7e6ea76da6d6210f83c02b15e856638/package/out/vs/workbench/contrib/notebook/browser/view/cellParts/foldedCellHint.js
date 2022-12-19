/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/codicons", "vs/nls", "vs/workbench/contrib/notebook/browser/controller/foldingController", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/cellPart"], function (require, exports, DOM, codicons_1, nls_1, foldingController_1, notebookBrowser_1, cellPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FoldedCellHint = void 0;
    class FoldedCellHint extends cellPart_1.CellPart {
        constructor(_notebookEditor, _container) {
            super();
            this._notebookEditor = _notebookEditor;
            this._container = _container;
        }
        didRenderCell(element) {
            this.update(element);
        }
        update(element) {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            if (element.isInputCollapsed || element.getEditState() === notebookBrowser_1.CellEditState.Editing) {
                DOM.hide(this._container);
            }
            else if (element.foldingState === 2 /* CellFoldingState.Collapsed */) {
                const idx = this._notebookEditor._getViewModel().getCellIndex(element);
                const length = this._notebookEditor._getViewModel().getFoldedLength(idx);
                DOM.reset(this._container, this.getHiddenCellsLabel(length), this.getHiddenCellHintButton(element));
                DOM.show(this._container);
                const foldHintTop = element.layoutInfo.previewHeight;
                this._container.style.top = `${foldHintTop}px`;
            }
            else if (element.foldingState === 1 /* CellFoldingState.Expanded */) {
                DOM.hide(this._container);
            }
        }
        getHiddenCellsLabel(num) {
            const label = num === 1 ?
                (0, nls_1.localize)('hiddenCellsLabel', "1 cell hidden") :
                (0, nls_1.localize)('hiddenCellsLabelPlural', "{0} cells hidden", num);
            return DOM.$('span.notebook-folded-hint-label', undefined, label);
        }
        getHiddenCellHintButton(element) {
            const expandIcon = DOM.$('span.cell-expand-part-button');
            expandIcon.classList.add(...codicons_1.CSSIcon.asClassNameArray(codicons_1.Codicon.more));
            this._register(DOM.addDisposableListener(expandIcon, DOM.EventType.CLICK, () => {
                const controller = this._notebookEditor.getContribution(foldingController_1.FoldingController.id);
                const idx = this._notebookEditor.getCellIndex(element);
                if (typeof idx === 'number') {
                    controller.setFoldingStateDown(idx, 1 /* CellFoldingState.Expanded */, 1);
                }
            }));
            return expandIcon;
        }
        updateInternalLayoutNow(element) {
            this.update(element);
        }
    }
    exports.FoldedCellHint = FoldedCellHint;
});
//# sourceMappingURL=foldedCellHint.js.map