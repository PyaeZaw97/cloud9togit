/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OutlineConfigKeys = exports.OutlineTarget = exports.IOutlineService = void 0;
    exports.IOutlineService = (0, instantiation_1.createDecorator)('IOutlineService');
    var OutlineTarget;
    (function (OutlineTarget) {
        OutlineTarget[OutlineTarget["OutlinePane"] = 1] = "OutlinePane";
        OutlineTarget[OutlineTarget["Breadcrumbs"] = 2] = "Breadcrumbs";
        OutlineTarget[OutlineTarget["QuickPick"] = 4] = "QuickPick";
    })(OutlineTarget = exports.OutlineTarget || (exports.OutlineTarget = {}));
    var OutlineConfigKeys;
    (function (OutlineConfigKeys) {
        OutlineConfigKeys["icons"] = "outline.icons";
        OutlineConfigKeys["problemsEnabled"] = "outline.problems.enabled";
        OutlineConfigKeys["problemsColors"] = "outline.problems.colors";
        OutlineConfigKeys["problemsBadges"] = "outline.problems.badges";
    })(OutlineConfigKeys = exports.OutlineConfigKeys || (exports.OutlineConfigKeys = {}));
});
//# sourceMappingURL=outline.js.map