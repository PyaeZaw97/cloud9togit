/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, async_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DialogsModel = void 0;
    class DialogsModel extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this.dialogs = [];
            this._onWillShowDialog = this._register(new event_1.Emitter());
            this.onWillShowDialog = this._onWillShowDialog.event;
            this._onDidShowDialog = this._register(new event_1.Emitter());
            this.onDidShowDialog = this._onDidShowDialog.event;
        }
        show(dialog) {
            const promise = new async_1.DeferredPromise();
            const item = {
                args: dialog,
                close: result => {
                    this.dialogs.splice(0, 1);
                    promise.complete(result);
                    this._onDidShowDialog.fire();
                }
            };
            this.dialogs.push(item);
            this._onWillShowDialog.fire();
            return {
                item,
                result: promise.p
            };
        }
    }
    exports.DialogsModel = DialogsModel;
});
//# sourceMappingURL=dialogs.js.map