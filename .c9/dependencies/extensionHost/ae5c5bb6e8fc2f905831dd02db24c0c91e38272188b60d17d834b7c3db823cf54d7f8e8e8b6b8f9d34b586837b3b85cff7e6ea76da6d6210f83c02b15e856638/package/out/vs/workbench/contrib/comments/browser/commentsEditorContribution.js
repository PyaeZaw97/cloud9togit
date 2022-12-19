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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/errors", "vs/base/common/lifecycle", "vs/editor/browser/editorBrowser", "vs/editor/browser/editorExtensions", "vs/editor/browser/services/codeEditorService", "vs/editor/common/core/range", "vs/editor/common/model/textModel", "vs/editor/common/languages", "vs/editor/contrib/peekView/browser/peekView", "vs/nls", "vs/platform/commands/common/commands", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybindingsRegistry", "vs/platform/quickinput/common/quickInput", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/workbench/contrib/comments/browser/commentGlyphWidget", "vs/workbench/contrib/comments/browser/commentService", "vs/workbench/contrib/comments/browser/commentThreadZoneWidget", "vs/workbench/contrib/comments/browser/simpleCommentEditor", "vs/workbench/services/editor/common/editorService", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/workbench/common/views", "vs/workbench/contrib/comments/browser/commentsTreeViewer", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/comments/common/commentsConfiguration", "vs/workbench/contrib/comments/browser/commentReply", "vs/base/common/event", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/editor/common/editorContextKeys", "vs/workbench/contrib/comments/browser/commentThreadRangeDecorator", "vs/workbench/contrib/comments/browser/commentColors", "vs/css!./media/review"], function (require, exports, dom_1, actions_1, arrays_1, async_1, errors_1, lifecycle_1, editorBrowser_1, editorExtensions_1, codeEditorService_1, range_1, textModel_1, languages, peekView_1, nls, commands_1, contextView_1, instantiation_1, keybindingsRegistry_1, quickInput_1, colorRegistry_1, themeService_1, theme_1, commentGlyphWidget_1, commentService_1, commentThreadZoneWidget_1, simpleCommentEditor_1, editorService_1, embeddedCodeEditorWidget_1, views_1, commentsTreeViewer_1, configuration_1, commentsConfiguration_1, commentReply_1, event_1, actions_2, contextkey_1, editorContextKeys_1, commentThreadRangeDecorator_1, commentColors_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getActiveEditor = exports.PreviousCommentThreadAction = exports.NextCommentThreadAction = exports.CommentController = exports.ReviewViewZone = exports.ID = void 0;
    exports.ID = 'editor.contrib.review';
    class ReviewViewZone {
        constructor(afterLineNumber, onDomNodeTop) {
            this.afterLineNumber = afterLineNumber;
            this.callback = onDomNodeTop;
            this.domNode = (0, dom_1.$)('.review-viewzone');
        }
        onDomNodeTop(top) {
            this.callback(top);
        }
    }
    exports.ReviewViewZone = ReviewViewZone;
    class CommentingRangeDecoration {
        constructor(_editor, _ownerId, _extensionId, _label, _range, options, commentingRangesInfo, isHover = false) {
            this._editor = _editor;
            this._ownerId = _ownerId;
            this._extensionId = _extensionId;
            this._label = _label;
            this._range = _range;
            this.options = options;
            this.commentingRangesInfo = commentingRangesInfo;
            this.isHover = isHover;
            this._startLineNumber = _range.startLineNumber;
            this._endLineNumber = _range.endLineNumber;
        }
        get id() {
            return this._decorationId;
        }
        set id(id) {
            this._decorationId = id;
        }
        get range() {
            return {
                startLineNumber: this._startLineNumber, startColumn: 1,
                endLineNumber: this._endLineNumber, endColumn: 1
            };
        }
        getCommentAction() {
            return {
                extensionId: this._extensionId,
                label: this._label,
                ownerId: this._ownerId,
                commentingRangesInfo: this.commentingRangesInfo
            };
        }
        getOriginalRange() {
            return this._range;
        }
        getActiveRange() {
            return this.id ? this._editor.getModel().getDecorationRange(this.id) : undefined;
        }
    }
    class CommentingRangeDecorator {
        constructor() {
            this.commentingRangeDecorations = [];
            this.decorationIds = [];
            this._lastHover = -1;
            this._onDidChangeDecorationsCount = new event_1.Emitter();
            this.onDidChangeDecorationsCount = this._onDidChangeDecorationsCount.event;
            const decorationOptions = {
                description: CommentingRangeDecorator.description,
                isWholeLine: true,
                linesDecorationsClassName: 'comment-range-glyph comment-diff-added'
            };
            this.decorationOptions = textModel_1.ModelDecorationOptions.createDynamic(decorationOptions);
            const hoverDecorationOptions = {
                description: CommentingRangeDecorator.description,
                isWholeLine: true,
                linesDecorationsClassName: `comment-range-glyph comment-diff-added line-hover`
            };
            this.hoverDecorationOptions = textModel_1.ModelDecorationOptions.createDynamic(hoverDecorationOptions);
            const multilineDecorationOptions = {
                description: CommentingRangeDecorator.description,
                isWholeLine: true,
                linesDecorationsClassName: `comment-range-glyph comment-diff-added multiline-add`
            };
            this.multilineDecorationOptions = textModel_1.ModelDecorationOptions.createDynamic(multilineDecorationOptions);
        }
        updateHover(hoverLine) {
            if (this._editor && this._infos && (hoverLine !== this._lastHover)) {
                this._doUpdate(this._editor, this._infos, hoverLine);
            }
            this._lastHover = hoverLine !== null && hoverLine !== void 0 ? hoverLine : -1;
        }
        updateSelection(cursorLine, range = new range_1.Range(0, 0, 0, 0)) {
            this._lastSelection = range.isEmpty() ? undefined : range;
            this._lastSelectionCursor = range.isEmpty() ? undefined : cursorLine;
            // Some scenarios:
            // Selection is made. Emphasis should show on the drag/selection end location.
            // Selection is made, then user clicks elsewhere. We should still show the decoration.
            if (this._editor && this._infos) {
                this._doUpdate(this._editor, this._infos, cursorLine, range);
            }
        }
        update(editor, commentInfos) {
            this._editor = editor;
            this._infos = commentInfos;
            this._doUpdate(editor, commentInfos);
        }
        _doUpdate(editor, commentInfos, emphasisLine = -1, selectionRange = this._lastSelection) {
            var _a;
            let model = editor.getModel();
            if (!model) {
                return;
            }
            // If there's still a selection, use that.
            emphasisLine = (_a = this._lastSelectionCursor) !== null && _a !== void 0 ? _a : emphasisLine;
            let commentingRangeDecorations = [];
            for (const info of commentInfos) {
                info.commentingRanges.ranges.forEach(range => {
                    const rangeObject = new range_1.Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
                    let intersectingSelectionRange = selectionRange ? rangeObject.intersectRanges(selectionRange) : undefined;
                    if ((selectionRange && (emphasisLine >= 0) && intersectingSelectionRange)
                        // If there's only one selection line, then just drop into the else if and show an emphasis line.
                        && !((intersectingSelectionRange.startLineNumber === intersectingSelectionRange.endLineNumber)
                            && (emphasisLine === intersectingSelectionRange.startLineNumber))) {
                        // The emphasisLine should be the within the commenting range, even if the selection range stretches
                        // outside of the commenting range.
                        // Clip the emphasis and selection ranges to the commenting range
                        let intersectingEmphasisRange;
                        if (emphasisLine <= intersectingSelectionRange.startLineNumber) {
                            intersectingEmphasisRange = intersectingSelectionRange.collapseToStart();
                            intersectingSelectionRange = new range_1.Range(intersectingSelectionRange.startLineNumber + 1, 1, intersectingSelectionRange.endLineNumber, 1);
                        }
                        else {
                            intersectingEmphasisRange = new range_1.Range(intersectingSelectionRange.endLineNumber, 1, intersectingSelectionRange.endLineNumber, 1);
                            intersectingSelectionRange = new range_1.Range(intersectingSelectionRange.startLineNumber, 1, intersectingSelectionRange.endLineNumber - 1, 1);
                        }
                        commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.owner, info.extensionId, info.label, intersectingSelectionRange, this.multilineDecorationOptions, info.commentingRanges, true));
                        commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.owner, info.extensionId, info.label, intersectingEmphasisRange, this.hoverDecorationOptions, info.commentingRanges, true));
                        const beforeRangeEndLine = Math.min(intersectingEmphasisRange.startLineNumber, intersectingSelectionRange.startLineNumber) - 1;
                        const hasBeforeRange = rangeObject.startLineNumber <= beforeRangeEndLine;
                        const afterRangeStartLine = Math.max(intersectingEmphasisRange.endLineNumber, intersectingSelectionRange.endLineNumber) + 1;
                        const hasAfterRange = rangeObject.endLineNumber >= afterRangeStartLine;
                        if (hasBeforeRange) {
                            const beforeRange = new range_1.Range(range.startLineNumber, 1, beforeRangeEndLine, 1);
                            commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.owner, info.extensionId, info.label, beforeRange, this.decorationOptions, info.commentingRanges, true));
                        }
                        if (hasAfterRange) {
                            const afterRange = new range_1.Range(afterRangeStartLine, 1, range.endLineNumber, 1);
                            commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.owner, info.extensionId, info.label, afterRange, this.decorationOptions, info.commentingRanges, true));
                        }
                    }
                    else if ((rangeObject.startLineNumber <= emphasisLine) && (emphasisLine <= rangeObject.endLineNumber)) {
                        const beforeRange = new range_1.Range(range.startLineNumber, 1, emphasisLine, 1);
                        const afterRange = new range_1.Range(emphasisLine, 1, range.endLineNumber, 1);
                        commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.owner, info.extensionId, info.label, beforeRange, this.decorationOptions, info.commentingRanges, true));
                        commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.owner, info.extensionId, info.label, new range_1.Range(emphasisLine, 1, emphasisLine, 1), this.hoverDecorationOptions, info.commentingRanges, true));
                        commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.owner, info.extensionId, info.label, afterRange, this.decorationOptions, info.commentingRanges, true));
                    }
                    else {
                        commentingRangeDecorations.push(new CommentingRangeDecoration(editor, info.owner, info.extensionId, info.label, range, this.decorationOptions, info.commentingRanges));
                    }
                });
            }
            this.decorationIds = editor.deltaDecorations(this.decorationIds, commentingRangeDecorations);
            commentingRangeDecorations.forEach((decoration, index) => decoration.id = this.decorationIds[index]);
            const rangesDifference = this.commentingRangeDecorations.length - commentingRangeDecorations.length;
            this.commentingRangeDecorations = commentingRangeDecorations;
            if (rangesDifference) {
                this._onDidChangeDecorationsCount.fire(this.commentingRangeDecorations.length);
            }
        }
        getMatchedCommentAction(commentRange) {
            // keys is ownerId
            const foundHoverActions = new Map();
            for (const decoration of this.commentingRangeDecorations) {
                const range = decoration.getActiveRange();
                if (range && ((range.startLineNumber <= commentRange.startLineNumber) || (commentRange.endLineNumber <= range.endLineNumber))) {
                    // We can have several commenting ranges that match from the same owner because of how
                    // the line hover and selection decoration is done.
                    // The ranges must be merged so that we can see if the new commentRange fits within them.
                    const action = decoration.getCommentAction();
                    const alreadyFoundInfo = foundHoverActions.get(action.ownerId);
                    if ((alreadyFoundInfo === null || alreadyFoundInfo === void 0 ? void 0 : alreadyFoundInfo.action.commentingRangesInfo) === action.commentingRangesInfo) {
                        // Merge ranges.
                        const newRange = new range_1.Range(range.startLineNumber < alreadyFoundInfo.range.startLineNumber ? range.startLineNumber : alreadyFoundInfo.range.startLineNumber, range.startColumn < alreadyFoundInfo.range.startColumn ? range.startColumn : alreadyFoundInfo.range.startColumn, range.endLineNumber > alreadyFoundInfo.range.endLineNumber ? range.endLineNumber : alreadyFoundInfo.range.endLineNumber, range.endColumn > alreadyFoundInfo.range.endColumn ? range.endColumn : alreadyFoundInfo.range.endColumn);
                        foundHoverActions.set(action.ownerId, { range: newRange, action });
                    }
                    else {
                        foundHoverActions.set(action.ownerId, { range, action });
                    }
                }
            }
            return Array.from(foundHoverActions.values()).filter(action => {
                return (action.range.startLineNumber <= commentRange.startLineNumber) && (commentRange.endLineNumber <= action.range.endLineNumber);
            }).map(actions => actions.action);
        }
        dispose() {
            this.commentingRangeDecorations = [];
        }
    }
    CommentingRangeDecorator.description = 'commenting-range-decorator';
    const ActiveCursorHasCommentingRange = new contextkey_1.RawContextKey('activeCursorHasCommentingRange', false, {
        description: nls.localize('hasCommentingRange', "Whether the position at the active cursor has a commenting range"),
        type: 'boolean'
    });
    let CommentController = class CommentController {
        constructor(editor, commentService, instantiationService, codeEditorService, contextMenuService, quickInputService, viewsService, configurationService, contextKeyService) {
            this.commentService = commentService;
            this.instantiationService = instantiationService;
            this.codeEditorService = codeEditorService;
            this.contextMenuService = contextMenuService;
            this.quickInputService = quickInputService;
            this.viewsService = viewsService;
            this.configurationService = configurationService;
            this.contextKeyService = contextKeyService;
            this.globalToDispose = new lifecycle_1.DisposableStore();
            this.localToDispose = new lifecycle_1.DisposableStore();
            this.mouseDownInfo = null;
            this._commentingRangeSpaceReserved = false;
            this._emptyThreadsToAddQueue = [];
            this._commentInfos = [];
            this._commentWidgets = [];
            this._pendingCommentCache = {};
            this._computePromise = null;
            this._activeCursorHasCommentingRange = ActiveCursorHasCommentingRange.bindTo(contextKeyService);
            if (editor instanceof embeddedCodeEditorWidget_1.EmbeddedCodeEditorWidget) {
                return;
            }
            this.editor = editor;
            this._commentingRangeDecorator = new CommentingRangeDecorator();
            this.globalToDispose.add(this._commentingRangeDecorator.onDidChangeDecorationsCount(count => {
                if (count === 0) {
                    this.clearEditorListeners();
                }
                else if (!this._editorDisposables) {
                    this.registerEditorListeners();
                }
            }));
            this.globalToDispose.add(this._commentThreadRangeDecorator = new commentThreadRangeDecorator_1.CommentThreadRangeDecorator(this.commentService));
            this.globalToDispose.add(this.commentService.onDidDeleteDataProvider(ownerId => {
                delete this._pendingCommentCache[ownerId];
                this.beginCompute();
            }));
            this.globalToDispose.add(this.commentService.onDidSetDataProvider(_ => this.beginCompute()));
            this.globalToDispose.add(this.commentService.onDidUpdateCommentingRanges(_ => this.beginCompute()));
            this.globalToDispose.add(this.commentService.onDidSetResourceCommentInfos(e => {
                const editorURI = this.editor && this.editor.hasModel() && this.editor.getModel().uri;
                if (editorURI && editorURI.toString() === e.resource.toString()) {
                    this.setComments(e.commentInfos.filter(commentInfo => commentInfo !== null));
                }
            }));
            this.globalToDispose.add(this.editor.onDidChangeModel(e => this.onModelChanged(e)));
            this.codeEditorService.registerDecorationType('comment-controller', commentReply_1.COMMENTEDITOR_DECORATION_KEY, {});
            this.beginCompute();
        }
        registerEditorListeners() {
            this._editorDisposables = [];
            this._editorDisposables.push(this.editor.onMouseMove(e => this.onEditorMouseMove(e)));
            this._editorDisposables.push(this.editor.onDidChangeCursorPosition(e => this.onEditorChangeCursorPosition(e.position)));
            this._editorDisposables.push(this.editor.onDidFocusEditorWidget(() => this.onEditorChangeCursorPosition(this.editor.getPosition())));
            this._editorDisposables.push(this.editor.onDidChangeCursorSelection(e => this.onEditorChangeCursorSelection(e)));
            this._editorDisposables.push(this.editor.onDidBlurEditorWidget(() => this.onEditorChangeCursorSelection()));
        }
        clearEditorListeners() {
            var _a;
            (_a = this._editorDisposables) === null || _a === void 0 ? void 0 : _a.forEach(disposable => disposable.dispose());
            this._editorDisposables = undefined;
        }
        onEditorMouseMove(e) {
            var _a;
            this._commentingRangeDecorator.updateHover((_a = e.target.position) === null || _a === void 0 ? void 0 : _a.lineNumber);
        }
        onEditorChangeCursorSelection(e) {
            var _a;
            const position = (_a = this.editor.getPosition()) === null || _a === void 0 ? void 0 : _a.lineNumber;
            if (position) {
                this._commentingRangeDecorator.updateSelection(position, e === null || e === void 0 ? void 0 : e.selection);
            }
        }
        onEditorChangeCursorPosition(e) {
            const decorations = e ? this.editor.getDecorationsInRange(range_1.Range.fromPositions(e, { column: -1, lineNumber: e.lineNumber })) : undefined;
            let hasCommentingRange = false;
            if (decorations) {
                for (const decoration of decorations) {
                    if (decoration.options.description === commentGlyphWidget_1.CommentGlyphWidget.description) {
                        // We don't allow multiple comments on the same line.
                        hasCommentingRange = false;
                        break;
                    }
                    else if (decoration.options.description === CommentingRangeDecorator.description) {
                        hasCommentingRange = true;
                    }
                }
            }
            this._activeCursorHasCommentingRange.set(hasCommentingRange);
        }
        beginCompute() {
            this._computePromise = (0, async_1.createCancelablePromise)(token => {
                const editorURI = this.editor && this.editor.hasModel() && this.editor.getModel().uri;
                if (editorURI) {
                    return this.commentService.getDocumentComments(editorURI);
                }
                return Promise.resolve([]);
            });
            return this._computePromise.then(commentInfos => {
                this.setComments((0, arrays_1.coalesce)(commentInfos));
                this._computePromise = null;
            }, error => console.log(error));
        }
        beginComputeCommentingRanges() {
            if (this._computeCommentingRangeScheduler) {
                if (this._computeCommentingRangePromise) {
                    this._computeCommentingRangePromise.cancel();
                    this._computeCommentingRangePromise = null;
                }
                this._computeCommentingRangeScheduler.trigger(() => {
                    const editorURI = this.editor && this.editor.hasModel() && this.editor.getModel().uri;
                    if (editorURI) {
                        return this.commentService.getDocumentComments(editorURI);
                    }
                    return Promise.resolve([]);
                }).then(commentInfos => {
                    const meaningfulCommentInfos = (0, arrays_1.coalesce)(commentInfos);
                    this._commentingRangeDecorator.update(this.editor, meaningfulCommentInfos);
                }, (err) => {
                    (0, errors_1.onUnexpectedError)(err);
                    return null;
                });
            }
        }
        static get(editor) {
            return editor.getContribution(exports.ID);
        }
        revealCommentThread(threadId, commentUniqueId, fetchOnceIfNotExist) {
            const commentThreadWidget = this._commentWidgets.filter(widget => widget.commentThread.threadId === threadId);
            if (commentThreadWidget.length === 1) {
                commentThreadWidget[0].reveal(commentUniqueId);
            }
            else if (fetchOnceIfNotExist) {
                if (this._computePromise) {
                    this._computePromise.then(_ => {
                        this.revealCommentThread(threadId, commentUniqueId, false);
                    });
                }
                else {
                    this.beginCompute().then(_ => {
                        this.revealCommentThread(threadId, commentUniqueId, false);
                    });
                }
            }
        }
        nextCommentThread() {
            this._findNearestCommentThread();
        }
        _findNearestCommentThread(reverse) {
            if (!this._commentWidgets.length || !this.editor.hasModel()) {
                return;
            }
            const after = this.editor.getSelection().getEndPosition();
            const sortedWidgets = this._commentWidgets.sort((a, b) => {
                if (reverse) {
                    const temp = a;
                    a = b;
                    b = temp;
                }
                if (a.commentThread.range.startLineNumber < b.commentThread.range.startLineNumber) {
                    return -1;
                }
                if (a.commentThread.range.startLineNumber > b.commentThread.range.startLineNumber) {
                    return 1;
                }
                if (a.commentThread.range.startColumn < b.commentThread.range.startColumn) {
                    return -1;
                }
                if (a.commentThread.range.startColumn > b.commentThread.range.startColumn) {
                    return 1;
                }
                return 0;
            });
            let idx = (0, arrays_1.findFirstInSorted)(sortedWidgets, widget => {
                let lineValueOne = reverse ? after.lineNumber : widget.commentThread.range.startLineNumber;
                let lineValueTwo = reverse ? widget.commentThread.range.startLineNumber : after.lineNumber;
                let columnValueOne = reverse ? after.column : widget.commentThread.range.startColumn;
                let columnValueTwo = reverse ? widget.commentThread.range.startColumn : after.column;
                if (lineValueOne > lineValueTwo) {
                    return true;
                }
                if (lineValueOne < lineValueTwo) {
                    return false;
                }
                if (columnValueOne > columnValueTwo) {
                    return true;
                }
                return false;
            });
            let nextWidget;
            if (idx === this._commentWidgets.length) {
                nextWidget = this._commentWidgets[0];
            }
            else {
                nextWidget = sortedWidgets[idx];
            }
            this.editor.setSelection(nextWidget.commentThread.range);
            nextWidget.reveal(undefined, true);
        }
        previousCommentThread() {
            this._findNearestCommentThread(true);
        }
        dispose() {
            var _a;
            this.globalToDispose.dispose();
            this.localToDispose.dispose();
            (_a = this._editorDisposables) === null || _a === void 0 ? void 0 : _a.forEach(disposable => disposable.dispose());
            this._commentWidgets.forEach(widget => widget.dispose());
            this.editor = null; // Strict null override - nulling out in dispose
        }
        onModelChanged(e) {
            this.localToDispose.clear();
            this.removeCommentWidgetsAndStoreCache();
            this.localToDispose.add(this.editor.onMouseDown(e => this.onEditorMouseDown(e)));
            this.localToDispose.add(this.editor.onMouseUp(e => this.onEditorMouseUp(e)));
            if (this._editorDisposables) {
                this.clearEditorListeners();
                this.registerEditorListeners();
            }
            this._computeCommentingRangeScheduler = new async_1.Delayer(200);
            this.localToDispose.add({
                dispose: () => {
                    if (this._computeCommentingRangeScheduler) {
                        this._computeCommentingRangeScheduler.cancel();
                    }
                    this._computeCommentingRangeScheduler = null;
                }
            });
            this.localToDispose.add(this.editor.onDidChangeModelContent(async () => {
                this.beginComputeCommentingRanges();
            }));
            this.localToDispose.add(this.commentService.onDidUpdateCommentThreads(async (e) => {
                const editorURI = this.editor && this.editor.hasModel() && this.editor.getModel().uri;
                if (!editorURI) {
                    return;
                }
                if (this._computePromise) {
                    await this._computePromise;
                }
                let commentInfo = this._commentInfos.filter(info => info.owner === e.owner);
                if (!commentInfo || !commentInfo.length) {
                    return;
                }
                let added = e.added.filter(thread => thread.resource && thread.resource.toString() === editorURI.toString());
                let removed = e.removed.filter(thread => thread.resource && thread.resource.toString() === editorURI.toString());
                let changed = e.changed.filter(thread => thread.resource && thread.resource.toString() === editorURI.toString());
                removed.forEach(thread => {
                    let matchedZones = this._commentWidgets.filter(zoneWidget => zoneWidget.owner === e.owner && zoneWidget.commentThread.threadId === thread.threadId && zoneWidget.commentThread.threadId !== '');
                    if (matchedZones.length) {
                        let matchedZone = matchedZones[0];
                        let index = this._commentWidgets.indexOf(matchedZone);
                        this._commentWidgets.splice(index, 1);
                        matchedZone.dispose();
                    }
                    const infosThreads = this._commentInfos.filter(info => info.owner === e.owner)[0].threads;
                    for (let i = 0; i < infosThreads.length; i++) {
                        if (infosThreads[i] === thread) {
                            infosThreads.splice(i, 1);
                            i--;
                        }
                    }
                });
                changed.forEach(thread => {
                    let matchedZones = this._commentWidgets.filter(zoneWidget => zoneWidget.owner === e.owner && zoneWidget.commentThread.threadId === thread.threadId);
                    if (matchedZones.length) {
                        let matchedZone = matchedZones[0];
                        matchedZone.update(thread);
                    }
                });
                added.forEach(thread => {
                    let matchedZones = this._commentWidgets.filter(zoneWidget => zoneWidget.owner === e.owner && zoneWidget.commentThread.threadId === thread.threadId);
                    if (matchedZones.length) {
                        return;
                    }
                    let matchedNewCommentThreadZones = this._commentWidgets.filter(zoneWidget => zoneWidget.owner === e.owner && zoneWidget.commentThread.commentThreadHandle === -1 && range_1.Range.equalsRange(zoneWidget.commentThread.range, thread.range));
                    if (matchedNewCommentThreadZones.length) {
                        matchedNewCommentThreadZones[0].update(thread);
                        return;
                    }
                    const pendingCommentText = this._pendingCommentCache[e.owner] && this._pendingCommentCache[e.owner][thread.threadId];
                    this.displayCommentThread(e.owner, thread, pendingCommentText);
                    this._commentInfos.filter(info => info.owner === e.owner)[0].threads.push(thread);
                });
                this._commentThreadRangeDecorator.update(this.editor, commentInfo);
            }));
            this.beginCompute();
        }
        async openCommentsView() {
            var _a;
            if (this._commentWidgets.length) {
                if (this.configurationService.getValue(commentsConfiguration_1.COMMENTS_SECTION).openView === 'file') {
                    return this.viewsService.openView(commentsTreeViewer_1.COMMENTS_VIEW_ID);
                }
                else if (this.configurationService.getValue(commentsConfiguration_1.COMMENTS_SECTION).openView === 'firstFile') {
                    const hasShownView = (_a = this.viewsService.getViewWithId(commentsTreeViewer_1.COMMENTS_VIEW_ID)) === null || _a === void 0 ? void 0 : _a.hasRendered;
                    if (!hasShownView) {
                        return this.viewsService.openView(commentsTreeViewer_1.COMMENTS_VIEW_ID);
                    }
                }
            }
            return undefined;
        }
        displayCommentThread(owner, thread, pendingComment) {
            const zoneWidget = this.instantiationService.createInstance(commentThreadZoneWidget_1.ReviewZoneWidget, this.editor, owner, thread, pendingComment);
            zoneWidget.display(thread.range.endLineNumber);
            this._commentWidgets.push(zoneWidget);
            this.openCommentsView();
        }
        onEditorMouseDown(e) {
            this.mouseDownInfo = (0, commentThreadZoneWidget_1.parseMouseDownInfoFromEvent)(e);
        }
        onEditorMouseUp(e) {
            const matchedLineNumber = (0, commentThreadZoneWidget_1.isMouseUpEventMatchMouseDown)(this.mouseDownInfo, e);
            this.mouseDownInfo = null;
            if (matchedLineNumber === null || !e.target.element) {
                return;
            }
            if (e.target.element.className.indexOf('comment-diff-added') >= 0) {
                const lineNumber = e.target.position.lineNumber;
                // Check for selection at line number.
                let range = new range_1.Range(lineNumber, 1, lineNumber, 1);
                const selection = this.editor.getSelection();
                if (selection && (selection.startLineNumber <= lineNumber) && (lineNumber <= selection.endLineNumber)) {
                    range = selection;
                    this.editor.setSelection(new range_1.Range(selection.endLineNumber, 1, selection.endLineNumber, 1));
                }
                this.addOrToggleCommentAtLine(range, e);
            }
        }
        async addOrToggleCommentAtLine(commentRange, e) {
            // If an add is already in progress, queue the next add and process it after the current one finishes to
            // prevent empty comment threads from being added to the same line.
            if (!this._addInProgress) {
                this._addInProgress = true;
                // The widget's position is undefined until the widget has been displayed, so rely on the glyph position instead
                const existingCommentsAtLine = this._commentWidgets.filter(widget => widget.getGlyphPosition() === commentRange.endLineNumber);
                if (existingCommentsAtLine.length) {
                    existingCommentsAtLine.forEach(widget => widget.toggleExpand(commentRange.endLineNumber));
                    this.processNextThreadToAdd();
                    return;
                }
                else {
                    this.addCommentAtLine(commentRange, e);
                }
            }
            else {
                this._emptyThreadsToAddQueue.push([commentRange, e]);
            }
        }
        processNextThreadToAdd() {
            this._addInProgress = false;
            const info = this._emptyThreadsToAddQueue.shift();
            if (info) {
                this.addOrToggleCommentAtLine(info[0], info[1]);
            }
        }
        addCommentAtLine(range, e) {
            const newCommentInfos = this._commentingRangeDecorator.getMatchedCommentAction(range);
            if (!newCommentInfos.length || !this.editor.hasModel()) {
                return Promise.resolve();
            }
            if (newCommentInfos.length > 1) {
                if (e) {
                    const anchor = { x: e.event.posx, y: e.event.posy };
                    this.contextMenuService.showContextMenu({
                        getAnchor: () => anchor,
                        getActions: () => this.getContextMenuActions(newCommentInfos, range),
                        getActionsContext: () => newCommentInfos.length ? newCommentInfos[0] : undefined,
                        onHide: () => { this._addInProgress = false; }
                    });
                    return Promise.resolve();
                }
                else {
                    const picks = this.getCommentProvidersQuickPicks(newCommentInfos);
                    return this.quickInputService.pick(picks, { placeHolder: nls.localize('pickCommentService', "Select Comment Provider"), matchOnDescription: true }).then(pick => {
                        if (!pick) {
                            return;
                        }
                        const commentInfos = newCommentInfos.filter(info => info.ownerId === pick.id);
                        if (commentInfos.length) {
                            const { ownerId } = commentInfos[0];
                            this.addCommentAtLine2(range, ownerId);
                        }
                    }).then(() => {
                        this._addInProgress = false;
                    });
                }
            }
            else {
                const { ownerId } = newCommentInfos[0];
                this.addCommentAtLine2(range, ownerId);
            }
            return Promise.resolve();
        }
        getCommentProvidersQuickPicks(commentInfos) {
            const picks = commentInfos.map((commentInfo) => {
                const { ownerId, extensionId, label } = commentInfo;
                return {
                    label: label || extensionId,
                    id: ownerId
                };
            });
            return picks;
        }
        getContextMenuActions(commentInfos, commentRange) {
            const actions = [];
            commentInfos.forEach(commentInfo => {
                const { ownerId, extensionId, label } = commentInfo;
                actions.push(new actions_1.Action('addCommentThread', `${label || extensionId}`, undefined, true, () => {
                    this.addCommentAtLine2(commentRange, ownerId);
                    return Promise.resolve();
                }));
            });
            return actions;
        }
        addCommentAtLine2(range, ownerId) {
            this.commentService.createCommentThreadTemplate(ownerId, this.editor.getModel().uri, range);
            this.processNextThreadToAdd();
            return;
        }
        setComments(commentInfos) {
            if (!this.editor) {
                return;
            }
            this._commentInfos = commentInfos;
            let lineDecorationsWidth = this.editor.getLayoutInfo().decorationsWidth;
            if (this._commentInfos.some(info => Boolean(info.commentingRanges && (Array.isArray(info.commentingRanges) ? info.commentingRanges : info.commentingRanges.ranges).length))) {
                if (!this._commentingRangeSpaceReserved) {
                    this._commentingRangeSpaceReserved = true;
                    let extraEditorClassName = [];
                    const configuredExtraClassName = this.editor.getRawOptions().extraEditorClassName;
                    if (configuredExtraClassName) {
                        extraEditorClassName = configuredExtraClassName.split(' ');
                    }
                    const options = this.editor.getOptions();
                    if (options.get(37 /* EditorOption.folding */)) {
                        lineDecorationsWidth -= 16;
                    }
                    lineDecorationsWidth += 9;
                    extraEditorClassName.push('inline-comment');
                    this.editor.updateOptions({
                        extraEditorClassName: extraEditorClassName.join(' '),
                        lineDecorationsWidth: lineDecorationsWidth
                    });
                    // we only update the lineDecorationsWidth property but keep the width of the whole editor.
                    const originalLayoutInfo = this.editor.getLayoutInfo();
                    this.editor.layout({
                        width: originalLayoutInfo.width,
                        height: originalLayoutInfo.height
                    });
                }
            }
            // create viewzones
            this.removeCommentWidgetsAndStoreCache();
            this._commentInfos.forEach(info => {
                let providerCacheStore = this._pendingCommentCache[info.owner];
                info.threads = info.threads.filter(thread => !thread.isDisposed);
                info.threads.forEach(thread => {
                    let pendingComment = null;
                    if (providerCacheStore) {
                        pendingComment = providerCacheStore[thread.threadId];
                    }
                    if (pendingComment) {
                        thread.collapsibleState = languages.CommentThreadCollapsibleState.Expanded;
                    }
                    this.displayCommentThread(info.owner, thread, pendingComment);
                });
            });
            this._commentingRangeDecorator.update(this.editor, this._commentInfos);
            this._commentThreadRangeDecorator.update(this.editor, this._commentInfos);
        }
        closeWidget() {
            if (this._commentWidgets) {
                this._commentWidgets.forEach(widget => widget.hide());
            }
            this.editor.focus();
            this.editor.revealRangeInCenter(this.editor.getSelection());
        }
        removeCommentWidgetsAndStoreCache() {
            if (this._commentWidgets) {
                this._commentWidgets.forEach(zone => {
                    let pendingComment = zone.getPendingComment();
                    let providerCacheStore = this._pendingCommentCache[zone.owner];
                    if (pendingComment) {
                        if (!providerCacheStore) {
                            this._pendingCommentCache[zone.owner] = {};
                        }
                        this._pendingCommentCache[zone.owner][zone.commentThread.threadId] = pendingComment;
                    }
                    else {
                        if (providerCacheStore) {
                            delete providerCacheStore[zone.commentThread.threadId];
                        }
                    }
                    zone.dispose();
                });
            }
            this._commentWidgets = [];
        }
        hasComments() {
            return !!this._commentWidgets.length;
        }
    };
    CommentController = __decorate([
        __param(1, commentService_1.ICommentService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, codeEditorService_1.ICodeEditorService),
        __param(4, contextView_1.IContextMenuService),
        __param(5, quickInput_1.IQuickInputService),
        __param(6, views_1.IViewsService),
        __param(7, configuration_1.IConfigurationService),
        __param(8, contextkey_1.IContextKeyService)
    ], CommentController);
    exports.CommentController = CommentController;
    class NextCommentThreadAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.nextCommentThreadAction',
                label: nls.localize('nextCommentThreadAction', "Go to Next Comment Thread"),
                alias: 'Go to Next Comment Thread',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 512 /* KeyMod.Alt */ | 67 /* KeyCode.F9 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            let controller = CommentController.get(editor);
            if (controller) {
                controller.nextCommentThread();
            }
        }
    }
    exports.NextCommentThreadAction = NextCommentThreadAction;
    class PreviousCommentThreadAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.previousCommentThreadAction',
                label: nls.localize('previousCommentThreadAction', "Go to Previous Comment Thread"),
                alias: 'Go to Previous Comment Thread',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.focus,
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 67 /* KeyCode.F9 */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            let controller = CommentController.get(editor);
            if (controller) {
                controller.previousCommentThread();
            }
        }
    }
    exports.PreviousCommentThreadAction = PreviousCommentThreadAction;
    (0, editorExtensions_1.registerEditorContribution)(exports.ID, CommentController);
    (0, editorExtensions_1.registerEditorAction)(NextCommentThreadAction);
    (0, editorExtensions_1.registerEditorAction)(PreviousCommentThreadAction);
    const ADD_COMMENT_COMMAND = 'workbench.action.addComment';
    commands_1.CommandsRegistry.registerCommand({
        id: ADD_COMMENT_COMMAND,
        handler: (accessor) => {
            const activeEditor = getActiveEditor(accessor);
            if (!activeEditor) {
                return Promise.resolve();
            }
            const controller = CommentController.get(activeEditor);
            if (!controller) {
                return Promise.resolve();
            }
            const position = activeEditor.getSelection();
            return controller.addOrToggleCommentAtLine(position, undefined);
        }
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.CommandPalette, {
        command: {
            id: ADD_COMMENT_COMMAND,
            title: nls.localize('comments.addCommand', "Add Comment on Current Selection"),
            category: 'Comments'
        },
        when: ActiveCursorHasCommentingRange
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.submitComment',
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */,
        when: simpleCommentEditor_1.ctxCommentEditorFocused,
        handler: (accessor, args) => {
            const activeCodeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (activeCodeEditor instanceof simpleCommentEditor_1.SimpleCommentEditor) {
                activeCodeEditor.getParentThread().submitComment();
            }
        }
    });
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'workbench.action.hideComment',
        weight: 100 /* KeybindingWeight.EditorContrib */,
        primary: 9 /* KeyCode.Escape */,
        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
        when: simpleCommentEditor_1.ctxCommentEditorFocused,
        handler: (accessor, args) => {
            const activeCodeEditor = accessor.get(codeEditorService_1.ICodeEditorService).getFocusedCodeEditor();
            if (activeCodeEditor instanceof simpleCommentEditor_1.SimpleCommentEditor) {
                activeCodeEditor.getParentThread().collapse();
            }
        }
    });
    function getActiveEditor(accessor) {
        let activeTextEditorControl = accessor.get(editorService_1.IEditorService).activeTextEditorControl;
        if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
            if (activeTextEditorControl.getOriginalEditor().hasTextFocus()) {
                activeTextEditorControl = activeTextEditorControl.getOriginalEditor();
            }
            else {
                activeTextEditorControl = activeTextEditorControl.getModifiedEditor();
            }
        }
        if (!(0, editorBrowser_1.isCodeEditor)(activeTextEditorControl) || !activeTextEditorControl.hasModel()) {
            return null;
        }
        return activeTextEditorControl;
    }
    exports.getActiveEditor = getActiveEditor;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const peekViewBackground = theme.getColor(peekView_1.peekViewResultsBackground);
        if (peekViewBackground) {
            collector.addRule(`.monaco-editor .review-widget,` +
                `.monaco-editor .review-widget {` +
                `	background-color: ${peekViewBackground};` +
                `}`);
        }
        const monacoEditorBackground = theme.getColor(peekView_1.peekViewTitleBackground);
        if (monacoEditorBackground) {
            collector.addRule(`.review-widget .body .comment-form .review-thread-reply-button {` +
                `	background-color: ${monacoEditorBackground}` +
                `}`);
        }
        const monacoEditorForeground = theme.getColor(colorRegistry_1.editorForeground);
        if (monacoEditorForeground) {
            collector.addRule(`.review-widget .body .monaco-editor {` +
                `	color: ${monacoEditorForeground}` +
                `}` +
                `.review-widget .body .comment-form .review-thread-reply-button {` +
                `	color: ${monacoEditorForeground};` +
                `	font-size: inherit` +
                `}`);
        }
        const selectionBackground = theme.getColor(peekView_1.peekViewResultsSelectionBackground);
        if (selectionBackground) {
            collector.addRule(`@keyframes monaco-review-widget-focus {` +
                `	0% { background: ${selectionBackground}; }` +
                `	100% { background: transparent; }` +
                `}` +
                `.review-widget .body .review-comment.focus {` +
                `	animation: monaco-review-widget-focus 3s ease 0s;` +
                `}`);
        }
        const commentingRangeForeground = theme.getColor(commentGlyphWidget_1.overviewRulerCommentingRangeForeground);
        if (commentingRangeForeground) {
            collector.addRule(`
			.monaco-editor .comment-diff-added {
				border-left: 3px solid ${commentingRangeForeground};
			}
			.monaco-editor .comment-diff-added:before {
				background: ${commentingRangeForeground};
			}
			.monaco-editor .comment-thread {
				border-left: 3px solid ${commentingRangeForeground};
			}
			.monaco-editor .comment-thread:before {
				background: ${commentingRangeForeground};
			}
		`);
        }
        const statusBarItemHoverBackground = theme.getColor(theme_1.STATUS_BAR_ITEM_HOVER_BACKGROUND);
        if (statusBarItemHoverBackground) {
            collector.addRule(`.review-widget .body .review-comment .review-comment-contents .comment-reactions .action-item a.action-label.active:hover { background-color: ${statusBarItemHoverBackground};}`);
        }
        const statusBarItemActiveBackground = theme.getColor(theme_1.STATUS_BAR_ITEM_ACTIVE_BACKGROUND);
        if (statusBarItemActiveBackground) {
            collector.addRule(`.review-widget .body .review-comment .review-comment-contents .comment-reactions .action-item a.action-label:active { background-color: ${statusBarItemActiveBackground}; border: 1px solid transparent;}`);
        }
        const commentThreadRangeBackgroundColor = theme.getColor(commentColors_1.commentThreadRangeBackground);
        if (commentThreadRangeBackgroundColor) {
            collector.addRule(`.monaco-editor .comment-thread-range { background-color: ${commentThreadRangeBackgroundColor};}`);
        }
        const commentThreadRangeBorderColor = theme.getColor(commentColors_1.commentThreadRangeBorder);
        if (commentThreadRangeBorderColor) {
            collector.addRule(`.monaco-editor .comment-thread-range {
		border-color: ${commentThreadRangeBorderColor};
		border-width: 1px;
		border-style: solid;
		box-sizing: border-box; }`);
        }
        const commentThreadRangeActiveBackgroundColor = theme.getColor(commentColors_1.commentThreadRangeActiveBackground);
        if (commentThreadRangeActiveBackgroundColor) {
            collector.addRule(`.monaco-editor .comment-thread-range-current { background-color: ${commentThreadRangeActiveBackgroundColor};}`);
        }
        const commentThreadRangeActiveBorderColor = theme.getColor(commentColors_1.commentThreadRangeActiveBorder);
        if (commentThreadRangeActiveBorderColor) {
            collector.addRule(`.monaco-editor .comment-thread-range-current {
		border-color: ${commentThreadRangeActiveBorderColor};
		border-width: 1px;
		border-style: solid;
		box-sizing: border-box; }`);
        }
    });
});
//# sourceMappingURL=commentsEditorContribution.js.map