/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, contextkey_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NOTEBOOK_HAS_OUTPUTS = exports.NOTEBOOK_MISSING_KERNEL_EXTENSION = exports.NOTEBOOK_INTERRUPTIBLE_KERNEL = exports.NOTEBOOK_KERNEL_SELECTED = exports.NOTEBOOK_KERNEL_COUNT = exports.NOTEBOOK_KERNEL = exports.NOTEBOOK_CELL_RESOURCE = exports.NOTEBOOK_CELL_OUTPUT_COLLAPSED = exports.NOTEBOOK_CELL_INPUT_COLLAPSED = exports.NOTEBOOK_CELL_HAS_OUTPUTS = exports.NOTEBOOK_CELL_EXECUTING = exports.NOTEBOOK_CELL_EXECUTION_STATE = exports.NOTEBOOK_CELL_LINE_NUMBERS = exports.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE = exports.NOTEBOOK_CELL_EDITOR_FOCUSED = exports.NOTEBOOK_CELL_FOCUSED = exports.NOTEBOOK_CELL_EDITABLE = exports.NOTEBOOK_CELL_TYPE = exports.NOTEBOOK_VIEW_TYPE = exports.NOTEBOOK_CELL_TOOLBAR_LOCATION = exports.NOTEBOOK_BREAKPOINT_MARGIN_ACTIVE = exports.NOTEBOOK_USE_CONSOLIDATED_OUTPUT_BUTTON = exports.NOTEBOOK_HAS_RUNNING_CELL = exports.NOTEBOOK_EDITOR_EDITABLE = exports.NOTEBOOK_OUTPUT_FOCUSED = exports.NOTEBOOK_CELL_LIST_FOCUSED = exports.NOTEBOOK_EDITOR_FOCUSED = exports.NOTEBOOK_IS_ACTIVE_EDITOR = exports.KEYBINDING_CONTEXT_NOTEBOOK_FIND_WIDGET_FOCUSED = exports.HAS_OPENED_NOTEBOOK = void 0;
    //#region Context Keys
    exports.HAS_OPENED_NOTEBOOK = new contextkey_1.RawContextKey('userHasOpenedNotebook', false);
    exports.KEYBINDING_CONTEXT_NOTEBOOK_FIND_WIDGET_FOCUSED = new contextkey_1.RawContextKey('notebookFindWidgetFocused', false);
    // Is Notebook
    exports.NOTEBOOK_IS_ACTIVE_EDITOR = contextkey_1.ContextKeyExpr.equals('activeEditor', notebookCommon_1.NOTEBOOK_EDITOR_ID);
    // Editor keys
    exports.NOTEBOOK_EDITOR_FOCUSED = new contextkey_1.RawContextKey('notebookEditorFocused', false);
    exports.NOTEBOOK_CELL_LIST_FOCUSED = new contextkey_1.RawContextKey('notebookCellListFocused', false);
    exports.NOTEBOOK_OUTPUT_FOCUSED = new contextkey_1.RawContextKey('notebookOutputFocused', false);
    exports.NOTEBOOK_EDITOR_EDITABLE = new contextkey_1.RawContextKey('notebookEditable', true);
    exports.NOTEBOOK_HAS_RUNNING_CELL = new contextkey_1.RawContextKey('notebookHasRunningCell', false);
    exports.NOTEBOOK_USE_CONSOLIDATED_OUTPUT_BUTTON = new contextkey_1.RawContextKey('notebookUseConsolidatedOutputButton', false);
    exports.NOTEBOOK_BREAKPOINT_MARGIN_ACTIVE = new contextkey_1.RawContextKey('notebookBreakpointMargin', false);
    exports.NOTEBOOK_CELL_TOOLBAR_LOCATION = new contextkey_1.RawContextKey('notebookCellToolbarLocation', 'left');
    // Cell keys
    exports.NOTEBOOK_VIEW_TYPE = new contextkey_1.RawContextKey('notebookType', undefined);
    exports.NOTEBOOK_CELL_TYPE = new contextkey_1.RawContextKey('notebookCellType', undefined);
    exports.NOTEBOOK_CELL_EDITABLE = new contextkey_1.RawContextKey('notebookCellEditable', false);
    exports.NOTEBOOK_CELL_FOCUSED = new contextkey_1.RawContextKey('notebookCellFocused', false);
    exports.NOTEBOOK_CELL_EDITOR_FOCUSED = new contextkey_1.RawContextKey('notebookCellEditorFocused', false);
    exports.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE = new contextkey_1.RawContextKey('notebookCellMarkdownEditMode', false);
    exports.NOTEBOOK_CELL_LINE_NUMBERS = new contextkey_1.RawContextKey('notebookCellLineNumbers', 'inherit');
    exports.NOTEBOOK_CELL_EXECUTION_STATE = new contextkey_1.RawContextKey('notebookCellExecutionState', undefined);
    exports.NOTEBOOK_CELL_EXECUTING = new contextkey_1.RawContextKey('notebookCellExecuting', false); // This only exists to simplify a context key expression, see #129625
    exports.NOTEBOOK_CELL_HAS_OUTPUTS = new contextkey_1.RawContextKey('notebookCellHasOutputs', false);
    exports.NOTEBOOK_CELL_INPUT_COLLAPSED = new contextkey_1.RawContextKey('notebookCellInputIsCollapsed', false);
    exports.NOTEBOOK_CELL_OUTPUT_COLLAPSED = new contextkey_1.RawContextKey('notebookCellOutputIsCollapsed', false);
    exports.NOTEBOOK_CELL_RESOURCE = new contextkey_1.RawContextKey('notebookCellResource', '');
    // Kernels
    exports.NOTEBOOK_KERNEL = new contextkey_1.RawContextKey('notebookKernel', undefined);
    exports.NOTEBOOK_KERNEL_COUNT = new contextkey_1.RawContextKey('notebookKernelCount', 0);
    exports.NOTEBOOK_KERNEL_SELECTED = new contextkey_1.RawContextKey('notebookKernelSelected', false);
    exports.NOTEBOOK_INTERRUPTIBLE_KERNEL = new contextkey_1.RawContextKey('notebookInterruptibleKernel', false);
    exports.NOTEBOOK_MISSING_KERNEL_EXTENSION = new contextkey_1.RawContextKey('notebookMissingKernelExtension', false);
    exports.NOTEBOOK_HAS_OUTPUTS = new contextkey_1.RawContextKey('notebookHasOutputs', false);
});
//#endregion
//# sourceMappingURL=notebookContextKeys.js.map