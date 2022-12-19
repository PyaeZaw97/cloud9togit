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
define(["require", "exports", "vs/nls", "vs/base/common/actions", "vs/base/common/arrays", "vs/workbench/common/editor", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/history/common/history", "vs/platform/keybinding/common/keybinding", "vs/platform/commands/common/commands", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/platform/workspaces/common/workspaces", "vs/platform/dialogs/common/dialogs", "vs/platform/quickinput/common/quickInput", "vs/workbench/browser/parts/editor/editorQuickAccess", "vs/base/common/codicons", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/services/editor/common/editorResolverService", "vs/base/common/platform"], function (require, exports, nls_1, actions_1, arrays_1, editor_1, sideBySideEditorInput_1, layoutService_1, history_1, keybinding_1, commands_1, editorCommands_1, editorGroupsService_1, editorService_1, configuration_1, lifecycle_1, workspaces_1, dialogs_1, quickInput_1, editorQuickAccess_1, codicons_1, filesConfigurationService_1, editorResolverService_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReOpenInTextEditorAction = exports.ToggleEditorTypeAction = exports.NewEditorGroupBelowAction = exports.NewEditorGroupAboveAction = exports.NewEditorGroupRightAction = exports.NewEditorGroupLeftAction = exports.EditorLayoutTwoRowsRightAction = exports.EditorLayoutTwoColumnsBottomAction = exports.EditorLayoutTwoByTwoGridAction = exports.EditorLayoutThreeRowsAction = exports.EditorLayoutTwoRowsAction = exports.EditorLayoutThreeColumnsAction = exports.EditorLayoutTwoColumnsAction = exports.EditorLayoutSingleAction = exports.SplitEditorToLastGroupAction = exports.SplitEditorToFirstGroupAction = exports.SplitEditorToRightGroupAction = exports.SplitEditorToLeftGroupAction = exports.SplitEditorToBelowGroupAction = exports.SplitEditorToAboveGroupAction = exports.SplitEditorToNextGroupAction = exports.SplitEditorToPreviousGroupAction = exports.MoveEditorToLastGroupAction = exports.MoveEditorToFirstGroupAction = exports.MoveEditorToRightGroupAction = exports.MoveEditorToLeftGroupAction = exports.MoveEditorToBelowGroupAction = exports.MoveEditorToAboveGroupAction = exports.MoveEditorToNextGroupAction = exports.MoveEditorToPreviousGroupAction = exports.MoveEditorRightInGroupAction = exports.MoveEditorLeftInGroupAction = exports.ClearEditorHistoryAction = exports.OpenPreviousRecentlyUsedEditorInGroupAction = exports.OpenNextRecentlyUsedEditorInGroupAction = exports.OpenPreviousRecentlyUsedEditorAction = exports.OpenNextRecentlyUsedEditorAction = exports.QuickAccessPreviousEditorFromHistoryAction = exports.QuickAccessLeastRecentlyUsedEditorInGroupAction = exports.QuickAccessPreviousRecentlyUsedEditorInGroupAction = exports.QuickAccessLeastRecentlyUsedEditorAction = exports.QuickAccessPreviousRecentlyUsedEditorAction = exports.ShowAllEditorsByMostRecentlyUsedAction = exports.ShowAllEditorsByAppearanceAction = exports.ShowEditorsInActiveGroupByMostRecentlyUsedAction = exports.ClearRecentFilesAction = exports.ReopenClosedEditorAction = exports.NavigateToLastNavigationLocationAction = exports.NavigatePreviousInNavigationsAction = exports.NavigateBackwardsInNavigationsAction = exports.NavigateForwardInNavigationsAction = exports.NavigateToLastEditLocationAction = exports.NavigatePreviousInEditsAction = exports.NavigateBackwardsInEditsAction = exports.NavigateForwardInEditsAction = exports.NavigatePreviousAction = exports.NavigateBackwardsAction = exports.NavigateForwardAction = exports.OpenLastEditorInGroup = exports.OpenFirstEditorInGroup = exports.OpenPreviousEditorInGroup = exports.OpenNextEditorInGroup = exports.OpenPreviousEditor = exports.OpenNextEditor = exports.MaximizeGroupAction = exports.ToggleGroupSizesAction = exports.ResetGroupSizesAction = exports.MinimizeOtherGroupsAction = exports.DuplicateGroupDownAction = exports.DuplicateGroupUpAction = exports.DuplicateGroupRightAction = exports.DuplicateGroupLeftAction = exports.MoveGroupDownAction = exports.MoveGroupUpAction = exports.MoveGroupRightAction = exports.MoveGroupLeftAction = exports.CloseEditorInAllGroupsAction = exports.CloseEditorsInOtherGroupsAction = exports.CloseAllEditorGroupsAction = exports.CloseAllEditorsAction = exports.CloseLeftEditorsInGroupAction = exports.RevertAndCloseEditorAction = exports.CloseOneEditorAction = exports.UnpinEditorAction = exports.CloseEditorAction = exports.FocusBelowGroup = exports.FocusAboveGroup = exports.FocusRightGroup = exports.FocusLeftGroup = exports.FocusPreviousGroup = exports.FocusNextGroup = exports.FocusLastGroupAction = exports.FocusFirstGroupAction = exports.FocusActiveGroupAction = exports.NavigateBetweenGroupsAction = exports.JoinAllGroupsAction = exports.JoinTwoGroupsAction = exports.SplitEditorDownAction = exports.SplitEditorUpAction = exports.SplitEditorRightAction = exports.SplitEditorLeftAction = exports.SplitEditorOrthogonalAction = exports.SplitEditorAction = exports.ExecuteCommandAction = void 0;
    class ExecuteCommandAction extends actions_1.Action {
        constructor(id, label, commandId, commandService, commandArgs) {
            super(id, label);
            this.commandId = commandId;
            this.commandService = commandService;
            this.commandArgs = commandArgs;
        }
        run() {
            return this.commandService.executeCommand(this.commandId, this.commandArgs);
        }
    }
    exports.ExecuteCommandAction = ExecuteCommandAction;
    class AbstractSplitEditorAction extends actions_1.Action {
        constructor(id, label, editorGroupService, configurationService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
            this.configurationService = configurationService;
            this.toDispose = this._register(new lifecycle_1.DisposableStore());
            this.direction = this.getDirection();
            this.registerListeners();
        }
        getDirection() {
            return (0, editorGroupsService_1.preferredSideBySideGroupDirection)(this.configurationService);
        }
        registerListeners() {
            this.toDispose.add(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.editor.openSideBySideDirection')) {
                    this.direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(this.configurationService);
                }
            }));
        }
        async run(context) {
            (0, editorCommands_1.splitEditor)(this.editorGroupService, this.direction, context);
        }
    }
    let SplitEditorAction = class SplitEditorAction extends AbstractSplitEditorAction {
        constructor(id, label, editorGroupService, configurationService) {
            super(id, label, editorGroupService, configurationService);
        }
    };
    SplitEditorAction.ID = 'workbench.action.splitEditor';
    SplitEditorAction.LABEL = (0, nls_1.localize)('splitEditor', "Split Editor");
    SplitEditorAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, configuration_1.IConfigurationService)
    ], SplitEditorAction);
    exports.SplitEditorAction = SplitEditorAction;
    let SplitEditorOrthogonalAction = class SplitEditorOrthogonalAction extends AbstractSplitEditorAction {
        constructor(id, label, editorGroupService, configurationService) {
            super(id, label, editorGroupService, configurationService);
        }
        getDirection() {
            const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(this.configurationService);
            return direction === 3 /* GroupDirection.RIGHT */ ? 1 /* GroupDirection.DOWN */ : 3 /* GroupDirection.RIGHT */;
        }
    };
    SplitEditorOrthogonalAction.ID = 'workbench.action.splitEditorOrthogonal';
    SplitEditorOrthogonalAction.LABEL = (0, nls_1.localize)('splitEditorOrthogonal', "Split Editor Orthogonal");
    SplitEditorOrthogonalAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, configuration_1.IConfigurationService)
    ], SplitEditorOrthogonalAction);
    exports.SplitEditorOrthogonalAction = SplitEditorOrthogonalAction;
    let SplitEditorLeftAction = class SplitEditorLeftAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.SPLIT_EDITOR_LEFT, commandService);
        }
    };
    SplitEditorLeftAction.ID = editorCommands_1.SPLIT_EDITOR_LEFT;
    SplitEditorLeftAction.LABEL = (0, nls_1.localize)('splitEditorGroupLeft', "Split Editor Left");
    SplitEditorLeftAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorLeftAction);
    exports.SplitEditorLeftAction = SplitEditorLeftAction;
    let SplitEditorRightAction = class SplitEditorRightAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.SPLIT_EDITOR_RIGHT, commandService);
        }
    };
    SplitEditorRightAction.ID = editorCommands_1.SPLIT_EDITOR_RIGHT;
    SplitEditorRightAction.LABEL = (0, nls_1.localize)('splitEditorGroupRight', "Split Editor Right");
    SplitEditorRightAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorRightAction);
    exports.SplitEditorRightAction = SplitEditorRightAction;
    let SplitEditorUpAction = class SplitEditorUpAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.SPLIT_EDITOR_UP, commandService);
        }
    };
    SplitEditorUpAction.ID = editorCommands_1.SPLIT_EDITOR_UP;
    SplitEditorUpAction.LABEL = (0, nls_1.localize)('splitEditorGroupUp', "Split Editor Up");
    SplitEditorUpAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorUpAction);
    exports.SplitEditorUpAction = SplitEditorUpAction;
    let SplitEditorDownAction = class SplitEditorDownAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.SPLIT_EDITOR_DOWN, commandService);
        }
    };
    SplitEditorDownAction.ID = editorCommands_1.SPLIT_EDITOR_DOWN;
    SplitEditorDownAction.LABEL = (0, nls_1.localize)('splitEditorGroupDown', "Split Editor Down");
    SplitEditorDownAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorDownAction);
    exports.SplitEditorDownAction = SplitEditorDownAction;
    let JoinTwoGroupsAction = class JoinTwoGroupsAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        async run(context) {
            let sourceGroup;
            if (context && typeof context.groupId === 'number') {
                sourceGroup = this.editorGroupService.getGroup(context.groupId);
            }
            else {
                sourceGroup = this.editorGroupService.activeGroup;
            }
            if (sourceGroup) {
                const targetGroupDirections = [3 /* GroupDirection.RIGHT */, 1 /* GroupDirection.DOWN */, 2 /* GroupDirection.LEFT */, 0 /* GroupDirection.UP */];
                for (const targetGroupDirection of targetGroupDirections) {
                    const targetGroup = this.editorGroupService.findGroup({ direction: targetGroupDirection }, sourceGroup);
                    if (targetGroup && sourceGroup !== targetGroup) {
                        this.editorGroupService.mergeGroup(sourceGroup, targetGroup);
                        break;
                    }
                }
            }
        }
    };
    JoinTwoGroupsAction.ID = 'workbench.action.joinTwoGroups';
    JoinTwoGroupsAction.LABEL = (0, nls_1.localize)('joinTwoGroups', "Join Editor Group with Next Group");
    JoinTwoGroupsAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], JoinTwoGroupsAction);
    exports.JoinTwoGroupsAction = JoinTwoGroupsAction;
    let JoinAllGroupsAction = class JoinAllGroupsAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        async run() {
            this.editorGroupService.mergeAllGroups();
        }
    };
    JoinAllGroupsAction.ID = 'workbench.action.joinAllGroups';
    JoinAllGroupsAction.LABEL = (0, nls_1.localize)('joinAllGroups', "Join All Editor Groups");
    JoinAllGroupsAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], JoinAllGroupsAction);
    exports.JoinAllGroupsAction = JoinAllGroupsAction;
    let NavigateBetweenGroupsAction = class NavigateBetweenGroupsAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        async run() {
            const nextGroup = this.editorGroupService.findGroup({ location: 2 /* GroupLocation.NEXT */ }, this.editorGroupService.activeGroup, true);
            nextGroup === null || nextGroup === void 0 ? void 0 : nextGroup.focus();
        }
    };
    NavigateBetweenGroupsAction.ID = 'workbench.action.navigateEditorGroups';
    NavigateBetweenGroupsAction.LABEL = (0, nls_1.localize)('navigateEditorGroups', "Navigate Between Editor Groups");
    NavigateBetweenGroupsAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], NavigateBetweenGroupsAction);
    exports.NavigateBetweenGroupsAction = NavigateBetweenGroupsAction;
    let FocusActiveGroupAction = class FocusActiveGroupAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        async run() {
            this.editorGroupService.activeGroup.focus();
        }
    };
    FocusActiveGroupAction.ID = 'workbench.action.focusActiveEditorGroup';
    FocusActiveGroupAction.LABEL = (0, nls_1.localize)('focusActiveEditorGroup', "Focus Active Editor Group");
    FocusActiveGroupAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusActiveGroupAction);
    exports.FocusActiveGroupAction = FocusActiveGroupAction;
    let AbstractFocusGroupAction = class AbstractFocusGroupAction extends actions_1.Action {
        constructor(id, label, scope, editorGroupService) {
            super(id, label);
            this.scope = scope;
            this.editorGroupService = editorGroupService;
        }
        async run() {
            const group = this.editorGroupService.findGroup(this.scope, this.editorGroupService.activeGroup, true);
            if (group) {
                group.focus();
            }
        }
    };
    AbstractFocusGroupAction = __decorate([
        __param(3, editorGroupsService_1.IEditorGroupsService)
    ], AbstractFocusGroupAction);
    let FocusFirstGroupAction = class FocusFirstGroupAction extends AbstractFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { location: 0 /* GroupLocation.FIRST */ }, editorGroupService);
        }
    };
    FocusFirstGroupAction.ID = 'workbench.action.focusFirstEditorGroup';
    FocusFirstGroupAction.LABEL = (0, nls_1.localize)('focusFirstEditorGroup', "Focus First Editor Group");
    FocusFirstGroupAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusFirstGroupAction);
    exports.FocusFirstGroupAction = FocusFirstGroupAction;
    let FocusLastGroupAction = class FocusLastGroupAction extends AbstractFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { location: 1 /* GroupLocation.LAST */ }, editorGroupService);
        }
    };
    FocusLastGroupAction.ID = 'workbench.action.focusLastEditorGroup';
    FocusLastGroupAction.LABEL = (0, nls_1.localize)('focusLastEditorGroup', "Focus Last Editor Group");
    FocusLastGroupAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusLastGroupAction);
    exports.FocusLastGroupAction = FocusLastGroupAction;
    let FocusNextGroup = class FocusNextGroup extends AbstractFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { location: 2 /* GroupLocation.NEXT */ }, editorGroupService);
        }
    };
    FocusNextGroup.ID = 'workbench.action.focusNextGroup';
    FocusNextGroup.LABEL = (0, nls_1.localize)('focusNextGroup', "Focus Next Editor Group");
    FocusNextGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusNextGroup);
    exports.FocusNextGroup = FocusNextGroup;
    let FocusPreviousGroup = class FocusPreviousGroup extends AbstractFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { location: 3 /* GroupLocation.PREVIOUS */ }, editorGroupService);
        }
    };
    FocusPreviousGroup.ID = 'workbench.action.focusPreviousGroup';
    FocusPreviousGroup.LABEL = (0, nls_1.localize)('focusPreviousGroup', "Focus Previous Editor Group");
    FocusPreviousGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusPreviousGroup);
    exports.FocusPreviousGroup = FocusPreviousGroup;
    let FocusLeftGroup = class FocusLeftGroup extends AbstractFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { direction: 2 /* GroupDirection.LEFT */ }, editorGroupService);
        }
    };
    FocusLeftGroup.ID = 'workbench.action.focusLeftGroup';
    FocusLeftGroup.LABEL = (0, nls_1.localize)('focusLeftGroup', "Focus Left Editor Group");
    FocusLeftGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusLeftGroup);
    exports.FocusLeftGroup = FocusLeftGroup;
    let FocusRightGroup = class FocusRightGroup extends AbstractFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { direction: 3 /* GroupDirection.RIGHT */ }, editorGroupService);
        }
    };
    FocusRightGroup.ID = 'workbench.action.focusRightGroup';
    FocusRightGroup.LABEL = (0, nls_1.localize)('focusRightGroup', "Focus Right Editor Group");
    FocusRightGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusRightGroup);
    exports.FocusRightGroup = FocusRightGroup;
    let FocusAboveGroup = class FocusAboveGroup extends AbstractFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { direction: 0 /* GroupDirection.UP */ }, editorGroupService);
        }
    };
    FocusAboveGroup.ID = 'workbench.action.focusAboveGroup';
    FocusAboveGroup.LABEL = (0, nls_1.localize)('focusAboveGroup', "Focus Editor Group Above");
    FocusAboveGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusAboveGroup);
    exports.FocusAboveGroup = FocusAboveGroup;
    let FocusBelowGroup = class FocusBelowGroup extends AbstractFocusGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, { direction: 1 /* GroupDirection.DOWN */ }, editorGroupService);
        }
    };
    FocusBelowGroup.ID = 'workbench.action.focusBelowGroup';
    FocusBelowGroup.LABEL = (0, nls_1.localize)('focusBelowGroup', "Focus Editor Group Below");
    FocusBelowGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], FocusBelowGroup);
    exports.FocusBelowGroup = FocusBelowGroup;
    let CloseEditorAction = class CloseEditorAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label, codicons_1.Codicon.close.classNames);
            this.commandService = commandService;
        }
        run(context) {
            return this.commandService.executeCommand(editorCommands_1.CLOSE_EDITOR_COMMAND_ID, undefined, context);
        }
    };
    CloseEditorAction.ID = 'workbench.action.closeActiveEditor';
    CloseEditorAction.LABEL = (0, nls_1.localize)('closeEditor', "Close Editor");
    CloseEditorAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], CloseEditorAction);
    exports.CloseEditorAction = CloseEditorAction;
    let UnpinEditorAction = class UnpinEditorAction extends actions_1.Action {
        constructor(id, label, commandService) {
            super(id, label, codicons_1.Codicon.pinned.classNames);
            this.commandService = commandService;
        }
        run(context) {
            return this.commandService.executeCommand(editorCommands_1.UNPIN_EDITOR_COMMAND_ID, undefined, context);
        }
    };
    UnpinEditorAction.ID = 'workbench.action.unpinActiveEditor';
    UnpinEditorAction.LABEL = (0, nls_1.localize)('unpinEditor', "Unpin Editor");
    UnpinEditorAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], UnpinEditorAction);
    exports.UnpinEditorAction = UnpinEditorAction;
    let CloseOneEditorAction = class CloseOneEditorAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label, codicons_1.Codicon.close.classNames);
            this.editorGroupService = editorGroupService;
        }
        async run(context) {
            let group;
            let editorIndex;
            if (context) {
                group = this.editorGroupService.getGroup(context.groupId);
                if (group) {
                    editorIndex = context.editorIndex; // only allow editor at index if group is valid
                }
            }
            if (!group) {
                group = this.editorGroupService.activeGroup;
            }
            // Close specific editor in group
            if (typeof editorIndex === 'number') {
                const editorAtIndex = group.getEditorByIndex(editorIndex);
                if (editorAtIndex) {
                    await group.closeEditor(editorAtIndex, { preserveFocus: context === null || context === void 0 ? void 0 : context.preserveFocus });
                    return;
                }
            }
            // Otherwise close active editor in group
            if (group.activeEditor) {
                await group.closeEditor(group.activeEditor, { preserveFocus: context === null || context === void 0 ? void 0 : context.preserveFocus });
                return;
            }
        }
    };
    CloseOneEditorAction.ID = 'workbench.action.closeActiveEditor';
    CloseOneEditorAction.LABEL = (0, nls_1.localize)('closeOneEditor', "Close");
    CloseOneEditorAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], CloseOneEditorAction);
    exports.CloseOneEditorAction = CloseOneEditorAction;
    let RevertAndCloseEditorAction = class RevertAndCloseEditorAction extends actions_1.Action {
        constructor(id, label, editorService) {
            super(id, label);
            this.editorService = editorService;
        }
        async run() {
            const activeEditorPane = this.editorService.activeEditorPane;
            if (activeEditorPane) {
                const editor = activeEditorPane.input;
                const group = activeEditorPane.group;
                // first try a normal revert where the contents of the editor are restored
                try {
                    await this.editorService.revert({ editor, groupId: group.id });
                }
                catch (error) {
                    // if that fails, since we are about to close the editor, we accept that
                    // the editor cannot be reverted and instead do a soft revert that just
                    // enables us to close the editor. With this, a user can always close a
                    // dirty editor even when reverting fails.
                    await this.editorService.revert({ editor, groupId: group.id }, { soft: true });
                }
                await group.closeEditor(editor);
            }
        }
    };
    RevertAndCloseEditorAction.ID = 'workbench.action.revertAndCloseActiveEditor';
    RevertAndCloseEditorAction.LABEL = (0, nls_1.localize)('revertAndCloseActiveEditor', "Revert and Close Editor");
    RevertAndCloseEditorAction = __decorate([
        __param(2, editorService_1.IEditorService)
    ], RevertAndCloseEditorAction);
    exports.RevertAndCloseEditorAction = RevertAndCloseEditorAction;
    let CloseLeftEditorsInGroupAction = class CloseLeftEditorsInGroupAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        async run(context) {
            const { group, editor } = this.getTarget(context);
            if (group && editor) {
                await group.closeEditors({ direction: 0 /* CloseDirection.LEFT */, except: editor, excludeSticky: true });
            }
        }
        getTarget(context) {
            if (context) {
                return { editor: context.editor, group: this.editorGroupService.getGroup(context.groupId) };
            }
            // Fallback to active group
            return { group: this.editorGroupService.activeGroup, editor: this.editorGroupService.activeGroup.activeEditor };
        }
    };
    CloseLeftEditorsInGroupAction.ID = 'workbench.action.closeEditorsToTheLeft';
    CloseLeftEditorsInGroupAction.LABEL = (0, nls_1.localize)('closeEditorsToTheLeft', "Close Editors to the Left in Group");
    CloseLeftEditorsInGroupAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], CloseLeftEditorsInGroupAction);
    exports.CloseLeftEditorsInGroupAction = CloseLeftEditorsInGroupAction;
    class AbstractCloseAllAction extends actions_1.Action {
        constructor(id, label, clazz, fileDialogService, editorGroupService, editorService, filesConfigurationService) {
            super(id, label, clazz);
            this.fileDialogService = fileDialogService;
            this.editorGroupService = editorGroupService;
            this.editorService = editorService;
            this.filesConfigurationService = filesConfigurationService;
        }
        get groupsToClose() {
            const groupsToClose = [];
            // Close editors in reverse order of their grid appearance so that the editor
            // group that is the first (top-left) remains. This helps to keep view state
            // for editors around that have been opened in this visually first group.
            const groups = this.editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
            for (let i = groups.length - 1; i >= 0; i--) {
                groupsToClose.push(groups[i]);
            }
            return groupsToClose;
        }
        async run() {
            // Depending on the editor and auto save configuration,
            // split dirty editors into buckets
            var _a, _b, _c;
            const dirtyEditorsWithDefaultConfirm = new Set();
            const dirtyAutoSaveOnFocusChangeEditors = new Set();
            const dirtyAutoSaveOnWindowChangeEditors = new Set();
            const dirtyEditorsWithCustomConfirm = new Map();
            for (const { editor, groupId } of this.editorService.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: this.excludeSticky })) {
                if (!editor.isDirty() || editor.isSaving()) {
                    continue; // only interested in dirty editors that are not in the process of saving
                }
                // Editor has custom confirm implementation
                if (typeof editor.confirm === 'function') {
                    let customEditorsToConfirm = dirtyEditorsWithCustomConfirm.get(editor.typeId);
                    if (!customEditorsToConfirm) {
                        customEditorsToConfirm = new Set();
                        dirtyEditorsWithCustomConfirm.set(editor.typeId, customEditorsToConfirm);
                    }
                    customEditorsToConfirm.add({ editor, groupId });
                }
                // Editor will be saved on focus change when a
                // dialog appears, so just track that separate
                else if (this.filesConfigurationService.getAutoSaveMode() === 3 /* AutoSaveMode.ON_FOCUS_CHANGE */ && !editor.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                    dirtyAutoSaveOnFocusChangeEditors.add({ editor, groupId });
                }
                // Windows, Linux: editor will be saved on window change
                // when a native dialog appears, so just track that separate
                // (see https://github.com/microsoft/vscode/issues/134250)
                else if ((platform_1.isNative && (platform_1.isWindows || platform_1.isLinux)) && this.filesConfigurationService.getAutoSaveMode() === 4 /* AutoSaveMode.ON_WINDOW_CHANGE */ && !editor.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                    dirtyAutoSaveOnWindowChangeEditors.add({ editor, groupId });
                }
                // Editor will show in generic file based dialog
                else {
                    dirtyEditorsWithDefaultConfirm.add({ editor, groupId });
                }
            }
            // 1.) Show default file based dialog
            if (dirtyEditorsWithDefaultConfirm.size > 0) {
                const editors = Array.from(dirtyEditorsWithDefaultConfirm.values());
                await this.revealDirtyEditors(editors); // help user make a decision by revealing editors
                const confirmation = await this.fileDialogService.showSaveConfirm(editors.map(({ editor }) => {
                    if (editor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                        return editor.primary.getName(); // prefer shorter names by using primary's name in this case
                    }
                    return editor.getName();
                }));
                switch (confirmation) {
                    case 2 /* ConfirmResult.CANCEL */:
                        return;
                    case 1 /* ConfirmResult.DONT_SAVE */:
                        await this.editorService.revert(editors, { soft: true });
                        break;
                    case 0 /* ConfirmResult.SAVE */:
                        await this.editorService.save(editors, { reason: 1 /* SaveReason.EXPLICIT */ });
                        break;
                }
            }
            // 2.) Show custom confirm based dialog
            for (const [, editorIdentifiers] of dirtyEditorsWithCustomConfirm) {
                const editors = Array.from(editorIdentifiers.values());
                await this.revealDirtyEditors(editors); // help user make a decision by revealing editors
                const confirmation = await ((_c = (_a = (0, arrays_1.firstOrDefault)(editors)) === null || _a === void 0 ? void 0 : (_b = _a.editor).confirm) === null || _c === void 0 ? void 0 : _c.call(_b, editors));
                if (typeof confirmation === 'number') {
                    switch (confirmation) {
                        case 2 /* ConfirmResult.CANCEL */:
                            return;
                        case 1 /* ConfirmResult.DONT_SAVE */:
                            await this.editorService.revert(editors, { soft: true });
                            break;
                        case 0 /* ConfirmResult.SAVE */:
                            await this.editorService.save(editors, { reason: 1 /* SaveReason.EXPLICIT */ });
                            break;
                    }
                }
            }
            // 3.) Save autosaveable editors (focus change)
            if (dirtyAutoSaveOnFocusChangeEditors.size > 0) {
                const editors = Array.from(dirtyAutoSaveOnFocusChangeEditors.values());
                await this.editorService.save(editors, { reason: 3 /* SaveReason.FOCUS_CHANGE */ });
            }
            // 4.) Save autosaveable editors (window change)
            if (dirtyAutoSaveOnWindowChangeEditors.size > 0) {
                const editors = Array.from(dirtyAutoSaveOnWindowChangeEditors.values());
                await this.editorService.save(editors, { reason: 4 /* SaveReason.WINDOW_CHANGE */ });
            }
            // 5.) Finally close all editors: even if an editor failed to
            // save or revert and still reports dirty, the editor part makes
            // sure to bring up another confirm dialog for those editors
            // specifically.
            return this.doCloseAll();
        }
        async revealDirtyEditors(editors) {
            try {
                const handledGroups = new Set();
                for (const { editor, groupId } of editors) {
                    if (handledGroups.has(groupId)) {
                        continue;
                    }
                    handledGroups.add(groupId);
                    const group = this.editorGroupService.getGroup(groupId);
                    await (group === null || group === void 0 ? void 0 : group.openEditor(editor));
                }
            }
            catch (error) {
                // ignore any error as the revealing is just convinience
            }
        }
        async doCloseAll() {
            await Promise.all(this.groupsToClose.map(group => group.closeAllEditors({ excludeSticky: this.excludeSticky })));
        }
    }
    let CloseAllEditorsAction = class CloseAllEditorsAction extends AbstractCloseAllAction {
        constructor(id, label, fileDialogService, editorGroupService, editorService, filesConfigurationService) {
            super(id, label, codicons_1.Codicon.closeAll.classNames, fileDialogService, editorGroupService, editorService, filesConfigurationService);
        }
        get excludeSticky() {
            return true; // exclude sticky from this mass-closing operation
        }
    };
    CloseAllEditorsAction.ID = 'workbench.action.closeAllEditors';
    CloseAllEditorsAction.LABEL = (0, nls_1.localize)('closeAllEditors', "Close All Editors");
    CloseAllEditorsAction = __decorate([
        __param(2, dialogs_1.IFileDialogService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, editorService_1.IEditorService),
        __param(5, filesConfigurationService_1.IFilesConfigurationService)
    ], CloseAllEditorsAction);
    exports.CloseAllEditorsAction = CloseAllEditorsAction;
    let CloseAllEditorGroupsAction = class CloseAllEditorGroupsAction extends AbstractCloseAllAction {
        constructor(id, label, fileDialogService, editorGroupService, editorService, filesConfigurationService) {
            super(id, label, undefined, fileDialogService, editorGroupService, editorService, filesConfigurationService);
        }
        get excludeSticky() {
            return false; // the intent to close groups means, even sticky are included
        }
        async doCloseAll() {
            await super.doCloseAll();
            for (const groupToClose of this.groupsToClose) {
                this.editorGroupService.removeGroup(groupToClose);
            }
        }
    };
    CloseAllEditorGroupsAction.ID = 'workbench.action.closeAllGroups';
    CloseAllEditorGroupsAction.LABEL = (0, nls_1.localize)('closeAllGroups', "Close All Editor Groups");
    CloseAllEditorGroupsAction = __decorate([
        __param(2, dialogs_1.IFileDialogService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, editorService_1.IEditorService),
        __param(5, filesConfigurationService_1.IFilesConfigurationService)
    ], CloseAllEditorGroupsAction);
    exports.CloseAllEditorGroupsAction = CloseAllEditorGroupsAction;
    let CloseEditorsInOtherGroupsAction = class CloseEditorsInOtherGroupsAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        async run(context) {
            const groupToSkip = context ? this.editorGroupService.getGroup(context.groupId) : this.editorGroupService.activeGroup;
            await Promise.all(this.editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */).map(async (group) => {
                if (groupToSkip && group.id === groupToSkip.id) {
                    return;
                }
                return group.closeAllEditors({ excludeSticky: true });
            }));
        }
    };
    CloseEditorsInOtherGroupsAction.ID = 'workbench.action.closeEditorsInOtherGroups';
    CloseEditorsInOtherGroupsAction.LABEL = (0, nls_1.localize)('closeEditorsInOtherGroups', "Close Editors in Other Groups");
    CloseEditorsInOtherGroupsAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], CloseEditorsInOtherGroupsAction);
    exports.CloseEditorsInOtherGroupsAction = CloseEditorsInOtherGroupsAction;
    let CloseEditorInAllGroupsAction = class CloseEditorInAllGroupsAction extends actions_1.Action {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
            this.editorService = editorService;
        }
        async run() {
            const activeEditor = this.editorService.activeEditor;
            if (activeEditor) {
                await Promise.all(this.editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */).map(group => group.closeEditor(activeEditor)));
            }
        }
    };
    CloseEditorInAllGroupsAction.ID = 'workbench.action.closeEditorInAllGroups';
    CloseEditorInAllGroupsAction.LABEL = (0, nls_1.localize)('closeEditorInAllGroups', "Close Editor in All Groups");
    CloseEditorInAllGroupsAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], CloseEditorInAllGroupsAction);
    exports.CloseEditorInAllGroupsAction = CloseEditorInAllGroupsAction;
    class AbstractMoveCopyGroupAction extends actions_1.Action {
        constructor(id, label, direction, isMove, editorGroupService) {
            super(id, label);
            this.direction = direction;
            this.isMove = isMove;
            this.editorGroupService = editorGroupService;
        }
        async run(context) {
            let sourceGroup;
            if (context && typeof context.groupId === 'number') {
                sourceGroup = this.editorGroupService.getGroup(context.groupId);
            }
            else {
                sourceGroup = this.editorGroupService.activeGroup;
            }
            if (sourceGroup) {
                let resultGroup = undefined;
                if (this.isMove) {
                    const targetGroup = this.findTargetGroup(sourceGroup);
                    if (targetGroup) {
                        resultGroup = this.editorGroupService.moveGroup(sourceGroup, targetGroup, this.direction);
                    }
                }
                else {
                    resultGroup = this.editorGroupService.copyGroup(sourceGroup, sourceGroup, this.direction);
                }
                if (resultGroup) {
                    this.editorGroupService.activateGroup(resultGroup);
                }
            }
        }
        findTargetGroup(sourceGroup) {
            const targetNeighbours = [this.direction];
            // Allow the target group to be in alternative locations to support more
            // scenarios of moving the group to the taret location.
            // Helps for https://github.com/microsoft/vscode/issues/50741
            switch (this.direction) {
                case 2 /* GroupDirection.LEFT */:
                case 3 /* GroupDirection.RIGHT */:
                    targetNeighbours.push(0 /* GroupDirection.UP */, 1 /* GroupDirection.DOWN */);
                    break;
                case 0 /* GroupDirection.UP */:
                case 1 /* GroupDirection.DOWN */:
                    targetNeighbours.push(2 /* GroupDirection.LEFT */, 3 /* GroupDirection.RIGHT */);
                    break;
            }
            for (const targetNeighbour of targetNeighbours) {
                const targetNeighbourGroup = this.editorGroupService.findGroup({ direction: targetNeighbour }, sourceGroup);
                if (targetNeighbourGroup) {
                    return targetNeighbourGroup;
                }
            }
            return undefined;
        }
    }
    class AbstractMoveGroupAction extends AbstractMoveCopyGroupAction {
        constructor(id, label, direction, editorGroupService) {
            super(id, label, direction, true, editorGroupService);
        }
    }
    let MoveGroupLeftAction = class MoveGroupLeftAction extends AbstractMoveGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 2 /* GroupDirection.LEFT */, editorGroupService);
        }
    };
    MoveGroupLeftAction.ID = 'workbench.action.moveActiveEditorGroupLeft';
    MoveGroupLeftAction.LABEL = (0, nls_1.localize)('moveActiveGroupLeft', "Move Editor Group Left");
    MoveGroupLeftAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], MoveGroupLeftAction);
    exports.MoveGroupLeftAction = MoveGroupLeftAction;
    let MoveGroupRightAction = class MoveGroupRightAction extends AbstractMoveGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 3 /* GroupDirection.RIGHT */, editorGroupService);
        }
    };
    MoveGroupRightAction.ID = 'workbench.action.moveActiveEditorGroupRight';
    MoveGroupRightAction.LABEL = (0, nls_1.localize)('moveActiveGroupRight', "Move Editor Group Right");
    MoveGroupRightAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], MoveGroupRightAction);
    exports.MoveGroupRightAction = MoveGroupRightAction;
    let MoveGroupUpAction = class MoveGroupUpAction extends AbstractMoveGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 0 /* GroupDirection.UP */, editorGroupService);
        }
    };
    MoveGroupUpAction.ID = 'workbench.action.moveActiveEditorGroupUp';
    MoveGroupUpAction.LABEL = (0, nls_1.localize)('moveActiveGroupUp', "Move Editor Group Up");
    MoveGroupUpAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], MoveGroupUpAction);
    exports.MoveGroupUpAction = MoveGroupUpAction;
    let MoveGroupDownAction = class MoveGroupDownAction extends AbstractMoveGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 1 /* GroupDirection.DOWN */, editorGroupService);
        }
    };
    MoveGroupDownAction.ID = 'workbench.action.moveActiveEditorGroupDown';
    MoveGroupDownAction.LABEL = (0, nls_1.localize)('moveActiveGroupDown', "Move Editor Group Down");
    MoveGroupDownAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], MoveGroupDownAction);
    exports.MoveGroupDownAction = MoveGroupDownAction;
    class AbstractDuplicateGroupAction extends AbstractMoveCopyGroupAction {
        constructor(id, label, direction, editorGroupService) {
            super(id, label, direction, false, editorGroupService);
        }
    }
    let DuplicateGroupLeftAction = class DuplicateGroupLeftAction extends AbstractDuplicateGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 2 /* GroupDirection.LEFT */, editorGroupService);
        }
    };
    DuplicateGroupLeftAction.ID = 'workbench.action.duplicateActiveEditorGroupLeft';
    DuplicateGroupLeftAction.LABEL = (0, nls_1.localize)('duplicateActiveGroupLeft', "Duplicate Editor Group Left");
    DuplicateGroupLeftAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], DuplicateGroupLeftAction);
    exports.DuplicateGroupLeftAction = DuplicateGroupLeftAction;
    let DuplicateGroupRightAction = class DuplicateGroupRightAction extends AbstractDuplicateGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 3 /* GroupDirection.RIGHT */, editorGroupService);
        }
    };
    DuplicateGroupRightAction.ID = 'workbench.action.duplicateActiveEditorGroupRight';
    DuplicateGroupRightAction.LABEL = (0, nls_1.localize)('duplicateActiveGroupRight', "Duplicate Editor Group Right");
    DuplicateGroupRightAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], DuplicateGroupRightAction);
    exports.DuplicateGroupRightAction = DuplicateGroupRightAction;
    let DuplicateGroupUpAction = class DuplicateGroupUpAction extends AbstractDuplicateGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 0 /* GroupDirection.UP */, editorGroupService);
        }
    };
    DuplicateGroupUpAction.ID = 'workbench.action.duplicateActiveEditorGroupUp';
    DuplicateGroupUpAction.LABEL = (0, nls_1.localize)('duplicateActiveGroupUp', "Duplicate Editor Group Up");
    DuplicateGroupUpAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], DuplicateGroupUpAction);
    exports.DuplicateGroupUpAction = DuplicateGroupUpAction;
    let DuplicateGroupDownAction = class DuplicateGroupDownAction extends AbstractDuplicateGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 1 /* GroupDirection.DOWN */, editorGroupService);
        }
    };
    DuplicateGroupDownAction.ID = 'workbench.action.duplicateActiveEditorGroupDown';
    DuplicateGroupDownAction.LABEL = (0, nls_1.localize)('duplicateActiveGroupDown', "Duplicate Editor Group Down");
    DuplicateGroupDownAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], DuplicateGroupDownAction);
    exports.DuplicateGroupDownAction = DuplicateGroupDownAction;
    let MinimizeOtherGroupsAction = class MinimizeOtherGroupsAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        async run() {
            this.editorGroupService.arrangeGroups(0 /* GroupsArrangement.MINIMIZE_OTHERS */);
        }
    };
    MinimizeOtherGroupsAction.ID = 'workbench.action.minimizeOtherEditors';
    MinimizeOtherGroupsAction.LABEL = (0, nls_1.localize)('minimizeOtherEditorGroups', "Maximize Editor Group");
    MinimizeOtherGroupsAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], MinimizeOtherGroupsAction);
    exports.MinimizeOtherGroupsAction = MinimizeOtherGroupsAction;
    let ResetGroupSizesAction = class ResetGroupSizesAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        async run() {
            this.editorGroupService.arrangeGroups(1 /* GroupsArrangement.EVEN */);
        }
    };
    ResetGroupSizesAction.ID = 'workbench.action.evenEditorWidths';
    ResetGroupSizesAction.LABEL = (0, nls_1.localize)('evenEditorGroups', "Reset Editor Group Sizes");
    ResetGroupSizesAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], ResetGroupSizesAction);
    exports.ResetGroupSizesAction = ResetGroupSizesAction;
    let ToggleGroupSizesAction = class ToggleGroupSizesAction extends actions_1.Action {
        constructor(id, label, editorGroupService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
        }
        async run() {
            this.editorGroupService.arrangeGroups(2 /* GroupsArrangement.TOGGLE */);
        }
    };
    ToggleGroupSizesAction.ID = 'workbench.action.toggleEditorWidths';
    ToggleGroupSizesAction.LABEL = (0, nls_1.localize)('toggleEditorWidths', "Toggle Editor Group Sizes");
    ToggleGroupSizesAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], ToggleGroupSizesAction);
    exports.ToggleGroupSizesAction = ToggleGroupSizesAction;
    let MaximizeGroupAction = class MaximizeGroupAction extends actions_1.Action {
        constructor(id, label, editorService, editorGroupService, layoutService) {
            super(id, label);
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.layoutService = layoutService;
        }
        async run() {
            if (this.editorService.activeEditor) {
                this.layoutService.setPartHidden(true, "workbench.parts.sidebar" /* Parts.SIDEBAR_PART */);
                this.layoutService.setPartHidden(true, "workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */);
                this.editorGroupService.arrangeGroups(0 /* GroupsArrangement.MINIMIZE_OTHERS */);
            }
        }
    };
    MaximizeGroupAction.ID = 'workbench.action.maximizeEditor';
    MaximizeGroupAction.LABEL = (0, nls_1.localize)('maximizeEditor', "Maximize Editor Group and Hide Side Bars");
    MaximizeGroupAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, editorGroupsService_1.IEditorGroupsService),
        __param(4, layoutService_1.IWorkbenchLayoutService)
    ], MaximizeGroupAction);
    exports.MaximizeGroupAction = MaximizeGroupAction;
    class AbstractNavigateEditorAction extends actions_1.Action {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label);
            this.editorGroupService = editorGroupService;
            this.editorService = editorService;
        }
        async run() {
            const result = this.navigate();
            if (!result) {
                return;
            }
            const { groupId, editor } = result;
            if (!editor) {
                return;
            }
            const group = this.editorGroupService.getGroup(groupId);
            if (group) {
                await group.openEditor(editor);
            }
        }
    }
    let OpenNextEditor = class OpenNextEditor extends AbstractNavigateEditorAction {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label, editorGroupService, editorService);
        }
        navigate() {
            // Navigate in active group if possible
            const activeGroup = this.editorGroupService.activeGroup;
            const activeGroupEditors = activeGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            const activeEditorIndex = activeGroup.activeEditor ? activeGroupEditors.indexOf(activeGroup.activeEditor) : -1;
            if (activeEditorIndex + 1 < activeGroupEditors.length) {
                return { editor: activeGroupEditors[activeEditorIndex + 1], groupId: activeGroup.id };
            }
            // Otherwise try in next group
            const nextGroup = this.editorGroupService.findGroup({ location: 2 /* GroupLocation.NEXT */ }, this.editorGroupService.activeGroup, true);
            if (nextGroup) {
                const previousGroupEditors = nextGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
                return { editor: previousGroupEditors[0], groupId: nextGroup.id };
            }
            return undefined;
        }
    };
    OpenNextEditor.ID = 'workbench.action.nextEditor';
    OpenNextEditor.LABEL = (0, nls_1.localize)('openNextEditor', "Open Next Editor");
    OpenNextEditor = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], OpenNextEditor);
    exports.OpenNextEditor = OpenNextEditor;
    let OpenPreviousEditor = class OpenPreviousEditor extends AbstractNavigateEditorAction {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label, editorGroupService, editorService);
        }
        navigate() {
            // Navigate in active group if possible
            const activeGroup = this.editorGroupService.activeGroup;
            const activeGroupEditors = activeGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            const activeEditorIndex = activeGroup.activeEditor ? activeGroupEditors.indexOf(activeGroup.activeEditor) : -1;
            if (activeEditorIndex > 0) {
                return { editor: activeGroupEditors[activeEditorIndex - 1], groupId: activeGroup.id };
            }
            // Otherwise try in previous group
            const previousGroup = this.editorGroupService.findGroup({ location: 3 /* GroupLocation.PREVIOUS */ }, this.editorGroupService.activeGroup, true);
            if (previousGroup) {
                const previousGroupEditors = previousGroup.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
                return { editor: previousGroupEditors[previousGroupEditors.length - 1], groupId: previousGroup.id };
            }
            return undefined;
        }
    };
    OpenPreviousEditor.ID = 'workbench.action.previousEditor';
    OpenPreviousEditor.LABEL = (0, nls_1.localize)('openPreviousEditor', "Open Previous Editor");
    OpenPreviousEditor = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], OpenPreviousEditor);
    exports.OpenPreviousEditor = OpenPreviousEditor;
    let OpenNextEditorInGroup = class OpenNextEditorInGroup extends AbstractNavigateEditorAction {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label, editorGroupService, editorService);
        }
        navigate() {
            const group = this.editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            const index = group.activeEditor ? editors.indexOf(group.activeEditor) : -1;
            return { editor: index + 1 < editors.length ? editors[index + 1] : editors[0], groupId: group.id };
        }
    };
    OpenNextEditorInGroup.ID = 'workbench.action.nextEditorInGroup';
    OpenNextEditorInGroup.LABEL = (0, nls_1.localize)('nextEditorInGroup', "Open Next Editor in Group");
    OpenNextEditorInGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], OpenNextEditorInGroup);
    exports.OpenNextEditorInGroup = OpenNextEditorInGroup;
    let OpenPreviousEditorInGroup = class OpenPreviousEditorInGroup extends AbstractNavigateEditorAction {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label, editorGroupService, editorService);
        }
        navigate() {
            const group = this.editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            const index = group.activeEditor ? editors.indexOf(group.activeEditor) : -1;
            return { editor: index > 0 ? editors[index - 1] : editors[editors.length - 1], groupId: group.id };
        }
    };
    OpenPreviousEditorInGroup.ID = 'workbench.action.previousEditorInGroup';
    OpenPreviousEditorInGroup.LABEL = (0, nls_1.localize)('openPreviousEditorInGroup', "Open Previous Editor in Group");
    OpenPreviousEditorInGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], OpenPreviousEditorInGroup);
    exports.OpenPreviousEditorInGroup = OpenPreviousEditorInGroup;
    let OpenFirstEditorInGroup = class OpenFirstEditorInGroup extends AbstractNavigateEditorAction {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label, editorGroupService, editorService);
        }
        navigate() {
            const group = this.editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            return { editor: editors[0], groupId: group.id };
        }
    };
    OpenFirstEditorInGroup.ID = 'workbench.action.firstEditorInGroup';
    OpenFirstEditorInGroup.LABEL = (0, nls_1.localize)('firstEditorInGroup', "Open First Editor in Group");
    OpenFirstEditorInGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], OpenFirstEditorInGroup);
    exports.OpenFirstEditorInGroup = OpenFirstEditorInGroup;
    let OpenLastEditorInGroup = class OpenLastEditorInGroup extends AbstractNavigateEditorAction {
        constructor(id, label, editorGroupService, editorService) {
            super(id, label, editorGroupService, editorService);
        }
        navigate() {
            const group = this.editorGroupService.activeGroup;
            const editors = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */);
            return { editor: editors[editors.length - 1], groupId: group.id };
        }
    };
    OpenLastEditorInGroup.ID = 'workbench.action.lastEditorInGroup';
    OpenLastEditorInGroup.LABEL = (0, nls_1.localize)('lastEditorInGroup', "Open Last Editor in Group");
    OpenLastEditorInGroup = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService),
        __param(3, editorService_1.IEditorService)
    ], OpenLastEditorInGroup);
    exports.OpenLastEditorInGroup = OpenLastEditorInGroup;
    let NavigateForwardAction = class NavigateForwardAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            await this.historyService.goForward(0 /* GoFilter.NONE */);
        }
    };
    NavigateForwardAction.ID = 'workbench.action.navigateForward';
    NavigateForwardAction.LABEL = (0, nls_1.localize)('navigateForward', "Go Forward");
    NavigateForwardAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigateForwardAction);
    exports.NavigateForwardAction = NavigateForwardAction;
    let NavigateBackwardsAction = class NavigateBackwardsAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            await this.historyService.goBack(0 /* GoFilter.NONE */);
        }
    };
    NavigateBackwardsAction.ID = 'workbench.action.navigateBack';
    NavigateBackwardsAction.LABEL = (0, nls_1.localize)('navigateBack', "Go Back");
    NavigateBackwardsAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigateBackwardsAction);
    exports.NavigateBackwardsAction = NavigateBackwardsAction;
    let NavigatePreviousAction = class NavigatePreviousAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            await this.historyService.goPrevious(0 /* GoFilter.NONE */);
        }
    };
    NavigatePreviousAction.ID = 'workbench.action.navigateLast';
    NavigatePreviousAction.LABEL = (0, nls_1.localize)('navigatePrevious', "Go Previous");
    NavigatePreviousAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigatePreviousAction);
    exports.NavigatePreviousAction = NavigatePreviousAction;
    let NavigateForwardInEditsAction = class NavigateForwardInEditsAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            await this.historyService.goForward(1 /* GoFilter.EDITS */);
        }
    };
    NavigateForwardInEditsAction.ID = 'workbench.action.navigateForwardInEditLocations';
    NavigateForwardInEditsAction.LABEL = (0, nls_1.localize)('navigateForwardInEdits', "Go Forward in Edit Locations");
    NavigateForwardInEditsAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigateForwardInEditsAction);
    exports.NavigateForwardInEditsAction = NavigateForwardInEditsAction;
    let NavigateBackwardsInEditsAction = class NavigateBackwardsInEditsAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            await this.historyService.goBack(1 /* GoFilter.EDITS */);
        }
    };
    NavigateBackwardsInEditsAction.ID = 'workbench.action.navigateBackInEditLocations';
    NavigateBackwardsInEditsAction.LABEL = (0, nls_1.localize)('navigateBackInEdits', "Go Back in Edit Locations");
    NavigateBackwardsInEditsAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigateBackwardsInEditsAction);
    exports.NavigateBackwardsInEditsAction = NavigateBackwardsInEditsAction;
    let NavigatePreviousInEditsAction = class NavigatePreviousInEditsAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            await this.historyService.goPrevious(1 /* GoFilter.EDITS */);
        }
    };
    NavigatePreviousInEditsAction.ID = 'workbench.action.navigatePreviousInEditLocations';
    NavigatePreviousInEditsAction.LABEL = (0, nls_1.localize)('navigatePreviousInEdits', "Go Previous in Edit Locations");
    NavigatePreviousInEditsAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigatePreviousInEditsAction);
    exports.NavigatePreviousInEditsAction = NavigatePreviousInEditsAction;
    let NavigateToLastEditLocationAction = class NavigateToLastEditLocationAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            await this.historyService.goLast(1 /* GoFilter.EDITS */);
        }
    };
    NavigateToLastEditLocationAction.ID = 'workbench.action.navigateToLastEditLocation';
    NavigateToLastEditLocationAction.LABEL = (0, nls_1.localize)('navigateToLastEditLocation', "Go to Last Edit Location");
    NavigateToLastEditLocationAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigateToLastEditLocationAction);
    exports.NavigateToLastEditLocationAction = NavigateToLastEditLocationAction;
    let NavigateForwardInNavigationsAction = class NavigateForwardInNavigationsAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            await this.historyService.goForward(2 /* GoFilter.NAVIGATION */);
        }
    };
    NavigateForwardInNavigationsAction.ID = 'workbench.action.navigateForwardInNavigationLocations';
    NavigateForwardInNavigationsAction.LABEL = (0, nls_1.localize)('navigateForwardInNavigations', "Go Forward in Navigation Locations");
    NavigateForwardInNavigationsAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigateForwardInNavigationsAction);
    exports.NavigateForwardInNavigationsAction = NavigateForwardInNavigationsAction;
    let NavigateBackwardsInNavigationsAction = class NavigateBackwardsInNavigationsAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            await this.historyService.goBack(2 /* GoFilter.NAVIGATION */);
        }
    };
    NavigateBackwardsInNavigationsAction.ID = 'workbench.action.navigateBackInNavigationLocations';
    NavigateBackwardsInNavigationsAction.LABEL = (0, nls_1.localize)('navigateBackInNavigations', "Go Back in Navigation Locations");
    NavigateBackwardsInNavigationsAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigateBackwardsInNavigationsAction);
    exports.NavigateBackwardsInNavigationsAction = NavigateBackwardsInNavigationsAction;
    let NavigatePreviousInNavigationsAction = class NavigatePreviousInNavigationsAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            await this.historyService.goPrevious(2 /* GoFilter.NAVIGATION */);
        }
    };
    NavigatePreviousInNavigationsAction.ID = 'workbench.action.navigatePreviousInNavigationLocations';
    NavigatePreviousInNavigationsAction.LABEL = (0, nls_1.localize)('navigatePreviousInNavigationLocations', "Go Previous in Navigation Locations");
    NavigatePreviousInNavigationsAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigatePreviousInNavigationsAction);
    exports.NavigatePreviousInNavigationsAction = NavigatePreviousInNavigationsAction;
    let NavigateToLastNavigationLocationAction = class NavigateToLastNavigationLocationAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            await this.historyService.goLast(2 /* GoFilter.NAVIGATION */);
        }
    };
    NavigateToLastNavigationLocationAction.ID = 'workbench.action.navigateToLastNavigationLocation';
    NavigateToLastNavigationLocationAction.LABEL = (0, nls_1.localize)('navigateToLastNavigationLocation', "Go to Last Navigation Location");
    NavigateToLastNavigationLocationAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], NavigateToLastNavigationLocationAction);
    exports.NavigateToLastNavigationLocationAction = NavigateToLastNavigationLocationAction;
    let ReopenClosedEditorAction = class ReopenClosedEditorAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            await this.historyService.reopenLastClosedEditor();
        }
    };
    ReopenClosedEditorAction.ID = 'workbench.action.reopenClosedEditor';
    ReopenClosedEditorAction.LABEL = (0, nls_1.localize)('reopenClosedEditor', "Reopen Closed Editor");
    ReopenClosedEditorAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], ReopenClosedEditorAction);
    exports.ReopenClosedEditorAction = ReopenClosedEditorAction;
    let ClearRecentFilesAction = class ClearRecentFilesAction extends actions_1.Action {
        constructor(id, label, workspacesService, historyService, dialogService) {
            super(id, label);
            this.workspacesService = workspacesService;
            this.historyService = historyService;
            this.dialogService = dialogService;
        }
        async run() {
            // Ask for confirmation
            const { confirmed } = await this.dialogService.confirm({
                message: (0, nls_1.localize)('confirmClearRecentsMessage', "Do you want to clear all recently opened files and workspaces?"),
                detail: (0, nls_1.localize)('confirmClearDetail', "This action is irreversible!"),
                primaryButton: (0, nls_1.localize)({ key: 'clearButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Clear"),
                type: 'warning'
            });
            if (!confirmed) {
                return;
            }
            // Clear global recently opened
            this.workspacesService.clearRecentlyOpened();
            // Clear workspace specific recently opened
            this.historyService.clearRecentlyOpened();
        }
    };
    ClearRecentFilesAction.ID = 'workbench.action.clearRecentFiles';
    ClearRecentFilesAction.LABEL = (0, nls_1.localize)('clearRecentFiles', "Clear Recently Opened");
    ClearRecentFilesAction = __decorate([
        __param(2, workspaces_1.IWorkspacesService),
        __param(3, history_1.IHistoryService),
        __param(4, dialogs_1.IDialogService)
    ], ClearRecentFilesAction);
    exports.ClearRecentFilesAction = ClearRecentFilesAction;
    let ShowEditorsInActiveGroupByMostRecentlyUsedAction = class ShowEditorsInActiveGroupByMostRecentlyUsedAction extends actions_1.Action {
        constructor(id, label, quickInputService) {
            super(id, label);
            this.quickInputService = quickInputService;
        }
        async run() {
            this.quickInputService.quickAccess.show(editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX);
        }
    };
    ShowEditorsInActiveGroupByMostRecentlyUsedAction.ID = 'workbench.action.showEditorsInActiveGroup';
    ShowEditorsInActiveGroupByMostRecentlyUsedAction.LABEL = (0, nls_1.localize)('showEditorsInActiveGroup', "Show Editors in Active Group By Most Recently Used");
    ShowEditorsInActiveGroupByMostRecentlyUsedAction = __decorate([
        __param(2, quickInput_1.IQuickInputService)
    ], ShowEditorsInActiveGroupByMostRecentlyUsedAction);
    exports.ShowEditorsInActiveGroupByMostRecentlyUsedAction = ShowEditorsInActiveGroupByMostRecentlyUsedAction;
    let ShowAllEditorsByAppearanceAction = class ShowAllEditorsByAppearanceAction extends actions_1.Action {
        constructor(id, label, quickInputService) {
            super(id, label);
            this.quickInputService = quickInputService;
        }
        async run() {
            this.quickInputService.quickAccess.show(editorQuickAccess_1.AllEditorsByAppearanceQuickAccess.PREFIX);
        }
    };
    ShowAllEditorsByAppearanceAction.ID = 'workbench.action.showAllEditors';
    ShowAllEditorsByAppearanceAction.LABEL = (0, nls_1.localize)('showAllEditors', "Show All Editors By Appearance");
    ShowAllEditorsByAppearanceAction = __decorate([
        __param(2, quickInput_1.IQuickInputService)
    ], ShowAllEditorsByAppearanceAction);
    exports.ShowAllEditorsByAppearanceAction = ShowAllEditorsByAppearanceAction;
    let ShowAllEditorsByMostRecentlyUsedAction = class ShowAllEditorsByMostRecentlyUsedAction extends actions_1.Action {
        constructor(id, label, quickInputService) {
            super(id, label);
            this.quickInputService = quickInputService;
        }
        async run() {
            this.quickInputService.quickAccess.show(editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX);
        }
    };
    ShowAllEditorsByMostRecentlyUsedAction.ID = 'workbench.action.showAllEditorsByMostRecentlyUsed';
    ShowAllEditorsByMostRecentlyUsedAction.LABEL = (0, nls_1.localize)('showAllEditorsByMostRecentlyUsed', "Show All Editors By Most Recently Used");
    ShowAllEditorsByMostRecentlyUsedAction = __decorate([
        __param(2, quickInput_1.IQuickInputService)
    ], ShowAllEditorsByMostRecentlyUsedAction);
    exports.ShowAllEditorsByMostRecentlyUsedAction = ShowAllEditorsByMostRecentlyUsedAction;
    let AbstractQuickAccessEditorAction = class AbstractQuickAccessEditorAction extends actions_1.Action {
        constructor(id, label, prefix, itemActivation, quickInputService, keybindingService) {
            super(id, label);
            this.prefix = prefix;
            this.itemActivation = itemActivation;
            this.quickInputService = quickInputService;
            this.keybindingService = keybindingService;
        }
        async run() {
            const keybindings = this.keybindingService.lookupKeybindings(this.id);
            this.quickInputService.quickAccess.show(this.prefix, {
                quickNavigateConfiguration: { keybindings },
                itemActivation: this.itemActivation
            });
        }
    };
    AbstractQuickAccessEditorAction = __decorate([
        __param(4, quickInput_1.IQuickInputService),
        __param(5, keybinding_1.IKeybindingService)
    ], AbstractQuickAccessEditorAction);
    let QuickAccessPreviousRecentlyUsedEditorAction = class QuickAccessPreviousRecentlyUsedEditorAction extends AbstractQuickAccessEditorAction {
        constructor(id, label, quickInputService, keybindingService) {
            super(id, label, editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX, undefined, quickInputService, keybindingService);
        }
    };
    QuickAccessPreviousRecentlyUsedEditorAction.ID = 'workbench.action.quickOpenPreviousRecentlyUsedEditor';
    QuickAccessPreviousRecentlyUsedEditorAction.LABEL = (0, nls_1.localize)('quickOpenPreviousRecentlyUsedEditor', "Quick Open Previous Recently Used Editor");
    QuickAccessPreviousRecentlyUsedEditorAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, keybinding_1.IKeybindingService)
    ], QuickAccessPreviousRecentlyUsedEditorAction);
    exports.QuickAccessPreviousRecentlyUsedEditorAction = QuickAccessPreviousRecentlyUsedEditorAction;
    let QuickAccessLeastRecentlyUsedEditorAction = class QuickAccessLeastRecentlyUsedEditorAction extends AbstractQuickAccessEditorAction {
        constructor(id, label, quickInputService, keybindingService) {
            super(id, label, editorQuickAccess_1.AllEditorsByMostRecentlyUsedQuickAccess.PREFIX, undefined, quickInputService, keybindingService);
        }
    };
    QuickAccessLeastRecentlyUsedEditorAction.ID = 'workbench.action.quickOpenLeastRecentlyUsedEditor';
    QuickAccessLeastRecentlyUsedEditorAction.LABEL = (0, nls_1.localize)('quickOpenLeastRecentlyUsedEditor', "Quick Open Least Recently Used Editor");
    QuickAccessLeastRecentlyUsedEditorAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, keybinding_1.IKeybindingService)
    ], QuickAccessLeastRecentlyUsedEditorAction);
    exports.QuickAccessLeastRecentlyUsedEditorAction = QuickAccessLeastRecentlyUsedEditorAction;
    let QuickAccessPreviousRecentlyUsedEditorInGroupAction = class QuickAccessPreviousRecentlyUsedEditorInGroupAction extends AbstractQuickAccessEditorAction {
        constructor(id, label, quickInputService, keybindingService) {
            super(id, label, editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX, undefined, quickInputService, keybindingService);
        }
    };
    QuickAccessPreviousRecentlyUsedEditorInGroupAction.ID = 'workbench.action.quickOpenPreviousRecentlyUsedEditorInGroup';
    QuickAccessPreviousRecentlyUsedEditorInGroupAction.LABEL = (0, nls_1.localize)('quickOpenPreviousRecentlyUsedEditorInGroup', "Quick Open Previous Recently Used Editor in Group");
    QuickAccessPreviousRecentlyUsedEditorInGroupAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, keybinding_1.IKeybindingService)
    ], QuickAccessPreviousRecentlyUsedEditorInGroupAction);
    exports.QuickAccessPreviousRecentlyUsedEditorInGroupAction = QuickAccessPreviousRecentlyUsedEditorInGroupAction;
    let QuickAccessLeastRecentlyUsedEditorInGroupAction = class QuickAccessLeastRecentlyUsedEditorInGroupAction extends AbstractQuickAccessEditorAction {
        constructor(id, label, quickInputService, keybindingService) {
            super(id, label, editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX, quickInput_1.ItemActivation.LAST, quickInputService, keybindingService);
        }
    };
    QuickAccessLeastRecentlyUsedEditorInGroupAction.ID = 'workbench.action.quickOpenLeastRecentlyUsedEditorInGroup';
    QuickAccessLeastRecentlyUsedEditorInGroupAction.LABEL = (0, nls_1.localize)('quickOpenLeastRecentlyUsedEditorInGroup', "Quick Open Least Recently Used Editor in Group");
    QuickAccessLeastRecentlyUsedEditorInGroupAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, keybinding_1.IKeybindingService)
    ], QuickAccessLeastRecentlyUsedEditorInGroupAction);
    exports.QuickAccessLeastRecentlyUsedEditorInGroupAction = QuickAccessLeastRecentlyUsedEditorInGroupAction;
    let QuickAccessPreviousEditorFromHistoryAction = class QuickAccessPreviousEditorFromHistoryAction extends actions_1.Action {
        constructor(id, label, quickInputService, keybindingService, editorGroupService) {
            super(id, label);
            this.quickInputService = quickInputService;
            this.keybindingService = keybindingService;
            this.editorGroupService = editorGroupService;
        }
        async run() {
            const keybindings = this.keybindingService.lookupKeybindings(this.id);
            // Enforce to activate the first item in quick access if
            // the currently active editor group has n editor opened
            let itemActivation = undefined;
            if (this.editorGroupService.activeGroup.count === 0) {
                itemActivation = quickInput_1.ItemActivation.FIRST;
            }
            this.quickInputService.quickAccess.show('', { quickNavigateConfiguration: { keybindings }, itemActivation });
        }
    };
    QuickAccessPreviousEditorFromHistoryAction.ID = 'workbench.action.openPreviousEditorFromHistory';
    QuickAccessPreviousEditorFromHistoryAction.LABEL = (0, nls_1.localize)('navigateEditorHistoryByInput', "Quick Open Previous Editor from History");
    QuickAccessPreviousEditorFromHistoryAction = __decorate([
        __param(2, quickInput_1.IQuickInputService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, editorGroupsService_1.IEditorGroupsService)
    ], QuickAccessPreviousEditorFromHistoryAction);
    exports.QuickAccessPreviousEditorFromHistoryAction = QuickAccessPreviousEditorFromHistoryAction;
    let OpenNextRecentlyUsedEditorAction = class OpenNextRecentlyUsedEditorAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            this.historyService.openNextRecentlyUsedEditor();
        }
    };
    OpenNextRecentlyUsedEditorAction.ID = 'workbench.action.openNextRecentlyUsedEditor';
    OpenNextRecentlyUsedEditorAction.LABEL = (0, nls_1.localize)('openNextRecentlyUsedEditor', "Open Next Recently Used Editor");
    OpenNextRecentlyUsedEditorAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], OpenNextRecentlyUsedEditorAction);
    exports.OpenNextRecentlyUsedEditorAction = OpenNextRecentlyUsedEditorAction;
    let OpenPreviousRecentlyUsedEditorAction = class OpenPreviousRecentlyUsedEditorAction extends actions_1.Action {
        constructor(id, label, historyService) {
            super(id, label);
            this.historyService = historyService;
        }
        async run() {
            this.historyService.openPreviouslyUsedEditor();
        }
    };
    OpenPreviousRecentlyUsedEditorAction.ID = 'workbench.action.openPreviousRecentlyUsedEditor';
    OpenPreviousRecentlyUsedEditorAction.LABEL = (0, nls_1.localize)('openPreviousRecentlyUsedEditor', "Open Previous Recently Used Editor");
    OpenPreviousRecentlyUsedEditorAction = __decorate([
        __param(2, history_1.IHistoryService)
    ], OpenPreviousRecentlyUsedEditorAction);
    exports.OpenPreviousRecentlyUsedEditorAction = OpenPreviousRecentlyUsedEditorAction;
    let OpenNextRecentlyUsedEditorInGroupAction = class OpenNextRecentlyUsedEditorInGroupAction extends actions_1.Action {
        constructor(id, label, historyService, editorGroupsService) {
            super(id, label);
            this.historyService = historyService;
            this.editorGroupsService = editorGroupsService;
        }
        async run() {
            this.historyService.openNextRecentlyUsedEditor(this.editorGroupsService.activeGroup.id);
        }
    };
    OpenNextRecentlyUsedEditorInGroupAction.ID = 'workbench.action.openNextRecentlyUsedEditorInGroup';
    OpenNextRecentlyUsedEditorInGroupAction.LABEL = (0, nls_1.localize)('openNextRecentlyUsedEditorInGroup', "Open Next Recently Used Editor In Group");
    OpenNextRecentlyUsedEditorInGroupAction = __decorate([
        __param(2, history_1.IHistoryService),
        __param(3, editorGroupsService_1.IEditorGroupsService)
    ], OpenNextRecentlyUsedEditorInGroupAction);
    exports.OpenNextRecentlyUsedEditorInGroupAction = OpenNextRecentlyUsedEditorInGroupAction;
    let OpenPreviousRecentlyUsedEditorInGroupAction = class OpenPreviousRecentlyUsedEditorInGroupAction extends actions_1.Action {
        constructor(id, label, historyService, editorGroupsService) {
            super(id, label);
            this.historyService = historyService;
            this.editorGroupsService = editorGroupsService;
        }
        async run() {
            this.historyService.openPreviouslyUsedEditor(this.editorGroupsService.activeGroup.id);
        }
    };
    OpenPreviousRecentlyUsedEditorInGroupAction.ID = 'workbench.action.openPreviousRecentlyUsedEditorInGroup';
    OpenPreviousRecentlyUsedEditorInGroupAction.LABEL = (0, nls_1.localize)('openPreviousRecentlyUsedEditorInGroup', "Open Previous Recently Used Editor In Group");
    OpenPreviousRecentlyUsedEditorInGroupAction = __decorate([
        __param(2, history_1.IHistoryService),
        __param(3, editorGroupsService_1.IEditorGroupsService)
    ], OpenPreviousRecentlyUsedEditorInGroupAction);
    exports.OpenPreviousRecentlyUsedEditorInGroupAction = OpenPreviousRecentlyUsedEditorInGroupAction;
    let ClearEditorHistoryAction = class ClearEditorHistoryAction extends actions_1.Action {
        constructor(id, label, historyService, dialogService) {
            super(id, label);
            this.historyService = historyService;
            this.dialogService = dialogService;
        }
        async run() {
            // Ask for confirmation
            const { confirmed } = await this.dialogService.confirm({
                message: (0, nls_1.localize)('confirmClearEditorHistoryMessage', "Do you want to clear the history of recently opened editors?"),
                detail: (0, nls_1.localize)('confirmClearDetail', "This action is irreversible!"),
                primaryButton: (0, nls_1.localize)({ key: 'clearButtonLabel', comment: ['&& denotes a mnemonic'] }, "&&Clear"),
                type: 'warning'
            });
            if (!confirmed) {
                return;
            }
            // Clear editor history
            this.historyService.clear();
        }
    };
    ClearEditorHistoryAction.ID = 'workbench.action.clearEditorHistory';
    ClearEditorHistoryAction.LABEL = (0, nls_1.localize)('clearEditorHistory', "Clear Editor History");
    ClearEditorHistoryAction = __decorate([
        __param(2, history_1.IHistoryService),
        __param(3, dialogs_1.IDialogService)
    ], ClearEditorHistoryAction);
    exports.ClearEditorHistoryAction = ClearEditorHistoryAction;
    let MoveEditorLeftInGroupAction = class MoveEditorLeftInGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'left' });
        }
    };
    MoveEditorLeftInGroupAction.ID = 'workbench.action.moveEditorLeftInGroup';
    MoveEditorLeftInGroupAction.LABEL = (0, nls_1.localize)('moveEditorLeft', "Move Editor Left");
    MoveEditorLeftInGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorLeftInGroupAction);
    exports.MoveEditorLeftInGroupAction = MoveEditorLeftInGroupAction;
    let MoveEditorRightInGroupAction = class MoveEditorRightInGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'right' });
        }
    };
    MoveEditorRightInGroupAction.ID = 'workbench.action.moveEditorRightInGroup';
    MoveEditorRightInGroupAction.LABEL = (0, nls_1.localize)('moveEditorRight', "Move Editor Right");
    MoveEditorRightInGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorRightInGroupAction);
    exports.MoveEditorRightInGroupAction = MoveEditorRightInGroupAction;
    let MoveEditorToPreviousGroupAction = class MoveEditorToPreviousGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'previous', by: 'group' });
        }
    };
    MoveEditorToPreviousGroupAction.ID = 'workbench.action.moveEditorToPreviousGroup';
    MoveEditorToPreviousGroupAction.LABEL = (0, nls_1.localize)('moveEditorToPreviousGroup', "Move Editor into Previous Group");
    MoveEditorToPreviousGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToPreviousGroupAction);
    exports.MoveEditorToPreviousGroupAction = MoveEditorToPreviousGroupAction;
    let MoveEditorToNextGroupAction = class MoveEditorToNextGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'next', by: 'group' });
        }
    };
    MoveEditorToNextGroupAction.ID = 'workbench.action.moveEditorToNextGroup';
    MoveEditorToNextGroupAction.LABEL = (0, nls_1.localize)('moveEditorToNextGroup', "Move Editor into Next Group");
    MoveEditorToNextGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToNextGroupAction);
    exports.MoveEditorToNextGroupAction = MoveEditorToNextGroupAction;
    let MoveEditorToAboveGroupAction = class MoveEditorToAboveGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'up', by: 'group' });
        }
    };
    MoveEditorToAboveGroupAction.ID = 'workbench.action.moveEditorToAboveGroup';
    MoveEditorToAboveGroupAction.LABEL = (0, nls_1.localize)('moveEditorToAboveGroup', "Move Editor into Group Above");
    MoveEditorToAboveGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToAboveGroupAction);
    exports.MoveEditorToAboveGroupAction = MoveEditorToAboveGroupAction;
    let MoveEditorToBelowGroupAction = class MoveEditorToBelowGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'down', by: 'group' });
        }
    };
    MoveEditorToBelowGroupAction.ID = 'workbench.action.moveEditorToBelowGroup';
    MoveEditorToBelowGroupAction.LABEL = (0, nls_1.localize)('moveEditorToBelowGroup', "Move Editor into Group Below");
    MoveEditorToBelowGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToBelowGroupAction);
    exports.MoveEditorToBelowGroupAction = MoveEditorToBelowGroupAction;
    let MoveEditorToLeftGroupAction = class MoveEditorToLeftGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'left', by: 'group' });
        }
    };
    MoveEditorToLeftGroupAction.ID = 'workbench.action.moveEditorToLeftGroup';
    MoveEditorToLeftGroupAction.LABEL = (0, nls_1.localize)('moveEditorToLeftGroup', "Move Editor into Left Group");
    MoveEditorToLeftGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToLeftGroupAction);
    exports.MoveEditorToLeftGroupAction = MoveEditorToLeftGroupAction;
    let MoveEditorToRightGroupAction = class MoveEditorToRightGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'right', by: 'group' });
        }
    };
    MoveEditorToRightGroupAction.ID = 'workbench.action.moveEditorToRightGroup';
    MoveEditorToRightGroupAction.LABEL = (0, nls_1.localize)('moveEditorToRightGroup', "Move Editor into Right Group");
    MoveEditorToRightGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToRightGroupAction);
    exports.MoveEditorToRightGroupAction = MoveEditorToRightGroupAction;
    let MoveEditorToFirstGroupAction = class MoveEditorToFirstGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'first', by: 'group' });
        }
    };
    MoveEditorToFirstGroupAction.ID = 'workbench.action.moveEditorToFirstGroup';
    MoveEditorToFirstGroupAction.LABEL = (0, nls_1.localize)('moveEditorToFirstGroup', "Move Editor into First Group");
    MoveEditorToFirstGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToFirstGroupAction);
    exports.MoveEditorToFirstGroupAction = MoveEditorToFirstGroupAction;
    let MoveEditorToLastGroupAction = class MoveEditorToLastGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.MOVE_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'last', by: 'group' });
        }
    };
    MoveEditorToLastGroupAction.ID = 'workbench.action.moveEditorToLastGroup';
    MoveEditorToLastGroupAction.LABEL = (0, nls_1.localize)('moveEditorToLastGroup', "Move Editor into Last Group");
    MoveEditorToLastGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], MoveEditorToLastGroupAction);
    exports.MoveEditorToLastGroupAction = MoveEditorToLastGroupAction;
    let SplitEditorToPreviousGroupAction = class SplitEditorToPreviousGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'previous', by: 'group' });
        }
    };
    SplitEditorToPreviousGroupAction.ID = 'workbench.action.splitEditorToPreviousGroup';
    SplitEditorToPreviousGroupAction.LABEL = (0, nls_1.localize)('splitEditorToPreviousGroup', "Split Editor into Previous Group");
    SplitEditorToPreviousGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorToPreviousGroupAction);
    exports.SplitEditorToPreviousGroupAction = SplitEditorToPreviousGroupAction;
    let SplitEditorToNextGroupAction = class SplitEditorToNextGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'next', by: 'group' });
        }
    };
    SplitEditorToNextGroupAction.ID = 'workbench.action.splitEditorToNextGroup';
    SplitEditorToNextGroupAction.LABEL = (0, nls_1.localize)('splitEditorToNextGroup', "Split Editor into Next Group");
    SplitEditorToNextGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorToNextGroupAction);
    exports.SplitEditorToNextGroupAction = SplitEditorToNextGroupAction;
    let SplitEditorToAboveGroupAction = class SplitEditorToAboveGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'up', by: 'group' });
        }
    };
    SplitEditorToAboveGroupAction.ID = 'workbench.action.splitEditorToAboveGroup';
    SplitEditorToAboveGroupAction.LABEL = (0, nls_1.localize)('splitEditorToAboveGroup', "Split Editor into Group Above");
    SplitEditorToAboveGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorToAboveGroupAction);
    exports.SplitEditorToAboveGroupAction = SplitEditorToAboveGroupAction;
    let SplitEditorToBelowGroupAction = class SplitEditorToBelowGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'down', by: 'group' });
        }
    };
    SplitEditorToBelowGroupAction.ID = 'workbench.action.splitEditorToBelowGroup';
    SplitEditorToBelowGroupAction.LABEL = (0, nls_1.localize)('splitEditorToBelowGroup', "Split Editor into Group Below");
    SplitEditorToBelowGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorToBelowGroupAction);
    exports.SplitEditorToBelowGroupAction = SplitEditorToBelowGroupAction;
    let SplitEditorToLeftGroupAction = class SplitEditorToLeftGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'left', by: 'group' });
        }
    };
    SplitEditorToLeftGroupAction.ID = 'workbench.action.splitEditorToLeftGroup';
    SplitEditorToLeftGroupAction.LABEL = (0, nls_1.localize)('splitEditorToLeftGroup', "Split Editor into Left Group");
    SplitEditorToLeftGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorToLeftGroupAction);
    exports.SplitEditorToLeftGroupAction = SplitEditorToLeftGroupAction;
    let SplitEditorToRightGroupAction = class SplitEditorToRightGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'right', by: 'group' });
        }
    };
    SplitEditorToRightGroupAction.ID = 'workbench.action.splitEditorToRightGroup';
    SplitEditorToRightGroupAction.LABEL = (0, nls_1.localize)('splitEditorToRightGroup', "Split Editor into Right Group");
    SplitEditorToRightGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorToRightGroupAction);
    exports.SplitEditorToRightGroupAction = SplitEditorToRightGroupAction;
    let SplitEditorToFirstGroupAction = class SplitEditorToFirstGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'first', by: 'group' });
        }
    };
    SplitEditorToFirstGroupAction.ID = 'workbench.action.splitEditorToFirstGroup';
    SplitEditorToFirstGroupAction.LABEL = (0, nls_1.localize)('splitEditorToFirstGroup', "Split Editor into First Group");
    SplitEditorToFirstGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorToFirstGroupAction);
    exports.SplitEditorToFirstGroupAction = SplitEditorToFirstGroupAction;
    let SplitEditorToLastGroupAction = class SplitEditorToLastGroupAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.COPY_ACTIVE_EDITOR_COMMAND_ID, commandService, { to: 'last', by: 'group' });
        }
    };
    SplitEditorToLastGroupAction.ID = 'workbench.action.splitEditorToLastGroup';
    SplitEditorToLastGroupAction.LABEL = (0, nls_1.localize)('splitEditorToLastGroup', "Split Editor into Last Group");
    SplitEditorToLastGroupAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], SplitEditorToLastGroupAction);
    exports.SplitEditorToLastGroupAction = SplitEditorToLastGroupAction;
    let EditorLayoutSingleAction = class EditorLayoutSingleAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}] });
        }
    };
    EditorLayoutSingleAction.ID = 'workbench.action.editorLayoutSingle';
    EditorLayoutSingleAction.LABEL = (0, nls_1.localize)('editorLayoutSingle', "Single Column Editor Layout");
    EditorLayoutSingleAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutSingleAction);
    exports.EditorLayoutSingleAction = EditorLayoutSingleAction;
    let EditorLayoutTwoColumnsAction = class EditorLayoutTwoColumnsAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}, {}], orientation: 0 /* GroupOrientation.HORIZONTAL */ });
        }
    };
    EditorLayoutTwoColumnsAction.ID = 'workbench.action.editorLayoutTwoColumns';
    EditorLayoutTwoColumnsAction.LABEL = (0, nls_1.localize)('editorLayoutTwoColumns', "Two Columns Editor Layout");
    EditorLayoutTwoColumnsAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutTwoColumnsAction);
    exports.EditorLayoutTwoColumnsAction = EditorLayoutTwoColumnsAction;
    let EditorLayoutThreeColumnsAction = class EditorLayoutThreeColumnsAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}, {}, {}], orientation: 0 /* GroupOrientation.HORIZONTAL */ });
        }
    };
    EditorLayoutThreeColumnsAction.ID = 'workbench.action.editorLayoutThreeColumns';
    EditorLayoutThreeColumnsAction.LABEL = (0, nls_1.localize)('editorLayoutThreeColumns', "Three Columns Editor Layout");
    EditorLayoutThreeColumnsAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutThreeColumnsAction);
    exports.EditorLayoutThreeColumnsAction = EditorLayoutThreeColumnsAction;
    let EditorLayoutTwoRowsAction = class EditorLayoutTwoRowsAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}, {}], orientation: 1 /* GroupOrientation.VERTICAL */ });
        }
    };
    EditorLayoutTwoRowsAction.ID = 'workbench.action.editorLayoutTwoRows';
    EditorLayoutTwoRowsAction.LABEL = (0, nls_1.localize)('editorLayoutTwoRows', "Two Rows Editor Layout");
    EditorLayoutTwoRowsAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutTwoRowsAction);
    exports.EditorLayoutTwoRowsAction = EditorLayoutTwoRowsAction;
    let EditorLayoutThreeRowsAction = class EditorLayoutThreeRowsAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}, {}, {}], orientation: 1 /* GroupOrientation.VERTICAL */ });
        }
    };
    EditorLayoutThreeRowsAction.ID = 'workbench.action.editorLayoutThreeRows';
    EditorLayoutThreeRowsAction.LABEL = (0, nls_1.localize)('editorLayoutThreeRows', "Three Rows Editor Layout");
    EditorLayoutThreeRowsAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutThreeRowsAction);
    exports.EditorLayoutThreeRowsAction = EditorLayoutThreeRowsAction;
    let EditorLayoutTwoByTwoGridAction = class EditorLayoutTwoByTwoGridAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{ groups: [{}, {}] }, { groups: [{}, {}] }] });
        }
    };
    EditorLayoutTwoByTwoGridAction.ID = 'workbench.action.editorLayoutTwoByTwoGrid';
    EditorLayoutTwoByTwoGridAction.LABEL = (0, nls_1.localize)('editorLayoutTwoByTwoGrid', "Grid Editor Layout (2x2)");
    EditorLayoutTwoByTwoGridAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutTwoByTwoGridAction);
    exports.EditorLayoutTwoByTwoGridAction = EditorLayoutTwoByTwoGridAction;
    let EditorLayoutTwoColumnsBottomAction = class EditorLayoutTwoColumnsBottomAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}, { groups: [{}, {}] }], orientation: 1 /* GroupOrientation.VERTICAL */ });
        }
    };
    EditorLayoutTwoColumnsBottomAction.ID = 'workbench.action.editorLayoutTwoColumnsBottom';
    EditorLayoutTwoColumnsBottomAction.LABEL = (0, nls_1.localize)('editorLayoutTwoColumnsBottom', "Two Columns Bottom Editor Layout");
    EditorLayoutTwoColumnsBottomAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutTwoColumnsBottomAction);
    exports.EditorLayoutTwoColumnsBottomAction = EditorLayoutTwoColumnsBottomAction;
    let EditorLayoutTwoRowsRightAction = class EditorLayoutTwoRowsRightAction extends ExecuteCommandAction {
        constructor(id, label, commandService) {
            super(id, label, editorCommands_1.LAYOUT_EDITOR_GROUPS_COMMAND_ID, commandService, { groups: [{}, { groups: [{}, {}] }], orientation: 0 /* GroupOrientation.HORIZONTAL */ });
        }
    };
    EditorLayoutTwoRowsRightAction.ID = 'workbench.action.editorLayoutTwoRowsRight';
    EditorLayoutTwoRowsRightAction.LABEL = (0, nls_1.localize)('editorLayoutTwoRowsRight', "Two Rows Right Editor Layout");
    EditorLayoutTwoRowsRightAction = __decorate([
        __param(2, commands_1.ICommandService)
    ], EditorLayoutTwoRowsRightAction);
    exports.EditorLayoutTwoRowsRightAction = EditorLayoutTwoRowsRightAction;
    class AbstractCreateEditorGroupAction extends actions_1.Action {
        constructor(id, label, direction, editorGroupService) {
            super(id, label);
            this.direction = direction;
            this.editorGroupService = editorGroupService;
        }
        async run() {
            this.editorGroupService.addGroup(this.editorGroupService.activeGroup, this.direction, { activate: true });
        }
    }
    let NewEditorGroupLeftAction = class NewEditorGroupLeftAction extends AbstractCreateEditorGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 2 /* GroupDirection.LEFT */, editorGroupService);
        }
    };
    NewEditorGroupLeftAction.ID = 'workbench.action.newGroupLeft';
    NewEditorGroupLeftAction.LABEL = (0, nls_1.localize)('newEditorLeft', "New Editor Group to the Left");
    NewEditorGroupLeftAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], NewEditorGroupLeftAction);
    exports.NewEditorGroupLeftAction = NewEditorGroupLeftAction;
    let NewEditorGroupRightAction = class NewEditorGroupRightAction extends AbstractCreateEditorGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 3 /* GroupDirection.RIGHT */, editorGroupService);
        }
    };
    NewEditorGroupRightAction.ID = 'workbench.action.newGroupRight';
    NewEditorGroupRightAction.LABEL = (0, nls_1.localize)('newEditorRight', "New Editor Group to the Right");
    NewEditorGroupRightAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], NewEditorGroupRightAction);
    exports.NewEditorGroupRightAction = NewEditorGroupRightAction;
    let NewEditorGroupAboveAction = class NewEditorGroupAboveAction extends AbstractCreateEditorGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 0 /* GroupDirection.UP */, editorGroupService);
        }
    };
    NewEditorGroupAboveAction.ID = 'workbench.action.newGroupAbove';
    NewEditorGroupAboveAction.LABEL = (0, nls_1.localize)('newEditorAbove', "New Editor Group Above");
    NewEditorGroupAboveAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], NewEditorGroupAboveAction);
    exports.NewEditorGroupAboveAction = NewEditorGroupAboveAction;
    let NewEditorGroupBelowAction = class NewEditorGroupBelowAction extends AbstractCreateEditorGroupAction {
        constructor(id, label, editorGroupService) {
            super(id, label, 1 /* GroupDirection.DOWN */, editorGroupService);
        }
    };
    NewEditorGroupBelowAction.ID = 'workbench.action.newGroupBelow';
    NewEditorGroupBelowAction.LABEL = (0, nls_1.localize)('newEditorBelow', "New Editor Group Below");
    NewEditorGroupBelowAction = __decorate([
        __param(2, editorGroupsService_1.IEditorGroupsService)
    ], NewEditorGroupBelowAction);
    exports.NewEditorGroupBelowAction = NewEditorGroupBelowAction;
    let ToggleEditorTypeAction = class ToggleEditorTypeAction extends actions_1.Action {
        constructor(id, label, editorService, editorResolverService) {
            super(id, label);
            this.editorService = editorService;
            this.editorResolverService = editorResolverService;
        }
        async run() {
            const activeEditorPane = this.editorService.activeEditorPane;
            if (!activeEditorPane) {
                return;
            }
            const activeEditorResource = editor_1.EditorResourceAccessor.getCanonicalUri(activeEditorPane.input);
            if (!activeEditorResource) {
                return;
            }
            const editorIds = this.editorResolverService.getEditors(activeEditorResource).map(editor => editor.id).filter(id => id !== activeEditorPane.input.editorId);
            if (editorIds.length === 0) {
                return;
            }
            // Replace the current editor with the next avaiable editor type
            await this.editorService.replaceEditors([
                {
                    editor: activeEditorPane.input,
                    replacement: {
                        resource: activeEditorResource,
                        options: {
                            override: editorIds[0]
                        }
                    }
                }
            ], activeEditorPane.group);
        }
    };
    ToggleEditorTypeAction.ID = 'workbench.action.toggleEditorType';
    ToggleEditorTypeAction.LABEL = (0, nls_1.localize)('workbench.action.toggleEditorType', "Toggle Editor Type");
    ToggleEditorTypeAction = __decorate([
        __param(2, editorService_1.IEditorService),
        __param(3, editorResolverService_1.IEditorResolverService)
    ], ToggleEditorTypeAction);
    exports.ToggleEditorTypeAction = ToggleEditorTypeAction;
    let ReOpenInTextEditorAction = class ReOpenInTextEditorAction extends actions_1.Action {
        constructor(id, label, editorService) {
            super(id, label);
            this.editorService = editorService;
        }
        async run() {
            const activeEditorPane = this.editorService.activeEditorPane;
            if (!activeEditorPane) {
                return;
            }
            const activeEditorResource = editor_1.EditorResourceAccessor.getCanonicalUri(activeEditorPane.input);
            if (!activeEditorResource) {
                return;
            }
            // Replace the current editor with the text editor
            await this.editorService.replaceEditors([
                {
                    editor: activeEditorPane.input,
                    replacement: {
                        resource: activeEditorResource,
                        options: {
                            override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id
                        }
                    }
                }
            ], activeEditorPane.group);
        }
    };
    ReOpenInTextEditorAction.ID = 'workbench.action.reopenTextEditor';
    ReOpenInTextEditorAction.LABEL = (0, nls_1.localize)('workbench.action.reopenTextEditor', "Reopen Editor With Text Editor");
    ReOpenInTextEditorAction = __decorate([
        __param(2, editorService_1.IEditorService)
    ], ReOpenInTextEditorAction);
    exports.ReOpenInTextEditorAction = ReOpenInTextEditorAction;
});
//# sourceMappingURL=editorActions.js.map