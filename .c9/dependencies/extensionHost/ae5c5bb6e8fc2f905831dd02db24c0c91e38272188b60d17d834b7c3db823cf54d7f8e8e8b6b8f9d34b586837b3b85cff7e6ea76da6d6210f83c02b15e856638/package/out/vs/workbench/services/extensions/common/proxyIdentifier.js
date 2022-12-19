/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SerializableObjectWithBuffers = exports.getStringIdentifierForProxy = exports.createProxyIdentifier = exports.ProxyIdentifier = void 0;
    class ProxyIdentifier {
        constructor(sid) {
            this._proxyIdentifierBrand = undefined;
            this.sid = sid;
            this.nid = (++ProxyIdentifier.count);
        }
    }
    exports.ProxyIdentifier = ProxyIdentifier;
    ProxyIdentifier.count = 0;
    const identifiers = [];
    function createProxyIdentifier(identifier) {
        const result = new ProxyIdentifier(identifier);
        identifiers[result.nid] = result;
        return result;
    }
    exports.createProxyIdentifier = createProxyIdentifier;
    function getStringIdentifierForProxy(nid) {
        return identifiers[nid].sid;
    }
    exports.getStringIdentifierForProxy = getStringIdentifierForProxy;
    /**
     * Marks the object as containing buffers that should be serialized more efficiently.
     */
    class SerializableObjectWithBuffers {
        constructor(value) {
            this.value = value;
        }
    }
    exports.SerializableObjectWithBuffers = SerializableObjectWithBuffers;
});
//# sourceMappingURL=proxyIdentifier.js.map