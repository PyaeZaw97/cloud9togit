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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/memento", "vs/platform/telemetry/common/telemetry", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/extensions", "vs/platform/configuration/common/configuration", "vs/platform/product/common/productService", "vs/platform/assignment/common/assignmentService"], function (require, exports, instantiation_1, memento_1, telemetry_1, storage_1, extensions_1, configuration_1, productService_1, assignmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchAssignmentService = exports.IWorkbenchAssignmentService = void 0;
    exports.IWorkbenchAssignmentService = (0, instantiation_1.createDecorator)('WorkbenchAssignmentService');
    class MementoKeyValueStorage {
        constructor(memento) {
            this.memento = memento;
            this.mementoObj = memento.getMemento(0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
        async getValue(key, defaultValue) {
            const value = await this.mementoObj[key];
            return value || defaultValue;
        }
        setValue(key, value) {
            this.mementoObj[key] = value;
            this.memento.saveMemento();
        }
    }
    class WorkbenchAssignmentServiceTelemetry {
        constructor(telemetryService, productService) {
            this.telemetryService = telemetryService;
            this.productService = productService;
        }
        get assignmentContext() {
            var _a;
            return (_a = this._lastAssignmentContext) === null || _a === void 0 ? void 0 : _a.split(';');
        }
        // __GDPR__COMMON__ "VSCode.ABExp.Features" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        // __GDPR__COMMON__ "abexp.assignmentcontext" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
        setSharedProperty(name, value) {
            var _a;
            if (name === ((_a = this.productService.tasConfig) === null || _a === void 0 ? void 0 : _a.assignmentContextTelemetryPropertyName)) {
                this._lastAssignmentContext = value;
            }
            this.telemetryService.setExperimentProperty(name, value);
        }
        postEvent(eventName, props) {
            const data = {};
            for (const [key, value] of props.entries()) {
                data[key] = value;
            }
            /* __GDPR__
                "query-expfeature" : {
                    "ABExp.queriedFeature": { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                }
            */
            this.telemetryService.publicLog(eventName, data);
        }
    }
    let WorkbenchAssignmentService = class WorkbenchAssignmentService extends assignmentService_1.BaseAssignmentService {
        constructor(telemetryService, storageService, configurationService, productService) {
            super(() => {
                return telemetryService.getTelemetryInfo().then(telemetryInfo => {
                    return telemetryInfo.machineId;
                });
            }, configurationService, productService, new WorkbenchAssignmentServiceTelemetry(telemetryService, productService), new MementoKeyValueStorage(new memento_1.Memento('experiment.service.memento', storageService)));
            this.telemetryService = telemetryService;
        }
        get experimentsEnabled() {
            return this.configurationService.getValue('workbench.enableExperiments') === true;
        }
        async getTreatment(name) {
            const result = await super.getTreatment(name);
            this.telemetryService.publicLog2('tasClientReadTreatmentComplete', { treatmentName: name, treatmentValue: JSON.stringify(result) });
            return result;
        }
        async getCurrentExperiments() {
            var _a;
            if (!this.tasClient) {
                return undefined;
            }
            if (!this.experimentsEnabled) {
                return undefined;
            }
            await this.tasClient;
            return (_a = this.telemetry) === null || _a === void 0 ? void 0 : _a.assignmentContext;
        }
    };
    WorkbenchAssignmentService = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, storage_1.IStorageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, productService_1.IProductService)
    ], WorkbenchAssignmentService);
    exports.WorkbenchAssignmentService = WorkbenchAssignmentService;
    (0, extensions_1.registerSingleton)(exports.IWorkbenchAssignmentService, WorkbenchAssignmentService, false);
});
//# sourceMappingURL=assignmentService.js.map