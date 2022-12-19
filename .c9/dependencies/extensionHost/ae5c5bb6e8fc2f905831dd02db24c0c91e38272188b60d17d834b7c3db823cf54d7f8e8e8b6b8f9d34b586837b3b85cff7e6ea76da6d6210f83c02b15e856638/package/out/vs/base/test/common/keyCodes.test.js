/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/keyCodes", "vs/base/common/keybindings"], function (require, exports, assert, keyCodes_1, keybindings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('keyCodes', () => {
        function testBinaryEncoding(expected, k, OS) {
            assert.deepStrictEqual((0, keybindings_1.createKeybinding)(k, OS), expected);
        }
        test('mapping for Minus', () => {
            // [147, 83, 0, ScanCode.Minus, 'Minus', KeyCode.US_MINUS, '-', 189, 'VK_OEM_MINUS', '-', 'OEM_MINUS'],
            assert.strictEqual(keyCodes_1.EVENT_KEY_CODE_MAP[189], 83 /* KeyCode.Minus */);
            assert.strictEqual(keyCodes_1.NATIVE_WINDOWS_KEY_CODE_TO_KEY_CODE['VK_OEM_MINUS'], 83 /* KeyCode.Minus */);
            assert.strictEqual(keyCodes_1.ScanCodeUtils.lowerCaseToEnum('minus'), 51 /* ScanCode.Minus */);
            assert.strictEqual(keyCodes_1.ScanCodeUtils.toEnum('Minus'), 51 /* ScanCode.Minus */);
            assert.strictEqual(keyCodes_1.ScanCodeUtils.toString(51 /* ScanCode.Minus */), 'Minus');
            assert.strictEqual(keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[51 /* ScanCode.Minus */], -1 /* KeyCode.DependsOnKbLayout */);
            assert.strictEqual(keyCodes_1.IMMUTABLE_KEY_CODE_TO_CODE[83 /* KeyCode.Minus */], -1 /* ScanCode.DependsOnKbLayout */);
            assert.strictEqual(keyCodes_1.KeyCodeUtils.toString(83 /* KeyCode.Minus */), '-');
            assert.strictEqual(keyCodes_1.KeyCodeUtils.fromString('-'), 83 /* KeyCode.Minus */);
            assert.strictEqual(keyCodes_1.KeyCodeUtils.toUserSettingsUS(83 /* KeyCode.Minus */), '-');
            assert.strictEqual(keyCodes_1.KeyCodeUtils.toUserSettingsGeneral(83 /* KeyCode.Minus */), 'OEM_MINUS');
            assert.strictEqual(keyCodes_1.KeyCodeUtils.fromUserSettings('-'), 83 /* KeyCode.Minus */);
            assert.strictEqual(keyCodes_1.KeyCodeUtils.fromUserSettings('OEM_MINUS'), 83 /* KeyCode.Minus */);
            assert.strictEqual(keyCodes_1.KeyCodeUtils.fromUserSettings('oem_minus'), 83 /* KeyCode.Minus */);
        });
        test('mapping for Space', () => {
            // [21, 10, 1, ScanCode.Space, 'Space', KeyCode.Space, 'Space', 32, 'VK_SPACE', empty, empty],
            assert.strictEqual(keyCodes_1.EVENT_KEY_CODE_MAP[32], 10 /* KeyCode.Space */);
            assert.strictEqual(keyCodes_1.NATIVE_WINDOWS_KEY_CODE_TO_KEY_CODE['VK_SPACE'], 10 /* KeyCode.Space */);
            assert.strictEqual(keyCodes_1.ScanCodeUtils.lowerCaseToEnum('space'), 50 /* ScanCode.Space */);
            assert.strictEqual(keyCodes_1.ScanCodeUtils.toEnum('Space'), 50 /* ScanCode.Space */);
            assert.strictEqual(keyCodes_1.ScanCodeUtils.toString(50 /* ScanCode.Space */), 'Space');
            assert.strictEqual(keyCodes_1.IMMUTABLE_CODE_TO_KEY_CODE[50 /* ScanCode.Space */], 10 /* KeyCode.Space */);
            assert.strictEqual(keyCodes_1.IMMUTABLE_KEY_CODE_TO_CODE[10 /* KeyCode.Space */], 50 /* ScanCode.Space */);
            assert.strictEqual(keyCodes_1.KeyCodeUtils.toString(10 /* KeyCode.Space */), 'Space');
            assert.strictEqual(keyCodes_1.KeyCodeUtils.fromString('Space'), 10 /* KeyCode.Space */);
            assert.strictEqual(keyCodes_1.KeyCodeUtils.toUserSettingsUS(10 /* KeyCode.Space */), 'Space');
            assert.strictEqual(keyCodes_1.KeyCodeUtils.toUserSettingsGeneral(10 /* KeyCode.Space */), 'Space');
            assert.strictEqual(keyCodes_1.KeyCodeUtils.fromUserSettings('Space'), 10 /* KeyCode.Space */);
            assert.strictEqual(keyCodes_1.KeyCodeUtils.fromUserSettings('space'), 10 /* KeyCode.Space */);
        });
        test('MAC binary encoding', () => {
            function test(expected, k) {
                testBinaryEncoding(expected, k, 2 /* OperatingSystem.Macintosh */);
            }
            test(null, 0);
            test(new keybindings_1.SimpleKeybinding(false, false, false, false, 3 /* KeyCode.Enter */).toChord(), 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(true, false, false, false, 3 /* KeyCode.Enter */).toChord(), 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(false, false, true, false, 3 /* KeyCode.Enter */).toChord(), 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(true, false, true, false, 3 /* KeyCode.Enter */).toChord(), 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(false, true, false, false, 3 /* KeyCode.Enter */).toChord(), 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(true, true, false, false, 3 /* KeyCode.Enter */).toChord(), 1024 /* KeyMod.Shift */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(false, true, true, false, 3 /* KeyCode.Enter */).toChord(), 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(true, true, true, false, 3 /* KeyCode.Enter */).toChord(), 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(false, false, false, true, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(true, false, false, true, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(false, false, true, true, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(true, false, true, true, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(false, true, false, true, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(true, true, false, true, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(false, true, true, true, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.SimpleKeybinding(true, true, true, true, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
            test(new keybindings_1.ChordKeybinding([
                new keybindings_1.SimpleKeybinding(false, false, false, false, 3 /* KeyCode.Enter */),
                new keybindings_1.SimpleKeybinding(false, false, false, false, 2 /* KeyCode.Tab */)
            ]), (0, keyCodes_1.KeyChord)(3 /* KeyCode.Enter */, 2 /* KeyCode.Tab */));
            test(new keybindings_1.ChordKeybinding([
                new keybindings_1.SimpleKeybinding(false, false, false, true, 55 /* KeyCode.KeyY */),
                new keybindings_1.SimpleKeybinding(false, false, false, false, 56 /* KeyCode.KeyZ */)
            ]), (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */, 56 /* KeyCode.KeyZ */));
        });
        test('WINDOWS & LINUX binary encoding', () => {
            [3 /* OperatingSystem.Linux */, 1 /* OperatingSystem.Windows */].forEach((OS) => {
                function test(expected, k) {
                    testBinaryEncoding(expected, k, OS);
                }
                test(null, 0);
                test(new keybindings_1.SimpleKeybinding(false, false, false, false, 3 /* KeyCode.Enter */).toChord(), 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(false, false, false, true, 3 /* KeyCode.Enter */).toChord(), 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(false, false, true, false, 3 /* KeyCode.Enter */).toChord(), 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(false, false, true, true, 3 /* KeyCode.Enter */).toChord(), 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(false, true, false, false, 3 /* KeyCode.Enter */).toChord(), 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(false, true, false, true, 3 /* KeyCode.Enter */).toChord(), 1024 /* KeyMod.Shift */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(false, true, true, false, 3 /* KeyCode.Enter */).toChord(), 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(false, true, true, true, 3 /* KeyCode.Enter */).toChord(), 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(true, false, false, false, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(true, false, false, true, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(true, false, true, false, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(true, false, true, true, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(true, true, false, false, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(true, true, false, true, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(true, true, true, false, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.SimpleKeybinding(true, true, true, true, 3 /* KeyCode.Enter */).toChord(), 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 256 /* KeyMod.WinCtrl */ | 3 /* KeyCode.Enter */);
                test(new keybindings_1.ChordKeybinding([
                    new keybindings_1.SimpleKeybinding(false, false, false, false, 3 /* KeyCode.Enter */),
                    new keybindings_1.SimpleKeybinding(false, false, false, false, 2 /* KeyCode.Tab */)
                ]), (0, keyCodes_1.KeyChord)(3 /* KeyCode.Enter */, 2 /* KeyCode.Tab */));
                test(new keybindings_1.ChordKeybinding([
                    new keybindings_1.SimpleKeybinding(true, false, false, false, 55 /* KeyCode.KeyY */),
                    new keybindings_1.SimpleKeybinding(false, false, false, false, 56 /* KeyCode.KeyZ */)
                ]), (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 55 /* KeyCode.KeyY */, 56 /* KeyCode.KeyZ */));
            });
        });
    });
});
//# sourceMappingURL=keyCodes.test.js.map