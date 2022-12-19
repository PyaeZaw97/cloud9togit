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
define(["require", "exports", "vs/base/browser/dom", "vs/nls", "vs/base/common/lifecycle", "vs/editor/common/languages", "vs/base/common/event", "vs/workbench/contrib/comments/browser/commentService", "vs/base/browser/keyboardEvent", "vs/workbench/contrib/comments/browser/commentNode", "vs/editor/contrib/markdownRenderer/browser/markdownRenderer", "vs/platform/opener/common/opener", "vs/editor/common/languages/language"], function (require, exports, dom, nls, lifecycle_1, languages, event_1, commentService_1, keyboardEvent_1, commentNode_1, markdownRenderer_1, opener_1, language_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommentThreadBody = void 0;
    let CommentThreadBody = class CommentThreadBody extends lifecycle_1.Disposable {
        constructor(owner, parentResourceUri, container, _options, _commentThread, _scopedInstatiationService, _parentCommentThreadWidget, commentService, openerService, languageService) {
            super();
            this.owner = owner;
            this.parentResourceUri = parentResourceUri;
            this.container = container;
            this._options = _options;
            this._commentThread = _commentThread;
            this._scopedInstatiationService = _scopedInstatiationService;
            this._parentCommentThreadWidget = _parentCommentThreadWidget;
            this.commentService = commentService;
            this.openerService = openerService;
            this.languageService = languageService;
            this._commentElements = [];
            this._focusedComment = undefined;
            this._onDidResize = new event_1.Emitter();
            this.onDidResize = this._onDidResize.event;
            this._commentDisposable = new Map();
            this._register(dom.addDisposableListener(container, dom.EventType.FOCUS_IN, e => {
                // TODO @rebornix, limit T to IRange | ICellRange
                this.commentService.setActiveCommentThread(this._commentThread);
            }));
            this._markdownRenderer = this._register(new markdownRenderer_1.MarkdownRenderer(this._options, this.languageService, this.openerService));
        }
        get length() {
            return this._commentThread.comments ? this._commentThread.comments.length : 0;
        }
        get activeComment() {
            return this._commentElements.filter(node => node.isEditing)[0];
        }
        focus() {
            this._commentsElement.focus();
        }
        display() {
            this._commentsElement = dom.append(this.container, dom.$('div.comments-container'));
            this._commentsElement.setAttribute('role', 'presentation');
            this._commentsElement.tabIndex = 0;
            this._updateAriaLabel();
            this._register(dom.addDisposableListener(this._commentsElement, dom.EventType.KEY_DOWN, (e) => {
                let event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(16 /* KeyCode.UpArrow */) || event.equals(18 /* KeyCode.DownArrow */)) {
                    const moveFocusWithinBounds = (change) => {
                        if (this._focusedComment === undefined && change >= 0) {
                            return 0;
                        }
                        if (this._focusedComment === undefined && change < 0) {
                            return this._commentElements.length - 1;
                        }
                        let newIndex = this._focusedComment + change;
                        return Math.min(Math.max(0, newIndex), this._commentElements.length - 1);
                    };
                    this._setFocusedComment(event.equals(16 /* KeyCode.UpArrow */) ? moveFocusWithinBounds(-1) : moveFocusWithinBounds(1));
                }
            }));
            this._commentElements = [];
            if (this._commentThread.comments) {
                for (const comment of this._commentThread.comments) {
                    const newCommentNode = this.createNewCommentNode(comment);
                    this._commentElements.push(newCommentNode);
                    this._commentsElement.appendChild(newCommentNode.domNode);
                    if (comment.mode === languages.CommentMode.Editing) {
                        newCommentNode.switchToEditMode();
                    }
                }
            }
            this._resizeObserver = new MutationObserver(this._refresh.bind(this));
            this._resizeObserver.observe(this.container, {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
            });
        }
        _refresh() {
            let dimensions = dom.getClientArea(this.container);
            this._onDidResize.fire(dimensions);
        }
        getDimensions() {
            return dom.getClientArea(this.container);
        }
        layout() {
            this._commentElements.forEach(element => {
                element.layout();
            });
        }
        getCommentCoords(commentUniqueId) {
            let matchedNode = this._commentElements.filter(commentNode => commentNode.comment.uniqueIdInThread === commentUniqueId);
            if (matchedNode && matchedNode.length) {
                const commentThreadCoords = dom.getDomNodePagePosition(this._commentElements[0].domNode);
                const commentCoords = dom.getDomNodePagePosition(matchedNode[0].domNode);
                return {
                    thread: commentThreadCoords,
                    comment: commentCoords
                };
            }
            return;
        }
        updateCommentThread(commentThread) {
            var _a;
            const oldCommentsLen = this._commentElements.length;
            const newCommentsLen = commentThread.comments ? commentThread.comments.length : 0;
            let commentElementsToDel = [];
            let commentElementsToDelIndex = [];
            for (let i = 0; i < oldCommentsLen; i++) {
                let comment = this._commentElements[i].comment;
                let newComment = commentThread.comments ? commentThread.comments.filter(c => c.uniqueIdInThread === comment.uniqueIdInThread) : [];
                if (newComment.length) {
                    this._commentElements[i].update(newComment[0]);
                }
                else {
                    commentElementsToDelIndex.push(i);
                    commentElementsToDel.push(this._commentElements[i]);
                }
            }
            // del removed elements
            for (let i = commentElementsToDel.length - 1; i >= 0; i--) {
                const commentToDelete = commentElementsToDel[i];
                (_a = this._commentDisposable.get(commentToDelete)) === null || _a === void 0 ? void 0 : _a.dispose();
                this._commentDisposable.delete(commentToDelete);
                this._commentElements.splice(commentElementsToDelIndex[i], 1);
                this._commentsElement.removeChild(commentToDelete.domNode);
            }
            let lastCommentElement = null;
            let newCommentNodeList = [];
            let newCommentsInEditMode = [];
            for (let i = newCommentsLen - 1; i >= 0; i--) {
                let currentComment = commentThread.comments[i];
                let oldCommentNode = this._commentElements.filter(commentNode => commentNode.comment.uniqueIdInThread === currentComment.uniqueIdInThread);
                if (oldCommentNode.length) {
                    lastCommentElement = oldCommentNode[0].domNode;
                    newCommentNodeList.unshift(oldCommentNode[0]);
                }
                else {
                    const newElement = this.createNewCommentNode(currentComment);
                    newCommentNodeList.unshift(newElement);
                    if (lastCommentElement) {
                        this._commentsElement.insertBefore(newElement.domNode, lastCommentElement);
                        lastCommentElement = newElement.domNode;
                    }
                    else {
                        this._commentsElement.appendChild(newElement.domNode);
                        lastCommentElement = newElement.domNode;
                    }
                    if (currentComment.mode === languages.CommentMode.Editing) {
                        newElement.switchToEditMode();
                        newCommentsInEditMode.push(newElement);
                    }
                }
            }
            this._commentThread = commentThread;
            this._commentElements = newCommentNodeList;
            if (newCommentsInEditMode.length) {
                const lastIndex = this._commentElements.indexOf(newCommentsInEditMode[newCommentsInEditMode.length - 1]);
                this._focusedComment = lastIndex;
            }
            this._updateAriaLabel();
            this._setFocusedComment(this._focusedComment);
        }
        _updateAriaLabel() {
            var _a, _b;
            if (this._commentThread.isDocumentCommentThread()) {
                this._commentsElement.ariaLabel = nls.localize('commentThreadAria.withRange', "Comment thread with {0} comments on lines {1} through {2}. {3}.", (_a = this._commentThread.comments) === null || _a === void 0 ? void 0 : _a.length, this._commentThread.range.startLineNumber, this._commentThread.range.endLineNumber, this._commentThread.label);
            }
            else {
                this._commentsElement.ariaLabel = nls.localize('commentThreadAria', "Comment thread with {0} comments. {1}.", (_b = this._commentThread.comments) === null || _b === void 0 ? void 0 : _b.length, this._commentThread.label);
            }
        }
        _setFocusedComment(value) {
            var _a;
            if (this._focusedComment !== undefined) {
                (_a = this._commentElements[this._focusedComment]) === null || _a === void 0 ? void 0 : _a.setFocus(false);
            }
            if (this._commentElements.length === 0 || value === undefined) {
                this._focusedComment = undefined;
            }
            else {
                this._focusedComment = Math.min(value, this._commentElements.length - 1);
                this._commentElements[this._focusedComment].setFocus(true);
            }
        }
        createNewCommentNode(comment) {
            let newCommentNode = this._scopedInstatiationService.createInstance(commentNode_1.CommentNode, this._commentThread, comment, this.owner, this.parentResourceUri, this._parentCommentThreadWidget, this._markdownRenderer);
            this._register(newCommentNode);
            this._commentDisposable.set(newCommentNode, newCommentNode.onDidClick(clickedNode => this._setFocusedComment(this._commentElements.findIndex(commentNode => commentNode.comment.uniqueIdInThread === clickedNode.comment.uniqueIdInThread))));
            return newCommentNode;
        }
        dispose() {
            super.dispose();
            if (this._resizeObserver) {
                this._resizeObserver.disconnect();
                this._resizeObserver = null;
            }
            this._commentDisposable.forEach(v => v.dispose());
        }
    };
    CommentThreadBody = __decorate([
        __param(7, commentService_1.ICommentService),
        __param(8, opener_1.IOpenerService),
        __param(9, language_1.ILanguageService)
    ], CommentThreadBody);
    exports.CommentThreadBody = CommentThreadBody;
});
//# sourceMappingURL=commentThreadBody.js.map