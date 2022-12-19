/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/platform"], function (require, exports, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.zoomLevelToZoomFactor = exports.getTitleBarStyle = exports.getMenuBarVisibility = exports.isFileToOpen = exports.isFolderToOpen = exports.isWorkspaceToOpen = exports.WindowMinimumSize = void 0;
    exports.WindowMinimumSize = {
        WIDTH: 400,
        WIDTH_WITH_VERTICAL_PANEL: 600,
        HEIGHT: 270
    };
    function isWorkspaceToOpen(uriToOpen) {
        return !!uriToOpen.workspaceUri;
    }
    exports.isWorkspaceToOpen = isWorkspaceToOpen;
    function isFolderToOpen(uriToOpen) {
        return !!uriToOpen.folderUri;
    }
    exports.isFolderToOpen = isFolderToOpen;
    function isFileToOpen(uriToOpen) {
        return !!uriToOpen.fileUri;
    }
    exports.isFileToOpen = isFileToOpen;
    function getMenuBarVisibility(configurationService) {
        const titleBarStyle = getTitleBarStyle(configurationService);
        const menuBarVisibility = configurationService.getValue('window.menuBarVisibility');
        if (menuBarVisibility === 'default' || (titleBarStyle === 'native' && menuBarVisibility === 'compact') || (platform_1.isMacintosh && platform_1.isNative)) {
            return 'classic';
        }
        else {
            return menuBarVisibility;
        }
    }
    exports.getMenuBarVisibility = getMenuBarVisibility;
    function getTitleBarStyle(configurationService) {
        if (platform_1.isWeb) {
            return 'custom';
        }
        const configuration = configurationService.getValue('window');
        if (configuration) {
            const useNativeTabs = platform_1.isMacintosh && configuration.nativeTabs === true;
            if (useNativeTabs) {
                return 'native'; // native tabs on sierra do not work with custom title style
            }
            const useSimpleFullScreen = platform_1.isMacintosh && configuration.nativeFullScreen === false;
            if (useSimpleFullScreen) {
                return 'native'; // simple fullscreen does not work well with custom title style (https://github.com/microsoft/vscode/issues/63291)
            }
            const colorCustomizations = configurationService.getValue('workbench.colorCustomizations');
            if ((colorCustomizations === null || colorCustomizations === void 0 ? void 0 : colorCustomizations['window.activeBorder']) || (colorCustomizations === null || colorCustomizations === void 0 ? void 0 : colorCustomizations['window.inactiveBorder'])) {
                return 'custom'; // window border colors do not work with native title style
            }
            const style = configuration.titleBarStyle;
            if (style === 'native' || style === 'custom') {
                return style;
            }
        }
        return platform_1.isLinux ? 'native' : 'custom'; // default to custom on all macOS and Windows
    }
    exports.getTitleBarStyle = getTitleBarStyle;
    /**
     * According to Electron docs: `scale := 1.2 ^ level`.
     * https://github.com/electron/electron/blob/master/docs/api/web-contents.md#contentssetzoomlevellevel
     */
    function zoomLevelToZoomFactor(zoomLevel = 0) {
        return Math.pow(1.2, zoomLevel);
    }
    exports.zoomLevelToZoomFactor = zoomLevelToZoomFactor;
});
//# sourceMappingURL=window.js.map