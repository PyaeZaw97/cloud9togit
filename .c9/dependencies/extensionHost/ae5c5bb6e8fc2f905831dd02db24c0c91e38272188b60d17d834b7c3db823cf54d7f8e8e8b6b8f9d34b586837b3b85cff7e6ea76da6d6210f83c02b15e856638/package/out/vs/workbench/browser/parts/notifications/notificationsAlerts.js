/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/ui/aria/aria", "vs/nls", "vs/base/common/lifecycle", "vs/base/common/errorMessage", "vs/platform/notification/common/notification", "vs/base/common/event"], function (require, exports, aria_1, nls_1, lifecycle_1, errorMessage_1, notification_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationsAlerts = void 0;
    class NotificationsAlerts extends lifecycle_1.Disposable {
        constructor(model) {
            super();
            this.model = model;
            // Alert initial notifications if any
            for (const notification of model.notifications) {
                this.triggerAriaAlert(notification);
            }
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.model.onDidChangeNotification(e => this.onDidChangeNotification(e)));
        }
        onDidChangeNotification(e) {
            if (e.kind === 0 /* NotificationChangeType.ADD */) {
                // ARIA alert for screen readers
                this.triggerAriaAlert(e.item);
                // Always log errors to console with full details
                if (e.item.severity === notification_1.Severity.Error) {
                    if (e.item.message.original instanceof Error) {
                        console.error(e.item.message.original);
                    }
                    else {
                        console.error((0, errorMessage_1.toErrorMessage)(e.item.message.linkedText.toString(), true));
                    }
                }
            }
        }
        triggerAriaAlert(notification) {
            if (notification.silent) {
                return;
            }
            // Trigger the alert again whenever the message changes
            const listener = notification.onDidChangeContent(e => {
                if (e.kind === 1 /* NotificationViewItemContentChangeKind.MESSAGE */) {
                    this.doTriggerAriaAlert(notification);
                }
            });
            event_1.Event.once(notification.onDidClose)(() => listener.dispose());
            this.doTriggerAriaAlert(notification);
        }
        doTriggerAriaAlert(notification) {
            let alertText;
            if (notification.severity === notification_1.Severity.Error) {
                alertText = (0, nls_1.localize)('alertErrorMessage', "Error: {0}", notification.message.linkedText.toString());
            }
            else if (notification.severity === notification_1.Severity.Warning) {
                alertText = (0, nls_1.localize)('alertWarningMessage', "Warning: {0}", notification.message.linkedText.toString());
            }
            else {
                alertText = (0, nls_1.localize)('alertInfoMessage', "Info: {0}", notification.message.linkedText.toString());
            }
            (0, aria_1.alert)(alertText);
        }
    }
    exports.NotificationsAlerts = NotificationsAlerts;
});
//# sourceMappingURL=notificationsAlerts.js.map