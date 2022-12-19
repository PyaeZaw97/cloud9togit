/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls"], function (require, exports, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getShellIntegrationTooltip = void 0;
    function getCapabilityName(capability) {
        switch (capability) {
            case 0 /* TerminalCapability.CwdDetection */:
            case 1 /* TerminalCapability.NaiveCwdDetection */:
                return (0, nls_1.localize)('capability.cwdDetection', "Current working directory detection");
            case 2 /* TerminalCapability.CommandDetection */:
                return (0, nls_1.localize)('capability.commandDetection', "Command detection");
            case 3 /* TerminalCapability.PartialCommandDetection */:
                return (0, nls_1.localize)('capability.partialCommandDetection', "Command detection (partial)");
        }
    }
    function getShellIntegrationTooltip(instance, markdown) {
        let shellIntegrationString = '';
        const shellIntegrationCapabilities = [];
        if (instance.capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
            shellIntegrationCapabilities.push(2 /* TerminalCapability.CommandDetection */);
        }
        if (instance.capabilities.has(0 /* TerminalCapability.CwdDetection */)) {
            shellIntegrationCapabilities.push(0 /* TerminalCapability.CwdDetection */);
        }
        if (shellIntegrationCapabilities.length > 0) {
            shellIntegrationString += `${markdown ? '\n\n---\n\n' : '\n\n'} ${(0, nls_1.localize)('shellIntegration.enabled', "Shell integration is enabled")}`;
            for (const capability of shellIntegrationCapabilities) {
                shellIntegrationString += `\n- ${getCapabilityName(capability)}`;
            }
        }
        return shellIntegrationString;
    }
    exports.getShellIntegrationTooltip = getShellIntegrationTooltip;
});
//# sourceMappingURL=terminalTooltip.js.map