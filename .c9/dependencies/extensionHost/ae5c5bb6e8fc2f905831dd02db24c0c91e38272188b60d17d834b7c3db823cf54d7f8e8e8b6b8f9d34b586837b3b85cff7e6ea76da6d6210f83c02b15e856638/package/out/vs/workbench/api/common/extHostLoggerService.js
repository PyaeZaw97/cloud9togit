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
define(["require", "exports", "vs/platform/log/common/log", "vs/workbench/api/common/extHost.protocol", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/api/common/extHostRpcService", "vs/base/common/event"], function (require, exports, log_1, extHost_protocol_1, extHostInitDataService_1, extHostRpcService_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLoggerService = void 0;
    let ExtHostLoggerService = class ExtHostLoggerService extends log_1.AbstractLoggerService {
        constructor(rpc, initData) {
            const emitter = new event_1.Emitter();
            super(initData.logLevel, emitter.event);
            this._proxy = rpc.getProxy(extHost_protocol_1.MainContext.MainThreadLogger);
            this._onDidChangeLogLevel = this._register(emitter);
        }
        $setLevel(level) {
            this._onDidChangeLogLevel.fire(level);
        }
        doCreateLogger(resource, logLevel, options) {
            return new Logger(this._proxy, resource, logLevel, options);
        }
    };
    ExtHostLoggerService = __decorate([
        __param(0, extHostRpcService_1.IExtHostRpcService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService)
    ], ExtHostLoggerService);
    exports.ExtHostLoggerService = ExtHostLoggerService;
    class Logger extends log_1.AbstractMessageLogger {
        constructor(proxy, file, logLevel, loggerOptions) {
            super(loggerOptions === null || loggerOptions === void 0 ? void 0 : loggerOptions.always);
            this.proxy = proxy;
            this.file = file;
            this.isLoggerCreated = false;
            this.buffer = [];
            this.setLevel(logLevel);
            this.proxy.$createLogger(file, loggerOptions)
                .then(() => {
                this.doLog(this.buffer);
                this.isLoggerCreated = true;
            });
        }
        log(level, message) {
            const messages = [[level, message]];
            if (this.isLoggerCreated) {
                this.doLog(messages);
            }
            else {
                this.buffer.push(...messages);
            }
        }
        doLog(messages) {
            this.proxy.$log(this.file, messages);
        }
    }
});
//# sourceMappingURL=extHostLoggerService.js.map