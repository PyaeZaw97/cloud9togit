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
define(["require", "exports", "vs/nls", "vs/base/common/lifecycle", "vs/workbench/browser/part", "vs/base/browser/touch", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/statusbar/browser/statusbar", "vs/platform/contextview/browser/contextView", "vs/base/common/actions", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/workspace/common/workspace", "vs/platform/theme/common/colorRegistry", "vs/base/browser/dom", "vs/platform/storage/common/storage", "vs/workbench/services/layout/browser/layoutService", "vs/platform/instantiation/common/extensions", "vs/base/common/arrays", "vs/base/browser/mouseEvent", "vs/workbench/browser/actions/layoutActions", "vs/base/common/types", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/theme", "vs/base/common/hash", "vs/workbench/services/hover/browser/hover", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/statusbar/statusbarActions", "vs/workbench/browser/parts/statusbar/statusbarModel", "vs/workbench/browser/parts/statusbar/statusbarItem", "vs/workbench/common/contextkeys", "vs/css!./media/statusbarpart"], function (require, exports, nls_1, lifecycle_1, part_1, touch_1, instantiation_1, statusbar_1, contextView_1, actions_1, themeService_1, theme_1, workspace_1, colorRegistry_1, dom_1, storage_1, layoutService_1, extensions_1, arrays_1, mouseEvent_1, layoutActions_1, types_1, contextkey_1, theme_2, hash_1, hover_1, configuration_1, statusbarActions_1, statusbarModel_1, statusbarItem_1, contextkeys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StatusbarPart = void 0;
    let StatusbarPart = class StatusbarPart extends part_1.Part {
        constructor(instantiationService, themeService, contextService, storageService, layoutService, contextMenuService, contextKeyService, hoverService, configurationService) {
            super("workbench.parts.statusbar" /* Parts.STATUSBAR_PART */, { hasTitle: false }, themeService, storageService, layoutService);
            this.instantiationService = instantiationService;
            this.contextService = contextService;
            this.storageService = storageService;
            this.contextMenuService = contextMenuService;
            this.contextKeyService = contextKeyService;
            this.hoverService = hoverService;
            this.configurationService = configurationService;
            //#region IView
            this.minimumWidth = 0;
            this.maximumWidth = Number.POSITIVE_INFINITY;
            this.minimumHeight = 22;
            this.maximumHeight = 22;
            this.pendingEntries = [];
            this.viewModel = this._register(new statusbarModel_1.StatusbarViewModel(this.storageService));
            this.onDidChangeEntryVisibility = this.viewModel.onDidChangeEntryVisibility;
            this.hoverDelegate = new class {
                constructor(configurationService, hoverService) {
                    this.configurationService = configurationService;
                    this.hoverService = hoverService;
                    this.lastHoverHideTime = 0;
                    this.placement = 'element';
                }
                get delay() {
                    if (Date.now() - this.lastHoverHideTime < 200) {
                        return 0; // show instantly when a hover was recently shown
                    }
                    return this.configurationService.getValue('workbench.hover.delay');
                }
                showHover(options, focus) {
                    return this.hoverService.showHover(Object.assign(Object.assign({}, options), { hideOnKeyDown: true }), focus);
                }
                onDidHideHover() {
                    this.lastHoverHideTime = Date.now();
                }
            }(this.configurationService, this.hoverService);
            this.compactEntriesDisposable = this._register(new lifecycle_1.MutableDisposable());
            this.styleOverrides = new Set();
            this.registerListeners();
        }
        registerListeners() {
            // Entry visibility changes
            this._register(this.onDidChangeEntryVisibility(() => this.updateCompactEntries()));
            // Workbench state changes
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateStyles()));
        }
        addEntry(entry, id, alignment, priorityOrLocation = 0) {
            const priority = {
                primary: priorityOrLocation,
                secondary: (0, hash_1.hash)(id) // derive from identifier to accomplish uniqueness
            };
            // As long as we have not been created into a container yet, record all entries
            // that are pending so that they can get created at a later point
            if (!this.element) {
                return this.doAddPendingEntry(entry, id, alignment, priority);
            }
            // Otherwise add to view
            return this.doAddEntry(entry, id, alignment, priority);
        }
        doAddPendingEntry(entry, id, alignment, priority) {
            const pendingEntry = { entry, id, alignment, priority };
            this.pendingEntries.push(pendingEntry);
            const accessor = {
                update: (entry) => {
                    if (pendingEntry.accessor) {
                        pendingEntry.accessor.update(entry);
                    }
                    else {
                        pendingEntry.entry = entry;
                    }
                },
                dispose: () => {
                    if (pendingEntry.accessor) {
                        pendingEntry.accessor.dispose();
                    }
                    else {
                        this.pendingEntries = this.pendingEntries.filter(entry => entry !== pendingEntry);
                    }
                }
            };
            return accessor;
        }
        doAddEntry(entry, id, alignment, priority) {
            // View model item
            const itemContainer = this.doCreateStatusItem(id, alignment, ...(0, arrays_1.coalesce)([entry.showBeak ? 'has-beak' : undefined]));
            const item = this.instantiationService.createInstance(statusbarItem_1.StatusbarEntryItem, itemContainer, entry, this.hoverDelegate);
            // View model entry
            const viewModelEntry = new class {
                constructor() {
                    this.id = id;
                    this.alignment = alignment;
                    this.priority = priority;
                    this.container = itemContainer;
                    this.labelContainer = item.labelContainer;
                }
                get name() { return item.name; }
                get hasCommand() { return item.hasCommand; }
            };
            // Add to view model
            const { needsFullRefresh } = this.doAddOrRemoveModelEntry(viewModelEntry, true);
            if (needsFullRefresh) {
                this.appendStatusbarEntries();
            }
            else {
                this.appendStatusbarEntry(viewModelEntry);
            }
            return {
                update: entry => {
                    item.update(entry);
                },
                dispose: () => {
                    const { needsFullRefresh } = this.doAddOrRemoveModelEntry(viewModelEntry, false);
                    if (needsFullRefresh) {
                        this.appendStatusbarEntries();
                    }
                    else {
                        itemContainer.remove();
                    }
                    (0, lifecycle_1.dispose)(item);
                }
            };
        }
        doCreateStatusItem(id, alignment, ...extraClasses) {
            const itemContainer = document.createElement('div');
            itemContainer.id = id;
            itemContainer.classList.add('statusbar-item');
            if (extraClasses) {
                itemContainer.classList.add(...extraClasses);
            }
            if (alignment === 1 /* StatusbarAlignment.RIGHT */) {
                itemContainer.classList.add('right');
            }
            else {
                itemContainer.classList.add('left');
            }
            return itemContainer;
        }
        doAddOrRemoveModelEntry(entry, add) {
            // Update model but remember previous entries
            const entriesBefore = this.viewModel.entries;
            if (add) {
                this.viewModel.add(entry);
            }
            else {
                this.viewModel.remove(entry);
            }
            const entriesAfter = this.viewModel.entries;
            // Apply operation onto the entries from before
            if (add) {
                entriesBefore.splice(entriesAfter.indexOf(entry), 0, entry);
            }
            else {
                entriesBefore.splice(entriesBefore.indexOf(entry), 1);
            }
            // Figure out if a full refresh is needed by comparing arrays
            const needsFullRefresh = !(0, arrays_1.equals)(entriesBefore, entriesAfter);
            return { needsFullRefresh };
        }
        isEntryVisible(id) {
            return !this.viewModel.isHidden(id);
        }
        updateEntryVisibility(id, visible) {
            if (visible) {
                this.viewModel.show(id);
            }
            else {
                this.viewModel.hide(id);
            }
        }
        focusNextEntry() {
            this.viewModel.focusNextEntry();
        }
        focusPreviousEntry() {
            this.viewModel.focusPreviousEntry();
        }
        isEntryFocused() {
            return this.viewModel.isEntryFocused();
        }
        focus(preserveEntryFocus = true) {
            var _a;
            (_a = this.getContainer()) === null || _a === void 0 ? void 0 : _a.focus();
            const lastFocusedEntry = this.viewModel.lastFocusedEntry;
            if (preserveEntryFocus && lastFocusedEntry) {
                setTimeout(() => lastFocusedEntry.labelContainer.focus(), 0); // Need a timeout, for some reason without it the inner label container will not get focused
            }
        }
        createContentArea(parent) {
            this.element = parent;
            // Track focus within container
            const scopedContextKeyService = this.contextKeyService.createScoped(this.element);
            contextkeys_1.StatusBarFocused.bindTo(scopedContextKeyService).set(true);
            // Left items container
            this.leftItemsContainer = document.createElement('div');
            this.leftItemsContainer.classList.add('left-items', 'items-container');
            this.element.appendChild(this.leftItemsContainer);
            this.element.tabIndex = 0;
            // Right items container
            this.rightItemsContainer = document.createElement('div');
            this.rightItemsContainer.classList.add('right-items', 'items-container');
            this.element.appendChild(this.rightItemsContainer);
            // Context menu support
            this._register((0, dom_1.addDisposableListener)(parent, dom_1.EventType.CONTEXT_MENU, e => this.showContextMenu(e)));
            this._register(touch_1.Gesture.addTarget(parent));
            this._register((0, dom_1.addDisposableListener)(parent, touch_1.EventType.Contextmenu, e => this.showContextMenu(e)));
            // Initial status bar entries
            this.createInitialStatusbarEntries();
            return this.element;
        }
        createInitialStatusbarEntries() {
            // Add items in order according to alignment
            this.appendStatusbarEntries();
            // Fill in pending entries if any
            while (this.pendingEntries.length) {
                const pending = this.pendingEntries.shift();
                if (pending) {
                    pending.accessor = this.addEntry(pending.entry, pending.id, pending.alignment, pending.priority.primary);
                }
            }
        }
        appendStatusbarEntries() {
            const leftItemsContainer = (0, types_1.assertIsDefined)(this.leftItemsContainer);
            const rightItemsContainer = (0, types_1.assertIsDefined)(this.rightItemsContainer);
            // Clear containers
            (0, dom_1.clearNode)(leftItemsContainer);
            (0, dom_1.clearNode)(rightItemsContainer);
            // Append all
            for (const entry of [
                ...this.viewModel.getEntries(0 /* StatusbarAlignment.LEFT */),
                ...this.viewModel.getEntries(1 /* StatusbarAlignment.RIGHT */).reverse() // reversing due to flex: row-reverse
            ]) {
                const target = entry.alignment === 0 /* StatusbarAlignment.LEFT */ ? leftItemsContainer : rightItemsContainer;
                target.appendChild(entry.container);
            }
            // Update compact entries
            this.updateCompactEntries();
        }
        appendStatusbarEntry(entry) {
            const entries = this.viewModel.getEntries(entry.alignment);
            if (entry.alignment === 1 /* StatusbarAlignment.RIGHT */) {
                entries.reverse(); // reversing due to flex: row-reverse
            }
            const target = (0, types_1.assertIsDefined)(entry.alignment === 0 /* StatusbarAlignment.LEFT */ ? this.leftItemsContainer : this.rightItemsContainer);
            const index = entries.indexOf(entry);
            if (index + 1 === entries.length) {
                target.appendChild(entry.container); // append at the end if last
            }
            else {
                target.insertBefore(entry.container, entries[index + 1].container); // insert before next element otherwise
            }
            // Update compact entries
            this.updateCompactEntries();
        }
        updateCompactEntries() {
            var _a, _b;
            const entries = this.viewModel.entries;
            // Find visible entries and clear compact related CSS classes if any
            const mapIdToVisibleEntry = new Map();
            for (const entry of entries) {
                if (!this.viewModel.isHidden(entry.id)) {
                    mapIdToVisibleEntry.set(entry.id, entry);
                }
                entry.container.classList.remove('compact-left', 'compact-right');
            }
            // Figure out groups of entries with `compact` alignment
            const compactEntryGroups = new Map();
            for (const entry of mapIdToVisibleEntry.values()) {
                if ((0, statusbar_1.isStatusbarEntryLocation)(entry.priority.primary) && // entry references another entry as location
                    entry.priority.primary.compact // entry wants to be compact
                ) {
                    const locationId = entry.priority.primary.id;
                    const location = mapIdToVisibleEntry.get(locationId);
                    if (!location) {
                        continue; // skip if location does not exist
                    }
                    // Build a map of entries that are compact among each other
                    let compactEntryGroup = compactEntryGroups.get(locationId);
                    if (!compactEntryGroup) {
                        compactEntryGroup = new Set([entry, location]);
                        compactEntryGroups.set(locationId, compactEntryGroup);
                    }
                    else {
                        compactEntryGroup.add(entry);
                    }
                    // Adjust CSS classes to move compact items closer together
                    if (entry.priority.primary.alignment === 0 /* StatusbarAlignment.LEFT */) {
                        location.container.classList.add('compact-left');
                        entry.container.classList.add('compact-right');
                    }
                    else {
                        location.container.classList.add('compact-right');
                        entry.container.classList.add('compact-left');
                    }
                }
            }
            // Install mouse listeners to update hover feedback for
            // all compact entries that belong to each other
            const statusBarItemHoverBackground = (_a = this.getColor(theme_1.STATUS_BAR_ITEM_HOVER_BACKGROUND)) === null || _a === void 0 ? void 0 : _a.toString();
            const statusBarItemCompactHoverBackground = (_b = this.getColor(theme_1.STATUS_BAR_ITEM_COMPACT_HOVER_BACKGROUND)) === null || _b === void 0 ? void 0 : _b.toString();
            this.compactEntriesDisposable.value = new lifecycle_1.DisposableStore();
            if (statusBarItemHoverBackground && statusBarItemCompactHoverBackground && !(0, theme_2.isHighContrast)(this.theme.type)) {
                for (const [, compactEntryGroup] of compactEntryGroups) {
                    for (const compactEntry of compactEntryGroup) {
                        if (!compactEntry.hasCommand) {
                            continue; // only show hover feedback when we have a command
                        }
                        this.compactEntriesDisposable.value.add((0, dom_1.addDisposableListener)(compactEntry.labelContainer, dom_1.EventType.MOUSE_OVER, () => {
                            compactEntryGroup.forEach(compactEntry => compactEntry.labelContainer.style.backgroundColor = statusBarItemHoverBackground);
                            compactEntry.labelContainer.style.backgroundColor = statusBarItemCompactHoverBackground;
                        }));
                        this.compactEntriesDisposable.value.add((0, dom_1.addDisposableListener)(compactEntry.labelContainer, dom_1.EventType.MOUSE_OUT, () => {
                            compactEntryGroup.forEach(compactEntry => compactEntry.labelContainer.style.backgroundColor = '');
                        }));
                    }
                }
            }
        }
        showContextMenu(e) {
            dom_1.EventHelper.stop(e, true);
            const event = new mouseEvent_1.StandardMouseEvent(e);
            let actions = undefined;
            this.contextMenuService.showContextMenu({
                getAnchor: () => ({ x: event.posx, y: event.posy }),
                getActions: () => {
                    actions = this.getContextMenuActions(event);
                    return actions;
                },
                onHide: () => {
                    if (actions) {
                        (0, lifecycle_1.dispose)(actions);
                    }
                }
            });
        }
        getContextMenuActions(event) {
            const actions = [];
            // Provide an action to hide the status bar at last
            actions.push((0, actions_1.toAction)({ id: layoutActions_1.ToggleStatusbarVisibilityAction.ID, label: (0, nls_1.localize)('hideStatusBar', "Hide Status Bar"), run: () => this.instantiationService.invokeFunction(accessor => new layoutActions_1.ToggleStatusbarVisibilityAction().run(accessor)) }));
            actions.push(new actions_1.Separator());
            // Show an entry per known status entry
            // Note: even though entries have an identifier, there can be multiple entries
            // having the same identifier (e.g. from extensions). So we make sure to only
            // show a single entry per identifier we handled.
            const handledEntries = new Set();
            for (const entry of this.viewModel.entries) {
                if (!handledEntries.has(entry.id)) {
                    actions.push(new statusbarActions_1.ToggleStatusbarEntryVisibilityAction(entry.id, entry.name, this.viewModel));
                    handledEntries.add(entry.id);
                }
            }
            // Figure out if mouse is over an entry
            let statusEntryUnderMouse = undefined;
            for (let element = event.target; element; element = element.parentElement) {
                const entry = this.viewModel.findEntry(element);
                if (entry) {
                    statusEntryUnderMouse = entry;
                    break;
                }
            }
            if (statusEntryUnderMouse) {
                actions.push(new actions_1.Separator());
                actions.push(new statusbarActions_1.HideStatusbarEntryAction(statusEntryUnderMouse.id, statusEntryUnderMouse.name, this.viewModel));
            }
            return actions;
        }
        updateStyles() {
            var _a, _b, _c, _d;
            super.updateStyles();
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            const styleOverride = [...this.styleOverrides].sort((a, b) => a.priority - b.priority)[0];
            // Background / foreground colors
            const backgroundColor = this.getColor((_a = styleOverride === null || styleOverride === void 0 ? void 0 : styleOverride.background) !== null && _a !== void 0 ? _a : (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ? theme_1.STATUS_BAR_BACKGROUND : theme_1.STATUS_BAR_NO_FOLDER_BACKGROUND)) || '';
            container.style.backgroundColor = backgroundColor;
            const foregroundColor = this.getColor((_b = styleOverride === null || styleOverride === void 0 ? void 0 : styleOverride.foreground) !== null && _b !== void 0 ? _b : (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ? theme_1.STATUS_BAR_FOREGROUND : theme_1.STATUS_BAR_NO_FOLDER_FOREGROUND)) || '';
            container.style.color = foregroundColor;
            const itemBorderColor = this.getColor(theme_1.STATUS_BAR_ITEM_FOCUS_BORDER);
            // Border color
            const borderColor = this.getColor((_c = styleOverride === null || styleOverride === void 0 ? void 0 : styleOverride.border) !== null && _c !== void 0 ? _c : (this.contextService.getWorkbenchState() !== 1 /* WorkbenchState.EMPTY */ ? theme_1.STATUS_BAR_BORDER : theme_1.STATUS_BAR_NO_FOLDER_BORDER)) || this.getColor(colorRegistry_1.contrastBorder);
            if (borderColor) {
                container.classList.add('status-border-top');
                container.style.setProperty('--status-border-top-color', borderColor.toString());
            }
            else {
                container.classList.remove('status-border-top');
                container.style.removeProperty('--status-border-top-color');
            }
            // Colors and focus outlines via dynamic stylesheet
            const statusBarFocusColor = this.getColor(theme_1.STATUS_BAR_FOCUS_BORDER);
            if (!this.styleElement) {
                this.styleElement = (0, dom_1.createStyleSheet)(container);
            }
            this.styleElement.textContent = `
				/* Status bar focus outline */
				.monaco-workbench .part.statusbar:focus {
					outline-color: ${statusBarFocusColor};
				}

				/* Status bar item focus outline */
				.monaco-workbench .part.statusbar > .items-container > .statusbar-item a:focus-visible:not(.disabled) {
					outline: 1px solid ${(_d = this.getColor(colorRegistry_1.activeContrastBorder)) !== null && _d !== void 0 ? _d : itemBorderColor};
					outline-offset: ${borderColor ? '-2px' : '-1px'};
				}
				/* Notification Beak */
				.monaco-workbench .part.statusbar > .items-container > .statusbar-item.has-beak:before {
					border-bottom-color: ${backgroundColor};
					}
			`;
        }
        layout(width, height, top, left) {
            super.layout(width, height, top, left);
            super.layoutContents(width, height);
        }
        overrideStyle(style) {
            this.styleOverrides.add(style);
            this.updateStyles();
            return (0, lifecycle_1.toDisposable)(() => {
                this.styleOverrides.delete(style);
                this.updateStyles();
            });
        }
        toJSON() {
            return {
                type: "workbench.parts.statusbar" /* Parts.STATUSBAR_PART */
            };
        }
    };
    StatusbarPart = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, themeService_1.IThemeService),
        __param(2, workspace_1.IWorkspaceContextService),
        __param(3, storage_1.IStorageService),
        __param(4, layoutService_1.IWorkbenchLayoutService),
        __param(5, contextView_1.IContextMenuService),
        __param(6, contextkey_1.IContextKeyService),
        __param(7, hover_1.IHoverService),
        __param(8, configuration_1.IConfigurationService)
    ], StatusbarPart);
    exports.StatusbarPart = StatusbarPart;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        if (!(0, theme_2.isHighContrast)(theme.type)) {
            const statusBarItemHoverBackground = theme.getColor(theme_1.STATUS_BAR_ITEM_HOVER_BACKGROUND);
            if (statusBarItemHoverBackground) {
                collector.addRule(`.monaco-workbench .part.statusbar > .items-container > .statusbar-item a:hover:not(.disabled) { background-color: ${statusBarItemHoverBackground}; }`);
            }
            const statusBarItemActiveBackground = theme.getColor(theme_1.STATUS_BAR_ITEM_ACTIVE_BACKGROUND);
            if (statusBarItemActiveBackground) {
                // using !important for this rule to win over any background color that is set via JS code for compact items in a group
                collector.addRule(`.monaco-workbench .part.statusbar > .items-container > .statusbar-item a:active:not(.disabled) { background-color: ${statusBarItemActiveBackground} !important; }`);
            }
        }
        const activeContrastBorderColor = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (activeContrastBorderColor) {
            collector.addRule(`
			.monaco-workbench .part.statusbar > .items-container > .statusbar-item a:active:not(.disabled) {
				outline: 1px solid ${activeContrastBorderColor} !important;
				outline-offset: -1px;
			}
		`);
            collector.addRule(`
			.monaco-workbench .part.statusbar > .items-container > .statusbar-item a:hover:not(.disabled) {
				outline: 1px dashed ${activeContrastBorderColor};
				outline-offset: -1px;
			}
		`);
        }
        const statusBarProminentItemForeground = theme.getColor(theme_1.STATUS_BAR_PROMINENT_ITEM_FOREGROUND);
        if (statusBarProminentItemForeground) {
            collector.addRule(`.monaco-workbench .part.statusbar > .items-container > .statusbar-item .status-bar-info { color: ${statusBarProminentItemForeground}; }`);
        }
        const statusBarProminentItemBackground = theme.getColor(theme_1.STATUS_BAR_PROMINENT_ITEM_BACKGROUND);
        if (statusBarProminentItemBackground) {
            collector.addRule(`.monaco-workbench .part.statusbar > .items-container > .statusbar-item .status-bar-info { background-color: ${statusBarProminentItemBackground}; }`);
        }
        const statusBarProminentItemHoverBackground = theme.getColor(theme_1.STATUS_BAR_PROMINENT_ITEM_HOVER_BACKGROUND);
        if (statusBarProminentItemHoverBackground) {
            collector.addRule(`.monaco-workbench .part.statusbar > .items-container > .statusbar-item a.status-bar-info:hover:not(.disabled) { background-color: ${statusBarProminentItemHoverBackground}; }`);
        }
    });
    (0, extensions_1.registerSingleton)(statusbar_1.IStatusbarService, StatusbarPart);
});
//# sourceMappingURL=statusbarPart.js.map