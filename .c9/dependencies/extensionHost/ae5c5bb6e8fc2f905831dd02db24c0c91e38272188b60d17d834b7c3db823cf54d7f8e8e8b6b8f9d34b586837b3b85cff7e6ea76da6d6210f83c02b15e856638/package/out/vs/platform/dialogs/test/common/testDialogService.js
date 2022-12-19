/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestDialogService = void 0;
    class TestDialogService {
        constructor() {
            this.onWillShowDialog = event_1.Event.None;
            this.onDidShowDialog = event_1.Event.None;
            this.confirmResult = undefined;
        }
        setConfirmResult(result) {
            this.confirmResult = result;
        }
        async confirm(confirmation) {
            if (this.confirmResult) {
                const confirmResult = this.confirmResult;
                this.confirmResult = undefined;
                return confirmResult;
            }
            return { confirmed: false };
        }
        async show(severity, message, buttons, options) { return { choice: 0 }; }
        async input() { {
            return { choice: 0, values: [] };
        } }
        async about() { }
    }
    exports.TestDialogService = TestDialogService;
});
//# sourceMappingURL=testDialogService.js.map