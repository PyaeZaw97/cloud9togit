/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, lifecycle_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CellOutputViewModel = void 0;
    let handle = 0;
    class CellOutputViewModel extends lifecycle_1.Disposable {
        constructor(cellViewModel, _outputRawData, _notebookService) {
            super();
            this.cellViewModel = cellViewModel;
            this._outputRawData = _outputRawData;
            this._notebookService = _notebookService;
            this.outputHandle = handle++;
        }
        get model() {
            return this._outputRawData;
        }
        get pickedMimeType() {
            return this._pickedMimeType;
        }
        set pickedMimeType(value) {
            this._pickedMimeType = value;
        }
        hasMultiMimeType() {
            if (this._outputRawData.outputs.length < 2) {
                return false;
            }
            const firstMimeType = this._outputRawData.outputs[0].mime;
            return this._outputRawData.outputs.some(output => output.mime !== firstMimeType);
        }
        resolveMimeTypes(textModel, kernelProvides) {
            const mimeTypes = this._notebookService.getOutputMimeTypeInfo(textModel, kernelProvides, this.model);
            let index = -1;
            if (this._pickedMimeType) {
                index = mimeTypes.findIndex(mimeType => mimeType.rendererId === this._pickedMimeType.rendererId && mimeType.mimeType === this._pickedMimeType.mimeType && mimeType.isTrusted);
            }
            // there is at least one mimetype which is safe and can be rendered by the core
            if (index === -1) {
                index = mimeTypes.findIndex(mimeType => mimeType.rendererId !== notebookCommon_1.RENDERER_NOT_AVAILABLE && mimeType.isTrusted);
            }
            return [mimeTypes, Math.max(index, 0)];
        }
        toRawJSON() {
            return {
                outputs: this._outputRawData.outputs,
                // TODO@rebronix, no id, right?
            };
        }
    }
    exports.CellOutputViewModel = CellOutputViewModel;
});
//# sourceMappingURL=cellOutputViewModel.js.map