/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/stream", "vs/platform/files/common/files", "vs/platform/files/browser/webFileSystemAccess"], function (require, exports, nls_1, uri_1, buffer_1, event_1, lifecycle_1, network_1, path_1, platform_1, resources_1, stream_1, files_1, webFileSystemAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HTMLFileSystemProvider = void 0;
    class HTMLFileSystemProvider {
        //#endregion
        constructor(indexedDB, store, logService) {
            this.indexedDB = indexedDB;
            this.store = store;
            this.logService = logService;
            //#region Events (unsupported)
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
            //#endregion
            //#region File Capabilities
            this.extUri = platform_1.isLinux ? resources_1.extUri : resources_1.extUriIgnorePathCase;
            //#endregion
            //#region File/Directoy Handle Registry
            this._files = new Map();
            this._directories = new Map();
        }
        get capabilities() {
            if (!this._capabilities) {
                this._capabilities =
                    2 /* FileSystemProviderCapabilities.FileReadWrite */ |
                        16 /* FileSystemProviderCapabilities.FileReadStream */;
                if (platform_1.isLinux) {
                    this._capabilities |= 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
                }
            }
            return this._capabilities;
        }
        //#region File Metadata Resolving
        async stat(resource) {
            try {
                const handle = await this.getHandle(resource);
                if (!handle) {
                    throw this.createFileSystemProviderError(resource, 'No such file or directory, stat', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(handle)) {
                    const file = await handle.getFile();
                    return {
                        type: files_1.FileType.File,
                        mtime: file.lastModified,
                        ctime: 0,
                        size: file.size
                    };
                }
                return {
                    type: files_1.FileType.Directory,
                    mtime: 0,
                    ctime: 0,
                    size: 0
                };
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async readdir(resource) {
            var e_1, _a;
            try {
                const handle = await this.getDirectoryHandle(resource);
                if (!handle) {
                    throw this.createFileSystemProviderError(resource, 'No such file or directory, readdir', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                const result = [];
                try {
                    for (var handle_1 = __asyncValues(handle), handle_1_1; handle_1_1 = await handle_1.next(), !handle_1_1.done;) {
                        const [name, child] = handle_1_1.value;
                        result.push([name, webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(child) ? files_1.FileType.File : files_1.FileType.Directory]);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (handle_1_1 && !handle_1_1.done && (_a = handle_1.return)) await _a.call(handle_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return result;
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        //#endregion
        //#region File Reading/Writing
        readFileStream(resource, opts, token) {
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer, {
                // Set a highWaterMark to prevent the stream
                // for file upload to produce large buffers
                // in-memory
                highWaterMark: 10
            });
            (async () => {
                try {
                    const handle = await this.getFileHandle(resource);
                    if (!handle) {
                        throw this.createFileSystemProviderError(resource, 'No such file or directory, readFile', files_1.FileSystemProviderErrorCode.FileNotFound);
                    }
                    const file = await handle.getFile();
                    // Partial file: implemented simply via `readFile`
                    if (typeof opts.length === 'number' || typeof opts.position === 'number') {
                        let buffer = new Uint8Array(await file.arrayBuffer());
                        if (typeof (opts === null || opts === void 0 ? void 0 : opts.position) === 'number') {
                            buffer = buffer.slice(opts.position);
                        }
                        if (typeof (opts === null || opts === void 0 ? void 0 : opts.length) === 'number') {
                            buffer = buffer.slice(0, opts.length);
                        }
                        stream.end(buffer);
                    }
                    // Entire file
                    else {
                        // TODO@electron: duplicate type definitions originate from `@types/node/stream/consumers.d.ts`
                        const reader = file.stream().getReader();
                        let res = await reader.read();
                        while (!res.done) {
                            if (token.isCancellationRequested) {
                                break;
                            }
                            // Write buffer into stream but make sure to wait
                            // in case the `highWaterMark` is reached
                            await stream.write(res.value);
                            if (token.isCancellationRequested) {
                                break;
                            }
                            res = await reader.read();
                        }
                        stream.end(undefined);
                    }
                }
                catch (error) {
                    stream.error(this.toFileSystemProviderError(error));
                    stream.end();
                }
            })();
            return stream;
        }
        async readFile(resource) {
            try {
                const handle = await this.getFileHandle(resource);
                if (!handle) {
                    throw this.createFileSystemProviderError(resource, 'No such file or directory, readFile', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                const file = await handle.getFile();
                return new Uint8Array(await file.arrayBuffer());
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async writeFile(resource, content, opts) {
            try {
                let handle = await this.getFileHandle(resource);
                // Validate target unless { create: true, overwrite: true }
                if (!opts.create || !opts.overwrite) {
                    if (handle) {
                        if (!opts.overwrite) {
                            throw this.createFileSystemProviderError(resource, 'File already exists, writeFile', files_1.FileSystemProviderErrorCode.FileExists);
                        }
                    }
                    else {
                        if (!opts.create) {
                            throw this.createFileSystemProviderError(resource, 'No such file, writeFile', files_1.FileSystemProviderErrorCode.FileNotFound);
                        }
                    }
                }
                // Create target as needed
                if (!handle) {
                    const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
                    if (!parent) {
                        throw this.createFileSystemProviderError(resource, 'No such parent directory, writeFile', files_1.FileSystemProviderErrorCode.FileNotFound);
                    }
                    handle = await parent.getFileHandle(this.extUri.basename(resource), { create: true });
                    if (!handle) {
                        throw this.createFileSystemProviderError(resource, 'Unable to create file , writeFile', files_1.FileSystemProviderErrorCode.Unknown);
                    }
                }
                // Write to target overwriting any existing contents
                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        async mkdir(resource) {
            try {
                const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
                if (!parent) {
                    throw this.createFileSystemProviderError(resource, 'No such parent directory, mkdir', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                await parent.getDirectoryHandle(this.extUri.basename(resource), { create: true });
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async delete(resource, opts) {
            try {
                const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
                if (!parent) {
                    throw this.createFileSystemProviderError(resource, 'No such parent directory, delete', files_1.FileSystemProviderErrorCode.FileNotFound);
                }
                return parent.removeEntry(this.extUri.basename(resource), { recursive: opts.recursive });
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async rename(from, to, opts) {
            try {
                if (this.extUri.isEqual(from, to)) {
                    return; // no-op if the paths are the same
                }
                // Implement file rename by write + delete
                let fileHandle = await this.getFileHandle(from);
                if (fileHandle) {
                    const file = await fileHandle.getFile();
                    const contents = new Uint8Array(await file.arrayBuffer());
                    await this.writeFile(to, contents, { create: true, overwrite: opts.overwrite, unlock: false });
                    await this.delete(from, { recursive: false, useTrash: false });
                }
                // File API does not support any real rename otherwise
                else {
                    throw this.createFileSystemProviderError(from, (0, nls_1.localize)('fileSystemRenameError', "Rename is only supported for files."), files_1.FileSystemProviderErrorCode.Unavailable);
                }
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        //#endregion
        //#region File Watching (unsupported)
        watch(resource, opts) {
            return lifecycle_1.Disposable.None;
        }
        registerFileHandle(handle) {
            return this.registerHandle(handle, this._files);
        }
        registerDirectoryHandle(handle) {
            return this.registerHandle(handle, this._directories);
        }
        get directories() {
            return this._directories.values();
        }
        async registerHandle(handle, map) {
            var _a, _b, _c;
            let handleId = `/${handle.name}`;
            // Compute a valid handle ID in case this exists already
            if (map.has(handleId) && !await ((_a = map.get(handleId)) === null || _a === void 0 ? void 0 : _a.isSameEntry(handle))) {
                const fileExt = (0, path_1.extname)(handle.name);
                const fileName = (0, path_1.basename)(handle.name, fileExt);
                let handleIdCounter = 1;
                do {
                    handleId = `/${fileName}-${handleIdCounter++}${fileExt}`;
                } while (map.has(handleId) && !await ((_b = map.get(handleId)) === null || _b === void 0 ? void 0 : _b.isSameEntry(handle)));
            }
            map.set(handleId, handle);
            // Remember in IndexDB for future lookup
            try {
                await ((_c = this.indexedDB) === null || _c === void 0 ? void 0 : _c.runInTransaction(this.store, 'readwrite', objectStore => objectStore.put(handle, handleId)));
            }
            catch (error) {
                this.logService.error(error);
            }
            return uri_1.URI.from({ scheme: network_1.Schemas.file, path: handleId });
        }
        async getHandle(resource) {
            // First: try to find a well known handle first
            let handle = await this.doGetHandle(resource);
            // Second: walk up parent directories and resolve handle if possible
            if (!handle) {
                const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
                if (parent) {
                    const name = resources_1.extUri.basename(resource);
                    try {
                        handle = await parent.getFileHandle(name);
                    }
                    catch (error) {
                        try {
                            handle = await parent.getDirectoryHandle(name);
                        }
                        catch (error) {
                            // Ignore
                        }
                    }
                }
            }
            return handle;
        }
        async getFileHandle(resource) {
            const handle = await this.doGetHandle(resource);
            if (handle instanceof FileSystemFileHandle) {
                return handle;
            }
            const parent = await this.getDirectoryHandle(this.extUri.dirname(resource));
            try {
                return await (parent === null || parent === void 0 ? void 0 : parent.getFileHandle(resources_1.extUri.basename(resource)));
            }
            catch (error) {
                return undefined; // guard against possible DOMException
            }
        }
        async getDirectoryHandle(resource) {
            const handle = await this.doGetHandle(resource);
            if (handle instanceof FileSystemDirectoryHandle) {
                return handle;
            }
            const parentUri = this.extUri.dirname(resource);
            if (this.extUri.isEqual(parentUri, resource)) {
                return undefined; // return when root is reached to prevent infinite recursion
            }
            const parent = await this.getDirectoryHandle(parentUri);
            try {
                return await (parent === null || parent === void 0 ? void 0 : parent.getDirectoryHandle(resources_1.extUri.basename(resource)));
            }
            catch (error) {
                return undefined; // guard against possible DOMException
            }
        }
        async doGetHandle(resource) {
            var _a, _b;
            // We store file system handles with the `handle.name`
            // and as such require the resource to be on the root
            if (this.extUri.dirname(resource).path !== '/') {
                return undefined;
            }
            const handleId = resource.path.replace(/\/$/, ''); // remove potential slash from the end of the path
            // First: check if we have a known handle stored in memory
            const inMemoryHandle = (_a = this._files.get(handleId)) !== null && _a !== void 0 ? _a : this._directories.get(handleId);
            if (inMemoryHandle) {
                return inMemoryHandle;
            }
            // Second: check if we have a persisted handle in IndexedDB
            const persistedHandle = await ((_b = this.indexedDB) === null || _b === void 0 ? void 0 : _b.runInTransaction(this.store, 'readonly', store => store.get(handleId)));
            if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemHandle(persistedHandle)) {
                let hasPermissions = await persistedHandle.queryPermission() === 'granted';
                try {
                    if (!hasPermissions) {
                        hasPermissions = await persistedHandle.requestPermission() === 'granted';
                    }
                }
                catch (error) {
                    this.logService.error(error); // this can fail with a DOMException
                }
                if (hasPermissions) {
                    if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(persistedHandle)) {
                        this._files.set(handleId, persistedHandle);
                    }
                    else if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemDirectoryHandle(persistedHandle)) {
                        this._directories.set(handleId, persistedHandle);
                    }
                    return persistedHandle;
                }
            }
            // Third: fail with an error
            throw this.createFileSystemProviderError(resource, 'No file system handle registered', files_1.FileSystemProviderErrorCode.Unavailable);
        }
        //#endregion
        toFileSystemProviderError(error) {
            if (error instanceof files_1.FileSystemProviderError) {
                return error; // avoid double conversion
            }
            let code = files_1.FileSystemProviderErrorCode.Unknown;
            if (error.name === 'NotAllowedError') {
                error = new Error((0, nls_1.localize)('fileSystemNotAllowedError', "Insufficient permissions. Please retry and allow the operation."));
                code = files_1.FileSystemProviderErrorCode.Unavailable;
            }
            return (0, files_1.createFileSystemProviderError)(error, code);
        }
        createFileSystemProviderError(resource, msg, code) {
            return (0, files_1.createFileSystemProviderError)(new Error(`${msg} (${(0, path_1.normalize)(resource.path)})`), code);
        }
    }
    exports.HTMLFileSystemProvider = HTMLFileSystemProvider;
});
//# sourceMappingURL=htmlFileSystemProvider.js.map