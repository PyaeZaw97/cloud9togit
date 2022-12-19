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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/contrib/cellStatusBar/notebookVisibleCellObserver", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/common/notebookCellStatusBarService"], function (require, exports, async_1, cancellation_1, lifecycle_1, notebookVisibleCellObserver_1, notebookEditorExtensions_1, notebookCellStatusBarService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContributedStatusBarItemController = void 0;
    let ContributedStatusBarItemController = class ContributedStatusBarItemController extends lifecycle_1.Disposable {
        constructor(_notebookEditor, _notebookCellStatusBarService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._notebookCellStatusBarService = _notebookCellStatusBarService;
            this._visibleCells = new Map();
            this._observer = this._register(new notebookVisibleCellObserver_1.NotebookVisibleCellObserver(this._notebookEditor));
            this._register(this._observer.onDidChangeVisibleCells(this._updateVisibleCells, this));
            this._updateEverything();
            this._register(this._notebookCellStatusBarService.onDidChangeProviders(this._updateEverything, this));
            this._register(this._notebookCellStatusBarService.onDidChangeItems(this._updateEverything, this));
        }
        _updateEverything() {
            const newCells = this._observer.visibleCells.filter(cell => !this._visibleCells.has(cell.handle));
            const visibleCellHandles = new Set(this._observer.visibleCells.map(item => item.handle));
            const currentCellHandles = Array.from(this._visibleCells.keys());
            const removedCells = currentCellHandles.filter(handle => !visibleCellHandles.has(handle));
            const itemsToUpdate = currentCellHandles.filter(handle => visibleCellHandles.has(handle));
            this._updateVisibleCells({ added: newCells, removed: removedCells.map(handle => ({ handle })) });
            itemsToUpdate.forEach(handle => { var _a; return (_a = this._visibleCells.get(handle)) === null || _a === void 0 ? void 0 : _a.update(); });
        }
        _updateVisibleCells(e) {
            var _a;
            const vm = this._notebookEditor._getViewModel();
            if (!vm) {
                return;
            }
            for (const newCell of e.added) {
                const helper = new CellStatusBarHelper(vm, newCell, this._notebookCellStatusBarService);
                this._visibleCells.set(newCell.handle, helper);
            }
            for (const oldCell of e.removed) {
                (_a = this._visibleCells.get(oldCell.handle)) === null || _a === void 0 ? void 0 : _a.dispose();
                this._visibleCells.delete(oldCell.handle);
            }
        }
        dispose() {
            super.dispose();
            this._visibleCells.forEach(cell => cell.dispose());
            this._visibleCells.clear();
        }
    };
    ContributedStatusBarItemController.id = 'workbench.notebook.statusBar.contributed';
    ContributedStatusBarItemController = __decorate([
        __param(1, notebookCellStatusBarService_1.INotebookCellStatusBarService)
    ], ContributedStatusBarItemController);
    exports.ContributedStatusBarItemController = ContributedStatusBarItemController;
    class CellStatusBarHelper extends lifecycle_1.Disposable {
        constructor(_notebookViewModel, _cell, _notebookCellStatusBarService) {
            super();
            this._notebookViewModel = _notebookViewModel;
            this._cell = _cell;
            this._notebookCellStatusBarService = _notebookCellStatusBarService;
            this._currentItemIds = [];
            this._currentItemLists = [];
            this._updateThrottler = new async_1.Throttler();
            this._register((0, lifecycle_1.toDisposable)(() => { var _a; return (_a = this._activeToken) === null || _a === void 0 ? void 0 : _a.dispose(true); }));
            this._updateSoon();
            this._register(this._cell.model.onDidChangeContent(() => this._updateSoon()));
            this._register(this._cell.model.onDidChangeLanguage(() => this._updateSoon()));
            this._register(this._cell.model.onDidChangeMetadata(() => this._updateSoon()));
            this._register(this._cell.model.onDidChangeInternalMetadata(() => this._updateSoon()));
            this._register(this._cell.model.onDidChangeOutputs(() => this._updateSoon()));
        }
        update() {
            this._updateSoon();
        }
        _updateSoon() {
            // Wait a tick to make sure that the event is fired to the EH before triggering status bar providers
            this._register((0, async_1.disposableTimeout)(() => {
                this._updateThrottler.queue(() => this._update());
            }, 0));
        }
        async _update() {
            var _a;
            const cellIndex = this._notebookViewModel.getCellIndex(this._cell);
            const docUri = this._notebookViewModel.notebookDocument.uri;
            const viewType = this._notebookViewModel.notebookDocument.viewType;
            (_a = this._activeToken) === null || _a === void 0 ? void 0 : _a.dispose(true);
            const tokenSource = this._activeToken = new cancellation_1.CancellationTokenSource();
            const itemLists = await this._notebookCellStatusBarService.getStatusBarItemsForCell(docUri, cellIndex, viewType, tokenSource.token);
            if (tokenSource.token.isCancellationRequested) {
                itemLists.forEach(itemList => itemList.dispose && itemList.dispose());
                return;
            }
            const items = itemLists.map(itemList => itemList.items).flat();
            const newIds = this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items }]);
            this._currentItemLists.forEach(itemList => itemList.dispose && itemList.dispose());
            this._currentItemLists = itemLists;
            this._currentItemIds = newIds;
        }
        dispose() {
            var _a;
            super.dispose();
            (_a = this._activeToken) === null || _a === void 0 ? void 0 : _a.dispose(true);
            this._notebookViewModel.deltaCellStatusBarItems(this._currentItemIds, [{ handle: this._cell.handle, items: [] }]);
            this._currentItemLists.forEach(itemList => itemList.dispose && itemList.dispose());
        }
    }
    (0, notebookEditorExtensions_1.registerNotebookContribution)(ContributedStatusBarItemController.id, ContributedStatusBarItemController);
});
//# sourceMappingURL=contributedStatusBarItemController.js.map