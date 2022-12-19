/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "assert", "vs/base/common/uri", "vs/workbench/test/browser/workbenchTestServices", "vs/platform/dialogs/common/dialogs", "vs/base/common/network", "vs/workbench/services/workspaces/browser/workspaceEditingService", "vs/platform/configuration/test/common/testConfigurationService", "vs/platform/configuration/common/configuration", "vs/workbench/services/path/common/pathService", "vs/workbench/services/dialogs/electron-sandbox/fileDialogService", "vs/workbench/services/environment/common/environmentService", "vs/base/test/common/mock", "vs/editor/common/languages/language", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/native/electron-sandbox/native", "vs/platform/opener/common/opener", "vs/platform/workspace/common/workspace", "vs/platform/workspaces/common/workspaces", "vs/workbench/services/history/common/history", "vs/workbench/services/host/browser/host", "vs/platform/commands/common/commands", "vs/editor/browser/services/codeEditorService", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle", "vs/platform/log/common/log"], function (require, exports, assert, uri_1, workbenchTestServices_1, dialogs_1, network_1, workspaceEditingService_1, testConfigurationService_1, configuration_1, pathService_1, fileDialogService_1, environmentService_1, mock_1, language_1, files_1, instantiation_1, label_1, native_1, opener_1, workspace_1, workspaces_1, history_1, host_1, commands_1, codeEditorService_1, editorService_1, lifecycle_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let TestFileDialogService = class TestFileDialogService extends fileDialogService_1.FileDialogService {
        constructor(simple, hostService, contextService, historyService, environmentService, instantiationService, configurationService, fileService, openerService, nativeHostService, dialogService, languageService, workspacesService, labelService, pathService, commandService, editorService, codeEditorService, logService) {
            super(hostService, contextService, historyService, environmentService, instantiationService, configurationService, fileService, openerService, nativeHostService, dialogService, languageService, workspacesService, labelService, pathService, commandService, editorService, codeEditorService, logService);
            this.simple = simple;
        }
        getSimpleFileDialog() {
            if (this.simple) {
                return this.simple;
            }
            else {
                return super.getSimpleFileDialog();
            }
        }
    };
    TestFileDialogService = __decorate([
        __param(1, host_1.IHostService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, history_1.IHistoryService),
        __param(4, environmentService_1.IWorkbenchEnvironmentService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, files_1.IFileService),
        __param(8, opener_1.IOpenerService),
        __param(9, native_1.INativeHostService),
        __param(10, dialogs_1.IDialogService),
        __param(11, language_1.ILanguageService),
        __param(12, workspaces_1.IWorkspacesService),
        __param(13, label_1.ILabelService),
        __param(14, pathService_1.IPathService),
        __param(15, commands_1.ICommandService),
        __param(16, editorService_1.IEditorService),
        __param(17, codeEditorService_1.ICodeEditorService),
        __param(18, log_1.ILogService)
    ], TestFileDialogService);
    suite('FileDialogService', function () {
        let disposables;
        let instantiationService;
        const testFile = uri_1.URI.file('/test/file');
        setup(async function () {
            disposables = new lifecycle_1.DisposableStore();
            instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)(undefined, disposables);
            const configurationService = new testConfigurationService_1.TestConfigurationService();
            await configurationService.setUserConfiguration('files', { simpleDialog: { enable: true } });
            instantiationService.stub(configuration_1.IConfigurationService, configurationService);
        });
        teardown(() => {
            disposables.dispose();
        });
        test('Local - open/save workspaces availableFilesystems', async function () {
            var _a;
            class TestSimpleFileDialog {
                async showOpenDialog(options) {
                    var _a;
                    assert.strictEqual((_a = options.availableFileSystems) === null || _a === void 0 ? void 0 : _a.length, 1);
                    assert.strictEqual(options.availableFileSystems[0], network_1.Schemas.file);
                    return testFile;
                }
                async showSaveDialog(options) {
                    var _a;
                    assert.strictEqual((_a = options.availableFileSystems) === null || _a === void 0 ? void 0 : _a.length, 1);
                    assert.strictEqual(options.availableFileSystems[0], network_1.Schemas.file);
                    return testFile;
                }
            }
            const dialogService = instantiationService.createInstance(TestFileDialogService, new TestSimpleFileDialog());
            instantiationService.set(dialogs_1.IFileDialogService, dialogService);
            const workspaceService = instantiationService.createInstance(workspaceEditingService_1.BrowserWorkspaceEditingService);
            assert.strictEqual((_a = (await workspaceService.pickNewWorkspacePath())) === null || _a === void 0 ? void 0 : _a.path.startsWith(testFile.path), true);
            assert.strictEqual(await dialogService.pickWorkspaceAndOpen({}), undefined);
        });
        test('Virtual - open/save workspaces availableFilesystems', async function () {
            var _a;
            class TestSimpleFileDialog {
                async showOpenDialog(options) {
                    var _a;
                    assert.strictEqual((_a = options.availableFileSystems) === null || _a === void 0 ? void 0 : _a.length, 1);
                    assert.strictEqual(options.availableFileSystems[0], network_1.Schemas.file);
                    return testFile;
                }
                async showSaveDialog(options) {
                    var _a;
                    assert.strictEqual((_a = options.availableFileSystems) === null || _a === void 0 ? void 0 : _a.length, 1);
                    assert.strictEqual(options.availableFileSystems[0], network_1.Schemas.file);
                    return testFile;
                }
            }
            instantiationService.stub(pathService_1.IPathService, new class {
                constructor() {
                    this.defaultUriScheme = 'vscode-virtual-test';
                    this.userHome = async () => uri_1.URI.file('/user/home');
                }
            });
            const dialogService = instantiationService.createInstance(TestFileDialogService, new TestSimpleFileDialog());
            instantiationService.set(dialogs_1.IFileDialogService, dialogService);
            const workspaceService = instantiationService.createInstance(workspaceEditingService_1.BrowserWorkspaceEditingService);
            assert.strictEqual((_a = (await workspaceService.pickNewWorkspacePath())) === null || _a === void 0 ? void 0 : _a.path.startsWith(testFile.path), true);
            assert.strictEqual(await dialogService.pickWorkspaceAndOpen({}), undefined);
        });
        test('Remote - open/save workspaces availableFilesystems', async function () {
            var _a;
            class TestSimpleFileDialog {
                async showOpenDialog(options) {
                    var _a;
                    assert.strictEqual((_a = options.availableFileSystems) === null || _a === void 0 ? void 0 : _a.length, 2);
                    assert.strictEqual(options.availableFileSystems[0], network_1.Schemas.vscodeRemote);
                    assert.strictEqual(options.availableFileSystems[1], network_1.Schemas.file);
                    return testFile;
                }
                async showSaveDialog(options) {
                    var _a;
                    assert.strictEqual((_a = options.availableFileSystems) === null || _a === void 0 ? void 0 : _a.length, 2);
                    assert.strictEqual(options.availableFileSystems[0], network_1.Schemas.vscodeRemote);
                    assert.strictEqual(options.availableFileSystems[1], network_1.Schemas.file);
                    return testFile;
                }
            }
            instantiationService.set(environmentService_1.IWorkbenchEnvironmentService, new class extends (0, mock_1.mock)() {
                get remoteAuthority() {
                    return 'testRemote';
                }
            });
            instantiationService.stub(pathService_1.IPathService, new class {
                constructor() {
                    this.defaultUriScheme = network_1.Schemas.vscodeRemote;
                    this.userHome = async () => uri_1.URI.file('/user/home');
                }
            });
            const dialogService = instantiationService.createInstance(TestFileDialogService, new TestSimpleFileDialog());
            instantiationService.set(dialogs_1.IFileDialogService, dialogService);
            const workspaceService = instantiationService.createInstance(workspaceEditingService_1.BrowserWorkspaceEditingService);
            assert.strictEqual((_a = (await workspaceService.pickNewWorkspacePath())) === null || _a === void 0 ? void 0 : _a.path.startsWith(testFile.path), true);
            assert.strictEqual(await dialogService.pickWorkspaceAndOpen({}), undefined);
        });
    });
});
//# sourceMappingURL=fileDialogService.test.js.map