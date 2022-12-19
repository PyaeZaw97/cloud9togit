/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookEditorInput", "vs/workbench/contrib/notebook/common/notebookRange"], function (require, exports, notebookCommon_1, notebookEditorInput_1, notebookRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellFoldingState = exports.cellRangeToViewCells = exports.expandCellRangesWithHiddenCells = exports.getNotebookEditorFromEditorPane = exports.CursorAtBoundary = exports.CellFocusMode = exports.CellEditState = exports.CellLayoutContext = exports.CellLayoutState = exports.RenderOutputType = exports.KERNEL_EXTENSIONS = exports.JUPYTER_EXTENSION_ID = exports.IPYNB_VIEW_TYPE = exports.EXPAND_CELL_OUTPUT_COMMAND_ID = exports.QUIT_EDIT_CELL_COMMAND_ID = exports.CHANGE_CELL_LANGUAGE = exports.DETECT_CELL_LANGUAGE = exports.EXECUTE_CELL_COMMAND_ID = exports.EXPAND_CELL_INPUT_COMMAND_ID = void 0;
    //#region Shared commands
    exports.EXPAND_CELL_INPUT_COMMAND_ID = 'notebook.cell.expandCellInput';
    exports.EXECUTE_CELL_COMMAND_ID = 'notebook.cell.execute';
    exports.DETECT_CELL_LANGUAGE = 'notebook.cell.detectLanguage';
    exports.CHANGE_CELL_LANGUAGE = 'notebook.cell.changeLanguage';
    exports.QUIT_EDIT_CELL_COMMAND_ID = 'notebook.cell.quitEdit';
    exports.EXPAND_CELL_OUTPUT_COMMAND_ID = 'notebook.cell.expandCellOutput';
    //#endregion
    //#region Notebook extensions
    // Hardcoding viewType/extension ID for now. TODO these should be replaced once we can
    // look them up in the marketplace dynamically.
    exports.IPYNB_VIEW_TYPE = 'jupyter-notebook';
    exports.JUPYTER_EXTENSION_ID = 'ms-toolsai.jupyter';
    /** @deprecated use the notebookKernel<Type> "keyword" instead */
    exports.KERNEL_EXTENSIONS = new Map([
        [exports.IPYNB_VIEW_TYPE, exports.JUPYTER_EXTENSION_ID],
    ]);
    //#endregion
    //#region  Output related types
    var RenderOutputType;
    (function (RenderOutputType) {
        RenderOutputType[RenderOutputType["Html"] = 0] = "Html";
        RenderOutputType[RenderOutputType["Extension"] = 1] = "Extension";
    })(RenderOutputType = exports.RenderOutputType || (exports.RenderOutputType = {}));
    //#endregion
    var CellLayoutState;
    (function (CellLayoutState) {
        CellLayoutState[CellLayoutState["Uninitialized"] = 0] = "Uninitialized";
        CellLayoutState[CellLayoutState["Estimated"] = 1] = "Estimated";
        CellLayoutState[CellLayoutState["FromCache"] = 2] = "FromCache";
        CellLayoutState[CellLayoutState["Measured"] = 3] = "Measured";
    })(CellLayoutState = exports.CellLayoutState || (exports.CellLayoutState = {}));
    var CellLayoutContext;
    (function (CellLayoutContext) {
        CellLayoutContext[CellLayoutContext["Fold"] = 0] = "Fold";
    })(CellLayoutContext = exports.CellLayoutContext || (exports.CellLayoutContext = {}));
    var CellEditState;
    (function (CellEditState) {
        /**
         * Default state.
         * For markup cells, this is the renderer version of the markup.
         * For code cell, the browser focus should be on the container instead of the editor
         */
        CellEditState[CellEditState["Preview"] = 0] = "Preview";
        /**
         * Editing mode. Source for markup or code is rendered in editors and the state will be persistent.
         */
        CellEditState[CellEditState["Editing"] = 1] = "Editing";
    })(CellEditState = exports.CellEditState || (exports.CellEditState = {}));
    var CellFocusMode;
    (function (CellFocusMode) {
        CellFocusMode[CellFocusMode["Container"] = 0] = "Container";
        CellFocusMode[CellFocusMode["Editor"] = 1] = "Editor";
    })(CellFocusMode = exports.CellFocusMode || (exports.CellFocusMode = {}));
    var CursorAtBoundary;
    (function (CursorAtBoundary) {
        CursorAtBoundary[CursorAtBoundary["None"] = 0] = "None";
        CursorAtBoundary[CursorAtBoundary["Top"] = 1] = "Top";
        CursorAtBoundary[CursorAtBoundary["Bottom"] = 2] = "Bottom";
        CursorAtBoundary[CursorAtBoundary["Both"] = 3] = "Both";
    })(CursorAtBoundary = exports.CursorAtBoundary || (exports.CursorAtBoundary = {}));
    function getNotebookEditorFromEditorPane(editorPane) {
        if (!editorPane) {
            return;
        }
        if (editorPane.getId() === notebookCommon_1.NOTEBOOK_EDITOR_ID) {
            return editorPane.getControl();
        }
        const input = editorPane.input;
        if (input && (0, notebookEditorInput_1.isCompositeNotebookEditorInput)(input)) {
            return editorPane.getControl().notebookEditor;
        }
        return undefined;
    }
    exports.getNotebookEditorFromEditorPane = getNotebookEditorFromEditorPane;
    /**
     * ranges: model selections
     * this will convert model selections to view indexes first, and then include the hidden ranges in the list view
     */
    function expandCellRangesWithHiddenCells(editor, ranges) {
        // assuming ranges are sorted and no overlap
        const indexes = (0, notebookRange_1.cellRangesToIndexes)(ranges);
        const modelRanges = [];
        indexes.forEach(index => {
            const viewCell = editor.cellAt(index);
            if (!viewCell) {
                return;
            }
            const viewIndex = editor.getViewIndexByModelIndex(index);
            if (viewIndex < 0) {
                return;
            }
            const nextViewIndex = viewIndex + 1;
            const range = editor.getCellRangeFromViewRange(viewIndex, nextViewIndex);
            if (range) {
                modelRanges.push(range);
            }
        });
        return (0, notebookRange_1.reduceCellRanges)(modelRanges);
    }
    exports.expandCellRangesWithHiddenCells = expandCellRangesWithHiddenCells;
    function cellRangeToViewCells(editor, ranges) {
        const cells = [];
        (0, notebookRange_1.reduceCellRanges)(ranges).forEach(range => {
            cells.push(...editor.getCellsInRange(range));
        });
        return cells;
    }
    exports.cellRangeToViewCells = cellRangeToViewCells;
    //#region Cell Folding
    var CellFoldingState;
    (function (CellFoldingState) {
        CellFoldingState[CellFoldingState["None"] = 0] = "None";
        CellFoldingState[CellFoldingState["Expanded"] = 1] = "Expanded";
        CellFoldingState[CellFoldingState["Collapsed"] = 2] = "Collapsed";
    })(CellFoldingState = exports.CellFoldingState || (exports.CellFoldingState = {}));
});
//#endregion
//# sourceMappingURL=notebookBrowser.js.map