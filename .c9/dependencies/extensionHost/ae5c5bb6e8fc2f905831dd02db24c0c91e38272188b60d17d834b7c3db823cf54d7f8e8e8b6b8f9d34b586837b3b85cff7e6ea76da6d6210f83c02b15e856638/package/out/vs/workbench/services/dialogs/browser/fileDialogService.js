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
define(["require", "exports", "vs/platform/dialogs/common/dialogs", "vs/platform/instantiation/common/extensions", "vs/workbench/services/dialogs/browser/abstractFileDialogService", "vs/base/common/network", "vs/base/common/decorators", "vs/nls", "vs/base/common/mime", "vs/base/common/resources", "vs/base/browser/dom", "vs/base/common/severity", "vs/base/common/buffer", "vs/workbench/browser/dnd", "vs/base/common/iterator", "vs/platform/files/browser/webFileSystemAccess"], function (require, exports, dialogs_1, extensions_1, abstractFileDialogService_1, network_1, decorators_1, nls_1, mime_1, resources_1, dom_1, severity_1, buffer_1, dnd_1, iterator_1, webFileSystemAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FileDialogService = void 0;
    class FileDialogService extends abstractFileDialogService_1.AbstractFileDialogService {
        get fileSystemProvider() {
            return this.fileService.getProvider(network_1.Schemas.file);
        }
        async pickFileFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultFilePath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                return super.pickFileFolderAndOpenSimplified(schema, options, false);
            }
            throw new Error((0, nls_1.localize)('pickFolderAndOpen', "Can't open folders, try adding a folder to the workspace instead."));
        }
        addFileSchemaIfNeeded(schema, isFolder) {
            return (schema === network_1.Schemas.untitled) ? [network_1.Schemas.file]
                : (((schema !== network_1.Schemas.file) && (!isFolder || (schema !== network_1.Schemas.vscodeRemote))) ? [schema, network_1.Schemas.file] : [schema]);
        }
        async pickFileAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultFilePath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                return super.pickFileAndOpenSimplified(schema, options, false);
            }
            if (!webFileSystemAccess_1.WebFileSystemAccess.supported(window)) {
                return this.showUnsupportedBrowserWarning('open');
            }
            let fileHandle = undefined;
            try {
                ([fileHandle] = await window.showOpenFilePicker({ multiple: false }));
            }
            catch (error) {
                return; // `showOpenFilePicker` will throw an error when the user cancels
            }
            if (!webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(fileHandle)) {
                return;
            }
            const uri = await this.fileSystemProvider.registerFileHandle(fileHandle);
            this.addFileToRecentlyOpened(uri);
            await this.openerService.open(uri, { fromUserGesture: true, editorOptions: { pinned: true } });
        }
        async pickFolderAndOpen(options) {
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultFolderPath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                return super.pickFolderAndOpenSimplified(schema, options);
            }
            throw new Error((0, nls_1.localize)('pickFolderAndOpen', "Can't open folders, try adding a folder to the workspace instead."));
        }
        async pickWorkspaceAndOpen(options) {
            options.availableFileSystems = this.getWorkspaceAvailableFileSystems(options);
            const schema = this.getFileSystemSchema(options);
            if (!options.defaultUri) {
                options.defaultUri = await this.defaultWorkspacePath(schema);
            }
            if (this.shouldUseSimplified(schema)) {
                return super.pickWorkspaceAndOpenSimplified(schema, options);
            }
            throw new Error((0, nls_1.localize)('pickWorkspaceAndOpen', "Can't open workspaces, try adding a folder to the workspace instead."));
        }
        async pickFileToSave(defaultUri, availableFileSystems) {
            const schema = this.getFileSystemSchema({ defaultUri, availableFileSystems });
            const options = this.getPickFileToSaveDialogOptions(defaultUri, availableFileSystems);
            if (this.shouldUseSimplified(schema)) {
                return super.pickFileToSaveSimplified(schema, options);
            }
            if (!webFileSystemAccess_1.WebFileSystemAccess.supported(window)) {
                return this.showUnsupportedBrowserWarning('save');
            }
            let fileHandle = undefined;
            const startIn = iterator_1.Iterable.first(this.fileSystemProvider.directories);
            try {
                fileHandle = await window.showSaveFilePicker(Object.assign({ types: this.getFilePickerTypes(options.filters) }, { suggestedName: (0, resources_1.basename)(defaultUri), startIn }));
            }
            catch (error) {
                return; // `showSaveFilePicker` will throw an error when the user cancels
            }
            if (!webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(fileHandle)) {
                return undefined;
            }
            return this.fileSystemProvider.registerFileHandle(fileHandle);
        }
        getFilePickerTypes(filters) {
            return filters === null || filters === void 0 ? void 0 : filters.filter(filter => {
                return !((filter.extensions.length === 1) && ((filter.extensions[0] === '*') || filter.extensions[0] === ''));
            }).map(filter => {
                var _a;
                const accept = {};
                const extensions = filter.extensions.filter(ext => (ext.indexOf('-') < 0) && (ext.indexOf('*') < 0) && (ext.indexOf('_') < 0));
                accept[(_a = (0, mime_1.getMediaOrTextMime)(`fileName.${filter.extensions[0]}`)) !== null && _a !== void 0 ? _a : 'text/plain'] = extensions.map(ext => ext.startsWith('.') ? ext : `.${ext}`);
                return {
                    description: filter.name,
                    accept
                };
            });
        }
        async showSaveDialog(options) {
            const schema = this.getFileSystemSchema(options);
            if (this.shouldUseSimplified(schema)) {
                return super.showSaveDialogSimplified(schema, options);
            }
            if (!webFileSystemAccess_1.WebFileSystemAccess.supported(window)) {
                return this.showUnsupportedBrowserWarning('save');
            }
            let fileHandle = undefined;
            const startIn = iterator_1.Iterable.first(this.fileSystemProvider.directories);
            try {
                fileHandle = await window.showSaveFilePicker(Object.assign(Object.assign({ types: this.getFilePickerTypes(options.filters) }, options.defaultUri ? { suggestedName: (0, resources_1.basename)(options.defaultUri) } : undefined), { startIn }));
            }
            catch (error) {
                return undefined; // `showSaveFilePicker` will throw an error when the user cancels
            }
            if (!webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(fileHandle)) {
                return undefined;
            }
            return this.fileSystemProvider.registerFileHandle(fileHandle);
        }
        async showOpenDialog(options) {
            var _a;
            const schema = this.getFileSystemSchema(options);
            if (this.shouldUseSimplified(schema)) {
                return super.showOpenDialogSimplified(schema, options);
            }
            if (!webFileSystemAccess_1.WebFileSystemAccess.supported(window)) {
                return this.showUnsupportedBrowserWarning('open');
            }
            let uri;
            const startIn = (_a = iterator_1.Iterable.first(this.fileSystemProvider.directories)) !== null && _a !== void 0 ? _a : 'documents';
            try {
                if (options.canSelectFiles) {
                    const handle = await window.showOpenFilePicker(Object.assign({ multiple: false, types: this.getFilePickerTypes(options.filters) }, { startIn }));
                    if (handle.length === 1 && webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(handle[0])) {
                        uri = await this.fileSystemProvider.registerFileHandle(handle[0]);
                    }
                }
                else {
                    const handle = await window.showDirectoryPicker(Object.assign({ startIn }));
                    uri = await this.fileSystemProvider.registerDirectoryHandle(handle);
                }
            }
            catch (error) {
                // ignore - `showOpenFilePicker` / `showDirectoryPicker` will throw an error when the user cancels
            }
            return uri ? [uri] : undefined;
        }
        async showUnsupportedBrowserWarning(context) {
            var _a;
            // When saving, try to just download the contents
            // of the active text editor if any as a workaround
            if (context === 'save') {
                const activeTextModel = (_a = this.codeEditorService.getActiveCodeEditor()) === null || _a === void 0 ? void 0 : _a.getModel();
                if (activeTextModel) {
                    (0, dom_1.triggerDownload)(buffer_1.VSBuffer.fromString(activeTextModel.getValue()).buffer, (0, resources_1.basename)(activeTextModel.uri));
                    return;
                }
            }
            // Otherwise inform the user about options
            const buttons = context === 'open' ?
                [(0, nls_1.localize)('openRemote', "Open Remote..."), (0, nls_1.localize)('learnMore', "Learn More"), (0, nls_1.localize)('openFiles', "Open Files...")] :
                [(0, nls_1.localize)('openRemote', "Open Remote..."), (0, nls_1.localize)('learnMore', "Learn More")];
            const res = await this.dialogService.show(severity_1.default.Warning, (0, nls_1.localize)('unsupportedBrowserMessage', "Opening Local Folders is Unsupported"), buttons, {
                detail: (0, nls_1.localize)('unsupportedBrowserDetail', "Your browser doesn't support opening local folders.\nYou can either open single files or open a remote repository."),
                cancelId: -1 // no "Cancel" button offered
            });
            switch (res.choice) {
                case 0:
                    this.commandService.executeCommand('workbench.action.remote.showMenu');
                    break;
                case 1:
                    this.openerService.open('https://aka.ms/VSCodeWebLocalFileSystemAccess');
                    break;
                case 2:
                    {
                        const files = await (0, dom_1.triggerUpload)();
                        if (files) {
                            const filesData = (await this.instantiationService.invokeFunction(accessor => (0, dnd_1.extractFileListData)(accessor, files))).filter(fileData => !fileData.isDirectory);
                            if (filesData.length > 0) {
                                this.editorService.openEditors(filesData.map(fileData => {
                                    var _a;
                                    return {
                                        resource: fileData.resource,
                                        contents: (_a = fileData.contents) === null || _a === void 0 ? void 0 : _a.toString(),
                                        options: { pinned: true }
                                    };
                                }));
                            }
                        }
                    }
                    break;
            }
            return undefined;
        }
        shouldUseSimplified(scheme) {
            return ![network_1.Schemas.file, network_1.Schemas.vscodeUserData, network_1.Schemas.tmp].includes(scheme);
        }
    }
    __decorate([
        decorators_1.memoize
    ], FileDialogService.prototype, "fileSystemProvider", null);
    exports.FileDialogService = FileDialogService;
    (0, extensions_1.registerSingleton)(dialogs_1.IFileDialogService, FileDialogService, true);
});
//# sourceMappingURL=fileDialogService.js.map