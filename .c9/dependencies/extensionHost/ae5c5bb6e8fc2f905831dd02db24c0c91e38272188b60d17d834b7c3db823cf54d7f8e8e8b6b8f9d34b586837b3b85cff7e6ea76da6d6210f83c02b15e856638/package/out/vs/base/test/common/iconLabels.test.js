/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/iconLabels"], function (require, exports, assert, iconLabels_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function filterOk(filter, word, target, highlights) {
        let r = filter(word, target);
        assert(r);
        if (highlights) {
            assert.deepStrictEqual(r, highlights);
        }
    }
    suite('Icon Labels', () => {
        test('matchesFuzzyIconAware', () => {
            // Camel Case
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'ccr', (0, iconLabels_1.parseLabelWithIcons)('$(codicon)CamelCaseRocks$(codicon)'), [
                { start: 10, end: 11 },
                { start: 15, end: 16 },
                { start: 19, end: 20 }
            ]);
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'ccr', (0, iconLabels_1.parseLabelWithIcons)('$(codicon) CamelCaseRocks $(codicon)'), [
                { start: 11, end: 12 },
                { start: 16, end: 17 },
                { start: 20, end: 21 }
            ]);
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'iut', (0, iconLabels_1.parseLabelWithIcons)('$(codicon) Indent $(octico) Using $(octic) Tpaces'), [
                { start: 11, end: 12 },
                { start: 28, end: 29 },
                { start: 43, end: 44 },
            ]);
            // Prefix
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'using', (0, iconLabels_1.parseLabelWithIcons)('$(codicon) Indent Using Spaces'), [
                { start: 18, end: 23 },
            ]);
            // Broken Codicon
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'codicon', (0, iconLabels_1.parseLabelWithIcons)('This $(codicon Indent Using Spaces'), [
                { start: 7, end: 14 },
            ]);
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'indent', (0, iconLabels_1.parseLabelWithIcons)('This $codicon Indent Using Spaces'), [
                { start: 14, end: 20 },
            ]);
            // Testing #59343
            filterOk(iconLabels_1.matchesFuzzyIconAware, 'unt', (0, iconLabels_1.parseLabelWithIcons)('$(primitive-dot) $(file-text) Untitled-1'), [
                { start: 30, end: 33 },
            ]);
            // Testing #136172
            filterOk(iconLabels_1.matchesFuzzyIconAware, 's', (0, iconLabels_1.parseLabelWithIcons)('$(loading~spin) start'), [
                { start: 16, end: 17 },
            ]);
        });
        test('stripIcons', () => {
            assert.strictEqual((0, iconLabels_1.stripIcons)('Hello World'), 'Hello World');
            assert.strictEqual((0, iconLabels_1.stripIcons)('$(Hello World'), '$(Hello World');
            assert.strictEqual((0, iconLabels_1.stripIcons)('$(Hello) World'), ' World');
            assert.strictEqual((0, iconLabels_1.stripIcons)('$(Hello) W$(oi)rld'), ' Wrld');
        });
        test('escapeIcons', () => {
            assert.strictEqual((0, iconLabels_1.escapeIcons)('Hello World'), 'Hello World');
            assert.strictEqual((0, iconLabels_1.escapeIcons)('$(Hello World'), '$(Hello World');
            assert.strictEqual((0, iconLabels_1.escapeIcons)('$(Hello) World'), '\\$(Hello) World');
            assert.strictEqual((0, iconLabels_1.escapeIcons)('\\$(Hello) W$(oi)rld'), '\\$(Hello) W\\$(oi)rld');
        });
        test('markdownEscapeEscapedIcons', () => {
            assert.strictEqual((0, iconLabels_1.markdownEscapeEscapedIcons)('Hello World'), 'Hello World');
            assert.strictEqual((0, iconLabels_1.markdownEscapeEscapedIcons)('$(Hello) World'), '$(Hello) World');
            assert.strictEqual((0, iconLabels_1.markdownEscapeEscapedIcons)('\\$(Hello) World'), '\\\\$(Hello) World');
        });
    });
});
//# sourceMappingURL=iconLabels.test.js.map