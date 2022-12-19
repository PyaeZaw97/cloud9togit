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
define(["require", "exports", "vs/workbench/services/extensions/common/extHostCustomers", "vs/workbench/api/common/extHost.protocol", "vs/platform/environment/common/environment", "vs/base/common/console", "vs/workbench/services/extensions/common/remoteConsoleUtil", "vs/workbench/services/extensions/common/extensionDevOptions", "vs/platform/log/common/log"], function (require, exports, extHostCustomers_1, extHost_protocol_1, environment_1, console_1, remoteConsoleUtil_1, extensionDevOptions_1, log_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadConsole = void 0;
    let MainThreadConsole = class MainThreadConsole {
        constructor(_extHostContext, _environmentService, _logService) {
            this._environmentService = _environmentService;
            this._logService = _logService;
            const devOpts = (0, extensionDevOptions_1.parseExtensionDevOptions)(this._environmentService);
            this._isExtensionDevTestFromCli = devOpts.isExtensionDevTestFromCli;
        }
        dispose() {
            //
        }
        $logExtensionHostMessage(entry) {
            if (this._isExtensionDevTestFromCli) {
                // If running tests from cli, log to the log service everything
                (0, remoteConsoleUtil_1.logRemoteEntry)(this._logService, entry);
            }
            else {
                // Log to the log service only errors and log everything to local console
                (0, remoteConsoleUtil_1.logRemoteEntryIfError)(this._logService, entry, 'Extension Host');
                (0, console_1.log)(entry, 'Extension Host');
            }
        }
    };
    MainThreadConsole = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadConsole),
        __param(1, environment_1.IEnvironmentService),
        __param(2, log_1.ILogService)
    ], MainThreadConsole);
    exports.MainThreadConsole = MainThreadConsole;
});
//# sourceMappingURL=mainThreadConsole.js.map