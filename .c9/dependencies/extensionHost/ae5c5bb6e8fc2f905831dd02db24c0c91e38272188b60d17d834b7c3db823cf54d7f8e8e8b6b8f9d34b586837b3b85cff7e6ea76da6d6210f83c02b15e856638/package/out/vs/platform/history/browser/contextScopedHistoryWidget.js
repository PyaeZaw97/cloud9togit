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
define(["require", "exports", "vs/base/browser/ui/findinput/findInput", "vs/base/browser/ui/findinput/replaceInput", "vs/base/browser/ui/inputbox/inputBox", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybindingsRegistry", "vs/nls"], function (require, exports, findInput_1, replaceInput_1, inputBox_1, contextkey_1, keybindingsRegistry_1, nls_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ContextScopedReplaceInput = exports.ContextScopedFindInput = exports.ContextScopedHistoryInputBox = exports.createAndBindHistoryNavigationWidgetScopedContextKeyService = exports.HistoryNavigationWidgetContext = exports.historyNavigationVisible = void 0;
    exports.historyNavigationVisible = new contextkey_1.RawContextKey('suggestWidgetVisible', false, (0, nls_1.localize)('suggestWidgetVisible', "Whether suggestion are visible"));
    exports.HistoryNavigationWidgetContext = 'historyNavigationWidget';
    const HistoryNavigationForwardsEnablementContext = 'historyNavigationForwardsEnabled';
    const HistoryNavigationBackwardsEnablementContext = 'historyNavigationBackwardsEnabled';
    function bindContextScopedWidget(contextKeyService, widget, contextKey) {
        new contextkey_1.RawContextKey(contextKey, widget).bindTo(contextKeyService);
    }
    function createWidgetScopedContextKeyService(contextKeyService, widget) {
        return contextKeyService.createScoped(widget.target);
    }
    function getContextScopedWidget(contextKeyService, contextKey) {
        return contextKeyService.getContext(document.activeElement).getValue(contextKey);
    }
    function createAndBindHistoryNavigationWidgetScopedContextKeyService(contextKeyService, widget) {
        const scopedContextKeyService = createWidgetScopedContextKeyService(contextKeyService, widget);
        bindContextScopedWidget(scopedContextKeyService, widget, exports.HistoryNavigationWidgetContext);
        const historyNavigationForwardsEnablement = new contextkey_1.RawContextKey(HistoryNavigationForwardsEnablementContext, true).bindTo(scopedContextKeyService);
        const historyNavigationBackwardsEnablement = new contextkey_1.RawContextKey(HistoryNavigationBackwardsEnablementContext, true).bindTo(scopedContextKeyService);
        return {
            scopedContextKeyService,
            historyNavigationForwardsEnablement,
            historyNavigationBackwardsEnablement,
        };
    }
    exports.createAndBindHistoryNavigationWidgetScopedContextKeyService = createAndBindHistoryNavigationWidgetScopedContextKeyService;
    let ContextScopedHistoryInputBox = class ContextScopedHistoryInputBox extends inputBox_1.HistoryInputBox {
        constructor(container, contextViewProvider, options, contextKeyService) {
            super(container, contextViewProvider, options);
            this._register(createAndBindHistoryNavigationWidgetScopedContextKeyService(contextKeyService, { target: this.element, historyNavigator: this }).scopedContextKeyService);
        }
    };
    ContextScopedHistoryInputBox = __decorate([
        __param(3, contextkey_1.IContextKeyService)
    ], ContextScopedHistoryInputBox);
    exports.ContextScopedHistoryInputBox = ContextScopedHistoryInputBox;
    let ContextScopedFindInput = class ContextScopedFindInput extends findInput_1.FindInput {
        constructor(container, contextViewProvider, options, contextKeyService, showFindOptions = false) {
            super(container, contextViewProvider, showFindOptions, options);
            this._register(createAndBindHistoryNavigationWidgetScopedContextKeyService(contextKeyService, { target: this.inputBox.element, historyNavigator: this.inputBox }).scopedContextKeyService);
        }
    };
    ContextScopedFindInput = __decorate([
        __param(3, contextkey_1.IContextKeyService)
    ], ContextScopedFindInput);
    exports.ContextScopedFindInput = ContextScopedFindInput;
    let ContextScopedReplaceInput = class ContextScopedReplaceInput extends replaceInput_1.ReplaceInput {
        constructor(container, contextViewProvider, options, contextKeyService, showReplaceOptions = false) {
            super(container, contextViewProvider, showReplaceOptions, options);
            this._register(createAndBindHistoryNavigationWidgetScopedContextKeyService(contextKeyService, { target: this.inputBox.element, historyNavigator: this.inputBox }).scopedContextKeyService);
        }
    };
    ContextScopedReplaceInput = __decorate([
        __param(3, contextkey_1.IContextKeyService)
    ], ContextScopedReplaceInput);
    exports.ContextScopedReplaceInput = ContextScopedReplaceInput;
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'history.showPrevious',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(exports.HistoryNavigationWidgetContext), contextkey_1.ContextKeyExpr.equals(HistoryNavigationBackwardsEnablementContext, true), exports.historyNavigationVisible.isEqualTo(false)),
        primary: 16 /* KeyCode.UpArrow */,
        secondary: [512 /* KeyMod.Alt */ | 16 /* KeyCode.UpArrow */],
        handler: (accessor) => {
            const widget = getContextScopedWidget(accessor.get(contextkey_1.IContextKeyService), exports.HistoryNavigationWidgetContext);
            if (widget) {
                const historyInputBox = widget.historyNavigator;
                historyInputBox.showPreviousValue();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'history.showNext',
        weight: 200 /* KeybindingWeight.WorkbenchContrib */,
        when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.has(exports.HistoryNavigationWidgetContext), contextkey_1.ContextKeyExpr.equals(HistoryNavigationForwardsEnablementContext, true), exports.historyNavigationVisible.isEqualTo(false)),
        primary: 18 /* KeyCode.DownArrow */,
        secondary: [512 /* KeyMod.Alt */ | 18 /* KeyCode.DownArrow */],
        handler: (accessor) => {
            const widget = getContextScopedWidget(accessor.get(contextkey_1.IContextKeyService), exports.HistoryNavigationWidgetContext);
            if (widget) {
                const historyInputBox = widget.historyNavigator;
                historyInputBox.showNextValue();
            }
        }
    });
});
//# sourceMappingURL=contextScopedHistoryWidget.js.map