/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/editor/browser/editorExtensions", "vs/platform/contextkey/common/contextkey", "vs/base/common/cancellation", "vs/base/common/linkedList", "vs/platform/instantiation/common/instantiation", "vs/platform/instantiation/common/extensions", "vs/nls"], function (require, exports, editorExtensions_1, contextkey_1, cancellation_1, linkedList_1, instantiation_1, extensions_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorKeybindingCancellationTokenSource = void 0;
    const IEditorCancellationTokens = (0, instantiation_1.createDecorator)('IEditorCancelService');
    const ctxCancellableOperation = new contextkey_1.RawContextKey('cancellableOperation', false, (0, nls_1.localize)('cancellableOperation', 'Whether the editor runs a cancellable operation, e.g. like \'Peek References\''));
    (0, extensions_1.registerSingleton)(IEditorCancellationTokens, class {
        constructor() {
            this._tokens = new WeakMap();
        }
        add(editor, cts) {
            let data = this._tokens.get(editor);
            if (!data) {
                data = editor.invokeWithinContext(accessor => {
                    const key = ctxCancellableOperation.bindTo(accessor.get(contextkey_1.IContextKeyService));
                    const tokens = new linkedList_1.LinkedList();
                    return { key, tokens };
                });
                this._tokens.set(editor, data);
            }
            let removeFn;
            data.key.set(true);
            removeFn = data.tokens.push(cts);
            return () => {
                // remove w/o cancellation
                if (removeFn) {
                    removeFn();
                    data.key.set(!data.tokens.isEmpty());
                    removeFn = undefined;
                }
            };
        }
        cancel(editor) {
            const data = this._tokens.get(editor);
            if (!data) {
                return;
            }
            // remove with cancellation
            const cts = data.tokens.pop();
            if (cts) {
                cts.cancel();
                data.key.set(!data.tokens.isEmpty());
            }
        }
    }, true);
    class EditorKeybindingCancellationTokenSource extends cancellation_1.CancellationTokenSource {
        constructor(editor, parent) {
            super(parent);
            this.editor = editor;
            this._unregister = editor.invokeWithinContext(accessor => accessor.get(IEditorCancellationTokens).add(editor, this));
        }
        dispose() {
            this._unregister();
            super.dispose();
        }
    }
    exports.EditorKeybindingCancellationTokenSource = EditorKeybindingCancellationTokenSource;
    (0, editorExtensions_1.registerEditorCommand)(new class extends editorExtensions_1.EditorCommand {
        constructor() {
            super({
                id: 'editor.cancelOperation',
                kbOpts: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 9 /* KeyCode.Escape */
                },
                precondition: ctxCancellableOperation
            });
        }
        runEditorCommand(accessor, editor) {
            accessor.get(IEditorCancellationTokens).cancel(editor);
        }
    });
});
//# sourceMappingURL=keybindingCancellation.js.map