/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/contextkey/common/contextkey"], function (require, exports, nls_1, contextkey_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MANAGE_TRUST_COMMAND_ID = exports.WorkspaceTrustContext = void 0;
    /**
     * Trust Context Keys
     */
    exports.WorkspaceTrustContext = {
        IsEnabled: new contextkey_1.RawContextKey('isWorkspaceTrustEnabled', false, (0, nls_1.localize)('workspaceTrustEnabledCtx', "Whether the workspace trust feature is enabled.")),
        IsTrusted: new contextkey_1.RawContextKey('isWorkspaceTrusted', false, (0, nls_1.localize)('workspaceTrustedCtx', "Whether the current workspace has been trusted by the user."))
    };
    exports.MANAGE_TRUST_COMMAND_ID = 'workbench.trust.manage';
});
//# sourceMappingURL=workspace.js.map