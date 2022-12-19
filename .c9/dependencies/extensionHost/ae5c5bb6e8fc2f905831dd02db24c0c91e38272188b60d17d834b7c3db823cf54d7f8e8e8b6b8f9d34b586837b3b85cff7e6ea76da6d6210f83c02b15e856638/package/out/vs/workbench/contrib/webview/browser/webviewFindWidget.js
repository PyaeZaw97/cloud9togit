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
define(["require", "exports", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/workbench/contrib/codeEditor/browser/find/simpleFindWidget", "vs/workbench/contrib/webview/browser/webview"], function (require, exports, contextkey_1, contextView_1, simpleFindWidget_1, webview_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WebviewFindWidget = void 0;
    let WebviewFindWidget = class WebviewFindWidget extends simpleFindWidget_1.SimpleFindWidget {
        constructor(_delegate, contextViewService, contextKeyService) {
            super(contextViewService, contextKeyService, undefined, { showOptionButtons: false, checkImeCompletionState: _delegate.checkImeCompletionState });
            this._delegate = _delegate;
            this._findWidgetFocused = webview_1.KEYBINDING_CONTEXT_WEBVIEW_FIND_WIDGET_FOCUSED.bindTo(contextKeyService);
            this._register(_delegate.hasFindResult(hasResult => {
                this.updateButtons(hasResult);
                this.focusFindBox();
            }));
            this._register(_delegate.onDidStopFind(() => {
                this.updateButtons(false);
            }));
        }
        async _getResultCount(dataChanged) {
            return undefined;
        }
        find(previous) {
            const val = this.inputValue;
            if (val) {
                this._delegate.find(val, previous);
            }
        }
        hide() {
            super.hide();
            this._delegate.stopFind(true);
            this._delegate.focus();
        }
        _onInputChanged() {
            const val = this.inputValue;
            if (val) {
                this._delegate.updateFind(val);
            }
            else {
                this._delegate.stopFind(false);
            }
            return false;
        }
        _onFocusTrackerFocus() {
            this._findWidgetFocused.set(true);
        }
        _onFocusTrackerBlur() {
            this._findWidgetFocused.reset();
        }
        _onFindInputFocusTrackerFocus() { }
        _onFindInputFocusTrackerBlur() { }
        findFirst() { }
    };
    WebviewFindWidget = __decorate([
        __param(1, contextView_1.IContextViewService),
        __param(2, contextkey_1.IContextKeyService)
    ], WebviewFindWidget);
    exports.WebviewFindWidget = WebviewFindWidget;
});
//# sourceMappingURL=webviewFindWidget.js.map