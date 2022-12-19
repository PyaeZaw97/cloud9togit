/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellOutputTextModel = void 0;
    class NotebookCellOutputTextModel extends lifecycle_1.Disposable {
        constructor(_rawOutput) {
            super();
            this._rawOutput = _rawOutput;
            this._onDidChangeData = this._register(new event_1.Emitter());
            this.onDidChangeData = this._onDidChangeData.event;
        }
        get outputs() {
            return this._rawOutput.outputs || [];
        }
        get metadata() {
            return this._rawOutput.metadata;
        }
        get outputId() {
            return this._rawOutput.outputId;
        }
        replaceData(items) {
            this._rawOutput.outputs = items;
            this._onDidChangeData.fire();
        }
        appendData(items) {
            this._rawOutput.outputs.push(...items);
            this._onDidChangeData.fire();
        }
        toJSON() {
            return {
                // data: this._data,
                metadata: this._rawOutput.metadata,
                outputs: this._rawOutput.outputs,
                outputId: this._rawOutput.outputId
            };
        }
    }
    exports.NotebookCellOutputTextModel = NotebookCellOutputTextModel;
});
//# sourceMappingURL=notebookCellOutputTextModel.js.map