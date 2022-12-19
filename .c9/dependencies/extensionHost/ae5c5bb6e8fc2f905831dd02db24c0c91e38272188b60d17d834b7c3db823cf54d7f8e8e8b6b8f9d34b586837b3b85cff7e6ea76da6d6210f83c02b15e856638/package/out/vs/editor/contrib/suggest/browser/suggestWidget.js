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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/list/listWidget", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/strings", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/editor/contrib/suggest/browser/suggestWidgetStatus", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/storage/common/storage", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/theme", "vs/platform/theme/common/themeService", "./resizable", "./suggest", "./suggestWidgetDetails", "./suggestWidgetRenderer", "vs/base/browser/ui/codicons/codiconStyles", "vs/css!./media/suggest", "vs/editor/contrib/symbolIcons/browser/symbolIcons"], function (require, exports, dom, listWidget_1, async_1, errors_1, event_1, lifecycle_1, numbers_1, strings, embeddedCodeEditorWidget_1, suggestWidgetStatus_1, nls, contextkey_1, instantiation_1, storage_1, colorRegistry_1, styler_1, theme_1, themeService_1, resizable_1, suggest_1, suggestWidgetDetails_1, suggestWidgetRenderer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SuggestContentWidget = exports.SuggestWidget = exports.editorSuggestWidgetStatusForeground = exports.editorSuggestWidgetHighlightFocusForeground = exports.editorSuggestWidgetHighlightForeground = exports.editorSuggestWidgetSelectedBackground = exports.editorSuggestWidgetSelectedIconForeground = exports.editorSuggestWidgetSelectedForeground = exports.editorSuggestWidgetForeground = exports.editorSuggestWidgetBorder = exports.editorSuggestWidgetBackground = void 0;
    /**
     * Suggest widget colors
     */
    exports.editorSuggestWidgetBackground = (0, colorRegistry_1.registerColor)('editorSuggestWidget.background', { dark: colorRegistry_1.editorWidgetBackground, light: colorRegistry_1.editorWidgetBackground, hcDark: colorRegistry_1.editorWidgetBackground, hcLight: colorRegistry_1.editorWidgetBackground }, nls.localize('editorSuggestWidgetBackground', 'Background color of the suggest widget.'));
    exports.editorSuggestWidgetBorder = (0, colorRegistry_1.registerColor)('editorSuggestWidget.border', { dark: colorRegistry_1.editorWidgetBorder, light: colorRegistry_1.editorWidgetBorder, hcDark: colorRegistry_1.editorWidgetBorder, hcLight: colorRegistry_1.editorWidgetBorder }, nls.localize('editorSuggestWidgetBorder', 'Border color of the suggest widget.'));
    exports.editorSuggestWidgetForeground = (0, colorRegistry_1.registerColor)('editorSuggestWidget.foreground', { dark: colorRegistry_1.editorForeground, light: colorRegistry_1.editorForeground, hcDark: colorRegistry_1.editorForeground, hcLight: colorRegistry_1.editorForeground }, nls.localize('editorSuggestWidgetForeground', 'Foreground color of the suggest widget.'));
    exports.editorSuggestWidgetSelectedForeground = (0, colorRegistry_1.registerColor)('editorSuggestWidget.selectedForeground', { dark: colorRegistry_1.quickInputListFocusForeground, light: colorRegistry_1.quickInputListFocusForeground, hcDark: colorRegistry_1.quickInputListFocusForeground, hcLight: colorRegistry_1.quickInputListFocusForeground }, nls.localize('editorSuggestWidgetSelectedForeground', 'Foreground color of the selected entry in the suggest widget.'));
    exports.editorSuggestWidgetSelectedIconForeground = (0, colorRegistry_1.registerColor)('editorSuggestWidget.selectedIconForeground', { dark: colorRegistry_1.quickInputListFocusIconForeground, light: colorRegistry_1.quickInputListFocusIconForeground, hcDark: colorRegistry_1.quickInputListFocusIconForeground, hcLight: colorRegistry_1.quickInputListFocusIconForeground }, nls.localize('editorSuggestWidgetSelectedIconForeground', 'Icon foreground color of the selected entry in the suggest widget.'));
    exports.editorSuggestWidgetSelectedBackground = (0, colorRegistry_1.registerColor)('editorSuggestWidget.selectedBackground', { dark: colorRegistry_1.quickInputListFocusBackground, light: colorRegistry_1.quickInputListFocusBackground, hcDark: colorRegistry_1.quickInputListFocusBackground, hcLight: colorRegistry_1.quickInputListFocusBackground }, nls.localize('editorSuggestWidgetSelectedBackground', 'Background color of the selected entry in the suggest widget.'));
    exports.editorSuggestWidgetHighlightForeground = (0, colorRegistry_1.registerColor)('editorSuggestWidget.highlightForeground', { dark: colorRegistry_1.listHighlightForeground, light: colorRegistry_1.listHighlightForeground, hcDark: colorRegistry_1.listHighlightForeground, hcLight: colorRegistry_1.listHighlightForeground }, nls.localize('editorSuggestWidgetHighlightForeground', 'Color of the match highlights in the suggest widget.'));
    exports.editorSuggestWidgetHighlightFocusForeground = (0, colorRegistry_1.registerColor)('editorSuggestWidget.focusHighlightForeground', { dark: colorRegistry_1.listFocusHighlightForeground, light: colorRegistry_1.listFocusHighlightForeground, hcDark: colorRegistry_1.listFocusHighlightForeground, hcLight: colorRegistry_1.listFocusHighlightForeground }, nls.localize('editorSuggestWidgetFocusHighlightForeground', 'Color of the match highlights in the suggest widget when an item is focused.'));
    exports.editorSuggestWidgetStatusForeground = (0, colorRegistry_1.registerColor)('editorSuggestWidgetStatus.foreground', { dark: (0, colorRegistry_1.transparent)(exports.editorSuggestWidgetForeground, .5), light: (0, colorRegistry_1.transparent)(exports.editorSuggestWidgetForeground, .5), hcDark: (0, colorRegistry_1.transparent)(exports.editorSuggestWidgetForeground, .5), hcLight: (0, colorRegistry_1.transparent)(exports.editorSuggestWidgetForeground, .5) }, nls.localize('editorSuggestWidgetStatusForeground', 'Foreground color of the suggest widget status.'));
    var State;
    (function (State) {
        State[State["Hidden"] = 0] = "Hidden";
        State[State["Loading"] = 1] = "Loading";
        State[State["Empty"] = 2] = "Empty";
        State[State["Open"] = 3] = "Open";
        State[State["Frozen"] = 4] = "Frozen";
        State[State["Details"] = 5] = "Details";
    })(State || (State = {}));
    class PersistedWidgetSize {
        constructor(_service, editor) {
            this._service = _service;
            this._key = `suggestWidget.size/${editor.getEditorType()}/${editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget}`;
        }
        restore() {
            var _a;
            const raw = (_a = this._service.get(this._key, 0 /* StorageScope.GLOBAL */)) !== null && _a !== void 0 ? _a : '';
            try {
                const obj = JSON.parse(raw);
                if (dom.Dimension.is(obj)) {
                    return dom.Dimension.lift(obj);
                }
            }
            catch (_b) {
                // ignore
            }
            return undefined;
        }
        store(size) {
            this._service.store(this._key, JSON.stringify(size), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
        reset() {
            this._service.remove(this._key, 0 /* StorageScope.GLOBAL */);
        }
    }
    let SuggestWidget = class SuggestWidget {
        constructor(editor, _storageService, _contextKeyService, _themeService, instantiationService) {
            this.editor = editor;
            this._storageService = _storageService;
            this._state = 0 /* State.Hidden */;
            this._isAuto = false;
            this._ignoreFocusEvents = false;
            this._forceRenderingAbove = false;
            this._explainMode = false;
            this._showTimeout = new async_1.TimeoutTimer();
            this._disposables = new lifecycle_1.DisposableStore();
            this._onDidSelect = new event_1.Emitter();
            this._onDidFocus = new event_1.Emitter();
            this._onDidHide = new event_1.Emitter();
            this._onDidShow = new event_1.Emitter();
            this.onDidSelect = this._onDidSelect.event;
            this.onDidFocus = this._onDidFocus.event;
            this.onDidHide = this._onDidHide.event;
            this.onDidShow = this._onDidShow.event;
            this._onDetailsKeydown = new event_1.Emitter();
            this.onDetailsKeyDown = this._onDetailsKeydown.event;
            this.element = new resizable_1.ResizableHTMLElement();
            this.element.domNode.classList.add('editor-widget', 'suggest-widget');
            this._contentWidget = new SuggestContentWidget(this, editor);
            this._persistedSize = new PersistedWidgetSize(_storageService, editor);
            class ResizeState {
                constructor(persistedSize, currentSize, persistHeight = false, persistWidth = false) {
                    this.persistedSize = persistedSize;
                    this.currentSize = currentSize;
                    this.persistHeight = persistHeight;
                    this.persistWidth = persistWidth;
                }
            }
            let state;
            this._disposables.add(this.element.onDidWillResize(() => {
                this._contentWidget.lockPreference();
                state = new ResizeState(this._persistedSize.restore(), this.element.size);
            }));
            this._disposables.add(this.element.onDidResize(e => {
                var _a, _b, _c, _d;
                this._resize(e.dimension.width, e.dimension.height);
                if (state) {
                    state.persistHeight = state.persistHeight || !!e.north || !!e.south;
                    state.persistWidth = state.persistWidth || !!e.east || !!e.west;
                }
                if (!e.done) {
                    return;
                }
                if (state) {
                    // only store width or height value that have changed and also
                    // only store changes that are above a certain threshold
                    const { itemHeight, defaultSize } = this.getLayoutInfo();
                    const threshold = Math.round(itemHeight / 2);
                    let { width, height } = this.element.size;
                    if (!state.persistHeight || Math.abs(state.currentSize.height - height) <= threshold) {
                        height = (_b = (_a = state.persistedSize) === null || _a === void 0 ? void 0 : _a.height) !== null && _b !== void 0 ? _b : defaultSize.height;
                    }
                    if (!state.persistWidth || Math.abs(state.currentSize.width - width) <= threshold) {
                        width = (_d = (_c = state.persistedSize) === null || _c === void 0 ? void 0 : _c.width) !== null && _d !== void 0 ? _d : defaultSize.width;
                    }
                    this._persistedSize.store(new dom.Dimension(width, height));
                }
                // reset working state
                this._contentWidget.unlockPreference();
                state = undefined;
            }));
            this._messageElement = dom.append(this.element.domNode, dom.$('.message'));
            this._listElement = dom.append(this.element.domNode, dom.$('.tree'));
            const details = instantiationService.createInstance(suggestWidgetDetails_1.SuggestDetailsWidget, this.editor);
            details.onDidClose(this.toggleDetails, this, this._disposables);
            this._details = new suggestWidgetDetails_1.SuggestDetailsOverlay(details, this.editor);
            const applyIconStyle = () => this.element.domNode.classList.toggle('no-icons', !this.editor.getOption(106 /* EditorOption.suggest */).showIcons);
            applyIconStyle();
            const renderer = instantiationService.createInstance(suggestWidgetRenderer_1.ItemRenderer, this.editor);
            this._disposables.add(renderer);
            this._disposables.add(renderer.onDidToggleDetails(() => this.toggleDetails()));
            this._list = new listWidget_1.List('SuggestWidget', this._listElement, {
                getHeight: (_element) => this.getLayoutInfo().itemHeight,
                getTemplateId: (_element) => 'suggestion'
            }, [renderer], {
                alwaysConsumeMouseWheel: true,
                useShadows: false,
                mouseSupport: false,
                multipleSelectionSupport: false,
                accessibilityProvider: {
                    getRole: () => 'option',
                    getWidgetAriaLabel: () => nls.localize('suggest', "Suggest"),
                    getWidgetRole: () => 'listbox',
                    getAriaLabel: (item) => {
                        let label = item.textLabel;
                        if (typeof item.completion.label !== 'string') {
                            const { detail, description } = item.completion.label;
                            if (detail && description) {
                                label = nls.localize('label.full', '{0}{1}, {2}', label, detail, description);
                            }
                            else if (detail) {
                                label = nls.localize('label.detail', '{0}{1}', label, detail);
                            }
                            else if (description) {
                                label = nls.localize('label.desc', '{0}, {1}', label, description);
                            }
                        }
                        if (!item.isResolved || !this._isDetailsVisible()) {
                            return label;
                        }
                        const { documentation, detail } = item.completion;
                        const docs = strings.format('{0}{1}', detail || '', documentation ? (typeof documentation === 'string' ? documentation : documentation.value) : '');
                        return nls.localize('ariaCurrenttSuggestionReadDetails', "{0}, docs: {1}", label, docs);
                    },
                }
            });
            this._status = instantiationService.createInstance(suggestWidgetStatus_1.SuggestWidgetStatus, this.element.domNode);
            const applyStatusBarStyle = () => this.element.domNode.classList.toggle('with-status-bar', this.editor.getOption(106 /* EditorOption.suggest */).showStatusBar);
            applyStatusBarStyle();
            this._disposables.add((0, styler_1.attachListStyler)(this._list, _themeService, {
                listInactiveFocusBackground: exports.editorSuggestWidgetSelectedBackground,
                listInactiveFocusOutline: colorRegistry_1.activeContrastBorder
            }));
            this._disposables.add(_themeService.onDidColorThemeChange(t => this._onThemeChange(t)));
            this._onThemeChange(_themeService.getColorTheme());
            this._disposables.add(this._list.onMouseDown(e => this._onListMouseDownOrTap(e)));
            this._disposables.add(this._list.onTap(e => this._onListMouseDownOrTap(e)));
            this._disposables.add(this._list.onDidChangeSelection(e => this._onListSelection(e)));
            this._disposables.add(this._list.onDidChangeFocus(e => this._onListFocus(e)));
            this._disposables.add(this.editor.onDidChangeCursorSelection(() => this._onCursorSelectionChanged()));
            this._disposables.add(this.editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(106 /* EditorOption.suggest */)) {
                    applyStatusBarStyle();
                    applyIconStyle();
                }
            }));
            this._ctxSuggestWidgetVisible = suggest_1.Context.Visible.bindTo(_contextKeyService);
            this._ctxSuggestWidgetDetailsVisible = suggest_1.Context.DetailsVisible.bindTo(_contextKeyService);
            this._ctxSuggestWidgetMultipleSuggestions = suggest_1.Context.MultipleSuggestions.bindTo(_contextKeyService);
            this._disposables.add(dom.addStandardDisposableListener(this._details.widget.domNode, 'keydown', e => {
                this._onDetailsKeydown.fire(e);
            }));
            this._disposables.add(this.editor.onMouseDown((e) => this._onEditorMouseDown(e)));
        }
        dispose() {
            var _a;
            this._details.widget.dispose();
            this._details.dispose();
            this._list.dispose();
            this._status.dispose();
            this._disposables.dispose();
            (_a = this._loadingTimeout) === null || _a === void 0 ? void 0 : _a.dispose();
            this._showTimeout.dispose();
            this._contentWidget.dispose();
            this.element.dispose();
        }
        _onEditorMouseDown(mouseEvent) {
            if (this._details.widget.domNode.contains(mouseEvent.target.element)) {
                // Clicking inside details
                this._details.widget.domNode.focus();
            }
            else {
                // Clicking outside details and inside suggest
                if (this.element.domNode.contains(mouseEvent.target.element)) {
                    this.editor.focus();
                }
            }
        }
        _onCursorSelectionChanged() {
            if (this._state !== 0 /* State.Hidden */) {
                this._contentWidget.layout();
            }
        }
        _onListMouseDownOrTap(e) {
            if (typeof e.element === 'undefined' || typeof e.index === 'undefined') {
                return;
            }
            // prevent stealing browser focus from the editor
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
            this._select(e.element, e.index);
        }
        _onListSelection(e) {
            if (e.elements.length) {
                this._select(e.elements[0], e.indexes[0]);
            }
        }
        _select(item, index) {
            const completionModel = this._completionModel;
            if (completionModel) {
                this._onDidSelect.fire({ item, index, model: completionModel });
                this.editor.focus();
            }
        }
        _onThemeChange(theme) {
            this._details.widget.borderWidth = (0, theme_1.isHighContrast)(theme.type) ? 2 : 1;
        }
        _onListFocus(e) {
            var _a;
            if (this._ignoreFocusEvents) {
                return;
            }
            if (!e.elements.length) {
                if (this._currentSuggestionDetails) {
                    this._currentSuggestionDetails.cancel();
                    this._currentSuggestionDetails = undefined;
                    this._focusedItem = undefined;
                }
                this.editor.setAriaOptions({ activeDescendant: undefined });
                return;
            }
            if (!this._completionModel) {
                return;
            }
            const item = e.elements[0];
            const index = e.indexes[0];
            if (item !== this._focusedItem) {
                (_a = this._currentSuggestionDetails) === null || _a === void 0 ? void 0 : _a.cancel();
                this._currentSuggestionDetails = undefined;
                this._focusedItem = item;
                this._list.reveal(index);
                this._currentSuggestionDetails = (0, async_1.createCancelablePromise)(async (token) => {
                    const loading = (0, async_1.disposableTimeout)(() => {
                        if (this._isDetailsVisible()) {
                            this.showDetails(true);
                        }
                    }, 250);
                    const sub = token.onCancellationRequested(() => loading.dispose());
                    const result = await item.resolve(token);
                    loading.dispose();
                    sub.dispose();
                    return result;
                });
                this._currentSuggestionDetails.then(() => {
                    if (index >= this._list.length || item !== this._list.element(index)) {
                        return;
                    }
                    // item can have extra information, so re-render
                    this._ignoreFocusEvents = true;
                    this._list.splice(index, 1, [item]);
                    this._list.setFocus([index]);
                    this._ignoreFocusEvents = false;
                    if (this._isDetailsVisible()) {
                        this.showDetails(false);
                    }
                    else {
                        this.element.domNode.classList.remove('docs-side');
                    }
                    this.editor.setAriaOptions({ activeDescendant: (0, suggestWidgetRenderer_1.getAriaId)(index) });
                }).catch(errors_1.onUnexpectedError);
            }
            // emit an event
            this._onDidFocus.fire({ item, index, model: this._completionModel });
        }
        _setState(state) {
            if (this._state === state) {
                return;
            }
            this._state = state;
            this.element.domNode.classList.toggle('frozen', state === 4 /* State.Frozen */);
            this.element.domNode.classList.remove('message');
            switch (state) {
                case 0 /* State.Hidden */:
                    dom.hide(this._messageElement, this._listElement, this._status.element);
                    this._details.hide(true);
                    this._status.hide();
                    this._contentWidget.hide();
                    this._ctxSuggestWidgetVisible.reset();
                    this._ctxSuggestWidgetMultipleSuggestions.reset();
                    this._showTimeout.cancel();
                    this.element.domNode.classList.remove('visible');
                    this._list.splice(0, this._list.length);
                    this._focusedItem = undefined;
                    this._cappedHeight = undefined;
                    this._explainMode = false;
                    break;
                case 1 /* State.Loading */:
                    this.element.domNode.classList.add('message');
                    this._messageElement.textContent = SuggestWidget.LOADING_MESSAGE;
                    dom.hide(this._listElement, this._status.element);
                    dom.show(this._messageElement);
                    this._details.hide();
                    this._show();
                    this._focusedItem = undefined;
                    break;
                case 2 /* State.Empty */:
                    this.element.domNode.classList.add('message');
                    this._messageElement.textContent = SuggestWidget.NO_SUGGESTIONS_MESSAGE;
                    dom.hide(this._listElement, this._status.element);
                    dom.show(this._messageElement);
                    this._details.hide();
                    this._show();
                    this._focusedItem = undefined;
                    break;
                case 3 /* State.Open */:
                    dom.hide(this._messageElement);
                    dom.show(this._listElement, this._status.element);
                    this._show();
                    break;
                case 4 /* State.Frozen */:
                    dom.hide(this._messageElement);
                    dom.show(this._listElement, this._status.element);
                    this._show();
                    break;
                case 5 /* State.Details */:
                    dom.hide(this._messageElement);
                    dom.show(this._listElement, this._status.element);
                    this._details.show();
                    this._show();
                    break;
            }
        }
        _show() {
            this._status.show();
            this._contentWidget.show();
            this._layout(this._persistedSize.restore());
            this._ctxSuggestWidgetVisible.set(true);
            this._showTimeout.cancelAndSet(() => {
                this.element.domNode.classList.add('visible');
                this._onDidShow.fire(this);
            }, 100);
        }
        showTriggered(auto, delay) {
            if (this._state !== 0 /* State.Hidden */) {
                return;
            }
            this._contentWidget.setPosition(this.editor.getPosition());
            this._isAuto = !!auto;
            if (!this._isAuto) {
                this._loadingTimeout = (0, async_1.disposableTimeout)(() => this._setState(1 /* State.Loading */), delay);
            }
        }
        showSuggestions(completionModel, selectionIndex, isFrozen, isAuto) {
            var _a, _b;
            this._contentWidget.setPosition(this.editor.getPosition());
            (_a = this._loadingTimeout) === null || _a === void 0 ? void 0 : _a.dispose();
            (_b = this._currentSuggestionDetails) === null || _b === void 0 ? void 0 : _b.cancel();
            this._currentSuggestionDetails = undefined;
            if (this._completionModel !== completionModel) {
                this._completionModel = completionModel;
            }
            if (isFrozen && this._state !== 2 /* State.Empty */ && this._state !== 0 /* State.Hidden */) {
                this._setState(4 /* State.Frozen */);
                return;
            }
            const visibleCount = this._completionModel.items.length;
            const isEmpty = visibleCount === 0;
            this._ctxSuggestWidgetMultipleSuggestions.set(visibleCount > 1);
            if (isEmpty) {
                this._setState(isAuto ? 0 /* State.Hidden */ : 2 /* State.Empty */);
                this._completionModel = undefined;
                return;
            }
            this._focusedItem = undefined;
            this._list.splice(0, this._list.length, this._completionModel.items);
            this._setState(isFrozen ? 4 /* State.Frozen */ : 3 /* State.Open */);
            this._list.reveal(selectionIndex, 0);
            this._list.setFocus([selectionIndex]);
            this._layout(this.element.size);
            // Reset focus border
            this._details.widget.domNode.classList.remove('focused');
        }
        selectNextPage() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 5 /* State.Details */:
                    this._details.widget.pageDown();
                    return true;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusNextPage();
                    return true;
            }
        }
        selectNext() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusNext(1, true);
                    return true;
            }
        }
        selectLast() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 5 /* State.Details */:
                    this._details.widget.scrollBottom();
                    return true;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusLast();
                    return true;
            }
        }
        selectPreviousPage() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 5 /* State.Details */:
                    this._details.widget.pageUp();
                    return true;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusPreviousPage();
                    return true;
            }
        }
        selectPrevious() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusPrevious(1, true);
                    return false;
            }
        }
        selectFirst() {
            switch (this._state) {
                case 0 /* State.Hidden */:
                    return false;
                case 5 /* State.Details */:
                    this._details.widget.scrollTop();
                    return true;
                case 1 /* State.Loading */:
                    return !this._isAuto;
                default:
                    this._list.focusFirst();
                    return true;
            }
        }
        getFocusedItem() {
            if (this._state !== 0 /* State.Hidden */
                && this._state !== 2 /* State.Empty */
                && this._state !== 1 /* State.Loading */
                && this._completionModel) {
                return {
                    item: this._list.getFocusedElements()[0],
                    index: this._list.getFocus()[0],
                    model: this._completionModel
                };
            }
            return undefined;
        }
        toggleDetailsFocus() {
            if (this._state === 5 /* State.Details */) {
                this._setState(3 /* State.Open */);
                this._details.widget.domNode.classList.remove('focused');
            }
            else if (this._state === 3 /* State.Open */ && this._isDetailsVisible()) {
                this._setState(5 /* State.Details */);
                this._details.widget.domNode.classList.add('focused');
            }
        }
        toggleDetails() {
            if (this._isDetailsVisible()) {
                // hide details widget
                this._ctxSuggestWidgetDetailsVisible.set(false);
                this._setDetailsVisible(false);
                this._details.hide();
                this.element.domNode.classList.remove('shows-details');
            }
            else if (((0, suggestWidgetDetails_1.canExpandCompletionItem)(this._list.getFocusedElements()[0]) || this._explainMode) && (this._state === 3 /* State.Open */ || this._state === 5 /* State.Details */ || this._state === 4 /* State.Frozen */)) {
                // show details widget (iff possible)
                this._ctxSuggestWidgetDetailsVisible.set(true);
                this._setDetailsVisible(true);
                this.showDetails(false);
            }
        }
        showDetails(loading) {
            this._details.show();
            if (loading) {
                this._details.widget.renderLoading();
            }
            else {
                this._details.widget.renderItem(this._list.getFocusedElements()[0], this._explainMode);
            }
            this._positionDetails();
            this.editor.focus();
            this.element.domNode.classList.add('shows-details');
        }
        toggleExplainMode() {
            if (this._list.getFocusedElements()[0]) {
                this._explainMode = !this._explainMode;
                if (!this._isDetailsVisible()) {
                    this.toggleDetails();
                }
                else {
                    this.showDetails(false);
                }
            }
        }
        resetPersistedSize() {
            this._persistedSize.reset();
        }
        hideWidget() {
            var _a;
            (_a = this._loadingTimeout) === null || _a === void 0 ? void 0 : _a.dispose();
            this._setState(0 /* State.Hidden */);
            this._onDidHide.fire(this);
            this.element.clearSashHoverState();
            // ensure that a reasonable widget height is persisted so that
            // accidential "resize-to-single-items" cases aren't happening
            const dim = this._persistedSize.restore();
            const minPersistedHeight = Math.ceil(this.getLayoutInfo().itemHeight * 4.3);
            if (dim && dim.height < minPersistedHeight) {
                this._persistedSize.store(dim.with(undefined, minPersistedHeight));
            }
        }
        isFrozen() {
            return this._state === 4 /* State.Frozen */;
        }
        _afterRender(position) {
            if (position === null) {
                if (this._isDetailsVisible()) {
                    this._details.hide(); //todo@jrieken soft-hide
                }
                return;
            }
            if (this._state === 2 /* State.Empty */ || this._state === 1 /* State.Loading */) {
                // no special positioning when widget isn't showing list
                return;
            }
            if (this._isDetailsVisible()) {
                this._details.show();
            }
            this._positionDetails();
        }
        _layout(size) {
            var _a, _b, _c;
            if (!this.editor.hasModel()) {
                return;
            }
            if (!this.editor.getDomNode()) {
                // happens when running tests
                return;
            }
            const bodyBox = dom.getClientArea(document.body);
            const info = this.getLayoutInfo();
            if (!size) {
                size = info.defaultSize;
            }
            let height = size.height;
            let width = size.width;
            // status bar
            this._status.element.style.lineHeight = `${info.itemHeight}px`;
            if (this._state === 2 /* State.Empty */ || this._state === 1 /* State.Loading */) {
                // showing a message only
                height = info.itemHeight + info.borderHeight;
                width = info.defaultSize.width / 2;
                this.element.enableSashes(false, false, false, false);
                this.element.minSize = this.element.maxSize = new dom.Dimension(width, height);
                this._contentWidget.setPreference(2 /* ContentWidgetPositionPreference.BELOW */);
            }
            else {
                // showing items
                // width math
                const maxWidth = bodyBox.width - info.borderHeight - 2 * info.horizontalPadding;
                if (width > maxWidth) {
                    width = maxWidth;
                }
                const preferredWidth = this._completionModel ? this._completionModel.stats.pLabelLen * info.typicalHalfwidthCharacterWidth : width;
                // height math
                const fullHeight = info.statusBarHeight + this._list.contentHeight + info.borderHeight;
                const minHeight = info.itemHeight + info.statusBarHeight;
                const editorBox = dom.getDomNodePagePosition(this.editor.getDomNode());
                const cursorBox = this.editor.getScrolledVisiblePosition(this.editor.getPosition());
                const cursorBottom = editorBox.top + cursorBox.top + cursorBox.height;
                const maxHeightBelow = Math.min(bodyBox.height - cursorBottom - info.verticalPadding, fullHeight);
                const availableSpaceAbove = editorBox.top + cursorBox.top - info.verticalPadding;
                const maxHeightAbove = Math.min(availableSpaceAbove, fullHeight);
                let maxHeight = Math.min(Math.max(maxHeightAbove, maxHeightBelow) + info.borderHeight, fullHeight);
                if (height === ((_a = this._cappedHeight) === null || _a === void 0 ? void 0 : _a.capped)) {
                    // Restore the old (wanted) height when the current
                    // height is capped to fit
                    height = this._cappedHeight.wanted;
                }
                if (height < minHeight) {
                    height = minHeight;
                }
                if (height > maxHeight) {
                    height = maxHeight;
                }
                const forceRenderingAboveRequiredSpace = 150;
                if (height > maxHeightBelow || (this._forceRenderingAbove && availableSpaceAbove > forceRenderingAboveRequiredSpace)) {
                    this._contentWidget.setPreference(1 /* ContentWidgetPositionPreference.ABOVE */);
                    this.element.enableSashes(true, true, false, false);
                    maxHeight = maxHeightAbove;
                }
                else {
                    this._contentWidget.setPreference(2 /* ContentWidgetPositionPreference.BELOW */);
                    this.element.enableSashes(false, true, true, false);
                    maxHeight = maxHeightBelow;
                }
                this.element.preferredSize = new dom.Dimension(preferredWidth, info.defaultSize.height);
                this.element.maxSize = new dom.Dimension(maxWidth, maxHeight);
                this.element.minSize = new dom.Dimension(220, minHeight);
                // Know when the height was capped to fit and remember
                // the wanted height for later. This is required when going
                // left to widen suggestions.
                this._cappedHeight = height === fullHeight
                    ? { wanted: (_c = (_b = this._cappedHeight) === null || _b === void 0 ? void 0 : _b.wanted) !== null && _c !== void 0 ? _c : size.height, capped: height }
                    : undefined;
            }
            this._resize(width, height);
        }
        _resize(width, height) {
            const { width: maxWidth, height: maxHeight } = this.element.maxSize;
            width = Math.min(maxWidth, width);
            height = Math.min(maxHeight, height);
            const { statusBarHeight } = this.getLayoutInfo();
            this._list.layout(height - statusBarHeight, width);
            this._listElement.style.height = `${height - statusBarHeight}px`;
            this.element.layout(height, width);
            this._contentWidget.layout();
            this._positionDetails();
        }
        _positionDetails() {
            var _a;
            if (this._isDetailsVisible()) {
                this._details.placeAtAnchor(this.element.domNode, ((_a = this._contentWidget.getPosition()) === null || _a === void 0 ? void 0 : _a.preference[0]) === 2 /* ContentWidgetPositionPreference.BELOW */);
            }
        }
        getLayoutInfo() {
            const fontInfo = this.editor.getOption(44 /* EditorOption.fontInfo */);
            const itemHeight = (0, numbers_1.clamp)(this.editor.getOption(108 /* EditorOption.suggestLineHeight */) || fontInfo.lineHeight, 8, 1000);
            const statusBarHeight = !this.editor.getOption(106 /* EditorOption.suggest */).showStatusBar || this._state === 2 /* State.Empty */ || this._state === 1 /* State.Loading */ ? 0 : itemHeight;
            const borderWidth = this._details.widget.borderWidth;
            const borderHeight = 2 * borderWidth;
            return {
                itemHeight,
                statusBarHeight,
                borderWidth,
                borderHeight,
                typicalHalfwidthCharacterWidth: fontInfo.typicalHalfwidthCharacterWidth,
                verticalPadding: 22,
                horizontalPadding: 14,
                defaultSize: new dom.Dimension(430, statusBarHeight + 12 * itemHeight + borderHeight)
            };
        }
        _isDetailsVisible() {
            return this._storageService.getBoolean('expandSuggestionDocs', 0 /* StorageScope.GLOBAL */, false);
        }
        _setDetailsVisible(value) {
            this._storageService.store('expandSuggestionDocs', value, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
        }
        forceRenderingAbove() {
            if (!this._forceRenderingAbove) {
                this._forceRenderingAbove = true;
                this._layout(this._persistedSize.restore());
            }
        }
        stopForceRenderingAbove() {
            this._forceRenderingAbove = false;
        }
    };
    SuggestWidget.LOADING_MESSAGE = nls.localize('suggestWidget.loading', "Loading...");
    SuggestWidget.NO_SUGGESTIONS_MESSAGE = nls.localize('suggestWidget.noSuggestions', "No suggestions.");
    SuggestWidget = __decorate([
        __param(1, storage_1.IStorageService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, themeService_1.IThemeService),
        __param(4, instantiation_1.IInstantiationService)
    ], SuggestWidget);
    exports.SuggestWidget = SuggestWidget;
    class SuggestContentWidget {
        constructor(_widget, _editor) {
            this._widget = _widget;
            this._editor = _editor;
            this.allowEditorOverflow = true;
            this.suppressMouseDown = false;
            this._preferenceLocked = false;
            this._added = false;
            this._hidden = false;
        }
        dispose() {
            if (this._added) {
                this._added = false;
                this._editor.removeContentWidget(this);
            }
        }
        getId() {
            return 'editor.widget.suggestWidget';
        }
        getDomNode() {
            return this._widget.element.domNode;
        }
        show() {
            this._hidden = false;
            if (!this._added) {
                this._added = true;
                this._editor.addContentWidget(this);
            }
        }
        hide() {
            if (!this._hidden) {
                this._hidden = true;
                this.layout();
            }
        }
        layout() {
            this._editor.layoutContentWidget(this);
        }
        getPosition() {
            if (this._hidden || !this._position || !this._preference) {
                return null;
            }
            return {
                position: this._position,
                preference: [this._preference]
            };
        }
        beforeRender() {
            const { height, width } = this._widget.element.size;
            const { borderWidth, horizontalPadding } = this._widget.getLayoutInfo();
            return new dom.Dimension(width + 2 * borderWidth + horizontalPadding, height + 2 * borderWidth);
        }
        afterRender(position) {
            this._widget._afterRender(position);
        }
        setPreference(preference) {
            if (!this._preferenceLocked) {
                this._preference = preference;
            }
        }
        lockPreference() {
            this._preferenceLocked = true;
        }
        unlockPreference() {
            this._preferenceLocked = false;
        }
        setPosition(position) {
            this._position = position;
        }
    }
    exports.SuggestContentWidget = SuggestContentWidget;
});
//# sourceMappingURL=suggestWidget.js.map