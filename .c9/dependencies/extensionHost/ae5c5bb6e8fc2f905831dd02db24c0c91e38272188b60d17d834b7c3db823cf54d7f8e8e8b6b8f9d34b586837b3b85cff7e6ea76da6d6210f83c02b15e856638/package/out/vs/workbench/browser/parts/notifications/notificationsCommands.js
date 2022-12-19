/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/common/notifications", "vs/platform/actions/common/actions", "vs/nls", "vs/platform/list/browser/listService", "vs/platform/telemetry/common/telemetry", "vs/workbench/browser/parts/notifications/notificationsTelemetry", "vs/workbench/common/contextkeys"], function (require, exports, commands_1, contextkey_1, keybindingsRegistry_1, notifications_1, actions_1, nls_1, listService_1, telemetry_1, notificationsTelemetry_1, contextkeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerNotificationCommands = exports.CLEAR_ALL_NOTIFICATIONS = exports.CLEAR_NOTIFICATION = exports.EXPAND_NOTIFICATION = exports.COLLAPSE_NOTIFICATION = exports.HIDE_NOTIFICATION_TOAST = exports.HIDE_NOTIFICATIONS_CENTER = exports.SHOW_NOTIFICATIONS_CENTER = void 0;
    // Center
    exports.SHOW_NOTIFICATIONS_CENTER = 'notifications.showList';
    exports.HIDE_NOTIFICATIONS_CENTER = 'notifications.hideList';
    const TOGGLE_NOTIFICATIONS_CENTER = 'notifications.toggleList';
    // Toasts
    exports.HIDE_NOTIFICATION_TOAST = 'notifications.hideToasts';
    const FOCUS_NOTIFICATION_TOAST = 'notifications.focusToasts';
    const FOCUS_NEXT_NOTIFICATION_TOAST = 'notifications.focusNextToast';
    const FOCUS_PREVIOUS_NOTIFICATION_TOAST = 'notifications.focusPreviousToast';
    const FOCUS_FIRST_NOTIFICATION_TOAST = 'notifications.focusFirstToast';
    const FOCUS_LAST_NOTIFICATION_TOAST = 'notifications.focusLastToast';
    // Notification
    exports.COLLAPSE_NOTIFICATION = 'notification.collapse';
    exports.EXPAND_NOTIFICATION = 'notification.expand';
    const TOGGLE_NOTIFICATION = 'notification.toggle';
    exports.CLEAR_NOTIFICATION = 'notification.clear';
    exports.CLEAR_ALL_NOTIFICATIONS = 'notifications.clearAll';
    function registerNotificationCommands(center, toasts, model) {
        function getNotificationFromContext(listService, context) {
            if ((0, notifications_1.isNotificationViewItem)(context)) {
                return context;
            }
            const list = listService.lastFocusedList;
            if (list instanceof listService_1.WorkbenchList) {
                const focusedElement = list.getFocusedElements()[0];
                if ((0, notifications_1.isNotificationViewItem)(focusedElement)) {
                    return focusedElement;
                }
            }
            return undefined;
        }
        // Show Notifications Cneter
        commands_1.CommandsRegistry.registerCommand(exports.SHOW_NOTIFICATIONS_CENTER, () => {
            toasts.hide();
            center.show();
        });
        // Hide Notifications Center
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.HIDE_NOTIFICATIONS_CENTER,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
            when: contextkeys_1.NotificationsCenterVisibleContext,
            primary: 9 /* KeyCode.Escape */,
            handler: accessor => {
                const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                for (const notification of model.notifications) {
                    if (notification.visible) {
                        telemetryService.publicLog2('notification:hide', (0, notificationsTelemetry_1.notificationToMetrics)(notification.message.original, notification.sourceId, notification.silent));
                    }
                }
                center.hide();
            }
        });
        // Toggle Notifications Center
        commands_1.CommandsRegistry.registerCommand(TOGGLE_NOTIFICATIONS_CENTER, accessor => {
            if (center.isVisible) {
                center.hide();
            }
            else {
                toasts.hide();
                center.show();
            }
        });
        // Clear Notification
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLEAR_NOTIFICATION,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.NotificationFocusedContext,
            primary: 20 /* KeyCode.Delete */,
            mac: {
                primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */
            },
            handler: (accessor, args) => {
                const notification = getNotificationFromContext(accessor.get(listService_1.IListService), args);
                if (notification && !notification.hasProgress) {
                    notification.close();
                }
            }
        });
        // Expand Notification
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.EXPAND_NOTIFICATION,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.NotificationFocusedContext,
            primary: 17 /* KeyCode.RightArrow */,
            handler: (accessor, args) => {
                const notification = getNotificationFromContext(accessor.get(listService_1.IListService), args);
                if (notification) {
                    notification.expand();
                }
            }
        });
        // Collapse Notification
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.COLLAPSE_NOTIFICATION,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.NotificationFocusedContext,
            primary: 15 /* KeyCode.LeftArrow */,
            handler: (accessor, args) => {
                const notification = getNotificationFromContext(accessor.get(listService_1.IListService), args);
                if (notification) {
                    notification.collapse();
                }
            }
        });
        // Toggle Notification
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: TOGGLE_NOTIFICATION,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.NotificationFocusedContext,
            primary: 10 /* KeyCode.Space */,
            secondary: [3 /* KeyCode.Enter */],
            handler: accessor => {
                const notification = getNotificationFromContext(accessor.get(listService_1.IListService));
                if (notification) {
                    notification.toggle();
                }
            }
        });
        // Hide Toasts
        commands_1.CommandsRegistry.registerCommand(exports.HIDE_NOTIFICATION_TOAST, accessor => {
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            for (const notification of model.notifications) {
                if (notification.visible) {
                    telemetryService.publicLog2('notification:hide', (0, notificationsTelemetry_1.notificationToMetrics)(notification.message.original, notification.sourceId, notification.silent));
                }
            }
            toasts.hide();
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
            id: exports.HIDE_NOTIFICATION_TOAST,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ - 50,
            when: contextkeys_1.NotificationsToastsVisibleContext,
            primary: 9 /* KeyCode.Escape */
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerKeybindingRule({
            id: exports.HIDE_NOTIFICATION_TOAST,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 100,
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.NotificationsToastsVisibleContext, contextkeys_1.NotificationFocusedContext),
            primary: 9 /* KeyCode.Escape */
        });
        // Focus Toasts
        commands_1.CommandsRegistry.registerCommand(FOCUS_NOTIFICATION_TOAST, () => toasts.focus());
        // Focus Next Toast
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: FOCUS_NEXT_NOTIFICATION_TOAST,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.NotificationFocusedContext, contextkeys_1.NotificationsToastsVisibleContext),
            primary: 18 /* KeyCode.DownArrow */,
            handler: (accessor) => {
                toasts.focusNext();
            }
        });
        // Focus Previous Toast
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: FOCUS_PREVIOUS_NOTIFICATION_TOAST,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.NotificationFocusedContext, contextkeys_1.NotificationsToastsVisibleContext),
            primary: 16 /* KeyCode.UpArrow */,
            handler: (accessor) => {
                toasts.focusPrevious();
            }
        });
        // Focus First Toast
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: FOCUS_FIRST_NOTIFICATION_TOAST,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.NotificationFocusedContext, contextkeys_1.NotificationsToastsVisibleContext),
            primary: 11 /* KeyCode.PageUp */,
            secondary: [14 /* KeyCode.Home */],
            handler: (accessor) => {
                toasts.focusFirst();
            }
        });
        // Focus Last Toast
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: FOCUS_LAST_NOTIFICATION_TOAST,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.NotificationFocusedContext, contextkeys_1.NotificationsToastsVisibleContext),
            primary: 12 /* KeyCode.PageDown */,
            secondary: [13 /* KeyCode.End */],
            handler: (accessor) => {
                toasts.focusLast();
            }
        });
        /// Clear All Notifications
        commands_1.CommandsRegistry.registerCommand(exports.CLEAR_ALL_NOTIFICATIONS, () => center.clearAll());
        // Commands for Command Palette
        const category = { value: (0, nls_1.localize)('notifications', "Notifications"), original: 'Notifications' };
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: exports.SHOW_NOTIFICATIONS_CENTER, title: { value: (0, nls_1.localize)('showNotifications', "Show Notifications"), original: 'Show Notifications' }, category } });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: exports.HIDE_NOTIFICATIONS_CENTER, title: { value: (0, nls_1.localize)('hideNotifications', "Hide Notifications"), original: 'Hide Notifications' }, category }, when: contextkeys_1.NotificationsCenterVisibleContext });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: exports.CLEAR_ALL_NOTIFICATIONS, title: { value: (0, nls_1.localize)('clearAllNotifications', "Clear All Notifications"), original: 'Clear All Notifications' }, category } });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, { command: { id: FOCUS_NOTIFICATION_TOAST, title: { value: (0, nls_1.localize)('focusNotificationToasts', "Focus Notification Toast"), original: 'Focus Notification Toast' }, category }, when: contextkeys_1.NotificationsToastsVisibleContext });
    }
    exports.registerNotificationCommands = registerNotificationCommands;
});
//# sourceMappingURL=notificationsCommands.js.map