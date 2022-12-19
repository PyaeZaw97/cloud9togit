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
define(["require", "exports", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/languageConfigurationRegistry", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/suggest/browser/suggest", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/log/common/log", "./snippetSession"], function (require, exports, lifecycle_1, editorExtensions_1, position_1, range_1, editorContextKeys_1, languageConfigurationRegistry_1, languageFeatures_1, suggest_1, nls_1, contextkey_1, log_1, snippetSession_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.performSnippetEdit = exports.SnippetController2 = void 0;
    const _defaultOptions = {
        overwriteBefore: 0,
        overwriteAfter: 0,
        undoStopBefore: true,
        undoStopAfter: true,
        adjustWhitespace: true,
        clipboardText: undefined,
        overtypingCapturer: undefined
    };
    let SnippetController2 = class SnippetController2 {
        constructor(_editor, _logService, _languageFeaturesService, contextKeyService, _languageConfigurationService) {
            this._editor = _editor;
            this._logService = _logService;
            this._languageFeaturesService = _languageFeaturesService;
            this._languageConfigurationService = _languageConfigurationService;
            this._snippetListener = new lifecycle_1.DisposableStore();
            this._modelVersionId = -1;
            this._inSnippet = SnippetController2.InSnippetMode.bindTo(contextKeyService);
            this._hasNextTabstop = SnippetController2.HasNextTabstop.bindTo(contextKeyService);
            this._hasPrevTabstop = SnippetController2.HasPrevTabstop.bindTo(contextKeyService);
        }
        static get(editor) {
            return editor.getContribution(SnippetController2.ID);
        }
        dispose() {
            var _a;
            this._inSnippet.reset();
            this._hasPrevTabstop.reset();
            this._hasNextTabstop.reset();
            (_a = this._session) === null || _a === void 0 ? void 0 : _a.dispose();
            this._snippetListener.dispose();
        }
        insert(template, opts) {
            // this is here to find out more about the yet-not-understood
            // error that sometimes happens when we fail to inserted a nested
            // snippet
            try {
                this._doInsert(template, typeof opts === 'undefined' ? _defaultOptions : Object.assign(Object.assign({}, _defaultOptions), opts));
            }
            catch (e) {
                this.cancel();
                this._logService.error(e);
                this._logService.error('snippet_error');
                this._logService.error('insert_template=', template);
                this._logService.error('existing_template=', this._session ? this._session._logInfo() : '<no_session>');
            }
        }
        _doInsert(template, opts) {
            var _a;
            if (!this._editor.hasModel()) {
                return;
            }
            // don't listen while inserting the snippet
            // as that is the inflight state causing cancelation
            this._snippetListener.clear();
            if (opts.undoStopBefore) {
                this._editor.getModel().pushStackElement();
            }
            if (!this._session) {
                this._modelVersionId = this._editor.getModel().getAlternativeVersionId();
                this._session = new snippetSession_1.SnippetSession(this._editor, template, opts, this._languageConfigurationService);
                this._session.insert();
            }
            else {
                this._session.merge(template, opts);
            }
            if (opts.undoStopAfter) {
                this._editor.getModel().pushStackElement();
            }
            // regster completion item provider when there is any choice element
            if ((_a = this._session) === null || _a === void 0 ? void 0 : _a.hasChoice) {
                this._choiceCompletionItemProvider = {
                    provideCompletionItems: (model, position) => {
                        if (!this._session || model !== this._editor.getModel() || !position_1.Position.equals(this._editor.getPosition(), position)) {
                            return undefined;
                        }
                        const { activeChoice } = this._session;
                        if (!activeChoice || activeChoice.options.length === 0) {
                            return undefined;
                        }
                        const info = model.getWordUntilPosition(position);
                        const isAnyOfOptions = Boolean(activeChoice.options.find(o => o.value === info.word));
                        const suggestions = [];
                        for (let i = 0; i < activeChoice.options.length; i++) {
                            const option = activeChoice.options[i];
                            suggestions.push({
                                kind: 13 /* CompletionItemKind.Value */,
                                label: option.value,
                                insertText: option.value,
                                sortText: 'a'.repeat(i + 1),
                                range: new range_1.Range(position.lineNumber, info.startColumn, position.lineNumber, info.endColumn),
                                filterText: isAnyOfOptions ? `${info.word}_${option.value}` : undefined,
                                command: { id: 'jumpToNextSnippetPlaceholder', title: (0, nls_1.localize)('next', 'Go to next placeholder...') }
                            });
                        }
                        return { suggestions };
                    }
                };
                const registration = this._languageFeaturesService.completionProvider.register({
                    language: this._editor.getModel().getLanguageId(),
                    pattern: this._editor.getModel().uri.fsPath,
                    scheme: this._editor.getModel().uri.scheme
                }, this._choiceCompletionItemProvider);
                this._snippetListener.add(registration);
            }
            this._updateState();
            this._snippetListener.add(this._editor.onDidChangeModelContent(e => e.isFlush && this.cancel()));
            this._snippetListener.add(this._editor.onDidChangeModel(() => this.cancel()));
            this._snippetListener.add(this._editor.onDidChangeCursorSelection(() => this._updateState()));
        }
        _updateState() {
            if (!this._session || !this._editor.hasModel()) {
                // canceled in the meanwhile
                return;
            }
            if (this._modelVersionId === this._editor.getModel().getAlternativeVersionId()) {
                // undo until the 'before' state happened
                // and makes use cancel snippet mode
                return this.cancel();
            }
            if (!this._session.hasPlaceholder) {
                // don't listen for selection changes and don't
                // update context keys when the snippet is plain text
                return this.cancel();
            }
            if (this._session.isAtLastPlaceholder || !this._session.isSelectionWithinPlaceholders()) {
                this._editor.getModel().pushStackElement();
                return this.cancel();
            }
            this._inSnippet.set(true);
            this._hasPrevTabstop.set(!this._session.isAtFirstPlaceholder);
            this._hasNextTabstop.set(!this._session.isAtLastPlaceholder);
            this._handleChoice();
        }
        _handleChoice() {
            if (!this._session || !this._editor.hasModel()) {
                this._currentChoice = undefined;
                return;
            }
            const { activeChoice } = this._session;
            if (!activeChoice || !this._choiceCompletionItemProvider) {
                this._currentChoice = undefined;
                return;
            }
            if (this._currentChoice !== activeChoice) {
                this._currentChoice = activeChoice;
                // trigger suggest with the special choice completion provider
                queueMicrotask(() => {
                    (0, suggest_1.showSimpleSuggestions)(this._editor, this._choiceCompletionItemProvider);
                });
            }
        }
        finish() {
            while (this._inSnippet.get()) {
                this.next();
            }
        }
        cancel(resetSelection = false) {
            var _a;
            this._inSnippet.reset();
            this._hasPrevTabstop.reset();
            this._hasNextTabstop.reset();
            this._snippetListener.clear();
            this._currentChoice = undefined;
            (_a = this._session) === null || _a === void 0 ? void 0 : _a.dispose();
            this._session = undefined;
            this._modelVersionId = -1;
            if (resetSelection) {
                // reset selection to the primary cursor when being asked
                // for. this happens when explicitly cancelling snippet mode,
                // e.g. when pressing ESC
                this._editor.setSelections([this._editor.getSelection()]);
            }
        }
        prev() {
            if (this._session) {
                this._session.prev();
            }
            this._updateState();
        }
        next() {
            if (this._session) {
                this._session.next();
            }
            this._updateState();
        }
        isInSnippet() {
            return Boolean(this._inSnippet.get());
        }
        getSessionEnclosingRange() {
            if (this._session) {
                return this._session.getEnclosingRange();
            }
            return undefined;
        }
    };
    SnippetController2.ID = 'snippetController2';
    SnippetController2.InSnippetMode = new contextkey_1.RawContextKey('inSnippetMode', false, (0, nls_1.localize)('inSnippetMode', "Whether the editor in current in snippet mode"));
    SnippetController2.HasNextTabstop = new contextkey_1.RawContextKey('hasNextTabstop', false, (0, nls_1.localize)('hasNextTabstop', "Whether there is a next tab stop when in snippet mode"));
    SnippetController2.HasPrevTabstop = new contextkey_1.RawContextKey('hasPrevTabstop', false, (0, nls_1.localize)('hasPrevTabstop', "Whether there is a previous tab stop when in snippet mode"));
    SnippetController2 = __decorate([
        __param(1, log_1.ILogService),
        __param(2, languageFeatures_1.ILanguageFeaturesService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, languageConfigurationRegistry_1.ILanguageConfigurationService)
    ], SnippetController2);
    exports.SnippetController2 = SnippetController2;
    (0, editorExtensions_1.registerEditorContribution)(SnippetController2.ID, SnippetController2);
    const CommandCtor = editorExtensions_1.EditorCommand.bindToContribution(SnippetController2.get);
    (0, editorExtensions_1.registerEditorCommand)(new CommandCtor({
        id: 'jumpToNextSnippetPlaceholder',
        precondition: contextkey_1.ContextKeyExpr.and(SnippetController2.InSnippetMode, SnippetController2.HasNextTabstop),
        handler: ctrl => ctrl.next(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 30,
            kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            primary: 2 /* KeyCode.Tab */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new CommandCtor({
        id: 'jumpToPrevSnippetPlaceholder',
        precondition: contextkey_1.ContextKeyExpr.and(SnippetController2.InSnippetMode, SnippetController2.HasPrevTabstop),
        handler: ctrl => ctrl.prev(),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 30,
            kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            primary: 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new CommandCtor({
        id: 'leaveSnippet',
        precondition: SnippetController2.InSnippetMode,
        handler: ctrl => ctrl.cancel(true),
        kbOpts: {
            weight: 100 /* KeybindingWeight.EditorContrib */ + 30,
            kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            primary: 9 /* KeyCode.Escape */,
            secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */]
        }
    }));
    (0, editorExtensions_1.registerEditorCommand)(new CommandCtor({
        id: 'acceptSnippet',
        precondition: SnippetController2.InSnippetMode,
        handler: ctrl => ctrl.finish(),
        // kbOpts: {
        // 	weight: KeybindingWeight.EditorContrib + 30,
        // 	kbExpr: EditorContextKeys.textFocus,
        // 	primary: KeyCode.Enter,
        // }
    }));
    // ---
    function performSnippetEdit(editor, edit) {
        const controller = SnippetController2.get(editor);
        if (!controller) {
            return false;
        }
        editor.focus();
        editor.setSelection(edit.range);
        controller.insert(edit.snippet);
        return controller.isInSnippet();
    }
    exports.performSnippetEdit = performSnippetEdit;
});
//# sourceMappingURL=snippetController2.js.map