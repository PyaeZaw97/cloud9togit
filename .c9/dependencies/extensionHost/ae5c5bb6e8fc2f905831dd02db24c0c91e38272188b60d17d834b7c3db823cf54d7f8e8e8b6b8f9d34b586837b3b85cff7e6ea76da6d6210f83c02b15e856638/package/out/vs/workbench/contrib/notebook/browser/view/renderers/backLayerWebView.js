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
define(["require", "exports", "vs/base/common/arrays", "vs/base/common/buffer", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/mime", "vs/base/common/network", "vs/base/common/platform", "vs/base/common/resources", "vs/base/common/uri", "vs/base/common/uuid", "vs/editor/common/languages", "vs/editor/common/languages/language", "vs/editor/common/languages/supports/tokenization", "vs/editor/common/languages/textToHtmlTokenizer", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/dialogs/common/dialogs", "vs/platform/files/common/files", "vs/platform/opener/common/opener", "vs/platform/workspace/common/workspace", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/common/webview", "vs/workbench/contrib/notebook/browser/notebookBrowser", "vs/workbench/contrib/notebook/browser/view/notebookCellList", "vs/workbench/contrib/notebook/browser/view/renderers/webviewPreloads", "vs/workbench/contrib/notebook/browser/view/renderers/webviewThemeMapping", "vs/workbench/contrib/notebook/browser/viewModel/markupCellViewModel", "vs/workbench/contrib/notebook/common/notebookCommon", "vs/workbench/contrib/notebook/common/notebookService", "vs/workbench/contrib/webview/browser/webview", "vs/workbench/contrib/webview/browser/webviewWindowDragMonitor", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/environment/common/environmentService"], function (require, exports, arrays_1, buffer_1, event_1, lifecycle_1, mime_1, network_1, platform_1, resources_1, uri_1, UUID, languages_1, language_1, tokenization_1, textToHtmlTokenizer_1, nls, menuEntryActionViewItem_1, actions_1, configuration_1, contextkey_1, contextView_1, dialogs_1, files_1, opener_1, workspace_1, workspaceTrust_1, webview_1, notebookBrowser_1, notebookCellList_1, webviewPreloads_1, webviewThemeMapping_1, markupCellViewModel_1, notebookCommon_1, notebookService_1, webview_2, webviewWindowDragMonitor_1, editorGroupsService_1, environmentService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.BackLayerWebView = void 0;
    let BackLayerWebView = class BackLayerWebView extends lifecycle_1.Disposable {
        constructor(notebookEditor, id, documentUri, options, rendererMessaging, webviewService, openerService, notebookService, contextService, environmentService, fileDialogService, fileService, contextMenuService, menuService, contextKeyService, workspaceTrustManagementService, configurationService, languageService, workspaceContextService, editorGroupService) {
            super();
            this.notebookEditor = notebookEditor;
            this.id = id;
            this.documentUri = documentUri;
            this.options = options;
            this.rendererMessaging = rendererMessaging;
            this.webviewService = webviewService;
            this.openerService = openerService;
            this.notebookService = notebookService;
            this.contextService = contextService;
            this.environmentService = environmentService;
            this.fileDialogService = fileDialogService;
            this.fileService = fileService;
            this.contextMenuService = contextMenuService;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
            this.workspaceTrustManagementService = workspaceTrustManagementService;
            this.configurationService = configurationService;
            this.languageService = languageService;
            this.workspaceContextService = workspaceContextService;
            this.editorGroupService = editorGroupService;
            this.webview = undefined;
            this.insetMapping = new Map();
            this.markupPreviewMapping = new Map();
            this.hiddenInsetMapping = new Set();
            this.reversedInsetMapping = new Map();
            this.localResourceRootsCache = undefined;
            this._onMessage = this._register(new event_1.Emitter());
            this._preloadsCache = new Set();
            this.onMessage = this._onMessage.event;
            this._disposed = false;
            this.nonce = UUID.generateUuid();
            this.element = document.createElement('div');
            this.element.style.height = '1400px';
            this.element.style.position = 'absolute';
            if (rendererMessaging) {
                this._register(rendererMessaging);
                rendererMessaging.receiveMessageHandler = (rendererId, message) => {
                    if (!this.webview || this._disposed) {
                        return Promise.resolve(false);
                    }
                    this._sendMessageToWebview({
                        __vscode_notebook_message: true,
                        type: 'customRendererMessage',
                        rendererId: rendererId,
                        message: message
                    });
                    return Promise.resolve(true);
                };
            }
            this._register(workspaceTrustManagementService.onDidChangeTrust(e => {
                this._sendMessageToWebview({
                    type: 'updateWorkspaceTrust',
                    isTrusted: e,
                });
            }));
            this._register(languages_1.TokenizationRegistry.onDidChange(() => {
                this._sendMessageToWebview({
                    type: 'tokenizedStylesChanged',
                    css: getTokenizationCss(),
                });
            }));
        }
        updateOptions(options) {
            this.options = options;
            this._updateStyles();
            this._updateOptions();
        }
        _updateStyles() {
            this._sendMessageToWebview({
                type: 'notebookStyles',
                styles: this._generateStyles()
            });
        }
        _updateOptions() {
            this._sendMessageToWebview({
                type: 'notebookOptions',
                options: {
                    dragAndDropEnabled: this.options.dragAndDropEnabled
                }
            });
        }
        _generateStyles() {
            return {
                'notebook-output-left-margin': `${this.options.leftMargin + this.options.runGutter}px`,
                'notebook-output-width': `calc(100% - ${this.options.leftMargin + this.options.rightMargin + this.options.runGutter}px)`,
                'notebook-output-node-padding': `${this.options.outputNodePadding}px`,
                'notebook-run-gutter': `${this.options.runGutter}px`,
                'notebook-preview-node-padding': `${this.options.previewNodePadding}px`,
                'notebook-markdown-left-margin': `${this.options.markdownLeftMargin}px`,
                'notebook-output-node-left-padding': `${this.options.outputNodeLeftPadding}px`,
                'notebook-markdown-min-height': `${this.options.previewNodePadding * 2}px`,
                'notebook-markup-font-size': typeof this.options.markupFontSize === 'number' && this.options.markupFontSize > 0 ? `${this.options.markupFontSize}px` : `calc(${this.options.fontSize}px * 1.2)`,
                'notebook-cell-output-font-size': `${this.options.outputFontSize || this.options.fontSize}px`,
                'notebook-cell-output-line-height': `${this.options.outputLineHeight}px`,
                'notebook-cell-output-font-family': this.options.outputFontFamily || this.options.fontFamily,
                'notebook-cell-markup-empty-content': nls.localize('notebook.emptyMarkdownPlaceholder', "Empty markdown cell, double click or press enter to edit."),
                'notebook-cell-renderer-not-found-error': nls.localize({
                    key: 'notebook.error.rendererNotFound',
                    comment: ['$0 is a placeholder for the mime type']
                }, "No renderer found for '$0' a"),
            };
        }
        generateContent(coreDependencies, baseUrl) {
            var _a;
            const renderersData = this.getRendererData();
            const preloadScript = (0, webviewPreloads_1.preloadsScriptStr)(this.options, { dragAndDropEnabled: this.options.dragAndDropEnabled }, renderersData, this.workspaceTrustManagementService.isWorkspaceTrusted(), (_a = this.configurationService.getValue(notebookCommon_1.NotebookSetting.textOutputLineLimit)) !== null && _a !== void 0 ? _a : 30, this.nonce);
            const enableCsp = this.configurationService.getValue('notebook.experimental.enableCsp');
            return /* html */ `
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<base href="${baseUrl}/" />
				${enableCsp ?
                `<meta http-equiv="Content-Security-Policy" content="
					default-src 'none';
					script-src ${webview_1.webviewGenericCspSource} 'unsafe-inline' 'unsafe-eval';
					style-src ${webview_1.webviewGenericCspSource} 'unsafe-inline';
					img-src ${webview_1.webviewGenericCspSource} https: http: data:;
					font-src ${webview_1.webviewGenericCspSource} https:;
					connect-src https:;
					child-src https: data:;
				">` : ''}
				<style nonce="${this.nonce}">
					::highlight(find-highlight) {
						background-color: var(--vscode-editor-findMatchHighlightBackground);
					}

					::highlight(current-find-highlight) {
						background-color: var(--vscode-editor-findMatchBackground);
					}

					#container .cell_container {
						width: 100%;
					}

					#container .output_container {
						width: 100%;
					}

					#container > div > div > div.output {
						font-size: var(--notebook-cell-output-font-size);
						width: var(--notebook-output-width);
						margin-left: var(--notebook-output-left-margin);
						padding-top: var(--notebook-output-node-padding);
						padding-right: var(--notebook-output-node-padding);
						padding-bottom: var(--notebook-output-node-padding);
						padding-left: var(--notebook-output-node-left-padding);
						box-sizing: border-box;
						border-top: none !important;
						border: 1px solid var(--theme-notebook-output-border);
						background-color: var(--theme-notebook-output-background);
					}

					/* markdown */
					#container div.preview {
						width: 100%;
						padding-right: var(--notebook-preview-node-padding);
						padding-left: var(--notebook-markdown-left-margin);
						padding-top: var(--notebook-preview-node-padding);
						padding-bottom: var(--notebook-preview-node-padding);

						box-sizing: border-box;
						white-space: nowrap;
						overflow: hidden;
						white-space: initial;

						font-size: var(--notebook-markup-font-size);
						color: var(--theme-ui-foreground);
					}

					#container div.preview.draggable {
						user-select: none;
						-webkit-user-select: none;
						-ms-user-select: none;
						cursor: grab;
					}

					#container div.preview.selected {
						background: var(--theme-notebook-cell-selected-background);
					}

					#container div.preview.dragging {
						background-color: var(--theme-background);
						opacity: 0.5 !important;
					}

					.monaco-workbench.vs-dark .notebookOverlay .cell.markdown .latex img,
					.monaco-workbench.vs-dark .notebookOverlay .cell.markdown .latex-block img {
						filter: brightness(0) invert(1)
					}

					#container > div.nb-symbolHighlight {
						background-color: var(--theme-notebook-symbol-highlight-background);
					}

					#container > div.nb-cellDeleted .output_container {
						background-color: var(--theme-notebook-diff-removed-background);
					}

					#container > div.nb-cellAdded .output_container {
						background-color: var(--theme-notebook-diff-inserted-background);
					}

					#container > div > div:not(.preview) > div {
						overflow-x: auto;
					}

					#container .no-renderer-error {
						color: var(--vscode-editorError-foreground);
					}

					body {
						padding: 0px;
						height: 100%;
						width: 100%;
					}

					table, thead, tr, th, td, tbody {
						border: none !important;
						border-color: transparent;
						border-spacing: 0;
						border-collapse: collapse;
					}

					table, th, tr {
						vertical-align: middle;
						text-align: right;
					}

					thead {
						font-weight: bold;
						background-color: rgba(130, 130, 130, 0.16);
					}

					th, td {
						padding: 4px 8px;
					}

					tr:nth-child(even) {
						background-color: rgba(130, 130, 130, 0.08);
					}

					tbody th {
						font-weight: normal;
					}

					.find-match {
						background-color: var(--vscode-editor-findMatchHighlightBackground);
					}

					.current-find-match {
						background-color: var(--vscode-editor-findMatchBackground);
					}

					#_defaultColorPalatte {
						color: var(--vscode-editor-findMatchHighlightBackground);
						background-color: var(--vscode-editor-findMatchBackground);
					}
				</style>
				<style id="vscode-tokenization-styles" nonce="${this.nonce}">${getTokenizationCss()}</style>
			</head>
			<body style="overflow: hidden;">
				<script>
					self.require = {};
				</script>
				${coreDependencies}
				<div id='findStart' tabIndex=-1></div>
				<div id='container' class="widgetarea" style="position: absolute;width:100%;top: 0px"></div>
				<script type="module">${preloadScript}</script>
				<div id="container" class="widgetarea" style="position: absolute; width:100%; top: 0px"></div>
				<div id="_defaultColorPalatte"></div>
			</body>
		</html>`;
        }
        getRendererData() {
            return this.notebookService.getRenderers().map((renderer) => {
                const entrypoint = this.asWebviewUri(renderer.entrypoint, renderer.extensionLocation).toString();
                return {
                    id: renderer.id,
                    entrypoint,
                    mimeTypes: renderer.mimeTypes,
                    extends: renderer.extends,
                    messaging: renderer.messaging !== "never" /* RendererMessagingSpec.Never */,
                    isBuiltin: renderer.isBuiltin
                };
            });
        }
        asWebviewUri(uri, fromExtension) {
            return (0, webview_1.asWebviewUri)(uri, (fromExtension === null || fromExtension === void 0 ? void 0 : fromExtension.scheme) === network_1.Schemas.vscodeRemote ? { isRemote: true, authority: fromExtension.authority } : undefined);
        }
        postKernelMessage(message) {
            this._sendMessageToWebview({
                __vscode_notebook_message: true,
                type: 'customKernelMessage',
                message,
            });
        }
        resolveOutputId(id) {
            const output = this.reversedInsetMapping.get(id);
            if (!output) {
                return;
            }
            const cellInfo = this.insetMapping.get(output).cellInfo;
            return { cellInfo, output };
        }
        isResolved() {
            return !!this.webview;
        }
        async createWebview() {
            const baseUrl = this.asWebviewUri((0, resources_1.dirname)(this.documentUri), undefined);
            // Python notebooks assume that requirejs is a global.
            // For all other notebooks, they need to provide their own loader.
            if (!this.documentUri.path.toLowerCase().endsWith('.ipynb')) {
                const htmlContent = this.generateContent('', baseUrl.toString());
                this._initialize(htmlContent);
                return;
            }
            let coreDependencies = '';
            let resolveFunc;
            this._initialized = new Promise((resolve) => {
                resolveFunc = resolve;
            });
            if (!platform_1.isWeb) {
                const loaderUri = network_1.FileAccess.asFileUri('vs/loader.js', require);
                const loader = this.asWebviewUri(loaderUri, undefined);
                coreDependencies = `<script src="${loader}"></script><script>
			var requirejs = (function() {
				return require;
			}());
			</script>`;
                const htmlContent = this.generateContent(coreDependencies, baseUrl.toString());
                this._initialize(htmlContent);
                resolveFunc();
            }
            else {
                const loaderUri = network_1.FileAccess.asBrowserUri('vs/loader.js', require);
                fetch(loaderUri.toString(true)).then(async (response) => {
                    if (response.status !== 200) {
                        throw new Error(response.statusText);
                    }
                    const loaderJs = await response.text();
                    coreDependencies = `
