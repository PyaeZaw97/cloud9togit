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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/extensions", "vs/platform/log/common/log", "vs/platform/product/common/productService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryLogAppender", "vs/platform/telemetry/common/telemetryService", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/environment/browser/environmentService", "vs/workbench/services/remote/common/remoteAgentService", "vs/workbench/services/telemetry/browser/workbenchCommonProperties"], function (require, exports, lifecycle_1, configuration_1, extensions_1, log_1, productService_1, storage_1, telemetry_1, telemetryLogAppender_1, telemetryService_1, telemetryUtils_1, environmentService_1, remoteAgentService_1, workbenchCommonProperties_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryService = void 0;
    class WebAppInsightsAppender {
        constructor(_eventPrefix, aiKey) {
            this._eventPrefix = _eventPrefix;
            this._aiClientLoaded = false;
            this._telemetryCache = [];
            const endpointUrl = 'https://vortex.data.microsoft.com/collect/v1';
            new Promise((resolve_1, reject_1) => { require(['@microsoft/applicationinsights-web'], resolve_1, reject_1); }).then(aiLibrary => {
                this._aiClient = new aiLibrary.ApplicationInsights({
                    config: {
                        instrumentationKey: aiKey,
                        endpointUrl,
                        disableAjaxTracking: true,
                        disableExceptionTracking: true,
                        disableFetchTracking: true,
                        disableCorrelationHeaders: true,
                        disableCookiesUsage: true,
                        autoTrackPageVisitTime: false,
                        emitLineDelimitedJson: true,
                    },
                });
                this._aiClient.loadAppInsights();
                // Client is loaded we can now flush the cached events
                this._aiClientLoaded = true;
                this._telemetryCache.forEach(cacheEntry => this.log(cacheEntry.eventName, cacheEntry.data));
                this._telemetryCache = [];
                // If we cannot access the endpoint this most likely means it's being blocked
                // and we should not attempt to send any telemetry.
                fetch(endpointUrl).catch(() => (this._aiClient = undefined));
            }).catch(err => {
                console.error(err);
            });
        }
        /**
         * Logs a telemetry event with eventName and data
         * @param eventName The event name
         * @param data The data associated with the events
         */
        log(eventName, data) {
            if (!this._aiClient && this._aiClientLoaded) {
                return;
            }
            else if (!this._aiClient && !this._aiClientLoaded) {
                this._telemetryCache.push({ eventName, data });
                return;
            }
            data = (0, telemetryUtils_1.validateTelemetryData)(data);
            // Web does not expect properties and measurements so we must
            // spread them out. This is different from desktop which expects them
            data = Object.assign(Object.assign({}, data.properties), data.measurements);
            // undefined assertion is ok since above two if statements cover both cases
            this._aiClient.trackEvent({ name: this._eventPrefix + '/' + eventName }, data);
        }
        /**
         * Flushes all the telemetry data still in the buffer
         */
        flush() {
            if (this._aiClient) {
                this._aiClient.flush();
                this._aiClient = undefined;
            }
            return Promise.resolve(undefined);
        }
    }
    class WebTelemetryAppender {
        constructor(_appender) {
            this._appender = _appender;
        }
        log(eventName, data) {
            this._appender.log(eventName, data);
        }
        flush() {
            return this._appender.flush();
        }
    }
    let TelemetryService = class TelemetryService extends lifecycle_1.Disposable {
        constructor(environmentService, loggerService, configurationService, storageService, productService, remoteAgentService) {
            var _a, _b;
            super();
            this.sendErrorTelemetry = true;
            if ((0, telemetryUtils_1.supportsTelemetry)(productService, environmentService) && ((_a = productService.aiConfig) === null || _a === void 0 ? void 0 : _a.asimovKey)) {
                // If remote server is present send telemetry through that, else use the client side appender
                const telemetryProvider = remoteAgentService.getConnection() !== null ? { log: remoteAgentService.logTelemetry.bind(remoteAgentService), flush: remoteAgentService.flushTelemetry.bind(remoteAgentService) } : new WebAppInsightsAppender('monacoworkbench', (_b = productService.aiConfig) === null || _b === void 0 ? void 0 : _b.asimovKey);
                const config = {
                    appenders: [new WebTelemetryAppender(telemetryProvider), new telemetryLogAppender_1.TelemetryLogAppender(loggerService, environmentService)],
                    commonProperties: (0, workbenchCommonProperties_1.resolveWorkbenchCommonProperties)(storageService, productService.commit, productService.version, environmentService.remoteAuthority, productService.embedderIdentifier, productService.removeTelemetryMachineId, environmentService.options && environmentService.options.resolveCommonTelemetryProperties),
                    sendErrorTelemetry: this.sendErrorTelemetry,
                };
                this.impl = this._register(new telemetryService_1.TelemetryService(config, configurationService, productService));
            }
            else {
                this.impl = telemetryUtils_1.NullTelemetryService;
            }
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
            return this.impl.publicLog(errorEventName, data);
        }
        publicLogError2(eventName, data) {
            return this.publicLogError(eventName, data);
        }
        getTelemetryInfo() {
            return this.impl.getTelemetryInfo();
        }
    };
    TelemetryService = __decorate([
        __param(0, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(1, log_1.ILoggerService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, storage_1.IStorageService),
        __param(4, productService_1.IProductService),
        __param(5, remoteAgentService_1.IRemoteAgentService)
    ], TelemetryService);
    exports.TelemetryService = TelemetryService;
    (0, extensions_1.registerSingleton)(telemetry_1.ITelemetryService, TelemetryService);
});
//# sourceMappingURL=telemetryService.js.map