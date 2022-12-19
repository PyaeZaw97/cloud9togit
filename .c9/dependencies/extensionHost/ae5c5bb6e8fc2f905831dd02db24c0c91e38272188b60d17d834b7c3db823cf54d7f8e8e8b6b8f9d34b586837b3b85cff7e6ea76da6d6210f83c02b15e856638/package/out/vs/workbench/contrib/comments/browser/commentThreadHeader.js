/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/actions", "vs/base/common/codicons", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/theme/common/iconRegistry", "vs/platform/theme/common/themeService"], function (require, exports, dom, actionbar_1, actions_1, codicons_1, lifecycle_1, strings, nls, menuEntryActionViewItem_1, iconRegistry_1, themeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentThreadHeader = void 0;
    const collapseIcon = (0, iconRegistry_1.registerIcon)('review-comment-collapse', codicons_1.Codicon.chevronUp, nls.localize('collapseIcon', 'Icon to collapse a review comment.'));
    const COLLAPSE_ACTION_CLASS = 'expand-review-action ' + themeService_1.ThemeIcon.asClassName(collapseIcon);
    class CommentThreadHeader extends lifecycle_1.Disposable {
        constructor(container, _delegate, _commentMenus, _commentThread, _contextKeyService, instantiationService) {
            super();
            this._delegate = _delegate;
            this._commentMenus = _commentMenus;
            this._commentThread = _commentThread;
            this._contextKeyService = _contextKeyService;
            this.instantiationService = instantiationService;
            this._headElement = dom.$('.head');
            container.appendChild(this._headElement);
            this._fillHead();
        }
        _fillHead() {
            let titleElement = dom.append(this._headElement, dom.$('.review-title'));
            this._headingLabel = dom.append(titleElement, dom.$('span.filename'));
            this.createThreadLabel();
            const actionsContainer = dom.append(this._headElement, dom.$('.review-actions'));
            this._actionbarWidget = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: menuEntryActionViewItem_1.createActionViewItem.bind(undefined, this.instantiationService)
            });
            this._register(this._actionbarWidget);
            this._collapseAction = new actions_1.Action('review.expand', nls.localize('label.collapse', "Collapse"), COLLAPSE_ACTION_CLASS, true, () => this._delegate.collapse());
            const menu = this._commentMenus.getCommentThreadTitleActions(this._contextKeyService);
            this.setActionBarActions(menu);
            this._register(menu);
            this._register(menu.onDidChange(e => {
                this.setActionBarActions(menu);
            }));
            this._actionbarWidget.context = this._commentThread;
        }
        setActionBarActions(menu) {
            const groups = menu.getActions({ shouldForwardArgs: true }).reduce((r, [, actions]) => [...r, ...actions], []);
            this._actionbarWidget.clear();
            this._actionbarWidget.push([...groups, this._collapseAction], { label: false, icon: true });
        }
        updateCommentThread(commentThread) {
            this._commentThread = commentThread;
            this._actionbarWidget.context = this._commentThread;
            this.createThreadLabel();
        }
        createThreadLabel() {
            let label;
            label = this._commentThread.label;
            if (label === undefined) {
                if (!(this._commentThread.comments && this._commentThread.comments.length)) {
                    label = nls.localize('startThread', "Start discussion");
                }
            }
            if (label) {
                this._headingLabel.textContent = strings.escape(label);
                this._headingLabel.setAttribute('aria-label', label);
            }
        }
        updateHeight(headHeight) {
            this._headElement.style.height = `${headHeight}px`;
            this._headElement.style.lineHeight = this._headElement.style.height;
        }
    }
    exports.CommentThreadHeader = CommentThreadHeader;
});
//# sourceMappingURL=commentThreadHeader.js.map