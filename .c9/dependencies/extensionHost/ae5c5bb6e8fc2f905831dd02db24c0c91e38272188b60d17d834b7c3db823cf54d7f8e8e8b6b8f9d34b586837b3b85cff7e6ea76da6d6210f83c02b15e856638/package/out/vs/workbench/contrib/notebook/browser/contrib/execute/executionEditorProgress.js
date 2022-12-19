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
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, decorators_1, lifecycle_1, notebookEditorExtensions_1, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExecutionEditorProgressController = void 0;
    let ExecutionEditorProgressController = class ExecutionEditorProgressController extends lifecycle_1.Disposable {
        constructor(_notebookEditor, _notebookExecutionStateService) {
            super();
            this._notebookEditor = _notebookEditor;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._register(_notebookEditor.onDidScroll(() => this._update()));
            this._register(_notebookExecutionStateService.onDidChangeCellExecution(e => {
                var _a;
                if (e.notebook.toString() !== ((_a = this._notebookEditor.textModel) === null || _a === void 0 ? void 0 : _a.uri.toString())) {
                    return;
                }
                this._update();
            }));
            this._register(_notebookEditor.onDidChangeModel(() => this._update()));
        }
        _update() {
            var _a;
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            const executing = this._notebookExecutionStateService.getCellExecutionStatesForNotebook((_a = this._notebookEditor.textModel) === null || _a === void 0 ? void 0 : _a.uri)
                .filter(exe => exe.state === notebookCommon_1.NotebookCellExecutionState.Executing);
            const executionIsVisible = (exe) => {
                for (const range of this._notebookEditor.visibleRanges) {
                    for (const cell of this._notebookEditor.getCellsInRange(range)) {
                        if (cell.handle === exe.cellHandle) {
                            const top = this._notebookEditor.getAbsoluteTopOfElement(cell);
                            if (this._notebookEditor.scrollTop < top + 30) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            };
            if (!executing.length || executing.some(executionIsVisible) || executing.some(e => e.isPaused)) {
                this._notebookEditor.hideProgress();
            }
            else {
                this._notebookEditor.showProgress();
            }
        }
    };
    ExecutionEditorProgressController.id = 'workbench.notebook.executionEditorProgress';
    __decorate([
        (0, decorators_1.throttle)(100)
    ], ExecutionEditorProgressController.prototype, "_update", null);
    ExecutionEditorProgressController = __decorate([
        __param(1, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], ExecutionEditorProgressController);
    exports.ExecutionEditorProgressController = ExecutionEditorProgressController;
    (0, notebookEditorExtensions_1.registerNotebookContribution)(ExecutionEditorProgressController.id, ExecutionEditorProgressController);
});
//# sourceMappingURL=executionEditorProgress.js.map