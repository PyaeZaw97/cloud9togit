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
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/platform/files/common/files", "vs/workbench/contrib/files/common/files", "vs/workbench/contrib/files/browser/editors/textFileEditorTracker", "vs/workbench/contrib/files/browser/editors/textFileSaveErrorHandler", "vs/workbench/contrib/files/browser/editors/fileEditorInput", "vs/workbench/contrib/files/browser/editors/binaryFileEditor", "vs/platform/instantiation/common/descriptors", "vs/base/common/platform", "vs/workbench/contrib/files/browser/explorerViewlet", "vs/workbench/browser/editor", "vs/platform/label/common/label", "vs/platform/instantiation/common/extensions", "vs/workbench/contrib/files/browser/explorerService", "vs/workbench/services/textfile/common/encoding", "vs/base/common/network", "vs/workbench/contrib/files/browser/workspaceWatcher", "vs/editor/common/config/editorConfigurationSchema", "vs/workbench/contrib/files/common/dirtyFilesIndicator", "vs/editor/browser/editorExtensions", "vs/platform/undoRedo/common/undoRedo", "vs/workbench/contrib/files/browser/files", "vs/workbench/contrib/files/browser/editors/fileEditorHandler", "vs/editor/common/languages/modesRegistry", "vs/platform/configuration/common/configuration"], function (require, exports, nls, path_1, platform_1, configurationRegistry_1, contributions_1, editor_1, files_1, files_2, textFileEditorTracker_1, textFileSaveErrorHandler_1, fileEditorInput_1, binaryFileEditor_1, descriptors_1, platform_2, explorerViewlet_1, editor_2, label_1, extensions_1, explorerService_1, encoding_1, network_1, workspaceWatcher_1, editorConfigurationSchema_1, dirtyFilesIndicator_1, editorExtensions_1, undoRedo_1, files_3, fileEditorHandler_1, modesRegistry_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let FileUriLabelContribution = class FileUriLabelContribution {
        constructor(labelService) {
            labelService.registerFormatter({
                scheme: network_1.Schemas.file,
                formatting: {
                    label: '${authority}${path}',
                    separator: path_1.sep,
                    tildify: !platform_2.isWindows,
                    normalizeDriveLetter: platform_2.isWindows,
                    authorityPrefix: path_1.sep + path_1.sep,
                    workspaceSuffix: ''
                }
            });
        }
    };
    FileUriLabelContribution = __decorate([
        __param(0, label_1.ILabelService)
    ], FileUriLabelContribution);
    (0, extensions_1.registerSingleton)(files_3.IExplorerService, explorerService_1.ExplorerService, true);
    // Register file editors
    platform_1.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_2.EditorPaneDescriptor.create(binaryFileEditor_1.BinaryFileEditor, binaryFileEditor_1.BinaryFileEditor.ID, nls.localize('binaryFileEditor', "Binary File Editor")), [
        new descriptors_1.SyncDescriptor(fileEditorInput_1.FileEditorInput)
    ]);
    // Register default file input factory
    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerFileEditorFactory({
        typeId: files_2.FILE_EDITOR_INPUT_ID,
        createFileEditor: (resource, preferredResource, preferredName, preferredDescription, preferredEncoding, preferredLanguageId, preferredContents, instantiationService) => {
            return instantiationService.createInstance(fileEditorInput_1.FileEditorInput, resource, preferredResource, preferredName, preferredDescription, preferredEncoding, preferredLanguageId, preferredContents);
        },
        isFileEditor: (obj) => {
            return obj instanceof fileEditorInput_1.FileEditorInput;
        }
    });
    // Register Editor Input Serializer & Handler
    platform_1.Registry.as(editor_1.EditorExtensions.EditorFactory).registerEditorSerializer(files_2.FILE_EDITOR_INPUT_ID, fileEditorHandler_1.FileEditorInputSerializer);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(fileEditorHandler_1.FileEditorWorkingCopyEditorHandler, 2 /* LifecyclePhase.Ready */);
    // Register Explorer views
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(explorerViewlet_1.ExplorerViewletViewsContribution, 1 /* LifecyclePhase.Starting */);
    // Register Text File Editor Tracker
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(textFileEditorTracker_1.TextFileEditorTracker, 1 /* LifecyclePhase.Starting */);
    // Register Text File Save Error Handler
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(textFileSaveErrorHandler_1.TextFileSaveErrorHandler, 1 /* LifecyclePhase.Starting */);
    // Register uri display for file uris
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(FileUriLabelContribution, 1 /* LifecyclePhase.Starting */);
    // Register Workspace Watcher
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(workspaceWatcher_1.WorkspaceWatcher, 3 /* LifecyclePhase.Restored */);
    // Register Dirty Files Indicator
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(dirtyFilesIndicator_1.DirtyFilesIndicator, 1 /* LifecyclePhase.Starting */);
    // Configuration
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const hotExitConfiguration = platform_2.isNative ?
        {
            'type': 'string',
            'scope': 1 /* ConfigurationScope.APPLICATION */,
            'enum': [files_1.HotExitConfiguration.OFF, files_1.HotExitConfiguration.ON_EXIT, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE],
            'default': files_1.HotExitConfiguration.ON_EXIT,
            'markdownEnumDescriptions': [
                nls.localize('hotExit.off', 'Disable hot exit. A prompt will show when attempting to close a window with editors that have unsaved changes.'),
                nls.localize('hotExit.onExit', 'Hot exit will be triggered when the last window is closed on Windows/Linux or when the `workbench.action.quit` command is triggered (command palette, keybinding, menu). All windows without folders opened will be restored upon next launch. A list of previously opened windows with unsaved files can be accessed via `File > Open Recent > More...`'),
                nls.localize('hotExit.onExitAndWindowClose', 'Hot exit will be triggered when the last window is closed on Windows/Linux or when the `workbench.action.quit` command is triggered (command palette, keybinding, menu), and also for any window with a folder opened regardless of whether it\'s the last window. All windows without folders opened will be restored upon next launch. A list of previously opened windows with unsaved files can be accessed via `File > Open Recent > More...`')
            ],
            'description': nls.localize('hotExit', "Controls whether unsaved files are remembered between sessions, allowing the save prompt when exiting the editor to be skipped.", files_1.HotExitConfiguration.ON_EXIT, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE)
        } : {
        'type': 'string',
        'scope': 1 /* ConfigurationScope.APPLICATION */,
        'enum': [files_1.HotExitConfiguration.OFF, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE],
        'default': files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE,
        'markdownEnumDescriptions': [
            nls.localize('hotExit.off', 'Disable hot exit. A prompt will show when attempting to close a window with editors that have unsaved changes.'),
            nls.localize('hotExit.onExitAndWindowCloseBrowser', 'Hot exit will be triggered when the browser quits or the window or tab is closed.')
        ],
        'description': nls.localize('hotExit', "Controls whether unsaved files are remembered between sessions, allowing the save prompt when exiting the editor to be skipped.", files_1.HotExitConfiguration.ON_EXIT, files_1.HotExitConfiguration.ON_EXIT_AND_WINDOW_CLOSE)
    };
    configurationRegistry.registerConfiguration({
        'id': 'files',
        'order': 9,
        'title': nls.localize('filesConfigurationTitle', "Files"),
        'type': 'object',
        'properties': {
            [files_1.FILES_EXCLUDE_CONFIG]: {
                'type': 'object',
                'markdownDescription': nls.localize('exclude', "Configure [glob patterns](https://code.visualstudio.com/docs/editor/codebasics#_advanced-search-options) for excluding files and folders. For example, the file explorer decides which files and folders to show or hide based on this setting. Refer to the `#search.exclude#` setting to define search-specific excludes."),
                'default': Object.assign({ '**/.git': true, '**/.svn': true, '**/.hg': true, '**/CVS': true, '**/.DS_Store': true, '**/Thumbs.db': true }, (platform_2.isWeb ? { '**/*.crswap': true /* filter out swap files used for local file access */ } : undefined)),
                'scope': 4 /* ConfigurationScope.RESOURCE */,
                'additionalProperties': {
                    'anyOf': [
                        {
                            'type': 'boolean',
                            'description': nls.localize('files.exclude.boolean', "The glob pattern to match file paths against. Set to true or false to enable or disable the pattern."),
                        },
                        {
                            'type': 'object',
                            'properties': {
                                'when': {
                                    'type': 'string',
                                    'pattern': '\\w*\\$\\(basename\\)\\w*',
                                    'default': '$(basename).ext',
                                    'markdownDescription': nls.localize('files.exclude.when', "Additional check on the siblings of a matching file. Use \\$(basename) as variable for the matching file name.")
                                }
                            }
                        }
                    ]
                }
            },
            [files_1.FILES_ASSOCIATIONS_CONFIG]: {
                'type': 'object',
                'markdownDescription': nls.localize('associations', "Configure file associations to languages (e.g. `\"*.extension\": \"html\"`). These have precedence over the default associations of the languages installed."),
                'additionalProperties': {
                    'type': 'string'
                }
            },
            'files.encoding': {
                'type': 'string',
                'enum': Object.keys(encoding_1.SUPPORTED_ENCODINGS),
                'default': 'utf8',
                'description': nls.localize('encoding', "The default character set encoding to use when reading and writing files. This setting can also be configured per language."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
                'enumDescriptions': Object.keys(encoding_1.SUPPORTED_ENCODINGS).map(key => encoding_1.SUPPORTED_ENCODINGS[key].labelLong),
                'enumItemLabels': Object.keys(encoding_1.SUPPORTED_ENCODINGS).map(key => encoding_1.SUPPORTED_ENCODINGS[key].labelLong)
            },
            'files.autoGuessEncoding': {
                'type': 'boolean',
                'default': false,
                'markdownDescription': nls.localize('autoGuessEncoding', "When enabled, the editor will attempt to guess the character set encoding when opening files. This setting can also be configured per language. Note, this setting is not respected by text search. Only `#files.encoding#` is respected."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.eol': {
                'type': 'string',
                'enum': [
                    '\n',
                    '\r\n',
                    'auto'
                ],
                'enumDescriptions': [
                    nls.localize('eol.LF', "LF"),
                    nls.localize('eol.CRLF', "CRLF"),
                    nls.localize('eol.auto', "Uses operating system specific end of line character.")
                ],
                'default': 'auto',
                'description': nls.localize('eol', "The default end of line character."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.enableTrash': {
                'type': 'boolean',
                'default': true,
                'description': nls.localize('useTrash', "Moves files/folders to the OS trash (recycle bin on Windows) when deleting. Disabling this will delete files/folders permanently.")
            },
            'files.trimTrailingWhitespace': {
                'type': 'boolean',
                'default': false,
                'description': nls.localize('trimTrailingWhitespace', "When enabled, will trim trailing whitespace when saving a file."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.insertFinalNewline': {
                'type': 'boolean',
                'default': false,
                'description': nls.localize('insertFinalNewline', "When enabled, insert a final new line at the end of the file when saving it."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.trimFinalNewlines': {
                'type': 'boolean',
                'default': false,
                'description': nls.localize('trimFinalNewlines', "When enabled, will trim all new lines after the final new line at the end of the file when saving it."),
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
            },
            'files.autoSave': {
                'type': 'string',
                'enum': [files_1.AutoSaveConfiguration.OFF, files_1.AutoSaveConfiguration.AFTER_DELAY, files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE, files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE],
                'markdownEnumDescriptions': [
                    nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'files.autoSave.off' }, "An editor with changes is never automatically saved."),
                    nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'files.autoSave.afterDelay' }, "An editor with changes is automatically saved after the configured `#files.autoSaveDelay#`."),
                    nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'files.autoSave.onFocusChange' }, "An editor with changes is automatically saved when the editor loses focus."),
                    nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'files.autoSave.onWindowChange' }, "An editor with changes is automatically saved when the window loses focus.")
                ],
                'default': platform_2.isWeb ? files_1.AutoSaveConfiguration.AFTER_DELAY : files_1.AutoSaveConfiguration.OFF,
                'markdownDescription': nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'autoSave' }, "Controls [auto save](https://code.visualstudio.com/docs/editor/codebasics#_save-auto-save) of editors that have unsaved changes.", files_1.AutoSaveConfiguration.OFF, files_1.AutoSaveConfiguration.AFTER_DELAY, files_1.AutoSaveConfiguration.ON_FOCUS_CHANGE, files_1.AutoSaveConfiguration.ON_WINDOW_CHANGE, files_1.AutoSaveConfiguration.AFTER_DELAY)
            },
            'files.autoSaveDelay': {
                'type': 'number',
                'default': 1000,
                'minimum': 0,
                'markdownDescription': nls.localize({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'autoSaveDelay' }, "Controls the delay in milliseconds after which an editor with unsaved changes is saved automatically. Only applies when `#files.autoSave#` is set to `{0}`.", files_1.AutoSaveConfiguration.AFTER_DELAY)
            },
            'files.watcherExclude': {
                'type': 'object',
                'default': { '**/.git/objects/**': true, '**/.git/subtree-cache/**': true, '**/node_modules/*/**': true, '**/.hg/store/**': true },
                'markdownDescription': nls.localize('watcherExclude', "Configure paths or glob patterns to exclude from file watching. Paths or basic glob patterns that are relative (for example `build/output` or `*.js`) will be resolved to an absolute path using the currently opened workspace. Complex glob patterns must match on absolute paths (i.e. prefix with `**/` or the full path and suffix with `/**` to match files within a path) to match properly (for example `**/build/output/**` or `/Users/name/workspaces/project/build/output/**`). When you experience the file watcher process consuming a lot of CPU, make sure to exclude large folders that are of less interest (such as build output folders)."),
                'scope': 4 /* ConfigurationScope.RESOURCE */
            },
            'files.watcherInclude': {
                'type': 'array',
                'items': {
                    'type': 'string'
                },
                'default': [],
                'description': nls.localize('watcherInclude', "Configure extra paths to watch for changes inside the workspace. By default, all workspace folders will be watched recursively, except for folders that are symbolic links. You can explicitly add absolute or relative paths to support watching folders that are symbolic links. Relative paths will be resolved to an absolute path using the currently opened workspace."),
                'scope': 4 /* ConfigurationScope.RESOURCE */
            },
            'files.hotExit': hotExitConfiguration,
            'files.defaultLanguage': {
                'type': 'string',
                'markdownDescription': nls.localize('defaultLanguage', "The default language identifier that is assigned to new files. If configured to `${activeEditorLanguage}`, will use the language identifier of the currently active text editor if any.")
            },
            'files.maxMemoryForLargeFilesMB': {
                'type': 'number',
                'default': 4096,
                'minimum': 0,
                'markdownDescription': nls.localize('maxMemoryForLargeFilesMB', "Controls the memory available to VS Code after restart when trying to open large files. Same effect as specifying `--max-memory=NEWSIZE` on the command line."),
                included: platform_2.isNative
            },
            'files.restoreUndoStack': {
                'type': 'boolean',
                'description': nls.localize('files.restoreUndoStack', "Restore the undo stack when a file is reopened."),
                'default': true
            },
            'files.saveConflictResolution': {
                'type': 'string',
                'enum': [
                    'askUser',
                    'overwriteFileOnDisk'
                ],
                'enumDescriptions': [
                    nls.localize('askUser', "Will refuse to save and ask for resolving the save conflict manually."),
                    nls.localize('overwriteFileOnDisk', "Will resolve the save conflict by overwriting the file on disk with the changes in the editor.")
                ],
                'description': nls.localize('files.saveConflictResolution', "A save conflict can occur when a file is saved to disk that was changed by another program in the meantime. To prevent data loss, the user is asked to compare the changes in the editor with the version on disk. This setting should only be changed if you frequently encounter save conflict errors and may result in data loss if used without caution."),
                'default': 'askUser',
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'files.simpleDialog.enable': {
                'type': 'boolean',
                'description': nls.localize('files.simpleDialog.enable', "Enables the simple file dialog. The simple file dialog replaces the system file dialog when enabled."),
                'default': false
            },
            'files.participants.timeout': {
                type: 'number',
                default: 60000,
                markdownDescription: nls.localize('files.participants.timeout', "Timeout in milliseconds after which file participants for create, rename, and delete are cancelled. Use `0` to disable participants."),
            }
        }
    });
    configurationRegistry.registerConfiguration(Object.assign(Object.assign({}, editorConfigurationSchema_1.editorConfigurationBaseNode), { properties: {
            'editor.formatOnSave': {
                'type': 'boolean',
                'description': nls.localize('formatOnSave', "Format a file on save. A formatter must be available, the file must not be saved after delay, and the editor must not be shutting down."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
            },
            'editor.formatOnSaveMode': {
                'type': 'string',
                'default': 'file',
                'enum': [
                    'file',
                    'modifications',
                    'modificationsIfAvailable'
                ],
                'enumDescriptions': [
                    nls.localize({ key: 'everything', comment: ['This is the description of an option'] }, "Format the whole file."),
                    nls.localize({ key: 'modification', comment: ['This is the description of an option'] }, "Format modifications (requires source control)."),
                    nls.localize({ key: 'modificationIfAvailable', comment: ['This is the description of an option'] }, "Will attempt to format modifications only (requires source control). If source control can't be used, then the whole file will be formatted."),
                ],
                'markdownDescription': nls.localize('formatOnSaveMode', "Controls if format on save formats the whole file or only modifications. Only applies when `#editor.formatOnSave#` is enabled."),
                'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */,
            },
        } }));
    configurationRegistry.registerConfiguration({
        'id': 'explorer',
        'order': 10,
        'title': nls.localize('explorerConfigurationTitle', "File Explorer"),
        'type': 'object',
        'properties': {
            'explorer.openEditors.visible': {
                'type': 'number',
                'description': nls.localize({ key: 'openEditorsVisible', comment: ['Open is an adjective'] }, "The maximum number of editors shown in the Open Editors pane. Setting this to 0 hides the Open Editors pane."),
                'default': 9,
                'minimum': 0
            },
            'explorer.openEditors.minVisible': {
                'type': 'number',
                'description': nls.localize({ key: 'openEditorsVisibleMin', comment: ['Open is an adjective'] }, "The minimum number of editor slots shown in the Open Editors pane. If set to 0 the Open Editors pane will dynamically resize based on the number of editors."),
                'default': 0,
                'minimum': 0
            },
            'explorer.openEditors.sortOrder': {
                'type': 'string',
                'enum': ['editorOrder', 'alphabetical', 'fullPath'],
                'description': nls.localize({ key: 'openEditorsSortOrder', comment: ['Open is an adjective'] }, "Controls the sorting order of editors in the Open Editors pane."),
                'enumDescriptions': [
                    nls.localize('sortOrder.editorOrder', 'Editors are ordered in the same order editor tabs are shown.'),
                    nls.localize('sortOrder.alphabetical', 'Editors are ordered alphabetically by tab name inside each editor group.'),
                    nls.localize('sortOrder.fullPath', 'Editors are ordered alphabetically by full path inside each editor group.')
                ],
                'default': 'editorOrder'
            },
            'explorer.autoReveal': {
                'type': ['boolean', 'string'],
                'enum': [true, false, 'focusNoScroll'],
                'default': true,
                'enumDescriptions': [
                    nls.localize('autoReveal.on', 'Files will be revealed and selected.'),
                    nls.localize('autoReveal.off', 'Files will not be revealed and selected.'),
                    nls.localize('autoReveal.focusNoScroll', 'Files will not be scrolled into view, but will still be focused.'),
                ],
                'description': nls.localize('autoReveal', "Controls whether the explorer should automatically reveal and select files when opening them.")
            },
            'explorer.enableDragAndDrop': {
                'type': 'boolean',
                'description': nls.localize('enableDragAndDrop', "Controls whether the explorer should allow to move files and folders via drag and drop. This setting only effects drag and drop from inside the explorer."),
                'default': true
            },
            'explorer.confirmDragAndDrop': {
                'type': 'boolean',
                'description': nls.localize('confirmDragAndDrop', "Controls whether the explorer should ask for confirmation to move files and folders via drag and drop."),
                'default': true
            },
            'explorer.confirmDelete': {
                'type': 'boolean',
                'description': nls.localize('confirmDelete', "Controls whether the explorer should ask for confirmation when deleting a file via the trash."),
                'default': true
            },
            'explorer.enableUndo': {
                'type': 'boolean',
                'description': nls.localize('enableUndo', "Controls whether the explorer should support undoing file and folder operations."),
                'default': true
            },
            'explorer.confirmUndo': {
                'type': 'string',
                'enum': ["verbose" /* UndoConfirmLevel.Verbose */, "default" /* UndoConfirmLevel.Default */, "light" /* UndoConfirmLevel.Light */],
                'description': nls.localize('confirmUndo', "Controls whether the explorer should ask for confirmation when undoing."),
                'default': "default" /* UndoConfirmLevel.Default */,
                'enumDescriptions': [
                    nls.localize('enableUndo.verbose', 'Explorer will prompt before all undo operations.'),
                    nls.localize('enableUndo.default', 'Explorer will prompt before destructive undo operations.'),
                    nls.localize('enableUndo.light', 'Explorer will not prompt before undo operations when focused.'),
                ],
            },
            'explorer.expandSingleFolderWorkspaces': {
                'type': 'boolean',
                'description': nls.localize('expandSingleFolderWorkspaces', "Controls whether the explorer should expand multi-root workspaces containing only one folder during initilization"),
                'default': true
            },
            'explorer.sortOrder': {
                'type': 'string',
                'enum': ["default" /* SortOrder.Default */, "mixed" /* SortOrder.Mixed */, "filesFirst" /* SortOrder.FilesFirst */, "type" /* SortOrder.Type */, "modified" /* SortOrder.Modified */, "foldersNestsFiles" /* SortOrder.FoldersNestsFiles */],
                'default': "default" /* SortOrder.Default */,
                'enumDescriptions': [
                    nls.localize('sortOrder.default', 'Files and folders are sorted by their names. Folders are displayed before files.'),
                    nls.localize('sortOrder.mixed', 'Files and folders are sorted by their names. Files are interwoven with folders.'),
                    nls.localize('sortOrder.filesFirst', 'Files and folders are sorted by their names. Files are displayed before folders.'),
                    nls.localize('sortOrder.type', 'Files and folders are grouped by extension type then sorted by their names. Folders are displayed before files.'),
                    nls.localize('sortOrder.modified', 'Files and folders are sorted by last modified date in descending order. Folders are displayed before  files.'),
                    nls.localize('sortOrder.foldersNestsFiles', 'Files and folders are sorted by their names. Folders are displayed before files. Files with nested children are displayed before other files.')
                ],
                'markdownDescription': nls.localize('sortOrder', "Controls the property-based sorting of files and folders in the explorer. When `#explorer.fileNesting.enabled#` is enabled, also controls sorting of nested files.")
            },
            'explorer.sortOrderLexicographicOptions': {
                'type': 'string',
                'enum': ["default" /* LexicographicOptions.Default */, "upper" /* LexicographicOptions.Upper */, "lower" /* LexicographicOptions.Lower */, "unicode" /* LexicographicOptions.Unicode */],
                'default': "default" /* LexicographicOptions.Default */,
                'enumDescriptions': [
                    nls.localize('sortOrderLexicographicOptions.default', 'Uppercase and lowercase names are mixed together.'),
                    nls.localize('sortOrderLexicographicOptions.upper', 'Uppercase names are grouped together before lowercase names.'),
                    nls.localize('sortOrderLexicographicOptions.lower', 'Lowercase names are grouped together before uppercase names.'),
                    nls.localize('sortOrderLexicographicOptions.unicode', 'Names are sorted in unicode order.')
                ],
                'description': nls.localize('sortOrderLexicographicOptions', "Controls the lexicographic sorting of file and folder names in the Explorer.")
            },
            'explorer.decorations.colors': {
                type: 'boolean',
                description: nls.localize('explorer.decorations.colors', "Controls whether file decorations should use colors."),
                default: true
            },
            'explorer.decorations.badges': {
                type: 'boolean',
                description: nls.localize('explorer.decorations.badges', "Controls whether file decorations should use badges."),
                default: true
            },
            'explorer.incrementalNaming': {
                'type': 'string',
                enum: ['simple', 'smart'],
                enumDescriptions: [
                    nls.localize('simple', "Appends the word \"copy\" at the end of the duplicated name potentially followed by a number"),
                    nls.localize('smart', "Adds a number at the end of the duplicated name. If some number is already part of the name, tries to increase that number")
                ],
                description: nls.localize('explorer.incrementalNaming', "Controls what naming strategy to use when a giving a new name to a duplicated explorer item on paste."),
                default: 'simple'
            },
            'explorer.compactFolders': {
                'type': 'boolean',
                'description': nls.localize('compressSingleChildFolders', "Controls whether the explorer should render folders in a compact form. In such a form, single child folders will be compressed in a combined tree element. Useful for Java package structures, for example."),
                'default': true
            },
            'explorer.copyRelativePathSeparator': {
                'type': 'string',
                'enum': [
                    '/',
                    '\\',
                    'auto'
                ],
                'enumDescriptions': [
                    nls.localize('copyRelativePathSeparator.slash', "Use slash as path separation character."),
                    nls.localize('copyRelativePathSeparator.backslash', "Use backslash as path separation character."),
                    nls.localize('copyRelativePathSeparator.auto', "Uses operating system specific path separation character."),
                ],
                'description': nls.localize('copyRelativePathSeparator', "The path separation character used when copying relative file paths."),
                'default': 'auto'
            },
            'explorer.fileNesting.enabled': {
                'type': 'boolean',
                scope: 4 /* ConfigurationScope.RESOURCE */,
                'markdownDescription': nls.localize('fileNestingEnabled', "Controls whether file nesting is enabled in the explorer. File nesting allows for related files in a directory to be visually grouped together under a single parent file."),
                'default': false,
            },
            'explorer.fileNesting.expand': {
                'type': 'boolean',
                'markdownDescription': nls.localize('fileNestingExpand', "Controls whether file nests are automatically expanded. `#explorer.fileNesting.enabled#` must be set for this to take effect."),
                'default': true,
            },
            'explorer.fileNesting.patterns': {
                'type': 'object',
                scope: 4 /* ConfigurationScope.RESOURCE */,
                'markdownDescription': nls.localize('fileNestingPatterns', "Controls nesting of files in the explorer. Each __Item__ represents a parent pattern and may contain a single `*` character that matches any string. Each __Value__ represents a comma separated list of the child patterns that should be shown nested under a given parent. Child patterns may contain several special tokens:\n- `${capture}`: Matches the resolved value of the `*` from the parent pattern\n- `${basename}`: Matches the parent file's basename, the `file` in `file.ts`\n- `${extname}`: Matches the parent file's extension, the `ts` in `file.ts`\n- `${dirname}`: Matches the parent file's directory name, the `src` in `src/file.ts`\n- `*`:  Matches any string, may only be used once per child pattern"),
                patternProperties: {
                    '^[^*]*\\*?[^*]*$': {
                        markdownDescription: nls.localize('fileNesting.description', "Each key pattern may contain a single `*` character which will match any string."),
                        type: 'string',
                        pattern: '^([^,*]*\\*?[^,*]*)(, ?[^,*]*\\*?[^,*]*)*$',
                    }
                },
                additionalProperties: false,
                'default': {
                    '*.ts': '${capture}.js',
                    '*.js': '${capture}.js.map, ${capture}.min.js, ${capture}.d.ts',
                    '*.jsx': '${capture}.js',
                    '*.tsx': '${capture}.ts',
                    'tsconfig.json': 'tsconfig.*.json',
                    'package.json': 'package-lock.json, yarn.lock',
                }
            }
        }
    });
    editorExtensions_1.UndoCommand.addImplementation(110, 'explorer', (accessor) => {
        const undoRedoService = accessor.get(undoRedo_1.IUndoRedoService);
        const explorerService = accessor.get(files_3.IExplorerService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const explorerCanUndo = configurationService.getValue().explorer.enableUndo;
        if (explorerService.hasViewFocus() && undoRedoService.canUndo(explorerService_1.UNDO_REDO_SOURCE) && explorerCanUndo) {
            undoRedoService.undo(explorerService_1.UNDO_REDO_SOURCE);
            return true;
        }
        return false;
    });
    editorExtensions_1.RedoCommand.addImplementation(110, 'explorer', (accessor) => {
        const undoRedoService = accessor.get(undoRedo_1.IUndoRedoService);
        const explorerService = accessor.get(files_3.IExplorerService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const explorerCanUndo = configurationService.getValue().explorer.enableUndo;
        if (explorerService.hasViewFocus() && undoRedoService.canRedo(explorerService_1.UNDO_REDO_SOURCE) && explorerCanUndo) {
            undoRedoService.redo(explorerService_1.UNDO_REDO_SOURCE);
            return true;
        }
        return false;
    });
    modesRegistry_1.ModesRegistry.registerLanguage({
        id: files_2.BINARY_TEXT_FILE_MODE,
        aliases: ['Binary'],
        mimetypes: ['text/x-code-binary']
    });
});
//# sourceMappingURL=files.contribution.js.map