/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/browser", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/platform/window/common/window"], function (require, exports, browser_1, globals_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.zoomOut = exports.zoomIn = exports.applyZoom = void 0;
    /**
     * Apply a zoom level to the window. Also sets it in our in-memory
     * browser helper so that it can be accessed in non-electron layers.
     */
    function applyZoom(zoomLevel) {
        globals_1.webFrame.setZoomLevel(zoomLevel);
        (0, browser_1.setZoomFactor)((0, window_1.zoomLevelToZoomFactor)(zoomLevel));
        // Cannot be trusted because the webFrame might take some time
        // until it really applies the new zoom level
        // See https://github.com/microsoft/vscode/issues/26151
        (0, browser_1.setZoomLevel)(zoomLevel, false /* isTrusted */);
    }
    exports.applyZoom = applyZoom;
    function zoomIn() {
        applyZoom((0, browser_1.getZoomLevel)() + 1);
    }
    exports.zoomIn = zoomIn;
    function zoomOut() {
        applyZoom((0, browser_1.getZoomLevel)() - 1);
    }
    exports.zoomOut = zoomOut;
});
//# sourceMappingURL=window.js.map