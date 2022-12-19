/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/idGenerator", "vs/base/common/lifecycle", "vs/base/common/event", "vs/base/common/errors", "vs/base/browser/ui/toolbar/toolbar", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/progressbar/progressbar", "vs/workbench/browser/part", "vs/workbench/services/progress/browser/progressIndicator", "vs/platform/instantiation/common/serviceCollection", "vs/platform/progress/common/progress", "vs/platform/theme/common/styler", "vs/base/browser/dom", "vs/base/common/types", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/css!./media/compositepart"], function (require, exports, nls_1, idGenerator_1, lifecycle_1, event_1, errors_1, toolbar_1, actionbar_1, progressbar_1, part_1, progressIndicator_1, serviceCollection_1, progress_1, styler_1, dom_1, types_1, menuEntryActionViewItem_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompositePart = void 0;
    class CompositePart extends part_1.Part {
        constructor(notificationService, storageService, telemetryService, contextMenuService, layoutService, keybindingService, instantiationService, themeService, registry, activeCompositeSettingsKey, defaultCompositeId, nameForTelemetry, compositeCSSClass, titleForegroundColor, id, options) {
            super(id, options, themeService, storageService, layoutService);
            this.notificationService = notificationService;
            this.storageService = storageService;
            this.telemetryService = telemetryService;
            this.contextMenuService = contextMenuService;
            this.keybindingService = keybindingService;
            this.instantiationService = instantiationService;
            this.registry = registry;
            this.activeCompositeSettingsKey = activeCompositeSettingsKey;
            this.defaultCompositeId = defaultCompositeId;
            this.nameForTelemetry = nameForTelemetry;
            this.compositeCSSClass = compositeCSSClass;
            this.titleForegroundColor = titleForegroundColor;
            this.onDidCompositeOpen = this._register(new event_1.Emitter());
            this.onDidCompositeClose = this._register(new event_1.Emitter());
            this.mapCompositeToCompositeContainer = new Map();
            this.mapActionsBindingToComposite = new Map();
            this.instantiatedCompositeItems = new Map();
            this.telemetryActionsListener = this._register(new lifecycle_1.MutableDisposable());
            this.lastActiveCompositeId = storageService.get(activeCompositeSettingsKey, 1 /* StorageScope.WORKSPACE */, this.defaultCompositeId);
        }
        openComposite(id, focus) {
            var _a;
            // Check if composite already visible and just focus in that case
            if (((_a = this.activeComposite) === null || _a === void 0 ? void 0 : _a.getId()) === id) {
                if (focus) {
                    this.activeComposite.focus();
                }
                // Fullfill promise with composite that is being opened
                return this.activeComposite;
            }
            // We cannot open the composite if we have not been created yet
            if (!this.element) {
                return;
            }
            // Open
            return this.doOpenComposite(id, focus);
        }
        doOpenComposite(id, focus = false) {
            var _a;
            // Use a generated token to avoid race conditions from long running promises
            const currentCompositeOpenToken = idGenerator_1.defaultGenerator.nextId();
            this.currentCompositeOpenToken = currentCompositeOpenToken;
            // Hide current
            if (this.activeComposite) {
                this.hideActiveComposite();
            }
            // Update Title
            this.updateTitle(id);
            // Create composite
            const composite = this.createComposite(id, true);
            // Check if another composite opened meanwhile and return in that case
            if ((this.currentCompositeOpenToken !== currentCompositeOpenToken) || (this.activeComposite && this.activeComposite.getId() !== composite.getId())) {
                return undefined;
            }
            // Check if composite already visible and just focus in that case
            if (((_a = this.activeComposite) === null || _a === void 0 ? void 0 : _a.getId()) === composite.getId()) {
                if (focus) {
                    composite.focus();
                }
                this.onDidCompositeOpen.fire({ composite, focus });
                return composite;
            }
            // Show Composite and Focus
            this.showComposite(composite);
            if (focus) {
                composite.focus();
            }
            // Return with the composite that is being opened
            if (composite) {
                this.onDidCompositeOpen.fire({ composite, focus });
            }
            return composite;
        }
        createComposite(id, isActive) {
            // Check if composite is already created
            const compositeItem = this.instantiatedCompositeItems.get(id);
            if (compositeItem) {
                return compositeItem.composite;
            }
            // Instantiate composite from registry otherwise
            const compositeDescriptor = this.registry.getComposite(id);
            if (compositeDescriptor) {
                const compositeProgressIndicator = this.instantiationService.createInstance(progressIndicator_1.CompositeProgressIndicator, (0, types_1.assertIsDefined)(this.progressBar), compositeDescriptor.id, !!isActive);
                const compositeInstantiationService = this.instantiationService.createChild(new serviceCollection_1.ServiceCollection([progress_1.IEditorProgressService, compositeProgressIndicator] // provide the editor progress service for any editors instantiated within the composite
                ));
                const composite = compositeDescriptor.instantiate(compositeInstantiationService);
                const disposable = new lifecycle_1.DisposableStore();
                // Remember as Instantiated
                this.instantiatedCompositeItems.set(id, { composite, disposable, progress: compositeProgressIndicator });
                // Register to title area update events from the composite
                disposable.add(composite.onTitleAreaUpdate(() => this.onTitleAreaUpdate(composite.getId()), this));
                return composite;
            }
            throw new Error(`Unable to find composite with id ${id}`);
        }
        showComposite(composite) {
            // Remember Composite
            this.activeComposite = composite;
            // Store in preferences
            const id = this.activeComposite.getId();
            if (id !== this.defaultCompositeId) {
                this.storageService.store(this.activeCompositeSettingsKey, id, 1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            }
            else {
                this.storageService.remove(this.activeCompositeSettingsKey, 1 /* StorageScope.WORKSPACE */);
            }
            // Remember
            this.lastActiveCompositeId = this.activeComposite.getId();
            // Composites created for the first time
            let compositeContainer = this.mapCompositeToCompositeContainer.get(composite.getId());
            if (!compositeContainer) {
                // Build Container off-DOM
                compositeContainer = (0, dom_1.$)('.composite');
                compositeContainer.classList.add(...this.compositeCSSClass.split(' '));
                compositeContainer.id = composite.getId();
                composite.create(compositeContainer);
                composite.updateStyles();
                // Remember composite container
                this.mapCompositeToCompositeContainer.set(composite.getId(), compositeContainer);
            }
            // Fill Content and Actions
            // Make sure that the user meanwhile did not open another composite or closed the part containing the composite
            if (!this.activeComposite || composite.getId() !== this.activeComposite.getId()) {
                return undefined;
            }
            // Take Composite on-DOM and show
            const contentArea = this.getContentArea();
            if (contentArea) {
                contentArea.appendChild(compositeContainer);
            }
            (0, dom_1.show)(compositeContainer);
            // Setup action runner
            const toolBar = (0, types_1.assertIsDefined)(this.toolBar);
            toolBar.actionRunner = composite.getActionRunner();
            // Update title with composite title if it differs from descriptor
            const descriptor = this.registry.getComposite(composite.getId());
            if (descriptor && descriptor.name !== composite.getTitle()) {
                this.updateTitle(composite.getId(), composite.getTitle());
            }
            // Handle Composite Actions
            let actionsBinding = this.mapActionsBindingToComposite.get(composite.getId());
            if (!actionsBinding) {
                actionsBinding = this.collectCompositeActions(composite);
                this.mapActionsBindingToComposite.set(composite.getId(), actionsBinding);
            }
            actionsBinding();
            // Action Run Handling
            this.telemetryActionsListener.value = toolBar.actionRunner.onDidRun(e => {
                // Check for Error
                if (e.error && !(0, errors_1.isCancellationError)(e.error)) {
                    this.notificationService.error(e.error);
                }
                // Log in telemetry
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: this.nameForTelemetry });
            });
            // Indicate to composite that it is now visible
            composite.setVisible(true);
            // Make sure that the user meanwhile did not open another composite or closed the part containing the composite
            if (!this.activeComposite || composite.getId() !== this.activeComposite.getId()) {
                return;
            }
            // Make sure the composite is layed out
            if (this.contentAreaSize) {
                composite.layout(this.contentAreaSize);
            }
        }
        onTitleAreaUpdate(compositeId) {
            var _a;
            // Title
            const composite = this.instantiatedCompositeItems.get(compositeId);
            if (composite) {
                this.updateTitle(compositeId, composite.composite.getTitle());
            }
            // Active Composite
            if (((_a = this.activeComposite) === null || _a === void 0 ? void 0 : _a.getId()) === compositeId) {
                // Actions
                const actionsBinding = this.collectCompositeActions(this.activeComposite);
                this.mapActionsBindingToComposite.set(this.activeComposite.getId(), actionsBinding);
                actionsBinding();
            }
            // Otherwise invalidate actions binding for next time when the composite becomes visible
            else {
                this.mapActionsBindingToComposite.delete(compositeId);
            }
        }
        updateTitle(compositeId, compositeTitle) {
            const compositeDescriptor = this.registry.getComposite(compositeId);
            if (!compositeDescriptor || !this.titleLabel) {
                return;
            }
            if (!compositeTitle) {
                compositeTitle = compositeDescriptor.name;
            }
            const keybinding = this.keybindingService.lookupKeybinding(compositeId);
            this.titleLabel.updateTitle(compositeId, compositeTitle, (0, types_1.withNullAsUndefined)(keybinding === null || keybinding === void 0 ? void 0 : keybinding.getLabel()));
            const toolBar = (0, types_1.assertIsDefined)(this.toolBar);
            toolBar.setAriaLabel((0, nls_1.localize)('ariaCompositeToolbarLabel', "{0} actions", compositeTitle));
        }
        collectCompositeActions(composite) {
            // From Composite
            const primaryActions = (composite === null || composite === void 0 ? void 0 : composite.getActions().slice(0)) || [];
            const secondaryActions = (composite === null || composite === void 0 ? void 0 : composite.getSecondaryActions().slice(0)) || [];
            // Update context
            const toolBar = (0, types_1.assertIsDefined)(this.toolBar);
            toolBar.context = this.actionsContextProvider();
            // Return fn to set into toolbar
            return () => toolBar.setActions((0, actionbar_1.prepareActions)(primaryActions), (0, actionbar_1.prepareActions)(secondaryActions));
        }
        getActiveComposite() {
            return this.activeComposite;
        }
        getLastActiveCompositetId() {
            return this.lastActiveCompositeId;
        }
        hideActiveComposite() {
            if (!this.activeComposite) {
                return undefined; // Nothing to do
            }
            const composite = this.activeComposite;
            this.activeComposite = undefined;
            const compositeContainer = this.mapCompositeToCompositeContainer.get(composite.getId());
            // Indicate to Composite
            composite.setVisible(false);
            // Take Container Off-DOM and hide
            if (compositeContainer) {
                compositeContainer.remove();
                (0, dom_1.hide)(compositeContainer);
            }
            // Clear any running Progress
            if (this.progressBar) {
                this.progressBar.stop().hide();
            }
            // Empty Actions
            if (this.toolBar) {
                this.collectCompositeActions()();
            }
            this.onDidCompositeClose.fire(composite);
            return composite;
        }
        createTitleArea(parent) {
            // Title Area Container
            const titleArea = (0, dom_1.append)(parent, (0, dom_1.$)('.composite'));
            titleArea.classList.add('title');
            // Left Title Label
            this.titleLabel = this.createTitleLabel(titleArea);
            // Right Actions Container
            const titleActionsContainer = (0, dom_1.append)(titleArea, (0, dom_1.$)('.title-actions'));
            // Toolbar
            this.toolBar = this._register(new toolbar_1.ToolBar(titleActionsContainer, this.contextMenuService, {
                actionViewItemProvider: action => this.actionViewItemProvider(action),
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                getKeyBinding: action => this.keybindingService.lookupKeybinding(action.id),
                anchorAlignmentProvider: () => this.getTitleAreaDropDownAnchorAlignment(),
                toggleMenuTitle: (0, nls_1.localize)('viewsAndMoreActions', "Views and More Actions...")
            }));
            this.collectCompositeActions()();
            return titleArea;
        }
        createTitleLabel(parent) {
            const titleContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.title-label'));
            const titleLabel = (0, dom_1.append)(titleContainer, (0, dom_1.$)('h2'));
            this.titleLabelElement = titleLabel;
            const $this = this;
            return {
                updateTitle: (id, title, keybinding) => {
                    // The title label is shared for all composites in the base CompositePart
                    if (!this.activeComposite || this.activeComposite.getId() === id) {
                        titleLabel.innerText = title;
                        titleLabel.title = keybinding ? (0, nls_1.localize)('titleTooltip', "{0} ({1})", title, keybinding) : title;
                    }
                },
                updateStyles: () => {
                    titleLabel.style.color = $this.titleForegroundColor ? $this.getColor($this.titleForegroundColor) || '' : '';
                }
            };
        }
        updateStyles() {
            super.updateStyles();
            // Forward to title label
            const titleLabel = (0, types_1.assertIsDefined)(this.titleLabel);
            titleLabel.updateStyles();
        }
        actionViewItemProvider(action) {
            // Check Active Composite
            if (this.activeComposite) {
                return this.activeComposite.getActionViewItem(action);
            }
            return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action);
        }
        actionsContextProvider() {
            // Check Active Composite
            if (this.activeComposite) {
                return this.activeComposite.getActionsContext();
            }
            return null;
        }
        createContentArea(parent) {
            const contentContainer = (0, dom_1.append)(parent, (0, dom_1.$)('.content'));
            this.progressBar = this._register(new progressbar_1.ProgressBar(contentContainer));
            this._register((0, styler_1.attachProgressBarStyler)(this.progressBar, this.themeService));
            this.progressBar.hide();
            return contentContainer;
        }
        getProgressIndicator(id) {
            const compositeItem = this.instantiatedCompositeItems.get(id);
            return compositeItem ? compositeItem.progress : undefined;
        }
        getTitleAreaDropDownAnchorAlignment() {
            return 1 /* AnchorAlignment.RIGHT */;
        }
        layout(width, height, top, left) {
            super.layout(width, height, top, left);
            // Layout contents
            this.contentAreaSize = dom_1.Dimension.lift(super.layoutContents(width, height).contentSize);
            // Layout composite
            if (this.activeComposite) {
                this.activeComposite.layout(this.contentAreaSize);
            }
        }
        removeComposite(compositeId) {
            var _a;
            if (((_a = this.activeComposite) === null || _a === void 0 ? void 0 : _a.getId()) === compositeId) {
                return false; // do not remove active composite
            }
            this.mapCompositeToCompositeContainer.delete(compositeId);
            this.mapActionsBindingToComposite.delete(compositeId);
            const compositeItem = this.instantiatedCompositeItems.get(compositeId);
            if (compositeItem) {
                compositeItem.composite.dispose();
                (0, lifecycle_1.dispose)(compositeItem.disposable);
                this.instantiatedCompositeItems.delete(compositeId);
            }
            return true;
        }
        dispose() {
            this.mapCompositeToCompositeContainer.clear();
            this.mapActionsBindingToComposite.clear();
            this.instantiatedCompositeItems.forEach(compositeItem => {
                compositeItem.composite.dispose();
                (0, lifecycle_1.dispose)(compositeItem.disposable);
            });
            this.instantiatedCompositeItems.clear();
            super.dispose();
        }
    }
    exports.CompositePart = CompositePart;
});
//# sourceMappingURL=compositePart.js.map