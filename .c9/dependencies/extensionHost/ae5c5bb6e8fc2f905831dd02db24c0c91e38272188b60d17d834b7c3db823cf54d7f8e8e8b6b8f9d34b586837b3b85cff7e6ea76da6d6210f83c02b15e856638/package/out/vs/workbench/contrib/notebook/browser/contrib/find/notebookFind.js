/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/editor/browser/services/codeEditorService", "vs/editor/common/editorContextKeys", "vs/editor/contrib/find/browser/findController", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/notebook/browser/contrib/find/notebookFindWidget", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/notebookEditorExtensions", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookContextKeys", "vs/workbench/services/editor/common/editorService", "vs/css!./media/notebookFind"], function (require, exports, network_1, resources_1, codeEditorService_1, editorContextKeys_1, findController_1, nls_1, actions_1, contextkey_1, notebookFindWidget_1, notebookBrowser_1, notebookEditorExtensions_1, notebookCommon_1, notebookContextKeys_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, notebookEditorExtensions_1.registerNotebookContribution)(notebookFindWidget_1.NotebookFindWidget.id, notebookFindWidget_1.NotebookFindWidget);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.hideFind',
                title: { value: (0, nls_1.localize)('notebookActions.hideFind', "Hide Find in Notebook"), original: 'Hide Find in Notebook' },
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.KEYBINDING_CONTEXT_NOTEBOOK_FIND_WIDGET_FOCUSED),
                    primary: 9 /* KeyCode.Escape */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor) {
                return;
            }
            const controller = editor.getContribution(notebookFindWidget_1.NotebookFindWidget.id);
            controller.hide();
            editor.focus();
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'notebook.find',
                title: { value: (0, nls_1.localize)('notebookActions.findInNotebook', "Find in Notebook"), original: 'Find in Notebook' },
                keybinding: {
                    when: contextkey_1.ContextKeyExpr.and(notebookContextKeys_1.NOTEBOOK_EDITOR_FOCUSED, notebookContextKeys_1.NOTEBOOK_IS_ACTIVE_EDITOR, editorContextKeys_1.EditorContextKeys.focus.toNegated()),
                    primary: 36 /* KeyCode.KeyF */ | 2048 /* KeyMod.CtrlCmd */,
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
            if (!editor) {
                return;
            }
            const controller = editor.getContribution(notebookFindWidget_1.NotebookFindWidget.id);
            controller.show();
        }
    });
    function notebookContainsTextModel(uri, textModel) {
        if (textModel.uri.scheme === network_1.Schemas.vscodeNotebookCell) {
            const cellUri = notebookCommon_1.CellUri.parse(textModel.uri);
            if (cellUri && (0, resources_1.isEqual)(cellUri.notebook, uri)) {
                return true;
            }
        }
        return false;
    }
    findController_1.StartFindAction.addImplementation(100, (accessor, codeEditor, args) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
        if (!editor) {
            return false;
        }
        if (!editor.hasEditorFocus() && !editor.hasWebviewFocus()) {
            const codeEditorService = accessor.get(codeEditorService_1.ICodeEditorService);
            // check if the active pane contains the active text editor
            const textEditor = codeEditorService.getFocusedCodeEditor() || codeEditorService.getActiveCodeEditor();
            if (editor.hasModel() && textEditor && textEditor.hasModel() && notebookContainsTextModel(editor.textModel.uri, textEditor.getModel())) {
                // the active text editor is in notebook editor
            }
            else {
                return false;
            }
        }
        const controller = editor.getContribution(notebookFindWidget_1.NotebookFindWidget.id);
        controller.show();
        return true;
    });
    findController_1.StartFindReplaceAction.addImplementation(100, (accessor, codeEditor, args) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const editor = (0, notebookBrowser_1.getNotebookEditorFromEditorPane)(editorService.activeEditorPane);
        if (!editor) {
            return false;
        }
        const controller = editor.getContribution(notebookFindWidget_1.NotebookFindWidget.id);
        if (controller) {
            controller.replace();
            return true;
        }
        return false;
    });
});
//# sourceMappingURL=notebookFind.js.map