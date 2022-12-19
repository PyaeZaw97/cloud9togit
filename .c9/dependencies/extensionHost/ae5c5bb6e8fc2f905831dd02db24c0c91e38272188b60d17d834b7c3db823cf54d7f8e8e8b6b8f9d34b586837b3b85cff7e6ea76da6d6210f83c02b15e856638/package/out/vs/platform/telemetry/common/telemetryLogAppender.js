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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, lifecycle_1, environment_1, log_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryLogAppender = void 0;
    let TelemetryLogAppender = class TelemetryLogAppender extends lifecycle_1.Disposable {
        constructor(loggerService, environmentService, prefix = '') {
            super();
            this.prefix = prefix;
            const logger = loggerService.getLogger(environmentService.telemetryLogResource);
            if (logger) {
                this.logger = this._register(logger);
            }
            else {
                this.logger = this._register(loggerService.createLogger(environmentService.telemetryLogResource));
                this.logger.info('The below are logs for every telemetry event sent from VS Code once the log level is set to trace.');
                this.logger.info('===========================================================');
            }
        }
        flush() {
            return Promise.resolve(undefined);
        }
        log(eventName, data) {
            this.logger.trace(`${this.prefix}telemetry/${eventName}`, (0, telemetryUtils_1.validateTelemetryData)(data));
        }
    };
    TelemetryLogAppender = __decorate([
        __param(0, log_1.ILoggerService),
        __param(1, environment_1.IEnvironmentService)
    ], TelemetryLogAppender);
    exports.TelemetryLogAppender = TelemetryLogAppender;
});
//# sourceMappingURL=telemetryLogAppender.js.map