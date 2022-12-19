/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/lifecycle", "vs/editor/browser/coreCommands"], function (require, exports, async_1, lifecycle_1, coreCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GhostTextContext = exports.MockInlineCompletionsProvider = void 0;
    class MockInlineCompletionsProvider {
        constructor() {
            this.returnValue = [];
            this.delayMs = 0;
            this.callHistory = new Array();
            this.calledTwiceIn50Ms = false;
            this.lastTimeMs = undefined;
        }
        setReturnValue(value, delayMs = 0) {
            this.returnValue = value ? [value] : [];
            this.delayMs = delayMs;
        }
        setReturnValues(values, delayMs = 0) {
            this.returnValue = values;
            this.delayMs = delayMs;
        }
        getAndClearCallHistory() {
            const history = [...this.callHistory];
            this.callHistory = [];
            return history;
        }
        assertNotCalledTwiceWithin50ms() {
            if (this.calledTwiceIn50Ms) {
                throw new Error('provideInlineCompletions has been called at least twice within 50ms. This should not happen.');
            }
        }
        async provideInlineCompletions(model, position, context, token) {
            const currentTimeMs = new Date().getTime();
            if (this.lastTimeMs && currentTimeMs - this.lastTimeMs < 50) {
                this.calledTwiceIn50Ms = true;
            }
            this.lastTimeMs = currentTimeMs;
            this.callHistory.push({
                position: position.toString(),
                triggerKind: context.triggerKind,
                text: model.getValue()
            });
            const result = new Array();
            result.push(...this.returnValue);
            if (this.delayMs > 0) {
                await (0, async_1.timeout)(this.delayMs);
            }
            return { items: result };
        }
        freeInlineCompletions() { }
        handleItemDidShow() { }
    }
    exports.MockInlineCompletionsProvider = MockInlineCompletionsProvider;
    class GhostTextContext extends lifecycle_1.Disposable {
        constructor(model, editor) {
            super();
            this.model = model;
            this.editor = editor;
            this.prettyViewStates = new Array();
            this._register(model.onDidChange(() => {
                this.update();
            }));
            this.update();
        }
        get currentPrettyViewState() {
            return this._currentPrettyViewState;
        }
        update() {
            var _a;
            const ghostText = (_a = this.model) === null || _a === void 0 ? void 0 : _a.ghostText;
            let view;
            if (ghostText) {
                view = ghostText.render(this.editor.getValue(), true);
            }
            else {
                view = this.editor.getValue();
            }
            if (this._currentPrettyViewState !== view) {
                this.prettyViewStates.push(view);
            }
            this._currentPrettyViewState = view;
        }
        getAndClearViewStates() {
            const arr = [...this.prettyViewStates];
            this.prettyViewStates.length = 0;
            return arr;
        }
        keyboardType(text) {
            this.editor.trigger('keyboard', 'type', { text });
        }
        cursorUp() {
            coreCommands_1.CoreNavigationCommands.CursorUp.runEditorCommand(null, this.editor, null);
        }
        cursorRight() {
            coreCommands_1.CoreNavigationCommands.CursorRight.runEditorCommand(null, this.editor, null);
        }
        cursorLeft() {
            coreCommands_1.CoreNavigationCommands.CursorLeft.runEditorCommand(null, this.editor, null);
        }
        cursorDown() {
            coreCommands_1.CoreNavigationCommands.CursorDown.runEditorCommand(null, this.editor, null);
        }
        cursorLineEnd() {
            coreCommands_1.CoreNavigationCommands.CursorLineEnd.runEditorCommand(null, this.editor, null);
        }
        leftDelete() {
            coreCommands_1.CoreEditingCommands.DeleteLeft.runEditorCommand(null, this.editor, null);
        }
    }
    exports.GhostTextContext = GhostTextContext;
});
//# sourceMappingURL=utils.js.map