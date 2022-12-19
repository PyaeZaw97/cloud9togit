/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/platform/files/common/files", "vs/base/common/resources", "vs/base/common/buffer"], function (require, exports, event_1, lifecycle_1, uri_1, files_1, resources_1, buffer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalHistoryFileSystemProvider = void 0;
    /**
     * A wrapper around a standard file system provider
     * that is entirely readonly.
     */
    class LocalHistoryFileSystemProvider {
        constructor(fileService) {
            this.fileService = fileService;
            this.mapSchemeToProvider = new Map();
            //#endregion
            //#region Unsupported File Operations
            this.onDidChangeCapabilities = event_1.Event.None;
            this.onDidChangeFile = event_1.Event.None;
        }
        static toLocalHistoryFileSystem(resource) {
            const serializedLocalHistoryResource = {
                location: resource.location.toString(true),
                associatedResource: resource.associatedResource.toString(true)
            };
            // Try to preserve the associated resource as much as possible
            // and only keep the `query` part dynamic. This enables other
            // components (e.g. other timeline providers) to continue
            // providing timeline entries even when our resource is active.
            return resource.associatedResource.with({
                scheme: LocalHistoryFileSystemProvider.SCHEMA,
                query: JSON.stringify(serializedLocalHistoryResource)
            });
        }
        static fromLocalHistoryFileSystem(resource) {
            const serializedLocalHistoryResource = JSON.parse(resource.query);
            return {
                location: uri_1.URI.parse(serializedLocalHistoryResource.location),
                associatedResource: uri_1.URI.parse(serializedLocalHistoryResource.associatedResource)
            };
        }
        get capabilities() {
            return 2 /* FileSystemProviderCapabilities.FileReadWrite */ | 2048 /* FileSystemProviderCapabilities.Readonly */;
        }
        async withProvider(resource) {
            const scheme = resource.scheme;
            let providerPromise = this.mapSchemeToProvider.get(scheme);
            if (!providerPromise) {
                // Resolve early when provider already exists
                const provider = this.fileService.getProvider(scheme);
                if (provider) {
                    providerPromise = Promise.resolve(provider);
                }
                // Otherwise wait for registration
                else {
                    providerPromise = new Promise(resolve => {
                        const disposable = this.fileService.onDidChangeFileSystemProviderRegistrations(e => {
                            if (e.added && e.provider && e.scheme === scheme) {
                                disposable.dispose();
                                resolve(e.provider);
                            }
                        });
                    });
                }
                this.mapSchemeToProvider.set(scheme, providerPromise);
            }
            return providerPromise;
        }
        //#region Supported File Operations
        async stat(resource) {
            const location = LocalHistoryFileSystemProvider.fromLocalHistoryFileSystem(resource).location;
            // Special case: empty resource
            if ((0, resources_1.isEqual)(LocalHistoryFileSystemProvider.EMPTY_RESOURCE, location)) {
                return { type: files_1.FileType.File, ctime: 0, mtime: 0, size: 0 };
            }
            // Otherwise delegate to provider
            return (await this.withProvider(location)).stat(location);
        }
        async readFile(resource) {
            const location = LocalHistoryFileSystemProvider.fromLocalHistoryFileSystem(resource).location;
            // Special case: empty resource
            if ((0, resources_1.isEqual)(LocalHistoryFileSystemProvider.EMPTY_RESOURCE, location)) {
                return buffer_1.VSBuffer.fromString('').buffer;
            }
            // Otherwise delegate to provider
            const provider = await this.withProvider(location);
            if ((0, files_1.hasReadWriteCapability)(provider)) {
                return provider.readFile(location);
            }
            throw new Error('Unsupported');
        }
        async writeFile(resource, content, opts) { }
        async mkdir(resource) { }
        async readdir(resource) { return []; }
        async rename(from, to, opts) { }
        async delete(resource, opts) { }
        watch(resource, opts) { return lifecycle_1.Disposable.None; }
    }
    exports.LocalHistoryFileSystemProvider = LocalHistoryFileSystemProvider;
    LocalHistoryFileSystemProvider.SCHEMA = 'vscode-local-history';
    LocalHistoryFileSystemProvider.EMPTY_RESOURCE = uri_1.URI.from({ scheme: LocalHistoryFileSystemProvider.SCHEMA, path: '/empty' });
    LocalHistoryFileSystemProvider.EMPTY = {
        location: LocalHistoryFileSystemProvider.EMPTY_RESOURCE,
        associatedResource: LocalHistoryFileSystemProvider.EMPTY_RESOURCE
    };
});
//# sourceMappingURL=localHistoryFileSystemProvider.js.map