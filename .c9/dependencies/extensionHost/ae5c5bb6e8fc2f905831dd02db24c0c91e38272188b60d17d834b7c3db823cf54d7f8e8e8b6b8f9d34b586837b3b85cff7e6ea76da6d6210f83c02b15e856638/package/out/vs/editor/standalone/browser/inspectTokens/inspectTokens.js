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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/languages", "vs/editor/common/languages/nullTokenize", "vs/editor/common/languages/language", "vs/editor/standalone/common/standaloneTheme", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/editor/common/standaloneStrings", "vs/platform/theme/common/theme", "vs/css!./inspectTokens"], function (require, exports, dom_1, color_1, lifecycle_1, editorExtensions_1, languages_1, nullTokenize_1, language_1, standaloneTheme_1, colorRegistry_1, themeService_1, standaloneStrings_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let InspectTokensController = class InspectTokensController extends lifecycle_1.Disposable {
        constructor(editor, standaloneColorService, languageService) {
            super();
            this._editor = editor;
            this._languageService = languageService;
            this._widget = null;
            this._register(this._editor.onDidChangeModel((e) => this.stop()));
            this._register(this._editor.onDidChangeModelLanguage((e) => this.stop()));
            this._register(languages_1.TokenizationRegistry.onDidChange((e) => this.stop()));
            this._register(this._editor.onKeyUp((e) => e.keyCode === 9 /* KeyCode.Escape */ && this.stop()));
        }
        static get(editor) {
            return editor.getContribution(InspectTokensController.ID);
        }
        dispose() {
            this.stop();
            super.dispose();
        }
        launch() {
            if (this._widget) {
                return;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            this._widget = new InspectTokensWidget(this._editor, this._languageService);
        }
        stop() {
            if (this._widget) {
                this._widget.dispose();
                this._widget = null;
            }
        }
    };
    InspectTokensController.ID = 'editor.contrib.inspectTokens';
    InspectTokensController = __decorate([
        __param(1, standaloneTheme_1.IStandaloneThemeService),
        __param(2, language_1.ILanguageService)
    ], InspectTokensController);
    class InspectTokens extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.inspectTokens',
                label: standaloneStrings_1.InspectTokensNLS.inspectTokensAction,
                alias: 'Developer: Inspect Tokens',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            const controller = InspectTokensController.get(editor);
            if (controller) {
                controller.launch();
            }
        }
    }
    function renderTokenText(tokenText) {
        let result = '';
        for (let charIndex = 0, len = tokenText.length; charIndex < len; charIndex++) {
            const charCode = tokenText.charCodeAt(charIndex);
            switch (charCode) {
                case 9 /* CharCode.Tab */:
                    result += '\u2192'; // &rarr;
                    break;
                case 32 /* CharCode.Space */:
                    result += '\u00B7'; // &middot;
                    break;
                default:
                    result += String.fromCharCode(charCode);
            }
        }
        return result;
    }
    function getSafeTokenizationSupport(languageIdCodec, languageId) {
        const tokenizationSupport = languages_1.TokenizationRegistry.get(languageId);
        if (tokenizationSupport) {
            return tokenizationSupport;
        }
        const encodedLanguageId = languageIdCodec.encodeLanguageId(languageId);
        return {
            getInitialState: () => nullTokenize_1.NullState,
            tokenize: (line, hasEOL, state) => (0, nullTokenize_1.nullTokenize)(languageId, state),
            tokenizeEncoded: (line, hasEOL, state) => (0, nullTokenize_1.nullTokenizeEncoded)(encodedLanguageId, state)
        };
    }
    class InspectTokensWidget extends lifecycle_1.Disposable {
        constructor(editor, languageService) {
            super();
            // Editor.IContentWidget.allowEditorOverflow
            this.allowEditorOverflow = true;
            this._editor = editor;
            this._languageService = languageService;
            this._model = this._editor.getModel();
            this._domNode = document.createElement('div');
            this._domNode.className = 'tokens-inspect-widget';
            this._tokenizationSupport = getSafeTokenizationSupport(this._languageService.languageIdCodec, this._model.getLanguageId());
            this._compute(this._editor.getPosition());
            this._register(this._editor.onDidChangeCursorPosition((e) => this._compute(this._editor.getPosition())));
            this._editor.addContentWidget(this);
        }
        dispose() {
            this._editor.removeContentWidget(this);
            super.dispose();
        }
        getId() {
            return InspectTokensWidget._ID;
        }
        _compute(position) {
            const data = this._getTokensAtLine(position.lineNumber);
            let token1Index = 0;
            for (let i = data.tokens1.length - 1; i >= 0; i--) {
                const t = data.tokens1[i];
                if (position.column - 1 >= t.offset) {
                    token1Index = i;
                    break;
                }
            }
            let token2Index = 0;
            for (let i = (data.tokens2.length >>> 1); i >= 0; i--) {
                if (position.column - 1 >= data.tokens2[(i << 1)]) {
                    token2Index = i;
                    break;
                }
            }
            const lineContent = this._model.getLineContent(position.lineNumber);
            let tokenText = '';
            if (token1Index < data.tokens1.length) {
                const tokenStartIndex = data.tokens1[token1Index].offset;
                const tokenEndIndex = token1Index + 1 < data.tokens1.length ? data.tokens1[token1Index + 1].offset : lineContent.length;
                tokenText = lineContent.substring(tokenStartIndex, tokenEndIndex);
            }
            (0, dom_1.reset)(this._domNode, (0, dom_1.$)('h2.tm-token', undefined, renderTokenText(tokenText), (0, dom_1.$)('span.tm-token-length', undefined, `${tokenText.length} ${tokenText.length === 1 ? 'char' : 'chars'}`)));
            (0, dom_1.append)(this._domNode, (0, dom_1.$)('hr.tokens-inspect-separator', { 'style': 'clear:both' }));
            const metadata = (token2Index << 1) + 1 < data.tokens2.length ? this._decodeMetadata(data.tokens2[(token2Index << 1) + 1]) : null;
            (0, dom_1.append)(this._domNode, (0, dom_1.$)('table.tm-metadata-table', undefined, (0, dom_1.$)('tbody', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'language'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? metadata.languageId : '-?-'}`)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'token type'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? this._tokenTypeToString(metadata.tokenType) : '-?-'}`)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'font style'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? this._fontStyleToString(metadata.fontStyle) : '-?-'}`)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'foreground'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? color_1.Color.Format.CSS.formatHex(metadata.foreground) : '-?-'}`)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td.tm-metadata-key', undefined, 'background'), (0, dom_1.$)('td.tm-metadata-value', undefined, `${metadata ? color_1.Color.Format.CSS.formatHex(metadata.background) : '-?-'}`)))));
            (0, dom_1.append)(this._domNode, (0, dom_1.$)('hr.tokens-inspect-separator'));
            if (token1Index < data.tokens1.length) {
                (0, dom_1.append)(this._domNode, (0, dom_1.$)('span.tm-token-type', undefined, data.tokens1[token1Index].type));
            }
            this._editor.layoutContentWidget(this);
        }
        _decodeMetadata(metadata) {
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const languageId = languages_1.TokenMetadata.getLanguageId(metadata);
            const tokenType = languages_1.TokenMetadata.getTokenType(metadata);
            const fontStyle = languages_1.TokenMetadata.getFontStyle(metadata);
            const foreground = languages_1.TokenMetadata.getForeground(metadata);
            const background = languages_1.TokenMetadata.getBackground(metadata);
            return {
                languageId: this._languageService.languageIdCodec.decodeLanguageId(languageId),
                tokenType: tokenType,
                fontStyle: fontStyle,
                foreground: colorMap[foreground],
                background: colorMap[background]
            };
        }
        _tokenTypeToString(tokenType) {
            switch (tokenType) {
                case 0 /* StandardTokenType.Other */: return 'Other';
                case 1 /* StandardTokenType.Comment */: return 'Comment';
                case 2 /* StandardTokenType.String */: return 'String';
                case 3 /* StandardTokenType.RegEx */: return 'RegEx';
                default: return '??';
            }
        }
        _fontStyleToString(fontStyle) {
            let r = '';
            if (fontStyle & 1 /* FontStyle.Italic */) {
                r += 'italic ';
            }
            if (fontStyle & 2 /* FontStyle.Bold */) {
                r += 'bold ';
            }
            if (fontStyle & 4 /* FontStyle.Underline */) {
                r += 'underline ';
            }
            if (fontStyle & 8 /* FontStyle.Strikethrough */) {
                r += 'strikethrough ';
            }
            if (r.length === 0) {
                r = '---';
            }
            return r;
        }
        _getTokensAtLine(lineNumber) {
            const stateBeforeLine = this._getStateBeforeLine(lineNumber);
            const tokenizationResult1 = this._tokenizationSupport.tokenize(this._model.getLineContent(lineNumber), true, stateBeforeLine);
            const tokenizationResult2 = this._tokenizationSupport.tokenizeEncoded(this._model.getLineContent(lineNumber), true, stateBeforeLine);
            return {
                startState: stateBeforeLine,
                tokens1: tokenizationResult1.tokens,
                tokens2: tokenizationResult2.tokens,
                endState: tokenizationResult1.endState
            };
        }
        _getStateBeforeLine(lineNumber) {
            let state = this._tokenizationSupport.getInitialState();
            for (let i = 1; i < lineNumber; i++) {
                const tokenizationResult = this._tokenizationSupport.tokenize(this._model.getLineContent(i), true, state);
                state = tokenizationResult.endState;
            }
            return state;
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return {
                position: this._editor.getPosition(),
                preference: [2 /* ContentWidgetPositionPreference.BELOW */, 1 /* ContentWidgetPositionPreference.ABOVE */]
            };
        }
    }
    InspectTokensWidget._ID = 'editor.contrib.inspectTokensWidget';
    (0, editorExtensions_1.registerEditorContribution)(InspectTokensController.ID, InspectTokensController);
    (0, editorExtensions_1.registerEditorAction)(InspectTokens);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const border = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (border) {
            const borderWidth = (0, theme_1.isHighContrast)(theme.type) ? 2 : 1;
            collector.addRule(`.monaco-editor .tokens-inspect-widget { border: ${borderWidth}px solid ${border}; }`);
            collector.addRule(`.monaco-editor .tokens-inspect-widget .tokens-inspect-separator { background-color: ${border}; }`);
        }
        const background = theme.getColor(colorRegistry_1.editorHoverBackground);
        if (background) {
            collector.addRule(`.monaco-editor .tokens-inspect-widget { background-color: ${background}; }`);
        }
        const foreground = theme.getColor(colorRegistry_1.editorHoverForeground);
        if (foreground) {
            collector.addRule(`.monaco-editor .tokens-inspect-widget { color: ${foreground}; }`);
        }
    });
});
//# sourceMappingURL=inspectTokens.js.map