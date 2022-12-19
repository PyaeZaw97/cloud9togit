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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/htmlContent", "vs/base/common/lifecycle", "vs/base/common/network", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/uri", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/log/common/log", "vs/platform/tunnel/common/tunnel", "vs/workbench/contrib/terminal/browser/links/terminalExternalLinkDetector", "vs/workbench/contrib/terminal/browser/links/terminalLinkDetectorAdapter", "vs/workbench/contrib/terminal/browser/links/terminalLinkOpeners", "vs/workbench/contrib/terminal/browser/links/terminalLocalLinkDetector", "vs/workbench/contrib/terminal/browser/links/terminalShellIntegrationLinkDetector", "vs/workbench/contrib/terminal/browser/links/terminalUriLinkDetector", "vs/workbench/contrib/terminal/browser/links/terminalWordLinkDetector", "vs/workbench/contrib/terminal/browser/terminal", "vs/workbench/contrib/terminal/browser/widgets/terminalHoverWidget", "vs/workbench/contrib/terminal/common/terminal"], function (require, exports, dom_1, htmlContent_1, lifecycle_1, network_1, path_1, platform_1, uri_1, nls, configuration_1, files_1, instantiation_1, log_1, tunnel_1, terminalExternalLinkDetector_1, terminalLinkDetectorAdapter_1, terminalLinkOpeners_1, terminalLocalLinkDetector_1, terminalShellIntegrationLinkDetector_1, terminalUriLinkDetector_1, terminalWordLinkDetector_1, terminal_1, terminalHoverWidget_1, terminal_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TerminalLinkManager = void 0;
    /**
     * An object responsible for managing registration of link matchers and link providers.
     */
    let TerminalLinkManager = class TerminalLinkManager extends lifecycle_1.DisposableStore {
        constructor(_xterm, _processManager, capabilities, _configurationService, _fileService, _instantiationService, _logService, _tunnelService) {
            var _a;
            super();
            this._xterm = _xterm;
            this._processManager = _processManager;
            this._configurationService = _configurationService;
            this._fileService = _fileService;
            this._instantiationService = _instantiationService;
            this._logService = _logService;
            this._tunnelService = _tunnelService;
            this._standardLinkProviders = new Map();
            this._linkProvidersDisposables = [];
            this._externalLinkProviders = [];
            this._openers = new Map();
            // Link cache could be shared across all terminals, but that could lead to weird results when
            // both local and remote terminals are present
            this._resolvedLinkCache = new LinkCache();
            // Setup link detectors in their order of priority
            this._setupLinkDetector(terminalUriLinkDetector_1.TerminalUriLinkDetector.id, this._instantiationService.createInstance(terminalUriLinkDetector_1.TerminalUriLinkDetector, this._xterm, this._resolvePath.bind(this)));
            if (this._configurationService.getValue(terminal_2.TERMINAL_CONFIG_SECTION).enableFileLinks) {
                this._setupLinkDetector(terminalLocalLinkDetector_1.TerminalLocalLinkDetector.id, this._instantiationService.createInstance(terminalLocalLinkDetector_1.TerminalLocalLinkDetector, this._xterm, capabilities, this._processManager.os || platform_1.OS, this._resolvePath.bind(this)));
            }
            this._setupLinkDetector(terminalShellIntegrationLinkDetector_1.TerminalShellIntegrationLinkDetector.id, this._instantiationService.createInstance(terminalShellIntegrationLinkDetector_1.TerminalShellIntegrationLinkDetector, this._xterm));
            this._setupLinkDetector(terminalWordLinkDetector_1.TerminalWordLinkDetector.id, this._instantiationService.createInstance(terminalWordLinkDetector_1.TerminalWordLinkDetector, this._xterm));
            (_a = capabilities.get(0 /* TerminalCapability.CwdDetection */)) === null || _a === void 0 ? void 0 : _a.onDidChangeCwd(cwd => {
                this.processCwd = cwd;
            });
            // Setup link openers
            const localFileOpener = this._instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFileLinkOpener, this._processManager.os || platform_1.OS);
            const localFolderInWorkspaceOpener = this._instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderInWorkspaceLinkOpener);
            this._openers.set(0 /* TerminalBuiltinLinkType.LocalFile */, localFileOpener);
            this._openers.set(2 /* TerminalBuiltinLinkType.LocalFolderInWorkspace */, localFolderInWorkspaceOpener);
            this._openers.set(1 /* TerminalBuiltinLinkType.LocalFolderOutsideWorkspace */, this._instantiationService.createInstance(terminalLinkOpeners_1.TerminalLocalFolderOutsideWorkspaceLinkOpener));
            this._openers.set(3 /* TerminalBuiltinLinkType.Search */, this._instantiationService.createInstance(terminalLinkOpeners_1.TerminalSearchLinkOpener, capabilities, localFileOpener, localFolderInWorkspaceOpener, this._processManager.os || platform_1.OS));
            this._openers.set(4 /* TerminalBuiltinLinkType.Url */, this._instantiationService.createInstance(terminalLinkOpeners_1.TerminalUrlLinkOpener, !!this._processManager.remoteAuthority));
            this._registerStandardLinkProviders();
        }
        _setupLinkDetector(id, detector, isExternal = false) {
            const detectorAdapter = this._instantiationService.createInstance(terminalLinkDetectorAdapter_1.TerminalLinkDetectorAdapter, detector);
            detectorAdapter.onDidActivateLink(e => {
                var _a;
                // Prevent default electron link handling so Alt+Click mode works normally
                (_a = e.event) === null || _a === void 0 ? void 0 : _a.preventDefault();
                // Require correct modifier on click unless event is coming from linkQuickPick selection
                if (e.event && !(e.event instanceof terminal_1.TerminalLinkQuickPickEvent) && !this._isLinkActivationModifierDown(e.event)) {
                    return;
                }
                // Just call the handler if there is no before listener
                if (e.link.activate) {
                    // Custom activate call (external links only)
                    e.link.activate(e.link.text);
                }
                else {
                    this._openLink(e.link);
                }
            });
            detectorAdapter.onDidShowHover(e => this._tooltipCallback(e.link, e.viewportRange, e.modifierDownCallback, e.modifierUpCallback));
            if (!isExternal) {
                this._standardLinkProviders.set(id, detectorAdapter);
            }
            return detectorAdapter;
        }
        async _openLink(link) {
            this._logService.debug('Opening link', link);
            const opener = this._openers.get(link.type);
            if (!opener) {
                throw new Error(`No matching opener for link type "${link.type}"`);
            }
            await opener.open(link);
        }
        async openRecentLink(type) {
            let links;
            let i = this._xterm.buffer.active.length;
            while ((!links || links.length === 0) && i >= this._xterm.buffer.active.viewportY) {
                links = await this._getLinksForType(i, type);
                i--;
            }
            if (!links || links.length < 1) {
                return undefined;
            }
            const event = new terminal_1.TerminalLinkQuickPickEvent(dom_1.EventType.CLICK);
            links[0].activate(event, links[0].text);
            return links[0];
        }
        async getLinks() {
            const wordResults = [];
            const webResults = [];
            const fileResults = [];
            for (let i = this._xterm.buffer.active.length - 1; i >= this._xterm.buffer.active.viewportY; i--) {
                const links = await this._getLinksForLine(i);
                if (links) {
                    const { wordLinks, webLinks, fileLinks } = links;
                    if (wordLinks && wordLinks.length) {
                        wordResults.push(...wordLinks.reverse());
                    }
                    if (webLinks && webLinks.length) {
                        webResults.push(...webLinks.reverse());
                    }
                    if (fileLinks && fileLinks.length) {
                        fileResults.push(...fileLinks.reverse());
                    }
                }
            }
            return { webLinks: webResults, fileLinks: fileResults, wordLinks: wordResults };
        }
        async _getLinksForLine(y) {
            let unfilteredWordLinks = await this._getLinksForType(y, 'word');
            const webLinks = await this._getLinksForType(y, 'url');
            const fileLinks = await this._getLinksForType(y, 'localFile');
            const words = new Set();
            let wordLinks;
            if (unfilteredWordLinks) {
                wordLinks = [];
                for (const link of unfilteredWordLinks) {
                    if (!words.has(link.text) && link.text.length > 1) {
                        wordLinks.push(link);
                        words.add(link.text);
                    }
                }
            }
            return { wordLinks, webLinks, fileLinks };
        }
        async _getLinksForType(y, type) {
            switch (type) {
                case 'word':
                    return (await new Promise(r => { var _a; return (_a = this._standardLinkProviders.get(terminalWordLinkDetector_1.TerminalWordLinkDetector.id)) === null || _a === void 0 ? void 0 : _a.provideLinks(y, r); }));
                case 'url':
                    return (await new Promise(r => { var _a; return (_a = this._standardLinkProviders.get(terminalUriLinkDetector_1.TerminalUriLinkDetector.id)) === null || _a === void 0 ? void 0 : _a.provideLinks(y, r); }));
                case 'localFile': {
                    const links = (await new Promise(r => { var _a; return (_a = this._standardLinkProviders.get(terminalLocalLinkDetector_1.TerminalLocalLinkDetector.id)) === null || _a === void 0 ? void 0 : _a.provideLinks(y, r); }));
                    return links === null || links === void 0 ? void 0 : links.filter(link => link.type === 0 /* TerminalBuiltinLinkType.LocalFile */);
                }
            }
        }
        _tooltipCallback(link, viewportRange, modifierDownCallback, modifierUpCallback) {
            if (!this._widgetManager) {
                return;
            }
            const core = this._xterm._core;
            const cellDimensions = {
                width: core._renderService.dimensions.actualCellWidth,
                height: core._renderService.dimensions.actualCellHeight
            };
            const terminalDimensions = {
                width: this._xterm.cols,
                height: this._xterm.rows
            };
            // Don't pass the mouse event as this avoids the modifier check
            this._showHover({
                viewportRange,
                cellDimensions,
                terminalDimensions,
                modifierDownCallback,
                modifierUpCallback
            }, this._getLinkHoverString(link.text, link.label), link.actions, (text) => link.activate(undefined, text), link);
        }
        _showHover(targetOptions, text, actions, linkHandler, link) {
            if (this._widgetManager) {
                const widget = this._instantiationService.createInstance(terminalHoverWidget_1.TerminalHover, targetOptions, text, actions, linkHandler);
                const attached = this._widgetManager.attachWidget(widget);
                if (attached) {
                    link === null || link === void 0 ? void 0 : link.onInvalidated(() => attached.dispose());
                }
            }
        }
        setWidgetManager(widgetManager) {
            this._widgetManager = widgetManager;
        }
        set processCwd(processCwd) {
            this._processCwd = processCwd;
        }
        _clearLinkProviders() {
            (0, lifecycle_1.dispose)(this._linkProvidersDisposables);
            this._linkProvidersDisposables.length = 0;
        }
        _registerStandardLinkProviders() {
            for (const p of this._standardLinkProviders.values()) {
                this._linkProvidersDisposables.push(this._xterm.registerLinkProvider(p));
            }
        }
        registerExternalLinkProvider(provideLinks) {
            // Clear and re-register the standard link providers so they are a lower priority than the new one
            this._clearLinkProviders();
            const detectorId = `extension-${this._externalLinkProviders.length}`;
            const wrappedLinkProvider = this._setupLinkDetector(detectorId, new terminalExternalLinkDetector_1.TerminalExternalLinkDetector(detectorId, this._xterm, provideLinks), true);
            const newLinkProvider = this._xterm.registerLinkProvider(wrappedLinkProvider);
            this._externalLinkProviders.push(newLinkProvider);
            this._registerStandardLinkProviders();
            return newLinkProvider;
        }
        get _localLinkRegex() {
            if (!this._processManager) {
                throw new Error('Process manager is required');
            }
            const baseLocalLinkClause = this._processManager.os === 1 /* OperatingSystem.Windows */ ? terminalLocalLinkDetector_1.winLocalLinkClause : terminalLocalLinkDetector_1.unixLocalLinkClause;
            // Append line and column number regex
            return new RegExp(`${baseLocalLinkClause}(${terminalLocalLinkDetector_1.lineAndColumnClause})`);
        }
        _isLinkActivationModifierDown(event) {
            const editorConf = this._configurationService.getValue('editor');
            if (editorConf.multiCursorModifier === 'ctrlCmd') {
                return !!event.altKey;
            }
            return platform_1.isMacintosh ? event.metaKey : event.ctrlKey;
        }
        _getLinkHoverString(uri, label) {
            const editorConf = this._configurationService.getValue('editor');
            let clickLabel = '';
            if (editorConf.multiCursorModifier === 'ctrlCmd') {
                if (platform_1.isMacintosh) {
                    clickLabel = nls.localize('terminalLinkHandler.followLinkAlt.mac', "option + click");
                }
                else {
                    clickLabel = nls.localize('terminalLinkHandler.followLinkAlt', "alt + click");
                }
            }
            else {
                if (platform_1.isMacintosh) {
                    clickLabel = nls.localize('terminalLinkHandler.followLinkCmd', "cmd + click");
                }
                else {
                    clickLabel = nls.localize('terminalLinkHandler.followLinkCtrl', "ctrl + click");
                }
            }
            let fallbackLabel = nls.localize('followLink', "Follow link");
            try {
                if (this._tunnelService.canTunnel(uri_1.URI.parse(uri))) {
                    fallbackLabel = nls.localize('followForwardedLink', "Follow link using forwarded port");
                }
            }
            catch (_a) {
                // No-op, already set to fallback
            }
            const markdown = new htmlContent_1.MarkdownString('', true);
            // Escapes markdown in label & uri
            if (label) {
                label = markdown.appendText(label).value;
                markdown.value = '';
            }
            if (uri) {
                uri = markdown.appendText(uri).value;
                markdown.value = '';
            }
            label = label || fallbackLabel;
            // Use the label when uri is '' so the link displays correctly
            uri = uri || label;
            // Although if there is a space in the uri, just replace it completely
            if (/(\s|&nbsp;)/.test(uri)) {
                uri = nls.localize('followLinkUrl', 'Link');
            }
            return markdown.appendLink(uri, label).appendMarkdown(` (${clickLabel})`);
        }
        get _osPath() {
            if (!this._processManager) {
                throw new Error('Process manager is required');
            }
            if (this._processManager.os === 1 /* OperatingSystem.Windows */) {
                return path_1.win32;
            }
            return path_1.posix;
        }
        _preprocessPath(link) {
            if (!this._processManager) {
                throw new Error('Process manager is required');
            }
            if (link.charAt(0) === '~') {
                // Resolve ~ -> userHome
                if (!this._processManager.userHome) {
                    return null;
                }
                link = this._osPath.join(this._processManager.userHome, link.substring(1));
            }
            else if (link.charAt(0) !== '/' && link.charAt(0) !== '~') {
                // Resolve workspace path . | .. | <relative_path> -> <path>/. | <path>/.. | <path>/<relative_path>
                if (this._processManager.os === 1 /* OperatingSystem.Windows */) {
                    if (!link.match('^' + terminalLocalLinkDetector_1.winDrivePrefix) && !link.startsWith('\\\\?\\')) {
                        if (!this._processCwd) {
                            // Abort if no workspace is open
                            return null;
                        }
                        link = this._osPath.join(this._processCwd, link);
                    }
                    else {
                        // Remove \\?\ from paths so that they share the same underlying
                        // uri and don't open multiple tabs for the same file
                        link = link.replace(/^\\\\\?\\/, '');
                    }
                }
                else {
                    if (!this._processCwd) {
                        // Abort if no workspace is open
                        return null;
                    }
                    link = this._osPath.join(this._processCwd, link);
                }
            }
            link = this._osPath.normalize(link);
            return link;
        }
        async _resolvePath(link, uri) {
            if (!this._processManager) {
                throw new Error('Process manager is required');
            }
            // Check resolved link cache first
            const cached = this._resolvedLinkCache.get(uri || link);
            if (cached !== undefined) {
                return cached;
            }
            if (uri) {
                try {
                    const stat = await this._fileService.stat(uri);
                    const result = { uri, link, isDirectory: stat.isDirectory };
                    this._resolvedLinkCache.set(uri, result);
                    return result;
                }
                catch (e) {
                    // Does not exist
                    this._resolvedLinkCache.set(uri, null);
                    return null;
                }
            }
            const preprocessedLink = this._preprocessPath(link);
            if (!preprocessedLink) {
                this._resolvedLinkCache.set(link, null);
                return null;
            }
            const linkUrl = this.extractLinkUrl(preprocessedLink);
            if (!linkUrl) {
                this._resolvedLinkCache.set(link, null);
                return null;
            }
            try {
                let uri;
                if (this._processManager.remoteAuthority) {
                    uri = uri_1.URI.from({
                        scheme: network_1.Schemas.vscodeRemote,
                        authority: this._processManager.remoteAuthority,
                        path: linkUrl
                    });
                }
                else {
                    uri = uri_1.URI.file(linkUrl);
                }
                try {
                    const stat = await this._fileService.stat(uri);
                    const result = { uri, link, isDirectory: stat.isDirectory };
                    this._resolvedLinkCache.set(link, result);
                    return result;
                }
                catch (e) {
                    // Does not exist
                    this._resolvedLinkCache.set(link, null);
                    return null;
                }
            }
            catch (_a) {
                // Errors in parsing the path
                this._resolvedLinkCache.set(link, null);
                return null;
            }
        }
        /**
         * Returns url from link as link may contain line and column information.
         *
         * @param link url link which may contain line and column number.
         */
        extractLinkUrl(link) {
            const matches = this._localLinkRegex.exec(link);
            if (!matches) {
                return null;
            }
            return matches[1];
        }
    };
    TerminalLinkManager = __decorate([
        __param(3, configuration_1.IConfigurationService),
        __param(4, files_1.IFileService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, log_1.ILogService),
        __param(7, tunnel_1.ITunnelService)
    ], TerminalLinkManager);
    exports.TerminalLinkManager = TerminalLinkManager;
    var LinkCacheConstants;
    (function (LinkCacheConstants) {
        /**
         * How long to cache links for in milliseconds, the TTL resets whenever a new value is set in
         * the cache.
         */
        LinkCacheConstants[LinkCacheConstants["TTL"] = 10000] = "TTL";
    })(LinkCacheConstants || (LinkCacheConstants = {}));
    class LinkCache {
        constructor() {
            this._cache = new Map();
            this._cacheTilTimeout = 0;
        }
        set(link, value) {
            // Reset cached link TTL on any set
            if (this._cacheTilTimeout) {
                window.clearTimeout(this._cacheTilTimeout);
            }
            this._cacheTilTimeout = window.setTimeout(() => this._cache.clear(), 10000 /* LinkCacheConstants.TTL */);
            this._cache.set(this._getKey(link), value);
        }
        get(link) {
            return this._cache.get(this._getKey(link));
        }
        _getKey(link) {
            if (uri_1.URI.isUri(link)) {
                return link.toString();
            }
            return link;
        }
    }
});
//# sourceMappingURL=terminalLinkManager.js.map