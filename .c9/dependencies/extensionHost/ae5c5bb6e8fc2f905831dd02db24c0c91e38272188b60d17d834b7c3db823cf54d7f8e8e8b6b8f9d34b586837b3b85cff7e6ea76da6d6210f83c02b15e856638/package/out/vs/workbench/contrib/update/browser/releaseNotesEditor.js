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
define(["require", "exports", "vs/base/common/cancellation", "vs/base/common/errors", "vs/base/common/htmlContent", "vs/base/common/keybindingParser", "vs/base/common/platform", "vs/base/common/strings", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/languages", "vs/editor/common/languages/supports/tokenization", "vs/editor/common/languages/language", "vs/nls", "vs/platform/environment/common/environment", "vs/platform/keybinding/common/keybinding", "vs/platform/opener/common/opener", "vs/platform/product/common/productService", "vs/platform/request/common/request", "vs/workbench/contrib/markdown/browser/markdownDocumentRenderer", "vs/workbench/contrib/webviewPanel/browser/webviewWorkbenchService", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions", "vs/platform/telemetry/common/telemetryUtils", "vs/platform/configuration/common/configuration", "vs/css!./media/releasenoteseditor"], function (require, exports, cancellation_1, errors_1, htmlContent_1, keybindingParser_1, platform_1, strings_1, uri_1, uuid_1, languages_1, tokenization_1, language_1, nls, environment_1, keybinding_1, opener_1, productService_1, request_1, markdownDocumentRenderer_1, webviewWorkbenchService_1, editorGroupsService_1, editorService_1, extensions_1, telemetryUtils_1, configuration_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ReleaseNotesManager = void 0;
    let ReleaseNotesManager = class ReleaseNotesManager {
        constructor(_environmentService, _keybindingService, _languageService, _openerService, _requestService, _configurationService, _editorService, _editorGroupService, _webviewWorkbenchService, _extensionService, _productService) {
            this._environmentService = _environmentService;
            this._keybindingService = _keybindingService;
            this._languageService = _languageService;
            this._openerService = _openerService;
            this._requestService = _requestService;
            this._configurationService = _configurationService;
            this._editorService = _editorService;
            this._editorGroupService = _editorGroupService;
            this._webviewWorkbenchService = _webviewWorkbenchService;
            this._extensionService = _extensionService;
            this._productService = _productService;
            this._releaseNotesCache = new Map();
            this._currentReleaseNotes = undefined;
            languages_1.TokenizationRegistry.onDidChange(async () => {
                if (!this._currentReleaseNotes || !this._lastText) {
                    return;
                }
                const html = await this.renderBody(this._lastText);
                if (this._currentReleaseNotes) {
                    this._currentReleaseNotes.webview.html = html;
                }
            });
        }
        async show(accessor, version) {
            const releaseNoteText = await this.loadReleaseNotes(version);
            this._lastText = releaseNoteText;
            const html = await this.renderBody(releaseNoteText);
            const title = nls.localize('releaseNotesInputName', "Release Notes: {0}", version);
            const activeEditorPane = this._editorService.activeEditorPane;
            if (this._currentReleaseNotes) {
                this._currentReleaseNotes.setName(title);
                this._currentReleaseNotes.webview.html = html;
                this._webviewWorkbenchService.revealWebview(this._currentReleaseNotes, activeEditorPane ? activeEditorPane.group : this._editorGroupService.activeGroup, false);
            }
            else {
                this._currentReleaseNotes = this._webviewWorkbenchService.createWebview((0, uuid_1.generateUuid)(), 'releaseNotes', title, { group: editorService_1.ACTIVE_GROUP, preserveFocus: false }, {
                    tryRestoreScrollPosition: true,
                    enableFindWidget: true,
                }, {
                    localResourceRoots: []
                }, undefined);
                this._currentReleaseNotes.webview.onDidClickLink(uri => this.onDidClickLink(uri_1.URI.parse(uri)));
                this._currentReleaseNotes.onWillDispose(() => { this._currentReleaseNotes = undefined; });
                this._currentReleaseNotes.webview.html = html;
            }
            return true;
        }
        async loadReleaseNotes(version) {
            const match = /^(\d+\.\d+)\./.exec(version);
            if (!match) {
                throw new Error('not found');
            }
            const versionLabel = match[1].replace(/\./g, '_');
            const baseUrl = 'https://code.visualstudio.com/raw';
            const url = `${baseUrl}/v${versionLabel}.md`;
            const unassigned = nls.localize('unassigned', "unassigned");
            const escapeMdHtml = (text) => {
                return (0, strings_1.escape)(text).replace(/\\/g, '\\\\');
            };
            const patchKeybindings = (text) => {
                const kb = (match, kb) => {
                    const keybinding = this._keybindingService.lookupKeybinding(kb);
                    if (!keybinding) {
                        return unassigned;
                    }
                    return keybinding.getLabel() || unassigned;
                };
                const kbstyle = (match, kb) => {
                    const keybinding = keybindingParser_1.KeybindingParser.parseKeybinding(kb, platform_1.OS);
                    if (!keybinding) {
                        return unassigned;
                    }
                    const resolvedKeybindings = this._keybindingService.resolveKeybinding(keybinding);
                    if (resolvedKeybindings.length === 0) {
                        return unassigned;
                    }
                    return resolvedKeybindings[0].getLabel() || unassigned;
                };
                const kbCode = (match, binding) => {
                    const resolved = kb(match, binding);
                    return resolved ? `<code title="${binding}">${escapeMdHtml(resolved)}</code>` : resolved;
                };
                const kbstyleCode = (match, binding) => {
                    const resolved = kbstyle(match, binding);
                    return resolved ? `<code title="${binding}">${escapeMdHtml(resolved)}</code>` : resolved;
                };
                return text
                    .replace(/`kb\(([a-z.\d\-]+)\)`/gi, kbCode)
                    .replace(/`kbstyle\(([^\)]+)\)`/gi, kbstyleCode)
                    .replace(/kb\(([a-z.\d\-]+)\)/gi, (match, binding) => (0, htmlContent_1.escapeMarkdownSyntaxTokens)(kb(match, binding)))
                    .replace(/kbstyle\(([^\)]+)\)/gi, (match, binding) => (0, htmlContent_1.escapeMarkdownSyntaxTokens)(kbstyle(match, binding)));
            };
            const fetchReleaseNotes = async () => {
                let text;
                try {
                    text = await (0, request_1.asTextOrError)(await this._requestService.request({ url }, cancellation_1.CancellationToken.None));
                }
                catch (_a) {
                    throw new Error('Failed to fetch release notes');
                }
                if (!text || !/^#\s/.test(text)) { // release notes always starts with `#` followed by whitespace
                    throw new Error('Invalid release notes');
                }
                return patchKeybindings(text);
            };
            if (!this._releaseNotesCache.has(version)) {
                this._releaseNotesCache.set(version, (async () => {
                    try {
                        return await fetchReleaseNotes();
                    }
                    catch (err) {
                        this._releaseNotesCache.delete(version);
                        throw err;
                    }
                })());
            }
            return this._releaseNotesCache.get(version);
        }
        onDidClickLink(uri) {
            this.addGAParameters(uri, 'ReleaseNotes')
                .then(updated => this._openerService.open(updated))
                .then(undefined, errors_1.onUnexpectedError);
        }
        async addGAParameters(uri, origin, experiment = '1') {
            if ((0, telemetryUtils_1.supportsTelemetry)(this._productService, this._environmentService) && (0, telemetryUtils_1.getTelemetryLevel)(this._configurationService) === 3 /* TelemetryLevel.USAGE */) {
                if (uri.scheme === 'https' && uri.authority === 'code.visualstudio.com') {
                    return uri.with({ query: `${uri.query ? uri.query + '&' : ''}utm_source=VsCode&utm_medium=${encodeURIComponent(origin)}&utm_content=${encodeURIComponent(experiment)}` });
                }
            }
            return uri;
        }
        async renderBody(text) {
            const nonce = (0, uuid_1.generateUuid)();
            const content = await (0, markdownDocumentRenderer_1.renderMarkdownDocument)(text, this._extensionService, this._languageService, false);
            const colorMap = languages_1.TokenizationRegistry.getColorMap();
            const css = colorMap ? (0, tokenization_1.generateTokensCSSForColorMap)(colorMap) : '';
            return `<!DOCTYPE html>
		<html>
			<head>
				<base href="https://code.visualstudio.com/raw/">
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; media-src https:; style-src 'nonce-${nonce}' https://code.visualstudio.com;">
				<style nonce="${nonce}">
					${markdownDocumentRenderer_1.DEFAULT_MARKDOWN_STYLES}
					${css}
				</style>
			</head>
			<body>${content}</body>
		</html>`;
        }
    };
    ReleaseNotesManager = __decorate([
        __param(0, environment_1.IEnvironmentService),
        __param(1, keybinding_1.IKeybindingService),
        __param(2, language_1.ILanguageService),
        __param(3, opener_1.IOpenerService),
        __param(4, request_1.IRequestService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorGroupsService_1.IEditorGroupsService),
        __param(8, webviewWorkbenchService_1.IWebviewWorkbenchService),
        __param(9, extensions_1.IExtensionService),
        __param(10, productService_1.IProductService)
    ], ReleaseNotesManager);
    exports.ReleaseNotesManager = ReleaseNotesManager;
});
//# sourceMappingURL=releaseNotesEditor.js.map