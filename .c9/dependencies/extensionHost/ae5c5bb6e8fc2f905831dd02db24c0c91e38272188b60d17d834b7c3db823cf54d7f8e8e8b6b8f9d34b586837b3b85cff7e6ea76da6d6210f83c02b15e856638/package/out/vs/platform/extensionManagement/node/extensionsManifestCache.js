/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/node/pfs", "vs/platform/extensions/common/extensions"], function (require, exports, lifecycle_1, path_1, pfs, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionsManifestCache = void 0;
    class ExtensionsManifestCache extends lifecycle_1.Disposable {
        constructor(environmentService, extensionsManagementService) {
            super();
            this.environmentService = environmentService;
            this.extensionsManifestCache = (0, path_1.join)(this.environmentService.userDataPath, extensions_1.MANIFEST_CACHE_FOLDER, extensions_1.USER_MANIFEST_CACHE_FILE);
            this._register(extensionsManagementService.onDidInstallExtensions(e => this.onDidInstallExtensions(e)));
            this._register(extensionsManagementService.onDidUninstallExtension(e => this.onDidUnInstallExtension(e)));
        }
        onDidInstallExtensions(results) {
            if (results.some(r => !!r.local)) {
                this.invalidate();
            }
        }
        onDidUnInstallExtension(e) {
            if (!e.error) {
                this.invalidate();
            }
        }
        invalidate() {
            pfs.Promises.rm(this.extensionsManifestCache, pfs.RimRafMode.MOVE).then(() => { }, () => { });
        }
    }
    exports.ExtensionsManifestCache = ExtensionsManifestCache;
});
//# sourceMappingURL=extensionsManifestCache.js.map