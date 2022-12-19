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
define(["require", "exports", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/base/common/async", "vs/workbench/contrib/terminal/browser/links/terminalLinkHelpers", "vs/base/common/platform", "vs/nls", "vs/base/common/event", "vs/platform/configuration/common/configuration"], function (require, exports, lifecycle_1, dom, async_1, terminalLinkHelpers_1, platform_1, nls_1, event_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLink = exports.FOLDER_NOT_IN_WORKSPACE_LABEL = exports.FOLDER_IN_WORKSPACE_LABEL = exports.OPEN_FILE_LABEL = void 0;
    exports.OPEN_FILE_LABEL = (0, nls_1.localize)('openFile', 'Open file in editor');
    exports.FOLDER_IN_WORKSPACE_LABEL = (0, nls_1.localize)('focusFolder', 'Focus folder in explorer');
    exports.FOLDER_NOT_IN_WORKSPACE_LABEL = (0, nls_1.localize)('openFolder', 'Open folder in new window');
    let TerminalLink = class TerminalLink extends lifecycle_1.DisposableStore {
        constructor(_xterm, range, text, actions, _viewportY, _activateCallback, _tooltipCallback, _isHighConfidenceLink, label, _type, _configurationService) {
            super();
            this._xterm = _xterm;
            this.range = range;
            this.text = text;
            this.actions = actions;
            this._viewportY = _viewportY;
            this._activateCallback = _activateCallback;
            this._tooltipCallback = _tooltipCallback;
            this._isHighConfidenceLink = _isHighConfidenceLink;
            this.label = label;
            this._type = _type;
            this._configurationService = _configurationService;
            this._onInvalidated = new event_1.Emitter();
            this.decorations = {
                pointerCursor: false,
                underline: this._isHighConfidenceLink
            };
        }
        get onInvalidated() { return this._onInvalidated.event; }
        get type() { return this._type; }
        dispose() {
            var _a, _b;
            super.dispose();
            (_a = this._hoverListeners) === null || _a === void 0 ? void 0 : _a.dispose();
            this._hoverListeners = undefined;
            (_b = this._tooltipScheduler) === null || _b === void 0 ? void 0 : _b.dispose();
            this._tooltipScheduler = undefined;
        }
        activate(event, text) {
            // Trigger the xterm.js callback synchronously but track the promise resolution so we can
            // use it in tests
            this.asyncActivate = this._activateCallback(event, text);
        }
        hover(event, text) {
            // Listen for modifier before handing it off to the hover to handle so it gets disposed correctly
            this._hoverListeners = new lifecycle_1.DisposableStore();
            this._hoverListeners.add(dom.addDisposableListener(document, 'keydown', e => {
                if (!e.repeat && this._isModifierDown(e)) {
                    this._enableDecorations();
                }
            }));
            this._hoverListeners.add(dom.addDisposableListener(document, 'keyup', e => {
                if (!e.repeat && !this._isModifierDown(e)) {
                    this._disableDecorations();
                }
            }));
            // Listen for when the terminal renders on the same line as the link
            this._hoverListeners.add(this._xterm.onRender(e => {
                const viewportRangeY = this.range.start.y - this._viewportY;
                if (viewportRangeY >= e.start && viewportRangeY <= e.end) {
                    this._onInvalidated.fire();
                }
            }));
            // Only show the tooltip and highlight for high confidence links (not word/search workspace
            // links). Feedback was that this makes using the terminal overly noisy.
            if (this._isHighConfidenceLink) {
                this._tooltipScheduler = new async_1.RunOnceScheduler(() => {
                    var _a;
                    this._tooltipCallback(this, (0, terminalLinkHelpers_1.convertBufferRangeToViewport)(this.range, this._viewportY), this._isHighConfidenceLink ? () => this._enableDecorations() : undefined, this._isHighConfidenceLink ? () => this._disableDecorations() : undefined);
                    // Clear out scheduler until next hover event
                    (_a = this._tooltipScheduler) === null || _a === void 0 ? void 0 : _a.dispose();
                    this._tooltipScheduler = undefined;
                }, this._configurationService.getValue('workbench.hover.delay'));
                this.add(this._tooltipScheduler);
                this._tooltipScheduler.schedule();
            }
            const origin = { x: event.pageX, y: event.pageY };
            this._hoverListeners.add(dom.addDisposableListener(document, dom.EventType.MOUSE_MOVE, e => {
                var _a;
                // Update decorations
                if (this._isModifierDown(e)) {
                    this._enableDecorations();
                }
                else {
                    this._disableDecorations();
                }
                // Reset the scheduler if the mouse moves too much
                if (Math.abs(e.pageX - origin.x) > window.devicePixelRatio * 2 || Math.abs(e.pageY - origin.y) > window.devicePixelRatio * 2) {
                    origin.x = e.pageX;
                    origin.y = e.pageY;
                    (_a = this._tooltipScheduler) === null || _a === void 0 ? void 0 : _a.schedule();
                }
            }));
        }
        leave() {
            var _a, _b;
            (_a = this._hoverListeners) === null || _a === void 0 ? void 0 : _a.dispose();
            this._hoverListeners = undefined;
            (_b = this._tooltipScheduler) === null || _b === void 0 ? void 0 : _b.dispose();
            this._tooltipScheduler = undefined;
        }
        _enableDecorations() {
            if (!this.decorations.pointerCursor) {
                this.decorations.pointerCursor = true;
            }
            if (!this.decorations.underline) {
                this.decorations.underline = true;
            }
        }
        _disableDecorations() {
            if (this.decorations.pointerCursor) {
                this.decorations.pointerCursor = false;
            }
            if (this.decorations.underline !== this._isHighConfidenceLink) {
                this.decorations.underline = this._isHighConfidenceLink;
            }
        }
        _isModifierDown(event) {
            const multiCursorModifier = this._configurationService.getValue('editor.multiCursorModifier');
            if (multiCursorModifier === 'ctrlCmd') {
                return !!event.altKey;
            }
            return platform_1.isMacintosh ? event.metaKey : event.ctrlKey;
        }
    };
    TerminalLink = __decorate([
        __param(10, configuration_1.IConfigurationService)
    ], TerminalLink);
    exports.TerminalLink = TerminalLink;
});
//# sourceMappingURL=terminalLink.js.map