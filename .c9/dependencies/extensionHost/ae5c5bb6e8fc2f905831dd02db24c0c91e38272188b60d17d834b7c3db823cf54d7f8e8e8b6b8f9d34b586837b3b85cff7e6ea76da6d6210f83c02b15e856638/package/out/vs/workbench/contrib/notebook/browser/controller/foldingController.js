/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/viewModel/foldingModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/nls"], function (require, exports, lifecycle_1, notebookContextKeys_1, notebookBrowser_1, foldingModel_1, notebookCommon_1, notebookEditorExtensions_1, actions_1, contextkey_1, contextkeys_1, editorService_1, coreActions_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FoldingController = void 0;
    class FoldingController extends lifecycle_1.Disposable {
        constructor(_notebookEditor) {
            super();
            this._notebookEditor = _notebookEditor;
            this._foldingModel = null;
            this._localStore = this._register(new lifecycle_1.DisposableStore());
            this._register(this._notebookEditor.onMouseUp(e => { this.onMouseUp(e); }));
            this._register(this._notebookEditor.onDidChangeModel(() => {
                this._localStore.clear();
                if (!this._notebookEditor.hasModel()) {
                    return;
                }
                this._localStore.add(this._notebookEditor.onDidChangeCellState(e => {
                    var _a;
                    if (e.source.editStateChanged && e.cell.cellKind === notebookCommon_1.CellKind.Markup) {
                        (_a = this._foldingModel) === null || _a === void 0 ? void 0 : _a.recompute();
                        // this._updateEditorFoldingRanges();
                    }
                }));
                this._foldingModel = new foldingModel_1.FoldingModel();
                this._localStore.add(this._foldingModel);
                this._foldingModel.attachViewModel(this._notebookEditor._getViewModel());
                this._localStore.add(this._foldingModel.onDidFoldingRegionChanged(() => {
                    this._updateEditorFoldingRanges();
                }));
            }));
        }
        saveViewState() {
            var _a;
            return ((_a = this._foldingModel) === null || _a === void 0 ? void 0 : _a.getMemento()) || [];
        }
        restoreViewState(state) {
            var _a;
            (_a = this._foldingModel) === null || _a === void 0 ? void 0 : _a.applyMemento(state || []);
            this._updateEditorFoldingRanges();
        }
        setFoldingStateDown(index, state, levels) {
            const doCollapse = state === 2 /* CellFoldingState.Collapsed */;
            const region = this._foldingModel.getRegionAtLine(index + 1);
            const regions = [];
            if (region) {
                if (region.isCollapsed !== doCollapse) {
                    regions.push(region);
                }
                if (levels > 1) {
                    const regionsInside = this._foldingModel.getRegionsInside(region, (r, level) => r.isCollapsed !== doCollapse && level < levels);
                    regions.push(...regionsInside);
                }
            }
            regions.forEach(r => this._foldingModel.setCollapsed(r.regionIndex, state === 2 /* CellFoldingState.Collapsed */));
            this._updateEditorFoldingRanges();
        }
        setFoldingStateUp(index, state, levels) {
            if (!this._foldingModel) {
                return;
            }
            const regions = this._foldingModel.getAllRegionsAtLine(index + 1, (region, level) => region.isCollapsed !== (state === 2 /* CellFoldingState.Collapsed */) && level <= levels);
            regions.forEach(r => this._foldingModel.setCollapsed(r.regionIndex, state === 2 /* CellFoldingState.Collapsed */));
            this._updateEditorFoldingRanges();
        }
        _updateEditorFoldingRanges() {
            if (!this._foldingModel) {
                return;
            }
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const vm = this._notebookEditor._getViewModel();
            vm.updateFoldingRanges(this._foldingModel.regions);
            const hiddenRanges = vm.getHiddenRanges();
            this._notebookEditor.setHiddenAreas(hiddenRanges);
        }
        onMouseUp(e) {
            if (!e.event.target) {
                return;
            }
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const viewModel = this._notebookEditor._getViewModel();
            const target = e.event.target;
            if (target.classList.contains('codicon-notebook-collapsed') || target.classList.contains('codicon-notebook-expanded')) {
                const parent = target.parentElement;
                if (!parent.classList.contains('notebook-folding-indicator')) {
                    return;
                }
                // folding icon
                const cellViewModel = e.target;
                const modelIndex = viewModel.getCellIndex(cellViewModel);
                const state = viewModel.getFoldingState(modelIndex);
                if (state === 0 /* CellFoldingState.None */) {
                    return;
                }
                this.setFoldingStateUp(modelIndex, state === 2 /* CellFoldingState.Collapsed */ ? 1 /* CellFoldingState.Expanded */ : 2 /* CellFoldingState.Collapsed */, 1);
                this._notebookEditor.focusElement(cellViewModel);
            }
            return;
        }
    }
    exports.FoldingController = FoldingController;
    FoldingController.id = 'workbench.notebook.findController';
    (0, notebookEditorExtensions_1.registerNotebookContribution)(FoldingController.id, FoldingController);
    const NOTEBOOK_FOLD_COMMAND_LABEL = (0, nls_1.localize)('fold.cell', "Fold Cell");
    const NOTEBOOK_UNFOLD_COMMAND_LABEL = (0, nls_1.localize)('unfold.cell', "Unfold Cell");
    const FOLDING_COMMAND_ARGS = {
        args: [{
                isOptional: true,
                name: 'index',
                description: 'The cell index',
                schema: {
                    'type': 'object',
                    'required': ['index', 'direction'],
                    'properties': {
                        'index': {
                            'type': 'number'
                        },
                        'direction': {
                            'type': 'string',
                            'enum': ['up', 'down'],
                            'default': 'down'
                        },
                        'levels': {
                            'type': 'number',
                            'default': 1
                        },
                    }
                }
            }]
    };
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.fold',
                title: { value: (0, nls_1.localize)('fold.cell', "Fold Cell"), original: 'Fold Cell' },
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 87 /* KeyCode.BracketLeft */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 87 /* KeyCode.BracketLeft */,
                        secondary: [15 /* KeyCode.LeftArrow */],
                    },
                    secondary: [15 /* KeyCode.LeftArrow */],
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                description: {
                    description: NOTEBOOK_FOLD_COMMAND_LABEL,
                    args: FOLDING_COMMAND_ARGS.args
                },
                precondition: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR,
                f1: true
            });
        }
        async run(accessor, args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor) {
                return;
            }
            if (!editor.hasModel()) {
                return;
            }
            const levels = args && args.levels || 1;
            const direction = args && args.direction === 'up' ? 'up' : 'down';
            let index = undefined;
            if (args) {
                index = args.index;
            }
            else {
                const activeCell = editor.getActiveCell();
                if (!activeCell) {
                    return;
                }
                index = editor.getCellIndex(activeCell);
            }
            const controller = editor.getContribution(FoldingController.id);
            if (index !== undefined) {
                const targetCell = (index < 0 || index >= editor.getLength()) ? undefined : editor.cellAt(index);
                if ((targetCell === null || targetCell === void 0 ? void 0 : targetCell.cellKind) === notebookCommon_1.CellKind.Code && direction === 'down') {
                    return;
                }
                if (direction === 'up') {
                    controller.setFoldingStateUp(index, 2 /* CellFoldingState.Collapsed */, levels);
                }
                else {
                    controller.setFoldingStateDown(index, 2 /* CellFoldingState.Collapsed */, levels);
                }
                const viewIndex = editor._getViewModel().getNearestVisibleCellIndexUpwards(index);
                editor.focusElement(editor.cellAt(viewIndex));
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.unfold',
                title: { value: NOTEBOOK_UNFOLD_COMMAND_LABEL, original: 'Unfold Cell' },
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, contextkey_1.ContextKeyExpr.not(contextkeys_1.InputFocusedContextKey)),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 89 /* KeyCode.BracketRight */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 89 /* KeyCode.BracketRight */,
                        secondary: [17 /* KeyCode.RightArrow */],
                    },
                    secondary: [17 /* KeyCode.RightArrow */],
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                description: {
                    description: NOTEBOOK_UNFOLD_COMMAND_LABEL,
                    args: FOLDING_COMMAND_ARGS.args
                },
                precondition: notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR,
                f1: true
            });
        }
        async run(accessor, args) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor) {
                return;
            }
            const levels = args && args.levels || 1;
            const direction = args && args.direction === 'up' ? 'up' : 'down';
            let index = undefined;
            if (args) {
                index = args.index;
            }
            else {
                const activeCell = editor.getActiveCell();
                if (!activeCell) {
                    return;
                }
                index = editor.getCellIndex(activeCell);
            }
            const controller = editor.getContribution(FoldingController.id);
            if (index !== undefined) {
                if (direction === 'up') {
                    controller.setFoldingStateUp(index, 1 /* CellFoldingState.Expanded */, levels);
                }
                else {
                    controller.setFoldingStateDown(index, 1 /* CellFoldingState.Expanded */, levels);
                }
            }
        }
    });
});
//# sourceMappingURL=foldingController.js.map