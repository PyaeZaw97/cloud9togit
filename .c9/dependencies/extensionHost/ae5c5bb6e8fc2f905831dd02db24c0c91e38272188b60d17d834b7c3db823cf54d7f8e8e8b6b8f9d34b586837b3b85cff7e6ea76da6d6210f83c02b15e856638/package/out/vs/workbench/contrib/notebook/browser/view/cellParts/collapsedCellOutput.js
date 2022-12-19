/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/codicons", "vs/nls", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/cellPart"], function (require, exports, DOM, codicons_1, nls_1, keybinding_1, notebookBrowser_1, cellPart_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollapsedCellOutput = void 0;
    const $ = DOM.$;
    let CollapsedCellOutput = class CollapsedCellOutput extends cellPart_1.CellPart {
        constructor(notebookEditor, cellOutputCollapseContainer, keybindingService) {
            super();
            this.notebookEditor = notebookEditor;
            const placeholder = DOM.append(cellOutputCollapseContainer, $('span.expandOutputPlaceholder'));
            placeholder.textContent = (0, nls_1.localize)('cellOutputsCollapsedMsg', "Outputs are collapsed");
            const expandIcon = DOM.append(cellOutputCollapseContainer, $('span.expandOutputIcon'));
            expandIcon.classList.add(...codicons_1.CSSIcon.asClassNameArray(codicons_1.Codicon.more));
            const keybinding = keybindingService.lookupKeybinding(notebookBrowser_1.EXPAND_CELL_OUTPUT_COMMAND_ID);
            if (keybinding) {
                placeholder.title = (0, nls_1.localize)('cellExpandOutputButtonLabelWithDoubleClick', "Double click to expand cell output ({0})", keybinding.getLabel());
                cellOutputCollapseContainer.title = (0, nls_1.localize)('cellExpandOutputButtonLabel', "Expand Cell Output (${0})", keybinding.getLabel());
            }
            DOM.hide(cellOutputCollapseContainer);
            this._register(DOM.addDisposableListener(expandIcon, DOM.EventType.CLICK, () => this.expand()));
            this._register(DOM.addDisposableListener(cellOutputCollapseContainer, DOM.EventType.DBLCLICK, () => this.expand()));
        }
        expand() {
            if (!this.currentCell) {
                return;
            }
            if (!this.currentCell) {
                return;
            }
            const textModel = this.notebookEditor.textModel;
            const index = textModel.cells.indexOf(this.currentCell.model);
            if (index < 0) {
                return;
            }
            this.currentCell.isOutputCollapsed = !this.currentCell.isOutputCollapsed;
        }
    };
    CollapsedCellOutput = __decorate([
        __param(2, keybinding_1.IKeybindingService)
    ], CollapsedCellOutput);
    exports.CollapsedCellOutput = CollapsedCellOutput;
});
//# sourceMappingURL=collapsedCellOutput.js.map