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
define(["require", "exports", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/stopwatch", "vs/base/common/uri", "vs/editor/browser/editorExtensions", "vs/editor/common/model/textModel", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/contrib/gotoSymbol/browser/link/clickLinkGesture", "vs/editor/contrib/links/browser/getLinks", "vs/nls", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/css!./links"], function (require, exports, async_1, cancellation_1, errors_1, htmlContent_1, lifecycle_1, network_1, platform, resources, stopwatch_1, uri_1, editorExtensions_1, textModel_1, languageFeatureDebounce_1, languageFeatures_1, clickLinkGesture_1, getLinks_1, nls, notification_1, opener_1, colorRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LinkDetector = void 0;
    let LinkDetector = class LinkDetector extends lifecycle_1.Disposable {
        constructor(editor, openerService, notificationService, languageFeaturesService, languageFeatureDebounceService) {
            super();
            this.editor = editor;
            this.openerService = openerService;
            this.notificationService = notificationService;
            this.languageFeaturesService = languageFeaturesService;
            this.providers = this.languageFeaturesService.linkProvider;
            this.debounceInformation = languageFeatureDebounceService.for(this.providers, 'Links', { min: 1000, max: 4000 });
            this.computeLinks = this._register(new async_1.RunOnceScheduler(() => this.computeLinksNow(), 1000));
            this.computePromise = null;
            this.activeLinksList = null;
            this.currentOccurrences = {};
            this.activeLinkDecorationId = null;
            const clickLinkGesture = this._register(new clickLinkGesture_1.ClickLinkGesture(editor));
            this._register(clickLinkGesture.onMouseMoveOrRelevantKeyDown(([mouseEvent, keyboardEvent]) => {
                this._onEditorMouseMove(mouseEvent, keyboardEvent);
            }));
            this._register(clickLinkGesture.onExecute((e) => {
                this.onEditorMouseUp(e);
            }));
            this._register(clickLinkGesture.onCancel((e) => {
                this.cleanUpActiveLinkDecoration();
            }));
            this._register(editor.onDidChangeConfiguration((e) => {
                if (!e.hasChanged(63 /* EditorOption.links */)) {
                    return;
                }
                // Remove any links (for the getting disabled case)
                this.updateDecorations([]);
                // Stop any computation (for the getting disabled case)
                this.stop();
                // Start computing (for the getting enabled case)
                this.computeLinks.schedule(0);
            }));
            this._register(editor.onDidChangeModelContent((e) => {
                if (!this.editor.hasModel()) {
                    return;
                }
                this.computeLinks.schedule(this.debounceInformation.get(this.editor.getModel()));
            }));
            this._register(editor.onDidChangeModel((e) => {
                this.currentOccurrences = {};
                this.activeLinkDecorationId = null;
                this.stop();
                this.computeLinks.schedule(0);
            }));
            this._register(editor.onDidChangeModelLanguage((e) => {
                this.stop();
                this.computeLinks.schedule(0);
            }));
            this._register(this.providers.onDidChange((e) => {
                this.stop();
                this.computeLinks.schedule(0);
            }));
            this.computeLinks.schedule(0);
        }
        static get(editor) {
            return editor.getContribution(LinkDetector.ID);
        }
        async computeLinksNow() {
            if (!this.editor.hasModel() || !this.editor.getOption(63 /* EditorOption.links */)) {
                return;
            }
            const model = this.editor.getModel();
            if (!this.providers.has(model)) {
                return;
            }
            if (this.activeLinksList) {
                this.activeLinksList.dispose();
                this.activeLinksList = null;
            }
            this.computePromise = (0, async_1.createCancelablePromise)(token => (0, getLinks_1.getLinks)(this.providers, model, token));
            try {
                const sw = new stopwatch_1.StopWatch(false);
                this.activeLinksList = await this.computePromise;
                this.debounceInformation.update(model, sw.elapsed());
                if (model.isDisposed()) {
                    return;
                }
                this.updateDecorations(this.activeLinksList.links);
            }
            catch (err) {
                (0, errors_1.onUnexpectedError)(err);
            }
            finally {
                this.computePromise = null;
            }
        }
        updateDecorations(links) {
            const useMetaKey = (this.editor.getOption(70 /* EditorOption.multiCursorModifier */) === 'altKey');
            const oldDecorations = [];
            const keys = Object.keys(this.currentOccurrences);
            for (const decorationId of keys) {
                const occurence = this.currentOccurrences[decorationId];
                oldDecorations.push(occurence.decorationId);
            }
            const newDecorations = [];
            if (links) {
                // Not sure why this is sometimes null
                for (const link of links) {
                    newDecorations.push(LinkOccurrence.decoration(link, useMetaKey));
                }
            }
            const decorations = this.editor.deltaDecorations(oldDecorations, newDecorations);
            this.currentOccurrences = {};
            this.activeLinkDecorationId = null;
            for (let i = 0, len = decorations.length; i < len; i++) {
                const occurence = new LinkOccurrence(links[i], decorations[i]);
                this.currentOccurrences[occurence.decorationId] = occurence;
            }
        }
        _onEditorMouseMove(mouseEvent, withKey) {
            const useMetaKey = (this.editor.getOption(70 /* EditorOption.multiCursorModifier */) === 'altKey');
            if (this.isEnabled(mouseEvent, withKey)) {
                this.cleanUpActiveLinkDecoration(); // always remove previous link decoration as their can only be one
                const occurrence = this.getLinkOccurrence(mouseEvent.target.position);
                if (occurrence) {
                    this.editor.changeDecorations((changeAccessor) => {
                        occurrence.activate(changeAccessor, useMetaKey);
                        this.activeLinkDecorationId = occurrence.decorationId;
                    });
                }
            }
            else {
                this.cleanUpActiveLinkDecoration();
            }
        }
        cleanUpActiveLinkDecoration() {
            const useMetaKey = (this.editor.getOption(70 /* EditorOption.multiCursorModifier */) === 'altKey');
            if (this.activeLinkDecorationId) {
                const occurrence = this.currentOccurrences[this.activeLinkDecorationId];
                if (occurrence) {
                    this.editor.changeDecorations((changeAccessor) => {
                        occurrence.deactivate(changeAccessor, useMetaKey);
                    });
                }
                this.activeLinkDecorationId = null;
            }
        }
        onEditorMouseUp(mouseEvent) {
            if (!this.isEnabled(mouseEvent)) {
                return;
            }
            const occurrence = this.getLinkOccurrence(mouseEvent.target.position);
            if (!occurrence) {
                return;
            }
            this.openLinkOccurrence(occurrence, mouseEvent.hasSideBySideModifier, true /* from user gesture */);
        }
        openLinkOccurrence(occurrence, openToSide, fromUserGesture = false) {
            if (!this.openerService) {
                return;
            }
            const { link } = occurrence;
            link.resolve(cancellation_1.CancellationToken.None).then(uri => {
                // Support for relative file URIs of the shape file://./relativeFile.txt or file:///./relativeFile.txt
                if (typeof uri === 'string' && this.editor.hasModel()) {
                    const modelUri = this.editor.getModel().uri;
                    if (modelUri.scheme === network_1.Schemas.file && uri.startsWith(`${network_1.Schemas.file}:`)) {
                        const parsedUri = uri_1.URI.parse(uri);
                        if (parsedUri.scheme === network_1.Schemas.file) {
                            const fsPath = resources.originalFSPath(parsedUri);
                            let relativePath = null;
                            if (fsPath.startsWith('/./')) {
                                relativePath = `.${fsPath.substr(1)}`;
                            }
                            else if (fsPath.startsWith('//./')) {
                                relativePath = `.${fsPath.substr(2)}`;
                            }
                            if (relativePath) {
                                uri = resources.joinPath(modelUri, relativePath);
                            }
                        }
                    }
                }
                return this.openerService.open(uri, { openToSide, fromUserGesture, allowContributedOpeners: true, allowCommands: true });
            }, err => {
                const messageOrError = err instanceof Error ? err.message : err;
                // different error cases
                if (messageOrError === 'invalid') {
                    this.notificationService.warn(nls.localize('invalid.url', 'Failed to open this link because it is not well-formed: {0}', link.url.toString()));
                }
                else if (messageOrError === 'missing') {
                    this.notificationService.warn(nls.localize('missing.url', 'Failed to open this link because its target is missing.'));
                }
                else {
                    (0, errors_1.onUnexpectedError)(err);
                }
            });
        }
        getLinkOccurrence(position) {
            if (!this.editor.hasModel() || !position) {
                return null;
            }
            const decorations = this.editor.getModel().getDecorationsInRange({
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
            }, 0, true);
            for (const decoration of decorations) {
                const currentOccurrence = this.currentOccurrences[decoration.id];
                if (currentOccurrence) {
                    return currentOccurrence;
                }
            }
            return null;
        }
        isEnabled(mouseEvent, withKey) {
            return Boolean((mouseEvent.target.type === 6 /* MouseTargetType.CONTENT_TEXT */)
                && (mouseEvent.hasTriggerModifier || (withKey && withKey.keyCodeIsTriggerKey)));
        }
        stop() {
            var _a;
            this.computeLinks.cancel();
            if (this.activeLinksList) {
                (_a = this.activeLinksList) === null || _a === void 0 ? void 0 : _a.dispose();
                this.activeLinksList = null;
            }
            if (this.computePromise) {
                this.computePromise.cancel();
                this.computePromise = null;
            }
        }
        dispose() {
            super.dispose();
            this.stop();
        }
    };
    LinkDetector.ID = 'editor.linkDetector';
    LinkDetector = __decorate([
        __param(1, opener_1.IOpenerService),
        __param(2, notification_1.INotificationService),
        __param(3, languageFeatures_1.ILanguageFeaturesService),
        __param(4, languageFeatureDebounce_1.ILanguageFeatureDebounceService)
    ], LinkDetector);
    exports.LinkDetector = LinkDetector;
    const decoration = {
        general: textModel_1.ModelDecorationOptions.register({
            description: 'detected-link',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            collapseOnReplaceEdit: true,
            inlineClassName: 'detected-link'
        }),
        active: textModel_1.ModelDecorationOptions.register({
            description: 'detected-link-active',
            stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
            collapseOnReplaceEdit: true,
            inlineClassName: 'detected-link-active'
        })
    };
    class LinkOccurrence {
        constructor(link, decorationId) {
            this.link = link;
            this.decorationId = decorationId;
        }
        static decoration(link, useMetaKey) {
            return {
                range: link.range,
                options: LinkOccurrence._getOptions(link, useMetaKey, false)
            };
        }
        static _getOptions(link, useMetaKey, isActive) {
            const options = Object.assign({}, (isActive ? decoration.active : decoration.general));
            options.hoverMessage = getHoverMessage(link, useMetaKey);
            return options;
        }
        activate(changeAccessor, useMetaKey) {
            changeAccessor.changeDecorationOptions(this.decorationId, LinkOccurrence._getOptions(this.link, useMetaKey, true));
        }
        deactivate(changeAccessor, useMetaKey) {
            changeAccessor.changeDecorationOptions(this.decorationId, LinkOccurrence._getOptions(this.link, useMetaKey, false));
        }
    }
    function getHoverMessage(link, useMetaKey) {
        const executeCmd = link.url && /^command:/i.test(link.url.toString());
        const label = link.tooltip
            ? link.tooltip
            : executeCmd
                ? nls.localize('links.navigate.executeCmd', 'Execute command')
                : nls.localize('links.navigate.follow', 'Follow link');
        const kb = useMetaKey
            ? platform.isMacintosh
                ? nls.localize('links.navigate.kb.meta.mac', "cmd + click")
                : nls.localize('links.navigate.kb.meta', "ctrl + click")
            : platform.isMacintosh
                ? nls.localize('links.navigate.kb.alt.mac', "option + click")
                : nls.localize('links.navigate.kb.alt', "alt + click");
        if (link.url) {
            let nativeLabel = '';
            if (/^command:/i.test(link.url.toString())) {
                // Don't show complete command arguments in the native tooltip
                const match = link.url.toString().match(/^command:([^?#]+)/);
                if (match) {
                    const commandId = match[1];
                    nativeLabel = nls.localize('tooltip.explanation', "Execute command {0}", commandId);
                }
            }
            const hoverMessage = new htmlContent_1.MarkdownString('', true)
                .appendLink(link.url.toString(true).replace(/ /g, '%20'), label, nativeLabel)
                .appendMarkdown(` (${kb})`);
            return hoverMessage;
        }
        else {
            return new htmlContent_1.MarkdownString().appendText(`${label} (${kb})`);
        }
    }
    class OpenLinkAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.openLink',
                label: nls.localize('label', "Open Link"),
                alias: 'Open Link',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            const linkDetector = LinkDetector.get(editor);
            if (!linkDetector) {
                return;
            }
            if (!editor.hasModel()) {
                return;
            }
            const selections = editor.getSelections();
            for (const sel of selections) {
                const link = linkDetector.getLinkOccurrence(sel.getEndPosition());
                if (link) {
                    linkDetector.openLinkOccurrence(link, false);
                }
            }
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(LinkDetector.ID, LinkDetector);
    (0, editorExtensions_1.registerEditorAction)(OpenLinkAction);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const activeLinkForeground = theme.getColor(colorRegistry_1.editorActiveLinkForeground);
        if (activeLinkForeground) {
            collector.addRule(`.monaco-editor .detected-link-active { color: ${activeLinkForeground} !important; }`);
        }
    });
});
//# sourceMappingURL=links.js.map