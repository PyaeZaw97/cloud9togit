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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/nls", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/notification/common/notification", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/debug/browser/debugActionViewItems", "vs/workbench/contrib/debug/browser/debugColors", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/layout/browser/layoutService", "vs/css!./media/debugToolBar"], function (require, exports, browser, dom, mouseEvent_1, actionbar_1, actions_1, arrays, async_1, errors, lifecycle_1, nls_1, dropdownWithPrimaryActionViewItem_1, menuEntryActionViewItem_1, actions_2, configuration_1, contextkey_1, contextView_1, instantiation_1, notification_1, storage_1, telemetry_1, colorRegistry_1, themeService_1, debugActionViewItems_1, debugColors_1, debugCommands_1, icons, debug_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createDisconnectMenuItemAction = exports.DebugToolBar = void 0;
    const DEBUG_TOOLBAR_POSITION_KEY = 'debug.actionswidgetposition';
    const DEBUG_TOOLBAR_Y_KEY = 'debug.actionswidgety';
    let DebugToolBar = class DebugToolBar extends themeService_1.Themable {
        constructor(notificationService, telemetryService, debugService, layoutService, storageService, configurationService, themeService, instantiationService, menuService, contextKeyService) {
            var _a, _b;
            super(themeService);
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.debugService = debugService;
            this.layoutService = layoutService;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.yCoordinate = 0;
            this.isVisible = false;
            this.isBuilt = false;
            this.stopActionViewItemDisposables = this._register(new lifecycle_1.DisposableStore());
            this.$el = dom.$('div.debug-toolbar');
            this.$el.style.top = `${(_b = (_a = layoutService.offset) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 0}px`;
            this.dragArea = dom.append(this.$el, dom.$('div.drag-area' + themeService_1.ThemeIcon.asCSSSelector(icons.debugGripper)));
            const actionBarContainer = dom.append(this.$el, dom.$('div.action-bar-container'));
            this.debugToolBarMenu = menuService.createMenu(actions_2.MenuId.DebugToolBar, contextKeyService);
            this._register(this.debugToolBarMenu);
            this.activeActions = [];
            this.actionBar = this._register(new actionbar_1.ActionBar(actionBarContainer, {
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                actionViewItemProvider: (action) => {
                    if (action.id === debugCommands_1.FOCUS_SESSION_ID) {
                        return this.instantiationService.createInstance(debugActionViewItems_1.FocusSessionActionViewItem, action, undefined);
                    }
                    else if (action.id === debugCommands_1.STOP_ID || action.id === debugCommands_1.DISCONNECT_ID) {
                        this.stopActionViewItemDisposables.clear();
                        const item = this.instantiationService.invokeFunction(accessor => createDisconnectMenuItemAction(action, this.stopActionViewItemDisposables, accessor));
                        if (item) {
                            return item;
                        }
                    }
                    return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action);
                }
            }));
            this.updateScheduler = this._register(new async_1.RunOnceScheduler(() => {
                var _a, _b, _c;
                const state = this.debugService.state;
                const toolBarLocation = this.configurationService.getValue('debug').toolBarLocation;
                if (state === 0 /* State.Inactive */ || toolBarLocation === 'docked' || toolBarLocation === 'hidden' || ((_a = this.debugService.getViewModel().focusedSession) === null || _a === void 0 ? void 0 : _a.isSimpleUI) || (state === 1 /* State.Initializing */ && ((_c = (_b = this.debugService.initializingOptions) === null || _b === void 0 ? void 0 : _b.debugUI) === null || _c === void 0 ? void 0 : _c.simple))) {
                    return this.hide();
                }
                const actions = [];
                const disposable = (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.debugToolBarMenu, { shouldForwardArgs: true }, actions);
                if (!arrays.equals(actions, this.activeActions, (first, second) => first.id === second.id && first.enabled === second.enabled)) {
                    this.actionBar.clear();
                    this.actionBar.push(actions, { icon: true, label: false });
                    this.activeActions = actions;
                }
                if (this.disposeOnUpdate) {
                    (0, lifecycle_1.dispose)(this.disposeOnUpdate);
                }
                this.disposeOnUpdate = disposable;
                this.show();
            }, 20));
            this.updateStyles();
            this.registerListeners();
            this.hide();
        }
        registerListeners() {
            this._register(this.debugService.onDidChangeState(() => this.updateScheduler.schedule()));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('debug.toolBarLocation')) {
                    this.updateScheduler.schedule();
                }
            }));
            this._register(this.debugToolBarMenu.onDidChange(() => this.updateScheduler.schedule()));
            this._register(this.actionBar.actionRunner.onDidRun((e) => {
                // check for error
                if (e.error && !errors.isCancellationError(e.error)) {
                    this.notificationService.error(e.error);
                }
                // log in telemetry
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: 'debugActionsWidget' });
            }));
            this._register(dom.addDisposableListener(window, dom.EventType.RESIZE, () => this.setCoordinates()));
            this._register(dom.addDisposableGenericMouseUpListener(this.dragArea, (event) => {
                const mouseClickEvent = new mouseEvent_1.StandardMouseEvent(event);
                if (mouseClickEvent.detail === 2) {
                    // double click on debug bar centers it again #8250
                    const widgetWidth = this.$el.clientWidth;
                    this.setCoordinates(0.5 * window.innerWidth - 0.5 * widgetWidth, 0);
                    this.storePosition();
                }
            }));
            this._register(dom.addDisposableGenericMouseDownListener(this.dragArea, (event) => {
                this.dragArea.classList.add('dragged');
                const mouseMoveListener = dom.addDisposableGenericMouseMoveListener(window, (e) => {
                    var _a, _b;
                    const mouseMoveEvent = new mouseEvent_1.StandardMouseEvent(e);
                    // Prevent default to stop editor selecting text #8524
                    mouseMoveEvent.preventDefault();
                    // Reduce x by width of drag handle to reduce jarring #16604
                    this.setCoordinates(mouseMoveEvent.posx - 14, mouseMoveEvent.posy - ((_b = (_a = this.layoutService.offset) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 0));
                });
                const mouseUpListener = dom.addDisposableGenericMouseUpListener(window, (e) => {
                    this.storePosition();
                    this.dragArea.classList.remove('dragged');
                    mouseMoveListener.dispose();
                    mouseUpListener.dispose();
                });
            }));
            this._register(this.layoutService.onDidChangePartVisibility(() => this.setYCoordinate()));
            this._register(browser.PixelRatio.onDidChange(() => this.setYCoordinate()));
        }
        storePosition() {
            const left = dom.getComputedStyle(this.$el).left;
            if (left) {
                const position = parseFloat(left) / window.innerWidth;
                this.storageService.store(DEBUG_TOOLBAR_POSITION_KEY, position, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            }
        }
        updateStyles() {
            super.updateStyles();
            if (this.$el) {
                this.$el.style.backgroundColor = this.getColor(debugColors_1.debugToolBarBackground) || '';
                const widgetShadowColor = this.getColor(colorRegistry_1.widgetShadow);
                this.$el.style.boxShadow = widgetShadowColor ? `0 0 8px 2px ${widgetShadowColor}` : '';
                const contrastBorderColor = this.getColor(colorRegistry_1.contrastBorder);
                const borderColor = this.getColor(debugColors_1.debugToolBarBorder);
                if (contrastBorderColor) {
                    this.$el.style.border = `1px solid ${contrastBorderColor}`;
                }
                else {
                    this.$el.style.border = borderColor ? `solid ${borderColor}` : 'none';
                    this.$el.style.border = '1px 0';
                }
            }
        }
        setYCoordinate(y = this.yCoordinate) {
            var _a, _b;
            const titlebarOffset = (_b = (_a = this.layoutService.offset) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 0;
            this.$el.style.top = `${titlebarOffset + y}px`;
            this.yCoordinate = y;
        }
        setCoordinates(x, y) {
            if (!this.isVisible) {
                return;
            }
            const widgetWidth = this.$el.clientWidth;
            if (x === undefined) {
                const positionPercentage = this.storageService.get(DEBUG_TOOLBAR_POSITION_KEY, 0 /* StorageScope.GLOBAL */);
                x = positionPercentage !== undefined ? parseFloat(positionPercentage) * window.innerWidth : (0.5 * window.innerWidth - 0.5 * widgetWidth);
            }
            x = Math.max(0, Math.min(x, window.innerWidth - widgetWidth)); // do not allow the widget to overflow on the right
            this.$el.style.left = `${x}px`;
            if (y === undefined) {
                y = this.storageService.getNumber(DEBUG_TOOLBAR_Y_KEY, 0 /* StorageScope.GLOBAL */, 0);
            }
            const titleAreaHeight = 35;
            if ((y < titleAreaHeight / 2) || (y > titleAreaHeight + titleAreaHeight / 2)) {
                const moveToTop = y < titleAreaHeight;
                this.setYCoordinate(moveToTop ? 0 : titleAreaHeight);
                this.storageService.store(DEBUG_TOOLBAR_Y_KEY, moveToTop ? 0 : 2 * titleAreaHeight, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            }
        }
        show() {
            if (this.isVisible) {
                this.setCoordinates();
                return;
            }
            if (!this.isBuilt) {
                this.isBuilt = true;
                this.layoutService.container.appendChild(this.$el);
            }
            this.isVisible = true;
            dom.show(this.$el);
            this.setCoordinates();
        }
        hide() {
            this.isVisible = false;
            dom.hide(this.$el);
        }
        dispose() {
            super.dispose();
            if (this.$el) {
                this.$el.remove();
            }
            if (this.disposeOnUpdate) {
                (0, lifecycle_1.dispose)(this.disposeOnUpdate);
            }
        }
    };
    DebugToolBar = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, debug_1.IDebugService),
        __param(3, layoutService_1.IWorkbenchLayoutService),
        __param(4, storage_1.IStorageService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, themeService_1.IThemeService),
        __param(7, instantiation_1.IInstantiationService),
        __param(8, actions_2.IMenuService),
        __param(9, contextkey_1.IContextKeyService)
    ], DebugToolBar);
    exports.DebugToolBar = DebugToolBar;
    function createDisconnectMenuItemAction(action, disposables, accessor) {
        const menuService = accessor.get(actions_2.IMenuService);
        const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const contextMenuService = accessor.get(contextView_1.IContextMenuService);
        const menu = menuService.createMenu(actions_2.MenuId.DebugToolBarStop, contextKeyService);
        const secondary = [];
        disposables.add((0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { shouldForwardArgs: true }, secondary));
        if (!secondary.length) {
            return undefined;
        }
        const dropdownAction = disposables.add(new actions_1.Action('notebook.moreRunActions', (0, nls_1.localize)('notebook.moreRunActionsLabel', "More..."), 'codicon-chevron-down', true));
        const item = instantiationService.createInstance(dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem, action, dropdownAction, secondary, 'debug-stop-actions', contextMenuService, {});
        return item;
    }
    exports.createDisconnectMenuItemAction = createDisconnectMenuItemAction;
    // Debug toolbar
    const debugViewTitleItems = [];
    const registerDebugToolBarItem = (id, title, order, icon, when, precondition, alt) => {
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.DebugToolBar, {
            group: 'navigation',
            when,
            order,
            command: {
                id,
                title,
                icon,
                precondition
            },
            alt
        });
        // Register actions in debug viewlet when toolbar is docked
        debugViewTitleItems.push(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.ViewContainerTitle, {
            group: 'navigation',
            when: contextkey_1.ContextKeyExpr.and(when, contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID), debug_1.CONTEXT_DEBUG_STATE.notEqualsTo('inactive'), contextkey_1.ContextKeyExpr.equals('config.debug.toolBarLocation', 'docked')),
            order,
            command: {
                id,
                title,
                icon,
                precondition
            }
        }));
    };
    actions_2.MenuRegistry.onDidChangeMenu(e => {
        // In case the debug toolbar is docked we need to make sure that the docked toolbar has the up to date commands registered #115945
        if (e.has(actions_2.MenuId.DebugToolBar)) {
            (0, lifecycle_1.dispose)(debugViewTitleItems);
            const items = actions_2.MenuRegistry.getMenuItems(actions_2.MenuId.DebugToolBar);
            for (const i of items) {
                debugViewTitleItems.push(actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.ViewContainerTitle, Object.assign(Object.assign({}, i), { when: contextkey_1.ContextKeyExpr.and(i.when, contextkey_1.ContextKeyExpr.equals('viewContainer', debug_1.VIEWLET_ID), debug_1.CONTEXT_DEBUG_STATE.notEqualsTo('inactive'), contextkey_1.ContextKeyExpr.equals('config.debug.toolBarLocation', 'docked')) })));
            }
        }
    });
    registerDebugToolBarItem(debugCommands_1.CONTINUE_ID, debugCommands_1.CONTINUE_LABEL, 10, icons.debugContinue, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.PAUSE_ID, debugCommands_1.PAUSE_LABEL, 10, icons.debugPause, debug_1.CONTEXT_DEBUG_STATE.notEqualsTo('stopped'), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('running'));
    registerDebugToolBarItem(debugCommands_1.STOP_ID, debugCommands_1.STOP_LABEL, 70, icons.debugStop, debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.toNegated(), undefined, { id: debugCommands_1.DISCONNECT_ID, title: debugCommands_1.DISCONNECT_LABEL, icon: icons.debugDisconnect, precondition: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.toNegated(), debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED), });
    registerDebugToolBarItem(debugCommands_1.DISCONNECT_ID, debugCommands_1.DISCONNECT_LABEL, 70, icons.debugDisconnect, debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH, undefined, { id: debugCommands_1.STOP_ID, title: debugCommands_1.STOP_LABEL, icon: icons.debugStop, precondition: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH, debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED), });
    registerDebugToolBarItem(debugCommands_1.STEP_OVER_ID, debugCommands_1.STEP_OVER_LABEL, 20, icons.debugStepOver, undefined, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.STEP_INTO_ID, debugCommands_1.STEP_INTO_LABEL, 30, icons.debugStepInto, undefined, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.STEP_OUT_ID, debugCommands_1.STEP_OUT_LABEL, 40, icons.debugStepOut, undefined, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.RESTART_SESSION_ID, debugCommands_1.RESTART_LABEL, 60, icons.debugRestart);
    registerDebugToolBarItem(debugCommands_1.STEP_BACK_ID, (0, nls_1.localize)('stepBackDebug', "Step Back"), 50, icons.debugStepBack, debug_1.CONTEXT_STEP_BACK_SUPPORTED, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.REVERSE_CONTINUE_ID, (0, nls_1.localize)('reverseContinue', "Reverse"), 55, icons.debugReverseContinue, debug_1.CONTEXT_STEP_BACK_SUPPORTED, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugToolBarItem(debugCommands_1.FOCUS_SESSION_ID, debugCommands_1.FOCUS_SESSION_LABEL, 100, undefined, debug_1.CONTEXT_MULTI_SESSION_DEBUG);
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.DebugToolBarStop, {
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.toNegated(), debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED),
        order: 0,
        command: {
            id: debugCommands_1.DISCONNECT_ID,
            title: debugCommands_1.DISCONNECT_LABEL,
            icon: icons.debugDisconnect
        }
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.DebugToolBarStop, {
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH, debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED),
        order: 0,
        command: {
            id: debugCommands_1.STOP_ID,
            title: debugCommands_1.STOP_LABEL,
            icon: icons.debugStop
        }
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.DebugToolBarStop, {
        group: 'navigation',
        when: contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.toNegated(), debug_1.CONTEXT_SUSPEND_DEBUGGEE_SUPPORTED, debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED), contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH, debug_1.CONTEXT_SUSPEND_DEBUGGEE_SUPPORTED)),
        order: 0,
        command: {
            id: debugCommands_1.DISCONNECT_AND_SUSPEND_ID,
            title: debugCommands_1.DISCONNECT_AND_SUSPEND_LABEL,
            icon: icons.debugDisconnect
        }
    });
});
//# sourceMappingURL=debugToolBar.js.map