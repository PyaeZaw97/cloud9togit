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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/mouseCursor/mouseCursor", "vs/base/common/lifecycle", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/languages/language", "vs/editor/common/services/model", "vs/nls", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/browser/commentFormActions", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/common/commentContextKeys", "./simpleCommentEditor"], function (require, exports, dom, mouseCursor_1, lifecycle_1, uri_1, uuid_1, language_1, model_1, nls, colorRegistry_1, themeService_1, commentFormActions_1, commentService_1, commentContextKeys_1, simpleCommentEditor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentReply = exports.COMMENTEDITOR_DECORATION_KEY = void 0;
    const COMMENT_SCHEME = 'comment';
    let INMEM_MODEL_ID = 0;
    exports.COMMENTEDITOR_DECORATION_KEY = 'commenteditordecoration';
    let CommentReply = class CommentReply extends lifecycle_1.Disposable {
        constructor(owner, container, _commentThread, _scopedInstatiationService, _contextKeyService, _commentMenus, _commentOptions, _pendingComment, _parentThread, _actionRunDelegate, commentService, languageService, modelService, themeService) {
            super();
            this.owner = owner;
            this._commentThread = _commentThread;
            this._scopedInstatiationService = _scopedInstatiationService;
            this._contextKeyService = _contextKeyService;
            this._commentMenus = _commentMenus;
            this._commentOptions = _commentOptions;
            this._pendingComment = _pendingComment;
            this._parentThread = _parentThread;
            this._actionRunDelegate = _actionRunDelegate;
            this.commentService = commentService;
            this.languageService = languageService;
            this.modelService = modelService;
            this.themeService = themeService;
            this._commentThreadDisposables = [];
            this.form = dom.append(container, dom.$('.comment-form'));
            this.commentEditor = this._register(this._scopedInstatiationService.createInstance(simpleCommentEditor_1.SimpleCommentEditor, this.form, simpleCommentEditor_1.SimpleCommentEditor.getEditorOptions(), this._parentThread));
            this.commentEditorIsEmpty = commentContextKeys_1.CommentContextKeys.commentIsEmpty.bindTo(this._contextKeyService);
            this.commentEditorIsEmpty.set(!this._pendingComment);
            const hasExistingComments = this._commentThread.comments && this._commentThread.comments.length > 0;
            const modeId = (0, uuid_1.generateUuid)() + '-' + (hasExistingComments ? this._commentThread.threadId : ++INMEM_MODEL_ID);
            const params = JSON.stringify({
                extensionId: this._commentThread.extensionId,
                commentThreadId: this._commentThread.threadId
            });
            let resource = uri_1.URI.parse(`${COMMENT_SCHEME}://${this._commentThread.extensionId}/commentinput-${modeId}.md?${params}`); // TODO. Remove params once extensions adopt authority.
            let commentController = this.commentService.getCommentController(owner);
            if (commentController) {
                resource = resource.with({ authority: commentController.id });
            }
            const model = this.modelService.createModel(this._pendingComment || '', this.languageService.createByFilepathOrFirstLine(resource), resource, false);
            this._register(model);
            this.commentEditor.setModel(model);
            this._register((this.commentEditor.getModel().onDidChangeContent(() => {
                var _a;
                this.setCommentEditorDecorations();
                (_a = this.commentEditorIsEmpty) === null || _a === void 0 ? void 0 : _a.set(!this.commentEditor.getValue());
            })));
            this.createTextModelListener(this.commentEditor, this.form);
            this.setCommentEditorDecorations();
            // Only add the additional step of clicking a reply button to expand the textarea when there are existing comments
            if (hasExistingComments) {
                this.createReplyButton(this.commentEditor, this.form);
            }
            else {
                if (this._commentThread.comments && this._commentThread.comments.length === 0) {
                    this.expandReplyArea();
                }
            }
            this._error = dom.append(this.form, dom.$('.validation-error.hidden'));
            this._formActions = dom.append(this.form, dom.$('.form-actions'));
            this.createCommentWidgetActions(this._formActions, model);
        }
        updateCommentThread(commentThread) {
            const isReplying = this.commentEditor.hasTextFocus();
            if (!this._reviewThreadReplyButton) {
                this.createReplyButton(this.commentEditor, this.form);
            }
            if (this._commentThread.comments && this._commentThread.comments.length === 0) {
                this.expandReplyArea();
            }
            if (isReplying) {
                this.commentEditor.focus();
            }
        }
        getPendingComment() {
            let model = this.commentEditor.getModel();
            if (model && model.getValueLength() > 0) { // checking length is cheap
                return model.getValue();
            }
            return null;
        }
        layout(widthInPixel) {
            this.commentEditor.layout({ height: 5 * 18, width: widthInPixel - 54 /* margin 20px * 10 + scrollbar 14px*/ });
        }
        focusIfNeeded() {
            if (!this._commentThread.comments || !this._commentThread.comments.length) {
                this.commentEditor.focus();
            }
            else if (this.commentEditor.getModel().getValueLength() > 0) {
                this.expandReplyArea();
            }
        }
        focusCommentEditor() {
            this.commentEditor.focus();
        }
        getCommentModel() {
            return this.commentEditor.getModel();
        }
        updateCanReply() {
            if (!this._commentThread.canReply) {
                this.form.style.display = 'none';
            }
            else {
                this.form.style.display = 'block';
            }
        }
        async submitComment() {
            if (this._commentFormActions) {
                this._commentFormActions.triggerDefaultAction();
            }
        }
        setCommentEditorDecorations() {
            var _a, _b, _c;
            const model = this.commentEditor.getModel();
            if (model) {
                const valueLength = model.getValueLength();
                const hasExistingComments = this._commentThread.comments && this._commentThread.comments.length > 0;
                const placeholder = valueLength > 0
                    ? ''
                    : hasExistingComments
                        ? (((_a = this._commentOptions) === null || _a === void 0 ? void 0 : _a.placeHolder) || nls.localize('reply', "Reply..."))
                        : (((_b = this._commentOptions) === null || _b === void 0 ? void 0 : _b.placeHolder) || nls.localize('newComment', "Type a new comment"));
                const decorations = [{
                        range: {
                            startLineNumber: 0,
                            endLineNumber: 0,
                            startColumn: 0,
                            endColumn: 1
                        },
                        renderOptions: {
                            after: {
                                contentText: placeholder,
                                color: `${(_c = (0, colorRegistry_1.resolveColorValue)(colorRegistry_1.editorForeground, this.themeService.getColorTheme())) === null || _c === void 0 ? void 0 : _c.transparent(0.4)}`
                            }
                        }
                    }];
                this.commentEditor.setDecorations('review-zone-widget', exports.COMMENTEDITOR_DECORATION_KEY, decorations);
            }
        }
        createTextModelListener(commentEditor, commentForm) {
            this._commentThreadDisposables.push(commentEditor.onDidFocusEditorWidget(() => {
                this._commentThread.input = {
                    uri: commentEditor.getModel().uri,
                    value: commentEditor.getValue()
                };
                this.commentService.setActiveCommentThread(this._commentThread);
            }));
            this._commentThreadDisposables.push(commentEditor.getModel().onDidChangeContent(() => {
                let modelContent = commentEditor.getValue();
                if (this._commentThread.input && this._commentThread.input.uri === commentEditor.getModel().uri && this._commentThread.input.value !== modelContent) {
                    let newInput = this._commentThread.input;
                    newInput.value = modelContent;
                    this._commentThread.input = newInput;
                }
                this.commentService.setActiveCommentThread(this._commentThread);
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeInput(input => {
                let thread = this._commentThread;
                if (thread.input && thread.input.uri !== commentEditor.getModel().uri) {
                    return;
                }
                if (!input) {
                    return;
                }
                if (commentEditor.getValue() !== input.value) {
                    commentEditor.setValue(input.value);
                    if (input.value === '') {
                        this._pendingComment = '';
                        commentForm.classList.remove('expand');
                        commentEditor.getDomNode().style.outline = '';
                        this._error.textContent = '';
                        this._error.classList.add('hidden');
                    }
                }
            }));
        }
        /**
         * Command based actions.
         */
        createCommentWidgetActions(container, model) {
            const menu = this._commentMenus.getCommentThreadActions(this._contextKeyService);
            this._register(menu);
            this._register(menu.onDidChange(() => {
                this._commentFormActions.setActions(menu);
            }));
            this._commentFormActions = new commentFormActions_1.CommentFormActions(container, async (action) => {
                if (this._actionRunDelegate) {
                    this._actionRunDelegate();
                }
                action.run({
                    thread: this._commentThread,
                    text: this.commentEditor.getValue(),
                    $mid: 8 /* MarshalledId.CommentThreadReply */
                });
                this.hideReplyArea();
            }, this.themeService);
            this._commentFormActions.setActions(menu);
        }
        expandReplyArea() {
            if (!this.form.classList.contains('expand')) {
                this.form.classList.add('expand');
                this.commentEditor.focus();
                this.commentEditor.layout();
            }
        }
        hideReplyArea() {
            this.commentEditor.setValue('');
            this.commentEditor.getDomNode().style.outline = '';
            this._pendingComment = '';
            this.form.classList.remove('expand');
            this._error.textContent = '';
            this._error.classList.add('hidden');
        }
        createReplyButton(commentEditor, commentForm) {
            var _a, _b;
            this._reviewThreadReplyButton = dom.append(commentForm, dom.$(`button.review-thread-reply-button.${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`));
            this._reviewThreadReplyButton.title = ((_a = this._commentOptions) === null || _a === void 0 ? void 0 : _a.prompt) || nls.localize('reply', "Reply...");
            this._reviewThreadReplyButton.textContent = ((_b = this._commentOptions) === null || _b === void 0 ? void 0 : _b.prompt) || nls.localize('reply', "Reply...");
            // bind click/escape actions for reviewThreadReplyButton and textArea
            this._register(dom.addDisposableListener(this._reviewThreadReplyButton, 'click', _ => this.expandReplyArea()));
            this._register(dom.addDisposableListener(this._reviewThreadReplyButton, 'focus', _ => this.expandReplyArea()));
            commentEditor.onDidBlurEditorWidget(() => {
                if (commentEditor.getModel().getValueLength() === 0 && commentForm.classList.contains('expand')) {
                    commentForm.classList.remove('expand');
                }
            });
        }
    };
    CommentReply = __decorate([
        __param(10, commentService_1.ICommentService),
        __param(11, language_1.ILanguageService),
        __param(12, model_1.IModelService),
        __param(13, themeService_1.IThemeService)
    ], CommentReply);
    exports.CommentReply = CommentReply;
});
//# sourceMappingURL=commentReply.js.map