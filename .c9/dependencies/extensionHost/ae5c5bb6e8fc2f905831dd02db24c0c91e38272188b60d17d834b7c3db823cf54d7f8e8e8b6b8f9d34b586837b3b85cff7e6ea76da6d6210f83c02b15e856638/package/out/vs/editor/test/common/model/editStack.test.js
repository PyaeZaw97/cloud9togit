/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/common/model/editStack", "vs/editor/common/core/selection", "vs/editor/common/core/textChange"], function (require, exports, assert, editStack_1, selection_1, textChange_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('EditStack', () => {
        test('issue #118041: unicode character undo bug', () => {
            const stackData = new editStack_1.SingleModelEditStackData(1, 2, 0 /* EndOfLineSequence.LF */, 0 /* EndOfLineSequence.LF */, [new selection_1.Selection(10, 2, 10, 2)], [new selection_1.Selection(10, 1, 10, 1)], [new textChange_1.TextChange(428, '﻿', 428, '')]);
            const buff = stackData.serialize();
            const actual = editStack_1.SingleModelEditStackData.deserialize(buff);
            assert.deepStrictEqual(actual, stackData);
        });
    });
});
//# sourceMappingURL=editStack.test.js.map