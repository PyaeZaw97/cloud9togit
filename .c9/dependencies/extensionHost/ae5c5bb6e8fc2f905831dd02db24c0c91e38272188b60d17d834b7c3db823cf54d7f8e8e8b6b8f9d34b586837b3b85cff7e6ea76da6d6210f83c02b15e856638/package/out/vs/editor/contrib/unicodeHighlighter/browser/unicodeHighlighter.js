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
define(["require", "exports", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/editor/browser/editorExtensions", "vs/editor/common/config/editorOptions", "vs/editor/common/model/textModel", "vs/editor/common/services/unicodeTextModelHighlighter", "vs/editor/common/services/editorWorker", "vs/editor/common/languages/language", "vs/editor/common/viewModel/viewModelDecorations", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/hover/browser/markdownHoverParticipant", "vs/editor/contrib/unicodeHighlighter/browser/bannerController", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/iconRegistry", "vs/platform/workspace/common/workspaceTrust", "vs/css!./unicodeHighlighter"], function (require, exports, async_1, codicons_1, htmlContent_1, lifecycle_1, platform, strings_1, editorExtensions_1, editorOptions_1, textModel_1, unicodeTextModelHighlighter_1, editorWorker_1, language_1, viewModelDecorations_1, hoverTypes_1, markdownHoverParticipant_1, bannerController_1, nls, configuration_1, instantiation_1, opener_1, quickInput_1, iconRegistry_1, workspaceTrust_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowExcludeOptions = exports.DisableHighlightingOfNonBasicAsciiCharactersAction = exports.DisableHighlightingOfInvisibleCharactersAction = exports.DisableHighlightingOfAmbiguousCharactersAction = exports.DisableHighlightingInStringsAction = exports.DisableHighlightingInCommentsAction = exports.UnicodeHighlighterHoverParticipant = exports.UnicodeHighlighterHover = exports.UnicodeHighlighter = exports.warningIcon = void 0;
    exports.warningIcon = (0, iconRegistry_1.registerIcon)('extensions-warning-message', codicons_1.Codicon.warning, nls.localize('warningIcon', 'Icon shown with a warning message in the extensions editor.'));
    let UnicodeHighlighter = class UnicodeHighlighter extends lifecycle_1.Disposable {
        constructor(_editor, _editorWorkerService, _workspaceTrustService, instantiationService) {
            super();
            this._editor = _editor;
            this._editorWorkerService = _editorWorkerService;
            this._workspaceTrustService = _workspaceTrustService;
            this._highlighter = null;
            this._bannerClosed = false;
            this._updateState = (state) => {
                if (state && state.hasMore) {
                    if (this._bannerClosed) {
                        return;
                    }
                    // This document contains many non-basic ASCII characters.
                    const max = Math.max(state.ambiguousCharacterCount, state.nonBasicAsciiCharacterCount, state.invisibleCharacterCount);
                    let data;
                    if (state.nonBasicAsciiCharacterCount >= max) {
                        data = {
                            message: nls.localize('unicodeHighlighting.thisDocumentHasManyNonBasicAsciiUnicodeCharacters', 'This document contains many non-basic ASCII unicode characters'),
                            command: new DisableHighlightingOfNonBasicAsciiCharactersAction(),
                        };
                    }
                    else if (state.ambiguousCharacterCount >= max) {
                        data = {
                            message: nls.localize('unicodeHighlighting.thisDocumentHasManyAmbiguousUnicodeCharacters', 'This document contains many ambiguous unicode characters'),
                            command: new DisableHighlightingOfAmbiguousCharactersAction(),
                        };
                    }
                    else if (state.invisibleCharacterCount >= max) {
                        data = {
                            message: nls.localize('unicodeHighlighting.thisDocumentHasManyInvisibleUnicodeCharacters', 'This document contains many invisible unicode characters'),
                            command: new DisableHighlightingOfInvisibleCharactersAction(),
                        };
                    }
                    else {
                        throw new Error('Unreachable');
                    }
                    this._bannerController.show({
                        id: 'unicodeHighlightBanner',
                        message: data.message,
                        icon: exports.warningIcon,
                        actions: [
                            {
                                label: data.command.shortLabel,
                                href: `command:${data.command.id}`
                            }
                        ],
                        onClose: () => {
                            this._bannerClosed = true;
                        },
                    });
                }
                else {
                    this._bannerController.hide();
                }
            };
            this._bannerController = this._register(instantiationService.createInstance(bannerController_1.BannerController, _editor));
            this._register(this._editor.onDidChangeModel(() => {
                this._bannerClosed = false;
                this._updateHighlighter();
            }));
            this._options = _editor.getOption(113 /* EditorOption.unicodeHighlighting */);
            this._register(_workspaceTrustService.onDidChangeTrust(e => {
                this._updateHighlighter();
            }));
            this._register(_editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(113 /* EditorOption.unicodeHighlighting */)) {
                    this._options = _editor.getOption(113 /* EditorOption.unicodeHighlighting */);
                    this._updateHighlighter();
                }
            }));
            this._updateHighlighter();
        }
        dispose() {
            if (this._highlighter) {
                this._highlighter.dispose();
                this._highlighter = null;
            }
            super.dispose();
        }
        _updateHighlighter() {
            this._updateState(null);
            if (this._highlighter) {
                this._highlighter.dispose();
                this._highlighter = null;
            }
            if (!this._editor.hasModel()) {
                return;
            }
            const options = resolveOptions(this._workspaceTrustService.isWorkspaceTrusted(), this._options);
            if ([
                options.nonBasicASCII,
                options.ambiguousCharacters,
                options.invisibleCharacters,
            ].every((option) => option === false)) {
                // Don't do anything if the feature is fully disabled
                return;
            }
            const highlightOptions = {
                nonBasicASCII: options.nonBasicASCII,
                ambiguousCharacters: options.ambiguousCharacters,
                invisibleCharacters: options.invisibleCharacters,
                includeComments: options.includeComments,
                includeStrings: options.includeStrings,
                allowedCodePoints: Object.keys(options.allowedCharacters).map(c => c.codePointAt(0)),
                allowedLocales: Object.keys(options.allowedLocales).map(locale => {
                    if (locale === '_os') {
                        let osLocale = new Intl.NumberFormat().resolvedOptions().locale;
                        return osLocale;
                    }
                    else if (locale === '_vscode') {
                        return platform.language;
                    }
                    return locale;
                }),
            };
            if (this._editorWorkerService.canComputeUnicodeHighlights(this._editor.getModel().uri)) {
                this._highlighter = new DocumentUnicodeHighlighter(this._editor, highlightOptions, this._updateState, this._editorWorkerService);
            }
            else {
                this._highlighter = new ViewportUnicodeHighlighter(this._editor, highlightOptions, this._updateState);
            }
        }
        getDecorationInfo(decorationId) {
            if (this._highlighter) {
                return this._highlighter.getDecorationInfo(decorationId);
            }
            return null;
        }
    };
    UnicodeHighlighter.ID = 'editor.contrib.unicodeHighlighter';
    UnicodeHighlighter = __decorate([
        __param(1, editorWorker_1.IEditorWorkerService),
        __param(2, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(3, instantiation_1.IInstantiationService)
    ], UnicodeHighlighter);
    exports.UnicodeHighlighter = UnicodeHighlighter;
    function resolveOptions(trusted, options) {
        return {
            nonBasicASCII: options.nonBasicASCII === editorOptions_1.inUntrustedWorkspace ? !trusted : options.nonBasicASCII,
            ambiguousCharacters: options.ambiguousCharacters,
            invisibleCharacters: options.invisibleCharacters,
            includeComments: options.includeComments === editorOptions_1.inUntrustedWorkspace ? !trusted : options.includeComments,
            includeStrings: options.includeStrings === editorOptions_1.inUntrustedWorkspace ? !trusted : options.includeStrings,
            allowedCharacters: options.allowedCharacters,
            allowedLocales: options.allowedLocales,
        };
    }
    let DocumentUnicodeHighlighter = class DocumentUnicodeHighlighter extends lifecycle_1.Disposable {
        constructor(_editor, _options, _updateState, _editorWorkerService) {
            super();
            this._editor = _editor;
            this._options = _options;
            this._updateState = _updateState;
            this._editorWorkerService = _editorWorkerService;
            this._model = this._editor.getModel();
            this._decorationIds = new Set();
            this._updateSoon = this._register(new async_1.RunOnceScheduler(() => this._update(), 250));
            this._register(this._editor.onDidChangeModelContent(() => {
                this._updateSoon.schedule();
            }));
            this._updateSoon.schedule();
        }
        dispose() {
            this._decorationIds = new Set(this._model.deltaDecorations(Array.from(this._decorationIds), []));
            super.dispose();
        }
        _update() {
            if (this._model.isDisposed()) {
                return;
            }
            if (!this._model.mightContainNonBasicASCII()) {
                this._decorationIds = new Set(this._editor.deltaDecorations(Array.from(this._decorationIds), []));
                return;
            }
            const modelVersionId = this._model.getVersionId();
            this._editorWorkerService
                .computedUnicodeHighlights(this._model.uri, this._options)
                .then((info) => {
                if (this._model.isDisposed()) {
                    return;
                }
                if (this._model.getVersionId() !== modelVersionId) {
                    // model changed in the meantime
                    return;
                }
                this._updateState(info);
                const decorations = [];
                if (!info.hasMore) {
                    // Don't show decoration if there are too many.
                    // In this case, a banner is shown.
                    for (const range of info.ranges) {
                        decorations.push({
                            range: range,
                            options: Decorations.instance.getDecorationFromOptions(this._options),
                        });
                    }
                }
                this._decorationIds = new Set(this._editor.deltaDecorations(Array.from(this._decorationIds), decorations));
            });
        }
        getDecorationInfo(decorationId) {
            if (!this._decorationIds.has(decorationId)) {
                return null;
            }
            const model = this._editor.getModel();
            const range = model.getDecorationRange(decorationId);
            const decoration = {
                range: range,
                options: Decorations.instance.getDecorationFromOptions(this._options),
                id: decorationId,
                ownerId: 0,
            };
            if (!(0, viewModelDecorations_1.isModelDecorationVisible)(model, decoration)) {
                return null;
            }
            const text = model.getValueInRange(range);
            return {
                reason: computeReason(text, this._options),
                inComment: (0, viewModelDecorations_1.isModelDecorationInComment)(model, decoration),
                inString: (0, viewModelDecorations_1.isModelDecorationInString)(model, decoration),
            };
        }
    };
    DocumentUnicodeHighlighter = __decorate([
        __param(3, editorWorker_1.IEditorWorkerService)
    ], DocumentUnicodeHighlighter);
    class ViewportUnicodeHighlighter extends lifecycle_1.Disposable {
        constructor(_editor, _options, _updateState) {
            super();
            this._editor = _editor;
            this._options = _options;
            this._updateState = _updateState;
            this._model = this._editor.getModel();
            this._decorationIds = new Set();
            this._updateSoon = this._register(new async_1.RunOnceScheduler(() => this._update(), 250));
            this._register(this._editor.onDidLayoutChange(() => {
                this._updateSoon.schedule();
            }));
            this._register(this._editor.onDidScrollChange(() => {
                this._updateSoon.schedule();
            }));
            this._register(this._editor.onDidChangeHiddenAreas(() => {
                this._updateSoon.schedule();
            }));
            this._register(this._editor.onDidChangeModelContent(() => {
                this._updateSoon.schedule();
            }));
            this._updateSoon.schedule();
        }
        dispose() {
            this._decorationIds = new Set(this._model.deltaDecorations(Array.from(this._decorationIds), []));
            super.dispose();
        }
        _update() {
            if (this._model.isDisposed()) {
                return;
            }
            if (!this._model.mightContainNonBasicASCII()) {
                this._decorationIds = new Set(this._editor.deltaDecorations(Array.from(this._decorationIds), []));
                return;
            }
            const ranges = this._editor.getVisibleRanges();
            const decorations = [];
            const totalResult = {
                ranges: [],
                ambiguousCharacterCount: 0,
                invisibleCharacterCount: 0,
                nonBasicAsciiCharacterCount: 0,
                hasMore: false,
            };
            for (const range of ranges) {
                const result = unicodeTextModelHighlighter_1.UnicodeTextModelHighlighter.computeUnicodeHighlights(this._model, this._options, range);
                for (const r of result.ranges) {
                    totalResult.ranges.push(r);
                }
                totalResult.ambiguousCharacterCount += totalResult.ambiguousCharacterCount;
                totalResult.invisibleCharacterCount += totalResult.invisibleCharacterCount;
                totalResult.nonBasicAsciiCharacterCount += totalResult.nonBasicAsciiCharacterCount;
                totalResult.hasMore = totalResult.hasMore || result.hasMore;
            }
            if (!totalResult.hasMore) {
                // Don't show decorations if there are too many.
                // A banner will be shown instead.
                for (const range of totalResult.ranges) {
                    decorations.push({ range, options: Decorations.instance.getDecorationFromOptions(this._options) });
                }
            }
            this._updateState(totalResult);
            this._decorationIds = new Set(this._editor.deltaDecorations(Array.from(this._decorationIds), decorations));
        }
        getDecorationInfo(decorationId) {
            if (!this._decorationIds.has(decorationId)) {
                return null;
            }
            const model = this._editor.getModel();
            const range = model.getDecorationRange(decorationId);
            const text = model.getValueInRange(range);
            const decoration = {
                range: range,
                options: Decorations.instance.getDecorationFromOptions(this._options),
                id: decorationId,
                ownerId: 0,
            };
            if (!(0, viewModelDecorations_1.isModelDecorationVisible)(model, decoration)) {
                return null;
            }
            return {
                reason: computeReason(text, this._options),
                inComment: (0, viewModelDecorations_1.isModelDecorationInComment)(model, decoration),
                inString: (0, viewModelDecorations_1.isModelDecorationInString)(model, decoration),
            };
        }
    }
    class UnicodeHighlighterHover {
        constructor(owner, range, decoration) {
            this.owner = owner;
            this.range = range;
            this.decoration = decoration;
        }
        isValidForHoverAnchor(anchor) {
            return (anchor.type === 1 /* HoverAnchorType.Range */
                && this.range.startColumn <= anchor.range.startColumn
                && this.range.endColumn >= anchor.range.endColumn);
        }
    }
    exports.UnicodeHighlighterHover = UnicodeHighlighterHover;
    let UnicodeHighlighterHoverParticipant = class UnicodeHighlighterHoverParticipant {
        constructor(_editor, _languageService, _openerService) {
            this._editor = _editor;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this.hoverOrdinal = 4;
        }
        computeSync(anchor, lineDecorations) {
            if (!this._editor.hasModel() || anchor.type !== 1 /* HoverAnchorType.Range */) {
                return [];
            }
            const model = this._editor.getModel();
            const unicodeHighlighter = this._editor.getContribution(UnicodeHighlighter.ID);
            if (!unicodeHighlighter) {
                return [];
            }
            const result = [];
            let index = 300;
            for (const d of lineDecorations) {
                const highlightInfo = unicodeHighlighter.getDecorationInfo(d.id);
                if (!highlightInfo) {
                    continue;
                }
                const char = model.getValueInRange(d.range);
                // text refers to a single character.
                const codePoint = char.codePointAt(0);
                const codePointStr = formatCodePointMarkdown(codePoint);
                let reason;
                switch (highlightInfo.reason.kind) {
                    case 0 /* UnicodeHighlighterReasonKind.Ambiguous */:
                        reason = nls.localize('unicodeHighlight.characterIsAmbiguous', 'The character {0} could be confused with the character {1}, which is more common in source code.', codePointStr, formatCodePointMarkdown(highlightInfo.reason.confusableWith.codePointAt(0)));
                        break;
                    case 1 /* UnicodeHighlighterReasonKind.Invisible */:
                        reason = nls.localize('unicodeHighlight.characterIsInvisible', 'The character {0} is invisible.', codePointStr);
                        break;
                    case 2 /* UnicodeHighlighterReasonKind.NonBasicAscii */:
                        reason = nls.localize('unicodeHighlight.characterIsNonBasicAscii', 'The character {0} is not a basic ASCII character.', codePointStr);
                        break;
                }
                const adjustSettingsArgs = {
                    codePoint: codePoint,
                    reason: highlightInfo.reason,
                    inComment: highlightInfo.inComment,
                    inString: highlightInfo.inString,
                };
                const adjustSettings = nls.localize('unicodeHighlight.adjustSettings', 'Adjust settings');
                const uri = `command:${ShowExcludeOptions.ID}?${encodeURIComponent(JSON.stringify(adjustSettingsArgs))}`;
                const markdown = new htmlContent_1.MarkdownString('', true)
                    .appendMarkdown(reason)
                    .appendText(' ')
                    .appendLink(uri, adjustSettings);
                result.push(new markdownHoverParticipant_1.MarkdownHover(this, d.range, [markdown], index++));
            }
            return result;
        }
        renderHoverParts(context, hoverParts) {
            return (0, markdownHoverParticipant_1.renderMarkdownHovers)(context, hoverParts, this._editor, this._languageService, this._openerService);
        }
    };
    UnicodeHighlighterHoverParticipant = __decorate([
        __param(1, language_1.ILanguageService),
        __param(2, opener_1.IOpenerService)
    ], UnicodeHighlighterHoverParticipant);
    exports.UnicodeHighlighterHoverParticipant = UnicodeHighlighterHoverParticipant;
    function codePointToHex(codePoint) {
        return `U+${codePoint.toString(16).padStart(4, '0')}`;
    }
    function formatCodePointMarkdown(codePoint) {
        let value = `\`${codePointToHex(codePoint)}\``;
        if (!strings_1.InvisibleCharacters.isInvisibleCharacter(codePoint)) {
            // Don't render any control characters or any invisible characters, as they cannot be seen anyways.
            value += ` "${`${renderCodePointAsInlineCode(codePoint)}`}"`;
        }
        return value;
    }
    function renderCodePointAsInlineCode(codePoint) {
        if (codePoint === 96 /* CharCode.BackTick */) {
            return '`` ` ``';
        }
        return '`' + String.fromCodePoint(codePoint) + '`';
    }
    function computeReason(char, options) {
        return unicodeTextModelHighlighter_1.UnicodeTextModelHighlighter.computeUnicodeHighlightReason(char, options);
    }
    class Decorations {
        constructor() {
            this.map = new Map();
        }
        getDecorationFromOptions(options) {
            return this.getDecoration(!options.includeComments, !options.includeStrings);
        }
        getDecoration(hideInComments, hideInStrings) {
            const key = `${hideInComments}${hideInStrings}`;
            let options = this.map.get(key);
            if (!options) {
                options = textModel_1.ModelDecorationOptions.createDynamic({
                    description: 'unicode-highlight',
                    stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
                    className: 'unicode-highlight',
                    showIfCollapsed: true,
                    overviewRuler: null,
                    minimap: null,
                    hideInCommentTokens: hideInComments,
                    hideInStringTokens: hideInStrings,
                });
                this.map.set(key, options);
            }
            return options;
        }
    }
    Decorations.instance = new Decorations();
    class DisableHighlightingInCommentsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: DisableHighlightingOfAmbiguousCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingInComments', 'Disable highlighting of characters in comments'),
                alias: 'Disable highlighting of characters in comments',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingInComments.shortLabel', 'Disable Highlight In Comments');
        }
        async run(accessor, editor, args) {
            let configurationService = accessor === null || accessor === void 0 ? void 0 : accessor.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.includeComments, false, 1 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingInCommentsAction = DisableHighlightingInCommentsAction;
    DisableHighlightingInCommentsAction.ID = 'editor.action.unicodeHighlight.disableHighlightingInComments';
    class DisableHighlightingInStringsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: DisableHighlightingOfAmbiguousCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingInStrings', 'Disable highlighting of characters in strings'),
                alias: 'Disable highlighting of characters in strings',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingInStrings.shortLabel', 'Disable Highlight In Strings');
        }
        async run(accessor, editor, args) {
            let configurationService = accessor === null || accessor === void 0 ? void 0 : accessor.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.includeStrings, false, 1 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingInStringsAction = DisableHighlightingInStringsAction;
    DisableHighlightingInStringsAction.ID = 'editor.action.unicodeHighlight.disableHighlightingInStrings';
    class DisableHighlightingOfAmbiguousCharactersAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: DisableHighlightingOfAmbiguousCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingOfAmbiguousCharacters', 'Disable highlighting of ambiguous characters'),
                alias: 'Disable highlighting of ambiguous characters',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingOfAmbiguousCharacters.shortLabel', 'Disable Ambiguous Highlight');
        }
        async run(accessor, editor, args) {
            let configurationService = accessor === null || accessor === void 0 ? void 0 : accessor.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.ambiguousCharacters, false, 1 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingOfAmbiguousCharactersAction = DisableHighlightingOfAmbiguousCharactersAction;
    DisableHighlightingOfAmbiguousCharactersAction.ID = 'editor.action.unicodeHighlight.disableHighlightingOfAmbiguousCharacters';
    class DisableHighlightingOfInvisibleCharactersAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: DisableHighlightingOfInvisibleCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingOfInvisibleCharacters', 'Disable highlighting of invisible characters'),
                alias: 'Disable highlighting of invisible characters',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingOfInvisibleCharacters.shortLabel', 'Disable Invisible Highlight');
        }
        async run(accessor, editor, args) {
            let configurationService = accessor === null || accessor === void 0 ? void 0 : accessor.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.invisibleCharacters, false, 1 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingOfInvisibleCharactersAction = DisableHighlightingOfInvisibleCharactersAction;
    DisableHighlightingOfInvisibleCharactersAction.ID = 'editor.action.unicodeHighlight.disableHighlightingOfInvisibleCharacters';
    class DisableHighlightingOfNonBasicAsciiCharactersAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: DisableHighlightingOfNonBasicAsciiCharactersAction.ID,
                label: nls.localize('action.unicodeHighlight.disableHighlightingOfNonBasicAsciiCharacters', 'Disable highlighting of non basic ASCII characters'),
                alias: 'Disable highlighting of non basic ASCII characters',
                precondition: undefined
            });
            this.shortLabel = nls.localize('unicodeHighlight.disableHighlightingOfNonBasicAsciiCharacters.shortLabel', 'Disable Non ASCII Highlight');
        }
        async run(accessor, editor, args) {
            let configurationService = accessor === null || accessor === void 0 ? void 0 : accessor.get(configuration_1.IConfigurationService);
            if (configurationService) {
                this.runAction(configurationService);
            }
        }
        async runAction(configurationService) {
            await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.nonBasicASCII, false, 1 /* ConfigurationTarget.USER */);
        }
    }
    exports.DisableHighlightingOfNonBasicAsciiCharactersAction = DisableHighlightingOfNonBasicAsciiCharactersAction;
    DisableHighlightingOfNonBasicAsciiCharactersAction.ID = 'editor.action.unicodeHighlight.disableHighlightingOfNonBasicAsciiCharacters';
    class ShowExcludeOptions extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: ShowExcludeOptions.ID,
                label: nls.localize('action.unicodeHighlight.showExcludeOptions', "Show Exclude Options"),
                alias: 'Show Exclude Options',
                precondition: undefined
            });
        }
        async run(accessor, editor, args) {
            const { codePoint, reason, inString, inComment } = args;
            const char = String.fromCodePoint(codePoint);
            const quickPickService = accessor.get(quickInput_1.IQuickInputService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            function getExcludeCharFromBeingHighlightedLabel(codePoint) {
                if (strings_1.InvisibleCharacters.isInvisibleCharacter(codePoint)) {
                    return nls.localize('unicodeHighlight.excludeInvisibleCharFromBeingHighlighted', 'Exclude {0} (invisible character) from being highlighted', codePointToHex(codePoint));
                }
                return nls.localize('unicodeHighlight.excludeCharFromBeingHighlighted', 'Exclude {0} from being highlighted', `${codePointToHex(codePoint)} "${char}"`);
            }
            const options = [];
            if (reason.kind === 0 /* UnicodeHighlighterReasonKind.Ambiguous */) {
                for (const locale of reason.notAmbiguousInLocales) {
                    options.push({
                        label: nls.localize("unicodeHighlight.allowCommonCharactersInLanguage", "Allow unicode characters that are more common in the language \"{0}\".", locale),
                        run: async () => {
                            excludeLocaleFromBeingHighlighted(configurationService, [locale]);
                        },
                    });
                }
            }
            options.push({
                label: getExcludeCharFromBeingHighlightedLabel(codePoint),
                run: () => excludeCharFromBeingHighlighted(configurationService, [codePoint])
            });
            if (inComment) {
                const action = new DisableHighlightingInCommentsAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            else if (inString) {
                const action = new DisableHighlightingInStringsAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            if (reason.kind === 0 /* UnicodeHighlighterReasonKind.Ambiguous */) {
                const action = new DisableHighlightingOfAmbiguousCharactersAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            else if (reason.kind === 1 /* UnicodeHighlighterReasonKind.Invisible */) {
                const action = new DisableHighlightingOfInvisibleCharactersAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            else if (reason.kind === 2 /* UnicodeHighlighterReasonKind.NonBasicAscii */) {
                const action = new DisableHighlightingOfNonBasicAsciiCharactersAction();
                options.push({ label: action.label, run: async () => action.runAction(configurationService) });
            }
            else {
                expectNever(reason);
            }
            const result = await quickPickService.pick(options, { title: nls.localize('unicodeHighlight.configureUnicodeHighlightOptions', 'Configure Unicode Highlight Options') });
            if (result) {
                await result.run();
            }
        }
    }
    exports.ShowExcludeOptions = ShowExcludeOptions;
    ShowExcludeOptions.ID = 'editor.action.unicodeHighlight.showExcludeOptions';
    async function excludeCharFromBeingHighlighted(configurationService, charCodes) {
        const existingValue = configurationService.getValue(editorOptions_1.unicodeHighlightConfigKeys.allowedCharacters);
        let value;
        if ((typeof existingValue === 'object') && existingValue) {
            value = existingValue;
        }
        else {
            value = {};
        }
        for (const charCode of charCodes) {
            value[String.fromCodePoint(charCode)] = true;
        }
        await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.allowedCharacters, value, 1 /* ConfigurationTarget.USER */);
    }
    async function excludeLocaleFromBeingHighlighted(configurationService, locales) {
        var _a;
        const existingValue = (_a = configurationService.inspect(editorOptions_1.unicodeHighlightConfigKeys.allowedLocales).user) === null || _a === void 0 ? void 0 : _a.value;
        let value;
        if ((typeof existingValue === 'object') && existingValue) {
            // Copy value, as the existing value is read only
            value = Object.assign({}, existingValue);
        }
        else {
            value = {};
        }
        for (const locale of locales) {
            value[locale] = true;
        }
        await configurationService.updateValue(editorOptions_1.unicodeHighlightConfigKeys.allowedLocales, value, 1 /* ConfigurationTarget.USER */);
    }
    function expectNever(value) {
        throw new Error(`Unexpected value: ${value}`);
    }
    (0, editorExtensions_1.registerEditorAction)(DisableHighlightingOfAmbiguousCharactersAction);
    (0, editorExtensions_1.registerEditorAction)(DisableHighlightingOfInvisibleCharactersAction);
    (0, editorExtensions_1.registerEditorAction)(DisableHighlightingOfNonBasicAsciiCharactersAction);
    (0, editorExtensions_1.registerEditorAction)(ShowExcludeOptions);
    (0, editorExtensions_1.registerEditorContribution)(UnicodeHighlighter.ID, UnicodeHighlighter);
    hoverTypes_1.HoverParticipantRegistry.register(UnicodeHighlighterHoverParticipant);
});
//# sourceMappingURL=unicodeHighlighter.js.map