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
define(["require", "exports", "vs/platform/userDataSync/common/userDataSync", "vs/platform/ipc/electron-sandbox/services", "vs/platform/storage/common/storage", "vs/platform/userDataSync/common/userDataSyncStoreService", "vs/platform/product/common/productService", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/userDataSync/common/userDataSyncIpc"], function (require, exports, userDataSync_1, services_1, storage_1, userDataSyncStoreService_1, productService_1, configuration_1, extensions_1, userDataSyncIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let UserDataSyncStoreManagementService = class UserDataSyncStoreManagementService extends userDataSyncStoreService_1.AbstractUserDataSyncStoreManagementService {
        constructor(productService, configurationService, storageService, sharedProcessService) {
            super(productService, configurationService, storageService);
            this.channelClient = this._register(new userDataSyncIpc_1.UserDataSyncStoreManagementServiceChannelClient(sharedProcessService.getChannel('userDataSyncStoreManagement')));
            this._register(this.channelClient.onDidChangeUserDataSyncStore(() => this.updateUserDataSyncStore()));
        }
        async switch(type) {
            return this.channelClient.switch(type);
        }
        async getPreviousUserDataSyncStore() {
            return this.channelClient.getPreviousUserDataSyncStore();
        }
    };
    UserDataSyncStoreManagementService = __decorate([
        __param(0, productService_1.IProductService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, storage_1.IStorageService),
        __param(3, services_1.ISharedProcessService)
    ], UserDataSyncStoreManagementService);
    (0, extensions_1.registerSingleton)(userDataSync_1.IUserDataSyncStoreManagementService, UserDataSyncStoreManagementService);
});
//# sourceMappingURL=userDataSyncStoreManagementService.js.map