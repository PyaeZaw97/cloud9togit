/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation"], function (require, exports, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryConfiguration = exports.TelemetryLevel = exports.TELEMETRY_OLD_SETTING_ID = exports.TELEMETRY_SETTING_ID = exports.TELEMETRY_SECTION_ID = exports.machineIdKey = exports.lastSessionDateStorageKey = exports.firstSessionDateStorageKey = exports.currentSessionDateStorageKey = exports.ICustomEndpointTelemetryService = exports.ITelemetryService = void 0;
    exports.ITelemetryService = (0, instantiation_1.createDecorator)('telemetryService');
    exports.ICustomEndpointTelemetryService = (0, instantiation_1.createDecorator)('customEndpointTelemetryService');
    // Keys
    exports.currentSessionDateStorageKey = 'telemetry.currentSessionDate';
    exports.firstSessionDateStorageKey = 'telemetry.firstSessionDate';
    exports.lastSessionDateStorageKey = 'telemetry.lastSessionDate';
    exports.machineIdKey = 'telemetry.machineId';
    // Configuration Keys
    exports.TELEMETRY_SECTION_ID = 'telemetry';
    exports.TELEMETRY_SETTING_ID = 'telemetry.telemetryLevel';
    exports.TELEMETRY_OLD_SETTING_ID = 'telemetry.enableTelemetry';
    var TelemetryLevel;
    (function (TelemetryLevel) {
        TelemetryLevel[TelemetryLevel["NONE"] = 0] = "NONE";
        TelemetryLevel[TelemetryLevel["CRASH"] = 1] = "CRASH";
        TelemetryLevel[TelemetryLevel["ERROR"] = 2] = "ERROR";
        TelemetryLevel[TelemetryLevel["USAGE"] = 3] = "USAGE";
    })(TelemetryLevel = exports.TelemetryLevel || (exports.TelemetryLevel = {}));
    var TelemetryConfiguration;
    (function (TelemetryConfiguration) {
        TelemetryConfiguration["OFF"] = "off";
        TelemetryConfiguration["CRASH"] = "crash";
        TelemetryConfiguration["ERROR"] = "error";
        TelemetryConfiguration["ON"] = "all";
    })(TelemetryConfiguration = exports.TelemetryConfiguration || (exports.TelemetryConfiguration = {}));
});
//# sourceMappingURL=telemetry.js.map