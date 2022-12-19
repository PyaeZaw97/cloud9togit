/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/mouseEvent", "vs/base/browser/ui/scrollbar/abstractScrollbar", "vs/base/browser/ui/scrollbar/scrollbarArrow", "vs/base/browser/ui/scrollbar/scrollbarState", "vs/base/common/codicons"], function (require, exports, mouseEvent_1, abstractScrollbar_1, scrollbarArrow_1, scrollbarState_1, codicons_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VerticalScrollbar = void 0;
    class VerticalScrollbar extends abstractScrollbar_1.AbstractScrollbar {
        constructor(scrollable, options, host) {
            const scrollDimensions = scrollable.getScrollDimensions();
            const scrollPosition = scrollable.getCurrentScrollPosition();
            super({
                lazyRender: options.lazyRender,
                host: host,
                scrollbarState: new scrollbarState_1.ScrollbarState((options.verticalHasArrows ? options.arrowSize : 0), (options.vertical === 2 /* ScrollbarVisibility.Hidden */ ? 0 : options.verticalScrollbarSize), 
                // give priority to vertical scroll bar over horizontal and let it scroll all the way to the bottom
                0, scrollDimensions.height, scrollDimensions.scrollHeight, scrollPosition.scrollTop),
                visibility: options.vertical,
                extraScrollbarClassName: 'vertical',
                scrollable: scrollable,
                scrollByPage: options.scrollByPage
            });
            if (options.verticalHasArrows) {
                const arrowDelta = (options.arrowSize - scrollbarArrow_1.ARROW_IMG_SIZE) / 2;
                const scrollbarDelta = (options.verticalScrollbarSize - scrollbarArrow_1.ARROW_IMG_SIZE) / 2;
                this._createArrow({
                    className: 'scra',
                    icon: codicons_1.Codicon.scrollbarButtonUp,
                    top: arrowDelta,
                    left: scrollbarDelta,
                    bottom: undefined,
                    right: undefined,
                    bgWidth: options.verticalScrollbarSize,
                    bgHeight: options.arrowSize,
                    onActivate: () => this._host.onMouseWheel(new mouseEvent_1.StandardWheelEvent(null, 0, 1)),
                });
                this._createArrow({
                    className: 'scra',
                    icon: codicons_1.Codicon.scrollbarButtonDown,
                    top: undefined,
                    left: scrollbarDelta,
                    bottom: arrowDelta,
                    right: undefined,
                    bgWidth: options.verticalScrollbarSize,
                    bgHeight: options.arrowSize,
                    onActivate: () => this._host.onMouseWheel(new mouseEvent_1.StandardWheelEvent(null, 0, -1)),
                });
            }
            this._createSlider(0, Math.floor((options.verticalScrollbarSize - options.verticalSliderSize) / 2), options.verticalSliderSize, undefined);
        }
        _updateSlider(sliderSize, sliderPosition) {
            this.slider.setHeight(sliderSize);
            this.slider.setTop(sliderPosition);
        }
        _renderDomNode(largeSize, smallSize) {
            this.domNode.setWidth(smallSize);
            this.domNode.setHeight(largeSize);
            this.domNode.setRight(0);
            this.domNode.setTop(0);
        }
        onDidScroll(e) {
            this._shouldRender = this._onElementScrollSize(e.scrollHeight) || this._shouldRender;
            this._shouldRender = this._onElementScrollPosition(e.scrollTop) || this._shouldRender;
            this._shouldRender = this._onElementSize(e.height) || this._shouldRender;
            return this._shouldRender;
        }
        _pointerDownRelativePosition(offsetX, offsetY) {
            return offsetY;
        }
        _sliderPointerPosition(e) {
            return e.pageY;
        }
        _sliderOrthogonalPointerPosition(e) {
            return e.pageX;
        }
        _updateScrollbarSize(size) {
            this.slider.setWidth(size);
        }
        writeScrollPosition(target, scrollPosition) {
            target.scrollTop = scrollPosition;
        }
        updateOptions(options) {
            this.updateScrollbarSize(options.vertical === 2 /* ScrollbarVisibility.Hidden */ ? 0 : options.verticalScrollbarSize);
            // give priority to vertical scroll bar over horizontal and let it scroll all the way to the bottom
            this._scrollbarState.setOppositeScrollbarSize(0);
            this._visibilityController.setVisibility(options.vertical);
            this._scrollByPage = options.scrollByPage;
        }
    }
    exports.VerticalScrollbar = VerticalScrollbar;
});
//# sourceMappingURL=verticalScrollbar.js.map