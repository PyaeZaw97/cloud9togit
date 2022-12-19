/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/event", "vs/platform/terminal/common/terminal", "vs/workbench/contrib/terminal/browser/terminalService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/browser/contextKeyService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration", "vs/workbench/test/browser/workbenchTestServices", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/theme/common/themeService", "vs/platform/theme/test/common/testThemeService", "vs/workbench/contrib/terminal/common/terminal", "vs/workbench/services/editor/common/editorService", "vs/platform/dialogs/common/dialogs", "vs/platform/dialogs/test/common/testDialogService", "vs/workbench/services/remote/common/remoteAgentService"], function (require, exports, assert_1, event_1, terminal_1, terminalService_1, instantiationServiceMock_1, contextkey_1, contextKeyService_1, testConfigurationService_1, configuration_1, workbenchTestServices_1, terminal_2, lifecycle_1, themeService_1, testThemeService_1, terminal_3, editorService_1, dialogs_1, testDialogService_1, remoteAgentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Workbench - TerminalService', () => {
        let instantiationService;
        let terminalService;
        let configurationService;
        let dialogService;
        setup(async () => {
            dialogService = new testDialogService_1.TestDialogService();
            configurationService = new testConfigurationService_1.TestConfigurationService({
                terminal: {
                    integrated: {
                        fontWeight: 'normal'
                    }
                }
            });
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
            instantiationService.stub(contextkey_1.IContextKeyService, instantiationService.createInstance(contextKeyService_1.ContextKeyService));
            instantiationService.stub(lifecycle_1.ILifecycleService, new workbenchTestServices_1.TestLifecycleService());
            instantiationService.stub(themeService_1.IThemeService, new testThemeService_1.TestThemeService());
            instantiationService.stub(editorService_1.IEditorService, new workbenchTestServices_1.TestEditorService());
            instantiationService.stub(terminal_2.ITerminalEditorService, new workbenchTestServices_1.TestTerminalEditorService());
            instantiationService.stub(terminal_2.ITerminalGroupService, new workbenchTestServices_1.TestTerminalGroupService());
            instantiationService.stub(terminal_2.ITerminalInstanceService, new workbenchTestServices_1.TestTerminalInstanceService());
            instantiationService.stub(terminal_3.ITerminalProfileService, new workbenchTestServices_1.TestTerminalProfileService());
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, new workbenchTestServices_1.TestRemoteAgentService());
            instantiationService.stub(remoteAgentService_1.IRemoteAgentService, 'getConnection', null);
            instantiationService.stub(dialogs_1.IDialogService, dialogService);
            terminalService = instantiationService.createInstance(terminalService_1.TerminalService);
            instantiationService.stub(terminal_2.ITerminalService, terminalService);
        });
        suite('safeDisposeTerminal', () => {
            let onExitEmitter;
            setup(() => {
                onExitEmitter = new event_1.Emitter();
            });
            test('should not show prompt when confirmOnKill is never', async () => {
                setConfirmOnKill(configurationService, 'never');
                await new Promise(r => {
                    terminalService.safeDisposeTerminal({
                        target: terminal_1.TerminalLocation.Editor,
                        hasChildProcesses: true,
                        onExit: onExitEmitter.event,
                        dispose: () => r()
                    });
                });
                await new Promise(r => {
                    terminalService.safeDisposeTerminal({
                        target: terminal_1.TerminalLocation.Panel,
                        hasChildProcesses: true,
                        onExit: onExitEmitter.event,
                        dispose: () => r()
                    });
                });
            });
            test('should not show prompt when any terminal editor is closed (handled by editor itself)', async () => {
                setConfirmOnKill(configurationService, 'editor');
                await new Promise(r => {
                    terminalService.safeDisposeTerminal({
                        target: terminal_1.TerminalLocation.Editor,
                        hasChildProcesses: true,
                        onExit: onExitEmitter.event,
                        dispose: () => r()
                    });
                });
                setConfirmOnKill(configurationService, 'always');
                await new Promise(r => {
                    terminalService.safeDisposeTerminal({
                        target: terminal_1.TerminalLocation.Editor,
                        hasChildProcesses: true,
                        onExit: onExitEmitter.event,
                        dispose: () => r()
                    });
                });
            });
            test('should not show prompt when confirmOnKill is editor and panel terminal is closed', async () => {
                setConfirmOnKill(configurationService, 'editor');
                await new Promise(r => {
                    terminalService.safeDisposeTerminal({
                        target: terminal_1.TerminalLocation.Panel,
                        hasChildProcesses: true,
                        onExit: onExitEmitter.event,
                        dispose: () => r()
                    });
                });
            });
            test('should show prompt when confirmOnKill is panel and panel terminal is closed', async () => {
                setConfirmOnKill(configurationService, 'panel');
                // No child process cases
                dialogService.setConfirmResult({ confirmed: false });
                await new Promise(r => {
                    terminalService.safeDisposeTerminal({
                        target: terminal_1.TerminalLocation.Panel,
                        hasChildProcesses: false,
                        onExit: onExitEmitter.event,
                        dispose: () => r()
                    });
                });
                dialogService.setConfirmResult({ confirmed: true });
                await new Promise(r => {
                    terminalService.safeDisposeTerminal({
                        target: terminal_1.TerminalLocation.Panel,
                        hasChildProcesses: false,
                        onExit: onExitEmitter.event,
                        dispose: () => r()
                    });
                });
                // Child process cases
                dialogService.setConfirmResult({ confirmed: false });
                await terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Panel,
                    hasChildProcesses: true,
                    dispose: () => (0, assert_1.fail)()
                });
                dialogService.setConfirmResult({ confirmed: true });
                await new Promise(r => {
                    terminalService.safeDisposeTerminal({
                        target: terminal_1.TerminalLocation.Panel,
                        hasChildProcesses: true,
                        onExit: onExitEmitter.event,
                        dispose: () => r()
                    });
                });
            });
            test('should show prompt when confirmOnKill is always and panel terminal is closed', async () => {
                setConfirmOnKill(configurationService, 'always');
                // No child process cases
                dialogService.setConfirmResult({ confirmed: false });
                await new Promise(r => {
                    terminalService.safeDisposeTerminal({
                        target: terminal_1.TerminalLocation.Panel,
                        hasChildProcesses: false,
                        onExit: onExitEmitter.event,
                        dispose: () => r()
                    });
                });
                dialogService.setConfirmResult({ confirmed: true });
                await new Promise(r => {
                    terminalService.safeDisposeTerminal({
                        target: terminal_1.TerminalLocation.Panel,
                        hasChildProcesses: false,
                        onExit: onExitEmitter.event,
                        dispose: () => r()
                    });
                });
                // Child process cases
                dialogService.setConfirmResult({ confirmed: false });
                await terminalService.safeDisposeTerminal({
                    target: terminal_1.TerminalLocation.Panel,
                    hasChildProcesses: true,
                    dispose: () => (0, assert_1.fail)()
                });
                dialogService.setConfirmResult({ confirmed: true });
                await new Promise(r => {
                    terminalService.safeDisposeTerminal({
                        target: terminal_1.TerminalLocation.Panel,
                        hasChildProcesses: true,
                        onExit: onExitEmitter.event,
                        dispose: () => r()
                    });
                });
            });
        });
    });
    async function setConfirmOnKill(configurationService, value) {
        await configurationService.setUserConfiguration('terminal', { integrated: { confirmOnKill: value } });
        configurationService.onDidChangeConfigurationEmitter.fire({
            affectsConfiguration: () => true,
            affectedKeys: ['terminal.integrated.confirmOnKill']
        });
    }
});
//# sourceMappingURL=terminalService.test.js.map