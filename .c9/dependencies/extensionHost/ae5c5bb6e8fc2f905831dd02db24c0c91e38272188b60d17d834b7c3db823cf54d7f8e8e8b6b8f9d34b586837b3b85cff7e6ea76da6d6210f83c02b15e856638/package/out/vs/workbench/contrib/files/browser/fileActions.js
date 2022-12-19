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
define(["require", "exports", "vs/nls", "vs/base/common/platform", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/errorMessage", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/workbench/contrib/files/common/files", "vs/platform/files/common/files", "vs/workbench/common/editor", "vs/platform/quickinput/common/quickInput", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/host/browser/host", "vs/workbench/contrib/files/browser/fileConstants", "vs/editor/common/services/resolverService", "vs/platform/configuration/common/configuration", "vs/platform/clipboard/common/clipboardService", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/base/common/network", "vs/platform/dialogs/common/dialogs", "vs/platform/notification/common/notification", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/arrays", "vs/workbench/contrib/files/common/explorerModel", "vs/base/common/errors", "vs/base/browser/dom", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/async", "vs/workbench/services/workingCopy/common/workingCopyFileService", "vs/base/common/codicons", "vs/workbench/common/views", "vs/base/common/strings", "vs/platform/uriIdentity/common/uriIdentity", "vs/editor/browser/services/bulkEditService", "vs/workbench/contrib/files/browser/files", "vs/workbench/contrib/files/browser/fileImportExport", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/path/common/pathService"], function (require, exports, nls, platform_1, path_1, resources, uri_1, errorMessage_1, actions_1, lifecycle_1, files_1, files_2, editor_1, quickInput_1, instantiation_1, host_1, fileConstants_1, resolverService_1, configuration_1, clipboardService_1, language_1, model_1, commands_1, contextkey_1, network_1, dialogs_1, notification_1, editorService_1, editorCommands_1, arrays_1, explorerModel_1, errors_1, dom_1, filesConfigurationService_1, workingCopyService_1, async_1, workingCopyFileService_1, codicons_1, views_1, strings_1, uriIdentity_1, bulkEditService_1, files_3, fileImportExport_1, panecomposite_1, remoteAgentService_1, pathService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.openFilePreserveFocusHandler = exports.pasteFileHandler = exports.cutFileHandler = exports.copyFileHandler = exports.deleteFileHandler = exports.moveFileToTrashHandler = exports.renameHandler = exports.CompareWithClipboardAction = exports.validateFileName = exports.ShowOpenedFileInNewWindow = exports.ShowActiveFileInExplorer = exports.FocusFilesExplorer = exports.CloseGroupAction = exports.SaveAllInGroupAction = exports.BaseSaveAllAction = exports.ToggleAutoSaveAction = exports.GlobalCompareResourcesAction = exports.incrementFileName = exports.findValidPasteFileTarget = exports.UPLOAD_LABEL = exports.UPLOAD_COMMAND_ID = exports.DOWNLOAD_LABEL = exports.DOWNLOAD_COMMAND_ID = exports.FileCopiedContext = exports.PASTE_FILE_LABEL = exports.COPY_FILE_LABEL = exports.MOVE_FILE_TO_TRASH_LABEL = exports.TRIGGER_RENAME_LABEL = exports.NEW_FOLDER_LABEL = exports.NEW_FOLDER_COMMAND_ID = exports.NEW_FILE_LABEL = exports.NEW_FILE_COMMAND_ID = void 0;
    exports.NEW_FILE_COMMAND_ID = 'explorer.newFile';
    exports.NEW_FILE_LABEL = nls.localize('newFile', "New File");
    exports.NEW_FOLDER_COMMAND_ID = 'explorer.newFolder';
    exports.NEW_FOLDER_LABEL = nls.localize('newFolder', "New Folder");
    exports.TRIGGER_RENAME_LABEL = nls.localize('rename', "Rename");
    exports.MOVE_FILE_TO_TRASH_LABEL = nls.localize('delete', "Delete");
    exports.COPY_FILE_LABEL = nls.localize('copyFile', "Copy");
    exports.PASTE_FILE_LABEL = nls.localize('pasteFile', "Paste");
    exports.FileCopiedContext = new contextkey_1.RawContextKey('fileCopied', false);
    exports.DOWNLOAD_COMMAND_ID = 'explorer.download';
    exports.DOWNLOAD_LABEL = nls.localize('download', "Download...");
    exports.UPLOAD_COMMAND_ID = 'explorer.upload';
    exports.UPLOAD_LABEL = nls.localize('upload', "Upload...");
    const CONFIRM_DELETE_SETTING_KEY = 'explorer.confirmDelete';
    const MAX_UNDO_FILE_SIZE = 5000000; // 5mb
    function onError(notificationService, error) {
        if (error.message === 'string') {
            error = error.message;
        }
        notificationService.error((0, errorMessage_1.toErrorMessage)(error, false));
    }
    async function refreshIfSeparator(value, explorerService) {
        if (value && ((value.indexOf('/') >= 0) || (value.indexOf('\\') >= 0))) {
            // New input contains separator, multiple resources will get created workaround for #68204
            await explorerService.refresh();
        }
    }
    async function deleteFiles(explorerService, workingCopyFileService, dialogService, configurationService, elements, useTrash, skipConfirm = false, ignoreIfNotExists = false) {
        let primaryButton;
        if (useTrash) {
            primaryButton = platform_1.isWindows ? nls.localize('deleteButtonLabelRecycleBin', "&&Move to Recycle Bin") : nls.localize({ key: 'deleteButtonLabelTrash', comment: ['&& denotes a mnemonic'] }, "&&Move to Trash");
        }
        else {
            primaryButton = nls.localize({ key: 'deleteButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete");
        }
        // Handle dirty
        const distinctElements = resources.distinctParents(elements, e => e.resource);
        const dirtyWorkingCopies = new Set();
        for (const distinctElement of distinctElements) {
            for (const dirtyWorkingCopy of workingCopyFileService.getDirty(distinctElement.resource)) {
                dirtyWorkingCopies.add(dirtyWorkingCopy);
            }
        }
        let confirmed = true;
        if (dirtyWorkingCopies.size) {
            let message;
            if (distinctElements.length > 1) {
                message = nls.localize('dirtyMessageFilesDelete', "You are deleting files with unsaved changes. Do you want to continue?");
            }
            else if (distinctElements[0].isDirectory) {
                if (dirtyWorkingCopies.size === 1) {
                    message = nls.localize('dirtyMessageFolderOneDelete', "You are deleting a folder {0} with unsaved changes in 1 file. Do you want to continue?", distinctElements[0].name);
                }
                else {
                    message = nls.localize('dirtyMessageFolderDelete', "You are deleting a folder {0} with unsaved changes in {1} files. Do you want to continue?", distinctElements[0].name, dirtyWorkingCopies.size);
                }
            }
            else {
                message = nls.localize('dirtyMessageFileDelete', "You are deleting {0} with unsaved changes. Do you want to continue?", distinctElements[0].name);
            }
            const response = await dialogService.confirm({
                message,
                type: 'warning',
                detail: nls.localize('dirtyWarning', "Your changes will be lost if you don't save them."),
                primaryButton
            });
            if (!response.confirmed) {
                confirmed = false;
            }
            else {
                skipConfirm = true;
            }
        }
        // Check if file is dirty in editor and save it to avoid data loss
        if (!confirmed) {
            return;
        }
        let confirmation;
        // We do not support undo of folders, so in that case the delete action is irreversible
        const deleteDetail = distinctElements.some(e => e.isDirectory) ? nls.localize('irreversible', "This action is irreversible!") :
            distinctElements.length > 1 ? nls.localize('restorePlural', "You can restore these files using the Undo command") : nls.localize('restore', "You can restore this file using the Undo command");
        // Check if we need to ask for confirmation at all
        if (skipConfirm || (useTrash && configurationService.getValue(CONFIRM_DELETE_SETTING_KEY) === false)) {
            confirmation = { confirmed: true };
        }
        // Confirm for moving to trash
        else if (useTrash) {
            let { message, detail } = getMoveToTrashMessage(distinctElements);
            detail += detail ? '\n' : '';
            if (platform_1.isWindows) {
                detail += distinctElements.length > 1 ? nls.localize('undoBinFiles', "You can restore these files from the Recycle Bin.") : nls.localize('undoBin', "You can restore this file from the Recycle Bin.");
            }
            else {
                detail += distinctElements.length > 1 ? nls.localize('undoTrashFiles', "You can restore these files from the Trash.") : nls.localize('undoTrash', "You can restore this file from the Trash.");
            }
            confirmation = await dialogService.confirm({
                message,
                detail,
                primaryButton,
                checkbox: {
                    label: nls.localize('doNotAskAgain', "Do not ask me again")
                },
                type: 'question'
            });
        }
        // Confirm for deleting permanently
        else {
            let { message, detail } = getDeleteMessage(distinctElements);
            detail += detail ? '\n' : '';
            detail += deleteDetail;
            confirmation = await dialogService.confirm({
                message,
                detail,
                primaryButton,
                type: 'warning'
            });
        }
        // Check for confirmation checkbox
        if (confirmation.confirmed && confirmation.checkboxChecked === true) {
            await configurationService.updateValue(CONFIRM_DELETE_SETTING_KEY, false);
        }
        // Check for confirmation
        if (!confirmation.confirmed) {
            return;
        }
        // Call function
        try {
            const resourceFileEdits = distinctElements.map(e => new bulkEditService_1.ResourceFileEdit(e.resource, undefined, { recursive: true, folder: e.isDirectory, ignoreIfNotExists, skipTrashBin: !useTrash, maxSize: MAX_UNDO_FILE_SIZE }));
            const options = {
                undoLabel: distinctElements.length > 1 ? nls.localize({ key: 'deleteBulkEdit', comment: ['Placeholder will be replaced by the number of files deleted'] }, "Delete {0} files", distinctElements.length) : nls.localize({ key: 'deleteFileBulkEdit', comment: ['Placeholder will be replaced by the name of the file deleted'] }, "Delete {0}", distinctElements[0].name),
                progressLabel: distinctElements.length > 1 ? nls.localize({ key: 'deletingBulkEdit', comment: ['Placeholder will be replaced by the number of files deleted'] }, "Deleting {0} files", distinctElements.length) : nls.localize({ key: 'deletingFileBulkEdit', comment: ['Placeholder will be replaced by the name of the file deleted'] }, "Deleting {0}", distinctElements[0].name),
            };
            await explorerService.applyBulkEdit(resourceFileEdits, options);
        }
        catch (error) {
            // Handle error to delete file(s) from a modal confirmation dialog
            let errorMessage;
            let detailMessage;
            let primaryButton;
            if (useTrash) {
                errorMessage = platform_1.isWindows ? nls.localize('binFailed', "Failed to delete using the Recycle Bin. Do you want to permanently delete instead?") : nls.localize('trashFailed', "Failed to delete using the Trash. Do you want to permanently delete instead?");
                detailMessage = deleteDetail;
                primaryButton = nls.localize({ key: 'deletePermanentlyButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete Permanently");
            }
            else {
                errorMessage = (0, errorMessage_1.toErrorMessage)(error, false);
                primaryButton = nls.localize({ key: 'retryButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Retry");
            }
            const res = await dialogService.confirm({
                message: errorMessage,
                detail: detailMessage,
                type: 'warning',
                primaryButton
            });
            if (res.confirmed) {
                if (useTrash) {
                    useTrash = false; // Delete Permanently
                }
                skipConfirm = true;
                ignoreIfNotExists = true;
                return deleteFiles(explorerService, workingCopyFileService, dialogService, configurationService, elements, useTrash, skipConfirm, ignoreIfNotExists);
            }
        }
    }
    function getMoveToTrashMessage(distinctElements) {
        if (containsBothDirectoryAndFile(distinctElements)) {
            return {
                message: nls.localize('confirmMoveTrashMessageFilesAndDirectories', "Are you sure you want to delete the following {0} files/directories and their contents?", distinctElements.length),
                detail: (0, dialogs_1.getFileNamesMessage)(distinctElements.map(e => e.resource))
            };
        }
        if (distinctElements.length > 1) {
            if (distinctElements[0].isDirectory) {
                return {
                    message: nls.localize('confirmMoveTrashMessageMultipleDirectories', "Are you sure you want to delete the following {0} directories and their contents?", distinctElements.length),
                    detail: (0, dialogs_1.getFileNamesMessage)(distinctElements.map(e => e.resource))
                };
            }
            return {
                message: nls.localize('confirmMoveTrashMessageMultiple', "Are you sure you want to delete the following {0} files?", distinctElements.length),
                detail: (0, dialogs_1.getFileNamesMessage)(distinctElements.map(e => e.resource))
            };
        }
        if (distinctElements[0].isDirectory && !distinctElements[0].isSymbolicLink) {
            return { message: nls.localize('confirmMoveTrashMessageFolder', "Are you sure you want to delete '{0}' and its contents?", distinctElements[0].name), detail: '' };
        }
        return { message: nls.localize('confirmMoveTrashMessageFile', "Are you sure you want to delete '{0}'?", distinctElements[0].name), detail: '' };
    }
    function getDeleteMessage(distinctElements) {
        if (containsBothDirectoryAndFile(distinctElements)) {
            return {
                message: nls.localize('confirmDeleteMessageFilesAndDirectories', "Are you sure you want to permanently delete the following {0} files/directories and their contents?", distinctElements.length),
                detail: (0, dialogs_1.getFileNamesMessage)(distinctElements.map(e => e.resource))
            };
        }
        if (distinctElements.length > 1) {
            if (distinctElements[0].isDirectory) {
                return {
                    message: nls.localize('confirmDeleteMessageMultipleDirectories', "Are you sure you want to permanently delete the following {0} directories and their contents?", distinctElements.length),
                    detail: (0, dialogs_1.getFileNamesMessage)(distinctElements.map(e => e.resource))
                };
            }
            return {
                message: nls.localize('confirmDeleteMessageMultiple', "Are you sure you want to permanently delete the following {0} files?", distinctElements.length),
                detail: (0, dialogs_1.getFileNamesMessage)(distinctElements.map(e => e.resource))
            };
        }
        if (distinctElements[0].isDirectory) {
            return { message: nls.localize('confirmDeleteMessageFolder', "Are you sure you want to permanently delete '{0}' and its contents?", distinctElements[0].name), detail: '' };
        }
        return { message: nls.localize('confirmDeleteMessageFile', "Are you sure you want to permanently delete '{0}'?", distinctElements[0].name), detail: '' };
    }
    function containsBothDirectoryAndFile(distinctElements) {
        const directory = distinctElements.find(element => element.isDirectory);
        const file = distinctElements.find(element => !element.isDirectory);
        return !!directory && !!file;
    }
    function findValidPasteFileTarget(explorerService, targetFolder, fileToPaste, incrementalNaming) {
        let name = resources.basenameOrAuthority(fileToPaste.resource);
        let candidate = resources.joinPath(targetFolder.resource, name);
        while (true && !fileToPaste.allowOverwrite) {
            if (!explorerService.findClosest(candidate)) {
                break;
            }
            name = incrementFileName(name, !!fileToPaste.isDirectory, incrementalNaming);
            candidate = resources.joinPath(targetFolder.resource, name);
        }
        return candidate;
    }
    exports.findValidPasteFileTarget = findValidPasteFileTarget;
    function incrementFileName(name, isFolder, incrementalNaming) {
        if (incrementalNaming === 'simple') {
            let namePrefix = name;
            let extSuffix = '';
            if (!isFolder) {
                extSuffix = (0, path_1.extname)(name);
                namePrefix = (0, path_1.basename)(name, extSuffix);
            }
            // name copy 5(.txt) => name copy 6(.txt)
            // name copy(.txt) => name copy 2(.txt)
            const suffixRegex = /^(.+ copy)( \d+)?$/;
            if (suffixRegex.test(namePrefix)) {
                return namePrefix.replace(suffixRegex, (match, g1, g2) => {
                    let number = (g2 ? parseInt(g2) : 1);
                    return number === 0
                        ? `${g1}`
                        : (number < 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */
                            ? `${g1} ${number + 1}`
                            : `${g1}${g2} copy`);
                }) + extSuffix;
            }
            // name(.txt) => name copy(.txt)
            return `${namePrefix} copy${extSuffix}`;
        }
        const separators = '[\\.\\-_]';
        const maxNumber = 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */;
        // file.1.txt=>file.2.txt
        let suffixFileRegex = RegExp('(.*' + separators + ')(\\d+)(\\..*)$');
        if (!isFolder && name.match(suffixFileRegex)) {
            return name.replace(suffixFileRegex, (match, g1, g2, g3) => {
                let number = parseInt(g2);
                return number < maxNumber
                    ? g1 + String(number + 1).padStart(g2.length, '0') + g3
                    : `${g1}${g2}.1${g3}`;
            });
        }
        // 1.file.txt=>2.file.txt
        let prefixFileRegex = RegExp('(\\d+)(' + separators + '.*)(\\..*)$');
        if (!isFolder && name.match(prefixFileRegex)) {
            return name.replace(prefixFileRegex, (match, g1, g2, g3) => {
                let number = parseInt(g1);
                return number < maxNumber
                    ? String(number + 1).padStart(g1.length, '0') + g2 + g3
                    : `${g1}${g2}.1${g3}`;
            });
        }
        // 1.txt=>2.txt
        let prefixFileNoNameRegex = RegExp('(\\d+)(\\..*)$');
        if (!isFolder && name.match(prefixFileNoNameRegex)) {
            return name.replace(prefixFileNoNameRegex, (match, g1, g2) => {
                let number = parseInt(g1);
                return number < maxNumber
                    ? String(number + 1).padStart(g1.length, '0') + g2
                    : `${g1}.1${g2}`;
            });
        }
        // file.txt=>file.1.txt
        const lastIndexOfDot = name.lastIndexOf('.');
        if (!isFolder && lastIndexOfDot >= 0) {
            return `${name.substr(0, lastIndexOfDot)}.1${name.substr(lastIndexOfDot)}`;
        }
        // 123 => 124
        let noNameNoExtensionRegex = RegExp('(\\d+)$');
        if (!isFolder && lastIndexOfDot === -1 && name.match(noNameNoExtensionRegex)) {
            return name.replace(noNameNoExtensionRegex, (match, g1) => {
                let number = parseInt(g1);
                return number < maxNumber
                    ? String(number + 1).padStart(g1.length, '0')
                    : `${g1}.1`;
            });
        }
        // file => file1
        // file1 => file2
        let noExtensionRegex = RegExp('(.*)(\\d*)$');
        if (!isFolder && lastIndexOfDot === -1 && name.match(noExtensionRegex)) {
            return name.replace(noExtensionRegex, (match, g1, g2) => {
                let number = parseInt(g2);
                if (isNaN(number)) {
                    number = 0;
                }
                return number < maxNumber
                    ? g1 + String(number + 1).padStart(g2.length, '0')
                    : `${g1}${g2}.1`;
            });
        }
        // folder.1=>folder.2
        if (isFolder && name.match(/(\d+)$/)) {
            return name.replace(/(\d+)$/, (match, ...groups) => {
                let number = parseInt(groups[0]);
                return number < maxNumber
                    ? String(number + 1).padStart(groups[0].length, '0')
                    : `${groups[0]}.1`;
            });
        }
        // 1.folder=>2.folder
        if (isFolder && name.match(/^(\d+)/)) {
            return name.replace(/^(\d+)(.*)$/, (match, ...groups) => {
                let number = parseInt(groups[0]);
                return number < maxNumber
                    ? String(number + 1).padStart(groups[0].length, '0') + groups[1]
                    : `${groups[0]}${groups[1]}.1`;
            });
        }
        // file/folder=>file.1/folder.1
        return `${name}.1`;
    }
    exports.incrementFileName = incrementFileName;
    // Global Compare with
    let GlobalCompareResourcesAction = class GlobalCompareResourcesAction extends actions_1.Action {
        constructor(id, label, quickInputService, editorService, textModelService) {
            super(id, label);
            this.quickInputService = quickInputService;
            this.editorService = editorService;
            this.textModelService = textModelService;
        }
        async run() {
            const activeInput = this.editorService.activeEditor;
            const activeResource = editor_1.EditorResourceAccessor.getOriginalUri(activeInput);
            if (activeResource && this.textModelService.canHandleResource(activeResource)) {
                const picks = await this.quickInputService.quickAccess.pick('', { itemActivation: quickInput_1.ItemActivation.SECOND });
                if ((picks === null || picks === void 0 ? void 0 : picks.length) === 1) {
                    const resource = picks[0].resource;
                    if (uri_1.URI.isUri(resource) && this.textModelService.canHandleResource(resource)) {
                        this.editorService.openEditor({
                            original: { resource: activeResource },
                            modified: { resource: resource },
                            options: { pinned: true }
                        });
                    }
                }
            }
        }
    };
    GlobalCompareResourcesAction.ID = 'workbench.files.action.compareFileWith';
    GlobalCompareResourcesAction.LABEL = nls.localize('globalCompareFile', "Compare Active File With...");
    GlobalCompareResourcesAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, editorService_1.IEditorService),
        __param(4, resolverService_1.ITextModelService)
    ], GlobalCompareResourcesAction);
    exports.GlobalCompareResourcesAction = GlobalCompareResourcesAction;
    let ToggleAutoSaveAction = class ToggleAutoSaveAction extends actions_1.Action {
        constructor(id, label, filesConfigurationService) {
            super(id, label);
            this.filesConfigurationService = filesConfigurationService;
        }
        run() {
            return this.filesConfigurationService.toggleAutoSave();
        }
    };
    ToggleAutoSaveAction.ID = 'workbench.action.toggleAutoSave';
    ToggleAutoSaveAction.LABEL = nls.localize('toggleAutoSave', "Toggle Auto Save");
    ToggleAutoSaveAction = __decorate([
        __param(2, filesConfigurationService_1.IFilesConfigurationService)
    ], ToggleAutoSaveAction);
    exports.ToggleAutoSaveAction = ToggleAutoSaveAction;
    let BaseSaveAllAction = class BaseSaveAllAction extends actions_1.Action {
        constructor(id, label, commandService, notificationService, workingCopyService) {
            super(id, label);
            this.commandService = commandService;
            this.notificationService = notificationService;
            this.workingCopyService = workingCopyService;
            this.lastDirtyState = this.workingCopyService.hasDirty;
            this.enabled = this.lastDirtyState;
            this.registerListeners();
        }
        registerListeners() {
            // update enablement based on working copy changes
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.updateEnablement(workingCopy)));
        }
        updateEnablement(workingCopy) {
            const hasDirty = workingCopy.isDirty() || this.workingCopyService.hasDirty;
            if (this.lastDirtyState !== hasDirty) {
                this.enabled = hasDirty;
                this.lastDirtyState = this.enabled;
            }
        }
        async run(context) {
            try {
                await this.doRun(context);
            }
            catch (error) {
                onError(this.notificationService, error);
            }
        }
    };
    BaseSaveAllAction = __decorate([
        __param(2, commands_1.ICommandService),
        __param(3, notification_1.INotificationService),
        __param(4, workingCopyService_1.IWorkingCopyService)
    ], BaseSaveAllAction);
    exports.BaseSaveAllAction = BaseSaveAllAction;
    class SaveAllInGroupAction extends BaseSaveAllAction {
        get class() {
            return 'explorer-action ' + codicons_1.Codicon.saveAll.classNames;
        }
        doRun(context) {
            return this.commandService.executeCommand(fileConstants_1.SAVE_ALL_IN_GROUP_COMMAND_ID, {}, context);
        }
    }
    exports.SaveAllInGroupAction = SaveAllInGroupAction;
    SaveAllInGroupAction.ID = 'workbench.files.action.saveAllInGroup';
    SaveAllInGroupAction.LABEL = nls.localize('saveAllInGroup', "Save All in Group");
    let CloseGroupAction = class CloseGroupAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label, codicons_1.Codicon.closeAll.classNames);
            this.commandService = commandService;
        }
        run(context) {
            return this.commandService.executeCommand(editorCommands_1.CLOSE_EDITORS_AND_GROUP_COMMAND_ID, {}, context);
        }
    };
    CloseGroupAction.ID = 'workbench.files.action.closeGroup';
    CloseGroupAction.LABEL = nls.localize('closeGroup', "Close Group");
    CloseGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], CloseGroupAction);
    exports.CloseGroupAction = CloseGroupAction;
    let FocusFilesExplorer = class FocusFilesExplorer extends actions_1.Action {
        constructor(id, label, paneCompositeService) {
            super(id, label);
            this.paneCompositeService = paneCompositeService;
        }
        async run() {
            await this.paneCompositeService.openPaneComposite(files_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
        }
    };
    FocusFilesExplorer.ID = 'workbench.files.action.focusFilesExplorer';
    FocusFilesExplorer.LABEL = nls.localize('focusFilesExplorer', "Focus on Files Explorer");
    FocusFilesExplorer = __decorate([
        __param(2, panecomposite_1.IPaneCompositePartService)
    ], FocusFilesExplorer);
    exports.FocusFilesExplorer = FocusFilesExplorer;
    let ShowActiveFileInExplorer = class ShowActiveFileInExplorer extends actions_1.Action {
        constructor(id, label, editorService, commandService) {
            super(id, label);
            this.editorService = editorService;
            this.commandService = commandService;
        }
        async run() {
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (resource) {
                this.commandService.executeCommand(fileConstants_1.REVEAL_IN_EXPLORER_COMMAND_ID, resource);
            }
        }
    };
    ShowActiveFileInExplorer.ID = 'workbench.files.action.showActiveFileInExplorer';
    ShowActiveFileInExplorer.LABEL = nls.localize('showInExplorer', "Reveal Active File in Explorer View");
    ShowActiveFileInExplorer = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, commands_1.ICommandService)
    ], ShowActiveFileInExplorer);
    exports.ShowActiveFileInExplorer = ShowActiveFileInExplorer;
    let ShowOpenedFileInNewWindow = class ShowOpenedFileInNewWindow extends actions_1.Action {
        constructor(id, label, editorService, hostService, dialogService, fileService) {
            super(id, label);
            this.editorService = editorService;
            this.hostService = hostService;
            this.dialogService = dialogService;
            this.fileService = fileService;
        }
        async run() {
            const fileResource = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (fileResource) {
                if (this.fileService.hasProvider(fileResource)) {
                    this.hostService.openWindow([{ fileUri: fileResource }], { forceNewWindow: true });
                }
                else {
                    this.dialogService.show(notification_1.Severity.Error, nls.localize('openFileToShowInNewWindow.unsupportedschema', "The active editor must contain an openable resource."));
                }
            }
        }
    };
    ShowOpenedFileInNewWindow.ID = 'workbench.action.files.showOpenedFileInNewWindow';
    ShowOpenedFileInNewWindow.LABEL = nls.localize('openFileInNewWindow', "Open Active File in New Window");
    ShowOpenedFileInNewWindow = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, host_1.IHostService),
        __param(4, dialogs_1.IDialogService),
        __param(5, files_2.IFileService)
    ], ShowOpenedFileInNewWindow);
    exports.ShowOpenedFileInNewWindow = ShowOpenedFileInNewWindow;
    function validateFileName(pathService, item, name, os) {
        // Produce a well formed file name
        name = getWellFormedFileName(name);
        // Name not provided
        if (!name || name.length === 0 || /^\s+$/.test(name)) {
            return {
                content: nls.localize('emptyFileNameError', "A file or folder name must be provided."),
                severity: notification_1.Severity.Error
            };
        }
        // Relative paths only
        if (name[0] === '/' || name[0] === '\\') {
            return {
                content: nls.localize('fileNameStartsWithSlashError', "A file or folder name cannot start with a slash."),
                severity: notification_1.Severity.Error
            };
        }
        const names = (0, arrays_1.coalesce)(name.split(/[\\/]/));
        const parent = item.parent;
        if (name !== item.name) {
            // Do not allow to overwrite existing file
            const child = parent === null || parent === void 0 ? void 0 : parent.getChild(name);
            if (child && child !== item) {
                return {
                    content: nls.localize('fileNameExistsError', "A file or folder **{0}** already exists at this location. Please choose a different name.", name),
                    severity: notification_1.Severity.Error
                };
            }
        }
        // Check for invalid file name.
        if (names.some(folderName => !pathService.hasValidBasename(item.resource, os, folderName))) {
            return {
                content: nls.localize('invalidFileNameError', "The name **{0}** is not valid as a file or folder name. Please choose a different name.", trimLongName(name)),
                severity: notification_1.Severity.Error
            };
        }
        if (names.some(name => /^\s|\s$/.test(name))) {
            return {
                content: nls.localize('fileNameWhitespaceWarning', "Leading or trailing whitespace detected in file or folder name."),
                severity: notification_1.Severity.Warning
            };
        }
        return null;
    }
    exports.validateFileName = validateFileName;
    function trimLongName(name) {
        if ((name === null || name === void 0 ? void 0 : name.length) > 255) {
            return `${name.substr(0, 255)}...`;
        }
        return name;
    }
    function getWellFormedFileName(filename) {
        if (!filename) {
            return filename;
        }
        // Trim tabs
        filename = (0, strings_1.trim)(filename, '\t');
        // Remove trailing slashes
        filename = (0, strings_1.rtrim)(filename, '/');
        filename = (0, strings_1.rtrim)(filename, '\\');
        return filename;
    }
    let CompareWithClipboardAction = class CompareWithClipboardAction extends actions_1.Action {
        constructor(id, label, editorService, instantiationService, textModelService, fileService) {
            super(id, label);
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.textModelService = textModelService;
            this.fileService = fileService;
            this.enabled = true;
        }
        async run() {
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(this.editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            const scheme = `clipboardCompare${CompareWithClipboardAction.SCHEME_COUNTER++}`;
            if (resource && (this.fileService.hasProvider(resource) || resource.scheme === network_1.Schemas.untitled)) {
                if (!this.registrationDisposal) {
                    const provider = this.instantiationService.createInstance(ClipboardContentProvider);
                    this.registrationDisposal = this.textModelService.registerTextModelContentProvider(scheme, provider);
                }
                const name = resources.basename(resource);
                const editorLabel = nls.localize('clipboardComparisonLabel', "Clipboard ↔ {0}", name);
                await this.editorService.openEditor({
                    original: { resource: resource.with({ scheme }) },
                    modified: { resource: resource },
                    label: editorLabel,
                    options: { pinned: true }
                }).finally(() => {
                    (0, lifecycle_1.dispose)(this.registrationDisposal);
                    this.registrationDisposal = undefined;
                });
            }
        }
        dispose() {
            super.dispose();
            (0, lifecycle_1.dispose)(this.registrationDisposal);
            this.registrationDisposal = undefined;
        }
    };
    CompareWithClipboardAction.ID = 'workbench.files.action.compareWithClipboard';
    CompareWithClipboardAction.LABEL = nls.localize('compareWithClipboard', "Compare Active File with Clipboard");
    CompareWithClipboardAction.SCHEME_COUNTER = 0;
    CompareWithClipboardAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, files_2.IFileService)
    ], CompareWithClipboardAction);
    exports.CompareWithClipboardAction = CompareWithClipboardAction;
    let ClipboardContentProvider = class ClipboardContentProvider {
        constructor(clipboardService, languageService, modelService) {
            this.clipboardService = clipboardService;
            this.languageService = languageService;
            this.modelService = modelService;
        }
        async provideTextContent(resource) {
            const text = await this.clipboardService.readText();
            const model = this.modelService.createModel(text, this.languageService.createByFilepathOrFirstLine(resource), resource);
            return model;
        }
    };
    ClipboardContentProvider = __decorate([
        __param(0, clipboardService_1.IClipboardService),
        __param(1, language_1.ILanguageService),
        __param(2, model_1.IModelService)
    ], ClipboardContentProvider);
    function onErrorWithRetry(notificationService, error, retry) {
        notificationService.prompt(notification_1.Severity.Error, (0, errorMessage_1.toErrorMessage)(error, false), [{
                label: nls.localize('retry', "Retry"),
                run: () => retry()
            }]);
    }
    async function openExplorerAndCreate(accessor, isFolder) {
        var _a, _b;
        const explorerService = accessor.get(files_3.IExplorerService);
        const fileService = accessor.get(files_2.IFileService);
        const configService = accessor.get(configuration_1.IConfigurationService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const viewsService = accessor.get(views_1.IViewsService);
        const notificationService = accessor.get(notification_1.INotificationService);
        const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
        const commandService = accessor.get(commands_1.ICommandService);
        const pathService = accessor.get(pathService_1.IPathService);
        const wasHidden = !viewsService.isViewVisible(files_1.VIEW_ID);
        const view = await viewsService.openView(files_1.VIEW_ID, true);
        if (wasHidden) {
            // Give explorer some time to resolve itself #111218
            await (0, async_1.timeout)(500);
        }
        if (!view) {
            // Can happen in empty workspace case (https://github.com/microsoft/vscode/issues/100604)
            if (isFolder) {
                throw new Error('Open a folder or workspace first.');
            }
            return commandService.executeCommand(fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID);
        }
        const stats = explorerService.getContext(false);
        const stat = stats.length > 0 ? stats[0] : undefined;
        let folder;
        if (stat) {
            folder = stat.isDirectory ? stat : (stat.parent || explorerService.roots[0]);
        }
        else {
            folder = explorerService.roots[0];
        }
        if (folder.isReadonly) {
            throw new Error('Parent folder is readonly.');
        }
        const newStat = new explorerModel_1.NewExplorerItem(fileService, configService, folder, isFolder);
        folder.addChild(newStat);
        const onSuccess = async (value) => {
            try {
                const resourceToCreate = resources.joinPath(folder.resource, value);
                await explorerService.applyBulkEdit([new bulkEditService_1.ResourceFileEdit(undefined, resourceToCreate, { folder: isFolder })], {
                    undoLabel: nls.localize('createBulkEdit', "Create {0}", value),
                    progressLabel: nls.localize('creatingBulkEdit', "Creating {0}", value),
                    confirmBeforeUndo: true
                });
                await refreshIfSeparator(value, explorerService);
                if (isFolder) {
                    await explorerService.select(resourceToCreate, true);
                }
                else {
                    await editorService.openEditor({ resource: resourceToCreate, options: { pinned: true } });
                }
            }
            catch (error) {
                onErrorWithRetry(notificationService, error, () => onSuccess(value));
            }
        };
        const os = (_b = (_a = (await remoteAgentService.getEnvironment())) === null || _a === void 0 ? void 0 : _a.os) !== null && _b !== void 0 ? _b : platform_1.OS;
        await explorerService.setEditable(newStat, {
            validationMessage: value => validateFileName(pathService, newStat, value, os),
            onFinish: async (value, success) => {
                folder.removeChild(newStat);
                await explorerService.setEditable(newStat, null);
                if (success) {
                    onSuccess(value);
                }
            }
        });
    }
    commands_1.CommandsRegistry.registerCommand({
        id: exports.NEW_FILE_COMMAND_ID,
        handler: async (accessor) => {
            await openExplorerAndCreate(accessor, false);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.NEW_FOLDER_COMMAND_ID,
        handler: async (accessor) => {
            await openExplorerAndCreate(accessor, true);
        }
    });
    const renameHandler = async (accessor) => {
        var _a, _b;
        const explorerService = accessor.get(files_3.IExplorerService);
        const notificationService = accessor.get(notification_1.INotificationService);
        const remoteAgentService = accessor.get(remoteAgentService_1.IRemoteAgentService);
        const pathService = accessor.get(pathService_1.IPathService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const stats = explorerService.getContext(false);
        const stat = stats.length > 0 ? stats[0] : undefined;
        if (!stat) {
            return;
        }
        const os = (_b = (_a = (await remoteAgentService.getEnvironment())) === null || _a === void 0 ? void 0 : _a.os) !== null && _b !== void 0 ? _b : platform_1.OS;
        await explorerService.setEditable(stat, {
            validationMessage: value => validateFileName(pathService, stat, value, os),
            onFinish: async (value, success) => {
                if (success) {
                    const parentResource = stat.parent.resource;
                    const targetResource = resources.joinPath(parentResource, value);
                    if (stat.resource.toString() !== targetResource.toString()) {
                        try {
                            await explorerService.applyBulkEdit([new bulkEditService_1.ResourceFileEdit(stat.resource, targetResource)], {
                                confirmBeforeUndo: configurationService.getValue().explorer.confirmUndo === "verbose" /* UndoConfirmLevel.Verbose */,
                                undoLabel: nls.localize('renameBulkEdit', "Rename {0} to {1}", stat.name, value),
                                progressLabel: nls.localize('renamingBulkEdit', "Renaming {0} to {1}", stat.name, value),
                            });
                            await refreshIfSeparator(value, explorerService);
                        }
                        catch (e) {
                            notificationService.error(e);
                        }
                    }
                }
                await explorerService.setEditable(stat, null);
            }
        });
    };
    exports.renameHandler = renameHandler;
    const moveFileToTrashHandler = async (accessor) => {
        const explorerService = accessor.get(files_3.IExplorerService);
        const stats = explorerService.getContext(true).filter(s => !s.isRoot);
        if (stats.length) {
            await deleteFiles(accessor.get(files_3.IExplorerService), accessor.get(workingCopyFileService_1.IWorkingCopyFileService), accessor.get(dialogs_1.IDialogService), accessor.get(configuration_1.IConfigurationService), stats, true);
        }
    };
    exports.moveFileToTrashHandler = moveFileToTrashHandler;
    const deleteFileHandler = async (accessor) => {
        const explorerService = accessor.get(files_3.IExplorerService);
        const stats = explorerService.getContext(true).filter(s => !s.isRoot);
        if (stats.length) {
            await deleteFiles(accessor.get(files_3.IExplorerService), accessor.get(workingCopyFileService_1.IWorkingCopyFileService), accessor.get(dialogs_1.IDialogService), accessor.get(configuration_1.IConfigurationService), stats, false);
        }
    };
    exports.deleteFileHandler = deleteFileHandler;
    let pasteShouldMove = false;
    const copyFileHandler = async (accessor) => {
        const explorerService = accessor.get(files_3.IExplorerService);
        const stats = explorerService.getContext(true);
        if (stats.length > 0) {
            await explorerService.setToCopy(stats, false);
            pasteShouldMove = false;
        }
    };
    exports.copyFileHandler = copyFileHandler;
    const cutFileHandler = async (accessor) => {
        const explorerService = accessor.get(files_3.IExplorerService);
        const stats = explorerService.getContext(true);
        if (stats.length > 0) {
            await explorerService.setToCopy(stats, true);
            pasteShouldMove = true;
        }
    };
    exports.cutFileHandler = cutFileHandler;
    const downloadFileHandler = async (accessor) => {
        const explorerService = accessor.get(files_3.IExplorerService);
        const notificationService = accessor.get(notification_1.INotificationService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const context = explorerService.getContext(true);
        const explorerItems = context.length ? context : explorerService.roots;
        const downloadHandler = instantiationService.createInstance(fileImportExport_1.FileDownload);
        try {
            await downloadHandler.download(explorerItems);
        }
        catch (error) {
            notificationService.error(error);
            throw error;
        }
    };
    commands_1.CommandsRegistry.registerCommand({
        id: exports.DOWNLOAD_COMMAND_ID,
        handler: downloadFileHandler
    });
    const uploadFileHandler = async (accessor) => {
        const explorerService = accessor.get(files_3.IExplorerService);
        const notificationService = accessor.get(notification_1.INotificationService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const context = explorerService.getContext(true);
        const element = context.length ? context[0] : explorerService.roots[0];
        try {
            const files = await (0, dom_1.triggerUpload)();
            if (files) {
                const browserUpload = instantiationService.createInstance(fileImportExport_1.BrowserFileUpload);
                await browserUpload.upload(element, files);
            }
        }
        catch (error) {
            notificationService.error(error);
            throw error;
        }
    };
    commands_1.CommandsRegistry.registerCommand({
        id: exports.UPLOAD_COMMAND_ID,
        handler: uploadFileHandler
    });
    const pasteFileHandler = async (accessor) => {
        const clipboardService = accessor.get(clipboardService_1.IClipboardService);
        const explorerService = accessor.get(files_3.IExplorerService);
        const fileService = accessor.get(files_2.IFileService);
        const notificationService = accessor.get(notification_1.INotificationService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
        const context = explorerService.getContext(true);
        const toPaste = resources.distinctParents(await clipboardService.readResources(), r => r);
        const element = context.length ? context[0] : explorerService.roots[0];
        try {
            // Check if target is ancestor of pasted folder
            const sourceTargetPairs = await Promise.all(toPaste.map(async (fileToPaste) => {
                if (element.resource.toString() !== fileToPaste.toString() && resources.isEqualOrParent(element.resource, fileToPaste)) {
                    throw new Error(nls.localize('fileIsAncestor', "File to paste is an ancestor of the destination folder"));
                }
                const fileToPasteStat = await fileService.stat(fileToPaste);
                // Find target
                let target;
                if (uriIdentityService.extUri.isEqual(element.resource, fileToPaste)) {
                    target = element.parent;
                }
                else {
                    target = element.isDirectory ? element : element.parent;
                }
                const incrementalNaming = configurationService.getValue().explorer.incrementalNaming;
                const targetFile = findValidPasteFileTarget(explorerService, target, { resource: fileToPaste, isDirectory: fileToPasteStat.isDirectory, allowOverwrite: pasteShouldMove }, incrementalNaming);
                return { source: fileToPaste, target: targetFile };
            }));
            if (sourceTargetPairs.length >= 1) {
                // Move/Copy File
                if (pasteShouldMove) {
                    const resourceFileEdits = sourceTargetPairs.map(pair => new bulkEditService_1.ResourceFileEdit(pair.source, pair.target));
                    const options = {
                        confirmBeforeUndo: configurationService.getValue().explorer.confirmUndo === "verbose" /* UndoConfirmLevel.Verbose */,
                        progressLabel: sourceTargetPairs.length > 1 ? nls.localize({ key: 'movingBulkEdit', comment: ['Placeholder will be replaced by the number of files being moved'] }, "Moving {0} files", sourceTargetPairs.length)
                            : nls.localize({ key: 'movingFileBulkEdit', comment: ['Placeholder will be replaced by the name of the file moved.'] }, "Moving {0}", resources.basenameOrAuthority(sourceTargetPairs[0].target)),
                        undoLabel: sourceTargetPairs.length > 1 ? nls.localize({ key: 'moveBulkEdit', comment: ['Placeholder will be replaced by the number of files being moved'] }, "Move {0} files", sourceTargetPairs.length)
                            : nls.localize({ key: 'moveFileBulkEdit', comment: ['Placeholder will be replaced by the name of the file moved.'] }, "Move {0}", resources.basenameOrAuthority(sourceTargetPairs[0].target))
                    };
                    await explorerService.applyBulkEdit(resourceFileEdits, options);
                }
                else {
                    const resourceFileEdits = sourceTargetPairs.map(pair => new bulkEditService_1.ResourceFileEdit(pair.source, pair.target, { copy: true }));
                    const undoLevel = configurationService.getValue().explorer.confirmUndo;
                    const options = {
                        confirmBeforeUndo: undoLevel === "default" /* UndoConfirmLevel.Default */ || undoLevel === "verbose" /* UndoConfirmLevel.Verbose */,
                        progressLabel: sourceTargetPairs.length > 1 ? nls.localize({ key: 'copyingBulkEdit', comment: ['Placeholder will be replaced by the number of files being copied'] }, "Copying {0} files", sourceTargetPairs.length)
                            : nls.localize({ key: 'copyingFileBulkEdit', comment: ['Placeholder will be replaced by the name of the file copied.'] }, "Copying {0}", resources.basenameOrAuthority(sourceTargetPairs[0].target)),
                        undoLabel: sourceTargetPairs.length > 1 ? nls.localize({ key: 'copyBulkEdit', comment: ['Placeholder will be replaced by the number of files being copied'] }, "Paste {0} files", sourceTargetPairs.length)
                            : nls.localize({ key: 'copyFileBulkEdit', comment: ['Placeholder will be replaced by the name of the file copied.'] }, "Paste {0}", resources.basenameOrAuthority(sourceTargetPairs[0].target))
                    };
                    await explorerService.applyBulkEdit(resourceFileEdits, options);
                }
                const pair = sourceTargetPairs[0];
                await explorerService.select(pair.target);
                if (sourceTargetPairs.length === 1) {
                    const item = explorerService.findClosest(pair.target);
                    if (item && !item.isDirectory) {
                        await editorService.openEditor({ resource: item.resource, options: { pinned: true, preserveFocus: true } });
                    }
                }
            }
        }
        catch (e) {
            onError(notificationService, new Error(nls.localize('fileDeleted', "The file(s) to paste have been deleted or moved since you copied them. {0}", (0, errors_1.getErrorMessage)(e))));
        }
        finally {
            if (pasteShouldMove) {
                // Cut is done. Make sure to clear cut state.
                await explorerService.setToCopy([], false);
                pasteShouldMove = false;
            }
        }
    };
    exports.pasteFileHandler = pasteFileHandler;
    const openFilePreserveFocusHandler = async (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const explorerService = accessor.get(files_3.IExplorerService);
        const stats = explorerService.getContext(true);
        await editorService.openEditors(stats.filter(s => !s.isDirectory).map(s => ({
            resource: s.resource,
            options: { preserveFocus: true }
        })));
    };
    exports.openFilePreserveFocusHandler = openFilePreserveFocusHandler;
});
//# sourceMappingURL=fileActions.js.map