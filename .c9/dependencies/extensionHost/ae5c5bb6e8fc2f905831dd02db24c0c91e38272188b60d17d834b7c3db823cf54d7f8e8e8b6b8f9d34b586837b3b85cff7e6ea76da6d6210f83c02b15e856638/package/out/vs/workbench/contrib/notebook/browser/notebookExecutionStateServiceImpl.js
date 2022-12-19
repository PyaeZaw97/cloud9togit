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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, event_1, lifecycle_1, map_1, resources_1, instantiation_1, log_1, notebookCommon_1, notebookExecutionService_1, notebookExecutionStateService_1, notebookKernelService_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookExecutionStateService = void 0;
    let NotebookExecutionStateService = class NotebookExecutionStateService extends lifecycle_1.Disposable {
        constructor(_notebookKernelService, _instantiationService, _logService, _notebookService) {
            super();
            this._notebookKernelService = _notebookKernelService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._notebookService = _notebookService;
            this._executions = new map_1.ResourceMap();
            this._notebookListeners = new map_1.ResourceMap();
            this._cellListeners = new map_1.ResourceMap();
            this._onDidChangeCellExecution = this._register(new event_1.Emitter());
            this.onDidChangeCellExecution = this._onDidChangeCellExecution.event;
        }
        forceCancelNotebookExecutions(notebookUri) {
            const notebookExecutions = this._executions.get(notebookUri);
            if (!notebookExecutions) {
                return;
            }
            for (const exe of notebookExecutions.values()) {
                this._onCellExecutionDidComplete(notebookUri, exe.cellHandle, exe);
            }
        }
        getCellExecution(cellUri) {
            const parsed = notebookCommon_1.CellUri.parse(cellUri);
            if (!parsed) {
                throw new Error(`Not a cell URI: ${cellUri}`);
            }
            const exeMap = this._executions.get(parsed.notebook);
            if (exeMap) {
                return exeMap.get(parsed.handle);
            }
            return undefined;
        }
        getCellExecutionStatesForNotebook(notebook) {
            const exeMap = this._executions.get(notebook);
            return exeMap ? Array.from(exeMap.values()) : [];
        }
        _onCellExecutionDidChange(notebookUri, cellHandle, exe) {
            this._onDidChangeCellExecution.fire(new NotebookExecutionEvent(notebookUri, cellHandle, exe));
        }
        _onCellExecutionDidComplete(notebookUri, cellHandle, exe) {
            var _a, _b;
            const notebookExecutions = this._executions.get(notebookUri);
            if (!notebookExecutions) {
                this._logService.debug(`NotebookExecutionStateService#_onCellExecutionDidComplete - unknown notebook ${notebookUri.toString()}`);
                return;
            }
            exe.dispose();
            const cellUri = notebookCommon_1.CellUri.generate(notebookUri, cellHandle);
            (_a = this._cellListeners.get(cellUri)) === null || _a === void 0 ? void 0 : _a.dispose();
            this._cellListeners.delete(cellUri);
            notebookExecutions.delete(cellHandle);
            if (notebookExecutions.size === 0) {
                this._executions.delete(notebookUri);
                (_b = this._notebookListeners.get(notebookUri)) === null || _b === void 0 ? void 0 : _b.dispose();
                this._notebookListeners.delete(notebookUri);
            }
            this._onDidChangeCellExecution.fire(new NotebookExecutionEvent(notebookUri, cellHandle));
        }
        createCellExecution(controllerId, notebookUri, cellHandle) {
            var _a;
            const notebook = this._notebookService.getNotebookTextModel(notebookUri);
            if (!notebook) {
                throw new Error(`Notebook not found: ${notebookUri.toString()}`);
            }
            const kernel = this._notebookKernelService.getMatchingKernel(notebook);
            if (!kernel.selected || kernel.selected.id !== controllerId) {
                throw new Error(`Kernel is not selected: ${(_a = kernel.selected) === null || _a === void 0 ? void 0 : _a.id} !== ${controllerId}`);
            }
            let notebookExecutionMap = this._executions.get(notebookUri);
            if (!notebookExecutionMap) {
                const listeners = this._instantiationService.createInstance(NotebookExecutionListeners, notebookUri);
                this._notebookListeners.set(notebookUri, listeners);
                notebookExecutionMap = new Map();
                this._executions.set(notebookUri, notebookExecutionMap);
            }
            let exe = notebookExecutionMap.get(cellHandle);
            if (!exe) {
                exe = this._createNotebookCellExecution(notebook, cellHandle);
                notebookExecutionMap.set(cellHandle, exe);
                this._onDidChangeCellExecution.fire(new NotebookExecutionEvent(notebookUri, cellHandle, exe));
            }
            return exe;
        }
        _createNotebookCellExecution(notebook, cellHandle) {
            const notebookUri = notebook.uri;
            const exe = this._instantiationService.createInstance(CellExecution, cellHandle, notebook);
            const disposable = (0, lifecycle_1.combinedDisposable)(exe.onDidUpdate(() => this._onCellExecutionDidChange(notebookUri, cellHandle, exe)), exe.onDidComplete(() => this._onCellExecutionDidComplete(notebookUri, cellHandle, exe)));
            this._cellListeners.set(notebookCommon_1.CellUri.generate(notebookUri, cellHandle), disposable);
            return exe;
        }
        dispose() {
            super.dispose();
            this._executions.forEach(executionMap => {
                executionMap.forEach(execution => execution.dispose());
                executionMap.clear();
            });
            this._executions.clear();
            this._cellListeners.forEach(disposable => disposable.dispose());
            this._notebookListeners.forEach(disposable => disposable.dispose());
        }
    };
    NotebookExecutionStateService = __decorate([
        __param(0, notebookKernelService_1.INotebookKernelService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, log_1.ILogService),
        __param(3, notebookService_1.INotebookService)
    ], NotebookExecutionStateService);
    exports.NotebookExecutionStateService = NotebookExecutionStateService;
    class NotebookExecutionEvent {
        constructor(notebook, cellHandle, changed) {
            this.notebook = notebook;
            this.cellHandle = cellHandle;
            this.changed = changed;
        }
        affectsCell(cell) {
            const parsedUri = notebookCommon_1.CellUri.parse(cell);
            return !!parsedUri && (0, resources_1.isEqual)(this.notebook, parsedUri.notebook) && this.cellHandle === parsedUri.handle;
        }
        affectsNotebook(notebook) {
            return (0, resources_1.isEqual)(this.notebook, notebook);
        }
    }
    let NotebookExecutionListeners = class NotebookExecutionListeners extends lifecycle_1.Disposable {
        constructor(notebook, _notebookService, _notebookExecutionService, _notebookExecutionStateService, _logService) {
            super();
            this._notebookService = _notebookService;
            this._notebookExecutionService = _notebookExecutionService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._logService = _logService;
            this._logService.debug(`NotebookExecution#ctor ${notebook.toString()}`);
            const notebookModel = this._notebookService.getNotebookTextModel(notebook);
            if (!notebookModel) {
                throw new Error('Notebook not found: ' + notebook);
            }
            this._notebookModel = notebookModel;
            this._register(this._notebookModel.onWillAddRemoveCells(e => this.onWillAddRemoveCells(e)));
            this._register(this._notebookModel.onWillDispose(() => this.onWillDisposeDocument()));
        }
        cancelAll() {
            this._logService.debug(`NotebookExecutionListeners#cancelAll`);
            const exes = this._notebookExecutionStateService.getCellExecutionStatesForNotebook(this._notebookModel.uri);
            this._notebookExecutionService.cancelNotebookCellHandles(this._notebookModel, exes.map(exe => exe.cellHandle));
        }
        onWillDisposeDocument() {
            this._logService.debug(`NotebookExecution#onWillDisposeDocument`);
            this.cancelAll();
        }
        onWillAddRemoveCells(e) {
            const notebookExes = this._notebookExecutionStateService.getCellExecutionStatesForNotebook(this._notebookModel.uri);
            const handles = new Set(notebookExes.map(exe => exe.cellHandle));
            const myDeletedHandles = new Set();
            e.rawEvent.changes.forEach(([start, deleteCount]) => {
                if (deleteCount) {
                    const deletedHandles = this._notebookModel.cells.slice(start, start + deleteCount).map(c => c.handle);
                    deletedHandles.forEach(h => {
                        if (handles.has(h)) {
                            myDeletedHandles.add(h);
                        }
                    });
                }
                return false;
            });
            if (myDeletedHandles.size) {
                this._logService.debug(`NotebookExecution#onWillAddRemoveCells, ${JSON.stringify([...myDeletedHandles])}`);
                this._notebookExecutionService.cancelNotebookCellHandles(this._notebookModel, myDeletedHandles);
            }
        }
    };
    NotebookExecutionListeners = __decorate([
        __param(1, notebookService_1.INotebookService),
        __param(2, notebookExecutionService_1.INotebookExecutionService),
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService),
        __param(4, log_1.ILogService)
    ], NotebookExecutionListeners);
    function updateToEdit(update, cellHandle) {
        if (update.editType === notebookExecutionService_1.CellExecutionUpdateType.Output) {
            return {
                editType: 2 /* CellEditType.Output */,
                handle: cellHandle,
                append: update.append,
                outputs: update.outputs,
            };
        }
        else if (update.editType === notebookExecutionService_1.CellExecutionUpdateType.OutputItems) {
            return {
                editType: 7 /* CellEditType.OutputItems */,
                items: update.items,
                append: update.append,
                outputId: update.outputId
            };
        }
        else if (update.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState) {
            const newInternalMetadata = {};
            if (typeof update.executionOrder !== 'undefined') {
                newInternalMetadata.executionOrder = update.executionOrder;
            }
            if (typeof update.runStartTime !== 'undefined') {
                newInternalMetadata.runStartTime = update.runStartTime;
            }
            return {
                editType: 9 /* CellEditType.PartialInternalMetadata */,
                handle: cellHandle,
                internalMetadata: newInternalMetadata
            };
        }
        throw new Error('Unknown cell update type');
    }
    let CellExecution = class CellExecution extends lifecycle_1.Disposable {
        constructor(cellHandle, _notebookModel, _logService) {
            super();
            this.cellHandle = cellHandle;
            this._notebookModel = _notebookModel;
            this._logService = _logService;
            this._onDidUpdate = this._register(new event_1.Emitter());
            this.onDidUpdate = this._onDidUpdate.event;
            this._onDidComplete = this._register(new event_1.Emitter());
            this.onDidComplete = this._onDidComplete.event;
            this._state = notebookCommon_1.NotebookCellExecutionState.Unconfirmed;
            this._didPause = false;
            this._isPaused = false;
            this._logService.debug(`CellExecution#ctor ${this.getCellLog()}`);
            const startExecuteEdit = {
                editType: 9 /* CellEditType.PartialInternalMetadata */,
                handle: this.cellHandle,
                internalMetadata: {
                    runStartTime: null,
                    runEndTime: null,
                    lastRunSuccess: null,
                    executionOrder: null,
                }
            };
            this._applyExecutionEdits([startExecuteEdit]);
        }
        get state() {
            return this._state;
        }
        get notebook() {
            return this._notebookModel.uri;
        }
        get didPause() {
            return this._didPause;
        }
        get isPaused() {
            return this._isPaused;
        }
        getCellLog() {
            return `${this._notebookModel.uri.toString()}, ${this.cellHandle}`;
        }
        logUpdates(updates) {
            const updateTypes = updates.map(u => notebookExecutionService_1.CellExecutionUpdateType[u.editType]).join(', ');
            this._logService.debug(`CellExecution#updateExecution ${this.getCellLog()}, [${updateTypes}]`);
        }
        confirm() {
            this._logService.debug(`CellExecution#confirm ${this.getCellLog()}`);
            this._state = notebookCommon_1.NotebookCellExecutionState.Pending;
            this._onDidUpdate.fire();
        }
        update(updates) {
            this.logUpdates(updates);
            if (updates.some(u => u.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState)) {
                this._state = notebookCommon_1.NotebookCellExecutionState.Executing;
            }
            if (!this._didPause && updates.some(u => u.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState && u.didPause)) {
                this._didPause = true;
            }
            const lastIsPausedUpdate = [...updates].reverse().find(u => u.editType === notebookExecutionService_1.CellExecutionUpdateType.ExecutionState && typeof u.isPaused === 'boolean');
            if (lastIsPausedUpdate) {
                this._isPaused = lastIsPausedUpdate.isPaused;
            }
            const cellModel = this._notebookModel.cells.find(c => c.handle === this.cellHandle);
            if (!cellModel) {
                this._logService.debug(`CellExecution#update, updating cell not in notebook: ${this._notebookModel.uri.toString()}, ${this.cellHandle}`);
            }
            else {
                const edits = updates.map(update => updateToEdit(update, this.cellHandle));
                this._applyExecutionEdits(edits);
            }
            this._onDidUpdate.fire();
        }
        complete(completionData) {
            const cellModel = this._notebookModel.cells.find(c => c.handle === this.cellHandle);
            if (!cellModel) {
                this._logService.debug(`CellExecution#complete, completing cell not in notebook: ${this._notebookModel.uri.toString()}, ${this.cellHandle}`);
            }
            else {
                const edit = {
                    editType: 9 /* CellEditType.PartialInternalMetadata */,
                    handle: this.cellHandle,
                    internalMetadata: {
                        lastRunSuccess: completionData.lastRunSuccess,
                        runStartTime: this._didPause ? null : cellModel.internalMetadata.runStartTime,
                        runEndTime: this._didPause ? null : completionData.runEndTime,
                    }
                };
                this._applyExecutionEdits([edit]);
            }
            this._onDidComplete.fire();
        }
        _applyExecutionEdits(edits) {
            this._notebookModel.applyEdits(edits, true, undefined, () => undefined, undefined, false);
        }
    };
    CellExecution = __decorate([
        __param(2, log_1.ILogService)
    ], CellExecution);
});
//# sourceMappingURL=notebookExecutionStateServiceImpl.js.map