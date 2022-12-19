/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/log/common/log", "vs/platform/terminal/node/terminalEnvironment"], function (require, exports, assert_1, log_1, terminalEnvironment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const enabledProcessOptions = { enabled: true, showWelcome: true };
    const disabledProcessOptions = { enabled: false, showWelcome: true };
    const pwshExe = process.platform === 'win32' ? 'pwsh.exe' : 'pwsh';
    const repoRoot = process.platform === 'win32' ? process.cwd()[0].toLowerCase() + process.cwd().substring(1) : process.cwd();
    const logService = new log_1.NullLogService();
    suite('platform - terminalEnvironment', () => {
        suite('getShellIntegrationInjection', () => {
            suite('should not enable', () => {
                test('when isFeatureTerminal or when no executable is provided', () => {
                    (0, assert_1.ok)(!(0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-l', '-NoLogo'], isFeatureTerminal: true }, enabledProcessOptions, logService));
                    (0, assert_1.ok)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-l', '-NoLogo'], isFeatureTerminal: false }, enabledProcessOptions, logService));
                });
            });
            suite('pwsh', () => {
                const expectedPs1 = process.platform === 'win32'
                    ? `${repoRoot}\\out\\vs\\workbench\\contrib\\terminal\\browser\\media\\shellIntegration.ps1`
                    : `${repoRoot}/out/vs/workbench/contrib/terminal/browser/media/shellIntegration.ps1`;
                suite('should override args', () => {
                    const enabledExpectedResult = Object.freeze({
                        newArgs: [
                            '-noexit',
                            '-command',
                            `. "${expectedPs1}"`
                        ]
                    });
                    test('when undefined, []', () => {
                        (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: [] }, enabledProcessOptions, logService), enabledExpectedResult);
                        (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: undefined }, enabledProcessOptions, logService), enabledExpectedResult);
                    });
                    suite('when no logo', () => {
                        test('array - case insensitive', () => {
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-NoLogo'] }, enabledProcessOptions, logService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-NOLOGO'] }, enabledProcessOptions, logService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-nol'] }, enabledProcessOptions, logService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-NOL'] }, enabledProcessOptions, logService), enabledExpectedResult);
                        });
                        test('string - case insensitive', () => {
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-NoLogo' }, enabledProcessOptions, logService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-NOLOGO' }, enabledProcessOptions, logService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-nol' }, enabledProcessOptions, logService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-NOL' }, enabledProcessOptions, logService), enabledExpectedResult);
                        });
                    });
                });
                suite('should incorporate login arg', () => {
                    const enabledExpectedResult = Object.freeze({
                        newArgs: [
                            '-l',
                            '-noexit',
                            '-command',
                            `. "${expectedPs1}"`
                        ]
                    });
                    test('when array contains no logo and login', () => {
                        (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-l', '-NoLogo'] }, enabledProcessOptions, logService), enabledExpectedResult);
                    });
                    test('when string', () => {
                        (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-l' }, enabledProcessOptions, logService), enabledExpectedResult);
                    });
                });
                suite('should not modify args', () => {
                    test('when shell integration is disabled', () => {
                        (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-l'] }, disabledProcessOptions, logService), undefined);
                        (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-l' }, disabledProcessOptions, logService), undefined);
                        (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: undefined }, disabledProcessOptions, logService), undefined);
                    });
                    test('when using unrecognized arg', () => {
                        (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: ['-l', '-NoLogo', '-i'] }, disabledProcessOptions, logService), undefined);
                    });
                    test('when using unrecognized arg (string)', () => {
                        (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: pwshExe, args: '-i' }, disabledProcessOptions, logService), undefined);
                    });
                });
            });
            if (process.platform !== 'win32') {
                suite('zsh', () => {
                    suite('should override args', () => {
                        const expectedDir = /.+\/vscode-zsh/;
                        const expectedDests = [/.+\/vscode-zsh\/.zshrc/, /.+\/vscode-zsh\/.zprofile/, /.+\/vscode-zsh\/.zshenv/];
                        const expectedSources = [
                            /.+\/out\/vs\/workbench\/contrib\/terminal\/browser\/media\/shellIntegration.zsh/,
                            /.+\/out\/vs\/workbench\/contrib\/terminal\/browser\/media\/shellIntegration-profile.zsh/,
                            /.+\/out\/vs\/workbench\/contrib\/terminal\/browser\/media\/shellIntegration-env.zsh/
                        ];
                        function assertIsEnabled(result) {
                            var _a, _b;
                            (0, assert_1.strictEqual)(Object.keys(result.envMixin).length, 1);
                            (0, assert_1.ok)((_a = result.envMixin['ZDOTDIR']) === null || _a === void 0 ? void 0 : _a.match(expectedDir));
                            (0, assert_1.strictEqual)((_b = result.filesToCopy) === null || _b === void 0 ? void 0 : _b.length, 3);
                            (0, assert_1.ok)(result.filesToCopy[0].dest.match(expectedDests[0]));
                            (0, assert_1.ok)(result.filesToCopy[1].dest.match(expectedDests[1]));
                            (0, assert_1.ok)(result.filesToCopy[2].dest.match(expectedDests[2]));
                            (0, assert_1.ok)(result.filesToCopy[0].source.match(expectedSources[0]));
                            (0, assert_1.ok)(result.filesToCopy[1].source.match(expectedSources[1]));
                            (0, assert_1.ok)(result.filesToCopy[2].source.match(expectedSources[2]));
                        }
                        test('when undefined, []', () => {
                            const result1 = (0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: [] }, enabledProcessOptions, logService);
                            (0, assert_1.deepStrictEqual)(result1 === null || result1 === void 0 ? void 0 : result1.newArgs, ['-i']);
                            assertIsEnabled(result1);
                            const result2 = (0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: undefined }, enabledProcessOptions, logService);
                            (0, assert_1.deepStrictEqual)(result2 === null || result2 === void 0 ? void 0 : result2.newArgs, ['-i']);
                            assertIsEnabled(result2);
                        });
                        suite('should incorporate login arg', () => {
                            test('when array', () => {
                                const result = (0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: ['-l'] }, enabledProcessOptions, logService);
                                (0, assert_1.deepStrictEqual)(result === null || result === void 0 ? void 0 : result.newArgs, ['-il']);
                                assertIsEnabled(result);
                            });
                        });
                        suite('should not modify args', () => {
                            test('when shell integration is disabled', () => {
                                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: ['-l'] }, disabledProcessOptions, logService), undefined);
                                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: undefined }, disabledProcessOptions, logService), undefined);
                            });
                            test('when using unrecognized arg', () => {
                                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'zsh', args: ['-l', '-fake'] }, disabledProcessOptions, logService), undefined);
                            });
                        });
                    });
                });
                suite('bash', () => {
                    suite('should override args', () => {
                        test('when undefined, [], empty string', () => {
                            const enabledExpectedResult = Object.freeze({
                                newArgs: [
                                    '--init-file',
                                    `${repoRoot}/out/vs/workbench/contrib/terminal/browser/media/shellIntegration-bash.sh`
                                ],
                                envMixin: {}
                            });
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: [] }, enabledProcessOptions, logService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: '' }, enabledProcessOptions, logService), enabledExpectedResult);
                            (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: undefined }, enabledProcessOptions, logService), enabledExpectedResult);
                        });
                        suite('should set login env variable and not modify args', () => {
                            const enabledExpectedResult = Object.freeze({
                                newArgs: [
                                    '--init-file',
                                    `${repoRoot}/out/vs/workbench/contrib/terminal/browser/media/shellIntegration-bash.sh`
                                ],
                                envMixin: {
                                    VSCODE_SHELL_LOGIN: '1'
                                }
                            });
                            test('when array', () => {
                                (0, assert_1.deepStrictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: ['-l'] }, enabledProcessOptions, logService), enabledExpectedResult);
                            });
                        });
                        suite('should not modify args', () => {
                            test('when shell integration is disabled', () => {
                                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: ['-l'] }, disabledProcessOptions, logService), undefined);
                                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: undefined }, disabledProcessOptions, logService), undefined);
                            });
                            test('when custom array entry', () => {
                                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getShellIntegrationInjection)({ executable: 'bash', args: ['-l', '-i'] }, disabledProcessOptions, logService), undefined);
                            });
                        });
                    });
                });
            }
        });
    });
});
//# sourceMappingURL=terminalEnvironment.test.js.map