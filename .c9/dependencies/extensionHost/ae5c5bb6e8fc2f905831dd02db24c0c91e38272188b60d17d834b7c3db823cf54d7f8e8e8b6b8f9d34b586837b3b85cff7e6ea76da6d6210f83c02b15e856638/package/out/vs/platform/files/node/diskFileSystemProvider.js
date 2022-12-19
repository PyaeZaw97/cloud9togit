/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "fs", "graceful-fs", "vs/base/common/async", "vs/base/common/map", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/extpath", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/stream", "vs/base/node/pfs", "vs/nls", "vs/platform/files/common/files", "vs/platform/files/common/io", "vs/platform/files/common/diskFileSystemProvider", "vs/base/common/errorMessage", "vs/platform/files/node/watcher/watcherClient", "vs/platform/files/node/watcher/nodejs/nodejsClient"], function (require, exports, fs, graceful_fs_1, async_1, map_1, buffer_1, event_1, extpath_1, lifecycle_1, path_1, platform_1, resources_1, stream_1, pfs_1, nls_1, files_1, io_1, diskFileSystemProvider_1, errorMessage_1, watcherClient_1, nodejsClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskFileSystemProvider = void 0;
    /**
     * Enable graceful-fs very early from here to have it enabled
     * in all contexts that leverage the disk file system provider.
     */
    (() => {
        try {
            (0, graceful_fs_1.gracefulify)(fs);
        }
        catch (error) {
            console.error(`Error enabling graceful-fs: ${(0, errorMessage_1.toErrorMessage)(error)}`);
        }
    })();
    class DiskFileSystemProvider extends diskFileSystemProvider_1.AbstractDiskFileSystemProvider {
        constructor(logService, options) {
            super(logService, options);
            //#region File Capabilities
            this.onDidChangeCapabilities = event_1.Event.None;
            //#endregion
            //#region File Reading/Writing
            this.resourceLocks = new map_1.ResourceMap(resource => resources_1.extUriBiasedIgnorePathCase.getComparisonKey(resource));
            this.mapHandleToPos = new Map();
            this.mapHandleToLock = new Map();
            this.writeHandles = new Map();
            this.canFlush = true;
        }
        get capabilities() {
            if (!this._capabilities) {
                this._capabilities =
                    2 /* FileSystemProviderCapabilities.FileReadWrite */ |
                        4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */ |
                        16 /* FileSystemProviderCapabilities.FileReadStream */ |
                        8 /* FileSystemProviderCapabilities.FileFolderCopy */ |
                        8192 /* FileSystemProviderCapabilities.FileWriteUnlock */ |
                        16384 /* FileSystemProviderCapabilities.FileAtomicRead */ |
                        32768 /* FileSystemProviderCapabilities.FileClone */;
                if (platform_1.isLinux) {
                    this._capabilities |= 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
                }
            }
            return this._capabilities;
        }
        //#endregion
        //#region File Metadata Resolving
        async stat(resource) {
            try {
                const { stat, symbolicLink } = await pfs_1.SymlinkSupport.stat(this.toFilePath(resource)); // cannot use fs.stat() here to support links properly
                return {
                    type: this.toType(stat, symbolicLink),
                    ctime: stat.birthtime.getTime(),
                    mtime: stat.mtime.getTime(),
                    size: stat.size
                };
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async readdir(resource) {
            try {
                const children = await pfs_1.Promises.readdir(this.toFilePath(resource), { withFileTypes: true });
                const result = [];
                await Promise.all(children.map(async (child) => {
                    try {
                        let type;
                        if (child.isSymbolicLink()) {
                            type = (await this.stat((0, resources_1.joinPath)(resource, child.name))).type; // always resolve target the link points to if any
                        }
                        else {
                            type = this.toType(child);
                        }
                        result.push([child.name, type]);
                    }
                    catch (error) {
                        this.logService.trace(error); // ignore errors for individual entries that can arise from permission denied
                    }
                }));
                return result;
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        toType(entry, symbolicLink) {
            // Signal file type by checking for file / directory, except:
            // - symbolic links pointing to nonexistent files are FileType.Unknown
            // - files that are neither file nor directory are FileType.Unknown
            let type;
            if (symbolicLink === null || symbolicLink === void 0 ? void 0 : symbolicLink.dangling) {
                type = files_1.FileType.Unknown;
            }
            else if (entry.isFile()) {
                type = files_1.FileType.File;
            }
            else if (entry.isDirectory()) {
                type = files_1.FileType.Directory;
            }
            else {
                type = files_1.FileType.Unknown;
            }
            // Always signal symbolic link as file type additionally
            if (symbolicLink) {
                type |= files_1.FileType.SymbolicLink;
            }
            return type;
        }
        async createResourceLock(resource) {
            const filePath = this.toFilePath(resource);
            this.logService.trace(`[Disk FileSystemProvider]: createResourceLock() - request to acquire resource lock (${filePath})`);
            // Await pending locks for resource. It is possible for a new lock being
            // added right after opening, so we have to loop over locks until no lock
            // remains.
            let existingLock = undefined;
            while (existingLock = this.resourceLocks.get(resource)) {
                this.logService.trace(`[Disk FileSystemProvider]: createResourceLock() - waiting for resource lock to be released (${filePath})`);
                await existingLock.wait();
            }
            // Store new
            const newLock = new async_1.Barrier();
            this.resourceLocks.set(resource, newLock);
            this.logService.trace(`[Disk FileSystemProvider]: createResourceLock() - new resource lock created (${filePath})`);
            return (0, lifecycle_1.toDisposable)(() => {
                this.logService.trace(`[Disk FileSystemProvider]: createResourceLock() - resource lock dispose() (${filePath})`);
                // Delete lock if it is still ours
                if (this.resourceLocks.get(resource) === newLock) {
                    this.logService.trace(`[Disk FileSystemProvider]: createResourceLock() - resource lock removed from resource-lock map (${filePath})`);
                    this.resourceLocks.delete(resource);
                }
                // Open lock
                this.logService.trace(`[Disk FileSystemProvider]: createResourceLock() - resource lock barrier open() (${filePath})`);
                newLock.open();
            });
        }
        async readFile(resource, options) {
            let lock = undefined;
            try {
                if (options === null || options === void 0 ? void 0 : options.atomic) {
                    this.logService.trace(`[Disk FileSystemProvider]: atomic read operation started (${this.toFilePath(resource)})`);
                    // When the read should be atomic, make sure
                    // to await any pending locks for the resource
                    // and lock for the duration of the read.
                    lock = await this.createResourceLock(resource);
                }
                const filePath = this.toFilePath(resource);
                return await pfs_1.Promises.readFile(filePath);
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
            finally {
                lock === null || lock === void 0 ? void 0 : lock.dispose();
            }
        }
        readFileStream(resource, opts, token) {
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer);
            (0, io_1.readFileIntoStream)(this, resource, stream, data => data.buffer, Object.assign(Object.assign({}, opts), { bufferSize: 256 * 1024 // read into chunks of 256kb each to reduce IPC overhead
             }), token);
            return stream;
        }
        async writeFile(resource, content, opts) {
            let handle = undefined;
            try {
                const filePath = this.toFilePath(resource);
                // Validate target unless { create: true, overwrite: true }
                if (!opts.create || !opts.overwrite) {
                    const fileExists = await pfs_1.Promises.exists(filePath);
                    if (fileExists) {
                        if (!opts.overwrite) {
                            throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileExists', "File already exists"), files_1.FileSystemProviderErrorCode.FileExists);
                        }
                    }
                    else {
                        if (!opts.create) {
                            throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileNotExists', "File does not exist"), files_1.FileSystemProviderErrorCode.FileNotFound);
                        }
                    }
                }
                // Open
                handle = await this.open(resource, { create: true, unlock: opts.unlock });
                // Write content at once
                await this.write(handle, 0, content, 0, content.byteLength);
            }
            catch (error) {
                throw await this.toFileSystemProviderWriteError(resource, error);
            }
            finally {
                if (typeof handle === 'number') {
                    await this.close(handle);
                }
            }
        }
        async open(resource, opts) {
            const filePath = this.toFilePath(resource);
            // Writes: guard multiple writes to the same resource
            // behind a single lock to prevent races when writing
            // from multiple places at the same time to the same file
            let lock = undefined;
            if ((0, files_1.isFileOpenForWriteOptions)(opts)) {
                lock = await this.createResourceLock(resource);
            }
            let fd = undefined;
            try {
                // Determine wether to unlock the file (write only)
                if ((0, files_1.isFileOpenForWriteOptions)(opts) && opts.unlock) {
                    try {
                        const { stat } = await pfs_1.SymlinkSupport.stat(filePath);
                        if (!(stat.mode & 0o200 /* File mode indicating writable by owner */)) {
                            await pfs_1.Promises.chmod(filePath, stat.mode | 0o200);
                        }
                    }
                    catch (error) {
                        this.logService.trace(error); // ignore any errors here and try to just write
                    }
                }
                // Determine file flags for opening (read vs write)
                let flags = undefined;
                if ((0, files_1.isFileOpenForWriteOptions)(opts)) {
                    if (platform_1.isWindows) {
                        try {
                            // On Windows and if the file exists, we use a different strategy of saving the file
                            // by first truncating the file and then writing with r+ flag. This helps to save hidden files on Windows
                            // (see https://github.com/microsoft/vscode/issues/931) and prevent removing alternate data streams
                            // (see https://github.com/microsoft/vscode/issues/6363)
                            await pfs_1.Promises.truncate(filePath, 0);
                            // After a successful truncate() the flag can be set to 'r+' which will not truncate.
                            flags = 'r+';
                        }
                        catch (error) {
                            if (error.code !== 'ENOENT') {
                                this.logService.trace(error);
                            }
                        }
                    }
                    // We take opts.create as a hint that the file is opened for writing
                    // as such we use 'w' to truncate an existing or create the
                    // file otherwise. we do not allow reading.
                    if (!flags) {
                        flags = 'w';
                    }
                }
                else {
                    // Otherwise we assume the file is opened for reading
                    // as such we use 'r' to neither truncate, nor create
                    // the file.
                    flags = 'r';
                }
                // Finally open handle to file path
                fd = await pfs_1.Promises.open(filePath, flags);
            }
            catch (error) {
                // Release lock because we have no valid handle
                // if we did open a lock during this operation
                lock === null || lock === void 0 ? void 0 : lock.dispose();
                // Rethrow as file system provider error
                if ((0, files_1.isFileOpenForWriteOptions)(opts)) {
                    throw await this.toFileSystemProviderWriteError(resource, error);
                }
                else {
                    throw this.toFileSystemProviderError(error);
                }
            }
            // Remember this handle to track file position of the handle
            // we init the position to 0 since the file descriptor was
            // just created and the position was not moved so far (see
            // also http://man7.org/linux/man-pages/man2/open.2.html -
            // "The file offset is set to the beginning of the file.")
            this.mapHandleToPos.set(fd, 0);
            // remember that this handle was used for writing
            if ((0, files_1.isFileOpenForWriteOptions)(opts)) {
                this.writeHandles.set(fd, resource);
            }
            if (lock) {
                const previousLock = this.mapHandleToLock.get(fd);
                // Remember that this handle has an associated lock
                this.logService.trace(`[Disk FileSystemProvider]: open() - storing lock for handle ${fd} (${filePath})`);
                this.mapHandleToLock.set(fd, lock);
                // There is a slight chance that a resource lock for a
                // handle was not yet disposed when we acquire a new
                // lock, so we must ensure to dispose the previous lock
                // before storing a new one for the same handle, other
                // wise we end up in a deadlock situation
                // https://github.com/microsoft/vscode/issues/142462
                if (previousLock) {
                    this.logService.trace(`[Disk FileSystemProvider]: open() - disposing a previous lock that was still stored on same handle ${fd} (${filePath})`);
                    previousLock.dispose();
                }
            }
            return fd;
        }
        async close(fd) {
            // It is very important that we keep any associated lock
            // for the file handle before attempting to call `fs.close(fd)`
            // because of a possible race condition: as soon as a file
            // handle is released, the OS may assign the same handle to
            // the next `fs.open` call and as such it is possible that our
            // lock is getting overwritten
            const lockForHandle = this.mapHandleToLock.get(fd);
            try {
                // Remove this handle from map of positions
                this.mapHandleToPos.delete(fd);
                // If a handle is closed that was used for writing, ensure
                // to flush the contents to disk if possible.
                if (this.writeHandles.delete(fd) && this.canFlush) {
                    try {
                        await pfs_1.Promises.fdatasync(fd); // https://github.com/microsoft/vscode/issues/9589
                    }
                    catch (error) {
                        // In some exotic setups it is well possible that node fails to sync
                        // In that case we disable flushing and log the error to our logger
                        this.canFlush = false;
                        this.logService.error(error);
                    }
                }
                return await pfs_1.Promises.close(fd);
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
            finally {
                if (lockForHandle) {
                    if (this.mapHandleToLock.get(fd) === lockForHandle) {
                        this.logService.trace(`[Disk FileSystemProvider]: close() - resource lock removed from handle-lock map ${fd}`);
                        this.mapHandleToLock.delete(fd); // only delete from map if this is still our lock!
                    }
                    this.logService.trace(`[Disk FileSystemProvider]: close() - disposing lock for handle ${fd}`);
                    lockForHandle.dispose();
                }
            }
        }
        async read(fd, pos, data, offset, length) {
            const normalizedPos = this.normalizePos(fd, pos);
            let bytesRead = null;
            try {
                bytesRead = (await pfs_1.Promises.read(fd, data, offset, length, normalizedPos)).bytesRead;
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
            finally {
                this.updatePos(fd, normalizedPos, bytesRead);
            }
            return bytesRead;
        }
        normalizePos(fd, pos) {
            // When calling fs.read/write we try to avoid passing in the "pos" argument and
            // rather prefer to pass in "null" because this avoids an extra seek(pos)
            // call that in some cases can even fail (e.g. when opening a file over FTP -
            // see https://github.com/microsoft/vscode/issues/73884).
            //
            // as such, we compare the passed in position argument with our last known
            // position for the file descriptor and use "null" if they match.
            if (pos === this.mapHandleToPos.get(fd)) {
                return null;
            }
            return pos;
        }
        updatePos(fd, pos, bytesLength) {
            const lastKnownPos = this.mapHandleToPos.get(fd);
            if (typeof lastKnownPos === 'number') {
                // pos !== null signals that previously a position was used that is
                // not null. node.js documentation explains, that in this case
                // the internal file pointer is not moving and as such we do not move
                // our position pointer.
                //
                // Docs: "If position is null, data will be read from the current file position,
                // and the file position will be updated. If position is an integer, the file position
                // will remain unchanged."
                if (typeof pos === 'number') {
                    // do not modify the position
                }
                // bytesLength = number is a signal that the read/write operation was
                // successful and as such we need to advance the position in the Map
                //
                // Docs (http://man7.org/linux/man-pages/man2/read.2.html):
                // "On files that support seeking, the read operation commences at the
                // file offset, and the file offset is incremented by the number of
                // bytes read."
                //
                // Docs (http://man7.org/linux/man-pages/man2/write.2.html):
                // "For a seekable file (i.e., one to which lseek(2) may be applied, for
                // example, a regular file) writing takes place at the file offset, and
                // the file offset is incremented by the number of bytes actually
                // written."
                else if (typeof bytesLength === 'number') {
                    this.mapHandleToPos.set(fd, lastKnownPos + bytesLength);
                }
                // bytesLength = null signals an error in the read/write operation
                // and as such we drop the handle from the Map because the position
                // is unspecificed at this point.
                else {
                    this.mapHandleToPos.delete(fd);
                }
            }
        }
        async write(fd, pos, data, offset, length) {
            // We know at this point that the file to write to is truncated and thus empty
            // if the write now fails, the file remains empty. as such we really try hard
            // to ensure the write succeeds by retrying up to three times.
            return (0, async_1.retry)(() => this.doWrite(fd, pos, data, offset, length), 100 /* ms delay */, 3 /* retries */);
        }
        async doWrite(fd, pos, data, offset, length) {
            const normalizedPos = this.normalizePos(fd, pos);
            let bytesWritten = null;
            try {
                bytesWritten = (await pfs_1.Promises.write(fd, data, offset, length, normalizedPos)).bytesWritten;
            }
            catch (error) {
                throw await this.toFileSystemProviderWriteError(this.writeHandles.get(fd), error);
            }
            finally {
                this.updatePos(fd, normalizedPos, bytesWritten);
            }
            return bytesWritten;
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        async mkdir(resource) {
            try {
                await pfs_1.Promises.mkdir(this.toFilePath(resource));
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async delete(resource, opts) {
            try {
                const filePath = this.toFilePath(resource);
                if (opts.recursive) {
                    await pfs_1.Promises.rm(filePath, pfs_1.RimRafMode.MOVE);
                }
                else {
                    await pfs_1.Promises.unlink(filePath);
                }
            }
            catch (error) {
                throw this.toFileSystemProviderError(error);
            }
        }
        async rename(from, to, opts) {
            const fromFilePath = this.toFilePath(from);
            const toFilePath = this.toFilePath(to);
            if (fromFilePath === toFilePath) {
                return; // simulate node.js behaviour here and do a no-op if paths match
            }
            try {
                // Ensure target does not exist
                await this.validateTargetDeleted(from, to, 'move', opts.overwrite);
                // Move
                await pfs_1.Promises.move(fromFilePath, toFilePath);
            }
            catch (error) {
                // Rewrite some typical errors that can happen especially around symlinks
                // to something the user can better understand
                if (error.code === 'EINVAL' || error.code === 'EBUSY' || error.code === 'ENAMETOOLONG') {
                    error = new Error((0, nls_1.localize)('moveError', "Unable to move '{0}' into '{1}' ({2}).", (0, path_1.basename)(fromFilePath), (0, path_1.basename)((0, path_1.dirname)(toFilePath)), error.toString()));
                }
                throw this.toFileSystemProviderError(error);
            }
        }
        async copy(from, to, opts) {
            const fromFilePath = this.toFilePath(from);
            const toFilePath = this.toFilePath(to);
            if (fromFilePath === toFilePath) {
                return; // simulate node.js behaviour here and do a no-op if paths match
            }
            try {
                // Ensure target does not exist
                await this.validateTargetDeleted(from, to, 'copy', opts.overwrite);
                // Copy
                await pfs_1.Promises.copy(fromFilePath, toFilePath, { preserveSymlinks: true });
            }
            catch (error) {
                // Rewrite some typical errors that can happen especially around symlinks
                // to something the user can better understand
                if (error.code === 'EINVAL' || error.code === 'EBUSY' || error.code === 'ENAMETOOLONG') {
                    error = new Error((0, nls_1.localize)('copyError', "Unable to copy '{0}' into '{1}' ({2}).", (0, path_1.basename)(fromFilePath), (0, path_1.basename)((0, path_1.dirname)(toFilePath)), error.toString()));
                }
                throw this.toFileSystemProviderError(error);
            }
        }
        async validateTargetDeleted(from, to, mode, overwrite) {
            const fromFilePath = this.toFilePath(from);
            const toFilePath = this.toFilePath(to);
            let isSameResourceWithDifferentPathCase = false;
            const isPathCaseSensitive = !!(this.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
            if (!isPathCaseSensitive) {
                isSameResourceWithDifferentPathCase = (0, extpath_1.isEqual)(fromFilePath, toFilePath, true /* ignore case */);
            }
            if (isSameResourceWithDifferentPathCase && mode === 'copy') {
                throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileCopyErrorPathCase', "'File cannot be copied to same path with different path case"), files_1.FileSystemProviderErrorCode.FileExists);
            }
            // Handle existing target (unless this is a case change)
            if (!isSameResourceWithDifferentPathCase && await pfs_1.Promises.exists(toFilePath)) {
                if (!overwrite) {
                    throw (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileCopyErrorExists', "File at target already exists"), files_1.FileSystemProviderErrorCode.FileExists);
                }
                // Delete target
                await this.delete(to, { recursive: true, useTrash: false });
            }
        }
        //#endregion
        //#region Clone File
        async cloneFile(from, to) {
            return this.doCloneFile(from, to, false /* optimistically assume parent folders exist */);
        }
        async doCloneFile(from, to, mkdir) {
            const fromFilePath = this.toFilePath(from);
            const toFilePath = this.toFilePath(to);
            const isPathCaseSensitive = !!(this.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
            if ((0, extpath_1.isEqual)(fromFilePath, toFilePath, !isPathCaseSensitive)) {
                return; // cloning is only supported `from` and `to` are different files
            }
            // Implement clone by using `fs.copyFile`, however setup locks
            // for both `from` and `to` because node.js does not ensure
            // this to be an atomic operation
            const locks = new lifecycle_1.DisposableStore();
            try {
                const [fromLock, toLock] = await Promise.all([
                    this.createResourceLock(from),
                    this.createResourceLock(to)
                ]);
                locks.add(fromLock);
                locks.add(toLock);
                if (mkdir) {
                    await pfs_1.Promises.mkdir((0, path_1.dirname)(toFilePath), { recursive: true });
                }
                await pfs_1.Promises.copyFile(fromFilePath, toFilePath);
            }
            catch (error) {
                if (error.code === 'ENOENT' && !mkdir) {
                    return this.doCloneFile(from, to, true);
                }
                throw this.toFileSystemProviderError(error);
            }
            finally {
                locks.dispose();
            }
        }
        //#endregion
        //#region File Watching
        createUniversalWatcher(onChange, onLogMessage, verboseLogging) {
            return new watcherClient_1.UniversalWatcherClient(changes => onChange(changes), msg => onLogMessage(msg), verboseLogging);
        }
        createNonRecursiveWatcher(onChange, onLogMessage, verboseLogging) {
            return new nodejsClient_1.NodeJSWatcherClient(changes => onChange(changes), msg => onLogMessage(msg), verboseLogging);
        }
        //#endregion
        //#region Helpers
        toFileSystemProviderError(error) {
            if (error instanceof files_1.FileSystemProviderError) {
                return error; // avoid double conversion
            }
            let code;
            switch (error.code) {
                case 'ENOENT':
                    code = files_1.FileSystemProviderErrorCode.FileNotFound;
                    break;
                case 'EISDIR':
                    code = files_1.FileSystemProviderErrorCode.FileIsADirectory;
                    break;
                case 'ENOTDIR':
                    code = files_1.FileSystemProviderErrorCode.FileNotADirectory;
                    break;
                case 'EEXIST':
                    code = files_1.FileSystemProviderErrorCode.FileExists;
                    break;
                case 'EPERM':
                case 'EACCES':
                    code = files_1.FileSystemProviderErrorCode.NoPermissions;
                    break;
                default:
                    code = files_1.FileSystemProviderErrorCode.Unknown;
            }
            return (0, files_1.createFileSystemProviderError)(error, code);
        }
        async toFileSystemProviderWriteError(resource, error) {
            let fileSystemProviderWriteError = this.toFileSystemProviderError(error);
            // If the write error signals permission issues, we try
            // to read the file's mode to see if the file is write
            // locked.
            if (resource && fileSystemProviderWriteError.code === files_1.FileSystemProviderErrorCode.NoPermissions) {
                try {
                    const { stat } = await pfs_1.SymlinkSupport.stat(this.toFilePath(resource));
                    if (!(stat.mode & 0o200 /* File mode indicating writable by owner */)) {
                        fileSystemProviderWriteError = (0, files_1.createFileSystemProviderError)(error, files_1.FileSystemProviderErrorCode.FileWriteLocked);
                    }
                }
                catch (error) {
                    this.logService.trace(error); // ignore - return original error
                }
            }
            return fileSystemProviderWriteError;
        }
    }
    exports.DiskFileSystemProvider = DiskFileSystemProvider;
});
//# sourceMappingURL=diskFileSystemProvider.js.map