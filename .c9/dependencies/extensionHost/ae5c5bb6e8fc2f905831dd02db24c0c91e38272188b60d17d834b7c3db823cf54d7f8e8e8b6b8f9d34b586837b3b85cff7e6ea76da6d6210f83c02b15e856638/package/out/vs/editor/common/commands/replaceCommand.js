/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/selection"], function (require, exports, selection_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplaceCommandThatPreservesSelection = exports.ReplaceCommandWithOffsetCursorState = exports.ReplaceCommandWithoutChangingPosition = exports.ReplaceCommandThatSelectsText = exports.ReplaceCommand = void 0;
    class ReplaceCommand {
        constructor(range, text, insertsAutoWhitespace = false) {
            this._range = range;
            this._text = text;
            this.insertsAutoWhitespace = insertsAutoWhitespace;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(this._range, this._text);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const srcRange = inverseEditOperations[0].range;
            return selection_1.Selection.fromPositions(srcRange.getEndPosition());
        }
    }
    exports.ReplaceCommand = ReplaceCommand;
    class ReplaceCommandThatSelectsText {
        constructor(range, text) {
            this._range = range;
            this._text = text;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(this._range, this._text);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const srcRange = inverseEditOperations[0].range;
            return selection_1.Selection.fromRange(srcRange, 0 /* SelectionDirection.LTR */);
        }
    }
    exports.ReplaceCommandThatSelectsText = ReplaceCommandThatSelectsText;
    class ReplaceCommandWithoutChangingPosition {
        constructor(range, text, insertsAutoWhitespace = false) {
            this._range = range;
            this._text = text;
            this.insertsAutoWhitespace = insertsAutoWhitespace;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(this._range, this._text);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const srcRange = inverseEditOperations[0].range;
            return selection_1.Selection.fromPositions(srcRange.getStartPosition());
        }
    }
    exports.ReplaceCommandWithoutChangingPosition = ReplaceCommandWithoutChangingPosition;
    class ReplaceCommandWithOffsetCursorState {
        constructor(range, text, lineNumberDeltaOffset, columnDeltaOffset, insertsAutoWhitespace = false) {
            this._range = range;
            this._text = text;
            this._columnDeltaOffset = columnDeltaOffset;
            this._lineNumberDeltaOffset = lineNumberDeltaOffset;
            this.insertsAutoWhitespace = insertsAutoWhitespace;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(this._range, this._text);
        }
        computeCursorState(model, helper) {
            const inverseEditOperations = helper.getInverseEditOperations();
            const srcRange = inverseEditOperations[0].range;
            return selection_1.Selection.fromPositions(srcRange.getEndPosition().delta(this._lineNumberDeltaOffset, this._columnDeltaOffset));
        }
    }
    exports.ReplaceCommandWithOffsetCursorState = ReplaceCommandWithOffsetCursorState;
    class ReplaceCommandThatPreservesSelection {
        constructor(editRange, text, initialSelection, forceMoveMarkers = false) {
            this._range = editRange;
            this._text = text;
            this._initialSelection = initialSelection;
            this._forceMoveMarkers = forceMoveMarkers;
            this._selectionId = null;
        }
        getEditOperations(model, builder) {
            builder.addTrackedEditOperation(this._range, this._text, this._forceMoveMarkers);
            this._selectionId = builder.trackSelection(this._initialSelection);
        }
        computeCursorState(model, helper) {
            return helper.getTrackedSelection(this._selectionId);
        }
    }
    exports.ReplaceCommandThatPreservesSelection = ReplaceCommandThatPreservesSelection;
});
//# sourceMappingURL=replaceCommand.js.map