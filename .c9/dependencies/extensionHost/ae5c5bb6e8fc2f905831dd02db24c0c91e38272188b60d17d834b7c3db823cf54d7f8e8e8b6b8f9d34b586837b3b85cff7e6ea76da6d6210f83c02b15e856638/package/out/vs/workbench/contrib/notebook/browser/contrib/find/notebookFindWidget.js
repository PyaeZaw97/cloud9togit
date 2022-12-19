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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/common/strings", "vs/editor/contrib/find/browser/findModel", "vs/editor/contrib/find/browser/findState", "vs/editor/contrib/find/browser/findWidget", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/contrib/find/findModel", "vs/workbench/contrib/notebook/browser/contrib/find/notebookFindReplaceWidget", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/common/notebookContextKeys"], function (require, exports, DOM, aria_1, strings, findModel_1, findState_1, findWidget_1, nls_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, themeService_1, findModel_2, notebookFindReplaceWidget_1, notebookBrowser_1, notebookContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookFindWidget = void 0;
    const FIND_HIDE_TRANSITION = 'find-hide-transition';
    const FIND_SHOW_TRANSITION = 'find-show-transition';
    let MAX_MATCHES_COUNT_WIDTH = 69;
    const PROGRESS_BAR_DELAY = 200; // show progress for at least 200ms
    let NotebookFindWidget = class NotebookFindWidget extends notebookFindReplaceWidget_1.SimpleFindReplaceWidget {
        constructor(_notebookEditor, contextViewService, contextKeyService, themeService, configurationService, contextMenuService, menuService, instantiationService) {
            super(contextViewService, contextKeyService, themeService, configurationService, menuService, contextMenuService, instantiationService, new findState_1.FindReplaceState());
            this._notebookEditor = _notebookEditor;
            this._showTimeout = null;
            this._hideTimeout = null;
            this._findModel = new findModel_2.FindModel(this._notebookEditor, this._state, this._configurationService);
            DOM.append(this._notebookEditor.getDomNode(), this.getDomNode());
            this._findWidgetFocused = notebookContextKeys_1.KEYBINDING_CONTEXT_NOTEBOOK_FIND_WIDGET_FOCUSED.bindTo(contextKeyService);
            this._register(this._findInput.onKeyDown((e) => this._onFindInputKeyDown(e)));
            this.updateTheme(themeService.getColorTheme());
            this._register(themeService.onDidColorThemeChange(() => {
                this.updateTheme(themeService.getColorTheme());
            }));
            this._register(this._state.onFindReplaceStateChange((e) => {
                var _a, _b, _c, _d;
                this.onInputChanged();
                if (e.isSearching) {
                    if (this._state.isSearching) {
                        this._progressBar.infinite().show(PROGRESS_BAR_DELAY);
                    }
                    else {
                        this._progressBar.stop().hide();
                    }
                }
                if (this._findModel.currentMatch >= 0) {
                    const currentMatch = this._findModel.getCurrentMatch();
                    this._replaceBtn.setEnabled(currentMatch.isModelMatch);
                }
                const matches = this._findModel.findMatches;
                this._replaceAllBtn.setEnabled(matches.length > 0 && matches.find(match => match.modelMatchCount < match.matches.length) === undefined);
                if (e.filters) {
                    this._findInput.updateFilterState(((_b = (_a = this._state.filters) === null || _a === void 0 ? void 0 : _a.markupPreview) !== null && _b !== void 0 ? _b : false) || ((_d = (_c = this._state.filters) === null || _c === void 0 ? void 0 : _c.codeOutput) !== null && _d !== void 0 ? _d : false));
                }
            }));
            this._register(DOM.addDisposableListener(this.getDomNode(), DOM.EventType.FOCUS, e => {
                this._previousFocusElement = e.relatedTarget instanceof HTMLElement ? e.relatedTarget : undefined;
            }, true));
        }
        _onFindInputKeyDown(e) {
            if (e.equals(3 /* KeyCode.Enter */)) {
                this.find(false);
                e.preventDefault();
                return;
            }
            else if (e.equals(1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */)) {
                this.find(true);
                e.preventDefault();
                return;
            }
        }
        onInputChanged() {
            this._state.change({ searchString: this.inputValue }, false);
            // this._findModel.research();
            const findMatches = this._findModel.findMatches;
            if (findMatches && findMatches.length) {
                return true;
            }
            return false;
        }
        findIndex(index) {
            this._findModel.find({ index });
        }
        find(previous) {
            this._findModel.find({ previous });
        }
        replaceOne() {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            if (!this._findModel.findMatches.length) {
                return;
            }
            this._findModel.ensureFindMatches();
            if (this._findModel.currentMatch < 0) {
                this._findModel.find({ previous: false });
            }
            const currentMatch = this._findModel.getCurrentMatch();
            const cell = currentMatch.cell;
            if (currentMatch.isModelMatch) {
                const match = currentMatch.match;
                this._progressBar.infinite().show(PROGRESS_BAR_DELAY);
                const replacePattern = this.replacePattern;
                const replaceString = replacePattern.buildReplaceString(match.matches, this._state.preserveCase);
                const viewModel = this._notebookEditor._getViewModel();
                viewModel.replaceOne(cell, match.range, replaceString).then(() => {
                    this._progressBar.stop();
                });
            }
            else {
                // this should not work
                console.error('Replace does not work for output match');
            }
        }
        replaceAll() {
            if (!this._notebookEditor.hasModel()) {
                return;
            }
            this._progressBar.infinite().show(PROGRESS_BAR_DELAY);
            const replacePattern = this.replacePattern;
            const cellFindMatches = this._findModel.findMatches;
            const replaceStrings = [];
            cellFindMatches.forEach(cellFindMatch => {
                const findMatches = cellFindMatch.matches;
                findMatches.forEach((findMatch, index) => {
                    if (index < cellFindMatch.modelMatchCount) {
                        const match = findMatch;
                        const matches = match.matches;
                        replaceStrings.push(replacePattern.buildReplaceString(matches, this._state.preserveCase));
                    }
                });
            });
            const viewModel = this._notebookEditor._getViewModel();
            viewModel.replaceAll(this._findModel.findMatches, replaceStrings).then(() => {
                this._progressBar.stop();
            });
        }
        findFirst() { }
        onFocusTrackerFocus() {
            this._findWidgetFocused.set(true);
        }
        onFocusTrackerBlur() {
            this._previousFocusElement = undefined;
            this._findWidgetFocused.reset();
        }
        onReplaceInputFocusTrackerFocus() {
            // throw new Error('Method not implemented.');
        }
        onReplaceInputFocusTrackerBlur() {
            // throw new Error('Method not implemented.');
        }
        onFindInputFocusTrackerFocus() { }
        onFindInputFocusTrackerBlur() { }
        async show(initialInput, options) {
            super.show(initialInput, options);
            this._state.change({ searchString: initialInput !== null && initialInput !== void 0 ? initialInput : '', isRevealed: true }, false);
            if (typeof (options === null || options === void 0 ? void 0 : options.matchIndex) === 'number') {
                if (!this._findModel.findMatches.length) {
                    await this._findModel.research();
                }
                this.findIndex(options.matchIndex);
            }
            else {
                this._findInput.select();
            }
            if (this._showTimeout === null) {
                if (this._hideTimeout !== null) {
                    window.clearTimeout(this._hideTimeout);
                    this._hideTimeout = null;
                    this._notebookEditor.removeClassName(FIND_HIDE_TRANSITION);
                }
                this._notebookEditor.addClassName(FIND_SHOW_TRANSITION);
                this._showTimeout = window.setTimeout(() => {
                    this._notebookEditor.removeClassName(FIND_SHOW_TRANSITION);
                    this._showTimeout = null;
                }, 200);
            }
            else {
                // no op
            }
        }
        replace(initialFindInput, initialReplaceInput) {
            super.showWithReplace(initialFindInput, initialReplaceInput);
            this._state.change({ searchString: initialFindInput !== null && initialFindInput !== void 0 ? initialFindInput : '', replaceString: initialReplaceInput !== null && initialReplaceInput !== void 0 ? initialReplaceInput : '', isRevealed: true }, false);
            this._replaceInput.select();
            if (this._showTimeout === null) {
                if (this._hideTimeout !== null) {
                    window.clearTimeout(this._hideTimeout);
                    this._hideTimeout = null;
                    this._notebookEditor.removeClassName(FIND_HIDE_TRANSITION);
                }
                this._notebookEditor.addClassName(FIND_SHOW_TRANSITION);
                this._showTimeout = window.setTimeout(() => {
                    this._notebookEditor.removeClassName(FIND_SHOW_TRANSITION);
                    this._showTimeout = null;
                }, 200);
            }
            else {
                // no op
            }
        }
        hide() {
            super.hide();
            this._state.change({ isRevealed: false }, false);
            this._findModel.clear();
            this._notebookEditor.findStop();
            this._progressBar.stop();
            if (this._hideTimeout === null) {
                if (this._showTimeout !== null) {
                    window.clearTimeout(this._showTimeout);
                    this._showTimeout = null;
                    this._notebookEditor.removeClassName(FIND_SHOW_TRANSITION);
                }
                this._notebookEditor.addClassName(FIND_HIDE_TRANSITION);
                this._hideTimeout = window.setTimeout(() => {
                    this._notebookEditor.removeClassName(FIND_HIDE_TRANSITION);
                }, 200);
            }
            else {
                // no op
            }
            if (this._previousFocusElement && this._previousFocusElement.offsetParent) {
                this._previousFocusElement.focus();
                this._previousFocusElement = undefined;
            }
            if (this._notebookEditor.hasModel()) {
                for (let i = 0; i < this._notebookEditor.getLength(); i++) {
                    const cell = this._notebookEditor.cellAt(i);
                    if (cell.getEditState() === notebookBrowser_1.CellEditState.Editing && cell.editStateSource === 'find') {
                        cell.updateEditState(notebookBrowser_1.CellEditState.Preview, 'find');
                    }
                }
            }
        }
        _updateMatchesCount() {
            if (!this._findModel || !this._findModel.findMatches) {
                return;
            }
            this._matchesCount.style.minWidth = MAX_MATCHES_COUNT_WIDTH + 'px';
            this._matchesCount.title = '';
            // remove previous content
            if (this._matchesCount.firstChild) {
                this._matchesCount.removeChild(this._matchesCount.firstChild);
            }
            let label;
            if (this._state.matchesCount > 0) {
                let matchesCount = String(this._state.matchesCount);
                if (this._state.matchesCount >= findModel_1.MATCHES_LIMIT) {
                    matchesCount += '+';
                }
                const matchesPosition = this._findModel.currentMatch < 0 ? '?' : String((this._findModel.currentMatch + 1));
                label = strings.format(findWidget_1.NLS_MATCHES_LOCATION, matchesPosition, matchesCount);
            }
            else {
                label = findWidget_1.NLS_NO_RESULTS;
            }
            this._matchesCount.appendChild(document.createTextNode(label));
            (0, aria_1.alert)(this._getAriaLabel(label, this._state.currentMatch, this._state.searchString));
            MAX_MATCHES_COUNT_WIDTH = Math.max(MAX_MATCHES_COUNT_WIDTH, this._matchesCount.clientWidth);
        }
        _getAriaLabel(label, currentMatch, searchString) {
            if (label === findWidget_1.NLS_NO_RESULTS) {
                return searchString === ''
                    ? (0, nls_1.localize)('ariaSearchNoResultEmpty', "{0} found", label)
                    : (0, nls_1.localize)('ariaSearchNoResult', "{0} found for '{1}'", label, searchString);
            }
            // TODO@rebornix, aria for `cell ${index}, line {line}`
            return (0, nls_1.localize)('ariaSearchNoResultWithLineNumNoCurrentMatch', "{0} found for '{1}'", label, searchString);
        }
        dispose() {
            var _a, _b;
            (_a = this._notebookEditor) === null || _a === void 0 ? void 0 : _a.removeClassName(FIND_SHOW_TRANSITION);
            (_b = this._notebookEditor) === null || _b === void 0 ? void 0 : _b.removeClassName(FIND_HIDE_TRANSITION);
            this._findModel.dispose();
            super.dispose();
        }
    };
    NotebookFindWidget.id = 'workbench.notebook.find';
    NotebookFindWidget = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, actions_1.IMenuService),
        __param(7, instantiation_1.IInstantiationService)
    ], NotebookFindWidget);
    exports.NotebookFindWidget = NotebookFindWidget;
});
//# sourceMappingURL=notebookFindWidget.js.map