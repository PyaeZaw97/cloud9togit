/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/event"], function (require, exports, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutlineViewState = exports.OutlineSortOrder = void 0;
    var OutlineSortOrder;
    (function (OutlineSortOrder) {
        OutlineSortOrder[OutlineSortOrder["ByPosition"] = 0] = "ByPosition";
        OutlineSortOrder[OutlineSortOrder["ByName"] = 1] = "ByName";
        OutlineSortOrder[OutlineSortOrder["ByKind"] = 2] = "ByKind";
    })(OutlineSortOrder = exports.OutlineSortOrder || (exports.OutlineSortOrder = {}));
    class OutlineViewState {
        constructor() {
            this._followCursor = false;
            this._filterOnType = true;
            this._sortBy = 0 /* OutlineSortOrder.ByPosition */;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        dispose() {
            this._onDidChange.dispose();
        }
        set followCursor(value) {
            if (value !== this._followCursor) {
                this._followCursor = value;
                this._onDidChange.fire({ followCursor: true });
            }
        }
        get followCursor() {
            return this._followCursor;
        }
        get filterOnType() {
            return this._filterOnType;
        }
        set filterOnType(value) {
            if (value !== this._filterOnType) {
                this._filterOnType = value;
                this._onDidChange.fire({ filterOnType: true });
            }
        }
        set sortBy(value) {
            if (value !== this._sortBy) {
                this._sortBy = value;
                this._onDidChange.fire({ sortBy: true });
            }
        }
        get sortBy() {
            return this._sortBy;
        }
        persist(storageService) {
            storageService.store('outline/state', JSON.stringify({
                followCursor: this.followCursor,
                sortBy: this.sortBy,
                filterOnType: this.filterOnType,
            }), 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
        }
        restore(storageService) {
            var _a;
            let raw = storageService.get('outline/state', 1 /* StorageScope.WORKSPACE */);
            if (!raw) {
                return;
            }
            let data;
            try {
                data = JSON.parse(raw);
            }
            catch (e) {
                return;
            }
            this.followCursor = data.followCursor;
            this.sortBy = (_a = data.sortBy) !== null && _a !== void 0 ? _a : 0 /* OutlineSortOrder.ByPosition */;
            if (typeof data.filterOnType === 'boolean') {
                this.filterOnType = data.filterOnType;
            }
        }
    }
    exports.OutlineViewState = OutlineViewState;
});
//# sourceMappingURL=outlineViewState.js.map