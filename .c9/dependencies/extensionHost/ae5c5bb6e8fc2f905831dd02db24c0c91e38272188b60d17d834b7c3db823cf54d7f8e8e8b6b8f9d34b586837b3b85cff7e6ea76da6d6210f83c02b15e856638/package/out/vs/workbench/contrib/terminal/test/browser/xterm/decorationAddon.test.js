/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/workbench/contrib/terminal/browser/xterm/decorationAddon", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/platform/configuration/test/common/testConfigurationService", "xterm", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/platform/contextview/browser/contextView", "vs/platform/contextview/browser/contextMenuService", "vs/platform/theme/test/common/testThemeService", "vs/platform/theme/common/themeService"], function (require, exports, assert_1, configuration_1, instantiationServiceMock_1, log_1, decorationAddon_1, terminalCapabilityStore_1, testConfigurationService_1, xterm_1, commandDetectionCapability_1, contextView_1, contextMenuService_1, testThemeService_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTerminal extends xterm_1.Terminal {
        registerDecoration(decorationOptions) {
            if (decorationOptions.marker.isDisposed) {
                return undefined;
            }
            const element = document.createElement('div');
            return { marker: decorationOptions.marker, element, onDispose: () => { }, isDisposed: false, dispose: () => { }, onRender: (element) => { return element; } };
        }
    }
    suite('DecorationAddon', () => {
        let decorationAddon;
        let xterm;
        setup(() => {
            const instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            const configurationService = new testConfigurationService_1.TestConfigurationService({
                workbench: {
                    hover: { delay: 5 }
                }
            });
            instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
            xterm = new TestTerminal({
                cols: 80,
                rows: 30
            });
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(contextView_1.IContextMenuService, instantiationService.createInstance(contextMenuService_1.ContextMenuService));
            const capabilities = new terminalCapabilityStore_1.TerminalCapabilityStore();
            capabilities.add(2 /* TerminalCapability.CommandDetection */, new commandDetectionCapability_1.CommandDetectionCapability(xterm, new log_1.NullLogService()));
            decorationAddon = instantiationService.createInstance(decorationAddon_1.DecorationAddon, capabilities);
            xterm.loadAddon(decorationAddon);
            instantiationService.stub(log_1.ILogService, log_1.NullLogService);
        });
        suite('registerDecoration', async () => {
            test('should throw when command has no marker', async () => {
                (0, assert_1.throws)(() => decorationAddon.registerCommandDecoration({ command: 'cd src', timestamp: Date.now(), hasOutput: false }));
            });
            test('should return undefined when marker has been disposed of', async () => {
                const marker = xterm.registerMarker(1);
                marker === null || marker === void 0 ? void 0 : marker.dispose();
                (0, assert_1.strictEqual)(decorationAddon.registerCommandDecoration({ command: 'cd src', marker, timestamp: Date.now(), hasOutput: false }), undefined);
            });
            test('should return undefined when command is just empty chars', async () => {
                const marker = xterm.registerMarker(1);
                marker === null || marker === void 0 ? void 0 : marker.dispose();
                (0, assert_1.strictEqual)(decorationAddon.registerCommandDecoration({ command: ' ', marker, timestamp: Date.now(), hasOutput: false }), undefined);
            });
            test('should return decoration when marker has not been disposed of', async () => {
                const marker = xterm.registerMarker(2);
                (0, assert_1.notEqual)(decorationAddon.registerCommandDecoration({ command: 'cd src', marker, timestamp: Date.now(), hasOutput: false }), undefined);
            });
        });
    });
});
//# sourceMappingURL=decorationAddon.test.js.map