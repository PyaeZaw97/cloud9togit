/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/userDataSync/common/userDataSync", "vs/platform/userDataSync/common/userDataSyncEnablementService"], function (require, exports, extensions_1, userDataSync_1, userDataSyncEnablementService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserDataSyncEnablementService = void 0;
    class UserDataSyncEnablementService extends userDataSyncEnablementService_1.UserDataSyncEnablementService {
        get workbenchEnvironmentService() { return this.environmentService; }
        getResourceSyncStateVersion(resource) {
            var _a, _b;
            return resource === "extensions" /* SyncResource.Extensions */ ? (_b = (_a = this.workbenchEnvironmentService.options) === null || _a === void 0 ? void 0 : _a.settingsSyncOptions) === null || _b === void 0 ? void 0 : _b.extensionsSyncStateVersion : undefined;
        }
    }
    exports.UserDataSyncEnablementService = UserDataSyncEnablementService;
    (0, extensions_1.registerSingleton)(userDataSync_1.IUserDataSyncEnablementService, UserDataSyncEnablementService);
});
//# sourceMappingURL=userDataSyncEnablementService.js.map