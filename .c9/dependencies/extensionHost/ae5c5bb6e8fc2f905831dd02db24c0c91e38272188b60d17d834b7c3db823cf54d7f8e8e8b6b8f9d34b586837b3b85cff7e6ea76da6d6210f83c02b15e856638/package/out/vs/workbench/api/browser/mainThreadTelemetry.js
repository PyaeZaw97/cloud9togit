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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/environment/common/environment", "vs/platform/product/common/productService", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/services/extensions/common/extHostCustomers", "../common/extHost.protocol"], function (require, exports, lifecycle_1, environment_1, productService_1, telemetry_1, telemetryUtils_1, extHostCustomers_1, extHost_protocol_1) {
    "use strict";
    var MainThreadTelemetry_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MainThreadTelemetry = void 0;
    let MainThreadTelemetry = MainThreadTelemetry_1 = class MainThreadTelemetry extends lifecycle_1.Disposable {
        constructor(extHostContext, _telemetryService, _environmentService, _productService) {
            super();
            this._telemetryService = _telemetryService;
            this._environmentService = _environmentService;
            this._productService = _productService;
            this._proxy = extHostContext.getProxy(extHost_protocol_1.ExtHostContext.ExtHostTelemetry);
            if ((0, telemetryUtils_1.supportsTelemetry)(this._productService, this._environmentService)) {
                this._register(_telemetryService.telemetryLevel.onDidChange(level => {
                    this._proxy.$onDidChangeTelemetryLevel(level);
                }));
            }
            this._proxy.$initializeTelemetryLevel(this.telemetryLevel, this._productService.enabledTelemetryLevels);
        }
        get telemetryLevel() {
            if (!(0, telemetryUtils_1.supportsTelemetry)(this._productService, this._environmentService)) {
                return 0 /* TelemetryLevel.NONE */;
            }
            return this._telemetryService.telemetryLevel.value;
        }
        $publicLog(eventName, data = Object.create(null)) {
            // __GDPR__COMMON__ "pluginHostTelemetry" : { "classification": "SystemMetaData", "purpose": "FeatureInsight", "isMeasurement": true }
            data[MainThreadTelemetry_1._name] = true;
            this._telemetryService.publicLog(eventName, data);
        }
        $publicLog2(eventName, data) {
            this.$publicLog(eventName, data);
        }
    };
    MainThreadTelemetry._name = 'pluginHostTelemetry';
    MainThreadTelemetry = MainThreadTelemetry_1 = __decorate([
        (0, extHostCustomers_1.extHostNamedCustomer)(extHost_protocol_1.MainContext.MainThreadTelemetry),
        __param(1, telemetry_1.ITelemetryService),
        __param(2, environment_1.IEnvironmentService),
        __param(3, productService_1.IProductService)
    ], MainThreadTelemetry);
    exports.MainThreadTelemetry = MainThreadTelemetry;
});
//# sourceMappingURL=mainThreadTelemetry.js.map