/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/platform/instantiation/common/extensions", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/contrib/debug/browser/breakpointsView", "vs/workbench/contrib/debug/browser/callStackView", "vs/workbench/common/contributions", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/browser/debugToolBar", "vs/workbench/contrib/debug/browser/debugService", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/contrib/debug/browser/statusbarColorProvider", "vs/workbench/common/views", "vs/base/common/platform", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/debug/browser/debugStatus", "vs/workbench/services/configuration/common/configuration", "vs/workbench/contrib/debug/browser/loadedScriptsView", "vs/workbench/contrib/debug/browser/debugEditorActions", "vs/workbench/contrib/debug/browser/watchExpressionsView", "vs/workbench/contrib/debug/browser/variablesView", "vs/workbench/contrib/debug/browser/repl", "vs/workbench/contrib/debug/common/debugContentProvider", "vs/workbench/contrib/debug/browser/welcomeView", "vs/workbench/contrib/debug/browser/debugViewlet", "vs/editor/browser/editorExtensions", "vs/workbench/contrib/debug/browser/callStackEditorContribution", "vs/workbench/contrib/debug/browser/breakpointEditorContribution", "vs/platform/instantiation/common/descriptors", "vs/workbench/browser/parts/views/viewPaneContainer", "vs/platform/quickinput/common/quickAccess", "vs/workbench/contrib/debug/browser/debugQuickAccess", "vs/workbench/contrib/debug/browser/debugProgress", "vs/workbench/contrib/debug/browser/debugTitle", "vs/workbench/contrib/debug/browser/debugColors", "vs/workbench/contrib/debug/browser/debugEditorContribution", "vs/base/common/network", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/common/editor", "vs/workbench/contrib/debug/browser/disassemblyView", "vs/workbench/browser/editor", "vs/workbench/contrib/debug/common/disassemblyViewInput", "vs/workbench/contrib/debug/common/debugLifecycle", "vs/editor/common/editorContextKeys", "vs/css!./media/debug.contribution", "vs/css!./media/debugHover"], function (require, exports, nls, actions_1, platform_1, extensions_1, configurationRegistry_1, breakpointsView_1, callStackView_1, contributions_1, debug_1, debugToolBar_1, debugService_1, debugCommands_1, statusbarColorProvider_1, views_1, platform_2, contextkey_1, debugStatus_1, configuration_1, loadedScriptsView_1, debugEditorActions_1, watchExpressionsView_1, variablesView_1, repl_1, debugContentProvider_1, welcomeView_1, debugViewlet_1, editorExtensions_1, callStackEditorContribution_1, breakpointEditorContribution_1, descriptors_1, viewPaneContainer_1, quickAccess_1, debugQuickAccess_1, debugProgress_1, debugTitle_1, debugColors_1, debugEditorContribution_1, network_1, icons, editor_1, disassemblyView_1, editor_2, disassemblyViewInput_1, debugLifecycle_1, editorContextKeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const debugCategory = nls.localize('debugCategory', "Debug");
    (0, debugColors_1.registerColors)();
    (0, extensions_1.registerSingleton)(debug_1.IDebugService, debugService_1.DebugService, true);
    // Register Debug Workbench Contributions
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugStatus_1.DebugStatusContribution, 4 /* LifecyclePhase.Eventually */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugProgress_1.DebugProgressContribution, 4 /* LifecyclePhase.Eventually */);
    if (platform_2.isWeb) {
        platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugTitle_1.DebugTitleContribution, 4 /* LifecyclePhase.Eventually */);
    }
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugToolBar_1.DebugToolBar, 3 /* LifecyclePhase.Restored */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugContentProvider_1.DebugContentProvider, 4 /* LifecyclePhase.Eventually */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(statusbarColorProvider_1.StatusBarColorProvider, 4 /* LifecyclePhase.Eventually */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(disassemblyView_1.DisassemblyViewContribution, 4 /* LifecyclePhase.Eventually */);
    platform_1.Registry.as(contributions_1.Extensions.Workbench).registerWorkbenchContribution(debugLifecycle_1.DebugLifecycle, 4 /* LifecyclePhase.Eventually */);
    // Register Quick Access
    platform_1.Registry.as(quickAccess_1.Extensions.Quickaccess).registerQuickAccessProvider({
        ctor: debugQuickAccess_1.StartDebugQuickAccessProvider,
        prefix: debugQuickAccess_1.StartDebugQuickAccessProvider.PREFIX,
        contextKey: 'inLaunchConfigurationsPicker',
        placeholder: nls.localize('startDebugPlaceholder', "Type the name of a launch configuration to run."),
        helpEntries: [{ description: nls.localize('startDebuggingHelp', "Start Debugging"), needsEditor: false }]
    });
    (0, editorExtensions_1.registerEditorContribution)('editor.contrib.callStack', callStackEditorContribution_1.CallStackEditorContribution);
    (0, editorExtensions_1.registerEditorContribution)(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID, breakpointEditorContribution_1.BreakpointEditorContribution);
    (0, editorExtensions_1.registerEditorContribution)(debug_1.EDITOR_CONTRIBUTION_ID, debugEditorContribution_1.DebugEditorContribution);
    const registerDebugCommandPaletteItem = (id, title, when, precondition) => {
        actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.CommandPalette, {
            when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, when),
            group: debugCategory,
            command: {
                id,
                title: `Debug: ${title}`,
                precondition
            }
        });
    };
    registerDebugCommandPaletteItem(debugCommands_1.RESTART_SESSION_ID, debugCommands_1.RESTART_LABEL);
    registerDebugCommandPaletteItem(debugCommands_1.TERMINATE_THREAD_ID, nls.localize('terminateThread', "Terminate Thread"), debug_1.CONTEXT_IN_DEBUG_MODE);
    registerDebugCommandPaletteItem(debugCommands_1.STEP_OVER_ID, debugCommands_1.STEP_OVER_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugCommandPaletteItem(debugCommands_1.STEP_INTO_ID, debugCommands_1.STEP_INTO_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugCommandPaletteItem(debugCommands_1.STEP_OUT_ID, debugCommands_1.STEP_OUT_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugCommandPaletteItem(debugCommands_1.PAUSE_ID, debugCommands_1.PAUSE_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('running'));
    registerDebugCommandPaletteItem(debugCommands_1.DISCONNECT_ID, debugCommands_1.DISCONNECT_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH, debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED));
    registerDebugCommandPaletteItem(debugCommands_1.DISCONNECT_AND_SUSPEND_ID, debugCommands_1.DISCONNECT_AND_SUSPEND_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_SUSPEND_DEBUGGEE_SUPPORTED, debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED)));
    registerDebugCommandPaletteItem(debugCommands_1.STOP_ID, debugCommands_1.STOP_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.toNegated(), debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED));
    registerDebugCommandPaletteItem(debugCommands_1.CONTINUE_ID, debugCommands_1.CONTINUE_LABEL, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugCommandPaletteItem(debugCommands_1.FOCUS_REPL_ID, nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'debugFocusConsole' }, 'Focus on Debug Console View'));
    registerDebugCommandPaletteItem(debugCommands_1.JUMP_TO_CURSOR_ID, nls.localize('jumpToCursor', "Jump to Cursor"), debug_1.CONTEXT_JUMP_TO_CURSOR_SUPPORTED);
    registerDebugCommandPaletteItem(debugCommands_1.JUMP_TO_CURSOR_ID, nls.localize('SetNextStatement', "Set Next Statement"), debug_1.CONTEXT_JUMP_TO_CURSOR_SUPPORTED);
    registerDebugCommandPaletteItem(debugEditorActions_1.RunToCursorAction.ID, debugEditorActions_1.RunToCursorAction.LABEL, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')));
    registerDebugCommandPaletteItem(debugEditorActions_1.SelectionToReplAction.ID, debugEditorActions_1.SelectionToReplAction.LABEL, contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasNonEmptySelection, debug_1.CONTEXT_IN_DEBUG_MODE));
    registerDebugCommandPaletteItem(debugEditorActions_1.SelectionToWatchExpressionsAction.ID, debugEditorActions_1.SelectionToWatchExpressionsAction.LABEL, contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasNonEmptySelection, debug_1.CONTEXT_IN_DEBUG_MODE));
    registerDebugCommandPaletteItem(debugCommands_1.TOGGLE_INLINE_BREAKPOINT_ID, nls.localize('inlineBreakpoint', "Inline Breakpoint"));
    registerDebugCommandPaletteItem(debugCommands_1.DEBUG_START_COMMAND_ID, debugCommands_1.DEBUG_START_LABEL, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, debug_1.CONTEXT_DEBUG_STATE.notEqualsTo((0, debug_1.getStateLabel)(1 /* State.Initializing */))));
    registerDebugCommandPaletteItem(debugCommands_1.DEBUG_RUN_COMMAND_ID, debugCommands_1.DEBUG_RUN_LABEL, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, debug_1.CONTEXT_DEBUG_STATE.notEqualsTo((0, debug_1.getStateLabel)(1 /* State.Initializing */))));
    registerDebugCommandPaletteItem(debugCommands_1.SELECT_AND_START_ID, debugCommands_1.SELECT_AND_START_LABEL, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, debug_1.CONTEXT_DEBUG_STATE.notEqualsTo((0, debug_1.getStateLabel)(1 /* State.Initializing */))));
    // Debug callstack context menu
    const registerDebugViewMenuItem = (menuId, id, title, order, when, precondition, group = 'navigation', icon) => {
        actions_1.MenuRegistry.appendMenuItem(menuId, {
            group,
            when,
            order,
            icon,
            command: {
                id,
                title,
                icon,
                precondition
            }
        });
    };
    registerDebugViewMenuItem(actions_1.MenuId.DebugCallStackContext, debugCommands_1.RESTART_SESSION_ID, debugCommands_1.RESTART_LABEL, 10, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session'), undefined, '3_modification');
    registerDebugViewMenuItem(actions_1.MenuId.DebugCallStackContext, debugCommands_1.DISCONNECT_ID, debugCommands_1.DISCONNECT_LABEL, 20, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session'), undefined, '3_modification');
    registerDebugViewMenuItem(actions_1.MenuId.DebugCallStackContext, debugCommands_1.DISCONNECT_AND_SUSPEND_ID, debugCommands_1.DISCONNECT_AND_SUSPEND_LABEL, 21, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session'), debug_1.CONTEXT_SUSPEND_DEBUGGEE_SUPPORTED, debug_1.CONTEXT_TERMINATE_DEBUGGEE_SUPPORTED), undefined, '3_modification');
    registerDebugViewMenuItem(actions_1.MenuId.DebugCallStackContext, debugCommands_1.STOP_ID, debugCommands_1.STOP_LABEL, 30, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session'), undefined, '3_modification');
    registerDebugViewMenuItem(actions_1.MenuId.DebugCallStackContext, debugCommands_1.PAUSE_ID, debugCommands_1.PAUSE_LABEL, 10, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('running')));
    registerDebugViewMenuItem(actions_1.MenuId.DebugCallStackContext, debugCommands_1.CONTINUE_ID, debugCommands_1.CONTINUE_LABEL, 10, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')));
    registerDebugViewMenuItem(actions_1.MenuId.DebugCallStackContext, debugCommands_1.STEP_OVER_ID, debugCommands_1.STEP_OVER_LABEL, 20, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugViewMenuItem(actions_1.MenuId.DebugCallStackContext, debugCommands_1.STEP_INTO_ID, debugCommands_1.STEP_INTO_LABEL, 30, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugViewMenuItem(actions_1.MenuId.DebugCallStackContext, debugCommands_1.STEP_OUT_ID, debugCommands_1.STEP_OUT_LABEL, 40, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'));
    registerDebugViewMenuItem(actions_1.MenuId.DebugCallStackContext, debugCommands_1.TERMINATE_THREAD_ID, nls.localize('terminateThread', "Terminate Thread"), 10, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), undefined, 'termination');
    registerDebugViewMenuItem(actions_1.MenuId.DebugCallStackContext, debugCommands_1.RESTART_FRAME_ID, nls.localize('restartFrame', "Restart Frame"), 10, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('stackFrame'), debug_1.CONTEXT_RESTART_FRAME_SUPPORTED), debug_1.CONTEXT_STACK_FRAME_SUPPORTS_RESTART);
    registerDebugViewMenuItem(actions_1.MenuId.DebugCallStackContext, debugCommands_1.COPY_STACK_TRACE_ID, nls.localize('copyStackTrace', "Copy Call Stack"), 20, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('stackFrame'), undefined, '3_modification');
    registerDebugViewMenuItem(actions_1.MenuId.DebugVariablesContext, variablesView_1.VIEW_MEMORY_ID, nls.localize('viewMemory', "View Binary Data"), 15, debug_1.CONTEXT_CAN_VIEW_MEMORY, debug_1.CONTEXT_IN_DEBUG_MODE, 'inline', icons.debugInspectMemory);
    registerDebugViewMenuItem(actions_1.MenuId.DebugVariablesContext, variablesView_1.SET_VARIABLE_ID, nls.localize('setValue', "Set Value"), 10, contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_SET_VARIABLE_SUPPORTED, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_VARIABLE_EVALUATE_NAME_PRESENT, debug_1.CONTEXT_SET_EXPRESSION_SUPPORTED)), debug_1.CONTEXT_VARIABLE_IS_READONLY.toNegated(), '3_modification');
    registerDebugViewMenuItem(actions_1.MenuId.DebugVariablesContext, variablesView_1.COPY_VALUE_ID, nls.localize('copyValue', "Copy Value"), 10, undefined, undefined, '5_cutcopypaste');
    registerDebugViewMenuItem(actions_1.MenuId.DebugVariablesContext, variablesView_1.COPY_EVALUATE_PATH_ID, nls.localize('copyAsExpression', "Copy as Expression"), 20, debug_1.CONTEXT_VARIABLE_EVALUATE_NAME_PRESENT, undefined, '5_cutcopypaste');
    registerDebugViewMenuItem(actions_1.MenuId.DebugVariablesContext, variablesView_1.ADD_TO_WATCH_ID, nls.localize('addToWatchExpressions', "Add to Watch"), 100, debug_1.CONTEXT_VARIABLE_EVALUATE_NAME_PRESENT, undefined, 'z_commands');
    registerDebugViewMenuItem(actions_1.MenuId.DebugVariablesContext, variablesView_1.BREAK_WHEN_VALUE_IS_READ_ID, nls.localize('breakWhenValueIsRead', "Break on Value Read"), 200, debug_1.CONTEXT_BREAK_WHEN_VALUE_IS_READ_SUPPORTED, undefined, 'z_commands');
    registerDebugViewMenuItem(actions_1.MenuId.DebugVariablesContext, variablesView_1.BREAK_WHEN_VALUE_CHANGES_ID, nls.localize('breakWhenValueChanges', "Break on Value Change"), 210, debug_1.CONTEXT_BREAK_WHEN_VALUE_CHANGES_SUPPORTED, undefined, 'z_commands');
    registerDebugViewMenuItem(actions_1.MenuId.DebugVariablesContext, variablesView_1.BREAK_WHEN_VALUE_IS_ACCESSED_ID, nls.localize('breakWhenValueIsAccessed', "Break on Value Access"), 220, debug_1.CONTEXT_BREAK_WHEN_VALUE_IS_ACCESSED_SUPPORTED, undefined, 'z_commands');
    registerDebugViewMenuItem(actions_1.MenuId.DebugWatchContext, watchExpressionsView_1.ADD_WATCH_ID, watchExpressionsView_1.ADD_WATCH_LABEL, 10, undefined, undefined, '3_modification');
    registerDebugViewMenuItem(actions_1.MenuId.DebugWatchContext, debugCommands_1.EDIT_EXPRESSION_COMMAND_ID, nls.localize('editWatchExpression', "Edit Expression"), 20, debug_1.CONTEXT_WATCH_ITEM_TYPE.isEqualTo('expression'), undefined, '3_modification');
    registerDebugViewMenuItem(actions_1.MenuId.DebugWatchContext, debugCommands_1.SET_EXPRESSION_COMMAND_ID, nls.localize('setValue', "Set Value"), 30, contextkey_1.ContextKeyExpr.or(contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_WATCH_ITEM_TYPE.isEqualTo('expression'), debug_1.CONTEXT_SET_EXPRESSION_SUPPORTED), contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_WATCH_ITEM_TYPE.isEqualTo('variable'), debug_1.CONTEXT_SET_VARIABLE_SUPPORTED)), debug_1.CONTEXT_VARIABLE_IS_READONLY.toNegated(), '3_modification');
    registerDebugViewMenuItem(actions_1.MenuId.DebugWatchContext, variablesView_1.COPY_VALUE_ID, nls.localize('copyValue', "Copy Value"), 40, contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_WATCH_ITEM_TYPE.isEqualTo('expression'), debug_1.CONTEXT_WATCH_ITEM_TYPE.isEqualTo('variable')), debug_1.CONTEXT_IN_DEBUG_MODE, '3_modification');
    registerDebugViewMenuItem(actions_1.MenuId.DebugWatchContext, variablesView_1.VIEW_MEMORY_ID, nls.localize('viewMemory', "View Binary Data"), 50, debug_1.CONTEXT_CAN_VIEW_MEMORY, debug_1.CONTEXT_IN_DEBUG_MODE, '3_modification');
    registerDebugViewMenuItem(actions_1.MenuId.DebugWatchContext, debugCommands_1.REMOVE_EXPRESSION_COMMAND_ID, nls.localize('removeWatchExpression', "Remove Expression"), 10, debug_1.CONTEXT_WATCH_ITEM_TYPE.isEqualTo('expression'), undefined, 'z_commands');
    registerDebugViewMenuItem(actions_1.MenuId.DebugWatchContext, watchExpressionsView_1.REMOVE_WATCH_EXPRESSIONS_COMMAND_ID, watchExpressionsView_1.REMOVE_WATCH_EXPRESSIONS_LABEL, 20, undefined, undefined, 'z_commands');
    // Touch Bar
    if (platform_2.isMacintosh) {
        const registerTouchBarEntry = (id, title, order, when, iconUri) => {
            actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.TouchBarContext, {
                command: {
                    id,
                    title,
                    icon: { dark: iconUri }
                },
                when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, when),
                group: '9_debug',
                order
            });
        };
        registerTouchBarEntry(debugCommands_1.DEBUG_RUN_COMMAND_ID, debugCommands_1.DEBUG_RUN_LABEL, 0, debug_1.CONTEXT_IN_DEBUG_MODE.toNegated(), network_1.FileAccess.asFileUri('vs/workbench/contrib/debug/browser/media/continue-tb.png', require));
        registerTouchBarEntry(debugCommands_1.DEBUG_START_COMMAND_ID, debugCommands_1.DEBUG_START_LABEL, 1, debug_1.CONTEXT_IN_DEBUG_MODE.toNegated(), network_1.FileAccess.asFileUri('vs/workbench/contrib/debug/browser/media/run-with-debugging-tb.png', require));
        registerTouchBarEntry(debugCommands_1.CONTINUE_ID, debugCommands_1.CONTINUE_LABEL, 0, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), network_1.FileAccess.asFileUri('vs/workbench/contrib/debug/browser/media/continue-tb.png', require));
        registerTouchBarEntry(debugCommands_1.PAUSE_ID, debugCommands_1.PAUSE_LABEL, 1, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, contextkey_1.ContextKeyExpr.notEquals('debugState', 'stopped')), network_1.FileAccess.asFileUri('vs/workbench/contrib/debug/browser/media/pause-tb.png', require));
        registerTouchBarEntry(debugCommands_1.STEP_OVER_ID, debugCommands_1.STEP_OVER_LABEL, 2, debug_1.CONTEXT_IN_DEBUG_MODE, network_1.FileAccess.asFileUri('vs/workbench/contrib/debug/browser/media/stepover-tb.png', require));
        registerTouchBarEntry(debugCommands_1.STEP_INTO_ID, debugCommands_1.STEP_INTO_LABEL, 3, debug_1.CONTEXT_IN_DEBUG_MODE, network_1.FileAccess.asFileUri('vs/workbench/contrib/debug/browser/media/stepinto-tb.png', require));
        registerTouchBarEntry(debugCommands_1.STEP_OUT_ID, debugCommands_1.STEP_OUT_LABEL, 4, debug_1.CONTEXT_IN_DEBUG_MODE, network_1.FileAccess.asFileUri('vs/workbench/contrib/debug/browser/media/stepout-tb.png', require));
        registerTouchBarEntry(debugCommands_1.RESTART_SESSION_ID, debugCommands_1.RESTART_LABEL, 5, debug_1.CONTEXT_IN_DEBUG_MODE, network_1.FileAccess.asFileUri('vs/workbench/contrib/debug/browser/media/restart-tb.png', require));
        registerTouchBarEntry(debugCommands_1.STOP_ID, debugCommands_1.STOP_LABEL, 6, debug_1.CONTEXT_IN_DEBUG_MODE, network_1.FileAccess.asFileUri('vs/workbench/contrib/debug/browser/media/stop-tb.png', require));
    }
    // Editor Title Menu's "Run/Debug" dropdown item
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorTitle, { submenu: actions_1.MenuId.EditorTitleRun, rememberDefaultAction: true, title: { value: nls.localize('run', "Run or Debug..."), original: 'Run or Debug...', }, icon: icons.debugRun, group: 'navigation', order: -1 });
    // Debug menu
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarMainMenu, {
        submenu: actions_1.MenuId.MenubarDebugMenu,
        title: {
            value: 'Run',
            original: 'Run',
            mnemonicTitle: nls.localize({ key: 'mRun', comment: ['&& denotes a mnemonic'] }, "&&Run")
        },
        when: contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_DEBUGGERS_AVAILABLE),
        order: 6
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '1_debug',
        command: {
            id: debugCommands_1.DEBUG_START_COMMAND_ID,
            title: nls.localize({ key: 'miStartDebugging', comment: ['&& denotes a mnemonic'] }, "&&Start Debugging")
        },
        order: 1,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '1_debug',
        command: {
            id: debugCommands_1.DEBUG_RUN_COMMAND_ID,
            title: nls.localize({ key: 'miRun', comment: ['&& denotes a mnemonic'] }, "Run &&Without Debugging")
        },
        order: 2,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '1_debug',
        command: {
            id: debugCommands_1.STOP_ID,
            title: nls.localize({ key: 'miStopDebugging', comment: ['&& denotes a mnemonic'] }, "&&Stop Debugging"),
            precondition: debug_1.CONTEXT_IN_DEBUG_MODE
        },
        order: 3,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '1_debug',
        command: {
            id: debugCommands_1.RESTART_SESSION_ID,
            title: nls.localize({ key: 'miRestart Debugging', comment: ['&& denotes a mnemonic'] }, "&&Restart Debugging"),
            precondition: debug_1.CONTEXT_IN_DEBUG_MODE
        },
        order: 4,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
    });
    // Configuration
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '2_configuration',
        command: {
            id: debugCommands_1.ADD_CONFIGURATION_ID,
            title: nls.localize({ key: 'miAddConfiguration', comment: ['&& denotes a mnemonic'] }, "A&&dd Configuration...")
        },
        order: 2,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
    });
    // Step Commands
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '3_step',
        command: {
            id: debugCommands_1.STEP_OVER_ID,
            title: nls.localize({ key: 'miStepOver', comment: ['&& denotes a mnemonic'] }, "Step &&Over"),
            precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')
        },
        order: 1,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '3_step',
        command: {
            id: debugCommands_1.STEP_INTO_ID,
            title: nls.localize({ key: 'miStepInto', comment: ['&& denotes a mnemonic'] }, "Step &&Into"),
            precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')
        },
        order: 2,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '3_step',
        command: {
            id: debugCommands_1.STEP_OUT_ID,
            title: nls.localize({ key: 'miStepOut', comment: ['&& denotes a mnemonic'] }, "Step O&&ut"),
            precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')
        },
        order: 3,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '3_step',
        command: {
            id: debugCommands_1.CONTINUE_ID,
            title: nls.localize({ key: 'miContinue', comment: ['&& denotes a mnemonic'] }, "&&Continue"),
            precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped')
        },
        order: 4,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
    });
    // New Breakpoints
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarNewBreakpointMenu, {
        group: '1_breakpoints',
        command: {
            id: debugCommands_1.TOGGLE_INLINE_BREAKPOINT_ID,
            title: nls.localize({ key: 'miInlineBreakpoint', comment: ['&& denotes a mnemonic'] }, "Inline Breakp&&oint")
        },
        order: 2,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: '4_new_breakpoint',
        title: nls.localize({ key: 'miNewBreakpoint', comment: ['&& denotes a mnemonic'] }, "&&New Breakpoint"),
        submenu: actions_1.MenuId.MenubarNewBreakpointMenu,
        order: 2,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
    });
    // Breakpoint actions are registered from breakpointsView.ts
    // Install Debuggers
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarDebugMenu, {
        group: 'z_install',
        command: {
            id: 'debug.installAdditionalDebuggers',
            title: nls.localize({ key: 'miInstallAdditionalDebuggers', comment: ['&& denotes a mnemonic'] }, "&&Install Additional Debuggers...")
        },
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
        order: 1
    });
    // register repl panel
    const VIEW_CONTAINER = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: debug_1.DEBUG_PANEL_ID,
        title: nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'debugPanel' }, 'Debug Console'),
        icon: icons.debugConsoleViewIcon,
        ctorDescriptor: new descriptors_1.SyncDescriptor(viewPaneContainer_1.ViewPaneContainer, [debug_1.DEBUG_PANEL_ID, { mergeViewWithContainerWhenSingleView: true, donotShowContainerTitleWhenMergedWithContainer: true }]),
        storageId: debug_1.DEBUG_PANEL_ID,
        hideIfEmpty: true,
        order: 2,
    }, 1 /* ViewContainerLocation.Panel */, { donotRegisterOpenCommand: true });
    platform_1.Registry.as(views_1.Extensions.ViewsRegistry).registerViews([{
            id: debug_1.REPL_VIEW_ID,
            name: nls.localize({ comment: ['Debug is a noun in this context, not a verb.'], key: 'debugPanel' }, 'Debug Console'),
            containerIcon: icons.debugConsoleViewIcon,
            canToggleVisibility: false,
            canMoveView: true,
            when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
            ctorDescriptor: new descriptors_1.SyncDescriptor(repl_1.Repl),
            openCommandActionDescriptor: {
                id: 'workbench.debug.action.toggleRepl',
                mnemonicTitle: nls.localize({ key: 'miToggleDebugConsole', comment: ['&& denotes a mnemonic'] }, "De&&bug Console"),
                keybindings: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 55 /* KeyCode.KeyY */ },
                order: 2
            }
        }], VIEW_CONTAINER);
    const viewContainer = platform_1.Registry.as(views_1.Extensions.ViewContainersRegistry).registerViewContainer({
        id: debug_1.VIEWLET_ID,
        title: nls.localize('run and debug', "Run and Debug"),
        openCommandActionDescriptor: {
            id: debug_1.VIEWLET_ID,
            mnemonicTitle: nls.localize({ key: 'miViewRun', comment: ['&& denotes a mnemonic'] }, "&&Run"),
            keybindings: { primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 34 /* KeyCode.KeyD */ },
            order: 3
        },
        ctorDescriptor: new descriptors_1.SyncDescriptor(debugViewlet_1.DebugViewPaneContainer),
        icon: icons.runViewIcon,
        alwaysUseContainerInfo: true,
        order: 3,
    }, 0 /* ViewContainerLocation.Sidebar */);
    // Register default debug views
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    viewsRegistry.registerViews([{ id: debug_1.VARIABLES_VIEW_ID, name: nls.localize('variables', "Variables"), containerIcon: icons.variablesViewIcon, ctorDescriptor: new descriptors_1.SyncDescriptor(variablesView_1.VariablesView), order: 10, weight: 40, canToggleVisibility: true, canMoveView: true, focusCommand: { id: 'workbench.debug.action.focusVariablesView' }, when: debug_1.CONTEXT_DEBUG_UX.isEqualTo('default') }], viewContainer);
    viewsRegistry.registerViews([{ id: debug_1.WATCH_VIEW_ID, name: nls.localize('watch', "Watch"), containerIcon: icons.watchViewIcon, ctorDescriptor: new descriptors_1.SyncDescriptor(watchExpressionsView_1.WatchExpressionsView), order: 20, weight: 10, canToggleVisibility: true, canMoveView: true, focusCommand: { id: 'workbench.debug.action.focusWatchView' }, when: debug_1.CONTEXT_DEBUG_UX.isEqualTo('default') }], viewContainer);
    viewsRegistry.registerViews([{ id: debug_1.CALLSTACK_VIEW_ID, name: nls.localize('callStack', "Call Stack"), containerIcon: icons.callStackViewIcon, ctorDescriptor: new descriptors_1.SyncDescriptor(callStackView_1.CallStackView), order: 30, weight: 30, canToggleVisibility: true, canMoveView: true, focusCommand: { id: 'workbench.debug.action.focusCallStackView' }, when: debug_1.CONTEXT_DEBUG_UX.isEqualTo('default') }], viewContainer);
    viewsRegistry.registerViews([{ id: debug_1.BREAKPOINTS_VIEW_ID, name: nls.localize('breakpoints', "Breakpoints"), containerIcon: icons.breakpointsViewIcon, ctorDescriptor: new descriptors_1.SyncDescriptor(breakpointsView_1.BreakpointsView), order: 40, weight: 20, canToggleVisibility: true, canMoveView: true, focusCommand: { id: 'workbench.debug.action.focusBreakpointsView' }, when: contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_BREAKPOINTS_EXIST, debug_1.CONTEXT_DEBUG_UX.isEqualTo('default')) }], viewContainer);
    viewsRegistry.registerViews([{ id: welcomeView_1.WelcomeView.ID, name: welcomeView_1.WelcomeView.LABEL, containerIcon: icons.runViewIcon, ctorDescriptor: new descriptors_1.SyncDescriptor(welcomeView_1.WelcomeView), order: 1, weight: 40, canToggleVisibility: true, when: debug_1.CONTEXT_DEBUG_UX.isEqualTo('simple') }], viewContainer);
    viewsRegistry.registerViews([{ id: debug_1.LOADED_SCRIPTS_VIEW_ID, name: nls.localize('loadedScripts', "Loaded Scripts"), containerIcon: icons.loadedScriptsViewIcon, ctorDescriptor: new descriptors_1.SyncDescriptor(loadedScriptsView_1.LoadedScriptsView), order: 35, weight: 5, canToggleVisibility: true, canMoveView: true, collapsed: true, when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_LOADED_SCRIPTS_SUPPORTED, debug_1.CONTEXT_DEBUG_UX.isEqualTo('default')) }], viewContainer);
    // Register disassembly view
    platform_1.Registry.as(editor_1.EditorExtensions.EditorPane).registerEditorPane(editor_2.EditorPaneDescriptor.create(disassemblyView_1.DisassemblyView, debug_1.DISASSEMBLY_VIEW_ID, nls.localize('disassembly', "Disassembly")), [new descriptors_1.SyncDescriptor(disassemblyViewInput_1.DisassemblyViewInput)]);
    // Register configuration
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    configurationRegistry.registerConfiguration({
        id: 'debug',
        order: 20,
        title: nls.localize('debugConfigurationTitle', "Debug"),
        type: 'object',
        properties: {
            'debug.allowBreakpointsEverywhere': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'allowBreakpointsEverywhere' }, "Allow setting breakpoints in any file."),
                default: false
            },
            'debug.openExplorerOnEnd': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'openExplorerOnEnd' }, "Automatically open the explorer view at the end of a debug session."),
                default: false
            },
            'debug.inlineValues': {
                type: 'string',
                'enum': ['on', 'off', 'auto'],
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'inlineValues' }, "Show variable values inline in editor while debugging."),
                'enumDescriptions': [
                    nls.localize('inlineValues.on', 'Always show variable values inline in editor while debugging.'),
                    nls.localize('inlineValues.off', 'Never show variable values inline in editor while debugging.'),
                    nls.localize('inlineValues.focusNoScroll', 'Show variable values inline in editor while debugging when the language supports inline value locations.'),
                ],
                default: 'auto'
            },
            'debug.toolBarLocation': {
                enum: ['floating', 'docked', 'hidden'],
                markdownDescription: nls.localize({ comment: ['This is the description for a setting'], key: 'toolBarLocation' }, "Controls the location of the debug toolbar. Either `floating` in all views, `docked` in the debug view, or `hidden`."),
                default: 'floating'
            },
            'debug.showInStatusBar': {
                enum: ['never', 'always', 'onFirstSessionStart'],
                enumDescriptions: [nls.localize('never', "Never show debug in status bar"), nls.localize('always', "Always show debug in status bar"), nls.localize('onFirstSessionStart', "Show debug in status bar only after debug was started for the first time")],
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'showInStatusBar' }, "Controls when the debug status bar should be visible."),
                default: 'onFirstSessionStart'
            },
            'debug.internalConsoleOptions': debug_1.INTERNAL_CONSOLE_OPTIONS_SCHEMA,
            'debug.console.closeOnEnd': {
                type: 'boolean',
                description: nls.localize('debug.console.closeOnEnd', "Controls if the debug console should be automatically closed when the debug session ends."),
                default: false
            },
            'debug.terminal.clearBeforeReusing': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'debug.terminal.clearBeforeReusing' }, "Before starting a new debug session in an integrated or external terminal, clear the terminal."),
                default: false
            },
            'debug.openDebug': {
                enum: ['neverOpen', 'openOnSessionStart', 'openOnFirstSessionStart', 'openOnDebugBreak'],
                default: 'openOnDebugBreak',
                description: nls.localize('openDebug', "Controls when the debug view should open.")
            },
            'debug.showSubSessionsInToolBar': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'showSubSessionsInToolBar' }, "Controls whether the debug sub-sessions are shown in the debug tool bar. When this setting is false the stop command on a sub-session will also stop the parent session."),
                default: false
            },
            'debug.console.fontSize': {
                type: 'number',
                description: nls.localize('debug.console.fontSize', "Controls the font size in pixels in the debug console."),
                default: platform_2.isMacintosh ? 12 : 14,
            },
            'debug.console.fontFamily': {
                type: 'string',
                description: nls.localize('debug.console.fontFamily', "Controls the font family in the debug console."),
                default: 'default'
            },
            'debug.console.lineHeight': {
                type: 'number',
                description: nls.localize('debug.console.lineHeight', "Controls the line height in pixels in the debug console. Use 0 to compute the line height from the font size."),
                default: 0
            },
            'debug.console.wordWrap': {
                type: 'boolean',
                description: nls.localize('debug.console.wordWrap', "Controls if the lines should wrap in the debug console."),
                default: true
            },
            'debug.console.historySuggestions': {
                type: 'boolean',
                description: nls.localize('debug.console.historySuggestions', "Controls if the debug console should suggest previously typed input."),
                default: true
            },
            'debug.console.collapseIdenticalLines': {
                type: 'boolean',
                description: nls.localize('debug.console.collapseIdenticalLines', "Controls if the debug console should collapse identical lines and show a number of occurrences with a badge."),
                default: true
            },
            'debug.console.acceptSuggestionOnEnter': {
                enum: ['off', 'on'],
                description: nls.localize('debug.console.acceptSuggestionOnEnter', "Controls whether suggestions should be accepted on enter in the debug console. enter is also used to evaluate whatever is typed in the debug console."),
                default: 'off'
            },
            'launch': {
                type: 'object',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'launch' }, "Global debug launch configuration. Should be used as an alternative to 'launch.json' that is shared across workspaces."),
                default: { configurations: [], compounds: [] },
                $ref: configuration_1.launchSchemaId
            },
            'debug.focusWindowOnBreak': {
                type: 'boolean',
                description: nls.localize('debug.focusWindowOnBreak', "Controls whether the workbench window should be focused when the debugger breaks."),
                default: true
            },
            'debug.focusEditorOnBreak': {
                type: 'boolean',
                description: nls.localize('debug.focusEditorOnBreak', "Controls whether the editor should be focused when the debugger breaks."),
                default: true
            },
            'debug.onTaskErrors': {
                enum: ['debugAnyway', 'showErrors', 'prompt', 'abort'],
                enumDescriptions: [nls.localize('debugAnyway', "Ignore task errors and start debugging."), nls.localize('showErrors', "Show the Problems view and do not start debugging."), nls.localize('prompt', "Prompt user."), nls.localize('cancel', "Cancel debugging.")],
                description: nls.localize('debug.onTaskErrors', "Controls what to do when errors are encountered after running a preLaunchTask."),
                default: 'prompt'
            },
            'debug.showBreakpointsInOverviewRuler': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'showBreakpointsInOverviewRuler' }, "Controls whether breakpoints should be shown in the overview ruler."),
                default: false
            },
            'debug.showInlineBreakpointCandidates': {
                type: 'boolean',
                description: nls.localize({ comment: ['This is the description for a setting'], key: 'showInlineBreakpointCandidates' }, "Controls whether inline breakpoints candidate decorations should be shown in the editor while debugging."),
                default: true
            },
            'debug.saveBeforeStart': {
                description: nls.localize('debug.saveBeforeStart', "Controls what editors to save before starting a debug session."),
                enum: ['allEditorsInActiveGroup', 'nonUntitledEditorsInActiveGroup', 'none'],
                enumDescriptions: [
                    nls.localize('debug.saveBeforeStart.allEditorsInActiveGroup', "Save all editors in the active group before starting a debug session."),
                    nls.localize('debug.saveBeforeStart.nonUntitledEditorsInActiveGroup', "Save all editors in the active group except untitled ones before starting a debug session."),
                    nls.localize('debug.saveBeforeStart.none', "Don't save any editors before starting a debug session."),
                ],
                default: 'allEditorsInActiveGroup',
                scope: 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */
            },
            'debug.confirmOnExit': {
                description: nls.localize('debug.confirmOnExit', "Controls whether to confirm when the window closes if there are active debug sessions."),
                type: 'string',
                enum: ['never', 'always'],
                enumDescriptions: [
                    nls.localize('debug.confirmOnExit.never', "Never confirm."),
                    nls.localize('debug.confirmOnExit.always', "Always confirm if there are debug sessions."),
                ],
                default: 'never'
            },
            'debug.disassemblyView.showSourceCode': {
                type: 'boolean',
                default: true,
                description: nls.localize('debug.disassemblyView.showSourceCode', "Show Source Code in Disassembly View.")
            },
            'debug.autoExpandLazyVariables': {
                type: 'boolean',
                default: false,
                description: nls.localize('debug.autoExpandLazyVariables', "Automatically show values for variables that are lazily resolved by the debugger, such as getters.")
            }
        }
    });
});
//# sourceMappingURL=debug.contribution.js.map