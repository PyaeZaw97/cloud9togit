/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/theme/common/theme"], function (require, exports, codicons_1, event_1, lifecycle_1, instantiation_1, platform, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Themable = exports.registerThemingParticipant = exports.Extensions = exports.getThemeTypeSelector = exports.FolderThemeIcon = exports.FileThemeIcon = exports.ThemeIcon = exports.themeColorFromId = exports.ThemeColor = exports.IThemeService = void 0;
    exports.IThemeService = (0, instantiation_1.createDecorator)('themeService');
    var ThemeColor;
    (function (ThemeColor) {
        function isThemeColor(obj) {
            return obj && typeof obj === 'object' && typeof obj.id === 'string';
        }
        ThemeColor.isThemeColor = isThemeColor;
    })(ThemeColor = exports.ThemeColor || (exports.ThemeColor = {}));
    function themeColorFromId(id) {
        return { id };
    }
    exports.themeColorFromId = themeColorFromId;
    var ThemeIcon;
    (function (ThemeIcon) {
        function isThemeIcon(obj) {
            return obj && typeof obj === 'object' && typeof obj.id === 'string' && (typeof obj.color === 'undefined' || ThemeColor.isThemeColor(obj.color));
        }
        ThemeIcon.isThemeIcon = isThemeIcon;
        const _regexFromString = new RegExp(`^\\$\\((${codicons_1.CSSIcon.iconNameExpression}(?:${codicons_1.CSSIcon.iconModifierExpression})?)\\)$`);
        function fromString(str) {
            const match = _regexFromString.exec(str);
            if (!match) {
                return undefined;
            }
            let [, name] = match;
            return { id: name };
        }
        ThemeIcon.fromString = fromString;
        function fromId(id) {
            return { id };
        }
        ThemeIcon.fromId = fromId;
        function modify(icon, modifier) {
            let id = icon.id;
            const tildeIndex = id.lastIndexOf('~');
            if (tildeIndex !== -1) {
                id = id.substring(0, tildeIndex);
            }
            if (modifier) {
                id = `${id}~${modifier}`;
            }
            return { id };
        }
        ThemeIcon.modify = modify;
        function getModifier(icon) {
            const tildeIndex = icon.id.lastIndexOf('~');
            if (tildeIndex !== -1) {
                return icon.id.substring(tildeIndex + 1);
            }
            return undefined;
        }
        ThemeIcon.getModifier = getModifier;
        function isEqual(ti1, ti2) {
            var _a, _b;
            return ti1.id === ti2.id && ((_a = ti1.color) === null || _a === void 0 ? void 0 : _a.id) === ((_b = ti2.color) === null || _b === void 0 ? void 0 : _b.id);
        }
        ThemeIcon.isEqual = isEqual;
        function asThemeIcon(codicon, color) {
            return { id: codicon.id, color: color ? themeColorFromId(color) : undefined };
        }
        ThemeIcon.asThemeIcon = asThemeIcon;
        ThemeIcon.asClassNameArray = codicons_1.CSSIcon.asClassNameArray;
        ThemeIcon.asClassName = codicons_1.CSSIcon.asClassName;
        ThemeIcon.asCSSSelector = codicons_1.CSSIcon.asCSSSelector;
    })(ThemeIcon = exports.ThemeIcon || (exports.ThemeIcon = {}));
    exports.FileThemeIcon = codicons_1.Codicon.file;
    exports.FolderThemeIcon = codicons_1.Codicon.folder;
    function getThemeTypeSelector(type) {
        switch (type) {
            case theme_1.ColorScheme.DARK: return 'vs-dark';
            case theme_1.ColorScheme.HIGH_CONTRAST_DARK: return 'hc-black';
            case theme_1.ColorScheme.HIGH_CONTRAST_LIGHT: return 'hc-light';
            default: return 'vs';
        }
    }
    exports.getThemeTypeSelector = getThemeTypeSelector;
    // static theming participant
    exports.Extensions = {
        ThemingContribution: 'base.contributions.theming'
    };
    class ThemingRegistry {
        constructor() {
            this.themingParticipants = [];
            this.themingParticipants = [];
            this.onThemingParticipantAddedEmitter = new event_1.Emitter();
        }
        onColorThemeChange(participant) {
            this.themingParticipants.push(participant);
            this.onThemingParticipantAddedEmitter.fire(participant);
            return (0, lifecycle_1.toDisposable)(() => {
                const idx = this.themingParticipants.indexOf(participant);
                this.themingParticipants.splice(idx, 1);
            });
        }
        get onThemingParticipantAdded() {
            return this.onThemingParticipantAddedEmitter.event;
        }
        getThemingParticipants() {
            return this.themingParticipants;
        }
    }
    let themingRegistry = new ThemingRegistry();
    platform.Registry.add(exports.Extensions.ThemingContribution, themingRegistry);
    function registerThemingParticipant(participant) {
        return themingRegistry.onColorThemeChange(participant);
    }
    exports.registerThemingParticipant = registerThemingParticipant;
    /**
     * Utility base class for all themable components.
     */
    class Themable extends lifecycle_1.Disposable {
        constructor(themeService) {
            super();
            this.themeService = themeService;
            this.theme = themeService.getColorTheme();
            // Hook up to theme changes
            this._register(this.themeService.onDidColorThemeChange(theme => this.onThemeChange(theme)));
        }
        onThemeChange(theme) {
            this.theme = theme;
            this.updateStyles();
        }
        updateStyles() {
            // Subclasses to override
        }
        getColor(id, modify) {
            let color = this.theme.getColor(id);
            if (color && modify) {
                color = modify(color, this.theme);
            }
            return color ? color.toString() : null;
        }
    }
    exports.Themable = Themable;
});
//# sourceMappingURL=themeService.js.map