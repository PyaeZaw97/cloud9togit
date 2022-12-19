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
define(["require", "exports", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/actions/common/actions", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/views", "vs/platform/configuration/common/configuration", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPane", "vs/platform/registry/common/platform", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/base/common/event", "vs/base/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/notification/common/notification", "vs/platform/progress/common/progress", "vs/workbench/services/extensions/common/extensions", "vs/platform/commands/common/commands", "vs/base/browser/dom", "vs/workbench/browser/labels", "vs/base/browser/ui/actionbar/actionbar", "vs/base/common/uri", "vs/base/common/resources", "vs/platform/files/common/files", "vs/platform/list/browser/listService", "vs/nls", "vs/base/common/async", "vs/platform/theme/common/colorRegistry", "vs/base/common/types", "vs/platform/label/common/label", "vs/base/browser/dnd", "vs/base/common/filters", "vs/base/browser/ui/tree/treeDefaults", "vs/base/common/strings", "vs/workbench/common/theme", "vs/workbench/services/hover/browser/hover", "vs/base/browser/ui/actionbar/actionViewItems", "vs/platform/theme/common/theme", "vs/base/browser/markdownRenderer", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/codicons", "vs/base/common/cancellation", "vs/base/common/errors", "vs/workbench/browser/dnd", "vs/base/common/network", "vs/workbench/services/views/browser/treeViewsService", "vs/base/common/uuid", "vs/platform/log/common/log", "vs/base/common/mime", "vs/workbench/services/activity/common/activity", "vs/workbench/services/themes/common/workbenchThemeService", "vs/css!./media/views"], function (require, exports, lifecycle_1, instantiation_1, keybinding_1, contextView_1, actions_1, contextkey_1, views_1, configuration_1, themeService_1, viewPane_1, platform_1, opener_1, telemetry_1, event_1, actions_2, menuEntryActionViewItem_1, notification_1, progress_1, extensions_1, commands_1, DOM, labels_1, actionbar_1, uri_1, resources_1, files_1, listService_1, nls_1, async_1, colorRegistry_1, types_1, label_1, dnd_1, filters_1, treeDefaults_1, strings_1, theme_1, hover_1, actionViewItems_1, theme_2, markdownRenderer_1, editorCommands_1, codicons_1, cancellation_1, errors_1, dnd_2, network_1, treeViewsService_1, uuid_1, log_1, mime_1, activity_1, workbenchThemeService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CustomTreeViewDragAndDrop = exports.TreeView = exports.CustomTreeView = exports.RawCustomTreeViewContextKey = exports.TreeViewPane = void 0;
    let TreeViewPane = class TreeViewPane extends viewPane_1.ViewPane {
        constructor(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService) {
            super(Object.assign(Object.assign({}, options), { titleMenuId: actions_1.MenuId.ViewTitle, donotForwardArgs: true }), keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            const { treeView } = platform_1.Registry.as(views_1.Extensions.ViewsRegistry).getView(options.id);
            this.treeView = treeView;
            this._register(this.treeView.onDidChangeActions(() => this.updateActions(), this));
            this._register(this.treeView.onDidChangeTitle((newTitle) => this.updateTitle(newTitle)));
            this._register(this.treeView.onDidChangeDescription((newDescription) => this.updateTitleDescription(newDescription)));
            this._register((0, lifecycle_1.toDisposable)(() => {
                if (this._container && this.treeView.container && (this._container === this.treeView.container)) {
                    this.treeView.setVisibility(false);
                }
            }));
            this._register(this.onDidChangeBodyVisibility(() => this.updateTreeVisibility()));
            this._register(this.treeView.onDidChangeWelcomeState(() => this._onDidChangeViewWelcomeState.fire()));
            if (options.title !== this.treeView.title) {
                this.updateTitle(this.treeView.title);
            }
            if (options.titleDescription !== this.treeView.description) {
                this.updateTitleDescription(this.treeView.description);
            }
            this.updateTreeVisibility();
        }
        focus() {
            super.focus();
            this.treeView.focus();
        }
        renderBody(container) {
            this._container = container;
            super.renderBody(container);
            this.renderTreeView(container);
        }
        shouldShowWelcome() {
            return ((this.treeView.dataProvider === undefined) || !!this.treeView.dataProvider.isTreeEmpty) && (this.treeView.message === undefined);
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.layoutTreeView(height, width);
        }
        getOptimalWidth() {
            return this.treeView.getOptimalWidth();
        }
        renderTreeView(container) {
            this.treeView.show(container);
        }
        layoutTreeView(height, width) {
            this.treeView.layout(height, width);
        }
        updateTreeVisibility() {
            this.treeView.setVisibility(this.isBodyVisible());
        }
    };
    TreeViewPane = __decorate([
        __param(1, keybinding_1.IKeybindingService),
        __param(2, contextView_1.IContextMenuService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, contextkey_1.IContextKeyService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, instantiation_1.IInstantiationService),
        __param(7, opener_1.IOpenerService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService)
    ], TreeViewPane);
    exports.TreeViewPane = TreeViewPane;
    class Root {
        constructor() {
            this.label = { label: 'root' };
            this.handle = '0';
            this.parentHandle = undefined;
            this.collapsibleState = views_1.TreeItemCollapsibleState.Expanded;
            this.children = undefined;
        }
    }
    const noDataProviderMessage = (0, nls_1.localize)('no-dataprovider', "There is no data provider registered that can provide view data.");
    exports.RawCustomTreeViewContextKey = new contextkey_1.RawContextKey('customTreeView', false);
    class Tree extends listService_1.WorkbenchAsyncDataTree {
    }
    let AbstractTreeView = class AbstractTreeView extends lifecycle_1.Disposable {
        constructor(id, _title, themeService, instantiationService, commandService, configurationService, progressService, contextMenuService, keybindingService, notificationService, viewDescriptorService, hoverService, contextKeyService, activityService) {
            super();
            this.id = id;
            this._title = _title;
            this.themeService = themeService;
            this.instantiationService = instantiationService;
            this.commandService = commandService;
            this.configurationService = configurationService;
            this.progressService = progressService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.notificationService = notificationService;
            this.viewDescriptorService = viewDescriptorService;
            this.hoverService = hoverService;
            this.activityService = activityService;
            this.isVisible = false;
            this._hasIconForParentNode = false;
            this._hasIconForLeafNode = false;
            this.focused = false;
            this._canSelectMany = false;
            this.elementsToRefresh = [];
            this._onDidExpandItem = this._register(new event_1.Emitter());
            this.onDidExpandItem = this._onDidExpandItem.event;
            this._onDidCollapseItem = this._register(new event_1.Emitter());
            this.onDidCollapseItem = this._onDidCollapseItem.event;
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._onDidChangeVisibility = this._register(new event_1.Emitter());
            this.onDidChangeVisibility = this._onDidChangeVisibility.event;
            this._onDidChangeActions = this._register(new event_1.Emitter());
            this.onDidChangeActions = this._onDidChangeActions.event;
            this._onDidChangeWelcomeState = this._register(new event_1.Emitter());
            this.onDidChangeWelcomeState = this._onDidChangeWelcomeState.event;
            this._onDidChangeTitle = this._register(new event_1.Emitter());
            this.onDidChangeTitle = this._onDidChangeTitle.event;
            this._onDidChangeDescription = this._register(new event_1.Emitter());
            this.onDidChangeDescription = this._onDidChangeDescription.event;
            this._onDidCompleteRefresh = this._register(new event_1.Emitter());
            this._height = 0;
            this._width = 0;
            this.refreshing = false;
            this.root = new Root();
            this.collapseAllContextKey = new contextkey_1.RawContextKey(`treeView.${this.id}.enableCollapseAll`, false, (0, nls_1.localize)('treeView.enableCollapseAll', "Whether the the tree view with id {0} enables collapse all.", this.id));
            this.collapseAllContext = this.collapseAllContextKey.bindTo(contextKeyService);
            this.collapseAllToggleContextKey = new contextkey_1.RawContextKey(`treeView.${this.id}.toggleCollapseAll`, false, (0, nls_1.localize)('treeView.toggleCollapseAll', "Whether collapse all is toggled for the tree view with id {0}.", this.id));
            this.collapseAllToggleContext = this.collapseAllToggleContextKey.bindTo(contextKeyService);
            this.refreshContextKey = new contextkey_1.RawContextKey(`treeView.${this.id}.enableRefresh`, false, (0, nls_1.localize)('treeView.enableRefresh', "Whether the tree view with id {0} enables refresh.", this.id));
            this.refreshContext = this.refreshContextKey.bindTo(contextKeyService);
            this.treeViewDnd = this.instantiationService.createInstance(CustomTreeViewDragAndDrop, this.id);
            this._register(this.themeService.onDidFileIconThemeChange(() => this.doRefresh([this.root]) /** soft refresh **/));
            this._register(this.themeService.onDidColorThemeChange(() => this.doRefresh([this.root]) /** soft refresh **/));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('explorer.decorations')) {
                    this.doRefresh([this.root]); /** soft refresh **/
                }
            }));
            this._register(this.viewDescriptorService.onDidChangeLocation(({ views, from, to }) => {
                var _a;
                if (views.some(v => v.id === this.id)) {
                    (_a = this.tree) === null || _a === void 0 ? void 0 : _a.updateOptions({ overrideStyles: { listBackground: this.viewLocation === 1 /* ViewContainerLocation.Panel */ ? theme_1.PANEL_BACKGROUND : theme_1.SIDE_BAR_BACKGROUND } });
                }
            }));
            this.registerActions();
            this.create();
        }
        get viewContainer() {
            return this.viewDescriptorService.getViewContainerByViewId(this.id);
        }
        get viewLocation() {
            return this.viewDescriptorService.getViewLocationById(this.id);
        }
        get dragAndDropController() {
            return this._dragAndDropController;
        }
        set dragAndDropController(dnd) {
            this._dragAndDropController = dnd;
            this.treeViewDnd.controller = dnd;
        }
        get dataProvider() {
            return this._dataProvider;
        }
        set dataProvider(dataProvider) {
            if (dataProvider) {
                const self = this;
                this._dataProvider = new class {
                    constructor() {
                        this._isEmpty = true;
                        this._onDidChangeEmpty = new event_1.Emitter();
                        this.onDidChangeEmpty = this._onDidChangeEmpty.event;
                    }
                    get isTreeEmpty() {
                        return this._isEmpty;
                    }
                    async getChildren(node) {
                        var _a;
                        let children;
                        if (node && node.children) {
                            children = node.children;
                        }
                        else {
                            node = node !== null && node !== void 0 ? node : self.root;
                            node.children = await (node instanceof Root ? dataProvider.getChildren() : dataProvider.getChildren(node));
                            children = (_a = node.children) !== null && _a !== void 0 ? _a : [];
                        }
                        if (node instanceof Root) {
                            const oldEmpty = this._isEmpty;
                            this._isEmpty = children.length === 0;
                            if (oldEmpty !== this._isEmpty) {
                                this._onDidChangeEmpty.fire();
                            }
                        }
                        return children;
                    }
                };
                if (this._dataProvider.onDidChangeEmpty) {
                    this._register(this._dataProvider.onDidChangeEmpty(() => {
                        this.updateCollapseAllToggle();
                        this._onDidChangeWelcomeState.fire();
                    }));
                }
                this.updateMessage();
                this.refresh();
            }
            else {
                this._dataProvider = undefined;
                this.updateMessage();
            }
            this._onDidChangeWelcomeState.fire();
        }
        get message() {
            return this._message;
        }
        set message(message) {
            this._message = message;
            this.updateMessage();
            this._onDidChangeWelcomeState.fire();
        }
        get title() {
            return this._title;
        }
        set title(name) {
            this._title = name;
            this._onDidChangeTitle.fire(this._title);
        }
        get description() {
            return this._description;
        }
        set description(description) {
            this._description = description;
            this._onDidChangeDescription.fire(this._description);
        }
        get badge() {
            return this._badge;
        }
        set badge(badge) {
            var _a, _b;
            if (((_a = this._badge) === null || _a === void 0 ? void 0 : _a.value) === (badge === null || badge === void 0 ? void 0 : badge.value) &&
                ((_b = this._badge) === null || _b === void 0 ? void 0 : _b.tooltip) === (badge === null || badge === void 0 ? void 0 : badge.tooltip)) {
                return;
            }
            if (this._badgeActivity) {
                this._badgeActivity.dispose();
                this._badgeActivity = undefined;
            }
            this._badge = badge;
            if (badge) {
                const activity = {
                    badge: new activity_1.NumberBadge(badge.value, () => badge.tooltip),
                    priority: 150
                };
                this._badgeActivity = this.activityService.showViewActivity(this.id, activity);
            }
        }
        get canSelectMany() {
            return this._canSelectMany;
        }
        set canSelectMany(canSelectMany) {
            var _a;
            const oldCanSelectMany = this._canSelectMany;
            this._canSelectMany = canSelectMany;
            if (this._canSelectMany !== oldCanSelectMany) {
                (_a = this.tree) === null || _a === void 0 ? void 0 : _a.updateOptions({ multipleSelectionSupport: this.canSelectMany });
            }
        }
        get hasIconForParentNode() {
            return this._hasIconForParentNode;
        }
        get hasIconForLeafNode() {
            return this._hasIconForLeafNode;
        }
        get visible() {
            return this.isVisible;
        }
        get showCollapseAllAction() {
            return !!this.collapseAllContext.get();
        }
        set showCollapseAllAction(showCollapseAllAction) {
            this.collapseAllContext.set(showCollapseAllAction);
        }
        get showRefreshAction() {
            return !!this.refreshContext.get();
        }
        set showRefreshAction(showRefreshAction) {
            this.refreshContext.set(showRefreshAction);
        }
        registerActions() {
            const that = this;
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.treeView.${that.id}.refresh`,
                        title: (0, nls_1.localize)('refresh', "Refresh"),
                        menu: {
                            id: actions_1.MenuId.ViewTitle,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', that.id), that.refreshContextKey),
                            group: 'navigation',
                            order: Number.MAX_SAFE_INTEGER - 1,
                        },
                        icon: codicons_1.Codicon.refresh
                    });
                }
                async run() {
                    return that.refresh();
                }
            }));
            this._register((0, actions_1.registerAction2)(class extends actions_1.Action2 {
                constructor() {
                    super({
                        id: `workbench.actions.treeView.${that.id}.collapseAll`,
                        title: (0, nls_1.localize)('collapseAll', "Collapse All"),
                        menu: {
                            id: actions_1.MenuId.ViewTitle,
                            when: contextkey_1.ContextKeyExpr.and(contextkey_1.ContextKeyExpr.equals('view', that.id), that.collapseAllContextKey),
                            group: 'navigation',
                            order: Number.MAX_SAFE_INTEGER,
                        },
                        precondition: that.collapseAllToggleContextKey,
                        icon: codicons_1.Codicon.collapseAll
                    });
                }
                async run() {
                    if (that.tree) {
                        return new treeDefaults_1.CollapseAllAction(that.tree, true).run();
                    }
                }
            }));
        }
        setVisibility(isVisible) {
            isVisible = !!isVisible;
            if (this.isVisible === isVisible) {
                return;
            }
            this.isVisible = isVisible;
            if (this.tree) {
                if (this.isVisible) {
                    DOM.show(this.tree.getHTMLElement());
                }
                else {
                    DOM.hide(this.tree.getHTMLElement()); // make sure the tree goes out of the tabindex world by hiding it
                }
                if (this.isVisible && this.elementsToRefresh.length) {
                    this.doRefresh(this.elementsToRefresh);
                    this.elementsToRefresh = [];
                }
            }
            this._onDidChangeVisibility.fire(this.isVisible);
            if (this.visible) {
                this.activate();
            }
        }
        focus(reveal = true) {
            if (this.tree && this.root.children && this.root.children.length > 0) {
                // Make sure the current selected element is revealed
                const selectedElement = this.tree.getSelection()[0];
                if (selectedElement && reveal) {
                    this.tree.reveal(selectedElement, 0.5);
                }
                // Pass Focus to Viewer
                this.tree.domFocus();
            }
            else if (this.tree) {
                this.tree.domFocus();
            }
            else {
                this.domNode.focus();
            }
        }
        show(container) {
            this._container = container;
            DOM.append(container, this.domNode);
        }
        create() {
            this.domNode = DOM.$('.tree-explorer-viewlet-tree-view');
            this.messageElement = DOM.append(this.domNode, DOM.$('.message'));
            this.treeContainer = DOM.append(this.domNode, DOM.$('.customview-tree'));
            this.treeContainer.classList.add('file-icon-themable-tree', 'show-file-icons');
            const focusTracker = this._register(DOM.trackFocus(this.domNode));
            this._register(focusTracker.onDidFocus(() => this.focused = true));
            this._register(focusTracker.onDidBlur(() => this.focused = false));
        }
        createTree() {
            const actionViewItemProvider = menuEntryActionViewItem_1.createActionViewItem.bind(undefined, this.instantiationService);
            const treeMenus = this._register(this.instantiationService.createInstance(TreeMenus, this.id));
            this.treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, this));
            const dataSource = this.instantiationService.createInstance(TreeDataSource, this, (task) => this.progressService.withProgress({ location: this.id }, () => task));
            const aligner = new Aligner(this.themeService);
            const renderer = this.instantiationService.createInstance(TreeRenderer, this.id, treeMenus, this.treeLabels, actionViewItemProvider, aligner);
            const widgetAriaLabel = this._title;
            this.tree = this._register(this.instantiationService.createInstance(Tree, this.id, this.treeContainer, new TreeViewDelegate(), [renderer], dataSource, {
                identityProvider: new TreeViewIdentityProvider(),
                accessibilityProvider: {
                    getAriaLabel(element) {
                        if (element.accessibilityInformation) {
                            return element.accessibilityInformation.label;
                        }
                        if ((0, types_1.isString)(element.tooltip)) {
                            return element.tooltip;
                        }
                        else {
                            if (element.resourceUri && !element.label) {
                                // The custom tree has no good information on what should be used for the aria label.
                                // Allow the tree widget's default aria label to be used.
                                return null;
                            }
                            let buildAriaLabel = '';
                            if (element.label) {
                                buildAriaLabel += element.label.label + ' ';
                            }
                            if (element.description) {
                                buildAriaLabel += element.description;
                            }
                            return buildAriaLabel;
                        }
                    },
                    getRole(element) {
                        var _a, _b;
                        return (_b = (_a = element.accessibilityInformation) === null || _a === void 0 ? void 0 : _a.role) !== null && _b !== void 0 ? _b : 'treeitem';
                    },
                    getWidgetAriaLabel() {
                        return widgetAriaLabel;
                    }
                },
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (item) => {
                        return item.label ? item.label.label : (item.resourceUri ? (0, resources_1.basename)(uri_1.URI.revive(item.resourceUri)) : undefined);
                    }
                },
                expandOnlyOnTwistieClick: (e) => !!e.command,
                collapseByDefault: (e) => {
                    return e.collapsibleState !== views_1.TreeItemCollapsibleState.Expanded;
                },
                multipleSelectionSupport: this.canSelectMany,
                dnd: this.treeViewDnd,
                overrideStyles: {
                    listBackground: this.viewLocation === 1 /* ViewContainerLocation.Panel */ ? theme_1.PANEL_BACKGROUND : theme_1.SIDE_BAR_BACKGROUND
                }
            }));
            treeMenus.setContextKeyService(this.tree.contextKeyService);
            aligner.tree = this.tree;
            const actionRunner = new MultipleSelectionActionRunner(this.notificationService, () => this.tree.getSelection());
            renderer.actionRunner = actionRunner;
            this.tree.contextKeyService.createKey(this.id, true);
            const customTreeKey = exports.RawCustomTreeViewContextKey.bindTo(this.tree.contextKeyService);
            customTreeKey.set(true);
            this._register(this.tree.onContextMenu(e => this.onContextMenu(treeMenus, e, actionRunner)));
            this._register(this.tree.onDidChangeSelection(e => this._onDidChangeSelection.fire(e.elements)));
            this._register(this.tree.onDidChangeCollapseState(e => {
                if (!e.node.element) {
                    return;
                }
                const element = Array.isArray(e.node.element.element) ? e.node.element.element[0] : e.node.element.element;
                if (e.node.collapsed) {
                    this._onDidCollapseItem.fire(element);
                }
                else {
                    this._onDidExpandItem.fire(element);
                }
            }));
            this.tree.setInput(this.root).then(() => this.updateContentAreas());
            this._register(this.tree.onDidOpen(async (e) => {
                if (!e.browserEvent) {
                    return;
                }
                const selection = this.tree.getSelection();
                const command = await this.resolveCommand(selection.length === 1 ? selection[0] : undefined);
                if (command) {
                    let args = command.arguments || [];
                    if (command.id === editorCommands_1.API_OPEN_EDITOR_COMMAND_ID || command.id === editorCommands_1.API_OPEN_DIFF_EDITOR_COMMAND_ID) {
                        // Some commands owned by us should receive the
                        // `IOpenEvent` as context to open properly
                        args = [...args, e];
                    }
                    this.commandService.executeCommand(command.id, ...args);
                }
            }));
            this._register(treeMenus.onDidChange((changed) => { var _a; return (_a = this.tree) === null || _a === void 0 ? void 0 : _a.rerender(changed); }));
        }
        async resolveCommand(element) {
            let command = element === null || element === void 0 ? void 0 : element.command;
            if (element && !command) {
                if ((element instanceof views_1.ResolvableTreeItem) && element.hasResolve) {
                    await element.resolve(new cancellation_1.CancellationTokenSource().token);
                    command = element.command;
                }
            }
            return command;
        }
        onContextMenu(treeMenus, treeEvent, actionRunner) {
            this.hoverService.hideHover();
            const node = treeEvent.element;
            if (node === null) {
                return;
            }
            const event = treeEvent.browserEvent;
            event.preventDefault();
            event.stopPropagation();
            this.tree.setFocus([node]);
            const actions = treeMenus.getResourceContextActions(node);
            if (!actions.length) {
                return;
            }
            this.contextMenuService.showContextMenu({
                getAnchor: () => treeEvent.anchor,
                getActions: () => actions,
                getActionViewItem: (action) => {
                    const keybinding = this.keybindingService.lookupKeybinding(action.id);
                    if (keybinding) {
                        return new actionViewItems_1.ActionViewItem(action, action, { label: true, keybinding: keybinding.getLabel() });
                    }
                    return undefined;
                },
                onHide: (wasCancelled) => {
                    if (wasCancelled) {
                        this.tree.domFocus();
                    }
                },
                getActionsContext: () => ({ $treeViewId: this.id, $treeItemHandle: node.handle }),
                actionRunner
            });
        }
        updateMessage() {
            if (this._message) {
                this.showMessage(this._message);
            }
            else if (!this.dataProvider) {
                this.showMessage(noDataProviderMessage);
            }
            else {
                this.hideMessage();
            }
            this.updateContentAreas();
        }
        showMessage(message) {
            this.messageElement.classList.remove('hide');
            this.resetMessageElement();
            this._messageValue = message;
            if (!(0, strings_1.isFalsyOrWhitespace)(this._message)) {
                this.messageElement.textContent = this._messageValue;
            }
            this.layout(this._height, this._width);
        }
        hideMessage() {
            this.resetMessageElement();
            this.messageElement.classList.add('hide');
            this.layout(this._height, this._width);
        }
        resetMessageElement() {
            DOM.clearNode(this.messageElement);
        }
        layout(height, width) {
            if (height && width) {
                this._height = height;
                this._width = width;
                const treeHeight = height - DOM.getTotalHeight(this.messageElement);
                this.treeContainer.style.height = treeHeight + 'px';
                if (this.tree) {
                    this.tree.layout(treeHeight, width);
                }
            }
        }
        getOptimalWidth() {
            if (this.tree) {
                const parentNode = this.tree.getHTMLElement();
                const childNodes = [].slice.call(parentNode.querySelectorAll('.outline-item-label > a'));
                return DOM.getLargestChildWidth(parentNode, childNodes);
            }
            return 0;
        }
        async refresh(elements) {
            if (this.dataProvider && this.tree) {
                if (this.refreshing) {
                    await event_1.Event.toPromise(this._onDidCompleteRefresh.event);
                }
                if (!elements) {
                    elements = [this.root];
                    // remove all waiting elements to refresh if root is asked to refresh
                    this.elementsToRefresh = [];
                }
                for (const element of elements) {
                    element.children = undefined; // reset children
                }
                if (this.isVisible) {
                    return this.doRefresh(elements);
                }
                else {
                    if (this.elementsToRefresh.length) {
                        const seen = new Set();
                        this.elementsToRefresh.forEach(element => seen.add(element.handle));
                        for (const element of elements) {
                            if (!seen.has(element.handle)) {
                                this.elementsToRefresh.push(element);
                            }
                        }
                    }
                    else {
                        this.elementsToRefresh.push(...elements);
                    }
                }
            }
            return undefined;
        }
        async expand(itemOrItems) {
            const tree = this.tree;
            if (tree) {
                itemOrItems = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
                await Promise.all(itemOrItems.map(element => {
                    return tree.expand(element, false);
                }));
            }
        }
        setSelection(items) {
            if (this.tree) {
                this.tree.setSelection(items);
            }
        }
        setFocus(item) {
            if (this.tree) {
                this.focus();
                this.tree.setFocus([item]);
            }
        }
        async reveal(item) {
            if (this.tree) {
                return this.tree.reveal(item);
            }
        }
        async doRefresh(elements) {
            const tree = this.tree;
            if (tree && this.visible) {
                this.refreshing = true;
                await Promise.all(elements.map(element => tree.updateChildren(element, true, true)));
                this.refreshing = false;
                this._onDidCompleteRefresh.fire();
                this.updateContentAreas();
                if (this.focused) {
                    this.focus(false);
                }
                this.updateCollapseAllToggle();
            }
        }
        updateCollapseAllToggle() {
            if (this.showCollapseAllAction) {
                this.collapseAllToggleContext.set(!!this.root.children && (this.root.children.length > 0) &&
                    this.root.children.some(value => value.collapsibleState !== views_1.TreeItemCollapsibleState.None));
            }
        }
        updateContentAreas() {
            const isTreeEmpty = !this.root.children || this.root.children.length === 0;
            // Hide tree container only when there is a message and tree is empty and not refreshing
            if (this._messageValue && isTreeEmpty && !this.refreshing) {
                this.treeContainer.classList.add('hide');
                this.domNode.setAttribute('tabindex', '0');
            }
            else {
                this.treeContainer.classList.remove('hide');
                this.domNode.removeAttribute('tabindex');
            }
        }
        get container() {
            return this._container;
        }
    };
    AbstractTreeView = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, commands_1.ICommandService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, progress_1.IProgressService),
        __param(7, contextView_1.IContextMenuService),
        __param(8, keybinding_1.IKeybindingService),
        __param(9, notification_1.INotificationService),
        __param(10, views_1.IViewDescriptorService),
        __param(11, hover_1.IHoverService),
        __param(12, contextkey_1.IContextKeyService),
        __param(13, activity_1.IActivityService)
    ], AbstractTreeView);
    class TreeViewIdentityProvider {
        getId(element) {
            return element.handle;
        }
    }
    class TreeViewDelegate {
        getHeight(element) {
            return TreeRenderer.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            return TreeRenderer.TREE_TEMPLATE_ID;
        }
    }
    class TreeDataSource {
        constructor(treeView, withProgress) {
            this.treeView = treeView;
            this.withProgress = withProgress;
        }
        hasChildren(element) {
            return !!this.treeView.dataProvider && (element.collapsibleState !== views_1.TreeItemCollapsibleState.None);
        }
        async getChildren(element) {
            var _a;
            let result = [];
            if (this.treeView.dataProvider) {
                try {
                    result = (_a = (await this.withProgress(this.treeView.dataProvider.getChildren(element)))) !== null && _a !== void 0 ? _a : [];
                }
                catch (e) {
                    if (!e.message.startsWith('Bad progress location:')) {
                        throw e;
                    }
                }
            }
            return result;
        }
    }
    // todo@jrieken,sandy make this proper and contributable from extensions
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const matchBackgroundColor = theme.getColor(colorRegistry_1.listFilterMatchHighlight);
        if (matchBackgroundColor) {
            collector.addRule(`.file-icon-themable-tree .monaco-list-row .content .monaco-highlighted-label .highlight { color: unset !important; background-color: ${matchBackgroundColor}; }`);
            collector.addRule(`.monaco-tl-contents .monaco-highlighted-label .highlight { color: unset !important; background-color: ${matchBackgroundColor}; }`);
        }
        const matchBorderColor = theme.getColor(colorRegistry_1.listFilterMatchHighlightBorder);
        if (matchBorderColor) {
            collector.addRule(`.file-icon-themable-tree .monaco-list-row .content .monaco-highlighted-label .highlight { color: unset !important; border: 1px dotted ${matchBorderColor}; box-sizing: border-box; }`);
            collector.addRule(`.monaco-tl-contents .monaco-highlighted-label .highlight { color: unset !important; border: 1px dotted ${matchBorderColor}; box-sizing: border-box; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.tree-explorer-viewlet-tree-view > .message a { color: ${link}; }`);
        }
        const focusBorderColor = theme.getColor(colorRegistry_1.focusBorder);
        if (focusBorderColor) {
            collector.addRule(`.tree-explorer-viewlet-tree-view > .message a:focus { outline: 1px solid ${focusBorderColor}; outline-offset: -1px; }`);
        }
        const codeBackground = theme.getColor(colorRegistry_1.textCodeBlockBackground);
        if (codeBackground) {
            collector.addRule(`.tree-explorer-viewlet-tree-view > .message code { background-color: ${codeBackground}; }`);
        }
    });
    let TreeRenderer = class TreeRenderer extends lifecycle_1.Disposable {
        constructor(treeViewId, menus, labels, actionViewItemProvider, aligner, themeService, configurationService, labelService, hoverService, treeViewsService) {
            super();
            this.treeViewId = treeViewId;
            this.menus = menus;
            this.labels = labels;
            this.actionViewItemProvider = actionViewItemProvider;
            this.aligner = aligner;
            this.themeService = themeService;
            this.configurationService = configurationService;
            this.labelService = labelService;
            this.hoverService = hoverService;
            this.treeViewsService = treeViewsService;
            this._hoverDelegate = {
                showHover: (options) => this.hoverService.showHover(options),
                delay: this.configurationService.getValue('workbench.hover.delay')
            };
        }
        get templateId() {
            return TreeRenderer.TREE_TEMPLATE_ID;
        }
        set actionRunner(actionRunner) {
            this._actionRunner = actionRunner;
        }
        renderTemplate(container) {
            container.classList.add('custom-view-tree-node-item');
            const icon = DOM.append(container, DOM.$('.custom-view-tree-node-item-icon'));
            const resourceLabel = this.labels.create(container, { supportHighlights: true, hoverDelegate: this._hoverDelegate });
            const actionsContainer = DOM.append(resourceLabel.element, DOM.$('.actions'));
            const actionBar = new actionbar_1.ActionBar(actionsContainer, {
                actionViewItemProvider: this.actionViewItemProvider
            });
            return { resourceLabel, icon, actionBar, container, elementDisposable: lifecycle_1.Disposable.None };
        }
        getHover(label, resource, node) {
            if (!(node instanceof views_1.ResolvableTreeItem) || !node.hasResolve) {
                if (resource && !node.tooltip) {
                    return undefined;
                }
                else if (node.tooltip === undefined) {
                    return label;
                }
                else if (!(0, types_1.isString)(node.tooltip)) {
                    return { markdown: node.tooltip, markdownNotSupportedFallback: resource ? undefined : (0, markdownRenderer_1.renderMarkdownAsPlaintext)(node.tooltip) }; // Passing undefined as the fallback for a resource falls back to the old native hover
                }
                else if (node.tooltip !== '') {
                    return node.tooltip;
                }
                else {
                    return undefined;
                }
            }
            return {
                markdown: (token) => {
                    return new Promise((resolve) => {
                        node.resolve(token).then(() => resolve(node.tooltip));
                    });
                },
                markdownNotSupportedFallback: resource ? undefined : (label !== null && label !== void 0 ? label : '') // Passing undefined as the fallback for a resource falls back to the old native hover
            };
        }
        renderElement(element, index, templateData) {
            var _a, _b;
            templateData.elementDisposable.dispose();
            const node = element.element;
            const resource = node.resourceUri ? uri_1.URI.revive(node.resourceUri) : null;
            const treeItemLabel = node.label ? node.label : (resource ? { label: (0, resources_1.basename)(resource) } : undefined);
            const description = (0, types_1.isString)(node.description) ? node.description : resource && node.description === true ? this.labelService.getUriLabel((0, resources_1.dirname)(resource), { relative: true }) : undefined;
            const label = treeItemLabel ? treeItemLabel.label : undefined;
            const matches = (treeItemLabel && treeItemLabel.highlights && label) ? treeItemLabel.highlights.map(([start, end]) => {
                if (start < 0) {
                    start = label.length + start;
                }
                if (end < 0) {
                    end = label.length + end;
                }
                if ((start >= label.length) || (end > label.length)) {
                    return ({ start: 0, end: 0 });
                }
                if (start > end) {
                    const swap = start;
                    start = end;
                    end = swap;
                }
                return ({ start, end });
            }) : undefined;
            const icon = this.themeService.getColorTheme().type === theme_2.ColorScheme.LIGHT ? node.icon : node.iconDark;
            const iconUrl = icon ? uri_1.URI.revive(icon) : null;
            const title = this.getHover(label, resource, node);
            // reset
            templateData.actionBar.clear();
            templateData.icon.style.color = '';
            if (resource) {
                const fileDecorations = this.configurationService.getValue('explorer.decorations');
                const labelResource = resource ? resource : uri_1.URI.parse('missing:_icon_resource');
                templateData.resourceLabel.setResource({ name: label, description, resource: labelResource }, {
                    fileKind: this.getFileKind(node),
                    title,
                    hideIcon: !!iconUrl || this.shouldShowThemeIcon(!!resource, node.themeIcon),
                    fileDecorations,
                    extraClasses: ['custom-view-tree-node-item-resourceLabel'],
                    matches: matches ? matches : (0, filters_1.createMatches)(element.filterData),
                    strikethrough: treeItemLabel === null || treeItemLabel === void 0 ? void 0 : treeItemLabel.strikethrough
                });
            }
            else {
                templateData.resourceLabel.setResource({ name: label, description }, {
                    title,
                    hideIcon: true,
                    extraClasses: ['custom-view-tree-node-item-resourceLabel'],
                    matches: matches ? matches : (0, filters_1.createMatches)(element.filterData),
                    strikethrough: treeItemLabel === null || treeItemLabel === void 0 ? void 0 : treeItemLabel.strikethrough
                });
            }
            if (iconUrl) {
                templateData.icon.className = 'custom-view-tree-node-item-icon';
                templateData.icon.style.backgroundImage = DOM.asCSSUrl(iconUrl);
            }
            else {
                let iconClass;
                // If there is a resource for this tree item then we should respect the file icon theme's choice about
                // whether to show a folder icon.
                if (this.shouldShowThemeIcon(!!resource, node.themeIcon)) {
                    iconClass = themeService_1.ThemeIcon.asClassName(node.themeIcon);
                    if (node.themeIcon.color) {
                        templateData.icon.style.color = (_b = (_a = this.themeService.getColorTheme().getColor(node.themeIcon.color.id)) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : '';
                    }
                }
                templateData.icon.className = iconClass ? `custom-view-tree-node-item-icon ${iconClass}` : '';
                templateData.icon.style.backgroundImage = '';
            }
            templateData.actionBar.context = { $treeViewId: this.treeViewId, $treeItemHandle: node.handle };
            const disposableStore = new lifecycle_1.DisposableStore();
            templateData.elementDisposable = disposableStore;
            const menuActions = this.menus.getResourceActions(node);
            if (menuActions.menu) {
                disposableStore.add(menuActions.menu);
            }
            templateData.actionBar.push(menuActions.actions, { icon: true, label: false });
            if (this._actionRunner) {
                templateData.actionBar.actionRunner = this._actionRunner;
            }
            this.setAlignment(templateData.container, node);
            disposableStore.add(this.themeService.onDidFileIconThemeChange(() => this.setAlignment(templateData.container, node)));
            this.treeViewsService.addRenderedTreeItemElement(node, templateData.container);
            disposableStore.add((0, lifecycle_1.toDisposable)(() => this.treeViewsService.removeRenderedTreeItemElement(node)));
        }
        setAlignment(container, treeItem) {
            container.parentElement.classList.toggle('align-icon-with-twisty', this.aligner.alignIconWithTwisty(treeItem));
        }
        shouldShowThemeIcon(hasResource, icon) {
            if (!icon) {
                return false;
            }
            if (hasResource && (this.isFileKindThemeIcon(icon) || !this.shouldShowFileIcons())) {
                return false;
            }
            else if (hasResource && (this.isFolderThemeIcon(icon) || !this.shouldShowFolderIcons())) {
                return false;
            }
            return true;
        }
        shouldShowFileIcons() {
            return this.configurationService.getValue(workbenchThemeService_1.ThemeSettings.FILE_ICON_THEME);
        }
        shouldShowFolderIcons() {
            return this.themeService.getFileIconTheme().hasFolderIcons && this.shouldShowFileIcons();
        }
        isFolderThemeIcon(icon) {
            return (icon === null || icon === void 0 ? void 0 : icon.id) === themeService_1.FolderThemeIcon.id;
        }
        isFileKindThemeIcon(icon) {
            if (icon) {
                return icon.id === themeService_1.FileThemeIcon.id || this.isFolderThemeIcon(icon);
            }
            else {
                return false;
            }
        }
        getFileKind(node) {
            if (node.themeIcon) {
                switch (node.themeIcon.id) {
                    case themeService_1.FileThemeIcon.id:
                        return files_1.FileKind.FILE;
                    case themeService_1.FolderThemeIcon.id:
                        return files_1.FileKind.FOLDER;
                }
            }
            return node.collapsibleState === views_1.TreeItemCollapsibleState.Collapsed || node.collapsibleState === views_1.TreeItemCollapsibleState.Expanded ? files_1.FileKind.FOLDER : files_1.FileKind.FILE;
        }
        disposeElement(resource, index, templateData) {
            templateData.elementDisposable.dispose();
        }
        disposeTemplate(templateData) {
            templateData.resourceLabel.dispose();
            templateData.actionBar.dispose();
            templateData.elementDisposable.dispose();
        }
    };
    TreeRenderer.ITEM_HEIGHT = 22;
    TreeRenderer.TREE_TEMPLATE_ID = 'treeExplorer';
    TreeRenderer = __decorate([
        __param(5, themeService_1.IThemeService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, label_1.ILabelService),
        __param(8, hover_1.IHoverService),
        __param(9, treeViewsService_1.ITreeViewsService)
    ], TreeRenderer);
    class Aligner extends lifecycle_1.Disposable {
        constructor(themeService) {
            super();
            this.themeService = themeService;
        }
        set tree(tree) {
            this._tree = tree;
        }
        alignIconWithTwisty(treeItem) {
            if (treeItem.collapsibleState !== views_1.TreeItemCollapsibleState.None) {
                return false;
            }
            if (!this.hasIcon(treeItem)) {
                return false;
            }
            if (this._tree) {
                const parent = this._tree.getParentElement(treeItem) || this._tree.getInput();
                if (this.hasIcon(parent)) {
                    return !!parent.children && parent.children.some(c => c.collapsibleState !== views_1.TreeItemCollapsibleState.None && !this.hasIcon(c));
                }
                return !!parent.children && parent.children.every(c => c.collapsibleState === views_1.TreeItemCollapsibleState.None || !this.hasIcon(c));
            }
            else {
                return false;
            }
        }
        hasIcon(node) {
            const icon = this.themeService.getColorTheme().type === theme_2.ColorScheme.LIGHT ? node.icon : node.iconDark;
            if (icon) {
                return true;
            }
            if (node.resourceUri || node.themeIcon) {
                const fileIconTheme = this.themeService.getFileIconTheme();
                const isFolder = node.themeIcon ? node.themeIcon.id === themeService_1.FolderThemeIcon.id : node.collapsibleState !== views_1.TreeItemCollapsibleState.None;
                if (isFolder) {
                    return fileIconTheme.hasFileIcons && fileIconTheme.hasFolderIcons;
                }
                return fileIconTheme.hasFileIcons;
            }
            return false;
        }
    }
    class MultipleSelectionActionRunner extends actions_2.ActionRunner {
        constructor(notificationService, getSelectedResources) {
            super();
            this.getSelectedResources = getSelectedResources;
            this._register(this.onDidRun(e => {
                if (e.error && !(0, errors_1.isCancellationError)(e.error)) {
                    notificationService.error((0, nls_1.localize)('command-error', 'Error running command {1}: {0}. This is likely caused by the extension that contributes {1}.', e.error.message, e.action.id));
                }
            }));
        }
        async runAction(action, context) {
            const selection = this.getSelectedResources();
            let selectionHandleArgs = undefined;
            let actionInSelected = false;
            if (selection.length > 1) {
                selectionHandleArgs = selection.map(selected => {
                    if (selected.handle === context.$treeItemHandle) {
                        actionInSelected = true;
                    }
                    return { $treeViewId: context.$treeViewId, $treeItemHandle: selected.handle };
                });
            }
            if (!actionInSelected) {
                selectionHandleArgs = undefined;
            }
            await action.run(...[context, selectionHandleArgs]);
        }
    }
    let TreeMenus = class TreeMenus extends lifecycle_1.Disposable {
        constructor(id, menuService) {
            super();
            this.id = id;
            this.menuService = menuService;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
        }
        /**
         * Caller is now responsible for disposing of the menu!
         */
        getResourceActions(element) {
            const actions = this.getActions(actions_1.MenuId.ViewItemContext, element, true);
            return { menu: actions.menu, actions: actions.primary };
        }
        getResourceContextActions(element) {
            return this.getActions(actions_1.MenuId.ViewItemContext, element).secondary;
        }
        setContextKeyService(service) {
            this.contextKeyService = service;
        }
        getActions(menuId, element, listen = false) {
            if (!this.contextKeyService) {
                return { primary: [], secondary: [] };
            }
            const contextKeyService = this.contextKeyService.createOverlay([
                ['view', this.id],
                ['viewItem', element.contextValue]
            ]);
            const menu = this.menuService.createMenu(menuId, contextKeyService);
            const primary = [];
            const secondary = [];
            const result = { primary, secondary, menu };
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { shouldForwardArgs: true }, result, 'inline');
            if (listen) {
                this._register(menu.onDidChange(() => this._onDidChange.fire(element)));
            }
            else {
                menu.dispose();
            }
            return result;
        }
    };
    TreeMenus = __decorate([
        __param(1, actions_1.IMenuService)
    ], TreeMenus);
    let CustomTreeView = class CustomTreeView extends AbstractTreeView {
        constructor(id, title, extensionId, themeService, instantiationService, commandService, configurationService, progressService, contextMenuService, keybindingService, notificationService, viewDescriptorService, contextKeyService, hoverService, extensionService, activityService, telemetryService) {
            super(id, title, themeService, instantiationService, commandService, configurationService, progressService, contextMenuService, keybindingService, notificationService, viewDescriptorService, hoverService, contextKeyService, activityService);
            this.extensionId = extensionId;
            this.extensionService = extensionService;
            this.telemetryService = telemetryService;
            this.activated = false;
        }
        activate() {
            if (!this.activated) {
                this.telemetryService.publicLog2('Extension:ViewActivate', {
                    extensionId: this.extensionId,
                    id: this.id,
                });
                this.createTree();
                this.progressService.withProgress({ location: this.id }, () => this.extensionService.activateByEvent(`onView:${this.id}`))
                    .then(() => (0, async_1.timeout)(2000))
                    .then(() => {
                    this.updateMessage();
                });
                this.activated = true;
            }
        }
    };
    CustomTreeView = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, commands_1.ICommandService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, progress_1.IProgressService),
        __param(8, contextView_1.IContextMenuService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, notification_1.INotificationService),
        __param(11, views_1.IViewDescriptorService),
        __param(12, contextkey_1.IContextKeyService),
        __param(13, hover_1.IHoverService),
        __param(14, extensions_1.IExtensionService),
        __param(15, activity_1.IActivityService),
        __param(16, telemetry_1.ITelemetryService)
    ], CustomTreeView);
    exports.CustomTreeView = CustomTreeView;
    class TreeView extends AbstractTreeView {
        constructor() {
            super(...arguments);
            this.activated = false;
        }
        activate() {
            if (!this.activated) {
                this.createTree();
                this.activated = true;
            }
        }
    }
    exports.TreeView = TreeView;
    const INTERNAL_MIME_TYPES = [dnd_2.CodeDataTransfers.EDITORS.toLowerCase(), dnd_2.CodeDataTransfers.FILES.toLowerCase()];
    let CustomTreeViewDragAndDrop = class CustomTreeViewDragAndDrop {
        constructor(treeId, labelService, instantiationService, treeViewsDragAndDropService, logService) {
            this.treeId = treeId;
            this.labelService = labelService;
            this.instantiationService = instantiationService;
            this.treeViewsDragAndDropService = treeViewsDragAndDropService;
            this.logService = logService;
            this.treeItemsTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.treeMimeType = `application/vnd.code.tree.${treeId.toLowerCase()}`;
        }
        set controller(controller) {
            this.dndController = controller;
        }
        handleDragAndLog(dndController, itemHandles, uuid, dragCancellationToken) {
            return dndController.handleDrag(itemHandles, uuid, dragCancellationToken).then(additionalDataTransfer => {
                if (additionalDataTransfer) {
                    const unlistedTypes = [];
                    for (const item of additionalDataTransfer.entries()) {
                        if ((item[0] !== this.treeMimeType) && (dndController.dragMimeTypes.findIndex(value => value === item[0]) < 0)) {
                            unlistedTypes.push(item[0]);
                        }
                    }
                    if (unlistedTypes.length) {
                        this.logService.warn(`Drag and drop controller for tree ${this.treeId} adds the following data transfer types but does not declare them in dragMimeTypes: ${unlistedTypes.join(', ')}`);
                    }
                }
                return additionalDataTransfer;
            });
        }
        addExtensionProvidedTransferTypes(originalEvent, itemHandles) {
            var _a;
            if (!originalEvent.dataTransfer || !this.dndController) {
                return;
            }
            const uuid = (0, uuid_1.generateUuid)();
            this.dragCancellationToken = new cancellation_1.CancellationTokenSource();
            this.treeViewsDragAndDropService.addDragOperationTransfer(uuid, this.handleDragAndLog(this.dndController, itemHandles, uuid, this.dragCancellationToken.token));
            this.treeItemsTransfer.setData([new dnd_2.DraggedTreeItemsIdentifier(uuid)], dnd_2.DraggedTreeItemsIdentifier.prototype);
            if (this.dndController.dragMimeTypes.find((element) => element === mime_1.Mimes.uriList)) {
                // Add the type that the editor knows
                (_a = originalEvent.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData(dnd_1.DataTransfers.RESOURCES, '');
            }
            this.dndController.dragMimeTypes.forEach(supportedType => {
                var _a;
                (_a = originalEvent.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData(supportedType, '');
            });
        }
        addResourceInfoToTransfer(originalEvent, resources) {
            if (resources.length && originalEvent.dataTransfer) {
                // Apply some datatransfer types to allow for dragging the element outside of the application
                this.instantiationService.invokeFunction(accessor => (0, dnd_2.fillEditorsDragData)(accessor, resources, originalEvent));
                // The only custom data transfer we set from the explorer is a file transfer
                // to be able to DND between multiple code file explorers across windows
                const fileResources = resources.filter(s => s.scheme === network_1.Schemas.file).map(r => r.fsPath);
                if (fileResources.length) {
                    originalEvent.dataTransfer.setData(dnd_2.CodeDataTransfers.FILES, JSON.stringify(fileResources));
                }
            }
        }
        onDragStart(data, originalEvent) {
            if (originalEvent.dataTransfer) {
                const treeItemsData = data.getData();
                const resources = [];
                const sourceInfo = {
                    id: this.treeId,
                    itemHandles: []
                };
                treeItemsData.forEach(item => {
                    sourceInfo.itemHandles.push(item.handle);
                    if (item.resourceUri) {
                        resources.push(uri_1.URI.revive(item.resourceUri));
                    }
                });
                this.addResourceInfoToTransfer(originalEvent, resources);
                this.addExtensionProvidedTransferTypes(originalEvent, sourceInfo.itemHandles);
                originalEvent.dataTransfer.setData(this.treeMimeType, JSON.stringify(sourceInfo));
            }
        }
        debugLog(types) {
            if (types.size) {
                this.logService.debug(`TreeView dragged mime types: ${Array.from(types).join(', ')}`);
            }
            else {
                this.logService.debug(`TreeView dragged with no supported mime types.`);
            }
        }
        onDragOver(data, targetElement, targetIndex, originalEvent) {
            var _a;
            const types = new Set();
            (_a = originalEvent.dataTransfer) === null || _a === void 0 ? void 0 : _a.types.forEach((value, index) => {
                if (INTERNAL_MIME_TYPES.indexOf(value) < 0) {
                    types.add(this.convertKnownMimes(value).type);
                }
            });
            this.debugLog(types);
            const dndController = this.dndController;
            if (!dndController || !originalEvent.dataTransfer || (dndController.dropMimeTypes.length === 0)) {
                return false;
            }
            const dragContainersSupportedType = Array.from(types).some((value, index) => {
                if (value === this.treeMimeType) {
                    return true;
                }
                else {
                    return dndController.dropMimeTypes.indexOf(value) >= 0;
                }
            });
            if (dragContainersSupportedType) {
                return { accept: true, bubble: 0 /* TreeDragOverBubble.Down */, autoExpand: true };
            }
            return false;
        }
        getDragURI(element) {
            if (!this.dndController) {
                return null;
            }
            return element.resourceUri ? uri_1.URI.revive(element.resourceUri).toString() : element.handle;
        }
        getDragLabel(elements) {
            if (!this.dndController) {
                return undefined;
            }
            if (elements.length > 1) {
                return String(elements.length);
            }
            const element = elements[0];
            return element.label ? element.label.label : (element.resourceUri ? this.labelService.getUriLabel(uri_1.URI.revive(element.resourceUri)) : undefined);
        }
        convertKnownMimes(type, kind, value) {
            let convertedValue = undefined;
            let convertedType = type;
            if (type === dnd_1.DataTransfers.RESOURCES.toLowerCase()) {
                convertedValue = value ? (0, dnd_2.convertResourceUrlsToUriList)(value) : undefined;
                convertedType = mime_1.Mimes.uriList;
            }
            else if ((type === 'Files') || (kind === 'file')) {
                convertedType = mime_1.Mimes.uriList;
                convertedValue = value ? value.name : undefined;
            }
            return { type: convertedType, value: convertedValue };
        }
        async drop(data, targetNode, targetIndex, originalEvent) {
            const dndController = this.dndController;
            if (!originalEvent.dataTransfer || !dndController) {
                return;
            }
            const treeDataTransfer = new Map();
            const uris = [];
            let itemsCount = Array.from(originalEvent.dataTransfer.items).reduce((previous, current) => {
                if ((current.kind === 'string') || (current.kind === 'file')) {
                    return previous + 1;
                }
                return previous;
            }, 0);
            let treeSourceInfo;
            let willDropUuid;
            if (this.treeItemsTransfer.hasData(dnd_2.DraggedTreeItemsIdentifier.prototype)) {
                willDropUuid = this.treeItemsTransfer.getData(dnd_2.DraggedTreeItemsIdentifier.prototype)[0].identifier;
            }
            await new Promise(resolve => {
                function decrementStringCount() {
                    itemsCount--;
                    if (itemsCount === 0) {
                        // Check if there are uris to add and add them
                        if (uris.length) {
                            treeDataTransfer.set(mime_1.Mimes.uriList, {
                                asString: () => Promise.resolve(uris.map(uri => uri.toString()).join('\n')),
                                value: undefined
                            });
                        }
                        resolve();
                    }
                }
                if (!originalEvent.dataTransfer) {
                    return;
                }
                for (const dataItem of originalEvent.dataTransfer.items) {
                    const type = dataItem.type;
                    const kind = dataItem.kind;
                    const convertedType = this.convertKnownMimes(type, kind).type;
                    if ((INTERNAL_MIME_TYPES.indexOf(convertedType) < 0)
                        && (convertedType === this.treeMimeType) || (dndController.dropMimeTypes.indexOf(convertedType) >= 0)) {
                        if (dataItem.kind === 'string') {
                            dataItem.getAsString(dataValue => {
                                if (convertedType === this.treeMimeType) {
                                    treeSourceInfo = JSON.parse(dataValue);
                                }
                                if (dataValue) {
                                    const converted = this.convertKnownMimes(type, kind, dataValue);
                                    treeDataTransfer.set(converted.type, {
                                        asString: () => Promise.resolve(converted.value),
                                        value: undefined
                                    });
                                }
                                decrementStringCount();
                            });
                        }
                        else if (dataItem.kind === 'file') {
                            const dataValue = dataItem.getAsFile();
                            if (dataValue) {
                                uris.push(uri_1.URI.file(dataValue.path));
                            }
                            decrementStringCount();
                        }
                    }
                    else if (dataItem.kind === 'string' || dataItem.kind === 'file') {
                        decrementStringCount();
                    }
                }
            });
            const additionalWillDropPromise = this.treeViewsDragAndDropService.removeDragOperationTransfer(willDropUuid);
            if (!additionalWillDropPromise) {
                return dndController.handleDrop(treeDataTransfer, targetNode, new cancellation_1.CancellationTokenSource().token, willDropUuid, treeSourceInfo === null || treeSourceInfo === void 0 ? void 0 : treeSourceInfo.id, treeSourceInfo === null || treeSourceInfo === void 0 ? void 0 : treeSourceInfo.itemHandles);
            }
            return additionalWillDropPromise.then(additionalDataTransfer => {
                if (additionalDataTransfer) {
                    for (const item of additionalDataTransfer.entries()) {
                        treeDataTransfer.set(item[0], item[1]);
                    }
                }
                return dndController.handleDrop(treeDataTransfer, targetNode, new cancellation_1.CancellationTokenSource().token, willDropUuid, treeSourceInfo === null || treeSourceInfo === void 0 ? void 0 : treeSourceInfo.id, treeSourceInfo === null || treeSourceInfo === void 0 ? void 0 : treeSourceInfo.itemHandles);
            });
        }
        onDragEnd(originalEvent) {
            var _a, _b;
            // Check if the drag was cancelled.
            if (((_a = originalEvent.dataTransfer) === null || _a === void 0 ? void 0 : _a.dropEffect) === 'none') {
                (_b = this.dragCancellationToken) === null || _b === void 0 ? void 0 : _b.cancel();
            }
        }
    };
    CustomTreeViewDragAndDrop = __decorate([
        __param(1, label_1.ILabelService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, treeViewsService_1.ITreeViewsService),
        __param(4, log_1.ILogService)
    ], CustomTreeViewDragAndDrop);
    exports.CustomTreeViewDragAndDrop = CustomTreeViewDragAndDrop;
});
//# sourceMappingURL=treeView.js.map