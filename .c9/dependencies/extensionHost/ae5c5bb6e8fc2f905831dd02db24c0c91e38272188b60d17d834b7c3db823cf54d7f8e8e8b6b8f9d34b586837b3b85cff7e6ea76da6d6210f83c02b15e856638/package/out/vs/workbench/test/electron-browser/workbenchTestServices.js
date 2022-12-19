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
define(["require", "exports", "vs/workbench/test/browser/workbenchTestServices", "vs/base/common/event", "vs/workbench/services/textfile/electron-sandbox/nativeTextFileService", "vs/platform/native/electron-sandbox/native", "vs/platform/files/common/files", "vs/workbench/services/untitled/common/untitledTextEditorService", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/model", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/dialogs/common/dialogs", "vs/editor/common/services/textResourceConfiguration", "vs/platform/product/common/productService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/editor/common/services/resolverService", "vs/editor/browser/services/codeEditorService", "vs/base/common/uri", "vs/workbench/services/textfile/common/textfiles", "vs/editor/common/model/textModel", "vs/platform/environment/node/argv", "vs/platform/log/common/log", "vs/workbench/services/path/common/pathService", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/platform/workspace/common/workspace", "vs/workbench/services/workingCopy/common/workingCopyBackup", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/editor/common/editorService", "vs/workbench/test/common/workbenchTestServices", "vs/platform/uriIdentity/common/uriIdentity", "vs/editor/common/languages/language", "os", "vs/platform/environment/common/environment", "vs/workbench/services/environment/common/environmentService", "vs/platform/environment/node/userDataPath", "vs/platform/product/common/product", "vs/workbench/services/files/common/elevatedFileService", "vs/workbench/services/decorations/common/decorations", "vs/base/common/lifecycle"], function (require, exports, workbenchTestServices_1, event_1, nativeTextFileService_1, native_1, files_1, untitledTextEditorService_1, lifecycle_1, instantiation_1, model_1, environmentService_1, dialogs_1, textResourceConfiguration_1, productService_1, filesConfigurationService_1, resolverService_1, codeEditorService_1, uri_1, textfiles_1, textModel_1, argv_1, log_1, pathService_1, workingCopyFileService_1, workspace_1, workingCopyBackup_1, workingCopyService_1, editorService_1, workbenchTestServices_2, uriIdentity_1, language_1, os_1, environment_1, environmentService_2, userDataPath_1, product_1, elevatedFileService_1, decorations_1, lifecycle_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestNativePathService = exports.TestServiceAccessor = exports.workbenchInstantiationService = exports.TestNativeHostService = exports.TestSharedProcessService = exports.TestNativeTextFileServiceWithEncodingOverrides = exports.TestTextFileService = exports.TestEnvironmentService = exports.TestNativeWindowConfiguration = void 0;
    const args = (0, argv_1.parseArgs)(process.argv, argv_1.OPTIONS);
    exports.TestNativeWindowConfiguration = Object.assign({ windowId: 0, machineId: 'testMachineId', logLevel: log_1.LogLevel.Error, mainPid: 0, appRoot: '', userEnv: {}, execPath: process.execPath, perfMarks: [], colorScheme: { dark: true, highContrast: false }, os: { release: (0, os_1.release)(), hostname: (0, os_1.hostname)() }, product: product_1.default, homeDir: (0, os_1.homedir)(), tmpDir: (0, os_1.tmpdir)(), userDataDir: (0, userDataPath_1.getUserDataPath)(args) }, args);
    exports.TestEnvironmentService = new environmentService_1.NativeWorkbenchEnvironmentService(exports.TestNativeWindowConfiguration, workbenchTestServices_2.TestProductService);
    let TestTextFileService = class TestTextFileService extends nativeTextFileService_1.NativeTextFileService {
        constructor(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, productService, filesConfigurationService, textModelService, codeEditorService, pathService, workingCopyFileService, logService, uriIdentityService, languageService, elevatedFileService, decorationsService) {
            super(fileService, untitledTextEditorService, lifecycleService, instantiationService, modelService, environmentService, dialogService, fileDialogService, textResourceConfigurationService, filesConfigurationService, textModelService, codeEditorService, pathService, workingCopyFileService, uriIdentityService, languageService, elevatedFileService, logService, decorationsService);
        }
        setResolveTextContentErrorOnce(error) {
            this.resolveTextContentError = error;
        }
        async readStream(resource, options) {
            if (this.resolveTextContentError) {
                const error = this.resolveTextContentError;
                this.resolveTextContentError = null;
                throw error;
            }
            const content = await this.fileService.readFileStream(resource, options);
            return {
                resource: content.resource,
                name: content.name,
                mtime: content.mtime,
                ctime: content.ctime,
                etag: content.etag,
                encoding: 'utf8',
                value: await (0, textModel_1.createTextBufferFactoryFromStream)(content.value),
                size: 10,
                readonly: false
            };
        }
    };
    TestTextFileService = __decorate([
        __param(0, files_1.IFileService),
        __param(1, untitledTextEditorService_1.IUntitledTextEditorService),
        __param(2, lifecycle_1.ILifecycleService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, model_1.IModelService),
        __param(5, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(6, dialogs_1.IDialogService),
        __param(7, dialogs_1.IFileDialogService),
        __param(8, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(9, productService_1.IProductService),
        __param(10, filesConfigurationService_1.IFilesConfigurationService),
        __param(11, resolverService_1.ITextModelService),
        __param(12, codeEditorService_1.ICodeEditorService),
        __param(13, pathService_1.IPathService),
        __param(14, workingCopyFileService_1.IWorkingCopyFileService),
        __param(15, log_1.ILogService),
        __param(16, uriIdentity_1.IUriIdentityService),
        __param(17, language_1.ILanguageService),
        __param(18, elevatedFileService_1.IElevatedFileService),
        __param(19, decorations_1.IDecorationsService)
    ], TestTextFileService);
    exports.TestTextFileService = TestTextFileService;
    class TestNativeTextFileServiceWithEncodingOverrides extends nativeTextFileService_1.NativeTextFileService {
        get encoding() {
            if (!this._testEncoding) {
                this._testEncoding = this._register(this.instantiationService.createInstance(workbenchTestServices_1.TestEncodingOracle));
            }
            return this._testEncoding;
        }
    }
    exports.TestNativeTextFileServiceWithEncodingOverrides = TestNativeTextFileServiceWithEncodingOverrides;
    class TestSharedProcessService {
        getChannel(channelName) { return undefined; }
        registerChannel(channelName, channel) { }
        notifyRestored() { }
    }
    exports.TestSharedProcessService = TestSharedProcessService;
    class TestNativeHostService {
        constructor() {
            this.windowId = -1;
            this.onDidOpenWindow = event_1.Event.None;
            this.onDidMaximizeWindow = event_1.Event.None;
            this.onDidUnmaximizeWindow = event_1.Event.None;
            this.onDidFocusWindow = event_1.Event.None;
            this.onDidBlurWindow = event_1.Event.None;
            this.onDidResumeOS = event_1.Event.None;
            this.onDidChangeColorScheme = event_1.Event.None;
            this.onDidChangePassword = event_1.Event.None;
            this.onDidChangeDisplay = event_1.Event.None;
            this.windowCount = Promise.resolve(1);
        }
        getWindowCount() { return this.windowCount; }
        async getWindows() { return []; }
        async getActiveWindowId() { return undefined; }
        openWindow(arg1, arg2) {
            throw new Error('Method not implemented.');
        }
        async toggleFullScreen() { }
        async handleTitleDoubleClick() { }
        async isMaximized() { return true; }
        async maximizeWindow() { }
        async unmaximizeWindow() { }
        async minimizeWindow() { }
        async setMinimumSize(width, height) { }
        async saveWindowSplash(value) { }
        async focusWindow(options) { }
        async showMessageBox(options) { throw new Error('Method not implemented.'); }
        async showSaveDialog(options) { throw new Error('Method not implemented.'); }
        async showOpenDialog(options) { throw new Error('Method not implemented.'); }
        async pickFileFolderAndOpen(options) { }
        async pickFileAndOpen(options) { }
        async pickFolderAndOpen(options) { }
        async pickWorkspaceAndOpen(options) { }
        async showItemInFolder(path) { }
        async setRepresentedFilename(path) { }
        async isAdmin() { return false; }
        async writeElevated(source, target) { }
        async getOSProperties() { return Object.create(null); }
        async getOSStatistics() { return Object.create(null); }
        async getOSVirtualMachineHint() { return 0; }
        async getOSColorScheme() { return { dark: true, highContrast: false }; }
        async killProcess() { }
        async setDocumentEdited(edited) { }
        async openExternal(url) { return false; }
        async updateTouchBar() { }
        async moveItemToTrash() { }
        async newWindowTab() { }
        async showPreviousWindowTab() { }
        async showNextWindowTab() { }
        async moveWindowTabToNewWindow() { }
        async mergeAllWindowTabs() { }
        async toggleWindowTabsBar() { }
        async installShellCommand() { }
        async uninstallShellCommand() { }
        async notifyReady() { }
        async relaunch(options) { }
        async reload() { }
        async closeWindow() { }
        async closeWindowById() { }
        async quit() { }
        async exit(code) { }
        async openDevTools(options) { }
        async toggleDevTools() { }
        async toggleSharedProcessWindow() { }
        async resolveProxy(url) { return undefined; }
        async findFreePort(startPort, giveUpAfter, timeout, stride) { return -1; }
        async readClipboardText(type) { return ''; }
        async writeClipboardText(text, type) { }
        async readClipboardFindText() { return ''; }
        async writeClipboardFindText(text) { }
        async writeClipboardBuffer(format, buffer, type) { }
        async readClipboardBuffer(format) { return Uint8Array.from([]); }
        async hasClipboard(format, type) { return false; }
        async sendInputEvent(event) { }
        async windowsGetStringRegKey(hive, path, name) { return undefined; }
    }
    exports.TestNativeHostService = TestNativeHostService;
    function workbenchInstantiationService(disposables = new lifecycle_2.DisposableStore()) {
        const instantiationService = (0, workbenchTestServices_1.workbenchInstantiationService)({
            textFileService: insta => insta.createInstance(TestTextFileService),
            pathService: insta => insta.createInstance(TestNativePathService)
        }, disposables);
        instantiationService.stub(native_1.INativeHostService, new TestNativeHostService());
        instantiationService.stub(environment_1.IEnvironmentService, exports.TestEnvironmentService);
        instantiationService.stub(environment_1.INativeEnvironmentService, exports.TestEnvironmentService);
        instantiationService.stub(environmentService_2.IWorkbenchEnvironmentService, exports.TestEnvironmentService);
        instantiationService.stub(environmentService_1.INativeWorkbenchEnvironmentService, exports.TestEnvironmentService);
        return instantiationService;
    }
    exports.workbenchInstantiationService = workbenchInstantiationService;
    let TestServiceAccessor = class TestServiceAccessor {
        constructor(lifecycleService, textFileService, filesConfigurationService, contextService, modelService, fileService, nativeHostService, fileDialogService, workingCopyBackupService, workingCopyService, editorService) {
            this.lifecycleService = lifecycleService;
            this.textFileService = textFileService;
            this.filesConfigurationService = filesConfigurationService;
            this.contextService = contextService;
            this.modelService = modelService;
            this.fileService = fileService;
            this.nativeHostService = nativeHostService;
            this.fileDialogService = fileDialogService;
            this.workingCopyBackupService = workingCopyBackupService;
            this.workingCopyService = workingCopyService;
            this.editorService = editorService;
        }
    };
    TestServiceAccessor = __decorate([
        __param(0, lifecycle_1.ILifecycleService),
        __param(1, textfiles_1.ITextFileService),
        __param(2, filesConfigurationService_1.IFilesConfigurationService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, model_1.IModelService),
        __param(5, files_1.IFileService),
        __param(6, native_1.INativeHostService),
        __param(7, dialogs_1.IFileDialogService),
        __param(8, workingCopyBackup_1.IWorkingCopyBackupService),
        __param(9, workingCopyService_1.IWorkingCopyService),
        __param(10, editorService_1.IEditorService)
    ], TestServiceAccessor);
    exports.TestServiceAccessor = TestServiceAccessor;
    class TestNativePathService extends workbenchTestServices_1.TestPathService {
        constructor() {
            super(uri_1.URI.file((0, os_1.homedir)()));
        }
    }
    exports.TestNativePathService = TestNativePathService;
});
//# sourceMappingURL=workbenchTestServices.js.map