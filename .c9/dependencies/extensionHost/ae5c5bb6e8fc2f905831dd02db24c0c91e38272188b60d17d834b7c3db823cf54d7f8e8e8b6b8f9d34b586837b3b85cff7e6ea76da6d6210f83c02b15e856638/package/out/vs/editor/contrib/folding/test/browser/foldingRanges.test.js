/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/editor/contrib/folding/browser/foldingRanges", "vs/editor/contrib/folding/browser/indentRangeProvider", "vs/editor/test/common/testTextModel"], function (require, exports, assert, foldingRanges_1, indentRangeProvider_1, testTextModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let markers = {
        start: /^\s*#region\b/,
        end: /^\s*#endregion\b/
    };
    suite('FoldingRanges', () => {
        test('test max folding regions', () => {
            let lines = [];
            let nRegions = foldingRanges_1.MAX_FOLDING_REGIONS;
            for (let i = 0; i < nRegions; i++) {
                lines.push('#region');
            }
            for (let i = 0; i < nRegions; i++) {
                lines.push('#endregion');
            }
            let model = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            let actual = (0, indentRangeProvider_1.computeRanges)(model, false, markers, foldingRanges_1.MAX_FOLDING_REGIONS);
            assert.strictEqual(actual.length, nRegions, 'len');
            for (let i = 0; i < nRegions; i++) {
                assert.strictEqual(actual.getStartLineNumber(i), i + 1, 'start' + i);
                assert.strictEqual(actual.getEndLineNumber(i), nRegions * 2 - i, 'end' + i);
                assert.strictEqual(actual.getParentIndex(i), i - 1, 'parent' + i);
            }
            model.dispose();
        });
        test('findRange', () => {
            let lines = [
                /* 1*/ '#region',
                /* 2*/ '#endregion',
                /* 3*/ 'class A {',
                /* 4*/ '  void foo() {',
                /* 5*/ '    if (true) {',
                /* 6*/ '        return;',
                /* 7*/ '    }',
                /* 8*/ '',
                /* 9*/ '    if (true) {',
                /* 10*/ '      return;',
                /* 11*/ '    }',
                /* 12*/ '  }',
                /* 13*/ '}'
            ];
            let textModel = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            try {
                let actual = (0, indentRangeProvider_1.computeRanges)(textModel, false, markers);
                // let r0 = r(1, 2);
                // let r1 = r(3, 12);
                // let r2 = r(4, 11);
                // let r3 = r(5, 6);
                // let r4 = r(9, 10);
                assert.strictEqual(actual.findRange(1), 0, '1');
                assert.strictEqual(actual.findRange(2), 0, '2');
                assert.strictEqual(actual.findRange(3), 1, '3');
                assert.strictEqual(actual.findRange(4), 2, '4');
                assert.strictEqual(actual.findRange(5), 3, '5');
                assert.strictEqual(actual.findRange(6), 3, '6');
                assert.strictEqual(actual.findRange(7), 2, '7');
                assert.strictEqual(actual.findRange(8), 2, '8');
                assert.strictEqual(actual.findRange(9), 4, '9');
                assert.strictEqual(actual.findRange(10), 4, '10');
                assert.strictEqual(actual.findRange(11), 2, '11');
                assert.strictEqual(actual.findRange(12), 1, '12');
                assert.strictEqual(actual.findRange(13), -1, '13');
            }
            finally {
                textModel.dispose();
            }
        });
        test('setCollapsed', () => {
            let lines = [];
            let nRegions = 500;
            for (let i = 0; i < nRegions; i++) {
                lines.push('#region');
            }
            for (let i = 0; i < nRegions; i++) {
                lines.push('#endregion');
            }
            let model = (0, testTextModel_1.createTextModel)(lines.join('\n'));
            let actual = (0, indentRangeProvider_1.computeRanges)(model, false, markers, foldingRanges_1.MAX_FOLDING_REGIONS);
            assert.strictEqual(actual.length, nRegions, 'len');
            for (let i = 0; i < nRegions; i++) {
                actual.setCollapsed(i, i % 3 === 0);
            }
            for (let i = 0; i < nRegions; i++) {
                assert.strictEqual(actual.isCollapsed(i), i % 3 === 0, 'line' + i);
            }
            model.dispose();
        });
    });
});
//# sourceMappingURL=foldingRanges.test.js.map