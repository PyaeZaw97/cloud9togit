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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/platform/registry/common/platform", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/browser/parts/compositeBarActions", "vs/workbench/common/contextkeys", "vs/platform/contextkey/common/contextkey", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/common/views", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/platform/notification/common/notification", "vs/css!./media/panelpart"], function (require, exports, nls_1, actions_1, platform_1, actions_2, actions_3, layoutService_1, compositeBarActions_1, contextkeys_1, contextkey_1, codicons_1, iconRegistry_1, views_1, panecomposite_1, notification_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MoveSecondarySideBarToPanelAction = exports.MovePanelToSecondarySideBarAction = exports.NextPanelViewAction = exports.PreviousPanelViewAction = exports.SwitchPanelViewAction = exports.PlaceHolderToggleCompositePinnedAction = exports.PlaceHolderPanelActivityAction = exports.PanelActivityAction = exports.SetPanelPositionAction = exports.PositionPanelActionConfigs = exports.TogglePanelAction = void 0;
    const maximizeIcon = (0, iconRegistry_1.registerIcon)('panel-maximize', codicons_1.Codicon.chevronUp, (0, nls_1.localize)('maximizeIcon', 'Icon to maximize a panel.'));
    const restoreIcon = (0, iconRegistry_1.registerIcon)('panel-restore', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('restoreIcon', 'Icon to restore a panel.'));
    const closeIcon = (0, iconRegistry_1.registerIcon)('panel-close', codicons_1.Codicon.close, (0, nls_1.localize)('closeIcon', 'Icon to close a panel.'));
    const panelIcon = (0, iconRegistry_1.registerIcon)('panel-layout-icon', codicons_1.Codicon.layoutPanel, (0, nls_1.localize)('togglePanelIcon', 'Icon to toggle the panel.'));
    let TogglePanelAction = class TogglePanelAction extends actions_1.Action {
        constructor(id, name, layoutService) {
            super(id, name, layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */) ? 'panel expanded' : 'panel');
            this.layoutService = layoutService;
        }
        async run() {
            this.layoutService.setPartHidden(this.layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */), "workbench.parts.panel" /* Parts.PANEL_PART */);
        }
    };
    TogglePanelAction.ID = 'workbench.action.togglePanel';
    TogglePanelAction.LABEL = (0, nls_1.localize)('togglePanelVisibility', "Toggle Panel Visibility");
    TogglePanelAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], TogglePanelAction);
    exports.TogglePanelAction = TogglePanelAction;
    let FocusPanelAction = class FocusPanelAction extends actions_1.Action {
        constructor(id, label, paneCompositeService, layoutService) {
            super(id, label);
            this.paneCompositeService = paneCompositeService;
            this.layoutService = layoutService;
        }
        async run() {
            // Show panel
            if (!this.layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                this.layoutService.setPartHidden(false, "workbench.parts.panel" /* Parts.PANEL_PART */);
            }
            // Focus into active panel
            let panel = this.paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            if (panel) {
                panel.focus();
            }
        }
    };
    FocusPanelAction.ID = 'workbench.action.focusPanel';
    FocusPanelAction.LABEL = (0, nls_1.localize)('focusPanel', "Focus into Panel");
    FocusPanelAction = __decorate([
        __param(2, panecomposite_1.IPaneCompositePartService),
        __param(3, layoutService_1.IWorkbenchLayoutService)
    ], FocusPanelAction);
    const PositionPanelActionId = {
        LEFT: 'workbench.action.positionPanelLeft',
        RIGHT: 'workbench.action.positionPanelRight',
        BOTTOM: 'workbench.action.positionPanelBottom',
    };
    const AlignPanelActionId = {
        LEFT: 'workbench.action.alignPanelLeft',
        RIGHT: 'workbench.action.alignPanelRight',
        CENTER: 'workbench.action.alignPanelCenter',
        JUSTIFY: 'workbench.action.alignPanelJustify',
    };
    function createPanelActionConfig(id, title, shortLabel, value, when) {
        return {
            id,
            title,
            shortLabel,
            value,
            when,
        };
    }
    function createPositionPanelActionConfig(id, title, shortLabel, position) {
        return createPanelActionConfig(id, title, shortLabel, position, contextkeys_1.PanelPositionContext.notEqualsTo((0, layoutService_1.positionToString)(position)));
    }
    function createAlignmentPanelActionConfig(id, title, shortLabel, alignment) {
        return createPanelActionConfig(id, title, shortLabel, alignment, contextkeys_1.PanelAlignmentContext.notEqualsTo(alignment));
    }
    exports.PositionPanelActionConfigs = [
        createPositionPanelActionConfig(PositionPanelActionId.LEFT, { value: (0, nls_1.localize)('positionPanelLeft', 'Move Panel Left'), original: 'Move Panel Left' }, (0, nls_1.localize)('positionPanelLeftShort', "Left"), 0 /* Position.LEFT */),
        createPositionPanelActionConfig(PositionPanelActionId.RIGHT, { value: (0, nls_1.localize)('positionPanelRight', 'Move Panel Right'), original: 'Move Panel Right' }, (0, nls_1.localize)('positionPanelRightShort', "Right"), 1 /* Position.RIGHT */),
        createPositionPanelActionConfig(PositionPanelActionId.BOTTOM, { value: (0, nls_1.localize)('positionPanelBottom', 'Move Panel To Bottom'), original: 'Move Panel To Bottom' }, (0, nls_1.localize)('positionPanelBottomShort', "Bottom"), 2 /* Position.BOTTOM */),
    ];
    const AlignPanelActionConfigs = [
        createAlignmentPanelActionConfig(AlignPanelActionId.LEFT, { value: (0, nls_1.localize)('alignPanelLeft', 'Set Panel Alignment to Left'), original: 'Set Panel Alignment to Left' }, (0, nls_1.localize)('alignPanelLeftShort', "Left"), 'left'),
        createAlignmentPanelActionConfig(AlignPanelActionId.RIGHT, { value: (0, nls_1.localize)('alignPanelRight', 'Set Panel Alignment to Right'), original: 'Set Panel Alignment to Right' }, (0, nls_1.localize)('alignPanelRightShort', "Right"), 'right'),
        createAlignmentPanelActionConfig(AlignPanelActionId.CENTER, { value: (0, nls_1.localize)('alignPanelCenter', 'Set Panel Alignment to Center'), original: 'Set Panel Alignment to Center' }, (0, nls_1.localize)('alignPanelCenterShort', "Center"), 'center'),
        createAlignmentPanelActionConfig(AlignPanelActionId.JUSTIFY, { value: (0, nls_1.localize)('alignPanelJustify', 'Set Panel Alignment to Justify'), original: 'Set Panel Alignment to Justify' }, (0, nls_1.localize)('alignPanelJustifyShort', "Justify"), 'justify'),
    ];
    const positionByActionId = new Map(exports.PositionPanelActionConfigs.map(config => [config.id, config.value]));
    let SetPanelPositionAction = class SetPanelPositionAction extends actions_1.Action {
        constructor(id, label, layoutService) {
            super(id, label);
            this.layoutService = layoutService;
        }
        async run() {
            const position = positionByActionId.get(this.id);
            this.layoutService.setPanelPosition(position === undefined ? 2 /* Position.BOTTOM */ : position);
        }
    };
    SetPanelPositionAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], SetPanelPositionAction);
    exports.SetPanelPositionAction = SetPanelPositionAction;
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        submenu: actions_2.MenuId.MenubarPanelPositionMenu,
        title: (0, nls_1.localize)('positionPanel', "Panel Position"),
        group: '3_workbench_layout_move',
        order: 4
    });
    exports.PositionPanelActionConfigs.forEach(positionPanelAction => {
        const { id, title, shortLabel, value, when } = positionPanelAction;
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id,
                    title,
                    category: actions_3.CATEGORIES.View,
                    f1: true
                });
            }
            run(accessor) {
                const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
                layoutService.setPanelPosition(value === undefined ? 2 /* Position.BOTTOM */ : value);
            }
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarPanelPositionMenu, {
            command: {
                id,
                title: shortLabel,
                toggled: when.negate()
            },
            order: 5
        });
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarAppearanceMenu, {
        submenu: actions_2.MenuId.MenubarPanelAlignmentMenu,
        title: (0, nls_1.localize)('alignPanel', "Align Panel"),
        group: '3_workbench_layout_move',
        order: 5
    });
    AlignPanelActionConfigs.forEach(alignPanelAction => {
        const { id, title, shortLabel, value, when } = alignPanelAction;
        (0, actions_2.registerAction2)(class extends actions_2.Action2 {
            constructor() {
                super({
                    id,
                    title: title,
                    category: actions_3.CATEGORIES.View,
                    toggled: when.negate(),
                    f1: true
                });
            }
            run(accessor) {
                const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
                layoutService.setPanelAlignment(value === undefined ? 'center' : value);
            }
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarPanelAlignmentMenu, {
            command: {
                id,
                title: shortLabel,
                toggled: when.negate()
            },
            order: 5
        });
    });
    let PanelActivityAction = class PanelActivityAction extends compositeBarActions_1.ActivityAction {
        constructor(activity, viewContainerLocation, paneCompositeService) {
            super(activity);
            this.viewContainerLocation = viewContainerLocation;
            this.paneCompositeService = paneCompositeService;
        }
        async run() {
            await this.paneCompositeService.openPaneComposite(this.activity.id, this.viewContainerLocation, true);
            this.activate();
        }
        setActivity(activity) {
            this.activity = activity;
        }
    };
    PanelActivityAction = __decorate([
        __param(2, panecomposite_1.IPaneCompositePartService)
    ], PanelActivityAction);
    exports.PanelActivityAction = PanelActivityAction;
    let PlaceHolderPanelActivityAction = class PlaceHolderPanelActivityAction extends PanelActivityAction {
        constructor(id, viewContainerLocation, paneCompositeService) {
            super({ id, name: id }, viewContainerLocation, paneCompositeService);
        }
    };
    PlaceHolderPanelActivityAction = __decorate([
        __param(2, panecomposite_1.IPaneCompositePartService)
    ], PlaceHolderPanelActivityAction);
    exports.PlaceHolderPanelActivityAction = PlaceHolderPanelActivityAction;
    class PlaceHolderToggleCompositePinnedAction extends compositeBarActions_1.ToggleCompositePinnedAction {
        constructor(id, compositeBar) {
            super({ id, name: id, cssClass: undefined }, compositeBar);
        }
        setActivity(activity) {
            this.label = activity.name;
        }
    }
    exports.PlaceHolderToggleCompositePinnedAction = PlaceHolderToggleCompositePinnedAction;
    let SwitchPanelViewAction = class SwitchPanelViewAction extends actions_1.Action {
        constructor(id, name, paneCompositeService) {
            super(id, name);
            this.paneCompositeService = paneCompositeService;
        }
        async run(offset) {
            const pinnedPanels = this.paneCompositeService.getPinnedPaneCompositeIds(1 /* ViewContainerLocation.Panel */);
            const activePanel = this.paneCompositeService.getActivePaneComposite(1 /* ViewContainerLocation.Panel */);
            if (!activePanel) {
                return;
            }
            let targetPanelId;
            for (let i = 0; i < pinnedPanels.length; i++) {
                if (pinnedPanels[i] === activePanel.getId()) {
                    targetPanelId = pinnedPanels[(i + pinnedPanels.length + offset) % pinnedPanels.length];
                    break;
                }
            }
            if (typeof targetPanelId === 'string') {
                await this.paneCompositeService.openPaneComposite(targetPanelId, 1 /* ViewContainerLocation.Panel */, true);
            }
        }
    };
    SwitchPanelViewAction = __decorate([
        __param(2, panecomposite_1.IPaneCompositePartService)
    ], SwitchPanelViewAction);
    exports.SwitchPanelViewAction = SwitchPanelViewAction;
    let PreviousPanelViewAction = class PreviousPanelViewAction extends SwitchPanelViewAction {
        constructor(id, name, paneCompositeService) {
            super(id, name, paneCompositeService);
        }
        run() {
            return super.run(-1);
        }
    };
    PreviousPanelViewAction.ID = 'workbench.action.previousPanelView';
    PreviousPanelViewAction.LABEL = (0, nls_1.localize)('previousPanelView', 'Previous Panel View');
    PreviousPanelViewAction = __decorate([
        __param(2, panecomposite_1.IPaneCompositePartService)
    ], PreviousPanelViewAction);
    exports.PreviousPanelViewAction = PreviousPanelViewAction;
    let NextPanelViewAction = class NextPanelViewAction extends SwitchPanelViewAction {
        constructor(id, name, paneCompositeService) {
            super(id, name, paneCompositeService);
        }
        run() {
            return super.run(1);
        }
    };
    NextPanelViewAction.ID = 'workbench.action.nextPanelView';
    NextPanelViewAction.LABEL = (0, nls_1.localize)('nextPanelView', 'Next Panel View');
    NextPanelViewAction = __decorate([
        __param(2, panecomposite_1.IPaneCompositePartService)
    ], NextPanelViewAction);
    exports.NextPanelViewAction = NextPanelViewAction;
    const actionRegistry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(TogglePanelAction, { primary: 2048 /* KeyMod.CtrlCmd */ | 40 /* KeyCode.KeyJ */ }), 'View: Toggle Panel Visibility', actions_3.CATEGORIES.View.value);
    actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(FocusPanelAction), 'View: Focus into Panel', actions_3.CATEGORIES.View.value);
    actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(PreviousPanelViewAction), 'View: Previous Panel View', actions_3.CATEGORIES.View.value);
    actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(NextPanelViewAction), 'View: Next Panel View', actions_3.CATEGORIES.View.value);
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleMaximizedPanel',
                title: { value: (0, nls_1.localize)('toggleMaximizedPanel', "Toggle Maximized Panel"), original: 'Toggle Maximized Panel' },
                tooltip: (0, nls_1.localize)('maximizePanel', "Maximize Panel Size"),
                category: actions_3.CATEGORIES.View,
                f1: true,
                icon: maximizeIcon,
                // the workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
                precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.PanelAlignmentContext.isEqualTo('center'), contextkeys_1.PanelPositionContext.notEqualsTo('bottom')),
                toggled: { condition: contextkeys_1.PanelMaximizedContext, icon: restoreIcon, tooltip: (0, nls_1.localize)('minimizePanel', "Restore Panel Size") },
                menu: [{
                        id: actions_2.MenuId.PanelTitle,
                        group: 'navigation',
                        order: 1,
                        // the workbench grid currently prevents us from supporting panel maximization with non-center panel alignment
                        when: contextkey_1.ContextKeyExpr.or(contextkeys_1.PanelAlignmentContext.isEqualTo('center'), contextkeys_1.PanelPositionContext.notEqualsTo('bottom'))
                    }]
            });
        }
        run(accessor) {
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const notificationService = accessor.get(notification_1.INotificationService);
            if (layoutService.getPanelAlignment() !== 'center' && layoutService.getPanelPosition() === 2 /* Position.BOTTOM */) {
                notificationService.warn((0, nls_1.localize)('panelMaxNotSupported', "Maximizing the panel is only supported when it is center aligned."));
                return;
            }
            if (!layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */)) {
                layoutService.setPartHidden(false, "workbench.parts.panel" /* Parts.PANEL_PART */);
                // If the panel is not already maximized, maximize it
                if (!layoutService.isPanelMaximized()) {
                    layoutService.toggleMaximizedPanel();
                }
            }
            else {
                layoutService.toggleMaximizedPanel();
            }
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.closePanel',
                title: { value: (0, nls_1.localize)('closePanel', "Close Panel"), original: 'Close Panel' },
                category: actions_3.CATEGORIES.View,
                icon: closeIcon,
                menu: [{
                        id: actions_2.MenuId.CommandPalette,
                        when: contextkeys_1.PanelVisibleContext,
                    }, {
                        id: actions_2.MenuId.PanelTitle,
                        group: 'navigation',
                        order: 2
                    }]
            });
        }
        run(accessor) {
            accessor.get(layoutService_1.IWorkbenchLayoutService).setPartHidden(true, "workbench.parts.panel" /* Parts.PANEL_PART */);
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.closeAuxiliaryBar',
                title: { value: (0, nls_1.localize)('closeSecondarySideBar', "Close Secondary Side Bar"), original: 'Close Secondary Side Bar' },
                category: actions_3.CATEGORIES.View,
                icon: closeIcon,
                menu: [{
                        id: actions_2.MenuId.CommandPalette,
                        when: contextkeys_1.AuxiliaryBarVisibleContext,
                    }, {
                        id: actions_2.MenuId.AuxiliaryBarTitle,
                        group: 'navigation',
                        order: 2
                    }]
            });
        }
        run(accessor) {
            accessor.get(layoutService_1.IWorkbenchLayoutService).setPartHidden(true, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
        }
    });
    actions_2.MenuRegistry.appendMenuItems([
        {
            id: actions_2.MenuId.MenubarAppearanceMenu,
            item: {
                group: '2_workbench_layout',
                command: {
                    id: TogglePanelAction.ID,
                    title: (0, nls_1.localize)({ key: 'miShowPanel', comment: ['&& denotes a mnemonic'] }, "Show &&Panel"),
                    toggled: contextkeys_1.PanelVisibleContext
                },
                order: 5
            }
        }, {
            id: actions_2.MenuId.LayoutControlMenuSubmenu,
            item: {
                group: '0_workbench_layout',
                command: {
                    id: TogglePanelAction.ID,
                    title: (0, nls_1.localize)('miShowPanelNoMnemonic', "Show Panel"),
                    toggled: contextkeys_1.PanelVisibleContext
                },
                order: 4
            }
        }, {
            id: actions_2.MenuId.LayoutControlMenu,
            item: {
                group: '0_workbench_toggles',
                command: {
                    id: TogglePanelAction.ID,
                    title: (0, nls_1.localize)('togglePanel', "Toggle Panel"),
                    icon: panelIcon,
                    toggled: contextkeys_1.PanelVisibleContext
                },
                when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'toggles'), contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both')),
                order: 1
            }
        }, {
            id: actions_2.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: TogglePanelAction.ID,
                    title: { value: (0, nls_1.localize)('hidePanel', "Hide Panel"), original: 'Hide Panel' },
                },
                when: contextkey_1.ContextKeyExpr.and(contextkeys_1.PanelVisibleContext, contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(1 /* ViewContainerLocation.Panel */))),
                order: 2
            }
        }
    ]);
    class MoveViewsBetweenPanelsAction extends actions_2.Action2 {
        constructor(source, destination, desc) {
            super(desc);
            this.source = source;
            this.destination = destination;
        }
        run(accessor, ...args) {
            const viewDescriptorService = accessor.get(views_1.IViewDescriptorService);
            const layoutService = accessor.get(layoutService_1.IWorkbenchLayoutService);
            const viewsService = accessor.get(views_1.IViewsService);
            const srcContainers = viewDescriptorService.getViewContainersByLocation(this.source);
            const destContainers = viewDescriptorService.getViewContainersByLocation(this.destination);
            if (srcContainers.length) {
                const activeViewContainer = viewsService.getVisibleViewContainer(this.source);
                srcContainers.forEach(viewContainer => viewDescriptorService.moveViewContainerToLocation(viewContainer, this.destination));
                layoutService.setPartHidden(false, this.destination === 1 /* ViewContainerLocation.Panel */ ? "workbench.parts.panel" /* Parts.PANEL_PART */ : "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
                if (activeViewContainer && destContainers.length === 0) {
                    viewsService.openViewContainer(activeViewContainer.id, true);
                }
            }
        }
    }
    // --- Move Panel Views To Secondary Side Bar
    class MovePanelToSidePanelAction extends MoveViewsBetweenPanelsAction {
        constructor() {
            super(1 /* ViewContainerLocation.Panel */, 2 /* ViewContainerLocation.AuxiliaryBar */, {
                id: MovePanelToSidePanelAction.ID,
                title: {
                    value: (0, nls_1.localize)('movePanelToSecondarySideBar', "Move Panel Views To Secondary Side Bar"),
                    original: 'Move Panel Views To Secondary Side Bar'
                },
                category: actions_3.CATEGORIES.View,
                f1: false
            });
        }
    }
    MovePanelToSidePanelAction.ID = 'workbench.action.movePanelToSidePanel';
    class MovePanelToSecondarySideBarAction extends MoveViewsBetweenPanelsAction {
        constructor() {
            super(1 /* ViewContainerLocation.Panel */, 2 /* ViewContainerLocation.AuxiliaryBar */, {
                id: MovePanelToSecondarySideBarAction.ID,
                title: {
                    value: (0, nls_1.localize)('movePanelToSecondarySideBar', "Move Panel Views To Secondary Side Bar"),
                    original: 'Move Panel Views To Secondary Side Bar'
                },
                category: actions_3.CATEGORIES.View,
                f1: true
            });
        }
    }
    exports.MovePanelToSecondarySideBarAction = MovePanelToSecondarySideBarAction;
    MovePanelToSecondarySideBarAction.ID = 'workbench.action.movePanelToSecondarySideBar';
    (0, actions_2.registerAction2)(MovePanelToSidePanelAction);
    (0, actions_2.registerAction2)(MovePanelToSecondarySideBarAction);
    // --- Move Secondary Side Bar Views To Panel
    class MoveSidePanelToPanelAction extends MoveViewsBetweenPanelsAction {
        constructor() {
            super(2 /* ViewContainerLocation.AuxiliaryBar */, 1 /* ViewContainerLocation.Panel */, {
                id: MoveSidePanelToPanelAction.ID,
                title: {
                    value: (0, nls_1.localize)('moveSidePanelToPanel', "Move Secondary Side Bar Views To Panel"),
                    original: 'Move Secondary Side Bar Views To Panel'
                },
                category: actions_3.CATEGORIES.View,
                f1: false
            });
        }
    }
    MoveSidePanelToPanelAction.ID = 'workbench.action.moveSidePanelToPanel';
    class MoveSecondarySideBarToPanelAction extends MoveViewsBetweenPanelsAction {
        constructor() {
            super(2 /* ViewContainerLocation.AuxiliaryBar */, 1 /* ViewContainerLocation.Panel */, {
                id: MoveSecondarySideBarToPanelAction.ID,
                title: {
                    value: (0, nls_1.localize)('moveSidePanelToPanel', "Move Secondary Side Bar Views To Panel"),
                    original: 'Move Secondary Side Bar Views To Panel'
                },
                category: actions_3.CATEGORIES.View,
                f1: true
            });
        }
    }
    exports.MoveSecondarySideBarToPanelAction = MoveSecondarySideBarToPanelAction;
    MoveSecondarySideBarToPanelAction.ID = 'workbench.action.moveSecondarySideBarToPanel';
    (0, actions_2.registerAction2)(MoveSidePanelToPanelAction);
    (0, actions_2.registerAction2)(MoveSecondarySideBarToPanelAction);
});
//# sourceMappingURL=panelActions.js.map