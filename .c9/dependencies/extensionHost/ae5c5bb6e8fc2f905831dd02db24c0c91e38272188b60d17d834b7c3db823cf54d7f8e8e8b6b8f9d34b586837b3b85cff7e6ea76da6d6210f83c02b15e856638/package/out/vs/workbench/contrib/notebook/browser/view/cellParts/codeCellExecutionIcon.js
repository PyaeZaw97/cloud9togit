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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/lifecycle", "vs/nls", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, DOM, iconLabels_1, lifecycle_1, nls_1, themeService_1, notebookIcons_1, notebookCommon_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollapsedCodeCellExecutionIcon = void 0;
    let CollapsedCodeCellExecutionIcon = class CollapsedCodeCellExecutionIcon extends lifecycle_1.Disposable {
        constructor(_notebookEditor, _cell, _element, _executionStateService) {
            super();
            this._cell = _cell;
            this._element = _element;
            this._executionStateService = _executionStateService;
            this._visible = false;
            this._update();
            this._register(this._executionStateService.onDidChangeCellExecution(e => {
                if (e.affectsCell(this._cell.uri)) {
                    this._update();
                }
            }));
            this._register(this._cell.model.onDidChangeInternalMetadata(() => this._update()));
        }
        setVisibility(visible) {
            this._visible = visible;
            this._update();
        }
        _update() {
            var _a;
            if (!this._visible) {
                return;
            }
            const runState = this._executionStateService.getCellExecution(this._cell.uri);
            const item = this._getItemForState(runState, this._cell.model.internalMetadata);
            if (item) {
                this._element.style.display = '';
                DOM.reset(this._element, ...(0, iconLabels_1.renderLabelWithIcons)(item.text));
                this._element.title = (_a = item.tooltip) !== null && _a !== void 0 ? _a : '';
            }
            else {
                this._element.style.display = 'none';
                DOM.reset(this._element);
            }
        }
        _getItemForState(runState, internalMetadata) {
            const state = runState === null || runState === void 0 ? void 0 : runState.state;
            const { lastRunSuccess } = internalMetadata;
            if (!state && lastRunSuccess) {
                return {
                    text: `$(${notebookIcons_1.successStateIcon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.success', "Success"),
                };
            }
            else if (!state && lastRunSuccess === false) {
                return {
                    text: `$(${notebookIcons_1.errorStateIcon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.failed', "Failed"),
                };
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Pending || state === notebookCommon_1.NotebookCellExecutionState.Unconfirmed) {
                return {
                    text: `$(${notebookIcons_1.pendingStateIcon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.pending', "Pending"),
                };
            }
            else if (state === notebookCommon_1.NotebookCellExecutionState.Executing) {
                const icon = themeService_1.ThemeIcon.modify(notebookIcons_1.executingStateIcon, 'spin');
                return {
                    text: `$(${icon.id})`,
                    tooltip: (0, nls_1.localize)('notebook.cell.status.executing', "Executing"),
                };
            }
            return;
        }
    };
    CollapsedCodeCellExecutionIcon = __decorate([
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], CollapsedCodeCellExecutionIcon);
    exports.CollapsedCodeCellExecutionIcon = CollapsedCodeCellExecutionIcon;
});
//# sourceMappingURL=codeCellExecutionIcon.js.map