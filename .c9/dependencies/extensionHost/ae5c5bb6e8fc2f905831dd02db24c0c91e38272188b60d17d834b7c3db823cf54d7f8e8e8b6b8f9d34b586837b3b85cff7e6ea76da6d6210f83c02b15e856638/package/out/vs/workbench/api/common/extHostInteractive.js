/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/workbench/api/common/extHostCommands"], function (require, exports, uri_1, extHostCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostInteractive = void 0;
    class ExtHostInteractive {
        constructor(mainContext, _extHostNotebooks, _textDocumentsAndEditors, _commands) {
            this._extHostNotebooks = _extHostNotebooks;
            this._textDocumentsAndEditors = _textDocumentsAndEditors;
            this._commands = _commands;
            const openApiCommand = new extHostCommands_1.ApiCommand('interactive.open', '_interactive.open', 'Open interactive window and return notebook editor and input URI', [
                new extHostCommands_1.ApiCommandArgument('showOptions', 'Show Options', v => true, v => v),
                new extHostCommands_1.ApiCommandArgument('resource', 'Interactive resource Uri', v => true, v => v),
                new extHostCommands_1.ApiCommandArgument('controllerId', 'Notebook controller Id', v => true, v => v),
                new extHostCommands_1.ApiCommandArgument('title', 'Interactive editor title', v => true, v => v)
            ], new extHostCommands_1.ApiCommandResult('Notebook and input URI', (v) => {
                if (v.notebookEditorId !== undefined) {
                    const editor = this._extHostNotebooks.getEditorById(v.notebookEditorId);
                    return { notebookUri: uri_1.URI.revive(v.notebookUri), inputUri: uri_1.URI.revive(v.inputUri), notebookEditor: editor.apiEditor };
                }
                return { notebookUri: uri_1.URI.revive(v.notebookUri), inputUri: uri_1.URI.revive(v.inputUri) };
            }));
            this._commands.registerApiCommand(openApiCommand);
        }
        $willAddInteractiveDocument(uri, eol, languageId, notebookUri) {
            var _a;
            this._textDocumentsAndEditors.acceptDocumentsAndEditorsDelta({
                addedDocuments: [{
                        EOL: eol,
                        lines: [''],
                        languageId: languageId,
                        uri: uri,
                        isDirty: false,
                        versionId: 1,
                        notebook: (_a = this._extHostNotebooks.getNotebookDocument(uri_1.URI.revive(notebookUri))) === null || _a === void 0 ? void 0 : _a.apiNotebook
                    }]
            });
        }
        $willRemoveInteractiveDocument(uri, notebookUri) {
            this._textDocumentsAndEditors.acceptDocumentsAndEditorsDelta({
                removedDocuments: [uri]
            });
        }
    }
    exports.ExtHostInteractive = ExtHostInteractive;
});
//# sourceMappingURL=extHostInteractive.js.map