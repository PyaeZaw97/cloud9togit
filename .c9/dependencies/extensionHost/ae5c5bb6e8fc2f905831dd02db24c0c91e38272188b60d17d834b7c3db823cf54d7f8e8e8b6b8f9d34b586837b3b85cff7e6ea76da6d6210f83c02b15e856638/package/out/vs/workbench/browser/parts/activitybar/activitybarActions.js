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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/platform/actions/common/actions", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/compositeBarActions", "vs/workbench/common/actions", "vs/workbench/common/theme", "vs/workbench/services/layout/browser/layoutService", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/common/platform", "vs/workbench/services/authentication/browser/authenticationService", "vs/workbench/services/authentication/common/authentication", "vs/workbench/services/environment/common/environmentService", "vs/platform/configuration/common/configuration", "vs/platform/product/common/productService", "vs/platform/window/common/window", "vs/platform/storage/common/storage", "vs/workbench/services/hover/browser/hover", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/credentials/common/credentials", "vs/css!./media/activityaction"], function (require, exports, nls_1, dom_1, keyboardEvent_1, touch_1, actions_1, lifecycle_1, actions_2, contextView_1, telemetry_1, colorRegistry_1, themeService_1, compositeBarActions_1, actions_3, theme_1, layoutService_1, contextkey_1, menuEntryActionViewItem_1, platform_1, authenticationService_1, authentication_1, environmentService_1, configuration_1, productService_1, window_1, storage_1, hover_1, keybinding_1, panecomposite_1, credentials_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PlaceHolderToggleCompositePinnedAction = exports.PlaceHolderViewContainerActivityAction = exports.GlobalActivityActionViewItem = exports.AccountsActivityActionViewItem = exports.ViewContainerActivityAction = void 0;
    let ViewContainerActivityAction = class ViewContainerActivityAction extends compositeBarActions_1.ActivityAction {
        constructor(activity, paneCompositePart, layoutService, telemetryService, configurationService) {
            super(activity);
            this.paneCompositePart = paneCompositePart;
            this.layoutService = layoutService;
            this.telemetryService = telemetryService;
            this.configurationService = configurationService;
            this.lastRun = 0;
        }
        updateActivity(activity) {
            this.activity = activity;
        }
        async run(event) {
            if (event instanceof MouseEvent && event.button === 2) {
                return; // do not run on right click
            }
            // prevent accident trigger on a doubleclick (to help nervous people)
            const now = Date.now();
            if (now > this.lastRun /* https://github.com/microsoft/vscode/issues/25830 */ && now - this.lastRun < ViewContainerActivityAction.preventDoubleClickDelay) {
                return;
            }
            this.lastRun = now;
            const sideBarVisible = this.layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
            const activeViewlet = this.paneCompositePart.getActivePaneComposite();
            const focusBehavior = this.configurationService.getValue('workbench.activityBar.iconClickBehavior');
            const focus = (event && 'preserveFocus' in event) ? !event.preserveFocus : true;
            if (sideBarVisible && (activeViewlet === null || activeViewlet === void 0 ? void 0 : activeViewlet.getId()) === this.activity.id) {
                switch (focusBehavior) {
                    case 'focus':
                        this.logAction('refocus');
                        this.paneCompositePart.openPaneComposite(this.activity.id, focus);
                        break;
                    case 'toggle':
                    default:
                        // Hide sidebar if selected viewlet already visible
                        this.logAction('hide');
                        this.layoutService.setPartHidden(true, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                        break;
                }
                return;
            }
            this.logAction('show');
            await this.paneCompositePart.openPaneComposite(this.activity.id, focus);
            return this.activate();
        }
        logAction(action) {
            this.telemetryService.publicLog2('activityBarAction', { viewletId: this.activity.id, action });
        }
    };
    ViewContainerActivityAction.preventDoubleClickDelay = 300;
    ViewContainerActivityAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, configuration_1.IConfigurationService)
    ], ViewContainerActivityAction);
    exports.ViewContainerActivityAction = ViewContainerActivityAction;
    let MenuActivityActionViewItem = class MenuActivityActionViewItem extends compositeBarActions_1.ActivityActionViewItem {
        constructor(menuId, action, contextMenuActionsProvider, colors, hoverOptions, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, environmentService, keybindingService) {
            super(action, { draggable: false, colors, icon: true, hasPopup: true, hoverOptions }, themeService, hoverService, configurationService, keybindingService);
            this.menuId = menuId;
            this.contextMenuActionsProvider = contextMenuActionsProvider;
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this.environmentService = environmentService;
        }
        render(container) {
            super.render(container);
            // Context menus are triggered on mouse down so that an item can be picked
            // and executed with releasing the mouse over it
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.MOUSE_DOWN, (e) => {
                dom_1.EventHelper.stop(e, true);
                this.showContextMenu(e);
            }));
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.KEY_UP, (e) => {
                let event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */)) {
                    dom_1.EventHelper.stop(e, true);
                    this.showContextMenu();
                }
            }));
            this._register((0, dom_1.addDisposableListener)(this.container, touch_1.EventType.Tap, (e) => {
                dom_1.EventHelper.stop(e, true);
                this.showContextMenu();
            }));
        }
        async showContextMenu(e) {
            const disposables = new lifecycle_1.DisposableStore();
            let actions;
            if ((e === null || e === void 0 ? void 0 : e.button) !== 2) {
                const menu = disposables.add(this.menuService.createMenu(this.menuId, this.contextKeyService));
                actions = await this.resolveMainMenuActions(menu, disposables);
            }
            else {
                actions = await this.resolveContextMenuActions(disposables);
            }
            const isUsingCustomMenu = platform_1.isWeb || ((0, window_1.getTitleBarStyle)(this.configurationService) !== 'native' && !platform_1.isMacintosh); // see #40262
            const position = this.configurationService.getValue('workbench.sideBar.location');
            this.contextMenuService.showContextMenu({
                getAnchor: () => isUsingCustomMenu ? this.container : e || this.container,
                anchorAlignment: isUsingCustomMenu ? (position === 'left' ? 1 /* AnchorAlignment.RIGHT */ : 0 /* AnchorAlignment.LEFT */) : undefined,
                anchorAxisAlignment: isUsingCustomMenu ? 1 /* AnchorAxisAlignment.HORIZONTAL */ : 0 /* AnchorAxisAlignment.VERTICAL */,
                getActions: () => actions,
                onHide: () => disposables.dispose()
            });
        }
        async resolveMainMenuActions(menu, disposables) {
            const actions = [];
            disposables.add((0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, undefined, { primary: [], secondary: actions }));
            return actions;
        }
        async resolveContextMenuActions(disposables) {
            return this.contextMenuActionsProvider();
        }
    };
    MenuActivityActionViewItem = __decorate([
        __param(5, themeService_1.IThemeService),
        __param(6, hover_1.IHoverService),
        __param(7, actions_2.IMenuService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, contextkey_1.IContextKeyService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, environmentService_1.IWorkbenchEnvironmentService),
        __param(12, keybinding_1.IKeybindingService)
    ], MenuActivityActionViewItem);
    let AccountsActivityActionViewItem = class AccountsActivityActionViewItem extends MenuActivityActionViewItem {
        constructor(action, contextMenuActionsProvider, colors, activityHoverOptions, themeService, hoverService, contextMenuService, menuService, contextKeyService, authenticationService, environmentService, productService, configurationService, storageService, keybindingService, credentialsService) {
            super(actions_2.MenuId.AccountsContext, action, contextMenuActionsProvider, colors, activityHoverOptions, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, environmentService, keybindingService);
            this.authenticationService = authenticationService;
            this.productService = productService;
            this.storageService = storageService;
            this.credentialsService = credentialsService;
        }
        async resolveMainMenuActions(accountsMenu, disposables) {
            await super.resolveMainMenuActions(accountsMenu, disposables);
            const otherCommands = accountsMenu.getActions();
            const providers = this.authenticationService.getProviderIds();
            const allSessions = providers.map(async (providerId) => {
                try {
                    const sessions = await this.authenticationService.getSessions(providerId);
                    const groupedSessions = {};
                    sessions.forEach(session => {
                        if (groupedSessions[session.account.label]) {
                            groupedSessions[session.account.label].push(session);
                        }
                        else {
                            groupedSessions[session.account.label] = [session];
                        }
                    });
                    return { providerId, sessions: groupedSessions };
                }
                catch (_a) {
                    return { providerId };
                }
            });
            const result = await Promise.all(allSessions);
            let menus = [];
            const authenticationSession = await (0, authenticationService_1.getCurrentAuthenticationSessionInfo)(this.credentialsService, this.productService);
            result.forEach(sessionInfo => {
                const providerDisplayName = this.authenticationService.getLabel(sessionInfo.providerId);
                if (sessionInfo.sessions) {
                    Object.keys(sessionInfo.sessions).forEach(accountName => {
                        const manageExtensionsAction = disposables.add(new actions_1.Action(`configureSessions${accountName}`, (0, nls_1.localize)('manageTrustedExtensions', "Manage Trusted Extensions"), '', true, () => {
                            return this.authenticationService.manageTrustedExtensionsForAccount(sessionInfo.providerId, accountName);
                        }));
                        const signOutAction = disposables.add(new actions_1.Action('signOut', (0, nls_1.localize)('signOut', "Sign Out"), '', true, () => {
                            return this.authenticationService.removeAccountSessions(sessionInfo.providerId, accountName, sessionInfo.sessions[accountName]);
                        }));
                        const providerSubMenuActions = [manageExtensionsAction];
                        const hasEmbedderAccountSession = sessionInfo.sessions[accountName].some(session => session.id === (authenticationSession === null || authenticationSession === void 0 ? void 0 : authenticationSession.id));
                        if (!hasEmbedderAccountSession || (authenticationSession === null || authenticationSession === void 0 ? void 0 : authenticationSession.canSignOut)) {
                            providerSubMenuActions.push(signOutAction);
                        }
                        const providerSubMenu = disposables.add(new actions_1.SubmenuAction('activitybar.submenu', `${accountName} (${providerDisplayName})`, providerSubMenuActions));
                        menus.push(providerSubMenu);
                    });
                }
                else {
                    const providerUnavailableAction = disposables.add(new actions_1.Action('providerUnavailable', (0, nls_1.localize)('authProviderUnavailable', '{0} is currently unavailable', providerDisplayName)));
                    menus.push(providerUnavailableAction);
                }
            });
            if (providers.length && !menus.length) {
                const noAccountsAvailableAction = disposables.add(new actions_1.Action('noAccountsAvailable', (0, nls_1.localize)('noAccounts', "You are not signed in to any accounts"), undefined, false));
                menus.push(noAccountsAvailableAction);
            }
            if (menus.length && otherCommands.length) {
                menus.push(disposables.add(new actions_1.Separator()));
            }
            otherCommands.forEach((group, i) => {
                const actions = group[1];
                menus = menus.concat(actions);
                if (i !== otherCommands.length - 1) {
                    menus.push(disposables.add(new actions_1.Separator()));
                }
            });
            return menus;
        }
        async resolveContextMenuActions(disposables) {
            const actions = await super.resolveContextMenuActions(disposables);
            actions.unshift(...[
                (0, actions_1.toAction)({ id: 'hideAccounts', label: (0, nls_1.localize)('hideAccounts', "Hide Accounts"), run: () => this.storageService.store(AccountsActivityActionViewItem.ACCOUNTS_VISIBILITY_PREFERENCE_KEY, false, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */) }),
                new actions_1.Separator()
            ]);
            return actions;
        }
    };
    AccountsActivityActionViewItem.ACCOUNTS_VISIBILITY_PREFERENCE_KEY = 'workbench.activity.showAccounts';
    AccountsActivityActionViewItem = __decorate([
        __param(4, themeService_1.IThemeService),
        __param(5, hover_1.IHoverService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, actions_2.IMenuService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, authentication_1.IAuthenticationService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, productService_1.IProductService),
        __param(12, configuration_1.IConfigurationService),
        __param(13, storage_1.IStorageService),
        __param(14, keybinding_1.IKeybindingService),
        __param(15, credentials_1.ICredentialsService)
    ], AccountsActivityActionViewItem);
    exports.AccountsActivityActionViewItem = AccountsActivityActionViewItem;
    let GlobalActivityActionViewItem = class GlobalActivityActionViewItem extends MenuActivityActionViewItem {
        constructor(action, contextMenuActionsProvider, colors, activityHoverOptions, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, environmentService, keybindingService) {
            super(actions_2.MenuId.GlobalActivity, action, contextMenuActionsProvider, colors, activityHoverOptions, themeService, hoverService, menuService, contextMenuService, contextKeyService, configurationService, environmentService, keybindingService);
        }
    };
    GlobalActivityActionViewItem = __decorate([
        __param(4, themeService_1.IThemeService),
        __param(5, hover_1.IHoverService),
        __param(6, actions_2.IMenuService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, contextkey_1.IContextKeyService),
        __param(9, configuration_1.IConfigurationService),
        __param(10, environmentService_1.IWorkbenchEnvironmentService),
        __param(11, keybinding_1.IKeybindingService)
    ], GlobalActivityActionViewItem);
    exports.GlobalActivityActionViewItem = GlobalActivityActionViewItem;
    class PlaceHolderViewContainerActivityAction extends ViewContainerActivityAction {
    }
    exports.PlaceHolderViewContainerActivityAction = PlaceHolderViewContainerActivityAction;
    class PlaceHolderToggleCompositePinnedAction extends compositeBarActions_1.ToggleCompositePinnedAction {
        constructor(id, compositeBar) {
            super({ id, name: id, cssClass: undefined }, compositeBar);
        }
        setActivity(activity) {
            this.label = activity.name;
        }
    }
    exports.PlaceHolderToggleCompositePinnedAction = PlaceHolderToggleCompositePinnedAction;
    class SwitchSideBarViewAction extends actions_2.Action2 {
        constructor(desc, offset) {
            super(desc);
            this.offset = offset;
        }
        async run(accessor) {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const visibleViewletIds = paneCompositeService.getVisiblePaneCompositeIds(0 /* ViewContainerLocation.Sidebar */);
            const activeViewlet = paneCompositeService.getActivePaneComposite(0 /* ViewContainerLocation.Sidebar */);
            if (!activeViewlet) {
                return;
            }
            let targetViewletId;
            for (let i = 0; i < visibleViewletIds.length; i++) {
                if (visibleViewletIds[i] === activeViewlet.getId()) {
                    targetViewletId = visibleViewletIds[(i + visibleViewletIds.length + this.offset) % visibleViewletIds.length];
                    break;
                }
            }
            await paneCompositeService.openPaneComposite(targetViewletId, 0 /* ViewContainerLocation.Sidebar */, true);
        }
    }
    (0, actions_2.registerAction2)(class PreviousSideBarViewAction extends SwitchSideBarViewAction {
        constructor() {
            super({
                id: 'workbench.action.previousSideBarView',
                title: { value: (0, nls_1.localize)('previousSideBarView', "Previous Primary Side Bar View"), original: 'Previous Primary Side Bar View' },
                category: actions_3.CATEGORIES.View,
                f1: true
            }, -1);
        }
    });
    (0, actions_2.registerAction2)(class NextSideBarViewAction extends SwitchSideBarViewAction {
        constructor() {
            super({
                id: 'workbench.action.nextSideBarView',
                title: { value: (0, nls_1.localize)('nextSideBarView', "Next Primary Side Bar View"), original: 'Next Primary Side Bar View' },
                category: actions_3.CATEGORIES.View,
                f1: true
            }, 1);
        }
    });
    (0, actions_2.registerAction2)(class FocusActivityBarAction extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.focusActivityBar',
                title: { value: (0, nls_1.localize)('focusActivityBar', "Focus Activity Bar"), original: 'Focus Activity Bar' },
                category: actions_3.CATEGORIES.View,
                f1: true
            });
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.setPartHidden(false, "workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */);
            layoutService.focusPart("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */);
        }
    });
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const activityBarForegroundColor = theme.getColor(theme_1.ACTIVITY_BAR_FOREGROUND);
        if (activityBarForegroundColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active .action-label:not(.codicon),
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:focus .action-label:not(.codicon),
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:hover .action-label:not(.codicon) {
				background-color: ${activityBarForegroundColor} !important;
			}
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active .action-label.codicon,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:focus .action-label.codicon,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:hover .action-label.codicon {
				color: ${activityBarForegroundColor} !important;
			}
		`);
        }
        const activityBarActiveBorderColor = theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BORDER);
        if (activityBarActiveBorderColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked .active-item-indicator:before {
				border-left-color: ${activityBarActiveBorderColor};
			}
		`);
        }
        const activityBarActiveFocusBorderColor = theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_FOCUS_BORDER);
        if (activityBarActiveFocusBorderColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:focus::before {
				visibility: hidden;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:focus .active-item-indicator:before {
				visibility: visible;
				border-left-color: ${activityBarActiveFocusBorderColor};
			}
		`);
        }
        const activityBarActiveBackgroundColor = theme.getColor(theme_1.ACTIVITY_BAR_ACTIVE_BACKGROUND);
        if (activityBarActiveBackgroundColor) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked .active-item-indicator {
				z-index: 0;
				background-color: ${activityBarActiveBackgroundColor};
			}
		`);
        }
        // Styling with Outline color (e.g. high contrast theme)
        const outline = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (outline) {
            collector.addRule(`
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:before {
				content: "";
				position: absolute;
				top: 8px;
				left: 8px;
				height: 32px;
				width: 32px;
				z-index: 1;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:hover:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:hover:before {
				outline: 1px solid;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:hover:before {
				outline: 1px dashed;
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:focus .active-item-indicator:before {
				border-left-color: ${outline};
			}

			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.active:hover:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item.checked:hover:before,
			.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:hover:before {
				outline-color: ${outline};
			}
		`);
        }
        // Styling without outline color
        else {
            const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
            if (focusBorderColor) {
                collector.addRule(`
				.monaco-workbench .activitybar > .content :not(.monaco-menu) > .monaco-action-bar .action-item:focus .active-item-indicator:before {
						border-left-color: ${focusBorderColor};
					}
				`);
            }
        }
    });
});
//# sourceMappingURL=activitybarActions.js.map