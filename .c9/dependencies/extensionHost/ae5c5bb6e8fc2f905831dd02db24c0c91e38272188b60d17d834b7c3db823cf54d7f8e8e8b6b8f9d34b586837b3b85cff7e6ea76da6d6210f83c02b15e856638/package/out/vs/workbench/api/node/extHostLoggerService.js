/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/api/common/extHostLoggerService", "vs/base/common/network", "vs/platform/log/node/spdlogLog", "vs/base/common/uuid"], function (require, exports, extHostLoggerService_1, network_1, spdlogLog_1, uuid_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtHostLoggerService = void 0;
    class ExtHostLoggerService extends extHostLoggerService_1.ExtHostLoggerService {
        doCreateLogger(resource, logLevel, options) {
            if (resource.scheme === network_1.Schemas.file) {
                /* Create the logger in the Extension Host process to prevent loggers (log, output channels...) traffic  over IPC */
                return new spdlogLog_1.SpdLogLogger((options === null || options === void 0 ? void 0 : options.name) || (0, uuid_1.generateUuid)(), resource.fsPath, !(options === null || options === void 0 ? void 0 : options.donotRotate), !!(options === null || options === void 0 ? void 0 : options.donotUseFormatters), logLevel);
            }
            return super.doCreateLogger(resource, logLevel, options);
        }
    }
    exports.ExtHostLoggerService = ExtHostLoggerService;
});
//# sourceMappingURL=extHostLoggerService.js.map