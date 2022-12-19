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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/aria/aria", "vs/base/common/async", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/types", "vs/base/common/uri", "vs/editor/browser/editorBrowser", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/editor/common/core/selection", "vs/editor/contrib/find/browser/findController", "vs/editor/contrib/multicursor/browser/multicursor", "vs/nls", "vs/platform/accessibility/common/accessibility", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/theme", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/actions/workspaceActions", "vs/workbench/browser/dnd", "vs/workbench/browser/labels", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/memento", "vs/workbench/common/views", "vs/workbench/contrib/notebook/browser/contrib/find/notebookFindWidget", "vs/workbench/contrib/notebook/browser/notebookEditor", "vs/workbench/contrib/search/browser/patternInputWidget", "vs/workbench/contrib/search/browser/searchActions", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/contrib/search/browser/searchMessage", "vs/workbench/contrib/search/browser/searchResultsView", "vs/workbench/contrib/search/browser/searchWidget", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/search/common/replace", "vs/workbench/contrib/search/common/search", "vs/workbench/contrib/search/common/searchHistoryService", "vs/workbench/contrib/search/common/searchModel", "vs/workbench/contrib/searchEditor/browser/searchEditorActions", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/services/search/common/search", "vs/workbench/services/textfile/common/textfiles", "vs/css!./media/searchview"], function (require, exports, dom, keyboardEvent_1, aria, async_1, color_1, errors, event_1, iterator_1, lifecycle_1, env, strings, types_1, uri_1, editorBrowser_1, codeEditorService_1, embeddedCodeEditorWidget_1, selection_1, findController_1, multicursor_1, nls, accessibility_1, menuEntryActionViewItem_1, actions_1, commands_1, configuration_1, contextkey_1, contextView_1, dialogs_1, files_1, instantiation_1, serviceCollection_1, keybinding_1, listService_1, notification_1, opener_1, progress_1, storage_1, telemetry_1, colorRegistry_1, theme_1, themeService_1, workspace_1, workspaceActions_1, dnd_1, labels_1, viewPane_1, memento_1, views_1, notebookFindWidget_1, notebookEditor_1, patternInputWidget_1, searchActions_1, searchIcons_1, searchMessage_1, searchResultsView_1, searchWidget_1, Constants, replace_1, search_1, searchHistoryService_1, searchModel_1, searchEditorActions_1, editorService_1, preferences_1, queryBuilder_1, search_2, textfiles_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchView = exports.SearchViewPosition = void 0;
    const $ = dom.$;
    var SearchViewPosition;
    (function (SearchViewPosition) {
        SearchViewPosition[SearchViewPosition["SideBar"] = 0] = "SideBar";
        SearchViewPosition[SearchViewPosition["Panel"] = 1] = "Panel";
    })(SearchViewPosition = exports.SearchViewPosition || (exports.SearchViewPosition = {}));
    const SEARCH_CANCELLED_MESSAGE = nls.localize('searchCanceled', "Search was canceled before any results could be found - ");
    let SearchView = class SearchView extends viewPane_1.ViewPane {
        constructor(options, fileService, editorService, codeEditorService, progressService, notificationService, dialogService, commandService, contextViewService, instantiationService, viewDescriptorService, configurationService, contextService, searchWorkbenchService, contextKeyService, replaceService, textFileService, preferencesService, themeService, searchHistoryService, contextMenuService, menuService, accessibilityService, keybindingService, storageService, openerService, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.fileService = fileService;
            this.editorService = editorService;
            this.codeEditorService = codeEditorService;
            this.progressService = progressService;
            this.notificationService = notificationService;
            this.dialogService = dialogService;
            this.commandService = commandService;
            this.contextViewService = contextViewService;
            this.contextService = contextService;
            this.searchWorkbenchService = searchWorkbenchService;
            this.replaceService = replaceService;
            this.textFileService = textFileService;
            this.preferencesService = preferencesService;
            this.searchHistoryService = searchHistoryService;
            this.menuService = menuService;
            this.accessibilityService = accessibilityService;
            this.isDisposed = false;
            this.lastFocusState = 'input';
            this.contextMenu = null;
            this.messageDisposables = new lifecycle_1.DisposableStore();
            this.changedWhileHidden = false;
            this.currentSearchQ = Promise.resolve();
            this.pauseSearching = false;
            this.container = dom.$('.search-view');
            // globals
            this.viewletVisible = Constants.SearchViewVisibleKey.bindTo(this.contextKeyService);
            this.firstMatchFocused = Constants.FirstMatchFocusKey.bindTo(this.contextKeyService);
            this.fileMatchOrMatchFocused = Constants.FileMatchOrMatchFocusKey.bindTo(this.contextKeyService);
            this.fileMatchOrFolderMatchFocus = Constants.FileMatchOrFolderMatchFocusKey.bindTo(this.contextKeyService);
            this.fileMatchOrFolderMatchWithResourceFocus = Constants.FileMatchOrFolderMatchWithResourceFocusKey.bindTo(this.contextKeyService);
            this.fileMatchFocused = Constants.FileFocusKey.bindTo(this.contextKeyService);
            this.folderMatchFocused = Constants.FolderFocusKey.bindTo(this.contextKeyService);
            this.hasSearchResultsKey = Constants.HasSearchResults.bindTo(this.contextKeyService);
            this.matchFocused = Constants.MatchFocusKey.bindTo(this.contextKeyService);
            this.searchStateKey = search_1.SearchStateKey.bindTo(this.contextKeyService);
            this.hasSearchPatternKey = Constants.ViewHasSearchPatternKey.bindTo(this.contextKeyService);
            this.hasReplacePatternKey = Constants.ViewHasReplacePatternKey.bindTo(this.contextKeyService);
            this.hasFilePatternKey = Constants.ViewHasFilePatternKey.bindTo(this.contextKeyService);
            this.hasSomeCollapsibleResultKey = Constants.ViewHasSomeCollapsibleKey.bindTo(this.contextKeyService);
            // scoped
            this.contextKeyService = this._register(this.contextKeyService.createScoped(this.container));
            Constants.SearchViewFocusedKey.bindTo(this.contextKeyService).set(true);
            this.inputBoxFocused = Constants.InputBoxFocusedKey.bindTo(this.contextKeyService);
            this.inputPatternIncludesFocused = Constants.PatternIncludesFocusedKey.bindTo(this.contextKeyService);
            this.inputPatternExclusionsFocused = Constants.PatternExcludesFocusedKey.bindTo(this.contextKeyService);
            this.instantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this.contextKeyService]));
            this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('search.sortOrder')) {
                    if (this.searchConfig.sortOrder === "modified" /* SearchSortOrder.Modified */) {
                        // If changing away from modified, remove all fileStats
                        // so that updated files are re-retrieved next time.
                        this.removeFileStats();
                    }
                    this.refreshTree();
                }
            });
            this.viewModel = this._register(this.searchWorkbenchService.searchModel);
            this.queryBuilder = this.instantiationService.createInstance(queryBuilder_1.QueryBuilder);
            this.memento = new memento_1.Memento(this.id, storageService);
            this.viewletState = this.memento.getMemento(1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            this._register(this.fileService.onDidFilesChange(e => this.onFilesChanged(e)));
            this._register(this.textFileService.untitled.onWillDispose(model => this.onUntitledDidDispose(model.resource)));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.onDidChangeWorkbenchState()));
            this._register(this.searchHistoryService.onDidClearHistory(() => this.clearHistory()));
            this.delayedRefresh = this._register(new async_1.Delayer(250));
            this.addToSearchHistoryDelayer = this._register(new async_1.Delayer(2000));
            this.toggleCollapseStateDelayer = this._register(new async_1.Delayer(100));
            this.triggerQueryDelayer = this._register(new async_1.Delayer(0));
            this.treeAccessibilityProvider = this.instantiationService.createInstance(searchResultsView_1.SearchAccessibilityProvider, this.viewModel);
        }
        get state() {
            var _a;
            return (_a = this.searchStateKey.get()) !== null && _a !== void 0 ? _a : search_1.SearchUIState.Idle;
        }
        set state(v) {
            this.searchStateKey.set(v);
        }
        getContainer() {
            return this.container;
        }
        get searchResult() {
            return this.viewModel && this.viewModel.searchResult;
        }
        onDidChangeWorkbenchState() {
            if (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ && this.searchWithoutFolderMessageElement) {
                dom.hide(this.searchWithoutFolderMessageElement);
            }
        }
        renderBody(parent) {
            super.renderBody(parent);
            this.container = dom.append(parent, dom.$('.search-view'));
            this.searchWidgetsContainerElement = dom.append(this.container, $('.search-widgets-container'));
            this.createSearchWidget(this.searchWidgetsContainerElement);
            const history = this.searchHistoryService.load();
            const filePatterns = this.viewletState['query.filePatterns'] || '';
            const patternExclusions = this.viewletState['query.folderExclusions'] || '';
            const patternExclusionsHistory = history.exclude || [];
            const patternIncludes = this.viewletState['query.folderIncludes'] || '';
            const patternIncludesHistory = history.include || [];
            const onlyOpenEditors = this.viewletState['query.onlyOpenEditors'] || false;
            const queryDetailsExpanded = this.viewletState['query.queryDetailsExpanded'] || '';
            const useExcludesAndIgnoreFiles = typeof this.viewletState['query.useExcludesAndIgnoreFiles'] === 'boolean' ?
                this.viewletState['query.useExcludesAndIgnoreFiles'] : true;
            this.queryDetails = dom.append(this.searchWidgetsContainerElement, $('.query-details'));
            // Toggle query details button
            this.toggleQueryDetailsButton = dom.append(this.queryDetails, $('.more' + themeService_1.ThemeIcon.asCSSSelector(searchIcons_1.searchDetailsIcon), { tabindex: 0, role: 'button', title: nls.localize('moreSearch', "Toggle Search Details") }));
            this._register(dom.addDisposableListener(this.toggleQueryDetailsButton, dom.EventType.CLICK, e => {
                dom.EventHelper.stop(e);
                this.toggleQueryDetails(!this.accessibilityService.isScreenReaderOptimized());
            }));
            this._register(dom.addDisposableListener(this.toggleQueryDetailsButton, dom.EventType.KEY_UP, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */)) {
                    dom.EventHelper.stop(e);
                    this.toggleQueryDetails(false);
                }
            }));
            this._register(dom.addDisposableListener(this.toggleQueryDetailsButton, dom.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */)) {
                    if (this.searchWidget.isReplaceActive()) {
                        this.searchWidget.focusReplaceAllAction();
                    }
                    else {
                        this.searchWidget.isReplaceShown() ? this.searchWidget.replaceInput.focusOnPreserve() : this.searchWidget.focusRegexAction();
                    }
                    dom.EventHelper.stop(e);
                }
            }));
            // folder includes list
            const folderIncludesList = dom.append(this.queryDetails, $('.file-types.includes'));
            const filesToIncludeTitle = nls.localize('searchScope.includes', "files to include");
            dom.append(folderIncludesList, $('h4', undefined, filesToIncludeTitle));
            this.inputPatternIncludes = this._register(this.instantiationService.createInstance(patternInputWidget_1.IncludePatternInputWidget, folderIncludesList, this.contextViewService, {
                ariaLabel: filesToIncludeTitle,
                placeholder: nls.localize('placeholder.includes', "e.g. *.ts, src/**/include"),
                showPlaceholderOnFocus: true,
                history: patternIncludesHistory,
            }));
            this.inputPatternIncludes.setValue(patternIncludes);
            this.inputPatternIncludes.setOnlySearchInOpenEditors(onlyOpenEditors);
            this._register(this.inputPatternIncludes.onCancel(() => this.cancelSearch(false)));
            this._register(this.inputPatternIncludes.onChangeSearchInEditorsBox(() => this.triggerQueryChange()));
            this.trackInputBox(this.inputPatternIncludes.inputFocusTracker, this.inputPatternIncludesFocused);
            // excludes list
            const excludesList = dom.append(this.queryDetails, $('.file-types.excludes'));
            const excludesTitle = nls.localize('searchScope.excludes', "files to exclude");
            dom.append(excludesList, $('h4', undefined, excludesTitle));
            this.inputPatternExcludes = this._register(this.instantiationService.createInstance(patternInputWidget_1.ExcludePatternInputWidget, excludesList, this.contextViewService, {
                ariaLabel: excludesTitle,
                placeholder: nls.localize('placeholder.excludes', "e.g. *.ts, src/**/exclude"),
                showPlaceholderOnFocus: true,
                history: patternExclusionsHistory,
            }));
            this.inputPatternExcludes.setValue(patternExclusions);
            this.inputPatternExcludes.setUseExcludesAndIgnoreFiles(useExcludesAndIgnoreFiles);
            this._register(this.inputPatternExcludes.onCancel(() => this.cancelSearch(false)));
            this._register(this.inputPatternExcludes.onChangeIgnoreBox(() => this.triggerQueryChange()));
            this.trackInputBox(this.inputPatternExcludes.inputFocusTracker, this.inputPatternExclusionsFocused);
            const updateHasFilePatternKey = () => this.hasFilePatternKey.set(this.inputPatternIncludes.getValue().length > 0 || this.inputPatternExcludes.getValue().length > 0);
            updateHasFilePatternKey();
            const onFilePatternSubmit = (triggeredOnType) => {
                this.triggerQueryChange({ triggeredOnType, delay: this.searchConfig.searchOnTypeDebouncePeriod });
                if (triggeredOnType) {
                    updateHasFilePatternKey();
                }
            };
            this._register(this.inputPatternIncludes.onSubmit(onFilePatternSubmit));
            this._register(this.inputPatternExcludes.onSubmit(onFilePatternSubmit));
            this.messagesElement = dom.append(this.container, $('.messages.text-search-provider-messages'));
            if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                this.showSearchWithoutFolderMessage();
            }
            this.createSearchResultsView(this.container);
            if (filePatterns !== '' || patternExclusions !== '' || patternIncludes !== '' || queryDetailsExpanded !== '' || !useExcludesAndIgnoreFiles) {
                this.toggleQueryDetails(true, true, true);
            }
            this._register(this.viewModel.searchResult.onChange((event) => this.onSearchResultsChanged(event)));
            this._register(this.onDidChangeBodyVisibility(visible => this.onVisibilityChanged(visible)));
        }
        onVisibilityChanged(visible) {
            this.viewletVisible.set(visible);
            if (visible) {
                if (this.changedWhileHidden) {
                    // Render if results changed while viewlet was hidden - #37818
                    this.refreshAndUpdateCount();
                    this.changedWhileHidden = false;
                }
            }
            else {
                // Reset last focus to input to preserve opening the viewlet always focusing the query editor.
                this.lastFocusState = 'input';
            }
            // Enable highlights if there are searchresults
            if (this.viewModel) {
                this.viewModel.searchResult.toggleHighlights(visible);
            }
        }
        get searchAndReplaceWidget() {
            return this.searchWidget;
        }
        get searchIncludePattern() {
            return this.inputPatternIncludes;
        }
        get searchExcludePattern() {
            return this.inputPatternExcludes;
        }
        createSearchWidget(container) {
            const contentPattern = this.viewletState['query.contentPattern'] || '';
            const replaceText = this.viewletState['query.replaceText'] || '';
            const isRegex = this.viewletState['query.regex'] === true;
            const isWholeWords = this.viewletState['query.wholeWords'] === true;
            const isCaseSensitive = this.viewletState['query.caseSensitive'] === true;
            const history = this.searchHistoryService.load();
            const searchHistory = history.search || this.viewletState['query.searchHistory'] || [];
            const replaceHistory = history.replace || this.viewletState['query.replaceHistory'] || [];
            const showReplace = typeof this.viewletState['view.showReplace'] === 'boolean' ? this.viewletState['view.showReplace'] : true;
            const preserveCase = this.viewletState['query.preserveCase'] === true;
            this.searchWidget = this._register(this.instantiationService.createInstance(searchWidget_1.SearchWidget, container, {
                value: contentPattern,
                replaceValue: replaceText,
                isRegex: isRegex,
                isCaseSensitive: isCaseSensitive,
                isWholeWords: isWholeWords,
                searchHistory: searchHistory,
                replaceHistory: replaceHistory,
                preserveCase: preserveCase
            }));
            if (showReplace) {
                this.searchWidget.toggleReplace(true);
            }
            this._register(this.searchWidget.onSearchSubmit(options => this.triggerQueryChange(options)));
            this._register(this.searchWidget.onSearchCancel(({ focus }) => this.cancelSearch(focus)));
            this._register(this.searchWidget.searchInput.onDidOptionChange(() => this.triggerQueryChange()));
            const updateHasPatternKey = () => this.hasSearchPatternKey.set(this.searchWidget.searchInput.getValue().length > 0);
            updateHasPatternKey();
            this._register(this.searchWidget.searchInput.onDidChange(() => updateHasPatternKey()));
            const updateHasReplacePatternKey = () => this.hasReplacePatternKey.set(this.searchWidget.getReplaceValue().length > 0);
            updateHasReplacePatternKey();
            this._register(this.searchWidget.replaceInput.inputBox.onDidChange(() => updateHasReplacePatternKey()));
            this._register(this.searchWidget.onDidHeightChange(() => this.reLayout()));
            this._register(this.searchWidget.onReplaceToggled(() => this.reLayout()));
            this._register(this.searchWidget.onReplaceStateChange((state) => {
                this.viewModel.replaceActive = state;
                this.refreshTree();
            }));
            this._register(this.searchWidget.onPreserveCaseChange((state) => {
                this.viewModel.preserveCase = state;
                this.refreshTree();
            }));
            this._register(this.searchWidget.onReplaceValueChanged(() => {
                this.viewModel.replaceString = this.searchWidget.getReplaceValue();
                this.delayedRefresh.trigger(() => this.refreshTree());
            }));
            this._register(this.searchWidget.onBlur(() => {
                this.toggleQueryDetailsButton.focus();
            }));
            this._register(this.searchWidget.onReplaceAll(() => this.replaceAll()));
            this.trackInputBox(this.searchWidget.searchInputFocusTracker);
            this.trackInputBox(this.searchWidget.replaceInputFocusTracker);
        }
        trackInputBox(inputFocusTracker, contextKey) {
            this._register(inputFocusTracker.onDidFocus(() => {
                this.lastFocusState = 'input';
                this.inputBoxFocused.set(true);
                if (contextKey) {
                    contextKey.set(true);
                }
            }));
            this._register(inputFocusTracker.onDidBlur(() => {
                this.inputBoxFocused.set(this.searchWidget.searchInputHasFocus()
                    || this.searchWidget.replaceInputHasFocus()
                    || this.inputPatternIncludes.inputHasFocus()
                    || this.inputPatternExcludes.inputHasFocus());
                if (contextKey) {
                    contextKey.set(false);
                }
            }));
        }
        onSearchResultsChanged(event) {
            if (this.isVisible()) {
                return this.refreshAndUpdateCount(event);
            }
            else {
                this.changedWhileHidden = true;
            }
        }
        refreshAndUpdateCount(event) {
            var _a;
            this.searchWidget.setReplaceAllActionState(!this.viewModel.searchResult.isEmpty());
            this.updateSearchResultCount(this.viewModel.searchResult.query.userDisabledExcludesAndIgnoreFiles, (_a = this.viewModel.searchResult.query) === null || _a === void 0 ? void 0 : _a.onlyOpenEditors);
            return this.refreshTree(event);
        }
        refreshTree(event) {
            const collapseResults = this.searchConfig.collapseResults;
            if (!event || event.added || event.removed) {
                // Refresh whole tree
                if (this.searchConfig.sortOrder === "modified" /* SearchSortOrder.Modified */) {
                    // Ensure all matches have retrieved their file stat
                    this.retrieveFileStats()
                        .then(() => this.tree.setChildren(null, this.createResultIterator(collapseResults)));
                }
                else {
                    this.tree.setChildren(null, this.createResultIterator(collapseResults));
                }
            }
            else {
                // If updated counts affect our search order, re-sort the view.
                if (this.searchConfig.sortOrder === "countAscending" /* SearchSortOrder.CountAscending */ ||
                    this.searchConfig.sortOrder === "countDescending" /* SearchSortOrder.CountDescending */) {
                    this.tree.setChildren(null, this.createResultIterator(collapseResults));
                }
                else {
                    // FileMatch modified, refresh those elements
                    event.elements.forEach(element => {
                        this.tree.setChildren(element, this.createIterator(element, collapseResults));
                        this.tree.rerender(element);
                    });
                }
            }
        }
        createResultIterator(collapseResults) {
            const folderMatches = this.searchResult.folderMatches()
                .filter(fm => !fm.isEmpty())
                .sort(searchModel_1.searchMatchComparer);
            if (folderMatches.length === 1) {
                return this.createFolderIterator(folderMatches[0], collapseResults);
            }
            return iterator_1.Iterable.map(folderMatches, folderMatch => {
                const children = this.createFolderIterator(folderMatch, collapseResults);
                return { element: folderMatch, children };
            });
        }
        createFolderIterator(folderMatch, collapseResults) {
            const sortOrder = this.searchConfig.sortOrder;
            const matches = folderMatch.matches().sort((a, b) => (0, searchModel_1.searchMatchComparer)(a, b, sortOrder));
            return iterator_1.Iterable.map(matches, fileMatch => {
                const children = this.createFileIterator(fileMatch);
                let nodeExists = true;
                try {
                    this.tree.getNode(fileMatch);
                }
                catch (e) {
                    nodeExists = false;
                }
                const collapsed = nodeExists ? undefined :
                    (collapseResults === 'alwaysCollapse' || (fileMatch.matches().length > 10 && collapseResults !== 'alwaysExpand'));
                return { element: fileMatch, children, collapsed };
            });
        }
        createFileIterator(fileMatch) {
            const matches = fileMatch.matches().sort(searchModel_1.searchMatchComparer);
            return iterator_1.Iterable.map(matches, r => ({ element: r }));
        }
        createIterator(match, collapseResults) {
            return match instanceof searchModel_1.SearchResult ? this.createResultIterator(collapseResults) :
                match instanceof searchModel_1.FolderMatch ? this.createFolderIterator(match, collapseResults) :
                    this.createFileIterator(match);
        }
        replaceAll() {
            if (this.viewModel.searchResult.count() === 0) {
                return;
            }
            const occurrences = this.viewModel.searchResult.count();
            const fileCount = this.viewModel.searchResult.fileCount();
            const replaceValue = this.searchWidget.getReplaceValue() || '';
            const afterReplaceAllMessage = this.buildAfterReplaceAllMessage(occurrences, fileCount, replaceValue);
            let progressComplete;
            let progressReporter;
            this.progressService.withProgress({ location: this.getProgressLocation(), delay: 100, total: occurrences }, p => {
                progressReporter = p;
                return new Promise(resolve => progressComplete = resolve);
            });
            const confirmation = {
                title: nls.localize('replaceAll.confirmation.title', "Replace All"),
                message: this.buildReplaceAllConfirmationMessage(occurrences, fileCount, replaceValue),
                primaryButton: nls.localize('replaceAll.confirm.button', "&&Replace"),
                type: 'question'
            };
            this.dialogService.confirm(confirmation).then(res => {
                if (res.confirmed) {
                    this.searchWidget.setReplaceAllActionState(false);
                    this.viewModel.searchResult.replaceAll(progressReporter).then(() => {
                        progressComplete();
                        const messageEl = this.clearMessage();
                        dom.append(messageEl, afterReplaceAllMessage);
                        this.reLayout();
                    }, (error) => {
                        progressComplete();
                        errors.isCancellationError(error);
                        this.notificationService.error(error);
                    });
                }
            });
        }
        buildAfterReplaceAllMessage(occurrences, fileCount, replaceValue) {
            if (occurrences === 1) {
                if (fileCount === 1) {
                    if (replaceValue) {
                        return nls.localize('replaceAll.occurrence.file.message', "Replaced {0} occurrence across {1} file with '{2}'.", occurrences, fileCount, replaceValue);
                    }
                    return nls.localize('removeAll.occurrence.file.message', "Replaced {0} occurrence across {1} file.", occurrences, fileCount);
                }
                if (replaceValue) {
                    return nls.localize('replaceAll.occurrence.files.message', "Replaced {0} occurrence across {1} files with '{2}'.", occurrences, fileCount, replaceValue);
                }
                return nls.localize('removeAll.occurrence.files.message', "Replaced {0} occurrence across {1} files.", occurrences, fileCount);
            }
            if (fileCount === 1) {
                if (replaceValue) {
                    return nls.localize('replaceAll.occurrences.file.message', "Replaced {0} occurrences across {1} file with '{2}'.", occurrences, fileCount, replaceValue);
                }
                return nls.localize('removeAll.occurrences.file.message', "Replaced {0} occurrences across {1} file.", occurrences, fileCount);
            }
            if (replaceValue) {
                return nls.localize('replaceAll.occurrences.files.message', "Replaced {0} occurrences across {1} files with '{2}'.", occurrences, fileCount, replaceValue);
            }
            return nls.localize('removeAll.occurrences.files.message', "Replaced {0} occurrences across {1} files.", occurrences, fileCount);
        }
        buildReplaceAllConfirmationMessage(occurrences, fileCount, replaceValue) {
            if (occurrences === 1) {
                if (fileCount === 1) {
                    if (replaceValue) {
                        return nls.localize('removeAll.occurrence.file.confirmation.message', "Replace {0} occurrence across {1} file with '{2}'?", occurrences, fileCount, replaceValue);
                    }
                    return nls.localize('replaceAll.occurrence.file.confirmation.message', "Replace {0} occurrence across {1} file?", occurrences, fileCount);
                }
                if (replaceValue) {
                    return nls.localize('removeAll.occurrence.files.confirmation.message', "Replace {0} occurrence across {1} files with '{2}'?", occurrences, fileCount, replaceValue);
                }
                return nls.localize('replaceAll.occurrence.files.confirmation.message', "Replace {0} occurrence across {1} files?", occurrences, fileCount);
            }
            if (fileCount === 1) {
                if (replaceValue) {
                    return nls.localize('removeAll.occurrences.file.confirmation.message', "Replace {0} occurrences across {1} file with '{2}'?", occurrences, fileCount, replaceValue);
                }
                return nls.localize('replaceAll.occurrences.file.confirmation.message', "Replace {0} occurrences across {1} file?", occurrences, fileCount);
            }
            if (replaceValue) {
                return nls.localize('removeAll.occurrences.files.confirmation.message', "Replace {0} occurrences across {1} files with '{2}'?", occurrences, fileCount, replaceValue);
            }
            return nls.localize('replaceAll.occurrences.files.confirmation.message', "Replace {0} occurrences across {1} files?", occurrences, fileCount);
        }
        clearMessage() {
            this.searchWithoutFolderMessageElement = undefined;
            const wasHidden = this.messagesElement.style.display === 'none';
            dom.clearNode(this.messagesElement);
            dom.show(this.messagesElement);
            this.messageDisposables.clear();
            const newMessage = dom.append(this.messagesElement, $('.message'));
            if (wasHidden) {
                this.reLayout();
            }
            return newMessage;
        }
        createSearchResultsView(container) {
            this.resultsElement = dom.append(container, $('.results.show-file-icons'));
            const delegate = this.instantiationService.createInstance(searchResultsView_1.SearchDelegate);
            const identityProvider = {
                getId(element) {
                    return element.id();
                }
            };
            this.treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility }));
            this.tree = this._register(this.instantiationService.createInstance(listService_1.WorkbenchObjectTree, 'SearchView', this.resultsElement, delegate, [
                this._register(this.instantiationService.createInstance(searchResultsView_1.FolderMatchRenderer, this.viewModel, this, this.treeLabels)),
                this._register(this.instantiationService.createInstance(searchResultsView_1.FileMatchRenderer, this.viewModel, this, this.treeLabels)),
                this._register(this.instantiationService.createInstance(searchResultsView_1.MatchRenderer, this.viewModel, this)),
            ], {
                identityProvider,
                accessibilityProvider: this.treeAccessibilityProvider,
                dnd: this.instantiationService.createInstance(dnd_1.ResourceListDnDHandler, element => {
                    if (element instanceof searchModel_1.FileMatch) {
                        return element.resource;
                    }
                    if (element instanceof searchModel_1.Match) {
                        return (0, opener_1.withSelection)(element.parent().resource, element.range());
                    }
                    return null;
                }),
                multipleSelectionSupport: false,
                selectionNavigation: true,
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                },
                additionalScrollHeight: searchResultsView_1.SearchDelegate.ITEM_HEIGHT
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            const updateHasSomeCollapsible = () => this.toggleCollapseStateDelayer.trigger(() => this.hasSomeCollapsibleResultKey.set(this.hasSomeCollapsible()));
            updateHasSomeCollapsible();
            this._register(this.viewModel.searchResult.onChange(() => updateHasSomeCollapsible()));
            this._register(this.tree.onDidChangeCollapseState(() => updateHasSomeCollapsible()));
            this._register(event_1.Event.debounce(this.tree.onDidOpen, (last, event) => event, 75, true)(options => {
                if (options.element instanceof searchModel_1.Match) {
                    const selectedMatch = options.element;
                    if (this.currentSelectedFileMatch) {
                        this.currentSelectedFileMatch.setSelectedMatch(null);
                    }
                    this.currentSelectedFileMatch = selectedMatch.parent();
                    this.currentSelectedFileMatch.setSelectedMatch(selectedMatch);
                    this.onFocus(selectedMatch, options.editorOptions.preserveFocus, options.sideBySide, options.editorOptions.pinned);
                }
            }));
            this._register(event_1.Event.any(this.tree.onDidFocus, this.tree.onDidChangeFocus)(() => {
                if (this.tree.isDOMFocused()) {
                    const focus = this.tree.getFocus()[0];
                    this.firstMatchFocused.set(this.tree.navigate().first() === focus);
                    this.fileMatchOrMatchFocused.set(!!focus);
                    this.fileMatchFocused.set(focus instanceof searchModel_1.FileMatch);
                    this.folderMatchFocused.set(focus instanceof searchModel_1.FolderMatch);
                    this.matchFocused.set(focus instanceof searchModel_1.Match);
                    this.fileMatchOrFolderMatchFocus.set(focus instanceof searchModel_1.FileMatch || focus instanceof searchModel_1.FolderMatch);
                    this.fileMatchOrFolderMatchWithResourceFocus.set(focus instanceof searchModel_1.FileMatch || focus instanceof searchModel_1.FolderMatchWithResource);
                    this.lastFocusState = 'tree';
                }
            }));
            this._register(this.tree.onDidBlur(() => {
                this.firstMatchFocused.reset();
                this.fileMatchOrMatchFocused.reset();
                this.fileMatchFocused.reset();
                this.folderMatchFocused.reset();
                this.matchFocused.reset();
                this.fileMatchOrFolderMatchFocus.reset();
                this.fileMatchOrFolderMatchWithResourceFocus.reset();
            }));
        }
        onContextMenu(e) {
            if (!this.contextMenu) {
                this.contextMenu = this._register(this.menuService.createMenu(actions_1.MenuId.SearchContext, this.contextKeyService));
            }
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
            const actions = [];
            const actionsDisposable = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(this.contextMenu, { shouldForwardArgs: true }, actions);
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => e.element,
                onHide: () => (0, lifecycle_1.dispose)(actionsDisposable)
            });
        }
        hasSomeCollapsible() {
            const viewer = this.getControl();
            const navigator = viewer.navigate();
            let node = navigator.first();
            do {
                if (!viewer.isCollapsed(node)) {
                    return true;
                }
            } while (node = navigator.next());
            return false;
        }
        selectNextMatch() {
            if (!this.hasSearchResults()) {
                return;
            }
            const [selected] = this.tree.getSelection();
            // Expand the initial selected node, if needed
            if (selected && !(selected instanceof searchModel_1.Match)) {
                if (this.tree.isCollapsed(selected)) {
                    this.tree.expand(selected);
                }
            }
            const navigator = this.tree.navigate(selected);
            let next = navigator.next();
            if (!next) {
                next = navigator.first();
            }
            // Expand until first child is a Match
            while (next && !(next instanceof searchModel_1.Match)) {
                if (this.tree.isCollapsed(next)) {
                    this.tree.expand(next);
                }
                // Select the first child
                next = navigator.next();
            }
            // Reveal the newly selected element
            if (next) {
                if (next === selected) {
                    this.tree.setFocus([]);
                }
                const event = (0, listService_1.getSelectionKeyboardEvent)(undefined, false, false);
                this.tree.setFocus([next], event);
                this.tree.setSelection([next], event);
                this.tree.reveal(next);
                const ariaLabel = this.treeAccessibilityProvider.getAriaLabel(next);
                if (ariaLabel) {
                    aria.alert(ariaLabel);
                }
            }
        }
        selectPreviousMatch() {
            if (!this.hasSearchResults()) {
                return;
            }
            const [selected] = this.tree.getSelection();
            let navigator = this.tree.navigate(selected);
            let prev = navigator.previous();
            // Select previous until find a Match or a collapsed item
            while (!prev || (!(prev instanceof searchModel_1.Match) && !this.tree.isCollapsed(prev))) {
                const nextPrev = prev ? navigator.previous() : navigator.last();
                if (!prev && !nextPrev) {
                    return;
                }
                prev = nextPrev;
            }
            // Expand until last child is a Match
            while (!(prev instanceof searchModel_1.Match)) {
                const nextItem = navigator.next();
                this.tree.expand(prev);
                navigator = this.tree.navigate(nextItem); // recreate navigator because modifying the tree can invalidate it
                prev = nextItem ? navigator.previous() : navigator.last(); // select last child
            }
            // Reveal the newly selected element
            if (prev) {
                if (prev === selected) {
                    this.tree.setFocus([]);
                }
                const event = (0, listService_1.getSelectionKeyboardEvent)(undefined, false, false);
                this.tree.setFocus([prev], event);
                this.tree.setSelection([prev], event);
                this.tree.reveal(prev);
                const ariaLabel = this.treeAccessibilityProvider.getAriaLabel(prev);
                if (ariaLabel) {
                    aria.alert(ariaLabel);
                }
            }
        }
        moveFocusToResults() {
            this.tree.domFocus();
        }
        focus() {
            super.focus();
            if (this.lastFocusState === 'input' || !this.hasSearchResults()) {
                const updatedText = this.searchConfig.seedOnFocus ? this.updateTextFromSelection({ allowSearchOnType: false }) : false;
                this.searchWidget.focus(undefined, undefined, updatedText);
            }
            else {
                this.tree.domFocus();
            }
        }
        updateTextFromFindWidgetOrSelection({ allowUnselectedWord = true, allowSearchOnType = true }) {
            var _a;
            let activeEditor = this.editorService.activeTextEditorControl;
            if ((0, editorBrowser_1.isCodeEditor)(activeEditor) && !(activeEditor === null || activeEditor === void 0 ? void 0 : activeEditor.hasTextFocus())) {
                const controller = findController_1.CommonFindController.get(activeEditor);
                if (controller && controller.isFindInputFocused()) {
                    return this.updateTextFromFindWidget(controller, { allowSearchOnType });
                }
                const editors = this.codeEditorService.listCodeEditors();
                activeEditor = (_a = editors.find(editor => editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget && editor.getParentEditor() === activeEditor && editor.hasTextFocus())) !== null && _a !== void 0 ? _a : activeEditor;
            }
            return this.updateTextFromSelection({ allowUnselectedWord, allowSearchOnType }, activeEditor);
        }
        updateTextFromFindWidget(controller, { allowSearchOnType = true }) {
            var _a, _b;
            if (!this.searchConfig.seedWithNearestWord && ((_b = (_a = window.getSelection()) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : '') === '') {
                return false;
            }
            const searchString = controller.getState().searchString;
            if (searchString === '') {
                return false;
            }
            this.searchWidget.searchInput.setCaseSensitive(controller.getState().matchCase);
            this.searchWidget.searchInput.setWholeWords(controller.getState().wholeWord);
            this.searchWidget.searchInput.setRegex(controller.getState().isRegex);
            this.updateText(searchString, allowSearchOnType);
            return true;
        }
        updateTextFromSelection({ allowUnselectedWord = true, allowSearchOnType = true }, editor) {
            const seedSearchStringFromSelection = this.configurationService.getValue('editor').find.seedSearchStringFromSelection;
            if (!seedSearchStringFromSelection) {
                return false;
            }
            let selectedText = this.getSearchTextFromEditor(allowUnselectedWord, editor);
            if (selectedText === null) {
                return false;
            }
            if (this.searchWidget.searchInput.getRegex()) {
                selectedText = strings.escapeRegExpCharacters(selectedText);
            }
            this.updateText(selectedText, allowSearchOnType);
            return true;
        }
        updateText(text, allowSearchOnType = true) {
            if (allowSearchOnType && !this.viewModel.searchResult.isDirty) {
                this.searchWidget.setValue(text);
            }
            else {
                this.pauseSearching = true;
                this.searchWidget.setValue(text);
                this.pauseSearching = false;
            }
        }
        focusNextInputBox() {
            if (this.searchWidget.searchInputHasFocus()) {
                if (this.searchWidget.isReplaceShown()) {
                    this.searchWidget.focus(true, true);
                }
                else {
                    this.moveFocusFromSearchOrReplace();
                }
                return;
            }
            if (this.searchWidget.replaceInputHasFocus()) {
                this.moveFocusFromSearchOrReplace();
                return;
            }
            if (this.inputPatternIncludes.inputHasFocus()) {
                this.inputPatternExcludes.focus();
                this.inputPatternExcludes.select();
                return;
            }
            if (this.inputPatternExcludes.inputHasFocus()) {
                this.selectTreeIfNotSelected();
                return;
            }
        }
        moveFocusFromSearchOrReplace() {
            if (this.showsFileTypes()) {
                this.toggleQueryDetails(true, this.showsFileTypes());
            }
            else {
                this.selectTreeIfNotSelected();
            }
        }
        focusPreviousInputBox() {
            if (this.searchWidget.searchInputHasFocus()) {
                return;
            }
            if (this.searchWidget.replaceInputHasFocus()) {
                this.searchWidget.focus(true);
                return;
            }
            if (this.inputPatternIncludes.inputHasFocus()) {
                this.searchWidget.focus(true, true);
                return;
            }
            if (this.inputPatternExcludes.inputHasFocus()) {
                this.inputPatternIncludes.focus();
                this.inputPatternIncludes.select();
                return;
            }
            if (this.tree.isDOMFocused()) {
                this.moveFocusFromResults();
                return;
            }
        }
        moveFocusFromResults() {
            if (this.showsFileTypes()) {
                this.toggleQueryDetails(true, true, false, true);
            }
            else {
                this.searchWidget.focus(true, true);
            }
        }
        reLayout() {
            if (this.isDisposed || !this.size) {
                return;
            }
            const actionsPosition = this.searchConfig.actionsPosition;
            this.getContainer().classList.toggle(SearchView.ACTIONS_RIGHT_CLASS_NAME, actionsPosition === 'right');
            this.searchWidget.setWidth(this.size.width - 28 /* container margin */);
            this.inputPatternExcludes.setWidth(this.size.width - 28 /* container margin */);
            this.inputPatternIncludes.setWidth(this.size.width - 28 /* container margin */);
            const widgetHeight = dom.getTotalHeight(this.searchWidgetsContainerElement);
            const messagesHeight = dom.getTotalHeight(this.messagesElement);
            this.tree.layout(this.size.height - widgetHeight - messagesHeight, this.size.width - 28);
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.size = new dom.Dimension(width, height);
            this.reLayout();
        }
        getControl() {
            return this.tree;
        }
        allSearchFieldsClear() {
            return this.searchWidget.getReplaceValue() === '' &&
                this.searchWidget.searchInput.getValue() === '';
        }
        allFilePatternFieldsClear() {
            return this.searchExcludePattern.getValue() === '' &&
                this.searchIncludePattern.getValue() === '';
        }
        hasSearchResults() {
            return !this.viewModel.searchResult.isEmpty();
        }
        clearSearchResults(clearInput = true) {
            this.viewModel.searchResult.clear();
            this.showEmptyStage(true);
            if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                this.showSearchWithoutFolderMessage();
            }
            if (clearInput) {
                if (this.allSearchFieldsClear()) {
                    this.clearFilePatternFields();
                }
                this.searchWidget.clear();
            }
            this.viewModel.cancelSearch();
            this.tree.ariaLabel = nls.localize('emptySearch', "Empty Search");
            aria.status(nls.localize('ariaSearchResultsClearStatus', "The search results have been cleared"));
            this.reLayout();
        }
        clearFilePatternFields() {
            this.searchExcludePattern.clear();
            this.searchIncludePattern.clear();
        }
        cancelSearch(focus = true) {
            if (this.viewModel.cancelSearch()) {
                if (focus) {
                    this.searchWidget.focus();
                }
                return true;
            }
            return false;
        }
        selectTreeIfNotSelected() {
            if (this.tree.getNode(null)) {
                this.tree.domFocus();
                const selection = this.tree.getSelection();
                if (selection.length === 0) {
                    const event = (0, listService_1.getSelectionKeyboardEvent)();
                    this.tree.focusNext(undefined, undefined, event);
                    this.tree.setSelection(this.tree.getFocus(), event);
                }
            }
        }
        getSearchTextFromEditor(allowUnselectedWord, editor) {
            if (dom.isAncestor(document.activeElement, this.getContainer())) {
                return null;
            }
            editor = editor !== null && editor !== void 0 ? editor : this.editorService.activeTextEditorControl;
            if ((0, editorBrowser_1.isDiffEditor)(editor)) {
                if (editor.getOriginalEditor().hasTextFocus()) {
                    editor = editor.getOriginalEditor();
                }
                else {
                    editor = editor.getModifiedEditor();
                }
            }
            if (!(0, editorBrowser_1.isCodeEditor)(editor) || !editor.hasModel()) {
                return null;
            }
            const range = editor.getSelection();
            if (!range) {
                return null;
            }
            if (range.isEmpty() && this.searchConfig.seedWithNearestWord && allowUnselectedWord) {
                const wordAtPosition = editor.getModel().getWordAtPosition(range.getStartPosition());
                if (wordAtPosition) {
                    return wordAtPosition.word;
                }
            }
            if (!range.isEmpty()) {
                let searchText = '';
                for (let i = range.startLineNumber; i <= range.endLineNumber; i++) {
                    let lineText = editor.getModel().getLineContent(i);
                    if (i === range.endLineNumber) {
                        lineText = lineText.substring(0, range.endColumn - 1);
                    }
                    if (i === range.startLineNumber) {
                        lineText = lineText.substring(range.startColumn - 1);
                    }
                    if (i !== range.startLineNumber) {
                        lineText = '\n' + lineText;
                    }
                    searchText += lineText;
                }
                return searchText;
            }
            return null;
        }
        showsFileTypes() {
            return this.queryDetails.classList.contains('more');
        }
        toggleCaseSensitive() {
            this.searchWidget.searchInput.setCaseSensitive(!this.searchWidget.searchInput.getCaseSensitive());
            this.triggerQueryChange();
        }
        toggleWholeWords() {
            this.searchWidget.searchInput.setWholeWords(!this.searchWidget.searchInput.getWholeWords());
            this.triggerQueryChange();
        }
        toggleRegex() {
            this.searchWidget.searchInput.setRegex(!this.searchWidget.searchInput.getRegex());
            this.triggerQueryChange();
        }
        togglePreserveCase() {
            this.searchWidget.replaceInput.setPreserveCase(!this.searchWidget.replaceInput.getPreserveCase());
            this.triggerQueryChange();
        }
        setSearchParameters(args = {}) {
            if (typeof args.isCaseSensitive === 'boolean') {
                this.searchWidget.searchInput.setCaseSensitive(args.isCaseSensitive);
            }
            if (typeof args.matchWholeWord === 'boolean') {
                this.searchWidget.searchInput.setWholeWords(args.matchWholeWord);
            }
            if (typeof args.isRegex === 'boolean') {
                this.searchWidget.searchInput.setRegex(args.isRegex);
            }
            if (typeof args.filesToInclude === 'string') {
                this.searchIncludePattern.setValue(String(args.filesToInclude));
            }
            if (typeof args.filesToExclude === 'string') {
                this.searchExcludePattern.setValue(String(args.filesToExclude));
            }
            if (typeof args.query === 'string') {
                this.searchWidget.searchInput.setValue(args.query);
            }
            if (typeof args.replace === 'string') {
                this.searchWidget.replaceInput.setValue(args.replace);
            }
            else {
                if (this.searchWidget.replaceInput.getValue() !== '') {
                    this.searchWidget.replaceInput.setValue('');
                }
            }
            if (typeof args.triggerSearch === 'boolean' && args.triggerSearch) {
                this.triggerQueryChange();
            }
            if (typeof args.preserveCase === 'boolean') {
                this.searchWidget.replaceInput.setPreserveCase(args.preserveCase);
            }
            if (typeof args.useExcludeSettingsAndIgnoreFiles === 'boolean') {
                this.inputPatternExcludes.setUseExcludesAndIgnoreFiles(args.useExcludeSettingsAndIgnoreFiles);
            }
            if (typeof args.onlyOpenEditors === 'boolean') {
                this.searchIncludePattern.setOnlySearchInOpenEditors(args.onlyOpenEditors);
            }
        }
        toggleQueryDetails(moveFocus = true, show, skipLayout, reverse) {
            const cls = 'more';
            show = typeof show === 'undefined' ? !this.queryDetails.classList.contains(cls) : Boolean(show);
            this.viewletState['query.queryDetailsExpanded'] = show;
            skipLayout = Boolean(skipLayout);
            if (show) {
                this.toggleQueryDetailsButton.setAttribute('aria-expanded', 'true');
                this.queryDetails.classList.add(cls);
                if (moveFocus) {
                    if (reverse) {
                        this.inputPatternExcludes.focus();
                        this.inputPatternExcludes.select();
                    }
                    else {
                        this.inputPatternIncludes.focus();
                        this.inputPatternIncludes.select();
                    }
                }
            }
            else {
                this.toggleQueryDetailsButton.setAttribute('aria-expanded', 'false');
                this.queryDetails.classList.remove(cls);
                if (moveFocus) {
                    this.searchWidget.focus();
                }
            }
            if (!skipLayout && this.size) {
                this.reLayout();
            }
        }
        searchInFolders(folderPaths = []) {
            if (!folderPaths.length || folderPaths.some(folderPath => folderPath === '.')) {
                this.inputPatternIncludes.setValue('');
                this.searchWidget.focus();
                return;
            }
            // Show 'files to include' box
            if (!this.showsFileTypes()) {
                this.toggleQueryDetails(true, true);
            }
            this.inputPatternIncludes.setValue(folderPaths.join(', '));
            this.searchWidget.focus(false);
        }
        triggerQueryChange(_options) {
            const options = Object.assign({ preserveFocus: true, triggeredOnType: false, delay: 0 }, _options);
            if (options.triggeredOnType && !this.searchConfig.searchOnType) {
                return;
            }
            if (!this.pauseSearching) {
                this.triggerQueryDelayer.trigger(() => {
                    this._onQueryChanged(options.preserveFocus, options.triggeredOnType);
                }, options.delay);
            }
        }
        _onQueryChanged(preserveFocus, triggeredOnType = false) {
            if (!this.searchWidget.searchInput.inputBox.isInputValid()) {
                return;
            }
            const isRegex = this.searchWidget.searchInput.getRegex();
            const isWholeWords = this.searchWidget.searchInput.getWholeWords();
            const isCaseSensitive = this.searchWidget.searchInput.getCaseSensitive();
            const contentPattern = this.searchWidget.searchInput.getValue();
            const excludePatternText = this.inputPatternExcludes.getValue().trim();
            const includePatternText = this.inputPatternIncludes.getValue().trim();
            const useExcludesAndIgnoreFiles = this.inputPatternExcludes.useExcludesAndIgnoreFiles();
            const onlySearchInOpenEditors = this.inputPatternIncludes.onlySearchInOpenEditors();
            if (contentPattern.length === 0) {
                this.clearSearchResults(false);
                this.clearMessage();
                return;
            }
            const content = {
                pattern: contentPattern,
                isRegExp: isRegex,
                isCaseSensitive: isCaseSensitive,
                isWordMatch: isWholeWords
            };
            const excludePattern = this.inputPatternExcludes.getValue();
            const includePattern = this.inputPatternIncludes.getValue();
            // Need the full match line to correctly calculate replace text, if this is a search/replace with regex group references ($1, $2, ...).
            // 10000 chars is enough to avoid sending huge amounts of text around, if you do a replace with a longer match, it may or may not resolve the group refs correctly.
            // https://github.com/microsoft/vscode/issues/58374
            const charsPerLine = content.isRegExp ? 10000 : 1000;
            const options = {
                _reason: 'searchView',
                extraFileResources: this.instantiationService.invokeFunction(search_1.getOutOfWorkspaceEditorResources),
                maxResults: (0, types_1.withNullAsUndefined)(this.searchConfig.maxResults),
                disregardIgnoreFiles: !useExcludesAndIgnoreFiles || undefined,
                disregardExcludeSettings: !useExcludesAndIgnoreFiles || undefined,
                onlyOpenEditors: onlySearchInOpenEditors,
                excludePattern,
                includePattern,
                previewOptions: {
                    matchLines: 1,
                    charsPerLine
                },
                isSmartCase: this.searchConfig.smartCase,
                expandPatterns: true
            };
            const folderResources = this.contextService.getWorkspace().folders;
            const onQueryValidationError = (err) => {
                this.searchWidget.searchInput.showMessage({ content: err.message, type: 3 /* MessageType.ERROR */ });
                this.viewModel.searchResult.clear();
            };
            let query;
            try {
                query = this.queryBuilder.text(content, folderResources.map(folder => folder.uri), options);
            }
            catch (err) {
                onQueryValidationError(err);
                return;
            }
            this.validateQuery(query).then(() => {
                this.onQueryTriggered(query, options, excludePatternText, includePatternText, triggeredOnType);
                if (!preserveFocus) {
                    this.searchWidget.focus(false, undefined, true); // focus back to input field
                }
            }, onQueryValidationError);
        }
        validateQuery(query) {
            // Validate folderQueries
            const folderQueriesExistP = query.folderQueries.map(fq => {
                return this.fileService.exists(fq.folder).catch(() => false);
            });
            return Promise.all(folderQueriesExistP).then(existResults => {
                // If no folders exist, show an error message about the first one
                const existingFolderQueries = query.folderQueries.filter((folderQuery, i) => existResults[i]);
                if (!query.folderQueries.length || existingFolderQueries.length) {
                    query.folderQueries = existingFolderQueries;
                }
                else {
                    const nonExistantPath = query.folderQueries[0].folder.fsPath;
                    const searchPathNotFoundError = nls.localize('searchPathNotFoundError', "Search path not found: {0}", nonExistantPath);
                    return Promise.reject(new Error(searchPathNotFoundError));
                }
                return undefined;
            });
        }
        onQueryTriggered(query, options, excludePatternText, includePatternText, triggeredOnType) {
            this.addToSearchHistoryDelayer.trigger(() => {
                this.searchWidget.searchInput.onSearchSubmit();
                this.inputPatternExcludes.onSearchSubmit();
                this.inputPatternIncludes.onSearchSubmit();
            });
            this.viewModel.cancelSearch(true);
            this.currentSearchQ = this.currentSearchQ
                .then(() => this.doSearch(query, excludePatternText, includePatternText, triggeredOnType))
                .then(() => undefined, () => undefined);
        }
        doSearch(query, excludePatternText, includePatternText, triggeredOnType) {
            let progressComplete;
            this.progressService.withProgress({ location: this.getProgressLocation(), delay: triggeredOnType ? 300 : 0 }, _progress => {
                return new Promise(resolve => progressComplete = resolve);
            });
            this.searchWidget.searchInput.clearMessage();
            this.state = search_1.SearchUIState.Searching;
            this.showEmptyStage();
            const slowTimer = setTimeout(() => {
                this.state = search_1.SearchUIState.SlowSearch;
            }, 2000);
            const onComplete = (completed) => {
                clearTimeout(slowTimer);
                this.state = search_1.SearchUIState.Idle;
                // Complete up to 100% as needed
                progressComplete();
                // Do final render, then expand if just 1 file with less than 50 matches
                this.onSearchResultsChanged();
                const collapseResults = this.searchConfig.collapseResults;
                if (collapseResults !== 'alwaysCollapse' && this.viewModel.searchResult.matches().length === 1) {
                    const onlyMatch = this.viewModel.searchResult.matches()[0];
                    if (onlyMatch.count() < 50) {
                        this.tree.expand(onlyMatch);
                    }
                }
                this.viewModel.replaceString = this.searchWidget.getReplaceValue();
                const hasResults = !this.viewModel.searchResult.isEmpty();
                if ((completed === null || completed === void 0 ? void 0 : completed.exit) === 1 /* SearchCompletionExitCode.NewSearchStarted */) {
                    return;
                }
                if (!hasResults) {
                    const hasExcludes = !!excludePatternText;
                    const hasIncludes = !!includePatternText;
                    let message;
                    if (!completed) {
                        message = SEARCH_CANCELLED_MESSAGE;
                    }
                    else if (this.inputPatternIncludes.onlySearchInOpenEditors()) {
                        if (hasIncludes && hasExcludes) {
                            message = nls.localize('noOpenEditorResultsIncludesExcludes', "No results found in open editors matching '{0}' excluding '{1}' - ", includePatternText, excludePatternText);
                        }
                        else if (hasIncludes) {
                            message = nls.localize('noOpenEditorResultsIncludes', "No results found in open editors matching '{0}' - ", includePatternText);
                        }
                        else if (hasExcludes) {
                            message = nls.localize('noOpenEditorResultsExcludes', "No results found in open editors excluding '{0}' - ", excludePatternText);
                        }
                        else {
                            message = nls.localize('noOpenEditorResultsFound', "No results found in open editors. Review your settings for configured exclusions and check your gitignore files - ");
                        }
                    }
                    else {
                        if (hasIncludes && hasExcludes) {
                            message = nls.localize('noResultsIncludesExcludes', "No results found in '{0}' excluding '{1}' - ", includePatternText, excludePatternText);
                        }
                        else if (hasIncludes) {
                            message = nls.localize('noResultsIncludes', "No results found in '{0}' - ", includePatternText);
                        }
                        else if (hasExcludes) {
                            message = nls.localize('noResultsExcludes', "No results found excluding '{0}' - ", excludePatternText);
                        }
                        else {
                            message = nls.localize('noResultsFound', "No results found. Review your settings for configured exclusions and check your gitignore files - ");
                        }
                    }
                    // Indicate as status to ARIA
                    aria.status(message);
                    const messageEl = this.clearMessage();
                    dom.append(messageEl, message);
                    if (!completed) {
                        const searchAgainButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('rerunSearch.message', "Search again"), () => this.triggerQueryChange({ preserveFocus: false })));
                        dom.append(messageEl, searchAgainButton.element);
                    }
                    else if (hasIncludes || hasExcludes) {
                        const searchAgainButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('rerunSearchInAll.message', "Search again in all files"), this.onSearchAgain.bind(this)));
                        dom.append(messageEl, searchAgainButton.element);
                    }
                    else {
                        const openSettingsButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('openSettings.message', "Open Settings"), this.onOpenSettings.bind(this)));
                        dom.append(messageEl, openSettingsButton.element);
                    }
                    if (completed) {
                        dom.append(messageEl, $('span', undefined, ' - '));
                        const learnMoreButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('openSettings.learnMore', "Learn More"), this.onLearnMore.bind(this)));
                        dom.append(messageEl, learnMoreButton.element);
                    }
                    if (this.contextService.getWorkbenchState() === 1 /* WorkbenchState.EMPTY */) {
                        this.showSearchWithoutFolderMessage();
                    }
                    this.reLayout();
                }
                else {
                    this.viewModel.searchResult.toggleHighlights(this.isVisible()); // show highlights
                    // Indicate final search result count for ARIA
                    aria.status(nls.localize('ariaSearchResultsStatus', "Search returned {0} results in {1} files", this.viewModel.searchResult.count(), this.viewModel.searchResult.fileCount()));
                }
                if (completed && completed.limitHit) {
                    completed.messages.push({ type: search_2.TextSearchCompleteMessageType.Warning, text: nls.localize('searchMaxResultsWarning', "The result set only contains a subset of all matches. Be more specific in your search to narrow down the results.") });
                }
                if (completed && completed.messages) {
                    for (const message of completed.messages) {
                        this.addMessage(message);
                    }
                }
                this.reLayout();
            };
            const onError = (e) => {
                clearTimeout(slowTimer);
                this.state = search_1.SearchUIState.Idle;
                if (errors.isCancellationError(e)) {
                    return onComplete(undefined);
                }
                else {
                    progressComplete();
                    this.searchWidget.searchInput.showMessage({ content: e.message, type: 3 /* MessageType.ERROR */ });
                    this.viewModel.searchResult.clear();
                    return Promise.resolve();
                }
            };
            let visibleMatches = 0;
            // Handle UI updates in an interval to show frequent progress and results
            const uiRefreshHandle = setInterval(() => {
                if (this.state === search_1.SearchUIState.Idle) {
                    window.clearInterval(uiRefreshHandle);
                    return;
                }
                // Search result tree update
                const fileCount = this.viewModel.searchResult.fileCount();
                if (visibleMatches !== fileCount) {
                    visibleMatches = fileCount;
                    this.refreshAndUpdateCount();
                }
            }, 100);
            this.searchWidget.setReplaceAllActionState(false);
            this.tree.setSelection([]);
            return this.viewModel.search(query)
                .then(onComplete, onError);
        }
        onOpenSettings(e) {
            dom.EventHelper.stop(e, false);
            this.openSettings('@id:files.exclude,search.exclude,search.useParentIgnoreFiles,search.useGlobalIgnoreFiles,search.useIgnoreFiles');
        }
        openSettings(query) {
            const options = { query };
            return this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ?
                this.preferencesService.openWorkspaceSettings(options) :
                this.preferencesService.openUserSettings(options);
        }
        onLearnMore() {
            this.openerService.open(uri_1.URI.parse('https://go.microsoft.com/fwlink/?linkid=853977'));
        }
        onSearchAgain() {
            this.inputPatternExcludes.setValue('');
            this.inputPatternIncludes.setValue('');
            this.inputPatternIncludes.setOnlySearchInOpenEditors(false);
            this.triggerQueryChange({ preserveFocus: false });
        }
        onEnableExcludes() {
            this.toggleQueryDetails(false, true);
            this.searchExcludePattern.setUseExcludesAndIgnoreFiles(true);
        }
        onDisableSearchInOpenEditors() {
            this.toggleQueryDetails(false, true);
            this.inputPatternIncludes.setOnlySearchInOpenEditors(false);
        }
        updateSearchResultCount(disregardExcludesAndIgnores, onlyOpenEditors) {
            var _a, _b;
            const fileCount = this.viewModel.searchResult.fileCount();
            this.hasSearchResultsKey.set(fileCount > 0);
            const msgWasHidden = this.messagesElement.style.display === 'none';
            const messageEl = this.clearMessage();
            const resultMsg = this.buildResultCountMessage(this.viewModel.searchResult.count(), fileCount);
            this.tree.ariaLabel = resultMsg + nls.localize('forTerm', " - Search: {0}", (_b = (_a = this.searchResult.query) === null || _a === void 0 ? void 0 : _a.contentPattern.pattern) !== null && _b !== void 0 ? _b : '');
            dom.append(messageEl, resultMsg);
            if (fileCount > 0) {
                if (disregardExcludesAndIgnores) {
                    const excludesDisabledMessage = ' - ' + nls.localize('useIgnoresAndExcludesDisabled', "exclude settings and ignore files are disabled") + ' ';
                    const enableExcludesButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('excludes.enable', "enable"), this.onEnableExcludes.bind(this), nls.localize('useExcludesAndIgnoreFilesDescription', "Use Exclude Settings and Ignore Files")));
                    dom.append(messageEl, $('span', undefined, excludesDisabledMessage, '(', enableExcludesButton.element, ')'));
                }
                if (onlyOpenEditors) {
                    const searchingInOpenMessage = ' - ' + nls.localize('onlyOpenEditors', "searching only in open files") + ' ';
                    const disableOpenEditorsButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('openEditors.disable', "disable"), this.onDisableSearchInOpenEditors.bind(this), nls.localize('disableOpenEditors', "Search in entire workspace")));
                    dom.append(messageEl, $('span', undefined, searchingInOpenMessage, '(', disableOpenEditorsButton.element, ')'));
                }
                dom.append(messageEl, ' - ');
                const openInEditorTooltip = (0, searchActions_1.appendKeyBindingLabel)(nls.localize('openInEditor.tooltip', "Copy current search results to an editor"), this.keybindingService.lookupKeybinding(Constants.OpenInEditorCommandId), this.keybindingService);
                const openInEditorButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('openInEditor.message', "Open in editor"), () => this.instantiationService.invokeFunction(searchEditorActions_1.createEditorFromSearchResult, this.searchResult, this.searchIncludePattern.getValue(), this.searchExcludePattern.getValue(), this.searchIncludePattern.onlySearchInOpenEditors()), openInEditorTooltip));
                dom.append(messageEl, openInEditorButton.element);
                this.reLayout();
            }
            else if (!msgWasHidden) {
                dom.hide(this.messagesElement);
            }
        }
        addMessage(message) {
            const messageBox = this.messagesElement.firstChild;
            if (!messageBox) {
                return;
            }
            dom.append(messageBox, (0, searchMessage_1.renderSearchMessage)(message, this.instantiationService, this.notificationService, this.openerService, this.commandService, this.messageDisposables, () => this.triggerQueryChange()));
        }
        buildResultCountMessage(resultCount, fileCount) {
            if (resultCount === 1 && fileCount === 1) {
                return nls.localize('search.file.result', "{0} result in {1} file", resultCount, fileCount);
            }
            else if (resultCount === 1) {
                return nls.localize('search.files.result', "{0} result in {1} files", resultCount, fileCount);
            }
            else if (fileCount === 1) {
                return nls.localize('search.file.results', "{0} results in {1} file", resultCount, fileCount);
            }
            else {
                return nls.localize('search.files.results', "{0} results in {1} files", resultCount, fileCount);
            }
        }
        showSearchWithoutFolderMessage() {
            this.searchWithoutFolderMessageElement = this.clearMessage();
            const textEl = dom.append(this.searchWithoutFolderMessageElement, $('p', undefined, nls.localize('searchWithoutFolder', "You have not opened or specified a folder. Only open files are currently searched - ")));
            const openFolderButton = this.messageDisposables.add(new SearchLinkButton(nls.localize('openFolder', "Open Folder"), () => {
                this.commandService.executeCommand(env.isMacintosh && env.isNative ? workspaceActions_1.OpenFileFolderAction.ID : workspaceActions_1.OpenFolderAction.ID).catch(err => errors.onUnexpectedError(err));
            }));
            dom.append(textEl, openFolderButton.element);
        }
        showEmptyStage(forceHideMessages = false) {
            var _a, _b, _c;
            const showingCancelled = ((_c = (_b = (_a = this.messagesElement.firstChild) === null || _a === void 0 ? void 0 : _a.textContent) === null || _b === void 0 ? void 0 : _b.indexOf(SEARCH_CANCELLED_MESSAGE)) !== null && _c !== void 0 ? _c : -1) > -1;
            // clean up ui
            // this.replaceService.disposeAllReplacePreviews();
            if (showingCancelled || forceHideMessages || !this.configurationService.getValue().search.searchOnType) {
                // when in search to type, don't preemptively hide, as it causes flickering and shifting of the live results
                dom.hide(this.messagesElement);
            }
            dom.show(this.resultsElement);
            this.currentSelectedFileMatch = undefined;
        }
        onFocus(lineMatch, preserveFocus, sideBySide, pinned) {
            const useReplacePreview = this.configurationService.getValue().search.useReplacePreview;
            return (useReplacePreview && this.viewModel.isReplaceActive() && !!this.viewModel.replaceString) ?
                this.replaceService.openReplacePreview(lineMatch, preserveFocus, sideBySide, pinned) :
                this.open(lineMatch, preserveFocus, sideBySide, pinned);
        }
        async open(element, preserveFocus, sideBySide, pinned) {
            var _a;
            const selection = this.getSelectionFrom(element);
            const resource = element instanceof searchModel_1.Match ? element.parent().resource : element.resource;
            let editor;
            try {
                editor = await this.editorService.openEditor({
                    resource: resource,
                    options: {
                        preserveFocus,
                        pinned,
                        selection,
                        revealIfVisible: true
                    }
                }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
                const editorControl = editor === null || editor === void 0 ? void 0 : editor.getControl();
                if (element instanceof searchModel_1.Match && preserveFocus && (0, editorBrowser_1.isCodeEditor)(editorControl)) {
                    this.viewModel.searchResult.rangeHighlightDecorations.highlightRange(editorControl.getModel(), element.range());
                }
                else {
                    this.viewModel.searchResult.rangeHighlightDecorations.removeHighlightRange();
                }
            }
            catch (err) {
                errors.onUnexpectedError(err);
                return;
            }
            if (editor instanceof notebookEditor_1.NotebookEditor) {
                const controller = (_a = editor.getControl()) === null || _a === void 0 ? void 0 : _a.getContribution(notebookFindWidget_1.NotebookFindWidget.id);
                const matchIndex = element instanceof searchModel_1.Match ? element.parent().matches().findIndex(e => e.id() === element.id()) : undefined;
                controller === null || controller === void 0 ? void 0 : controller.show(this.searchWidget.searchInput.getValue(), { matchIndex, focus: false });
            }
        }
        openEditorWithMultiCursor(element) {
            const resource = element instanceof searchModel_1.Match ? element.parent().resource : element.resource;
            return this.editorService.openEditor({
                resource: resource,
                options: {
                    preserveFocus: false,
                    pinned: true,
                    revealIfVisible: true
                }
            }).then(editor => {
                if (editor) {
                    let fileMatch = null;
                    if (element instanceof searchModel_1.FileMatch) {
                        fileMatch = element;
                    }
                    else if (element instanceof searchModel_1.Match) {
                        fileMatch = element.parent();
                    }
                    if (fileMatch) {
                        const selections = fileMatch.matches().map(m => new selection_1.Selection(m.range().startLineNumber, m.range().startColumn, m.range().endLineNumber, m.range().endColumn));
                        const codeEditor = (0, editorBrowser_1.getCodeEditor)(editor.getControl());
                        if (codeEditor) {
                            const multiCursorController = multicursor_1.MultiCursorSelectionController.get(codeEditor);
                            multiCursorController === null || multiCursorController === void 0 ? void 0 : multiCursorController.selectAllUsingSelections(selections);
                        }
                    }
                }
                this.viewModel.searchResult.rangeHighlightDecorations.removeHighlightRange();
            }, errors.onUnexpectedError);
        }
        getSelectionFrom(element) {
            let match = null;
            if (element instanceof searchModel_1.Match) {
                match = element;
            }
            if (element instanceof searchModel_1.FileMatch && element.count() > 0) {
                match = element.matches()[element.matches().length - 1];
            }
            if (match) {
                const range = match.range();
                if (this.viewModel.isReplaceActive() && !!this.viewModel.replaceString) {
                    const replaceString = match.replaceString;
                    return {
                        startLineNumber: range.startLineNumber,
                        startColumn: range.startColumn,
                        endLineNumber: range.startLineNumber,
                        endColumn: range.startColumn + replaceString.length
                    };
                }
                return range;
            }
            return undefined;
        }
        onUntitledDidDispose(resource) {
            if (!this.viewModel) {
                return;
            }
            // remove search results from this resource as it got disposed
            const matches = this.viewModel.searchResult.matches();
            for (let i = 0, len = matches.length; i < len; i++) {
                if (resource.toString() === matches[i].resource.toString()) {
                    this.viewModel.searchResult.remove(matches[i]);
                }
            }
        }
        onFilesChanged(e) {
            if (!this.viewModel || (this.searchConfig.sortOrder !== "modified" /* SearchSortOrder.Modified */ && !e.gotDeleted())) {
                return;
            }
            const matches = this.viewModel.searchResult.matches();
            if (e.gotDeleted()) {
                const deletedMatches = matches.filter(m => e.contains(m.resource, 2 /* FileChangeType.DELETED */));
                this.viewModel.searchResult.remove(deletedMatches);
            }
            else {
                // Check if the changed file contained matches
                const changedMatches = matches.filter(m => e.contains(m.resource));
                if (changedMatches.length && this.searchConfig.sortOrder === "modified" /* SearchSortOrder.Modified */) {
                    // No matches need to be removed, but modified files need to have their file stat updated.
                    this.updateFileStats(changedMatches).then(() => this.refreshTree());
                }
            }
        }
        get searchConfig() {
            return this.configurationService.getValue('search');
        }
        clearHistory() {
            this.searchWidget.clearHistory();
            this.inputPatternExcludes.clearHistory();
            this.inputPatternIncludes.clearHistory();
        }
        saveState() {
            const isRegex = this.searchWidget.searchInput.getRegex();
            const isWholeWords = this.searchWidget.searchInput.getWholeWords();
            const isCaseSensitive = this.searchWidget.searchInput.getCaseSensitive();
            const contentPattern = this.searchWidget.searchInput.getValue();
            const patternExcludes = this.inputPatternExcludes.getValue().trim();
            const patternIncludes = this.inputPatternIncludes.getValue().trim();
            const onlyOpenEditors = this.inputPatternIncludes.onlySearchInOpenEditors();
            const useExcludesAndIgnoreFiles = this.inputPatternExcludes.useExcludesAndIgnoreFiles();
            const preserveCase = this.viewModel.preserveCase;
            this.viewletState['query.contentPattern'] = contentPattern;
            this.viewletState['query.regex'] = isRegex;
            this.viewletState['query.wholeWords'] = isWholeWords;
            this.viewletState['query.caseSensitive'] = isCaseSensitive;
            this.viewletState['query.folderExclusions'] = patternExcludes;
            this.viewletState['query.folderIncludes'] = patternIncludes;
            this.viewletState['query.useExcludesAndIgnoreFiles'] = useExcludesAndIgnoreFiles;
            this.viewletState['query.preserveCase'] = preserveCase;
            this.viewletState['query.onlyOpenEditors'] = onlyOpenEditors;
            const isReplaceShown = this.searchAndReplaceWidget.isReplaceShown();
            this.viewletState['view.showReplace'] = isReplaceShown;
            this.viewletState['query.replaceText'] = isReplaceShown && this.searchWidget.getReplaceValue();
            const history = Object.create(null);
            const searchHistory = this.searchWidget.getSearchHistory();
            if (searchHistory && searchHistory.length) {
                history.search = searchHistory;
            }
            const replaceHistory = this.searchWidget.getReplaceHistory();
            if (replaceHistory && replaceHistory.length) {
                history.replace = replaceHistory;
            }
            const patternExcludesHistory = this.inputPatternExcludes.getHistory();
            if (patternExcludesHistory && patternExcludesHistory.length) {
                history.exclude = patternExcludesHistory;
            }
            const patternIncludesHistory = this.inputPatternIncludes.getHistory();
            if (patternIncludesHistory && patternIncludesHistory.length) {
                history.include = patternIncludesHistory;
            }
            this.searchHistoryService.save(history);
            this.memento.saveMemento();
            super.saveState();
        }
        async retrieveFileStats() {
            const files = this.searchResult.matches().filter(f => !f.fileStat).map(f => f.resolveFileStat(this.fileService));
            await Promise.all(files);
        }
        async updateFileStats(elements) {
            const files = elements.map(f => f.resolveFileStat(this.fileService));
            await Promise.all(files);
        }
        removeFileStats() {
            for (const fileMatch of this.searchResult.matches()) {
                fileMatch.fileStat = undefined;
            }
        }
        dispose() {
            this.isDisposed = true;
            this.saveState();
            super.dispose();
        }
    };
    SearchView.ACTIONS_RIGHT_CLASS_NAME = 'actions-right';
    SearchView = __decorate([
        __param(1, files_1.IFileService),
        __param(2, editorService_1.IEditorService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, progress_1.IProgressService),
        __param(5, notification_1.INotificationService),
        __param(6, dialogs_1.IDialogService),
        __param(7, commands_1.ICommandService),
        __param(8, contextView_1.IContextViewService),
        __param(9, instantiation_1.IInstantiationService),
        __param(10, views_1.IViewDescriptorService),
        __param(11, configuration_1.IConfigurationService),
        __param(12, workspace_1.IWorkspaceContextService),
        __param(13, searchModel_1.ISearchWorkbenchService),
        __param(14, contextkey_1.IContextKeyService),
        __param(15, replace_1.IReplaceService),
        __param(16, textfiles_1.ITextFileService),
        __param(17, preferences_1.IPreferencesService),
        __param(18, themeService_1.IThemeService),
        __param(19, searchHistoryService_1.ISearchHistoryService),
        __param(20, contextView_1.IContextMenuService),
        __param(21, actions_1.IMenuService),
        __param(22, accessibility_1.IAccessibilityService),
        __param(23, keybinding_1.IKeybindingService),
        __param(24, storage_1.IStorageService),
        __param(25, opener_1.IOpenerService),
        __param(26, telemetry_1.ITelemetryService)
    ], SearchView);
    exports.SearchView = SearchView;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const matchHighlightColor = theme.getColor(colorRegistry_1.editorFindMatchHighlight);
        if (matchHighlightColor) {
            collector.addRule(`.monaco-workbench .search-view .findInFileMatch { background-color: ${matchHighlightColor}; }`);
        }
        const diffInsertedColor = theme.getColor(colorRegistry_1.diffInserted);
        if (diffInsertedColor) {
            collector.addRule(`.monaco-workbench .search-view .replaceMatch { background-color: ${diffInsertedColor}; }`);
        }
        const diffRemovedColor = theme.getColor(colorRegistry_1.diffRemoved);
        if (diffRemovedColor) {
            collector.addRule(`.monaco-workbench .search-view .replace.findInFileMatch { background-color: ${diffRemovedColor}; }`);
        }
        const diffInsertedOutlineColor = theme.getColor(colorRegistry_1.diffInsertedOutline);
        if (diffInsertedOutlineColor) {
            collector.addRule(`.monaco-workbench .search-view .replaceMatch:not(:empty) { border: 1px ${(0, theme_1.isHighContrast)(theme.type) ? 'dashed' : 'solid'} ${diffInsertedOutlineColor}; }`);
        }
        const diffRemovedOutlineColor = theme.getColor(colorRegistry_1.diffRemovedOutline);
        if (diffRemovedOutlineColor) {
            collector.addRule(`.monaco-workbench .search-view .replace.findInFileMatch { border: 1px ${(0, theme_1.isHighContrast)(theme.type) ? 'dashed' : 'solid'} ${diffRemovedOutlineColor}; }`);
        }
        const findMatchHighlightBorder = theme.getColor(colorRegistry_1.editorFindMatchHighlightBorder);
        if (findMatchHighlightBorder) {
            collector.addRule(`.monaco-workbench .search-view .findInFileMatch { border: 1px ${(0, theme_1.isHighContrast)(theme.type) ? 'dashed' : 'solid'} ${findMatchHighlightBorder}; }`);
        }
        const outlineSelectionColor = theme.getColor(colorRegistry_1.listActiveSelectionForeground);
        if (outlineSelectionColor) {
            collector.addRule(`.monaco-workbench .search-view .monaco-list.element-focused .monaco-list-row.focused.selected:not(.highlighted) .action-label:focus { outline-color: ${outlineSelectionColor} }`);
        }
        if (theme.type === 'dark') {
            const foregroundColor = theme.getColor(colorRegistry_1.foreground);
            if (foregroundColor) {
                const fgWithOpacity = new color_1.Color(new color_1.RGBA(foregroundColor.rgba.r, foregroundColor.rgba.g, foregroundColor.rgba.b, 0.65));
                collector.addRule(`.search-view .message { color: ${fgWithOpacity}; }`);
            }
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-workbench .search-view .message a { color: ${link}; }`);
        }
        const activeLink = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (activeLink) {
            collector.addRule(`.monaco-workbench .search-view .message a:hover,
			.monaco-workbench .search-view .message a:active { color: ${activeLink}; }`);
        }
        const toolbarHoverColor = theme.getColor(colorRegistry_1.toolbarHoverBackground);
        if (toolbarHoverColor) {
            collector.addRule(`.monaco-workbench .search-view .search-widget .toggle-replace-button:hover { background-color: ${toolbarHoverColor} }`);
        }
        const toolbarActiveColor = theme.getColor(colorRegistry_1.toolbarActiveBackground);
        if (toolbarActiveColor) {
            collector.addRule(`.monaco-workbench .search-view .search-widget .toggle-replace-button:active { background-color: ${toolbarActiveColor} }`);
        }
    });
    class SearchLinkButton extends lifecycle_1.Disposable {
        constructor(label, handler, tooltip) {
            super();
            this.element = $('a.pointer', { tabindex: 0, title: tooltip }, label);
            this.addEventHandlers(handler);
        }
        addEventHandlers(handler) {
            const wrappedHandler = (e) => {
                dom.EventHelper.stop(e, false);
                handler(e);
            };
            this._register(dom.addDisposableListener(this.element, dom.EventType.CLICK, wrappedHandler));
            this._register(dom.addDisposableListener(this.element, dom.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(10 /* KeyCode.Space */) || event.equals(3 /* KeyCode.Enter */)) {
                    wrappedHandler(e);
                    event.preventDefault();
                    event.stopPropagation();
                }
            }));
        }
    }
});
//# sourceMappingURL=searchView.js.map