/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/languages"], function (require, exports, languages_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nullTokenizeEncoded = exports.nullTokenize = exports.NullState = void 0;
    exports.NullState = new class {
        clone() {
            return this;
        }
        equals(other) {
            return (this === other);
        }
    };
    function nullTokenize(languageId, state) {
        return new languages_1.TokenizationResult([new languages_1.Token(0, '', languageId)], state);
    }
    exports.nullTokenize = nullTokenize;
    function nullTokenizeEncoded(languageId, state) {
        const tokens = new Uint32Array(2);
        tokens[0] = 0;
        tokens[1] = ((languageId << 0 /* MetadataConsts.LANGUAGEID_OFFSET */)
            | (0 /* StandardTokenType.Other */ << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */)
            | (0 /* FontStyle.None */ << 11 /* MetadataConsts.FONT_STYLE_OFFSET */)
            | (1 /* ColorId.DefaultForeground */ << 15 /* MetadataConsts.FOREGROUND_OFFSET */)
            | (2 /* ColorId.DefaultBackground */ << 24 /* MetadataConsts.BACKGROUND_OFFSET */)) >>> 0;
        return new languages_1.EncodedTokenizationResult(tokens, state === null ? exports.NullState : state);
    }
    exports.nullTokenizeEncoded = nullTokenizeEncoded;
});
//# sourceMappingURL=nullTokenize.js.map