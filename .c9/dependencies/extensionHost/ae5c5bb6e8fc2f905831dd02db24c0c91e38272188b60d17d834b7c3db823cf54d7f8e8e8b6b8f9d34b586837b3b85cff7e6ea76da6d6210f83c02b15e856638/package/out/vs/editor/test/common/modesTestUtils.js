/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/common/tokens/lineTokens", "vs/editor/common/languages/supports", "vs/editor/common/services/languagesRegistry"], function (require, exports, lineTokens_1, supports_1, languagesRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createFakeScopedLineTokens = void 0;
    function createFakeScopedLineTokens(rawTokens) {
        let tokens = new Uint32Array(rawTokens.length << 1);
        let line = '';
        for (let i = 0, len = rawTokens.length; i < len; i++) {
            let rawToken = rawTokens[i];
            let startOffset = line.length;
            let metadata = ((rawToken.type << 8 /* MetadataConsts.TOKEN_TYPE_OFFSET */)) >>> 0;
            tokens[(i << 1)] = startOffset;
            tokens[(i << 1) + 1] = metadata;
            line += rawToken.text;
        }
        lineTokens_1.LineTokens.convertToEndOffset(tokens, line.length);
        return (0, supports_1.createScopedLineTokens)(new lineTokens_1.LineTokens(tokens, line, new languagesRegistry_1.LanguageIdCodec()), 0);
    }
    exports.createFakeScopedLineTokens = createFakeScopedLineTokens;
});
//# sourceMappingURL=modesTestUtils.js.map