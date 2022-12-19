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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/editor/contrib/markdownRenderer/browser/markdownRenderer", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/languages/language", "vs/editor/contrib/hover/browser/getHover", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/opener/common/opener", "vs/editor/common/services/languageFeatures"], function (require, exports, dom, arrays_1, async_1, htmlContent_1, lifecycle_1, markdownRenderer_1, position_1, range_1, language_1, getHover_1, nls, configuration_1, opener_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.renderMarkdownHovers = exports.MarkdownHoverParticipant = exports.MarkdownHover = void 0;
    const $ = dom.$;
    class MarkdownHover {
        constructor(owner, range, contents, ordinal) {
            this.owner = owner;
            this.range = range;
            this.contents = contents;
            this.ordinal = ordinal;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
    }
    exports.MarkdownHover = MarkdownHover;
    let MarkdownHoverParticipant = class MarkdownHoverParticipant {
        constructor(_editor, _languageService, _openerService, _configurationService, _languageFeaturesService) {
            this._editor = _editor;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this._configurationService = _configurationService;
            this._languageFeaturesService = _languageFeaturesService;
            this.hoverOrdinal = 2;
        }
        createLoadingMessage(anchor) {
            return new MarkdownHover(this, anchor.range, [new htmlContent_1.MarkdownString().appendText(nls.localize('modesContentHover.loading', "Loading..."))], 2000);
        }
        computeSync(anchor, lineDecorations) {
            if (!this._editor.hasModel() || anchor.type !== 1 /* HoverAnchorType.Range */) {
                return [];
            }
            const model = this._editor.getModel();
            const lineNumber = anchor.range.startLineNumber;
            const maxColumn = model.getLineMaxColumn(lineNumber);
            const result = [];
            let index = 1000;
            const lineLength = model.getLineLength(lineNumber);
            const languageId = model.getLanguageIdAtPosition(anchor.range.startLineNumber, anchor.range.startColumn);
            const maxTokenizationLineLength = this._configurationService.getValue('editor.maxTokenizationLineLength', {
                overrideIdentifier: languageId
            });
            if (typeof maxTokenizationLineLength === 'number' && lineLength >= maxTokenizationLineLength) {
                result.push(new MarkdownHover(this, anchor.range, [{
                        value: nls.localize('too many characters', "Tokenization is skipped for long lines for performance reasons. This can be configured via `editor.maxTokenizationLineLength`.")
                    }], index++));
            }
            for (const d of lineDecorations) {
                const startColumn = (d.range.startLineNumber === lineNumber) ? d.range.startColumn : 1;
                const endColumn = (d.range.endLineNumber === lineNumber) ? d.range.endColumn : maxColumn;
                const hoverMessage = d.options.hoverMessage;
                if (!hoverMessage || (0, htmlContent_1.isEmptyMarkdownString)(hoverMessage)) {
                    continue;
                }
                const range = new range_1.Range(anchor.range.startLineNumber, startColumn, anchor.range.startLineNumber, endColumn);
                result.push(new MarkdownHover(this, range, (0, arrays_1.asArray)(hoverMessage), index++));
            }
            return result;
        }
        computeAsync(anchor, lineDecorations, token) {
            if (!this._editor.hasModel() || anchor.type !== 1 /* HoverAnchorType.Range */) {
                return async_1.AsyncIterableObject.EMPTY;
            }
            const model = this._editor.getModel();
            if (!this._languageFeaturesService.hoverProvider.has(model)) {
                return async_1.AsyncIterableObject.EMPTY;
            }
            const position = new position_1.Position(anchor.range.startLineNumber, anchor.range.startColumn);
            return (0, getHover_1.getHover)(this._languageFeaturesService.hoverProvider, model, position, token)
                .filter(item => !(0, htmlContent_1.isEmptyMarkdownString)(item.hover.contents))
                .map(item => {
                const rng = item.hover.range ? range_1.Range.lift(item.hover.range) : anchor.range;
                return new MarkdownHover(this, rng, item.hover.contents, item.ordinal);
            });
        }
        renderHoverParts(context, hoverParts) {
            return renderMarkdownHovers(context, hoverParts, this._editor, this._languageService, this._openerService);
        }
    };
    MarkdownHoverParticipant = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, opener_1.IOpenerService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, languageFeatures_1.ILanguageFeaturesService)
    ], MarkdownHoverParticipant);
    exports.MarkdownHoverParticipant = MarkdownHoverParticipant;
    function renderMarkdownHovers(context, hoverParts, editor, languageService, openerService) {
        // Sort hover parts to keep them stable since they might come in async, out-of-order
        hoverParts.sort((a, b) => a.ordinal - b.ordinal);
        const disposables = new lifecycle_1.DisposableStore();
        for (const hoverPart of hoverParts) {
            for (const contents of hoverPart.contents) {
                if ((0, htmlContent_1.isEmptyMarkdownString)(contents)) {
                    continue;
                }
                const markdownHoverElement = $('div.hover-row.markdown-hover');
                const hoverContentsElement = dom.append(markdownHoverElement, $('div.hover-contents'));
                const renderer = disposables.add(new markdownRenderer_1.MarkdownRenderer({ editor }, languageService, openerService));
                disposables.add(renderer.onDidRenderAsync(() => {
                    hoverContentsElement.className = 'hover-contents code-hover-contents';
                    context.onContentsChanged();
                }));
                const renderedContents = disposables.add(renderer.render(contents));
                hoverContentsElement.appendChild(renderedContents.element);
                context.fragment.appendChild(markdownHoverElement);
            }
        }
        return disposables;
    }
    exports.renderMarkdownHovers = renderMarkdownHovers;
});
//# sourceMappingURL=markdownHoverParticipant.js.map