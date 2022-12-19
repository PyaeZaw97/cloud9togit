/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/node/uriTransformer", "vs/platform/files/node/diskFileSystemProvider", "vs/base/common/path", "vs/platform/files/node/diskFileSystemProviderServer"], function (require, exports, uri_1, uriTransformer_1, diskFileSystemProvider_1, path_1, diskFileSystemProviderServer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RemoteAgentFileSystemProviderChannel = void 0;
    class RemoteAgentFileSystemProviderChannel extends diskFileSystemProviderServer_1.AbstractDiskFileSystemProviderChannel {
        constructor(logService, environmentService) {
            super(new diskFileSystemProvider_1.DiskFileSystemProvider(logService), logService);
            this.environmentService = environmentService;
            this.uriTransformerCache = new Map();
            this._register(this.provider);
        }
        getUriTransformer(ctx) {
            let transformer = this.uriTransformerCache.get(ctx.remoteAuthority);
            if (!transformer) {
                transformer = (0, uriTransformer_1.createURITransformer)(ctx.remoteAuthority);
                this.uriTransformerCache.set(ctx.remoteAuthority, transformer);
            }
            return transformer;
        }
        transformIncoming(uriTransformer, _resource, supportVSCodeResource = false) {
            if (supportVSCodeResource && _resource.path === '/vscode-resource' && _resource.query) {
                const requestResourcePath = JSON.parse(_resource.query).requestResourcePath;
                return uri_1.URI.from({ scheme: 'file', path: requestResourcePath });
            }
            return uri_1.URI.revive(uriTransformer.transformIncoming(_resource));
        }
        //#region File Watching
        createSessionFileWatcher(uriTransformer, emitter) {
            return new SessionFileWatcher(uriTransformer, emitter, this.logService, this.environmentService);
        }
    }
    exports.RemoteAgentFileSystemProviderChannel = RemoteAgentFileSystemProviderChannel;
    class SessionFileWatcher extends diskFileSystemProviderServer_1.AbstractSessionFileWatcher {
        constructor(uriTransformer, sessionEmitter, logService, environmentService) {
            super(uriTransformer, sessionEmitter, logService, environmentService);
        }
        getRecursiveWatcherOptions(environmentService) {
            const fileWatcherPolling = environmentService.args['file-watcher-polling'];
            if (fileWatcherPolling) {
                const segments = fileWatcherPolling.split(path_1.delimiter);
                const pollingInterval = Number(segments[0]);
                if (pollingInterval > 0) {
                    const usePolling = segments.length > 1 ? segments.slice(1) : true;
                    return { usePolling, pollingInterval };
                }
            }
            return undefined;
        }
        getExtraExcludes(environmentService) {
            if (environmentService.extensionsPath) {
                // when opening the $HOME folder, we end up watching the extension folder
                // so simply exclude watching the extensions folder
                return [path_1.posix.join(environmentService.extensionsPath, '**')];
            }
            return undefined;
        }
    }
});
//# sourceMappingURL=remoteFileSystemProviderServer.js.map