/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/actions", "vs/nls"], function (require, exports, actions_1, nls) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CollapseAllAction = void 0;
    class CollapseAllAction extends actions_1.Action {
        constructor(viewer, enabled) {
            super('vs.tree.collapse', nls.localize('collapse all', "Collapse All"), 'collapse-all', enabled);
            this.viewer = viewer;
        }
        async run() {
            this.viewer.collapseAll();
            this.viewer.setSelection([]);
            this.viewer.setFocus([]);
        }
    }
    exports.CollapseAllAction = CollapseAllAction;
});
//# sourceMappingURL=treeDefaults.js.map