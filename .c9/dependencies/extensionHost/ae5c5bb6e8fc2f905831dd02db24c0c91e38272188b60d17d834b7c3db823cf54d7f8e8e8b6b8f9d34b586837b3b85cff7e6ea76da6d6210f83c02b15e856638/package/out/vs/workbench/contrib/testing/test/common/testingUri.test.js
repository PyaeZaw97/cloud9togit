/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/testing/common/testingUri"], function (require, exports, assert, testingUri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - Testing URIs', () => {
        test('round trip', () => {
            const uris = [
                { type: 1 /* TestUriType.ResultActualOutput */, taskIndex: 1, messageIndex: 42, resultId: 'r', testExtId: 't' },
                { type: 2 /* TestUriType.ResultExpectedOutput */, taskIndex: 1, messageIndex: 42, resultId: 'r', testExtId: 't' },
                { type: 0 /* TestUriType.ResultMessage */, taskIndex: 1, messageIndex: 42, resultId: 'r', testExtId: 't' },
            ];
            for (const uri of uris) {
                const serialized = (0, testingUri_1.buildTestUri)(uri);
                assert.deepStrictEqual(uri, (0, testingUri_1.parseTestUri)(serialized));
            }
        });
    });
});
//# sourceMappingURL=testingUri.test.js.map