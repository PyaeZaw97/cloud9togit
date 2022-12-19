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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/files/common/files", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol", "vs/base/common/buffer", "vs/platform/workspace/common/workspace", "vs/platform/log/common/log", "vs/platform/configuration/common/configuration", "vs/workbench/services/files/common/files"], function (require, exports, event_1, lifecycle_1, uri_1, files_1, extHostCustomers_1, extHost_protocol_1, buffer_1, workspace_1, log_1, configuration_1, files_2) {
    "use strict";
    var MainThreadFileSystem_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadFileSystem = void 0;
    let MainThreadFileSystem = MainThreadFileSystem_1 = class MainThreadFileSystem {
        constructor(extHostContext, _fileService, _contextService, _logService, _configurationService) {
            this._fileService = _fileService;
            this._contextService = _contextService;
            this._logService = _logService;
            this._configurationService = _configurationService;
            this._fileProvider = new Map();
            this._disposables = new lifecycle_1.DisposableStore();
            this._watches = new Map();
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostFileSystem);
            const infoProxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostFileSystemInfo);
            for (let entry of _fileService.listCapabilities()) {
                infoProxy.$acceptProviderInfos(uri_1.URI.from({ scheme: entry.scheme, path: '/dummy' }), entry.capabilities);
            }
            this._disposables.add(_fileService.onDidChangeFileSystemProviderRegistrations(e => { var _a, _b; return infoProxy.$acceptProviderInfos(uri_1.URI.from({ scheme: e.scheme, path: '/dummy' }), (_b = (_a = e.provider) === null || _a === void 0 ? void 0 : _a.capabilities) !== null && _b !== void 0 ? _b : null); }));
            this._disposables.add(_fileService.onDidChangeFileSystemProviderCapabilities(e => infoProxy.$acceptProviderInfos(uri_1.URI.from({ scheme: e.scheme, path: '/dummy' }), e.provider.capabilities)));
        }
        dispose() {
            this._disposables.dispose();
            (0, lifecycle_1.dispose)(this._fileProvider.values());
            (0, lifecycle_1.dispose)(this._watches.values());
            this._fileProvider.clear();
        }
        async $registerFileSystemProvider(handle, scheme, capabilities) {
            this._fileProvider.set(handle, new RemoteFileSystemProvider(this._fileService, scheme, capabilities, handle, this._proxy));
        }
        $unregisterProvider(handle) {
            var _a;
            (_a = this._fileProvider.get(handle)) === null || _a === void 0 ? void 0 : _a.dispose();
            this._fileProvider.delete(handle);
        }
        $onFileSystemChange(handle, changes) {
            const fileProvider = this._fileProvider.get(handle);
            if (!fileProvider) {
                throw new Error('Unknown file provider');
            }
            fileProvider.$onFileSystemChange(changes);
        }
        // --- consumer fs, vscode.workspace.fs
        $stat(uri) {
            return this._fileService.stat(uri_1.URI.revive(uri)).then(stat => {
                return {
                    ctime: stat.ctime,
                    mtime: stat.mtime,
                    size: stat.size,
                    permissions: stat.readonly ? files_1.FilePermission.Readonly : undefined,
                    type: MainThreadFileSystem_1._asFileType(stat)
                };
            }).catch(MainThreadFileSystem_1._handleError);
        }
        $readdir(uri) {
            return this._fileService.resolve(uri_1.URI.revive(uri), { resolveMetadata: false }).then(stat => {
                if (!stat.isDirectory) {
                    const err = new Error(stat.name);
                    err.name = files_1.FileSystemProviderErrorCode.FileNotADirectory;
                    throw err;
                }
                return !stat.children ? [] : stat.children.map(child => [child.name, MainThreadFileSystem_1._asFileType(child)]);
            }).catch(MainThreadFileSystem_1._handleError);
        }
        static _asFileType(stat) {
            let res = 0;
            if (stat.isFile) {
                res += files_1.FileType.File;
            }
            else if (stat.isDirectory) {
                res += files_1.FileType.Directory;
            }
            if (stat.isSymbolicLink) {
                res += files_1.FileType.SymbolicLink;
            }
            return res;
        }
        $readFile(uri) {
            return this._fileService.readFile(uri_1.URI.revive(uri)).then(file => file.value).catch(MainThreadFileSystem_1._handleError);
        }
        $writeFile(uri, content) {
            return this._fileService.writeFile(uri_1.URI.revive(uri), content)
                .then(() => undefined).catch(MainThreadFileSystem_1._handleError);
        }
        $rename(source, target, opts) {
            return this._fileService.move(uri_1.URI.revive(source), uri_1.URI.revive(target), opts.overwrite)
                .then(() => undefined).catch(MainThreadFileSystem_1._handleError);
        }
        $copy(source, target, opts) {
            return this._fileService.copy(uri_1.URI.revive(source), uri_1.URI.revive(target), opts.overwrite)
                .then(() => undefined).catch(MainThreadFileSystem_1._handleError);
        }
        $mkdir(uri) {
            return this._fileService.createFolder(uri_1.URI.revive(uri))
                .then(() => undefined).catch(MainThreadFileSystem_1._handleError);
        }
        $delete(uri, opts) {
            return this._fileService.del(uri_1.URI.revive(uri), opts).catch(MainThreadFileSystem_1._handleError);
        }
        static _handleError(err) {
            if (err instanceof files_1.FileOperationError) {
                switch (err.fileOperationResult) {
                    case 1 /* FileOperationResult.FILE_NOT_FOUND */:
                        err.name = files_1.FileSystemProviderErrorCode.FileNotFound;
                        break;
                    case 0 /* FileOperationResult.FILE_IS_DIRECTORY */:
                        err.name = files_1.FileSystemProviderErrorCode.FileIsADirectory;
                        break;
                    case 6 /* FileOperationResult.FILE_PERMISSION_DENIED */:
                        err.name = files_1.FileSystemProviderErrorCode.NoPermissions;
                        break;
                    case 4 /* FileOperationResult.FILE_MOVE_CONFLICT */:
                        err.name = files_1.FileSystemProviderErrorCode.FileExists;
                        break;
                }
            }
            else if (err instanceof Error) {
                const code = (0, files_1.toFileSystemProviderErrorCode)(err);
                if (code !== files_1.FileSystemProviderErrorCode.Unknown) {
                    err.name = code;
                }
            }
            throw err;
        }
        $ensureActivation(scheme) {
            return this._fileService.activateProvider(scheme);
        }
        $watch(extensionId, session, resource, opts) {
            var _a, _b;
            const uri = uri_1.URI.revive(resource);
            const isInsideWorkspace = this._contextService.isInsideWorkspace(uri);
            // Refuse to watch anything that is already watched via
            // our workspace watchers in case the request is a
            // recursive file watcher.
            // Still allow for non-recursive watch requests as a way
            // to bypass configured exlcude rules though
            // (see https://github.com/microsoft/vscode/issues/146066)
            if (isInsideWorkspace && opts.recursive) {
                this._logService.trace(`MainThreadFileSystem#$watch(): ignoring request to start watching because path is inside workspace (extension: ${extensionId}, path: ${uri.toString(true)}, recursive: ${opts.recursive}, session: ${session})`);
                return;
            }
            this._logService.trace(`MainThreadFileSystem#$watch(): request to start watching (extension: ${extensionId}, path: ${uri.toString(true)}, recursive: ${opts.recursive}, session: ${session})`);
            // Automatically add `files.watcherExclude` patterns when watching
            // recursively to give users a chance to configure exclude rules
            // for reducing the overhead of watching recursively
            if (opts.recursive) {
                const config = this._configurationService.getValue();
                if ((_a = config.files) === null || _a === void 0 ? void 0 : _a.watcherExclude) {
                    for (const key in config.files.watcherExclude) {
                        if (config.files.watcherExclude[key] === true) {
                            opts.excludes.push(key);
                        }
                    }
                }
            }
            // Non-recursive watching inside the workspace will overlap with
            // our standard workspace watchers. To prevent duplicate events,
            // we only want to include events for files that are otherwise
            // excluded via `files.watcherExclude`. As such, we configure
            // to include each configured exclude pattern so that only those
            // events are reported that are otherwise excluded.
            else if (isInsideWorkspace) {
                const config = this._configurationService.getValue();
                if ((_b = config.files) === null || _b === void 0 ? void 0 : _b.watcherExclude) {
                    for (const key in config.files.watcherExclude) {
                        if (config.files.watcherExclude[key] === true) {
                            if (!opts.includes) {
                                opts.includes = [];
                            }
                            opts.includes.push(key);
                        }
                    }
                }
                // Still ignore watch request if there are actually no configured
                // exclude rules, because in that case our default recursive watcher
                // should be able to take care of all events.
                if (!opts.includes || opts.includes.length === 0) {
                    this._logService.trace(`MainThreadFileSystem#$watch(): ignoring request to start watching because path is inside workspace and no excludes are configured (extension: ${extensionId}, path: ${uri.toString(true)}, recursive: ${opts.recursive}, session: ${session})`);
                    return;
                }
            }
            const subscription = this._fileService.watch(uri, opts);
            this._watches.set(session, subscription);
        }
        $unwatch(session) {
            const subscription = this._watches.get(session);
            if (subscription) {
                this._logService.trace(`MainThreadFileSystem#$unwatch(): request to stop watching (session: ${session})`);
                subscription.dispose();
                this._watches.delete(session);
            }
        }
    };
    MainThreadFileSystem = MainThreadFileSystem_1 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadFileSystem),
        __param(1, files_2.IWorkbenchFileService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, log_1.ILogService),
        __param(4, configuration_1.IConfigurationService)
    ], MainThreadFileSystem);
    exports.MainThreadFileSystem = MainThreadFileSystem;
    class RemoteFileSystemProvider {
        constructor(fileService, scheme, capabilities, _handle, _proxy) {
            this._handle = _handle;
            this._proxy = _proxy;
            this._onDidChange = new event_1.Emitter();
            this.onDidChangeFile = this._onDidChange.event;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.capabilities = capabilities;
            this._registration = fileService.registerProvider(scheme, this);
        }
        dispose() {
            this._registration.dispose();
            this._onDidChange.dispose();
        }
        watch(resource, opts) {
            const session = Math.random();
            this._proxy.$watch(this._handle, session, resource, opts);
            return (0, lifecycle_1.toDisposable)(() => {
                this._proxy.$unwatch(this._handle, session);
            });
        }
        $onFileSystemChange(changes) {
            this._onDidChange.fire(changes.map(RemoteFileSystemProvider._createFileChange));
        }
        static _createFileChange(dto) {
            return { resource: uri_1.URI.revive(dto.resource), type: dto.type };
        }
        // --- forwarding calls
        stat(resource) {
            return this._proxy.$stat(this._handle, resource).then(undefined, err => {
                throw err;
            });
        }
        readFile(resource) {
            return this._proxy.$readFile(this._handle, resource).then(buffer => buffer.buffer);
        }
        writeFile(resource, content, opts) {
            return this._proxy.$writeFile(this._handle, resource, buffer_1.VSBuffer.wrap(content), opts);
        }
        delete(resource, opts) {
            return this._proxy.$delete(this._handle, resource, opts);
        }
        mkdir(resource) {
            return this._proxy.$mkdir(this._handle, resource);
        }
        readdir(resource) {
            return this._proxy.$readdir(this._handle, resource);
        }
        rename(resource, target, opts) {
            return this._proxy.$rename(this._handle, resource, target, opts);
        }
        copy(resource, target, opts) {
            return this._proxy.$copy(this._handle, resource, target, opts);
        }
        open(resource, opts) {
            return this._proxy.$open(this._handle, resource, opts);
        }
        close(fd) {
            return this._proxy.$close(this._handle, fd);
        }
        read(fd, pos, data, offset, length) {
            return this._proxy.$read(this._handle, fd, pos, length).then(readData => {
                data.set(readData.buffer, offset);
                return readData.byteLength;
            });
        }
        write(fd, pos, data, offset, length) {
            return this._proxy.$write(this._handle, fd, pos, buffer_1.VSBuffer.wrap(data).slice(offset, offset + length));
        }
    }
});
//# sourceMappingURL=mainThreadFileSystem.js.map