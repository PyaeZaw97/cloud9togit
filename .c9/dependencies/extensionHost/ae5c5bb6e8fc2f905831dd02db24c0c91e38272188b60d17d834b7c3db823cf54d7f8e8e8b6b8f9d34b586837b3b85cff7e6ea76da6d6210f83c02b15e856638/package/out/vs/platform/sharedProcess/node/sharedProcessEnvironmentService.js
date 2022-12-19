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
define(["require", "exports", "vs/base/common/decorators", "vs/base/common/network", "vs/platform/environment/node/environmentService"], function (require, exports, decorators_1, network_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SharedProcessEnvironmentService = void 0;
    class SharedProcessEnvironmentService extends environmentService_1.NativeEnvironmentService {
        get userRoamingDataHome() { return this.appSettingsHome.with({ scheme: network_1.Schemas.vscodeUserData }); }
    }
    __decorate([
        decorators_1.memoize
    ], SharedProcessEnvironmentService.prototype, "userRoamingDataHome", null);
    exports.SharedProcessEnvironmentService = SharedProcessEnvironmentService;
});
//# sourceMappingURL=sharedProcessEnvironmentService.js.map