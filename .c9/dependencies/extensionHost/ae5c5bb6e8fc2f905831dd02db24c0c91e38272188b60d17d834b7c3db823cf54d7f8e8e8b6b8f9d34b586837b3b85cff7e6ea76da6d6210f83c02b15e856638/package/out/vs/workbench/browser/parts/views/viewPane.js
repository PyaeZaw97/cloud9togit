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
define(["require", "exports", "vs/nls", "vs/base/common/event", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/workbench/common/theme", "vs/base/browser/dom", "vs/base/common/lifecycle", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/registry/common/platform", "vs/base/browser/ui/toolbar/toolbar", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/base/browser/ui/splitview/paneview", "vs/platform/configuration/common/configuration", "vs/workbench/common/views", "vs/platform/contextkey/common/contextkey", "vs/base/common/types", "vs/platform/instantiation/common/instantiation", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/base/common/linkedText", "vs/platform/opener/common/opener", "vs/base/browser/ui/button/button", "vs/platform/opener/browser/link", "vs/base/browser/ui/progressbar/progressbar", "vs/workbench/services/progress/browser/progressIndicator", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/uri", "vs/platform/theme/common/iconRegistry", "vs/base/common/codicons", "vs/workbench/browser/actions", "vs/css!./media/paneviewlet"], function (require, exports, nls, event_1, colorRegistry_1, styler_1, theme_1, dom_1, lifecycle_1, actionbar_1, platform_1, toolbar_1, keybinding_1, contextView_1, telemetry_1, themeService_1, paneview_1, configuration_1, views_1, contextkey_1, types_1, instantiation_1, actions_1, menuEntryActionViewItem_1, linkedText_1, opener_1, button_1, link_1, progressbar_1, progressIndicator_1, scrollableElement_1, uri_1, iconRegistry_1, codicons_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ViewAction = exports.ViewPane = void 0;
    const viewPaneContainerExpandedIcon = (0, iconRegistry_1.registerIcon)('view-pane-container-expanded', codicons_1.Codicon.chevronDown, nls.localize('viewPaneContainerExpandedIcon', 'Icon for an expanded view pane container.'));
    const viewPaneContainerCollapsedIcon = (0, iconRegistry_1.registerIcon)('view-pane-container-collapsed', codicons_1.Codicon.chevronRight, nls.localize('viewPaneContainerCollapsedIcon', 'Icon for a collapsed view pane container.'));
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    let ViewWelcomeController = class ViewWelcomeController {
        constructor(id, contextKeyService) {
            this.id = id;
            this.contextKeyService = contextKeyService;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this.items = [];
            this.disposables = new lifecycle_1.DisposableStore();
            contextKeyService.onDidChangeContext(this.onDidChangeContext, this, this.disposables);
            event_1.Event.filter(viewsRegistry.onDidChangeViewWelcomeContent, id => id === this.id)(this.onDidChangeViewWelcomeContent, this, this.disposables);
            this.onDidChangeViewWelcomeContent();
        }
        get contents() {
            const visibleItems = this.items.filter(v => v.visible);
            if (visibleItems.length === 0 && this.defaultItem) {
                return [this.defaultItem.descriptor];
            }
            return visibleItems.map(v => v.descriptor);
        }
        onDidChangeViewWelcomeContent() {
            const descriptors = viewsRegistry.getViewWelcomeContent(this.id);
            this.items = [];
            for (const descriptor of descriptors) {
                if (descriptor.when === 'default') {
                    this.defaultItem = { descriptor, visible: true };
                }
                else {
                    const visible = descriptor.when ? this.contextKeyService.contextMatchesRules(descriptor.when) : true;
                    this.items.push({ descriptor, visible });
                }
            }
            this._onDidChange.fire();
        }
        onDidChangeContext() {
            let didChange = false;
            for (const item of this.items) {
                if (!item.descriptor.when || item.descriptor.when === 'default') {
                    continue;
                }
                const visible = this.contextKeyService.contextMatchesRules(item.descriptor.when);
                if (item.visible === visible) {
                    continue;
                }
                item.visible = visible;
                didChange = true;
            }
            if (didChange) {
                this._onDidChange.fire();
            }
        }
        dispose() {
            this.disposables.dispose();
        }
    };
    ViewWelcomeController = __decorate([
        __param(1, contextkey_1.IContextKeyService)
    ], ViewWelcomeController);
    let ViewMenuActions = class ViewMenuActions extends actions_2.CompositeMenuActions {
        constructor(element, viewId, menuId, contextMenuId, donotForwardArgs, contextKeyService, menuService, viewDescriptorService) {
            const scopedContextKeyService = contextKeyService.createScoped(element);
            scopedContextKeyService.createKey('view', viewId);
            const viewLocationKey = scopedContextKeyService.createKey('viewLocation', (0, views_1.ViewContainerLocationToString)(viewDescriptorService.getViewLocationById(viewId)));
            super(menuId, contextMenuId, { shouldForwardArgs: !donotForwardArgs }, scopedContextKeyService, menuService);
            this._register(scopedContextKeyService);
            this._register(event_1.Event.filter(viewDescriptorService.onDidChangeLocation, e => e.views.some(view => view.id === viewId))(() => viewLocationKey.set((0, views_1.ViewContainerLocationToString)(viewDescriptorService.getViewLocationById(viewId)))));
        }
    };
    ViewMenuActions = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, actions_1.IMenuService),
        __param(7, views_1.IViewDescriptorService)
    ], ViewMenuActions);
    let ViewPane = class ViewPane extends paneview_1.Pane {
        constructor(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService) {
            super(Object.assign(Object.assign({}, options), { orientation: viewDescriptorService.getViewLocationById(options.id) === 1 /* ViewContainerLocation.Panel */ ? 1 /* Orientation.HORIZONTAL */ : 0 /* Orientation.VERTICAL */ }));
            this.keybindingService = keybindingService;
            this.contextMenuService = contextMenuService;
            this.configurationService = configurationService;
            this.contextKeyService = contextKeyService;
            this.viewDescriptorService = viewDescriptorService;
            this.instantiationService = instantiationService;
            this.openerService = openerService;
            this.themeService = themeService;
            this.telemetryService = telemetryService;
            this._onDidFocus = this._register(new event_1.Emitter());
            this.onDidFocus = this._onDidFocus.event;
            this._onDidBlur = this._register(new event_1.Emitter());
            this.onDidBlur = this._onDidBlur.event;
            this._onDidChangeBodyVisibility = this._register(new event_1.Emitter());
            this.onDidChangeBodyVisibility = this._onDidChangeBodyVisibility.event;
            this._onDidChangeTitleArea = this._register(new event_1.Emitter());
            this.onDidChangeTitleArea = this._onDidChangeTitleArea.event;
            this._onDidChangeViewWelcomeState = this._register(new event_1.Emitter());
            this.onDidChangeViewWelcomeState = this._onDidChangeViewWelcomeState.event;
            this._isVisible = false;
            this.showActionsAlways = false;
            this.viewWelcomeDisposable = lifecycle_1.Disposable.None;
            this.id = options.id;
            this._title = options.title;
            this._titleDescription = options.titleDescription;
            this.showActionsAlways = !!options.showActionsAlways;
            this.menuActions = this._register(this.instantiationService.createInstance(ViewMenuActions, this.element, this.id, options.titleMenuId || actions_1.MenuId.ViewTitle, actions_1.MenuId.ViewTitleContext, !!options.donotForwardArgs));
            this._register(this.menuActions.onDidChange(() => this.updateActions()));
            this.viewWelcomeController = new ViewWelcomeController(this.id, contextKeyService);
        }
        get title() {
            return this._title;
        }
        get titleDescription() {
            return this._titleDescription;
        }
        get headerVisible() {
            return super.headerVisible;
        }
        set headerVisible(visible) {
            super.headerVisible = visible;
            this.element.classList.toggle('merged-header', !visible);
        }
        setVisible(visible) {
            if (this._isVisible !== visible) {
                this._isVisible = visible;
                if (this.isExpanded()) {
                    this._onDidChangeBodyVisibility.fire(visible);
                }
            }
        }
        isVisible() {
            return this._isVisible;
        }
        isBodyVisible() {
            return this._isVisible && this.isExpanded();
        }
        setExpanded(expanded) {
            const changed = super.setExpanded(expanded);
            if (changed) {
                this._onDidChangeBodyVisibility.fire(expanded);
            }
            if (this.twistiesContainer) {
                this.twistiesContainer.classList.remove(...themeService_1.ThemeIcon.asClassNameArray(this.getTwistyIcon(!expanded)));
                this.twistiesContainer.classList.add(...themeService_1.ThemeIcon.asClassNameArray(this.getTwistyIcon(expanded)));
            }
            return changed;
        }
        render() {
            super.render();
            const focusTracker = (0, dom_1.trackFocus)(this.element);
            this._register(focusTracker);
            this._register(focusTracker.onDidFocus(() => this._onDidFocus.fire()));
            this._register(focusTracker.onDidBlur(() => this._onDidBlur.fire()));
        }
        renderHeader(container) {
            this.headerContainer = container;
            this.twistiesContainer = (0, dom_1.append)(container, (0, dom_1.$)(themeService_1.ThemeIcon.asCSSSelector(this.getTwistyIcon(this.isExpanded()))));
            this.renderHeaderTitle(container, this.title);
            const actions = (0, dom_1.append)(container, (0, dom_1.$)('.actions'));
            actions.classList.toggle('show', this.showActionsAlways);
            this.toolbar = new toolbar_1.ToolBar(actions, this.contextMenuService, {
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                actionViewItemProvider: action => this.getActionViewItem(action),
                ariaLabel: nls.localize('viewToolbarAriaLabel', "{0} actions", this.title),
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                renderDropdownAsChildElement: true
            });
            this._register(this.toolbar);
            this.setActions();
            this._register((0, dom_1.addDisposableListener)(actions, dom_1.EventType.CLICK, e => e.preventDefault()));
            this._register(this.viewDescriptorService.getViewContainerModel(this.viewDescriptorService.getViewContainerByViewId(this.id)).onDidChangeContainerInfo(({ title }) => {
                this.updateTitle(this.title);
            }));
            const onDidRelevantConfigurationChange = event_1.Event.filter(this.configurationService.onDidChangeConfiguration, e => e.affectsConfiguration(ViewPane.AlwaysShowActionsConfig));
            this._register(onDidRelevantConfigurationChange(this.updateActionsVisibility, this));
            this.updateActionsVisibility();
        }
        getTwistyIcon(expanded) {
            return expanded ? viewPaneContainerExpandedIcon : viewPaneContainerCollapsedIcon;
        }
        style(styles) {
            super.style(styles);
            const icon = this.getIcon();
            if (this.iconContainer) {
                const fgColor = styles.headerForeground || this.themeService.getColorTheme().getColor(colorRegistry_1.foreground);
                if (uri_1.URI.isUri(icon)) {
                    // Apply background color to activity bar item provided with iconUrls
                    this.iconContainer.style.backgroundColor = fgColor ? fgColor.toString() : '';
                    this.iconContainer.style.color = '';
                }
                else {
                    // Apply foreground color to activity bar items provided with codicons
                    this.iconContainer.style.color = fgColor ? fgColor.toString() : '';
                    this.iconContainer.style.backgroundColor = '';
                }
            }
        }
        getIcon() {
            var _a;
            return ((_a = this.viewDescriptorService.getViewDescriptorById(this.id)) === null || _a === void 0 ? void 0 : _a.containerIcon) || views_1.defaultViewIcon;
        }
        renderHeaderTitle(container, title) {
            this.iconContainer = (0, dom_1.append)(container, (0, dom_1.$)('.icon', undefined));
            const icon = this.getIcon();
            let cssClass = undefined;
            if (uri_1.URI.isUri(icon)) {
                cssClass = `view-${this.id.replace(/[\.\:]/g, '-')}`;
                const iconClass = `.pane-header .icon.${cssClass}`;
                (0, dom_1.createCSSRule)(iconClass, `
				mask: ${(0, dom_1.asCSSUrl)(icon)} no-repeat 50% 50%;
				mask-size: 24px;
				-webkit-mask: ${(0, dom_1.asCSSUrl)(icon)} no-repeat 50% 50%;
				-webkit-mask-size: 16px;
			`);
            }
            else if (themeService_1.ThemeIcon.isThemeIcon(icon)) {
                cssClass = themeService_1.ThemeIcon.asClassName(icon);
            }
            if (cssClass) {
                this.iconContainer.classList.add(...cssClass.split(' '));
            }
            const calculatedTitle = this.calculateTitle(title);
            this.titleContainer = (0, dom_1.append)(container, (0, dom_1.$)('h3.title', { title: calculatedTitle }, calculatedTitle));
            if (this._titleDescription) {
                this.setTitleDescription(this._titleDescription);
            }
            this.iconContainer.title = calculatedTitle;
            this.iconContainer.setAttribute('aria-label', calculatedTitle);
        }
        updateTitle(title) {
            const calculatedTitle = this.calculateTitle(title);
            if (this.titleContainer) {
                this.titleContainer.textContent = calculatedTitle;
                this.titleContainer.setAttribute('title', calculatedTitle);
            }
            if (this.iconContainer) {
                this.iconContainer.title = calculatedTitle;
                this.iconContainer.setAttribute('aria-label', calculatedTitle);
            }
            this._title = title;
            this._onDidChangeTitleArea.fire();
        }
        setTitleDescription(description) {
            if (this.titleDescriptionContainer) {
                this.titleDescriptionContainer.textContent = description !== null && description !== void 0 ? description : '';
                this.titleDescriptionContainer.setAttribute('title', description !== null && description !== void 0 ? description : '');
            }
            else if (description && this.titleContainer) {
                this.titleDescriptionContainer = (0, dom_1.after)(this.titleContainer, (0, dom_1.$)('span.description', { title: description }, description));
            }
        }
        updateTitleDescription(description) {
            this.setTitleDescription(description);
            this._titleDescription = description;
            this._onDidChangeTitleArea.fire();
        }
        calculateTitle(title) {
            const viewContainer = this.viewDescriptorService.getViewContainerByViewId(this.id);
            const model = this.viewDescriptorService.getViewContainerModel(viewContainer);
            const viewDescriptor = this.viewDescriptorService.getViewDescriptorById(this.id);
            const isDefault = this.viewDescriptorService.getDefaultContainerById(this.id) === viewContainer;
            if (!isDefault && (viewDescriptor === null || viewDescriptor === void 0 ? void 0 : viewDescriptor.containerTitle) && model.title !== viewDescriptor.containerTitle) {
                return `${viewDescriptor.containerTitle}: ${title}`;
            }
            return title;
        }
        renderBody(container) {
            this.bodyContainer = container;
            const viewWelcomeContainer = (0, dom_1.append)(container, (0, dom_1.$)('.welcome-view'));
            this.viewWelcomeContainer = (0, dom_1.$)('.welcome-view-content', { tabIndex: 0 });
            this.scrollableElement = this._register(new scrollableElement_1.DomScrollableElement(this.viewWelcomeContainer, {
                alwaysConsumeMouseWheel: true,
                horizontal: 2 /* ScrollbarVisibility.Hidden */,
                vertical: 3 /* ScrollbarVisibility.Visible */,
            }));
            (0, dom_1.append)(viewWelcomeContainer, this.scrollableElement.getDomNode());
            const onViewWelcomeChange = event_1.Event.any(this.viewWelcomeController.onDidChange, this.onDidChangeViewWelcomeState);
            this._register(onViewWelcomeChange(this.updateViewWelcome, this));
            this.updateViewWelcome();
        }
        layoutBody(height, width) {
            this.viewWelcomeContainer.style.height = `${height}px`;
            this.viewWelcomeContainer.style.width = `${width}px`;
            this.viewWelcomeContainer.classList.toggle('wide', width > 640);
            this.scrollableElement.scanDomNode();
        }
        onDidScrollRoot() {
            // noop
        }
        getProgressIndicator() {
            if (this.progressBar === undefined) {
                // Progress bar
                this.progressBar = this._register(new progressbar_1.ProgressBar(this.element));
                this._register((0, styler_1.attachProgressBarStyler)(this.progressBar, this.themeService));
                this.progressBar.hide();
            }
            if (this.progressIndicator === undefined) {
                this.progressIndicator = this.instantiationService.createInstance(progressIndicator_1.CompositeProgressIndicator, (0, types_1.assertIsDefined)(this.progressBar), this.id, this.isBodyVisible());
            }
            return this.progressIndicator;
        }
        getProgressLocation() {
            return this.viewDescriptorService.getViewContainerByViewId(this.id).id;
        }
        getBackgroundColor() {
            switch (this.viewDescriptorService.getViewLocationById(this.id)) {
                case 1 /* ViewContainerLocation.Panel */:
                    return theme_1.PANEL_BACKGROUND;
                case 0 /* ViewContainerLocation.Sidebar */:
                case 2 /* ViewContainerLocation.AuxiliaryBar */:
                    return theme_1.SIDE_BAR_BACKGROUND;
            }
            return theme_1.SIDE_BAR_BACKGROUND;
        }
        focus() {
            if (this.shouldShowWelcome()) {
                this.viewWelcomeContainer.focus();
            }
            else if (this.element) {
                this.element.focus();
                this._onDidFocus.fire();
            }
        }
        setActions() {
            if (this.toolbar) {
                this.toolbar.setActions((0, actionbar_1.prepareActions)(this.menuActions.getPrimaryActions()), (0, actionbar_1.prepareActions)(this.menuActions.getSecondaryActions()));
                this.toolbar.context = this.getActionsContext();
            }
        }
        updateActionsVisibility() {
            if (!this.headerContainer) {
                return;
            }
            const shouldAlwaysShowActions = this.configurationService.getValue('workbench.view.alwaysShowHeaderActions');
            this.headerContainer.classList.toggle('actions-always-visible', shouldAlwaysShowActions);
        }
        updateActions() {
            this.setActions();
            this._onDidChangeTitleArea.fire();
        }
        getActionViewItem(action, options) {
            return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action, Object.assign(Object.assign({}, options), { menuAsChild: action instanceof actions_1.SubmenuItemAction }));
        }
        getActionsContext() {
            return undefined;
        }
        getOptimalWidth() {
            return 0;
        }
        saveState() {
            // Subclasses to implement for saving state
        }
        updateViewWelcome() {
            this.viewWelcomeDisposable.dispose();
            if (!this.shouldShowWelcome()) {
                this.bodyContainer.classList.remove('welcome');
                this.viewWelcomeContainer.innerText = '';
                this.scrollableElement.scanDomNode();
                return;
            }
            const contents = this.viewWelcomeController.contents;
            if (contents.length === 0) {
                this.bodyContainer.classList.remove('welcome');
                this.viewWelcomeContainer.innerText = '';
                this.scrollableElement.scanDomNode();
                return;
            }
            const disposables = new lifecycle_1.DisposableStore();
            this.bodyContainer.classList.add('welcome');
            this.viewWelcomeContainer.innerText = '';
            for (const { content, precondition } of contents) {
                const lines = content.split('\n');
                for (let line of lines) {
                    line = line.trim();
                    if (!line) {
                        continue;
                    }
                    const linkedText = (0, linkedText_1.parseLinkedText)(line);
                    if (linkedText.nodes.length === 1 && typeof linkedText.nodes[0] !== 'string') {
                        const node = linkedText.nodes[0];
                        const buttonContainer = (0, dom_1.append)(this.viewWelcomeContainer, (0, dom_1.$)('.button-container'));
                        const button = new button_1.Button(buttonContainer, { title: node.title, supportIcons: true });
                        button.label = node.label;
                        button.onDidClick(_ => {
                            this.telemetryService.publicLog2('views.welcomeAction', { viewId: this.id, uri: node.href });
                            this.openerService.open(node.href, { allowCommands: true });
                        }, null, disposables);
                        disposables.add(button);
                        disposables.add((0, styler_1.attachButtonStyler)(button, this.themeService));
                        if (precondition) {
                            const updateEnablement = () => button.enabled = this.contextKeyService.contextMatchesRules(precondition);
                            updateEnablement();
                            const keys = new Set();
                            precondition.keys().forEach(key => keys.add(key));
                            const onDidChangeContext = event_1.Event.filter(this.contextKeyService.onDidChangeContext, e => e.affectsSome(keys));
                            onDidChangeContext(updateEnablement, null, disposables);
                        }
                    }
                    else {
                        const p = (0, dom_1.append)(this.viewWelcomeContainer, (0, dom_1.$)('p'));
                        for (const node of linkedText.nodes) {
                            if (typeof node === 'string') {
                                (0, dom_1.append)(p, document.createTextNode(node));
                            }
                            else {
                                const link = disposables.add(this.instantiationService.createInstance(link_1.Link, p, node, {}));
                                if (precondition && node.href.startsWith('command:')) {
                                    const updateEnablement = () => link.enabled = this.contextKeyService.contextMatchesRules(precondition);
                                    updateEnablement();
                                    const keys = new Set();
                                    precondition.keys().forEach(key => keys.add(key));
                                    const onDidChangeContext = event_1.Event.filter(this.contextKeyService.onDidChangeContext, e => e.affectsSome(keys));
                                    onDidChangeContext(updateEnablement, null, disposables);
                                }
                            }
                        }
                    }
                }
            }
            this.scrollableElement.scanDomNode();
            this.viewWelcomeDisposable = disposables;
        }
        shouldShowWelcome() {
            return false;
        }
    };
    ViewPane.AlwaysShowActionsConfig = 'workbench.view.alwaysShowHeaderActions';
    ViewPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, opener_1.IOpenerService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService)
    ], ViewPane);
    exports.ViewPane = ViewPane;
    class ViewAction extends actions_1.Action2 {
        constructor(desc) {
            super(desc);
            this.desc = desc;
        }
        run(accessor, ...args) {
            const view = accessor.get(views_1.IViewsService).getActiveViewWithId(this.desc.viewId);
            if (view) {
                return this.runInView(accessor, view, ...args);
            }
        }
    }
    exports.ViewAction = ViewAction;
});
//# sourceMappingURL=viewPane.js.map