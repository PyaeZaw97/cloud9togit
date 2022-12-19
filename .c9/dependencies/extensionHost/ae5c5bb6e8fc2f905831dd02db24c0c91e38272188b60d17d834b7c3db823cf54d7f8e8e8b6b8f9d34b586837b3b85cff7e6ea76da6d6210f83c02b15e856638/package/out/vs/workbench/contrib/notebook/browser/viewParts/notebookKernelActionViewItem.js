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
define(["require", "exports", "vs/base/browser/ui/actionbar/actionViewItems", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/nls", "vs/platform/theme/common/themeService", "vs/workbench/contrib/notebook/browser/notebookIcons", "vs/workbench/contrib/notebook/common/notebookKernelService", "vs/css!./notebookKernelActionViewItem"], function (require, exports, actionViewItems_1, actions_1, lifecycle_1, nls_1, themeService_1, notebookIcons_1, notebookKernelService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NotebooKernelActionViewItem = void 0;
    let NotebooKernelActionViewItem = class NotebooKernelActionViewItem extends actionViewItems_1.ActionViewItem {
        constructor(actualAction, _editor, _notebookKernelService) {
            super(undefined, new actions_1.Action('fakeAction', undefined, themeService_1.ThemeIcon.asClassName(notebookIcons_1.selectKernelIcon), true, (event) => actualAction.run(event)), { label: false, icon: true });
            this._editor = _editor;
            this._notebookKernelService = _notebookKernelService;
            this._register(_editor.onDidChangeModel(this._update, this));
            this._register(_notebookKernelService.onDidChangeNotebookAffinity(this._update, this));
            this._register(_notebookKernelService.onDidChangeSelectedNotebooks(this._update, this));
            this._kernelDisposable = this._register(new lifecycle_1.DisposableStore());
        }
        render(container) {
            this._update();
            super.render(container);
            container.classList.add('kernel-action-view-item');
            this._kernelLabel = document.createElement('a');
            container.appendChild(this._kernelLabel);
            this.updateLabel();
        }
        updateLabel() {
            if (this._kernelLabel) {
                this._kernelLabel.classList.add('kernel-label');
                this._kernelLabel.innerText = this._action.label;
                this._kernelLabel.title = this._action.tooltip;
            }
        }
        _update() {
            const notebook = this._editor.textModel;
            if (!notebook) {
                this._resetAction();
                return;
            }
            const info = this._notebookKernelService.getMatchingKernel(notebook);
            this._updateActionFromKernelInfo(info);
        }
        _updateActionFromKernelInfo(info) {
            var _a, _b, _c;
            this._kernelDisposable.clear();
            this._action.enabled = true;
            const selectedOrSuggested = (_a = info.selected) !== null && _a !== void 0 ? _a : ((info.all.length === 1 && info.suggestions.length === 1 && info.suggestions[0].type === 0 /* NotebookKernelType.Resolved */) ? info.suggestions[0] : undefined);
            if (selectedOrSuggested) {
                // selected or suggested kernel
                this._action.label = selectedOrSuggested.label;
                this._action.tooltip = (_c = (_b = selectedOrSuggested.description) !== null && _b !== void 0 ? _b : selectedOrSuggested.detail) !== null && _c !== void 0 ? _c : '';
                if (!info.selected) {
                    // special UI for selected kernel?
                }
                if (selectedOrSuggested.type === 1 /* NotebookKernelType.Proxy */) {
                    if (selectedOrSuggested.connectionState === 3 /* ProxyKernelState.Initializing */) {
                        this._action.label = (0, nls_1.localize)('initializing', "Initializing...");
                    }
                    else {
                        this._action.label = selectedOrSuggested.label;
                    }
                    this._kernelDisposable.add(selectedOrSuggested.onDidChange(e => {
                        if (e.connectionState) {
                            if (selectedOrSuggested.connectionState === 3 /* ProxyKernelState.Initializing */) {
                                this._action.label = (0, nls_1.localize)('initializing', "Initializing...");
                            }
                            else {
                                this._action.label = selectedOrSuggested.label;
                            }
                        }
                    }));
                }
            }
            else {
                // many kernels or no kernels
                this._action.label = (0, nls_1.localize)('select', "Select Kernel");
                this._action.tooltip = '';
            }
        }
        _resetAction() {
            this._action.enabled = false;
            this._action.label = '';
            this._action.class = '';
        }
    };
    NotebooKernelActionViewItem = __decorate([
        __param(2, notebookKernelService_1.INotebookKernelService)
    ], NotebooKernelActionViewItem);
    exports.NotebooKernelActionViewItem = NotebooKernelActionViewItem;
});
//# sourceMappingURL=notebookKernelActionViewItem.js.map