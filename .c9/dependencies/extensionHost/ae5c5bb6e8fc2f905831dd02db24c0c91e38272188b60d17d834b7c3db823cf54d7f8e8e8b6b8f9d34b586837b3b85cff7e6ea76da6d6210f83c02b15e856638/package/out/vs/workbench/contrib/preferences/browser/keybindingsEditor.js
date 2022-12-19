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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/browser/dom", "vs/base/common/platform", "vs/base/common/lifecycle", "vs/base/browser/ui/toggle/toggle", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/browser/ui/keybindingLabel/keybindingLabel", "vs/base/common/actions", "vs/base/browser/ui/actionbar/actionbar", "vs/workbench/browser/parts/editor/editorPane", "vs/platform/telemetry/common/telemetry", "vs/platform/clipboard/common/clipboardService", "vs/workbench/services/preferences/browser/keybindingsEditorModel", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/preferences/browser/keybindingWidgets", "vs/workbench/contrib/preferences/common/preferences", "vs/platform/contextview/browser/contextView", "vs/workbench/services/keybinding/common/keybindingEditing", "vs/platform/theme/common/themeService", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/editorExtensions", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/theme/common/styler", "vs/platform/storage/common/storage", "vs/base/browser/ui/inputbox/inputBox", "vs/base/common/event", "vs/platform/actions/common/actions", "vs/workbench/common/theme", "vs/workbench/contrib/preferences/browser/preferencesIcons", "vs/base/browser/ui/toolbar/toolbar", "vs/css!./media/keybindingsEditor"], function (require, exports, nls_1, async_1, DOM, platform_1, lifecycle_1, toggle_1, highlightedLabel_1, keybindingLabel_1, actions_1, actionbar_1, editorPane_1, telemetry_1, clipboardService_1, keybindingsEditorModel_1, instantiation_1, keybinding_1, keybindingWidgets_1, preferences_1, contextView_1, keybindingEditing_1, themeService_1, contextkey_1, colorRegistry_1, editorService_1, editorExtensions_1, listService_1, notification_1, styler_1, storage_1, inputBox_1, event_1, actions_2, theme_1, preferencesIcons_1, toolbar_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.KeybindingsEditor = void 0;
    const $ = DOM.$;
    class ThemableToggleActionViewItem extends toggle_1.ToggleActionViewItem {
        constructor(context, action, options, themeService) {
            super(context, action, options);
            this.themeService = themeService;
        }
        render(container) {
            super.render(container);
            this._register((0, styler_1.attachToggleStyler)(this.toggle, this.themeService));
        }
    }
    let KeybindingsEditor = class KeybindingsEditor extends editorPane_1.EditorPane {
        constructor(telemetryService, themeService, keybindingsService, contextMenuService, keybindingEditingService, contextKeyService, notificationService, clipboardService, instantiationService, editorService, storageService) {
            super(KeybindingsEditor.ID, telemetryService, themeService, storageService);
            this.keybindingsService = keybindingsService;
            this.contextMenuService = contextMenuService;
            this.keybindingEditingService = keybindingEditingService;
            this.contextKeyService = contextKeyService;
            this.notificationService = notificationService;
            this.clipboardService = clipboardService;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this._onDefineWhenExpression = this._register(new event_1.Emitter());
            this.onDefineWhenExpression = this._onDefineWhenExpression.event;
            this._onLayout = this._register(new event_1.Emitter());
            this.onLayout = this._onLayout.event;
            this.keybindingsEditorModel = null;
            this.unAssignedKeybindingItemToRevealAndFocus = null;
            this.tableEntries = [];
            this.dimension = null;
            this.latestEmptyFilters = [];
            this.delayedFiltering = new async_1.Delayer(300);
            this._register(keybindingsService.onDidUpdateKeybindings(() => this.render(!!this.keybindingFocusContextKey.get())));
            this.keybindingsEditorContextKey = preferences_1.CONTEXT_KEYBINDINGS_EDITOR.bindTo(this.contextKeyService);
            this.searchFocusContextKey = preferences_1.CONTEXT_KEYBINDINGS_SEARCH_FOCUS.bindTo(this.contextKeyService);
            this.keybindingFocusContextKey = preferences_1.CONTEXT_KEYBINDING_FOCUS.bindTo(this.contextKeyService);
            this.searchHistoryDelayer = new async_1.Delayer(500);
            this.recordKeysAction = new actions_1.Action(preferences_1.KEYBINDINGS_EDITOR_COMMAND_RECORD_SEARCH_KEYS, (0, nls_1.localize)('recordKeysLabel', "Record Keys"), themeService_1.ThemeIcon.asClassName(preferencesIcons_1.keybindingsRecordKeysIcon));
            this.recordKeysAction.checked = false;
            this.sortByPrecedenceAction = new actions_1.Action(preferences_1.KEYBINDINGS_EDITOR_COMMAND_SORTBY_PRECEDENCE, (0, nls_1.localize)('sortByPrecedeneLabel', "Sort by Precedence (Highest first)"), themeService_1.ThemeIcon.asClassName(preferencesIcons_1.keybindingsSortIcon));
            this.sortByPrecedenceAction.checked = false;
        }
        createEditor(parent) {
            const keybindingsEditorElement = DOM.append(parent, $('div', { class: 'keybindings-editor' }));
            this.createAriaLabelElement(keybindingsEditorElement);
            this.createOverlayContainer(keybindingsEditorElement);
            this.createHeader(keybindingsEditorElement);
            this.createBody(keybindingsEditorElement);
        }
        setInput(input, options, context, token) {
            this.keybindingsEditorContextKey.set(true);
            return super.setInput(input, options, context, token)
                .then(() => this.render(!!(options && options.preserveFocus)));
        }
        clearInput() {
            super.clearInput();
            this.keybindingsEditorContextKey.reset();
            this.keybindingFocusContextKey.reset();
        }
        layout(dimension) {
            this.dimension = dimension;
            this.layoutSearchWidget(dimension);
            this.overlayContainer.style.width = dimension.width + 'px';
            this.overlayContainer.style.height = dimension.height + 'px';
            this.defineKeybindingWidget.layout(this.dimension);
            this.layoutKeybindingsTable();
            this._onLayout.fire();
        }
        focus() {
            const activeKeybindingEntry = this.activeKeybindingEntry;
            if (activeKeybindingEntry) {
                this.selectEntry(activeKeybindingEntry);
            }
            else if (!platform_1.isIOS) {
                this.searchWidget.focus();
            }
        }
        get activeKeybindingEntry() {
            const focusedElement = this.keybindingsTable.getFocusedElements()[0];
            return focusedElement && focusedElement.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID ? focusedElement : null;
        }
        async defineKeybinding(keybindingEntry, add) {
            this.selectEntry(keybindingEntry);
            this.showOverlayContainer();
            try {
                const key = await this.defineKeybindingWidget.define();
                if (key) {
                    this.reportKeybindingAction(preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE, keybindingEntry.keybindingItem.command);
                    await this.updateKeybinding(keybindingEntry, key, keybindingEntry.keybindingItem.when, add);
                }
            }
            catch (error) {
                this.onKeybindingEditingError(error);
            }
            finally {
                this.hideOverlayContainer();
                this.selectEntry(keybindingEntry);
            }
        }
        defineWhenExpression(keybindingEntry) {
            if (keybindingEntry.keybindingItem.keybinding) {
                this.selectEntry(keybindingEntry);
                this._onDefineWhenExpression.fire(keybindingEntry);
            }
        }
        async updateKeybinding(keybindingEntry, key, when, add) {
            const currentKey = keybindingEntry.keybindingItem.keybinding ? keybindingEntry.keybindingItem.keybinding.getUserSettingsLabel() : '';
            if (currentKey !== key || keybindingEntry.keybindingItem.when !== when) {
                if (add) {
                    await this.keybindingEditingService.addKeybinding(keybindingEntry.keybindingItem.keybindingItem, key, when || undefined);
                }
                else {
                    await this.keybindingEditingService.editKeybinding(keybindingEntry.keybindingItem.keybindingItem, key, when || undefined);
                }
                if (!keybindingEntry.keybindingItem.keybinding) { // reveal only if keybinding was added to unassinged. Because the entry will be placed in different position after rendering
                    this.unAssignedKeybindingItemToRevealAndFocus = keybindingEntry;
                }
            }
        }
        async removeKeybinding(keybindingEntry) {
            this.selectEntry(keybindingEntry);
            if (keybindingEntry.keybindingItem.keybinding) { // This should be a pre-condition
                this.reportKeybindingAction(preferences_1.KEYBINDINGS_EDITOR_COMMAND_REMOVE, keybindingEntry.keybindingItem.command);
                try {
                    await this.keybindingEditingService.removeKeybinding(keybindingEntry.keybindingItem.keybindingItem);
                    this.focus();
                }
                catch (error) {
                    this.onKeybindingEditingError(error);
                    this.selectEntry(keybindingEntry);
                }
            }
        }
        async resetKeybinding(keybindingEntry) {
            this.selectEntry(keybindingEntry);
            this.reportKeybindingAction(preferences_1.KEYBINDINGS_EDITOR_COMMAND_RESET, keybindingEntry.keybindingItem.command);
            try {
                await this.keybindingEditingService.resetKeybinding(keybindingEntry.keybindingItem.keybindingItem);
                if (!keybindingEntry.keybindingItem.keybinding) { // reveal only if keybinding was added to unassinged. Because the entry will be placed in different position after rendering
                    this.unAssignedKeybindingItemToRevealAndFocus = keybindingEntry;
                }
                this.selectEntry(keybindingEntry);
            }
            catch (error) {
                this.onKeybindingEditingError(error);
                this.selectEntry(keybindingEntry);
            }
        }
        async copyKeybinding(keybinding) {
            this.selectEntry(keybinding);
            this.reportKeybindingAction(preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY, keybinding.keybindingItem.command);
            const userFriendlyKeybinding = {
                key: keybinding.keybindingItem.keybinding ? keybinding.keybindingItem.keybinding.getUserSettingsLabel() || '' : '',
                command: keybinding.keybindingItem.command
            };
            if (keybinding.keybindingItem.when) {
                userFriendlyKeybinding.when = keybinding.keybindingItem.when;
            }
            await this.clipboardService.writeText(JSON.stringify(userFriendlyKeybinding, null, '  '));
        }
        async copyKeybindingCommand(keybinding) {
            this.selectEntry(keybinding);
            this.reportKeybindingAction(preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND, keybinding.keybindingItem.command);
            await this.clipboardService.writeText(keybinding.keybindingItem.command);
        }
        async copyKeybindingCommandTitle(keybinding) {
            this.selectEntry(keybinding);
            this.reportKeybindingAction(preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND_TITLE, keybinding.keybindingItem.command);
            await this.clipboardService.writeText(keybinding.keybindingItem.commandLabel);
        }
        focusSearch() {
            this.searchWidget.focus();
        }
        search(filter) {
            this.focusSearch();
            this.searchWidget.setValue(filter);
            this.selectEntry(0);
        }
        clearSearchResults() {
            this.searchWidget.clear();
        }
        showSimilarKeybindings(keybindingEntry) {
            const value = `"${keybindingEntry.keybindingItem.keybinding.getAriaLabel()}"`;
            if (value !== this.searchWidget.getValue()) {
                this.searchWidget.setValue(value);
            }
        }
        createAriaLabelElement(parent) {
            this.ariaLabelElement = DOM.append(parent, DOM.$(''));
            this.ariaLabelElement.setAttribute('id', 'keybindings-editor-aria-label-element');
            this.ariaLabelElement.setAttribute('aria-live', 'assertive');
        }
        createOverlayContainer(parent) {
            this.overlayContainer = DOM.append(parent, $('.overlay-container'));
            this.overlayContainer.style.position = 'absolute';
            this.overlayContainer.style.zIndex = '10';
            this.defineKeybindingWidget = this._register(this.instantiationService.createInstance(keybindingWidgets_1.DefineKeybindingWidget, this.overlayContainer));
            this._register(this.defineKeybindingWidget.onDidChange(keybindingStr => this.defineKeybindingWidget.printExisting(this.keybindingsEditorModel.fetch(`"${keybindingStr}"`).length)));
            this._register(this.defineKeybindingWidget.onShowExistingKeybidings(keybindingStr => this.searchWidget.setValue(`"${keybindingStr}"`)));
            this.hideOverlayContainer();
        }
        showOverlayContainer() {
            this.overlayContainer.style.display = 'block';
        }
        hideOverlayContainer() {
            this.overlayContainer.style.display = 'none';
        }
        createHeader(parent) {
            this.headerContainer = DOM.append(parent, $('.keybindings-header'));
            const fullTextSearchPlaceholder = (0, nls_1.localize)('SearchKeybindings.FullTextSearchPlaceholder', "Type to search in keybindings");
            const keybindingsSearchPlaceholder = (0, nls_1.localize)('SearchKeybindings.KeybindingsSearchPlaceholder', "Recording Keys. Press Escape to exit");
            const clearInputAction = new actions_1.Action(preferences_1.KEYBINDINGS_EDITOR_COMMAND_CLEAR_SEARCH_RESULTS, (0, nls_1.localize)('clearInput', "Clear Keybindings Search Input"), themeService_1.ThemeIcon.asClassName(preferencesIcons_1.preferencesClearInputIcon), false, async () => this.clearSearchResults());
            const searchContainer = DOM.append(this.headerContainer, $('.search-container'));
            this.searchWidget = this._register(this.instantiationService.createInstance(keybindingWidgets_1.KeybindingsSearchWidget, searchContainer, {
                ariaLabel: fullTextSearchPlaceholder,
                placeholder: fullTextSearchPlaceholder,
                focusKey: this.searchFocusContextKey,
                ariaLabelledBy: 'keybindings-editor-aria-label-element',
                recordEnter: true,
                quoteRecordedKeys: true,
                history: this.getMemento(0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */)['searchHistory'] || [],
            }));
            this._register(this.searchWidget.onDidChange(searchValue => {
                clearInputAction.enabled = !!searchValue;
                this.delayedFiltering.trigger(() => this.filterKeybindings());
                this.updateSearchOptions();
            }));
            this._register(this.searchWidget.onEscape(() => this.recordKeysAction.checked = false));
            this.actionsContainer = DOM.append(searchContainer, DOM.$('.keybindings-search-actions-container'));
            const recordingBadge = this.createRecordingBadge(this.actionsContainer);
            this._register(this.sortByPrecedenceAction.onDidChange(e => {
                if (e.checked !== undefined) {
                    this.renderKeybindingsEntries(false);
                }
                this.updateSearchOptions();
            }));
            this._register(this.recordKeysAction.onDidChange(e => {
                if (e.checked !== undefined) {
                    recordingBadge.classList.toggle('disabled', !e.checked);
                    if (e.checked) {
                        this.searchWidget.inputBox.setPlaceHolder(keybindingsSearchPlaceholder);
                        this.searchWidget.inputBox.setAriaLabel(keybindingsSearchPlaceholder);
                        this.searchWidget.startRecordingKeys();
                        this.searchWidget.focus();
                    }
                    else {
                        this.searchWidget.inputBox.setPlaceHolder(fullTextSearchPlaceholder);
                        this.searchWidget.inputBox.setAriaLabel(fullTextSearchPlaceholder);
                        this.searchWidget.stopRecordingKeys();
                        this.searchWidget.focus();
                    }
                    this.updateSearchOptions();
                }
            }));
            const actions = [this.recordKeysAction, this.sortByPrecedenceAction, clearInputAction];
            const toolBar = this._register(new toolbar_1.ToolBar(this.actionsContainer, this.contextMenuService, {
                actionViewItemProvider: (action) => {
                    var _a;
                    if (action.id === this.sortByPrecedenceAction.id || action.id === this.recordKeysAction.id) {
                        return new ThemableToggleActionViewItem(null, action, { keybinding: (_a = this.keybindingsService.lookupKeybinding(action.id)) === null || _a === void 0 ? void 0 : _a.getLabel() }, this.themeService);
                    }
                    return undefined;
                },
                getKeyBinding: action => this.keybindingsService.lookupKeybinding(action.id)
            }));
            toolBar.setActions(actions);
            this._register(this.keybindingsService.onDidUpdateKeybindings(e => toolBar.setActions(actions)));
        }
        updateSearchOptions() {
            const keybindingsEditorInput = this.input;
            if (keybindingsEditorInput) {
                keybindingsEditorInput.searchOptions = {
                    searchValue: this.searchWidget.getValue(),
                    recordKeybindings: !!this.recordKeysAction.checked,
                    sortByPrecedence: !!this.sortByPrecedenceAction.checked
                };
            }
        }
        createRecordingBadge(container) {
            const recordingBadge = DOM.append(container, DOM.$('.recording-badge.monaco-count-badge.long.disabled'));
            recordingBadge.textContent = (0, nls_1.localize)('recording', "Recording Keys");
            this._register((0, styler_1.attachStylerCallback)(this.themeService, { badgeBackground: colorRegistry_1.badgeBackground, contrastBorder: colorRegistry_1.contrastBorder, badgeForeground: colorRegistry_1.badgeForeground }, colors => {
                const background = colors.badgeBackground ? colors.badgeBackground.toString() : '';
                const border = colors.contrastBorder ? colors.contrastBorder.toString() : '';
                const color = colors.badgeForeground ? colors.badgeForeground.toString() : '';
                recordingBadge.style.backgroundColor = background;
                recordingBadge.style.borderWidth = border ? '1px' : '';
                recordingBadge.style.borderStyle = border ? 'solid' : '';
                recordingBadge.style.borderColor = border;
                recordingBadge.style.color = color ? color.toString() : '';
            }));
            return recordingBadge;
        }
        layoutSearchWidget(dimension) {
            this.searchWidget.layout(dimension);
            this.headerContainer.classList.toggle('small', dimension.width < 400);
            this.searchWidget.inputBox.inputElement.style.paddingRight = `${DOM.getTotalWidth(this.actionsContainer) + 12}px`;
        }
        createBody(parent) {
            const bodyContainer = DOM.append(parent, $('.keybindings-body'));
            this.createTable(bodyContainer);
        }
        createTable(parent) {
            this.keybindingsTableContainer = DOM.append(parent, $('.keybindings-table-container'));
            this.keybindingsTable = this._register(this.instantiationService.createInstance(listService_1.WorkbenchTable, 'KeybindingsEditor', this.keybindingsTableContainer, new Delegate(), [
                {
                    label: '',
                    tooltip: '',
                    weight: 0,
                    minimumWidth: 40,
                    maximumWidth: 40,
                    templateId: ActionsColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('command', "Command"),
                    tooltip: '',
                    weight: 0.3,
                    templateId: CommandColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('keybinding', "Keybinding"),
                    tooltip: '',
                    weight: 0.2,
                    templateId: KeybindingColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('when', "When"),
                    tooltip: '',
                    weight: 0.4,
                    templateId: WhenColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
                {
                    label: (0, nls_1.localize)('source', "Source"),
                    tooltip: '',
                    weight: 0.1,
                    templateId: SourceColumnRenderer.TEMPLATE_ID,
                    project(row) { return row; }
                },
            ], [
                this.instantiationService.createInstance(ActionsColumnRenderer, this),
                this.instantiationService.createInstance(CommandColumnRenderer),
                this.instantiationService.createInstance(KeybindingColumnRenderer),
                this.instantiationService.createInstance(WhenColumnRenderer, this),
                this.instantiationService.createInstance(SourceColumnRenderer),
            ], {
                identityProvider: { getId: (e) => e.id },
                horizontalScrolling: false,
                accessibilityProvider: new AccessibilityProvider(),
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e.keybindingItem.commandLabel || e.keybindingItem.command },
                overrideStyles: {
                    listBackground: colorRegistry_1.editorBackground
                },
                multipleSelectionSupport: false,
                setRowLineHeight: false,
                openOnSingleClick: false,
            }));
            this._register(this.keybindingsTable.onContextMenu(e => this.onContextMenu(e)));
            this._register(this.keybindingsTable.onDidChangeFocus(e => this.onFocusChange()));
            this._register(this.keybindingsTable.onDidFocus(() => {
                this.keybindingsTable.getHTMLElement().classList.add('focused');
                this.onFocusChange();
            }));
            this._register(this.keybindingsTable.onDidBlur(() => {
                this.keybindingsTable.getHTMLElement().classList.remove('focused');
                this.keybindingFocusContextKey.reset();
            }));
            this._register(this.keybindingsTable.onDidOpen((e) => {
                const activeKeybindingEntry = this.activeKeybindingEntry;
                if (activeKeybindingEntry) {
                    this.defineKeybinding(activeKeybindingEntry, false);
                }
            }));
        }
        async render(preserveFocus) {
            if (this.input) {
                const input = this.input;
                this.keybindingsEditorModel = await input.resolve();
                await this.keybindingsEditorModel.resolve(this.getActionsLabels());
                this.renderKeybindingsEntries(false, preserveFocus);
                if (input.searchOptions) {
                    this.recordKeysAction.checked = input.searchOptions.recordKeybindings;
                    this.sortByPrecedenceAction.checked = input.searchOptions.sortByPrecedence;
                    this.searchWidget.setValue(input.searchOptions.searchValue);
                }
                else {
                    this.updateSearchOptions();
                }
            }
        }
        getActionsLabels() {
            const actionsLabels = new Map();
            editorExtensions_1.EditorExtensionsRegistry.getEditorActions().forEach(editorAction => actionsLabels.set(editorAction.id, editorAction.label));
            for (const menuItem of actions_2.MenuRegistry.getMenuItems(actions_2.MenuId.CommandPalette)) {
                if ((0, actions_2.isIMenuItem)(menuItem)) {
                    const title = typeof menuItem.command.title === 'string' ? menuItem.command.title : menuItem.command.title.value;
                    const category = menuItem.command.category ? typeof menuItem.command.category === 'string' ? menuItem.command.category : menuItem.command.category.value : undefined;
                    actionsLabels.set(menuItem.command.id, category ? `${category}: ${title}` : title);
                }
            }
            return actionsLabels;
        }
        filterKeybindings() {
            this.renderKeybindingsEntries(this.searchWidget.hasFocus());
            this.searchHistoryDelayer.trigger(() => {
                this.searchWidget.inputBox.addToHistory();
                this.getMemento(0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */)['searchHistory'] = this.searchWidget.inputBox.getHistory();
                this.saveState();
            });
        }
        renderKeybindingsEntries(reset, preserveFocus) {
            if (this.keybindingsEditorModel) {
                const filter = this.searchWidget.getValue();
                const keybindingsEntries = this.keybindingsEditorModel.fetch(filter, this.sortByPrecedenceAction.checked);
                this.ariaLabelElement.setAttribute('aria-label', this.getAriaLabel(keybindingsEntries));
                if (keybindingsEntries.length === 0) {
                    this.latestEmptyFilters.push(filter);
                }
                const currentSelectedIndex = this.keybindingsTable.getSelection()[0];
                this.tableEntries = keybindingsEntries;
                this.keybindingsTable.splice(0, this.keybindingsTable.length, this.tableEntries);
                this.layoutKeybindingsTable();
                if (reset) {
                    this.keybindingsTable.setSelection([]);
                    this.keybindingsTable.setFocus([]);
                }
                else {
                    if (this.unAssignedKeybindingItemToRevealAndFocus) {
                        const index = this.getNewIndexOfUnassignedKeybinding(this.unAssignedKeybindingItemToRevealAndFocus);
                        if (index !== -1) {
                            this.keybindingsTable.reveal(index, 0.2);
                            this.selectEntry(index);
                        }
                        this.unAssignedKeybindingItemToRevealAndFocus = null;
                    }
                    else if (currentSelectedIndex !== -1 && currentSelectedIndex < this.tableEntries.length) {
                        this.selectEntry(currentSelectedIndex, preserveFocus);
                    }
                    else if (this.editorService.activeEditorPane === this && !preserveFocus) {
                        this.focus();
                    }
                }
            }
        }
        getAriaLabel(keybindingsEntries) {
            if (this.sortByPrecedenceAction.checked) {
                return (0, nls_1.localize)('show sorted keybindings', "Showing {0} Keybindings in precedence order", keybindingsEntries.length);
            }
            else {
                return (0, nls_1.localize)('show keybindings', "Showing {0} Keybindings in alphabetical order", keybindingsEntries.length);
            }
        }
        layoutKeybindingsTable() {
            if (!this.dimension) {
                return;
            }
            const tableHeight = this.dimension.height - (DOM.getDomNodePagePosition(this.headerContainer).height + 12 /*padding*/);
            this.keybindingsTableContainer.style.height = `${tableHeight}px`;
            this.keybindingsTable.layout(tableHeight);
        }
        getIndexOf(listEntry) {
            const index = this.tableEntries.indexOf(listEntry);
            if (index === -1) {
                for (let i = 0; i < this.tableEntries.length; i++) {
                    if (this.tableEntries[i].id === listEntry.id) {
                        return i;
                    }
                }
            }
            return index;
        }
        getNewIndexOfUnassignedKeybinding(unassignedKeybinding) {
            for (let index = 0; index < this.tableEntries.length; index++) {
                const entry = this.tableEntries[index];
                if (entry.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID) {
                    const keybindingItemEntry = entry;
                    if (keybindingItemEntry.keybindingItem.command === unassignedKeybinding.keybindingItem.command) {
                        return index;
                    }
                }
            }
            return -1;
        }
        selectEntry(keybindingItemEntry, focus = true) {
            const index = typeof keybindingItemEntry === 'number' ? keybindingItemEntry : this.getIndexOf(keybindingItemEntry);
            if (index !== -1 && index < this.keybindingsTable.length) {
                if (focus) {
                    this.keybindingsTable.domFocus();
                    this.keybindingsTable.setFocus([index]);
                }
                this.keybindingsTable.setSelection([index]);
            }
        }
        focusKeybindings() {
            this.keybindingsTable.domFocus();
            const currentFocusIndices = this.keybindingsTable.getFocus();
            this.keybindingsTable.setFocus([currentFocusIndices.length ? currentFocusIndices[0] : 0]);
        }
        selectKeybinding(keybindingItemEntry) {
            this.selectEntry(keybindingItemEntry);
        }
        recordSearchKeys() {
            this.recordKeysAction.checked = true;
        }
        toggleSortByPrecedence() {
            this.sortByPrecedenceAction.checked = !this.sortByPrecedenceAction.checked;
        }
        onContextMenu(e) {
            if (!e.element) {
                return;
            }
            if (e.element.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID) {
                const keybindingItemEntry = e.element;
                this.selectEntry(keybindingItemEntry);
                this.contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => [
                        this.createCopyAction(keybindingItemEntry),
                        this.createCopyCommandAction(keybindingItemEntry),
                        this.createCopyCommandTitleAction(keybindingItemEntry),
                        new actions_1.Separator(),
                        ...(keybindingItemEntry.keybindingItem.keybinding
                            ? [this.createDefineKeybindingAction(keybindingItemEntry), this.createAddKeybindingAction(keybindingItemEntry)]
                            : [this.createDefineKeybindingAction(keybindingItemEntry)]),
                        new actions_1.Separator(),
                        this.createRemoveAction(keybindingItemEntry),
                        this.createResetAction(keybindingItemEntry),
                        new actions_1.Separator(),
                        this.createDefineWhenExpressionAction(keybindingItemEntry),
                        new actions_1.Separator(),
                        this.createShowConflictsAction(keybindingItemEntry)
                    ]
                });
            }
        }
        onFocusChange() {
            this.keybindingFocusContextKey.reset();
            const element = this.keybindingsTable.getFocusedElements()[0];
            if (!element) {
                return;
            }
            if (element.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID) {
                this.keybindingFocusContextKey.set(true);
            }
        }
        createDefineKeybindingAction(keybindingItemEntry) {
            return {
                label: keybindingItemEntry.keybindingItem.keybinding ? (0, nls_1.localize)('changeLabel', "Change Keybinding...") : (0, nls_1.localize)('addLabel', "Add Keybinding..."),
                enabled: true,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE,
                run: () => this.defineKeybinding(keybindingItemEntry, false)
            };
        }
        createAddKeybindingAction(keybindingItemEntry) {
            return {
                label: (0, nls_1.localize)('addLabel', "Add Keybinding..."),
                enabled: true,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_ADD,
                run: () => this.defineKeybinding(keybindingItemEntry, true)
            };
        }
        createDefineWhenExpressionAction(keybindingItemEntry) {
            return {
                label: (0, nls_1.localize)('editWhen', "Change When Expression"),
                enabled: !!keybindingItemEntry.keybindingItem.keybinding,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE_WHEN,
                run: () => this.defineWhenExpression(keybindingItemEntry)
            };
        }
        createRemoveAction(keybindingItem) {
            return {
                label: (0, nls_1.localize)('removeLabel', "Remove Keybinding"),
                enabled: !!keybindingItem.keybindingItem.keybinding,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_REMOVE,
                run: () => this.removeKeybinding(keybindingItem)
            };
        }
        createResetAction(keybindingItem) {
            return {
                label: (0, nls_1.localize)('resetLabel', "Reset Keybinding"),
                enabled: !keybindingItem.keybindingItem.keybindingItem.isDefault,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_RESET,
                run: () => this.resetKeybinding(keybindingItem)
            };
        }
        createShowConflictsAction(keybindingItem) {
            return {
                label: (0, nls_1.localize)('showSameKeybindings', "Show Same Keybindings"),
                enabled: !!keybindingItem.keybindingItem.keybinding,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_SHOW_SIMILAR,
                run: () => this.showSimilarKeybindings(keybindingItem)
            };
        }
        createCopyAction(keybindingItem) {
            return {
                label: (0, nls_1.localize)('copyLabel', "Copy"),
                enabled: true,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY,
                run: () => this.copyKeybinding(keybindingItem)
            };
        }
        createCopyCommandAction(keybinding) {
            return {
                label: (0, nls_1.localize)('copyCommandLabel', "Copy Command ID"),
                enabled: true,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND,
                run: () => this.copyKeybindingCommand(keybinding)
            };
        }
        createCopyCommandTitleAction(keybinding) {
            return {
                label: (0, nls_1.localize)('copyCommandTitleLabel', "Copy Command Title"),
                enabled: !!keybinding.keybindingItem.commandLabel,
                id: preferences_1.KEYBINDINGS_EDITOR_COMMAND_COPY_COMMAND_TITLE,
                run: () => this.copyKeybindingCommandTitle(keybinding)
            };
        }
        reportKeybindingAction(action, command) {
            this.telemetryService.publicLog2('keybindingsEditor.action', { command, action });
        }
        onKeybindingEditingError(error) {
            this.notificationService.error(typeof error === 'string' ? error : (0, nls_1.localize)('error', "Error '{0}' while editing the keybinding. Please open 'keybindings.json' file and check for errors.", `${error}`));
        }
    };
    KeybindingsEditor.ID = 'workbench.editor.keybindings';
    KeybindingsEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, themeService_1.IThemeService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, keybindingEditing_1.IKeybindingEditingService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, notification_1.INotificationService),
        __param(7, clipboardService_1.IClipboardService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, editorService_1.IEditorService),
        __param(10, storage_1.IStorageService)
    ], KeybindingsEditor);
    exports.KeybindingsEditor = KeybindingsEditor;
    class Delegate {
        constructor() {
            this.headerRowHeight = 30;
        }
        getHeight(element) {
            if (element.templateId === keybindingsEditorModel_1.KEYBINDING_ENTRY_TEMPLATE_ID) {
                const commandIdMatched = element.keybindingItem.commandLabel && element.commandIdMatches;
                const commandDefaultLabelMatched = !!element.commandDefaultLabelMatches;
                if (commandIdMatched && commandDefaultLabelMatched) {
                    return 60;
                }
                if (commandIdMatched || commandDefaultLabelMatched) {
                    return 40;
                }
            }
            return 24;
        }
    }
    let ActionsColumnRenderer = class ActionsColumnRenderer {
        constructor(keybindingsEditor, keybindingsService) {
            this.keybindingsEditor = keybindingsEditor;
            this.keybindingsService = keybindingsService;
            this.templateId = ActionsColumnRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const element = DOM.append(container, $('.actions'));
            const actionBar = new actionbar_1.ActionBar(element, { animated: false });
            return { actionBar };
        }
        renderElement(keybindingItemEntry, index, templateData, height) {
            templateData.actionBar.clear();
            const actions = [];
            if (keybindingItemEntry.keybindingItem.keybinding) {
                actions.push(this.createEditAction(keybindingItemEntry));
            }
            else {
                actions.push(this.createAddAction(keybindingItemEntry));
            }
            templateData.actionBar.push(actions, { icon: true });
        }
        createEditAction(keybindingItemEntry) {
            const keybinding = this.keybindingsService.lookupKeybinding(preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE);
            return {
                class: themeService_1.ThemeIcon.asClassName(preferencesIcons_1.keybindingsEditIcon),
                enabled: true,
                id: 'editKeybinding',
                tooltip: keybinding ? (0, nls_1.localize)('editKeybindingLabelWithKey', "Change Keybinding {0}", `(${keybinding.getLabel()})`) : (0, nls_1.localize)('editKeybindingLabel', "Change Keybinding"),
                run: () => this.keybindingsEditor.defineKeybinding(keybindingItemEntry, false)
            };
        }
        createAddAction(keybindingItemEntry) {
            const keybinding = this.keybindingsService.lookupKeybinding(preferences_1.KEYBINDINGS_EDITOR_COMMAND_DEFINE);
            return {
                class: themeService_1.ThemeIcon.asClassName(preferencesIcons_1.keybindingsAddIcon),
                enabled: true,
                id: 'addKeybinding',
                tooltip: keybinding ? (0, nls_1.localize)('addKeybindingLabelWithKey', "Add Keybinding {0}", `(${keybinding.getLabel()})`) : (0, nls_1.localize)('addKeybindingLabel', "Add Keybinding"),
                run: () => this.keybindingsEditor.defineKeybinding(keybindingItemEntry, false)
            };
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    };
    ActionsColumnRenderer.TEMPLATE_ID = 'actions';
    ActionsColumnRenderer = __decorate([
        __param(1, keybinding_1.IKeybindingService)
    ], ActionsColumnRenderer);
    class CommandColumnRenderer {
        constructor() {
            this.templateId = CommandColumnRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const commandColumn = DOM.append(container, $('.command'));
            const commandLabelContainer = DOM.append(commandColumn, $('.command-label'));
            const commandLabel = new highlightedLabel_1.HighlightedLabel(commandLabelContainer);
            const commandDefaultLabelContainer = DOM.append(commandColumn, $('.command-default-label'));
            const commandDefaultLabel = new highlightedLabel_1.HighlightedLabel(commandDefaultLabelContainer);
            const commandIdLabelContainer = DOM.append(commandColumn, $('.command-id.code'));
            const commandIdLabel = new highlightedLabel_1.HighlightedLabel(commandIdLabelContainer);
            return { commandColumn, commandLabelContainer, commandLabel, commandDefaultLabelContainer, commandDefaultLabel, commandIdLabelContainer, commandIdLabel };
        }
        renderElement(keybindingItemEntry, index, templateData, height) {
            const keybindingItem = keybindingItemEntry.keybindingItem;
            const commandIdMatched = !!(keybindingItem.commandLabel && keybindingItemEntry.commandIdMatches);
            const commandDefaultLabelMatched = !!keybindingItemEntry.commandDefaultLabelMatches;
            templateData.commandColumn.classList.toggle('vertical-align-column', commandIdMatched || commandDefaultLabelMatched);
            templateData.commandColumn.title = keybindingItem.commandLabel ? (0, nls_1.localize)('title', "{0} ({1})", keybindingItem.commandLabel, keybindingItem.command) : keybindingItem.command;
            if (keybindingItem.commandLabel) {
                templateData.commandLabelContainer.classList.remove('hide');
                templateData.commandLabel.set(keybindingItem.commandLabel, keybindingItemEntry.commandLabelMatches);
            }
            else {
                templateData.commandLabelContainer.classList.add('hide');
                templateData.commandLabel.set(undefined);
            }
            if (keybindingItemEntry.commandDefaultLabelMatches) {
                templateData.commandDefaultLabelContainer.classList.remove('hide');
                templateData.commandDefaultLabel.set(keybindingItem.commandDefaultLabel, keybindingItemEntry.commandDefaultLabelMatches);
            }
            else {
                templateData.commandDefaultLabelContainer.classList.add('hide');
                templateData.commandDefaultLabel.set(undefined);
            }
            if (keybindingItemEntry.commandIdMatches || !keybindingItem.commandLabel) {
                templateData.commandIdLabelContainer.classList.remove('hide');
                templateData.commandIdLabel.set(keybindingItem.command, keybindingItemEntry.commandIdMatches);
            }
            else {
                templateData.commandIdLabelContainer.classList.add('hide');
                templateData.commandIdLabel.set(undefined);
            }
        }
        disposeTemplate(templateData) { }
    }
    CommandColumnRenderer.TEMPLATE_ID = 'commands';
    let KeybindingColumnRenderer = class KeybindingColumnRenderer {
        constructor(themeService) {
            this.themeService = themeService;
            this.templateId = KeybindingColumnRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const element = DOM.append(container, $('.keybinding'));
            const keybindingLabel = new keybindingLabel_1.KeybindingLabel(DOM.append(element, $('div.keybinding-label')), platform_1.OS);
            const keybindingLabelStyler = (0, styler_1.attachKeybindingLabelStyler)(keybindingLabel, this.themeService);
            return { keybindingLabel, keybindingLabelStyler };
        }
        renderElement(keybindingItemEntry, index, templateData, height) {
            if (keybindingItemEntry.keybindingItem.keybinding) {
                templateData.keybindingLabel.set(keybindingItemEntry.keybindingItem.keybinding, keybindingItemEntry.keybindingMatches);
            }
            else {
                templateData.keybindingLabel.set(undefined, undefined);
            }
        }
        disposeTemplate(templateData) {
            templateData.keybindingLabelStyler.dispose();
        }
    };
    KeybindingColumnRenderer.TEMPLATE_ID = 'keybindings';
    KeybindingColumnRenderer = __decorate([
        __param(0, themeService_1.IThemeService)
    ], KeybindingColumnRenderer);
    class SourceColumnRenderer {
        constructor() {
            this.templateId = SourceColumnRenderer.TEMPLATE_ID;
        }
        renderTemplate(container) {
            const sourceColumn = DOM.append(container, $('.source'));
            const highlightedLabel = new highlightedLabel_1.HighlightedLabel(sourceColumn);
            return { highlightedLabel };
        }
        renderElement(keybindingItemEntry, index, templateData, height) {
            templateData.highlightedLabel.set(keybindingItemEntry.keybindingItem.source, keybindingItemEntry.sourceMatches);
        }
        disposeTemplate(templateData) { }
    }
    SourceColumnRenderer.TEMPLATE_ID = 'source';
    let WhenColumnRenderer = class WhenColumnRenderer {
        constructor(keybindingsEditor, contextViewService, themeService, contextKeyService) {
            this.keybindingsEditor = keybindingsEditor;
            this.contextViewService = contextViewService;
            this.themeService = themeService;
            this.templateId = WhenColumnRenderer.TEMPLATE_ID;
            this.whenFocusContextKey = preferences_1.CONTEXT_WHEN_FOCUS.bindTo(contextKeyService);
        }
        renderTemplate(container) {
            const element = DOM.append(container, $('.when'));
            const whenContainer = DOM.append(element, $('div.when-label'));
            const whenLabel = new highlightedLabel_1.HighlightedLabel(whenContainer);
            const whenInput = new inputBox_1.InputBox(element, this.contextViewService, {
                validationOptions: {
                    validation: (value) => {
                        try {
                            contextkey_1.ContextKeyExpr.deserialize(value, true);
                        }
                        catch (error) {
                            return {
                                content: error.message,
                                formatContent: true,
                                type: 3 /* MessageType.ERROR */
                            };
                        }
                        return null;
                    }
                },
                ariaLabel: (0, nls_1.localize)('whenContextInputAriaLabel', "Type when context. Press Enter to confirm or Escape to cancel.")
            });
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add((0, styler_1.attachInputBoxStyler)(whenInput, this.themeService));
            const _onDidAccept = disposables.add(new event_1.Emitter());
            const onDidAccept = _onDidAccept.event;
            const _onDidReject = disposables.add(new event_1.Emitter());
            const onDidReject = _onDidReject.event;
            const hideInputBox = () => {
                element.classList.remove('input-mode');
                container.style.paddingLeft = '10px';
            };
            disposables.add(DOM.addStandardDisposableListener(whenInput.inputElement, DOM.EventType.KEY_DOWN, e => {
                let handled = false;
                if (e.equals(3 /* KeyCode.Enter */)) {
                    hideInputBox();
                    _onDidAccept.fire();
                    handled = true;
                }
                else if (e.equals(9 /* KeyCode.Escape */)) {
                    hideInputBox();
                    _onDidReject.fire();
                    handled = true;
                }
                if (handled) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }));
            disposables.add((DOM.addDisposableListener(whenInput.inputElement, DOM.EventType.FOCUS, () => {
                this.whenFocusContextKey.set(true);
            })));
            disposables.add((DOM.addDisposableListener(whenInput.inputElement, DOM.EventType.BLUR, () => {
                this.whenFocusContextKey.set(false);
                hideInputBox();
                _onDidReject.fire();
            })));
            const renderDisposables = disposables.add(new lifecycle_1.DisposableStore());
            return {
                element,
                whenContainer,
                whenLabel,
                whenInput,
                onDidAccept,
                onDidReject,
                renderDisposables,
                disposables,
            };
        }
        renderElement(keybindingItemEntry, index, templateData, height) {
            templateData.renderDisposables.clear();
            templateData.renderDisposables.add(this.keybindingsEditor.onDefineWhenExpression(e => {
                if (keybindingItemEntry === e) {
                    templateData.element.classList.add('input-mode');
                    templateData.whenInput.focus();
                    templateData.whenInput.select();
                    templateData.element.parentElement.style.paddingLeft = '0px';
                }
            }));
            templateData.whenInput.value = keybindingItemEntry.keybindingItem.when || '';
            templateData.whenContainer.classList.toggle('code', !!keybindingItemEntry.keybindingItem.when);
            templateData.whenContainer.classList.toggle('empty', !keybindingItemEntry.keybindingItem.when);
            if (keybindingItemEntry.keybindingItem.when) {
                templateData.whenLabel.set(keybindingItemEntry.keybindingItem.when, keybindingItemEntry.whenMatches);
                templateData.whenLabel.element.title = keybindingItemEntry.keybindingItem.when;
                templateData.element.title = keybindingItemEntry.keybindingItem.when;
            }
            else {
                templateData.whenLabel.set('-');
                templateData.whenLabel.element.title = '';
                templateData.element.title = '';
            }
            templateData.renderDisposables.add(templateData.onDidAccept(() => {
                this.keybindingsEditor.updateKeybinding(keybindingItemEntry, keybindingItemEntry.keybindingItem.keybinding ? keybindingItemEntry.keybindingItem.keybinding.getUserSettingsLabel() || '' : '', templateData.whenInput.value);
                this.keybindingsEditor.selectKeybinding(keybindingItemEntry);
            }));
            templateData.renderDisposables.add(templateData.onDidReject(() => {
                templateData.whenInput.value = keybindingItemEntry.keybindingItem.when || '';
                this.keybindingsEditor.selectKeybinding(keybindingItemEntry);
            }));
        }
        disposeTemplate(templateData) {
            templateData.disposables.dispose();
            templateData.renderDisposables.dispose();
        }
    };
    WhenColumnRenderer.TEMPLATE_ID = 'when';
    WhenColumnRenderer = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, themeService_1.IThemeService),
        __param(3, contextkey_1.IContextKeyService)
    ], WhenColumnRenderer);
    class AccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('keybindingsLabel', "Keybindings");
        }
        getAriaLabel(keybindingItemEntry) {
            var _a;
            let ariaLabel = keybindingItemEntry.keybindingItem.commandLabel ? keybindingItemEntry.keybindingItem.commandLabel : keybindingItemEntry.keybindingItem.command;
            ariaLabel += ', ' + (((_a = keybindingItemEntry.keybindingItem.keybinding) === null || _a === void 0 ? void 0 : _a.getAriaLabel()) || (0, nls_1.localize)('noKeybinding', "No Keybinding assigned."));
            ariaLabel += ', ' + keybindingItemEntry.keybindingItem.source;
            ariaLabel += ', ' + keybindingItemEntry.keybindingItem.when ? keybindingItemEntry.keybindingItem.when : (0, nls_1.localize)('noWhen', "No when context.");
            return ariaLabel;
        }
    }
    const keybindingTableHeader = (0, colorRegistry_1.registerColor)('keybindingTable.headerBackground', { dark: colorRegistry_1.tableOddRowsBackgroundColor, light: colorRegistry_1.tableOddRowsBackgroundColor, hcDark: colorRegistry_1.tableOddRowsBackgroundColor, hcLight: colorRegistry_1.tableOddRowsBackgroundColor }, 'Background color for the keyboard shortcuts table header.');
    const keybindingTableRows = (0, colorRegistry_1.registerColor)('keybindingTable.rowsBackground', { light: colorRegistry_1.tableOddRowsBackgroundColor, dark: colorRegistry_1.tableOddRowsBackgroundColor, hcDark: colorRegistry_1.tableOddRowsBackgroundColor, hcLight: colorRegistry_1.tableOddRowsBackgroundColor }, 'Background color for the keyboard shortcuts table alternating rows.');
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const tableHeader = theme.getColor(keybindingTableHeader);
        if (tableHeader) {
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table .monaco-table-th { background-color: ${tableHeader}; }`);
        }
        const tableRows = theme.getColor(keybindingTableRows);
        if (tableRows) {
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table .monaco-list-row[data-parity=odd]:not(.focused):not(.selected):not(:hover) .monaco-table-tr { background-color: ${tableRows}; }`);
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table .monaco-list:not(:focus) .monaco-list-row[data-parity=odd].focused:not(.selected):not(:hover) .monaco-table-tr { background-color: ${tableRows}; }`);
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table .monaco-list:not(.focused) .monaco-list-row[data-parity=odd].focused:not(.selected):not(:hover) .monaco-table-tr { background-color: ${tableRows}; }`);
        }
        const foregroundColor = theme.getColor(colorRegistry_1.foreground);
        if (foregroundColor) {
            const whenForegroundColor = foregroundColor.transparent(.8).makeOpaque((0, theme_1.WORKBENCH_BACKGROUND)(theme));
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table .monaco-table-tr .monaco-table-td .code { color: ${whenForegroundColor}; }`);
        }
        const listActiveSelectionForegroundColor = theme.getColor(colorRegistry_1.listActiveSelectionForeground);
        const listActiveSelectionBackgroundColor = theme.getColor(colorRegistry_1.listActiveSelectionBackground);
        if (listActiveSelectionForegroundColor && listActiveSelectionBackgroundColor) {
            const whenForegroundColor = listActiveSelectionForegroundColor.transparent(.8).makeOpaque(listActiveSelectionBackgroundColor);
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table.focused .monaco-list-row.selected .monaco-table-tr .monaco-table-td .code { color: ${whenForegroundColor}; }`);
        }
        const listInactiveSelectionForegroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionForeground);
        const listInactiveSelectionBackgroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionBackground);
        if (listInactiveSelectionForegroundColor && listInactiveSelectionBackgroundColor) {
            const whenForegroundColor = listInactiveSelectionForegroundColor.transparent(.8).makeOpaque(listInactiveSelectionBackgroundColor);
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table .monaco-list-row.selected .monaco-table-tr .monaco-table-td .code { color: ${whenForegroundColor}; }`);
        }
        const listFocusForegroundColor = theme.getColor(colorRegistry_1.listFocusForeground);
        const listFocusBackgroundColor = theme.getColor(colorRegistry_1.listFocusBackground);
        if (listFocusForegroundColor && listFocusBackgroundColor) {
            const whenForegroundColor = listFocusForegroundColor.transparent(.8).makeOpaque(listFocusBackgroundColor);
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table.focused .monaco-list-row.focused .monaco-table-tr .monaco-table-td .code { color: ${whenForegroundColor}; }`);
        }
        const listHoverForegroundColor = theme.getColor(colorRegistry_1.listHoverForeground);
        const listHoverBackgroundColor = theme.getColor(colorRegistry_1.listHoverBackground);
        if (listHoverForegroundColor && listHoverBackgroundColor) {
            const whenForegroundColor = listHoverForegroundColor.transparent(.8).makeOpaque(listHoverBackgroundColor);
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table.focused .monaco-list-row:hover:not(.focused):not(.selected) .monaco-table-tr .monaco-table-td .code { color: ${whenForegroundColor}; }`);
        }
        const listHighlightForegroundColor = theme.getColor(colorRegistry_1.listHighlightForeground);
        if (listHighlightForegroundColor) {
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table .monaco-table-tr .monaco-table-td .highlight { color: ${listHighlightForegroundColor}; }`);
        }
        if (listActiveSelectionForegroundColor) {
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table.focused .monaco-list-row.selected.focused .monaco-table-tr .monaco-table-td .monaco-keybinding-key { color: ${listActiveSelectionForegroundColor}; }`);
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table.focused .monaco-list-row.selected .monaco-table-tr .monaco-table-td .monaco-keybinding-key { color: ${listActiveSelectionForegroundColor}; }`);
        }
        const listInactiveFocusAndSelectionForegroundColor = theme.getColor(colorRegistry_1.listInactiveSelectionForeground);
        if (listInactiveFocusAndSelectionForegroundColor) {
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table .monaco-list-row.selected .monaco-table-tr .monaco-table-td .monaco-keybinding-key { color: ${listInactiveFocusAndSelectionForegroundColor}; }`);
        }
        if (listHoverForegroundColor) {
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table .monaco-list-row:hover:not(.selected):not(.focused) .monaco-table-tr .monaco-table-td .monaco-keybinding-key { color: ${listHoverForegroundColor}; }`);
        }
        if (listFocusForegroundColor) {
            collector.addRule(`.keybindings-editor > .keybindings-body > .keybindings-table-container .monaco-table .monaco-list-row.focused .monaco-table-tr .monaco-table-td .monaco-keybinding-key { color: ${listFocusForegroundColor}; }`);
        }
    });
});
//# sourceMappingURL=keybindingsEditor.js.map