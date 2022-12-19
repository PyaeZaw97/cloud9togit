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
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/base/browser/markdownRenderer", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/platform/opener/common/opener", "vs/workbench/contrib/comments/common/commentModel", "vs/platform/accessibility/common/accessibility", "vs/platform/keybinding/common/keybinding", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/list/browser/listService", "vs/platform/theme/common/themeService", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/comments/browser/timestamp", "vs/base/common/codicons", "vs/workbench/contrib/comments/browser/commentColors"], function (require, exports, dom, nls, markdownRenderer_1, errors_1, lifecycle_1, opener_1, commentModel_1, accessibility_1, keybinding_1, configuration_1, contextkey_1, listService_1, themeService_1, instantiation_1, timestamp_1, codicons_1, commentColors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentsList = exports.CommentNodeRenderer = exports.ResourceWithCommentsRenderer = exports.CommentsModelVirualDelegate = exports.CommentsAsyncDataSource = exports.COMMENTS_VIEW_TITLE = exports.COMMENTS_VIEW_ID = void 0;
    exports.COMMENTS_VIEW_ID = 'workbench.panel.comments';
    exports.COMMENTS_VIEW_TITLE = 'Comments';
    class CommentsAsyncDataSource {
        hasChildren(element) {
            return (element instanceof commentModel_1.CommentsModel || element instanceof commentModel_1.ResourceWithCommentThreads) && !(element instanceof commentModel_1.CommentNode);
        }
        getChildren(element) {
            if (element instanceof commentModel_1.CommentsModel) {
                return Promise.resolve(element.resourceCommentThreads);
            }
            if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                return Promise.resolve(element.commentThreads);
            }
            return Promise.resolve([]);
        }
    }
    exports.CommentsAsyncDataSource = CommentsAsyncDataSource;
    class CommentsModelVirualDelegate {
        getHeight(element) {
            if ((element instanceof commentModel_1.CommentNode) && element.hasReply()) {
                return 44;
            }
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                return CommentsModelVirualDelegate.RESOURCE_ID;
            }
            if (element instanceof commentModel_1.CommentNode) {
                return CommentsModelVirualDelegate.COMMENT_ID;
            }
            return '';
        }
    }
    exports.CommentsModelVirualDelegate = CommentsModelVirualDelegate;
    CommentsModelVirualDelegate.RESOURCE_ID = 'resource-with-comments';
    CommentsModelVirualDelegate.COMMENT_ID = 'comment-node';
    class ResourceWithCommentsRenderer {
        constructor(labels) {
            this.labels = labels;
            this.templateId = 'resource-with-comments';
        }
        renderTemplate(container) {
            const data = Object.create(null);
            const labelContainer = dom.append(container, dom.$('.resource-container'));
            data.resourceLabel = this.labels.create(labelContainer);
            return data;
        }
        renderElement(node, index, templateData, height) {
            templateData.resourceLabel.setFile(node.element.resource);
        }
        disposeTemplate(templateData) {
            templateData.resourceLabel.dispose();
        }
    }
    exports.ResourceWithCommentsRenderer = ResourceWithCommentsRenderer;
    let CommentNodeRenderer = class CommentNodeRenderer {
        constructor(openerService, configurationService, themeService) {
            this.openerService = openerService;
            this.configurationService = configurationService;
            this.themeService = themeService;
            this.templateId = 'comment-node';
        }
        renderTemplate(container) {
            const data = Object.create(null);
            const threadContainer = dom.append(container, dom.$('.comment-thread-container'));
            const metadataContainer = dom.append(threadContainer, dom.$('.comment-metadata-container'));
            data.threadMetadata = {
                icon: dom.append(metadataContainer, dom.$('.icon')),
                userNames: dom.append(metadataContainer, dom.$('.user')),
                timestamp: new timestamp_1.TimestampWidget(this.configurationService, dom.append(metadataContainer, dom.$('.timestamp-container'))),
                separator: dom.append(metadataContainer, dom.$('.separator')),
                commentPreview: dom.append(metadataContainer, dom.$('.text')),
                range: dom.append(metadataContainer, dom.$('.range'))
            };
            data.threadMetadata.separator.innerText = '\u00b7';
            const snippetContainer = dom.append(threadContainer, dom.$('.comment-snippet-container'));
            data.repliesMetadata = {
                container: snippetContainer,
                icon: dom.append(snippetContainer, dom.$('.icon')),
                count: dom.append(snippetContainer, dom.$('.count')),
                lastReplyDetail: dom.append(snippetContainer, dom.$('.reply-detail')),
                separator: dom.append(snippetContainer, dom.$('.separator')),
                timestamp: new timestamp_1.TimestampWidget(this.configurationService, dom.append(snippetContainer, dom.$('.timestamp-container'))),
            };
            data.repliesMetadata.separator.innerText = '\u00b7';
            data.repliesMetadata.icon.classList.add(...themeService_1.ThemeIcon.asClassNameArray(codicons_1.Codicon.indent));
            data.disposables = [data.threadMetadata.timestamp, data.repliesMetadata.timestamp];
            return data;
        }
        getCountString(commentCount) {
            if (commentCount > 1) {
                return nls.localize('commentsCount', "{0} comments", commentCount);
            }
            else {
                return nls.localize('commentCount', "1 comment");
            }
        }
        getRenderedComment(commentBody, disposables) {
            const renderedComment = (0, markdownRenderer_1.renderMarkdown)(commentBody, {
                inline: true,
                actionHandler: {
                    callback: (content) => {
                        this.openerService.open(content, { allowCommands: commentBody.isTrusted }).catch(errors_1.onUnexpectedError);
                    },
                    disposables: disposables
                }
            });
            const images = renderedComment.element.getElementsByTagName('img');
            for (let i = 0; i < images.length; i++) {
                const image = images[i];
                const textDescription = dom.$('');
                textDescription.textContent = image.alt ? nls.localize('imageWithLabel', "Image: {0}", image.alt) : nls.localize('image', "Image");
                image.parentNode.replaceChild(textDescription, image);
            }
            return renderedComment;
        }
        renderElement(node, index, templateData, height) {
            var _a, _b;
            const commentCount = node.element.replies.length + 1;
            (_a = templateData.threadMetadata.icon) === null || _a === void 0 ? void 0 : _a.classList.add(...themeService_1.ThemeIcon.asClassNameArray((commentCount === 1) ? codicons_1.Codicon.comment : codicons_1.Codicon.commentDiscussion));
            if (node.element.threadState !== undefined) {
                const color = this.getCommentThreadWidgetStateColor(node.element.threadState, this.themeService.getColorTheme());
                templateData.threadMetadata.icon.style.setProperty(commentColors_1.commentViewThreadStateColorVar, `${color}`);
                templateData.threadMetadata.icon.style.color = `var(${commentColors_1.commentViewThreadStateColorVar}`;
            }
            templateData.threadMetadata.userNames.textContent = node.element.comment.userName;
            templateData.threadMetadata.timestamp.setTimestamp(node.element.comment.timestamp ? new Date(node.element.comment.timestamp) : undefined);
            const originalComment = node.element;
            templateData.threadMetadata.commentPreview.innerText = '';
            templateData.threadMetadata.commentPreview.style.height = '22px';
            if (typeof originalComment.comment.body === 'string') {
                templateData.threadMetadata.commentPreview.innerText = originalComment.comment.body;
            }
            else {
                const disposables = new lifecycle_1.DisposableStore();
                templateData.disposables.push(disposables);
                const renderedComment = this.getRenderedComment(originalComment.comment.body, disposables);
                templateData.disposables.push(renderedComment);
                templateData.threadMetadata.commentPreview.appendChild(renderedComment.element);
                templateData.threadMetadata.commentPreview.title = (_b = renderedComment.element.textContent) !== null && _b !== void 0 ? _b : '';
            }
            if (node.element.range.startLineNumber === node.element.range.endLineNumber) {
                templateData.threadMetadata.range.textContent = nls.localize('commentLine', "[Ln {0}]", node.element.range.startLineNumber);
            }
            else {
                templateData.threadMetadata.range.textContent = nls.localize('commentRange', "[Ln {0}-{1}]", node.element.range.startLineNumber, node.element.range.endLineNumber);
            }
            if (!node.element.hasReply()) {
                templateData.repliesMetadata.container.style.display = 'none';
                return;
            }
            templateData.repliesMetadata.container.style.display = '';
            templateData.repliesMetadata.count.textContent = this.getCountString(commentCount);
            const lastComment = node.element.replies[node.element.replies.length - 1].comment;
            templateData.repliesMetadata.lastReplyDetail.textContent = nls.localize('lastReplyFrom', "Last reply from {0}", lastComment.userName);
            templateData.repliesMetadata.timestamp.setTimestamp(lastComment.timestamp ? new Date(lastComment.timestamp) : undefined);
        }
        getCommentThreadWidgetStateColor(state, theme) {
            return (state !== undefined) ? (0, commentColors_1.getCommentThreadStateColor)(state, theme) : undefined;
        }
        disposeTemplate(templateData) {
            templateData.disposables.forEach(disposeable => disposeable.dispose());
        }
    };
    CommentNodeRenderer = __decorate([
        __param(0, opener_1.IOpenerService),
        __param(1, configuration_1.IConfigurationService),
        __param(2, themeService_1.IThemeService)
    ], CommentNodeRenderer);
    exports.CommentNodeRenderer = CommentNodeRenderer;
    let CommentsList = class CommentsList extends listService_1.WorkbenchAsyncDataTree {
        constructor(labels, container, options, contextKeyService, listService, themeService, instantiationService, configurationService, keybindingService, accessibilityService) {
            const delegate = new CommentsModelVirualDelegate();
            const dataSource = new CommentsAsyncDataSource();
            const renderers = [
                instantiationService.createInstance(ResourceWithCommentsRenderer, labels),
                instantiationService.createInstance(CommentNodeRenderer)
            ];
            super('CommentsTree', container, delegate, renderers, dataSource, {
                accessibilityProvider: options.accessibilityProvider,
                identityProvider: {
                    getId: (element) => {
                        if (element instanceof commentModel_1.CommentsModel) {
                            return 'root';
                        }
                        if (element instanceof commentModel_1.ResourceWithCommentThreads) {
                            return `${element.owner}-${element.id}`;
                        }
                        if (element instanceof commentModel_1.CommentNode) {
                            return `${element.owner}-${element.resource.toString()}-${element.threadId}-${element.comment.uniqueIdInThread}` + (element.isRoot ? '-root' : '');
                        }
                        return '';
                    }
                },
                expandOnlyOnTwistieClick: (element) => {
                    if (element instanceof commentModel_1.CommentsModel || element instanceof commentModel_1.ResourceWithCommentThreads) {
                        return false;
                    }
                    return true;
                },
                collapseByDefault: () => {
                    return false;
                },
                overrideStyles: options.overrideStyles
            }, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService);
        }
    };
    CommentsList = __decorate([
        __param(3, contextkey_1.IContextKeyService),
        __param(4, listService_1.IListService),
        __param(5, themeService_1.IThemeService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, accessibility_1.IAccessibilityService)
    ], CommentsList);
    exports.CommentsList = CommentsList;
});
//# sourceMappingURL=commentsTreeViewer.js.map