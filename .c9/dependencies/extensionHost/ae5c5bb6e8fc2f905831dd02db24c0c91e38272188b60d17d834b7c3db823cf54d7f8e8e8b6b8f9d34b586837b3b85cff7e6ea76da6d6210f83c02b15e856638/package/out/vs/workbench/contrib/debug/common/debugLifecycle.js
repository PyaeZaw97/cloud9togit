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
define(["require", "exports", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/dialogs/common/dialogs", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/lifecycle/common/lifecycle"], function (require, exports, nls, configuration_1, dialogs_1, debug_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DebugLifecycle = void 0;
    let DebugLifecycle = class DebugLifecycle {
        constructor(lifecycleService, debugService, configurationService, dialogService) {
            this.debugService = debugService;
            this.configurationService = configurationService;
            this.dialogService = dialogService;
            lifecycleService.onBeforeShutdown(async (e) => e.veto(this.shouldVetoShutdown(e.reason), 'veto.debug'));
        }
        shouldVetoShutdown(_reason) {
            const rootSessions = this.debugService.getModel().getSessions().filter(s => s.parentSession === undefined);
            if (rootSessions.length === 0) {
                return false;
            }
            const shouldConfirmOnExit = this.configurationService.getValue('debug').confirmOnExit;
            if (shouldConfirmOnExit === 'never') {
                return false;
            }
            return this.showWindowCloseConfirmation(rootSessions.length);
        }
        async showWindowCloseConfirmation(numSessions) {
            let message;
            if (numSessions === 1) {
                message = nls.localize('debug.debugSessionCloseConfirmationSingular', "There is an active debug session, are you sure you want to stop it?");
            }
            else {
                message = nls.localize('debug.debugSessionCloseConfirmationPlural', "There are active debug sessions, are you sure you want to stop them?");
            }
            const res = await this.dialogService.confirm({
                message,
                type: 'warning',
                primaryButton: nls.localize('debug.stop', "Stop Debugging")
            });
            return !res.confirmed;
        }
    };
    DebugLifecycle = __decorate([
        __param(0, lifecycle_1.ILifecycleService),
        __param(1, debug_1.IDebugService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, dialogs_1.IDialogService)
    ], DebugLifecycle);
    exports.DebugLifecycle = DebugLifecycle;
});
//# sourceMappingURL=debugLifecycle.js.map