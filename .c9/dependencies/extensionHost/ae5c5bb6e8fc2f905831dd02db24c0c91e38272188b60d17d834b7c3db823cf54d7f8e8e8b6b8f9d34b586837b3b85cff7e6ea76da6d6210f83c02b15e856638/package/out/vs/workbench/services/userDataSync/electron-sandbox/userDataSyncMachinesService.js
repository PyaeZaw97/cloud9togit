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
define(["require", "exports", "vs/platform/ipc/electron-sandbox/services", "vs/base/common/lifecycle", "vs/platform/instantiation/common/extensions", "vs/platform/userDataSync/common/userDataSyncMachines"], function (require, exports, services_1, lifecycle_1, extensions_1, userDataSyncMachines_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncMachinesService = class UserDataSyncMachinesService extends lifecycle_1.Disposable {
        constructor(sharedProcessService) {
            super();
            this.channel = sharedProcessService.getChannel('userDataSyncMachines');
        }
        get onDidChange() { return this.channel.listen('onDidChange'); }
        getMachines() {
            return this.channel.call('getMachines');
        }
        addCurrentMachine() {
            return this.channel.call('addCurrentMachine');
        }
        removeCurrentMachine() {
            return this.channel.call('removeCurrentMachine');
        }
        renameMachine(machineId, name) {
            return this.channel.call('renameMachine', [machineId, name]);
        }
        setEnablements(enablements) {
            return this.channel.call('setEnablements', enablements);
        }
    };
    UserDataSyncMachinesService = __decorate([
        __param(0, services_1.ISharedProcessService)
    ], UserDataSyncMachinesService);
    (0, extensions_1.registerSingleton)(userDataSyncMachines_1.IUserDataSyncMachinesService, UserDataSyncMachinesService);
});
//# sourceMappingURL=userDataSyncMachinesService.js.map