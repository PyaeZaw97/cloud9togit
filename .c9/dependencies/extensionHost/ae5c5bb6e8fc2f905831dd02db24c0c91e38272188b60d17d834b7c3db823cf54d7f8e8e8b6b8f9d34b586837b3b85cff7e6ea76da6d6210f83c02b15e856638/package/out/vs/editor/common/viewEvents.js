/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewZonesChangedEvent = exports.ViewTokensColorsChangedEvent = exports.ViewTokensChangedEvent = exports.ViewThemeChangedEvent = exports.ViewScrollChangedEvent = exports.ViewRevealRangeRequestEvent = exports.VerticalRevealType = exports.ViewLinesInsertedEvent = exports.ViewLinesDeletedEvent = exports.ViewLinesChangedEvent = exports.ViewLineMappingChangedEvent = exports.ViewLanguageConfigurationEvent = exports.ViewFocusChangedEvent = exports.ViewFlushedEvent = exports.ViewDecorationsChangedEvent = exports.ViewCursorStateChangedEvent = exports.ViewConfigurationChangedEvent = exports.ViewCompositionEndEvent = exports.ViewCompositionStartEvent = exports.ViewEventType = void 0;
    var ViewEventType;
    (function (ViewEventType) {
        ViewEventType[ViewEventType["ViewCompositionStart"] = 0] = "ViewCompositionStart";
        ViewEventType[ViewEventType["ViewCompositionEnd"] = 1] = "ViewCompositionEnd";
        ViewEventType[ViewEventType["ViewConfigurationChanged"] = 2] = "ViewConfigurationChanged";
        ViewEventType[ViewEventType["ViewCursorStateChanged"] = 3] = "ViewCursorStateChanged";
        ViewEventType[ViewEventType["ViewDecorationsChanged"] = 4] = "ViewDecorationsChanged";
        ViewEventType[ViewEventType["ViewFlushed"] = 5] = "ViewFlushed";
        ViewEventType[ViewEventType["ViewFocusChanged"] = 6] = "ViewFocusChanged";
        ViewEventType[ViewEventType["ViewLanguageConfigurationChanged"] = 7] = "ViewLanguageConfigurationChanged";
        ViewEventType[ViewEventType["ViewLineMappingChanged"] = 8] = "ViewLineMappingChanged";
        ViewEventType[ViewEventType["ViewLinesChanged"] = 9] = "ViewLinesChanged";
        ViewEventType[ViewEventType["ViewLinesDeleted"] = 10] = "ViewLinesDeleted";
        ViewEventType[ViewEventType["ViewLinesInserted"] = 11] = "ViewLinesInserted";
        ViewEventType[ViewEventType["ViewRevealRangeRequest"] = 12] = "ViewRevealRangeRequest";
        ViewEventType[ViewEventType["ViewScrollChanged"] = 13] = "ViewScrollChanged";
        ViewEventType[ViewEventType["ViewThemeChanged"] = 14] = "ViewThemeChanged";
        ViewEventType[ViewEventType["ViewTokensChanged"] = 15] = "ViewTokensChanged";
        ViewEventType[ViewEventType["ViewTokensColorsChanged"] = 16] = "ViewTokensColorsChanged";
        ViewEventType[ViewEventType["ViewZonesChanged"] = 17] = "ViewZonesChanged";
    })(ViewEventType = exports.ViewEventType || (exports.ViewEventType = {}));
    class ViewCompositionStartEvent {
        constructor() {
            this.type = 0 /* ViewEventType.ViewCompositionStart */;
        }
    }
    exports.ViewCompositionStartEvent = ViewCompositionStartEvent;
    class ViewCompositionEndEvent {
        constructor() {
            this.type = 1 /* ViewEventType.ViewCompositionEnd */;
        }
    }
    exports.ViewCompositionEndEvent = ViewCompositionEndEvent;
    class ViewConfigurationChangedEvent {
        constructor(source) {
            this.type = 2 /* ViewEventType.ViewConfigurationChanged */;
            this._source = source;
        }
        hasChanged(id) {
            return this._source.hasChanged(id);
        }
    }
    exports.ViewConfigurationChangedEvent = ViewConfigurationChangedEvent;
    class ViewCursorStateChangedEvent {
        constructor(selections, modelSelections) {
            this.type = 3 /* ViewEventType.ViewCursorStateChanged */;
            this.selections = selections;
            this.modelSelections = modelSelections;
        }
    }
    exports.ViewCursorStateChangedEvent = ViewCursorStateChangedEvent;
    class ViewDecorationsChangedEvent {
        constructor(source) {
            this.type = 4 /* ViewEventType.ViewDecorationsChanged */;
            if (source) {
                this.affectsMinimap = source.affectsMinimap;
                this.affectsOverviewRuler = source.affectsOverviewRuler;
            }
            else {
                this.affectsMinimap = true;
                this.affectsOverviewRuler = true;
            }
        }
    }
    exports.ViewDecorationsChangedEvent = ViewDecorationsChangedEvent;
    class ViewFlushedEvent {
        constructor() {
            this.type = 5 /* ViewEventType.ViewFlushed */;
            // Nothing to do
        }
    }
    exports.ViewFlushedEvent = ViewFlushedEvent;
    class ViewFocusChangedEvent {
        constructor(isFocused) {
            this.type = 6 /* ViewEventType.ViewFocusChanged */;
            this.isFocused = isFocused;
        }
    }
    exports.ViewFocusChangedEvent = ViewFocusChangedEvent;
    class ViewLanguageConfigurationEvent {
        constructor() {
            this.type = 7 /* ViewEventType.ViewLanguageConfigurationChanged */;
        }
    }
    exports.ViewLanguageConfigurationEvent = ViewLanguageConfigurationEvent;
    class ViewLineMappingChangedEvent {
        constructor() {
            this.type = 8 /* ViewEventType.ViewLineMappingChanged */;
            // Nothing to do
        }
    }
    exports.ViewLineMappingChangedEvent = ViewLineMappingChangedEvent;
    class ViewLinesChangedEvent {
        constructor(
        /**
         * The first line that has changed.
         */
        fromLineNumber, 
        /**
         * The number of lines that have changed.
         */
        count) {
            this.fromLineNumber = fromLineNumber;
            this.count = count;
            this.type = 9 /* ViewEventType.ViewLinesChanged */;
        }
    }
    exports.ViewLinesChangedEvent = ViewLinesChangedEvent;
    class ViewLinesDeletedEvent {
        constructor(fromLineNumber, toLineNumber) {
            this.type = 10 /* ViewEventType.ViewLinesDeleted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ViewLinesDeletedEvent = ViewLinesDeletedEvent;
    class ViewLinesInsertedEvent {
        constructor(fromLineNumber, toLineNumber) {
            this.type = 11 /* ViewEventType.ViewLinesInserted */;
            this.fromLineNumber = fromLineNumber;
            this.toLineNumber = toLineNumber;
        }
    }
    exports.ViewLinesInsertedEvent = ViewLinesInsertedEvent;
    var VerticalRevealType;
    (function (VerticalRevealType) {
        VerticalRevealType[VerticalRevealType["Simple"] = 0] = "Simple";
        VerticalRevealType[VerticalRevealType["Center"] = 1] = "Center";
        VerticalRevealType[VerticalRevealType["CenterIfOutsideViewport"] = 2] = "CenterIfOutsideViewport";
        VerticalRevealType[VerticalRevealType["Top"] = 3] = "Top";
        VerticalRevealType[VerticalRevealType["Bottom"] = 4] = "Bottom";
        VerticalRevealType[VerticalRevealType["NearTop"] = 5] = "NearTop";
        VerticalRevealType[VerticalRevealType["NearTopIfOutsideViewport"] = 6] = "NearTopIfOutsideViewport";
    })(VerticalRevealType = exports.VerticalRevealType || (exports.VerticalRevealType = {}));
    class ViewRevealRangeRequestEvent {
        constructor(
        /**
         * Source of the call that caused the event.
         */
        source, 
        /**
         * Reduce the revealing to a minimum (e.g. avoid scrolling if the bounding box is visible and near the viewport edge).
         */
        minimalReveal, 
        /**
         * Range to be reavealed.
         */
        range, 
        /**
         * Selections to be revealed.
         */
        selections, 
        /**
         * The vertical reveal strategy.
         */
        verticalType, 
        /**
         * If true: there should be a horizontal & vertical revealing.
         * If false: there should be just a vertical revealing.
         */
        revealHorizontal, 
        /**
         * The scroll type.
         */
        scrollType) {
            this.source = source;
            this.minimalReveal = minimalReveal;
            this.range = range;
            this.selections = selections;
            this.verticalType = verticalType;
            this.revealHorizontal = revealHorizontal;
            this.scrollType = scrollType;
            this.type = 12 /* ViewEventType.ViewRevealRangeRequest */;
        }
    }
    exports.ViewRevealRangeRequestEvent = ViewRevealRangeRequestEvent;
    class ViewScrollChangedEvent {
        constructor(source) {
            this.type = 13 /* ViewEventType.ViewScrollChanged */;
            this.scrollWidth = source.scrollWidth;
            this.scrollLeft = source.scrollLeft;
            this.scrollHeight = source.scrollHeight;
            this.scrollTop = source.scrollTop;
            this.scrollWidthChanged = source.scrollWidthChanged;
            this.scrollLeftChanged = source.scrollLeftChanged;
            this.scrollHeightChanged = source.scrollHeightChanged;
            this.scrollTopChanged = source.scrollTopChanged;
        }
    }
    exports.ViewScrollChangedEvent = ViewScrollChangedEvent;
    class ViewThemeChangedEvent {
        constructor(theme) {
            this.theme = theme;
            this.type = 14 /* ViewEventType.ViewThemeChanged */;
        }
    }
    exports.ViewThemeChangedEvent = ViewThemeChangedEvent;
    class ViewTokensChangedEvent {
        constructor(ranges) {
            this.type = 15 /* ViewEventType.ViewTokensChanged */;
            this.ranges = ranges;
        }
    }
    exports.ViewTokensChangedEvent = ViewTokensChangedEvent;
    class ViewTokensColorsChangedEvent {
        constructor() {
            this.type = 16 /* ViewEventType.ViewTokensColorsChanged */;
            // Nothing to do
        }
    }
    exports.ViewTokensColorsChangedEvent = ViewTokensColorsChangedEvent;
    class ViewZonesChangedEvent {
        constructor() {
            this.type = 17 /* ViewEventType.ViewZonesChanged */;
            // Nothing to do
        }
    }
    exports.ViewZonesChangedEvent = ViewZonesChangedEvent;
});
//# sourceMappingURL=viewEvents.js.map