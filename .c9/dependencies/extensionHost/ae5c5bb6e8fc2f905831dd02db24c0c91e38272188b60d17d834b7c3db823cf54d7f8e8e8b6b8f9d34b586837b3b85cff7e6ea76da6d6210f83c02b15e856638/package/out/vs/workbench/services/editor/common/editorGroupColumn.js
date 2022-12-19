/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/editor/common/editorService"], function (require, exports, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.editorGroupToColumn = exports.columnToEditorGroup = void 0;
    function columnToEditorGroup(editorGroupService, column) {
        if (typeof column !== 'number' ||
            column === editorService_1.ACTIVE_GROUP ||
            (editorGroupService.count === 1 && editorGroupService.activeGroup.isEmpty)) {
            return editorService_1.ACTIVE_GROUP; // prefer active group when position is undefined or passed in as such or when no editor is opened
        }
        if (column === editorService_1.SIDE_GROUP) {
            return editorService_1.SIDE_GROUP; // return early for when column is to the side
        }
        const groupInColumn = editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)[column];
        if (groupInColumn) {
            return groupInColumn.id; // return group when a direct match is found in column
        }
        return editorService_1.SIDE_GROUP; // finally open to the side when group not found
    }
    exports.columnToEditorGroup = columnToEditorGroup;
    function editorGroupToColumn(editorGroupService, editorGroup) {
        const group = (typeof editorGroup === 'number') ? editorGroupService.getGroup(editorGroup) : editorGroup;
        return editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */).indexOf(group !== null && group !== void 0 ? group : editorGroupService.activeGroup);
    }
    exports.editorGroupToColumn = editorGroupToColumn;
});
//# sourceMappingURL=editorGroupColumn.js.map