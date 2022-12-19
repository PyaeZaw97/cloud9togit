/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/path", "vs/base/common/resources", "vs/base/common/json", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/jsonErrorMessages", "vs/workbench/services/themes/common/themeConfiguration", "vs/workbench/services/themes/common/productIconThemeSchema", "vs/base/common/types", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService"], function (require, exports, nls, Paths, resources, Json, workbenchThemeService_1, jsonErrorMessages_1, themeConfiguration_1, productIconThemeSchema_1, types_1, iconRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProductIconThemeData = exports.DEFAULT_PRODUCT_ICON_THEME_ID = void 0;
    exports.DEFAULT_PRODUCT_ICON_THEME_ID = ''; // TODO
    class ProductIconThemeData {
        constructor(id, label, settingsId) {
            this.iconThemeDocument = { iconDefinitions: new Map() };
            this.id = id;
            this.label = label;
            this.settingsId = settingsId;
            this.isLoaded = false;
        }
        getIcon(iconContribution) {
            return _resolveIconDefinition(iconContribution, this.iconThemeDocument);
        }
        ensureLoaded(fileService, logService) {
            return !this.isLoaded ? this.load(fileService, logService) : Promise.resolve(this.styleSheetContent);
        }
        reload(fileService, logService) {
            return this.load(fileService, logService);
        }
        async load(fileService, logService) {
            const location = this.location;
            if (!location) {
                return Promise.resolve(this.styleSheetContent);
            }
            const warnings = [];
            this.iconThemeDocument = await _loadProductIconThemeDocument(fileService, location, warnings);
            this.isLoaded = true;
            if (warnings.length) {
                logService.error(nls.localize('error.parseicondefs', "Problems processing product icons definitions in {0}:\n{1}", location.toString(), warnings.join('\n')));
            }
            return this.styleSheetContent;
        }
        static fromExtensionTheme(iconTheme, iconThemeLocation, extensionData) {
            const id = extensionData.extensionId + '-' + iconTheme.id;
            const label = iconTheme.label || Paths.basename(iconTheme.path);
            const settingsId = iconTheme.id;
            const themeData = new ProductIconThemeData(id, label, settingsId);
            themeData.description = iconTheme.description;
            themeData.location = iconThemeLocation;
            themeData.extensionData = extensionData;
            themeData.watch = iconTheme._watch;
            themeData.isLoaded = false;
            return themeData;
        }
        static createUnloadedTheme(id) {
            const themeData = new ProductIconThemeData(id, '', '__' + id);
            themeData.isLoaded = false;
            themeData.extensionData = undefined;
            themeData.watch = false;
            return themeData;
        }
        static get defaultTheme() {
            let themeData = ProductIconThemeData._defaultProductIconTheme;
            if (!themeData) {
                themeData = ProductIconThemeData._defaultProductIconTheme = new ProductIconThemeData(exports.DEFAULT_PRODUCT_ICON_THEME_ID, nls.localize('defaultTheme', 'Default'), themeConfiguration_1.DEFAULT_PRODUCT_ICON_THEME_SETTING_VALUE);
                themeData.isLoaded = true;
                themeData.extensionData = undefined;
                themeData.watch = false;
            }
            return themeData;
        }
        static fromStorageData(storageService) {
            const input = storageService.get(ProductIconThemeData.STORAGE_KEY, 0 /* StorageScope.GLOBAL */);
            if (!input) {
                return undefined;
            }
            try {
                let data = JSON.parse(input);
                const theme = new ProductIconThemeData('', '', '');
                for (let key in data) {
                    switch (key) {
                        case 'id':
                        case 'label':
                        case 'description':
                        case 'settingsId':
                        case 'styleSheetContent':
                        case 'watch':
                            theme[key] = data[key];
                            break;
                        case 'location':
                            // ignore, no longer restore
                            break;
                        case 'extensionData':
                            theme.extensionData = workbenchThemeService_1.ExtensionData.fromJSONObject(data.extensionData);
                            break;
                    }
                }
                return theme;
            }
            catch (e) {
                return undefined;
            }
        }
        toStorage(storageService) {
            const data = JSON.stringify({
                id: this.id,
                label: this.label,
                description: this.description,
                settingsId: this.settingsId,
                styleSheetContent: this.styleSheetContent,
                watch: this.watch,
                extensionData: workbenchThemeService_1.ExtensionData.toJSONObject(this.extensionData),
            });
            storageService.store(ProductIconThemeData.STORAGE_KEY, data, 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
    }
    exports.ProductIconThemeData = ProductIconThemeData;
    ProductIconThemeData.STORAGE_KEY = 'productIconThemeData';
    ProductIconThemeData._defaultProductIconTheme = null;
    function _loadProductIconThemeDocument(fileService, location, warnings) {
        return fileService.readExtensionResource(location).then((content) => {
            var _a;
            const parseErrors = [];
            let contentValue = Json.parse(content, parseErrors);
            if (parseErrors.length > 0) {
                return Promise.reject(new Error(nls.localize('error.cannotparseicontheme', "Problems parsing product icons file: {0}", parseErrors.map(e => (0, jsonErrorMessages_1.getParseErrorMessage)(e.error)).join(', '))));
            }
            else if (Json.getNodeType(contentValue) !== 'object') {
                return Promise.reject(new Error(nls.localize('error.invalidformat', "Invalid format for product icons theme file: Object expected.")));
            }
            else if (!contentValue.iconDefinitions || !Array.isArray(contentValue.fonts) || !contentValue.fonts.length) {
                return Promise.reject(new Error(nls.localize('error.missingProperties', "Invalid format for product icons theme file: Must contain iconDefinitions and fonts.")));
            }
            const iconThemeDocumentLocationDirname = resources.dirname(location);
            const sanitizedFonts = new Map();
            for (const font of contentValue.fonts) {
                if ((0, types_1.isString)(font.id) && font.id.match(productIconThemeSchema_1.fontIdRegex)) {
                    const fontId = font.id;
                    let fontWeight = undefined;
                    if ((0, types_1.isString)(font.weight) && font.weight.match(productIconThemeSchema_1.fontWeightRegex)) {
                        fontWeight = font.weight;
                    }
                    else {
                        warnings.push(nls.localize('error.fontWeight', 'Invalid font weight in font \'{0}\'. Ignoring setting.', font.id));
                    }
                    let fontStyle = undefined;
                    if ((0, types_1.isString)(font.style) && font.style.match(productIconThemeSchema_1.fontStyleRegex)) {
                        fontStyle = font.style;
                    }
                    else {
                        warnings.push(nls.localize('error.fontStyle', 'Invalid font style in font \'{0}\'. Ignoring setting.', font.id));
                    }
                    const sanitizedSrc = [];
                    if (Array.isArray(font.src)) {
                        for (const s of font.src) {
                            if ((0, types_1.isString)(s.path) && (0, types_1.isString)(s.format) && s.format.match(productIconThemeSchema_1.fontFormatRegex)) {
                                const iconFontLocation = resources.joinPath(iconThemeDocumentLocationDirname, s.path);
                                sanitizedSrc.push({ location: iconFontLocation, format: s.format });
                            }
                            else {
                                warnings.push(nls.localize('error.fontSrc', 'Invalid font source in font \'{0}\'. Ignoring source.', font.id));
                            }
                        }
                    }
                    if (sanitizedSrc.length) {
                        sanitizedFonts.set(fontId, { weight: fontWeight, style: fontStyle, src: sanitizedSrc });
                    }
                    else {
                        warnings.push(nls.localize('error.noFontSrc', 'No valid font source in font \'{0}\'. Ignoring font definition.', font.id));
                    }
                }
                else {
                    warnings.push(nls.localize('error.fontId', 'Missing or invalid font id \'{0}\'. Skipping font definition.', font.id));
                }
            }
            const iconDefinitions = new Map();
            const primaryFontId = contentValue.fonts[0].id;
            for (const iconId in contentValue.iconDefinitions) {
                const definition = contentValue.iconDefinitions[iconId];
                if ((0, types_1.isString)(definition.fontCharacter)) {
                    const fontId = (_a = definition.fontId) !== null && _a !== void 0 ? _a : primaryFontId;
                    const fontDefinition = sanitizedFonts.get(fontId);
                    if (fontDefinition) {
                        const font = { id: `pi-${fontId}`, definition: fontDefinition };
                        iconDefinitions.set(iconId, { fontCharacter: definition.fontCharacter, font });
                    }
                    else {
                        warnings.push(nls.localize('error.icon.font', 'Skipping icon definition \'{0}\'. Unknown font.', iconId));
                    }
                }
                else {
                    warnings.push(nls.localize('error.icon.fontCharacter', 'Skipping icon definition \'{0}\'. Unknown fontCharacter.', iconId));
                }
            }
            return { iconDefinitions };
        });
    }
    const iconRegistry = (0, iconRegistry_1.getIconRegistry)();
    function _resolveIconDefinition(iconContribution, iconThemeDocument) {
        const iconDefinitions = iconThemeDocument.iconDefinitions;
        let definition = iconDefinitions.get(iconContribution.id);
        let defaults = iconContribution.defaults;
        while (!definition && themeService_1.ThemeIcon.isThemeIcon(defaults)) {
            // look if an inherited icon has a definition
            const ic = iconRegistry.getIcon(defaults.id);
            if (ic) {
                definition = iconDefinitions.get(ic.id);
                defaults = ic.defaults;
            }
            else {
                return undefined;
            }
        }
        if (definition) {
            return definition;
        }
        if (!themeService_1.ThemeIcon.isThemeIcon(defaults)) {
            return defaults;
        }
        return undefined;
    }
});
//# sourceMappingURL=productIconThemeData.js.map