/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/browser/ui/list/listWidget", "vs/base/parts/quickinput/browser/quickInput", "vs/base/test/common/testUtils"], function (require, exports, assert, listWidget_1, quickInput_1, testUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Simple promisify of setTimeout
    function wait(delayMS) {
        return new Promise(function (resolve) {
            setTimeout(resolve, delayMS);
        });
    }
    (0, testUtils_1.flakySuite)('QuickInput', () => {
        let fixture, controller, quickpick;
        function getScrollTop() {
            return quickpick.scrollTop;
        }
        setup(() => {
            fixture = document.createElement('div');
            document.body.appendChild(fixture);
            controller = new quickInput_1.QuickInputController({
                container: fixture,
                idPrefix: 'testQuickInput',
                ignoreFocusOut() { return false; },
                isScreenReaderOptimized() { return false; },
                returnFocus() { },
                backKeybindingLabel() { return undefined; },
                setContextKey() { return undefined; },
                createList: (user, container, delegate, renderers, options) => new listWidget_1.List(user, container, delegate, renderers, options),
                styles: {
                    button: {},
                    countBadge: {},
                    inputBox: {},
                    keybindingLabel: {},
                    list: {},
                    progressBar: {},
                    widget: {}
                }
            });
            // initial layout
            controller.layout({ height: 20, width: 40 }, 0);
        });
        teardown(() => {
            quickpick === null || quickpick === void 0 ? void 0 : quickpick.dispose();
            controller.dispose();
            document.body.removeChild(fixture);
        });
        test('pick - basecase', async () => {
            const item = { label: 'foo' };
            const pickPromise = controller.pick([item, { label: 'bar' }]);
            // wait a bit to let the pick get set up.
            await wait(200);
            controller.accept();
            const pick = await pickPromise;
            assert.strictEqual(pick, item);
        });
        test('pick - activeItem is honored', async () => {
            const item = { label: 'foo' };
            const pickPromise = controller.pick([{ label: 'bar' }, item], { activeItem: item });
            // wait a bit to let the pick get set up.
            await wait(200);
            controller.accept();
            const pick = await pickPromise;
            assert.strictEqual(pick, item);
        });
        test('input - basecase', async () => {
            const inputPromise = controller.input({ value: 'foo' });
            // wait a bit to let the pick get set up.
            await wait(200);
            controller.accept();
            const value = await inputPromise;
            assert.strictEqual(value, 'foo');
        });
        test('onDidChangeValue - gets triggered when .value is set', async () => {
            quickpick = controller.createQuickPick();
            let value = undefined;
            quickpick.onDidChangeValue((e) => value = e);
            // Trigger a change
            quickpick.value = 'changed';
            try {
                // wait a bit to let the event play out.
                await wait(200);
                assert.strictEqual(value, quickpick.value);
            }
            finally {
                quickpick.dispose();
            }
        });
        test('keepScrollPosition - works with activeItems', async () => {
            quickpick = controller.createQuickPick();
            const items = [];
            for (let i = 0; i < 1000; i++) {
                items.push({ label: `item ${i}` });
            }
            quickpick.items = items;
            // setting the active item should cause the quick pick to scroll to the bottom
            quickpick.activeItems = [items[items.length - 1]];
            quickpick.show();
            let cursorTop = getScrollTop();
            assert.notStrictEqual(cursorTop, 0);
            quickpick.keepScrollPosition = true;
            quickpick.activeItems = [items[0]];
            assert.strictEqual(cursorTop, getScrollTop());
            quickpick.keepScrollPosition = false;
            quickpick.activeItems = [items[0]];
            assert.strictEqual(getScrollTop(), 0);
        });
        test('keepScrollPosition - works with items', async () => {
            quickpick = controller.createQuickPick();
            const items = [];
            for (let i = 0; i < 1000; i++) {
                items.push({ label: `item ${i}` });
            }
            quickpick.items = items;
            // setting the active item should cause the quick pick to scroll to the bottom
            quickpick.activeItems = [items[items.length - 1]];
            quickpick.show();
            let cursorTop = getScrollTop();
            assert.notStrictEqual(cursorTop, 0);
            quickpick.keepScrollPosition = true;
            quickpick.items = items;
            assert.strictEqual(cursorTop, getScrollTop());
            quickpick.keepScrollPosition = false;
            quickpick.items = items;
            assert.strictEqual(getScrollTop(), 0);
        });
        test('selectedItems - verify previous selectedItems does not hang over to next set of items', async () => {
            quickpick = controller.createQuickPick();
            quickpick.items = [{ label: 'step 1' }];
            quickpick.show();
            void (await new Promise(resolve => {
                quickpick.onDidAccept(() => {
                    quickpick.canSelectMany = true;
                    quickpick.items = [{ label: 'a' }, { label: 'b' }, { label: 'c' }];
                    resolve();
                });
                // accept 'step 1'
                controller.accept();
            }));
            // accept in multi-select
            controller.accept();
            // Since we don't select any items, the selected items should be empty
            assert.strictEqual(quickpick.selectedItems.length, 0);
        });
    });
});
//# sourceMappingURL=quickinput.test.js.map