/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/base/common/event"], function (require, exports, instantiation_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IExtHostTelemetry = exports.ExtHostTelemetry = void 0;
    class ExtHostTelemetry {
        constructor() {
            this._onDidChangeTelemetryEnabled = new event_1.Emitter();
            this.onDidChangeTelemetryEnabled = this._onDidChangeTelemetryEnabled.event;
            this._onDidChangeTelemetryConfiguration = new event_1.Emitter();
            this.onDidChangeTelemetryConfiguration = this._onDidChangeTelemetryConfiguration.event;
            this._productConfig = { usage: true, error: true };
            this._level = 0 /* TelemetryLevel.NONE */;
        }
        getTelemetryConfiguration() {
            return this._level === 3 /* TelemetryLevel.USAGE */;
        }
        getTelemetryDetails() {
            return {
                isCrashEnabled: this._level >= 1 /* TelemetryLevel.CRASH */,
                isErrorsEnabled: this._productConfig.error ? this._level >= 2 /* TelemetryLevel.ERROR */ : false,
                isUsageEnabled: this._productConfig.usage ? this._level >= 3 /* TelemetryLevel.USAGE */ : false
            };
        }
        $initializeTelemetryLevel(level, productConfig) {
            this._level = level;
            this._productConfig = productConfig || { usage: true, error: true };
        }
        $onDidChangeTelemetryLevel(level) {
            this._oldTelemetryEnablement = this.getTelemetryConfiguration();
            this._level = level;
            if (this._oldTelemetryEnablement !== this.getTelemetryConfiguration()) {
                this._onDidChangeTelemetryEnabled.fire(this.getTelemetryConfiguration());
            }
            this._onDidChangeTelemetryConfiguration.fire(this.getTelemetryDetails());
        }
    }
    exports.ExtHostTelemetry = ExtHostTelemetry;
    exports.IExtHostTelemetry = (0, instantiation_1.createDecorator)('IExtHostTelemetry');
});
//# sourceMappingURL=extHostTelemetry.js.map