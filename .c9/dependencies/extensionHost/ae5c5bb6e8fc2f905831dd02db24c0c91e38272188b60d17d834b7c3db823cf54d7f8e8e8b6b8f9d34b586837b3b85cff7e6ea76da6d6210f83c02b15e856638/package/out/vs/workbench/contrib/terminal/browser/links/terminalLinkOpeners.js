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
define(["require", "exports", "vs/base/common/network", "vs/base/common/uri", "vs/platform/commands/common/commands", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/quickinput/common/quickInput", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/terminal/browser/links/terminalLinkHelpers", "vs/workbench/contrib/terminal/browser/links/terminalLocalLinkDetector", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/host/browser/host", "vs/workbench/services/search/common/queryBuilder", "vs/workbench/services/search/common/search"], function (require, exports, network_1, uri_1, commands_1, files_1, instantiation_1, opener_1, quickInput_1, workspace_1, terminalLinkHelpers_1, terminalLocalLinkDetector_1, editorService_1, environmentService_1, host_1, queryBuilder_1, search_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalUrlLinkOpener = exports.TerminalSearchLinkOpener = exports.TerminalLocalFolderOutsideWorkspaceLinkOpener = exports.TerminalLocalFolderInWorkspaceLinkOpener = exports.TerminalLocalFileLinkOpener = void 0;
    let TerminalLocalFileLinkOpener = class TerminalLocalFileLinkOpener {
        constructor(_os, _editorService) {
            this._os = _os;
            this._editorService = _editorService;
        }
        async open(link) {
            if (!link.uri) {
                throw new Error('Tried to open file link without a resolved URI');
            }
            const lineColumnInfo = this.extractLineColumnInfo(link.text);
            const selection = {
                startLineNumber: lineColumnInfo.lineNumber,
                startColumn: lineColumnInfo.columnNumber
            };
            await this._editorService.openEditor({
                resource: link.uri,
                options: { pinned: true, selection, revealIfOpened: true }
            });
        }
        /**
         * Returns line and column number of URl if that is present, otherwise line 1 column 1.
         *
         * @param link Url link which may contain line and column number.
         */
        extractLineColumnInfo(link) {
            const matches = (0, terminalLocalLinkDetector_1.getLocalLinkRegex)(this._os).exec(link);
            const lineColumnInfo = {
                lineNumber: 1,
                columnNumber: 1
            };
            if (!matches) {
                return lineColumnInfo;
            }
            const lineAndColumnMatchIndex = this._os === 1 /* OperatingSystem.Windows */ ? terminalLocalLinkDetector_1.winLineAndColumnMatchIndex : terminalLocalLinkDetector_1.unixLineAndColumnMatchIndex;
            for (let i = 0; i < terminalLocalLinkDetector_1.lineAndColumnClause.length; i++) {
                const lineMatchIndex = lineAndColumnMatchIndex + (terminalLocalLinkDetector_1.lineAndColumnClauseGroupCount * i);
                const rowNumber = matches[lineMatchIndex];
                if (rowNumber) {
                    lineColumnInfo['lineNumber'] = parseInt(rowNumber, 10);
                    // Check if column number exists
                    const columnNumber = matches[lineMatchIndex + 2];
                    if (columnNumber) {
                        lineColumnInfo['columnNumber'] = parseInt(columnNumber, 10);
                    }
                    break;
                }
            }
            return lineColumnInfo;
        }
    };
    TerminalLocalFileLinkOpener = __decorate([
        __param(1, editorService_1.IEditorService)
    ], TerminalLocalFileLinkOpener);
    exports.TerminalLocalFileLinkOpener = TerminalLocalFileLinkOpener;
    let TerminalLocalFolderInWorkspaceLinkOpener = class TerminalLocalFolderInWorkspaceLinkOpener {
        constructor(_commandService) {
            this._commandService = _commandService;
        }
        async open(link) {
            if (!link.uri) {
                throw new Error('Tried to open folder in workspace link without a resolved URI');
            }
            await this._commandService.executeCommand('revealInExplorer', link.uri);
        }
    };
    TerminalLocalFolderInWorkspaceLinkOpener = __decorate([
        __param(0, commands_1.ICommandService)
    ], TerminalLocalFolderInWorkspaceLinkOpener);
    exports.TerminalLocalFolderInWorkspaceLinkOpener = TerminalLocalFolderInWorkspaceLinkOpener;
    let TerminalLocalFolderOutsideWorkspaceLinkOpener = class TerminalLocalFolderOutsideWorkspaceLinkOpener {
        constructor(_hostService) {
            this._hostService = _hostService;
        }
        async open(link) {
            if (!link.uri) {
                throw new Error('Tried to open folder in workspace link without a resolved URI');
            }
            this._hostService.openWindow([{ folderUri: link.uri }], { forceNewWindow: true });
        }
    };
    TerminalLocalFolderOutsideWorkspaceLinkOpener = __decorate([
        __param(0, host_1.IHostService)
    ], TerminalLocalFolderOutsideWorkspaceLinkOpener);
    exports.TerminalLocalFolderOutsideWorkspaceLinkOpener = TerminalLocalFolderOutsideWorkspaceLinkOpener;
    let TerminalSearchLinkOpener = class TerminalSearchLinkOpener {
        constructor(_capabilities, _localFileOpener, _localFolderInWorkspaceOpener, _os, _fileService, _instantiationService, _quickInputService, _searchService, _workspaceContextService, _workbenchEnvironmentService) {
            this._capabilities = _capabilities;
            this._localFileOpener = _localFileOpener;
            this._localFolderInWorkspaceOpener = _localFolderInWorkspaceOpener;
            this._os = _os;
            this._fileService = _fileService;
            this._instantiationService = _instantiationService;
            this._quickInputService = _quickInputService;
            this._searchService = _searchService;
            this._workspaceContextService = _workspaceContextService;
            this._workbenchEnvironmentService = _workbenchEnvironmentService;
            this._fileQueryBuilder = this._instantiationService.createInstance(queryBuilder_1.QueryBuilder);
        }
        async open(link) {
            var _a;
            const pathSeparator = (0, terminalLinkHelpers_1.osPathModule)(this._os).sep;
            // Remove file:/// and any leading ./ or ../ since quick access doesn't understand that format
            let text = link.text.replace(/^file:\/\/\/?/, '');
            text = (0, terminalLinkHelpers_1.osPathModule)(this._os).normalize(text).replace(/^(\.+[\\/])+/, '');
            // Remove `:in` from the end which is how Ruby outputs stack traces
            text = text.replace(/:in$/, '');
            // If any of the names of the folders in the workspace matches
            // a prefix of the link, remove that prefix and continue
            this._workspaceContextService.getWorkspace().folders.forEach((folder) => {
                if (text.substring(0, folder.name.length + 1) === folder.name + pathSeparator) {
                    text = text.substring(folder.name.length + 1);
                    return;
                }
            });
            let matchLink = text;
            if (this._capabilities.has(2 /* TerminalCapability.CommandDetection */)) {
                matchLink = (0, terminalLinkHelpers_1.updateLinkWithRelativeCwd)(this._capabilities, link.bufferRange.start.y, text, pathSeparator) || text;
            }
            const sanitizedLink = matchLink.replace(/:\d+(:\d+)?$/, '');
            try {
                const result = await this._getExactMatch(sanitizedLink);
                if (result) {
                    const { uri, isDirectory } = result;
                    const linkToOpen = {
                        // Use the absolute URI's path here so the optional line/col get detected
                        text: result.uri.fsPath + (((_a = matchLink.match(/:\d+(:\d+)?$/)) === null || _a === void 0 ? void 0 : _a[0]) || ''),
                        uri,
                        bufferRange: link.bufferRange,
                        type: link.type
                    };
                    if (uri) {
                        return isDirectory ? this._localFolderInWorkspaceOpener.open(linkToOpen) : this._localFileOpener.open(linkToOpen);
                    }
                }
            }
            catch (_b) {
                // Fallback to searching quick access
                return this._quickInputService.quickAccess.show(text);
            }
            // Fallback to searching quick access
            return this._quickInputService.quickAccess.show(text);
        }
        async _getExactMatch(sanitizedLink) {
            let resourceMatch;
            if ((0, terminalLinkHelpers_1.osPathModule)(this._os).isAbsolute(sanitizedLink)) {
                const scheme = this._workbenchEnvironmentService.remoteAuthority ? network_1.Schemas.vscodeRemote : network_1.Schemas.file;
                const uri = uri_1.URI.from({ scheme, path: sanitizedLink });
                try {
                    const fileStat = await this._fileService.stat(uri);
                    resourceMatch = { uri, isDirectory: fileStat.isDirectory };
                }
                catch (_a) {
                    // File or dir doesn't exist, continue on
                }
            }
            if (!resourceMatch) {
                const results = await this._searchService.fileSearch(this._fileQueryBuilder.file(this._workspaceContextService.getWorkspace().folders, {
                    // Remove optional :row:col from the link as openEditor supports it
                    filePattern: sanitizedLink,
                    maxResults: 2
                }));
                if (results.results.length === 1) {
                    resourceMatch = { uri: results.results[0].resource };
                }
            }
            return resourceMatch;
        }
    };
    TerminalSearchLinkOpener = __decorate([
        __param(4, files_1.IFileService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, quickInput_1.IQuickInputService),
        __param(7, search_1.ISearchService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService)
    ], TerminalSearchLinkOpener);
    exports.TerminalSearchLinkOpener = TerminalSearchLinkOpener;
    let TerminalUrlLinkOpener = class TerminalUrlLinkOpener {
        constructor(_isRemote, _openerService) {
            this._isRemote = _isRemote;
            this._openerService = _openerService;
        }
        async open(link) {
            if (!link.uri) {
                throw new Error('Tried to open a url without a resolved URI');
            }
            // It's important to use the raw string value here to avoid converting pre-encoded values
            // from the URL like `%2B` -> `+`.
            this._openerService.open(link.text, {
                allowTunneling: this._isRemote,
                allowContributedOpeners: true,
            });
        }
    };
    TerminalUrlLinkOpener = __decorate([
        __param(1, opener_1.IOpenerService)
    ], TerminalUrlLinkOpener);
    exports.TerminalUrlLinkOpener = TerminalUrlLinkOpener;
});
//# sourceMappingURL=terminalLinkOpeners.js.map