/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/resources", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation"], function (require, exports, arrays_1, resources_1, contextkey_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.areWebviewContentOptionsEqual = exports.WebviewContentPurpose = exports.IWebviewService = exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_ENABLED = exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED = exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE = void 0;
    /**
     * Set when the find widget in a webview in a webview is visible.
     */
    exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE = new contextkey_1.RawContextKey('webviewFindWidgetVisible', false);
    /**
     * Set when the find widget in a webview is focused.
     */
    exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED = new contextkey_1.RawContextKey('webviewFindWidgetFocused', false);
    /**
     * Set when the find widget in a webview is enabled in a webview
     */
    exports.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_ENABLED = new contextkey_1.RawContextKey('webviewFindWidgetEnabled', false);
    exports.IWebviewService = (0, instantiation_1.createDecorator)('webviewService');
    var WebviewContentPurpose;
    (function (WebviewContentPurpose) {
        WebviewContentPurpose["NotebookRenderer"] = "notebookRenderer";
        WebviewContentPurpose["CustomEditor"] = "customEditor";
        WebviewContentPurpose["WebviewView"] = "webviewView";
    })(WebviewContentPurpose = exports.WebviewContentPurpose || (exports.WebviewContentPurpose = {}));
    /**
     * Check if two {@link WebviewContentOptions} are equal.
     */
    function areWebviewContentOptionsEqual(a, b) {
        return (a.allowMultipleAPIAcquire === b.allowMultipleAPIAcquire
            && a.allowScripts === b.allowScripts
            && a.allowForms === b.allowForms
            && (0, arrays_1.equals)(a.localResourceRoots, b.localResourceRoots, resources_1.isEqual)
            && (0, arrays_1.equals)(a.portMapping, b.portMapping, (a, b) => a.extensionHostPort === b.extensionHostPort && a.webviewPort === b.webviewPort)
            && a.enableCommandUris === b.enableCommandUris);
    }
    exports.areWebviewContentOptionsEqual = areWebviewContentOptionsEqual;
});
//# sourceMappingURL=webview.js.map