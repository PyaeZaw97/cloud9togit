/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings"], function (require, exports, strings) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.normalizeIndentation = void 0;
    function _normalizeIndentationFromWhitespace(str, indentSize, insertSpaces) {
        let spacesCnt = 0;
        for (let i = 0; i < str.length; i++) {
            if (str.charAt(i) === '\t') {
                spacesCnt += indentSize;
            }
            else {
                spacesCnt++;
            }
        }
        let result = '';
        if (!insertSpaces) {
            const tabsCnt = Math.floor(spacesCnt / indentSize);
            spacesCnt = spacesCnt % indentSize;
            for (let i = 0; i < tabsCnt; i++) {
                result += '\t';
            }
        }
        for (let i = 0; i < spacesCnt; i++) {
            result += ' ';
        }
        return result;
    }
    function normalizeIndentation(str, indentSize, insertSpaces) {
        let firstNonWhitespaceIndex = strings.firstNonWhitespaceIndex(str);
        if (firstNonWhitespaceIndex === -1) {
            firstNonWhitespaceIndex = str.length;
        }
        return _normalizeIndentationFromWhitespace(str.substring(0, firstNonWhitespaceIndex), indentSize, insertSpaces) + str.substring(firstNonWhitespaceIndex);
    }
    exports.normalizeIndentation = normalizeIndentation;
});
//# sourceMappingURL=indentation.js.map