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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/toggle/toggle", "vs/base/browser/ui/widget", "vs/base/common/codicons", "vs/base/common/event", "vs/nls", "vs/platform/history/browser/contextScopedHistoryWidget", "vs/platform/history/browser/historyWidgetKeybindingHint", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService"], function (require, exports, dom, toggle_1, widget_1, codicons_1, event_1, nls, contextScopedHistoryWidget_1, historyWidgetKeybindingHint_1, configuration_1, contextkey_1, keybinding_1, styler_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ExcludePatternInputWidget = exports.IncludePatternInputWidget = exports.PatternInputWidget = void 0;
    let PatternInputWidget = class PatternInputWidget extends widget_1.Widget {
        constructor(parent, contextViewProvider, options = Object.create(null), themeService, contextKeyService, configurationService, keybindingService) {
            var _a;
            super();
            this.contextViewProvider = contextViewProvider;
            this.themeService = themeService;
            this.contextKeyService = contextKeyService;
            this.configurationService = configurationService;
            this.keybindingService = keybindingService;
            this._onSubmit = this._register(new event_1.Emitter());
            this.onSubmit = this._onSubmit.event;
            this._onCancel = this._register(new event_1.Emitter());
            this.onCancel = this._onCancel.event;
            options = Object.assign({
                ariaLabel: nls.localize('defaultLabel', "input")
            }, options);
            this.width = (_a = options.width) !== null && _a !== void 0 ? _a : 100;
            this.render(options);
            parent.appendChild(this.domNode);
        }
        dispose() {
            super.dispose();
            if (this.inputFocusTracker) {
                this.inputFocusTracker.dispose();
            }
        }
        setWidth(newWidth) {
            this.width = newWidth;
            this.domNode.style.width = this.width + 'px';
            this.contextViewProvider.layout();
            this.setInputWidth();
        }
        getValue() {
            return this.inputBox.value;
        }
        setValue(value) {
            if (this.inputBox.value !== value) {
                this.inputBox.value = value;
            }
        }
        select() {
            this.inputBox.select();
        }
        focus() {
            this.inputBox.focus();
        }
        inputHasFocus() {
            return this.inputBox.hasFocus();
        }
        setInputWidth() {
            this.inputBox.width = this.width - this.getSubcontrolsWidth() - 2; // 2 for input box border
        }
        getSubcontrolsWidth() {
            return 0;
        }
        getHistory() {
            return this.inputBox.getHistory();
        }
        clearHistory() {
            this.inputBox.clearHistory();
        }
        clear() {
            this.setValue('');
        }
        onSearchSubmit() {
            this.inputBox.addToHistory();
        }
        showNextTerm() {
            this.inputBox.showNextValue();
        }
        showPreviousTerm() {
            this.inputBox.showPreviousValue();
        }
        style(styles) {
            this.inputBox.style(styles);
        }
        render(options) {
            this.domNode = document.createElement('div');
            this.domNode.style.width = this.width + 'px';
            this.domNode.classList.add('monaco-findInput');
            this.inputBox = new contextScopedHistoryWidget_1.ContextScopedHistoryInputBox(this.domNode, this.contextViewProvider, {
                placeholder: options.placeholder,
                showPlaceholderOnFocus: options.showPlaceholderOnFocus,
                tooltip: options.tooltip,
                ariaLabel: options.ariaLabel,
                validationOptions: {
                    validation: undefined
                },
                history: options.history || [],
                showHistoryHint: () => (0, historyWidgetKeybindingHint_1.showHistoryKeybindingHint)(this.keybindingService)
            }, this.contextKeyService);
            this._register((0, styler_1.attachInputBoxStyler)(this.inputBox, this.themeService));
            this._register(this.inputBox.onDidChange(() => this._onSubmit.fire(true)));
            this.inputFocusTracker = dom.trackFocus(this.inputBox.inputElement);
            this.onkeyup(this.inputBox.inputElement, (keyboardEvent) => this.onInputKeyUp(keyboardEvent));
            const controls = document.createElement('div');
            controls.className = 'controls';
            this.renderSubcontrols(controls);
            this.domNode.appendChild(controls);
            this.setInputWidth();
        }
        renderSubcontrols(_controlsDiv) {
        }
        onInputKeyUp(keyboardEvent) {
            switch (keyboardEvent.keyCode) {
                case 3 /* KeyCode.Enter */:
                    this.onSearchSubmit();
                    this._onSubmit.fire(false);
                    return;
                case 9 /* KeyCode.Escape */:
                    this._onCancel.fire();
                    return;
            }
        }
    };
    PatternInputWidget.OPTION_CHANGE = 'optionChange';
    PatternInputWidget = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, keybinding_1.IKeybindingService)
    ], PatternInputWidget);
    exports.PatternInputWidget = PatternInputWidget;
    let IncludePatternInputWidget = class IncludePatternInputWidget extends PatternInputWidget {
        constructor(parent, contextViewProvider, options = Object.create(null), themeService, contextKeyService, configurationService, keybindingService) {
            super(parent, contextViewProvider, options, themeService, contextKeyService, configurationService, keybindingService);
            this._onChangeSearchInEditorsBoxEmitter = this._register(new event_1.Emitter());
            this.onChangeSearchInEditorsBox = this._onChangeSearchInEditorsBoxEmitter.event;
        }
        dispose() {
            super.dispose();
            this.useSearchInEditorsBox.dispose();
        }
        onlySearchInOpenEditors() {
            return this.useSearchInEditorsBox.checked;
        }
        setOnlySearchInOpenEditors(value) {
            this.useSearchInEditorsBox.checked = value;
            this._onChangeSearchInEditorsBoxEmitter.fire();
        }
        getSubcontrolsWidth() {
            return super.getSubcontrolsWidth() + this.useSearchInEditorsBox.width();
        }
        renderSubcontrols(controlsDiv) {
            this.useSearchInEditorsBox = this._register(new toggle_1.Toggle({
                icon: codicons_1.Codicon.book,
                title: nls.localize('onlySearchInOpenEditors', "Search only in Open Editors"),
                isChecked: false,
            }));
            this._register(this.useSearchInEditorsBox.onChange(viaKeyboard => {
                this._onChangeSearchInEditorsBoxEmitter.fire();
                if (!viaKeyboard) {
                    this.inputBox.focus();
                }
            }));
            this._register((0, styler_1.attachToggleStyler)(this.useSearchInEditorsBox, this.themeService));
            controlsDiv.appendChild(this.useSearchInEditorsBox.domNode);
            super.renderSubcontrols(controlsDiv);
        }
    };
    IncludePatternInputWidget = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, keybinding_1.IKeybindingService)
    ], IncludePatternInputWidget);
    exports.IncludePatternInputWidget = IncludePatternInputWidget;
    let ExcludePatternInputWidget = class ExcludePatternInputWidget extends PatternInputWidget {
        constructor(parent, contextViewProvider, options = Object.create(null), themeService, contextKeyService, configurationService, keybindingService) {
            super(parent, contextViewProvider, options, themeService, contextKeyService, configurationService, keybindingService);
            this._onChangeIgnoreBoxEmitter = this._register(new event_1.Emitter());
            this.onChangeIgnoreBox = this._onChangeIgnoreBoxEmitter.event;
        }
        dispose() {
            super.dispose();
            this.useExcludesAndIgnoreFilesBox.dispose();
        }
        useExcludesAndIgnoreFiles() {
            return this.useExcludesAndIgnoreFilesBox.checked;
        }
        setUseExcludesAndIgnoreFiles(value) {
            this.useExcludesAndIgnoreFilesBox.checked = value;
            this._onChangeIgnoreBoxEmitter.fire();
        }
        getSubcontrolsWidth() {
            return super.getSubcontrolsWidth() + this.useExcludesAndIgnoreFilesBox.width();
        }
        renderSubcontrols(controlsDiv) {
            this.useExcludesAndIgnoreFilesBox = this._register(new toggle_1.Toggle({
                icon: codicons_1.Codicon.exclude,
                actionClassName: 'useExcludesAndIgnoreFiles',
                title: nls.localize('useExcludesAndIgnoreFilesDescription', "Use Exclude Settings and Ignore Files"),
                isChecked: true,
            }));
            this._register(this.useExcludesAndIgnoreFilesBox.onChange(viaKeyboard => {
                this._onChangeIgnoreBoxEmitter.fire();
                if (!viaKeyboard) {
                    this.inputBox.focus();
                }
            }));
            this._register((0, styler_1.attachToggleStyler)(this.useExcludesAndIgnoreFilesBox, this.themeService));
            controlsDiv.appendChild(this.useExcludesAndIgnoreFilesBox.domNode);
            super.renderSubcontrols(controlsDiv);
        }
    };
    ExcludePatternInputWidget = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, keybinding_1.IKeybindingService)
    ], ExcludePatternInputWidget);
    exports.ExcludePatternInputWidget = ExcludePatternInputWidget;
});
//# sourceMappingURL=patternInputWidget.js.map