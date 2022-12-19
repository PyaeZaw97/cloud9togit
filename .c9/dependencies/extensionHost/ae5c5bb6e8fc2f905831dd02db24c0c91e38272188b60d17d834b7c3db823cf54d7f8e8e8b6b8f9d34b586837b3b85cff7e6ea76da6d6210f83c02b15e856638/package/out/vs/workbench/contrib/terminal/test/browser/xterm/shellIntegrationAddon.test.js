/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "xterm", "assert", "vs/base/common/async", "sinon", "vs/platform/terminal/common/xterm/shellIntegrationAddon", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log"], function (require, exports, xterm_1, assert_1, async_1, sinon, shellIntegrationAddon_1, instantiationServiceMock_1, log_1) {
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
    class TestShellIntegrationAddon extends shellIntegrationAddon_1.ShellIntegrationAddon {
        getCommandDetectionMock(terminal) {
            const capability = super._createOrGetCommandDetection(terminal);
            this.capabilities.add(2 /* TerminalCapability.CommandDetection */, capability);
            return sinon.mock(capability);
        }
        getCwdDectionMock() {
            const capability = super._createOrGetCwdDetection();
            this.capabilities.add(0 /* TerminalCapability.CwdDetection */, capability);
            return sinon.mock(capability);
        }
    }
    suite('ShellIntegrationAddon', () => {
        let xterm;
        let shellIntegrationAddon;
        let capabilities;
        setup(() => {
            xterm = new xterm_1.Terminal({
                cols: 80,
                rows: 30
            });
            const instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(log_1.ILogService, log_1.NullLogService);
            shellIntegrationAddon = instantiationService.createInstance(TestShellIntegrationAddon);
            xterm.loadAddon(shellIntegrationAddon);
            capabilities = shellIntegrationAddon.capabilities;
        });
        suite('cwd detection', async () => {
            test('should activate capability on the cwd sequence (OSC 633 ; P ; Cwd=<cwd> ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(0 /* TerminalCapability.CwdDetection */), false);
                await writeP(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(0 /* TerminalCapability.CwdDetection */), false);
                await writeP(xterm, '\x1b]633;P;Cwd=/foo\x07');
                (0, assert_1.strictEqual)(capabilities.has(0 /* TerminalCapability.CwdDetection */), true);
            });
            test('should pass cwd sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCwdDectionMock();
                mock.expects('updateCwd').once().withExactArgs('/foo');
                await writeP(xterm, '\x1b]633;P;Cwd=/foo\x07');
                mock.verify();
            });
        });
        suite('command tracking', async () => {
            test('should activate capability on the prompt start sequence (OSC 633 ; A ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await writeP(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await writeP(xterm, '\x1b]633;A\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), true);
            });
            test('should pass prompt start sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('handlePromptStart').once().withExactArgs();
                await writeP(xterm, '\x1b]633;A\x07');
                mock.verify();
            });
            test('should activate capability on the command start sequence (OSC 633 ; B ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await writeP(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await writeP(xterm, '\x1b]633;B\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), true);
            });
            test('should pass command start sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('handleCommandStart').once().withExactArgs();
                await writeP(xterm, '\x1b]633;B\x07');
                mock.verify();
            });
            test('should activate capability on the command executed sequence (OSC 633 ; C ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await writeP(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await writeP(xterm, '\x1b]633;C\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), true);
            });
            test('should pass command executed sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('handleCommandExecuted').once().withExactArgs();
                await writeP(xterm, '\x1b]633;C\x07');
                mock.verify();
            });
            test('should activate capability on the command finished sequence (OSC 633 ; D ; <ExitCode> ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await writeP(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await writeP(xterm, '\x1b]633;D;7\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), true);
            });
            test('should pass command finished sequence to the capability', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('handleCommandFinished').once().withExactArgs(7);
                await writeP(xterm, '\x1b]633;D;7\x07');
                mock.verify();
            });
            test('should not activate capability on the cwd sequence (OSC 633 ; P=Cwd=<cwd> ST)', async () => {
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await writeP(xterm, 'foo');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
                await writeP(xterm, '\x1b]633;P;Cwd=/foo\x07');
                (0, assert_1.strictEqual)(capabilities.has(2 /* TerminalCapability.CommandDetection */), false);
            });
            test('should pass cwd sequence to the capability if it\'s initialized', async () => {
                const mock = shellIntegrationAddon.getCommandDetectionMock(xterm);
                mock.expects('setCwd').once().withExactArgs('/foo');
                await writeP(xterm, '\x1b]633;P;Cwd=/foo\x07');
                mock.verify();
            });
        });
    });
});
//# sourceMappingURL=shellIntegrationAddon.test.js.map