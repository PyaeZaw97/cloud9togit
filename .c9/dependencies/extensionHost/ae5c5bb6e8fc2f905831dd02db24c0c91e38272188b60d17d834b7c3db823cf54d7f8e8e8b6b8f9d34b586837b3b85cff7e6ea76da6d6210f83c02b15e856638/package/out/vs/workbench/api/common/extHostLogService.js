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
define(["require", "exports", "vs/platform/log/common/log", "vs/workbench/api/common/extHostInitDataService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, log_1, extHostInitDataService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLogService = void 0;
    let ExtHostLogService = class ExtHostLogService extends log_1.LogService {
        constructor(loggerService, initData) {
            super(loggerService.createLogger(initData.logFile, { name: extensions_1.ExtensionHostLogFileName }));
        }
    };
    ExtHostLogService = __decorate([
        __param(0, log_1.ILoggerService),
        __param(1, extHostInitDataService_1.IExtHostInitDataService)
    ], ExtHostLogService);
    exports.ExtHostLogService = ExtHostLogService;
});
//# sourceMappingURL=extHostLogService.js.map