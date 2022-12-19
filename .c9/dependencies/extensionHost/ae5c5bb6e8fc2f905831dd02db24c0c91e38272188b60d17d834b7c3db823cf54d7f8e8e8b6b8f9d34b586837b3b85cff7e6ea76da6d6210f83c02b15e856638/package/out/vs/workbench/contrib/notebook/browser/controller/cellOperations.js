/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/services/bulkEditService", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages/modesRegistry", "vs/workbench/contrib/bulkEdit/browser/bulkCellEdits", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/model/notebookCellTextModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookRange"], function (require, exports, bulkEditService_1, position_1, range_1, modesRegistry_1, bulkCellEdits_1, notebookBrowser_1, notebookCellTextModel_1, notebookCommon_1, notebookRange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.insertCellAtIndex = exports.insertCell = exports.computeCellLinesContents = exports.joinCellsWithSurrounds = exports.joinNotebookCells = exports.copyCellRange = exports.moveCellRange = exports.runDeleteAction = exports.changeCellToKind = void 0;
    async function changeCellToKind(kind, context, language, mime) {
        var _a, _b, _c;
        const { notebookEditor } = context;
        if (!notebookEditor.hasModel()) {
            return;
        }
        if (notebookEditor.isReadOnly) {
            return;
        }
        if (context.ui && context.cell) {
            // action from UI
            const { cell } = context;
            if (cell.cellKind === kind) {
                return;
            }
            const text = cell.getText();
            const idx = notebookEditor.getCellIndex(cell);
            if (language === undefined) {
                const availableLanguages = (_b = (_a = notebookEditor.activeKernel) === null || _a === void 0 ? void 0 : _a.supportedLanguages) !== null && _b !== void 0 ? _b : [];
                language = (_c = availableLanguages[0]) !== null && _c !== void 0 ? _c : modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
            }
            notebookEditor.textModel.applyEdits([
                {
                    editType: 1 /* CellEditType.Replace */,
                    index: idx,
                    count: 1,
                    cells: [{
                            cellKind: kind,
                            source: text,
                            language: language,
                            mime: mime !== null && mime !== void 0 ? mime : cell.mime,
                            outputs: cell.model.outputs,
                            metadata: cell.metadata,
                        }]
                }
            ], true, {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: notebookEditor.getFocus(),
                selections: notebookEditor.getSelections()
            }, () => {
                return {
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: notebookEditor.getFocus(),
                    selections: notebookEditor.getSelections()
                };
            }, undefined, true);
            const newCell = notebookEditor.cellAt(idx);
            notebookEditor.focusNotebookCell(newCell, cell.getEditState() === notebookBrowser_1.CellEditState.Editing ? 'editor' : 'container');
        }
        else if (context.selectedCells) {
            const selectedCells = context.selectedCells;
            const rawEdits = [];
            selectedCells.forEach(cell => {
                var _a, _b, _c;
                if (cell.cellKind === kind) {
                    return;
                }
                const text = cell.getText();
                const idx = notebookEditor.getCellIndex(cell);
                if (language === undefined) {
                    const availableLanguages = (_b = (_a = notebookEditor.activeKernel) === null || _a === void 0 ? void 0 : _a.supportedLanguages) !== null && _b !== void 0 ? _b : [];
                    language = (_c = availableLanguages[0]) !== null && _c !== void 0 ? _c : modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
                }
                rawEdits.push({
                    editType: 1 /* CellEditType.Replace */,
                    index: idx,
                    count: 1,
                    cells: [{
                            cellKind: kind,
                            source: text,
                            language: language,
                            mime: mime !== null && mime !== void 0 ? mime : cell.mime,
                            outputs: cell.model.outputs,
                            metadata: cell.metadata,
                        }]
                });
            });
            notebookEditor.textModel.applyEdits(rawEdits, true, {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: notebookEditor.getFocus(),
                selections: notebookEditor.getSelections()
            }, () => {
                return {
                    kind: notebookCommon_1.SelectionStateType.Index,
                    focus: notebookEditor.getFocus(),
                    selections: notebookEditor.getSelections()
                };
            }, undefined, true);
        }
    }
    exports.changeCellToKind = changeCellToKind;
    function runDeleteAction(editor, cell) {
        const textModel = editor.textModel;
        const selections = editor.getSelections();
        const targetCellIndex = editor.getCellIndex(cell);
        const containingSelection = selections.find(selection => selection.start <= targetCellIndex && targetCellIndex < selection.end);
        if (containingSelection) {
            const edits = selections.reverse().map(selection => ({
                editType: 1 /* CellEditType.Replace */, index: selection.start, count: selection.end - selection.start, cells: []
            }));
            const nextCellAfterContainingSelection = containingSelection.end >= editor.getLength() ? undefined : editor.cellAt(containingSelection.end);
            textModel.applyEdits(edits, true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: editor.getSelections() }, () => {
                if (nextCellAfterContainingSelection) {
                    const cellIndex = textModel.cells.findIndex(cell => cell.handle === nextCellAfterContainingSelection.handle);
                    return { kind: notebookCommon_1.SelectionStateType.Index, focus: { start: cellIndex, end: cellIndex + 1 }, selections: [{ start: cellIndex, end: cellIndex + 1 }] };
                }
                else {
                    if (textModel.length) {
                        const lastCellIndex = textModel.length - 1;
                        return { kind: notebookCommon_1.SelectionStateType.Index, focus: { start: lastCellIndex, end: lastCellIndex + 1 }, selections: [{ start: lastCellIndex, end: lastCellIndex + 1 }] };
                    }
                    else {
                        return { kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 0, end: 0 }, selections: [{ start: 0, end: 0 }] };
                    }
                }
            }, undefined, true);
        }
        else {
            const focus = editor.getFocus();
            const edits = [{
                    editType: 1 /* CellEditType.Replace */, index: targetCellIndex, count: 1, cells: []
                }];
            const finalSelections = [];
            for (let i = 0; i < selections.length; i++) {
                const selection = selections[i];
                if (selection.end <= targetCellIndex) {
                    finalSelections.push(selection);
                }
                else if (selection.start > targetCellIndex) {
                    finalSelections.push({ start: selection.start - 1, end: selection.end - 1 });
                }
                else {
                    finalSelections.push({ start: targetCellIndex, end: targetCellIndex + 1 });
                }
            }
            if (editor.cellAt(focus.start) === cell) {
                // focus is the target, focus is also not part of any selection
                const newFocus = focus.end === textModel.length ? { start: focus.start - 1, end: focus.end - 1 } : focus;
                textModel.applyEdits(edits, true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: editor.getSelections() }, () => ({
                    kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: finalSelections
                }), undefined, true);
            }
            else {
                // users decide to delete a cell out of current focus/selection
                const newFocus = focus.start > targetCellIndex ? { start: focus.start - 1, end: focus.end - 1 } : focus;
                textModel.applyEdits(edits, true, { kind: notebookCommon_1.SelectionStateType.Index, focus: editor.getFocus(), selections: editor.getSelections() }, () => ({
                    kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: finalSelections
                }), undefined, true);
            }
        }
    }
    exports.runDeleteAction = runDeleteAction;
    async function moveCellRange(context, direction) {
        var _a, _b;
        if (!context.notebookEditor.hasModel()) {
            return;
        }
        const editor = context.notebookEditor;
        const textModel = editor.textModel;
        if (editor.isReadOnly) {
            return;
        }
        const selections = editor.getSelections();
        const modelRanges = (0, notebookBrowser_1.expandCellRangesWithHiddenCells)(editor, selections);
        const range = modelRanges[0];
        if (!range || range.start === range.end) {
            return;
        }
        if (direction === 'up') {
            if (range.start === 0) {
                return;
            }
            const indexAbove = range.start - 1;
            const finalSelection = { start: range.start - 1, end: range.end - 1 };
            const focus = context.notebookEditor.getFocus();
            const newFocus = (0, notebookRange_1.cellRangeContains)(range, focus) ? { start: focus.start - 1, end: focus.end - 1 } : { start: range.start - 1, end: range.start };
            textModel.applyEdits([
                {
                    editType: 6 /* CellEditType.Move */,
                    index: indexAbove,
                    length: 1,
                    newIdx: range.end - 1
                }
            ], true, {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: editor.getFocus(),
                selections: editor.getSelections()
            }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: [finalSelection] }), undefined, true);
            const focusRange = (_a = editor.getSelections()[0]) !== null && _a !== void 0 ? _a : editor.getFocus();
            editor.revealCellRangeInView(focusRange);
        }
        else {
            if (range.end >= textModel.length) {
                return;
            }
            const indexBelow = range.end;
            const finalSelection = { start: range.start + 1, end: range.end + 1 };
            const focus = editor.getFocus();
            const newFocus = (0, notebookRange_1.cellRangeContains)(range, focus) ? { start: focus.start + 1, end: focus.end + 1 } : { start: range.start + 1, end: range.start + 2 };
            textModel.applyEdits([
                {
                    editType: 6 /* CellEditType.Move */,
                    index: indexBelow,
                    length: 1,
                    newIdx: range.start
                }
            ], true, {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: editor.getFocus(),
                selections: editor.getSelections()
            }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: [finalSelection] }), undefined, true);
            const focusRange = (_b = editor.getSelections()[0]) !== null && _b !== void 0 ? _b : editor.getFocus();
            editor.revealCellRangeInView(focusRange);
        }
    }
    exports.moveCellRange = moveCellRange;
    async function copyCellRange(context, direction) {
        var _a;
        const editor = context.notebookEditor;
        if (!editor.hasModel()) {
            return;
        }
        const textModel = editor.textModel;
        if (editor.isReadOnly) {
            return;
        }
        let range = undefined;
        if (context.ui) {
            const targetCell = context.cell;
            const targetCellIndex = editor.getCellIndex(targetCell);
            range = { start: targetCellIndex, end: targetCellIndex + 1 };
        }
        else {
            const selections = editor.getSelections();
            const modelRanges = (0, notebookBrowser_1.expandCellRangesWithHiddenCells)(editor, selections);
            range = modelRanges[0];
        }
        if (!range || range.start === range.end) {
            return;
        }
        if (direction === 'up') {
            // insert up, without changing focus and selections
            const focus = editor.getFocus();
            const selections = editor.getSelections();
            textModel.applyEdits([
                {
                    editType: 1 /* CellEditType.Replace */,
                    index: range.end,
                    count: 0,
                    cells: (0, notebookRange_1.cellRangesToIndexes)([range]).map(index => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(editor.cellAt(index).model))
                }
            ], true, {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: focus,
                selections: selections
            }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: focus, selections: selections }), undefined, true);
        }
        else {
            // insert down, move selections
            const focus = editor.getFocus();
            const selections = editor.getSelections();
            const newCells = (0, notebookRange_1.cellRangesToIndexes)([range]).map(index => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(editor.cellAt(index).model));
            const countDelta = newCells.length;
            const newFocus = context.ui ? focus : { start: focus.start + countDelta, end: focus.end + countDelta };
            const newSelections = context.ui ? selections : [{ start: range.start + countDelta, end: range.end + countDelta }];
            textModel.applyEdits([
                {
                    editType: 1 /* CellEditType.Replace */,
                    index: range.end,
                    count: 0,
                    cells: (0, notebookRange_1.cellRangesToIndexes)([range]).map(index => (0, notebookCellTextModel_1.cloneNotebookCellTextModel)(editor.cellAt(index).model))
                }
            ], true, {
                kind: notebookCommon_1.SelectionStateType.Index,
                focus: focus,
                selections: selections
            }, () => ({ kind: notebookCommon_1.SelectionStateType.Index, focus: newFocus, selections: newSelections }), undefined, true);
            const focusRange = (_a = editor.getSelections()[0]) !== null && _a !== void 0 ? _a : editor.getFocus();
            editor.revealCellRangeInView(focusRange);
        }
    }
    exports.copyCellRange = copyCellRange;
    async function joinNotebookCells(editor, range, direction, constraint) {
        if (editor.isReadOnly) {
            return null;
        }
        const textModel = editor.textModel;
        const cells = editor.getCellsInRange(range);
        if (!cells.length) {
            return null;
        }
        if (range.start === 0 && direction === 'above') {
            return null;
        }
        if (range.end === textModel.length && direction === 'below') {
            return null;
        }
        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            if (constraint && cell.cellKind !== constraint) {
                return null;
            }
        }
        if (direction === 'above') {
            const above = editor.cellAt(range.start - 1);
            if (constraint && above.cellKind !== constraint) {
                return null;
            }
            const insertContent = cells.map(cell => { var _a; return ((_a = cell.textBuffer.getEOL()) !== null && _a !== void 0 ? _a : '') + cell.getText(); }).join('');
            const aboveCellLineCount = above.textBuffer.getLineCount();
            const aboveCellLastLineEndColumn = above.textBuffer.getLineLength(aboveCellLineCount);
            return {
                edits: [
                    new bulkEditService_1.ResourceTextEdit(above.uri, { range: new range_1.Range(aboveCellLineCount, aboveCellLastLineEndColumn + 1, aboveCellLineCount, aboveCellLastLineEndColumn + 1), text: insertContent }),
                    new bulkCellEdits_1.ResourceNotebookCellEdit(textModel.uri, {
                        editType: 1 /* CellEditType.Replace */,
                        index: range.start,
                        count: range.end - range.start,
                        cells: []
                    })
                ],
                cell: above,
                endFocus: { start: range.start - 1, end: range.start },
                endSelections: [{ start: range.start - 1, end: range.start }]
            };
        }
        else {
            const below = editor.cellAt(range.end);
            if (constraint && below.cellKind !== constraint) {
                return null;
            }
            const cell = cells[0];
            const restCells = [...cells.slice(1), below];
            const insertContent = restCells.map(cl => { var _a; return ((_a = cl.textBuffer.getEOL()) !== null && _a !== void 0 ? _a : '') + cl.getText(); }).join('');
            const cellLineCount = cell.textBuffer.getLineCount();
            const cellLastLineEndColumn = cell.textBuffer.getLineLength(cellLineCount);
            return {
                edits: [
                    new bulkEditService_1.ResourceTextEdit(cell.uri, { range: new range_1.Range(cellLineCount, cellLastLineEndColumn + 1, cellLineCount, cellLastLineEndColumn + 1), text: insertContent }),
                    new bulkCellEdits_1.ResourceNotebookCellEdit(textModel.uri, {
                        editType: 1 /* CellEditType.Replace */,
                        index: range.start + 1,
                        count: range.end - range.start,
                        cells: []
                    })
                ],
                cell,
                endFocus: { start: range.start, end: range.start + 1 },
                endSelections: [{ start: range.start, end: range.start + 1 }]
            };
        }
    }
    exports.joinNotebookCells = joinNotebookCells;
    async function joinCellsWithSurrounds(bulkEditService, context, direction) {
        var _a;
        const editor = context.notebookEditor;
        const textModel = editor.textModel;
        const viewModel = editor._getViewModel();
        let ret = null;
        if (context.ui) {
            const focusMode = context.cell.focusMode;
            const cellIndex = editor.getCellIndex(context.cell);
            ret = await joinNotebookCells(editor, { start: cellIndex, end: cellIndex + 1 }, direction);
            if (!ret) {
                return;
            }
            await bulkEditService.apply(ret === null || ret === void 0 ? void 0 : ret.edits, { quotableLabel: 'Join Notebook Cells' });
            viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Index, focus: ret.endFocus, selections: ret.endSelections });
            ret.cell.updateEditState(notebookBrowser_1.CellEditState.Editing, 'joinCellsWithSurrounds');
            editor.revealCellRangeInView(editor.getFocus());
            if (focusMode === notebookBrowser_1.CellFocusMode.Editor) {
                ret.cell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            }
        }
        else {
            const selections = editor.getSelections();
            if (!selections.length) {
                return;
            }
            const focus = editor.getFocus();
            const focusMode = (_a = editor.cellAt(focus.start)) === null || _a === void 0 ? void 0 : _a.focusMode;
            const edits = [];
            let cell = null;
            const cells = [];
            for (let i = selections.length - 1; i >= 0; i--) {
                const selection = selections[i];
                const containFocus = (0, notebookRange_1.cellRangeContains)(selection, focus);
                if (selection.end >= textModel.length && direction === 'below'
                    || selection.start === 0 && direction === 'above') {
                    if (containFocus) {
                        cell = editor.cellAt(focus.start);
                    }
                    cells.push(...editor.getCellsInRange(selection));
                    continue;
                }
                const singleRet = await joinNotebookCells(editor, selection, direction);
                if (!singleRet) {
                    return;
                }
                edits.push(...singleRet.edits);
                cells.push(singleRet.cell);
                if (containFocus) {
                    cell = singleRet.cell;
                }
            }
            if (!edits.length) {
                return;
            }
            if (!cell || !cells.length) {
                return;
            }
            await bulkEditService.apply(edits, { quotableLabel: 'Join Notebook Cells' });
            cells.forEach(cell => {
                cell.updateEditState(notebookBrowser_1.CellEditState.Editing, 'joinCellsWithSurrounds');
            });
            viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Handle, primary: cell.handle, selections: cells.map(cell => cell.handle) });
            editor.revealCellRangeInView(editor.getFocus());
            const newFocusedCell = editor.cellAt(editor.getFocus().start);
            if (focusMode === notebookBrowser_1.CellFocusMode.Editor && newFocusedCell) {
                newFocusedCell.focusMode = notebookBrowser_1.CellFocusMode.Editor;
            }
        }
    }
    exports.joinCellsWithSurrounds = joinCellsWithSurrounds;
    function _splitPointsToBoundaries(splitPoints, textBuffer) {
        const boundaries = [];
        const lineCnt = textBuffer.getLineCount();
        const getLineLen = (lineNumber) => {
            return textBuffer.getLineLength(lineNumber);
        };
        // split points need to be sorted
        splitPoints = splitPoints.sort((l, r) => {
            const lineDiff = l.lineNumber - r.lineNumber;
            const columnDiff = l.column - r.column;
            return lineDiff !== 0 ? lineDiff : columnDiff;
        });
        for (let sp of splitPoints) {
            if (getLineLen(sp.lineNumber) + 1 === sp.column && sp.column !== 1 /** empty line */ && sp.lineNumber < lineCnt) {
                sp = new position_1.Position(sp.lineNumber + 1, 1);
            }
            _pushIfAbsent(boundaries, sp);
        }
        if (boundaries.length === 0) {
            return null;
        }
        // boundaries already sorted and not empty
        const modelStart = new position_1.Position(1, 1);
        const modelEnd = new position_1.Position(lineCnt, getLineLen(lineCnt) + 1);
        return [modelStart, ...boundaries, modelEnd];
    }
    function _pushIfAbsent(positions, p) {
        const last = positions.length > 0 ? positions[positions.length - 1] : undefined;
        if (!last || last.lineNumber !== p.lineNumber || last.column !== p.column) {
            positions.push(p);
        }
    }
    function computeCellLinesContents(cell, splitPoints) {
        const rangeBoundaries = _splitPointsToBoundaries(splitPoints, cell.textBuffer);
        if (!rangeBoundaries) {
            return null;
        }
        const newLineModels = [];
        for (let i = 1; i < rangeBoundaries.length; i++) {
            const start = rangeBoundaries[i - 1];
            const end = rangeBoundaries[i];
            newLineModels.push(cell.textBuffer.getValueInRange(new range_1.Range(start.lineNumber, start.column, end.lineNumber, end.column), 0 /* EndOfLinePreference.TextDefined */));
        }
        return newLineModels;
    }
    exports.computeCellLinesContents = computeCellLinesContents;
    function insertCell(languageService, editor, index, type, direction = 'above', initialText = '', ui = false) {
        var _a, _b;
        const viewModel = editor._getViewModel();
        const activeKernel = editor.activeKernel;
        if (viewModel.options.isReadOnly) {
            return null;
        }
        const cell = editor.cellAt(index);
        const nextIndex = ui ? viewModel.getNextVisibleCellIndex(index) : index + 1;
        let language;
        if (type === notebookCommon_1.CellKind.Code) {
            const supportedLanguages = (_a = activeKernel === null || activeKernel === void 0 ? void 0 : activeKernel.supportedLanguages) !== null && _a !== void 0 ? _a : languageService.getRegisteredLanguageIds();
            const defaultLanguage = supportedLanguages[0] || modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
            if ((cell === null || cell === void 0 ? void 0 : cell.cellKind) === notebookCommon_1.CellKind.Code) {
                language = cell.language;
            }
            else if ((cell === null || cell === void 0 ? void 0 : cell.cellKind) === notebookCommon_1.CellKind.Markup) {
                const nearestCodeCellIndex = viewModel.nearestCodeCellIndex(index);
                if (nearestCodeCellIndex > -1) {
                    language = viewModel.cellAt(nearestCodeCellIndex).language;
                }
                else {
                    language = defaultLanguage;
                }
            }
            else {
                if (cell === undefined && direction === 'above') {
                    // insert cell at the very top
                    language = ((_b = viewModel.viewCells.find(cell => cell.cellKind === notebookCommon_1.CellKind.Code)) === null || _b === void 0 ? void 0 : _b.language) || defaultLanguage;
                }
                else {
                    language = defaultLanguage;
                }
            }
            if (!supportedLanguages.includes(language)) {
                // the language no longer exists
                language = defaultLanguage;
            }
        }
        else {
            language = 'markdown';
        }
        const insertIndex = cell ?
            (direction === 'above' ? index : nextIndex) :
            index;
        return insertCellAtIndex(viewModel, insertIndex, initialText, language, type, undefined, [], true, true);
    }
    exports.insertCell = insertCell;
    function insertCellAtIndex(viewModel, index, source, language, type, metadata, outputs, synchronous, pushUndoStop) {
        const endSelections = { kind: notebookCommon_1.SelectionStateType.Index, focus: { start: index, end: index + 1 }, selections: [{ start: index, end: index + 1 }] };
        viewModel.notebookDocument.applyEdits([
            {
                editType: 1 /* CellEditType.Replace */,
                index,
                count: 0,
                cells: [
                    {
                        cellKind: type,
                        language: language,
                        mime: undefined,
                        outputs: outputs,
                        metadata: metadata,
                        source: source
                    }
                ]
            }
        ], synchronous, { kind: notebookCommon_1.SelectionStateType.Index, focus: viewModel.getFocus(), selections: viewModel.getSelections() }, () => endSelections, undefined, pushUndoStop);
        return viewModel.cellAt(index);
    }
    exports.insertCellAtIndex = insertCellAtIndex;
});
//# sourceMappingURL=cellOperations.js.map