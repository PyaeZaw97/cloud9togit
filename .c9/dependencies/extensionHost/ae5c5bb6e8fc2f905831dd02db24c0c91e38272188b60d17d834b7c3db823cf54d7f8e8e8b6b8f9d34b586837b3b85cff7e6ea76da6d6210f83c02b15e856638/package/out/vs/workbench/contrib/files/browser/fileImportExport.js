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
define(["require", "exports", "vs/nls", "vs/base/common/cancellation", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/workbench/contrib/files/browser/files", "vs/workbench/contrib/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/base/common/async", "vs/base/common/buffer", "vs/base/common/resources", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/files/common/explorerModel", "vs/workbench/services/host/browser/host", "vs/platform/workspace/common/workspace", "vs/workbench/browser/dnd", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/base/common/platform", "vs/base/browser/dom", "vs/platform/log/common/log", "vs/base/common/network", "vs/base/common/labels", "vs/base/common/stream", "vs/base/common/lifecycle", "vs/base/common/functional", "vs/base/common/arrays", "vs/base/common/errors", "vs/platform/configuration/common/configuration", "vs/platform/files/browser/webFileSystemAccess", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls_1, cancellation_1, dialogs_1, files_1, notification_1, progress_1, files_2, files_3, editorService_1, async_1, buffer_1, resources_1, bulkEditService_1, explorerModel_1, host_1, workspace_1, dnd_1, workspaceEditing_1, platform_1, dom_1, log_1, network_1, labels_1, stream_1, lifecycle_1, functional_1, arrays_1, errors_1, configuration_1, webFileSystemAccess_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getMultipleFilesOverwriteConfirm = exports.getFileOverwriteConfirm = exports.FileDownload = exports.ExternalFileImport = exports.BrowserFileUpload = void 0;
    let BrowserFileUpload = class BrowserFileUpload {
        constructor(progressService, dialogService, explorerService, editorService, fileService) {
            this.progressService = progressService;
            this.dialogService = dialogService;
            this.explorerService = explorerService;
            this.editorService = editorService;
            this.fileService = fileService;
        }
        upload(target, source) {
            const cts = new cancellation_1.CancellationTokenSource();
            // Indicate progress globally
            const uploadPromise = this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                delay: 800,
                cancellable: true,
                title: (0, nls_1.localize)('uploadingFiles', "Uploading")
            }, async (progress) => this.doUpload(target, this.toTransfer(source), progress, cts.token), () => cts.dispose(true));
            // Also indicate progress in the files view
            this.progressService.withProgress({ location: files_3.VIEW_ID, delay: 500 }, () => uploadPromise);
            return uploadPromise;
        }
        toTransfer(source) {
            if (source instanceof DragEvent) {
                return source.dataTransfer;
            }
            const transfer = { items: [] };
            // We want to reuse the same code for uploading from
            // Drag & Drop as well as input element based upload
            // so we convert into webkit data transfer when the
            // input element approach is used (simplified).
            for (const file of source) {
                transfer.items.push({
                    webkitGetAsEntry: () => {
                        return {
                            name: file.name,
                            isDirectory: false,
                            isFile: true,
                            createReader: () => { throw new Error('Unsupported for files'); },
                            file: resolve => resolve(file)
                        };
                    }
                });
            }
            return transfer;
        }
        async doUpload(target, source, progress, token) {
            const items = source.items;
            // Somehow the items thing is being modified at random, maybe as a security
            // measure since this is a DND operation. As such, we copy the items into
            // an array we own as early as possible before using it.
            const entries = [];
            for (const item of items) {
                entries.push(item.webkitGetAsEntry());
            }
            const results = [];
            const operation = {
                startTime: Date.now(),
                progressScheduler: new async_1.RunOnceWorker(steps => { progress.report(steps[steps.length - 1]); }, 1000),
                filesTotal: entries.length,
                filesUploaded: 0,
                totalBytesUploaded: 0
            };
            // Upload all entries in parallel up to a
            // certain maximum leveraging the `Limiter`
            const uploadLimiter = new async_1.Limiter(BrowserFileUpload.MAX_PARALLEL_UPLOADS);
            await async_1.Promises.settled(entries.map(entry => {
                return uploadLimiter.queue(async () => {
                    var _a;
                    if (token.isCancellationRequested) {
                        return;
                    }
                    // Confirm overwrite as needed
                    if (target && entry.name && target.getChild(entry.name)) {
                        const { confirmed } = await this.dialogService.confirm(getFileOverwriteConfirm(entry.name));
                        if (!confirmed) {
                            return;
                        }
                        await this.explorerService.applyBulkEdit([new bulkEditService_1.ResourceFileEdit((0, resources_1.joinPath)(target.resource, entry.name), undefined, { recursive: true, folder: (_a = target.getChild(entry.name)) === null || _a === void 0 ? void 0 : _a.isDirectory })], {
                            undoLabel: (0, nls_1.localize)('overwrite', "Overwrite {0}", entry.name),
                            progressLabel: (0, nls_1.localize)('overwriting', "Overwriting {0}", entry.name),
                        });
                        if (token.isCancellationRequested) {
                            return;
                        }
                    }
                    // Upload entry
                    const result = await this.doUploadEntry(entry, target.resource, target, progress, operation, token);
                    if (result) {
                        results.push(result);
                    }
                });
            }));
            operation.progressScheduler.dispose();
            // Open uploaded file in editor only if we upload just one
            const firstUploadedFile = results[0];
            if (!token.isCancellationRequested && (firstUploadedFile === null || firstUploadedFile === void 0 ? void 0 : firstUploadedFile.isFile)) {
                await this.editorService.openEditor({ resource: firstUploadedFile.resource, options: { pinned: true } });
            }
        }
        async doUploadEntry(entry, parentResource, target, progress, operation, token) {
            if (token.isCancellationRequested || !entry.name || (!entry.isFile && !entry.isDirectory)) {
                return undefined;
            }
            // Report progress
            let fileBytesUploaded = 0;
            const reportProgress = (fileSize, bytesUploaded) => {
                fileBytesUploaded += bytesUploaded;
                operation.totalBytesUploaded += bytesUploaded;
                const bytesUploadedPerSecond = operation.totalBytesUploaded / ((Date.now() - operation.startTime) / 1000);
                // Small file
                let message;
                if (fileSize < files_1.ByteSize.MB) {
                    if (operation.filesTotal === 1) {
                        message = `${entry.name}`;
                    }
                    else {
                        message = (0, nls_1.localize)('uploadProgressSmallMany', "{0} of {1} files ({2}/s)", operation.filesUploaded, operation.filesTotal, files_1.ByteSize.formatSize(bytesUploadedPerSecond));
                    }
                }
                // Large file
                else {
                    message = (0, nls_1.localize)('uploadProgressLarge', "{0} ({1} of {2}, {3}/s)", entry.name, files_1.ByteSize.formatSize(fileBytesUploaded), files_1.ByteSize.formatSize(fileSize), files_1.ByteSize.formatSize(bytesUploadedPerSecond));
                }
                // Report progress but limit to update only once per second
                operation.progressScheduler.work({ message });
            };
            operation.filesUploaded++;
            reportProgress(0, 0);
            // Handle file upload
            const resource = (0, resources_1.joinPath)(parentResource, entry.name);
            if (entry.isFile) {
                const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
                if (token.isCancellationRequested) {
                    return undefined;
                }
                // Chrome/Edge/Firefox support stream method, but only use it for
                // larger files to reduce the overhead of the streaming approach
                if (typeof file.stream === 'function' && file.size > files_1.ByteSize.MB) {
                    await this.doUploadFileBuffered(resource, file, reportProgress, token);
                }
                // Fallback to unbuffered upload for other browsers or small files
                else {
                    await this.doUploadFileUnbuffered(resource, file, reportProgress);
                }
                return { isFile: true, resource };
            }
            // Handle folder upload
            else {
                // Create target folder
                await this.fileService.createFolder(resource);
                if (token.isCancellationRequested) {
                    return undefined;
                }
                // Recursive upload files in this directory
                const dirReader = entry.createReader();
                const childEntries = [];
                let done = false;
                do {
                    const childEntriesChunk = await new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
                    if (childEntriesChunk.length > 0) {
                        childEntries.push(...childEntriesChunk);
                    }
                    else {
                        done = true; // an empty array is a signal that all entries have been read
                    }
                } while (!done && !token.isCancellationRequested);
                // Update operation total based on new counts
                operation.filesTotal += childEntries.length;
                // Split up files from folders to upload
                const folderTarget = target && target.getChild(entry.name) || undefined;
                const fileChildEntries = [];
                const folderChildEntries = [];
                for (const childEntry of childEntries) {
                    if (childEntry.isFile) {
                        fileChildEntries.push(childEntry);
                    }
                    else if (childEntry.isDirectory) {
                        folderChildEntries.push(childEntry);
                    }
                }
                // Upload files (up to `MAX_PARALLEL_UPLOADS` in parallel)
                const fileUploadQueue = new async_1.Limiter(BrowserFileUpload.MAX_PARALLEL_UPLOADS);
                await async_1.Promises.settled(fileChildEntries.map(fileChildEntry => {
                    return fileUploadQueue.queue(() => this.doUploadEntry(fileChildEntry, resource, folderTarget, progress, operation, token));
                }));
                // Upload folders (sequentially give we don't know their sizes)
                for (const folderChildEntry of folderChildEntries) {
                    await this.doUploadEntry(folderChildEntry, resource, folderTarget, progress, operation, token);
                }
                return { isFile: false, resource };
            }
        }
        async doUploadFileBuffered(resource, file, progressReporter, token) {
            const writeableStream = (0, buffer_1.newWriteableBufferStream)({
                // Set a highWaterMark to prevent the stream
                // for file upload to produce large buffers
                // in-memory
                highWaterMark: 10
            });
            const writeFilePromise = this.fileService.writeFile(resource, writeableStream);
            // Read the file in chunks using File.stream() web APIs
            try {
                // TODO@electron: duplicate type definitions originate from `@types/node/stream/consumers.d.ts`
                const reader = file.stream().getReader();
                let res = await reader.read();
                while (!res.done) {
                    if (token.isCancellationRequested) {
                        break;
                    }
                    // Write buffer into stream but make sure to wait
                    // in case the `highWaterMark` is reached
                    const buffer = buffer_1.VSBuffer.wrap(res.value);
                    await writeableStream.write(buffer);
                    if (token.isCancellationRequested) {
                        break;
                    }
                    // Report progress
                    progressReporter(file.size, buffer.byteLength);
                    res = await reader.read();
                }
                writeableStream.end(undefined);
            }
            catch (error) {
                writeableStream.error(error);
                writeableStream.end();
            }
            if (token.isCancellationRequested) {
                return undefined;
            }
            // Wait for file being written to target
            await writeFilePromise;
        }
        doUploadFileUnbuffered(resource, file, progressReporter) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    var _a;
                    try {
                        if (((_a = event.target) === null || _a === void 0 ? void 0 : _a.result) instanceof ArrayBuffer) {
                            const buffer = buffer_1.VSBuffer.wrap(new Uint8Array(event.target.result));
                            await this.fileService.writeFile(resource, buffer);
                            // Report progress
                            progressReporter(file.size, buffer.byteLength);
                        }
                        else {
                            throw new Error('Could not read from dropped file.');
                        }
                        resolve();
                    }
                    catch (error) {
                        reject(error);
                    }
                };
                // Start reading the file to trigger `onload`
                reader.readAsArrayBuffer(file);
            });
        }
    };
    BrowserFileUpload.MAX_PARALLEL_UPLOADS = 20;
    BrowserFileUpload = __decorate([
        __param(0, progress_1.IProgressService),
        __param(1, dialogs_1.IDialogService),
        __param(2, files_2.IExplorerService),
        __param(3, editorService_1.IEditorService),
        __param(4, files_1.IFileService)
    ], BrowserFileUpload);
    exports.BrowserFileUpload = BrowserFileUpload;
    //#endregion
    //#region External File Import (drag and drop)
    let ExternalFileImport = class ExternalFileImport {
        constructor(fileService, hostService, contextService, configurationService, dialogService, workspaceEditingService, explorerService, editorService, progressService, notificationService, instantiationService) {
            this.fileService = fileService;
            this.hostService = hostService;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.dialogService = dialogService;
            this.workspaceEditingService = workspaceEditingService;
            this.explorerService = explorerService;
            this.editorService = editorService;
            this.progressService = progressService;
            this.notificationService = notificationService;
            this.instantiationService = instantiationService;
        }
        async import(target, source) {
            const cts = new cancellation_1.CancellationTokenSource();
            // Indicate progress globally
            const importPromise = this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                delay: 800,
                cancellable: true,
                title: (0, nls_1.localize)('copyingFiles', "Copying...")
            }, async () => await this.doImport(target, source, cts.token), () => cts.dispose(true));
            // Also indicate progress in the files view
            this.progressService.withProgress({ location: files_3.VIEW_ID, delay: 500 }, () => importPromise);
            return importPromise;
        }
        async doImport(target, source, token) {
            // Activate all providers for the resources dropped
            const candidateFiles = (0, arrays_1.coalesce)((await this.instantiationService.invokeFunction(accessor => (0, dnd_1.extractEditorsDropData)(accessor, source))).map(editor => editor.resource));
            await Promise.all(candidateFiles.map(resource => this.fileService.activateProvider(resource.scheme)));
            // Check for dropped external files to be folders
            const files = (0, arrays_1.coalesce)(candidateFiles.filter(resource => this.fileService.hasProvider(resource)));
            const resolvedFiles = await this.fileService.resolveAll(files.map(file => ({ resource: file })));
            if (token.isCancellationRequested) {
                return;
            }
            // Pass focus to window
            this.hostService.focus();
            // Handle folders by adding to workspace if we are in workspace context and if dropped on top
            const folders = resolvedFiles.filter(resolvedFile => { var _a; return resolvedFile.success && ((_a = resolvedFile.stat) === null || _a === void 0 ? void 0 : _a.isDirectory); }).map(resolvedFile => ({ uri: resolvedFile.stat.resource }));
            if (folders.length > 0 && target.isRoot) {
                const buttons = [
                    folders.length > 1 ?
                        (0, nls_1.localize)('copyFolders', "&&Copy Folders") :
                        (0, nls_1.localize)('copyFolder', "&&Copy Folder"),
                    (0, nls_1.localize)('cancel', "Cancel")
                ];
                let message;
                // We only allow to add a folder to the workspace if there is already a workspace folder with that scheme
                const workspaceFolderSchemas = this.contextService.getWorkspace().folders.map(folder => folder.uri.scheme);
                if (folders.some(folder => workspaceFolderSchemas.indexOf(folder.uri.scheme) >= 0)) {
                    buttons.unshift(folders.length > 1 ? (0, nls_1.localize)('addFolders', "&&Add Folders to Workspace") : (0, nls_1.localize)('addFolder', "&&Add Folder to Workspace"));
                    message = folders.length > 1 ?
                        (0, nls_1.localize)('dropFolders', "Do you want to copy the folders or add the folders to the workspace?") :
                        (0, nls_1.localize)('dropFolder', "Do you want to copy '{0}' or add '{0}' as a folder to the workspace?", (0, resources_1.basename)(folders[0].uri));
                }
                else {
                    message = folders.length > 1 ?
                        (0, nls_1.localize)('copyfolders', "Are you sure to want to copy folders?") :
                        (0, nls_1.localize)('copyfolder', "Are you sure to want to copy '{0}'?", (0, resources_1.basename)(folders[0].uri));
                }
                const { choice } = await this.dialogService.show(notification_1.Severity.Info, message, buttons);
                // Add folders
                if (choice === buttons.length - 3) {
                    return this.workspaceEditingService.addFolders(folders);
                }
                // Copy resources
                if (choice === buttons.length - 2) {
                    return this.importResources(target, files, token);
                }
            }
            // Handle dropped files (only support FileStat as target)
            else if (target instanceof explorerModel_1.ExplorerItem) {
                return this.importResources(target, files, token);
            }
        }
        async importResources(target, resources, token) {
            if (resources && resources.length > 0) {
                // Resolve target to check for name collisions and ask user
                const targetStat = await this.fileService.resolve(target.resource);
                if (token.isCancellationRequested) {
                    return;
                }
                // Check for name collisions
                const targetNames = new Set();
                const caseSensitive = this.fileService.hasCapability(target.resource, 1024 /* FileSystemProviderCapabilities.PathCaseSensitive */);
                if (targetStat.children) {
                    targetStat.children.forEach(child => {
                        targetNames.add(caseSensitive ? child.name : child.name.toLowerCase());
                    });
                }
                let inaccessibleFileCount = 0;
                const resourcesFiltered = (0, arrays_1.coalesce)((await async_1.Promises.settled(resources.map(async (resource) => {
                    const fileDoesNotExist = !(await this.fileService.exists(resource));
                    if (fileDoesNotExist) {
                        inaccessibleFileCount++;
                        return undefined;
                    }
                    if (targetNames.has(caseSensitive ? (0, resources_1.basename)(resource) : (0, resources_1.basename)(resource).toLowerCase())) {
                        const confirmationResult = await this.dialogService.confirm(getFileOverwriteConfirm((0, resources_1.basename)(resource)));
                        if (!confirmationResult.confirmed) {
                            return undefined;
                        }
                    }
                    return resource;
                }))));
                if (inaccessibleFileCount > 0) {
                    this.notificationService.error(inaccessibleFileCount > 1 ? (0, nls_1.localize)('filesInaccessible', "Some or all of the dropped files could not be accessed for import.") : (0, nls_1.localize)('fileInaccessible', "The dropped file could not be accessed for import."));
                }
                // Copy resources through bulk edit API
                const resourceFileEdits = resourcesFiltered.map(resource => {
                    const sourceFileName = (0, resources_1.basename)(resource);
                    const targetFile = (0, resources_1.joinPath)(target.resource, sourceFileName);
                    return new bulkEditService_1.ResourceFileEdit(resource, targetFile, { overwrite: true, copy: true });
                });
                const undoLevel = this.configurationService.getValue().explorer.confirmUndo;
                await this.explorerService.applyBulkEdit(resourceFileEdits, {
                    undoLabel: resourcesFiltered.length === 1 ?
                        (0, nls_1.localize)({ comment: ['substitution will be the name of the file that was imported'], key: 'importFile' }, "Import {0}", (0, resources_1.basename)(resourcesFiltered[0])) :
                        (0, nls_1.localize)({ comment: ['substitution will be the number of files that were imported'], key: 'importnFile' }, "Import {0} resources", resourcesFiltered.length),
                    progressLabel: resourcesFiltered.length === 1 ?
                        (0, nls_1.localize)({ comment: ['substitution will be the name of the file that was copied'], key: 'copyingFile' }, "Copying {0}", (0, resources_1.basename)(resourcesFiltered[0])) :
                        (0, nls_1.localize)({ comment: ['substitution will be the number of files that were copied'], key: 'copyingnFile' }, "Copying {0} resources", resourcesFiltered.length),
                    progressLocation: 10 /* ProgressLocation.Window */,
                    confirmBeforeUndo: undoLevel === "verbose" /* UndoConfirmLevel.Verbose */ || undoLevel === "default" /* UndoConfirmLevel.Default */,
                });
                // if we only add one file, just open it directly
                if (resourceFileEdits.length === 1) {
                    const item = this.explorerService.findClosest(resourceFileEdits[0].newResource);
                    if (item && !item.isDirectory) {
                        this.editorService.openEditor({ resource: item.resource, options: { pinned: true } });
                    }
                }
            }
        }
    };
    ExternalFileImport = __decorate([
        __param(0, files_1.IFileService),
        __param(1, host_1.IHostService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, dialogs_1.IDialogService),
        __param(5, workspaceEditing_1.IWorkspaceEditingService),
        __param(6, files_2.IExplorerService),
        __param(7, editorService_1.IEditorService),
        __param(8, progress_1.IProgressService),
        __param(9, notification_1.INotificationService),
        __param(10, instantiation_1.IInstantiationService)
    ], ExternalFileImport);
    exports.ExternalFileImport = ExternalFileImport;
    let FileDownload = class FileDownload {
        constructor(fileService, explorerService, progressService, logService, fileDialogService) {
            this.fileService = fileService;
            this.explorerService = explorerService;
            this.progressService = progressService;
            this.logService = logService;
            this.fileDialogService = fileDialogService;
        }
        download(source) {
            const cts = new cancellation_1.CancellationTokenSource();
            // Indicate progress globally
            const downloadPromise = this.progressService.withProgress({
                location: 10 /* ProgressLocation.Window */,
                delay: 800,
                cancellable: platform_1.isWeb,
                title: (0, nls_1.localize)('downloadingFiles', "Downloading")
            }, async (progress) => this.doDownload(source, progress, cts), () => cts.dispose(true));
            // Also indicate progress in the files view
            this.progressService.withProgress({ location: files_3.VIEW_ID, delay: 500 }, () => downloadPromise);
            return downloadPromise;
        }
        async doDownload(sources, progress, cts) {
            for (const source of sources) {
                if (cts.token.isCancellationRequested) {
                    return;
                }
                // Web: use DOM APIs to download files with optional support
                // for folders and large files
                if (platform_1.isWeb) {
                    await this.doDownloadBrowser(source.resource, progress, cts);
                }
                // Native: use working copy file service to get at the contents
                else {
                    await this.doDownloadNative(source, progress, cts);
                }
            }
        }
        async doDownloadBrowser(resource, progress, cts) {
            const stat = await this.fileService.resolve(resource, { resolveMetadata: true });
            if (cts.token.isCancellationRequested) {
                return;
            }
            const maxBlobDownloadSize = 32 * files_1.ByteSize.MB; // avoid to download via blob-trick >32MB to avoid memory pressure
            const preferFileSystemAccessWebApis = stat.isDirectory || stat.size > maxBlobDownloadSize;
            // Folder: use FS APIs to download files and folders if available and preferred
            if (preferFileSystemAccessWebApis && webFileSystemAccess_1.WebFileSystemAccess.supported(window)) {
                try {
                    const parentFolder = await window.showDirectoryPicker();
                    const operation = {
                        startTime: Date.now(),
                        progressScheduler: new async_1.RunOnceWorker(steps => { progress.report(steps[steps.length - 1]); }, 1000),
                        filesTotal: stat.isDirectory ? 0 : 1,
                        filesDownloaded: 0,
                        totalBytesDownloaded: 0,
                        fileBytesDownloaded: 0
                    };
                    if (stat.isDirectory) {
                        const targetFolder = await parentFolder.getDirectoryHandle(stat.name, { create: true });
                        await this.downloadFolderBrowser(stat, targetFolder, operation, cts.token);
                    }
                    else {
                        await this.downloadFileBrowser(parentFolder, stat, operation, cts.token);
                    }
                    operation.progressScheduler.dispose();
                }
                catch (error) {
                    this.logService.warn(error);
                    cts.cancel(); // `showDirectoryPicker` will throw an error when the user cancels
                }
            }
            // File: use traditional download to circumvent browser limitations
            else if (stat.isFile) {
                let bufferOrUri;
                try {
                    bufferOrUri = (await this.fileService.readFile(stat.resource, { limits: { size: maxBlobDownloadSize } }, cts.token)).value.buffer;
                }
                catch (error) {
                    bufferOrUri = network_1.FileAccess.asBrowserUri(stat.resource);
                }
                if (!cts.token.isCancellationRequested) {
                    (0, dom_1.triggerDownload)(bufferOrUri, stat.name);
                }
            }
        }
        async downloadFileBufferedBrowser(resource, target, operation, token) {
            const contents = await this.fileService.readFileStream(resource, undefined, token);
            if (token.isCancellationRequested) {
                target.close();
                return;
            }
            return new Promise((resolve, reject) => {
                const sourceStream = contents.value;
                const disposables = new lifecycle_1.DisposableStore();
                disposables.add((0, lifecycle_1.toDisposable)(() => target.close()));
                disposables.add((0, functional_1.once)(token.onCancellationRequested)(() => {
                    disposables.dispose();
                    reject((0, errors_1.canceled)());
                }));
                disposables.add((0, stream_1.listenStream)(sourceStream, {
                    onData: data => {
                        target.write(data.buffer);
                        this.reportProgress(contents.name, contents.size, data.byteLength, operation);
                    },
                    onError: error => {
                        disposables.dispose();
                        reject(error);
                    },
                    onEnd: () => {
                        disposables.dispose();
                        resolve();
                    }
                }));
            });
        }
        async downloadFileUnbufferedBrowser(resource, target, operation, token) {
            const contents = await this.fileService.readFile(resource, undefined, token);
            if (!token.isCancellationRequested) {
                target.write(contents.value.buffer);
                this.reportProgress(contents.name, contents.size, contents.value.byteLength, operation);
            }
            target.close();
        }
        async downloadFileBrowser(targetFolder, file, operation, token) {
            // Report progress
            operation.filesDownloaded++;
            operation.fileBytesDownloaded = 0; // reset for this file
            this.reportProgress(file.name, 0, 0, operation);
            // Start to download
            const targetFile = await targetFolder.getFileHandle(file.name, { create: true });
            const targetFileWriter = await targetFile.createWritable();
            // For large files, write buffered using streams
            if (file.size > files_1.ByteSize.MB) {
                return this.downloadFileBufferedBrowser(file.resource, targetFileWriter, operation, token);
            }
            // For small files prefer to write unbuffered to reduce overhead
            return this.downloadFileUnbufferedBrowser(file.resource, targetFileWriter, operation, token);
        }
        async downloadFolderBrowser(folder, targetFolder, operation, token) {
            if (folder.children) {
                operation.filesTotal += (folder.children.map(child => child.isFile)).length;
                for (const child of folder.children) {
                    if (token.isCancellationRequested) {
                        return;
                    }
                    if (child.isFile) {
                        await this.downloadFileBrowser(targetFolder, child, operation, token);
                    }
                    else {
                        const childFolder = await targetFolder.getDirectoryHandle(child.name, { create: true });
                        const resolvedChildFolder = await this.fileService.resolve(child.resource, { resolveMetadata: true });
                        await this.downloadFolderBrowser(resolvedChildFolder, childFolder, operation, token);
                    }
                }
            }
        }
        reportProgress(name, fileSize, bytesDownloaded, operation) {
            operation.fileBytesDownloaded += bytesDownloaded;
            operation.totalBytesDownloaded += bytesDownloaded;
            const bytesDownloadedPerSecond = operation.totalBytesDownloaded / ((Date.now() - operation.startTime) / 1000);
            // Small file
            let message;
            if (fileSize < files_1.ByteSize.MB) {
                if (operation.filesTotal === 1) {
                    message = name;
                }
                else {
                    message = (0, nls_1.localize)('downloadProgressSmallMany', "{0} of {1} files ({2}/s)", operation.filesDownloaded, operation.filesTotal, files_1.ByteSize.formatSize(bytesDownloadedPerSecond));
                }
            }
            // Large file
            else {
                message = (0, nls_1.localize)('downloadProgressLarge', "{0} ({1} of {2}, {3}/s)", name, files_1.ByteSize.formatSize(operation.fileBytesDownloaded), files_1.ByteSize.formatSize(fileSize), files_1.ByteSize.formatSize(bytesDownloadedPerSecond));
            }
            // Report progress but limit to update only once per second
            operation.progressScheduler.work({ message });
        }
        async doDownloadNative(explorerItem, progress, cts) {
            progress.report({ message: explorerItem.name });
            const defaultUri = (0, resources_1.joinPath)(explorerItem.isDirectory ?
                await this.fileDialogService.defaultFolderPath(network_1.Schemas.file) :
                await this.fileDialogService.defaultFilePath(network_1.Schemas.file), explorerItem.name);
            const destination = await this.fileDialogService.showSaveDialog({
                availableFileSystems: [network_1.Schemas.file],
                saveLabel: (0, labels_1.mnemonicButtonLabel)((0, nls_1.localize)('downloadButton', "Download")),
                title: (0, nls_1.localize)('chooseWhereToDownload', "Choose Where to Download"),
                defaultUri
            });
            if (destination) {
                await this.explorerService.applyBulkEdit([new bulkEditService_1.ResourceFileEdit(explorerItem.resource, destination, { overwrite: true, copy: true })], {
                    undoLabel: (0, nls_1.localize)('downloadBulkEdit', "Download {0}", explorerItem.name),
                    progressLabel: (0, nls_1.localize)('downloadingBulkEdit', "Downloading {0}", explorerItem.name),
                    progressLocation: 10 /* ProgressLocation.Window */
                });
            }
            else {
                cts.cancel(); // User canceled a download. In case there were multiple files selected we should cancel the remainder of the prompts #86100
            }
        }
    };
    FileDownload = __decorate([
        __param(0, files_1.IFileService),
        __param(1, files_2.IExplorerService),
        __param(2, progress_1.IProgressService),
        __param(3, log_1.ILogService),
        __param(4, dialogs_1.IFileDialogService)
    ], FileDownload);
    exports.FileDownload = FileDownload;
    //#endregion
    //#region Helpers
    function getFileOverwriteConfirm(name) {
        return {
            message: (0, nls_1.localize)('confirmOverwrite', "A file or folder with the name '{0}' already exists in the destination folder. Do you want to replace it?", name),
            detail: (0, nls_1.localize)('irreversible', "This action is irreversible!"),
            primaryButton: (0, nls_1.localize)({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
            type: 'warning'
        };
    }
    exports.getFileOverwriteConfirm = getFileOverwriteConfirm;
    function getMultipleFilesOverwriteConfirm(files) {
        if (files.length > 1) {
            return {
                message: (0, nls_1.localize)('confirmManyOverwrites', "The following {0} files and/or folders already exist in the destination folder. Do you want to replace them?", files.length),
                detail: (0, dialogs_1.getFileNamesMessage)(files) + '\n' + (0, nls_1.localize)('irreversible', "This action is irreversible!"),
                primaryButton: (0, nls_1.localize)({ key: 'replaceButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Replace"),
                type: 'warning'
            };
        }
        return getFileOverwriteConfirm((0, resources_1.basename)(files[0]));
    }
    exports.getMultipleFilesOverwriteConfirm = getMultipleFilesOverwriteConfirm;
});
//#endregion
//# sourceMappingURL=fileImportExport.js.map