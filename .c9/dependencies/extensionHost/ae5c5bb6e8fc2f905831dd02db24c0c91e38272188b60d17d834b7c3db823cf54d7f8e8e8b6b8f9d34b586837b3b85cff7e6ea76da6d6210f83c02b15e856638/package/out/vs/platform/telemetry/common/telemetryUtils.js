/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/objects", "vs/base/common/observableValue", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/platform/telemetry/common/telemetry"], function (require, exports, objects_1, observableValue_1, types_1, configuration_1, telemetry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getPiiPathsFromEnvironment = exports.cleanRemoteAuthority = exports.validateTelemetryData = exports.getTelemetryLevel = exports.supportsTelemetry = exports.configurationTelemetry = exports.NullAppender = exports.NullEndpointTelemetryService = exports.NullTelemetryService = exports.NullTelemetryServiceShape = void 0;
    class NullTelemetryServiceShape {
        constructor() {
            this.sendErrorTelemetry = false;
            this.telemetryLevel = (0, observableValue_1.staticObservableValue)(0 /* TelemetryLevel.NONE */);
        }
        publicLog(eventName, data) {
            return Promise.resolve(undefined);
        }
        publicLog2(eventName, data) {
            return this.publicLog(eventName, data);
        }
        publicLogError(eventName, data) {
            return Promise.resolve(undefined);
        }
        publicLogError2(eventName, data) {
            return this.publicLogError(eventName, data);
        }
        setExperimentProperty() { }
        getTelemetryInfo() {
            return Promise.resolve({
                instanceId: 'someValue.instanceId',
                sessionId: 'someValue.sessionId',
                machineId: 'someValue.machineId',
                firstSessionDate: 'someValue.firstSessionDate'
            });
        }
    }
    exports.NullTelemetryServiceShape = NullTelemetryServiceShape;
    exports.NullTelemetryService = new NullTelemetryServiceShape();
    class NullEndpointTelemetryService {
        async publicLog(_endpoint, _eventName, _data) {
            // noop
        }
        async publicLogError(_endpoint, _errorEventName, _data) {
            // noop
        }
    }
    exports.NullEndpointTelemetryService = NullEndpointTelemetryService;
    exports.NullAppender = { log: () => null, flush: () => Promise.resolve(null) };
    function configurationTelemetry(telemetryService, configurationService) {
        return configurationService.onDidChangeConfiguration(event => {
            if (event.source !== 6 /* ConfigurationTarget.DEFAULT */) {
                telemetryService.publicLog2('updateConfiguration', {
                    configurationSource: (0, configuration_1.ConfigurationTargetToString)(event.source),
                    configurationKeys: flattenKeys(event.sourceConfig)
                });
            }
        });
    }
    exports.configurationTelemetry = configurationTelemetry;
    /**
     * Determines whether or not we support logging telemetry.
     * This checks if the product is capable of collecting telemetry but not whether or not it can send it
     * For checking the user setting and what telemetry you can send please check `getTelemetryLevel`.
     * This returns true if `--disable-telemetry` wasn't used, the product.json allows for telemetry, and we're not testing an extension
     * If false telemetry is disabled throughout the product
     * @param productService
     * @param environmentService
     * @returns false - telemetry is completely disabled, true - telemetry is logged locally, but may not be sent
     */
    function supportsTelemetry(productService, environmentService) {
        return !(environmentService.disableTelemetry || !productService.enableTelemetry || environmentService.extensionTestsLocationURI);
    }
    exports.supportsTelemetry = supportsTelemetry;
    /**
     * Determines how telemetry is handled based on the user's configuration.
     *
     * @param configurationService
     * @returns OFF, ERROR, ON
     */
    function getTelemetryLevel(configurationService) {
        const newConfig = configurationService.getValue(telemetry_1.TELEMETRY_SETTING_ID);
        const crashReporterConfig = configurationService.getValue('telemetry.enableCrashReporter');
        const oldConfig = configurationService.getValue(telemetry_1.TELEMETRY_OLD_SETTING_ID);
        // If `telemetry.enableCrashReporter` is false or `telemetry.enableTelemetry' is false, disable telemetry
        if (oldConfig === false || crashReporterConfig === false) {
            return 0 /* TelemetryLevel.NONE */;
        }
        // Maps new telemetry setting to a telemetry level
        switch (newConfig !== null && newConfig !== void 0 ? newConfig : "all" /* TelemetryConfiguration.ON */) {
            case "all" /* TelemetryConfiguration.ON */:
                return 3 /* TelemetryLevel.USAGE */;
            case "error" /* TelemetryConfiguration.ERROR */:
                return 2 /* TelemetryLevel.ERROR */;
            case "crash" /* TelemetryConfiguration.CRASH */:
                return 1 /* TelemetryLevel.CRASH */;
            case "off" /* TelemetryConfiguration.OFF */:
                return 0 /* TelemetryLevel.NONE */;
        }
    }
    exports.getTelemetryLevel = getTelemetryLevel;
    function validateTelemetryData(data) {
        const properties = Object.create(null);
        const measurements = Object.create(null);
        const flat = Object.create(null);
        flatten(data, flat);
        for (let prop in flat) {
            // enforce property names less than 150 char, take the last 150 char
            prop = prop.length > 150 ? prop.substr(prop.length - 149) : prop;
            const value = flat[prop];
            if (typeof value === 'number') {
                measurements[prop] = value;
            }
            else if (typeof value === 'boolean') {
                measurements[prop] = value ? 1 : 0;
            }
            else if (typeof value === 'string') {
                if (value.length > 8192) {
                    console.warn(`Telemetry property: ${prop} has been trimmed to 8192, the original length is ${value.length}`);
                }
                //enforce property value to be less than 8192 char, take the first 8192 char
                // https://docs.microsoft.com/en-us/azure/azure-monitor/app/api-custom-events-metrics#limits
                properties[prop] = value.substring(0, 8191);
            }
            else if (typeof value !== 'undefined' && value !== null) {
                properties[prop] = value;
            }
        }
        return {
            properties,
            measurements
        };
    }
    exports.validateTelemetryData = validateTelemetryData;
    function cleanRemoteAuthority(remoteAuthority) {
        if (!remoteAuthority) {
            return 'none';
        }
        let ret = 'other';
        const allowedAuthorities = ['ssh-remote', 'dev-container', 'attached-container', 'wsl'];
        allowedAuthorities.forEach((res) => {
            if (remoteAuthority.indexOf(`${res}+`) === 0) {
                ret = res;
            }
        });
        return ret;
    }
    exports.cleanRemoteAuthority = cleanRemoteAuthority;
    function flatten(obj, result, order = 0, prefix) {
        if (!obj) {
            return;
        }
        for (let item of Object.getOwnPropertyNames(obj)) {
            const value = obj[item];
            const index = prefix ? prefix + item : item;
            if (Array.isArray(value)) {
                result[index] = (0, objects_1.safeStringify)(value);
            }
            else if (value instanceof Date) {
                // TODO unsure why this is here and not in _getData
                result[index] = value.toISOString();
            }
            else if ((0, types_1.isObject)(value)) {
                if (order < 2) {
                    flatten(value, result, order + 1, index + '.');
                }
                else {
                    result[index] = (0, objects_1.safeStringify)(value);
                }
            }
            else {
                result[index] = value;
            }
        }
    }
    function flattenKeys(value) {
        if (!value) {
            return [];
        }
        const result = [];
        flatKeys(result, '', value);
        return result;
    }
    function flatKeys(result, prefix, value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.keys(value)
                .forEach(key => flatKeys(result, prefix ? `${prefix}.${key}` : key, value[key]));
        }
        else {
            result.push(prefix);
        }
    }
    function getPiiPathsFromEnvironment(paths) {
        return [paths.appRoot, paths.extensionsPath, paths.userHome.fsPath, paths.tmpDir.fsPath, paths.userDataPath];
    }
    exports.getPiiPathsFromEnvironment = getPiiPathsFromEnvironment;
});
//# sourceMappingURL=telemetryUtils.js.map