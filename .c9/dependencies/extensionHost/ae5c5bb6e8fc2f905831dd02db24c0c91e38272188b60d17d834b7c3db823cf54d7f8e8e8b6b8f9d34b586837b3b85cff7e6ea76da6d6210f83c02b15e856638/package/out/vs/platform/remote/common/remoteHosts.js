/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network"], function (require, exports, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRemoteName = exports.getRemoteAuthority = void 0;
    function getRemoteAuthority(uri) {
        return uri.scheme === network_1.Schemas.vscodeRemote ? uri.authority : undefined;
    }
    exports.getRemoteAuthority = getRemoteAuthority;
    function getRemoteName(authority) {
        if (!authority) {
            return undefined;
        }
        const pos = authority.indexOf('+');
        if (pos < 0) {
            // e.g. localhost:8000
            return authority;
        }
        return authority.substr(0, pos);
    }
    exports.getRemoteName = getRemoteName;
});
//# sourceMappingURL=remoteHosts.js.map