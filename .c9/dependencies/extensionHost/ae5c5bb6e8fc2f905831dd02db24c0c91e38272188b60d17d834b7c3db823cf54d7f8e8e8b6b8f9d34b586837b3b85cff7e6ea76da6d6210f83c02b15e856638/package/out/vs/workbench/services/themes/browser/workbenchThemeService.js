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
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/workbench/services/extensions/common/extensions", "vs/workbench/services/themes/common/workbenchThemeService", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/registry/common/platform", "vs/base/common/errors", "vs/platform/configuration/common/configuration", "vs/workbench/services/themes/common/colorThemeData", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/workbench/services/themes/common/fileIconThemeSchema", "vs/base/common/lifecycle", "vs/workbench/services/themes/browser/fileIconThemeData", "vs/base/browser/dom", "vs/workbench/services/environment/browser/environmentService", "vs/platform/files/common/files", "vs/base/common/resources", "vs/workbench/services/themes/common/colorThemeSchema", "vs/platform/instantiation/common/extensions", "vs/platform/remote/common/remoteHosts", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/extensionResourceLoader/common/extensionResourceLoader", "vs/workbench/services/themes/common/themeExtensionPoints", "vs/workbench/services/themes/common/themeConfiguration", "vs/workbench/services/themes/browser/productIconThemeData", "vs/workbench/services/themes/common/productIconThemeSchema", "vs/platform/log/common/log", "vs/base/common/platform", "vs/platform/theme/common/theme", "vs/workbench/services/themes/common/hostColorSchemeService", "vs/base/common/async", "vs/workbench/services/userData/browser/userDataInit", "vs/platform/theme/browser/iconsStyleSheet", "vs/platform/theme/common/colorRegistry", "vs/editor/common/languages/language"], function (require, exports, nls, types, extensions_1, workbenchThemeService_1, storage_1, telemetry_1, platform_1, errors, configuration_1, colorThemeData_1, themeService_1, event_1, fileIconThemeSchema_1, lifecycle_1, fileIconThemeData_1, dom_1, environmentService_1, files_1, resources, colorThemeSchema_1, extensions_2, remoteHosts_1, layoutService_1, extensionResourceLoader_1, themeExtensionPoints_1, themeConfiguration_1, productIconThemeData_1, productIconThemeSchema_1, log_1, platform_2, theme_1, hostColorSchemeService_1, async_1, userDataInit_1, iconsStyleSheet_1, colorRegistry_1, language_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchThemeService = void 0;
    // implementation
    const DEFAULT_COLOR_THEME_ID = 'vs-dark vscode-theme-defaults-themes-dark_plus-json';
    const DEFAULT_LIGHT_COLOR_THEME_ID = 'vs vscode-theme-defaults-themes-light_plus-json';
    const PERSISTED_OS_COLOR_SCHEME = 'osColorScheme';
    const defaultThemeExtensionId = 'vscode-theme-defaults';
    const DEFAULT_FILE_ICON_THEME_ID = 'vscode.vscode-theme-seti-vs-seti';
    const fileIconsEnabledClass = 'file-icons-enabled';
    const colorThemeRulesClassName = 'contributedColorTheme';
    const fileIconThemeRulesClassName = 'contributedFileIconTheme';
    const productIconThemeRulesClassName = 'contributedProductIconTheme';
    const themingRegistry = platform_1.Registry.as(themeService_1.Extensions.ThemingContribution);
    function validateThemeId(theme) {
        // migrations
        switch (theme) {
            case workbenchThemeService_1.VS_LIGHT_THEME: return `vs ${defaultThemeExtensionId}-themes-light_vs-json`;
            case workbenchThemeService_1.VS_DARK_THEME: return `vs-dark ${defaultThemeExtensionId}-themes-dark_vs-json`;
            case workbenchThemeService_1.VS_HC_THEME: return `hc-black ${defaultThemeExtensionId}-themes-hc_black-json`;
            case workbenchThemeService_1.VS_HC_LIGHT_THEME: return `hc-light ${defaultThemeExtensionId}-themes-hc_light-json`;
        }
        return theme;
    }
    const colorThemesExtPoint = (0, themeExtensionPoints_1.registerColorThemeExtensionPoint)();
    const fileIconThemesExtPoint = (0, themeExtensionPoints_1.registerFileIconThemeExtensionPoint)();
    const productIconThemesExtPoint = (0, themeExtensionPoints_1.registerProductIconThemeExtensionPoint)();
    let WorkbenchThemeService = class WorkbenchThemeService {
        constructor(extensionService, storageService, configurationService, telemetryService, environmentService, fileService, extensionResourceLoaderService, layoutService, logService, hostColorService, userDataInitializationService, languageService) {
            var _a;
            this.storageService = storageService;
            this.configurationService = configurationService;
            this.telemetryService = telemetryService;
            this.environmentService = environmentService;
            this.extensionResourceLoaderService = extensionResourceLoaderService;
            this.layoutService = layoutService;
            this.logService = logService;
            this.hostColorService = hostColorService;
            this.userDataInitializationService = userDataInitializationService;
            this.languageService = languageService;
            this.themeExtensionsActivated = new Map();
            this.container = layoutService.container;
            this.settings = new themeConfiguration_1.ThemeConfiguration(configurationService);
            this.colorThemeRegistry = new themeExtensionPoints_1.ThemeRegistry(colorThemesExtPoint, colorThemeData_1.ColorThemeData.fromExtensionTheme);
            this.colorThemeWatcher = new ThemeFileWatcher(fileService, environmentService, this.reloadCurrentColorTheme.bind(this));
            this.onColorThemeChange = new event_1.Emitter({ leakWarningThreshold: 400 });
            this.currentColorTheme = colorThemeData_1.ColorThemeData.createUnloadedTheme('');
            this.colorThemeSequencer = new async_1.Sequencer();
            this.fileIconThemeWatcher = new ThemeFileWatcher(fileService, environmentService, this.reloadCurrentFileIconTheme.bind(this));
            this.fileIconThemeRegistry = new themeExtensionPoints_1.ThemeRegistry(fileIconThemesExtPoint, fileIconThemeData_1.FileIconThemeData.fromExtensionTheme, true, fileIconThemeData_1.FileIconThemeData.noIconTheme);
            this.fileIconThemeLoader = new fileIconThemeData_1.FileIconThemeLoader(extensionResourceLoaderService, languageService);
            this.onFileIconThemeChange = new event_1.Emitter({ leakWarningThreshold: 400 });
            this.currentFileIconTheme = fileIconThemeData_1.FileIconThemeData.createUnloadedTheme('');
            this.fileIconThemeSequencer = new async_1.Sequencer();
            this.productIconThemeWatcher = new ThemeFileWatcher(fileService, environmentService, this.reloadCurrentProductIconTheme.bind(this));
            this.productIconThemeRegistry = new themeExtensionPoints_1.ThemeRegistry(productIconThemesExtPoint, productIconThemeData_1.ProductIconThemeData.fromExtensionTheme, true, productIconThemeData_1.ProductIconThemeData.defaultTheme);
            this.onProductIconThemeChange = new event_1.Emitter();
            this.currentProductIconTheme = productIconThemeData_1.ProductIconThemeData.createUnloadedTheme('');
            this.productIconThemeSequencer = new async_1.Sequencer();
            // In order to avoid paint flashing for tokens, because
            // themes are loaded asynchronously, we need to initialize
            // a color theme document with good defaults until the theme is loaded
            let themeData = colorThemeData_1.ColorThemeData.fromStorageData(this.storageService);
            if (themeData && this.settings.colorTheme !== themeData.settingsId && this.settings.isDefaultColorTheme()) {
                // the web has different defaults than the desktop, therefore do not restore when the setting is the default theme and the storage doesn't match that.
                themeData = undefined;
            }
            // the preferred color scheme (high contrast, light, dark) has changed since the last start
            const preferredColorScheme = this.getPreferredColorScheme();
            if (preferredColorScheme && (themeData === null || themeData === void 0 ? void 0 : themeData.type) !== preferredColorScheme && this.storageService.get(PERSISTED_OS_COLOR_SCHEME, 0 /* StorageScope.GLOBAL */) !== preferredColorScheme) {
                themeData = colorThemeData_1.ColorThemeData.createUnloadedThemeForThemeType(preferredColorScheme);
            }
            if (!themeData) {
                const initialColorTheme = (_a = environmentService.options) === null || _a === void 0 ? void 0 : _a.initialColorTheme;
                if (initialColorTheme) {
                    themeData = colorThemeData_1.ColorThemeData.createUnloadedThemeForThemeType(initialColorTheme.themeType, initialColorTheme.colors);
                }
            }
            if (!themeData) {
                themeData = colorThemeData_1.ColorThemeData.createUnloadedThemeForThemeType(platform_2.isWeb ? theme_1.ColorScheme.LIGHT : theme_1.ColorScheme.DARK);
            }
            themeData.setCustomizations(this.settings);
            this.applyTheme(themeData, undefined, true);
            const fileIconData = fileIconThemeData_1.FileIconThemeData.fromStorageData(this.storageService);
            if (fileIconData) {
                this.applyAndSetFileIconTheme(fileIconData, true);
            }
            const productIconData = productIconThemeData_1.ProductIconThemeData.fromStorageData(this.storageService);
            if (productIconData) {
                this.applyAndSetProductIconTheme(productIconData, true);
            }
            Promise.all([extensionService.whenInstalledExtensionsRegistered(), userDataInitializationService.whenInitializationFinished()]).then(_ => {
                this.installConfigurationListener();
                this.installPreferredSchemeListener();
                this.installRegistryListeners();
                this.initialize().catch(errors.onUnexpectedError);
            });
            const codiconStyleSheet = (0, dom_1.createStyleSheet)();
            codiconStyleSheet.id = 'codiconStyles';
            const iconsStyleSheet = (0, iconsStyleSheet_1.getIconsStyleSheet)(this);
            function updateAll() {
                codiconStyleSheet.textContent = iconsStyleSheet.getCSS();
            }
            const delayer = new async_1.RunOnceScheduler(updateAll, 0);
            iconsStyleSheet.onDidChange(() => delayer.schedule());
            delayer.schedule();
        }
        initialize() {
            const extDevLocs = this.environmentService.extensionDevelopmentLocationURI;
            const extDevLoc = extDevLocs && extDevLocs.length === 1 ? extDevLocs[0] : undefined; // in dev mode, switch to a theme provided by the extension under dev.
            const initializeColorTheme = async () => {
                const devThemes = this.colorThemeRegistry.findThemeByExtensionLocation(extDevLoc);
                if (devThemes.length) {
                    return this.setColorTheme(devThemes[0].id, 7 /* ConfigurationTarget.MEMORY */);
                }
                const fallbackTheme = this.currentColorTheme.type === theme_1.ColorScheme.LIGHT ? DEFAULT_LIGHT_COLOR_THEME_ID : DEFAULT_COLOR_THEME_ID;
                const theme = this.colorThemeRegistry.findThemeBySettingsId(this.settings.colorTheme, fallbackTheme);
                const preferredColorScheme = this.getPreferredColorScheme();
                const prevScheme = this.storageService.get(PERSISTED_OS_COLOR_SCHEME, 0 /* StorageScope.GLOBAL */);
                if (preferredColorScheme !== prevScheme) {
                    this.storageService.store(PERSISTED_OS_COLOR_SCHEME, preferredColorScheme, 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
                    if (preferredColorScheme && (theme === null || theme === void 0 ? void 0 : theme.type) !== preferredColorScheme) {
                        return this.applyPreferredColorTheme(preferredColorScheme);
                    }
                }
                return this.setColorTheme(theme && theme.id, undefined);
            };
            const initializeFileIconTheme = async () => {
                const devThemes = this.fileIconThemeRegistry.findThemeByExtensionLocation(extDevLoc);
                if (devThemes.length) {
                    return this.setFileIconTheme(devThemes[0].id, 7 /* ConfigurationTarget.MEMORY */);
                }
                const theme = this.fileIconThemeRegistry.findThemeBySettingsId(this.settings.fileIconTheme);
                return this.setFileIconTheme(theme ? theme.id : DEFAULT_FILE_ICON_THEME_ID, undefined);
            };
            const initializeProductIconTheme = async () => {
                const devThemes = this.productIconThemeRegistry.findThemeByExtensionLocation(extDevLoc);
                if (devThemes.length) {
                    return this.setProductIconTheme(devThemes[0].id, 7 /* ConfigurationTarget.MEMORY */);
                }
                const theme = this.productIconThemeRegistry.findThemeBySettingsId(this.settings.productIconTheme);
                return this.setProductIconTheme(theme ? theme.id : productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID, undefined);
            };
            return Promise.all([initializeColorTheme(), initializeFileIconTheme(), initializeProductIconTheme()]);
        }
        installConfigurationListener() {
            this.configurationService.onDidChangeConfiguration(e => {
                let lazyPreferredColorScheme = null;
                const getPreferredColorScheme = () => {
                    if (lazyPreferredColorScheme === null) {
                        lazyPreferredColorScheme = this.getPreferredColorScheme();
                    }
                    return lazyPreferredColorScheme;
                };
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.COLOR_THEME)) {
                    this.restoreColorTheme();
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME) || e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.DETECT_HC)) {
                    this.handlePreferredSchemeUpdated();
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME) && getPreferredColorScheme() === theme_1.ColorScheme.DARK) {
                    this.applyPreferredColorTheme(theme_1.ColorScheme.DARK);
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME) && getPreferredColorScheme() === theme_1.ColorScheme.LIGHT) {
                    this.applyPreferredColorTheme(theme_1.ColorScheme.LIGHT);
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME) && getPreferredColorScheme() === theme_1.ColorScheme.HIGH_CONTRAST_DARK) {
                    this.applyPreferredColorTheme(theme_1.ColorScheme.HIGH_CONTRAST_DARK);
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME) && getPreferredColorScheme() === theme_1.ColorScheme.HIGH_CONTRAST_LIGHT) {
                    this.applyPreferredColorTheme(theme_1.ColorScheme.HIGH_CONTRAST_LIGHT);
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME)) {
                    this.restoreFileIconTheme();
                }
                if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.PRODUCT_ICON_THEME)) {
                    this.restoreProductIconTheme();
                }
                if (this.currentColorTheme) {
                    let hasColorChanges = false;
                    if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.COLOR_CUSTOMIZATIONS)) {
                        this.currentColorTheme.setCustomColors(this.settings.colorCustomizations);
                        hasColorChanges = true;
                    }
                    if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.TOKEN_COLOR_CUSTOMIZATIONS)) {
                        this.currentColorTheme.setCustomTokenColors(this.settings.tokenColorCustomizations);
                        hasColorChanges = true;
                    }
                    if (e.affectsConfiguration(workbenchThemeService_1.ThemeSettings.SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS)) {
                        this.currentColorTheme.setCustomSemanticTokenColors(this.settings.semanticTokenColorCustomizations);
                        hasColorChanges = true;
                    }
                    if (hasColorChanges) {
                        this.updateDynamicCSSRules(this.currentColorTheme);
                        this.onColorThemeChange.fire(this.currentColorTheme);
                    }
                }
            });
        }
        installRegistryListeners() {
            let prevColorId = undefined;
            // update settings schema setting for theme specific settings
            this.colorThemeRegistry.onDidChange(async (event) => {
                (0, themeConfiguration_1.updateColorThemeConfigurationSchemas)(event.themes);
                if (await this.restoreColorTheme()) { // checks if theme from settings exists and is set
                    // restore theme
                    if (this.currentColorTheme.id === DEFAULT_COLOR_THEME_ID && !types.isUndefined(prevColorId) && await this.colorThemeRegistry.findThemeById(prevColorId)) {
                        await this.setColorTheme(prevColorId, 'auto');
                        prevColorId = undefined;
                    }
                    else if (event.added.some(t => t.settingsId === this.currentColorTheme.settingsId)) {
                        await this.reloadCurrentColorTheme();
                    }
                }
                else if (event.removed.some(t => t.settingsId === this.currentColorTheme.settingsId)) {
                    // current theme is no longer available
                    prevColorId = this.currentColorTheme.id;
                    await this.setColorTheme(DEFAULT_COLOR_THEME_ID, 'auto');
                }
            });
            let prevFileIconId = undefined;
            this.fileIconThemeRegistry.onDidChange(async (event) => {
                (0, themeConfiguration_1.updateFileIconThemeConfigurationSchemas)(event.themes);
                if (await this.restoreFileIconTheme()) { // checks if theme from settings exists and is set
                    // restore theme
                    if (this.currentFileIconTheme.id === DEFAULT_FILE_ICON_THEME_ID && !types.isUndefined(prevFileIconId) && this.fileIconThemeRegistry.findThemeById(prevFileIconId)) {
                        await this.setFileIconTheme(prevFileIconId, 'auto');
                        prevFileIconId = undefined;
                    }
                    else if (event.added.some(t => t.settingsId === this.currentFileIconTheme.settingsId)) {
                        await this.reloadCurrentFileIconTheme();
                    }
                }
                else if (event.removed.some(t => t.settingsId === this.currentFileIconTheme.settingsId)) {
                    // current theme is no longer available
                    prevFileIconId = this.currentFileIconTheme.id;
                    await this.setFileIconTheme(DEFAULT_FILE_ICON_THEME_ID, 'auto');
                }
            });
            let prevProductIconId = undefined;
            this.productIconThemeRegistry.onDidChange(async (event) => {
                (0, themeConfiguration_1.updateProductIconThemeConfigurationSchemas)(event.themes);
                if (await this.restoreProductIconTheme()) { // checks if theme from settings exists and is set
                    // restore theme
                    if (this.currentProductIconTheme.id === productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID && !types.isUndefined(prevProductIconId) && this.productIconThemeRegistry.findThemeById(prevProductIconId)) {
                        await this.setProductIconTheme(prevProductIconId, 'auto');
                        prevProductIconId = undefined;
                    }
                    else if (event.added.some(t => t.settingsId === this.currentProductIconTheme.settingsId)) {
                        await this.reloadCurrentProductIconTheme();
                    }
                }
                else if (event.removed.some(t => t.settingsId === this.currentProductIconTheme.settingsId)) {
                    // current theme is no longer available
                    prevProductIconId = this.currentProductIconTheme.id;
                    await this.setProductIconTheme(productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID, 'auto');
                }
            });
            return Promise.all([this.getColorThemes(), this.getFileIconThemes(), this.getProductIconThemes()]).then(([ct, fit, pit]) => {
                (0, themeConfiguration_1.updateColorThemeConfigurationSchemas)(ct);
                (0, themeConfiguration_1.updateFileIconThemeConfigurationSchemas)(fit);
                (0, themeConfiguration_1.updateProductIconThemeConfigurationSchemas)(pit);
            });
        }
        // preferred scheme handling
        installPreferredSchemeListener() {
            this.hostColorService.onDidChangeColorScheme(() => this.handlePreferredSchemeUpdated());
        }
        async handlePreferredSchemeUpdated() {
            const scheme = this.getPreferredColorScheme();
            const prevScheme = this.storageService.get(PERSISTED_OS_COLOR_SCHEME, 0 /* StorageScope.GLOBAL */);
            if (scheme !== prevScheme) {
                this.storageService.store(PERSISTED_OS_COLOR_SCHEME, scheme, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                if (scheme) {
                    if (!prevScheme) {
                        // remember the theme before scheme switching
                        this.themeSettingIdBeforeSchemeSwitch = this.settings.colorTheme;
                    }
                    return this.applyPreferredColorTheme(scheme);
                }
                else if (prevScheme && this.themeSettingIdBeforeSchemeSwitch) {
                    // reapply the theme before scheme switching
                    const theme = this.colorThemeRegistry.findThemeBySettingsId(this.themeSettingIdBeforeSchemeSwitch, undefined);
                    if (theme) {
                        this.setColorTheme(theme.id, 'auto');
                    }
                }
            }
            return undefined;
        }
        getPreferredColorScheme() {
            if (this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.DETECT_HC) && this.hostColorService.highContrast) {
                return this.hostColorService.dark ? theme_1.ColorScheme.HIGH_CONTRAST_DARK : theme_1.ColorScheme.HIGH_CONTRAST_LIGHT;
            }
            if (this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.DETECT_COLOR_SCHEME)) {
                return this.hostColorService.dark ? theme_1.ColorScheme.DARK : theme_1.ColorScheme.LIGHT;
            }
            return undefined;
        }
        async applyPreferredColorTheme(type) {
            let settingId;
            switch (type) {
                case theme_1.ColorScheme.LIGHT:
                    settingId = workbenchThemeService_1.ThemeSettings.PREFERRED_LIGHT_THEME;
                    break;
                case theme_1.ColorScheme.HIGH_CONTRAST_DARK:
                    settingId = workbenchThemeService_1.ThemeSettings.PREFERRED_HC_DARK_THEME;
                    break;
                case theme_1.ColorScheme.HIGH_CONTRAST_LIGHT:
                    settingId = workbenchThemeService_1.ThemeSettings.PREFERRED_HC_LIGHT_THEME;
                    break;
                default:
                    settingId = workbenchThemeService_1.ThemeSettings.PREFERRED_DARK_THEME;
            }
            const themeSettingId = this.configurationService.getValue(settingId);
            if (themeSettingId && typeof themeSettingId === 'string') {
                const theme = this.colorThemeRegistry.findThemeBySettingsId(themeSettingId, undefined);
                if (theme) {
                    const configurationTarget = this.settings.findAutoConfigurationTarget(settingId);
                    return this.setColorTheme(theme.id, configurationTarget);
                }
            }
            return null;
        }
        getColorTheme() {
            return this.currentColorTheme;
        }
        async getColorThemes() {
            return this.colorThemeRegistry.getThemes();
        }
        async getMarketplaceColorThemes(publisher, name, version) {
            const extensionLocation = this.extensionResourceLoaderService.getExtensionGalleryResourceURL({ publisher, name, version }, 'extension');
            if (extensionLocation) {
                try {
                    const manifestContent = await this.extensionResourceLoaderService.readExtensionResource(resources.joinPath(extensionLocation, 'package.json'));
                    return this.colorThemeRegistry.getMarketplaceThemes(JSON.parse(manifestContent), extensionLocation, workbenchThemeService_1.ExtensionData.fromName(publisher, name));
                }
                catch (e) {
                    this.logService.error('Problem loading themes from marketplace', e);
                }
            }
            return [];
        }
        get onDidColorThemeChange() {
            return this.onColorThemeChange.event;
        }
        setColorTheme(themeIdOrTheme, settingsTarget) {
            return this.colorThemeSequencer.queue(async () => {
                return this.internalSetColorTheme(themeIdOrTheme, settingsTarget);
            });
        }
        async internalSetColorTheme(themeIdOrTheme, settingsTarget) {
            var _a;
            if (!themeIdOrTheme) {
                return null;
            }
            const themeId = types.isString(themeIdOrTheme) ? validateThemeId(themeIdOrTheme) : themeIdOrTheme.id;
            if (this.currentColorTheme.isLoaded && themeId === this.currentColorTheme.id) {
                if (settingsTarget !== 'preview') {
                    this.currentColorTheme.toStorage(this.storageService);
                }
                return this.settings.setColorTheme(this.currentColorTheme, settingsTarget);
            }
            let themeData = this.colorThemeRegistry.findThemeById(themeId);
            if (!themeData) {
                if (themeIdOrTheme instanceof colorThemeData_1.ColorThemeData) {
                    themeData = themeIdOrTheme;
                }
                else {
                    return null;
                }
            }
            try {
                await themeData.ensureLoaded(this.extensionResourceLoaderService);
                themeData.setCustomizations(this.settings);
                return this.applyTheme(themeData, settingsTarget);
            }
            catch (error) {
                throw new Error(nls.localize('error.cannotloadtheme', "Unable to load {0}: {1}", (_a = themeData.location) === null || _a === void 0 ? void 0 : _a.toString(), error.message));
            }
        }
        reloadCurrentColorTheme() {
            return this.colorThemeSequencer.queue(async () => {
                var _a;
                try {
                    const theme = this.colorThemeRegistry.findThemeBySettingsId(this.currentColorTheme.settingsId) || this.currentColorTheme;
                    await theme.reload(this.extensionResourceLoaderService);
                    theme.setCustomizations(this.settings);
                    await this.applyTheme(theme, undefined, false);
                }
                catch (error) {
                    this.logService.info('Unable to reload {0}: {1}', (_a = this.currentColorTheme.location) === null || _a === void 0 ? void 0 : _a.toString());
                }
            });
        }
        async restoreColorTheme() {
            return this.colorThemeSequencer.queue(async () => {
                const settingId = this.settings.colorTheme;
                const theme = this.colorThemeRegistry.findThemeBySettingsId(settingId);
                if (theme) {
                    if (settingId !== this.currentColorTheme.settingsId) {
                        await this.internalSetColorTheme(theme.id, undefined);
                    }
                    else if (theme !== this.currentColorTheme) {
                        await theme.ensureLoaded(this.extensionResourceLoaderService);
                        theme.setCustomizations(this.settings);
                        await this.applyTheme(theme, undefined, true);
                    }
                    return true;
                }
                return false;
            });
        }
        updateDynamicCSSRules(themeData) {
            const cssRules = new Set();
            const ruleCollector = {
                addRule: (rule) => {
                    if (!cssRules.has(rule)) {
                        cssRules.add(rule);
                    }
                }
            };
            ruleCollector.addRule(`.monaco-workbench { forced-color-adjust: none; }`);
            themingRegistry.getThemingParticipants().forEach(p => p(themeData, ruleCollector, this.environmentService));
            const colorVariables = [];
            for (const item of (0, colorRegistry_1.getColorRegistry)().getColors()) {
                const color = themeData.getColor(item.id, true);
                if (color) {
                    colorVariables.push(`${(0, colorRegistry_1.asCssVariableName)(item.id)}: ${color.toString()};`);
                }
            }
            ruleCollector.addRule(`.monaco-workbench { ${colorVariables.join('\n')} }`);
            _applyRules([...cssRules].join('\n'), colorThemeRulesClassName);
        }
        applyTheme(newTheme, settingsTarget, silent = false) {
            this.updateDynamicCSSRules(newTheme);
            if (this.currentColorTheme.id) {
                this.container.classList.remove(...this.currentColorTheme.classNames);
            }
            else {
                this.container.classList.remove(workbenchThemeService_1.VS_DARK_THEME, workbenchThemeService_1.VS_LIGHT_THEME, workbenchThemeService_1.VS_HC_THEME, workbenchThemeService_1.VS_HC_LIGHT_THEME);
            }
            this.container.classList.add(...newTheme.classNames);
            this.currentColorTheme.clearCaches();
            this.currentColorTheme = newTheme;
            if (!this.colorThemingParticipantChangeListener) {
                this.colorThemingParticipantChangeListener = themingRegistry.onThemingParticipantAdded(_ => this.updateDynamicCSSRules(this.currentColorTheme));
            }
            this.colorThemeWatcher.update(newTheme);
            this.sendTelemetry(newTheme.id, newTheme.extensionData, 'color');
            if (silent) {
                return Promise.resolve(null);
            }
            this.onColorThemeChange.fire(this.currentColorTheme);
            // remember theme data for a quick restore
            if (newTheme.isLoaded && settingsTarget !== 'preview') {
                newTheme.toStorage(this.storageService);
            }
            return this.settings.setColorTheme(this.currentColorTheme, settingsTarget);
        }
        sendTelemetry(themeId, themeData, themeType) {
            if (themeData) {
                const key = themeType + themeData.extensionId;
                if (!this.themeExtensionsActivated.get(key)) {
                    this.telemetryService.publicLog2('activatePlugin', {
                        id: themeData.extensionId,
                        name: themeData.extensionName,
                        isBuiltin: themeData.extensionIsBuiltin,
                        publisherDisplayName: themeData.extensionPublisher,
                        themeId: themeId
                    });
                    this.themeExtensionsActivated.set(key, true);
                }
            }
        }
        async getFileIconThemes() {
            return this.fileIconThemeRegistry.getThemes();
        }
        getFileIconTheme() {
            return this.currentFileIconTheme;
        }
        get onDidFileIconThemeChange() {
            return this.onFileIconThemeChange.event;
        }
        async setFileIconTheme(iconThemeOrId, settingsTarget) {
            return this.fileIconThemeSequencer.queue(async () => {
                return this.internalSetFileIconTheme(iconThemeOrId, settingsTarget);
            });
        }
        async internalSetFileIconTheme(iconThemeOrId, settingsTarget) {
            if (iconThemeOrId === undefined) {
                iconThemeOrId = '';
            }
            const themeId = types.isString(iconThemeOrId) ? iconThemeOrId : iconThemeOrId.id;
            if (themeId !== this.currentFileIconTheme.id || !this.currentFileIconTheme.isLoaded) {
                let newThemeData = this.fileIconThemeRegistry.findThemeById(themeId);
                if (!newThemeData && iconThemeOrId instanceof fileIconThemeData_1.FileIconThemeData) {
                    newThemeData = iconThemeOrId;
                }
                if (!newThemeData) {
                    newThemeData = fileIconThemeData_1.FileIconThemeData.noIconTheme;
                }
                await newThemeData.ensureLoaded(this.fileIconThemeLoader);
                this.applyAndSetFileIconTheme(newThemeData); // updates this.currentFileIconTheme
            }
            const themeData = this.currentFileIconTheme;
            // remember theme data for a quick restore
            if (themeData.isLoaded && settingsTarget !== 'preview' && (!themeData.location || !(0, remoteHosts_1.getRemoteAuthority)(themeData.location))) {
                themeData.toStorage(this.storageService);
            }
            await this.settings.setFileIconTheme(this.currentFileIconTheme, settingsTarget);
            return themeData;
        }
        async getMarketplaceFileIconThemes(publisher, name, version) {
            const extensionLocation = this.extensionResourceLoaderService.getExtensionGalleryResourceURL({ publisher, name, version }, 'extension');
            if (extensionLocation) {
                try {
                    const manifestContent = await this.extensionResourceLoaderService.readExtensionResource(resources.joinPath(extensionLocation, 'package.json'));
                    return this.fileIconThemeRegistry.getMarketplaceThemes(JSON.parse(manifestContent), extensionLocation, workbenchThemeService_1.ExtensionData.fromName(publisher, name));
                }
                catch (e) {
                    this.logService.error('Problem loading themes from marketplace', e);
                }
            }
            return [];
        }
        async reloadCurrentFileIconTheme() {
            return this.fileIconThemeSequencer.queue(async () => {
                await this.currentFileIconTheme.reload(this.fileIconThemeLoader);
                this.applyAndSetFileIconTheme(this.currentFileIconTheme);
            });
        }
        async restoreFileIconTheme() {
            return this.fileIconThemeSequencer.queue(async () => {
                const settingId = this.settings.fileIconTheme;
                const theme = this.fileIconThemeRegistry.findThemeBySettingsId(settingId);
                if (theme) {
                    if (settingId !== this.currentFileIconTheme.settingsId) {
                        await this.internalSetFileIconTheme(theme.id, undefined);
                    }
                    else if (theme !== this.currentFileIconTheme) {
                        await theme.ensureLoaded(this.fileIconThemeLoader);
                        this.applyAndSetFileIconTheme(theme, true);
                    }
                    return true;
                }
                return false;
            });
        }
        applyAndSetFileIconTheme(iconThemeData, silent = false) {
            this.currentFileIconTheme = iconThemeData;
            _applyRules(iconThemeData.styleSheetContent, fileIconThemeRulesClassName);
            if (iconThemeData.id) {
                this.container.classList.add(fileIconsEnabledClass);
            }
            else {
                this.container.classList.remove(fileIconsEnabledClass);
            }
            this.fileIconThemeWatcher.update(iconThemeData);
            if (iconThemeData.id) {
                this.sendTelemetry(iconThemeData.id, iconThemeData.extensionData, 'fileIcon');
            }
            if (!silent) {
                this.onFileIconThemeChange.fire(this.currentFileIconTheme);
            }
        }
        async getProductIconThemes() {
            return this.productIconThemeRegistry.getThemes();
        }
        getProductIconTheme() {
            return this.currentProductIconTheme;
        }
        get onDidProductIconThemeChange() {
            return this.onProductIconThemeChange.event;
        }
        async setProductIconTheme(iconThemeOrId, settingsTarget) {
            return this.productIconThemeSequencer.queue(async () => {
                return this.internalSetProductIconTheme(iconThemeOrId, settingsTarget);
            });
        }
        async internalSetProductIconTheme(iconThemeOrId, settingsTarget) {
            if (iconThemeOrId === undefined) {
                iconThemeOrId = '';
            }
            const themeId = types.isString(iconThemeOrId) ? iconThemeOrId : iconThemeOrId.id;
            if (themeId !== this.currentProductIconTheme.id || !this.currentProductIconTheme.isLoaded) {
                let newThemeData = this.productIconThemeRegistry.findThemeById(themeId);
                if (!newThemeData && iconThemeOrId instanceof productIconThemeData_1.ProductIconThemeData) {
                    newThemeData = iconThemeOrId;
                }
                if (!newThemeData) {
                    newThemeData = productIconThemeData_1.ProductIconThemeData.defaultTheme;
                }
                await newThemeData.ensureLoaded(this.extensionResourceLoaderService, this.logService);
                this.applyAndSetProductIconTheme(newThemeData); // updates this.currentProductIconTheme
            }
            const themeData = this.currentProductIconTheme;
            // remember theme data for a quick restore
            if (themeData.isLoaded && settingsTarget !== 'preview' && (!themeData.location || !(0, remoteHosts_1.getRemoteAuthority)(themeData.location))) {
                themeData.toStorage(this.storageService);
            }
            await this.settings.setProductIconTheme(this.currentProductIconTheme, settingsTarget);
            return themeData;
        }
        async getMarketplaceProductIconThemes(publisher, name, version) {
            const extensionLocation = this.extensionResourceLoaderService.getExtensionGalleryResourceURL({ publisher, name, version }, 'extension');
            if (extensionLocation) {
                try {
                    const manifestContent = await this.extensionResourceLoaderService.readExtensionResource(resources.joinPath(extensionLocation, 'package.json'));
                    return this.productIconThemeRegistry.getMarketplaceThemes(JSON.parse(manifestContent), extensionLocation, workbenchThemeService_1.ExtensionData.fromName(publisher, name));
                }
                catch (e) {
                    this.logService.error('Problem loading themes from marketplace', e);
                }
            }
            return [];
        }
        async reloadCurrentProductIconTheme() {
            return this.productIconThemeSequencer.queue(async () => {
                await this.currentProductIconTheme.reload(this.extensionResourceLoaderService, this.logService);
                this.applyAndSetProductIconTheme(this.currentProductIconTheme);
            });
        }
        async restoreProductIconTheme() {
            return this.productIconThemeSequencer.queue(async () => {
                const settingId = this.settings.productIconTheme;
                const theme = this.productIconThemeRegistry.findThemeBySettingsId(settingId);
                if (theme) {
                    if (settingId !== this.currentProductIconTheme.settingsId) {
                        await this.internalSetProductIconTheme(theme.id, undefined);
                    }
                    else if (theme !== this.currentProductIconTheme) {
                        await theme.ensureLoaded(this.extensionResourceLoaderService, this.logService);
                        this.applyAndSetProductIconTheme(theme, true);
                    }
                    return true;
                }
                return false;
            });
        }
        applyAndSetProductIconTheme(iconThemeData, silent = false) {
            this.currentProductIconTheme = iconThemeData;
            _applyRules(iconThemeData.styleSheetContent, productIconThemeRulesClassName);
            this.productIconThemeWatcher.update(iconThemeData);
            if (iconThemeData.id) {
                this.sendTelemetry(iconThemeData.id, iconThemeData.extensionData, 'productIcon');
            }
            if (!silent) {
                this.onProductIconThemeChange.fire(this.currentProductIconTheme);
            }
        }
    };
    WorkbenchThemeService = __decorate([
        __param(0, extensions_1.IExtensionService),
        __param(1, storage_1.IStorageService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, telemetry_1.ITelemetryService),
        __param(4, environmentService_1.IBrowserWorkbenchEnvironmentService),
        __param(5, files_1.IFileService),
        __param(6, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(7, layoutService_1.IWorkbenchLayoutService),
        __param(8, log_1.ILogService),
        __param(9, hostColorSchemeService_1.IHostColorSchemeService),
        __param(10, userDataInit_1.IUserDataInitializationService),
        __param(11, language_1.ILanguageService)
    ], WorkbenchThemeService);
    exports.WorkbenchThemeService = WorkbenchThemeService;
    class ThemeFileWatcher {
        constructor(fileService, environmentService, onUpdate) {
            this.fileService = fileService;
            this.environmentService = environmentService;
            this.onUpdate = onUpdate;
        }
        update(theme) {
            if (!resources.isEqual(theme.location, this.watchedLocation)) {
                this.dispose();
                if (theme.location && (theme.watch || this.environmentService.isExtensionDevelopment)) {
                    this.watchedLocation = theme.location;
                    this.watcherDisposable = this.fileService.watch(theme.location);
                    this.fileService.onDidFilesChange(e => {
                        if (this.watchedLocation && e.contains(this.watchedLocation, 0 /* FileChangeType.UPDATED */)) {
                            this.onUpdate();
                        }
                    });
                }
            }
        }
        dispose() {
            this.watcherDisposable = (0, lifecycle_1.dispose)(this.watcherDisposable);
            this.fileChangeListener = (0, lifecycle_1.dispose)(this.fileChangeListener);
            this.watchedLocation = undefined;
        }
    }
    function _applyRules(styleSheetContent, rulesClassName) {
        const themeStyles = document.head.getElementsByClassName(rulesClassName);
        if (themeStyles.length === 0) {
            const elStyle = document.createElement('style');
            elStyle.type = 'text/css';
            elStyle.className = rulesClassName;
            elStyle.textContent = styleSheetContent;
            document.head.appendChild(elStyle);
        }
        else {
            themeStyles[0].textContent = styleSheetContent;
        }
    }
    (0, colorThemeSchema_1.registerColorThemeSchemas)();
    (0, fileIconThemeSchema_1.registerFileIconThemeSchemas)();
    (0, productIconThemeSchema_1.registerProductIconThemeSchemas)();
    (0, extensions_2.registerSingleton)(workbenchThemeService_1.IWorkbenchThemeService, WorkbenchThemeService);
});
//# sourceMappingURL=workbenchThemeService.js.map