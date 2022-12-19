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
define(["require", "exports", "vs/base/browser/canIUse", "vs/base/browser/dom", "vs/base/browser/ui/aria/aria", "vs/base/browser/ui/button/button", "vs/base/browser/ui/toggle/toggle", "vs/base/browser/ui/inputbox/inputBox", "vs/base/browser/ui/list/list", "vs/base/browser/ui/list/listWidget", "vs/base/browser/ui/selectBox/selectBox", "vs/base/browser/ui/toolbar/toolbar", "vs/base/browser/ui/tree/objectTreeModel", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/color", "vs/base/common/errors", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/types", "vs/nls", "vs/platform/clipboard/common/clipboardService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/userDataSync/common/settingsMerge", "vs/workbench/contrib/preferences/browser/settingsTreeModels", "vs/workbench/contrib/preferences/browser/settingsWidgets", "vs/workbench/contrib/preferences/common/preferences", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/preferences/common/preferences", "vs/platform/userDataSync/common/userDataSync", "vs/workbench/services/preferences/common/preferencesValidation", "vs/base/common/codicons", "vs/base/browser/ui/iconLabel/simpleIconLabel", "vs/platform/list/browser/listService", "vs/platform/contextkey/common/contextkey", "vs/platform/accessibility/common/accessibility", "vs/workbench/contrib/preferences/browser/preferencesIcons", "vs/editor/contrib/markdownRenderer/browser/markdownRenderer", "vs/workbench/contrib/preferences/common/settingsEditorColorRegistry"], function (require, exports, canIUse_1, DOM, aria_1, button_1, toggle_1, inputBox_1, list_1, listWidget_1, selectBox_1, toolbar_1, objectTreeModel_1, actions_1, arrays, color_1, errors_1, event_1, lifecycle_1, platform_1, strings_1, types_1, nls_1, clipboardService_1, commands_1, configuration_1, contextView_1, instantiation_1, keybinding_1, opener_1, colorRegistry_1, styler_1, themeService_1, settingsMerge_1, settingsTreeModels_1, settingsWidgets_1, preferences_1, environmentService_1, preferences_2, userDataSync_1, preferencesValidation_1, codicons_1, simpleIconLabel_1, listService_1, contextkey_1, accessibility_1, preferencesIcons_1, markdownRenderer_1, settingsEditorColorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SettingsTree = exports.NonCollapsibleObjectTreeModel = exports.SettingsTreeFilter = exports.SettingTreeRenderers = exports.SettingUntrustedRenderer = exports.SettingBoolRenderer = exports.SettingNumberRenderer = exports.SettingEnumRenderer = exports.SettingMultilineTextRenderer = exports.SettingTextRenderer = exports.SettingExcludeRenderer = exports.SettingBoolObjectRenderer = exports.SettingObjectRenderer = exports.SettingArrayRenderer = exports.SettingComplexRenderer = exports.SettingNewExtensionsRenderer = exports.SettingGroupRenderer = exports.AbstractSettingRenderer = exports.createSettingMatchRegExp = exports.createTocTreeForExtensionSettings = exports.resolveConfiguredUntrustedSettings = exports.resolveSettingsTree = void 0;
    const $ = DOM.$;
    function getExcludeDisplayValue(element) {
        const data = element.isConfigured ? Object.assign(Object.assign({}, element.defaultValue), element.scopeValue) :
            element.defaultValue;
        return Object.keys(data)
            .filter(key => !!data[key])
            .map(key => {
            const value = data[key];
            const sibling = typeof value === 'boolean' ? undefined : value.when;
            return {
                value: {
                    type: 'string',
                    data: key
                },
                sibling,
                elementType: element.valueType
            };
        });
    }
    function areAllPropertiesDefined(properties, itemsToDisplay) {
        const staticProperties = new Set(properties);
        itemsToDisplay.forEach(({ key }) => staticProperties.delete(key.data));
        return staticProperties.size === 0;
    }
    function getEnumOptionsFromSchema(schema) {
        var _a, _b;
        if (schema.anyOf) {
            return arrays.flatten(schema.anyOf.map(getEnumOptionsFromSchema));
        }
        const enumDescriptions = (_a = schema.enumDescriptions) !== null && _a !== void 0 ? _a : [];
        return ((_b = schema.enum) !== null && _b !== void 0 ? _b : []).map((value, idx) => {
            const description = idx < enumDescriptions.length
                ? enumDescriptions[idx]
                : undefined;
            return { value, description };
        });
    }
    function getObjectValueType(schema) {
        if (schema.anyOf) {
            const subTypes = schema.anyOf.map(getObjectValueType);
            if (subTypes.some(type => type === 'enum')) {
                return 'enum';
            }
            return 'string';
        }
        if (schema.type === 'boolean') {
            return 'boolean';
        }
        else if (schema.type === 'string' && (0, types_1.isDefined)(schema.enum) && schema.enum.length > 0) {
            return 'enum';
        }
        else {
            return 'string';
        }
    }
    function getObjectDisplayValue(element) {
        var _a, _b;
        const elementDefaultValue = typeof element.defaultValue === 'object'
            ? (_a = element.defaultValue) !== null && _a !== void 0 ? _a : {}
            : {};
        const { objectProperties, objectPatternProperties, objectAdditionalProperties } = element.setting;
        const patternsAndSchemas = Object
            .entries(objectPatternProperties !== null && objectPatternProperties !== void 0 ? objectPatternProperties : {})
            .map(([pattern, schema]) => ({
            pattern: new RegExp(pattern),
            schema
        }));
        const wellDefinedKeyEnumOptions = Object.entries(objectProperties !== null && objectProperties !== void 0 ? objectProperties : {}).map(([key, schema]) => ({ value: key, description: schema.description }));
        let data = (_b = element.value) !== null && _b !== void 0 ? _b : {};
        if (element.setting.allKeysAreBoolean) {
            // Add on default values, because we want to display all checkboxes.
            data = Object.assign(Object.assign({}, elementDefaultValue), data);
        }
        return Object.keys(data).map(key => {
            var _a;
            if ((0, types_1.isDefined)(objectProperties) && key in objectProperties) {
                if (element.setting.allKeysAreBoolean) {
                    return {
                        key: {
                            type: 'string',
                            data: key
                        },
                        value: {
                            type: 'boolean',
                            data: data[key]
                        },
                        keyDescription: objectProperties[key].description,
                        removable: false
                    };
                }
                const defaultValue = elementDefaultValue[key];
                const valueEnumOptions = getEnumOptionsFromSchema(objectProperties[key]);
                return {
                    key: {
                        type: 'enum',
                        data: key,
                        options: wellDefinedKeyEnumOptions,
                    },
                    value: {
                        type: getObjectValueType(objectProperties[key]),
                        data: data[key],
                        options: valueEnumOptions,
                    },
                    keyDescription: objectProperties[key].description,
                    removable: (0, types_1.isUndefinedOrNull)(defaultValue),
                };
            }
            const schema = (_a = patternsAndSchemas.find(({ pattern }) => pattern.test(key))) === null || _a === void 0 ? void 0 : _a.schema;
            if (schema) {
                const valueEnumOptions = getEnumOptionsFromSchema(schema);
                return {
                    key: { type: 'string', data: key },
                    value: {
                        type: getObjectValueType(schema),
                        data: data[key],
                        options: valueEnumOptions,
                    },
                    keyDescription: schema.description,
                    removable: true,
                };
            }
            const additionalValueEnums = getEnumOptionsFromSchema(typeof objectAdditionalProperties === 'boolean'
                ? {}
                : objectAdditionalProperties !== null && objectAdditionalProperties !== void 0 ? objectAdditionalProperties : {});
            return {
                key: { type: 'string', data: key },
                value: {
                    type: typeof objectAdditionalProperties === 'object' ? getObjectValueType(objectAdditionalProperties) : 'string',
                    data: data[key],
                    options: additionalValueEnums,
                },
                keyDescription: typeof objectAdditionalProperties === 'object' ? objectAdditionalProperties.description : undefined,
                removable: true,
            };
        }).filter(item => !(0, types_1.isUndefinedOrNull)(item.value.data));
    }
    function createArraySuggester(element) {
        return (keys, idx) => {
            const enumOptions = [];
            if (element.setting.enum) {
                element.setting.enum.forEach((key, i) => {
                    var _a;
                    // include the currently selected value, even if uniqueItems is true
                    if (!element.setting.uniqueItems || (idx !== undefined && key === keys[idx]) || !keys.includes(key)) {
                        const description = (_a = element.setting.enumDescriptions) === null || _a === void 0 ? void 0 : _a[i];
                        enumOptions.push({ value: key, description });
                    }
                });
            }
            return enumOptions.length > 0
                ? { type: 'enum', data: enumOptions[0].value, options: enumOptions }
                : undefined;
        };
    }
    function createObjectKeySuggester(element) {
        const { objectProperties } = element.setting;
        const allStaticKeys = Object.keys(objectProperties !== null && objectProperties !== void 0 ? objectProperties : {});
        return keys => {
            const existingKeys = new Set(keys);
            const enumOptions = [];
            allStaticKeys.forEach(staticKey => {
                if (!existingKeys.has(staticKey)) {
                    enumOptions.push({ value: staticKey, description: objectProperties[staticKey].description });
                }
            });
            return enumOptions.length > 0
                ? { type: 'enum', data: enumOptions[0].value, options: enumOptions }
                : undefined;
        };
    }
    function createObjectValueSuggester(element) {
        const { objectProperties, objectPatternProperties, objectAdditionalProperties } = element.setting;
        const patternsAndSchemas = Object
            .entries(objectPatternProperties !== null && objectPatternProperties !== void 0 ? objectPatternProperties : {})
            .map(([pattern, schema]) => ({
            pattern: new RegExp(pattern),
            schema
        }));
        return (key) => {
            var _a, _b, _c, _d;
            let suggestedSchema;
            if ((0, types_1.isDefined)(objectProperties) && key in objectProperties) {
                suggestedSchema = objectProperties[key];
            }
            const patternSchema = suggestedSchema !== null && suggestedSchema !== void 0 ? suggestedSchema : (_a = patternsAndSchemas.find(({ pattern }) => pattern.test(key))) === null || _a === void 0 ? void 0 : _a.schema;
            if ((0, types_1.isDefined)(patternSchema)) {
                suggestedSchema = patternSchema;
            }
            else if ((0, types_1.isDefined)(objectAdditionalProperties) && typeof objectAdditionalProperties === 'object') {
                suggestedSchema = objectAdditionalProperties;
            }
            if ((0, types_1.isDefined)(suggestedSchema)) {
                const type = getObjectValueType(suggestedSchema);
                if (type === 'boolean') {
                    return { type, data: (_b = suggestedSchema.default) !== null && _b !== void 0 ? _b : true };
                }
                else if (type === 'enum') {
                    const options = getEnumOptionsFromSchema(suggestedSchema);
                    return { type, data: (_c = suggestedSchema.default) !== null && _c !== void 0 ? _c : options[0].value, options };
                }
                else {
                    return { type, data: (_d = suggestedSchema.default) !== null && _d !== void 0 ? _d : '' };
                }
            }
            return;
        };
    }
    function isNonNullableNumericType(type) {
        return type === 'number' || type === 'integer';
    }
    function parseNumericObjectValues(dataElement, v) {
        const newRecord = {};
        for (const key in v) {
            // Set to true/false once we're sure of the answer
            let keyMatchesNumericProperty;
            const patternProperties = dataElement.setting.objectPatternProperties;
            const properties = dataElement.setting.objectProperties;
            const additionalProperties = dataElement.setting.objectAdditionalProperties;
            // Match the current record key against the properties of the object
            if (properties) {
                for (const propKey in properties) {
                    if (propKey === key) {
                        keyMatchesNumericProperty = isNonNullableNumericType(properties[propKey].type);
                        break;
                    }
                }
            }
            if (keyMatchesNumericProperty === undefined && patternProperties) {
                for (const patternKey in patternProperties) {
                    if (key.match(patternKey)) {
                        keyMatchesNumericProperty = isNonNullableNumericType(patternProperties[patternKey].type);
                        break;
                    }
                }
            }
            if (keyMatchesNumericProperty === undefined && additionalProperties && typeof additionalProperties !== 'boolean') {
                if (isNonNullableNumericType(additionalProperties.type)) {
                    keyMatchesNumericProperty = true;
                }
            }
            newRecord[key] = keyMatchesNumericProperty ? Number(v[key]) : v[key];
        }
        return newRecord;
    }
    function getListDisplayValue(element) {
        if (!element.value || !(0, types_1.isArray)(element.value)) {
            return [];
        }
        if (element.setting.arrayItemType === 'enum') {
            let enumOptions = [];
            if (element.setting.enum) {
                enumOptions = element.setting.enum.map((setting, i) => {
                    var _a;
                    return {
                        value: setting,
                        description: (_a = element.setting.enumDescriptions) === null || _a === void 0 ? void 0 : _a[i]
                    };
                });
            }
            return element.value.map((key) => {
                return {
                    value: {
                        type: 'enum',
                        data: key,
                        options: enumOptions
                    }
                };
            });
        }
        else {
            return element.value.map((key) => {
                return {
                    value: {
                        type: 'string',
                        data: key
                    }
                };
            });
        }
    }
    function getShowAddButtonList(dataElement, listDisplayValue) {
        if (dataElement.setting.enum && dataElement.setting.uniqueItems) {
            return dataElement.setting.enum.length - listDisplayValue.length > 0;
        }
        else {
            return true;
        }
    }
    function resolveSettingsTree(tocData, coreSettingsGroups, logService) {
        const allSettings = getFlatSettings(coreSettingsGroups);
        return {
            tree: _resolveSettingsTree(tocData, allSettings, logService),
            leftoverSettings: allSettings
        };
    }
    exports.resolveSettingsTree = resolveSettingsTree;
    function resolveConfiguredUntrustedSettings(groups, target, languageFilter, configurationService) {
        const allSettings = getFlatSettings(groups);
        return [...allSettings].filter(setting => setting.restricted && (0, settingsTreeModels_1.inspectSetting)(setting.key, target, languageFilter, configurationService).isConfigured);
    }
    exports.resolveConfiguredUntrustedSettings = resolveConfiguredUntrustedSettings;
    function compareNullableIntegers(a, b) {
        const firstElem = a !== null && a !== void 0 ? a : Number.MAX_SAFE_INTEGER;
        const secondElem = b !== null && b !== void 0 ? b : Number.MAX_SAFE_INTEGER;
        return firstElem - secondElem;
    }
    async function createTocTreeForExtensionSettings(extensionService, groups) {
        const extGroupTree = new Map();
        const addEntryToTree = (extensionId, extensionName, childEntry) => {
            if (!extGroupTree.has(extensionId)) {
                const rootEntry = {
                    id: extensionId,
                    label: extensionName,
                    children: []
                };
                extGroupTree.set(extensionId, rootEntry);
            }
            extGroupTree.get(extensionId).children.push(childEntry);
        };
        const processGroupEntry = async (group) => {
            var _a, _b;
            const flatSettings = arrays.flatten(group.sections.map(section => section.settings));
            const extensionId = group.extensionInfo.id;
            const extension = await extensionService.getExtension(extensionId);
            const extensionName = (_b = (_a = extension === null || extension === void 0 ? void 0 : extension.displayName) !== null && _a !== void 0 ? _a : extension === null || extension === void 0 ? void 0 : extension.name) !== null && _b !== void 0 ? _b : extensionId;
            // Each group represents a single category of settings.
            // If the extension author forgets to specify an id for the group,
            // fall back to the title given to the group.
            const childEntry = {
                id: group.id || group.title,
                label: group.title,
                order: group.order,
                settings: flatSettings
            };
            addEntryToTree(extensionId, extensionName, childEntry);
        };
        const processPromises = groups.map(g => processGroupEntry(g));
        return Promise.all(processPromises).then(() => {
            var _a;
            const extGroups = [];
            for (const extensionRootEntry of extGroupTree.values()) {
                for (const child of extensionRootEntry.children) {
                    // Sort the individual settings of the child.
                    (_a = child.settings) === null || _a === void 0 ? void 0 : _a.sort((a, b) => {
                        return compareNullableIntegers(a.order, b.order);
                    });
                }
                if (extensionRootEntry.children.length === 1) {
                    // There is a single category for this extension.
                    // Push a flattened setting.
                    extGroups.push({
                        id: extensionRootEntry.id,
                        label: extensionRootEntry.children[0].label,
                        settings: extensionRootEntry.children[0].settings
                    });
                }
                else {
                    // Sort the categories.
                    extensionRootEntry.children.sort((a, b) => {
                        return compareNullableIntegers(a.order, b.order);
                    });
                    // If there is a category that matches the setting name,
                    // add the settings in manually as "ungrouped" settings.
                    // https://github.com/microsoft/vscode/issues/137259
                    const ungroupedChild = extensionRootEntry.children.find(child => child.label === extensionRootEntry.label);
                    if (ungroupedChild && !ungroupedChild.children) {
                        const groupedChildren = extensionRootEntry.children.filter(child => child !== ungroupedChild);
                        extGroups.push({
                            id: extensionRootEntry.id,
                            label: extensionRootEntry.label,
                            settings: ungroupedChild.settings,
                            children: groupedChildren
                        });
                    }
                    else {
                        // Push all the groups as-is.
                        extGroups.push(extensionRootEntry);
                    }
                }
            }
            // Sort the outermost settings.
            extGroups.sort((a, b) => a.label.localeCompare(b.label));
            return {
                id: 'extensions',
                label: (0, nls_1.localize)('extensions', "Extensions"),
                children: extGroups
            };
        });
    }
    exports.createTocTreeForExtensionSettings = createTocTreeForExtensionSettings;
    function _resolveSettingsTree(tocData, allSettings, logService) {
        let children;
        if (tocData.children) {
            children = tocData.children
                .map(child => _resolveSettingsTree(child, allSettings, logService))
                .filter(child => (child.children && child.children.length) || (child.settings && child.settings.length));
        }
        let settings;
        if (tocData.settings) {
            settings = arrays.flatten(tocData.settings.map(pattern => getMatchingSettings(allSettings, pattern, logService)));
        }
        if (!children && !settings) {
            throw new Error(`TOC node has no child groups or settings: ${tocData.id}`);
        }
        return {
            id: tocData.id,
            label: tocData.label,
            children,
            settings
        };
    }
    const knownDynamicSettingGroups = [
        /^settingsSync\..*/,
        /^sync\..*/,
        /^workbench.fontAliasing$/,
    ];
    function getMatchingSettings(allSettings, pattern, logService) {
        const result = [];
        allSettings.forEach(s => {
            if (settingMatches(s, pattern)) {
                result.push(s);
                allSettings.delete(s);
            }
        });
        if (!result.length && !knownDynamicSettingGroups.some(r => r.test(pattern))) {
            logService.warn(`Settings pattern "${pattern}" doesn't match any settings`);
        }
        return result.sort((a, b) => a.key.localeCompare(b.key));
    }
    const settingPatternCache = new Map();
    function createSettingMatchRegExp(pattern) {
        pattern = (0, strings_1.escapeRegExpCharacters)(pattern)
            .replace(/\\\*/g, '.*');
        return new RegExp(`^${pattern}$`, 'i');
    }
    exports.createSettingMatchRegExp = createSettingMatchRegExp;
    function settingMatches(s, pattern) {
        let regExp = settingPatternCache.get(pattern);
        if (!regExp) {
            regExp = createSettingMatchRegExp(pattern);
            settingPatternCache.set(pattern, regExp);
        }
        return regExp.test(s.key);
    }
    function getFlatSettings(settingsGroups) {
        const result = new Set();
        for (const group of settingsGroups) {
            for (const section of group.sections) {
                for (const s of section.settings) {
                    if (!s.overrides || !s.overrides.length) {
                        result.add(s);
                    }
                }
            }
        }
        return result;
    }
    const SETTINGS_UNTRUSTED_TEMPLATE_ID = 'settings.untrusted.template';
    const SETTINGS_TEXT_TEMPLATE_ID = 'settings.text.template';
    const SETTINGS_MULTILINE_TEXT_TEMPLATE_ID = 'settings.multilineText.template';
    const SETTINGS_NUMBER_TEMPLATE_ID = 'settings.number.template';
    const SETTINGS_ENUM_TEMPLATE_ID = 'settings.enum.template';
    const SETTINGS_BOOL_TEMPLATE_ID = 'settings.bool.template';
    const SETTINGS_ARRAY_TEMPLATE_ID = 'settings.array.template';
    const SETTINGS_EXCLUDE_TEMPLATE_ID = 'settings.exclude.template';
    const SETTINGS_OBJECT_TEMPLATE_ID = 'settings.object.template';
    const SETTINGS_BOOL_OBJECT_TEMPLATE_ID = 'settings.boolObject.template';
    const SETTINGS_COMPLEX_TEMPLATE_ID = 'settings.complex.template';
    const SETTINGS_NEW_EXTENSIONS_TEMPLATE_ID = 'settings.newExtensions.template';
    const SETTINGS_ELEMENT_TEMPLATE_ID = 'settings.group.template';
    function removeChildrenFromTabOrder(node) {
        const focusableElements = node.querySelectorAll(`
		[tabindex="0"],
		input:not([tabindex="-1"]),
		select:not([tabindex="-1"]),
		textarea:not([tabindex="-1"]),
		a:not([tabindex="-1"]),
		button:not([tabindex="-1"]),
		area:not([tabindex="-1"])
	`);
        focusableElements.forEach(element => {
            element.setAttribute(AbstractSettingRenderer.ELEMENT_FOCUSABLE_ATTR, 'true');
            element.setAttribute('tabindex', '-1');
        });
    }
    function addChildrenToTabOrder(node) {
        const focusableElements = node.querySelectorAll(`[${AbstractSettingRenderer.ELEMENT_FOCUSABLE_ATTR}="true"]`);
        focusableElements.forEach(element => {
            element.removeAttribute(AbstractSettingRenderer.ELEMENT_FOCUSABLE_ATTR);
            element.setAttribute('tabindex', '0');
        });
    }
    let AbstractSettingRenderer = class AbstractSettingRenderer extends lifecycle_1.Disposable {
        constructor(settingActions, disposableActionFactory, _themeService, _contextViewService, _openerService, _instantiationService, _commandService, _contextMenuService, _keybindingService, _configService) {
            super();
            this.settingActions = settingActions;
            this.disposableActionFactory = disposableActionFactory;
            this._themeService = _themeService;
            this._contextViewService = _contextViewService;
            this._openerService = _openerService;
            this._instantiationService = _instantiationService;
            this._commandService = _commandService;
            this._contextMenuService = _contextMenuService;
            this._keybindingService = _keybindingService;
            this._configService = _configService;
            this._onDidClickOverrideElement = this._register(new event_1.Emitter());
            this.onDidClickOverrideElement = this._onDidClickOverrideElement.event;
            this._onDidChangeSetting = this._register(new event_1.Emitter());
            this.onDidChangeSetting = this._onDidChangeSetting.event;
            this._onDidOpenSettings = this._register(new event_1.Emitter());
            this.onDidOpenSettings = this._onDidOpenSettings.event;
            this._onDidClickSettingLink = this._register(new event_1.Emitter());
            this.onDidClickSettingLink = this._onDidClickSettingLink.event;
            this._onDidFocusSetting = this._register(new event_1.Emitter());
            this.onDidFocusSetting = this._onDidFocusSetting.event;
            this._onDidChangeIgnoredSettings = this._register(new event_1.Emitter());
            this.onDidChangeIgnoredSettings = this._onDidChangeIgnoredSettings.event;
            this._onDidChangeSettingHeight = this._register(new event_1.Emitter());
            this.onDidChangeSettingHeight = this._onDidChangeSettingHeight.event;
            this._onApplyLanguageFilter = this._register(new event_1.Emitter());
            this.onApplyLanguageFilter = this._onApplyLanguageFilter.event;
            this.markdownRenderer = this._register(_instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {}));
            this.ignoredSettings = (0, settingsMerge_1.getIgnoredSettings)((0, userDataSync_1.getDefaultIgnoredSettings)(), this._configService);
            this._register(this._configService.onDidChangeConfiguration(e => {
                this.ignoredSettings = (0, settingsMerge_1.getIgnoredSettings)((0, userDataSync_1.getDefaultIgnoredSettings)(), this._configService);
                this._onDidChangeIgnoredSettings.fire();
            }));
        }
        renderCommonTemplate(tree, _container, typeClass) {
            _container.classList.add('setting-item');
            _container.classList.add('setting-item-' + typeClass);
            const container = DOM.append(_container, $(AbstractSettingRenderer.CONTENTS_SELECTOR));
            container.classList.add('settings-row-inner-container');
            const titleElement = DOM.append(container, $('.setting-item-title'));
            const labelCategoryContainer = DOM.append(titleElement, $('.setting-item-cat-label-container'));
            const categoryElement = DOM.append(labelCategoryContainer, $('span.setting-item-category'));
            const labelElementContainer = DOM.append(labelCategoryContainer, $('span.setting-item-label'));
            const labelElement = new simpleIconLabel_1.SimpleIconLabel(labelElementContainer);
            const miscLabel = new SettingsTreeMiscLabel(titleElement);
            const descriptionElement = DOM.append(container, $('.setting-item-description'));
            const modifiedIndicatorElement = DOM.append(container, $('.setting-item-modified-indicator'));
            modifiedIndicatorElement.title = (0, nls_1.localize)('modified', "The setting has been configured in the current scope.");
            const valueElement = DOM.append(container, $('.setting-item-value'));
            const controlElement = DOM.append(valueElement, $('div.setting-item-control'));
            const deprecationWarningElement = DOM.append(container, $('.setting-item-deprecation-message'));
            const toDispose = new lifecycle_1.DisposableStore();
            const toolbarContainer = DOM.append(container, $('.setting-toolbar-container'));
            const toolbar = this.renderSettingToolbar(toolbarContainer);
            const template = {
                toDispose,
                elementDisposables: new lifecycle_1.DisposableStore(),
                containerElement: container,
                categoryElement,
                labelElement,
                descriptionElement,
                controlElement,
                deprecationWarningElement,
                miscLabel,
                toolbar
            };
            // Prevent clicks from being handled by list
            toDispose.add(DOM.addDisposableListener(controlElement, DOM.EventType.MOUSE_DOWN, e => e.stopPropagation()));
            toDispose.add(DOM.addDisposableListener(titleElement, DOM.EventType.MOUSE_ENTER, e => container.classList.add('mouseover')));
            toDispose.add(DOM.addDisposableListener(titleElement, DOM.EventType.MOUSE_LEAVE, e => container.classList.remove('mouseover')));
            return template;
        }
        addSettingElementFocusHandler(template) {
            const focusTracker = DOM.trackFocus(template.containerElement);
            template.toDispose.add(focusTracker);
            focusTracker.onDidBlur(() => {
                if (template.containerElement.classList.contains('focused')) {
                    template.containerElement.classList.remove('focused');
                }
            });
            focusTracker.onDidFocus(() => {
                template.containerElement.classList.add('focused');
                if (template.context) {
                    this._onDidFocusSetting.fire(template.context);
                }
            });
        }
        renderSettingToolbar(container) {
            const toggleMenuKeybinding = this._keybindingService.lookupKeybinding(preferences_1.SETTINGS_EDITOR_COMMAND_SHOW_CONTEXT_MENU);
            let toggleMenuTitle = (0, nls_1.localize)('settingsContextMenuTitle', "More Actions... ");
            if (toggleMenuKeybinding) {
                toggleMenuTitle += ` (${toggleMenuKeybinding && toggleMenuKeybinding.getLabel()})`;
            }
            const toolbar = new toolbar_1.ToolBar(container, this._contextMenuService, {
                toggleMenuTitle,
                renderDropdownAsChildElement: !platform_1.isIOS,
                moreIcon: preferencesIcons_1.settingsMoreActionIcon
            });
            return toolbar;
        }
        renderSettingElement(node, index, template) {
            const element = node.element;
            template.context = element;
            template.toolbar.context = element;
            const actions = this.disposableActionFactory(element.setting);
            actions.forEach(a => { var _a; return (_a = template.elementDisposables) === null || _a === void 0 ? void 0 : _a.add(a); });
            template.toolbar.setActions([], [...this.settingActions, ...actions]);
            const setting = element.setting;
            template.containerElement.classList.toggle('is-configured', element.isConfigured);
            template.containerElement.setAttribute(AbstractSettingRenderer.SETTING_KEY_ATTR, element.setting.key);
            template.containerElement.setAttribute(AbstractSettingRenderer.SETTING_ID_ATTR, element.id);
            const titleTooltip = setting.key + (element.isConfigured ? ' - Modified' : '');
            template.categoryElement.textContent = element.displayCategory && (element.displayCategory + ': ');
            template.categoryElement.title = titleTooltip;
            template.labelElement.text = element.displayLabel;
            template.labelElement.title = titleTooltip;
            template.descriptionElement.innerText = '';
            if (element.setting.descriptionIsMarkdown) {
                const disposables = new lifecycle_1.DisposableStore();
                template.elementDisposables.add(disposables);
                const renderedDescription = this.renderSettingMarkdown(element, template.containerElement, element.description, disposables);
                template.descriptionElement.appendChild(renderedDescription);
            }
            else {
                template.descriptionElement.innerText = element.description;
            }
            template.miscLabel.updateOtherOverrides(element, template.elementDisposables, this._onDidClickOverrideElement);
            const onChange = (value) => this._onDidChangeSetting.fire({ key: element.setting.key, value, type: template.context.valueType, manualReset: false });
            const deprecationText = element.setting.deprecationMessage || '';
            if (deprecationText && element.setting.deprecationMessageIsMarkdown) {
                const disposables = new lifecycle_1.DisposableStore();
                template.elementDisposables.add(disposables);
                template.deprecationWarningElement.innerText = '';
                template.deprecationWarningElement.appendChild(this.renderSettingMarkdown(element, template.containerElement, element.setting.deprecationMessage, template.elementDisposables));
            }
            else {
                template.deprecationWarningElement.innerText = deprecationText;
            }
            template.deprecationWarningElement.prepend($('.codicon.codicon-error'));
            template.containerElement.classList.toggle('is-deprecated', !!deprecationText);
            this.renderValue(element, template, onChange);
            template.miscLabel.updateSyncIgnored(element, this.ignoredSettings);
            template.miscLabel.updateDefaultOverrideIndicator(element);
            template.elementDisposables.add(this.onDidChangeIgnoredSettings(() => {
                template.miscLabel.updateSyncIgnored(element, this.ignoredSettings);
            }));
            this.updateSettingTabbable(element, template);
            template.elementDisposables.add(element.onDidChangeTabbable(() => {
                this.updateSettingTabbable(element, template);
            }));
        }
        updateSettingTabbable(element, template) {
            if (element.tabbable) {
                addChildrenToTabOrder(template.containerElement);
            }
            else {
                removeChildrenFromTabOrder(template.containerElement);
            }
        }
        renderSettingMarkdown(element, container, text, disposeables) {
            // Rewrite `#editor.fontSize#` to link format
            text = fixSettingLinks(text);
            const renderedMarkdown = this.markdownRenderer.render({ value: text, isTrusted: true }, {
                actionHandler: {
                    callback: (content) => {
                        if (content.startsWith('#')) {
                            const e = {
                                source: element,
                                targetKey: content.substring(1)
                            };
                            this._onDidClickSettingLink.fire(e);
                        }
                        else {
                            this._openerService.open(content, { allowCommands: true }).catch(errors_1.onUnexpectedError);
                        }
                    },
                    disposables: disposeables
                },
                asyncRenderCallback: () => {
                    const height = container.clientHeight;
                    if (height) {
                        this._onDidChangeSettingHeight.fire({ element, height });
                    }
                },
            });
            disposeables.add(renderedMarkdown);
            renderedMarkdown.element.classList.add('setting-item-markdown');
            cleanRenderedMarkdown(renderedMarkdown.element);
            return renderedMarkdown.element;
        }
        disposeTemplate(template) {
            (0, lifecycle_1.dispose)(template.toDispose);
        }
        disposeElement(_element, _index, template, _height) {
            if (template.elementDisposables) {
                template.elementDisposables.clear();
            }
        }
    };
    AbstractSettingRenderer.CONTROL_CLASS = 'setting-control-focus-target';
    AbstractSettingRenderer.CONTROL_SELECTOR = '.' + AbstractSettingRenderer.CONTROL_CLASS;
    AbstractSettingRenderer.CONTENTS_CLASS = 'setting-item-contents';
    AbstractSettingRenderer.CONTENTS_SELECTOR = '.' + AbstractSettingRenderer.CONTENTS_CLASS;
    AbstractSettingRenderer.ALL_ROWS_SELECTOR = '.monaco-list-row';
    AbstractSettingRenderer.SETTING_KEY_ATTR = 'data-key';
    AbstractSettingRenderer.SETTING_ID_ATTR = 'data-id';
    AbstractSettingRenderer.ELEMENT_FOCUSABLE_ATTR = 'data-focusable';
    AbstractSettingRenderer = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, contextView_1.IContextViewService),
        __param(4, opener_1.IOpenerService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, commands_1.ICommandService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, configuration_1.IConfigurationService)
    ], AbstractSettingRenderer);
    exports.AbstractSettingRenderer = AbstractSettingRenderer;
    class SettingGroupRenderer {
        constructor() {
            this.templateId = SETTINGS_ELEMENT_TEMPLATE_ID;
        }
        renderTemplate(container) {
            container.classList.add('group-title');
            const template = {
                parent: container,
                toDispose: new lifecycle_1.DisposableStore()
            };
            return template;
        }
        renderElement(element, index, templateData) {
            templateData.parent.innerText = '';
            const labelElement = DOM.append(templateData.parent, $('div.settings-group-title-label.settings-row-inner-container'));
            labelElement.classList.add(`settings-group-level-${element.element.level}`);
            labelElement.textContent = element.element.label;
            if (element.element.isFirstGroup) {
                labelElement.classList.add('settings-group-first');
            }
        }
        disposeTemplate(templateData) {
        }
    }
    exports.SettingGroupRenderer = SettingGroupRenderer;
    let SettingNewExtensionsRenderer = class SettingNewExtensionsRenderer {
        constructor(_themeService, _commandService) {
            this._themeService = _themeService;
            this._commandService = _commandService;
            this.templateId = SETTINGS_NEW_EXTENSIONS_TEMPLATE_ID;
        }
        renderTemplate(container) {
            const toDispose = new lifecycle_1.DisposableStore();
            container.classList.add('setting-item-new-extensions');
            const button = new button_1.Button(container, { title: true, buttonBackground: undefined, buttonHoverBackground: undefined });
            toDispose.add(button);
            toDispose.add(button.onDidClick(() => {
                if (template.context) {
                    this._commandService.executeCommand('workbench.extensions.action.showExtensionsWithIds', template.context.extensionIds);
                }
            }));
            button.label = (0, nls_1.localize)('newExtensionsButtonLabel', "Show matching extensions");
            button.element.classList.add('settings-new-extensions-button');
            toDispose.add((0, styler_1.attachButtonStyler)(button, this._themeService));
            const template = {
                button,
                toDispose
            };
            return template;
        }
        renderElement(element, index, templateData) {
            templateData.context = element.element;
        }
        disposeTemplate(template) {
            (0, lifecycle_1.dispose)(template.toDispose);
        }
    };
    SettingNewExtensionsRenderer = __decorate([
        __param(0, themeService_1.IThemeService),
        __param(1, commands_1.ICommandService)
    ], SettingNewExtensionsRenderer);
    exports.SettingNewExtensionsRenderer = SettingNewExtensionsRenderer;
    class SettingComplexRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_COMPLEX_TEMPLATE_ID;
        }
        renderTemplate(container) {
            const common = this.renderCommonTemplate(null, container, 'complex');
            const openSettingsButton = new button_1.Button(common.controlElement, { title: true, buttonBackground: undefined, buttonHoverBackground: undefined });
            common.toDispose.add(openSettingsButton);
            openSettingsButton.element.classList.add('edit-in-settings-button');
            openSettingsButton.element.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            common.toDispose.add((0, styler_1.attachButtonStyler)(openSettingsButton, this._themeService, {
                buttonBackground: color_1.Color.transparent.toString(),
                buttonHoverBackground: color_1.Color.transparent.toString(),
                buttonForeground: 'foreground'
            }));
            const validationErrorMessageElement = $('.setting-item-validation-message');
            common.containerElement.appendChild(validationErrorMessageElement);
            const template = Object.assign(Object.assign({}, common), { button: openSettingsButton, validationErrorMessageElement });
            this.addSettingElementFocusHandler(template);
            return template;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            const plainKey = (0, configuration_1.getLanguageTagSettingPlainKey)(dataElement.setting.key);
            const editLanguageSettingLabel = (0, nls_1.localize)('editLanguageSettingLabel', "Edit settings for {0}", plainKey);
            const isLanguageTagSetting = dataElement.setting.isLanguageTagSetting;
            template.button.label = isLanguageTagSetting
                ? editLanguageSettingLabel
                : SettingComplexRenderer.EDIT_IN_JSON_LABEL;
            template.elementDisposables.add(template.button.onDidClick(() => {
                if (isLanguageTagSetting) {
                    this._onApplyLanguageFilter.fire(plainKey);
                }
                else {
                    this._onDidOpenSettings.fire(dataElement.setting.key);
                }
            }));
            this.renderValidations(dataElement, template);
            if (isLanguageTagSetting) {
                template.button.element.setAttribute('aria-label', editLanguageSettingLabel);
            }
            else {
                template.button.element.setAttribute('aria-label', `${SettingComplexRenderer.EDIT_IN_JSON_LABEL}: ${dataElement.setting.key}`);
            }
        }
        renderValidations(dataElement, template) {
            const errMsg = dataElement.isConfigured && (0, preferencesValidation_1.getInvalidTypeError)(dataElement.value, dataElement.setting.type);
            if (errMsg) {
                template.containerElement.classList.add('invalid-input');
                template.validationErrorMessageElement.innerText = errMsg;
                return;
            }
            template.containerElement.classList.remove('invalid-input');
        }
    }
    exports.SettingComplexRenderer = SettingComplexRenderer;
    SettingComplexRenderer.EDIT_IN_JSON_LABEL = (0, nls_1.localize)('editInSettingsJson', "Edit in settings.json");
    class SettingArrayRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_ARRAY_TEMPLATE_ID;
        }
        renderTemplate(container) {
            const common = this.renderCommonTemplate(null, container, 'list');
            const descriptionElement = common.containerElement.querySelector('.setting-item-description');
            const validationErrorMessageElement = $('.setting-item-validation-message');
            descriptionElement.after(validationErrorMessageElement);
            const listWidget = this._instantiationService.createInstance(settingsWidgets_1.ListSettingWidget, common.controlElement);
            listWidget.domNode.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            common.toDispose.add(listWidget);
            const template = Object.assign(Object.assign({}, common), { listWidget,
                validationErrorMessageElement });
            this.addSettingElementFocusHandler(template);
            common.toDispose.add(listWidget.onDidChangeList(e => {
                const newList = this.computeNewList(template, e);
                if (template.onChange) {
                    template.onChange(newList);
                }
            }));
            return template;
        }
        computeNewList(template, e) {
            var _a, _b, _c, _d, _e;
            if (template.context) {
                let newValue = [];
                if ((0, types_1.isArray)(template.context.scopeValue)) {
                    newValue = [...template.context.scopeValue];
                }
                else if ((0, types_1.isArray)(template.context.value)) {
                    newValue = [...template.context.value];
                }
                if (e.sourceIndex !== undefined) {
                    // A drag and drop occurred
                    const sourceIndex = e.sourceIndex;
                    const targetIndex = e.targetIndex;
                    const splicedElem = newValue.splice(sourceIndex, 1)[0];
                    newValue.splice(targetIndex, 0, splicedElem);
                }
                else if (e.targetIndex !== undefined) {
                    const itemValueData = (_b = (_a = e.item) === null || _a === void 0 ? void 0 : _a.value.data.toString()) !== null && _b !== void 0 ? _b : '';
                    // Delete value
                    if (!((_c = e.item) === null || _c === void 0 ? void 0 : _c.value.data) && e.originalItem.value.data && e.targetIndex > -1) {
                        newValue.splice(e.targetIndex, 1);
                    }
                    // Update value
                    else if (((_d = e.item) === null || _d === void 0 ? void 0 : _d.value.data) && e.originalItem.value.data) {
                        if (e.targetIndex > -1) {
                            newValue[e.targetIndex] = itemValueData;
                        }
                        // For some reason, we are updating and cannot find original value
                        // Just append the value in this case
                        else {
                            newValue.push(itemValueData);
                        }
                    }
                    // Add value
                    else if (((_e = e.item) === null || _e === void 0 ? void 0 : _e.value.data) && !e.originalItem.value.data && e.targetIndex >= newValue.length) {
                        newValue.push(itemValueData);
                    }
                }
                if (template.context.defaultValue &&
                    (0, types_1.isArray)(template.context.defaultValue) &&
                    template.context.defaultValue.length === newValue.length &&
                    template.context.defaultValue.join() === newValue.join()) {
                    return undefined;
                }
                return newValue;
            }
            return undefined;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            const value = getListDisplayValue(dataElement);
            const keySuggester = dataElement.setting.enum ? createArraySuggester(dataElement) : undefined;
            template.listWidget.setValue(value, {
                showAddButton: getShowAddButtonList(dataElement, value),
                keySuggester
            });
            template.context = dataElement;
            template.elementDisposables.add((0, lifecycle_1.toDisposable)(() => {
                template.listWidget.cancelEdit();
            }));
            template.onChange = (v) => {
                if (v && !renderArrayValidations(dataElement, template, v, false)) {
                    const itemType = dataElement.setting.arrayItemType;
                    const arrToSave = isNonNullableNumericType(itemType) ? v.map(a => +a) : v;
                    onChange(arrToSave);
                }
                else {
                    // Save the setting unparsed and containing the errors.
                    // renderArrayValidations will render relevant error messages.
                    onChange(v);
                }
            };
            renderArrayValidations(dataElement, template, value.map(v => v.value.data.toString()), true);
        }
    }
    exports.SettingArrayRenderer = SettingArrayRenderer;
    class AbstractSettingObjectRenderer extends AbstractSettingRenderer {
        renderTemplateWithWidget(common, widget) {
            widget.domNode.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            common.toDispose.add(widget);
            const descriptionElement = common.containerElement.querySelector('.setting-item-description');
            const validationErrorMessageElement = $('.setting-item-validation-message');
            descriptionElement.after(validationErrorMessageElement);
            const template = Object.assign(Object.assign({}, common), { validationErrorMessageElement });
            if (widget instanceof settingsWidgets_1.ObjectSettingCheckboxWidget) {
                template.objectCheckboxWidget = widget;
            }
            else {
                template.objectDropdownWidget = widget;
            }
            this.addSettingElementFocusHandler(template);
            common.toDispose.add(widget.onDidChangeList(e => {
                this.onDidChangeObject(template, e);
            }));
            return template;
        }
        onDidChangeObject(template, e) {
            var _a, _b, _c;
            const widget = ((_a = template.objectCheckboxWidget) !== null && _a !== void 0 ? _a : template.objectDropdownWidget);
            if (template.context) {
                const defaultValue = typeof template.context.defaultValue === 'object'
                    ? (_b = template.context.defaultValue) !== null && _b !== void 0 ? _b : {}
                    : {};
                const scopeValue = typeof template.context.scopeValue === 'object'
                    ? (_c = template.context.scopeValue) !== null && _c !== void 0 ? _c : {}
                    : {};
                const newValue = {};
                const newItems = [];
                widget.items.forEach((item, idx) => {
                    // Item was updated
                    if ((0, types_1.isDefined)(e.item) && e.targetIndex === idx) {
                        newValue[e.item.key.data] = e.item.value.data;
                        newItems.push(e.item);
                    }
                    // All remaining items, but skip the one that we just updated
                    else if ((0, types_1.isUndefinedOrNull)(e.item) || e.item.key.data !== item.key.data) {
                        newValue[item.key.data] = item.value.data;
                        newItems.push(item);
                    }
                });
                // Item was deleted
                if ((0, types_1.isUndefinedOrNull)(e.item)) {
                    delete newValue[e.originalItem.key.data];
                    const itemToDelete = newItems.findIndex(item => item.key.data === e.originalItem.key.data);
                    const defaultItemValue = defaultValue[e.originalItem.key.data];
                    // Item does not have a default
                    if ((0, types_1.isUndefinedOrNull)(defaultValue[e.originalItem.key.data]) && itemToDelete > -1) {
                        newItems.splice(itemToDelete, 1);
                    }
                    else if (itemToDelete > -1) {
                        newItems[itemToDelete].value.data = defaultItemValue;
                    }
                }
                // New item was added
                else if (widget.isItemNew(e.originalItem) && e.item.key.data !== '') {
                    newValue[e.item.key.data] = e.item.value.data;
                    newItems.push(e.item);
                }
                if (template.objectCheckboxWidget) {
                    Object.entries(newValue).forEach(([key, value]) => {
                        // A value from the scope has changed back to the default.
                        // For the bool object renderer, we don't want to save these values.
                        if (scopeValue[key] !== value && defaultValue[key] === value) {
                            delete newValue[key];
                        }
                    });
                    template.objectCheckboxWidget.setValue(newItems);
                }
                else {
                    template.objectDropdownWidget.setValue(newItems);
                }
                if (template.onChange) {
                    template.onChange(newValue);
                }
            }
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
    }
    class SettingObjectRenderer extends AbstractSettingObjectRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_OBJECT_TEMPLATE_ID;
        }
        renderTemplate(container) {
            const common = this.renderCommonTemplate(null, container, 'list');
            const widget = this._instantiationService.createInstance(settingsWidgets_1.ObjectSettingDropdownWidget, common.controlElement);
            return this.renderTemplateWithWidget(common, widget);
        }
        renderValue(dataElement, template, onChange) {
            const items = getObjectDisplayValue(dataElement);
            const { key, objectProperties, objectPatternProperties, objectAdditionalProperties } = dataElement.setting;
            template.objectDropdownWidget.setValue(items, {
                settingKey: key,
                showAddButton: objectAdditionalProperties === false
                    ? (!areAllPropertiesDefined(Object.keys(objectProperties !== null && objectProperties !== void 0 ? objectProperties : {}), items) ||
                        (0, types_1.isDefined)(objectPatternProperties))
                    : true,
                keySuggester: createObjectKeySuggester(dataElement),
                valueSuggester: createObjectValueSuggester(dataElement)
            });
            template.context = dataElement;
            template.elementDisposables.add((0, lifecycle_1.toDisposable)(() => {
                template.objectDropdownWidget.cancelEdit();
            }));
            template.onChange = (v) => {
                if (v && !renderArrayValidations(dataElement, template, v, false)) {
                    const parsedRecord = parseNumericObjectValues(dataElement, v);
                    onChange(parsedRecord);
                }
                else {
                    // Save the setting unparsed and containing the errors.
                    // renderArrayValidations will render relevant error messages.
                    onChange(v);
                }
            };
            renderArrayValidations(dataElement, template, dataElement.value, true);
        }
    }
    exports.SettingObjectRenderer = SettingObjectRenderer;
    class SettingBoolObjectRenderer extends AbstractSettingObjectRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_BOOL_OBJECT_TEMPLATE_ID;
        }
        renderTemplate(container) {
            const common = this.renderCommonTemplate(null, container, 'list');
            const widget = this._instantiationService.createInstance(settingsWidgets_1.ObjectSettingCheckboxWidget, common.controlElement);
            return this.renderTemplateWithWidget(common, widget);
        }
        onDidChangeObject(template, e) {
            if (template.context) {
                super.onDidChangeObject(template, e);
                // Focus this setting explicitly, in case we were previously
                // focused on another setting and clicked a checkbox/value container
                // for this setting.
                this._onDidFocusSetting.fire(template.context);
            }
        }
        renderValue(dataElement, template, onChange) {
            const items = getObjectDisplayValue(dataElement);
            const { key } = dataElement.setting;
            template.objectCheckboxWidget.setValue(items, {
                settingKey: key
            });
            template.context = dataElement;
            template.onChange = (v) => {
                onChange(v);
            };
        }
    }
    exports.SettingBoolObjectRenderer = SettingBoolObjectRenderer;
    class SettingExcludeRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_EXCLUDE_TEMPLATE_ID;
        }
        renderTemplate(container) {
            const common = this.renderCommonTemplate(null, container, 'list');
            const excludeWidget = this._instantiationService.createInstance(settingsWidgets_1.ExcludeSettingWidget, common.controlElement);
            excludeWidget.domNode.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            common.toDispose.add(excludeWidget);
            const template = Object.assign(Object.assign({}, common), { excludeWidget });
            this.addSettingElementFocusHandler(template);
            common.toDispose.add(excludeWidget.onDidChangeList(e => this.onDidChangeExclude(template, e)));
            return template;
        }
        onDidChangeExclude(template, e) {
            var _a;
            if (template.context) {
                const newValue = Object.assign({}, template.context.scopeValue);
                // first delete the existing entry, if present
                if (e.originalItem.value.data.toString() in template.context.defaultValue) {
                    // delete a default by overriding it
                    newValue[e.originalItem.value.data.toString()] = false;
                }
                else {
                    delete newValue[e.originalItem.value.data.toString()];
                }
                // then add the new or updated entry, if present
                if ((_a = e.item) === null || _a === void 0 ? void 0 : _a.value) {
                    if (e.item.value.data.toString() in template.context.defaultValue && !e.item.sibling) {
                        // add a default by deleting its override
                        delete newValue[e.item.value.data.toString()];
                    }
                    else {
                        newValue[e.item.value.data.toString()] = e.item.sibling ? { when: e.item.sibling } : true;
                    }
                }
                function sortKeys(obj) {
                    const sortedKeys = Object.keys(obj)
                        .sort((a, b) => a.localeCompare(b));
                    const retVal = {};
                    for (const key of sortedKeys) {
                        retVal[key] = obj[key];
                    }
                    return retVal;
                }
                this._onDidChangeSetting.fire({
                    key: template.context.setting.key,
                    value: Object.keys(newValue).length === 0 ? undefined : sortKeys(newValue),
                    type: template.context.valueType,
                    manualReset: false
                });
            }
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            const value = getExcludeDisplayValue(dataElement);
            template.excludeWidget.setValue(value);
            template.context = dataElement;
            template.elementDisposables.add((0, lifecycle_1.toDisposable)(() => {
                template.excludeWidget.cancelEdit();
            }));
        }
    }
    exports.SettingExcludeRenderer = SettingExcludeRenderer;
    class AbstractSettingTextRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.MULTILINE_MAX_HEIGHT = 150;
        }
        renderTemplate(_container, useMultiline) {
            const common = this.renderCommonTemplate(null, _container, 'text');
            const validationErrorMessageElement = DOM.append(common.containerElement, $('.setting-item-validation-message'));
            const inputBoxOptions = {
                flexibleHeight: useMultiline,
                flexibleWidth: false,
                flexibleMaxHeight: this.MULTILINE_MAX_HEIGHT
            };
            const inputBox = new inputBox_1.InputBox(common.controlElement, this._contextViewService, inputBoxOptions);
            common.toDispose.add(inputBox);
            common.toDispose.add((0, styler_1.attachInputBoxStyler)(inputBox, this._themeService, {
                inputBackground: settingsEditorColorRegistry_1.settingsTextInputBackground,
                inputForeground: settingsEditorColorRegistry_1.settingsTextInputForeground,
                inputBorder: settingsEditorColorRegistry_1.settingsTextInputBorder
            }));
            common.toDispose.add(inputBox.onDidChange(e => {
                if (template.onChange) {
                    template.onChange(e);
                }
            }));
            common.toDispose.add(inputBox);
            inputBox.inputElement.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            inputBox.inputElement.tabIndex = 0;
            const template = Object.assign(Object.assign({}, common), { inputBox,
                validationErrorMessageElement });
            this.addSettingElementFocusHandler(template);
            return template;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            template.onChange = undefined;
            template.inputBox.value = dataElement.value;
            template.inputBox.setAriaLabel(dataElement.setting.key);
            template.onChange = value => {
                if (!renderValidations(dataElement, template, false)) {
                    onChange(value);
                }
            };
            renderValidations(dataElement, template, true);
        }
    }
    class SettingTextRenderer extends AbstractSettingTextRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_TEXT_TEMPLATE_ID;
        }
        renderTemplate(_container) {
            const template = super.renderTemplate(_container, false);
            // TODO@9at8: listWidget filters out all key events from input boxes, so we need to come up with a better way
            // Disable ArrowUp and ArrowDown behaviour in favor of list navigation
            template.toDispose.add(DOM.addStandardDisposableListener(template.inputBox.inputElement, DOM.EventType.KEY_DOWN, e => {
                if (e.equals(16 /* KeyCode.UpArrow */) || e.equals(18 /* KeyCode.DownArrow */)) {
                    e.preventDefault();
                }
            }));
            return template;
        }
    }
    exports.SettingTextRenderer = SettingTextRenderer;
    class SettingMultilineTextRenderer extends AbstractSettingTextRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_MULTILINE_TEXT_TEMPLATE_ID;
        }
        renderTemplate(_container) {
            return super.renderTemplate(_container, true);
        }
        renderValue(dataElement, template, onChange) {
            const onChangeOverride = (value) => {
                // Ensure the model is up to date since a different value will be rendered as different height when probing the height.
                dataElement.value = value;
                onChange(value);
            };
            super.renderValue(dataElement, template, onChangeOverride);
            template.elementDisposables.add(template.inputBox.onDidHeightChange(e => {
                const height = template.containerElement.clientHeight;
                // Don't fire event if height is reported as 0,
                // which sometimes happens when clicking onto a new setting.
                if (height) {
                    this._onDidChangeSettingHeight.fire({
                        element: dataElement,
                        height: template.containerElement.clientHeight
                    });
                }
            }));
            template.inputBox.layout();
        }
    }
    exports.SettingMultilineTextRenderer = SettingMultilineTextRenderer;
    class SettingEnumRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_ENUM_TEMPLATE_ID;
        }
        renderTemplate(container) {
            const common = this.renderCommonTemplate(null, container, 'enum');
            const selectBox = new selectBox_1.SelectBox([], 0, this._contextViewService, undefined, {
                useCustomDrawn: !(platform_1.isIOS && canIUse_1.BrowserFeatures.pointerEvents)
            });
            common.toDispose.add(selectBox);
            common.toDispose.add((0, styler_1.attachSelectBoxStyler)(selectBox, this._themeService, {
                selectBackground: settingsEditorColorRegistry_1.settingsSelectBackground,
                selectForeground: settingsEditorColorRegistry_1.settingsSelectForeground,
                selectBorder: settingsEditorColorRegistry_1.settingsSelectBorder,
                selectListBorder: settingsEditorColorRegistry_1.settingsSelectListBorder
            }));
            selectBox.render(common.controlElement);
            const selectElement = common.controlElement.querySelector('select');
            if (selectElement) {
                selectElement.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
                selectElement.tabIndex = 0;
            }
            common.toDispose.add(selectBox.onDidSelect(e => {
                if (template.onChange) {
                    template.onChange(e.index);
                }
            }));
            const enumDescriptionElement = common.containerElement.insertBefore($('.setting-item-enumDescription'), common.descriptionElement.nextSibling);
            const template = Object.assign(Object.assign({}, common), { selectBox,
                enumDescriptionElement });
            this.addSettingElementFocusHandler(template);
            return template;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            // Make shallow copies here so that we don't modify the actual dataElement later
            const enumItemLabels = dataElement.setting.enumItemLabels ? [...dataElement.setting.enumItemLabels] : [];
            const enumDescriptions = dataElement.setting.enumDescriptions ? [...dataElement.setting.enumDescriptions] : [];
            const settingEnum = [...dataElement.setting.enum];
            const enumDescriptionsAreMarkdown = dataElement.setting.enumDescriptionsAreMarkdown;
            const disposables = new lifecycle_1.DisposableStore();
            template.toDispose.add(disposables);
            let createdDefault = false;
            if (!settingEnum.includes(dataElement.defaultValue)) {
                // Add a new potentially blank default setting
                settingEnum.unshift(dataElement.defaultValue);
                enumDescriptions.unshift('');
                enumItemLabels.unshift('');
                createdDefault = true;
            }
            // Use String constructor in case of null or undefined values
            const stringifiedDefaultValue = escapeInvisibleChars(String(dataElement.defaultValue));
            const displayOptions = settingEnum
                .map(String)
                .map(escapeInvisibleChars)
                .map((data, index) => {
                const description = (enumDescriptions[index] && (enumDescriptionsAreMarkdown ? fixSettingLinks(enumDescriptions[index], false) : enumDescriptions[index]));
                return {
                    text: enumItemLabels[index] ? enumItemLabels[index] : data,
                    detail: enumItemLabels[index] ? data : '',
                    description,
                    descriptionIsMarkdown: enumDescriptionsAreMarkdown,
                    descriptionMarkdownActionHandler: {
                        callback: (content) => {
                            this._openerService.open(content).catch(errors_1.onUnexpectedError);
                        },
                        disposables: disposables
                    },
                    decoratorRight: (((data === stringifiedDefaultValue) || (createdDefault && index === 0)) ? (0, nls_1.localize)('settings.Default', "default") : '')
                };
            });
            template.selectBox.setOptions(displayOptions);
            template.selectBox.setAriaLabel(dataElement.setting.key);
            let idx = settingEnum.indexOf(dataElement.value);
            if (idx === -1) {
                idx = 0;
            }
            template.onChange = undefined;
            template.selectBox.select(idx);
            template.onChange = (idx) => {
                if (createdDefault && idx === 0) {
                    onChange(dataElement.defaultValue);
                }
                else {
                    onChange(settingEnum[idx]);
                }
            };
            template.enumDescriptionElement.innerText = '';
        }
    }
    exports.SettingEnumRenderer = SettingEnumRenderer;
    class SettingNumberRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_NUMBER_TEMPLATE_ID;
        }
        renderTemplate(_container) {
            const common = super.renderCommonTemplate(null, _container, 'number');
            const validationErrorMessageElement = DOM.append(common.containerElement, $('.setting-item-validation-message'));
            const inputBox = new inputBox_1.InputBox(common.controlElement, this._contextViewService, { type: 'number' });
            common.toDispose.add(inputBox);
            common.toDispose.add((0, styler_1.attachInputBoxStyler)(inputBox, this._themeService, {
                inputBackground: settingsEditorColorRegistry_1.settingsNumberInputBackground,
                inputForeground: settingsEditorColorRegistry_1.settingsNumberInputForeground,
                inputBorder: settingsEditorColorRegistry_1.settingsNumberInputBorder
            }));
            common.toDispose.add(inputBox.onDidChange(e => {
                if (template.onChange) {
                    template.onChange(e);
                }
            }));
            common.toDispose.add(inputBox);
            inputBox.inputElement.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            inputBox.inputElement.tabIndex = 0;
            const template = Object.assign(Object.assign({}, common), { inputBox,
                validationErrorMessageElement });
            this.addSettingElementFocusHandler(template);
            return template;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            const numParseFn = (dataElement.valueType === 'integer' || dataElement.valueType === 'nullable-integer')
                ? parseInt : parseFloat;
            const nullNumParseFn = (dataElement.valueType === 'nullable-integer' || dataElement.valueType === 'nullable-number')
                ? ((v) => v === '' ? null : numParseFn(v)) : numParseFn;
            template.onChange = undefined;
            template.inputBox.value = dataElement.value;
            template.inputBox.setAriaLabel(dataElement.setting.key);
            template.onChange = value => {
                if (!renderValidations(dataElement, template, false)) {
                    onChange(nullNumParseFn(value));
                }
            };
            renderValidations(dataElement, template, true);
        }
    }
    exports.SettingNumberRenderer = SettingNumberRenderer;
    class SettingBoolRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_BOOL_TEMPLATE_ID;
        }
        renderTemplate(_container) {
            _container.classList.add('setting-item');
            _container.classList.add('setting-item-bool');
            const container = DOM.append(_container, $(AbstractSettingRenderer.CONTENTS_SELECTOR));
            container.classList.add('settings-row-inner-container');
            const titleElement = DOM.append(container, $('.setting-item-title'));
            const categoryElement = DOM.append(titleElement, $('span.setting-item-category'));
            const labelElementContainer = DOM.append(titleElement, $('span.setting-item-label'));
            const labelElement = new simpleIconLabel_1.SimpleIconLabel(labelElementContainer);
            const miscLabel = new SettingsTreeMiscLabel(titleElement);
            const descriptionAndValueElement = DOM.append(container, $('.setting-item-value-description'));
            const controlElement = DOM.append(descriptionAndValueElement, $('.setting-item-bool-control'));
            const descriptionElement = DOM.append(descriptionAndValueElement, $('.setting-item-description'));
            const modifiedIndicatorElement = DOM.append(container, $('.setting-item-modified-indicator'));
            modifiedIndicatorElement.title = (0, nls_1.localize)('modified', "The setting has been configured in the current scope.");
            const deprecationWarningElement = DOM.append(container, $('.setting-item-deprecation-message'));
            const toDispose = new lifecycle_1.DisposableStore();
            const checkbox = new toggle_1.Toggle({ icon: codicons_1.Codicon.check, actionClassName: 'setting-value-checkbox', isChecked: true, title: '', inputActiveOptionBorder: undefined });
            controlElement.appendChild(checkbox.domNode);
            toDispose.add(checkbox);
            toDispose.add(checkbox.onChange(() => {
                template.onChange(checkbox.checked);
            }));
            // Need to listen for mouse clicks on description and toggle checkbox - use target ID for safety
            // Also have to ignore embedded links - too buried to stop propagation
            toDispose.add(DOM.addDisposableListener(descriptionElement, DOM.EventType.MOUSE_DOWN, (e) => {
                const targetElement = e.target;
                // Toggle target checkbox
                if (targetElement.tagName.toLowerCase() !== 'a') {
                    template.checkbox.checked = !template.checkbox.checked;
                    template.onChange(checkbox.checked);
                }
                DOM.EventHelper.stop(e);
            }));
            checkbox.domNode.classList.add(AbstractSettingRenderer.CONTROL_CLASS);
            const toolbarContainer = DOM.append(container, $('.setting-toolbar-container'));
            const toolbar = this.renderSettingToolbar(toolbarContainer);
            toDispose.add(toolbar);
            const template = {
                toDispose,
                elementDisposables: new lifecycle_1.DisposableStore(),
                containerElement: container,
                categoryElement,
                labelElement,
                controlElement,
                checkbox,
                descriptionElement,
                deprecationWarningElement,
                miscLabel,
                toolbar
            };
            this.addSettingElementFocusHandler(template);
            // Prevent clicks from being handled by list
            toDispose.add(DOM.addDisposableListener(controlElement, 'mousedown', (e) => e.stopPropagation()));
            toDispose.add(DOM.addDisposableListener(titleElement, DOM.EventType.MOUSE_ENTER, e => container.classList.add('mouseover')));
            toDispose.add(DOM.addDisposableListener(titleElement, DOM.EventType.MOUSE_LEAVE, e => container.classList.remove('mouseover')));
            return template;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) {
            template.onChange = undefined;
            template.checkbox.checked = dataElement.value;
            template.checkbox.setTitle(dataElement.setting.key);
            template.onChange = onChange;
        }
    }
    exports.SettingBoolRenderer = SettingBoolRenderer;
    class SettingUntrustedRenderer extends AbstractSettingRenderer {
        constructor() {
            super(...arguments);
            this.templateId = SETTINGS_UNTRUSTED_TEMPLATE_ID;
        }
        renderTemplate(container) {
            const template = this.renderCommonTemplate(null, container, 'untrusted');
            const manageWorkspaceTrustLabel = (0, nls_1.localize)('manageWorkspaceTrust', "Manage Workspace Trust");
            const trustLabelElement = $('.setting-item-trust-description');
            const untrustedWorkspaceIcon = DOM.append(trustLabelElement, $('span.codicon.codicon-workspace-untrusted'));
            template.toDispose.add((0, styler_1.attachStylerCallback)(this._themeService, { editorErrorForeground: colorRegistry_1.editorErrorForeground }, colors => {
                var _a;
                untrustedWorkspaceIcon.style.setProperty('--workspace-trust-state-untrusted-color', ((_a = colors.editorErrorForeground) === null || _a === void 0 ? void 0 : _a.toString()) || '');
            }));
            const element = DOM.append(trustLabelElement, $('span'));
            element.textContent = (0, nls_1.localize)('trustLabel', "This setting can only be applied in a trusted workspace");
            const linkElement = DOM.append(trustLabelElement, $('a'));
            linkElement.textContent = manageWorkspaceTrustLabel;
            linkElement.setAttribute('tabindex', '0');
            linkElement.href = '#';
            template.toDispose.add(DOM.addStandardDisposableListener(linkElement, DOM.EventType.CLICK, (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._commandService.executeCommand('workbench.trust.manage');
            }));
            template.toDispose.add(DOM.addStandardDisposableListener(linkElement, DOM.EventType.KEY_DOWN, (e) => {
                if (e.equals(3 /* KeyCode.Enter */) || e.equals(10 /* KeyCode.Space */)) {
                    this._commandService.executeCommand('workbench.trust.manage');
                    e.stopPropagation();
                }
            }));
            template.containerElement.insertBefore(trustLabelElement, template.descriptionElement);
            return template;
        }
        renderElement(element, index, templateData) {
            super.renderSettingElement(element, index, templateData);
        }
        renderValue(dataElement, template, onChange) { }
    }
    exports.SettingUntrustedRenderer = SettingUntrustedRenderer;
    let SettingTreeRenderers = class SettingTreeRenderers {
        constructor(_instantiationService, _contextMenuService, _contextViewService, _userDataSyncEnablementService) {
            this._instantiationService = _instantiationService;
            this._contextMenuService = _contextMenuService;
            this._contextViewService = _contextViewService;
            this._userDataSyncEnablementService = _userDataSyncEnablementService;
            this._onDidChangeSetting = new event_1.Emitter();
            this.settingActions = [
                new actions_1.Action('settings.resetSetting', (0, nls_1.localize)('resetSettingLabel', "Reset Setting"), undefined, undefined, async (context) => {
                    if (context instanceof settingsTreeModels_1.SettingsTreeSettingElement) {
                        if (!context.isUntrusted) {
                            this._onDidChangeSetting.fire({ key: context.setting.key, value: undefined, type: context.setting.type, manualReset: true });
                        }
                    }
                }),
                new actions_1.Separator(),
                this._instantiationService.createInstance(CopySettingIdAction),
                this._instantiationService.createInstance(CopySettingAsJSONAction),
            ];
            const actionFactory = (setting) => this.getActionsForSetting(setting);
            const settingRenderers = [
                this._instantiationService.createInstance(SettingBoolRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingNumberRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingArrayRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingComplexRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingTextRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingMultilineTextRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingExcludeRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingEnumRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingObjectRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingBoolObjectRenderer, this.settingActions, actionFactory),
                this._instantiationService.createInstance(SettingUntrustedRenderer, this.settingActions, actionFactory),
            ];
            this.onDidClickOverrideElement = event_1.Event.any(...settingRenderers.map(r => r.onDidClickOverrideElement));
            this.onDidChangeSetting = event_1.Event.any(...settingRenderers.map(r => r.onDidChangeSetting), this._onDidChangeSetting.event);
            this.onDidOpenSettings = event_1.Event.any(...settingRenderers.map(r => r.onDidOpenSettings));
            this.onDidClickSettingLink = event_1.Event.any(...settingRenderers.map(r => r.onDidClickSettingLink));
            this.onDidFocusSetting = event_1.Event.any(...settingRenderers.map(r => r.onDidFocusSetting));
            this.onDidChangeSettingHeight = event_1.Event.any(...settingRenderers.map(r => r.onDidChangeSettingHeight));
            this.onApplyLanguageFilter = event_1.Event.any(...settingRenderers.map(r => r.onApplyLanguageFilter));
            this.allRenderers = [
                ...settingRenderers,
                this._instantiationService.createInstance(SettingGroupRenderer),
                this._instantiationService.createInstance(SettingNewExtensionsRenderer),
            ];
        }
        getActionsForSetting(setting) {
            const enableSync = this._userDataSyncEnablementService.isEnabled();
            return enableSync && !setting.disallowSyncIgnore ?
                [
                    new actions_1.Separator(),
                    this._instantiationService.createInstance(SyncSettingAction, setting)
                ] :
                [];
        }
        cancelSuggesters() {
            this._contextViewService.hideContextView();
        }
        showContextMenu(element, settingDOMElement) {
            const toolbarElement = settingDOMElement.querySelector('.monaco-toolbar');
            if (toolbarElement) {
                this._contextMenuService.showContextMenu({
                    getActions: () => this.settingActions,
                    getAnchor: () => toolbarElement,
                    getActionsContext: () => element
                });
            }
        }
        getSettingDOMElementForDOMElement(domElement) {
            const parent = DOM.findParentWithClass(domElement, AbstractSettingRenderer.CONTENTS_CLASS);
            if (parent) {
                return parent;
            }
            return null;
        }
        getDOMElementsForSettingKey(treeContainer, key) {
            return treeContainer.querySelectorAll(`[${AbstractSettingRenderer.SETTING_KEY_ATTR}="${key}"]`);
        }
        getKeyForDOMElementInSetting(element) {
            const settingElement = this.getSettingDOMElementForDOMElement(element);
            return settingElement && settingElement.getAttribute(AbstractSettingRenderer.SETTING_KEY_ATTR);
        }
        getIdForDOMElementInSetting(element) {
            const settingElement = this.getSettingDOMElementForDOMElement(element);
            return settingElement && settingElement.getAttribute(AbstractSettingRenderer.SETTING_ID_ATTR);
        }
    };
    SettingTreeRenderers = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextView_1.IContextMenuService),
        __param(2, contextView_1.IContextViewService),
        __param(3, userDataSync_1.IUserDataSyncEnablementService)
    ], SettingTreeRenderers);
    exports.SettingTreeRenderers = SettingTreeRenderers;
    /**
     * Validate and render any error message. Returns true if the value is invalid.
     */
    function renderValidations(dataElement, template, calledOnStartup) {
        if (dataElement.setting.validator) {
            const errMsg = dataElement.setting.validator(template.inputBox.value);
            if (errMsg) {
                template.containerElement.classList.add('invalid-input');
                template.validationErrorMessageElement.innerText = errMsg;
                const validationError = (0, nls_1.localize)('validationError', "Validation Error.");
                template.inputBox.inputElement.parentElement.setAttribute('aria-label', [validationError, errMsg].join(' '));
                if (!calledOnStartup) {
                    (0, aria_1.alert)(validationError + ' ' + errMsg);
                }
                return true;
            }
            else {
                template.inputBox.inputElement.parentElement.removeAttribute('aria-label');
            }
        }
        template.containerElement.classList.remove('invalid-input');
        return false;
    }
    /**
     * Validate and render any error message for arrays. Returns true if the value is invalid.
     */
    function renderArrayValidations(dataElement, template, value, calledOnStartup) {
        template.containerElement.classList.add('invalid-input');
        if (dataElement.setting.validator) {
            const errMsg = dataElement.setting.validator(value);
            if (errMsg && errMsg !== '') {
                template.containerElement.classList.add('invalid-input');
                template.validationErrorMessageElement.innerText = errMsg;
                const validationError = (0, nls_1.localize)('validationError', "Validation Error.");
                template.containerElement.setAttribute('aria-label', [dataElement.setting.key, validationError, errMsg].join(' '));
                if (!calledOnStartup) {
                    (0, aria_1.alert)(validationError + ' ' + errMsg);
                }
                return true;
            }
            else {
                template.containerElement.setAttribute('aria-label', dataElement.setting.key);
                template.containerElement.classList.remove('invalid-input');
            }
        }
        return false;
    }
    function cleanRenderedMarkdown(element) {
        for (let i = 0; i < element.childNodes.length; i++) {
            const child = element.childNodes.item(i);
            const tagName = child.tagName && child.tagName.toLowerCase();
            if (tagName === 'img') {
                element.removeChild(child);
            }
            else {
                cleanRenderedMarkdown(child);
            }
        }
    }
    function fixSettingLinks(text, linkify = true) {
        return text.replace(/`#([^#]*)#`|'#([^#]*)#'/g, (match, backticksGroup, quotesGroup) => {
            const settingKey = backticksGroup !== null && backticksGroup !== void 0 ? backticksGroup : quotesGroup;
            const targetDisplayFormat = (0, settingsTreeModels_1.settingKeyToDisplayFormat)(settingKey);
            const targetName = `${targetDisplayFormat.category}: ${targetDisplayFormat.label}`;
            return linkify ?
                `[${targetName}](#${settingKey} "${settingKey}")` :
                `"${targetName}"`;
        });
    }
    function escapeInvisibleChars(enumValue) {
        return enumValue && enumValue
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
    }
    /**
     * Controls logic and rendering of the label next to each setting header.
     * For example, the "Modified by" and "Overridden by" labels go here.
     */
    class SettingsTreeMiscLabel {
        constructor(container) {
            this.labelElement = DOM.append(container, $('.misc-label'));
            this.labelElement.style.display = 'inline';
            this.otherOverridesElement = this.createOtherOverridesElement();
            this.syncIgnoredElement = this.createSyncIgnoredElement();
            const { element, label } = this.createDefaultOverrideIndicator();
            this.defaultOverrideIndicatorElement = element;
            this.defaultOverrideIndicatorLabel = label;
        }
        createOtherOverridesElement() {
            const otherOverridesElement = $('span.setting-item-overrides');
            return otherOverridesElement;
        }
        createSyncIgnoredElement() {
            const syncIgnoredElement = $('span.setting-item-ignored');
            const syncIgnoredLabel = new simpleIconLabel_1.SimpleIconLabel(syncIgnoredElement);
            syncIgnoredLabel.text = `$(sync-ignored) ${(0, nls_1.localize)('extensionSyncIgnoredLabel', 'Sync: Ignored')}`;
            syncIgnoredLabel.title = (0, nls_1.localize)('syncIgnoredTitle', "Settings sync does not sync this setting");
            return syncIgnoredElement;
        }
        createDefaultOverrideIndicator() {
            const defaultOverrideIndicator = $('span.setting-item-default-overridden');
            const defaultOverrideLabel = new simpleIconLabel_1.SimpleIconLabel(defaultOverrideIndicator);
            return { element: defaultOverrideIndicator, label: defaultOverrideLabel };
        }
        render() {
            const elementsToShow = [this.otherOverridesElement, this.syncIgnoredElement, this.defaultOverrideIndicatorElement].filter(element => {
                return element.style.display !== 'none';
            });
            this.labelElement.innerText = '';
            this.labelElement.style.display = 'none';
            if (elementsToShow.length) {
                this.labelElement.style.display = 'inline';
                DOM.append(this.labelElement, $('span', undefined, '('));
                for (let i = 0; i < elementsToShow.length - 1; i++) {
                    DOM.append(this.labelElement, elementsToShow[i]);
                    DOM.append(this.labelElement, $('span.comma', undefined, ', '));
                }
                DOM.append(this.labelElement, elementsToShow[elementsToShow.length - 1]);
                DOM.append(this.labelElement, $('span', undefined, ')'));
            }
        }
        updateSyncIgnored(element, ignoredSettings) {
            this.syncIgnoredElement.style.display = ignoredSettings.includes(element.setting.key) ? 'inline' : 'none';
            this.render();
        }
        updateOtherOverrides(element, elementDisposables, onDidClickOverrideElement) {
            this.otherOverridesElement.innerText = '';
            this.otherOverridesElement.style.display = 'none';
            if (element.overriddenScopeList.length) {
                this.otherOverridesElement.style.display = 'inline';
                const otherOverridesLabel = element.isConfigured ?
                    (0, nls_1.localize)('alsoConfiguredIn', "Also modified in") :
                    (0, nls_1.localize)('configuredIn', "Modified in");
                DOM.append(this.otherOverridesElement, $('span', undefined, `${otherOverridesLabel}: `));
                for (let i = 0; i < element.overriddenScopeList.length; i++) {
                    const view = DOM.append(this.otherOverridesElement, $('a.modified-scope', undefined, element.overriddenScopeList[i]));
                    if (i !== element.overriddenScopeList.length - 1) {
                        DOM.append(this.otherOverridesElement, $('span', undefined, ', '));
                    }
                    elementDisposables.add(DOM.addStandardDisposableListener(view, DOM.EventType.CLICK, (e) => {
                        onDidClickOverrideElement.fire({
                            targetKey: element.setting.key,
                            scope: element.overriddenScopeList[i]
                        });
                        e.preventDefault();
                        e.stopPropagation();
                    }));
                }
            }
            this.render();
        }
        updateDefaultOverrideIndicator(element) {
            var _a, _b;
            this.defaultOverrideIndicatorElement.style.display = 'none';
            if (element.setting.defaultValueSource) {
                this.defaultOverrideIndicatorElement.style.display = 'inline';
                const defaultValueSource = element.setting.defaultValueSource;
                if (typeof defaultValueSource !== 'string' && defaultValueSource.id !== ((_a = element.setting.extensionInfo) === null || _a === void 0 ? void 0 : _a.id)) {
                    const extensionSource = (_b = defaultValueSource.displayName) !== null && _b !== void 0 ? _b : defaultValueSource.id;
                    this.defaultOverrideIndicatorLabel.title = (0, nls_1.localize)('defaultOverriddenDetails', "Default value overridden by {0}", extensionSource);
                    this.defaultOverrideIndicatorLabel.text = (0, nls_1.localize)('defaultOverrideLabelText', "$(wrench) Overridden by: {0}", extensionSource);
                }
                else if (typeof defaultValueSource === 'string') {
                    this.defaultOverrideIndicatorLabel.title = (0, nls_1.localize)('defaultOverriddenDetails', "Default value overridden by {0}", defaultValueSource);
                    this.defaultOverrideIndicatorLabel.text = (0, nls_1.localize)('defaultOverrideLabelText', "$(wrench) Overridden by: {0}", defaultValueSource);
                }
            }
            this.render();
        }
    }
    let SettingsTreeFilter = class SettingsTreeFilter {
        constructor(viewState, environmentService) {
            this.viewState = viewState;
            this.environmentService = environmentService;
        }
        filter(element, parentVisibility) {
            // Filter during search
            if (this.viewState.filterToCategory && element instanceof settingsTreeModels_1.SettingsTreeSettingElement) {
                if (!this.settingContainedInGroup(element.setting, this.viewState.filterToCategory)) {
                    return false;
                }
            }
            // Non-user scope selected
            if (element instanceof settingsTreeModels_1.SettingsTreeSettingElement && this.viewState.settingsTarget !== 2 /* ConfigurationTarget.USER_LOCAL */) {
                const isRemote = !!this.environmentService.remoteAuthority;
                if (!element.matchesScope(this.viewState.settingsTarget, isRemote)) {
                    return false;
                }
            }
            // Group with no visible children
            if (element instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                if (typeof element.count === 'number') {
                    return element.count > 0;
                }
                return 2 /* TreeVisibility.Recurse */;
            }
            // Filtered "new extensions" button
            if (element instanceof settingsTreeModels_1.SettingsTreeNewExtensionsElement) {
                if ((this.viewState.tagFilters && this.viewState.tagFilters.size) || this.viewState.filterToCategory) {
                    return false;
                }
            }
            return true;
        }
        settingContainedInGroup(setting, group) {
            return group.children.some(child => {
                if (child instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                    return this.settingContainedInGroup(setting, child);
                }
                else if (child instanceof settingsTreeModels_1.SettingsTreeSettingElement) {
                    return child.setting.key === setting.key;
                }
                else {
                    return false;
                }
            });
        }
    };
    SettingsTreeFilter = __decorate([
        __param(1, environmentService_1.IWorkbenchEnvironmentService)
    ], SettingsTreeFilter);
    exports.SettingsTreeFilter = SettingsTreeFilter;
    class SettingsTreeDelegate extends list_1.CachedListVirtualDelegate {
        getTemplateId(element) {
            if (element instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                return SETTINGS_ELEMENT_TEMPLATE_ID;
            }
            if (element instanceof settingsTreeModels_1.SettingsTreeSettingElement) {
                if (element.isUntrusted) {
                    return SETTINGS_UNTRUSTED_TEMPLATE_ID;
                }
                const invalidTypeError = element.isConfigured && (0, preferencesValidation_1.getInvalidTypeError)(element.value, element.setting.type);
                if (invalidTypeError) {
                    return SETTINGS_COMPLEX_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.Boolean) {
                    return SETTINGS_BOOL_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.Integer ||
                    element.valueType === preferences_2.SettingValueType.Number ||
                    element.valueType === preferences_2.SettingValueType.NullableInteger ||
                    element.valueType === preferences_2.SettingValueType.NullableNumber) {
                    return SETTINGS_NUMBER_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.MultilineString) {
                    return SETTINGS_MULTILINE_TEXT_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.String) {
                    return SETTINGS_TEXT_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.Enum) {
                    return SETTINGS_ENUM_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.Array) {
                    return SETTINGS_ARRAY_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.Exclude) {
                    return SETTINGS_EXCLUDE_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.Object) {
                    return SETTINGS_OBJECT_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.BooleanObject) {
                    return SETTINGS_BOOL_OBJECT_TEMPLATE_ID;
                }
                if (element.valueType === preferences_2.SettingValueType.LanguageTag) {
                    return SETTINGS_COMPLEX_TEMPLATE_ID;
                }
                return SETTINGS_COMPLEX_TEMPLATE_ID;
            }
            if (element instanceof settingsTreeModels_1.SettingsTreeNewExtensionsElement) {
                return SETTINGS_NEW_EXTENSIONS_TEMPLATE_ID;
            }
            throw new Error('unknown element type: ' + element);
        }
        hasDynamicHeight(element) {
            return !(element instanceof settingsTreeModels_1.SettingsTreeGroupElement);
        }
        estimateHeight(element) {
            if (element instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                return 42;
            }
            return element instanceof settingsTreeModels_1.SettingsTreeSettingElement && element.valueType === preferences_2.SettingValueType.Boolean ? 78 : 104;
        }
    }
    class NonCollapsibleObjectTreeModel extends objectTreeModel_1.ObjectTreeModel {
        isCollapsible(element) {
            return false;
        }
        setCollapsed(element, collapsed, recursive) {
            return false;
        }
    }
    exports.NonCollapsibleObjectTreeModel = NonCollapsibleObjectTreeModel;
    class SettingsTreeAccessibilityProvider {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        getAriaLabel(element) {
            if (element instanceof settingsTreeModels_1.SettingsTreeSettingElement) {
                const ariaLabelSections = [];
                ariaLabelSections.push(`${element.displayCategory} ${element.displayLabel}.`);
                if (element.isConfigured) {
                    const modifiedText = (0, nls_1.localize)('settings.Modified', 'Modified.');
                    ariaLabelSections.push(modifiedText);
                }
                const miscLabelAriaLabel = this.getMiscLabelAriaLabel(element);
                if (miscLabelAriaLabel.length) {
                    ariaLabelSections.push(`${miscLabelAriaLabel}.`);
                }
                const descriptionWithoutSettingLinks = fixSettingLinks(element.description, false);
                if (descriptionWithoutSettingLinks.length) {
                    ariaLabelSections.push(descriptionWithoutSettingLinks);
                }
                return ariaLabelSections.join(' ');
            }
            else if (element instanceof settingsTreeModels_1.SettingsTreeGroupElement) {
                return element.label;
            }
            else {
                return element.id;
            }
        }
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('settings', "Settings");
        }
        getMiscLabelAriaLabel(element) {
            var _a, _b;
            const ariaLabelSections = [];
            // Add other overrides text
            const otherOverridesStart = element.isConfigured ?
                (0, nls_1.localize)('alsoConfiguredIn', "Also modified in") :
                (0, nls_1.localize)('configuredIn', "Modified in");
            const otherOverridesList = element.overriddenScopeList.join(', ');
            if (element.overriddenScopeList.length) {
                ariaLabelSections.push(`${otherOverridesStart} ${otherOverridesList}`);
            }
            // Add sync ignored text
            const ignoredSettings = (0, settingsMerge_1.getIgnoredSettings)((0, userDataSync_1.getDefaultIgnoredSettings)(), this.configurationService);
            if (ignoredSettings.includes(element.setting.key)) {
                ariaLabelSections.push((0, nls_1.localize)('syncIgnoredTitle', "Settings sync does not sync this setting"));
            }
            // Add default override indicator text
            if (element.setting.defaultValueSource) {
                const defaultValueSource = element.setting.defaultValueSource;
                if (typeof defaultValueSource !== 'string' && defaultValueSource.id !== ((_a = element.setting.extensionInfo) === null || _a === void 0 ? void 0 : _a.id)) {
                    const extensionSource = (_b = defaultValueSource.displayName) !== null && _b !== void 0 ? _b : defaultValueSource.id;
                    ariaLabelSections.push((0, nls_1.localize)('defaultOverriddenDetails', "Default value overridden by {0}", extensionSource));
                }
                else if (typeof defaultValueSource === 'string') {
                    ariaLabelSections.push((0, nls_1.localize)('defaultOverriddenDetails', "Default value overridden by {0}", defaultValueSource));
                }
            }
            const ariaLabel = ariaLabelSections.join('. ');
            return ariaLabel;
        }
    }
    let SettingsTree = class SettingsTree extends listService_1.WorkbenchObjectTree {
        constructor(container, viewState, renderers, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService, instantiationService) {
            super('SettingsTree', container, new SettingsTreeDelegate(), renderers, {
                horizontalScrolling: false,
                supportDynamicHeights: true,
                identityProvider: {
                    getId(e) {
                        return e.id;
                    }
                },
                accessibilityProvider: new SettingsTreeAccessibilityProvider(configurationService),
                styleController: id => new listWidget_1.DefaultStyleController(DOM.createStyleSheet(container), id),
                filter: instantiationService.createInstance(SettingsTreeFilter, viewState),
                smoothScrolling: configurationService.getValue('workbench.list.smoothScrolling'),
                multipleSelectionSupport: false,
            }, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService);
            this.disposables.add((0, themeService_1.registerThemingParticipant)((theme, collector) => {
                const foregroundColor = theme.getColor(colorRegistry_1.foreground);
                if (foregroundColor) {
                    // Links appear inside other elements in markdown. CSS opacity acts like a mask. So we have to dynamically compute the description color to avoid
                    // applying an opacity to the link color.
                    const fgWithOpacity = new color_1.Color(new color_1.RGBA(foregroundColor.rgba.r, foregroundColor.rgba.g, foregroundColor.rgba.b, 0.9));
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-description { color: ${fgWithOpacity}; }`);
                    collector.addRule(`.settings-editor > .settings-body .settings-toc-container .monaco-list-row:not(.selected) { color: ${fgWithOpacity}; }`);
                    const disabledfgColor = new color_1.Color(new color_1.RGBA(foregroundColor.rgba.r, foregroundColor.rgba.g, foregroundColor.rgba.b, 0.7));
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item.setting-item-untrusted > .setting-item-contents .setting-item-description { color: ${disabledfgColor}; }`);
                    // Hack for subpixel antialiasing
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-title .setting-item-overrides,
					.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-title .setting-item-ignored { color: ${fgWithOpacity}; }`);
                }
                const errorColor = theme.getColor(colorRegistry_1.errorForeground);
                if (errorColor) {
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-deprecation-message { color: ${errorColor}; }`);
                }
                const invalidInputBackground = theme.getColor(colorRegistry_1.inputValidationErrorBackground);
                if (invalidInputBackground) {
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-validation-message { background-color: ${invalidInputBackground}; }`);
                }
                const invalidInputForeground = theme.getColor(colorRegistry_1.inputValidationErrorForeground);
                if (invalidInputForeground) {
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-validation-message { color: ${invalidInputForeground}; }`);
                }
                const invalidInputBorder = theme.getColor(colorRegistry_1.inputValidationErrorBorder);
                if (invalidInputBorder) {
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-validation-message { border-style:solid; border-width: 1px; border-color: ${invalidInputBorder}; }`);
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item.invalid-input .setting-item-control .monaco-inputbox.idle { outline-width: 0; border-style:solid; border-width: 1px; border-color: ${invalidInputBorder}; }`);
                }
                const focusedRowBackgroundColor = theme.getColor(settingsEditorColorRegistry_1.focusedRowBackground);
                if (focusedRowBackgroundColor) {
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .monaco-list-row.focused .settings-row-inner-container { background-color: ${focusedRowBackgroundColor}; }`);
                }
                const rowHoverBackgroundColor = theme.getColor(settingsEditorColorRegistry_1.rowHoverBackground);
                if (rowHoverBackgroundColor) {
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .monaco-list-row:not(.focused) .settings-row-inner-container:hover { background-color: ${rowHoverBackgroundColor}; }`);
                }
                const focusedRowBorderColor = theme.getColor(settingsEditorColorRegistry_1.focusedRowBorder);
                if (focusedRowBorderColor) {
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .monaco-list:focus-within .monaco-list-row.focused .setting-item-contents { outline: 1px solid ${focusedRowBorderColor} }`);
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .monaco-list:focus-within .monaco-list-row.focused .settings-group-title-label { outline: 1px solid ${focusedRowBorderColor} }`);
                }
                const headerForegroundColor = theme.getColor(settingsEditorColorRegistry_1.settingsHeaderForeground);
                if (headerForegroundColor) {
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .settings-group-title-label { color: ${headerForegroundColor}; }`);
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-label { color: ${headerForegroundColor}; }`);
                }
                const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
                if (focusBorderColor) {
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-trust-description a:focus { outline-color: ${focusBorderColor} }`);
                    collector.addRule(`.settings-editor > .settings-body .settings-tree-container .setting-item-contents .setting-item-markdown a:focus { outline-color: ${focusBorderColor} }`);
                }
            }));
            this.getHTMLElement().classList.add('settings-editor-tree');
            this.disposables.add((0, styler_1.attachStyler)(themeService, {
                listBackground: colorRegistry_1.editorBackground,
                listActiveSelectionBackground: colorRegistry_1.editorBackground,
                listActiveSelectionForeground: colorRegistry_1.foreground,
                listFocusAndSelectionBackground: colorRegistry_1.editorBackground,
                listFocusAndSelectionForeground: colorRegistry_1.foreground,
                listFocusBackground: colorRegistry_1.editorBackground,
                listFocusForeground: colorRegistry_1.foreground,
                listHoverForeground: colorRegistry_1.foreground,
                listHoverBackground: colorRegistry_1.editorBackground,
                listHoverOutline: colorRegistry_1.editorBackground,
                listFocusOutline: colorRegistry_1.editorBackground,
                listInactiveSelectionBackground: colorRegistry_1.editorBackground,
                listInactiveSelectionForeground: colorRegistry_1.foreground,
                listInactiveFocusBackground: colorRegistry_1.editorBackground,
                listInactiveFocusOutline: colorRegistry_1.editorBackground
            }, colors => {
                this.style(colors);
            }));
            this.disposables.add(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.list.smoothScrolling')) {
                    this.updateOptions({
                        smoothScrolling: configurationService.getValue('workbench.list.smoothScrolling')
                    });
                }
            }));
        }
        createModel(user, view, options) {
            return new NonCollapsibleObjectTreeModel(user, view, options);
        }
    };
    SettingsTree = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, listService_1.IListService),
        __param(5, themeService_1.IThemeService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, accessibility_1.IAccessibilityService),
        __param(9, instantiation_1.IInstantiationService)
    ], SettingsTree);
    exports.SettingsTree = SettingsTree;
    let CopySettingIdAction = class CopySettingIdAction extends actions_1.Action {
        constructor(clipboardService) {
            super(CopySettingIdAction.ID, CopySettingIdAction.LABEL);
            this.clipboardService = clipboardService;
        }
        async run(context) {
            if (context) {
                await this.clipboardService.writeText(context.setting.key);
            }
            return Promise.resolve(undefined);
        }
    };
    CopySettingIdAction.ID = 'settings.copySettingId';
    CopySettingIdAction.LABEL = (0, nls_1.localize)('copySettingIdLabel', "Copy Setting ID");
    CopySettingIdAction = __decorate([
        __param(0, clipboardService_1.IClipboardService)
    ], CopySettingIdAction);
    let CopySettingAsJSONAction = class CopySettingAsJSONAction extends actions_1.Action {
        constructor(clipboardService) {
            super(CopySettingAsJSONAction.ID, CopySettingAsJSONAction.LABEL);
            this.clipboardService = clipboardService;
        }
        async run(context) {
            if (context) {
                const jsonResult = `"${context.setting.key}": ${JSON.stringify(context.value, undefined, '  ')}`;
                await this.clipboardService.writeText(jsonResult);
            }
            return Promise.resolve(undefined);
        }
    };
    CopySettingAsJSONAction.ID = 'settings.copySettingAsJSON';
    CopySettingAsJSONAction.LABEL = (0, nls_1.localize)('copySettingAsJSONLabel', "Copy Setting as JSON");
    CopySettingAsJSONAction = __decorate([
        __param(0, clipboardService_1.IClipboardService)
    ], CopySettingAsJSONAction);
    let SyncSettingAction = class SyncSettingAction extends actions_1.Action {
        constructor(setting, configService) {
            super(SyncSettingAction.ID, SyncSettingAction.LABEL);
            this.setting = setting;
            this.configService = configService;
            this._register(event_1.Event.filter(configService.onDidChangeConfiguration, e => e.affectsConfiguration('settingsSync.ignoredSettings'))(() => this.update()));
            this.update();
        }
        async update() {
            const ignoredSettings = (0, settingsMerge_1.getIgnoredSettings)((0, userDataSync_1.getDefaultIgnoredSettings)(), this.configService);
            this.checked = !ignoredSettings.includes(this.setting.key);
        }
        async run() {
            // first remove the current setting completely from ignored settings
            let currentValue = [...this.configService.getValue('settingsSync.ignoredSettings')];
            currentValue = currentValue.filter(v => v !== this.setting.key && v !== `-${this.setting.key}`);
            const defaultIgnoredSettings = (0, userDataSync_1.getDefaultIgnoredSettings)();
            const isDefaultIgnored = defaultIgnoredSettings.includes(this.setting.key);
            const askedToSync = !this.checked;
            // If asked to sync, then add only if it is ignored by default
            if (askedToSync && isDefaultIgnored) {
                currentValue.push(`-${this.setting.key}`);
            }
            // If asked not to sync, then add only if it is not ignored by default
            if (!askedToSync && !isDefaultIgnored) {
                currentValue.push(this.setting.key);
            }
            this.configService.updateValue('settingsSync.ignoredSettings', currentValue.length ? currentValue : undefined, 1 /* ConfigurationTarget.USER */);
            return Promise.resolve(undefined);
        }
    };
    SyncSettingAction.ID = 'settings.stopSyncingSetting';
    SyncSettingAction.LABEL = (0, nls_1.localize)('stopSyncingSetting', "Sync This Setting");
    SyncSettingAction = __decorate([
        __param(1, configuration_1.IConfigurationService)
    ], SyncSettingAction);
});
//# sourceMappingURL=settingsTree.js.map