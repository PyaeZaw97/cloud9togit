/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/base/common/network", "vs/base/common/uri", "vs/platform/files/common/files", "vs/platform/files/common/fileService", "vs/platform/instantiation/test/common/instantiationServiceMock", "vs/platform/log/common/log", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/platform/terminal/common/capabilities/commandDetectionCapability", "vs/workbench/contrib/terminal/browser/links/terminalLinkOpeners", "vs/platform/terminal/common/capabilities/terminalCapabilityStore", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/test/common/workbenchTestServices", "xterm"], function (require, exports, assert_1, network_1, uri_1, files_1, fileService_1, instantiationServiceMock_1, log_1, quickInput_1, workspace_1, commandDetectionCapability_1, terminalLinkOpeners_1, terminalCapabilityStore_1, editorService_1, environmentService_1, workbenchTestServices_1, xterm_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class TestCommandDetectionCapability extends commandDetectionCapability_1.CommandDetectionCapability {
        setCommands(commands) {
            this._commands = commands;
        }
    }
    class TestFileService extends fileService_1.FileService {
        constructor() {
            super(...arguments);
            this._files = '*';
        }
        async stat(resource) {
            if (this._files === '*' || this._files.some(e => e.toString() === resource.toString())) {
                return { isFile: true, isDirectory: false, isSymbolicLink: false };
            }
            else {
                return { isFile: false, isDirectory: false, isSymbolicLink: false };
            }
        }
        setFiles(files) {
            this._files = files;
        }
    }
    suite('Workbench - TerminalLinkOpeners', () => {
        let instantiationService;
        let fileService;
        let activationResult;
        let xterm;
        setup(() => {
            instantiationService = new instantiationServiceMock_1.TestInstantiationService();
            fileService = new TestFileService(new log_1.NullLogService());
            instantiationService.set(files_1.IFileService, fileService);
            instantiationService.set(log_1.ILogService, new log_1.NullLogService());
            instantiationService.set(workspace_1.IWorkspaceContextService, new workbenchTestServices_1.TestContextService());
            instantiationService.stub(environmentService_1.IWorkbenchEnvironmentService, {
                remoteAuthority: undefined
            });
            // Allow intercepting link activations
            activationResult = undefined;
            instantiationService.stub(quickInput_1.IQuickInputService, {
                quickAccess: {
                    show(link) {
                        activationResult = { link, source: 'search' };
                    }
                }
            });
            instantiationService.stub(editorService_1.IEditorService, {
                async openEditor(editor) {
                    var _a;
                    activationResult = {
                        source: 'editor',
                        link: (_a = editor.resource) === null || _a === void 0 ? void 0 : _a.toString()
                    };
                }
            });
            // /*editorServiceSpy = */instantiationService.spy(IEditorService, 'openEditor');
            xterm = new xterm_1.Terminal();
        });
        suite('TerminalSearchLinkOpener', () => {
            let opener;
            let capabilities;
            let commandDetection;
            let localFileOpener;
            setup(() => {
                capabilities = new terminalCapabilityStore_1.TerminalCapabilityStore();
                commandDetection = instantiationService.createInstance(TestCommandDetectionCapability, xterm);
                capabilities.add(2 /* TerminalCapability.CommandDetection */, commandDetection);
            });
            suite('macOS/Linux', () => {
                setup(() => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener, 3 /* OperatingSystem.Linux */);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalSearchLinkOpener, capabilities, localFileOpener, localFolderOpener, 3 /* OperatingSystem.Linux */);
                });
                test('should apply the cwd to the link only when the file exists and cwdDetection is enabled', async () => {
                    const cwd = '/Users/home/folder';
                    const absoluteFile = '/Users/home/folder/file.txt';
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: absoluteFile })
                    ]);
                    // Set a fake detected command starting as line 0 to establish the cwd
                    commandDetection.setCommands([{
                            command: '',
                            cwd,
                            timestamp: 0,
                            getOutput() { return undefined; },
                            marker: {
                                line: 0
                            },
                            hasOutput: true
                        }]);
                    await opener.open({
                        text: 'file.txt',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: 3 /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///Users/home/folder/file.txt',
                        source: 'editor'
                    });
                    // Clear deteceted commands and ensure the same request results in a search
                    commandDetection.setCommands([]);
                    await opener.open({
                        text: 'file.txt',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: 3 /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file.txt',
                        source: 'search'
                    });
                });
            });
            suite('Windows', () => {
                setup(() => {
                    localFileOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener, 1 /* OperatingSystem.Windows */);
                    const localFolderOpener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
                    opener = instantiationService.createInstance(terminalLinkOpeners_1.TerminalSearchLinkOpener, capabilities, localFileOpener, localFolderOpener, 1 /* OperatingSystem.Windows */);
                });
                test('should apply the cwd to the link only when the file exists and cwdDetection is enabled', async () => {
                    const cwd = 'c:\\Users\\home\\folder';
                    const absoluteFile = 'c:\\Users\\home\\folder\\file.txt';
                    fileService.setFiles([
                        uri_1.URI.from({ scheme: network_1.Schemas.file, path: absoluteFile })
                    ]);
                    // Set a fake detected command starting as line 0 to establish the cwd
                    commandDetection.setCommands([{
                            command: '',
                            cwd,
                            timestamp: 0,
                            getOutput() { return undefined; },
                            marker: {
                                line: 0
                            },
                            hasOutput: true
                        }]);
                    await opener.open({
                        text: 'file.txt',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: 3 /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file:///c%3A%5CUsers%5Chome%5Cfolder%5Cfile.txt',
                        source: 'editor'
                    });
                    // Clear deteceted commands and ensure the same request results in a search
                    commandDetection.setCommands([]);
                    await opener.open({
                        text: 'file.txt',
                        bufferRange: { start: { x: 1, y: 1 }, end: { x: 8, y: 1 } },
                        type: 3 /* TerminalBuiltinLinkType.Search */
                    });
                    (0, assert_1.deepStrictEqual)(activationResult, {
                        link: 'file.txt',
                        source: 'search'
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=terminalLinkOpeners.test.js.map