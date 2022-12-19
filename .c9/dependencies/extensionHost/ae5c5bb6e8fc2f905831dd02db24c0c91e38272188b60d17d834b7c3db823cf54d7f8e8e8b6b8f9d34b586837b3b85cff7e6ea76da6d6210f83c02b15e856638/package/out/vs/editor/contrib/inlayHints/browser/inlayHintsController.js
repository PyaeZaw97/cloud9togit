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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/base/common/map", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/editorDom", "vs/editor/common/config/editorOptions", "vs/editor/common/core/editOperation", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/common/model", "vs/editor/common/model/textModel", "vs/editor/common/services/languageFeatureDebounce", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/resolverService", "vs/editor/contrib/gotoSymbol/browser/link/clickLinkGesture", "vs/editor/contrib/inlayHints/browser/inlayHints", "vs/editor/contrib/inlayHints/browser/inlayHintsLocations", "vs/platform/commands/common/commands", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService"], function (require, exports, dom_1, arrays_1, async_1, cancellation_1, errors_1, lifecycle_1, map_1, types_1, uri_1, editorDom_1, editorOptions_1, editOperation_1, range_1, languages, model_1, textModel_1, languageFeatureDebounce_1, languageFeatures_1, resolverService_1, clickLinkGesture_1, inlayHints_1, inlayHintsLocations_1, commands_1, extensions_1, instantiation_1, notification_1, colors, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InlayHintsController = exports.RenderedInlayHintLabelPart = void 0;
    // --- hint caching service (per session)
    class InlayHintsCache {
        constructor() {
            this._entries = new map_1.LRUCache(50);
        }
        get(model) {
            const key = InlayHintsCache._key(model);
            return this._entries.get(key);
        }
        set(model, value) {
            const key = InlayHintsCache._key(model);
            this._entries.set(key, value);
        }
        static _key(model) {
            return `${model.uri.toString()}/${model.getVersionId()}`;
        }
    }
    const IInlayHintsCache = (0, instantiation_1.createDecorator)('IInlayHintsCache');
    (0, extensions_1.registerSingleton)(IInlayHintsCache, InlayHintsCache, true);
    // --- rendered label
    class RenderedInlayHintLabelPart {
        constructor(item, index) {
            this.item = item;
            this.index = index;
        }
        get part() {
            const label = this.item.hint.label;
            if (typeof label === 'string') {
                return { label };
            }
            else {
                return label[this.index];
            }
        }
    }
    exports.RenderedInlayHintLabelPart = RenderedInlayHintLabelPart;
    class ActiveInlayHintInfo {
        constructor(part, hasTriggerModifier) {
            this.part = part;
            this.hasTriggerModifier = hasTriggerModifier;
        }
    }
    var RenderMode;
    (function (RenderMode) {
        RenderMode[RenderMode["Normal"] = 0] = "Normal";
        RenderMode[RenderMode["Invisible"] = 1] = "Invisible";
    })(RenderMode || (RenderMode = {}));
    // --- controller
    let InlayHintsController = class InlayHintsController {
        constructor(_editor, _languageFeaturesService, _featureDebounce, _inlayHintsCache, _commandService, _notificationService, _instaService) {
            this._editor = _editor;
            this._languageFeaturesService = _languageFeaturesService;
            this._inlayHintsCache = _inlayHintsCache;
            this._commandService = _commandService;
            this._notificationService = _notificationService;
            this._instaService = _instaService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._sessionDisposables = new lifecycle_1.DisposableStore();
            this._decorationsMetadata = new Map();
            this._ruleFactory = new editorDom_1.DynamicCssRules(this._editor);
            this._activeRenderMode = 0 /* RenderMode.Normal */;
            this._debounceInfo = _featureDebounce.for(_languageFeaturesService.inlayHintsProvider, 'InlayHint', { min: 25 });
            this._disposables.add(_languageFeaturesService.inlayHintsProvider.onDidChange(() => this._update()));
            this._disposables.add(_editor.onDidChangeModel(() => this._update()));
            this._disposables.add(_editor.onDidChangeModelLanguage(() => this._update()));
            this._disposables.add(_editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(127 /* EditorOption.inlayHints */)) {
                    this._update();
                }
            }));
            this._update();
        }
        static get(editor) {
            var _a;
            return (_a = editor.getContribution(InlayHintsController.ID)) !== null && _a !== void 0 ? _a : undefined;
        }
        dispose() {
            this._sessionDisposables.dispose();
            this._removeAllDecorations();
            this._disposables.dispose();
        }
        _update() {
            this._sessionDisposables.clear();
            this._removeAllDecorations();
            const options = this._editor.getOption(127 /* EditorOption.inlayHints */);
            if (options.enabled === 'off') {
                return;
            }
            const model = this._editor.getModel();
            if (!model || !this._languageFeaturesService.inlayHintsProvider.has(model)) {
                return;
            }
            // iff possible, quickly update from cache
            const cached = this._inlayHintsCache.get(model);
            if (cached) {
                this._updateHintsDecorators([model.getFullModelRange()], cached);
            }
            this._sessionDisposables.add((0, lifecycle_1.toDisposable)(() => {
                // cache items when switching files etc
                if (!model.isDisposed()) {
                    this._cacheHintsForFastRestore(model);
                }
            }));
            let cts;
            let watchedProviders = new Set();
            const scheduler = new async_1.RunOnceScheduler(async () => {
                const t1 = Date.now();
                cts === null || cts === void 0 ? void 0 : cts.dispose(true);
                cts = new cancellation_1.CancellationTokenSource();
                const listener = model.onWillDispose(() => cts === null || cts === void 0 ? void 0 : cts.cancel());
                try {
                    const myToken = cts.token;
                    const inlayHints = await inlayHints_1.InlayHintsFragments.create(this._languageFeaturesService.inlayHintsProvider, model, this._getHintsRanges(), myToken);
                    scheduler.delay = this._debounceInfo.update(model, Date.now() - t1);
                    if (myToken.isCancellationRequested) {
                        inlayHints.dispose();
                        return;
                    }
                    // listen to provider changes
                    for (const provider of inlayHints.provider) {
                        if (typeof provider.onDidChangeInlayHints === 'function' && !watchedProviders.has(provider)) {
                            watchedProviders.add(provider);
                            this._sessionDisposables.add(provider.onDidChangeInlayHints(() => {
                                if (!scheduler.isScheduled()) { // ignore event when request is already scheduled
                                    scheduler.schedule();
                                }
                            }));
                        }
                    }
                    this._sessionDisposables.add(inlayHints);
                    this._updateHintsDecorators(inlayHints.ranges, inlayHints.items);
                    this._cacheHintsForFastRestore(model);
                }
                catch (err) {
                    (0, errors_1.onUnexpectedError)(err);
                }
                finally {
                    cts.dispose();
                    listener.dispose();
                }
            }, this._debounceInfo.get(model));
            this._sessionDisposables.add(scheduler);
            this._sessionDisposables.add((0, lifecycle_1.toDisposable)(() => cts === null || cts === void 0 ? void 0 : cts.dispose(true)));
            scheduler.schedule(0);
            this._sessionDisposables.add(this._editor.onDidScrollChange((e) => {
                // update when scroll position changes
                // uses scrollTopChanged has weak heuristic to differenatiate between scrolling due to
                // typing or due to "actual" scrolling
                if (e.scrollTopChanged || !scheduler.isScheduled()) {
                    scheduler.schedule();
                }
            }));
            this._sessionDisposables.add(this._editor.onDidChangeModelContent((e) => {
                // update less aggressive when typing
                const delay = Math.max(scheduler.delay, 1250);
                scheduler.schedule(delay);
            }));
            if (options.enabled === 'on') {
                // different "on" modes: always
                this._activeRenderMode = 0 /* RenderMode.Normal */;
            }
            else {
                // different "on" modes: offUnlessPressed, or onUnlessPressed
                let defaultMode;
                let altMode;
                if (options.enabled === 'onUnlessPressed') {
                    defaultMode = 0 /* RenderMode.Normal */;
                    altMode = 1 /* RenderMode.Invisible */;
                }
                else {
                    defaultMode = 1 /* RenderMode.Invisible */;
                    altMode = 0 /* RenderMode.Normal */;
                }
                this._activeRenderMode = defaultMode;
                this._sessionDisposables.add(dom_1.ModifierKeyEmitter.getInstance().event(e => {
                    if (!this._editor.hasModel()) {
                        return;
                    }
                    const newRenderMode = e.altKey && e.ctrlKey ? altMode : defaultMode;
                    if (newRenderMode !== this._activeRenderMode) {
                        this._activeRenderMode = newRenderMode;
                        const ranges = this._getHintsRanges();
                        const copies = this._copyInlayHintsWithCurrentAnchor(this._editor.getModel());
                        this._updateHintsDecorators(ranges, copies);
                        scheduler.schedule(0);
                    }
                }));
            }
            // mouse gestures
            this._sessionDisposables.add(this._installDblClickGesture(() => scheduler.schedule(0)));
            this._sessionDisposables.add(this._installLinkGesture());
            this._sessionDisposables.add(this._installContextMenu());
        }
        _installLinkGesture() {
            const store = new lifecycle_1.DisposableStore();
            const gesture = store.add(new clickLinkGesture_1.ClickLinkGesture(this._editor));
            // let removeHighlight = () => { };
            const sessionStore = new lifecycle_1.DisposableStore();
            store.add(sessionStore);
            store.add(gesture.onMouseMoveOrRelevantKeyDown(e => {
                const [mouseEvent] = e;
                const labelPart = this._getInlayHintLabelPart(mouseEvent);
                const model = this._editor.getModel();
                if (!labelPart || !model) {
                    sessionStore.clear();
                    return;
                }
                // resolve the item
                const cts = new cancellation_1.CancellationTokenSource();
                sessionStore.add((0, lifecycle_1.toDisposable)(() => cts.dispose(true)));
                labelPart.item.resolve(cts.token);
                // render link => when the modifier is pressed and when there is a command or location
                this._activeInlayHintPart = labelPart.part.command || labelPart.part.location
                    ? new ActiveInlayHintInfo(labelPart, mouseEvent.hasTriggerModifier)
                    : undefined;
                const lineNumber = labelPart.item.hint.position.lineNumber;
                const range = new range_1.Range(lineNumber, 1, lineNumber, model.getLineMaxColumn(lineNumber));
                const lineHints = this._getInlineHintsForRange(range);
                this._updateHintsDecorators([range], lineHints);
                sessionStore.add((0, lifecycle_1.toDisposable)(() => {
                    this._activeInlayHintPart = undefined;
                    this._updateHintsDecorators([range], lineHints);
                }));
            }));
            store.add(gesture.onCancel(() => sessionStore.clear()));
            store.add(gesture.onExecute(async (e) => {
                const label = this._getInlayHintLabelPart(e);
                if (label) {
                    const part = label.part;
                    if (part.location) {
                        // location -> execute go to def
                        this._instaService.invokeFunction(inlayHintsLocations_1.goToDefinitionWithLocation, e, this._editor, part.location);
                    }
                    else if (languages.Command.is(part.command)) {
                        // command -> execute it
                        await this._invokeCommand(part.command, label.item);
                    }
                }
            }));
            return store;
        }
        _getInlineHintsForRange(range) {
            const lineHints = new Set();
            for (const data of this._decorationsMetadata.values()) {
                if (range.containsRange(data.item.anchor.range)) {
                    lineHints.add(data.item);
                }
            }
            return Array.from(lineHints);
        }
        _installDblClickGesture(updateInlayHints) {
            return this._editor.onMouseUp(async (e) => {
                if (e.event.detail !== 2) {
                    return;
                }
                const part = this._getInlayHintLabelPart(e);
                if (!part) {
                    return;
                }
                e.event.preventDefault();
                await part.item.resolve(cancellation_1.CancellationToken.None);
                if ((0, arrays_1.isNonEmptyArray)(part.item.hint.textEdits)) {
                    const edits = part.item.hint.textEdits.map(edit => editOperation_1.EditOperation.replace(range_1.Range.lift(edit.range), edit.text));
                    this._editor.executeEdits('inlayHint.default', edits);
                    updateInlayHints();
                }
            });
        }
        _installContextMenu() {
            return this._editor.onContextMenu(async (e) => {
                if (!(e.event.target instanceof HTMLElement)) {
                    return;
                }
                const part = this._getInlayHintLabelPart(e);
                if (part) {
                    await this._instaService.invokeFunction(inlayHintsLocations_1.showGoToContextMenu, this._editor, e.event.target, part);
                }
            });
        }
        _getInlayHintLabelPart(e) {
            var _a;
            if (e.target.type !== 6 /* MouseTargetType.CONTENT_TEXT */) {
                return undefined;
            }
            const options = (_a = e.target.detail.injectedText) === null || _a === void 0 ? void 0 : _a.options;
            if (options instanceof textModel_1.ModelDecorationInjectedTextOptions && (options === null || options === void 0 ? void 0 : options.attachedData) instanceof RenderedInlayHintLabelPart) {
                return options.attachedData;
            }
            return undefined;
        }
        async _invokeCommand(command, item) {
            var _a;
            try {
                await this._commandService.executeCommand(command.id, ...((_a = command.arguments) !== null && _a !== void 0 ? _a : []));
            }
            catch (err) {
                this._notificationService.notify({
                    severity: notification_1.Severity.Error,
                    source: item.provider.displayName,
                    message: err
                });
            }
        }
        _cacheHintsForFastRestore(model) {
            const hints = this._copyInlayHintsWithCurrentAnchor(model);
            this._inlayHintsCache.set(model, hints);
        }
        // return inlay hints but with an anchor that reflects "updates"
        // that happens after receiving them, e.g adding new lines before a hint
        _copyInlayHintsWithCurrentAnchor(model) {
            const items = new Map();
            for (const [id, obj] of this._decorationsMetadata) {
                if (items.has(obj.item)) {
                    // an inlay item can be rendered as multiple decorations
                    // but they will all uses the same range
                    continue;
                }
                const range = model.getDecorationRange(id);
                if (range) {
                    // update range with whatever the editor has tweaked it to
                    const anchor = new inlayHints_1.InlayHintAnchor(range, obj.item.anchor.direction);
                    const copy = obj.item.with({ anchor });
                    items.set(obj.item, copy);
                }
            }
            return Array.from(items.values());
        }
        _getHintsRanges() {
            const extra = 30;
            const model = this._editor.getModel();
            const visibleRanges = this._editor.getVisibleRangesPlusViewportAboveBelow();
            const result = [];
            for (const range of visibleRanges.sort(range_1.Range.compareRangesUsingStarts)) {
                const extendedRange = model.validateRange(new range_1.Range(range.startLineNumber - extra, range.startColumn, range.endLineNumber + extra, range.endColumn));
                if (result.length === 0 || !range_1.Range.areIntersectingOrTouching(result[result.length - 1], extendedRange)) {
                    result.push(extendedRange);
                }
                else {
                    result[result.length - 1] = range_1.Range.plusRange(result[result.length - 1], extendedRange);
                }
            }
            return result;
        }
        _updateHintsDecorators(ranges, items) {
            var _a, _b;
            // utils to collect/create injected text decorations
            const newDecorationsData = [];
            const addInjectedText = (item, ref, content, cursorStops, attachedData) => {
                const opts = {
                    content,
                    inlineClassNameAffectsLetterSpacing: true,
                    inlineClassName: ref.className,
                    cursorStops,
                    attachedData
                };
                newDecorationsData.push({
                    item,
                    classNameRef: ref,
                    decoration: {
                        range: item.anchor.range,
                        options: {
                            // className: "rangeHighlight", // DEBUG highlight to see to what range a hint is attached
                            description: 'InlayHint',
                            showIfCollapsed: item.anchor.range.isEmpty(),
                            collapseOnReplaceEdit: !item.anchor.range.isEmpty(),
                            stickiness: 0 /* TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges */,
                            [item.anchor.direction]: this._activeRenderMode === 0 /* RenderMode.Normal */ ? opts : undefined
                        }
                    }
                });
            };
            const addInjectedWhitespace = (item, isLast) => {
                const marginRule = this._ruleFactory.createClassNameRef({
                    width: `${(fontSize / 3) | 0}px`,
                    display: 'inline-block'
                });
                addInjectedText(item, marginRule, '\u200a', isLast ? model_1.InjectedTextCursorStops.Right : model_1.InjectedTextCursorStops.None);
            };
            //
            const { fontSize, fontFamily, displayStyle } = this._getLayoutInfo();
            const fontFamilyVar = '--code-editorInlayHintsFontFamily';
            this._editor.getContainerDomNode().style.setProperty(fontFamilyVar, fontFamily);
            for (const item of items) {
                // whitespace leading the actual label
                if (item.hint.paddingLeft) {
                    addInjectedWhitespace(item, false);
                }
                // the label with its parts
                const parts = typeof item.hint.label === 'string'
                    ? [{ label: item.hint.label }]
                    : item.hint.label;
                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i];
                    const isFirst = i === 0;
                    const isLast = i === parts.length - 1;
                    const cssProperties = {
                        fontSize: `${fontSize}px`,
                        fontFamily: `var(${fontFamilyVar}), ${editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily}`,
                    };
                    if ((0, arrays_1.isNonEmptyArray)(item.hint.textEdits)) {
                        cssProperties.cursor = 'default';
                    }
                    this._fillInColors(cssProperties, item.hint);
                    if ((part.command || part.location) && ((_a = this._activeInlayHintPart) === null || _a === void 0 ? void 0 : _a.part.item) === item && this._activeInlayHintPart.part.index === i) {
                        // active link!
                        cssProperties.textDecoration = 'underline';
                        if (this._activeInlayHintPart.hasTriggerModifier) {
                            cssProperties.color = (0, themeService_1.themeColorFromId)(colors.editorActiveLinkForeground);
                            cssProperties.cursor = 'pointer';
                        }
                    }
                    if (displayStyle === 'standard') {
                        cssProperties.verticalAlign = 'middle';
                        if (isFirst && isLast) {
                            // only element
                            cssProperties.padding = `1px ${Math.max(1, fontSize / 4) | 0}px`;
                            cssProperties.borderRadius = `${(fontSize / 4) | 0}px`;
                        }
                        else if (isFirst) {
                            // first element
                            cssProperties.padding = `1px 0 1px ${Math.max(1, fontSize / 4) | 0}px`;
                            cssProperties.borderRadius = `${(fontSize / 4) | 0}px 0 0 ${(fontSize / 4) | 0}px`;
                        }
                        else if (isLast) {
                            // last element
                            cssProperties.padding = `1px ${Math.max(1, fontSize / 4) | 0}px 1px 0`;
                            cssProperties.borderRadius = `0 ${(fontSize / 4) | 0}px ${(fontSize / 4) | 0}px 0`;
                        }
                        else {
                            cssProperties.padding = `1px 0 1px 0`;
                        }
                    }
                    addInjectedText(item, this._ruleFactory.createClassNameRef(cssProperties), fixSpace(part.label), isLast && !item.hint.paddingRight ? model_1.InjectedTextCursorStops.Right : model_1.InjectedTextCursorStops.None, new RenderedInlayHintLabelPart(item, i));
                }
                // whitespace trailing the actual label
                if (item.hint.paddingRight) {
                    addInjectedWhitespace(item, true);
                }
                if (newDecorationsData.length > InlayHintsController._MAX_DECORATORS) {
                    break;
                }
            }
            // collect all decoration ids that are affected by the ranges
            // and only update those decorations
            const decorationIdsToReplace = [];
            for (const range of ranges) {
                for (const { id } of (_b = this._editor.getDecorationsInRange(range)) !== null && _b !== void 0 ? _b : []) {
                    const metadata = this._decorationsMetadata.get(id);
                    if (metadata) {
                        decorationIdsToReplace.push(id);
                        metadata.classNameRef.dispose();
                        this._decorationsMetadata.delete(id);
                    }
                }
            }
            const newDecorationIds = this._editor.deltaDecorations(decorationIdsToReplace, newDecorationsData.map(d => d.decoration));
            for (let i = 0; i < newDecorationIds.length; i++) {
                const data = newDecorationsData[i];
                this._decorationsMetadata.set(newDecorationIds[i], data);
            }
        }
        _fillInColors(props, hint) {
            if (hint.kind === languages.InlayHintKind.Parameter) {
                props.backgroundColor = (0, themeService_1.themeColorFromId)(colors.editorInlayHintParameterBackground);
                props.color = (0, themeService_1.themeColorFromId)(colors.editorInlayHintParameterForeground);
            }
            else if (hint.kind === languages.InlayHintKind.Type) {
                props.backgroundColor = (0, themeService_1.themeColorFromId)(colors.editorInlayHintTypeBackground);
                props.color = (0, themeService_1.themeColorFromId)(colors.editorInlayHintTypeForeground);
            }
            else {
                props.backgroundColor = (0, themeService_1.themeColorFromId)(colors.editorInlayHintBackground);
                props.color = (0, themeService_1.themeColorFromId)(colors.editorInlayHintForeground);
            }
        }
        _getLayoutInfo() {
            const options = this._editor.getOption(127 /* EditorOption.inlayHints */);
            const editorFontSize = this._editor.getOption(46 /* EditorOption.fontSize */);
            let fontSize = options.fontSize;
            if (!fontSize || fontSize < 5 || fontSize > editorFontSize) {
                fontSize = editorFontSize;
            }
            const fontFamily = options.fontFamily || this._editor.getOption(43 /* EditorOption.fontFamily */);
            return { fontSize, fontFamily, displayStyle: options.displayStyle };
        }
        _removeAllDecorations() {
            this._editor.deltaDecorations(Array.from(this._decorationsMetadata.keys()), []);
            for (let obj of this._decorationsMetadata.values()) {
                obj.classNameRef.dispose();
            }
            this._decorationsMetadata.clear();
        }
        // --- accessibility
        getInlayHintsForLine(line) {
            if (!this._editor.hasModel()) {
                return [];
            }
            const set = new Set();
            const result = [];
            for (let deco of this._editor.getLineDecorations(line)) {
                const data = this._decorationsMetadata.get(deco.id);
                if (data && !set.has(data.item.hint)) {
                    set.add(data.item.hint);
                    result.push(data.item);
                }
            }
            return result;
        }
    };
    InlayHintsController.ID = 'editor.contrib.InlayHints';
    InlayHintsController._MAX_DECORATORS = 1500;
    InlayHintsController = __decorate([
        __param(1, languageFeatures_1.ILanguageFeaturesService),
        __param(2, languageFeatureDebounce_1.ILanguageFeatureDebounceService),
        __param(3, IInlayHintsCache),
        __param(4, commands_1.ICommandService),
        __param(5, notification_1.INotificationService),
        __param(6, instantiation_1.IInstantiationService)
    ], InlayHintsController);
    exports.InlayHintsController = InlayHintsController;
    // Prevents the view from potentially visible whitespace
    function fixSpace(str) {
        const noBreakWhitespace = '\xa0';
        return str.replace(/[ \t]/g, noBreakWhitespace);
    }
    commands_1.CommandsRegistry.registerCommand('_executeInlayHintProvider', async (accessor, ...args) => {
        const [uri, range] = args;
        (0, types_1.assertType)(uri_1.URI.isUri(uri));
        (0, types_1.assertType)(range_1.Range.isIRange(range));
        const { inlayHintsProvider } = accessor.get(languageFeatures_1.ILanguageFeaturesService);
        const ref = await accessor.get(resolverService_1.ITextModelService).createModelReference(uri);
        try {
            const model = await inlayHints_1.InlayHintsFragments.create(inlayHintsProvider, ref.object.textEditorModel, [range_1.Range.lift(range)], cancellation_1.CancellationToken.None);
            const result = model.items.map(i => i.hint);
            setTimeout(() => model.dispose(), 0); // dispose after sending to ext host
            return result;
        }
        finally {
            ref.dispose();
        }
    });
});
//# sourceMappingURL=inlayHintsController.js.map