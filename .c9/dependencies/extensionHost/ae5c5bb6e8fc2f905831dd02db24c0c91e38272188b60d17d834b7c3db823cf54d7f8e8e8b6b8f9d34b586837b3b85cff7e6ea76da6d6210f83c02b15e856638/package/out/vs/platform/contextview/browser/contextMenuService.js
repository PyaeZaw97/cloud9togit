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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "./contextMenuHandler", "./contextView"], function (require, exports, dom_1, event_1, lifecycle_1, keybinding_1, notification_1, telemetry_1, themeService_1, contextMenuHandler_1, contextView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextMenuService = void 0;
    let ContextMenuService = class ContextMenuService extends lifecycle_1.Disposable {
        constructor(telemetryService, notificationService, contextViewService, keybindingService, themeService) {
            super();
            this._onDidShowContextMenu = new event_1.Emitter();
            this.onDidShowContextMenu = this._onDidShowContextMenu.event;
            this._onDidHideContextMenu = new event_1.Emitter();
            this.onDidHideContextMenu = this._onDidHideContextMenu.event;
            this.contextMenuHandler = new contextMenuHandler_1.ContextMenuHandler(contextViewService, telemetryService, notificationService, keybindingService, themeService);
        }
        configure(options) {
            this.contextMenuHandler.configure(options);
        }
        // ContextMenu
        showContextMenu(delegate) {
            this.contextMenuHandler.showContextMenu(Object.assign(Object.assign({}, delegate), { onHide: (didCancel) => {
                    if (delegate.onHide) {
                        delegate.onHide(didCancel);
                    }
                    this._onDidHideContextMenu.fire();
                } }));
            dom_1.ModifierKeyEmitter.getInstance().resetKeyStatus();
            this._onDidShowContextMenu.fire();
        }
    };
    ContextMenuService = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, notification_1.INotificationService),
        __param(2, contextView_1.IContextViewService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, themeService_1.IThemeService)
    ], ContextMenuService);
    exports.ContextMenuService = ContextMenuService;
});
//# sourceMappingURL=contextMenuService.js.map