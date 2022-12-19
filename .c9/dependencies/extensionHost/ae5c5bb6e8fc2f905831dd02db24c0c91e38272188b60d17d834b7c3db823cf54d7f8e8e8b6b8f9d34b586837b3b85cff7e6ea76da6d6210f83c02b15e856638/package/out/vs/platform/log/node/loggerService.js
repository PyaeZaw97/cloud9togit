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
define(["require", "exports", "vs/base/common/network", "vs/base/common/resources", "vs/base/common/uuid", "vs/platform/files/common/files", "vs/platform/log/common/fileLog", "vs/platform/log/common/log", "vs/platform/log/node/spdlogLog"], function (require, exports, network_1, resources_1, uuid_1, files_1, fileLog_1, log_1, spdlogLog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LoggerService = void 0;
    let LoggerService = class LoggerService extends log_1.AbstractLoggerService {
        constructor(logService, fileService) {
            super(logService.getLevel(), logService.onDidChangeLogLevel);
            this.fileService = fileService;
        }
        doCreateLogger(resource, logLevel, options) {
            var _a;
            if (resource.scheme === network_1.Schemas.file) {
                return new spdlogLog_1.SpdLogLogger((options === null || options === void 0 ? void 0 : options.name) || (0, uuid_1.generateUuid)(), resource.fsPath, !(options === null || options === void 0 ? void 0 : options.donotRotate), !!(options === null || options === void 0 ? void 0 : options.donotUseFormatters), logLevel);
            }
            else {
                return new fileLog_1.FileLogger((_a = options === null || options === void 0 ? void 0 : options.name) !== null && _a !== void 0 ? _a : (0, resources_1.basename)(resource), resource, logLevel, !!(options === null || options === void 0 ? void 0 : options.donotUseFormatters), this.fileService);
            }
        }
    };
    LoggerService = __decorate([
        __param(0, log_1.ILogService),
        __param(1, files_1.IFileService)
    ], LoggerService);
    exports.LoggerService = LoggerService;
});
//# sourceMappingURL=loggerService.js.map