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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/cellPart", "vs/workbench/contrib/notebook/browser/viewModel/codeCellViewModel", "vs/workbench/contrib/notebook/browser/viewModel/markupCellViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookExecutionStateService"], function (require, exports, lifecycle_1, contextkey_1, instantiation_1, notebookBrowser_1, cellPart_1, codeCellViewModel_1, markupCellViewModel_1, notebookCommon_1, notebookContextKeys_1, notebookExecutionStateService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellContextKeyManager = exports.CellContextKeyPart = void 0;
    let CellContextKeyPart = class CellContextKeyPart extends cellPart_1.CellPart {
        constructor(notebookEditor, instantiationService) {
            super();
            this.instantiationService = instantiationService;
            this.cellContextKeyManager = this._register(this.instantiationService.createInstance(CellContextKeyManager, notebookEditor, undefined));
        }
        didRenderCell(element) {
            this.cellContextKeyManager.updateForElement(element);
        }
    };
    CellContextKeyPart = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], CellContextKeyPart);
    exports.CellContextKeyPart = CellContextKeyPart;
    let CellContextKeyManager = class CellContextKeyManager extends lifecycle_1.Disposable {
        constructor(notebookEditor, element, _contextKeyService, _notebookExecutionStateService) {
            super();
            this.notebookEditor = notebookEditor;
            this.element = element;
            this._contextKeyService = _contextKeyService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this.elementDisposables = this._register(new lifecycle_1.DisposableStore());
            this._contextKeyService.bufferChangeEvents(() => {
                this.cellType = notebookContextKeys_1.NOTEBOOK_CELL_TYPE.bindTo(this._contextKeyService);
                this.cellEditable = notebookContextKeys_1.NOTEBOOK_CELL_EDITABLE.bindTo(this._contextKeyService);
                this.cellFocused = notebookContextKeys_1.NOTEBOOK_CELL_FOCUSED.bindTo(this._contextKeyService);
                this.cellEditorFocused = notebookContextKeys_1.NOTEBOOK_CELL_EDITOR_FOCUSED.bindTo(this._contextKeyService);
                this.markdownEditMode = notebookContextKeys_1.NOTEBOOK_CELL_MARKDOWN_EDIT_MODE.bindTo(this._contextKeyService);
                this.cellRunState = notebookContextKeys_1.NOTEBOOK_CELL_EXECUTION_STATE.bindTo(this._contextKeyService);
                this.cellExecuting = notebookContextKeys_1.NOTEBOOK_CELL_EXECUTING.bindTo(this._contextKeyService);
                this.cellHasOutputs = notebookContextKeys_1.NOTEBOOK_CELL_HAS_OUTPUTS.bindTo(this._contextKeyService);
                this.cellContentCollapsed = notebookContextKeys_1.NOTEBOOK_CELL_INPUT_COLLAPSED.bindTo(this._contextKeyService);
                this.cellOutputCollapsed = notebookContextKeys_1.NOTEBOOK_CELL_OUTPUT_COLLAPSED.bindTo(this._contextKeyService);
                this.cellLineNumbers = notebookContextKeys_1.NOTEBOOK_CELL_LINE_NUMBERS.bindTo(this._contextKeyService);
                this.cellResource = notebookContextKeys_1.NOTEBOOK_CELL_RESOURCE.bindTo(this._contextKeyService);
                if (element) {
                    this.updateForElement(element);
                }
            });
            this._register(this._notebookExecutionStateService.onDidChangeCellExecution(e => {
                if (this.element && e.affectsCell(this.element.uri)) {
                    this.updateForExecutionState();
                }
            }));
        }
        updateForElement(element) {
            this.elementDisposables.clear();
            this.element = element;
            if (!element) {
                return;
            }
            this.elementDisposables.add(element.onDidChangeState(e => this.onDidChangeState(e)));
            if (element instanceof codeCellViewModel_1.CodeCellViewModel) {
                this.elementDisposables.add(element.onDidChangeOutputs(() => this.updateForOutputs()));
            }
            this.elementDisposables.add(this.notebookEditor.onDidChangeActiveCell(() => this.updateForFocusState()));
            if (this.element instanceof markupCellViewModel_1.MarkupCellViewModel) {
                this.cellType.set('markup');
            }
            else if (this.element instanceof codeCellViewModel_1.CodeCellViewModel) {
                this.cellType.set('code');
            }
            this._contextKeyService.bufferChangeEvents(() => {
                this.updateForFocusState();
                this.updateForExecutionState();
                this.updateForEditState();
                this.updateForCollapseState();
                this.updateForOutputs();
                this.cellLineNumbers.set(this.element.lineNumbers);
                this.cellResource.set(this.element.uri.toString());
            });
        }
        onDidChangeState(e) {
            this._contextKeyService.bufferChangeEvents(() => {
                if (e.internalMetadataChanged) {
                    this.updateForExecutionState();
                }
                if (e.editStateChanged) {
                    this.updateForEditState();
                }
                if (e.focusModeChanged) {
                    this.updateForFocusState();
                }
                if (e.cellLineNumberChanged) {
                    this.cellLineNumbers.set(this.element.lineNumbers);
                }
                if (e.inputCollapsedChanged || e.outputCollapsedChanged) {
                    this.updateForCollapseState();
                }
            });
        }
        updateForFocusState() {
            if (!this.element) {
                return;
            }
            const activeCell = this.notebookEditor.getActiveCell();
            this.cellFocused.set(this.notebookEditor.getActiveCell() === this.element);
            if (activeCell === this.element) {
                this.cellEditorFocused.set(this.element.focusMode === notebookBrowser_1.CellFocusMode.Editor);
            }
            else {
                this.cellEditorFocused.set(false);
            }
        }
        updateForExecutionState() {
            if (!this.element) {
                return;
            }
            const internalMetadata = this.element.internalMetadata;
            this.cellEditable.set(!this.notebookEditor.isReadOnly);
            const exeState = this._notebookExecutionStateService.getCellExecution(this.element.uri);
            if (this.element instanceof markupCellViewModel_1.MarkupCellViewModel) {
                this.cellRunState.reset();
                this.cellExecuting.reset();
            }
            else if ((exeState === null || exeState === void 0 ? void 0 : exeState.state) === notebookCommon_1.NotebookCellExecutionState.Executing) {
                this.cellRunState.set('executing');
                this.cellExecuting.set(true);
            }
            else if ((exeState === null || exeState === void 0 ? void 0 : exeState.state) === notebookCommon_1.NotebookCellExecutionState.Pending || (exeState === null || exeState === void 0 ? void 0 : exeState.state) === notebookCommon_1.NotebookCellExecutionState.Unconfirmed) {
                this.cellRunState.set('pending');
                this.cellExecuting.set(true);
            }
            else if (internalMetadata.lastRunSuccess === true) {
                this.cellRunState.set('succeeded');
                this.cellExecuting.set(false);
            }
            else if (internalMetadata.lastRunSuccess === false) {
                this.cellRunState.set('failed');
                this.cellExecuting.set(false);
            }
            else {
                this.cellRunState.set('idle');
                this.cellExecuting.set(false);
            }
        }
        updateForEditState() {
            if (!this.element) {
                return;
            }
            if (this.element instanceof markupCellViewModel_1.MarkupCellViewModel) {
                this.markdownEditMode.set(this.element.getEditState() === notebookBrowser_1.CellEditState.Editing);
            }
            else {
                this.markdownEditMode.set(false);
            }
        }
        updateForCollapseState() {
            if (!this.element) {
                return;
            }
            this.cellContentCollapsed.set(!!this.element.isInputCollapsed);
            this.cellOutputCollapsed.set(!!this.element.isOutputCollapsed);
        }
        updateForOutputs() {
            if (this.element instanceof codeCellViewModel_1.CodeCellViewModel) {
                this.cellHasOutputs.set(this.element.outputsViewModels.length > 0);
            }
            else {
                this.cellHasOutputs.set(false);
            }
        }
    };
    CellContextKeyManager = __decorate([
        __param(2, contextkey_1.IContextKeyService),
        __param(3, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], CellContextKeyManager);
    exports.CellContextKeyManager = CellContextKeyManager;
});
//# sourceMappingURL=cellContextKeys.js.map