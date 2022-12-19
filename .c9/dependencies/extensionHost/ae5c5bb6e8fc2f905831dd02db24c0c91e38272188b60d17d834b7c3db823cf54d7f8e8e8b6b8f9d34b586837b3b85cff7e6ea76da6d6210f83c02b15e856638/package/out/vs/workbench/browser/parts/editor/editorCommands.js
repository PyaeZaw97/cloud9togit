/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/workbench/common/editor", "vs/workbench/common/contextkeys", "vs/workbench/services/editor/common/editorGroupColumn", "vs/workbench/services/editor/common/editorService", "vs/editor/common/editorContextKeys", "vs/workbench/browser/parts/editor/textDiffEditor", "vs/base/common/keyCodes", "vs/base/common/uri", "vs/platform/quickinput/common/quickInput", "vs/platform/list/browser/listService", "vs/base/browser/ui/list/listWidget", "vs/base/common/arrays", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/contextkey/common/contextkey", "vs/platform/configuration/common/configuration", "vs/platform/commands/common/commands", "vs/platform/actions/common/actions", "vs/workbench/common/actions", "vs/workbench/browser/parts/editor/editorQuickAccess", "vs/platform/opener/common/opener", "vs/platform/editor/common/editor", "vs/base/common/network", "vs/workbench/common/editor/sideBySideEditorInput", "vs/workbench/browser/parts/editor/sideBySideEditor", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/path/common/pathService", "vs/platform/telemetry/common/telemetry", "vs/base/common/resources"], function (require, exports, nls_1, types_1, instantiation_1, keybindingsRegistry_1, editor_1, contextkeys_1, editorGroupColumn_1, editorService_1, editorContextKeys_1, textDiffEditor_1, keyCodes_1, uri_1, quickInput_1, listService_1, listWidget_1, arrays_1, editorGroupsService_1, contextkey_1, configuration_1, commands_1, actions_1, actions_2, editorQuickAccess_1, opener_1, editor_2, network_1, sideBySideEditorInput_1, sideBySideEditor_1, editorResolverService_1, pathService_1, telemetry_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.setup = exports.getMultiSelectedEditorContexts = exports.splitEditor = exports.API_OPEN_WITH_EDITOR_COMMAND_ID = exports.API_OPEN_DIFF_EDITOR_COMMAND_ID = exports.API_OPEN_EDITOR_COMMAND_ID = exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID = exports.FOCUS_BELOW_GROUP_WITHOUT_WRAP_COMMAND_ID = exports.FOCUS_ABOVE_GROUP_WITHOUT_WRAP_COMMAND_ID = exports.FOCUS_RIGHT_GROUP_WITHOUT_WRAP_COMMAND_ID = exports.FOCUS_LEFT_GROUP_WITHOUT_WRAP_COMMAND_ID = exports.FOCUS_OTHER_SIDE_EDITOR = exports.FOCUS_SECOND_SIDE_EDITOR = exports.FOCUS_FIRST_SIDE_EDITOR = exports.TOGGLE_SPLIT_EDITOR_IN_GROUP_LAYOUT = exports.JOIN_EDITOR_IN_GROUP = exports.TOGGLE_SPLIT_EDITOR_IN_GROUP = exports.SPLIT_EDITOR_IN_GROUP = exports.SPLIT_EDITOR_RIGHT = exports.SPLIT_EDITOR_LEFT = exports.SPLIT_EDITOR_DOWN = exports.SPLIT_EDITOR_UP = exports.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE = exports.DIFF_FOCUS_OTHER_SIDE = exports.DIFF_FOCUS_SECONDARY_SIDE = exports.DIFF_FOCUS_PRIMARY_SIDE = exports.GOTO_PREVIOUS_CHANGE = exports.GOTO_NEXT_CHANGE = exports.TOGGLE_DIFF_SIDE_BY_SIDE = exports.UNPIN_EDITOR_COMMAND_ID = exports.PIN_EDITOR_COMMAND_ID = exports.REOPEN_WITH_COMMAND_ID = exports.SHOW_EDITORS_IN_GROUP = exports.UNLOCK_GROUP_COMMAND_ID = exports.LOCK_GROUP_COMMAND_ID = exports.TOGGLE_LOCK_GROUP_COMMAND_ID = exports.TOGGLE_KEEP_EDITORS_COMMAND_ID = exports.KEEP_EDITOR_COMMAND_ID = exports.LAYOUT_EDITOR_GROUPS_COMMAND_ID = exports.COPY_ACTIVE_EDITOR_COMMAND_ID = exports.MOVE_ACTIVE_EDITOR_COMMAND_ID = exports.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID = exports.CLOSE_EDITOR_GROUP_COMMAND_ID = exports.CLOSE_PINNED_EDITOR_COMMAND_ID = exports.CLOSE_EDITOR_COMMAND_ID = exports.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID = exports.CLOSE_EDITORS_AND_GROUP_COMMAND_ID = exports.CLOSE_EDITORS_IN_GROUP_COMMAND_ID = exports.CLOSE_SAVED_EDITORS_COMMAND_ID = void 0;
    exports.CLOSE_SAVED_EDITORS_COMMAND_ID = 'workbench.action.closeUnmodifiedEditors';
    exports.CLOSE_EDITORS_IN_GROUP_COMMAND_ID = 'workbench.action.closeEditorsInGroup';
    exports.CLOSE_EDITORS_AND_GROUP_COMMAND_ID = 'workbench.action.closeEditorsAndGroup';
    exports.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID = 'workbench.action.closeEditorsToTheRight';
    exports.CLOSE_EDITOR_COMMAND_ID = 'workbench.action.closeActiveEditor';
    exports.CLOSE_PINNED_EDITOR_COMMAND_ID = 'workbench.action.closeActivePinnedEditor';
    exports.CLOSE_EDITOR_GROUP_COMMAND_ID = 'workbench.action.closeGroup';
    exports.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID = 'workbench.action.closeOtherEditors';
    exports.MOVE_ACTIVE_EDITOR_COMMAND_ID = 'moveActiveEditor';
    exports.COPY_ACTIVE_EDITOR_COMMAND_ID = 'copyActiveEditor';
    exports.LAYOUT_EDITOR_GROUPS_COMMAND_ID = 'layoutEditorGroups';
    exports.KEEP_EDITOR_COMMAND_ID = 'workbench.action.keepEditor';
    exports.TOGGLE_KEEP_EDITORS_COMMAND_ID = 'workbench.action.toggleKeepEditors';
    exports.TOGGLE_LOCK_GROUP_COMMAND_ID = 'workbench.action.toggleEditorGroupLock';
    exports.LOCK_GROUP_COMMAND_ID = 'workbench.action.lockEditorGroup';
    exports.UNLOCK_GROUP_COMMAND_ID = 'workbench.action.unlockEditorGroup';
    exports.SHOW_EDITORS_IN_GROUP = 'workbench.action.showEditorsInGroup';
    exports.REOPEN_WITH_COMMAND_ID = 'workbench.action.reopenWithEditor';
    exports.PIN_EDITOR_COMMAND_ID = 'workbench.action.pinEditor';
    exports.UNPIN_EDITOR_COMMAND_ID = 'workbench.action.unpinEditor';
    exports.TOGGLE_DIFF_SIDE_BY_SIDE = 'toggle.diff.renderSideBySide';
    exports.GOTO_NEXT_CHANGE = 'workbench.action.compareEditor.nextChange';
    exports.GOTO_PREVIOUS_CHANGE = 'workbench.action.compareEditor.previousChange';
    exports.DIFF_FOCUS_PRIMARY_SIDE = 'workbench.action.compareEditor.focusPrimarySide';
    exports.DIFF_FOCUS_SECONDARY_SIDE = 'workbench.action.compareEditor.focusSecondarySide';
    exports.DIFF_FOCUS_OTHER_SIDE = 'workbench.action.compareEditor.focusOtherSide';
    exports.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE = 'toggle.diff.ignoreTrimWhitespace';
    exports.SPLIT_EDITOR_UP = 'workbench.action.splitEditorUp';
    exports.SPLIT_EDITOR_DOWN = 'workbench.action.splitEditorDown';
    exports.SPLIT_EDITOR_LEFT = 'workbench.action.splitEditorLeft';
    exports.SPLIT_EDITOR_RIGHT = 'workbench.action.splitEditorRight';
    exports.SPLIT_EDITOR_IN_GROUP = 'workbench.action.splitEditorInGroup';
    exports.TOGGLE_SPLIT_EDITOR_IN_GROUP = 'workbench.action.toggleSplitEditorInGroup';
    exports.JOIN_EDITOR_IN_GROUP = 'workbench.action.joinEditorInGroup';
    exports.TOGGLE_SPLIT_EDITOR_IN_GROUP_LAYOUT = 'workbench.action.toggleSplitEditorInGroupLayout';
    exports.FOCUS_FIRST_SIDE_EDITOR = 'workbench.action.focusFirstSideEditor';
    exports.FOCUS_SECOND_SIDE_EDITOR = 'workbench.action.focusSecondSideEditor';
    exports.FOCUS_OTHER_SIDE_EDITOR = 'workbench.action.focusOtherSideEditor';
    exports.FOCUS_LEFT_GROUP_WITHOUT_WRAP_COMMAND_ID = 'workbench.action.focusLeftGroupWithoutWrap';
    exports.FOCUS_RIGHT_GROUP_WITHOUT_WRAP_COMMAND_ID = 'workbench.action.focusRightGroupWithoutWrap';
    exports.FOCUS_ABOVE_GROUP_WITHOUT_WRAP_COMMAND_ID = 'workbench.action.focusAboveGroupWithoutWrap';
    exports.FOCUS_BELOW_GROUP_WITHOUT_WRAP_COMMAND_ID = 'workbench.action.focusBelowGroupWithoutWrap';
    exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID = 'workbench.action.openEditorAtIndex';
    exports.API_OPEN_EDITOR_COMMAND_ID = '_workbench.open';
    exports.API_OPEN_DIFF_EDITOR_COMMAND_ID = '_workbench.diff';
    exports.API_OPEN_WITH_EDITOR_COMMAND_ID = '_workbench.openWith';
    const isActiveEditorMoveCopyArg = function (arg) {
        if (!(0, types_1.isObject)(arg)) {
            return false;
        }
        if (!(0, types_1.isString)(arg.to)) {
            return false;
        }
        if (!(0, types_1.isUndefined)(arg.by) && !(0, types_1.isString)(arg.by)) {
            return false;
        }
        if (!(0, types_1.isUndefined)(arg.value) && !(0, types_1.isNumber)(arg.value)) {
            return false;
        }
        return true;
    };
    function registerActiveEditorMoveCopyCommand() {
        const moveCopyJSONSchema = {
            'type': 'object',
            'required': ['to'],
            'properties': {
                'to': {
                    'type': 'string',
                    'enum': ['left', 'right']
                },
                'by': {
                    'type': 'string',
                    'enum': ['tab', 'group']
                },
                'value': {
                    'type': 'number'
                }
            }
        };
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.MOVE_ACTIVE_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            primary: 0,
            handler: (accessor, args) => moveCopyActiveEditor(true, args, accessor),
            description: {
                description: (0, nls_1.localize)('editorCommand.activeEditorMove.description', "Move the active editor by tabs or groups"),
                args: [
                    {
                        name: (0, nls_1.localize)('editorCommand.activeEditorMove.arg.name', "Active editor move argument"),
                        description: (0, nls_1.localize)('editorCommand.activeEditorMove.arg.description', "Argument Properties:\n\t* 'to': String value providing where to move.\n\t* 'by': String value providing the unit for move (by tab or by group).\n\t* 'value': Number value providing how many positions or an absolute position to move."),
                        constraint: isActiveEditorMoveCopyArg,
                        schema: moveCopyJSONSchema
                    }
                ]
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.COPY_ACTIVE_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
            primary: 0,
            handler: (accessor, args) => moveCopyActiveEditor(false, args, accessor),
            description: {
                description: (0, nls_1.localize)('editorCommand.activeEditorCopy.description', "Copy the active editor by groups"),
                args: [
                    {
                        name: (0, nls_1.localize)('editorCommand.activeEditorCopy.arg.name', "Active editor copy argument"),
                        description: (0, nls_1.localize)('editorCommand.activeEditorCopy.arg.description', "Argument Properties:\n\t* 'to': String value providing where to copy.\n\t* 'value': Number value providing how many positions or an absolute position to copy."),
                        constraint: isActiveEditorMoveCopyArg,
                        schema: moveCopyJSONSchema
                    }
                ]
            }
        });
        function moveCopyActiveEditor(isMove, args = Object.create(null), accessor) {
            args.to = args.to || 'right';
            args.by = args.by || 'tab';
            args.value = typeof args.value === 'number' ? args.value : 1;
            const activeEditorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
            if (activeEditorPane) {
                switch (args.by) {
                    case 'tab':
                        if (isMove) {
                            return moveActiveTab(args, activeEditorPane);
                        }
                        break;
                    case 'group':
                        return moveCopyActiveEditorToGroup(isMove, args, activeEditorPane, accessor);
                }
            }
        }
        function moveActiveTab(args, control) {
            const group = control.group;
            let index = group.getIndexOfEditor(control.input);
            switch (args.to) {
                case 'first':
                    index = 0;
                    break;
                case 'last':
                    index = group.count - 1;
                    break;
                case 'left':
                    index = index - args.value;
                    break;
                case 'right':
                    index = index + args.value;
                    break;
                case 'center':
                    index = Math.round(group.count / 2) - 1;
                    break;
                case 'position':
                    index = args.value - 1;
                    break;
            }
            index = index < 0 ? 0 : index >= group.count ? group.count - 1 : index;
            group.moveEditor(control.input, group, { index });
        }
        function moveCopyActiveEditorToGroup(isMove, args, control, accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const sourceGroup = control.group;
            let targetGroup;
            switch (args.to) {
                case 'left':
                    targetGroup = editorGroupService.findGroup({ direction: 2 /* GroupDirection.LEFT */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, 2 /* GroupDirection.LEFT */);
                    }
                    break;
                case 'right':
                    targetGroup = editorGroupService.findGroup({ direction: 3 /* GroupDirection.RIGHT */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, 3 /* GroupDirection.RIGHT */);
                    }
                    break;
                case 'up':
                    targetGroup = editorGroupService.findGroup({ direction: 0 /* GroupDirection.UP */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, 0 /* GroupDirection.UP */);
                    }
                    break;
                case 'down':
                    targetGroup = editorGroupService.findGroup({ direction: 1 /* GroupDirection.DOWN */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, 1 /* GroupDirection.DOWN */);
                    }
                    break;
                case 'first':
                    targetGroup = editorGroupService.findGroup({ location: 0 /* GroupLocation.FIRST */ }, sourceGroup);
                    break;
                case 'last':
                    targetGroup = editorGroupService.findGroup({ location: 1 /* GroupLocation.LAST */ }, sourceGroup);
                    break;
                case 'previous':
                    targetGroup = editorGroupService.findGroup({ location: 3 /* GroupLocation.PREVIOUS */ }, sourceGroup);
                    break;
                case 'next':
                    targetGroup = editorGroupService.findGroup({ location: 2 /* GroupLocation.NEXT */ }, sourceGroup);
                    if (!targetGroup) {
                        targetGroup = editorGroupService.addGroup(sourceGroup, (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService));
                    }
                    break;
                case 'center':
                    targetGroup = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[(editorGroupService.count / 2) - 1];
                    break;
                case 'position':
                    targetGroup = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[args.value - 1];
                    break;
            }
            if (targetGroup) {
                if (isMove) {
                    sourceGroup.moveEditor(control.input, targetGroup);
                }
                else if (sourceGroup.id !== targetGroup.id) {
                    sourceGroup.copyEditor(control.input, targetGroup);
                }
                targetGroup.focus();
            }
        }
    }
    function registerEditorGroupsLayoutCommand() {
        function applyEditorLayout(accessor, layout) {
            if (!layout || typeof layout !== 'object') {
                return;
            }
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            editorGroupService.applyLayout(layout);
        }
        commands_1.CommandsRegistry.registerCommand(exports.LAYOUT_EDITOR_GROUPS_COMMAND_ID, (accessor, args) => {
            applyEditorLayout(accessor, args);
        });
        // API Command
        commands_1.CommandsRegistry.registerCommand({
            id: 'vscode.setEditorLayout',
            handler: (accessor, args) => applyEditorLayout(accessor, args),
            description: {
                description: 'Set Editor Layout',
                args: [{
                        name: 'args',
                        schema: {
                            'type': 'object',
                            'required': ['groups'],
                            'properties': {
                                'orientation': {
                                    'type': 'number',
                                    'default': 0,
                                    'enum': [0, 1]
                                },
                                'groups': {
                                    '$ref': '#/definitions/editorGroupsSchema',
                                    'default': [{}, {}]
                                }
                            }
                        }
                    }]
            }
        });
    }
    function registerDiffEditorCommands() {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.GOTO_NEXT_CHANGE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.TextCompareEditorVisibleContext,
            primary: 512 /* KeyMod.Alt */ | 63 /* KeyCode.F5 */,
            handler: accessor => navigateInDiffEditor(accessor, true)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.GOTO_PREVIOUS_CHANGE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.TextCompareEditorVisibleContext,
            primary: 512 /* KeyMod.Alt */ | 1024 /* KeyMod.Shift */ | 63 /* KeyCode.F5 */,
            handler: accessor => navigateInDiffEditor(accessor, false)
        });
        function getActiveTextDiffEditor(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            for (const editor of [editorService.activeEditorPane, ...editorService.visibleEditorPanes]) {
                if (editor instanceof textDiffEditor_1.TextDiffEditor) {
                    return editor;
                }
            }
            return undefined;
        }
        function navigateInDiffEditor(accessor, next) {
            const activeTextDiffEditor = getActiveTextDiffEditor(accessor);
            if (activeTextDiffEditor) {
                const navigator = activeTextDiffEditor.getDiffNavigator();
                if (navigator) {
                    next ? navigator.next() : navigator.previous();
                }
            }
        }
        let FocusTextDiffEditorMode;
        (function (FocusTextDiffEditorMode) {
            FocusTextDiffEditorMode[FocusTextDiffEditorMode["Original"] = 0] = "Original";
            FocusTextDiffEditorMode[FocusTextDiffEditorMode["Modified"] = 1] = "Modified";
            FocusTextDiffEditorMode[FocusTextDiffEditorMode["Toggle"] = 2] = "Toggle";
        })(FocusTextDiffEditorMode || (FocusTextDiffEditorMode = {}));
        function focusInDiffEditor(accessor, mode) {
            var _a, _b, _c;
            const activeTextDiffEditor = getActiveTextDiffEditor(accessor);
            if (activeTextDiffEditor) {
                switch (mode) {
                    case FocusTextDiffEditorMode.Original:
                        (_a = activeTextDiffEditor.getControl()) === null || _a === void 0 ? void 0 : _a.getOriginalEditor().focus();
                        break;
                    case FocusTextDiffEditorMode.Modified:
                        (_b = activeTextDiffEditor.getControl()) === null || _b === void 0 ? void 0 : _b.getModifiedEditor().focus();
                        break;
                    case FocusTextDiffEditorMode.Toggle:
                        if ((_c = activeTextDiffEditor.getControl()) === null || _c === void 0 ? void 0 : _c.getModifiedEditor().hasWidgetFocus()) {
                            return focusInDiffEditor(accessor, FocusTextDiffEditorMode.Original);
                        }
                        else {
                            return focusInDiffEditor(accessor, FocusTextDiffEditorMode.Modified);
                        }
                }
            }
        }
        function toggleDiffSideBySide(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('diffEditor.renderSideBySide');
            configurationService.updateValue('diffEditor.renderSideBySide', newValue);
        }
        function toggleDiffIgnoreTrimWhitespace(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('diffEditor.ignoreTrimWhitespace');
            configurationService.updateValue('diffEditor.ignoreTrimWhitespace', newValue);
        }
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.TOGGLE_DIFF_SIDE_BY_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => toggleDiffSideBySide(accessor)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.DIFF_FOCUS_PRIMARY_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => focusInDiffEditor(accessor, FocusTextDiffEditorMode.Modified)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.DIFF_FOCUS_SECONDARY_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => focusInDiffEditor(accessor, FocusTextDiffEditorMode.Original)
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.DIFF_FOCUS_OTHER_SIDE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => focusInDiffEditor(accessor, FocusTextDiffEditorMode.Toggle)
        });
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            command: {
                id: exports.TOGGLE_DIFF_SIDE_BY_SIDE,
                title: {
                    value: (0, nls_1.localize)('toggleInlineView', "Toggle Inline View"),
                    original: 'Compare: Toggle Inline View'
                },
                category: (0, nls_1.localize)('compare', "Compare")
            },
            when: contextkeys_1.TextCompareEditorActiveContext
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.TOGGLE_DIFF_IGNORE_TRIM_WHITESPACE,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: accessor => toggleDiffIgnoreTrimWhitespace(accessor)
        });
    }
    function registerOpenEditorAPICommands() {
        function mixinContext(context, options, column) {
            if (!context) {
                return [options, column];
            }
            return [
                Object.assign(Object.assign({}, context.editorOptions), (options !== null && options !== void 0 ? options : Object.create(null))),
                context.sideBySide ? editorService_1.SIDE_GROUP : column
            ];
        }
        // partial, renderer-side API command to open editor
        // complements https://github.com/microsoft/vscode/blob/2b164efb0e6a5de3826bff62683eaeafe032284f/src/vs/workbench/api/common/extHostApiCommands.ts#L373
        commands_1.CommandsRegistry.registerCommand({
            id: 'vscode.open',
            handler: (accessor, arg) => {
                accessor.get(commands_1.ICommandService).executeCommand(exports.API_OPEN_EDITOR_COMMAND_ID, arg);
            },
            description: {
                description: 'Opens the provided resource in the editor.',
                args: [{ name: 'Uri' }]
            }
        });
        commands_1.CommandsRegistry.registerCommand(exports.API_OPEN_EDITOR_COMMAND_ID, async function (accessor, resourceArg, columnAndOptions, label, context) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const openerService = accessor.get(opener_1.IOpenerService);
            const pathService = accessor.get(pathService_1.IPathService);
            const resourceOrString = typeof resourceArg === 'string' ? resourceArg : uri_1.URI.revive(resourceArg);
            const [columnArg, optionsArg] = columnAndOptions !== null && columnAndOptions !== void 0 ? columnAndOptions : [];
            // use editor options or editor view column or resource scheme
            // as a hint to use the editor service for opening directly
            if (optionsArg || typeof columnArg === 'number' || (0, opener_1.matchesScheme)(resourceOrString, network_1.Schemas.untitled)) {
                const [options, column] = mixinContext(context, optionsArg, columnArg);
                const resource = uri_1.URI.isUri(resourceOrString) ? resourceOrString : uri_1.URI.parse(resourceOrString);
                let input;
                if ((0, opener_1.matchesScheme)(resource, network_1.Schemas.untitled) && resource.path.length > 1) {
                    // special case for untitled: we are getting a resource with meaningful
                    // path from an extension to use for the untitled editor. as such, we
                    // have to assume it as an associated resource to use when saving. we
                    // do so by setting the `forceUntitled: true` and changing the scheme
                    // to a file based one. the untitled editor service takes care to
                    // associate the path properly then.
                    input = { resource: resource.with({ scheme: pathService.defaultUriScheme }), forceUntitled: true, options, label };
                }
                else {
                    // use any other resource as is
                    input = { resource, options, label };
                }
                await editorService.openEditor(input, (0, editorGroupColumn_1.columnToEditorGroup)(editorGroupService, column));
            }
            // do not allow to execute commands from here
            else if ((0, opener_1.matchesScheme)(resourceOrString, network_1.Schemas.command)) {
                return;
            }
            // finally, delegate to opener service
            else {
                await openerService.open(resourceOrString, { openToSide: context === null || context === void 0 ? void 0 : context.sideBySide, editorOptions: context === null || context === void 0 ? void 0 : context.editorOptions });
            }
        });
        // partial, renderer-side API command to open diff editor
        // complements https://github.com/microsoft/vscode/blob/2b164efb0e6a5de3826bff62683eaeafe032284f/src/vs/workbench/api/common/extHostApiCommands.ts#L397
        commands_1.CommandsRegistry.registerCommand({
            id: 'vscode.diff',
            handler: (accessor, left, right, label) => {
                accessor.get(commands_1.ICommandService).executeCommand(exports.API_OPEN_DIFF_EDITOR_COMMAND_ID, left, right, label);
            },
            description: {
                description: 'Opens the provided resources in the diff editor to compare their contents.',
                args: [
                    { name: 'left', description: 'Left-hand side resource of the diff editor' },
                    { name: 'right', description: 'Right-hand side resource of the diff editor' },
                    { name: 'title', description: 'Human readable title for the diff editor' },
                ]
            }
        });
        commands_1.CommandsRegistry.registerCommand(exports.API_OPEN_DIFF_EDITOR_COMMAND_ID, async function (accessor, originalResource, modifiedResource, labelAndOrDescription, columnAndOptions, context) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const [columnArg, optionsArg] = columnAndOptions !== null && columnAndOptions !== void 0 ? columnAndOptions : [];
            const [options, column] = mixinContext(context, optionsArg, columnArg);
            let label = undefined;
            let description = undefined;
            if (typeof labelAndOrDescription === 'string') {
                label = labelAndOrDescription;
            }
            else if (labelAndOrDescription) {
                label = labelAndOrDescription.label;
                description = labelAndOrDescription.description;
            }
            await editorService.openEditor({
                original: { resource: uri_1.URI.revive(originalResource) },
                modified: { resource: uri_1.URI.revive(modifiedResource) },
                label,
                description,
                options
            }, (0, editorGroupColumn_1.columnToEditorGroup)(editorGroupService, column));
        });
        commands_1.CommandsRegistry.registerCommand(exports.API_OPEN_WITH_EDITOR_COMMAND_ID, (accessor, resource, id, columnAndOptions) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const [columnArg, optionsArg] = columnAndOptions !== null && columnAndOptions !== void 0 ? columnAndOptions : [];
            let group = undefined;
            if (columnArg === editorService_1.SIDE_GROUP) {
                const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService);
                let neighbourGroup = editorGroupsService.findGroup({ direction });
                if (!neighbourGroup) {
                    neighbourGroup = editorGroupsService.addGroup(editorGroupsService.activeGroup, direction);
                }
                group = neighbourGroup;
            }
            else {
                group = (0, editorGroupColumn_1.columnToEditorGroup)(editorGroupsService, columnArg);
            }
            return editorService.openEditor({ resource: uri_1.URI.revive(resource), options: Object.assign(Object.assign({}, optionsArg), { pinned: true, override: id }) }, group);
        });
    }
    function registerOpenEditorAtIndexCommands() {
        const openEditorAtIndex = (accessor, editorIndex) => {
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorPane = editorService.activeEditorPane;
            if (activeEditorPane) {
                const editor = activeEditorPane.group.getEditorByIndex(editorIndex);
                if (editor) {
                    editorService.openEditor(editor);
                }
            }
        };
        // This command takes in the editor index number to open as an argument
        commands_1.CommandsRegistry.registerCommand({
            id: exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID,
            handler: openEditorAtIndex
        });
        // Keybindings to focus a specific index in the tab folder if tabs are enabled
        for (let i = 0; i < 9; i++) {
            const editorIndex = i;
            const visibleIndex = i + 1;
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: exports.OPEN_EDITOR_AT_INDEX_COMMAND_ID + visibleIndex,
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: undefined,
                primary: 512 /* KeyMod.Alt */ | toKeyCode(visibleIndex),
                mac: { primary: 256 /* KeyMod.WinCtrl */ | toKeyCode(visibleIndex) },
                handler: accessor => openEditorAtIndex(accessor, editorIndex)
            });
        }
        function toKeyCode(index) {
            switch (index) {
                case 0: return 21 /* KeyCode.Digit0 */;
                case 1: return 22 /* KeyCode.Digit1 */;
                case 2: return 23 /* KeyCode.Digit2 */;
                case 3: return 24 /* KeyCode.Digit3 */;
                case 4: return 25 /* KeyCode.Digit4 */;
                case 5: return 26 /* KeyCode.Digit5 */;
                case 6: return 27 /* KeyCode.Digit6 */;
                case 7: return 28 /* KeyCode.Digit7 */;
                case 8: return 29 /* KeyCode.Digit8 */;
                case 9: return 30 /* KeyCode.Digit9 */;
            }
            throw new Error('invalid index');
        }
    }
    function registerFocusEditorGroupAtIndexCommands() {
        // Keybindings to focus a specific group (2-8) in the editor area
        for (let groupIndex = 1; groupIndex < 8; groupIndex++) {
            keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
                id: toCommandId(groupIndex),
                weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                when: undefined,
                primary: 2048 /* KeyMod.CtrlCmd */ | toKeyCode(groupIndex),
                handler: accessor => {
                    const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                    const configurationService = accessor.get(configuration_1.IConfigurationService);
                    // To keep backwards compatibility (pre-grid), allow to focus a group
                    // that does not exist as long as it is the next group after the last
                    // opened group. Otherwise we return.
                    if (groupIndex > editorGroupService.count) {
                        return;
                    }
                    // Group exists: just focus
                    const groups = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */);
                    if (groups[groupIndex]) {
                        return groups[groupIndex].focus();
                    }
                    // Group does not exist: create new by splitting the active one of the last group
                    const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(configurationService);
                    const lastGroup = editorGroupService.findGroup({ location: 1 /* GroupLocation.LAST */ });
                    if (!lastGroup) {
                        return;
                    }
                    const newGroup = editorGroupService.addGroup(lastGroup, direction);
                    // Focus
                    newGroup.focus();
                }
            });
        }
        function toCommandId(index) {
            switch (index) {
                case 1: return 'workbench.action.focusSecondEditorGroup';
                case 2: return 'workbench.action.focusThirdEditorGroup';
                case 3: return 'workbench.action.focusFourthEditorGroup';
                case 4: return 'workbench.action.focusFifthEditorGroup';
                case 5: return 'workbench.action.focusSixthEditorGroup';
                case 6: return 'workbench.action.focusSeventhEditorGroup';
                case 7: return 'workbench.action.focusEighthEditorGroup';
            }
            throw new Error('Invalid index');
        }
        function toKeyCode(index) {
            switch (index) {
                case 1: return 23 /* KeyCode.Digit2 */;
                case 2: return 24 /* KeyCode.Digit3 */;
                case 3: return 25 /* KeyCode.Digit4 */;
                case 4: return 26 /* KeyCode.Digit5 */;
                case 5: return 27 /* KeyCode.Digit6 */;
                case 6: return 28 /* KeyCode.Digit7 */;
                case 7: return 29 /* KeyCode.Digit8 */;
            }
            throw new Error('Invalid index');
        }
    }
    function splitEditor(editorGroupService, direction, context) {
        let sourceGroup;
        if (context && typeof context.groupId === 'number') {
            sourceGroup = editorGroupService.getGroup(context.groupId);
        }
        else {
            sourceGroup = editorGroupService.activeGroup;
        }
        if (!sourceGroup) {
            return;
        }
        // Add group
        const newGroup = editorGroupService.addGroup(sourceGroup, direction);
        // Split editor (if it can be split)
        let editorToCopy;
        if (context && typeof context.editorIndex === 'number') {
            editorToCopy = sourceGroup.getEditorByIndex(context.editorIndex);
        }
        else {
            editorToCopy = (0, types_1.withNullAsUndefined)(sourceGroup.activeEditor);
        }
        // Copy the editor to the new group, else create an empty group
        if (editorToCopy && !editorToCopy.hasCapability(8 /* EditorInputCapabilities.Singleton */)) {
            sourceGroup.copyEditor(editorToCopy, newGroup, { preserveFocus: context === null || context === void 0 ? void 0 : context.preserveFocus });
        }
        // Focus
        newGroup.focus();
    }
    exports.splitEditor = splitEditor;
    function registerSplitEditorCommands() {
        [
            { id: exports.SPLIT_EDITOR_UP, direction: 0 /* GroupDirection.UP */ },
            { id: exports.SPLIT_EDITOR_DOWN, direction: 1 /* GroupDirection.DOWN */ },
            { id: exports.SPLIT_EDITOR_LEFT, direction: 2 /* GroupDirection.LEFT */ },
            { id: exports.SPLIT_EDITOR_RIGHT, direction: 3 /* GroupDirection.RIGHT */ }
        ].forEach(({ id, direction }) => {
            commands_1.CommandsRegistry.registerCommand(id, function (accessor, resourceOrContext, context) {
                splitEditor(accessor.get(editorGroupsService_1.IEditorGroupsService), direction, getCommandsContext(resourceOrContext, context));
            });
        });
    }
    function registerCloseEditorCommands() {
        // A special handler for "Close Editor" depending on context
        // - keybindining: do not close sticky editors, rather open the next non-sticky editor
        // - menu: always close editor, even sticky ones
        function closeEditorHandler(accessor, forceCloseStickyEditors, resourceOrContext, context) {
            var _a;
            const editorGroupsService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const editorService = accessor.get(editorService_1.IEditorService);
            let keepStickyEditors = true;
            if (forceCloseStickyEditors) {
                keepStickyEditors = false; // explicitly close sticky editors
            }
            else if (resourceOrContext || context) {
                keepStickyEditors = false; // we have a context, as such this command was used e.g. from the tab context menu
            }
            // Without context: skip over sticky editor and select next if active editor is sticky
            if (keepStickyEditors && !resourceOrContext && !context) {
                const activeGroup = editorGroupsService.activeGroup;
                const activeEditor = activeGroup.activeEditor;
                if (activeEditor && activeGroup.isSticky(activeEditor)) {
                    // Open next recently active in same group
                    const nextNonStickyEditorInGroup = activeGroup.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true })[0];
                    if (nextNonStickyEditorInGroup) {
                        return activeGroup.openEditor(nextNonStickyEditorInGroup);
                    }
                    // Open next recently active across all groups
                    const nextNonStickyEditorInAllGroups = editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */, { excludeSticky: true })[0];
                    if (nextNonStickyEditorInAllGroups) {
                        return Promise.resolve((_a = editorGroupsService.getGroup(nextNonStickyEditorInAllGroups.groupId)) === null || _a === void 0 ? void 0 : _a.openEditor(nextNonStickyEditorInAllGroups.editor));
                    }
                }
            }
            // With context: proceed to close editors as instructed
            const { editors, groups } = getEditorsContext(accessor, resourceOrContext, context);
            return Promise.all(groups.map(async (group) => {
                if (group) {
                    const editorsToClose = (0, arrays_1.coalesce)(editors
                        .filter(editor => editor.groupId === group.id)
                        .map(editor => typeof editor.editorIndex === 'number' ? group.getEditorByIndex(editor.editorIndex) : group.activeEditor))
                        .filter(editor => !keepStickyEditors || !group.isSticky(editor));
                    await group.closeEditors(editorsToClose, { preserveFocus: context === null || context === void 0 ? void 0 : context.preserveFocus });
                }
            }));
        }
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */,
            win: { primary: 2048 /* KeyMod.CtrlCmd */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */] },
            handler: (accessor, resourceOrContext, context) => {
                return closeEditorHandler(accessor, false, resourceOrContext, context);
            }
        });
        commands_1.CommandsRegistry.registerCommand(exports.CLOSE_PINNED_EDITOR_COMMAND_ID, (accessor, resourceOrContext, context) => {
            return closeEditorHandler(accessor, true /* force close pinned editors */, resourceOrContext, context);
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITORS_IN_GROUP_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 53 /* KeyCode.KeyW */),
            handler: (accessor, resourceOrContext, context) => {
                return Promise.all(getEditorsContext(accessor, resourceOrContext, context).groups.map(async (group) => {
                    if (group) {
                        await group.closeAllEditors({ excludeSticky: true });
                        return;
                    }
                }));
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITOR_GROUP_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkey_1.ContextKeyExpr.and(contextkeys_1.ActiveEditorGroupEmptyContext, contextkeys_1.MultipleEditorGroupsContext),
            primary: 2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */,
            win: { primary: 2048 /* KeyMod.CtrlCmd */ | 62 /* KeyCode.F4 */, secondary: [2048 /* KeyMod.CtrlCmd */ | 53 /* KeyCode.KeyW */] },
            handler: (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const commandsContext = getCommandsContext(resourceOrContext, context);
                let group;
                if (commandsContext && typeof commandsContext.groupId === 'number') {
                    group = editorGroupService.getGroup(commandsContext.groupId);
                }
                else {
                    group = editorGroupService.activeGroup;
                }
                if (group) {
                    editorGroupService.removeGroup(group);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_SAVED_EDITORS_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 51 /* KeyCode.KeyU */),
            handler: (accessor, resourceOrContext, context) => {
                return Promise.all(getEditorsContext(accessor, resourceOrContext, context).groups.map(async (group) => {
                    if (group) {
                        await group.closeEditors({ savedOnly: true, excludeSticky: true }, { preserveFocus: context === null || context === void 0 ? void 0 : context.preserveFocus });
                    }
                }));
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_OTHER_EDITORS_IN_GROUP_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 50 /* KeyCode.KeyT */ },
            handler: (accessor, resourceOrContext, context) => {
                const { editors, groups } = getEditorsContext(accessor, resourceOrContext, context);
                return Promise.all(groups.map(async (group) => {
                    if (group) {
                        const editorsToKeep = editors
                            .filter(editor => editor.groupId === group.id)
                            .map(editor => typeof editor.editorIndex === 'number' ? group.getEditorByIndex(editor.editorIndex) : group.activeEditor);
                        const editorsToClose = group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, { excludeSticky: true }).filter(editor => !editorsToKeep.includes(editor));
                        for (const editorToKeep of editorsToKeep) {
                            if (editorToKeep) {
                                group.pinEditor(editorToKeep);
                            }
                        }
                        await group.closeEditors(editorsToClose, { preserveFocus: context === null || context === void 0 ? void 0 : context.preserveFocus });
                    }
                }));
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.CLOSE_EDITORS_TO_THE_RIGHT_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    if (group.activeEditor) {
                        group.pinEditor(group.activeEditor);
                    }
                    await group.closeEditors({ direction: 1 /* CloseDirection.RIGHT */, except: editor, excludeSticky: true }, { preserveFocus: context === null || context === void 0 ? void 0 : context.preserveFocus });
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.REOPEN_WITH_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: async (accessor, resourceOrContext, context) => {
                var _a, _b, _c, _d, _e, _f;
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const editorService = accessor.get(editorService_1.IEditorService);
                const editorResolverService = accessor.get(editorResolverService_1.IEditorResolverService);
                const telemetryService = accessor.get(telemetry_1.ITelemetryService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (!editor) {
                    return;
                }
                const resolvedEditor = await editorResolverService.resolveEditor({ editor, options: Object.assign(Object.assign({}, (_a = editorService.activeEditorPane) === null || _a === void 0 ? void 0 : _a.options), { override: editor_2.EditorResolution.PICK }) }, group);
                if (!(0, editor_1.isEditorInputWithOptionsAndGroup)(resolvedEditor)) {
                    return;
                }
                // Replace editor with resolved one
                await resolvedEditor.group.replaceEditors([
                    {
                        editor: editor,
                        replacement: resolvedEditor.editor,
                        forceReplaceDirty: ((_b = editor.resource) === null || _b === void 0 ? void 0 : _b.scheme) === network_1.Schemas.untitled,
                        options: resolvedEditor.options
                    }
                ]);
                telemetryService.publicLog2('workbenchEditorReopen', {
                    scheme: (_d = (_c = editor.resource) === null || _c === void 0 ? void 0 : _c.scheme) !== null && _d !== void 0 ? _d : '',
                    ext: editor.resource ? (0, resources_1.extname)(editor.resource) : '',
                    from: (_e = editor.editorId) !== null && _e !== void 0 ? _e : '',
                    to: (_f = resolvedEditor.editor.editorId) !== null && _f !== void 0 ? _f : ''
                });
                // Make sure it becomes active too
                await resolvedEditor.group.openEditor(resolvedEditor.editor);
            }
        });
        commands_1.CommandsRegistry.registerCommand(exports.CLOSE_EDITORS_AND_GROUP_COMMAND_ID, async (accessor, resourceOrContext, context) => {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
            if (group) {
                await group.closeAllEditors();
                if (group.count === 0 && editorGroupService.getGroup(group.id) /* could be gone by now */) {
                    editorGroupService.removeGroup(group); // only remove group if it is now empty
                }
            }
        });
    }
    function registerFocusEditorGroupWihoutWrapCommands() {
        const commands = [
            {
                id: exports.FOCUS_LEFT_GROUP_WITHOUT_WRAP_COMMAND_ID,
                direction: 2 /* GroupDirection.LEFT */
            },
            {
                id: exports.FOCUS_RIGHT_GROUP_WITHOUT_WRAP_COMMAND_ID,
                direction: 3 /* GroupDirection.RIGHT */
            },
            {
                id: exports.FOCUS_ABOVE_GROUP_WITHOUT_WRAP_COMMAND_ID,
                direction: 0 /* GroupDirection.UP */,
            },
            {
                id: exports.FOCUS_BELOW_GROUP_WITHOUT_WRAP_COMMAND_ID,
                direction: 1 /* GroupDirection.DOWN */
            }
        ];
        for (const command of commands) {
            commands_1.CommandsRegistry.registerCommand(command.id, async (accessor) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const group = editorGroupService.findGroup({ direction: command.direction }, editorGroupService.activeGroup, false);
                if (group) {
                    group.focus();
                }
            });
        }
    }
    function registerSplitEditorInGroupCommands() {
        async function splitEditorInGroup(accessor, resourceOrContext, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
            if (!editor) {
                return;
            }
            await group.replaceEditors([{
                    editor,
                    replacement: instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, undefined, undefined, editor, editor),
                    forceReplaceDirty: true
                }]);
        }
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.SPLIT_EDITOR_IN_GROUP,
                    title: { value: (0, nls_1.localize)('splitEditorInGroup', "Split Editor in Group"), original: 'Split Editor in Group' },
                    category: actions_2.CATEGORIES.View,
                    precondition: contextkeys_1.ActiveEditorCanSplitInGroupContext,
                    f1: true,
                    keybinding: {
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkeys_1.ActiveEditorCanSplitInGroupContext,
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 88 /* KeyCode.Backslash */)
                    }
                });
            }
            run(accessor, resourceOrContext, context) {
                return splitEditorInGroup(accessor, resourceOrContext, context);
            }
        });
        async function joinEditorInGroup(accessor, resourceOrContext, context) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
            if (!(editor instanceof sideBySideEditorInput_1.SideBySideEditorInput)) {
                return;
            }
            let options = undefined;
            const activeEditorPane = group.activeEditorPane;
            if (activeEditorPane instanceof sideBySideEditor_1.SideBySideEditor && group.activeEditor === editor) {
                for (const pane of [activeEditorPane.getPrimaryEditorPane(), activeEditorPane.getSecondaryEditorPane()]) {
                    if (pane === null || pane === void 0 ? void 0 : pane.hasFocus()) {
                        options = { viewState: pane.getViewState() };
                        break;
                    }
                }
            }
            await group.replaceEditors([{
                    editor,
                    replacement: editor.primary,
                    options
                }]);
        }
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.JOIN_EDITOR_IN_GROUP,
                    title: { value: (0, nls_1.localize)('joinEditorInGroup', "Join Editor in Group"), original: 'Join Editor in Group' },
                    category: actions_2.CATEGORIES.View,
                    precondition: contextkeys_1.SideBySideEditorActiveContext,
                    f1: true,
                    keybinding: {
                        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                        when: contextkeys_1.SideBySideEditorActiveContext,
                        primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 88 /* KeyCode.Backslash */)
                    }
                });
            }
            run(accessor, resourceOrContext, context) {
                return joinEditorInGroup(accessor, resourceOrContext, context);
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.TOGGLE_SPLIT_EDITOR_IN_GROUP,
                    title: { value: (0, nls_1.localize)('toggleJoinEditorInGroup', "Toggle Split Editor in Group"), original: 'Toggle Split Editor in Group' },
                    category: actions_2.CATEGORIES.View,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.ActiveEditorCanSplitInGroupContext, contextkeys_1.SideBySideEditorActiveContext),
                    f1: true
                });
            }
            async run(accessor, resourceOrContext, context) {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (editor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                    await joinEditorInGroup(accessor, resourceOrContext, context);
                }
                else if (editor) {
                    await splitEditorInGroup(accessor, resourceOrContext, context);
                }
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.TOGGLE_SPLIT_EDITOR_IN_GROUP_LAYOUT,
                    title: { value: (0, nls_1.localize)('toggleSplitEditorInGroupLayout', "Toggle Split Editor in Group Layout"), original: 'Toggle Split Editor in Group Layout' },
                    category: actions_2.CATEGORIES.View,
                    precondition: contextkeys_1.SideBySideEditorActiveContext,
                    f1: true
                });
            }
            async run(accessor) {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const currentSetting = configurationService.getValue(sideBySideEditor_1.SideBySideEditor.SIDE_BY_SIDE_LAYOUT_SETTING);
                let newSetting;
                if (currentSetting !== 'horizontal') {
                    newSetting = 'horizontal';
                }
                else {
                    newSetting = 'vertical';
                }
                return configurationService.updateValue(sideBySideEditor_1.SideBySideEditor.SIDE_BY_SIDE_LAYOUT_SETTING, newSetting);
            }
        });
    }
    function registerFocusSideEditorsCommands() {
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.FOCUS_FIRST_SIDE_EDITOR,
                    title: { value: (0, nls_1.localize)('focusLeftSideEditor', "Focus First Side in Active Editor"), original: 'Focus First Side in Active Editor' },
                    category: actions_2.CATEGORIES.View,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
                    f1: true
                });
            }
            async run(accessor) {
                var _a;
                const editorService = accessor.get(editorService_1.IEditorService);
                const commandService = accessor.get(commands_1.ICommandService);
                const activeEditorPane = editorService.activeEditorPane;
                if (activeEditorPane instanceof sideBySideEditor_1.SideBySideEditor) {
                    (_a = activeEditorPane.getSecondaryEditorPane()) === null || _a === void 0 ? void 0 : _a.focus();
                }
                else if (activeEditorPane instanceof textDiffEditor_1.TextDiffEditor) {
                    await commandService.executeCommand(exports.DIFF_FOCUS_SECONDARY_SIDE);
                }
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.FOCUS_SECOND_SIDE_EDITOR,
                    title: { value: (0, nls_1.localize)('focusRightSideEditor', "Focus Second Side in Active Editor"), original: 'Focus Second Side in Active Editor' },
                    category: actions_2.CATEGORIES.View,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
                    f1: true
                });
            }
            async run(accessor) {
                var _a;
                const editorService = accessor.get(editorService_1.IEditorService);
                const commandService = accessor.get(commands_1.ICommandService);
                const activeEditorPane = editorService.activeEditorPane;
                if (activeEditorPane instanceof sideBySideEditor_1.SideBySideEditor) {
                    (_a = activeEditorPane.getPrimaryEditorPane()) === null || _a === void 0 ? void 0 : _a.focus();
                }
                else if (activeEditorPane instanceof textDiffEditor_1.TextDiffEditor) {
                    await commandService.executeCommand(exports.DIFF_FOCUS_PRIMARY_SIDE);
                }
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.FOCUS_OTHER_SIDE_EDITOR,
                    title: { value: (0, nls_1.localize)('focusOtherSideEditor', "Focus Other Side in Active Editor"), original: 'Focus Other Side in Active Editor' },
                    category: actions_2.CATEGORIES.View,
                    precondition: contextkey_1.ContextKeyExpr.or(contextkeys_1.SideBySideEditorActiveContext, contextkeys_1.TextCompareEditorActiveContext),
                    f1: true
                });
            }
            async run(accessor) {
                var _a, _b, _c;
                const editorService = accessor.get(editorService_1.IEditorService);
                const commandService = accessor.get(commands_1.ICommandService);
                const activeEditorPane = editorService.activeEditorPane;
                if (activeEditorPane instanceof sideBySideEditor_1.SideBySideEditor) {
                    if ((_a = activeEditorPane.getPrimaryEditorPane()) === null || _a === void 0 ? void 0 : _a.hasFocus()) {
                        (_b = activeEditorPane.getSecondaryEditorPane()) === null || _b === void 0 ? void 0 : _b.focus();
                    }
                    else {
                        (_c = activeEditorPane.getPrimaryEditorPane()) === null || _c === void 0 ? void 0 : _c.focus();
                    }
                }
                else if (activeEditorPane instanceof textDiffEditor_1.TextDiffEditor) {
                    await commandService.executeCommand(exports.DIFF_FOCUS_OTHER_SIDE);
                }
            }
        });
    }
    function registerOtherEditorCommands() {
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.KEEP_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 3 /* KeyCode.Enter */),
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    return group.pinEditor(editor);
                }
            }
        });
        commands_1.CommandsRegistry.registerCommand({
            id: exports.TOGGLE_KEEP_EDITORS_COMMAND_ID,
            handler: accessor => {
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const currentSetting = configurationService.getValue('workbench.editor.enablePreview');
                const newSetting = currentSetting === true ? false : true;
                configurationService.updateValue('workbench.editor.enablePreview', newSetting);
            }
        });
        function setEditorGroupLock(accessor, resourceOrContext, context, locked) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const { group } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
            if (group) {
                group.lock(locked !== null && locked !== void 0 ? locked : !group.isLocked);
            }
        }
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.TOGGLE_LOCK_GROUP_COMMAND_ID,
                    title: { value: (0, nls_1.localize)('toggleEditorGroupLock', "Toggle Editor Group Lock"), original: 'Toggle Editor Group Lock' },
                    category: actions_2.CATEGORIES.View,
                    precondition: contextkeys_1.MultipleEditorGroupsContext,
                    f1: true
                });
            }
            async run(accessor, resourceOrContext, context) {
                setEditorGroupLock(accessor, resourceOrContext, context);
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.LOCK_GROUP_COMMAND_ID,
                    title: { value: (0, nls_1.localize)('lockEditorGroup', "Lock Editor Group"), original: 'Lock Editor Group' },
                    category: actions_2.CATEGORIES.View,
                    precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.MultipleEditorGroupsContext, contextkeys_1.ActiveEditorGroupLockedContext.toNegated()),
                    f1: true
                });
            }
            async run(accessor, resourceOrContext, context) {
                setEditorGroupLock(accessor, resourceOrContext, context, true);
            }
        });
        (0, actions_1.registerAction2)(class extends actions_1.Action2 {
            constructor() {
                super({
                    id: exports.UNLOCK_GROUP_COMMAND_ID,
                    title: { value: (0, nls_1.localize)('unlockEditorGroup', "Unlock Editor Group"), original: 'Unlock Editor Group' },
                    precondition: contextkey_1.ContextKeyExpr.and(contextkeys_1.MultipleEditorGroupsContext, contextkeys_1.ActiveEditorGroupLockedContext),
                    category: actions_2.CATEGORIES.View,
                    f1: true
                });
            }
            async run(accessor, resourceOrContext, context) {
                setEditorGroupLock(accessor, resourceOrContext, context, false);
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.PIN_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.ActiveEditorStickyContext.toNegated(),
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */),
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    return group.stickEditor(editor);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.UNPIN_EDITOR_COMMAND_ID,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: contextkeys_1.ActiveEditorStickyContext,
            primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 1024 /* KeyMod.Shift */ | 3 /* KeyCode.Enter */),
            handler: async (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const { group, editor } = resolveCommandsContext(editorGroupService, getCommandsContext(resourceOrContext, context));
                if (group && editor) {
                    return group.unstickEditor(editor);
                }
            }
        });
        keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
            id: exports.SHOW_EDITORS_IN_GROUP,
            weight: 200 /* KeybindingWeight.WorkbenchContrib */,
            when: undefined,
            primary: undefined,
            handler: (accessor, resourceOrContext, context) => {
                const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
                const quickInputService = accessor.get(quickInput_1.IQuickInputService);
                const commandsContext = getCommandsContext(resourceOrContext, context);
                if (commandsContext && typeof commandsContext.groupId === 'number') {
                    const group = editorGroupService.getGroup(commandsContext.groupId);
                    if (group) {
                        editorGroupService.activateGroup(group); // we need the group to be active
                    }
                }
                return quickInputService.quickAccess.show(editorQuickAccess_1.ActiveGroupEditorsByMostRecentlyUsedQuickAccess.PREFIX);
            }
        });
    }
    function getEditorsContext(accessor, resourceOrContext, context) {
        const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
        const listService = accessor.get(listService_1.IListService);
        const editorContext = getMultiSelectedEditorContexts(getCommandsContext(resourceOrContext, context), listService, editorGroupService);
        const activeGroup = editorGroupService.activeGroup;
        if (editorContext.length === 0 && activeGroup.activeEditor) {
            // add the active editor as fallback
            editorContext.push({
                groupId: activeGroup.id,
                editorIndex: activeGroup.getIndexOfEditor(activeGroup.activeEditor)
            });
        }
        return {
            editors: editorContext,
            groups: (0, arrays_1.distinct)(editorContext.map(context => context.groupId)).map(groupId => editorGroupService.getGroup(groupId))
        };
    }
    function getCommandsContext(resourceOrContext, context) {
        if (uri_1.URI.isUri(resourceOrContext)) {
            return context;
        }
        if (resourceOrContext && typeof resourceOrContext.groupId === 'number') {
            return resourceOrContext;
        }
        if (context && typeof context.groupId === 'number') {
            return context;
        }
        return undefined;
    }
    function resolveCommandsContext(editorGroupService, context) {
        // Resolve from context
        let group = context && typeof context.groupId === 'number' ? editorGroupService.getGroup(context.groupId) : undefined;
        let editor = group && context && typeof context.editorIndex === 'number' ? (0, types_1.withNullAsUndefined)(group.getEditorByIndex(context.editorIndex)) : undefined;
        // Fallback to active group as needed
        if (!group) {
            group = editorGroupService.activeGroup;
        }
        // Fallback to active editor as needed
        if (!editor) {
            editor = (0, types_1.withNullAsUndefined)(group.activeEditor);
        }
        return { group, editor };
    }
    function getMultiSelectedEditorContexts(editorContext, listService, editorGroupService) {
        // First check for a focused list to return the selected items from
        const list = listService.lastFocusedList;
        if (list instanceof listWidget_1.List && list.getHTMLElement() === document.activeElement) {
            const elementToContext = (element) => {
                if ((0, editorGroupsService_1.isEditorGroup)(element)) {
                    return { groupId: element.id, editorIndex: undefined };
                }
                const group = editorGroupService.getGroup(element.groupId);
                return { groupId: element.groupId, editorIndex: group ? group.getIndexOfEditor(element.editor) : -1 };
            };
            const onlyEditorGroupAndEditor = (e) => (0, editorGroupsService_1.isEditorGroup)(e) || (0, editor_1.isEditorIdentifier)(e);
            const focusedElements = list.getFocusedElements().filter(onlyEditorGroupAndEditor);
            const focus = editorContext ? editorContext : focusedElements.length ? focusedElements.map(elementToContext)[0] : undefined; // need to take into account when editor context is { group: group }
            if (focus) {
                const selection = list.getSelectedElements().filter(onlyEditorGroupAndEditor);
                // Only respect selection if it contains focused element
                if (selection === null || selection === void 0 ? void 0 : selection.some(s => {
                    if ((0, editorGroupsService_1.isEditorGroup)(s)) {
                        return s.id === focus.groupId;
                    }
                    const group = editorGroupService.getGroup(s.groupId);
                    return s.groupId === focus.groupId && (group ? group.getIndexOfEditor(s.editor) : -1) === focus.editorIndex;
                })) {
                    return selection.map(elementToContext);
                }
                return [focus];
            }
        }
        // Otherwise go with passed in context
        return !!editorContext ? [editorContext] : [];
    }
    exports.getMultiSelectedEditorContexts = getMultiSelectedEditorContexts;
    function setup() {
        registerActiveEditorMoveCopyCommand();
        registerEditorGroupsLayoutCommand();
        registerDiffEditorCommands();
        registerOpenEditorAPICommands();
        registerOpenEditorAtIndexCommands();
        registerCloseEditorCommands();
        registerOtherEditorCommands();
        registerSplitEditorInGroupCommands();
        registerFocusSideEditorsCommands();
        registerFocusEditorGroupAtIndexCommands();
        registerSplitEditorCommands();
        registerFocusEditorGroupWihoutWrapCommands();
    }
    exports.setup = setup;
});
//# sourceMappingURL=editorCommands.js.map