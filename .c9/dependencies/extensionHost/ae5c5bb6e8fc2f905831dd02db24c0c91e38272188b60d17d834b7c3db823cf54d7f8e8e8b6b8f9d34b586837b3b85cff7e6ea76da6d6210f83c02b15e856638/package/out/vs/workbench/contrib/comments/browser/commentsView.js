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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/common/resources", "vs/editor/browser/editorBrowser", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/common/commentModel", "vs/workbench/contrib/comments/browser/commentsEditorContribution", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/services/editor/common/editorService", "vs/platform/commands/common/commands", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/labels", "vs/workbench/contrib/comments/browser/commentsTreeViewer", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/views", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/actions/common/actions", "vs/base/common/codicons", "vs/editor/common/model/textModel", "vs/css!./media/panel"], function (require, exports, nls, dom, resources_1, editorBrowser_1, instantiation_1, themeService_1, commentModel_1, commentsEditorContribution_1, commentService_1, editorService_1, commands_1, colorRegistry_1, labels_1, commentsTreeViewer_1, viewPane_1, views_1, configuration_1, contextkey_1, contextView_1, keybinding_1, opener_1, telemetry_1, uriIdentity_1, actions_1, codicons_1, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentsPanel = void 0;
    const CONTEXT_KEY_HAS_COMMENTS = new contextkey_1.RawContextKey('commentsView.hasComments', false);
    let CommentsPanel = class CommentsPanel extends viewPane_1.ViewPane {
        constructor(options, instantiationService, viewDescriptorService, editorService, configurationService, contextKeyService, contextMenuService, keybindingService, openerService, themeService, commentService, telemetryService, uriIdentityService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.editorService = editorService;
            this.commentService = commentService;
            this.uriIdentityService = uriIdentityService;
            this.onDidChangeVisibility = this.onDidChangeBodyVisibility;
            this.hasCommentsContextKey = CONTEXT_KEY_HAS_COMMENTS.bindTo(contextKeyService);
        }
        renderBody(container) {
            super.renderBody(container);
            container.classList.add('comments-panel');
            let domContainer = dom.append(container, dom.$('.comments-panel-container'));
            this.treeContainer = dom.append(domContainer, dom.$('.tree-container'));
            this.treeContainer.classList.add('file-icon-themable-tree', 'show-file-icons');
            this.commentsModel = new commentModel_1.CommentsModel();
            this.createTree();
            this.createMessageBox(domContainer);
            this._register(this.commentService.onDidSetAllCommentThreads(this.onAllCommentsChanged, this));
            this._register(this.commentService.onDidUpdateCommentThreads(this.onCommentsUpdated, this));
            const styleElement = dom.createStyleSheet(container);
            this.applyStyles(styleElement);
            this._register(this.themeService.onDidColorThemeChange(_ => this.applyStyles(styleElement)));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible) {
                    this.refresh();
                }
            }));
            this.renderComments();
        }
        focus() {
            if (this.tree && this.tree.getHTMLElement() === document.activeElement) {
                return;
            }
            if (!this.commentsModel.hasCommentThreads() && this.messageBoxContainer) {
                this.messageBoxContainer.focus();
            }
            else if (this.tree) {
                this.tree.domFocus();
            }
        }
        applyStyles(styleElement) {
            const content = [];
            const theme = this.themeService.getColorTheme();
            const linkColor = theme.getColor(colorRegistry_1.textLinkForeground);
            if (linkColor) {
                content.push(`.comments-panel .comments-panel-container a { color: ${linkColor}; }`);
            }
            const linkActiveColor = theme.getColor(colorRegistry_1.textLinkActiveForeground);
            if (linkActiveColor) {
                content.push(`.comments-panel .comments-panel-container a:hover, a:active { color: ${linkActiveColor}; }`);
            }
            const focusColor = theme.getColor(colorRegistry_1.focusBorder);
            if (focusColor) {
                content.push(`.comments-panel .comments-panel-container a:focus { outline-color: ${focusColor}; }`);
            }
            const codeTextForegroundColor = theme.getColor(colorRegistry_1.textPreformatForeground);
            if (codeTextForegroundColor) {
                content.push(`.comments-panel .comments-panel-container .text code { color: ${codeTextForegroundColor}; }`);
            }
            styleElement.textContent = content.join('\n');
        }
        async renderComments() {
            this.treeContainer.classList.toggle('hidden', !this.commentsModel.hasCommentThreads());
            this.renderMessage();
            await this.tree.setInput(this.commentsModel);
        }
        collapseAll() {
            if (this.tree) {
                this.tree.collapseAll();
                this.tree.setSelection([]);
                this.tree.setFocus([]);
                this.tree.domFocus();
                this.tree.focusFirst();
            }
        }
        get hasRendered() {
            return !!this.tree;
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
        getTitle() {
            return commentsTreeViewer_1.COMMENTS_VIEW_TITLE;
        }
        createMessageBox(parent) {
            this.messageBoxContainer = dom.append(parent, dom.$('.message-box-container'));
            this.messageBoxContainer.setAttribute('tabIndex', '0');
        }
        renderMessage() {
            this.messageBoxContainer.textContent = this.commentsModel.getMessage();
            this.messageBoxContainer.classList.toggle('hidden', this.commentsModel.hasCommentThreads());
        }
        createTree() {
            this.treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, this));
            this.tree = this._register(this.instantiationService.createInstance(commentsTreeViewer_1.CommentsList, this.treeLabels, this.treeContainer, {
                overrideStyles: { listBackground: this.getBackgroundColor() },
                selectionNavigation: true,
                accessibilityProvider: {
                    getAriaLabel(element) {
                        if (element instanceof commentModel_1.CommentsModel) {
                            return nls.localize('rootCommentsLabel', "Comments for current workspace");
                        }
                        if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                            return nls.localize('resourceWithCommentThreadsLabel', "Comments in {0}, full path {1}", (0, resources_1.basename)(element.resource), element.resource.fsPath);
                        }
                        if (element instanceof commentModel_1.CommentNode) {
                            return nls.localize('resourceWithCommentLabel', "Comment from ${0} at line {1} column {2} in {3}, source: {4}", element.comment.userName, element.range.startLineNumber, element.range.startColumn, (0, resources_1.basename)(element.resource), (typeof element.comment.body === 'string') ? element.comment.body : element.comment.body.value);
                        }
                        return '';
                    },
                    getWidgetAriaLabel() {
                        return commentsTreeViewer_1.COMMENTS_VIEW_TITLE;
                    }
                }
            }));
            this._register(this.tree.onDidOpen(e => {
                this.openFile(e.element, e.editorOptions.pinned, e.editorOptions.preserveFocus, e.sideBySide);
            }));
        }
        openFile(element, pinned, preserveFocus, sideBySide) {
            if (!element) {
                return false;
            }
            if (!(element instanceof commentModel_1.ResourceWithCommentThreads || element instanceof commentModel_1.CommentNode)) {
                return false;
            }
            const range = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].range : element.range;
            const activeEditor = this.editorService.activeTextEditorControl;
            // If the active editor is a diff editor where one of the sides has the comment,
            // then we try to reveal the comment in the diff editor.
            let currentActiveResources = (0, editorBrowser_1.isDiffEditor)(activeEditor) ? [activeEditor.getOriginalEditor(), activeEditor.getModifiedEditor()]
                : (activeEditor ? [activeEditor] : []);
            for (const editor of currentActiveResources) {
                const model = editor.getModel();
                if ((model instanceof textModel_1.TextModel) && this.uriIdentityService.extUri.isEqual(element.resource, model.uri)) {
                    const threadToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].threadId : element.threadId;
                    const commentToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].comment.uniqueIdInThread : element.comment.uniqueIdInThread;
                    if (threadToReveal && (0, editorBrowser_1.isCodeEditor)(editor)) {
                        const controller = commentsEditorContribution_1.CommentController.get(editor);
                        controller === null || controller === void 0 ? void 0 : controller.revealCommentThread(threadToReveal, commentToReveal, false);
                    }
                    return true;
                }
            }
            const threadToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].threadId : element.threadId;
            const commentToReveal = element instanceof commentModel_1.ResourceWithCommentThreads ? element.commentThreads[0].comment : element.comment;
            this.editorService.openEditor({
                resource: element.resource,
                options: {
                    pinned: pinned,
                    preserveFocus: preserveFocus,
                    selection: range
                }
            }, sideBySide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP).then(editor => {
                if (editor) {
                    const control = editor.getControl();
                    if (threadToReveal && (0, editorBrowser_1.isCodeEditor)(control)) {
                        const controller = commentsEditorContribution_1.CommentController.get(control);
                        controller === null || controller === void 0 ? void 0 : controller.revealCommentThread(threadToReveal, commentToReveal.uniqueIdInThread, true);
                    }
                }
            });
            return true;
        }
        async refresh() {
            if (this.isVisible()) {
                this.hasCommentsContextKey.set(this.commentsModel.hasCommentThreads());
                this.treeContainer.classList.toggle('hidden', !this.commentsModel.hasCommentThreads());
                this.renderMessage();
                await this.tree.updateChildren();
                if (this.tree.getSelection().length === 0 && this.commentsModel.hasCommentThreads()) {
                    const firstComment = this.commentsModel.resourceCommentThreads[0].commentThreads[0];
                    if (firstComment) {
                        this.tree.setFocus([firstComment]);
                        this.tree.setSelection([firstComment]);
                    }
                }
            }
        }
        onAllCommentsChanged(e) {
            this.commentsModel.setCommentThreads(e.ownerId, e.commentThreads);
            this.refresh();
        }
        onCommentsUpdated(e) {
            const didUpdate = this.commentsModel.updateCommentThreads(e);
            if (didUpdate) {
                this.refresh();
            }
        }
    };
    CommentsPanel = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, editorService_1.IEditorService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, contextView_1.IContextMenuService),
        __param(7, keybinding_1.IKeybindingService),
        __param(8, opener_1.IOpenerService),
        __param(9, themeService_1.IThemeService),
        __param(10, commentService_1.ICommentService),
        __param(11, telemetry_1.ITelemetryService),
        __param(12, uriIdentity_1.IUriIdentityService)
    ], CommentsPanel);
    exports.CommentsPanel = CommentsPanel;
    commands_1.CommandsRegistry.registerCommand({
        id: 'workbench.action.focusCommentsPanel',
        handler: async (accessor) => {
            const viewsService = accessor.get(views_1.IViewsService);
            viewsService.openView(commentsTreeViewer_1.COMMENTS_VIEW_ID, true);
        }
    });
    (0, actions_1.registerAction2)(class Collapse extends viewPane_1.ViewAction {
        constructor() {
            super({
                viewId: commentsTreeViewer_1.COMMENTS_VIEW_ID,
                id: 'comments.collapse',
                title: nls.localize('collapseAll', "Collapse All"),
                f1: false,
                icon: codicons_1.Codicon.collapseAll,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', commentsTreeViewer_1.COMMENTS_VIEW_ID), CONTEXT_KEY_HAS_COMMENTS)
                }
            });
        }
        runInView(_accessor, view) {
            view.collapseAll();
        }
    });
});
//# sourceMappingURL=commentsView.js.map