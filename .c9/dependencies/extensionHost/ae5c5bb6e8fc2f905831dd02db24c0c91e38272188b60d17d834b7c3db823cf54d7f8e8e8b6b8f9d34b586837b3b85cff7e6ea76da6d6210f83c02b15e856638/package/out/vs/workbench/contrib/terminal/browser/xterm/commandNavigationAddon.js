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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/async", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/workbench/contrib/terminal/common/terminalColorRegistry"], function (require, exports, arrays_1, lifecycle_1, async_1, themeService_1, colorRegistry_1, terminalColorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CommandNavigationAddon = exports.ScrollPosition = void 0;
    var Boundary;
    (function (Boundary) {
        Boundary[Boundary["Top"] = 0] = "Top";
        Boundary[Boundary["Bottom"] = 1] = "Bottom";
    })(Boundary || (Boundary = {}));
    var ScrollPosition;
    (function (ScrollPosition) {
        ScrollPosition[ScrollPosition["Top"] = 0] = "Top";
        ScrollPosition[ScrollPosition["Middle"] = 1] = "Middle";
    })(ScrollPosition = exports.ScrollPosition || (exports.ScrollPosition = {}));
    let CommandNavigationAddon = class CommandNavigationAddon extends lifecycle_1.Disposable {
        constructor(store, _themeService) {
            super();
            this._themeService = _themeService;
            this._currentMarker = Boundary.Bottom;
            this._selectionStart = null;
            this._isDisposable = false;
            this._refreshActiveCapability(store);
            this._register(store.onDidAddCapability(() => this._refreshActiveCapability(store)));
            this._register(store.onDidRemoveCapability(() => this._refreshActiveCapability(store)));
        }
        activate(terminal) {
            this._terminal = terminal;
            this._terminal.onData(() => {
                this._currentMarker = Boundary.Bottom;
            });
        }
        _refreshActiveCapability(store) {
            const activeCommandDetection = store.get(2 /* TerminalCapability.CommandDetection */) || store.get(3 /* TerminalCapability.PartialCommandDetection */);
            if (activeCommandDetection !== this._commandDetection) {
                this._commandDetection = activeCommandDetection;
            }
        }
        _getCommandMarkers() {
            if (!this._commandDetection) {
                return [];
            }
            let commands;
            if (this._commandDetection.type === 3 /* TerminalCapability.PartialCommandDetection */) {
                commands = this._commandDetection.commands;
            }
            else {
                commands = (0, arrays_1.coalesce)(this._commandDetection.commands.map(e => e.marker));
            }
            return commands;
        }
        clearMarker() {
            // Clear the current marker so successive focus/selection actions are performed from the
            // bottom of the buffer
            this._currentMarker = Boundary.Bottom;
            this._selectionStart = null;
        }
        scrollToPreviousCommand(scrollPosition = 1 /* ScrollPosition.Middle */, retainSelection = false) {
            if (!this._terminal) {
                return;
            }
            if (!retainSelection) {
                this._selectionStart = null;
            }
            let markerIndex;
            const currentLineY = typeof this._currentMarker === 'object'
                ? this._getTargetScrollLine(this._terminal, this._currentMarker, scrollPosition)
                : Math.min(this._getLine(this._terminal, this._currentMarker), this._terminal.buffer.active.baseY);
            const viewportY = this._terminal.buffer.active.viewportY;
            if (typeof this._currentMarker === 'object' ? !this._isMarkerInViewport(this._terminal, this._currentMarker) : currentLineY !== viewportY) {
                // The user has scrolled, find the line based on the current scroll position. This only
                // works when not retaining selection
                const markersBelowViewport = this._getCommandMarkers().filter(e => e.line >= viewportY).length;
                // -1 will scroll to the top
                markerIndex = this._getCommandMarkers().length - markersBelowViewport - 1;
            }
            else if (this._currentMarker === Boundary.Bottom) {
                markerIndex = this._getCommandMarkers().length - 1;
            }
            else if (this._currentMarker === Boundary.Top) {
                markerIndex = -1;
            }
            else if (this._isDisposable) {
                markerIndex = this._findPreviousCommand(this._terminal);
                this._currentMarker.dispose();
                this._isDisposable = false;
            }
            else {
                markerIndex = this._getCommandMarkers().indexOf(this._currentMarker) - 1;
            }
            if (markerIndex < 0) {
                this._currentMarker = Boundary.Top;
                this._terminal.scrollToTop();
                return;
            }
            this._currentMarker = this._getCommandMarkers()[markerIndex];
            this._scrollToMarker(this._currentMarker, scrollPosition);
        }
        scrollToNextCommand(scrollPosition = 1 /* ScrollPosition.Middle */, retainSelection = false) {
            if (!this._terminal) {
                return;
            }
            if (!retainSelection) {
                this._selectionStart = null;
            }
            let markerIndex;
            const currentLineY = typeof this._currentMarker === 'object'
                ? this._getTargetScrollLine(this._terminal, this._currentMarker, scrollPosition)
                : Math.min(this._getLine(this._terminal, this._currentMarker), this._terminal.buffer.active.baseY);
            const viewportY = this._terminal.buffer.active.viewportY;
            if (typeof this._currentMarker === 'object' ? !this._isMarkerInViewport(this._terminal, this._currentMarker) : currentLineY !== viewportY) {
                // The user has scrolled, find the line based on the current scroll position. This only
                // works when not retaining selection
                const markersAboveViewport = this._getCommandMarkers().filter(e => e.line <= viewportY).length;
                // markers.length will scroll to the bottom
                markerIndex = markersAboveViewport;
            }
            else if (this._currentMarker === Boundary.Bottom) {
                markerIndex = this._getCommandMarkers().length;
            }
            else if (this._currentMarker === Boundary.Top) {
                markerIndex = 0;
            }
            else if (this._isDisposable) {
                markerIndex = this._findNextCommand(this._terminal);
                this._currentMarker.dispose();
                this._isDisposable = false;
            }
            else {
                markerIndex = this._getCommandMarkers().indexOf(this._currentMarker) + 1;
            }
            if (markerIndex >= this._getCommandMarkers().length) {
                this._currentMarker = Boundary.Bottom;
                this._terminal.scrollToBottom();
                return;
            }
            this._currentMarker = this._getCommandMarkers()[markerIndex];
            this._scrollToMarker(this._currentMarker, scrollPosition);
        }
        _scrollToMarker(marker, position) {
            var _a;
            if (!this._terminal) {
                return;
            }
            if (!this._isMarkerInViewport(this._terminal, marker)) {
                const line = this._getTargetScrollLine(this._terminal, marker, position);
                this._terminal.scrollToLine(line);
            }
            (_a = this._navigationDecoration) === null || _a === void 0 ? void 0 : _a.dispose();
            const color = this._themeService.getColorTheme().getColor(terminalColorRegistry_1.TERMINAL_OVERVIEW_RULER_CURSOR_FOREGROUND_COLOR);
            const decoration = this._terminal.registerDecoration({
                marker,
                width: this._terminal.cols,
                overviewRulerOptions: {
                    color: (color === null || color === void 0 ? void 0 : color.toString()) || '#a0a0a0cc'
                }
            });
            this._navigationDecoration = decoration;
            if (decoration) {
                let isRendered = false;
                decoration.onRender(element => {
                    if (!isRendered) {
                        // TODO: Remove when https://github.com/xtermjs/xterm.js/issues/3686 is fixed
                        if (!element.classList.contains('xterm-decoration-overview-ruler')) {
                            element.classList.add('terminal-scroll-highlight');
                        }
                    }
                });
                decoration.onDispose(() => {
                    if (decoration === this._navigationDecoration) {
                        this._navigationDecoration = undefined;
                    }
                });
                // Number picked to align with symbol highlight in the editor
                (0, async_1.timeout)(350).then(() => {
                    decoration.dispose();
                });
            }
        }
        _getTargetScrollLine(terminal, marker, position) {
            // Middle is treated at 1/4 of the viewport's size because context below is almost always
            // more important than context above in the terminal.
            if (position === 1 /* ScrollPosition.Middle */) {
                return Math.max(marker.line - Math.floor(terminal.rows / 4), 0);
            }
            return marker.line;
        }
        _isMarkerInViewport(terminal, marker) {
            const viewportY = terminal.buffer.active.viewportY;
            return marker.line >= viewportY && marker.line < viewportY + terminal.rows;
        }
        selectToPreviousCommand() {
            if (!this._terminal) {
                return;
            }
            if (this._selectionStart === null) {
                this._selectionStart = this._currentMarker;
            }
            this.scrollToPreviousCommand(1 /* ScrollPosition.Middle */, true);
            this._selectLines(this._terminal, this._currentMarker, this._selectionStart);
        }
        selectToNextCommand() {
            if (!this._terminal) {
                return;
            }
            if (this._selectionStart === null) {
                this._selectionStart = this._currentMarker;
            }
            this.scrollToNextCommand(1 /* ScrollPosition.Middle */, true);
            this._selectLines(this._terminal, this._currentMarker, this._selectionStart);
        }
        selectToPreviousLine() {
            if (!this._terminal) {
                return;
            }
            if (this._selectionStart === null) {
                this._selectionStart = this._currentMarker;
            }
            this.scrollToPreviousLine(this._terminal, 1 /* ScrollPosition.Middle */, true);
            this._selectLines(this._terminal, this._currentMarker, this._selectionStart);
        }
        selectToNextLine() {
            if (!this._terminal) {
                return;
            }
            if (this._selectionStart === null) {
                this._selectionStart = this._currentMarker;
            }
            this.scrollToNextLine(this._terminal, 1 /* ScrollPosition.Middle */, true);
            this._selectLines(this._terminal, this._currentMarker, this._selectionStart);
        }
        _selectLines(xterm, start, end) {
            if (end === null) {
                end = Boundary.Bottom;
            }
            let startLine = this._getLine(xterm, start);
            let endLine = this._getLine(xterm, end);
            if (startLine > endLine) {
                const temp = startLine;
                startLine = endLine;
                endLine = temp;
            }
            // Subtract a line as the marker is on the line the command run, we do not want the next
            // command in the selection for the current command
            endLine -= 1;
            xterm.selectLines(startLine, endLine);
        }
        _getLine(xterm, marker) {
            // Use the _second last_ row as the last row is likely the prompt
            if (marker === Boundary.Bottom) {
                return xterm.buffer.active.baseY + xterm.rows - 1;
            }
            if (marker === Boundary.Top) {
                return 0;
            }
            return marker.line;
        }
        scrollToPreviousLine(xterm, scrollPosition = 1 /* ScrollPosition.Middle */, retainSelection = false) {
            if (!retainSelection) {
                this._selectionStart = null;
            }
            if (this._currentMarker === Boundary.Top) {
                xterm.scrollToTop();
                return;
            }
            if (this._currentMarker === Boundary.Bottom) {
                this._currentMarker = this._registerMarkerOrThrow(xterm, this._getOffset(xterm) - 1);
            }
            else {
                const offset = this._getOffset(xterm);
                if (this._isDisposable) {
                    this._currentMarker.dispose();
                }
                this._currentMarker = this._registerMarkerOrThrow(xterm, offset - 1);
            }
            this._isDisposable = true;
            this._scrollToMarker(this._currentMarker, scrollPosition);
        }
        scrollToNextLine(xterm, scrollPosition = 1 /* ScrollPosition.Middle */, retainSelection = false) {
            if (!retainSelection) {
                this._selectionStart = null;
            }
            if (this._currentMarker === Boundary.Bottom) {
                xterm.scrollToBottom();
                return;
            }
            if (this._currentMarker === Boundary.Top) {
                this._currentMarker = this._registerMarkerOrThrow(xterm, this._getOffset(xterm) + 1);
            }
            else {
                const offset = this._getOffset(xterm);
                if (this._isDisposable) {
                    this._currentMarker.dispose();
                }
                this._currentMarker = this._registerMarkerOrThrow(xterm, offset + 1);
            }
            this._isDisposable = true;
            this._scrollToMarker(this._currentMarker, scrollPosition);
        }
        _registerMarkerOrThrow(xterm, cursorYOffset) {
            const marker = xterm.registerMarker(cursorYOffset);
            if (!marker) {
                throw new Error(`Could not create marker for ${cursorYOffset}`);
            }
            return marker;
        }
        _getOffset(xterm) {
            if (this._currentMarker === Boundary.Bottom) {
                return 0;
            }
            else if (this._currentMarker === Boundary.Top) {
                return 0 - (xterm.buffer.active.baseY + xterm.buffer.active.cursorY);
            }
            else {
                let offset = this._getLine(xterm, this._currentMarker);
                offset -= xterm.buffer.active.baseY + xterm.buffer.active.cursorY;
                return offset;
            }
        }
        _findPreviousCommand(xterm) {
            if (this._currentMarker === Boundary.Top) {
                return 0;
            }
            else if (this._currentMarker === Boundary.Bottom) {
                return this._getCommandMarkers().length - 1;
            }
            let i;
            for (i = this._getCommandMarkers().length - 1; i >= 0; i--) {
                if (this._getCommandMarkers()[i].line < this._currentMarker.line) {
                    return i;
                }
            }
            return -1;
        }
        _findNextCommand(xterm) {
            if (this._currentMarker === Boundary.Top) {
                return 0;
            }
            else if (this._currentMarker === Boundary.Bottom) {
                return this._getCommandMarkers().length - 1;
            }
            let i;
            for (i = 0; i < this._getCommandMarkers().length; i++) {
                if (this._getCommandMarkers()[i].line > this._currentMarker.line) {
                    return i;
                }
            }
            return this._getCommandMarkers().length;
        }
    };
    CommandNavigationAddon = __decorate([
        __param(1, themeService_1.IThemeService)
    ], CommandNavigationAddon);
    exports.CommandNavigationAddon = CommandNavigationAddon;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
        if (focusBorderColor) {
            collector.addRule(`.terminal-scroll-highlight { border-color: ${focusBorderColor.toString()}; } `);
        }
    });
});
//# sourceMappingURL=commandNavigationAddon.js.map