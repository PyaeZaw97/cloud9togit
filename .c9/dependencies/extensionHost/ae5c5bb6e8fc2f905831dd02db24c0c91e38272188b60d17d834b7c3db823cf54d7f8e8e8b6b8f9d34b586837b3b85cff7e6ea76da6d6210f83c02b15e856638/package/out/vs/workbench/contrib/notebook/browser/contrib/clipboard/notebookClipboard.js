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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/editor/contrib/clipboard/browser/clipboard", "vs/platform/clipboard/common/clipboardService", "vs/workbench/contrib/notebook/common/model/notebookCellTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService", "vs/base/common/platform", "vs/platform/actions/common/actions", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/editor/browser/editorExtensions", "vs/workbench/common/actions", "vs/workbench/services/output/common/output", "vs/workbench/contrib/logs/common/logConstants", "vs/platform/log/common/log"], function (require, exports, nls_1, lifecycle_1, platform_1, contributions_1, editorService_1, notebookContextKeys_1, notebookBrowser_1, clipboard_1, clipboardService_1, notebookCellTextModel_1, notebookCommon_1, notebookService_1, platform, actions_1, coreActions_1, contextkey_1, contextkeys_1, editorExtensions_1, actions_2, output_1, logConstants_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookClipboardContribution = exports.runCutCells = exports.runCopyCells = exports.runPasteCells = void 0;
    let _logging = false;
    function toggleLogging() {
        _logging = !_logging;
    }
    function _log(loggerService, str) {
        if (_logging) {
            loggerService.info(`[NotebookClipboard]: ${str}`);
        }
    }
    function getFocusedWebviewDelegate(accessor) {
        const loggerService = accessor.get(log_1.ILogService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
        if (!editor) {
            _log(loggerService, '[Revive Webview] No notebook editor found for active editor pane, bypass');
            return;
        }
        if (!editor.hasEditorFocus()) {
            _log(loggerService, '[Revive Webview] Notebook editor is not focused, bypass');
            return;
        }
        if (!editor.hasWebviewFocus()) {
            _log(loggerService, '[Revive Webview] Notebook editor backlayer webview is not focused, bypass');
            return;
        }
        const webview = editor.getInnerWebview();
        _log(loggerService, '[Revive Webview] Notebook editor backlayer webview is focused');
        return webview;
    }
    function withWebview(accessor, f) {
        const webview = getFocusedWebviewDelegate(accessor);
        if (webview) {
            f(webview);
            return true;
        }
        return false;
    }
    const PRIORITY = 105;
    editorExtensions_1.UndoCommand.addImplementation(PRIORITY, 'notebook-webview', accessor => {
        return withWebview(accessor, webview => webview.undo());
    });
    editorExtensions_1.RedoCommand.addImplementation(PRIORITY, 'notebook-webview', accessor => {
        return withWebview(accessor, webview => webview.redo());
    });
    clipboard_1.CopyAction === null || clipboard_1.CopyAction === void 0 ? void 0 : clipboard_1.CopyAction.addImplementation(PRIORITY, 'notebook-webview', accessor => {
        return withWebview(accessor, webview => webview.copy());
    });
    clipboard_1.PasteAction === null || clipboard_1.PasteAction === void 0 ? void 0 : clipboard_1.PasteAction.addImplementation(PRIORITY, 'notebook-webview', accessor => {
        return withWebview(accessor, webview => webview.paste());
    });
    clipboard_1.CutAction === null || clipboard_1.CutAction === void 0 ? void 0 : clipboard_1.CutAction.addImplementation(PRIORITY, 'notebook-webview', accessor => {
        return withWebview(accessor, webview => webview.cut());
    });
    function runPasteCells(editor, activeCell, pasteCells) {
        if (!editor.hasModel()) {
            return false;
        }
        const textModel = editor.textModel;
        if (editor.isReadOnly) {
            return false;
        }
        const originalState = {
            kind: notebookCommon_1.SelectionStateType.Index,
            focus: editor.getFocus(),
            selections: editor.getSelections()
        };
        if (activeCell) {
            const currCellIndex = editor.getCellIndex(activeCell);
            const newFocusIndex = typeof currCellIndex === 'number' ? currCellIndex + 1 : 0;
            textModel.applyEdits([
                {
                    editType: 1 /* CellEditType.Replace */,
                    index: newFocusIndex,
                    count: 0,
                    cells: pasteCells.items.map(cell => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(cell))
                }
            ], true, originalState, () => ({
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: { start: newFocusIndex, end: newFocusIndex + 1 },
                selections: [{ start: newFocusIndex, end: newFocusIndex + pasteCells.items.length }]
            }), undefined, true);
        }
        else {
            if (editor.getLength() !== 0) {
                return false;
            }
            textModel.applyEdits([
                {
                    editType: 1 /* CellEditType.Replace */,
                    index: 0,
                    count: 0,
                    cells: pasteCells.items.map(cell => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(cell))
                }
            ], true, originalState, () => ({
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: { start: 0, end: 1 },
                selections: [{ start: 1, end: pasteCells.items.length + 1 }]
            }), undefined, true);
        }
        return true;
    }
    exports.runPasteCells = runPasteCells;
    function runCopyCells(accessor, editor, targetCell) {
        if (!editor.hasModel()) {
            return false;
        }
        if (editor.hasOutputTextSelection()) {
            document.execCommand('copy');
            return true;
        }
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        const notebookService = accessor.get(notebookService_1.INotebookService);
        const selections = editor.getSelections();
        if (targetCell) {
            const targetCellIndex = editor.getCellIndex(targetCell);
            const containingSelection = selections.find(selection => selection.start <= targetCellIndex && targetCellIndex < selection.end);
            if (!containingSelection) {
                clipboardService.writeText(targetCell.getText());
                notebookService.setToCopy([targetCell.model], true);
                return true;
            }
        }
        const selectionRanges = (0, notebookBrowser_1.expandCellRangesWithHiddenCells)(editor, editor.getSelections());
        const selectedCells = (0, notebookBrowser_1.cellRangeToViewCells)(editor, selectionRanges);
        if (!selectedCells.length) {
            return false;
        }
        clipboardService.writeText(selectedCells.map(cell => cell.getText()).join('\n'));
        notebookService.setToCopy(selectedCells.map(cell => cell.model), true);
        return true;
    }
    exports.runCopyCells = runCopyCells;
    function runCutCells(accessor, editor, targetCell) {
        if (!editor.hasModel() || editor.isReadOnly) {
            return false;
        }
        const textModel = editor.textModel;
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        const notebookService = accessor.get(notebookService_1.INotebookService);
        const selections = editor.getSelections();
        if (targetCell) {
            // from ui
            const targetCellIndex = editor.getCellIndex(targetCell);
            const containingSelection = selections.find(selection => selection.start <= targetCellIndex && targetCellIndex < selection.end);
            if (!containingSelection) {
                clipboardService.writeText(targetCell.getText());
                // delete cell
                const focus = editor.getFocus();
                const newFocus = focus.end <= targetCellIndex ? focus : { start: focus.start - 1, end: focus.end - 1 };
                const newSelections = selections.map(selection => (selection.end <= targetCellIndex ? selection : { start: selection.start - 1, end: selection.end - 1 }));
                textModel.applyEdits([
                    { editType: 1 /* CellEditType.Replace */, index: targetCellIndex, count: 1, cells: [] }
                ], true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: selections }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: newSelections }), undefined, true);
                notebookService.setToCopy([targetCell.model], false);
                return true;
            }
        }
        const focus = editor.getFocus();
        const containingSelection = selections.find(selection => selection.start <= focus.start && focus.end <= selection.end);
        if (!containingSelection) {
            // focus is out of any selection, we should only cut this cell
            const targetCell = editor.cellAt(focus.start);
            clipboardService.writeText(targetCell.getText());
            const newFocus = focus.end === editor.getLength() ? { start: focus.start - 1, end: focus.end - 1 } : focus;
            const newSelections = selections.map(selection => (selection.end <= focus.start ? selection : { start: selection.start - 1, end: selection.end - 1 }));
            textModel.applyEdits([
                { editType: 1 /* CellEditType.Replace */, index: focus.start, count: 1, cells: [] }
            ], true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: selections }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: newSelections }), undefined, true);
            notebookService.setToCopy([targetCell.model], false);
            return true;
        }
        const selectionRanges = (0, notebookBrowser_1.expandCellRangesWithHiddenCells)(editor, editor.getSelections());
        const selectedCells = (0, notebookBrowser_1.cellRangeToViewCells)(editor, selectionRanges);
        if (!selectedCells.length) {
            return false;
        }
        clipboardService.writeText(selectedCells.map(cell => cell.getText()).join('\n'));
        const edits = selectionRanges.map(range => ({ editType: 1 /* CellEditType.Replace */, index: range.start, count: range.end - range.start, cells: [] }));
        const firstSelectIndex = selectionRanges[0].start;
        /**
         * If we have cells, 0, 1, 2, 3, 4, 5, 6
         * and cells 1, 2 are selected, and then we delete cells 1 and 2
         * the new focused cell should still be at index 1
         */
        const newFocusedCellIndex = firstSelectIndex < textModel.cells.length - 1
            ? firstSelectIndex
            : Math.max(textModel.cells.length - 2, 0);
        textModel.applyEdits(edits, true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: selectionRanges }, () => {
            return {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: { start: newFocusedCellIndex, end: newFocusedCellIndex + 1 },
                selections: [{ start: newFocusedCellIndex, end: newFocusedCellIndex + 1 }]
            };
        }, undefined, true);
        notebookService.setToCopy(selectedCells.map(cell => cell.model), false);
        return true;
    }
    exports.runCutCells = runCutCells;
    let NotebookClipboardContribution = class NotebookClipboardContribution extends lifecycle_1.Disposable {
        constructor(_editorService) {
            super();
            this._editorService = _editorService;
            const PRIORITY = 105;
            if (clipboard_1.CopyAction) {
                this._register(clipboard_1.CopyAction.addImplementation(PRIORITY, 'notebook-clipboard', accessor => {
                    return this.runCopyAction(accessor);
                }));
            }
            if (clipboard_1.PasteAction) {
                clipboard_1.PasteAction.addImplementation(PRIORITY, 'notebook-clipboard', accessor => {
                    return this.runPasteAction(accessor);
                });
            }
            if (clipboard_1.CutAction) {
                clipboard_1.CutAction.addImplementation(PRIORITY, 'notebook-clipboard', accessor => {
                    return this.runCutAction(accessor);
                });
            }
        }
        _getContext() {
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
            const activeCell = editor === null || editor === void 0 ? void 0 : editor.getActiveCell();
            return {
                editor,
                activeCell
            };
        }
        _focusInsideEmebedMonaco(editor) {
            const windowSelection = window.getSelection();
            if ((windowSelection === null || windowSelection === void 0 ? void 0 : windowSelection.rangeCount) !== 1) {
                return false;
            }
            const activeSelection = windowSelection.getRangeAt(0);
            if (activeSelection.startContainer === activeSelection.endContainer && activeSelection.endOffset - activeSelection.startOffset === 0) {
                return false;
            }
            let container = activeSelection.commonAncestorContainer;
            const body = editor.getDomNode();
            if (!body.contains(container)) {
                return false;
            }
            while (container
                &&
                    container !== body) {
                if (container.classList && container.classList.contains('monaco-editor')) {
                    return true;
                }
                container = container.parentNode;
            }
            return false;
        }
        runCopyAction(accessor) {
            const loggerService = accessor.get(log_1.ILogService);
            const activeElement = document.activeElement;
            if (activeElement && ['input', 'textarea'].indexOf(activeElement.tagName.toLowerCase()) >= 0) {
                _log(loggerService, '[NotebookEditor] focus is on input or textarea element, bypass');
                return false;
            }
            const { editor } = this._getContext();
            if (!editor) {
                _log(loggerService, '[NotebookEditor] no active notebook editor, bypass');
                return false;
            }
            if (this._focusInsideEmebedMonaco(editor)) {
                _log(loggerService, '[NotebookEditor] focus is on embed monaco editor, bypass');
                return false;
            }
            _log(loggerService, '[NotebookEditor] run copy actions on notebook model');
            return runCopyCells(accessor, editor, undefined);
        }
        runPasteAction(accessor) {
            const activeElement = document.activeElement;
            if (activeElement && ['input', 'textarea'].indexOf(activeElement.tagName.toLowerCase()) >= 0) {
                return false;
            }
            const notebookService = accessor.get(notebookService_1.INotebookService);
            const pasteCells = notebookService.getToCopy();
            if (!pasteCells) {
                return false;
            }
            const { editor, activeCell } = this._getContext();
            if (!editor) {
                return false;
            }
            return runPasteCells(editor, activeCell, pasteCells);
        }
        runCutAction(accessor) {
            const activeElement = document.activeElement;
            if (activeElement && ['input', 'textarea'].indexOf(activeElement.tagName.toLowerCase()) >= 0) {
                return false;
            }
            const { editor } = this._getContext();
            if (!editor) {
                return false;
            }
            return runCutCells(accessor, editor, undefined);
        }
    };
    NotebookClipboardContribution = __decorate([
        __param(0, editorService_1.IEditorService)
    ], NotebookClipboardContribution);
    exports.NotebookClipboardContribution = NotebookClipboardContribution;
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(NotebookClipboardContribution, 2 /* LifecyclePhase.Ready */);
    const COPY_CELL_COMMAND_ID = 'notebook.cell.copy';
    const CUT_CELL_COMMAND_ID = 'notebook.cell.cut';
    const PASTE_CELL_COMMAND_ID = 'notebook.cell.paste';
    const PASTE_CELL_ABOVE_COMMAND_ID = 'notebook.cell.pasteAbove';
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: COPY_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.copy', "Copy Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED,
                    group: "1_copy" /* CellOverflowToolbarGroups.Copy */,
                },
                keybinding: platform.isNative ? undefined : {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
                    win: { primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */, secondary: [2048 /* KeyMod.CtrlCmd */ | 19 /* KeyCode.Insert */] },
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            runCopyCells(accessor, context.notebookEditor, context.cell);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: CUT_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.cut', "Cut Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE, notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE),
                    group: "1_copy" /* CellOverflowToolbarGroups.Copy */,
                },
                keybinding: platform.isNative ? undefined : {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */,
                    win: { primary: 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */, secondary: [1024 /* KeyMod.Shift */ | 20 /* KeyCode.Delete */] },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            runCutCells(accessor, context.notebookEditor, context.cell);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookAction {
        constructor() {
            super({
                id: PASTE_CELL_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.paste', "Paste Cell"),
                menu: {
                    id: actions_1.MenuId.NotebookCellTitle,
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_EDITOR_EDITABLE),
                    group: "1_copy" /* CellOverflowToolbarGroups.Copy */,
                },
                keybinding: platform.isNative ? undefined : {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */,
                    win: { primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */, secondary: [1024 /* KeyMod.Shift */ | 19 /* KeyCode.Insert */] },
                    linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */, secondary: [1024 /* KeyMod.Shift */ | 19 /* KeyCode.Insert */] },
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async runWithContext(accessor, context) {
            const notebookService = accessor.get(notebookService_1.INotebookService);
            const pasteCells = notebookService.getToCopy();
            if (!context.notebookEditor.hasModel() || context.notebookEditor.isReadOnly) {
                return;
            }
            if (!pasteCells) {
                return;
            }
            runPasteCells(context.notebookEditor, context.cell, pasteCells);
        }
    });
    (0, actions_1.registerAction2)(class extends coreActions_1.NotebookCellAction {
        constructor() {
            super({
                id: PASTE_CELL_ABOVE_COMMAND_ID,
                title: (0, nls_1.localize)('notebookActions.pasteAbove', "Paste Cell Above"),
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 52 /* KeyCode.KeyV */,
                    weight: coreActions_1.NOTEBOOK_EDITOR_WIDGET_ACTION_WEIGHT
                },
            });
        }
        async runWithContext(accessor, context) {
            const notebookService = accessor.get(notebookService_1.INotebookService);
            const pasteCells = notebookService.getToCopy();
            const editor = context.notebookEditor;
            const textModel = editor.textModel;
            if (editor.isReadOnly) {
                return;
            }
            if (!pasteCells) {
                return;
            }
            const originalState = {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: editor.getFocus(),
                selections: editor.getSelections()
            };
            const currCellIndex = context.notebookEditor.getCellIndex(context.cell);
            const newFocusIndex = currCellIndex;
            textModel.applyEdits([
                {
                    editType: 1 /* CellEditType.Replace */,
                    index: currCellIndex,
                    count: 0,
                    cells: pasteCells.items.map(cell => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(cell))
                }
            ], true, originalState, () => ({
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: { start: newFocusIndex, end: newFocusIndex + 1 },
                selections: [{ start: newFocusIndex, end: newFocusIndex + pasteCells.items.length }]
            }), undefined, true);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleNotebookClipboardLog',
                title: { value: (0, nls_1.localize)('toggleNotebookClipboardLog', "Toggle Notebook Clipboard Troubleshooting"), original: 'Toggle Notebook Clipboard Troubleshooting' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        run(accessor) {
            toggleLogging();
            if (_logging) {
                const outputService = accessor.get(output_1.IOutputService);
                outputService.showChannel(logConstants_1.rendererLogChannelId);
            }
        }
    });
});
//# sourceMappingURL=notebookClipboard.js.map