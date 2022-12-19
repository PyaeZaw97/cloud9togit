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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/common/objects", "vs/base/common/observableValue", "vs/base/common/platform", "vs/base/common/strings", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/configuration/common/configurationRegistry", "vs/platform/product/common/product", "vs/platform/product/common/productService", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/platform/telemetry/common/telemetryUtils"], function (require, exports, lifecycle_1, objects_1, observableValue_1, platform_1, strings_1, nls_1, configuration_1, configurationRegistry_1, product_1, productService_1, platform_2, telemetry_1, telemetryUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TelemetryService = void 0;
    let TelemetryService = class TelemetryService {
        constructor(config, _configurationService, _productService) {
            this._configurationService = _configurationService;
            this._productService = _productService;
            this._experimentProperties = {};
            this.telemetryLevel = new observableValue_1.MutableObservableValue(3 /* TelemetryLevel.USAGE */);
            this._disposables = new lifecycle_1.DisposableStore();
            this._cleanupPatterns = [];
            this._appenders = config.appenders;
            this._commonProperties = config.commonProperties || Promise.resolve({});
            this._piiPaths = config.piiPaths || [];
            this._sendErrorTelemetry = !!config.sendErrorTelemetry;
            // static cleanup pattern for: `file:///DANGEROUS/PATH/resources/app/Useful/Information`
            this._cleanupPatterns = [/file:\/\/\/.*?\/resources\/app\//gi];
            for (let piiPath of this._piiPaths) {
                this._cleanupPatterns.push(new RegExp((0, strings_1.escapeRegExpCharacters)(piiPath), 'gi'));
            }
            this._updateTelemetryLevel();
            this._configurationService.onDidChangeConfiguration(this._updateTelemetryLevel, this, this._disposables);
        }
        setExperimentProperty(name, value) {
            this._experimentProperties[name] = value;
        }
        _updateTelemetryLevel() {
            let level = (0, telemetryUtils_1.getTelemetryLevel)(this._configurationService);
            const collectableTelemetry = this._productService.enabledTelemetryLevels;
            // Also ensure that error telemetry is respecting the product configuration for collectable telemetry
            if (collectableTelemetry) {
                this._sendErrorTelemetry = this.sendErrorTelemetry ? collectableTelemetry.error : false;
                // Make sure the telemetry level from the service is the minimum of the config and product
                const maxCollectableTelemetryLevel = collectableTelemetry.usage ? 3 /* TelemetryLevel.USAGE */ : collectableTelemetry.error ? 2 /* TelemetryLevel.ERROR */ : 0 /* TelemetryLevel.NONE */;
                level = Math.min(level, maxCollectableTelemetryLevel);
            }
            this.telemetryLevel.value = level;
        }
        get sendErrorTelemetry() {
            return this._sendErrorTelemetry;
        }
        async getTelemetryInfo() {
            const values = await this._commonProperties;
            // well known properties
            let sessionId = values['sessionID'];
            let machineId = values['common.machineId'];
            let firstSessionDate = values['common.firstSessionDate'];
            let msftInternal = values['common.msftInternal'];
            return { sessionId, machineId, firstSessionDate, msftInternal };
        }
        dispose() {
            this._disposables.dispose();
        }
        _log(eventName, eventLevel, data, anonymizeFilePaths) {
            // don't send events when the user is optout
            if (this.telemetryLevel.value < eventLevel) {
                return Promise.resolve(undefined);
            }
            return this._commonProperties.then(values => {
                // (first) add common properties
                data = (0, objects_1.mixin)(data, values);
                // (next) add experiment properties
                data = (0, objects_1.mixin)(data, this._experimentProperties);
                // (last) remove all PII from data
                data = (0, objects_1.cloneAndChange)(data, value => {
                    if (typeof value === 'string') {
                        return this._cleanupInfo(value, anonymizeFilePaths);
                    }
                    return undefined;
                });
                // Log to the appenders of sufficient level
                this._appenders.forEach(a => a.log(eventName, data));
            }, err => {
                // unsure what to do now...
                console.error(err);
            });
        }
        publicLog(eventName, data, anonymizeFilePaths) {
            return this._log(eventName, 3 /* TelemetryLevel.USAGE */, data, anonymizeFilePaths);
        }
        publicLog2(eventName, data, anonymizeFilePaths) {
            return this.publicLog(eventName, data, anonymizeFilePaths);
        }
        publicLogError(errorEventName, data) {
            if (!this._sendErrorTelemetry) {
                return Promise.resolve(undefined);
            }
            // Send error event and anonymize paths
            return this._log(errorEventName, 2 /* TelemetryLevel.ERROR */, data, true);
        }
        publicLogError2(eventName, data) {
            return this.publicLogError(eventName, data);
        }
        _anonymizeFilePaths(stack) {
            let updatedStack = stack;
            const cleanUpIndexes = [];
            for (let regexp of this._cleanupPatterns) {
                while (true) {
                    const result = regexp.exec(stack);
                    if (!result) {
                        break;
                    }
                    cleanUpIndexes.push([result.index, regexp.lastIndex]);
                }
            }
            const nodeModulesRegex = /^[\\\/]?(node_modules|node_modules\.asar)[\\\/]/;
            const fileRegex = /(file:\/\/)?([a-zA-Z]:(\\\\|\\|\/)|(\\\\|\\|\/))?([\w-\._]+(\\\\|\\|\/))+[\w-\._]*/g;
            let lastIndex = 0;
            updatedStack = '';
            while (true) {
                const result = fileRegex.exec(stack);
                if (!result) {
                    break;
                }
                // Anoynimize user file paths that do not need to be retained or cleaned up.
                if (!nodeModulesRegex.test(result[0]) && cleanUpIndexes.every(([x, y]) => result.index < x || result.index >= y)) {
                    updatedStack += stack.substring(lastIndex, result.index) + '<REDACTED: user-file-path>';
                    lastIndex = fileRegex.lastIndex;
                }
            }
            if (lastIndex < stack.length) {
                updatedStack += stack.substr(lastIndex);
            }
            return updatedStack;
        }
        _removePropertiesWithPossibleUserInfo(property) {
            // If for some reason it is undefined we skip it (this shouldn't be possible);
            if (!property) {
                return property;
            }
            const value = property.toLowerCase();
            const userDataRegexes = [
                { label: 'Google API Key', regex: /AIza[A-Za-z0-9_\\\-]{35}/ },
                { label: 'Slack Token', regex: /xox[pbar]\-[A-Za-z0-9]/ },
                { label: 'Generic Secret', regex: /(key|token|sig|secret|signature|password|passwd|pwd|android:value)[^a-zA-Z0-9]/ },
                { label: 'Email', regex: /@[a-zA-Z0-9-.]+/ } // Regex which matches @*.site
            ];
            // Check for common user data in the telemetry events
            for (const secretRegex of userDataRegexes) {
                if (secretRegex.regex.test(value)) {
                    return `<REDACTED: ${secretRegex.label}`;
                }
            }
            return property;
        }
        _cleanupInfo(property, anonymizeFilePaths) {
            let updatedProperty = property;
            // anonymize file paths
            if (anonymizeFilePaths) {
                updatedProperty = this._anonymizeFilePaths(updatedProperty);
            }
            // sanitize with configured cleanup patterns
            for (let regexp of this._cleanupPatterns) {
                updatedProperty = updatedProperty.replace(regexp, '');
            }
            // remove possible user info
            updatedProperty = this._removePropertiesWithPossibleUserInfo(updatedProperty);
            return updatedProperty;
        }
    };
    TelemetryService.IDLE_START_EVENT_NAME = 'UserIdleStart';
    TelemetryService.IDLE_STOP_EVENT_NAME = 'UserIdleStop';
    TelemetryService = __decorate([
        __param(1, configuration_1.IConfigurationService),
        __param(2, productService_1.IProductService)
    ], TelemetryService);
    exports.TelemetryService = TelemetryService;
    function getTelemetryLevelSettingDescription() {
        const telemetryText = (0, nls_1.localize)('telemetry.telemetryLevelMd', "Controls {0} telemetry, first-party extension telemetry and participating third-party extension telemetry. Some third party extensions might not respect this setting. Consult the specific extension's documentation to be sure. Telemetry helps us better understand how {0} is performing, where improvements need to be made, and how features are being used.", product_1.default.nameLong);
        const externalLinksStatement = !product_1.default.privacyStatementUrl ?
            (0, nls_1.localize)("telemetry.docsStatement", "Read more about the [data we collect]({0}).", 'https://aka.ms/vscode-telemetry') :
            (0, nls_1.localize)("telemetry.docsAndPrivacyStatement", "Read more about the [data we collect]({0}) and our [privacy statement]({1}).", 'https://aka.ms/vscode-telemetry', product_1.default.privacyStatementUrl);
        const restartString = !platform_1.isWeb ? (0, nls_1.localize)('telemetry.restart', 'A full restart of the application is necessary for crash reporting changes to take effect.') : '';
        const crashReportsHeader = (0, nls_1.localize)('telemetry.crashReports', "Crash Reports");
        const errorsHeader = (0, nls_1.localize)('telemetry.errors', "Error Telemetry");
        const usageHeader = (0, nls_1.localize)('telemetry.usage', "Usage Data");
        const telemetryTableDescription = (0, nls_1.localize)('telemetry.telemetryLevel.tableDescription', "The following table outlines the data sent with each setting:");
        const telemetryTable = `
|       | ${crashReportsHeader} | ${errorsHeader} | ${usageHeader} |
|:------|:---------------------:|:---------------:|:--------------:|
| all   |            ✓          |        ✓        |        ✓       |
| error |            ✓          |        ✓        |        -       |
| crash |            ✓          |        -        |        -       |
| off   |            -          |        -        |        -       |
`;
        const deprecatedSettingNote = (0, nls_1.localize)('telemetry.telemetryLevel.deprecated', "****Note:*** If this setting is 'off', no telemetry will be sent regardless of other telemetry settings. If this setting is set to anything except 'off' and telemetry is disabled with deprecated settings, no telemetry will be sent.*");
        const telemetryDescription = `
${telemetryText} ${externalLinksStatement} ${restartString}

&nbsp;

${telemetryTableDescription}
${telemetryTable}

&nbsp;

${deprecatedSettingNote}
`;
        return telemetryDescription;
    }
    platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': telemetry_1.TELEMETRY_SECTION_ID,
        'order': 110,
        'type': 'object',
        'title': (0, nls_1.localize)('telemetryConfigurationTitle', "Telemetry"),
        'properties': {
            [telemetry_1.TELEMETRY_SETTING_ID]: {
                'type': 'string',
                'enum': ["all" /* TelemetryConfiguration.ON */, "error" /* TelemetryConfiguration.ERROR */, "crash" /* TelemetryConfiguration.CRASH */, "off" /* TelemetryConfiguration.OFF */],
                'enumDescriptions': [
                    (0, nls_1.localize)('telemetry.telemetryLevel.default', "Sends usage data, errors, and crash reports."),
                    (0, nls_1.localize)('telemetry.telemetryLevel.error', "Sends general error telemetry and crash reports."),
                    (0, nls_1.localize)('telemetry.telemetryLevel.crash', "Sends OS level crash reports."),
                    (0, nls_1.localize)('telemetry.telemetryLevel.off', "Disables all product telemetry.")
                ],
                'markdownDescription': getTelemetryLevelSettingDescription(),
                'default': "all" /* TelemetryConfiguration.ON */,
                'restricted': true,
                'scope': 1 /* ConfigurationScope.APPLICATION */,
                'tags': ['usesOnlineServices', 'telemetry']
            }
        }
    });
    // Deprecated telemetry setting
    platform_2.Registry.as(configurationRegistry_1.Extensions.Configuration).registerConfiguration({
        'id': telemetry_1.TELEMETRY_SECTION_ID,
        'order': 110,
        'type': 'object',
        'title': (0, nls_1.localize)('telemetryConfigurationTitle', "Telemetry"),
        'properties': {
            [telemetry_1.TELEMETRY_OLD_SETTING_ID]: {
                'type': 'boolean',
                'markdownDescription': !product_1.default.privacyStatementUrl ?
                    (0, nls_1.localize)('telemetry.enableTelemetry', "Enable diagnostic data to be collected. This helps us to better understand how {0} is performing and where improvements need to be made.", product_1.default.nameLong) :
                    (0, nls_1.localize)('telemetry.enableTelemetryMd', "Enable diagnostic data to be collected. This helps us to better understand how {0} is performing and where improvements need to be made. [Read more]({1}) about what we collect and our privacy statement.", product_1.default.nameLong, product_1.default.privacyStatementUrl),
                'default': true,
                'restricted': true,
                'markdownDeprecationMessage': (0, nls_1.localize)('enableTelemetryDeprecated', "If this setting is false, no telemetry will be sent regardless of the new setting's value. Deprecated in favor of the {0} setting.", `\`#${telemetry_1.TELEMETRY_SETTING_ID}#\``),
                'scope': 1 /* ConfigurationScope.APPLICATION */,
                'tags': ['usesOnlineServices', 'telemetry']
            }
        }
    });
});
//# sourceMappingURL=telemetryService.js.map