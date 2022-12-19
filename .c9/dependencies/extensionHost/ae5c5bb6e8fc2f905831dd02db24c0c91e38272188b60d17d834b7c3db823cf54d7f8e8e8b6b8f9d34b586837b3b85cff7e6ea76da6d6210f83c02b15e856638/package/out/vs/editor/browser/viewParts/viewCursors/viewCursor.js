/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/fastDomNode", "vs/base/common/strings", "vs/editor/browser/config/domFontInfo", "vs/editor/common/config/editorOptions", "vs/editor/common/core/position", "vs/editor/common/core/range", "vs/base/browser/ui/mouseCursor/mouseCursor"], function (require, exports, dom, fastDomNode_1, strings, domFontInfo_1, editorOptions_1, position_1, range_1, mouseCursor_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewCursor = void 0;
    class ViewCursorRenderData {
        constructor(top, left, width, height, textContent, textContentClassName) {
            this.top = top;
            this.left = left;
            this.width = width;
            this.height = height;
            this.textContent = textContent;
            this.textContentClassName = textContentClassName;
        }
    }
    class ViewCursor {
        constructor(context) {
            this._context = context;
            const options = this._context.configuration.options;
            const fontInfo = options.get(44 /* EditorOption.fontInfo */);
            this._cursorStyle = options.get(24 /* EditorOption.cursorStyle */);
            this._lineHeight = options.get(59 /* EditorOption.lineHeight */);
            this._typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            this._lineCursorWidth = Math.min(options.get(27 /* EditorOption.cursorWidth */), this._typicalHalfwidthCharacterWidth);
            this._isVisible = true;
            // Create the dom node
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._domNode.setClassName(`cursor ${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME}`);
            this._domNode.setHeight(this._lineHeight);
            this._domNode.setTop(0);
            this._domNode.setLeft(0);
            (0, domFontInfo_1.applyFontInfo)(this._domNode, fontInfo);
            this._domNode.setDisplay('none');
            this._position = new position_1.Position(1, 1);
            this._lastRenderedContent = '';
            this._renderData = null;
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return this._position;
        }
        show() {
            if (!this._isVisible) {
                this._domNode.setVisibility('inherit');
                this._isVisible = true;
            }
        }
        hide() {
            if (this._isVisible) {
                this._domNode.setVisibility('hidden');
                this._isVisible = false;
            }
        }
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            const fontInfo = options.get(44 /* EditorOption.fontInfo */);
            this._cursorStyle = options.get(24 /* EditorOption.cursorStyle */);
            this._lineHeight = options.get(59 /* EditorOption.lineHeight */);
            this._typicalHalfwidthCharacterWidth = fontInfo.typicalHalfwidthCharacterWidth;
            this._lineCursorWidth = Math.min(options.get(27 /* EditorOption.cursorWidth */), this._typicalHalfwidthCharacterWidth);
            (0, domFontInfo_1.applyFontInfo)(this._domNode, fontInfo);
            return true;
        }
        onCursorPositionChanged(position) {
            this._position = position;
            return true;
        }
        /**
         * If `this._position` is inside a grapheme, returns the position where the grapheme starts.
         * Also returns the next grapheme.
         */
        _getGraphemeAwarePosition() {
            const { lineNumber, column } = this._position;
            const lineContent = this._context.viewModel.getLineContent(lineNumber);
            const [startOffset, endOffset] = strings.getCharContainingOffset(lineContent, column - 1);
            return [new position_1.Position(lineNumber, startOffset + 1), lineContent.substring(startOffset, endOffset)];
        }
        _prepareRender(ctx) {
            let textContent = '';
            const [position, nextGrapheme] = this._getGraphemeAwarePosition();
            if (this._cursorStyle === editorOptions_1.TextEditorCursorStyle.Line || this._cursorStyle === editorOptions_1.TextEditorCursorStyle.LineThin) {
                const visibleRange = ctx.visibleRangeForPosition(position);
                if (!visibleRange || visibleRange.outsideRenderedLine) {
                    // Outside viewport
                    return null;
                }
                let width;
                if (this._cursorStyle === editorOptions_1.TextEditorCursorStyle.Line) {
                    width = dom.computeScreenAwareSize(this._lineCursorWidth > 0 ? this._lineCursorWidth : 2);
                    if (width > 2) {
                        textContent = nextGrapheme;
                    }
                }
                else {
                    width = dom.computeScreenAwareSize(1);
                }
                let left = visibleRange.left;
                if (width >= 2 && left >= 1) {
                    // try to center cursor
                    left -= 1;
                }
                const top = ctx.getVerticalOffsetForLineNumber(position.lineNumber) - ctx.bigNumbersDelta;
                return new ViewCursorRenderData(top, left, width, this._lineHeight, textContent, '');
            }
            const visibleRangeForCharacter = ctx.linesVisibleRangesForRange(new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column + nextGrapheme.length), false);
            if (!visibleRangeForCharacter || visibleRangeForCharacter.length === 0) {
                // Outside viewport
                return null;
            }
            const firstVisibleRangeForCharacter = visibleRangeForCharacter[0];
            if (firstVisibleRangeForCharacter.outsideRenderedLine || firstVisibleRangeForCharacter.ranges.length === 0) {
                // Outside viewport
                return null;
            }
            const range = firstVisibleRangeForCharacter.ranges[0];
            const width = range.width < 1 ? this._typicalHalfwidthCharacterWidth : range.width;
            let textContentClassName = '';
            if (this._cursorStyle === editorOptions_1.TextEditorCursorStyle.Block) {
                const lineData = this._context.viewModel.getViewLineData(position.lineNumber);
                textContent = nextGrapheme;
                const tokenIndex = lineData.tokens.findTokenIndexAtOffset(position.column - 1);
                textContentClassName = lineData.tokens.getClassName(tokenIndex);
            }
            let top = ctx.getVerticalOffsetForLineNumber(position.lineNumber) - ctx.bigNumbersDelta;
            let height = this._lineHeight;
            // Underline might interfere with clicking
            if (this._cursorStyle === editorOptions_1.TextEditorCursorStyle.Underline || this._cursorStyle === editorOptions_1.TextEditorCursorStyle.UnderlineThin) {
                top += this._lineHeight - 2;
                height = 2;
            }
            return new ViewCursorRenderData(top, range.left, width, height, textContent, textContentClassName);
        }
        prepareRender(ctx) {
            this._renderData = this._prepareRender(ctx);
        }
        render(ctx) {
            if (!this._renderData) {
                this._domNode.setDisplay('none');
                return null;
            }
            if (this._lastRenderedContent !== this._renderData.textContent) {
                this._lastRenderedContent = this._renderData.textContent;
                this._domNode.domNode.textContent = this._lastRenderedContent;
            }
            this._domNode.setClassName(`cursor ${mouseCursor_1.MOUSE_CURSOR_TEXT_CSS_CLASS_NAME} ${this._renderData.textContentClassName}`);
            this._domNode.setDisplay('block');
            this._domNode.setTop(this._renderData.top);
            this._domNode.setLeft(this._renderData.left);
            this._domNode.setWidth(this._renderData.width);
            this._domNode.setLineHeight(this._renderData.height);
            this._domNode.setHeight(this._renderData.height);
            return {
                domNode: this._domNode.domNode,
                position: this._position,
                contentLeft: this._renderData.left,
                height: this._renderData.height,
                width: 2
            };
        }
    }
    exports.ViewCursor = ViewCursor;
});
//# sourceMappingURL=viewCursor.js.map