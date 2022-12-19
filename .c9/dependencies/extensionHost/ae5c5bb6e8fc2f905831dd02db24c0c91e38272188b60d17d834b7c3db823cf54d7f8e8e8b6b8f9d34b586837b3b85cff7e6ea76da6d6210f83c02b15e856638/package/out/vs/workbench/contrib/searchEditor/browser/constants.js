/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/contextkey/common/contextkey"], function (require, exports, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchEditorInputTypeId = exports.ToggleSearchEditorContextLinesCommandId = exports.OpenEditorCommandId = exports.OpenNewEditorCommandId = exports.SearchEditorID = exports.SearchEditorFindMatchClass = exports.SearchEditorWorkingCopyTypeId = exports.SearchEditorScheme = exports.InSearchEditor = void 0;
    exports.InSearchEditor = new contextkey_1.RawContextKey('inSearchEditor', false);
    exports.SearchEditorScheme = 'search-editor';
    exports.SearchEditorWorkingCopyTypeId = 'search/editor';
    exports.SearchEditorFindMatchClass = 'searchEditorFindMatch';
    exports.SearchEditorID = 'workbench.editor.searchEditor';
    exports.OpenNewEditorCommandId = 'search.action.openNewEditor';
    exports.OpenEditorCommandId = 'search.action.openEditor';
    exports.ToggleSearchEditorContextLinesCommandId = 'toggleSearchEditorContextLines';
    exports.SearchEditorInputTypeId = 'workbench.editorinputs.searchEditorInput';
});
//# sourceMappingURL=constants.js.map