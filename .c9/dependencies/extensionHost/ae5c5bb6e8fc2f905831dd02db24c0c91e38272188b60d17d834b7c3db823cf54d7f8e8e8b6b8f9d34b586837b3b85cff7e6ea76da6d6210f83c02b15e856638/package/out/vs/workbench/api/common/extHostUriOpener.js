/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/uri", "./extHost.protocol"], function (require, exports, lifecycle_1, network_1, uri_1, extHost_protocol_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostUriOpeners = void 0;
    class ExtHostUriOpeners {
        constructor(mainContext) {
            this._openers = new Map();
            this._proxy = mainContext.getProxy(extHost_protocol_1.MainContext.MainThreadUriOpeners);
        }
        registerExternalUriOpener(extensionId, id, opener, metadata) {
            if (this._openers.has(id)) {
                throw new Error(`Opener with id '${id}' already registered`);
            }
            const invalidScheme = metadata.schemes.find(scheme => !ExtHostUriOpeners.supportedSchemes.has(scheme));
            if (invalidScheme) {
                throw new Error(`Scheme '${invalidScheme}' is not supported. Only http and https are currently supported.`);
            }
            this._openers.set(id, opener);
            this._proxy.$registerUriOpener(id, metadata.schemes, extensionId, metadata.label);
            return (0, lifecycle_1.toDisposable)(() => {
                this._openers.delete(id);
                this._proxy.$unregisterUriOpener(id);
            });
        }
        async $canOpenUri(id, uriComponents, token) {
            const opener = this._openers.get(id);
            if (!opener) {
                throw new Error(`Unknown opener with id: ${id}`);
            }
            const uri = uri_1.URI.revive(uriComponents);
            return opener.canOpenExternalUri(uri, token);
        }
        async $openUri(id, context, token) {
            const opener = this._openers.get(id);
            if (!opener) {
                throw new Error(`Unknown opener id: '${id}'`);
            }
            return opener.openExternalUri(uri_1.URI.revive(context.resolvedUri), {
                sourceUri: uri_1.URI.revive(context.sourceUri)
            }, token);
        }
    }
    exports.ExtHostUriOpeners = ExtHostUriOpeners;
    ExtHostUriOpeners.supportedSchemes = new Set([network_1.Schemas.http, network_1.Schemas.https]);
});
//# sourceMappingURL=extHostUriOpener.js.map