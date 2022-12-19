/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/core/selection"], function (require, exports, range_1, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompositionSurroundSelectionCommand = exports.SurroundSelectionCommand = void 0;
    class SurroundSelectionCommand {
        constructor(range, charBeforeSelection, charAfterSelection) {
            this._range = range;
            this._charBeforeSelection = charBeforeSelection;
            this._charAfterSelection = charAfterSelection;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(new range_1.Range(this._range.startLineNumber, this._range.startColumn, this._range.startLineNumber, this._range.startColumn), this._charBeforeSelection);
            builder.addTrackedEditOperation(new range_1.Range(this._range.endLineNumber, this._range.endColumn, this._range.endLineNumber, this._range.endColumn), this._charAfterSelection);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const firstOperationRange = inverseEditOperations[0].range;
            const secondOperationRange = inverseEditOperations[1].range;
            return new selection_1.Selection(firstOperationRange.endLineNumber, firstOperationRange.endColumn, secondOperationRange.endLineNumber, secondOperationRange.endColumn - this._charAfterSelection.length);
        }
    }
    exports.SurroundSelectionCommand = SurroundSelectionCommand;
    /**
     * A surround selection command that runs after composition finished.
     */
    class CompositionSurroundSelectionCommand {
        constructor(_position, _text, _charAfter) {
            this._position = _position;
            this._text = _text;
            this._charAfter = _charAfter;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(new range_1.Range(this._position.lineNumber, this._position.column, this._position.lineNumber, this._position.column), this._text + this._charAfter);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const opRange = inverseEditOperations[0].range;
            return new selection_1.Selection(opRange.endLineNumber, opRange.startColumn, opRange.endLineNumber, opRange.endColumn - this._charAfter.length);
        }
    }
    exports.CompositionSurroundSelectionCommand = CompositionSurroundSelectionCommand;
});
//# sourceMappingURL=surroundSelectionCommand.js.map