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
define(["require", "exports", "vs/base/browser/ui/progressbar/progressbar", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, progressbar_1, cellPart_1, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellProgressBar = void 0;
    let CellProgressBar = class CellProgressBar extends cellPart_1.CellPart {
        constructor(editorContainer, collapsedInputContainer, _notebookExecutionStateService) {
            super();
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._progressBar = this._register(new progressbar_1.ProgressBar(editorContainer));
            this._progressBar.hide();
            this._collapsedProgressBar = this._register(new progressbar_1.ProgressBar(collapsedInputContainer));
            this._collapsedProgressBar.hide();
        }
        didRenderCell(element) {
            this._updateForExecutionState(element);
        }
        updateForExecutionState(element, e) {
            this._updateForExecutionState(element, e);
        }
        updateState(element, e) {
            if (e.metadataChanged || e.internalMetadataChanged) {
                this._updateForExecutionState(element);
            }
            if (e.inputCollapsedChanged) {
                const exeState = this._notebookExecutionStateService.getCellExecution(element.uri);
                if (element.isInputCollapsed) {
                    this._progressBar.hide();
                    if ((exeState === null || exeState === void 0 ? void 0 : exeState.state) === notebookCommon_1.NotebookCellExecutionState.Executing) {
                        this._updateForExecutionState(element);
                    }
                }
                else {
                    this._collapsedProgressBar.hide();
                    if ((exeState === null || exeState === void 0 ? void 0 : exeState.state) === notebookCommon_1.NotebookCellExecutionState.Executing) {
                        this._updateForExecutionState(element);
                    }
                }
            }
        }
        _updateForExecutionState(element, e) {
            var _a;
            const exeState = (_a = e === null || e === void 0 ? void 0 : e.changed) !== null && _a !== void 0 ? _a : this._notebookExecutionStateService.getCellExecution(element.uri);
            const progressBar = element.isInputCollapsed ? this._collapsedProgressBar : this._progressBar;
            if ((exeState === null || exeState === void 0 ? void 0 : exeState.state) === notebookCommon_1.NotebookCellExecutionState.Executing && (!exeState.didPause || element.isInputCollapsed)) {
                showProgressBar(progressBar);
            }
            else {
                progressBar.hide();
            }
        }
    };
    CellProgressBar = __decorate([
        __param(2, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], CellProgressBar);
    exports.CellProgressBar = CellProgressBar;
    function showProgressBar(progressBar) {
        progressBar.infinite().show(500);
    }
});
//# sourceMappingURL=cellProgressBar.js.map