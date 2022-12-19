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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/widget", "vs/base/common/event", "vs/base/common/objects", "vs/base/common/platform", "vs/base/common/uri", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/common/core/editOperation", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/editor/common/services/model", "vs/editor/contrib/contextmenu/browser/contextmenu", "vs/editor/contrib/snippet/browser/snippetController2", "vs/editor/contrib/suggest/browser/suggestController", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/workbench/contrib/codeEditor/browser/menuPreventer", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/workbench/contrib/codeEditor/browser/selectionClipboard", "vs/editor/browser/editorExtensions", "vs/workbench/browser/style", "vs/base/common/history", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/instantiation/common/serviceCollection", "vs/editor/common/services/languageFeatures", "vs/css!./suggestEnabledInput"], function (require, exports, dom_1, widget_1, event_1, objects_1, platform_1, uri_1, codeEditorWidget_1, editOperation_1, position_1, range_1, model_1, contextmenu_1, snippetController2_1, suggestController_1, contextkey_1, instantiation_1, colorRegistry_1, styler_1, themeService_1, menuPreventer_1, simpleEditorOptions_1, selectionClipboard_1, editorExtensions_1, style_1, history_1, contextScopedHistoryWidget_1, serviceCollection_1, languageFeatures_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextScopedSuggestEnabledInputWithHistory = exports.SuggestEnabledInputWithHistory = exports.SuggestEnabledInput = exports.attachSuggestEnabledInputBoxStyler = void 0;
    function attachSuggestEnabledInputBoxStyler(widget, themeService, style) {
        return (0, styler_1.attachStyler)(themeService, {
            inputBackground: (style === null || style === void 0 ? void 0 : style.inputBackground) || colorRegistry_1.inputBackground,
            inputForeground: (style === null || style === void 0 ? void 0 : style.inputForeground) || colorRegistry_1.inputForeground,
            inputBorder: (style === null || style === void 0 ? void 0 : style.inputBorder) || colorRegistry_1.inputBorder,
            inputPlaceholderForeground: (style === null || style === void 0 ? void 0 : style.inputPlaceholderForeground) || colorRegistry_1.inputPlaceholderForeground,
        }, widget);
    }
    exports.attachSuggestEnabledInputBoxStyler = attachSuggestEnabledInputBoxStyler;
    let SuggestEnabledInput = class SuggestEnabledInput extends widget_1.Widget {
        constructor(id, parent, suggestionProvider, ariaLabel, resourceHandle, options, defaultInstantiationService, modelService, contextKeyService, languageFeaturesService) {
            super();
            this._onShouldFocusResults = new event_1.Emitter();
            this.onShouldFocusResults = this._onShouldFocusResults.event;
            this._onEnter = new event_1.Emitter();
            this.onEnter = this._onEnter.event;
            this._onInputDidChange = new event_1.Emitter();
            this.onInputDidChange = this._onInputDidChange.event;
            this.stylingContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.suggest-input-container'));
            this.placeholderText = (0, dom_1.append)(this.stylingContainer, (0, dom_1.$)('.suggest-input-placeholder', undefined, options.placeholderText || ''));
            const editorOptions = (0, objects_1.mixin)((0, simpleEditorOptions_1.getSimpleEditorOptions)(), getSuggestEnabledInputOptions(ariaLabel));
            const scopedContextKeyService = this.getScopedContextKeyService(contextKeyService, parent);
            const instantiationService = scopedContextKeyService
                ? defaultInstantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService]))
                : defaultInstantiationService;
            this.inputWidget = instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.stylingContainer, editorOptions, {
                contributions: editorExtensions_1.EditorExtensionsRegistry.getSomeEditorContributions([
                    suggestController_1.SuggestController.ID,
                    snippetController2_1.SnippetController2.ID,
                    contextmenu_1.ContextMenuController.ID,
                    menuPreventer_1.MenuPreventer.ID,
                    selectionClipboard_1.SelectionClipboardContributionID,
                ]),
                isSimpleWidget: true,
            });
            this._register(this.inputWidget);
            let scopeHandle = uri_1.URI.parse(resourceHandle);
            this.inputModel = modelService.createModel('', null, scopeHandle, true);
            this._register(this.inputModel);
            this.inputWidget.setModel(this.inputModel);
            this._register(this.inputWidget.onDidPaste(() => this.setValue(this.getValue()))); // setter cleanses
            this._register((this.inputWidget.onDidFocusEditorText(() => {
                if (options.focusContextKey) {
                    options.focusContextKey.set(true);
                }
                this.stylingContainer.classList.add('synthetic-focus');
            })));
            this._register((this.inputWidget.onDidBlurEditorText(() => {
                if (options.focusContextKey) {
                    options.focusContextKey.set(false);
                }
                this.stylingContainer.classList.remove('synthetic-focus');
            })));
            const onKeyDownMonaco = event_1.Event.chain(this.inputWidget.onKeyDown);
            this._register(onKeyDownMonaco.filter(e => e.keyCode === 3 /* KeyCode.Enter */).on(e => { e.preventDefault(); this._onEnter.fire(); }, this));
            this._register(onKeyDownMonaco.filter(e => e.keyCode === 18 /* KeyCode.DownArrow */ && (platform_1.isMacintosh ? e.metaKey : e.ctrlKey)).on(() => this._onShouldFocusResults.fire(), this));
            let preexistingContent = this.getValue();
            const inputWidgetModel = this.inputWidget.getModel();
            if (inputWidgetModel) {
                this._register(inputWidgetModel.onDidChangeContent(() => {
                    let content = this.getValue();
                    this.placeholderText.style.visibility = content ? 'hidden' : 'visible';
                    if (preexistingContent.trim() === content.trim()) {
                        return;
                    }
                    this._onInputDidChange.fire(undefined);
                    preexistingContent = content;
                }));
            }
            let validatedSuggestProvider = {
                provideResults: suggestionProvider.provideResults,
                sortKey: suggestionProvider.sortKey || (a => a),
                triggerCharacters: suggestionProvider.triggerCharacters || []
            };
            this.setValue(options.value || '');
            this._register(languageFeaturesService.completionProvider.register({ scheme: scopeHandle.scheme, pattern: '**/' + scopeHandle.path, hasAccessToAllModels: true }, {
                triggerCharacters: validatedSuggestProvider.triggerCharacters,
                provideCompletionItems: (model, position, _context) => {
                    let query = model.getValue();
                    const zeroIndexedColumn = position.column - 1;
                    let zeroIndexedWordStart = query.lastIndexOf(' ', zeroIndexedColumn - 1) + 1;
                    let alreadyTypedCount = zeroIndexedColumn - zeroIndexedWordStart;
                    // dont show suggestions if the user has typed something, but hasn't used the trigger character
                    if (alreadyTypedCount > 0 && validatedSuggestProvider.triggerCharacters.indexOf(query[zeroIndexedWordStart]) === -1) {
                        return { suggestions: [] };
                    }
                    return {
                        suggestions: suggestionProvider.provideResults(query).map((result) => {
                            let label;
                            let rest;
                            if (typeof result === 'string') {
                                label = result;
                            }
                            else {
                                label = result.label;
                                rest = result;
                            }
                            return Object.assign({ label, insertText: label, range: range_1.Range.fromPositions(position.delta(0, -alreadyTypedCount), position), sortText: validatedSuggestProvider.sortKey(label), kind: 17 /* languages.CompletionItemKind.Keyword */ }, rest);
                        })
                    };
                }
            }));
        }
        getScopedContextKeyService(_contextKeyService, _parent) {
            return undefined;
        }
        updateAriaLabel(label) {
            this.inputWidget.updateOptions({ ariaLabel: label });
        }
        get onFocus() { return this.inputWidget.onDidFocusEditorText; }
        setValue(val) {
            val = val.replace(/\s/g, ' ');
            const fullRange = this.inputModel.getFullModelRange();
            this.inputWidget.executeEdits('suggestEnabledInput.setValue', [editOperation_1.EditOperation.replace(fullRange, val)]);
            this.inputWidget.setScrollTop(0);
            this.inputWidget.setPosition(new position_1.Position(1, val.length + 1));
        }
        getValue() {
            return this.inputWidget.getValue();
        }
        style(colors) {
            this.stylingContainer.style.backgroundColor = colors.inputBackground ? colors.inputBackground.toString() : '';
            this.stylingContainer.style.color = colors.inputForeground ? colors.inputForeground.toString() : '';
            this.placeholderText.style.color = colors.inputPlaceholderForeground ? colors.inputPlaceholderForeground.toString() : '';
            this.stylingContainer.style.borderWidth = '1px';
            this.stylingContainer.style.borderStyle = 'solid';
            this.stylingContainer.style.borderColor = colors.inputBorder ?
                colors.inputBorder.toString() :
                'transparent';
            const cursor = this.stylingContainer.getElementsByClassName('cursor')[0];
            if (cursor) {
                cursor.style.backgroundColor = colors.inputForeground ? colors.inputForeground.toString() : '';
            }
        }
        focus(selectAll) {
            this.inputWidget.focus();
            if (selectAll && this.inputWidget.getValue()) {
                this.selectAll();
            }
        }
        onHide() {
            this.inputWidget.onHide();
        }
        layout(dimension) {
            this.inputWidget.layout(dimension);
            this.placeholderText.style.width = `${dimension.width - 2}px`;
        }
        selectAll() {
            this.inputWidget.setSelection(new range_1.Range(1, 1, 1, this.getValue().length + 1));
        }
    };
    SuggestEnabledInput = __decorate([
        __param(6, instantiation_1.IInstantiationService),
        __param(7, model_1.IModelService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, languageFeatures_1.ILanguageFeaturesService)
    ], SuggestEnabledInput);
    exports.SuggestEnabledInput = SuggestEnabledInput;
    let SuggestEnabledInputWithHistory = class SuggestEnabledInputWithHistory extends SuggestEnabledInput {
        constructor({ id, parent, ariaLabel, suggestionProvider, resourceHandle, suggestOptions, history }, instantiationService, modelService, contextKeyService, languageFeaturesService) {
            super(id, parent, suggestionProvider, ariaLabel, resourceHandle, suggestOptions, instantiationService, modelService, contextKeyService, languageFeaturesService);
            this.history = new history_1.HistoryNavigator(history, 100);
        }
        addToHistory() {
            const value = this.getValue();
            if (value && value !== this.getCurrentValue()) {
                this.history.add(value);
            }
        }
        getHistory() {
            return this.history.getHistory();
        }
        showNextValue() {
            if (!this.history.has(this.getValue())) {
                this.addToHistory();
            }
            let next = this.getNextValue();
            if (next) {
                next = next === this.getValue() ? this.getNextValue() : next;
            }
            if (next) {
                this.setValue(next);
            }
        }
        showPreviousValue() {
            if (!this.history.has(this.getValue())) {
                this.addToHistory();
            }
            let previous = this.getPreviousValue();
            if (previous) {
                previous = previous === this.getValue() ? this.getPreviousValue() : previous;
            }
            if (previous) {
                this.setValue(previous);
                this.inputWidget.setPosition({ lineNumber: 0, column: 0 });
            }
        }
        clearHistory() {
            this.history.clear();
        }
        getCurrentValue() {
            let currentValue = this.history.current();
            if (!currentValue) {
                currentValue = this.history.last();
                this.history.next();
            }
            return currentValue;
        }
        getPreviousValue() {
            return this.history.previous() || this.history.first();
        }
        getNextValue() {
            return this.history.next() || this.history.last();
        }
    };
    SuggestEnabledInputWithHistory = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, model_1.IModelService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, languageFeatures_1.ILanguageFeaturesService)
    ], SuggestEnabledInputWithHistory);
    exports.SuggestEnabledInputWithHistory = SuggestEnabledInputWithHistory;
    let ContextScopedSuggestEnabledInputWithHistory = class ContextScopedSuggestEnabledInputWithHistory extends SuggestEnabledInputWithHistory {
        constructor(options, instantiationService, modelService, contextKeyService, languageFeaturesService) {
            super(options, instantiationService, modelService, contextKeyService, languageFeaturesService);
            const { historyNavigationBackwardsEnablement, historyNavigationForwardsEnablement } = this.historyContext;
            this._register(this.inputWidget.onDidChangeCursorPosition(({ position }) => {
                const viewModel = this.inputWidget._getViewModel();
                const lastLineNumber = viewModel.getLineCount();
                const lastLineCol = viewModel.getLineContent(lastLineNumber).length + 1;
                const viewPosition = viewModel.coordinatesConverter.convertModelPositionToViewPosition(position);
                historyNavigationBackwardsEnablement.set(viewPosition.lineNumber === 1 && viewPosition.column === 1);
                historyNavigationForwardsEnablement.set(viewPosition.lineNumber === lastLineNumber && viewPosition.column === lastLineCol);
            }));
        }
        getScopedContextKeyService(contextKeyService, parent) {
            const scoped = this.historyContext = (0, contextScopedHistoryWidget_1.createAndBindHistoryNavigationWidgetScopedContextKeyService)(contextKeyService, { target: parent, historyNavigator: this });
            this._register(scoped.scopedContextKeyService);
            return scoped.scopedContextKeyService;
        }
    };
    ContextScopedSuggestEnabledInputWithHistory = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, model_1.IModelService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, languageFeatures_1.ILanguageFeaturesService)
    ], ContextScopedSuggestEnabledInputWithHistory);
    exports.ContextScopedSuggestEnabledInputWithHistory = ContextScopedSuggestEnabledInputWithHistory;
    // Override styles in selections.ts
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        let selectionColor = theme.getColor(colorRegistry_1.selectionBackground);
        if (selectionColor) {
            selectionColor = selectionColor.transparent(0.4);
        }
        else {
            selectionColor = theme.getColor(colorRegistry_1.editorSelectionBackground);
        }
        if (selectionColor) {
            collector.addRule(`.suggest-input-container .monaco-editor .focused .selected-text { background-color: ${selectionColor}; }`);
        }
        // Override inactive selection bg
        const inputBackgroundColor = theme.getColor(colorRegistry_1.inputBackground);
        if (inputBackgroundColor) {
            collector.addRule(`.suggest-input-container .monaco-editor .selected-text { background-color: ${inputBackgroundColor.transparent(0.4)}; }`);
        }
        // Override selected fg
        const inputForegroundColor = theme.getColor(colorRegistry_1.inputForeground);
        if (inputForegroundColor) {
            collector.addRule(`.suggest-input-container .monaco-editor .view-line span.inline-selected-text { color: ${inputForegroundColor}; }`);
        }
        const backgroundColor = theme.getColor(colorRegistry_1.inputBackground);
        if (backgroundColor) {
            collector.addRule(`.suggest-input-container .monaco-editor-background { background-color: ${backgroundColor}; } `);
        }
    });
    function getSuggestEnabledInputOptions(ariaLabel) {
        return {
            fontSize: 13,
            lineHeight: 20,
            wordWrap: 'off',
            scrollbar: { vertical: 'hidden', },
            roundedSelection: false,
            guides: {
                indentation: false
            },
            cursorWidth: 1,
            fontFamily: style_1.DEFAULT_FONT_FAMILY,
            ariaLabel: ariaLabel || '',
            snippetSuggestions: 'none',
            suggest: { filterGraceful: false, showIcons: false },
            autoClosingBrackets: 'never'
        };
    }
});
//# sourceMappingURL=suggestEnabledInput.js.map