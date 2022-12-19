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
define(["require", "exports", "vs/nls", "vs/base/common/keyCodes", "vs/platform/actions/common/actions", "vs/platform/registry/common/platform", "vs/workbench/common/actions", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/contrib/extensions/common/extensions", "vs/platform/extensionManagement/common/extensionManagement", "vs/platform/theme/common/colorRegistry", "vs/workbench/services/editor/common/editorService", "vs/base/common/color", "vs/platform/theme/common/theme", "vs/workbench/services/themes/common/colorThemeSchema", "vs/base/common/errors", "vs/platform/quickinput/common/quickInput", "vs/workbench/services/themes/browser/productIconThemeData", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/async", "vs/base/common/cancellation", "vs/platform/log/common/log", "vs/platform/progress/common/progress", "vs/base/common/codicons", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService", "vs/base/common/event", "vs/workbench/services/extensionResourceLoader/common/extensionResourceLoader", "vs/platform/instantiation/common/instantiation", "vs/platform/commands/common/commands", "vs/workbench/services/themes/browser/fileIconThemeData"], function (require, exports, nls_1, keyCodes_1, actions_1, platform_1, actions_2, workbenchThemeService_1, extensions_1, extensionManagement_1, colorRegistry_1, editorService_1, color_1, theme_1, colorThemeSchema_1, errors_1, quickInput_1, productIconThemeData_1, panecomposite_1, async_1, cancellation_1, log_1, progress_1, codicons_1, iconRegistry_1, themeService_1, event_1, extensionResourceLoader_1, instantiation_1, commands_1, fileIconThemeData_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.manageExtensionIcon = void 0;
    exports.manageExtensionIcon = (0, iconRegistry_1.registerIcon)('theme-selection-manage-extension', codicons_1.Codicon.gear, (0, nls_1.localize)('manageExtensionIcon', 'Icon for the \'Manage\' action in the theme selection quick pick.'));
    let MarketplaceThemesPicker = class MarketplaceThemesPicker {
        constructor(getMarketplaceColorThemes, marketplaceQuery, extensionGalleryService, extensionManagementService, quickInputService, logService, progressService, paneCompositeService) {
            this.getMarketplaceColorThemes = getMarketplaceColorThemes;
            this.marketplaceQuery = marketplaceQuery;
            this.extensionGalleryService = extensionGalleryService;
            this.extensionManagementService = extensionManagementService;
            this.quickInputService = quickInputService;
            this.logService = logService;
            this.progressService = progressService;
            this.paneCompositeService = paneCompositeService;
            this._marketplaceExtensions = new Set();
            this._marketplaceThemes = [];
            this._searchOngoing = false;
            this._onDidChange = new event_1.Emitter();
            this._queryDelayer = new async_1.ThrottledDelayer(200);
            this._installedExtensions = extensionManagementService.getInstalled().then(installed => {
                const result = new Set();
                for (const ext of installed) {
                    result.add(ext.identifier.id);
                }
                return result;
            });
        }
        get themes() {
            return this._marketplaceThemes;
        }
        get isSearching() {
            return this._searchOngoing;
        }
        get onDidChange() {
            return this._onDidChange.event;
        }
        trigger(value) {
            if (this._tokenSource) {
                this._tokenSource.cancel();
                this._tokenSource = undefined;
            }
            this._queryDelayer.trigger(() => {
                this._tokenSource = new cancellation_1.CancellationTokenSource();
                return this.doSearch(value, this._tokenSource.token);
            });
        }
        async doSearch(value, token) {
            this._searchOngoing = true;
            this._onDidChange.fire();
            try {
                const installedExtensions = await this._installedExtensions;
                const options = { text: `${this.marketplaceQuery} ${value}`, pageSize: 40 };
                const pager = await this.extensionGalleryService.query(options, token);
                for (let i = 0; i < pager.total && i < 1; i++) {
                    if (token.isCancellationRequested) {
                        break;
                    }
                    const nThemes = this._marketplaceThemes.length;
                    const gallery = await pager.getPage(i, token);
                    for (let i = 0; i < gallery.length; i++) {
                        if (token.isCancellationRequested) {
                            break;
                        }
                        const ext = gallery[i];
                        if (!installedExtensions.has(ext.identifier.id) && !this._marketplaceExtensions.has(ext.identifier.id)) {
                            this._marketplaceExtensions.add(ext.identifier.id);
                            const themes = await this.getMarketplaceColorThemes(ext.publisher, ext.name, ext.version);
                            for (const theme of themes) {
                                this._marketplaceThemes.push({ id: theme.id, theme: theme, label: theme.label, description: `${ext.displayName} · ${ext.publisherDisplayName}`, galleryExtension: ext, buttons: [configureButton] });
                            }
                        }
                    }
                    if (nThemes !== this._marketplaceThemes.length) {
                        this._marketplaceThemes.sort((t1, t2) => t1.label.localeCompare(t2.label));
                        this._onDidChange.fire();
                    }
                }
            }
            catch (e) {
                if (!(0, errors_1.isCancellationError)(e)) {
                    this.logService.error(`Error while searching for themes:`, e);
                }
            }
            finally {
                this._searchOngoing = false;
                this._onDidChange.fire();
            }
        }
        openQuickPick(value, currentTheme, selectTheme) {
            let result = undefined;
            return new Promise((s, _) => {
                const quickpick = this.quickInputService.createQuickPick();
                quickpick.items = [];
                quickpick.sortByLabel = false;
                quickpick.matchOnDescription = true;
                quickpick.buttons = [this.quickInputService.backButton];
                quickpick.title = 'Marketplace Themes';
                quickpick.placeholder = (0, nls_1.localize)('themes.selectMarketplaceTheme', "Type to Search More. Select to Install. Up/Down Keys to Preview");
                quickpick.canSelectMany = false;
                quickpick.onDidChangeValue(() => this.trigger(quickpick.value));
                quickpick.onDidAccept(async (_) => {
                    let themeItem = quickpick.selectedItems[0];
                    if (themeItem === null || themeItem === void 0 ? void 0 : themeItem.galleryExtension) {
                        result = 'selected';
                        quickpick.hide();
                        const success = await this.installExtension(themeItem.galleryExtension);
                        if (success) {
                            selectTheme(themeItem.theme, true);
                        }
                    }
                });
                quickpick.onDidTriggerItemButton(e => {
                    var _a, _b;
                    if (isItem(e.item)) {
                        const extensionId = (_b = (_a = e.item.theme) === null || _a === void 0 ? void 0 : _a.extensionData) === null || _b === void 0 ? void 0 : _b.extensionId;
                        if (extensionId) {
                            openExtensionViewlet(this.paneCompositeService, `@id:${extensionId}`);
                        }
                        else {
                            openExtensionViewlet(this.paneCompositeService, `${this.marketplaceQuery} ${quickpick.value}`);
                        }
                    }
                });
                quickpick.onDidChangeActive(themes => { var _a; return selectTheme((_a = themes[0]) === null || _a === void 0 ? void 0 : _a.theme, false); });
                quickpick.onDidHide(() => {
                    if (result === undefined) {
                        selectTheme(currentTheme, true);
                        result = 'cancelled';
                    }
                    quickpick.dispose();
                    s(result);
                });
                quickpick.onDidTriggerButton(e => {
                    if (e === this.quickInputService.backButton) {
                        result = 'back';
                        quickpick.hide();
                    }
                });
                this.onDidChange(() => {
                    var _a;
                    let items = this.themes;
                    if (this.isSearching) {
                        items = items.concat({ label: '$(sync~spin) Searching for themes...', id: undefined, alwaysShow: true });
                    }
                    const activeItemId = (_a = quickpick.activeItems[0]) === null || _a === void 0 ? void 0 : _a.id;
                    const newActiveItem = activeItemId ? items.find(i => isItem(i) && i.id === activeItemId) : undefined;
                    quickpick.items = items;
                    if (newActiveItem) {
                        quickpick.activeItems = [newActiveItem];
                    }
                });
                this.trigger(value);
                quickpick.show();
            });
        }
        async installExtension(galleryExtension) {
            try {
                openExtensionViewlet(this.paneCompositeService, `@id:${galleryExtension.identifier.id}`);
                await this.progressService.withProgress({
                    location: 15 /* ProgressLocation.Notification */,
                    title: (0, nls_1.localize)('installing extensions', "Installing Extension {0}...", galleryExtension.displayName)
                }, async () => {
                    await this.extensionManagementService.installFromGallery(galleryExtension);
                });
                return true;
            }
            catch (e) {
                this.logService.error(`Problem installing extension ${galleryExtension.identifier.id}`, e);
                return false;
            }
        }
        dispose() {
            if (this._tokenSource) {
                this._tokenSource.cancel();
                this._tokenSource = undefined;
            }
            this._queryDelayer.dispose();
            this._marketplaceExtensions.clear();
            this._marketplaceThemes.length = 0;
        }
    };
    MarketplaceThemesPicker = __decorate([
        __param(2, extensionManagement_1.IExtensionGalleryService),
        __param(3, extensionManagement_1.IExtensionManagementService),
        __param(4, quickInput_1.IQuickInputService),
        __param(5, log_1.ILogService),
        __param(6, progress_1.IProgressService),
        __param(7, panecomposite_1.IPaneCompositePartService)
    ], MarketplaceThemesPicker);
    let InstalledThemesPicker = class InstalledThemesPicker {
        constructor(installMessage, browseMessage, placeholderMessage, marketplaceTag, setTheme, getMarketplaceColorThemes, quickInputService, extensionGalleryService, paneCompositeService, extensionResourceLoaderService, instantiationService) {
            this.installMessage = installMessage;
            this.browseMessage = browseMessage;
            this.placeholderMessage = placeholderMessage;
            this.marketplaceTag = marketplaceTag;
            this.setTheme = setTheme;
            this.getMarketplaceColorThemes = getMarketplaceColorThemes;
            this.quickInputService = quickInputService;
            this.extensionGalleryService = extensionGalleryService;
            this.paneCompositeService = paneCompositeService;
            this.extensionResourceLoaderService = extensionResourceLoaderService;
            this.instantiationService = instantiationService;
        }
        async openQuickPick(picks, currentTheme) {
            let marketplaceThemePicker;
            if (this.extensionGalleryService.isEnabled()) {
                if (this.extensionResourceLoaderService.supportsExtensionGalleryResources && this.browseMessage) {
                    marketplaceThemePicker = this.instantiationService.createInstance(MarketplaceThemesPicker, this.getMarketplaceColorThemes.bind(this), this.marketplaceTag);
                    picks = [...configurationEntries(this.browseMessage), ...picks];
                }
                else {
                    picks = [...picks, ...configurationEntries(this.installMessage)];
                }
            }
            let selectThemeTimeout;
            const selectTheme = (theme, applyTheme) => {
                if (selectThemeTimeout) {
                    clearTimeout(selectThemeTimeout);
                }
                selectThemeTimeout = window.setTimeout(() => {
                    selectThemeTimeout = undefined;
                    const newTheme = (theme !== null && theme !== void 0 ? theme : currentTheme);
                    this.setTheme(newTheme, applyTheme ? 'auto' : 'preview').then(undefined, err => {
                        (0, errors_1.onUnexpectedError)(err);
                        this.setTheme(currentTheme, undefined);
                    });
                }, applyTheme ? 0 : 200);
            };
            const pickInstalledThemes = (activeItemId) => {
                return new Promise((s, _) => {
                    let isCompleted = false;
                    const autoFocusIndex = picks.findIndex(p => isItem(p) && p.id === activeItemId);
                    const quickpick = this.quickInputService.createQuickPick();
                    quickpick.items = picks;
                    quickpick.placeholder = this.placeholderMessage;
                    quickpick.activeItems = [picks[autoFocusIndex]];
                    quickpick.canSelectMany = false;
                    quickpick.onDidAccept(async (_) => {
                        isCompleted = true;
                        const theme = quickpick.selectedItems[0];
                        if (!theme || typeof theme.id === 'undefined') { // 'pick in marketplace' entry
                            if (marketplaceThemePicker) {
                                const res = await marketplaceThemePicker.openQuickPick(quickpick.value, currentTheme, selectTheme);
                                if (res === 'back') {
                                    await pickInstalledThemes(undefined);
                                }
                            }
                            else {
                                openExtensionViewlet(this.paneCompositeService, `${this.marketplaceTag} ${quickpick.value}`);
                            }
                        }
                        else {
                            selectTheme(theme.theme, true);
                        }
                        quickpick.hide();
                        s();
                    });
                    quickpick.onDidChangeActive(themes => { var _a; return selectTheme((_a = themes[0]) === null || _a === void 0 ? void 0 : _a.theme, false); });
                    quickpick.onDidHide(() => {
                        if (!isCompleted) {
                            selectTheme(currentTheme, true);
                            s();
                        }
                        quickpick.dispose();
                    });
                    quickpick.onDidTriggerItemButton(e => {
                        var _a, _b;
                        if (isItem(e.item)) {
                            const extensionId = (_b = (_a = e.item.theme) === null || _a === void 0 ? void 0 : _a.extensionData) === null || _b === void 0 ? void 0 : _b.extensionId;
                            if (extensionId) {
                                openExtensionViewlet(this.paneCompositeService, `@id:${extensionId}`);
                            }
                            else {
                                openExtensionViewlet(this.paneCompositeService, `${this.marketplaceTag} ${quickpick.value}`);
                            }
                        }
                    });
                    quickpick.show();
                });
            };
            await pickInstalledThemes(currentTheme.id);
            marketplaceThemePicker === null || marketplaceThemePicker === void 0 ? void 0 : marketplaceThemePicker.dispose();
        }
    };
    InstalledThemesPicker = __decorate([
        __param(6, quickInput_1.IQuickInputService),
        __param(7, extensionManagement_1.IExtensionGalleryService),
        __param(8, panecomposite_1.IPaneCompositePartService),
        __param(9, extensionResourceLoader_1.IExtensionResourceLoaderService),
        __param(10, instantiation_1.IInstantiationService)
    ], InstalledThemesPicker);
    const SelectColorThemeCommandId = 'workbench.action.selectTheme';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SelectColorThemeCommandId,
                title: { value: (0, nls_1.localize)('selectTheme.label', "Color Theme"), original: 'Color Theme' },
                category: actions_2.CATEGORIES.Preferences,
                f1: true,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 50 /* KeyCode.KeyT */)
                }
            });
        }
        async run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const installMessage = (0, nls_1.localize)('installColorThemes', "Install Additional Color Themes...");
            const browseMessage = '$(plus) ' + (0, nls_1.localize)('browseColorThemes', "Browse Additional Color Themes...");
            const placeholderMessage = (0, nls_1.localize)('themes.selectTheme', "Select Color Theme (Up/Down Keys to Preview)");
            const marketplaceTag = 'category:themes';
            const setTheme = (theme, settingsTarget) => themeService.setColorTheme(theme, settingsTarget);
            const getMarketplaceColorThemes = (publisher, name, version) => themeService.getMarketplaceColorThemes(publisher, name, version);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const picker = instantiationService.createInstance(InstalledThemesPicker, installMessage, browseMessage, placeholderMessage, marketplaceTag, setTheme, getMarketplaceColorThemes);
            const themes = await themeService.getColorThemes();
            const currentTheme = themeService.getColorTheme();
            const picks = [
                ...toEntries(themes.filter(t => t.type === theme_1.ColorScheme.LIGHT), (0, nls_1.localize)('themes.category.light', "light themes")),
                ...toEntries(themes.filter(t => t.type === theme_1.ColorScheme.DARK), (0, nls_1.localize)('themes.category.dark', "dark themes")),
                ...toEntries(themes.filter(t => (0, theme_1.isHighContrast)(t.type)), (0, nls_1.localize)('themes.category.hc', "high contrast themes")),
            ];
            await picker.openQuickPick(picks, currentTheme);
        }
    });
    const SelectFileIconThemeCommandId = 'workbench.action.selectIconTheme';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SelectFileIconThemeCommandId,
                title: { value: (0, nls_1.localize)('selectIconTheme.label', "File Icon Theme"), original: 'File Icon Theme' },
                category: actions_2.CATEGORIES.Preferences,
                f1: true
            });
        }
        async run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const installMessage = (0, nls_1.localize)('installIconThemes', "Install Additional File Icon Themes...");
            const placeholderMessage = (0, nls_1.localize)('themes.selectIconTheme', "Select File Icon Theme (Up/Down Keys to Preview)");
            const marketplaceTag = 'tag:icon-theme';
            const setTheme = (theme, settingsTarget) => themeService.setFileIconTheme(theme, settingsTarget);
            const getMarketplaceColorThemes = (publisher, name, version) => themeService.getMarketplaceFileIconThemes(publisher, name, version);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const picker = instantiationService.createInstance(InstalledThemesPicker, installMessage, undefined, placeholderMessage, marketplaceTag, setTheme, getMarketplaceColorThemes);
            const picks = [
                { type: 'separator', label: (0, nls_1.localize)('fileIconThemeCategory', 'file icon themes') },
                { id: '', theme: fileIconThemeData_1.FileIconThemeData.noIconTheme, label: (0, nls_1.localize)('noIconThemeLabel', 'None'), description: (0, nls_1.localize)('noIconThemeDesc', 'Disable File Icons') },
                ...toEntries(await themeService.getFileIconThemes()),
            ];
            await picker.openQuickPick(picks, themeService.getFileIconTheme());
        }
    });
    const SelectProductIconThemeCommandId = 'workbench.action.selectProductIconTheme';
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SelectProductIconThemeCommandId,
                title: { value: (0, nls_1.localize)('selectProductIconTheme.label', "Product Icon Theme"), original: 'Product Icon Theme' },
                category: actions_2.CATEGORIES.Preferences,
                f1: true
            });
        }
        async run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const installMessage = (0, nls_1.localize)('installProductIconThemes', "Install Additional Product Icon Themes...");
            const browseMessage = '$(plus) ' + (0, nls_1.localize)('browseProductIconThemes', "Browse Additional Product Icon Themes...");
            const placeholderMessage = (0, nls_1.localize)('themes.selectProductIconTheme', "Select Product Icon Theme (Up/Down Keys to Preview)");
            const marketplaceTag = 'tag:product-icon-theme';
            const setTheme = (theme, settingsTarget) => themeService.setProductIconTheme(theme, settingsTarget);
            const getMarketplaceColorThemes = (publisher, name, version) => themeService.getMarketplaceProductIconThemes(publisher, name, version);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const picker = instantiationService.createInstance(InstalledThemesPicker, installMessage, browseMessage, placeholderMessage, marketplaceTag, setTheme, getMarketplaceColorThemes);
            const picks = [
                { type: 'separator', label: (0, nls_1.localize)('productIconThemeCategory', 'product icon themes') },
                { id: productIconThemeData_1.DEFAULT_PRODUCT_ICON_THEME_ID, theme: productIconThemeData_1.ProductIconThemeData.defaultTheme, label: (0, nls_1.localize)('defaultProductIconThemeLabel', 'Default') },
                ...toEntries(await themeService.getProductIconThemes()),
            ];
            await picker.openQuickPick(picks, themeService.getProductIconTheme());
        }
    });
    commands_1.CommandsRegistry.registerCommand('workbench.action.previewColorTheme', async function (accessor, extension, themeSettingsId) {
        const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
        const themes = await themeService.getMarketplaceColorThemes(extension.publisher, extension.name, extension.version);
        for (const theme of themes) {
            if (!themeSettingsId || theme.settingsId === themeSettingsId) {
                await themeService.setColorTheme(theme, 'preview');
                return theme.settingsId;
            }
        }
        return undefined;
    });
    function configurationEntries(label) {
        return [
            {
                type: 'separator'
            },
            {
                id: undefined,
                label: label,
                alwaysShow: true,
                buttons: [configureButton]
            }
        ];
    }
    function openExtensionViewlet(paneCompositeService, query) {
        return paneCompositeService.openPaneComposite(extensions_1.VIEWLET_ID, 0 /* ViewContainerLocation.Sidebar */, true).then(viewlet => {
            if (viewlet) {
                (viewlet === null || viewlet === void 0 ? void 0 : viewlet.getViewPaneContainer()).search(query);
                viewlet.focus();
            }
        });
    }
    function isItem(i) {
        return i['type'] !== 'separator';
    }
    function toEntry(theme) {
        const item = { id: theme.id, theme: theme, label: theme.label, description: theme.description };
        if (theme.extensionData) {
            item.buttons = [configureButton];
        }
        return item;
    }
    function toEntries(themes, label) {
        const sorter = (t1, t2) => t1.label.localeCompare(t2.label);
        let entries = themes.map(toEntry).sort(sorter);
        if (entries.length > 0 && label) {
            entries.unshift({ type: 'separator', label });
        }
        return entries;
    }
    const configureButton = {
        iconClass: themeService_1.ThemeIcon.asClassName(exports.manageExtensionIcon),
        tooltip: (0, nls_1.localize)('manage extension', "Manage Extension"),
    };
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'workbench.action.generateColorTheme',
                title: { value: (0, nls_1.localize)('generateColorTheme.label', "Generate Color Theme From Current Settings"), original: 'Generate Color Theme From Current Settings' },
                category: actions_2.CATEGORIES.Developer,
                f1: true
            });
        }
        run(accessor) {
            const themeService = accessor.get(workbenchThemeService_1.IWorkbenchThemeService);
            const theme = themeService.getColorTheme();
            const colors = platform_1.Registry.as(colorRegistry_1.Extensions.ColorContribution).getColors();
            const colorIds = colors.map(c => c.id).sort();
            const resultingColors = {};
            const inherited = [];
            for (const colorId of colorIds) {
                const color = theme.getColor(colorId, false);
                if (color) {
                    resultingColors[colorId] = color_1.Color.Format.CSS.formatHexA(color, true);
                }
                else {
                    inherited.push(colorId);
                }
            }
            const nullDefaults = [];
            for (const id of inherited) {
                const color = theme.getColor(id);
                if (color) {
                    resultingColors['__' + id] = color_1.Color.Format.CSS.formatHexA(color, true);
                }
                else {
                    nullDefaults.push(id);
                }
            }
            for (const id of nullDefaults) {
                resultingColors['__' + id] = null;
            }
            let contents = JSON.stringify({
                '$schema': colorThemeSchema_1.colorThemeSchemaId,
                type: theme.type,
                colors: resultingColors,
                tokenColors: theme.tokenColors.filter(t => !!t.scope)
            }, null, '\t');
            contents = contents.replace(/\"__/g, '//"');
            const editorService = accessor.get(editorService_1.IEditorService);
            return editorService.openEditor({ resource: undefined, contents, languageId: 'jsonc', options: { pinned: true } });
        }
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
        group: '4_themes',
        command: {
            id: SelectColorThemeCommandId,
            title: (0, nls_1.localize)({ key: 'miSelectColorTheme', comment: ['&& denotes a mnemonic'] }, "&&Color Theme")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
        group: '4_themes',
        command: {
            id: SelectFileIconThemeCommandId,
            title: (0, nls_1.localize)({ key: 'miSelectIconTheme', comment: ['&& denotes a mnemonic'] }, "File &&Icon Theme")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.MenubarPreferencesMenu, {
        group: '4_themes',
        command: {
            id: SelectProductIconThemeCommandId,
            title: (0, nls_1.localize)({ key: 'miSelectProductIconTheme', comment: ['&& denotes a mnemonic'] }, "&&Product Icon Theme")
        },
        order: 3
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
        group: '4_themes',
        command: {
            id: SelectColorThemeCommandId,
            title: (0, nls_1.localize)('selectTheme.label', "Color Theme")
        },
        order: 1
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
        group: '4_themes',
        command: {
            id: SelectFileIconThemeCommandId,
            title: (0, nls_1.localize)('themes.selectIconTheme.label', "File Icon Theme")
        },
        order: 2
    });
    actions_1.MenuRegistry.appendMenuItem(actions_1.MenuId.GlobalActivity, {
        group: '4_themes',
        command: {
            id: SelectProductIconThemeCommandId,
            title: (0, nls_1.localize)('themes.selectProductIconTheme.label', "Product Icon Theme")
        },
        order: 3
    });
});
//# sourceMappingURL=themes.contribution.js.map