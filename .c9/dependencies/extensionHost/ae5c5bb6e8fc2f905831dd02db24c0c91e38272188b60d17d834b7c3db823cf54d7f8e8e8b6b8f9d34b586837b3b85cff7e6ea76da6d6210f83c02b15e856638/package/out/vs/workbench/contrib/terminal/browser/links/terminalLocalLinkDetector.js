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
define(["require", "exports", "vs/platform/uriIdentity/common/uriIdentity", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/links/terminalLinkHelpers"], function (require, exports, uriIdentity_1, workspace_1, terminalLinkHelpers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getLocalLinkRegex = exports.TerminalLocalLinkDetector = exports.lineAndColumnClauseGroupCount = exports.unixLineAndColumnMatchIndex = exports.winLineAndColumnMatchIndex = exports.lineAndColumnClause = exports.winLocalLinkClause = exports.winDrivePrefix = exports.unixLocalLinkClause = void 0;
    var Constants;
    (function (Constants) {
        /**
         * The max line length to try extract word links from.
         */
        Constants[Constants["MaxLineLength"] = 2000] = "MaxLineLength";
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
    const pathPrefix = '(\\.\\.?|\\~)';
    const pathSeparatorClause = '\\/';
    // '":; are allowed in paths but they are often separators so ignore them
    // Also disallow \\ to prevent a catastropic backtracking case #24795
    const excludedPathCharactersClause = '[^\\0\\s!`&*()\\[\\]\'":;\\\\]';
    /** A regex that matches paths in the form /foo, ~/foo, ./foo, ../foo, foo/bar */
    exports.unixLocalLinkClause = '((' + pathPrefix + '|(' + excludedPathCharactersClause + ')+)?(' + pathSeparatorClause + '(' + excludedPathCharactersClause + ')+)+)';
    exports.winDrivePrefix = '(?:\\\\\\\\\\?\\\\)?[a-zA-Z]:';
    const winPathPrefix = '(' + exports.winDrivePrefix + '|\\.\\.?|\\~)';
    const winPathSeparatorClause = '(\\\\|\\/)';
    const winExcludedPathCharactersClause = '[^\\0<>\\?\\|\\/\\s!`&*()\\[\\]\'":;]';
    /** A regex that matches paths in the form \\?\c:\foo c:\foo, ~\foo, .\foo, ..\foo, foo\bar */
    exports.winLocalLinkClause = '((' + winPathPrefix + '|(' + winExcludedPathCharactersClause + ')+)?(' + winPathSeparatorClause + '(' + winExcludedPathCharactersClause + ')+)+)';
    /** As xterm reads from DOM, space in that case is nonbreaking char ASCII code - 160,
    replacing space with nonBreakningSpace or space ASCII code - 32. */
    exports.lineAndColumnClause = [
        '((\\S*)[\'"], line ((\\d+)( column (\\d+))?))',
        '((\\S*)[\'"],((\\d+)(:(\\d+))?))',
        '((\\S*) on line ((\\d+)(, column (\\d+))?))',
        '((\\S*):line ((\\d+)(, column (\\d+))?))',
        '(([^\\s\\(\\)]*)(\\s?[\\(\\[](\\d+)(,\\s?(\\d+))?)[\\)\\]])',
        '(([^:\\s\\(\\)<>\'\"\\[\\]]*)(:(\\d+))?(:(\\d+))?)' // (file path):336, (file path):336:9
    ].join('|').replace(/ /g, `[${'\u00A0'} ]`);
    // Changing any regex may effect this value, hence changes this as well if required.
    exports.winLineAndColumnMatchIndex = 12;
    exports.unixLineAndColumnMatchIndex = 11;
    // Each line and column clause have 6 groups (ie no. of expressions in round brackets)
    exports.lineAndColumnClauseGroupCount = 6;
    let TerminalLocalLinkDetector = class TerminalLocalLinkDetector {
        constructor(xterm, _capabilities, _os, _resolvePath, _uriIdentityService, _workspaceContextService) {
            this.xterm = xterm;
            this._capabilities = _capabilities;
            this._os = _os;
            this._resolvePath = _resolvePath;
            this._uriIdentityService = _uriIdentityService;
            this._workspaceContextService = _workspaceContextService;
        }
        async detect(lines, startLine, endLine) {
            const links = [];
            // Get the text representation of the wrapped line
            const text = (0, terminalLinkHelpers_1.getXtermLineContent)(this.xterm.buffer.active, startLine, endLine, this.xterm.cols);
            if (text === '' || text.length > 2000 /* Constants.MaxLineLength */) {
                return [];
            }
            // clone regex to do a global search on text
            const rex = new RegExp(getLocalLinkRegex(this._os), 'g');
            let match;
            let stringIndex = -1;
            let resolvedLinkCount = 0;
            while ((match = rex.exec(text)) !== null) {
                // const link = match[typeof matcher.matchIndex !== 'number' ? 0 : matcher.matchIndex];
                let link = match[0];
                if (!link) {
                    // something matched but does not comply with the given matchIndex
                    // since this is most likely a bug the regex itself we simply do nothing here
                    // this._logService.debug('match found without corresponding matchIndex', match, matcher);
                    break;
                }
                // Get index, match.index is for the outer match which includes negated chars
                // therefore we cannot use match.index directly, instead we search the position
                // of the match group in text again
                // also correct regex and string search offsets for the next loop run
                stringIndex = text.indexOf(link, stringIndex + 1);
                rex.lastIndex = stringIndex + link.length;
                if (stringIndex < 0) {
                    // invalid stringIndex (should not have happened)
                    break;
                }
                // Adjust the link range to exclude a/ and b/ if it looks like a git diff
                if (
                // --- a/foo/bar
                // +++ b/foo/bar
                ((text.startsWith('--- a/') || text.startsWith('+++ b/')) && stringIndex === 4) ||
                    // diff --git a/foo/bar b/foo/bar
                    (text.startsWith('diff --git') && (link.startsWith('a/') || link.startsWith('b/')))) {
                    link = link.substring(2);
                    stringIndex += 2;
                }
                // Convert the link text's string index into a wrapped buffer range
                const bufferRange = (0, terminalLinkHelpers_1.convertLinkRangeToBuffer)(lines, this.xterm.cols, {
                    startColumn: stringIndex + 1,
                    startLineNumber: 1,
                    endColumn: stringIndex + link.length + 1,
                    endLineNumber: 1
                }, startLine);
                // Don't try resolve any links of excessive length
                if (link.length > 1024 /* Constants.MaxResolvedLinkLength */) {
                    continue;
                }
                // Get a single link candidate if the cwd of the line is known
                const linkCandidates = [];
                if ((0, terminalLinkHelpers_1.osPathModule)(this._os).isAbsolute(link)) {
                    linkCandidates.push(link);
                }
                else {
                    if (this._capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                        const absolutePath = (0, terminalLinkHelpers_1.updateLinkWithRelativeCwd)(this._capabilities, bufferRange.start.y, link, (0, terminalLinkHelpers_1.osPathModule)(this._os).sep);
                        // Only add a single exact link candidate if the cwd is available, this may cause
                        // the link to not be resolved but that should only occur when the actual file does
                        // not exist. Doing otherwise could cause unexpected results where handling via the
                        // word link detector is preferable.
                        if (absolutePath) {
                            linkCandidates.push(absolutePath);
                        }
                    }
                    else {
                        // Fallback to resolving against the initial cwd, removing any relative directory prefixes
                        linkCandidates.push(link);
                        if (link.match(/^(\.\.[\/\\])+/)) {
                            linkCandidates.push(link.replace(/^(\.\.[\/\\])+/, ''));
                        }
                    }
                }
                const linkStat = await this._validateLinkCandidates(linkCandidates);
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
        async _validateLinkCandidates(linkCandidates) {
            for (const link of linkCandidates) {
                const result = await this._resolvePath(link);
                if (result) {
                    return result;
                }
            }
            return undefined;
        }
    };
    TerminalLocalLinkDetector.id = 'local';
    TerminalLocalLinkDetector = __decorate([
        __param(4, uriIdentity_1.IUriIdentityService),
        __param(5, workspace_1.IWorkspaceContextService)
    ], TerminalLocalLinkDetector);
    exports.TerminalLocalLinkDetector = TerminalLocalLinkDetector;
    function getLocalLinkRegex(os) {
        const baseLocalLinkClause = os === 1 /* OperatingSystem.Windows */ ? exports.winLocalLinkClause : exports.unixLocalLinkClause;
        // Append line and column number regex
        return new RegExp(`${baseLocalLinkClause}(${exports.lineAndColumnClause})`);
    }
    exports.getLocalLinkRegex = getLocalLinkRegex;
});
//# sourceMappingURL=terminalLocalLinkDetector.js.map