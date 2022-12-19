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
define(["require", "exports", "vs/base/common/actions", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/workspaces/common/workspaces", "vs/base/common/platform", "vs/platform/notification/common/notification", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/accessibility/common/accessibility", "vs/platform/configuration/common/configuration", "vs/platform/label/common/label", "vs/platform/update/common/update", "vs/workbench/browser/parts/titlebar/menubarControl", "vs/platform/storage/common/storage", "vs/platform/menubar/electron-sandbox/menubar", "vs/base/common/types", "vs/platform/native/electron-sandbox/native", "vs/workbench/services/host/browser/host", "vs/workbench/services/preferences/common/preferences", "vs/platform/commands/common/commands", "vs/workbench/browser/actions/windowActions"], function (require, exports, actions_1, actions_2, contextkey_1, workspaces_1, platform_1, notification_1, keybinding_1, environmentService_1, accessibility_1, configuration_1, label_1, update_1, menubarControl_1, storage_1, menubar_1, types_1, native_1, host_1, preferences_1, commands_1, windowActions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeMenubarControl = void 0;
    let NativeMenubarControl = class NativeMenubarControl extends menubarControl_1.MenubarControl {
        constructor(menuService, workspacesService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, menubarService, hostService, nativeHostService, commandService) {
            super(menuService, workspacesService, contextKeyService, keybindingService, configurationService, labelService, updateService, storageService, notificationService, preferencesService, environmentService, accessibilityService, hostService, commandService);
            this.menubarService = menubarService;
            this.nativeHostService = nativeHostService;
            (async () => {
                this.recentlyOpened = await this.workspacesService.getRecentlyOpened();
                this.doUpdateMenubar();
            })();
            this.registerListeners();
        }
        setupMainMenu() {
            super.setupMainMenu();
            for (const topLevelMenuName of Object.keys(this.topLevelTitles)) {
                const menu = this.menus[topLevelMenuName];
                if (menu) {
                    this.mainMenuDisposables.add(menu.onDidChange(() => this.updateMenubar()));
                }
            }
        }
        doUpdateMenubar() {
            // Since the native menubar is shared between windows (main process)
            // only allow the focused window to update the menubar
            if (!this.hostService.hasFocus) {
                return;
            }
            // Send menus to main process to be rendered by Electron
            const menubarData = { menus: {}, keybindings: {} };
            if (this.getMenubarMenus(menubarData)) {
                this.menubarService.updateMenubar(this.nativeHostService.windowId, menubarData);
            }
        }
        getMenubarMenus(menubarData) {
            if (!menubarData) {
                return false;
            }
            menubarData.keybindings = this.getAdditionalKeybindings();
            for (const topLevelMenuName of Object.keys(this.topLevelTitles)) {
                const menu = this.menus[topLevelMenuName];
                if (menu) {
                    const menubarMenu = { items: [] };
                    this.populateMenuItems(menu, menubarMenu, menubarData.keybindings);
                    if (menubarMenu.items.length === 0) {
                        return false; // Menus are incomplete
                    }
                    menubarData.menus[topLevelMenuName] = menubarMenu;
                }
            }
            return true;
        }
        populateMenuItems(menu, menuToPopulate, keybindings) {
            let groups = menu.getActions();
            for (let group of groups) {
                const [, actions] = group;
                actions.forEach(menuItem => {
                    var _a;
                    // use mnemonicTitle whenever possible
                    const title = typeof menuItem.item.title === 'string'
                        ? menuItem.item.title
                        : (_a = menuItem.item.title.mnemonicTitle) !== null && _a !== void 0 ? _a : menuItem.item.title.value;
                    if (menuItem instanceof actions_2.SubmenuItemAction) {
                        const submenu = { items: [] };
                        if (!this.menus[menuItem.item.submenu.id]) {
                            const menu = this.menus[menuItem.item.submenu.id] = this._register(this.menuService.createMenu(menuItem.item.submenu, this.contextKeyService));
                            this._register(menu.onDidChange(() => this.updateMenubar()));
                        }
                        const menuToDispose = this.menuService.createMenu(menuItem.item.submenu, this.contextKeyService);
                        this.populateMenuItems(menuToDispose, submenu, keybindings);
                        if (submenu.items.length > 0) {
                            let menubarSubmenuItem = {
                                id: menuItem.id,
                                label: title,
                                submenu: submenu
                            };
                            menuToPopulate.items.push(menubarSubmenuItem);
                        }
                        menuToDispose.dispose();
                    }
                    else {
                        if (menuItem.id === windowActions_1.OpenRecentAction.ID) {
                            const actions = this.getOpenRecentActions().map(this.transformOpenRecentAction);
                            menuToPopulate.items.push(...actions);
                        }
                        let menubarMenuItem = {
                            id: menuItem.id,
                            label: title
                        };
                        if (menuItem.checked) {
                            menubarMenuItem.checked = true;
                        }
                        if (!menuItem.enabled) {
                            menubarMenuItem.enabled = false;
                        }
                        keybindings[menuItem.id] = this.getMenubarKeybinding(menuItem.id);
                        menuToPopulate.items.push(menubarMenuItem);
                    }
                });
                menuToPopulate.items.push({ id: 'vscode.menubar.separator' });
            }
            if (menuToPopulate.items.length > 0) {
                menuToPopulate.items.pop();
            }
        }
        transformOpenRecentAction(action) {
            if (action instanceof actions_1.Separator) {
                return { id: 'vscode.menubar.separator' };
            }
            return {
                id: action.id,
                uri: action.uri,
                remoteAuthority: action.remoteAuthority,
                enabled: action.enabled,
                label: action.label
            };
        }
        getAdditionalKeybindings() {
            const keybindings = {};
            if (platform_1.isMacintosh) {
                const keybinding = this.getMenubarKeybinding('workbench.action.quit');
                if (keybinding) {
                    keybindings['workbench.action.quit'] = keybinding;
                }
            }
            return keybindings;
        }
        getMenubarKeybinding(id) {
            const binding = this.keybindingService.lookupKeybinding(id);
            if (!binding) {
                return undefined;
            }
            // first try to resolve a native accelerator
            const electronAccelerator = binding.getElectronAccelerator();
            if (electronAccelerator) {
                return { label: electronAccelerator, userSettingsLabel: (0, types_1.withNullAsUndefined)(binding.getUserSettingsLabel()) };
            }
            // we need this fallback to support keybindings that cannot show in electron menus (e.g. chords)
            const acceleratorLabel = binding.getLabel();
            if (acceleratorLabel) {
                return { label: acceleratorLabel, isNative: false, userSettingsLabel: (0, types_1.withNullAsUndefined)(binding.getUserSettingsLabel()) };
            }
            return undefined;
        }
    };
    NativeMenubarControl = __decorate([
        __param(0, actions_2.IMenuService),
        __param(1, workspaces_1.IWorkspacesService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, label_1.ILabelService),
        __param(6, update_1.IUpdateService),
        __param(7, storage_1.IStorageService),
        __param(8, notification_1.INotificationService),
        __param(9, preferences_1.IPreferencesService),
        __param(10, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(11, accessibility_1.IAccessibilityService),
        __param(12, menubar_1.IMenubarService),
        __param(13, host_1.IHostService),
        __param(14, native_1.INativeHostService),
        __param(15, commands_1.ICommandService)
    ], NativeMenubarControl);
    exports.NativeMenubarControl = NativeMenubarControl;
});
//# sourceMappingURL=menubarControl.js.map