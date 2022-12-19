/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/debug/node/terminals"], function (require, exports, assert, terminals_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - prepareCommand', () => {
        test('bash', () => {
            assert.strictEqual((0, terminals_1.prepareCommand)('bash', ['{$} (']).trim(), '{\\$}\\ \\(');
            assert.strictEqual((0, terminals_1.prepareCommand)('bash', ['hello', 'world', '--flag=true']).trim(), 'hello world --flag=true');
            assert.strictEqual((0, terminals_1.prepareCommand)('bash', [' space arg ']).trim(), '\\ space\\ arg\\');
        });
        test('bash - do not escape > and <', () => {
            assert.strictEqual((0, terminals_1.prepareCommand)('bash', ['arg1', '>', '> hello.txt', '<', '<input.in']).trim(), 'arg1 > \\>\\ hello.txt < \\<input.in');
        });
        test('cmd', () => {
            assert.strictEqual((0, terminals_1.prepareCommand)('cmd.exe', ['^!< ']).trim(), '"^^^!^< "');
            assert.strictEqual((0, terminals_1.prepareCommand)('cmd.exe', ['hello', 'world', '--flag=true']).trim(), 'hello world --flag=true');
            assert.strictEqual((0, terminals_1.prepareCommand)('cmd.exe', [' space arg ']).trim(), '" space arg "');
            assert.strictEqual((0, terminals_1.prepareCommand)('cmd.exe', ['"A>0"']).trim(), '"""A^>0"""');
            assert.strictEqual((0, terminals_1.prepareCommand)('cmd.exe', ['']).trim(), '""');
        });
        test('cmd - do not escape > and <', () => {
            assert.strictEqual((0, terminals_1.prepareCommand)('cmd.exe', ['arg1', '>', '> hello.txt', '<', '<input.in']).trim(), 'arg1 > "^> hello.txt" < ^<input.in');
        });
        test('powershell', () => {
            assert.strictEqual((0, terminals_1.prepareCommand)('powershell', ['!< ']).trim(), `& '!< '`);
            assert.strictEqual((0, terminals_1.prepareCommand)('powershell', ['hello', 'world', '--flag=true']).trim(), `& 'hello' 'world' '--flag=true'`);
            assert.strictEqual((0, terminals_1.prepareCommand)('powershell', [' space arg ']).trim(), `& ' space arg '`);
            assert.strictEqual((0, terminals_1.prepareCommand)('powershell', ['"A>0"']).trim(), `& '"A>0"'`);
            assert.strictEqual((0, terminals_1.prepareCommand)('powershell', ['']).trim(), `& ''`);
        });
        test('powershell - do not escape > and <', () => {
            assert.strictEqual((0, terminals_1.prepareCommand)('powershell', ['arg1', '>', '> hello.txt', '<', '<input.in']).trim(), `& 'arg1' > '> hello.txt' < '<input.in'`);
        });
    });
});
//# sourceMappingURL=terminals.test.js.map