/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/editor/common/services/model", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/search/common/search", "vs/workbench/services/search/common/searchService", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/worker/simpleWorker", "vs/base/common/lifecycle", "vs/base/browser/defaultWorkerFactory", "vs/platform/instantiation/common/extensions", "vs/base/common/decorators", "vs/base/common/network", "vs/base/common/uri", "vs/base/common/event", "vs/nls", "vs/platform/files/browser/webFileSystemAccess"], function (require, exports, model_1, files_1, instantiation_1, log_1, telemetry_1, editorService_1, extensions_1, search_1, searchService_1, uriIdentity_1, simpleWorker_1, lifecycle_1, defaultWorkerFactory_1, extensions_2, decorators_1, network_1, uri_1, event_1, nls_1, webFileSystemAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LocalFileSearchWorkerClient = exports.RemoteSearchService = void 0;
    let RemoteSearchService = class RemoteSearchService extends searchService_1.SearchService {
        constructor(modelService, editorService, telemetryService, logService, extensionService, fileService, instantiationService, uriIdentityService) {
            super(modelService, editorService, telemetryService, logService, extensionService, fileService, uriIdentityService);
            this.instantiationService = instantiationService;
            const searchProvider = this.instantiationService.createInstance(LocalFileSearchWorkerClient);
            this.registerSearchResultProvider(network_1.Schemas.file, 0 /* SearchProviderType.file */, searchProvider);
            this.registerSearchResultProvider(network_1.Schemas.file, 1 /* SearchProviderType.text */, searchProvider);
        }
    };
    RemoteSearchService = __decorate([
        __param(0, model_1.IModelService),
        __param(1, editorService_1.IEditorService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, log_1.ILogService),
        __param(4, extensions_1.IExtensionService),
        __param(5, files_1.IFileService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, uriIdentity_1.IUriIdentityService)
    ], RemoteSearchService);
    exports.RemoteSearchService = RemoteSearchService;
    let LocalFileSearchWorkerClient = class LocalFileSearchWorkerClient extends lifecycle_1.Disposable {
        constructor(fileService, uriIdentityService) {
            super();
            this.fileService = fileService;
            this.uriIdentityService = uriIdentityService;
            this._onDidReceiveTextSearchMatch = new event_1.Emitter();
            this.onDidReceiveTextSearchMatch = this._onDidReceiveTextSearchMatch.event;
            this.queryId = 0;
            this._worker = null;
            this._workerFactory = new defaultWorkerFactory_1.DefaultWorkerFactory('localFileSearchWorker');
        }
        sendTextSearchMatch(match, queryId) {
            this._onDidReceiveTextSearchMatch.fire({ match, queryId });
        }
        get fileSystemProvider() {
            return this.fileService.getProvider(network_1.Schemas.file);
        }
        async cancelQuery(queryId) {
            const proxy = await this._getOrCreateWorker().getProxyObject();
            proxy.cancelQuery(queryId);
        }
        async textSearch(query, onProgress, token) {
            try {
                const queryDisposables = new lifecycle_1.DisposableStore();
                const proxy = await this._getOrCreateWorker().getProxyObject();
                const results = [];
                let limitHit = false;
                await Promise.all(query.folderQueries.map(async (fq) => {
                    const queryId = this.queryId++;
                    queryDisposables.add((token === null || token === void 0 ? void 0 : token.onCancellationRequested(e => this.cancelQuery(queryId))) || lifecycle_1.Disposable.None);
                    const handle = await this.fileSystemProvider.getHandle(fq.folder);
                    if (!handle || !webFileSystemAccess_1.WebFileSystemAccess.isFileSystemDirectoryHandle(handle)) {
                        console.error('Could not get directory handle for ', fq);
                        return;
                    }
                    const reviveMatch = (result) => ({
                        resource: uri_1.URI.revive(result.resource),
                        results: result.results
                    });
                    queryDisposables.add(this.onDidReceiveTextSearchMatch(e => {
                        if (e.queryId === queryId) {
                            onProgress === null || onProgress === void 0 ? void 0 : onProgress(reviveMatch(e.match));
                        }
                    }));
                    const ignorePathCasing = this.uriIdentityService.extUri.ignorePathCasing(fq.folder);
                    const folderResults = await proxy.searchDirectory(handle, query, fq, ignorePathCasing, queryId);
                    for (const folderResult of folderResults.results) {
                        results.push(reviveMatch(folderResult));
                    }
                    if (folderResults.limitHit) {
                        limitHit = true;
                    }
                }));
                queryDisposables.dispose();
                const result = { messages: [], results, limitHit };
                return result;
            }
            catch (e) {
                console.error('Error performing web worker text search', e);
                return {
                    results: [],
                    messages: [{
                            text: (0, nls_1.localize)('errorSearchText', "Unable to search with Web Worker text searcher"), type: search_1.TextSearchCompleteMessageType.Warning
                        }],
                };
            }
        }
        async fileSearch(query, token) {
            try {
                const queryDisposables = new lifecycle_1.DisposableStore();
                let limitHit = false;
                const proxy = await this._getOrCreateWorker().getProxyObject();
                const results = [];
                await Promise.all(query.folderQueries.map(async (fq) => {
                    const queryId = this.queryId++;
                    queryDisposables.add((token === null || token === void 0 ? void 0 : token.onCancellationRequested(e => this.cancelQuery(queryId))) || lifecycle_1.Disposable.None);
                    const handle = await this.fileSystemProvider.getHandle(fq.folder);
                    if (!handle || !webFileSystemAccess_1.WebFileSystemAccess.isFileSystemDirectoryHandle(handle)) {
                        console.error('Could not get directory handle for ', fq);
                        return;
                    }
                    const caseSensitive = this.uriIdentityService.extUri.ignorePathCasing(fq.folder);
                    const folderResults = await proxy.listDirectory(handle, query, fq, caseSensitive, queryId);
                    for (const folderResult of folderResults.results) {
                        results.push({ resource: uri_1.URI.joinPath(fq.folder, folderResult) });
                    }
                    if (folderResults.limitHit) {
                        limitHit = true;
                    }
                }));
                queryDisposables.dispose();
                const result = { messages: [], results, limitHit };
                return result;
            }
            catch (e) {
                console.error('Error performing web worker file search', e);
                return {
                    results: [],
                    messages: [{
                            text: (0, nls_1.localize)('errorSearchFile', "Unable to search with Web Worker file searcher"), type: search_1.TextSearchCompleteMessageType.Warning
                        }],
                };
            }
        }
        async clearCache(cacheKey) {
            var _a;
            if (((_a = this.cache) === null || _a === void 0 ? void 0 : _a.key) === cacheKey) {
                this.cache = undefined;
            }
        }
        _getOrCreateWorker() {
            if (!this._worker) {
                try {
                    this._worker = this._register(new simpleWorker_1.SimpleWorkerClient(this._workerFactory, 'vs/workbench/services/search/worker/localFileSearch', this));
                }
                catch (err) {
                    (0, simpleWorker_1.logOnceWebWorkerWarning)(err);
                    throw err;
                }
            }
            return this._worker;
        }
    };
    __decorate([
        decorators_1.memoize
    ], LocalFileSearchWorkerClient.prototype, "fileSystemProvider", null);
    LocalFileSearchWorkerClient = __decorate([
        __param(0, files_1.IFileService),
        __param(1, uriIdentity_1.IUriIdentityService)
    ], LocalFileSearchWorkerClient);
    exports.LocalFileSearchWorkerClient = LocalFileSearchWorkerClient;
    (0, extensions_2.registerSingleton)(search_1.ISearchService, RemoteSearchService, true);
});
//# sourceMappingURL=searchService.js.map