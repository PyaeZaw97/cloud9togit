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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/cancellation", "vs/base/common/collections", "vs/base/common/date", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/iterator", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/contrib/codeEditor/browser/suggestEnabledInput/suggestEnabledInput", "vs/workbench/contrib/preferences/browser/preferencesWidgets", "vs/workbench/contrib/preferences/browser/settingsLayout", "vs/workbench/contrib/preferences/browser/settingsTree", "vs/workbench/contrib/preferences/browser/settingsTreeModels", "vs/workbench/contrib/preferences/browser/tocTree", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/contrib/preferences/common/settingsEditorColorRegistry", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/preferences/common/preferencesModels", "vs/workbench/services/userDataSync/common/userDataSync", "vs/workbench/contrib/preferences/browser/preferencesIcons", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/configuration/common/configuration", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/extensions/common/extensions", "vs/base/browser/ui/splitview/splitview", "vs/base/common/color", "vs/editor/common/languages/language", "vs/workbench/contrib/preferences/browser/settingsSearchMenu", "vs/platform/extensionManagement/common/extensionManagement", "vs/css!./media/settingsEditor2"], function (require, exports, DOM, aria, keyboardEvent_1, actionbar_1, button_1, actions_1, async_1, cancellation_1, collections, date_1, errors_1, event_1, iterator_1, lifecycle_1, platform, types_1, uri_1, nls_1, commands_1, contextkey_1, instantiation_1, log_1, storage_1, telemetry_1, colorRegistry_1, styler_1, themeService_1, userDataSync_1, editorPane_1, suggestEnabledInput_1, preferencesWidgets_1, settingsLayout_1, settingsTree_1, settingsTreeModels_1, tocTree_1, preferences_1, settingsEditorColorRegistry_1, editorGroupsService_1, preferences_2, preferencesModels_1, userDataSync_2, preferencesIcons_1, workspaceTrust_1, configuration_1, textResourceConfiguration_1, extensions_1, splitview_1, color_1, language_1, settingsSearchMenu_1, extensionManagement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsEditor2 = exports.createGroupIterator = exports.SettingsFocusContext = void 0;
    var SettingsFocusContext;
    (function (SettingsFocusContext) {
        SettingsFocusContext[SettingsFocusContext["Search"] = 0] = "Search";
        SettingsFocusContext[SettingsFocusContext["TableOfContents"] = 1] = "TableOfContents";
        SettingsFocusContext[SettingsFocusContext["SettingTree"] = 2] = "SettingTree";
        SettingsFocusContext[SettingsFocusContext["SettingControl"] = 3] = "SettingControl";
    })(SettingsFocusContext = exports.SettingsFocusContext || (exports.SettingsFocusContext = {}));
    function createGroupIterator(group) {
        return iterator_1.Iterable.map(group.children, g => {
            return {
                element: g,
                children: g instanceof settingsTreeModels_1.SettingsTreeGroupElement ?
                    createGroupIterator(g) :
                    undefined
            };
        });
    }
    exports.createGroupIterator = createGroupIterator;
    const $ = DOM.$;
    const searchBoxLabel = (0, nls_1.localize)('SearchSettings.AriaLabel', "Search settings");
    const SETTINGS_EDITOR_STATE_KEY = 'settingsEditorState';
    let SettingsEditor2 = class SettingsEditor2 extends editorPane_1.EditorPane {
        constructor(telemetryService, configurationService, textResourceConfigurationService, themeService, preferencesService, instantiationService, preferencesSearchService, logService, contextKeyService, storageService, editorGroupService, userDataSyncWorkbenchService, userDataSyncEnablementService, workspaceTrustManagementService, extensionService, languageService, extensionManagementService) {
            super(SettingsEditor2.ID, telemetryService, themeService, storageService);
            this.configurationService = configurationService;
            this.preferencesService = preferencesService;
            this.instantiationService = instantiationService;
            this.preferencesSearchService = preferencesSearchService;
            this.logService = logService;
            this.storageService = storageService;
            this.editorGroupService = editorGroupService;
            this.userDataSyncWorkbenchService = userDataSyncWorkbenchService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.extensionService = extensionService;
            this.languageService = languageService;
            this.searchInProgress = null;
            this.pendingSettingUpdate = null;
            this._searchResultModel = null;
            this.searchResultLabel = null;
            this.lastSyncedLabel = null;
            this._currentFocusContext = 0 /* SettingsFocusContext.Search */;
            /** Don't spam warnings */
            this.hasWarnedMissingSettings = false;
            this.tocFocusedElement = null;
            this.treeFocusedElement = null;
            this.settingsTreeScrollTop = 0;
            this.installedExtensionIds = [];
            this.delayedFilterLogging = new async_1.Delayer(1000);
            this.localSearchDelayer = new async_1.Delayer(300);
            this.remoteSearchThrottle = new async_1.ThrottledDelayer(200);
            this.viewState = { settingsTarget: 2 /* ConfigurationTarget.USER_LOCAL */ };
            this.settingFastUpdateDelayer = new async_1.Delayer(SettingsEditor2.SETTING_UPDATE_FAST_DEBOUNCE);
            this.settingSlowUpdateDelayer = new async_1.Delayer(SettingsEditor2.SETTING_UPDATE_SLOW_DEBOUNCE);
            this.searchInputDelayer = new async_1.Delayer(SettingsEditor2.SEARCH_DEBOUNCE);
            this.updatedConfigSchemaDelayer = new async_1.Delayer(SettingsEditor2.CONFIG_SCHEMA_UPDATE_DELAYER);
            this.inSettingsEditorContextKey = preferences_1.CONTEXT_SETTINGS_EDITOR.bindTo(contextKeyService);
            this.searchFocusContextKey = preferences_1.CONTEXT_SETTINGS_SEARCH_FOCUS.bindTo(contextKeyService);
            this.tocRowFocused = preferences_1.CONTEXT_TOC_ROW_FOCUS.bindTo(contextKeyService);
            this.settingRowFocused = preferences_1.CONTEXT_SETTINGS_ROW_FOCUS.bindTo(contextKeyService);
            this.scheduledRefreshes = new Map();
            this.editorMemento = this.getEditorMemento(editorGroupService, textResourceConfigurationService, SETTINGS_EDITOR_STATE_KEY);
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.source !== 6 /* ConfigurationTarget.DEFAULT */) {
                    this.onConfigUpdate(e.affectedKeys);
                }
            }));
            this._register(workspaceTrustManagementService.onDidChangeTrust(() => {
                if (this.searchResultModel) {
                    this.searchResultModel.updateWorkspaceTrust(workspaceTrustManagementService.isWorkspaceTrusted());
                }
                if (this.settingsTreeModel) {
                    this.settingsTreeModel.updateWorkspaceTrust(workspaceTrustManagementService.isWorkspaceTrusted());
                    this.renderTree();
                }
            }));
            this._register(configurationService.onDidChangeRestrictedSettings(e => {
                if (e.default.length && this.currentSettingsModel) {
                    this.updateElementsByKey([...e.default]);
                }
            }));
            this.modelDisposables = this._register(new lifecycle_1.DisposableStore());
            if (preferences_1.ENABLE_LANGUAGE_FILTER && !SettingsEditor2.SUGGESTIONS.includes(`@${preferences_1.LANGUAGE_SETTING_TAG}`)) {
                SettingsEditor2.SUGGESTIONS.push(`@${preferences_1.LANGUAGE_SETTING_TAG}`);
            }
            extensionManagementService.getInstalled().then(extensions => {
                this.installedExtensionIds = extensions
                    .filter(ext => ext.manifest && ext.manifest.contributes && ext.manifest.contributes.configuration)
                    .map(ext => ext.identifier.id);
            });
        }
        static shouldSettingUpdateFast(type) {
            if ((0, types_1.isArray)(type)) {
                // nullable integer/number or complex
                return false;
            }
            return type === preferences_2.SettingValueType.Enum ||
                type === preferences_2.SettingValueType.Array ||
                type === preferences_2.SettingValueType.BooleanObject ||
                type === preferences_2.SettingValueType.Object ||
                type === preferences_2.SettingValueType.Complex ||
                type === preferences_2.SettingValueType.Boolean ||
                type === preferences_2.SettingValueType.Exclude;
        }
        get minimumWidth() { return SettingsEditor2.EDITOR_MIN_WIDTH; }
        get maximumWidth() { return Number.POSITIVE_INFINITY; }
        // these setters need to exist because this extends from EditorPane
        set minimumWidth(value) { }
        set maximumWidth(value) { }
        get currentSettingsModel() {
            return this.searchResultModel || this.settingsTreeModel;
        }
        get searchResultModel() {
            return this._searchResultModel;
        }
        set searchResultModel(value) {
            this._searchResultModel = value;
            this.rootElement.classList.toggle('search-mode', !!this._searchResultModel);
        }
        get focusedSettingDOMElement() {
            const focused = this.settingsTree.getFocus()[0];
            if (!(focused instanceof settingsTreeModels_1.SettingsTreeSettingElement)) {
                return;
            }
            return this.settingRenderers.getDOMElementsForSettingKey(this.settingsTree.getHTMLElement(), focused.setting.key)[0];
        }
        get currentFocusContext() {
            return this._currentFocusContext;
        }
        createEditor(parent) {
            parent.setAttribute('tabindex', '-1');
            this.rootElement = DOM.append(parent, $('.settings-editor', { tabindex: '-1' }));
            this.createHeader(this.rootElement);
            this.createBody(this.rootElement);
            this.addCtrlAInterceptor(this.rootElement);
            this.updateStyles();
        }
        async setInput(input, options, context, token) {
            this.inSettingsEditorContextKey.set(true);
            await super.setInput(input, options, context, token);
            await (0, async_1.timeout)(0); // Force setInput to be async
            if (!this.input) {
                return;
            }
            const model = await this.input.resolve();
            if (token.isCancellationRequested || !(model instanceof preferencesModels_1.Settings2EditorModel)) {
                return;
            }
            this.modelDisposables.clear();
            this.modelDisposables.add(model.onDidChangeGroups(() => {
                this.updatedConfigSchemaDelayer.trigger(() => {
                    this.onConfigUpdate(undefined, false, true);
                });
            }));
            this.defaultSettingsEditorModel = model;
            options = options || (0, preferences_2.validateSettingsEditorOptions)({});
            if (!this.viewState.settingsTarget) {
                if (!options.target) {
                    options.target = 2 /* ConfigurationTarget.USER_LOCAL */;
                }
            }
            this._setOptions(options);
            // Don't block setInput on render (which can trigger an async search)
            this.onConfigUpdate(undefined, true).then(() => {
                this._register(input.onWillDispose(() => {
                    this.searchWidget.setValue('');
                }));
                // Init TOC selection
                this.updateTreeScrollSync();
            });
        }
        restoreCachedState() {
            const cachedState = this.group && this.input && this.editorMemento.loadEditorState(this.group, this.input);
            if (cachedState && typeof cachedState.target === 'object') {
                cachedState.target = uri_1.URI.revive(cachedState.target);
            }
            if (cachedState) {
                const settingsTarget = cachedState.target;
                this.settingsTargetsWidget.settingsTarget = settingsTarget;
                this.viewState.settingsTarget = settingsTarget;
                this.searchWidget.setValue(cachedState.searchQuery);
            }
            if (this.input) {
                this.editorMemento.clearEditorState(this.input, this.group);
            }
            return (0, types_1.withUndefinedAsNull)(cachedState);
        }
        setOptions(options) {
            super.setOptions(options);
            if (options) {
                this._setOptions(options);
            }
        }
        _setOptions(options) {
            if (options.focusSearch && !platform.isIOS) {
                // isIOS - #122044
                this.focusSearch();
            }
            if (options.query) {
                this.searchWidget.setValue(options.query);
            }
            const target = options.folderUri || options.target;
            if (target) {
                this.settingsTargetsWidget.settingsTarget = target;
                this.viewState.settingsTarget = target;
            }
        }
        clearInput() {
            this.inSettingsEditorContextKey.set(false);
            super.clearInput();
        }
        layout(dimension) {
            this.dimension = dimension;
            if (!this.isVisible()) {
                return;
            }
            this.layoutSplitView(dimension);
            const innerWidth = Math.min(1000, dimension.width) - 24 * 2; // 24px padding on left and right;
            // minus padding inside inputbox, countElement width, controls width, extra padding before countElement
            const monacoWidth = innerWidth - 10 - this.countElement.clientWidth - this.controlsElement.clientWidth - 12;
            this.searchWidget.layout(new DOM.Dimension(monacoWidth, 20));
            this.rootElement.classList.toggle('mid-width', dimension.width < SettingsEditor2.MEDIUM_TOTAL_WIDTH && dimension.width >= SettingsEditor2.NARROW_TOTAL_WIDTH);
            this.rootElement.classList.toggle('narrow-width', dimension.width < SettingsEditor2.NARROW_TOTAL_WIDTH);
        }
        focus() {
            if (this._currentFocusContext === 0 /* SettingsFocusContext.Search */) {
                if (!platform.isIOS) {
                    // #122044
                    this.focusSearch();
                }
            }
            else if (this._currentFocusContext === 3 /* SettingsFocusContext.SettingControl */) {
                const element = this.focusedSettingDOMElement;
                if (element) {
                    const control = element.querySelector(settingsTree_1.AbstractSettingRenderer.CONTROL_SELECTOR);
                    if (control) {
                        control.focus();
                        return;
                    }
                }
            }
            else if (this._currentFocusContext === 2 /* SettingsFocusContext.SettingTree */) {
                this.settingsTree.domFocus();
            }
            else if (this._currentFocusContext === 1 /* SettingsFocusContext.TableOfContents */) {
                this.tocTree.domFocus();
            }
        }
        setEditorVisible(visible, group) {
            super.setEditorVisible(visible, group);
            if (!visible) {
                // Wait for editor to be removed from DOM #106303
                setTimeout(() => {
                    this.searchWidget.onHide();
                }, 0);
            }
        }
        focusSettings(focusSettingInput = false) {
            const focused = this.settingsTree.getFocus();
            if (!focused.length) {
                this.settingsTree.focusFirst();
            }
            this.settingsTree.domFocus();
            if (focusSettingInput) {
                const controlInFocusedRow = this.settingsTree.getHTMLElement().querySelector(`.focused ${settingsTree_1.AbstractSettingRenderer.CONTROL_SELECTOR}`);
                if (controlInFocusedRow) {
                    controlInFocusedRow.focus();
                }
            }
        }
        focusTOC() {
            this.tocTree.domFocus();
        }
        showContextMenu() {
            const focused = this.settingsTree.getFocus()[0];
            const rowElement = this.focusedSettingDOMElement;
            if (rowElement && focused instanceof settingsTreeModels_1.SettingsTreeSettingElement) {
                this.settingRenderers.showContextMenu(focused, rowElement);
            }
        }
        focusSearch(filter, selectAll = true) {
            if (filter && this.searchWidget) {
                this.searchWidget.setValue(filter);
            }
            this.searchWidget.focus(selectAll);
        }
        clearSearchResults() {
            this.searchWidget.setValue('');
            this.focusSearch();
        }
        clearSearchFilters() {
            let query = this.searchWidget.getValue();
            const splitQuery = query.split(' ').filter(word => {
                return word.length && !SettingsEditor2.SUGGESTIONS.some(suggestion => word.startsWith(suggestion));
            });
            this.searchWidget.setValue(splitQuery.join(' '));
        }
        updateInputAriaLabel() {
            let label = searchBoxLabel;
            if (this.searchResultLabel) {
                label += `. ${this.searchResultLabel}`;
            }
            if (this.lastSyncedLabel) {
                label += `. ${this.lastSyncedLabel}`;
            }
            this.searchWidget.updateAriaLabel(label);
        }
        createHeader(parent) {
            this.headerContainer = DOM.append(parent, $('.settings-header'));
            const searchContainer = DOM.append(this.headerContainer, $('.search-container'));
            const clearInputAction = new actions_1.Action(preferences_1.SETTINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS, (0, nls_1.localize)('clearInput', "Clear Settings Search Input"), themeService_1.ThemeIcon.asClassName(preferencesIcons_1.preferencesClearInputIcon), false, async () => this.clearSearchResults());
            const filterAction = new actions_1.Action(preferences_1.SETTINGS_EDITOR_COMMAND_SUGGEST_FILTERS, (0, nls_1.localize)('filterInput', "Filter Settings"), themeService_1.ThemeIcon.asClassName(preferencesIcons_1.preferencesFilterIcon));
            this.searchWidget = this._register(this.instantiationService.createInstance(suggestEnabledInput_1.SuggestEnabledInput, `${SettingsEditor2.ID}.searchbox`, searchContainer, {
                triggerCharacters: ['@', ':'],
                provideResults: (query) => {
                    // Based on testing, the trigger character is always at the end of the query.
                    // for the ':' trigger, only return suggestions if there was a '@' before it in the same word.
                    const queryParts = query.split(/\s/g);
                    if (queryParts[queryParts.length - 1].startsWith(`@${preferences_1.LANGUAGE_SETTING_TAG}`)) {
                        const sortedLanguages = this.languageService.getRegisteredLanguageIds().map(languageId => {
                            return `@${preferences_1.LANGUAGE_SETTING_TAG}${languageId} `;
                        }).sort();
                        return sortedLanguages.filter(langFilter => !query.includes(langFilter));
                    }
                    else if (queryParts[queryParts.length - 1].startsWith(`@${preferences_1.EXTENSION_SETTING_TAG}`)) {
                        const installedExtensionsTags = this.installedExtensionIds.map(extensionId => {
                            return `@${preferences_1.EXTENSION_SETTING_TAG}${extensionId} `;
                        }).sort();
                        return installedExtensionsTags.filter(extFilter => !query.includes(extFilter));
                    }
                    else if (queryParts[queryParts.length - 1].startsWith('@')) {
                        return SettingsEditor2.SUGGESTIONS.filter(tag => !query.includes(tag)).map(tag => tag.endsWith(':') ? tag : tag + ' ');
                    }
                    return [];
                }
            }, searchBoxLabel, 'settingseditor:searchinput' + SettingsEditor2.NUM_INSTANCES++, {
                placeholderText: searchBoxLabel,
                focusContextKey: this.searchFocusContextKey,
                // TODO: Aria-live
            }));
            this._register(this.searchWidget.onFocus(() => {
                this._currentFocusContext = 0 /* SettingsFocusContext.Search */;
            }));
            this._register((0, suggestEnabledInput_1.attachSuggestEnabledInputBoxStyler)(this.searchWidget, this.themeService, {
                inputBorder: settingsEditorColorRegistry_1.settingsTextInputBorder
            }));
            this.countElement = DOM.append(searchContainer, DOM.$('.settings-count-widget.monaco-count-badge.long'));
            this._register((0, styler_1.attachStylerCallback)(this.themeService, { badgeBackground: colorRegistry_1.badgeBackground, contrastBorder: colorRegistry_1.contrastBorder, badgeForeground: colorRegistry_1.badgeForeground }, colors => {
                const background = colors.badgeBackground ? colors.badgeBackground.toString() : '';
                const border = colors.contrastBorder ? colors.contrastBorder.toString() : '';
                const foreground = colors.badgeForeground ? colors.badgeForeground.toString() : '';
                this.countElement.style.backgroundColor = background;
                this.countElement.style.color = foreground;
                this.countElement.style.borderWidth = border ? '1px' : '';
                this.countElement.style.borderStyle = border ? 'solid' : '';
                this.countElement.style.borderColor = border;
            }));
            this._register(this.searchWidget.onInputDidChange(() => {
                const searchVal = this.searchWidget.getValue();
                clearInputAction.enabled = !!searchVal;
                this.searchInputDelayer.trigger(() => this.onSearchInputChanged());
            }));
            const headerControlsContainer = DOM.append(this.headerContainer, $('.settings-header-controls'));
            this._register((0, styler_1.attachStylerCallback)(this.themeService, { settingsHeaderBorder: settingsEditorColorRegistry_1.settingsHeaderBorder }, colors => {
                const border = colors.settingsHeaderBorder ? colors.settingsHeaderBorder.toString() : '';
                headerControlsContainer.style.borderColor = border;
            }));
            const targetWidgetContainer = DOM.append(headerControlsContainer, $('.settings-target-container'));
            this.settingsTargetsWidget = this._register(this.instantiationService.createInstance(preferencesWidgets_1.SettingsTargetsWidget, targetWidgetContainer, { enableRemoteSettings: true }));
            this.settingsTargetsWidget.settingsTarget = 2 /* ConfigurationTarget.USER_LOCAL */;
            this.settingsTargetsWidget.onDidTargetChange(target => this.onDidSettingsTargetChange(target));
            this._register(DOM.addDisposableListener(targetWidgetContainer, DOM.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.keyCode === 18 /* KeyCode.DownArrow */) {
                    this.focusSettings();
                }
            }));
            if (this.userDataSyncWorkbenchService.enabled && this.userDataSyncEnablementService.canToggleEnablement()) {
                const syncControls = this._register(this.instantiationService.createInstance(SyncControls, headerControlsContainer));
                this._register(syncControls.onDidChangeLastSyncedLabel(lastSyncedLabel => {
                    this.lastSyncedLabel = lastSyncedLabel;
                    this.updateInputAriaLabel();
                }));
            }
            this.controlsElement = DOM.append(searchContainer, DOM.$('.settings-clear-widget'));
            const actionBar = this._register(new actionbar_1.ActionBar(this.controlsElement, {
                animated: false,
                actionViewItemProvider: (action) => {
                    if (action.id === filterAction.id) {
                        return this.instantiationService.createInstance(settingsSearchMenu_1.SettingsSearchFilterDropdownMenuActionViewItem, action, this.actionRunner, this.searchWidget);
                    }
                    return undefined;
                }
            }));
            actionBar.push([clearInputAction, filterAction], { label: false, icon: true });
        }
        onDidSettingsTargetChange(target) {
            this.viewState.settingsTarget = target;
            // TODO Instead of rebuilding the whole model, refresh and uncache the inspected setting value
            this.onConfigUpdate(undefined, true);
        }
        onDidClickSetting(evt, recursed) {
            const elements = this.currentSettingsModel.getElementsByName(evt.targetKey);
            if (elements && elements[0]) {
                let sourceTop = 0.5;
                try {
                    const _sourceTop = this.settingsTree.getRelativeTop(evt.source);
                    if (_sourceTop !== null) {
                        sourceTop = _sourceTop;
                    }
                }
                catch (_a) {
                    // e.g. clicked a searched element, now the search has been cleared
                }
                this.settingsTree.reveal(elements[0], sourceTop);
                // We need to shift focus from the setting that contains the link to the setting that's
                //  linked. Clicking on the link sets focus on the setting that contains the link,
                //  which is why we need the setTimeout
                setTimeout(() => this.settingsTree.setFocus([elements[0]]), 50);
                const domElements = this.settingRenderers.getDOMElementsForSettingKey(this.settingsTree.getHTMLElement(), evt.targetKey);
                if (domElements && domElements[0]) {
                    const control = domElements[0].querySelector(settingsTree_1.AbstractSettingRenderer.CONTROL_SELECTOR);
                    if (control) {
                        control.focus();
                    }
                }
            }
            else if (!recursed) {
                const p = this.triggerSearch('');
                p.then(() => {
                    this.searchWidget.setValue('');
                    this.onDidClickSetting(evt, true);
                });
            }
        }
        switchToSettingsFile() {
            const query = (0, settingsTreeModels_1.parseQuery)(this.searchWidget.getValue()).query;
            return this.openSettingsFile({ query });
        }
        async openSettingsFile(options) {
            const currentSettingsTarget = this.settingsTargetsWidget.settingsTarget;
            const openOptions = Object.assign({ jsonEditor: true }, options);
            if (currentSettingsTarget === 2 /* ConfigurationTarget.USER_LOCAL */) {
                return this.preferencesService.openUserSettings(openOptions);
            }
            else if (currentSettingsTarget === 3 /* ConfigurationTarget.USER_REMOTE */) {
                return this.preferencesService.openRemoteSettings(openOptions);
            }
            else if (currentSettingsTarget === 4 /* ConfigurationTarget.WORKSPACE */) {
                return this.preferencesService.openWorkspaceSettings(openOptions);
            }
            else if (uri_1.URI.isUri(currentSettingsTarget)) {
                return this.preferencesService.openFolderSettings(Object.assign({ folderUri: currentSettingsTarget }, openOptions));
            }
            return undefined;
        }
        createBody(parent) {
            this.bodyContainer = DOM.append(parent, $('.settings-body'));
            this.noResultsMessage = DOM.append(this.bodyContainer, $('.no-results-message'));
            this.noResultsMessage.innerText = (0, nls_1.localize)('noResults', "No Settings Found");
            this.clearFilterLinkContainer = $('span.clear-search-filters');
            this.clearFilterLinkContainer.textContent = ' - ';
            const clearFilterLink = DOM.append(this.clearFilterLinkContainer, $('a.pointer.prominent', { tabindex: 0 }, (0, nls_1.localize)('clearSearchFilters', 'Clear Filters')));
            this._register(DOM.addDisposableListener(clearFilterLink, DOM.EventType.CLICK, (e) => {
                DOM.EventHelper.stop(e, false);
                this.clearSearchFilters();
            }));
            DOM.append(this.noResultsMessage, this.clearFilterLinkContainer);
            this._register((0, styler_1.attachStylerCallback)(this.themeService, { editorForeground: colorRegistry_1.editorForeground }, colors => {
                this.noResultsMessage.style.color = colors.editorForeground ? colors.editorForeground.toString() : '';
            }));
            this.tocTreeContainer = $('.settings-toc-container');
            this.settingsTreeContainer = $('.settings-tree-container');
            this.createTOC(this.tocTreeContainer);
            this.createSettingsTree(this.settingsTreeContainer);
            this.splitView = new splitview_1.SplitView(this.bodyContainer, {
                orientation: 1 /* Orientation.HORIZONTAL */,
                proportionalLayout: true
            });
            const startingWidth = this.storageService.getNumber('settingsEditor2.splitViewWidth', 0 /* StorageScope.GLOBAL */, SettingsEditor2.TOC_RESET_WIDTH);
            this.splitView.addView({
                onDidChange: event_1.Event.None,
                element: this.tocTreeContainer,
                minimumSize: SettingsEditor2.TOC_MIN_WIDTH,
                maximumSize: Number.POSITIVE_INFINITY,
                layout: (width, _, height) => {
                    this.tocTreeContainer.style.width = `${width}px`;
                    this.tocTree.layout(height, width);
                }
            }, startingWidth, undefined, true);
            this.splitView.addView({
                onDidChange: event_1.Event.None,
                element: this.settingsTreeContainer,
                minimumSize: SettingsEditor2.EDITOR_MIN_WIDTH,
                maximumSize: Number.POSITIVE_INFINITY,
                layout: (width, _, height) => {
                    this.settingsTreeContainer.style.width = `${width}px`;
                    this.settingsTree.layout(height, width);
                }
            }, splitview_1.Sizing.Distribute, undefined, true);
            this._register(this.splitView.onDidSashReset(() => {
                const totalSize = this.splitView.getViewSize(0) + this.splitView.getViewSize(1);
                this.splitView.resizeView(0, SettingsEditor2.TOC_RESET_WIDTH);
                this.splitView.resizeView(1, totalSize - SettingsEditor2.TOC_RESET_WIDTH);
            }));
            this._register(this.splitView.onDidSashChange(() => {
                const width = this.splitView.getViewSize(0);
                this.storageService.store('settingsEditor2.splitViewWidth', width, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
            }));
            const borderColor = this.theme.getColor(settingsEditorColorRegistry_1.settingsSashBorder);
            this.splitView.style({ separatorBorder: borderColor });
        }
        addCtrlAInterceptor(container) {
            this._register(DOM.addStandardDisposableListener(container, DOM.EventType.KEY_DOWN, (e) => {
                if (e.keyCode === 31 /* KeyCode.KeyA */ &&
                    (platform.isMacintosh ? e.metaKey : e.ctrlKey) &&
                    e.target.tagName !== 'TEXTAREA' &&
                    e.target.tagName !== 'INPUT') {
                    // Avoid browser ctrl+a
                    e.browserEvent.stopPropagation();
                    e.browserEvent.preventDefault();
                }
            }));
        }
        createTOC(container) {
            this.tocTreeModel = this.instantiationService.createInstance(tocTree_1.TOCTreeModel, this.viewState);
            this.tocTree = this._register(this.instantiationService.createInstance(tocTree_1.TOCTree, DOM.append(container, $('.settings-toc-wrapper', {
                'role': 'navigation',
                'aria-label': (0, nls_1.localize)('settings', "Settings"),
            })), this.viewState));
            this._register(this.tocTree.onDidFocus(() => {
                this._currentFocusContext = 1 /* SettingsFocusContext.TableOfContents */;
            }));
            this._register(this.tocTree.onDidChangeFocus(e => {
                const element = e.elements[0];
                if (this.tocFocusedElement === element) {
                    return;
                }
                this.tocFocusedElement = element;
                this.tocTree.setSelection(element ? [element] : []);
                if (this.searchResultModel) {
                    if (this.viewState.filterToCategory !== element) {
                        this.viewState.filterToCategory = (0, types_1.withNullAsUndefined)(element);
                        this.renderTree();
                        this.settingsTree.scrollTop = 0;
                    }
                }
                else if (element && (!e.browserEvent || !e.browserEvent.fromScroll)) {
                    this.settingsTree.reveal(element, 0);
                    this.settingsTree.setFocus([element]);
                }
            }));
            this._register(this.tocTree.onDidFocus(() => {
                this.tocRowFocused.set(true);
            }));
            this._register(this.tocTree.onDidBlur(() => {
                this.tocRowFocused.set(false);
            }));
        }
        createSettingsTree(container) {
            this.settingRenderers = this.instantiationService.createInstance(settingsTree_1.SettingTreeRenderers);
            this._register(this.settingRenderers.onDidChangeSetting(e => this.onDidChangeSetting(e.key, e.value, e.type, e.manualReset)));
            this._register(this.settingRenderers.onDidOpenSettings(settingKey => {
                this.openSettingsFile({ revealSetting: { key: settingKey, edit: true } });
            }));
            this._register(this.settingRenderers.onDidClickSettingLink(settingName => this.onDidClickSetting(settingName)));
            this._register(this.settingRenderers.onDidFocusSetting(element => {
                this.settingsTree.setFocus([element]);
                this._currentFocusContext = 3 /* SettingsFocusContext.SettingControl */;
                this.settingRowFocused.set(false);
            }));
            this._register(this.settingRenderers.onDidClickOverrideElement((element) => {
                if (element.scope.toLowerCase() === 'workspace') {
                    this.settingsTargetsWidget.updateTarget(4 /* ConfigurationTarget.WORKSPACE */);
                }
                else if (element.scope.toLowerCase() === 'user') {
                    this.settingsTargetsWidget.updateTarget(2 /* ConfigurationTarget.USER_LOCAL */);
                }
                else if (element.scope.toLowerCase() === 'remote') {
                    this.settingsTargetsWidget.updateTarget(3 /* ConfigurationTarget.USER_REMOTE */);
                }
                this.searchWidget.setValue(element.targetKey);
            }));
            this._register(this.settingRenderers.onDidChangeSettingHeight((params) => {
                const { element, height } = params;
                try {
                    this.settingsTree.updateElementHeight(element, height);
                }
                catch (e) {
                    // the element was not found
                }
            }));
            this._register(this.settingRenderers.onApplyLanguageFilter((lang) => {
                if (this.searchWidget) {
                    // Prepend the language filter to the query.
                    const newQuery = `@${preferences_1.LANGUAGE_SETTING_TAG}${lang} ${this.searchWidget.getValue().trimStart()}`;
                    this.focusSearch(newQuery, false);
                }
            }));
            this.settingsTree = this._register(this.instantiationService.createInstance(settingsTree_1.SettingsTree, container, this.viewState, this.settingRenderers.allRenderers));
            this._register(this.settingsTree.onDidScroll(() => {
                if (this.settingsTree.scrollTop === this.settingsTreeScrollTop) {
                    return;
                }
                this.settingsTreeScrollTop = this.settingsTree.scrollTop;
                // setTimeout because calling setChildren on the settingsTree can trigger onDidScroll, so it fires when
                // setChildren has called on the settings tree but not the toc tree yet, so their rendered elements are out of sync
                setTimeout(() => {
                    this.updateTreeScrollSync();
                }, 0);
            }));
            this._register(this.settingsTree.onDidFocus(() => {
                var _a;
                if ((_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.classList.contains('monaco-list')) {
                    this._currentFocusContext = 2 /* SettingsFocusContext.SettingTree */;
                    this.settingRowFocused.set(true);
                }
            }));
            this._register(this.settingsTree.onDidBlur(() => {
                this.settingRowFocused.set(false);
            }));
            // There is no different select state in the settings tree
            this._register(this.settingsTree.onDidChangeFocus(e => {
                const element = e.elements[0];
                if (this.treeFocusedElement === element) {
                    return;
                }
                if (this.treeFocusedElement) {
                    this.treeFocusedElement.tabbable = false;
                }
                this.treeFocusedElement = element;
                if (this.treeFocusedElement) {
                    this.treeFocusedElement.tabbable = true;
                }
                this.settingsTree.setSelection(element ? [element] : []);
            }));
        }
        onDidChangeSetting(key, value, type, manualReset) {
            const parsedQuery = (0, settingsTreeModels_1.parseQuery)(this.searchWidget.getValue());
            const languageFilter = parsedQuery.languageFilter;
            if (this.pendingSettingUpdate && this.pendingSettingUpdate.key !== key) {
                this.updateChangedSetting(key, value, manualReset, languageFilter);
            }
            this.pendingSettingUpdate = { key, value, languageFilter };
            if (SettingsEditor2.shouldSettingUpdateFast(type)) {
                this.settingFastUpdateDelayer.trigger(() => this.updateChangedSetting(key, value, manualReset, languageFilter));
            }
            else {
                this.settingSlowUpdateDelayer.trigger(() => this.updateChangedSetting(key, value, manualReset, languageFilter));
            }
        }
        updateTreeScrollSync() {
            this.settingRenderers.cancelSuggesters();
            if (this.searchResultModel) {
                return;
            }
            if (!this.tocTreeModel) {
                return;
            }
            const elementToSync = this.settingsTree.firstVisibleElement;
            const element = elementToSync instanceof settingsTreeModels_1.SettingsTreeSettingElement ? elementToSync.parent :
                elementToSync instanceof settingsTreeModels_1.SettingsTreeGroupElement ? elementToSync :
                    null;
            // It's possible for this to be called when the TOC and settings tree are out of sync - e.g. when the settings tree has deferred a refresh because
            // it is focused. So, bail if element doesn't exist in the TOC.
            let nodeExists = true;
            try {
                this.tocTree.getNode(element);
            }
            catch (e) {
                nodeExists = false;
            }
            if (!nodeExists) {
                return;
            }
            if (element && this.tocTree.getSelection()[0] !== element) {
                const ancestors = this.getAncestors(element);
                ancestors.forEach(e => this.tocTree.expand(e));
                this.tocTree.reveal(element);
                const elementTop = this.tocTree.getRelativeTop(element);
                if (typeof elementTop !== 'number') {
                    return;
                }
                this.tocTree.collapseAll();
                ancestors.forEach(e => this.tocTree.expand(e));
                if (elementTop < 0 || elementTop > 1) {
                    this.tocTree.reveal(element);
                }
                else {
                    this.tocTree.reveal(element, elementTop);
                }
                this.tocTree.expand(element);
                this.tocTree.setSelection([element]);
                const fakeKeyboardEvent = new KeyboardEvent('keydown');
                fakeKeyboardEvent.fromScroll = true;
                this.tocTree.setFocus([element], fakeKeyboardEvent);
            }
        }
        getAncestors(element) {
            const ancestors = [];
            while (element.parent) {
                if (element.parent.id !== 'root') {
                    ancestors.push(element.parent);
                }
                element = element.parent;
            }
            return ancestors.reverse();
        }
        updateChangedSetting(key, value, manualReset, languageFilter) {
            // ConfigurationService displays the error if this fails.
            // Force a render afterwards because onDidConfigurationUpdate doesn't fire if the update doesn't result in an effective setting value change
            const settingsTarget = this.settingsTargetsWidget.settingsTarget;
            const resource = uri_1.URI.isUri(settingsTarget) ? settingsTarget : undefined;
            const configurationTarget = (resource ? 5 /* ConfigurationTarget.WORKSPACE_FOLDER */ : settingsTarget);
            const overrides = { resource, overrideIdentifiers: languageFilter ? [languageFilter] : undefined };
            const configurationTargetIsWorkspace = configurationTarget === 4 /* ConfigurationTarget.WORKSPACE */ || configurationTarget === 5 /* ConfigurationTarget.WORKSPACE_FOLDER */;
            const userPassedInManualReset = configurationTargetIsWorkspace || !!languageFilter;
            const isManualReset = userPassedInManualReset ? manualReset : value === undefined;
            // If the user is changing the value back to the default, and we're not targeting a workspace scope, do a 'reset' instead
            const inspected = this.configurationService.inspect(key, overrides);
            if (!userPassedInManualReset && inspected.defaultValue === value) {
                value = undefined;
            }
            return this.configurationService.updateValue(key, value, overrides, configurationTarget)
                .then(() => {
                const query = this.searchWidget.getValue();
                if (query.includes(`@${preferences_1.MODIFIED_SETTING_TAG}`)) {
                    // The user might have reset a setting.
                    this.refreshTOCTree();
                }
                this.renderTree(key, isManualReset);
                const reportModifiedProps = {
                    key,
                    query,
                    searchResults: this.searchResultModel && this.searchResultModel.getUniqueResults(),
                    rawResults: this.searchResultModel && this.searchResultModel.getRawResults(),
                    showConfiguredOnly: !!this.viewState.tagFilters && this.viewState.tagFilters.has(preferences_1.MODIFIED_SETTING_TAG),
                    isReset: typeof value === 'undefined',
                    settingsTarget: this.settingsTargetsWidget.settingsTarget
                };
                return this.reportModifiedSetting(reportModifiedProps);
            });
        }
        reportModifiedSetting(props) {
            this.pendingSettingUpdate = null;
            let groupId = undefined;
            let nlpIndex = undefined;
            let displayIndex = undefined;
            if (props.searchResults) {
                const remoteResult = props.searchResults[1 /* SearchResultIdx.Remote */];
                const localResult = props.searchResults[0 /* SearchResultIdx.Local */];
                const localIndex = localResult.filterMatches.findIndex(m => m.setting.key === props.key);
                groupId = localIndex >= 0 ?
                    'local' :
                    'remote';
                displayIndex = localIndex >= 0 ?
                    localIndex :
                    remoteResult && (remoteResult.filterMatches.findIndex(m => m.setting.key === props.key) + localResult.filterMatches.length);
                if (this.searchResultModel) {
                    const rawResults = this.searchResultModel.getRawResults();
                    if (rawResults[1 /* SearchResultIdx.Remote */]) {
                        const _nlpIndex = rawResults[1 /* SearchResultIdx.Remote */].filterMatches.findIndex(m => m.setting.key === props.key);
                        nlpIndex = _nlpIndex >= 0 ? _nlpIndex : undefined;
                    }
                }
            }
            const reportedTarget = props.settingsTarget === 2 /* ConfigurationTarget.USER_LOCAL */ ? 'user' :
                props.settingsTarget === 3 /* ConfigurationTarget.USER_REMOTE */ ? 'user_remote' :
                    props.settingsTarget === 4 /* ConfigurationTarget.WORKSPACE */ ? 'workspace' :
                        'folder';
            const data = {
                key: props.key,
                groupId,
                nlpIndex,
                displayIndex,
                showConfiguredOnly: props.showConfiguredOnly,
                isReset: props.isReset,
                target: reportedTarget
            };
            this.telemetryService.publicLog2('settingsEditor.settingModified', data);
        }
        onSearchModeToggled() {
            this.rootElement.classList.remove('no-toc-search');
            if (this.configurationService.getValue('workbench.settings.settingsSearchTocBehavior') === 'hide') {
                this.rootElement.classList.toggle('no-toc-search', !!this.searchResultModel);
            }
        }
        scheduleRefresh(element, key = '') {
            if (key && this.scheduledRefreshes.has(key)) {
                return;
            }
            if (!key) {
                (0, lifecycle_1.dispose)(this.scheduledRefreshes.values());
                this.scheduledRefreshes.clear();
            }
            const scheduledRefreshTracker = DOM.trackFocus(element);
            this.scheduledRefreshes.set(key, scheduledRefreshTracker);
            scheduledRefreshTracker.onDidBlur(() => {
                scheduledRefreshTracker.dispose();
                this.scheduledRefreshes.delete(key);
                this.onConfigUpdate([key]);
            });
        }
        async onConfigUpdate(keys, forceRefresh = false, schemaChange = false) {
            if (keys && this.settingsTreeModel) {
                return this.updateElementsByKey(keys);
            }
            const groups = this.defaultSettingsEditorModel.settingsGroups.slice(1); // Without commonlyUsed
            const dividedGroups = collections.groupBy(groups, g => g.extensionInfo ? 'extension' : 'core');
            const settingsResult = (0, settingsTree_1.resolveSettingsTree)(settingsLayout_1.tocData, dividedGroups.core, this.logService);
            const resolvedSettingsRoot = settingsResult.tree;
            // Warn for settings not included in layout
            if (settingsResult.leftoverSettings.size && !this.hasWarnedMissingSettings) {
                const settingKeyList = [];
                settingsResult.leftoverSettings.forEach(s => {
                    settingKeyList.push(s.key);
                });
                this.logService.warn(`SettingsEditor2: Settings not included in settingsLayout.ts: ${settingKeyList.join(', ')}`);
                this.hasWarnedMissingSettings = true;
            }
            const commonlyUsed = (0, settingsTree_1.resolveSettingsTree)(settingsLayout_1.commonlyUsedData, dividedGroups.core, this.logService);
            resolvedSettingsRoot.children.unshift(commonlyUsed.tree);
            resolvedSettingsRoot.children.push(await (0, settingsTree_1.createTocTreeForExtensionSettings)(this.extensionService, dividedGroups.extension || []));
            if (!this.workspaceTrustManagementService.isWorkspaceTrusted() && (this.viewState.settingsTarget instanceof uri_1.URI || this.viewState.settingsTarget === 4 /* ConfigurationTarget.WORKSPACE */)) {
                const configuredUntrustedWorkspaceSettings = (0, settingsTree_1.resolveConfiguredUntrustedSettings)(groups, this.viewState.settingsTarget, this.viewState.languageFilter, this.configurationService);
                if (configuredUntrustedWorkspaceSettings.length) {
                    resolvedSettingsRoot.children.unshift({
                        id: 'workspaceTrust',
                        label: (0, nls_1.localize)('settings require trust', "Workspace Trust"),
                        settings: configuredUntrustedWorkspaceSettings
                    });
                }
            }
            if (this.searchResultModel) {
                this.searchResultModel.updateChildren();
            }
            if (this.settingsTreeModel) {
                this.settingsTreeModel.update(resolvedSettingsRoot);
                if (schemaChange && !!this.searchResultModel) {
                    // If an extension's settings were just loaded and a search is active, retrigger the search so it shows up
                    return await this.onSearchInputChanged();
                }
                this.refreshTOCTree();
                this.renderTree(undefined, forceRefresh);
            }
            else {
                this.settingsTreeModel = this.instantiationService.createInstance(settingsTreeModels_1.SettingsTreeModel, this.viewState, this.workspaceTrustManagementService.isWorkspaceTrusted());
                this.settingsTreeModel.update(resolvedSettingsRoot);
                this.tocTreeModel.settingsTreeRoot = this.settingsTreeModel.root;
                const cachedState = this.restoreCachedState();
                if (cachedState && cachedState.searchQuery || !!this.searchWidget.getValue()) {
                    await this.onSearchInputChanged();
                }
                else {
                    this.refreshTOCTree();
                    this.refreshTree();
                    this.tocTree.collapseAll();
                }
            }
        }
        updateElementsByKey(keys) {
            if (keys.length) {
                if (this.searchResultModel) {
                    keys.forEach(key => this.searchResultModel.updateElementsByName(key));
                }
                if (this.settingsTreeModel) {
                    keys.forEach(key => this.settingsTreeModel.updateElementsByName(key));
                }
                keys.forEach(key => this.renderTree(key));
            }
            else {
                return this.renderTree();
            }
        }
        getActiveControlInSettingsTree() {
            return (document.activeElement && DOM.isAncestor(document.activeElement, this.settingsTree.getHTMLElement())) ?
                document.activeElement :
                null;
        }
        renderTree(key, force = false) {
            if (!force && key && this.scheduledRefreshes.has(key)) {
                this.updateModifiedLabelForKey(key);
                return;
            }
            // If the context view is focused, delay rendering settings
            if (this.contextViewFocused()) {
                const element = document.querySelector('.context-view');
                if (element) {
                    this.scheduleRefresh(element, key);
                }
                return;
            }
            // If a setting control is currently focused, schedule a refresh for later
            const activeElement = this.getActiveControlInSettingsTree();
            const focusedSetting = activeElement && this.settingRenderers.getSettingDOMElementForDOMElement(activeElement);
            if (focusedSetting && !force) {
                // If a single setting is being refreshed, it's ok to refresh now if that is not the focused setting
                if (key) {
                    const focusedKey = focusedSetting.getAttribute(settingsTree_1.AbstractSettingRenderer.SETTING_KEY_ATTR);
                    if (focusedKey === key &&
                        // update `list`s live, as they have a separate "submit edit" step built in before this
                        (focusedSetting.parentElement && !focusedSetting.parentElement.classList.contains('setting-item-list'))) {
                        this.updateModifiedLabelForKey(key);
                        this.scheduleRefresh(focusedSetting, key);
                        return;
                    }
                }
                else {
                    this.scheduleRefresh(focusedSetting);
                    return;
                }
            }
            this.renderResultCountMessages();
            if (key) {
                const elements = this.currentSettingsModel.getElementsByName(key);
                if (elements && elements.length) {
                    // TODO https://github.com/microsoft/vscode/issues/57360
                    this.refreshTree();
                }
                else {
                    // Refresh requested for a key that we don't know about
                    return;
                }
            }
            else {
                this.refreshTree();
            }
            return;
        }
        contextViewFocused() {
            return !!DOM.findParentWithClass(document.activeElement, 'context-view');
        }
        refreshTree() {
            if (this.isVisible()) {
                this.settingsTree.setChildren(null, createGroupIterator(this.currentSettingsModel.root));
            }
        }
        refreshTOCTree() {
            if (this.isVisible()) {
                this.tocTreeModel.update();
                this.tocTree.setChildren(null, (0, tocTree_1.createTOCIterator)(this.tocTreeModel, this.tocTree));
            }
        }
        updateModifiedLabelForKey(key) {
            const dataElements = this.currentSettingsModel.getElementsByName(key);
            const isModified = dataElements && dataElements[0] && dataElements[0].isConfigured; // all elements are either configured or not
            const elements = this.settingRenderers.getDOMElementsForSettingKey(this.settingsTree.getHTMLElement(), key);
            if (elements && elements[0]) {
                elements[0].classList.toggle('is-configured', !!isModified);
            }
        }
        async onSearchInputChanged() {
            if (!this.currentSettingsModel) {
                // Initializing search widget value
                return;
            }
            const query = this.searchWidget.getValue().trim();
            this.delayedFilterLogging.cancel();
            await this.triggerSearch(query.replace(/\u203A/g, ' '));
            if (query && this.searchResultModel) {
                this.delayedFilterLogging.trigger(() => this.reportFilteringUsed(this.searchResultModel.getUniqueResults()));
            }
        }
        parseSettingFromJSON(query) {
            const match = query.match(/"([a-zA-Z.]+)": /);
            return match && match[1];
        }
        triggerSearch(query) {
            this.viewState.tagFilters = new Set();
            this.viewState.extensionFilters = new Set();
            this.viewState.featureFilters = new Set();
            this.viewState.idFilters = new Set();
            this.viewState.languageFilter = undefined;
            if (query) {
                const parsedQuery = (0, settingsTreeModels_1.parseQuery)(query);
                query = parsedQuery.query;
                parsedQuery.tags.forEach(tag => this.viewState.tagFilters.add(tag));
                parsedQuery.extensionFilters.forEach(extensionId => this.viewState.extensionFilters.add(extensionId));
                parsedQuery.featureFilters.forEach(feature => this.viewState.featureFilters.add(feature));
                parsedQuery.idFilters.forEach(id => this.viewState.idFilters.add(id));
                this.viewState.languageFilter = parsedQuery.languageFilter;
            }
            this.settingsTargetsWidget.updateLanguageFilterIndicators(this.viewState.languageFilter);
            if (query && query !== '@') {
                query = this.parseSettingFromJSON(query) || query;
                return this.triggerFilterPreferences(query);
            }
            else {
                if (this.viewState.tagFilters.size || this.viewState.extensionFilters.size || this.viewState.featureFilters.size || this.viewState.idFilters.size || this.viewState.languageFilter) {
                    this.searchResultModel = this.createFilterModel();
                }
                else {
                    this.searchResultModel = null;
                }
                this.localSearchDelayer.cancel();
                this.remoteSearchThrottle.cancel();
                if (this.searchInProgress) {
                    this.searchInProgress.cancel();
                    this.searchInProgress.dispose();
                    this.searchInProgress = null;
                }
                this.tocTree.setFocus([]);
                this.viewState.filterToCategory = undefined;
                this.tocTreeModel.currentSearchModel = this.searchResultModel;
                this.onSearchModeToggled();
                if (this.searchResultModel) {
                    // Added a filter model
                    this.tocTree.setSelection([]);
                    this.tocTree.expandAll();
                    this.refreshTOCTree();
                    this.renderResultCountMessages();
                    this.refreshTree();
                }
                else {
                    // Leaving search mode
                    this.tocTree.collapseAll();
                    this.refreshTOCTree();
                    this.renderResultCountMessages();
                    this.refreshTree();
                }
            }
            return Promise.resolve();
        }
        /**
         * Return a fake SearchResultModel which can hold a flat list of all settings, to be filtered (@modified etc)
         */
        createFilterModel() {
            const filterModel = this.instantiationService.createInstance(settingsTreeModels_1.SearchResultModel, this.viewState, this.workspaceTrustManagementService.isWorkspaceTrusted());
            const fullResult = {
                filterMatches: []
            };
            for (const g of this.defaultSettingsEditorModel.settingsGroups.slice(1)) {
                for (const sect of g.sections) {
                    for (const setting of sect.settings) {
                        fullResult.filterMatches.push({ setting, matches: [], matchType: preferences_2.SettingMatchType.None, score: 0 });
                    }
                }
            }
            filterModel.setResult(0, fullResult);
            return filterModel;
        }
        reportFilteringUsed(results) {
            const nlpResult = results[1 /* SearchResultIdx.Remote */];
            const nlpMetadata = nlpResult === null || nlpResult === void 0 ? void 0 : nlpResult.metadata;
            const duration = {
                nlpResult: nlpMetadata === null || nlpMetadata === void 0 ? void 0 : nlpMetadata.duration
            };
            // Count unique results
            const counts = {};
            const filterResult = results[0 /* SearchResultIdx.Local */];
            if (filterResult) {
                counts['filterResult'] = filterResult.filterMatches.length;
            }
            if (nlpResult) {
                counts['nlpResult'] = nlpResult.filterMatches.length;
            }
            const requestCount = nlpMetadata === null || nlpMetadata === void 0 ? void 0 : nlpMetadata.requestCount;
            const data = {
                'durations.nlpResult': duration.nlpResult,
                'counts.nlpResult': counts['nlpResult'],
                'counts.filterResult': counts['filterResult'],
                requestCount
            };
            this.telemetryService.publicLog2('settingsEditor.filter', data);
        }
        triggerFilterPreferences(query) {
            if (this.searchInProgress) {
                this.searchInProgress.cancel();
                this.searchInProgress = null;
            }
            // Trigger the local search. If it didn't find an exact match, trigger the remote search.
            const searchInProgress = this.searchInProgress = new cancellation_1.CancellationTokenSource();
            return this.localSearchDelayer.trigger(() => {
                if (searchInProgress && !searchInProgress.token.isCancellationRequested) {
                    return this.localFilterPreferences(query).then(result => {
                        if (result && !result.exactMatch) {
                            this.remoteSearchThrottle.trigger(() => {
                                return searchInProgress && !searchInProgress.token.isCancellationRequested ?
                                    this.remoteSearchPreferences(query, this.searchInProgress.token) :
                                    Promise.resolve();
                            });
                        }
                    });
                }
                else {
                    return Promise.resolve();
                }
            });
        }
        localFilterPreferences(query, token) {
            const localSearchProvider = this.preferencesSearchService.getLocalSearchProvider(query);
            return this.filterOrSearchPreferences(query, 0 /* SearchResultIdx.Local */, localSearchProvider, token);
        }
        remoteSearchPreferences(query, token) {
            const remoteSearchProvider = this.preferencesSearchService.getRemoteSearchProvider(query);
            const newExtSearchProvider = this.preferencesSearchService.getRemoteSearchProvider(query, true);
            return Promise.all([
                this.filterOrSearchPreferences(query, 1 /* SearchResultIdx.Remote */, remoteSearchProvider, token),
                this.filterOrSearchPreferences(query, 2 /* SearchResultIdx.NewExtensions */, newExtSearchProvider, token)
            ]).then(() => { });
        }
        filterOrSearchPreferences(query, type, searchProvider, token) {
            return this._filterOrSearchPreferencesModel(query, this.defaultSettingsEditorModel, searchProvider, token).then(result => {
                if (token && token.isCancellationRequested) {
                    // Handle cancellation like this because cancellation is lost inside the search provider due to async/await
                    return null;
                }
                if (!this.searchResultModel) {
                    this.searchResultModel = this.instantiationService.createInstance(settingsTreeModels_1.SearchResultModel, this.viewState, this.workspaceTrustManagementService.isWorkspaceTrusted());
                    this.searchResultModel.setResult(type, result);
                    this.tocTreeModel.currentSearchModel = this.searchResultModel;
                    this.onSearchModeToggled();
                }
                else {
                    this.searchResultModel.setResult(type, result);
                    this.tocTreeModel.update();
                }
                if (type === 0 /* SearchResultIdx.Local */) {
                    this.tocTree.setFocus([]);
                    this.viewState.filterToCategory = undefined;
                    this.tocTree.expandAll();
                }
                this.settingsTree.scrollTop = 0;
                this.refreshTOCTree();
                this.renderTree(undefined, true);
                return result;
            });
        }
        renderResultCountMessages() {
            if (!this.currentSettingsModel) {
                return;
            }
            this.clearFilterLinkContainer.style.display = this.viewState.tagFilters && this.viewState.tagFilters.size > 0
                ? 'initial'
                : 'none';
            if (!this.searchResultModel) {
                if (this.countElement.style.display !== 'none') {
                    this.searchResultLabel = null;
                    this.updateInputAriaLabel();
                    this.countElement.style.display = 'none';
                    this.layout(this.dimension);
                }
                this.rootElement.classList.remove('no-results');
                this.splitView.el.style.visibility = 'visible';
                return;
            }
            if (this.tocTreeModel && this.tocTreeModel.settingsTreeRoot) {
                const count = this.tocTreeModel.settingsTreeRoot.count;
                let resultString;
                switch (count) {
                    case 0:
                        resultString = (0, nls_1.localize)('noResults', "No Settings Found");
                        break;
                    case 1:
                        resultString = (0, nls_1.localize)('oneResult', "1 Setting Found");
                        break;
                    default: resultString = (0, nls_1.localize)('moreThanOneResult', "{0} Settings Found", count);
                }
                this.searchResultLabel = resultString;
                this.updateInputAriaLabel();
                this.countElement.innerText = resultString;
                aria.status(resultString);
                if (this.countElement.style.display !== 'block') {
                    this.countElement.style.display = 'block';
                    this.layout(this.dimension);
                }
                this.rootElement.classList.toggle('no-results', count === 0);
                this.splitView.el.style.visibility = count === 0 ? 'hidden' : 'visible';
            }
        }
        _filterOrSearchPreferencesModel(filter, model, provider, token) {
            const searchP = provider ? provider.searchModel(model, token) : Promise.resolve(null);
            return searchP
                .then(undefined, err => {
                if ((0, errors_1.isCancellationError)(err)) {
                    return Promise.reject(err);
                }
                else {
                    const message = (0, errors_1.getErrorMessage)(err).trim();
                    if (message && message !== 'Error') {
                        // "Error" = any generic network error
                        this.telemetryService.publicLogError2('settingsEditor.searchError', { message });
                        this.logService.info('Setting search error: ' + message);
                    }
                    return null;
                }
            });
        }
        layoutSplitView(dimension) {
            var _a;
            const listHeight = dimension.height - (72 + 11 + 14 /* header height + editor padding */);
            this.splitView.el.style.height = `${listHeight}px`;
            // We call layout first so the splitView has an idea of how much
            // space it has, otherwise setViewVisible results in the first panel
            // showing up at the minimum size whenever the Settings editor
            // opens for the first time.
            this.splitView.layout(this.bodyContainer.clientWidth, listHeight);
            const firstViewWasVisible = this.splitView.isViewVisible(0);
            const firstViewVisible = this.bodyContainer.clientWidth >= SettingsEditor2.NARROW_TOTAL_WIDTH;
            this.splitView.setViewVisible(0, firstViewVisible);
            // If the first view is again visible, and we have enough space, immediately set the
            // editor to use the reset width rather than the cached min width
            if (!firstViewWasVisible && firstViewVisible && this.bodyContainer.clientWidth >= SettingsEditor2.EDITOR_MIN_WIDTH + SettingsEditor2.TOC_RESET_WIDTH) {
                this.splitView.resizeView(0, SettingsEditor2.TOC_RESET_WIDTH);
            }
            this.splitView.style({
                separatorBorder: firstViewVisible ? (_a = this.theme.getColor(settingsEditorColorRegistry_1.settingsSashBorder)) !== null && _a !== void 0 ? _a : color_1.Color.transparent : color_1.Color.transparent
            });
        }
        saveState() {
            if (this.isVisible()) {
                const searchQuery = this.searchWidget.getValue().trim();
                const target = this.settingsTargetsWidget.settingsTarget;
                if (this.group && this.input) {
                    this.editorMemento.saveEditorState(this.group, this.input, { searchQuery, target });
                }
            }
            else if (this.group && this.input) {
                this.editorMemento.clearEditorState(this.input, this.group);
            }
            super.saveState();
        }
    };
    SettingsEditor2.ID = 'workbench.editor.settings2';
    SettingsEditor2.NUM_INSTANCES = 0;
    SettingsEditor2.SEARCH_DEBOUNCE = 200;
    SettingsEditor2.SETTING_UPDATE_FAST_DEBOUNCE = 200;
    SettingsEditor2.SETTING_UPDATE_SLOW_DEBOUNCE = 1000;
    SettingsEditor2.CONFIG_SCHEMA_UPDATE_DELAYER = 500;
    SettingsEditor2.TOC_MIN_WIDTH = 100;
    SettingsEditor2.TOC_RESET_WIDTH = 200;
    SettingsEditor2.EDITOR_MIN_WIDTH = 500;
    // Below NARROW_TOTAL_WIDTH, we only render the editor rather than the ToC.
    SettingsEditor2.NARROW_TOTAL_WIDTH = SettingsEditor2.TOC_RESET_WIDTH + SettingsEditor2.EDITOR_MIN_WIDTH;
    SettingsEditor2.MEDIUM_TOTAL_WIDTH = 1000;
    SettingsEditor2.SUGGESTIONS = [
        `@${preferences_1.MODIFIED_SETTING_TAG}`,
        '@tag:notebookLayout',
        `@tag:${preferences_1.REQUIRE_TRUSTED_WORKSPACE_SETTING_TAG}`,
        `@tag:${preferences_1.WORKSPACE_TRUST_SETTING_TAG}`,
        '@tag:sync',
        '@tag:usesOnlineServices',
        '@tag:telemetry',
        `@${preferences_1.ID_SETTING_TAG}`,
        `@${preferences_1.EXTENSION_SETTING_TAG}`,
        `@${preferences_1.FEATURE_SETTING_TAG}scm`,
        `@${preferences_1.FEATURE_SETTING_TAG}explorer`,
        `@${preferences_1.FEATURE_SETTING_TAG}search`,
        `@${preferences_1.FEATURE_SETTING_TAG}debug`,
        `@${preferences_1.FEATURE_SETTING_TAG}extensions`,
        `@${preferences_1.FEATURE_SETTING_TAG}terminal`,
        `@${preferences_1.FEATURE_SETTING_TAG}task`,
        `@${preferences_1.FEATURE_SETTING_TAG}problems`,
        `@${preferences_1.FEATURE_SETTING_TAG}output`,
        `@${preferences_1.FEATURE_SETTING_TAG}comments`,
        `@${preferences_1.FEATURE_SETTING_TAG}remote`,
        `@${preferences_1.FEATURE_SETTING_TAG}timeline`,
        `@${preferences_1.FEATURE_SETTING_TAG}notebook`,
    ];
    SettingsEditor2 = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, configuration_1.IWorkbenchConfigurationService),
        __param(2, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(3, themeService_1.IThemeService),
        __param(4, preferences_2.IPreferencesService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, preferences_1.IPreferencesSearchService),
        __param(7, log_1.ILogService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, storage_1.IStorageService),
        __param(10, editorGroupsService_1.IEditorGroupsService),
        __param(11, userDataSync_2.IUserDataSyncWorkbenchService),
        __param(12, userDataSync_1.IUserDataSyncEnablementService),
        __param(13, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(14, extensions_1.IExtensionService),
        __param(15, language_1.ILanguageService),
        __param(16, extensionManagement_1.IExtensionManagementService)
    ], SettingsEditor2);
    exports.SettingsEditor2 = SettingsEditor2;
    let SyncControls = class SyncControls extends lifecycle_1.Disposable {
        constructor(container, commandService, userDataSyncService, userDataSyncEnablementService, themeService) {
            super();
            this.commandService = commandService;
            this.userDataSyncService = userDataSyncService;
            this.userDataSyncEnablementService = userDataSyncEnablementService;
            this._onDidChangeLastSyncedLabel = this._register(new event_1.Emitter());
            this.onDidChangeLastSyncedLabel = this._onDidChangeLastSyncedLabel.event;
            const headerRightControlsContainer = DOM.append(container, $('.settings-right-controls'));
            const turnOnSyncButtonContainer = DOM.append(headerRightControlsContainer, $('.turn-on-sync'));
            this.turnOnSyncButton = this._register(new button_1.Button(turnOnSyncButtonContainer, { title: true }));
            this._register((0, styler_1.attachButtonStyler)(this.turnOnSyncButton, themeService));
            this.lastSyncedLabel = DOM.append(headerRightControlsContainer, $('.last-synced-label'));
            DOM.hide(this.lastSyncedLabel);
            this.turnOnSyncButton.enabled = true;
            this.turnOnSyncButton.label = (0, nls_1.localize)('turnOnSyncButton', "Turn on Settings Sync");
            DOM.hide(this.turnOnSyncButton.element);
            this._register(this.turnOnSyncButton.onDidClick(async () => {
                await this.commandService.executeCommand('workbench.userDataSync.actions.turnOn');
            }));
            this.updateLastSyncedTime();
            this._register(this.userDataSyncService.onDidChangeLastSyncTime(() => {
                this.updateLastSyncedTime();
            }));
            const updateLastSyncedTimer = this._register(new async_1.IntervalTimer());
            updateLastSyncedTimer.cancelAndSet(() => this.updateLastSyncedTime(), 60 * 1000);
            this.update();
            this._register(this.userDataSyncService.onDidChangeStatus(() => {
                this.update();
            }));
            this._register(this.userDataSyncEnablementService.onDidChangeEnablement(() => {
                this.update();
            }));
        }
        updateLastSyncedTime() {
            const last = this.userDataSyncService.lastSyncTime;
            let label;
            if (typeof last === 'number') {
                const d = (0, date_1.fromNow)(last, true);
                label = (0, nls_1.localize)('lastSyncedLabel', "Last synced: {0}", d);
            }
            else {
                label = '';
            }
            this.lastSyncedLabel.textContent = label;
            this._onDidChangeLastSyncedLabel.fire(label);
        }
        update() {
            if (this.userDataSyncService.status === "uninitialized" /* SyncStatus.Uninitialized */) {
                return;
            }
            if (this.userDataSyncEnablementService.isEnabled() || this.userDataSyncService.status !== "idle" /* SyncStatus.Idle */) {
                DOM.show(this.lastSyncedLabel);
                DOM.hide(this.turnOnSyncButton.element);
            }
            else {
                DOM.hide(this.lastSyncedLabel);
                DOM.show(this.turnOnSyncButton.element);
            }
        }
    };
    SyncControls = __decorate([
        __param(1, commands_1.ICommandService),
        __param(2, userDataSync_1.IUserDataSyncService),
        __param(3, userDataSync_1.IUserDataSyncEnablementService),
        __param(4, themeService_1.IThemeService)
    ], SyncControls);
});
//# sourceMappingURL=settingsEditor2.js.map