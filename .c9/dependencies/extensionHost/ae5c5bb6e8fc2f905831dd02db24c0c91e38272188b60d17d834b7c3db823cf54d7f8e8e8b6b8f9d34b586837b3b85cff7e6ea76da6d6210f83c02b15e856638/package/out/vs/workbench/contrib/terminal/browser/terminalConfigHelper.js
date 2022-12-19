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
define(["require", "exports", "vs/nls", "vs/editor/common/config/editorOptions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/terminal/common/terminal", "vs/base/common/severity", "vs/platform/notification/common/notification", "vs/base/common/event", "vs/base/common/path", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/extensions/browser/extensionsActions", "vs/platform/product/common/productService", "vs/base/common/platform"], function (require, exports, nls, editorOptions_1, configuration_1, terminal_1, severity_1, notification_1, event_1, path_1, extensionManagement_1, instantiation_1, extensionsActions_1, productService_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalConfigHelper = void 0;
    const MINIMUM_FONT_SIZE = 6;
    const MAXIMUM_FONT_SIZE = 100;
    /**
     * Encapsulates terminal configuration logic, the primary purpose of this file is so that platform
     * specific test cases can be written.
     */
    let TerminalConfigHelper = class TerminalConfigHelper {
        constructor(_configurationService, _extensionManagementService, _notificationService, _instantiationService, _productService) {
            this._configurationService = _configurationService;
            this._extensionManagementService = _extensionManagementService;
            this._notificationService = _notificationService;
            this._instantiationService = _instantiationService;
            this._productService = _productService;
            this._linuxDistro = 1 /* LinuxDistro.Unknown */;
            this._onConfigChanged = new event_1.Emitter();
            this._recommendationsShown = false;
            this._updateConfig();
            this._configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration(terminal_1.TERMINAL_CONFIG_SECTION)) {
                    this._updateConfig();
                }
            });
            if (platform_1.isLinux) {
                if (navigator.userAgent.includes('Ubuntu')) {
                    this._linuxDistro = 3 /* LinuxDistro.Ubuntu */;
                }
                else if (navigator.userAgent.includes('Fedora')) {
                    this._linuxDistro = 2 /* LinuxDistro.Fedora */;
                }
            }
        }
        get onConfigChanged() { return this._onConfigChanged.event; }
        _updateConfig() {
            const configValues = this._configurationService.getValue(terminal_1.TERMINAL_CONFIG_SECTION);
            configValues.fontWeight = this._normalizeFontWeight(configValues.fontWeight, terminal_1.DEFAULT_FONT_WEIGHT);
            configValues.fontWeightBold = this._normalizeFontWeight(configValues.fontWeightBold, terminal_1.DEFAULT_BOLD_FONT_WEIGHT);
            this.config = configValues;
            this._onConfigChanged.fire();
        }
        configFontIsMonospace() {
            const fontSize = 15;
            const fontFamily = this.config.fontFamily || this._configurationService.getValue('editor').fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            const iRect = this._getBoundingRectFor('i', fontFamily, fontSize);
            const wRect = this._getBoundingRectFor('w', fontFamily, fontSize);
            // Check for invalid bounds, there is no reason to believe the font is not monospace
            if (!iRect || !wRect || !iRect.width || !wRect.width) {
                return true;
            }
            return iRect.width === wRect.width;
        }
        _createCharMeasureElementIfNecessary() {
            if (!this.panelContainer) {
                throw new Error('Cannot measure element when terminal is not attached');
            }
            // Create charMeasureElement if it hasn't been created or if it was orphaned by its parent
            if (!this._charMeasureElement || !this._charMeasureElement.parentElement) {
                this._charMeasureElement = document.createElement('div');
                this.panelContainer.appendChild(this._charMeasureElement);
            }
            return this._charMeasureElement;
        }
        _getBoundingRectFor(char, fontFamily, fontSize) {
            let charMeasureElement;
            try {
                charMeasureElement = this._createCharMeasureElementIfNecessary();
            }
            catch (_a) {
                return undefined;
            }
            const style = charMeasureElement.style;
            style.display = 'inline-block';
            style.fontFamily = fontFamily;
            style.fontSize = fontSize + 'px';
            style.lineHeight = 'normal';
            charMeasureElement.innerText = char;
            const rect = charMeasureElement.getBoundingClientRect();
            style.display = 'none';
            return rect;
        }
        _measureFont(fontFamily, fontSize, letterSpacing, lineHeight) {
            const rect = this._getBoundingRectFor('X', fontFamily, fontSize);
            // Bounding client rect was invalid, use last font measurement if available.
            if (this._lastFontMeasurement && (!rect || !rect.width || !rect.height)) {
                return this._lastFontMeasurement;
            }
            this._lastFontMeasurement = {
                fontFamily,
                fontSize,
                letterSpacing,
                lineHeight,
                charWidth: 0,
                charHeight: 0
            };
            if (rect && rect.width && rect.height) {
                this._lastFontMeasurement.charHeight = Math.ceil(rect.height);
                // Char width is calculated differently for DOM and the other renderer types. Refer to
                // how each renderer updates their dimensions in xterm.js
                if (this.config.gpuAcceleration === 'off') {
                    this._lastFontMeasurement.charWidth = rect.width;
                }
                else {
                    const scaledCharWidth = Math.floor(rect.width * window.devicePixelRatio);
                    const scaledCellWidth = scaledCharWidth + Math.round(letterSpacing);
                    const actualCellWidth = scaledCellWidth / window.devicePixelRatio;
                    this._lastFontMeasurement.charWidth = actualCellWidth - Math.round(letterSpacing) / window.devicePixelRatio;
                }
            }
            return this._lastFontMeasurement;
        }
        /**
         * Gets the font information based on the terminal.integrated.fontFamily
         * terminal.integrated.fontSize, terminal.integrated.lineHeight configuration properties
         */
        getFont(xtermCore, excludeDimensions) {
            var _a, _b;
            const editorConfig = this._configurationService.getValue('editor');
            let fontFamily = this.config.fontFamily || editorConfig.fontFamily || editorOptions_1.EDITOR_FONT_DEFAULTS.fontFamily;
            let fontSize = this._clampInt(this.config.fontSize, MINIMUM_FONT_SIZE, MAXIMUM_FONT_SIZE, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize);
            // Work around bad font on Fedora/Ubuntu
            if (!this.config.fontFamily) {
                if (this._linuxDistro === 2 /* LinuxDistro.Fedora */) {
                    fontFamily = '\'DejaVu Sans Mono\', monospace';
                }
                if (this._linuxDistro === 3 /* LinuxDistro.Ubuntu */) {
                    fontFamily = '\'Ubuntu Mono\', monospace';
                    // Ubuntu mono is somehow smaller, so set fontSize a bit larger to get the same perceived size.
                    fontSize = this._clampInt(fontSize + 2, MINIMUM_FONT_SIZE, MAXIMUM_FONT_SIZE, editorOptions_1.EDITOR_FONT_DEFAULTS.fontSize);
                }
            }
            const letterSpacing = this.config.letterSpacing ? Math.max(Math.floor(this.config.letterSpacing), terminal_1.MINIMUM_LETTER_SPACING) : terminal_1.DEFAULT_LETTER_SPACING;
            const lineHeight = this.config.lineHeight ? Math.max(this.config.lineHeight, 1) : terminal_1.DEFAULT_LINE_HEIGHT;
            if (excludeDimensions) {
                return {
                    fontFamily,
                    fontSize,
                    letterSpacing,
                    lineHeight
                };
            }
            // Get the character dimensions from xterm if it's available
            if (xtermCore) {
                if (xtermCore._renderService && ((_a = xtermCore._renderService.dimensions) === null || _a === void 0 ? void 0 : _a.actualCellWidth) && ((_b = xtermCore._renderService.dimensions) === null || _b === void 0 ? void 0 : _b.actualCellHeight)) {
                    return {
                        fontFamily,
                        fontSize,
                        letterSpacing,
                        lineHeight,
                        charHeight: xtermCore._renderService.dimensions.actualCellHeight / lineHeight,
                        charWidth: xtermCore._renderService.dimensions.actualCellWidth - Math.round(letterSpacing) / window.devicePixelRatio
                    };
                }
            }
            // Fall back to measuring the font ourselves
            return this._measureFont(fontFamily, fontSize, letterSpacing, lineHeight);
        }
        _clampInt(source, minimum, maximum, fallback) {
            let r = parseInt(source, 10);
            if (isNaN(r)) {
                return fallback;
            }
            if (typeof minimum === 'number') {
                r = Math.max(minimum, r);
            }
            if (typeof maximum === 'number') {
                r = Math.min(maximum, r);
            }
            return r;
        }
        async showRecommendations(shellLaunchConfig) {
            if (this._recommendationsShown) {
                return;
            }
            this._recommendationsShown = true;
            if (platform_1.isWindows && shellLaunchConfig.executable && (0, path_1.basename)(shellLaunchConfig.executable).toLowerCase() === 'wsl.exe') {
                const exeBasedExtensionTips = this._productService.exeBasedExtensionTips;
                if (!exeBasedExtensionTips || !exeBasedExtensionTips.wsl) {
                    return;
                }
                const extId = Object.keys(exeBasedExtensionTips.wsl.recommendations).find(extId => exeBasedExtensionTips.wsl.recommendations[extId].important);
                if (extId && !await this._isExtensionInstalled(extId)) {
                    this._notificationService.prompt(severity_1.default.Info, nls.localize('useWslExtension.title', "The '{0}' extension is recommended for opening a terminal in WSL.", exeBasedExtensionTips.wsl.friendlyName), [
                        {
                            label: nls.localize('install', 'Install'),
                            run: () => {
                                this._instantiationService.createInstance(extensionsActions_1.InstallRecommendedExtensionAction, extId).run();
                            }
                        }
                    ], {
                        sticky: true,
                        neverShowAgain: { id: 'terminalConfigHelper/launchRecommendationsIgnore', scope: notification_1.NeverShowAgainScope.GLOBAL },
                        onCancel: () => { }
                    });
                }
            }
        }
        async _isExtensionInstalled(id) {
            const extensions = await this._extensionManagementService.getInstalled();
            return extensions.some(e => e.identifier.id === id);
        }
        _normalizeFontWeight(input, defaultWeight) {
            if (input === 'normal' || input === 'bold') {
                return input;
            }
            return this._clampInt(input, terminal_1.MINIMUM_FONT_WEIGHT, terminal_1.MAXIMUM_FONT_WEIGHT, defaultWeight);
        }
    };
    TerminalConfigHelper = __decorate([
        __param(0, configuration_1.IConfigurationService),
        __param(1, extensionManagement_1.IExtensionManagementService),
        __param(2, notification_1.INotificationService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, productService_1.IProductService)
    ], TerminalConfigHelper);
    exports.TerminalConfigHelper = TerminalConfigHelper;
});
//# sourceMappingURL=terminalConfigHelper.js.map