/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor"], function (require, exports, instantiation_1, editor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.preferredSideBySideGroupDirection = exports.isEditorGroup = exports.OpenEditorContext = exports.GroupsOrder = exports.isEditorReplacement = exports.MergeGroupMode = exports.GroupsArrangement = exports.GroupLocation = exports.GroupOrientation = exports.GroupDirection = exports.IEditorGroupsService = void 0;
    exports.IEditorGroupsService = (0, instantiation_1.createDecorator)('editorGroupsService');
    var GroupDirection;
    (function (GroupDirection) {
        GroupDirection[GroupDirection["UP"] = 0] = "UP";
        GroupDirection[GroupDirection["DOWN"] = 1] = "DOWN";
        GroupDirection[GroupDirection["LEFT"] = 2] = "LEFT";
        GroupDirection[GroupDirection["RIGHT"] = 3] = "RIGHT";
    })(GroupDirection = exports.GroupDirection || (exports.GroupDirection = {}));
    var GroupOrientation;
    (function (GroupOrientation) {
        GroupOrientation[GroupOrientation["HORIZONTAL"] = 0] = "HORIZONTAL";
        GroupOrientation[GroupOrientation["VERTICAL"] = 1] = "VERTICAL";
    })(GroupOrientation = exports.GroupOrientation || (exports.GroupOrientation = {}));
    var GroupLocation;
    (function (GroupLocation) {
        GroupLocation[GroupLocation["FIRST"] = 0] = "FIRST";
        GroupLocation[GroupLocation["LAST"] = 1] = "LAST";
        GroupLocation[GroupLocation["NEXT"] = 2] = "NEXT";
        GroupLocation[GroupLocation["PREVIOUS"] = 3] = "PREVIOUS";
    })(GroupLocation = exports.GroupLocation || (exports.GroupLocation = {}));
    var GroupsArrangement;
    (function (GroupsArrangement) {
        /**
         * Make the current active group consume the maximum
         * amount of space possible.
         */
        GroupsArrangement[GroupsArrangement["MINIMIZE_OTHERS"] = 0] = "MINIMIZE_OTHERS";
        /**
         * Size all groups evenly.
         */
        GroupsArrangement[GroupsArrangement["EVEN"] = 1] = "EVEN";
        /**
         * Will behave like MINIMIZE_OTHERS if the active
         * group is not already maximized and EVEN otherwise
         */
        GroupsArrangement[GroupsArrangement["TOGGLE"] = 2] = "TOGGLE";
    })(GroupsArrangement = exports.GroupsArrangement || (exports.GroupsArrangement = {}));
    var MergeGroupMode;
    (function (MergeGroupMode) {
        MergeGroupMode[MergeGroupMode["COPY_EDITORS"] = 0] = "COPY_EDITORS";
        MergeGroupMode[MergeGroupMode["MOVE_EDITORS"] = 1] = "MOVE_EDITORS";
    })(MergeGroupMode = exports.MergeGroupMode || (exports.MergeGroupMode = {}));
    function isEditorReplacement(replacement) {
        const candidate = replacement;
        return (0, editor_1.isEditorInput)(candidate === null || candidate === void 0 ? void 0 : candidate.editor) && (0, editor_1.isEditorInput)(candidate === null || candidate === void 0 ? void 0 : candidate.replacement);
    }
    exports.isEditorReplacement = isEditorReplacement;
    var GroupsOrder;
    (function (GroupsOrder) {
        /**
         * Groups sorted by creation order (oldest one first)
         */
        GroupsOrder[GroupsOrder["CREATION_TIME"] = 0] = "CREATION_TIME";
        /**
         * Groups sorted by most recent activity (most recent active first)
         */
        GroupsOrder[GroupsOrder["MOST_RECENTLY_ACTIVE"] = 1] = "MOST_RECENTLY_ACTIVE";
        /**
         * Groups sorted by grid widget order
         */
        GroupsOrder[GroupsOrder["GRID_APPEARANCE"] = 2] = "GRID_APPEARANCE";
    })(GroupsOrder = exports.GroupsOrder || (exports.GroupsOrder = {}));
    var OpenEditorContext;
    (function (OpenEditorContext) {
        OpenEditorContext[OpenEditorContext["NEW_EDITOR"] = 1] = "NEW_EDITOR";
        OpenEditorContext[OpenEditorContext["MOVE_EDITOR"] = 2] = "MOVE_EDITOR";
        OpenEditorContext[OpenEditorContext["COPY_EDITOR"] = 3] = "COPY_EDITOR";
    })(OpenEditorContext = exports.OpenEditorContext || (exports.OpenEditorContext = {}));
    function isEditorGroup(obj) {
        const group = obj;
        return !!group && typeof group.id === 'number' && Array.isArray(group.editors);
    }
    exports.isEditorGroup = isEditorGroup;
    //#region Editor Group Helpers
    function preferredSideBySideGroupDirection(configurationService) {
        const openSideBySideDirection = configurationService.getValue('workbench.editor.openSideBySideDirection');
        if (openSideBySideDirection === 'down') {
            return 1 /* GroupDirection.DOWN */;
        }
        return 3 /* GroupDirection.RIGHT */;
    }
    exports.preferredSideBySideGroupDirection = preferredSideBySideGroupDirection;
});
//#endregion
//# sourceMappingURL=editorGroupsService.js.map