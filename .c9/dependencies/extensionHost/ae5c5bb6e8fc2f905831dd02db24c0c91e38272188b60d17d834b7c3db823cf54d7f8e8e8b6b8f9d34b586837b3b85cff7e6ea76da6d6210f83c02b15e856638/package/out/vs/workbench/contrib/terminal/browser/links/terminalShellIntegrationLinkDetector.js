/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/nls", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminalStrings"], function (require, exports, network_1, uri_1, nls_1, configuration_1, terminalStrings_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalShellIntegrationLinkDetector = void 0;
    // This is intentionally not localized currently as it must match the text in the shell script
    const linkText = 'Shell integration activated';
    const linkCodes = new Uint8Array(linkText.split('').map(e => e.charCodeAt(0)));
    let TerminalShellIntegrationLinkDetector = class TerminalShellIntegrationLinkDetector {
        constructor(xterm, _configurationService) {
            this.xterm = xterm;
            this._configurationService = _configurationService;
        }
        detect(lines, startLine, endLine) {
            if (this._matches(lines)) {
                return [{
                        text: linkText,
                        type: 4 /* TerminalBuiltinLinkType.Url */,
                        label: (0, nls_1.localize)('learn', 'Learn about shell integration'),
                        uri: uri_1.URI.from({
                            scheme: network_1.Schemas.https,
                            path: 'aka.ms/vscode-shell-integration'
                        }),
                        bufferRange: {
                            start: { x: 1, y: startLine + 1 },
                            end: { x: linkText.length % this.xterm.cols, y: startLine + Math.floor(linkText.length / this.xterm.cols) + 1 }
                        },
                        actions: [{
                                label: terminalStrings_1.terminalStrings.doNotShowAgain,
                                commandId: '',
                                run: () => this._hideMessage()
                            }]
                    }];
            }
            return [];
        }
        _matches(lines) {
            if (lines.length < linkCodes.length) {
                return false;
            }
            let cell;
            for (let i = 0; i < linkCodes.length; i++) {
                cell = lines[Math.floor(i / this.xterm.cols)].getCell(i % this.xterm.cols, cell);
                if ((cell === null || cell === void 0 ? void 0 : cell.getCode()) !== linkCodes[i]) {
                    return false;
                }
            }
            return true;
        }
        async _hideMessage() {
            await this._configurationService.updateValue("terminal.integrated.shellIntegration.showWelcome" /* TerminalSettingId.ShellIntegrationShowWelcome */, false);
        }
    };
    TerminalShellIntegrationLinkDetector.id = 'shellintegration';
    TerminalShellIntegrationLinkDetector = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], TerminalShellIntegrationLinkDetector);
    exports.TerminalShellIntegrationLinkDetector = TerminalShellIntegrationLinkDetector;
});
//# sourceMappingURL=terminalShellIntegrationLinkDetector.js.map