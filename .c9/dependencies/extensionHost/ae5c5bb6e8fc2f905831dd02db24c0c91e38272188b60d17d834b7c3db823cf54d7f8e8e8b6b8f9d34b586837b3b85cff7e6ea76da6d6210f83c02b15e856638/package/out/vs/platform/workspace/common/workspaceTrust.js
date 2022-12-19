/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation"], function (require, exports, nls_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWorkspaceTrustRequestService = exports.WorkspaceTrustUriResponse = exports.IWorkspaceTrustManagementService = exports.IWorkspaceTrustEnablementService = exports.workspaceTrustToString = exports.WorkspaceTrustScope = void 0;
    var WorkspaceTrustScope;
    (function (WorkspaceTrustScope) {
        WorkspaceTrustScope[WorkspaceTrustScope["Local"] = 0] = "Local";
        WorkspaceTrustScope[WorkspaceTrustScope["Remote"] = 1] = "Remote";
    })(WorkspaceTrustScope = exports.WorkspaceTrustScope || (exports.WorkspaceTrustScope = {}));
    function workspaceTrustToString(trustState) {
        if (trustState) {
            return (0, nls_1.localize)('trusted', "Trusted");
        }
        else {
            return (0, nls_1.localize)('untrusted', "Restricted Mode");
        }
    }
    exports.workspaceTrustToString = workspaceTrustToString;
    exports.IWorkspaceTrustEnablementService = (0, instantiation_1.createDecorator)('workspaceTrustEnablementService');
    exports.IWorkspaceTrustManagementService = (0, instantiation_1.createDecorator)('workspaceTrustManagementService');
    var WorkspaceTrustUriResponse;
    (function (WorkspaceTrustUriResponse) {
        WorkspaceTrustUriResponse[WorkspaceTrustUriResponse["Open"] = 1] = "Open";
        WorkspaceTrustUriResponse[WorkspaceTrustUriResponse["OpenInNewWindow"] = 2] = "OpenInNewWindow";
        WorkspaceTrustUriResponse[WorkspaceTrustUriResponse["Cancel"] = 3] = "Cancel";
    })(WorkspaceTrustUriResponse = exports.WorkspaceTrustUriResponse || (exports.WorkspaceTrustUriResponse = {}));
    exports.IWorkspaceTrustRequestService = (0, instantiation_1.createDecorator)('workspaceTrustRequestService');
});
//# sourceMappingURL=workspaceTrust.js.map