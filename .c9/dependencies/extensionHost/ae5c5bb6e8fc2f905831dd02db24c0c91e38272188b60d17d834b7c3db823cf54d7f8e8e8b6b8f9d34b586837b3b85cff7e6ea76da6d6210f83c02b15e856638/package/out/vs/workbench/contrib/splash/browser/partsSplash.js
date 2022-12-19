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
define(["require", "exports", "vs/base/browser/browser", "vs/base/browser/dom", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/services/lifecycle/common/lifecycle", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/editor/editor", "vs/workbench/common/theme", "vs/workbench/services/layout/browser/layoutService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/configuration/common/configuration", "vs/base/common/performance", "vs/base/common/types", "vs/base/common/async", "vs/workbench/contrib/splash/browser/splash"], function (require, exports, browser_1, dom_1, color_1, event_1, lifecycle_1, lifecycle_2, colorRegistry_1, themeService_1, editor_1, themes, layoutService_1, environmentService_1, editorGroupsService_1, configuration_1, perf, types_1, async_1, splash_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PartsSplash = void 0;
    let PartsSplash = class PartsSplash {
        constructor(_themeService, _layoutService, _environmentService, lifecycleService, editorGroupsService, configService, _partSplashService) {
            this._themeService = _themeService;
            this._layoutService = _layoutService;
            this._environmentService = _environmentService;
            this._partSplashService = _partSplashService;
            this._disposables = new lifecycle_1.DisposableStore();
            lifecycleService.when(3 /* LifecyclePhase.Restored */).then(_ => {
                this._removePartsSplash();
                perf.mark('code/didRemovePartsSplash');
            });
            const savePartsSplashSoon = new async_1.RunOnceScheduler(() => this._savePartsSplash(), 800);
            event_1.Event.any(browser_1.onDidChangeFullscreen, editorGroupsService.onDidLayout)(() => {
                savePartsSplashSoon.schedule();
            }, undefined, this._disposables);
            configService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('window.titleBarStyle')) {
                    this._didChangeTitleBarStyle = true;
                    this._savePartsSplash();
                }
            }, this, this._disposables);
            _themeService.onDidColorThemeChange(_ => {
                this._savePartsSplash();
            }, this, this._disposables);
        }
        dispose() {
            this._disposables.dispose();
        }
        _savePartsSplash() {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            const theme = this._themeService.getColorTheme();
            this._partSplashService.saveWindowSplash({
                baseTheme: (0, themeService_1.getThemeTypeSelector)(theme.type),
                colorInfo: {
                    foreground: (_a = theme.getColor(colorRegistry_1.foreground)) === null || _a === void 0 ? void 0 : _a.toString(),
                    background: color_1.Color.Format.CSS.formatHex(theme.getColor(colorRegistry_1.editorBackground) || themes.WORKBENCH_BACKGROUND(theme)),
                    editorBackground: (_b = theme.getColor(colorRegistry_1.editorBackground)) === null || _b === void 0 ? void 0 : _b.toString(),
                    titleBarBackground: (_c = theme.getColor(themes.TITLE_BAR_ACTIVE_BACKGROUND)) === null || _c === void 0 ? void 0 : _c.toString(),
                    activityBarBackground: (_d = theme.getColor(themes.ACTIVITY_BAR_BACKGROUND)) === null || _d === void 0 ? void 0 : _d.toString(),
                    sideBarBackground: (_e = theme.getColor(themes.SIDE_BAR_BACKGROUND)) === null || _e === void 0 ? void 0 : _e.toString(),
                    statusBarBackground: (_f = theme.getColor(themes.STATUS_BAR_BACKGROUND)) === null || _f === void 0 ? void 0 : _f.toString(),
                    statusBarNoFolderBackground: (_g = theme.getColor(themes.STATUS_BAR_NO_FOLDER_BACKGROUND)) === null || _g === void 0 ? void 0 : _g.toString(),
                    windowBorder: (_j = (_h = theme.getColor(themes.WINDOW_ACTIVE_BORDER)) === null || _h === void 0 ? void 0 : _h.toString()) !== null && _j !== void 0 ? _j : (_k = theme.getColor(themes.WINDOW_INACTIVE_BORDER)) === null || _k === void 0 ? void 0 : _k.toString()
                },
                layoutInfo: !this._shouldSaveLayoutInfo() ? undefined : {
                    sideBarSide: this._layoutService.getSideBarPosition() === 1 /* Position.RIGHT */ ? 'right' : 'left',
                    editorPartMinWidth: editor_1.DEFAULT_EDITOR_MIN_DIMENSIONS.width,
                    titleBarHeight: this._layoutService.isVisible("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */) ? (0, dom_1.getTotalHeight)((0, types_1.assertIsDefined)(this._layoutService.getContainer("workbench.parts.titlebar" /* Parts.TITLEBAR_PART */))) : 0,
                    activityBarWidth: this._layoutService.isVisible("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */) ? (0, dom_1.getTotalWidth)((0, types_1.assertIsDefined)(this._layoutService.getContainer("workbench.parts.activitybar" /* Parts.ACTIVITYBAR_PART */))) : 0,
                    sideBarWidth: this._layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */) ? (0, dom_1.getTotalWidth)((0, types_1.assertIsDefined)(this._layoutService.getContainer("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */))) : 0,
                    statusBarHeight: this._layoutService.isVisible("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */) ? (0, dom_1.getTotalHeight)((0, types_1.assertIsDefined)(this._layoutService.getContainer("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */))) : 0,
                    windowBorder: this._layoutService.hasWindowBorder(),
                    windowBorderRadius: this._layoutService.getWindowBorderRadius()
                }
            });
        }
        _shouldSaveLayoutInfo() {
            return !(0, browser_1.isFullscreen)() && !this._environmentService.isExtensionDevelopment && !this._didChangeTitleBarStyle;
        }
        _removePartsSplash() {
            const element = document.getElementById(PartsSplash._splashElementId);
            if (element) {
                element.style.display = 'none';
            }
            // remove initial colors
            const defaultStyles = document.head.getElementsByClassName('initialShellColors');
            if (defaultStyles.length) {
                document.head.removeChild(defaultStyles[0]);
            }
        }
    };
    PartsSplash._splashElementId = 'monaco-parts-splash';
    PartsSplash = __decorate([
        __param(0, themeService_1.IThemeService),
        __param(1, layoutService_1.IWorkbenchLayoutService),
        __param(2, environmentService_1.IWorkbenchEnvironmentService),
        __param(3, lifecycle_2.ILifecycleService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, splash_1.ISplashStorageService)
    ], PartsSplash);
    exports.PartsSplash = PartsSplash;
});
//# sourceMappingURL=partsSplash.js.map