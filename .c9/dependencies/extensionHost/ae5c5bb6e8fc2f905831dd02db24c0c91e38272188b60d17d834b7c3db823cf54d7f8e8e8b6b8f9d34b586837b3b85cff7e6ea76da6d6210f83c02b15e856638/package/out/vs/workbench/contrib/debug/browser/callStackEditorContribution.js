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
define(["require", "exports", "vs/editor/common/core/range", "vs/editor/common/model", "vs/workbench/contrib/debug/common/debug", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/nls", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/contrib/debug/browser/debugIcons", "vs/platform/log/common/log"], function (require, exports, range_1, model_1, debug_1, themeService_1, colorRegistry_1, nls_1, event_1, lifecycle_1, arrays_1, uriIdentity_1, debugIcons_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallStackEditorContribution = exports.createDecorationsForStackFrame = exports.focusedStackFrameColor = exports.topStackFrameColor = void 0;
    exports.topStackFrameColor = (0, colorRegistry_1.registerColor)('editor.stackFrameHighlightBackground', { dark: '#ffff0033', light: '#ffff6673', hcDark: '#ffff0033', hcLight: '#ffff6673' }, (0, nls_1.localize)('topStackFrameLineHighlight', 'Background color for the highlight of line at the top stack frame position.'));
    exports.focusedStackFrameColor = (0, colorRegistry_1.registerColor)('editor.focusedStackFrameHighlightBackground', { dark: '#7abd7a4d', light: '#cee7ce73', hcDark: '#7abd7a4d', hcLight: '#cee7ce73' }, (0, nls_1.localize)('focusedStackFrameLineHighlight', 'Background color for the highlight of line at focused stack frame position.'));
    const stickiness = 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */;
    // we need a separate decoration for glyph margin, since we do not want it on each line of a multi line statement.
    const TOP_STACK_FRAME_MARGIN = {
        description: 'top-stack-frame-margin',
        glyphMarginClassName: themeService_1.ThemeIcon.asClassName(debugIcons_1.debugStackframe),
        stickiness,
        overviewRuler: {
            position: model_1.OverviewRulerLane.Full,
            color: (0, themeService_1.themeColorFromId)(exports.topStackFrameColor)
        }
    };
    const FOCUSED_STACK_FRAME_MARGIN = {
        description: 'focused-stack-frame-margin',
        glyphMarginClassName: themeService_1.ThemeIcon.asClassName(debugIcons_1.debugStackframeFocused),
        stickiness,
        overviewRuler: {
            position: model_1.OverviewRulerLane.Full,
            color: (0, themeService_1.themeColorFromId)(exports.focusedStackFrameColor)
        }
    };
    const TOP_STACK_FRAME_DECORATION = {
        description: 'top-stack-frame-decoration',
        isWholeLine: true,
        className: 'debug-top-stack-frame-line',
        stickiness
    };
    const FOCUSED_STACK_FRAME_DECORATION = {
        description: 'focused-stack-frame-decoration',
        isWholeLine: true,
        className: 'debug-focused-stack-frame-line',
        stickiness
    };
    function createDecorationsForStackFrame(stackFrame, isFocusedSession, noCharactersBefore) {
        // only show decorations for the currently focused thread.
        const result = [];
        const columnUntilEOLRange = new range_1.Range(stackFrame.range.startLineNumber, stackFrame.range.startColumn, stackFrame.range.startLineNumber, 1073741824 /* Constants.MAX_SAFE_SMALL_INTEGER */);
        const range = new range_1.Range(stackFrame.range.startLineNumber, stackFrame.range.startColumn, stackFrame.range.startLineNumber, stackFrame.range.startColumn + 1);
        // compute how to decorate the editor. Different decorations are used if this is a top stack frame, focused stack frame,
        // an exception or a stack frame that did not change the line number (we only decorate the columns, not the whole line).
        const topStackFrame = stackFrame.thread.getTopStackFrame();
        if (stackFrame.getId() === (topStackFrame === null || topStackFrame === void 0 ? void 0 : topStackFrame.getId())) {
            if (isFocusedSession) {
                result.push({
                    options: TOP_STACK_FRAME_MARGIN,
                    range
                });
            }
            result.push({
                options: TOP_STACK_FRAME_DECORATION,
                range: columnUntilEOLRange
            });
            if (stackFrame.range.startColumn > 1) {
                result.push({
                    options: {
                        description: 'top-stack-frame-inline-decoration',
                        before: {
                            content: '\uEB8B',
                            inlineClassName: noCharactersBefore ? 'debug-top-stack-frame-column start-of-line' : 'debug-top-stack-frame-column',
                            inlineClassNameAffectsLetterSpacing: true
                        },
                    },
                    range: columnUntilEOLRange
                });
            }
        }
        else {
            if (isFocusedSession) {
                result.push({
                    options: FOCUSED_STACK_FRAME_MARGIN,
                    range
                });
            }
            result.push({
                options: FOCUSED_STACK_FRAME_DECORATION,
                range: columnUntilEOLRange
            });
        }
        return result;
    }
    exports.createDecorationsForStackFrame = createDecorationsForStackFrame;
    let CallStackEditorContribution = class CallStackEditorContribution {
        constructor(editor, debugService, uriIdentityService, logService) {
            this.editor = editor;
            this.debugService = debugService;
            this.uriIdentityService = uriIdentityService;
            this.logService = logService;
            this.toDispose = [];
            this.decorationIds = [];
            const setDecorations = () => this.decorationIds = this.editor.deltaDecorations(this.decorationIds, this.createCallStackDecorations());
            this.toDispose.push(event_1.Event.any(this.debugService.getViewModel().onDidFocusStackFrame, this.debugService.getModel().onDidChangeCallStack)(() => {
                setDecorations();
            }));
            this.toDispose.push(this.editor.onDidChangeModel(e => {
                if (e.newModelUrl) {
                    setDecorations();
                }
            }));
        }
        createCallStackDecorations() {
            const editor = this.editor;
            if (!editor.hasModel()) {
                return [];
            }
            const focusedStackFrame = this.debugService.getViewModel().focusedStackFrame;
            const decorations = [];
            this.debugService.getModel().getSessions().forEach(s => {
                const isSessionFocused = s === (focusedStackFrame === null || focusedStackFrame === void 0 ? void 0 : focusedStackFrame.thread.session);
                s.getAllThreads().forEach(t => {
                    if (t.stopped) {
                        const callStack = t.getCallStack();
                        const stackFrames = [];
                        if (callStack.length > 0) {
                            // Always decorate top stack frame, and decorate focused stack frame if it is not the top stack frame
                            if (focusedStackFrame && !focusedStackFrame.equals(callStack[0])) {
                                stackFrames.push(focusedStackFrame);
                            }
                            stackFrames.push(callStack[0]);
                        }
                        stackFrames.forEach(candidateStackFrame => {
                            var _a, _b;
                            if (candidateStackFrame && this.uriIdentityService.extUri.isEqual(candidateStackFrame.source.uri, (_a = editor.getModel()) === null || _a === void 0 ? void 0 : _a.uri)) {
                                if (candidateStackFrame.range.startLineNumber > ((_b = editor.getModel()) === null || _b === void 0 ? void 0 : _b.getLineCount()) || candidateStackFrame.range.startLineNumber < 1) {
                                    this.logService.warn(`CallStackEditorContribution: invalid stack frame line number: ${candidateStackFrame.range.startLineNumber}`);
                                    return;
                                }
                                const noCharactersBefore = editor.getModel().getLineFirstNonWhitespaceColumn(candidateStackFrame.range.startLineNumber) >= candidateStackFrame.range.startColumn;
                                decorations.push(...createDecorationsForStackFrame(candidateStackFrame, isSessionFocused, noCharactersBefore));
                            }
                        });
                    }
                });
            });
            // Deduplicate same decorations so colors do not stack #109045
            return (0, arrays_1.distinct)(decorations, d => `${d.options.className} ${d.options.glyphMarginClassName} ${d.range.startLineNumber} ${d.range.startColumn}`);
        }
        dispose() {
            this.editor.deltaDecorations(this.decorationIds, []);
            this.toDispose = (0, lifecycle_1.dispose)(this.toDispose);
        }
    };
    CallStackEditorContribution = __decorate([
        __param(1, debug_1.IDebugService),
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, log_1.ILogService)
    ], CallStackEditorContribution);
    exports.CallStackEditorContribution = CallStackEditorContribution;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const topStackFrame = theme.getColor(exports.topStackFrameColor);
        if (topStackFrame) {
            collector.addRule(`.monaco-editor .view-overlays .debug-top-stack-frame-line { background: ${topStackFrame}; }`);
        }
        const focusedStackFrame = theme.getColor(exports.focusedStackFrameColor);
        if (focusedStackFrame) {
            collector.addRule(`.monaco-editor .view-overlays .debug-focused-stack-frame-line { background: ${focusedStackFrame}; }`);
        }
    });
});
//# sourceMappingURL=callStackEditorContribution.js.map