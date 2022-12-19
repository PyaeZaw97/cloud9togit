/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/strings", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/terminal/browser/links/terminalLocalLinkDetector", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/contrib/terminal/test/browser/links/linkTestUtils", "xterm"], function (require, exports, strings_1, configuration_1, testConfigurationService_1, instantiationServiceMock_1, terminalLocalLinkDetector_1, terminalCapabilityStore_1, linkTestUtils_1, xterm_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const unixLinks = [
        '/foo',
        '~/foo',
        './foo',
        './$foo',
        '../foo',
        '/foo/bar',
        '/foo/bar+more',
        'foo/bar',
        'foo/bar+more',
    ];
    const windowsLinks = [
        'c:\\foo',
        '\\\\?\\c:\\foo',
        'c:/foo',
        '.\\foo',
        './foo',
        './$foo',
        '..\\foo',
        '~\\foo',
        '~/foo',
        'c:/foo/bar',
        'c:\\foo\\bar',
        'c:\\foo\\bar+more',
        'c:\\foo/bar\\baz',
        'foo/bar',
        'foo/bar',
        'foo\\bar',
        'foo\\bar+more',
    ];
    const supportedLinkFormats = [
        { urlFormat: '{0}' },
        { urlFormat: '{0} on line {1}', line: '5' },
        { urlFormat: '{0} on line {1}, column {2}', line: '5', column: '3' },
        { urlFormat: '{0}:line {1}', line: '5' },
        { urlFormat: '{0}:line {1}, column {2}', line: '5', column: '3' },
        { urlFormat: '{0}({1})', line: '5' },
        { urlFormat: '{0} ({1})', line: '5' },
        { urlFormat: '{0}({1},{2})', line: '5', column: '3' },
        { urlFormat: '{0} ({1},{2})', line: '5', column: '3' },
        { urlFormat: '{0}({1}, {2})', line: '5', column: '3' },
        { urlFormat: '{0} ({1}, {2})', line: '5', column: '3' },
        { urlFormat: '{0}:{1}', line: '5' },
        { urlFormat: '{0}:{1}:{2}', line: '5', column: '3' },
        { urlFormat: '{0}[{1}]', line: '5' },
        { urlFormat: '{0} [{1}]', line: '5' },
        { urlFormat: '{0}[{1},{2}]', line: '5', column: '3' },
        { urlFormat: '{0} [{1},{2}]', line: '5', column: '3' },
        { urlFormat: '{0}[{1}, {2}]', line: '5', column: '3' },
        { urlFormat: '{0} [{1}, {2}]', line: '5', column: '3' },
        { urlFormat: '{0}",{1}', line: '5' },
        { urlFormat: '{0}\',{1}', line: '5' }
    ];
    suite('Workbench - TerminalLocalLinkDetector', () => {
        let instantiationService;
        let configurationService;
        let detector;
        let xterm;
        async function assertLink(type, text, expected) {
            await (0, linkTestUtils_1.assertLinkHelper)(text, expected, detector, type);
        }
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            configurationService = new testConfigurationService_1.TestConfigurationService();
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            xterm = new xterm_1.Terminal({ cols: 80, rows: 30 });
        });
        suite('platform independent', () => {
            setup(() => {
                detector = instantiationService.createInstance(terminalLocalLinkDetector_1.TerminalLocalLinkDetector, xterm, new terminalCapabilityStore_1.TerminalCapabilityStore(), 3 /* OperatingSystem.Linux */, linkTestUtils_1.resolveLinkForTest);
            });
            test('should support multiple link results', async () => {
                await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, './foo ./bar', [
                    { range: [[1, 1], [5, 1]], text: './foo' },
                    { range: [[7, 1], [11, 1]], text: './bar' }
                ]);
            });
        });
        suite('macOS/Linux', () => {
            setup(() => {
                detector = instantiationService.createInstance(terminalLocalLinkDetector_1.TerminalLocalLinkDetector, xterm, new terminalCapabilityStore_1.TerminalCapabilityStore(), 3 /* OperatingSystem.Linux */, linkTestUtils_1.resolveLinkForTest);
            });
            for (const baseLink of unixLinks) {
                suite(`Link: ${baseLink}`, () => {
                    for (let i = 0; i < supportedLinkFormats.length; i++) {
                        const linkFormat = supportedLinkFormats[i];
                        test(`Format: ${linkFormat.urlFormat}`, async () => {
                            const formattedLink = (0, strings_1.format)(linkFormat.urlFormat, baseLink, linkFormat.line, linkFormat.column);
                            await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, formattedLink, [{ text: formattedLink, range: [[1, 1], [formattedLink.length, 1]] }]);
                            await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, ` ${formattedLink} `, [{ text: formattedLink, range: [[2, 1], [formattedLink.length + 1, 1]] }]);
                            await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, `(${formattedLink})`, [{ text: formattedLink, range: [[2, 1], [formattedLink.length + 1, 1]] }]);
                            await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, `[${formattedLink}]`, [{ text: formattedLink, range: [[2, 1], [formattedLink.length + 1, 1]] }]);
                        });
                    }
                });
            }
            test('Git diff links', async () => {
                await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, `diff --git a/foo/bar b/foo/bar`, [
                    { text: 'foo/bar', range: [[14, 1], [20, 1]] },
                    { text: 'foo/bar', range: [[24, 1], [30, 1]] }
                ]);
                await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, `--- a/foo/bar`, [{ text: 'foo/bar', range: [[7, 1], [13, 1]] }]);
                await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, `+++ b/foo/bar`, [{ text: 'foo/bar', range: [[7, 1], [13, 1]] }]);
            });
        });
        suite('Windows', () => {
            setup(() => {
                detector = instantiationService.createInstance(terminalLocalLinkDetector_1.TerminalLocalLinkDetector, xterm, new terminalCapabilityStore_1.TerminalCapabilityStore(), 1 /* OperatingSystem.Windows */, linkTestUtils_1.resolveLinkForTest);
            });
            for (const baseLink of windowsLinks) {
                suite(`Link "${baseLink}"`, () => {
                    for (let i = 0; i < supportedLinkFormats.length; i++) {
                        const linkFormat = supportedLinkFormats[i];
                        test(`Format: ${linkFormat.urlFormat}`, async () => {
                            const formattedLink = (0, strings_1.format)(linkFormat.urlFormat, baseLink, linkFormat.line, linkFormat.column);
                            await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, formattedLink, [{ text: formattedLink, range: [[1, 1], [formattedLink.length, 1]] }]);
                            await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, ` ${formattedLink} `, [{ text: formattedLink, range: [[2, 1], [formattedLink.length + 1, 1]] }]);
                            await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, `(${formattedLink})`, [{ text: formattedLink, range: [[2, 1], [formattedLink.length + 1, 1]] }]);
                            await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, `[${formattedLink}]`, [{ text: formattedLink, range: [[2, 1], [formattedLink.length + 1, 1]] }]);
                        });
                    }
                });
            }
            test('Git diff links', async () => {
                await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, `diff --git a/foo/bar b/foo/bar`, [
                    { text: 'foo/bar', range: [[14, 1], [20, 1]] },
                    { text: 'foo/bar', range: [[24, 1], [30, 1]] }
                ]);
                await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, `--- a/foo/bar`, [{ text: 'foo/bar', range: [[7, 1], [13, 1]] }]);
                await assertLink(0 /* TerminalBuiltinLinkType.LocalFile */, `+++ b/foo/bar`, [{ text: 'foo/bar', range: [[7, 1], [13, 1]] }]);
            });
        });
    });
});
//# sourceMappingURL=terminalLocalLinkDetector.test.js.map