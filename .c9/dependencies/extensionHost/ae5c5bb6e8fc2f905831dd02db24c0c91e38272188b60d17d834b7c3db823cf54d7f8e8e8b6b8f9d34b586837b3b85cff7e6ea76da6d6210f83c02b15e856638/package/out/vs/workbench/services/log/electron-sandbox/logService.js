/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/log/common/log", "vs/platform/log/common/logIpc", "vs/base/common/lifecycle"], function (require, exports, log_1, logIpc_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NativeLogService = void 0;
    class NativeLogService extends log_1.LogService {
        constructor(name, logLevel, loggerService, loggerClient, environmentService) {
            const disposables = new lifecycle_1.DisposableStore();
            const loggers = [];
            // Always log to file
            loggers.push(disposables.add(loggerService.createLogger(environmentService.logFile, { name })));
            // Extension development test CLI: forward everything to main side
            if (environmentService.isExtensionDevelopment && !!environmentService.extensionTestsLocationURI) {
                loggers.push(loggerService.createConsoleMainLogger());
            }
            // Normal mode: Log to console
            else {
                loggers.push(disposables.add(new log_1.ConsoleLogger(logLevel)));
            }
            const multiplexLogger = disposables.add(new log_1.MultiplexLogService(loggers));
            const followerLogger = disposables.add(new logIpc_1.FollowerLogService(loggerClient, multiplexLogger));
            super(followerLogger);
            this._register(disposables);
        }
    }
    exports.NativeLogService = NativeLogService;
});
//# sourceMappingURL=logService.js.map