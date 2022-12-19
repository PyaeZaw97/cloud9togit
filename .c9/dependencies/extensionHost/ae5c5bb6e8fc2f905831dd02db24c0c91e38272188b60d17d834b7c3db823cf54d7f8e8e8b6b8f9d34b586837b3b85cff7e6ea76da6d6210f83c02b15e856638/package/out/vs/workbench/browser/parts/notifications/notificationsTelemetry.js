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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/base/common/hash"], function (require, exports, lifecycle_1, notification_1, telemetry_1, hash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotificationsTelemetry = exports.notificationToMetrics = void 0;
    function notificationToMetrics(message, source, silent) {
        return {
            id: (0, hash_1.hash)(message.toString()).toString(),
            silent,
            source: source || 'core'
        };
    }
    exports.notificationToMetrics = notificationToMetrics;
    let NotificationsTelemetry = class NotificationsTelemetry extends lifecycle_1.Disposable {
        constructor(telemetryService, notificationService) {
            super();
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.notificationService.onDidAddNotification(notification => {
                const source = notification.source && typeof notification.source !== 'string' ? notification.source.id : notification.source;
                this.telemetryService.publicLog2('notification:show', notificationToMetrics(notification.message, source, !!notification.silent));
            }));
            this._register(this.notificationService.onDidRemoveNotification(notification => {
                const source = notification.source && typeof notification.source !== 'string' ? notification.source.id : notification.source;
                this.telemetryService.publicLog2('notification:close', notificationToMetrics(notification.message, source, !!notification.silent));
            }));
        }
    };
    NotificationsTelemetry = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, notification_1.INotificationService)
    ], NotificationsTelemetry);
    exports.NotificationsTelemetry = NotificationsTelemetry;
});
//# sourceMappingURL=notificationsTelemetry.js.map