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
define(["require", "exports", "vs/base/browser/markdownRenderer", "vs/platform/opener/common/opener", "vs/editor/common/languages/language", "vs/base/common/errors", "vs/editor/common/languages/textToHtmlTokenizer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/editor/browser/config/domFontInfo", "vs/editor/common/languages/modesRegistry"], function (require, exports, markdownRenderer_1, opener_1, language_1, errors_1, textToHtmlTokenizer_1, event_1, lifecycle_1, domFontInfo_1, modesRegistry_1) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkdownRenderer = void 0;
    /**
     * Markdown renderer that can render codeblocks with the editor mechanics. This
     * renderer should always be preferred.
     */
    let MarkdownRenderer = class MarkdownRenderer {
        constructor(_options, _languageService, _openerService) {
            this._options = _options;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this._onDidRenderAsync = new event_1.Emitter();
            this.onDidRenderAsync = this._onDidRenderAsync.event;
        }
        dispose() {
            this._onDidRenderAsync.dispose();
        }
        render(markdown, options, markedOptions) {
            if (!markdown) {
                const element = document.createElement('span');
                return { element, dispose: () => { } };
            }
            const disposables = new lifecycle_1.DisposableStore();
            const rendered = disposables.add((0, markdownRenderer_1.renderMarkdown)(markdown, Object.assign(Object.assign({}, this._getRenderOptions(markdown, disposables)), options), markedOptions));
            return {
                element: rendered.element,
                dispose: () => disposables.dispose()
            };
        }
        _getRenderOptions(markdown, disposables) {
            return {
                codeBlockRenderer: async (languageAlias, value) => {
                    var _a, _b, _c;
                    // In markdown,
                    // it is possible that we stumble upon language aliases (e.g.js instead of javascript)
                    // it is possible no alias is given in which case we fall back to the current editor lang
                    let languageId;
                    if (languageAlias) {
                        languageId = this._languageService.getLanguageIdByLanguageName(languageAlias);
                    }
                    else if (this._options.editor) {
                        languageId = (_a = this._options.editor.getModel()) === null || _a === void 0 ? void 0 : _a.getLanguageId();
                    }
                    if (!languageId) {
                        languageId = modesRegistry_1.PLAINTEXT_LANGUAGE_ID;
                    }
                    const html = await (0, textToHtmlTokenizer_1.tokenizeToString)(this._languageService, value, languageId);
                    const element = document.createElement('span');
                    element.innerHTML = ((_c = (_b = MarkdownRenderer._ttpTokenizer) === null || _b === void 0 ? void 0 : _b.createHTML(html)) !== null && _c !== void 0 ? _c : html);
                    // use "good" font
                    if (this._options.editor) {
                        const fontInfo = this._options.editor.getOption(44 /* EditorOption.fontInfo */);
                        (0, domFontInfo_1.applyFontInfo)(element, fontInfo);
                    }
                    else if (this._options.codeBlockFontFamily) {
                        element.style.fontFamily = this._options.codeBlockFontFamily;
                    }
                    if (this._options.codeBlockFontSize !== undefined) {
                        element.style.fontSize = this._options.codeBlockFontSize;
                    }
                    return element;
                },
                asyncRenderCallback: () => this._onDidRenderAsync.fire(),
                actionHandler: {
                    callback: (content) => this._openerService.open(content, { fromUserGesture: true, allowContributedOpeners: true, allowCommands: markdown.isTrusted }).catch(errors_1.onUnexpectedError),
                    disposables: disposables
                }
            };
        }
    };
    MarkdownRenderer._ttpTokenizer = (_a = window.trustedTypes) === null || _a === void 0 ? void 0 : _a.createPolicy('tokenizeToString', {
        createHTML(html) {
            return html;
        }
    });
    MarkdownRenderer = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, opener_1.IOpenerService)
    ], MarkdownRenderer);
    exports.MarkdownRenderer = MarkdownRenderer;
});
//# sourceMappingURL=markdownRenderer.js.map