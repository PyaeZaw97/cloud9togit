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
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/editor/common/languages/linkComputer", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/links/terminalLinkHelpers"], function (require, exports, network_1, uri_1, linkComputer_1, uriIdentity_1, workspace_1, terminalLinkHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalUriLinkDetector = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The maximum number of links in a line to resolve against the file system. This limit is put
         * in place to avoid sending excessive data when remote connections are in place.
         */
        Constants[Constants["MaxResolvedLinksInLine"] = 10] = "MaxResolvedLinksInLine";
        /**
         * The maximum length of a link to resolve against the file system. This limit is put in place
         * to avoid sending excessive data when remote connections are in place.
         */
        Constants[Constants["MaxResolvedLinkLength"] = 1024] = "MaxResolvedLinkLength";
    })(Constants || (Constants = {}));
    let TerminalUriLinkDetector = class TerminalUriLinkDetector {
        constructor(xterm, _resolvePath, _uriIdentityService, _workspaceContextService) {
            this.xterm = xterm;
            this._resolvePath = _resolvePath;
            this._uriIdentityService = _uriIdentityService;
            this._workspaceContextService = _workspaceContextService;
        }
        async detect(lines, startLine, endLine) {
            var _a;
            const links = [];
            const linkComputerTarget = new TerminalLinkAdapter(this.xterm, startLine, endLine);
            const computedLinks = linkComputer_1.LinkComputer.computeLinks(linkComputerTarget);
            let resolvedLinkCount = 0;
            for (const computedLink of computedLinks) {
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, computedLink.range, startLine);
                // Check if the link is within the mouse position
                const uri = computedLink.url
                    ? (typeof computedLink.url === 'string' ? uri_1.URI.parse(computedLink.url) : computedLink.url)
                    : undefined;
                if (!uri) {
                    continue;
                }
                const text = ((_a = computedLink.url) === null || _a === void 0 ? void 0 : _a.toString()) || '';
                // Handle non-file scheme links
                if (uri.scheme !== network_1.Schemas.file) {
                    links.push({
                        text,
                        uri,
                        bufferRange,
                        type: 4 /* TerminalBuiltinLinkType.Url */
                    });
                    continue;
                }
                // Don't try resolve any links of excessive length
                if (text.length > 1024 /* Constants.MaxResolvedLinkLength */) {
                    continue;
                }
                // Filter out URI with unrecognized authorities
                if (uri.authority.length !== 2 && uri.authority.endsWith(':')) {
                    continue;
                }
                const linkStat = await this._resolvePath(text, uri);
                // Create the link if validated
                if (linkStat) {
                    let type;
                    if (linkStat.isDirectory) {
                        if (this._isDirectoryInsideWorkspace(linkStat.uri)) {
                            type = 2 /* TerminalBuiltinLinkType.LocalFolderInWorkspace */;
                        }
                        else {
                            type = 1 /* TerminalBuiltinLinkType.LocalFolderOutsideWorkspace */;
                        }
                    }
                    else {
                        type = 0 /* TerminalBuiltinLinkType.LocalFile */;
                    }
                    links.push({
                        text: linkStat.link,
                        uri: linkStat.uri,
                        bufferRange,
                        type
                    });
                    // Stop early if too many links exist in the line
                    if (++resolvedLinkCount >= 10 /* Constants.MaxResolvedLinksInLine */) {
                        break;
                    }
                }
            }
            return links;
        }
        _isDirectoryInsideWorkspace(uri) {
            const folders = this._workspaceContextService.getWorkspace().folders;
            for (let i = 0; i < folders.length; i++) {
                if (this._uriIdentityService.extUri.isEqualOrParent(uri, folders[i].uri)) {
                    return true;
                }
            }
            return false;
        }
    };
    TerminalUriLinkDetector.id = 'uri';
    TerminalUriLinkDetector = __decorate([
        __param(2, uriIdentity_1.IUriIdentityService),
        __param(3, workspace_1.IWorkspaceContextService)
    ], TerminalUriLinkDetector);
    exports.TerminalUriLinkDetector = TerminalUriLinkDetector;
    class TerminalLinkAdapter {
        constructor(_xterm, _lineStart, _lineEnd) {
            this._xterm = _xterm;
            this._lineStart = _lineStart;
            this._lineEnd = _lineEnd;
        }
        getLineCount() {
            return 1;
        }
        getLineContent() {
            return (0, terminalLinkHelpers_1.getXtermLineContent)(this._xterm.buffer.active, this._lineStart, this._lineEnd, this._xterm.cols);
        }
    }
});
//# sourceMappingURL=terminalUriLinkDetector.js.map