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
define(["require", "exports", "vs/platform/workspaces/common/workspaces", "vs/platform/ipc/electron-sandbox/services", "vs/platform/instantiation/common/extensions", "vs/base/parts/ipc/common/ipc", "vs/platform/native/electron-sandbox/native"], function (require, exports, workspaces_1, services_1, extensions_1, ipc_1, native_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeWorkspacesService = void 0;
    // @ts-ignore: interface is implemented via proxy
    let NativeWorkspacesService = class NativeWorkspacesService {
        constructor(mainProcessService, nativeHostService) {
            return ipc_1.ProxyChannel.toService(mainProcessService.getChannel('workspaces'), { context: nativeHostService.windowId });
        }
    };
    NativeWorkspacesService = __decorate([
        __param(0, services_1.IMainProcessService),
        __param(1, native_1.INativeHostService)
    ], NativeWorkspacesService);
    exports.NativeWorkspacesService = NativeWorkspacesService;
    (0, extensions_1.registerSingleton)(workspaces_1.IWorkspacesService, NativeWorkspacesService, true);
});
//# sourceMappingURL=workspacesService.js.map