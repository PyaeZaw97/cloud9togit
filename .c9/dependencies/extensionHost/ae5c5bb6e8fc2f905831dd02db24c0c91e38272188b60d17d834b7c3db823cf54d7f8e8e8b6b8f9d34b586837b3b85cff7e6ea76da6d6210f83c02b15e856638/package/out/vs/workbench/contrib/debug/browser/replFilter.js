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
define(["require", "exports", "vs/base/common/filters", "vs/base/common/glob", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/common/async", "vs/platform/instantiation/common/instantiation", "vs/platform/contextview/browser/contextView", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/debug/common/replModel", "vs/nls", "vs/workbench/contrib/debug/common/debugModel"], function (require, exports, filters_1, glob_1, DOM, actionViewItems_1, async_1, instantiation_1, contextView_1, lifecycle_1, event_1, contextScopedHistoryWidget_1, styler_1, themeService_1, colorRegistry_1, replModel_1, nls_1, debugModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReplFilterActionViewItem = exports.ReplFilterState = exports.ReplFilter = void 0;
    class ReplFilter {
        constructor() {
            this._parsedQueries = [];
        }
        set filterQuery(query) {
            this._parsedQueries = [];
            query = query.trim();
            if (query && query !== '') {
                const filters = (0, glob_1.splitGlobAware)(query, ',').map(s => s.trim()).filter(s => !!s.length);
                for (const f of filters) {
                    if (f.startsWith('!')) {
                        this._parsedQueries.push({ type: 'exclude', query: f.slice(1) });
                    }
                    else {
                        this._parsedQueries.push({ type: 'include', query: f });
                    }
                }
            }
        }
        filter(element, parentVisibility) {
            if (element instanceof replModel_1.ReplEvaluationInput || element instanceof replModel_1.ReplEvaluationResult || element instanceof debugModel_1.Variable) {
                // Only filter the output events, everything else is visible https://github.com/microsoft/vscode/issues/105863
                return 1 /* TreeVisibility.Visible */;
            }
            let includeQueryPresent = false;
            let includeQueryMatched = false;
            const text = element.toString(true);
            for (const { type, query } of this._parsedQueries) {
                if (type === 'exclude' && ReplFilter.matchQuery(query, text)) {
                    // If exclude query matches, ignore all other queries and hide
                    return false;
                }
                else if (type === 'include') {
                    includeQueryPresent = true;
                    if (ReplFilter.matchQuery(query, text)) {
                        includeQueryMatched = true;
                    }
                }
            }
            return includeQueryPresent ? includeQueryMatched : (typeof parentVisibility !== 'undefined' ? parentVisibility : 1 /* TreeVisibility.Visible */);
        }
    }
    exports.ReplFilter = ReplFilter;
    ReplFilter.matchQuery = filters_1.matchesFuzzy;
    class ReplFilterState {
        constructor(filterStatsProvider) {
            this.filterStatsProvider = filterStatsProvider;
            this._onDidChange = new event_1.Emitter();
            this._onDidStatsChange = new event_1.Emitter();
            this._filterText = '';
            this._stats = { total: 0, filtered: 0 };
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        get onDidStatsChange() {
            return this._onDidStatsChange.event;
        }
        get filterText() {
            return this._filterText;
        }
        get filterStats() {
            return this._stats;
        }
        set filterText(filterText) {
            if (this._filterText !== filterText) {
                this._filterText = filterText;
                this._onDidChange.fire();
                this.updateFilterStats();
            }
        }
        updateFilterStats() {
            const { total, filtered } = this.filterStatsProvider.getFilterStats();
            if (this._stats.total !== total || this._stats.filtered !== filtered) {
                this._stats = { total, filtered };
                this._onDidStatsChange.fire();
            }
        }
    }
    exports.ReplFilterState = ReplFilterState;
    let ReplFilterActionViewItem = class ReplFilterActionViewItem extends actionViewItems_1.BaseActionViewItem {
        constructor(action, placeholder, filters, history, showHistoryHint, instantiationService, themeService, contextViewService) {
            super(null, action);
            this.placeholder = placeholder;
            this.filters = filters;
            this.history = history;
            this.showHistoryHint = showHistoryHint;
            this.instantiationService = instantiationService;
            this.themeService = themeService;
            this.contextViewService = contextViewService;
            this.delayedFilterUpdate = new async_1.Delayer(400);
            this._register((0, lifecycle_1.toDisposable)(() => this.delayedFilterUpdate.cancel()));
        }
        render(container) {
            this.container = container;
            this.container.classList.add('repl-panel-filter-container');
            this.element = DOM.append(this.container, DOM.$(''));
            this.element.className = this.class;
            this.createInput(this.element);
            this.createBadge(this.element);
            this.updateClass();
        }
        focus() {
            if (this.filterInputBox) {
                this.filterInputBox.focus();
            }
        }
        blur() {
            if (this.filterInputBox) {
                this.filterInputBox.blur();
            }
        }
        setFocusable() {
            // noop input elements are focusable by default
        }
        getHistory() {
            return this.filterInputBox.getHistory();
        }
        get trapsArrowNavigation() {
            return true;
        }
        clearFilterText() {
            this.filterInputBox.value = '';
        }
        createInput(container) {
            this.filterInputBox = this._register(this.instantiationService.createInstance(contextScopedHistoryWidget_1.ContextScopedHistoryInputBox, container, this.contextViewService, {
                placeholder: this.placeholder,
                history: this.history,
                showHistoryHint: this.showHistoryHint
            }));
            this._register((0, styler_1.attachInputBoxStyler)(this.filterInputBox, this.themeService));
            this.filterInputBox.value = this.filters.filterText;
            this._register(this.filterInputBox.onDidChange(() => this.delayedFilterUpdate.trigger(() => this.onDidInputChange(this.filterInputBox))));
            this._register(this.filters.onDidChange(() => {
                this.filterInputBox.value = this.filters.filterText;
            }));
            this._register(DOM.addStandardDisposableListener(this.filterInputBox.inputElement, DOM.EventType.KEY_DOWN, (e) => this.onInputKeyDown(e)));
            this._register(DOM.addStandardDisposableListener(container, DOM.EventType.KEY_DOWN, this.handleKeyboardEvent));
            this._register(DOM.addStandardDisposableListener(container, DOM.EventType.KEY_UP, this.handleKeyboardEvent));
            this._register(DOM.addStandardDisposableListener(this.filterInputBox.inputElement, DOM.EventType.CLICK, (e) => {
                e.stopPropagation();
                e.preventDefault();
            }));
        }
        onDidInputChange(inputbox) {
            inputbox.addToHistory();
            this.filters.filterText = inputbox.value;
        }
        // Action toolbar is swallowing some keys for action items which should not be for an input box
        handleKeyboardEvent(event) {
            if (event.equals(10 /* KeyCode.Space */)
                || event.equals(15 /* KeyCode.LeftArrow */)
                || event.equals(17 /* KeyCode.RightArrow */)
                || event.equals(9 /* KeyCode.Escape */)) {
                event.stopPropagation();
            }
        }
        onInputKeyDown(event) {
            if (event.equals(9 /* KeyCode.Escape */)) {
                this.clearFilterText();
                event.stopPropagation();
                event.preventDefault();
            }
        }
        createBadge(container) {
            const controlsContainer = DOM.append(container, DOM.$('.repl-panel-filter-controls'));
            const filterBadge = this.filterBadge = DOM.append(controlsContainer, DOM.$('.repl-panel-filter-badge'));
            this._register((0, styler_1.attachStylerCallback)(this.themeService, { badgeBackground: colorRegistry_1.badgeBackground, badgeForeground: colorRegistry_1.badgeForeground, contrastBorder: colorRegistry_1.contrastBorder }, colors => {
                const background = colors.badgeBackground ? colors.badgeBackground.toString() : '';
                const foreground = colors.badgeForeground ? colors.badgeForeground.toString() : '';
                const border = colors.contrastBorder ? colors.contrastBorder.toString() : '';
                filterBadge.style.backgroundColor = background;
                filterBadge.style.borderWidth = border ? '1px' : '';
                filterBadge.style.borderStyle = border ? 'solid' : '';
                filterBadge.style.borderColor = border;
                filterBadge.style.color = foreground;
            }));
            this.updateBadge();
            this._register(this.filters.onDidStatsChange(() => this.updateBadge()));
        }
        updateBadge() {
            const { total, filtered } = this.filters.filterStats;
            const filterBadgeHidden = total === filtered || total === 0;
            this.filterBadge.classList.toggle('hidden', filterBadgeHidden);
            this.filterBadge.textContent = (0, nls_1.localize)('showing filtered repl lines', "Showing {0} of {1}", filtered, total);
            this.filterInputBox.inputElement.style.paddingRight = filterBadgeHidden ? '4px' : '150px';
        }
        get class() {
            return 'panel-action-tree-filter';
        }
    };
    ReplFilterActionViewItem = __decorate([
        __param(5, instantiation_1.IInstantiationService),
        __param(6, themeService_1.IThemeService),
        __param(7, contextView_1.IContextViewService)
    ], ReplFilterActionViewItem);
    exports.ReplFilterActionViewItem = ReplFilterActionViewItem;
});
//# sourceMappingURL=replFilter.js.map