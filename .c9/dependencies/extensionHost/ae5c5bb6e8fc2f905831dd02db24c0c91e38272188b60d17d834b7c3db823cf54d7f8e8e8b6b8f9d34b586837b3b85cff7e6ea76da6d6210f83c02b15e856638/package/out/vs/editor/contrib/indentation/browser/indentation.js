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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/commands/shiftCommand", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/core/selection", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/model", "vs/editor/contrib/indentation/browser/indentUtils", "vs/nls", "vs/platform/quickinput/common/quickInput", "vs/editor/common/core/indentation", "vs/editor/common/languages/autoIndent"], function (require, exports, lifecycle_1, strings, editorExtensions_1, shiftCommand_1, editOperation_1, range_1, selection_1, editorContextKeys_1, languageConfigurationRegistry_1, model_1, indentUtils, nls, quickInput_1, indentation_1, autoIndent_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndentationToTabsCommand = exports.IndentationToSpacesCommand = exports.AutoIndentOnPaste = exports.AutoIndentOnPasteCommand = exports.ReindentSelectedLinesAction = exports.ReindentLinesAction = exports.DetectIndentation = exports.IndentUsingSpaces = exports.IndentUsingTabs = exports.ChangeIndentationSizeAction = exports.IndentationToTabsAction = exports.IndentationToSpacesAction = exports.getReindentEditOperations = void 0;
    function getReindentEditOperations(model, languageConfigurationService, startLineNumber, endLineNumber, inheritedIndent) {
        if (model.getLineCount() === 1 && model.getLineMaxColumn(1) === 1) {
            // Model is empty
            return [];
        }
        const indentationRules = languageConfigurationService.getLanguageConfiguration(model.getLanguageId()).indentationRules;
        if (!indentationRules) {
            return [];
        }
        endLineNumber = Math.min(endLineNumber, model.getLineCount());
        // Skip `unIndentedLinePattern` lines
        while (startLineNumber <= endLineNumber) {
            if (!indentationRules.unIndentedLinePattern) {
                break;
            }
            let text = model.getLineContent(startLineNumber);
            if (!indentationRules.unIndentedLinePattern.test(text)) {
                break;
            }
            startLineNumber++;
        }
        if (startLineNumber > endLineNumber - 1) {
            return [];
        }
        const { tabSize, indentSize, insertSpaces } = model.getOptions();
        const shiftIndent = (indentation, count) => {
            count = count || 1;
            return shiftCommand_1.ShiftCommand.shiftIndent(indentation, indentation.length + count, tabSize, indentSize, insertSpaces);
        };
        const unshiftIndent = (indentation, count) => {
            count = count || 1;
            return shiftCommand_1.ShiftCommand.unshiftIndent(indentation, indentation.length + count, tabSize, indentSize, insertSpaces);
        };
        let indentEdits = [];
        // indentation being passed to lines below
        let globalIndent;
        // Calculate indentation for the first line
        // If there is no passed-in indentation, we use the indentation of the first line as base.
        let currentLineText = model.getLineContent(startLineNumber);
        let adjustedLineContent = currentLineText;
        if (inheritedIndent !== undefined && inheritedIndent !== null) {
            globalIndent = inheritedIndent;
            let oldIndentation = strings.getLeadingWhitespace(currentLineText);
            adjustedLineContent = globalIndent + currentLineText.substring(oldIndentation.length);
            if (indentationRules.decreaseIndentPattern && indentationRules.decreaseIndentPattern.test(adjustedLineContent)) {
                globalIndent = unshiftIndent(globalIndent);
                adjustedLineContent = globalIndent + currentLineText.substring(oldIndentation.length);
            }
            if (currentLineText !== adjustedLineContent) {
                indentEdits.push(editOperation_1.EditOperation.replaceMove(new selection_1.Selection(startLineNumber, 1, startLineNumber, oldIndentation.length + 1), (0, indentation_1.normalizeIndentation)(globalIndent, indentSize, insertSpaces)));
            }
        }
        else {
            globalIndent = strings.getLeadingWhitespace(currentLineText);
        }
        // idealIndentForNextLine doesn't equal globalIndent when there is a line matching `indentNextLinePattern`.
        let idealIndentForNextLine = globalIndent;
        if (indentationRules.increaseIndentPattern && indentationRules.increaseIndentPattern.test(adjustedLineContent)) {
            idealIndentForNextLine = shiftIndent(idealIndentForNextLine);
            globalIndent = shiftIndent(globalIndent);
        }
        else if (indentationRules.indentNextLinePattern && indentationRules.indentNextLinePattern.test(adjustedLineContent)) {
            idealIndentForNextLine = shiftIndent(idealIndentForNextLine);
        }
        startLineNumber++;
        // Calculate indentation adjustment for all following lines
        for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
            let text = model.getLineContent(lineNumber);
            let oldIndentation = strings.getLeadingWhitespace(text);
            let adjustedLineContent = idealIndentForNextLine + text.substring(oldIndentation.length);
            if (indentationRules.decreaseIndentPattern && indentationRules.decreaseIndentPattern.test(adjustedLineContent)) {
                idealIndentForNextLine = unshiftIndent(idealIndentForNextLine);
                globalIndent = unshiftIndent(globalIndent);
            }
            if (oldIndentation !== idealIndentForNextLine) {
                indentEdits.push(editOperation_1.EditOperation.replaceMove(new selection_1.Selection(lineNumber, 1, lineNumber, oldIndentation.length + 1), (0, indentation_1.normalizeIndentation)(idealIndentForNextLine, indentSize, insertSpaces)));
            }
            // calculate idealIndentForNextLine
            if (indentationRules.unIndentedLinePattern && indentationRules.unIndentedLinePattern.test(text)) {
                // In reindent phase, if the line matches `unIndentedLinePattern` we inherit indentation from above lines
                // but don't change globalIndent and idealIndentForNextLine.
                continue;
            }
            else if (indentationRules.increaseIndentPattern && indentationRules.increaseIndentPattern.test(adjustedLineContent)) {
                globalIndent = shiftIndent(globalIndent);
                idealIndentForNextLine = globalIndent;
            }
            else if (indentationRules.indentNextLinePattern && indentationRules.indentNextLinePattern.test(adjustedLineContent)) {
                idealIndentForNextLine = shiftIndent(idealIndentForNextLine);
            }
            else {
                idealIndentForNextLine = globalIndent;
            }
        }
        return indentEdits;
    }
    exports.getReindentEditOperations = getReindentEditOperations;
    class IndentationToSpacesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: IndentationToSpacesAction.ID,
                label: nls.localize('indentationToSpaces', "Convert Indentation to Spaces"),
                alias: 'Convert Indentation to Spaces',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        run(accessor, editor) {
            let model = editor.getModel();
            if (!model) {
                return;
            }
            let modelOpts = model.getOptions();
            let selection = editor.getSelection();
            if (!selection) {
                return;
            }
            const command = new IndentationToSpacesCommand(selection, modelOpts.tabSize);
            editor.pushUndoStop();
            editor.executeCommands(this.id, [command]);
            editor.pushUndoStop();
            model.updateOptions({
                insertSpaces: true
            });
        }
    }
    exports.IndentationToSpacesAction = IndentationToSpacesAction;
    IndentationToSpacesAction.ID = 'editor.action.indentationToSpaces';
    class IndentationToTabsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: IndentationToTabsAction.ID,
                label: nls.localize('indentationToTabs', "Convert Indentation to Tabs"),
                alias: 'Convert Indentation to Tabs',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        run(accessor, editor) {
            let model = editor.getModel();
            if (!model) {
                return;
            }
            let modelOpts = model.getOptions();
            let selection = editor.getSelection();
            if (!selection) {
                return;
            }
            const command = new IndentationToTabsCommand(selection, modelOpts.tabSize);
            editor.pushUndoStop();
            editor.executeCommands(this.id, [command]);
            editor.pushUndoStop();
            model.updateOptions({
                insertSpaces: false
            });
        }
    }
    exports.IndentationToTabsAction = IndentationToTabsAction;
    IndentationToTabsAction.ID = 'editor.action.indentationToTabs';
    class ChangeIndentationSizeAction extends editorExtensions_1.EditorAction {
        constructor(insertSpaces, opts) {
            super(opts);
            this.insertSpaces = insertSpaces;
        }
        run(accessor, editor) {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const modelService = accessor.get(model_1.IModelService);
            let model = editor.getModel();
            if (!model) {
                return;
            }
            const creationOpts = modelService.getCreationOptions(model.getLanguageId(), model.uri, model.isForSimpleWidget);
            const picks = [1, 2, 3, 4, 5, 6, 7, 8].map(n => ({
                id: n.toString(),
                label: n.toString(),
                // add description for tabSize value set in the configuration
                description: n === creationOpts.tabSize ? nls.localize('configuredTabSize', "Configured Tab Size") : undefined
            }));
            // auto focus the tabSize set for the current editor
            const autoFocusIndex = Math.min(model.getOptions().tabSize - 1, 7);
            setTimeout(() => {
                quickInputService.pick(picks, { placeHolder: nls.localize({ key: 'selectTabWidth', comment: ['Tab corresponds to the tab key'] }, "Select Tab Size for Current File"), activeItem: picks[autoFocusIndex] }).then(pick => {
                    if (pick) {
                        if (model && !model.isDisposed()) {
                            model.updateOptions({
                                tabSize: parseInt(pick.label, 10),
                                insertSpaces: this.insertSpaces
                            });
                        }
                    }
                });
            }, 50 /* quick input is sensitive to being opened so soon after another */);
        }
    }
    exports.ChangeIndentationSizeAction = ChangeIndentationSizeAction;
    class IndentUsingTabs extends ChangeIndentationSizeAction {
        constructor() {
            super(false, {
                id: IndentUsingTabs.ID,
                label: nls.localize('indentUsingTabs', "Indent Using Tabs"),
                alias: 'Indent Using Tabs',
                precondition: undefined
            });
        }
    }
    exports.IndentUsingTabs = IndentUsingTabs;
    IndentUsingTabs.ID = 'editor.action.indentUsingTabs';
    class IndentUsingSpaces extends ChangeIndentationSizeAction {
        constructor() {
            super(true, {
                id: IndentUsingSpaces.ID,
                label: nls.localize('indentUsingSpaces', "Indent Using Spaces"),
                alias: 'Indent Using Spaces',
                precondition: undefined
            });
        }
    }
    exports.IndentUsingSpaces = IndentUsingSpaces;
    IndentUsingSpaces.ID = 'editor.action.indentUsingSpaces';
    class DetectIndentation extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: DetectIndentation.ID,
                label: nls.localize('detectIndentation', "Detect Indentation from Content"),
                alias: 'Detect Indentation from Content',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            const modelService = accessor.get(model_1.IModelService);
            let model = editor.getModel();
            if (!model) {
                return;
            }
            const creationOpts = modelService.getCreationOptions(model.getLanguageId(), model.uri, model.isForSimpleWidget);
            model.detectIndentation(creationOpts.insertSpaces, creationOpts.tabSize);
        }
    }
    exports.DetectIndentation = DetectIndentation;
    DetectIndentation.ID = 'editor.action.detectIndentation';
    class ReindentLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.reindentlines',
                label: nls.localize('editor.reindentlines', "Reindent Lines"),
                alias: 'Reindent Lines',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        run(accessor, editor) {
            const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            let model = editor.getModel();
            if (!model) {
                return;
            }
            let edits = getReindentEditOperations(model, languageConfigurationService, 1, model.getLineCount());
            if (edits.length > 0) {
                editor.pushUndoStop();
                editor.executeEdits(this.id, edits);
                editor.pushUndoStop();
            }
        }
    }
    exports.ReindentLinesAction = ReindentLinesAction;
    class ReindentSelectedLinesAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.reindentselectedlines',
                label: nls.localize('editor.reindentselectedlines', "Reindent Selected Lines"),
                alias: 'Reindent Selected Lines',
                precondition: editorContextKeys_1.EditorContextKeys.writable
            });
        }
        run(accessor, editor) {
            const languageConfigurationService = accessor.get(languageConfigurationRegistry_1.ILanguageConfigurationService);
            let model = editor.getModel();
            if (!model) {
                return;
            }
            let selections = editor.getSelections();
            if (selections === null) {
                return;
            }
            let edits = [];
            for (let selection of selections) {
                let startLineNumber = selection.startLineNumber;
                let endLineNumber = selection.endLineNumber;
                if (startLineNumber !== endLineNumber && selection.endColumn === 1) {
                    endLineNumber--;
                }
                if (startLineNumber === 1) {
                    if (startLineNumber === endLineNumber) {
                        continue;
                    }
                }
                else {
                    startLineNumber--;
                }
                let editOperations = getReindentEditOperations(model, languageConfigurationService, startLineNumber, endLineNumber);
                edits.push(...editOperations);
            }
            if (edits.length > 0) {
                editor.pushUndoStop();
                editor.executeEdits(this.id, edits);
                editor.pushUndoStop();
            }
        }
    }
    exports.ReindentSelectedLinesAction = ReindentSelectedLinesAction;
    class AutoIndentOnPasteCommand {
        constructor(edits, initialSelection) {
            this._initialSelection = initialSelection;
            this._edits = [];
            this._selectionId = null;
            for (let edit of edits) {
                if (edit.range && typeof edit.text === 'string') {
                    this._edits.push(edit);
                }
            }
        }
        getEditOperations(model, builder) {
            for (let edit of this._edits) {
                builder.addEditOperation(range_1.Range.lift(edit.range), edit.text);
            }
            let selectionIsSet = false;
            if (Array.isArray(this._edits) && this._edits.length === 1 && this._initialSelection.isEmpty()) {
                if (this._edits[0].range.startColumn === this._initialSelection.endColumn &&
                    this._edits[0].range.startLineNumber === this._initialSelection.endLineNumber) {
                    selectionIsSet = true;
                    this._selectionId = builder.trackSelection(this._initialSelection, true);
                }
                else if (this._edits[0].range.endColumn === this._initialSelection.startColumn &&
                    this._edits[0].range.endLineNumber === this._initialSelection.startLineNumber) {
                    selectionIsSet = true;
                    this._selectionId = builder.trackSelection(this._initialSelection, false);
                }
            }
            if (!selectionIsSet) {
                this._selectionId = builder.trackSelection(this._initialSelection);
            }
        }
        computeCursorState(model, helper) {
            return helper.getTrackedSelection(this._selectionId);
        }
    }
    exports.AutoIndentOnPasteCommand = AutoIndentOnPasteCommand;
    let AutoIndentOnPaste = class AutoIndentOnPaste {
        constructor(editor, _languageConfigurationService) {
            this.editor = editor;
            this._languageConfigurationService = _languageConfigurationService;
            this.callOnDispose = new lifecycle_1.DisposableStore();
            this.callOnModel = new lifecycle_1.DisposableStore();
            this.callOnDispose.add(editor.onDidChangeConfiguration(() => this.update()));
            this.callOnDispose.add(editor.onDidChangeModel(() => this.update()));
            this.callOnDispose.add(editor.onDidChangeModelLanguage(() => this.update()));
        }
        update() {
            // clean up
            this.callOnModel.clear();
            // we are disabled
            if (this.editor.getOption(9 /* EditorOption.autoIndent */) < 4 /* EditorAutoIndentStrategy.Full */ || this.editor.getOption(48 /* EditorOption.formatOnPaste */)) {
                return;
            }
            // no model
            if (!this.editor.hasModel()) {
                return;
            }
            this.callOnModel.add(this.editor.onDidPaste(({ range }) => {
                this.trigger(range);
            }));
        }
        trigger(range) {
            let selections = this.editor.getSelections();
            if (selections === null || selections.length > 1) {
                return;
            }
            const model = this.editor.getModel();
            if (!model) {
                return;
            }
            if (!model.tokenization.isCheapToTokenize(range.getStartPosition().lineNumber)) {
                return;
            }
            const autoIndent = this.editor.getOption(9 /* EditorOption.autoIndent */);
            const { tabSize, indentSize, insertSpaces } = model.getOptions();
            let textEdits = [];
            let indentConverter = {
                shiftIndent: (indentation) => {
                    return shiftCommand_1.ShiftCommand.shiftIndent(indentation, indentation.length + 1, tabSize, indentSize, insertSpaces);
                },
                unshiftIndent: (indentation) => {
                    return shiftCommand_1.ShiftCommand.unshiftIndent(indentation, indentation.length + 1, tabSize, indentSize, insertSpaces);
                }
            };
            let startLineNumber = range.startLineNumber;
            while (startLineNumber <= range.endLineNumber) {
                if (this.shouldIgnoreLine(model, startLineNumber)) {
                    startLineNumber++;
                    continue;
                }
                break;
            }
            if (startLineNumber > range.endLineNumber) {
                return;
            }
            let firstLineText = model.getLineContent(startLineNumber);
            if (!/\S/.test(firstLineText.substring(0, range.startColumn - 1))) {
                const indentOfFirstLine = (0, autoIndent_1.getGoodIndentForLine)(autoIndent, model, model.getLanguageId(), startLineNumber, indentConverter, this._languageConfigurationService);
                if (indentOfFirstLine !== null) {
                    let oldIndentation = strings.getLeadingWhitespace(firstLineText);
                    let newSpaceCnt = indentUtils.getSpaceCnt(indentOfFirstLine, tabSize);
                    let oldSpaceCnt = indentUtils.getSpaceCnt(oldIndentation, tabSize);
                    if (newSpaceCnt !== oldSpaceCnt) {
                        let newIndent = indentUtils.generateIndent(newSpaceCnt, tabSize, insertSpaces);
                        textEdits.push({
                            range: new range_1.Range(startLineNumber, 1, startLineNumber, oldIndentation.length + 1),
                            text: newIndent
                        });
                        firstLineText = newIndent + firstLineText.substr(oldIndentation.length);
                    }
                    else {
                        let indentMetadata = (0, autoIndent_1.getIndentMetadata)(model, startLineNumber, this._languageConfigurationService);
                        if (indentMetadata === 0 || indentMetadata === 8 /* IndentConsts.UNINDENT_MASK */) {
                            // we paste content into a line where only contains whitespaces
                            // after pasting, the indentation of the first line is already correct
                            // the first line doesn't match any indentation rule
                            // then no-op.
                            return;
                        }
                    }
                }
            }
            const firstLineNumber = startLineNumber;
            // ignore empty or ignored lines
            while (startLineNumber < range.endLineNumber) {
                if (!/\S/.test(model.getLineContent(startLineNumber + 1))) {
                    startLineNumber++;
                    continue;
                }
                break;
            }
            if (startLineNumber !== range.endLineNumber) {
                let virtualModel = {
                    tokenization: {
                        getLineTokens: (lineNumber) => {
                            return model.tokenization.getLineTokens(lineNumber);
                        },
                        getLanguageId: () => {
                            return model.getLanguageId();
                        },
                        getLanguageIdAtPosition: (lineNumber, column) => {
                            return model.getLanguageIdAtPosition(lineNumber, column);
                        },
                    },
                    getLineContent: (lineNumber) => {
                        if (lineNumber === firstLineNumber) {
                            return firstLineText;
                        }
                        else {
                            return model.getLineContent(lineNumber);
                        }
                    }
                };
                let indentOfSecondLine = (0, autoIndent_1.getGoodIndentForLine)(autoIndent, virtualModel, model.getLanguageId(), startLineNumber + 1, indentConverter, this._languageConfigurationService);
                if (indentOfSecondLine !== null) {
                    let newSpaceCntOfSecondLine = indentUtils.getSpaceCnt(indentOfSecondLine, tabSize);
                    let oldSpaceCntOfSecondLine = indentUtils.getSpaceCnt(strings.getLeadingWhitespace(model.getLineContent(startLineNumber + 1)), tabSize);
                    if (newSpaceCntOfSecondLine !== oldSpaceCntOfSecondLine) {
                        let spaceCntOffset = newSpaceCntOfSecondLine - oldSpaceCntOfSecondLine;
                        for (let i = startLineNumber + 1; i <= range.endLineNumber; i++) {
                            let lineContent = model.getLineContent(i);
                            let originalIndent = strings.getLeadingWhitespace(lineContent);
                            let originalSpacesCnt = indentUtils.getSpaceCnt(originalIndent, tabSize);
                            let newSpacesCnt = originalSpacesCnt + spaceCntOffset;
                            let newIndent = indentUtils.generateIndent(newSpacesCnt, tabSize, insertSpaces);
                            if (newIndent !== originalIndent) {
                                textEdits.push({
                                    range: new range_1.Range(i, 1, i, originalIndent.length + 1),
                                    text: newIndent
                                });
                            }
                        }
                    }
                }
            }
            if (textEdits.length > 0) {
                this.editor.pushUndoStop();
                let cmd = new AutoIndentOnPasteCommand(textEdits, this.editor.getSelection());
                this.editor.executeCommand('autoIndentOnPaste', cmd);
                this.editor.pushUndoStop();
            }
        }
        shouldIgnoreLine(model, lineNumber) {
            model.tokenization.forceTokenization(lineNumber);
            let nonWhitespaceColumn = model.getLineFirstNonWhitespaceColumn(lineNumber);
            if (nonWhitespaceColumn === 0) {
                return true;
            }
            let tokens = model.tokenization.getLineTokens(lineNumber);
            if (tokens.getCount() > 0) {
                let firstNonWhitespaceTokenIndex = tokens.findTokenIndexAtOffset(nonWhitespaceColumn);
                if (firstNonWhitespaceTokenIndex >= 0 && tokens.getStandardTokenType(firstNonWhitespaceTokenIndex) === 1 /* StandardTokenType.Comment */) {
                    return true;
                }
            }
            return false;
        }
        dispose() {
            this.callOnDispose.dispose();
            this.callOnModel.dispose();
        }
    };
    AutoIndentOnPaste.ID = 'editor.contrib.autoIndentOnPaste';
    AutoIndentOnPaste = __decorate([
        __param(1, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], AutoIndentOnPaste);
    exports.AutoIndentOnPaste = AutoIndentOnPaste;
    function getIndentationEditOperations(model, builder, tabSize, tabsToSpaces) {
        if (model.getLineCount() === 1 && model.getLineMaxColumn(1) === 1) {
            // Model is empty
            return;
        }
        let spaces = '';
        for (let i = 0; i < tabSize; i++) {
            spaces += ' ';
        }
        let spacesRegExp = new RegExp(spaces, 'gi');
        for (let lineNumber = 1, lineCount = model.getLineCount(); lineNumber <= lineCount; lineNumber++) {
            let lastIndentationColumn = model.getLineFirstNonWhitespaceColumn(lineNumber);
            if (lastIndentationColumn === 0) {
                lastIndentationColumn = model.getLineMaxColumn(lineNumber);
            }
            if (lastIndentationColumn === 1) {
                continue;
            }
            const originalIndentationRange = new range_1.Range(lineNumber, 1, lineNumber, lastIndentationColumn);
            const originalIndentation = model.getValueInRange(originalIndentationRange);
            const newIndentation = (tabsToSpaces
                ? originalIndentation.replace(/\t/ig, spaces)
                : originalIndentation.replace(spacesRegExp, '\t'));
            builder.addEditOperation(originalIndentationRange, newIndentation);
        }
    }
    class IndentationToSpacesCommand {
        constructor(selection, tabSize) {
            this.selection = selection;
            this.tabSize = tabSize;
            this.selectionId = null;
        }
        getEditOperations(model, builder) {
            this.selectionId = builder.trackSelection(this.selection);
            getIndentationEditOperations(model, builder, this.tabSize, true);
        }
        computeCursorState(model, helper) {
            return helper.getTrackedSelection(this.selectionId);
        }
    }
    exports.IndentationToSpacesCommand = IndentationToSpacesCommand;
    class IndentationToTabsCommand {
        constructor(selection, tabSize) {
            this.selection = selection;
            this.tabSize = tabSize;
            this.selectionId = null;
        }
        getEditOperations(model, builder) {
            this.selectionId = builder.trackSelection(this.selection);
            getIndentationEditOperations(model, builder, this.tabSize, false);
        }
        computeCursorState(model, helper) {
            return helper.getTrackedSelection(this.selectionId);
        }
    }
    exports.IndentationToTabsCommand = IndentationToTabsCommand;
    (0, editorExtensions_1.registerEditorContribution)(AutoIndentOnPaste.ID, AutoIndentOnPaste);
    (0, editorExtensions_1.registerEditorAction)(IndentationToSpacesAction);
    (0, editorExtensions_1.registerEditorAction)(IndentationToTabsAction);
    (0, editorExtensions_1.registerEditorAction)(IndentUsingTabs);
    (0, editorExtensions_1.registerEditorAction)(IndentUsingSpaces);
    (0, editorExtensions_1.registerEditorAction)(DetectIndentation);
    (0, editorExtensions_1.registerEditorAction)(ReindentLinesAction);
    (0, editorExtensions_1.registerEditorAction)(ReindentSelectedLinesAction);
});
//# sourceMappingURL=indentation.js.map