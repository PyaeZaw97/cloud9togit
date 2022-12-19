/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/layout/browser/layoutService"], function (require, exports, instantiation_1, layoutService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.panelOpensMaximizedFromString = exports.panelOpensMaximizedSettingToString = exports.positionFromString = exports.positionToString = exports.PanelOpensMaximizedOptions = exports.Position = exports.Parts = exports.IWorkbenchLayoutService = void 0;
    exports.IWorkbenchLayoutService = (0, instantiation_1.refineServiceDecorator)(layoutService_1.ILayoutService);
    var Parts;
    (function (Parts) {
        Parts["TITLEBAR_PART"] = "workbench.parts.titlebar";
        Parts["BANNER_PART"] = "workbench.parts.banner";
        Parts["ACTIVITYBAR_PART"] = "workbench.parts.activitybar";
        Parts["SIDEBAR_PART"] = "workbench.parts.sidebar";
        Parts["PANEL_PART"] = "workbench.parts.panel";
        Parts["AUXILIARYBAR_PART"] = "workbench.parts.auxiliarybar";
        Parts["EDITOR_PART"] = "workbench.parts.editor";
        Parts["STATUSBAR_PART"] = "workbench.parts.statusbar";
    })(Parts = exports.Parts || (exports.Parts = {}));
    var Position;
    (function (Position) {
        Position[Position["LEFT"] = 0] = "LEFT";
        Position[Position["RIGHT"] = 1] = "RIGHT";
        Position[Position["BOTTOM"] = 2] = "BOTTOM";
    })(Position = exports.Position || (exports.Position = {}));
    var PanelOpensMaximizedOptions;
    (function (PanelOpensMaximizedOptions) {
        PanelOpensMaximizedOptions[PanelOpensMaximizedOptions["ALWAYS"] = 0] = "ALWAYS";
        PanelOpensMaximizedOptions[PanelOpensMaximizedOptions["NEVER"] = 1] = "NEVER";
        PanelOpensMaximizedOptions[PanelOpensMaximizedOptions["REMEMBER_LAST"] = 2] = "REMEMBER_LAST";
    })(PanelOpensMaximizedOptions = exports.PanelOpensMaximizedOptions || (exports.PanelOpensMaximizedOptions = {}));
    function positionToString(position) {
        switch (position) {
            case 0 /* Position.LEFT */: return 'left';
            case 1 /* Position.RIGHT */: return 'right';
            case 2 /* Position.BOTTOM */: return 'bottom';
            default: return 'bottom';
        }
    }
    exports.positionToString = positionToString;
    const positionsByString = {
        [positionToString(0 /* Position.LEFT */)]: 0 /* Position.LEFT */,
        [positionToString(1 /* Position.RIGHT */)]: 1 /* Position.RIGHT */,
        [positionToString(2 /* Position.BOTTOM */)]: 2 /* Position.BOTTOM */
    };
    function positionFromString(str) {
        return positionsByString[str];
    }
    exports.positionFromString = positionFromString;
    function panelOpensMaximizedSettingToString(setting) {
        switch (setting) {
            case 0 /* PanelOpensMaximizedOptions.ALWAYS */: return 'always';
            case 1 /* PanelOpensMaximizedOptions.NEVER */: return 'never';
            case 2 /* PanelOpensMaximizedOptions.REMEMBER_LAST */: return 'preserve';
            default: return 'preserve';
        }
    }
    exports.panelOpensMaximizedSettingToString = panelOpensMaximizedSettingToString;
    const panelOpensMaximizedByString = {
        [panelOpensMaximizedSettingToString(0 /* PanelOpensMaximizedOptions.ALWAYS */)]: 0 /* PanelOpensMaximizedOptions.ALWAYS */,
        [panelOpensMaximizedSettingToString(1 /* PanelOpensMaximizedOptions.NEVER */)]: 1 /* PanelOpensMaximizedOptions.NEVER */,
        [panelOpensMaximizedSettingToString(2 /* PanelOpensMaximizedOptions.REMEMBER_LAST */)]: 2 /* PanelOpensMaximizedOptions.REMEMBER_LAST */
    };
    function panelOpensMaximizedFromString(str) {
        return panelOpensMaximizedByString[str];
    }
    exports.panelOpensMaximizedFromString = panelOpensMaximizedFromString;
});
//# sourceMappingURL=layoutService.js.map