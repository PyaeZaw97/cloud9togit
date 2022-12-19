/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/platform/configuration/common/configurationRegistry", "vs/base/common/platform", "vs/workbench/common/configuration", "vs/base/browser/browser"], function (require, exports, platform_1, nls_1, configurationRegistry_1, platform_2, configuration_1, browser_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const registry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    // Configuration
    (function registerConfiguration() {
        // Workbench
        registry.registerConfiguration(Object.assign(Object.assign({}, configuration_1.workbenchConfigurationNodeBase), { 'properties': {
                'workbench.editor.titleScrollbarSizing': {
                    type: 'string',
                    enum: ['default', 'large'],
                    enumDescriptions: [
                        (0, nls_1.localize)('workbench.editor.titleScrollbarSizing.default', "The default size."),
                        (0, nls_1.localize)('workbench.editor.titleScrollbarSizing.large', "Increases the size, so it can be grabbed more easily with the mouse.")
                    ],
                    description: (0, nls_1.localize)('tabScrollbarHeight', "Controls the height of the scrollbars used for tabs and breadcrumbs in the editor title area."),
                    default: 'default',
                },
                'workbench.editor.showTabs': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('showEditorTabs', "Controls whether opened editors should show in tabs or not."),
                    'default': true
                },
                'workbench.editor.wrapTabs': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('wrapTabs', "Controls whether tabs should be wrapped over multiple lines when exceeding available space or whether a scrollbar should appear instead. This value is ignored when `#workbench.editor.showTabs#` is disabled."),
                    'default': false
                },
                'workbench.editor.scrollToSwitchTabs': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'scrollToSwitchTabs' }, "Controls whether scrolling over tabs will open them or not. By default tabs will only reveal upon scrolling, but not open. You can press and hold the Shift-key while scrolling to change this behavior for that duration. This value is ignored when `#workbench.editor.showTabs#` is disabled."),
                    'default': false
                },
                'workbench.editor.highlightModifiedTabs': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('highlightModifiedTabs', "Controls whether a top border is drawn on tabs for editors that have unsaved changes. This value is ignored when `#workbench.editor.showTabs#` is disabled."),
                    'default': false
                },
                'workbench.editor.decorations.badges': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('decorations.badges', "Controls whether editor file decorations should use badges."),
                    'default': true
                },
                'workbench.editor.decorations.colors': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('decorations.colors', "Controls whether editor file decorations should use colors."),
                    'default': true
                },
                'workbench.editor.labelFormat': {
                    'type': 'string',
                    'enum': ['default', 'short', 'medium', 'long'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.labelFormat.default', "Show the name of the file. When tabs are enabled and two files have the same name in one group the distinguishing sections of each file's path are added. When tabs are disabled, the path relative to the workspace folder is shown if the editor is active."),
                        (0, nls_1.localize)('workbench.editor.labelFormat.short', "Show the name of the file followed by its directory name."),
                        (0, nls_1.localize)('workbench.editor.labelFormat.medium', "Show the name of the file followed by its path relative to the workspace folder."),
                        (0, nls_1.localize)('workbench.editor.labelFormat.long', "Show the name of the file followed by its absolute path.")
                    ],
                    'default': 'default',
                    'description': (0, nls_1.localize)({
                        comment: ['This is the description for a setting. Values surrounded by parenthesis are not to be translated.'],
                        key: 'tabDescription'
                    }, "Controls the format of the label for an editor."),
                },
                'workbench.editor.untitled.labelFormat': {
                    'type': 'string',
                    'enum': ['content', 'name'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.untitled.labelFormat.content', "The name of the untitled file is derived from the contents of its first line unless it has an associated file path. It will fallback to the name in case the line is empty or contains no word characters."),
                        (0, nls_1.localize)('workbench.editor.untitled.labelFormat.name', "The name of the untitled file is not derived from the contents of the file."),
                    ],
                    'default': 'content',
                    'description': (0, nls_1.localize)({
                        comment: ['This is the description for a setting. Values surrounded by parenthesis are not to be translated.'],
                        key: 'untitledLabelFormat'
                    }, "Controls the format of the label for an untitled editor."),
                },
                'workbench.editor.untitled.hint': {
                    'type': 'string',
                    'enum': ['text', 'hidden'],
                    'default': 'text',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'untitledHint' }, "Controls if the untitled hint should be inline text in the editor or a floating button or hidden.")
                },
                'workbench.editor.languageDetection': {
                    type: 'boolean',
                    default: true,
                    description: (0, nls_1.localize)('workbench.editor.languageDetection', "Controls whether the language in a text editor is automatically detected unless the language has been explicitly set by the language picker. This can also be scoped by language so you can specify which languages you do not want to be switched off of. This is useful for languages like Markdown that often contain other languages that might trick language detection into thinking it's the embedded language and not Markdown."),
                    scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
                },
                'workbench.editor.historyBasedLanguageDetection': {
                    type: 'boolean',
                    default: true,
                    tags: ['experimental'],
                    description: (0, nls_1.localize)('workbench.editor.historyBasedLanguageDetection', "Enables use of editor history in language detection. This causes automatic language detection to favor languages that have been recently opened and allows for automatic language detection to operate with smaller inputs."),
                },
                'workbench.editor.preferHistoryBasedLanguageDetection': {
                    type: 'boolean',
                    default: false,
                    tags: ['experimental'],
                    description: (0, nls_1.localize)('workbench.editor.preferBasedLanguageDetection', "When enabled, a language detection model that takes into account editor history will be given higher precedence."),
                },
                'workbench.editor.languageDetectionHints': {
                    type: 'object',
                    default: { 'untitledEditors': true, 'notebookEditors': false },
                    tags: ['experimental'],
                    description: (0, nls_1.localize)('workbench.editor.showLanguageDetectionHints', "When enabled, shows a status bar quick fix when the editor language doesn't match detected content language."),
                    additionalProperties: false,
                    properties: {
                        untitledEditors: {
                            type: 'boolean',
                            description: (0, nls_1.localize)('workbench.editor.showLanguageDetectionHints.editors', "Show in untitled text editors"),
                        },
                        notebookEditors: {
                            type: 'boolean',
                            description: (0, nls_1.localize)('workbench.editor.showLanguageDetectionHints.notebook', "Show in notebook editors"),
                        }
                    }
                },
                'workbench.editor.tabCloseButton': {
                    'type': 'string',
                    'enum': ['left', 'right', 'off'],
                    'default': 'right',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'editorTabCloseButton' }, "Controls the position of the editor's tabs close buttons, or disables them when set to 'off'. This value is ignored when `#workbench.editor.showTabs#` is disabled.")
                },
                'workbench.editor.tabSizing': {
                    'type': 'string',
                    'enum': ['fit', 'shrink'],
                    'default': 'fit',
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.tabSizing.fit', "Always keep tabs large enough to show the full editor label."),
                        (0, nls_1.localize)('workbench.editor.tabSizing.shrink', "Allow tabs to get smaller when the available space is not enough to show all tabs at once.")
                    ],
                    'markdownDescription': (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'tabSizing' }, "Controls the sizing of editor tabs. This value is ignored when `#workbench.editor.showTabs#` is disabled.")
                },
                'workbench.editor.pinnedTabSizing': {
                    'type': 'string',
                    'enum': ['normal', 'compact', 'shrink'],
                    'default': 'normal',
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.pinnedTabSizing.normal', "A pinned tab inherits the look of non pinned tabs."),
                        (0, nls_1.localize)('workbench.editor.pinnedTabSizing.compact', "A pinned tab will show in a compact form with only icon or first letter of the editor name."),
                        (0, nls_1.localize)('workbench.editor.pinnedTabSizing.shrink', "A pinned tab shrinks to a compact fixed size showing parts of the editor name.")
                    ],
                    'markdownDescription': (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'pinnedTabSizing' }, "Controls the sizing of pinned editor tabs. Pinned tabs are sorted to the beginning of all opened tabs and typically do not close until unpinned. This value is ignored when `#workbench.editor.showTabs#` is disabled.")
                },
                'workbench.editor.splitSizing': {
                    'type': 'string',
                    'enum': ['distribute', 'split'],
                    'default': 'distribute',
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.splitSizingDistribute', "Splits all the editor groups to equal parts."),
                        (0, nls_1.localize)('workbench.editor.splitSizingSplit', "Splits the active editor group to equal parts.")
                    ],
                    'description': (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'splitSizing' }, "Controls the sizing of editor groups when splitting them.")
                },
                'workbench.editor.splitOnDragAndDrop': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('splitOnDragAndDrop', "Controls if editor groups can be split from drag and drop operations by dropping an editor or file on the edges of the editor area.")
                },
                'workbench.editor.focusRecentEditorAfterClose': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('focusRecentEditorAfterClose', "Controls whether tabs are closed in most recently used order or from left to right."),
                    'default': true
                },
                'workbench.editor.showIcons': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('showIcons', "Controls whether opened editors should show with an icon or not. This requires a file icon theme to be enabled as well."),
                    'default': true
                },
                'workbench.editor.enablePreview': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('enablePreview', "Controls whether opened editors show as preview editors. Preview editors do not stay open, are reused until explicitly set to be kept open (e.g. via double click or editing), and show file names in italics."),
                    'default': true
                },
                'workbench.editor.enablePreviewFromQuickOpen': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('enablePreviewFromQuickOpen', "Controls whether editors opened from Quick Open show as preview editors. Preview editors do not stay open, and are reused until explicitly set to be kept open (e.g. via double click or editing). This value is ignored when `#workbench.editor.enablePreview#` is disabled."),
                    'default': false
                },
                'workbench.editor.enablePreviewFromCodeNavigation': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('enablePreviewFromCodeNavigation', "Controls whether editors remain in preview when a code navigation is started from them. Preview editors do not stay open, and are reused until explicitly set to be kept open (e.g. via double click or editing). This value is ignored when `#workbench.editor.enablePreview#` is disabled."),
                    'default': false
                },
                'workbench.editor.closeOnFileDelete': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('closeOnFileDelete', "Controls whether editors showing a file that was opened during the session should close automatically when getting deleted or renamed by some other process. Disabling this will keep the editor open  on such an event. Note that deleting from within the application will always close the editor and that editors with unsaved changes will never close to preserve your data."),
                    'default': false
                },
                'workbench.editor.openPositioning': {
                    'type': 'string',
                    'enum': ['left', 'right', 'first', 'last'],
                    'default': 'right',
                    'markdownDescription': (0, nls_1.localize)({ comment: ['This is the description for a setting. Values surrounded by single quotes are not to be translated.'], key: 'editorOpenPositioning' }, "Controls where editors open. Select `left` or `right` to open editors to the left or right of the currently active one. Select `first` or `last` to open editors independently from the currently active one.")
                },
                'workbench.editor.openSideBySideDirection': {
                    'type': 'string',
                    'enum': ['right', 'down'],
                    'default': 'right',
                    'markdownDescription': (0, nls_1.localize)('sideBySideDirection', "Controls the default direction of editors that are opened side by side (for example, from the Explorer). By default, editors will open on the right hand side of the currently active one. If changed to `down`, the editors will open below the currently active one.")
                },
                'workbench.editor.closeEmptyGroups': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('closeEmptyGroups', "Controls the behavior of empty editor groups when the last tab in the group is closed. When enabled, empty groups will automatically close. When disabled, empty groups will remain part of the grid."),
                    'default': true
                },
                'workbench.editor.revealIfOpen': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('revealIfOpen', "Controls whether an editor is revealed in any of the visible groups if opened. If disabled, an editor will prefer to open in the currently active editor group. If enabled, an already opened editor will be revealed instead of opened again in the currently active editor group. Note that there are some cases where this setting is ignored, e.g. when forcing an editor to open in a specific group or to the side of the currently active group."),
                    'default': false
                },
                'workbench.editor.mouseBackForwardToNavigate': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('mouseBackForwardToNavigate', "Enables the use of mouse buttons four and five for commands 'Go Back' and 'Go Forward'."),
                    'default': true
                },
                'workbench.editor.navigationScope': {
                    'type': 'string',
                    'enum': ['default', 'editorGroup', 'editor'],
                    'default': 'default',
                    'markdownDescription': (0, nls_1.localize)('navigationScope', "Controls the scope of history navigation in editors for commands such as 'Go Back' and 'Go Forward'."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.navigationScopeDefault', "Navigate across all opened editors and editor groups."),
                        (0, nls_1.localize)('workbench.editor.navigationScopeEditorGroup', "Navigate only in editors of the active editor group."),
                        (0, nls_1.localize)('workbench.editor.navigationScopeEditor', "Navigate only in the active editor.")
                    ],
                },
                'workbench.editor.restoreViewState': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('restoreViewState', "Restores the last editor view state (e.g. scroll position) when re-opening editors after they have been closed. Editor view state is stored per editor group and discarded when a group closes. Use the `#workbench.editor.sharedViewState#` setting to use the last known view state across all editor groups in case no previous view state was found for a editor group."),
                    'default': true,
                    'scope': 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
                },
                'workbench.editor.sharedViewState': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('sharedViewState', "Preserves the most recent editor view state (e.g. scroll position) across all editor groups and restores that if no specific editor view state is found for the editor group."),
                    'default': false
                },
                'workbench.editor.splitInGroupLayout': {
                    'type': 'string',
                    'enum': ['vertical', 'horizontal'],
                    'default': 'horizontal',
                    'markdownDescription': (0, nls_1.localize)('splitInGroupLayout', "Controls the layout for when an editor is split in an editor group to be either vertical or horizontal."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.editor.splitInGroupLayoutVertical', "Editors are positioned from top to bottom."),
                        (0, nls_1.localize)('workbench.editor.splitInGroupLayoutHorizontal', "Editors are positioned from left to right.")
                    ]
                },
                'workbench.editor.centeredLayoutAutoResize': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('centeredLayoutAutoResize', "Controls if the centered layout should automatically resize to maximum width when more than one group is open. Once only one group is open it will resize back to the original centered width.")
                },
                'workbench.editor.limit.enabled': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('limitEditorsEnablement', "Controls if the number of opened editors should be limited or not. When enabled, less recently used editors will close to make space for newly opening editors.")
                },
                'workbench.editor.limit.value': {
                    'type': 'number',
                    'default': 10,
                    'exclusiveMinimum': 0,
                    'markdownDescription': (0, nls_1.localize)('limitEditorsMaximum', "Controls the maximum number of opened editors. Use the `#workbench.editor.limit.perEditorGroup#` setting to control this limit per editor group or across all groups.")
                },
                'workbench.editor.limit.excludeDirty': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('limitEditorsExcludeDirty', "Controls if the maximum number of opened editors should exclude dirty editors for counting towards the configured limit.")
                },
                'workbench.editor.limit.perEditorGroup': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('perEditorGroup', "Controls if the limit of maximum opened editors should apply per editor group or across all editor groups.")
                },
                'workbench.localHistory.enabled': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('localHistoryEnabled', "Controls whether local file history is enabled. When enabled, the file contents of an editor that is saved will be stored to a backup location to be able to restore or review the contents later. Changing this setting has no effect on existing local file history entries."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.localHistory.maxFileSize': {
                    'type': 'number',
                    'default': 256,
                    'minimum': 1,
                    'description': (0, nls_1.localize)('localHistoryMaxFileSize', "Controls the maximum size of a file (in KB) to be considered for local file history. Files that are larger will not be added to the local file history. Changing this setting has no effect on existing local file history entries."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.localHistory.maxFileEntries': {
                    'type': 'number',
                    'default': 50,
                    'minimum': 0,
                    'description': (0, nls_1.localize)('localHistoryMaxFileEntries', "Controls the maximum number of local file history entries per file. When the number of local file history entries exceeds this number for a file, the oldest entries will be discarded."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.localHistory.exclude': {
                    'type': 'object',
                    'markdownDescription': (0, nls_1.localize)('exclude', "Configure [glob patterns](https://code.visualstudio.com/docs/editor/codebasics#_advanced-search-options) for excluding files from the local file history. Changing this setting has no effect on existing local file history entries."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.localHistory.mergeWindow': {
                    'type': 'number',
                    'default': 10,
                    'minimum': 1,
                    'markdownDescription': (0, nls_1.localize)('mergeWindow', "Configure an interval in seconds during which the last entry in local file history is replaced with the entry that is being added. This helps reduce the overall number of entries that are added, for example when auto save is enabled. This setting is only applied to entries that have the same source of origin. Changing this setting has no effect on existing local file history entries."),
                    'scope': 4 /* ConfigurationScope.RESOURCE */
                },
                'workbench.commandPalette.history': {
                    'type': 'number',
                    'description': (0, nls_1.localize)('commandHistory', "Controls the number of recently used commands to keep in history for the command palette. Set to 0 to disable command history."),
                    'default': 50,
                    'minimum': 0
                },
                'workbench.commandPalette.preserveInput': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('preserveInput', "Controls whether the last typed input to the command palette should be restored when opening it the next time."),
                    'default': false
                },
                'workbench.quickOpen.closeOnFocusLost': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('closeOnFocusLost', "Controls whether Quick Open should close automatically once it loses focus."),
                    'default': true
                },
                'workbench.quickOpen.preserveInput': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('workbench.quickOpen.preserveInput', "Controls whether the last typed input to Quick Open should be restored when opening it the next time."),
                    'default': false
                },
                'workbench.settings.openDefaultSettings': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('openDefaultSettings', "Controls whether opening settings also opens an editor showing all default settings."),
                    'default': false
                },
                'workbench.settings.useSplitJSON': {
                    'type': 'boolean',
                    'markdownDescription': (0, nls_1.localize)('useSplitJSON', "Controls whether to use the split JSON editor when editing settings as JSON."),
                    'default': false
                },
                'workbench.settings.openDefaultKeybindings': {
                    'type': 'boolean',
                    'description': (0, nls_1.localize)('openDefaultKeybindings', "Controls whether opening keybinding settings also opens an editor showing all default keybindings."),
                    'default': false
                },
                'workbench.sideBar.location': {
                    'type': 'string',
                    'enum': ['left', 'right'],
                    'default': 'left',
                    'description': (0, nls_1.localize)('sideBarLocation', "Controls the location of the primary side bar and activity bar. They can either show on the left or right of the workbench. The secondary side bar will show on the opposite side of the workbench.")
                },
                'workbench.panel.defaultLocation': {
                    'type': 'string',
                    'enum': ['left', 'bottom', 'right'],
                    'default': 'bottom',
                    'description': (0, nls_1.localize)('panelDefaultLocation', "Controls the default location of the panel (terminal, debug console, output, problems) in a new workspace. It can either show at the bottom, right, or left of the editor area."),
                },
                'workbench.panel.opensMaximized': {
                    'type': 'string',
                    'enum': ['always', 'never', 'preserve'],
                    'default': 'preserve',
                    'description': (0, nls_1.localize)('panelOpensMaximized', "Controls whether the panel opens maximized. It can either always open maximized, never open maximized, or open to the last state it was in before being closed."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.panel.opensMaximized.always', "Always maximize the panel when opening it."),
                        (0, nls_1.localize)('workbench.panel.opensMaximized.never', "Never maximize the panel when opening it. The panel will open un-maximized."),
                        (0, nls_1.localize)('workbench.panel.opensMaximized.preserve', "Open the panel to the state that it was in, before it was closed.")
                    ]
                },
                'workbench.statusBar.visible': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('statusBarVisibility', "Controls the visibility of the status bar at the bottom of the workbench.")
                },
                'workbench.activityBar.visible': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('activityBarVisibility', "Controls the visibility of the activity bar in the workbench.")
                },
                'workbench.activityBar.iconClickBehavior': {
                    'type': 'string',
                    'enum': ['toggle', 'focus'],
                    'default': 'toggle',
                    'description': (0, nls_1.localize)('activityBarIconClickBehavior', "Controls the behavior of clicking an activity bar icon in the workbench."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.activityBar.iconClickBehavior.toggle', "Hide the side bar if the clicked item is already visible."),
                        (0, nls_1.localize)('workbench.activityBar.iconClickBehavior.focus', "Focus side bar if the clicked item is already visible.")
                    ]
                },
                'workbench.view.alwaysShowHeaderActions': {
                    'type': 'boolean',
                    'default': false,
                    'description': (0, nls_1.localize)('viewVisibility', "Controls the visibility of view header actions. View header actions may either be always visible, or only visible when that view is focused or hovered over.")
                },
                'workbench.fontAliasing': {
                    'type': 'string',
                    'enum': ['default', 'antialiased', 'none', 'auto'],
                    'default': 'default',
                    'description': (0, nls_1.localize)('fontAliasing', "Controls font aliasing method in the workbench."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.fontAliasing.default', "Sub-pixel font smoothing. On most non-retina displays this will give the sharpest text."),
                        (0, nls_1.localize)('workbench.fontAliasing.antialiased', "Smooth the font on the level of the pixel, as opposed to the subpixel. Can make the font appear lighter overall."),
                        (0, nls_1.localize)('workbench.fontAliasing.none', "Disables font smoothing. Text will show with jagged sharp edges."),
                        (0, nls_1.localize)('workbench.fontAliasing.auto', "Applies `default` or `antialiased` automatically based on the DPI of displays.")
                    ],
                    'included': platform_2.isMacintosh
                },
                'workbench.settings.editor': {
                    'type': 'string',
                    'enum': ['ui', 'json'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('settings.editor.ui', "Use the settings UI editor."),
                        (0, nls_1.localize)('settings.editor.json', "Use the JSON file editor."),
                    ],
                    'description': (0, nls_1.localize)('settings.editor.desc', "Determines which settings editor to use by default."),
                    'default': 'ui',
                    'scope': 3 /* ConfigurationScope.WINDOW */
                },
                'workbench.hover.delay': {
                    'type': 'number',
                    'description': (0, nls_1.localize)('workbench.hover.delay', "Controls the delay in milliseconds after which the hover is shown for workbench items (ex. some extension provided tree view items). Already visible items may require a refresh before reflecting this setting change."),
                    // Testing has indicated that on Windows and Linux 500 ms matches the native hovers most closely.
                    // On Mac, the delay is 1500.
                    'default': platform_2.isMacintosh ? 1500 : 500,
                    'minimum': 0
                },
                'workbench.reduceMotion': {
                    type: 'string',
                    description: (0, nls_1.localize)('workbench.reduceMotion', "Controls whether the workbench should render with fewer animations."),
                    'enumDescriptions': [
                        (0, nls_1.localize)('workbench.reduceMotion.on', "Always render with reduced motion."),
                        (0, nls_1.localize)('workbench.reduceMotion.off', "Do not render with reduced motion"),
                        (0, nls_1.localize)('workbench.reduceMotion.auto', "Render with reduced motion based on OS configuration."),
                    ],
                    default: 'auto',
                    enum: ['on', 'off', 'auto']
                },
                'workbench.layoutControl.enabled': {
                    'type': 'boolean',
                    'default': true,
                    'markdownDescription': (0, nls_1.localize)({ key: 'layoutControlEnabled', comment: ['{0} is a placeholder for a setting identifier.'] }, "Controls whether the layout controls in the custom title bar is enabled via {0}.", '`#window.titleBarStyle#`'),
                },
                'workbench.layoutControl.type': {
                    'type': 'string',
                    'enum': ['menu', 'toggles', 'both'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('layoutcontrol.type.menu', "Shows a single button with a dropdown of layout options."),
                        (0, nls_1.localize)('layoutcontrol.type.toggles', "Shows several buttons for toggling the visibility of the panels and side bar."),
                        (0, nls_1.localize)('layoutcontrol.type.both', "Shows both the dropdown and toggle buttons."),
                    ],
                    'default': 'both',
                    'description': (0, nls_1.localize)('layoutControlType', "Controls whether the layout control in the custom title bar is displayed as a single menu button or with multiple UI toggles."),
                },
                'workbench.experimental.layoutControl.enabled': {
                    'type': 'boolean',
                    'tags': ['experimental'],
                    'default': false,
                    'markdownDescription': (0, nls_1.localize)({ key: 'layoutControlEnabled', comment: ['{0} is a placeholder for a setting identifier.'] }, "Controls whether the layout controls in the custom title bar is enabled via {0}.", '`#window.titleBarStyle#`'),
                    'markdownDeprecationMessage': (0, nls_1.localize)({ key: 'layoutControlEnabledDeprecation', comment: ['{0} is a placeholder for a setting identifier.'] }, "This setting has been deprecated in favor of {0}", '`#workbench.layoutControl.enabled#`')
                },
                'workbench.experimental.layoutControl.type': {
                    'type': 'string',
                    'enum': ['menu', 'toggles', 'both'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('layoutcontrol.type.menu', "Shows a single button with a dropdown of layout options."),
                        (0, nls_1.localize)('layoutcontrol.type.toggles', "Shows several buttons for toggling the visibility of the panels and side bar."),
                        (0, nls_1.localize)('layoutcontrol.type.both', "Shows both the dropdown and toggle buttons."),
                    ],
                    'tags': ['experimental'],
                    'default': 'both',
                    'description': (0, nls_1.localize)('layoutControlType', "Controls whether the layout control in the custom title bar is displayed as a single menu button or with multiple UI toggles."),
                    'markdownDeprecationMessage': (0, nls_1.localize)({ key: 'layoutControlTypeDeprecation', comment: ['{0} is a placeholder for a setting identifier.'] }, "This setting has been deprecated in favor of {0}", '`#workbench.layoutControl.type#`')
                },
                'workbench.experimental.editor.dropIntoEditor.enabled': {
                    'type': 'boolean',
                    'default': true,
                    'tags': ['experimental'],
                    'markdownDescription': (0, nls_1.localize)('dropIntoEditor', "Controls whether you can drag and drop a file into a text editor by holding down `shift` (instead of opening the file in an editor)."),
                }
            } }));
        // Window
        let windowTitleDescription = (0, nls_1.localize)('windowTitle', "Controls the window title based on the active editor. Variables are substituted based on the context:");
        windowTitleDescription += '\n- ' + [
            (0, nls_1.localize)('activeEditorShort', "`${activeEditorShort}`: the file name (e.g. myFile.txt)."),
            (0, nls_1.localize)('activeEditorMedium', "`${activeEditorMedium}`: the path of the file relative to the workspace folder (e.g. myFolder/myFileFolder/myFile.txt)."),
            (0, nls_1.localize)('activeEditorLong', "`${activeEditorLong}`: the full path of the file (e.g. /Users/Development/myFolder/myFileFolder/myFile.txt)."),
            (0, nls_1.localize)('activeFolderShort', "`${activeFolderShort}`: the name of the folder the file is contained in (e.g. myFileFolder)."),
            (0, nls_1.localize)('activeFolderMedium', "`${activeFolderMedium}`: the path of the folder the file is contained in, relative to the workspace folder (e.g. myFolder/myFileFolder)."),
            (0, nls_1.localize)('activeFolderLong', "`${activeFolderLong}`: the full path of the folder the file is contained in (e.g. /Users/Development/myFolder/myFileFolder)."),
            (0, nls_1.localize)('folderName', "`${folderName}`: name of the workspace folder the file is contained in (e.g. myFolder)."),
            (0, nls_1.localize)('folderPath', "`${folderPath}`: file path of the workspace folder the file is contained in (e.g. /Users/Development/myFolder)."),
            (0, nls_1.localize)('rootName', "`${rootName}`: name of the opened workspace or folder (e.g. myFolder or myWorkspace)."),
            (0, nls_1.localize)('rootPath', "`${rootPath}`: file path of the opened workspace or folder (e.g. /Users/Development/myWorkspace)."),
            (0, nls_1.localize)('appName', "`${appName}`: e.g. VS Code."),
            (0, nls_1.localize)('remoteName', "`${remoteName}`: e.g. SSH"),
            (0, nls_1.localize)('dirty', "`${dirty}`: an indicator for when the active editor has unsaved changes."),
            (0, nls_1.localize)('separator', "`${separator}`: a conditional separator (\" - \") that only shows when surrounded by variables with values or static text.")
        ].join('\n- '); // intentionally concatenated to not produce a string that is too long for translations
        registry.registerConfiguration({
            'id': 'window',
            'order': 8,
            'title': (0, nls_1.localize)('windowConfigurationTitle', "Window"),
            'type': 'object',
            'properties': {
                'window.title': {
                    'type': 'string',
                    'default': (() => {
                        if (platform_2.isMacintosh && platform_2.isNative) {
                            return '${activeEditorShort}${separator}${rootName}'; // macOS has native dirty indicator
                        }
                        const base = '${dirty}${activeEditorShort}${separator}${rootName}${separator}${appName}';
                        if (platform_2.isWeb) {
                            return base + '${separator}${remoteName}'; // Web: always show remote name
                        }
                        return base;
                    })(),
                    'markdownDescription': windowTitleDescription
                },
                'window.titleSeparator': {
                    'type': 'string',
                    'default': platform_2.isMacintosh ? ' \u2014 ' : ' - ',
                    'markdownDescription': (0, nls_1.localize)("window.titleSeparator", "Separator used by `window.title`.")
                },
                'window.menuBarVisibility': {
                    'type': 'string',
                    'enum': ['classic', 'visible', 'toggle', 'hidden', 'compact'],
                    'markdownEnumDescriptions': [
                        (0, nls_1.localize)('window.menuBarVisibility.classic', "Menu is displayed at the top of the window and only hidden in full screen mode."),
                        (0, nls_1.localize)('window.menuBarVisibility.visible', "Menu is always visible at the top of the window even in full screen mode."),
                        platform_2.isMacintosh ?
                            (0, nls_1.localize)('window.menuBarVisibility.toggle.mac', "Menu is hidden but can be displayed at the top of the window by executing the `Focus Application Menu` command.") :
                            (0, nls_1.localize)('window.menuBarVisibility.toggle', "Menu is hidden but can be displayed at the top of the window via the Alt key."),
                        (0, nls_1.localize)('window.menuBarVisibility.hidden', "Menu is always hidden."),
                        (0, nls_1.localize)('window.menuBarVisibility.compact', "Menu is displayed as a compact button in the side bar. This value is ignored when `#window.titleBarStyle#` is `native`.")
                    ],
                    'default': platform_2.isWeb ? 'compact' : 'classic',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': platform_2.isMacintosh ?
                        (0, nls_1.localize)('menuBarVisibility.mac', "Control the visibility of the menu bar. A setting of 'toggle' means that the menu bar is hidden and executing `Focus Application Menu` will show it. A setting of 'compact' will move the menu into the side bar.") :
                        (0, nls_1.localize)('menuBarVisibility', "Control the visibility of the menu bar. A setting of 'toggle' means that the menu bar is hidden and a single press of the Alt key will show it. A setting of 'compact' will move the menu into the side bar."),
                    'included': platform_2.isWindows || platform_2.isLinux || platform_2.isWeb
                },
                'window.enableMenuBarMnemonics': {
                    'type': 'boolean',
                    'default': true,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'description': (0, nls_1.localize)('enableMenuBarMnemonics', "Controls whether the main menus can be opened via Alt-key shortcuts. Disabling mnemonics allows to bind these Alt-key shortcuts to editor commands instead."),
                    'included': platform_2.isWindows || platform_2.isLinux
                },
                'window.customMenuBarAltFocus': {
                    'type': 'boolean',
                    'default': true,
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('customMenuBarAltFocus', "Controls whether the menu bar will be focused by pressing the Alt-key. This setting has no effect on toggling the menu bar with the Alt-key."),
                    'included': platform_2.isWindows || platform_2.isLinux
                },
                'window.openFilesInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off', 'default'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.openFilesInNewWindow.on', "Files will open in a new window."),
                        (0, nls_1.localize)('window.openFilesInNewWindow.off', "Files will open in the window with the files' folder open or the last active window."),
                        platform_2.isMacintosh ?
                            (0, nls_1.localize)('window.openFilesInNewWindow.defaultMac', "Files will open in the window with the files' folder open or the last active window unless opened via the Dock or from Finder.") :
                            (0, nls_1.localize)('window.openFilesInNewWindow.default', "Files will open in a new window unless picked from within the application (e.g. via the File menu).")
                    ],
                    'default': 'off',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': platform_2.isMacintosh ?
                        (0, nls_1.localize)('openFilesInNewWindowMac', "Controls whether files should open in a new window when using a command line or file dialog.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).") :
                        (0, nls_1.localize)('openFilesInNewWindow', "Controls whether files should open in a new window when using a command line or file dialog.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.openFoldersInNewWindow': {
                    'type': 'string',
                    'enum': ['on', 'off', 'default'],
                    'enumDescriptions': [
                        (0, nls_1.localize)('window.openFoldersInNewWindow.on', "Folders will open in a new window."),
                        (0, nls_1.localize)('window.openFoldersInNewWindow.off', "Folders will replace the last active window."),
                        (0, nls_1.localize)('window.openFoldersInNewWindow.default', "Folders will open in a new window unless a folder is picked from within the application (e.g. via the File menu).")
                    ],
                    'default': 'default',
                    'scope': 1 /* ConfigurationScope.APPLICATION */,
                    'markdownDescription': (0, nls_1.localize)('openFoldersInNewWindow', "Controls whether folders should open in a new window or replace the last active window.\nNote that there can still be cases where this setting is ignored (e.g. when using the `--new-window` or `--reuse-window` command line option).")
                },
                'window.confirmBeforeClose': {
                    'type': 'string',
                    'enum': ['always', 'keyboardOnly', 'never'],
                    'enumDescriptions': [
                        platform_2.isWeb ?
                            (0, nls_1.localize)('window.confirmBeforeClose.always.web', "Always try to ask for confirmation. Note that browsers may still decide to close a tab or window without confirmation.") :
                            (0, nls_1.localize)('window.confirmBeforeClose.always', "Always ask for confirmation."),
                        platform_2.isWeb ?
                            (0, nls_1.localize)('window.confirmBeforeClose.keyboardOnly.web', "Only ask for confirmation if a keybinding was used to close the window. Note that detection may not be possible in some cases.") :
                            (0, nls_1.localize)('window.confirmBeforeClose.keyboardOnly', "Only ask for confirmation if a keybinding was used."),
                        platform_2.isWeb ?
                            (0, nls_1.localize)('window.confirmBeforeClose.never.web', "Never explicitly ask for confirmation unless data loss is imminent.") :
                            (0, nls_1.localize)('window.confirmBeforeClose.never', "Never explicitly ask for confirmation.")
                    ],
                    'default': (platform_2.isWeb && !(0, browser_1.isStandalone)()) ? 'keyboardOnly' : 'never',
                    'markdownDescription': platform_2.isWeb ?
                        (0, nls_1.localize)('confirmBeforeCloseWeb', "Controls whether to show a confirmation dialog before closing the browser tab or window. Note that even if enabled, browsers may still decide to close a tab or window without confirmation and that this setting is only a hint that may not work in all cases.") :
                        (0, nls_1.localize)('confirmBeforeClose', "Controls whether to show a confirmation dialog before closing the window or quitting the application."),
                    'scope': 1 /* ConfigurationScope.APPLICATION */
                }
            }
        });
        // Zen Mode
        registry.registerConfiguration({
            'id': 'zenMode',
            'order': 9,
            'title': (0, nls_1.localize)('zenModeConfigurationTitle', "Zen Mode"),
            'type': 'object',
            'properties': {
                'zenMode.fullScreen': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.fullScreen', "Controls whether turning on Zen Mode also puts the workbench into full screen mode.")
                },
                'zenMode.centerLayout': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.centerLayout', "Controls whether turning on Zen Mode also centers the layout.")
                },
                'zenMode.hideTabs': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.hideTabs', "Controls whether turning on Zen Mode also hides workbench tabs.")
                },
                'zenMode.hideStatusBar': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.hideStatusBar', "Controls whether turning on Zen Mode also hides the status bar at the bottom of the workbench.")
                },
                'zenMode.hideActivityBar': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.hideActivityBar', "Controls whether turning on Zen Mode also hides the activity bar either at the left or right of the workbench.")
                },
                'zenMode.hideLineNumbers': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.hideLineNumbers', "Controls whether turning on Zen Mode also hides the editor line numbers.")
                },
                'zenMode.restore': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.restore', "Controls whether a window should restore to zen mode if it was exited in zen mode.")
                },
                'zenMode.silentNotifications': {
                    'type': 'boolean',
                    'default': true,
                    'description': (0, nls_1.localize)('zenMode.silentNotifications', "Controls whether notifications are shown while in zen mode. If true, only error notifications will pop out.")
                }
            }
        });
    })();
});
//# sourceMappingURL=workbench.contribution.js.map