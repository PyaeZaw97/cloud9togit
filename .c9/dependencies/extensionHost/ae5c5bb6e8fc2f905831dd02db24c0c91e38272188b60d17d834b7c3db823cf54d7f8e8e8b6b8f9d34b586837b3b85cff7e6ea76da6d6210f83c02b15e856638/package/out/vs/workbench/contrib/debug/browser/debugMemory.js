/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/numbers", "vs/base/common/types", "vs/platform/files/common/files", "vs/workbench/contrib/debug/common/debug"], function (require, exports, buffer_1, event_1, lifecycle_1, numbers_1, types_1, files_1, debug_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugMemoryFileSystemProvider = void 0;
    const rangeRe = /range=([0-9]+):([0-9]+)/;
    class DebugMemoryFileSystemProvider {
        constructor(debugService) {
            this.debugService = debugService;
            this.memoryFdCounter = 0;
            this.fdMemory = new Map();
            this.changeEmitter = new event_1.Emitter();
            /** @inheritdoc */
            this.onDidChangeCapabilities = event_1.Event.None;
            /** @inheritdoc */
            this.onDidChangeFile = this.changeEmitter.event;
            /** @inheritdoc */
            this.capabilities = 0
                | 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */
                | 4 /* FileSystemProviderCapabilities.FileOpenReadWriteClose */;
            debugService.onDidEndSession(session => {
                for (const [fd, memory] of this.fdMemory) {
                    if (memory.session === session) {
                        this.close(fd);
                    }
                }
            });
        }
        watch(resource, opts) {
            if (opts.recursive) {
                return (0, lifecycle_1.toDisposable)(() => { });
            }
            const { session, memoryReference, offset } = this.parseUri(resource);
            const disposable = new lifecycle_1.DisposableStore();
            disposable.add(session.onDidChangeState(() => {
                if (session.state === 3 /* State.Running */ || session.state === 0 /* State.Inactive */) {
                    this.changeEmitter.fire([{ type: 2 /* FileChangeType.DELETED */, resource }]);
                }
            }));
            disposable.add(session.onDidInvalidateMemory(e => {
                if (e.body.memoryReference !== memoryReference) {
                    return;
                }
                if (offset && (e.body.offset >= offset.toOffset || e.body.offset + e.body.count < offset.fromOffset)) {
                    return;
                }
                this.changeEmitter.fire([{ resource, type: 0 /* FileChangeType.UPDATED */ }]);
            }));
            return disposable;
        }
        /** @inheritdoc */
        stat(file) {
            const { readOnly } = this.parseUri(file);
            return Promise.resolve({
                type: files_1.FileType.File,
                mtime: 0,
                ctime: 0,
                size: 0,
                permissions: readOnly ? files_1.FilePermission.Readonly : undefined,
            });
        }
        /** @inheritdoc */
        mkdir() {
            throw new files_1.FileSystemProviderError(`Not allowed`, files_1.FileSystemProviderErrorCode.NoPermissions);
        }
        /** @inheritdoc */
        readdir() {
            throw new files_1.FileSystemProviderError(`Not allowed`, files_1.FileSystemProviderErrorCode.NoPermissions);
        }
        /** @inheritdoc */
        delete() {
            throw new files_1.FileSystemProviderError(`Not allowed`, files_1.FileSystemProviderErrorCode.NoPermissions);
        }
        /** @inheritdoc */
        rename() {
            throw new files_1.FileSystemProviderError(`Not allowed`, files_1.FileSystemProviderErrorCode.NoPermissions);
        }
        /** @inheritdoc */
        open(resource, _opts) {
            const { session, memoryReference, offset } = this.parseUri(resource);
            const fd = this.memoryFdCounter++;
            let region = session.getMemory(memoryReference);
            if (offset) {
                region = new MemoryRegionView(region, offset);
            }
            this.fdMemory.set(fd, { session, region });
            return Promise.resolve(fd);
        }
        /** @inheritdoc */
        close(fd) {
            var _a;
            (_a = this.fdMemory.get(fd)) === null || _a === void 0 ? void 0 : _a.region.dispose();
            this.fdMemory.delete(fd);
            return Promise.resolve();
        }
        /** @inheritdoc */
        async writeFile(resource, content) {
            const { offset } = this.parseUri(resource);
            if (!offset) {
                throw new files_1.FileSystemProviderError(`Range must be present to read a file`, files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            const fd = await this.open(resource, { create: false });
            try {
                await this.write(fd, offset.fromOffset, content, 0, content.length);
            }
            finally {
                this.close(fd);
            }
        }
        /** @inheritdoc */
        async readFile(resource) {
            const { offset } = this.parseUri(resource);
            if (!offset) {
                throw new files_1.FileSystemProviderError(`Range must be present to read a file`, files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            const data = new Uint8Array(offset.toOffset - offset.fromOffset);
            const fd = await this.open(resource, { create: false });
            try {
                await this.read(fd, offset.fromOffset, data, 0, data.length);
                return data;
            }
            finally {
                this.close(fd);
            }
        }
        /** @inheritdoc */
        async read(fd, pos, data, offset, length) {
            const memory = this.fdMemory.get(fd);
            if (!memory) {
                throw new files_1.FileSystemProviderError(`No file with that descriptor open`, files_1.FileSystemProviderErrorCode.Unavailable);
            }
            const ranges = await memory.region.read(pos, length);
            let readSoFar = 0;
            for (const range of ranges) {
                switch (range.type) {
                    case 1 /* MemoryRangeType.Unreadable */:
                        return readSoFar;
                    case 2 /* MemoryRangeType.Error */:
                        if (readSoFar > 0) {
                            return readSoFar;
                        }
                        else {
                            throw new files_1.FileSystemProviderError(range.error, files_1.FileSystemProviderErrorCode.Unknown);
                        }
                    case 0 /* MemoryRangeType.Valid */: {
                        const start = Math.max(0, pos - range.offset);
                        const toWrite = range.data.slice(start, Math.min(range.data.byteLength, start + (length - readSoFar)));
                        data.set(toWrite.buffer, offset + readSoFar);
                        readSoFar += toWrite.byteLength;
                        break;
                    }
                    default:
                        (0, types_1.assertNever)(range);
                }
            }
            return readSoFar;
        }
        /** @inheritdoc */
        write(fd, pos, data, offset, length) {
            const memory = this.fdMemory.get(fd);
            if (!memory) {
                throw new files_1.FileSystemProviderError(`No file with that descriptor open`, files_1.FileSystemProviderErrorCode.Unavailable);
            }
            return memory.region.write(pos, buffer_1.VSBuffer.wrap(data).slice(offset, offset + length));
        }
        parseUri(uri) {
            if (uri.scheme !== debug_1.DEBUG_MEMORY_SCHEME) {
                throw new files_1.FileSystemProviderError(`Cannot open file with scheme ${uri.scheme}`, files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            const session = this.debugService.getModel().getSession(uri.authority);
            if (!session) {
                throw new files_1.FileSystemProviderError(`Debug session not found`, files_1.FileSystemProviderErrorCode.FileNotFound);
            }
            let offset;
            const rangeMatch = rangeRe.exec(uri.query);
            if (rangeMatch) {
                offset = { fromOffset: Number(rangeMatch[1]), toOffset: Number(rangeMatch[2]) };
            }
            const [, memoryReference] = uri.path.split('/');
            return {
                session,
                offset,
                readOnly: !session.capabilities.supportsWriteMemoryRequest,
                sessionId: uri.authority,
                memoryReference: decodeURIComponent(memoryReference),
            };
        }
    }
    exports.DebugMemoryFileSystemProvider = DebugMemoryFileSystemProvider;
    /** A wrapper for a MemoryRegion that references a subset of data in another region. */
    class MemoryRegionView extends lifecycle_1.Disposable {
        constructor(parent, range) {
            super();
            this.parent = parent;
            this.range = range;
            this.invalidateEmitter = new event_1.Emitter();
            this.onDidInvalidate = this.invalidateEmitter.event;
            this.width = this.range.toOffset - this.range.fromOffset;
            this.writable = parent.writable;
            this._register(parent);
            this._register(parent.onDidInvalidate(e => {
                const fromOffset = (0, numbers_1.clamp)(e.fromOffset - range.fromOffset, 0, this.width);
                const toOffset = (0, numbers_1.clamp)(e.toOffset - range.fromOffset, 0, this.width);
                if (toOffset > fromOffset) {
                    this.invalidateEmitter.fire({ fromOffset, toOffset });
                }
            }));
        }
        read(fromOffset, toOffset) {
            if (fromOffset < 0) {
                throw new RangeError(`Invalid fromOffset: ${fromOffset}`);
            }
            return this.parent.read(this.range.fromOffset + fromOffset, this.range.fromOffset + Math.min(toOffset, this.width));
        }
        write(offset, data) {
            return this.parent.write(this.range.fromOffset + offset, data);
        }
    }
});
//# sourceMappingURL=debugMemory.js.map