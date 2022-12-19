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
define(["require", "exports", "vs/nls", "vs/workbench/contrib/terminal/browser/terminal", "vs/base/common/event", "vs/base/common/network", "vs/workbench/contrib/terminal/browser/terminalStatusList"], function (require, exports, nls_1, terminal_1, event_1, network_1, terminalStatusList_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalDecorationsProvider = void 0;
    let TerminalDecorationsProvider = class TerminalDecorationsProvider {
        constructor(_terminalService) {
            this._terminalService = _terminalService;
            this.label = (0, nls_1.localize)('label', "Terminal");
            this._onDidChange = new event_1.Emitter();
            this._terminalService.onDidChangeInstancePrimaryStatus(e => this._onDidChange.fire([e.resource]));
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        provideDecorations(resource) {
            var _a;
            if (resource.scheme !== network_1.Schemas.vscodeTerminal) {
                return undefined;
            }
            const instance = this._terminalService.getInstanceFromResource(resource);
            if (!instance) {
                return undefined;
            }
            const primaryStatus = (_a = instance === null || instance === void 0 ? void 0 : instance.statusList) === null || _a === void 0 ? void 0 : _a.primary;
            if (!(primaryStatus === null || primaryStatus === void 0 ? void 0 : primaryStatus.icon)) {
                return undefined;
            }
            return {
                color: (0, terminalStatusList_1.getColorForSeverity)(primaryStatus.severity),
                letter: primaryStatus.icon,
                tooltip: primaryStatus.tooltip
            };
        }
        dispose() {
            this.dispose();
        }
    };
    TerminalDecorationsProvider = __decorate([
        __param(0, terminal_1.ITerminalService)
    ], TerminalDecorationsProvider);
    exports.TerminalDecorationsProvider = TerminalDecorationsProvider;
});
//# sourceMappingURL=terminalDecorationsProvider.js.map