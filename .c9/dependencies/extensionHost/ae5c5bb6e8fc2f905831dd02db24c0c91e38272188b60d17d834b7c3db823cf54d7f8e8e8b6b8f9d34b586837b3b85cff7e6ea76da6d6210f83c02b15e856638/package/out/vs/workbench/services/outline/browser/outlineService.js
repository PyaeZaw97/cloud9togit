/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/linkedList", "vs/platform/instantiation/common/extensions", "vs/workbench/services/outline/browser/outline", "vs/base/common/event"], function (require, exports, lifecycle_1, linkedList_1, extensions_1, outline_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class OutlineService {
        constructor() {
            this._factories = new linkedList_1.LinkedList();
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        canCreateOutline(pane) {
            for (let factory of this._factories) {
                if (factory.matches(pane)) {
                    return true;
                }
            }
            return false;
        }
        async createOutline(pane, target, token) {
            for (let factory of this._factories) {
                if (factory.matches(pane)) {
                    return await factory.createOutline(pane, target, token);
                }
            }
            return undefined;
        }
        registerOutlineCreator(creator) {
            const rm = this._factories.push(creator);
            this._onDidChange.fire();
            return (0, lifecycle_1.toDisposable)(() => {
                rm();
                this._onDidChange.fire();
            });
        }
    }
    (0, extensions_1.registerSingleton)(outline_1.IOutlineService, OutlineService, true);
});
//# sourceMappingURL=outlineService.js.map