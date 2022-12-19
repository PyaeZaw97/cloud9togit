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
define(["require", "exports", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/types", "vs/editor/common/core/range", "vs/editor/common/languages", "vs/editor/contrib/zoneWidget/browser/zoneWidget", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/contrib/comments/browser/commentGlyphWidget", "vs/workbench/contrib/comments/browser/commentService", "vs/platform/instantiation/common/serviceCollection", "vs/workbench/contrib/comments/browser/commentThreadWidget", "vs/workbench/contrib/comments/browser/commentColors", "vs/editor/contrib/peekView/browser/peekView"], function (require, exports, color_1, event_1, lifecycle_1, types_1, range_1, languages, zoneWidget_1, contextkey_1, instantiation_1, themeService_1, commentGlyphWidget_1, commentService_1, serviceCollection_1, commentThreadWidget_1, commentColors_1, peekView_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReviewZoneWidget = exports.isMouseUpEventMatchMouseDown = exports.parseMouseDownInfoFromEvent = exports.getCommentThreadWidgetStateColor = void 0;
    function getCommentThreadWidgetStateColor(thread, theme) {
        var _a;
        return (_a = (0, commentColors_1.getCommentThreadStateColor)(thread, theme)) !== null && _a !== void 0 ? _a : theme.getColor(peekView_1.peekViewBorder);
    }
    exports.getCommentThreadWidgetStateColor = getCommentThreadWidgetStateColor;
    function parseMouseDownInfoFromEvent(e) {
        const range = e.target.range;
        if (!range) {
            return null;
        }
        if (!e.event.leftButton) {
            return null;
        }
        if (e.target.type !== 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */) {
            return null;
        }
        const data = e.target.detail;
        const gutterOffsetX = data.offsetX - data.glyphMarginWidth - data.lineNumbersWidth - data.glyphMarginLeft;
        // don't collide with folding and git decorations
        if (gutterOffsetX > 14) {
            return null;
        }
        return { lineNumber: range.startLineNumber };
    }
    exports.parseMouseDownInfoFromEvent = parseMouseDownInfoFromEvent;
    function isMouseUpEventMatchMouseDown(mouseDownInfo, e) {
        if (!mouseDownInfo) {
            return null;
        }
        const { lineNumber } = mouseDownInfo;
        const range = e.target.range;
        if (!range || range.startLineNumber !== lineNumber) {
            return null;
        }
        if (e.target.type !== 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */) {
            return null;
        }
        return lineNumber;
    }
    exports.isMouseUpEventMatchMouseDown = isMouseUpEventMatchMouseDown;
    let ReviewZoneWidget = class ReviewZoneWidget extends zoneWidget_1.ZoneWidget {
        constructor(editor, _owner, _commentThread, _pendingComment, instantiationService, themeService, commentService, contextKeyService) {
            super(editor, { keepEditorSelection: true });
            this._owner = _owner;
            this._commentThread = _commentThread;
            this._pendingComment = _pendingComment;
            this.themeService = themeService;
            this.commentService = commentService;
            this._onDidClose = new event_1.Emitter();
            this._onDidCreateThread = new event_1.Emitter();
            this._globalToDispose = new lifecycle_1.DisposableStore();
            this._commentThreadDisposables = [];
            this.mouseDownInfo = null;
            this._contextKeyService = contextKeyService.createScoped(this.domNode);
            this._scopedInstantiationService = instantiationService.createChild(new serviceCollection_1.ServiceCollection([contextkey_1.IContextKeyService, this._contextKeyService]));
            const controller = this.commentService.getCommentController(this._owner);
            if (controller) {
                this._commentOptions = controller.options;
            }
            this._isExpanded = _commentThread.collapsibleState === languages.CommentThreadCollapsibleState.Expanded;
            this._commentThreadDisposables = [];
            this.create();
            this._globalToDispose.add(this.themeService.onDidColorThemeChange(this._applyTheme, this));
            this._globalToDispose.add(this.editor.onDidChangeConfiguration(e => {
                if (e.hasChanged(44 /* EditorOption.fontInfo */)) {
                    this._applyTheme(this.themeService.getColorTheme());
                }
            }));
            this._applyTheme(this.themeService.getColorTheme());
        }
        get owner() {
            return this._owner;
        }
        get commentThread() {
            return this._commentThread;
        }
        get onDidClose() {
            return this._onDidClose.event;
        }
        get onDidCreateThread() {
            return this._onDidCreateThread.event;
        }
        getPosition() {
            if (this.position) {
                return this.position;
            }
            if (this._commentGlyph) {
                return (0, types_1.withNullAsUndefined)(this._commentGlyph.getPosition().position);
            }
            return undefined;
        }
        revealLine(lineNumber) {
            // we don't do anything here as we always do the reveal ourselves.
        }
        reveal(commentUniqueId, focus = false) {
            if (!this._isExpanded) {
                this.show({ lineNumber: this._commentThread.range.startLineNumber, column: 1 }, 2);
            }
            if (commentUniqueId !== undefined) {
                let height = this.editor.getLayoutInfo().height;
                const coords = this._commentThreadWidget.getCommentCoords(commentUniqueId);
                if (coords) {
                    const commentThreadCoords = coords.thread;
                    const commentCoords = coords.comment;
                    this.editor.setScrollTop(this.editor.getTopForLineNumber(this._commentThread.range.startLineNumber) - height / 2 + commentCoords.top - commentThreadCoords.top);
                    return;
                }
            }
            this.editor.revealRangeInCenter(this._commentThread.range);
            if (focus) {
                this._commentThreadWidget.focus();
            }
        }
        getPendingComment() {
            return this._commentThreadWidget.getPendingComment();
        }
        _fillContainer(container) {
            this.setCssClass('review-widget');
            this._commentThreadWidget = this._scopedInstantiationService.createInstance(commentThreadWidget_1.CommentThreadWidget, container, this._owner, this.editor.getModel().uri, this._contextKeyService, this._scopedInstantiationService, this._commentThread, this._pendingComment, { editor: this.editor, codeBlockFontSize: '' }, this._commentOptions, {
                actionRunner: () => {
                    if (!this._commentThread.comments || !this._commentThread.comments.length) {
                        let newPosition = this.getPosition();
                        if (newPosition) {
                            let range;
                            const originalRange = this._commentThread.range;
                            if (newPosition.lineNumber !== originalRange.endLineNumber) {
                                // The widget could have moved as a result of editor changes.
                                // We need to try to calculate the new, more correct, range for the comment.
                                const distance = newPosition.lineNumber - this._commentThread.range.endLineNumber;
                                range = new range_1.Range(originalRange.startLineNumber + distance, originalRange.startColumn, originalRange.endLineNumber + distance, originalRange.endColumn);
                            }
                            else {
                                range = new range_1.Range(originalRange.startLineNumber, originalRange.startColumn, originalRange.endLineNumber, originalRange.endColumn);
                            }
                            this.commentService.updateCommentThreadTemplate(this.owner, this._commentThread.commentThreadHandle, range);
                        }
                    }
                },
                collapse: () => {
                    this.collapse();
                }
            });
            this._disposables.add(this._commentThreadWidget);
        }
        deleteCommentThread() {
            this.dispose();
            this.commentService.disposeCommentThread(this.owner, this._commentThread.threadId);
        }
        collapse() {
            this._commentThread.collapsibleState = languages.CommentThreadCollapsibleState.Collapsed;
            if (this._commentThread.comments && this._commentThread.comments.length === 0) {
                this.deleteCommentThread();
                return Promise.resolve();
            }
            this.hide();
            return Promise.resolve();
        }
        getGlyphPosition() {
            if (this._commentGlyph) {
                return this._commentGlyph.getPosition().position.lineNumber;
            }
            return 0;
        }
        toggleExpand(lineNumber) {
            if (this._isExpanded) {
                this._commentThread.collapsibleState = languages.CommentThreadCollapsibleState.Collapsed;
                this.hide();
                if (!this._commentThread.comments || !this._commentThread.comments.length) {
                    this.deleteCommentThread();
                }
            }
            else {
                this._commentThread.collapsibleState = languages.CommentThreadCollapsibleState.Expanded;
                this.show({ lineNumber: lineNumber, column: 1 }, 2);
            }
        }
        async update(commentThread) {
            if (this._commentThread !== commentThread) {
                this._commentThreadDisposables.forEach(disposable => disposable.dispose());
                this._commentThread = commentThread;
                this._commentThreadDisposables = [];
                this.bindCommentThreadListeners();
            }
            this._commentThreadWidget.updateCommentThread(commentThread);
            // Move comment glyph widget and show position if the line has changed.
            const lineNumber = this._commentThread.range.endLineNumber;
            let shouldMoveWidget = false;
            if (this._commentGlyph) {
                if (this._commentGlyph.getPosition().position.lineNumber !== lineNumber) {
                    shouldMoveWidget = true;
                    this._commentGlyph.setLineNumber(lineNumber);
                }
            }
            if (shouldMoveWidget && this._isExpanded) {
                this.show({ lineNumber, column: 1 }, 2);
            }
            if (this._commentThread.collapsibleState === languages.CommentThreadCollapsibleState.Expanded) {
                this.show({ lineNumber, column: 1 }, 2);
            }
            else {
                this.hide();
            }
        }
        _onWidth(widthInPixel) {
            this._commentThreadWidget.layout(widthInPixel);
        }
        _doLayout(heightInPixel, widthInPixel) {
            this._commentThreadWidget.layout(widthInPixel);
        }
        display(lineNumber) {
            this._commentGlyph = new commentGlyphWidget_1.CommentGlyphWidget(this.editor, lineNumber);
            this._disposables.add(this.editor.onMouseDown(e => this.onEditorMouseDown(e)));
            this._disposables.add(this.editor.onMouseUp(e => this.onEditorMouseUp(e)));
            this._commentThreadWidget.display(this.editor.getOption(59 /* EditorOption.lineHeight */));
            this._disposables.add(this._commentThreadWidget.onDidResize(dimension => {
                this._refresh(dimension);
            }));
            if (this._commentThread.collapsibleState === languages.CommentThreadCollapsibleState.Expanded) {
                this.show({ lineNumber: lineNumber, column: 1 }, 2);
            }
            this.bindCommentThreadListeners();
        }
        bindCommentThreadListeners() {
            this._commentThreadDisposables.push(this._commentThread.onDidChangeComments(async (_) => {
                await this.update(this._commentThread);
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeRange(range => {
                // Move comment glyph widget and show position if the line has changed.
                const lineNumber = this._commentThread.range.startLineNumber;
                let shouldMoveWidget = false;
                if (this._commentGlyph) {
                    if (this._commentGlyph.getPosition().position.lineNumber !== lineNumber) {
                        shouldMoveWidget = true;
                        this._commentGlyph.setLineNumber(lineNumber);
                    }
                }
                if (shouldMoveWidget && this._isExpanded) {
                    this.show({ lineNumber, column: 1 }, 2);
                }
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeCollasibleState(state => {
                if (state === languages.CommentThreadCollapsibleState.Expanded && !this._isExpanded) {
                    const lineNumber = this._commentThread.range.startLineNumber;
                    this.show({ lineNumber, column: 1 }, 2);
                    return;
                }
                if (state === languages.CommentThreadCollapsibleState.Collapsed && this._isExpanded) {
                    this.hide();
                    return;
                }
            }));
            this._commentThreadDisposables.push(this._commentThread.onDidChangeState(() => {
                var _a, _b;
                const borderColor = getCommentThreadWidgetStateColor(this._commentThread.state, this.themeService.getColorTheme()) || color_1.Color.transparent;
                this.style({
                    frameColor: borderColor,
                    arrowColor: borderColor,
                });
                (_a = this.container) === null || _a === void 0 ? void 0 : _a.style.setProperty(commentColors_1.commentThreadStateColorVar, `${borderColor}`);
                (_b = this.container) === null || _b === void 0 ? void 0 : _b.style.setProperty(commentColors_1.commentThreadStateBackgroundColorVar, `${borderColor.transparent(.1)}`);
            }));
        }
        async submitComment() {
            this._commentThreadWidget.submitComment();
        }
        _refresh(dimensions) {
            var _a;
            if (this._isExpanded && dimensions) {
                this._commentThreadWidget.layout();
                const headHeight = Math.ceil(this.editor.getOption(59 /* EditorOption.lineHeight */) * 1.2);
                const lineHeight = this.editor.getOption(59 /* EditorOption.lineHeight */);
                const arrowHeight = Math.round(lineHeight / 3);
                const frameThickness = Math.round(lineHeight / 9) * 2;
                const computedLinesNumber = Math.ceil((headHeight + dimensions.height + arrowHeight + frameThickness + 8 /** margin bottom to avoid margin collapse */) / lineHeight);
                if (((_a = this._viewZone) === null || _a === void 0 ? void 0 : _a.heightInLines) === computedLinesNumber) {
                    return;
                }
                let currentPosition = this.getPosition();
                if (this._viewZone && currentPosition && currentPosition.lineNumber !== this._viewZone.afterLineNumber) {
                    this._viewZone.afterLineNumber = currentPosition.lineNumber;
                }
                if (!this._commentThread.comments || !this._commentThread.comments.length) {
                    this._commentThreadWidget.focusCommentEditor();
                }
                this._relayout(computedLinesNumber);
            }
        }
        onEditorMouseDown(e) {
            this.mouseDownInfo = parseMouseDownInfoFromEvent(e);
        }
        onEditorMouseUp(e) {
            const matchedLineNumber = isMouseUpEventMatchMouseDown(this.mouseDownInfo, e);
            this.mouseDownInfo = null;
            if (matchedLineNumber === null || !e.target.element) {
                return;
            }
            if (this._commentGlyph && this._commentGlyph.getPosition().position.lineNumber !== matchedLineNumber) {
                return;
            }
            if (e.target.element.className.indexOf('comment-thread') >= 0) {
                this.toggleExpand(matchedLineNumber);
            }
        }
        _applyTheme(theme) {
            const borderColor = getCommentThreadWidgetStateColor(this._commentThread.state, this.themeService.getColorTheme()) || color_1.Color.transparent;
            this.style({
                arrowColor: borderColor,
                frameColor: borderColor
            });
            const fontInfo = this.editor.getOption(44 /* EditorOption.fontInfo */);
            // Editor decorations should also be responsive to theme changes
            this._commentThreadWidget.applyTheme(theme, fontInfo);
        }
        show(rangeOrPos, heightInLines) {
            this._isExpanded = true;
            super.show(rangeOrPos, heightInLines);
            this._refresh(this._commentThreadWidget.getDimensions());
        }
        hide() {
            if (this._isExpanded) {
                this._isExpanded = false;
                // Focus the container so that the comment editor will be blurred before it is hidden
                if (this.editor.hasWidgetFocus()) {
                    this.editor.focus();
                }
            }
            super.hide();
        }
        dispose() {
            super.dispose();
            if (this._commentGlyph) {
                this._commentGlyph.dispose();
                this._commentGlyph = undefined;
            }
            this._globalToDispose.dispose();
            this._commentThreadDisposables.forEach(global => global.dispose());
            this._onDidClose.fire(undefined);
        }
    };
    ReviewZoneWidget = __decorate([
        __param(4, instantiation_1.IInstantiationService),
        __param(5, themeService_1.IThemeService),
        __param(6, commentService_1.ICommentService),
        __param(7, contextkey_1.IContextKeyService)
    ], ReviewZoneWidget);
    exports.ReviewZoneWidget = ReviewZoneWidget;
});
//# sourceMappingURL=commentThreadZoneWidget.js.map