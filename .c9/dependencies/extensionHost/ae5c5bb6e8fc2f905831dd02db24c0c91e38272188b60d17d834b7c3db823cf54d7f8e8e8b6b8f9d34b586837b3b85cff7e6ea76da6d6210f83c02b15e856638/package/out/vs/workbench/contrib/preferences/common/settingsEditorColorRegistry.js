/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme"], function (require, exports, color_1, nls_1, colorRegistry_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.focusedRowBorder = exports.rowHoverBackground = exports.focusedRowBackground = exports.settingsNumberInputBorder = exports.settingsNumberInputForeground = exports.settingsNumberInputBackground = exports.settingsTextInputBorder = exports.settingsTextInputForeground = exports.settingsTextInputBackground = exports.settingsCheckboxBorder = exports.settingsCheckboxForeground = exports.settingsCheckboxBackground = exports.settingsSelectListBorder = exports.settingsSelectBorder = exports.settingsSelectForeground = exports.settingsSelectBackground = exports.settingsSashBorder = exports.settingsHeaderBorder = exports.modifiedItemIndicator = exports.settingsHeaderForeground = void 0;
    // General setting colors
    exports.settingsHeaderForeground = (0, colorRegistry_1.registerColor)('settings.headerForeground', { light: '#444444', dark: '#e7e7e7', hcDark: '#ffffff', hcLight: '#292929' }, (0, nls_1.localize)('headerForeground', "The foreground color for a section header or active title."));
    exports.modifiedItemIndicator = (0, colorRegistry_1.registerColor)('settings.modifiedItemIndicator', {
        light: new color_1.Color(new color_1.RGBA(102, 175, 224)),
        dark: new color_1.Color(new color_1.RGBA(12, 125, 157)),
        hcDark: new color_1.Color(new color_1.RGBA(0, 73, 122)),
        hcLight: new color_1.Color(new color_1.RGBA(102, 175, 224)),
    }, (0, nls_1.localize)('modifiedItemForeground', "The color of the modified setting indicator."));
    exports.settingsHeaderBorder = (0, colorRegistry_1.registerColor)('settings.headerBorder', { dark: theme_1.PANEL_BORDER, light: theme_1.PANEL_BORDER, hcDark: theme_1.PANEL_BORDER, hcLight: theme_1.PANEL_BORDER }, (0, nls_1.localize)('settingsHeaderBorder', "The color of the header container border."));
    exports.settingsSashBorder = (0, colorRegistry_1.registerColor)('settings.sashBorder', { dark: theme_1.PANEL_BORDER, light: theme_1.PANEL_BORDER, hcDark: theme_1.PANEL_BORDER, hcLight: theme_1.PANEL_BORDER }, (0, nls_1.localize)('settingsSashBorder', "The color of the Settings editor splitview sash border."));
    // Enum control colors
    exports.settingsSelectBackground = (0, colorRegistry_1.registerColor)(`settings.dropdownBackground`, { dark: colorRegistry_1.selectBackground, light: colorRegistry_1.selectBackground, hcDark: colorRegistry_1.selectBackground, hcLight: colorRegistry_1.selectBackground }, (0, nls_1.localize)('settingsDropdownBackground', "Settings editor dropdown background."));
    exports.settingsSelectForeground = (0, colorRegistry_1.registerColor)('settings.dropdownForeground', { dark: colorRegistry_1.selectForeground, light: colorRegistry_1.selectForeground, hcDark: colorRegistry_1.selectForeground, hcLight: colorRegistry_1.selectForeground }, (0, nls_1.localize)('settingsDropdownForeground', "Settings editor dropdown foreground."));
    exports.settingsSelectBorder = (0, colorRegistry_1.registerColor)('settings.dropdownBorder', { dark: colorRegistry_1.selectBorder, light: colorRegistry_1.selectBorder, hcDark: colorRegistry_1.selectBorder, hcLight: colorRegistry_1.selectBorder }, (0, nls_1.localize)('settingsDropdownBorder', "Settings editor dropdown border."));
    exports.settingsSelectListBorder = (0, colorRegistry_1.registerColor)('settings.dropdownListBorder', { dark: colorRegistry_1.editorWidgetBorder, light: colorRegistry_1.editorWidgetBorder, hcDark: colorRegistry_1.editorWidgetBorder, hcLight: colorRegistry_1.editorWidgetBorder }, (0, nls_1.localize)('settingsDropdownListBorder', "Settings editor dropdown list border. This surrounds the options and separates the options from the description."));
    // Bool control colors
    exports.settingsCheckboxBackground = (0, colorRegistry_1.registerColor)('settings.checkboxBackground', { dark: colorRegistry_1.checkboxBackground, light: colorRegistry_1.checkboxBackground, hcDark: colorRegistry_1.checkboxBackground, hcLight: colorRegistry_1.checkboxBackground }, (0, nls_1.localize)('settingsCheckboxBackground', "Settings editor checkbox background."));
    exports.settingsCheckboxForeground = (0, colorRegistry_1.registerColor)('settings.checkboxForeground', { dark: colorRegistry_1.checkboxForeground, light: colorRegistry_1.checkboxForeground, hcDark: colorRegistry_1.checkboxForeground, hcLight: colorRegistry_1.checkboxForeground }, (0, nls_1.localize)('settingsCheckboxForeground', "Settings editor checkbox foreground."));
    exports.settingsCheckboxBorder = (0, colorRegistry_1.registerColor)('settings.checkboxBorder', { dark: colorRegistry_1.checkboxBorder, light: colorRegistry_1.checkboxBorder, hcDark: colorRegistry_1.checkboxBorder, hcLight: colorRegistry_1.checkboxBorder }, (0, nls_1.localize)('settingsCheckboxBorder', "Settings editor checkbox border."));
    // Text control colors
    exports.settingsTextInputBackground = (0, colorRegistry_1.registerColor)('settings.textInputBackground', { dark: colorRegistry_1.inputBackground, light: colorRegistry_1.inputBackground, hcDark: colorRegistry_1.inputBackground, hcLight: colorRegistry_1.inputBackground }, (0, nls_1.localize)('textInputBoxBackground', "Settings editor text input box background."));
    exports.settingsTextInputForeground = (0, colorRegistry_1.registerColor)('settings.textInputForeground', { dark: colorRegistry_1.inputForeground, light: colorRegistry_1.inputForeground, hcDark: colorRegistry_1.inputForeground, hcLight: colorRegistry_1.inputForeground }, (0, nls_1.localize)('textInputBoxForeground', "Settings editor text input box foreground."));
    exports.settingsTextInputBorder = (0, colorRegistry_1.registerColor)('settings.textInputBorder', { dark: colorRegistry_1.inputBorder, light: colorRegistry_1.inputBorder, hcDark: colorRegistry_1.inputBorder, hcLight: colorRegistry_1.inputBorder }, (0, nls_1.localize)('textInputBoxBorder', "Settings editor text input box border."));
    // Number control colors
    exports.settingsNumberInputBackground = (0, colorRegistry_1.registerColor)('settings.numberInputBackground', { dark: colorRegistry_1.inputBackground, light: colorRegistry_1.inputBackground, hcDark: colorRegistry_1.inputBackground, hcLight: colorRegistry_1.inputBackground }, (0, nls_1.localize)('numberInputBoxBackground', "Settings editor number input box background."));
    exports.settingsNumberInputForeground = (0, colorRegistry_1.registerColor)('settings.numberInputForeground', { dark: colorRegistry_1.inputForeground, light: colorRegistry_1.inputForeground, hcDark: colorRegistry_1.inputForeground, hcLight: colorRegistry_1.inputForeground }, (0, nls_1.localize)('numberInputBoxForeground', "Settings editor number input box foreground."));
    exports.settingsNumberInputBorder = (0, colorRegistry_1.registerColor)('settings.numberInputBorder', { dark: colorRegistry_1.inputBorder, light: colorRegistry_1.inputBorder, hcDark: colorRegistry_1.inputBorder, hcLight: colorRegistry_1.inputBorder }, (0, nls_1.localize)('numberInputBoxBorder', "Settings editor number input box border."));
    exports.focusedRowBackground = (0, colorRegistry_1.registerColor)('settings.focusedRowBackground', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.listHoverBackground, .6),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.listHoverBackground, .6),
        hcDark: null,
        hcLight: null,
    }, (0, nls_1.localize)('focusedRowBackground', "The background color of a settings row when focused."));
    exports.rowHoverBackground = (0, colorRegistry_1.registerColor)('settings.rowHoverBackground', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.listHoverBackground, .3),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.listHoverBackground, .3),
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('settings.rowHoverBackground', "The background color of a settings row when hovered."));
    exports.focusedRowBorder = (0, colorRegistry_1.registerColor)('settings.focusedRowBorder', {
        dark: color_1.Color.white.transparent(0.12),
        light: color_1.Color.black.transparent(0.12),
        hcDark: colorRegistry_1.focusBorder,
        hcLight: colorRegistry_1.focusBorder
    }, (0, nls_1.localize)('settings.focusedRowBorder', "The color of the row's top and bottom border when the row is focused."));
});
//# sourceMappingURL=settingsEditorColorRegistry.js.map