/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor/editorModel"], function (require, exports, editorModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiffEditorModel = void 0;
    /**
     * The base editor model for the diff editor. It is made up of two editor models, the original version
     * and the modified version.
     */
    class DiffEditorModel extends editorModel_1.EditorModel {
        constructor(originalModel, modifiedModel) {
            super();
            this._originalModel = originalModel;
            this._modifiedModel = modifiedModel;
        }
        get originalModel() { return this._originalModel; }
        get modifiedModel() { return this._modifiedModel; }
        async resolve() {
            var _a, _b;
            await Promise.all([
                (_a = this._originalModel) === null || _a === void 0 ? void 0 : _a.resolve(),
                (_b = this._modifiedModel) === null || _b === void 0 ? void 0 : _b.resolve()
            ]);
        }
        isResolved() {
            var _a, _b;
            return !!(((_a = this.originalModel) === null || _a === void 0 ? void 0 : _a.isResolved()) && ((_b = this.modifiedModel) === null || _b === void 0 ? void 0 : _b.isResolved()));
        }
        dispose() {
            // Do not propagate the dispose() call to the two models inside. We never created the two models
            // (original and modified) so we can not dispose them without sideeffects. Rather rely on the
            // models getting disposed when their related inputs get disposed from the diffEditorInput.
            super.dispose();
        }
    }
    exports.DiffEditorModel = DiffEditorModel;
});
//# sourceMappingURL=diffEditorModel.js.map