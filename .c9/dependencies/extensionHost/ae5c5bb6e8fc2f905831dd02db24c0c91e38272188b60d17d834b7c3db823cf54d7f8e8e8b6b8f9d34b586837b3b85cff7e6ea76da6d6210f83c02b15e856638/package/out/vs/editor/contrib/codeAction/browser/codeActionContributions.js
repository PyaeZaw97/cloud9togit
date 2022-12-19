/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/editor/contrib/codeAction/browser/codeActionCommands"], function (require, exports, editorExtensions_1, codeActionCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, editorExtensions_1.registerEditorContribution)(codeActionCommands_1.QuickFixController.ID, codeActionCommands_1.QuickFixController);
    (0, editorExtensions_1.registerEditorAction)(codeActionCommands_1.QuickFixAction);
    (0, editorExtensions_1.registerEditorAction)(codeActionCommands_1.RefactorAction);
    (0, editorExtensions_1.registerEditorAction)(codeActionCommands_1.SourceAction);
    (0, editorExtensions_1.registerEditorAction)(codeActionCommands_1.OrganizeImportsAction);
    (0, editorExtensions_1.registerEditorAction)(codeActionCommands_1.AutoFixAction);
    (0, editorExtensions_1.registerEditorAction)(codeActionCommands_1.FixAllAction);
    (0, editorExtensions_1.registerEditorCommand)(new codeActionCommands_1.CodeActionCommand());
});
//# sourceMappingURL=codeActionContributions.js.map