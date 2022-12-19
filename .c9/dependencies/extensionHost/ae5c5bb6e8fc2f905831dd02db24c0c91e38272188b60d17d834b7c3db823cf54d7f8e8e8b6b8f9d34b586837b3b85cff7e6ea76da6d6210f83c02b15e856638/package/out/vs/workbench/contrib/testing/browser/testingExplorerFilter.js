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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/browser/ui/dropdown/dropdownActionViewItem", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/iterator", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/contrib/codeEditor/browser/suggestEnabledInput/suggestEnabledInput", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testTypes", "vs/workbench/contrib/testing/common/testExplorerFilterState", "vs/workbench/contrib/testing/common/testService"], function (require, exports, dom, actionbar_1, actionViewItems_1, dropdownActionViewItem_1, actions_1, async_1, iterator_1, nls_1, actions_2, contextView_1, instantiation_1, themeService_1, suggestEnabledInput_1, icons_1, storedValue_1, testTypes_1, testExplorerFilterState_1, testService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingExplorerFilter = void 0;
    const testFilterDescriptions = {
        ["@failed" /* TestFilterTerm.Failed */]: (0, nls_1.localize)('testing.filters.showOnlyFailed', "Show Only Failed Tests"),
        ["@executed" /* TestFilterTerm.Executed */]: (0, nls_1.localize)('testing.filters.showOnlyExecuted', "Show Only Executed Tests"),
        ["@doc" /* TestFilterTerm.CurrentDoc */]: (0, nls_1.localize)('testing.filters.currentFile', "Show in Active File Only"),
        ["@hidden" /* TestFilterTerm.Hidden */]: (0, nls_1.localize)('testing.filters.showExcludedTests', "Show Hidden Tests"),
    };
    let TestingExplorerFilter = class TestingExplorerFilter extends actionViewItems_1.BaseActionViewItem {
        constructor(action, state, themeService, instantiationService, testService) {
            super(null, action);
            this.state = state;
            this.themeService = themeService;
            this.instantiationService = instantiationService;
            this.testService = testService;
            this.history = this.instantiationService.createInstance(storedValue_1.StoredValue, {
                key: 'testing.filterHistory2',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 0 /* StorageTarget.USER */
            });
            this.filtersAction = new actions_1.Action('markersFiltersAction', (0, nls_1.localize)('testing.filters.menu', "More Filters..."), 'testing-filter-button ' + themeService_1.ThemeIcon.asClassName(icons_1.testingFilterIcon));
            this.updateFilterActiveState();
            this._register(testService.excluded.onTestExclusionsChanged(this.updateFilterActiveState, this));
        }
        /**
         * @override
         */
        render(container) {
            container.classList.add('testing-filter-action-item');
            const updateDelayer = this._register(new async_1.Delayer(400));
            const wrapper = this.wrapper = dom.$('.testing-filter-wrapper');
            container.appendChild(wrapper);
            const history = this.history.get([]);
            if (history.length) {
                this.state.setText(history[history.length - 1]);
            }
            const input = this.input = this._register(this.instantiationService.createInstance(suggestEnabledInput_1.ContextScopedSuggestEnabledInputWithHistory, {
                id: 'testing.explorer.filter',
                ariaLabel: (0, nls_1.localize)('testExplorerFilterLabel', "Filter text for tests in the explorer"),
                parent: wrapper,
                suggestionProvider: {
                    triggerCharacters: ['@'],
                    provideResults: () => [
                        ...Object.entries(testFilterDescriptions).map(([label, detail]) => ({ label, detail })),
                        ...iterator_1.Iterable.map(this.testService.collection.tags.values(), tag => {
                            var _a;
                            const { ctrlId, tagId } = (0, testTypes_1.denamespaceTestTag)(tag.id);
                            const insertText = `@${ctrlId}:${tagId}`;
                            return ({
                                label: `@${ctrlId}:${tagId}`,
                                detail: (_a = this.testService.collection.getNodeById(ctrlId)) === null || _a === void 0 ? void 0 : _a.item.label,
                                insertText: tagId.includes(' ') ? `@${ctrlId}:"${tagId.replace(/(["\\])/g, '\\$1')}"` : insertText,
                            });
                        }),
                    ].filter(r => !this.state.text.value.includes(r.label)),
                },
                resourceHandle: 'testing:filter',
                suggestOptions: {
                    value: this.state.text.value,
                    placeholderText: (0, nls_1.localize)('testExplorerFilter', "Filter (e.g. text, !exclude, @tag)"),
                },
                history
            }));
            this._register((0, suggestEnabledInput_1.attachSuggestEnabledInputBoxStyler)(input, this.themeService));
            this._register(this.state.text.onDidChange(newValue => {
                if (input.getValue() !== newValue) {
                    input.setValue(newValue);
                }
            }));
            this._register(this.state.onDidRequestInputFocus(() => {
                input.focus();
            }));
            this._register(input.onInputDidChange(() => updateDelayer.trigger(() => {
                input.addToHistory();
                this.state.setText(input.getValue());
            })));
            const actionbar = this._register(new actionbar_1.ActionBar(container, {
                actionViewItemProvider: action => {
                    if (action.id === this.filtersAction.id) {
                        return this.instantiationService.createInstance(FiltersDropdownMenuActionViewItem, action, this.state, this.actionRunner);
                    }
                    return undefined;
                },
            }));
            actionbar.push(this.filtersAction, { icon: true, label: false });
            this.layout(this.wrapper.clientWidth);
        }
        layout(width) {
            this.input.layout(new dom.Dimension(width - /* horizontal padding */ 24 - /* editor padding */ 8 - /* filter button padding */ 22, 
            /* line height */ 27 - /* editor padding */ 4));
        }
        /**
         * Focuses the filter input.
         */
        focus() {
            this.input.focus();
        }
        /**
         * Persists changes to the input history.
         */
        saveState() {
            const history = this.input.getHistory();
            if (history.length) {
                this.history.store(history);
            }
            else {
                this.history.delete();
            }
        }
        /**
         * @override
         */
        dispose() {
            this.saveState();
            super.dispose();
        }
        /**
         * Updates the 'checked' state of the filter submenu.
         */
        updateFilterActiveState() {
            this.filtersAction.checked = this.testService.excluded.hasAny;
        }
    };
    TestingExplorerFilter = __decorate([
        __param(1, testExplorerFilterState_1.ITestExplorerFilterState),
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, testService_1.ITestService)
    ], TestingExplorerFilter);
    exports.TestingExplorerFilter = TestingExplorerFilter;
    let FiltersDropdownMenuActionViewItem = class FiltersDropdownMenuActionViewItem extends dropdownActionViewItem_1.DropdownMenuActionViewItem {
        constructor(action, filters, actionRunner, contextMenuService, testService) {
            super(action, { getActions: () => this.getActions() }, contextMenuService, {
                actionRunner,
                classNames: action.class,
                anchorAlignmentProvider: () => 1 /* AnchorAlignment.RIGHT */,
                menuAsChild: true
            });
            this.filters = filters;
            this.testService = testService;
        }
        render(container) {
            super.render(container);
            this.updateChecked();
        }
        getActions() {
            return [
                ...["@failed" /* TestFilterTerm.Failed */, "@executed" /* TestFilterTerm.Executed */, "@doc" /* TestFilterTerm.CurrentDoc */].map(term => ({
                    checked: this.filters.isFilteringFor(term),
                    class: undefined,
                    enabled: true,
                    id: term,
                    label: testFilterDescriptions[term],
                    run: () => this.filters.toggleFilteringFor(term),
                    tooltip: '',
                    dispose: () => null
                })),
                new actions_1.Separator(),
                {
                    checked: this.filters.fuzzy.value,
                    class: undefined,
                    enabled: true,
                    id: 'fuzzy',
                    label: (0, nls_1.localize)('testing.filters.fuzzyMatch', "Fuzzy Match"),
                    run: () => this.filters.fuzzy.value = !this.filters.fuzzy.value,
                    tooltip: '',
                    dispose: () => null
                },
                new actions_1.Separator(),
                {
                    checked: this.filters.isFilteringFor("@hidden" /* TestFilterTerm.Hidden */),
                    class: undefined,
                    enabled: this.testService.excluded.hasAny,
                    id: 'showExcluded',
                    label: (0, nls_1.localize)('testing.filters.showExcludedTests', "Show Hidden Tests"),
                    run: () => this.filters.toggleFilteringFor("@hidden" /* TestFilterTerm.Hidden */),
                    tooltip: '',
                    dispose: () => null
                },
                {
                    checked: false,
                    class: undefined,
                    enabled: this.testService.excluded.hasAny,
                    id: 'removeExcluded',
                    label: (0, nls_1.localize)('testing.filters.removeTestExclusions', "Unhide All Tests"),
                    run: async () => this.testService.excluded.clear(),
                    tooltip: '',
                    dispose: () => null
                }
            ];
        }
        updateChecked() {
            this.element.classList.toggle('checked', this._action.checked);
        }
    };
    FiltersDropdownMenuActionViewItem = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, testService_1.ITestService)
    ], FiltersDropdownMenuActionViewItem);
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: "workbench.actions.treeView.testExplorer.filter" /* TestCommandId.FilterAction */,
                title: (0, nls_1.localize)('filter', "Filter"),
            });
        }
        async run() { }
    });
});
//# sourceMappingURL=testingExplorerFilter.js.map