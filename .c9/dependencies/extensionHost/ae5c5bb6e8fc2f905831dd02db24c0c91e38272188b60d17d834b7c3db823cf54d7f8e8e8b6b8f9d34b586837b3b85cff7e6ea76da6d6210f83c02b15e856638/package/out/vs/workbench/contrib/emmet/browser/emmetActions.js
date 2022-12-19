/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/workbench/services/textMate/common/TMGrammars", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands"], function (require, exports, editorExtensions_1, TMGrammars_1, extensions_1, commands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmmetEditorAction = void 0;
    class GrammarContributions {
        constructor(contributions) {
            if (!Object.keys(GrammarContributions._grammars).length) {
                this.fillModeScopeMap(contributions);
            }
        }
        fillModeScopeMap(contributions) {
            contributions.forEach((contribution) => {
                contribution.value.forEach((grammar) => {
                    if (grammar.language && grammar.scopeName) {
                        GrammarContributions._grammars[grammar.language] = grammar.scopeName;
                    }
                });
            });
        }
        getGrammar(mode) {
            return GrammarContributions._grammars[mode];
        }
    }
    GrammarContributions._grammars = {};
    class EmmetEditorAction extends editorExtensions_1.EditorAction {
        constructor(opts) {
            super(opts);
            this._lastGrammarContributions = null;
            this._lastExtensionService = null;
            this.emmetActionName = opts.actionName;
        }
        _withGrammarContributions(extensionService) {
            if (this._lastExtensionService !== extensionService) {
                this._lastExtensionService = extensionService;
                this._lastGrammarContributions = extensionService.readExtensionPointContributions(TMGrammars_1.grammarsExtPoint).then((contributions) => {
                    return new GrammarContributions(contributions);
                });
            }
            return this._lastGrammarContributions || Promise.resolve(null);
        }
        run(accessor, editor) {
            const extensionService = accessor.get(extensions_1.IExtensionService);
            const commandService = accessor.get(commands_1.ICommandService);
            return this._withGrammarContributions(extensionService).then((grammarContributions) => {
                if (this.id === 'editor.emmet.action.expandAbbreviation' && grammarContributions) {
                    return commandService.executeCommand('emmet.expandAbbreviation', EmmetEditorAction.getLanguage(editor, grammarContributions));
                }
                return undefined;
            });
        }
        static getLanguage(editor, grammars) {
            const model = editor.getModel();
            const selection = editor.getSelection();
            if (!model || !selection) {
                return null;
            }
            const position = selection.getStartPosition();
            model.tokenization.tokenizeIfCheap(position.lineNumber);
            const languageId = model.getLanguageIdAtPosition(position.lineNumber, position.column);
            const syntax = languageId.split('.').pop();
            if (!syntax) {
                return null;
            }
            let checkParentMode = () => {
                let languageGrammar = grammars.getGrammar(syntax);
                if (!languageGrammar) {
                    return syntax;
                }
                let languages = languageGrammar.split('.');
                if (languages.length < 2) {
                    return syntax;
                }
                for (let i = 1; i < languages.length; i++) {
                    const language = languages[languages.length - i];
                    if (this.emmetSupportedModes.indexOf(language) !== -1) {
                        return language;
                    }
                }
                return syntax;
            };
            return {
                language: syntax,
                parentMode: checkParentMode()
            };
        }
    }
    exports.EmmetEditorAction = EmmetEditorAction;
    EmmetEditorAction.emmetSupportedModes = ['html', 'css', 'xml', 'xsl', 'haml', 'jade', 'jsx', 'slim', 'scss', 'sass', 'less', 'stylus', 'styl', 'svg'];
});
//# sourceMappingURL=emmetActions.js.map