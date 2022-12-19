/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "xterm", "vs/workbench/contrib/terminal/browser/xterm/xtermTerminal", "vs/workbench/contrib/terminal/browser/terminalConfigHelper", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/workbench/contrib/terminal/common/terminal", "assert", "vs/platform/configuration/common/configuration", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/theme/test/common/testThemeService", "vs/platform/theme/common/themeService", "vs/workbench/common/views", "vs/base/common/event", "vs/workbench/contrib/terminal/common/terminalColorRegistry", "vs/workbench/common/theme", "vs/platform/log/common/log", "vs/platform/storage/common/storage", "vs/workbench/test/common/workbenchTestServices", "vs/base/browser/browser", "vs/platform/terminal/common/terminal", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/platform/contextview/browser/contextView", "vs/platform/contextview/browser/contextMenuService"], function (require, exports, xterm_1, xtermTerminal_1, terminalConfigHelper_1, instantiationServiceMock_1, terminal_1, assert_1, configuration_1, testConfigurationService_1, testThemeService_1, themeService_1, views_1, event_1, terminalColorRegistry_1, theme_1, log_1, storage_1, workbenchTestServices_1, browser_1, terminal_2, terminalCapabilityStore_1, contextView_1, contextMenuService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestViewDescriptorService = void 0;
    class TestWebglAddon {
        constructor() {
            this.onContextLoss = new event_1.Emitter().event;
        }
        activate() {
            TestWebglAddon.isEnabled = !TestWebglAddon.shouldThrow;
            if (TestWebglAddon.shouldThrow) {
                throw new Error('Test webgl set to throw');
            }
        }
        dispose() {
            TestWebglAddon.isEnabled = false;
        }
        clearTextureAtlas() { }
    }
    TestWebglAddon.shouldThrow = false;
    TestWebglAddon.isEnabled = false;
    class TestXtermTerminal extends xtermTerminal_1.XtermTerminal {
        constructor() {
            super(...arguments);
            this.webglAddonPromise = Promise.resolve(TestWebglAddon);
        }
        _getWebglAddonConstructor() {
            // Force synchronous to avoid async when activating the addon
            return this.webglAddonPromise;
        }
    }
    class TestViewDescriptorService {
        constructor() {
            this._location = 1 /* ViewContainerLocation.Panel */;
            this._onDidChangeLocation = new event_1.Emitter();
            this.onDidChangeLocation = this._onDidChangeLocation.event;
        }
        getViewLocationById(id) {
            return this._location;
        }
        moveTerminalToLocation(to) {
            const oldLocation = this._location;
            this._location = to;
            this._onDidChangeLocation.fire({
                views: [
                    { id: terminal_1.TERMINAL_VIEW_ID }
                ],
                from: oldLocation,
                to
            });
        }
    }
    exports.TestViewDescriptorService = TestViewDescriptorService;
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
    suite('XtermTerminal', () => {
        let instantiationService;
        let configurationService;
        let themeService;
        let viewDescriptorService;
        let xterm;
        let configHelper;
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
            viewDescriptorService = new TestViewDescriptorService();
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(log_1.ILogService, new log_1.NullLogService());
            instantiationService.stub(storage_1.IStorageService, new workbenchTestServices_1.TestStorageService());
            instantiationService.stub(themeService_1.IThemeService, themeService);
            instantiationService.stub(views_1.IViewDescriptorService, viewDescriptorService);
            instantiationService.stub(contextView_1.IContextMenuService, instantiationService.createInstance(contextMenuService_1.ContextMenuService));
            configHelper = instantiationService.createInstance(terminalConfigHelper_1.TerminalConfigHelper);
            xterm = instantiationService.createInstance(TestXtermTerminal, xterm_1.Terminal, configHelper, 80, 30, terminal_2.TerminalLocation.Panel, new terminalCapabilityStore_1.TerminalCapabilityStore());
            TestWebglAddon.shouldThrow = false;
            TestWebglAddon.isEnabled = false;
        });
        test('should use fallback dimensions of 80x30', () => {
            (0, assert_1.strictEqual)(xterm.raw.options.cols, 80);
            (0, assert_1.strictEqual)(xterm.raw.options.rows, 30);
        });
        suite('theme', () => {
            test('should apply correct background color based on the current view', () => {
                var _a, _b, _c, _d;
                themeService.setTheme(new testThemeService_1.TestColorTheme({
                    [theme_1.PANEL_BACKGROUND]: '#ff0000',
                    [theme_1.SIDE_BAR_BACKGROUND]: '#00ff00'
                }));
                xterm = instantiationService.createInstance(xtermTerminal_1.XtermTerminal, xterm_1.Terminal, configHelper, 80, 30, terminal_2.TerminalLocation.Panel, new terminalCapabilityStore_1.TerminalCapabilityStore());
                (0, assert_1.strictEqual)((_a = xterm.raw.options.theme) === null || _a === void 0 ? void 0 : _a.background, '#ff0000');
                viewDescriptorService.moveTerminalToLocation(0 /* ViewContainerLocation.Sidebar */);
                (0, assert_1.strictEqual)((_b = xterm.raw.options.theme) === null || _b === void 0 ? void 0 : _b.background, '#00ff00');
                viewDescriptorService.moveTerminalToLocation(1 /* ViewContainerLocation.Panel */);
                (0, assert_1.strictEqual)((_c = xterm.raw.options.theme) === null || _c === void 0 ? void 0 : _c.background, '#ff0000');
                viewDescriptorService.moveTerminalToLocation(2 /* ViewContainerLocation.AuxiliaryBar */);
                (0, assert_1.strictEqual)((_d = xterm.raw.options.theme) === null || _d === void 0 ? void 0 : _d.background, '#00ff00');
            });
            test('should react to and apply theme changes', () => {
                themeService.setTheme(new testThemeService_1.TestColorTheme({
                    [terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR]: '#000100',
                    [terminalColorRegistry_1.TERMINAL_FOREGROUND_COLOR]: '#000200',
                    [terminalColorRegistry_1.TERMINAL_CURSOR_FOREGROUND_COLOR]: '#000300',
                    [terminalColorRegistry_1.TERMINAL_CURSOR_BACKGROUND_COLOR]: '#000400',
                    [terminalColorRegistry_1.TERMINAL_SELECTION_BACKGROUND_COLOR]: '#000500',
                    'terminal.ansiBlack': '#010000',
                    'terminal.ansiRed': '#020000',
                    'terminal.ansiGreen': '#030000',
                    'terminal.ansiYellow': '#040000',
                    'terminal.ansiBlue': '#050000',
                    'terminal.ansiMagenta': '#060000',
                    'terminal.ansiCyan': '#070000',
                    'terminal.ansiWhite': '#080000',
                    'terminal.ansiBrightBlack': '#090000',
                    'terminal.ansiBrightRed': '#100000',
                    'terminal.ansiBrightGreen': '#110000',
                    'terminal.ansiBrightYellow': '#120000',
                    'terminal.ansiBrightBlue': '#130000',
                    'terminal.ansiBrightMagenta': '#140000',
                    'terminal.ansiBrightCyan': '#150000',
                    'terminal.ansiBrightWhite': '#160000',
                }));
                xterm = instantiationService.createInstance(xtermTerminal_1.XtermTerminal, xterm_1.Terminal, configHelper, 80, 30, terminal_2.TerminalLocation.Panel, new terminalCapabilityStore_1.TerminalCapabilityStore());
                (0, assert_1.deepStrictEqual)(xterm.raw.options.theme, {
                    background: '#000100',
                    foreground: '#000200',
                    cursor: '#000300',
                    cursorAccent: '#000400',
                    selection: '#000500',
                    black: '#010000',
                    green: '#030000',
                    red: '#020000',
                    yellow: '#040000',
                    blue: '#050000',
                    magenta: '#060000',
                    cyan: '#070000',
                    white: '#080000',
                    brightBlack: '#090000',
                    brightRed: '#100000',
                    brightGreen: '#110000',
                    brightYellow: '#120000',
                    brightBlue: '#130000',
                    brightMagenta: '#140000',
                    brightCyan: '#150000',
                    brightWhite: '#160000',
                });
                themeService.setTheme(new testThemeService_1.TestColorTheme({
                    [terminalColorRegistry_1.TERMINAL_BACKGROUND_COLOR]: '#00010f',
                    [terminalColorRegistry_1.TERMINAL_FOREGROUND_COLOR]: '#00020f',
                    [terminalColorRegistry_1.TERMINAL_CURSOR_FOREGROUND_COLOR]: '#00030f',
                    [terminalColorRegistry_1.TERMINAL_CURSOR_BACKGROUND_COLOR]: '#00040f',
                    [terminalColorRegistry_1.TERMINAL_SELECTION_BACKGROUND_COLOR]: '#00050f',
                    'terminal.ansiBlack': '#01000f',
                    'terminal.ansiRed': '#02000f',
                    'terminal.ansiGreen': '#03000f',
                    'terminal.ansiYellow': '#04000f',
                    'terminal.ansiBlue': '#05000f',
                    'terminal.ansiMagenta': '#06000f',
                    'terminal.ansiCyan': '#07000f',
                    'terminal.ansiWhite': '#08000f',
                    'terminal.ansiBrightBlack': '#09000f',
                    'terminal.ansiBrightRed': '#10000f',
                    'terminal.ansiBrightGreen': '#11000f',
                    'terminal.ansiBrightYellow': '#12000f',
                    'terminal.ansiBrightBlue': '#13000f',
                    'terminal.ansiBrightMagenta': '#14000f',
                    'terminal.ansiBrightCyan': '#15000f',
                    'terminal.ansiBrightWhite': '#16000f',
                }));
                (0, assert_1.deepStrictEqual)(xterm.raw.options.theme, {
                    background: '#00010f',
                    foreground: '#00020f',
                    cursor: '#00030f',
                    cursorAccent: '#00040f',
                    selection: '#00050f',
                    black: '#01000f',
                    green: '#03000f',
                    red: '#02000f',
                    yellow: '#04000f',
                    blue: '#05000f',
                    magenta: '#06000f',
                    cyan: '#07000f',
                    white: '#08000f',
                    brightBlack: '#09000f',
                    brightRed: '#10000f',
                    brightGreen: '#11000f',
                    brightYellow: '#12000f',
                    brightBlue: '#13000f',
                    brightMagenta: '#14000f',
                    brightCyan: '#15000f',
                    brightWhite: '#16000f',
                });
            });
        });
        suite('renderers', () => {
            test('should re-evaluate gpu acceleration auto when the setting is changed', async () => {
                // Check initial state
                (0, assert_1.strictEqual)(xterm.raw.options.rendererType, 'dom');
                (0, assert_1.strictEqual)(TestWebglAddon.isEnabled, false);
                // Open xterm as otherwise the webgl addon won't activate
                const container = document.createElement('div');
                xterm.raw.open(container);
                // Auto should activate the webgl addon
                await configurationService.setUserConfiguration('terminal', { integrated: Object.assign(Object.assign({}, defaultTerminalConfig), { gpuAcceleration: 'auto' }) });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true });
                await xterm.webglAddonPromise; // await addon activate
                if (browser_1.isSafari) {
                    (0, assert_1.strictEqual)(TestWebglAddon.isEnabled, false, 'The webgl renderer is always disabled on Safari');
                }
                else {
                    (0, assert_1.strictEqual)(TestWebglAddon.isEnabled, true);
                }
                // Turn off to reset state
                await configurationService.setUserConfiguration('terminal', { integrated: Object.assign(Object.assign({}, defaultTerminalConfig), { gpuAcceleration: 'off' }) });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true });
                await xterm.webglAddonPromise; // await addon activate
                (0, assert_1.strictEqual)(xterm.raw.options.rendererType, 'dom');
                (0, assert_1.strictEqual)(TestWebglAddon.isEnabled, false);
                // Set to auto again but throw when activating the webgl addon
                TestWebglAddon.shouldThrow = true;
                await configurationService.setUserConfiguration('terminal', { integrated: Object.assign(Object.assign({}, defaultTerminalConfig), { gpuAcceleration: 'auto' }) });
                configurationService.onDidChangeConfigurationEmitter.fire({ affectsConfiguration: () => true });
                await xterm.webglAddonPromise; // await addon activate
                (0, assert_1.strictEqual)(xterm.raw.options.rendererType, 'canvas');
                (0, assert_1.strictEqual)(TestWebglAddon.isEnabled, false);
            });
        });
    });
});
//# sourceMappingURL=xtermTerminal.test.js.map