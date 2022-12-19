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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/button/button", "vs/base/browser/ui/list/listWidget", "vs/base/browser/ui/tree/abstractTree", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/color", "vs/base/common/event", "vs/base/common/lifecycle", "vs/base/common/strings", "vs/base/common/types", "vs/editor/contrib/markdownRenderer/browser/markdownRenderer", "vs/nls", "vs/platform/actions/browser/dropdownWithPrimaryActionViewItem", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/files/common/files", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/browser/labels", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/views", "vs/workbench/contrib/testing/browser/explorerProjections/hierarchalByLocation", "vs/workbench/contrib/testing/browser/explorerProjections/hierarchalByName", "vs/workbench/contrib/testing/browser/explorerProjections/index", "vs/workbench/contrib/testing/browser/explorerProjections/testItemContextOverlay", "vs/workbench/contrib/testing/browser/icons", "vs/workbench/contrib/testing/browser/testingExplorerFilter", "vs/workbench/contrib/testing/browser/testingProgressUiService", "vs/workbench/contrib/testing/common/configuration", "vs/workbench/contrib/testing/common/constants", "vs/workbench/contrib/testing/common/storedValue", "vs/workbench/contrib/testing/common/testExplorerFilterState", "vs/workbench/contrib/testing/common/testId", "vs/workbench/contrib/testing/common/testingContextKeys", "vs/workbench/contrib/testing/common/testingPeekOpener", "vs/workbench/contrib/testing/common/testingStates", "vs/workbench/contrib/testing/common/testProfileService", "vs/workbench/contrib/testing/common/testResultService", "vs/workbench/contrib/testing/common/testService", "vs/workbench/services/editor/common/editorService", "vs/css!./media/testing"], function (require, exports, dom, actionbar_1, button_1, listWidget_1, abstractTree_1, actions_1, async_1, color_1, event_1, lifecycle_1, strings_1, types_1, markdownRenderer_1, nls_1, dropdownWithPrimaryActionViewItem_1, menuEntryActionViewItem_1, actions_2, commands_1, configuration_1, contextkey_1, contextView_1, files_1, instantiation_1, keybinding_1, listService_1, opener_1, progress_1, storage_1, telemetry_1, colorRegistry_1, styler_1, themeService_1, uriIdentity_1, labels_1, viewPane_1, views_1, hierarchalByLocation_1, hierarchalByName_1, index_1, testItemContextOverlay_1, icons, testingExplorerFilter_1, testingProgressUiService_1, configuration_2, constants_1, storedValue_1, testExplorerFilterState_1, testId_1, testingContextKeys_1, testingPeekOpener_1, testingStates_1, testProfileService_1, testResultService_1, testService_1, editorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TestingExplorerViewModel = exports.TestingExplorerView = void 0;
    let TestingExplorerView = class TestingExplorerView extends viewPane_1.ViewPane {
        constructor(options, contextMenuService, keybindingService, configurationService, instantiationService, viewDescriptorService, contextKeyService, openerService, themeService, testService, telemetryService, testProgressService, testProfileService, commandService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.testService = testService;
            this.testProgressService = testProgressService;
            this.testProfileService = testProfileService;
            this.commandService = commandService;
            this.filterActionBar = this._register(new lifecycle_1.MutableDisposable());
            this.discoveryProgress = this._register(new lifecycle_1.MutableDisposable());
            this.dimensions = { width: 0, height: 0 };
            const relayout = this._register(new async_1.RunOnceScheduler(() => this.layoutBody(), 1));
            this._register(this.onDidChangeViewWelcomeState(() => {
                if (!this.shouldShowWelcome()) {
                    relayout.schedule();
                }
            }));
            this._register(testService.collection.onBusyProvidersChange(busy => {
                this.updateDiscoveryProgress(busy);
            }));
            this._register(testProfileService.onDidChange(() => this.updateActions()));
        }
        /**
         * @override
         */
        shouldShowWelcome() {
            var _a, _b;
            return (_b = ((_a = this.viewModel) === null || _a === void 0 ? void 0 : _a.welcomeExperience) === 1 /* WelcomeExperience.ForWorkspace */) !== null && _b !== void 0 ? _b : true;
        }
        getSelectedOrVisibleItems(profile) {
            const projection = this.viewModel.projection.value;
            if (!projection) {
                return { include: [], exclude: [] };
            }
            if (projection instanceof hierarchalByName_1.ByNameTestItemElement) {
                return {
                    include: [...this.testService.collection.rootItems],
                    exclude: [],
                };
            }
            // To calculate includes and excludes, we include the first children that
            // have a majority of their items included too, and then apply exclusions.
            const include = [];
            const exclude = [];
            const attempt = (element, alreadyIncluded) => {
                // sanity check hasElement since updates are debounced and they may exist
                // but not be rendered yet
                if (!(element instanceof index_1.TestItemTreeElement) || !this.viewModel.tree.hasElement(element)) {
                    return;
                }
                // If the current node is not visible or runnable in the current profile, it's excluded
                const inTree = this.viewModel.tree.getNode(element);
                if (!inTree.visible) {
                    if (alreadyIncluded) {
                        exclude.push(element.test);
                    }
                    return;
                }
                // If it's not already included but most of its children are, then add it
                // if it can be run under the current profile (when specified)
                if (
                // If it's not already included...
                !alreadyIncluded
                    // And it can be run using the current profile (if any)
                    && (!profile || (0, testProfileService_1.canUseProfileWithTest)(profile, element.test))
                    // And either it's a leaf node or most children are included, the  include it.
                    && (inTree.children.length === 0 || inTree.visibleChildrenCount * 2 >= inTree.children.length)
                    // And not if we're only showing a single of its children, since it
                    // probably fans out later. (Worse case we'll directly include its single child)
                    && inTree.visibleChildrenCount !== 1) {
                    include.push(element.test);
                    alreadyIncluded = true;
                }
                // Recurse ✨
                for (const child of element.children) {
                    attempt(child, alreadyIncluded);
                }
            };
            for (const root of this.testService.collection.rootItems) {
                const element = projection.getElementByTestId(root.item.extId);
                if (!element) {
                    continue;
                }
                if (profile && !(0, testProfileService_1.canUseProfileWithTest)(profile, root)) {
                    continue;
                }
                // single controllers won't have visible root ID nodes, handle that  case specially
                if (!this.viewModel.tree.hasElement(element)) {
                    const visibleChildren = [...element.children].reduce((acc, c) => this.viewModel.tree.hasElement(c) && this.viewModel.tree.getNode(c).visible ? acc + 1 : acc, 0);
                    // note we intentionally check children > 0 here, unlike above, since
                    // we don't want to bother dispatching to controllers who have no discovered tests
                    if (element.children.size > 0 && visibleChildren * 2 >= element.children.size) {
                        include.push(element.test);
                        element.children.forEach(c => attempt(c, true));
                    }
                    else {
                        element.children.forEach(c => attempt(c, false));
                    }
                }
                else {
                    attempt(element, false);
                }
            }
            return { include, exclude };
        }
        /**
         * @override
         */
        renderBody(container) {
            super.renderBody(container);
            this.container = dom.append(container, dom.$('.test-explorer'));
            this.treeHeader = dom.append(this.container, dom.$('.test-explorer-header'));
            this.filterActionBar.value = this.createFilterActionBar();
            const messagesContainer = dom.append(this.treeHeader, dom.$('.test-explorer-messages'));
            this._register(this.testProgressService.onTextChange(text => {
                const hadText = !!messagesContainer.innerText;
                const hasText = !!text;
                messagesContainer.innerText = text;
                if (hadText !== hasText) {
                    this.layoutBody();
                }
            }));
            const listContainer = dom.append(this.container, dom.$('.test-explorer-tree'));
            this.viewModel = this.instantiationService.createInstance(TestingExplorerViewModel, listContainer, this.onDidChangeBodyVisibility);
            this._register(this.viewModel.onChangeWelcomeVisibility(() => this._onDidChangeViewWelcomeState.fire()));
            this._register(this.viewModel);
            this._onDidChangeViewWelcomeState.fire();
        }
        /** @override  */
        getActionViewItem(action) {
            switch (action.id) {
                case "workbench.actions.treeView.testExplorer.filter" /* TestCommandId.FilterAction */:
                    return this.filter = this.instantiationService.createInstance(testingExplorerFilter_1.TestingExplorerFilter, action);
                case "testing.runSelected" /* TestCommandId.RunSelectedAction */:
                    return this.getRunGroupDropdown(2 /* TestRunProfileBitset.Run */, action);
                case "testing.debugSelected" /* TestCommandId.DebugSelectedAction */:
                    return this.getRunGroupDropdown(4 /* TestRunProfileBitset.Debug */, action);
                default:
                    return super.getActionViewItem(action);
            }
        }
        /** @inheritdoc */
        getTestConfigGroupActions(group) {
            const profileActions = [];
            let participatingGroups = 0;
            let hasConfigurable = false;
            const defaults = this.testProfileService.getGroupDefaultProfiles(group);
            for (const { profiles, controller } of this.testProfileService.all()) {
                let hasAdded = false;
                for (const profile of profiles) {
                    if (profile.group !== group) {
                        continue;
                    }
                    if (!hasAdded) {
                        hasAdded = true;
                        participatingGroups++;
                        profileActions.push(new actions_1.Action(`${controller.id}.$root`, controller.label.value, undefined, false));
                    }
                    hasConfigurable = hasConfigurable || profile.hasConfigurationHandler;
                    profileActions.push(new actions_1.Action(`${controller.id}.${profile.profileId}`, defaults.includes(profile) ? (0, nls_1.localize)('defaultTestProfile', '{0} (Default)', profile.label) : profile.label, undefined, undefined, () => {
                        const { include, exclude } = this.getSelectedOrVisibleItems(profile);
                        this.testService.runResolvedTests({
                            exclude: exclude.map(e => e.item.extId),
                            targets: [{
                                    profileGroup: profile.group,
                                    profileId: profile.profileId,
                                    controllerId: profile.controllerId,
                                    testIds: include.map(i => i.item.extId),
                                }]
                        });
                    }));
                }
            }
            // If there's only one group, don't add a heading for it in the dropdown.
            if (participatingGroups === 1) {
                profileActions.shift();
            }
            let postActions = [];
            if (profileActions.length > 1) {
                postActions.push(new actions_1.Action('selectDefaultTestConfigurations', (0, nls_1.localize)('selectDefaultConfigs', 'Select Default Profile'), undefined, undefined, () => this.commandService.executeCommand("testing.selectDefaultTestProfiles" /* TestCommandId.SelectDefaultTestProfiles */, group)));
            }
            if (hasConfigurable) {
                postActions.push(new actions_1.Action('configureTestProfiles', (0, nls_1.localize)('configureTestProfiles', 'Configure Test Profiles'), undefined, undefined, () => this.commandService.executeCommand("testing.configureProfile" /* TestCommandId.ConfigureTestProfilesAction */, group)));
            }
            return actions_1.Separator.join(profileActions, postActions);
        }
        /**
         * @override
         */
        saveState() {
            var _a;
            (_a = this.filter) === null || _a === void 0 ? void 0 : _a.saveState();
            super.saveState();
        }
        getRunGroupDropdown(group, defaultAction) {
            const dropdownActions = this.getTestConfigGroupActions(group);
            if (dropdownActions.length < 2) {
                return super.getActionViewItem(defaultAction);
            }
            const primaryAction = this.instantiationService.createInstance(actions_2.MenuItemAction, {
                id: defaultAction.id,
                title: defaultAction.label,
                icon: group === 2 /* TestRunProfileBitset.Run */
                    ? icons.testingRunAllIcon
                    : icons.testingDebugAllIcon,
            }, undefined, undefined);
            const dropdownAction = new actions_1.Action('selectRunConfig', 'Select Configuration...', 'codicon-chevron-down', true);
            return this.instantiationService.createInstance(dropdownWithPrimaryActionViewItem_1.DropdownWithPrimaryActionViewItem, primaryAction, dropdownAction, dropdownActions, '', this.contextMenuService, {});
        }
        createFilterActionBar() {
            const bar = new actionbar_1.ActionBar(this.treeHeader, {
                actionViewItemProvider: action => this.getActionViewItem(action),
                triggerKeys: { keyDown: false, keys: [] },
            });
            bar.push(new actions_1.Action("workbench.actions.treeView.testExplorer.filter" /* TestCommandId.FilterAction */));
            bar.getContainer().classList.add('testing-filter-action-bar');
            return bar;
        }
        updateDiscoveryProgress(busy) {
            if (!busy && this.discoveryProgress) {
                this.discoveryProgress.clear();
            }
            else if (busy && !this.discoveryProgress.value) {
                this.discoveryProgress.value = this.instantiationService.createInstance(progress_1.UnmanagedProgress, { location: this.getProgressLocation() });
            }
        }
        /**
         * @override
         */
        layoutBody(height = this.dimensions.height, width = this.dimensions.width) {
            var _a;
            super.layoutBody(height, width);
            this.dimensions.height = height;
            this.dimensions.width = width;
            this.container.style.height = `${height}px`;
            this.viewModel.layout(height - this.treeHeader.clientHeight, width);
            (_a = this.filter) === null || _a === void 0 ? void 0 : _a.layout(width);
        }
    };
    TestingExplorerView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, opener_1.IOpenerService),
        __param(8, themeService_1.IThemeService),
        __param(9, testService_1.ITestService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, testingProgressUiService_1.ITestingProgressUiService),
        __param(12, testProfileService_1.ITestProfileService),
        __param(13, commands_1.ICommandService)
    ], TestingExplorerView);
    exports.TestingExplorerView = TestingExplorerView;
    var WelcomeExperience;
    (function (WelcomeExperience) {
        WelcomeExperience[WelcomeExperience["None"] = 0] = "None";
        WelcomeExperience[WelcomeExperience["ForWorkspace"] = 1] = "ForWorkspace";
        WelcomeExperience[WelcomeExperience["ForDocument"] = 2] = "ForDocument";
    })(WelcomeExperience || (WelcomeExperience = {}));
    let TestingExplorerViewModel = class TestingExplorerViewModel extends lifecycle_1.Disposable {
        constructor(listContainer, onDidChangeVisibility, configurationService, editorService, menuService, contextMenuService, testService, filterState, instantiationService, storageService, contextKeyService, testResults, peekOpener, testProfileService) {
            super();
            this.menuService = menuService;
            this.contextMenuService = contextMenuService;
            this.testService = testService;
            this.filterState = filterState;
            this.instantiationService = instantiationService;
            this.storageService = storageService;
            this.contextKeyService = contextKeyService;
            this.testResults = testResults;
            this.peekOpener = peekOpener;
            this.testProfileService = testProfileService;
            this.projection = this._register(new lifecycle_1.MutableDisposable());
            this.revealTimeout = new lifecycle_1.MutableDisposable();
            this._viewMode = testingContextKeys_1.TestingContextKeys.viewMode.bindTo(this.contextKeyService);
            this._viewSorting = testingContextKeys_1.TestingContextKeys.viewSorting.bindTo(this.contextKeyService);
            this.welcomeVisibilityEmitter = new event_1.Emitter();
            this.actionRunner = new TestExplorerActionRunner(() => this.tree.getSelection().filter(types_1.isDefined));
            this.lastViewState = new storedValue_1.StoredValue({
                key: 'testing.treeState',
                scope: 1 /* StorageScope.WORKSPACE */,
                target: 1 /* StorageTarget.MACHINE */,
            }, this.storageService);
            /**
             * Whether there's a reveal request which has not yet been delivered. This
             * can happen if the user asks to reveal before the test tree is loaded.
             * We check to see if the reveal request is present on each tree update,
             * and do it then if so.
             */
            this.hasPendingReveal = false;
            /**
             * Fires when the visibility of the placeholder state changes.
             */
            this.onChangeWelcomeVisibility = this.welcomeVisibilityEmitter.event;
            /**
             * Gets whether the welcome should be visible.
             */
            this.welcomeExperience = 0 /* WelcomeExperience.None */;
            this.hasPendingReveal = !!filterState.reveal.value;
            this.noTestForDocumentWidget = this._register(instantiationService.createInstance(NoTestsForDocumentWidget, listContainer));
            this._viewMode.set(this.storageService.get('testing.viewMode', 1 /* StorageScope.WORKSPACE */, "true" /* TestExplorerViewMode.Tree */));
            this._viewSorting.set(this.storageService.get('testing.viewSorting', 1 /* StorageScope.WORKSPACE */, "location" /* TestExplorerViewSorting.ByLocation */));
            const labels = this._register(instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: onDidChangeVisibility }));
            this.reevaluateWelcomeState();
            this.filter = this.instantiationService.createInstance(TestsFilter, testService.collection);
            this.tree = instantiationService.createInstance(listService_1.WorkbenchObjectTree, 'Test Explorer List', listContainer, new ListDelegate(), [
                instantiationService.createInstance(TestItemRenderer, labels, this.actionRunner),
                instantiationService.createInstance(ErrorRenderer),
            ], {
                simpleKeyboardNavigation: true,
                identityProvider: instantiationService.createInstance(IdentityProvider),
                hideTwistiesOfChildlessElements: false,
                sorter: instantiationService.createInstance(TreeSorter, this),
                keyboardNavigationLabelProvider: instantiationService.createInstance(TreeKeyboardNavigationLabelProvider),
                accessibilityProvider: instantiationService.createInstance(ListAccessibilityProvider),
                filter: this.filter,
            });
            this._register(this.tree.onDidChangeCollapseState(evt => {
                var _a;
                if (evt.node.element instanceof index_1.TestItemTreeElement) {
                    (_a = this.projection.value) === null || _a === void 0 ? void 0 : _a.expandElement(evt.node.element, evt.deep ? Infinity : 0);
                }
            }));
            this._register(onDidChangeVisibility(visible => {
                if (visible) {
                    this.ensureProjection();
                }
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            this._register(event_1.Event.any(filterState.text.onDidChange, filterState.fuzzy.onDidChange, testService.excluded.onTestExclusionsChanged)(this.tree.refilter, this.tree));
            this._register(this.tree);
            this._register(this.onChangeWelcomeVisibility(e => {
                this.noTestForDocumentWidget.setVisible(e === 2 /* WelcomeExperience.ForDocument */);
            }));
            this._register(dom.addStandardDisposableListener(this.tree.getHTMLElement(), 'keydown', evt => {
                if (evt.equals(3 /* KeyCode.Enter */)) {
                    this.handleExecuteKeypress(evt);
                }
                else if (listWidget_1.DefaultKeyboardNavigationDelegate.mightProducePrintableCharacter(evt)) {
                    filterState.text.value = evt.browserEvent.key;
                    filterState.focusInput();
                }
            }));
            this._register(filterState.reveal.onDidChange(id => this.revealById(id, undefined, false)));
            this._register(onDidChangeVisibility(visible => {
                if (visible) {
                    filterState.focusInput();
                }
            }));
            this._register(this.tree.onDidChangeSelection(evt => {
                if (evt.browserEvent instanceof MouseEvent && (evt.browserEvent.altKey || evt.browserEvent.shiftKey)) {
                    return; // don't focus when alt-clicking to multi select
                }
                const selected = evt.elements[0];
                if (selected && evt.browserEvent && selected instanceof index_1.TestItemTreeElement
                    && selected.children.size === 0 && selected.test.expand === 0 /* TestItemExpandState.NotExpandable */) {
                    this.tryPeekError(selected);
                }
            }));
            let followRunningTests = (0, configuration_2.getTestingConfiguration)(configurationService, "testing.followRunningTest" /* TestingConfigKeys.FollowRunningTest */);
            this._register(configurationService.onDidChangeConfiguration(() => {
                followRunningTests = (0, configuration_2.getTestingConfiguration)(configurationService, "testing.followRunningTest" /* TestingConfigKeys.FollowRunningTest */);
            }));
            this._register(testResults.onTestChanged(evt => {
                if (!followRunningTests) {
                    return;
                }
                if (evt.reason !== 1 /* TestResultItemChangeReason.OwnStateChange */) {
                    return;
                }
                // follow running tests, or tests whose state changed. Tests that
                // complete very fast may not enter the running state at all.
                if (evt.item.ownComputedState !== 2 /* TestResultState.Running */ && !(evt.previousState === 1 /* TestResultState.Queued */ && (0, testingStates_1.isStateWithResult)(evt.item.ownComputedState))) {
                    return;
                }
                this.revealById(evt.item.item.extId, false, false);
            }));
            this._register(testResults.onResultsChanged(() => {
                this.tree.resort(null);
            }));
            this._register(this.testProfileService.onDidChange(() => {
                this.tree.rerender();
            }));
            const onEditorChange = () => {
                var _a;
                this.filter.filterToDocumentUri((_a = editorService.activeEditor) === null || _a === void 0 ? void 0 : _a.resource);
                if (this.filterState.isFilteringFor("@doc" /* TestFilterTerm.CurrentDoc */)) {
                    this.tree.refilter();
                }
            };
            this._register(editorService.onDidActiveEditorChange(onEditorChange));
            this._register(this.storageService.onWillSaveState(({ reason }) => {
                if (reason === storage_1.WillSaveStateReason.SHUTDOWN) {
                    this.lastViewState.store(this.tree.getViewState({
                        getId: e => e instanceof index_1.TestItemTreeElement ? e.test.item.extId : '',
                    }));
                }
            }));
            onEditorChange();
        }
        get viewMode() {
            var _a;
            return (_a = this._viewMode.get()) !== null && _a !== void 0 ? _a : "true" /* TestExplorerViewMode.Tree */;
        }
        set viewMode(newMode) {
            if (newMode === this._viewMode.get()) {
                return;
            }
            this._viewMode.set(newMode);
            this.updatePreferredProjection();
            this.storageService.store('testing.viewMode', newMode, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
        }
        get viewSorting() {
            var _a;
            return (_a = this._viewSorting.get()) !== null && _a !== void 0 ? _a : "status" /* TestExplorerViewSorting.ByStatus */;
        }
        set viewSorting(newSorting) {
            if (newSorting === this._viewSorting.get()) {
                return;
            }
            this._viewSorting.set(newSorting);
            this.tree.resort(null);
            this.storageService.store('testing.viewSorting', newSorting, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
        }
        /**
         * Re-layout the tree.
         */
        layout(height, width) {
            this.tree.layout(height, width);
        }
        /**
         * Tries to reveal by extension ID. Queues the request if the extension
         * ID is not currently available.
         */
        revealById(id, expand = true, focus = true) {
            if (!id) {
                this.hasPendingReveal = false;
                return;
            }
            const projection = this.ensureProjection();
            // If the item itself is visible in the tree, show it. Otherwise, expand
            // its closest parent.
            let expandToLevel = 0;
            const idPath = [...testId_1.TestId.fromString(id).idsFromRoot()];
            for (let i = idPath.length - 1; i >= expandToLevel; i--) {
                const element = projection.getElementByTestId(idPath[i].toString());
                // Skip all elements that aren't in the tree.
                if (!element || !this.tree.hasElement(element)) {
                    continue;
                }
                // If this 'if' is true, we're at the closest-visible parent to the node
                // we want to expand. Expand that, and then start the loop again because
                // we might already have children for it.
                if (i < idPath.length - 1) {
                    if (expand) {
                        this.tree.expand(element);
                        expandToLevel = i + 1; // avoid an infinite loop if the test does not exist
                        i = idPath.length - 1; // restart the loop since new children may now be visible
                        continue;
                    }
                }
                // Otherwise, we've arrived!
                // If the node or any of its children are excluded, flip on the 'show
                // excluded tests' checkbox automatically. If we didn't expand, then set
                // target focus target to the first collapsed element.
                let focusTarget = element;
                for (let n = element; n instanceof index_1.TestItemTreeElement; n = n.parent) {
                    if (n.test && this.testService.excluded.contains(n.test)) {
                        this.filterState.toggleFilteringFor("@hidden" /* TestFilterTerm.Hidden */, true);
                        break;
                    }
                    if (!expand && (this.tree.hasElement(n) && this.tree.isCollapsed(n))) {
                        focusTarget = n;
                    }
                }
                this.filterState.reveal.value = undefined;
                this.hasPendingReveal = false;
                if (focus) {
                    this.tree.domFocus();
                }
                if (this.tree.getRelativeTop(focusTarget) === null) {
                    this.tree.reveal(focusTarget, 0.5);
                }
                this.revealTimeout.value = (0, async_1.disposableTimeout)(() => {
                    this.tree.setFocus([focusTarget]);
                    this.tree.setSelection([focusTarget]);
                }, 1);
                return;
            }
            // If here, we've expanded all parents we can. Waiting on data to come
            // in to possibly show the revealed test.
            this.hasPendingReveal = true;
        }
        /**
         * Collapse all items in the tree.
         */
        async collapseAll() {
            this.tree.collapseAll();
        }
        /**
         * Tries to peek the first test error, if the item is in a failed state.
         */
        tryPeekError(item) {
            const lookup = item.test && this.testResults.getStateById(item.test.item.extId);
            return lookup && lookup[1].tasks.some(s => (0, testingStates_1.isFailedState)(s.state))
                ? this.peekOpener.tryPeekFirstError(lookup[0], lookup[1], { preserveFocus: true })
                : false;
        }
        onContextMenu(evt) {
            const element = evt.element;
            if (!(element instanceof index_1.TestItemTreeElement)) {
                return;
            }
            const actions = getActionableElementActions(this.contextKeyService, this.menuService, this.testService, this.testProfileService, element);
            this.contextMenuService.showContextMenu({
                getAnchor: () => evt.anchor,
                getActions: () => actions.value.secondary,
                getActionsContext: () => element,
                onHide: () => actions.dispose(),
                actionRunner: this.actionRunner,
            });
        }
        handleExecuteKeypress(evt) {
            var _a;
            const focused = this.tree.getFocus();
            const selected = this.tree.getSelection();
            let targeted;
            if (focused.length === 1 && selected.includes(focused[0])) {
                (_a = evt.browserEvent) === null || _a === void 0 ? void 0 : _a.preventDefault();
                targeted = selected;
            }
            else {
                targeted = focused;
            }
            const toRun = targeted
                .filter((e) => e instanceof index_1.TestItemTreeElement);
            if (toRun.length) {
                this.testService.runTests({
                    group: 2 /* TestRunProfileBitset.Run */,
                    tests: toRun.map(t => t.test),
                });
            }
        }
        reevaluateWelcomeState() {
            const shouldShowWelcome = this.testService.collection.busyProviders === 0 && (0, testService_1.testCollectionIsEmpty)(this.testService.collection);
            const welcomeExperience = shouldShowWelcome
                ? (this.filterState.isFilteringFor("@doc" /* TestFilterTerm.CurrentDoc */) ? 2 /* WelcomeExperience.ForDocument */ : 1 /* WelcomeExperience.ForWorkspace */)
                : 0 /* WelcomeExperience.None */;
            if (welcomeExperience !== this.welcomeExperience) {
                this.welcomeExperience = welcomeExperience;
                this.welcomeVisibilityEmitter.fire(welcomeExperience);
            }
        }
        ensureProjection() {
            var _a;
            return (_a = this.projection.value) !== null && _a !== void 0 ? _a : this.updatePreferredProjection();
        }
        updatePreferredProjection() {
            var _a;
            this.projection.clear();
            const lastState = abstractTree_1.AbstractTreeViewState.lift((_a = this.lastViewState.get()) !== null && _a !== void 0 ? _a : abstractTree_1.AbstractTreeViewState.empty());
            if (this._viewMode.get() === "list" /* TestExplorerViewMode.List */) {
                this.projection.value = this.instantiationService.createInstance(hierarchalByName_1.HierarchicalByNameProjection, lastState);
            }
            else {
                this.projection.value = this.instantiationService.createInstance(hierarchalByLocation_1.HierarchicalByLocationProjection, lastState);
            }
            const scheduler = new async_1.RunOnceScheduler(() => this.applyProjectionChanges(), 200);
            this.projection.value.onUpdate(() => {
                if (!scheduler.isScheduled()) {
                    scheduler.schedule();
                }
            });
            this.applyProjectionChanges();
            return this.projection.value;
        }
        applyProjectionChanges() {
            var _a;
            this.reevaluateWelcomeState();
            (_a = this.projection.value) === null || _a === void 0 ? void 0 : _a.applyTo(this.tree);
            if (this.hasPendingReveal) {
                this.revealById(this.filterState.reveal.value);
            }
        }
        /**
         * Gets the selected tests from the tree.
         */
        getSelectedTests() {
            return this.tree.getSelection();
        }
    };
    TestingExplorerViewModel = __decorate([
        __param(2, configuration_1.IConfigurationService),
        __param(3, editorService_1.IEditorService),
        __param(4, actions_2.IMenuService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, testService_1.ITestService),
        __param(7, testExplorerFilterState_1.ITestExplorerFilterState),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, storage_1.IStorageService),
        __param(10, contextkey_1.IContextKeyService),
        __param(11, testResultService_1.ITestResultService),
        __param(12, testingPeekOpener_1.ITestingPeekOpener),
        __param(13, testProfileService_1.ITestProfileService)
    ], TestingExplorerViewModel);
    exports.TestingExplorerViewModel = TestingExplorerViewModel;
    var FilterResult;
    (function (FilterResult) {
        FilterResult[FilterResult["Exclude"] = 0] = "Exclude";
        FilterResult[FilterResult["Inherit"] = 1] = "Inherit";
        FilterResult[FilterResult["Include"] = 2] = "Include";
    })(FilterResult || (FilterResult = {}));
    const hasNodeInOrParentOfUri = (collection, ident, testUri, fromNode) => {
        const queue = [fromNode ? [fromNode] : collection.rootIds];
        while (queue.length) {
            for (const id of queue.pop()) {
                const node = collection.getNodeById(id);
                if (!node) {
                    continue;
                }
                if (!node.item.uri || !ident.extUri.isEqualOrParent(testUri, node.item.uri)) {
                    continue;
                }
                // Only show nodes that can be expanded (and might have a child with
                // a range) or ones that have a physical location.
                if (node.item.range || node.expand === 1 /* TestItemExpandState.Expandable */) {
                    return true;
                }
                queue.push(node.children);
            }
        }
        return false;
    };
    let TestsFilter = class TestsFilter {
        constructor(collection, state, testService, uriIdentityService) {
            this.collection = collection;
            this.state = state;
            this.testService = testService;
            this.uriIdentityService = uriIdentityService;
        }
        /**
         * @inheritdoc
         */
        filter(element) {
            if (element instanceof index_1.TestTreeErrorMessage) {
                return 1 /* TreeVisibility.Visible */;
            }
            if (element.test
                && !this.state.isFilteringFor("@hidden" /* TestFilterTerm.Hidden */)
                && this.testService.excluded.contains(element.test)) {
                return 0 /* TreeVisibility.Hidden */;
            }
            switch (Math.min(this.testFilterText(element), this.testLocation(element), this.testState(element), this.testTags(element))) {
                case 0 /* FilterResult.Exclude */:
                    return 0 /* TreeVisibility.Hidden */;
                case 2 /* FilterResult.Include */:
                    return 1 /* TreeVisibility.Visible */;
                default:
                    return 2 /* TreeVisibility.Recurse */;
            }
        }
        filterToDocumentUri(uri) {
            this.documentUri = uri;
        }
        testTags(element) {
            if (!this.state.includeTags.size && !this.state.excludeTags.size) {
                return 2 /* FilterResult.Include */;
            }
            return (this.state.includeTags.size ?
                element.test.item.tags.some(t => this.state.includeTags.has(t)) :
                true) && element.test.item.tags.every(t => !this.state.excludeTags.has(t))
                ? 2 /* FilterResult.Include */
                : 1 /* FilterResult.Inherit */;
        }
        testState(element) {
            if (this.state.isFilteringFor("@failed" /* TestFilterTerm.Failed */)) {
                return (0, testingStates_1.isFailedState)(element.state) ? 2 /* FilterResult.Include */ : 1 /* FilterResult.Inherit */;
            }
            if (this.state.isFilteringFor("@executed" /* TestFilterTerm.Executed */)) {
                return element.state !== 0 /* TestResultState.Unset */ ? 2 /* FilterResult.Include */ : 1 /* FilterResult.Inherit */;
            }
            return 2 /* FilterResult.Include */;
        }
        testLocation(element) {
            if (!this.documentUri) {
                return 2 /* FilterResult.Include */;
            }
            if (!this.state.isFilteringFor("@doc" /* TestFilterTerm.CurrentDoc */) || !(element instanceof index_1.TestItemTreeElement)) {
                return 2 /* FilterResult.Include */;
            }
            if (hasNodeInOrParentOfUri(this.collection, this.uriIdentityService, this.documentUri, element.test.item.extId)) {
                return 2 /* FilterResult.Include */;
            }
            return 1 /* FilterResult.Inherit */;
        }
        testFilterText(element) {
            if (this.state.globList.length === 0) {
                return 2 /* FilterResult.Include */;
            }
            const fuzzy = this.state.fuzzy.value;
            for (let e = element; e; e = e.parent) {
                // start as included if the first glob is a negation
                let included = this.state.globList[0].include === false ? 2 /* FilterResult.Include */ : 1 /* FilterResult.Inherit */;
                const data = e.label.toLowerCase();
                for (const { include, text } of this.state.globList) {
                    if (fuzzy ? (0, strings_1.fuzzyContains)(data, text) : data.includes(text)) {
                        included = include ? 2 /* FilterResult.Include */ : 0 /* FilterResult.Exclude */;
                    }
                }
                if (included !== 1 /* FilterResult.Inherit */) {
                    return included;
                }
            }
            return 1 /* FilterResult.Inherit */;
        }
    };
    TestsFilter = __decorate([
        __param(1, testExplorerFilterState_1.ITestExplorerFilterState),
        __param(2, testService_1.ITestService),
        __param(3, uriIdentity_1.IUriIdentityService)
    ], TestsFilter);
    class TreeSorter {
        constructor(viewModel) {
            this.viewModel = viewModel;
        }
        compare(a, b) {
            if (a instanceof index_1.TestTreeErrorMessage || b instanceof index_1.TestTreeErrorMessage) {
                return (a instanceof index_1.TestTreeErrorMessage ? -1 : 0) + (b instanceof index_1.TestTreeErrorMessage ? 1 : 0);
            }
            const durationDelta = (b.duration || 0) - (a.duration || 0);
            if (this.viewModel.viewSorting === "duration" /* TestExplorerViewSorting.ByDuration */ && durationDelta !== 0) {
                return durationDelta;
            }
            const stateDelta = (0, testingStates_1.cmpPriority)(a.state, b.state);
            if (this.viewModel.viewSorting === "status" /* TestExplorerViewSorting.ByStatus */ && stateDelta !== 0) {
                return stateDelta;
            }
            if (a instanceof index_1.TestItemTreeElement && b instanceof index_1.TestItemTreeElement && a.test.item.uri && b.test.item.uri && a.test.item.uri.toString() === b.test.item.uri.toString() && a.test.item.range && b.test.item.range) {
                const delta = a.test.item.range.startLineNumber - b.test.item.range.startLineNumber;
                if (delta !== 0) {
                    return delta;
                }
            }
            return (a.sortText || a.label).localeCompare(b.sortText || b.label);
        }
    }
    let NoTestsForDocumentWidget = class NoTestsForDocumentWidget extends lifecycle_1.Disposable {
        constructor(container, filterState, themeService) {
            super();
            const el = this.el = dom.append(container, dom.$('.testing-no-test-placeholder'));
            const emptyParagraph = dom.append(el, dom.$('p'));
            emptyParagraph.innerText = (0, nls_1.localize)('testingNoTest', 'No tests were found in this file.');
            const buttonLabel = (0, nls_1.localize)('testingFindExtension', 'Show Workspace Tests');
            const button = this._register(new button_1.Button(el, { title: buttonLabel }));
            button.label = buttonLabel;
            this._register((0, styler_1.attachButtonStyler)(button, themeService));
            this._register(button.onDidClick(() => filterState.toggleFilteringFor("@doc" /* TestFilterTerm.CurrentDoc */, false)));
        }
        setVisible(isVisible) {
            this.el.classList.toggle('visible', isVisible);
        }
    };
    NoTestsForDocumentWidget = __decorate([
        __param(1, testExplorerFilterState_1.ITestExplorerFilterState),
        __param(2, themeService_1.IThemeService)
    ], NoTestsForDocumentWidget);
    class TestExplorerActionRunner extends actions_1.ActionRunner {
        constructor(getSelectedTests) {
            super();
            this.getSelectedTests = getSelectedTests;
        }
        async runAction(action, context) {
            if (!(action instanceof actions_2.MenuItemAction)) {
                return super.runAction(action, context);
            }
            const selection = this.getSelectedTests();
            const contextIsSelected = selection.some(s => s === context);
            const actualContext = contextIsSelected ? selection : [context];
            const actionable = actualContext.filter((t) => t instanceof index_1.TestItemTreeElement);
            await action.run(...actionable);
        }
    }
    const getLabelForTestTreeElement = (element) => {
        let label = (0, constants_1.labelForTestInState)(element.label, element.state);
        if (element instanceof index_1.TestItemTreeElement) {
            if (element.duration !== undefined) {
                label = (0, nls_1.localize)({
                    key: 'testing.treeElementLabelDuration',
                    comment: ['{0} is the original label in testing.treeElementLabel, {1} is a duration'],
                }, '{0}, in {1}', label, formatDuration(element.duration));
            }
        }
        return label;
    };
    class ListAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('testExplorer', "Test Explorer");
        }
        getAriaLabel(element) {
            return element instanceof index_1.TestTreeErrorMessage
                ? element.description
                : getLabelForTestTreeElement(element);
        }
    }
    class TreeKeyboardNavigationLabelProvider {
        getKeyboardNavigationLabel(element) {
            return element instanceof index_1.TestTreeErrorMessage ? element.message : element.label;
        }
    }
    class ListDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof index_1.TestTreeErrorMessage) {
                return ErrorRenderer.ID;
            }
            return TestItemRenderer.ID;
        }
    }
    class IdentityProvider {
        getId(element) {
            return element.treeId;
        }
    }
    let ErrorRenderer = class ErrorRenderer {
        constructor(instantionService) {
            this.renderer = instantionService.createInstance(markdownRenderer_1.MarkdownRenderer, {});
        }
        get templateId() {
            return ErrorRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, dom.$('.error'));
            return { label };
        }
        renderElement({ element }, _, data) {
            if (typeof element.message === 'string') {
                data.label.innerText = element.message;
            }
            else {
                const result = this.renderer.render(element.message, { inline: true });
                data.label.appendChild(result.element);
            }
            data.label.title = element.description;
        }
        disposeTemplate() {
            // noop
        }
    };
    ErrorRenderer.ID = 'error';
    ErrorRenderer = __decorate([
        __param(0, instantiation_1.IInstantiationService)
    ], ErrorRenderer);
    let ActionableItemTemplateData = class ActionableItemTemplateData extends lifecycle_1.Disposable {
        constructor(labels, actionRunner, menuService, testService, profiles, contextKeyService, instantiationService) {
            super();
            this.labels = labels;
            this.actionRunner = actionRunner;
            this.menuService = menuService;
            this.testService = testService;
            this.profiles = profiles;
            this.contextKeyService = contextKeyService;
            this.instantiationService = instantiationService;
        }
        /**
         * @inheritdoc
         */
        renderTemplate(container) {
            const wrapper = dom.append(container, dom.$('.test-item'));
            const icon = dom.append(wrapper, dom.$('.computed-state'));
            const name = dom.append(wrapper, dom.$('.name'));
            const label = this.labels.create(name, { supportHighlights: true });
            dom.append(wrapper, dom.$(themeService_1.ThemeIcon.asCSSSelector(icons.testingHiddenIcon)));
            const actionBar = new actionbar_1.ActionBar(wrapper, {
                actionRunner: this.actionRunner,
                actionViewItemProvider: action => action instanceof actions_2.MenuItemAction
                    ? this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, undefined)
                    : undefined
            });
            return { wrapper, label, actionBar, icon, elementDisposable: [], templateDisposable: [label, actionBar] };
        }
        /**
         * @inheritdoc
         */
        renderElement({ element }, _, data) {
            this.fillActionBar(element, data);
        }
        /**
         * @inheritdoc
         */
        disposeTemplate(templateData) {
            (0, lifecycle_1.dispose)(templateData.templateDisposable);
            templateData.templateDisposable = [];
        }
        /**
         * @inheritdoc
         */
        disposeElement(_element, _, templateData) {
            (0, lifecycle_1.dispose)(templateData.elementDisposable);
            templateData.elementDisposable = [];
        }
        fillActionBar(element, data) {
            const actions = getActionableElementActions(this.contextKeyService, this.menuService, this.testService, this.profiles, element);
            data.elementDisposable.push(actions);
            data.actionBar.clear();
            data.actionBar.context = element;
            data.actionBar.push(actions.value.primary, { icon: true, label: false });
        }
    };
    ActionableItemTemplateData = __decorate([
        __param(2, actions_2.IMenuService),
        __param(3, testService_1.ITestService),
        __param(4, testProfileService_1.ITestProfileService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, instantiation_1.IInstantiationService)
    ], ActionableItemTemplateData);
    class TestItemRenderer extends ActionableItemTemplateData {
        /**
         * @inheritdoc
         */
        get templateId() {
            return TestItemRenderer.ID;
        }
        /**
         * @inheritdoc
         */
        renderElement(node, depth, data) {
            super.renderElement(node, depth, data);
            const label = { name: node.element.label };
            const options = {};
            data.label.setResource(label, options);
            const testHidden = this.testService.excluded.contains(node.element.test);
            data.wrapper.classList.toggle('test-is-hidden', testHidden);
            const icon = icons.testingStatesToIcons.get(node.element.test.expand === 2 /* TestItemExpandState.BusyExpanding */ || node.element.test.item.busy
                ? 2 /* TestResultState.Running */
                : node.element.state);
            data.icon.className = 'computed-state ' + (icon ? themeService_1.ThemeIcon.asClassName(icon) : '');
            label.resource = node.element.test.item.uri;
            options.title = getLabelForTestTreeElement(node.element);
            options.fileKind = files_1.FileKind.FILE;
            label.description = node.element.description || undefined;
            if (node.element.duration !== undefined) {
                label.description = label.description
                    ? `${label.description}: ${formatDuration(node.element.duration)}`
                    : formatDuration(node.element.duration);
            }
            data.label.setResource(label, options);
        }
    }
    TestItemRenderer.ID = 'testItem';
    const formatDuration = (ms) => {
        if (ms < 10) {
            return `${ms.toFixed(1)}ms`;
        }
        if (ms < 1000) {
            return `${ms.toFixed(0)}ms`;
        }
        return `${(ms / 1000).toFixed(1)}s`;
    };
    const getActionableElementActions = (contextKeyService, menuService, testService, profiles, element) => {
        var _a;
        const test = element instanceof index_1.TestItemTreeElement ? element.test : undefined;
        const contextKeys = (0, testItemContextOverlay_1.getTestItemContextOverlay)(test, test ? profiles.capabilitiesForTest(test) : 0);
        contextKeys.push(['view', "workbench.view.testing" /* Testing.ExplorerViewId */]);
        if (test) {
            contextKeys.push([
                testingContextKeys_1.TestingContextKeys.canRefreshTests.key,
                testId_1.TestId.isRoot(test.item.extId) && ((_a = testService.getTestController(test.item.extId)) === null || _a === void 0 ? void 0 : _a.canRefresh.value)
            ]);
            contextKeys.push([
                testingContextKeys_1.TestingContextKeys.testItemIsHidden.key,
                testService.excluded.contains(test)
            ]);
        }
        const contextOverlay = contextKeyService.createOverlay(contextKeys);
        const menu = menuService.createMenu(actions_2.MenuId.TestItem, contextOverlay);
        try {
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            const actionsDisposable = (0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, {
                shouldForwardArgs: true,
            }, result, 'inline');
            return { value: result, dispose: () => actionsDisposable.dispose };
        }
        finally {
            menu.dispose();
        }
    };
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        if (theme.type === 'dark') {
            const foregroundColor = theme.getColor(colorRegistry_1.foreground);
            if (foregroundColor) {
                const fgWithOpacity = new color_1.Color(new color_1.RGBA(foregroundColor.rgba.r, foregroundColor.rgba.g, foregroundColor.rgba.b, 0.65));
                collector.addRule(`.test-explorer .test-explorer-messages { color: ${fgWithOpacity}; }`);
            }
        }
    });
});
//# sourceMappingURL=testingExplorerView.js.map