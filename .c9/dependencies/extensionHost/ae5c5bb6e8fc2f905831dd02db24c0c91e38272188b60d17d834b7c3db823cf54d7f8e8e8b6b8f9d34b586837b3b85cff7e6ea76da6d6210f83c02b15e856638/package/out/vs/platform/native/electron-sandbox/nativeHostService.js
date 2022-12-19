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
define(["require", "exports", "vs/base/parts/ipc/common/ipc", "vs/platform/ipc/electron-sandbox/services"], function (require, exports, ipc_1, services_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeHostService = void 0;
    // @ts-ignore: interface is implemented via proxy
    let NativeHostService = class NativeHostService {
        constructor(windowId, mainProcessService) {
            this.windowId = windowId;
            return ipc_1.ProxyChannel.toService(mainProcessService.getChannel('nativeHost'), {
                context: windowId,
                properties: (() => {
                    const properties = new Map();
                    properties.set('windowId', windowId);
                    return properties;
                })()
            });
        }
    };
    NativeHostService = __decorate([
        __param(1, services_1.IMainProcessService)
    ], NativeHostService);
    exports.NativeHostService = NativeHostService;
});
//# sourceMappingURL=nativeHostService.js.map