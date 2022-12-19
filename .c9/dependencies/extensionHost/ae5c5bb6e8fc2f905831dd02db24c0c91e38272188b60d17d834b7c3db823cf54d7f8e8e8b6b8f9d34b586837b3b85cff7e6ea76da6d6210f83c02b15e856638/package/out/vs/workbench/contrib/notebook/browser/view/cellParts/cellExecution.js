/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/view/cellPart"], function (require, exports, DOM, lifecycle_1, cellPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellExecutionPart = void 0;
    class CellExecutionPart extends cellPart_1.CellPart {
        constructor(_notebookEditor, _executionOrderLabel) {
            super();
            this._notebookEditor = _notebookEditor;
            this._executionOrderLabel = _executionOrderLabel;
            this.kernelDisposables = this._register(new lifecycle_1.DisposableStore());
            this._register(this._notebookEditor.onDidChangeActiveKernel(() => {
                if (this.currentCell) {
                    this.kernelDisposables.clear();
                    if (this._notebookEditor.activeKernel) {
                        this.kernelDisposables.add(this._notebookEditor.activeKernel.onDidChange(() => {
                            if (this.currentCell) {
                                this.updateExecutionOrder(this.currentCell.internalMetadata);
                            }
                        }));
                    }
                    this.updateExecutionOrder(this.currentCell.internalMetadata);
                }
            }));
        }
        didRenderCell(element) {
            this.updateExecutionOrder(element.internalMetadata);
        }
        updateExecutionOrder(internalMetadata) {
            var _a, _b;
            if (((_a = this._notebookEditor.activeKernel) === null || _a === void 0 ? void 0 : _a.type) === 0 /* NotebookKernelType.Resolved */ && ((_b = this._notebookEditor.activeKernel) === null || _b === void 0 ? void 0 : _b.implementsExecutionOrder)) {
                const executionOrderLabel = typeof internalMetadata.executionOrder === 'number' ?
                    `[${internalMetadata.executionOrder}]` :
                    '[ ]';
                this._executionOrderLabel.innerText = executionOrderLabel;
            }
            else {
                this._executionOrderLabel.innerText = '';
            }
        }
        updateState(element, e) {
            if (e.internalMetadataChanged) {
                this.updateExecutionOrder(element.internalMetadata);
            }
        }
        updateInternalLayoutNow(element) {
            if (element.isInputCollapsed) {
                DOM.hide(this._executionOrderLabel);
            }
            else {
                DOM.show(this._executionOrderLabel);
                const top = element.layoutInfo.editorHeight - 22 + element.layoutInfo.statusBarHeight;
                this._executionOrderLabel.style.top = `${top}px`;
            }
        }
    }
    exports.CellExecutionPart = CellExecutionPart;
});
//# sourceMappingURL=cellExecution.js.map