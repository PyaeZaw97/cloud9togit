/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/arrays", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/contextview/browser/contextMenuService", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/workbench/common/views", "vs/workbench/contrib/terminal/browser/links/terminalLinkManager", "vs/workbench/contrib/terminal/test/browser/xterm/xtermTerminal.test", "vs/workbench/test/common/workbenchTestServices", "xterm"], function (require, exports, assert_1, arrays_1, configuration_1, testConfigurationService_1, contextMenuService_1, contextView_1, instantiationServiceMock_1, log_1, storage_1, themeService_1, testThemeService_1, views_1, terminalLinkManager_1, xtermTerminal_test_1, workbenchTestServices_1, xterm_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const defaultTerminalConfig = {
        fontFamily: 'monospace',
        fontWeight: 'normal',
        fontWeightBold: 'normal',
        gpuAcceleration: 'off',
        scrollback: 1000,
        fastScrollSensitivity: 2,
        mouseWheelScrollSensitivity: 1,
        unicodeVersion: '11'
    };
    class TestLinkManager extends terminalLinkManager_1.TerminalLinkManager {
        async _getLinksForType(y, type) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            switch (type) {
                case 'word':
                    return ((_b = (_a = this._links) === null || _a === void 0 ? void 0 : _a.wordLinks) === null || _b === void 0 ? void 0 : _b[y]) ? [(_d = (_c = this._links) === null || _c === void 0 ? void 0 : _c.wordLinks) === null || _d === void 0 ? void 0 : _d[y]] : undefined;
                case 'url':
                    return ((_f = (_e = this._links) === null || _e === void 0 ? void 0 : _e.webLinks) === null || _f === void 0 ? void 0 : _f[y]) ? [(_h = (_g = this._links) === null || _g === void 0 ? void 0 : _g.webLinks) === null || _h === void 0 ? void 0 : _h[y]] : undefined;
                case 'localFile':
                    return ((_k = (_j = this._links) === null || _j === void 0 ? void 0 : _j.fileLinks) === null || _k === void 0 ? void 0 : _k[y]) ? [(_m = (_l = this._links) === null || _l === void 0 ? void 0 : _l.fileLinks) === null || _m === void 0 ? void 0 : _m[y]] : undefined;
            }
        }
        setLinks(links) {
            this._links = links;
        }
    }
    suite('TerminalLinkManager', () => {
        let instantiationService;
        let configurationService;
        let themeService;
        let viewDescriptorService;
        let xterm;
        let linkManager;
        setup(() => {
            configurationService = new testConfigurationService_1.TestConfigurationService({
                editor: {
                    fastScrollSensitivity: 2,
                    mouseWheelScrollSensitivity: 1
                },
                terminal: {
                    integrated: defaultTerminalConfig
                }
            });
            themeService = new testThemeService_1.TestThemeService();
            viewDescriptorService = new xtermTerminal_test_1.TestViewDescriptorService();
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(contextView_1.IContextMenuService, instantiationService.createInstance(contextMenuService_1.ContextMenuService));
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            instantiationService.stub(storage_1.IStorageService, new workbenchTestServices_1.TestStorageService());
            instantiationService.stub(themeService_1.IThemeService, themeService);
            instantiationService.stub(views_1.IViewDescriptorService, viewDescriptorService);
            xterm = new xterm_1.Terminal({ cols: 80, rows: 30 });
            linkManager = instantiationService.createInstance(TestLinkManager, xterm, upcastPartial({}), {
                get(capability) {
                    return undefined;
                }
            });
        });
        suite('getLinks and open recent link', () => {
            test('should return no links', async () => {
                const links = await linkManager.getLinks();
                (0, arrays_1.equals)(links.webLinks, []);
                (0, arrays_1.equals)(links.wordLinks, []);
                (0, arrays_1.equals)(links.fileLinks, []);
                const webLink = await linkManager.openRecentLink('url');
                (0, assert_1.strictEqual)(webLink, undefined);
                const fileLink = await linkManager.openRecentLink('localFile');
                (0, assert_1.strictEqual)(fileLink, undefined);
            });
            test('should return word links in order', async () => {
                var _a, _b;
                const link1 = {
                    range: {
                        start: { x: 1, y: 1 }, end: { x: 14, y: 1 }
                    },
                    text: '1_我是学生.txt',
                    activate: () => Promise.resolve('')
                };
                const link2 = {
                    range: {
                        start: { x: 1, y: 1 }, end: { x: 14, y: 1 }
                    },
                    text: '2_我是学生.txt',
                    activate: () => Promise.resolve('')
                };
                linkManager.setLinks({ wordLinks: [link1, link2] });
                const links = await linkManager.getLinks();
                (0, assert_1.deepStrictEqual)((_a = links.wordLinks) === null || _a === void 0 ? void 0 : _a[0].text, link2.text);
                (0, assert_1.deepStrictEqual)((_b = links.wordLinks) === null || _b === void 0 ? void 0 : _b[1].text, link1.text);
                const webLink = await linkManager.openRecentLink('url');
                (0, assert_1.strictEqual)(webLink, undefined);
                const fileLink = await linkManager.openRecentLink('localFile');
                (0, assert_1.strictEqual)(fileLink, undefined);
            });
            test('should return web links in order', async () => {
                var _a, _b;
                const link1 = {
                    range: { start: { x: 5, y: 1 }, end: { x: 40, y: 1 } },
                    text: 'https://foo.bar/[this is foo site 1]',
                    activate: () => Promise.resolve('')
                };
                const link2 = {
                    range: { start: { x: 5, y: 2 }, end: { x: 40, y: 2 } },
                    text: 'https://foo.bar/[this is foo site 2]',
                    activate: () => Promise.resolve('')
                };
                linkManager.setLinks({ webLinks: [link1, link2] });
                const links = await linkManager.getLinks();
                (0, assert_1.deepStrictEqual)((_a = links.webLinks) === null || _a === void 0 ? void 0 : _a[0].text, link2.text);
                (0, assert_1.deepStrictEqual)((_b = links.webLinks) === null || _b === void 0 ? void 0 : _b[1].text, link1.text);
                const webLink = await linkManager.openRecentLink('url');
                (0, assert_1.strictEqual)(webLink, link2);
                const fileLink = await linkManager.openRecentLink('localFile');
                (0, assert_1.strictEqual)(fileLink, undefined);
            });
            test('should return file links in order', async () => {
                var _a, _b;
                const link1 = {
                    range: { start: { x: 1, y: 1 }, end: { x: 32, y: 1 } },
                    text: 'file:///C:/users/test/file_1.txt',
                    activate: () => Promise.resolve('')
                };
                const link2 = {
                    range: { start: { x: 1, y: 2 }, end: { x: 32, y: 2 } },
                    text: 'file:///C:/users/test/file_2.txt',
                    activate: () => Promise.resolve('')
                };
                linkManager.setLinks({ fileLinks: [link1, link2] });
                const links = await linkManager.getLinks();
                (0, assert_1.deepStrictEqual)((_a = links.fileLinks) === null || _a === void 0 ? void 0 : _a[0].text, link2.text);
                (0, assert_1.deepStrictEqual)((_b = links.fileLinks) === null || _b === void 0 ? void 0 : _b[1].text, link1.text);
                const webLink = await linkManager.openRecentLink('url');
                (0, assert_1.strictEqual)(webLink, undefined);
                linkManager.setLinks({ fileLinks: [link2] });
                const fileLink = await linkManager.openRecentLink('localFile');
                (0, assert_1.strictEqual)(fileLink, link2);
            });
        });
    });
    function upcastPartial(v) {
        return v;
    }
});
//# sourceMappingURL=terminalLinkManager.test.js.map