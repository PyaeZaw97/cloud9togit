/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/async", "vs/base/common/color", "vs/base/common/event", "vs/base/common/types", "vs/nls", "vs/platform/jsonschemas/common/jsonContributionRegistry", "vs/platform/registry/common/platform"], function (require, exports, async_1, color_1, event_1, types_1, nls, jsonContributionRegistry_1, platform) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.workbenchColorsSchemaId = exports.resolveColorValue = exports.ifDefinedThenElse = exports.oneOf = exports.transparent = exports.lighten = exports.darken = exports.executeTransform = exports.chartsPurple = exports.chartsGreen = exports.chartsOrange = exports.chartsYellow = exports.chartsBlue = exports.chartsRed = exports.chartsLines = exports.chartsForeground = exports.problemsInfoIconForeground = exports.problemsWarningIconForeground = exports.problemsErrorIconForeground = exports.minimapSliderActiveBackground = exports.minimapSliderHoverBackground = exports.minimapSliderBackground = exports.minimapForegroundOpacity = exports.minimapBackground = exports.minimapWarning = exports.minimapError = exports.minimapSelection = exports.minimapSelectionOccurrenceHighlight = exports.minimapFindMatch = exports.overviewRulerSelectionHighlightForeground = exports.overviewRulerFindMatchForeground = exports.overviewRulerCommonContentForeground = exports.overviewRulerIncomingContentForeground = exports.overviewRulerCurrentContentForeground = exports.mergeBorder = exports.mergeCommonContentBackground = exports.mergeCommonHeaderBackground = exports.mergeIncomingContentBackground = exports.mergeIncomingHeaderBackground = exports.mergeCurrentContentBackground = exports.mergeCurrentHeaderBackground = exports.breadcrumbsPickerBackground = exports.breadcrumbsActiveSelectionForeground = exports.breadcrumbsFocusForeground = exports.breadcrumbsBackground = exports.breadcrumbsForeground = exports.snippetFinalTabstopHighlightBorder = exports.snippetFinalTabstopHighlightBackground = exports.snippetTabstopHighlightBorder = exports.snippetTabstopHighlightBackground = exports.toolbarActiveBackground = exports.toolbarHoverOutline = exports.toolbarHoverBackground = exports.menuSeparatorBackground = exports.menuSelectionBorder = exports.menuSelectionBackground = exports.menuSelectionForeground = exports.menuBackground = exports.menuForeground = exports.menuBorder = exports.quickInputListFocusBackground = exports.quickInputListFocusIconForeground = exports.quickInputListFocusForeground = exports._deprecatedQuickInputListFocusBackground = exports.listDeemphasizedForeground = exports.tableOddRowsBackgroundColor = exports.tableColumnsBorder = exports.treeIndentGuidesStroke = exports.listFilterMatchHighlightBorder = exports.listFilterMatchHighlight = exports.listFilterWidgetNoMatchesOutline = exports.listFilterWidgetOutline = exports.listFilterWidgetBackground = exports.listWarningForeground = exports.listErrorForeground = exports.listInvalidItemForeground = exports.listFocusHighlightForeground = exports.listHighlightForeground = exports.listDropBackground = exports.listHoverForeground = exports.listHoverBackground = exports.listInactiveFocusOutline = exports.listInactiveFocusBackground = exports.listInactiveSelectionIconForeground = exports.listInactiveSelectionForeground = exports.listInactiveSelectionBackground = exports.listActiveSelectionIconForeground = exports.listActiveSelectionForeground = exports.listActiveSelectionBackground = exports.listFocusOutline = exports.listFocusForeground = exports.listFocusBackground = exports.diffDiagonalFill = exports.diffBorder = exports.diffRemovedOutline = exports.diffInsertedOutline = exports.diffOverviewRulerRemoved = exports.diffOverviewRulerInserted = exports.diffRemovedLineGutter = exports.diffInsertedLineGutter = exports.diffRemovedLine = exports.diffInsertedLine = exports.diffRemoved = exports.diffInserted = exports.defaultRemoveColor = exports.defaultInsertColor = exports.editorLightBulbAutoFixForeground = exports.editorLightBulbForeground = exports.editorInlayHintParameterBackground = exports.editorInlayHintParameterForeground = exports.editorInlayHintTypeBackground = exports.editorInlayHintTypeForeground = exports.editorInlayHintBackground = exports.editorInlayHintForeground = exports.editorActiveLinkForeground = exports.editorHoverStatusBarBackground = exports.editorHoverBorder = exports.editorHoverForeground = exports.editorHoverBackground = exports.editorHoverHighlight = exports.searchEditorFindMatchBorder = exports.searchEditorFindMatch = exports.editorFindRangeHighlightBorder = exports.editorFindMatchHighlightBorder = exports.editorFindMatchBorder = exports.editorFindRangeHighlight = exports.editorFindMatchHighlight = exports.editorFindMatch = exports.editorSelectionHighlightBorder = exports.editorSelectionHighlight = exports.editorInactiveSelection = exports.editorSelectionForeground = exports.editorSelectionBackground = exports.keybindingLabelBottomBorder = exports.keybindingLabelBorder = exports.keybindingLabelForeground = exports.keybindingLabelBackground = exports.pickerGroupBorder = exports.pickerGroupForeground = exports.quickInputTitleBackground = exports.quickInputForeground = exports.quickInputBackground = exports.editorWidgetResizeBorder = exports.editorWidgetBorder = exports.editorWidgetForeground = exports.editorWidgetBackground = exports.editorForeground = exports.editorBackground = exports.sashHoverBorder = exports.editorHintBorder = exports.editorHintForeground = exports.editorInfoBorder = exports.editorInfoForeground = exports.editorInfoBackground = exports.editorWarningBorder = exports.editorWarningForeground = exports.editorWarningBackground = exports.editorErrorBorder = exports.editorErrorForeground = exports.editorErrorBackground = exports.progressBarBackground = exports.scrollbarSliderActiveBackground = exports.scrollbarSliderHoverBackground = exports.scrollbarSliderBackground = exports.scrollbarShadow = exports.badgeForeground = exports.badgeBackground = exports.buttonSecondaryHoverBackground = exports.buttonSecondaryBackground = exports.buttonSecondaryForeground = exports.buttonBorder = exports.buttonHoverBackground = exports.buttonBackground = exports.buttonForeground = exports.checkboxBorder = exports.checkboxForeground = exports.checkboxBackground = exports.selectBorder = exports.selectForeground = exports.selectListBackground = exports.selectBackground = exports.inputValidationErrorBorder = exports.inputValidationErrorForeground = exports.inputValidationErrorBackground = exports.inputValidationWarningBorder = exports.inputValidationWarningForeground = exports.inputValidationWarningBackground = exports.inputValidationInfoBorder = exports.inputValidationInfoForeground = exports.inputValidationInfoBackground = exports.inputPlaceholderForeground = exports.inputActiveOptionForeground = exports.inputActiveOptionBackground = exports.inputActiveOptionHoverBackground = exports.inputActiveOptionBorder = exports.inputBorder = exports.inputForeground = exports.inputBackground = exports.widgetShadow = exports.textCodeBlockBackground = exports.textBlockQuoteBorder = exports.textBlockQuoteBackground = exports.textPreformatForeground = exports.textLinkActiveForeground = exports.textLinkForeground = exports.textSeparatorForeground = exports.selectionBackground = exports.activeContrastBorder = exports.contrastBorder = exports.focusBorder = exports.iconForeground = exports.descriptionForeground = exports.errorForeground = exports.disabledForeground = exports.foreground = exports.getColorRegistry = exports.registerColor = exports.Extensions = exports.ColorTransformType = exports.asCssVariableName = void 0;
    /**
     * Returns the css variable name for the given color identifier. Dots (`.`) are replaced with hyphens (`-`) and
     * everything is prefixed with `--vscode-`.
     *
     * @sample `editorSuggestWidget.background` is `--vscode-editorSuggestWidget-background`.
     */
    function asCssVariableName(colorIdent) {
        return `--vscode-${colorIdent.replace(/\./g, '-')}`;
    }
    exports.asCssVariableName = asCssVariableName;
    var ColorTransformType;
    (function (ColorTransformType) {
        ColorTransformType[ColorTransformType["Darken"] = 0] = "Darken";
        ColorTransformType[ColorTransformType["Lighten"] = 1] = "Lighten";
        ColorTransformType[ColorTransformType["Transparent"] = 2] = "Transparent";
        ColorTransformType[ColorTransformType["OneOf"] = 3] = "OneOf";
        ColorTransformType[ColorTransformType["LessProminent"] = 4] = "LessProminent";
        ColorTransformType[ColorTransformType["IfDefinedThenElse"] = 5] = "IfDefinedThenElse";
    })(ColorTransformType = exports.ColorTransformType || (exports.ColorTransformType = {}));
    // color registry
    exports.Extensions = {
        ColorContribution: 'base.contributions.colors'
    };
    class ColorRegistry {
        constructor() {
            this._onDidChangeSchema = new event_1.Emitter();
            this.onDidChangeSchema = this._onDidChangeSchema.event;
            this.colorSchema = { type: 'object', properties: {} };
            this.colorReferenceSchema = { type: 'string', enum: [], enumDescriptions: [] };
            this.colorsById = {};
        }
        registerColor(id, defaults, description, needsTransparency = false, deprecationMessage) {
            let colorContribution = { id, description, defaults, needsTransparency, deprecationMessage };
            this.colorsById[id] = colorContribution;
            let propertySchema = { type: 'string', description, format: 'color-hex', defaultSnippets: [{ body: '${1:#ff0000}' }] };
            if (deprecationMessage) {
                propertySchema.deprecationMessage = deprecationMessage;
            }
            this.colorSchema.properties[id] = propertySchema;
            this.colorReferenceSchema.enum.push(id);
            this.colorReferenceSchema.enumDescriptions.push(description);
            this._onDidChangeSchema.fire();
            return id;
        }
        deregisterColor(id) {
            delete this.colorsById[id];
            delete this.colorSchema.properties[id];
            const index = this.colorReferenceSchema.enum.indexOf(id);
            if (index !== -1) {
                this.colorReferenceSchema.enum.splice(index, 1);
                this.colorReferenceSchema.enumDescriptions.splice(index, 1);
            }
            this._onDidChangeSchema.fire();
        }
        getColors() {
            return Object.keys(this.colorsById).map(id => this.colorsById[id]);
        }
        resolveDefaultColor(id, theme) {
            const colorDesc = this.colorsById[id];
            if (colorDesc && colorDesc.defaults) {
                const colorValue = colorDesc.defaults[theme.type];
                return resolveColorValue(colorValue, theme);
            }
            return undefined;
        }
        getColorSchema() {
            return this.colorSchema;
        }
        getColorReferenceSchema() {
            return this.colorReferenceSchema;
        }
        toString() {
            let sorter = (a, b) => {
                let cat1 = a.indexOf('.') === -1 ? 0 : 1;
                let cat2 = b.indexOf('.') === -1 ? 0 : 1;
                if (cat1 !== cat2) {
                    return cat1 - cat2;
                }
                return a.localeCompare(b);
            };
            return Object.keys(this.colorsById).sort(sorter).map(k => `- \`${k}\`: ${this.colorsById[k].description}`).join('\n');
        }
    }
    const colorRegistry = new ColorRegistry();
    platform.Registry.add(exports.Extensions.ColorContribution, colorRegistry);
    function migrateColorDefaults(o) {
        if (o === null) {
            return o;
        }
        if (typeof o.hcLight === 'undefined') {
            if (o.hcDark === null || typeof o.hcDark === 'string') {
                o.hcLight = o.hcDark;
            }
            else {
                o.hcLight = o.light;
            }
        }
        return o;
    }
    function registerColor(id, defaults, description, needsTransparency, deprecationMessage) {
        return colorRegistry.registerColor(id, migrateColorDefaults(defaults), description, needsTransparency, deprecationMessage);
    }
    exports.registerColor = registerColor;
    function getColorRegistry() {
        return colorRegistry;
    }
    exports.getColorRegistry = getColorRegistry;
    // ----- base colors
    exports.foreground = registerColor('foreground', { dark: '#CCCCCC', light: '#616161', hcDark: '#FFFFFF', hcLight: '#292929' }, nls.localize('foreground', "Overall foreground color. This color is only used if not overridden by a component."));
    exports.disabledForeground = registerColor('disabledForeground', { dark: '#CCCCCC80', light: '#61616180', hcDark: '#A5A5A5', hcLight: '#7F7F7F' }, nls.localize('disabledForeground', "Overall foreground for disabled elements. This color is only used if not overridden by a component."));
    exports.errorForeground = registerColor('errorForeground', { dark: '#F48771', light: '#A1260D', hcDark: '#F48771', hcLight: '#B5200D' }, nls.localize('errorForeground', "Overall foreground color for error messages. This color is only used if not overridden by a component."));
    exports.descriptionForeground = registerColor('descriptionForeground', { light: '#717171', dark: transparent(exports.foreground, 0.7), hcDark: transparent(exports.foreground, 0.7), hcLight: transparent(exports.foreground, 0.7) }, nls.localize('descriptionForeground', "Foreground color for description text providing additional information, for example for a label."));
    exports.iconForeground = registerColor('icon.foreground', { dark: '#C5C5C5', light: '#424242', hcDark: '#FFFFFF', hcLight: '#292929' }, nls.localize('iconForeground', "The default color for icons in the workbench."));
    exports.focusBorder = registerColor('focusBorder', { dark: '#007FD4', light: '#0090F1', hcDark: '#F38518', hcLight: '#0F4A85' }, nls.localize('focusBorder', "Overall border color for focused elements. This color is only used if not overridden by a component."));
    exports.contrastBorder = registerColor('contrastBorder', { light: null, dark: null, hcDark: '#6FC3DF', hcLight: '#0F4A85' }, nls.localize('contrastBorder', "An extra border around elements to separate them from others for greater contrast."));
    exports.activeContrastBorder = registerColor('contrastActiveBorder', { light: null, dark: null, hcDark: exports.focusBorder, hcLight: exports.focusBorder }, nls.localize('activeContrastBorder', "An extra border around active elements to separate them from others for greater contrast."));
    exports.selectionBackground = registerColor('selection.background', { light: null, dark: null, hcDark: null, hcLight: null }, nls.localize('selectionBackground', "The background color of text selections in the workbench (e.g. for input fields or text areas). Note that this does not apply to selections within the editor."));
    // ------ text colors
    exports.textSeparatorForeground = registerColor('textSeparator.foreground', { light: '#0000002e', dark: '#ffffff2e', hcDark: color_1.Color.black, hcLight: '#292929' }, nls.localize('textSeparatorForeground', "Color for text separators."));
    exports.textLinkForeground = registerColor('textLink.foreground', { light: '#006AB1', dark: '#3794FF', hcDark: '#3794FF', hcLight: '#0F4A85' }, nls.localize('textLinkForeground', "Foreground color for links in text."));
    exports.textLinkActiveForeground = registerColor('textLink.activeForeground', { light: '#006AB1', dark: '#3794FF', hcDark: '#3794FF', hcLight: '#0F4A85' }, nls.localize('textLinkActiveForeground', "Foreground color for links in text when clicked on and on mouse hover."));
    exports.textPreformatForeground = registerColor('textPreformat.foreground', { light: '#A31515', dark: '#D7BA7D', hcDark: '#D7BA7D', hcLight: '#292929' }, nls.localize('textPreformatForeground', "Foreground color for preformatted text segments."));
    exports.textBlockQuoteBackground = registerColor('textBlockQuote.background', { light: '#7f7f7f1a', dark: '#7f7f7f1a', hcDark: null, hcLight: '#F2F2F2' }, nls.localize('textBlockQuoteBackground', "Background color for block quotes in text."));
    exports.textBlockQuoteBorder = registerColor('textBlockQuote.border', { light: '#007acc80', dark: '#007acc80', hcDark: color_1.Color.white, hcLight: '#292929' }, nls.localize('textBlockQuoteBorder', "Border color for block quotes in text."));
    exports.textCodeBlockBackground = registerColor('textCodeBlock.background', { light: '#dcdcdc66', dark: '#0a0a0a66', hcDark: color_1.Color.black, hcLight: '#F2F2F2' }, nls.localize('textCodeBlockBackground', "Background color for code blocks in text."));
    // ----- widgets
    exports.widgetShadow = registerColor('widget.shadow', { dark: transparent(color_1.Color.black, .36), light: transparent(color_1.Color.black, .16), hcDark: null, hcLight: null }, nls.localize('widgetShadow', 'Shadow color of widgets such as find/replace inside the editor.'));
    exports.inputBackground = registerColor('input.background', { dark: '#3C3C3C', light: color_1.Color.white, hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('inputBoxBackground', "Input box background."));
    exports.inputForeground = registerColor('input.foreground', { dark: exports.foreground, light: exports.foreground, hcDark: exports.foreground, hcLight: exports.foreground }, nls.localize('inputBoxForeground', "Input box foreground."));
    exports.inputBorder = registerColor('input.border', { dark: null, light: null, hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('inputBoxBorder', "Input box border."));
    exports.inputActiveOptionBorder = registerColor('inputOption.activeBorder', { dark: '#007ACC00', light: '#007ACC00', hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('inputBoxActiveOptionBorder', "Border color of activated options in input fields."));
    exports.inputActiveOptionHoverBackground = registerColor('inputOption.hoverBackground', { dark: '#5a5d5e80', light: '#b8b8b850', hcDark: null, hcLight: null }, nls.localize('inputOption.hoverBackground', "Background color of activated options in input fields."));
    exports.inputActiveOptionBackground = registerColor('inputOption.activeBackground', { dark: transparent(exports.focusBorder, 0.4), light: transparent(exports.focusBorder, 0.2), hcDark: color_1.Color.transparent, hcLight: color_1.Color.transparent }, nls.localize('inputOption.activeBackground', "Background hover color of options in input fields."));
    exports.inputActiveOptionForeground = registerColor('inputOption.activeForeground', { dark: color_1.Color.white, light: color_1.Color.black, hcDark: null, hcLight: exports.foreground }, nls.localize('inputOption.activeForeground', "Foreground color of activated options in input fields."));
    exports.inputPlaceholderForeground = registerColor('input.placeholderForeground', { light: transparent(exports.foreground, 0.5), dark: transparent(exports.foreground, 0.5), hcDark: transparent(exports.foreground, 0.7), hcLight: transparent(exports.foreground, 0.7) }, nls.localize('inputPlaceholderForeground', "Input box foreground color for placeholder text."));
    exports.inputValidationInfoBackground = registerColor('inputValidation.infoBackground', { dark: '#063B49', light: '#D6ECF2', hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('inputValidationInfoBackground', "Input validation background color for information severity."));
    exports.inputValidationInfoForeground = registerColor('inputValidation.infoForeground', { dark: null, light: null, hcDark: null, hcLight: exports.foreground }, nls.localize('inputValidationInfoForeground', "Input validation foreground color for information severity."));
    exports.inputValidationInfoBorder = registerColor('inputValidation.infoBorder', { dark: '#007acc', light: '#007acc', hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('inputValidationInfoBorder', "Input validation border color for information severity."));
    exports.inputValidationWarningBackground = registerColor('inputValidation.warningBackground', { dark: '#352A05', light: '#F6F5D2', hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('inputValidationWarningBackground', "Input validation background color for warning severity."));
    exports.inputValidationWarningForeground = registerColor('inputValidation.warningForeground', { dark: null, light: null, hcDark: null, hcLight: exports.foreground }, nls.localize('inputValidationWarningForeground', "Input validation foreground color for warning severity."));
    exports.inputValidationWarningBorder = registerColor('inputValidation.warningBorder', { dark: '#B89500', light: '#B89500', hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('inputValidationWarningBorder', "Input validation border color for warning severity."));
    exports.inputValidationErrorBackground = registerColor('inputValidation.errorBackground', { dark: '#5A1D1D', light: '#F2DEDE', hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('inputValidationErrorBackground', "Input validation background color for error severity."));
    exports.inputValidationErrorForeground = registerColor('inputValidation.errorForeground', { dark: null, light: null, hcDark: null, hcLight: exports.foreground }, nls.localize('inputValidationErrorForeground', "Input validation foreground color for error severity."));
    exports.inputValidationErrorBorder = registerColor('inputValidation.errorBorder', { dark: '#BE1100', light: '#BE1100', hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('inputValidationErrorBorder', "Input validation border color for error severity."));
    exports.selectBackground = registerColor('dropdown.background', { dark: '#3C3C3C', light: color_1.Color.white, hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('dropdownBackground', "Dropdown background."));
    exports.selectListBackground = registerColor('dropdown.listBackground', { dark: null, light: null, hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('dropdownListBackground', "Dropdown list background."));
    exports.selectForeground = registerColor('dropdown.foreground', { dark: '#F0F0F0', light: null, hcDark: color_1.Color.white, hcLight: exports.foreground }, nls.localize('dropdownForeground', "Dropdown foreground."));
    exports.selectBorder = registerColor('dropdown.border', { dark: exports.selectBackground, light: '#CECECE', hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('dropdownBorder', "Dropdown border."));
    exports.checkboxBackground = registerColor('checkbox.background', { dark: exports.selectBackground, light: exports.selectBackground, hcDark: exports.selectBackground, hcLight: exports.selectBackground }, nls.localize('checkbox.background', "Background color of checkbox widget."));
    exports.checkboxForeground = registerColor('checkbox.foreground', { dark: exports.selectForeground, light: exports.selectForeground, hcDark: exports.selectForeground, hcLight: exports.selectForeground }, nls.localize('checkbox.foreground', "Foreground color of checkbox widget."));
    exports.checkboxBorder = registerColor('checkbox.border', { dark: exports.selectBorder, light: exports.selectBorder, hcDark: exports.selectBorder, hcLight: exports.selectBorder }, nls.localize('checkbox.border', "Border color of checkbox widget."));
    exports.buttonForeground = registerColor('button.foreground', { dark: color_1.Color.white, light: color_1.Color.white, hcDark: color_1.Color.white, hcLight: color_1.Color.white }, nls.localize('buttonForeground', "Button foreground color."));
    exports.buttonBackground = registerColor('button.background', { dark: '#0E639C', light: '#007ACC', hcDark: null, hcLight: '#0F4A85' }, nls.localize('buttonBackground', "Button background color."));
    exports.buttonHoverBackground = registerColor('button.hoverBackground', { dark: lighten(exports.buttonBackground, 0.2), light: darken(exports.buttonBackground, 0.2), hcDark: null, hcLight: null }, nls.localize('buttonHoverBackground', "Button background color when hovering."));
    exports.buttonBorder = registerColor('button.border', { dark: exports.contrastBorder, light: exports.contrastBorder, hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('buttonBorder', "Button border color."));
    exports.buttonSecondaryForeground = registerColor('button.secondaryForeground', { dark: color_1.Color.white, light: color_1.Color.white, hcDark: color_1.Color.white, hcLight: exports.foreground }, nls.localize('buttonSecondaryForeground', "Secondary button foreground color."));
    exports.buttonSecondaryBackground = registerColor('button.secondaryBackground', { dark: '#3A3D41', light: '#5F6A79', hcDark: null, hcLight: color_1.Color.white }, nls.localize('buttonSecondaryBackground', "Secondary button background color."));
    exports.buttonSecondaryHoverBackground = registerColor('button.secondaryHoverBackground', { dark: lighten(exports.buttonSecondaryBackground, 0.2), light: darken(exports.buttonSecondaryBackground, 0.2), hcDark: null, hcLight: null }, nls.localize('buttonSecondaryHoverBackground', "Secondary button background color when hovering."));
    exports.badgeBackground = registerColor('badge.background', { dark: '#4D4D4D', light: '#C4C4C4', hcDark: color_1.Color.black, hcLight: '#0F4A85' }, nls.localize('badgeBackground', "Badge background color. Badges are small information labels, e.g. for search results count."));
    exports.badgeForeground = registerColor('badge.foreground', { dark: color_1.Color.white, light: '#333', hcDark: color_1.Color.white, hcLight: color_1.Color.white }, nls.localize('badgeForeground', "Badge foreground color. Badges are small information labels, e.g. for search results count."));
    exports.scrollbarShadow = registerColor('scrollbar.shadow', { dark: '#000000', light: '#DDDDDD', hcDark: null, hcLight: null }, nls.localize('scrollbarShadow', "Scrollbar shadow to indicate that the view is scrolled."));
    exports.scrollbarSliderBackground = registerColor('scrollbarSlider.background', { dark: color_1.Color.fromHex('#797979').transparent(0.4), light: color_1.Color.fromHex('#646464').transparent(0.4), hcDark: transparent(exports.contrastBorder, 0.6), hcLight: transparent(exports.contrastBorder, 0.4) }, nls.localize('scrollbarSliderBackground', "Scrollbar slider background color."));
    exports.scrollbarSliderHoverBackground = registerColor('scrollbarSlider.hoverBackground', { dark: color_1.Color.fromHex('#646464').transparent(0.7), light: color_1.Color.fromHex('#646464').transparent(0.7), hcDark: transparent(exports.contrastBorder, 0.8), hcLight: transparent(exports.contrastBorder, 0.8) }, nls.localize('scrollbarSliderHoverBackground', "Scrollbar slider background color when hovering."));
    exports.scrollbarSliderActiveBackground = registerColor('scrollbarSlider.activeBackground', { dark: color_1.Color.fromHex('#BFBFBF').transparent(0.4), light: color_1.Color.fromHex('#000000').transparent(0.6), hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('scrollbarSliderActiveBackground', "Scrollbar slider background color when clicked on."));
    exports.progressBarBackground = registerColor('progressBar.background', { dark: color_1.Color.fromHex('#0E70C0'), light: color_1.Color.fromHex('#0E70C0'), hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('progressBarBackground', "Background color of the progress bar that can show for long running operations."));
    exports.editorErrorBackground = registerColor('editorError.background', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('editorError.background', 'Background color of error text in the editor. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.editorErrorForeground = registerColor('editorError.foreground', { dark: '#F14C4C', light: '#E51400', hcDark: '#F48771', hcLight: '#B5200D' }, nls.localize('editorError.foreground', 'Foreground color of error squigglies in the editor.'));
    exports.editorErrorBorder = registerColor('editorError.border', { dark: null, light: null, hcDark: color_1.Color.fromHex('#E47777').transparent(0.8), hcLight: '#B5200D' }, nls.localize('errorBorder', 'Border color of error boxes in the editor.'));
    exports.editorWarningBackground = registerColor('editorWarning.background', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('editorWarning.background', 'Background color of warning text in the editor. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.editorWarningForeground = registerColor('editorWarning.foreground', { dark: '#CCA700', light: '#BF8803', hcDark: '#FFD37', hcLight: '#895503' }, nls.localize('editorWarning.foreground', 'Foreground color of warning squigglies in the editor.'));
    exports.editorWarningBorder = registerColor('editorWarning.border', { dark: null, light: null, hcDark: color_1.Color.fromHex('#FFCC00').transparent(0.8), hcLight: '#' }, nls.localize('warningBorder', 'Border color of warning boxes in the editor.'));
    exports.editorInfoBackground = registerColor('editorInfo.background', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('editorInfo.background', 'Background color of info text in the editor. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.editorInfoForeground = registerColor('editorInfo.foreground', { dark: '#3794FF', light: '#1a85ff', hcDark: '#3794FF', hcLight: '#1a85ff' }, nls.localize('editorInfo.foreground', 'Foreground color of info squigglies in the editor.'));
    exports.editorInfoBorder = registerColor('editorInfo.border', { dark: null, light: null, hcDark: color_1.Color.fromHex('#3794FF').transparent(0.8), hcLight: '#292929' }, nls.localize('infoBorder', 'Border color of info boxes in the editor.'));
    exports.editorHintForeground = registerColor('editorHint.foreground', { dark: color_1.Color.fromHex('#eeeeee').transparent(0.7), light: '#6c6c6c', hcDark: null, hcLight: null }, nls.localize('editorHint.foreground', 'Foreground color of hint squigglies in the editor.'));
    exports.editorHintBorder = registerColor('editorHint.border', { dark: null, light: null, hcDark: color_1.Color.fromHex('#eeeeee').transparent(0.8), hcLight: '#292929' }, nls.localize('hintBorder', 'Border color of hint boxes in the editor.'));
    exports.sashHoverBorder = registerColor('sash.hoverBorder', { dark: exports.focusBorder, light: exports.focusBorder, hcDark: exports.focusBorder, hcLight: exports.focusBorder }, nls.localize('sashActiveBorder', "Border color of active sashes."));
    /**
     * Editor background color.
     * Because of bug https://monacotools.visualstudio.com/DefaultCollection/Monaco/_workitems/edit/13254
     * we are *not* using the color white (or #ffffff, rgba(255,255,255)) but something very close to white.
     */
    exports.editorBackground = registerColor('editor.background', { light: '#fffffe', dark: '#1E1E1E', hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('editorBackground', "Editor background color."));
    /**
     * Editor foreground color.
     */
    exports.editorForeground = registerColor('editor.foreground', { light: '#333333', dark: '#BBBBBB', hcDark: color_1.Color.white, hcLight: exports.foreground }, nls.localize('editorForeground', "Editor default foreground color."));
    /**
     * Editor widgets
     */
    exports.editorWidgetBackground = registerColor('editorWidget.background', { dark: '#252526', light: '#F3F3F3', hcDark: '#0C141F', hcLight: color_1.Color.white }, nls.localize('editorWidgetBackground', 'Background color of editor widgets, such as find/replace.'));
    exports.editorWidgetForeground = registerColor('editorWidget.foreground', { dark: exports.foreground, light: exports.foreground, hcDark: exports.foreground, hcLight: exports.foreground }, nls.localize('editorWidgetForeground', 'Foreground color of editor widgets, such as find/replace.'));
    exports.editorWidgetBorder = registerColor('editorWidget.border', { dark: '#454545', light: '#C8C8C8', hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('editorWidgetBorder', 'Border color of editor widgets. The color is only used if the widget chooses to have a border and if the color is not overridden by a widget.'));
    exports.editorWidgetResizeBorder = registerColor('editorWidget.resizeBorder', { light: null, dark: null, hcDark: null, hcLight: null }, nls.localize('editorWidgetResizeBorder', "Border color of the resize bar of editor widgets. The color is only used if the widget chooses to have a resize border and if the color is not overridden by a widget."));
    /**
     * Quick pick widget
     */
    exports.quickInputBackground = registerColor('quickInput.background', { dark: exports.editorWidgetBackground, light: exports.editorWidgetBackground, hcDark: exports.editorWidgetBackground, hcLight: exports.editorWidgetBackground }, nls.localize('pickerBackground', "Quick picker background color. The quick picker widget is the container for pickers like the command palette."));
    exports.quickInputForeground = registerColor('quickInput.foreground', { dark: exports.editorWidgetForeground, light: exports.editorWidgetForeground, hcDark: exports.editorWidgetForeground, hcLight: exports.editorWidgetForeground }, nls.localize('pickerForeground', "Quick picker foreground color. The quick picker widget is the container for pickers like the command palette."));
    exports.quickInputTitleBackground = registerColor('quickInputTitle.background', { dark: new color_1.Color(new color_1.RGBA(255, 255, 255, 0.105)), light: new color_1.Color(new color_1.RGBA(0, 0, 0, 0.06)), hcDark: '#000000', hcLight: color_1.Color.white }, nls.localize('pickerTitleBackground', "Quick picker title background color. The quick picker widget is the container for pickers like the command palette."));
    exports.pickerGroupForeground = registerColor('pickerGroup.foreground', { dark: '#3794FF', light: '#0066BF', hcDark: color_1.Color.white, hcLight: '#0F4A85' }, nls.localize('pickerGroupForeground', "Quick picker color for grouping labels."));
    exports.pickerGroupBorder = registerColor('pickerGroup.border', { dark: '#3F3F46', light: '#CCCEDB', hcDark: color_1.Color.white, hcLight: '#0F4A85' }, nls.localize('pickerGroupBorder', "Quick picker color for grouping borders."));
    /**
     * Keybinding label
     */
    exports.keybindingLabelBackground = registerColor('keybindingLabel.background', { dark: new color_1.Color(new color_1.RGBA(128, 128, 128, 0.17)), light: new color_1.Color(new color_1.RGBA(221, 221, 221, 0.4)), hcDark: color_1.Color.transparent, hcLight: color_1.Color.transparent }, nls.localize('keybindingLabelBackground', "Keybinding label background color. The keybinding label is used to represent a keyboard shortcut."));
    exports.keybindingLabelForeground = registerColor('keybindingLabel.foreground', { dark: color_1.Color.fromHex('#CCCCCC'), light: color_1.Color.fromHex('#555555'), hcDark: color_1.Color.white, hcLight: exports.foreground }, nls.localize('keybindingLabelForeground', "Keybinding label foreground color. The keybinding label is used to represent a keyboard shortcut."));
    exports.keybindingLabelBorder = registerColor('keybindingLabel.border', { dark: new color_1.Color(new color_1.RGBA(51, 51, 51, 0.6)), light: new color_1.Color(new color_1.RGBA(204, 204, 204, 0.4)), hcDark: new color_1.Color(new color_1.RGBA(111, 195, 223)), hcLight: exports.contrastBorder }, nls.localize('keybindingLabelBorder', "Keybinding label border color. The keybinding label is used to represent a keyboard shortcut."));
    exports.keybindingLabelBottomBorder = registerColor('keybindingLabel.bottomBorder', { dark: new color_1.Color(new color_1.RGBA(68, 68, 68, 0.6)), light: new color_1.Color(new color_1.RGBA(187, 187, 187, 0.4)), hcDark: new color_1.Color(new color_1.RGBA(111, 195, 223)), hcLight: exports.foreground }, nls.localize('keybindingLabelBottomBorder', "Keybinding label border bottom color. The keybinding label is used to represent a keyboard shortcut."));
    /**
     * Editor selection colors.
     */
    exports.editorSelectionBackground = registerColor('editor.selectionBackground', { light: '#ADD6FF', dark: '#264F78', hcDark: '#f3f518', hcLight: '#0F4A85' }, nls.localize('editorSelectionBackground', "Color of the editor selection."));
    exports.editorSelectionForeground = registerColor('editor.selectionForeground', { light: null, dark: null, hcDark: '#000000', hcLight: color_1.Color.white }, nls.localize('editorSelectionForeground', "Color of the selected text for high contrast."));
    exports.editorInactiveSelection = registerColor('editor.inactiveSelectionBackground', { light: transparent(exports.editorSelectionBackground, 0.5), dark: transparent(exports.editorSelectionBackground, 0.5), hcDark: transparent(exports.editorSelectionBackground, 0.7), hcLight: transparent(exports.editorSelectionBackground, 0.5) }, nls.localize('editorInactiveSelection', "Color of the selection in an inactive editor. The color must not be opaque so as not to hide underlying decorations."), true);
    exports.editorSelectionHighlight = registerColor('editor.selectionHighlightBackground', { light: lessProminent(exports.editorSelectionBackground, exports.editorBackground, 0.3, 0.6), dark: lessProminent(exports.editorSelectionBackground, exports.editorBackground, 0.3, 0.6), hcDark: null, hcLight: null }, nls.localize('editorSelectionHighlight', 'Color for regions with the same content as the selection. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.editorSelectionHighlightBorder = registerColor('editor.selectionHighlightBorder', { light: null, dark: null, hcDark: exports.activeContrastBorder, hcLight: exports.activeContrastBorder }, nls.localize('editorSelectionHighlightBorder', "Border color for regions with the same content as the selection."));
    /**
     * Editor find match colors.
     */
    exports.editorFindMatch = registerColor('editor.findMatchBackground', { light: '#A8AC94', dark: '#515C6A', hcDark: null, hcLight: null }, nls.localize('editorFindMatch', "Color of the current search match."));
    exports.editorFindMatchHighlight = registerColor('editor.findMatchHighlightBackground', { light: '#EA5C0055', dark: '#EA5C0055', hcDark: null, hcLight: null }, nls.localize('findMatchHighlight', "Color of the other search matches. The color must not be opaque so as not to hide underlying decorations."), true);
    exports.editorFindRangeHighlight = registerColor('editor.findRangeHighlightBackground', { dark: '#3a3d4166', light: '#b4b4b44d', hcDark: null, hcLight: null }, nls.localize('findRangeHighlight', "Color of the range limiting the search. The color must not be opaque so as not to hide underlying decorations."), true);
    exports.editorFindMatchBorder = registerColor('editor.findMatchBorder', { light: null, dark: null, hcDark: exports.activeContrastBorder, hcLight: exports.activeContrastBorder }, nls.localize('editorFindMatchBorder', "Border color of the current search match."));
    exports.editorFindMatchHighlightBorder = registerColor('editor.findMatchHighlightBorder', { light: null, dark: null, hcDark: exports.activeContrastBorder, hcLight: exports.activeContrastBorder }, nls.localize('findMatchHighlightBorder', "Border color of the other search matches."));
    exports.editorFindRangeHighlightBorder = registerColor('editor.findRangeHighlightBorder', { dark: null, light: null, hcDark: transparent(exports.activeContrastBorder, 0.4), hcLight: transparent(exports.activeContrastBorder, 0.4) }, nls.localize('findRangeHighlightBorder', "Border color of the range limiting the search. The color must not be opaque so as not to hide underlying decorations."), true);
    /**
     * Search Editor query match colors.
     *
     * Distinct from normal editor find match to allow for better differentiation
     */
    exports.searchEditorFindMatch = registerColor('searchEditor.findMatchBackground', { light: transparent(exports.editorFindMatchHighlight, 0.66), dark: transparent(exports.editorFindMatchHighlight, 0.66), hcDark: exports.editorFindMatchHighlight, hcLight: exports.editorFindMatchHighlight }, nls.localize('searchEditor.queryMatch', "Color of the Search Editor query matches."));
    exports.searchEditorFindMatchBorder = registerColor('searchEditor.findMatchBorder', { light: transparent(exports.editorFindMatchHighlightBorder, 0.66), dark: transparent(exports.editorFindMatchHighlightBorder, 0.66), hcDark: exports.editorFindMatchHighlightBorder, hcLight: exports.editorFindMatchHighlightBorder }, nls.localize('searchEditor.editorFindMatchBorder', "Border color of the Search Editor query matches."));
    /**
     * Editor hover
     */
    exports.editorHoverHighlight = registerColor('editor.hoverHighlightBackground', { light: '#ADD6FF26', dark: '#264f7840', hcDark: '#ADD6FF26', hcLight: null }, nls.localize('hoverHighlight', 'Highlight below the word for which a hover is shown. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.editorHoverBackground = registerColor('editorHoverWidget.background', { light: exports.editorWidgetBackground, dark: exports.editorWidgetBackground, hcDark: exports.editorWidgetBackground, hcLight: exports.editorWidgetBackground }, nls.localize('hoverBackground', 'Background color of the editor hover.'));
    exports.editorHoverForeground = registerColor('editorHoverWidget.foreground', { light: exports.editorWidgetForeground, dark: exports.editorWidgetForeground, hcDark: exports.editorWidgetForeground, hcLight: exports.editorWidgetForeground }, nls.localize('hoverForeground', 'Foreground color of the editor hover.'));
    exports.editorHoverBorder = registerColor('editorHoverWidget.border', { light: exports.editorWidgetBorder, dark: exports.editorWidgetBorder, hcDark: exports.editorWidgetBorder, hcLight: exports.editorWidgetBorder }, nls.localize('hoverBorder', 'Border color of the editor hover.'));
    exports.editorHoverStatusBarBackground = registerColor('editorHoverWidget.statusBarBackground', { dark: lighten(exports.editorHoverBackground, 0.2), light: darken(exports.editorHoverBackground, 0.05), hcDark: exports.editorWidgetBackground, hcLight: exports.editorWidgetBackground }, nls.localize('statusBarBackground', "Background color of the editor hover status bar."));
    /**
     * Editor link colors
     */
    exports.editorActiveLinkForeground = registerColor('editorLink.activeForeground', { dark: '#4E94CE', light: color_1.Color.blue, hcDark: color_1.Color.cyan, hcLight: '#292929' }, nls.localize('activeLinkForeground', 'Color of active links.'));
    /**
     * Inline hints
     */
    exports.editorInlayHintForeground = registerColor('editorInlayHint.foreground', { dark: transparent(exports.badgeForeground, .8), light: transparent(exports.badgeForeground, .8), hcDark: exports.badgeForeground, hcLight: exports.badgeForeground }, nls.localize('editorInlayHintForeground', 'Foreground color of inline hints'));
    exports.editorInlayHintBackground = registerColor('editorInlayHint.background', { dark: transparent(exports.badgeBackground, .6), light: transparent(exports.badgeBackground, .3), hcDark: exports.badgeBackground, hcLight: exports.badgeBackground }, nls.localize('editorInlayHintBackground', 'Background color of inline hints'));
    exports.editorInlayHintTypeForeground = registerColor('editorInlayHint.typeForeground', { dark: exports.editorInlayHintForeground, light: exports.editorInlayHintForeground, hcDark: exports.editorInlayHintForeground, hcLight: exports.editorInlayHintForeground }, nls.localize('editorInlayHintForegroundTypes', 'Foreground color of inline hints for types'));
    exports.editorInlayHintTypeBackground = registerColor('editorInlayHint.typeBackground', { dark: exports.editorInlayHintBackground, light: exports.editorInlayHintBackground, hcDark: exports.editorInlayHintBackground, hcLight: exports.editorInlayHintBackground }, nls.localize('editorInlayHintBackgroundTypes', 'Background color of inline hints for types'));
    exports.editorInlayHintParameterForeground = registerColor('editorInlayHint.parameterForeground', { dark: exports.editorInlayHintForeground, light: exports.editorInlayHintForeground, hcDark: exports.editorInlayHintForeground, hcLight: exports.editorInlayHintForeground }, nls.localize('editorInlayHintForegroundParameter', 'Foreground color of inline hints for parameters'));
    exports.editorInlayHintParameterBackground = registerColor('editorInlayHint.parameterBackground', { dark: exports.editorInlayHintBackground, light: exports.editorInlayHintBackground, hcDark: exports.editorInlayHintBackground, hcLight: exports.editorInlayHintBackground }, nls.localize('editorInlayHintBackgroundParameter', 'Background color of inline hints for parameters'));
    /**
     * Editor lighbulb icon colors
     */
    exports.editorLightBulbForeground = registerColor('editorLightBulb.foreground', { dark: '#FFCC00', light: '#DDB100', hcDark: '#FFCC00', hcLight: '#007ACC' }, nls.localize('editorLightBulbForeground', "The color used for the lightbulb actions icon."));
    exports.editorLightBulbAutoFixForeground = registerColor('editorLightBulbAutoFix.foreground', { dark: '#75BEFF', light: '#007ACC', hcDark: '#75BEFF', hcLight: '#007ACC' }, nls.localize('editorLightBulbAutoFixForeground', "The color used for the lightbulb auto fix actions icon."));
    /**
     * Diff Editor Colors
     */
    exports.defaultInsertColor = new color_1.Color(new color_1.RGBA(155, 185, 85, 0.2));
    exports.defaultRemoveColor = new color_1.Color(new color_1.RGBA(255, 0, 0, 0.2));
    exports.diffInserted = registerColor('diffEditor.insertedTextBackground', { dark: exports.defaultInsertColor, light: exports.defaultInsertColor, hcDark: null, hcLight: null }, nls.localize('diffEditorInserted', 'Background color for text that got inserted. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.diffRemoved = registerColor('diffEditor.removedTextBackground', { dark: exports.defaultRemoveColor, light: exports.defaultRemoveColor, hcDark: null, hcLight: null }, nls.localize('diffEditorRemoved', 'Background color for text that got removed. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.diffInsertedLine = registerColor('diffEditor.insertedLineBackground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('diffEditorInsertedLines', 'Background color for lines that got inserted. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.diffRemovedLine = registerColor('diffEditor.removedLineBackground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('diffEditorRemovedLines', 'Background color for lines that got removed. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.diffInsertedLineGutter = registerColor('diffEditorGutter.insertedLineBackground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('diffEditorInsertedLineGutter', 'Background color for the margin where lines got inserted.'));
    exports.diffRemovedLineGutter = registerColor('diffEditorGutter.removedLineBackground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('diffEditorRemovedLineGutter', 'Background color for the margin where lines got removed.'));
    exports.diffOverviewRulerInserted = registerColor('diffEditorOverview.insertedForeground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('diffEditorOverviewInserted', 'Diff overview ruler foreground for inserted content.'));
    exports.diffOverviewRulerRemoved = registerColor('diffEditorOverview.removedForeground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('diffEditorOverviewRemoved', 'Diff overview ruler foreground for removed content.'));
    exports.diffInsertedOutline = registerColor('diffEditor.insertedTextBorder', { dark: null, light: null, hcDark: '#33ff2eff', hcLight: '#374E06' }, nls.localize('diffEditorInsertedOutline', 'Outline color for the text that got inserted.'));
    exports.diffRemovedOutline = registerColor('diffEditor.removedTextBorder', { dark: null, light: null, hcDark: '#FF008F', hcLight: '#AD0707' }, nls.localize('diffEditorRemovedOutline', 'Outline color for text that got removed.'));
    exports.diffBorder = registerColor('diffEditor.border', { dark: null, light: null, hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('diffEditorBorder', 'Border color between the two text editors.'));
    exports.diffDiagonalFill = registerColor('diffEditor.diagonalFill', { dark: '#cccccc33', light: '#22222233', hcDark: null, hcLight: null }, nls.localize('diffDiagonalFill', "Color of the diff editor's diagonal fill. The diagonal fill is used in side-by-side diff views."));
    /**
     * List and tree colors
     */
    exports.listFocusBackground = registerColor('list.focusBackground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('listFocusBackground', "List/Tree background color for the focused item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not."));
    exports.listFocusForeground = registerColor('list.focusForeground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('listFocusForeground', "List/Tree foreground color for the focused item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not."));
    exports.listFocusOutline = registerColor('list.focusOutline', { dark: exports.focusBorder, light: exports.focusBorder, hcDark: exports.activeContrastBorder, hcLight: exports.activeContrastBorder }, nls.localize('listFocusOutline', "List/Tree outline color for the focused item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not."));
    exports.listActiveSelectionBackground = registerColor('list.activeSelectionBackground', { dark: '#094771', light: '#0060C0', hcDark: null, hcLight: color_1.Color.fromHex('#0F4A85').transparent(0.1) }, nls.localize('listActiveSelectionBackground', "List/Tree background color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not."));
    exports.listActiveSelectionForeground = registerColor('list.activeSelectionForeground', { dark: color_1.Color.white, light: color_1.Color.white, hcDark: null, hcLight: null }, nls.localize('listActiveSelectionForeground', "List/Tree foreground color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not."));
    exports.listActiveSelectionIconForeground = registerColor('list.activeSelectionIconForeground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('listActiveSelectionIconForeground', "List/Tree icon foreground color for the selected item when the list/tree is active. An active list/tree has keyboard focus, an inactive does not."));
    exports.listInactiveSelectionBackground = registerColor('list.inactiveSelectionBackground', { dark: '#37373D', light: '#E4E6F1', hcDark: null, hcLight: color_1.Color.fromHex('#0F4A85').transparent(0.1) }, nls.localize('listInactiveSelectionBackground', "List/Tree background color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not."));
    exports.listInactiveSelectionForeground = registerColor('list.inactiveSelectionForeground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('listInactiveSelectionForeground', "List/Tree foreground color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not."));
    exports.listInactiveSelectionIconForeground = registerColor('list.inactiveSelectionIconForeground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('listInactiveSelectionIconForeground', "List/Tree icon foreground color for the selected item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not."));
    exports.listInactiveFocusBackground = registerColor('list.inactiveFocusBackground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('listInactiveFocusBackground', "List/Tree background color for the focused item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not."));
    exports.listInactiveFocusOutline = registerColor('list.inactiveFocusOutline', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('listInactiveFocusOutline', "List/Tree outline color for the focused item when the list/tree is inactive. An active list/tree has keyboard focus, an inactive does not."));
    exports.listHoverBackground = registerColor('list.hoverBackground', { dark: '#2A2D2E', light: '#F0F0F0', hcDark: null, hcLight: color_1.Color.fromHex('#0F4A85').transparent(0.1) }, nls.localize('listHoverBackground', "List/Tree background when hovering over items using the mouse."));
    exports.listHoverForeground = registerColor('list.hoverForeground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('listHoverForeground', "List/Tree foreground when hovering over items using the mouse."));
    exports.listDropBackground = registerColor('list.dropBackground', { dark: '#062F4A', light: '#D6EBFF', hcDark: null, hcLight: null }, nls.localize('listDropBackground', "List/Tree drag and drop background when moving items around using the mouse."));
    exports.listHighlightForeground = registerColor('list.highlightForeground', { dark: '#18A3FF', light: '#0066BF', hcDark: exports.focusBorder, hcLight: exports.focusBorder }, nls.localize('highlight', 'List/Tree foreground color of the match highlights when searching inside the list/tree.'));
    exports.listFocusHighlightForeground = registerColor('list.focusHighlightForeground', { dark: exports.listHighlightForeground, light: ifDefinedThenElse(exports.listActiveSelectionBackground, exports.listHighlightForeground, '#9DDDFF'), hcDark: exports.listHighlightForeground, hcLight: exports.listHighlightForeground }, nls.localize('listFocusHighlightForeground', 'List/Tree foreground color of the match highlights on actively focused items when searching inside the list/tree.'));
    exports.listInvalidItemForeground = registerColor('list.invalidItemForeground', { dark: '#B89500', light: '#B89500', hcDark: '#B89500', hcLight: '#B5200D' }, nls.localize('invalidItemForeground', 'List/Tree foreground color for invalid items, for example an unresolved root in explorer.'));
    exports.listErrorForeground = registerColor('list.errorForeground', { dark: '#F88070', light: '#B01011', hcDark: null, hcLight: null }, nls.localize('listErrorForeground', 'Foreground color of list items containing errors.'));
    exports.listWarningForeground = registerColor('list.warningForeground', { dark: '#CCA700', light: '#855F00', hcDark: null, hcLight: null }, nls.localize('listWarningForeground', 'Foreground color of list items containing warnings.'));
    exports.listFilterWidgetBackground = registerColor('listFilterWidget.background', { light: '#efc1ad', dark: '#653723', hcDark: color_1.Color.black, hcLight: color_1.Color.white }, nls.localize('listFilterWidgetBackground', 'Background color of the type filter widget in lists and trees.'));
    exports.listFilterWidgetOutline = registerColor('listFilterWidget.outline', { dark: color_1.Color.transparent, light: color_1.Color.transparent, hcDark: '#f38518', hcLight: '#007ACC' }, nls.localize('listFilterWidgetOutline', 'Outline color of the type filter widget in lists and trees.'));
    exports.listFilterWidgetNoMatchesOutline = registerColor('listFilterWidget.noMatchesOutline', { dark: '#BE1100', light: '#BE1100', hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('listFilterWidgetNoMatchesOutline', 'Outline color of the type filter widget in lists and trees, when there are no matches.'));
    exports.listFilterMatchHighlight = registerColor('list.filterMatchBackground', { dark: exports.editorFindMatchHighlight, light: exports.editorFindMatchHighlight, hcDark: null, hcLight: null }, nls.localize('listFilterMatchHighlight', 'Background color of the filtered match.'));
    exports.listFilterMatchHighlightBorder = registerColor('list.filterMatchBorder', { dark: exports.editorFindMatchHighlightBorder, light: exports.editorFindMatchHighlightBorder, hcDark: exports.contrastBorder, hcLight: exports.activeContrastBorder }, nls.localize('listFilterMatchHighlightBorder', 'Border color of the filtered match.'));
    exports.treeIndentGuidesStroke = registerColor('tree.indentGuidesStroke', { dark: '#585858', light: '#a9a9a9', hcDark: '#a9a9a9', hcLight: '#a5a5a5' }, nls.localize('treeIndentGuidesStroke', "Tree stroke color for the indentation guides."));
    exports.tableColumnsBorder = registerColor('tree.tableColumnsBorder', { dark: '#CCCCCC20', light: '#61616120', hcDark: null, hcLight: null }, nls.localize('tableColumnsBorder', "Table border color between columns."));
    exports.tableOddRowsBackgroundColor = registerColor('tree.tableOddRowsBackground', { dark: transparent(exports.foreground, 0.04), light: transparent(exports.foreground, 0.04), hcDark: null, hcLight: null }, nls.localize('tableOddRowsBackgroundColor', "Background color for odd table rows."));
    exports.listDeemphasizedForeground = registerColor('list.deemphasizedForeground', { dark: '#8C8C8C', light: '#8E8E90', hcDark: '#A7A8A9', hcLight: '#666666' }, nls.localize('listDeemphasizedForeground', "List/Tree foreground color for items that are deemphasized. "));
    /**
     * Quick pick widget (dependent on List and tree colors)
     */
    exports._deprecatedQuickInputListFocusBackground = registerColor('quickInput.list.focusBackground', { dark: null, light: null, hcDark: null, hcLight: null }, '', undefined, nls.localize('quickInput.list.focusBackground deprecation', "Please use quickInputList.focusBackground instead"));
    exports.quickInputListFocusForeground = registerColor('quickInputList.focusForeground', { dark: exports.listActiveSelectionForeground, light: exports.listActiveSelectionForeground, hcDark: exports.listActiveSelectionForeground, hcLight: exports.listActiveSelectionForeground }, nls.localize('quickInput.listFocusForeground', "Quick picker foreground color for the focused item."));
    exports.quickInputListFocusIconForeground = registerColor('quickInputList.focusIconForeground', { dark: exports.listActiveSelectionIconForeground, light: exports.listActiveSelectionIconForeground, hcDark: exports.listActiveSelectionIconForeground, hcLight: exports.listActiveSelectionIconForeground }, nls.localize('quickInput.listFocusIconForeground', "Quick picker icon foreground color for the focused item."));
    exports.quickInputListFocusBackground = registerColor('quickInputList.focusBackground', { dark: oneOf(exports._deprecatedQuickInputListFocusBackground, exports.listActiveSelectionBackground), light: oneOf(exports._deprecatedQuickInputListFocusBackground, exports.listActiveSelectionBackground), hcDark: null, hcLight: null }, nls.localize('quickInput.listFocusBackground', "Quick picker background color for the focused item."));
    /**
     * Menu colors
     */
    exports.menuBorder = registerColor('menu.border', { dark: null, light: null, hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('menuBorder', "Border color of menus."));
    exports.menuForeground = registerColor('menu.foreground', { dark: exports.selectForeground, light: exports.foreground, hcDark: exports.selectForeground, hcLight: exports.selectForeground }, nls.localize('menuForeground', "Foreground color of menu items."));
    exports.menuBackground = registerColor('menu.background', { dark: exports.selectBackground, light: exports.selectBackground, hcDark: exports.selectBackground, hcLight: exports.selectBackground }, nls.localize('menuBackground', "Background color of menu items."));
    exports.menuSelectionForeground = registerColor('menu.selectionForeground', { dark: exports.listActiveSelectionForeground, light: exports.listActiveSelectionForeground, hcDark: exports.listActiveSelectionForeground, hcLight: exports.listActiveSelectionForeground }, nls.localize('menuSelectionForeground', "Foreground color of the selected menu item in menus."));
    exports.menuSelectionBackground = registerColor('menu.selectionBackground', { dark: exports.listActiveSelectionBackground, light: exports.listActiveSelectionBackground, hcDark: exports.listActiveSelectionBackground, hcLight: exports.listActiveSelectionBackground }, nls.localize('menuSelectionBackground', "Background color of the selected menu item in menus."));
    exports.menuSelectionBorder = registerColor('menu.selectionBorder', { dark: null, light: null, hcDark: exports.activeContrastBorder, hcLight: exports.activeContrastBorder }, nls.localize('menuSelectionBorder', "Border color of the selected menu item in menus."));
    exports.menuSeparatorBackground = registerColor('menu.separatorBackground', { dark: '#BBBBBB', light: '#888888', hcDark: exports.contrastBorder, hcLight: exports.contrastBorder }, nls.localize('menuSeparatorBackground', "Color of a separator menu item in menus."));
    /**
     * Toolbar colors
     */
    exports.toolbarHoverBackground = registerColor('toolbar.hoverBackground', { dark: '#5a5d5e50', light: '#b8b8b850', hcDark: null, hcLight: null }, nls.localize('toolbarHoverBackground', "Toolbar background when hovering over actions using the mouse"));
    exports.toolbarHoverOutline = registerColor('toolbar.hoverOutline', { dark: null, light: null, hcDark: exports.activeContrastBorder, hcLight: exports.activeContrastBorder }, nls.localize('toolbarHoverOutline', "Toolbar outline when hovering over actions using the mouse"));
    exports.toolbarActiveBackground = registerColor('toolbar.activeBackground', { dark: lighten(exports.toolbarHoverBackground, 0.1), light: darken(exports.toolbarHoverBackground, 0.1), hcDark: null, hcLight: null }, nls.localize('toolbarActiveBackground', "Toolbar background when holding the mouse over actions"));
    /**
     * Snippet placeholder colors
     */
    exports.snippetTabstopHighlightBackground = registerColor('editor.snippetTabstopHighlightBackground', { dark: new color_1.Color(new color_1.RGBA(124, 124, 124, 0.3)), light: new color_1.Color(new color_1.RGBA(10, 50, 100, 0.2)), hcDark: new color_1.Color(new color_1.RGBA(124, 124, 124, 0.3)), hcLight: new color_1.Color(new color_1.RGBA(10, 50, 100, 0.2)) }, nls.localize('snippetTabstopHighlightBackground', "Highlight background color of a snippet tabstop."));
    exports.snippetTabstopHighlightBorder = registerColor('editor.snippetTabstopHighlightBorder', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('snippetTabstopHighlightBorder', "Highlight border color of a snippet tabstop."));
    exports.snippetFinalTabstopHighlightBackground = registerColor('editor.snippetFinalTabstopHighlightBackground', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('snippetFinalTabstopHighlightBackground', "Highlight background color of the final tabstop of a snippet."));
    exports.snippetFinalTabstopHighlightBorder = registerColor('editor.snippetFinalTabstopHighlightBorder', { dark: '#525252', light: new color_1.Color(new color_1.RGBA(10, 50, 100, 0.5)), hcDark: '#525252', hcLight: '#292929' }, nls.localize('snippetFinalTabstopHighlightBorder', "Highlight border color of the final tabstop of a snippet."));
    /**
     * Breadcrumb colors
     */
    exports.breadcrumbsForeground = registerColor('breadcrumb.foreground', { light: transparent(exports.foreground, 0.8), dark: transparent(exports.foreground, 0.8), hcDark: transparent(exports.foreground, 0.8), hcLight: transparent(exports.foreground, 0.8) }, nls.localize('breadcrumbsFocusForeground', "Color of focused breadcrumb items."));
    exports.breadcrumbsBackground = registerColor('breadcrumb.background', { light: exports.editorBackground, dark: exports.editorBackground, hcDark: exports.editorBackground, hcLight: exports.editorBackground }, nls.localize('breadcrumbsBackground', "Background color of breadcrumb items."));
    exports.breadcrumbsFocusForeground = registerColor('breadcrumb.focusForeground', { light: darken(exports.foreground, 0.2), dark: lighten(exports.foreground, 0.1), hcDark: lighten(exports.foreground, 0.1), hcLight: lighten(exports.foreground, 0.1) }, nls.localize('breadcrumbsFocusForeground', "Color of focused breadcrumb items."));
    exports.breadcrumbsActiveSelectionForeground = registerColor('breadcrumb.activeSelectionForeground', { light: darken(exports.foreground, 0.2), dark: lighten(exports.foreground, 0.1), hcDark: lighten(exports.foreground, 0.1), hcLight: lighten(exports.foreground, 0.1) }, nls.localize('breadcrumbsSelectedForeground', "Color of selected breadcrumb items."));
    exports.breadcrumbsPickerBackground = registerColor('breadcrumbPicker.background', { light: exports.editorWidgetBackground, dark: exports.editorWidgetBackground, hcDark: exports.editorWidgetBackground, hcLight: exports.editorWidgetBackground }, nls.localize('breadcrumbsSelectedBackground', "Background color of breadcrumb item picker."));
    /**
     * Merge-conflict colors
     */
    const headerTransparency = 0.5;
    const currentBaseColor = color_1.Color.fromHex('#40C8AE').transparent(headerTransparency);
    const incomingBaseColor = color_1.Color.fromHex('#40A6FF').transparent(headerTransparency);
    const commonBaseColor = color_1.Color.fromHex('#606060').transparent(0.4);
    const contentTransparency = 0.4;
    const rulerTransparency = 1;
    exports.mergeCurrentHeaderBackground = registerColor('merge.currentHeaderBackground', { dark: currentBaseColor, light: currentBaseColor, hcDark: null, hcLight: null }, nls.localize('mergeCurrentHeaderBackground', 'Current header background in inline merge-conflicts. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.mergeCurrentContentBackground = registerColor('merge.currentContentBackground', { dark: transparent(exports.mergeCurrentHeaderBackground, contentTransparency), light: transparent(exports.mergeCurrentHeaderBackground, contentTransparency), hcDark: transparent(exports.mergeCurrentHeaderBackground, contentTransparency), hcLight: transparent(exports.mergeCurrentHeaderBackground, contentTransparency) }, nls.localize('mergeCurrentContentBackground', 'Current content background in inline merge-conflicts. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.mergeIncomingHeaderBackground = registerColor('merge.incomingHeaderBackground', { dark: incomingBaseColor, light: incomingBaseColor, hcDark: null, hcLight: null }, nls.localize('mergeIncomingHeaderBackground', 'Incoming header background in inline merge-conflicts. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.mergeIncomingContentBackground = registerColor('merge.incomingContentBackground', { dark: transparent(exports.mergeIncomingHeaderBackground, contentTransparency), light: transparent(exports.mergeIncomingHeaderBackground, contentTransparency), hcDark: transparent(exports.mergeIncomingHeaderBackground, contentTransparency), hcLight: transparent(exports.mergeIncomingHeaderBackground, contentTransparency) }, nls.localize('mergeIncomingContentBackground', 'Incoming content background in inline merge-conflicts. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.mergeCommonHeaderBackground = registerColor('merge.commonHeaderBackground', { dark: commonBaseColor, light: commonBaseColor, hcDark: null, hcLight: null }, nls.localize('mergeCommonHeaderBackground', 'Common ancestor header background in inline merge-conflicts. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.mergeCommonContentBackground = registerColor('merge.commonContentBackground', { dark: transparent(exports.mergeCommonHeaderBackground, contentTransparency), light: transparent(exports.mergeCommonHeaderBackground, contentTransparency), hcDark: transparent(exports.mergeCommonHeaderBackground, contentTransparency), hcLight: transparent(exports.mergeCommonHeaderBackground, contentTransparency) }, nls.localize('mergeCommonContentBackground', 'Common ancestor content background in inline merge-conflicts. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.mergeBorder = registerColor('merge.border', { dark: null, light: null, hcDark: '#C3DF6F', hcLight: '#007ACC' }, nls.localize('mergeBorder', 'Border color on headers and the splitter in inline merge-conflicts.'));
    exports.overviewRulerCurrentContentForeground = registerColor('editorOverviewRuler.currentContentForeground', { dark: transparent(exports.mergeCurrentHeaderBackground, rulerTransparency), light: transparent(exports.mergeCurrentHeaderBackground, rulerTransparency), hcDark: exports.mergeBorder, hcLight: exports.mergeBorder }, nls.localize('overviewRulerCurrentContentForeground', 'Current overview ruler foreground for inline merge-conflicts.'));
    exports.overviewRulerIncomingContentForeground = registerColor('editorOverviewRuler.incomingContentForeground', { dark: transparent(exports.mergeIncomingHeaderBackground, rulerTransparency), light: transparent(exports.mergeIncomingHeaderBackground, rulerTransparency), hcDark: exports.mergeBorder, hcLight: exports.mergeBorder }, nls.localize('overviewRulerIncomingContentForeground', 'Incoming overview ruler foreground for inline merge-conflicts.'));
    exports.overviewRulerCommonContentForeground = registerColor('editorOverviewRuler.commonContentForeground', { dark: transparent(exports.mergeCommonHeaderBackground, rulerTransparency), light: transparent(exports.mergeCommonHeaderBackground, rulerTransparency), hcDark: exports.mergeBorder, hcLight: exports.mergeBorder }, nls.localize('overviewRulerCommonContentForeground', 'Common ancestor overview ruler foreground for inline merge-conflicts.'));
    exports.overviewRulerFindMatchForeground = registerColor('editorOverviewRuler.findMatchForeground', { dark: '#d186167e', light: '#d186167e', hcDark: '#AB5A00', hcLight: '' }, nls.localize('overviewRulerFindMatchForeground', 'Overview ruler marker color for find matches. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.overviewRulerSelectionHighlightForeground = registerColor('editorOverviewRuler.selectionHighlightForeground', { dark: '#A0A0A0CC', light: '#A0A0A0CC', hcDark: '#A0A0A0CC', hcLight: '#A0A0A0CC' }, nls.localize('overviewRulerSelectionHighlightForeground', 'Overview ruler marker color for selection highlights. The color must not be opaque so as not to hide underlying decorations.'), true);
    exports.minimapFindMatch = registerColor('minimap.findMatchHighlight', { light: '#d18616', dark: '#d18616', hcDark: '#AB5A00', hcLight: '#0F4A85' }, nls.localize('minimapFindMatchHighlight', 'Minimap marker color for find matches.'), true);
    exports.minimapSelectionOccurrenceHighlight = registerColor('minimap.selectionOccurrenceHighlight', { light: '#c9c9c9', dark: '#676767', hcDark: '#ffffff', hcLight: '#0F4A85' }, nls.localize('minimapSelectionOccurrenceHighlight', 'Minimap marker color for repeating editor selections.'), true);
    exports.minimapSelection = registerColor('minimap.selectionHighlight', { light: '#ADD6FF', dark: '#264F78', hcDark: '#ffffff', hcLight: '#0F4A85' }, nls.localize('minimapSelectionHighlight', 'Minimap marker color for the editor selection.'), true);
    exports.minimapError = registerColor('minimap.errorHighlight', { dark: new color_1.Color(new color_1.RGBA(255, 18, 18, 0.7)), light: new color_1.Color(new color_1.RGBA(255, 18, 18, 0.7)), hcDark: new color_1.Color(new color_1.RGBA(255, 50, 50, 1)), hcLight: '#B5200D' }, nls.localize('minimapError', 'Minimap marker color for errors.'));
    exports.minimapWarning = registerColor('minimap.warningHighlight', { dark: exports.editorWarningForeground, light: exports.editorWarningForeground, hcDark: exports.editorWarningBorder, hcLight: exports.editorWarningBorder }, nls.localize('overviewRuleWarning', 'Minimap marker color for warnings.'));
    exports.minimapBackground = registerColor('minimap.background', { dark: null, light: null, hcDark: null, hcLight: null }, nls.localize('minimapBackground', "Minimap background color."));
    exports.minimapForegroundOpacity = registerColor('minimap.foregroundOpacity', { dark: color_1.Color.fromHex('#000f'), light: color_1.Color.fromHex('#000f'), hcDark: color_1.Color.fromHex('#000f'), hcLight: color_1.Color.fromHex('#000f') }, nls.localize('minimapForegroundOpacity', 'Opacity of foreground elements rendered in the minimap. For example, "#000000c0" will render the elements with 75% opacity.'));
    exports.minimapSliderBackground = registerColor('minimapSlider.background', { light: transparent(exports.scrollbarSliderBackground, 0.5), dark: transparent(exports.scrollbarSliderBackground, 0.5), hcDark: transparent(exports.scrollbarSliderBackground, 0.5), hcLight: transparent(exports.scrollbarSliderBackground, 0.5) }, nls.localize('minimapSliderBackground', "Minimap slider background color."));
    exports.minimapSliderHoverBackground = registerColor('minimapSlider.hoverBackground', { light: transparent(exports.scrollbarSliderHoverBackground, 0.5), dark: transparent(exports.scrollbarSliderHoverBackground, 0.5), hcDark: transparent(exports.scrollbarSliderHoverBackground, 0.5), hcLight: transparent(exports.scrollbarSliderHoverBackground, 0.5) }, nls.localize('minimapSliderHoverBackground', "Minimap slider background color when hovering."));
    exports.minimapSliderActiveBackground = registerColor('minimapSlider.activeBackground', { light: transparent(exports.scrollbarSliderActiveBackground, 0.5), dark: transparent(exports.scrollbarSliderActiveBackground, 0.5), hcDark: transparent(exports.scrollbarSliderActiveBackground, 0.5), hcLight: transparent(exports.scrollbarSliderActiveBackground, 0.5) }, nls.localize('minimapSliderActiveBackground', "Minimap slider background color when clicked on."));
    exports.problemsErrorIconForeground = registerColor('problemsErrorIcon.foreground', { dark: exports.editorErrorForeground, light: exports.editorErrorForeground, hcDark: exports.editorErrorForeground, hcLight: exports.editorErrorForeground }, nls.localize('problemsErrorIconForeground', "The color used for the problems error icon."));
    exports.problemsWarningIconForeground = registerColor('problemsWarningIcon.foreground', { dark: exports.editorWarningForeground, light: exports.editorWarningForeground, hcDark: exports.editorWarningForeground, hcLight: exports.editorWarningForeground }, nls.localize('problemsWarningIconForeground', "The color used for the problems warning icon."));
    exports.problemsInfoIconForeground = registerColor('problemsInfoIcon.foreground', { dark: exports.editorInfoForeground, light: exports.editorInfoForeground, hcDark: exports.editorInfoForeground, hcLight: exports.editorInfoForeground }, nls.localize('problemsInfoIconForeground', "The color used for the problems info icon."));
    /**
     * Chart colors
     */
    exports.chartsForeground = registerColor('charts.foreground', { dark: exports.foreground, light: exports.foreground, hcDark: exports.foreground, hcLight: exports.foreground }, nls.localize('chartsForeground', "The foreground color used in charts."));
    exports.chartsLines = registerColor('charts.lines', { dark: transparent(exports.foreground, .5), light: transparent(exports.foreground, .5), hcDark: transparent(exports.foreground, .5), hcLight: transparent(exports.foreground, .5) }, nls.localize('chartsLines', "The color used for horizontal lines in charts."));
    exports.chartsRed = registerColor('charts.red', { dark: exports.editorErrorForeground, light: exports.editorErrorForeground, hcDark: exports.editorErrorForeground, hcLight: exports.editorErrorForeground }, nls.localize('chartsRed', "The red color used in chart visualizations."));
    exports.chartsBlue = registerColor('charts.blue', { dark: exports.editorInfoForeground, light: exports.editorInfoForeground, hcDark: exports.editorInfoForeground, hcLight: exports.editorInfoForeground }, nls.localize('chartsBlue', "The blue color used in chart visualizations."));
    exports.chartsYellow = registerColor('charts.yellow', { dark: exports.editorWarningForeground, light: exports.editorWarningForeground, hcDark: exports.editorWarningForeground, hcLight: exports.editorWarningForeground }, nls.localize('chartsYellow', "The yellow color used in chart visualizations."));
    exports.chartsOrange = registerColor('charts.orange', { dark: exports.minimapFindMatch, light: exports.minimapFindMatch, hcDark: exports.minimapFindMatch, hcLight: exports.minimapFindMatch }, nls.localize('chartsOrange', "The orange color used in chart visualizations."));
    exports.chartsGreen = registerColor('charts.green', { dark: '#89D185', light: '#388A34', hcDark: '#89D185', hcLight: '#374e06' }, nls.localize('chartsGreen', "The green color used in chart visualizations."));
    exports.chartsPurple = registerColor('charts.purple', { dark: '#B180D7', light: '#652D90', hcDark: '#B180D7', hcLight: '#652D90' }, nls.localize('chartsPurple', "The purple color used in chart visualizations."));
    // ----- color functions
    function executeTransform(transform, theme) {
        var _a, _b, _c;
        switch (transform.op) {
            case 0 /* ColorTransformType.Darken */:
                return (_a = resolveColorValue(transform.value, theme)) === null || _a === void 0 ? void 0 : _a.darken(transform.factor);
            case 1 /* ColorTransformType.Lighten */:
                return (_b = resolveColorValue(transform.value, theme)) === null || _b === void 0 ? void 0 : _b.lighten(transform.factor);
            case 2 /* ColorTransformType.Transparent */:
                return (_c = resolveColorValue(transform.value, theme)) === null || _c === void 0 ? void 0 : _c.transparent(transform.factor);
            case 3 /* ColorTransformType.OneOf */:
                for (const candidate of transform.values) {
                    const color = resolveColorValue(candidate, theme);
                    if (color) {
                        return color;
                    }
                }
                return undefined;
            case 5 /* ColorTransformType.IfDefinedThenElse */:
                return resolveColorValue(theme.defines(transform.if) ? transform.then : transform.else, theme);
            case 4 /* ColorTransformType.LessProminent */: {
                const from = resolveColorValue(transform.value, theme);
                if (!from) {
                    return undefined;
                }
                const backgroundColor = resolveColorValue(transform.background, theme);
                if (!backgroundColor) {
                    return from.transparent(transform.factor * transform.transparency);
                }
                return from.isDarkerThan(backgroundColor)
                    ? color_1.Color.getLighterColor(from, backgroundColor, transform.factor).transparent(transform.transparency)
                    : color_1.Color.getDarkerColor(from, backgroundColor, transform.factor).transparent(transform.transparency);
            }
            default:
                throw (0, types_1.assertNever)(transform);
        }
    }
    exports.executeTransform = executeTransform;
    function darken(colorValue, factor) {
        return { op: 0 /* ColorTransformType.Darken */, value: colorValue, factor };
    }
    exports.darken = darken;
    function lighten(colorValue, factor) {
        return { op: 1 /* ColorTransformType.Lighten */, value: colorValue, factor };
    }
    exports.lighten = lighten;
    function transparent(colorValue, factor) {
        return { op: 2 /* ColorTransformType.Transparent */, value: colorValue, factor };
    }
    exports.transparent = transparent;
    function oneOf(...colorValues) {
        return { op: 3 /* ColorTransformType.OneOf */, values: colorValues };
    }
    exports.oneOf = oneOf;
    function ifDefinedThenElse(ifArg, thenArg, elseArg) {
        return { op: 5 /* ColorTransformType.IfDefinedThenElse */, if: ifArg, then: thenArg, else: elseArg };
    }
    exports.ifDefinedThenElse = ifDefinedThenElse;
    function lessProminent(colorValue, backgroundColorValue, factor, transparency) {
        return { op: 4 /* ColorTransformType.LessProminent */, value: colorValue, background: backgroundColorValue, factor, transparency };
    }
    // ----- implementation
    /**
     * @param colorValue Resolve a color value in the context of a theme
     */
    function resolveColorValue(colorValue, theme) {
        if (colorValue === null) {
            return undefined;
        }
        else if (typeof colorValue === 'string') {
            if (colorValue[0] === '#') {
                return color_1.Color.fromHex(colorValue);
            }
            return theme.getColor(colorValue);
        }
        else if (colorValue instanceof color_1.Color) {
            return colorValue;
        }
        else if (typeof colorValue === 'object') {
            return executeTransform(colorValue, theme);
        }
        return undefined;
    }
    exports.resolveColorValue = resolveColorValue;
    exports.workbenchColorsSchemaId = 'vscode://schemas/workbench-colors';
    let schemaRegistry = platform.Registry.as(jsonContributionRegistry_1.Extensions.JSONContribution);
    schemaRegistry.registerSchema(exports.workbenchColorsSchemaId, colorRegistry.getColorSchema());
    const delayer = new async_1.RunOnceScheduler(() => schemaRegistry.notifySchemaChanged(exports.workbenchColorsSchemaId), 200);
    colorRegistry.onDidChangeSchema(() => {
        if (!delayer.isScheduled()) {
            delayer.schedule();
        }
    });
});
// setTimeout(_ => console.log(colorRegistry.toString()), 5000);
//# sourceMappingURL=colorRegistry.js.map