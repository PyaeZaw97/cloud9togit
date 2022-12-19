/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/files/common/files", "vs/base/common/uri", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/native/electron-sandbox/native", "vs/base/common/network", "vs/platform/actions/common/actions", "vs/platform/extensionManagement/common/extensionManagement"], function (require, exports, nls_1, files_1, uri_1, environmentService_1, native_1, network_1, actions_1, extensionManagement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenExtensionsFolderAction = void 0;
    class OpenExtensionsFolderAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.extensions.action.openExtensionsFolder',
                title: { value: (0, nls_1.localize)('openExtensionsFolder', "Open Extensions Folder"), original: 'Open Extensions Folder' },
                category: extensionManagement_1.ExtensionsLocalizedLabel,
                f1: true
            });
        }
        async run(accessor) {
            const nativeHostService = accessor.get(native_1.INativeHostService);
            const fileService = accessor.get(files_1.IFileService);
            const environmentService = accessor.get(environmentService_1.INativeWorkbenchEnvironmentService);
            const extensionsHome = uri_1.URI.file(environmentService.extensionsPath);
            const file = await fileService.resolve(extensionsHome);
            let itemToShow;
            if (file.children && file.children.length > 0) {
                itemToShow = file.children[0].resource;
            }
            else {
                itemToShow = extensionsHome;
            }
            if (itemToShow.scheme === network_1.Schemas.file) {
                return nativeHostService.showItemInFolder(itemToShow.fsPath);
            }
        }
    }
    exports.OpenExtensionsFolderAction = OpenExtensionsFolderAction;
});
//# sourceMappingURL=extensionsActions.js.map