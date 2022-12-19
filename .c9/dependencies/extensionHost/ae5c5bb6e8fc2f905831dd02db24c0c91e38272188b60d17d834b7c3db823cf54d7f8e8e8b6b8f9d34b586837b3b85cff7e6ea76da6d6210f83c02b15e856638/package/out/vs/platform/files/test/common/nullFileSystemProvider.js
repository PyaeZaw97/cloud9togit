/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NullFileSystemProvider = void 0;
    class NullFileSystemProvider {
        constructor(disposableFactory = () => lifecycle_1.Disposable.None) {
            this.disposableFactory = disposableFactory;
            this.capabilities = 2048 /* FileSystemProviderCapabilities.Readonly */;
            this._onDidChangeCapabilities = new event_1.Emitter();
            this.onDidChangeCapabilities = this._onDidChangeCapabilities.event;
            this._onDidChangeFile = new event_1.Emitter();
            this.onDidChangeFile = this._onDidChangeFile.event;
        }
        emitFileChangeEvents(changes) {
            this._onDidChangeFile.fire(changes);
        }
        setCapabilities(capabilities) {
            this.capabilities = capabilities;
            this._onDidChangeCapabilities.fire();
        }
        watch(resource, opts) { return this.disposableFactory(); }
        async stat(resource) { return undefined; }
        async mkdir(resource) { return undefined; }
        async readdir(resource) { return undefined; }
        async delete(resource, opts) { return undefined; }
        async rename(from, to, opts) { return undefined; }
        async copy(from, to, opts) { return undefined; }
        async readFile(resource) { return undefined; }
        async writeFile(resource, content, opts) { return undefined; }
        async open(resource, opts) { return undefined; }
        async close(fd) { return undefined; }
        async read(fd, pos, data, offset, length) { return undefined; }
        async write(fd, pos, data, offset, length) { return undefined; }
    }
    exports.NullFileSystemProvider = NullFileSystemProvider;
});
//# sourceMappingURL=nullFileSystemProvider.js.map