/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/errorMessage", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/stream", "vs/base/common/uri", "vs/base/common/uuid", "vs/platform/files/common/files"], function (require, exports, buffer_1, errorMessage_1, errors_1, event_1, lifecycle_1, stream_1, uri_1, uuid_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskFileSystemProviderClient = exports.LOCAL_FILE_SYSTEM_CHANNEL_NAME = void 0;
    exports.LOCAL_FILE_SYSTEM_CHANNEL_NAME = 'localFilesystem';
    /**
     * An implementation of a local disk file system provider
     * that is backed by a `IChannel` and thus implemented via
     * IPC on a different process.
     */
    class DiskFileSystemProviderClient extends lifecycle_1.Disposable {
        constructor(channel, extraCapabilities) {
            super();
            this.channel = channel;
            this.extraCapabilities = extraCapabilities;
            //#region File Capabilities
            this.onDidChangeCapabilities = event_1.Event.None;
            //#endregion
            //#region File Watching
            this._onDidChange = this._register(new event_1.Emitter());
            this.onDidChangeFile = this._onDidChange.event;
            this._onDidWatchError = this._register(new event_1.Emitter());
            this.onDidWatchError = this._onDidWatchError.event;
            // The contract for file watching via remote is to identify us
            // via a unique but readonly session ID. Since the remote is
            // managing potentially many watchers from different clients,
            // this helps the server to properly partition events to the right
            // clients.
            this.sessionId = (0, uuid_1.generateUuid)();
            this.registerFileChangeListeners();
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
                if (this.extraCapabilities.pathCaseSensitive) {
                    this._capabilities |= 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */;
                }
                if (this.extraCapabilities.trash) {
                    this._capabilities |= 4096 /* FileSystemProviderCapabilities.Trash */;
                }
            }
            return this._capabilities;
        }
        //#endregion
        //#region File Metadata Resolving
        stat(resource) {
            return this.channel.call('stat', [resource]);
        }
        readdir(resource) {
            return this.channel.call('readdir', [resource]);
        }
        //#endregion
        //#region File Reading/Writing
        async readFile(resource, opts) {
            const { buffer } = await this.channel.call('readFile', [resource, opts]);
            return buffer;
        }
        readFileStream(resource, opts, token) {
            const stream = (0, stream_1.newWriteableStream)(data => buffer_1.VSBuffer.concat(data.map(data => buffer_1.VSBuffer.wrap(data))).buffer);
            // Reading as file stream goes through an event to the remote side
            const listener = this.channel.listen('readFileStream', [resource, opts])(dataOrErrorOrEnd => {
                // data
                if (dataOrErrorOrEnd instanceof buffer_1.VSBuffer) {
                    stream.write(dataOrErrorOrEnd.buffer);
                }
                // end or error
                else {
                    if (dataOrErrorOrEnd === 'end') {
                        stream.end();
                    }
                    else {
                        // Since we receive data through a IPC channel, it is likely
                        // that the error was not serialized, or only partially. To
                        // ensure our API use is correct, we convert the data to an
                        // error here to forward it properly.
                        let error = dataOrErrorOrEnd;
                        if (!(error instanceof Error)) {
                            error = (0, files_1.createFileSystemProviderError)((0, errorMessage_1.toErrorMessage)(error), files_1.FileSystemProviderErrorCode.Unknown);
                        }
                        stream.error(error);
                        stream.end();
                    }
                    // Signal to the remote side that we no longer listen
                    listener.dispose();
                }
            });
            // Support cancellation
            token.onCancellationRequested(() => {
                // Ensure to end the stream properly with an error
                // to indicate the cancellation.
                stream.error((0, errors_1.canceled)());
                stream.end();
                // Ensure to dispose the listener upon cancellation. This will
                // bubble through the remote side as event and allows to stop
                // reading the file.
                listener.dispose();
            });
            return stream;
        }
        writeFile(resource, content, opts) {
            return this.channel.call('writeFile', [resource, buffer_1.VSBuffer.wrap(content), opts]);
        }
        open(resource, opts) {
            return this.channel.call('open', [resource, opts]);
        }
        close(fd) {
            return this.channel.call('close', [fd]);
        }
        async read(fd, pos, data, offset, length) {
            const [bytes, bytesRead] = await this.channel.call('read', [fd, pos, length]);
            // copy back the data that was written into the buffer on the remote
            // side. we need to do this because buffers are not referenced by
            // pointer, but only by value and as such cannot be directly written
            // to from the other process.
            data.set(bytes.buffer.slice(0, bytesRead), offset);
            return bytesRead;
        }
        write(fd, pos, data, offset, length) {
            return this.channel.call('write', [fd, pos, buffer_1.VSBuffer.wrap(data), offset, length]);
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        mkdir(resource) {
            return this.channel.call('mkdir', [resource]);
        }
        delete(resource, opts) {
            return this.channel.call('delete', [resource, opts]);
        }
        rename(resource, target, opts) {
            return this.channel.call('rename', [resource, target, opts]);
        }
        copy(resource, target, opts) {
            return this.channel.call('copy', [resource, target, opts]);
        }
        //#endregion
        //#region Clone File
        cloneFile(resource, target) {
            return this.channel.call('cloneFile', [resource, target]);
        }
        registerFileChangeListeners() {
            // The contract for file changes is that there is one listener
            // for both events and errors from the watcher. So we need to
            // unwrap the event from the remote and emit through the proper
            // emitter.
            this._register(this.channel.listen('fileChange', [this.sessionId])(eventsOrError => {
                if (Array.isArray(eventsOrError)) {
                    const events = eventsOrError;
                    this._onDidChange.fire(events.map(event => ({ resource: uri_1.URI.revive(event.resource), type: event.type })));
                }
                else {
                    const error = eventsOrError;
                    this._onDidWatchError.fire(error);
                }
            }));
        }
        watch(resource, opts) {
            // Generate a request UUID to correlate the watcher
            // back to us when we ask to dispose the watcher later.
            const req = (0, uuid_1.generateUuid)();
            this.channel.call('watch', [this.sessionId, req, resource, opts]);
            return (0, lifecycle_1.toDisposable)(() => this.channel.call('unwatch', [this.sessionId, req]));
        }
    }
    exports.DiskFileSystemProviderClient = DiskFileSystemProviderClient;
});
//# sourceMappingURL=diskFileSystemProviderClient.js.map