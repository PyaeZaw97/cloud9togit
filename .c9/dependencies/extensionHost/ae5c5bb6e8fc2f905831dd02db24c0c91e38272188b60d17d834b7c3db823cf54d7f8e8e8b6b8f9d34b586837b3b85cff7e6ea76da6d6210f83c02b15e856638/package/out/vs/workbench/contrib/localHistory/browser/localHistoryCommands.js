/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/network", "vs/base/common/cancellation", "vs/workbench/services/workingCopy/common/workingCopyHistory", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/contrib/localHistory/browser/localHistoryFileSystemProvider", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/base/common/resources", "vs/platform/commands/common/commands", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/dialogs/common/dialogs", "vs/workbench/services/editor/common/editorService", "vs/workbench/common/contextkeys", "vs/platform/quickinput/common/quickInput", "vs/editor/common/services/getIconClasses", "vs/editor/common/services/model", "vs/editor/common/languages/language", "vs/platform/label/common/label", "vs/base/common/arrays", "vs/workbench/contrib/localHistory/browser/localHistory", "vs/workbench/services/path/common/pathService"], function (require, exports, nls_1, uri_1, event_1, network_1, cancellation_1, workingCopyHistory_1, editorCommands_1, localHistoryFileSystemProvider_1, contextkey_1, actions_1, resources_1, commands_1, editor_1, files_1, workingCopyService_1, dialogs_1, editorService_1, contextkeys_1, quickInput_1, getIconClasses_1, model_1, language_1, label_1, arrays_1, localHistory_1, pathService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.findLocalHistoryEntry = exports.toDiffEditorArguments = exports.COMPARE_WITH_FILE_LABEL = void 0;
    const LOCAL_HISTORY_CATEGORY = { value: (0, nls_1.localize)('localHistory.category', "Local History"), original: 'Local History' };
    //#region Compare with File
    exports.COMPARE_WITH_FILE_LABEL = { value: (0, nls_1.localize)('localHistory.compareWithFile', "Compare with File"), original: 'Compare with File' };
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.compareWithFile',
                title: exports.COMPARE_WITH_FILE_LABEL,
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '1_compare',
                    order: 1,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const commandService = accessor.get(commands_1.ICommandService);
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...toDiffEditorArguments(entry, entry.workingCopy.resource));
            }
        }
    });
    //#endregion
    //#region Compare with Previous
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.compareWithPrevious',
                title: { value: (0, nls_1.localize)('localHistory.compareWithPrevious', "Compare with Previous"), original: 'Compare with Previous' },
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '1_compare',
                    order: 2,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const commandService = accessor.get(commands_1.ICommandService);
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const { entry, previous } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                // Without a previous entry, just show the entry directly
                if (!previous) {
                    return openEntry(entry, editorService);
                }
                // Open real diff editor
                return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...toDiffEditorArguments(previous, entry));
            }
        }
    });
    //#endregion
    //#region Select for Compare / Compare with Selected
    let itemSelectedForCompare = undefined;
    const LocalHistoryItemSelectedForCompare = new contextkey_1.RawContextKey('localHistoryItemSelectedForCompare', false, true);
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.selectForCompare',
                title: { value: (0, nls_1.localize)('localHistory.selectForCompare', "Select for Compare"), original: 'Select for Compare' },
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '2_compare_with',
                    order: 2,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                itemSelectedForCompare = item;
                LocalHistoryItemSelectedForCompare.bindTo(contextKeyService).set(true);
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.compareWithSelected',
                title: { value: (0, nls_1.localize)('localHistory.compareWithSelected', "Compare with Selected"), original: 'Compare with Selected' },
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '2_compare_with',
                    order: 1,
                    when: contextkey_1.ContextKeyExpr.and(localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY, LocalHistoryItemSelectedForCompare)
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const commandService = accessor.get(commands_1.ICommandService);
            if (!itemSelectedForCompare) {
                return;
            }
            const selectedEntry = (await findLocalHistoryEntry(workingCopyHistoryService, itemSelectedForCompare)).entry;
            if (!selectedEntry) {
                return;
            }
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...toDiffEditorArguments(selectedEntry, entry));
            }
        }
    });
    //#endregion
    //#region Show Contents
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.open',
                title: { value: (0, nls_1.localize)('localHistory.open', "Show Contents"), original: 'Show Contents' },
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '3_contents',
                    order: 1,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                return openEntry(entry, editorService);
            }
        }
    });
    //#region Restore Contents
    const RESTORE_CONTENTS_LABEL = { value: (0, nls_1.localize)('localHistory.restore', "Restore Contents"), original: 'Restore Contents' };
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.restoreViaEditor',
                title: RESTORE_CONTENTS_LABEL,
                menu: {
                    id: actions_1.MenuId.EditorTitle,
                    group: 'navigation',
                    order: -10,
                    when: contextkeys_1.ResourceContextKey.Scheme.isEqualTo(localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.SCHEMA)
                },
                icon: localHistory_1.LOCAL_HISTORY_ICON_RESTORE
            });
        }
        async run(accessor, uri) {
            const { associatedResource, location } = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.fromLocalHistoryFileSystem(uri);
            return restore(accessor, { uri: associatedResource, handle: (0, resources_1.basenameOrAuthority)(location) });
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.restore',
                title: RESTORE_CONTENTS_LABEL,
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '3_contents',
                    order: 2,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            return restore(accessor, item);
        }
    });
    const restoreSaveSource = editor_1.SaveSourceRegistry.registerSource('localHistoryRestore.source', (0, nls_1.localize)('localHistoryRestore.source', "File Restored"));
    async function restore(accessor, item) {
        const fileService = accessor.get(files_1.IFileService);
        const dialogService = accessor.get(dialogs_1.IDialogService);
        const workingCopyService = accessor.get(workingCopyService_1.IWorkingCopyService);
        const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
        if (entry) {
            // Ask for confirmation
            const { confirmed } = await dialogService.confirm({
                message: (0, nls_1.localize)('confirmRestoreMessage', "Do you want to restore the contents of '{0}'?", (0, resources_1.basename)(entry.workingCopy.resource)),
                detail: (0, nls_1.localize)('confirmRestoreDetail', "Restoring will discard any unsaved changes."),
                primaryButton: (0, nls_1.localize)({ key: 'restoreButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Restore"),
                type: 'warning'
            });
            if (!confirmed) {
                return;
            }
            // Revert all dirty working copies for target
            const workingCopies = workingCopyService.getAll(entry.workingCopy.resource);
            if (workingCopies) {
                for (const workingCopy of workingCopies) {
                    if (workingCopy.isDirty()) {
                        await workingCopy.revert({ soft: true });
                    }
                }
            }
            // Replace target with contents of history entry
            await fileService.cloneFile(entry.location, entry.workingCopy.resource);
            // Restore all working copies for target
            if (workingCopies) {
                for (const workingCopy of workingCopies) {
                    await workingCopy.revert({ force: true });
                }
            }
            // Open target
            await editorService.openEditor({ resource: entry.workingCopy.resource });
            // Add new entry
            await workingCopyHistoryService.addEntry({
                resource: entry.workingCopy.resource,
                source: restoreSaveSource
            }, cancellation_1.CancellationToken.None);
            // Close source
            await closeEntry(entry, editorService);
        }
    }
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.restoreViaPicker',
                title: { value: (0, nls_1.localize)('localHistory.restoreViaPicker', "Find Entry to Restore"), original: 'Find Entry to Restore' },
                f1: true,
                category: LOCAL_HISTORY_CATEGORY
            });
        }
        async run(accessor) {
            var _a;
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const modelService = accessor.get(model_1.IModelService);
            const languageService = accessor.get(language_1.ILanguageService);
            const labelService = accessor.get(label_1.ILabelService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const fileService = accessor.get(files_1.IFileService);
            const commandService = accessor.get(commands_1.ICommandService);
            // Show all resources with associated history entries in picker
            // with progress because this operation will take longer the more
            // files have been saved overall.
            const resourcePicker = quickInputService.createQuickPick();
            let cts = new cancellation_1.CancellationTokenSource();
            resourcePicker.onDidHide(() => cts.dispose(true));
            resourcePicker.busy = true;
            resourcePicker.show();
            const resources = await workingCopyHistoryService.getAll(cts.token);
            resourcePicker.busy = false;
            resourcePicker.placeholder = (0, nls_1.localize)('restoreViaPicker.filePlaceholder', "Select the file to show local history for");
            resourcePicker.matchOnLabel = true;
            resourcePicker.matchOnDescription = true;
            resourcePicker.items = resources.map(resource => ({
                resource,
                label: (0, resources_1.basenameOrAuthority)(resource),
                description: labelService.getUriLabel((0, resources_1.dirname)(resource), { relative: true }),
                iconClasses: (0, getIconClasses_1.getIconClasses)(modelService, languageService, resource)
            })).sort((r1, r2) => r1.resource.fsPath < r2.resource.fsPath ? -1 : 1);
            await event_1.Event.toPromise(resourcePicker.onDidAccept);
            resourcePicker.dispose();
            const resource = (_a = (0, arrays_1.firstOrDefault)(resourcePicker.selectedItems)) === null || _a === void 0 ? void 0 : _a.resource;
            if (!resource) {
                return;
            }
            // Show all entries for the picked resource in another picker
            // and open the entry in the end that was selected by the user
            const entryPicker = quickInputService.createQuickPick();
            cts = new cancellation_1.CancellationTokenSource();
            entryPicker.onDidHide(() => cts.dispose(true));
            entryPicker.busy = true;
            entryPicker.show();
            const entries = await workingCopyHistoryService.getEntries(resource, cts.token);
            entryPicker.busy = false;
            entryPicker.placeholder = (0, nls_1.localize)('restoreViaPicker.entryPlaceholder', "Select the local history entry to open");
            entryPicker.matchOnLabel = true;
            entryPicker.matchOnDescription = true;
            entryPicker.items = Array.from(entries).reverse().map(entry => ({
                entry,
                label: `$(circle-outline) ${editor_1.SaveSourceRegistry.getSourceLabel(entry.source)}`,
                description: toLocalHistoryEntryDateLabel(entry.timestamp)
            }));
            await event_1.Event.toPromise(entryPicker.onDidAccept);
            entryPicker.dispose();
            const selectedItem = (0, arrays_1.firstOrDefault)(entryPicker.selectedItems);
            if (!selectedItem) {
                return;
            }
            const resourceExists = await fileService.exists(selectedItem.entry.workingCopy.resource);
            if (resourceExists) {
                return commandService.executeCommand(editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID, ...toDiffEditorArguments(selectedItem.entry, selectedItem.entry.workingCopy.resource));
            }
            return openEntry(selectedItem.entry, editorService);
        }
    });
    //#endregion
    //#region Rename
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.rename',
                title: { value: (0, nls_1.localize)('localHistory.rename', "Rename"), original: 'Rename' },
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '5_edit',
                    order: 1,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                const inputBox = quickInputService.createInputBox();
                inputBox.title = (0, nls_1.localize)('renameLocalHistoryEntryTitle', "Rename Local History Entry");
                inputBox.ignoreFocusOut = true;
                inputBox.placeholder = (0, nls_1.localize)('renameLocalHistoryPlaceholder', "Enter the new name of the local history entry");
                inputBox.value = editor_1.SaveSourceRegistry.getSourceLabel(entry.source);
                inputBox.show();
                inputBox.onDidAccept(() => {
                    if (inputBox.value) {
                        workingCopyHistoryService.updateEntry(entry, { source: inputBox.value }, cancellation_1.CancellationToken.None);
                    }
                    inputBox.dispose();
                });
            }
        }
    });
    //#endregion
    //#region Delete
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.delete',
                title: { value: (0, nls_1.localize)('localHistory.delete', "Delete"), original: 'Delete' },
                menu: {
                    id: actions_1.MenuId.TimelineItemContext,
                    group: '5_edit',
                    order: 2,
                    when: localHistory_1.LOCAL_HISTORY_MENU_CONTEXT_KEY
                }
            });
        }
        async run(accessor, item) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const { entry } = await findLocalHistoryEntry(workingCopyHistoryService, item);
            if (entry) {
                // Ask for confirmation
                const { confirmed } = await dialogService.confirm({
                    message: (0, nls_1.localize)('confirmDeleteMessage', "Do you want to delete the local history entry of '{0}' from {1}?", entry.workingCopy.name, toLocalHistoryEntryDateLabel(entry.timestamp)),
                    detail: (0, nls_1.localize)('confirmDeleteDetail', "This action is irreversible!"),
                    primaryButton: (0, nls_1.localize)({ key: 'deleteButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete"),
                    type: 'warning'
                });
                if (!confirmed) {
                    return;
                }
                // Remove via service
                await workingCopyHistoryService.removeEntry(entry, cancellation_1.CancellationToken.None);
                // Close any opened editors
                await closeEntry(entry, editorService);
            }
        }
    });
    //#endregion
    //#region Delete All
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.deleteAll',
                title: { value: (0, nls_1.localize)('localHistory.deleteAll', "Delete All"), original: 'Delete All' },
                f1: true,
                category: LOCAL_HISTORY_CATEGORY
            });
        }
        async run(accessor) {
            const dialogService = accessor.get(dialogs_1.IDialogService);
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            // Ask for confirmation
            const { confirmed } = await dialogService.confirm({
                message: (0, nls_1.localize)('confirmDeleteAllMessage', "Do you want to delete all entries of all files in local history?"),
                detail: (0, nls_1.localize)('confirmDeleteAllDetail', "This action is irreversible!"),
                primaryButton: (0, nls_1.localize)({ key: 'deleteAllButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Delete All"),
                type: 'warning'
            });
            if (!confirmed) {
                return;
            }
            // Remove via service
            await workingCopyHistoryService.removeAll(cancellation_1.CancellationToken.None);
        }
    });
    //#endregion
    //#region Create
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.localHistory.create',
                title: { value: (0, nls_1.localize)('localHistory.create', "Create Entry"), original: 'Create Entry' },
                f1: true,
                category: LOCAL_HISTORY_CATEGORY,
                precondition: contextkeys_1.ActiveEditorContext
            });
        }
        async run(accessor) {
            const workingCopyHistoryService = accessor.get(workingCopyHistory_1.IWorkingCopyHistoryService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const labelService = accessor.get(label_1.ILabelService);
            const pathService = accessor.get(pathService_1.IPathService);
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if ((resource === null || resource === void 0 ? void 0 : resource.scheme) !== pathService.defaultUriScheme && (resource === null || resource === void 0 ? void 0 : resource.scheme) !== network_1.Schemas.vscodeUserData) {
                return; // only enable for selected schemes
            }
            const inputBox = quickInputService.createInputBox();
            inputBox.title = (0, nls_1.localize)('createLocalHistoryEntryTitle', "Create Local History Entry");
            inputBox.ignoreFocusOut = true;
            inputBox.placeholder = (0, nls_1.localize)('createLocalHistoryPlaceholder', "Enter the new name of the local history entry for '{0}'", labelService.getUriBasenameLabel(resource));
            inputBox.show();
            inputBox.onDidAccept(async () => {
                let entrySource = inputBox.value;
                inputBox.dispose();
                if (entrySource) {
                    await workingCopyHistoryService.addEntry({ resource, source: inputBox.value }, cancellation_1.CancellationToken.None);
                }
            });
        }
    });
    //#endregion
    //#region Helpers
    async function openEntry(entry, editorService) {
        const resource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.toLocalHistoryFileSystem({ location: entry.location, associatedResource: entry.workingCopy.resource });
        await editorService.openEditor({
            resource,
            label: (0, nls_1.localize)('localHistoryEditorLabel', "{0} ({1} • {2})", entry.workingCopy.name, editor_1.SaveSourceRegistry.getSourceLabel(entry.source), toLocalHistoryEntryDateLabel(entry.timestamp))
        });
    }
    async function closeEntry(entry, editorService) {
        const resource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.toLocalHistoryFileSystem({ location: entry.location, associatedResource: entry.workingCopy.resource });
        const editors = editorService.findEditors(resource, { supportSideBySide: editor_1.SideBySideEditor.ANY });
        await editorService.closeEditors(editors, { preserveFocus: true });
    }
    function toDiffEditorArguments(arg1, arg2) {
        // Left hand side is always a working copy history entry
        const originalResource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.toLocalHistoryFileSystem({ location: arg1.location, associatedResource: arg1.workingCopy.resource });
        let label;
        // Right hand side depends on how the method was called
        // and is either another working copy history entry
        // or the file on disk.
        let modifiedResource;
        // Compare with file on disk
        if (uri_1.URI.isUri(arg2)) {
            const resource = arg2;
            modifiedResource = resource;
            label = (0, nls_1.localize)('localHistoryCompareToFileEditorLabel', "{0} ({1} • {2}) ↔ {3}", arg1.workingCopy.name, editor_1.SaveSourceRegistry.getSourceLabel(arg1.source), toLocalHistoryEntryDateLabel(arg1.timestamp), arg1.workingCopy.name);
        }
        // Compare with another entry
        else {
            const modified = arg2;
            modifiedResource = localHistoryFileSystemProvider_1.LocalHistoryFileSystemProvider.toLocalHistoryFileSystem({ location: modified.location, associatedResource: modified.workingCopy.resource });
            label = (0, nls_1.localize)('localHistoryCompareToPreviousEditorLabel', "{0} ({1} • {2}) ↔ {3} ({4} • {5})", arg1.workingCopy.name, editor_1.SaveSourceRegistry.getSourceLabel(arg1.source), toLocalHistoryEntryDateLabel(arg1.timestamp), modified.workingCopy.name, editor_1.SaveSourceRegistry.getSourceLabel(modified.source), toLocalHistoryEntryDateLabel(modified.timestamp));
        }
        return [
            originalResource,
            modifiedResource,
            label,
            undefined // important to keep order of arguments in command proper
        ];
    }
    exports.toDiffEditorArguments = toDiffEditorArguments;
    async function findLocalHistoryEntry(workingCopyHistoryService, descriptor) {
        const entries = await workingCopyHistoryService.getEntries(descriptor.uri, cancellation_1.CancellationToken.None);
        let currentEntry = undefined;
        let previousEntry = undefined;
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            if (entry.id === descriptor.handle) {
                currentEntry = entry;
                previousEntry = entries[i - 1];
                break;
            }
        }
        return {
            entry: currentEntry,
            previous: previousEntry
        };
    }
    exports.findLocalHistoryEntry = findLocalHistoryEntry;
    const SEP = /\//g;
    function toLocalHistoryEntryDateLabel(timestamp) {
        return `${localHistory_1.LOCAL_HISTORY_DATE_FORMATTER.value.format(timestamp).replace(SEP, '-')}`; // preserving `/` will break editor labels, so replace it with a non-path symbol
    }
});
//#endregion
//# sourceMappingURL=localHistoryCommands.js.map