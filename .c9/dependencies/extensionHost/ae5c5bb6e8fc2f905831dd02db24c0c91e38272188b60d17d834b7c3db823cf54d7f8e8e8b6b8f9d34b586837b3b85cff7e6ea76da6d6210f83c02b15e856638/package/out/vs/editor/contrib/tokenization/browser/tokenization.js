/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/stopwatch", "vs/editor/browser/editorExtensions", "vs/nls"], function (require, exports, stopwatch_1, editorExtensions_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ForceRetokenizeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.forceRetokenize',
                label: nls.localize('forceRetokenize', "Developer: Force Retokenize"),
                alias: 'Developer: Force Retokenize',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            const model = editor.getModel();
            model.tokenization.resetTokenization();
            const sw = new stopwatch_1.StopWatch(true);
            model.tokenization.forceTokenization(model.getLineCount());
            sw.stop();
            console.log(`tokenization took ${sw.elapsed()}`);
        }
    }
    (0, editorExtensions_1.registerEditorAction)(ForceRetokenizeAction);
});
//# sourceMappingURL=tokenization.js.map