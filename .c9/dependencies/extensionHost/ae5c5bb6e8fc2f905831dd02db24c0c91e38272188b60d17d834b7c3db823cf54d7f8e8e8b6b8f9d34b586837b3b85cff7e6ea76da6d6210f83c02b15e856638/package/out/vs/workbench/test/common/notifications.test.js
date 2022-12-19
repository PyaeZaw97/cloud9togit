/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/common/notifications", "vs/base/common/actions", "vs/platform/notification/common/notification", "vs/base/common/errorMessage", "vs/workbench/services/notification/common/notificationService", "vs/workbench/test/common/workbenchTestServices", "vs/base/common/async"], function (require, exports, assert, notifications_1, actions_1, notification_1, errorMessage_1, notificationService_1, workbenchTestServices_1, async_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Notifications', () => {
        test('Items', () => {
            // Invalid
            assert.ok(!notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: '' }));
            assert.ok(!notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: null }));
            // Duplicates
            let item1 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' });
            let item2 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' });
            let item3 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Info, message: 'Info Message' });
            let item4 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message', source: 'Source' });
            let item5 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message', actions: { primary: [new actions_1.Action('id', 'label')] } });
            let item6 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message', actions: { primary: [new actions_1.Action('id', 'label')] }, progress: { infinite: true } });
            assert.strictEqual(item1.equals(item1), true);
            assert.strictEqual(item2.equals(item2), true);
            assert.strictEqual(item3.equals(item3), true);
            assert.strictEqual(item4.equals(item4), true);
            assert.strictEqual(item5.equals(item5), true);
            assert.strictEqual(item1.equals(item2), true);
            assert.strictEqual(item1.equals(item3), false);
            assert.strictEqual(item1.equals(item4), false);
            assert.strictEqual(item1.equals(item5), false);
            let itemId1 = notifications_1.NotificationViewItem.create({ id: 'same', message: 'Info Message', severity: notification_1.Severity.Info });
            let itemId2 = notifications_1.NotificationViewItem.create({ id: 'same', message: 'Error Message', severity: notification_1.Severity.Error });
            assert.strictEqual(itemId1.equals(itemId2), true);
            assert.strictEqual(itemId1.equals(item3), false);
            // Progress
            assert.strictEqual(item1.hasProgress, false);
            assert.strictEqual(item6.hasProgress, true);
            // Message Box
            assert.strictEqual(item5.canCollapse, false);
            assert.strictEqual(item5.expanded, true);
            // Events
            let called = 0;
            item1.onDidChangeExpansion(() => {
                called++;
            });
            item1.expand();
            item1.expand();
            item1.collapse();
            item1.collapse();
            assert.strictEqual(called, 2);
            called = 0;
            item1.onDidChangeContent(e => {
                if (e.kind === 3 /* NotificationViewItemContentChangeKind.PROGRESS */) {
                    called++;
                }
            });
            item1.progress.infinite();
            item1.progress.done();
            assert.strictEqual(called, 2);
            called = 0;
            item1.onDidChangeContent(e => {
                if (e.kind === 1 /* NotificationViewItemContentChangeKind.MESSAGE */) {
                    called++;
                }
            });
            item1.updateMessage('message update');
            called = 0;
            item1.onDidChangeContent(e => {
                if (e.kind === 0 /* NotificationViewItemContentChangeKind.SEVERITY */) {
                    called++;
                }
            });
            item1.updateSeverity(notification_1.Severity.Error);
            called = 0;
            item1.onDidChangeContent(e => {
                if (e.kind === 2 /* NotificationViewItemContentChangeKind.ACTIONS */) {
                    called++;
                }
            });
            item1.updateActions({ primary: [new actions_1.Action('id2', 'label')] });
            assert.strictEqual(called, 1);
            called = 0;
            item1.onDidChangeVisibility(e => {
                called++;
            });
            item1.updateVisibility(true);
            item1.updateVisibility(false);
            item1.updateVisibility(false);
            assert.strictEqual(called, 2);
            called = 0;
            item1.onDidClose(() => {
                called++;
            });
            item1.close();
            assert.strictEqual(called, 1);
            // Error with Action
            let item7 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: (0, errorMessage_1.createErrorWithActions)('Hello Error', [new actions_1.Action('id', 'label')]) });
            assert.strictEqual(item7.actions.primary.length, 1);
            // Filter
            let item8 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' }, notification_1.NotificationsFilter.SILENT);
            assert.strictEqual(item8.silent, true);
            let item9 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' }, notification_1.NotificationsFilter.OFF);
            assert.strictEqual(item9.silent, false);
            let item10 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' }, notification_1.NotificationsFilter.ERROR);
            assert.strictEqual(item10.silent, false);
            let item11 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Warning, message: 'Error Message' }, notification_1.NotificationsFilter.ERROR);
            assert.strictEqual(item11.silent, true);
        });
        test('Items - does not fire changed when message did not change (content, severity)', async () => {
            const item1 = notifications_1.NotificationViewItem.create({ severity: notification_1.Severity.Error, message: 'Error Message' });
            let fired = false;
            item1.onDidChangeContent(() => {
                fired = true;
            });
            item1.updateMessage('Error Message');
            await (0, async_1.timeout)(0);
            assert.ok(!fired, 'Expected onDidChangeContent to not be fired');
            item1.updateSeverity(notification_1.Severity.Error);
            await (0, async_1.timeout)(0);
            assert.ok(!fired, 'Expected onDidChangeContent to not be fired');
        });
        test('Model', () => {
            const model = new notifications_1.NotificationsModel();
            let lastNotificationEvent;
            model.onDidChangeNotification(e => {
                lastNotificationEvent = e;
            });
            let lastStatusMessageEvent;
            model.onDidChangeStatusMessage(e => {
                lastStatusMessageEvent = e;
            });
            let item1 = { severity: notification_1.Severity.Error, message: 'Error Message', actions: { primary: [new actions_1.Action('id', 'label')] } };
            let item2 = { severity: notification_1.Severity.Warning, message: 'Warning Message', source: 'Some Source' };
            let item2Duplicate = { severity: notification_1.Severity.Warning, message: 'Warning Message', source: 'Some Source' };
            let item3 = { severity: notification_1.Severity.Info, message: 'Info Message' };
            let item1Handle = model.addNotification(item1);
            assert.strictEqual(lastNotificationEvent.item.severity, item1.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item1.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 0 /* NotificationChangeType.ADD */);
            item1Handle.updateMessage('Different Error Message');
            assert.strictEqual(lastNotificationEvent.kind, 1 /* NotificationChangeType.CHANGE */);
            assert.strictEqual(lastNotificationEvent.detail, 1 /* NotificationViewItemContentChangeKind.MESSAGE */);
            item1Handle.updateSeverity(notification_1.Severity.Warning);
            assert.strictEqual(lastNotificationEvent.kind, 1 /* NotificationChangeType.CHANGE */);
            assert.strictEqual(lastNotificationEvent.detail, 0 /* NotificationViewItemContentChangeKind.SEVERITY */);
            item1Handle.updateActions({ primary: [], secondary: [] });
            assert.strictEqual(lastNotificationEvent.kind, 1 /* NotificationChangeType.CHANGE */);
            assert.strictEqual(lastNotificationEvent.detail, 2 /* NotificationViewItemContentChangeKind.ACTIONS */);
            item1Handle.progress.infinite();
            assert.strictEqual(lastNotificationEvent.kind, 1 /* NotificationChangeType.CHANGE */);
            assert.strictEqual(lastNotificationEvent.detail, 3 /* NotificationViewItemContentChangeKind.PROGRESS */);
            let item2Handle = model.addNotification(item2);
            assert.strictEqual(lastNotificationEvent.item.severity, item2.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item2.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 0 /* NotificationChangeType.ADD */);
            model.addNotification(item3);
            assert.strictEqual(lastNotificationEvent.item.severity, item3.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item3.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 0 /* NotificationChangeType.ADD */);
            assert.strictEqual(model.notifications.length, 3);
            let called = 0;
            item1Handle.onDidClose(() => {
                called++;
            });
            item1Handle.close();
            assert.strictEqual(called, 1);
            assert.strictEqual(model.notifications.length, 2);
            assert.strictEqual(lastNotificationEvent.item.severity, notification_1.Severity.Warning);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), 'Different Error Message');
            assert.strictEqual(lastNotificationEvent.index, 2);
            assert.strictEqual(lastNotificationEvent.kind, 3 /* NotificationChangeType.REMOVE */);
            model.addNotification(item2Duplicate);
            assert.strictEqual(model.notifications.length, 2);
            assert.strictEqual(lastNotificationEvent.item.severity, item2Duplicate.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item2Duplicate.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 0 /* NotificationChangeType.ADD */);
            item2Handle.close();
            assert.strictEqual(model.notifications.length, 1);
            assert.strictEqual(lastNotificationEvent.item.severity, item2Duplicate.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item2Duplicate.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 3 /* NotificationChangeType.REMOVE */);
            model.notifications[0].expand();
            assert.strictEqual(lastNotificationEvent.item.severity, item3.severity);
            assert.strictEqual(lastNotificationEvent.item.message.linkedText.toString(), item3.message);
            assert.strictEqual(lastNotificationEvent.index, 0);
            assert.strictEqual(lastNotificationEvent.kind, 2 /* NotificationChangeType.EXPAND_COLLAPSE */);
            const disposable = model.showStatusMessage('Hello World');
            assert.strictEqual(model.statusMessage.message, 'Hello World');
            assert.strictEqual(lastStatusMessageEvent.item.message, model.statusMessage.message);
            assert.strictEqual(lastStatusMessageEvent.kind, 0 /* StatusMessageChangeType.ADD */);
            disposable.dispose();
            assert.ok(!model.statusMessage);
            assert.strictEqual(lastStatusMessageEvent.kind, 1 /* StatusMessageChangeType.REMOVE */);
            let disposable2 = model.showStatusMessage('Hello World 2');
            const disposable3 = model.showStatusMessage('Hello World 3');
            assert.strictEqual(model.statusMessage.message, 'Hello World 3');
            disposable2.dispose();
            assert.strictEqual(model.statusMessage.message, 'Hello World 3');
            disposable3.dispose();
            assert.ok(!model.statusMessage);
        });
        test('Service', async () => {
            const service = new notificationService_1.NotificationService(new workbenchTestServices_1.TestStorageService());
            let addNotificationCount = 0;
            let notification;
            service.onDidAddNotification(n => {
                addNotificationCount++;
                notification = n;
            });
            service.info('hello there');
            assert.strictEqual(addNotificationCount, 1);
            assert.strictEqual(notification.message, 'hello there');
            assert.strictEqual(notification.silent, false);
            assert.strictEqual(notification.source, undefined);
            let notificationHandle = service.notify({ message: 'important message', severity: notification_1.Severity.Warning });
            assert.strictEqual(addNotificationCount, 2);
            assert.strictEqual(notification.message, 'important message');
            assert.strictEqual(notification.severity, notification_1.Severity.Warning);
            let removeNotificationCount = 0;
            service.onDidRemoveNotification(n => {
                removeNotificationCount++;
                notification = n;
            });
            notificationHandle.close();
            assert.strictEqual(removeNotificationCount, 1);
            assert.strictEqual(notification.message, 'important message');
            notificationHandle = service.notify({ silent: true, message: 'test', severity: notification_1.Severity.Ignore });
            assert.strictEqual(addNotificationCount, 3);
            assert.strictEqual(notification.message, 'test');
            assert.strictEqual(notification.silent, true);
            notificationHandle.close();
            assert.strictEqual(removeNotificationCount, 2);
        });
    });
});
//# sourceMappingURL=notifications.test.js.map