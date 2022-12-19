/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/platform/instantiation/common/instantiation"], function (require, exports, network_1, resources_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostFileSystemInfo = exports.ExtHostFileSystemInfo = void 0;
    class ExtHostFileSystemInfo {
        constructor() {
            this._systemSchemes = new Set(Object.keys(network_1.Schemas));
            this._providerInfo = new Map();
            this.extUri = new resources_1.ExtUri(uri => {
                const capabilities = this._providerInfo.get(uri.scheme);
                if (capabilities === undefined) {
                    // default: not ignore
                    return false;
                }
                if (capabilities & 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */) {
                    // configured as case sensitive
                    return false;
                }
                return true;
            });
        }
        $acceptProviderInfos(uri, capabilities) {
            if (capabilities === null) {
                this._providerInfo.delete(uri.scheme);
            }
            else {
                this._providerInfo.set(uri.scheme, capabilities);
            }
        }
        isFreeScheme(scheme) {
            return !this._providerInfo.has(scheme) && !this._systemSchemes.has(scheme);
        }
        getCapabilities(scheme) {
            return this._providerInfo.get(scheme);
        }
    }
    exports.ExtHostFileSystemInfo = ExtHostFileSystemInfo;
    exports.IExtHostFileSystemInfo = (0, instantiation_1.createDecorator)('IExtHostFileSystemInfo');
});
//# sourceMappingURL=extHostFileSystemInfo.js.map