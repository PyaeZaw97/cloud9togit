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
define(["require", "exports", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/keybinding/common/keybinding", "vs/base/browser/browser", "vs/base/common/labels", "vs/platform/notification/common/notification", "vs/base/common/functional", "vs/base/common/lifecycle", "vs/base/parts/contextmenu/electron-sandbox/contextmenu", "vs/platform/window/common/window", "vs/base/common/platform", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextMenuService", "vs/platform/theme/common/themeService", "vs/platform/instantiation/common/extensions", "vs/base/common/iconLabels", "vs/base/common/arrays", "vs/base/common/event"], function (require, exports, actions_1, dom, contextView_1, telemetry_1, keybinding_1, browser_1, labels_1, notification_1, functional_1, lifecycle_1, contextmenu_1, window_1, platform_1, configuration_1, contextMenuService_1, themeService_1, extensions_1, iconLabels_1, arrays_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextMenuService = void 0;
    let ContextMenuService = class ContextMenuService extends lifecycle_1.Disposable {
        constructor(notificationService, telemetryService, keybindingService, configurationService, contextViewService, themeService) {
            super();
            // Custom context menu: Linux/Windows if custom title is enabled
            if (!platform_1.isMacintosh && (0, window_1.getTitleBarStyle)(configurationService) === 'custom') {
                this.impl = new contextMenuService_1.ContextMenuService(telemetryService, notificationService, contextViewService, keybindingService, themeService);
            }
            // Native context menu: otherwise
            else {
                this.impl = new NativeContextMenuService(notificationService, telemetryService, keybindingService);
            }
        }
        get onDidShowContextMenu() { return this.impl.onDidShowContextMenu; }
        get onDidHideContextMenu() { return this.impl.onDidHideContextMenu; }
        showContextMenu(delegate) {
            this.impl.showContextMenu(delegate);
        }
    };
    ContextMenuService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextView_1.IContextViewService),
        __param(5, themeService_1.IThemeService)
    ], ContextMenuService);
    exports.ContextMenuService = ContextMenuService;
    let NativeContextMenuService = class NativeContextMenuService extends lifecycle_1.Disposable {
        constructor(notificationService, telemetryService, keybindingService) {
            super();
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.keybindingService = keybindingService;
            this._onDidShowContextMenu = new event_1.Emitter();
            this.onDidShowContextMenu = this._onDidShowContextMenu.event;
            this._onDidHideContextMenu = new event_1.Emitter();
            this.onDidHideContextMenu = this._onDidHideContextMenu.event;
        }
        showContextMenu(delegate) {
            const actions = delegate.getActions();
            if (actions.length) {
                const onHide = (0, functional_1.once)(() => {
                    if (delegate.onHide) {
                        delegate.onHide(false);
                    }
                    dom.ModifierKeyEmitter.getInstance().resetKeyStatus();
                    this._onDidHideContextMenu.fire();
                });
                const menu = this.createMenu(delegate, actions, onHide);
                const anchor = delegate.getAnchor();
                let x;
                let y;
                const zoom = (0, browser_1.getZoomFactor)();
                if (dom.isHTMLElement(anchor)) {
                    const elementPosition = dom.getDomNodePagePosition(anchor);
                    x = elementPosition.left;
                    y = elementPosition.top + elementPosition.height;
                    // Shift macOS menus by a few pixels below elements
                    // to account for extra padding on top of native menu
                    // https://github.com/microsoft/vscode/issues/84231
                    if (platform_1.isMacintosh) {
                        y += 4 / zoom;
                    }
                }
                else {
                    const pos = anchor;
                    x = pos.x + 1; /* prevent first item from being selected automatically under mouse */
                    y = pos.y;
                }
                x *= zoom;
                y *= zoom;
                (0, contextmenu_1.popup)(menu, {
                    x: Math.floor(x),
                    y: Math.floor(y),
                    positioningItem: delegate.autoSelectFirstItem ? 0 : undefined,
                }, () => onHide());
                this._onDidShowContextMenu.fire();
            }
        }
        createMenu(delegate, entries, onHide, submenuIds = new Set()) {
            const actionRunner = delegate.actionRunner || new actions_1.ActionRunner();
            return (0, arrays_1.coalesce)(entries.map(entry => this.createMenuItem(delegate, entry, actionRunner, onHide, submenuIds)));
        }
        createMenuItem(delegate, entry, actionRunner, onHide, submenuIds) {
            // Separator
            if (entry instanceof actions_1.Separator) {
                return { type: 'separator' };
            }
            // Submenu
            if (entry instanceof actions_1.SubmenuAction) {
                if (submenuIds.has(entry.id)) {
                    console.warn(`Found submenu cycle: ${entry.id}`);
                    return undefined;
                }
                return {
                    label: (0, labels_1.unmnemonicLabel)((0, iconLabels_1.stripIcons)(entry.label)).trim(),
                    submenu: this.createMenu(delegate, entry.actions, onHide, new Set([...submenuIds, entry.id]))
                };
            }
            // Normal Menu Item
            else {
                let type = undefined;
                if (!!entry.checked) {
                    if (typeof delegate.getCheckedActionsRepresentation === 'function') {
                        type = delegate.getCheckedActionsRepresentation(entry);
                    }
                    else {
                        type = 'checkbox';
                    }
                }
                const item = {
                    label: (0, labels_1.unmnemonicLabel)((0, iconLabels_1.stripIcons)(entry.label)).trim(),
                    checked: !!entry.checked,
                    type,
                    enabled: !!entry.enabled,
                    click: event => {
                        // To preserve pre-electron-2.x behaviour, we first trigger
                        // the onHide callback and then the action.
                        // Fixes https://github.com/microsoft/vscode/issues/45601
                        onHide();
                        // Run action which will close the menu
                        this.runAction(actionRunner, entry, delegate, event);
                    }
                };
                const keybinding = !!delegate.getKeyBinding ? delegate.getKeyBinding(entry) : this.keybindingService.lookupKeybinding(entry.id);
                if (keybinding) {
                    const electronAccelerator = keybinding.getElectronAccelerator();
                    if (electronAccelerator) {
                        item.accelerator = electronAccelerator;
                    }
                    else {
                        const label = keybinding.getLabel();
                        if (label) {
                            item.label = `${item.label} [${label}]`;
                        }
                    }
                }
                return item;
            }
        }
        async runAction(actionRunner, actionToRun, delegate, event) {
            this.telemetryService.publicLog2('workbenchActionExecuted', { id: actionToRun.id, from: 'contextMenu' });
            const context = delegate.getActionsContext ? delegate.getActionsContext(event) : undefined;
            const runnable = actionRunner.run(actionToRun, context);
            try {
                await runnable;
            }
            catch (error) {
                this.notificationService.error(error);
            }
        }
    };
    NativeContextMenuService = __decorate([
        __param(0, notification_1.INotificationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, keybinding_1.IKeybindingService)
    ], NativeContextMenuService);
    (0, extensions_1.registerSingleton)(contextView_1.IContextMenuService, ContextMenuService, true);
});
//# sourceMappingURL=contextmenuService.js.map