/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getParseErrorMessage = void 0;
    function getParseErrorMessage(errorCode) {
        switch (errorCode) {
            case 1 /* ParseErrorCode.InvalidSymbol */: return (0, nls_1.localize)('error.invalidSymbol', 'Invalid symbol');
            case 2 /* ParseErrorCode.InvalidNumberFormat */: return (0, nls_1.localize)('error.invalidNumberFormat', 'Invalid number format');
            case 3 /* ParseErrorCode.PropertyNameExpected */: return (0, nls_1.localize)('error.propertyNameExpected', 'Property name expected');
            case 4 /* ParseErrorCode.ValueExpected */: return (0, nls_1.localize)('error.valueExpected', 'Value expected');
            case 5 /* ParseErrorCode.ColonExpected */: return (0, nls_1.localize)('error.colonExpected', 'Colon expected');
            case 6 /* ParseErrorCode.CommaExpected */: return (0, nls_1.localize)('error.commaExpected', 'Comma expected');
            case 7 /* ParseErrorCode.CloseBraceExpected */: return (0, nls_1.localize)('error.closeBraceExpected', 'Closing brace expected');
            case 8 /* ParseErrorCode.CloseBracketExpected */: return (0, nls_1.localize)('error.closeBracketExpected', 'Closing bracket expected');
            case 9 /* ParseErrorCode.EndOfFileExpected */: return (0, nls_1.localize)('error.endOfFileExpected', 'End of file expected');
            default:
                return '';
        }
    }
    exports.getParseErrorMessage = getParseErrorMessage;
});
//# sourceMappingURL=jsonErrorMessages.js.map