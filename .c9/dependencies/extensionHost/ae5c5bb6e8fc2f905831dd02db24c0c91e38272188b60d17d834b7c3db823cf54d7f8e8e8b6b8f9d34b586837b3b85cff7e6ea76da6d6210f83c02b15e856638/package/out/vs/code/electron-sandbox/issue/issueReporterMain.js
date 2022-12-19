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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/ui/button/button", "vs/base/browser/ui/iconLabel/iconLabels", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/collections", "vs/base/common/decorators", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/strings", "vs/base/parts/sandbox/electron-sandbox/globals", "vs/code/electron-sandbox/issue/issueReporterModel", "vs/code/electron-sandbox/issue/issueReporterPage", "vs/platform/diagnostics/common/diagnostics", "vs/platform/ipc/electron-sandbox/mainProcessService", "vs/platform/issue/common/issueReporterUtil", "vs/platform/native/electron-sandbox/nativeHostService", "vs/platform/window/electron-sandbox/window", "vs/css!./media/issueReporter", "vs/base/browser/ui/codicons/codiconStyles"], function (require, exports, nls_1, dom_1, button_1, iconLabels_1, async_1, codicons_1, collections_1, decorators_1, lifecycle_1, platform_1, strings_1, globals_1, issueReporterModel_1, issueReporterPage_1, diagnostics_1, mainProcessService_1, issueReporterUtil_1, nativeHostService_1, window_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.IssueReporter = exports.startup = void 0;
    const MAX_URL_LENGTH = 2045;
    var IssueSource;
    (function (IssueSource) {
        IssueSource["VSCode"] = "vscode";
        IssueSource["Extension"] = "extension";
        IssueSource["Marketplace"] = "marketplace";
    })(IssueSource || (IssueSource = {}));
    function startup(configuration) {
        const platformClass = platform_1.isWindows ? 'windows' : platform_1.isLinux ? 'linux' : 'mac';
        document.body.classList.add(platformClass); // used by our fonts
        (0, dom_1.safeInnerHtml)(document.body, (0, issueReporterPage_1.default)());
        const issueReporter = new IssueReporter(configuration);
        issueReporter.render();
        document.body.style.display = 'block';
        issueReporter.setInitialFocus();
    }
    exports.startup = startup;
    class IssueReporter extends lifecycle_1.Disposable {
        constructor(configuration) {
            super();
            this.configuration = configuration;
            this.numberOfSearchResultsDisplayed = 0;
            this.receivedSystemInfo = false;
            this.receivedPerformanceInfo = false;
            this.shouldQueueSearch = false;
            this.hasBeenSubmitted = false;
            this.delayedSubmit = new async_1.Delayer(300);
            const mainProcessService = new mainProcessService_1.ElectronIPCMainProcessService(configuration.windowId);
            this.nativeHostService = new nativeHostService_1.NativeHostService(configuration.windowId, mainProcessService);
            const targetExtension = configuration.data.extensionId ? configuration.data.enabledExtensions.find(extension => extension.id === configuration.data.extensionId) : undefined;
            this.issueReporterModel = new issueReporterModel_1.IssueReporterModel({
                issueType: configuration.data.issueType || 0 /* IssueType.Bug */,
                versionInfo: {
                    vscodeVersion: `${configuration.product.nameShort} ${!!configuration.product.darwinUniversalAssetId ? `${configuration.product.version} (Universal)` : configuration.product.version} (${configuration.product.commit || 'Commit unknown'}, ${configuration.product.date || 'Date unknown'})`,
                    os: `${this.configuration.os.type} ${this.configuration.os.arch} ${this.configuration.os.release}${platform_1.isLinuxSnap ? ' snap' : ''}`
                },
                extensionsDisabled: !!configuration.disableExtensions,
                fileOnExtension: configuration.data.extensionId ? !(targetExtension === null || targetExtension === void 0 ? void 0 : targetExtension.isBuiltin) : undefined,
                selectedExtension: targetExtension,
            });
            const issueReporterElement = this.getElementById('issue-reporter');
            if (issueReporterElement) {
                this.previewButton = new button_1.Button(issueReporterElement);
                this.updatePreviewButtonState();
            }
            const issueTitle = configuration.data.issueTitle;
            if (issueTitle) {
                const issueTitleElement = this.getElementById('issue-title');
                if (issueTitleElement) {
                    issueTitleElement.value = issueTitle;
                }
            }
            const issueBody = configuration.data.issueBody;
            if (issueBody) {
                const description = this.getElementById('description');
                if (description) {
                    description.value = issueBody;
                    this.issueReporterModel.update({ issueDescription: issueBody });
                }
            }
            globals_1.ipcRenderer.on('vscode:issuePerformanceInfoResponse', (_, info) => {
                this.issueReporterModel.update(info);
                this.receivedPerformanceInfo = true;
                const state = this.issueReporterModel.getData();
                this.updateProcessInfo(state);
                this.updateWorkspaceInfo(state);
                this.updatePreviewButtonState();
            });
            globals_1.ipcRenderer.on('vscode:issueSystemInfoResponse', (_, info) => {
                this.issueReporterModel.update({ systemInfo: info });
                this.receivedSystemInfo = true;
                this.updateSystemInfo(this.issueReporterModel.getData());
                this.updatePreviewButtonState();
            });
            globals_1.ipcRenderer.send('vscode:issueSystemInfoRequest');
            if (configuration.data.issueType === 1 /* IssueType.PerformanceIssue */) {
                globals_1.ipcRenderer.send('vscode:issuePerformanceInfoRequest');
            }
            if (window.document.documentElement.lang !== 'en') {
                show(this.getElementById('english'));
            }
            this.setUpTypes();
            this.setEventHandlers();
            (0, window_1.applyZoom)(configuration.data.zoomLevel);
            this.applyStyles(configuration.data.styles);
            this.handleExtensionData(configuration.data.enabledExtensions);
            this.updateExperimentsInfo(configuration.data.experiments);
            this.updateRestrictedMode(configuration.data.restrictedMode);
        }
        render() {
            this.renderBlocks();
        }
        setInitialFocus() {
            const { fileOnExtension } = this.issueReporterModel.getData();
            if (fileOnExtension) {
                const issueTitle = document.getElementById('issue-title');
                if (issueTitle) {
                    issueTitle.focus();
                }
            }
            else {
                const issueType = document.getElementById('issue-type');
                if (issueType) {
                    issueType.focus();
                }
            }
        }
        applyStyles(styles) {
            const styleTag = document.createElement('style');
            const content = [];
            if (styles.inputBackground) {
                content.push(`input[type="text"], textarea, select, .issues-container > .issue > .issue-state, .block-info { background-color: ${styles.inputBackground}; }`);
            }
            if (styles.inputBorder) {
                content.push(`input[type="text"], textarea, select { border: 1px solid ${styles.inputBorder}; }`);
            }
            else {
                content.push(`input[type="text"], textarea, select { border: 1px solid transparent; }`);
            }
            if (styles.inputForeground) {
                content.push(`input[type="text"], textarea, select, .issues-container > .issue > .issue-state, .block-info { color: ${styles.inputForeground}; }`);
            }
            if (styles.inputErrorBorder) {
                content.push(`.invalid-input, .invalid-input:focus, .validation-error { border: 1px solid ${styles.inputErrorBorder} !important; }`);
                content.push(`.required-input { color: ${styles.inputErrorBorder}; }`);
            }
            if (styles.inputErrorBackground) {
                content.push(`.validation-error { background: ${styles.inputErrorBackground}; }`);
            }
            if (styles.inputErrorForeground) {
                content.push(`.validation-error { color: ${styles.inputErrorForeground}; }`);
            }
            if (styles.inputActiveBorder) {
                content.push(`input[type='text']:focus, textarea:focus, select:focus, summary:focus, button:focus, a:focus, .workbenchCommand:focus  { border: 1px solid ${styles.inputActiveBorder}; outline-style: none; }`);
            }
            if (styles.textLinkColor) {
                content.push(`a, .workbenchCommand { color: ${styles.textLinkColor}; }`);
            }
            if (styles.textLinkColor) {
                content.push(`a { color: ${styles.textLinkColor}; }`);
            }
            if (styles.textLinkActiveForeground) {
                content.push(`a:hover, .workbenchCommand:hover { color: ${styles.textLinkActiveForeground}; }`);
            }
            if (styles.sliderBackgroundColor) {
                content.push(`::-webkit-scrollbar-thumb { background-color: ${styles.sliderBackgroundColor}; }`);
            }
            if (styles.sliderActiveColor) {
                content.push(`::-webkit-scrollbar-thumb:active { background-color: ${styles.sliderActiveColor}; }`);
            }
            if (styles.sliderHoverColor) {
                content.push(`::--webkit-scrollbar-thumb:hover { background-color: ${styles.sliderHoverColor}; }`);
            }
            if (styles.buttonBackground) {
                content.push(`.monaco-text-button { background-color: ${styles.buttonBackground} !important; }`);
            }
            if (styles.buttonForeground) {
                content.push(`.monaco-text-button { color: ${styles.buttonForeground} !important; }`);
            }
            if (styles.buttonHoverBackground) {
                content.push(`.monaco-text-button:not(.disabled):hover, .monaco-text-button:focus { background-color: ${styles.buttonHoverBackground} !important; }`);
            }
            styleTag.textContent = content.join('\n');
            document.head.appendChild(styleTag);
            document.body.style.color = styles.color || '';
        }
        handleExtensionData(extensions) {
            const installedExtensions = extensions.filter(x => !x.isBuiltin);
            const { nonThemes, themes } = (0, collections_1.groupBy)(installedExtensions, ext => {
                return ext.isTheme ? 'themes' : 'nonThemes';
            });
            const numberOfThemeExtesions = themes && themes.length;
            this.issueReporterModel.update({ numberOfThemeExtesions, enabledNonThemeExtesions: nonThemes, allExtensions: installedExtensions });
            this.updateExtensionTable(nonThemes, numberOfThemeExtesions);
            if (this.configuration.disableExtensions || installedExtensions.length === 0) {
                this.getElementById('disableExtensions').disabled = true;
            }
            this.updateExtensionSelector(installedExtensions);
        }
        setEventHandlers() {
            this.addEventListener('issue-type', 'change', (event) => {
                const issueType = parseInt(event.target.value);
                this.issueReporterModel.update({ issueType: issueType });
                if (issueType === 1 /* IssueType.PerformanceIssue */ && !this.receivedPerformanceInfo) {
                    globals_1.ipcRenderer.send('vscode:issuePerformanceInfoRequest');
                }
                this.updatePreviewButtonState();
                this.setSourceOptions();
                this.render();
            });
            ['includeSystemInfo', 'includeProcessInfo', 'includeWorkspaceInfo', 'includeExtensions', 'includeExperiments'].forEach(elementId => {
                this.addEventListener(elementId, 'click', (event) => {
                    event.stopPropagation();
                    this.issueReporterModel.update({ [elementId]: !this.issueReporterModel.getData()[elementId] });
                });
            });
            const showInfoElements = document.getElementsByClassName('showInfo');
            for (let i = 0; i < showInfoElements.length; i++) {
                const showInfo = showInfoElements.item(i);
                showInfo.addEventListener('click', (e) => {
                    e.preventDefault();
                    const label = e.target;
                    if (label) {
                        const containingElement = label.parentElement && label.parentElement.parentElement;
                        const info = containingElement && containingElement.lastElementChild;
                        if (info && info.classList.contains('hidden')) {
                            show(info);
                            label.textContent = (0, nls_1.localize)('hide', "hide");
                        }
                        else {
                            hide(info);
                            label.textContent = (0, nls_1.localize)('show', "show");
                        }
                    }
                });
            }
            this.addEventListener('issue-source', 'change', (e) => {
                const value = e.target.value;
                const problemSourceHelpText = this.getElementById('problem-source-help-text');
                if (value === '') {
                    this.issueReporterModel.update({ fileOnExtension: undefined });
                    show(problemSourceHelpText);
                    this.clearSearchResults();
                    this.render();
                    return;
                }
                else {
                    hide(problemSourceHelpText);
                }
                let fileOnExtension, fileOnMarketplace = false;
                if (value === IssueSource.Extension) {
                    fileOnExtension = true;
                }
                else if (value === IssueSource.Marketplace) {
                    fileOnMarketplace = true;
                }
                this.issueReporterModel.update({ fileOnExtension, fileOnMarketplace });
                this.render();
                const title = this.getElementById('issue-title').value;
                this.searchIssues(title, fileOnExtension, fileOnMarketplace);
            });
            this.addEventListener('description', 'input', (e) => {
                const issueDescription = e.target.value;
                this.issueReporterModel.update({ issueDescription });
                // Only search for extension issues on title change
                if (this.issueReporterModel.fileOnExtension() === false) {
                    const title = this.getElementById('issue-title').value;
                    this.searchVSCodeIssues(title, issueDescription);
                }
            });
            this.addEventListener('issue-title', 'input', (e) => {
                const title = e.target.value;
                const lengthValidationMessage = this.getElementById('issue-title-length-validation-error');
                const issueUrl = this.getIssueUrl();
                if (title && this.getIssueUrlWithTitle(title, issueUrl).length > MAX_URL_LENGTH) {
                    show(lengthValidationMessage);
                }
                else {
                    hide(lengthValidationMessage);
                }
                const issueSource = this.getElementById('issue-source');
                if (!issueSource || issueSource.value === '') {
                    return;
                }
                const { fileOnExtension, fileOnMarketplace } = this.issueReporterModel.getData();
                this.searchIssues(title, fileOnExtension, fileOnMarketplace);
            });
            this.previewButton.onDidClick(async () => {
                this.delayedSubmit.trigger(async () => {
                    this.createIssue();
                });
            });
            function sendWorkbenchCommand(commandId) {
                globals_1.ipcRenderer.send('vscode:workbenchCommand', { id: commandId, from: 'issueReporter' });
            }
            this.addEventListener('disableExtensions', 'click', () => {
                sendWorkbenchCommand('workbench.action.reloadWindowWithExtensionsDisabled');
            });
            this.addEventListener('extensionBugsLink', 'click', (e) => {
                const url = e.target.innerText;
                (0, dom_1.windowOpenNoOpener)(url);
            });
            this.addEventListener('disableExtensions', 'keydown', (e) => {
                e.stopPropagation();
                if (e.keyCode === 13 || e.keyCode === 32) {
                    sendWorkbenchCommand('workbench.extensions.action.disableAll');
                    sendWorkbenchCommand('workbench.action.reloadWindow');
                }
            });
            document.onkeydown = async (e) => {
                const cmdOrCtrlKey = platform_1.isMacintosh ? e.metaKey : e.ctrlKey;
                // Cmd/Ctrl+Enter previews issue and closes window
                if (cmdOrCtrlKey && e.keyCode === 13) {
                    this.delayedSubmit.trigger(async () => {
                        if (await this.createIssue()) {
                            globals_1.ipcRenderer.send('vscode:closeIssueReporter');
                        }
                    });
                }
                // Cmd/Ctrl + w closes issue window
                if (cmdOrCtrlKey && e.keyCode === 87) {
                    e.stopPropagation();
                    e.preventDefault();
                    const issueTitle = this.getElementById('issue-title').value;
                    const { issueDescription } = this.issueReporterModel.getData();
                    if (!this.hasBeenSubmitted && (issueTitle || issueDescription)) {
                        globals_1.ipcRenderer.send('vscode:issueReporterConfirmClose');
                    }
                    else {
                        globals_1.ipcRenderer.send('vscode:closeIssueReporter');
                    }
                }
                // Cmd/Ctrl + zooms in
                if (cmdOrCtrlKey && e.keyCode === 187) {
                    (0, window_1.zoomIn)();
                }
                // Cmd/Ctrl - zooms out
                if (cmdOrCtrlKey && e.keyCode === 189) {
                    (0, window_1.zoomOut)();
                }
                // With latest electron upgrade, cmd+a is no longer propagating correctly for inputs in this window on mac
                // Manually perform the selection
                if (platform_1.isMacintosh) {
                    if (cmdOrCtrlKey && e.keyCode === 65 && e.target) {
                        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                            e.target.select();
                        }
                    }
                }
            };
        }
        updatePreviewButtonState() {
            if (this.isPreviewEnabled()) {
                if (this.configuration.data.githubAccessToken) {
                    this.previewButton.label = (0, nls_1.localize)('createOnGitHub', "Create on GitHub");
                }
                else {
                    this.previewButton.label = (0, nls_1.localize)('previewOnGitHub', "Preview on GitHub");
                }
                this.previewButton.enabled = true;
            }
            else {
                this.previewButton.enabled = false;
                this.previewButton.label = (0, nls_1.localize)('loadingData', "Loading data...");
            }
        }
        isPreviewEnabled() {
            const issueType = this.issueReporterModel.getData().issueType;
            if (issueType === 0 /* IssueType.Bug */ && this.receivedSystemInfo) {
                return true;
            }
            if (issueType === 1 /* IssueType.PerformanceIssue */ && this.receivedSystemInfo && this.receivedPerformanceInfo) {
                return true;
            }
            if (issueType === 2 /* IssueType.FeatureRequest */) {
                return true;
            }
            return false;
        }
        getExtensionRepositoryUrl() {
            const selectedExtension = this.issueReporterModel.getData().selectedExtension;
            return selectedExtension && selectedExtension.repositoryUrl;
        }
        getExtensionBugsUrl() {
            const selectedExtension = this.issueReporterModel.getData().selectedExtension;
            return selectedExtension && selectedExtension.bugsUrl;
        }
        searchVSCodeIssues(title, issueDescription) {
            if (title) {
                this.searchDuplicates(title, issueDescription);
            }
            else {
                this.clearSearchResults();
            }
        }
        searchIssues(title, fileOnExtension, fileOnMarketplace) {
            if (fileOnExtension) {
                return this.searchExtensionIssues(title);
            }
            if (fileOnMarketplace) {
                return this.searchMarketplaceIssues(title);
            }
            const description = this.issueReporterModel.getData().issueDescription;
            this.searchVSCodeIssues(title, description);
        }
        searchExtensionIssues(title) {
            const url = this.getExtensionGitHubUrl();
            if (title) {
                const matches = /^https?:\/\/github\.com\/(.*)/.exec(url);
                if (matches && matches.length) {
                    const repo = matches[1];
                    return this.searchGitHub(repo, title);
                }
                // If the extension has no repository, display empty search results
                if (this.issueReporterModel.getData().selectedExtension) {
                    this.clearSearchResults();
                    return this.displaySearchResults([]);
                }
            }
            this.clearSearchResults();
        }
        searchMarketplaceIssues(title) {
            if (title) {
                const gitHubInfo = this.parseGitHubUrl(this.configuration.product.reportMarketplaceIssueUrl);
                if (gitHubInfo) {
                    return this.searchGitHub(`${gitHubInfo.owner}/${gitHubInfo.repositoryName}`, title);
                }
            }
        }
        clearSearchResults() {
            const similarIssues = this.getElementById('similar-issues');
            similarIssues.innerText = '';
            this.numberOfSearchResultsDisplayed = 0;
        }
        searchGitHub(repo, title) {
            const query = `is:issue+repo:${repo}+${title}`;
            const similarIssues = this.getElementById('similar-issues');
            window.fetch(`https://api.github.com/search/issues?q=${query}`).then((response) => {
                response.json().then(result => {
                    similarIssues.innerText = '';
                    if (result && result.items) {
                        this.displaySearchResults(result.items);
                    }
                    else {
                        // If the items property isn't present, the rate limit has been hit
                        const message = (0, dom_1.$)('div.list-title');
                        message.textContent = (0, nls_1.localize)('rateLimited', "GitHub query limit exceeded. Please wait.");
                        similarIssues.appendChild(message);
                        const resetTime = response.headers.get('X-RateLimit-Reset');
                        const timeToWait = resetTime ? parseInt(resetTime) - Math.floor(Date.now() / 1000) : 1;
                        if (this.shouldQueueSearch) {
                            this.shouldQueueSearch = false;
                            setTimeout(() => {
                                this.searchGitHub(repo, title);
                                this.shouldQueueSearch = true;
                            }, timeToWait * 1000);
                        }
                    }
                }).catch(_ => {
                    // Ignore
                });
            }).catch(_ => {
                // Ignore
            });
        }
        searchDuplicates(title, body) {
            const url = 'https://vscode-probot.westus.cloudapp.azure.com:7890/duplicate_candidates';
            const init = {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    body
                }),
                headers: new Headers({
                    'Content-Type': 'application/json'
                })
            };
            window.fetch(url, init).then((response) => {
                response.json().then(result => {
                    this.clearSearchResults();
                    if (result && result.candidates) {
                        this.displaySearchResults(result.candidates);
                    }
                    else {
                        throw new Error('Unexpected response, no candidates property');
                    }
                }).catch(_ => {
                    // Ignore
                });
            }).catch(_ => {
                // Ignore
            });
        }
        displaySearchResults(results) {
            const similarIssues = this.getElementById('similar-issues');
            if (results.length) {
                const issues = (0, dom_1.$)('div.issues-container');
                const issuesText = (0, dom_1.$)('div.list-title');
                issuesText.textContent = (0, nls_1.localize)('similarIssues', "Similar issues");
                this.numberOfSearchResultsDisplayed = results.length < 5 ? results.length : 5;
                for (let i = 0; i < this.numberOfSearchResultsDisplayed; i++) {
                    const issue = results[i];
                    const link = (0, dom_1.$)('a.issue-link', { href: issue.html_url });
                    link.textContent = issue.title;
                    link.title = issue.title;
                    link.addEventListener('click', (e) => this.openLink(e));
                    link.addEventListener('auxclick', (e) => this.openLink(e));
                    let issueState;
                    let item;
                    if (issue.state) {
                        issueState = (0, dom_1.$)('span.issue-state');
                        const issueIcon = (0, dom_1.$)('span.issue-icon');
                        issueIcon.appendChild((0, iconLabels_1.renderIcon)(issue.state === 'open' ? codicons_1.Codicon.issueOpened : codicons_1.Codicon.issueClosed));
                        const issueStateLabel = (0, dom_1.$)('span.issue-state.label');
                        issueStateLabel.textContent = issue.state === 'open' ? (0, nls_1.localize)('open', "Open") : (0, nls_1.localize)('closed', "Closed");
                        issueState.title = issue.state === 'open' ? (0, nls_1.localize)('open', "Open") : (0, nls_1.localize)('closed', "Closed");
                        issueState.appendChild(issueIcon);
                        issueState.appendChild(issueStateLabel);
                        item = (0, dom_1.$)('div.issue', undefined, issueState, link);
                    }
                    else {
                        item = (0, dom_1.$)('div.issue', undefined, link);
                    }
                    issues.appendChild(item);
                }
                similarIssues.appendChild(issuesText);
                similarIssues.appendChild(issues);
            }
            else {
                const message = (0, dom_1.$)('div.list-title');
                message.textContent = (0, nls_1.localize)('noSimilarIssues', "No similar issues found");
                similarIssues.appendChild(message);
            }
        }
        setUpTypes() {
            const makeOption = (issueType, description) => (0, dom_1.$)('option', { 'value': issueType.valueOf() }, (0, strings_1.escape)(description));
            const typeSelect = this.getElementById('issue-type');
            const { issueType } = this.issueReporterModel.getData();
            (0, dom_1.reset)(typeSelect, makeOption(0 /* IssueType.Bug */, (0, nls_1.localize)('bugReporter', "Bug Report")), makeOption(2 /* IssueType.FeatureRequest */, (0, nls_1.localize)('featureRequest', "Feature Request")), makeOption(1 /* IssueType.PerformanceIssue */, (0, nls_1.localize)('performanceIssue', "Performance Issue")));
            typeSelect.value = issueType.toString();
            this.setSourceOptions();
        }
        makeOption(value, description, disabled) {
            const option = document.createElement('option');
            option.disabled = disabled;
            option.value = value;
            option.textContent = description;
            return option;
        }
        setSourceOptions() {
            const sourceSelect = this.getElementById('issue-source');
            const { issueType, fileOnExtension, selectedExtension } = this.issueReporterModel.getData();
            let selected = sourceSelect.selectedIndex;
            if (selected === -1) {
                if (fileOnExtension !== undefined) {
                    selected = fileOnExtension ? 2 : 1;
                }
                else if (selectedExtension === null || selectedExtension === void 0 ? void 0 : selectedExtension.isBuiltin) {
                    selected = 1;
                }
            }
            sourceSelect.innerText = '';
            sourceSelect.append(this.makeOption('', (0, nls_1.localize)('selectSource', "Select source"), true));
            sourceSelect.append(this.makeOption('vscode', (0, nls_1.localize)('vscode', "Visual Studio Code"), false));
            sourceSelect.append(this.makeOption('extension', (0, nls_1.localize)('extension', "An extension"), false));
            if (this.configuration.product.reportMarketplaceIssueUrl) {
                sourceSelect.append(this.makeOption('marketplace', (0, nls_1.localize)('marketplace', "Extensions marketplace"), false));
            }
            if (issueType !== 2 /* IssueType.FeatureRequest */) {
                sourceSelect.append(this.makeOption('', (0, nls_1.localize)('unknown', "Don't know"), false));
            }
            if (selected !== -1 && selected < sourceSelect.options.length) {
                sourceSelect.selectedIndex = selected;
            }
            else {
                sourceSelect.selectedIndex = 0;
                hide(this.getElementById('problem-source-help-text'));
            }
        }
        renderBlocks() {
            // Depending on Issue Type, we render different blocks and text
            const { issueType, fileOnExtension, fileOnMarketplace } = this.issueReporterModel.getData();
            const blockContainer = this.getElementById('block-container');
            const systemBlock = document.querySelector('.block-system');
            const processBlock = document.querySelector('.block-process');
            const workspaceBlock = document.querySelector('.block-workspace');
            const extensionsBlock = document.querySelector('.block-extensions');
            const experimentsBlock = document.querySelector('.block-experiments');
            const problemSource = this.getElementById('problem-source');
            const descriptionTitle = this.getElementById('issue-description-label');
            const descriptionSubtitle = this.getElementById('issue-description-subtitle');
            const extensionSelector = this.getElementById('extension-selection');
            // Hide all by default
            hide(blockContainer);
            hide(systemBlock);
            hide(processBlock);
            hide(workspaceBlock);
            hide(extensionsBlock);
            hide(experimentsBlock);
            hide(problemSource);
            hide(extensionSelector);
            if (issueType === 0 /* IssueType.Bug */) {
                show(problemSource);
                if (!fileOnMarketplace) {
                    show(blockContainer);
                    show(systemBlock);
                    show(experimentsBlock);
                }
                if (fileOnExtension) {
                    show(extensionSelector);
                }
                else if (!fileOnMarketplace) {
                    show(extensionsBlock);
                }
                (0, dom_1.reset)(descriptionTitle, (0, nls_1.localize)('stepsToReproduce', "Steps to Reproduce"), (0, dom_1.$)('span.required-input', undefined, '*'));
                (0, dom_1.reset)(descriptionSubtitle, (0, nls_1.localize)('bugDescription', "Share the steps needed to reliably reproduce the problem. Please include actual and expected results. We support GitHub-flavored Markdown. You will be able to edit your issue and add screenshots when we preview it on GitHub."));
            }
            else if (issueType === 1 /* IssueType.PerformanceIssue */) {
                show(problemSource);
                if (!fileOnMarketplace) {
                    show(blockContainer);
                    show(systemBlock);
                    show(processBlock);
                    show(workspaceBlock);
                    show(experimentsBlock);
                }
                if (fileOnExtension) {
                    show(extensionSelector);
                }
                else if (!fileOnMarketplace) {
                    show(extensionsBlock);
                }
                (0, dom_1.reset)(descriptionTitle, (0, nls_1.localize)('stepsToReproduce', "Steps to Reproduce"), (0, dom_1.$)('span.required-input', undefined, '*'));
                (0, dom_1.reset)(descriptionSubtitle, (0, nls_1.localize)('performanceIssueDesciption', "When did this performance issue happen? Does it occur on startup or after a specific series of actions? We support GitHub-flavored Markdown. You will be able to edit your issue and add screenshots when we preview it on GitHub."));
            }
            else if (issueType === 2 /* IssueType.FeatureRequest */) {
                (0, dom_1.reset)(descriptionTitle, (0, nls_1.localize)('description', "Description"), (0, dom_1.$)('span.required-input', undefined, '*'));
                (0, dom_1.reset)(descriptionSubtitle, (0, nls_1.localize)('featureRequestDescription', "Please describe the feature you would like to see. We support GitHub-flavored Markdown. You will be able to edit your issue and add screenshots when we preview it on GitHub."));
                show(problemSource);
                if (fileOnExtension) {
                    show(extensionSelector);
                }
            }
        }
        validateInput(inputId) {
            const inputElement = this.getElementById(inputId);
            const inputValidationMessage = this.getElementById(`${inputId}-empty-error`);
            if (!inputElement.value) {
                inputElement.classList.add('invalid-input');
                inputValidationMessage === null || inputValidationMessage === void 0 ? void 0 : inputValidationMessage.classList.remove('hidden');
                return false;
            }
            else {
                inputElement.classList.remove('invalid-input');
                inputValidationMessage === null || inputValidationMessage === void 0 ? void 0 : inputValidationMessage.classList.add('hidden');
                return true;
            }
        }
        validateInputs() {
            let isValid = true;
            ['issue-title', 'description', 'issue-source'].forEach(elementId => {
                isValid = this.validateInput(elementId) && isValid;
            });
            if (this.issueReporterModel.fileOnExtension()) {
                isValid = this.validateInput('extension-selector') && isValid;
            }
            return isValid;
        }
        async submitToGitHub(issueTitle, issueBody, gitHubDetails) {
            const url = `https://api.github.com/repos/${gitHubDetails.owner}/${gitHubDetails.repositoryName}/issues`;
            const init = {
                method: 'POST',
                body: JSON.stringify({
                    title: issueTitle,
                    body: issueBody
                }),
                headers: new Headers({
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.configuration.data.githubAccessToken}`
                })
            };
            return new Promise((resolve, reject) => {
                window.fetch(url, init).then((response) => {
                    if (response.ok) {
                        response.json().then(result => {
                            globals_1.ipcRenderer.send('vscode:openExternal', result.html_url);
                            globals_1.ipcRenderer.send('vscode:closeIssueReporter');
                            resolve(true);
                        });
                    }
                    else {
                        resolve(false);
                    }
                });
            });
        }
        async createIssue() {
            if (!this.validateInputs()) {
                // If inputs are invalid, set focus to the first one and add listeners on them
                // to detect further changes
                const invalidInput = document.getElementsByClassName('invalid-input');
                if (invalidInput.length) {
                    invalidInput[0].focus();
                }
                this.addEventListener('issue-title', 'input', _ => {
                    this.validateInput('issue-title');
                });
                this.addEventListener('description', 'input', _ => {
                    this.validateInput('description');
                });
                this.addEventListener('issue-source', 'change', _ => {
                    this.validateInput('issue-source');
                });
                if (this.issueReporterModel.fileOnExtension()) {
                    this.addEventListener('extension-selector', 'change', _ => {
                        this.validateInput('extension-selector');
                    });
                }
                return false;
            }
            this.hasBeenSubmitted = true;
            const issueTitle = this.getElementById('issue-title').value;
            const issueBody = this.issueReporterModel.serialize();
            const issueUrl = this.getIssueUrl();
            const gitHubDetails = this.parseGitHubUrl(issueUrl);
            if (this.configuration.data.githubAccessToken && gitHubDetails) {
                return this.submitToGitHub(issueTitle, issueBody, gitHubDetails);
            }
            const baseUrl = this.getIssueUrlWithTitle(this.getElementById('issue-title').value, issueUrl);
            let url = baseUrl + `&body=${encodeURIComponent(issueBody)}`;
            if (url.length > MAX_URL_LENGTH) {
                try {
                    url = await this.writeToClipboard(baseUrl, issueBody);
                }
                catch (_) {
                    return false;
                }
            }
            globals_1.ipcRenderer.send('vscode:openExternal', url);
            return true;
        }
        async writeToClipboard(baseUrl, issueBody) {
            return new Promise((resolve, reject) => {
                globals_1.ipcRenderer.once('vscode:issueReporterClipboardResponse', async (event, shouldWrite) => {
                    if (shouldWrite) {
                        await this.nativeHostService.writeClipboardText(issueBody);
                        resolve(baseUrl + `&body=${encodeURIComponent((0, nls_1.localize)('pasteData', "We have written the needed data into your clipboard because it was too large to send. Please paste."))}`);
                    }
                    else {
                        reject();
                    }
                });
                globals_1.ipcRenderer.send('vscode:issueReporterClipboard');
            });
        }
        getIssueUrl() {
            return this.issueReporterModel.fileOnExtension()
                ? this.getExtensionGitHubUrl()
                : this.issueReporterModel.getData().fileOnMarketplace
                    ? this.configuration.product.reportMarketplaceIssueUrl
                    : this.configuration.product.reportIssueUrl;
        }
        parseGitHubUrl(url) {
            // Assumes a GitHub url to a particular repo, https://github.com/repositoryName/owner.
            // Repository name and owner cannot contain '/'
            const match = /^https?:\/\/github\.com\/([^\/]*)\/([^\/]*).*/.exec(url);
            if (match && match.length) {
                return {
                    owner: match[1],
                    repositoryName: match[2]
                };
            }
            return undefined;
        }
        getExtensionGitHubUrl() {
            let repositoryUrl = '';
            const bugsUrl = this.getExtensionBugsUrl();
            const extensionUrl = this.getExtensionRepositoryUrl();
            // If given, try to match the extension's bug url
            if (bugsUrl && bugsUrl.match(/^https?:\/\/github\.com\/(.*)/)) {
                repositoryUrl = (0, issueReporterUtil_1.normalizeGitHubUrl)(bugsUrl);
            }
            else if (extensionUrl && extensionUrl.match(/^https?:\/\/github\.com\/(.*)/)) {
                repositoryUrl = (0, issueReporterUtil_1.normalizeGitHubUrl)(extensionUrl);
            }
            return repositoryUrl;
        }
        getIssueUrlWithTitle(issueTitle, repositoryUrl) {
            if (this.issueReporterModel.fileOnExtension()) {
                repositoryUrl = repositoryUrl + '/issues/new';
            }
            const queryStringPrefix = repositoryUrl.indexOf('?') === -1 ? '?' : '&';
            return `${repositoryUrl}${queryStringPrefix}title=${encodeURIComponent(issueTitle)}`;
        }
        updateSystemInfo(state) {
            const target = document.querySelector('.block-system .block-info');
            if (target) {
                const systemInfo = state.systemInfo;
                const renderedDataTable = (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'CPUs'), (0, dom_1.$)('td', undefined, systemInfo.cpus || '')), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'GPU Status'), (0, dom_1.$)('td', undefined, Object.keys(systemInfo.gpuStatus).map(key => `${key}: ${systemInfo.gpuStatus[key]}`).join('\n'))), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Load (avg)'), (0, dom_1.$)('td', undefined, systemInfo.load || '')), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Memory (System)'), (0, dom_1.$)('td', undefined, systemInfo.memory)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Process Argv'), (0, dom_1.$)('td', undefined, systemInfo.processArgs)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Screen Reader'), (0, dom_1.$)('td', undefined, systemInfo.screenReader)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'VM'), (0, dom_1.$)('td', undefined, systemInfo.vmHint)));
                (0, dom_1.reset)(target, renderedDataTable);
                systemInfo.remoteData.forEach(remote => {
                    target.appendChild((0, dom_1.$)('hr'));
                    if ((0, diagnostics_1.isRemoteDiagnosticError)(remote)) {
                        const remoteDataTable = (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Remote'), (0, dom_1.$)('td', undefined, remote.hostName)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, ''), (0, dom_1.$)('td', undefined, remote.errorMessage)));
                        target.appendChild(remoteDataTable);
                    }
                    else {
                        const remoteDataTable = (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Remote'), (0, dom_1.$)('td', undefined, remote.hostName)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'OS'), (0, dom_1.$)('td', undefined, remote.machineInfo.os)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'CPUs'), (0, dom_1.$)('td', undefined, remote.machineInfo.cpus || '')), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'Memory (System)'), (0, dom_1.$)('td', undefined, remote.machineInfo.memory)), (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, 'VM'), (0, dom_1.$)('td', undefined, remote.machineInfo.vmHint)));
                        target.appendChild(remoteDataTable);
                    }
                });
            }
        }
        updateExtensionSelector(extensions) {
            const extensionOptions = extensions.map(extension => {
                return {
                    name: extension.displayName || extension.name || '',
                    id: extension.id
                };
            });
            // Sort extensions by name
            extensionOptions.sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                if (aName > bName) {
                    return 1;
                }
                if (aName < bName) {
                    return -1;
                }
                return 0;
            });
            const makeOption = (extension, selectedExtension) => {
                const selected = selectedExtension && extension.id === selectedExtension.id;
                return (0, dom_1.$)('option', {
                    'value': extension.id,
                    'selected': selected || ''
                }, extension.name);
            };
            const extensionsSelector = this.getElementById('extension-selector');
            if (extensionsSelector) {
                const { selectedExtension } = this.issueReporterModel.getData();
                (0, dom_1.reset)(extensionsSelector, (0, dom_1.$)('option'), ...extensionOptions.map(extension => makeOption(extension, selectedExtension)));
                this.addEventListener('extension-selector', 'change', (e) => {
                    const selectedExtensionId = e.target.value;
                    const extensions = this.issueReporterModel.getData().allExtensions;
                    const matches = extensions.filter(extension => extension.id === selectedExtensionId);
                    if (matches.length) {
                        this.issueReporterModel.update({ selectedExtension: matches[0] });
                        this.validateSelectedExtension();
                        const title = this.getElementById('issue-title').value;
                        this.searchExtensionIssues(title);
                    }
                    else {
                        this.issueReporterModel.update({ selectedExtension: undefined });
                        this.clearSearchResults();
                        this.validateSelectedExtension();
                    }
                });
            }
            this.addEventListener('problem-source', 'change', (_) => {
                this.validateSelectedExtension();
            });
        }
        validateSelectedExtension() {
            const extensionValidationMessage = this.getElementById('extension-selection-validation-error');
            const extensionValidationNoUrlsMessage = this.getElementById('extension-selection-validation-error-no-url');
            hide(extensionValidationMessage);
            hide(extensionValidationNoUrlsMessage);
            if (!this.issueReporterModel.getData().selectedExtension) {
                this.previewButton.enabled = true;
                return;
            }
            const hasValidGitHubUrl = this.getExtensionGitHubUrl();
            if (hasValidGitHubUrl) {
                this.previewButton.enabled = true;
            }
            else {
                this.setExtensionValidationMessage();
                this.previewButton.enabled = false;
            }
        }
        setExtensionValidationMessage() {
            const extensionValidationMessage = this.getElementById('extension-selection-validation-error');
            const extensionValidationNoUrlsMessage = this.getElementById('extension-selection-validation-error-no-url');
            const bugsUrl = this.getExtensionBugsUrl();
            if (bugsUrl) {
                show(extensionValidationMessage);
                const link = this.getElementById('extensionBugsLink');
                link.textContent = bugsUrl;
                return;
            }
            const extensionUrl = this.getExtensionRepositoryUrl();
            if (extensionUrl) {
                show(extensionValidationMessage);
                const link = this.getElementById('extensionBugsLink');
                link.textContent = extensionUrl;
                return;
            }
            show(extensionValidationNoUrlsMessage);
        }
        updateProcessInfo(state) {
            const target = document.querySelector('.block-process .block-info');
            if (target) {
                (0, dom_1.reset)(target, (0, dom_1.$)('code', undefined, state.processInfo));
            }
        }
        updateWorkspaceInfo(state) {
            document.querySelector('.block-workspace .block-info code').textContent = '\n' + state.workspaceInfo;
        }
        updateExtensionTable(extensions, numThemeExtensions) {
            const target = document.querySelector('.block-extensions .block-info');
            if (target) {
                if (this.configuration.disableExtensions) {
                    (0, dom_1.reset)(target, (0, nls_1.localize)('disabledExtensions', "Extensions are disabled"));
                    return;
                }
                const themeExclusionStr = numThemeExtensions ? `\n(${numThemeExtensions} theme extensions excluded)` : '';
                extensions = extensions || [];
                if (!extensions.length) {
                    target.innerText = 'Extensions: none' + themeExclusionStr;
                    return;
                }
                (0, dom_1.reset)(target, this.getExtensionTableHtml(extensions), document.createTextNode(themeExclusionStr));
            }
        }
        updateRestrictedMode(restrictedMode) {
            this.issueReporterModel.update({ restrictedMode });
        }
        updateExperimentsInfo(experimentInfo) {
            this.issueReporterModel.update({ experimentInfo });
            const target = document.querySelector('.block-experiments .block-info');
            if (target) {
                target.textContent = experimentInfo ? experimentInfo : (0, nls_1.localize)('noCurrentExperiments', "No current experiments.");
            }
        }
        getExtensionTableHtml(extensions) {
            return (0, dom_1.$)('table', undefined, (0, dom_1.$)('tr', undefined, (0, dom_1.$)('th', undefined, 'Extension'), (0, dom_1.$)('th', undefined, 'Author (truncated)'), (0, dom_1.$)('th', undefined, 'Version')), ...extensions.map(extension => {
                var _a, _b;
                return (0, dom_1.$)('tr', undefined, (0, dom_1.$)('td', undefined, extension.name), (0, dom_1.$)('td', undefined, (_b = (_a = extension.publisher) === null || _a === void 0 ? void 0 : _a.substr(0, 3)) !== null && _b !== void 0 ? _b : 'N/A'), (0, dom_1.$)('td', undefined, extension.version));
            }));
        }
        openLink(event) {
            event.preventDefault();
            event.stopPropagation();
            // Exclude right click
            if (event.which < 3) {
                (0, dom_1.windowOpenNoOpener)(event.target.href);
            }
        }
        getElementById(elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                return element;
            }
            else {
                return undefined;
            }
        }
        addEventListener(elementId, eventType, handler) {
            const element = this.getElementById(elementId);
            if (element) {
                element.addEventListener(eventType, handler);
            }
        }
    }
    __decorate([
        (0, decorators_1.debounce)(300)
    ], IssueReporter.prototype, "searchGitHub", null);
    __decorate([
        (0, decorators_1.debounce)(300)
    ], IssueReporter.prototype, "searchDuplicates", null);
    exports.IssueReporter = IssueReporter;
    // helper functions
    function hide(el) {
        if (el) {
            el.classList.add('hidden');
        }
    }
    function show(el) {
        if (el) {
            el.classList.remove('hidden');
        }
    }
});
//# sourceMappingURL=issueReporterMain.js.map