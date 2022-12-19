/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/base/common/objects", "vs/workbench/api/common/extHostTypeConverters", "vs/workbench/api/common/extHostTypes", "vs/editor/common/languages", "./extHost.protocol", "vs/base/common/strings", "vs/editor/common/core/range", "vs/base/common/arrays", "vs/base/common/types", "vs/editor/common/core/selection", "vs/base/common/cancellation", "vs/base/common/lifecycle", "vs/editor/common/services/semanticTokensDto", "vs/base/common/idGenerator", "./cache", "vs/base/common/stopwatch", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/async", "vs/workbench/services/extensions/common/extensions", "vs/workbench/api/common/shared/dataTransfer"], function (require, exports, uri_1, objects_1, typeConvert, extHostTypes_1, languages, extHostProtocol, strings_1, range_1, arrays_1, types_1, selection_1, cancellation_1, lifecycle_1, semanticTokensDto_1, idGenerator_1, cache_1, stopwatch_1, errors_1, event_1, async_1, extensions_1, dataTransfer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLanguageFeatures = exports.InlineCompletionController = exports.DocumentRangeSemanticTokensAdapter = exports.DocumentSemanticTokensAdapter = void 0;
    // --- adapter
    class DocumentSymbolAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDocumentSymbols(resource, token) {
            const doc = this._documents.getDocument(resource);
            const value = await this._provider.provideDocumentSymbols(doc, token);
            if ((0, arrays_1.isFalsyOrEmpty)(value)) {
                return undefined;
            }
            else if (value[0] instanceof extHostTypes_1.DocumentSymbol) {
                return value.map(typeConvert.DocumentSymbol.from);
            }
            else {
                return DocumentSymbolAdapter._asDocumentSymbolTree(value);
            }
        }
        static _asDocumentSymbolTree(infos) {
            var _a;
            // first sort by start (and end) and then loop over all elements
            // and build a tree based on containment.
            infos = infos.slice(0).sort((a, b) => {
                let res = a.location.range.start.compareTo(b.location.range.start);
                if (res === 0) {
                    res = b.location.range.end.compareTo(a.location.range.end);
                }
                return res;
            });
            const res = [];
            const parentStack = [];
            for (const info of infos) {
                const element = {
                    name: info.name || '!!MISSING: name!!',
                    kind: typeConvert.SymbolKind.from(info.kind),
                    tags: ((_a = info.tags) === null || _a === void 0 ? void 0 : _a.map(typeConvert.SymbolTag.from)) || [],
                    detail: '',
                    containerName: info.containerName,
                    range: typeConvert.Range.from(info.location.range),
                    selectionRange: typeConvert.Range.from(info.location.range),
                    children: []
                };
                while (true) {
                    if (parentStack.length === 0) {
                        parentStack.push(element);
                        res.push(element);
                        break;
                    }
                    const parent = parentStack[parentStack.length - 1];
                    if (range_1.Range.containsRange(parent.range, element.range) && !range_1.Range.equalsRange(parent.range, element.range)) {
                        if (parent.children) {
                            parent.children.push(element);
                        }
                        parentStack.push(element);
                        break;
                    }
                    parentStack.pop();
                }
            }
            return res;
        }
    }
    class CodeLensAdapter {
        constructor(_documents, _commands, _provider) {
            this._documents = _documents;
            this._commands = _commands;
            this._provider = _provider;
            this._cache = new cache_1.Cache('CodeLens');
            this._disposables = new Map();
        }
        async provideCodeLenses(resource, token) {
            const doc = this._documents.getDocument(resource);
            const lenses = await this._provider.provideCodeLenses(doc, token);
            if (!lenses || token.isCancellationRequested) {
                return undefined;
            }
            const cacheId = this._cache.add(lenses);
            const disposables = new lifecycle_1.DisposableStore();
            this._disposables.set(cacheId, disposables);
            const result = {
                cacheId,
                lenses: [],
            };
            for (let i = 0; i < lenses.length; i++) {
                result.lenses.push({
                    cacheId: [cacheId, i],
                    range: typeConvert.Range.from(lenses[i].range),
                    command: this._commands.toInternal(lenses[i].command, disposables)
                });
            }
            return result;
        }
        async resolveCodeLens(symbol, token) {
            var _a;
            const lens = symbol.cacheId && this._cache.get(...symbol.cacheId);
            if (!lens) {
                return undefined;
            }
            let resolvedLens;
            if (typeof this._provider.resolveCodeLens !== 'function' || lens.isResolved) {
                resolvedLens = lens;
            }
            else {
                resolvedLens = await this._provider.resolveCodeLens(lens, token);
            }
            if (!resolvedLens) {
                resolvedLens = lens;
            }
            if (token.isCancellationRequested) {
                return undefined;
            }
            const disposables = symbol.cacheId && this._disposables.get(symbol.cacheId[0]);
            if (!disposables) {
                // disposed in the meantime
                return undefined;
            }
            symbol.command = this._commands.toInternal((_a = resolvedLens.command) !== null && _a !== void 0 ? _a : CodeLensAdapter._badCmd, disposables);
            return symbol;
        }
        releaseCodeLenses(cachedId) {
            var _a;
            (_a = this._disposables.get(cachedId)) === null || _a === void 0 ? void 0 : _a.dispose();
            this._disposables.delete(cachedId);
            this._cache.delete(cachedId);
        }
    }
    CodeLensAdapter._badCmd = { command: 'missing', title: '!!MISSING: command!!' };
    function convertToLocationLinks(value) {
        if (Array.isArray(value)) {
            return value.map(typeConvert.DefinitionLink.from);
        }
        else if (value) {
            return [typeConvert.DefinitionLink.from(value)];
        }
        return [];
    }
    class DefinitionAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDefinition(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideDefinition(doc, pos, token);
            return convertToLocationLinks(value);
        }
    }
    class DeclarationAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDeclaration(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideDeclaration(doc, pos, token);
            return convertToLocationLinks(value);
        }
    }
    class ImplementationAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideImplementation(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideImplementation(doc, pos, token);
            return convertToLocationLinks(value);
        }
    }
    class TypeDefinitionAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideTypeDefinition(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideTypeDefinition(doc, pos, token);
            return convertToLocationLinks(value);
        }
    }
    class HoverAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideHover(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideHover(doc, pos, token);
            if (!value || (0, arrays_1.isFalsyOrEmpty)(value.contents)) {
                return undefined;
            }
            if (!value.range) {
                value.range = doc.getWordRangeAtPosition(pos);
            }
            if (!value.range) {
                value.range = new extHostTypes_1.Range(pos, pos);
            }
            return typeConvert.Hover.from(value);
        }
    }
    class EvaluatableExpressionAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideEvaluatableExpression(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideEvaluatableExpression(doc, pos, token);
            if (value) {
                return typeConvert.EvaluatableExpression.from(value);
            }
            return undefined;
        }
    }
    class InlineValuesAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideInlineValues(resource, viewPort, context, token) {
            const doc = this._documents.getDocument(resource);
            const value = await this._provider.provideInlineValues(doc, typeConvert.Range.to(viewPort), typeConvert.InlineValueContext.to(context), token);
            if (Array.isArray(value)) {
                return value.map(iv => typeConvert.InlineValue.from(iv));
            }
            return undefined;
        }
    }
    class DocumentHighlightAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDocumentHighlights(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideDocumentHighlights(doc, pos, token);
            if (Array.isArray(value)) {
                return value.map(typeConvert.DocumentHighlight.from);
            }
            return undefined;
        }
    }
    class LinkedEditingRangeAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideLinkedEditingRanges(resource, position, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideLinkedEditingRanges(doc, pos, token);
            if (value && Array.isArray(value.ranges)) {
                return {
                    ranges: (0, arrays_1.coalesce)(value.ranges.map(typeConvert.Range.from)),
                    wordPattern: value.wordPattern
                };
            }
            return undefined;
        }
    }
    class ReferenceAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideReferences(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideReferences(doc, pos, context, token);
            if (Array.isArray(value)) {
                return value.map(typeConvert.location.from);
            }
            return undefined;
        }
    }
    class CodeActionAdapter {
        constructor(_documents, _commands, _diagnostics, _provider, _logService, _extension, _apiDeprecation) {
            this._documents = _documents;
            this._commands = _commands;
            this._diagnostics = _diagnostics;
            this._provider = _provider;
            this._logService = _logService;
            this._extension = _extension;
            this._apiDeprecation = _apiDeprecation;
            this._cache = new cache_1.Cache('CodeAction');
            this._disposables = new Map();
        }
        async provideCodeActions(resource, rangeOrSelection, context, token) {
            var _a;
            const doc = this._documents.getDocument(resource);
            const ran = selection_1.Selection.isISelection(rangeOrSelection)
                ? typeConvert.Selection.to(rangeOrSelection)
                : typeConvert.Range.to(rangeOrSelection);
            const allDiagnostics = [];
            for (const diagnostic of this._diagnostics.getDiagnostics(resource)) {
                if (ran.intersection(diagnostic.range)) {
                    const newLen = allDiagnostics.push(diagnostic);
                    if (newLen > CodeActionAdapter._maxCodeActionsPerFile) {
                        break;
                    }
                }
            }
            const codeActionContext = {
                diagnostics: allDiagnostics,
                only: context.only ? new extHostTypes_1.CodeActionKind(context.only) : undefined,
                triggerKind: typeConvert.CodeActionTriggerKind.to(context.trigger),
            };
            const commandsOrActions = await this._provider.provideCodeActions(doc, ran, codeActionContext, token);
            if (!(0, arrays_1.isNonEmptyArray)(commandsOrActions) || token.isCancellationRequested) {
                return undefined;
            }
            const cacheId = this._cache.add(commandsOrActions);
            const disposables = new lifecycle_1.DisposableStore();
            this._disposables.set(cacheId, disposables);
            const actions = [];
            for (let i = 0; i < commandsOrActions.length; i++) {
                const candidate = commandsOrActions[i];
                if (!candidate) {
                    continue;
                }
                if (CodeActionAdapter._isCommand(candidate)) {
                    // old school: synthetic code action
                    this._apiDeprecation.report('CodeActionProvider.provideCodeActions - return commands', this._extension, `Return 'CodeAction' instances instead.`);
                    actions.push({
                        _isSynthetic: true,
                        title: candidate.title,
                        command: this._commands.toInternal(candidate, disposables),
                    });
                }
                else {
                    if (codeActionContext.only) {
                        if (!candidate.kind) {
                            this._logService.warn(`${this._extension.identifier.value} - Code actions of kind '${codeActionContext.only.value} 'requested but returned code action does not have a 'kind'. Code action will be dropped. Please set 'CodeAction.kind'.`);
                        }
                        else if (!codeActionContext.only.contains(candidate.kind)) {
                            this._logService.warn(`${this._extension.identifier.value} - Code actions of kind '${codeActionContext.only.value} 'requested but returned code action is of kind '${candidate.kind.value}'. Code action will be dropped. Please check 'CodeActionContext.only' to only return requested code actions.`);
                        }
                    }
                    // new school: convert code action
                    actions.push({
                        cacheId: [cacheId, i],
                        title: candidate.title,
                        command: candidate.command && this._commands.toInternal(candidate.command, disposables),
                        diagnostics: candidate.diagnostics && candidate.diagnostics.map(typeConvert.Diagnostic.from),
                        edit: candidate.edit && typeConvert.WorkspaceEdit.from(candidate.edit),
                        kind: candidate.kind && candidate.kind.value,
                        isPreferred: candidate.isPreferred,
                        disabled: (_a = candidate.disabled) === null || _a === void 0 ? void 0 : _a.reason
                    });
                }
            }
            return { cacheId, actions };
        }
        async resolveCodeAction(id, token) {
            var _a;
            const [sessionId, itemId] = id;
            const item = this._cache.get(sessionId, itemId);
            if (!item || CodeActionAdapter._isCommand(item)) {
                return undefined; // code actions only!
            }
            if (!this._provider.resolveCodeAction) {
                return; // this should not happen...
            }
            const resolvedItem = (_a = (await this._provider.resolveCodeAction(item, token))) !== null && _a !== void 0 ? _a : item;
            return (resolvedItem === null || resolvedItem === void 0 ? void 0 : resolvedItem.edit)
                ? typeConvert.WorkspaceEdit.from(resolvedItem.edit)
                : undefined;
        }
        releaseCodeActions(cachedId) {
            var _a;
            (_a = this._disposables.get(cachedId)) === null || _a === void 0 ? void 0 : _a.dispose();
            this._disposables.delete(cachedId);
            this._cache.delete(cachedId);
        }
        static _isCommand(thing) {
            return typeof thing.command === 'string' && typeof thing.title === 'string';
        }
    }
    CodeActionAdapter._maxCodeActionsPerFile = 1000;
    class DocumentFormattingAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDocumentFormattingEdits(resource, options, token) {
            const document = this._documents.getDocument(resource);
            const value = await this._provider.provideDocumentFormattingEdits(document, options, token);
            if (Array.isArray(value)) {
                return value.map(typeConvert.TextEdit.from);
            }
            return undefined;
        }
    }
    class RangeFormattingAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDocumentRangeFormattingEdits(resource, range, options, token) {
            const document = this._documents.getDocument(resource);
            const ran = typeConvert.Range.to(range);
            const value = await this._provider.provideDocumentRangeFormattingEdits(document, ran, options, token);
            if (Array.isArray(value)) {
                return value.map(typeConvert.TextEdit.from);
            }
            return undefined;
        }
    }
    class OnTypeFormattingAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this.autoFormatTriggerCharacters = []; // not here
        }
        async provideOnTypeFormattingEdits(resource, position, ch, options, token) {
            const document = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const value = await this._provider.provideOnTypeFormattingEdits(document, pos, ch, options, token);
            if (Array.isArray(value)) {
                return value.map(typeConvert.TextEdit.from);
            }
            return undefined;
        }
    }
    class NavigateTypeAdapter {
        constructor(_provider, _logService) {
            this._provider = _provider;
            this._logService = _logService;
            this._cache = new cache_1.Cache('WorkspaceSymbols');
        }
        async provideWorkspaceSymbols(search, token) {
            const value = await this._provider.provideWorkspaceSymbols(search, token);
            if (!(0, arrays_1.isNonEmptyArray)(value)) {
                return { symbols: [] };
            }
            const sid = this._cache.add(value);
            const result = {
                cacheId: sid,
                symbols: []
            };
            for (let i = 0; i < value.length; i++) {
                const item = value[i];
                if (!item || !item.name) {
                    this._logService.warn('INVALID SymbolInformation', item);
                    continue;
                }
                result.symbols.push(Object.assign(Object.assign({}, typeConvert.WorkspaceSymbol.from(item)), { cacheId: [sid, i] }));
            }
            return result;
        }
        async resolveWorkspaceSymbol(symbol, token) {
            if (typeof this._provider.resolveWorkspaceSymbol !== 'function') {
                return symbol;
            }
            if (!symbol.cacheId) {
                return symbol;
            }
            const item = this._cache.get(...symbol.cacheId);
            if (item) {
                const value = await this._provider.resolveWorkspaceSymbol(item, token);
                return value && (0, objects_1.mixin)(symbol, typeConvert.WorkspaceSymbol.from(value), true);
            }
            return undefined;
        }
        releaseWorkspaceSymbols(id) {
            this._cache.delete(id);
        }
    }
    class RenameAdapter {
        constructor(_documents, _provider, _logService) {
            this._documents = _documents;
            this._provider = _provider;
            this._logService = _logService;
        }
        static supportsResolving(provider) {
            return typeof provider.prepareRename === 'function';
        }
        async provideRenameEdits(resource, position, newName, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            try {
                const value = await this._provider.provideRenameEdits(doc, pos, newName, token);
                if (!value) {
                    return undefined;
                }
                return typeConvert.WorkspaceEdit.from(value);
            }
            catch (err) {
                const rejectReason = RenameAdapter._asMessage(err);
                if (rejectReason) {
                    return { rejectReason, edits: undefined };
                }
                else {
                    // generic error
                    return Promise.reject(err);
                }
            }
        }
        async resolveRenameLocation(resource, position, token) {
            if (typeof this._provider.prepareRename !== 'function') {
                return Promise.resolve(undefined);
            }
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            try {
                const rangeOrLocation = await this._provider.prepareRename(doc, pos, token);
                let range;
                let text;
                if (extHostTypes_1.Range.isRange(rangeOrLocation)) {
                    range = rangeOrLocation;
                    text = doc.getText(rangeOrLocation);
                }
                else if ((0, types_1.isObject)(rangeOrLocation)) {
                    range = rangeOrLocation.range;
                    text = rangeOrLocation.placeholder;
                }
                if (!range || !text) {
                    return undefined;
                }
                if (range.start.line > pos.line || range.end.line < pos.line) {
                    this._logService.warn('INVALID rename location: position line must be within range start/end lines');
                    return undefined;
                }
                return { range: typeConvert.Range.from(range), text };
            }
            catch (err) {
                const rejectReason = RenameAdapter._asMessage(err);
                if (rejectReason) {
                    return { rejectReason, range: undefined, text: undefined };
                }
                else {
                    return Promise.reject(err);
                }
            }
        }
        static _asMessage(err) {
            if (typeof err === 'string') {
                return err;
            }
            else if (err instanceof Error && typeof err.message === 'string') {
                return err.message;
            }
            else {
                return undefined;
            }
        }
    }
    class SemanticTokensPreviousResult {
        constructor(resultId, tokens) {
            this.resultId = resultId;
            this.tokens = tokens;
        }
    }
    class DocumentSemanticTokensAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._nextResultId = 1;
            this._previousResults = new Map();
        }
        async provideDocumentSemanticTokens(resource, previousResultId, token) {
            const doc = this._documents.getDocument(resource);
            const previousResult = (previousResultId !== 0 ? this._previousResults.get(previousResultId) : null);
            let value = typeof (previousResult === null || previousResult === void 0 ? void 0 : previousResult.resultId) === 'string' && typeof this._provider.provideDocumentSemanticTokensEdits === 'function'
                ? await this._provider.provideDocumentSemanticTokensEdits(doc, previousResult.resultId, token)
                : await this._provider.provideDocumentSemanticTokens(doc, token);
            if (previousResult) {
                this._previousResults.delete(previousResultId);
            }
            if (!value) {
                return null;
            }
            value = DocumentSemanticTokensAdapter._fixProvidedSemanticTokens(value);
            return this._send(DocumentSemanticTokensAdapter._convertToEdits(previousResult, value), value);
        }
        async releaseDocumentSemanticColoring(semanticColoringResultId) {
            this._previousResults.delete(semanticColoringResultId);
        }
        static _fixProvidedSemanticTokens(v) {
            if (DocumentSemanticTokensAdapter._isSemanticTokens(v)) {
                if (DocumentSemanticTokensAdapter._isCorrectSemanticTokens(v)) {
                    return v;
                }
                return new extHostTypes_1.SemanticTokens(new Uint32Array(v.data), v.resultId);
            }
            else if (DocumentSemanticTokensAdapter._isSemanticTokensEdits(v)) {
                if (DocumentSemanticTokensAdapter._isCorrectSemanticTokensEdits(v)) {
                    return v;
                }
                return new extHostTypes_1.SemanticTokensEdits(v.edits.map(edit => new extHostTypes_1.SemanticTokensEdit(edit.start, edit.deleteCount, edit.data ? new Uint32Array(edit.data) : edit.data)), v.resultId);
            }
            return v;
        }
        static _isSemanticTokens(v) {
            return v && !!(v.data);
        }
        static _isCorrectSemanticTokens(v) {
            return (v.data instanceof Uint32Array);
        }
        static _isSemanticTokensEdits(v) {
            return v && Array.isArray(v.edits);
        }
        static _isCorrectSemanticTokensEdits(v) {
            for (const edit of v.edits) {
                if (!(edit.data instanceof Uint32Array)) {
                    return false;
                }
            }
            return true;
        }
        static _convertToEdits(previousResult, newResult) {
            if (!DocumentSemanticTokensAdapter._isSemanticTokens(newResult)) {
                return newResult;
            }
            if (!previousResult || !previousResult.tokens) {
                return newResult;
            }
            const oldData = previousResult.tokens;
            const oldLength = oldData.length;
            const newData = newResult.data;
            const newLength = newData.length;
            let commonPrefixLength = 0;
            const maxCommonPrefixLength = Math.min(oldLength, newLength);
            while (commonPrefixLength < maxCommonPrefixLength && oldData[commonPrefixLength] === newData[commonPrefixLength]) {
                commonPrefixLength++;
            }
            if (commonPrefixLength === oldLength && commonPrefixLength === newLength) {
                // complete overlap!
                return new extHostTypes_1.SemanticTokensEdits([], newResult.resultId);
            }
            let commonSuffixLength = 0;
            const maxCommonSuffixLength = maxCommonPrefixLength - commonPrefixLength;
            while (commonSuffixLength < maxCommonSuffixLength && oldData[oldLength - commonSuffixLength - 1] === newData[newLength - commonSuffixLength - 1]) {
                commonSuffixLength++;
            }
            return new extHostTypes_1.SemanticTokensEdits([{
                    start: commonPrefixLength,
                    deleteCount: (oldLength - commonPrefixLength - commonSuffixLength),
                    data: newData.subarray(commonPrefixLength, newLength - commonSuffixLength)
                }], newResult.resultId);
        }
        _send(value, original) {
            if (DocumentSemanticTokensAdapter._isSemanticTokens(value)) {
                const myId = this._nextResultId++;
                this._previousResults.set(myId, new SemanticTokensPreviousResult(value.resultId, value.data));
                return (0, semanticTokensDto_1.encodeSemanticTokensDto)({
                    id: myId,
                    type: 'full',
                    data: value.data
                });
            }
            if (DocumentSemanticTokensAdapter._isSemanticTokensEdits(value)) {
                const myId = this._nextResultId++;
                if (DocumentSemanticTokensAdapter._isSemanticTokens(original)) {
                    // store the original
                    this._previousResults.set(myId, new SemanticTokensPreviousResult(original.resultId, original.data));
                }
                else {
                    this._previousResults.set(myId, new SemanticTokensPreviousResult(value.resultId));
                }
                return (0, semanticTokensDto_1.encodeSemanticTokensDto)({
                    id: myId,
                    type: 'delta',
                    deltas: (value.edits || []).map(edit => ({ start: edit.start, deleteCount: edit.deleteCount, data: edit.data }))
                });
            }
            return null;
        }
    }
    exports.DocumentSemanticTokensAdapter = DocumentSemanticTokensAdapter;
    class DocumentRangeSemanticTokensAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDocumentRangeSemanticTokens(resource, range, token) {
            const doc = this._documents.getDocument(resource);
            const value = await this._provider.provideDocumentRangeSemanticTokens(doc, typeConvert.Range.to(range), token);
            if (!value) {
                return null;
            }
            return this._send(value);
        }
        _send(value) {
            return (0, semanticTokensDto_1.encodeSemanticTokensDto)({
                id: 0,
                type: 'full',
                data: value.data
            });
        }
    }
    exports.DocumentRangeSemanticTokensAdapter = DocumentRangeSemanticTokensAdapter;
    class CompletionsAdapter {
        constructor(_documents, _commands, _provider, _apiDeprecation, _extension) {
            this._documents = _documents;
            this._commands = _commands;
            this._provider = _provider;
            this._apiDeprecation = _apiDeprecation;
            this._extension = _extension;
            this._cache = new cache_1.Cache('CompletionItem');
            this._disposables = new Map();
        }
        static supportsResolving(provider) {
            return typeof provider.resolveCompletionItem === 'function';
        }
        async provideCompletionItems(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            // The default insert/replace ranges. It's important to compute them
            // before asynchronously asking the provider for its results. See
            // https://github.com/microsoft/vscode/issues/83400#issuecomment-546851421
            const replaceRange = doc.getWordRangeAtPosition(pos) || new extHostTypes_1.Range(pos, pos);
            const insertRange = replaceRange.with({ end: pos });
            const sw = new stopwatch_1.StopWatch(true);
            const itemsOrList = await this._provider.provideCompletionItems(doc, pos, token, typeConvert.CompletionContext.to(context));
            if (!itemsOrList) {
                // undefined and null are valid results
                return undefined;
            }
            if (token.isCancellationRequested) {
                // cancelled -> return without further ado, esp no caching
                // of results as they will leak
                return undefined;
            }
            const list = Array.isArray(itemsOrList) ? new extHostTypes_1.CompletionList(itemsOrList) : itemsOrList;
            // keep result for providers that support resolving
            const pid = CompletionsAdapter.supportsResolving(this._provider) ? this._cache.add(list.items) : this._cache.add([]);
            const disposables = new lifecycle_1.DisposableStore();
            this._disposables.set(pid, disposables);
            const completions = [];
            const result = {
                x: pid,
                ["b" /* extHostProtocol.ISuggestResultDtoField.completions */]: completions,
                ["a" /* extHostProtocol.ISuggestResultDtoField.defaultRanges */]: { replace: typeConvert.Range.from(replaceRange), insert: typeConvert.Range.from(insertRange) },
                ["c" /* extHostProtocol.ISuggestResultDtoField.isIncomplete */]: list.isIncomplete || undefined,
                ["d" /* extHostProtocol.ISuggestResultDtoField.duration */]: sw.elapsed()
            };
            for (let i = 0; i < list.items.length; i++) {
                const item = list.items[i];
                // check for bad completion item first
                const dto = this._convertCompletionItem(item, [pid, i], insertRange, replaceRange);
                completions.push(dto);
            }
            return result;
        }
        async resolveCompletionItem(id, token) {
            if (typeof this._provider.resolveCompletionItem !== 'function') {
                return undefined;
            }
            const item = this._cache.get(...id);
            if (!item) {
                return undefined;
            }
            const resolvedItem = await this._provider.resolveCompletionItem(item, token);
            if (!resolvedItem) {
                return undefined;
            }
            return this._convertCompletionItem(resolvedItem, id);
        }
        releaseCompletionItems(id) {
            var _a;
            (_a = this._disposables.get(id)) === null || _a === void 0 ? void 0 : _a.dispose();
            this._disposables.delete(id);
            this._cache.delete(id);
        }
        _convertCompletionItem(item, id, defaultInsertRange, defaultReplaceRange) {
            const disposables = this._disposables.get(id[0]);
            if (!disposables) {
                throw Error('DisposableStore is missing...');
            }
            const result = {
                //
                x: id,
                //
                ["a" /* extHostProtocol.ISuggestDataDtoField.label */]: item.label,
                ["b" /* extHostProtocol.ISuggestDataDtoField.kind */]: item.kind !== undefined ? typeConvert.CompletionItemKind.from(item.kind) : undefined,
                ["n" /* extHostProtocol.ISuggestDataDtoField.kindModifier */]: item.tags && item.tags.map(typeConvert.CompletionItemTag.from),
                ["c" /* extHostProtocol.ISuggestDataDtoField.detail */]: item.detail,
                ["d" /* extHostProtocol.ISuggestDataDtoField.documentation */]: typeof item.documentation === 'undefined' ? undefined : typeConvert.MarkdownString.fromStrict(item.documentation),
                ["e" /* extHostProtocol.ISuggestDataDtoField.sortText */]: item.sortText !== item.label ? item.sortText : undefined,
                ["f" /* extHostProtocol.ISuggestDataDtoField.filterText */]: item.filterText !== item.label ? item.filterText : undefined,
                ["g" /* extHostProtocol.ISuggestDataDtoField.preselect */]: item.preselect || undefined,
                ["i" /* extHostProtocol.ISuggestDataDtoField.insertTextRules */]: item.keepWhitespace ? 1 /* languages.CompletionItemInsertTextRule.KeepWhitespace */ : 0,
                ["k" /* extHostProtocol.ISuggestDataDtoField.commitCharacters */]: item.commitCharacters,
                ["l" /* extHostProtocol.ISuggestDataDtoField.additionalTextEdits */]: item.additionalTextEdits && item.additionalTextEdits.map(typeConvert.TextEdit.from),
                ["m" /* extHostProtocol.ISuggestDataDtoField.command */]: this._commands.toInternal(item.command, disposables),
            };
            // 'insertText'-logic
            if (item.textEdit) {
                this._apiDeprecation.report('CompletionItem.textEdit', this._extension, `Use 'CompletionItem.insertText' and 'CompletionItem.range' instead.`);
                result["h" /* extHostProtocol.ISuggestDataDtoField.insertText */] = item.textEdit.newText;
            }
            else if (typeof item.insertText === 'string') {
                result["h" /* extHostProtocol.ISuggestDataDtoField.insertText */] = item.insertText;
            }
            else if (item.insertText instanceof extHostTypes_1.SnippetString) {
                result["h" /* extHostProtocol.ISuggestDataDtoField.insertText */] = item.insertText.value;
                result["i" /* extHostProtocol.ISuggestDataDtoField.insertTextRules */] |= 4 /* languages.CompletionItemInsertTextRule.InsertAsSnippet */;
            }
            // 'overwrite[Before|After]'-logic
            let range;
            if (item.textEdit) {
                range = item.textEdit.range;
            }
            else if (item.range) {
                range = item.range;
            }
            if (extHostTypes_1.Range.isRange(range)) {
                // "old" range
                result["j" /* extHostProtocol.ISuggestDataDtoField.range */] = typeConvert.Range.from(range);
            }
            else if (range && (!(defaultInsertRange === null || defaultInsertRange === void 0 ? void 0 : defaultInsertRange.isEqual(range.inserting)) || !(defaultReplaceRange === null || defaultReplaceRange === void 0 ? void 0 : defaultReplaceRange.isEqual(range.replacing)))) {
                // ONLY send range when it's different from the default ranges (safe bandwidth)
                result["j" /* extHostProtocol.ISuggestDataDtoField.range */] = {
                    insert: typeConvert.Range.from(range.inserting),
                    replace: typeConvert.Range.from(range.replacing)
                };
            }
            return result;
        }
    }
    class InlineCompletionAdapterBase {
        async provideInlineCompletions(resource, position, context, token) {
            return undefined;
        }
        disposeCompletions(pid) { }
        handleDidShowCompletionItem(pid, idx) { }
    }
    class InlineCompletionAdapter extends InlineCompletionAdapterBase {
        constructor(_documents, _provider, _commands) {
            super();
            this._documents = _documents;
            this._provider = _provider;
            this._commands = _commands;
            this._cache = new cache_1.Cache('InlineCompletionItem');
            this._disposables = new Map();
        }
        async provideInlineCompletions(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const result = await this._provider.provideInlineCompletionItems(doc, pos, {
                selectedCompletionInfo: context.selectedSuggestionInfo
                    ? {
                        range: typeConvert.Range.to(context.selectedSuggestionInfo.range),
                        text: context.selectedSuggestionInfo.text,
                        isSnippetText: context.selectedSuggestionInfo.isSnippetText,
                        completionKind: typeConvert.CompletionItemKind.to(context.selectedSuggestionInfo.completionKind),
                    }
                    : undefined,
                triggerKind: context.triggerKind
            }, token);
            if (!result) {
                // undefined and null are valid results
                return undefined;
            }
            if (token.isCancellationRequested) {
                // cancelled -> return without further ado, esp no caching
                // of results as they will leak
                return undefined;
            }
            const normalizedResult = (0, types_1.isArray)(result) ? result : result.items;
            const pid = this._cache.add(normalizedResult);
            let disposableStore = undefined;
            return {
                pid,
                items: normalizedResult.map((item, idx) => {
                    var _a;
                    let command = undefined;
                    if (item.command) {
                        if (!disposableStore) {
                            disposableStore = new lifecycle_1.DisposableStore();
                            this._disposables.set(pid, disposableStore);
                        }
                        command = this._commands.toInternal(item.command, disposableStore);
                    }
                    const insertText = (_a = item.insertText) !== null && _a !== void 0 ? _a : item.text;
                    if (insertText === undefined) {
                        throw new Error('text or insertText must be defined');
                    }
                    return ({
                        insertText: typeof insertText === 'string' ? insertText : { snippet: insertText.value },
                        range: item.range ? typeConvert.Range.from(item.range) : undefined,
                        command,
                        idx: idx,
                        completeBracketPairs: item.completeBracketPairs
                    });
                }),
            };
        }
        disposeCompletions(pid) {
            this._cache.delete(pid);
            const d = this._disposables.get(pid);
            if (d) {
                d.clear();
            }
            this._disposables.delete(pid);
        }
        handleDidShowCompletionItem(pid, idx) {
            const completionItem = this._cache.get(pid, idx);
            if (completionItem) {
                InlineCompletionController.get(this._provider).fireOnDidShowCompletionItem({
                    completionItem
                });
            }
        }
    }
    class InlineCompletionAdapterNew extends InlineCompletionAdapterBase {
        constructor(extension, _documents, _provider, _commands) {
            super();
            this.extension = extension;
            this._documents = _documents;
            this._provider = _provider;
            this._commands = _commands;
            this._references = new ReferenceMap();
            this.isAdditionProposedApiEnabled = (0, extensions_1.isProposedApiEnabled)(this.extension, 'inlineCompletionsAdditions');
            this.languageTriggerKindToVSCodeTriggerKind = {
                [languages.InlineCompletionTriggerKind.Automatic]: extHostTypes_1.InlineCompletionTriggerKindNew.Automatic,
                [languages.InlineCompletionTriggerKind.Explicit]: extHostTypes_1.InlineCompletionTriggerKindNew.Invoke,
            };
        }
        async provideInlineCompletions(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const result = await this._provider.provideInlineCompletionItems(doc, pos, {
                selectedCompletionInfo: context.selectedSuggestionInfo
                    ? {
                        range: typeConvert.Range.to(context.selectedSuggestionInfo.range),
                        text: context.selectedSuggestionInfo.text
                    }
                    : undefined,
                triggerKind: this.languageTriggerKindToVSCodeTriggerKind[context.triggerKind]
            }, token);
            if (!result) {
                // undefined and null are valid results
                return undefined;
            }
            if (token.isCancellationRequested) {
                // cancelled -> return without further ado, esp no caching
                // of results as they will leak
                return undefined;
            }
            const normalizedResult = (0, types_1.isArray)(result) ? result : result.items;
            const commands = (0, types_1.isArray)(result) ? [] : result.commands || [];
            let disposableStore = undefined;
            const pid = this._references.createReferenceId({
                dispose() {
                    if (disposableStore) {
                        disposableStore.dispose();
                    }
                },
                items: normalizedResult
            });
            return {
                pid,
                items: normalizedResult.map((item, idx) => {
                    let command = undefined;
                    if (item.command) {
                        if (!disposableStore) {
                            disposableStore = new lifecycle_1.DisposableStore();
                        }
                        command = this._commands.toInternal(item.command, disposableStore);
                    }
                    const insertText = item.insertText;
                    return ({
                        insertText: typeof insertText === 'string' ? insertText : { snippet: insertText.value },
                        filterText: item.filterText,
                        range: item.range ? typeConvert.Range.from(item.range) : undefined,
                        command,
                        idx: idx,
                        completeBracketPairs: this.isAdditionProposedApiEnabled ? item.completeBracketPairs : false
                    });
                }),
                commands: commands.map(c => {
                    if (!disposableStore) {
                        disposableStore = new lifecycle_1.DisposableStore();
                    }
                    return this._commands.toInternal(c, disposableStore);
                })
            };
        }
        disposeCompletions(pid) {
            const data = this._references.disposeReferenceId(pid);
            data === null || data === void 0 ? void 0 : data.dispose();
        }
        handleDidShowCompletionItem(pid, idx) {
            var _a;
            const completionItem = (_a = this._references.get(pid)) === null || _a === void 0 ? void 0 : _a.items[idx];
            if (completionItem) {
                if (this._provider.handleDidShowCompletionItem && this.isAdditionProposedApiEnabled) {
                    this._provider.handleDidShowCompletionItem(completionItem);
                }
            }
        }
    }
    class ReferenceMap {
        constructor() {
            this._references = new Map();
            this._idPool = 1;
        }
        createReferenceId(value) {
            const id = this._idPool++;
            this._references.set(id, value);
            return id;
        }
        disposeReferenceId(referenceId) {
            const value = this._references.get(referenceId);
            this._references.delete(referenceId);
            return value;
        }
        get(referenceId) {
            return this._references.get(referenceId);
        }
    }
    class InlineCompletionController {
        constructor() {
            this._onDidShowCompletionItemEmitter = new event_1.Emitter();
            this.onDidShowCompletionItem = this._onDidShowCompletionItemEmitter.event;
        }
        static get(provider) {
            let existing = InlineCompletionController.map.get(provider);
            if (!existing) {
                existing = new InlineCompletionController();
                InlineCompletionController.map.set(provider, existing);
            }
            return existing;
        }
        fireOnDidShowCompletionItem(event) {
            this._onDidShowCompletionItemEmitter.fire(event);
        }
    }
    exports.InlineCompletionController = InlineCompletionController;
    InlineCompletionController.map = new WeakMap();
    class SignatureHelpAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._cache = new cache_1.Cache('SignatureHelp');
        }
        async provideSignatureHelp(resource, position, context, token) {
            const doc = this._documents.getDocument(resource);
            const pos = typeConvert.Position.to(position);
            const vscodeContext = this.reviveContext(context);
            const value = await this._provider.provideSignatureHelp(doc, pos, token, vscodeContext);
            if (value) {
                const id = this._cache.add([value]);
                return Object.assign(Object.assign({}, typeConvert.SignatureHelp.from(value)), { id });
            }
            return undefined;
        }
        reviveContext(context) {
            let activeSignatureHelp = undefined;
            if (context.activeSignatureHelp) {
                const revivedSignatureHelp = typeConvert.SignatureHelp.to(context.activeSignatureHelp);
                const saved = this._cache.get(context.activeSignatureHelp.id, 0);
                if (saved) {
                    activeSignatureHelp = saved;
                    activeSignatureHelp.activeSignature = revivedSignatureHelp.activeSignature;
                    activeSignatureHelp.activeParameter = revivedSignatureHelp.activeParameter;
                }
                else {
                    activeSignatureHelp = revivedSignatureHelp;
                }
            }
            return Object.assign(Object.assign({}, context), { activeSignatureHelp });
        }
        releaseSignatureHelp(id) {
            this._cache.delete(id);
        }
    }
    class InlayHintsAdapter {
        constructor(_documents, _commands, _provider, _logService, _extension) {
            this._documents = _documents;
            this._commands = _commands;
            this._provider = _provider;
            this._logService = _logService;
            this._extension = _extension;
            this._cache = new cache_1.Cache('InlayHints');
            this._disposables = new Map();
        }
        async provideInlayHints(resource, ran, token) {
            const doc = this._documents.getDocument(resource);
            const range = typeConvert.Range.to(ran);
            const hints = await this._provider.provideInlayHints(doc, range, token);
            if (!Array.isArray(hints) || hints.length === 0) {
                // bad result
                this._logService.trace(`[InlayHints] NO inlay hints from '${this._extension.identifier.value}' for ${ran}`);
                return undefined;
            }
            if (token.isCancellationRequested) {
                // cancelled -> return without further ado, esp no caching
                // of results as they will leak
                return undefined;
            }
            const pid = this._cache.add(hints);
            this._disposables.set(pid, new lifecycle_1.DisposableStore());
            const result = { hints: [], cacheId: pid };
            for (let i = 0; i < hints.length; i++) {
                if (this._isValidInlayHint(hints[i], range)) {
                    result.hints.push(this._convertInlayHint(hints[i], [pid, i]));
                }
            }
            this._logService.trace(`[InlayHints] ${result.hints.length} inlay hints from '${this._extension.identifier.value}' for ${ran}`);
            return result;
        }
        async resolveInlayHint(id, token) {
            if (typeof this._provider.resolveInlayHint !== 'function') {
                return undefined;
            }
            const item = this._cache.get(...id);
            if (!item) {
                return undefined;
            }
            const hint = await this._provider.resolveInlayHint(item, token);
            if (!hint) {
                return undefined;
            }
            if (!this._isValidInlayHint(hint)) {
                return undefined;
            }
            return this._convertInlayHint(hint, id);
        }
        releaseHints(id) {
            var _a;
            (_a = this._disposables.get(id)) === null || _a === void 0 ? void 0 : _a.dispose();
            this._disposables.delete(id);
            this._cache.delete(id);
        }
        _isValidInlayHint(hint, range) {
            if (hint.label.length === 0 || Array.isArray(hint.label) && hint.label.every(part => part.value.length === 0)) {
                console.log('INVALID inlay hint, empty label', hint);
                return false;
            }
            if (range && !range.contains(hint.position)) {
                // console.log('INVALID inlay hint, position outside range', range, hint);
                return false;
            }
            return true;
        }
        _convertInlayHint(hint, id) {
            const disposables = this._disposables.get(id[0]);
            if (!disposables) {
                throw Error('DisposableStore is missing...');
            }
            const result = {
                label: '',
                cacheId: id,
                tooltip: typeConvert.MarkdownString.fromStrict(hint.tooltip),
                position: typeConvert.Position.from(hint.position),
                textEdits: hint.textEdits && hint.textEdits.map(typeConvert.TextEdit.from),
                kind: hint.kind && typeConvert.InlayHintKind.from(hint.kind),
                paddingLeft: hint.paddingLeft,
                paddingRight: hint.paddingRight,
            };
            if (typeof hint.label === 'string') {
                result.label = hint.label;
            }
            else {
                result.label = hint.label.map(part => {
                    let result = { label: part.value };
                    result.tooltip = typeConvert.MarkdownString.fromStrict(part.tooltip);
                    if (extHostTypes_1.Location.isLocation(part.location)) {
                        result.location = typeConvert.location.from(part.location);
                    }
                    if (part.command) {
                        result.command = this._commands.toInternal(part.command, disposables);
                    }
                    return result;
                });
            }
            return result;
        }
    }
    class LinkProviderAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._cache = new cache_1.Cache('DocumentLink');
        }
        async provideLinks(resource, token) {
            const doc = this._documents.getDocument(resource);
            const links = await this._provider.provideDocumentLinks(doc, token);
            if (!Array.isArray(links) || links.length === 0) {
                // bad result
                return undefined;
            }
            if (token.isCancellationRequested) {
                // cancelled -> return without further ado, esp no caching
                // of results as they will leak
                return undefined;
            }
            if (typeof this._provider.resolveDocumentLink !== 'function') {
                // no resolve -> no caching
                return { links: links.filter(LinkProviderAdapter._validateLink).map(typeConvert.DocumentLink.from) };
            }
            else {
                // cache links for future resolving
                const pid = this._cache.add(links);
                const result = { links: [], cacheId: pid };
                for (let i = 0; i < links.length; i++) {
                    if (!LinkProviderAdapter._validateLink(links[i])) {
                        continue;
                    }
                    const dto = typeConvert.DocumentLink.from(links[i]);
                    dto.cacheId = [pid, i];
                    result.links.push(dto);
                }
                return result;
            }
        }
        static _validateLink(link) {
            if (link.target && link.target.path.length > 50000) {
                console.warn('DROPPING link because it is too long');
                return false;
            }
            return true;
        }
        async resolveLink(id, token) {
            if (typeof this._provider.resolveDocumentLink !== 'function') {
                return undefined;
            }
            const item = this._cache.get(...id);
            if (!item) {
                return undefined;
            }
            const link = await this._provider.resolveDocumentLink(item, token);
            if (!link || !LinkProviderAdapter._validateLink(link)) {
                return undefined;
            }
            return typeConvert.DocumentLink.from(link);
        }
        releaseLinks(id) {
            this._cache.delete(id);
        }
    }
    class ColorProviderAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideColors(resource, token) {
            const doc = this._documents.getDocument(resource);
            const colors = await this._provider.provideDocumentColors(doc, token);
            if (!Array.isArray(colors)) {
                return [];
            }
            const colorInfos = colors.map(ci => {
                return {
                    color: typeConvert.Color.from(ci.color),
                    range: typeConvert.Range.from(ci.range)
                };
            });
            return colorInfos;
        }
        async provideColorPresentations(resource, raw, token) {
            const document = this._documents.getDocument(resource);
            const range = typeConvert.Range.to(raw.range);
            const color = typeConvert.Color.to(raw.color);
            const value = await this._provider.provideColorPresentations(color, { document, range }, token);
            if (!Array.isArray(value)) {
                return undefined;
            }
            return value.map(typeConvert.ColorPresentation.from);
        }
    }
    class FoldingProviderAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideFoldingRanges(resource, context, token) {
            const doc = this._documents.getDocument(resource);
            const ranges = await this._provider.provideFoldingRanges(doc, context, token);
            if (!Array.isArray(ranges)) {
                return undefined;
            }
            return ranges.map(typeConvert.FoldingRange.from);
        }
    }
    class SelectionRangeAdapter {
        constructor(_documents, _provider, _logService) {
            this._documents = _documents;
            this._provider = _provider;
            this._logService = _logService;
        }
        async provideSelectionRanges(resource, pos, token) {
            const document = this._documents.getDocument(resource);
            const positions = pos.map(typeConvert.Position.to);
            const allProviderRanges = await this._provider.provideSelectionRanges(document, positions, token);
            if (!(0, arrays_1.isNonEmptyArray)(allProviderRanges)) {
                return [];
            }
            if (allProviderRanges.length !== positions.length) {
                this._logService.warn('BAD selection ranges, provider must return ranges for each position');
                return [];
            }
            const allResults = [];
            for (let i = 0; i < positions.length; i++) {
                const oneResult = [];
                allResults.push(oneResult);
                let last = positions[i];
                let selectionRange = allProviderRanges[i];
                while (true) {
                    if (!selectionRange.range.contains(last)) {
                        throw new Error('INVALID selection range, must contain the previous range');
                    }
                    oneResult.push(typeConvert.SelectionRange.from(selectionRange));
                    if (!selectionRange.parent) {
                        break;
                    }
                    last = selectionRange.range;
                    selectionRange = selectionRange.parent;
                }
            }
            return allResults;
        }
    }
    class CallHierarchyAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._idPool = new idGenerator_1.IdGenerator('');
            this._cache = new Map();
        }
        async prepareSession(uri, position, token) {
            const doc = this._documents.getDocument(uri);
            const pos = typeConvert.Position.to(position);
            const items = await this._provider.prepareCallHierarchy(doc, pos, token);
            if (!items) {
                return undefined;
            }
            const sessionId = this._idPool.nextId();
            this._cache.set(sessionId, new Map());
            if (Array.isArray(items)) {
                return items.map(item => this._cacheAndConvertItem(sessionId, item));
            }
            else {
                return [this._cacheAndConvertItem(sessionId, items)];
            }
        }
        async provideCallsTo(sessionId, itemId, token) {
            const item = this._itemFromCache(sessionId, itemId);
            if (!item) {
                throw new Error('missing call hierarchy item');
            }
            const calls = await this._provider.provideCallHierarchyIncomingCalls(item, token);
            if (!calls) {
                return undefined;
            }
            return calls.map(call => {
                return {
                    from: this._cacheAndConvertItem(sessionId, call.from),
                    fromRanges: call.fromRanges.map(r => typeConvert.Range.from(r))
                };
            });
        }
        async provideCallsFrom(sessionId, itemId, token) {
            const item = this._itemFromCache(sessionId, itemId);
            if (!item) {
                throw new Error('missing call hierarchy item');
            }
            const calls = await this._provider.provideCallHierarchyOutgoingCalls(item, token);
            if (!calls) {
                return undefined;
            }
            return calls.map(call => {
                return {
                    to: this._cacheAndConvertItem(sessionId, call.to),
                    fromRanges: call.fromRanges.map(r => typeConvert.Range.from(r))
                };
            });
        }
        releaseSession(sessionId) {
            this._cache.delete(sessionId);
        }
        _cacheAndConvertItem(sessionId, item) {
            const map = this._cache.get(sessionId);
            const dto = typeConvert.CallHierarchyItem.from(item, sessionId, map.size.toString(36));
            map.set(dto._itemId, item);
            return dto;
        }
        _itemFromCache(sessionId, itemId) {
            const map = this._cache.get(sessionId);
            return map === null || map === void 0 ? void 0 : map.get(itemId);
        }
    }
    class TypeHierarchyAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
            this._idPool = new idGenerator_1.IdGenerator('');
            this._cache = new Map();
        }
        async prepareSession(uri, position, token) {
            const doc = this._documents.getDocument(uri);
            const pos = typeConvert.Position.to(position);
            const items = await this._provider.prepareTypeHierarchy(doc, pos, token);
            if (!items) {
                return undefined;
            }
            const sessionId = this._idPool.nextId();
            this._cache.set(sessionId, new Map());
            if (Array.isArray(items)) {
                return items.map(item => this._cacheAndConvertItem(sessionId, item));
            }
            else {
                return [this._cacheAndConvertItem(sessionId, items)];
            }
        }
        async provideSupertypes(sessionId, itemId, token) {
            const item = this._itemFromCache(sessionId, itemId);
            if (!item) {
                throw new Error('missing type hierarchy item');
            }
            const supertypes = await this._provider.provideTypeHierarchySupertypes(item, token);
            if (!supertypes) {
                return undefined;
            }
            return supertypes.map(supertype => {
                return this._cacheAndConvertItem(sessionId, supertype);
            });
        }
        async provideSubtypes(sessionId, itemId, token) {
            const item = this._itemFromCache(sessionId, itemId);
            if (!item) {
                throw new Error('missing type hierarchy item');
            }
            const subtypes = await this._provider.provideTypeHierarchySubtypes(item, token);
            if (!subtypes) {
                return undefined;
            }
            return subtypes.map(subtype => {
                return this._cacheAndConvertItem(sessionId, subtype);
            });
        }
        releaseSession(sessionId) {
            this._cache.delete(sessionId);
        }
        _cacheAndConvertItem(sessionId, item) {
            const map = this._cache.get(sessionId);
            const dto = typeConvert.TypeHierarchyItem.from(item, sessionId, map.size.toString(36));
            map.set(dto._itemId, item);
            return dto;
        }
        _itemFromCache(sessionId, itemId) {
            const map = this._cache.get(sessionId);
            return map === null || map === void 0 ? void 0 : map.get(itemId);
        }
    }
    class DocumentOnDropAdapter {
        constructor(_documents, _provider) {
            this._documents = _documents;
            this._provider = _provider;
        }
        async provideDocumentOnDropEdits(uri, position, dataTransferDto, token) {
            const doc = this._documents.getDocument(uri);
            const pos = typeConvert.Position.to(position);
            const dataTransfer = dataTransfer_1.DataTransferConverter.toDataTransfer(dataTransferDto);
            const edit = await this._provider.provideDocumentOnDropEdits(doc, pos, dataTransfer, token);
            if (!edit) {
                return undefined;
            }
            return typeConvert.SnippetTextEdit.from(edit);
        }
    }
    class AdapterData {
        constructor(adapter, extension) {
            this.adapter = adapter;
            this.extension = extension;
        }
    }
    class ExtHostLanguageFeatures {
        constructor(mainContext, uriTransformer, documents, commands, diagnostics, logService, apiDeprecationService) {
            this._adapter = new Map();
            this._uriTransformer = uriTransformer;
            this._proxy = mainContext.getProxy(extHostProtocol.MainContext.MainThreadLanguageFeatures);
            this._documents = documents;
            this._commands = commands;
            this._diagnostics = diagnostics;
            this._logService = logService;
            this._apiDeprecation = apiDeprecationService;
        }
        _transformDocumentSelector(selector) {
            return typeConvert.DocumentSelector.from(selector, this._uriTransformer);
        }
        _createDisposable(handle) {
            return new extHostTypes_1.Disposable(() => {
                this._adapter.delete(handle);
                this._proxy.$unregister(handle);
            });
        }
        _nextHandle() {
            return ExtHostLanguageFeatures._handlePool++;
        }
        async _withAdapter(handle, ctor, callback, fallbackValue, tokenToRaceAgainst, doNotLog = false) {
            const data = this._adapter.get(handle);
            if (!data || !(data.adapter instanceof ctor)) {
                return fallbackValue;
            }
            const t1 = Date.now();
            if (!doNotLog) {
                this._logService.trace(`[${data.extension.identifier.value}] INVOKE provider '${callback.toString().replace(/[\r\n]/g, '')}'`);
            }
            const result = callback(data.adapter, data.extension);
            // logging,tracing
            Promise.resolve(result).catch(err => {
                if (!(0, errors_1.isCancellationError)(err)) {
                    this._logService.error(`[${data.extension.identifier.value}] provider FAILED`);
                    this._logService.error(err);
                }
            }).finally(() => {
                if (!doNotLog) {
                    this._logService.trace(`[${data.extension.identifier.value}] provider DONE after ${Date.now() - t1}ms`);
                }
            });
            if (cancellation_1.CancellationToken.isCancellationToken(tokenToRaceAgainst)) {
                return (0, async_1.raceCancellationError)(result, tokenToRaceAgainst);
            }
            return result;
        }
        _addNewAdapter(adapter, extension) {
            const handle = this._nextHandle();
            this._adapter.set(handle, new AdapterData(adapter, extension));
            return handle;
        }
        static _extLabel(ext) {
            return ext.displayName || ext.name;
        }
        // --- outline
        registerDocumentSymbolProvider(extension, selector, provider, metadata) {
            const handle = this._addNewAdapter(new DocumentSymbolAdapter(this._documents, provider), extension);
            const displayName = (metadata && metadata.label) || ExtHostLanguageFeatures._extLabel(extension);
            this._proxy.$registerDocumentSymbolProvider(handle, this._transformDocumentSelector(selector), displayName);
            return this._createDisposable(handle);
        }
        $provideDocumentSymbols(handle, resource, token) {
            return this._withAdapter(handle, DocumentSymbolAdapter, adapter => adapter.provideDocumentSymbols(uri_1.URI.revive(resource), token), undefined, token);
        }
        // --- code lens
        registerCodeLensProvider(extension, selector, provider) {
            const handle = this._nextHandle();
            const eventHandle = typeof provider.onDidChangeCodeLenses === 'function' ? this._nextHandle() : undefined;
            this._adapter.set(handle, new AdapterData(new CodeLensAdapter(this._documents, this._commands.converter, provider), extension));
            this._proxy.$registerCodeLensSupport(handle, this._transformDocumentSelector(selector), eventHandle);
            let result = this._createDisposable(handle);
            if (eventHandle !== undefined) {
                const subscription = provider.onDidChangeCodeLenses(_ => this._proxy.$emitCodeLensEvent(eventHandle));
                result = extHostTypes_1.Disposable.from(result, subscription);
            }
            return result;
        }
        $provideCodeLenses(handle, resource, token) {
            return this._withAdapter(handle, CodeLensAdapter, adapter => adapter.provideCodeLenses(uri_1.URI.revive(resource), token), undefined, token);
        }
        $resolveCodeLens(handle, symbol, token) {
            return this._withAdapter(handle, CodeLensAdapter, adapter => adapter.resolveCodeLens(symbol, token), undefined, undefined);
        }
        $releaseCodeLenses(handle, cacheId) {
            this._withAdapter(handle, CodeLensAdapter, adapter => Promise.resolve(adapter.releaseCodeLenses(cacheId)), undefined, undefined);
        }
        // --- declaration
        registerDefinitionProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DefinitionAdapter(this._documents, provider), extension);
            this._proxy.$registerDefinitionSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideDefinition(handle, resource, position, token) {
            return this._withAdapter(handle, DefinitionAdapter, adapter => adapter.provideDefinition(uri_1.URI.revive(resource), position, token), [], token);
        }
        registerDeclarationProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DeclarationAdapter(this._documents, provider), extension);
            this._proxy.$registerDeclarationSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideDeclaration(handle, resource, position, token) {
            return this._withAdapter(handle, DeclarationAdapter, adapter => adapter.provideDeclaration(uri_1.URI.revive(resource), position, token), [], token);
        }
        registerImplementationProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new ImplementationAdapter(this._documents, provider), extension);
            this._proxy.$registerImplementationSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideImplementation(handle, resource, position, token) {
            return this._withAdapter(handle, ImplementationAdapter, adapter => adapter.provideImplementation(uri_1.URI.revive(resource), position, token), [], token);
        }
        registerTypeDefinitionProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new TypeDefinitionAdapter(this._documents, provider), extension);
            this._proxy.$registerTypeDefinitionSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideTypeDefinition(handle, resource, position, token) {
            return this._withAdapter(handle, TypeDefinitionAdapter, adapter => adapter.provideTypeDefinition(uri_1.URI.revive(resource), position, token), [], token);
        }
        // --- extra info
        registerHoverProvider(extension, selector, provider, extensionId) {
            const handle = this._addNewAdapter(new HoverAdapter(this._documents, provider), extension);
            this._proxy.$registerHoverProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideHover(handle, resource, position, token) {
            return this._withAdapter(handle, HoverAdapter, adapter => adapter.provideHover(uri_1.URI.revive(resource), position, token), undefined, token);
        }
        // --- debug hover
        registerEvaluatableExpressionProvider(extension, selector, provider, extensionId) {
            const handle = this._addNewAdapter(new EvaluatableExpressionAdapter(this._documents, provider), extension);
            this._proxy.$registerEvaluatableExpressionProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideEvaluatableExpression(handle, resource, position, token) {
            return this._withAdapter(handle, EvaluatableExpressionAdapter, adapter => adapter.provideEvaluatableExpression(uri_1.URI.revive(resource), position, token), undefined, token);
        }
        // --- debug inline values
        registerInlineValuesProvider(extension, selector, provider, extensionId) {
            const eventHandle = typeof provider.onDidChangeInlineValues === 'function' ? this._nextHandle() : undefined;
            const handle = this._addNewAdapter(new InlineValuesAdapter(this._documents, provider), extension);
            this._proxy.$registerInlineValuesProvider(handle, this._transformDocumentSelector(selector), eventHandle);
            let result = this._createDisposable(handle);
            if (eventHandle !== undefined) {
                const subscription = provider.onDidChangeInlineValues(_ => this._proxy.$emitInlineValuesEvent(eventHandle));
                result = extHostTypes_1.Disposable.from(result, subscription);
            }
            return result;
        }
        $provideInlineValues(handle, resource, range, context, token) {
            return this._withAdapter(handle, InlineValuesAdapter, adapter => adapter.provideInlineValues(uri_1.URI.revive(resource), range, context, token), undefined, token);
        }
        // --- occurrences
        registerDocumentHighlightProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DocumentHighlightAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentHighlightProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideDocumentHighlights(handle, resource, position, token) {
            return this._withAdapter(handle, DocumentHighlightAdapter, adapter => adapter.provideDocumentHighlights(uri_1.URI.revive(resource), position, token), undefined, token);
        }
        // --- linked editing
        registerLinkedEditingRangeProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new LinkedEditingRangeAdapter(this._documents, provider), extension);
            this._proxy.$registerLinkedEditingRangeProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideLinkedEditingRanges(handle, resource, position, token) {
            return this._withAdapter(handle, LinkedEditingRangeAdapter, async (adapter) => {
                const res = await adapter.provideLinkedEditingRanges(uri_1.URI.revive(resource), position, token);
                if (res) {
                    return {
                        ranges: res.ranges,
                        wordPattern: res.wordPattern ? ExtHostLanguageFeatures._serializeRegExp(res.wordPattern) : undefined
                    };
                }
                return undefined;
            }, undefined, token);
        }
        // --- references
        registerReferenceProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new ReferenceAdapter(this._documents, provider), extension);
            this._proxy.$registerReferenceSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideReferences(handle, resource, position, context, token) {
            return this._withAdapter(handle, ReferenceAdapter, adapter => adapter.provideReferences(uri_1.URI.revive(resource), position, context, token), undefined, token);
        }
        // --- quick fix
        registerCodeActionProvider(extension, selector, provider, metadata) {
            var _a, _b;
            const store = new lifecycle_1.DisposableStore();
            const handle = this._addNewAdapter(new CodeActionAdapter(this._documents, this._commands.converter, this._diagnostics, provider, this._logService, extension, this._apiDeprecation), extension);
            this._proxy.$registerQuickFixSupport(handle, this._transformDocumentSelector(selector), {
                providedKinds: (_a = metadata === null || metadata === void 0 ? void 0 : metadata.providedCodeActionKinds) === null || _a === void 0 ? void 0 : _a.map(kind => kind.value),
                documentation: (_b = metadata === null || metadata === void 0 ? void 0 : metadata.documentation) === null || _b === void 0 ? void 0 : _b.map(x => ({
                    kind: x.kind.value,
                    command: this._commands.converter.toInternal(x.command, store),
                }))
            }, ExtHostLanguageFeatures._extLabel(extension), Boolean(provider.resolveCodeAction));
            store.add(this._createDisposable(handle));
            return store;
        }
        $provideCodeActions(handle, resource, rangeOrSelection, context, token) {
            return this._withAdapter(handle, CodeActionAdapter, adapter => adapter.provideCodeActions(uri_1.URI.revive(resource), rangeOrSelection, context, token), undefined, token);
        }
        $resolveCodeAction(handle, id, token) {
            return this._withAdapter(handle, CodeActionAdapter, adapter => adapter.resolveCodeAction(id, token), undefined, undefined);
        }
        $releaseCodeActions(handle, cacheId) {
            this._withAdapter(handle, CodeActionAdapter, adapter => Promise.resolve(adapter.releaseCodeActions(cacheId)), undefined, undefined);
        }
        // --- formatting
        registerDocumentFormattingEditProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DocumentFormattingAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentFormattingSupport(handle, this._transformDocumentSelector(selector), extension.identifier, extension.displayName || extension.name);
            return this._createDisposable(handle);
        }
        $provideDocumentFormattingEdits(handle, resource, options, token) {
            return this._withAdapter(handle, DocumentFormattingAdapter, adapter => adapter.provideDocumentFormattingEdits(uri_1.URI.revive(resource), options, token), undefined, token);
        }
        registerDocumentRangeFormattingEditProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new RangeFormattingAdapter(this._documents, provider), extension);
            this._proxy.$registerRangeFormattingSupport(handle, this._transformDocumentSelector(selector), extension.identifier, extension.displayName || extension.name);
            return this._createDisposable(handle);
        }
        $provideDocumentRangeFormattingEdits(handle, resource, range, options, token) {
            return this._withAdapter(handle, RangeFormattingAdapter, adapter => adapter.provideDocumentRangeFormattingEdits(uri_1.URI.revive(resource), range, options, token), undefined, token);
        }
        registerOnTypeFormattingEditProvider(extension, selector, provider, triggerCharacters) {
            const handle = this._addNewAdapter(new OnTypeFormattingAdapter(this._documents, provider), extension);
            this._proxy.$registerOnTypeFormattingSupport(handle, this._transformDocumentSelector(selector), triggerCharacters, extension.identifier);
            return this._createDisposable(handle);
        }
        $provideOnTypeFormattingEdits(handle, resource, position, ch, options, token) {
            return this._withAdapter(handle, OnTypeFormattingAdapter, adapter => adapter.provideOnTypeFormattingEdits(uri_1.URI.revive(resource), position, ch, options, token), undefined, token);
        }
        // --- navigate types
        registerWorkspaceSymbolProvider(extension, provider) {
            const handle = this._addNewAdapter(new NavigateTypeAdapter(provider, this._logService), extension);
            this._proxy.$registerNavigateTypeSupport(handle, typeof provider.resolveWorkspaceSymbol === 'function');
            return this._createDisposable(handle);
        }
        $provideWorkspaceSymbols(handle, search, token) {
            return this._withAdapter(handle, NavigateTypeAdapter, adapter => adapter.provideWorkspaceSymbols(search, token), { symbols: [] }, token);
        }
        $resolveWorkspaceSymbol(handle, symbol, token) {
            return this._withAdapter(handle, NavigateTypeAdapter, adapter => adapter.resolveWorkspaceSymbol(symbol, token), undefined, undefined);
        }
        $releaseWorkspaceSymbols(handle, id) {
            this._withAdapter(handle, NavigateTypeAdapter, adapter => adapter.releaseWorkspaceSymbols(id), undefined, undefined);
        }
        // --- rename
        registerRenameProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new RenameAdapter(this._documents, provider, this._logService), extension);
            this._proxy.$registerRenameSupport(handle, this._transformDocumentSelector(selector), RenameAdapter.supportsResolving(provider));
            return this._createDisposable(handle);
        }
        $provideRenameEdits(handle, resource, position, newName, token) {
            return this._withAdapter(handle, RenameAdapter, adapter => adapter.provideRenameEdits(uri_1.URI.revive(resource), position, newName, token), undefined, token);
        }
        $resolveRenameLocation(handle, resource, position, token) {
            return this._withAdapter(handle, RenameAdapter, adapter => adapter.resolveRenameLocation(uri_1.URI.revive(resource), position, token), undefined, token);
        }
        //#region semantic coloring
        registerDocumentSemanticTokensProvider(extension, selector, provider, legend) {
            const handle = this._addNewAdapter(new DocumentSemanticTokensAdapter(this._documents, provider), extension);
            const eventHandle = (typeof provider.onDidChangeSemanticTokens === 'function' ? this._nextHandle() : undefined);
            this._proxy.$registerDocumentSemanticTokensProvider(handle, this._transformDocumentSelector(selector), legend, eventHandle);
            let result = this._createDisposable(handle);
            if (eventHandle) {
                const subscription = provider.onDidChangeSemanticTokens(_ => this._proxy.$emitDocumentSemanticTokensEvent(eventHandle));
                result = extHostTypes_1.Disposable.from(result, subscription);
            }
            return result;
        }
        $provideDocumentSemanticTokens(handle, resource, previousResultId, token) {
            return this._withAdapter(handle, DocumentSemanticTokensAdapter, adapter => adapter.provideDocumentSemanticTokens(uri_1.URI.revive(resource), previousResultId, token), null, token);
        }
        $releaseDocumentSemanticTokens(handle, semanticColoringResultId) {
            this._withAdapter(handle, DocumentSemanticTokensAdapter, adapter => adapter.releaseDocumentSemanticColoring(semanticColoringResultId), undefined, undefined);
        }
        registerDocumentRangeSemanticTokensProvider(extension, selector, provider, legend) {
            const handle = this._addNewAdapter(new DocumentRangeSemanticTokensAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentRangeSemanticTokensProvider(handle, this._transformDocumentSelector(selector), legend);
            return this._createDisposable(handle);
        }
        $provideDocumentRangeSemanticTokens(handle, resource, range, token) {
            return this._withAdapter(handle, DocumentRangeSemanticTokensAdapter, adapter => adapter.provideDocumentRangeSemanticTokens(uri_1.URI.revive(resource), range, token), null, token);
        }
        //#endregion
        // --- suggestion
        registerCompletionItemProvider(extension, selector, provider, triggerCharacters) {
            const handle = this._addNewAdapter(new CompletionsAdapter(this._documents, this._commands.converter, provider, this._apiDeprecation, extension), extension);
            // C9 changes: passing the extension identifier without trigger characters
            this._proxy.$registerCompletionsProvider(handle, this._transformDocumentSelector(selector), triggerCharacters, CompletionsAdapter.supportsResolving(provider), `${extension.identifier.value}(${triggerCharacters.join('')})`);
            return this._createDisposable(handle);
        }
        $provideCompletionItems(handle, resource, position, context, token) {
            return this._withAdapter(handle, CompletionsAdapter, adapter => adapter.provideCompletionItems(uri_1.URI.revive(resource), position, context, token), undefined, token);
        }
        $resolveCompletionItem(handle, id, token) {
            return this._withAdapter(handle, CompletionsAdapter, adapter => adapter.resolveCompletionItem(id, token), undefined, token);
        }
        $releaseCompletionItems(handle, id) {
            this._withAdapter(handle, CompletionsAdapter, adapter => adapter.releaseCompletionItems(id), undefined, undefined);
        }
        // --- ghost test
        registerInlineCompletionsProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new InlineCompletionAdapter(this._documents, provider, this._commands.converter), extension);
            this._proxy.$registerInlineCompletionsSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        registerInlineCompletionsProviderNew(extension, selector, provider) {
            const handle = this._addNewAdapter(new InlineCompletionAdapterNew(extension, this._documents, provider, this._commands.converter), extension);
            this._proxy.$registerInlineCompletionsSupport(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideInlineCompletions(handle, resource, position, context, token) {
            return this._withAdapter(handle, InlineCompletionAdapterBase, adapter => adapter.provideInlineCompletions(uri_1.URI.revive(resource), position, context, token), undefined, token);
        }
        $handleInlineCompletionDidShow(handle, pid, idx) {
            this._withAdapter(handle, InlineCompletionAdapterBase, async (adapter) => {
                adapter.handleDidShowCompletionItem(pid, idx);
            }, undefined, undefined);
        }
        $freeInlineCompletionsList(handle, pid) {
            this._withAdapter(handle, InlineCompletionAdapterBase, async (adapter) => { adapter.disposeCompletions(pid); }, undefined, undefined);
        }
        // --- parameter hints
        registerSignatureHelpProvider(extension, selector, provider, metadataOrTriggerChars) {
            const metadata = Array.isArray(metadataOrTriggerChars)
                ? { triggerCharacters: metadataOrTriggerChars, retriggerCharacters: [] }
                : metadataOrTriggerChars;
            const handle = this._addNewAdapter(new SignatureHelpAdapter(this._documents, provider), extension);
            this._proxy.$registerSignatureHelpProvider(handle, this._transformDocumentSelector(selector), metadata);
            return this._createDisposable(handle);
        }
        $provideSignatureHelp(handle, resource, position, context, token) {
            return this._withAdapter(handle, SignatureHelpAdapter, adapter => adapter.provideSignatureHelp(uri_1.URI.revive(resource), position, context, token), undefined, token);
        }
        $releaseSignatureHelp(handle, id) {
            this._withAdapter(handle, SignatureHelpAdapter, adapter => adapter.releaseSignatureHelp(id), undefined, undefined);
        }
        // --- inline hints
        registerInlayHintsProvider(extension, selector, provider) {
            const eventHandle = typeof provider.onDidChangeInlayHints === 'function' ? this._nextHandle() : undefined;
            const handle = this._addNewAdapter(new InlayHintsAdapter(this._documents, this._commands.converter, provider, this._logService, extension), extension);
            this._proxy.$registerInlayHintsProvider(handle, this._transformDocumentSelector(selector), typeof provider.resolveInlayHint === 'function', eventHandle, ExtHostLanguageFeatures._extLabel(extension));
            let result = this._createDisposable(handle);
            if (eventHandle !== undefined) {
                const subscription = provider.onDidChangeInlayHints(uri => this._proxy.$emitInlayHintsEvent(eventHandle));
                result = extHostTypes_1.Disposable.from(result, subscription);
            }
            return result;
        }
        $provideInlayHints(handle, resource, range, token) {
            return this._withAdapter(handle, InlayHintsAdapter, adapter => adapter.provideInlayHints(uri_1.URI.revive(resource), range, token), undefined, token);
        }
        $resolveInlayHint(handle, id, token) {
            return this._withAdapter(handle, InlayHintsAdapter, adapter => adapter.resolveInlayHint(id, token), undefined, token);
        }
        $releaseInlayHints(handle, id) {
            this._withAdapter(handle, InlayHintsAdapter, adapter => adapter.releaseHints(id), undefined, undefined);
        }
        // --- links
        registerDocumentLinkProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new LinkProviderAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentLinkProvider(handle, this._transformDocumentSelector(selector), typeof provider.resolveDocumentLink === 'function');
            return this._createDisposable(handle);
        }
        $provideDocumentLinks(handle, resource, token) {
            return this._withAdapter(handle, LinkProviderAdapter, adapter => adapter.provideLinks(uri_1.URI.revive(resource), token), undefined, token, resource.scheme === 'output');
        }
        $resolveDocumentLink(handle, id, token) {
            return this._withAdapter(handle, LinkProviderAdapter, adapter => adapter.resolveLink(id, token), undefined, undefined, true);
        }
        $releaseDocumentLinks(handle, id) {
            this._withAdapter(handle, LinkProviderAdapter, adapter => adapter.releaseLinks(id), undefined, undefined, true);
        }
        registerColorProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new ColorProviderAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentColorProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideDocumentColors(handle, resource, token) {
            return this._withAdapter(handle, ColorProviderAdapter, adapter => adapter.provideColors(uri_1.URI.revive(resource), token), [], token);
        }
        $provideColorPresentations(handle, resource, colorInfo, token) {
            return this._withAdapter(handle, ColorProviderAdapter, adapter => adapter.provideColorPresentations(uri_1.URI.revive(resource), colorInfo, token), undefined, token);
        }
        registerFoldingRangeProvider(extension, selector, provider) {
            const handle = this._nextHandle();
            const eventHandle = typeof provider.onDidChangeFoldingRanges === 'function' ? this._nextHandle() : undefined;
            this._adapter.set(handle, new AdapterData(new FoldingProviderAdapter(this._documents, provider), extension));
            this._proxy.$registerFoldingRangeProvider(handle, this._transformDocumentSelector(selector), eventHandle);
            let result = this._createDisposable(handle);
            if (eventHandle !== undefined) {
                const subscription = provider.onDidChangeFoldingRanges(() => this._proxy.$emitFoldingRangeEvent(eventHandle));
                result = extHostTypes_1.Disposable.from(result, subscription);
            }
            return result;
        }
        $provideFoldingRanges(handle, resource, context, token) {
            return this._withAdapter(handle, FoldingProviderAdapter, adapter => adapter.provideFoldingRanges(uri_1.URI.revive(resource), context, token), undefined, token);
        }
        // --- smart select
        registerSelectionRangeProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new SelectionRangeAdapter(this._documents, provider, this._logService), extension);
            this._proxy.$registerSelectionRangeProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideSelectionRanges(handle, resource, positions, token) {
            return this._withAdapter(handle, SelectionRangeAdapter, adapter => adapter.provideSelectionRanges(uri_1.URI.revive(resource), positions, token), [], token);
        }
        // --- call hierarchy
        registerCallHierarchyProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new CallHierarchyAdapter(this._documents, provider), extension);
            this._proxy.$registerCallHierarchyProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $prepareCallHierarchy(handle, resource, position, token) {
            return this._withAdapter(handle, CallHierarchyAdapter, adapter => Promise.resolve(adapter.prepareSession(uri_1.URI.revive(resource), position, token)), undefined, token);
        }
        $provideCallHierarchyIncomingCalls(handle, sessionId, itemId, token) {
            return this._withAdapter(handle, CallHierarchyAdapter, adapter => adapter.provideCallsTo(sessionId, itemId, token), undefined, token);
        }
        $provideCallHierarchyOutgoingCalls(handle, sessionId, itemId, token) {
            return this._withAdapter(handle, CallHierarchyAdapter, adapter => adapter.provideCallsFrom(sessionId, itemId, token), undefined, token);
        }
        $releaseCallHierarchy(handle, sessionId) {
            this._withAdapter(handle, CallHierarchyAdapter, adapter => Promise.resolve(adapter.releaseSession(sessionId)), undefined, undefined);
        }
        // --- type hierarchy
        registerTypeHierarchyProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new TypeHierarchyAdapter(this._documents, provider), extension);
            this._proxy.$registerTypeHierarchyProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $prepareTypeHierarchy(handle, resource, position, token) {
            return this._withAdapter(handle, TypeHierarchyAdapter, adapter => Promise.resolve(adapter.prepareSession(uri_1.URI.revive(resource), position, token)), undefined, token);
        }
        $provideTypeHierarchySupertypes(handle, sessionId, itemId, token) {
            return this._withAdapter(handle, TypeHierarchyAdapter, adapter => adapter.provideSupertypes(sessionId, itemId, token), undefined, token);
        }
        $provideTypeHierarchySubtypes(handle, sessionId, itemId, token) {
            return this._withAdapter(handle, TypeHierarchyAdapter, adapter => adapter.provideSubtypes(sessionId, itemId, token), undefined, token);
        }
        $releaseTypeHierarchy(handle, sessionId) {
            this._withAdapter(handle, TypeHierarchyAdapter, adapter => Promise.resolve(adapter.releaseSession(sessionId)), undefined, undefined);
        }
        // --- Document on drop
        registerDocumentOnDropProvider(extension, selector, provider) {
            const handle = this._addNewAdapter(new DocumentOnDropAdapter(this._documents, provider), extension);
            this._proxy.$registerDocumentOnDropProvider(handle, this._transformDocumentSelector(selector));
            return this._createDisposable(handle);
        }
        $provideDocumentOnDropEdits(handle, resource, position, dataTransferDto, token) {
            return this._withAdapter(handle, DocumentOnDropAdapter, adapter => Promise.resolve(adapter.provideDocumentOnDropEdits(uri_1.URI.revive(resource), position, dataTransferDto, token)), undefined, undefined);
        }
        // --- configuration
        static _serializeRegExp(regExp) {
            return {
                pattern: regExp.source,
                flags: (0, strings_1.regExpFlags)(regExp),
            };
        }
        static _serializeIndentationRule(indentationRule) {
            return {
                decreaseIndentPattern: ExtHostLanguageFeatures._serializeRegExp(indentationRule.decreaseIndentPattern),
                increaseIndentPattern: ExtHostLanguageFeatures._serializeRegExp(indentationRule.increaseIndentPattern),
                indentNextLinePattern: indentationRule.indentNextLinePattern ? ExtHostLanguageFeatures._serializeRegExp(indentationRule.indentNextLinePattern) : undefined,
                unIndentedLinePattern: indentationRule.unIndentedLinePattern ? ExtHostLanguageFeatures._serializeRegExp(indentationRule.unIndentedLinePattern) : undefined,
            };
        }
        static _serializeOnEnterRule(onEnterRule) {
            return {
                beforeText: ExtHostLanguageFeatures._serializeRegExp(onEnterRule.beforeText),
                afterText: onEnterRule.afterText ? ExtHostLanguageFeatures._serializeRegExp(onEnterRule.afterText) : undefined,
                previousLineText: onEnterRule.previousLineText ? ExtHostLanguageFeatures._serializeRegExp(onEnterRule.previousLineText) : undefined,
                action: onEnterRule.action
            };
        }
        static _serializeOnEnterRules(onEnterRules) {
            return onEnterRules.map(ExtHostLanguageFeatures._serializeOnEnterRule);
        }
        setLanguageConfiguration(extension, languageId, configuration) {
            let { wordPattern } = configuration;
            // check for a valid word pattern
            if (wordPattern && (0, strings_1.regExpLeadsToEndlessLoop)(wordPattern)) {
                throw new Error(`Invalid language configuration: wordPattern '${wordPattern}' is not allowed to match the empty string.`);
            }
            // word definition
            if (wordPattern) {
                this._documents.setWordDefinitionFor(languageId, wordPattern);
            }
            else {
                this._documents.setWordDefinitionFor(languageId, undefined);
            }
            if (configuration.__electricCharacterSupport) {
                this._apiDeprecation.report('LanguageConfiguration.__electricCharacterSupport', extension, `Do not use.`);
            }
            if (configuration.__characterPairSupport) {
                this._apiDeprecation.report('LanguageConfiguration.__characterPairSupport', extension, `Do not use.`);
            }
            const handle = this._nextHandle();
            const serializedConfiguration = {
                comments: configuration.comments,
                brackets: configuration.brackets,
                wordPattern: configuration.wordPattern ? ExtHostLanguageFeatures._serializeRegExp(configuration.wordPattern) : undefined,
                indentationRules: configuration.indentationRules ? ExtHostLanguageFeatures._serializeIndentationRule(configuration.indentationRules) : undefined,
                onEnterRules: configuration.onEnterRules ? ExtHostLanguageFeatures._serializeOnEnterRules(configuration.onEnterRules) : undefined,
                __electricCharacterSupport: configuration.__electricCharacterSupport,
                __characterPairSupport: configuration.__characterPairSupport,
            };
            this._proxy.$setLanguageConfiguration(handle, languageId, serializedConfiguration);
            return this._createDisposable(handle);
        }
        $setWordDefinitions(wordDefinitions) {
            for (const wordDefinition of wordDefinitions) {
                this._documents.setWordDefinitionFor(wordDefinition.languageId, new RegExp(wordDefinition.regexSource, wordDefinition.regexFlags));
            }
        }
    }
    exports.ExtHostLanguageFeatures = ExtHostLanguageFeatures;
    ExtHostLanguageFeatures._handlePool = 0;
});
//# sourceMappingURL=extHostLanguageFeatures.js.map