/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/severity", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/platform/configuration/common/configuration", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/instantiation", "vs/base/common/keyCodes", "vs/base/common/platform", "vs/platform/contextkey/common/contextkeys", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/quickinput/common/quickInput", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/browser/parts/auxiliarybar/auxiliaryBarActions", "vs/workbench/browser/parts/panel/panelActions", "vs/platform/commands/common/commands", "vs/workbench/common/contextkeys", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/platform/theme/common/iconRegistry"], function (require, exports, nls_1, severity_1, actions_1, actions_2, configuration_1, layoutService_1, instantiation_1, keyCodes_1, platform_1, contextkeys_1, keybindingsRegistry_1, contextkey_1, views_1, quickInput_1, dialogs_1, panecomposite_1, auxiliaryBarActions_1, panelActions_1, commands_1, contextkeys_2, codicons_1, lifecycle_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleStatusbarVisibilityAction = exports.ToggleSidebarPositionAction = exports.ToggleActivityBarVisibilityAction = void 0;
    // Register Icons
    const menubarIcon = (0, iconRegistry_1.registerIcon)('menuBar', codicons_1.Codicon.layoutMenubar, (0, nls_1.localize)('menuBarIcon', "Represents the menu bar"));
    const activityBarLeftIcon = (0, iconRegistry_1.registerIcon)('activity-bar-left', codicons_1.Codicon.layoutActivitybarLeft, (0, nls_1.localize)('activityBarLeft', "Represents the activity bar in the left position"));
    const activityBarRightIcon = (0, iconRegistry_1.registerIcon)('activity-bar-right', codicons_1.Codicon.layoutActivitybarRight, (0, nls_1.localize)('activityBarRight', "Represents the activity bar in the right position"));
    const panelLeftIcon = (0, iconRegistry_1.registerIcon)('panel-left', codicons_1.Codicon.layoutSidebarLeft, (0, nls_1.localize)('panelLeft', "Represents a side bar in the left position"));
    const panelRightIcon = (0, iconRegistry_1.registerIcon)('panel-right', codicons_1.Codicon.layoutSidebarRight, (0, nls_1.localize)('panelRight', "Represents side bar in the right position"));
    const panelIcon = (0, iconRegistry_1.registerIcon)('panel-bottom', codicons_1.Codicon.layoutPanel, (0, nls_1.localize)('panelBottom', "Represents the bottom panel"));
    const statusBarIcon = (0, iconRegistry_1.registerIcon)('statusBar', codicons_1.Codicon.layoutStatusbar, (0, nls_1.localize)('statusBarIcon', "Represents the status bar"));
    const panelAlignmentLeftIcon = (0, iconRegistry_1.registerIcon)('panel-align-left', codicons_1.Codicon.layoutPanelLeft, (0, nls_1.localize)('panelBottomLeft', "Represents the bottom panel alignment set to the left"));
    const panelAlignmentRightIcon = (0, iconRegistry_1.registerIcon)('panel-align-right', codicons_1.Codicon.layoutPanelRight, (0, nls_1.localize)('panelBottomRight', "Represents the bottom panel alignment set to the right"));
    const panelAlignmentCenterIcon = (0, iconRegistry_1.registerIcon)('panel-align-center', codicons_1.Codicon.layoutPanelCenter, (0, nls_1.localize)('panelBottomCenter', "Represents the bottom panel alignment set to the center"));
    const panelAlignmentJustifyIcon = (0, iconRegistry_1.registerIcon)('panel-align-justify', codicons_1.Codicon.layoutPanelJustify, (0, nls_1.localize)('panelBottomJustify', "Represents the bottom panel alignment set to justified"));
    const fullscreenIcon = (0, iconRegistry_1.registerIcon)('fullscreen', codicons_1.Codicon.screenFull, (0, nls_1.localize)('fullScreenIcon', "Represents full screen"));
    const centerLayoutIcon = (0, iconRegistry_1.registerIcon)('centerLayoutIcon', codicons_1.Codicon.layoutCentered, (0, nls_1.localize)('centerLayoutIcon', "Represents centered layout mode"));
    const zenModeIcon = (0, iconRegistry_1.registerIcon)('zenMode', codicons_1.Codicon.target, (0, nls_1.localize)('zenModeIcon', "Represents zen mode"));
    // --- Close Side Bar
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.closeSidebar',
                title: { value: (0, nls_1.localize)('closeSidebar', "Close Primary Side Bar"), original: 'Close Primary Side Bar' },
                category: actions_2.CATEGORIES.View,
                f1: true
            });
        }
        run(accessor) {
            accessor.get(layoutService_1.IWorkbenchLayoutService).setPartHidden(true, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
        }
    });
    // --- Toggle Activity Bar
    class ToggleActivityBarVisibilityAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleActivityBarVisibilityAction.ID,
                title: {
                    value: (0, nls_1.localize)('toggleActivityBar', "Toggle Activity Bar Visibility"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miShowActivityBar', comment: ['&& denotes a mnemonic'] }, "Show &&Activity Bar"),
                    original: 'Toggle Activity Bar Visibility'
                },
                category: actions_2.CATEGORIES.View,
                f1: true,
                toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.activityBar.visible', true),
                menu: [{
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        group: '2_workbench_layout',
                        order: 4
                    }]
            });
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const visibility = layoutService.isVisible("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */);
            const newVisibilityValue = !visibility;
            configurationService.updateValue(ToggleActivityBarVisibilityAction.activityBarVisibleKey, newVisibilityValue);
        }
    }
    exports.ToggleActivityBarVisibilityAction = ToggleActivityBarVisibilityAction;
    ToggleActivityBarVisibilityAction.ID = 'workbench.action.toggleActivityBarVisibility';
    ToggleActivityBarVisibilityAction.activityBarVisibleKey = 'workbench.activityBar.visible';
    (0, actions_1.registerAction2)(ToggleActivityBarVisibilityAction);
    // --- Toggle Centered Layout
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleCenteredLayout',
                title: {
                    value: (0, nls_1.localize)('toggleCenteredLayout', "Toggle Centered Layout"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miToggleCenteredLayout', comment: ['&& denotes a mnemonic'] }, "&&Centered Layout"),
                    original: 'Toggle Centered Layout'
                },
                category: actions_2.CATEGORIES.View,
                f1: true,
                toggled: contextkeys_2.IsCenteredLayoutContext,
                menu: [{
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        group: '1_toggle_view',
                        order: 3
                    }]
            });
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.centerEditorLayout(!layoutService.isEditorLayoutCentered());
        }
    });
    // --- Set Sidebar Position
    const sidebarPositionConfigurationKey = 'workbench.sideBar.location';
    class MoveSidebarPositionAction extends actions_1.Action2 {
        constructor(id, title, position) {
            super({
                id,
                title,
                f1: false
            });
            this.position = position;
        }
        async run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const position = layoutService.getSideBarPosition();
            if (position !== this.position) {
                return configurationService.updateValue(sidebarPositionConfigurationKey, (0, layoutService_1.positionToString)(this.position));
            }
        }
    }
    class MoveSidebarRightAction extends MoveSidebarPositionAction {
        constructor() {
            super(MoveSidebarRightAction.ID, {
                value: (0, nls_1.localize)('moveSidebarRight', "Move Primary Side Bar Right"),
                original: 'Move Primary Side Bar Right'
            }, 1 /* Position.RIGHT */);
        }
    }
    MoveSidebarRightAction.ID = 'workbench.action.moveSideBarRight';
    class MoveSidebarLeftAction extends MoveSidebarPositionAction {
        constructor() {
            super(MoveSidebarLeftAction.ID, {
                value: (0, nls_1.localize)('moveSidebarLeft', "Move Primary Side Bar Left"),
                original: 'Move Primary Side Bar Left'
            }, 0 /* Position.LEFT */);
        }
    }
    MoveSidebarLeftAction.ID = 'workbench.action.moveSideBarLeft';
    (0, actions_1.registerAction2)(MoveSidebarRightAction);
    (0, actions_1.registerAction2)(MoveSidebarLeftAction);
    // --- Toggle Sidebar Position
    class ToggleSidebarPositionAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleSidebarPositionAction.ID,
                title: { value: (0, nls_1.localize)('toggleSidebarPosition', "Toggle Primary Side Bar Position"), original: 'Toggle Primary Side Bar Position' },
                category: actions_2.CATEGORIES.View,
                f1: true
            });
        }
        static getLabel(layoutService) {
            return layoutService.getSideBarPosition() === 0 /* Position.LEFT */ ? (0, nls_1.localize)('moveSidebarRight', "Move Primary Side Bar Right") : (0, nls_1.localize)('moveSidebarLeft', "Move Primary Side Bar Left");
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const position = layoutService.getSideBarPosition();
            const newPositionValue = (position === 0 /* Position.LEFT */) ? 'right' : 'left';
            return configurationService.updateValue(sidebarPositionConfigurationKey, newPositionValue);
        }
    }
    exports.ToggleSidebarPositionAction = ToggleSidebarPositionAction;
    ToggleSidebarPositionAction.ID = 'workbench.action.toggleSidebarPosition';
    ToggleSidebarPositionAction.LABEL = (0, nls_1.localize)('toggleSidebarPosition', "Toggle Primary Side Bar Position");
    (0, actions_1.registerAction2)(ToggleSidebarPositionAction);
    const configureLayoutIcon = (0, iconRegistry_1.registerIcon)('configure-layout-icon', codicons_1.Codicon.layout, (0, nls_1.localize)('cofigureLayoutIcon', 'Icon represents workbench layout configuration.'));
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.LayoutControlMenu, {
        submenu: actions_1.MenuId.LayoutControlMenuSubmenu,
        title: (0, nls_1.localize)('configureLayout', "Configure Layout"),
        icon: configureLayoutIcon,
        group: '1_workbench_layout',
        when: contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'menu')
    });
    actions_1.MenuRegistry.appendMenuItems([{
            id: actions_1.MenuId.ViewContainerTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarPositionAction.ID,
                    title: (0, nls_1.localize)('move side bar right', "Move Primary Side Bar Right")
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.notEquals('config.workbench.sideBar.location', 'right'), contextkey_1.ContextKeyExpr.equals('viewContainerLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */))),
                order: 1
            }
        }, {
            id: actions_1.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarPositionAction.ID,
                    title: (0, nls_1.localize)('move sidebar right', "Move Primary Side Bar Right")
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.notEquals('config.workbench.sideBar.location', 'right'), contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */))),
                order: 1
            }
        }, {
            id: actions_1.MenuId.ViewContainerTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarPositionAction.ID,
                    title: (0, nls_1.localize)('move sidebar left', "Move Primary Side Bar Left")
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right'), contextkey_1.ContextKeyExpr.equals('viewContainerLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */))),
                order: 1
            }
        }, {
            id: actions_1.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarPositionAction.ID,
                    title: (0, nls_1.localize)('move sidebar left', "Move Primary Side Bar Left")
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right'), contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */))),
                order: 1
            }
        }, {
            id: actions_1.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarPositionAction.ID,
                    title: (0, nls_1.localize)('move second sidebar left', "Move Secondary Side Bar Left")
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.notEquals('config.workbench.sideBar.location', 'right'), contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(2 /* ViewContainerLocation.AuxiliaryBar */))),
                order: 1
            }
        }, {
            id: actions_1.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarPositionAction.ID,
                    title: (0, nls_1.localize)('move second sidebar right', "Move Secondary Side Bar Right")
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right'), contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(2 /* ViewContainerLocation.AuxiliaryBar */))),
                order: 1
            }
        }]);
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarAppearanceMenu, {
        group: '3_workbench_layout_move',
        command: {
            id: ToggleSidebarPositionAction.ID,
            title: (0, nls_1.localize)({ key: 'miMoveSidebarRight', comment: ['&& denotes a mnemonic'] }, "&&Move Primary Side Bar Right")
        },
        when: contextkey_1.ContextKeyExpr.notEquals('config.workbench.sideBar.location', 'right'),
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarAppearanceMenu, {
        group: '3_workbench_layout_move',
        command: {
            id: ToggleSidebarPositionAction.ID,
            title: (0, nls_1.localize)({ key: 'miMoveSidebarLeft', comment: ['&& denotes a mnemonic'] }, "&&Move Primary Side Bar Left")
        },
        when: contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right'),
        order: 2
    });
    // --- Toggle Editor Visibility
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleEditorVisibility',
                title: {
                    value: (0, nls_1.localize)('toggleEditor', "Toggle Editor Area Visibility"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miShowEditorArea', comment: ['&& denotes a mnemonic'] }, "Show &&Editor Area"),
                    original: 'Toggle Editor Area Visibility'
                },
                category: actions_2.CATEGORIES.View,
                f1: true,
                toggled: contextkeys_2.EditorAreaVisibleContext,
                // the workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
                precondition: contextkey_1.ContextKeyExpr.or(contextkeys_2.PanelAlignmentContext.isEqualTo('center'), contextkeys_2.PanelPositionContext.notEqualsTo('bottom'))
            });
        }
        run(accessor) {
            accessor.get(layoutService_1.IWorkbenchLayoutService).toggleMaximizedPanel();
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarViewMenu, {
        group: '2_appearance',
        title: (0, nls_1.localize)({ key: 'miAppearance', comment: ['&& denotes a mnemonic'] }, "&&Appearance"),
        submenu: actions_1.MenuId.MenubarAppearanceMenu,
        order: 1
    });
    // Toggle Sidebar Visibility
    class ToggleSidebarVisibilityAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleSidebarVisibilityAction.ID,
                title: { value: (0, nls_1.localize)('toggleSidebar', "Toggle Primary Side Bar Visibility"), original: 'Toggle Primary Side Bar Visibility' },
                category: actions_2.CATEGORIES.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 32 /* KeyCode.KeyB */
                }
            });
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            layoutService.setPartHidden(layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */), "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
        }
    }
    ToggleSidebarVisibilityAction.ID = 'workbench.action.toggleSidebarVisibility';
    (0, actions_1.registerAction2)(ToggleSidebarVisibilityAction);
    actions_1.MenuRegistry.appendMenuItems([
        {
            id: actions_1.MenuId.ViewContainerTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarVisibilityAction.ID,
                    title: (0, nls_1.localize)('compositePart.hideSideBarLabel', "Hide Primary Side Bar"),
                },
                when: contextkey_1.ContextKeyExpr.and(contextkeys_2.SideBarVisibleContext, contextkey_1.ContextKeyExpr.equals('viewContainerLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */))),
                order: 2
            }
        }, {
            id: actions_1.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleSidebarVisibilityAction.ID,
                    title: (0, nls_1.localize)('compositePart.hideSideBarLabel', "Hide Primary Side Bar"),
                },
                when: contextkey_1.ContextKeyExpr.and(contextkeys_2.SideBarVisibleContext, contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(0 /* ViewContainerLocation.Sidebar */))),
                order: 2
            }
        }, {
            id: actions_1.MenuId.MenubarAppearanceMenu,
            item: {
                group: '2_workbench_layout',
                command: {
                    id: ToggleSidebarVisibilityAction.ID,
                    title: (0, nls_1.localize)({ key: 'miShowSidebar', comment: ['&& denotes a mnemonic'] }, "Show &&Primary Side Bar"),
                    toggled: contextkeys_2.SideBarVisibleContext
                },
                order: 1
            }
        }, {
            id: actions_1.MenuId.LayoutControlMenuSubmenu,
            item: {
                group: '0_workbench_layout',
                command: {
                    id: ToggleSidebarVisibilityAction.ID,
                    title: (0, nls_1.localize)('miShowSidebarNoMnnemonic', "Show Primary Side Bar"),
                    toggled: contextkeys_2.SideBarVisibleContext
                },
                order: 0
            }
        }, {
            id: actions_1.MenuId.LayoutControlMenu,
            item: {
                group: '0_workbench_toggles',
                command: {
                    id: ToggleSidebarVisibilityAction.ID,
                    title: (0, nls_1.localize)('toggleSideBar', "Toggle Primary Side Bar"),
                    icon: panelLeftIcon,
                    toggled: contextkeys_2.SideBarVisibleContext
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'toggles'), contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both')), contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'left')),
                order: 0
            }
        }, {
            id: actions_1.MenuId.LayoutControlMenu,
            item: {
                group: '0_workbench_toggles',
                command: {
                    id: ToggleSidebarVisibilityAction.ID,
                    title: (0, nls_1.localize)('toggleSideBar', "Toggle Primary Side Bar"),
                    icon: panelRightIcon,
                    toggled: contextkeys_2.SideBarVisibleContext
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'toggles'), contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both')), contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right')),
                order: 2
            }
        }
    ]);
    // --- Toggle Statusbar Visibility
    class ToggleStatusbarVisibilityAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleStatusbarVisibilityAction.ID,
                title: {
                    value: (0, nls_1.localize)('toggleStatusbar', "Toggle Status Bar Visibility"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miShowStatusbar', comment: ['&& denotes a mnemonic'] }, "Show S&&tatus Bar"),
                    original: 'Toggle Status Bar Visibility'
                },
                category: actions_2.CATEGORIES.View,
                f1: true,
                toggled: contextkey_1.ContextKeyExpr.equals('config.workbench.statusBar.visible', true),
                menu: [{
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        group: '2_workbench_layout',
                        order: 3
                    }]
            });
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const visibility = layoutService.isVisible("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */);
            const newVisibilityValue = !visibility;
            return configurationService.updateValue(ToggleStatusbarVisibilityAction.statusbarVisibleKey, newVisibilityValue);
        }
    }
    exports.ToggleStatusbarVisibilityAction = ToggleStatusbarVisibilityAction;
    ToggleStatusbarVisibilityAction.ID = 'workbench.action.toggleStatusbarVisibility';
    ToggleStatusbarVisibilityAction.statusbarVisibleKey = 'workbench.statusBar.visible';
    (0, actions_1.registerAction2)(ToggleStatusbarVisibilityAction);
    // --- Toggle Tabs Visibility
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleTabsVisibility',
                title: {
                    value: (0, nls_1.localize)('toggleTabs', "Toggle Tab Visibility"),
                    original: 'Toggle Tab Visibility'
                },
                category: actions_2.CATEGORIES.View,
                f1: true
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const visibility = configurationService.getValue('workbench.editor.showTabs');
            const newVisibilityValue = !visibility;
            return configurationService.updateValue('workbench.editor.showTabs', newVisibilityValue);
        }
    });
    // --- Toggle Zen Mode
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleZenMode',
                title: {
                    value: (0, nls_1.localize)('toggleZenMode', "Toggle Zen Mode"),
                    mnemonicTitle: (0, nls_1.localize)('miToggleZenMode', "Zen Mode"),
                    original: 'Toggle Zen Mode'
                },
                category: actions_2.CATEGORIES.View,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 56 /* KeyCode.KeyZ */)
                },
                toggled: contextkeys_2.InEditorZenModeContext,
                menu: [{
                        id: actions_1.MenuId.MenubarAppearanceMenu,
                        group: '1_toggle_view',
                        order: 2
                    }]
            });
        }
        run(accessor) {
            return accessor.get(layoutService_1.IWorkbenchLayoutService).toggleZenMode();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.exitZenMode',
        weight: 100 /* KeybindingWeight.EditorContrib */ - 1000,
        handler(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            if (contextkeys_2.InEditorZenModeContext.getValue(contextKeyService)) {
                layoutService.toggleZenMode();
            }
        },
        when: contextkeys_2.InEditorZenModeContext,
        primary: (0, keyCodes_1.KeyChord)(9 /* KeyCode.Escape */, 9 /* KeyCode.Escape */)
    });
    // --- Toggle Menu Bar
    if (platform_1.isWindows || platform_1.isLinux || platform_1.isWeb) {
        (0, actions_1.registerAction2)(class ToggleMenubarAction extends actions_1.Action2 {
            constructor() {
                super({
                    id: 'workbench.action.toggleMenuBar',
                    title: {
                        value: (0, nls_1.localize)('toggleMenuBar', "Toggle Menu Bar"),
                        mnemonicTitle: (0, nls_1.localize)({ key: 'miShowMenuBar', comment: ['&& denotes a mnemonic'] }, "Show Menu &&Bar"),
                        original: 'Toggle Menu Bar'
                    },
                    category: actions_2.CATEGORIES.View,
                    f1: true,
                    toggled: contextkey_1.ContextKeyExpr.and(contextkeys_1.IsMacNativeContext.toNegated(), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'hidden'), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'toggle'), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'compact')),
                    menu: [{
                            id: actions_1.MenuId.MenubarAppearanceMenu,
                            group: '2_workbench_layout',
                            order: 0
                        }]
                });
            }
            run(accessor) {
                return accessor.get(layoutService_1.IWorkbenchLayoutService).toggleMenuBar();
            }
        });
    }
    // --- Reset View Locations
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.resetViewLocations',
                title: {
                    value: (0, nls_1.localize)('resetViewLocations', "Reset View Locations"),
                    original: 'Reset View Locations'
                },
                category: actions_2.CATEGORIES.View,
                f1: true
            });
        }
        run(accessor) {
            return accessor.get(views_1.IViewDescriptorService).reset();
        }
    });
    // --- Move View
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.moveView',
                title: {
                    value: (0, nls_1.localize)('moveView', "Move View"),
                    original: 'Move View'
                },
                category: actions_2.CATEGORIES.View,
                f1: true
            });
        }
        async run(accessor) {
            var _a;
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const paneCompositePartService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const focusedViewId = contextkeys_2.FocusedViewContext.getValue(contextKeyService);
            let viewId;
            if (focusedViewId && ((_a = viewDescriptorService.getViewDescriptorById(focusedViewId)) === null || _a === void 0 ? void 0 : _a.canMoveView)) {
                viewId = focusedViewId;
            }
            try {
                viewId = await this.getView(quickInputService, viewDescriptorService, paneCompositePartService, viewId);
                if (!viewId) {
                    return;
                }
                const moveFocusedViewAction = new MoveFocusedViewAction();
                instantiationService.invokeFunction(accessor => moveFocusedViewAction.run(accessor, viewId));
            }
            catch (_b) { }
        }
        getViewItems(viewDescriptorService, paneCompositePartService) {
            const results = [];
            const viewlets = paneCompositePartService.getVisiblePaneCompositeIds(0 /* ViewContainerLocation.Sidebar */);
            viewlets.forEach(viewletId => {
                const container = viewDescriptorService.getViewContainerById(viewletId);
                const containerModel = viewDescriptorService.getViewContainerModel(container);
                let hasAddedView = false;
                containerModel.visibleViewDescriptors.forEach(viewDescriptor => {
                    if (viewDescriptor.canMoveView) {
                        if (!hasAddedView) {
                            results.push({
                                type: 'separator',
                                label: (0, nls_1.localize)('sidebarContainer', "Side Bar / {0}", containerModel.title)
                            });
                            hasAddedView = true;
                        }
                        results.push({
                            id: viewDescriptor.id,
                            label: viewDescriptor.name
                        });
                    }
                });
            });
            const panels = paneCompositePartService.getPinnedPaneCompositeIds(1 /* ViewContainerLocation.Panel */);
            panels.forEach(panel => {
                const container = viewDescriptorService.getViewContainerById(panel);
                const containerModel = viewDescriptorService.getViewContainerModel(container);
                let hasAddedView = false;
                containerModel.visibleViewDescriptors.forEach(viewDescriptor => {
                    if (viewDescriptor.canMoveView) {
                        if (!hasAddedView) {
                            results.push({
                                type: 'separator',
                                label: (0, nls_1.localize)('panelContainer', "Panel / {0}", containerModel.title)
                            });
                            hasAddedView = true;
                        }
                        results.push({
                            id: viewDescriptor.id,
                            label: viewDescriptor.name
                        });
                    }
                });
            });
            const sidePanels = paneCompositePartService.getPinnedPaneCompositeIds(2 /* ViewContainerLocation.AuxiliaryBar */);
            sidePanels.forEach(panel => {
                const container = viewDescriptorService.getViewContainerById(panel);
                const containerModel = viewDescriptorService.getViewContainerModel(container);
                let hasAddedView = false;
                containerModel.visibleViewDescriptors.forEach(viewDescriptor => {
                    if (viewDescriptor.canMoveView) {
                        if (!hasAddedView) {
                            results.push({
                                type: 'separator',
                                label: (0, nls_1.localize)('secondarySideBarContainer', "Secondary Side Bar / {0}", containerModel.title)
                            });
                            hasAddedView = true;
                        }
                        results.push({
                            id: viewDescriptor.id,
                            label: viewDescriptor.name
                        });
                    }
                });
            });
            return results;
        }
        async getView(quickInputService, viewDescriptorService, paneCompositePartService, viewId) {
            const quickPick = quickInputService.createQuickPick();
            quickPick.placeholder = (0, nls_1.localize)('moveFocusedView.selectView', "Select a View to Move");
            quickPick.items = this.getViewItems(viewDescriptorService, paneCompositePartService);
            quickPick.selectedItems = quickPick.items.filter(item => item.id === viewId);
            return new Promise((resolve, reject) => {
                quickPick.onDidAccept(() => {
                    const viewId = quickPick.selectedItems[0];
                    if (viewId.id) {
                        resolve(viewId.id);
                    }
                    else {
                        reject();
                    }
                    quickPick.hide();
                });
                quickPick.onDidHide(() => reject());
                quickPick.show();
            });
        }
    });
    // --- Move Focused View
    class MoveFocusedViewAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.moveFocusedView',
                title: {
                    value: (0, nls_1.localize)('moveFocusedView', "Move Focused View"),
                    original: 'Move Focused View'
                },
                category: actions_2.CATEGORIES.View,
                precondition: contextkeys_2.FocusedViewContext.notEqualsTo(''),
                f1: true
            });
        }
        run(accessor, viewId) {
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const viewsService = accessor.get(views_1.IViewsService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const paneCompositePartService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const focusedViewId = viewId || contextkeys_2.FocusedViewContext.getValue(contextKeyService);
            if (focusedViewId === undefined || focusedViewId.trim() === '') {
                dialogService.show(severity_1.default.Error, (0, nls_1.localize)('moveFocusedView.error.noFocusedView', "There is no view currently focused."));
                return;
            }
            const viewDescriptor = viewDescriptorService.getViewDescriptorById(focusedViewId);
            if (!viewDescriptor || !viewDescriptor.canMoveView) {
                dialogService.show(severity_1.default.Error, (0, nls_1.localize)('moveFocusedView.error.nonMovableView', "The currently focused view is not movable."));
                return;
            }
            const quickPick = quickInputService.createQuickPick();
            quickPick.placeholder = (0, nls_1.localize)('moveFocusedView.selectDestination', "Select a Destination for the View");
            quickPick.title = (0, nls_1.localize)({ key: 'moveFocusedView.title', comment: ['{0} indicates the title of the view the user has selected to move.'] }, "View: Move {0}", viewDescriptor.name);
            const items = [];
            const currentContainer = viewDescriptorService.getViewContainerByViewId(focusedViewId);
            const currentLocation = viewDescriptorService.getViewLocationById(focusedViewId);
            const isViewSolo = viewDescriptorService.getViewContainerModel(currentContainer).allViewDescriptors.length === 1;
            if (!(isViewSolo && currentLocation === 1 /* ViewContainerLocation.Panel */)) {
                items.push({
                    id: '_.panel.newcontainer',
                    label: (0, nls_1.localize)({ key: 'moveFocusedView.newContainerInPanel', comment: ['Creates a new top-level tab in the panel.'] }, "New Panel Entry"),
                });
            }
            if (!(isViewSolo && currentLocation === 0 /* ViewContainerLocation.Sidebar */)) {
                items.push({
                    id: '_.sidebar.newcontainer',
                    label: (0, nls_1.localize)('moveFocusedView.newContainerInSidebar', "New Side Bar Entry")
                });
            }
            if (!(isViewSolo && currentLocation === 2 /* ViewContainerLocation.AuxiliaryBar */)) {
                items.push({
                    id: '_.auxiliarybar.newcontainer',
                    label: (0, nls_1.localize)('moveFocusedView.newContainerInSidePanel', "New Secondary Side Bar Entry")
                });
            }
            items.push({
                type: 'separator',
                label: (0, nls_1.localize)('sidebar', "Side Bar")
            });
            const pinnedViewlets = paneCompositePartService.getVisiblePaneCompositeIds(0 /* ViewContainerLocation.Sidebar */);
            items.push(...pinnedViewlets
                .filter(viewletId => {
                if (viewletId === viewDescriptorService.getViewContainerByViewId(focusedViewId).id) {
                    return false;
                }
                return !viewDescriptorService.getViewContainerById(viewletId).rejectAddedViews;
            })
                .map(viewletId => {
                return {
                    id: viewletId,
                    label: viewDescriptorService.getViewContainerModel(viewDescriptorService.getViewContainerById(viewletId)).title
                };
            }));
            items.push({
                type: 'separator',
                label: (0, nls_1.localize)('panel', "Panel")
            });
            const pinnedPanels = paneCompositePartService.getPinnedPaneCompositeIds(1 /* ViewContainerLocation.Panel */);
            items.push(...pinnedPanels
                .filter(panel => {
                if (panel === viewDescriptorService.getViewContainerByViewId(focusedViewId).id) {
                    return false;
                }
                return !viewDescriptorService.getViewContainerById(panel).rejectAddedViews;
            })
                .map(panel => {
                return {
                    id: panel,
                    label: viewDescriptorService.getViewContainerModel(viewDescriptorService.getViewContainerById(panel)).title
                };
            }));
            items.push({
                type: 'separator',
                label: (0, nls_1.localize)('secondarySideBar', "Secondary Side Bar")
            });
            const pinnedAuxPanels = paneCompositePartService.getPinnedPaneCompositeIds(2 /* ViewContainerLocation.AuxiliaryBar */);
            items.push(...pinnedAuxPanels
                .filter(panel => {
                if (panel === viewDescriptorService.getViewContainerByViewId(focusedViewId).id) {
                    return false;
                }
                return !viewDescriptorService.getViewContainerById(panel).rejectAddedViews;
            })
                .map(panel => {
                return {
                    id: panel,
                    label: viewDescriptorService.getViewContainerModel(viewDescriptorService.getViewContainerById(panel)).title
                };
            }));
            quickPick.items = items;
            quickPick.onDidAccept(() => {
                const destination = quickPick.selectedItems[0];
                if (destination.id === '_.panel.newcontainer') {
                    viewDescriptorService.moveViewToLocation(viewDescriptor, 1 /* ViewContainerLocation.Panel */);
                    viewsService.openView(focusedViewId, true);
                }
                else if (destination.id === '_.sidebar.newcontainer') {
                    viewDescriptorService.moveViewToLocation(viewDescriptor, 0 /* ViewContainerLocation.Sidebar */);
                    viewsService.openView(focusedViewId, true);
                }
                else if (destination.id === '_.auxiliarybar.newcontainer') {
                    viewDescriptorService.moveViewToLocation(viewDescriptor, 2 /* ViewContainerLocation.AuxiliaryBar */);
                    viewsService.openView(focusedViewId, true);
                }
                else if (destination.id) {
                    viewDescriptorService.moveViewsToContainer([viewDescriptor], viewDescriptorService.getViewContainerById(destination.id));
                    viewsService.openView(focusedViewId, true);
                }
                quickPick.hide();
            });
            quickPick.show();
        }
    }
    (0, actions_1.registerAction2)(MoveFocusedViewAction);
    // --- Reset Focused View Location
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.resetFocusedViewLocation',
                title: {
                    value: (0, nls_1.localize)('resetFocusedViewLocation', "Reset Focused View Location"),
                    original: 'Reset Focused View Location'
                },
                category: actions_2.CATEGORIES.View,
                f1: true,
                precondition: contextkeys_2.FocusedViewContext.notEqualsTo('')
            });
        }
        run(accessor) {
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const viewsService = accessor.get(views_1.IViewsService);
            const focusedViewId = contextkeys_2.FocusedViewContext.getValue(contextKeyService);
            let viewDescriptor = null;
            if (focusedViewId !== undefined && focusedViewId.trim() !== '') {
                viewDescriptor = viewDescriptorService.getViewDescriptorById(focusedViewId);
            }
            if (!viewDescriptor) {
                dialogService.show(severity_1.default.Error, (0, nls_1.localize)('resetFocusedView.error.noFocusedView', "There is no view currently focused."));
                return;
            }
            const defaultContainer = viewDescriptorService.getDefaultContainerById(viewDescriptor.id);
            if (!defaultContainer || defaultContainer === viewDescriptorService.getViewContainerByViewId(viewDescriptor.id)) {
                return;
            }
            viewDescriptorService.moveViewsToContainer([viewDescriptor], defaultContainer);
            viewsService.openView(viewDescriptor.id, true);
        }
    });
    // --- Resize View
    class BaseResizeViewAction extends actions_1.Action2 {
        resizePart(widthChange, heightChange, layoutService, partToResize) {
            let part;
            if (partToResize === undefined) {
                const isEditorFocus = layoutService.hasFocus("workbench.parts.editor" /* Parts.EDITOR_PART */);
                const isSidebarFocus = layoutService.hasFocus("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                const isPanelFocus = layoutService.hasFocus("workbench.parts.panel" /* Parts.PANEL_PART */);
                const isAuxiliaryBarFocus = layoutService.hasFocus("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
                if (isSidebarFocus) {
                    part = "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */;
                }
                else if (isPanelFocus) {
                    part = "workbench.parts.panel" /* Parts.PANEL_PART */;
                }
                else if (isEditorFocus) {
                    part = "workbench.parts.editor" /* Parts.EDITOR_PART */;
                }
                else if (isAuxiliaryBarFocus) {
                    part = "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */;
                }
            }
            else {
                part = partToResize;
            }
            if (part) {
                layoutService.resizePart(part, widthChange, heightChange);
            }
        }
    }
    BaseResizeViewAction.RESIZE_INCREMENT = 6.5; // This is a media-size percentage
    class IncreaseViewSizeAction extends BaseResizeViewAction {
        constructor() {
            super({
                id: 'workbench.action.increaseViewSize',
                title: { value: (0, nls_1.localize)('increaseViewSize', "Increase Current View Size"), original: 'Increase Current View Size' },
                f1: true
            });
        }
        run(accessor) {
            this.resizePart(BaseResizeViewAction.RESIZE_INCREMENT, BaseResizeViewAction.RESIZE_INCREMENT, accessor.get(layoutService_1.IWorkbenchLayoutService));
        }
    }
    class IncreaseViewWidthAction extends BaseResizeViewAction {
        constructor() {
            super({
                id: 'workbench.action.increaseViewWidth',
                title: { value: (0, nls_1.localize)('increaseEditorWidth', "Increase Editor Width"), original: 'Increase Editor Width' },
                f1: true
            });
        }
        run(accessor) {
            this.resizePart(BaseResizeViewAction.RESIZE_INCREMENT, 0, accessor.get(layoutService_1.IWorkbenchLayoutService), "workbench.parts.editor" /* Parts.EDITOR_PART */);
        }
    }
    class IncreaseViewHeightAction extends BaseResizeViewAction {
        constructor() {
            super({
                id: 'workbench.action.increaseViewHeight',
                title: { value: (0, nls_1.localize)('increaseEditorHeight', "Increase Editor Height"), original: 'Increase Editor Height' },
                f1: true
            });
        }
        run(accessor) {
            this.resizePart(0, BaseResizeViewAction.RESIZE_INCREMENT, accessor.get(layoutService_1.IWorkbenchLayoutService), "workbench.parts.editor" /* Parts.EDITOR_PART */);
        }
    }
    class DecreaseViewSizeAction extends BaseResizeViewAction {
        constructor() {
            super({
                id: 'workbench.action.decreaseViewSize',
                title: { value: (0, nls_1.localize)('decreaseViewSize', "Decrease Current View Size"), original: 'Decrease Current View Size' },
                f1: true
            });
        }
        run(accessor) {
            this.resizePart(-BaseResizeViewAction.RESIZE_INCREMENT, -BaseResizeViewAction.RESIZE_INCREMENT, accessor.get(layoutService_1.IWorkbenchLayoutService));
        }
    }
    class DecreaseViewWidthAction extends BaseResizeViewAction {
        constructor() {
            super({
                id: 'workbench.action.decreaseViewWidth',
                title: { value: (0, nls_1.localize)('decreaseEditorWidth', "Decrease Editor Width"), original: 'Decrease Editor Width' },
                f1: true
            });
        }
        run(accessor) {
            this.resizePart(-BaseResizeViewAction.RESIZE_INCREMENT, 0, accessor.get(layoutService_1.IWorkbenchLayoutService), "workbench.parts.editor" /* Parts.EDITOR_PART */);
        }
    }
    class DecreaseViewHeightAction extends BaseResizeViewAction {
        constructor() {
            super({
                id: 'workbench.action.decreaseViewHeight',
                title: { value: (0, nls_1.localize)('decreaseEditorHeight', "Decrease Editor Height"), original: 'Decrease Editor Height' },
                f1: true
            });
        }
        run(accessor) {
            this.resizePart(0, -BaseResizeViewAction.RESIZE_INCREMENT, accessor.get(layoutService_1.IWorkbenchLayoutService), "workbench.parts.editor" /* Parts.EDITOR_PART */);
        }
    }
    (0, actions_1.registerAction2)(IncreaseViewSizeAction);
    (0, actions_1.registerAction2)(IncreaseViewWidthAction);
    (0, actions_1.registerAction2)(IncreaseViewHeightAction);
    (0, actions_1.registerAction2)(DecreaseViewSizeAction);
    (0, actions_1.registerAction2)(DecreaseViewWidthAction);
    (0, actions_1.registerAction2)(DecreaseViewHeightAction);
    function isContextualLayoutVisualIcon(icon) {
        return icon.iconA !== undefined;
    }
    const CreateToggleLayoutItem = (id, active, label, visualIcon) => {
        return {
            id,
            active,
            label,
            visualIcon,
            activeIcon: codicons_1.Codicon.eye,
            inactiveIcon: codicons_1.Codicon.eyeClosed,
            activeAriaLabel: (0, nls_1.localize)('visible', "Visible"),
            inactiveAriaLabel: (0, nls_1.localize)('hidden', "Hidden"),
            useButtons: true,
        };
    };
    const CreateOptionLayoutItem = (id, active, label, visualIcon) => {
        return {
            id,
            active,
            label,
            visualIcon,
            activeIcon: codicons_1.Codicon.check,
            activeAriaLabel: (0, nls_1.localize)('active', "Active"),
            useButtons: false
        };
    };
    const MenuBarToggledContext = contextkey_1.ContextKeyExpr.and(contextkeys_1.IsMacNativeContext.toNegated(), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'hidden'), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'toggle'), contextkey_1.ContextKeyExpr.notEquals('config.window.menuBarVisibility', 'compact'));
    const ToggleVisibilityActions = [];
    if (!platform_1.isMacintosh || !platform_1.isNative) {
        ToggleVisibilityActions.push(CreateToggleLayoutItem('workbench.action.toggleMenuBar', MenuBarToggledContext, (0, nls_1.localize)('menuBar', "Menu Bar"), menubarIcon));
    }
    ToggleVisibilityActions.push(...[
        CreateToggleLayoutItem(ToggleActivityBarVisibilityAction.ID, contextkey_1.ContextKeyExpr.equals('config.workbench.activityBar.visible', true), (0, nls_1.localize)('activityBar', "Activity Bar"), { whenA: contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'left'), iconA: activityBarLeftIcon, iconB: activityBarRightIcon }),
        CreateToggleLayoutItem(ToggleSidebarVisibilityAction.ID, contextkeys_2.SideBarVisibleContext, (0, nls_1.localize)('sideBar', "Primary Side Bar"), { whenA: contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'left'), iconA: panelLeftIcon, iconB: panelRightIcon }),
        CreateToggleLayoutItem(auxiliaryBarActions_1.ToggleAuxiliaryBarAction.ID, contextkeys_2.AuxiliaryBarVisibleContext, (0, nls_1.localize)('secondarySideBar', "Secondary Side Bar"), { whenA: contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'left'), iconA: panelRightIcon, iconB: panelLeftIcon }),
        CreateToggleLayoutItem(panelActions_1.TogglePanelAction.ID, contextkeys_2.PanelVisibleContext, (0, nls_1.localize)('panel', "Panel"), panelIcon),
        CreateToggleLayoutItem(ToggleStatusbarVisibilityAction.ID, contextkey_1.ContextKeyExpr.equals('config.workbench.statusBar.visible', true), (0, nls_1.localize)('statusBar', "Status Bar"), statusBarIcon),
    ]);
    const MoveSideBarActions = [
        CreateOptionLayoutItem(MoveSidebarLeftAction.ID, contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'left'), (0, nls_1.localize)('leftSideBar', "Left"), panelLeftIcon),
        CreateOptionLayoutItem(MoveSidebarRightAction.ID, contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right'), (0, nls_1.localize)('rightSideBar', "Right"), panelRightIcon),
    ];
    const AlignPanelActions = [
        CreateOptionLayoutItem('workbench.action.alignPanelLeft', contextkeys_2.PanelAlignmentContext.isEqualTo('left'), (0, nls_1.localize)('leftPanel', "Left"), panelAlignmentLeftIcon),
        CreateOptionLayoutItem('workbench.action.alignPanelRight', contextkeys_2.PanelAlignmentContext.isEqualTo('right'), (0, nls_1.localize)('rightPanel', "Right"), panelAlignmentRightIcon),
        CreateOptionLayoutItem('workbench.action.alignPanelCenter', contextkeys_2.PanelAlignmentContext.isEqualTo('center'), (0, nls_1.localize)('centerPanel', "Center"), panelAlignmentCenterIcon),
        CreateOptionLayoutItem('workbench.action.alignPanelJustify', contextkeys_2.PanelAlignmentContext.isEqualTo('justify'), (0, nls_1.localize)('justifyPanel', "Justify"), panelAlignmentJustifyIcon),
    ];
    const MiscLayoutOptions = [
        CreateOptionLayoutItem('workbench.action.toggleFullScreen', contextkeys_2.IsFullscreenContext, (0, nls_1.localize)('fullscreen', "Full Screen"), fullscreenIcon),
        CreateOptionLayoutItem('workbench.action.toggleZenMode', contextkeys_2.InEditorZenModeContext, (0, nls_1.localize)('zenMode', "Zen Mode"), zenModeIcon),
        CreateOptionLayoutItem('workbench.action.toggleCenteredLayout', contextkeys_2.IsCenteredLayoutContext, (0, nls_1.localize)('centeredLayout', "Centered Layout"), centerLayoutIcon),
    ];
    const LayoutContextKeySet = new Set();
    for (const { active } of [...ToggleVisibilityActions, ...MoveSideBarActions, ...AlignPanelActions, ...MiscLayoutOptions]) {
        for (const key of active.keys()) {
            LayoutContextKeySet.add(key);
        }
    }
    (0, actions_1.registerAction2)(class CustomizeLayoutAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.customizeLayout',
                title: (0, nls_1.localize)('customizeLayout', "Customize Layout..."),
                f1: true,
                icon: configureLayoutIcon,
                menu: [
                    {
                        id: actions_1.MenuId.LayoutControlMenuSubmenu,
                        group: 'z_end',
                    },
                    {
                        id: actions_1.MenuId.LayoutControlMenu,
                        when: contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both'),
                        group: 'z_end'
                    }
                ]
            });
        }
        getItems(contextKeyService) {
            const toQuickPickItem = (item) => {
                var _a;
                const toggled = item.active.evaluate(contextKeyService.getContext(null));
                let label = item.useButtons ?
                    item.label :
                    item.label + (toggled && item.activeIcon ? ` $(${item.activeIcon.id})` : (!toggled && item.inactiveIcon ? ` $(${item.inactiveIcon.id})` : ''));
                const ariaLabel = item.label + (toggled && item.activeAriaLabel ? ` (${item.activeAriaLabel})` : (!toggled && item.inactiveAriaLabel ? ` (${item.inactiveAriaLabel})` : ''));
                if (item.visualIcon) {
                    let icon = item.visualIcon;
                    if (isContextualLayoutVisualIcon(icon)) {
                        const useIconA = icon.whenA.evaluate(contextKeyService.getContext(null));
                        icon = useIconA ? icon.iconA : icon.iconB;
                    }
                    label = `$(${icon.id}) ${label}`;
                }
                return {
                    type: 'item',
                    id: item.id,
                    label,
                    ariaLabel,
                    buttons: !item.useButtons ? undefined : [
                        {
                            alwaysVisible: false,
                            tooltip: ariaLabel,
                            iconClass: toggled ? item.activeIcon.classNames : (_a = item.inactiveIcon) === null || _a === void 0 ? void 0 : _a.classNames
                        }
                    ]
                };
            };
            return [
                {
                    type: 'separator',
                    label: (0, nls_1.localize)('toggleVisibility', "Visibility")
                },
                ...ToggleVisibilityActions.map(toQuickPickItem),
                {
                    type: 'separator',
                    label: (0, nls_1.localize)('sideBarPosition', "Primary Side Bar Position")
                },
                ...MoveSideBarActions.map(toQuickPickItem),
                {
                    type: 'separator',
                    label: (0, nls_1.localize)('panelAlignment', "Panel Alignment")
                },
                ...AlignPanelActions.map(toQuickPickItem),
                {
                    type: 'separator',
                    label: (0, nls_1.localize)('layoutModes', "Modes"),
                },
                ...MiscLayoutOptions.map(toQuickPickItem),
            ];
        }
        run(accessor) {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const commandService = accessor.get(commands_1.ICommandService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const quickPick = quickInputService.createQuickPick();
            quickPick.items = this.getItems(contextKeyService);
            quickPick.ignoreFocusOut = true;
            quickPick.hideInput = true;
            quickPick.title = (0, nls_1.localize)('customizeLayoutQuickPickTitle', "Customize Layout");
            quickPick.buttons = [
                {
                    alwaysVisible: true,
                    iconClass: codicons_1.Codicon.close.classNames,
                    tooltip: (0, nls_1.localize)('close', "Close")
                }
            ];
            const disposables = new lifecycle_1.DisposableStore();
            let selectedItem = undefined;
            disposables.add(contextKeyService.onDidChangeContext(changeEvent => {
                if (changeEvent.affectsSome(LayoutContextKeySet)) {
                    quickPick.items = this.getItems(contextKeyService);
                    if (selectedItem) {
                        quickPick.activeItems = quickPick.items.filter(item => item.id === (selectedItem === null || selectedItem === void 0 ? void 0 : selectedItem.id));
                    }
                    setTimeout(() => quickInputService.focus(), 0);
                }
            }));
            quickPick.onDidAccept(event => {
                if (quickPick.selectedItems.length) {
                    selectedItem = quickPick.selectedItems[0];
                    commandService.executeCommand(selectedItem.id);
                }
            });
            quickPick.onDidTriggerItemButton(event => {
                if (event.item) {
                    selectedItem = event.item;
                    commandService.executeCommand(selectedItem.id);
                }
            });
            // Only one button, close
            quickPick.onDidTriggerButton(() => {
                quickPick.hide();
            });
            quickPick.onDispose(() => disposables.dispose());
            quickPick.show();
        }
    });
});
//# sourceMappingURL=layoutActions.js.map