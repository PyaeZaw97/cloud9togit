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
define(["require", "exports", "vs/workbench/contrib/codeEditor/browser/find/simpleFindWidget", "vs/platform/contextview/browser/contextView", "vs/platform/contextkey/common/contextkey", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/common/terminalContextKey", "vs/platform/terminal/common/terminal", "vs/platform/theme/common/themeService", "vs/platform/configuration/common/configuration", "vs/platform/keybinding/common/keybinding"], function (require, exports, simpleFindWidget_1, contextView_1, contextkey_1, terminal_1, terminalContextKey_1, terminal_2, themeService_1, configuration_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalFindWidget = void 0;
    let TerminalFindWidget = class TerminalFindWidget extends simpleFindWidget_1.SimpleFindWidget {
        constructor(findState, _contextViewService, keybindingService, _contextKeyService, _terminalService, _terminalGroupService, _themeService, _configurationService) {
            super(_contextViewService, _contextKeyService, findState, { showOptionButtons: true, showResultCount: true, type: 'Terminal' }, keybindingService);
            this._contextKeyService = _contextKeyService;
            this._terminalService = _terminalService;
            this._terminalGroupService = _terminalGroupService;
            this._themeService = _themeService;
            this._configurationService = _configurationService;
            this._register(findState.onFindReplaceStateChange(() => {
                this.show();
            }));
            this._findInputFocused = terminalContextKey_1.TerminalContextKeys.findInputFocus.bindTo(this._contextKeyService);
            this._findWidgetFocused = terminalContextKey_1.TerminalContextKeys.findFocus.bindTo(this._contextKeyService);
            this._findWidgetVisible = terminalContextKey_1.TerminalContextKeys.findVisible.bindTo(_contextKeyService);
            this._register(this._themeService.onDidColorThemeChange(() => {
                if (this._findWidgetVisible) {
                    this.find(true, true);
                }
            }));
            this._register(this._configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('workbench.colorCustomizations') && this._findWidgetVisible) {
                    this.find(true, true);
                }
            }));
        }
        find(previous, update) {
            var _a, _b;
            const instance = this._terminalService.activeInstance;
            if (!instance) {
                return;
            }
            if (previous) {
                (_a = instance.xterm) === null || _a === void 0 ? void 0 : _a.findPrevious(this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue(), incremental: update });
            }
            else {
                (_b = instance.xterm) === null || _b === void 0 ? void 0 : _b.findNext(this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() });
            }
        }
        reveal(initialInput) {
            var _a;
            const instance = this._terminalService.activeInstance;
            if (instance && this.inputValue && this.inputValue !== '') {
                // trigger highlight all matches
                (_a = instance.xterm) === null || _a === void 0 ? void 0 : _a.findPrevious(this.inputValue, { incremental: true, regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() }).then(foundMatch => {
                    this.updateButtons(foundMatch);
                });
            }
            this.updateButtons(false);
            super.reveal(initialInput);
            this._findWidgetVisible.set(true);
        }
        show(initialInput) {
            super.show(initialInput);
            this._findWidgetVisible.set(true);
        }
        hide() {
            var _a, _b;
            super.hide();
            this._findWidgetVisible.reset();
            const instance = this._terminalService.activeInstance;
            if (instance) {
                instance.focus();
            }
            // Terminals in a group currently share a find widget, so hide
            // all decorations for terminals in this group
            const activeGroup = this._terminalGroupService.activeGroup;
            if ((instance === null || instance === void 0 ? void 0 : instance.target) !== terminal_2.TerminalLocation.Editor && activeGroup) {
                for (const terminal of activeGroup.terminalInstances) {
                    (_a = terminal.xterm) === null || _a === void 0 ? void 0 : _a.clearSearchDecorations();
                }
            }
            else {
                (_b = instance === null || instance === void 0 ? void 0 : instance.xterm) === null || _b === void 0 ? void 0 : _b.clearSearchDecorations();
            }
        }
        async _getResultCount() {
            var _a;
            const instance = this._terminalService.activeInstance;
            if (instance) {
                return (_a = instance.xterm) === null || _a === void 0 ? void 0 : _a.findResult;
            }
            return undefined;
        }
        _onInputChanged() {
            // Ignore input changes for now
            const instance = this._terminalService.activeInstance;
            if (instance === null || instance === void 0 ? void 0 : instance.xterm) {
                instance.xterm.findPrevious(this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue(), incremental: true }).then(foundMatch => {
                    this.updateButtons(foundMatch);
                });
            }
            return false;
        }
        _onFocusTrackerFocus() {
            const instance = this._terminalService.activeInstance;
            if (instance) {
                instance.notifyFindWidgetFocusChanged(true);
            }
            this._findWidgetFocused.set(true);
        }
        _onFocusTrackerBlur() {
            const instance = this._terminalService.activeInstance;
            if (instance) {
                instance.notifyFindWidgetFocusChanged(false);
            }
            this._findWidgetFocused.reset();
        }
        _onFindInputFocusTrackerFocus() {
            this._findInputFocused.set(true);
        }
        _onFindInputFocusTrackerBlur() {
            this._findInputFocused.reset();
        }
        findFirst() {
            var _a;
            const instance = this._terminalService.activeInstance;
            if (instance) {
                if (instance.hasSelection()) {
                    instance.clearSelection();
                }
                (_a = instance.xterm) === null || _a === void 0 ? void 0 : _a.findPrevious(this.inputValue, { regex: this._getRegexValue(), wholeWord: this._getWholeWordValue(), caseSensitive: this._getCaseSensitiveValue() });
            }
        }
    };
    TerminalFindWidget = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextkey_1.IContextKeyService),
        __param(4, terminal_1.ITerminalService),
        __param(5, terminal_1.ITerminalGroupService),
        __param(6, themeService_1.IThemeService),
        __param(7, configuration_1.IConfigurationService)
    ], TerminalFindWidget);
    exports.TerminalFindWidget = TerminalFindWidget;
});
//# sourceMappingURL=terminalFindWidget.js.map