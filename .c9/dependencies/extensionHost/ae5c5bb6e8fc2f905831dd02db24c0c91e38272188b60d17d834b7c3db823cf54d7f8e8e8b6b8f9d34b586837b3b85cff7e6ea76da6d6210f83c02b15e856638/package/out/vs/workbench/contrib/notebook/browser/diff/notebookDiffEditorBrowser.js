/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NOTEBOOK_DIFF_CELL_PROPERTY_EXPANDED = exports.NOTEBOOK_DIFF_CELL_PROPERTY = exports.NOTEBOOK_DIFF_CELL_INPUT = exports.DIFF_CELL_MARGIN = exports.DiffSide = void 0;
    var DiffSide;
    (function (DiffSide) {
        DiffSide[DiffSide["Original"] = 0] = "Original";
        DiffSide[DiffSide["Modified"] = 1] = "Modified";
    })(DiffSide = exports.DiffSide || (exports.DiffSide = {}));
    exports.DIFF_CELL_MARGIN = 16;
    exports.NOTEBOOK_DIFF_CELL_INPUT = new contextkey_1.RawContextKey('notebookDiffCellInputChanged', false);
    exports.NOTEBOOK_DIFF_CELL_PROPERTY = new contextkey_1.RawContextKey('notebookDiffCellPropertyChanged', false);
    exports.NOTEBOOK_DIFF_CELL_PROPERTY_EXPANDED = new contextkey_1.RawContextKey('notebookDiffCellPropertyExpanded', false);
});
//# sourceMappingURL=notebookDiffEditorBrowser.js.map