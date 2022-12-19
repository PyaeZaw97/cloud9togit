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
define(["require", "exports", "vs/nls", "vs/platform/instantiation/common/instantiation", "vs/base/common/lifecycle", "vs/base/common/types", "vs/base/browser/dom", "vs/platform/commands/common/commands", "vs/platform/product/common/productService", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedService", "vs/platform/theme/common/themeService", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedColors", "vs/platform/theme/common/colorRegistry", "vs/platform/keybinding/common/keybinding", "vs/platform/telemetry/common/telemetry", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedIcons", "vs/platform/opener/common/opener", "vs/base/common/uri", "vs/workbench/browser/parts/editor/editorPane", "vs/platform/storage/common/storage", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/workspaces/common/workspaces", "vs/platform/workspace/common/workspace", "vs/base/common/errors", "vs/platform/label/common/label", "vs/base/common/labels", "vs/workbench/services/host/browser/host", "vs/base/common/platform", "vs/base/common/async", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedInput", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/quickinput/common/quickInput", "vs/base/browser/ui/button/button", "vs/platform/theme/common/styler", "vs/platform/opener/browser/link", "vs/base/browser/formattedTextRenderer", "vs/workbench/contrib/webview/browser/webview", "vs/editor/common/languages/language", "vs/workbench/services/extensions/common/extensions", "vs/base/common/uuid", "vs/platform/files/common/files", "vs/base/common/marshalling", "vs/platform/notification/common/notification", "vs/base/common/network", "vs/base/common/arrays", "vs/workbench/services/themes/common/workbenchThemeService", "vs/workbench/common/theme", "vs/workbench/contrib/welcomeGettingStarted/common/gettingStartedContent", "vs/editor/contrib/markdownRenderer/browser/markdownRenderer", "./gettingStartedList", "vs/base/browser/keyboardEvent", "vs/platform/telemetry/common/telemetryUtils", "vs/workbench/common/contextkeys", "vs/workbench/browser/actions/workspaceActions", "vs/workbench/browser/actions/windowActions", "vs/base/browser/ui/toggle/toggle", "vs/base/common/codicons", "vs/workbench/contrib/welcomeGettingStarted/browser/startupPage", "vs/workbench/contrib/welcomeGettingStarted/browser/gettingStartedDetailsRenderer", "vs/platform/accessibility/common/accessibility", "vs/css!./media/gettingStarted"], function (require, exports, nls_1, instantiation_1, lifecycle_1, types_1, dom_1, commands_1, productService_1, gettingStartedService_1, themeService_1, gettingStartedColors_1, colorRegistry_1, keybinding_1, telemetry_1, scrollableElement_1, gettingStartedIcons_1, opener_1, uri_1, editorPane_1, storage_1, configuration_1, contextkey_1, workspaces_1, workspace_1, errors_1, label_1, labels_1, host_1, platform_1, async_1, gettingStartedInput_1, editorGroupsService_1, quickInput_1, button_1, styler_1, link_1, formattedTextRenderer_1, webview_1, language_1, extensions_1, uuid_1, files_1, marshalling_1, notification_1, network_1, arrays_1, workbenchThemeService_1, theme_1, gettingStartedContent_1, markdownRenderer_1, gettingStartedList_1, keyboardEvent_1, telemetryUtils_1, contextkeys_1, workspaceActions_1, windowActions_1, toggle_1, codicons_1, startupPage_1, gettingStartedDetailsRenderer_1, accessibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GettingStartedInputSerializer = exports.GettingStartedPage = exports.embedderIdentifierContext = exports.inWelcomeContext = exports.allWalkthroughsHiddenContext = void 0;
    const SLIDE_TRANSITION_TIME_MS = 250;
    const configurationKey = 'workbench.startupEditor';
    exports.allWalkthroughsHiddenContext = new contextkey_1.RawContextKey('allWalkthroughsHidden', false);
    exports.inWelcomeContext = new contextkey_1.RawContextKey('inWelcome', false);
    exports.embedderIdentifierContext = new contextkey_1.RawContextKey('embedderIdentifier', undefined);
    const parsedStartEntries = gettingStartedContent_1.startEntries.map((e, i) => {
        var _a;
        return ({
            command: e.content.command,
            description: e.description,
            icon: { type: 'icon', icon: e.icon },
            id: e.id,
            order: i,
            title: e.title,
            when: (_a = contextkey_1.ContextKeyExpr.deserialize(e.when)) !== null && _a !== void 0 ? _a : contextkey_1.ContextKeyExpr.true()
        });
    });
    const REDUCED_MOTION_KEY = 'workbench.welcomePage.preferReducedMotion';
    let GettingStartedPage = class GettingStartedPage extends editorPane_1.EditorPane {
        constructor(commandService, productService, keybindingService, gettingStartedService, configurationService, telemetryService, languageService, fileService, openerService, themeService, storageService, extensionService, instantiationService, notificationService, groupsService, contextService, quickInputService, workspacesService, labelService, hostService, webviewService, workspaceContextService, accessibilityService) {
            super(GettingStartedPage.ID, telemetryService, themeService, storageService);
            this.commandService = commandService;
            this.productService = productService;
            this.keybindingService = keybindingService;
            this.gettingStartedService = gettingStartedService;
            this.configurationService = configurationService;
            this.languageService = languageService;
            this.fileService = fileService;
            this.openerService = openerService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.instantiationService = instantiationService;
            this.notificationService = notificationService;
            this.groupsService = groupsService;
            this.quickInputService = quickInputService;
            this.labelService = labelService;
            this.hostService = hostService;
            this.webviewService = webviewService;
            this.workspaceContextService = workspaceContextService;
            this.accessibilityService = accessibilityService;
            this.inProgressScroll = Promise.resolve();
            this.dispatchListeners = new lifecycle_1.DisposableStore();
            this.stepDisposables = new lifecycle_1.DisposableStore();
            this.detailsPageDisposables = new lifecycle_1.DisposableStore();
            this.buildSlideThrottle = new async_1.Throttler();
            this.hasScrolledToFirstCategory = false;
            this.webviewID = (0, uuid_1.generateUuid)();
            this.currentMediaComponent = undefined;
            this.container = (0, dom_1.$)('.gettingStartedContainer', {
                role: 'document',
                tabindex: 0,
                'aria-label': (0, nls_1.localize)('welcomeAriaLabel', "Overview of how to get up to speed with your editor.")
            });
            this.stepMediaComponent = (0, dom_1.$)('.getting-started-media');
            this.stepMediaComponent.id = (0, uuid_1.generateUuid)();
            this.categoriesSlideDisposables = this._register(new lifecycle_1.DisposableStore());
            this.detailsRenderer = new gettingStartedDetailsRenderer_1.GettingStartedDetailsRenderer(this.fileService, this.notificationService, this.extensionService, this.languageService);
            this.contextService = this._register(contextService.createScoped(this.container));
            exports.inWelcomeContext.bindTo(this.contextService).set(true);
            exports.embedderIdentifierContext.bindTo(this.contextService).set(productService.embedderIdentifier);
            this.gettingStartedCategories = this.gettingStartedService.getWalkthroughs();
            this._register(this.dispatchListeners);
            this.buildSlideThrottle = new async_1.Throttler();
            const rerender = () => {
                this.gettingStartedCategories = this.gettingStartedService.getWalkthroughs();
                if (this.currentWalkthrough) {
                    const existingSteps = this.currentWalkthrough.steps.map(step => step.id);
                    const newCategory = this.gettingStartedCategories.find(category => { var _a; return ((_a = this.currentWalkthrough) === null || _a === void 0 ? void 0 : _a.id) === category.id; });
                    if (newCategory) {
                        const newSteps = newCategory.steps.map(step => step.id);
                        if (!(0, arrays_1.equals)(newSteps, existingSteps)) {
                            this.buildSlideThrottle.queue(() => this.buildCategoriesSlide());
                        }
                    }
                }
                else {
                    this.buildSlideThrottle.queue(() => this.buildCategoriesSlide());
                }
            };
            this._register(this.gettingStartedService.onDidAddWalkthrough(rerender));
            this._register(this.gettingStartedService.onDidRemoveWalkthrough(rerender));
            this._register(this.gettingStartedService.onDidChangeWalkthrough(category => {
                const ourCategory = this.gettingStartedCategories.find(c => c.id === category.id);
                if (!ourCategory) {
                    return;
                }
                ourCategory.title = category.title;
                ourCategory.description = category.description;
                this.container.querySelectorAll(`[x-category-title-for="${category.id}"]`).forEach(step => step.innerText = ourCategory.title);
                this.container.querySelectorAll(`[x-category-description-for="${category.id}"]`).forEach(step => step.innerText = ourCategory.description);
            }));
            this._register(this.gettingStartedService.onDidProgressStep(step => {
                var _a;
                const category = this.gettingStartedCategories.find(category => category.id === step.category);
                if (!category) {
                    throw Error('Could not find category with ID: ' + step.category);
                }
                const ourStep = category.steps.find(_step => _step.id === step.id);
                if (!ourStep) {
                    throw Error('Could not find step with ID: ' + step.id);
                }
                const stats = this.getWalkthroughCompletionStats(category);
                if (!ourStep.done && stats.stepsComplete === stats.stepsTotal - 1) {
                    this.hideCategory(category.id);
                }
                this._register(this.configurationService.onDidChangeConfiguration(e => {
                    if (e.affectsConfiguration(REDUCED_MOTION_KEY)) {
                        this.container.classList.toggle('animatable', this.shouldAnimate());
                    }
                }));
                ourStep.done = step.done;
                if (category.id === ((_a = this.currentWalkthrough) === null || _a === void 0 ? void 0 : _a.id)) {
                    const badgeelements = (0, types_1.assertIsDefined)(document.querySelectorAll(`[data-done-step-id="${step.id}"]`));
                    badgeelements.forEach(badgeelement => {
                        var _a, _b;
                        if (step.done) {
                            (_a = badgeelement.parentElement) === null || _a === void 0 ? void 0 : _a.setAttribute('aria-checked', 'true');
                            badgeelement.classList.remove(...themeService_1.ThemeIcon.asClassNameArray(gettingStartedIcons_1.gettingStartedUncheckedCodicon));
                            badgeelement.classList.add('complete', ...themeService_1.ThemeIcon.asClassNameArray(gettingStartedIcons_1.gettingStartedCheckedCodicon));
                        }
                        else {
                            (_b = badgeelement.parentElement) === null || _b === void 0 ? void 0 : _b.setAttribute('aria-checked', 'false');
                            badgeelement.classList.remove('complete', ...themeService_1.ThemeIcon.asClassNameArray(gettingStartedIcons_1.gettingStartedCheckedCodicon));
                            badgeelement.classList.add(...themeService_1.ThemeIcon.asClassNameArray(gettingStartedIcons_1.gettingStartedUncheckedCodicon));
                        }
                    });
                }
                this.updateCategoryProgress();
            }));
            this.recentlyOpened = workspacesService.getRecentlyOpened();
        }
        // remove when 'workbench.welcomePage.preferReducedMotion' deprecated
        shouldAnimate() {
            if (this.configurationService.getValue(REDUCED_MOTION_KEY)) {
                return false;
            }
            if (this.accessibilityService.isMotionReduced()) {
                return false;
            }
            return true;
        }
        getWalkthroughCompletionStats(walkthrough) {
            const activeSteps = walkthrough.steps.filter(s => this.contextService.contextMatchesRules(s.when));
            return {
                stepsComplete: activeSteps.filter(s => s.done).length,
                stepsTotal: activeSteps.length,
            };
        }
        async setInput(newInput, options, context, token) {
            this.container.classList.remove('animatable');
            this.editorInput = newInput;
            await super.setInput(newInput, options, context, token);
            await this.buildCategoriesSlide();
            if (this.shouldAnimate()) {
                setTimeout(() => this.container.classList.add('animatable'), 0);
            }
        }
        async makeCategoryVisibleWhenAvailable(categoryID, stepId) {
            if (!this.gettingStartedCategories.some(c => c.id === categoryID)) {
                await this.gettingStartedService.installedExtensionsRegistered;
                this.gettingStartedCategories = this.gettingStartedService.getWalkthroughs();
            }
            const ourCategory = this.gettingStartedCategories.find(c => c.id === categoryID);
            if (!ourCategory) {
                throw Error('Could not find category with ID: ' + categoryID);
            }
            this.scrollToCategory(categoryID, stepId);
        }
        registerDispatchListeners() {
            this.dispatchListeners.clear();
            this.container.querySelectorAll('[x-dispatch]').forEach(element => {
                var _a;
                const [command, argument] = ((_a = element.getAttribute('x-dispatch')) !== null && _a !== void 0 ? _a : '').split(':');
                if (command) {
                    this.dispatchListeners.add((0, dom_1.addDisposableListener)(element, 'click', (e) => {
                        e.stopPropagation();
                        this.runDispatchCommand(command, argument);
                    }));
                    this.dispatchListeners.add((0, dom_1.addDisposableListener)(element, 'keyup', (e) => {
                        const keyboardEvent = new keyboardEvent_1.StandardKeyboardEvent(e);
                        e.stopPropagation();
                        switch (keyboardEvent.keyCode) {
                            case 3 /* KeyCode.Enter */:
                            case 10 /* KeyCode.Space */:
                                this.runDispatchCommand(command, argument);
                                return;
                        }
                    }));
                }
            });
        }
        async runDispatchCommand(command, argument) {
            var _a, _b, _c;
            this.commandService.executeCommand('workbench.action.keepEditor');
            this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command, argument, walkthroughId: (_a = this.currentWalkthrough) === null || _a === void 0 ? void 0 : _a.id });
            switch (command) {
                case 'scrollPrev': {
                    this.scrollPrev();
                    break;
                }
                case 'skip': {
                    this.runSkip();
                    break;
                }
                case 'showMoreRecents': {
                    this.commandService.executeCommand(windowActions_1.OpenRecentAction.ID);
                    break;
                }
                case 'seeAllWalkthroughs': {
                    await this.openWalkthroughSelector();
                    break;
                }
                case 'openFolder': {
                    if (this.contextService.contextMatchesRules(contextkey_1.ContextKeyExpr.and(contextkeys_1.WorkbenchStateContext.isEqualTo('workspace')))) {
                        this.commandService.executeCommand(workspaceActions_1.OpenFolderViaWorkspaceAction.ID);
                    }
                    else {
                        this.commandService.executeCommand(platform_1.isMacintosh ? 'workbench.action.files.openFileFolder' : 'workbench.action.files.openFolder');
                    }
                    break;
                }
                case 'selectCategory': {
                    const selectedCategory = this.gettingStartedCategories.find(category => category.id === argument);
                    if (!selectedCategory) {
                        throw Error('Could not find category with ID ' + argument);
                    }
                    this.gettingStartedService.markWalkthroughOpened(argument);
                    (_b = this.gettingStartedList) === null || _b === void 0 ? void 0 : _b.setEntries(this.gettingStartedService.getWalkthroughs());
                    this.scrollToCategory(argument);
                    break;
                }
                case 'selectStartEntry': {
                    const selected = gettingStartedContent_1.startEntries.find(e => e.id === argument);
                    if (selected) {
                        this.runStepCommand(selected.content.command);
                    }
                    else {
                        throw Error('could not find start entry with id: ' + argument);
                    }
                    break;
                }
                case 'hideCategory': {
                    this.hideCategory(argument);
                    break;
                }
                // Use selectTask over selectStep to keep telemetry consistant:https://github.com/microsoft/vscode/issues/122256
                case 'selectTask': {
                    this.selectStep(argument);
                    break;
                }
                case 'toggleStepCompletion': {
                    this.toggleStepCompletion(argument);
                    break;
                }
                case 'allDone': {
                    this.markAllStepsComplete();
                    break;
                }
                case 'nextSection': {
                    const next = (_c = this.currentWalkthrough) === null || _c === void 0 ? void 0 : _c.next;
                    if (next) {
                        this.scrollToCategory(next);
                    }
                    else {
                        console.error('Error scrolling to next section of', this.currentWalkthrough);
                    }
                    break;
                }
                default: {
                    console.error('Dispatch to', command, argument, 'not defined');
                    break;
                }
            }
        }
        hideCategory(categoryId) {
            var _a;
            const selectedCategory = this.gettingStartedCategories.find(category => category.id === categoryId);
            if (!selectedCategory) {
                throw Error('Could not find category with ID ' + categoryId);
            }
            this.setHiddenCategories([...this.getHiddenCategories().add(categoryId)]);
            (_a = this.gettingStartedList) === null || _a === void 0 ? void 0 : _a.rerender();
        }
        markAllStepsComplete() {
            var _a, _b;
            if (this.currentWalkthrough) {
                (_a = this.currentWalkthrough) === null || _a === void 0 ? void 0 : _a.steps.forEach(step => {
                    if (!step.done) {
                        this.gettingStartedService.progressStep(step.id);
                    }
                });
                this.hideCategory((_b = this.currentWalkthrough) === null || _b === void 0 ? void 0 : _b.id);
                this.scrollPrev();
            }
            else {
                throw Error('No walkthrough opened');
            }
        }
        toggleStepCompletion(argument) {
            var _a;
            const stepToggle = (0, types_1.assertIsDefined)((_a = this.currentWalkthrough) === null || _a === void 0 ? void 0 : _a.steps.find(step => step.id === argument));
            if (stepToggle.done) {
                this.gettingStartedService.deprogressStep(argument);
            }
            else {
                this.gettingStartedService.progressStep(argument);
            }
        }
        async openWalkthroughSelector() {
            const selection = await this.quickInputService.pick(this.gettingStartedCategories
                .filter(c => this.contextService.contextMatchesRules(c.when))
                .map(x => ({
                id: x.id,
                label: x.title,
                detail: x.description,
                description: x.source,
            })), { canPickMany: false, matchOnDescription: true, matchOnDetail: true, title: (0, nls_1.localize)('pickWalkthroughs', "Open Walkthrough...") });
            if (selection) {
                this.runDispatchCommand('selectCategory', selection.id);
            }
        }
        getHiddenCategories() {
            return new Set(JSON.parse(this.storageService.get(gettingStartedService_1.hiddenEntriesConfigurationKey, 0 /* StorageScope.GLOBAL */, '[]')));
        }
        setHiddenCategories(hidden) {
            this.storageService.store(gettingStartedService_1.hiddenEntriesConfigurationKey, JSON.stringify(hidden), 0 /* StorageScope.GLOBAL */, 0 /* StorageTarget.USER */);
        }
        async buildMediaComponent(stepId) {
            var _a;
            if (!this.currentWalkthrough) {
                throw Error('no walkthrough selected');
            }
            const stepToExpand = (0, types_1.assertIsDefined)(this.currentWalkthrough.steps.find(step => step.id === stepId));
            if (this.currentMediaComponent === stepId) {
                return;
            }
            this.currentMediaComponent = stepId;
            this.stepDisposables.clear();
            this.stepDisposables.add({
                dispose: () => {
                    (0, dom_1.clearNode)(this.stepMediaComponent);
                    this.currentMediaComponent = undefined;
                }
            });
            if (stepToExpand.media.type === 'image') {
                this.stepsContent.classList.add('image');
                this.stepsContent.classList.remove('markdown');
                const media = stepToExpand.media;
                const mediaElement = (0, dom_1.$)('img');
                this.stepMediaComponent.appendChild(mediaElement);
                mediaElement.setAttribute('alt', media.altText);
                this.updateMediaSourceForColorMode(mediaElement, media.path);
                this.stepDisposables.add((0, dom_1.addDisposableListener)(this.stepMediaComponent, 'click', () => {
                    var _a;
                    const hrefs = (0, arrays_1.flatten)(stepToExpand.description.map(lt => lt.nodes.filter((node) => typeof node !== 'string').map(node => node.href)));
                    if (hrefs.length === 1) {
                        const href = hrefs[0];
                        if (href.startsWith('http')) {
                            this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command: 'runStepAction', argument: href, walkthroughId: (_a = this.currentWalkthrough) === null || _a === void 0 ? void 0 : _a.id });
                            this.openerService.open(href);
                        }
                    }
                }));
                this.stepDisposables.add(this.themeService.onDidColorThemeChange(() => this.updateMediaSourceForColorMode(mediaElement, media.path)));
            }
            else if (stepToExpand.media.type === 'svg') {
                this.stepsContent.classList.add('image');
                this.stepsContent.classList.remove('markdown');
                const media = stepToExpand.media;
                const webview = this.stepDisposables.add(this.webviewService.createWebviewElement(this.webviewID, {}, {}, undefined));
                webview.mountTo(this.stepMediaComponent);
                webview.html = await this.detailsRenderer.renderSVG(media.path);
                let isDisposed = false;
                this.stepDisposables.add((0, lifecycle_1.toDisposable)(() => { isDisposed = true; }));
                this.stepDisposables.add(this.themeService.onDidColorThemeChange(async () => {
                    // Render again since color vars change
                    const body = await this.detailsRenderer.renderSVG(media.path);
                    if (!isDisposed) { // Make sure we weren't disposed of in the meantime
                        webview.html = body;
                    }
                }));
                this.stepDisposables.add((0, dom_1.addDisposableListener)(this.stepMediaComponent, 'click', () => {
                    var _a;
                    const hrefs = (0, arrays_1.flatten)(stepToExpand.description.map(lt => lt.nodes.filter((node) => typeof node !== 'string').map(node => node.href)));
                    if (hrefs.length === 1) {
                        const href = hrefs[0];
                        if (href.startsWith('http')) {
                            this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command: 'runStepAction', argument: href, walkthroughId: (_a = this.currentWalkthrough) === null || _a === void 0 ? void 0 : _a.id });
                            this.openerService.open(href);
                        }
                    }
                }));
                this.stepDisposables.add(webview.onDidClickLink(link => {
                    if ((0, opener_1.matchesScheme)(link, network_1.Schemas.https) || (0, opener_1.matchesScheme)(link, network_1.Schemas.http) || ((0, opener_1.matchesScheme)(link, network_1.Schemas.command))) {
                        this.openerService.open(link, { allowCommands: true });
                    }
                }));
            }
            else if (stepToExpand.media.type === 'markdown') {
                this.stepsContent.classList.remove('image');
                this.stepsContent.classList.add('markdown');
                const media = stepToExpand.media;
                const webview = this.stepDisposables.add(this.webviewService.createWebviewElement(this.webviewID, {}, { localResourceRoots: [media.root], allowScripts: true }, undefined));
                webview.mountTo(this.stepMediaComponent);
                const rawHTML = await this.detailsRenderer.renderMarkdown(media.path, media.base);
                webview.html = rawHTML;
                const serializedContextKeyExprs = (_a = rawHTML.match(/checked-on=\"([^'][^"]*)\"/g)) === null || _a === void 0 ? void 0 : _a.map(attr => attr.slice('checked-on="'.length, -1)
                    .replace(/&#39;/g, '\'')
                    .replace(/&amp;/g, '&'));
                const postTrueKeysMessage = () => {
                    const enabledContextKeys = serializedContextKeyExprs === null || serializedContextKeyExprs === void 0 ? void 0 : serializedContextKeyExprs.filter(expr => this.contextService.contextMatchesRules(contextkey_1.ContextKeyExpr.deserialize(expr)));
                    if (enabledContextKeys) {
                        webview.postMessage({
                            enabledContextKeys
                        });
                    }
                };
                if (serializedContextKeyExprs) {
                    const contextKeyExprs = (0, arrays_1.coalesce)(serializedContextKeyExprs.map(expr => contextkey_1.ContextKeyExpr.deserialize(expr)));
                    const watchingKeys = new Set((0, arrays_1.flatten)(contextKeyExprs.map(expr => expr.keys())));
                    this.stepDisposables.add(this.contextService.onDidChangeContext(e => {
                        if (e.affectsSome(watchingKeys)) {
                            postTrueKeysMessage();
                        }
                    }));
                }
                let isDisposed = false;
                this.stepDisposables.add((0, lifecycle_1.toDisposable)(() => { isDisposed = true; }));
                this.stepDisposables.add(webview.onDidClickLink(link => {
                    if ((0, opener_1.matchesScheme)(link, network_1.Schemas.https) || (0, opener_1.matchesScheme)(link, network_1.Schemas.http) || ((0, opener_1.matchesScheme)(link, network_1.Schemas.command))) {
                        this.openerService.open(link, { allowCommands: true });
                    }
                }));
                this.stepDisposables.add(this.themeService.onDidColorThemeChange(async () => {
                    // Render again since syntax highlighting of code blocks may have changed
                    const body = await this.detailsRenderer.renderMarkdown(media.path, media.base);
                    if (!isDisposed) { // Make sure we weren't disposed of in the meantime
                        webview.html = body;
                        postTrueKeysMessage();
                    }
                }));
                const layoutDelayer = new async_1.Delayer(50);
                this.layoutMarkdown = () => {
                    layoutDelayer.trigger(() => {
                        webview.postMessage({ layoutMeNow: true });
                    });
                };
                this.stepDisposables.add(layoutDelayer);
                this.stepDisposables.add({ dispose: () => this.layoutMarkdown = undefined });
                postTrueKeysMessage();
                this.stepDisposables.add(webview.onMessage(e => {
                    const message = e.message;
                    if (message.startsWith('command:')) {
                        this.openerService.open(message, { allowCommands: true });
                    }
                    else if (message.startsWith('setTheme:')) {
                        this.configurationService.updateValue(workbenchThemeService_1.ThemeSettings.COLOR_THEME, message.slice('setTheme:'.length), 1 /* ConfigurationTarget.USER */);
                    }
                    else {
                        console.error('Unexpected message', message);
                    }
                }));
            }
        }
        async selectStepLoose(id) {
            const toSelect = this.editorInput.selectedCategory + '#' + id;
            this.selectStep(toSelect);
        }
        async selectStep(id, delayFocus = true, forceRebuild = false) {
            var _a, _b, _c;
            if (id && this.editorInput.selectedStep === id && !forceRebuild) {
                return;
            }
            if (id) {
                let stepElement = this.container.querySelector(`[data-step-id="${id}"]`);
                if (!stepElement) {
                    // Selected an element that is not in-context, just fallback to whatever.
                    stepElement = this.container.querySelector(`[data-step-id]`);
                    if (!stepElement) {
                        // No steps around... just ignore.
                        return;
                    }
                    id = (0, types_1.assertIsDefined)(stepElement.getAttribute('data-step-id'));
                }
                (_a = stepElement.parentElement) === null || _a === void 0 ? void 0 : _a.querySelectorAll('.expanded').forEach(node => {
                    if (node.getAttribute('data-step-id') !== id) {
                        node.classList.remove('expanded');
                        node.setAttribute('aria-expanded', 'false');
                    }
                });
                setTimeout(() => stepElement.focus(), delayFocus && this.shouldAnimate() ? SLIDE_TRANSITION_TIME_MS : 0);
                this.editorInput.selectedStep = id;
                stepElement.classList.add('expanded');
                stepElement.setAttribute('aria-expanded', 'true');
                this.buildMediaComponent(id);
                this.gettingStartedService.progressByEvent('stepSelected:' + id);
            }
            else {
                this.editorInput.selectedStep = undefined;
            }
            (_b = this.detailsPageScrollbar) === null || _b === void 0 ? void 0 : _b.scanDomNode();
            (_c = this.detailsScrollbar) === null || _c === void 0 ? void 0 : _c.scanDomNode();
        }
        updateMediaSourceForColorMode(element, sources) {
            const themeType = this.themeService.getColorTheme().type;
            const src = sources[themeType].toString(true).replace(/ /g, '%20');
            element.srcset = src.toLowerCase().endsWith('.svg') ? src : (src + ' 1.5x');
        }
        createEditor(parent) {
            if (this.detailsPageScrollbar) {
                this.detailsPageScrollbar.dispose();
            }
            if (this.categoriesPageScrollbar) {
                this.categoriesPageScrollbar.dispose();
            }
            this.categoriesSlide = (0, dom_1.$)('.gettingStartedSlideCategories.gettingStartedSlide');
            const prevButton = (0, dom_1.$)('button.prev-button.button-link', { 'x-dispatch': 'scrollPrev' }, (0, dom_1.$)('span.scroll-button.codicon.codicon-chevron-left'), (0, dom_1.$)('span.moreText', {}, (0, nls_1.localize)('getStarted', "Get Started")));
            this.stepsSlide = (0, dom_1.$)('.gettingStartedSlideDetails.gettingStartedSlide', {}, prevButton);
            this.stepsContent = (0, dom_1.$)('.gettingStartedDetailsContent', {});
            this.detailsPageScrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.stepsContent, { className: 'full-height-scrollable' }));
            this.categoriesPageScrollbar = this._register(new scrollableElement_1.DomScrollableElement(this.categoriesSlide, { className: 'full-height-scrollable categoriesScrollbar' }));
            this.stepsSlide.appendChild(this.detailsPageScrollbar.getDomNode());
            const gettingStartedPage = (0, dom_1.$)('.gettingStarted', {}, this.categoriesPageScrollbar.getDomNode(), this.stepsSlide);
            this.container.appendChild(gettingStartedPage);
            this.categoriesPageScrollbar.scanDomNode();
            this.detailsPageScrollbar.scanDomNode();
            parent.appendChild(this.container);
        }
        async buildCategoriesSlide() {
            var _a, _b;
            this.categoriesSlideDisposables.clear();
            const showOnStartupCheckbox = new toggle_1.Toggle({
                icon: codicons_1.Codicon.check,
                actionClassName: 'getting-started-checkbox',
                isChecked: this.configurationService.getValue(configurationKey) === 'welcomePage',
                title: (0, nls_1.localize)('checkboxTitle', "When checked, this page will be shown on startup."),
            });
            showOnStartupCheckbox.domNode.id = 'showOnStartup';
            const showOnStartupLabel = (0, dom_1.$)('label.caption', { for: 'showOnStartup' }, (0, nls_1.localize)('welcomePage.showOnStartup', "Show welcome page on startup"));
            const onShowOnStartupChanged = () => {
                var _a, _b;
                if (showOnStartupCheckbox.checked) {
                    this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command: 'showOnStartupChecked', argument: undefined, walkthroughId: (_a = this.currentWalkthrough) === null || _a === void 0 ? void 0 : _a.id });
                    this.configurationService.updateValue(configurationKey, 'welcomePage');
                }
                else {
                    this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command: 'showOnStartupUnchecked', argument: undefined, walkthroughId: (_b = this.currentWalkthrough) === null || _b === void 0 ? void 0 : _b.id });
                    this.configurationService.updateValue(configurationKey, 'none');
                }
            };
            this.categoriesSlideDisposables.add(showOnStartupCheckbox);
            this.categoriesSlideDisposables.add(showOnStartupCheckbox.onChange(() => {
                onShowOnStartupChanged();
            }));
            this.categoriesSlideDisposables.add((0, dom_1.addDisposableListener)(showOnStartupLabel, 'click', () => {
                showOnStartupCheckbox.checked = !showOnStartupCheckbox.checked;
                onShowOnStartupChanged();
            }));
            const header = (0, dom_1.$)('.header', {}, (0, dom_1.$)('h1.product-name.caption', {}, this.productService.nameLong), (0, dom_1.$)('p.subtitle.description', {}, (0, nls_1.localize)({ key: 'gettingStarted.editingEvolved', comment: ['Shown as subtitle on the Welcome page.'] }, "Editing evolved")));
            const leftColumn = (0, dom_1.$)('.categories-column.categories-column-left', {});
            const rightColumn = (0, dom_1.$)('.categories-column.categories-column-right', {});
            const startList = this.buildStartList();
            const recentList = this.buildRecentlyOpenedList();
            const gettingStartedList = this.buildGettingStartedWalkthroughsList();
            const footer = (0, dom_1.$)('.footer', {}, (0, dom_1.$)('p.showOnStartup', {}, showOnStartupCheckbox.domNode, showOnStartupLabel));
            const layoutLists = () => {
                if (gettingStartedList.itemCount) {
                    this.container.classList.remove('noWalkthroughs');
                    (0, dom_1.reset)(leftColumn, startList.getDomElement(), recentList.getDomElement());
                    (0, dom_1.reset)(rightColumn, gettingStartedList.getDomElement());
                    recentList.setLimit(5);
                }
                else {
                    this.container.classList.add('noWalkthroughs');
                    (0, dom_1.reset)(leftColumn, startList.getDomElement());
                    (0, dom_1.reset)(rightColumn, recentList.getDomElement());
                    recentList.setLimit(10);
                }
                setTimeout(() => { var _a; return (_a = this.categoriesPageScrollbar) === null || _a === void 0 ? void 0 : _a.scanDomNode(); }, 50);
            };
            gettingStartedList.onDidChange(layoutLists);
            layoutLists();
            (0, dom_1.reset)(this.categoriesSlide, (0, dom_1.$)('.gettingStartedCategoriesContainer', {}, header, leftColumn, rightColumn, footer));
            (_a = this.categoriesPageScrollbar) === null || _a === void 0 ? void 0 : _a.scanDomNode();
            this.updateCategoryProgress();
            this.registerDispatchListeners();
            if (this.editorInput.selectedCategory) {
                this.currentWalkthrough = this.gettingStartedCategories.find(category => category.id === this.editorInput.selectedCategory);
                if (!this.currentWalkthrough) {
                    this.container.classList.add('loading');
                    await this.gettingStartedService.installedExtensionsRegistered;
                    this.container.classList.remove('loading');
                    this.gettingStartedCategories = this.gettingStartedService.getWalkthroughs();
                }
                this.currentWalkthrough = this.gettingStartedCategories.find(category => category.id === this.editorInput.selectedCategory);
                if (!this.currentWalkthrough) {
                    console.error('Could not restore to category ' + this.editorInput.selectedCategory + ' as it was not found');
                    this.editorInput.selectedCategory = undefined;
                    this.editorInput.selectedStep = undefined;
                }
                else {
                    this.buildCategorySlide(this.editorInput.selectedCategory, this.editorInput.selectedStep);
                    this.setSlide('details');
                    return;
                }
            }
            const someStepsComplete = this.gettingStartedCategories.some(category => category.steps.find(s => s.done));
            if (this.editorInput.showTelemetryNotice && this.productService.openToWelcomeMainPage) {
                const telemetryNotice = (0, dom_1.$)('p.telemetry-notice');
                this.buildTelemetryFooter(telemetryNotice);
                footer.appendChild(telemetryNotice);
            }
            else if (!this.productService.openToWelcomeMainPage && !someStepsComplete && !this.hasScrolledToFirstCategory) {
                const firstSessionDateString = this.storageService.get(telemetry_1.firstSessionDateStorageKey, 0 /* StorageScope.GLOBAL */) || new Date().toUTCString();
                const daysSinceFirstSession = ((+new Date()) - (+new Date(firstSessionDateString))) / 1000 / 60 / 60 / 24;
                const fistContentBehaviour = daysSinceFirstSession < 1 ? 'openToFirstCategory' : 'index';
                if (fistContentBehaviour === 'openToFirstCategory') {
                    const first = this.gettingStartedCategories.filter(c => !c.when || this.contextService.contextMatchesRules(c.when))[0];
                    this.hasScrolledToFirstCategory = true;
                    if (first) {
                        this.currentWalkthrough = first;
                        this.editorInput.selectedCategory = (_b = this.currentWalkthrough) === null || _b === void 0 ? void 0 : _b.id;
                        this.buildCategorySlide(this.editorInput.selectedCategory, undefined);
                        this.setSlide('details');
                        return;
                    }
                }
            }
            this.setSlide('categories');
        }
        buildRecentlyOpenedList() {
            const renderRecent = (recent) => {
                let fullPath;
                let windowOpenable;
                if ((0, workspaces_1.isRecentFolder)(recent)) {
                    windowOpenable = { folderUri: recent.folderUri };
                    fullPath = recent.label || this.labelService.getWorkspaceLabel(recent.folderUri, { verbose: true });
                }
                else {
                    fullPath = recent.label || this.labelService.getWorkspaceLabel(recent.workspace, { verbose: true });
                    windowOpenable = { workspaceUri: recent.workspace.configPath };
                }
                const { name, parentPath } = (0, labels_1.splitName)(fullPath);
                const li = (0, dom_1.$)('li');
                const link = (0, dom_1.$)('button.button-link');
                link.innerText = name;
                link.title = fullPath;
                link.setAttribute('aria-label', (0, nls_1.localize)('welcomePage.openFolderWithPath', "Open folder {0} with path {1}", name, parentPath));
                link.addEventListener('click', e => {
                    var _a;
                    this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command: 'openRecent', argument: undefined, walkthroughId: (_a = this.currentWalkthrough) === null || _a === void 0 ? void 0 : _a.id });
                    this.hostService.openWindow([windowOpenable], {
                        forceNewWindow: e.ctrlKey || e.metaKey,
                        remoteAuthority: recent.remoteAuthority || null // local window if remoteAuthority is not set or can not be deducted from the openable
                    });
                    e.preventDefault();
                    e.stopPropagation();
                });
                li.appendChild(link);
                const span = (0, dom_1.$)('span');
                span.classList.add('path');
                span.classList.add('detail');
                span.innerText = parentPath;
                span.title = fullPath;
                li.appendChild(span);
                return li;
            };
            if (this.recentlyOpenedList) {
                this.recentlyOpenedList.dispose();
            }
            const recentlyOpenedList = this.recentlyOpenedList = new gettingStartedList_1.GettingStartedIndexList({
                title: (0, nls_1.localize)('recent', "Recent"),
                klass: 'recently-opened',
                limit: 5,
                empty: (0, dom_1.$)('.empty-recent', {}, (0, nls_1.localize)('noRecents', "You have no recent folders,"), (0, dom_1.$)('button.button-link', { 'x-dispatch': 'openFolder' }, (0, nls_1.localize)('openFolder', "open a folder")), (0, nls_1.localize)('toStart', "to start.")),
                more: (0, dom_1.$)('.more', {}, (0, dom_1.$)('button.button-link', {
                    'x-dispatch': 'showMoreRecents',
                    title: (0, nls_1.localize)('show more recents', "Show All Recent Folders {0}", this.getKeybindingLabel(windowActions_1.OpenRecentAction.ID))
                }, 'More...')),
                renderElement: renderRecent,
                contextService: this.contextService
            });
            recentlyOpenedList.onDidChange(() => this.registerDispatchListeners());
            this.recentlyOpened.then(({ workspaces }) => {
                // Filter out the current workspace
                const workspacesWithID = workspaces
                    .filter(recent => !this.workspaceContextService.isCurrentWorkspace((0, workspaces_1.isRecentWorkspace)(recent) ? recent.workspace : recent.folderUri))
                    .map(recent => (Object.assign(Object.assign({}, recent), { id: (0, workspaces_1.isRecentWorkspace)(recent) ? recent.workspace.id : recent.folderUri.toString() })));
                const updateEntries = () => {
                    recentlyOpenedList.setEntries(workspacesWithID);
                };
                updateEntries();
                recentlyOpenedList.register(this.labelService.onDidChangeFormatters(() => updateEntries()));
            }).catch(errors_1.onUnexpectedError);
            return recentlyOpenedList;
        }
        buildStartList() {
            const renderStartEntry = (entry) => (0, dom_1.$)('li', {}, (0, dom_1.$)('button.button-link', {
                'x-dispatch': 'selectStartEntry:' + entry.id,
                title: entry.description + ' ' + this.getKeybindingLabel(entry.command),
            }, this.iconWidgetFor(entry), (0, dom_1.$)('span', {}, entry.title)));
            if (this.startList) {
                this.startList.dispose();
            }
            const startList = this.startList = new gettingStartedList_1.GettingStartedIndexList({
                title: (0, nls_1.localize)('start', "Start"),
                klass: 'start-container',
                limit: 10,
                renderElement: renderStartEntry,
                rankElement: e => -e.order,
                contextService: this.contextService
            });
            startList.setEntries(parsedStartEntries);
            startList.onDidChange(() => this.registerDispatchListeners());
            return startList;
        }
        buildGettingStartedWalkthroughsList() {
            const renderGetttingStaredWalkthrough = (category) => {
                const renderNewBadge = (category.newItems || category.newEntry) && !category.isFeatured;
                const newBadge = (0, dom_1.$)('.new-badge', {});
                if (category.newEntry) {
                    (0, dom_1.reset)(newBadge, (0, dom_1.$)('.new-category', {}, (0, nls_1.localize)('new', "New")));
                }
                else if (category.newItems) {
                    (0, dom_1.reset)(newBadge, (0, dom_1.$)('.new-items', {}, (0, nls_1.localize)({ key: 'newItems', comment: ['Shown when a list of items has changed based on an update from a remote source'] }, "Updated")));
                }
                const featuredBadge = (0, dom_1.$)('.featured-badge', {});
                const descriptionContent = (0, dom_1.$)('.description-content', {});
                if (category.isFeatured) {
                    (0, dom_1.reset)(featuredBadge, (0, dom_1.$)('.featured', {}, (0, dom_1.$)('span.featured-icon.codicon.codicon-star-empty')));
                    (0, dom_1.reset)(descriptionContent, category.description);
                }
                return (0, dom_1.$)('button.getting-started-category' + (category.isFeatured ? '.featured' : ''), {
                    'x-dispatch': 'selectCategory:' + category.id,
                    'title': category.description
                }, featuredBadge, (0, dom_1.$)('.main-content', {}, this.iconWidgetFor(category), (0, dom_1.$)('h3.category-title.max-lines-3', { 'x-category-title-for': category.id }, category.title), renderNewBadge ? newBadge : (0, dom_1.$)('.no-badge'), (0, dom_1.$)('a.codicon.codicon-close.hide-category-button', {
                    'tabindex': 0,
                    'x-dispatch': 'hideCategory:' + category.id,
                    'title': (0, nls_1.localize)('close', "Hide"),
                })), descriptionContent, (0, dom_1.$)('.category-progress', { 'x-data-category-id': category.id, }, (0, dom_1.$)('.progress-bar-outer', { 'role': 'progressbar' }, (0, dom_1.$)('.progress-bar-inner'))));
            };
            if (this.gettingStartedList) {
                this.gettingStartedList.dispose();
            }
            const rankWalkthrough = (e) => {
                let rank = e.order;
                if (e.isFeatured) {
                    rank += 7;
                }
                if (e.newEntry) {
                    rank += 3;
                }
                if (e.newItems) {
                    rank += 2;
                }
                if (e.recencyBonus) {
                    rank += 4 * e.recencyBonus;
                }
                if (this.getHiddenCategories().has(e.id)) {
                    rank = null;
                }
                return rank;
            };
            const gettingStartedList = this.gettingStartedList = new gettingStartedList_1.GettingStartedIndexList({
                title: (0, nls_1.localize)('walkthroughs', "Walkthroughs"),
                klass: 'getting-started',
                limit: 5,
                footer: (0, dom_1.$)('span.button-link.see-all-walkthroughs', { 'x-dispatch': 'seeAllWalkthroughs', 'tabindex': 0 }, (0, nls_1.localize)('showAll', "More...")),
                renderElement: renderGetttingStaredWalkthrough,
                rankElement: rankWalkthrough,
                contextService: this.contextService,
            });
            gettingStartedList.onDidChange(() => {
                const hidden = this.getHiddenCategories();
                const someWalkthroughsHidden = hidden.size || gettingStartedList.itemCount < this.gettingStartedCategories.filter(c => this.contextService.contextMatchesRules(c.when)).length;
                this.container.classList.toggle('someWalkthroughsHidden', !!someWalkthroughsHidden);
                this.registerDispatchListeners();
                exports.allWalkthroughsHiddenContext.bindTo(this.contextService).set(gettingStartedList.itemCount === 0);
                this.updateCategoryProgress();
            });
            gettingStartedList.setEntries(this.gettingStartedCategories);
            exports.allWalkthroughsHiddenContext.bindTo(this.contextService).set(gettingStartedList.itemCount === 0);
            return gettingStartedList;
        }
        layout(size) {
            var _a, _b, _c, _d, _e, _f, _g;
            (_a = this.detailsScrollbar) === null || _a === void 0 ? void 0 : _a.scanDomNode();
            (_b = this.categoriesPageScrollbar) === null || _b === void 0 ? void 0 : _b.scanDomNode();
            (_c = this.detailsPageScrollbar) === null || _c === void 0 ? void 0 : _c.scanDomNode();
            (_d = this.startList) === null || _d === void 0 ? void 0 : _d.layout(size);
            (_e = this.gettingStartedList) === null || _e === void 0 ? void 0 : _e.layout(size);
            (_f = this.recentlyOpenedList) === null || _f === void 0 ? void 0 : _f.layout(size);
            (_g = this.layoutMarkdown) === null || _g === void 0 ? void 0 : _g.call(this);
            this.container.classList[size.height <= 600 ? 'add' : 'remove']('height-constrained');
            this.container.classList[size.width <= 400 ? 'add' : 'remove']('width-constrained');
            this.container.classList[size.width <= 800 ? 'add' : 'remove']('width-semi-constrained');
        }
        updateCategoryProgress() {
            document.querySelectorAll('.category-progress').forEach(element => {
                const categoryID = element.getAttribute('x-data-category-id');
                const category = this.gettingStartedCategories.find(category => category.id === categoryID);
                if (!category) {
                    throw Error('Could not find category with ID ' + categoryID);
                }
                const stats = this.getWalkthroughCompletionStats(category);
                const bar = (0, types_1.assertIsDefined)(element.querySelector('.progress-bar-inner'));
                bar.setAttribute('aria-valuemin', '0');
                bar.setAttribute('aria-valuenow', '' + stats.stepsComplete);
                bar.setAttribute('aria-valuemax', '' + stats.stepsTotal);
                const progress = (stats.stepsComplete / stats.stepsTotal) * 100;
                bar.style.width = `${progress}%`;
                element.parentElement.classList.toggle('no-progress', stats.stepsComplete === 0);
                if (stats.stepsTotal === stats.stepsComplete) {
                    bar.title = (0, nls_1.localize)('gettingStarted.allStepsComplete', "All {0} steps complete!", stats.stepsComplete);
                }
                else {
                    bar.title = (0, nls_1.localize)('gettingStarted.someStepsComplete', "{0} of {1} steps complete", stats.stepsComplete, stats.stepsTotal);
                }
            });
        }
        async scrollToCategory(categoryID, stepId) {
            this.inProgressScroll = this.inProgressScroll.then(async () => {
                (0, dom_1.reset)(this.stepsContent);
                this.editorInput.selectedCategory = categoryID;
                this.editorInput.selectedStep = stepId;
                this.currentWalkthrough = this.gettingStartedCategories.find(category => category.id === categoryID);
                this.buildCategorySlide(categoryID);
                this.setSlide('details');
            });
        }
        iconWidgetFor(category) {
            const widget = category.icon.type === 'icon' ? (0, dom_1.$)(themeService_1.ThemeIcon.asCSSSelector(category.icon.icon)) : (0, dom_1.$)('img.category-icon', { src: category.icon.path });
            widget.classList.add('icon-widget');
            return widget;
        }
        runStepCommand(href) {
            var _a;
            const isCommand = href.startsWith('command:');
            const toSide = href.startsWith('command:toSide:');
            const command = href.replace(/command:(toSide:)?/, 'command:');
            this.telemetryService.publicLog2('gettingStarted.ActionExecuted', { command: 'runStepAction', argument: href, walkthroughId: (_a = this.currentWalkthrough) === null || _a === void 0 ? void 0 : _a.id });
            const fullSize = this.groupsService.contentDimension;
            if (toSide && fullSize.width > 700) {
                if (this.groupsService.count === 1) {
                    this.groupsService.addGroup(this.groupsService.groups[0], 2 /* GroupDirection.LEFT */, { activate: true });
                    let gettingStartedSize;
                    if (fullSize.width > 1600) {
                        gettingStartedSize = 800;
                    }
                    else if (fullSize.width > 800) {
                        gettingStartedSize = 400;
                    }
                    else {
                        gettingStartedSize = 350;
                    }
                    const gettingStartedGroup = this.groupsService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */).find(group => (group.activeEditor instanceof gettingStartedInput_1.GettingStartedInput));
                    this.groupsService.setSize((0, types_1.assertIsDefined)(gettingStartedGroup), { width: gettingStartedSize, height: fullSize.height });
                }
                const nonGettingStartedGroup = this.groupsService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */).find(group => !(group.activeEditor instanceof gettingStartedInput_1.GettingStartedInput));
                if (nonGettingStartedGroup) {
                    this.groupsService.activateGroup(nonGettingStartedGroup);
                    nonGettingStartedGroup.focus();
                }
            }
            if (isCommand) {
                const commandURI = uri_1.URI.parse(command);
                // execute as command
                let args = [];
                try {
                    args = (0, marshalling_1.parse)(decodeURIComponent(commandURI.query));
                }
                catch (_b) {
                    // ignore and retry
                    try {
                        args = (0, marshalling_1.parse)(commandURI.query);
                    }
                    catch (_c) {
                        // ignore error
                    }
                }
                if (!Array.isArray(args)) {
                    args = [args];
                }
                this.commandService.executeCommand(commandURI.path, ...args).then(result => {
                    const toOpen = result === null || result === void 0 ? void 0 : result.openFolder;
                    if (toOpen) {
                        if (!uri_1.URI.isUri(toOpen)) {
                            console.warn('Warn: Running walkthrough command', href, 'yielded non-URI `openFolder` result', toOpen, '. It will be disregarded.');
                            return;
                        }
                        const restoreData = { folder: toOpen.toString(), category: this.editorInput.selectedCategory, step: this.editorInput.selectedStep };
                        this.storageService.store(startupPage_1.restoreWalkthroughsConfigurationKey, JSON.stringify(restoreData), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
                        this.hostService.openWindow([{ folderUri: toOpen }]);
                    }
                });
            }
            else {
                this.openerService.open(command, { allowCommands: true });
            }
            if (!isCommand && (href.startsWith('https://') || href.startsWith('http://'))) {
                this.gettingStartedService.progressByEvent('onLink:' + href);
            }
        }
        buildStepMarkdownDescription(container, text) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            for (const linkedText of text) {
                if (linkedText.nodes.length === 1 && typeof linkedText.nodes[0] !== 'string') {
                    const node = linkedText.nodes[0];
                    const buttonContainer = (0, dom_1.append)(container, (0, dom_1.$)('.button-container'));
                    const button = new button_1.Button(buttonContainer, { title: node.title, supportIcons: true });
                    const isCommand = node.href.startsWith('command:');
                    const command = node.href.replace(/command:(toSide:)?/, 'command:');
                    button.label = node.label;
                    button.onDidClick(e => {
                        e.stopPropagation();
                        e.preventDefault();
                        this.runStepCommand(node.href);
                    }, null, this.detailsPageDisposables);
                    if (isCommand) {
                        const keybindingLabel = this.getKeybindingLabel(command);
                        if (keybindingLabel) {
                            container.appendChild((0, dom_1.$)('span.shortcut-message', {}, 'Tip: Use keyboard shortcut ', (0, dom_1.$)('span.keybinding', {}, keybindingLabel)));
                        }
                    }
                    this.detailsPageDisposables.add(button);
                    this.detailsPageDisposables.add((0, styler_1.attachButtonStyler)(button, this.themeService));
                }
                else {
                    const p = (0, dom_1.append)(container, (0, dom_1.$)('p'));
                    for (const node of linkedText.nodes) {
                        if (typeof node === 'string') {
                            (0, dom_1.append)(p, (0, formattedTextRenderer_1.renderFormattedText)(node, { inline: true, renderCodeSegments: true }));
                        }
                        else {
                            const link = this.instantiationService.createInstance(link_1.Link, p, node, { opener: (href) => this.runStepCommand(href) });
                            this.detailsPageDisposables.add(link);
                        }
                    }
                }
            }
            return container;
        }
        clearInput() {
            this.stepDisposables.clear();
            super.clearInput();
        }
        buildCategorySlide(categoryID, selectedStep) {
            var _a, _b;
            if (this.detailsScrollbar) {
                this.detailsScrollbar.dispose();
            }
            this.extensionService.whenInstalledExtensionsRegistered().then(() => {
                // Remove internal extension id specifier from exposed id's
                this.extensionService.activateByEvent(`onWalkthrough:${categoryID.replace(/[^#]+#/, '')}`);
            });
            this.detailsPageDisposables.clear();
            const category = this.gettingStartedCategories.find(category => category.id === categoryID);
            if (!category) {
                throw Error('could not find category with ID ' + categoryID);
            }
            const categoryDescriptorComponent = (0, dom_1.$)('.getting-started-category', {}, this.iconWidgetFor(category), (0, dom_1.$)('.category-description-container', {}, (0, dom_1.$)('h2.category-title.max-lines-3', { 'x-category-title-for': category.id }, category.title), (0, dom_1.$)('.category-description.description.max-lines-3', { 'x-category-description-for': category.id }, category.description)));
            const stepListContainer = (0, dom_1.$)('.step-list-container');
            this.detailsPageDisposables.add((0, dom_1.addDisposableListener)(stepListContainer, 'keydown', (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                const currentStepIndex = () => category.steps.findIndex(e => e.id === this.editorInput.selectedStep);
                if (event.keyCode === 16 /* KeyCode.UpArrow */) {
                    const toExpand = category.steps.filter((step, index) => index < currentStepIndex() && this.contextService.contextMatchesRules(step.when));
                    if (toExpand.length) {
                        this.selectStep(toExpand[toExpand.length - 1].id, false, false);
                    }
                }
                if (event.keyCode === 18 /* KeyCode.DownArrow */) {
                    const toExpand = category.steps.find((step, index) => index > currentStepIndex() && this.contextService.contextMatchesRules(step.when));
                    if (toExpand) {
                        this.selectStep(toExpand.id, false, false);
                    }
                }
            }));
            let renderedSteps = undefined;
            const contextKeysToWatch = new Set(category.steps.flatMap(step => step.when.keys()));
            const buildStepList = () => {
                const toRender = category.steps
                    .filter(step => this.contextService.contextMatchesRules(step.when));
                if ((0, arrays_1.equals)(renderedSteps, toRender, (a, b) => a.id === b.id)) {
                    return;
                }
                renderedSteps = toRender;
                (0, dom_1.reset)(stepListContainer, ...renderedSteps
                    .map(step => {
                    const codicon = (0, dom_1.$)('.codicon' + (step.done ? '.complete' + themeService_1.ThemeIcon.asCSSSelector(gettingStartedIcons_1.gettingStartedCheckedCodicon) : themeService_1.ThemeIcon.asCSSSelector(gettingStartedIcons_1.gettingStartedUncheckedCodicon)), {
                        'data-done-step-id': step.id,
                        'x-dispatch': 'toggleStepCompletion:' + step.id,
                    });
                    const container = (0, dom_1.$)('.step-description-container', { 'x-step-description-for': step.id });
                    this.buildStepMarkdownDescription(container, step.description);
                    const stepDescription = (0, dom_1.$)('.step-container', {}, (0, dom_1.$)('h3.step-title.max-lines-3', { 'x-step-title-for': step.id }, step.title), container);
                    if (step.media.type === 'image') {
                        stepDescription.appendChild((0, dom_1.$)('.image-description', { 'aria-label': (0, nls_1.localize)('imageShowing', "Image showing {0}", step.media.altText) }));
                    }
                    return (0, dom_1.$)('button.getting-started-step', {
                        'x-dispatch': 'selectTask:' + step.id,
                        'data-step-id': step.id,
                        'aria-expanded': 'false',
                        'aria-checked': '' + step.done,
                        'role': 'button',
                    }, codicon, stepDescription);
                }));
            };
            buildStepList();
            this.detailsPageDisposables.add(this.contextService.onDidChangeContext(e => {
                if (e.affectsSome(contextKeysToWatch)) {
                    buildStepList();
                    this.registerDispatchListeners();
                    this.selectStep(this.editorInput.selectedStep, false, true);
                }
            }));
            const showNextCategory = this.gettingStartedCategories.find(_category => _category.id === category.next);
            const stepsContainer = (0, dom_1.$)('.getting-started-detail-container', { 'role': 'list' }, stepListContainer, (0, dom_1.$)('.done-next-container', {}, (0, dom_1.$)('button.button-link.all-done', { 'x-dispatch': 'allDone' }, (0, dom_1.$)('span.codicon.codicon-check-all'), (0, nls_1.localize)('allDone', "Mark Done")), ...(showNextCategory
                ? [(0, dom_1.$)('button.button-link.next', { 'x-dispatch': 'nextSection' }, (0, nls_1.localize)('nextOne', "Next Section"), (0, dom_1.$)('span.codicon.codicon-arrow-small-right'))]
                : [])));
            this.detailsScrollbar = this._register(new scrollableElement_1.DomScrollableElement(stepsContainer, { className: 'steps-container' }));
            const stepListComponent = this.detailsScrollbar.getDomNode();
            const categoryFooter = (0, dom_1.$)('.getting-started-footer');
            if (this.editorInput.showTelemetryNotice && (0, telemetryUtils_1.getTelemetryLevel)(this.configurationService) !== 0 /* TelemetryLevel.NONE */ && this.productService.enableTelemetry) {
                this.buildTelemetryFooter(categoryFooter);
            }
            (0, dom_1.reset)(this.stepsContent, categoryDescriptorComponent, stepListComponent, this.stepMediaComponent, categoryFooter);
            const toExpand = (_a = category.steps.find(step => this.contextService.contextMatchesRules(step.when) && !step.done)) !== null && _a !== void 0 ? _a : category.steps[0];
            this.selectStep(selectedStep !== null && selectedStep !== void 0 ? selectedStep : toExpand.id, !selectedStep, true);
            this.detailsScrollbar.scanDomNode();
            (_b = this.detailsPageScrollbar) === null || _b === void 0 ? void 0 : _b.scanDomNode();
            this.registerDispatchListeners();
        }
        buildTelemetryFooter(parent) {
            const mdRenderer = this.instantiationService.createInstance(markdownRenderer_1.MarkdownRenderer, {});
            const privacyStatementCopy = (0, nls_1.localize)('privacy statement', "privacy statement");
            const privacyStatementButton = `[${privacyStatementCopy}](command:workbench.action.openPrivacyStatementUrl)`;
            const optOutCopy = (0, nls_1.localize)('optOut', "opt out");
            const optOutButton = `[${optOutCopy}](command:settings.filterByTelemetry)`;
            const text = (0, nls_1.localize)({ key: 'footer', comment: ['fist substitution is "vs code", second is "privacy statement", third is "opt out".'] }, "{0} collects usage data. Read our {1} and learn how to {2}.", this.productService.nameShort, privacyStatementButton, optOutButton);
            parent.append(mdRenderer.render({ value: text, isTrusted: true }).element);
            mdRenderer.dispose();
        }
        getKeybindingLabel(command) {
            var _a;
            command = command.replace(/^command:/, '');
            const label = (_a = this.keybindingService.lookupKeybinding(command)) === null || _a === void 0 ? void 0 : _a.getLabel();
            if (!label) {
                return '';
            }
            else {
                return `(${label})`;
            }
        }
        async scrollPrev() {
            this.inProgressScroll = this.inProgressScroll.then(async () => {
                this.currentWalkthrough = undefined;
                this.editorInput.selectedCategory = undefined;
                this.editorInput.selectedStep = undefined;
                this.editorInput.showTelemetryNotice = false;
                this.selectStep(undefined);
                this.setSlide('categories');
                this.container.focus();
            });
        }
        runSkip() {
            this.commandService.executeCommand('workbench.action.closeActiveEditor');
        }
        escape() {
            if (this.editorInput.selectedCategory) {
                this.scrollPrev();
            }
            else {
                this.runSkip();
            }
        }
        setSlide(toEnable) {
            const slideManager = (0, types_1.assertIsDefined)(this.container.querySelector('.gettingStarted'));
            if (toEnable === 'categories') {
                slideManager.classList.remove('showDetails');
                slideManager.classList.add('showCategories');
                this.container.querySelector('.gettingStartedSlideDetails').querySelectorAll('button').forEach(button => button.disabled = true);
                this.container.querySelector('.gettingStartedSlideCategories').querySelectorAll('button').forEach(button => button.disabled = false);
                this.container.querySelector('.gettingStartedSlideCategories').querySelectorAll('input').forEach(button => button.disabled = false);
            }
            else {
                slideManager.classList.add('showDetails');
                slideManager.classList.remove('showCategories');
                this.container.querySelector('.gettingStartedSlideDetails').querySelectorAll('button').forEach(button => button.disabled = false);
                this.container.querySelector('.gettingStartedSlideCategories').querySelectorAll('button').forEach(button => button.disabled = true);
                this.container.querySelector('.gettingStartedSlideCategories').querySelectorAll('input').forEach(button => button.disabled = true);
            }
        }
        focus() {
            this.container.focus();
        }
    };
    GettingStartedPage.ID = 'gettingStartedPage';
    GettingStartedPage = __decorate([
        __param(0, commands_1.ICommandService),
        __param(1, productService_1.IProductService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, gettingStartedService_1.IWalkthroughsService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, language_1.ILanguageService),
        __param(7, files_1.IFileService),
        __param(8, opener_1.IOpenerService),
        __param(9, themeService_1.IThemeService),
        __param(10, storage_1.IStorageService),
        __param(11, extensions_1.IExtensionService),
        __param(12, instantiation_1.IInstantiationService),
        __param(13, notification_1.INotificationService),
        __param(14, editorGroupsService_1.IEditorGroupsService),
        __param(15, contextkey_1.IContextKeyService),
        __param(16, quickInput_1.IQuickInputService),
        __param(17, workspaces_1.IWorkspacesService),
        __param(18, label_1.ILabelService),
        __param(19, host_1.IHostService),
        __param(20, webview_1.IWebviewService),
        __param(21, workspace_1.IWorkspaceContextService),
        __param(22, accessibility_1.IAccessibilityService)
    ], GettingStartedPage);
    exports.GettingStartedPage = GettingStartedPage;
    class GettingStartedInputSerializer {
        canSerialize(editorInput) {
            return true;
        }
        serialize(editorInput) {
            return JSON.stringify({ selectedCategory: editorInput.selectedCategory, selectedStep: editorInput.selectedStep });
        }
        deserialize(instantiationService, serializedEditorInput) {
            try {
                const { selectedCategory, selectedStep } = JSON.parse(serializedEditorInput);
                return new gettingStartedInput_1.GettingStartedInput({ selectedCategory, selectedStep });
            }
            catch (_a) { }
            return new gettingStartedInput_1.GettingStartedInput({});
        }
    }
    exports.GettingStartedInputSerializer = GettingStartedInputSerializer;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const backgroundColor = theme.getColor(gettingStartedColors_1.welcomePageBackground);
        if (backgroundColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer { background-color: ${backgroundColor}; }`);
        }
        const foregroundColor = theme.getColor(colorRegistry_1.foreground);
        if (foregroundColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer { color: ${foregroundColor}; }`);
        }
        const descriptionColor = theme.getColor(colorRegistry_1.descriptionForeground);
        if (descriptionColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer .description { color: ${descriptionColor}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer .category-progress .message { color: ${descriptionColor}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer .gettingStartedSlideDetails .gettingStartedDetailsContent > .getting-started-footer { color: ${descriptionColor}; }`);
        }
        const iconColor = theme.getColor(colorRegistry_1.textLinkForeground);
        if (iconColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer .getting-started-category .codicon:not(.codicon-close) { color: ${iconColor} }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer .gettingStartedSlideDetails .getting-started-step .codicon.complete { color: ${iconColor} } `);
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer .gettingStartedSlideDetails .getting-started-step.expanded .codicon { color: ${iconColor} } `);
        }
        const buttonColor = theme.getColor(gettingStartedColors_1.welcomePageTileBackground);
        if (buttonColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer button { background: ${buttonColor}; }`);
        }
        const shadowColor = theme.getColor(gettingStartedColors_1.welcomePageTileShadow);
        if (shadowColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer .gettingStartedSlideCategories .getting-started-category { filter: drop-shadow(2px 2px 2px ${buttonColor}); }`);
        }
        const buttonHoverColor = theme.getColor(gettingStartedColors_1.welcomePageTileHoverBackground);
        if (buttonHoverColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer button:hover { background: ${buttonHoverColor}; }`);
        }
        if (buttonColor && buttonHoverColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer button.expanded:hover { background: ${buttonColor}; }`);
        }
        const emphasisButtonForeground = theme.getColor(colorRegistry_1.buttonForeground);
        if (emphasisButtonForeground) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer button.emphasis { color: ${emphasisButtonForeground}; }`);
        }
        const emphasisButtonBackground = theme.getColor(colorRegistry_1.buttonBackground);
        if (emphasisButtonBackground) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer button.emphasis { background: ${emphasisButtonBackground}; }`);
        }
        const pendingStepColor = theme.getColor(colorRegistry_1.descriptionForeground);
        if (pendingStepColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer .gettingStartedSlideDetails .getting-started-step .codicon { color: ${pendingStepColor} } `);
        }
        const emphasisButtonHoverBackground = theme.getColor(colorRegistry_1.buttonHoverBackground);
        if (emphasisButtonHoverBackground) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer button.emphasis:hover { background: ${emphasisButtonHoverBackground}; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer a:not(.hide-category-button) { color: ${link}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer .button-link { color: ${link}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer .button-link .codicon { color: ${link}; }`);
        }
        const activeLink = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (activeLink) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer a:not(.hide-category-button):hover { color: ${activeLink}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer a:not(.hide-category-button):active { color: ${activeLink}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer button.button-link:hover { color: ${activeLink}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer button.button-link:hover .codicon { color: ${activeLink}; }`);
        }
        const focusColor = theme.getColor(colorRegistry_1.focusBorder);
        if (focusColor) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer a:not(.codicon-close):focus { outline-color: ${focusColor}; }`);
        }
        const border = theme.getColor(colorRegistry_1.contrastBorder);
        if (border) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer button { border: 1px solid ${border}; }`);
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer button.button-link { border: inherit; }`);
        }
        const activeBorder = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (activeBorder) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer button:hover { outline-color: ${activeBorder}; }`);
        }
        const progressBackground = theme.getColor(gettingStartedColors_1.welcomePageProgressBackground);
        if (progressBackground) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer .gettingStartedSlideCategories .progress-bar-outer { background-color: ${progressBackground}; }`);
        }
        const progressForeground = theme.getColor(gettingStartedColors_1.welcomePageProgressForeground);
        if (progressForeground) {
            collector.addRule(`.monaco-workbench .part.editor > .content .gettingStartedContainer .gettingStartedSlideCategories .progress-bar-inner { background-color: ${progressForeground}; }`);
        }
        const newBadgeForeground = theme.getColor(theme_1.ACTIVITY_BAR_BADGE_FOREGROUND);
        if (newBadgeForeground) {
            collector.addRule(`.monaco-workbench .part.editor>.content .gettingStartedContainer .gettingStartedSlide .getting-started-category .new-badge { color: ${newBadgeForeground}; }`);
            collector.addRule(`.monaco-workbench .part.editor>.content .gettingStartedContainer .gettingStartedSlide .getting-started-category .featured .featured-icon { color: ${newBadgeForeground}; }`);
        }
        const newBadgeBackground = theme.getColor(theme_1.ACTIVITY_BAR_BADGE_BACKGROUND);
        if (newBadgeBackground) {
            collector.addRule(`.monaco-workbench .part.editor>.content .gettingStartedContainer .gettingStartedSlide .getting-started-category .new-badge { background-color: ${newBadgeBackground}; }`);
            collector.addRule(`.monaco-workbench .part.editor>.content .gettingStartedContainer .gettingStartedSlide .getting-started-category .featured { border-top-color: ${newBadgeBackground}; }`);
        }
        const checkboxBackgroundColor = theme.getColor(colorRegistry_1.checkboxBackground);
        if (checkboxBackgroundColor) {
            collector.addRule(`.monaco-workbench .part.editor>.content .gettingStartedContainer .gettingStartedSlide .getting-started-checkbox { background-color: ${checkboxBackgroundColor} !important; }`);
        }
        const checkboxForegroundColor = theme.getColor(colorRegistry_1.checkboxForeground);
        if (checkboxForegroundColor) {
            collector.addRule(`.monaco-workbench .part.editor>.content .gettingStartedContainer .gettingStartedSlide .getting-started-checkbox { color: ${checkboxForegroundColor} !important; }`);
        }
        const checkboxBorderColor = theme.getColor(colorRegistry_1.checkboxBorder);
        if (checkboxBorderColor) {
            collector.addRule(`.monaco-workbench .part.editor>.content .gettingStartedContainer .gettingStartedSlide .getting-started-checkbox { border-color: ${checkboxBorderColor} !important; }`);
        }
    });
});
//# sourceMappingURL=gettingStarted.js.map