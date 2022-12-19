/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/event"], function (require, exports, lifecycle_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookFindFilters = void 0;
    class NotebookFindFilters extends lifecycle_1.Disposable {
        constructor(markupInput, markupPreview, codeInput, codeOutput) {
            super();
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChange = this._onDidChange.event;
            this._markupInput = true;
            this._markupPreview = true;
            this._codeInput = true;
            this._codeOutput = true;
            this._markupInput = markupInput;
            this._markupPreview = markupPreview;
            this._codeInput = codeInput;
            this._codeOutput = codeOutput;
        }
        get markupInput() {
            return this._markupInput;
        }
        set markupInput(value) {
            if (this._markupInput !== value) {
                this._markupInput = value;
                this._onDidChange.fire({ markupInput: value });
            }
        }
        get markupPreview() {
            return this._markupPreview;
        }
        set markupPreview(value) {
            if (this._markupPreview !== value) {
                this._markupPreview = value;
                this._onDidChange.fire({ markupPreview: value });
            }
        }
        get codeInput() {
            return this._codeInput;
        }
        set codeInput(value) {
            if (this._codeInput !== value) {
                this._codeInput = value;
                this._onDidChange.fire({ codeInput: value });
            }
        }
        get codeOutput() {
            return this._codeOutput;
        }
        set codeOutput(value) {
            if (this._codeOutput !== value) {
                this._codeOutput = value;
                this._onDidChange.fire({ codeOutput: value });
            }
        }
        update(v) {
            this._markupInput = v.markupInput;
            this._markupPreview = v.markupPreview;
            this._codeInput = v.codeInput;
            this._codeOutput = v.codeOutput;
        }
    }
    exports.NotebookFindFilters = NotebookFindFilters;
});
//# sourceMappingURL=findFilters.js.map