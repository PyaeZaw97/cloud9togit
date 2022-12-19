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
define(["require", "exports", "vs/base/common/network", "vs/base/parts/ipc/node/ipc.cp", "vs/platform/configuration/common/configuration", "vs/platform/environment/common/environment", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryIpc", "vs/platform/telemetry/common/telemetryLogAppender", "vs/platform/telemetry/common/telemetryService"], function (require, exports, network_1, ipc_cp_1, configuration_1, environment_1, log_1, productService_1, telemetry_1, telemetryIpc_1, telemetryLogAppender_1, telemetryService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomEndpointTelemetryService = void 0;
    let CustomEndpointTelemetryService = class CustomEndpointTelemetryService {
        constructor(configurationService, telemetryService, loggerService, environmentService, productService) {
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.loggerService = loggerService;
            this.environmentService = environmentService;
            this.productService = productService;
            this.customTelemetryServices = new Map();
        }
        async getCustomTelemetryService(endpoint) {
            if (!this.customTelemetryServices.has(endpoint.id)) {
                const { machineId, sessionId } = await this.telemetryService.getTelemetryInfo();
                const telemetryInfo = Object.create(null);
                telemetryInfo['common.vscodemachineid'] = machineId;
                telemetryInfo['common.vscodesessionid'] = sessionId;
                const args = [endpoint.id, JSON.stringify(telemetryInfo), endpoint.aiKey];
                const client = new ipc_cp_1.Client(network_1.FileAccess.asFileUri('bootstrap-fork', require).fsPath, {
                    serverName: 'Debug Telemetry',
                    timeout: 1000 * 60 * 5,
                    args,
                    env: {
                        ELECTRON_RUN_AS_NODE: 1,
                        VSCODE_PIPE_LOGGING: 'true',
                        VSCODE_AMD_ENTRYPOINT: 'vs/workbench/contrib/debug/node/telemetryApp'
                    }
                });
                const channel = client.getChannel('telemetryAppender');
                const appenders = [
                    new telemetryIpc_1.TelemetryAppenderClient(channel),
                    new telemetryLogAppender_1.TelemetryLogAppender(this.loggerService, this.environmentService, `[${endpoint.id}] `),
                ];
                this.customTelemetryServices.set(endpoint.id, new telemetryService_1.TelemetryService({
                    appenders,
                    sendErrorTelemetry: endpoint.sendErrorTelemetry
                }, this.configurationService, this.productService));
            }
            return this.customTelemetryServices.get(endpoint.id);
        }
        async publicLog(telemetryEndpoint, eventName, data) {
            const customTelemetryService = await this.getCustomTelemetryService(telemetryEndpoint);
            await customTelemetryService.publicLog(eventName, data);
        }
        async publicLogError(telemetryEndpoint, errorEventName, data) {
            const customTelemetryService = await this.getCustomTelemetryService(telemetryEndpoint);
            await customTelemetryService.publicLogError(errorEventName, data);
        }
    };
    CustomEndpointTelemetryService = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, log_1.ILoggerService),
        __param(3, environment_1.IEnvironmentService),
        __param(4, productService_1.IProductService)
    ], CustomEndpointTelemetryService);
    exports.CustomEndpointTelemetryService = CustomEndpointTelemetryService;
});
//# sourceMappingURL=customEndpointTelemetryService.js.map