/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/extensions", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/userDataSync/browser/userDataSyncEnablementService"], function (require, exports, extensions_1, userDataSync_1, userDataSyncEnablementService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebUserDataSyncEnablementService = void 0;
    class WebUserDataSyncEnablementService extends userDataSyncEnablementService_1.UserDataSyncEnablementService {
        constructor() {
            super(...arguments);
            this.enabled = undefined;
        }
        canToggleEnablement() {
            return this.isTrusted() && super.canToggleEnablement();
        }
        isEnabled() {
            var _a, _b;
            if (!this.isTrusted()) {
                return false;
            }
            if (this.enabled === undefined) {
                this.enabled = (_b = (_a = this.workbenchEnvironmentService.options) === null || _a === void 0 ? void 0 : _a.settingsSyncOptions) === null || _b === void 0 ? void 0 : _b.enabled;
            }
            if (this.enabled === undefined) {
                this.enabled = super.isEnabled();
            }
            return this.enabled;
        }
        setEnablement(enabled) {
            var _a, _b;
            if (enabled && !this.canToggleEnablement()) {
                return;
            }
            if (this.enabled !== enabled) {
                this.enabled = enabled;
                super.setEnablement(enabled);
                if ((_b = (_a = this.workbenchEnvironmentService.options) === null || _a === void 0 ? void 0 : _a.settingsSyncOptions) === null || _b === void 0 ? void 0 : _b.enablementHandler) {
                    this.workbenchEnvironmentService.options.settingsSyncOptions.enablementHandler(this.enabled);
                }
            }
        }
        getResourceSyncStateVersion(resource) {
            var _a, _b;
            return resource === "extensions" /* SyncResource.Extensions */ ? (_b = (_a = this.workbenchEnvironmentService.options) === null || _a === void 0 ? void 0 : _a.settingsSyncOptions) === null || _b === void 0 ? void 0 : _b.extensionsSyncStateVersion : undefined;
        }
        isTrusted() {
            var _a, _b;
            return !!((_b = (_a = this.workbenchEnvironmentService.options) === null || _a === void 0 ? void 0 : _a.workspaceProvider) === null || _b === void 0 ? void 0 : _b.trusted);
        }
    }
    exports.WebUserDataSyncEnablementService = WebUserDataSyncEnablementService;
    (0, extensions_1.registerSingleton)(userDataSync_1.IUserDataSyncEnablementService, WebUserDataSyncEnablementService);
});
//# sourceMappingURL=webUserDataSyncEnablementService.js.map