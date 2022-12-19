/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/core/range", "vs/editor/common/model", "vs/editor/common/core/wordHelper", "vs/editor/common/languages/language", "vs/editor/contrib/find/browser/findState", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/contrib/notebook/browser/contrib/find/findModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/test/browser/testNotebookEditor"], function (require, exports, assert, range_1, model_1, wordHelper_1, language_1, findState_1, configuration_1, testConfigurationService_1, findModel_1, notebookCommon_1, testNotebookEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Notebook Find', () => {
        const configurationValue = {
            value: wordHelper_1.USUAL_WORD_SEPARATORS
        };
        const configurationService = new class extends testConfigurationService_1.TestConfigurationService {
            inspect() {
                return configurationValue;
            }
        }();
        const setupEditorForTest = (editor, viewModel) => {
            editor.changeModelDecorations = (callback) => {
                return callback({
                    deltaDecorations: (oldDecorations, newDecorations) => {
                        const ret = [];
                        newDecorations.forEach(dec => {
                            var _a;
                            const cell = viewModel.viewCells.find(cell => cell.handle === dec.ownerId);
                            const decorations = (_a = cell === null || cell === void 0 ? void 0 : cell.deltaModelDecorations([], dec.decorations)) !== null && _a !== void 0 ? _a : [];
                            if (decorations.length > 0) {
                                ret.push({ ownerId: dec.ownerId, decorations: decorations });
                            }
                        });
                        return ret;
                    }
                });
            };
        };
        test('Update find matches basics', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, accessor) => {
                accessor.stub(configuration_1.IConfigurationService, configurationService);
                const state = new findState_1.FindReplaceState();
                const model = new findModel_1.FindModel(editor, state, accessor.get(configuration_1.IConfigurationService));
                const found = new Promise(resolve => state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                }));
                state.change({ isRevealed: true }, true);
                state.change({ searchString: '1' }, true);
                await found;
                assert.strictEqual(model.findMatches.length, 2);
                assert.strictEqual(model.currentMatch, -1);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 1);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 0);
                assert.strictEqual(editor.textModel.length, 3);
                const found2 = new Promise(resolve => state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                }));
                editor.textModel.applyEdits([{
                        editType: 1 /* CellEditType.Replace */, index: 3, count: 0, cells: [
                            new testNotebookEditor_1.TestCell(viewModel.viewType, 3, '# next paragraph 1', 'markdown', notebookCommon_1.CellKind.Code, [], accessor.get(language_1.ILanguageService)),
                        ]
                    }], true, undefined, () => undefined, undefined, true);
                await found2;
                assert.strictEqual(editor.textModel.length, 4);
                assert.strictEqual(model.findMatches.length, 3);
                assert.strictEqual(model.currentMatch, 0);
            });
        });
        test('Update find matches basics 2', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, accessor) => {
                setupEditorForTest(editor, viewModel);
                accessor.stub(configuration_1.IConfigurationService, configurationService);
                const state = new findState_1.FindReplaceState();
                const model = new findModel_1.FindModel(editor, state, accessor.get(configuration_1.IConfigurationService));
                const found = new Promise(resolve => state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                }));
                state.change({ isRevealed: true }, true);
                state.change({ searchString: '1' }, true);
                await found;
                // find matches is not necessarily find results
                assert.strictEqual(model.findMatches.length, 4);
                assert.strictEqual(model.currentMatch, -1);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 1);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 2);
                const found2 = new Promise(resolve => state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                }));
                editor.textModel.applyEdits([{
                        editType: 1 /* CellEditType.Replace */, index: 2, count: 1, cells: []
                    }], true, undefined, () => undefined, undefined, true);
                await found2;
                assert.strictEqual(model.findMatches.length, 3);
                assert.strictEqual(model.currentMatch, 2);
                model.find({ previous: true });
                assert.strictEqual(model.currentMatch, 1);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 2);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 3);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 0);
            });
        });
        test('Update find matches basics 3', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, accessor) => {
                setupEditorForTest(editor, viewModel);
                accessor.stub(configuration_1.IConfigurationService, configurationService);
                const state = new findState_1.FindReplaceState();
                const model = new findModel_1.FindModel(editor, state, accessor.get(configuration_1.IConfigurationService));
                const found = new Promise(resolve => state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                }));
                state.change({ isRevealed: true }, true);
                state.change({ searchString: '1' }, true);
                await found;
                // find matches is not necessarily find results
                assert.strictEqual(model.findMatches.length, 4);
                assert.strictEqual(model.currentMatch, -1);
                model.find({ previous: true });
                assert.strictEqual(model.currentMatch, 4);
                const found2 = new Promise(resolve => state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                }));
                editor.textModel.applyEdits([{
                        editType: 1 /* CellEditType.Replace */, index: 2, count: 1, cells: []
                    }], true, undefined, () => undefined, undefined, true);
                await found2;
                assert.strictEqual(model.findMatches.length, 3);
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: true });
                assert.strictEqual(model.currentMatch, 3);
                model.find({ previous: true });
                assert.strictEqual(model.currentMatch, 2);
            });
        });
        test('Update find matches, #112748', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1.3', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, accessor) => {
                setupEditorForTest(editor, viewModel);
                accessor.stub(configuration_1.IConfigurationService, configurationService);
                const state = new findState_1.FindReplaceState();
                const model = new findModel_1.FindModel(editor, state, accessor.get(configuration_1.IConfigurationService));
                const found = new Promise(resolve => state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                }));
                state.change({ isRevealed: true }, true);
                state.change({ searchString: '1' }, true);
                await found;
                // find matches is not necessarily find results
                assert.strictEqual(model.findMatches.length, 4);
                assert.strictEqual(model.currentMatch, -1);
                model.find({ previous: false });
                model.find({ previous: false });
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 2);
                const found2 = new Promise(resolve => state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                }));
                viewModel.viewCells[1].textBuffer.applyEdits([
                    new model_1.ValidAnnotatedEditOperation(null, new range_1.Range(1, 1, 1, 14), '', false, false, false)
                ], false, true);
                // cell content updates, recompute
                model.research();
                await found2;
                assert.strictEqual(model.currentMatch, 1);
            });
        });
        test('Reset when match not found, #127198', async function () {
            await (0, testNotebookEditor_1.withTestNotebook)([
                ['# header 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 1', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
                ['paragraph 2', 'markdown', notebookCommon_1.CellKind.Markup, [], {}],
            ], async (editor, viewModel, accessor) => {
                accessor.stub(configuration_1.IConfigurationService, configurationService);
                const state = new findState_1.FindReplaceState();
                const model = new findModel_1.FindModel(editor, state, accessor.get(configuration_1.IConfigurationService));
                const found = new Promise(resolve => state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                }));
                state.change({ isRevealed: true }, true);
                state.change({ searchString: '1' }, true);
                await found;
                assert.strictEqual(model.findMatches.length, 2);
                assert.strictEqual(model.currentMatch, -1);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 0);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 1);
                model.find({ previous: false });
                assert.strictEqual(model.currentMatch, 0);
                assert.strictEqual(editor.textModel.length, 3);
                const found2 = new Promise(resolve => state.onFindReplaceStateChange(e => {
                    if (e.matchesCount) {
                        resolve(true);
                    }
                }));
                state.change({ searchString: '3' }, true);
                await found2;
                assert.strictEqual(model.currentMatch, -1);
                assert.strictEqual(model.findMatches.length, 0);
            });
        });
    });
});
//# sourceMappingURL=find.test.js.map