/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.VisibleRanges = exports.HorizontalPosition = exports.FloatHorizontalRange = exports.HorizontalRange = exports.LineVisibleRanges = exports.RenderingContext = exports.RestrictedRenderingContext = void 0;
    class RestrictedRenderingContext {
        constructor(viewLayout, viewportData) {
            this._restrictedRenderingContextBrand = undefined;
            this._viewLayout = viewLayout;
            this.viewportData = viewportData;
            this.scrollWidth = this._viewLayout.getScrollWidth();
            this.scrollHeight = this._viewLayout.getScrollHeight();
            this.visibleRange = this.viewportData.visibleRange;
            this.bigNumbersDelta = this.viewportData.bigNumbersDelta;
            const vInfo = this._viewLayout.getCurrentViewport();
            this.scrollTop = vInfo.top;
            this.scrollLeft = vInfo.left;
            this.viewportWidth = vInfo.width;
            this.viewportHeight = vInfo.height;
        }
        getScrolledTopFromAbsoluteTop(absoluteTop) {
            return absoluteTop - this.scrollTop;
        }
        getVerticalOffsetForLineNumber(lineNumber) {
            return this._viewLayout.getVerticalOffsetForLineNumber(lineNumber);
        }
        getDecorationsInViewport() {
            return this.viewportData.getDecorationsInViewport();
        }
    }
    exports.RestrictedRenderingContext = RestrictedRenderingContext;
    class RenderingContext extends RestrictedRenderingContext {
        constructor(viewLayout, viewportData, viewLines) {
            super(viewLayout, viewportData);
            this._renderingContextBrand = undefined;
            this._viewLines = viewLines;
        }
        linesVisibleRangesForRange(range, includeNewLines) {
            return this._viewLines.linesVisibleRangesForRange(range, includeNewLines);
        }
        visibleRangeForPosition(position) {
            return this._viewLines.visibleRangeForPosition(position);
        }
    }
    exports.RenderingContext = RenderingContext;
    class LineVisibleRanges {
        constructor(outsideRenderedLine, lineNumber, ranges) {
            this.outsideRenderedLine = outsideRenderedLine;
            this.lineNumber = lineNumber;
            this.ranges = ranges;
        }
    }
    exports.LineVisibleRanges = LineVisibleRanges;
    class HorizontalRange {
        constructor(left, width) {
            this._horizontalRangeBrand = undefined;
            this.left = Math.round(left);
            this.width = Math.round(width);
        }
        static from(ranges) {
            const result = new Array(ranges.length);
            for (let i = 0, len = ranges.length; i < len; i++) {
                const range = ranges[i];
                result[i] = new HorizontalRange(range.left, range.width);
            }
            return result;
        }
        toString() {
            return `[${this.left},${this.width}]`;
        }
    }
    exports.HorizontalRange = HorizontalRange;
    class FloatHorizontalRange {
        constructor(left, width) {
            this._floatHorizontalRangeBrand = undefined;
            this.left = left;
            this.width = width;
        }
        toString() {
            return `[${this.left},${this.width}]`;
        }
        static compare(a, b) {
            return a.left - b.left;
        }
    }
    exports.FloatHorizontalRange = FloatHorizontalRange;
    class HorizontalPosition {
        constructor(outsideRenderedLine, left) {
            this.outsideRenderedLine = outsideRenderedLine;
            this.originalLeft = left;
            this.left = Math.round(this.originalLeft);
        }
    }
    exports.HorizontalPosition = HorizontalPosition;
    class VisibleRanges {
        constructor(outsideRenderedLine, ranges) {
            this.outsideRenderedLine = outsideRenderedLine;
            this.ranges = ranges;
        }
    }
    exports.VisibleRanges = VisibleRanges;
});
//# sourceMappingURL=renderingContext.js.map