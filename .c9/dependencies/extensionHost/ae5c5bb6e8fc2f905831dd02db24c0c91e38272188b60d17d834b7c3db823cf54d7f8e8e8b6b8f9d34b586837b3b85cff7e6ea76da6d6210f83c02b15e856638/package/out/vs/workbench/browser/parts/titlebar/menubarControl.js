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
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/theme/common/themeService", "vs/platform/window/common/window", "vs/platform/contextkey/common/contextkey", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/keybinding/common/keybinding", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/workspaces/common/workspaces", "vs/base/common/async", "vs/workbench/common/theme", "vs/platform/label/common/label", "vs/platform/update/common/update", "vs/platform/storage/common/storage", "vs/platform/notification/common/notification", "vs/workbench/services/preferences/common/preferences", "vs/workbench/services/environment/common/environmentService", "vs/base/browser/ui/menu/menubar", "vs/base/browser/ui/menu/menu", "vs/platform/theme/common/styler", "vs/base/common/labels", "vs/platform/accessibility/common/accessibility", "vs/workbench/services/layout/browser/layoutService", "vs/base/browser/browser", "vs/workbench/services/host/browser/host", "vs/base/browser/canIUse", "vs/platform/contextkey/common/contextkeys", "vs/platform/commands/common/commands", "vs/platform/telemetry/common/telemetry", "vs/workbench/browser/actions/windowActions"], function (require, exports, nls_1, actions_1, themeService_1, window_1, contextkey_1, actions_2, dom_1, keybinding_1, platform_1, configuration_1, event_1, lifecycle_1, workspaces_1, async_1, theme_1, label_1, update_1, storage_1, notification_1, preferences_1, environmentService_1, menubar_1, menu_1, styler_1, labels_1, accessibility_1, layoutService_1, browser_1, host_1, canIUse_1, contextkeys_1, commands_1, telemetry_1, windowActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomMenubarControl = exports.MenubarControl = void 0;
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarFileMenu,
        title: {
            value: 'File',
            original: 'File',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mFile', comment: ['&& denotes a mnemonic'] }, "&&File"),
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarEditMenu,
        title: {
            value: 'Edit',
            original: 'Edit',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mEdit', comment: ['&& denotes a mnemonic'] }, "&&Edit")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarSelectionMenu,
        title: {
            value: 'Selection',
            original: 'Selection',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mSelection', comment: ['&& denotes a mnemonic'] }, "&&Selection")
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarViewMenu,
        title: {
            value: 'View',
            original: 'View',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mView', comment: ['&& denotes a mnemonic'] }, "&&View")
        },
        order: 4
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarGoMenu,
        title: {
            value: 'Go',
            original: 'Go',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mGoto', comment: ['&& denotes a mnemonic'] }, "&&Go")
        },
        order: 5
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarTerminalMenu,
        title: {
            value: 'Terminal',
            original: 'Terminal',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mTerminal', comment: ['&& denotes a mnemonic'] }, "&&Terminal")
        },
        order: 7,
        when: contextkey_1.ContextKeyExpr.has('terminalProcessSupported')
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarHelpMenu,
        title: {
            value: 'Help',
            original: 'Help',
            mnemonicTitle: (0, nls_1.localize)({ key: 'mHelp', comment: ['&& denotes a mnemonic'] }, "&&Help")
        },
        order: 8
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarPreferencesMenu,
        title: {
            value: 'Preferences',
            original: 'Preferences',
            mnemonicTitle: (0, nls_1.localize)('mPreferences', "Preferences")
        },
        when: contextkeys_1.IsMacNativeContext,
        order: 9
    });
    class MenubarControl extends lifecycle_1.Disposable {
        constructor(menuService, workspacesService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, hostService, commandService) {
            super();
            this.menuService = menuService;
            this.workspacesService = workspacesService;
            this.contextKeyService = contextKeyService;
            this.keybindingService = keybindingService;
            this.configurationService = configurationService;
            this.labelService = labelService;
            this.updateService = updateService;
            this.storageService = storageService;
            this.notificationService = notificationService;
            this.preferencesService = preferencesService;
            this.environmentService = environmentService;
            this.accessibilityService = accessibilityService;
            this.hostService = hostService;
            this.commandService = commandService;
            this.keys = [
                'window.menuBarVisibility',
                'window.enableMenuBarMnemonics',
                'window.customMenuBarAltFocus',
                'workbench.sideBar.location',
                'window.nativeTabs'
            ];
            this.menus = {};
            this.topLevelTitles = {};
            this.recentlyOpened = { files: [], workspaces: [] };
            this.mainMenu = this._register(this.menuService.createMenu(actions_1.MenuId.MenubarMainMenu, this.contextKeyService));
            this.mainMenuDisposables = this._register(new lifecycle_1.DisposableStore());
            this.setupMainMenu();
            this.menuUpdater = this._register(new async_1.RunOnceScheduler(() => this.doUpdateMenubar(false), 200));
            this.notifyUserOfCustomMenubarAccessibility();
        }
        registerListeners() {
            // Listen for window focus changes
            this._register(this.hostService.onDidChangeFocus(e => this.onDidChangeWindowFocus(e)));
            // Update when config changes
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
            // Listen to update service
            this.updateService.onStateChange(() => this.onUpdateStateChange());
            // Listen for changes in recently opened menu
            this._register(this.workspacesService.onDidChangeRecentlyOpened(() => { this.onDidChangeRecentlyOpened(); }));
            // Listen to keybindings change
            this._register(this.keybindingService.onDidUpdateKeybindings(() => this.updateMenubar()));
            // Update recent menu items on formatter registration
            this._register(this.labelService.onDidChangeFormatters(() => { this.onDidChangeRecentlyOpened(); }));
            // Listen for changes on the main menu
            this._register(this.mainMenu.onDidChange(() => { this.setupMainMenu(); this.doUpdateMenubar(true); }));
        }
        setupMainMenu() {
            var _a;
            this.mainMenuDisposables.clear();
            this.menus = {};
            this.topLevelTitles = {};
            const [, mainMenuActions] = this.mainMenu.getActions()[0];
            for (const mainMenuAction of mainMenuActions) {
                if (mainMenuAction instanceof actions_1.SubmenuItemAction && typeof mainMenuAction.item.title !== 'string') {
                    this.menus[mainMenuAction.item.title.original] = this.mainMenuDisposables.add(this.menuService.createMenu(mainMenuAction.item.submenu, this.contextKeyService));
                    this.topLevelTitles[mainMenuAction.item.title.original] = (_a = mainMenuAction.item.title.mnemonicTitle) !== null && _a !== void 0 ? _a : mainMenuAction.item.title.value;
                }
            }
        }
        updateMenubar() {
            this.menuUpdater.schedule();
        }
        calculateActionLabel(action) {
            let label = action.label;
            switch (action.id) {
                default:
                    break;
            }
            return label;
        }
        onUpdateStateChange() {
            this.updateMenubar();
        }
        onUpdateKeybindings() {
            this.updateMenubar();
        }
        getOpenRecentActions() {
            if (!this.recentlyOpened) {
                return [];
            }
            const { workspaces, files } = this.recentlyOpened;
            const result = [];
            if (workspaces.length > 0) {
                for (let i = 0; i < MenubarControl.MAX_MENU_RECENT_ENTRIES && i < workspaces.length; i++) {
                    result.push(this.createOpenRecentMenuAction(workspaces[i]));
                }
                result.push(new actions_2.Separator());
            }
            if (files.length > 0) {
                for (let i = 0; i < MenubarControl.MAX_MENU_RECENT_ENTRIES && i < files.length; i++) {
                    result.push(this.createOpenRecentMenuAction(files[i]));
                }
                result.push(new actions_2.Separator());
            }
            return result;
        }
        onDidChangeWindowFocus(hasFocus) {
            // When we regain focus, update the recent menu items
            if (hasFocus) {
                this.onDidChangeRecentlyOpened();
            }
        }
        onConfigurationUpdated(event) {
            if (this.keys.some(key => event.affectsConfiguration(key))) {
                this.updateMenubar();
            }
            if (event.affectsConfiguration('editor.accessibilitySupport')) {
                this.notifyUserOfCustomMenubarAccessibility();
            }
            // Since we try not update when hidden, we should
            // try to update the recently opened list on visibility changes
            if (event.affectsConfiguration('window.menuBarVisibility')) {
                this.onDidChangeRecentlyOpened();
            }
        }
        get menubarHidden() {
            return platform_1.isMacintosh && platform_1.isNative ? false : (0, window_1.getMenuBarVisibility)(this.configurationService) === 'hidden';
        }
        onDidChangeRecentlyOpened() {
            // Do not update recently opened when the menubar is hidden #108712
            if (!this.menubarHidden) {
                this.workspacesService.getRecentlyOpened().then(recentlyOpened => {
                    this.recentlyOpened = recentlyOpened;
                    this.updateMenubar();
                });
            }
        }
        createOpenRecentMenuAction(recent) {
            let label;
            let uri;
            let commandId;
            let openable;
            const remoteAuthority = recent.remoteAuthority;
            if ((0, workspaces_1.isRecentFolder)(recent)) {
                uri = recent.folderUri;
                label = recent.label || this.labelService.getWorkspaceLabel(uri, { verbose: true });
                commandId = 'openRecentFolder';
                openable = { folderUri: uri };
            }
            else if ((0, workspaces_1.isRecentWorkspace)(recent)) {
                uri = recent.workspace.configPath;
                label = recent.label || this.labelService.getWorkspaceLabel(recent.workspace, { verbose: true });
                commandId = 'openRecentWorkspace';
                openable = { workspaceUri: uri };
            }
            else {
                uri = recent.fileUri;
                label = recent.label || this.labelService.getUriLabel(uri);
                commandId = 'openRecentFile';
                openable = { fileUri: uri };
            }
            const ret = new actions_2.Action(commandId, (0, labels_1.unmnemonicLabel)(label), undefined, undefined, event => {
                const browserEvent = event;
                const openInNewWindow = event && ((!platform_1.isMacintosh && (browserEvent.ctrlKey || browserEvent.shiftKey)) || (platform_1.isMacintosh && (browserEvent.metaKey || browserEvent.altKey)));
                return this.hostService.openWindow([openable], {
                    forceNewWindow: !!openInNewWindow,
                    remoteAuthority: remoteAuthority || null // local window if remoteAuthority is not set or can not be deducted from the openable
                });
            });
            return Object.assign(ret, { uri, remoteAuthority });
        }
        notifyUserOfCustomMenubarAccessibility() {
            if (platform_1.isWeb || platform_1.isMacintosh) {
                return;
            }
            const hasBeenNotified = this.storageService.getBoolean('menubar/accessibleMenubarNotified', 0 /* StorageScope.GLOBAL */, false);
            const usingCustomMenubar = (0, window_1.getTitleBarStyle)(this.configurationService) === 'custom';
            if (hasBeenNotified || usingCustomMenubar || !this.accessibilityService.isScreenReaderOptimized()) {
                return;
            }
            const message = (0, nls_1.localize)('menubar.customTitlebarAccessibilityNotification', "Accessibility support is enabled for you. For the most accessible experience, we recommend the custom title bar style.");
            this.notificationService.prompt(notification_1.Severity.Info, message, [
                {
                    label: (0, nls_1.localize)('goToSetting', "Open Settings"),
                    run: () => {
                        return this.preferencesService.openUserSettings({ query: 'window.titleBarStyle' });
                    }
                }
            ]);
            this.storageService.store('menubar/accessibleMenubarNotified', true, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
        }
    }
    exports.MenubarControl = MenubarControl;
    MenubarControl.MAX_MENU_RECENT_ENTRIES = 10;
    let CustomMenubarControl = class CustomMenubarControl extends MenubarControl {
        constructor(menuService, workspacesService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, themeService, layoutService, telemetryService, hostService, commandService) {
            super(menuService, workspacesService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, hostService, commandService);
            this.themeService = themeService;
            this.layoutService = layoutService;
            this.telemetryService = telemetryService;
            this.alwaysOnMnemonics = false;
            this.focusInsideMenubar = false;
            this.visible = true;
            this.webNavigationMenu = this._register(this.menuService.createMenu(actions_1.MenuId.MenubarHomeMenu, this.contextKeyService));
            this.reinstallDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onVisibilityChange = this._register(new event_1.Emitter());
            this._onFocusStateChange = this._register(new event_1.Emitter());
            this.actionRunner = this._register(new actions_2.ActionRunner());
            this.actionRunner.onDidRun(e => {
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: 'menu' });
            });
            this.workspacesService.getRecentlyOpened().then((recentlyOpened) => {
                this.recentlyOpened = recentlyOpened;
            });
            this.registerListeners();
            this.registerActions();
            (0, themeService_1.registerThemingParticipant)((theme, collector) => {
                const menubarActiveWindowFgColor = theme.getColor(theme_1.TITLE_BAR_ACTIVE_FOREGROUND);
                if (menubarActiveWindowFgColor) {
                    collector.addRule(`
				.monaco-workbench .menubar > .menubar-menu-button,
				.monaco-workbench .menubar .toolbar-toggle-more {
					color: ${menubarActiveWindowFgColor};
				}
				`);
                }
                const activityBarInactiveFgColor = theme.getColor(theme_1.ACTIVITY_BAR_INACTIVE_FOREGROUND);
                if (activityBarInactiveFgColor) {
                    collector.addRule(`
				.monaco-workbench .menubar.compact > .menubar-menu-button,
				.monaco-workbench .menubar.compact .toolbar-toggle-more {
					color: ${activityBarInactiveFgColor};
				}
				`);
                }
                const activityBarFgColor = theme.getColor(theme_1.ACTIVITY_BAR_FOREGROUND);
                if (activityBarFgColor) {
                    collector.addRule(`
				.monaco-workbench .menubar.compact > .menubar-menu-button.open,
				.monaco-workbench .menubar.compact > .menubar-menu-button:focus,
				.monaco-workbench .menubar.compact:not(:focus-within) > .menubar-menu-button:hover,
				.monaco-workbench .menubar.compact  > .menubar-menu-button.open .toolbar-toggle-more,
				.monaco-workbench .menubar.compact > .menubar-menu-button:focus .toolbar-toggle-more,
				.monaco-workbench .menubar.compact:not(:focus-within) > .menubar-menu-button:hover .toolbar-toggle-more {
					color: ${activityBarFgColor};
				}
			`);
                }
                const menubarInactiveWindowFgColor = theme.getColor(theme_1.TITLE_BAR_INACTIVE_FOREGROUND);
                if (menubarInactiveWindowFgColor) {
                    collector.addRule(`
					.monaco-workbench .menubar.inactive:not(.compact) > .menubar-menu-button,
					.monaco-workbench .menubar.inactive:not(.compact) > .menubar-menu-button .toolbar-toggle-more  {
						color: ${menubarInactiveWindowFgColor};
					}
				`);
                }
                const menubarSelectedFgColor = theme.getColor(theme_1.MENUBAR_SELECTION_FOREGROUND);
                if (menubarSelectedFgColor) {
                    collector.addRule(`
					.monaco-workbench .menubar:not(.compact) > .menubar-menu-button.open,
					.monaco-workbench .menubar:not(.compact) > .menubar-menu-button:focus,
					.monaco-workbench .menubar:not(:focus-within):not(.compact) > .menubar-menu-button:hover,
					.monaco-workbench .menubar:not(.compact) > .menubar-menu-button.open .toolbar-toggle-more,
					.monaco-workbench .menubar:not(.compact) > .menubar-menu-button:focus .toolbar-toggle-more,
					.monaco-workbench .menubar:not(:focus-within):not(.compact) > .menubar-menu-button:hover .toolbar-toggle-more {
						color: ${menubarSelectedFgColor};
					}
				`);
                }
                const menubarSelectedBgColor = theme.getColor(theme_1.MENUBAR_SELECTION_BACKGROUND);
                if (menubarSelectedBgColor) {
                    collector.addRule(`
					.monaco-workbench .menubar:not(.compact) > .menubar-menu-button.open,
					.monaco-workbench .menubar:not(.compact) > .menubar-menu-button:focus,
					.monaco-workbench .menubar:not(:focus-within):not(.compact) > .menubar-menu-button:hover {
						background-color: ${menubarSelectedBgColor};
					}
				`);
                }
                const menubarSelectedBorderColor = theme.getColor(theme_1.MENUBAR_SELECTION_BORDER);
                if (menubarSelectedBorderColor) {
                    collector.addRule(`
					.monaco-workbench .menubar > .menubar-menu-button:hover {
						outline: dashed 1px;
					}

					.monaco-workbench .menubar > .menubar-menu-button.open,
					.monaco-workbench .menubar > .menubar-menu-button:focus {
						outline: solid 1px;
					}

					.monaco-workbench .menubar > .menubar-menu-button.open,
					.monaco-workbench .menubar > .menubar-menu-button:focus,
					.monaco-workbench .menubar > .menubar-menu-button:hover {
						outline-color: ${menubarSelectedBorderColor};
					}
				`);
                }
            });
        }
        doUpdateMenubar(firstTime) {
            this.setupCustomMenubar(firstTime);
        }
        registerActions() {
            const that = this;
            if (platform_1.isWeb) {
                this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                    constructor() {
                        super({
                            id: `workbench.actions.menubar.focus`,
                            title: { value: (0, nls_1.localize)('focusMenu', "Focus Application Menu"), original: 'Focus Application Menu' },
                            keybinding: {
                                primary: 68 /* KeyCode.F10 */,
                                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                                when: contextkeys_1.IsWebContext
                            },
                            f1: true
                        });
                    }
                    async run() {
                        if (that.menubar) {
                            that.menubar.toggleFocus();
                        }
                    }
                }));
            }
        }
        getUpdateAction() {
            const state = this.updateService.state;
            switch (state.type) {
                case "uninitialized" /* StateType.Uninitialized */:
                    return null;
                case "idle" /* StateType.Idle */:
                    return new actions_2.Action('update.check', (0, nls_1.localize)({ key: 'checkForUpdates', comment: ['&& denotes a mnemonic'] }, "Check for &&Updates..."), undefined, true, () => this.updateService.checkForUpdates(true));
                case "checking for updates" /* StateType.CheckingForUpdates */:
                    return new actions_2.Action('update.checking', (0, nls_1.localize)('checkingForUpdates', "Checking for Updates..."), undefined, false);
                case "available for download" /* StateType.AvailableForDownload */:
                    return new actions_2.Action('update.downloadNow', (0, nls_1.localize)({ key: 'download now', comment: ['&& denotes a mnemonic'] }, "D&&ownload Update"), undefined, true, () => this.updateService.downloadUpdate());
                case "downloading" /* StateType.Downloading */:
                    return new actions_2.Action('update.downloading', (0, nls_1.localize)('DownloadingUpdate', "Downloading Update..."), undefined, false);
                case "downloaded" /* StateType.Downloaded */:
                    return new actions_2.Action('update.install', (0, nls_1.localize)({ key: 'installUpdate...', comment: ['&& denotes a mnemonic'] }, "Install &&Update..."), undefined, true, () => this.updateService.applyUpdate());
                case "updating" /* StateType.Updating */:
                    return new actions_2.Action('update.updating', (0, nls_1.localize)('installingUpdate', "Installing Update..."), undefined, false);
                case "ready" /* StateType.Ready */:
                    return new actions_2.Action('update.restart', (0, nls_1.localize)({ key: 'restartToUpdate', comment: ['&& denotes a mnemonic'] }, "Restart to &&Update"), undefined, true, () => this.updateService.quitAndInstall());
            }
        }
        get currentMenubarVisibility() {
            return (0, window_1.getMenuBarVisibility)(this.configurationService);
        }
        get currentDisableMenuBarAltFocus() {
            let settingValue = this.configurationService.getValue('window.customMenuBarAltFocus');
            let disableMenuBarAltBehavior = false;
            if (typeof settingValue === 'boolean') {
                disableMenuBarAltBehavior = !settingValue;
            }
            return disableMenuBarAltBehavior;
        }
        insertActionsBefore(nextAction, target) {
            switch (nextAction.id) {
                case windowActions_1.OpenRecentAction.ID:
                    target.push(...this.getOpenRecentActions());
                    break;
                case 'workbench.action.showAboutDialog':
                    if (!platform_1.isMacintosh && !platform_1.isWeb) {
                        const updateAction = this.getUpdateAction();
                        if (updateAction) {
                            updateAction.label = (0, labels_1.mnemonicMenuLabel)(updateAction.label);
                            target.push(updateAction);
                            target.push(new actions_2.Separator());
                        }
                    }
                    break;
                default:
                    break;
            }
        }
        get currentEnableMenuBarMnemonics() {
            let enableMenuBarMnemonics = this.configurationService.getValue('window.enableMenuBarMnemonics');
            if (typeof enableMenuBarMnemonics !== 'boolean') {
                enableMenuBarMnemonics = true;
            }
            return enableMenuBarMnemonics && (!platform_1.isWeb || (0, browser_1.isFullscreen)());
        }
        get currentCompactMenuMode() {
            if (this.currentMenubarVisibility !== 'compact') {
                return undefined;
            }
            const currentSidebarLocation = this.configurationService.getValue('workbench.sideBar.location');
            return currentSidebarLocation === 'right' ? menu_1.Direction.Left : menu_1.Direction.Right;
        }
        onDidVisibilityChange(visible) {
            this.visible = visible;
            this.onDidChangeRecentlyOpened();
            this._onVisibilityChange.fire(visible);
        }
        setupCustomMenubar(firstTime) {
            var _a;
            // If there is no container, we cannot setup the menubar
            if (!this.container) {
                return;
            }
            if (firstTime) {
                // Reset and create new menubar
                if (this.menubar) {
                    this.reinstallDisposables.clear();
                }
                this.menubar = this.reinstallDisposables.add(new menubar_1.MenuBar(this.container, this.getMenuBarOptions()));
                this.accessibilityService.alwaysUnderlineAccessKeys().then(val => {
                    var _a;
                    this.alwaysOnMnemonics = val;
                    (_a = this.menubar) === null || _a === void 0 ? void 0 : _a.update(this.getMenuBarOptions());
                });
                this.reinstallDisposables.add(this.menubar.onFocusStateChange(focused => {
                    this._onFocusStateChange.fire(focused);
                    // When the menubar loses focus, update it to clear any pending updates
                    if (!focused) {
                        this.updateMenubar();
                        this.focusInsideMenubar = false;
                    }
                }));
                this.reinstallDisposables.add(this.menubar.onVisibilityChange(e => this.onDidVisibilityChange(e)));
                // Before we focus the menubar, stop updates to it so that focus-related context keys will work
                this.reinstallDisposables.add((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.FOCUS_IN, () => {
                    this.focusInsideMenubar = true;
                }));
                this.reinstallDisposables.add((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.FOCUS_OUT, () => {
                    this.focusInsideMenubar = false;
                }));
                this.reinstallDisposables.add((0, styler_1.attachMenuStyler)(this.menubar, this.themeService));
            }
            else {
                (_a = this.menubar) === null || _a === void 0 ? void 0 : _a.update(this.getMenuBarOptions());
            }
            // Update the menu actions
            const updateActions = (menu, target, topLevelTitle) => {
                var _a;
                target.splice(0);
                let groups = menu.getActions();
                for (let group of groups) {
                    const [, actions] = group;
                    for (let action of actions) {
                        this.insertActionsBefore(action, target);
                        // use mnemonicTitle whenever possible
                        const title = typeof action.item.title === 'string'
                            ? action.item.title
                            : (_a = action.item.title.mnemonicTitle) !== null && _a !== void 0 ? _a : action.item.title.value;
                        if (action instanceof actions_1.SubmenuItemAction) {
                            let submenu = this.menus[action.item.submenu.id];
                            if (!submenu) {
                                submenu = this._register(this.menus[action.item.submenu.id] = this.menuService.createMenu(action.item.submenu, this.contextKeyService));
                                this._register(submenu.onDidChange(() => {
                                    if (!this.focusInsideMenubar) {
                                        const actions = [];
                                        updateActions(menu, actions, topLevelTitle);
                                        if (this.menubar && this.topLevelTitles[topLevelTitle]) {
                                            this.menubar.updateMenu({ actions: actions, label: (0, labels_1.mnemonicMenuLabel)(this.topLevelTitles[topLevelTitle]) });
                                        }
                                    }
                                }, this));
                            }
                            const submenuActions = [];
                            updateActions(submenu, submenuActions, topLevelTitle);
                            if (submenuActions.length > 0) {
                                target.push(new actions_2.SubmenuAction(action.id, (0, labels_1.mnemonicMenuLabel)(title), submenuActions));
                            }
                        }
                        else {
                            const newAction = new actions_2.Action(action.id, (0, labels_1.mnemonicMenuLabel)(title), action.class, action.enabled, () => this.commandService.executeCommand(action.id));
                            newAction.tooltip = action.tooltip;
                            newAction.checked = action.checked;
                            target.push(newAction);
                        }
                    }
                    target.push(new actions_2.Separator());
                }
                // Append web navigation menu items to the file menu when not compact
                if (menu === this.menus.File && this.currentCompactMenuMode === undefined) {
                    const webActions = this.getWebNavigationActions();
                    if (webActions.length) {
                        target.push(...webActions);
                        target.push(new actions_2.Separator()); // to account for pop below
                    }
                }
                target.pop();
            };
            for (const title of Object.keys(this.topLevelTitles)) {
                const menu = this.menus[title];
                if (firstTime && menu) {
                    this.reinstallDisposables.add(menu.onDidChange(() => {
                        if (!this.focusInsideMenubar) {
                            const actions = [];
                            updateActions(menu, actions, title);
                            if (this.menubar) {
                                this.menubar.updateMenu({ actions: actions, label: (0, labels_1.mnemonicMenuLabel)(this.topLevelTitles[title]) });
                            }
                        }
                    }));
                    // For the file menu, we need to update if the web nav menu updates as well
                    if (menu === this.menus.File) {
                        this.reinstallDisposables.add(this.webNavigationMenu.onDidChange(() => {
                            if (!this.focusInsideMenubar) {
                                const actions = [];
                                updateActions(menu, actions, title);
                                if (this.menubar) {
                                    this.menubar.updateMenu({ actions: actions, label: (0, labels_1.mnemonicMenuLabel)(this.topLevelTitles[title]) });
                                }
                            }
                        }));
                    }
                }
                const actions = [];
                if (menu) {
                    updateActions(menu, actions, title);
                }
                if (this.menubar) {
                    if (!firstTime) {
                        this.menubar.updateMenu({ actions: actions, label: (0, labels_1.mnemonicMenuLabel)(this.topLevelTitles[title]) });
                    }
                    else {
                        this.menubar.push({ actions: actions, label: (0, labels_1.mnemonicMenuLabel)(this.topLevelTitles[title]) });
                    }
                }
            }
        }
        getWebNavigationActions() {
            var _a;
            if (!platform_1.isWeb) {
                return []; // only for web
            }
            const webNavigationActions = [];
            for (const groups of this.webNavigationMenu.getActions()) {
                const [, actions] = groups;
                for (const action of actions) {
                    if (action instanceof actions_1.MenuItemAction) {
                        const title = typeof action.item.title === 'string'
                            ? action.item.title
                            : (_a = action.item.title.mnemonicTitle) !== null && _a !== void 0 ? _a : action.item.title.value;
                        webNavigationActions.push(new actions_2.Action(action.id, (0, labels_1.mnemonicMenuLabel)(title), action.class, action.enabled, async (event) => {
                            this.commandService.executeCommand(action.id, event);
                        }));
                    }
                }
                webNavigationActions.push(new actions_2.Separator());
            }
            if (webNavigationActions.length) {
                webNavigationActions.pop();
            }
            return webNavigationActions;
        }
        getMenuBarOptions() {
            return {
                enableMnemonics: this.currentEnableMenuBarMnemonics,
                disableAltFocus: this.currentDisableMenuBarAltFocus,
                visibility: this.currentMenubarVisibility,
                actionRunner: this.actionRunner,
                getKeybinding: (action) => this.keybindingService.lookupKeybinding(action.id),
                alwaysOnMnemonics: this.alwaysOnMnemonics,
                compactMode: this.currentCompactMenuMode,
                getCompactMenuActions: () => {
                    if (!platform_1.isWeb) {
                        return []; // only for web
                    }
                    return this.getWebNavigationActions();
                }
            };
        }
        onDidChangeWindowFocus(hasFocus) {
            if (!this.visible) {
                return;
            }
            super.onDidChangeWindowFocus(hasFocus);
            if (this.container) {
                if (hasFocus) {
                    this.container.classList.remove('inactive');
                }
                else {
                    this.container.classList.add('inactive');
                    if (this.menubar) {
                        this.menubar.blur();
                    }
                }
            }
        }
        onUpdateStateChange() {
            if (!this.visible) {
                return;
            }
            super.onUpdateStateChange();
        }
        onDidChangeRecentlyOpened() {
            if (!this.visible) {
                return;
            }
            super.onDidChangeRecentlyOpened();
        }
        onUpdateKeybindings() {
            if (!this.visible) {
                return;
            }
            super.onUpdateKeybindings();
        }
        registerListeners() {
            super.registerListeners();
            this._register((0, dom_1.addDisposableListener)(window, dom_1.EventType.RESIZE, () => {
                if (this.menubar && !(platform_1.isIOS && canIUse_1.BrowserFeatures.pointerEvents)) {
                    this.menubar.blur();
                }
            }));
            // Mnemonics require fullscreen in web
            if (platform_1.isWeb) {
                this._register(this.layoutService.onDidChangeFullscreen(e => this.updateMenubar()));
                this._register(this.webNavigationMenu.onDidChange(() => this.updateMenubar()));
            }
        }
        get onVisibilityChange() {
            return this._onVisibilityChange.event;
        }
        get onFocusStateChange() {
            return this._onFocusStateChange.event;
        }
        getMenubarItemsDimensions() {
            if (this.menubar) {
                return new dom_1.Dimension(this.menubar.getWidth(), this.menubar.getHeight());
            }
            return new dom_1.Dimension(0, 0);
        }
        create(parent) {
            this.container = parent;
            // Build the menubar
            if (this.container) {
                this.doUpdateMenubar(true);
            }
            return this.container;
        }
        layout(dimension) {
            var _a;
            if (this.container) {
                this.container.style.height = `${dimension.height}px`;
            }
            (_a = this.menubar) === null || _a === void 0 ? void 0 : _a.update(this.getMenuBarOptions());
        }
        toggleFocus() {
            if (this.menubar) {
                this.menubar.toggleFocus();
            }
        }
    };
    CustomMenubarControl = __decorate([
        __param(0, actions_1.IMenuService),
        __param(1, workspaces_1.IWorkspacesService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, label_1.ILabelService),
        __param(6, update_1.IUpdateService),
        __param(7, storage_1.IStorageService),
        __param(8, notification_1.INotificationService),
        __param(9, preferences_1.IPreferencesService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, accessibility_1.IAccessibilityService),
        __param(12, themeService_1.IThemeService),
        __param(13, layoutService_1.IWorkbenchLayoutService),
        __param(14, telemetry_1.ITelemetryService),
        __param(15, host_1.IHostService),
        __param(16, commands_1.ICommandService)
    ], CustomMenubarControl);
    exports.CustomMenubarControl = CustomMenubarControl;
});
//# sourceMappingURL=menubarControl.js.map