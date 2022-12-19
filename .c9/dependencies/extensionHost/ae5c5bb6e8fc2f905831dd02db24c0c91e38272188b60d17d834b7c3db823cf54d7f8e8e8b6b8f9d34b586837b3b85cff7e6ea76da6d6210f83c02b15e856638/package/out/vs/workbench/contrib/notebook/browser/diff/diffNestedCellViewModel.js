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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uuid", "vs/editor/common/model/prefixSumComputer", "vs/workbench/contrib/notebook/browser/viewModel/cellOutputViewModel", "vs/workbench/contrib/notebook/common/notebookService"], function (require, exports, event_1, lifecycle_1, uuid_1, prefixSumComputer_1, cellOutputViewModel_1, notebookService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffNestedCellViewModel = void 0;
    let DiffNestedCellViewModel = class DiffNestedCellViewModel extends lifecycle_1.Disposable {
        constructor(textModel, _notebookService) {
            super();
            this.textModel = textModel;
            this._notebookService = _notebookService;
            this._onDidChangeState = this._register(new event_1.Emitter());
            this._hoveringOutput = false;
            this._focusOnOutput = false;
            this._outputCollection = [];
            this._outputsTop = null;
            this._onDidChangeOutputLayout = this._register(new event_1.Emitter());
            this.onDidChangeOutputLayout = this._onDidChangeOutputLayout.event;
            this._id = (0, uuid_1.generateUuid)();
            this._outputViewModels = this.textModel.outputs.map(output => new cellOutputViewModel_1.CellOutputViewModel(this, output, this._notebookService));
            this._register(this.textModel.onDidChangeOutputs((splice) => {
                this._outputCollection.splice(splice.start, splice.deleteCount, ...splice.newOutputs.map(() => 0));
                this._outputViewModels.splice(splice.start, splice.deleteCount, ...splice.newOutputs.map(output => new cellOutputViewModel_1.CellOutputViewModel(this, output, this._notebookService)));
                this._outputsTop = null;
                this._onDidChangeOutputLayout.fire();
            }));
            this._outputCollection = new Array(this.textModel.outputs.length);
        }
        get id() {
            return this._id;
        }
        get outputs() {
            return this.textModel.outputs;
        }
        get language() {
            return this.textModel.language;
        }
        get metadata() {
            return this.textModel.metadata;
        }
        get uri() {
            return this.textModel.uri;
        }
        get handle() {
            return this.textModel.handle;
        }
        get outputIsHovered() {
            return this._hoveringOutput;
        }
        set outputIsHovered(v) {
            this._hoveringOutput = v;
            this._onDidChangeState.fire({ outputIsHoveredChanged: true });
        }
        get outputIsFocused() {
            return this._focusOnOutput;
        }
        set outputIsFocused(v) {
            this._focusOnOutput = v;
            this._onDidChangeState.fire({ outputIsFocusedChanged: true });
        }
        get outputsViewModels() {
            return this._outputViewModels;
        }
        _ensureOutputsTop() {
            if (!this._outputsTop) {
                const values = new Uint32Array(this._outputCollection.length);
                for (let i = 0; i < this._outputCollection.length; i++) {
                    values[i] = this._outputCollection[i];
                }
                this._outputsTop = new prefixSumComputer_1.PrefixSumComputer(values);
            }
        }
        getOutputOffset(index) {
            this._ensureOutputsTop();
            if (index >= this._outputCollection.length) {
                throw new Error('Output index out of range!');
            }
            return this._outputsTop.getPrefixSum(index - 1);
        }
        updateOutputHeight(index, height) {
            if (index >= this._outputCollection.length) {
                throw new Error('Output index out of range!');
            }
            this._ensureOutputsTop();
            this._outputCollection[index] = height;
            if (this._outputsTop.setValue(index, height)) {
                this._onDidChangeOutputLayout.fire();
            }
        }
        getOutputTotalHeight() {
            var _a, _b;
            this._ensureOutputsTop();
            return (_b = (_a = this._outputsTop) === null || _a === void 0 ? void 0 : _a.getTotalSum()) !== null && _b !== void 0 ? _b : 0;
        }
    };
    DiffNestedCellViewModel = __decorate([
        __param(1, notebookService_1.INotebookService)
    ], DiffNestedCellViewModel);
    exports.DiffNestedCellViewModel = DiffNestedCellViewModel;
});
//# sourceMappingURL=diffNestedCellViewModel.js.map