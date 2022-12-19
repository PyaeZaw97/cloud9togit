/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TreeviewsService = void 0;
    class TreeviewsService {
        constructor() {
            this._dragOperations = new Map();
            this._renderedElements = new Map();
        }
        removeDragOperationTransfer(uuid) {
            if ((uuid && this._dragOperations.has(uuid))) {
                const operation = this._dragOperations.get(uuid);
                this._dragOperations.delete(uuid);
                return operation;
            }
            return undefined;
        }
        addDragOperationTransfer(uuid, transferPromise) {
            this._dragOperations.set(uuid, transferPromise);
        }
        getRenderedTreeElement(node) {
            if (this._renderedElements.has(node)) {
                return this._renderedElements.get(node);
            }
            return undefined;
        }
        addRenderedTreeItemElement(node, element) {
            this._renderedElements.set(node, element);
        }
        removeRenderedTreeItemElement(node) {
            if (this._renderedElements.has(node)) {
                this._renderedElements.delete(node);
            }
        }
    }
    exports.TreeviewsService = TreeviewsService;
});
//# sourceMappingURL=treeViewsService.js.map