/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/browser/terminalConfigHelper", "vs/workbench/contrib/terminal/browser/terminalProcessManager", "vs/platform/configuration/test/common/testConfigurationService", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/product/common/productService", "vs/workbench/contrib/terminal/common/environmentVariable", "vs/workbench/contrib/terminal/common/environmentVariableService", "vs/base/common/network", "vs/base/common/uri", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/lifecycle", "vs/base/common/event", "vs/workbench/test/common/workbenchTestServices"], function (require, exports, assert_1, configuration_1, terminalConfigHelper_1, terminalProcessManager_1, testConfigurationService_1, workbenchTestServices_1, productService_1, environmentVariable_1, environmentVariableService_1, network_1, uri_1, terminal_1, terminal_2, lifecycle_1, event_1, workbenchTestServices_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestTerminalChildProcess {
        constructor(shouldPersist) {
            this.shouldPersist = shouldPersist;
            this.id = 0;
            this.onDidChangeProperty = event_1.Event.None;
            this.onProcessData = event_1.Event.None;
            this.onProcessExit = event_1.Event.None;
            this.onProcessReady = event_1.Event.None;
            this.onProcessTitleChanged = event_1.Event.None;
            this.onProcessShellTypeChanged = event_1.Event.None;
        }
        get capabilities() { return []; }
        updateProperty(property, value) {
            throw new Error('Method not implemented.');
        }
        async start() { return undefined; }
        shutdown(immediate) { }
        input(data) { }
        resize(cols, rows) { }
        acknowledgeDataEvent(charCount) { }
        async setUnicodeVersion(version) { }
        async getInitialCwd() { return ''; }
        async getCwd() { return ''; }
        async getLatency() { return 0; }
        async processBinary(data) { }
        refreshProperty(property) { return Promise.resolve(''); }
    }
    class TestTerminalInstanceService {
        getBackend() {
            return {
                onPtyHostExit: event_1.Event.None,
                onPtyHostUnresponsive: event_1.Event.None,
                onPtyHostResponsive: event_1.Event.None,
                onPtyHostRestart: event_1.Event.None,
                onDidMoveWindowInstance: event_1.Event.None,
                onDidRequestDetach: event_1.Event.None,
                createProcess: (shellLaunchConfig, cwd, cols, rows, unicodeVersion, env, windowsEnableConpty, shouldPersist) => new TestTerminalChildProcess(shouldPersist)
            };
        }
    }
    suite('Workbench - TerminalProcessManager', () => {
        let disposables;
        let instantiationService;
        let manager;
        setup(async () => {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            await configurationService.setUserConfiguration('editor', { fontFamily: 'foo' });
            await configurationService.setUserConfiguration('terminal', {
                integrated: {
                    fontFamily: 'bar',
                    enablePersistentSessions: true,
                    shellIntegration: {
                        enabled: false
                    }
                }
            });
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(productService_1.IProductService, workbenchTestServices_2.TestProductService);
            instantiationService.stub(environmentVariable_1.IEnvironmentVariableService, instantiationService.createInstance(environmentVariableService_1.EnvironmentVariableService));
            instantiationService.stub(terminal_1.ITerminalProfileResolverService, workbenchTestServices_1.TestTerminalProfileResolverService);
            instantiationService.stub(terminal_2.ITerminalInstanceService, new TestTerminalInstanceService());
            const configHelper = instantiationService.createInstance(terminalConfigHelper_1.TerminalConfigHelper);
            manager = instantiationService.createInstance(terminalProcessManager_1.TerminalProcessManager, 1, configHelper, undefined);
        });
        teardown(() => {
            disposables.dispose();
        });
        suite('process persistence', () => {
            suite('local', () => {
                test('regular terminal should persist', async () => {
                    const p = await manager.createProcess({}, 1, 1, false);
                    (0, assert_1.strictEqual)(p, undefined);
                    (0, assert_1.strictEqual)(manager.shouldPersist, true);
                });
                test('task terminal should not persist', async () => {
                    const p = await manager.createProcess({
                        isFeatureTerminal: true
                    }, 1, 1, false);
                    (0, assert_1.strictEqual)(p, undefined);
                    (0, assert_1.strictEqual)(manager.shouldPersist, false);
                });
            });
            suite('remote', () => {
                const remoteCwd = uri_1.URI.from({
                    scheme: network_1.Schemas.vscodeRemote,
                    path: 'test/cwd'
                });
                test('regular terminal should persist', async () => {
                    const p = await manager.createProcess({
                        cwd: remoteCwd
                    }, 1, 1, false);
                    (0, assert_1.strictEqual)(p, undefined);
                    (0, assert_1.strictEqual)(manager.shouldPersist, true);
                });
                test('task terminal should not persist', async () => {
                    const p = await manager.createProcess({
                        isFeatureTerminal: true,
                        cwd: remoteCwd
                    }, 1, 1, false);
                    (0, assert_1.strictEqual)(p, undefined);
                    (0, assert_1.strictEqual)(manager.shouldPersist, false);
                });
            });
        });
    });
});
//# sourceMappingURL=terminalProcessManager.test.js.map