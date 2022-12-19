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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/mouseCursor/mouseCursor", "vs/base/common/async", "vs/base/common/decorators", "vs/base/common/history", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/uri", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/browser/widget/codeEditorWidget", "vs/editor/common/config/editorOptions", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/languages", "vs/editor/common/services/languageFeatures", "vs/editor/common/services/model", "vs/editor/common/services/textResourceConfiguration", "vs/editor/contrib/suggest/browser/suggestController", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/history/browser/historyWidgetKeybindingHint", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/serviceCollection", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/opener/common/opener", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/views", "vs/workbench/contrib/codeEditor/browser/simpleEditorOptions", "vs/workbench/contrib/debug/browser/debugActionViewItems", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/browser/linkDetector", "vs/workbench/contrib/debug/browser/replFilter", "vs/workbench/contrib/debug/browser/replViewer", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/replModel", "vs/workbench/services/editor/common/editorService", "vs/css!./media/repl"], function (require, exports, dom, aria, mouseCursor_1, async_1, decorators_1, history_1, lifecycle_1, strings_1, uri_1, editorBrowser_1, editorExtensions_1, codeEditorService_1, codeEditorWidget_1, editorOptions_1, range_1, editorContextKeys_1, languages_1, languageFeatures_1, model_1, textResourceConfiguration_1, suggestController_1, nls_1, menuEntryActionViewItem_1, actions_1, clipboardService_1, configuration_1, contextkey_1, contextView_1, contextScopedHistoryWidget_1, historyWidgetKeybindingHint_1, instantiation_1, serviceCollection_1, keybinding_1, listService_1, opener_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, viewPane_1, views_1, simpleEditorOptions_1, debugActionViewItems_1, debugIcons_1, linkDetector_1, replFilter_1, replViewer_1, debug_1, debugModel_1, replModel_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Repl = void 0;
    const $ = dom.$;
    const HISTORY_STORAGE_KEY = 'debug.repl.history';
    const FILTER_HISTORY_STORAGE_KEY = 'debug.repl.filterHistory';
    const FILTER_VALUE_STORAGE_KEY = 'debug.repl.filterValue';
    const DECORATION_KEY = 'replinputdecoration';
    const FILTER_ACTION_ID = `workbench.actions.treeView.repl.filter`;
    function revealLastElement(tree) {
        tree.scrollTop = tree.scrollHeight - tree.renderHeight;
        // tree.scrollTop = 1e6;
    }
    const sessionsToIgnore = new Set();
    const identityProvider = { getId: (element) => element.getId() };
    let Repl = class Repl extends viewPane_1.ViewPane {
        constructor(options, debugService, instantiationService, storageService, themeService, modelService, contextKeyService, codeEditorService, viewDescriptorService, contextMenuService, configurationService, textResourcePropertiesService, editorService, keybindingService, openerService, telemetryService, menuService, languageFeaturesService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.debugService = debugService;
            this.storageService = storageService;
            this.modelService = modelService;
            this.textResourcePropertiesService = textResourcePropertiesService;
            this.editorService = editorService;
            this.languageFeaturesService = languageFeaturesService;
            this.previousTreeScrollHeight = 0;
            this.replInputLineCount = 1;
            this.modelChangeListener = lifecycle_1.Disposable.None;
            this.menu = menuService.createMenu(actions_1.MenuId.DebugConsoleContext, contextKeyService);
            this._register(this.menu);
            this.history = new history_1.HistoryNavigator(JSON.parse(this.storageService.get(HISTORY_STORAGE_KEY, 1 /* StorageScope.WORKSPACE */, '[]')), 50);
            this.filter = new replFilter_1.ReplFilter();
            this.filterState = new replFilter_1.ReplFilterState(this);
            this.filter.filterQuery = this.filterState.filterText = this.storageService.get(FILTER_VALUE_STORAGE_KEY, 1 /* StorageScope.WORKSPACE */, '');
            this.multiSessionRepl = debug_1.CONTEXT_MULTI_SESSION_REPL.bindTo(contextKeyService);
            codeEditorService.registerDecorationType('repl-decoration', DECORATION_KEY, {});
            this.multiSessionRepl.set(this.isMultiSessionView);
            this.registerListeners();
        }
        registerListeners() {
            if (this.debugService.getViewModel().focusedSession) {
                this.onDidFocusSession(this.debugService.getViewModel().focusedSession);
            }
            this._register(this.debugService.getViewModel().onDidFocusSession(async (session) => this.onDidFocusSession(session)));
            this._register(this.debugService.getViewModel().onDidEvaluateLazyExpression(async (e) => {
                if (e instanceof debugModel_1.Variable && this.tree.hasNode(e)) {
                    await this.tree.updateChildren(e, false, true);
                    await this.tree.expand(e);
                }
            }));
            this._register(this.debugService.onWillNewSession(async (newSession) => {
                // Need to listen to output events for sessions which are not yet fully initialised
                const input = this.tree.getInput();
                if (!input || input.state === 0 /* State.Inactive */) {
                    await this.selectSession(newSession);
                }
                this.multiSessionRepl.set(this.isMultiSessionView);
            }));
            this._register(this.themeService.onDidColorThemeChange(() => {
                this.refreshReplElements(false);
                if (this.isVisible()) {
                    this.updateInputDecoration();
                }
            }));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible) {
                    if (!this.model) {
                        this.model = this.modelService.getModel(Repl.URI) || this.modelService.createModel('', null, Repl.URI, true);
                    }
                    this.setMode();
                    this.replInput.setModel(this.model);
                    this.updateInputDecoration();
                    this.refreshReplElements(true);
                    this.layoutBody(this.dimension.height, this.dimension.width);
                }
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug.console.wordWrap')) {
                    this.tree.dispose();
                    this.treeContainer.innerText = '';
                    dom.clearNode(this.treeContainer);
                    this.createReplTree();
                }
                else if (e.affectsConfiguration('debug.console.lineHeight') || e.affectsConfiguration('debug.console.fontSize') || e.affectsConfiguration('debug.console.fontFamily')) {
                    this.onDidStyleChange();
                }
                if (e.affectsConfiguration('debug.console.acceptSuggestionOnEnter')) {
                    const config = this.configurationService.getValue('debug');
                    this.replInput.updateOptions({
                        acceptSuggestionOnEnter: config.console.acceptSuggestionOnEnter === 'on' ? 'on' : 'off'
                    });
                }
            }));
            this._register(this.themeService.onDidColorThemeChange(e => {
                this.onDidStyleChange();
            }));
            this._register(this.viewDescriptorService.onDidChangeLocation(e => {
                if (e.views.some(v => v.id === this.id)) {
                    this.onDidStyleChange();
                }
            }));
            this._register(this.editorService.onDidActiveEditorChange(() => {
                this.setMode();
            }));
            this._register(this.filterState.onDidChange(() => {
                this.filter.filterQuery = this.filterState.filterText;
                this.tree.refilter();
                revealLastElement(this.tree);
            }));
        }
        async onDidFocusSession(session) {
            if (session) {
                sessionsToIgnore.delete(session);
                if (this.completionItemProvider) {
                    this.completionItemProvider.dispose();
                }
                if (session.capabilities.supportsCompletionsRequest) {
                    this.completionItemProvider = this.languageFeaturesService.completionProvider.register({ scheme: debug_1.DEBUG_SCHEME, pattern: '**/replinput', hasAccessToAllModels: true }, {
                        triggerCharacters: session.capabilities.completionTriggerCharacters || ['.'],
                        provideCompletionItems: async (_, position, _context, token) => {
                            // Disable history navigation because up and down are used to navigate through the suggest widget
                            this.setHistoryNavigationEnablement(false);
                            const model = this.replInput.getModel();
                            if (model) {
                                const word = model.getWordAtPosition(position);
                                const overwriteBefore = word ? word.word.length : 0;
                                const text = model.getValue();
                                const focusedStackFrame = this.debugService.getViewModel().focusedStackFrame;
                                const frameId = focusedStackFrame ? focusedStackFrame.frameId : undefined;
                                const response = await session.completions(frameId, (focusedStackFrame === null || focusedStackFrame === void 0 ? void 0 : focusedStackFrame.thread.threadId) || 0, text, position, overwriteBefore, token);
                                const suggestions = [];
                                const computeRange = (length) => range_1.Range.fromPositions(position.delta(0, -length), position);
                                if (response && response.body && response.body.targets) {
                                    response.body.targets.forEach(item => {
                                        if (item && item.label) {
                                            let insertTextRules = undefined;
                                            let insertText = item.text || item.label;
                                            if (typeof item.selectionStart === 'number') {
                                                // If a debug completion item sets a selection we need to use snippets to make sure the selection is selected #90974
                                                insertTextRules = 4 /* CompletionItemInsertTextRule.InsertAsSnippet */;
                                                const selectionLength = typeof item.selectionLength === 'number' ? item.selectionLength : 0;
                                                const placeholder = selectionLength > 0 ? '${1:' + insertText.substring(item.selectionStart, item.selectionStart + selectionLength) + '}$0' : '$0';
                                                insertText = insertText.substring(0, item.selectionStart) + placeholder + insertText.substring(item.selectionStart + selectionLength);
                                            }
                                            suggestions.push({
                                                label: item.label,
                                                insertText,
                                                detail: item.detail,
                                                kind: languages_1.CompletionItemKinds.fromString(item.type || 'property'),
                                                filterText: (item.start && item.length) ? text.substring(item.start, item.start + item.length).concat(item.label) : undefined,
                                                range: computeRange(item.length || overwriteBefore),
                                                sortText: item.sortText,
                                                insertTextRules
                                            });
                                        }
                                    });
                                }
                                if (this.configurationService.getValue('debug').console.historySuggestions) {
                                    const history = this.history.getHistory();
                                    history.forEach(h => suggestions.push({
                                        label: h,
                                        insertText: h,
                                        kind: 18 /* CompletionItemKind.Text */,
                                        range: computeRange(h.length),
                                        sortText: 'ZZZ'
                                    }));
                                }
                                return { suggestions };
                            }
                            return Promise.resolve({ suggestions: [] });
                        }
                    });
                }
            }
            await this.selectSession();
        }
        getFilterStats() {
            var _a, _b, _c, _d;
            // This could be called before the tree is created when setting this.filterState.filterText value
            return {
                total: (_b = (_a = this.tree) === null || _a === void 0 ? void 0 : _a.getNode().children.length) !== null && _b !== void 0 ? _b : 0,
                filtered: (_d = (_c = this.tree) === null || _c === void 0 ? void 0 : _c.getNode().children.filter(c => c.visible).length) !== null && _d !== void 0 ? _d : 0
            };
        }
        get isReadonly() {
            // Do not allow to edit inactive sessions
            const session = this.tree.getInput();
            if (session && session.state !== 0 /* State.Inactive */) {
                return false;
            }
            return true;
        }
        showPreviousValue() {
            if (!this.isReadonly) {
                this.navigateHistory(true);
            }
        }
        showNextValue() {
            if (!this.isReadonly) {
                this.navigateHistory(false);
            }
        }
        focusFilter() {
            var _a;
            (_a = this.filterActionViewItem) === null || _a === void 0 ? void 0 : _a.focus();
        }
        setMode() {
            if (!this.isVisible()) {
                return;
            }
            const activeEditorControl = this.editorService.activeTextEditorControl;
            if ((0, editorBrowser_1.isCodeEditor)(activeEditorControl)) {
                this.modelChangeListener.dispose();
                this.modelChangeListener = activeEditorControl.onDidChangeModelLanguage(() => this.setMode());
                if (this.model && activeEditorControl.hasModel()) {
                    this.model.setMode(activeEditorControl.getModel().getLanguageId());
                }
            }
        }
        onDidStyleChange() {
            if (this.styleElement) {
                const debugConsole = this.configurationService.getValue('debug').console;
                const fontSize = debugConsole.fontSize;
                const fontFamily = debugConsole.fontFamily === 'default' ? 'var(--monaco-monospace-font)' : `${debugConsole.fontFamily}`;
                const lineHeight = debugConsole.lineHeight ? `${debugConsole.lineHeight}px` : '1.4em';
                const backgroundColor = this.themeService.getColorTheme().getColor(this.getBackgroundColor());
                this.replInput.updateOptions({
                    fontSize,
                    lineHeight: debugConsole.lineHeight,
                    fontFamily: debugConsole.fontFamily === 'default' ? editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily : debugConsole.fontFamily
                });
                const replInputLineHeight = this.replInput.getOption(59 /* EditorOption.lineHeight */);
                // Set the font size, font family, line height and align the twistie to be centered, and input theme color
                this.styleElement.textContent = `
				.repl .repl-input-wrapper .repl-input-chevron {
					line-height: ${replInputLineHeight}px
				}

				.repl .repl-input-wrapper .monaco-editor .lines-content {
					background-color: ${backgroundColor};
				}
			`;
                this.container.style.setProperty(`--vscode-repl-font-family`, fontFamily);
                this.container.style.setProperty(`--vscode-repl-font-size`, `${fontSize}px`);
                this.container.style.setProperty(`--vscode-repl-font-size-for-twistie`, `${fontSize * 1.4 / 2 - 8}px`);
                this.container.style.setProperty(`--vscode-repl-line-height`, lineHeight);
                this.tree.rerender();
                if (this.dimension) {
                    this.layoutBody(this.dimension.height, this.dimension.width);
                }
            }
        }
        navigateHistory(previous) {
            const historyInput = previous ? this.history.previous() : this.history.next();
            if (historyInput) {
                this.replInput.setValue(historyInput);
                aria.status(historyInput);
                // always leave cursor at the end.
                this.replInput.setPosition({ lineNumber: 1, column: historyInput.length + 1 });
                this.setHistoryNavigationEnablement(true);
            }
        }
        async selectSession(session) {
            var _a;
            const treeInput = this.tree && this.tree.getInput();
            if (!session) {
                const focusedSession = this.debugService.getViewModel().focusedSession;
                // If there is a focusedSession focus on that one, otherwise just show any other not ignored session
                if (focusedSession) {
                    session = focusedSession;
                }
                else if (!treeInput || sessionsToIgnore.has(treeInput)) {
                    session = this.debugService.getModel().getSessions(true).find(s => !sessionsToIgnore.has(s));
                }
            }
            if (session) {
                if (this.replElementsChangeListener) {
                    this.replElementsChangeListener.dispose();
                }
                this.replElementsChangeListener = session.onDidChangeReplElements(() => {
                    this.refreshReplElements(session.getReplElements().length === 0);
                });
                if (this.tree && treeInput !== session) {
                    await this.tree.setInput(session);
                    revealLastElement(this.tree);
                }
            }
            (_a = this.replInput) === null || _a === void 0 ? void 0 : _a.updateOptions({ readOnly: this.isReadonly });
            this.updateInputDecoration();
        }
        async clearRepl() {
            const session = this.tree.getInput();
            if (session) {
                session.removeReplExpressions();
                if (session.state === 0 /* State.Inactive */) {
                    // Ignore inactive sessions which got cleared - so they are not shown any more
                    sessionsToIgnore.add(session);
                    await this.selectSession();
                    this.multiSessionRepl.set(this.isMultiSessionView);
                }
            }
            this.replInput.focus();
        }
        acceptReplInput() {
            const session = this.tree.getInput();
            if (session && !this.isReadonly) {
                session.addReplExpression(this.debugService.getViewModel().focusedStackFrame, this.replInput.getValue());
                revealLastElement(this.tree);
                this.history.add(this.replInput.getValue());
                this.replInput.setValue('');
                const shouldRelayout = this.replInputLineCount > 1;
                this.replInputLineCount = 1;
                if (shouldRelayout) {
                    // Trigger a layout to shrink a potential multi line input
                    this.layoutBody(this.dimension.height, this.dimension.width);
                }
            }
        }
        getVisibleContent() {
            let text = '';
            if (this.model) {
                const lineDelimiter = this.textResourcePropertiesService.getEOL(this.model.uri);
                const traverseAndAppend = (node) => {
                    node.children.forEach(child => {
                        if (child.visible) {
                            text += child.element.toString().trimRight() + lineDelimiter;
                            if (!child.collapsed && child.children.length) {
                                traverseAndAppend(child);
                            }
                        }
                    });
                };
                traverseAndAppend(this.tree.getNode());
            }
            return (0, strings_1.removeAnsiEscapeCodes)(text);
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.dimension = new dom.Dimension(width, height);
            const replInputHeight = Math.min(this.replInput.getContentHeight(), height);
            if (this.tree) {
                const lastElementVisible = this.tree.scrollTop + this.tree.renderHeight >= this.tree.scrollHeight;
                const treeHeight = height - replInputHeight;
                this.tree.getHTMLElement().style.height = `${treeHeight}px`;
                this.tree.layout(treeHeight, width);
                if (lastElementVisible) {
                    revealLastElement(this.tree);
                }
            }
            this.replInputContainer.style.height = `${replInputHeight}px`;
            this.replInput.layout({ width: width - 30, height: replInputHeight });
        }
        collapseAll() {
            this.tree.collapseAll();
        }
        getReplInput() {
            return this.replInput;
        }
        focus() {
            setTimeout(() => this.replInput.focus(), 0);
        }
        getActionViewItem(action) {
            var _a;
            if (action.id === selectReplCommandId) {
                const session = (_a = (this.tree ? this.tree.getInput() : undefined)) !== null && _a !== void 0 ? _a : this.debugService.getViewModel().focusedSession;
                return this.instantiationService.createInstance(SelectReplActionViewItem, action, session);
            }
            else if (action.id === FILTER_ACTION_ID) {
                const filterHistory = JSON.parse(this.storageService.get(FILTER_HISTORY_STORAGE_KEY, 1 /* StorageScope.WORKSPACE */, '[]'));
                this.filterActionViewItem = this.instantiationService.createInstance(replFilter_1.ReplFilterActionViewItem, action, (0, nls_1.localize)({ key: 'workbench.debug.filter.placeholder', comment: ['Text in the brackets after e.g. is not localizable'] }, "Filter (e.g. text, !exclude)"), this.filterState, filterHistory, () => (0, historyWidgetKeybindingHint_1.showHistoryKeybindingHint)(this.keybindingService));
                return this.filterActionViewItem;
            }
            return super.getActionViewItem(action);
        }
        get isMultiSessionView() {
            return this.debugService.getModel().getSessions(true).filter(s => s.hasSeparateRepl() && !sessionsToIgnore.has(s)).length > 1;
        }
        // --- Cached locals
        get refreshScheduler() {
            const autoExpanded = new Set();
            return new async_1.RunOnceScheduler(async () => {
                if (!this.tree.getInput()) {
                    return;
                }
                await this.tree.updateChildren(undefined, true, false, { diffIdentityProvider: identityProvider });
                const session = this.tree.getInput();
                if (session) {
                    // Automatically expand repl group elements when specified
                    const autoExpandElements = async (elements) => {
                        for (const element of elements) {
                            if (element instanceof replModel_1.ReplGroup) {
                                if (element.autoExpand && !autoExpanded.has(element.getId())) {
                                    autoExpanded.add(element.getId());
                                    await this.tree.expand(element);
                                }
                                if (!this.tree.isCollapsed(element)) {
                                    // Repl groups can have children which are repl groups thus we might need to expand those as well
                                    await autoExpandElements(element.getChildren());
                                }
                            }
                        }
                    };
                    await autoExpandElements(session.getReplElements());
                }
                // Repl elements count changed, need to update filter stats on the badge
                this.filterState.updateFilterStats();
            }, Repl.REFRESH_DELAY);
        }
        // --- Creation
        renderBody(parent) {
            super.renderBody(parent);
            this.container = dom.append(parent, $('.repl'));
            this.treeContainer = dom.append(this.container, $(`.repl-tree.${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`));
            this.createReplInput(this.container);
            this.createReplTree();
        }
        createReplTree() {
            this.replDelegate = new replViewer_1.ReplDelegate(this.configurationService);
            const wordWrap = this.configurationService.getValue('debug').console.wordWrap;
            this.treeContainer.classList.toggle('word-wrap', wordWrap);
            const linkDetector = this.instantiationService.createInstance(linkDetector_1.LinkDetector);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'DebugRepl', this.treeContainer, this.replDelegate, [
                this.instantiationService.createInstance(replViewer_1.ReplVariablesRenderer, linkDetector),
                this.instantiationService.createInstance(replViewer_1.ReplSimpleElementsRenderer, linkDetector),
                new replViewer_1.ReplEvaluationInputsRenderer(),
                this.instantiationService.createInstance(replViewer_1.ReplGroupRenderer, linkDetector),
                new replViewer_1.ReplEvaluationResultsRenderer(linkDetector),
                new replViewer_1.ReplRawObjectsRenderer(linkDetector),
            ], 
            // https://github.com/microsoft/TypeScript/issues/32526
            new replViewer_1.ReplDataSource(), {
                filter: this.filter,
                accessibilityProvider: new replViewer_1.ReplAccessibilityProvider(),
                identityProvider,
                mouseSupport: false,
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e.toString(true) },
                horizontalScrolling: !wordWrap,
                setRowLineHeight: false,
                supportDynamicHeights: wordWrap,
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            this._register(this.tree.onDidChangeContentHeight(() => {
                if (this.tree.scrollHeight !== this.previousTreeScrollHeight) {
                    const lastElementWasVisible = this.tree.scrollTop + this.tree.renderHeight >= this.previousTreeScrollHeight;
                    if (lastElementWasVisible) {
                        setTimeout(() => {
                            // Can't set scrollTop during this event listener, the list might overwrite the change
                            revealLastElement(this.tree);
                        }, 0);
                    }
                }
                this.previousTreeScrollHeight = this.tree.scrollHeight;
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            let lastSelectedString;
            this._register(this.tree.onMouseClick(() => {
                const selection = window.getSelection();
                if (!selection || selection.type !== 'Range' || lastSelectedString === selection.toString()) {
                    // only focus the input if the user is not currently selecting.
                    this.replInput.focus();
                }
                lastSelectedString = selection ? selection.toString() : '';
            }));
            // Make sure to select the session if debugging is already active
            this.selectSession();
            this.styleElement = dom.createStyleSheet(this.container);
            this.onDidStyleChange();
        }
        createReplInput(container) {
            this.replInputContainer = dom.append(container, $('.repl-input-wrapper'));
            dom.append(this.replInputContainer, $('.repl-input-chevron' + themeService_1.ThemeIcon.asCSSSelector(debugIcons_1.debugConsoleEvaluationPrompt)));
            const { scopedContextKeyService, historyNavigationBackwardsEnablement, historyNavigationForwardsEnablement } = (0, contextScopedHistoryWidget_1.createAndBindHistoryNavigationWidgetScopedContextKeyService)(this.contextKeyService, { target: container, historyNavigator: this });
            this.setHistoryNavigationEnablement = enabled => {
                historyNavigationBackwardsEnablement.set(enabled);
                historyNavigationForwardsEnablement.set(enabled);
            };
            this._register(scopedContextKeyService);
            debug_1.CONTEXT_IN_DEBUG_REPL.bindTo(scopedContextKeyService).set(true);
            this.scopedInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, scopedContextKeyService]));
            const options = (0, simpleEditorOptions_1.getSimpleEditorOptions)();
            options.readOnly = true;
            options.suggest = { showStatusBar: true };
            const config = this.configurationService.getValue('debug');
            options.acceptSuggestionOnEnter = config.console.acceptSuggestionOnEnter === 'on' ? 'on' : 'off';
            options.ariaLabel = (0, nls_1.localize)('debugConsole', "Debug Console");
            this.replInput = this.scopedInstantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, this.replInputContainer, options, (0, simpleEditorOptions_1.getSimpleCodeEditorWidgetOptions)());
            this._register(this.replInput.onDidChangeModelContent(() => {
                const model = this.replInput.getModel();
                this.setHistoryNavigationEnablement(!!model && model.getValue() === '');
                const lineCount = model ? Math.min(10, model.getLineCount()) : 1;
                if (lineCount !== this.replInputLineCount) {
                    this.replInputLineCount = lineCount;
                    this.layoutBody(this.dimension.height, this.dimension.width);
                }
            }));
            // We add the input decoration only when the focus is in the input #61126
            this._register(this.replInput.onDidFocusEditorText(() => this.updateInputDecoration()));
            this._register(this.replInput.onDidBlurEditorText(() => this.updateInputDecoration()));
            this._register(dom.addStandardDisposableListener(this.replInputContainer, dom.EventType.FOCUS, () => this.replInputContainer.classList.add('synthetic-focus')));
            this._register(dom.addStandardDisposableListener(this.replInputContainer, dom.EventType.BLUR, () => this.replInputContainer.classList.remove('synthetic-focus')));
        }
        onContextMenu(e) {
            const actions = [];
            const actionsDisposable = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(this.menu, { arg: e.element, shouldForwardArgs: false }, actions);
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => e.element,
                onHide: () => (0, lifecycle_1.dispose)(actionsDisposable)
            });
        }
        // --- Update
        refreshReplElements(noDelay) {
            if (this.tree && this.isVisible()) {
                if (this.refreshScheduler.isScheduled()) {
                    return;
                }
                this.refreshScheduler.schedule(noDelay ? 0 : undefined);
            }
        }
        updateInputDecoration() {
            var _a;
            if (!this.replInput) {
                return;
            }
            const decorations = [];
            if (this.isReadonly && this.replInput.hasTextFocus() && !this.replInput.getValue()) {
                const transparentForeground = (_a = (0, colorRegistry_1.resolveColorValue)(colorRegistry_1.editorForeground, this.themeService.getColorTheme())) === null || _a === void 0 ? void 0 : _a.transparent(0.4);
                decorations.push({
                    range: {
                        startLineNumber: 0,
                        endLineNumber: 0,
                        startColumn: 0,
                        endColumn: 1
                    },
                    renderOptions: {
                        after: {
                            contentText: (0, nls_1.localize)('startDebugFirst', "Please start a debug session to evaluate expressions"),
                            color: transparentForeground ? transparentForeground.toString() : undefined
                        }
                    }
                });
            }
            this.replInput.setDecorations('repl-decoration', DECORATION_KEY, decorations);
        }
        saveState() {
            const replHistory = this.history.getHistory();
            if (replHistory.length) {
                this.storageService.store(HISTORY_STORAGE_KEY, JSON.stringify(replHistory), 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            }
            else {
                this.storageService.remove(HISTORY_STORAGE_KEY, 1 /* StorageScope.WORKSPACE */);
            }
            if (this.filterActionViewItem) {
                const filterHistory = this.filterActionViewItem.getHistory();
                if (filterHistory.length) {
                    this.storageService.store(FILTER_HISTORY_STORAGE_KEY, JSON.stringify(filterHistory), 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
                }
                else {
                    this.storageService.remove(FILTER_HISTORY_STORAGE_KEY, 1 /* StorageScope.WORKSPACE */);
                }
                const filterValue = this.filterState.filterText;
                if (filterValue) {
                    this.storageService.store(FILTER_VALUE_STORAGE_KEY, filterValue, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
                }
                else {
                    this.storageService.remove(FILTER_VALUE_STORAGE_KEY, 1 /* StorageScope.WORKSPACE */);
                }
            }
            super.saveState();
        }
        dispose() {
            this.replInput.dispose();
            if (this.replElementsChangeListener) {
                this.replElementsChangeListener.dispose();
            }
            this.refreshScheduler.dispose();
            this.modelChangeListener.dispose();
            super.dispose();
        }
    };
    Repl.REFRESH_DELAY = 50; // delay in ms to refresh the repl for new elements to show
    Repl.URI = uri_1.URI.parse(`${debug_1.DEBUG_SCHEME}:replinput`);
    __decorate([
        decorators_1.memoize
    ], Repl.prototype, "refreshScheduler", null);
    Repl = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, themeService_1.IThemeService),
        __param(5, model_1.IModelService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, codeEditorService_1.ICodeEditorService),
        __param(8, views_1.IViewDescriptorService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, textResourceConfiguration_1.ITextResourcePropertiesService),
        __param(12, editorService_1.IEditorService),
        __param(13, keybinding_1.IKeybindingService),
        __param(14, opener_1.IOpenerService),
        __param(15, telemetry_1.ITelemetryService),
        __param(16, actions_1.IMenuService),
        __param(17, languageFeatures_1.ILanguageFeaturesService)
    ], Repl);
    exports.Repl = Repl;
    // Repl actions and commands
    class AcceptReplInputAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'repl.action.acceptInput',
                label: (0, nls_1.localize)({ key: 'actions.repl.acceptInput', comment: ['Apply input from the debug console input box'] }, "REPL Accept Input"),
                alias: 'REPL Accept Input',
                precondition: debug_1.CONTEXT_IN_DEBUG_REPL,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            var _a;
            (_a = suggestController_1.SuggestController.get(editor)) === null || _a === void 0 ? void 0 : _a.cancelSuggestWidget();
            const repl = getReplView(accessor.get(views_1.IViewsService));
            repl === null || repl === void 0 ? void 0 : repl.acceptReplInput();
        }
    }
    class FilterReplAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'repl.action.filter',
                label: (0, nls_1.localize)('repl.action.filter', "REPL Focus Content to Filter"),
                alias: 'REPL Filter',
                precondition: debug_1.CONTEXT_IN_DEBUG_REPL,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.textInputFocus,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            const repl = getReplView(accessor.get(views_1.IViewsService));
            repl === null || repl === void 0 ? void 0 : repl.focusFilter();
        }
    }
    class ReplCopyAllAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'repl.action.copyAll',
                label: (0, nls_1.localize)('actions.repl.copyAll', "Debug: Console Copy All"),
                alias: 'Debug Console Copy All',
                precondition: debug_1.CONTEXT_IN_DEBUG_REPL,
            });
        }
        run(accessor, editor) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const repl = getReplView(accessor.get(views_1.IViewsService));
            if (repl) {
                return clipboardService.writeText(repl.getVisibleContent());
            }
        }
    }
    (0, editorExtensions_1.registerEditorAction)(AcceptReplInputAction);
    (0, editorExtensions_1.registerEditorAction)(ReplCopyAllAction);
    (0, editorExtensions_1.registerEditorAction)(FilterReplAction);
    class SelectReplActionViewItem extends debugActionViewItems_1.FocusSessionActionViewItem {
        getSessions() {
            return this.debugService.getModel().getSessions(true).filter(s => s.hasSeparateRepl() && !sessionsToIgnore.has(s));
        }
        mapFocusedSessionToSelected(focusedSession) {
            while (focusedSession.parentSession && !focusedSession.hasSeparateRepl()) {
                focusedSession = focusedSession.parentSession;
            }
            return focusedSession;
        }
    }
    function getReplView(viewsService) {
        var _a;
        return (_a = viewsService.getActiveViewWithId(debug_1.REPL_VIEW_ID)) !== null && _a !== void 0 ? _a : undefined;
    }
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: FILTER_ACTION_ID,
                title: (0, nls_1.localize)('filter', "Filter"),
                f1: false,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', debug_1.REPL_VIEW_ID),
                    order: 10
                }
            });
        }
        run(_accessor) {
            // noop this action is just a placeholder for the filter action view item
        }
    });
    const selectReplCommandId = 'workbench.action.debug.selectRepl';
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: selectReplCommandId,
                viewId: debug_1.REPL_VIEW_ID,
                title: (0, nls_1.localize)('selectRepl', "Select Debug Console"),
                f1: false,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', debug_1.REPL_VIEW_ID), debug_1.CONTEXT_MULTI_SESSION_REPL),
                    order: 20
                }
            });
        }
        async runInView(accessor, view, session) {
            const debugService = accessor.get(debug_1.IDebugService);
            // If session is already the focused session we need to manualy update the tree since view model will not send a focused change event
            if (session && session.state !== 0 /* State.Inactive */ && session !== debugService.getViewModel().focusedSession) {
                if (session.state !== 2 /* State.Stopped */) {
                    // Focus child session instead if it is stopped #112595
                    const stopppedChildSession = debugService.getModel().getSessions().find(s => s.parentSession === session && s.state === 2 /* State.Stopped */);
                    if (stopppedChildSession) {
                        session = stopppedChildSession;
                    }
                }
                await debugService.focusStackFrame(undefined, undefined, session, { explicit: true });
            }
            // Need to select the session in the view since the focussed session might not have changed
            await view.selectSession(session);
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'workbench.debug.panel.action.clearReplAction',
                viewId: debug_1.REPL_VIEW_ID,
                title: { value: (0, nls_1.localize)('clearRepl', "Clear Console"), original: 'Clear Console' },
                f1: true,
                icon: debugIcons_1.debugConsoleClearAll,
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        when: contextkey_1.ContextKeyExpr.equals('view', debug_1.REPL_VIEW_ID),
                        order: 30
                    }, {
                        id: actions_1.MenuId.DebugConsoleContext,
                        group: 'z_commands',
                        order: 20
                    }]
            });
        }
        runInView(_accessor, view) {
            view.clearRepl();
            aria.status((0, nls_1.localize)('debugConsoleCleared', "Debug console was cleared"));
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'debug.collapseRepl',
                title: (0, nls_1.localize)('collapse', "Collapse All"),
                viewId: debug_1.REPL_VIEW_ID,
                menu: {
                    id: actions_1.MenuId.DebugConsoleContext,
                    group: 'z_commands',
                    order: 10
                }
            });
        }
        runInView(_accessor, view) {
            view.collapseAll();
            view.focus();
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'debug.replPaste',
                title: (0, nls_1.localize)('paste', "Paste"),
                viewId: debug_1.REPL_VIEW_ID,
                precondition: debug_1.CONTEXT_DEBUG_STATE.notEqualsTo((0, debug_1.getStateLabel)(0 /* State.Inactive */)),
                menu: {
                    id: actions_1.MenuId.DebugConsoleContext,
                    group: '2_cutcopypaste',
                    order: 30
                }
            });
        }
        async runInView(accessor, view) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const clipboardText = await clipboardService.readText();
            if (clipboardText) {
                const replInput = view.getReplInput();
                replInput.setValue(replInput.getValue().concat(clipboardText));
                view.focus();
                const model = replInput.getModel();
                const lineNumber = model ? model.getLineCount() : 0;
                const column = model === null || model === void 0 ? void 0 : model.getLineMaxColumn(lineNumber);
                if (typeof lineNumber === 'number' && typeof column === 'number') {
                    replInput.setPosition({ lineNumber, column });
                }
            }
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'workbench.debug.action.copyAll',
                title: (0, nls_1.localize)('copyAll', "Copy All"),
                viewId: debug_1.REPL_VIEW_ID,
                menu: {
                    id: actions_1.MenuId.DebugConsoleContext,
                    group: '2_cutcopypaste',
                    order: 20
                }
            });
        }
        async runInView(accessor, view) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            await clipboardService.writeText(view.getVisibleContent());
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'debug.replCopy',
                title: (0, nls_1.localize)('copy', "Copy"),
                menu: {
                    id: actions_1.MenuId.DebugConsoleContext,
                    group: '2_cutcopypaste',
                    order: 10
                }
            });
        }
        async run(accessor, element) {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const nativeSelection = window.getSelection();
            const selectedText = nativeSelection === null || nativeSelection === void 0 ? void 0 : nativeSelection.toString();
            if (selectedText && selectedText.length > 0) {
                await clipboardService.writeText(selectedText);
            }
            else if (element) {
                await clipboardService.writeText(element.toString());
            }
        }
    });
});
//# sourceMappingURL=repl.js.map