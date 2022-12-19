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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/notebookVisibleCellObserver", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/browser/notebookEditorWidget", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, async_1, lifecycle_1, nls_1, instantiation_1, themeService_1, notebookVisibleCellObserver_1, notebookEditorExtensions_1, notebookEditorWidget_1, notebookIcons_1, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TimerCellStatusBarContrib = exports.ExecutionStateCellStatusBarContrib = exports.NotebookStatusBarController = exports.formatCellDuration = void 0;
    function formatCellDuration(duration) {
        const minutes = Math.floor(duration / 1000 / 60);
        const seconds = Math.floor(duration / 1000) % 60;
        const tenths = String(duration - minutes * 60 * 1000 - seconds * 1000).charAt(0);
        if (minutes > 0) {
            return `${minutes}m ${seconds}.${tenths}s`;
        }
        else {
            return `${seconds}.${tenths}s`;
        }
    }
    exports.formatCellDuration = formatCellDuration;
    class NotebookStatusBarController extends lifecycle_1.Disposable {
        constructor(_notebookEditor, _itemFactory) {
            super();
            this._notebookEditor = _notebookEditor;
            this._itemFactory = _itemFactory;
            this._visibleCells = new Map();
            this._observer = this._register(new notebookVisibleCellObserver_1.NotebookVisibleCellObserver(this._notebookEditor));
            this._register(this._observer.onDidChangeVisibleCells(this._updateVisibleCells, this));
            this._updateEverything();
        }
        _updateEverything() {
            this._visibleCells.forEach(lifecycle_1.dispose);
            this._visibleCells.clear();
            this._updateVisibleCells({ added: this._observer.visibleCells, removed: [] });
        }
        _updateVisibleCells(e) {
            var _a;
            const vm = this._notebookEditor._getViewModel();
            if (!vm) {
                return;
            }
            for (const newCell of e.added) {
                this._visibleCells.set(newCell.handle, this._itemFactory(vm, newCell));
            }
            for (const oldCell of e.removed) {
                (_a = this._visibleCells.get(oldCell.handle)) === null || _a === void 0 ? void 0 : _a.dispose();
                this._visibleCells.delete(oldCell.handle);
            }
        }
        dispose() {
            super.dispose();
            this._visibleCells.forEach(lifecycle_1.dispose);
            this._visibleCells.clear();
        }
    }
    exports.NotebookStatusBarController = NotebookStatusBarController;
    let ExecutionStateCellStatusBarContrib = class ExecutionStateCellStatusBarContrib extends lifecycle_1.Disposable {
        constructor(notebookEditor, instantiationService) {
            super();
            this._register(new NotebookStatusBarController(notebookEditor, (vm, cell) => instantiationService.createInstance(ExecutionStateCellStatusBarItem, vm, cell)));
        }
    };
    ExecutionStateCellStatusBarContrib.id = 'workbench.notebook.statusBar.execState';
    ExecutionStateCellStatusBarContrib = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ExecutionStateCellStatusBarContrib);
    exports.ExecutionStateCellStatusBarContrib = ExecutionStateCellStatusBarContrib;
    (0, notebookEditorExtensions_1.registerNotebookContribution)(ExecutionStateCellStatusBarContrib.id, ExecutionStateCellStatusBarContrib);
    /**
     * Shows the cell's execution state in the cell status bar. When the "executing" state is shown, it will be shown for a minimum brief time.
     */
    let ExecutionStateCellStatusBarItem = class ExecutionStateCellStatusBarItem extends lifecycle_1.Disposable {
        constructor(_notebookViewModel, _cell, _executionStateService) {
            super();
            this._notebookViewModel = _notebookViewModel;
            this._cell = _cell;
            this._executionStateService = _executionStateService;
            this._currentItemIds = [];
            this._update();
            this._register(this._executionStateService.onDidChangeCellExecution(e => {
                if (e.affectsCell(this._cell.uri)) {
                    this._update();
                }
            }));
            this._register(this._cell.model.onDidChangeInternalMetadata(() => this._update()));
        }
        async _update() {
            const items = this._getItemsForCell();
            if (Array.isArray(items)) {
                this._currentItemIds = this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items }]);
            }
        }
        /**
         *	Returns undefined if there should be no change, and an empty array if all items should be removed.
         */
        _getItemsForCell() {
            const runState = this._executionStateService.getCellExecution(this._cell.uri);
            if (this._currentExecutingStateTimer && !(runState === null || runState === void 0 ? void 0 : runState.isPaused)) {
                return;
            }
            const item = this._getItemForState(runState, this._cell.internalMetadata);
            // Show the execution spinner for a minimum time
            if ((runState === null || runState === void 0 ? void 0 : runState.state) === notebookCommon_1.NotebookCellExecutionState.Executing) {
                this._currentExecutingStateTimer = this._register((0, async_1.disposableTimeout)(() => {
                    const runState = this._executionStateService.getCellExecution(this._cell.uri);
                    this._currentExecutingStateTimer = undefined;
                    if ((runState === null || runState === void 0 ? void 0 : runState.state) !== notebookCommon_1.NotebookCellExecutionState.Executing) {
                        this._update();
                    }
                }, ExecutionStateCellStatusBarItem.MIN_SPINNER_TIME));
            }
            return item ? [item] : [];
        }
        _getItemForState(runState, internalMetadata) {
            const state = runState === null || runState === void 0 ? void 0 : runState.state;
            const { lastRunSuccess } = internalMetadata;
            if (!state && lastRunSuccess) {
                return {
                    text: `$(${notebookIcons_1.successStateIcon.id})`,
                    color: (0, themeService_1.themeColorFromId)(notebookEditorWidget_1.cellStatusIconSuccess),
                    tooltip: (0, nls_1.localize)('notebook.cell.status.success', "Success"),
                    alignment: 1 /* CellStatusbarAlignment.Left */,
                    priority: Number.MAX_SAFE_INTEGER
                };
            }
            else if (!state && lastRunSuccess === false) {
                return {
                    text: `$(${notebookIcons_1.errorStateIcon.id})`,
                    color: (0, themeService_1.themeColorFromId)(notebookEditorWidget_1.cellStatusIconError),
                    tooltip: (0, nls_1.localize)('notebook.cell.status.failed', "Failed"),
                    alignment: 1 /* CellStatusbarAlignment.Left */,
                    priority: Number.MAX_SAFE_INTEGER
                };
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Pending || state === notebookCommon_1.NotebookCellExecutionState.Unconfirmed) {
                return {
                    text: `$(${notebookIcons_1.pendingStateIcon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.pending', "Pending"),
                    alignment: 1 /* CellStatusbarAlignment.Left */,
                    priority: Number.MAX_SAFE_INTEGER
                };
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                const icon = (runState === null || runState === void 0 ? void 0 : runState.didPause) ?
                    notebookIcons_1.executingStateIcon :
                    themeService_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin');
                return {
                    text: `$(${icon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.executing', "Executing"),
                    alignment: 1 /* CellStatusbarAlignment.Left */,
                    priority: Number.MAX_SAFE_INTEGER
                };
            }
            return;
        }
        dispose() {
            super.dispose();
            this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items: [] }]);
        }
    };
    ExecutionStateCellStatusBarItem.MIN_SPINNER_TIME = 500;
    ExecutionStateCellStatusBarItem = __decorate([
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], ExecutionStateCellStatusBarItem);
    let TimerCellStatusBarContrib = class TimerCellStatusBarContrib extends lifecycle_1.Disposable {
        constructor(notebookEditor, instantiationService) {
            super();
            this._register(new NotebookStatusBarController(notebookEditor, (vm, cell) => instantiationService.createInstance(TimerCellStatusBarItem, vm, cell)));
        }
    };
    TimerCellStatusBarContrib.id = 'workbench.notebook.statusBar.execTimer';
    TimerCellStatusBarContrib = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], TimerCellStatusBarContrib);
    exports.TimerCellStatusBarContrib = TimerCellStatusBarContrib;
    (0, notebookEditorExtensions_1.registerNotebookContribution)(TimerCellStatusBarContrib.id, TimerCellStatusBarContrib);
    let TimerCellStatusBarItem = class TimerCellStatusBarItem extends lifecycle_1.Disposable {
        constructor(_notebookViewModel, _cell, _executionStateService) {
            super();
            this._notebookViewModel = _notebookViewModel;
            this._cell = _cell;
            this._executionStateService = _executionStateService;
            this._currentItemIds = [];
            this._scheduler = this._register(new async_1.RunOnceScheduler(() => this._update(), TimerCellStatusBarItem.UPDATE_INTERVAL));
            this._update();
            this._register(this._cell.model.onDidChangeInternalMetadata(() => this._update()));
        }
        async _update() {
            let item;
            const runState = this._executionStateService.getCellExecution(this._cell.uri);
            const state = runState === null || runState === void 0 ? void 0 : runState.state;
            if (runState === null || runState === void 0 ? void 0 : runState.didPause) {
                item = undefined;
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                const startTime = this._cell.internalMetadata.runStartTime;
                const adjustment = this._cell.internalMetadata.runStartTimeAdjustment;
                if (typeof startTime === 'number') {
                    item = this._getTimeItem(startTime, Date.now(), adjustment);
                    this._scheduler.schedule();
                }
            }
            else if (!state) {
                const startTime = this._cell.internalMetadata.runStartTime;
                const endTime = this._cell.internalMetadata.runEndTime;
                if (typeof startTime === 'number' && typeof endTime === 'number') {
                    item = this._getTimeItem(startTime, endTime);
                }
            }
            const items = item ? [item] : [];
            this._currentItemIds = this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items }]);
        }
        _getTimeItem(startTime, endTime, adjustment = 0) {
            const duration = endTime - startTime + adjustment;
            return {
                text: formatCellDuration(duration),
                alignment: 1 /* CellStatusbarAlignment.Left */,
                priority: Number.MAX_SAFE_INTEGER - 1
            };
        }
        dispose() {
            super.dispose();
            this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items: [] }]);
        }
    };
    TimerCellStatusBarItem.UPDATE_INTERVAL = 100;
    TimerCellStatusBarItem = __decorate([
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], TimerCellStatusBarItem);
});
//# sourceMappingURL=executionStatusBarItemController.js.map