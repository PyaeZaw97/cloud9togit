/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/event", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform"], function (require, exports, arrays_1, event_1, types, nls, configuration_1, jsonContributionRegistry_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getScopes = exports.validateProperty = exports.getDefaultValue = exports.keyFromOverrideIdentifiers = exports.overrideIdentifiersFromKey = exports.OVERRIDE_PROPERTY_REGEX = exports.OVERRIDE_PROPERTY_PATTERN = exports.configurationDefaultsSchemaId = exports.resourceLanguageSettingsSchemaId = exports.resourceSettings = exports.windowSettings = exports.machineOverridableSettings = exports.machineSettings = exports.applicationSettings = exports.allSettings = exports.ConfigurationScope = exports.Extensions = exports.EditPresentationTypes = void 0;
    var EditPresentationTypes;
    (function (EditPresentationTypes) {
        EditPresentationTypes["Multiline"] = "multilineText";
        EditPresentationTypes["Singleline"] = "singlelineText";
    })(EditPresentationTypes = exports.EditPresentationTypes || (exports.EditPresentationTypes = {}));
    exports.Extensions = {
        Configuration: 'base.contributions.configuration'
    };
    var ConfigurationScope;
    (function (ConfigurationScope) {
        /**
         * Application specific configuration, which can be configured only in local user settings.
         */
        ConfigurationScope[ConfigurationScope["APPLICATION"] = 1] = "APPLICATION";
        /**
         * Machine specific configuration, which can be configured only in local and remote user settings.
         */
        ConfigurationScope[ConfigurationScope["MACHINE"] = 2] = "MACHINE";
        /**
         * Window specific configuration, which can be configured in the user or workspace settings.
         */
        ConfigurationScope[ConfigurationScope["WINDOW"] = 3] = "WINDOW";
        /**
         * Resource specific configuration, which can be configured in the user, workspace or folder settings.
         */
        ConfigurationScope[ConfigurationScope["RESOURCE"] = 4] = "RESOURCE";
        /**
         * Resource specific configuration that can be configured in language specific settings
         */
        ConfigurationScope[ConfigurationScope["LANGUAGE_OVERRIDABLE"] = 5] = "LANGUAGE_OVERRIDABLE";
        /**
         * Machine specific configuration that can also be configured in workspace or folder settings.
         */
        ConfigurationScope[ConfigurationScope["MACHINE_OVERRIDABLE"] = 6] = "MACHINE_OVERRIDABLE";
    })(ConfigurationScope = exports.ConfigurationScope || (exports.ConfigurationScope = {}));
    exports.allSettings = { properties: {}, patternProperties: {} };
    exports.applicationSettings = { properties: {}, patternProperties: {} };
    exports.machineSettings = { properties: {}, patternProperties: {} };
    exports.machineOverridableSettings = { properties: {}, patternProperties: {} };
    exports.windowSettings = { properties: {}, patternProperties: {} };
    exports.resourceSettings = { properties: {}, patternProperties: {} };
    exports.resourceLanguageSettingsSchemaId = 'vscode://schemas/settings/resourceLanguage';
    exports.configurationDefaultsSchemaId = 'vscode://schemas/settings/configurationDefaults';
    const contributionRegistry = platform_1.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    class ConfigurationRegistry {
        constructor() {
            this.overrideIdentifiers = new Set();
            this._onDidSchemaChange = new event_1.Emitter();
            this.onDidSchemaChange = this._onDidSchemaChange.event;
            this._onDidUpdateConfiguration = new event_1.Emitter();
            this.onDidUpdateConfiguration = this._onDidUpdateConfiguration.event;
            this.configurationDefaultsOverrides = new Map();
            this.defaultLanguageConfigurationOverridesNode = {
                id: 'defaultOverrides',
                title: nls.localize('defaultLanguageConfigurationOverrides.title', "Default Language Configuration Overrides"),
                properties: {}
            };
            this.configurationContributors = [this.defaultLanguageConfigurationOverridesNode];
            this.resourceLanguageSettingsSchema = { properties: {}, patternProperties: {}, additionalProperties: false, errorMessage: 'Unknown editor configuration setting', allowTrailingCommas: true, allowComments: true };
            this.configurationProperties = {};
            this.excludedConfigurationProperties = {};
            contributionRegistry.registerSchema(exports.resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
            this.registerOverridePropertyPatternKey();
        }
        registerConfiguration(configuration, validate = true) {
            this.registerConfigurations([configuration], validate);
        }
        registerConfigurations(configurations, validate = true) {
            const properties = this.doRegisterConfigurations(configurations, validate);
            contributionRegistry.registerSchema(exports.resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties });
        }
        deregisterConfigurations(configurations) {
            const properties = this.doDeregisterConfigurations(configurations);
            contributionRegistry.registerSchema(exports.resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties });
        }
        updateConfigurations({ add, remove }) {
            const properties = [];
            properties.push(...this.doDeregisterConfigurations(remove));
            properties.push(...this.doRegisterConfigurations(add, false));
            contributionRegistry.registerSchema(exports.resourceLanguageSettingsSchemaId, this.resourceLanguageSettingsSchema);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties: (0, arrays_1.distinct)(properties) });
        }
        registerDefaultConfigurations(configurationDefaults) {
            var _a;
            const properties = [];
            const overrideIdentifiers = [];
            for (const { overrides, source } of configurationDefaults) {
                for (const key in overrides) {
                    properties.push(key);
                    if (exports.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        const defaultValue = Object.assign(Object.assign({}, (((_a = this.configurationDefaultsOverrides.get(key)) === null || _a === void 0 ? void 0 : _a.value) || {})), overrides[key]);
                        this.configurationDefaultsOverrides.set(key, { source, value: defaultValue });
                        const plainKey = (0, configuration_1.getLanguageTagSettingPlainKey)(key);
                        const property = {
                            type: 'object',
                            default: defaultValue,
                            description: nls.localize('defaultLanguageConfiguration.description', "Configure settings to be overridden for the {0} language.", plainKey),
                            $ref: exports.resourceLanguageSettingsSchemaId,
                            defaultDefaultValue: defaultValue,
                            source: types.isString(source) ? undefined : source,
                        };
                        overrideIdentifiers.push(...overrideIdentifiersFromKey(key));
                        this.configurationProperties[key] = property;
                        this.defaultLanguageConfigurationOverridesNode.properties[key] = property;
                    }
                    else {
                        this.configurationDefaultsOverrides.set(key, { value: overrides[key], source });
                        const property = this.configurationProperties[key];
                        if (property) {
                            this.updatePropertyDefaultValue(key, property);
                            this.updateSchema(key, property);
                        }
                    }
                }
            }
            this.registerOverrideIdentifiers(overrideIdentifiers);
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties, defaultsOverrides: true });
        }
        deregisterDefaultConfigurations(defaultConfigurations) {
            var _a;
            const properties = [];
            for (const { overrides, source } of defaultConfigurations) {
                for (const key in overrides) {
                    const configurationDefaultsOverride = this.configurationDefaultsOverrides.get(key);
                    const id = types.isString(source) ? source : source === null || source === void 0 ? void 0 : source.id;
                    const configurationDefaultsOverrideSourceId = types.isString(configurationDefaultsOverride === null || configurationDefaultsOverride === void 0 ? void 0 : configurationDefaultsOverride.source) ? configurationDefaultsOverride === null || configurationDefaultsOverride === void 0 ? void 0 : configurationDefaultsOverride.source : (_a = configurationDefaultsOverride === null || configurationDefaultsOverride === void 0 ? void 0 : configurationDefaultsOverride.source) === null || _a === void 0 ? void 0 : _a.id;
                    if (id !== configurationDefaultsOverrideSourceId) {
                        continue;
                    }
                    properties.push(key);
                    this.configurationDefaultsOverrides.delete(key);
                    if (exports.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        delete this.configurationProperties[key];
                        delete this.defaultLanguageConfigurationOverridesNode.properties[key];
                    }
                    else {
                        const property = this.configurationProperties[key];
                        if (property) {
                            this.updatePropertyDefaultValue(key, property);
                            this.updateSchema(key, property);
                        }
                    }
                }
            }
            this.updateOverridePropertyPatternKey();
            this._onDidSchemaChange.fire();
            this._onDidUpdateConfiguration.fire({ properties, defaultsOverrides: true });
        }
        notifyConfigurationSchemaUpdated(...configurations) {
            this._onDidSchemaChange.fire();
        }
        registerOverrideIdentifiers(overrideIdentifiers) {
            for (const overrideIdentifier of overrideIdentifiers) {
                this.overrideIdentifiers.add(overrideIdentifier);
            }
            this.updateOverridePropertyPatternKey();
        }
        doRegisterConfigurations(configurations, validate) {
            const properties = [];
            configurations.forEach(configuration => {
                properties.push(...this.validateAndRegisterProperties(configuration, validate, configuration.extensionInfo, configuration.restrictedProperties)); // fills in defaults
                this.configurationContributors.push(configuration);
                this.registerJSONConfiguration(configuration);
            });
            return properties;
        }
        doDeregisterConfigurations(configurations) {
            const properties = [];
            const deregisterConfiguration = (configuration) => {
                if (configuration.properties) {
                    for (const key in configuration.properties) {
                        properties.push(key);
                        delete this.configurationProperties[key];
                        this.removeFromSchema(key, configuration.properties[key]);
                    }
                }
                if (configuration.allOf) {
                    configuration.allOf.forEach(node => deregisterConfiguration(node));
                }
            };
            for (const configuration of configurations) {
                deregisterConfiguration(configuration);
                const index = this.configurationContributors.indexOf(configuration);
                if (index !== -1) {
                    this.configurationContributors.splice(index, 1);
                }
            }
            return properties;
        }
        validateAndRegisterProperties(configuration, validate = true, extensionInfo, restrictedProperties, scope = 3 /* ConfigurationScope.WINDOW */) {
            scope = types.isUndefinedOrNull(configuration.scope) ? scope : configuration.scope;
            let propertyKeys = [];
            let properties = configuration.properties;
            if (properties) {
                for (let key in properties) {
                    if (validate && validateProperty(key)) {
                        delete properties[key];
                        continue;
                    }
                    const property = properties[key];
                    property.source = extensionInfo;
                    // update default value
                    property.defaultDefaultValue = properties[key].default;
                    this.updatePropertyDefaultValue(key, property);
                    // update scope
                    if (exports.OVERRIDE_PROPERTY_REGEX.test(key)) {
                        property.scope = undefined; // No scope for overridable properties `[${identifier}]`
                    }
                    else {
                        property.scope = types.isUndefinedOrNull(property.scope) ? scope : property.scope;
                        property.restricted = types.isUndefinedOrNull(property.restricted) ? !!(restrictedProperties === null || restrictedProperties === void 0 ? void 0 : restrictedProperties.includes(key)) : property.restricted;
                    }
                    // Add to properties maps
                    // Property is included by default if 'included' is unspecified
                    if (properties[key].hasOwnProperty('included') && !properties[key].included) {
                        this.excludedConfigurationProperties[key] = properties[key];
                        delete properties[key];
                        continue;
                    }
                    else {
                        this.configurationProperties[key] = properties[key];
                    }
                    if (!properties[key].deprecationMessage && properties[key].markdownDeprecationMessage) {
                        // If not set, default deprecationMessage to the markdown source
                        properties[key].deprecationMessage = properties[key].markdownDeprecationMessage;
                    }
                    propertyKeys.push(key);
                }
            }
            let subNodes = configuration.allOf;
            if (subNodes) {
                for (let node of subNodes) {
                    propertyKeys.push(...this.validateAndRegisterProperties(node, validate, extensionInfo, restrictedProperties, scope));
                }
            }
            return propertyKeys;
        }
        // TODO: @sandy081 - Remove this method and include required info in getConfigurationProperties
        getConfigurations() {
            return this.configurationContributors;
        }
        getConfigurationProperties() {
            return this.configurationProperties;
        }
        getExcludedConfigurationProperties() {
            return this.excludedConfigurationProperties;
        }
        getConfigurationDefaultsOverrides() {
            return this.configurationDefaultsOverrides;
        }
        registerJSONConfiguration(configuration) {
            const register = (configuration) => {
                let properties = configuration.properties;
                if (properties) {
                    for (const key in properties) {
                        this.updateSchema(key, properties[key]);
                    }
                }
                let subNodes = configuration.allOf;
                if (subNodes) {
                    subNodes.forEach(register);
                }
            };
            register(configuration);
        }
        updateSchema(key, property) {
            exports.allSettings.properties[key] = property;
            switch (property.scope) {
                case 1 /* ConfigurationScope.APPLICATION */:
                    exports.applicationSettings.properties[key] = property;
                    break;
                case 2 /* ConfigurationScope.MACHINE */:
                    exports.machineSettings.properties[key] = property;
                    break;
                case 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */:
                    exports.machineOverridableSettings.properties[key] = property;
                    break;
                case 3 /* ConfigurationScope.WINDOW */:
                    exports.windowSettings.properties[key] = property;
                    break;
                case 4 /* ConfigurationScope.RESOURCE */:
                    exports.resourceSettings.properties[key] = property;
                    break;
                case 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */:
                    exports.resourceSettings.properties[key] = property;
                    this.resourceLanguageSettingsSchema.properties[key] = property;
                    break;
            }
        }
        removeFromSchema(key, property) {
            delete exports.allSettings.properties[key];
            switch (property.scope) {
                case 1 /* ConfigurationScope.APPLICATION */:
                    delete exports.applicationSettings.properties[key];
                    break;
                case 2 /* ConfigurationScope.MACHINE */:
                    delete exports.machineSettings.properties[key];
                    break;
                case 6 /* ConfigurationScope.MACHINE_OVERRIDABLE */:
                    delete exports.machineOverridableSettings.properties[key];
                    break;
                case 3 /* ConfigurationScope.WINDOW */:
                    delete exports.windowSettings.properties[key];
                    break;
                case 4 /* ConfigurationScope.RESOURCE */:
                case 5 /* ConfigurationScope.LANGUAGE_OVERRIDABLE */:
                    delete exports.resourceSettings.properties[key];
                    delete this.resourceLanguageSettingsSchema.properties[key];
                    break;
            }
        }
        updateOverridePropertyPatternKey() {
            for (const overrideIdentifier of this.overrideIdentifiers.values()) {
                const overrideIdentifierProperty = `[${overrideIdentifier}]`;
                const resourceLanguagePropertiesSchema = {
                    type: 'object',
                    description: nls.localize('overrideSettings.defaultDescription', "Configure editor settings to be overridden for a language."),
                    errorMessage: nls.localize('overrideSettings.errorMessage', "This setting does not support per-language configuration."),
                    $ref: exports.resourceLanguageSettingsSchemaId,
                };
                this.updatePropertyDefaultValue(overrideIdentifierProperty, resourceLanguagePropertiesSchema);
                exports.allSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.applicationSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.machineSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.machineOverridableSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.windowSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
                exports.resourceSettings.properties[overrideIdentifierProperty] = resourceLanguagePropertiesSchema;
            }
            this._onDidSchemaChange.fire();
        }
        registerOverridePropertyPatternKey() {
            const resourceLanguagePropertiesSchema = {
                type: 'object',
                description: nls.localize('overrideSettings.defaultDescription', "Configure editor settings to be overridden for a language."),
                errorMessage: nls.localize('overrideSettings.errorMessage', "This setting does not support per-language configuration."),
                $ref: exports.resourceLanguageSettingsSchemaId,
            };
            exports.allSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.applicationSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.machineSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.machineOverridableSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.windowSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            exports.resourceSettings.patternProperties[exports.OVERRIDE_PROPERTY_PATTERN] = resourceLanguagePropertiesSchema;
            this._onDidSchemaChange.fire();
        }
        updatePropertyDefaultValue(key, property) {
            const configurationdefaultOverride = this.configurationDefaultsOverrides.get(key);
            let defaultValue = configurationdefaultOverride === null || configurationdefaultOverride === void 0 ? void 0 : configurationdefaultOverride.value;
            let defaultSource = configurationdefaultOverride === null || configurationdefaultOverride === void 0 ? void 0 : configurationdefaultOverride.source;
            if (types.isUndefined(defaultValue)) {
                defaultValue = property.defaultDefaultValue;
                defaultSource = undefined;
            }
            if (types.isUndefined(defaultValue)) {
                defaultValue = getDefaultValue(property.type);
            }
            property.default = defaultValue;
            property.defaultValueSource = defaultSource;
        }
    }
    const OVERRIDE_IDENTIFIER_PATTERN = `\\[([^\\]]+)\\]`;
    const OVERRIDE_IDENTIFIER_REGEX = new RegExp(OVERRIDE_IDENTIFIER_PATTERN, 'g');
    exports.OVERRIDE_PROPERTY_PATTERN = `^(${OVERRIDE_IDENTIFIER_PATTERN})+$`;
    exports.OVERRIDE_PROPERTY_REGEX = new RegExp(exports.OVERRIDE_PROPERTY_PATTERN);
    function overrideIdentifiersFromKey(key) {
        const identifiers = [];
        if (exports.OVERRIDE_PROPERTY_REGEX.test(key)) {
            let matches = OVERRIDE_IDENTIFIER_REGEX.exec(key);
            while (matches === null || matches === void 0 ? void 0 : matches.length) {
                const identifier = matches[1].trim();
                if (identifier) {
                    identifiers.push(identifier);
                }
                matches = OVERRIDE_IDENTIFIER_REGEX.exec(key);
            }
        }
        return (0, arrays_1.distinct)(identifiers);
    }
    exports.overrideIdentifiersFromKey = overrideIdentifiersFromKey;
    function keyFromOverrideIdentifiers(overrideIdentifiers) {
        return overrideIdentifiers.reduce((result, overrideIdentifier) => `${result}[${overrideIdentifier}]`, '');
    }
    exports.keyFromOverrideIdentifiers = keyFromOverrideIdentifiers;
    function getDefaultValue(type) {
        const t = Array.isArray(type) ? type[0] : type;
        switch (t) {
            case 'boolean':
                return false;
            case 'integer':
            case 'number':
                return 0;
            case 'string':
                return '';
            case 'array':
                return [];
            case 'object':
                return {};
            default:
                return null;
        }
    }
    exports.getDefaultValue = getDefaultValue;
    const configurationRegistry = new ConfigurationRegistry();
    platform_1.Registry.add(exports.Extensions.Configuration, configurationRegistry);
    function validateProperty(property) {
        if (!property.trim()) {
            return nls.localize('config.property.empty', "Cannot register an empty property");
        }
        if (exports.OVERRIDE_PROPERTY_REGEX.test(property)) {
            return nls.localize('config.property.languageDefault', "Cannot register '{0}'. This matches property pattern '\\\\[.*\\\\]$' for describing language specific editor settings. Use 'configurationDefaults' contribution.", property);
        }
        if (configurationRegistry.getConfigurationProperties()[property] !== undefined) {
            return nls.localize('config.property.duplicate', "Cannot register '{0}'. This property is already registered.", property);
        }
        return null;
    }
    exports.validateProperty = validateProperty;
    function getScopes() {
        const scopes = [];
        const configurationProperties = configurationRegistry.getConfigurationProperties();
        for (const key of Object.keys(configurationProperties)) {
            scopes.push([key, configurationProperties[key].scope]);
        }
        scopes.push(['launch', 4 /* ConfigurationScope.RESOURCE */]);
        scopes.push(['task', 4 /* ConfigurationScope.RESOURCE */]);
        return scopes;
    }
    exports.getScopes = getScopes;
});
//# sourceMappingURL=configurationRegistry.js.map