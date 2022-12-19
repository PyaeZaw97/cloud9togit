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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
define(["require", "exports", "vs/base/common/async", "vs/base/common/htmlContent", "vs/editor/common/core/position", "vs/editor/common/model/textModel", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/common/languages/language", "vs/editor/common/services/resolverService", "vs/editor/contrib/hover/browser/getHover", "vs/editor/contrib/hover/browser/markdownHoverParticipant", "vs/editor/contrib/inlayHints/browser/inlayHintsController", "vs/platform/configuration/common/configuration", "vs/platform/opener/common/opener", "vs/editor/common/services/languageFeatures", "vs/nls", "vs/base/common/platform", "vs/editor/contrib/inlayHints/browser/inlayHints", "vs/base/common/arrays"], function (require, exports, async_1, htmlContent_1, position_1, textModel_1, hoverTypes_1, language_1, resolverService_1, getHover_1, markdownHoverParticipant_1, inlayHintsController_1, configuration_1, opener_1, languageFeatures_1, nls_1, platform, inlayHints_1, arrays_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlayHintsHover = void 0;
    class InlayHintsHoverAnchor extends hoverTypes_1.HoverForeignElementAnchor {
        constructor(part, owner) {
            super(10, owner, part.item.anchor.range);
            this.part = part;
        }
    }
    let InlayHintsHover = class InlayHintsHover extends markdownHoverParticipant_1.MarkdownHoverParticipant {
        constructor(editor, languageService, openerService, configurationService, _resolverService, languageFeaturesService) {
            super(editor, languageService, openerService, configurationService, languageFeaturesService);
            this._resolverService = _resolverService;
            this.hoverOrdinal = 6;
        }
        suggestHoverAnchor(mouseEvent) {
            var _a;
            const controller = inlayHintsController_1.InlayHintsController.get(this._editor);
            if (!controller) {
                return null;
            }
            if (mouseEvent.target.type !== 6 /* MouseTargetType.CONTENT_TEXT */) {
                return null;
            }
            const options = (_a = mouseEvent.target.detail.injectedText) === null || _a === void 0 ? void 0 : _a.options;
            if (!(options instanceof textModel_1.ModelDecorationInjectedTextOptions && options.attachedData instanceof inlayHintsController_1.RenderedInlayHintLabelPart)) {
                return null;
            }
            return new InlayHintsHoverAnchor(options.attachedData, this);
        }
        computeSync() {
            return [];
        }
        computeAsync(anchor, _lineDecorations, token) {
            if (!(anchor instanceof InlayHintsHoverAnchor)) {
                return async_1.AsyncIterableObject.EMPTY;
            }
            return new async_1.AsyncIterableObject(async (executor) => {
                var e_1, _a;
                const { part } = anchor;
                await part.item.resolve(token);
                if (token.isCancellationRequested) {
                    return;
                }
                // (1) Inlay Tooltip
                let itemTooltip;
                if (typeof part.item.hint.tooltip === 'string') {
                    itemTooltip = new htmlContent_1.MarkdownString().appendText(part.item.hint.tooltip);
                }
                else if (part.item.hint.tooltip) {
                    itemTooltip = part.item.hint.tooltip;
                }
                if (itemTooltip) {
                    executor.emitOne(new markdownHoverParticipant_1.MarkdownHover(this, anchor.range, [itemTooltip], 0));
                }
                // (1.2) Inlay dbl-click gesture
                if ((0, arrays_1.isNonEmptyArray)(part.item.hint.textEdits)) {
                    executor.emitOne(new markdownHoverParticipant_1.MarkdownHover(this, anchor.range, [new htmlContent_1.MarkdownString().appendText((0, nls_1.localize)('hint.dbl', "Double click to insert"))], 10001));
                }
                // (2) Inlay Label Part Tooltip
                let partTooltip;
                if (typeof part.part.tooltip === 'string') {
                    partTooltip = new htmlContent_1.MarkdownString().appendText(part.part.tooltip);
                }
                else if (part.part.tooltip) {
                    partTooltip = part.part.tooltip;
                }
                if (partTooltip) {
                    executor.emitOne(new markdownHoverParticipant_1.MarkdownHover(this, anchor.range, [partTooltip], 1));
                }
                // (2.2) Inlay Label Part Help Hover
                if (part.part.location || part.part.command) {
                    let linkHint;
                    const useMetaKey = this._editor.getOption(70 /* EditorOption.multiCursorModifier */) === 'altKey';
                    const kb = useMetaKey
                        ? platform.isMacintosh
                            ? (0, nls_1.localize)('links.navigate.kb.meta.mac', "cmd + click")
                            : (0, nls_1.localize)('links.navigate.kb.meta', "ctrl + click")
                        : platform.isMacintosh
                            ? (0, nls_1.localize)('links.navigate.kb.alt.mac', "option + click")
                            : (0, nls_1.localize)('links.navigate.kb.alt', "alt + click");
                    if (part.part.location && part.part.command) {
                        linkHint = new htmlContent_1.MarkdownString().appendText((0, nls_1.localize)('hint.defAndCommand', 'Go to Definition ({0}), right click for more', kb));
                    }
                    else if (part.part.location) {
                        linkHint = new htmlContent_1.MarkdownString().appendText((0, nls_1.localize)('hint.def', 'Go to Definition ({0})', kb));
                    }
                    else if (part.part.command) {
                        linkHint = new htmlContent_1.MarkdownString(`[${(0, nls_1.localize)('hint.cmd', "Execute Command")}](${(0, inlayHints_1.asCommandLink)(part.part.command)} "${part.part.command.title}") (${kb})`, { isTrusted: true });
                    }
                    if (linkHint) {
                        executor.emitOne(new markdownHoverParticipant_1.MarkdownHover(this, anchor.range, [linkHint], 10000));
                    }
                }
                // (3) Inlay Label Part Location tooltip
                const iterable = await this._resolveInlayHintLabelPartHover(part, token);
                try {
                    for (var iterable_1 = __asyncValues(iterable), iterable_1_1; iterable_1_1 = await iterable_1.next(), !iterable_1_1.done;) {
                        let item = iterable_1_1.value;
                        executor.emitOne(item);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) await _a.call(iterable_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            });
        }
        async _resolveInlayHintLabelPartHover(part, token) {
            if (!part.part.location) {
                return async_1.AsyncIterableObject.EMPTY;
            }
            const { uri, range } = part.part.location;
            const ref = await this._resolverService.createModelReference(uri);
            try {
                const model = ref.object.textEditorModel;
                if (!this._languageFeaturesService.hoverProvider.has(model)) {
                    return async_1.AsyncIterableObject.EMPTY;
                }
                return (0, getHover_1.getHover)(this._languageFeaturesService.hoverProvider, model, new position_1.Position(range.startLineNumber, range.startColumn), token)
                    .filter(item => !(0, htmlContent_1.isEmptyMarkdownString)(item.hover.contents))
                    .map(item => new markdownHoverParticipant_1.MarkdownHover(this, part.item.anchor.range, item.hover.contents, 2 + item.ordinal));
            }
            finally {
                ref.dispose();
            }
        }
    };
    InlayHintsHover = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, opener_1.IOpenerService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, languageFeatures_1.ILanguageFeaturesService)
    ], InlayHintsHover);
    exports.InlayHintsHover = InlayHintsHover;
});
//# sourceMappingURL=inlayHintsHover.js.map