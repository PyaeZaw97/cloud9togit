/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/types", "vs/base/common/uri", "vs/nls", "vs/platform/files/common/files"], function (require, exports, async_1, buffer_1, errors_1, event_1, lifecycle_1, resources_1, types_1, uri_1, nls_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IndexedDBFileSystemProvider = void 0;
    // Standard FS Errors (expected to be thrown in production when invalid FS operations are requested)
    const ERR_FILE_NOT_FOUND = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileNotExists', "File does not exist"), files_1.FileSystemProviderErrorCode.FileNotFound);
    const ERR_FILE_IS_DIR = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileIsDirectory', "File is Directory"), files_1.FileSystemProviderErrorCode.FileIsADirectory);
    const ERR_FILE_NOT_DIR = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('fileNotDirectory', "File is not a directory"), files_1.FileSystemProviderErrorCode.FileNotADirectory);
    const ERR_DIR_NOT_EMPTY = (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('dirIsNotEmpty', "Directory is not empty"), files_1.FileSystemProviderErrorCode.Unknown);
    // Arbitrary Internal Errors (should never be thrown in production)
    const ERR_UNKNOWN_INTERNAL = (message) => (0, files_1.createFileSystemProviderError)((0, nls_1.localize)('internal', "Internal error occurred in IndexedDB File System Provider. ({0})", message), files_1.FileSystemProviderErrorCode.Unknown);
    class IndexedDBFileSystemNode {
        constructor(entry) {
            this.entry = entry;
            this.type = entry.type;
        }
        read(path) {
            return this.doRead(path.split('/').filter(p => p.length));
        }
        doRead(pathParts) {
            if (pathParts.length === 0) {
                return this.entry;
            }
            if (this.entry.type !== files_1.FileType.Directory) {
                throw ERR_UNKNOWN_INTERNAL('Internal error reading from IndexedDBFSNode -- expected directory at ' + this.entry.path);
            }
            const next = this.entry.children.get(pathParts[0]);
            if (!next) {
                return undefined;
            }
            return next.doRead(pathParts.slice(1));
        }
        delete(path) {
            const toDelete = path.split('/').filter(p => p.length);
            if (toDelete.length === 0) {
                if (this.entry.type !== files_1.FileType.Directory) {
                    throw ERR_UNKNOWN_INTERNAL(`Internal error deleting from IndexedDBFSNode. Expected root entry to be directory`);
                }
                this.entry.children.clear();
            }
            else {
                return this.doDelete(toDelete, path);
            }
        }
        doDelete(pathParts, originalPath) {
            if (pathParts.length === 0) {
                throw ERR_UNKNOWN_INTERNAL(`Internal error deleting from IndexedDBFSNode -- got no deletion path parts (encountered while deleting ${originalPath})`);
            }
            else if (this.entry.type !== files_1.FileType.Directory) {
                throw ERR_UNKNOWN_INTERNAL('Internal error deleting from IndexedDBFSNode -- expected directory at ' + this.entry.path);
            }
            else if (pathParts.length === 1) {
                this.entry.children.delete(pathParts[0]);
            }
            else {
                const next = this.entry.children.get(pathParts[0]);
                if (!next) {
                    throw ERR_UNKNOWN_INTERNAL('Internal error deleting from IndexedDBFSNode -- expected entry at ' + this.entry.path + '/' + next);
                }
                next.doDelete(pathParts.slice(1), originalPath);
            }
        }
        add(path, entry) {
            this.doAdd(path.split('/').filter(p => p.length), entry, path);
        }
        doAdd(pathParts, entry, originalPath) {
            if (pathParts.length === 0) {
                throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- adding empty path (encountered while adding ${originalPath})`);
            }
            else if (this.entry.type !== files_1.FileType.Directory) {
                throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- parent is not a directory (encountered while adding ${originalPath})`);
            }
            else if (pathParts.length === 1) {
                const next = pathParts[0];
                const existing = this.entry.children.get(next);
                if (entry.type === 'dir') {
                    if ((existing === null || existing === void 0 ? void 0 : existing.entry.type) === files_1.FileType.File) {
                        throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- overwriting file with directory: ${this.entry.path}/${next} (encountered while adding ${originalPath})`);
                    }
                    this.entry.children.set(next, existing !== null && existing !== void 0 ? existing : new IndexedDBFileSystemNode({
                        type: files_1.FileType.Directory,
                        path: this.entry.path + '/' + next,
                        children: new Map(),
                    }));
                }
                else {
                    if ((existing === null || existing === void 0 ? void 0 : existing.entry.type) === files_1.FileType.Directory) {
                        throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- overwriting directory with file: ${this.entry.path}/${next} (encountered while adding ${originalPath})`);
                    }
                    this.entry.children.set(next, new IndexedDBFileSystemNode({
                        type: files_1.FileType.File,
                        path: this.entry.path + '/' + next,
                        size: entry.size,
                    }));
                }
            }
            else if (pathParts.length > 1) {
                const next = pathParts[0];
                let childNode = this.entry.children.get(next);
                if (!childNode) {
                    childNode = new IndexedDBFileSystemNode({
                        children: new Map(),
                        path: this.entry.path + '/' + next,
                        type: files_1.FileType.Directory
                    });
                    this.entry.children.set(next, childNode);
                }
                else if (childNode.type === files_1.FileType.File) {
                    throw ERR_UNKNOWN_INTERNAL(`Internal error creating IndexedDBFSNode -- overwriting file entry with directory: ${this.entry.path}/${next} (encountered while adding ${originalPath})`);
                }
                childNode.doAdd(pathParts.slice(1), entry, originalPath);
            }
        }
        print(indentation = '') {
            console.log(indentation + this.entry.path);
            if (this.entry.type === files_1.FileType.Directory) {
                this.entry.children.forEach(child => child.print(indentation + ' '));
            }
        }
    }
    class IndexedDBChangesBroadcastChannel extends lifecycle_1.Disposable {
        constructor(changesKey) {
            super();
            this.changesKey = changesKey;
            this._onDidFileChanges = this._register(new event_1.Emitter());
            this.onDidFileChanges = this._onDidFileChanges.event;
            // Use BroadcastChannel
            if ('BroadcastChannel' in window) {
                try {
                    this.broadcastChannel = new BroadcastChannel(changesKey);
                    const listener = (event) => {
                        if ((0, types_1.isString)(event.data)) {
                            this.onDidReceiveChanges(event.data);
                        }
                    };
                    this.broadcastChannel.addEventListener('message', listener);
                    this._register((0, lifecycle_1.toDisposable)(() => {
                        if (this.broadcastChannel) {
                            this.broadcastChannel.removeEventListener('message', listener);
                            this.broadcastChannel.close();
                        }
                    }));
                }
                catch (error) {
                    console.warn('Error while creating broadcast channel. Falling back to localStorage.', (0, errors_1.getErrorMessage)(error));
                    this.createStorageBroadcastChannel(changesKey);
                }
            }
            // BroadcastChannel is not supported. Use storage.
            else {
                this.createStorageBroadcastChannel(changesKey);
            }
        }
        createStorageBroadcastChannel(changesKey) {
            const listener = (event) => {
                if (event.key === changesKey && event.newValue) {
                    this.onDidReceiveChanges(event.newValue);
                }
            };
            window.addEventListener('storage', listener);
            this._register((0, lifecycle_1.toDisposable)(() => window.removeEventListener('storage', listener)));
        }
        onDidReceiveChanges(data) {
            try {
                const changesDto = JSON.parse(data);
                this._onDidFileChanges.fire(changesDto.map(c => ({ type: c.type, resource: uri_1.URI.revive(c.resource) })));
            }
            catch (error) { /* ignore*/ }
        }
        postChanges(changes) {
            if (this.broadcastChannel) {
                this.broadcastChannel.postMessage(JSON.stringify(changes));
            }
            else {
                // remove previous changes so that event is triggered even if new changes are same as old changes
                window.localStorage.removeItem(this.changesKey);
                window.localStorage.setItem(this.changesKey, JSON.stringify(changes));
            }
        }
    }
    class IndexedDBFileSystemProvider extends lifecycle_1.Disposable {
        constructor(scheme, indexedDB, store, watchCrossWindowChanges) {
            super();
            this.indexedDB = indexedDB;
            this.store = store;
            this.capabilities = 2 /* FileSystemProviderCapabilities.FileReadWrite */
                | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
            this.onDidChangeCapabilities = event_1.Event.None;
            this.extUri = new resources_1.ExtUri(() => false) /* Case Sensitive */;
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this.versions = new Map();
            this.fileWriteBatch = [];
            this.writeManyThrottler = new async_1.Throttler();
            if (watchCrossWindowChanges) {
                this.changesBroadcastChannel = this._register(new IndexedDBChangesBroadcastChannel(`vscode.indexedDB.${scheme}.changes`));
                this._register(this.changesBroadcastChannel.onDidFileChanges(changes => this._onDidChangeFile.fire(changes)));
            }
        }
        watch(resource, opts) {
            return lifecycle_1.Disposable.None;
        }
        async mkdir(resource) {
            try {
                const resourceStat = await this.stat(resource);
                if (resourceStat.type === files_1.FileType.File) {
                    throw ERR_FILE_NOT_DIR;
                }
            }
            catch (error) { /* Ignore */ }
            (await this.getFiletree()).add(resource.path, { type: 'dir' });
        }
        async stat(resource) {
            var _a;
            const entry = (await this.getFiletree()).read(resource.path);
            if ((entry === null || entry === void 0 ? void 0 : entry.type) === files_1.FileType.File) {
                return {
                    type: files_1.FileType.File,
                    ctime: 0,
                    mtime: this.versions.get(resource.toString()) || 0,
                    size: (_a = entry.size) !== null && _a !== void 0 ? _a : (await this.readFile(resource)).byteLength
                };
            }
            if ((entry === null || entry === void 0 ? void 0 : entry.type) === files_1.FileType.Directory) {
                return {
                    type: files_1.FileType.Directory,
                    ctime: 0,
                    mtime: 0,
                    size: 0
                };
            }
            throw ERR_FILE_NOT_FOUND;
        }
        async readdir(resource) {
            const entry = (await this.getFiletree()).read(resource.path);
            if (!entry) {
                // Dirs aren't saved to disk, so empty dirs will be lost on reload.
                // Thus we have two options for what happens when you try to read a dir and nothing is found:
                // - Throw FileSystemProviderErrorCode.FileNotFound
                // - Return []
                // We choose to return [] as creating a dir then reading it (even after reload) should not throw an error.
                return [];
            }
            if (entry.type !== files_1.FileType.Directory) {
                throw ERR_FILE_NOT_DIR;
            }
            else {
                return [...entry.children.entries()].map(([name, node]) => [name, node.type]);
            }
        }
        async readFile(resource) {
            const result = await this.indexedDB.runInTransaction(this.store, 'readonly', objectStore => objectStore.get(resource.path));
            if (result === undefined) {
                throw ERR_FILE_NOT_FOUND;
            }
            const buffer = result instanceof Uint8Array ? result : (0, types_1.isString)(result) ? buffer_1.VSBuffer.fromString(result).buffer : undefined;
            if (buffer === undefined) {
                throw ERR_UNKNOWN_INTERNAL(`IndexedDB entry at "${resource.path}" in unexpected format`);
            }
            // update cache
            const fileTree = await this.getFiletree();
            fileTree.add(resource.path, { type: 'file', size: buffer.byteLength });
            return buffer;
        }
        async writeFile(resource, content, opts) {
            const existing = await this.stat(resource).catch(() => undefined);
            if ((existing === null || existing === void 0 ? void 0 : existing.type) === files_1.FileType.Directory) {
                throw ERR_FILE_IS_DIR;
            }
            await this.bulkWrite([[resource, content]]);
        }
        async rename(from, to, opts) {
            const fileTree = await this.getFiletree();
            const fromEntry = fileTree.read(from.path);
            if (!fromEntry) {
                throw ERR_FILE_NOT_FOUND;
            }
            const toEntry = fileTree.read(to.path);
            if (toEntry) {
                if (!opts.overwrite) {
                    throw new files_1.FileSystemProviderError('file exists already', files_1.FileSystemProviderErrorCode.FileExists);
                }
                if (toEntry.type !== fromEntry.type) {
                    throw new files_1.FileSystemProviderError('Cannot rename files with different types', files_1.FileSystemProviderErrorCode.Unknown);
                }
                // delete the target file if exists
                await this.delete(to, { recursive: true, useTrash: false });
            }
            const toTargetResource = (path) => this.extUri.joinPath(to, this.extUri.relativePath(from, from.with({ path })) || '');
            const sourceEntries = await this.tree(from);
            const sourceFiles = [];
            for (const sourceEntry of sourceEntries) {
                if (sourceEntry[1] === files_1.FileType.File) {
                    sourceFiles.push(sourceEntry);
                }
                else if (sourceEntry[1] === files_1.FileType.Directory) {
                    // add directories to the tree
                    fileTree.add(toTargetResource(sourceEntry[0]).path, { type: 'dir' });
                }
            }
            if (sourceFiles.length) {
                const targetFiles = [];
                const sourceFilesContents = await this.indexedDB.runInTransaction(this.store, 'readonly', objectStore => sourceFiles.map(([path]) => objectStore.get(path)));
                for (let index = 0; index < sourceFiles.length; index++) {
                    const content = sourceFilesContents[index] instanceof Uint8Array ? sourceFilesContents[index] : (0, types_1.isString)(sourceFilesContents[index]) ? buffer_1.VSBuffer.fromString(sourceFilesContents[index]).buffer : undefined;
                    if (content) {
                        targetFiles.push([toTargetResource(sourceFiles[index][0]), content]);
                    }
                }
                await this.bulkWrite(targetFiles);
            }
            await this.delete(from, { recursive: true, useTrash: false });
        }
        async delete(resource, opts) {
            let stat;
            try {
                stat = await this.stat(resource);
            }
            catch (e) {
                if (e.code === files_1.FileSystemProviderErrorCode.FileNotFound) {
                    return;
                }
                throw e;
            }
            let toDelete;
            if (opts.recursive) {
                const tree = await this.tree(resource);
                toDelete = tree.map(([path]) => path);
            }
            else {
                if (stat.type === files_1.FileType.Directory && (await this.readdir(resource)).length) {
                    throw ERR_DIR_NOT_EMPTY;
                }
                toDelete = [resource.path];
            }
            await this.deleteKeys(toDelete);
            (await this.getFiletree()).delete(resource.path);
            toDelete.forEach(key => this.versions.delete(key));
            this.triggerChanges(toDelete.map(path => ({ resource: resource.with({ path }), type: 2 /* FileChangeType.DELETED */ })));
        }
        async tree(resource) {
            const stat = await this.stat(resource);
            const allEntries = [[resource.path, stat.type]];
            if (stat.type === files_1.FileType.Directory) {
                const dirEntries = await this.readdir(resource);
                for (const [key, type] of dirEntries) {
                    const childResource = this.extUri.joinPath(resource, key);
                    allEntries.push([childResource.path, type]);
                    if (type === files_1.FileType.Directory) {
                        const childEntries = await this.tree(childResource);
                        allEntries.push(...childEntries);
                    }
                }
            }
            return allEntries;
        }
        triggerChanges(changes) {
            if (changes.length) {
                this._onDidChangeFile.fire(changes);
                if (this.changesBroadcastChannel) {
                    this.changesBroadcastChannel.postChanges(changes);
                }
            }
        }
        getFiletree() {
            if (!this.cachedFiletree) {
                this.cachedFiletree = (async () => {
                    const rootNode = new IndexedDBFileSystemNode({
                        children: new Map(),
                        path: '',
                        type: files_1.FileType.Directory
                    });
                    const result = await this.indexedDB.runInTransaction(this.store, 'readonly', objectStore => objectStore.getAllKeys());
                    const keys = result.map(key => key.toString());
                    keys.forEach(key => rootNode.add(key, { type: 'file' }));
                    return rootNode;
                })();
            }
            return this.cachedFiletree;
        }
        async bulkWrite(files) {
            files.forEach(([resource, content]) => this.fileWriteBatch.push({ content, resource }));
            await this.writeManyThrottler.queue(() => this.writeMany());
            const fileTree = await this.getFiletree();
            for (const [resource, content] of files) {
                fileTree.add(resource.path, { type: 'file', size: content.byteLength });
                this.versions.set(resource.toString(), (this.versions.get(resource.toString()) || 0) + 1);
            }
            this.triggerChanges(files.map(([resource]) => ({ resource, type: 0 /* FileChangeType.UPDATED */ })));
        }
        async writeMany() {
            if (this.fileWriteBatch.length) {
                const fileBatch = this.fileWriteBatch.splice(0, this.fileWriteBatch.length);
                await this.indexedDB.runInTransaction(this.store, 'readwrite', objectStore => fileBatch.map(entry => objectStore.put(entry.content, entry.resource.path)));
            }
        }
        async deleteKeys(keys) {
            if (keys.length) {
                await this.indexedDB.runInTransaction(this.store, 'readwrite', objectStore => keys.map(key => objectStore.delete(key)));
            }
        }
        async reset() {
            await this.indexedDB.runInTransaction(this.store, 'readwrite', objectStore => objectStore.clear());
        }
    }
    exports.IndexedDBFileSystemProvider = IndexedDBFileSystemProvider;
});
//# sourceMappingURL=indexedDBFileSystemProvider.js.map