/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/arrays", "vs/platform/instantiation/common/instantiation", "vs/base/common/uri"], function (require, exports, extensionsRegistry, terminal_1, arrays_1, instantiation_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalContributionService = exports.ITerminalContributionService = exports.terminalsExtPoint = void 0;
    // terminal extension point
    exports.terminalsExtPoint = extensionsRegistry.ExtensionsRegistry.registerExtensionPoint(terminal_1.terminalContributionsDescriptor);
    exports.ITerminalContributionService = (0, instantiation_1.createDecorator)('terminalContributionsService');
    class TerminalContributionService {
        constructor() {
            this._terminalProfiles = [];
            exports.terminalsExtPoint.setHandler(contributions => {
                this._terminalProfiles = (0, arrays_1.flatten)(contributions.map(c => {
                    var _a, _b;
                    return ((_b = (_a = c.value) === null || _a === void 0 ? void 0 : _a.profiles) === null || _b === void 0 ? void 0 : _b.filter(p => hasValidTerminalIcon(p)).map(e => {
                        return Object.assign(Object.assign({}, e), { extensionIdentifier: c.description.identifier.value });
                    })) || [];
                }));
            });
        }
        get terminalProfiles() { return this._terminalProfiles; }
    }
    exports.TerminalContributionService = TerminalContributionService;
    function hasValidTerminalIcon(profile) {
        return !profile.icon ||
            (typeof profile.icon === 'string' ||
                uri_1.URI.isUri(profile.icon) ||
                ('light' in profile.icon && 'dark' in profile.icon &&
                    uri_1.URI.isUri(profile.icon.light) && uri_1.URI.isUri(profile.icon.dark)));
    }
});
//# sourceMappingURL=terminalExtensionPoints.js.map