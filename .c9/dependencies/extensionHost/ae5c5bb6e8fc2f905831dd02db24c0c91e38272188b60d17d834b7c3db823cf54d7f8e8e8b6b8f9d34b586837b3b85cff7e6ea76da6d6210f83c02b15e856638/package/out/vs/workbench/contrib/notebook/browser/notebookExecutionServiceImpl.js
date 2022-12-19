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
define(["require", "exports", "vs/nls", "vs/base/common/cancellation", "vs/platform/commands/common/commands", "vs/platform/log/common/log", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService"], function (require, exports, nls, cancellation_1, commands_1, log_1, workspaceTrust_1, coreActions_1, notebookCommon_1, notebookExecutionStateService_1, notebookKernelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookExecutionService = void 0;
    let NotebookExecutionService = class NotebookExecutionService {
        constructor(_commandService, _notebookKernelService, _workspaceTrustRequestService, _logService, _notebookExecutionStateService) {
            this._commandService = _commandService;
            this._notebookKernelService = _notebookKernelService;
            this._workspaceTrustRequestService = _workspaceTrustRequestService;
            this._logService = _logService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
        }
        async executeNotebookCells(notebook, cells) {
            var _a;
            const cellsArr = Array.from(cells);
            this._logService.debug(`NotebookExecutionService#executeNotebookCells ${JSON.stringify(cellsArr.map(c => c.handle))}`);
            const message = nls.localize('notebookRunTrust', "Executing a notebook cell will run code from this workspace.");
            const trust = await this._workspaceTrustRequestService.requestWorkspaceTrust({ message });
            if (!trust) {
                return;
            }
            let kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(notebook);
            if (!kernel) {
                await this._commandService.executeCommand(coreActions_1.SELECT_KERNEL_ID);
                kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(notebook);
            }
            if (!kernel) {
                return;
            }
            if (kernel.type === 1 /* NotebookKernelType.Proxy */) {
                (_a = this._activeProxyKernelExecutionToken) === null || _a === void 0 ? void 0 : _a.dispose(true);
                const tokenSource = this._activeProxyKernelExecutionToken = new cancellation_1.CancellationTokenSource();
                const resolved = await kernel.resolveKernel(notebook.uri);
                const kernels = this._notebookKernelService.getMatchingKernel(notebook);
                const newlyMatchedKernel = kernels.all.find(k => k.id === resolved);
                if (!newlyMatchedKernel) {
                    return;
                }
                kernel = newlyMatchedKernel;
                if (tokenSource.token.isCancellationRequested) {
                    // execution was cancelled but we still need to update the active kernel
                    this._notebookKernelService.selectKernelForNotebook(kernel, notebook);
                    return;
                }
            }
            if (kernel.type === 1 /* NotebookKernelType.Proxy */) {
                return;
            }
            const executeCells = [];
            for (const cell of cellsArr) {
                const cellExe = this._notebookExecutionStateService.getCellExecution(cell.uri);
                if (cell.cellKind !== notebookCommon_1.CellKind.Code || !!cellExe) {
                    continue;
                }
                if (!kernel.supportedLanguages.includes(cell.language)) {
                    continue;
                }
                executeCells.push(cell);
            }
            if (executeCells.length > 0) {
                this._notebookKernelService.selectKernelForNotebook(kernel, notebook);
                const exes = executeCells.map(c => this._notebookExecutionStateService.createCellExecution(kernel.id, notebook.uri, c.handle));
                await kernel.executeNotebookCellsRequest(notebook.uri, executeCells.map(c => c.handle));
                const unconfirmed = exes.filter(exe => exe.state === notebookCommon_1.NotebookCellExecutionState.Unconfirmed);
                if (unconfirmed.length) {
                    this._logService.debug(`NotebookExecutionService#executeNotebookCells completing unconfirmed executions ${JSON.stringify(unconfirmed.map(exe => exe.cellHandle))}`);
                    unconfirmed.forEach(exe => exe.complete({}));
                }
            }
        }
        async cancelNotebookCellHandles(notebook, cells) {
            var _a;
            const cellsArr = Array.from(cells);
            this._logService.debug(`NotebookExecutionService#cancelNotebookCellHandles ${JSON.stringify(cellsArr)}`);
            const kernel = this._notebookKernelService.getSelectedOrSuggestedKernel(notebook);
            if (kernel) {
                if (kernel.type === 1 /* NotebookKernelType.Proxy */) {
                    (_a = this._activeProxyKernelExecutionToken) === null || _a === void 0 ? void 0 : _a.dispose(true);
                }
                else {
                    await kernel.cancelNotebookCellExecution(notebook.uri, cellsArr);
                }
            }
        }
        async cancelNotebookCells(notebook, cells) {
            this.cancelNotebookCellHandles(notebook, Array.from(cells, cell => cell.handle));
        }
        dispose() {
            var _a;
            (_a = this._activeProxyKernelExecutionToken) === null || _a === void 0 ? void 0 : _a.dispose(true);
        }
    };
    NotebookExecutionService = __decorate([
        __param(0, commands_1.ICommandService),
        __param(1, notebookKernelService_1.INotebookKernelService),
        __param(2, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(3, log_1.ILogService),
        __param(4, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], NotebookExecutionService);
    exports.NotebookExecutionService = NotebookExecutionService;
});
//# sourceMappingURL=notebookExecutionServiceImpl.js.map