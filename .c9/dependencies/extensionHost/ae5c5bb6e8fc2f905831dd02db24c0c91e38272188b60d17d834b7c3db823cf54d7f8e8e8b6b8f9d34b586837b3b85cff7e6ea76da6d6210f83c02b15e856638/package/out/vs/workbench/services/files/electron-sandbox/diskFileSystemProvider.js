/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform", "vs/platform/files/common/diskFileSystemProvider", "vs/platform/files/common/diskFileSystemProviderClient", "vs/workbench/services/files/electron-sandbox/watcherClient"], function (require, exports, platform_1, diskFileSystemProvider_1, diskFileSystemProviderClient_1, watcherClient_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskFileSystemProvider = void 0;
    /**
     * A sandbox ready disk file system provider that delegates almost all calls
     * to the main process via `DiskFileSystemProviderServer` except for recursive
     * file watching that is done via shared process workers due to CPU intensity.
     */
    class DiskFileSystemProvider extends diskFileSystemProvider_1.AbstractDiskFileSystemProvider {
        constructor(mainProcessService, sharedProcessWorkerWorkbenchService, logService) {
            super(logService, { watcher: { forceUniversal: true /* send all requests to universal watcher process */ } });
            this.mainProcessService = mainProcessService;
            this.sharedProcessWorkerWorkbenchService = sharedProcessWorkerWorkbenchService;
            this.provider = this._register(new diskFileSystemProviderClient_1.DiskFileSystemProviderClient(this.mainProcessService.getChannel(diskFileSystemProviderClient_1.LOCAL_FILE_SYSTEM_CHANNEL_NAME), { pathCaseSensitive: platform_1.isLinux, trash: true }));
            this.registerListeners();
        }
        registerListeners() {
            // Forward events from the embedded provider
            this.provider.onDidChangeFile(changes => this._onDidChangeFile.fire(changes));
            this.provider.onDidWatchError(error => this._onDidWatchError.fire(error));
        }
        //#region File Capabilities
        get onDidChangeCapabilities() { return this.provider.onDidChangeCapabilities; }
        get capabilities() { return this.provider.capabilities; }
        //#endregion
        //#region File Metadata Resolving
        stat(resource) {
            return this.provider.stat(resource);
        }
        readdir(resource) {
            return this.provider.readdir(resource);
        }
        //#endregion
        //#region File Reading/Writing
        readFile(resource, opts) {
            return this.provider.readFile(resource, opts);
        }
        readFileStream(resource, opts, token) {
            return this.provider.readFileStream(resource, opts, token);
        }
        writeFile(resource, content, opts) {
            return this.provider.writeFile(resource, content, opts);
        }
        open(resource, opts) {
            return this.provider.open(resource, opts);
        }
        close(fd) {
            return this.provider.close(fd);
        }
        read(fd, pos, data, offset, length) {
            return this.provider.read(fd, pos, data, offset, length);
        }
        write(fd, pos, data, offset, length) {
            return this.provider.write(fd, pos, data, offset, length);
        }
        //#endregion
        //#region Move/Copy/Delete/Create Folder
        mkdir(resource) {
            return this.provider.mkdir(resource);
        }
        delete(resource, opts) {
            return this.provider.delete(resource, opts);
        }
        rename(from, to, opts) {
            return this.provider.rename(from, to, opts);
        }
        copy(from, to, opts) {
            return this.provider.copy(from, to, opts);
        }
        //#endregion
        //#region Clone File
        cloneFile(from, to) {
            return this.provider.cloneFile(from, to);
        }
        //#endregion
        //#region File Watching
        createUniversalWatcher(onChange, onLogMessage, verboseLogging) {
            return new watcherClient_1.UniversalWatcherClient(changes => onChange(changes), msg => onLogMessage(msg), verboseLogging, this.sharedProcessWorkerWorkbenchService);
        }
        createNonRecursiveWatcher() {
            throw new Error('Method not implemented in sandbox.'); // we never expect this to be called given we set `forceUniversal: true`
        }
    }
    exports.DiskFileSystemProvider = DiskFileSystemProvider;
});
//# sourceMappingURL=diskFileSystemProvider.js.map