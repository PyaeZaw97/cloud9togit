/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/registry/common/platform", "vs/workbench/contrib/files/browser/fileActions", "vs/workbench/contrib/files/browser/editors/textFileSaveErrorHandler", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/base/common/keyCodes", "vs/workbench/contrib/files/browser/fileCommands", "vs/workbench/contrib/files/browser/fileConstants", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/contrib/files/common/files", "vs/workbench/browser/actions/workspaceCommands", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/platform/list/browser/listService", "vs/base/common/network", "vs/workbench/common/contextkeys", "vs/platform/contextkey/common/contextkeys", "vs/workbench/contrib/files/browser/files", "vs/base/common/codicons"], function (require, exports, nls, platform_1, fileActions_1, textFileSaveErrorHandler_1, actions_1, actions_2, keyCodes_1, fileCommands_1, fileConstants_1, commands_1, contextkey_1, keybindingsRegistry_1, files_1, workspaceCommands_1, editorCommands_1, filesConfigurationService_1, listService_1, network_1, contextkeys_1, contextkeys_2, files_2, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.appendToCommandPalette = exports.appendEditorTitleContextMenuItem = void 0;
    // Contribute Global Actions
    const category = { value: nls.localize('filesCategory', "File"), original: 'File' };
    const registry = platform_1.Registry.as(actions_2.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.GlobalCompareResourcesAction), 'File: Compare Active File With...', category.value, contextkeys_1.ActiveEditorContext);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.FocusFilesExplorer), 'File: Focus on Files Explorer', category.value);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.ShowActiveFileInExplorer), 'File: Reveal Active File in Explorer View', category.value);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.CompareWithClipboardAction, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 33 /* KeyCode.KeyC */) }), 'File: Compare Active File with Clipboard', category.value);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.ToggleAutoSaveAction), 'File: Toggle Auto Save', category.value);
    registry.registerWorkbenchAction(actions_1.SyncActionDescriptor.from(fileActions_1.ShowOpenedFileInNewWindow, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 45 /* KeyCode.KeyO */) }), 'File: Open Active File in New Window', category.value, contextkeys_1.EmptyWorkspaceSupportContext);
    // Commands
    commands_1.CommandsRegistry.registerCommand('_files.windowOpen', fileCommands_1.openWindowCommand);
    commands_1.CommandsRegistry.registerCommand('_files.newWindow', fileCommands_1.newWindowCommand);
    const explorerCommandsWeightBonus = 10; // give our commands a little bit more weight over other default list/tree commands
    const RENAME_ID = 'renameFile';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: RENAME_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext),
        primary: 60 /* KeyCode.F2 */,
        mac: {
            primary: 3 /* KeyCode.Enter */
        },
        handler: fileActions_1.renameHandler
    });
    const MOVE_FILE_TO_TRASH_ID = 'moveFileToTrash';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: MOVE_FILE_TO_TRASH_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext, files_1.ExplorerResourceMoveableToTrash),
        primary: 20 /* KeyCode.Delete */,
        mac: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */,
            secondary: [20 /* KeyCode.Delete */]
        },
        handler: fileActions_1.moveFileToTrashHandler
    });
    const DELETE_FILE_ID = 'deleteFile';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: DELETE_FILE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext),
        primary: 1024 /* KeyMod.Shift */ | 20 /* KeyCode.Delete */,
        mac: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 1 /* KeyCode.Backspace */
        },
        handler: fileActions_1.deleteFileHandler
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: DELETE_FILE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext, files_1.ExplorerResourceMoveableToTrash.toNegated()),
        primary: 20 /* KeyCode.Delete */,
        mac: {
            primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */
        },
        handler: fileActions_1.deleteFileHandler
    });
    const CUT_FILE_ID = 'filesExplorer.cut';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: CUT_FILE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext),
        primary: 2048 /* KeyMod.CtrlCmd */ | 54 /* KeyCode.KeyX */,
        handler: fileActions_1.cutFileHandler,
    });
    const COPY_FILE_ID = 'filesExplorer.copy';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: COPY_FILE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerRootContext.toNegated()),
        primary: 2048 /* KeyMod.CtrlCmd */ | 33 /* KeyCode.KeyC */,
        handler: fileActions_1.copyFileHandler,
    });
    const PASTE_FILE_ID = 'filesExplorer.paste';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: PASTE_FILE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceNotReadonlyContext),
        primary: 2048 /* KeyMod.CtrlCmd */ | 52 /* KeyCode.KeyV */,
        handler: fileActions_1.pasteFileHandler
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'filesExplorer.cancelCut',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerResourceCut),
        primary: 9 /* KeyCode.Escape */,
        handler: async (accessor) => {
            const explorerService = accessor.get(files_2.IExplorerService);
            await explorerService.setToCopy([], true);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'filesExplorer.openFilePreserveFocus',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + explorerCommandsWeightBonus,
        when: contextkey_1.ContextKeyExpr.and(files_1.FilesExplorerFocusCondition, files_1.ExplorerFolderContext.toNegated()),
        primary: 10 /* KeyCode.Space */,
        handler: fileActions_1.openFilePreserveFocusHandler
    });
    const copyPathCommand = {
        id: fileConstants_1.COPY_PATH_COMMAND_ID,
        title: nls.localize('copyPath', "Copy Path")
    };
    const copyRelativePathCommand = {
        id: fileConstants_1.COPY_RELATIVE_PATH_COMMAND_ID,
        title: nls.localize('copyRelativePath', "Copy Relative Path")
    };
    // Editor Title Context Menu
    appendEditorTitleContextMenuItem(fileConstants_1.COPY_PATH_COMMAND_ID, copyPathCommand.title, contextkeys_1.ResourceContextKey.IsFileSystemResource, '1_cutcopypaste');
    appendEditorTitleContextMenuItem(fileConstants_1.COPY_RELATIVE_PATH_COMMAND_ID, copyRelativePathCommand.title, contextkeys_1.ResourceContextKey.IsFileSystemResource, '1_cutcopypaste');
    appendEditorTitleContextMenuItem(fileConstants_1.REVEAL_IN_EXPLORER_COMMAND_ID, nls.localize('revealInSideBar', "Reveal in Explorer View"), contextkeys_1.ResourceContextKey.IsFileSystemResource, '2_files', 1);
    function appendEditorTitleContextMenuItem(id, title, when, group, order) {
        // Menu
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitleContext, {
            command: { id, title },
            when,
            group,
            order
        });
    }
    exports.appendEditorTitleContextMenuItem = appendEditorTitleContextMenuItem;
    // Editor Title Menu for Conflict Resolution
    appendSaveConflictEditorTitleAction('workbench.files.action.acceptLocalChanges', nls.localize('acceptLocalChanges', "Use your changes and overwrite file contents"), codicons_1.Codicon.check, -10, textFileSaveErrorHandler_1.acceptLocalChangesCommand);
    appendSaveConflictEditorTitleAction('workbench.files.action.revertLocalChanges', nls.localize('revertLocalChanges', "Discard your changes and revert to file contents"), codicons_1.Codicon.discard, -9, textFileSaveErrorHandler_1.revertLocalChangesCommand);
    function appendSaveConflictEditorTitleAction(id, title, icon, order, command) {
        // Command
        commands_1.CommandsRegistry.registerCommand(id, command);
        // Action
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, {
            command: { id, title, icon },
            when: contextkey_1.ContextKeyExpr.equals(textFileSaveErrorHandler_1.CONFLICT_RESOLUTION_CONTEXT, true),
            group: 'navigation',
            order
        });
    }
    // Menu registration - command palette
    function appendToCommandPalette(id, title, category, when) {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id,
                title,
                category
            },
            when
        });
    }
    exports.appendToCommandPalette = appendToCommandPalette;
    appendToCommandPalette(fileConstants_1.COPY_PATH_COMMAND_ID, { value: nls.localize('copyPathOfActive', "Copy Path of Active File"), original: 'Copy Path of Active File' }, category);
    appendToCommandPalette(fileConstants_1.COPY_RELATIVE_PATH_COMMAND_ID, { value: nls.localize('copyRelativePathOfActive', "Copy Relative Path of Active File"), original: 'Copy Relative Path of Active File' }, category);
    appendToCommandPalette(fileConstants_1.SAVE_FILE_COMMAND_ID, { value: fileConstants_1.SAVE_FILE_LABEL, original: 'Save' }, category);
    appendToCommandPalette(fileConstants_1.SAVE_FILE_WITHOUT_FORMATTING_COMMAND_ID, { value: fileConstants_1.SAVE_FILE_WITHOUT_FORMATTING_LABEL, original: 'Save without Formatting' }, category);
    appendToCommandPalette(fileConstants_1.SAVE_ALL_IN_GROUP_COMMAND_ID, { value: nls.localize('saveAllInGroup', "Save All in Group"), original: 'Save All in Group' }, category);
    appendToCommandPalette(fileConstants_1.SAVE_FILES_COMMAND_ID, { value: nls.localize('saveFiles', "Save All Files"), original: 'Save All Files' }, category);
    appendToCommandPalette(fileConstants_1.REVERT_FILE_COMMAND_ID, { value: nls.localize('revert', "Revert File"), original: 'Revert File' }, category);
    appendToCommandPalette(fileConstants_1.COMPARE_WITH_SAVED_COMMAND_ID, { value: nls.localize('compareActiveWithSaved', "Compare Active File with Saved"), original: 'Compare Active File with Saved' }, category);
    appendToCommandPalette(fileConstants_1.SAVE_FILE_AS_COMMAND_ID, { value: fileConstants_1.SAVE_FILE_AS_LABEL, original: 'Save As...' }, category);
    appendToCommandPalette(fileActions_1.NEW_FILE_COMMAND_ID, { value: fileActions_1.NEW_FILE_LABEL, original: 'New File' }, category, contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'));
    appendToCommandPalette(fileActions_1.NEW_FOLDER_COMMAND_ID, { value: fileActions_1.NEW_FOLDER_LABEL, original: 'New Folder' }, category, contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'));
    appendToCommandPalette(fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID, { value: fileConstants_1.NEW_UNTITLED_FILE_LABEL, original: 'New Untitled File' }, category);
    // Menu registration - open editors
    const isFileOrUntitledResourceContextKey = contextkey_1.ContextKeyExpr.or(contextkeys_1.ResourceContextKey.IsFileSystemResource, contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.untitled));
    const openToSideCommand = {
        id: fileConstants_1.OPEN_TO_SIDE_COMMAND_ID,
        title: nls.localize('openToSide', "Open to the Side")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: 'navigation',
        order: 10,
        command: openToSideCommand,
        when: isFileOrUntitledResourceContextKey
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '1_cutcopypaste',
        order: 10,
        command: copyPathCommand,
        when: contextkeys_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '1_cutcopypaste',
        order: 20,
        command: copyRelativePathCommand,
        when: contextkeys_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '2_save',
        order: 10,
        command: {
            id: fileConstants_1.SAVE_FILE_COMMAND_ID,
            title: fileConstants_1.SAVE_FILE_LABEL,
            precondition: fileConstants_1.OpenEditorsDirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.or(
        // Untitled Editors
        contextkeys_1.ResourceContextKey.Scheme.isEqualTo(network_1.Schemas.untitled), 
        // Or:
        contextkey_1.ContextKeyExpr.and(
        // Not: editor groups
        fileConstants_1.OpenEditorsGroupContext.toNegated(), 
        // Not: readonly editors
        fileConstants_1.OpenEditorsReadonlyEditorContext.toNegated(), 
        // Not: auto save after short delay
        filesConfigurationService_1.AutoSaveAfterShortDelayContext.toNegated()))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '2_save',
        order: 20,
        command: {
            id: fileConstants_1.REVERT_FILE_COMMAND_ID,
            title: nls.localize('revert', "Revert File"),
            precondition: fileConstants_1.OpenEditorsDirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.and(
        // Not: editor groups
        fileConstants_1.OpenEditorsGroupContext.toNegated(), 
        // Not: readonly editors
        fileConstants_1.OpenEditorsReadonlyEditorContext.toNegated(), 
        // Not: untitled editors (revert closes them)
        contextkeys_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.untitled), 
        // Not: auto save after short delay
        filesConfigurationService_1.AutoSaveAfterShortDelayContext.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '2_save',
        order: 30,
        command: {
            id: fileConstants_1.SAVE_ALL_IN_GROUP_COMMAND_ID,
            title: nls.localize('saveAll', "Save All"),
            precondition: contextkeys_1.DirtyWorkingCopiesContext
        },
        // Editor Group
        when: fileConstants_1.OpenEditorsGroupContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 10,
        command: {
            id: fileConstants_1.COMPARE_WITH_SAVED_COMMAND_ID,
            title: nls.localize('compareWithSaved', "Compare with Saved"),
            precondition: fileConstants_1.OpenEditorsDirtyEditorContext
        },
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.IsFileSystemResource, filesConfigurationService_1.AutoSaveAfterShortDelayContext.toNegated(), listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const compareResourceCommand = {
        id: fileConstants_1.COMPARE_RESOURCE_COMMAND_ID,
        title: nls.localize('compareWithSelected', "Compare with Selected")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 20,
        command: compareResourceCommand,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.HasResource, fileConstants_1.ResourceSelectedForCompareContext, isFileOrUntitledResourceContextKey, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const selectForCompareCommand = {
        id: fileConstants_1.SELECT_FOR_COMPARE_COMMAND_ID,
        title: nls.localize('compareSource', "Select for Compare")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 30,
        command: selectForCompareCommand,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.HasResource, isFileOrUntitledResourceContextKey, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    const compareSelectedCommand = {
        id: fileConstants_1.COMPARE_SELECTED_COMMAND_ID,
        title: nls.localize('compareSelected', "Compare Selected")
    };
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '3_compare',
        order: 30,
        command: compareSelectedCommand,
        when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection, isFileOrUntitledResourceContextKey)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 10,
        command: {
            id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
            title: nls.localize('close', "Close")
        },
        when: fileConstants_1.OpenEditorsGroupContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 20,
        command: {
            id: editorCommands_1.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID,
            title: nls.localize('closeOthers', "Close Others")
        },
        when: fileConstants_1.OpenEditorsGroupContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 30,
        command: {
            id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID,
            title: nls.localize('closeSaved', "Close Saved")
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.OpenEditorsContext, {
        group: '4_close',
        order: 40,
        command: {
            id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
            title: nls.localize('closeAll', "Close All")
        }
    });
    // Menu registration - explorer
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 4,
        command: {
            id: fileActions_1.NEW_FILE_COMMAND_ID,
            title: fileActions_1.NEW_FILE_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 6,
        command: {
            id: fileActions_1.NEW_FOLDER_COMMAND_ID,
            title: fileActions_1.NEW_FOLDER_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 10,
        command: openToSideCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), contextkeys_1.ResourceContextKey.HasResource)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: 'navigation',
        order: 20,
        command: {
            id: fileConstants_1.OPEN_WITH_EXPLORER_COMMAND_ID,
            title: nls.localize('explorerOpenWith', "Open With..."),
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), files_1.ExplorerResourceAvailableEditorIdsContext),
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '3_compare',
        order: 20,
        command: compareResourceCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), contextkeys_1.ResourceContextKey.HasResource, fileConstants_1.ResourceSelectedForCompareContext, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '3_compare',
        order: 30,
        command: selectForCompareCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), contextkeys_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection.toNegated())
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '3_compare',
        order: 30,
        command: compareSelectedCommand,
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerFolderContext.toNegated(), contextkeys_1.ResourceContextKey.HasResource, listService_1.WorkbenchListDoubleSelection)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '5_cutcopypaste',
        order: 8,
        command: {
            id: CUT_FILE_ID,
            title: nls.localize('cut', "Cut")
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceNotReadonlyContext)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '5_cutcopypaste',
        order: 10,
        command: {
            id: COPY_FILE_ID,
            title: fileActions_1.COPY_FILE_LABEL
        },
        when: files_1.ExplorerRootContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '5_cutcopypaste',
        order: 20,
        command: {
            id: PASTE_FILE_ID,
            title: fileActions_1.PASTE_FILE_LABEL,
            precondition: contextkey_1.ContextKeyExpr.and(files_1.ExplorerResourceNotReadonlyContext, fileActions_1.FileCopiedContext)
        },
        when: files_1.ExplorerFolderContext
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, ({
        group: '5b_importexport',
        order: 10,
        command: {
            id: fileActions_1.DOWNLOAD_COMMAND_ID,
            title: fileActions_1.DOWNLOAD_LABEL
        },
        when: contextkey_1.ContextKeyExpr.or(
        // native: for any remote resource
        contextkey_1.ContextKeyExpr.and(contextkeys_2.IsWebContext.toNegated(), contextkeys_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.file)), 
        // web: for any files
        contextkey_1.ContextKeyExpr.and(contextkeys_2.IsWebContext, files_1.ExplorerFolderContext.toNegated(), files_1.ExplorerRootContext.toNegated()), 
        // web: for any folders if file system API support is provided
        contextkey_1.ContextKeyExpr.and(contextkeys_2.IsWebContext, contextkeys_1.HasWebFileSystemAccess))
    }));
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, ({
        group: '5b_importexport',
        order: 20,
        command: {
            id: fileActions_1.UPLOAD_COMMAND_ID,
            title: fileActions_1.UPLOAD_LABEL,
        },
        when: contextkey_1.ContextKeyExpr.and(
        // only in web
        contextkeys_2.IsWebContext, 
        // only on folders
        files_1.ExplorerFolderContext, 
        // only on editable folders
        files_1.ExplorerResourceNotReadonlyContext)
    }));
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '6_copypath',
        order: 10,
        command: copyPathCommand,
        when: contextkeys_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '6_copypath',
        order: 20,
        command: copyRelativePathCommand,
        when: contextkeys_1.ResourceContextKey.IsFileSystemResource
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '2_workspace',
        order: 10,
        command: {
            id: workspaceCommands_1.ADD_ROOT_FOLDER_COMMAND_ID,
            title: workspaceCommands_1.ADD_ROOT_FOLDER_LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext, contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '2_workspace',
        order: 30,
        command: {
            id: fileConstants_1.REMOVE_ROOT_FOLDER_COMMAND_ID,
            title: fileConstants_1.REMOVE_ROOT_FOLDER_LABEL
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext, files_1.ExplorerFolderContext, contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkspaceFolderCountContext.notEqualsTo('0'), contextkey_1.ContextKeyExpr.or(contextkeys_1.EnterMultiRootWorkspaceSupportContext, contextkeys_1.WorkbenchStateContext.isEqualTo('workspace'))))
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '7_modification',
        order: 10,
        command: {
            id: RENAME_ID,
            title: fileActions_1.TRIGGER_RENAME_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: files_1.ExplorerRootContext.toNegated()
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '7_modification',
        order: 20,
        command: {
            id: MOVE_FILE_TO_TRASH_ID,
            title: fileActions_1.MOVE_FILE_TO_TRASH_LABEL,
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        alt: {
            id: DELETE_FILE_ID,
            title: nls.localize('deleteFile', "Delete Permanently"),
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceMoveableToTrash)
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.ExplorerContext, {
        group: '7_modification',
        order: 20,
        command: {
            id: DELETE_FILE_ID,
            title: nls.localize('deleteFile', "Delete Permanently"),
            precondition: files_1.ExplorerResourceNotReadonlyContext
        },
        when: contextkey_1.ContextKeyExpr.and(files_1.ExplorerRootContext.toNegated(), files_1.ExplorerResourceMoveableToTrash.toNegated())
    });
    // Empty Editor Group Context Menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID, title: nls.localize('newFile', "New Text File") }, group: '1_file', order: 10 });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EmptyEditorGroupContext, { command: { id: 'workbench.action.quickOpen', title: nls.localize('openFile', "Open File...") }, group: '1_file', order: 20 });
    // File menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '1_new',
        command: {
            id: fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miNewFile', comment: ['&& denotes a mnemonic'] }, "&&New Text File")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '4_save',
        command: {
            id: fileConstants_1.SAVE_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miSave', comment: ['&& denotes a mnemonic'] }, "&&Save"),
            precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.ActiveEditorContext, contextkey_1.ContextKeyExpr.and(files_1.ExplorerViewletVisibleContext, contextkeys_1.SidebarFocusContext))
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '4_save',
        command: {
            id: fileConstants_1.SAVE_FILE_AS_COMMAND_ID,
            title: nls.localize({ key: 'miSaveAs', comment: ['&& denotes a mnemonic'] }, "Save &&As..."),
            precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.ActiveEditorContext, contextkey_1.ContextKeyExpr.and(files_1.ExplorerViewletVisibleContext, contextkeys_1.SidebarFocusContext))
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '4_save',
        command: {
            id: fileConstants_1.SAVE_ALL_COMMAND_ID,
            title: nls.localize({ key: 'miSaveAll', comment: ['&& denotes a mnemonic'] }, "Save A&&ll"),
            precondition: contextkeys_1.DirtyWorkingCopiesContext
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '5_autosave',
        command: {
            id: fileActions_1.ToggleAutoSaveAction.ID,
            title: nls.localize({ key: 'miAutoSave', comment: ['&& denotes a mnemonic'] }, "A&&uto Save"),
            toggled: contextkey_1.ContextKeyExpr.notEquals('config.files.autoSave', 'off')
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: fileConstants_1.REVERT_FILE_COMMAND_ID,
            title: nls.localize({ key: 'miRevert', comment: ['&& denotes a mnemonic'] }, "Re&&vert File"),
            precondition: contextkey_1.ContextKeyExpr.or(
            // Active editor can revert
            contextkey_1.ContextKeyExpr.and(contextkeys_1.ActiveEditorCanRevertContext), 
            // Explorer focused but not on untitled
            contextkey_1.ContextKeyExpr.and(contextkeys_1.ResourceContextKey.Scheme.notEqualsTo(network_1.Schemas.untitled), files_1.ExplorerViewletVisibleContext, contextkeys_1.SidebarFocusContext)),
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarFileMenu, {
        group: '6_close',
        command: {
            id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
            title: nls.localize({ key: 'miCloseEditor', comment: ['&& denotes a mnemonic'] }, "&&Close Editor"),
            precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.ActiveEditorContext, contextkey_1.ContextKeyExpr.and(files_1.ExplorerViewletVisibleContext, contextkeys_1.SidebarFocusContext))
        },
        order: 2
    });
    // Go to menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarGoMenu, {
        group: '3_global_nav',
        command: {
            id: 'workbench.action.quickOpen',
            title: nls.localize({ key: 'miGotoFile', comment: ['&& denotes a mnemonic'] }, "Go to &&File...")
        },
        order: 1
    });
});
//# sourceMappingURL=fileActions.contribution.js.map