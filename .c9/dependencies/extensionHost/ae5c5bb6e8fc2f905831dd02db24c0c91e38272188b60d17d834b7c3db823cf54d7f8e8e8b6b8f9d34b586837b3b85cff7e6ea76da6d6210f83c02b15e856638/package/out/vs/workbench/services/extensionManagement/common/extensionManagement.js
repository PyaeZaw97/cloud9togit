/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/extensionManagement/common/extensionManagement"], function (require, exports, instantiation_1, extensionManagement_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IWebExtensionsScannerService = exports.IWorkbenchExtensionEnablementService = exports.EnablementState = exports.IWorkbenchExtensionManagementService = exports.DefaultIconPath = exports.IExtensionManagementServerService = exports.ExtensionInstallLocation = void 0;
    var ExtensionInstallLocation;
    (function (ExtensionInstallLocation) {
        ExtensionInstallLocation[ExtensionInstallLocation["Local"] = 1] = "Local";
        ExtensionInstallLocation[ExtensionInstallLocation["Remote"] = 2] = "Remote";
        ExtensionInstallLocation[ExtensionInstallLocation["Web"] = 3] = "Web";
    })(ExtensionInstallLocation = exports.ExtensionInstallLocation || (exports.ExtensionInstallLocation = {}));
    exports.IExtensionManagementServerService = (0, instantiation_1.createDecorator)('extensionManagementServerService');
    exports.DefaultIconPath = './media/defaultIcon.png';
    exports.IWorkbenchExtensionManagementService = (0, instantiation_1.refineServiceDecorator)(extensionManagement_1.IExtensionManagementService);
    var EnablementState;
    (function (EnablementState) {
        EnablementState[EnablementState["DisabledByTrustRequirement"] = 0] = "DisabledByTrustRequirement";
        EnablementState[EnablementState["DisabledByExtensionKind"] = 1] = "DisabledByExtensionKind";
        EnablementState[EnablementState["DisabledByEnvironment"] = 2] = "DisabledByEnvironment";
        EnablementState[EnablementState["EnabledByEnvironment"] = 3] = "EnabledByEnvironment";
        EnablementState[EnablementState["DisabledByVirtualWorkspace"] = 4] = "DisabledByVirtualWorkspace";
        EnablementState[EnablementState["DisabledByExtensionDependency"] = 5] = "DisabledByExtensionDependency";
        EnablementState[EnablementState["DisabledGlobally"] = 6] = "DisabledGlobally";
        EnablementState[EnablementState["DisabledWorkspace"] = 7] = "DisabledWorkspace";
        EnablementState[EnablementState["EnabledGlobally"] = 8] = "EnabledGlobally";
        EnablementState[EnablementState["EnabledWorkspace"] = 9] = "EnabledWorkspace";
    })(EnablementState = exports.EnablementState || (exports.EnablementState = {}));
    exports.IWorkbenchExtensionEnablementService = (0, instantiation_1.createDecorator)('extensionEnablementService');
    exports.IWebExtensionsScannerService = (0, instantiation_1.createDecorator)('IWebExtensionsScannerService');
});
//# sourceMappingURL=extensionManagement.js.map