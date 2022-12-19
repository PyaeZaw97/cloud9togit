/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/async", "xterm", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/platform/log/common/log"], function (require, exports, assert_1, async_1, xterm_1, commandDetectionCapability_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    async function writeP(terminal, data) {
        return new Promise((resolve, reject) => {
            const failTimeout = (0, async_1.timeout)(2000);
            failTimeout.then(() => reject('Writing to xterm is taking longer than 2 seconds'));
            terminal.write(data, () => {
                failTimeout.cancel();
                resolve();
            });
        });
    }
    class TestCommandDetectionCapability extends commandDetectionCapability_1.CommandDetectionCapability {
        clearCommands() {
            this._commands.length = 0;
        }
    }
    suite('CommandDetectionCapability', () => {
        let xterm;
        let capability;
        let addEvents;
        function assertCommands(expectedCommands) {
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => e.command), expectedCommands.map(e => e.command));
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => e.cwd), expectedCommands.map(e => e.cwd));
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => e.exitCode), expectedCommands.map(e => e.exitCode));
            (0, assert_1.deepStrictEqual)(capability.commands.map(e => { var _a; return (_a = e.marker) === null || _a === void 0 ? void 0 : _a.line; }), expectedCommands.map(e => { var _a; return (_a = e.marker) === null || _a === void 0 ? void 0 : _a.line; }));
            // Ensure timestamps are set and were captured recently
            for (const command of capability.commands) {
                (0, assert_1.ok)(Math.abs(Date.now() - command.timestamp) < 2000);
            }
            (0, assert_1.deepStrictEqual)(addEvents, capability.commands);
            // Clear the commands to avoid re-asserting past commands
            addEvents.length = 0;
            capability.clearCommands();
        }
        async function printStandardCommand(prompt, command, output, cwd, exitCode) {
            if (cwd !== undefined) {
                capability.setCwd(cwd);
            }
            capability.handlePromptStart();
            await writeP(xterm, `\r${prompt}`);
            capability.handleCommandStart();
            await writeP(xterm, command);
            capability.handleCommandExecuted();
            await writeP(xterm, `\r\n${output}\r\n`);
            capability.handleCommandFinished(exitCode);
        }
        setup(() => {
            xterm = new xterm_1.Terminal({ cols: 80 });
            capability = new TestCommandDetectionCapability(xterm, new log_1.NullLogService());
            addEvents = [];
            capability.onCommandFinished(e => addEvents.push(e));
            assertCommands([]);
        });
        test('should not add commands when no capability methods are triggered', async () => {
            await writeP(xterm, 'foo\r\nbar\r\n');
            assertCommands([]);
            await writeP(xterm, 'baz\r\n');
            assertCommands([]);
        });
        test('should add commands for expected capability method calls', async () => {
            await printStandardCommand('$ ', 'echo foo', 'foo', undefined, 0);
            assertCommands([{
                    command: 'echo foo',
                    exitCode: 0,
                    cwd: undefined,
                    marker: { line: 0 }
                }]);
        });
        test('should trim the command when command executed appears on the following line', async () => {
            await printStandardCommand('$ ', 'echo foo\r\n', 'foo', undefined, 0);
            assertCommands([{
                    command: 'echo foo',
                    exitCode: 0,
                    cwd: undefined,
                    marker: { line: 0 }
                }]);
        });
        suite('cwd', () => {
            test('should add cwd to commands when it\'s set', async () => {
                await printStandardCommand('$ ', 'echo foo', 'foo', '/home', 0);
                await printStandardCommand('$ ', 'echo bar', 'bar', '/home/second', 0);
                assertCommands([
                    { command: 'echo foo', exitCode: 0, cwd: '/home', marker: { line: 0 } },
                    { command: 'echo bar', exitCode: 0, cwd: '/home/second', marker: { line: 2 } }
                ]);
            });
            test('should add old cwd to commands if no cwd sequence is output', async () => {
                await printStandardCommand('$ ', 'echo foo', 'foo', '/home', 0);
                await printStandardCommand('$ ', 'echo bar', 'bar', undefined, 0);
                assertCommands([
                    { command: 'echo foo', exitCode: 0, cwd: '/home', marker: { line: 0 } },
                    { command: 'echo bar', exitCode: 0, cwd: '/home', marker: { line: 2 } }
                ]);
            });
            test('should use an undefined cwd if it\'s not set initially', async () => {
                await printStandardCommand('$ ', 'echo foo', 'foo', undefined, 0);
                await printStandardCommand('$ ', 'echo bar', 'bar', '/home', 0);
                assertCommands([
                    { command: 'echo foo', exitCode: 0, cwd: undefined, marker: { line: 0 } },
                    { command: 'echo bar', exitCode: 0, cwd: '/home', marker: { line: 2 } }
                ]);
            });
        });
    });
});
//# sourceMappingURL=commandDetectionCapability.test.js.map