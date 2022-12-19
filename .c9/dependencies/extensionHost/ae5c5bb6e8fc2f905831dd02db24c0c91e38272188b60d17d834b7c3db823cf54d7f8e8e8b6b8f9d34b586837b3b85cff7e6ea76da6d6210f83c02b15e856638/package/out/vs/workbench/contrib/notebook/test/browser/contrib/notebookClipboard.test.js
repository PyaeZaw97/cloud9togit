/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/test/common/mock", "vs/workbench/contrib/notebook/browser/contrib/clipboard/notebookClipboard", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/notebook/browser/viewModel/foldingModel"], function (require, exports, assert, mock_1, notebookClipboard_1, notebookCommon_1, testNotebookEditor_1, notebookService_1, foldingModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Notebook Clipboard', () => {
        const createEditorService = (editor) => {
            const visibleEditorPane = new class extends (0, mock_1.mock)() {
                getId() {
                    return notebookCommon_1.NOTEBOOK_EDITOR_ID;
                }
                getControl() {
                    return editor;
                }
            };
            const editorService = new class extends (0, mock_1.mock)() {
                get activeEditorPane() {
                    return visibleEditorPane;
                }
            };
            return editorService;
        };
        test.skip('Cut multiple selected cells', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, accessor) => {
                var _a;
                accessor.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                    setToCopy() { }
                });
                const clipboardContrib = new notebookClipboard_1.NotebookClipboardContribution(createEditorService(editor));
                viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 0, end: 2 }, selections: [{ start: 0, end: 2 }] }, 'model');
                assert.ok(clipboardContrib.runCutAction(accessor));
                assert.deepStrictEqual(viewModel.getFocus(), { start: 0, end: 1 });
                assert.strictEqual(viewModel.length, 1);
                assert.strictEqual((_a = viewModel.cellAt(0)) === null || _a === void 0 ? void 0 : _a.getText(), 'paragraph 2');
            });
        });
        test.skip('Cut should take folding info into account', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['# header b', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3', 'javascript', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header d', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], async (editor, viewModel, accessor) => {
                const foldingModel = new foldingModel_1.FoldingModel();
                foldingModel.attachViewModel(viewModel);
                (0, foldingModel_1.updateFoldingStateAtIndex)(foldingModel, 0, true);
                (0, foldingModel_1.updateFoldingStateAtIndex)(foldingModel, 2, true);
                viewModel.updateFoldingRanges(foldingModel.regions);
                editor.setHiddenAreas(viewModel.getHiddenRanges());
                viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 0, end: 1 }, selections: [{ start: 0, end: 1 }] }, 'model');
                accessor.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                    setToCopy() { }
                });
                const clipboardContrib = new notebookClipboard_1.NotebookClipboardContribution(createEditorService(editor));
                clipboardContrib.runCutAction(accessor);
                assert.strictEqual(viewModel.length, 5);
                await viewModel.undo();
                assert.strictEqual(viewModel.length, 7);
            });
        });
        test.skip('Copy should take folding info into account', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header a', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var b = 1;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['# header b', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var b = 2;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
                ['var c = 3', 'javascript', notebookCommon_1.CellKind.Markup, [], {}],
                ['# header d', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['var e = 4;', 'javascript', notebookCommon_1.CellKind.Code, [], {}],
            ], async (editor, viewModel, accessor) => {
                var _a;
                const foldingModel = new foldingModel_1.FoldingModel();
                foldingModel.attachViewModel(viewModel);
                (0, foldingModel_1.updateFoldingStateAtIndex)(foldingModel, 0, true);
                (0, foldingModel_1.updateFoldingStateAtIndex)(foldingModel, 2, true);
                viewModel.updateFoldingRanges(foldingModel.regions);
                editor.setHiddenAreas(viewModel.getHiddenRanges());
                viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 0, end: 1 }, selections: [{ start: 0, end: 1 }] }, 'model');
                let _cells = [];
                accessor.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                    setToCopy(cells) { _cells = cells; }
                    getToCopy() { return { items: _cells, isCopy: true }; }
                });
                const clipboardContrib = new notebookClipboard_1.NotebookClipboardContribution(createEditorService(editor));
                clipboardContrib.runCopyAction(accessor);
                viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 6, end: 7 }, selections: [{ start: 6, end: 7 }] }, 'model');
                clipboardContrib.runPasteAction(accessor);
                assert.strictEqual(viewModel.length, 9);
                assert.strictEqual((_a = viewModel.cellAt(8)) === null || _a === void 0 ? void 0 : _a.getText(), 'var b = 1;');
            });
        });
        test.skip('#119773, cut last item should not focus on the top first cell', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, accessor) => {
                accessor.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                    setToCopy() { }
                });
                const clipboardContrib = new notebookClipboard_1.NotebookClipboardContribution(createEditorService(editor));
                viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 2, end: 3 }, selections: [{ start: 2, end: 3 }] }, 'model');
                assert.ok(clipboardContrib.runCutAction(accessor));
                // it should be the last cell, other than the first one.
                assert.deepStrictEqual(viewModel.getFocus(), { start: 1, end: 2 });
            });
        });
        test.skip('#119771, undo paste should restore selections', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, accessor) => {
                var _a;
                accessor.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                    setToCopy() { }
                    getToCopy() {
                        return {
                            items: [
                                viewModel.cellAt(0).model
                            ],
                            isCopy: true
                        };
                    }
                });
                const clipboardContrib = new notebookClipboard_1.NotebookClipboardContribution(createEditorService(editor));
                viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 2, end: 3 }, selections: [{ start: 2, end: 3 }] }, 'model');
                assert.ok(clipboardContrib.runPasteAction(accessor));
                assert.strictEqual(viewModel.length, 4);
                assert.deepStrictEqual(viewModel.getFocus(), { start: 3, end: 4 });
                assert.strictEqual((_a = viewModel.cellAt(3)) === null || _a === void 0 ? void 0 : _a.getText(), '# header 1');
                await viewModel.undo();
                assert.strictEqual(viewModel.length, 3);
                assert.deepStrictEqual(viewModel.getFocus(), { start: 2, end: 3 });
            });
        });
        test('copy cell from ui still works if the target cell is not part of a selection', async () => {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, accessor) => {
                let _toCopy = [];
                accessor.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                    setToCopy(toCopy) { _toCopy = toCopy; }
                    getToCopy() {
                        return {
                            items: _toCopy,
                            isCopy: true
                        };
                    }
                });
                viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 0, end: 1 }, selections: [{ start: 0, end: 2 }] }, 'model');
                assert.ok((0, notebookClipboard_1.runCopyCells)(accessor, editor, viewModel.cellAt(0)));
                assert.deepStrictEqual(_toCopy, [viewModel.cellAt(0).model, viewModel.cellAt(1).model]);
                assert.ok((0, notebookClipboard_1.runCopyCells)(accessor, editor, viewModel.cellAt(2)));
                assert.deepStrictEqual(_toCopy.length, 1);
                assert.deepStrictEqual(_toCopy, [viewModel.cellAt(2).model]);
            });
        });
        test('cut cell from ui still works if the target cell is not part of a selection', async () => {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, accessor) => {
                var _a, _b, _c;
                accessor.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                    setToCopy() { }
                    getToCopy() {
                        return { items: [], isCopy: true };
                    }
                });
                viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 0, end: 1 }, selections: [{ start: 0, end: 2 }] }, 'model');
                assert.ok((0, notebookClipboard_1.runCutCells)(accessor, editor, viewModel.cellAt(0)));
                assert.strictEqual(viewModel.length, 2);
                await viewModel.undo();
                assert.strictEqual(viewModel.length, 4);
                assert.deepStrictEqual(viewModel.getFocus(), { start: 0, end: 1 });
                assert.deepStrictEqual(viewModel.getSelections(), [{ start: 0, end: 2 }]);
                assert.ok((0, notebookClipboard_1.runCutCells)(accessor, editor, viewModel.cellAt(2)));
                assert.strictEqual(viewModel.length, 3);
                assert.deepStrictEqual(viewModel.getFocus(), { start: 0, end: 1 });
                assert.strictEqual((_a = viewModel.cellAt(0)) === null || _a === void 0 ? void 0 : _a.getText(), '# header 1');
                assert.strictEqual((_b = viewModel.cellAt(1)) === null || _b === void 0 ? void 0 : _b.getText(), 'paragraph 1');
                assert.strictEqual((_c = viewModel.cellAt(2)) === null || _c === void 0 ? void 0 : _c.getText(), 'paragraph 3');
                await viewModel.undo();
                assert.strictEqual(viewModel.length, 4);
                viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 2, end: 3 }, selections: [{ start: 2, end: 4 }] }, 'model');
                assert.deepStrictEqual(viewModel.getFocus(), { start: 2, end: 3 });
                assert.ok((0, notebookClipboard_1.runCutCells)(accessor, editor, viewModel.cellAt(0)));
                assert.deepStrictEqual(viewModel.getFocus(), { start: 1, end: 2 });
                assert.deepStrictEqual(viewModel.getSelections(), [{ start: 1, end: 3 }]);
            });
        });
        test('cut focus cell still works if the focus is not part of any selection', async () => {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, accessor) => {
                accessor.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                    setToCopy() { }
                    getToCopy() {
                        return { items: [], isCopy: true };
                    }
                });
                viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 0, end: 1 }, selections: [{ start: 2, end: 4 }] }, 'model');
                assert.ok((0, notebookClipboard_1.runCutCells)(accessor, editor, undefined));
                assert.strictEqual(viewModel.length, 3);
                assert.deepStrictEqual(viewModel.getFocus(), { start: 0, end: 1 });
                assert.deepStrictEqual(viewModel.getSelections(), [{ start: 1, end: 3 }]);
            });
        });
        test('cut focus cell still works if the focus is not part of any selection 2', async () => {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, accessor) => {
                accessor.stub(notebookService_1.INotebookService, new class extends (0, mock_1.mock)() {
                    setToCopy() { }
                    getToCopy() {
                        return { items: [], isCopy: true };
                    }
                });
                viewModel.updateSelectionsState({ kind: notebookCommon_1.SelectionStateType.Index, focus: { start: 3, end: 4 }, selections: [{ start: 0, end: 2 }] }, 'model');
                assert.ok((0, notebookClipboard_1.runCutCells)(accessor, editor, undefined));
                assert.strictEqual(viewModel.length, 3);
                assert.deepStrictEqual(viewModel.getFocus(), { start: 2, end: 3 });
                assert.deepStrictEqual(viewModel.getSelections(), [{ start: 0, end: 2 }]);
            });
        });
    });
});
//# sourceMappingURL=notebookClipboard.test.js.map