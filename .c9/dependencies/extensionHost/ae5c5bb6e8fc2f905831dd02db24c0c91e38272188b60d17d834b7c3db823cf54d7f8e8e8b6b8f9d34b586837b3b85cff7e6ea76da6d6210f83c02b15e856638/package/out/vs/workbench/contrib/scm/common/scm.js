/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ISCMViewService = exports.ISCMRepositorySortKey = exports.SCMInputChangeReason = exports.InputValidationType = exports.ISCMService = exports.REPOSITORIES_VIEW_PANE_ID = exports.VIEW_PANE_ID = exports.VIEWLET_ID = void 0;
    exports.VIEWLET_ID = 'workbench.view.scm';
    exports.VIEW_PANE_ID = 'workbench.scm';
    exports.REPOSITORIES_VIEW_PANE_ID = 'workbench.scm.repositories';
    exports.ISCMService = (0, instantiation_1.createDecorator)('scm');
    var InputValidationType;
    (function (InputValidationType) {
        InputValidationType[InputValidationType["Error"] = 0] = "Error";
        InputValidationType[InputValidationType["Warning"] = 1] = "Warning";
        InputValidationType[InputValidationType["Information"] = 2] = "Information";
    })(InputValidationType = exports.InputValidationType || (exports.InputValidationType = {}));
    var SCMInputChangeReason;
    (function (SCMInputChangeReason) {
        SCMInputChangeReason[SCMInputChangeReason["HistoryPrevious"] = 0] = "HistoryPrevious";
        SCMInputChangeReason[SCMInputChangeReason["HistoryNext"] = 1] = "HistoryNext";
    })(SCMInputChangeReason = exports.SCMInputChangeReason || (exports.SCMInputChangeReason = {}));
    var ISCMRepositorySortKey;
    (function (ISCMRepositorySortKey) {
        ISCMRepositorySortKey["DiscoveryTime"] = "discoveryTime";
        ISCMRepositorySortKey["Name"] = "name";
        ISCMRepositorySortKey["Path"] = "path";
    })(ISCMRepositorySortKey = exports.ISCMRepositorySortKey || (exports.ISCMRepositorySortKey = {}));
    exports.ISCMViewService = (0, instantiation_1.createDecorator)('scmView');
});
//# sourceMappingURL=scm.js.map