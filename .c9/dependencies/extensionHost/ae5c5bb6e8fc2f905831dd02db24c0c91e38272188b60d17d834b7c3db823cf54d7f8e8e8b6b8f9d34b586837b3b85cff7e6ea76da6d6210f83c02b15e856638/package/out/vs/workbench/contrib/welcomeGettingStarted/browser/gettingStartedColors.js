/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/theme/common/colorRegistry", "vs/nls"], function (require, exports, colorRegistry_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.welcomePageProgressForeground = exports.welcomePageProgressBackground = exports.welcomePageTileShadow = exports.welcomePageTileHoverBackground = exports.welcomePageTileBackground = exports.welcomePageBackground = void 0;
    // Seprate from main module to break dependency cycles between welcomePage and gettingStarted.
    exports.welcomePageBackground = (0, colorRegistry_1.registerColor)('welcomePage.background', { light: null, dark: null, hcDark: null, hcLight: null }, (0, nls_1.localize)('welcomePage.background', 'Background color for the Welcome page.'));
    exports.welcomePageTileBackground = (0, colorRegistry_1.registerColor)('welcomePage.tileBackground', { dark: colorRegistry_1.editorWidgetBackground, light: colorRegistry_1.editorWidgetBackground, hcDark: '#000', hcLight: colorRegistry_1.editorWidgetBackground }, (0, nls_1.localize)('welcomePage.tileBackground', 'Background color for the tiles on the Get Started page.'));
    exports.welcomePageTileHoverBackground = (0, colorRegistry_1.registerColor)('welcomePage.tileHoverBackground', { dark: (0, colorRegistry_1.lighten)(colorRegistry_1.editorWidgetBackground, .2), light: (0, colorRegistry_1.darken)(colorRegistry_1.editorWidgetBackground, .1), hcDark: null, hcLight: null }, (0, nls_1.localize)('welcomePage.tileHoverBackground', 'Hover background color for the tiles on the Get Started.'));
    exports.welcomePageTileShadow = (0, colorRegistry_1.registerColor)('welcomePage.tileShadow', { light: colorRegistry_1.widgetShadow, dark: colorRegistry_1.widgetShadow, hcDark: null, hcLight: null }, (0, nls_1.localize)('welcomePage.tileShadow', 'Shadow color for the Welcome page walkthrough category buttons.'));
    exports.welcomePageProgressBackground = (0, colorRegistry_1.registerColor)('welcomePage.progress.background', { light: colorRegistry_1.inputBackground, dark: colorRegistry_1.inputBackground, hcDark: colorRegistry_1.inputBackground, hcLight: colorRegistry_1.inputBackground }, (0, nls_1.localize)('welcomePage.progress.background', 'Foreground color for the Welcome page progress bars.'));
    exports.welcomePageProgressForeground = (0, colorRegistry_1.registerColor)('welcomePage.progress.foreground', { light: colorRegistry_1.textLinkForeground, dark: colorRegistry_1.textLinkForeground, hcDark: colorRegistry_1.textLinkForeground, hcLight: colorRegistry_1.textLinkForeground }, (0, nls_1.localize)('welcomePage.progress.foreground', 'Background color for the Welcome page progress bars.'));
});
//# sourceMappingURL=gettingStartedColors.js.map