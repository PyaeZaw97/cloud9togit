/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/normalization"], function (require, exports, assert, normalization_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Normalization', () => {
        test('removeAccents', function () {
            assert.strictEqual((0, normalization_1.removeAccents)('joào'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('joáo'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('joâo'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('joäo'), 'joao');
            // assert.strictEqual(strings.removeAccents('joæo'), 'joao'); // not an accent
            assert.strictEqual((0, normalization_1.removeAccents)('joão'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('joåo'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('joåo'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('joāo'), 'joao');
            assert.strictEqual((0, normalization_1.removeAccents)('fôo'), 'foo');
            assert.strictEqual((0, normalization_1.removeAccents)('föo'), 'foo');
            assert.strictEqual((0, normalization_1.removeAccents)('fòo'), 'foo');
            assert.strictEqual((0, normalization_1.removeAccents)('fóo'), 'foo');
            // assert.strictEqual(strings.removeAccents('fœo'), 'foo');
            // assert.strictEqual(strings.removeAccents('føo'), 'foo');
            assert.strictEqual((0, normalization_1.removeAccents)('fōo'), 'foo');
            assert.strictEqual((0, normalization_1.removeAccents)('fõo'), 'foo');
            assert.strictEqual((0, normalization_1.removeAccents)('andrè'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('andré'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('andrê'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('andrë'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('andrē'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('andrė'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('andrę'), 'andre');
            assert.strictEqual((0, normalization_1.removeAccents)('hvîc'), 'hvic');
            assert.strictEqual((0, normalization_1.removeAccents)('hvïc'), 'hvic');
            assert.strictEqual((0, normalization_1.removeAccents)('hvíc'), 'hvic');
            assert.strictEqual((0, normalization_1.removeAccents)('hvīc'), 'hvic');
            assert.strictEqual((0, normalization_1.removeAccents)('hvįc'), 'hvic');
            assert.strictEqual((0, normalization_1.removeAccents)('hvìc'), 'hvic');
            assert.strictEqual((0, normalization_1.removeAccents)('ûdo'), 'udo');
            assert.strictEqual((0, normalization_1.removeAccents)('üdo'), 'udo');
            assert.strictEqual((0, normalization_1.removeAccents)('ùdo'), 'udo');
            assert.strictEqual((0, normalization_1.removeAccents)('údo'), 'udo');
            assert.strictEqual((0, normalization_1.removeAccents)('ūdo'), 'udo');
            assert.strictEqual((0, normalization_1.removeAccents)('heÿ'), 'hey');
            // assert.strictEqual(strings.removeAccents('gruß'), 'grus');
            assert.strictEqual((0, normalization_1.removeAccents)('gruś'), 'grus');
            assert.strictEqual((0, normalization_1.removeAccents)('gruš'), 'grus');
            assert.strictEqual((0, normalization_1.removeAccents)('çool'), 'cool');
            assert.strictEqual((0, normalization_1.removeAccents)('ćool'), 'cool');
            assert.strictEqual((0, normalization_1.removeAccents)('čool'), 'cool');
            assert.strictEqual((0, normalization_1.removeAccents)('ñice'), 'nice');
            assert.strictEqual((0, normalization_1.removeAccents)('ńice'), 'nice');
        });
    });
});
//# sourceMappingURL=normalization.test.js.map