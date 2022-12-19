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
define(["require", "exports", "vs/base/parts/ipc/common/ipc", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/extensions", "vs/platform/instantiation/common/instantiation"], function (require, exports, ipc_1, descriptors_1, extensions_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.registerSharedProcessRemoteService = exports.ISharedProcessService = exports.registerMainProcessRemoteService = exports.IMainProcessService = void 0;
    class RemoteServiceStub {
        constructor(channelName, options, remote) {
            const channel = remote.getChannel(channelName);
            if (isRemoteServiceWithChannelClientOptions(options)) {
                return new options.channelClientCtor(channel);
            }
            return ipc_1.ProxyChannel.toService(channel, options === null || options === void 0 ? void 0 : options.proxyOptions);
        }
    }
    function isRemoteServiceWithChannelClientOptions(obj) {
        const candidate = obj;
        return !!(candidate === null || candidate === void 0 ? void 0 : candidate.channelClientCtor);
    }
    //#region Main Process
    exports.IMainProcessService = (0, instantiation_1.createDecorator)('mainProcessService');
    let MainProcessRemoteServiceStub = class MainProcessRemoteServiceStub extends RemoteServiceStub {
        constructor(channelName, options, ipcService) {
            super(channelName, options, ipcService);
        }
    };
    MainProcessRemoteServiceStub = __decorate([
        __param(2, exports.IMainProcessService)
    ], MainProcessRemoteServiceStub);
    function registerMainProcessRemoteService(id, channelName, options) {
        (0, extensions_1.registerSingleton)(id, new descriptors_1.SyncDescriptor(MainProcessRemoteServiceStub, [channelName, options], options === null || options === void 0 ? void 0 : options.supportsDelayedInstantiation));
    }
    exports.registerMainProcessRemoteService = registerMainProcessRemoteService;
    //#endregion
    //#region Shared Process
    exports.ISharedProcessService = (0, instantiation_1.createDecorator)('sharedProcessService');
    let SharedProcessRemoteServiceStub = class SharedProcessRemoteServiceStub extends RemoteServiceStub {
        constructor(channelName, options, ipcService) {
            super(channelName, options, ipcService);
        }
    };
    SharedProcessRemoteServiceStub = __decorate([
        __param(2, exports.ISharedProcessService)
    ], SharedProcessRemoteServiceStub);
    function registerSharedProcessRemoteService(id, channelName, options) {
        (0, extensions_1.registerSingleton)(id, new descriptors_1.SyncDescriptor(SharedProcessRemoteServiceStub, [channelName, options], options === null || options === void 0 ? void 0 : options.supportsDelayedInstantiation));
    }
    exports.registerSharedProcessRemoteService = registerSharedProcessRemoteService;
});
//#endregion
//# sourceMappingURL=services.js.map