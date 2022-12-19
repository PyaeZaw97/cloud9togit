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
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/registry/common/platform", "vs/workbench/common/contributions", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionService", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/services/editor/common/editorService"], function (require, exports, async_1, lifecycle_1, map_1, network_1, resources_1, uri_1, platform_1, contributions_1, debug_1, notebookBrowser_1, notebookCommon_1, notebookExecutionService_1, notebookExecutionStateService_1, notebookService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let NotebookBreakpoints = class NotebookBreakpoints extends lifecycle_1.Disposable {
        constructor(_debugService, _notebookService, _editorService) {
            super();
            this._debugService = _debugService;
            this._editorService = _editorService;
            const listeners = new map_1.ResourceMap();
            this._register(_notebookService.onWillAddNotebookDocument(model => {
                listeners.set(model.uri, model.onWillAddRemoveCells(e => {
                    // When deleting a cell, remove its breakpoints
                    const debugModel = this._debugService.getModel();
                    if (!debugModel.getBreakpoints().length) {
                        return;
                    }
                    if (e.rawEvent.kind !== notebookCommon_1.NotebookCellsChangeType.ModelChange) {
                        return;
                    }
                    for (const change of e.rawEvent.changes) {
                        const [start, deleteCount] = change;
                        if (deleteCount > 0) {
                            const deleted = model.cells.slice(start, start + deleteCount);
                            for (const deletedCell of deleted) {
                                const cellBps = debugModel.getBreakpoints({ uri: deletedCell.uri });
                                cellBps.forEach(cellBp => this._debugService.removeBreakpoints(cellBp.getId()));
                            }
                        }
                    }
                }));
            }));
            this._register(_notebookService.onWillRemoveNotebookDocument(model => {
                var _a;
                this.updateBreakpoints(model);
                (_a = listeners.get(model.uri)) === null || _a === void 0 ? void 0 : _a.dispose();
                listeners.delete(model.uri);
            }));
            this._register(this._debugService.getModel().onDidChangeBreakpoints(e => {
                var _a;
                const newCellBp = (_a = e === null || e === void 0 ? void 0 : e.added) === null || _a === void 0 ? void 0 : _a.find(bp => 'uri' in bp && bp.uri.scheme === network_1.Schemas.vscodeNotebookCell);
                if (newCellBp) {
                    const parsed = notebookCommon_1.CellUri.parse(newCellBp.uri);
                    if (!parsed) {
                        return;
                    }
                    const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(this._editorService.activeEditorPane);
                    if (!editor || !editor.hasModel() || editor.textModel.uri.toString() !== parsed.notebook.toString()) {
                        return;
                    }
                    const cell = editor.getCellByHandle(parsed.handle);
                    if (!cell) {
                        return;
                    }
                    editor.focusElement(cell);
                }
            }));
        }
        updateBreakpoints(model) {
            const bps = this._debugService.getModel().getBreakpoints();
            if (!bps.length || !model.cells.length) {
                return;
            }
            const idxMap = new map_1.ResourceMap();
            model.cells.forEach((cell, i) => {
                idxMap.set(cell.uri, i);
            });
            bps.forEach(bp => {
                var _a;
                const idx = idxMap.get(bp.uri);
                if (typeof idx !== 'number') {
                    return;
                }
                const notebook = (_a = notebookCommon_1.CellUri.parse(bp.uri)) === null || _a === void 0 ? void 0 : _a.notebook;
                if (!notebook) {
                    return;
                }
                const newUri = notebookCommon_1.CellUri.generate(notebook, idx);
                if ((0, resources_1.isEqual)(newUri, bp.uri)) {
                    return;
                }
                this._debugService.removeBreakpoints(bp.getId());
                this._debugService.addBreakpoints(newUri, [
                    {
                        column: bp.column,
                        condition: bp.condition,
                        enabled: bp.enabled,
                        hitCondition: bp.hitCondition,
                        logMessage: bp.logMessage,
                        lineNumber: bp.lineNumber
                    }
                ]);
            });
        }
    };
    NotebookBreakpoints = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, notebookService_1.INotebookService),
        __param(2, editorService_1.IEditorService)
    ], NotebookBreakpoints);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(NotebookBreakpoints, 3 /* LifecyclePhase.Restored */);
    let NotebookCellPausing = class NotebookCellPausing extends lifecycle_1.Disposable {
        constructor(_debugService, _notebookExecutionStateService) {
            super();
            this._debugService = _debugService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._pausedCells = new Set();
            this._register(_debugService.getModel().onDidChangeCallStack(() => {
                // First update using the stale callstack if the real callstack is empty, to reduce blinking while stepping.
                // After not pausing for 2s, update again with the latest callstack.
                this.onDidChangeCallStack(true);
                this._scheduler.schedule();
            }));
            this._scheduler = this._register(new async_1.RunOnceScheduler(() => this.onDidChangeCallStack(false), 2000));
        }
        async onDidChangeCallStack(fallBackOnStaleCallstack) {
            const newPausedCells = new Set();
            for (const session of this._debugService.getModel().getSessions()) {
                for (const thread of session.getAllThreads()) {
                    let callStack = thread.getCallStack();
                    if (fallBackOnStaleCallstack && !callStack.length) {
                        callStack = thread.getStaleCallStack();
                    }
                    callStack.forEach(sf => {
                        const parsed = notebookCommon_1.CellUri.parse(sf.source.uri);
                        if (parsed) {
                            newPausedCells.add(sf.source.uri.toString());
                            this.editIsPaused(sf.source.uri, true);
                        }
                    });
                }
            }
            for (const uri of this._pausedCells) {
                if (!newPausedCells.has(uri)) {
                    this.editIsPaused(uri_1.URI.parse(uri), false);
                    this._pausedCells.delete(uri);
                }
            }
            newPausedCells.forEach(cell => this._pausedCells.add(cell));
        }
        editIsPaused(cellUri, isPaused) {
            const parsed = notebookCommon_1.CellUri.parse(cellUri);
            if (parsed) {
                const exeState = this._notebookExecutionStateService.getCellExecution(cellUri);
                if (exeState && (exeState.isPaused !== isPaused || !exeState.didPause)) {
                    exeState.update([{
                            editType: notebookExecutionService_1.CellExecutionUpdateType.ExecutionState,
                            didPause: true,
                            isPaused
                        }]);
                }
            }
        }
    };
    NotebookCellPausing = __decorate([
        __param(0, debug_1.IDebugService),
        __param(1, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], NotebookCellPausing);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(NotebookCellPausing, 3 /* LifecyclePhase.Restored */);
});
//# sourceMappingURL=notebookBreakpoints.js.map