/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/uri", "vs/editor/common/core/range", "vs/editor/common/tokenizationRegistry", "vs/base/common/codicons"], function (require, exports, uri_1, range_1, tokenizationRegistry_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExternalUriOpenerPriority = exports.TokenizationRegistry = exports.InlayHintKind = exports.CommentMode = exports.CommentThreadState = exports.CommentThreadCollapsibleState = exports.Command = exports.FoldingRangeKind = exports.SymbolKinds = exports.SymbolTag = exports.SymbolKind = exports.isLocationLink = exports.DocumentHighlightKind = exports.SignatureHelpTriggerKind = exports.CodeActionTriggerType = exports.InlineCompletionTriggerKind = exports.CompletionTriggerKind = exports.CompletionItemInsertTextRule = exports.CompletionItemTag = exports.CompletionItemKinds = exports.CompletionItemKind = exports.EncodedTokenizationResult = exports.TokenizationResult = exports.Token = exports.TokenMetadata = exports.MetadataConsts = exports.StandardTokenType = exports.ColorId = exports.FontStyle = exports.LanguageId = void 0;
    /**
     * Open ended enum at runtime
     * @internal
     */
    var LanguageId;
    (function (LanguageId) {
        LanguageId[LanguageId["Null"] = 0] = "Null";
        LanguageId[LanguageId["PlainText"] = 1] = "PlainText";
    })(LanguageId = exports.LanguageId || (exports.LanguageId = {}));
    /**
     * A font style. Values are 2^x such that a bit mask can be used.
     * @internal
     */
    var FontStyle;
    (function (FontStyle) {
        FontStyle[FontStyle["NotSet"] = -1] = "NotSet";
        FontStyle[FontStyle["None"] = 0] = "None";
        FontStyle[FontStyle["Italic"] = 1] = "Italic";
        FontStyle[FontStyle["Bold"] = 2] = "Bold";
        FontStyle[FontStyle["Underline"] = 4] = "Underline";
        FontStyle[FontStyle["Strikethrough"] = 8] = "Strikethrough";
    })(FontStyle = exports.FontStyle || (exports.FontStyle = {}));
    /**
     * Open ended enum at runtime
     * @internal
     */
    var ColorId;
    (function (ColorId) {
        ColorId[ColorId["None"] = 0] = "None";
        ColorId[ColorId["DefaultForeground"] = 1] = "DefaultForeground";
        ColorId[ColorId["DefaultBackground"] = 2] = "DefaultBackground";
    })(ColorId = exports.ColorId || (exports.ColorId = {}));
    /**
     * A standard token type.
     * @internal
     */
    var StandardTokenType;
    (function (StandardTokenType) {
        StandardTokenType[StandardTokenType["Other"] = 0] = "Other";
        StandardTokenType[StandardTokenType["Comment"] = 1] = "Comment";
        StandardTokenType[StandardTokenType["String"] = 2] = "String";
        StandardTokenType[StandardTokenType["RegEx"] = 3] = "RegEx";
    })(StandardTokenType = exports.StandardTokenType || (exports.StandardTokenType = {}));
    /**
     * Helpers to manage the "collapsed" metadata of an entire StackElement stack.
     * The following assumptions have been made:
     *  - languageId < 256 => needs 8 bits
     *  - unique color count < 512 => needs 9 bits
     *
     * The binary format is:
     * - -------------------------------------------
     *     3322 2222 2222 1111 1111 1100 0000 0000
     *     1098 7654 3210 9876 5432 1098 7654 3210
     * - -------------------------------------------
     *     xxxx xxxx xxxx xxxx xxxx xxxx xxxx xxxx
     *     bbbb bbbb ffff ffff fFFF FBTT LLLL LLLL
     * - -------------------------------------------
     *  - L = LanguageId (8 bits)
     *  - T = StandardTokenType (2 bits)
     *  - B = Balanced bracket (1 bit)
     *  - F = FontStyle (4 bits)
     *  - f = foreground color (9 bits)
     *  - b = background color (9 bits)
     *
     * @internal
     */
    var MetadataConsts;
    (function (MetadataConsts) {
        MetadataConsts[MetadataConsts["LANGUAGEID_MASK"] = 255] = "LANGUAGEID_MASK";
        MetadataConsts[MetadataConsts["TOKEN_TYPE_MASK"] = 768] = "TOKEN_TYPE_MASK";
        MetadataConsts[MetadataConsts["BALANCED_BRACKETS_MASK"] = 1024] = "BALANCED_BRACKETS_MASK";
        MetadataConsts[MetadataConsts["FONT_STYLE_MASK"] = 30720] = "FONT_STYLE_MASK";
        MetadataConsts[MetadataConsts["FOREGROUND_MASK"] = 16744448] = "FOREGROUND_MASK";
        MetadataConsts[MetadataConsts["BACKGROUND_MASK"] = 4278190080] = "BACKGROUND_MASK";
        MetadataConsts[MetadataConsts["ITALIC_MASK"] = 2048] = "ITALIC_MASK";
        MetadataConsts[MetadataConsts["BOLD_MASK"] = 4096] = "BOLD_MASK";
        MetadataConsts[MetadataConsts["UNDERLINE_MASK"] = 8192] = "UNDERLINE_MASK";
        MetadataConsts[MetadataConsts["STRIKETHROUGH_MASK"] = 16384] = "STRIKETHROUGH_MASK";
        // Semantic tokens cannot set the language id, so we can
        // use the first 8 bits for control purposes
        MetadataConsts[MetadataConsts["SEMANTIC_USE_ITALIC"] = 1] = "SEMANTIC_USE_ITALIC";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_BOLD"] = 2] = "SEMANTIC_USE_BOLD";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_UNDERLINE"] = 4] = "SEMANTIC_USE_UNDERLINE";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_STRIKETHROUGH"] = 8] = "SEMANTIC_USE_STRIKETHROUGH";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_FOREGROUND"] = 16] = "SEMANTIC_USE_FOREGROUND";
        MetadataConsts[MetadataConsts["SEMANTIC_USE_BACKGROUND"] = 32] = "SEMANTIC_USE_BACKGROUND";
        MetadataConsts[MetadataConsts["LANGUAGEID_OFFSET"] = 0] = "LANGUAGEID_OFFSET";
        MetadataConsts[MetadataConsts["TOKEN_TYPE_OFFSET"] = 8] = "TOKEN_TYPE_OFFSET";
        MetadataConsts[MetadataConsts["BALANCED_BRACKETS_OFFSET"] = 10] = "BALANCED_BRACKETS_OFFSET";
        MetadataConsts[MetadataConsts["FONT_STYLE_OFFSET"] = 11] = "FONT_STYLE_OFFSET";
        MetadataConsts[MetadataConsts["FOREGROUND_OFFSET"] = 15] = "FOREGROUND_OFFSET";
        MetadataConsts[MetadataConsts["BACKGROUND_OFFSET"] = 24] = "BACKGROUND_OFFSET";
    })(MetadataConsts = exports.MetadataConsts || (exports.MetadataConsts = {}));
    /**
     * @internal
     */
    class TokenMetadata {
        static getLanguageId(metadata) {
            return (metadata & 255 /* MetadataConsts.LANGUAGEID_MASK */) >>> 0 /* MetadataConsts.LANGUAGEID_OFFSET */;
        }
        static getTokenType(metadata) {
            return (metadata & 768 /* MetadataConsts.TOKEN_TYPE_MASK */) >>> 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */;
        }
        static containsBalancedBrackets(metadata) {
            return (metadata & 1024 /* MetadataConsts.BALANCED_BRACKETS_MASK */) !== 0;
        }
        static getFontStyle(metadata) {
            return (metadata & 30720 /* MetadataConsts.FONT_STYLE_MASK */) >>> 11 /* MetadataConsts.FONT_STYLE_OFFSET */;
        }
        static getForeground(metadata) {
            return (metadata & 16744448 /* MetadataConsts.FOREGROUND_MASK */) >>> 15 /* MetadataConsts.FOREGROUND_OFFSET */;
        }
        static getBackground(metadata) {
            return (metadata & 4278190080 /* MetadataConsts.BACKGROUND_MASK */) >>> 24 /* MetadataConsts.BACKGROUND_OFFSET */;
        }
        static getClassNameFromMetadata(metadata) {
            const foreground = this.getForeground(metadata);
            let className = 'mtk' + foreground;
            const fontStyle = this.getFontStyle(metadata);
            if (fontStyle & 1 /* FontStyle.Italic */) {
                className += ' mtki';
            }
            if (fontStyle & 2 /* FontStyle.Bold */) {
                className += ' mtkb';
            }
            if (fontStyle & 4 /* FontStyle.Underline */) {
                className += ' mtku';
            }
            if (fontStyle & 8 /* FontStyle.Strikethrough */) {
                className += ' mtks';
            }
            return className;
        }
        static getInlineStyleFromMetadata(metadata, colorMap) {
            const foreground = this.getForeground(metadata);
            const fontStyle = this.getFontStyle(metadata);
            let result = `color: ${colorMap[foreground]};`;
            if (fontStyle & 1 /* FontStyle.Italic */) {
                result += 'font-style: italic;';
            }
            if (fontStyle & 2 /* FontStyle.Bold */) {
                result += 'font-weight: bold;';
            }
            let textDecoration = '';
            if (fontStyle & 4 /* FontStyle.Underline */) {
                textDecoration += ' underline';
            }
            if (fontStyle & 8 /* FontStyle.Strikethrough */) {
                textDecoration += ' line-through';
            }
            if (textDecoration) {
                result += `text-decoration:${textDecoration};`;
            }
            return result;
        }
        static getPresentationFromMetadata(metadata) {
            const foreground = this.getForeground(metadata);
            const fontStyle = this.getFontStyle(metadata);
            return {
                foreground: foreground,
                italic: Boolean(fontStyle & 1 /* FontStyle.Italic */),
                bold: Boolean(fontStyle & 2 /* FontStyle.Bold */),
                underline: Boolean(fontStyle & 4 /* FontStyle.Underline */),
                strikethrough: Boolean(fontStyle & 8 /* FontStyle.Strikethrough */),
            };
        }
    }
    exports.TokenMetadata = TokenMetadata;
    class Token {
        constructor(offset, type, language) {
            this._tokenBrand = undefined;
            this.offset = offset;
            this.type = type;
            this.language = language;
        }
        toString() {
            return '(' + this.offset + ', ' + this.type + ')';
        }
    }
    exports.Token = Token;
    /**
     * @internal
     */
    class TokenizationResult {
        constructor(tokens, endState) {
            this._tokenizationResultBrand = undefined;
            this.tokens = tokens;
            this.endState = endState;
        }
    }
    exports.TokenizationResult = TokenizationResult;
    /**
     * @internal
     */
    class EncodedTokenizationResult {
        constructor(tokens, endState) {
            this._encodedTokenizationResultBrand = undefined;
            this.tokens = tokens;
            this.endState = endState;
        }
    }
    exports.EncodedTokenizationResult = EncodedTokenizationResult;
    var CompletionItemKind;
    (function (CompletionItemKind) {
        CompletionItemKind[CompletionItemKind["Method"] = 0] = "Method";
        CompletionItemKind[CompletionItemKind["Function"] = 1] = "Function";
        CompletionItemKind[CompletionItemKind["Constructor"] = 2] = "Constructor";
        CompletionItemKind[CompletionItemKind["Field"] = 3] = "Field";
        CompletionItemKind[CompletionItemKind["Variable"] = 4] = "Variable";
        CompletionItemKind[CompletionItemKind["Class"] = 5] = "Class";
        CompletionItemKind[CompletionItemKind["Struct"] = 6] = "Struct";
        CompletionItemKind[CompletionItemKind["Interface"] = 7] = "Interface";
        CompletionItemKind[CompletionItemKind["Module"] = 8] = "Module";
        CompletionItemKind[CompletionItemKind["Property"] = 9] = "Property";
        CompletionItemKind[CompletionItemKind["Event"] = 10] = "Event";
        CompletionItemKind[CompletionItemKind["Operator"] = 11] = "Operator";
        CompletionItemKind[CompletionItemKind["Unit"] = 12] = "Unit";
        CompletionItemKind[CompletionItemKind["Value"] = 13] = "Value";
        CompletionItemKind[CompletionItemKind["Constant"] = 14] = "Constant";
        CompletionItemKind[CompletionItemKind["Enum"] = 15] = "Enum";
        CompletionItemKind[CompletionItemKind["EnumMember"] = 16] = "EnumMember";
        CompletionItemKind[CompletionItemKind["Keyword"] = 17] = "Keyword";
        CompletionItemKind[CompletionItemKind["Text"] = 18] = "Text";
        CompletionItemKind[CompletionItemKind["Color"] = 19] = "Color";
        CompletionItemKind[CompletionItemKind["File"] = 20] = "File";
        CompletionItemKind[CompletionItemKind["Reference"] = 21] = "Reference";
        CompletionItemKind[CompletionItemKind["Customcolor"] = 22] = "Customcolor";
        CompletionItemKind[CompletionItemKind["Folder"] = 23] = "Folder";
        CompletionItemKind[CompletionItemKind["TypeParameter"] = 24] = "TypeParameter";
        CompletionItemKind[CompletionItemKind["User"] = 25] = "User";
        CompletionItemKind[CompletionItemKind["Issue"] = 26] = "Issue";
        CompletionItemKind[CompletionItemKind["Snippet"] = 27] = "Snippet";
    })(CompletionItemKind = exports.CompletionItemKind || (exports.CompletionItemKind = {}));
    /**
     * @internal
     */
    var CompletionItemKinds;
    (function (CompletionItemKinds) {
        const byKind = new Map();
        byKind.set(0 /* CompletionItemKind.Method */, codicons_1.Codicon.symbolMethod);
        byKind.set(1 /* CompletionItemKind.Function */, codicons_1.Codicon.symbolFunction);
        byKind.set(2 /* CompletionItemKind.Constructor */, codicons_1.Codicon.symbolConstructor);
        byKind.set(3 /* CompletionItemKind.Field */, codicons_1.Codicon.symbolField);
        byKind.set(4 /* CompletionItemKind.Variable */, codicons_1.Codicon.symbolVariable);
        byKind.set(5 /* CompletionItemKind.Class */, codicons_1.Codicon.symbolClass);
        byKind.set(6 /* CompletionItemKind.Struct */, codicons_1.Codicon.symbolStruct);
        byKind.set(7 /* CompletionItemKind.Interface */, codicons_1.Codicon.symbolInterface);
        byKind.set(8 /* CompletionItemKind.Module */, codicons_1.Codicon.symbolModule);
        byKind.set(9 /* CompletionItemKind.Property */, codicons_1.Codicon.symbolProperty);
        byKind.set(10 /* CompletionItemKind.Event */, codicons_1.Codicon.symbolEvent);
        byKind.set(11 /* CompletionItemKind.Operator */, codicons_1.Codicon.symbolOperator);
        byKind.set(12 /* CompletionItemKind.Unit */, codicons_1.Codicon.symbolUnit);
        byKind.set(13 /* CompletionItemKind.Value */, codicons_1.Codicon.symbolValue);
        byKind.set(15 /* CompletionItemKind.Enum */, codicons_1.Codicon.symbolEnum);
        byKind.set(14 /* CompletionItemKind.Constant */, codicons_1.Codicon.symbolConstant);
        byKind.set(15 /* CompletionItemKind.Enum */, codicons_1.Codicon.symbolEnum);
        byKind.set(16 /* CompletionItemKind.EnumMember */, codicons_1.Codicon.symbolEnumMember);
        byKind.set(17 /* CompletionItemKind.Keyword */, codicons_1.Codicon.symbolKeyword);
        byKind.set(27 /* CompletionItemKind.Snippet */, codicons_1.Codicon.symbolSnippet);
        byKind.set(18 /* CompletionItemKind.Text */, codicons_1.Codicon.symbolText);
        byKind.set(19 /* CompletionItemKind.Color */, codicons_1.Codicon.symbolColor);
        byKind.set(20 /* CompletionItemKind.File */, codicons_1.Codicon.symbolFile);
        byKind.set(21 /* CompletionItemKind.Reference */, codicons_1.Codicon.symbolReference);
        byKind.set(22 /* CompletionItemKind.Customcolor */, codicons_1.Codicon.symbolCustomColor);
        byKind.set(23 /* CompletionItemKind.Folder */, codicons_1.Codicon.symbolFolder);
        byKind.set(24 /* CompletionItemKind.TypeParameter */, codicons_1.Codicon.symbolTypeParameter);
        byKind.set(25 /* CompletionItemKind.User */, codicons_1.Codicon.account);
        byKind.set(26 /* CompletionItemKind.Issue */, codicons_1.Codicon.issues);
        /**
         * @internal
         */
        function toIcon(kind) {
            let codicon = byKind.get(kind);
            if (!codicon) {
                console.info('No codicon found for CompletionItemKind ' + kind);
                codicon = codicons_1.Codicon.symbolProperty;
            }
            return codicon;
        }
        CompletionItemKinds.toIcon = toIcon;
        const data = new Map();
        data.set('method', 0 /* CompletionItemKind.Method */);
        data.set('function', 1 /* CompletionItemKind.Function */);
        data.set('constructor', 2 /* CompletionItemKind.Constructor */);
        data.set('field', 3 /* CompletionItemKind.Field */);
        data.set('variable', 4 /* CompletionItemKind.Variable */);
        data.set('class', 5 /* CompletionItemKind.Class */);
        data.set('struct', 6 /* CompletionItemKind.Struct */);
        data.set('interface', 7 /* CompletionItemKind.Interface */);
        data.set('module', 8 /* CompletionItemKind.Module */);
        data.set('property', 9 /* CompletionItemKind.Property */);
        data.set('event', 10 /* CompletionItemKind.Event */);
        data.set('operator', 11 /* CompletionItemKind.Operator */);
        data.set('unit', 12 /* CompletionItemKind.Unit */);
        data.set('value', 13 /* CompletionItemKind.Value */);
        data.set('constant', 14 /* CompletionItemKind.Constant */);
        data.set('enum', 15 /* CompletionItemKind.Enum */);
        data.set('enum-member', 16 /* CompletionItemKind.EnumMember */);
        data.set('enumMember', 16 /* CompletionItemKind.EnumMember */);
        data.set('keyword', 17 /* CompletionItemKind.Keyword */);
        data.set('snippet', 27 /* CompletionItemKind.Snippet */);
        data.set('text', 18 /* CompletionItemKind.Text */);
        data.set('color', 19 /* CompletionItemKind.Color */);
        data.set('file', 20 /* CompletionItemKind.File */);
        data.set('reference', 21 /* CompletionItemKind.Reference */);
        data.set('customcolor', 22 /* CompletionItemKind.Customcolor */);
        data.set('folder', 23 /* CompletionItemKind.Folder */);
        data.set('type-parameter', 24 /* CompletionItemKind.TypeParameter */);
        data.set('typeParameter', 24 /* CompletionItemKind.TypeParameter */);
        data.set('account', 25 /* CompletionItemKind.User */);
        data.set('issue', 26 /* CompletionItemKind.Issue */);
        /**
         * @internal
         */
        function fromString(value, strict) {
            let res = data.get(value);
            if (typeof res === 'undefined' && !strict) {
                res = 9 /* CompletionItemKind.Property */;
            }
            return res;
        }
        CompletionItemKinds.fromString = fromString;
    })(CompletionItemKinds = exports.CompletionItemKinds || (exports.CompletionItemKinds = {}));
    var CompletionItemTag;
    (function (CompletionItemTag) {
        CompletionItemTag[CompletionItemTag["Deprecated"] = 1] = "Deprecated";
    })(CompletionItemTag = exports.CompletionItemTag || (exports.CompletionItemTag = {}));
    var CompletionItemInsertTextRule;
    (function (CompletionItemInsertTextRule) {
        /**
         * Adjust whitespace/indentation of multiline insert texts to
         * match the current line indentation.
         */
        CompletionItemInsertTextRule[CompletionItemInsertTextRule["KeepWhitespace"] = 1] = "KeepWhitespace";
        /**
         * `insertText` is a snippet.
         */
        CompletionItemInsertTextRule[CompletionItemInsertTextRule["InsertAsSnippet"] = 4] = "InsertAsSnippet";
    })(CompletionItemInsertTextRule = exports.CompletionItemInsertTextRule || (exports.CompletionItemInsertTextRule = {}));
    /**
     * How a suggest provider was triggered.
     */
    var CompletionTriggerKind;
    (function (CompletionTriggerKind) {
        CompletionTriggerKind[CompletionTriggerKind["Invoke"] = 0] = "Invoke";
        CompletionTriggerKind[CompletionTriggerKind["TriggerCharacter"] = 1] = "TriggerCharacter";
        CompletionTriggerKind[CompletionTriggerKind["TriggerForIncompleteCompletions"] = 2] = "TriggerForIncompleteCompletions";
    })(CompletionTriggerKind = exports.CompletionTriggerKind || (exports.CompletionTriggerKind = {}));
    /**
     * How an {@link InlineCompletionsProvider inline completion provider} was triggered.
     */
    var InlineCompletionTriggerKind;
    (function (InlineCompletionTriggerKind) {
        /**
         * Completion was triggered automatically while editing.
         * It is sufficient to return a single completion item in this case.
         */
        InlineCompletionTriggerKind[InlineCompletionTriggerKind["Automatic"] = 0] = "Automatic";
        /**
         * Completion was triggered explicitly by a user gesture.
         * Return multiple completion items to enable cycling through them.
         */
        InlineCompletionTriggerKind[InlineCompletionTriggerKind["Explicit"] = 1] = "Explicit";
    })(InlineCompletionTriggerKind = exports.InlineCompletionTriggerKind || (exports.InlineCompletionTriggerKind = {}));
    /**
     * @internal
     */
    var CodeActionTriggerType;
    (function (CodeActionTriggerType) {
        CodeActionTriggerType[CodeActionTriggerType["Invoke"] = 1] = "Invoke";
        CodeActionTriggerType[CodeActionTriggerType["Auto"] = 2] = "Auto";
    })(CodeActionTriggerType = exports.CodeActionTriggerType || (exports.CodeActionTriggerType = {}));
    var SignatureHelpTriggerKind;
    (function (SignatureHelpTriggerKind) {
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["Invoke"] = 1] = "Invoke";
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["TriggerCharacter"] = 2] = "TriggerCharacter";
        SignatureHelpTriggerKind[SignatureHelpTriggerKind["ContentChange"] = 3] = "ContentChange";
    })(SignatureHelpTriggerKind = exports.SignatureHelpTriggerKind || (exports.SignatureHelpTriggerKind = {}));
    /**
     * A document highlight kind.
     */
    var DocumentHighlightKind;
    (function (DocumentHighlightKind) {
        /**
         * A textual occurrence.
         */
        DocumentHighlightKind[DocumentHighlightKind["Text"] = 0] = "Text";
        /**
         * Read-access of a symbol, like reading a variable.
         */
        DocumentHighlightKind[DocumentHighlightKind["Read"] = 1] = "Read";
        /**
         * Write-access of a symbol, like writing to a variable.
         */
        DocumentHighlightKind[DocumentHighlightKind["Write"] = 2] = "Write";
    })(DocumentHighlightKind = exports.DocumentHighlightKind || (exports.DocumentHighlightKind = {}));
    /**
     * @internal
     */
    function isLocationLink(thing) {
        return thing
            && uri_1.URI.isUri(thing.uri)
            && range_1.Range.isIRange(thing.range)
            && (range_1.Range.isIRange(thing.originSelectionRange) || range_1.Range.isIRange(thing.targetSelectionRange));
    }
    exports.isLocationLink = isLocationLink;
    /**
     * A symbol kind.
     */
    var SymbolKind;
    (function (SymbolKind) {
        SymbolKind[SymbolKind["File"] = 0] = "File";
        SymbolKind[SymbolKind["Module"] = 1] = "Module";
        SymbolKind[SymbolKind["Namespace"] = 2] = "Namespace";
        SymbolKind[SymbolKind["Package"] = 3] = "Package";
        SymbolKind[SymbolKind["Class"] = 4] = "Class";
        SymbolKind[SymbolKind["Method"] = 5] = "Method";
        SymbolKind[SymbolKind["Property"] = 6] = "Property";
        SymbolKind[SymbolKind["Field"] = 7] = "Field";
        SymbolKind[SymbolKind["Constructor"] = 8] = "Constructor";
        SymbolKind[SymbolKind["Enum"] = 9] = "Enum";
        SymbolKind[SymbolKind["Interface"] = 10] = "Interface";
        SymbolKind[SymbolKind["Function"] = 11] = "Function";
        SymbolKind[SymbolKind["Variable"] = 12] = "Variable";
        SymbolKind[SymbolKind["Constant"] = 13] = "Constant";
        SymbolKind[SymbolKind["String"] = 14] = "String";
        SymbolKind[SymbolKind["Number"] = 15] = "Number";
        SymbolKind[SymbolKind["Boolean"] = 16] = "Boolean";
        SymbolKind[SymbolKind["Array"] = 17] = "Array";
        SymbolKind[SymbolKind["Object"] = 18] = "Object";
        SymbolKind[SymbolKind["Key"] = 19] = "Key";
        SymbolKind[SymbolKind["Null"] = 20] = "Null";
        SymbolKind[SymbolKind["EnumMember"] = 21] = "EnumMember";
        SymbolKind[SymbolKind["Struct"] = 22] = "Struct";
        SymbolKind[SymbolKind["Event"] = 23] = "Event";
        SymbolKind[SymbolKind["Operator"] = 24] = "Operator";
        SymbolKind[SymbolKind["TypeParameter"] = 25] = "TypeParameter";
    })(SymbolKind = exports.SymbolKind || (exports.SymbolKind = {}));
    var SymbolTag;
    (function (SymbolTag) {
        SymbolTag[SymbolTag["Deprecated"] = 1] = "Deprecated";
    })(SymbolTag = exports.SymbolTag || (exports.SymbolTag = {}));
    /**
     * @internal
     */
    var SymbolKinds;
    (function (SymbolKinds) {
        const byKind = new Map();
        byKind.set(0 /* SymbolKind.File */, codicons_1.Codicon.symbolFile);
        byKind.set(1 /* SymbolKind.Module */, codicons_1.Codicon.symbolModule);
        byKind.set(2 /* SymbolKind.Namespace */, codicons_1.Codicon.symbolNamespace);
        byKind.set(3 /* SymbolKind.Package */, codicons_1.Codicon.symbolPackage);
        byKind.set(4 /* SymbolKind.Class */, codicons_1.Codicon.symbolClass);
        byKind.set(5 /* SymbolKind.Method */, codicons_1.Codicon.symbolMethod);
        byKind.set(6 /* SymbolKind.Property */, codicons_1.Codicon.symbolProperty);
        byKind.set(7 /* SymbolKind.Field */, codicons_1.Codicon.symbolField);
        byKind.set(8 /* SymbolKind.Constructor */, codicons_1.Codicon.symbolConstructor);
        byKind.set(9 /* SymbolKind.Enum */, codicons_1.Codicon.symbolEnum);
        byKind.set(10 /* SymbolKind.Interface */, codicons_1.Codicon.symbolInterface);
        byKind.set(11 /* SymbolKind.Function */, codicons_1.Codicon.symbolFunction);
        byKind.set(12 /* SymbolKind.Variable */, codicons_1.Codicon.symbolVariable);
        byKind.set(13 /* SymbolKind.Constant */, codicons_1.Codicon.symbolConstant);
        byKind.set(14 /* SymbolKind.String */, codicons_1.Codicon.symbolString);
        byKind.set(15 /* SymbolKind.Number */, codicons_1.Codicon.symbolNumber);
        byKind.set(16 /* SymbolKind.Boolean */, codicons_1.Codicon.symbolBoolean);
        byKind.set(17 /* SymbolKind.Array */, codicons_1.Codicon.symbolArray);
        byKind.set(18 /* SymbolKind.Object */, codicons_1.Codicon.symbolObject);
        byKind.set(19 /* SymbolKind.Key */, codicons_1.Codicon.symbolKey);
        byKind.set(20 /* SymbolKind.Null */, codicons_1.Codicon.symbolNull);
        byKind.set(21 /* SymbolKind.EnumMember */, codicons_1.Codicon.symbolEnumMember);
        byKind.set(22 /* SymbolKind.Struct */, codicons_1.Codicon.symbolStruct);
        byKind.set(23 /* SymbolKind.Event */, codicons_1.Codicon.symbolEvent);
        byKind.set(24 /* SymbolKind.Operator */, codicons_1.Codicon.symbolOperator);
        byKind.set(25 /* SymbolKind.TypeParameter */, codicons_1.Codicon.symbolTypeParameter);
        /**
         * @internal
         */
        function toIcon(kind) {
            let icon = byKind.get(kind);
            if (!icon) {
                console.info('No codicon found for SymbolKind ' + kind);
                icon = codicons_1.Codicon.symbolProperty;
            }
            return icon;
        }
        SymbolKinds.toIcon = toIcon;
    })(SymbolKinds = exports.SymbolKinds || (exports.SymbolKinds = {}));
    class FoldingRangeKind {
        /**
         * Creates a new {@link FoldingRangeKind}.
         *
         * @param value of the kind.
         */
        constructor(value) {
            this.value = value;
        }
    }
    exports.FoldingRangeKind = FoldingRangeKind;
    /**
     * Kind for folding range representing a comment. The value of the kind is 'comment'.
     */
    FoldingRangeKind.Comment = new FoldingRangeKind('comment');
    /**
     * Kind for folding range representing a import. The value of the kind is 'imports'.
     */
    FoldingRangeKind.Imports = new FoldingRangeKind('imports');
    /**
     * Kind for folding range representing regions (for example marked by `#region`, `#endregion`).
     * The value of the kind is 'region'.
     */
    FoldingRangeKind.Region = new FoldingRangeKind('region');
    /**
     * @internal
     */
    var Command;
    (function (Command) {
        /**
         * @internal
         */
        function is(obj) {
            if (!obj || typeof obj !== 'object') {
                return false;
            }
            return typeof obj.id === 'string' &&
                typeof obj.title === 'string';
        }
        Command.is = is;
    })(Command = exports.Command || (exports.Command = {}));
    /**
     * @internal
     */
    var CommentThreadCollapsibleState;
    (function (CommentThreadCollapsibleState) {
        /**
         * Determines an item is collapsed
         */
        CommentThreadCollapsibleState[CommentThreadCollapsibleState["Collapsed"] = 0] = "Collapsed";
        /**
         * Determines an item is expanded
         */
        CommentThreadCollapsibleState[CommentThreadCollapsibleState["Expanded"] = 1] = "Expanded";
    })(CommentThreadCollapsibleState = exports.CommentThreadCollapsibleState || (exports.CommentThreadCollapsibleState = {}));
    /**
     * @internal
     */
    var CommentThreadState;
    (function (CommentThreadState) {
        CommentThreadState[CommentThreadState["Unresolved"] = 0] = "Unresolved";
        CommentThreadState[CommentThreadState["Resolved"] = 1] = "Resolved";
    })(CommentThreadState = exports.CommentThreadState || (exports.CommentThreadState = {}));
    /**
     * @internal
     */
    var CommentMode;
    (function (CommentMode) {
        CommentMode[CommentMode["Editing"] = 0] = "Editing";
        CommentMode[CommentMode["Preview"] = 1] = "Preview";
    })(CommentMode = exports.CommentMode || (exports.CommentMode = {}));
    var InlayHintKind;
    (function (InlayHintKind) {
        InlayHintKind[InlayHintKind["Type"] = 1] = "Type";
        InlayHintKind[InlayHintKind["Parameter"] = 2] = "Parameter";
    })(InlayHintKind = exports.InlayHintKind || (exports.InlayHintKind = {}));
    /**
     * @internal
     */
    exports.TokenizationRegistry = new tokenizationRegistry_1.TokenizationRegistry();
    /**
     * @internal
     */
    var ExternalUriOpenerPriority;
    (function (ExternalUriOpenerPriority) {
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["None"] = 0] = "None";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Option"] = 1] = "Option";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Default"] = 2] = "Default";
        ExternalUriOpenerPriority[ExternalUriOpenerPriority["Preferred"] = 3] = "Preferred";
    })(ExternalUriOpenerPriority = exports.ExternalUriOpenerPriority || (exports.ExternalUriOpenerPriority = {}));
});
//# sourceMappingURL=languages.js.map