/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/uuid", "vs/base/common/platform", "vs/platform/registry/common/platform", "vs/base/common/actions", "vs/base/common/keybindings", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/workbench/common/actions", "vs/platform/keybinding/common/keybinding", "vs/workbench/services/extensions/common/extensions", "vs/platform/contextkey/common/contextkey", "vs/workbench/services/preferences/browser/keybindingsEditorModel", "vs/platform/keybinding/common/resolvedKeybindingItem", "vs/platform/keybinding/common/usLayoutResolvedKeybinding", "vs/platform/instantiation/test/common/instantiationServiceMock"], function (require, exports, assert, uuid, platform_1, platform_2, actions_1, keybindings_1, actions_2, commands_1, actions_3, keybinding_1, extensions_1, contextkey_1, keybindingsEditorModel_1, resolvedKeybindingItem_1, usLayoutResolvedKeybinding_1, instantiationServiceMock_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class AnAction extends actions_1.Action {
        constructor(id) {
            super(id);
        }
    }
    suite('KeybindingsEditorModel', () => {
        let instantiationService;
        let testObject;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(keybinding_1.IKeybindingService, {});
            instantiationService.stub(extensions_1.IExtensionService, {}, 'whenInstalledExtensionsRegistered', () => Promise.resolve(null));
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, platform_1.OS);
            commands_1.CommandsRegistry.registerCommand('command_without_keybinding', () => { });
        });
        test('fetch returns default keybindings', async () => {
            const expected = prepareKeybindingService(aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'b' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ }, chordPart: { keyCode: 9 /* KeyCode.Escape */ } }));
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch(''));
            assertKeybindingItems(actuals, expected);
        });
        test('fetch returns distinct keybindings', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = prepareKeybindingService(aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */ } }));
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch(''));
            assertKeybindingItems(actuals, [expected[0]]);
        });
        test('fetch returns default keybindings at the top', async () => {
            const expected = prepareKeybindingService(aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'b' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ }, chordPart: { keyCode: 9 /* KeyCode.Escape */ } }));
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch('').slice(0, 2), true);
            assertKeybindingItems(actuals, expected);
        });
        test('fetch returns default keybindings sorted by command id', async () => {
            const keybindings = prepareKeybindingService(aResolvedKeybindingItem({ command: 'b' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'c' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ }, chordPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstPart: { keyCode: 1 /* KeyCode.Backspace */ } }));
            const expected = [keybindings[2], keybindings[0], keybindings[1]];
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch(''));
            assertKeybindingItems(actuals, expected);
        });
        test('fetch returns user keybinding first if default and user has same id', async () => {
            const sameId = 'b' + uuid.generateUuid();
            const keybindings = prepareKeybindingService(aResolvedKeybindingItem({ command: sameId, firstPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: sameId, firstPart: { keyCode: 9 /* KeyCode.Escape */ }, chordPart: { keyCode: 9 /* KeyCode.Escape */ }, isDefault: false }));
            const expected = [keybindings[1], keybindings[0]];
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch(''));
            assertKeybindingItems(actuals, expected);
        });
        test('fetch returns keybinding with titles first', async () => {
            const keybindings = prepareKeybindingService(aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'b' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ }, chordPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'c' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ }, chordPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'd' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ }, chordPart: { keyCode: 9 /* KeyCode.Escape */ } }));
            registerCommandWithTitle(keybindings[1].command, 'B Title');
            registerCommandWithTitle(keybindings[3].command, 'A Title');
            const expected = [keybindings[3], keybindings[1], keybindings[0], keybindings[2]];
            instantiationService.stub(keybinding_1.IKeybindingService, 'getKeybindings', () => keybindings);
            instantiationService.stub(keybinding_1.IKeybindingService, 'getDefaultKeybindings', () => keybindings);
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch(''));
            assertKeybindingItems(actuals, expected);
        });
        test('fetch returns keybinding with user first if title and id matches', async () => {
            const sameId = 'b' + uuid.generateUuid();
            const keybindings = prepareKeybindingService(aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: sameId, firstPart: { keyCode: 9 /* KeyCode.Escape */ }, chordPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'c' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ }, chordPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: sameId, firstPart: { keyCode: 9 /* KeyCode.Escape */ }, isDefault: false }));
            registerCommandWithTitle(keybindings[1].command, 'Same Title');
            registerCommandWithTitle(keybindings[3].command, 'Same Title');
            const expected = [keybindings[3], keybindings[1], keybindings[0], keybindings[2]];
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch(''));
            assertKeybindingItems(actuals, expected);
        });
        test('fetch returns default keybindings sorted by precedence', async () => {
            const expected = prepareKeybindingService(aResolvedKeybindingItem({ command: 'b' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'c' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ }, chordPart: { keyCode: 9 /* KeyCode.Escape */ } }), aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstPart: { keyCode: 1 /* KeyCode.Backspace */ } }));
            await testObject.resolve(new Map());
            const actuals = asResolvedKeybindingItems(testObject.fetch('', true));
            assertKeybindingItems(actuals, expected);
        });
        test('convert keybinding without title to entry', async () => {
            const expected = aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2' });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('')[0];
            assert.strictEqual(actual.keybindingItem.command, expected.command);
            assert.strictEqual(actual.keybindingItem.commandLabel, '');
            assert.strictEqual(actual.keybindingItem.commandDefaultLabel, null);
            assert.strictEqual(actual.keybindingItem.keybinding.getAriaLabel(), expected.resolvedKeybinding.getAriaLabel());
            assert.strictEqual(actual.keybindingItem.when, expected.when.serialize());
        });
        test('convert keybinding with title to entry', async () => {
            const expected = aResolvedKeybindingItem({ command: 'a' + uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2' });
            prepareKeybindingService(expected);
            registerCommandWithTitle(expected.command, 'Some Title');
            await testObject.resolve(new Map());
            const actual = testObject.fetch('')[0];
            assert.strictEqual(actual.keybindingItem.command, expected.command);
            assert.strictEqual(actual.keybindingItem.commandLabel, 'Some Title');
            assert.strictEqual(actual.keybindingItem.commandDefaultLabel, null);
            assert.strictEqual(actual.keybindingItem.keybinding.getAriaLabel(), expected.resolvedKeybinding.getAriaLabel());
            assert.strictEqual(actual.keybindingItem.when, expected.when.serialize());
        });
        test('convert without title and binding to entry', async () => {
            commands_1.CommandsRegistry.registerCommand('command_without_keybinding', () => { });
            prepareKeybindingService();
            await testObject.resolve(new Map());
            const actual = testObject.fetch('').filter(element => element.keybindingItem.command === 'command_without_keybinding')[0];
            assert.strictEqual(actual.keybindingItem.command, 'command_without_keybinding');
            assert.strictEqual(actual.keybindingItem.commandLabel, '');
            assert.strictEqual(actual.keybindingItem.commandDefaultLabel, null);
            assert.strictEqual(actual.keybindingItem.keybinding, undefined);
            assert.strictEqual(actual.keybindingItem.when, '');
        });
        test('convert with title and without binding to entry', async () => {
            const id = 'a' + uuid.generateUuid();
            registerCommandWithTitle(id, 'some title');
            prepareKeybindingService();
            await testObject.resolve(new Map());
            const actual = testObject.fetch('').filter(element => element.keybindingItem.command === id)[0];
            assert.strictEqual(actual.keybindingItem.command, id);
            assert.strictEqual(actual.keybindingItem.commandLabel, 'some title');
            assert.strictEqual(actual.keybindingItem.commandDefaultLabel, null);
            assert.strictEqual(actual.keybindingItem.keybinding, undefined);
            assert.strictEqual(actual.keybindingItem.when, '');
        });
        test('filter by command id', async () => {
            const id = 'workbench.action.increaseViewSize';
            registerCommandWithTitle(id, 'some title');
            prepareKeybindingService();
            await testObject.resolve(new Map());
            const actual = testObject.fetch('workbench action view size').filter(element => element.keybindingItem.command === id)[0];
            assert.ok(actual);
        });
        test('filter by command title', async () => {
            const id = 'a' + uuid.generateUuid();
            registerCommandWithTitle(id, 'Increase view size');
            prepareKeybindingService();
            await testObject.resolve(new Map());
            const actual = testObject.fetch('increase size').filter(element => element.keybindingItem.command === id)[0];
            assert.ok(actual);
        });
        test('filter by default source', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2' });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('default').filter(element => element.keybindingItem.command === command)[0];
            assert.ok(actual);
        });
        test('filter by user source', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2', isDefault: false });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('user').filter(element => element.keybindingItem.command === command)[0];
            assert.ok(actual);
        });
        test('filter by default source with "@source: " prefix', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2', isDefault: true });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('@source: default').filter(element => element.keybindingItem.command === command)[0];
            assert.ok(actual);
        });
        test('filter by user source with "@source: " prefix', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2', isDefault: false });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('@source: user').filter(element => element.keybindingItem.command === command)[0];
            assert.ok(actual);
        });
        test('filter by command prefix with different commands', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2', isDefault: true });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command: uuid.generateUuid(), firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: true }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch(`@command:${command}`);
            assert.strictEqual(actual.length, 1);
            assert.deepStrictEqual(actual[0].keybindingItem.command, command);
        });
        test('filter by command prefix with same commands', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */ }, when: 'context1 && context2', isDefault: true });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: true }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch(`@command:${command}`);
            assert.strictEqual(actual.length, 2);
            assert.deepStrictEqual(actual[0].keybindingItem.command, command);
            assert.deepStrictEqual(actual[1].keybindingItem.command, command);
        });
        test('filter by when context', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */ }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('when context').filter(element => element.keybindingItem.command === command)[0];
            assert.ok(actual);
        });
        test('filter by cmd key', async () => {
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */);
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected);
            await testObject.resolve(new Map());
            const actual = testObject.fetch('cmd').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by meta key', async () => {
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */);
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('meta').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by command key', async () => {
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */);
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('command').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by windows key', async () => {
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 1 /* OperatingSystem.Windows */);
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('windows').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by alt key', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('alt').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { altKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by option key', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('option').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { altKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by ctrl key', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('ctrl').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { ctrlKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by control key', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('control').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { ctrlKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by shift key', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('shift').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { shiftKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by arrow', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 17 /* KeyCode.RightArrow */, modifiers: { shiftKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('arrow').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by modifier and key', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 17 /* KeyCode.RightArrow */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 17 /* KeyCode.RightArrow */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('alt right').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { altKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by key and modifier', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 17 /* KeyCode.RightArrow */, modifiers: { altKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 17 /* KeyCode.RightArrow */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('right alt').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(0, actual.length);
        });
        test('filter by modifiers and key', async () => {
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */);
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true, metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('alt cmd esc').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { altKey: true, metaKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by modifiers in random order and key', async () => {
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */);
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('cmd shift esc').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true, shiftKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by first part', async () => {
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */);
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, chordPart: { keyCode: 20 /* KeyCode.Delete */ }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('cmd shift esc').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true, shiftKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter matches in chord part', async () => {
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */);
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, chordPart: { keyCode: 20 /* KeyCode.Delete */ }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('cmd del').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { metaKey: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, { keyCode: true });
        });
        test('filter matches first part and in chord part', async () => {
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */);
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, chordPart: { keyCode: 20 /* KeyCode.Delete */ }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, chordPart: { keyCode: 16 /* KeyCode.UpArrow */ }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('cmd shift esc del').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { shiftKey: true, metaKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, { keyCode: true });
        });
        test('filter exact matches', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, chordPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"ctrl c"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { ctrlKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter exact matches with first and chord part', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, chordPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"shift meta escape ctrl c"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { shiftKey: true, metaKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, { ctrlKey: true, keyCode: true });
        });
        test('filter exact matches with first and chord part no results', async () => {
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */);
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, chordPart: { keyCode: 20 /* KeyCode.Delete */, modifiers: { metaKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, chordPart: { keyCode: 16 /* KeyCode.UpArrow */ }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"cmd shift esc del"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(0, actual.length);
        });
        test('filter matches with + separator', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, chordPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"control+c"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { ctrlKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter by keybinding prefix', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, chordPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('@keybinding:control+c').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { ctrlKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, {});
        });
        test('filter matches with + separator in first and chord parts', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, chordPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"shift+meta+escape ctrl+c"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { shiftKey: true, metaKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, { keyCode: true, ctrlKey: true });
        });
        test('filter by keybinding prefix with chord', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { shiftKey: true, metaKey: true } }, chordPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 33 /* KeyCode.KeyC */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('@keybinding:"shift+meta+escape ctrl+c"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { shiftKey: true, metaKey: true, keyCode: true });
            assert.deepStrictEqual(actual[0].keybindingMatches.chordPart, { keyCode: true, ctrlKey: true });
        });
        test('filter exact matches with space #32993', async () => {
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 10 /* KeyCode.Space */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command, firstPart: { keyCode: 1 /* KeyCode.Backspace */, modifiers: { ctrlKey: true } }, when: 'whenContext1 && whenContext2', isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"ctrl+space"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
        });
        test('filter exact matches with user settings label', async () => {
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */);
            const command = 'a' + uuid.generateUuid();
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 18 /* KeyCode.DownArrow */ } });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command: 'down', firstPart: { keyCode: 9 /* KeyCode.Escape */ } }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('"down"').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { keyCode: true });
        });
        test('filter modifiers are not matched when not completely matched (prefix)', async () => {
            var _a;
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */);
            const term = `alt.${uuid.generateUuid()}`;
            const command = `command.${term}`;
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */ }, isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command: 'some_command', firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch(term);
            assert.strictEqual(1, actual.length);
            assert.strictEqual(command, actual[0].keybindingItem.command);
            assert.strictEqual(1, (_a = actual[0].commandIdMatches) === null || _a === void 0 ? void 0 : _a.length);
        });
        test('filter modifiers are not matched when not completely matched (includes)', async () => {
            var _a;
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */);
            const term = `abcaltdef.${uuid.generateUuid()}`;
            const command = `command.${term}`;
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */ }, isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command: 'some_command', firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch(term);
            assert.strictEqual(1, actual.length);
            assert.strictEqual(command, actual[0].keybindingItem.command);
            assert.strictEqual(1, (_a = actual[0].commandIdMatches) === null || _a === void 0 ? void 0 : _a.length);
        });
        test('filter modifiers are matched with complete term', async () => {
            testObject = instantiationService.createInstance(keybindingsEditorModel_1.KeybindingsEditorModel, 2 /* OperatingSystem.Macintosh */);
            const command = `command.${uuid.generateUuid()}`;
            const expected = aResolvedKeybindingItem({ command, firstPart: { keyCode: 9 /* KeyCode.Escape */, modifiers: { altKey: true } }, isDefault: false });
            prepareKeybindingService(expected, aResolvedKeybindingItem({ command: 'some_command', firstPart: { keyCode: 9 /* KeyCode.Escape */ }, isDefault: false }));
            await testObject.resolve(new Map());
            const actual = testObject.fetch('alt').filter(element => element.keybindingItem.command === command);
            assert.strictEqual(1, actual.length);
            assert.deepStrictEqual(actual[0].keybindingMatches.firstPart, { altKey: true });
        });
        function prepareKeybindingService(...keybindingItems) {
            instantiationService.stub(keybinding_1.IKeybindingService, 'getKeybindings', () => keybindingItems);
            instantiationService.stub(keybinding_1.IKeybindingService, 'getDefaultKeybindings', () => keybindingItems);
            return keybindingItems;
        }
        function registerCommandWithTitle(command, title) {
            const registry = platform_2.Registry.as(actions_3.Extensions.WorkbenchActions);
            registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.create(AnAction, command, title, { primary: 0 }), '');
        }
        function assertKeybindingItems(actual, expected) {
            assert.strictEqual(actual.length, expected.length);
            for (let i = 0; i < actual.length; i++) {
                assertKeybindingItem(actual[i], expected[i]);
            }
        }
        function assertKeybindingItem(actual, expected) {
            assert.strictEqual(actual.command, expected.command);
            if (actual.when) {
                assert.ok(!!expected.when);
                assert.strictEqual(actual.when.serialize(), expected.when.serialize());
            }
            else {
                assert.ok(!expected.when);
            }
            assert.strictEqual(actual.isDefault, expected.isDefault);
            if (actual.resolvedKeybinding) {
                assert.ok(!!expected.resolvedKeybinding);
                assert.strictEqual(actual.resolvedKeybinding.getLabel(), expected.resolvedKeybinding.getLabel());
            }
            else {
                assert.ok(!expected.resolvedKeybinding);
            }
        }
        function aResolvedKeybindingItem({ command, when, isDefault, firstPart, chordPart }) {
            const aSimpleKeybinding = function (part) {
                const { ctrlKey, shiftKey, altKey, metaKey } = part.modifiers || { ctrlKey: false, shiftKey: false, altKey: false, metaKey: false };
                return new keybindings_1.SimpleKeybinding(ctrlKey, shiftKey, altKey, metaKey, part.keyCode);
            };
            let parts = [];
            if (firstPart) {
                parts.push(aSimpleKeybinding(firstPart));
                if (chordPart) {
                    parts.push(aSimpleKeybinding(chordPart));
                }
            }
            const keybinding = parts.length > 0 ? new usLayoutResolvedKeybinding_1.USLayoutResolvedKeybinding(new keybindings_1.ChordKeybinding(parts), platform_1.OS) : undefined;
            return new resolvedKeybindingItem_1.ResolvedKeybindingItem(keybinding, command || 'some command', null, when ? contextkey_1.ContextKeyExpr.deserialize(when) : undefined, isDefault === undefined ? true : isDefault, null, false);
        }
        function asResolvedKeybindingItems(keybindingEntries, keepUnassigned = false) {
            if (!keepUnassigned) {
                keybindingEntries = keybindingEntries.filter(keybindingEntry => !!keybindingEntry.keybindingItem.keybinding);
            }
            return keybindingEntries.map(entry => entry.keybindingItem.keybindingItem);
        }
    });
});
//# sourceMappingURL=keybindingsEditorModel.test.js.map