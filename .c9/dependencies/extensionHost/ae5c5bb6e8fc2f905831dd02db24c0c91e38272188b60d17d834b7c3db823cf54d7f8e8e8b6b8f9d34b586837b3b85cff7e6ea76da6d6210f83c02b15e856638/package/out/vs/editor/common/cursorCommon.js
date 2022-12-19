/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/languages/supports", "vs/editor/common/core/cursorColumns", "vs/editor/common/core/indentation"], function (require, exports, position_1, range_1, selection_1, supports_1, cursorColumns_1, indentation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isQuote = exports.EditOperationResult = exports.SingleCursorState = exports.PartialViewCursorState = exports.PartialModelCursorState = exports.CursorState = exports.CursorConfiguration = exports.EditOperationType = exports.RevealTarget = void 0;
    var RevealTarget;
    (function (RevealTarget) {
        RevealTarget[RevealTarget["Primary"] = 0] = "Primary";
        RevealTarget[RevealTarget["TopMost"] = 1] = "TopMost";
        RevealTarget[RevealTarget["BottomMost"] = 2] = "BottomMost";
    })(RevealTarget = exports.RevealTarget || (exports.RevealTarget = {}));
    /**
     * This is an operation type that will be recorded for undo/redo purposes.
     * The goal is to introduce an undo stop when the controller switches between different operation types.
     */
    var EditOperationType;
    (function (EditOperationType) {
        EditOperationType[EditOperationType["Other"] = 0] = "Other";
        EditOperationType[EditOperationType["DeletingLeft"] = 2] = "DeletingLeft";
        EditOperationType[EditOperationType["DeletingRight"] = 3] = "DeletingRight";
        EditOperationType[EditOperationType["TypingOther"] = 4] = "TypingOther";
        EditOperationType[EditOperationType["TypingFirstSpace"] = 5] = "TypingFirstSpace";
        EditOperationType[EditOperationType["TypingConsecutiveSpace"] = 6] = "TypingConsecutiveSpace";
    })(EditOperationType = exports.EditOperationType || (exports.EditOperationType = {}));
    const autoCloseAlways = () => true;
    const autoCloseNever = () => false;
    const autoCloseBeforeWhitespace = (chr) => (chr === ' ' || chr === '\t');
    class CursorConfiguration {
        constructor(languageId, modelOptions, configuration, languageConfigurationService) {
            this.languageConfigurationService = languageConfigurationService;
            this._cursorMoveConfigurationBrand = undefined;
            this._languageId = languageId;
            const options = configuration.options;
            const layoutInfo = options.get(131 /* EditorOption.layoutInfo */);
            this.readOnly = options.get(81 /* EditorOption.readOnly */);
            this.tabSize = modelOptions.tabSize;
            this.indentSize = modelOptions.indentSize;
            this.insertSpaces = modelOptions.insertSpaces;
            this.stickyTabStops = options.get(104 /* EditorOption.stickyTabStops */);
            this.lineHeight = options.get(59 /* EditorOption.lineHeight */);
            this.pageSize = Math.max(1, Math.floor(layoutInfo.height / this.lineHeight) - 2);
            this.useTabStops = options.get(116 /* EditorOption.useTabStops */);
            this.wordSeparators = options.get(117 /* EditorOption.wordSeparators */);
            this.emptySelectionClipboard = options.get(32 /* EditorOption.emptySelectionClipboard */);
            this.copyWithSyntaxHighlighting = options.get(21 /* EditorOption.copyWithSyntaxHighlighting */);
            this.multiCursorMergeOverlapping = options.get(69 /* EditorOption.multiCursorMergeOverlapping */);
            this.multiCursorPaste = options.get(71 /* EditorOption.multiCursorPaste */);
            this.autoClosingBrackets = options.get(5 /* EditorOption.autoClosingBrackets */);
            this.autoClosingQuotes = options.get(8 /* EditorOption.autoClosingQuotes */);
            this.autoClosingDelete = options.get(6 /* EditorOption.autoClosingDelete */);
            this.autoClosingOvertype = options.get(7 /* EditorOption.autoClosingOvertype */);
            this.autoSurround = options.get(11 /* EditorOption.autoSurround */);
            this.autoIndent = options.get(9 /* EditorOption.autoIndent */);
            this.surroundingPairs = {};
            this._electricChars = null;
            this.shouldAutoCloseBefore = {
                quote: this._getShouldAutoClose(languageId, this.autoClosingQuotes),
                bracket: this._getShouldAutoClose(languageId, this.autoClosingBrackets)
            };
            this.autoClosingPairs = this.languageConfigurationService.getLanguageConfiguration(languageId).getAutoClosingPairs();
            const surroundingPairs = this.languageConfigurationService.getLanguageConfiguration(languageId).getSurroundingPairs();
            if (surroundingPairs) {
                for (const pair of surroundingPairs) {
                    this.surroundingPairs[pair.open] = pair.close;
                }
            }
        }
        static shouldRecreate(e) {
            return (e.hasChanged(131 /* EditorOption.layoutInfo */)
                || e.hasChanged(117 /* EditorOption.wordSeparators */)
                || e.hasChanged(32 /* EditorOption.emptySelectionClipboard */)
                || e.hasChanged(69 /* EditorOption.multiCursorMergeOverlapping */)
                || e.hasChanged(71 /* EditorOption.multiCursorPaste */)
                || e.hasChanged(5 /* EditorOption.autoClosingBrackets */)
                || e.hasChanged(8 /* EditorOption.autoClosingQuotes */)
                || e.hasChanged(6 /* EditorOption.autoClosingDelete */)
                || e.hasChanged(7 /* EditorOption.autoClosingOvertype */)
                || e.hasChanged(11 /* EditorOption.autoSurround */)
                || e.hasChanged(116 /* EditorOption.useTabStops */)
                || e.hasChanged(59 /* EditorOption.lineHeight */)
                || e.hasChanged(81 /* EditorOption.readOnly */));
        }
        get electricChars() {
            var _a;
            if (!this._electricChars) {
                this._electricChars = {};
                const electricChars = (_a = this.languageConfigurationService.getLanguageConfiguration(this._languageId).electricCharacter) === null || _a === void 0 ? void 0 : _a.getElectricCharacters();
                if (electricChars) {
                    for (const char of electricChars) {
                        this._electricChars[char] = true;
                    }
                }
            }
            return this._electricChars;
        }
        /**
         * Should return opening bracket type to match indentation with
         */
        onElectricCharacter(character, context, column) {
            const scopedLineTokens = (0, supports_1.createScopedLineTokens)(context, column - 1);
            const electricCharacterSupport = this.languageConfigurationService.getLanguageConfiguration(scopedLineTokens.languageId).electricCharacter;
            if (!electricCharacterSupport) {
                return null;
            }
            return electricCharacterSupport.onElectricCharacter(character, scopedLineTokens, column - scopedLineTokens.firstCharOffset);
        }
        normalizeIndentation(str) {
            return (0, indentation_1.normalizeIndentation)(str, this.indentSize, this.insertSpaces);
        }
        _getShouldAutoClose(languageId, autoCloseConfig) {
            switch (autoCloseConfig) {
                case 'beforeWhitespace':
                    return autoCloseBeforeWhitespace;
                case 'languageDefined':
                    return this._getLanguageDefinedShouldAutoClose(languageId);
                case 'always':
                    return autoCloseAlways;
                case 'never':
                    return autoCloseNever;
            }
        }
        _getLanguageDefinedShouldAutoClose(languageId) {
            const autoCloseBeforeSet = this.languageConfigurationService.getLanguageConfiguration(languageId).getAutoCloseBeforeSet();
            return c => autoCloseBeforeSet.indexOf(c) !== -1;
        }
        /**
         * Returns a visible column from a column.
         * @see {@link CursorColumns}
         */
        visibleColumnFromColumn(model, position) {
            return cursorColumns_1.CursorColumns.visibleColumnFromColumn(model.getLineContent(position.lineNumber), position.column, this.tabSize);
        }
        /**
         * Returns a visible column from a column.
         * @see {@link CursorColumns}
         */
        columnFromVisibleColumn(model, lineNumber, visibleColumn) {
            const result = cursorColumns_1.CursorColumns.columnFromVisibleColumn(model.getLineContent(lineNumber), visibleColumn, this.tabSize);
            const minColumn = model.getLineMinColumn(lineNumber);
            if (result < minColumn) {
                return minColumn;
            }
            const maxColumn = model.getLineMaxColumn(lineNumber);
            if (result > maxColumn) {
                return maxColumn;
            }
            return result;
        }
    }
    exports.CursorConfiguration = CursorConfiguration;
    class CursorState {
        constructor(modelState, viewState) {
            this._cursorStateBrand = undefined;
            this.modelState = modelState;
            this.viewState = viewState;
        }
        static fromModelState(modelState) {
            return new PartialModelCursorState(modelState);
        }
        static fromViewState(viewState) {
            return new PartialViewCursorState(viewState);
        }
        static fromModelSelection(modelSelection) {
            const selection = selection_1.Selection.liftSelection(modelSelection);
            const modelState = new SingleCursorState(range_1.Range.fromPositions(selection.getSelectionStart()), 0, selection.getPosition(), 0);
            return CursorState.fromModelState(modelState);
        }
        static fromModelSelections(modelSelections) {
            const states = [];
            for (let i = 0, len = modelSelections.length; i < len; i++) {
                states[i] = this.fromModelSelection(modelSelections[i]);
            }
            return states;
        }
        equals(other) {
            return (this.viewState.equals(other.viewState) && this.modelState.equals(other.modelState));
        }
    }
    exports.CursorState = CursorState;
    class PartialModelCursorState {
        constructor(modelState) {
            this.modelState = modelState;
            this.viewState = null;
        }
    }
    exports.PartialModelCursorState = PartialModelCursorState;
    class PartialViewCursorState {
        constructor(viewState) {
            this.modelState = null;
            this.viewState = viewState;
        }
    }
    exports.PartialViewCursorState = PartialViewCursorState;
    /**
     * Represents the cursor state on either the model or on the view model.
     */
    class SingleCursorState {
        constructor(selectionStart, selectionStartLeftoverVisibleColumns, position, leftoverVisibleColumns) {
            this._singleCursorStateBrand = undefined;
            this.selectionStart = selectionStart;
            this.selectionStartLeftoverVisibleColumns = selectionStartLeftoverVisibleColumns;
            this.position = position;
            this.leftoverVisibleColumns = leftoverVisibleColumns;
            this.selection = SingleCursorState._computeSelection(this.selectionStart, this.position);
        }
        equals(other) {
            return (this.selectionStartLeftoverVisibleColumns === other.selectionStartLeftoverVisibleColumns
                && this.leftoverVisibleColumns === other.leftoverVisibleColumns
                && this.position.equals(other.position)
                && this.selectionStart.equalsRange(other.selectionStart));
        }
        hasSelection() {
            return (!this.selection.isEmpty() || !this.selectionStart.isEmpty());
        }
        move(inSelectionMode, lineNumber, column, leftoverVisibleColumns) {
            if (inSelectionMode) {
                // move just position
                return new SingleCursorState(this.selectionStart, this.selectionStartLeftoverVisibleColumns, new position_1.Position(lineNumber, column), leftoverVisibleColumns);
            }
            else {
                // move everything
                return new SingleCursorState(new range_1.Range(lineNumber, column, lineNumber, column), leftoverVisibleColumns, new position_1.Position(lineNumber, column), leftoverVisibleColumns);
            }
        }
        static _computeSelection(selectionStart, position) {
            if (selectionStart.isEmpty() || !position.isBeforeOrEqual(selectionStart.getStartPosition())) {
                return selection_1.Selection.fromPositions(selectionStart.getStartPosition(), position);
            }
            else {
                return selection_1.Selection.fromPositions(selectionStart.getEndPosition(), position);
            }
        }
    }
    exports.SingleCursorState = SingleCursorState;
    class EditOperationResult {
        constructor(type, commands, opts) {
            this._editOperationResultBrand = undefined;
            this.type = type;
            this.commands = commands;
            this.shouldPushStackElementBefore = opts.shouldPushStackElementBefore;
            this.shouldPushStackElementAfter = opts.shouldPushStackElementAfter;
        }
    }
    exports.EditOperationResult = EditOperationResult;
    function isQuote(ch) {
        return (ch === '\'' || ch === '"' || ch === '`');
    }
    exports.isQuote = isQuote;
});
//# sourceMappingURL=cursorCommon.js.map