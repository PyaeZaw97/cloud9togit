/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/resources", "vs/workbench/services/extensions/common/extensionsRegistry", "vs/workbench/services/themes/common/workbenchThemeService", "vs/base/common/event"], function (require, exports, nls, types, resources, extensionsRegistry_1, workbenchThemeService_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ThemeRegistry = exports.registerProductIconThemeExtensionPoint = exports.registerFileIconThemeExtensionPoint = exports.registerColorThemeExtensionPoint = void 0;
    function registerColorThemeExtensionPoint() {
        return extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
            extensionPoint: 'themes',
            jsonSchema: {
                description: nls.localize('vscode.extension.contributes.themes', 'Contributes textmate color themes.'),
                type: 'array',
                items: {
                    type: 'object',
                    defaultSnippets: [{ body: { label: '${1:label}', id: '${2:id}', uiTheme: workbenchThemeService_1.VS_DARK_THEME, path: './themes/${3:id}.tmTheme.' } }],
                    properties: {
                        id: {
                            description: nls.localize('vscode.extension.contributes.themes.id', 'Id of the color theme as used in the user settings.'),
                            type: 'string'
                        },
                        label: {
                            description: nls.localize('vscode.extension.contributes.themes.label', 'Label of the color theme as shown in the UI.'),
                            type: 'string'
                        },
                        uiTheme: {
                            description: nls.localize('vscode.extension.contributes.themes.uiTheme', 'Base theme defining the colors around the editor: \'vs\' is the light color theme, \'vs-dark\' is the dark color theme. \'hc-black\' is the dark high contrast theme, \'hc-light\' is the light high contrast theme.'),
                            enum: [workbenchThemeService_1.VS_LIGHT_THEME, workbenchThemeService_1.VS_DARK_THEME, workbenchThemeService_1.VS_HC_THEME, workbenchThemeService_1.VS_HC_LIGHT_THEME]
                        },
                        path: {
                            description: nls.localize('vscode.extension.contributes.themes.path', 'Path of the tmTheme file. The path is relative to the extension folder and is typically \'./colorthemes/awesome-color-theme.json\'.'),
                            type: 'string'
                        }
                    },
                    required: ['path', 'uiTheme']
                }
            }
        });
    }
    exports.registerColorThemeExtensionPoint = registerColorThemeExtensionPoint;
    function registerFileIconThemeExtensionPoint() {
        return extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
            extensionPoint: 'iconThemes',
            jsonSchema: {
                description: nls.localize('vscode.extension.contributes.iconThemes', 'Contributes file icon themes.'),
                type: 'array',
                items: {
                    type: 'object',
                    defaultSnippets: [{ body: { id: '${1:id}', label: '${2:label}', path: './fileicons/${3:id}-icon-theme.json' } }],
                    properties: {
                        id: {
                            description: nls.localize('vscode.extension.contributes.iconThemes.id', 'Id of the file icon theme as used in the user settings.'),
                            type: 'string'
                        },
                        label: {
                            description: nls.localize('vscode.extension.contributes.iconThemes.label', 'Label of the file icon theme as shown in the UI.'),
                            type: 'string'
                        },
                        path: {
                            description: nls.localize('vscode.extension.contributes.iconThemes.path', 'Path of the file icon theme definition file. The path is relative to the extension folder and is typically \'./fileicons/awesome-icon-theme.json\'.'),
                            type: 'string'
                        }
                    },
                    required: ['path', 'id']
                }
            }
        });
    }
    exports.registerFileIconThemeExtensionPoint = registerFileIconThemeExtensionPoint;
    function registerProductIconThemeExtensionPoint() {
        return extensionsRegistry_1.ExtensionsRegistry.registerExtensionPoint({
            extensionPoint: 'productIconThemes',
            jsonSchema: {
                description: nls.localize('vscode.extension.contributes.productIconThemes', 'Contributes product icon themes.'),
                type: 'array',
                items: {
                    type: 'object',
                    defaultSnippets: [{ body: { id: '${1:id}', label: '${2:label}', path: './producticons/${3:id}-product-icon-theme.json' } }],
                    properties: {
                        id: {
                            description: nls.localize('vscode.extension.contributes.productIconThemes.id', 'Id of the product icon theme as used in the user settings.'),
                            type: 'string'
                        },
                        label: {
                            description: nls.localize('vscode.extension.contributes.productIconThemes.label', 'Label of the product icon theme as shown in the UI.'),
                            type: 'string'
                        },
                        path: {
                            description: nls.localize('vscode.extension.contributes.productIconThemes.path', 'Path of the product icon theme definition file. The path is relative to the extension folder and is typically \'./producticons/awesome-product-icon-theme.json\'.'),
                            type: 'string'
                        }
                    },
                    required: ['path', 'id']
                }
            }
        });
    }
    exports.registerProductIconThemeExtensionPoint = registerProductIconThemeExtensionPoint;
    class ThemeRegistry {
        constructor(themesExtPoint, create, idRequired = false, builtInTheme = undefined) {
            this.themesExtPoint = themesExtPoint;
            this.create = create;
            this.idRequired = idRequired;
            this.builtInTheme = builtInTheme;
            this.onDidChangeEmitter = new event_1.Emitter();
            this.onDidChange = this.onDidChangeEmitter.event;
            this.extensionThemes = [];
            this.initialize();
        }
        initialize() {
            this.themesExtPoint.setHandler((extensions, delta) => {
                const previousIds = {};
                const added = [];
                for (const theme of this.extensionThemes) {
                    previousIds[theme.id] = theme;
                }
                this.extensionThemes.length = 0;
                for (const ext of extensions) {
                    const extensionData = workbenchThemeService_1.ExtensionData.fromName(ext.description.publisher, ext.description.name, ext.description.isBuiltin);
                    this.onThemes(extensionData, ext.description.extensionLocation, ext.value, this.extensionThemes, ext.collector);
                }
                for (const theme of this.extensionThemes) {
                    if (!previousIds[theme.id]) {
                        added.push(theme);
                    }
                    else {
                        delete previousIds[theme.id];
                    }
                }
                const removed = Object.values(previousIds);
                this.onDidChangeEmitter.fire({ themes: this.extensionThemes, added, removed });
            });
        }
        onThemes(extensionData, extensionLocation, themeContributions, resultingThemes = [], log) {
            if (!Array.isArray(themeContributions)) {
                log === null || log === void 0 ? void 0 : log.error(nls.localize('reqarray', "Extension point `{0}` must be an array.", this.themesExtPoint.name));
                return resultingThemes;
            }
            themeContributions.forEach(theme => {
                if (!theme.path || !types.isString(theme.path)) {
                    log === null || log === void 0 ? void 0 : log.error(nls.localize('reqpath', "Expected string in `contributes.{0}.path`. Provided value: {1}", this.themesExtPoint.name, String(theme.path)));
                    return;
                }
                if (this.idRequired && (!theme.id || !types.isString(theme.id))) {
                    log === null || log === void 0 ? void 0 : log.error(nls.localize('reqid', "Expected string in `contributes.{0}.id`. Provided value: {1}", this.themesExtPoint.name, String(theme.id)));
                    return;
                }
                const themeLocation = resources.joinPath(extensionLocation, theme.path);
                if (!resources.isEqualOrParent(themeLocation, extensionLocation)) {
                    log === null || log === void 0 ? void 0 : log.warn(nls.localize('invalid.path.1', "Expected `contributes.{0}.path` ({1}) to be included inside extension's folder ({2}). This might make the extension non-portable.", this.themesExtPoint.name, themeLocation.path, extensionLocation.path));
                }
                let themeData = this.create(theme, themeLocation, extensionData);
                resultingThemes.push(themeData);
            });
            return resultingThemes;
        }
        findThemeById(themeId, defaultId) {
            if (this.builtInTheme && this.builtInTheme.id === themeId) {
                return this.builtInTheme;
            }
            const allThemes = this.getThemes();
            let defaultTheme = undefined;
            for (let t of allThemes) {
                if (t.id === themeId) {
                    return t;
                }
                if (t.id === defaultId) {
                    defaultTheme = t;
                }
            }
            return defaultTheme;
        }
        findThemeBySettingsId(settingsId, defaultId) {
            if (this.builtInTheme && this.builtInTheme.settingsId === settingsId) {
                return this.builtInTheme;
            }
            const allThemes = this.getThemes();
            let defaultTheme = undefined;
            for (let t of allThemes) {
                if (t.settingsId === settingsId) {
                    return t;
                }
                if (t.id === defaultId) {
                    defaultTheme = t;
                }
            }
            return defaultTheme;
        }
        findThemeByExtensionLocation(extLocation) {
            if (extLocation) {
                return this.getThemes().filter(t => t.location && resources.isEqualOrParent(t.location, extLocation));
            }
            return [];
        }
        getThemes() {
            return this.extensionThemes;
        }
        getMarketplaceThemes(manifest, extensionLocation, extensionData) {
            var _a;
            const themes = (_a = manifest === null || manifest === void 0 ? void 0 : manifest.contributes) === null || _a === void 0 ? void 0 : _a[this.themesExtPoint.name];
            if (Array.isArray(themes)) {
                return this.onThemes(extensionData, extensionLocation, themes);
            }
            return [];
        }
    }
    exports.ThemeRegistry = ThemeRegistry;
});
//# sourceMappingURL=themeExtensionPoints.js.map