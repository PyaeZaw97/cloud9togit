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
define(["require", "exports", "vs/workbench/services/extensions/common/extHostCustomers", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/platform/environment/common/environment"], function (require, exports, extHostCustomers_1, log_1, extHost_protocol_1, uri_1, commands_1, environment_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadLoggerService = void 0;
    let MainThreadLoggerService = class MainThreadLoggerService {
        constructor(extHostContext, logService, _loggerService) {
            this._loggerService = _loggerService;
            const proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostLogLevelServiceShape);
            this._logListener = logService.onDidChangeLogLevel(level => proxy.$setLevel(level));
        }
        $log(file, messages) {
            const logger = this._loggerService.getLogger(uri_1.URI.revive(file));
            if (!logger) {
                throw new Error('Create the logger before logging');
            }
            for (const [level, message] of messages) {
                (0, log_1.log)(logger, level, message);
            }
        }
        async $createLogger(file, options) {
            this._loggerService.createLogger(uri_1.URI.revive(file), options);
        }
        dispose() {
            this._logListener.dispose();
        }
    };
    MainThreadLoggerService = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadLogger),
        __param(1, log_1.ILogService),
        __param(2, log_1.ILoggerService)
    ], MainThreadLoggerService);
    exports.MainThreadLoggerService = MainThreadLoggerService;
    // --- Internal commands to improve extension test runs
    commands_1.CommandsRegistry.registerCommand('_extensionTests.setLogLevel', function (accessor, level) {
        const logService = accessor.get(log_1.ILogService);
        const environmentService = accessor.get(environment_1.IEnvironmentService);
        if (environmentService.isExtensionDevelopment && !!environmentService.extensionTestsLocationURI) {
            logService.setLevel(level);
        }
    });
    commands_1.CommandsRegistry.registerCommand('_extensionTests.getLogLevel', function (accessor) {
        const logService = accessor.get(log_1.ILogService);
        return logService.getLevel();
    });
});
//# sourceMappingURL=mainThreadLogService.js.map