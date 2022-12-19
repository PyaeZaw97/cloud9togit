/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/buffer", "vs/editor/common/core/stringBuilder"], function (require, exports, assert, buffer_1, stringBuilder_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('decodeUTF16LE', () => {
        test('issue #118041: unicode character undo bug 1', () => {
            const buff = new Uint8Array(2);
            (0, buffer_1.writeUInt16LE)(buff, '﻿'.charCodeAt(0), 0);
            const actual = (0, stringBuilder_1.decodeUTF16LE)(buff, 0, 1);
            assert.deepStrictEqual(actual, '﻿');
        });
        test('issue #118041: unicode character undo bug 2', () => {
            const buff = new Uint8Array(4);
            (0, buffer_1.writeUInt16LE)(buff, 'a﻿'.charCodeAt(0), 0);
            (0, buffer_1.writeUInt16LE)(buff, 'a﻿'.charCodeAt(1), 2);
            const actual = (0, stringBuilder_1.decodeUTF16LE)(buff, 0, 2);
            assert.deepStrictEqual(actual, 'a﻿');
        });
        test('issue #118041: unicode character undo bug 3', () => {
            const buff = new Uint8Array(6);
            (0, buffer_1.writeUInt16LE)(buff, 'a﻿b'.charCodeAt(0), 0);
            (0, buffer_1.writeUInt16LE)(buff, 'a﻿b'.charCodeAt(1), 2);
            (0, buffer_1.writeUInt16LE)(buff, 'a﻿b'.charCodeAt(2), 4);
            const actual = (0, stringBuilder_1.decodeUTF16LE)(buff, 0, 3);
            assert.deepStrictEqual(actual, 'a﻿b');
        });
    });
});
//# sourceMappingURL=stringBuilder.test.js.map