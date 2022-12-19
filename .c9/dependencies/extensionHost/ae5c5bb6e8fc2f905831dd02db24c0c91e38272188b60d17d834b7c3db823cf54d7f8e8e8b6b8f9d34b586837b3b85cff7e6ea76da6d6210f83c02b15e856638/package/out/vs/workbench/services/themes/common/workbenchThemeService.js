/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/base/common/types"], function (require, exports, instantiation_1, themeService_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExtensionData = exports.ThemeSettings = exports.themeScopeRegex = exports.THEME_SCOPE_WILDCARD = exports.THEME_SCOPE_CLOSE_PAREN = exports.THEME_SCOPE_OPEN_PAREN = exports.VS_HC_LIGHT_THEME = exports.VS_HC_THEME = exports.VS_DARK_THEME = exports.VS_LIGHT_THEME = exports.IWorkbenchThemeService = void 0;
    exports.IWorkbenchThemeService = (0, instantiation_1.refineServiceDecorator)(themeService_1.IThemeService);
    exports.VS_LIGHT_THEME = 'vs';
    exports.VS_DARK_THEME = 'vs-dark';
    exports.VS_HC_THEME = 'hc-black';
    exports.VS_HC_LIGHT_THEME = 'hc-light';
    exports.THEME_SCOPE_OPEN_PAREN = '[';
    exports.THEME_SCOPE_CLOSE_PAREN = ']';
    exports.THEME_SCOPE_WILDCARD = '*';
    exports.themeScopeRegex = /\[(.+?)\]/g;
    var ThemeSettings;
    (function (ThemeSettings) {
        ThemeSettings["COLOR_THEME"] = "workbench.colorTheme";
        ThemeSettings["FILE_ICON_THEME"] = "workbench.iconTheme";
        ThemeSettings["PRODUCT_ICON_THEME"] = "workbench.productIconTheme";
        ThemeSettings["COLOR_CUSTOMIZATIONS"] = "workbench.colorCustomizations";
        ThemeSettings["TOKEN_COLOR_CUSTOMIZATIONS"] = "editor.tokenColorCustomizations";
        ThemeSettings["SEMANTIC_TOKEN_COLOR_CUSTOMIZATIONS"] = "editor.semanticTokenColorCustomizations";
        ThemeSettings["PREFERRED_DARK_THEME"] = "workbench.preferredDarkColorTheme";
        ThemeSettings["PREFERRED_LIGHT_THEME"] = "workbench.preferredLightColorTheme";
        ThemeSettings["PREFERRED_HC_DARK_THEME"] = "workbench.preferredHighContrastColorTheme";
        ThemeSettings["PREFERRED_HC_LIGHT_THEME"] = "workbench.preferredHighContrastLightColorTheme";
        ThemeSettings["DETECT_COLOR_SCHEME"] = "window.autoDetectColorScheme";
        ThemeSettings["DETECT_HC"] = "window.autoDetectHighContrast";
    })(ThemeSettings = exports.ThemeSettings || (exports.ThemeSettings = {}));
    var ExtensionData;
    (function (ExtensionData) {
        function toJSONObject(d) {
            return d && { _extensionId: d.extensionId, _extensionIsBuiltin: d.extensionIsBuiltin, _extensionName: d.extensionName, _extensionPublisher: d.extensionPublisher };
        }
        ExtensionData.toJSONObject = toJSONObject;
        function fromJSONObject(o) {
            if (o && (0, types_1.isString)(o._extensionId) && (0, types_1.isBoolean)(o._extensionIsBuiltin) && (0, types_1.isString)(o._extensionName) && (0, types_1.isString)(o._extensionPublisher)) {
                return { extensionId: o._extensionId, extensionIsBuiltin: o._extensionIsBuiltin, extensionName: o._extensionName, extensionPublisher: o._extensionPublisher };
            }
            return undefined;
        }
        ExtensionData.fromJSONObject = fromJSONObject;
        function fromName(publisher, name, isBuiltin = false) {
            return { extensionPublisher: publisher, extensionId: `${publisher}.${name}`, extensionName: name, extensionIsBuiltin: isBuiltin };
        }
        ExtensionData.fromName = fromName;
    })(ExtensionData = exports.ExtensionData || (exports.ExtensionData = {}));
});
//# sourceMappingURL=workbenchThemeService.js.map