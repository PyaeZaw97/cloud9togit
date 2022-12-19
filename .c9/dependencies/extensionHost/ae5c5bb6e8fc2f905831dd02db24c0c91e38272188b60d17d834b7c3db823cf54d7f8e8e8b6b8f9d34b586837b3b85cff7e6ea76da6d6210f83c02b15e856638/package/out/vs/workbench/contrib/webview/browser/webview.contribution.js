/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/contrib/clipboard/browser/clipboard", "vs/nls", "vs/platform/actions/common/actions", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, editorExtensions_1, clipboard_1, nls, actions_1, webview_1, webviewEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const PRIORITY = 100;
    function overrideCommandForWebview(command, f) {
        command === null || command === void 0 ? void 0 : command.addImplementation(PRIORITY, 'webview', accessor => {
            var _a;
            const webviewService = accessor.get(webview_1.IWebviewService);
            const webview = webviewService.activeWebview;
            if (webview === null || webview === void 0 ? void 0 : webview.isFocused) {
                f(webview);
                return true;
            }
            // When focused in a custom menu try to fallback to the active webview
            // This is needed for context menu actions and the menubar
            if ((_a = document.activeElement) === null || _a === void 0 ? void 0 : _a.classList.contains('action-menu-item')) {
                const editorService = accessor.get(editorService_1.IEditorService);
                if (editorService.activeEditor instanceof webviewEditorInput_1.WebviewInput) {
                    f(editorService.activeEditor.webview);
                    return true;
                }
            }
            return false;
        });
    }
    overrideCommandForWebview(editorExtensions_1.UndoCommand, webview => webview.undo());
    overrideCommandForWebview(editorExtensions_1.RedoCommand, webview => webview.redo());
    overrideCommandForWebview(editorExtensions_1.SelectAllCommand, webview => webview.selectAll());
    overrideCommandForWebview(clipboard_1.CopyAction, webview => webview.copy());
    overrideCommandForWebview(clipboard_1.PasteAction, webview => webview.paste());
    overrideCommandForWebview(clipboard_1.CutAction, webview => webview.cut());
    if (clipboard_1.CutAction) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.WebviewContext, {
            command: {
                id: clipboard_1.CutAction.id,
                title: nls.localize('cut', "Cut"),
            },
            order: 1,
        });
    }
    if (clipboard_1.CopyAction) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.WebviewContext, {
            command: {
                id: clipboard_1.CopyAction.id,
                title: nls.localize('copy', "Copy"),
            },
            order: 2,
        });
    }
    if (clipboard_1.PasteAction) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.WebviewContext, {
            command: {
                id: clipboard_1.PasteAction.id,
                title: nls.localize('paste', "Paste"),
            },
            order: 3,
        });
    }
});
//# sourceMappingURL=webview.contribution.js.map