/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/types", "vs/base/common/uri", "vs/platform/instantiation/common/instantiation"], function (require, exports, types, uri_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getLanguageTagSettingPlainKey = exports.getMigratedSettingValue = exports.merge = exports.getConfigurationValue = exports.removeFromValueTree = exports.addToValueTree = exports.toValuesTree = exports.ConfigurationTargetToString = exports.ConfigurationTarget = exports.isConfigurationUpdateOverrides = exports.isConfigurationOverrides = exports.IConfigurationService = void 0;
    exports.IConfigurationService = (0, instantiation_1.createDecorator)('configurationService');
    function isConfigurationOverrides(thing) {
        return thing
            && typeof thing === 'object'
            && (!thing.overrideIdentifier || typeof thing.overrideIdentifier === 'string')
            && (!thing.resource || thing.resource instanceof uri_1.URI);
    }
    exports.isConfigurationOverrides = isConfigurationOverrides;
    function isConfigurationUpdateOverrides(thing) {
        return thing
            && typeof thing === 'object'
            && (!thing.overrideIdentifiers || types.isArray(thing.overrideIdentifiers))
            && !thing.overrideIdentifier
            && (!thing.resource || thing.resource instanceof uri_1.URI);
    }
    exports.isConfigurationUpdateOverrides = isConfigurationUpdateOverrides;
    var ConfigurationTarget;
    (function (ConfigurationTarget) {
        ConfigurationTarget[ConfigurationTarget["USER"] = 1] = "USER";
        ConfigurationTarget[ConfigurationTarget["USER_LOCAL"] = 2] = "USER_LOCAL";
        ConfigurationTarget[ConfigurationTarget["USER_REMOTE"] = 3] = "USER_REMOTE";
        ConfigurationTarget[ConfigurationTarget["WORKSPACE"] = 4] = "WORKSPACE";
        ConfigurationTarget[ConfigurationTarget["WORKSPACE_FOLDER"] = 5] = "WORKSPACE_FOLDER";
        ConfigurationTarget[ConfigurationTarget["DEFAULT"] = 6] = "DEFAULT";
        ConfigurationTarget[ConfigurationTarget["MEMORY"] = 7] = "MEMORY";
    })(ConfigurationTarget = exports.ConfigurationTarget || (exports.ConfigurationTarget = {}));
    function ConfigurationTargetToString(configurationTarget) {
        switch (configurationTarget) {
            case 1 /* ConfigurationTarget.USER */: return 'USER';
            case 2 /* ConfigurationTarget.USER_LOCAL */: return 'USER_LOCAL';
            case 3 /* ConfigurationTarget.USER_REMOTE */: return 'USER_REMOTE';
            case 4 /* ConfigurationTarget.WORKSPACE */: return 'WORKSPACE';
            case 5 /* ConfigurationTarget.WORKSPACE_FOLDER */: return 'WORKSPACE_FOLDER';
            case 6 /* ConfigurationTarget.DEFAULT */: return 'DEFAULT';
            case 7 /* ConfigurationTarget.MEMORY */: return 'MEMORY';
        }
    }
    exports.ConfigurationTargetToString = ConfigurationTargetToString;
    function toValuesTree(properties, conflictReporter) {
        const root = Object.create(null);
        for (let key in properties) {
            addToValueTree(root, key, properties[key], conflictReporter);
        }
        return root;
    }
    exports.toValuesTree = toValuesTree;
    function addToValueTree(settingsTreeRoot, key, value, conflictReporter) {
        const segments = key.split('.');
        const last = segments.pop();
        let curr = settingsTreeRoot;
        for (let i = 0; i < segments.length; i++) {
            let s = segments[i];
            let obj = curr[s];
            switch (typeof obj) {
                case 'undefined':
                    obj = curr[s] = Object.create(null);
                    break;
                case 'object':
                    break;
                default:
                    conflictReporter(`Ignoring ${key} as ${segments.slice(0, i + 1).join('.')} is ${JSON.stringify(obj)}`);
                    return;
            }
            curr = obj;
        }
        if (typeof curr === 'object' && curr !== null) {
            try {
                curr[last] = value; // workaround https://github.com/microsoft/vscode/issues/13606
            }
            catch (e) {
                conflictReporter(`Ignoring ${key} as ${segments.join('.')} is ${JSON.stringify(curr)}`);
            }
        }
        else {
            conflictReporter(`Ignoring ${key} as ${segments.join('.')} is ${JSON.stringify(curr)}`);
        }
    }
    exports.addToValueTree = addToValueTree;
    function removeFromValueTree(valueTree, key) {
        const segments = key.split('.');
        doRemoveFromValueTree(valueTree, segments);
    }
    exports.removeFromValueTree = removeFromValueTree;
    function doRemoveFromValueTree(valueTree, segments) {
        const first = segments.shift();
        if (segments.length === 0) {
            // Reached last segment
            delete valueTree[first];
            return;
        }
        if (Object.keys(valueTree).indexOf(first) !== -1) {
            const value = valueTree[first];
            if (typeof value === 'object' && !Array.isArray(value)) {
                doRemoveFromValueTree(value, segments);
                if (Object.keys(value).length === 0) {
                    delete valueTree[first];
                }
            }
        }
    }
    /**
     * A helper function to get the configuration value with a specific settings path (e.g. config.some.setting)
     */
    function getConfigurationValue(config, settingPath, defaultValue) {
        function accessSetting(config, path) {
            let current = config;
            for (const component of path) {
                if (typeof current !== 'object' || current === null) {
                    return undefined;
                }
                current = current[component];
            }
            return current;
        }
        const path = settingPath.split('.');
        const result = accessSetting(config, path);
        return typeof result === 'undefined' ? defaultValue : result;
    }
    exports.getConfigurationValue = getConfigurationValue;
    function merge(base, add, overwrite) {
        Object.keys(add).forEach(key => {
            if (key !== '__proto__') {
                if (key in base) {
                    if (types.isObject(base[key]) && types.isObject(add[key])) {
                        merge(base[key], add[key], overwrite);
                    }
                    else if (overwrite) {
                        base[key] = add[key];
                    }
                }
                else {
                    base[key] = add[key];
                }
            }
        });
    }
    exports.merge = merge;
    function getMigratedSettingValue(configurationService, currentSettingName, legacySettingName) {
        const setting = configurationService.inspect(currentSettingName);
        const legacySetting = configurationService.inspect(legacySettingName);
        if (typeof setting.userValue !== 'undefined' || typeof setting.workspaceValue !== 'undefined' || typeof setting.workspaceFolderValue !== 'undefined') {
            return setting.value;
        }
        else if (typeof legacySetting.userValue !== 'undefined' || typeof legacySetting.workspaceValue !== 'undefined' || typeof legacySetting.workspaceFolderValue !== 'undefined') {
            return legacySetting.value;
        }
        else {
            return setting.defaultValue;
        }
    }
    exports.getMigratedSettingValue = getMigratedSettingValue;
    function getLanguageTagSettingPlainKey(settingKey) {
        return settingKey.replace(/[\[\]]/g, '');
    }
    exports.getLanguageTagSettingPlainKey = getLanguageTagSettingPlainKey;
});
//# sourceMappingURL=configuration.js.map