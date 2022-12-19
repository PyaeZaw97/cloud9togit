/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/codicons"], function (require, exports, assert, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Codicon', () => {
        test('Can get proper aria labels', () => {
            // note, the spaces in the results are important
            const testCases = new Map([
                ['', ''],
                ['asdf', 'asdf'],
                ['asdf$(squirrel)asdf', 'asdf squirrel asdf'],
                ['asdf $(squirrel) asdf', 'asdf  squirrel  asdf'],
                ['$(rocket)asdf', 'rocket asdf'],
                ['$(rocket) asdf', 'rocket  asdf'],
                ['$(rocket)$(rocket)$(rocket)asdf', 'rocket  rocket  rocket asdf'],
                ['$(rocket) asdf $(rocket)', 'rocket  asdf  rocket'],
                ['$(rocket)asdf$(rocket)', 'rocket asdf rocket'],
            ]);
            for (const [input, expected] of testCases) {
                assert.strictEqual((0, codicons_1.getCodiconAriaLabel)(input), expected);
            }
        });
    });
});
//# sourceMappingURL=codicons.test.js.map