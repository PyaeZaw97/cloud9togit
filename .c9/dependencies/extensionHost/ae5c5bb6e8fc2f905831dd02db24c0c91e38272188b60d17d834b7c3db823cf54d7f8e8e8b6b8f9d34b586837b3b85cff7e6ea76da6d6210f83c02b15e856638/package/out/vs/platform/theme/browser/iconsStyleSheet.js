/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService"], function (require, exports, dom_1, event_1, iconRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnthemedProductIconTheme = exports.getIconsStyleSheet = void 0;
    function getIconsStyleSheet(themeService) {
        const onDidChangeEmmiter = new event_1.Emitter();
        const iconRegistry = (0, iconRegistry_1.getIconRegistry)();
        iconRegistry.onDidChange(() => onDidChangeEmmiter.fire());
        themeService === null || themeService === void 0 ? void 0 : themeService.onDidProductIconThemeChange(() => onDidChangeEmmiter.fire());
        return {
            onDidChange: onDidChangeEmmiter.event,
            getCSS() {
                const productIconTheme = themeService ? themeService.getProductIconTheme() : new UnthemedProductIconTheme();
                const usedFontIds = {};
                const formatIconRule = (contribution) => {
                    const definition = productIconTheme.getIcon(contribution);
                    if (!definition) {
                        return undefined;
                    }
                    const fontContribution = definition.font;
                    if (fontContribution) {
                        usedFontIds[fontContribution.id] = fontContribution.definition;
                        return `.codicon-${contribution.id}:before { content: '${definition.fontCharacter}'; font-family: ${(0, dom_1.asCSSPropertyValue)(fontContribution.id)}; }`;
                    }
                    // default font (codicon)
                    return `.codicon-${contribution.id}:before { content: '${definition.fontCharacter}'; }`;
                };
                const rules = [];
                for (let contribution of iconRegistry.getIcons()) {
                    const rule = formatIconRule(contribution);
                    if (rule) {
                        rules.push(rule);
                    }
                }
                for (let id in usedFontIds) {
                    const definition = usedFontIds[id];
                    const fontWeight = definition.weight ? `font-weight: ${definition.weight};` : '';
                    const fontStyle = definition.style ? `font-style: ${definition.style};` : '';
                    const src = definition.src.map(l => `${(0, dom_1.asCSSUrl)(l.location)} format('${l.format}')`).join(', ');
                    rules.push(`@font-face { src: ${src}; font-family: ${(0, dom_1.asCSSPropertyValue)(id)};${fontWeight}${fontStyle} font-display: block; }`);
                }
                return rules.join('\n');
            }
        };
    }
    exports.getIconsStyleSheet = getIconsStyleSheet;
    class UnthemedProductIconTheme {
        getIcon(contribution) {
            const iconRegistry = (0, iconRegistry_1.getIconRegistry)();
            let definition = contribution.defaults;
            while (themeService_1.ThemeIcon.isThemeIcon(definition)) {
                const c = iconRegistry.getIcon(definition.id);
                if (!c) {
                    return undefined;
                }
                definition = c.defaults;
            }
            return definition;
        }
    }
    exports.UnthemedProductIconTheme = UnthemedProductIconTheme;
});
//# sourceMappingURL=iconsStyleSheet.js.map