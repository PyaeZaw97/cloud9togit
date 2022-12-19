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
define(["require", "exports", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/workbench/services/environment/electron-sandbox/environmentService", "vs/platform/product/common/productService", "vs/platform/ipc/electron-sandbox/services", "vs/platform/telemetry/common/telemetryIpc", "vs/platform/storage/common/storage", "vs/workbench/services/telemetry/electron-sandbox/workbenchCommonProperties", "vs/platform/telemetry/common/telemetryService", "vs/platform/instantiation/common/extensions", "vs/platform/files/common/files"], function (require, exports, telemetry_1, telemetryUtils_1, configuration_1, lifecycle_1, environmentService_1, productService_1, services_1, telemetryIpc_1, storage_1, workbenchCommonProperties_1, telemetryService_1, extensions_1, files_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryService = void 0;
    let TelemetryService = class TelemetryService extends lifecycle_1.Disposable {
        constructor(environmentService, productService, sharedProcessService, storageService, configurationService, fileService) {
            super();
            if ((0, telemetryUtils_1.supportsTelemetry)(productService, environmentService)) {
                const channel = sharedProcessService.getChannel('telemetryAppender');
                const config = {
                    appenders: [new telemetryIpc_1.TelemetryAppenderClient(channel)],
                    commonProperties: (0, workbenchCommonProperties_1.resolveWorkbenchCommonProperties)(storageService, fileService, environmentService.os.release, environmentService.os.hostname, productService.commit, productService.version, environmentService.machineId, productService.msftInternalDomains, environmentService.installSourcePath, environmentService.remoteAuthority),
                    piiPaths: (0, telemetryUtils_1.getPiiPathsFromEnvironment)(environmentService),
                    sendErrorTelemetry: true
                };
                this.impl = this._register(new telemetryService_1.TelemetryService(config, configurationService, productService));
            }
            else {
                this.impl = telemetryUtils_1.NullTelemetryService;
            }
            this.sendErrorTelemetry = this.impl.sendErrorTelemetry;
        }
        setExperimentProperty(name, value) {
            return this.impl.setExperimentProperty(name, value);
        }
        get telemetryLevel() {
            return this.impl.telemetryLevel;
        }
        publicLog(eventName, data, anonymizeFilePaths) {
            return this.impl.publicLog(eventName, data, anonymizeFilePaths);
        }
        publicLog2(eventName, data, anonymizeFilePaths) {
            return this.publicLog(eventName, data, anonymizeFilePaths);
        }
        publicLogError(errorEventName, data) {
            return this.impl.publicLogError(errorEventName, data);
        }
        publicLogError2(eventName, data) {
            return this.publicLog(eventName, data);
        }
        getTelemetryInfo() {
            return this.impl.getTelemetryInfo();
        }
    };
    TelemetryService = __decorate([
        __param(0, environmentService_1.INativeWorkbenchEnvironmentService),
        __param(1, productService_1.IProductService),
        __param(2, services_1.ISharedProcessService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, files_1.IFileService)
    ], TelemetryService);
    exports.TelemetryService = TelemetryService;
    (0, extensions_1.registerSingleton)(telemetry_1.ITelemetryService, TelemetryService);
});
//# sourceMappingURL=telemetryService.js.map