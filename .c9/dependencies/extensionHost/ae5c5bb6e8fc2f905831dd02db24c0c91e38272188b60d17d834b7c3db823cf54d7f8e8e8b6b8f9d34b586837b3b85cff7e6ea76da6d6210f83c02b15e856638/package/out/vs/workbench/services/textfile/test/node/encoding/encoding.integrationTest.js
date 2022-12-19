/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/node/terminalEncoding"], function (require, exports, assert, terminalEncoding) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Encoding', () => {
        test('resolve terminal encoding (detect)', async function () {
            const enc = await terminalEncoding.resolveTerminalEncoding();
            assert.ok(enc.length > 0);
        });
    });
});
//# sourceMappingURL=encoding.integrationTest.js.map