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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/terminal/browser/terminalActions", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/platform/notification/common/notification", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/browser/parts/views/viewPane", "vs/platform/keybinding/common/keybinding", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/workbench/common/theme", "vs/platform/actions/common/actions", "vs/workbench/contrib/terminal/common/terminal", "vs/platform/terminal/common/terminal", "vs/base/browser/ui/actionbar/actionViewItems", "vs/platform/theme/common/styler", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/terminal/browser/terminalTabbedView", "vs/base/common/codicons", "vs/platform/commands/common/commands", "vs/base/browser/ui/iconLabel/iconLabels", "vs/workbench/contrib/terminal/browser/terminalStatusList", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/theme/common/theme", "vs/workbench/contrib/terminal/browser/terminalIcon", "vs/workbench/contrib/terminal/common/terminalStrings", "vs/base/common/types", "vs/workbench/contrib/terminal/browser/terminalMenus", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/workbench/contrib/terminal/browser/terminalTooltip"], function (require, exports, nls, dom, configuration_1, contextView_1, instantiation_1, telemetry_1, themeService_1, terminalActions_1, terminalColorRegistry_1, notification_1, terminal_1, viewPane_1, keybinding_1, contextkey_1, views_1, opener_1, theme_1, actions_1, terminal_2, terminal_3, actionViewItems_1, styler_1, colorRegistry_1, terminalTabbedView_1, codicons_1, commands_1, iconLabels_1, terminalStatusList_1, menuEntryActionViewItem_1, dropdownWithPrimaryActionViewItem_1, lifecycle_1, uri_1, theme_2, terminalIcon_1, terminalStrings_1, types_1, terminalMenus_1, terminalContextKey_1, terminalTooltip_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalViewPane = void 0;
    let TerminalViewPane = class TerminalViewPane extends viewPane_1.ViewPane {
        constructor(options, keybindingService, _contextKeyService, viewDescriptorService, configurationService, _contextMenuService, _instantiationService, _terminalService, _terminalGroupService, themeService, telemetryService, _notificationService, _keybindingService, openerService, _menuService, _commandService, _terminalProfileService, _terminalProfileResolverService) {
            var _a;
            super(options, keybindingService, _contextMenuService, configurationService, _contextKeyService, viewDescriptorService, _instantiationService, openerService, themeService, telemetryService);
            this._contextKeyService = _contextKeyService;
            this._contextMenuService = _contextMenuService;
            this._instantiationService = _instantiationService;
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._notificationService = _notificationService;
            this._keybindingService = _keybindingService;
            this._menuService = _menuService;
            this._commandService = _commandService;
            this._terminalProfileService = _terminalProfileService;
            this._terminalProfileResolverService = _terminalProfileResolverService;
            this._terminalsInitialized = false;
            this._isWelcomeShowing = false;
            this._register(this._terminalService.onDidRegisterProcessSupport(() => {
                if (this._actions) {
                    for (const action of this._actions) {
                        action.enabled = true;
                    }
                }
                this._onDidChangeViewWelcomeState.fire();
            }));
            this._register(this._terminalService.onDidChangeInstances(() => {
                if (!this._isWelcomeShowing) {
                    return;
                }
                this._isWelcomeShowing = true;
                this._onDidChangeViewWelcomeState.fire();
                if (!this._terminalTabbedView && this._parentDomElement) {
                    this._createTabsView();
                    this.layoutBody(this._parentDomElement.offsetHeight, this._parentDomElement.offsetWidth);
                }
            }));
            this._dropdownMenu = this._register(this._menuService.createMenu(actions_1.MenuId.TerminalNewDropdownContext, this._contextKeyService));
            this._singleTabMenu = this._register(this._menuService.createMenu(actions_1.MenuId.TerminalInlineTabContext, this._contextKeyService));
            this._register(this._terminalProfileService.onDidChangeAvailableProfiles(profiles => this._updateTabActionBar(profiles)));
            this._viewShowing = terminalContextKey_1.TerminalContextKeys.viewShowing.bindTo(this._contextKeyService);
            this._register(this.onDidChangeBodyVisibility(e => {
                var _a;
                if (e) {
                    (_a = this._terminalTabbedView) === null || _a === void 0 ? void 0 : _a.rerenderTabs();
                }
            }));
            configurationService.onDidChangeConfiguration(e => {
                var _a, _b;
                if ((e.affectsConfiguration("terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */) && !configurationService.getValue("terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */)) ||
                    (e.affectsConfiguration("terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */) && !configurationService.getValue("terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */))) {
                    (_a = this._parentDomElement) === null || _a === void 0 ? void 0 : _a.classList.remove('shell-integration');
                }
                else if (configurationService.getValue("terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */) && configurationService.getValue("terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */)) {
                    (_b = this._parentDomElement) === null || _b === void 0 ? void 0 : _b.classList.add('shell-integration');
                }
            });
            if (configurationService.getValue("terminal.integrated.shellIntegration.decorationsEnabled" /* TerminalSettingId.ShellIntegrationDecorationsEnabled */) && configurationService.getValue("terminal.integrated.shellIntegration.enabled" /* TerminalSettingId.ShellIntegrationEnabled */)) {
                (_a = this._parentDomElement) === null || _a === void 0 ? void 0 : _a.classList.add('shell-integration');
            }
        }
        get terminalTabbedView() { return this._terminalTabbedView; }
        renderBody(container) {
            super.renderBody(container);
            this._parentDomElement = container;
            this._parentDomElement.classList.add('integrated-terminal');
            this._fontStyleElement = document.createElement('style');
            this._instantiationService.createInstance(TerminalThemeIconStyle, this._parentDomElement);
            if (!this.shouldShowWelcome()) {
                this._createTabsView();
            }
            this._parentDomElement.appendChild(this._fontStyleElement);
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration("terminal.integrated.fontFamily" /* TerminalSettingId.FontFamily */) || e.affectsConfiguration('editor.fontFamily')) {
                    const configHelper = this._terminalService.configHelper;
                    if (!configHelper.configFontIsMonospace()) {
                        const choices = [{
                                label: nls.localize('terminal.useMonospace', "Use 'monospace'"),
                                run: () => this.configurationService.updateValue("terminal.integrated.fontFamily" /* TerminalSettingId.FontFamily */, 'monospace'),
                            }];
                        this._notificationService.prompt(notification_1.Severity.Warning, nls.localize('terminal.monospaceOnly', "The terminal only supports monospace fonts. Be sure to restart VS Code if this is a newly installed font."), choices);
                    }
                }
            }));
            this._register(this.onDidChangeBodyVisibility(visible => {
                var _a, _b;
                this._viewShowing.set(visible);
                if (visible) {
                    const hadTerminals = !!this._terminalGroupService.groups.length;
                    if (this._terminalService.isProcessSupportRegistered) {
                        if (this._terminalsInitialized) {
                            if (!hadTerminals) {
                                this._terminalService.createTerminal({ location: terminal_3.TerminalLocation.Panel });
                            }
                        }
                        else {
                            this._terminalsInitialized = true;
                            this._terminalService.initializeTerminals();
                        }
                    }
                    else {
                        this._onDidChangeViewWelcomeState.fire();
                    }
                    // we don't know here whether or not it should be focused, so
                    // defer focusing the panel to the focus() call
                    // to prevent overriding preserveFocus for extensions
                    this._terminalGroupService.showPanel(false);
                    if (hadTerminals) {
                        (_a = this._terminalGroupService.activeGroup) === null || _a === void 0 ? void 0 : _a.setVisible(visible);
                    }
                }
                else {
                    (_b = this._terminalGroupService.activeGroup) === null || _b === void 0 ? void 0 : _b.setVisible(false);
                }
            }));
            this.layoutBody(this._parentDomElement.offsetHeight, this._parentDomElement.offsetWidth);
        }
        _createTabsView() {
            if (!this._parentDomElement) {
                return;
            }
            this._terminalTabbedView = this.instantiationService.createInstance(terminalTabbedView_1.TerminalTabbedView, this._parentDomElement);
        }
        // eslint-disable-next-line @typescript-eslint/naming-convention
        layoutBody(height, width) {
            var _a;
            super.layoutBody(height, width);
            (_a = this._terminalTabbedView) === null || _a === void 0 ? void 0 : _a.layout(width, height);
        }
        getActionViewItem(action) {
            switch (action.id) {
                case "workbench.action.terminal.split" /* TerminalCommandId.Split */: {
                    // Split needs to be special cased to force splitting within the panel, not the editor
                    const panelOnlySplitAction = {
                        id: action.id,
                        checked: action.checked,
                        class: action.class,
                        enabled: action.enabled,
                        label: action.label,
                        dispose: action.dispose.bind(action),
                        tooltip: action.tooltip,
                        run: async () => {
                            const instance = this._terminalGroupService.activeInstance;
                            if (instance) {
                                const newInstance = await this._terminalService.createTerminal({ location: { parentTerminal: instance } });
                                return newInstance === null || newInstance === void 0 ? void 0 : newInstance.focusWhenReady();
                            }
                            return;
                        }
                    };
                    return new actionViewItems_1.ActionViewItem(action, panelOnlySplitAction, { icon: true, label: false, keybinding: this._getKeybindingLabel(action) });
                }
                case "workbench.action.terminal.switchTerminal" /* TerminalCommandId.SwitchTerminal */: {
                    return this._instantiationService.createInstance(SwitchTerminalActionViewItem, action);
                }
                case "workbench.action.terminal.focus" /* TerminalCommandId.Focus */: {
                    const actions = [];
                    (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(this._singleTabMenu, undefined, actions);
                    return this._instantiationService.createInstance(SingleTerminalTabActionViewItem, action, actions);
                }
                case "workbench.action.terminal.createProfileButton" /* TerminalCommandId.CreateWithProfileButton */: {
                    if (this._tabButtons) {
                        this._tabButtons.dispose();
                    }
                    const actions = (0, terminalMenus_1.getTerminalActionBarArgs)(terminal_3.TerminalLocation.Panel, this._terminalProfileService.availableProfiles, this._getDefaultProfileName(), this._terminalProfileService.contributedProfiles, this._instantiationService, this._terminalService, this._contextKeyService, this._commandService, this._dropdownMenu);
                    this._tabButtons = new dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem(actions.primaryAction, actions.dropdownAction, actions.dropdownMenuActions, actions.className, this._contextMenuService, {}, this._keybindingService, this._notificationService, this._contextKeyService);
                    this._updateTabActionBar(this._terminalProfileService.availableProfiles);
                    return this._tabButtons;
                }
            }
            return super.getActionViewItem(action);
        }
        _getDefaultProfileName() {
            let defaultProfileName;
            try {
                defaultProfileName = this._terminalProfileService.getDefaultProfileName();
            }
            catch (e) {
                defaultProfileName = this._terminalProfileResolverService.defaultProfileName;
            }
            return defaultProfileName;
        }
        _getKeybindingLabel(action) {
            var _a;
            return (0, types_1.withNullAsUndefined)((_a = this._keybindingService.lookupKeybinding(action.id)) === null || _a === void 0 ? void 0 : _a.getLabel());
        }
        _updateTabActionBar(profiles) {
            var _a;
            const actions = (0, terminalMenus_1.getTerminalActionBarArgs)(terminal_3.TerminalLocation.Panel, profiles, this._getDefaultProfileName(), this._terminalProfileService.contributedProfiles, this._instantiationService, this._terminalService, this._contextKeyService, this._commandService, this._dropdownMenu);
            (_a = this._tabButtons) === null || _a === void 0 ? void 0 : _a.update(actions.dropdownAction, actions.dropdownMenuActions);
        }
        focus() {
            if (this._terminalService.connectionState === 0 /* TerminalConnectionState.Connecting */) {
                // If the terminal is waiting to reconnect to remote terminals, then there is no TerminalInstance yet that can
                // be focused. So wait for connection to finish, then focus.
                const activeElement = document.activeElement;
                this._register(this._terminalService.onDidChangeConnectionState(() => {
                    // Only focus the terminal if the activeElement has not changed since focus() was called
                    // TODO hack
                    if (document.activeElement === activeElement) {
                        this._terminalGroupService.showPanel(true);
                    }
                }));
                return;
            }
            this._terminalGroupService.showPanel(true);
        }
        shouldShowWelcome() {
            this._isWelcomeShowing = !this._terminalService.isProcessSupportRegistered && this._terminalService.instances.length === 0;
            return this._isWelcomeShowing;
        }
    };
    TerminalViewPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, views_1.IViewDescriptorService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, terminal_1.ITerminalService),
        __param(8, terminal_1.ITerminalGroupService),
        __param(9, themeService_1.IThemeService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, notification_1.INotificationService),
        __param(12, keybinding_1.IKeybindingService),
        __param(13, opener_1.IOpenerService),
        __param(14, actions_1.IMenuService),
        __param(15, commands_1.ICommandService),
        __param(16, terminal_2.ITerminalProfileService),
        __param(17, terminal_2.ITerminalProfileResolverService)
    ], TerminalViewPane);
    exports.TerminalViewPane = TerminalViewPane;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const panelBackgroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR) || theme.getColor(theme_1.PANEL_BACKGROUND);
        collector.addRule(`.monaco-workbench .part.panel .pane-body.integrated-terminal .terminal-outer-container { background-color: ${panelBackgroundColor ? panelBackgroundColor.toString() : ''}; }`);
        const sidebarBackgroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR) || theme.getColor(theme_1.SIDE_BAR_BACKGROUND);
        collector.addRule(`.monaco-workbench .part.sidebar .pane-body.integrated-terminal .terminal-outer-container { background-color: ${sidebarBackgroundColor ? sidebarBackgroundColor.toString() : ''}; }`);
        collector.addRule(`.monaco-workbench .part.auxiliarybar .pane-body.integrated-terminal .terminal-outer-container { background-color: ${sidebarBackgroundColor ? sidebarBackgroundColor.toString() : ''}; }`);
        const borderColor = theme.getColor(terminalColorRegistry_1.TERMINAL_BORDER_COLOR);
        if (borderColor) {
            collector.addRule(`.monaco-workbench .pane-body.integrated-terminal .split-view-view:not(:first-child) { border-color: ${borderColor.toString()}; }`);
            collector.addRule(`.monaco-workbench .pane-body.integrated-terminal .tabs-container { border-color: ${borderColor.toString()}; }`);
        }
        const dndBackgroundColor = theme.getColor(terminalColorRegistry_1.TERMINAL_DRAG_AND_DROP_BACKGROUND) || theme.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND);
        if (dndBackgroundColor) {
            collector.addRule(`.monaco-workbench .pane-body.integrated-terminal .terminal-drop-overlay { background-color: ${dndBackgroundColor.toString()}; }`);
        }
        const activeTabBorderColor = theme.getColor(terminalColorRegistry_1.TERMINAL_TAB_ACTIVE_BORDER);
        if (activeTabBorderColor) {
            collector.addRule(`.monaco-workbench .pane-body.integrated-terminal .terminal-tabs-entry.is-active::before { background-color: ${activeTabBorderColor.toString()}; }`);
        }
    });
    let SwitchTerminalActionViewItem = class SwitchTerminalActionViewItem extends actionViewItems_1.SelectActionViewItem {
        constructor(action, _terminalService, _terminalGroupService, _themeService, contextViewService, terminalProfileService) {
            super(null, action, getTerminalSelectOpenItems(_terminalService, _terminalGroupService), _terminalGroupService.activeGroupIndex, contextViewService, { ariaLabel: nls.localize('terminals', 'Open Terminals.'), optionsAsChildren: true });
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._themeService = _themeService;
            this._register(_terminalService.onDidChangeInstances(() => this._updateItems(), this));
            this._register(_terminalService.onDidChangeActiveGroup(() => this._updateItems(), this));
            this._register(_terminalService.onDidChangeActiveInstance(() => this._updateItems(), this));
            this._register(_terminalService.onDidChangeInstanceTitle(() => this._updateItems(), this));
            this._register(_terminalGroupService.onDidChangeGroups(() => this._updateItems(), this));
            this._register(_terminalService.onDidChangeConnectionState(() => this._updateItems(), this));
            this._register(terminalProfileService.onDidChangeAvailableProfiles(() => this._updateItems(), this));
            this._register(_terminalService.onDidChangeInstancePrimaryStatus(() => this._updateItems(), this));
            this._register((0, styler_1.attachSelectBoxStyler)(this.selectBox, this._themeService));
        }
        render(container) {
            super.render(container);
            container.classList.add('switch-terminal');
            this._register((0, styler_1.attachStylerCallback)(this._themeService, { selectBorder: colorRegistry_1.selectBorder }, colors => {
                container.style.borderColor = colors.selectBorder ? `${colors.selectBorder}` : '';
            }));
        }
        _updateItems() {
            const options = getTerminalSelectOpenItems(this._terminalService, this._terminalGroupService);
            this.setOptions(options, this._terminalGroupService.activeGroupIndex);
        }
    };
    SwitchTerminalActionViewItem = __decorate([
        __param(1, terminal_1.ITerminalService),
        __param(2, terminal_1.ITerminalGroupService),
        __param(3, themeService_1.IThemeService),
        __param(4, contextView_1.IContextViewService),
        __param(5, terminal_2.ITerminalProfileService)
    ], SwitchTerminalActionViewItem);
    function getTerminalSelectOpenItems(terminalService, terminalGroupService) {
        let items;
        if (terminalService.connectionState === 1 /* TerminalConnectionState.Connected */) {
            items = terminalGroupService.getGroupLabels().map(label => {
                return { text: label };
            });
        }
        else {
            items = [{ text: nls.localize('terminalConnectingLabel', "Starting...") }];
        }
        items.push({ text: terminalActions_1.switchTerminalActionViewItemSeparator, isDisabled: true });
        items.push({ text: terminalActions_1.switchTerminalShowTabsTitle });
        return items;
    }
    let SingleTerminalTabActionViewItem = class SingleTerminalTabActionViewItem extends menuEntryActionViewItem_1.MenuEntryActionViewItem {
        constructor(action, _actions, keybindingService, notificationService, contextKeyService, _terminalService, _terminalGroupService, _themeService, _contextMenuService, _commandService) {
            super(new actions_1.MenuItemAction({
                id: action.id,
                title: getSingleTabLabel(_terminalGroupService.activeInstance, _terminalService.configHelper.config.tabs.separator),
                tooltip: getSingleTabTooltip(_terminalGroupService.activeInstance, _terminalService.configHelper.config.tabs.separator)
            }, {
                id: "workbench.action.terminal.split" /* TerminalCommandId.Split */,
                title: terminalStrings_1.terminalStrings.split.value,
                icon: codicons_1.Codicon.splitHorizontal
            }, undefined, contextKeyService, _commandService), {
                draggable: true
            }, keybindingService, notificationService, contextKeyService);
            this._actions = _actions;
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._themeService = _themeService;
            this._contextMenuService = _contextMenuService;
            this._commandService = _commandService;
            this._elementDisposables = [];
            // Register listeners to update the tab
            this._register(this._terminalService.onDidChangeInstancePrimaryStatus(e => this.updateLabel(e)));
            this._register(this._terminalGroupService.onDidChangeActiveInstance(() => this.updateLabel()));
            this._register(this._terminalService.onDidChangeInstanceIcon(e => this.updateLabel(e)));
            this._register(this._terminalService.onDidChangeInstanceColor(e => this.updateLabel(e)));
            this._register(this._terminalService.onDidChangeInstanceTitle(e => {
                if (e === this._terminalGroupService.activeInstance) {
                    this._action.tooltip = getSingleTabTooltip(e, this._terminalService.configHelper.config.tabs.separator);
                    this.updateLabel();
                }
            }));
            this._register(this._terminalService.onDidChangeInstanceCapability(e => {
                this._action.tooltip = getSingleTabTooltip(e, this._terminalService.configHelper.config.tabs.separator);
                this.updateLabel(e);
            }));
            // Clean up on dispose
            this._register((0, lifecycle_1.toDisposable)(() => (0, lifecycle_1.dispose)(this._elementDisposables)));
        }
        async onClick(event) {
            if (event.altKey && this._menuItemAction.alt) {
                this._commandService.executeCommand(this._menuItemAction.alt.id, { target: terminal_3.TerminalLocation.Panel });
            }
            else {
                this._openContextMenu();
            }
        }
        updateLabel(e) {
            // Only update if it's the active instance
            if (e && e !== this._terminalGroupService.activeInstance) {
                return;
            }
            if (this._elementDisposables.length === 0 && this.element && this.label) {
                // Right click opens context menu
                this._elementDisposables.push(dom.addDisposableListener(this.element, dom.EventType.CONTEXT_MENU, e => {
                    if (e.button === 2) {
                        this._openContextMenu();
                        e.preventDefault();
                    }
                }));
                // Middle click kills
                this._elementDisposables.push(dom.addDisposableListener(this.element, dom.EventType.AUXCLICK, e => {
                    if (e.button === 1) {
                        const instance = this._terminalGroupService.activeInstance;
                        if (instance) {
                            this._terminalService.safeDisposeTerminal(instance);
                        }
                        e.preventDefault();
                    }
                }));
                // Drag and drop
                this._elementDisposables.push(dom.addDisposableListener(this.element, dom.EventType.DRAG_START, e => {
                    const instance = this._terminalGroupService.activeInstance;
                    if (e.dataTransfer && instance) {
                        e.dataTransfer.setData("Terminals" /* TerminalDataTransfers.Terminals */, JSON.stringify([instance.resource.toString()]));
                    }
                }));
            }
            if (this.label) {
                const label = this.label;
                const instance = this._terminalGroupService.activeInstance;
                if (!instance) {
                    dom.reset(label, '');
                    return;
                }
                label.classList.add('single-terminal-tab');
                let colorStyle = '';
                const primaryStatus = instance.statusList.primary;
                if (primaryStatus) {
                    const colorKey = (0, terminalStatusList_1.getColorForSeverity)(primaryStatus.severity);
                    this._themeService.getColorTheme();
                    const foundColor = this._themeService.getColorTheme().getColor(colorKey);
                    if (foundColor) {
                        colorStyle = foundColor.toString();
                    }
                }
                label.style.color = colorStyle;
                dom.reset(label, ...(0, iconLabels_1.renderLabelWithIcons)(getSingleTabLabel(instance, this._terminalService.configHelper.config.tabs.separator, themeService_1.ThemeIcon.isThemeIcon(this._commandAction.item.icon) ? this._commandAction.item.icon : undefined)));
                if (this._altCommand) {
                    label.classList.remove(this._altCommand);
                    this._altCommand = undefined;
                }
                if (this._color) {
                    label.classList.remove(this._color);
                    this._color = undefined;
                }
                if (this._class) {
                    label.classList.remove(this._class);
                    label.classList.remove('terminal-uri-icon');
                    this._class = undefined;
                }
                const colorClass = (0, terminalIcon_1.getColorClass)(instance);
                if (colorClass) {
                    this._color = colorClass;
                    label.classList.add(colorClass);
                }
                const uriClasses = (0, terminalIcon_1.getUriClasses)(instance, this._themeService.getColorTheme().type);
                if (uriClasses) {
                    this._class = uriClasses === null || uriClasses === void 0 ? void 0 : uriClasses[0];
                    label.classList.add(...uriClasses);
                }
                if (this._commandAction.item.icon) {
                    this._altCommand = `alt-command`;
                    label.classList.add(this._altCommand);
                }
                this.updateTooltip();
            }
        }
        _openContextMenu() {
            this._contextMenuService.showContextMenu({
                getAnchor: () => this.element,
                getActions: () => this._actions,
                getActionsContext: () => this.label
            });
        }
    };
    SingleTerminalTabActionViewItem = __decorate([
        __param(2, keybinding_1.IKeybindingService),
        __param(3, notification_1.INotificationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, terminal_1.ITerminalService),
        __param(6, terminal_1.ITerminalGroupService),
        __param(7, themeService_1.IThemeService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, commands_1.ICommandService)
    ], SingleTerminalTabActionViewItem);
    function getSingleTabLabel(instance, separator, icon) {
        var _a;
        // Don't even show the icon if there is no title as the icon would shift around when the title
        // is added
        if (!instance || !instance.title) {
            return '';
        }
        let iconClass = themeService_1.ThemeIcon.isThemeIcon(instance.icon) ? (_a = instance.icon) === null || _a === void 0 ? void 0 : _a.id : codicons_1.Codicon.terminal.id;
        const label = `$(${(icon === null || icon === void 0 ? void 0 : icon.id) || iconClass}) ${getSingleTabTitle(instance, separator)}`;
        const primaryStatus = instance.statusList.primary;
        if (!(primaryStatus === null || primaryStatus === void 0 ? void 0 : primaryStatus.icon)) {
            return label;
        }
        return `${label} $(${primaryStatus.icon.id})`;
    }
    function getSingleTabTooltip(instance, separator) {
        if (!instance) {
            return '';
        }
        const shellIntegrationString = (0, terminalTooltip_1.getShellIntegrationTooltip)(instance);
        const title = getSingleTabTitle(instance, separator);
        return shellIntegrationString ? title + shellIntegrationString : title;
    }
    function getSingleTabTitle(instance, separator) {
        if (!instance) {
            return '';
        }
        return !instance.description ? instance.title : `${instance.title} ${separator} ${instance.description}`;
    }
    let TerminalThemeIconStyle = class TerminalThemeIconStyle extends themeService_1.Themable {
        constructor(container, _themeService, _terminalService, _terminalGroupService) {
            super(_themeService);
            this._themeService = _themeService;
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._registerListeners();
            this._styleElement = document.createElement('style');
            container.appendChild(this._styleElement);
            this._register((0, lifecycle_1.toDisposable)(() => container.removeChild(this._styleElement)));
            this.updateStyles();
        }
        _registerListeners() {
            this._register(this._terminalService.onDidChangeInstanceIcon(() => this.updateStyles()));
            this._register(this._terminalService.onDidChangeInstanceColor(() => this.updateStyles()));
            this._register(this._terminalService.onDidChangeInstances(() => this.updateStyles()));
            this._register(this._terminalGroupService.onDidChangeGroups(() => this.updateStyles()));
        }
        updateStyles() {
            super.updateStyles();
            const colorTheme = this._themeService.getColorTheme();
            // TODO: add a rule collector to avoid duplication
            let css = '';
            // Add icons
            for (const instance of this._terminalService.instances) {
                const icon = instance.icon;
                if (!icon) {
                    continue;
                }
                let uri = undefined;
                if (icon instanceof uri_1.URI) {
                    uri = icon;
                }
                else if (icon instanceof Object && 'light' in icon && 'dark' in icon) {
                    uri = colorTheme.type === theme_2.ColorScheme.LIGHT ? icon.light : icon.dark;
                }
                const iconClasses = (0, terminalIcon_1.getUriClasses)(instance, colorTheme.type);
                if (uri instanceof uri_1.URI && iconClasses && iconClasses.length > 1) {
                    css += (`.monaco-workbench .${iconClasses[0]} .monaco-highlighted-label .codicon, .monaco-action-bar .terminal-uri-icon.single-terminal-tab.action-label:not(.alt-command) .codicon` +
                        `{background-image: ${dom.asCSSUrl(uri)};}`);
                }
            }
            // Add colors
            for (const instance of this._terminalService.instances) {
                const colorClass = (0, terminalIcon_1.getColorClass)(instance);
                if (!colorClass || !instance.color) {
                    continue;
                }
                const color = colorTheme.getColor(instance.color);
                if (color) {
                    // exclude status icons (file-icon) and inline action icons (trashcan and horizontalSplit)
                    css += (`.monaco-workbench .${colorClass} .codicon:first-child:not(.codicon-split-horizontal):not(.codicon-trashcan):not(.file-icon)` +
                        `{ color: ${color} !important; }`);
                }
            }
            this._styleElement.textContent = css;
        }
    };
    TerminalThemeIconStyle = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, terminal_1.ITerminalService),
        __param(3, terminal_1.ITerminalGroupService)
    ], TerminalThemeIconStyle);
});
//# sourceMappingURL=terminalView.js.map