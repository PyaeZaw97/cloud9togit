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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/map", "vs/base/common/mime", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/files/common/files", "vs/platform/remote/common/remoteAuthorityResolver"], function (require, exports, arrays_1, errors_1, htmlContent_1, map_1, mime_1, strings_1, types_1, uri_1, uuid_1, files_1, remoteAuthorityResolver_1) {
    "use strict";
    var _Disposable_callOnDispose, _MarkdownString_delegate, _a, _NotebookCellOutputItem_encoder;
    var Disposable_1, Position_1, Range_1, Selection_1, TextEdit_1, SnippetString_1, Location_1, SymbolInformation_1, DocumentSymbol_1, CodeActionKind_1, MarkdownString_1, TaskGroup_1, Task_1, FileSystemError_1, TestMessage_1, FileCoverage_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalEditorTabInput = exports.NotebookDiffEditorTabInput = exports.NotebookEditorTabInput = exports.WebviewEditorTabInput = exports.CustomEditorTabInput = exports.TextDiffTabInput = exports.TextTabInput = exports.TypeHierarchyItem = exports.PortAutoForwardAction = exports.WorkspaceTrustState = exports.ExternalUriOpenerPriority = exports.FunctionCoverage = exports.BranchCoverage = exports.StatementCoverage = exports.FileCoverage = exports.CoveredCount = exports.TestTag = exports.TestMessage = exports.TestRunRequest = exports.TestRunProfileKind = exports.TestResultState = exports.PortAttributes = exports.LinkedEditingRanges = exports.StandardTokenType = exports.ExtensionRuntime = exports.ExtensionMode = exports.TimelineItem = exports.NotebookRendererScript = exports.NotebookControllerAffinity = exports.NotebookCellStatusBarItem = exports.NotebookEditorRevealType = exports.NotebookCellStatusBarAlignment = exports.NotebookCellExecutionState = exports.NotebookCellKind = exports.NotebookCellOutput = exports.NotebookCellOutputItem = exports.NotebookData = exports.NotebookCellData = exports.NotebookRange = exports.ColorThemeKind = exports.ColorTheme = exports.FileDecoration = exports.ExtensionKind = exports.InputBoxValidationSeverity = exports.QuickPickItemKind = exports.QuickInputButtons = exports.DebugConsoleMode = exports.SemanticTokensEdits = exports.SemanticTokensEdit = exports.SemanticTokens = exports.SemanticTokensBuilder = exports.SemanticTokensLegend = exports.CommentThreadState = exports.CommentMode = exports.CommentThreadCollapsibleState = exports.FoldingRangeKind = exports.FoldingRange = exports.FileSystemError = exports.FileChangeType = exports.InlineValueContext = exports.InlineValueEvaluatableExpression = exports.InlineValueVariableLookup = exports.InlineValueText = exports.InlineCompletionTriggerKindNew = exports.InlineCompletionTriggerKind = exports.EvaluatableExpression = exports.DebugAdapterInlineImplementation = exports.DebugAdapterNamedPipeServer = exports.DebugAdapterServer = exports.DebugAdapterExecutable = exports.DataBreakpoint = exports.FunctionBreakpoint = exports.SourceBreakpoint = exports.Breakpoint = exports.RelativePattern = exports.ConfigurationTarget = exports.ThemeColor = exports.ThemeIcon = exports.DataTransfer = exports.DataTransferItem = exports.TreeItemCollapsibleState = exports.TreeItem = exports.ProgressLocation = exports.Task = exports.CustomExecution = exports.TaskScope = exports.ShellQuoting = exports.ShellExecution = exports.ProcessExecution = exports.TaskGroup = exports.TaskPanelKind = exports.TaskRevealKind = exports.TerminalProfile = exports.TerminalLocation = exports.TerminalLink = exports.SourceControlInputBoxValidationType = exports.ColorFormat = exports.ColorPresentation = exports.ColorInformation = exports.Color = exports.DocumentLink = exports.DecorationRangeBehavior = exports.TextDocumentChangeReason = exports.TextEditorSelectionChangeKind = exports.TextEditorRevealType = exports.TextDocumentSaveReason = exports.TextEditorLineNumbersStyle = exports.StatusBarAlignment = exports.ViewColumn = exports.InlineSuggestionsNew = exports.InlineSuggestionNew = exports.InlineSuggestions = exports.InlineSuggestion = exports.CompletionList = exports.CompletionItem = exports.CompletionItemTag = exports.CompletionItemKind = exports.CompletionTriggerKind = exports.InlayHint = exports.InlayHintLabelPart = exports.InlayHintKind = exports.SignatureHelpTriggerKind = exports.SignatureHelp = exports.SignatureInformation = exports.ParameterInformation = exports.MarkdownString = exports.CodeLens = exports.LanguageStatusSeverity = exports.CallHierarchyOutgoingCall = exports.CallHierarchyIncomingCall = exports.CallHierarchyItem = exports.SelectionRange = exports.CodeActionKind = exports.CodeAction = exports.CodeActionTriggerKind = exports.DocumentSymbol = exports.SymbolInformation = exports.SymbolTag = exports.SymbolKind = exports.DocumentHighlight = exports.DocumentHighlightKind = exports.Hover = exports.Diagnostic = exports.DiagnosticRelatedInformation = exports.Location = exports.DiagnosticSeverity = exports.DiagnosticTag = exports.SnippetString = exports.WorkspaceEdit = exports.FileEditType = exports.SnippetTextEdit = exports.TextEdit = exports.EnvironmentVariableMutatorType = exports.EndOfLine = exports.RemoteAuthorityResolverError = exports.ResolvedAuthority = exports.Selection = exports.Range = exports.Position = exports.Disposable = void 0;
    function es5ClassCompat(target) {
        ///@ts-expect-error
        function _() { return Reflect.construct(target, arguments, this.constructor); }
        Object.defineProperty(_, 'name', Object.getOwnPropertyDescriptor(target, 'name'));
        Object.setPrototypeOf(_, target);
        Object.setPrototypeOf(_.prototype, target.prototype);
        return _;
    }
    let Disposable = Disposable_1 = class Disposable {
        constructor(callOnDispose) {
            _Disposable_callOnDispose.set(this, void 0);
            __classPrivateFieldSet(this, _Disposable_callOnDispose, callOnDispose, "f");
        }
        static from(...inDisposables) {
            let disposables = inDisposables;
            return new Disposable_1(function () {
                if (disposables) {
                    for (const disposable of disposables) {
                        if (disposable && typeof disposable.dispose === 'function') {
                            disposable.dispose();
                        }
                    }
                    disposables = undefined;
                }
            });
        }
        dispose() {
            if (typeof __classPrivateFieldGet(this, _Disposable_callOnDispose, "f") === 'function') {
                __classPrivateFieldGet(this, _Disposable_callOnDispose, "f").call(this);
                __classPrivateFieldSet(this, _Disposable_callOnDispose, undefined, "f");
            }
        }
    };
    _Disposable_callOnDispose = new WeakMap();
    Disposable = Disposable_1 = __decorate([
        es5ClassCompat
    ], Disposable);
    exports.Disposable = Disposable;
    let Position = Position_1 = class Position {
        constructor(line, character) {
            if (line < 0) {
                throw (0, errors_1.illegalArgument)('line must be non-negative');
            }
            if (character < 0) {
                throw (0, errors_1.illegalArgument)('character must be non-negative');
            }
            this._line = line;
            this._character = character;
        }
        static Min(...positions) {
            if (positions.length === 0) {
                throw new TypeError();
            }
            let result = positions[0];
            for (let i = 1; i < positions.length; i++) {
                const p = positions[i];
                if (p.isBefore(result)) {
                    result = p;
                }
            }
            return result;
        }
        static Max(...positions) {
            if (positions.length === 0) {
                throw new TypeError();
            }
            let result = positions[0];
            for (let i = 1; i < positions.length; i++) {
                const p = positions[i];
                if (p.isAfter(result)) {
                    result = p;
                }
            }
            return result;
        }
        static isPosition(other) {
            if (!other) {
                return false;
            }
            if (other instanceof Position_1) {
                return true;
            }
            let { line, character } = other;
            if (typeof line === 'number' && typeof character === 'number') {
                return true;
            }
            return false;
        }
        static of(obj) {
            if (obj instanceof Position_1) {
                return obj;
            }
            else if (this.isPosition(obj)) {
                return new Position_1(obj.line, obj.character);
            }
            throw new Error('Invalid argument, is NOT a position-like object');
        }
        get line() {
            return this._line;
        }
        get character() {
            return this._character;
        }
        isBefore(other) {
            if (this._line < other._line) {
                return true;
            }
            if (other._line < this._line) {
                return false;
            }
            return this._character < other._character;
        }
        isBeforeOrEqual(other) {
            if (this._line < other._line) {
                return true;
            }
            if (other._line < this._line) {
                return false;
            }
            return this._character <= other._character;
        }
        isAfter(other) {
            return !this.isBeforeOrEqual(other);
        }
        isAfterOrEqual(other) {
            return !this.isBefore(other);
        }
        isEqual(other) {
            return this._line === other._line && this._character === other._character;
        }
        compareTo(other) {
            if (this._line < other._line) {
                return -1;
            }
            else if (this._line > other.line) {
                return 1;
            }
            else {
                // equal line
                if (this._character < other._character) {
                    return -1;
                }
                else if (this._character > other._character) {
                    return 1;
                }
                else {
                    // equal line and character
                    return 0;
                }
            }
        }
        translate(lineDeltaOrChange, characterDelta = 0) {
            if (lineDeltaOrChange === null || characterDelta === null) {
                throw (0, errors_1.illegalArgument)();
            }
            let lineDelta;
            if (typeof lineDeltaOrChange === 'undefined') {
                lineDelta = 0;
            }
            else if (typeof lineDeltaOrChange === 'number') {
                lineDelta = lineDeltaOrChange;
            }
            else {
                lineDelta = typeof lineDeltaOrChange.lineDelta === 'number' ? lineDeltaOrChange.lineDelta : 0;
                characterDelta = typeof lineDeltaOrChange.characterDelta === 'number' ? lineDeltaOrChange.characterDelta : 0;
            }
            if (lineDelta === 0 && characterDelta === 0) {
                return this;
            }
            return new Position_1(this.line + lineDelta, this.character + characterDelta);
        }
        with(lineOrChange, character = this.character) {
            if (lineOrChange === null || character === null) {
                throw (0, errors_1.illegalArgument)();
            }
            let line;
            if (typeof lineOrChange === 'undefined') {
                line = this.line;
            }
            else if (typeof lineOrChange === 'number') {
                line = lineOrChange;
            }
            else {
                line = typeof lineOrChange.line === 'number' ? lineOrChange.line : this.line;
                character = typeof lineOrChange.character === 'number' ? lineOrChange.character : this.character;
            }
            if (line === this.line && character === this.character) {
                return this;
            }
            return new Position_1(line, character);
        }
        toJSON() {
            return { line: this.line, character: this.character };
        }
    };
    Position = Position_1 = __decorate([
        es5ClassCompat
    ], Position);
    exports.Position = Position;
    let Range = Range_1 = class Range {
        constructor(startLineOrStart, startColumnOrEnd, endLine, endColumn) {
            let start;
            let end;
            if (typeof startLineOrStart === 'number' && typeof startColumnOrEnd === 'number' && typeof endLine === 'number' && typeof endColumn === 'number') {
                start = new Position(startLineOrStart, startColumnOrEnd);
                end = new Position(endLine, endColumn);
            }
            else if (Position.isPosition(startLineOrStart) && Position.isPosition(startColumnOrEnd)) {
                start = Position.of(startLineOrStart);
                end = Position.of(startColumnOrEnd);
            }
            if (!start || !end) {
                throw new Error('Invalid arguments');
            }
            if (start.isBefore(end)) {
                this._start = start;
                this._end = end;
            }
            else {
                this._start = end;
                this._end = start;
            }
        }
        static isRange(thing) {
            if (thing instanceof Range_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Position.isPosition(thing.start)
                && Position.isPosition(thing.end);
        }
        static of(obj) {
            if (obj instanceof Range_1) {
                return obj;
            }
            if (this.isRange(obj)) {
                return new Range_1(obj.start, obj.end);
            }
            throw new Error('Invalid argument, is NOT a range-like object');
        }
        get start() {
            return this._start;
        }
        get end() {
            return this._end;
        }
        contains(positionOrRange) {
            if (Range_1.isRange(positionOrRange)) {
                return this.contains(positionOrRange.start)
                    && this.contains(positionOrRange.end);
            }
            else if (Position.isPosition(positionOrRange)) {
                if (Position.of(positionOrRange).isBefore(this._start)) {
                    return false;
                }
                if (this._end.isBefore(positionOrRange)) {
                    return false;
                }
                return true;
            }
            return false;
        }
        isEqual(other) {
            return this._start.isEqual(other._start) && this._end.isEqual(other._end);
        }
        intersection(other) {
            const start = Position.Max(other.start, this._start);
            const end = Position.Min(other.end, this._end);
            if (start.isAfter(end)) {
                // this happens when there is no overlap:
                // |-----|
                //          |----|
                return undefined;
            }
            return new Range_1(start, end);
        }
        union(other) {
            if (this.contains(other)) {
                return this;
            }
            else if (other.contains(this)) {
                return other;
            }
            const start = Position.Min(other.start, this._start);
            const end = Position.Max(other.end, this.end);
            return new Range_1(start, end);
        }
        get isEmpty() {
            return this._start.isEqual(this._end);
        }
        get isSingleLine() {
            return this._start.line === this._end.line;
        }
        with(startOrChange, end = this.end) {
            if (startOrChange === null || end === null) {
                throw (0, errors_1.illegalArgument)();
            }
            let start;
            if (!startOrChange) {
                start = this.start;
            }
            else if (Position.isPosition(startOrChange)) {
                start = startOrChange;
            }
            else {
                start = startOrChange.start || this.start;
                end = startOrChange.end || this.end;
            }
            if (start.isEqual(this._start) && end.isEqual(this.end)) {
                return this;
            }
            return new Range_1(start, end);
        }
        toJSON() {
            return [this.start, this.end];
        }
    };
    Range = Range_1 = __decorate([
        es5ClassCompat
    ], Range);
    exports.Range = Range;
    let Selection = Selection_1 = class Selection extends Range {
        constructor(anchorLineOrAnchor, anchorColumnOrActive, activeLine, activeColumn) {
            let anchor;
            let active;
            if (typeof anchorLineOrAnchor === 'number' && typeof anchorColumnOrActive === 'number' && typeof activeLine === 'number' && typeof activeColumn === 'number') {
                anchor = new Position(anchorLineOrAnchor, anchorColumnOrActive);
                active = new Position(activeLine, activeColumn);
            }
            else if (Position.isPosition(anchorLineOrAnchor) && Position.isPosition(anchorColumnOrActive)) {
                anchor = Position.of(anchorLineOrAnchor);
                active = Position.of(anchorColumnOrActive);
            }
            if (!anchor || !active) {
                throw new Error('Invalid arguments');
            }
            super(anchor, active);
            this._anchor = anchor;
            this._active = active;
        }
        static isSelection(thing) {
            if (thing instanceof Selection_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Range.isRange(thing)
                && Position.isPosition(thing.anchor)
                && Position.isPosition(thing.active)
                && typeof thing.isReversed === 'boolean';
        }
        get anchor() {
            return this._anchor;
        }
        get active() {
            return this._active;
        }
        get isReversed() {
            return this._anchor === this._end;
        }
        toJSON() {
            return {
                start: this.start,
                end: this.end,
                active: this.active,
                anchor: this.anchor
            };
        }
    };
    Selection = Selection_1 = __decorate([
        es5ClassCompat
    ], Selection);
    exports.Selection = Selection;
    class ResolvedAuthority {
        constructor(host, port, connectionToken) {
            if (typeof host !== 'string' || host.length === 0) {
                throw (0, errors_1.illegalArgument)('host');
            }
            if (typeof port !== 'number' || port === 0 || Math.round(port) !== port) {
                throw (0, errors_1.illegalArgument)('port');
            }
            if (typeof connectionToken !== 'undefined') {
                if (typeof connectionToken !== 'string' || connectionToken.length === 0 || !/^[0-9A-Za-z\-]+$/.test(connectionToken)) {
                    throw (0, errors_1.illegalArgument)('connectionToken');
                }
            }
            this.host = host;
            this.port = Math.round(port);
            this.connectionToken = connectionToken;
        }
    }
    exports.ResolvedAuthority = ResolvedAuthority;
    class RemoteAuthorityResolverError extends Error {
        constructor(message, code = remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.Unknown, detail) {
            super(message);
            this._message = message;
            this._code = code;
            this._detail = detail;
            // workaround when extending builtin objects and when compiling to ES5, see:
            // https://github.com/microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            if (typeof Object.setPrototypeOf === 'function') {
                Object.setPrototypeOf(this, RemoteAuthorityResolverError.prototype);
            }
        }
        static NotAvailable(message, handled) {
            return new RemoteAuthorityResolverError(message, remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.NotAvailable, handled);
        }
        static TemporarilyNotAvailable(message) {
            return new RemoteAuthorityResolverError(message, remoteAuthorityResolver_1.RemoteAuthorityResolverErrorCode.TemporarilyNotAvailable);
        }
    }
    exports.RemoteAuthorityResolverError = RemoteAuthorityResolverError;
    var EndOfLine;
    (function (EndOfLine) {
        EndOfLine[EndOfLine["LF"] = 1] = "LF";
        EndOfLine[EndOfLine["CRLF"] = 2] = "CRLF";
    })(EndOfLine = exports.EndOfLine || (exports.EndOfLine = {}));
    var EnvironmentVariableMutatorType;
    (function (EnvironmentVariableMutatorType) {
        EnvironmentVariableMutatorType[EnvironmentVariableMutatorType["Replace"] = 1] = "Replace";
        EnvironmentVariableMutatorType[EnvironmentVariableMutatorType["Append"] = 2] = "Append";
        EnvironmentVariableMutatorType[EnvironmentVariableMutatorType["Prepend"] = 3] = "Prepend";
    })(EnvironmentVariableMutatorType = exports.EnvironmentVariableMutatorType || (exports.EnvironmentVariableMutatorType = {}));
    let TextEdit = TextEdit_1 = class TextEdit {
        constructor(range, newText) {
            this._range = range;
            this._newText = newText;
        }
        static isTextEdit(thing) {
            if (thing instanceof TextEdit_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Range.isRange(thing)
                && typeof thing.newText === 'string';
        }
        static replace(range, newText) {
            return new TextEdit_1(range, newText);
        }
        static insert(position, newText) {
            return TextEdit_1.replace(new Range(position, position), newText);
        }
        static delete(range) {
            return TextEdit_1.replace(range, '');
        }
        static setEndOfLine(eol) {
            const ret = new TextEdit_1(new Range(new Position(0, 0), new Position(0, 0)), '');
            ret.newEol = eol;
            return ret;
        }
        get range() {
            return this._range;
        }
        set range(value) {
            if (value && !Range.isRange(value)) {
                throw (0, errors_1.illegalArgument)('range');
            }
            this._range = value;
        }
        get newText() {
            return this._newText || '';
        }
        set newText(value) {
            if (value && typeof value !== 'string') {
                throw (0, errors_1.illegalArgument)('newText');
            }
            this._newText = value;
        }
        get newEol() {
            return this._newEol;
        }
        set newEol(value) {
            if (value && typeof value !== 'number') {
                throw (0, errors_1.illegalArgument)('newEol');
            }
            this._newEol = value;
        }
        toJSON() {
            return {
                range: this.range,
                newText: this.newText,
                newEol: this._newEol
            };
        }
    };
    TextEdit = TextEdit_1 = __decorate([
        es5ClassCompat
    ], TextEdit);
    exports.TextEdit = TextEdit;
    class SnippetTextEdit {
        constructor(range, snippet) {
            this.range = range;
            this.snippet = snippet;
        }
    }
    exports.SnippetTextEdit = SnippetTextEdit;
    var FileEditType;
    (function (FileEditType) {
        FileEditType[FileEditType["File"] = 1] = "File";
        FileEditType[FileEditType["Text"] = 2] = "Text";
        FileEditType[FileEditType["Cell"] = 3] = "Cell";
        FileEditType[FileEditType["CellReplace"] = 5] = "CellReplace";
    })(FileEditType = exports.FileEditType || (exports.FileEditType = {}));
    let WorkspaceEdit = class WorkspaceEdit {
        constructor() {
            this._edits = [];
        }
        _allEntries() {
            return this._edits;
        }
        // --- file
        renameFile(from, to, options, metadata) {
            this._edits.push({ _type: 1 /* FileEditType.File */, from, to, options, metadata });
        }
        createFile(uri, options, metadata) {
            this._edits.push({ _type: 1 /* FileEditType.File */, from: undefined, to: uri, options, metadata });
        }
        deleteFile(uri, options, metadata) {
            this._edits.push({ _type: 1 /* FileEditType.File */, from: uri, to: undefined, options, metadata });
        }
        // --- notebook
        replaceNotebookMetadata(uri, value, metadata) {
            this._edits.push({ _type: 3 /* FileEditType.Cell */, metadata, uri, edit: { editType: 5 /* CellEditType.DocumentMetadata */, metadata: value }, notebookMetadata: value });
        }
        replaceNotebookCells(uri, startOrRange, endOrCells, cellsOrMetadata, metadata) {
            let start;
            let end;
            let cellData = [];
            let workspaceEditMetadata;
            if (NotebookRange.isNotebookRange(startOrRange) && NotebookCellData.isNotebookCellDataArray(endOrCells) && !NotebookCellData.isNotebookCellDataArray(cellsOrMetadata)) {
                start = startOrRange.start;
                end = startOrRange.end;
                cellData = endOrCells;
                workspaceEditMetadata = cellsOrMetadata;
            }
            else if (typeof startOrRange === 'number' && typeof endOrCells === 'number' && NotebookCellData.isNotebookCellDataArray(cellsOrMetadata)) {
                start = startOrRange;
                end = endOrCells;
                cellData = cellsOrMetadata;
                workspaceEditMetadata = metadata;
            }
            if (start === undefined || end === undefined) {
                throw new Error('Invalid arguments');
            }
            if (start !== end || cellData.length > 0) {
                this._edits.push({ _type: 5 /* FileEditType.CellReplace */, uri, index: start, count: end - start, cells: cellData, metadata: workspaceEditMetadata });
            }
        }
        replaceNotebookCellMetadata(uri, index, cellMetadata, metadata) {
            this._edits.push({ _type: 3 /* FileEditType.Cell */, metadata, uri, edit: { editType: 8 /* CellEditType.PartialMetadata */, index, metadata: cellMetadata } });
        }
        // --- text
        replace(uri, range, newText, metadata) {
            this._edits.push({ _type: 2 /* FileEditType.Text */, uri, edit: new TextEdit(range, newText), metadata });
        }
        insert(resource, position, newText, metadata) {
            this.replace(resource, new Range(position, position), newText, metadata);
        }
        delete(resource, range, metadata) {
            this.replace(resource, range, '', metadata);
        }
        // --- text (Maplike)
        has(uri) {
            return this._edits.some(edit => edit._type === 2 /* FileEditType.Text */ && edit.uri.toString() === uri.toString());
        }
        set(uri, edits) {
            if (!edits) {
                // remove all text edits for `uri`
                for (let i = 0; i < this._edits.length; i++) {
                    const element = this._edits[i];
                    if (element._type === 2 /* FileEditType.Text */ && element.uri.toString() === uri.toString()) {
                        this._edits[i] = undefined; // will be coalesced down below
                    }
                }
                (0, arrays_1.coalesceInPlace)(this._edits);
            }
            else {
                // append edit to the end
                for (const edit of edits) {
                    if (edit) {
                        this._edits.push({ _type: 2 /* FileEditType.Text */, uri, edit });
                    }
                }
            }
        }
        get(uri) {
            const res = [];
            for (let candidate of this._edits) {
                if (candidate._type === 2 /* FileEditType.Text */ && candidate.uri.toString() === uri.toString()) {
                    res.push(candidate.edit);
                }
            }
            return res;
        }
        entries() {
            const textEdits = new map_1.ResourceMap();
            for (let candidate of this._edits) {
                if (candidate._type === 2 /* FileEditType.Text */) {
                    let textEdit = textEdits.get(candidate.uri);
                    if (!textEdit) {
                        textEdit = [candidate.uri, []];
                        textEdits.set(candidate.uri, textEdit);
                    }
                    textEdit[1].push(candidate.edit);
                }
            }
            return [...textEdits.values()];
        }
        get size() {
            return this.entries().length;
        }
        toJSON() {
            return this.entries();
        }
    };
    WorkspaceEdit = __decorate([
        es5ClassCompat
    ], WorkspaceEdit);
    exports.WorkspaceEdit = WorkspaceEdit;
    let SnippetString = SnippetString_1 = class SnippetString {
        constructor(value) {
            this._tabstop = 1;
            this.value = value || '';
        }
        static isSnippetString(thing) {
            if (thing instanceof SnippetString_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return typeof thing.value === 'string';
        }
        static _escape(value) {
            return value.replace(/\$|}|\\/g, '\\$&');
        }
        appendText(string) {
            this.value += SnippetString_1._escape(string);
            return this;
        }
        appendTabstop(number = this._tabstop++) {
            this.value += '$';
            this.value += number;
            return this;
        }
        appendPlaceholder(value, number = this._tabstop++) {
            if (typeof value === 'function') {
                const nested = new SnippetString_1();
                nested._tabstop = this._tabstop;
                value(nested);
                this._tabstop = nested._tabstop;
                value = nested.value;
            }
            else {
                value = SnippetString_1._escape(value);
            }
            this.value += '${';
            this.value += number;
            this.value += ':';
            this.value += value;
            this.value += '}';
            return this;
        }
        appendChoice(values, number = this._tabstop++) {
            const value = values.map(s => s.replace(/\$|}|\\|,/g, '\\$&')).join(',');
            this.value += '${';
            this.value += number;
            this.value += '|';
            this.value += value;
            this.value += '|}';
            return this;
        }
        appendVariable(name, defaultValue) {
            if (typeof defaultValue === 'function') {
                const nested = new SnippetString_1();
                nested._tabstop = this._tabstop;
                defaultValue(nested);
                this._tabstop = nested._tabstop;
                defaultValue = nested.value;
            }
            else if (typeof defaultValue === 'string') {
                defaultValue = defaultValue.replace(/\$|}/g, '\\$&');
            }
            this.value += '${';
            this.value += name;
            if (defaultValue) {
                this.value += ':';
                this.value += defaultValue;
            }
            this.value += '}';
            return this;
        }
    };
    SnippetString = SnippetString_1 = __decorate([
        es5ClassCompat
    ], SnippetString);
    exports.SnippetString = SnippetString;
    var DiagnosticTag;
    (function (DiagnosticTag) {
        DiagnosticTag[DiagnosticTag["Unnecessary"] = 1] = "Unnecessary";
        DiagnosticTag[DiagnosticTag["Deprecated"] = 2] = "Deprecated";
    })(DiagnosticTag = exports.DiagnosticTag || (exports.DiagnosticTag = {}));
    var DiagnosticSeverity;
    (function (DiagnosticSeverity) {
        DiagnosticSeverity[DiagnosticSeverity["Hint"] = 3] = "Hint";
        DiagnosticSeverity[DiagnosticSeverity["Information"] = 2] = "Information";
        DiagnosticSeverity[DiagnosticSeverity["Warning"] = 1] = "Warning";
        DiagnosticSeverity[DiagnosticSeverity["Error"] = 0] = "Error";
    })(DiagnosticSeverity = exports.DiagnosticSeverity || (exports.DiagnosticSeverity = {}));
    let Location = Location_1 = class Location {
        constructor(uri, rangeOrPosition) {
            this.uri = uri;
            if (!rangeOrPosition) {
                //that's OK
            }
            else if (Range.isRange(rangeOrPosition)) {
                this.range = Range.of(rangeOrPosition);
            }
            else if (Position.isPosition(rangeOrPosition)) {
                this.range = new Range(rangeOrPosition, rangeOrPosition);
            }
            else {
                throw new Error('Illegal argument');
            }
        }
        static isLocation(thing) {
            if (thing instanceof Location_1) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return Range.isRange(thing.range)
                && uri_1.URI.isUri(thing.uri);
        }
        toJSON() {
            return {
                uri: this.uri,
                range: this.range
            };
        }
    };
    Location = Location_1 = __decorate([
        es5ClassCompat
    ], Location);
    exports.Location = Location;
    let DiagnosticRelatedInformation = class DiagnosticRelatedInformation {
        constructor(location, message) {
            this.location = location;
            this.message = message;
        }
        static is(thing) {
            if (!thing) {
                return false;
            }
            return typeof thing.message === 'string'
                && thing.location
                && Range.isRange(thing.location.range)
                && uri_1.URI.isUri(thing.location.uri);
        }
        static isEqual(a, b) {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.message === b.message
                && a.location.range.isEqual(b.location.range)
                && a.location.uri.toString() === b.location.uri.toString();
        }
    };
    DiagnosticRelatedInformation = __decorate([
        es5ClassCompat
    ], DiagnosticRelatedInformation);
    exports.DiagnosticRelatedInformation = DiagnosticRelatedInformation;
    let Diagnostic = class Diagnostic {
        constructor(range, message, severity = DiagnosticSeverity.Error) {
            if (!Range.isRange(range)) {
                throw new TypeError('range must be set');
            }
            if (!message) {
                throw new TypeError('message must be set');
            }
            this.range = range;
            this.message = message;
            this.severity = severity;
        }
        toJSON() {
            return {
                severity: DiagnosticSeverity[this.severity],
                message: this.message,
                range: this.range,
                source: this.source,
                code: this.code,
            };
        }
        static isEqual(a, b) {
            if (a === b) {
                return true;
            }
            if (!a || !b) {
                return false;
            }
            return a.message === b.message
                && a.severity === b.severity
                && a.code === b.code
                && a.severity === b.severity
                && a.source === b.source
                && a.range.isEqual(b.range)
                && (0, arrays_1.equals)(a.tags, b.tags)
                && (0, arrays_1.equals)(a.relatedInformation, b.relatedInformation, DiagnosticRelatedInformation.isEqual);
        }
    };
    Diagnostic = __decorate([
        es5ClassCompat
    ], Diagnostic);
    exports.Diagnostic = Diagnostic;
    let Hover = class Hover {
        constructor(contents, range) {
            if (!contents) {
                throw new Error('Illegal argument, contents must be defined');
            }
            if (Array.isArray(contents)) {
                this.contents = contents;
            }
            else {
                this.contents = [contents];
            }
            this.range = range;
        }
    };
    Hover = __decorate([
        es5ClassCompat
    ], Hover);
    exports.Hover = Hover;
    var DocumentHighlightKind;
    (function (DocumentHighlightKind) {
        DocumentHighlightKind[DocumentHighlightKind["Text"] = 0] = "Text";
        DocumentHighlightKind[DocumentHighlightKind["Read"] = 1] = "Read";
        DocumentHighlightKind[DocumentHighlightKind["Write"] = 2] = "Write";
    })(DocumentHighlightKind = exports.DocumentHighlightKind || (exports.DocumentHighlightKind = {}));
    let DocumentHighlight = class DocumentHighlight {
        constructor(range, kind = DocumentHighlightKind.Text) {
            this.range = range;
            this.kind = kind;
        }
        toJSON() {
            return {
                range: this.range,
                kind: DocumentHighlightKind[this.kind]
            };
        }
    };
    DocumentHighlight = __decorate([
        es5ClassCompat
    ], DocumentHighlight);
    exports.DocumentHighlight = DocumentHighlight;
    var SymbolKind;
    (function (SymbolKind) {
        SymbolKind[SymbolKind["File"] = 0] = "File";
        SymbolKind[SymbolKind["Module"] = 1] = "Module";
        SymbolKind[SymbolKind["Namespace"] = 2] = "Namespace";
        SymbolKind[SymbolKind["Package"] = 3] = "Package";
        SymbolKind[SymbolKind["Class"] = 4] = "Class";
        SymbolKind[SymbolKind["Method"] = 5] = "Method";
        SymbolKind[SymbolKind["Property"] = 6] = "Property";
        SymbolKind[SymbolKind["Field"] = 7] = "Field";
        SymbolKind[SymbolKind["Constructor"] = 8] = "Constructor";
        SymbolKind[SymbolKind["Enum"] = 9] = "Enum";
        SymbolKind[SymbolKind["Interface"] = 10] = "Interface";
        SymbolKind[SymbolKind["Function"] = 11] = "Function";
        SymbolKind[SymbolKind["Variable"] = 12] = "Variable";
        SymbolKind[SymbolKind["Constant"] = 13] = "Constant";
        SymbolKind[SymbolKind["String"] = 14] = "String";
        SymbolKind[SymbolKind["Number"] = 15] = "Number";
        SymbolKind[SymbolKind["Boolean"] = 16] = "Boolean";
        SymbolKind[SymbolKind["Array"] = 17] = "Array";
        SymbolKind[SymbolKind["Object"] = 18] = "Object";
        SymbolKind[SymbolKind["Key"] = 19] = "Key";
        SymbolKind[SymbolKind["Null"] = 20] = "Null";
        SymbolKind[SymbolKind["EnumMember"] = 21] = "EnumMember";
        SymbolKind[SymbolKind["Struct"] = 22] = "Struct";
        SymbolKind[SymbolKind["Event"] = 23] = "Event";
        SymbolKind[SymbolKind["Operator"] = 24] = "Operator";
        SymbolKind[SymbolKind["TypeParameter"] = 25] = "TypeParameter";
    })(SymbolKind = exports.SymbolKind || (exports.SymbolKind = {}));
    var SymbolTag;
    (function (SymbolTag) {
        SymbolTag[SymbolTag["Deprecated"] = 1] = "Deprecated";
    })(SymbolTag = exports.SymbolTag || (exports.SymbolTag = {}));
    let SymbolInformation = SymbolInformation_1 = class SymbolInformation {
        constructor(name, kind, rangeOrContainer, locationOrUri, containerName) {
            this.name = name;
            this.kind = kind;
            this.containerName = containerName;
            if (typeof rangeOrContainer === 'string') {
                this.containerName = rangeOrContainer;
            }
            if (locationOrUri instanceof Location) {
                this.location = locationOrUri;
            }
            else if (rangeOrContainer instanceof Range) {
                this.location = new Location(locationOrUri, rangeOrContainer);
            }
            SymbolInformation_1.validate(this);
        }
        static validate(candidate) {
            if (!candidate.name) {
                throw new Error('name must not be falsy');
            }
        }
        toJSON() {
            return {
                name: this.name,
                kind: SymbolKind[this.kind],
                location: this.location,
                containerName: this.containerName
            };
        }
    };
    SymbolInformation = SymbolInformation_1 = __decorate([
        es5ClassCompat
    ], SymbolInformation);
    exports.SymbolInformation = SymbolInformation;
    let DocumentSymbol = DocumentSymbol_1 = class DocumentSymbol {
        constructor(name, detail, kind, range, selectionRange) {
            this.name = name;
            this.detail = detail;
            this.kind = kind;
            this.range = range;
            this.selectionRange = selectionRange;
            this.children = [];
            DocumentSymbol_1.validate(this);
        }
        static validate(candidate) {
            if (!candidate.name) {
                throw new Error('name must not be falsy');
            }
            if (!candidate.range.contains(candidate.selectionRange)) {
                throw new Error('selectionRange must be contained in fullRange');
            }
            if (candidate.children) {
                candidate.children.forEach(DocumentSymbol_1.validate);
            }
        }
    };
    DocumentSymbol = DocumentSymbol_1 = __decorate([
        es5ClassCompat
    ], DocumentSymbol);
    exports.DocumentSymbol = DocumentSymbol;
    var CodeActionTriggerKind;
    (function (CodeActionTriggerKind) {
        CodeActionTriggerKind[CodeActionTriggerKind["Invoke"] = 1] = "Invoke";
        CodeActionTriggerKind[CodeActionTriggerKind["Automatic"] = 2] = "Automatic";
    })(CodeActionTriggerKind = exports.CodeActionTriggerKind || (exports.CodeActionTriggerKind = {}));
    let CodeAction = class CodeAction {
        constructor(title, kind) {
            this.title = title;
            this.kind = kind;
        }
    };
    CodeAction = __decorate([
        es5ClassCompat
    ], CodeAction);
    exports.CodeAction = CodeAction;
    let CodeActionKind = CodeActionKind_1 = class CodeActionKind {
        constructor(value) {
            this.value = value;
        }
        append(parts) {
            return new CodeActionKind_1(this.value ? this.value + CodeActionKind_1.sep + parts : parts);
        }
        intersects(other) {
            return this.contains(other) || other.contains(this);
        }
        contains(other) {
            return this.value === other.value || other.value.startsWith(this.value + CodeActionKind_1.sep);
        }
    };
    CodeActionKind.sep = '.';
    CodeActionKind = CodeActionKind_1 = __decorate([
        es5ClassCompat
    ], CodeActionKind);
    exports.CodeActionKind = CodeActionKind;
    CodeActionKind.Empty = new CodeActionKind('');
    CodeActionKind.QuickFix = CodeActionKind.Empty.append('quickfix');
    CodeActionKind.Refactor = CodeActionKind.Empty.append('refactor');
    CodeActionKind.RefactorExtract = CodeActionKind.Refactor.append('extract');
    CodeActionKind.RefactorInline = CodeActionKind.Refactor.append('inline');
    CodeActionKind.RefactorRewrite = CodeActionKind.Refactor.append('rewrite');
    CodeActionKind.Source = CodeActionKind.Empty.append('source');
    CodeActionKind.SourceOrganizeImports = CodeActionKind.Source.append('organizeImports');
    CodeActionKind.SourceFixAll = CodeActionKind.Source.append('fixAll');
    let SelectionRange = class SelectionRange {
        constructor(range, parent) {
            this.range = range;
            this.parent = parent;
            if (parent && !parent.range.contains(this.range)) {
                throw new Error('Invalid argument: parent must contain this range');
            }
        }
    };
    SelectionRange = __decorate([
        es5ClassCompat
    ], SelectionRange);
    exports.SelectionRange = SelectionRange;
    class CallHierarchyItem {
        constructor(kind, name, detail, uri, range, selectionRange) {
            this.kind = kind;
            this.name = name;
            this.detail = detail;
            this.uri = uri;
            this.range = range;
            this.selectionRange = selectionRange;
        }
    }
    exports.CallHierarchyItem = CallHierarchyItem;
    class CallHierarchyIncomingCall {
        constructor(item, fromRanges) {
            this.fromRanges = fromRanges;
            this.from = item;
        }
    }
    exports.CallHierarchyIncomingCall = CallHierarchyIncomingCall;
    class CallHierarchyOutgoingCall {
        constructor(item, fromRanges) {
            this.fromRanges = fromRanges;
            this.to = item;
        }
    }
    exports.CallHierarchyOutgoingCall = CallHierarchyOutgoingCall;
    var LanguageStatusSeverity;
    (function (LanguageStatusSeverity) {
        LanguageStatusSeverity[LanguageStatusSeverity["Information"] = 0] = "Information";
        LanguageStatusSeverity[LanguageStatusSeverity["Warning"] = 1] = "Warning";
        LanguageStatusSeverity[LanguageStatusSeverity["Error"] = 2] = "Error";
    })(LanguageStatusSeverity = exports.LanguageStatusSeverity || (exports.LanguageStatusSeverity = {}));
    let CodeLens = class CodeLens {
        constructor(range, command) {
            this.range = range;
            this.command = command;
        }
        get isResolved() {
            return !!this.command;
        }
    };
    CodeLens = __decorate([
        es5ClassCompat
    ], CodeLens);
    exports.CodeLens = CodeLens;
    let MarkdownString = MarkdownString_1 = class MarkdownString {
        constructor(value, supportThemeIcons = false) {
            _MarkdownString_delegate.set(this, void 0);
            __classPrivateFieldSet(this, _MarkdownString_delegate, new htmlContent_1.MarkdownString(value, { supportThemeIcons }), "f");
        }
        static isMarkdownString(thing) {
            if (thing instanceof MarkdownString_1) {
                return true;
            }
            return thing && thing.appendCodeblock && thing.appendMarkdown && thing.appendText && (thing.value !== undefined);
        }
        get value() {
            return __classPrivateFieldGet(this, _MarkdownString_delegate, "f").value;
        }
        set value(value) {
            __classPrivateFieldGet(this, _MarkdownString_delegate, "f").value = value;
        }
        get isTrusted() {
            return __classPrivateFieldGet(this, _MarkdownString_delegate, "f").isTrusted;
        }
        set isTrusted(value) {
            __classPrivateFieldGet(this, _MarkdownString_delegate, "f").isTrusted = value;
        }
        get supportThemeIcons() {
            return __classPrivateFieldGet(this, _MarkdownString_delegate, "f").supportThemeIcons;
        }
        set supportThemeIcons(value) {
            __classPrivateFieldGet(this, _MarkdownString_delegate, "f").supportThemeIcons = value;
        }
        get supportHtml() {
            return __classPrivateFieldGet(this, _MarkdownString_delegate, "f").supportHtml;
        }
        set supportHtml(value) {
            __classPrivateFieldGet(this, _MarkdownString_delegate, "f").supportHtml = value;
        }
        get baseUri() {
            return __classPrivateFieldGet(this, _MarkdownString_delegate, "f").baseUri;
        }
        set baseUri(value) {
            __classPrivateFieldGet(this, _MarkdownString_delegate, "f").baseUri = value;
        }
        appendText(value) {
            __classPrivateFieldGet(this, _MarkdownString_delegate, "f").appendText(value);
            return this;
        }
        appendMarkdown(value) {
            __classPrivateFieldGet(this, _MarkdownString_delegate, "f").appendMarkdown(value);
            return this;
        }
        appendCodeblock(value, language) {
            __classPrivateFieldGet(this, _MarkdownString_delegate, "f").appendCodeblock(language !== null && language !== void 0 ? language : '', value);
            return this;
        }
    };
    _MarkdownString_delegate = new WeakMap();
    MarkdownString = MarkdownString_1 = __decorate([
        es5ClassCompat
    ], MarkdownString);
    exports.MarkdownString = MarkdownString;
    let ParameterInformation = class ParameterInformation {
        constructor(label, documentation) {
            this.label = label;
            this.documentation = documentation;
        }
    };
    ParameterInformation = __decorate([
        es5ClassCompat
    ], ParameterInformation);
    exports.ParameterInformation = ParameterInformation;
    let SignatureInformation = class SignatureInformation {
        constructor(label, documentation) {
            this.label = label;
            this.documentation = documentation;
            this.parameters = [];
        }
    };
    SignatureInformation = __decorate([
        es5ClassCompat
    ], SignatureInformation);
    exports.SignatureInformation = SignatureInformation;
    let SignatureHelp = class SignatureHelp {
        constructor() {
            this.activeSignature = 0;
            this.activeParameter = 0;
            this.signatures = [];
        }
    };
    SignatureHelp = __decorate([
        es5ClassCompat
    ], SignatureHelp);
    exports.SignatureHelp = SignatureHelp;
    var SignatureHelpTriggerKind;
    (function (SignatureHelpTriggerKind) {
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["Invoke"] = 1] = "Invoke";
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["TriggerCharacter"] = 2] = "TriggerCharacter";
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["ContentChange"] = 3] = "ContentChange";
    })(SignatureHelpTriggerKind = exports.SignatureHelpTriggerKind || (exports.SignatureHelpTriggerKind = {}));
    var InlayHintKind;
    (function (InlayHintKind) {
        InlayHintKind[InlayHintKind["Type"] = 1] = "Type";
        InlayHintKind[InlayHintKind["Parameter"] = 2] = "Parameter";
    })(InlayHintKind = exports.InlayHintKind || (exports.InlayHintKind = {}));
    let InlayHintLabelPart = class InlayHintLabelPart {
        constructor(value) {
            this.value = value;
        }
    };
    InlayHintLabelPart = __decorate([
        es5ClassCompat
    ], InlayHintLabelPart);
    exports.InlayHintLabelPart = InlayHintLabelPart;
    let InlayHint = class InlayHint {
        constructor(position, label, kind) {
            this.position = position;
            this.label = label;
            this.kind = kind;
        }
    };
    InlayHint = __decorate([
        es5ClassCompat
    ], InlayHint);
    exports.InlayHint = InlayHint;
    var CompletionTriggerKind;
    (function (CompletionTriggerKind) {
        CompletionTriggerKind[CompletionTriggerKind["Invoke"] = 0] = "Invoke";
        CompletionTriggerKind[CompletionTriggerKind["TriggerCharacter"] = 1] = "TriggerCharacter";
        CompletionTriggerKind[CompletionTriggerKind["TriggerForIncompleteCompletions"] = 2] = "TriggerForIncompleteCompletions";
    })(CompletionTriggerKind = exports.CompletionTriggerKind || (exports.CompletionTriggerKind = {}));
    var CompletionItemKind;
    (function (CompletionItemKind) {
        CompletionItemKind[CompletionItemKind["Text"] = 0] = "Text";
        CompletionItemKind[CompletionItemKind["Method"] = 1] = "Method";
        CompletionItemKind[CompletionItemKind["Function"] = 2] = "Function";
        CompletionItemKind[CompletionItemKind["Constructor"] = 3] = "Constructor";
        CompletionItemKind[CompletionItemKind["Field"] = 4] = "Field";
        CompletionItemKind[CompletionItemKind["Variable"] = 5] = "Variable";
        CompletionItemKind[CompletionItemKind["Class"] = 6] = "Class";
        CompletionItemKind[CompletionItemKind["Interface"] = 7] = "Interface";
        CompletionItemKind[CompletionItemKind["Module"] = 8] = "Module";
        CompletionItemKind[CompletionItemKind["Property"] = 9] = "Property";
        CompletionItemKind[CompletionItemKind["Unit"] = 10] = "Unit";
        CompletionItemKind[CompletionItemKind["Value"] = 11] = "Value";
        CompletionItemKind[CompletionItemKind["Enum"] = 12] = "Enum";
        CompletionItemKind[CompletionItemKind["Keyword"] = 13] = "Keyword";
        CompletionItemKind[CompletionItemKind["Snippet"] = 14] = "Snippet";
        CompletionItemKind[CompletionItemKind["Color"] = 15] = "Color";
        CompletionItemKind[CompletionItemKind["File"] = 16] = "File";
        CompletionItemKind[CompletionItemKind["Reference"] = 17] = "Reference";
        CompletionItemKind[CompletionItemKind["Folder"] = 18] = "Folder";
        CompletionItemKind[CompletionItemKind["EnumMember"] = 19] = "EnumMember";
        CompletionItemKind[CompletionItemKind["Constant"] = 20] = "Constant";
        CompletionItemKind[CompletionItemKind["Struct"] = 21] = "Struct";
        CompletionItemKind[CompletionItemKind["Event"] = 22] = "Event";
        CompletionItemKind[CompletionItemKind["Operator"] = 23] = "Operator";
        CompletionItemKind[CompletionItemKind["TypeParameter"] = 24] = "TypeParameter";
        CompletionItemKind[CompletionItemKind["User"] = 25] = "User";
        CompletionItemKind[CompletionItemKind["Issue"] = 26] = "Issue";
    })(CompletionItemKind = exports.CompletionItemKind || (exports.CompletionItemKind = {}));
    var CompletionItemTag;
    (function (CompletionItemTag) {
        CompletionItemTag[CompletionItemTag["Deprecated"] = 1] = "Deprecated";
    })(CompletionItemTag = exports.CompletionItemTag || (exports.CompletionItemTag = {}));
    let CompletionItem = class CompletionItem {
        constructor(label, kind) {
            this.label = label;
            this.kind = kind;
        }
        toJSON() {
            return {
                label: this.label,
                kind: this.kind && CompletionItemKind[this.kind],
                detail: this.detail,
                documentation: this.documentation,
                sortText: this.sortText,
                filterText: this.filterText,
                preselect: this.preselect,
                insertText: this.insertText,
                textEdit: this.textEdit
            };
        }
    };
    CompletionItem = __decorate([
        es5ClassCompat
    ], CompletionItem);
    exports.CompletionItem = CompletionItem;
    let CompletionList = class CompletionList {
        constructor(items = [], isIncomplete = false) {
            this.items = items;
            this.isIncomplete = isIncomplete;
        }
    };
    CompletionList = __decorate([
        es5ClassCompat
    ], CompletionList);
    exports.CompletionList = CompletionList;
    let InlineSuggestion = class InlineSuggestion {
        constructor(insertText, range, command) {
            this.insertText = insertText;
            this.range = range;
            this.command = command;
        }
    };
    InlineSuggestion = __decorate([
        es5ClassCompat
    ], InlineSuggestion);
    exports.InlineSuggestion = InlineSuggestion;
    /**
     * @deprecated Return an array of inline completion items directly. Will be removed eventually.
    */
    let InlineSuggestions = class InlineSuggestions {
        constructor(items) {
            this.items = items;
        }
    };
    InlineSuggestions = __decorate([
        es5ClassCompat
    ], InlineSuggestions);
    exports.InlineSuggestions = InlineSuggestions;
    let InlineSuggestionNew = class InlineSuggestionNew {
        constructor(insertText, range, command) {
            this.insertText = insertText;
            this.range = range;
            this.command = command;
        }
    };
    InlineSuggestionNew = __decorate([
        es5ClassCompat
    ], InlineSuggestionNew);
    exports.InlineSuggestionNew = InlineSuggestionNew;
    let InlineSuggestionsNew = class InlineSuggestionsNew {
        constructor(items, commands) {
            this.items = items;
            this.commands = commands;
        }
    };
    InlineSuggestionsNew = __decorate([
        es5ClassCompat
    ], InlineSuggestionsNew);
    exports.InlineSuggestionsNew = InlineSuggestionsNew;
    var ViewColumn;
    (function (ViewColumn) {
        ViewColumn[ViewColumn["Active"] = -1] = "Active";
        ViewColumn[ViewColumn["Beside"] = -2] = "Beside";
        ViewColumn[ViewColumn["One"] = 1] = "One";
        ViewColumn[ViewColumn["Two"] = 2] = "Two";
        ViewColumn[ViewColumn["Three"] = 3] = "Three";
        ViewColumn[ViewColumn["Four"] = 4] = "Four";
        ViewColumn[ViewColumn["Five"] = 5] = "Five";
        ViewColumn[ViewColumn["Six"] = 6] = "Six";
        ViewColumn[ViewColumn["Seven"] = 7] = "Seven";
        ViewColumn[ViewColumn["Eight"] = 8] = "Eight";
        ViewColumn[ViewColumn["Nine"] = 9] = "Nine";
    })(ViewColumn = exports.ViewColumn || (exports.ViewColumn = {}));
    var StatusBarAlignment;
    (function (StatusBarAlignment) {
        StatusBarAlignment[StatusBarAlignment["Left"] = 1] = "Left";
        StatusBarAlignment[StatusBarAlignment["Right"] = 2] = "Right";
    })(StatusBarAlignment = exports.StatusBarAlignment || (exports.StatusBarAlignment = {}));
    var TextEditorLineNumbersStyle;
    (function (TextEditorLineNumbersStyle) {
        TextEditorLineNumbersStyle[TextEditorLineNumbersStyle["Off"] = 0] = "Off";
        TextEditorLineNumbersStyle[TextEditorLineNumbersStyle["On"] = 1] = "On";
        TextEditorLineNumbersStyle[TextEditorLineNumbersStyle["Relative"] = 2] = "Relative";
    })(TextEditorLineNumbersStyle = exports.TextEditorLineNumbersStyle || (exports.TextEditorLineNumbersStyle = {}));
    var TextDocumentSaveReason;
    (function (TextDocumentSaveReason) {
        TextDocumentSaveReason[TextDocumentSaveReason["Manual"] = 1] = "Manual";
        TextDocumentSaveReason[TextDocumentSaveReason["AfterDelay"] = 2] = "AfterDelay";
        TextDocumentSaveReason[TextDocumentSaveReason["FocusOut"] = 3] = "FocusOut";
    })(TextDocumentSaveReason = exports.TextDocumentSaveReason || (exports.TextDocumentSaveReason = {}));
    var TextEditorRevealType;
    (function (TextEditorRevealType) {
        TextEditorRevealType[TextEditorRevealType["Default"] = 0] = "Default";
        TextEditorRevealType[TextEditorRevealType["InCenter"] = 1] = "InCenter";
        TextEditorRevealType[TextEditorRevealType["InCenterIfOutsideViewport"] = 2] = "InCenterIfOutsideViewport";
        TextEditorRevealType[TextEditorRevealType["AtTop"] = 3] = "AtTop";
    })(TextEditorRevealType = exports.TextEditorRevealType || (exports.TextEditorRevealType = {}));
    var TextEditorSelectionChangeKind;
    (function (TextEditorSelectionChangeKind) {
        TextEditorSelectionChangeKind[TextEditorSelectionChangeKind["Keyboard"] = 1] = "Keyboard";
        TextEditorSelectionChangeKind[TextEditorSelectionChangeKind["Mouse"] = 2] = "Mouse";
        TextEditorSelectionChangeKind[TextEditorSelectionChangeKind["Command"] = 3] = "Command";
    })(TextEditorSelectionChangeKind = exports.TextEditorSelectionChangeKind || (exports.TextEditorSelectionChangeKind = {}));
    var TextDocumentChangeReason;
    (function (TextDocumentChangeReason) {
        TextDocumentChangeReason[TextDocumentChangeReason["Undo"] = 1] = "Undo";
        TextDocumentChangeReason[TextDocumentChangeReason["Redo"] = 2] = "Redo";
    })(TextDocumentChangeReason = exports.TextDocumentChangeReason || (exports.TextDocumentChangeReason = {}));
    /**
     * These values match very carefully the values of `TrackedRangeStickiness`
     */
    var DecorationRangeBehavior;
    (function (DecorationRangeBehavior) {
        /**
         * TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges
         */
        DecorationRangeBehavior[DecorationRangeBehavior["OpenOpen"] = 0] = "OpenOpen";
        /**
         * TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
         */
        DecorationRangeBehavior[DecorationRangeBehavior["ClosedClosed"] = 1] = "ClosedClosed";
        /**
         * TrackedRangeStickiness.GrowsOnlyWhenTypingBefore
         */
        DecorationRangeBehavior[DecorationRangeBehavior["OpenClosed"] = 2] = "OpenClosed";
        /**
         * TrackedRangeStickiness.GrowsOnlyWhenTypingAfter
         */
        DecorationRangeBehavior[DecorationRangeBehavior["ClosedOpen"] = 3] = "ClosedOpen";
    })(DecorationRangeBehavior = exports.DecorationRangeBehavior || (exports.DecorationRangeBehavior = {}));
    (function (TextEditorSelectionChangeKind) {
        function fromValue(s) {
            switch (s) {
                case 'keyboard': return TextEditorSelectionChangeKind.Keyboard;
                case 'mouse': return TextEditorSelectionChangeKind.Mouse;
                case 'api': return TextEditorSelectionChangeKind.Command;
            }
            return undefined;
        }
        TextEditorSelectionChangeKind.fromValue = fromValue;
    })(TextEditorSelectionChangeKind = exports.TextEditorSelectionChangeKind || (exports.TextEditorSelectionChangeKind = {}));
    let DocumentLink = class DocumentLink {
        constructor(range, target) {
            if (target && !(uri_1.URI.isUri(target))) {
                throw (0, errors_1.illegalArgument)('target');
            }
            if (!Range.isRange(range) || range.isEmpty) {
                throw (0, errors_1.illegalArgument)('range');
            }
            this.range = range;
            this.target = target;
        }
    };
    DocumentLink = __decorate([
        es5ClassCompat
    ], DocumentLink);
    exports.DocumentLink = DocumentLink;
    let Color = class Color {
        constructor(red, green, blue, alpha) {
            this.red = red;
            this.green = green;
            this.blue = blue;
            this.alpha = alpha;
        }
    };
    Color = __decorate([
        es5ClassCompat
    ], Color);
    exports.Color = Color;
    let ColorInformation = class ColorInformation {
        constructor(range, color) {
            if (color && !(color instanceof Color)) {
                throw (0, errors_1.illegalArgument)('color');
            }
            if (!Range.isRange(range) || range.isEmpty) {
                throw (0, errors_1.illegalArgument)('range');
            }
            this.range = range;
            this.color = color;
        }
    };
    ColorInformation = __decorate([
        es5ClassCompat
    ], ColorInformation);
    exports.ColorInformation = ColorInformation;
    let ColorPresentation = class ColorPresentation {
        constructor(label) {
            if (!label || typeof label !== 'string') {
                throw (0, errors_1.illegalArgument)('label');
            }
            this.label = label;
        }
    };
    ColorPresentation = __decorate([
        es5ClassCompat
    ], ColorPresentation);
    exports.ColorPresentation = ColorPresentation;
    var ColorFormat;
    (function (ColorFormat) {
        ColorFormat[ColorFormat["RGB"] = 0] = "RGB";
        ColorFormat[ColorFormat["HEX"] = 1] = "HEX";
        ColorFormat[ColorFormat["HSL"] = 2] = "HSL";
    })(ColorFormat = exports.ColorFormat || (exports.ColorFormat = {}));
    var SourceControlInputBoxValidationType;
    (function (SourceControlInputBoxValidationType) {
        SourceControlInputBoxValidationType[SourceControlInputBoxValidationType["Error"] = 0] = "Error";
        SourceControlInputBoxValidationType[SourceControlInputBoxValidationType["Warning"] = 1] = "Warning";
        SourceControlInputBoxValidationType[SourceControlInputBoxValidationType["Information"] = 2] = "Information";
    })(SourceControlInputBoxValidationType = exports.SourceControlInputBoxValidationType || (exports.SourceControlInputBoxValidationType = {}));
    class TerminalLink {
        constructor(startIndex, length, tooltip) {
            this.startIndex = startIndex;
            this.length = length;
            this.tooltip = tooltip;
            if (typeof startIndex !== 'number' || startIndex < 0) {
                throw (0, errors_1.illegalArgument)('startIndex');
            }
            if (typeof length !== 'number' || length < 1) {
                throw (0, errors_1.illegalArgument)('length');
            }
            if (tooltip !== undefined && typeof tooltip !== 'string') {
                throw (0, errors_1.illegalArgument)('tooltip');
            }
        }
    }
    exports.TerminalLink = TerminalLink;
    var TerminalLocation;
    (function (TerminalLocation) {
        TerminalLocation[TerminalLocation["Panel"] = 1] = "Panel";
        TerminalLocation[TerminalLocation["Editor"] = 2] = "Editor";
    })(TerminalLocation = exports.TerminalLocation || (exports.TerminalLocation = {}));
    class TerminalProfile {
        constructor(options) {
            this.options = options;
            if (typeof options !== 'object') {
                throw (0, errors_1.illegalArgument)('options');
            }
        }
    }
    exports.TerminalProfile = TerminalProfile;
    var TaskRevealKind;
    (function (TaskRevealKind) {
        TaskRevealKind[TaskRevealKind["Always"] = 1] = "Always";
        TaskRevealKind[TaskRevealKind["Silent"] = 2] = "Silent";
        TaskRevealKind[TaskRevealKind["Never"] = 3] = "Never";
    })(TaskRevealKind = exports.TaskRevealKind || (exports.TaskRevealKind = {}));
    var TaskPanelKind;
    (function (TaskPanelKind) {
        TaskPanelKind[TaskPanelKind["Shared"] = 1] = "Shared";
        TaskPanelKind[TaskPanelKind["Dedicated"] = 2] = "Dedicated";
        TaskPanelKind[TaskPanelKind["New"] = 3] = "New";
    })(TaskPanelKind = exports.TaskPanelKind || (exports.TaskPanelKind = {}));
    let TaskGroup = TaskGroup_1 = class TaskGroup {
        constructor(id, label) {
            this.label = label;
            if (typeof id !== 'string') {
                throw (0, errors_1.illegalArgument)('name');
            }
            if (typeof label !== 'string') {
                throw (0, errors_1.illegalArgument)('name');
            }
            this._id = id;
        }
        static from(value) {
            switch (value) {
                case 'clean':
                    return TaskGroup_1.Clean;
                case 'build':
                    return TaskGroup_1.Build;
                case 'rebuild':
                    return TaskGroup_1.Rebuild;
                case 'test':
                    return TaskGroup_1.Test;
                default:
                    return undefined;
            }
        }
        get id() {
            return this._id;
        }
    };
    TaskGroup.Clean = new TaskGroup_1('clean', 'Clean');
    TaskGroup.Build = new TaskGroup_1('build', 'Build');
    TaskGroup.Rebuild = new TaskGroup_1('rebuild', 'Rebuild');
    TaskGroup.Test = new TaskGroup_1('test', 'Test');
    TaskGroup = TaskGroup_1 = __decorate([
        es5ClassCompat
    ], TaskGroup);
    exports.TaskGroup = TaskGroup;
    function computeTaskExecutionId(values) {
        let id = '';
        for (let i = 0; i < values.length; i++) {
            id += values[i].replace(/,/g, ',,') + ',';
        }
        return id;
    }
    let ProcessExecution = class ProcessExecution {
        constructor(process, varg1, varg2) {
            if (typeof process !== 'string') {
                throw (0, errors_1.illegalArgument)('process');
            }
            this._args = [];
            this._process = process;
            if (varg1 !== undefined) {
                if (Array.isArray(varg1)) {
                    this._args = varg1;
                    this._options = varg2;
                }
                else {
                    this._options = varg1;
                }
            }
        }
        get process() {
            return this._process;
        }
        set process(value) {
            if (typeof value !== 'string') {
                throw (0, errors_1.illegalArgument)('process');
            }
            this._process = value;
        }
        get args() {
            return this._args;
        }
        set args(value) {
            if (!Array.isArray(value)) {
                value = [];
            }
            this._args = value;
        }
        get options() {
            return this._options;
        }
        set options(value) {
            this._options = value;
        }
        computeId() {
            const props = [];
            props.push('process');
            if (this._process !== undefined) {
                props.push(this._process);
            }
            if (this._args && this._args.length > 0) {
                for (let arg of this._args) {
                    props.push(arg);
                }
            }
            return computeTaskExecutionId(props);
        }
    };
    ProcessExecution = __decorate([
        es5ClassCompat
    ], ProcessExecution);
    exports.ProcessExecution = ProcessExecution;
    let ShellExecution = class ShellExecution {
        constructor(arg0, arg1, arg2) {
            this._args = [];
            if (Array.isArray(arg1)) {
                if (!arg0) {
                    throw (0, errors_1.illegalArgument)('command can\'t be undefined or null');
                }
                if (typeof arg0 !== 'string' && typeof arg0.value !== 'string') {
                    throw (0, errors_1.illegalArgument)('command');
                }
                this._command = arg0;
                this._args = arg1;
                this._options = arg2;
            }
            else {
                if (typeof arg0 !== 'string') {
                    throw (0, errors_1.illegalArgument)('commandLine');
                }
                this._commandLine = arg0;
                this._options = arg1;
            }
        }
        get commandLine() {
            return this._commandLine;
        }
        set commandLine(value) {
            if (typeof value !== 'string') {
                throw (0, errors_1.illegalArgument)('commandLine');
            }
            this._commandLine = value;
        }
        get command() {
            return this._command ? this._command : '';
        }
        set command(value) {
            if (typeof value !== 'string' && typeof value.value !== 'string') {
                throw (0, errors_1.illegalArgument)('command');
            }
            this._command = value;
        }
        get args() {
            return this._args;
        }
        set args(value) {
            this._args = value || [];
        }
        get options() {
            return this._options;
        }
        set options(value) {
            this._options = value;
        }
        computeId() {
            const props = [];
            props.push('shell');
            if (this._commandLine !== undefined) {
                props.push(this._commandLine);
            }
            if (this._command !== undefined) {
                props.push(typeof this._command === 'string' ? this._command : this._command.value);
            }
            if (this._args && this._args.length > 0) {
                for (let arg of this._args) {
                    props.push(typeof arg === 'string' ? arg : arg.value);
                }
            }
            return computeTaskExecutionId(props);
        }
    };
    ShellExecution = __decorate([
        es5ClassCompat
    ], ShellExecution);
    exports.ShellExecution = ShellExecution;
    var ShellQuoting;
    (function (ShellQuoting) {
        ShellQuoting[ShellQuoting["Escape"] = 1] = "Escape";
        ShellQuoting[ShellQuoting["Strong"] = 2] = "Strong";
        ShellQuoting[ShellQuoting["Weak"] = 3] = "Weak";
    })(ShellQuoting = exports.ShellQuoting || (exports.ShellQuoting = {}));
    var TaskScope;
    (function (TaskScope) {
        TaskScope[TaskScope["Global"] = 1] = "Global";
        TaskScope[TaskScope["Workspace"] = 2] = "Workspace";
    })(TaskScope = exports.TaskScope || (exports.TaskScope = {}));
    class CustomExecution {
        constructor(callback) {
            this._callback = callback;
        }
        computeId() {
            return 'customExecution' + (0, uuid_1.generateUuid)();
        }
        set callback(value) {
            this._callback = value;
        }
        get callback() {
            return this._callback;
        }
    }
    exports.CustomExecution = CustomExecution;
    let Task = Task_1 = class Task {
        constructor(definition, arg2, arg3, arg4, arg5, arg6) {
            this.__deprecated = false;
            this._definition = this.definition = definition;
            let problemMatchers;
            if (typeof arg2 === 'string') {
                this._name = this.name = arg2;
                this._source = this.source = arg3;
                this.execution = arg4;
                problemMatchers = arg5;
                this.__deprecated = true;
            }
            else if (arg2 === TaskScope.Global || arg2 === TaskScope.Workspace) {
                this.target = arg2;
                this._name = this.name = arg3;
                this._source = this.source = arg4;
                this.execution = arg5;
                problemMatchers = arg6;
            }
            else {
                this.target = arg2;
                this._name = this.name = arg3;
                this._source = this.source = arg4;
                this.execution = arg5;
                problemMatchers = arg6;
            }
            if (typeof problemMatchers === 'string') {
                this._problemMatchers = [problemMatchers];
                this._hasDefinedMatchers = true;
            }
            else if (Array.isArray(problemMatchers)) {
                this._problemMatchers = problemMatchers;
                this._hasDefinedMatchers = true;
            }
            else {
                this._problemMatchers = [];
                this._hasDefinedMatchers = false;
            }
            this._isBackground = false;
            this._presentationOptions = Object.create(null);
            this._runOptions = Object.create(null);
        }
        get _id() {
            return this.__id;
        }
        set _id(value) {
            this.__id = value;
        }
        get _deprecated() {
            return this.__deprecated;
        }
        clear() {
            if (this.__id === undefined) {
                return;
            }
            this.__id = undefined;
            this._scope = undefined;
            this.computeDefinitionBasedOnExecution();
        }
        computeDefinitionBasedOnExecution() {
            if (this._execution instanceof ProcessExecution) {
                this._definition = {
                    type: Task_1.ProcessType,
                    id: this._execution.computeId()
                };
            }
            else if (this._execution instanceof ShellExecution) {
                this._definition = {
                    type: Task_1.ShellType,
                    id: this._execution.computeId()
                };
            }
            else if (this._execution instanceof CustomExecution) {
                this._definition = {
                    type: Task_1.ExtensionCallbackType,
                    id: this._execution.computeId()
                };
            }
            else {
                this._definition = {
                    type: Task_1.EmptyType,
                    id: (0, uuid_1.generateUuid)()
                };
            }
        }
        get definition() {
            return this._definition;
        }
        set definition(value) {
            if (value === undefined || value === null) {
                throw (0, errors_1.illegalArgument)('Kind can\'t be undefined or null');
            }
            this.clear();
            this._definition = value;
        }
        get scope() {
            return this._scope;
        }
        set target(value) {
            this.clear();
            this._scope = value;
        }
        get name() {
            return this._name;
        }
        set name(value) {
            if (typeof value !== 'string') {
                throw (0, errors_1.illegalArgument)('name');
            }
            this.clear();
            this._name = value;
        }
        get execution() {
            return this._execution;
        }
        set execution(value) {
            if (value === null) {
                value = undefined;
            }
            this.clear();
            this._execution = value;
            const type = this._definition.type;
            if (Task_1.EmptyType === type || Task_1.ProcessType === type || Task_1.ShellType === type || Task_1.ExtensionCallbackType === type) {
                this.computeDefinitionBasedOnExecution();
            }
        }
        get problemMatchers() {
            return this._problemMatchers;
        }
        set problemMatchers(value) {
            if (!Array.isArray(value)) {
                this.clear();
                this._problemMatchers = [];
                this._hasDefinedMatchers = false;
                return;
            }
            else {
                this.clear();
                this._problemMatchers = value;
                this._hasDefinedMatchers = true;
            }
        }
        get hasDefinedMatchers() {
            return this._hasDefinedMatchers;
        }
        get isBackground() {
            return this._isBackground;
        }
        set isBackground(value) {
            if (value !== true && value !== false) {
                value = false;
            }
            this.clear();
            this._isBackground = value;
        }
        get source() {
            return this._source;
        }
        set source(value) {
            if (typeof value !== 'string' || value.length === 0) {
                throw (0, errors_1.illegalArgument)('source must be a string of length > 0');
            }
            this.clear();
            this._source = value;
        }
        get group() {
            return this._group;
        }
        set group(value) {
            if (value === null) {
                value = undefined;
            }
            this.clear();
            this._group = value;
        }
        get detail() {
            return this._detail;
        }
        set detail(value) {
            if (value === null) {
                value = undefined;
            }
            this._detail = value;
        }
        get presentationOptions() {
            return this._presentationOptions;
        }
        set presentationOptions(value) {
            if (value === null || value === undefined) {
                value = Object.create(null);
            }
            this.clear();
            this._presentationOptions = value;
        }
        get runOptions() {
            return this._runOptions;
        }
        set runOptions(value) {
            if (value === null || value === undefined) {
                value = Object.create(null);
            }
            this.clear();
            this._runOptions = value;
        }
    };
    Task.ExtensionCallbackType = 'customExecution';
    Task.ProcessType = 'process';
    Task.ShellType = 'shell';
    Task.EmptyType = '$empty';
    Task = Task_1 = __decorate([
        es5ClassCompat
    ], Task);
    exports.Task = Task;
    var ProgressLocation;
    (function (ProgressLocation) {
        ProgressLocation[ProgressLocation["SourceControl"] = 1] = "SourceControl";
        ProgressLocation[ProgressLocation["Window"] = 10] = "Window";
        ProgressLocation[ProgressLocation["Notification"] = 15] = "Notification";
    })(ProgressLocation = exports.ProgressLocation || (exports.ProgressLocation = {}));
    let TreeItem = class TreeItem {
        constructor(arg1, collapsibleState = TreeItemCollapsibleState.None) {
            this.collapsibleState = collapsibleState;
            if (uri_1.URI.isUri(arg1)) {
                this.resourceUri = arg1;
            }
            else {
                this.label = arg1;
            }
        }
    };
    TreeItem = __decorate([
        es5ClassCompat
    ], TreeItem);
    exports.TreeItem = TreeItem;
    var TreeItemCollapsibleState;
    (function (TreeItemCollapsibleState) {
        TreeItemCollapsibleState[TreeItemCollapsibleState["None"] = 0] = "None";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Collapsed"] = 1] = "Collapsed";
        TreeItemCollapsibleState[TreeItemCollapsibleState["Expanded"] = 2] = "Expanded";
    })(TreeItemCollapsibleState = exports.TreeItemCollapsibleState || (exports.TreeItemCollapsibleState = {}));
    let DataTransferItem = class DataTransferItem {
        constructor(value) {
            this.value = value;
        }
        async asString() {
            return typeof this.value === 'string' ? this.value : JSON.stringify(this.value);
        }
    };
    DataTransferItem = __decorate([
        es5ClassCompat
    ], DataTransferItem);
    exports.DataTransferItem = DataTransferItem;
    let DataTransfer = class DataTransfer {
        constructor() {
            this._items = new Map();
        }
        get(mimeType) {
            return this._items.get(mimeType);
        }
        set(mimeType, value) {
            this._items.set(mimeType, value);
        }
        forEach(callbackfn) {
            this._items.forEach(callbackfn);
        }
    };
    DataTransfer = __decorate([
        es5ClassCompat
    ], DataTransfer);
    exports.DataTransfer = DataTransfer;
    let ThemeIcon = class ThemeIcon {
        constructor(id, color) {
            this.id = id;
            this.color = color;
        }
    };
    ThemeIcon = __decorate([
        es5ClassCompat
    ], ThemeIcon);
    exports.ThemeIcon = ThemeIcon;
    ThemeIcon.File = new ThemeIcon('file');
    ThemeIcon.Folder = new ThemeIcon('folder');
    let ThemeColor = class ThemeColor {
        constructor(id) {
            this.id = id;
        }
    };
    ThemeColor = __decorate([
        es5ClassCompat
    ], ThemeColor);
    exports.ThemeColor = ThemeColor;
    var ConfigurationTarget;
    (function (ConfigurationTarget) {
        ConfigurationTarget[ConfigurationTarget["Global"] = 1] = "Global";
        ConfigurationTarget[ConfigurationTarget["Workspace"] = 2] = "Workspace";
        ConfigurationTarget[ConfigurationTarget["WorkspaceFolder"] = 3] = "WorkspaceFolder";
    })(ConfigurationTarget = exports.ConfigurationTarget || (exports.ConfigurationTarget = {}));
    let RelativePattern = class RelativePattern {
        constructor(base, pattern) {
            if (typeof base !== 'string') {
                if (!base || !uri_1.URI.isUri(base) && !uri_1.URI.isUri(base.uri)) {
                    throw (0, errors_1.illegalArgument)('base');
                }
            }
            if (typeof pattern !== 'string') {
                throw (0, errors_1.illegalArgument)('pattern');
            }
            if (typeof base === 'string') {
                this.baseUri = uri_1.URI.file(base);
            }
            else if (uri_1.URI.isUri(base)) {
                this.baseUri = base;
            }
            else {
                this.baseUri = base.uri;
            }
            this.pattern = pattern;
        }
        get base() {
            return this._base;
        }
        set base(base) {
            this._base = base;
            this._baseUri = uri_1.URI.file(base);
        }
        get baseUri() {
            return this._baseUri;
        }
        set baseUri(baseUri) {
            this._baseUri = baseUri;
            this._base = baseUri.fsPath;
        }
        toJSON() {
            return {
                pattern: this.pattern,
                base: this.base,
                baseUri: this.baseUri.toJSON()
            };
        }
    };
    RelativePattern = __decorate([
        es5ClassCompat
    ], RelativePattern);
    exports.RelativePattern = RelativePattern;
    let Breakpoint = class Breakpoint {
        constructor(enabled, condition, hitCondition, logMessage) {
            this.enabled = typeof enabled === 'boolean' ? enabled : true;
            if (typeof condition === 'string') {
                this.condition = condition;
            }
            if (typeof hitCondition === 'string') {
                this.hitCondition = hitCondition;
            }
            if (typeof logMessage === 'string') {
                this.logMessage = logMessage;
            }
        }
        get id() {
            if (!this._id) {
                this._id = (0, uuid_1.generateUuid)();
            }
            return this._id;
        }
    };
    Breakpoint = __decorate([
        es5ClassCompat
    ], Breakpoint);
    exports.Breakpoint = Breakpoint;
    let SourceBreakpoint = class SourceBreakpoint extends Breakpoint {
        constructor(location, enabled, condition, hitCondition, logMessage) {
            super(enabled, condition, hitCondition, logMessage);
            if (location === null) {
                throw (0, errors_1.illegalArgument)('location');
            }
            this.location = location;
        }
    };
    SourceBreakpoint = __decorate([
        es5ClassCompat
    ], SourceBreakpoint);
    exports.SourceBreakpoint = SourceBreakpoint;
    let FunctionBreakpoint = class FunctionBreakpoint extends Breakpoint {
        constructor(functionName, enabled, condition, hitCondition, logMessage) {
            super(enabled, condition, hitCondition, logMessage);
            this.functionName = functionName;
        }
    };
    FunctionBreakpoint = __decorate([
        es5ClassCompat
    ], FunctionBreakpoint);
    exports.FunctionBreakpoint = FunctionBreakpoint;
    let DataBreakpoint = class DataBreakpoint extends Breakpoint {
        constructor(label, dataId, canPersist, enabled, condition, hitCondition, logMessage) {
            super(enabled, condition, hitCondition, logMessage);
            if (!dataId) {
                throw (0, errors_1.illegalArgument)('dataId');
            }
            this.label = label;
            this.dataId = dataId;
            this.canPersist = canPersist;
        }
    };
    DataBreakpoint = __decorate([
        es5ClassCompat
    ], DataBreakpoint);
    exports.DataBreakpoint = DataBreakpoint;
    let DebugAdapterExecutable = class DebugAdapterExecutable {
        constructor(command, args, options) {
            this.command = command;
            this.args = args || [];
            this.options = options;
        }
    };
    DebugAdapterExecutable = __decorate([
        es5ClassCompat
    ], DebugAdapterExecutable);
    exports.DebugAdapterExecutable = DebugAdapterExecutable;
    let DebugAdapterServer = class DebugAdapterServer {
        constructor(port, host) {
            this.port = port;
            this.host = host;
        }
    };
    DebugAdapterServer = __decorate([
        es5ClassCompat
    ], DebugAdapterServer);
    exports.DebugAdapterServer = DebugAdapterServer;
    let DebugAdapterNamedPipeServer = class DebugAdapterNamedPipeServer {
        constructor(path) {
            this.path = path;
        }
    };
    DebugAdapterNamedPipeServer = __decorate([
        es5ClassCompat
    ], DebugAdapterNamedPipeServer);
    exports.DebugAdapterNamedPipeServer = DebugAdapterNamedPipeServer;
    let DebugAdapterInlineImplementation = class DebugAdapterInlineImplementation {
        constructor(impl) {
            this.implementation = impl;
        }
    };
    DebugAdapterInlineImplementation = __decorate([
        es5ClassCompat
    ], DebugAdapterInlineImplementation);
    exports.DebugAdapterInlineImplementation = DebugAdapterInlineImplementation;
    let EvaluatableExpression = class EvaluatableExpression {
        constructor(range, expression) {
            this.range = range;
            this.expression = expression;
        }
    };
    EvaluatableExpression = __decorate([
        es5ClassCompat
    ], EvaluatableExpression);
    exports.EvaluatableExpression = EvaluatableExpression;
    var InlineCompletionTriggerKind;
    (function (InlineCompletionTriggerKind) {
        InlineCompletionTriggerKind[InlineCompletionTriggerKind["Automatic"] = 0] = "Automatic";
        InlineCompletionTriggerKind[InlineCompletionTriggerKind["Explicit"] = 1] = "Explicit";
    })(InlineCompletionTriggerKind = exports.InlineCompletionTriggerKind || (exports.InlineCompletionTriggerKind = {}));
    var InlineCompletionTriggerKindNew;
    (function (InlineCompletionTriggerKindNew) {
        InlineCompletionTriggerKindNew[InlineCompletionTriggerKindNew["Invoke"] = 0] = "Invoke";
        InlineCompletionTriggerKindNew[InlineCompletionTriggerKindNew["Automatic"] = 1] = "Automatic";
    })(InlineCompletionTriggerKindNew = exports.InlineCompletionTriggerKindNew || (exports.InlineCompletionTriggerKindNew = {}));
    let InlineValueText = class InlineValueText {
        constructor(range, text) {
            this.range = range;
            this.text = text;
        }
    };
    InlineValueText = __decorate([
        es5ClassCompat
    ], InlineValueText);
    exports.InlineValueText = InlineValueText;
    let InlineValueVariableLookup = class InlineValueVariableLookup {
        constructor(range, variableName, caseSensitiveLookup = true) {
            this.range = range;
            this.variableName = variableName;
            this.caseSensitiveLookup = caseSensitiveLookup;
        }
    };
    InlineValueVariableLookup = __decorate([
        es5ClassCompat
    ], InlineValueVariableLookup);
    exports.InlineValueVariableLookup = InlineValueVariableLookup;
    let InlineValueEvaluatableExpression = class InlineValueEvaluatableExpression {
        constructor(range, expression) {
            this.range = range;
            this.expression = expression;
        }
    };
    InlineValueEvaluatableExpression = __decorate([
        es5ClassCompat
    ], InlineValueEvaluatableExpression);
    exports.InlineValueEvaluatableExpression = InlineValueEvaluatableExpression;
    let InlineValueContext = class InlineValueContext {
        constructor(frameId, range) {
            this.frameId = frameId;
            this.stoppedLocation = range;
        }
    };
    InlineValueContext = __decorate([
        es5ClassCompat
    ], InlineValueContext);
    exports.InlineValueContext = InlineValueContext;
    //#region file api
    var FileChangeType;
    (function (FileChangeType) {
        FileChangeType[FileChangeType["Changed"] = 1] = "Changed";
        FileChangeType[FileChangeType["Created"] = 2] = "Created";
        FileChangeType[FileChangeType["Deleted"] = 3] = "Deleted";
    })(FileChangeType = exports.FileChangeType || (exports.FileChangeType = {}));
    let FileSystemError = FileSystemError_1 = class FileSystemError extends Error {
        constructor(uriOrMessage, code = files_1.FileSystemProviderErrorCode.Unknown, terminator) {
            var _b;
            super(uri_1.URI.isUri(uriOrMessage) ? uriOrMessage.toString(true) : uriOrMessage);
            this.code = (_b = terminator === null || terminator === void 0 ? void 0 : terminator.name) !== null && _b !== void 0 ? _b : 'Unknown';
            // mark the error as file system provider error so that
            // we can extract the error code on the receiving side
            (0, files_1.markAsFileSystemProviderError)(this, code);
            // workaround when extending builtin objects and when compiling to ES5, see:
            // https://github.com/microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            if (typeof Object.setPrototypeOf === 'function') {
                Object.setPrototypeOf(this, FileSystemError_1.prototype);
            }
            if (typeof Error.captureStackTrace === 'function' && typeof terminator === 'function') {
                // nice stack traces
                Error.captureStackTrace(this, terminator);
            }
        }
        static FileExists(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.FileExists, FileSystemError_1.FileExists);
        }
        static FileNotFound(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.FileNotFound, FileSystemError_1.FileNotFound);
        }
        static FileNotADirectory(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.FileNotADirectory, FileSystemError_1.FileNotADirectory);
        }
        static FileIsADirectory(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.FileIsADirectory, FileSystemError_1.FileIsADirectory);
        }
        static NoPermissions(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.NoPermissions, FileSystemError_1.NoPermissions);
        }
        static Unavailable(messageOrUri) {
            return new FileSystemError_1(messageOrUri, files_1.FileSystemProviderErrorCode.Unavailable, FileSystemError_1.Unavailable);
        }
    };
    FileSystemError = FileSystemError_1 = __decorate([
        es5ClassCompat
    ], FileSystemError);
    exports.FileSystemError = FileSystemError;
    //#endregion
    //#region folding api
    let FoldingRange = class FoldingRange {
        constructor(start, end, kind) {
            this.start = start;
            this.end = end;
            this.kind = kind;
        }
    };
    FoldingRange = __decorate([
        es5ClassCompat
    ], FoldingRange);
    exports.FoldingRange = FoldingRange;
    var FoldingRangeKind;
    (function (FoldingRangeKind) {
        FoldingRangeKind[FoldingRangeKind["Comment"] = 1] = "Comment";
        FoldingRangeKind[FoldingRangeKind["Imports"] = 2] = "Imports";
        FoldingRangeKind[FoldingRangeKind["Region"] = 3] = "Region";
    })(FoldingRangeKind = exports.FoldingRangeKind || (exports.FoldingRangeKind = {}));
    //#endregion
    //#region Comment
    var CommentThreadCollapsibleState;
    (function (CommentThreadCollapsibleState) {
        /**
         * Determines an item is collapsed
         */
        CommentThreadCollapsibleState[CommentThreadCollapsibleState["Collapsed"] = 0] = "Collapsed";
        /**
         * Determines an item is expanded
         */
        CommentThreadCollapsibleState[CommentThreadCollapsibleState["Expanded"] = 1] = "Expanded";
    })(CommentThreadCollapsibleState = exports.CommentThreadCollapsibleState || (exports.CommentThreadCollapsibleState = {}));
    var CommentMode;
    (function (CommentMode) {
        CommentMode[CommentMode["Editing"] = 0] = "Editing";
        CommentMode[CommentMode["Preview"] = 1] = "Preview";
    })(CommentMode = exports.CommentMode || (exports.CommentMode = {}));
    var CommentThreadState;
    (function (CommentThreadState) {
        CommentThreadState[CommentThreadState["Unresolved"] = 0] = "Unresolved";
        CommentThreadState[CommentThreadState["Resolved"] = 1] = "Resolved";
    })(CommentThreadState = exports.CommentThreadState || (exports.CommentThreadState = {}));
    //#endregion
    //#region Semantic Coloring
    class SemanticTokensLegend {
        constructor(tokenTypes, tokenModifiers = []) {
            this.tokenTypes = tokenTypes;
            this.tokenModifiers = tokenModifiers;
        }
    }
    exports.SemanticTokensLegend = SemanticTokensLegend;
    function isStrArrayOrUndefined(arg) {
        return ((typeof arg === 'undefined') || (0, types_1.isStringArray)(arg));
    }
    class SemanticTokensBuilder {
        constructor(legend) {
            this._prevLine = 0;
            this._prevChar = 0;
            this._dataIsSortedAndDeltaEncoded = true;
            this._data = [];
            this._dataLen = 0;
            this._tokenTypeStrToInt = new Map();
            this._tokenModifierStrToInt = new Map();
            this._hasLegend = false;
            if (legend) {
                this._hasLegend = true;
                for (let i = 0, len = legend.tokenTypes.length; i < len; i++) {
                    this._tokenTypeStrToInt.set(legend.tokenTypes[i], i);
                }
                for (let i = 0, len = legend.tokenModifiers.length; i < len; i++) {
                    this._tokenModifierStrToInt.set(legend.tokenModifiers[i], i);
                }
            }
        }
        push(arg0, arg1, arg2, arg3, arg4) {
            if (typeof arg0 === 'number' && typeof arg1 === 'number' && typeof arg2 === 'number' && typeof arg3 === 'number' && (typeof arg4 === 'number' || typeof arg4 === 'undefined')) {
                if (typeof arg4 === 'undefined') {
                    arg4 = 0;
                }
                // 1st overload
                return this._pushEncoded(arg0, arg1, arg2, arg3, arg4);
            }
            if (Range.isRange(arg0) && typeof arg1 === 'string' && isStrArrayOrUndefined(arg2)) {
                // 2nd overload
                return this._push(arg0, arg1, arg2);
            }
            throw (0, errors_1.illegalArgument)();
        }
        _push(range, tokenType, tokenModifiers) {
            if (!this._hasLegend) {
                throw new Error('Legend must be provided in constructor');
            }
            if (range.start.line !== range.end.line) {
                throw new Error('`range` cannot span multiple lines');
            }
            if (!this._tokenTypeStrToInt.has(tokenType)) {
                throw new Error('`tokenType` is not in the provided legend');
            }
            const line = range.start.line;
            const char = range.start.character;
            const length = range.end.character - range.start.character;
            const nTokenType = this._tokenTypeStrToInt.get(tokenType);
            let nTokenModifiers = 0;
            if (tokenModifiers) {
                for (const tokenModifier of tokenModifiers) {
                    if (!this._tokenModifierStrToInt.has(tokenModifier)) {
                        throw new Error('`tokenModifier` is not in the provided legend');
                    }
                    const nTokenModifier = this._tokenModifierStrToInt.get(tokenModifier);
                    nTokenModifiers |= (1 << nTokenModifier) >>> 0;
                }
            }
            this._pushEncoded(line, char, length, nTokenType, nTokenModifiers);
        }
        _pushEncoded(line, char, length, tokenType, tokenModifiers) {
            if (this._dataIsSortedAndDeltaEncoded && (line < this._prevLine || (line === this._prevLine && char < this._prevChar))) {
                // push calls were ordered and are no longer ordered
                this._dataIsSortedAndDeltaEncoded = false;
                // Remove delta encoding from data
                const tokenCount = (this._data.length / 5) | 0;
                let prevLine = 0;
                let prevChar = 0;
                for (let i = 0; i < tokenCount; i++) {
                    let line = this._data[5 * i];
                    let char = this._data[5 * i + 1];
                    if (line === 0) {
                        // on the same line as previous token
                        line = prevLine;
                        char += prevChar;
                    }
                    else {
                        // on a different line than previous token
                        line += prevLine;
                    }
                    this._data[5 * i] = line;
                    this._data[5 * i + 1] = char;
                    prevLine = line;
                    prevChar = char;
                }
            }
            let pushLine = line;
            let pushChar = char;
            if (this._dataIsSortedAndDeltaEncoded && this._dataLen > 0) {
                pushLine -= this._prevLine;
                if (pushLine === 0) {
                    pushChar -= this._prevChar;
                }
            }
            this._data[this._dataLen++] = pushLine;
            this._data[this._dataLen++] = pushChar;
            this._data[this._dataLen++] = length;
            this._data[this._dataLen++] = tokenType;
            this._data[this._dataLen++] = tokenModifiers;
            this._prevLine = line;
            this._prevChar = char;
        }
        static _sortAndDeltaEncode(data) {
            let pos = [];
            const tokenCount = (data.length / 5) | 0;
            for (let i = 0; i < tokenCount; i++) {
                pos[i] = i;
            }
            pos.sort((a, b) => {
                const aLine = data[5 * a];
                const bLine = data[5 * b];
                if (aLine === bLine) {
                    const aChar = data[5 * a + 1];
                    const bChar = data[5 * b + 1];
                    return aChar - bChar;
                }
                return aLine - bLine;
            });
            const result = new Uint32Array(data.length);
            let prevLine = 0;
            let prevChar = 0;
            for (let i = 0; i < tokenCount; i++) {
                const srcOffset = 5 * pos[i];
                const line = data[srcOffset + 0];
                const char = data[srcOffset + 1];
                const length = data[srcOffset + 2];
                const tokenType = data[srcOffset + 3];
                const tokenModifiers = data[srcOffset + 4];
                const pushLine = line - prevLine;
                const pushChar = (pushLine === 0 ? char - prevChar : char);
                const dstOffset = 5 * i;
                result[dstOffset + 0] = pushLine;
                result[dstOffset + 1] = pushChar;
                result[dstOffset + 2] = length;
                result[dstOffset + 3] = tokenType;
                result[dstOffset + 4] = tokenModifiers;
                prevLine = line;
                prevChar = char;
            }
            return result;
        }
        build(resultId) {
            if (!this._dataIsSortedAndDeltaEncoded) {
                return new SemanticTokens(SemanticTokensBuilder._sortAndDeltaEncode(this._data), resultId);
            }
            return new SemanticTokens(new Uint32Array(this._data), resultId);
        }
    }
    exports.SemanticTokensBuilder = SemanticTokensBuilder;
    class SemanticTokens {
        constructor(data, resultId) {
            this.resultId = resultId;
            this.data = data;
        }
    }
    exports.SemanticTokens = SemanticTokens;
    class SemanticTokensEdit {
        constructor(start, deleteCount, data) {
            this.start = start;
            this.deleteCount = deleteCount;
            this.data = data;
        }
    }
    exports.SemanticTokensEdit = SemanticTokensEdit;
    class SemanticTokensEdits {
        constructor(edits, resultId) {
            this.resultId = resultId;
            this.edits = edits;
        }
    }
    exports.SemanticTokensEdits = SemanticTokensEdits;
    //#endregion
    //#region debug
    var DebugConsoleMode;
    (function (DebugConsoleMode) {
        /**
         * Debug session should have a separate debug console.
         */
        DebugConsoleMode[DebugConsoleMode["Separate"] = 0] = "Separate";
        /**
         * Debug session should share debug console with its parent session.
         * This value has no effect for sessions which do not have a parent session.
         */
        DebugConsoleMode[DebugConsoleMode["MergeWithParent"] = 1] = "MergeWithParent";
    })(DebugConsoleMode = exports.DebugConsoleMode || (exports.DebugConsoleMode = {}));
    //#endregion
    let QuickInputButtons = class QuickInputButtons {
        constructor() { }
    };
    QuickInputButtons.Back = { iconPath: new ThemeIcon('arrow-left') };
    QuickInputButtons = __decorate([
        es5ClassCompat
    ], QuickInputButtons);
    exports.QuickInputButtons = QuickInputButtons;
    var QuickPickItemKind;
    (function (QuickPickItemKind) {
        QuickPickItemKind[QuickPickItemKind["Separator"] = -1] = "Separator";
        QuickPickItemKind[QuickPickItemKind["Default"] = 0] = "Default";
    })(QuickPickItemKind = exports.QuickPickItemKind || (exports.QuickPickItemKind = {}));
    var InputBoxValidationSeverity;
    (function (InputBoxValidationSeverity) {
        InputBoxValidationSeverity[InputBoxValidationSeverity["Info"] = 1] = "Info";
        InputBoxValidationSeverity[InputBoxValidationSeverity["Warning"] = 2] = "Warning";
        InputBoxValidationSeverity[InputBoxValidationSeverity["Error"] = 3] = "Error";
    })(InputBoxValidationSeverity = exports.InputBoxValidationSeverity || (exports.InputBoxValidationSeverity = {}));
    var ExtensionKind;
    (function (ExtensionKind) {
        ExtensionKind[ExtensionKind["UI"] = 1] = "UI";
        ExtensionKind[ExtensionKind["Workspace"] = 2] = "Workspace";
    })(ExtensionKind = exports.ExtensionKind || (exports.ExtensionKind = {}));
    class FileDecoration {
        constructor(badge, tooltip, color) {
            this.badge = badge;
            this.tooltip = tooltip;
            this.color = color;
        }
        static validate(d) {
            if (d.badge) {
                let len = (0, strings_1.nextCharLength)(d.badge, 0);
                if (len < d.badge.length) {
                    len += (0, strings_1.nextCharLength)(d.badge, len);
                }
                if (d.badge.length > len) {
                    throw new Error(`The 'badge'-property must be undefined or a short character`);
                }
            }
            if (!d.color && !d.badge && !d.tooltip) {
                throw new Error(`The decoration is empty`);
            }
            return true;
        }
    }
    exports.FileDecoration = FileDecoration;
    //#region Theming
    let ColorTheme = class ColorTheme {
        constructor(kind) {
            this.kind = kind;
        }
    };
    ColorTheme = __decorate([
        es5ClassCompat
    ], ColorTheme);
    exports.ColorTheme = ColorTheme;
    var ColorThemeKind;
    (function (ColorThemeKind) {
        ColorThemeKind[ColorThemeKind["Light"] = 1] = "Light";
        ColorThemeKind[ColorThemeKind["Dark"] = 2] = "Dark";
        ColorThemeKind[ColorThemeKind["HighContrast"] = 3] = "HighContrast";
        ColorThemeKind[ColorThemeKind["HighContrastLight"] = 4] = "HighContrastLight";
    })(ColorThemeKind = exports.ColorThemeKind || (exports.ColorThemeKind = {}));
    //#endregion Theming
    //#region Notebook
    class NotebookRange {
        constructor(start, end) {
            if (start < 0) {
                throw (0, errors_1.illegalArgument)('start must be positive');
            }
            if (end < 0) {
                throw (0, errors_1.illegalArgument)('end must be positive');
            }
            if (start <= end) {
                this._start = start;
                this._end = end;
            }
            else {
                this._start = end;
                this._end = start;
            }
        }
        static isNotebookRange(thing) {
            if (thing instanceof NotebookRange) {
                return true;
            }
            if (!thing) {
                return false;
            }
            return typeof thing.start === 'number'
                && typeof thing.end === 'number';
        }
        get start() {
            return this._start;
        }
        get end() {
            return this._end;
        }
        get isEmpty() {
            return this._start === this._end;
        }
        with(change) {
            let start = this._start;
            let end = this._end;
            if (change.start !== undefined) {
                start = change.start;
            }
            if (change.end !== undefined) {
                end = change.end;
            }
            if (start === this._start && end === this._end) {
                return this;
            }
            return new NotebookRange(start, end);
        }
    }
    exports.NotebookRange = NotebookRange;
    class NotebookCellData {
        constructor(kind, value, languageId, mime, outputs, metadata, executionSummary) {
            this.kind = kind;
            this.value = value;
            this.languageId = languageId;
            this.mime = mime;
            this.outputs = outputs !== null && outputs !== void 0 ? outputs : [];
            this.metadata = metadata;
            this.executionSummary = executionSummary;
            NotebookCellData.validate(this);
        }
        static validate(data) {
            if (typeof data.kind !== 'number') {
                throw new Error('NotebookCellData MUST have \'kind\' property');
            }
            if (typeof data.value !== 'string') {
                throw new Error('NotebookCellData MUST have \'value\' property');
            }
            if (typeof data.languageId !== 'string') {
                throw new Error('NotebookCellData MUST have \'languageId\' property');
            }
        }
        static isNotebookCellDataArray(value) {
            return Array.isArray(value) && value.every(elem => NotebookCellData.isNotebookCellData(elem));
        }
        static isNotebookCellData(value) {
            // return value instanceof NotebookCellData;
            return true;
        }
    }
    exports.NotebookCellData = NotebookCellData;
    class NotebookData {
        constructor(cells) {
            this.cells = cells;
        }
    }
    exports.NotebookData = NotebookData;
    class NotebookCellOutputItem {
        constructor(data, mime) {
            this.data = data;
            this.mime = mime;
            const mimeNormalized = (0, mime_1.normalizeMimeType)(mime, true);
            if (!mimeNormalized) {
                throw new Error(`INVALID mime type: ${mime}. Must be in the format "type/subtype[;optionalparameter]"`);
            }
            this.mime = mimeNormalized;
        }
        static isNotebookCellOutputItem(obj) {
            if (obj instanceof NotebookCellOutputItem) {
                return true;
            }
            if (!obj) {
                return false;
            }
            return typeof obj.mime === 'string'
                && obj.data instanceof Uint8Array;
        }
        static error(err) {
            const obj = {
                name: err.name,
                message: err.message,
                stack: err.stack
            };
            return NotebookCellOutputItem.json(obj, 'application/vnd.code.notebook.error');
        }
        static stdout(value) {
            return NotebookCellOutputItem.text(value, 'application/vnd.code.notebook.stdout');
        }
        static stderr(value) {
            return NotebookCellOutputItem.text(value, 'application/vnd.code.notebook.stderr');
        }
        static bytes(value, mime = 'application/octet-stream') {
            return new NotebookCellOutputItem(value, mime);
        }
        static text(value, mime = mime_1.Mimes.text) {
            const bytes = __classPrivateFieldGet(NotebookCellOutputItem, _a, "f", _NotebookCellOutputItem_encoder).encode(String(value));
            return new NotebookCellOutputItem(bytes, mime);
        }
        static json(value, mime = 'text/x-json') {
            const rawStr = JSON.stringify(value, undefined, '\t');
            return NotebookCellOutputItem.text(rawStr, mime);
        }
    }
    exports.NotebookCellOutputItem = NotebookCellOutputItem;
    _a = NotebookCellOutputItem;
    _NotebookCellOutputItem_encoder = { value: new TextEncoder() };
    class NotebookCellOutput {
        constructor(items, idOrMetadata, metadata) {
            this.items = NotebookCellOutput.ensureUniqueMimeTypes(items, true);
            if (typeof idOrMetadata === 'string') {
                this.id = idOrMetadata;
                this.metadata = metadata;
            }
            else {
                this.id = (0, uuid_1.generateUuid)();
                this.metadata = idOrMetadata !== null && idOrMetadata !== void 0 ? idOrMetadata : metadata;
            }
        }
        static isNotebookCellOutput(candidate) {
            if (candidate instanceof NotebookCellOutput) {
                return true;
            }
            if (!candidate || typeof candidate !== 'object') {
                return false;
            }
            return typeof candidate.id === 'string' && (0, types_1.isArray)(candidate.items);
        }
        static ensureUniqueMimeTypes(items, warn = false) {
            const seen = new Set();
            const removeIdx = new Set();
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const normalMime = (0, mime_1.normalizeMimeType)(item.mime);
                if (!seen.has(normalMime)) {
                    seen.add(normalMime);
                    continue;
                }
                // duplicated mime types... first has won
                removeIdx.add(i);
                if (warn) {
                    console.warn(`DUPLICATED mime type '${item.mime}' will be dropped`);
                }
            }
            if (removeIdx.size === 0) {
                return items;
            }
            return items.filter((_item, index) => !removeIdx.has(index));
        }
    }
    exports.NotebookCellOutput = NotebookCellOutput;
    var NotebookCellKind;
    (function (NotebookCellKind) {
        NotebookCellKind[NotebookCellKind["Markup"] = 1] = "Markup";
        NotebookCellKind[NotebookCellKind["Code"] = 2] = "Code";
    })(NotebookCellKind = exports.NotebookCellKind || (exports.NotebookCellKind = {}));
    var NotebookCellExecutionState;
    (function (NotebookCellExecutionState) {
        NotebookCellExecutionState[NotebookCellExecutionState["Idle"] = 1] = "Idle";
        NotebookCellExecutionState[NotebookCellExecutionState["Pending"] = 2] = "Pending";
        NotebookCellExecutionState[NotebookCellExecutionState["Executing"] = 3] = "Executing";
    })(NotebookCellExecutionState = exports.NotebookCellExecutionState || (exports.NotebookCellExecutionState = {}));
    var NotebookCellStatusBarAlignment;
    (function (NotebookCellStatusBarAlignment) {
        NotebookCellStatusBarAlignment[NotebookCellStatusBarAlignment["Left"] = 1] = "Left";
        NotebookCellStatusBarAlignment[NotebookCellStatusBarAlignment["Right"] = 2] = "Right";
    })(NotebookCellStatusBarAlignment = exports.NotebookCellStatusBarAlignment || (exports.NotebookCellStatusBarAlignment = {}));
    var NotebookEditorRevealType;
    (function (NotebookEditorRevealType) {
        NotebookEditorRevealType[NotebookEditorRevealType["Default"] = 0] = "Default";
        NotebookEditorRevealType[NotebookEditorRevealType["InCenter"] = 1] = "InCenter";
        NotebookEditorRevealType[NotebookEditorRevealType["InCenterIfOutsideViewport"] = 2] = "InCenterIfOutsideViewport";
        NotebookEditorRevealType[NotebookEditorRevealType["AtTop"] = 3] = "AtTop";
    })(NotebookEditorRevealType = exports.NotebookEditorRevealType || (exports.NotebookEditorRevealType = {}));
    class NotebookCellStatusBarItem {
        constructor(text, alignment) {
            this.text = text;
            this.alignment = alignment;
        }
    }
    exports.NotebookCellStatusBarItem = NotebookCellStatusBarItem;
    var NotebookControllerAffinity;
    (function (NotebookControllerAffinity) {
        NotebookControllerAffinity[NotebookControllerAffinity["Default"] = 1] = "Default";
        NotebookControllerAffinity[NotebookControllerAffinity["Preferred"] = 2] = "Preferred";
    })(NotebookControllerAffinity = exports.NotebookControllerAffinity || (exports.NotebookControllerAffinity = {}));
    class NotebookRendererScript {
        constructor(uri, provides = []) {
            this.uri = uri;
            this.provides = (0, arrays_1.asArray)(provides);
        }
    }
    exports.NotebookRendererScript = NotebookRendererScript;
    //#endregion
    //#region Timeline
    let TimelineItem = class TimelineItem {
        constructor(label, timestamp) {
            this.label = label;
            this.timestamp = timestamp;
        }
    };
    TimelineItem = __decorate([
        es5ClassCompat
    ], TimelineItem);
    exports.TimelineItem = TimelineItem;
    //#endregion Timeline
    //#region ExtensionContext
    var ExtensionMode;
    (function (ExtensionMode) {
        /**
         * The extension is installed normally (for example, from the marketplace
         * or VSIX) in VS Code.
         */
        ExtensionMode[ExtensionMode["Production"] = 1] = "Production";
        /**
         * The extension is running from an `--extensionDevelopmentPath` provided
         * when launching VS Code.
         */
        ExtensionMode[ExtensionMode["Development"] = 2] = "Development";
        /**
         * The extension is running from an `--extensionDevelopmentPath` and
         * the extension host is running unit tests.
         */
        ExtensionMode[ExtensionMode["Test"] = 3] = "Test";
    })(ExtensionMode = exports.ExtensionMode || (exports.ExtensionMode = {}));
    var ExtensionRuntime;
    (function (ExtensionRuntime) {
        /**
         * The extension is running in a NodeJS extension host. Runtime access to NodeJS APIs is available.
         */
        ExtensionRuntime[ExtensionRuntime["Node"] = 1] = "Node";
        /**
         * The extension is running in a Webworker extension host. Runtime access is limited to Webworker APIs.
         */
        ExtensionRuntime[ExtensionRuntime["Webworker"] = 2] = "Webworker";
    })(ExtensionRuntime = exports.ExtensionRuntime || (exports.ExtensionRuntime = {}));
    //#endregion ExtensionContext
    var StandardTokenType;
    (function (StandardTokenType) {
        StandardTokenType[StandardTokenType["Other"] = 0] = "Other";
        StandardTokenType[StandardTokenType["Comment"] = 1] = "Comment";
        StandardTokenType[StandardTokenType["String"] = 2] = "String";
        StandardTokenType[StandardTokenType["RegEx"] = 3] = "RegEx";
    })(StandardTokenType = exports.StandardTokenType || (exports.StandardTokenType = {}));
    class LinkedEditingRanges {
        constructor(ranges, wordPattern) {
            this.ranges = ranges;
            this.wordPattern = wordPattern;
        }
    }
    exports.LinkedEditingRanges = LinkedEditingRanges;
    //#region ports
    class PortAttributes {
        constructor(port, autoForwardAction) {
            this._port = port;
            this._autoForwardAction = autoForwardAction;
        }
        get port() {
            return this._port;
        }
        get autoForwardAction() {
            return this._autoForwardAction;
        }
    }
    exports.PortAttributes = PortAttributes;
    //#endregion ports
    //#region Testing
    var TestResultState;
    (function (TestResultState) {
        TestResultState[TestResultState["Queued"] = 1] = "Queued";
        TestResultState[TestResultState["Running"] = 2] = "Running";
        TestResultState[TestResultState["Passed"] = 3] = "Passed";
        TestResultState[TestResultState["Failed"] = 4] = "Failed";
        TestResultState[TestResultState["Skipped"] = 5] = "Skipped";
        TestResultState[TestResultState["Errored"] = 6] = "Errored";
    })(TestResultState = exports.TestResultState || (exports.TestResultState = {}));
    var TestRunProfileKind;
    (function (TestRunProfileKind) {
        TestRunProfileKind[TestRunProfileKind["Run"] = 1] = "Run";
        TestRunProfileKind[TestRunProfileKind["Debug"] = 2] = "Debug";
        TestRunProfileKind[TestRunProfileKind["Coverage"] = 3] = "Coverage";
    })(TestRunProfileKind = exports.TestRunProfileKind || (exports.TestRunProfileKind = {}));
    let TestRunRequest = class TestRunRequest {
        constructor(include = undefined, exclude = undefined, profile = undefined) {
            this.include = include;
            this.exclude = exclude;
            this.profile = profile;
        }
    };
    TestRunRequest = __decorate([
        es5ClassCompat
    ], TestRunRequest);
    exports.TestRunRequest = TestRunRequest;
    let TestMessage = TestMessage_1 = class TestMessage {
        constructor(message) {
            this.message = message;
        }
        static diff(message, expected, actual) {
            const msg = new TestMessage_1(message);
            msg.expectedOutput = expected;
            msg.actualOutput = actual;
            return msg;
        }
    };
    TestMessage = TestMessage_1 = __decorate([
        es5ClassCompat
    ], TestMessage);
    exports.TestMessage = TestMessage;
    let TestTag = class TestTag {
        constructor(id) {
            this.id = id;
        }
    };
    TestTag = __decorate([
        es5ClassCompat
    ], TestTag);
    exports.TestTag = TestTag;
    //#endregion
    //#region Test Coverage
    let CoveredCount = class CoveredCount {
        constructor(covered, total) {
            this.covered = covered;
            this.total = total;
        }
    };
    CoveredCount = __decorate([
        es5ClassCompat
    ], CoveredCount);
    exports.CoveredCount = CoveredCount;
    let FileCoverage = FileCoverage_1 = class FileCoverage {
        constructor(uri, statementCoverage, branchCoverage, functionCoverage) {
            this.uri = uri;
            this.statementCoverage = statementCoverage;
            this.branchCoverage = branchCoverage;
            this.functionCoverage = functionCoverage;
        }
        static fromDetails(uri, details) {
            const statements = new CoveredCount(0, 0);
            const branches = new CoveredCount(0, 0);
            const fn = new CoveredCount(0, 0);
            for (const detail of details) {
                if ('branches' in detail) {
                    statements.total += 1;
                    statements.covered += detail.executionCount > 0 ? 1 : 0;
                    for (const branch of detail.branches) {
                        branches.total += 1;
                        branches.covered += branch.executionCount > 0 ? 1 : 0;
                    }
                }
                else {
                    fn.total += 1;
                    fn.covered += detail.executionCount > 0 ? 1 : 0;
                }
            }
            const coverage = new FileCoverage_1(uri, statements, branches.total > 0 ? branches : undefined, fn.total > 0 ? fn : undefined);
            coverage.detailedCoverage = details;
            return coverage;
        }
    };
    FileCoverage = FileCoverage_1 = __decorate([
        es5ClassCompat
    ], FileCoverage);
    exports.FileCoverage = FileCoverage;
    let StatementCoverage = class StatementCoverage {
        constructor(executionCount, location, branches = []) {
            this.executionCount = executionCount;
            this.location = location;
            this.branches = branches;
        }
    };
    StatementCoverage = __decorate([
        es5ClassCompat
    ], StatementCoverage);
    exports.StatementCoverage = StatementCoverage;
    let BranchCoverage = class BranchCoverage {
        constructor(executionCount, location) {
            this.executionCount = executionCount;
            this.location = location;
        }
    };
    BranchCoverage = __decorate([
        es5ClassCompat
    ], BranchCoverage);
    exports.BranchCoverage = BranchCoverage;
    let FunctionCoverage = class FunctionCoverage {
        constructor(executionCount, location) {
            this.executionCount = executionCount;
            this.location = location;
        }
    };
    FunctionCoverage = __decorate([
        es5ClassCompat
    ], FunctionCoverage);
    exports.FunctionCoverage = FunctionCoverage;
    //#endregion
    var ExternalUriOpenerPriority;
    (function (ExternalUriOpenerPriority) {
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["None"] = 0] = "None";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Option"] = 1] = "Option";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Default"] = 2] = "Default";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Preferred"] = 3] = "Preferred";
    })(ExternalUriOpenerPriority = exports.ExternalUriOpenerPriority || (exports.ExternalUriOpenerPriority = {}));
    var WorkspaceTrustState;
    (function (WorkspaceTrustState) {
        WorkspaceTrustState[WorkspaceTrustState["Untrusted"] = 0] = "Untrusted";
        WorkspaceTrustState[WorkspaceTrustState["Trusted"] = 1] = "Trusted";
        WorkspaceTrustState[WorkspaceTrustState["Unspecified"] = 2] = "Unspecified";
    })(WorkspaceTrustState = exports.WorkspaceTrustState || (exports.WorkspaceTrustState = {}));
    var PortAutoForwardAction;
    (function (PortAutoForwardAction) {
        PortAutoForwardAction[PortAutoForwardAction["Notify"] = 1] = "Notify";
        PortAutoForwardAction[PortAutoForwardAction["OpenBrowser"] = 2] = "OpenBrowser";
        PortAutoForwardAction[PortAutoForwardAction["OpenPreview"] = 3] = "OpenPreview";
        PortAutoForwardAction[PortAutoForwardAction["Silent"] = 4] = "Silent";
        PortAutoForwardAction[PortAutoForwardAction["Ignore"] = 5] = "Ignore";
        PortAutoForwardAction[PortAutoForwardAction["OpenBrowserOnce"] = 6] = "OpenBrowserOnce";
    })(PortAutoForwardAction = exports.PortAutoForwardAction || (exports.PortAutoForwardAction = {}));
    class TypeHierarchyItem {
        constructor(kind, name, detail, uri, range, selectionRange) {
            this.kind = kind;
            this.name = name;
            this.detail = detail;
            this.uri = uri;
            this.range = range;
            this.selectionRange = selectionRange;
        }
    }
    exports.TypeHierarchyItem = TypeHierarchyItem;
    //#region Tab Inputs
    class TextTabInput {
        constructor(uri) {
            this.uri = uri;
        }
    }
    exports.TextTabInput = TextTabInput;
    class TextDiffTabInput {
        constructor(original, modified) {
            this.original = original;
            this.modified = modified;
        }
    }
    exports.TextDiffTabInput = TextDiffTabInput;
    class CustomEditorTabInput {
        constructor(uri, viewType) {
            this.uri = uri;
            this.viewType = viewType;
        }
    }
    exports.CustomEditorTabInput = CustomEditorTabInput;
    class WebviewEditorTabInput {
        constructor(viewType) {
            this.viewType = viewType;
        }
    }
    exports.WebviewEditorTabInput = WebviewEditorTabInput;
    class NotebookEditorTabInput {
        constructor(uri, notebookType) {
            this.uri = uri;
            this.notebookType = notebookType;
        }
    }
    exports.NotebookEditorTabInput = NotebookEditorTabInput;
    class NotebookDiffEditorTabInput {
        constructor(original, modified, notebookType) {
            this.original = original;
            this.modified = modified;
            this.notebookType = notebookType;
        }
    }
    exports.NotebookDiffEditorTabInput = NotebookDiffEditorTabInput;
    class TerminalEditorTabInput {
        constructor() { }
    }
    exports.TerminalEditorTabInput = TerminalEditorTabInput;
});
//#endregion
//# sourceMappingURL=extHostTypes.js.map