/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "electron", "vs/nls", "vs/base/common/platform", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/path", "vs/platform/files/node/diskFileSystemProviderServer", "vs/base/common/uriIpc"], function (require, exports, electron_1, nls_1, platform_1, uri_1, files_1, path_1, diskFileSystemProviderServer_1, uriIpc_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiskFileSystemProviderChannel = void 0;
    class DiskFileSystemProviderChannel extends diskFileSystemProviderServer_1.AbstractDiskFileSystemProviderChannel {
        constructor(provider, logService, environmentService) {
            super(provider, logService);
            this.environmentService = environmentService;
        }
        getUriTransformer(ctx) {
            return uriIpc_1.DefaultURITransformer;
        }
        transformIncoming(uriTransformer, _resource) {
            return uri_1.URI.revive(_resource);
        }
        //#region Delete: override to support Electron's trash support
        async delete(uriTransformer, _resource, opts) {
            if (!opts.useTrash) {
                return super.delete(uriTransformer, _resource, opts);
            }
            const resource = this.transformIncoming(uriTransformer, _resource);
            const filePath = (0, path_1.normalize)(resource.fsPath);
            try {
                await electron_1.shell.trashItem(filePath);
            }
            catch (error) {
                throw (0, files_1.createFileSystemProviderError)(platform_1.isWindows ? (0, nls_1.localize)('binFailed', "Failed to move '{0}' to the recycle bin", (0, path_1.basename)(filePath)) : (0, nls_1.localize)('trashFailed', "Failed to move '{0}' to the trash", (0, path_1.basename)(filePath)), files_1.FileSystemProviderErrorCode.Unknown);
            }
        }
        //#endregion
        //#region File Watching
        createSessionFileWatcher(uriTransformer, emitter) {
            return new SessionFileWatcher(uriTransformer, emitter, this.logService, this.environmentService);
        }
    }
    exports.DiskFileSystemProviderChannel = DiskFileSystemProviderChannel;
    class SessionFileWatcher extends diskFileSystemProviderServer_1.AbstractSessionFileWatcher {
        watch(req, resource, opts) {
            if (opts.recursive) {
                throw (0, files_1.createFileSystemProviderError)('Recursive file watching is not supported from main process for performance reasons.', files_1.FileSystemProviderErrorCode.Unavailable);
            }
            return super.watch(req, resource, opts);
        }
    }
});
//# sourceMappingURL=diskFileSystemProviderServer.js.map