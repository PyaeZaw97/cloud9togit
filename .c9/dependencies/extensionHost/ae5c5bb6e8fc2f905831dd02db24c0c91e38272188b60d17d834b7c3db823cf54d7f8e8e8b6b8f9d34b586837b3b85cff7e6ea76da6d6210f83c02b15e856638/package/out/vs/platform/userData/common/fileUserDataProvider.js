define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stream", "vs/base/common/map", "vs/base/common/buffer"], function (require, exports, event_1, lifecycle_1, stream_1, map_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileUserDataProvider = void 0;
    /**
     * This is a wrapper on top of the local filesystem provider which will
     * 	- Convert the user data resources to file system scheme and vice-versa
     *  - Enforces atomic reads for user data
     */
    class FileUserDataProvider extends lifecycle_1.Disposable {
        constructor(fileSystemScheme, fileSystemProvider, userDataScheme, logService) {
            super();
            this.fileSystemScheme = fileSystemScheme;
            this.fileSystemProvider = fileSystemProvider;
            this.userDataScheme = userDataScheme;
            this.logService = logService;
            this.onDidChangeCapabilities = this.fileSystemProvider.onDidChangeCapabilities;
            this._onDidChangeFile = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChangeFile.event;
            this.watchResources = map_1.TernarySearchTree.forUris(() => !(this.capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */));
            this._register(this.fileSystemProvider.onDidChangeFile(e => this.handleFileChanges(e)));
        }
        get capabilities() { return this.fileSystemProvider.capabilities & ~4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */; }
        watch(resource, opts) {
            this.watchResources.set(resource, resource);
            const disposable = this.fileSystemProvider.watch(this.toFileSystemResource(resource), opts);
            return (0, lifecycle_1.toDisposable)(() => {
                this.watchResources.delete(resource);
                disposable.dispose();
            });
        }
        stat(resource) {
            return this.fileSystemProvider.stat(this.toFileSystemResource(resource));
        }
        mkdir(resource) {
            return this.fileSystemProvider.mkdir(this.toFileSystemResource(resource));
        }
        rename(from, to, opts) {
            return this.fileSystemProvider.rename(this.toFileSystemResource(from), this.toFileSystemResource(to), opts);
        }
        readFile(resource) {
            return this.fileSystemProvider.readFile(this.toFileSystemResource(resource), { atomic: true });
        }
        readFileStream(resource, opts, token) {
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer);
            (async () => {
                try {
                    const contents = await this.readFile(resource);
                    stream.end(contents);
                }
                catch (error) {
                    stream.error(error);
                    stream.end();
                }
            })();
            return stream;
        }
        readdir(resource) {
            return this.fileSystemProvider.readdir(this.toFileSystemResource(resource));
        }
        writeFile(resource, content, opts) {
            return this.fileSystemProvider.writeFile(this.toFileSystemResource(resource), content, opts);
        }
        delete(resource, opts) {
            return this.fileSystemProvider.delete(this.toFileSystemResource(resource), opts);
        }
        handleFileChanges(changes) {
            const userDataChanges = [];
            for (const change of changes) {
                if (change.resource.scheme !== this.fileSystemScheme) {
                    continue; // only interested in file schemes
                }
                const userDataResource = this.toUserDataResource(change.resource);
                if (this.watchResources.findSubstr(userDataResource)) {
                    userDataChanges.push({
                        resource: userDataResource,
                        type: change.type
                    });
                }
            }
            if (userDataChanges.length) {
                this.logService.debug('User data changed');
                this._onDidChangeFile.fire(userDataChanges);
            }
        }
        toFileSystemResource(userDataResource) {
            return userDataResource.with({ scheme: this.fileSystemScheme });
        }
        toUserDataResource(fileSystemResource) {
            return fileSystemResource.with({ scheme: this.userDataScheme });
        }
    }
    exports.FileUserDataProvider = FileUserDataProvider;
});
//# sourceMappingURL=fileUserDataProvider.js.map