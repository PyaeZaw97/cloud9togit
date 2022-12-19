/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/keyCodes", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/browser/editorExtensions", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/debug/browser/breakpointsView", "vs/workbench/common/contextkeys", "vs/workbench/common/views", "vs/platform/contextview/browser/contextView", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/actions/common/actions", "vs/workbench/contrib/debug/common/disassemblyViewInput", "vs/platform/configuration/common/configuration"], function (require, exports, nls, keyCodes_1, range_1, editorContextKeys_1, editorExtensions_1, contextkey_1, debug_1, editorService_1, breakpointsView_1, contextkeys_1, views_1, contextView_1, actions_1, dom_1, uriIdentity_1, actions_2, disassemblyViewInput_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectionToWatchExpressionsAction = exports.SelectionToReplAction = exports.RunToCursorAction = void 0;
    class ToggleBreakpointAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.toggleBreakpoint',
                label: nls.localize('toggleBreakpointAction', "Debug: Toggle Breakpoint"),
                alias: 'Debug: Toggle Breakpoint',
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: 67 /* KeyCode.F9 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                menuOpts: {
                    when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                    title: nls.localize({ key: 'miToggleBreakpoint', comment: ['&& denotes a mnemonic'] }, "Toggle &&Breakpoint"),
                    menuId: actions_2.MenuId.MenubarDebugMenu,
                    group: '4_new_breakpoint',
                    order: 1
                }
            });
        }
        async run(accessor, editor) {
            // TODO: add disassembly F9
            if (editor.hasModel()) {
                const debugService = accessor.get(debug_1.IDebugService);
                const modelUri = editor.getModel().uri;
                const canSet = debugService.canSetBreakpointsIn(editor.getModel());
                // Does not account for multi line selections, Set to remove multiple cursor on the same line
                const lineNumbers = [...new Set(editor.getSelections().map(s => s.getPosition().lineNumber))];
                await Promise.all(lineNumbers.map(async (line) => {
                    const bps = debugService.getModel().getBreakpoints({ lineNumber: line, uri: modelUri });
                    if (bps.length) {
                        await Promise.all(bps.map(bp => debugService.removeBreakpoints(bp.getId())));
                    }
                    else if (canSet) {
                        await debugService.addBreakpoints(modelUri, [{ lineNumber: line }]);
                    }
                }));
            }
        }
    }
    class ConditionalBreakpointAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.conditionalBreakpoint',
                label: nls.localize('conditionalBreakpointEditorAction', "Debug: Add Conditional Breakpoint..."),
                alias: 'Debug: Add Conditional Breakpoint...',
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                menuOpts: {
                    menuId: actions_2.MenuId.MenubarNewBreakpointMenu,
                    title: nls.localize({ key: 'miConditionalBreakpoint', comment: ['&& denotes a mnemonic'] }, "&&Conditional Breakpoint..."),
                    group: '1_breakpoints',
                    order: 1,
                    when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
                }
            });
        }
        async run(accessor, editor) {
            var _a;
            const debugService = accessor.get(debug_1.IDebugService);
            const position = editor.getPosition();
            if (position && editor.hasModel() && debugService.canSetBreakpointsIn(editor.getModel())) {
                (_a = editor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID)) === null || _a === void 0 ? void 0 : _a.showBreakpointWidget(position.lineNumber, undefined, 0 /* BreakpointWidgetContext.CONDITION */);
            }
        }
    }
    class LogPointAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.addLogPoint',
                label: nls.localize('logPointEditorAction', "Debug: Add Logpoint..."),
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                alias: 'Debug: Add Logpoint...',
                menuOpts: [
                    {
                        menuId: actions_2.MenuId.MenubarNewBreakpointMenu,
                        title: nls.localize({ key: 'miLogPoint', comment: ['&& denotes a mnemonic'] }, "&&Logpoint..."),
                        group: '1_breakpoints',
                        order: 4,
                        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
                    }
                ]
            });
        }
        async run(accessor, editor) {
            var _a;
            const debugService = accessor.get(debug_1.IDebugService);
            const position = editor.getPosition();
            if (position && editor.hasModel() && debugService.canSetBreakpointsIn(editor.getModel())) {
                (_a = editor.getContribution(debug_1.BREAKPOINT_EDITOR_CONTRIBUTION_ID)) === null || _a === void 0 ? void 0 : _a.showBreakpointWidget(position.lineNumber, position.column, 2 /* BreakpointWidgetContext.LOG_MESSAGE */);
            }
        }
    }
    class OpenDisassemblyViewAction extends editorExtensions_1.EditorAction2 {
        constructor() {
            super({
                id: OpenDisassemblyViewAction.ID,
                title: {
                    value: nls.localize('openDisassemblyView', "Open Disassembly View"),
                    original: 'Open Disassembly View',
                    mnemonicTitle: nls.localize({ key: 'miDisassemblyView', comment: ['&& denotes a mnemonic'] }, "&&DisassemblyView")
                },
                precondition: debug_1.CONTEXT_FOCUSED_STACK_FRAME_HAS_INSTRUCTION_POINTER_REFERENCE,
                menu: [
                    {
                        id: actions_2.MenuId.EditorContext,
                        group: 'debug',
                        order: 5,
                        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, contextkeys_1.PanelFocusContext.toNegated(), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), editorContextKeys_1.EditorContextKeys.editorTextFocus, debug_1.CONTEXT_DISASSEMBLE_REQUEST_SUPPORTED, debug_1.CONTEXT_LANGUAGE_SUPPORTS_DISASSEMBLE_REQUEST)
                    },
                    {
                        id: actions_2.MenuId.DebugCallStackContext,
                        group: 'z_commands',
                        order: 50,
                        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('stackFrame'), debug_1.CONTEXT_DISASSEMBLE_REQUEST_SUPPORTED)
                    },
                    {
                        id: actions_2.MenuId.CommandPalette,
                        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), debug_1.CONTEXT_DISASSEMBLE_REQUEST_SUPPORTED)
                    }
                ]
            });
        }
        runEditorCommand(accessor, editor, ...args) {
            if (editor.hasModel()) {
                const editorService = accessor.get(editorService_1.IEditorService);
                editorService.openEditor(disassemblyViewInput_1.DisassemblyViewInput.instance, { pinned: true });
            }
        }
    }
    OpenDisassemblyViewAction.ID = 'editor.debug.action.openDisassemblyView';
    class ToggleDisassemblyViewSourceCodeAction extends actions_2.Action2 {
        constructor() {
            super({
                id: ToggleDisassemblyViewSourceCodeAction.ID,
                title: {
                    value: nls.localize('toggleDisassemblyViewSourceCode', "Toggle Source Code in Disassembly View"),
                    original: 'Toggle Source Code in Disassembly View',
                    mnemonicTitle: nls.localize({ key: 'mitogglesource', comment: ['&& denotes a mnemonic'] }, "&&ToggleSource")
                },
                f1: true,
            });
        }
        run(accessor, editor, ...args) {
            const configService = accessor.get(configuration_1.IConfigurationService);
            if (configService) {
                const value = configService.getValue('debug').disassemblyView.showSourceCode;
                configService.updateValue(ToggleDisassemblyViewSourceCodeAction.configID, !value);
            }
        }
    }
    ToggleDisassemblyViewSourceCodeAction.ID = 'debug.action.toggleDisassemblyViewSourceCode';
    ToggleDisassemblyViewSourceCodeAction.configID = 'debug.disassemblyView.showSourceCode';
    class RunToCursorAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: RunToCursorAction.ID,
                label: RunToCursorAction.LABEL,
                alias: 'Debug: Run to Cursor',
                precondition: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_IN_DEBUG_MODE, contextkeys_1.PanelFocusContext.toNegated(), debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                contextMenuOpts: {
                    group: 'debug',
                    order: 2
                }
            });
        }
        async run(accessor, editor) {
            const position = editor.getPosition();
            if (!(editor.hasModel() && position)) {
                return;
            }
            const uri = editor.getModel().uri;
            const debugService = accessor.get(debug_1.IDebugService);
            const viewModel = debugService.getViewModel();
            const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
            let column = undefined;
            const focusedStackFrame = viewModel.focusedStackFrame;
            if (focusedStackFrame && uriIdentityService.extUri.isEqual(focusedStackFrame.source.uri, uri) && focusedStackFrame.range.startLineNumber === position.lineNumber) {
                // If the cursor is on a line different than the one the debugger is currently paused on, then send the breakpoint on the line without a column
                // otherwise set it at the precise column #102199
                column = position.column;
            }
            await debugService.runTo(uri, position.lineNumber, column);
        }
    }
    exports.RunToCursorAction = RunToCursorAction;
    RunToCursorAction.ID = 'editor.debug.action.runToCursor';
    RunToCursorAction.LABEL = nls.localize('runToCursor', "Run to Cursor");
    class SelectionToReplAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: SelectionToReplAction.ID,
                label: SelectionToReplAction.LABEL,
                alias: 'Debug: Evaluate in Console',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasNonEmptySelection, debug_1.CONTEXT_IN_DEBUG_MODE, editorContextKeys_1.EditorContextKeys.editorTextFocus),
                contextMenuOpts: {
                    group: 'debug',
                    order: 0
                }
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const viewsService = accessor.get(views_1.IViewsService);
            const viewModel = debugService.getViewModel();
            const session = viewModel.focusedSession;
            if (!editor.hasModel() || !session) {
                return;
            }
            const text = editor.getModel().getValueInRange(editor.getSelection());
            await session.addReplExpression(viewModel.focusedStackFrame, text);
            await viewsService.openView(debug_1.REPL_VIEW_ID, false);
        }
    }
    exports.SelectionToReplAction = SelectionToReplAction;
    SelectionToReplAction.ID = 'editor.debug.action.selectionToRepl';
    SelectionToReplAction.LABEL = nls.localize('evaluateInDebugConsole', "Evaluate in Debug Console");
    class SelectionToWatchExpressionsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: SelectionToWatchExpressionsAction.ID,
                label: SelectionToWatchExpressionsAction.LABEL,
                alias: 'Debug: Add to Watch',
                precondition: contextkey_1.ContextKeyExpr.and(editorContextKeys_1.EditorContextKeys.hasNonEmptySelection, debug_1.CONTEXT_IN_DEBUG_MODE, editorContextKeys_1.EditorContextKeys.editorTextFocus),
                contextMenuOpts: {
                    group: 'debug',
                    order: 1
                }
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const viewsService = accessor.get(views_1.IViewsService);
            if (!editor.hasModel()) {
                return;
            }
            const text = editor.getModel().getValueInRange(editor.getSelection());
            await viewsService.openView(debug_1.WATCH_VIEW_ID);
            debugService.addWatchExpression(text);
        }
    }
    exports.SelectionToWatchExpressionsAction = SelectionToWatchExpressionsAction;
    SelectionToWatchExpressionsAction.ID = 'editor.debug.action.selectionToWatch';
    SelectionToWatchExpressionsAction.LABEL = nls.localize('addToWatch', "Add to Watch");
    class ShowDebugHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.showDebugHover',
                label: nls.localize('showDebugHover', "Debug: Show Hover"),
                alias: 'Debug: Show Hover',
                precondition: debug_1.CONTEXT_IN_DEBUG_MODE,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async run(accessor, editor) {
            var _a;
            const position = editor.getPosition();
            if (!position || !editor.hasModel()) {
                return;
            }
            const word = editor.getModel().getWordAtPosition(position);
            if (!word) {
                return;
            }
            const range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, word.endColumn);
            return (_a = editor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID)) === null || _a === void 0 ? void 0 : _a.showHover(range, true);
        }
    }
    class StepIntoTargetsAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: StepIntoTargetsAction.ID,
                label: StepIntoTargetsAction.LABEL,
                alias: 'Debug: Step Into Targets...',
                precondition: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_STEP_INTO_TARGETS_SUPPORTED, debug_1.CONTEXT_IN_DEBUG_MODE, debug_1.CONTEXT_DEBUG_STATE.isEqualTo('stopped'), editorContextKeys_1.EditorContextKeys.editorTextFocus),
                contextMenuOpts: {
                    group: 'debug',
                    order: 1.5
                }
            });
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const contextMenuService = accessor.get(contextView_1.IContextMenuService);
            const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
            const session = debugService.getViewModel().focusedSession;
            const frame = debugService.getViewModel().focusedStackFrame;
            if (session && frame && editor.hasModel() && uriIdentityService.extUri.isEqual(editor.getModel().uri, frame.source.uri)) {
                const targets = await session.stepInTargets(frame.frameId);
                if (!targets) {
                    return;
                }
                editor.revealLineInCenterIfOutsideViewport(frame.range.startLineNumber);
                const cursorCoords = editor.getScrolledVisiblePosition({ lineNumber: frame.range.startLineNumber, column: frame.range.startColumn });
                const editorCoords = (0, dom_1.getDomNodePagePosition)(editor.getDomNode());
                const x = editorCoords.left + cursorCoords.left;
                const y = editorCoords.top + cursorCoords.top + cursorCoords.height;
                contextMenuService.showContextMenu({
                    getAnchor: () => ({ x, y }),
                    getActions: () => {
                        return targets.map(t => new actions_1.Action(`stepIntoTarget:${t.id}`, t.label, undefined, true, () => session.stepIn(frame.thread.threadId, t.id)));
                    }
                });
            }
        }
    }
    StepIntoTargetsAction.ID = 'editor.debug.action.stepIntoTargets';
    StepIntoTargetsAction.LABEL = nls.localize({ key: 'stepIntoTargets', comment: ['Step Into Targets lets the user step into an exact function he or she is interested in.'] }, "Step Into Targets...");
    class GoToBreakpointAction extends editorExtensions_1.EditorAction {
        constructor(isNext, opts) {
            super(opts);
            this.isNext = isNext;
        }
        async run(accessor, editor) {
            const debugService = accessor.get(debug_1.IDebugService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
            if (editor.hasModel()) {
                const currentUri = editor.getModel().uri;
                const currentLine = editor.getPosition().lineNumber;
                //Breakpoints returned from `getBreakpoints` are already sorted.
                const allEnabledBreakpoints = debugService.getModel().getBreakpoints({ enabledOnly: true });
                //Try to find breakpoint in current file
                let moveBreakpoint = this.isNext
                    ? allEnabledBreakpoints.filter(bp => uriIdentityService.extUri.isEqual(bp.uri, currentUri) && bp.lineNumber > currentLine).shift()
                    : allEnabledBreakpoints.filter(bp => uriIdentityService.extUri.isEqual(bp.uri, currentUri) && bp.lineNumber < currentLine).pop();
                //Try to find breakpoints in following files
                if (!moveBreakpoint) {
                    moveBreakpoint =
                        this.isNext
                            ? allEnabledBreakpoints.filter(bp => bp.uri.toString() > currentUri.toString()).shift()
                            : allEnabledBreakpoints.filter(bp => bp.uri.toString() < currentUri.toString()).pop();
                }
                //Move to first or last possible breakpoint
                if (!moveBreakpoint && allEnabledBreakpoints.length) {
                    moveBreakpoint = this.isNext ? allEnabledBreakpoints[0] : allEnabledBreakpoints[allEnabledBreakpoints.length - 1];
                }
                if (moveBreakpoint) {
                    return (0, breakpointsView_1.openBreakpointSource)(moveBreakpoint, false, true, false, debugService, editorService);
                }
            }
        }
    }
    class GoToNextBreakpointAction extends GoToBreakpointAction {
        constructor() {
            super(true, {
                id: 'editor.debug.action.goToNextBreakpoint',
                label: nls.localize('goToNextBreakpoint', "Debug: Go to Next Breakpoint"),
                alias: 'Debug: Go to Next Breakpoint',
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
            });
        }
    }
    class GoToPreviousBreakpointAction extends GoToBreakpointAction {
        constructor() {
            super(false, {
                id: 'editor.debug.action.goToPreviousBreakpoint',
                label: nls.localize('goToPreviousBreakpoint', "Debug: Go to Previous Breakpoint"),
                alias: 'Debug: Go to Previous Breakpoint',
                precondition: debug_1.CONTEXT_DEBUGGERS_AVAILABLE
            });
        }
    }
    class CloseExceptionWidgetAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.debug.action.closeExceptionWidget',
                label: nls.localize('closeExceptionWidget', "Close Exception Widget"),
                alias: 'Close Exception Widget',
                precondition: debug_1.CONTEXT_EXCEPTION_WIDGET_VISIBLE,
                kbOpts: {
                    primary: 9 /* KeyCode.Escape */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async run(_accessor, editor) {
            const contribution = editor.getContribution(debug_1.EDITOR_CONTRIBUTION_ID);
            contribution === null || contribution === void 0 ? void 0 : contribution.closeExceptionWidget();
        }
    }
    (0, actions_2.registerAction2)(OpenDisassemblyViewAction);
    (0, actions_2.registerAction2)(ToggleDisassemblyViewSourceCodeAction);
    (0, editorExtensions_1.registerEditorAction)(ToggleBreakpointAction);
    (0, editorExtensions_1.registerEditorAction)(ConditionalBreakpointAction);
    (0, editorExtensions_1.registerEditorAction)(LogPointAction);
    (0, editorExtensions_1.registerEditorAction)(RunToCursorAction);
    (0, editorExtensions_1.registerEditorAction)(StepIntoTargetsAction);
    (0, editorExtensions_1.registerEditorAction)(SelectionToReplAction);
    (0, editorExtensions_1.registerEditorAction)(SelectionToWatchExpressionsAction);
    (0, editorExtensions_1.registerEditorAction)(ShowDebugHoverAction);
    (0, editorExtensions_1.registerEditorAction)(GoToNextBreakpointAction);
    (0, editorExtensions_1.registerEditorAction)(GoToPreviousBreakpointAction);
    (0, editorExtensions_1.registerEditorAction)(CloseExceptionWidgetAction);
});
//# sourceMappingURL=debugEditorActions.js.map