/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorGroupsService"], function (require, exports, instantiation_1, editorGroupsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isPreferredGroup = exports.SIDE_GROUP = exports.ACTIVE_GROUP = exports.IEditorService = void 0;
    exports.IEditorService = (0, instantiation_1.createDecorator)('editorService');
    /**
     * Open an editor in the currently active group.
     */
    exports.ACTIVE_GROUP = -1;
    /**
     * Open an editor to the side of the active group.
     */
    exports.SIDE_GROUP = -2;
    function isPreferredGroup(obj) {
        const candidate = obj;
        return typeof obj === 'number' || (0, editorGroupsService_1.isEditorGroup)(candidate);
    }
    exports.isPreferredGroup = isPreferredGroup;
});
//# sourceMappingURL=editorService.js.map