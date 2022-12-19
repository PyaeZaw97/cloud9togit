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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/platform/ipc/electron-sandbox/services", "vs/base/common/event", "vs/platform/instantiation/common/extensions"], function (require, exports, userDataSync_1, services_1, event_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataAutoSyncService = class UserDataAutoSyncService {
        constructor(sharedProcessService) {
            this.channel = sharedProcessService.getChannel('userDataAutoSync');
        }
        get onError() { return event_1.Event.map(this.channel.listen('onError'), e => userDataSync_1.UserDataSyncError.toUserDataSyncError(e)); }
        triggerSync(sources, hasToLimitSync, disableCache) {
            return this.channel.call('triggerSync', [sources, hasToLimitSync, disableCache]);
        }
        turnOn() {
            return this.channel.call('turnOn');
        }
        turnOff(everywhere) {
            return this.channel.call('turnOff', [everywhere]);
        }
    };
    UserDataAutoSyncService = __decorate([
        __param(0, services_1.ISharedProcessService)
    ], UserDataAutoSyncService);
    (0, extensions_1.registerSingleton)(userDataSync_1.IUserDataAutoSyncService, UserDataAutoSyncService);
});
//# sourceMappingURL=userDataAutoSyncService.js.map