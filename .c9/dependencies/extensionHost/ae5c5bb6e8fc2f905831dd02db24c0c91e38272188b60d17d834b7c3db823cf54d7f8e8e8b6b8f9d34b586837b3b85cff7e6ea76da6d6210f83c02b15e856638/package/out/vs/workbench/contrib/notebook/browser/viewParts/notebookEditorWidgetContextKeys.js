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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/contrib/notebook/common/notebookExecutionStateService", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, lifecycle_1, contextkey_1, notebookBrowser_1, notebookContextKeys_1, notebookExecutionStateService_1, notebookKernelService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookEditorContextKeys = void 0;
    let NotebookEditorContextKeys = class NotebookEditorContextKeys {
        constructor(_editor, _notebookKernelService, contextKeyService, _extensionService, _notebookExecutionStateService) {
            this._editor = _editor;
            this._notebookKernelService = _notebookKernelService;
            this._extensionService = _extensionService;
            this._notebookExecutionStateService = _notebookExecutionStateService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._viewModelDisposables = new lifecycle_1.DisposableStore();
            this._cellOutputsListeners = [];
            this._notebookKernel = notebookContextKeys_1.NOTEBOOK_KERNEL.bindTo(contextKeyService);
            this._notebookKernelCount = notebookContextKeys_1.NOTEBOOK_KERNEL_COUNT.bindTo(contextKeyService);
            this._notebookKernelSelected = notebookContextKeys_1.NOTEBOOK_KERNEL_SELECTED.bindTo(contextKeyService);
            this._interruptibleKernel = notebookContextKeys_1.NOTEBOOK_INTERRUPTIBLE_KERNEL.bindTo(contextKeyService);
            this._someCellRunning = notebookContextKeys_1.NOTEBOOK_HAS_RUNNING_CELL.bindTo(contextKeyService);
            this._useConsolidatedOutputButton = notebookContextKeys_1.NOTEBOOK_USE_CONSOLIDATED_OUTPUT_BUTTON.bindTo(contextKeyService);
            this._hasOutputs = notebookContextKeys_1.NOTEBOOK_HAS_OUTPUTS.bindTo(contextKeyService);
            this._viewType = notebookContextKeys_1.NOTEBOOK_VIEW_TYPE.bindTo(contextKeyService);
            this._missingKernelExtension = notebookContextKeys_1.NOTEBOOK_MISSING_KERNEL_EXTENSION.bindTo(contextKeyService);
            this._cellToolbarLocation = notebookContextKeys_1.NOTEBOOK_CELL_TOOLBAR_LOCATION.bindTo(contextKeyService);
            this._handleDidChangeModel();
            this._updateForNotebookOptions();
            this._disposables.add(_editor.onDidChangeModel(this._handleDidChangeModel, this));
            this._disposables.add(_notebookKernelService.onDidAddKernel(this._updateKernelContext, this));
            this._disposables.add(_notebookKernelService.onDidChangeSelectedNotebooks(this._updateKernelContext, this));
            this._disposables.add(_editor.notebookOptions.onDidChangeOptions(this._updateForNotebookOptions, this));
            this._disposables.add(_extensionService.onDidChangeExtensions(this._updateForInstalledExtension, this));
            this._disposables.add(_notebookExecutionStateService.onDidChangeCellExecution(this._updateForCellExecution, this));
        }
        dispose() {
            this._disposables.dispose();
            this._viewModelDisposables.dispose();
            this._notebookKernelCount.reset();
            this._interruptibleKernel.reset();
            this._someCellRunning.reset();
            this._viewType.reset();
            (0, lifecycle_1.dispose)(this._cellOutputsListeners);
            this._cellOutputsListeners.length = 0;
        }
        _handleDidChangeModel() {
            this._updateKernelContext();
            this._updateForNotebookOptions();
            this._viewModelDisposables.clear();
            (0, lifecycle_1.dispose)(this._cellOutputsListeners);
            this._cellOutputsListeners.length = 0;
            if (!this._editor.hasModel()) {
                return;
            }
            const recomputeOutputsExistence = () => {
                let hasOutputs = false;
                if (this._editor.hasModel()) {
                    for (let i = 0; i < this._editor.getLength(); i++) {
                        if (this._editor.cellAt(i).outputsViewModels.length > 0) {
                            hasOutputs = true;
                            break;
                        }
                    }
                }
                this._hasOutputs.set(hasOutputs);
            };
            const addCellOutputsListener = (c) => {
                return c.model.onDidChangeOutputs(() => {
                    recomputeOutputsExistence();
                });
            };
            for (let i = 0; i < this._editor.getLength(); i++) {
                const cell = this._editor.cellAt(i);
                this._cellOutputsListeners.push(addCellOutputsListener(cell));
            }
            recomputeOutputsExistence();
            this._updateForInstalledExtension();
            this._viewModelDisposables.add(this._editor.onDidChangeViewCells(e => {
                e.splices.reverse().forEach(splice => {
                    const [start, deleted, newCells] = splice;
                    const deletedCellOutputStates = this._cellOutputsListeners.splice(start, deleted, ...newCells.map(addCellOutputsListener));
                    (0, lifecycle_1.dispose)(deletedCellOutputStates);
                });
            }));
            this._viewType.set(this._editor.textModel.viewType);
        }
        _updateForCellExecution() {
            if (this._editor.textModel) {
                const notebookExe = this._notebookExecutionStateService.getCellExecutionStatesForNotebook(this._editor.textModel.uri);
                this._someCellRunning.set(notebookExe.length > 0);
            }
            else {
                this._someCellRunning.set(false);
            }
        }
        async _updateForInstalledExtension() {
            if (!this._editor.hasModel()) {
                return;
            }
            const viewType = this._editor.textModel.viewType;
            const kernelExtensionId = notebookBrowser_1.KERNEL_EXTENSIONS.get(viewType);
            this._missingKernelExtension.set(!!kernelExtensionId && !(await this._extensionService.getExtension(kernelExtensionId)));
        }
        _updateKernelContext() {
            var _a, _b;
            if (!this._editor.hasModel()) {
                this._notebookKernelCount.reset();
                this._interruptibleKernel.reset();
                return;
            }
            const { selected, all } = this._notebookKernelService.getMatchingKernel(this._editor.textModel);
            this._notebookKernelCount.set(all.length);
            this._interruptibleKernel.set((_a = ((selected === null || selected === void 0 ? void 0 : selected.type) === 0 /* NotebookKernelType.Resolved */ && selected.implementsInterrupt)) !== null && _a !== void 0 ? _a : false);
            this._notebookKernelSelected.set(Boolean(selected));
            this._notebookKernel.set((_b = selected === null || selected === void 0 ? void 0 : selected.id) !== null && _b !== void 0 ? _b : '');
        }
        _updateForNotebookOptions() {
            var _a;
            const layout = this._editor.notebookOptions.getLayoutConfiguration();
            this._useConsolidatedOutputButton.set(layout.consolidatedOutputButton);
            this._cellToolbarLocation.set(this._editor.notebookOptions.computeCellToolbarLocation((_a = this._editor.textModel) === null || _a === void 0 ? void 0 : _a.viewType));
        }
    };
    NotebookEditorContextKeys = __decorate([
        __param(1, notebookKernelService_1.INotebookKernelService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, extensions_1.IExtensionService),
        __param(4, notebookExecutionStateService_1.INotebookExecutionStateService)
    ], NotebookEditorContextKeys);
    exports.NotebookEditorContextKeys = NotebookEditorContextKeys;
});
//# sourceMappingURL=notebookEditorWidgetContextKeys.js.map