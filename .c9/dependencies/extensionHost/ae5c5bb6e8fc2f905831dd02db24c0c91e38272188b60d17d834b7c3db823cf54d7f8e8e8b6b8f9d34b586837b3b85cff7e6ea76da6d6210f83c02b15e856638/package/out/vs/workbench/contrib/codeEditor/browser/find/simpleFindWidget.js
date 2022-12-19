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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/widget", "vs/base/common/async", "vs/editor/contrib/find/browser/findState", "vs/editor/contrib/find/browser/findWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/theme/common/iconRegistry", "vs/base/common/strings", "vs/css!./simpleFindWidget"], function (require, exports, nls, dom, widget_1, async_1, findState_1, findWidget_1, contextkey_1, contextView_1, colorRegistry_1, themeService_1, contextScopedHistoryWidget_1, iconRegistry_1, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SimpleFindWidget = void 0;
    const NLS_FIND_INPUT_LABEL = nls.localize('label.find', "Find");
    const NLS_FIND_INPUT_PLACEHOLDER = nls.localize('placeholder.find', "Find (\u21C5 for history)");
    const NLS_PREVIOUS_MATCH_BTN_LABEL = nls.localize('label.previousMatchButton', "Previous Match");
    const NLS_NEXT_MATCH_BTN_LABEL = nls.localize('label.nextMatchButton', "Next Match");
    const NLS_CLOSE_BTN_LABEL = nls.localize('label.closeButton', "Close");
    let SimpleFindWidget = class SimpleFindWidget extends widget_1.Widget {
        constructor(_contextViewService, contextKeyService, _state = new findState_1.FindReplaceState(), _options, _keybindingService) {
            super();
            this._contextViewService = _contextViewService;
            this._state = _state;
            this._options = _options;
            this._keybindingService = _keybindingService;
            this._isVisible = false;
            this._foundMatch = false;
            this._findInput = this._register(new contextScopedHistoryWidget_1.ContextScopedFindInput(null, this._contextViewService, {
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
                        this._foundMatch = false;
                        this.updateButtons(this._foundMatch);
                        return { content: e.message };
                    }
                },
                appendCaseSensitiveLabel: _options.appendCaseSensitiveLabel && _options.type === 'Terminal' ? this._getKeybinding("workbench.action.terminal.toggleFindCaseSensitive" /* TerminalCommandId.ToggleFindCaseSensitive */) : undefined,
                appendRegexLabel: _options.appendRegexLabel && _options.type === 'Terminal' ? this._getKeybinding("workbench.action.terminal.toggleFindRegex" /* TerminalCommandId.ToggleFindRegex */) : undefined,
                appendWholeWordsLabel: _options.appendWholeWordsLabel && _options.type === 'Terminal' ? this._getKeybinding("workbench.action.terminal.toggleFindWholeWord" /* TerminalCommandId.ToggleFindWholeWord */) : undefined
            }, contextKeyService, _options.showOptionButtons));
            // Find History with update delayer
            this._updateHistoryDelayer = new async_1.Delayer(500);
            this._register(this._findInput.onInput(async (e) => {
                if (!_options.checkImeCompletionState || !this._findInput.isImeSessionInProgress) {
                    this._foundMatch = this._onInputChanged();
                    if (this._options.showResultCount) {
                        await this.updateResultCount();
                    }
                    this.updateButtons(this._foundMatch);
                    this.focusFindBox();
                    this._delayedUpdateHistory();
                }
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
                this.findFirst();
            }));
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
            this._innerDomNode = document.createElement('div');
            this._innerDomNode.classList.add('simple-find-part');
            this._innerDomNode.appendChild(this._findInput.domNode);
            this._innerDomNode.appendChild(this.prevBtn.domNode);
            this._innerDomNode.appendChild(this.nextBtn.domNode);
            this._innerDomNode.appendChild(closeBtn.domNode);
            // _domNode wraps _innerDomNode, ensuring that
            this._domNode = document.createElement('div');
            this._domNode.classList.add('simple-find-part-wrapper');
            this._domNode.appendChild(this._innerDomNode);
            this.onkeyup(this._innerDomNode, e => {
                if (e.equals(9 /* KeyCode.Escape */)) {
                    this.hide();
                    e.preventDefault();
                    return;
                }
            });
            this._focusTracker = this._register(dom.trackFocus(this._innerDomNode));
            this._register(this._focusTracker.onDidFocus(this._onFocusTrackerFocus.bind(this)));
            this._register(this._focusTracker.onDidBlur(this._onFocusTrackerBlur.bind(this)));
            this._findInputFocusTracker = this._register(dom.trackFocus(this._findInput.domNode));
            this._register(this._findInputFocusTracker.onDidFocus(this._onFindInputFocusTrackerFocus.bind(this)));
            this._register(this._findInputFocusTracker.onDidBlur(this._onFindInputFocusTrackerBlur.bind(this)));
            this._register(dom.addDisposableListener(this._innerDomNode, 'click', (event) => {
                event.stopPropagation();
            }));
            if (_options === null || _options === void 0 ? void 0 : _options.showResultCount) {
                this._domNode.classList.add('result-count');
                this._register(this._findInput.onDidChange(() => {
                    this.updateResultCount();
                    this.updateButtons(this._foundMatch);
                }));
            }
        }
        get inputValue() {
            return this._findInput.getValue();
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
                inputValidationErrorBorder: theme.getColor(colorRegistry_1.inputValidationErrorBorder)
            };
            this._findInput.style(inputStyles);
        }
        _getKeybinding(actionId) {
            var _a;
            let kb = (_a = this._keybindingService) === null || _a === void 0 ? void 0 : _a.lookupKeybinding(actionId);
            if (!kb) {
                return '';
            }
            return ` (${kb.getLabel()})`;
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
            this.updateButtons(this._foundMatch);
            setTimeout(() => {
                this._innerDomNode.classList.add('visible', 'visible-transition');
                this._innerDomNode.setAttribute('aria-hidden', 'false');
                this._findInput.select();
            }, 0);
        }
        show(initialInput) {
            if (initialInput && !this._isVisible) {
                this._findInput.setValue(initialInput);
            }
            this._isVisible = true;
            setTimeout(() => {
                this._innerDomNode.classList.add('visible', 'visible-transition');
                this._innerDomNode.setAttribute('aria-hidden', 'false');
            }, 0);
        }
        hide() {
            if (this._isVisible) {
                this._innerDomNode.classList.remove('visible-transition');
                this._innerDomNode.setAttribute('aria-hidden', 'true');
                // Need to delay toggling visibility until after Transition, then visibility hidden - removes from tabIndex list
                setTimeout(() => {
                    this._isVisible = false;
                    this.updateButtons(this._foundMatch);
                    this._innerDomNode.classList.remove('visible');
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
        focusFindBox() {
            // Focus back onto the find box, which
            // requires focusing onto the next button first
            this.nextBtn.focus();
            this._findInput.inputBox.focus();
        }
        async updateResultCount() {
            var _a;
            const count = await this._getResultCount();
            if (!this._matchesCount) {
                this._matchesCount = document.createElement('div');
                this._matchesCount.className = 'matchesCount';
            }
            this._matchesCount.innerText = '';
            let label = '';
            this._matchesCount.classList.toggle('no-results', false);
            if ((count === null || count === void 0 ? void 0 : count.resultCount) && (count === null || count === void 0 ? void 0 : count.resultCount) <= 0) {
                label = findWidget_1.NLS_NO_RESULTS;
                if (!!this.inputValue) {
                    this._matchesCount.classList.toggle('no-results', true);
                }
            }
            else if (count === null || count === void 0 ? void 0 : count.resultCount) {
                label = strings.format(findWidget_1.NLS_MATCHES_LOCATION, count.resultIndex + 1, count === null || count === void 0 ? void 0 : count.resultCount);
            }
            this._matchesCount.appendChild(document.createTextNode(label));
            (_a = this._findInput) === null || _a === void 0 ? void 0 : _a.domNode.insertAdjacentElement('afterend', this._matchesCount);
            this._foundMatch = !!count && count.resultCount > 0;
        }
    };
    SimpleFindWidget = __decorate([
        __param(0, contextView_1.IContextViewService),
        __param(1, contextkey_1.IContextKeyService)
    ], SimpleFindWidget);
    exports.SimpleFindWidget = SimpleFindWidget;
    // theming
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const findWidgetBGColor = theme.getColor(colorRegistry_1.editorWidgetBackground);
        if (findWidgetBGColor) {
            collector.addRule(`.monaco-workbench .simple-find-part { background-color: ${findWidgetBGColor} !important; }`);
        }
        const widgetForeground = theme.getColor(colorRegistry_1.editorWidgetForeground);
        if (widgetForeground) {
            collector.addRule(`.monaco-workbench .simple-find-part { color: ${widgetForeground}; }`);
        }
        const widgetShadowColor = theme.getColor(colorRegistry_1.widgetShadow);
        if (widgetShadowColor) {
            collector.addRule(`.monaco-workbench .simple-find-part { box-shadow: 0 0 8px 2px ${widgetShadowColor}; }`);
        }
        const error = theme.getColor(colorRegistry_1.errorForeground);
        if (error) {
            collector.addRule(`.no-results.matchesCount { color: ${error}; }`);
        }
        const toolbarHoverBackgroundColor = theme.getColor(colorRegistry_1.toolbarHoverBackground);
        if (toolbarHoverBackgroundColor) {
            collector.addRule(`
			div.simple-find-part-wrapper div.button:hover:not(.disabled) {
				background-color: ${toolbarHoverBackgroundColor};
			}
		`);
        }
        const toolbarHoverOutlineColor = theme.getColor(colorRegistry_1.toolbarHoverOutline);
        if (toolbarHoverOutlineColor) {
            collector.addRule(`
			div.simple-find-part-wrapper div.button:hover:not(.disabled) {
					outline: 1px dashed ${toolbarHoverOutlineColor};
					outline-offset: -1px;
				}
			`);
        }
    });
});
//# sourceMappingURL=simpleFindWidget.js.map