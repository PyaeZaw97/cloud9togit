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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/terminal/browser/links/terminalLink"], function (require, exports, event_1, lifecycle_1, nls_1, instantiation_1, terminalLink_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLinkDetectorAdapter = void 0;
    /**
     * Wrap a link detector object so it can be used in xterm.js
     */
    let TerminalLinkDetectorAdapter = class TerminalLinkDetectorAdapter extends lifecycle_1.Disposable {
        constructor(_detector, _instantiationService) {
            super();
            this._detector = _detector;
            this._instantiationService = _instantiationService;
            this._onDidActivateLink = this._register(new event_1.Emitter());
            this.onDidActivateLink = this._onDidActivateLink.event;
            this._onDidShowHover = this._register(new event_1.Emitter());
            this.onDidShowHover = this._onDidShowHover.event;
        }
        async provideLinks(bufferLineNumber, callback) {
            var _a;
            (_a = this._activeLinks) === null || _a === void 0 ? void 0 : _a.forEach(l => l.dispose());
            this._activeLinks = await this._provideLinks(bufferLineNumber);
            callback(this._activeLinks);
        }
        async _provideLinks(bufferLineNumber) {
            var _a, _b;
            // Dispose of all old links if new links are provided, links are only cached for the current line
            const links = [];
            let startLine = bufferLineNumber - 1;
            let endLine = startLine;
            const lines = [
                this._detector.xterm.buffer.active.getLine(startLine)
            ];
            while (startLine >= 0 && ((_a = this._detector.xterm.buffer.active.getLine(startLine)) === null || _a === void 0 ? void 0 : _a.isWrapped)) {
                lines.unshift(this._detector.xterm.buffer.active.getLine(startLine - 1));
                startLine--;
            }
            while (endLine < this._detector.xterm.buffer.active.length && ((_b = this._detector.xterm.buffer.active.getLine(endLine + 1)) === null || _b === void 0 ? void 0 : _b.isWrapped)) {
                lines.push(this._detector.xterm.buffer.active.getLine(endLine + 1));
                endLine++;
            }
            const detectedLinks = await this._detector.detect(lines, startLine, endLine);
            for (const link of detectedLinks) {
                links.push(this._createTerminalLink(link, async (event) => {
                    this._onDidActivateLink.fire({ link, event });
                }));
            }
            return links;
        }
        _createTerminalLink(l, activateCallback) {
            // Remove trailing colon if there is one so the link is more useful
            if (l.text.length > 0 && l.text.charAt(l.text.length - 1) === ':') {
                l.text = l.text.slice(0, -1);
                l.bufferRange.end.x--;
            }
            return this._instantiationService.createInstance(terminalLink_1.TerminalLink, this._detector.xterm, l.bufferRange, l.text, l.actions, this._detector.xterm.buffer.active.viewportY, activateCallback, (link, viewportRange, modifierDownCallback, modifierUpCallback) => this._onDidShowHover.fire({
                link,
                viewportRange,
                modifierDownCallback,
                modifierUpCallback
            }), l.type !== 3 /* TerminalBuiltinLinkType.Search */, // Only search is low confidence
            l.label || this._getLabel(l.type), l.type);
        }
        _getLabel(type) {
            switch (type) {
                case 3 /* TerminalBuiltinLinkType.Search */: return (0, nls_1.localize)('searchWorkspace', 'Search workspace');
                case 0 /* TerminalBuiltinLinkType.LocalFile */: return (0, nls_1.localize)('openFile', 'Open file in editor');
                case 2 /* TerminalBuiltinLinkType.LocalFolderInWorkspace */: return (0, nls_1.localize)('focusFolder', 'Focus folder in explorer');
                case 1 /* TerminalBuiltinLinkType.LocalFolderOutsideWorkspace */: return (0, nls_1.localize)('openFolder', 'Open folder in new window');
                case 4 /* TerminalBuiltinLinkType.Url */:
                default:
                    return (0, nls_1.localize)('followLink', 'Follow link');
            }
        }
    };
    TerminalLinkDetectorAdapter = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], TerminalLinkDetectorAdapter);
    exports.TerminalLinkDetectorAdapter = TerminalLinkDetectorAdapter;
});
//# sourceMappingURL=terminalLinkDetectorAdapter.js.map