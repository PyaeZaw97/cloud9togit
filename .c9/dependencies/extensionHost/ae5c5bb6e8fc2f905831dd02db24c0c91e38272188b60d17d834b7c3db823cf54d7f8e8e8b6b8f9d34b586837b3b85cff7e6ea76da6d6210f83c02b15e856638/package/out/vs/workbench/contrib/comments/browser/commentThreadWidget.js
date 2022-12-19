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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/event", "vs/base/common/lifecycle", "vs/workbench/contrib/comments/browser/commentReply", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/commentThreadBody", "vs/workbench/contrib/comments/browser/commentThreadHeader", "vs/workbench/contrib/comments/common/commentContextKeys", "vs/workbench/contrib/comments/common/commentModel", "vs/platform/theme/common/colorRegistry", "vs/workbench/common/theme", "vs/workbench/contrib/comments/browser/commentColors", "vs/css!./media/review"], function (require, exports, dom, event_1, lifecycle_1, commentReply_1, commentService_1, commentThreadBody_1, commentThreadHeader_1, commentContextKeys_1, commentModel_1, colorRegistry_1, theme_1, commentColors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentThreadWidget = exports.COMMENTEDITOR_DECORATION_KEY = void 0;
    exports.COMMENTEDITOR_DECORATION_KEY = 'commenteditordecoration';
    let CommentThreadWidget = class CommentThreadWidget extends lifecycle_1.Disposable {
        constructor(container, _owner, _parentResourceUri, _contextKeyService, _scopedInstatiationService, _commentThread, _pendingComment, _markdownOptions, _commentOptions, _containerDelegate, commentService) {
            super();
            this.container = container;
            this._owner = _owner;
            this._parentResourceUri = _parentResourceUri;
            this._contextKeyService = _contextKeyService;
            this._scopedInstatiationService = _scopedInstatiationService;
            this._commentThread = _commentThread;
            this._pendingComment = _pendingComment;
            this._markdownOptions = _markdownOptions;
            this._commentOptions = _commentOptions;
            this._containerDelegate = _containerDelegate;
            this.commentService = commentService;
            this._commentThreadDisposables = [];
            this._onDidResize = new event_1.Emitter();
            this.onDidResize = this._onDidResize.event;
            this._threadIsEmpty = commentContextKeys_1.CommentContextKeys.commentThreadIsEmpty.bindTo(this._contextKeyService);
            this._threadIsEmpty.set(!_commentThread.comments || !_commentThread.comments.length);
            this._commentMenus = this.commentService.getCommentMenus(this._owner);
            this._header = new commentThreadHeader_1.CommentThreadHeader(container, {
                collapse: this.collapse.bind(this)
            }, this._commentMenus, this._commentThread, this._contextKeyService, this._scopedInstatiationService);
            this._header.updateCommentThread(this._commentThread);
            const bodyElement = dom.$('.body');
            container.appendChild(bodyElement);
            this._body = this._scopedInstatiationService.createInstance(commentThreadBody_1.CommentThreadBody, this._owner, this._parentResourceUri, bodyElement, this._markdownOptions, this._commentThread, this._scopedInstatiationService, this);
            this._styleElement = dom.createStyleSheet(this.container);
            this._commentThreadContextValue = this._contextKeyService.createKey('commentThread', undefined);
            this._commentThreadContextValue.set(_commentThread.contextValue);
            const commentControllerKey = this._contextKeyService.createKey('commentController', undefined);
            const controller = this.commentService.getCommentController(this._owner);
            if (controller) {
                commentControllerKey.set(controller.contextValue);
            }
            this.currentThreadListeners();
        }
        get commentThread() {
            return this._commentThread;
        }
        updateCurrentThread(hasMouse, hasFocus) {
            if (hasMouse || hasFocus) {
                this.commentService.setCurrentCommentThread(this.commentThread);
            }
            else {
                this.commentService.setCurrentCommentThread(undefined);
            }
        }
        currentThreadListeners() {
            let hasMouse = false;
            let hasFocus = false;
            this._register(dom.addDisposableListener(this.container, dom.EventType.MOUSE_ENTER, (e) => {
                if (e.toElement === this.container) {
                    hasMouse = true;
                    this.updateCurrentThread(hasMouse, hasFocus);
                }
            }, true));
            this._register(dom.addDisposableListener(this.container, dom.EventType.MOUSE_LEAVE, (e) => {
                if (e.fromElement === this.container) {
                    hasMouse = false;
                    this.updateCurrentThread(hasMouse, hasFocus);
                }
            }, true));
            this._register(dom.addDisposableListener(this.container, dom.EventType.FOCUS_IN, () => {
                hasFocus = true;
                this.updateCurrentThread(hasMouse, hasFocus);
            }, true));
            this._register(dom.addDisposableListener(this.container, dom.EventType.FOCUS_OUT, () => {
                hasFocus = false;
                this.updateCurrentThread(hasMouse, hasFocus);
            }, true));
        }
        updateCommentThread(commentThread) {
            var _a;
            if (this._commentThread !== commentThread) {
                this._commentThreadDisposables.forEach(disposable => disposable.dispose());
            }
            this._commentThread = commentThread;
            this._commentThreadDisposables = [];
            this._bindCommentThreadListeners();
            this._body.updateCommentThread(commentThread);
            this._threadIsEmpty.set(!this._body.length);
            this._header.updateCommentThread(commentThread);
            (_a = this._commentReply) === null || _a === void 0 ? void 0 : _a.updateCommentThread(commentThread);
            if (this._commentThread.contextValue) {
                this._commentThreadContextValue.set(this._commentThread.contextValue);
            }
            else {
                this._commentThreadContextValue.reset();
            }
        }
        display(lineHeight) {
            var _a;
            let headHeight = Math.ceil(lineHeight * 1.2);
            this._header.updateHeight(headHeight);
            this._body.display();
            // create comment thread only when it supports reply
            if (this._commentThread.canReply) {
                this._createCommentForm();
            }
            this._register(this._body.onDidResize(dimension => {
                this._refresh(dimension);
            }));
            // If there are no existing comments, place focus on the text area. This must be done after show, which also moves focus.
            // if this._commentThread.comments is undefined, it doesn't finish initialization yet, so we don't focus the editor immediately.
            if (this._commentThread.canReply && this._commentReply) {
                (_a = this._commentReply) === null || _a === void 0 ? void 0 : _a.focusIfNeeded();
            }
            this._bindCommentThreadListeners();
        }
        _refresh(dimension) {
            this._body.layout();
            this._onDidResize.fire(dimension);
        }
        dispose() {
            super.dispose();
            this.updateCurrentThread(false, false);
        }
        _bindCommentThreadListeners() {
            this._commentThreadDisposables.push(this._commentThread.onDidChangeCanReply(() => {
                if (this._commentReply) {
                    this._commentReply.updateCanReply();
                }
                else {
                    if (this._commentThread.canReply) {
                        this._createCommentForm();
                    }
                }
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeComments(async (_) => {
                await this.updateCommentThread(this._commentThread);
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeLabel(_ => {
                this._header.createThreadLabel();
            }));
        }
        _createCommentForm() {
            this._commentReply = this._scopedInstatiationService.createInstance(commentReply_1.CommentReply, this._owner, this._body.container, this._commentThread, this._scopedInstatiationService, this._contextKeyService, this._commentMenus, this._commentOptions, this._pendingComment, this, this._containerDelegate.actionRunner);
            this._register(this._commentReply);
        }
        getCommentCoords(commentUniqueId) {
            return this._body.getCommentCoords(commentUniqueId);
        }
        getPendingComment() {
            if (this._commentReply) {
                return this._commentReply.getPendingComment();
            }
            return null;
        }
        getDimensions() {
            var _a;
            return (_a = this._body) === null || _a === void 0 ? void 0 : _a.getDimensions();
        }
        layout(widthInPixel) {
            var _a;
            this._body.layout();
            if (widthInPixel !== undefined) {
                (_a = this._commentReply) === null || _a === void 0 ? void 0 : _a.layout(widthInPixel);
            }
        }
        focusCommentEditor() {
            var _a;
            (_a = this._commentReply) === null || _a === void 0 ? void 0 : _a.focusCommentEditor();
        }
        focus() {
            this._body.focus();
        }
        async submitComment() {
            var _a;
            const activeComment = this._body.activeComment;
            if (activeComment && !(activeComment instanceof commentModel_1.CommentNode)) {
                (_a = this._commentReply) === null || _a === void 0 ? void 0 : _a.submitComment();
            }
        }
        collapse() {
            this._containerDelegate.collapse();
        }
        applyTheme(theme, fontInfo) {
            var _a, _b, _c, _d;
            const content = [];
            content.push(`.monaco-editor .review-widget > .body { border-top: 1px solid var(${commentColors_1.commentThreadStateColorVar}) }`);
            content.push(`.monaco-editor .review-widget > .head { background-color: var(${commentColors_1.commentThreadStateBackgroundColorVar}) }`);
            const linkColor = theme.getColor(colorRegistry_1.textLinkForeground);
            if (linkColor) {
                content.push(`.review-widget .body .comment-body a { color: ${linkColor} }`);
            }
            const linkActiveColor = theme.getColor(colorRegistry_1.textLinkActiveForeground);
            if (linkActiveColor) {
                content.push(`.review-widget .body .comment-body a:hover, a:active { color: ${linkActiveColor} }`);
            }
            const focusColor = theme.getColor(colorRegistry_1.focusBorder);
            if (focusColor) {
                content.push(`.review-widget .body .comment-body a:focus { outline: 1px solid ${focusColor}; }`);
                content.push(`.review-widget .body .monaco-editor.focused { outline: 1px solid ${focusColor}; }`);
            }
            const blockQuoteBackground = theme.getColor(colorRegistry_1.textBlockQuoteBackground);
            if (blockQuoteBackground) {
                content.push(`.review-widget .body .review-comment blockquote { background: ${blockQuoteBackground}; }`);
            }
            const blockQuoteBOrder = theme.getColor(colorRegistry_1.textBlockQuoteBorder);
            if (blockQuoteBOrder) {
                content.push(`.review-widget .body .review-comment blockquote { border-color: ${blockQuoteBOrder}; }`);
            }
            const border = theme.getColor(theme_1.PANEL_BORDER);
            if (border) {
                content.push(`.review-widget .body .review-comment .review-comment-contents .comment-reactions .action-item a.action-label { border-color: ${border}; }`);
            }
            const hcBorder = theme.getColor(colorRegistry_1.contrastBorder);
            if (hcBorder) {
                content.push(`.review-widget .body .comment-form .review-thread-reply-button { outline-color: ${hcBorder}; }`);
                content.push(`.review-widget .body .monaco-editor { outline: 1px solid ${hcBorder}; }`);
            }
            const errorBorder = theme.getColor(colorRegistry_1.inputValidationErrorBorder);
            if (errorBorder) {
                content.push(`.review-widget .validation-error { border: 1px solid ${errorBorder}; }`);
            }
            const errorBackground = theme.getColor(colorRegistry_1.inputValidationErrorBackground);
            if (errorBackground) {
                content.push(`.review-widget .validation-error { background: ${errorBackground}; }`);
            }
            const errorForeground = theme.getColor(colorRegistry_1.inputValidationErrorForeground);
            if (errorForeground) {
                content.push(`.review-widget .body .comment-form .validation-error { color: ${errorForeground}; }`);
            }
            const fontFamilyVar = '--comment-thread-editor-font-family';
            const fontSizeVar = '--comment-thread-editor-font-size';
            const fontWeightVar = '--comment-thread-editor-font-weight';
            (_a = this.container) === null || _a === void 0 ? void 0 : _a.style.setProperty(fontFamilyVar, fontInfo.fontFamily);
            (_b = this.container) === null || _b === void 0 ? void 0 : _b.style.setProperty(fontSizeVar, `${fontInfo.fontSize}px`);
            (_c = this.container) === null || _c === void 0 ? void 0 : _c.style.setProperty(fontWeightVar, fontInfo.fontWeight);
            content.push(`.review-widget .body code {
			font-family: var(${fontFamilyVar});
			font-weight: var(${fontWeightVar});
		}`);
            this._styleElement.textContent = content.join('\n');
            (_d = this._commentReply) === null || _d === void 0 ? void 0 : _d.setCommentEditorDecorations();
        }
    };
    CommentThreadWidget = __decorate([
        __param(10, commentService_1.ICommentService)
    ], CommentThreadWidget);
    exports.CommentThreadWidget = CommentThreadWidget;
});
//# sourceMappingURL=commentThreadWidget.js.map