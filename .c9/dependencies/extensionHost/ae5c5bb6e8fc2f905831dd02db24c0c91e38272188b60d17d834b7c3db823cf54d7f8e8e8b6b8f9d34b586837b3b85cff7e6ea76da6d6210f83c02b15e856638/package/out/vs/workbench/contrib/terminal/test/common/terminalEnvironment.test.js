/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/platform", "vs/base/common/uri", "vs/workbench/contrib/terminal/common/terminalEnvironment"], function (require, exports, assert_1, platform_1, uri_1, terminalEnvironment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - TerminalEnvironment', () => {
        suite('addTerminalEnvironmentKeys', () => {
            test('should set expected variables', () => {
                const env = {};
                (0, terminalEnvironment_1.addTerminalEnvironmentKeys)(env, '1.2.3', 'en', 'on');
                (0, assert_1.strictEqual)(env['TERM_PROGRAM'], 'vscode');
                (0, assert_1.strictEqual)(env['TERM_PROGRAM_VERSION'], '1.2.3');
                (0, assert_1.strictEqual)(env['COLORTERM'], 'truecolor');
                (0, assert_1.strictEqual)(env['LANG'], 'en_US.UTF-8');
            });
            test('should use language variant for LANG that is provided in locale', () => {
                const env = {};
                (0, terminalEnvironment_1.addTerminalEnvironmentKeys)(env, '1.2.3', 'en-au', 'on');
                (0, assert_1.strictEqual)(env['LANG'], 'en_AU.UTF-8', 'LANG is equal to the requested locale with UTF-8');
            });
            test('should fallback to en_US when no locale is provided', () => {
                const env2 = { FOO: 'bar' };
                (0, terminalEnvironment_1.addTerminalEnvironmentKeys)(env2, '1.2.3', undefined, 'on');
                (0, assert_1.strictEqual)(env2['LANG'], 'en_US.UTF-8', 'LANG is equal to en_US.UTF-8 as fallback.'); // More info on issue #14586
            });
            test('should fallback to en_US when an invalid locale is provided', () => {
                const env3 = { LANG: 'replace' };
                (0, terminalEnvironment_1.addTerminalEnvironmentKeys)(env3, '1.2.3', undefined, 'on');
                (0, assert_1.strictEqual)(env3['LANG'], 'en_US.UTF-8', 'LANG is set to the fallback LANG');
            });
            test('should override existing LANG', () => {
                const env4 = { LANG: 'en_AU.UTF-8' };
                (0, terminalEnvironment_1.addTerminalEnvironmentKeys)(env4, '1.2.3', undefined, 'on');
                (0, assert_1.strictEqual)(env4['LANG'], 'en_US.UTF-8', 'LANG is equal to the parent environment\'s LANG');
            });
        });
        suite('shouldSetLangEnvVariable', () => {
            test('auto', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({}, 'auto'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US' }, 'auto'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.utf' }, 'auto'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.utf8' }, 'auto'), false);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.UTF-8' }, 'auto'), false);
            });
            test('off', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({}, 'off'), false);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US' }, 'off'), false);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.utf' }, 'off'), false);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.utf8' }, 'off'), false);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.UTF-8' }, 'off'), false);
            });
            test('on', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({}, 'on'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US' }, 'on'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.utf' }, 'on'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.utf8' }, 'on'), true);
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.shouldSetLangEnvVariable)({ LANG: 'en-US.UTF-8' }, 'on'), true);
            });
        });
        suite('getLangEnvVariable', () => {
            test('should fallback to en_US when no locale is provided', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)(undefined), 'en_US.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)(''), 'en_US.UTF-8');
            });
            test('should fallback to default language variants when variant isn\'t provided', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('af'), 'af_ZA.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('am'), 'am_ET.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('be'), 'be_BY.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('bg'), 'bg_BG.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('ca'), 'ca_ES.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('cs'), 'cs_CZ.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('da'), 'da_DK.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('de'), 'de_DE.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('el'), 'el_GR.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('en'), 'en_US.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('es'), 'es_ES.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('et'), 'et_EE.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('eu'), 'eu_ES.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('fi'), 'fi_FI.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('fr'), 'fr_FR.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('he'), 'he_IL.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('hr'), 'hr_HR.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('hu'), 'hu_HU.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('hy'), 'hy_AM.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('is'), 'is_IS.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('it'), 'it_IT.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('ja'), 'ja_JP.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('kk'), 'kk_KZ.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('ko'), 'ko_KR.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('lt'), 'lt_LT.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('nl'), 'nl_NL.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('no'), 'no_NO.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('pl'), 'pl_PL.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('pt'), 'pt_BR.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('ro'), 'ro_RO.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('ru'), 'ru_RU.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('sk'), 'sk_SK.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('sl'), 'sl_SI.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('sr'), 'sr_YU.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('sv'), 'sv_SE.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('tr'), 'tr_TR.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('uk'), 'uk_UA.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('zh'), 'zh_CN.UTF-8');
            });
            test('should set language variant based on full locale', () => {
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('en-AU'), 'en_AU.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('en-au'), 'en_AU.UTF-8');
                (0, assert_1.strictEqual)((0, terminalEnvironment_1.getLangEnvVariable)('fa-ke'), 'fa_KE.UTF-8');
            });
        });
        suite('mergeEnvironments', () => {
            test('should add keys', () => {
                const parent = {
                    a: 'b'
                };
                const other = {
                    c: 'd'
                };
                (0, terminalEnvironment_1.mergeEnvironments)(parent, other);
                (0, assert_1.deepStrictEqual)(parent, {
                    a: 'b',
                    c: 'd'
                });
            });
            (!platform_1.isWindows ? test.skip : test)('should add keys ignoring case on Windows', () => {
                const parent = {
                    a: 'b'
                };
                const other = {
                    A: 'c'
                };
                (0, terminalEnvironment_1.mergeEnvironments)(parent, other);
                (0, assert_1.deepStrictEqual)(parent, {
                    a: 'c'
                });
            });
            test('null values should delete keys from the parent env', () => {
                const parent = {
                    a: 'b',
                    c: 'd'
                };
                const other = {
                    a: null
                };
                (0, terminalEnvironment_1.mergeEnvironments)(parent, other);
                (0, assert_1.deepStrictEqual)(parent, {
                    c: 'd'
                });
            });
            (!platform_1.isWindows ? test.skip : test)('null values should delete keys from the parent env ignoring case on Windows', () => {
                const parent = {
                    a: 'b',
                    c: 'd'
                };
                const other = {
                    A: null
                };
                (0, terminalEnvironment_1.mergeEnvironments)(parent, other);
                (0, assert_1.deepStrictEqual)(parent, {
                    c: 'd'
                });
            });
        });
        suite('getCwd', () => {
            // This helper checks the paths in a cross-platform friendly manner
            function assertPathsMatch(a, b) {
                (0, assert_1.strictEqual)(uri_1.URI.file(a).fsPath, uri_1.URI.file(b).fsPath);
            }
            test('should default to userHome for an empty workspace', async () => {
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, undefined, undefined), '/userHome/');
            });
            test('should use to the workspace if it exists', async () => {
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, uri_1.URI.file('/foo'), undefined), '/foo');
            });
            test('should use an absolute custom cwd as is', async () => {
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, undefined, '/foo'), '/foo');
            });
            test('should normalize a relative custom cwd against the workspace path', async () => {
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, uri_1.URI.file('/bar'), 'foo'), '/bar/foo');
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, uri_1.URI.file('/bar'), './foo'), '/bar/foo');
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, uri_1.URI.file('/bar'), '../foo'), '/foo');
            });
            test('should fall back for relative a custom cwd that doesn\'t have a workspace', async () => {
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, undefined, 'foo'), '/userHome/');
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, undefined, './foo'), '/userHome/');
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [] }, '/userHome/', undefined, undefined, '../foo'), '/userHome/');
            });
            test('should ignore custom cwd when told to ignore', async () => {
                assertPathsMatch(await (0, terminalEnvironment_1.getCwd)({ executable: undefined, args: [], ignoreConfigurationCwd: true }, '/userHome/', undefined, uri_1.URI.file('/bar'), '/foo'), '/bar');
            });
        });
        suite('getDefaultShell', () => {
            test('should change Sysnative to System32 in non-WoW64 systems', async () => {
                const shell = await (0, terminalEnvironment_1.getDefaultShell)(key => {
                    return { 'terminal.integrated.shell.windows': 'C:\\Windows\\Sysnative\\cmd.exe' }[key];
                }, 'DEFAULT', false, 'C:\\Windows', undefined, {}, false, 3 /* Platform.Windows */);
                (0, assert_1.strictEqual)(shell, 'C:\\Windows\\System32\\cmd.exe');
            });
            test('should not change Sysnative to System32 in WoW64 systems', async () => {
                const shell = await (0, terminalEnvironment_1.getDefaultShell)(key => {
                    return { 'terminal.integrated.shell.windows': 'C:\\Windows\\Sysnative\\cmd.exe' }[key];
                }, 'DEFAULT', true, 'C:\\Windows', undefined, {}, false, 3 /* Platform.Windows */);
                (0, assert_1.strictEqual)(shell, 'C:\\Windows\\Sysnative\\cmd.exe');
            });
            test('should use automationShell when specified', async () => {
                const shell1 = await (0, terminalEnvironment_1.getDefaultShell)(key => {
                    return {
                        'terminal.integrated.shell.windows': 'shell',
                        'terminal.integrated.automationShell.windows': undefined
                    }[key];
                }, 'DEFAULT', false, 'C:\\Windows', undefined, {}, false, 3 /* Platform.Windows */);
                (0, assert_1.strictEqual)(shell1, 'shell', 'automationShell was false');
                const shell2 = await (0, terminalEnvironment_1.getDefaultShell)(key => {
                    return {
                        'terminal.integrated.shell.windows': 'shell',
                        'terminal.integrated.automationShell.windows': undefined
                    }[key];
                }, 'DEFAULT', false, 'C:\\Windows', undefined, {}, true, 3 /* Platform.Windows */);
                (0, assert_1.strictEqual)(shell2, 'shell', 'automationShell was true');
                const shell3 = await (0, terminalEnvironment_1.getDefaultShell)(key => {
                    return {
                        'terminal.integrated.shell.windows': 'shell',
                        'terminal.integrated.automationShell.windows': 'automationShell'
                    }[key];
                }, 'DEFAULT', false, 'C:\\Windows', undefined, {}, true, 3 /* Platform.Windows */);
                (0, assert_1.strictEqual)(shell3, 'automationShell', 'automationShell was true and specified in settings');
            });
        });
    });
});
//# sourceMappingURL=terminalEnvironment.test.js.map