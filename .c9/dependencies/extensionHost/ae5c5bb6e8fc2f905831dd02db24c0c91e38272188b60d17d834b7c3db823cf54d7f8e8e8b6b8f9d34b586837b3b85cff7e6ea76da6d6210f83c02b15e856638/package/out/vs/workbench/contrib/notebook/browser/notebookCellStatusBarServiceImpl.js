/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle"], function (require, exports, errors_1, event_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebookCellStatusBarService = void 0;
    class NotebookCellStatusBarService extends lifecycle_1.Disposable {
        constructor() {
            super(...arguments);
            this._onDidChangeProviders = this._register(new event_1.Emitter());
            this.onDidChangeProviders = this._onDidChangeProviders.event;
            this._onDidChangeItems = this._register(new event_1.Emitter());
            this.onDidChangeItems = this._onDidChangeItems.event;
            this._providers = [];
        }
        registerCellStatusBarItemProvider(provider) {
            this._providers.push(provider);
            let changeListener;
            if (provider.onDidChangeStatusBarItems) {
                changeListener = provider.onDidChangeStatusBarItems(() => this._onDidChangeItems.fire());
            }
            this._onDidChangeProviders.fire();
            return (0, lifecycle_1.toDisposable)(() => {
                changeListener === null || changeListener === void 0 ? void 0 : changeListener.dispose();
                const idx = this._providers.findIndex(p => p === provider);
                this._providers.splice(idx, 1);
            });
        }
        async getStatusBarItemsForCell(docUri, cellIndex, viewType, token) {
            const providers = this._providers.filter(p => p.viewType === viewType || p.viewType === '*');
            return await Promise.all(providers.map(async (p) => {
                var _a;
                try {
                    return (_a = await p.provideCellStatusBarItems(docUri, cellIndex, token)) !== null && _a !== void 0 ? _a : { items: [] };
                }
                catch (e) {
                    (0, errors_1.onUnexpectedExternalError)(e);
                    return { items: [] };
                }
            }));
        }
    }
    exports.NotebookCellStatusBarService = NotebookCellStatusBarService;
});
//# sourceMappingURL=notebookCellStatusBarServiceImpl.js.map