/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions"], function (require, exports, assert, actionbar_1, actions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Actionbar', () => {
        test('prepareActions()', function () {
            let a1 = new actions_1.Separator();
            let a2 = new actions_1.Separator();
            let a3 = new actions_1.Action('a3');
            let a4 = new actions_1.Separator();
            let a5 = new actions_1.Separator();
            let a6 = new actions_1.Action('a6');
            let a7 = new actions_1.Separator();
            let actions = (0, actionbar_1.prepareActions)([a1, a2, a3, a4, a5, a6, a7]);
            assert.strictEqual(actions.length, 3); // duplicate separators get removed
            assert(actions[0] === a3);
            assert(actions[1] === a5);
            assert(actions[2] === a6);
        });
        test('hasAction()', function () {
            const container = document.createElement('div');
            const actionbar = new actionbar_1.ActionBar(container);
            let a1 = new actions_1.Action('a1');
            let a2 = new actions_1.Action('a2');
            actionbar.push(a1);
            assert.strictEqual(actionbar.hasAction(a1), true);
            assert.strictEqual(actionbar.hasAction(a2), false);
            actionbar.pull(0);
            assert.strictEqual(actionbar.hasAction(a1), false);
            actionbar.push(a1, { index: 1 });
            actionbar.push(a2, { index: 0 });
            assert.strictEqual(actionbar.hasAction(a1), true);
            assert.strictEqual(actionbar.hasAction(a2), true);
            actionbar.pull(0);
            assert.strictEqual(actionbar.hasAction(a1), true);
            assert.strictEqual(actionbar.hasAction(a2), false);
            actionbar.pull(0);
            assert.strictEqual(actionbar.hasAction(a1), false);
            assert.strictEqual(actionbar.hasAction(a2), false);
            actionbar.push(a1);
            assert.strictEqual(actionbar.hasAction(a1), true);
            actionbar.clear();
            assert.strictEqual(actionbar.hasAction(a1), false);
        });
    });
});
//# sourceMappingURL=actionbar.test.js.map