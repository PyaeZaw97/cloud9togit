/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/numbers"], function (require, exports, numbers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerStickyScroll = void 0;
    function registerStickyScroll(notebookEditor, cell, element, opts) {
        var _a, _b;
        const extraOffset = (_a = opts === null || opts === void 0 ? void 0 : opts.extraOffset) !== null && _a !== void 0 ? _a : 0;
        const min = (_b = opts === null || opts === void 0 ? void 0 : opts.min) !== null && _b !== void 0 ? _b : 0;
        const updateForScroll = () => {
            var _a;
            if (cell.isInputCollapsed) {
                element.style.top = '';
            }
            else {
                const scrollPadding = notebookEditor.notebookOptions.computeTopInsertToolbarHeight((_a = notebookEditor.textModel) === null || _a === void 0 ? void 0 : _a.viewType);
                const scrollTop = notebookEditor.scrollTop - scrollPadding;
                const elementTop = notebookEditor.getAbsoluteTopOfElement(cell);
                const diff = scrollTop - elementTop + extraOffset;
                const maxTop = cell.layoutInfo.editorHeight + cell.layoutInfo.statusBarHeight - 45; // subtract roughly the height of the execution order label plus padding
                const top = maxTop > 20 ? // Don't move the run button if it can only move a very short distance
                    (0, numbers_1.clamp)(min, diff, maxTop) :
                    min;
                element.style.top = `${top}px`;
            }
        };
        updateForScroll();
        return notebookEditor.onDidScroll(() => updateForScroll());
    }
    exports.registerStickyScroll = registerStickyScroll;
});
//# sourceMappingURL=stickyScroll.js.map