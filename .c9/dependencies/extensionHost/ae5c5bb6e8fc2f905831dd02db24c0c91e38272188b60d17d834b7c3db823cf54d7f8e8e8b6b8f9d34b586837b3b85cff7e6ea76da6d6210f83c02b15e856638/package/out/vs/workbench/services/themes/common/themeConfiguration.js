/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/platform/registry/common/platform", "vs/platform/configuration/common/configurationRegistry", "vs/workbench/services/themes/common/colorThemeSchema", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/tokenClassificationRegistry", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/platform"], function (require, exports, nls, types, platform_1, configurationRegistry_1, colorThemeSchema_1, colorRegistry_1, tokenClassificationRegistry_1, workbenchThemeService_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeConfiguration = exports.updateProductIconThemeConfigurationSchemas = exports.updateFileIconThemeConfigurationSchemas = exports.updateColorThemeConfigurationSchemas = exports.DEFAULT_PRODUCT_ICON_THEME_SETTING_VALUE = void 0;
    const DEFAULT_THEME_DARK_SETTING_VALUE = 'Default Dark+';
    const DEFAULT_THEME_LIGHT_SETTING_VALUE = 'Default Light+';
    const DEFAULT_THEME_HC_DARK_SETTING_VALUE = 'Default High Contrast';
    const DEFAULT_THEME_HC_LIGHT_SETTING_VALUE = 'Default High Contrast Light';
    const DEFAULT_FILE_ICON_THEME_SETTING_VALUE = 'vs-seti';
    exports.DEFAULT_PRODUCT_ICON_THEME_SETTING_VALUE = 'Default';
    // Configuration: Themes
    const configurationRegistry = platform_1.Registry.as(configurationRegistry_1.Extensions.Configuration);
    const colorThemeSettingEnum = [];
    const colorThemeSettingEnumItemLabels = [];
    const colorThemeSettingEnumDescriptions = [];
    const colorThemeSettingSchema = {
        type: 'string',
        description: nls.localize('colorTheme', "Specifies the color theme used in the workbench."),
        default: platform_2.isWeb ? DEFAULT_THEME_LIGHT_SETTING_VALUE : DEFAULT_THEME_DARK_SETTING_VALUE,
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const preferredDarkThemeSettingSchema = {
        type: 'string',
        markdownDescription: nls.localize({ key: 'preferredDarkColorTheme', comment: ['`#{0}#` will become a link to an other setting. Do not remove backtick or #'] }, 'Specifies the preferred color theme for dark OS appearance when `#{0}#` is enabled.', workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME),
        default: DEFAULT_THEME_DARK_SETTING_VALUE,
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const preferredLightThemeSettingSchema = {
        type: 'string',
        markdownDescription: nls.localize({ key: 'preferredLightColorTheme', comment: ['`#{0}#` will become a link to an other setting. Do not remove backtick or #'] }, 'Specifies the preferred color theme for light OS appearance when `#{0}#` is enabled.', workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME),
        default: DEFAULT_THEME_LIGHT_SETTING_VALUE,
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const preferredHCDarkThemeSettingSchema = {
        type: 'string',
        markdownDescription: nls.localize({ key: 'preferredHCDarkColorTheme', comment: ['`#{0}#` will become a link to an other setting. Do not remove backtick or #'] }, 'Specifies the preferred color theme used in high contrast dark mode when `#{0}#` is enabled.', workbenchThemeService_1.ThemeSettings.DETECT_HC),
        default: DEFAULT_THEME_HC_DARK_SETTING_VALUE,
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const preferredHCLightThemeSettingSchema = {
        type: 'string',
        markdownDescription: nls.localize({ key: 'preferredHCLightColorTheme', comment: ['`#{0}#` will become a link to an other setting. Do not remove backtick or #'] }, 'Specifies the preferred color theme used in high contrast light mode when `#{0}#` is enabled.', workbenchThemeService_1.ThemeSettings.DETECT_HC),
        default: DEFAULT_THEME_HC_LIGHT_SETTING_VALUE,
        enum: colorThemeSettingEnum,
        enumDescriptions: colorThemeSettingEnumDescriptions,
        enumItemLabels: colorThemeSettingEnumItemLabels,
        errorMessage: nls.localize('colorThemeError', "Theme is unknown or not installed."),
    };
    const detectColorSchemeSettingSchema = {
        type: 'boolean',
        markdownDescription: nls.localize('detectColorScheme', 'If set, automatically switch to the preferred color theme based on the OS appearance. If the OS appearance is dark, the theme specified at `#{0}#` is used, for light `#{1}#`.', workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME, workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME),
        default: false
    };
    const colorCustomizationsSchema = {
        type: 'object',
        description: nls.localize('workbenchColors', "Overrides colors from the currently selected color theme."),
        allOf: [{ $ref: colorRegistry_1.workbenchColorsSchemaId }],
        default: {},
        defaultSnippets: [{
                body: {}
            }]
    };
    const fileIconThemeSettingSchema = {
        type: ['string', 'null'],
        default: DEFAULT_FILE_ICON_THEME_SETTING_VALUE,
        description: nls.localize('iconTheme', "Specifies the file icon theme used in the workbench or 'null' to not show any file icons."),
        enum: [null],
        enumItemLabels: [nls.localize('noIconThemeLabel', 'None')],
        enumDescriptions: [nls.localize('noIconThemeDesc', 'No file icons')],
        errorMessage: nls.localize('iconThemeError', "File icon theme is unknown or not installed.")
    };
    const productIconThemeSettingSchema = {
        type: ['string', 'null'],
        default: exports.DEFAULT_PRODUCT_ICON_THEME_SETTING_VALUE,
        description: nls.localize('productIconTheme', "Specifies the product icon theme used."),
        enum: [exports.DEFAULT_PRODUCT_ICON_THEME_SETTING_VALUE],
        enumItemLabels: [nls.localize('defaultProductIconThemeLabel', 'Default')],
        enumDescriptions: [nls.localize('defaultProductIconThemeDesc', 'Default')],
        errorMessage: nls.localize('productIconThemeError', "Product icon theme is unknown or not installed.")
    };
    const detectHCSchemeSettingSchema = {
        type: 'boolean',
        default: true,
        markdownDescription: nls.localize('autoDetectHighContrast', "If enabled, will automatically change to high contrast theme if the OS is using a high contrast theme. The high contrast theme to use is specified by `#{0}#` and `#{1}#`", workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME, workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME),
        scope: 1 /* ConfigurationScope.APPLICATION */
    };
    const themeSettingsConfiguration = {
        id: 'workbench',
        order: 7.1,
        type: 'object',
        properties: {
            [workbenchThemeService_1.ThemeSettings.COLOR_THEME]: colorThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME]: preferredDarkThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME]: preferredLightThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME]: preferredHCDarkThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME]: preferredHCLightThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME]: fileIconThemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.COLOR_CUSTOMIZATIONS]: colorCustomizationsSchema,
            [workbenchThemeService_1.ThemeSettings.PRODUCT_ICON_THEME]: productIconThemeSettingSchema
        }
    };
    configurationRegistry.registerConfiguration(themeSettingsConfiguration);
    const themeSettingsWindowConfiguration = {
        id: 'window',
        order: 8.1,
        type: 'object',
        properties: {
            [workbenchThemeService_1.ThemeSettings.DETECT_HC]: detectHCSchemeSettingSchema,
            [workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME]: detectColorSchemeSettingSchema,
        }
    };
    configurationRegistry.registerConfiguration(themeSettingsWindowConfiguration);
    function tokenGroupSettings(description) {
        return {
            description,
            $ref: colorThemeSchema_1.textmateColorGroupSchemaId
        };
    }
    const themeSpecificSettingKey = '^\\[[^\\]]*(\\]\\s*\\[[^\\]]*)*\\]$';
    const tokenColorSchema = {
        type: 'object',
        properties: {
            comments: tokenGroupSettings(nls.localize('editorColors.comments', "Sets the colors and styles for comments")),
            strings: tokenGroupSettings(nls.localize('editorColors.strings', "Sets the colors and styles for strings literals.")),
            keywords: tokenGroupSettings(nls.localize('editorColors.keywords', "Sets the colors and styles for keywords.")),
            numbers: tokenGroupSettings(nls.localize('editorColors.numbers', "Sets the colors and styles for number literals.")),
            types: tokenGroupSettings(nls.localize('editorColors.types', "Sets the colors and styles for type declarations and references.")),
            functions: tokenGroupSettings(nls.localize('editorColors.functions', "Sets the colors and styles for functions declarations and references.")),
            variables: tokenGroupSettings(nls.localize('editorColors.variables', "Sets the colors and styles for variables declarations and references.")),
            textMateRules: {
                description: nls.localize('editorColors.textMateRules', 'Sets colors and styles using textmate theming rules (advanced).'),
                $ref: colorThemeSchema_1.textmateColorsSchemaId
            },
            semanticHighlighting: {
                description: nls.localize('editorColors.semanticHighlighting', 'Whether semantic highlighting should be enabled for this theme.'),
                deprecationMessage: nls.localize('editorColors.semanticHighlighting.deprecationMessage', 'Use `enabled` in `editor.semanticTokenColorCustomizations` setting instead.'),
                markdownDeprecationMessage: nls.localize('editorColors.semanticHighlighting.deprecationMessageMarkdown', 'Use `enabled` in `#editor.semanticTokenColorCustomizations#` setting instead.'),
                type: 'boolean'
            }
        },
        additionalProperties: false
    };
    const tokenColorCustomizationSchema = {
        description: nls.localize('editorColors', "Overrides editor syntax colors and font style from the currently selected color theme."),
        default: {},
        allOf: [Object.assign(Object.assign({}, tokenColorSchema), { patternProperties: { '^\\[': {} } })]
    };
    const semanticTokenColorSchema = {
        type: 'object',
        properties: {
            enabled: {
                type: 'boolean',
                description: nls.localize('editorColors.semanticHighlighting.enabled', 'Whether semantic highlighting is enabled or disabled for this theme'),
                suggestSortText: '0_enabled'
            },
            rules: {
                $ref: tokenClassificationRegistry_1.tokenStylingSchemaId,
                description: nls.localize('editorColors.semanticHighlighting.rules', 'Semantic token styling rules for this theme.'),
                suggestSortText: '0_rules'
            }
        },
        additionalProperties: false
    };
    const semanticTokenColorCustomizationSchema = {
        description: nls.localize('semanticTokenColors', "Overrides editor semantic token color and styles from the currently selected color theme."),
        default: {},
        allOf: [Object.assign(Object.assign({}, semanticTokenColorSchema), { patternProperties: { '^\\[': {} } })]
    };
    const tokenColorCustomizationConfiguration = {
        id: 'editor',
        order: 7.2,
        type: 'object',
        properties: {
            [workbenchThemeService_1.ThemeSettings.TOKEN_COLOR_CUSTOMIZATIONS]: tokenColorCustomizationSchema,
            [workbenchThemeService_1.ThemeSettings.SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS]: semanticTokenColorCustomizationSchema
        }
    };
    configurationRegistry.registerConfiguration(tokenColorCustomizationConfiguration);
    function updateColorThemeConfigurationSchemas(themes) {
        // updates enum for the 'workbench.colorTheme` setting
        colorThemeSettingEnum.splice(0, colorThemeSettingEnum.length, ...themes.map(t => t.settingsId));
        colorThemeSettingEnumDescriptions.splice(0, colorThemeSettingEnumDescriptions.length, ...themes.map(t => t.description || ''));
        colorThemeSettingEnumItemLabels.splice(0, colorThemeSettingEnumItemLabels.length, ...themes.map(t => t.label || ''));
        const themeSpecificWorkbenchColors = { properties: {} };
        const themeSpecificTokenColors = { properties: {} };
        const themeSpecificSemanticTokenColors = { properties: {} };
        const workbenchColors = { $ref: colorRegistry_1.workbenchColorsSchemaId, additionalProperties: false };
        const tokenColors = { properties: tokenColorSchema.properties, additionalProperties: false };
        for (let t of themes) {
            // add theme specific color customization ("[Abyss]":{ ... })
            const themeId = `[${t.settingsId}]`;
            themeSpecificWorkbenchColors.properties[themeId] = workbenchColors;
            themeSpecificTokenColors.properties[themeId] = tokenColors;
            themeSpecificSemanticTokenColors.properties[themeId] = semanticTokenColorSchema;
        }
        themeSpecificWorkbenchColors.patternProperties = { [themeSpecificSettingKey]: workbenchColors };
        themeSpecificTokenColors.patternProperties = { [themeSpecificSettingKey]: tokenColors };
        themeSpecificSemanticTokenColors.patternProperties = { [themeSpecificSettingKey]: semanticTokenColorSchema };
        colorCustomizationsSchema.allOf[1] = themeSpecificWorkbenchColors;
        tokenColorCustomizationSchema.allOf[1] = themeSpecificTokenColors;
        semanticTokenColorCustomizationSchema.allOf[1] = themeSpecificSemanticTokenColors;
        configurationRegistry.notifyConfigurationSchemaUpdated(themeSettingsConfiguration, tokenColorCustomizationConfiguration);
    }
    exports.updateColorThemeConfigurationSchemas = updateColorThemeConfigurationSchemas;
    function updateFileIconThemeConfigurationSchemas(themes) {
        fileIconThemeSettingSchema.enum.splice(1, Number.MAX_VALUE, ...themes.map(t => t.settingsId));
        fileIconThemeSettingSchema.enumItemLabels.splice(1, Number.MAX_VALUE, ...themes.map(t => t.label));
        fileIconThemeSettingSchema.enumDescriptions.splice(1, Number.MAX_VALUE, ...themes.map(t => t.description || ''));
        configurationRegistry.notifyConfigurationSchemaUpdated(themeSettingsConfiguration);
    }
    exports.updateFileIconThemeConfigurationSchemas = updateFileIconThemeConfigurationSchemas;
    function updateProductIconThemeConfigurationSchemas(themes) {
        productIconThemeSettingSchema.enum.splice(1, Number.MAX_VALUE, ...themes.map(t => t.settingsId));
        productIconThemeSettingSchema.enumItemLabels.splice(1, Number.MAX_VALUE, ...themes.map(t => t.label));
        productIconThemeSettingSchema.enumDescriptions.splice(1, Number.MAX_VALUE, ...themes.map(t => t.description || ''));
        configurationRegistry.notifyConfigurationSchemaUpdated(themeSettingsConfiguration);
    }
    exports.updateProductIconThemeConfigurationSchemas = updateProductIconThemeConfigurationSchemas;
    class ThemeConfiguration {
        constructor(configurationService) {
            this.configurationService = configurationService;
        }
        get colorTheme() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.COLOR_THEME);
        }
        get fileIconTheme() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME);
        }
        get productIconTheme() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.PRODUCT_ICON_THEME);
        }
        get colorCustomizations() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.COLOR_CUSTOMIZATIONS) || {};
        }
        get tokenColorCustomizations() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.TOKEN_COLOR_CUSTOMIZATIONS) || {};
        }
        get semanticTokenColorCustomizations() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS);
        }
        async setColorTheme(theme, settingsTarget) {
            await this.writeConfiguration(workbenchThemeService_1.ThemeSettings.COLOR_THEME, theme.settingsId, settingsTarget);
            return theme;
        }
        async setFileIconTheme(theme, settingsTarget) {
            await this.writeConfiguration(workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME, theme.settingsId, settingsTarget);
            return theme;
        }
        async setProductIconTheme(theme, settingsTarget) {
            await this.writeConfiguration(workbenchThemeService_1.ThemeSettings.PRODUCT_ICON_THEME, theme.settingsId, settingsTarget);
            return theme;
        }
        isDefaultColorTheme() {
            var _a;
            let settings = this.configurationService.inspect(workbenchThemeService_1.ThemeSettings.COLOR_THEME);
            return settings && ((_a = settings.default) === null || _a === void 0 ? void 0 : _a.value) === settings.value;
        }
        findAutoConfigurationTarget(key) {
            let settings = this.configurationService.inspect(key);
            if (!types.isUndefined(settings.workspaceFolderValue)) {
                return 5 /* ConfigurationTarget.WORKSPACE_FOLDER */;
            }
            else if (!types.isUndefined(settings.workspaceValue)) {
                return 4 /* ConfigurationTarget.WORKSPACE */;
            }
            else if (!types.isUndefined(settings.userRemote)) {
                return 3 /* ConfigurationTarget.USER_REMOTE */;
            }
            return 1 /* ConfigurationTarget.USER */;
        }
        async writeConfiguration(key, value, settingsTarget) {
            if (settingsTarget === undefined || settingsTarget === 'preview') {
                return;
            }
            let settings = this.configurationService.inspect(key);
            if (settingsTarget === 'auto') {
                return this.configurationService.updateValue(key, value);
            }
            if (settingsTarget === 1 /* ConfigurationTarget.USER */) {
                if (value === settings.userValue) {
                    return Promise.resolve(undefined); // nothing to do
                }
                else if (value === settings.defaultValue) {
                    if (types.isUndefined(settings.userValue)) {
                        return Promise.resolve(undefined); // nothing to do
                    }
                    value = undefined; // remove configuration from user settings
                }
            }
            else if (settingsTarget === 4 /* ConfigurationTarget.WORKSPACE */ || settingsTarget === 5 /* ConfigurationTarget.WORKSPACE_FOLDER */ || settingsTarget === 3 /* ConfigurationTarget.USER_REMOTE */) {
                if (value === settings.value) {
                    return Promise.resolve(undefined); // nothing to do
                }
            }
            return this.configurationService.updateValue(key, value, settingsTarget);
        }
    }
    exports.ThemeConfiguration = ThemeConfiguration;
});
//# sourceMappingURL=themeConfiguration.js.map