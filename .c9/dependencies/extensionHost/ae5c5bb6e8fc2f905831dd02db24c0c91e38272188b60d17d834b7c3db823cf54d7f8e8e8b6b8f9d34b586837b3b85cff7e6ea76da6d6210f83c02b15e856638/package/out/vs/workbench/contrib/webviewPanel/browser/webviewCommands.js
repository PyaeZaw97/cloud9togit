/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/editorContextKeys", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/actions", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webviewPanel/browser/webviewEditor", "vs/workbench/contrib/webviewPanel/browser/webviewEditorInput", "vs/workbench/services/editor/common/editorService"], function (require, exports, editorContextKeys_1, nls, actions_1, contextkey_1, actions_2, webview_1, webviewEditor_1, webviewEditorInput_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getActiveWebviewEditor = exports.ReloadWebviewAction = exports.WebViewEditorFindPreviousCommand = exports.WebViewEditorFindNextCommand = exports.HideWebViewEditorFindCommand = exports.ShowWebViewEditorFindWidgetAction = void 0;
    const webviewActiveContextKeyExpr = contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('activeEditor', webviewEditor_1.WebviewEditor.ID), editorContextKeys_1.EditorContextKeys.focus.toNegated() /* https://github.com/microsoft/vscode/issues/58668 */);
    class ShowWebViewEditorFindWidgetAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ShowWebViewEditorFindWidgetAction.ID,
                title: ShowWebViewEditorFindWidgetAction.LABEL,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(webviewActiveContextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_ENABLED),
                    primary: 2048 /* KeyMod.CtrlCmd */ | 36 /* KeyCode.KeyF */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor) {
            var _a;
            (_a = getActiveWebviewEditor(accessor)) === null || _a === void 0 ? void 0 : _a.showFind();
        }
    }
    exports.ShowWebViewEditorFindWidgetAction = ShowWebViewEditorFindWidgetAction;
    ShowWebViewEditorFindWidgetAction.ID = 'editor.action.webvieweditor.showFind';
    ShowWebViewEditorFindWidgetAction.LABEL = nls.localize('editor.action.webvieweditor.showFind', "Show find");
    class HideWebViewEditorFindCommand extends actions_1.Action2 {
        constructor() {
            super({
                id: HideWebViewEditorFindCommand.ID,
                title: HideWebViewEditorFindCommand.LABEL,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(webviewActiveContextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_VISIBLE),
                    primary: 9 /* KeyCode.Escape */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor) {
            var _a;
            (_a = getActiveWebviewEditor(accessor)) === null || _a === void 0 ? void 0 : _a.hideFind();
        }
    }
    exports.HideWebViewEditorFindCommand = HideWebViewEditorFindCommand;
    HideWebViewEditorFindCommand.ID = 'editor.action.webvieweditor.hideFind';
    HideWebViewEditorFindCommand.LABEL = nls.localize('editor.action.webvieweditor.hideFind', "Stop find");
    class WebViewEditorFindNextCommand extends actions_1.Action2 {
        constructor() {
            super({
                id: WebViewEditorFindNextCommand.ID,
                title: WebViewEditorFindNextCommand.LABEL,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(webviewActiveContextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
                    primary: 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor) {
            var _a;
            (_a = getActiveWebviewEditor(accessor)) === null || _a === void 0 ? void 0 : _a.runFindAction(false);
        }
    }
    exports.WebViewEditorFindNextCommand = WebViewEditorFindNextCommand;
    WebViewEditorFindNextCommand.ID = 'editor.action.webvieweditor.findNext';
    WebViewEditorFindNextCommand.LABEL = nls.localize('editor.action.webvieweditor.findNext', 'Find next');
    class WebViewEditorFindPreviousCommand extends actions_1.Action2 {
        constructor() {
            super({
                id: WebViewEditorFindPreviousCommand.ID,
                title: WebViewEditorFindPreviousCommand.LABEL,
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(webviewActiveContextKeyExpr, webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED),
                    primary: 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor) {
            var _a;
            (_a = getActiveWebviewEditor(accessor)) === null || _a === void 0 ? void 0 : _a.runFindAction(true);
        }
    }
    exports.WebViewEditorFindPreviousCommand = WebViewEditorFindPreviousCommand;
    WebViewEditorFindPreviousCommand.ID = 'editor.action.webvieweditor.findPrevious';
    WebViewEditorFindPreviousCommand.LABEL = nls.localize('editor.action.webvieweditor.findPrevious', 'Find previous');
    class ReloadWebviewAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ReloadWebviewAction.ID,
                title: { value: ReloadWebviewAction.LABEL, original: 'Reload Webviews' },
                category: actions_2.CATEGORIES.Developer,
                menu: [{
                        id: actions_1.MenuId.CommandPalette
                    }]
            });
        }
        async run(accessor) {
            const webviewService = accessor.get(webview_1.IWebviewService);
            for (const webview of webviewService.webviews) {
                webview.reload();
            }
        }
    }
    exports.ReloadWebviewAction = ReloadWebviewAction;
    ReloadWebviewAction.ID = 'workbench.action.webview.reloadWebviewAction';
    ReloadWebviewAction.LABEL = nls.localize('refreshWebviewLabel', "Reload Webviews");
    function getActiveWebviewEditor(accessor) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const activeEditor = editorService.activeEditor;
        return activeEditor instanceof webviewEditorInput_1.WebviewInput ? activeEditor.webview : undefined;
    }
    exports.getActiveWebviewEditor = getActiveWebviewEditor;
});
//# sourceMappingURL=webviewCommands.js.map