/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/fastDomNode", "vs/base/common/async", "vs/editor/browser/view/viewPart", "vs/editor/browser/viewParts/viewCursors/viewCursor", "vs/editor/common/config/editorOptions", "vs/editor/common/core/editorColorRegistry", "vs/platform/theme/common/themeService", "vs/platform/theme/common/theme", "vs/css!./viewCursors"], function (require, exports, fastDomNode_1, async_1, viewPart_1, viewCursor_1, editorOptions_1, editorColorRegistry_1, themeService_1, theme_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewCursors = void 0;
    class ViewCursors extends viewPart_1.ViewPart {
        constructor(context) {
            super(context);
            const options = this._context.configuration.options;
            this._readOnly = options.get(81 /* EditorOption.readOnly */);
            this._cursorBlinking = options.get(22 /* EditorOption.cursorBlinking */);
            this._cursorStyle = options.get(24 /* EditorOption.cursorStyle */);
            this._cursorSmoothCaretAnimation = options.get(23 /* EditorOption.cursorSmoothCaretAnimation */);
            this._selectionIsEmpty = true;
            this._isComposingInput = false;
            this._isVisible = false;
            this._primaryCursor = new viewCursor_1.ViewCursor(this._context);
            this._secondaryCursors = [];
            this._renderData = [];
            this._domNode = (0, fastDomNode_1.createFastDomNode)(document.createElement('div'));
            this._domNode.setAttribute('role', 'presentation');
            this._domNode.setAttribute('aria-hidden', 'true');
            this._updateDomClassName();
            this._domNode.appendChild(this._primaryCursor.getDomNode());
            this._startCursorBlinkAnimation = new async_1.TimeoutTimer();
            this._cursorFlatBlinkInterval = new async_1.IntervalTimer();
            this._blinkingEnabled = false;
            this._editorHasFocus = false;
            this._updateBlinking();
        }
        dispose() {
            super.dispose();
            this._startCursorBlinkAnimation.dispose();
            this._cursorFlatBlinkInterval.dispose();
        }
        getDomNode() {
            return this._domNode;
        }
        // --- begin event handlers
        onCompositionStart(e) {
            this._isComposingInput = true;
            this._updateBlinking();
            return true;
        }
        onCompositionEnd(e) {
            this._isComposingInput = false;
            this._updateBlinking();
            return true;
        }
        onConfigurationChanged(e) {
            const options = this._context.configuration.options;
            this._readOnly = options.get(81 /* EditorOption.readOnly */);
            this._cursorBlinking = options.get(22 /* EditorOption.cursorBlinking */);
            this._cursorStyle = options.get(24 /* EditorOption.cursorStyle */);
            this._cursorSmoothCaretAnimation = options.get(23 /* EditorOption.cursorSmoothCaretAnimation */);
            this._updateBlinking();
            this._updateDomClassName();
            this._primaryCursor.onConfigurationChanged(e);
            for (let i = 0, len = this._secondaryCursors.length; i < len; i++) {
                this._secondaryCursors[i].onConfigurationChanged(e);
            }
            return true;
        }
        _onCursorPositionChanged(position, secondaryPositions) {
            this._primaryCursor.onCursorPositionChanged(position);
            this._updateBlinking();
            if (this._secondaryCursors.length < secondaryPositions.length) {
                // Create new cursors
                const addCnt = secondaryPositions.length - this._secondaryCursors.length;
                for (let i = 0; i < addCnt; i++) {
                    const newCursor = new viewCursor_1.ViewCursor(this._context);
                    this._domNode.domNode.insertBefore(newCursor.getDomNode().domNode, this._primaryCursor.getDomNode().domNode.nextSibling);
                    this._secondaryCursors.push(newCursor);
                }
            }
            else if (this._secondaryCursors.length > secondaryPositions.length) {
                // Remove some cursors
                const removeCnt = this._secondaryCursors.length - secondaryPositions.length;
                for (let i = 0; i < removeCnt; i++) {
                    this._domNode.removeChild(this._secondaryCursors[0].getDomNode());
                    this._secondaryCursors.splice(0, 1);
                }
            }
            for (let i = 0; i < secondaryPositions.length; i++) {
                this._secondaryCursors[i].onCursorPositionChanged(secondaryPositions[i]);
            }
        }
        onCursorStateChanged(e) {
            const positions = [];
            for (let i = 0, len = e.selections.length; i < len; i++) {
                positions[i] = e.selections[i].getPosition();
            }
            this._onCursorPositionChanged(positions[0], positions.slice(1));
            const selectionIsEmpty = e.selections[0].isEmpty();
            if (this._selectionIsEmpty !== selectionIsEmpty) {
                this._selectionIsEmpty = selectionIsEmpty;
                this._updateDomClassName();
            }
            return true;
        }
        onDecorationsChanged(e) {
            // true for inline decorations that can end up relayouting text
            return true;
        }
        onFlushed(e) {
            return true;
        }
        onFocusChanged(e) {
            this._editorHasFocus = e.isFocused;
            this._updateBlinking();
            return false;
        }
        onLinesChanged(e) {
            return true;
        }
        onLinesDeleted(e) {
            return true;
        }
        onLinesInserted(e) {
            return true;
        }
        onScrollChanged(e) {
            return true;
        }
        onTokensChanged(e) {
            const shouldRender = (position) => {
                for (let i = 0, len = e.ranges.length; i < len; i++) {
                    if (e.ranges[i].fromLineNumber <= position.lineNumber && position.lineNumber <= e.ranges[i].toLineNumber) {
                        return true;
                    }
                }
                return false;
            };
            if (shouldRender(this._primaryCursor.getPosition())) {
                return true;
            }
            for (const secondaryCursor of this._secondaryCursors) {
                if (shouldRender(secondaryCursor.getPosition())) {
                    return true;
                }
            }
            return false;
        }
        onZonesChanged(e) {
            return true;
        }
        // --- end event handlers
        // ---- blinking logic
        _getCursorBlinking() {
            if (this._isComposingInput) {
                // avoid double cursors
                return 0 /* TextEditorCursorBlinkingStyle.Hidden */;
            }
            if (!this._editorHasFocus) {
                return 0 /* TextEditorCursorBlinkingStyle.Hidden */;
            }
            if (this._readOnly) {
                return 5 /* TextEditorCursorBlinkingStyle.Solid */;
            }
            return this._cursorBlinking;
        }
        _updateBlinking() {
            this._startCursorBlinkAnimation.cancel();
            this._cursorFlatBlinkInterval.cancel();
            const blinkingStyle = this._getCursorBlinking();
            // hidden and solid are special as they involve no animations
            const isHidden = (blinkingStyle === 0 /* TextEditorCursorBlinkingStyle.Hidden */);
            const isSolid = (blinkingStyle === 5 /* TextEditorCursorBlinkingStyle.Solid */);
            if (isHidden) {
                this._hide();
            }
            else {
                this._show();
            }
            this._blinkingEnabled = false;
            this._updateDomClassName();
            if (!isHidden && !isSolid) {
                if (blinkingStyle === 1 /* TextEditorCursorBlinkingStyle.Blink */) {
                    // flat blinking is handled by JavaScript to save battery life due to Chromium step timing issue https://bugs.chromium.org/p/chromium/issues/detail?id=361587
                    this._cursorFlatBlinkInterval.cancelAndSet(() => {
                        if (this._isVisible) {
                            this._hide();
                        }
                        else {
                            this._show();
                        }
                    }, ViewCursors.BLINK_INTERVAL);
                }
                else {
                    this._startCursorBlinkAnimation.setIfNotSet(() => {
                        this._blinkingEnabled = true;
                        this._updateDomClassName();
                    }, ViewCursors.BLINK_INTERVAL);
                }
            }
        }
        // --- end blinking logic
        _updateDomClassName() {
            this._domNode.setClassName(this._getClassName());
        }
        _getClassName() {
            let result = 'cursors-layer';
            if (!this._selectionIsEmpty) {
                result += ' has-selection';
            }
            switch (this._cursorStyle) {
                case editorOptions_1.TextEditorCursorStyle.Line:
                    result += ' cursor-line-style';
                    break;
                case editorOptions_1.TextEditorCursorStyle.Block:
                    result += ' cursor-block-style';
                    break;
                case editorOptions_1.TextEditorCursorStyle.Underline:
                    result += ' cursor-underline-style';
                    break;
                case editorOptions_1.TextEditorCursorStyle.LineThin:
                    result += ' cursor-line-thin-style';
                    break;
                case editorOptions_1.TextEditorCursorStyle.BlockOutline:
                    result += ' cursor-block-outline-style';
                    break;
                case editorOptions_1.TextEditorCursorStyle.UnderlineThin:
                    result += ' cursor-underline-thin-style';
                    break;
                default:
                    result += ' cursor-line-style';
            }
            if (this._blinkingEnabled) {
                switch (this._getCursorBlinking()) {
                    case 1 /* TextEditorCursorBlinkingStyle.Blink */:
                        result += ' cursor-blink';
                        break;
                    case 2 /* TextEditorCursorBlinkingStyle.Smooth */:
                        result += ' cursor-smooth';
                        break;
                    case 3 /* TextEditorCursorBlinkingStyle.Phase */:
                        result += ' cursor-phase';
                        break;
                    case 4 /* TextEditorCursorBlinkingStyle.Expand */:
                        result += ' cursor-expand';
                        break;
                    case 5 /* TextEditorCursorBlinkingStyle.Solid */:
                        result += ' cursor-solid';
                        break;
                    default:
                        result += ' cursor-solid';
                }
            }
            else {
                result += ' cursor-solid';
            }
            if (this._cursorSmoothCaretAnimation) {
                result += ' cursor-smooth-caret-animation';
            }
            return result;
        }
        _show() {
            this._primaryCursor.show();
            for (let i = 0, len = this._secondaryCursors.length; i < len; i++) {
                this._secondaryCursors[i].show();
            }
            this._isVisible = true;
        }
        _hide() {
            this._primaryCursor.hide();
            for (let i = 0, len = this._secondaryCursors.length; i < len; i++) {
                this._secondaryCursors[i].hide();
            }
            this._isVisible = false;
        }
        // ---- IViewPart implementation
        prepareRender(ctx) {
            this._primaryCursor.prepareRender(ctx);
            for (let i = 0, len = this._secondaryCursors.length; i < len; i++) {
                this._secondaryCursors[i].prepareRender(ctx);
            }
        }
        render(ctx) {
            const renderData = [];
            let renderDataLen = 0;
            const primaryRenderData = this._primaryCursor.render(ctx);
            if (primaryRenderData) {
                renderData[renderDataLen++] = primaryRenderData;
            }
            for (let i = 0, len = this._secondaryCursors.length; i < len; i++) {
                const secondaryRenderData = this._secondaryCursors[i].render(ctx);
                if (secondaryRenderData) {
                    renderData[renderDataLen++] = secondaryRenderData;
                }
            }
            this._renderData = renderData;
        }
        getLastRenderData() {
            return this._renderData;
        }
    }
    exports.ViewCursors = ViewCursors;
    ViewCursors.BLINK_INTERVAL = 500;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const caret = theme.getColor(editorColorRegistry_1.editorCursorForeground);
        if (caret) {
            let caretBackground = theme.getColor(editorColorRegistry_1.editorCursorBackground);
            if (!caretBackground) {
                caretBackground = caret.opposite();
            }
            collector.addRule(`.monaco-editor .inputarea.ime-input { caret-color: ${caret}; }`);
            collector.addRule(`.monaco-editor .cursors-layer .cursor { background-color: ${caret}; border-color: ${caret}; color: ${caretBackground}; }`);
            if ((0, theme_1.isHighContrast)(theme.type)) {
                collector.addRule(`.monaco-editor .cursors-layer.has-selection .cursor { border-left: 1px solid ${caretBackground}; border-right: 1px solid ${caretBackground}; }`);
            }
        }
    });
});
//# sourceMappingURL=viewCursors.js.map