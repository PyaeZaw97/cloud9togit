/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/editor/common/editor", "vs/platform/instantiation/common/instantiation"], function (require, exports, editor_1, instantiation_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.USE_SPLIT_JSON_SETTING = exports.DEFAULT_SETTINGS_EDITOR_SETTING = exports.FOLDER_SETTINGS_PATH = exports.IPreferencesService = exports.validateSettingsEditorOptions = exports.SettingMatchType = exports.SettingValueType = void 0;
    var SettingValueType;
    (function (SettingValueType) {
        SettingValueType["Null"] = "null";
        SettingValueType["Enum"] = "enum";
        SettingValueType["String"] = "string";
        SettingValueType["MultilineString"] = "multiline-string";
        SettingValueType["Integer"] = "integer";
        SettingValueType["Number"] = "number";
        SettingValueType["Boolean"] = "boolean";
        SettingValueType["Array"] = "array";
        SettingValueType["Exclude"] = "exclude";
        SettingValueType["Complex"] = "complex";
        SettingValueType["NullableInteger"] = "nullable-integer";
        SettingValueType["NullableNumber"] = "nullable-number";
        SettingValueType["Object"] = "object";
        SettingValueType["BooleanObject"] = "boolean-object";
        SettingValueType["LanguageTag"] = "language-tag";
    })(SettingValueType = exports.SettingValueType || (exports.SettingValueType = {}));
    /**
     * The ways a setting could match a query,
     * sorted in increasing order of relevance.
     * For now, ignore description and value matches.
     */
    var SettingMatchType;
    (function (SettingMatchType) {
        SettingMatchType[SettingMatchType["None"] = 0] = "None";
        SettingMatchType[SettingMatchType["WholeWordMatch"] = 1] = "WholeWordMatch";
        SettingMatchType[SettingMatchType["KeyMatch"] = 2] = "KeyMatch";
    })(SettingMatchType = exports.SettingMatchType || (exports.SettingMatchType = {}));
    function validateSettingsEditorOptions(options) {
        return Object.assign(Object.assign({}, options), { 
            // Enforce some options for settings specifically
            override: editor_1.EditorResolution.DISABLED, pinned: true });
    }
    exports.validateSettingsEditorOptions = validateSettingsEditorOptions;
    exports.IPreferencesService = (0, instantiation_1.createDecorator)('preferencesService');
    exports.FOLDER_SETTINGS_PATH = '.vscode/settings.json';
    exports.DEFAULT_SETTINGS_EDITOR_SETTING = 'workbench.settings.openDefaultSettings';
    exports.USE_SPLIT_JSON_SETTING = 'workbench.settings.useSplitJSON';
});
//# sourceMappingURL=preferences.js.map