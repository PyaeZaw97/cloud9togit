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
define(["require", "exports", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/extensionManagement/common/extensionStorage", "vs/platform/storage/common/storage"], function (require, exports, extensionManagement_1, extensionStorage_1, storage_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsCleaner = void 0;
    let ExtensionsCleaner = class ExtensionsCleaner {
        constructor(extensionManagementService, storageService) {
            extensionStorage_1.ExtensionStorageService.removeOutdatedExtensionVersions(extensionManagementService, storageService);
        }
    };
    ExtensionsCleaner = __decorate([
        __param(0, extensionManagement_1.IExtensionManagementService),
        __param(1, storage_1.IStorageService)
    ], ExtensionsCleaner);
    exports.ExtensionsCleaner = ExtensionsCleaner;
});
//# sourceMappingURL=extensionsCleaner.js.map