/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "assert", "vs/workbench/contrib/debug/common/debugViewModel", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/test/browser/mockDebug", "vs/platform/keybinding/test/common/mockKeybindingService", "vs/workbench/contrib/debug/common/debugSource"], function (require, exports, assert, debugViewModel_1, debugModel_1, mockDebug_1, mockKeybindingService_1, debugSource_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Debug - View Model', () => {
        let model;
        setup(() => {
            model = new debugViewModel_1.ViewModel(new mockKeybindingService_1.MockContextKeyService());
        });
        test('focused stack frame', () => {
            assert.strictEqual(model.focusedStackFrame, undefined);
            assert.strictEqual(model.focusedThread, undefined);
            const session = new mockDebug_1.MockSession();
            const thread = new debugModel_1.Thread(session, 'myThread', 1);
            const source = new debugSource_1.Source({
                name: 'internalModule.js',
                sourceReference: 11,
                presentationHint: 'deemphasize'
            }, 'aDebugSessionId', mockDebug_1.mockUriIdentityService);
            const frame = new debugModel_1.StackFrame(thread, 1, source, 'app.js', 'normal', { startColumn: 1, startLineNumber: 1, endColumn: 1, endLineNumber: 1 }, 0, true);
            model.setFocus(frame, thread, session, false);
            assert.strictEqual(model.focusedStackFrame.getId(), frame.getId());
            assert.strictEqual(model.focusedThread.threadId, 1);
            assert.strictEqual(model.focusedSession.getId(), session.getId());
        });
        test('selected expression', () => {
            var _a;
            assert.strictEqual(model.getSelectedExpression(), undefined);
            const expression = new debugModel_1.Expression('my expression');
            model.setSelectedExpression(expression, false);
            assert.strictEqual((_a = model.getSelectedExpression()) === null || _a === void 0 ? void 0 : _a.expression, expression);
        });
        test('multi session view and changed workbench state', () => {
            assert.strictEqual(model.isMultiSessionView(), false);
            model.setMultiSessionView(true);
            assert.strictEqual(model.isMultiSessionView(), true);
        });
    });
});
//# sourceMappingURL=debugViewModel.test.js.map