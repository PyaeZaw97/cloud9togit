/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/registry/common/platform", "vs/nls", "vs/workbench/browser/editor", "vs/workbench/common/editor", "vs/workbench/common/contextkeys", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/browser/parts/editor/textResourceEditor", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/services/untitled/common/untitledTextEditorInput", "vs/workbench/common/editor/textResourceEditorInput", "vs/workbench/browser/parts/editor/textDiffEditor", "vs/workbench/browser/parts/editor/binaryDiffEditor", "vs/workbench/browser/parts/editor/editorStatus", "vs/workbench/common/actions", "vs/platform/actions/common/actions", "vs/platform/instantiation/common/descriptors", "vs/base/common/keyCodes", "vs/workbench/browser/parts/editor/editorActions", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/browser/quickaccess", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/contextkey/common/contextkey", "vs/base/common/platform", "vs/editor/browser/editorExtensions", "vs/workbench/browser/codeeditor", "vs/workbench/common/contributions", "vs/workbench/browser/parts/editor/editorAutoSave", "vs/platform/theme/common/themeService", "vs/platform/quickinput/common/quickAccess", "vs/workbench/browser/parts/editor/editorQuickAccess", "vs/base/common/network", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/workbench/services/untitled/common/untitledTextEditorHandler", "vs/workbench/browser/parts/editor/editorConfiguration"], function (require, exports, platform_1, nls_1, editor_1, editor_2, contextkeys_1, sideBySideEditorInput_1, textResourceEditor_1, sideBySideEditor_1, diffEditorInput_1, untitledTextEditorInput_1, textResourceEditorInput_1, textDiffEditor_1, binaryDiffEditor_1, editorStatus_1, actions_1, actions_2, descriptors_1, keyCodes_1, editorActions_1, editorCommands_1, quickaccess_1, keybindingsRegistry_1, contextkey_1, platform_2, editorExtensions_1, codeeditor_1, contributions_1, editorAutoSave_1, themeService_1, quickAccess_1, editorQuickAccess_1, network_1, codicons_1, iconRegistry_1, untitledTextEditorHandler_1, editorConfiguration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    //#region Editor Registrations
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(textResourceEditor_1.TextResourceEditor, textResourceEditor_1.TextResourceEditor.ID, (0, nls_1.localize)('textEditor', "Text Editor")), [
        new descriptors_1.SyncDescriptor(untitledTextEditorInput_1.UntitledTextEditorInput),
        new descriptors_1.SyncDescriptor(textResourceEditorInput_1.TextResourceEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(textDiffEditor_1.TextDiffEditor, textDiffEditor_1.TextDiffEditor.ID, (0, nls_1.localize)('textDiffEditor', "Text Diff Editor")), [
        new descriptors_1.SyncDescriptor(diffEditorInput_1.DiffEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(binaryDiffEditor_1.BinaryResourceDiffEditor, binaryDiffEditor_1.BinaryResourceDiffEditor.ID, (0, nls_1.localize)('binaryDiffEditor', "Binary Diff Editor")), [
        new descriptors_1.SyncDescriptor(diffEditorInput_1.DiffEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(sideBySideEditor_1.SideBySideEditor, sideBySideEditor_1.SideBySideEditor.ID, (0, nls_1.localize)('sideBySideEditor', "Side by Side Editor")), [
        new descriptors_1.SyncDescriptor(sideBySideEditorInput_1.SideBySideEditorInput)
    ]);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(untitledTextEditorInput_1.UntitledTextEditorInput.ID, untitledTextEditorHandler_1.UntitledTextEditorInputSerializer);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(sideBySideEditorInput_1.SideBySideEditorInput.ID, sideBySideEditorInput_1.SideBySideEditorInputSerializer);
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(diffEditorInput_1.DiffEditorInput.ID, diffEditorInput_1.DiffEditorInputSerializer);
    //#endregion
    //#region Workbench Contributions
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(editorAutoSave_1.EditorAutoSave, 2 /* LifecyclePhase.Ready */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(editorStatus_1.EditorStatus, 2 /* LifecyclePhase.Ready */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(untitledTextEditorHandler_1.UntitledTextEditorWorkingCopyEditorHandler, 2 /* LifecyclePhase.Ready */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(editorConfiguration_1.DynamicEditorResolverConfigurations, 2 /* LifecyclePhase.Ready */);
    (0, editorExtensions_1.registerEditorContribution)(codeeditor_1.OpenWorkspaceButtonContribution.ID, codeeditor_1.OpenWorkspaceButtonContribution);
    //#endregion
    //#region Quick Access
    const quickAccessRegistry = platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess);
    const editorPickerContextKey = 'inEditorsPicker';
    const editorPickerContext = contextkey_1.ContextKeyExpr.and(quickaccess_1.inQuickPickContext, contextkey_1.ContextKeyExpr.has(editorPickerContextKey));
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess,
        prefix: editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX,
        contextKey: editorPickerContextKey,
        placeholder: (0, nls_1.localize)('editorQuickAccessPlaceholder', "Type the name of an editor to open it."),
        helpEntries: [{ description: (0, nls_1.localize)('activeGroupEditorsByMostRecentlyUsedQuickAccess', "Show Editors in Active Group by Most Recently Used"), needsEditor: false }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: editorQuickAccess_1.AllEditorsByAppearanceQuickAccess,
        prefix: editorQuickAccess_1.AllEditorsByAppearanceQuickAccess.PREFIX,
        contextKey: editorPickerContextKey,
        placeholder: (0, nls_1.localize)('editorQuickAccessPlaceholder', "Type the name of an editor to open it."),
        helpEntries: [{ description: (0, nls_1.localize)('allEditorsByAppearanceQuickAccess', "Show All Opened Editors By Appearance"), needsEditor: false }]
    });
    quickAccessRegistry.registerQuickAccessProvider({
        ctor: editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess,
        prefix: editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX,
        contextKey: editorPickerContextKey,
        placeholder: (0, nls_1.localize)('editorQuickAccessPlaceholder', "Type the name of an editor to open it."),
        helpEntries: [{ description: (0, nls_1.localize)('allEditorsByMostRecentlyUsedQuickAccess', "Show All Opened Editors By Most Recently Used"), needsEditor: false }]
    });
    //#endregion
    //#region Actions & Commands
    // Editor Status
    const registry = platform_1.Registry.as(actions_1.Extensions.WorkbenchActions);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorStatus_1.ChangeLanguageAction, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 43 /* KeyCode.KeyM */) }), 'Change Language Mode', undefined, contextkey_1.ContextKeyExpr.not('notebookEditorFocused'));
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorStatus_1.ChangeEOLAction), 'Change End of Line Sequence');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorStatus_1.ChangeEncodingAction), 'Change File Encoding');
    // Editor Management
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenNextEditor, { primary: 2048 /* KeyMod.CtrlCmd */ | 12 /* KeyCode.PageDown */, mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 89 /* KeyCode.BracketRight */] } }), 'View: Open Next Editor', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenPreviousEditor, { primary: 2048 /* KeyMod.CtrlCmd */ | 11 /* KeyCode.PageUp */, mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */, secondary: [2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 87 /* KeyCode.BracketLeft */] } }), 'View: Open Previous Editor', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenNextEditorInGroup, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 12 /* KeyCode.PageDown */), mac: { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */) } }), 'View: Open Next Editor in Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenPreviousEditorInGroup, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 11 /* KeyCode.PageUp */), mac: { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */) } }), 'View: Open Previous Editor in Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenNextRecentlyUsedEditorAction), 'View: Open Next Recently Used Editor', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenPreviousRecentlyUsedEditorAction), 'View: Open Previous Recently Used Editor', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenNextRecentlyUsedEditorInGroupAction), 'View: Open Next Recently Used Editor In Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenPreviousRecentlyUsedEditorInGroupAction), 'View: Open Previous Recently Used Editor In Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenFirstEditorInGroup), 'View: Open First Editor in Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.OpenLastEditorInGroup, { primary: 512 /* KeyMod.Alt */ | 21 /* KeyCode.Digit0 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 30 /* KeyCode.Digit9 */], mac: { primary: 256 /* KeyMod.WinCtrl */ | 21 /* KeyCode.Digit0 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 30 /* KeyCode.Digit9 */] } }), 'View: Open Last Editor in Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ReopenClosedEditorAction, { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 50 /* KeyCode.KeyT */ }), 'View: Reopen Closed Editor', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ShowAllEditorsByAppearanceAction, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 46 /* KeyCode.KeyP */), mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 2 /* KeyCode.Tab */ } }), 'View: Show All Editors By Appearance', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ShowAllEditorsByMostRecentlyUsedAction), 'View: Show All Editors By Most Recently Used', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ShowEditorsInActiveGroupByMostRecentlyUsedAction), 'View: Show Editors in Active Group By Most Recently Used', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ClearRecentFilesAction), 'File: Clear Recently Opened', (0, nls_1.localize)('file', "File"));
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.CloseAllEditorsAction, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */) }), 'View: Close All Editors', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.CloseAllEditorGroupsAction, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 53 /* KeyCode.KeyW */) }), 'View: Close All Editor Groups', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.CloseLeftEditorsInGroupAction), 'View: Close Editors to the Left in Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.CloseEditorsInOtherGroupsAction), 'View: Close Editors in Other Groups', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.CloseEditorInAllGroupsAction), 'View: Close Editor in All Groups', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorAction, { primary: 2048 /* KeyMod.CtrlCmd */ | 88 /* KeyCode.Backslash */ }), 'View: Split Editor', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorOrthogonalAction, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 88 /* KeyCode.Backslash */) }), 'View: Split Editor Orthogonal', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorLeftAction), 'View: Split Editor Left', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorRightAction), 'View: Split Editor Right', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorUpAction), 'View: Split Editor Up', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorDownAction), 'View: Split Editor Down', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.JoinTwoGroupsAction), 'View: Join Editor Group with Next Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.JoinAllGroupsAction), 'View: Join All Editor Groups', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateBetweenGroupsAction), 'View: Navigate Between Editor Groups', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ResetGroupSizesAction), 'View: Reset Editor Group Sizes', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ToggleGroupSizesAction), 'View: Toggle Editor Group Sizes', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MaximizeGroupAction), 'View: Maximize Editor Group and Hide Side Bars', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MinimizeOtherGroupsAction), 'View: Maximize Editor Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorLeftInGroupAction, { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 11 /* KeyCode.PageUp */, mac: { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 15 /* KeyCode.LeftArrow */) } }), 'View: Move Editor Left', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorRightInGroupAction, { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 12 /* KeyCode.PageDown */, mac: { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 17 /* KeyCode.RightArrow */) } }), 'View: Move Editor Right', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveGroupLeftAction, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 15 /* KeyCode.LeftArrow */) }), 'View: Move Editor Group Left', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveGroupRightAction, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 17 /* KeyCode.RightArrow */) }), 'View: Move Editor Group Right', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveGroupUpAction, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 16 /* KeyCode.UpArrow */) }), 'View: Move Editor Group Up', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveGroupDownAction, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 18 /* KeyCode.DownArrow */) }), 'View: Move Editor Group Down', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.DuplicateGroupLeftAction), 'View: Duplicate Editor Group Left', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.DuplicateGroupRightAction), 'View: Duplicate Editor Group Right', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.DuplicateGroupUpAction), 'View: Duplicate Editor Group Up', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.DuplicateGroupDownAction), 'View: Duplicate Editor Group Down', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToPreviousGroupAction, { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */, mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 15 /* KeyCode.LeftArrow */ } }), 'View: Move Editor into Previous Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToNextGroupAction, { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */, mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 17 /* KeyCode.RightArrow */ } }), 'View: Move Editor into Next Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToFirstGroupAction, { primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 22 /* KeyCode.Digit1 */, mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 22 /* KeyCode.Digit1 */ } }), 'View: Move Editor into First Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToLastGroupAction, { primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 30 /* KeyCode.Digit9 */, mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 256 /* KeyMod.WinCtrl */ | 30 /* KeyCode.Digit9 */ } }), 'View: Move Editor into Last Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToLeftGroupAction), 'View: Move Editor into Left Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToRightGroupAction), 'View: Move Editor into Right Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToAboveGroupAction), 'View: Move Editor into Group Above', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.MoveEditorToBelowGroupAction), 'View: Move Editor into Group Below', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorToPreviousGroupAction), 'View: Split Editor into Previous Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorToNextGroupAction), 'View: Split Editor into Next Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorToFirstGroupAction), 'View: Split Editor into First Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorToLastGroupAction), 'View: Split Editor into Last Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorToLeftGroupAction), 'View: Split Editor into Left Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorToRightGroupAction), 'View: Split Editor into Right Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorToAboveGroupAction), 'View: Split Editor into Group Above', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.SplitEditorToBelowGroupAction), 'View: Split Editor into Group Below', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusActiveGroupAction), 'View: Focus Active Editor Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusFirstGroupAction, { primary: 2048 /* KeyMod.CtrlCmd */ | 22 /* KeyCode.Digit1 */ }), 'View: Focus First Editor Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusLastGroupAction), 'View: Focus Last Editor Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusPreviousGroup), 'View: Focus Previous Editor Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusNextGroup), 'View: Focus Next Editor Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusLeftGroup, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 15 /* KeyCode.LeftArrow */) }), 'View: Focus Left Editor Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusRightGroup, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 17 /* KeyCode.RightArrow */) }), 'View: Focus Right Editor Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusAboveGroup, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 16 /* KeyCode.UpArrow */) }), 'View: Focus Editor Group Above', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.FocusBelowGroup, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 18 /* KeyCode.DownArrow */) }), 'View: Focus Editor Group Below', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NewEditorGroupLeftAction), 'View: New Editor Group to the Left', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NewEditorGroupRightAction), 'View: New Editor Group to the Right', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NewEditorGroupAboveAction), 'View: New Editor Group Above', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NewEditorGroupBelowAction), 'View: New Editor Group Below', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateForwardAction, { primary: 0, win: { primary: 512 /* KeyMod.Alt */ | 17 /* KeyCode.RightArrow */ }, mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 83 /* KeyCode.Minus */ }, linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 83 /* KeyCode.Minus */ } }), 'Go Forward');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateBackwardsAction, { primary: 0, win: { primary: 512 /* KeyMod.Alt */ | 15 /* KeyCode.LeftArrow */ }, mac: { primary: 256 /* KeyMod.WinCtrl */ | 83 /* KeyCode.Minus */ }, linux: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 83 /* KeyCode.Minus */ } }), 'Go Back');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigatePreviousAction), 'Go Previous');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateForwardInEditsAction), 'Go Forward in Edit Locations');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateBackwardsInEditsAction), 'Go Back in Edit Locations');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigatePreviousInEditsAction), 'Go Previous in Edit Locations');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateToLastEditLocationAction, { primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 47 /* KeyCode.KeyQ */) }), 'Go to Last Edit Location');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateForwardInNavigationsAction), 'Go Forward in Navigation Locations');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateBackwardsInNavigationsAction), 'Go Back in Navigation Locations');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigatePreviousInNavigationsAction), 'Go Previous in Navigation Locations');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.NavigateToLastNavigationLocationAction), 'Go to Last Navigation Location');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ClearEditorHistoryAction), 'Clear Editor History');
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.RevertAndCloseEditorAction), 'View: Revert and Close Editor', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutSingleAction), 'View: Single Column Editor Layout', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutTwoColumnsAction), 'View: Two Columns Editor Layout', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutThreeColumnsAction), 'View: Three Columns Editor Layout', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutTwoRowsAction), 'View: Two Rows Editor Layout', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutThreeRowsAction), 'View: Three Rows Editor Layout', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutTwoByTwoGridAction), 'View: Grid Editor Layout (2x2)', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutTwoRowsRightAction), 'View: Two Rows Right Editor Layout', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.EditorLayoutTwoColumnsBottomAction), 'View: Two Columns Bottom Editor Layout', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ToggleEditorTypeAction), 'View: Toggle Editor Type', actions_1.CATEGORIES.View.value, contextkeys_1.ActiveEditorAvailableEditorIdsContext);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.ReOpenInTextEditorAction), 'View: Reopen Editor With Text Editor', actions_1.CATEGORIES.View.value, contextkeys_1.ActiveEditorAvailableEditorIdsContext);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.QuickAccessPreviousRecentlyUsedEditorAction), 'View: Quick Open Previous Recently Used Editor', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.QuickAccessLeastRecentlyUsedEditorAction), 'View: Quick Open Least Recently Used Editor', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.QuickAccessPreviousRecentlyUsedEditorInGroupAction, { primary: 2048 /* KeyMod.CtrlCmd */ | 2 /* KeyCode.Tab */, mac: { primary: 256 /* KeyMod.WinCtrl */ | 2 /* KeyCode.Tab */ } }, contextkeys_1.ActiveEditorGroupEmptyContext.toNegated()), 'View: Quick Open Previous Recently Used Editor in Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.QuickAccessLeastRecentlyUsedEditorInGroupAction, { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */, mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */ } }, contextkeys_1.ActiveEditorGroupEmptyContext.toNegated()), 'View: Quick Open Least Recently Used Editor in Group', actions_1.CATEGORIES.View.value);
    registry.registerWorkbenchAction(actions_2.SyncActionDescriptor.from(editorActions_1.QuickAccessPreviousEditorFromHistoryAction), 'Quick Open Previous Editor from History');
    const quickAccessNavigateNextInEditorPickerId = 'workbench.action.quickOpenNavigateNextInEditorPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigateNextInEditorPickerId,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigateNextInEditorPickerId, true),
        when: editorPickerContext,
        primary: 2048 /* KeyMod.CtrlCmd */ | 2 /* KeyCode.Tab */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 2 /* KeyCode.Tab */ }
    });
    const quickAccessNavigatePreviousInEditorPickerId = 'workbench.action.quickOpenNavigatePreviousInEditorPicker';
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: quickAccessNavigatePreviousInEditorPickerId,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 50,
        handler: (0, quickaccess_1.getQuickNavigateHandler)(quickAccessNavigatePreviousInEditorPickerId, false),
        when: editorPickerContext,
        primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 1024 /* KeyMod.Shift */ | 2 /* KeyCode.Tab */ }
    });
    (0, editorCommands_1.setup)();
    //#endregion Workbench Actions
    //#region Menus
    // macOS: Touchbar
    if (platform_2.isMacintosh) {
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TouchBarContext, {
            command: { id: editorActions_1.NavigateBackwardsAction.ID, title: editorActions_1.NavigateBackwardsAction.LABEL, icon: { dark: network_1.FileAccess.asFileUri('vs/workbench/browser/parts/editor/media/back-tb.png', require) } },
            group: 'navigation',
            order: 0
        });
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.TouchBarContext, {
            command: { id: editorActions_1.NavigateForwardAction.ID, title: editorActions_1.NavigateForwardAction.LABEL, icon: { dark: network_1.FileAccess.asFileUri('vs/workbench/browser/parts/editor/media/forward-tb.png', require) } },
            group: 'navigation',
            order: 1
        });
    }
    // Empty Editor Group Toolbar
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EmptyEditorGroup, { command: { id: editorCommands_1.UNLOCK_GROUP_COMMAND_ID, title: (0, nls_1.localize)('unlockGroupAction', "Unlock Group"), icon: codicons_1.Codicon.lock }, group: 'navigation', order: 10, when: contextkeys_1.ActiveEditorGroupLockedContext });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EmptyEditorGroup, { command: { id: editorCommands_1.CLOSE_EDITOR_GROUP_COMMAND_ID, title: (0, nls_1.localize)('closeGroupAction', "Close Group"), icon: codicons_1.Codicon.close }, group: 'navigation', order: 20 });
    // Empty Editor Group Context Menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.SPLIT_EDITOR_UP, title: (0, nls_1.localize)('splitUp', "Split Up") }, group: '2_split', order: 10 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.SPLIT_EDITOR_DOWN, title: (0, nls_1.localize)('splitDown', "Split Down") }, group: '2_split', order: 20 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.SPLIT_EDITOR_LEFT, title: (0, nls_1.localize)('splitLeft', "Split Left") }, group: '2_split', order: 30 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.SPLIT_EDITOR_RIGHT, title: (0, nls_1.localize)('splitRight', "Split Right") }, group: '2_split', order: 40 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.TOGGLE_LOCK_GROUP_COMMAND_ID, title: (0, nls_1.localize)('toggleLockGroup', "Lock Group"), toggled: contextkeys_1.ActiveEditorGroupLockedContext }, group: '3_lock', order: 10, when: contextkeys_1.MultipleEditorGroupsContext });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EmptyEditorGroupContext, { command: { id: editorCommands_1.CLOSE_EDITOR_GROUP_COMMAND_ID, title: (0, nls_1.localize)('close', "Close") }, group: '4_close', order: 10, when: contextkeys_1.MultipleEditorGroupsContext });
    // Editor Title Context Menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID, title: (0, nls_1.localize)('close', "Close") }, group: '1_close', order: 10 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID, title: (0, nls_1.localize)('closeOthers', "Close Others"), precondition: contextkeys_1.EditorGroupEditorsCountContext.notEqualsTo('1') }, group: '1_close', order: 20 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID, title: (0, nls_1.localize)('closeRight', "Close to the Right"), precondition: contextkeys_1.ActiveEditorLastInGroupContext.toNegated() }, group: '1_close', order: 30, when: contextkeys_1.EditorTabsVisibleContext });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID, title: (0, nls_1.localize)('closeAllSaved', "Close Saved") }, group: '1_close', order: 40 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: (0, nls_1.localize)('closeAll', "Close All") }, group: '1_close', order: 50 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.REOPEN_WITH_COMMAND_ID, title: (0, nls_1.localize)('reopenWith', "Reopen Editor With...") }, group: '1_open', order: 10, when: contextkeys_1.ActiveEditorAvailableEditorIdsContext });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.KEEP_EDITOR_COMMAND_ID, title: (0, nls_1.localize)('keepOpen', "Keep Open"), precondition: contextkeys_1.ActiveEditorPinnedContext.toNegated() }, group: '3_preview', order: 10, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.enablePreview') });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.PIN_EDITOR_COMMAND_ID, title: (0, nls_1.localize)('pin', "Pin") }, group: '3_preview', order: 20, when: contextkeys_1.ActiveEditorStickyContext.toNegated() });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.UNPIN_EDITOR_COMMAND_ID, title: (0, nls_1.localize)('unpin', "Unpin") }, group: '3_preview', order: 20, when: contextkeys_1.ActiveEditorStickyContext });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_UP, title: (0, nls_1.localize)('splitUp', "Split Up") }, group: '5_split', order: 10 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_DOWN, title: (0, nls_1.localize)('splitDown', "Split Down") }, group: '5_split', order: 20 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_LEFT, title: (0, nls_1.localize)('splitLeft', "Split Left") }, group: '5_split', order: 30 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_RIGHT, title: (0, nls_1.localize)('splitRight', "Split Right") }, group: '5_split', order: 40 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.SPLIT_EDITOR_IN_GROUP, title: (0, nls_1.localize)('splitInGroup', "Split in Group") }, group: '6_split_in_group', order: 10, when: contextkeys_1.ActiveEditorCanSplitInGroupContext });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitleContext, { command: { id: editorCommands_1.JOIN_EDITOR_IN_GROUP, title: (0, nls_1.localize)('joinInGroup', "Join in Group") }, group: '6_split_in_group', order: 10, when: contextkeys_1.SideBySideEditorActiveContext });
    // Editor Title Menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, { command: { id: editorCommands_1.TOGGLE_DIFF_SIDE_BY_SIDE, title: (0, nls_1.localize)('inlineView', "Inline View"), toggled: contextkey_1.ContextKeyExpr.equals('config.diffEditor.renderSideBySide', false) }, group: '1_diff', order: 10, when: contextkey_1.ContextKeyExpr.has('isInDiffEditor') });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, { command: { id: editorCommands_1.SHOW_EDITORS_IN_GROUP, title: (0, nls_1.localize)('showOpenedEditors', "Show Opened Editors") }, group: '3_open', order: 10 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, { command: { id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: (0, nls_1.localize)('closeAll', "Close All") }, group: '5_close', order: 10 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, { command: { id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID, title: (0, nls_1.localize)('closeAllSaved', "Close Saved") }, group: '5_close', order: 20 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, { command: { id: editorCommands_1.TOGGLE_KEEP_EDITORS_COMMAND_ID, title: (0, nls_1.localize)('toggleKeepEditors', "Keep Editors Open"), toggled: contextkey_1.ContextKeyExpr.not('config.workbench.editor.enablePreview') }, group: '7_settings', order: 10 });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, { command: { id: editorCommands_1.TOGGLE_LOCK_GROUP_COMMAND_ID, title: (0, nls_1.localize)('lockGroup', "Lock Group"), toggled: contextkeys_1.ActiveEditorGroupLockedContext }, group: '8_lock', order: 10, when: contextkeys_1.MultipleEditorGroupsContext });
    function appendEditorToolItem(primary, when, order, alternative, precondition) {
        const item = {
            command: {
                id: primary.id,
                title: primary.title,
                icon: primary.icon,
                precondition
            },
            group: 'navigation',
            when,
            order
        };
        if (alternative) {
            item.alt = {
                id: alternative.id,
                title: alternative.title,
                icon: alternative.icon
            };
        }
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.EditorTitle, item);
    }
    const SPLIT_ORDER = 100000; // towards the end
    const CLOSE_ORDER = 1000000; // towards the far end
    // Editor Title Menu: Split Editor
    appendEditorToolItem({
        id: editorActions_1.SplitEditorAction.ID,
        title: (0, nls_1.localize)('splitEditorRight', "Split Editor Right"),
        icon: codicons_1.Codicon.splitHorizontal
    }, contextkey_1.ContextKeyExpr.not('splitEditorsVertically'), SPLIT_ORDER, {
        id: editorCommands_1.SPLIT_EDITOR_DOWN,
        title: (0, nls_1.localize)('splitEditorDown', "Split Editor Down"),
        icon: codicons_1.Codicon.splitVertical
    });
    appendEditorToolItem({
        id: editorActions_1.SplitEditorAction.ID,
        title: (0, nls_1.localize)('splitEditorDown', "Split Editor Down"),
        icon: codicons_1.Codicon.splitVertical
    }, contextkey_1.ContextKeyExpr.has('splitEditorsVertically'), SPLIT_ORDER, {
        id: editorCommands_1.SPLIT_EDITOR_RIGHT,
        title: (0, nls_1.localize)('splitEditorRight', "Split Editor Right"),
        icon: codicons_1.Codicon.splitHorizontal
    });
    // Side by side: layout
    appendEditorToolItem({
        id: editorCommands_1.TOGGLE_SPLIT_EDITOR_IN_GROUP_LAYOUT,
        title: (0, nls_1.localize)('toggleSplitEditorInGroupLayout', "Toggle Layout"),
        icon: codicons_1.Codicon.editorLayout
    }, contextkeys_1.SideBySideEditorActiveContext, SPLIT_ORDER - 1);
    // Editor Title Menu: Close (tabs disabled, normal editor)
    appendEditorToolItem({
        id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('close', "Close"),
        icon: codicons_1.Codicon.close
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorTabsVisibleContext.toNegated(), contextkeys_1.ActiveEditorDirtyContext.toNegated(), contextkeys_1.ActiveEditorStickyContext.toNegated()), CLOSE_ORDER, {
        id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
        title: (0, nls_1.localize)('closeAll', "Close All"),
        icon: codicons_1.Codicon.closeAll
    });
    // Editor Title Menu: Close (tabs disabled, dirty editor)
    appendEditorToolItem({
        id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('close', "Close"),
        icon: codicons_1.Codicon.closeDirty
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorTabsVisibleContext.toNegated(), contextkeys_1.ActiveEditorDirtyContext, contextkeys_1.ActiveEditorStickyContext.toNegated()), CLOSE_ORDER, {
        id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
        title: (0, nls_1.localize)('closeAll', "Close All"),
        icon: codicons_1.Codicon.closeAll
    });
    // Editor Title Menu: Close (tabs disabled, sticky editor)
    appendEditorToolItem({
        id: editorCommands_1.UNPIN_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('unpin', "Unpin"),
        icon: codicons_1.Codicon.pinned
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorTabsVisibleContext.toNegated(), contextkeys_1.ActiveEditorDirtyContext.toNegated(), contextkeys_1.ActiveEditorStickyContext), CLOSE_ORDER, {
        id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('close', "Close"),
        icon: codicons_1.Codicon.close
    });
    // Editor Title Menu: Close (tabs disabled, dirty & sticky editor)
    appendEditorToolItem({
        id: editorCommands_1.UNPIN_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('unpin', "Unpin"),
        icon: codicons_1.Codicon.pinnedDirty
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.EditorTabsVisibleContext.toNegated(), contextkeys_1.ActiveEditorDirtyContext, contextkeys_1.ActiveEditorStickyContext), CLOSE_ORDER, {
        id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID,
        title: (0, nls_1.localize)('close', "Close"),
        icon: codicons_1.Codicon.close
    });
    // Unlock Group: only when group is locked
    appendEditorToolItem({
        id: editorCommands_1.UNLOCK_GROUP_COMMAND_ID,
        title: (0, nls_1.localize)('unlockEditorGroup', "Unlock Group"),
        icon: codicons_1.Codicon.lock
    }, contextkeys_1.ActiveEditorGroupLockedContext, CLOSE_ORDER - 1);
    const previousChangeIcon = (0, iconRegistry_1.registerIcon)('diff-editor-previous-change', codicons_1.Codicon.arrowUp, (0, nls_1.localize)('previousChangeIcon', 'Icon for the previous change action in the diff editor.'));
    const nextChangeIcon = (0, iconRegistry_1.registerIcon)('diff-editor-next-change', codicons_1.Codicon.arrowDown, (0, nls_1.localize)('nextChangeIcon', 'Icon for the next change action in the diff editor.'));
    const toggleWhitespace = (0, iconRegistry_1.registerIcon)('diff-editor-toggle-whitespace', codicons_1.Codicon.whitespace, (0, nls_1.localize)('toggleWhitespace', 'Icon for the toggle whitespace action in the diff editor.'));
    // Diff Editor Title Menu: Previous Change
    appendEditorToolItem({
        id: editorCommands_1.GOTO_PREVIOUS_CHANGE,
        title: (0, nls_1.localize)('navigate.prev.label', "Previous Change"),
        icon: previousChangeIcon
    }, contextkeys_1.TextCompareEditorActiveContext, 10);
    // Diff Editor Title Menu: Next Change
    appendEditorToolItem({
        id: editorCommands_1.GOTO_NEXT_CHANGE,
        title: (0, nls_1.localize)('navigate.next.label', "Next Change"),
        icon: nextChangeIcon
    }, contextkeys_1.TextCompareEditorActiveContext, 11);
    // Diff Editor Title Menu: Toggle Ignore Trim Whitespace (Enabled)
    appendEditorToolItem({
        id: editorCommands_1.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE,
        title: (0, nls_1.localize)('ignoreTrimWhitespace.label', "Ignore Leading/Trailing Whitespace Differences"),
        icon: toggleWhitespace
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.TextCompareEditorActiveContext, contextkey_1.ContextKeyExpr.notEquals('config.diffEditor.ignoreTrimWhitespace', true)), 20);
    // Diff Editor Title Menu: Toggle Ignore Trim Whitespace (Disabled)
    appendEditorToolItem({
        id: editorCommands_1.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE,
        title: (0, nls_1.localize)('showTrimWhitespace.label', "Show Leading/Trailing Whitespace Differences"),
        icon: themeService_1.ThemeIcon.modify(toggleWhitespace, 'disabled')
    }, contextkey_1.ContextKeyExpr.and(contextkeys_1.TextCompareEditorActiveContext, contextkey_1.ContextKeyExpr.notEquals('config.diffEditor.ignoreTrimWhitespace', false)), 20);
    // Editor Commands for Command Palette
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands_1.KEEP_EDITOR_COMMAND_ID, title: { value: (0, nls_1.localize)('keepEditor', "Keep Editor"), original: 'Keep Editor' }, category: actions_1.CATEGORIES.View }, when: contextkey_1.ContextKeyExpr.has('config.workbench.editor.enablePreview') });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands_1.PIN_EDITOR_COMMAND_ID, title: { value: (0, nls_1.localize)('pinEditor', "Pin Editor"), original: 'Pin Editor' }, category: actions_1.CATEGORIES.View } });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands_1.UNPIN_EDITOR_COMMAND_ID, title: { value: (0, nls_1.localize)('unpinEditor', "Unpin Editor"), original: 'Unpin Editor' }, category: actions_1.CATEGORIES.View } });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_EDITOR_COMMAND_ID, title: { value: (0, nls_1.localize)('closeEditor', "Close Editor"), original: 'Close Editor' }, category: actions_1.CATEGORIES.View } });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_PINNED_EDITOR_COMMAND_ID, title: { value: (0, nls_1.localize)('closePinnedEditor', "Close Pinned Editor"), original: 'Close Pinned Editor' }, category: actions_1.CATEGORIES.View } });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_EDITORS_IN_GROUP_COMMAND_ID, title: { value: (0, nls_1.localize)('closeEditorsInGroup', "Close All Editors in Group"), original: 'Close All Editors in Group' }, category: actions_1.CATEGORIES.View } });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_SAVED_EDITORS_COMMAND_ID, title: { value: (0, nls_1.localize)('closeSavedEditors', "Close Saved Editors in Group"), original: 'Close Saved Editors in Group' }, category: actions_1.CATEGORIES.View } });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID, title: { value: (0, nls_1.localize)('closeOtherEditors', "Close Other Editors in Group"), original: 'Close Other Editors in Group' }, category: actions_1.CATEGORIES.View } });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID, title: { value: (0, nls_1.localize)('closeRightEditors', "Close Editors to the Right in Group"), original: 'Close Editors to the Right in Group' }, category: actions_1.CATEGORIES.View }, when: contextkeys_1.ActiveEditorLastInGroupContext.toNegated() });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands_1.CLOSE_EDITORS_AND_GROUP_COMMAND_ID, title: { value: (0, nls_1.localize)('closeEditorGroup', "Close Editor Group"), original: 'Close Editor Group' }, category: actions_1.CATEGORIES.View }, when: contextkeys_1.MultipleEditorGroupsContext });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, { command: { id: editorCommands_1.REOPEN_WITH_COMMAND_ID, title: { value: (0, nls_1.localize)('reopenWith', "Reopen Editor With..."), original: 'Reopen Editor With...' }, category: actions_1.CATEGORIES.View }, when: contextkeys_1.ActiveEditorAvailableEditorIdsContext });
    // File menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarRecentMenu, {
        group: '1_editor',
        command: {
            id: editorActions_1.ReopenClosedEditorAction.ID,
            title: (0, nls_1.localize)({ key: 'miReopenClosedEditor', comment: ['&& denotes a mnemonic'] }, "&&Reopen Closed Editor"),
            precondition: contextkey_1.ContextKeyExpr.has('canReopenClosedEditor')
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarRecentMenu, {
        group: 'z_clear',
        command: {
            id: editorActions_1.ClearRecentFilesAction.ID,
            title: (0, nls_1.localize)({ key: 'miClearRecentOpen', comment: ['&& denotes a mnemonic'] }, "&&Clear Recently Opened")
        },
        order: 1
    });
    // Layout menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarViewMenu, {
        group: '2_appearance',
        title: (0, nls_1.localize)({ key: 'miEditorLayout', comment: ['&& denotes a mnemonic'] }, "Editor &&Layout"),
        submenu: actions_2.MenuId.MenubarLayoutMenu,
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_UP,
            title: {
                original: 'Split Up',
                value: (0, nls_1.localize)('miSplitEditorUpWithoutMnemonic', "Split Up"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorUp', comment: ['&& denotes a mnemonic'] }, "Split &&Up"),
            }
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_DOWN,
            title: {
                original: 'Split Down',
                value: (0, nls_1.localize)('miSplitEditorDownWithoutMnemonic', "Split Down"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorDown', comment: ['&& denotes a mnemonic'] }, "Split &&Down")
            }
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_LEFT,
            title: {
                original: 'Split Left',
                value: (0, nls_1.localize)('miSplitEditorLeftWithoutMnemonic', "Split Left"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorLeft', comment: ['&& denotes a mnemonic'] }, "Split &&Left")
            }
        },
        order: 3
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '1_split',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_RIGHT,
            title: {
                original: 'Split Right',
                value: (0, nls_1.localize)('miSplitEditorRightWithoutMnemonic', "Split Right"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorRight', comment: ['&& denotes a mnemonic'] }, "Split &&Right")
            }
        },
        order: 4
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '2_split_in_group',
        command: {
            id: editorCommands_1.SPLIT_EDITOR_IN_GROUP,
            title: {
                original: 'Split in Group',
                value: (0, nls_1.localize)('miSplitEditorInGroupWithoutMnemonic', "Split in Group"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSplitEditorInGroup', comment: ['&& denotes a mnemonic'] }, "Split in &&Group")
            }
        },
        when: contextkeys_1.ActiveEditorCanSplitInGroupContext,
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '2_split_in_group',
        command: {
            id: editorCommands_1.JOIN_EDITOR_IN_GROUP,
            title: {
                original: 'Join in Group',
                value: (0, nls_1.localize)('miJoinEditorInGroupWithoutMnemonic', "Join in Group"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miJoinEditorInGroup', comment: ['&& denotes a mnemonic'] }, "Join in &&Group")
            }
        },
        when: contextkeys_1.SideBySideEditorActiveContext,
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '3_layouts',
        command: {
            id: editorActions_1.EditorLayoutSingleAction.ID,
            title: {
                original: 'Single',
                value: (0, nls_1.localize)('miSingleColumnEditorLayoutWithoutMnemonic', "Single"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miSingleColumnEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Single")
            }
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '3_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoColumnsAction.ID,
            title: {
                original: 'Two Columns',
                value: (0, nls_1.localize)('miTwoColumnsEditorLayoutWithoutMnemonic', "Two Columns"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoColumnsEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Two Columns")
            }
        },
        order: 3
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '3_layouts',
        command: {
            id: editorActions_1.EditorLayoutThreeColumnsAction.ID,
            title: {
                original: 'Three Columns',
                value: (0, nls_1.localize)('miThreeColumnsEditorLayoutWithoutMnemonic', "Three Columns"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miThreeColumnsEditorLayout', comment: ['&& denotes a mnemonic'] }, "T&&hree Columns")
            }
        },
        order: 4
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '3_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoRowsAction.ID,
            title: {
                original: 'Two Rows',
                value: (0, nls_1.localize)('miTwoRowsEditorLayoutWithoutMnemonic', "Two Rows"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoRowsEditorLayout', comment: ['&& denotes a mnemonic'] }, "T&&wo Rows")
            }
        },
        order: 5
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '3_layouts',
        command: {
            id: editorActions_1.EditorLayoutThreeRowsAction.ID,
            title: {
                original: 'Three Rows',
                value: (0, nls_1.localize)('miThreeRowsEditorLayoutWithoutMnemonic', "Three Rows"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miThreeRowsEditorLayout', comment: ['&& denotes a mnemonic'] }, "Three &&Rows")
            }
        },
        order: 6
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '3_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoByTwoGridAction.ID,
            title: {
                original: 'Grid (2x2)',
                value: (0, nls_1.localize)('miTwoByTwoGridEditorLayoutWithoutMnemonic', "Grid (2x2)"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoByTwoGridEditorLayout', comment: ['&& denotes a mnemonic'] }, "&&Grid (2x2)")
            }
        },
        order: 7
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '3_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoRowsRightAction.ID,
            title: {
                original: 'Two Rows Right',
                value: (0, nls_1.localize)('miTwoRowsRightEditorLayoutWithoutMnemonic', "Two Rows Right"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoRowsRightEditorLayout', comment: ['&& denotes a mnemonic'] }, "Two R&&ows Right")
            }
        },
        order: 8
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '3_layouts',
        command: {
            id: editorActions_1.EditorLayoutTwoColumnsBottomAction.ID,
            title: {
                original: 'Two Columns Bottom',
                value: (0, nls_1.localize)('miTwoColumnsBottomEditorLayoutWithoutMnemonic', "Two Columns Bottom"),
                mnemonicTitle: (0, nls_1.localize)({ key: 'miTwoColumnsBottomEditorLayout', comment: ['&& denotes a mnemonic'] }, "Two &&Columns Bottom")
            }
        },
        order: 9
    });
    // Main Menu Bar Contributions:
    // Forward/Back
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '1_history_nav',
        command: {
            id: 'workbench.action.navigateBack',
            title: (0, nls_1.localize)({ key: 'miBack', comment: ['&& denotes a mnemonic'] }, "&&Back"),
            precondition: contextkey_1.ContextKeyExpr.has('canNavigateBack')
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '1_history_nav',
        command: {
            id: 'workbench.action.navigateForward',
            title: (0, nls_1.localize)({ key: 'miForward', comment: ['&& denotes a mnemonic'] }, "&&Forward"),
            precondition: contextkey_1.ContextKeyExpr.has('canNavigateForward')
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '1_history_nav',
        command: {
            id: 'workbench.action.navigateToLastEditLocation',
            title: (0, nls_1.localize)({ key: 'miLastEditLocation', comment: ['&& denotes a mnemonic'] }, "&&Last Edit Location"),
            precondition: contextkey_1.ContextKeyExpr.has('canNavigateToLastEditLocation')
        },
        order: 3
    });
    // Switch Editor
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '1_sideBySide',
        command: {
            id: editorCommands_1.FOCUS_FIRST_SIDE_EDITOR,
            title: (0, nls_1.localize)({ key: 'miFirstSideEditor', comment: ['&& denotes a mnemonic'] }, "&&First Side in Editor")
        },
        when: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '1_sideBySide',
        command: {
            id: editorCommands_1.FOCUS_SECOND_SIDE_EDITOR,
            title: (0, nls_1.localize)({ key: 'miSecondSideEditor', comment: ['&& denotes a mnemonic'] }, "&&Second Side in Editor")
        },
        when: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '2_any',
        command: {
            id: 'workbench.action.nextEditor',
            title: (0, nls_1.localize)({ key: 'miNextEditor', comment: ['&& denotes a mnemonic'] }, "&&Next Editor")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '2_any',
        command: {
            id: 'workbench.action.previousEditor',
            title: (0, nls_1.localize)({ key: 'miPreviousEditor', comment: ['&& denotes a mnemonic'] }, "&&Previous Editor")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '3_any_used',
        command: {
            id: 'workbench.action.openNextRecentlyUsedEditor',
            title: (0, nls_1.localize)({ key: 'miNextRecentlyUsedEditor', comment: ['&& denotes a mnemonic'] }, "&&Next Used Editor")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '3_any_used',
        command: {
            id: 'workbench.action.openPreviousRecentlyUsedEditor',
            title: (0, nls_1.localize)({ key: 'miPreviousRecentlyUsedEditor', comment: ['&& denotes a mnemonic'] }, "&&Previous Used Editor")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '4_group',
        command: {
            id: 'workbench.action.nextEditorInGroup',
            title: (0, nls_1.localize)({ key: 'miNextEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Editor in Group")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '4_group',
        command: {
            id: 'workbench.action.previousEditorInGroup',
            title: (0, nls_1.localize)({ key: 'miPreviousEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Editor in Group")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '5_group_used',
        command: {
            id: 'workbench.action.openNextRecentlyUsedEditorInGroup',
            title: (0, nls_1.localize)({ key: 'miNextUsedEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Used Editor in Group")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchEditorMenu, {
        group: '5_group_used',
        command: {
            id: 'workbench.action.openPreviousRecentlyUsedEditorInGroup',
            title: (0, nls_1.localize)({ key: 'miPreviousUsedEditorInGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Used Editor in Group")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '2_editor_nav',
        title: (0, nls_1.localize)({ key: 'miSwitchEditor', comment: ['&& denotes a mnemonic'] }, "Switch &&Editor"),
        submenu: actions_2.MenuId.MenubarSwitchEditorMenu,
        order: 1
    });
    // Switch Group
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFirstEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusFirstGroup', comment: ['&& denotes a mnemonic'] }, "Group &&1")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusSecondEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusSecondGroup', comment: ['&& denotes a mnemonic'] }, "Group &&2")
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusThirdEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusThirdGroup', comment: ['&& denotes a mnemonic'] }, "Group &&3"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 3
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFourthEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusFourthGroup', comment: ['&& denotes a mnemonic'] }, "Group &&4"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 4
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '1_focus_index',
        command: {
            id: 'workbench.action.focusFifthEditorGroup',
            title: (0, nls_1.localize)({ key: 'miFocusFifthGroup', comment: ['&& denotes a mnemonic'] }, "Group &&5"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 5
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '2_next_prev',
        command: {
            id: 'workbench.action.focusNextGroup',
            title: (0, nls_1.localize)({ key: 'miNextGroup', comment: ['&& denotes a mnemonic'] }, "&&Next Group"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '2_next_prev',
        command: {
            id: 'workbench.action.focusPreviousGroup',
            title: (0, nls_1.localize)({ key: 'miPreviousGroup', comment: ['&& denotes a mnemonic'] }, "&&Previous Group"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusLeftGroup',
            title: (0, nls_1.localize)({ key: 'miFocusLeftGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Left"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusRightGroup',
            title: (0, nls_1.localize)({ key: 'miFocusRightGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Right"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 2
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusAboveGroup',
            title: (0, nls_1.localize)({ key: 'miFocusAboveGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Above"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 3
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarSwitchGroupMenu, {
        group: '3_directional',
        command: {
            id: 'workbench.action.focusBelowGroup',
            title: (0, nls_1.localize)({ key: 'miFocusBelowGroup', comment: ['&& denotes a mnemonic'] }, "Group &&Below"),
            precondition: contextkeys_1.MultipleEditorGroupsContext
        },
        order: 4
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '2_editor_nav',
        title: (0, nls_1.localize)({ key: 'miSwitchGroup', comment: ['&& denotes a mnemonic'] }, "Switch &&Group"),
        submenu: actions_2.MenuId.MenubarSwitchGroupMenu,
        order: 2
    });
});
//#endregion
//# sourceMappingURL=editor.contribution.js.map