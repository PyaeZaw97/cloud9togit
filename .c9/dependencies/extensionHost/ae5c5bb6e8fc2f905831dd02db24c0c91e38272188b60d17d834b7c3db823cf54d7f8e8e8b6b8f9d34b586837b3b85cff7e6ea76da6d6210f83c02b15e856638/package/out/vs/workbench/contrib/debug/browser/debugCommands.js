/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/browser/ui/list/listWidget", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/list/browser/listService", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/extensions/common/extensions", "vs/editor/browser/editorBrowser", "vs/platform/actions/common/actions", "vs/workbench/services/editor/common/editorService", "vs/editor/common/editorContextKeys", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/debug/browser/breakpointsView", "vs/platform/notification/common/notification", "vs/platform/contextkey/common/contextkeys", "vs/workbench/common/contextkeys", "vs/platform/commands/common/commands", "vs/editor/common/services/textResourceConfiguration", "vs/platform/clipboard/common/clipboardService", "vs/platform/configuration/common/configuration", "vs/platform/quickinput/common/quickInput", "vs/workbench/common/views", "vs/base/common/objects", "vs/base/common/platform", "vs/workbench/contrib/debug/common/debugUtils", "vs/workbench/services/panecomposite/browser/panecomposite"], function (require, exports, nls, listWidget_1, keybindingsRegistry_1, listService_1, debug_1, debugModel_1, extensions_1, editorBrowser_1, actions_1, editorService_1, editorContextKeys_1, contextkey_1, breakpointsView_1, notification_1, contextkeys_1, contextkeys_2, commands_1, textResourceConfiguration_1, clipboardService_1, configuration_1, quickInput_1, views_1, objects_1, platform_1, debugUtils_1, panecomposite_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEBUG_RUN_LABEL = exports.DEBUG_START_LABEL = exports.DEBUG_CONFIGURE_LABEL = exports.SELECT_AND_START_LABEL = exports.FOCUS_SESSION_LABEL = exports.CONTINUE_LABEL = exports.STOP_LABEL = exports.DISCONNECT_AND_SUSPEND_LABEL = exports.DISCONNECT_LABEL = exports.PAUSE_LABEL = exports.STEP_OUT_LABEL = exports.STEP_INTO_LABEL = exports.STEP_OVER_LABEL = exports.RESTART_LABEL = exports.REMOVE_EXPRESSION_COMMAND_ID = exports.SET_EXPRESSION_COMMAND_ID = exports.EDIT_EXPRESSION_COMMAND_ID = exports.DEBUG_RUN_COMMAND_ID = exports.DEBUG_START_COMMAND_ID = exports.DEBUG_CONFIGURE_COMMAND_ID = exports.SELECT_AND_START_ID = exports.FOCUS_SESSION_ID = exports.JUMP_TO_CURSOR_ID = exports.FOCUS_REPL_ID = exports.CONTINUE_ID = exports.RESTART_FRAME_ID = exports.STOP_ID = exports.DISCONNECT_AND_SUSPEND_ID = exports.DISCONNECT_ID = exports.PAUSE_ID = exports.STEP_OUT_ID = exports.STEP_INTO_ID = exports.STEP_OVER_ID = exports.TERMINATE_THREAD_ID = exports.RESTART_SESSION_ID = exports.STEP_BACK_ID = exports.REVERSE_CONTINUE_ID = exports.COPY_STACK_TRACE_ID = exports.TOGGLE_INLINE_BREAKPOINT_ID = exports.ADD_CONFIGURATION_ID = void 0;
    exports.ADD_CONFIGURATION_ID = 'debug.addConfiguration';
    exports.TOGGLE_INLINE_BREAKPOINT_ID = 'editor.debug.action.toggleInlineBreakpoint';
    exports.COPY_STACK_TRACE_ID = 'debug.copyStackTrace';
    exports.REVERSE_CONTINUE_ID = 'workbench.action.debug.reverseContinue';
    exports.STEP_BACK_ID = 'workbench.action.debug.stepBack';
    exports.RESTART_SESSION_ID = 'workbench.action.debug.restart';
    exports.TERMINATE_THREAD_ID = 'workbench.action.debug.terminateThread';
    exports.STEP_OVER_ID = 'workbench.action.debug.stepOver';
    exports.STEP_INTO_ID = 'workbench.action.debug.stepInto';
    exports.STEP_OUT_ID = 'workbench.action.debug.stepOut';
    exports.PAUSE_ID = 'workbench.action.debug.pause';
    exports.DISCONNECT_ID = 'workbench.action.debug.disconnect';
    exports.DISCONNECT_AND_SUSPEND_ID = 'workbench.action.debug.disconnectAndSuspend';
    exports.STOP_ID = 'workbench.action.debug.stop';
    exports.RESTART_FRAME_ID = 'workbench.action.debug.restartFrame';
    exports.CONTINUE_ID = 'workbench.action.debug.continue';
    exports.FOCUS_REPL_ID = 'workbench.debug.action.focusRepl';
    exports.JUMP_TO_CURSOR_ID = 'debug.jumpToCursor';
    exports.FOCUS_SESSION_ID = 'workbench.action.debug.focusProcess';
    exports.SELECT_AND_START_ID = 'workbench.action.debug.selectandstart';
    exports.DEBUG_CONFIGURE_COMMAND_ID = 'workbench.action.debug.configure';
    exports.DEBUG_START_COMMAND_ID = 'workbench.action.debug.start';
    exports.DEBUG_RUN_COMMAND_ID = 'workbench.action.debug.run';
    exports.EDIT_EXPRESSION_COMMAND_ID = 'debug.renameWatchExpression';
    exports.SET_EXPRESSION_COMMAND_ID = 'debug.setWatchExpression';
    exports.REMOVE_EXPRESSION_COMMAND_ID = 'debug.removeWatchExpression';
    exports.RESTART_LABEL = nls.localize('restartDebug', "Restart");
    exports.STEP_OVER_LABEL = nls.localize('stepOverDebug', "Step Over");
    exports.STEP_INTO_LABEL = nls.localize('stepIntoDebug', "Step Into");
    exports.STEP_OUT_LABEL = nls.localize('stepOutDebug', "Step Out");
    exports.PAUSE_LABEL = nls.localize('pauseDebug', "Pause");
    exports.DISCONNECT_LABEL = nls.localize('disconnect', "Disconnect");
    exports.DISCONNECT_AND_SUSPEND_LABEL = nls.localize('disconnectSuspend', "Disconnect and Suspend");
    exports.STOP_LABEL = nls.localize('stop', "Stop");
    exports.CONTINUE_LABEL = nls.localize('continueDebug', "Continue");
    exports.FOCUS_SESSION_LABEL = nls.localize('focusSession', "Focus Session");
    exports.SELECT_AND_START_LABEL = nls.localize('selectAndStartDebugging', "Select and Start Debugging");
    exports.DEBUG_CONFIGURE_LABEL = nls.localize('openLaunchJson', "Open '{0}'", 'launch.json');
    exports.DEBUG_START_LABEL = nls.localize('startDebug', "Start Debugging");
    exports.DEBUG_RUN_LABEL = nls.localize('startWithoutDebugging', "Start Without Debugging");
    function isThreadContext(obj) {
        return obj && typeof obj.sessionId === 'string' && typeof obj.threadId === 'string';
    }
    async function getThreadAndRun(accessor, sessionAndThreadId, run) {
        const debugService = accessor.get(debug_1.IDebugService);
        let thread;
        if (isThreadContext(sessionAndThreadId)) {
            const session = debugService.getModel().getSession(sessionAndThreadId.sessionId);
            if (session) {
                thread = session.getAllThreads().find(t => t.getId() === sessionAndThreadId.threadId);
            }
        }
        else if (isSessionContext(sessionAndThreadId)) {
            const session = debugService.getModel().getSession(sessionAndThreadId.sessionId);
            if (session) {
                const threads = session.getAllThreads();
                thread = threads.length > 0 ? threads[0] : undefined;
            }
        }
        if (!thread) {
            thread = debugService.getViewModel().focusedThread;
            if (!thread) {
                const focusedSession = debugService.getViewModel().focusedSession;
                const threads = focusedSession ? focusedSession.getAllThreads() : undefined;
                thread = threads && threads.length ? threads[0] : undefined;
            }
        }
        if (thread) {
            await run(thread);
        }
    }
    function isStackFrameContext(obj) {
        return obj && typeof obj.sessionId === 'string' && typeof obj.threadId === 'string' && typeof obj.frameId === 'string';
    }
    function getFrame(debugService, context) {
        if (isStackFrameContext(context)) {
            const session = debugService.getModel().getSession(context.sessionId);
            if (session) {
                const thread = session.getAllThreads().find(t => t.getId() === context.threadId);
                if (thread) {
                    return thread.getCallStack().find(sf => sf.getId() === context.frameId);
                }
            }
        }
        return undefined;
    }
    function isSessionContext(obj) {
        return obj && typeof obj.sessionId === 'string';
    }
    // These commands are used in call stack context menu, call stack inline actions, command palette, debug toolbar, mac native touch bar
    // When the command is exectued in the context of a thread(context menu on a thread, inline call stack action) we pass the thread id
    // Otherwise when it is executed "globaly"(using the touch bar, debug toolbar, command palette) we do not pass any id and just take whatever is the focussed thread
    // Same for stackFrame commands and session commands.
    commands_1.CommandsRegistry.registerCommand({
        id: exports.COPY_STACK_TRACE_ID,
        handler: async (accessor, _, context) => {
            const textResourcePropertiesService = accessor.get(textResourceConfiguration_1.ITextResourcePropertiesService);
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            const frame = getFrame(accessor.get(debug_1.IDebugService), context);
            if (frame) {
                const eol = textResourcePropertiesService.getEOL(frame.source.uri);
                await clipboardService.writeText(frame.thread.getCallStack().map(sf => sf.toString()).join(eol));
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.REVERSE_CONTINUE_ID,
        handler: (accessor, _, context) => {
            getThreadAndRun(accessor, context, thread => thread.reverseContinue());
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.STEP_BACK_ID,
        handler: (accessor, _, context) => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            if (debug_1.CONTEXT_DISASSEMBLY_VIEW_FOCUS.getValue(contextKeyService)) {
                getThreadAndRun(accessor, context, (thread) => thread.stepBack('instruction'));
            }
            else {
                getThreadAndRun(accessor, context, (thread) => thread.stepBack());
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.TERMINATE_THREAD_ID,
        handler: (accessor, _, context) => {
            getThreadAndRun(accessor, context, thread => thread.terminate());
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.JUMP_TO_CURSOR_ID,
        handler: async (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const stackFrame = debugService.getViewModel().focusedStackFrame;
            const editorService = accessor.get(editorService_1.IEditorService);
            const activeEditorControl = editorService.activeTextEditorControl;
            const notificationService = accessor.get(notification_1.INotificationService);
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            if (stackFrame && (0, editorBrowser_1.isCodeEditor)(activeEditorControl) && activeEditorControl.hasModel()) {
                const position = activeEditorControl.getPosition();
                const resource = activeEditorControl.getModel().uri;
                const source = stackFrame.thread.session.getSourceForUri(resource);
                if (source) {
                    const response = await stackFrame.thread.session.gotoTargets(source.raw, position.lineNumber, position.column);
                    const targets = response === null || response === void 0 ? void 0 : response.body.targets;
                    if (targets && targets.length) {
                        let id = targets[0].id;
                        if (targets.length > 1) {
                            const picks = targets.map(t => ({ label: t.label, _id: t.id }));
                            const pick = await quickInputService.pick(picks, { placeHolder: nls.localize('chooseLocation', "Choose the specific location") });
                            if (!pick) {
                                return;
                            }
                            id = pick._id;
                        }
                        return await stackFrame.thread.session.goto(stackFrame.thread.threadId, id).catch(e => notificationService.warn(e));
                    }
                }
            }
            return notificationService.warn(nls.localize('noExecutableCode', "No executable code is associated at the current cursor position."));
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, {
        command: {
            id: exports.JUMP_TO_CURSOR_ID,
            title: nls.localize('jumpToCursor', "Jump to Cursor"),
            category: { value: nls.localize('debug', "Debug"), original: 'Debug' }
        },
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_JUMP_TO_CURSOR_SUPPORTED, editorContextKeys_1.EditorContextKeys.editorTextFocus),
        group: 'debug',
        order: 3
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.RESTART_SESSION_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 1024 /* KeyMod.Shift */ | 2048 /* KeyMod.CtrlCmd */ | 63 /* KeyCode.F5 */,
        when: debug_1.CONTEXT_IN_DEBUG_MODE,
        handler: async (accessor, _, context) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            let session;
            if (isSessionContext(context)) {
                session = debugService.getModel().getSession(context.sessionId);
            }
            else {
                session = debugService.getViewModel().focusedSession;
            }
            if (!session) {
                const { launch, name } = debugService.getConfigurationManager().selectedConfiguration;
                await debugService.startDebugging(launch, name, { noDebug: false, startedByUser: true });
            }
            else {
                const showSubSessions = configurationService.getValue('debug').showSubSessionsInToolBar;
                // Stop should be sent to the root parent session
                while (!showSubSessions && session && session.parentSession) {
                    session = session.parentSession;
                }
                session.removeReplExpressions();
                await debugService.restartSession(session);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.STEP_OVER_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: platform_1.isWeb ? (512 /* KeyMod.Alt */ | 68 /* KeyCode.F10 */) : 68 /* KeyCode.F10 */,
        when: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'),
        handler: (accessor, _, context) => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            if (debug_1.CONTEXT_DISASSEMBLY_VIEW_FOCUS.getValue(contextKeyService)) {
                getThreadAndRun(accessor, context, (thread) => thread.next('instruction'));
            }
            else {
                getThreadAndRun(accessor, context, (thread) => thread.next());
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.STEP_INTO_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
        primary: (platform_1.isWeb && platform_1.isWindows) ? (512 /* KeyMod.Alt */ | 69 /* KeyCode.F11 */) : 69 /* KeyCode.F11 */,
        // Use a more flexible when clause to not allow full screen command to take over when F11 pressed a lot of times
        when: debug_1.CONTEXT_DEBUG_STATE.notEqualsTo('inactive'),
        handler: (accessor, _, context) => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            if (debug_1.CONTEXT_DISASSEMBLY_VIEW_FOCUS.getValue(contextKeyService)) {
                getThreadAndRun(accessor, context, (thread) => thread.stepIn('instruction'));
            }
            else {
                getThreadAndRun(accessor, context, (thread) => thread.stepIn());
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.STEP_OUT_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 1024 /* KeyMod.Shift */ | 69 /* KeyCode.F11 */,
        when: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'),
        handler: (accessor, _, context) => {
            const contextKeyService = accessor.get(contextkey_1.IContextKeyService);
            if (debug_1.CONTEXT_DISASSEMBLY_VIEW_FOCUS.getValue(contextKeyService)) {
                getThreadAndRun(accessor, context, (thread) => thread.stepOut('instruction'));
            }
            else {
                getThreadAndRun(accessor, context, (thread) => thread.stepOut());
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.PAUSE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 2,
        primary: 64 /* KeyCode.F6 */,
        when: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('running'),
        handler: (accessor, _, context) => {
            getThreadAndRun(accessor, context, thread => thread.pause());
        }
    });
    async function stopHandler(accessor, _, context, disconnect, suspend) {
        const debugService = accessor.get(debug_1.IDebugService);
        let session;
        if (isSessionContext(context)) {
            session = debugService.getModel().getSession(context.sessionId);
        }
        else {
            session = debugService.getViewModel().focusedSession;
        }
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const showSubSessions = configurationService.getValue('debug').showSubSessionsInToolBar;
        // Stop should be sent to the root parent session
        while (!showSubSessions && session && session.parentSession) {
            session = session.parentSession;
        }
        await debugService.stopSession(session, disconnect, suspend);
    }
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.DISCONNECT_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 1024 /* KeyMod.Shift */ | 63 /* KeyCode.F5 */,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH, debug_1.CONTEXT_IN_DEBUG_MODE),
        handler: (accessor, _, context) => stopHandler(accessor, _, context, true)
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.DISCONNECT_AND_SUSPEND_ID,
        handler: (accessor, _, context) => stopHandler(accessor, _, context, true, true)
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.STOP_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 1024 /* KeyMod.Shift */ | 63 /* KeyCode.F5 */,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_FOCUSED_SESSION_IS_ATTACH.toNegated(), debug_1.CONTEXT_IN_DEBUG_MODE),
        handler: (accessor, _, context) => stopHandler(accessor, _, context, false)
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.RESTART_FRAME_ID,
        handler: async (accessor, _, context) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const notificationService = accessor.get(notification_1.INotificationService);
            const frame = getFrame(debugService, context);
            if (frame) {
                try {
                    await frame.restart();
                }
                catch (e) {
                    notificationService.error(e);
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.CONTINUE_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 10,
        primary: 63 /* KeyCode.F5 */,
        when: debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'),
        handler: (accessor, _, context) => {
            getThreadAndRun(accessor, context, thread => thread.continue());
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.FOCUS_REPL_ID,
        handler: async (accessor) => {
            const viewsService = accessor.get(views_1.IViewsService);
            await viewsService.openView(debug_1.REPL_VIEW_ID, true);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: 'debug.startFromConfig',
        handler: async (accessor, config) => {
            const debugService = accessor.get(debug_1.IDebugService);
            await debugService.startDebugging(undefined, config);
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.FOCUS_SESSION_ID,
        handler: async (accessor, session) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const stoppedChildSession = debugService.getModel().getSessions().find(s => s.parentSession === session && s.state === 2 /* State.Stopped */);
            if (stoppedChildSession && session.state !== 2 /* State.Stopped */) {
                session = stoppedChildSession;
            }
            await debugService.focusStackFrame(undefined, undefined, session, { explicit: true });
            const stackFrame = debugService.getViewModel().focusedStackFrame;
            if (stackFrame) {
                await stackFrame.openInEditor(editorService, true);
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SELECT_AND_START_ID,
        handler: async (accessor) => {
            const quickInputService = accessor.get(quickInput_1.IQuickInputService);
            quickInputService.quickAccess.show('debug ');
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.DEBUG_START_COMMAND_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 63 /* KeyCode.F5 */,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('inactive')),
        handler: async (accessor, debugStartOptions) => {
            const debugService = accessor.get(debug_1.IDebugService);
            await (0, debugUtils_1.saveAllBeforeDebugStart)(accessor.get(configuration_1.IConfigurationService), accessor.get(editorService_1.IEditorService));
            const { launch, name, getConfig } = debugService.getConfigurationManager().selectedConfiguration;
            const config = await getConfig();
            const configOrName = config ? Object.assign((0, objects_1.deepClone)(config), debugStartOptions === null || debugStartOptions === void 0 ? void 0 : debugStartOptions.config) : name;
            await debugService.startDebugging(launch, configOrName, { noDebug: debugStartOptions === null || debugStartOptions === void 0 ? void 0 : debugStartOptions.noDebug, startedByUser: true }, false);
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.DEBUG_RUN_COMMAND_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 63 /* KeyCode.F5 */,
        mac: { primary: 256 /* KeyMod.WinCtrl */ | 63 /* KeyCode.F5 */ },
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, debug_1.CONTEXT_DEBUG_STATE.notEqualsTo((0, debug_1.getStateLabel)(1 /* State.Initializing */))),
        handler: async (accessor) => {
            const commandService = accessor.get(commands_1.ICommandService);
            await commandService.executeCommand(exports.DEBUG_START_COMMAND_ID, { noDebug: true });
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.toggleBreakpoint',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 5,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_BREAKPOINTS_FOCUSED, contextkeys_1.InputFocusedContext.toNegated()),
        primary: 10 /* KeyCode.Space */,
        handler: (accessor) => {
            const listService = accessor.get(listService_1.IListService);
            const debugService = accessor.get(debug_1.IDebugService);
            const list = listService.lastFocusedList;
            if (list instanceof listWidget_1.List) {
                const focused = list.getFocusedElements();
                if (focused && focused.length) {
                    debugService.enableOrDisableBreakpoints(!focused[0].enabled, focused[0]);
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.enableOrDisableBreakpoint',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: undefined,
        when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
        handler: (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const control = editorService.activeTextEditorControl;
            if ((0, editorBrowser_1.isCodeEditor)(control)) {
                const model = control.getModel();
                if (model) {
                    const position = control.getPosition();
                    if (position) {
                        const bps = debugService.getModel().getBreakpoints({ uri: model.uri, lineNumber: position.lineNumber });
                        if (bps.length) {
                            debugService.enableOrDisableBreakpoints(!bps[0].enabled, bps[0]);
                        }
                    }
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.EDIT_EXPRESSION_COMMAND_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 5,
        when: debug_1.CONTEXT_WATCH_EXPRESSIONS_FOCUSED,
        primary: 60 /* KeyCode.F2 */,
        mac: { primary: 3 /* KeyCode.Enter */ },
        handler: (accessor, expression) => {
            const debugService = accessor.get(debug_1.IDebugService);
            if (!(expression instanceof debugModel_1.Expression)) {
                const listService = accessor.get(listService_1.IListService);
                const focused = listService.lastFocusedList;
                if (focused) {
                    const elements = focused.getFocus();
                    if (Array.isArray(elements) && elements[0] instanceof debugModel_1.Expression) {
                        expression = elements[0];
                    }
                }
            }
            if (expression instanceof debugModel_1.Expression) {
                debugService.getViewModel().setSelectedExpression(expression, false);
            }
        }
    });
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SET_EXPRESSION_COMMAND_ID,
        handler: async (accessor, expression) => {
            const debugService = accessor.get(debug_1.IDebugService);
            if (expression instanceof debugModel_1.Expression || expression instanceof debugModel_1.Variable) {
                debugService.getViewModel().setSelectedExpression(expression, true);
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.setVariable',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */ + 5,
        when: debug_1.CONTEXT_VARIABLES_FOCUSED,
        primary: 60 /* KeyCode.F2 */,
        mac: { primary: 3 /* KeyCode.Enter */ },
        handler: (accessor) => {
            const listService = accessor.get(listService_1.IListService);
            const debugService = accessor.get(debug_1.IDebugService);
            const focused = listService.lastFocusedList;
            if (focused) {
                const elements = focused.getFocus();
                if (Array.isArray(elements) && elements[0] instanceof debugModel_1.Variable) {
                    debugService.getViewModel().setSelectedExpression(elements[0], false);
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.REMOVE_EXPRESSION_COMMAND_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_WATCH_EXPRESSIONS_FOCUSED, debug_1.CONTEXT_EXPRESSION_SELECTED.toNegated()),
        primary: 20 /* KeyCode.Delete */,
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */ },
        handler: (accessor, expression) => {
            const debugService = accessor.get(debug_1.IDebugService);
            if (expression instanceof debugModel_1.Expression) {
                debugService.removeWatchExpressions(expression.getId());
                return;
            }
            const listService = accessor.get(listService_1.IListService);
            const focused = listService.lastFocusedList;
            if (focused) {
                let elements = focused.getFocus();
                if (Array.isArray(elements) && elements[0] instanceof debugModel_1.Expression) {
                    const selection = focused.getSelection();
                    if (selection && selection.indexOf(elements[0]) >= 0) {
                        elements = selection;
                    }
                    elements.forEach((e) => debugService.removeWatchExpressions(e.getId()));
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.removeBreakpoint',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_BREAKPOINTS_FOCUSED, debug_1.CONTEXT_BREAKPOINT_INPUT_FOCUSED.toNegated()),
        primary: 20 /* KeyCode.Delete */,
        mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 1 /* KeyCode.Backspace */ },
        handler: (accessor) => {
            const listService = accessor.get(listService_1.IListService);
            const debugService = accessor.get(debug_1.IDebugService);
            const list = listService.lastFocusedList;
            if (list instanceof listWidget_1.List) {
                const focused = list.getFocusedElements();
                const element = focused.length ? focused[0] : undefined;
                if (element instanceof debugModel_1.Breakpoint) {
                    debugService.removeBreakpoints(element.getId());
                }
                else if (element instanceof debugModel_1.FunctionBreakpoint) {
                    debugService.removeFunctionBreakpoints(element.getId());
                }
                else if (element instanceof debugModel_1.DataBreakpoint) {
                    debugService.removeDataBreakpoints(element.getId());
                }
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.installAdditionalDebuggers',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: undefined,
        primary: undefined,
        handler: async (accessor, query) => {
            var _a;
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            const viewlet = (_a = (await paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true))) === null || _a === void 0 ? void 0 : _a.getViewPaneContainer();
            let searchFor = `@category:debuggers`;
            if (typeof query === 'string') {
                searchFor += ` ${query}`;
            }
            viewlet.search(searchFor);
            viewlet.focus();
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: exports.ADD_CONFIGURATION_ID,
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: undefined,
        primary: undefined,
        handler: async (accessor, launchUri) => {
            var _a;
            const manager = accessor.get(debug_1.IDebugService).getConfigurationManager();
            const launch = manager.getLaunches().find(l => l.uri.toString() === launchUri) || manager.selectedConfiguration.launch;
            if (launch) {
                const { editor, created } = await launch.openConfigFile(false);
                if (editor && !created) {
                    const codeEditor = editor.getControl();
                    if (codeEditor) {
                        await ((_a = codeEditor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID)) === null || _a === void 0 ? void 0 : _a.addLaunchConfiguration());
                    }
                }
            }
        }
    });
    const inlineBreakpointHandler = (accessor) => {
        const debugService = accessor.get(debug_1.IDebugService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const control = editorService.activeTextEditorControl;
        if ((0, editorBrowser_1.isCodeEditor)(control)) {
            const position = control.getPosition();
            if (position && control.hasModel() && debugService.canSetBreakpointsIn(control.getModel())) {
                const modelUri = control.getModel().uri;
                const breakpointAlreadySet = debugService.getModel().getBreakpoints({ lineNumber: position.lineNumber, uri: modelUri })
                    .some(bp => (bp.sessionAgnosticData.column === position.column || (!bp.column && position.column <= 1)));
                if (!breakpointAlreadySet) {
                    debugService.addBreakpoints(modelUri, [{ lineNumber: position.lineNumber, column: position.column > 1 ? position.column : undefined }]);
                }
            }
        }
    };
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        primary: 1024 /* KeyMod.Shift */ | 67 /* KeyCode.F9 */,
        when: editorContextKeys_1.EditorContextKeys.editorTextFocus,
        id: exports.TOGGLE_INLINE_BREAKPOINT_ID,
        handler: inlineBreakpointHandler
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.EditorContext, {
        command: {
            id: exports.TOGGLE_INLINE_BREAKPOINT_ID,
            title: nls.localize('addInlineBreakpoint', "Add Inline Breakpoint"),
            category: { value: nls.localize('debug', "Debug"), original: 'Debug' }
        },
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, contextkeys_2.PanelFocusContext.toNegated(), editorContextKeys_1.EditorContextKeys.editorTextFocus),
        group: 'debug',
        order: 1
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.openBreakpointToSide',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: debug_1.CONTEXT_BREAKPOINTS_FOCUSED,
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        secondary: [512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */],
        handler: (accessor) => {
            const listService = accessor.get(listService_1.IListService);
            const list = listService.lastFocusedList;
            if (list instanceof listWidget_1.List) {
                const focus = list.getFocusedElements();
                if (focus.length && focus[0] instanceof debugModel_1.Breakpoint) {
                    return (0, breakpointsView_1.openBreakpointSource)(focus[0], true, false, true, accessor.get(debug_1.IDebugService), accessor.get(editorService_1.IEditorService));
                }
            }
            return undefined;
        }
    });
    // When there are no debug extensions, open the debug viewlet when F5 is pressed so the user can read the limitations
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'debug.openView',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE.toNegated(),
        primary: 63 /* KeyCode.F5 */,
        secondary: [2048 /* KeyMod.CtrlCmd */ | 63 /* KeyCode.F5 */],
        handler: async (accessor) => {
            const paneCompositeService = accessor.get(panecomposite_1.IPaneCompositePartService);
            await paneCompositeService.openPaneComposite(debug_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true);
        }
    });
});
//# sourceMappingURL=debugCommands.js.map