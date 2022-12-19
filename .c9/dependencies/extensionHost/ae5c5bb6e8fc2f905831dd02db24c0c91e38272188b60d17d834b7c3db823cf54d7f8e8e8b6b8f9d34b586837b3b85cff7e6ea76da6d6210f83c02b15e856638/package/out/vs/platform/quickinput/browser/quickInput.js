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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/parts/quickinput/browser/quickInput", "vs/platform/accessibility/common/accessibility", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/layout/browser/layoutService", "vs/platform/list/browser/listService", "vs/platform/quickinput/browser/quickAccess", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService"], function (require, exports, cancellation_1, quickInput_1, accessibility_1, contextkey_1, instantiation_1, layoutService_1, listService_1, quickAccess_1, colorRegistry_1, styler_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.QuickInputService = void 0;
    let QuickInputService = class QuickInputService extends themeService_1.Themable {
        constructor(instantiationService, contextKeyService, themeService, accessibilityService, layoutService) {
            super(themeService);
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.accessibilityService = accessibilityService;
            this.layoutService = layoutService;
            this.contexts = new Map();
        }
        get backButton() { return this.controller.backButton; }
        get onShow() { return this.controller.onShow; }
        get onHide() { return this.controller.onHide; }
        get controller() {
            if (!this._controller) {
                this._controller = this._register(this.createController());
            }
            return this._controller;
        }
        get quickAccess() {
            if (!this._quickAccess) {
                this._quickAccess = this._register(this.instantiationService.createInstance(quickAccess_1.QuickAccessController));
            }
            return this._quickAccess;
        }
        createController(host = this.layoutService, options) {
            var _a, _b;
            const defaultOptions = {
                idPrefix: 'quickInput_',
                container: host.container,
                ignoreFocusOut: () => false,
                isScreenReaderOptimized: () => this.accessibilityService.isScreenReaderOptimized(),
                backKeybindingLabel: () => undefined,
                setContextKey: (id) => this.setContextKey(id),
                returnFocus: () => host.focus(),
                createList: (user, container, delegate, renderers, options) => this.instantiationService.createInstance(listService_1.WorkbenchList, user, container, delegate, renderers, options),
                styles: this.computeStyles()
            };
            const controller = this._register(new quickInput_1.QuickInputController(Object.assign(Object.assign({}, defaultOptions), options)));
            controller.layout(host.dimension, (_b = (_a = host.offset) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 0);
            // Layout changes
            this._register(host.onDidLayout(dimension => { var _a, _b; return controller.layout(dimension, (_b = (_a = host.offset) === null || _a === void 0 ? void 0 : _a.top) !== null && _b !== void 0 ? _b : 0); }));
            // Context keys
            this._register(controller.onShow(() => this.resetContextKeys()));
            this._register(controller.onHide(() => this.resetContextKeys()));
            return controller;
        }
        setContextKey(id) {
            let key;
            if (id) {
                key = this.contexts.get(id);
                if (!key) {
                    key = new contextkey_1.RawContextKey(id, false)
                        .bindTo(this.contextKeyService);
                    this.contexts.set(id, key);
                }
            }
            if (key && key.get()) {
                return; // already active context
            }
            this.resetContextKeys();
            if (key) {
                key.set(true);
            }
        }
        resetContextKeys() {
            this.contexts.forEach(context => {
                if (context.get()) {
                    context.reset();
                }
            });
        }
        pick(picks, options = {}, token = cancellation_1.CancellationToken.None) {
            return this.controller.pick(picks, options, token);
        }
        input(options = {}, token = cancellation_1.CancellationToken.None) {
            return this.controller.input(options, token);
        }
        createQuickPick() {
            return this.controller.createQuickPick();
        }
        createInputBox() {
            return this.controller.createInputBox();
        }
        focus() {
            this.controller.focus();
        }
        toggle() {
            this.controller.toggle();
        }
        navigate(next, quickNavigate) {
            this.controller.navigate(next, quickNavigate);
        }
        accept(keyMods) {
            return this.controller.accept(keyMods);
        }
        back() {
            return this.controller.back();
        }
        cancel() {
            return this.controller.cancel();
        }
        updateStyles() {
            this.controller.applyStyles(this.computeStyles());
        }
        computeStyles() {
            return {
                widget: Object.assign({}, (0, styler_1.computeStyles)(this.theme, {
                    quickInputBackground: colorRegistry_1.quickInputBackground,
                    quickInputForeground: colorRegistry_1.quickInputForeground,
                    quickInputTitleBackground: colorRegistry_1.quickInputTitleBackground,
                    contrastBorder: colorRegistry_1.contrastBorder,
                    widgetShadow: colorRegistry_1.widgetShadow
                })),
                inputBox: (0, styler_1.computeStyles)(this.theme, {
                    inputForeground: colorRegistry_1.inputForeground,
                    inputBackground: colorRegistry_1.inputBackground,
                    inputBorder: colorRegistry_1.inputBorder,
                    inputValidationInfoBackground: colorRegistry_1.inputValidationInfoBackground,
                    inputValidationInfoForeground: colorRegistry_1.inputValidationInfoForeground,
                    inputValidationInfoBorder: colorRegistry_1.inputValidationInfoBorder,
                    inputValidationWarningBackground: colorRegistry_1.inputValidationWarningBackground,
                    inputValidationWarningForeground: colorRegistry_1.inputValidationWarningForeground,
                    inputValidationWarningBorder: colorRegistry_1.inputValidationWarningBorder,
                    inputValidationErrorBackground: colorRegistry_1.inputValidationErrorBackground,
                    inputValidationErrorForeground: colorRegistry_1.inputValidationErrorForeground,
                    inputValidationErrorBorder: colorRegistry_1.inputValidationErrorBorder
                }),
                countBadge: (0, styler_1.computeStyles)(this.theme, {
                    badgeBackground: colorRegistry_1.badgeBackground,
                    badgeForeground: colorRegistry_1.badgeForeground,
                    badgeBorder: colorRegistry_1.contrastBorder
                }),
                button: (0, styler_1.computeStyles)(this.theme, {
                    buttonForeground: colorRegistry_1.buttonForeground,
                    buttonBackground: colorRegistry_1.buttonBackground,
                    buttonHoverBackground: colorRegistry_1.buttonHoverBackground,
                    buttonBorder: colorRegistry_1.contrastBorder
                }),
                progressBar: (0, styler_1.computeStyles)(this.theme, {
                    progressBarBackground: colorRegistry_1.progressBarBackground
                }),
                keybindingLabel: (0, styler_1.computeStyles)(this.theme, {
                    keybindingLabelBackground: colorRegistry_1.keybindingLabelBackground,
                    keybindingLabelForeground: colorRegistry_1.keybindingLabelForeground,
                    keybindingLabelBorder: colorRegistry_1.keybindingLabelBorder,
                    keybindingLabelBottomBorder: colorRegistry_1.keybindingLabelBottomBorder,
                    keybindingLabelShadow: colorRegistry_1.widgetShadow
                }),
                list: (0, styler_1.computeStyles)(this.theme, {
                    listBackground: colorRegistry_1.quickInputBackground,
                    // Look like focused when inactive.
                    listInactiveFocusForeground: colorRegistry_1.quickInputListFocusForeground,
                    listInactiveSelectionIconForeground: colorRegistry_1.quickInputListFocusIconForeground,
                    listInactiveFocusBackground: colorRegistry_1.quickInputListFocusBackground,
                    listFocusOutline: colorRegistry_1.activeContrastBorder,
                    listInactiveFocusOutline: colorRegistry_1.activeContrastBorder,
                    pickerGroupBorder: colorRegistry_1.pickerGroupBorder,
                    pickerGroupForeground: colorRegistry_1.pickerGroupForeground
                })
            };
        }
    };
    QuickInputService = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, themeService_1.IThemeService),
        __param(3, accessibility_1.IAccessibilityService),
        __param(4, layoutService_1.ILayoutService)
    ], QuickInputService);
    exports.QuickInputService = QuickInputService;
});
//# sourceMappingURL=quickInput.js.map