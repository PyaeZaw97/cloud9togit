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
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostTypes", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/platform/log/common/log", "vs/base/common/arrays", "vs/base/common/strings", "vs/base/common/path"], function (require, exports, uri_1, extHost_protocol_1, extHostTypes_1, instantiation_1, extHostRpcService_1, log_1, arrays_1, strings_1, path_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostDecorations = exports.ExtHostDecorations = void 0;
    let ExtHostDecorations = class ExtHostDecorations {
        constructor(extHostRpc, _logService) {
            this._logService = _logService;
            this._provider = new Map();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadDecorations);
        }
        registerFileDecorationProvider(provider, extensionId) {
            const handle = ExtHostDecorations._handlePool++;
            this._provider.set(handle, { provider, extensionId });
            this._proxy.$registerDecorationProvider(handle, extensionId.value);
            const listener = provider.onDidChangeFileDecorations && provider.onDidChangeFileDecorations(e => {
                if (!e) {
                    this._proxy.$onDidChange(handle, null);
                    return;
                }
                let array = (0, arrays_1.asArray)(e);
                if (array.length <= ExtHostDecorations._maxEventSize) {
                    this._proxy.$onDidChange(handle, array);
                    return;
                }
                // too many resources per event. pick one resource per folder, starting
                // with parent folders
                this._logService.warn('[Decorations] CAPPING events from decorations provider', extensionId.value, array.length);
                const mapped = array.map(uri => ({ uri, rank: (0, strings_1.count)(uri.path, '/') }));
                const groups = (0, arrays_1.groupBy)(mapped, (a, b) => a.rank - b.rank || (0, strings_1.compare)(a.uri.path, b.uri.path));
                let picked = [];
                outer: for (let uris of groups) {
                    let lastDirname;
                    for (let obj of uris) {
                        let myDirname = (0, path_1.dirname)(obj.uri.path);
                        if (lastDirname !== myDirname) {
                            lastDirname = myDirname;
                            if (picked.push(obj.uri) >= ExtHostDecorations._maxEventSize) {
                                break outer;
                            }
                        }
                    }
                }
                this._proxy.$onDidChange(handle, picked);
            });
            return new extHostTypes_1.Disposable(() => {
                listener === null || listener === void 0 ? void 0 : listener.dispose();
                this._proxy.$unregisterDecorationProvider(handle);
                this._provider.delete(handle);
            });
        }
        async $provideDecorations(handle, requests, token) {
            if (!this._provider.has(handle)) {
                // might have been unregistered in the meantime
                return Object.create(null);
            }
            const result = Object.create(null);
            const { provider, extensionId } = this._provider.get(handle);
            await Promise.all(requests.map(async (request) => {
                try {
                    const { uri, id } = request;
                    const data = await Promise.resolve(provider.provideFileDecoration(uri_1.URI.revive(uri), token));
                    if (!data) {
                        return;
                    }
                    try {
                        extHostTypes_1.FileDecoration.validate(data);
                        result[id] = [data.propagate, data.tooltip, data.badge, data.color];
                    }
                    catch (e) {
                        this._logService.warn(`INVALID decoration from extension '${extensionId.value}': ${e}`);
                    }
                }
                catch (err) {
                    this._logService.error(err);
                }
            }));
            return result;
        }
    };
    ExtHostDecorations._handlePool = 0;
    ExtHostDecorations._maxEventSize = 250;
    ExtHostDecorations = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, log_1.ILogService)
    ], ExtHostDecorations);
    exports.ExtHostDecorations = ExtHostDecorations;
    exports.IExtHostDecorations = (0, instantiation_1.createDecorator)('IExtHostDecorations');
});
//# sourceMappingURL=extHostDecorations.js.map