/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor/editorInput", "vs/nls"], function (require, exports, editorInput_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DisassemblyViewInput = void 0;
    class DisassemblyViewInput extends editorInput_1.EditorInput {
        constructor() {
            super(...arguments);
            this.resource = undefined;
        }
        get typeId() {
            return DisassemblyViewInput.ID;
        }
        static get instance() {
            if (!DisassemblyViewInput._instance || DisassemblyViewInput._instance.isDisposed()) {
                DisassemblyViewInput._instance = new DisassemblyViewInput();
            }
            return DisassemblyViewInput._instance;
        }
        getName() {
            return (0, nls_1.localize)('disassemblyInputName', "Disassembly");
        }
        matches(other) {
            return other instanceof DisassemblyViewInput;
        }
    }
    exports.DisassemblyViewInput = DisassemblyViewInput;
    DisassemblyViewInput.ID = 'debug.disassemblyView.input';
});
//# sourceMappingURL=disassemblyViewInput.js.map