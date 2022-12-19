/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ShowTooltipCommand = exports.isStatusbarEntryLocation = exports.StatusbarAlignment = exports.IStatusbarService = void 0;
    exports.IStatusbarService = (0, instantiation_1.createDecorator)('statusbarService');
    var StatusbarAlignment;
    (function (StatusbarAlignment) {
        StatusbarAlignment[StatusbarAlignment["LEFT"] = 0] = "LEFT";
        StatusbarAlignment[StatusbarAlignment["RIGHT"] = 1] = "RIGHT";
    })(StatusbarAlignment = exports.StatusbarAlignment || (exports.StatusbarAlignment = {}));
    function isStatusbarEntryLocation(thing) {
        const candidate = thing;
        return typeof (candidate === null || candidate === void 0 ? void 0 : candidate.id) === 'string' && typeof candidate.alignment === 'number';
    }
    exports.isStatusbarEntryLocation = isStatusbarEntryLocation;
    exports.ShowTooltipCommand = {
        id: 'statusBar.entry.showTooltip',
        title: ''
    };
});
//# sourceMappingURL=statusbar.js.map