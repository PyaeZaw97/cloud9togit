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
define(["require", "exports", "./extHost.protocol", "vs/platform/files/common/files", "vs/workbench/api/common/extHostTypes", "vs/base/common/buffer", "vs/platform/instantiation/common/instantiation", "vs/workbench/api/common/extHostRpcService", "vs/workbench/api/common/extHostFileSystemInfo", "vs/base/common/lifecycle"], function (require, exports, extHost_protocol_1, files, extHostTypes_1, buffer_1, instantiation_1, extHostRpcService_1, extHostFileSystemInfo_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostConsumerFileSystem = exports.ExtHostConsumerFileSystem = void 0;
    let ExtHostConsumerFileSystem = class ExtHostConsumerFileSystem {
        constructor(extHostRpc, fileSystemInfo) {
            this._fileSystemProvider = new Map();
            this._proxy = extHostRpc.getProxy(extHost_protocol_1.MainContext.MainThreadFileSystem);
            const that = this;
            this.value = Object.freeze({
                async stat(uri) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (!provider) {
                            return await that._proxy.$stat(uri);
                        }
                        // use shortcut
                        await that._proxy.$ensureActivation(uri.scheme);
                        const stat = await provider.stat(uri);
                        return {
                            type: stat.type,
                            ctime: stat.ctime,
                            mtime: stat.mtime,
                            size: stat.size,
                            permissions: stat.permissions
                        };
                    }
                    catch (err) {
                        ExtHostConsumerFileSystem._handleError(err);
                    }
                },
                async readDirectory(uri) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            return (await provider.readDirectory(uri)).slice(); // safe-copy
                        }
                        else {
                            return await that._proxy.$readdir(uri);
                        }
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem._handleError(err);
                    }
                },
                async createDirectory(uri) {
                    try {
                        // no shortcut: does mkdirp
                        return await that._proxy.$mkdir(uri);
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem._handleError(err);
                    }
                },
                async readFile(uri) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            return (await provider.readFile(uri)).slice(); // safe-copy
                        }
                        else {
                            const buff = await that._proxy.$readFile(uri);
                            return buff.buffer;
                        }
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem._handleError(err);
                    }
                },
                async writeFile(uri, content) {
                    try {
                        // no shortcut: does mkdirp
                        return await that._proxy.$writeFile(uri, buffer_1.VSBuffer.wrap(content));
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem._handleError(err);
                    }
                },
                async delete(uri, options) {
                    try {
                        const provider = that._fileSystemProvider.get(uri.scheme);
                        if (provider) {
                            // use shortcut
                            await that._proxy.$ensureActivation(uri.scheme);
                            return await provider.delete(uri, Object.assign({ recursive: false }, options));
                        }
                        else {
                            return await that._proxy.$delete(uri, Object.assign({ recursive: false, useTrash: false }, options));
                        }
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem._handleError(err);
                    }
                },
                async rename(oldUri, newUri, options) {
                    try {
                        // no shortcut: potentially involves different schemes, does mkdirp
                        return await that._proxy.$rename(oldUri, newUri, Object.assign({ overwrite: false }, options));
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem._handleError(err);
                    }
                },
                async copy(source, destination, options) {
                    try {
                        // no shortcut: potentially involves different schemes, does mkdirp
                        return await that._proxy.$copy(source, destination, Object.assign({ overwrite: false }, options));
                    }
                    catch (err) {
                        return ExtHostConsumerFileSystem._handleError(err);
                    }
                },
                isWritableFileSystem(scheme) {
                    const capabilities = fileSystemInfo.getCapabilities(scheme);
                    if (typeof capabilities === 'number') {
                        return !(capabilities & 2048 /* files.FileSystemProviderCapabilities.Readonly */);
                    }
                    return undefined;
                }
            });
        }
        static _handleError(err) {
            // desired error type
            if (err instanceof extHostTypes_1.FileSystemError) {
                throw err;
            }
            // generic error
            if (!(err instanceof Error)) {
                throw new extHostTypes_1.FileSystemError(String(err));
            }
            // no provider (unknown scheme) error
            if (err.name === 'ENOPRO') {
                throw extHostTypes_1.FileSystemError.Unavailable(err.message);
            }
            // file system error
            switch (err.name) {
                case files.FileSystemProviderErrorCode.FileExists: throw extHostTypes_1.FileSystemError.FileExists(err.message);
                case files.FileSystemProviderErrorCode.FileNotFound: throw extHostTypes_1.FileSystemError.FileNotFound(err.message);
                case files.FileSystemProviderErrorCode.FileNotADirectory: throw extHostTypes_1.FileSystemError.FileNotADirectory(err.message);
                case files.FileSystemProviderErrorCode.FileIsADirectory: throw extHostTypes_1.FileSystemError.FileIsADirectory(err.message);
                case files.FileSystemProviderErrorCode.NoPermissions: throw extHostTypes_1.FileSystemError.NoPermissions(err.message);
                case files.FileSystemProviderErrorCode.Unavailable: throw extHostTypes_1.FileSystemError.Unavailable(err.message);
                default: throw new extHostTypes_1.FileSystemError(err.message, err.name);
            }
        }
        // ---
        addFileSystemProvider(scheme, provider) {
            this._fileSystemProvider.set(scheme, provider);
            return (0, lifecycle_1.toDisposable)(() => this._fileSystemProvider.delete(scheme));
        }
    };
    ExtHostConsumerFileSystem = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostFileSystemInfo_1.IExtHostFileSystemInfo)
    ], ExtHostConsumerFileSystem);
    exports.ExtHostConsumerFileSystem = ExtHostConsumerFileSystem;
    exports.IExtHostConsumerFileSystem = (0, instantiation_1.createDecorator)('IExtHostConsumerFileSystem');
});
//# sourceMappingURL=extHostFileSystemConsumer.js.map