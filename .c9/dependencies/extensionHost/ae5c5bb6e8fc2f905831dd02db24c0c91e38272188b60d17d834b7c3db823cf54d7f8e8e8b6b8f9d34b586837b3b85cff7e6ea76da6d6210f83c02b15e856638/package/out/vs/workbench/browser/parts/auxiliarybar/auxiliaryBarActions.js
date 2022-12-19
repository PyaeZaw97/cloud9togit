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
define(["require", "exports", "vs/base/common/actions", "vs/base/common/codicons", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/platform/registry/common/platform", "vs/platform/theme/common/iconRegistry", "vs/workbench/common/actions", "vs/workbench/common/contextkeys", "vs/workbench/common/views", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, actions_1, codicons_1, nls_1, actions_2, contextkey_1, platform_1, iconRegistry_1, actions_3, contextkeys_1, views_1, layoutService_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleAuxiliaryBarAction = void 0;
    const auxiliaryBarRightIcon = (0, iconRegistry_1.registerIcon)('auxiliarybar-right-layout-icon', codicons_1.Codicon.layoutSidebarRight, (0, nls_1.localize)('toggleAuxiliaryIconRight', 'Icon to toggle the auxiliary bar in its right position.'));
    const auxiliaryBarLeftIcon = (0, iconRegistry_1.registerIcon)('auxiliarybar-left-layout-icon', codicons_1.Codicon.layoutSidebarLeft, (0, nls_1.localize)('toggleAuxiliaryIconLeft', 'Icon to toggle the auxiliary bar in its left position.'));
    let ToggleAuxiliaryBarAction = class ToggleAuxiliaryBarAction extends actions_1.Action {
        constructor(id, name, layoutService) {
            super(id, name, layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */) ? 'auxiliaryBar expanded' : 'auxiliaryBar');
            this.layoutService = layoutService;
        }
        async run() {
            this.layoutService.setPartHidden(this.layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */), "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
        }
    };
    ToggleAuxiliaryBarAction.ID = 'workbench.action.toggleAuxiliaryBar';
    ToggleAuxiliaryBarAction.LABEL = (0, nls_1.localize)('toggleAuxiliaryBar', "Toggle Secondary Side Bar Visibility");
    ToggleAuxiliaryBarAction = __decorate([
        __param(2, layoutService_1.IWorkbenchLayoutService)
    ], ToggleAuxiliaryBarAction);
    exports.ToggleAuxiliaryBarAction = ToggleAuxiliaryBarAction;
    let FocusAuxiliaryBarAction = class FocusAuxiliaryBarAction extends actions_1.Action {
        constructor(id, label, paneCompositeService, layoutService) {
            super(id, label);
            this.paneCompositeService = paneCompositeService;
            this.layoutService = layoutService;
        }
        async run() {
            // Show auxiliary bar
            if (!this.layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */)) {
                this.layoutService.setPartHidden(false, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
            }
            // Focus into active composite
            let composite = this.paneCompositeService.getActivePaneComposite(2 /* ViewContainerLocation.AuxiliaryBar */);
            if (composite) {
                composite.focus();
            }
        }
    };
    FocusAuxiliaryBarAction.ID = 'workbench.action.focusAuxiliaryBar';
    FocusAuxiliaryBarAction.LABEL = (0, nls_1.localize)('focusAuxiliaryBar', "Focus into Secondary Side Bar");
    FocusAuxiliaryBarAction = __decorate([
        __param(2, panecomposite_1.IPaneCompositePartService),
        __param(3, layoutService_1.IWorkbenchLayoutService)
    ], FocusAuxiliaryBarAction);
    actions_2.MenuRegistry.appendMenuItems([
        {
            id: actions_2.MenuId.LayoutControlMenuSubmenu,
            item: {
                group: '0_workbench_layout',
                command: {
                    id: ToggleAuxiliaryBarAction.ID,
                    title: (0, nls_1.localize)('miShowAuxiliaryBarNoMnemonic', "Show Secondary Side Bar"),
                    toggled: contextkeys_1.AuxiliaryBarVisibleContext
                },
                order: 2
            }
        },
        {
            id: actions_2.MenuId.LayoutControlMenu,
            item: {
                group: '0_workbench_toggles',
                command: {
                    id: ToggleAuxiliaryBarAction.ID,
                    title: (0, nls_1.localize)('toggleSecondarySideBar', "Toggle Secondary Side Bar"),
                    toggled: contextkeys_1.AuxiliaryBarVisibleContext,
                    icon: auxiliaryBarLeftIcon,
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'toggles'), contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both')), contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'right')),
                order: 0
            }
        },
        {
            id: actions_2.MenuId.LayoutControlMenu,
            item: {
                group: '0_workbench_toggles',
                command: {
                    id: ToggleAuxiliaryBarAction.ID,
                    title: (0, nls_1.localize)('toggleSecondarySideBar', "Toggle Secondary Side Bar"),
                    toggled: contextkeys_1.AuxiliaryBarVisibleContext,
                    icon: auxiliaryBarRightIcon,
                },
                when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'toggles'), contextkey_1.ContextKeyExpr.equals('config.workbench.layoutControl.type', 'both')), contextkey_1.ContextKeyExpr.equals('config.workbench.sideBar.location', 'left')),
                order: 2
            }
        },
        {
            id: actions_2.MenuId.MenubarAppearanceMenu,
            item: {
                group: '2_workbench_layout',
                command: {
                    id: ToggleAuxiliaryBarAction.ID,
                    title: (0, nls_1.localize)({ key: 'miShowAuxiliaryBar', comment: ['&& denotes a mnemonic'] }, "Show Secondary Si&&de Bar"),
                    toggled: contextkeys_1.AuxiliaryBarVisibleContext
                },
                order: 2
            }
        }, {
            id: actions_2.MenuId.ViewTitleContext,
            item: {
                group: '3_workbench_layout_move',
                command: {
                    id: ToggleAuxiliaryBarAction.ID,
                    title: { value: (0, nls_1.localize)('hideAuxiliaryBar', "Hide Secondary Side Bar"), original: 'Hide Secondary Side Bar' },
                },
                when: contextkey_1.ContextKeyExpr.and(contextkeys_1.AuxiliaryBarVisibleContext, contextkey_1.ContextKeyExpr.equals('viewLocation', (0, views_1.ViewContainerLocationToString)(2 /* ViewContainerLocation.AuxiliaryBar */))),
                order: 2
            }
        }
    ]);
    const actionRegistry = platform_1.Registry.as(actions_3.Extensions.WorkbenchActions);
    actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(ToggleAuxiliaryBarAction), 'View: Toggle Secondary Side Bar Visibility', actions_3.CATEGORIES.View.value);
    actionRegistry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(FocusAuxiliaryBarAction), 'View: Focus into Secondary Side Bar', actions_3.CATEGORIES.View.value);
});
//# sourceMappingURL=auxiliaryBarActions.js.map