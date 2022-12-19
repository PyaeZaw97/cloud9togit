/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/extpath", "vs/base/common/network", "vs/base/common/path", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/webview/common/mimeTypes"], function (require, exports, extpath_1, network_1, path_1, uri_1, files_1, mimeTypes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.loadLocalResource = exports.WebviewResourceResponse = void 0;
    var WebviewResourceResponse;
    (function (WebviewResourceResponse) {
        let Type;
        (function (Type) {
            Type[Type["Success"] = 0] = "Success";
            Type[Type["Failed"] = 1] = "Failed";
            Type[Type["AccessDenied"] = 2] = "AccessDenied";
            Type[Type["NotModified"] = 3] = "NotModified";
        })(Type = WebviewResourceResponse.Type || (WebviewResourceResponse.Type = {}));
        class StreamSuccess {
            constructor(stream, etag, mtime, mimeType) {
                this.stream = stream;
                this.etag = etag;
                this.mtime = mtime;
                this.mimeType = mimeType;
                this.type = Type.Success;
            }
        }
        WebviewResourceResponse.StreamSuccess = StreamSuccess;
        WebviewResourceResponse.Failed = { type: Type.Failed };
        WebviewResourceResponse.AccessDenied = { type: Type.AccessDenied };
        class NotModified {
            constructor(mimeType, mtime) {
                this.mimeType = mimeType;
                this.mtime = mtime;
                this.type = Type.NotModified;
            }
        }
        WebviewResourceResponse.NotModified = NotModified;
    })(WebviewResourceResponse = exports.WebviewResourceResponse || (exports.WebviewResourceResponse = {}));
    async function loadLocalResource(requestUri, options, fileService, logService, token) {
        var _a;
        logService.debug(`loadLocalResource - begin. requestUri=${requestUri}`);
        const resourceToLoad = getResourceToLoad(requestUri, options.roots);
        logService.debug(`loadLocalResource - found resource to load. requestUri=${requestUri}, resourceToLoad=${resourceToLoad}`);
        if (!resourceToLoad) {
            return WebviewResourceResponse.AccessDenied;
        }
        const mime = (0, mimeTypes_1.getWebviewContentMimeType)(requestUri); // Use the original path for the mime
        try {
            const result = await fileService.readFileStream(resourceToLoad, { etag: options.ifNoneMatch });
            return new WebviewResourceResponse.StreamSuccess(result.value, result.etag, result.mtime, mime);
        }
        catch (err) {
            if (err instanceof files_1.FileOperationError) {
                const result = err.fileOperationResult;
                // NotModified status is expected and can be handled gracefully
                if (result === 2 /* FileOperationResult.FILE_NOT_MODIFIED_SINCE */) {
                    return new WebviewResourceResponse.NotModified(mime, (_a = err.options) === null || _a === void 0 ? void 0 : _a.mtime);
                }
            }
            // Otherwise the error is unexpected.
            logService.debug(`loadLocalResource - Error using fileReader. requestUri=${requestUri}`);
            console.log(err);
            return WebviewResourceResponse.Failed;
        }
    }
    exports.loadLocalResource = loadLocalResource;
    function getResourceToLoad(requestUri, roots) {
        for (const root of roots) {
            if (containsResource(root, requestUri)) {
                return normalizeResourcePath(requestUri);
            }
        }
        return undefined;
    }
    function containsResource(root, resource) {
        if (root.scheme !== resource.scheme) {
            return false;
        }
        let rootPath = root.fsPath + (root.fsPath.endsWith(path_1.sep) ? '' : path_1.sep);
        let resourceFsPath = resource.fsPath;
        if ((0, extpath_1.isUNC)(root.fsPath) && (0, extpath_1.isUNC)(resource.fsPath)) {
            rootPath = rootPath.toLowerCase();
            resourceFsPath = resourceFsPath.toLowerCase();
        }
        return resourceFsPath.startsWith(rootPath);
    }
    function normalizeResourcePath(resource) {
        // Rewrite remote uris to a path that the remote file system can understand
        if (resource.scheme === network_1.Schemas.vscodeRemote) {
            return uri_1.URI.from({
                scheme: network_1.Schemas.vscodeRemote,
                authority: resource.authority,
                path: '/vscode-resource',
                query: JSON.stringify({
                    requestResourcePath: resource.path
                })
            });
        }
        return resource;
    }
});
//# sourceMappingURL=resourceLoading.js.map