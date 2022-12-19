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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/progress/common/progress", "vs/platform/quickinput/common/quickInput", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/workbench/common/contextkeys", "vs/workbench/common/views", "vs/workbench/contrib/debug/browser/debugActionViewItems", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/browser/debugToolBar", "vs/workbench/contrib/debug/browser/welcomeView", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/layout/browser/layoutService", "vs/css!./media/debugViewlet"], function (require, exports, lifecycle_1, nls, menuEntryActionViewItem_1, actions_1, configuration_1, contextkey_1, contextView_1, instantiation_1, progress_1, quickInput_1, storage_1, telemetry_1, themeService_1, workspace_1, viewPaneContainer_1, contextkeys_1, views_1, debugActionViewItems_1, debugCommands_1, debugIcons_1, debugToolBar_1, welcomeView_1, debug_1, extensions_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugViewPaneContainer = void 0;
    let DebugViewPaneContainer = class DebugViewPaneContainer extends viewPaneContainer_1.ViewPaneContainer {
        constructor(layoutService, telemetryService, progressService, debugService, instantiationService, contextService, storageService, themeService, contextMenuService, extensionService, configurationService, contextViewService, contextKeyService, viewDescriptorService) {
            super(debug_1.VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);
            this.progressService = progressService;
            this.debugService = debugService;
            this.contextViewService = contextViewService;
            this.contextKeyService = contextKeyService;
            this.paneListeners = new Map();
            this.stopActionViewItemDisposables = this._register(new lifecycle_1.DisposableStore());
            // When there are potential updates to the docked debug toolbar we need to update it
            this._register(this.debugService.onDidChangeState(state => this.onDebugServiceStateChange(state)));
            this._register(this.contextKeyService.onDidChangeContext(e => {
                if (e.affectsSome(new Set([debug_1.CONTEXT_DEBUG_UX_KEY]))) {
                    this.updateTitleArea();
                }
            }));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateTitleArea()));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug.toolBarLocation')) {
                    this.updateTitleArea();
                }
            }));
        }
        create(parent) {
            super.create(parent);
            parent.classList.add('debug-viewlet');
        }
        focus() {
            super.focus();
            if (this.startDebugActionViewItem) {
                this.startDebugActionViewItem.focus();
            }
            else {
                this.focusView(welcomeView_1.WelcomeView.ID);
            }
        }
        getActionViewItem(action) {
            if (action.id === debugCommands_1.DEBUG_START_COMMAND_ID) {
                this.startDebugActionViewItem = this.instantiationService.createInstance(debugActionViewItems_1.StartDebugActionViewItem, null, action);
                return this.startDebugActionViewItem;
            }
            if (action.id === debugCommands_1.FOCUS_SESSION_ID) {
                return new debugActionViewItems_1.FocusSessionActionViewItem(action, undefined, this.debugService, this.themeService, this.contextViewService, this.configurationService);
            }
            if (action.id === debugCommands_1.STOP_ID || action.id === debugCommands_1.DISCONNECT_ID) {
                this.stopActionViewItemDisposables.clear();
                const item = this.instantiationService.invokeFunction(accessor => (0, debugToolBar_1.createDisconnectMenuItemAction)(action, this.stopActionViewItemDisposables, accessor));
                if (item) {
                    return item;
                }
            }
            return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action);
        }
        focusView(id) {
            const view = this.getView(id);
            if (view) {
                view.focus();
            }
        }
        onDebugServiceStateChange(state) {
            if (this.progressResolve) {
                this.progressResolve();
                this.progressResolve = undefined;
            }
            if (state === 1 /* State.Initializing */) {
                this.progressService.withProgress({ location: debug_1.VIEWLET_ID, }, _progress => {
                    return new Promise(resolve => this.progressResolve = resolve);
                });
            }
        }
        addPanes(panes) {
            super.addPanes(panes);
            for (const { pane: pane } of panes) {
                // attach event listener to
                if (pane.id === debug_1.BREAKPOINTS_VIEW_ID) {
                    this.breakpointView = pane;
                    this.updateBreakpointsMaxSize();
                }
                else {
                    this.paneListeners.set(pane.id, pane.onDidChange(() => this.updateBreakpointsMaxSize()));
                }
            }
        }
        removePanes(panes) {
            super.removePanes(panes);
            for (const pane of panes) {
                (0, lifecycle_1.dispose)(this.paneListeners.get(pane.id));
                this.paneListeners.delete(pane.id);
            }
        }
        updateBreakpointsMaxSize() {
            if (this.breakpointView) {
                // We need to update the breakpoints view since all other views are collapsed #25384
                const allOtherCollapsed = this.panes.every(view => !view.isExpanded() || view === this.breakpointView);
                this.breakpointView.maximumBodySize = allOtherCollapsed ? Number.POSITIVE_INFINITY : this.breakpointView.minimumBodySize;
            }
        }
    };
    DebugViewPaneContainer = __decorate([
        __param(0, layoutService_1.IWorkbenchLayoutService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, progress_1.IProgressService),
        __param(3, debug_1.IDebugService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, workspace_1.IWorkspaceContextService),
        __param(6, storage_1.IStorageService),
        __param(7, themeService_1.IThemeService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, extensions_1.IExtensionService),
        __param(10, configuration_1.IConfigurationService),
        __param(11, contextView_1.IContextViewService),
        __param(12, contextkey_1.IContextKeyService),
        __param(13, views_1.IViewDescriptorService)
    ], DebugViewPaneContainer);
    exports.DebugViewPaneContainer = DebugViewPaneContainer;
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewContainerTitle, {
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID), debug_1.CONTEXT_DEBUG_UX.notEqualsTo('simple'), contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_DEBUG_STATE.isEqualTo('inactive'), contextkey_1.ContextKeyExpr.notEquals('config.debug.toolBarLocation', 'docked'))),
        order: 10,
        group: 'navigation',
        command: {
            precondition: debug_1.CONTEXT_DEBUG_STATE.notEqualsTo((0, debug_1.getStateLabel)(1 /* State.Initializing */)),
            id: debugCommands_1.DEBUG_START_COMMAND_ID,
            title: debugCommands_1.DEBUG_START_LABEL
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: debugCommands_1.DEBUG_CONFIGURE_COMMAND_ID,
                title: {
                    value: debugCommands_1.DEBUG_CONFIGURE_LABEL,
                    original: 'Open \'launch.json\'',
                    mnemonicTitle: nls.localize({ key: 'miOpenConfigurations', comment: ['&& denotes a mnemonic'] }, "Open &&Configurations")
                },
                f1: true,
                icon: debugIcons_1.debugConfigure,
                precondition: debug_1.CONTEXT_DEBUG_UX.notEqualsTo('simple'),
                menu: [{
                        id: actions_1.MenuId.ViewContainerTitle,
                        group: 'navigation',
                        order: 20,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID), debug_1.CONTEXT_DEBUG_UX.notEqualsTo('simple'), contextkeys_1.WorkbenchStateContext.notEqualsTo('empty'), contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_DEBUG_STATE.isEqualTo('inactive'), contextkey_1.ContextKeyExpr.notEquals('config.debug.toolBarLocation', 'docked')))
                    }, {
                        id: actions_1.MenuId.ViewContainerTitle,
                        order: 20,
                        // Show in debug viewlet secondary actions when debugging and debug toolbar is docked
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID), debug_1.CONTEXT_DEBUG_STATE.notEqualsTo('inactive'), contextkey_1.ContextKeyExpr.equals('config.debug.toolBarLocation', 'docked'))
                    }, {
                        id: actions_1.MenuId.MenubarDebugMenu,
                        group: '2_configuration',
                        order: 1,
                        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
                    }]
            });
        }
        async run(accessor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const configurationManager = debugService.getConfigurationManager();
            let launch;
            if (configurationManager.selectedConfiguration.name) {
                launch = configurationManager.selectedConfiguration.launch;
            }
            else {
                const launches = configurationManager.getLaunches().filter(l => !l.hidden);
                if (launches.length === 1) {
                    launch = launches[0];
                }
                else {
                    const picks = launches.map(l => ({ label: l.name, launch: l }));
                    const picked = await quickInputService.pick(picks, {
                        activeItem: picks[0],
                        placeHolder: nls.localize({ key: 'selectWorkspaceFolder', comment: ['User picks a workspace folder or a workspace configuration file here. Workspace configuration files can contain settings and thus a launch.json configuration can be written into one.'] }, "Select a workspace folder to create a launch.json file in or add it to the workspace config file")
                    });
                    if (picked) {
                        launch = picked.launch;
                    }
                }
            }
            if (launch) {
                await launch.openConfigFile(false);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'debug.toggleReplIgnoreFocus',
                title: nls.localize('debugPanel', "Debug Console"),
                toggled: contextkey_1.ContextKeyExpr.has(`view.${debug_1.REPL_VIEW_ID}.visible`),
                menu: [{
                        id: viewPaneContainer_1.ViewsSubMenu,
                        group: '3_toggleRepl',
                        order: 30,
                        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID))
                    }]
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            if (viewsService.isViewVisible(debug_1.REPL_VIEW_ID)) {
                viewsService.closeView(debug_1.REPL_VIEW_ID);
            }
            else {
                await viewsService.openView(debug_1.REPL_VIEW_ID);
            }
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ViewContainerTitle, {
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID), debug_1.CONTEXT_DEBUG_STATE.notEqualsTo('inactive'), contextkey_1.ContextKeyExpr.equals('config.debug.toolBarLocation', 'docked')),
        order: 10,
        command: {
            id: debugCommands_1.SELECT_AND_START_ID,
            title: nls.localize('startAdditionalSession', "Start Additional Session"),
        }
    });
});
//# sourceMappingURL=debugViewlet.js.map