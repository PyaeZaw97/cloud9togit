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
define(["require", "exports", "vs/platform/log/common/log", "vs/platform/registry/common/platform", "vs/platform/storage/common/storage", "vs/workbench/services/profiles/common/profileStorageRegistry"], function (require, exports, log_1, platform_1, storage_1, profileStorageRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GlobalStateProfile = void 0;
    let GlobalStateProfile = class GlobalStateProfile {
        constructor(storageService, logService) {
            this.storageService = storageService;
            this.logService = logService;
        }
        async getProfileContent() {
            const globalState = await this.getLocalGlobalState();
            return JSON.stringify(globalState);
        }
        async applyProfile(content) {
            const globalState = JSON.parse(content);
            await this.writeLocalGlobalState(globalState);
        }
        async getLocalGlobalState() {
            const storage = {};
            for (const { key } of platform_1.Registry.as(profileStorageRegistry_1.Extensions.ProfileStorageRegistry).all) {
                const value = this.storageService.get(key, 0 /* StorageScope.GLOBAL */);
                if (value) {
                    storage[key] = value;
                }
            }
            return { storage };
        }
        async writeLocalGlobalState(globalState) {
            const profileKeys = Object.keys(globalState.storage);
            const updatedStorage = globalState.storage;
            for (const { key } of platform_1.Registry.as(profileStorageRegistry_1.Extensions.ProfileStorageRegistry).all) {
                if (!profileKeys.includes(key)) {
                    // Remove the key if it does not exist in the profile
                    updatedStorage[key] = undefined;
                }
            }
            const updatedStorageKeys = Object.keys(updatedStorage);
            if (updatedStorageKeys.length) {
                this.logService.trace(`Profile: Updating global state...`);
                for (const key of updatedStorageKeys) {
                    this.storageService.store(key, globalState.storage[key], 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                }
                this.logService.info(`Profile: Updated global state`, updatedStorageKeys);
            }
        }
    };
    GlobalStateProfile = __decorate([
        __param(0, storage_1.IStorageService),
        __param(1, log_1.ILogService)
    ], GlobalStateProfile);
    exports.GlobalStateProfile = GlobalStateProfile;
});
//# sourceMappingURL=globalStateProfile.js.map