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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/findinput/findInput", "vs/base/browser/ui/progressbar/progressbar", "vs/base/browser/ui/widget", "vs/base/common/async", "vs/editor/contrib/find/browser/findState", "vs/editor/contrib/find/browser/findWidget", "vs/nls", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/editor/contrib/find/browser/replacePattern", "vs/base/common/codicons", "vs/platform/configuration/common/configuration", "vs/base/common/actions", "vs/platform/instantiation/common/instantiation", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/contrib/extensions/browser/extensionsIcons", "vs/workbench/contrib/notebook/browser/contrib/find/findFilters", "vs/base/common/platform", "vs/css!./notebookFindReplaceWidget"], function (require, exports, dom, findInput_1, progressbar_1, widget_1, async_1, findState_1, findWidget_1, nls, contextScopedHistoryWidget_1, contextkey_1, contextView_1, colorRegistry_1, iconRegistry_1, styler_1, themeService_1, replacePattern_1, codicons_1, configuration_1, actions_1, instantiation_1, actions_2, menuEntryActionViewItem_1, dropdownActionViewItem_1, actionbar_1, extensionsIcons_1, findFilters_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleFindReplaceWidget = exports.findFilterButton = void 0;
    const NLS_FIND_INPUT_LABEL = nls.localize('label.find', "Find");
    const NLS_FIND_INPUT_PLACEHOLDER = nls.localize('placeholder.find', "Find");
    const NLS_PREVIOUS_MATCH_BTN_LABEL = nls.localize('label.previousMatchButton', "Previous Match");
    // const NLS_FILTER_BTN_LABEL = nls.localize('label.findFilterButton', "Search in View");
    const NLS_NEXT_MATCH_BTN_LABEL = nls.localize('label.nextMatchButton', "Next Match");
    const NLS_CLOSE_BTN_LABEL = nls.localize('label.closeButton', "Close");
    const NLS_TOGGLE_REPLACE_MODE_BTN_LABEL = nls.localize('label.toggleReplaceButton', "Toggle Replace");
    const NLS_REPLACE_INPUT_LABEL = nls.localize('label.replace', "Replace");
    const NLS_REPLACE_INPUT_PLACEHOLDER = nls.localize('placeholder.replace', "Replace");
    const NLS_REPLACE_BTN_LABEL = nls.localize('label.replaceButton', "Replace");
    const NLS_REPLACE_ALL_BTN_LABEL = nls.localize('label.replaceAllButton', "Replace All");
    exports.findFilterButton = (0, iconRegistry_1.registerIcon)('find-filter', codicons_1.Codicon.filter, nls.localize('findFilterIcon', 'Icon for Find Filter in find widget.'));
    const NOTEBOOK_FIND_FILTERS = nls.localize('notebook.find.filter.filterAction', "Find Filters");
    const NOTEBOOK_FIND_IN_MARKUP_INPUT = nls.localize('notebook.find.filter.findInMarkupInput', "Markdown Source");
    const NOTEBOOK_FIND_IN_MARKUP_PREVIEW = nls.localize('notebook.find.filter.findInMarkupPreview', "Rendered Markdown");
    const NOTEBOOK_FIND_IN_CODE_INPUT = nls.localize('notebook.find.filter.findInCodeInput', "Code Cell Source");
    const NOTEBOOK_FIND_IN_CODE_OUTPUT = nls.localize('notebook.find.filter.findInCodeOutput', "Cell Output");
    let NotebookFindFilterActionViewItem = class NotebookFindFilterActionViewItem extends dropdownActionViewItem_1.DropdownMenuActionViewItem {
        constructor(filters, action, actionRunner, contextMenuService) {
            super(action, { getActions: () => this.getActions() }, contextMenuService, {
                actionRunner,
                classNames: action.class,
                anchorAlignmentProvider: () => 1 /* AnchorAlignment.RIGHT */
            });
            this.filters = filters;
        }
        render(container) {
            super.render(container);
            this.updateChecked();
        }
        getActions() {
            const markdownInput = {
                checked: this.filters.markupInput,
                class: undefined,
                enabled: !this.filters.markupPreview,
                id: 'findInMarkdownInput',
                label: NOTEBOOK_FIND_IN_MARKUP_INPUT,
                run: async () => {
                    this.filters.markupInput = !this.filters.markupInput;
                },
                tooltip: '',
                dispose: () => null
            };
            const markdownPreview = {
                checked: this.filters.markupPreview,
                class: undefined,
                enabled: true,
                id: 'findInMarkdownInput',
                label: NOTEBOOK_FIND_IN_MARKUP_PREVIEW,
                run: async () => {
                    this.filters.markupPreview = !this.filters.markupPreview;
                },
                tooltip: '',
                dispose: () => null
            };
            const codeInput = {
                checked: this.filters.codeInput,
                class: undefined,
                enabled: true,
                id: 'findInCodeInput',
                label: NOTEBOOK_FIND_IN_CODE_INPUT,
                run: async () => {
                    this.filters.codeInput = !this.filters.codeInput;
                },
                tooltip: '',
                dispose: () => null
            };
            const codeOutput = {
                checked: this.filters.codeOutput,
                class: undefined,
                enabled: true,
                id: 'findInCodeOutput',
                label: NOTEBOOK_FIND_IN_CODE_OUTPUT,
                run: async () => {
                    this.filters.codeOutput = !this.filters.codeOutput;
                },
                tooltip: '',
                dispose: () => null
            };
            if (platform_1.isSafari) {
                return [
                    markdownInput,
                    codeInput
                ];
            }
            else {
                return [
                    markdownInput,
                    markdownPreview,
                    new actions_1.Separator(),
                    codeInput,
                    codeOutput,
                ];
            }
        }
        updateChecked() {
            this.element.classList.toggle('checked', this._action.checked);
        }
    };
    NotebookFindFilterActionViewItem = __decorate([
        __param(3, contextView_1.IContextMenuService)
    ], NotebookFindFilterActionViewItem);
    class NotebookFindInput extends findInput_1.FindInput {
        constructor(filters, contextKeyService, contextMenuService, instantiationService, parent, contextViewProvider, showOptionButtons, options) {
            super(parent, contextViewProvider, showOptionButtons, options);
            this.filters = filters;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this._actionbar = null;
            this._filterChecked = false;
            this._register((0, contextScopedHistoryWidget_1.createAndBindHistoryNavigationWidgetScopedContextKeyService)(contextKeyService, { target: this.inputBox.element, historyNavigator: this.inputBox }).scopedContextKeyService);
            this._filtersAction = new actions_1.Action('notebookFindFilterAction', NOTEBOOK_FIND_FILTERS, 'notebook-filters ' + themeService_1.ThemeIcon.asClassName(extensionsIcons_1.filterIcon));
            this._filtersAction.checked = false;
            this._filterButtonContainer = dom.$('.find-filter-button');
            this.controls.appendChild(this._filterButtonContainer);
            this.createFilters(this._filterButtonContainer);
            this._register(this.filters.onDidChange(() => {
                if (this.filters.codeInput !== true || this.filters.codeOutput !== false || this.filters.markupInput !== true || this.filters.markupPreview !== false) {
                    this._filtersAction.checked = true;
                }
                else {
                    this._filtersAction.checked = false;
                }
            }));
            this.inputBox.paddingRight = this.caseSensitive.width() + this.wholeWords.width() + this.regex.width() + this.getFilterWidth();
        }
        getFilterWidth() {
            return 2 /*margin left*/ + 2 /*border*/ + 2 /*padding*/ + 16 /* icon width */;
        }
        createFilters(container) {
            this._actionbar = this._register(new actionbar_1.ActionBar(container, {
                actionViewItemProvider: action => {
                    if (action.id === this._filtersAction.id) {
                        return this.instantiationService.createInstance(NotebookFindFilterActionViewItem, this.filters, action, new actions_1.ActionRunner());
                    }
                    return undefined;
                }
            }));
            this._actionbar.push(this._filtersAction, { icon: true, label: false });
        }
        setEnabled(enabled) {
            super.setEnabled(enabled);
            if (enabled && !this._filterChecked) {
                this.regex.enable();
            }
            else {
                this.regex.disable();
            }
        }
        updateFilterState(changed) {
            this._filterChecked = changed;
            if (this._filterChecked) {
                this.regex.disable();
                this.regex.domNode.tabIndex = -1;
                this.regex.domNode.classList.toggle('disabled', true);
            }
            else {
                this.regex.enable();
                this.regex.domNode.tabIndex = 0;
                this.regex.domNode.classList.toggle('disabled', false);
            }
            this.applyStyles();
        }
        applyStyles() {
            super.applyStyles();
            this._filterButtonContainer.style.borderColor = this._filterChecked && this.inputActiveOptionBorder ? this.inputActiveOptionBorder.toString() : '';
            this._filterButtonContainer.style.color = this._filterChecked && this.inputActiveOptionForeground ? this.inputActiveOptionForeground.toString() : 'inherit';
            this._filterButtonContainer.style.backgroundColor = this._filterChecked && this.inputActiveOptionBackground ? this.inputActiveOptionBackground.toString() : '';
        }
        getCellToolbarActions(menu) {
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result, g => /^inline/.test(g));
            return result;
        }
    }
    let SimpleFindReplaceWidget = class SimpleFindReplaceWidget extends widget_1.Widget {
        constructor(_contextViewService, contextKeyService, _themeService, _configurationService, menuService, contextMenuService, instantiationService, _state = new findState_1.FindReplaceState()) {
            super();
            this._contextViewService = _contextViewService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this._state = _state;
            this._isVisible = false;
            this._isReplaceVisible = false;
            this.foundMatch = false;
            this._filters = new findFilters_1.NotebookFindFilters(true, false, true, false);
            this._state.change({ filters: this._filters }, false);
            this._filters.onDidChange(() => {
                this._state.change({ filters: this._filters }, false);
            });
            this._domNode = document.createElement('div');
            this._domNode.classList.add('simple-fr-find-part-wrapper');
            this._register(this._state.onFindReplaceStateChange((e) => this._onStateChanged(e)));
            this._scopedContextKeyService = contextKeyService.createScoped(this._domNode);
            let progressContainer = dom.$('.find-replace-progress');
            this._progressBar = new progressbar_1.ProgressBar(progressContainer);
            this._register((0, styler_1.attachProgressBarStyler)(this._progressBar, this._themeService));
            this._domNode.appendChild(progressContainer);
            // Toggle replace button
            this._toggleReplaceBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_TOGGLE_REPLACE_MODE_BTN_LABEL,
                className: 'codicon toggle left',
                onTrigger: () => {
                    this._isReplaceVisible = !this._isReplaceVisible;
                    this._state.change({ isReplaceRevealed: this._isReplaceVisible }, false);
                    if (this._isReplaceVisible) {
                        this._innerReplaceDomNode.style.display = 'flex';
                    }
                    else {
                        this._innerReplaceDomNode.style.display = 'none';
                    }
                }
            }));
            this._toggleReplaceBtn.setExpanded(this._isReplaceVisible);
            this._domNode.appendChild(this._toggleReplaceBtn.domNode);
            this._innerFindDomNode = document.createElement('div');
            this._innerFindDomNode.classList.add('simple-fr-find-part');
            this._findInput = this._register(new NotebookFindInput(this._filters, this._scopedContextKeyService, this.contextMenuService, this.instantiationService, null, this._contextViewService, true, {
                label: NLS_FIND_INPUT_LABEL,
                placeholder: NLS_FIND_INPUT_PLACEHOLDER,
                validation: (value) => {
                    if (value.length === 0 || !this._findInput.getRegex()) {
                        return null;
                    }
                    try {
                        new RegExp(value);
                        return null;
                    }
                    catch (e) {
                        this.foundMatch = false;
                        this.updateButtons(this.foundMatch);
                        return { content: e.message };
                    }
                }
            }));
            // Find History with update delayer
            this._updateHistoryDelayer = new async_1.Delayer(500);
            this.oninput(this._findInput.domNode, (e) => {
                this.foundMatch = this.onInputChanged();
                this.updateButtons(this.foundMatch);
                this._delayedUpdateHistory();
            });
            this._register(this._findInput.inputBox.onDidChange(() => {
                this._state.change({ searchString: this._findInput.getValue() }, true);
            }));
            this._findInput.setRegex(!!this._state.isRegex);
            this._findInput.setCaseSensitive(!!this._state.matchCase);
            this._findInput.setWholeWords(!!this._state.wholeWord);
            this._register(this._findInput.onDidOptionChange(() => {
                this._state.change({
                    isRegex: this._findInput.getRegex(),
                    wholeWord: this._findInput.getWholeWords(),
                    matchCase: this._findInput.getCaseSensitive()
                }, true);
            }));
            this._register(this._state.onFindReplaceStateChange(() => {
                this._findInput.setRegex(this._state.isRegex);
                this._findInput.setWholeWords(this._state.wholeWord);
                this._findInput.setCaseSensitive(this._state.matchCase);
                this._replaceInput.setPreserveCase(this._state.preserveCase);
                this.findFirst();
            }));
            this._matchesCount = document.createElement('div');
            this._matchesCount.className = 'matchesCount';
            this._updateMatchesCount();
            this.prevBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_PREVIOUS_MATCH_BTN_LABEL,
                icon: findWidget_1.findPreviousMatchIcon,
                onTrigger: () => {
                    this.find(true);
                }
            }));
            this.nextBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_NEXT_MATCH_BTN_LABEL,
                icon: findWidget_1.findNextMatchIcon,
                onTrigger: () => {
                    this.find(false);
                }
            }));
            const closeBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_CLOSE_BTN_LABEL,
                icon: iconRegistry_1.widgetClose,
                onTrigger: () => {
                    this.hide();
                }
            }));
            this._innerFindDomNode.appendChild(this._findInput.domNode);
            this._innerFindDomNode.appendChild(this._matchesCount);
            this._innerFindDomNode.appendChild(this.prevBtn.domNode);
            this._innerFindDomNode.appendChild(this.nextBtn.domNode);
            this._innerFindDomNode.appendChild(closeBtn.domNode);
            // _domNode wraps _innerDomNode, ensuring that
            this._domNode.appendChild(this._innerFindDomNode);
            this.onkeyup(this._innerFindDomNode, e => {
                if (e.equals(9 /* KeyCode.Escape */)) {
                    this.hide();
                    e.preventDefault();
                    return;
                }
            });
            this._focusTracker = this._register(dom.trackFocus(this._innerFindDomNode));
            this._register(this._focusTracker.onDidFocus(this.onFocusTrackerFocus.bind(this)));
            this._register(this._focusTracker.onDidBlur(this.onFocusTrackerBlur.bind(this)));
            this._findInputFocusTracker = this._register(dom.trackFocus(this._findInput.domNode));
            this._register(this._findInputFocusTracker.onDidFocus(this.onFindInputFocusTrackerFocus.bind(this)));
            this._register(this._findInputFocusTracker.onDidBlur(this.onFindInputFocusTrackerBlur.bind(this)));
            this._register(dom.addDisposableListener(this._innerFindDomNode, 'click', (event) => {
                event.stopPropagation();
            }));
            // Replace
            this._innerReplaceDomNode = document.createElement('div');
            this._innerReplaceDomNode.classList.add('simple-fr-replace-part');
            this._replaceInput = this._register(new contextScopedHistoryWidget_1.ContextScopedReplaceInput(null, undefined, {
                label: NLS_REPLACE_INPUT_LABEL,
                placeholder: NLS_REPLACE_INPUT_PLACEHOLDER,
                history: []
            }, contextKeyService, false));
            this._innerReplaceDomNode.appendChild(this._replaceInput.domNode);
            this._replaceInputFocusTracker = this._register(dom.trackFocus(this._replaceInput.domNode));
            this._register(this._replaceInputFocusTracker.onDidFocus(this.onReplaceInputFocusTrackerFocus.bind(this)));
            this._register(this._replaceInputFocusTracker.onDidBlur(this.onReplaceInputFocusTrackerBlur.bind(this)));
            this._domNode.appendChild(this._innerReplaceDomNode);
            if (this._isReplaceVisible) {
                this._innerReplaceDomNode.style.display = 'flex';
            }
            else {
                this._innerReplaceDomNode.style.display = 'none';
            }
            this._replaceBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_REPLACE_BTN_LABEL,
                icon: findWidget_1.findReplaceIcon,
                onTrigger: () => {
                    this.replaceOne();
                }
            }));
            // Replace all button
            this._replaceAllBtn = this._register(new findWidget_1.SimpleButton({
                label: NLS_REPLACE_ALL_BTN_LABEL,
                icon: findWidget_1.findReplaceAllIcon,
                onTrigger: () => {
                    this.replaceAll();
                }
            }));
            this._innerReplaceDomNode.appendChild(this._replaceBtn.domNode);
            this._innerReplaceDomNode.appendChild(this._replaceAllBtn.domNode);
        }
        getCellToolbarActions(menu) {
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, result, g => /^inline/.test(g));
            return result;
        }
        get inputValue() {
            return this._findInput.getValue();
        }
        get replaceValue() {
            return this._replaceInput.getValue();
        }
        get replacePattern() {
            if (this._state.isRegex) {
                return (0, replacePattern_1.parseReplaceString)(this.replaceValue);
            }
            return replacePattern_1.ReplacePattern.fromStaticValue(this.replaceValue);
        }
        get focusTracker() {
            return this._focusTracker;
        }
        updateTheme(theme) {
            const inputStyles = {
                inputActiveOptionBorder: theme.getColor(colorRegistry_1.inputActiveOptionBorder),
                inputActiveOptionForeground: theme.getColor(colorRegistry_1.inputActiveOptionForeground),
                inputActiveOptionBackground: theme.getColor(colorRegistry_1.inputActiveOptionBackground),
                inputBackground: theme.getColor(colorRegistry_1.inputBackground),
                inputForeground: theme.getColor(colorRegistry_1.inputForeground),
                inputBorder: theme.getColor(colorRegistry_1.inputBorder),
                inputValidationInfoBackground: theme.getColor(colorRegistry_1.inputValidationInfoBackground),
                inputValidationInfoForeground: theme.getColor(colorRegistry_1.inputValidationInfoForeground),
                inputValidationInfoBorder: theme.getColor(colorRegistry_1.inputValidationInfoBorder),
                inputValidationWarningBackground: theme.getColor(colorRegistry_1.inputValidationWarningBackground),
                inputValidationWarningForeground: theme.getColor(colorRegistry_1.inputValidationWarningForeground),
                inputValidationWarningBorder: theme.getColor(colorRegistry_1.inputValidationWarningBorder),
                inputValidationErrorBackground: theme.getColor(colorRegistry_1.inputValidationErrorBackground),
                inputValidationErrorForeground: theme.getColor(colorRegistry_1.inputValidationErrorForeground),
                inputValidationErrorBorder: theme.getColor(colorRegistry_1.inputValidationErrorBorder),
            };
            this._findInput.style(inputStyles);
            const replaceStyles = {
                inputActiveOptionBorder: theme.getColor(colorRegistry_1.inputActiveOptionBorder),
                inputActiveOptionForeground: theme.getColor(colorRegistry_1.inputActiveOptionForeground),
                inputActiveOptionBackground: theme.getColor(colorRegistry_1.inputActiveOptionBackground),
                inputBackground: theme.getColor(colorRegistry_1.inputBackground),
                inputForeground: theme.getColor(colorRegistry_1.inputForeground),
                inputBorder: theme.getColor(colorRegistry_1.inputBorder),
                inputValidationInfoBackground: theme.getColor(colorRegistry_1.inputValidationInfoBackground),
                inputValidationInfoForeground: theme.getColor(colorRegistry_1.inputValidationInfoForeground),
                inputValidationInfoBorder: theme.getColor(colorRegistry_1.inputValidationInfoBorder),
                inputValidationWarningBackground: theme.getColor(colorRegistry_1.inputValidationWarningBackground),
                inputValidationWarningForeground: theme.getColor(colorRegistry_1.inputValidationWarningForeground),
                inputValidationWarningBorder: theme.getColor(colorRegistry_1.inputValidationWarningBorder),
                inputValidationErrorBackground: theme.getColor(colorRegistry_1.inputValidationErrorBackground),
                inputValidationErrorForeground: theme.getColor(colorRegistry_1.inputValidationErrorForeground),
                inputValidationErrorBorder: theme.getColor(colorRegistry_1.inputValidationErrorBorder),
            };
            this._replaceInput.style(replaceStyles);
        }
        _onStateChanged(e) {
            this._updateButtons();
            this._updateMatchesCount();
        }
        _updateButtons() {
            this._findInput.setEnabled(this._isVisible);
            this._replaceInput.setEnabled(this._isVisible && this._isReplaceVisible);
            let findInputIsNonEmpty = (this._state.searchString.length > 0);
            this._replaceBtn.setEnabled(this._isVisible && this._isReplaceVisible && findInputIsNonEmpty);
            this._replaceAllBtn.setEnabled(this._isVisible && this._isReplaceVisible && findInputIsNonEmpty);
            this._domNode.classList.toggle('replaceToggled', this._isReplaceVisible);
            this._toggleReplaceBtn.setExpanded(this._isReplaceVisible);
            this.foundMatch = this._state.matchesCount > 0;
            this.updateButtons(this.foundMatch);
        }
        _updateMatchesCount() {
        }
        dispose() {
            super.dispose();
            if (this._domNode && this._domNode.parentElement) {
                this._domNode.parentElement.removeChild(this._domNode);
            }
        }
        getDomNode() {
            return this._domNode;
        }
        reveal(initialInput) {
            if (initialInput) {
                this._findInput.setValue(initialInput);
            }
            if (this._isVisible) {
                this._findInput.select();
                return;
            }
            this._isVisible = true;
            this.updateButtons(this.foundMatch);
            setTimeout(() => {
                this._domNode.classList.add('visible', 'visible-transition');
                this._domNode.setAttribute('aria-hidden', 'false');
                this._findInput.select();
            }, 0);
        }
        focus() {
            this._findInput.focus();
        }
        show(initialInput, options) {
            if (initialInput && !this._isVisible) {
                this._findInput.setValue(initialInput);
            }
            this._isVisible = true;
            setTimeout(() => {
                var _a;
                this._domNode.classList.add('visible', 'visible-transition');
                this._domNode.setAttribute('aria-hidden', 'false');
                if ((_a = options === null || options === void 0 ? void 0 : options.focus) !== null && _a !== void 0 ? _a : true) {
                    this.focus();
                }
            }, 0);
        }
        showWithReplace(initialInput, replaceInput) {
            if (initialInput && !this._isVisible) {
                this._findInput.setValue(initialInput);
            }
            if (replaceInput && !this._isVisible) {
                this._replaceInput.setValue(replaceInput);
            }
            this._isVisible = true;
            this._isReplaceVisible = true;
            this._state.change({ isReplaceRevealed: this._isReplaceVisible }, false);
            if (this._isReplaceVisible) {
                this._innerReplaceDomNode.style.display = 'flex';
            }
            else {
                this._innerReplaceDomNode.style.display = 'none';
            }
            setTimeout(() => {
                this._domNode.classList.add('visible', 'visible-transition');
                this._domNode.setAttribute('aria-hidden', 'false');
                this._updateButtons();
                this._replaceInput.focus();
            }, 0);
        }
        hide() {
            if (this._isVisible) {
                this._domNode.classList.remove('visible-transition');
                this._domNode.setAttribute('aria-hidden', 'true');
                // Need to delay toggling visibility until after Transition, then visibility hidden - removes from tabIndex list
                setTimeout(() => {
                    this._isVisible = false;
                    this.updateButtons(this.foundMatch);
                    this._domNode.classList.remove('visible');
                }, 200);
            }
        }
        _delayedUpdateHistory() {
            this._updateHistoryDelayer.trigger(this._updateHistory.bind(this));
        }
        _updateHistory() {
            this._findInput.inputBox.addToHistory();
        }
        _getRegexValue() {
            return this._findInput.getRegex();
        }
        _getWholeWordValue() {
            return this._findInput.getWholeWords();
        }
        _getCaseSensitiveValue() {
            return this._findInput.getCaseSensitive();
        }
        updateButtons(foundMatch) {
            const hasInput = this.inputValue.length > 0;
            this.prevBtn.setEnabled(this._isVisible && hasInput && foundMatch);
            this.nextBtn.setEnabled(this._isVisible && hasInput && foundMatch);
        }
    };
    SimpleFindReplaceWidget = __decorate([
        __param(0, contextView_1.IContextViewService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, actions_2.IMenuService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, instantiation_1.IInstantiationService)
    ], SimpleFindReplaceWidget);
    exports.SimpleFindReplaceWidget = SimpleFindReplaceWidget;
    // theming
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const findWidgetBGColor = theme.getColor(colorRegistry_1.editorWidgetBackground);
        if (findWidgetBGColor) {
            collector.addRule(`.monaco-workbench .simple-fr-find-part-wrapper { background-color: ${findWidgetBGColor} !important; }`);
        }
        const widgetForeground = theme.getColor(colorRegistry_1.editorWidgetForeground);
        if (widgetForeground) {
            collector.addRule(`.monaco-workbench .simple-fr-find-part-wrapper { color: ${widgetForeground}; }`);
        }
        const widgetShadowColor = theme.getColor(colorRegistry_1.widgetShadow);
        if (widgetShadowColor) {
            collector.addRule(`.monaco-workbench .simple-fr-find-part-wrapper { box-shadow: 0 0 8px 2px ${widgetShadowColor}; }`);
        }
        const inputActiveOptionBorderColor = theme.getColor(colorRegistry_1.inputActiveOptionBorder);
        if (inputActiveOptionBorderColor) {
            collector.addRule(`.simple-fr-find-part .find-filter-button > .monaco-action-bar .action-label.notebook-filters.checked { border-color: ${inputActiveOptionBorderColor}; }`);
        }
        const inputActiveOptionForegroundColor = theme.getColor(colorRegistry_1.inputActiveOptionForeground);
        if (inputActiveOptionForegroundColor) {
            collector.addRule(`.simple-fr-find-part .find-filter-button > .monaco-action-bar .action-label.notebook-filters.checked { color: ${inputActiveOptionForegroundColor}; }`);
        }
        const inputActiveOptionBackgroundColor = theme.getColor(colorRegistry_1.inputActiveOptionBackground);
        if (inputActiveOptionBackgroundColor) {
            collector.addRule(`.simple-fr-find-part .find-filter-button > .monaco-action-bar .action-label.notebook-filters.checked { background-color: ${inputActiveOptionBackgroundColor}; }`);
        }
    });
});
//# sourceMappingURL=notebookFindReplaceWidget.js.map