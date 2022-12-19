/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, DOM, fastDomNode_1, cellPart_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellFocusIndicator = void 0;
    class CellFocusIndicator extends cellPart_1.CellPart {
        constructor(notebookEditor, titleToolbar, top, left, right, bottom) {
            super();
            this.notebookEditor = notebookEditor;
            this.titleToolbar = titleToolbar;
            this.top = top;
            this.left = left;
            this.right = right;
            this.bottom = bottom;
            this.codeFocusIndicator = new fastDomNode_1.FastDomNode(DOM.append(this.left.domNode, DOM.$('.codeOutput-focus-indicator-container', undefined, DOM.$('.codeOutput-focus-indicator.code-focus-indicator'))));
            this.outputFocusIndicator = new fastDomNode_1.FastDomNode(DOM.append(this.left.domNode, DOM.$('.codeOutput-focus-indicator-container', undefined, DOM.$('.codeOutput-focus-indicator.output-focus-indicator'))));
            this._register(DOM.addDisposableListener(this.codeFocusIndicator.domNode, DOM.EventType.CLICK, () => {
                if (this.currentCell) {
                    this.currentCell.isInputCollapsed = !this.currentCell.isInputCollapsed;
                }
            }));
            this._register(DOM.addDisposableListener(this.outputFocusIndicator.domNode, DOM.EventType.CLICK, () => {
                if (this.currentCell) {
                    this.currentCell.isOutputCollapsed = !this.currentCell.isOutputCollapsed;
                }
            }));
            this._register(DOM.addDisposableListener(this.left.domNode, DOM.EventType.DBLCLICK, e => {
                if (!this.currentCell || !this.notebookEditor.hasModel()) {
                    return;
                }
                if (e.target !== this.left.domNode) {
                    // Don't allow dblclick on the codeFocusIndicator/outputFocusIndicator
                    return;
                }
                const clickedOnInput = e.offsetY < this.currentCell.layoutInfo.outputContainerOffset;
                if (clickedOnInput) {
                    this.currentCell.isInputCollapsed = !this.currentCell.isInputCollapsed;
                }
                else {
                    this.currentCell.isOutputCollapsed = !this.currentCell.isOutputCollapsed;
                }
            }));
            this._register(this.titleToolbar.onDidUpdateActions(() => {
                this.updateFocusIndicatorsForTitleMenu();
            }));
        }
        updateInternalLayoutNow(element) {
            var _a, _b;
            if (element.cellKind === notebookCommon_1.CellKind.Markup) {
                // markdown cell
                const indicatorPostion = this.notebookEditor.notebookOptions.computeIndicatorPosition(element.layoutInfo.totalHeight, element.layoutInfo.foldHintHeight, (_a = this.notebookEditor.textModel) === null || _a === void 0 ? void 0 : _a.viewType);
                this.bottom.domNode.style.transform = `translateY(${indicatorPostion.bottomIndicatorTop}px)`;
                this.left.setHeight(indicatorPostion.verticalIndicatorHeight);
                this.right.setHeight(indicatorPostion.verticalIndicatorHeight);
                this.codeFocusIndicator.setHeight(indicatorPostion.verticalIndicatorHeight);
            }
            else {
                // code cell
                const cell = element;
                const layoutInfo = this.notebookEditor.notebookOptions.getLayoutConfiguration();
                const bottomToolbarDimensions = this.notebookEditor.notebookOptions.computeBottomToolbarDimensions((_b = this.notebookEditor.textModel) === null || _b === void 0 ? void 0 : _b.viewType);
                const indicatorHeight = cell.layoutInfo.codeIndicatorHeight + cell.layoutInfo.outputIndicatorHeight + cell.layoutInfo.commentHeight;
                this.left.setHeight(indicatorHeight);
                this.right.setHeight(indicatorHeight);
                this.codeFocusIndicator.setHeight(cell.layoutInfo.codeIndicatorHeight);
                this.outputFocusIndicator.setHeight(Math.max(cell.layoutInfo.outputIndicatorHeight - cell.viewContext.notebookOptions.getLayoutConfiguration().focusIndicatorGap, 0));
                this.bottom.domNode.style.transform = `translateY(${cell.layoutInfo.totalHeight - bottomToolbarDimensions.bottomToolbarGap - layoutInfo.cellBottomMargin}px)`;
            }
            this.updateFocusIndicatorsForTitleMenu();
        }
        updateFocusIndicatorsForTitleMenu() {
            const layoutInfo = this.notebookEditor.notebookOptions.getLayoutConfiguration();
            if (this.titleToolbar.hasActions) {
                this.left.domNode.style.transform = `translateY(${layoutInfo.editorToolbarHeight + layoutInfo.cellTopMargin}px)`;
                this.right.domNode.style.transform = `translateY(${layoutInfo.editorToolbarHeight + layoutInfo.cellTopMargin}px)`;
            }
            else {
                this.left.domNode.style.transform = `translateY(${layoutInfo.cellTopMargin}px)`;
                this.right.domNode.style.transform = `translateY(${layoutInfo.cellTopMargin}px)`;
            }
        }
    }
    exports.CellFocusIndicator = CellFocusIndicator;
});
//# sourceMappingURL=cellFocusIndicator.js.map