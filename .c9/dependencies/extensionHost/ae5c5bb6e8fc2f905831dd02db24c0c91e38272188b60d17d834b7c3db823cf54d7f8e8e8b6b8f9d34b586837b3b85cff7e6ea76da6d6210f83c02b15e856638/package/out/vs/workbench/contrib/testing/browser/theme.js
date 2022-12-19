/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/color", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/theme"], function (require, exports, color_1, nls_1, colorRegistry_1, themeService_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.testStatesToIconColors = exports.testMessageSeverityColors = exports.testingPeekHeaderBackground = exports.testingPeekBorder = exports.testingColorIconSkipped = exports.testingColorIconUnset = exports.testingColorIconQueued = exports.testingColorRunAction = exports.testingColorIconPassed = exports.testingColorIconErrored = exports.testingColorIconFailed = void 0;
    exports.testingColorIconFailed = (0, colorRegistry_1.registerColor)('testing.iconFailed', {
        dark: '#f14c4c',
        light: '#f14c4c',
        hcDark: '#f14c4c',
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('testing.iconFailed', "Color for the 'failed' icon in the test explorer."));
    exports.testingColorIconErrored = (0, colorRegistry_1.registerColor)('testing.iconErrored', {
        dark: '#f14c4c',
        light: '#f14c4c',
        hcDark: '#f14c4c',
        hcLight: '#B5200D'
    }, (0, nls_1.localize)('testing.iconErrored', "Color for the 'Errored' icon in the test explorer."));
    exports.testingColorIconPassed = (0, colorRegistry_1.registerColor)('testing.iconPassed', {
        dark: '#73c991',
        light: '#73c991',
        hcDark: '#73c991',
        hcLight: '#007100'
    }, (0, nls_1.localize)('testing.iconPassed', "Color for the 'passed' icon in the test explorer."));
    exports.testingColorRunAction = (0, colorRegistry_1.registerColor)('testing.runAction', {
        dark: exports.testingColorIconPassed,
        light: exports.testingColorIconPassed,
        hcDark: exports.testingColorIconPassed,
        hcLight: exports.testingColorIconPassed
    }, (0, nls_1.localize)('testing.runAction', "Color for 'run' icons in the editor."));
    exports.testingColorIconQueued = (0, colorRegistry_1.registerColor)('testing.iconQueued', {
        dark: '#cca700',
        light: '#cca700',
        hcDark: '#cca700',
        hcLight: '#cca700'
    }, (0, nls_1.localize)('testing.iconQueued', "Color for the 'Queued' icon in the test explorer."));
    exports.testingColorIconUnset = (0, colorRegistry_1.registerColor)('testing.iconUnset', {
        dark: '#848484',
        light: '#848484',
        hcDark: '#848484',
        hcLight: '#848484'
    }, (0, nls_1.localize)('testing.iconUnset', "Color for the 'Unset' icon in the test explorer."));
    exports.testingColorIconSkipped = (0, colorRegistry_1.registerColor)('testing.iconSkipped', {
        dark: '#848484',
        light: '#848484',
        hcDark: '#848484',
        hcLight: '#848484'
    }, (0, nls_1.localize)('testing.iconSkipped', "Color for the 'Skipped' icon in the test explorer."));
    exports.testingPeekBorder = (0, colorRegistry_1.registerColor)('testing.peekBorder', {
        dark: colorRegistry_1.editorErrorForeground,
        light: colorRegistry_1.editorErrorForeground,
        hcDark: colorRegistry_1.contrastBorder,
        hcLight: colorRegistry_1.contrastBorder
    }, (0, nls_1.localize)('testing.peekBorder', 'Color of the peek view borders and arrow.'));
    exports.testingPeekHeaderBackground = (0, colorRegistry_1.registerColor)('testing.peekHeaderBackground', {
        dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorErrorForeground, 0.1),
        light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorErrorForeground, 0.1),
        hcDark: null,
        hcLight: null
    }, (0, nls_1.localize)('testing.peekBorder', 'Color of the peek view borders and arrow.'));
    exports.testMessageSeverityColors = {
        [0 /* TestMessageType.Error */]: {
            decorationForeground: (0, colorRegistry_1.registerColor)('testing.message.error.decorationForeground', { dark: colorRegistry_1.editorErrorForeground, light: colorRegistry_1.editorErrorForeground, hcDark: colorRegistry_1.editorForeground, hcLight: colorRegistry_1.editorForeground }, (0, nls_1.localize)('testing.message.error.decorationForeground', 'Text color of test error messages shown inline in the editor.')),
            marginBackground: (0, colorRegistry_1.registerColor)('testing.message.error.lineBackground', { dark: new color_1.Color(new color_1.RGBA(255, 0, 0, 0.2)), light: new color_1.Color(new color_1.RGBA(255, 0, 0, 0.2)), hcDark: null, hcLight: null }, (0, nls_1.localize)('testing.message.error.marginBackground', 'Margin color beside error messages shown inline in the editor.')),
        },
        [1 /* TestMessageType.Info */]: {
            decorationForeground: (0, colorRegistry_1.registerColor)('testing.message.info.decorationForeground', { dark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.5), light: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.5), hcDark: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.5), hcLight: (0, colorRegistry_1.transparent)(colorRegistry_1.editorForeground, 0.5) }, (0, nls_1.localize)('testing.message.info.decorationForeground', 'Text color of test info messages shown inline in the editor.')),
            marginBackground: (0, colorRegistry_1.registerColor)('testing.message.info.lineBackground', { dark: null, light: null, hcDark: null, hcLight: null }, (0, nls_1.localize)('testing.message.info.marginBackground', 'Margin color beside info messages shown inline in the editor.')),
        },
    };
    exports.testStatesToIconColors = {
        [6 /* TestResultState.Errored */]: exports.testingColorIconErrored,
        [4 /* TestResultState.Failed */]: exports.testingColorIconFailed,
        [3 /* TestResultState.Passed */]: exports.testingColorIconPassed,
        [1 /* TestResultState.Queued */]: exports.testingColorIconQueued,
        [0 /* TestResultState.Unset */]: exports.testingColorIconUnset,
        [5 /* TestResultState.Skipped */]: exports.testingColorIconSkipped,
    };
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        //#region test states
        for (const [state, { marginBackground }] of Object.entries(exports.testMessageSeverityColors)) {
            collector.addRule(`.monaco-editor .testing-inline-message-severity-${state} {
			background: ${theme.getColor(marginBackground)};
		}`);
        }
        //#endregion test states
        //#region active buttons
        const inputActiveOptionBorderColor = theme.getColor(colorRegistry_1.inputActiveOptionBorder);
        if (inputActiveOptionBorderColor) {
            collector.addRule(`.testing-filter-action-item > .monaco-action-bar .testing-filter-button.checked { border-color: ${inputActiveOptionBorderColor}; }`);
        }
        const inputActiveOptionForegroundColor = theme.getColor(colorRegistry_1.inputActiveOptionForeground);
        if (inputActiveOptionForegroundColor) {
            collector.addRule(`.testing-filter-action-item > .monaco-action-bar .testing-filter-button.checked { color: ${inputActiveOptionForegroundColor}; }`);
        }
        const inputActiveOptionBackgroundColor = theme.getColor(colorRegistry_1.inputActiveOptionBackground);
        if (inputActiveOptionBackgroundColor) {
            collector.addRule(`.testing-filter-action-item > .monaco-action-bar .testing-filter-button.checked { background-color: ${inputActiveOptionBackgroundColor}; }`);
        }
        const badgeColor = theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND);
        collector.addRule(`.monaco-workbench .part > .title > .title-actions .action-label.codicon-testing-autorun::after { background-color: ${badgeColor}; }`);
        //#endregion
    });
});
//# sourceMappingURL=theme.js.map