<script>
${loaderJs}
</script>
<script>
var requirejs = (function() {
	return require;
}());
</script>
`;
                    const htmlContent = this.generateContent(coreDependencies, baseUrl.toString());
                    this._initialize(htmlContent);
                    resolveFunc();
                }, error => {
                    // the fetch request is rejected
                    const htmlContent = this.generateContent(coreDependencies, baseUrl.toString());
                    this._initialize(htmlContent);
                    resolveFunc();
                });
            }
            await this._initialized;
        }
        getBuiltinLocalResourceRoots() {
            // Python notebooks assume that requirejs is a global.
            // For all other notebooks, they need to provide their own loader.
            if (!this.documentUri.path.toLowerCase().endsWith('.ipynb')) {
                return [];
            }
            if (platform_1.isWeb) {
                return []; // script is inlined
            }
            return [
                (0, resources_1.dirname)(network_1.FileAccess.asFileUri('vs/loader.js', require)),
            ];
        }
        _initialize(content) {
            if (!document.body.contains(this.element)) {
                throw new Error('Element is already detached from the DOM tree');
            }
            this.webview = this._createInset(this.webviewService, content);
            this.webview.mountTo(this.element);
            this._register(this.webview);
            this._register(new webviewWindowDragMonitor_1.WebviewWindowDragMonitor(() => this.webview));
            this._register(this.webview.onDidClickLink(link => {
                if (this._disposed) {
                    return;
                }
                if (!link) {
                    return;
                }
                if ((0, opener_1.matchesScheme)(link, network_1.Schemas.command)) {
                    const ret = /command\:workbench\.action\.openLargeOutput\?(.*)/.exec(link);
                    if (ret && ret.length === 2) {
                        const outputId = ret[1];
                        this.openerService.open(notebookCommon_1.CellUri.generateCellOutputUri(this.documentUri, outputId));
                        return;
                    }
                    console.warn('Command links are deprecated and will be removed, use message passing instead: https://github.com/microsoft/vscode/issues/123601');
                }
                if ((0, opener_1.matchesScheme)(link, network_1.Schemas.command)) {
                    if (this.workspaceTrustManagementService.isWorkspaceTrusted()) {
                        this.openerService.open(link, { fromUserGesture: true, allowContributedOpeners: true, allowCommands: true });
                    }
                    else {
                        console.warn('Command links are disabled in untrusted workspaces');
                    }
                }
                else if ((0, opener_1.matchesSomeScheme)(link, network_1.Schemas.vscodeNotebookCell, network_1.Schemas.http, network_1.Schemas.https, network_1.Schemas.mailto)) {
                    this.openerService.open(link, { fromUserGesture: true, allowContributedOpeners: true, allowCommands: true });
                }
            }));
            this._register(this.webview.onMessage((message) => {
                var _a;
                const data = message.message;
                if (this._disposed) {
                    return;
                }
                if (!data.__vscode_notebook_message) {
                    return;
                }
                switch (data.type) {
                    case 'initialized': {
                        this.initializeWebViewState();
                        break;
                    }
                    case 'dimension': {
                        for (const update of data.updates) {
                            const height = update.height;
                            if (update.isOutput) {
                                const resolvedResult = this.resolveOutputId(update.id);
                                if (resolvedResult) {
                                    const { cellInfo, output } = resolvedResult;
                                    this.notebookEditor.updateOutputHeight(cellInfo, output, height, !!update.init, 'webview#dimension');
                                    this.notebookEditor.scheduleOutputHeightAck(cellInfo, update.id, height);
                                }
                            }
                            else {
                                this.notebookEditor.updateMarkupCellHeight(update.id, height, !!update.init);
                            }
                        }
                        break;
                    }
                    case 'mouseenter': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.outputIsHovered = true;
                            }
                        }
                        break;
                    }
                    case 'mouseleave': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.outputIsHovered = false;
                            }
                        }
                        break;
                    }
                    case 'outputFocus': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.outputIsFocused = true;
                            }
                        }
                        break;
                    }
                    case 'outputBlur': {
                        const resolvedResult = this.resolveOutputId(data.id);
                        if (resolvedResult) {
                            const latestCell = this.notebookEditor.getCellByInfo(resolvedResult.cellInfo);
                            if (latestCell) {
                                latestCell.outputIsFocused = false;
                            }
                        }
                        break;
                    }
                    case 'scroll-ack': {
                        // const date = new Date();
                        // const top = data.data.top;
                        // console.log('ack top ', top, ' version: ', data.version, ' - ', date.getMinutes() + ':' + date.getSeconds() + ':' + date.getMilliseconds());
                        break;
                    }
                    case 'scroll-to-reveal': {
                        this.notebookEditor.setScrollTop(data.scrollTop - notebookCellList_1.NOTEBOOK_WEBVIEW_BOUNDARY);
                        break;
                    }
                    case 'did-scroll-wheel': {
                        this.notebookEditor.triggerScroll(Object.assign(Object.assign({}, data.payload), { preventDefault: () => { }, stopPropagation: () => { } }));
                        break;
                    }
                    case 'focus-editor': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell) {
                            if (data.focusNext) {
                                this.notebookEditor.focusNextNotebookCell(cell, 'editor');
                            }
                            else {
                                this.notebookEditor.focusNotebookCell(cell, 'editor');
                            }
                        }
                        break;
                    }
                    case 'clicked-data-url': {
                        this._onDidClickDataLink(data);
                        break;
                    }
                    case 'clicked-link': {
                        let linkToOpen;
                        if ((0, opener_1.matchesScheme)(data.href, network_1.Schemas.command)) {
                            const ret = /command\:workbench\.action\.openLargeOutput\?(.*)/.exec(data.href);
                            if (ret && ret.length === 2) {
                                const outputId = ret[1];
                                const group = this.editorGroupService.activeGroup;
                                if (group) {
                                    if (group.activeEditor) {
                                        group.pinEditor(group.activeEditor);
                                    }
                                }
                                this.openerService.open(notebookCommon_1.CellUri.generateCellOutputUri(this.documentUri, outputId));
                                return;
                            }
                        }
                        if ((0, opener_1.matchesSomeScheme)(data.href, network_1.Schemas.http, network_1.Schemas.https, network_1.Schemas.mailto, network_1.Schemas.command, network_1.Schemas.vscodeNotebookCell, network_1.Schemas.vscodeNotebook)) {
                            linkToOpen = data.href;
                        }
                        else if (!/^[\w\-]+:/.test(data.href)) {
                            if (this.documentUri.scheme === network_1.Schemas.untitled) {
                                const folders = this.workspaceContextService.getWorkspace().folders;
                                if (!folders.length) {
                                    return;
                                }
                                linkToOpen = uri_1.URI.joinPath(folders[0].uri, data.href);
                            }
                            else {
                                if (data.href.startsWith('/')) {
                                    // Resolve relative to workspace
                                    let folder = this.workspaceContextService.getWorkspaceFolder(this.documentUri);
                                    if (!folder) {
                                        const folders = this.workspaceContextService.getWorkspace().folders;
                                        if (!folders.length) {
                                            return;
                                        }
                                        folder = folders[0];
                                    }
                                    linkToOpen = uri_1.URI.joinPath(folder.uri, data.href);
                                }
                                else {
                                    // Resolve relative to notebook document
                                    linkToOpen = uri_1.URI.joinPath((0, resources_1.dirname)(this.documentUri), data.href);
                                }
                            }
                        }
                        if (linkToOpen) {
                            this.openerService.open(linkToOpen, { fromUserGesture: true, allowCommands: true });
                        }
                        break;
                    }
                    case 'customKernelMessage': {
                        this._onMessage.fire({ message: data.message });
                        break;
                    }
                    case 'customRendererMessage': {
                        (_a = this.rendererMessaging) === null || _a === void 0 ? void 0 : _a.postMessage(data.rendererId, data.message);
                        break;
                    }
                    case 'clickMarkupCell': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell) {
                            if (data.shiftKey || (platform_1.isMacintosh ? data.metaKey : data.ctrlKey)) {
                                // Modify selection
                                this.notebookEditor.toggleNotebookCellSelection(cell, /* fromPrevious */ data.shiftKey);
                            }
                            else {
                                // Normal click
                                this.notebookEditor.focusNotebookCell(cell, 'container', { skipReveal: true });
                            }
                        }
                        break;
                    }
                    case 'contextMenuMarkupCell': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell) {
                            // Focus the cell first
                            this.notebookEditor.focusNotebookCell(cell, 'container', { skipReveal: true });
                            // Then show the context menu
                            const webviewRect = this.element.getBoundingClientRect();
                            this.contextMenuService.showContextMenu({
                                getActions: () => {
                                    const result = [];
                                    const menu = this.menuService.createMenu(actions_1.MenuId.NotebookCellTitle, this.contextKeyService);
                                    (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, undefined, result);
                                    menu.dispose();
                                    return result;
                                },
                                getAnchor: () => ({
                                    x: webviewRect.x + data.clientX,
                                    y: webviewRect.y + data.clientY
                                })
                            });
                        }
                        break;
                    }
                    case 'toggleMarkupPreview': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell && !this.notebookEditor.creationOptions.isReadOnly) {
                            this.notebookEditor.setMarkupCellEditState(data.cellId, notebookBrowser_1.CellEditState.Editing);
                            this.notebookEditor.focusNotebookCell(cell, 'editor', { skipReveal: true });
                        }
                        break;
                    }
                    case 'mouseEnterMarkupCell': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                            cell.cellIsHovered = true;
                        }
                        break;
                    }
                    case 'mouseLeaveMarkupCell': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                            cell.cellIsHovered = false;
                        }
                        break;
                    }
                    case 'cell-drag-start': {
                        this.notebookEditor.didStartDragMarkupCell(data.cellId, data);
                        break;
                    }
                    case 'cell-drag': {
                        this.notebookEditor.didDragMarkupCell(data.cellId, data);
                        break;
                    }
                    case 'cell-drop': {
                        this.notebookEditor.didDropMarkupCell(data.cellId, {
                            dragOffsetY: data.dragOffsetY,
                            ctrlKey: data.ctrlKey,
                            altKey: data.altKey,
                        });
                        break;
                    }
                    case 'cell-drag-end': {
                        this.notebookEditor.didEndDragMarkupCell(data.cellId);
                        break;
                    }
                    case 'renderedMarkup': {
                        const cell = this.notebookEditor.getCellById(data.cellId);
                        if (cell instanceof markupCellViewModel_1.MarkupCellViewModel) {
                            cell.renderedHtml = data.html;
                        }
                        this._handleHighlightCodeBlock(data.codeBlocks);
                        break;
                    }
                    case 'renderedCellOutput': {
                        this._handleHighlightCodeBlock(data.codeBlocks);
                        break;
                    }
                }
            }));
        }
        _handleHighlightCodeBlock(codeBlocks) {
            for (const { id, value, lang } of codeBlocks) {
                // The language id may be a language aliases (e.g.js instead of javascript)
                const languageId = this.languageService.getLanguageIdByLanguageName(lang);
                if (!languageId) {
                    continue;
                }
                (0, textToHtmlTokenizer_1.tokenizeToString)(this.languageService, value, languageId).then((html) => {
                    if (this._disposed) {
                        return;
                    }
                    this._sendMessageToWebview({
                        type: 'tokenizedCodeBlock',
                        html,
                        codeBlockId: id
                    });
                });
            }
        }
        async _onDidClickDataLink(event) {
            if (typeof event.data !== 'string') {
                return;
            }
            const [splitStart, splitData] = event.data.split(';base64,');
            if (!splitData || !splitStart) {
                return;
            }
            const defaultDir = (0, resources_1.dirname)(this.documentUri);
            let defaultName;
            if (event.downloadName) {
                defaultName = event.downloadName;
            }
            else {
                const mimeType = splitStart.replace(/^data:/, '');
                const candidateExtension = mimeType && (0, mime_1.getExtensionForMimeType)(mimeType);
                defaultName = candidateExtension ? `download${candidateExtension}` : 'download';
            }
            const defaultUri = (0, resources_1.joinPath)(defaultDir, defaultName);
            const newFileUri = await this.fileDialogService.showSaveDialog({
                defaultUri
            });
            if (!newFileUri) {
                return;
            }
            const buff = (0, buffer_1.decodeBase64)(splitData);
            await this.fileService.writeFile(newFileUri, buff);
            await this.openerService.open(newFileUri);
        }
        _createInset(webviewService, content) {
            const workspaceFolders = this.contextService.getWorkspace().folders.map(x => x.uri);
            this.localResourceRootsCache = [
                ...this.notebookService.getNotebookProviderResourceRoots(),
                ...this.notebookService.getRenderers().map(x => (0, resources_1.dirname)(x.entrypoint)),
                ...workspaceFolders,
                ...this.getBuiltinLocalResourceRoots(),
            ];
            const webview = webviewService.createWebviewElement(this.id, {
                purpose: "notebookRenderer" /* WebviewContentPurpose.NotebookRenderer */,
                enableFindWidget: false,
                transformCssVariables: webviewThemeMapping_1.transformWebviewThemeVars,
            }, {
                allowMultipleAPIAcquire: true,
                allowScripts: true,
                localResourceRoots: this.localResourceRootsCache,
            }, undefined);
            webview.html = content;
            return webview;
        }
        initializeWebViewState() {
            var _a;
            const renderers = new Set();
            for (const inset of this.insetMapping.values()) {
                if (inset.renderer) {
                    renderers.add(inset.renderer);
                }
            }
            this._preloadsCache.clear();
            if (((_a = this._currentKernel) === null || _a === void 0 ? void 0 : _a.type) === 0 /* NotebookKernelType.Resolved */) {
                this._updatePreloadsFromKernel(this._currentKernel);
            }
            for (const [output, inset] of this.insetMapping.entries()) {
                this._sendMessageToWebview(Object.assign(Object.assign({}, inset.cachedCreation), { initiallyHidden: this.hiddenInsetMapping.has(output) }));
            }
            const mdCells = [...this.markupPreviewMapping.values()];
            this.markupPreviewMapping.clear();
            this.initializeMarkup(mdCells);
            this._updateStyles();
            this._updateOptions();
        }
        shouldUpdateInset(cell, output, cellTop, outputOffset) {
            if (this._disposed) {
                return false;
            }
            if ('isOutputCollapsed' in cell && cell.isOutputCollapsed) {
                return false;
            }
            if (this.hiddenInsetMapping.has(output)) {
                return true;
            }
            const outputCache = this.insetMapping.get(output);
            if (!outputCache) {
                return false;
            }
            if (outputOffset === outputCache.cachedCreation.outputOffset && cellTop === outputCache.cachedCreation.cellTop) {
                return false;
            }
            return true;
        }
        ackHeight(updates) {
            this._sendMessageToWebview({
                type: 'ack-dimension',
                updates
            });
        }
        updateScrollTops(outputRequests, markupPreviews) {
            if (this._disposed) {
                return;
            }
            const widgets = (0, arrays_1.coalesce)(outputRequests.map((request) => {
                const outputCache = this.insetMapping.get(request.output);
                if (!outputCache) {
                    return;
                }
                if (!request.forceDisplay && !this.shouldUpdateInset(request.cell, request.output, request.cellTop, request.outputOffset)) {
                    return;
                }
                const id = outputCache.outputId;
                outputCache.cachedCreation.cellTop = request.cellTop;
                outputCache.cachedCreation.outputOffset = request.outputOffset;
                this.hiddenInsetMapping.delete(request.output);
                return {
                    cellId: request.cell.id,
                    outputId: id,
                    cellTop: request.cellTop,
                    outputOffset: request.outputOffset,
                    forceDisplay: request.forceDisplay,
                };
            }));
            if (!widgets.length && !markupPreviews.length) {
                return;
            }
            this._sendMessageToWebview({
                type: 'view-scroll',
                widgets: widgets,
                markupCells: markupPreviews,
            });
        }
        async createMarkupPreview(initialization) {
            if (this._disposed) {
                return;
            }
            if (this.markupPreviewMapping.has(initialization.cellId)) {
                console.error('Trying to create markup preview that already exists');
                return;
            }
            this.markupPreviewMapping.set(initialization.cellId, initialization);
            this._sendMessageToWebview({
                type: 'createMarkupCell',
                cell: initialization
            });
        }
        async showMarkupPreview(initialization) {
            if (this._disposed) {
                return;
            }
            const entry = this.markupPreviewMapping.get(initialization.cellId);
            if (!entry) {
                return this.createMarkupPreview(initialization);
            }
            const sameContent = initialization.content === entry.content;
            if (!sameContent || !entry.visible) {
                this._sendMessageToWebview({
                    type: 'showMarkupCell',
                    id: initialization.cellId,
                    handle: initialization.cellHandle,
                    // If the content has not changed, we still want to make sure the
                    // preview is visible but don't need to send anything over
                    content: sameContent ? undefined : initialization.content,
                    top: initialization.offset
                });
            }
            entry.content = initialization.content;
            entry.offset = initialization.offset;
            entry.visible = true;
        }
        async hideMarkupPreviews(cellIds) {
            if (this._disposed) {
                return;
            }
            const cellsToHide = [];
            for (const cellId of cellIds) {
                const entry = this.markupPreviewMapping.get(cellId);
                if (entry) {
                    if (entry.visible) {
                        cellsToHide.push(cellId);
                        entry.visible = false;
                    }
                }
            }
            if (cellsToHide.length) {
                this._sendMessageToWebview({
                    type: 'hideMarkupCells',
                    ids: cellsToHide
                });
            }
        }
        async unhideMarkupPreviews(cellIds) {
            if (this._disposed) {
                return;
            }
            const toUnhide = [];
            for (const cellId of cellIds) {
                const entry = this.markupPreviewMapping.get(cellId);
                if (entry) {
                    if (!entry.visible) {
                        entry.visible = true;
                        toUnhide.push(cellId);
                    }
                }
                else {
                    console.error(`Trying to unhide a preview that does not exist: ${cellId}`);
                }
            }
            this._sendMessageToWebview({
                type: 'unhideMarkupCells',
                ids: toUnhide,
            });
        }
        async deleteMarkupPreviews(cellIds) {
            if (this._disposed) {
                return;
            }
            for (const id of cellIds) {
                if (!this.markupPreviewMapping.has(id)) {
                    console.error(`Trying to delete a preview that does not exist: ${id}`);
                }
                this.markupPreviewMapping.delete(id);
            }
            if (cellIds.length) {
                this._sendMessageToWebview({
                    type: 'deleteMarkupCell',
                    ids: cellIds
                });
            }
        }
        async updateMarkupPreviewSelections(selectedCellsIds) {
            if (this._disposed) {
                return;
            }
            this._sendMessageToWebview({
                type: 'updateSelectedMarkupCells',
                selectedCellIds: selectedCellsIds.filter(id => this.markupPreviewMapping.has(id)),
            });
        }
        async initializeMarkup(cells) {
            if (this._disposed) {
                return;
            }
            // TODO: use proper handler
            const p = new Promise(resolve => {
                var _a;
                const sub = (_a = this.webview) === null || _a === void 0 ? void 0 : _a.onMessage(e => {
                    if (e.message.type === 'initializedMarkup') {
                        resolve();
                        sub === null || sub === void 0 ? void 0 : sub.dispose();
                    }
                });
            });
            for (const cell of cells) {
                this.markupPreviewMapping.set(cell.cellId, cell);
            }
            this._sendMessageToWebview({
                type: 'initializeMarkup',
                cells,
            });
            await p;
        }
        async createOutput(cellInfo, content, cellTop, offset) {
            if (this._disposed) {
                return;
            }
            if (this.insetMapping.has(content.source)) {
                const outputCache = this.insetMapping.get(content.source);
                if (outputCache) {
                    this.hiddenInsetMapping.delete(content.source);
                    this._sendMessageToWebview({
                        type: 'showOutput',
                        cellId: outputCache.cellInfo.cellId,
                        outputId: outputCache.outputId,
                        cellTop: cellTop,
                        outputOffset: offset
                    });
                    return;
                }
            }
            const messageBase = {
                type: 'html',
                cellId: cellInfo.cellId,
                cellTop: cellTop,
                outputOffset: offset,
                left: 0,
                requiredPreloads: [],
            };
            let message;
            let renderer;
            if (content.type === 1 /* RenderOutputType.Extension */) {
                const output = content.source.model;
                renderer = content.renderer;
                const first = output.outputs.find(op => op.mime === content.mimeType);
                // TODO@jrieken - the message can contain "bytes" and those are transferable
                // which improves IPC performance and therefore should be used. However, it does
                // means that the bytes cannot be used here anymore
                message = Object.assign(Object.assign({}, messageBase), { outputId: output.outputId, rendererId: content.renderer.id, content: {
                        type: 1 /* RenderOutputType.Extension */,
                        outputId: output.outputId,
                        mimeType: first.mime,
                        valueBytes: first.data.buffer,
                        metadata: output.metadata,
                    } });
            }
            else {
                message = Object.assign(Object.assign({}, messageBase), { outputId: UUID.generateUuid(), content: {
                        type: content.type,
                        htmlContent: content.htmlContent,
                    } });
            }
            this._sendMessageToWebview(message);
            this.insetMapping.set(content.source, { outputId: message.outputId, cellInfo: cellInfo, renderer, cachedCreation: message });
            this.hiddenInsetMapping.delete(content.source);
            this.reversedInsetMapping.set(message.outputId, content.source);
        }
        async updateOutput(cellInfo, content, cellTop, offset) {
            if (this._disposed) {
                return;
            }
            if (!this.insetMapping.has(content.source)) {
                this.createOutput(cellInfo, content, cellTop, offset);
                return;
            }
            const outputCache = this.insetMapping.get(content.source);
            this.hiddenInsetMapping.delete(content.source);
            let updatedContent = undefined;
            if (content.type === 1 /* RenderOutputType.Extension */) {
                const output = content.source.model;
                const first = output.outputs.find(op => op.mime === content.mimeType);
                updatedContent = {
                    type: 1 /* RenderOutputType.Extension */,
                    outputId: outputCache.outputId,
                    mimeType: first.mime,
                    valueBytes: first.data.buffer,
                    metadata: output.metadata,
                };
            }
            this._sendMessageToWebview({
                type: 'showOutput',
                cellId: outputCache.cellInfo.cellId,
                outputId: outputCache.outputId,
                cellTop: cellTop,
                outputOffset: offset,
                content: updatedContent
            });
            return;
        }
        removeInsets(outputs) {
            if (this._disposed) {
                return;
            }
            for (const output of outputs) {
                const outputCache = this.insetMapping.get(output);
                if (!outputCache) {
                    continue;
                }
                const id = outputCache.outputId;
                this._sendMessageToWebview({
                    type: 'clearOutput',
                    rendererId: outputCache.cachedCreation.rendererId,
                    cellUri: outputCache.cellInfo.cellUri.toString(),
                    outputId: id,
                    cellId: outputCache.cellInfo.cellId
                });
                this.insetMapping.delete(output);
                this.reversedInsetMapping.delete(id);
            }
        }
        hideInset(output) {
            if (this._disposed) {
                return;
            }
            const outputCache = this.insetMapping.get(output);
            if (!outputCache) {
                return;
            }
            this.hiddenInsetMapping.add(output);
            this._sendMessageToWebview({
                type: 'hideOutput',
                outputId: outputCache.outputId,
                cellId: outputCache.cellInfo.cellId,
            });
        }
        clearInsets() {
            if (this._disposed) {
                return;
            }
            this._sendMessageToWebview({
                type: 'clear'
            });
            this.insetMapping = new Map();
            this.reversedInsetMapping = new Map();
        }
        focusWebview() {
            var _a;
            if (this._disposed) {
                return;
            }
            (_a = this.webview) === null || _a === void 0 ? void 0 : _a.focus();
        }
        focusOutput(cellId) {
            var _a;
            if (this._disposed) {
                return;
            }
            (_a = this.webview) === null || _a === void 0 ? void 0 : _a.focus();
            setTimeout(() => {
                this._sendMessageToWebview({
                    type: 'focus-output',
                    cellId,
                });
            }, 50);
        }
        async find(query, options) {
            if (query === '') {
                return [];
            }
            const p = new Promise(resolve => {
                var _a;
                const sub = (_a = this.webview) === null || _a === void 0 ? void 0 : _a.onMessage(e => {
                    if (e.message.type === 'didFind') {
                        resolve(e.message.matches);
                        sub === null || sub === void 0 ? void 0 : sub.dispose();
                    }
                });
            });
            this._sendMessageToWebview({
                type: 'find',
                query: query,
                options
            });
            const ret = await p;
            return ret;
        }
        findStop() {
            this._sendMessageToWebview({
                type: 'findStop'
            });
        }
        async findHighlight(index) {
            const p = new Promise(resolve => {
                var _a;
                const sub = (_a = this.webview) === null || _a === void 0 ? void 0 : _a.onMessage(e => {
                    if (e.message.type === 'didFindHighlight') {
                        resolve(e.message.offset);
                        sub === null || sub === void 0 ? void 0 : sub.dispose();
                    }
                });
            });
            this._sendMessageToWebview({
                type: 'findHighlight',
                index
            });
            const ret = await p;
            return ret;
        }
        async findUnHighlight(index) {
            this._sendMessageToWebview({
                type: 'findUnHighlight',
                index
            });
        }
        deltaCellOutputContainerClassNames(cellId, added, removed) {
            this._sendMessageToWebview({
                type: 'decorations',
                cellId,
                addedClassNames: added,
                removedClassNames: removed
            });
        }
        async updateKernelPreloads(kernel) {
            var _a;
            if (this._disposed || kernel === this._currentKernel) {
                return;
            }
            const previousKernel = this._currentKernel;
            this._currentKernel = kernel;
            if ((previousKernel === null || previousKernel === void 0 ? void 0 : previousKernel.type) === 0 /* NotebookKernelType.Resolved */ && previousKernel.preloadUris.length > 0) {
                (_a = this.webview) === null || _a === void 0 ? void 0 : _a.reload(); // preloads will be restored after reload
            }
            else if ((kernel === null || kernel === void 0 ? void 0 : kernel.type) === 0 /* NotebookKernelType.Resolved */) {
                this._updatePreloadsFromKernel(kernel);
            }
        }
        _updatePreloadsFromKernel(kernel) {
            const resources = [];
            for (const preload of kernel.preloadUris) {
                const uri = this.environmentService.isExtensionDevelopment && (preload.scheme === 'http' || preload.scheme === 'https')
                    ? preload : this.asWebviewUri(preload, undefined);
                if (!this._preloadsCache.has(uri.toString())) {
                    resources.push({ uri: uri.toString(), originalUri: preload.toString() });
                    this._preloadsCache.add(uri.toString());
                }
            }
            if (!resources.length) {
                return;
            }
            this._updatePreloads(resources);
        }
        _updatePreloads(resources) {
            var _a;
            if (!this.webview) {
                return;
            }
            const mixedResourceRoots = [
                ...(this.localResourceRootsCache || []),
                ...(((_a = this._currentKernel) === null || _a === void 0 ? void 0 : _a.type) === 0 /* NotebookKernelType.Resolved */ ? [this._currentKernel.localResourceRoot] : []),
            ];
            this.webview.localResourcesRoot = mixedResourceRoots;
            this._sendMessageToWebview({
                type: 'preload',
                resources: resources,
            });
        }
        _sendMessageToWebview(message) {
            var _a;
            if (this._disposed) {
                return;
            }
            (_a = this.webview) === null || _a === void 0 ? void 0 : _a.postMessage(message);
        }
        clearPreloadsCache() {
            this._preloadsCache.clear();
        }
        dispose() {
            var _a;
            this._disposed = true;
            (_a = this.webview) === null || _a === void 0 ? void 0 : _a.dispose();
            super.dispose();
        }
    };
    BackLayerWebView = __decorate([
        __param(5, webview_2.IWebviewService),
        __param(6, opener_1.IOpenerService),
        __param(7, notebookService_1.INotebookService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, environmentService_1.IWorkbenchEnvironmentService),
        __param(10, dialogs_1.IFileDialogService),
        __param(11, files_1.IFileService),
        __param(12, contextView_1.IContextMenuService),
        __param(13, actions_1.IMenuService),
        __param(14, contextkey_1.IContextKeyService),
        __param(15, workspaceTrust_1.IWorkspaceTrustManagementService),
        __param(16, configuration_1.IConfigurationService),
        __param(17, language_1.ILanguageService),
        __param(18, workspace_1.IWorkspaceContextService),
        __param(19, editorGroupsService_1.IEditorGroupsService)
    ], BackLayerWebView);
    exports.BackLayerWebView = BackLayerWebView;
    function getTokenizationCss() {
        const colorMap = languages_1.TokenizationRegistry.getColorMap();
        const tokenizationCss = colorMap ? (0, tokenization_1.generateTokensCSSForColorMap)(colorMap) : '';
        return tokenizationCss;
    }
});
//# sourceMappingURL=backLayerWebView.js.map