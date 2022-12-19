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
define(["require", "exports", "vs/platform/ipc/electron-sandbox/services", "vs/platform/instantiation/common/extensions", "vs/base/common/lifecycle", "vs/base/common/event", "vs/platform/userDataSync/common/userDataSyncAccount"], function (require, exports, services_1, extensions_1, lifecycle_1, event_1, userDataSyncAccount_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncAccountService = void 0;
    let UserDataSyncAccountService = class UserDataSyncAccountService extends lifecycle_1.Disposable {
        constructor(sharedProcessService) {
            super();
            this._onDidChangeAccount = this._register(new event_1.Emitter());
            this.onDidChangeAccount = this._onDidChangeAccount.event;
            this.channel = sharedProcessService.getChannel('userDataSyncAccount');
            this.channel.call('_getInitialData').then(account => {
                this._account = account;
                this._register(this.channel.listen('onDidChangeAccount')(account => {
                    this._account = account;
                    this._onDidChangeAccount.fire(account);
                }));
            });
        }
        get account() { return this._account; }
        get onTokenFailed() { return this.channel.listen('onTokenFailed'); }
        updateAccount(account) {
            return this.channel.call('updateAccount', account);
        }
    };
    UserDataSyncAccountService = __decorate([
        __param(0, services_1.ISharedProcessService)
    ], UserDataSyncAccountService);
    exports.UserDataSyncAccountService = UserDataSyncAccountService;
    (0, extensions_1.registerSingleton)(userDataSyncAccount_1.IUserDataSyncAccountService, UserDataSyncAccountService);
});
//# sourceMappingURL=userDataSyncAccountService.js.map