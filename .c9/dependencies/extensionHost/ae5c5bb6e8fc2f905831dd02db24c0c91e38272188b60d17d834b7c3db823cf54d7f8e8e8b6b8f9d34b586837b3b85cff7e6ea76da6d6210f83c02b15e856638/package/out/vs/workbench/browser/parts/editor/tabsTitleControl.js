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
define(["require", "exports", "vs/base/common/platform", "vs/base/common/labels", "vs/workbench/common/editor", "vs/workbench/browser/editor", "vs/base/browser/keyboardEvent", "vs/base/browser/touch", "vs/workbench/browser/labels", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/contextview/browser/contextView", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/contextkey/common/contextkey", "vs/platform/actions/common/actions", "vs/workbench/browser/parts/editor/titleControl", "vs/platform/quickinput/common/quickInput", "vs/base/common/lifecycle", "vs/base/browser/ui/scrollbar/scrollableElement", "vs/base/common/map", "vs/platform/theme/common/themeService", "vs/workbench/common/theme", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/dnd", "vs/platform/notification/common/notification", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/browser/dom", "vs/nls", "vs/workbench/browser/parts/editor/editorActions", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/editor/breadcrumbsControl", "vs/platform/files/common/files", "vs/base/common/types", "vs/workbench/services/editor/common/editorService", "vs/base/common/resources", "vs/base/common/async", "vs/workbench/services/path/common/pathService", "vs/base/common/path", "vs/base/common/arrays", "vs/platform/theme/common/theme", "vs/base/browser/browser", "vs/base/common/objects", "vs/platform/editor/common/editor", "vs/workbench/browser/parts/editor/editorCommands", "vs/workbench/services/views/browser/treeViewsService", "vs/css!./media/tabstitlecontrol"], function (require, exports, platform_1, labels_1, editor_1, editor_2, keyboardEvent_1, touch_1, labels_2, actionbar_1, contextView_1, telemetry_1, instantiation_1, keybinding_1, contextkey_1, actions_1, titleControl_1, quickInput_1, lifecycle_1, scrollableElement_1, map_1, themeService_1, theme_1, colorRegistry_1, dnd_1, notification_1, editorGroupsService_1, dom_1, nls_1, editorActions_1, configuration_1, breadcrumbsControl_1, files_1, types_1, editorService_1, resources_1, async_1, pathService_1, path_1, arrays_1, theme_2, browser_1, objects_1, editor_3, editorCommands_1, treeViewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabsTitleControl = void 0;
    let TabsTitleControl = class TabsTitleControl extends titleControl_1.TitleControl {
        constructor(parent, accessor, group, contextMenuService, instantiationService, contextKeyService, keybindingService, telemetryService, notificationService, menuService, quickInputService, themeService, configurationService, fileService, editorService, pathService, editorGroupService, treeViewsDragAndDropService) {
            super(parent, accessor, group, contextMenuService, instantiationService, contextKeyService, keybindingService, telemetryService, notificationService, menuService, quickInputService, themeService, configurationService, fileService);
            this.editorService = editorService;
            this.pathService = pathService;
            this.editorGroupService = editorGroupService;
            this.treeViewsDragAndDropService = treeViewsDragAndDropService;
            this.closeEditorAction = this._register(this.instantiationService.createInstance(editorActions_1.CloseOneEditorAction, editorActions_1.CloseOneEditorAction.ID, editorActions_1.CloseOneEditorAction.LABEL));
            this.unpinEditorAction = this._register(this.instantiationService.createInstance(editorActions_1.UnpinEditorAction, editorActions_1.UnpinEditorAction.ID, editorActions_1.UnpinEditorAction.LABEL));
            this.tabResourceLabels = this._register(this.instantiationService.createInstance(labels_2.ResourceLabels, labels_2.DEFAULT_LABELS_CONTAINER));
            this.tabLabels = [];
            this.tabActionBars = [];
            this.tabDisposables = [];
            this.dimensions = {
                container: dom_1.Dimension.None,
                available: dom_1.Dimension.None
            };
            this.layoutScheduler = this._register(new lifecycle_1.MutableDisposable());
            this.path = platform_1.isWindows ? path_1.win32 : path_1.posix;
            this.lastMouseWheelEventTime = 0;
            this.updateEditorLabelScheduler = this._register(new async_1.RunOnceScheduler(() => this.doUpdateEditorLabels(), 0));
            // Resolve the correct path library for the OS we are on
            // If we are connected to remote, this accounts for the
            // remote OS.
            (async () => this.path = await this.pathService.path)();
            // React to decorations changing for our resource labels
            this._register(this.tabResourceLabels.onDidChangeDecorations(() => this.doHandleDecorationsChange()));
        }
        create(parent) {
            this.titleContainer = parent;
            // Tabs and Actions Container (are on a single row with flex side-by-side)
            this.tabsAndActionsContainer = document.createElement('div');
            this.tabsAndActionsContainer.classList.add('tabs-and-actions-container');
            this.titleContainer.appendChild(this.tabsAndActionsContainer);
            // Tabs Container
            this.tabsContainer = document.createElement('div');
            this.tabsContainer.setAttribute('role', 'tablist');
            this.tabsContainer.draggable = true;
            this.tabsContainer.classList.add('tabs-container');
            this._register(touch_1.Gesture.addTarget(this.tabsContainer));
            // Tabs Scrollbar
            this.tabsScrollbar = this._register(this.createTabsScrollbar(this.tabsContainer));
            this.tabsAndActionsContainer.appendChild(this.tabsScrollbar.getDomNode());
            // Tabs Container listeners
            this.registerTabsContainerListeners(this.tabsContainer, this.tabsScrollbar);
            // Editor Toolbar Container
            this.editorToolbarContainer = document.createElement('div');
            this.editorToolbarContainer.classList.add('editor-actions');
            this.tabsAndActionsContainer.appendChild(this.editorToolbarContainer);
            // Editor Actions Toolbar
            this.createEditorActionsToolBar(this.editorToolbarContainer);
            // Breadcrumbs
            const breadcrumbsContainer = document.createElement('div');
            breadcrumbsContainer.classList.add('tabs-breadcrumbs');
            this.titleContainer.appendChild(breadcrumbsContainer);
            this.createBreadcrumbsControl(breadcrumbsContainer, { showFileIcons: true, showSymbolIcons: true, showDecorationColors: false, showPlaceholder: true, breadcrumbsBackground: colorRegistry_1.breadcrumbsBackground });
        }
        createTabsScrollbar(scrollable) {
            const tabsScrollbar = new scrollableElement_1.ScrollableElement(scrollable, {
                horizontal: 1 /* ScrollbarVisibility.Auto */,
                horizontalScrollbarSize: this.getTabsScrollbarSizing(),
                vertical: 2 /* ScrollbarVisibility.Hidden */,
                scrollYToX: true,
                useShadows: false
            });
            tabsScrollbar.onScroll(e => {
                scrollable.scrollLeft = e.scrollLeft;
            });
            return tabsScrollbar;
        }
        updateTabsScrollbarSizing() {
            var _a;
            (_a = this.tabsScrollbar) === null || _a === void 0 ? void 0 : _a.updateOptions({
                horizontalScrollbarSize: this.getTabsScrollbarSizing()
            });
        }
        getTabsScrollbarSizing() {
            if (this.accessor.partOptions.titleScrollbarSizing !== 'large') {
                return TabsTitleControl.SCROLLBAR_SIZES.default;
            }
            return TabsTitleControl.SCROLLBAR_SIZES.large;
        }
        registerTabsContainerListeners(tabsContainer, tabsScrollbar) {
            // Group dragging
            this.enableGroupDragging(tabsContainer);
            // Forward scrolling inside the container to our custom scrollbar
            this._register((0, dom_1.addDisposableListener)(tabsContainer, dom_1.EventType.SCROLL, () => {
                if (tabsContainer.classList.contains('scroll')) {
                    tabsScrollbar.setScrollPosition({
                        scrollLeft: tabsContainer.scrollLeft // during DND the container gets scrolled so we need to update the custom scrollbar
                    });
                }
            }));
            // New file when double clicking on tabs container (but not tabs)
            for (const eventType of [touch_1.EventType.Tap, dom_1.EventType.DBLCLICK]) {
                this._register((0, dom_1.addDisposableListener)(tabsContainer, eventType, (e) => {
                    if (eventType === dom_1.EventType.DBLCLICK) {
                        if (e.target !== tabsContainer) {
                            return; // ignore if target is not tabs container
                        }
                    }
                    else {
                        if (e.tapCount !== 2) {
                            return; // ignore single taps
                        }
                        if (e.initialTarget !== tabsContainer) {
                            return; // ignore if target is not tabs container
                        }
                    }
                    dom_1.EventHelper.stop(e);
                    this.editorService.openEditor({
                        resource: undefined,
                        options: {
                            pinned: true,
                            index: this.group.count,
                            override: editor_1.DEFAULT_EDITOR_ASSOCIATION.id
                        }
                    }, this.group.id);
                }));
            }
            // Prevent auto-scrolling (https://github.com/microsoft/vscode/issues/16690)
            this._register((0, dom_1.addDisposableListener)(tabsContainer, dom_1.EventType.MOUSE_DOWN, e => {
                if (e.button === 1) {
                    e.preventDefault();
                }
            }));
            // Drop support
            this._register(new dom_1.DragAndDropObserver(tabsContainer, {
                onDragEnter: e => {
                    // Always enable support to scroll while dragging
                    tabsContainer.classList.add('scroll');
                    // Return if the target is not on the tabs container
                    if (e.target !== tabsContainer) {
                        this.updateDropFeedback(tabsContainer, false); // fixes https://github.com/microsoft/vscode/issues/52093
                        return;
                    }
                    // Return if transfer is unsupported
                    if (!this.isSupportedDropTransfer(e)) {
                        if (e.dataTransfer) {
                            e.dataTransfer.dropEffect = 'none';
                        }
                        return;
                    }
                    // Return if dragged editor is last tab because then this is a no-op
                    let isLocalDragAndDrop = false;
                    if (this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                        isLocalDragAndDrop = true;
                        const data = this.editorTransfer.getData(dnd_1.DraggedEditorIdentifier.prototype);
                        if (Array.isArray(data)) {
                            const localDraggedEditor = data[0].identifier;
                            if (this.group.id === localDraggedEditor.groupId && this.group.getIndexOfEditor(localDraggedEditor.editor) === this.group.count - 1) {
                                if (e.dataTransfer) {
                                    e.dataTransfer.dropEffect = 'none';
                                }
                                return;
                            }
                        }
                    }
                    // Update the dropEffect to "copy" if there is no local data to be dragged because
                    // in that case we can only copy the data into and not move it from its source
                    if (!isLocalDragAndDrop) {
                        if (e.dataTransfer) {
                            e.dataTransfer.dropEffect = 'copy';
                        }
                    }
                    this.updateDropFeedback(tabsContainer, true);
                },
                onDragLeave: e => {
                    this.updateDropFeedback(tabsContainer, false);
                    tabsContainer.classList.remove('scroll');
                },
                onDragEnd: e => {
                    this.updateDropFeedback(tabsContainer, false);
                    tabsContainer.classList.remove('scroll');
                },
                onDrop: e => {
                    this.updateDropFeedback(tabsContainer, false);
                    tabsContainer.classList.remove('scroll');
                    if (e.target === tabsContainer) {
                        this.onDrop(e, this.group.count, tabsContainer);
                    }
                }
            }));
            // Mouse-wheel support to switch to tabs optionally
            this._register((0, dom_1.addDisposableListener)(tabsContainer, dom_1.EventType.MOUSE_WHEEL, (e) => {
                const activeEditor = this.group.activeEditor;
                if (!activeEditor || this.group.count < 2) {
                    return; // need at least 2 open editors
                }
                // Shift-key enables or disables this behaviour depending on the setting
                if (this.accessor.partOptions.scrollToSwitchTabs === true) {
                    if (e.shiftKey) {
                        return; // 'on': only enable this when Shift-key is not pressed
                    }
                }
                else {
                    if (!e.shiftKey) {
                        return; // 'off': only enable this when Shift-key is pressed
                    }
                }
                // Ignore event if the last one happened too recently (https://github.com/microsoft/vscode/issues/96409)
                // The restriction is relaxed according to the absolute value of `deltaX` and `deltaY`
                // to support discrete (mouse wheel) and contiguous scrolling (touchpad) equally well
                const now = Date.now();
                if (now - this.lastMouseWheelEventTime < TabsTitleControl.MOUSE_WHEEL_EVENT_THRESHOLD - 2 * (Math.abs(e.deltaX) + Math.abs(e.deltaY))) {
                    return;
                }
                this.lastMouseWheelEventTime = now;
                // Figure out scrolling direction but ignore it if too subtle
                let tabSwitchDirection;
                if (e.deltaX + e.deltaY < -TabsTitleControl.MOUSE_WHEEL_DISTANCE_THRESHOLD) {
                    tabSwitchDirection = -1;
                }
                else if (e.deltaX + e.deltaY > TabsTitleControl.MOUSE_WHEEL_DISTANCE_THRESHOLD) {
                    tabSwitchDirection = 1;
                }
                else {
                    return;
                }
                const nextEditor = this.group.getEditorByIndex(this.group.getIndexOfEditor(activeEditor) + tabSwitchDirection);
                if (!nextEditor) {
                    return;
                }
                // Open it
                this.group.openEditor(nextEditor);
                // Disable normal scrolling, opening the editor will already reveal it properly
                dom_1.EventHelper.stop(e, true);
            }));
        }
        doHandleDecorationsChange() {
            // A change to decorations potentially has an impact on the size of tabs
            // so we need to trigger a layout in that case to adjust things
            this.layout(this.dimensions);
        }
        updateEditorActionsToolbar() {
            super.updateEditorActionsToolbar();
            // Changing the actions in the toolbar can have an impact on the size of the
            // tab container, so we need to layout the tabs to make sure the active is visible
            this.layout(this.dimensions);
        }
        openEditor(editor) {
            this.handleOpenedEditors();
        }
        openEditors(editors) {
            this.handleOpenedEditors();
        }
        handleOpenedEditors() {
            var _a;
            // Create tabs as needed
            const [tabsContainer, tabsScrollbar] = (0, types_1.assertAllDefined)(this.tabsContainer, this.tabsScrollbar);
            for (let i = tabsContainer.children.length; i < this.group.count; i++) {
                tabsContainer.appendChild(this.createTab(i, tabsContainer, tabsScrollbar));
            }
            // An add of a tab requires to recompute all labels
            this.computeTabLabels();
            // Redraw all tabs
            this.redraw({ forceRevealActiveTab: true });
            // Update Breadcrumbs
            (_a = this.breadcrumbsControl) === null || _a === void 0 ? void 0 : _a.update();
        }
        closeEditor(editor, index) {
            this.handleClosedEditors(index);
        }
        closeEditors(editors) {
            this.handleClosedEditors();
        }
        handleClosedEditors(index) {
            var _a, _b;
            // There are tabs to show
            if (this.group.activeEditor) {
                // Remove tabs that got closed
                const tabsContainer = (0, types_1.assertIsDefined)(this.tabsContainer);
                while (tabsContainer.children.length > this.group.count) {
                    // Remove one tab from container (must be the last to keep indexes in order!)
                    (_a = tabsContainer.lastChild) === null || _a === void 0 ? void 0 : _a.remove();
                    // Remove associated tab label and widget
                    (0, lifecycle_1.dispose)(this.tabDisposables.pop());
                }
                // A removal of a label requires to recompute all labels
                this.computeTabLabels();
                // Redraw all tabs
                this.redraw({ forceRevealActiveTab: true });
            }
            // No tabs to show
            else {
                if (this.tabsContainer) {
                    (0, dom_1.clearNode)(this.tabsContainer);
                }
                this.tabDisposables = (0, lifecycle_1.dispose)(this.tabDisposables);
                this.tabResourceLabels.clear();
                this.tabLabels = [];
                this.tabActionBars = [];
                this.clearEditorActionsToolbar();
                (_b = this.breadcrumbsControl) === null || _b === void 0 ? void 0 : _b.update();
            }
        }
        moveEditor(editor, fromIndex, targetIndex) {
            // Move the editor label
            const editorLabel = this.tabLabels[fromIndex];
            this.tabLabels.splice(fromIndex, 1);
            this.tabLabels.splice(targetIndex, 0, editorLabel);
            // Redraw tabs in the range of the move
            this.forEachTab((editor, index, tabContainer, tabLabelWidget, tabLabel, tabActionBar) => {
                this.redrawTab(editor, index, tabContainer, tabLabelWidget, tabLabel, tabActionBar);
            }, Math.min(fromIndex, targetIndex), // from: smallest of fromIndex/targetIndex
            Math.max(fromIndex, targetIndex) //   to: largest of fromIndex/targetIndex
            );
            // Moving an editor requires a layout to keep the active editor visible
            this.layout(this.dimensions, { forceRevealActiveTab: true });
        }
        pinEditor(editor) {
            this.withTab(editor, (editor, index, tabContainer, tabLabelWidget, tabLabel) => this.redrawTabLabel(editor, index, tabContainer, tabLabelWidget, tabLabel));
        }
        stickEditor(editor) {
            this.doHandleStickyEditorChange(editor);
        }
        unstickEditor(editor) {
            this.doHandleStickyEditorChange(editor);
        }
        doHandleStickyEditorChange(editor) {
            // Update tab
            this.withTab(editor, (editor, index, tabContainer, tabLabelWidget, tabLabel, tabActionBar) => this.redrawTab(editor, index, tabContainer, tabLabelWidget, tabLabel, tabActionBar));
            // Sticky change has an impact on each tab's border because
            // it potentially moves the border to the last pinned tab
            this.forEachTab((editor, index, tabContainer, tabLabelWidget, tabLabel) => {
                this.redrawTabBorders(index, tabContainer);
            });
            // A change to the sticky state requires a layout to keep the active editor visible
            this.layout(this.dimensions, { forceRevealActiveTab: true });
        }
        setActive(isGroupActive) {
            // Activity has an impact on each tab's active indication
            this.forEachTab((editor, index, tabContainer, tabLabelWidget, tabLabel, tabActionBar) => {
                this.redrawTabActiveAndDirty(isGroupActive, editor, tabContainer, tabActionBar);
            });
            // Activity has an impact on the toolbar, so we need to update and layout
            this.updateEditorActionsToolbar();
            this.layout(this.dimensions, { forceRevealActiveTab: true });
        }
        updateEditorLabel(editor) {
            // Update all labels to account for changes to tab labels
            // Since this method may be called a lot of times from
            // individual editors, we collect all those requests and
            // then run the update once because we have to update
            // all opened tabs in the group at once.
            this.updateEditorLabelScheduler.schedule();
        }
        doUpdateEditorLabels() {
            // A change to a label requires to recompute all labels
            this.computeTabLabels();
            // As such we need to redraw each label
            this.forEachTab((editor, index, tabContainer, tabLabelWidget, tabLabel) => {
                this.redrawTabLabel(editor, index, tabContainer, tabLabelWidget, tabLabel);
            });
            // A change to a label requires a layout to keep the active editor visible
            this.layout(this.dimensions);
        }
        updateEditorDirty(editor) {
            this.withTab(editor, (editor, index, tabContainer, tabLabelWidget, tabLabel, tabActionBar) => this.redrawTabActiveAndDirty(this.accessor.activeGroup === this.group, editor, tabContainer, tabActionBar));
        }
        updateOptions(oldOptions, newOptions) {
            // A change to a label format options requires to recompute all labels
            if (oldOptions.labelFormat !== newOptions.labelFormat) {
                this.computeTabLabels();
            }
            // Update tabs scrollbar sizing
            if (oldOptions.titleScrollbarSizing !== newOptions.titleScrollbarSizing) {
                this.updateTabsScrollbarSizing();
            }
            // Redraw tabs when other options change
            if (oldOptions.labelFormat !== newOptions.labelFormat ||
                oldOptions.tabCloseButton !== newOptions.tabCloseButton ||
                oldOptions.tabSizing !== newOptions.tabSizing ||
                oldOptions.pinnedTabSizing !== newOptions.pinnedTabSizing ||
                oldOptions.showIcons !== newOptions.showIcons ||
                oldOptions.hasIcons !== newOptions.hasIcons ||
                oldOptions.highlightModifiedTabs !== newOptions.highlightModifiedTabs ||
                oldOptions.wrapTabs !== newOptions.wrapTabs ||
                !(0, objects_1.equals)(oldOptions.decorations, newOptions.decorations)) {
                this.redraw();
            }
        }
        updateStyles() {
            this.redraw();
        }
        forEachTab(fn, fromIndex, toIndex) {
            this.group.editors.forEach((editor, index) => {
                if (typeof fromIndex === 'number' && fromIndex > index) {
                    return; // do nothing if we are not yet at `fromIndex`
                }
                if (typeof toIndex === 'number' && toIndex < index) {
                    return; // do nothing if we are beyond `toIndex`
                }
                this.doWithTab(index, editor, fn);
            });
        }
        withTab(editor, fn) {
            this.doWithTab(this.group.getIndexOfEditor(editor), editor, fn);
        }
        doWithTab(index, editor, fn) {
            const tabsContainer = (0, types_1.assertIsDefined)(this.tabsContainer);
            const tabContainer = tabsContainer.children[index];
            const tabResourceLabel = this.tabResourceLabels.get(index);
            const tabLabel = this.tabLabels[index];
            const tabActionBar = this.tabActionBars[index];
            if (tabContainer && tabResourceLabel && tabLabel) {
                fn(editor, index, tabContainer, tabResourceLabel, tabLabel, tabActionBar);
            }
        }
        createTab(index, tabsContainer, tabsScrollbar) {
            // Tab Container
            const tabContainer = document.createElement('div');
            tabContainer.draggable = true;
            tabContainer.setAttribute('role', 'tab');
            tabContainer.classList.add('tab');
            // Gesture Support
            this._register(touch_1.Gesture.addTarget(tabContainer));
            // Tab Border Top
            const tabBorderTopContainer = document.createElement('div');
            tabBorderTopContainer.classList.add('tab-border-top-container');
            tabContainer.appendChild(tabBorderTopContainer);
            // Tab Editor Label
            const editorLabel = this.tabResourceLabels.create(tabContainer);
            // Tab Actions
            const tabActionsContainer = document.createElement('div');
            tabActionsContainer.classList.add('tab-actions');
            tabContainer.appendChild(tabActionsContainer);
            const tabActionRunner = new titleControl_1.EditorCommandsContextActionRunner({ groupId: this.group.id, editorIndex: index });
            const tabActionBar = new actionbar_1.ActionBar(tabActionsContainer, { ariaLabel: (0, nls_1.localize)('ariaLabelTabActions', "Tab actions"), actionRunner: tabActionRunner });
            tabActionBar.onBeforeRun(e => {
                if (e.action.id === this.closeEditorAction.id) {
                    this.blockRevealActiveTabOnce();
                }
            });
            const tabActionBarDisposable = (0, lifecycle_1.combinedDisposable)(tabActionBar, (0, lifecycle_1.toDisposable)((0, arrays_1.insert)(this.tabActionBars, tabActionBar)));
            // Tab Border Bottom
            const tabBorderBottomContainer = document.createElement('div');
            tabBorderBottomContainer.classList.add('tab-border-bottom-container');
            tabContainer.appendChild(tabBorderBottomContainer);
            // Eventing
            const eventsDisposable = this.registerTabListeners(tabContainer, index, tabsContainer, tabsScrollbar);
            this.tabDisposables.push((0, lifecycle_1.combinedDisposable)(eventsDisposable, tabActionBarDisposable, tabActionRunner, editorLabel));
            return tabContainer;
        }
        registerTabListeners(tab, index, tabsContainer, tabsScrollbar) {
            const disposables = new lifecycle_1.DisposableStore();
            const handleClickOrTouch = (e, preserveFocus) => {
                tab.blur(); // prevent flicker of focus outline on tab until editor got focus
                if (e instanceof MouseEvent && e.button !== 0) {
                    if (e.button === 1) {
                        e.preventDefault(); // required to prevent auto-scrolling (https://github.com/microsoft/vscode/issues/16690)
                    }
                    return undefined; // only for left mouse click
                }
                if (this.originatesFromTabActionBar(e)) {
                    return; // not when clicking on actions
                }
                // Open tabs editor
                const input = this.group.getEditorByIndex(index);
                if (input) {
                    // Even if focus is preserved make sure to activate the group.
                    this.group.openEditor(input, { preserveFocus, activation: editor_3.EditorActivation.ACTIVATE });
                }
                return undefined;
            };
            const showContextMenu = (e) => {
                dom_1.EventHelper.stop(e);
                const input = this.group.getEditorByIndex(index);
                if (input) {
                    this.onContextMenu(input, e, tab);
                }
            };
            // Open on Click / Touch
            disposables.add((0, dom_1.addDisposableListener)(tab, dom_1.EventType.MOUSE_DOWN, e => handleClickOrTouch(e, false)));
            disposables.add((0, dom_1.addDisposableListener)(tab, touch_1.EventType.Tap, (e) => handleClickOrTouch(e, true))); // Preserve focus on touch #125470
            // Touch Scroll Support
            disposables.add((0, dom_1.addDisposableListener)(tab, touch_1.EventType.Change, (e) => {
                tabsScrollbar.setScrollPosition({ scrollLeft: tabsScrollbar.getScrollPosition().scrollLeft - e.translationX });
            }));
            // Prevent flicker of focus outline on tab until editor got focus
            disposables.add((0, dom_1.addDisposableListener)(tab, dom_1.EventType.MOUSE_UP, e => {
                dom_1.EventHelper.stop(e);
                tab.blur();
            }));
            // Close on mouse middle click
            disposables.add((0, dom_1.addDisposableListener)(tab, dom_1.EventType.AUXCLICK, e => {
                if (e.button === 1 /* Middle Button*/) {
                    dom_1.EventHelper.stop(e, true /* for https://github.com/microsoft/vscode/issues/56715 */);
                    this.blockRevealActiveTabOnce();
                    this.closeEditorAction.run({ groupId: this.group.id, editorIndex: index });
                }
            }));
            // Context menu on Shift+F10
            disposables.add((0, dom_1.addDisposableListener)(tab, dom_1.EventType.KEY_DOWN, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.shiftKey && event.keyCode === 68 /* KeyCode.F10 */) {
                    showContextMenu(e);
                }
            }));
            // Context menu on touch context menu gesture
            disposables.add((0, dom_1.addDisposableListener)(tab, touch_1.EventType.Contextmenu, (e) => {
                showContextMenu(e);
            }));
            // Keyboard accessibility
            disposables.add((0, dom_1.addDisposableListener)(tab, dom_1.EventType.KEY_UP, e => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                let handled = false;
                // Run action on Enter/Space
                if (event.equals(3 /* KeyCode.Enter */) || event.equals(10 /* KeyCode.Space */)) {
                    handled = true;
                    const input = this.group.getEditorByIndex(index);
                    if (input) {
                        this.group.openEditor(input);
                    }
                }
                // Navigate in editors
                else if ([15 /* KeyCode.LeftArrow */, 17 /* KeyCode.RightArrow */, 16 /* KeyCode.UpArrow */, 18 /* KeyCode.DownArrow */, 14 /* KeyCode.Home */, 13 /* KeyCode.End */].some(kb => event.equals(kb))) {
                    let targetIndex;
                    if (event.equals(15 /* KeyCode.LeftArrow */) || event.equals(16 /* KeyCode.UpArrow */)) {
                        targetIndex = index - 1;
                    }
                    else if (event.equals(17 /* KeyCode.RightArrow */) || event.equals(18 /* KeyCode.DownArrow */)) {
                        targetIndex = index + 1;
                    }
                    else if (event.equals(14 /* KeyCode.Home */)) {
                        targetIndex = 0;
                    }
                    else {
                        targetIndex = this.group.count - 1;
                    }
                    const target = this.group.getEditorByIndex(targetIndex);
                    if (target) {
                        handled = true;
                        this.group.openEditor(target, { preserveFocus: true });
                        tabsContainer.childNodes[targetIndex].focus();
                    }
                }
                if (handled) {
                    dom_1.EventHelper.stop(e, true);
                }
                // moving in the tabs container can have an impact on scrolling position, so we need to update the custom scrollbar
                tabsScrollbar.setScrollPosition({
                    scrollLeft: tabsContainer.scrollLeft
                });
            }));
            // Double click: either pin or toggle maximized
            for (const eventType of [touch_1.EventType.Tap, dom_1.EventType.DBLCLICK]) {
                disposables.add((0, dom_1.addDisposableListener)(tab, eventType, (e) => {
                    if (eventType === dom_1.EventType.DBLCLICK) {
                        dom_1.EventHelper.stop(e);
                    }
                    else if (e.tapCount !== 2) {
                        return; // ignore single taps
                    }
                    const editor = this.group.getEditorByIndex(index);
                    if (editor && this.group.isPinned(editor)) {
                        this.accessor.arrangeGroups(2 /* GroupsArrangement.TOGGLE */, this.group);
                    }
                    else {
                        this.group.pinEditor(editor);
                    }
                }));
            }
            // Context menu
            disposables.add((0, dom_1.addDisposableListener)(tab, dom_1.EventType.CONTEXT_MENU, e => {
                dom_1.EventHelper.stop(e, true);
                const input = this.group.getEditorByIndex(index);
                if (input) {
                    this.onContextMenu(input, e, tab);
                }
            }, true /* use capture to fix https://github.com/microsoft/vscode/issues/19145 */));
            // Drag support
            disposables.add((0, dom_1.addDisposableListener)(tab, dom_1.EventType.DRAG_START, e => {
                const editor = this.group.getEditorByIndex(index);
                if (!editor) {
                    return;
                }
                this.editorTransfer.setData([new dnd_1.DraggedEditorIdentifier({ editor, groupId: this.group.id })], dnd_1.DraggedEditorIdentifier.prototype);
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'copyMove';
                }
                // Apply some datatransfer types to allow for dragging the element outside of the application
                this.doFillResourceDataTransfers([editor], e);
                // Fixes https://github.com/microsoft/vscode/issues/18733
                tab.classList.add('dragged');
                (0, dom_1.scheduleAtNextAnimationFrame)(() => tab.classList.remove('dragged'));
            }));
            // Drop support
            disposables.add(new dom_1.DragAndDropObserver(tab, {
                onDragEnter: e => {
                    // Update class to signal drag operation
                    tab.classList.add('dragged-over');
                    // Return if transfer is unsupported
                    if (!this.isSupportedDropTransfer(e)) {
                        if (e.dataTransfer) {
                            e.dataTransfer.dropEffect = 'none';
                        }
                        return;
                    }
                    // Return if dragged editor is the current tab dragged over
                    let isLocalDragAndDrop = false;
                    if (this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                        isLocalDragAndDrop = true;
                        const data = this.editorTransfer.getData(dnd_1.DraggedEditorIdentifier.prototype);
                        if (Array.isArray(data)) {
                            const localDraggedEditor = data[0].identifier;
                            if (localDraggedEditor.editor === this.group.getEditorByIndex(index) && localDraggedEditor.groupId === this.group.id) {
                                if (e.dataTransfer) {
                                    e.dataTransfer.dropEffect = 'none';
                                }
                                return;
                            }
                        }
                    }
                    // Update the dropEffect to "copy" if there is no local data to be dragged because
                    // in that case we can only copy the data into and not move it from its source
                    if (!isLocalDragAndDrop) {
                        if (e.dataTransfer) {
                            e.dataTransfer.dropEffect = 'copy';
                        }
                    }
                    this.updateDropFeedback(tab, true, index);
                },
                onDragLeave: () => {
                    tab.classList.remove('dragged-over');
                    this.updateDropFeedback(tab, false, index);
                },
                onDragEnd: () => {
                    tab.classList.remove('dragged-over');
                    this.updateDropFeedback(tab, false, index);
                    this.editorTransfer.clearData(dnd_1.DraggedEditorIdentifier.prototype);
                },
                onDrop: e => {
                    tab.classList.remove('dragged-over');
                    this.updateDropFeedback(tab, false, index);
                    this.onDrop(e, index, tabsContainer);
                }
            }));
            return disposables;
        }
        isSupportedDropTransfer(e) {
            if (this.groupTransfer.hasData(dnd_1.DraggedEditorGroupIdentifier.prototype)) {
                const data = this.groupTransfer.getData(dnd_1.DraggedEditorGroupIdentifier.prototype);
                if (Array.isArray(data)) {
                    const group = data[0];
                    if (group.identifier === this.group.id) {
                        return false; // groups cannot be dropped on title area it originates from
                    }
                }
                return true;
            }
            if (this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                return true; // (local) editors can always be dropped
            }
            if (e.dataTransfer && e.dataTransfer.types.length > 0) {
                return true; // optimistically allow external data (// see https://github.com/microsoft/vscode/issues/25789)
            }
            return false;
        }
        updateDropFeedback(element, isDND, index) {
            const isTab = (typeof index === 'number');
            const editor = typeof index === 'number' ? this.group.getEditorByIndex(index) : undefined;
            const isActiveTab = isTab && !!editor && this.group.isActive(editor);
            // Background
            const noDNDBackgroundColor = isTab ? this.getColor(isActiveTab ? theme_1.TAB_ACTIVE_BACKGROUND : theme_1.TAB_INACTIVE_BACKGROUND) : '';
            element.style.backgroundColor = (isDND ? this.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND) : noDNDBackgroundColor) || '';
            // Outline
            const activeContrastBorderColor = this.getColor(colorRegistry_1.activeContrastBorder);
            if (activeContrastBorderColor && isDND) {
                element.style.outlineWidth = '2px';
                element.style.outlineStyle = 'dashed';
                element.style.outlineColor = activeContrastBorderColor;
                element.style.outlineOffset = isTab ? '-5px' : '-3px';
            }
            else {
                element.style.outlineWidth = '';
                element.style.outlineStyle = '';
                element.style.outlineColor = activeContrastBorderColor || '';
                element.style.outlineOffset = '';
            }
        }
        computeTabLabels() {
            const { labelFormat } = this.accessor.partOptions;
            const { verbosity, shortenDuplicates } = this.getLabelConfigFlags(labelFormat);
            // Build labels and descriptions for each editor
            const labels = this.group.editors.map((editor, index) => ({
                editor,
                name: editor.getName(),
                description: editor.getDescription(verbosity),
                forceDescription: editor.hasCapability(64 /* EditorInputCapabilities.ForceDescription */),
                title: editor.getTitle(2 /* Verbosity.LONG */),
                ariaLabel: (0, editor_2.computeEditorAriaLabel)(editor, index, this.group, this.editorGroupService.count)
            }));
            // Shorten labels as needed
            if (shortenDuplicates) {
                this.shortenTabLabels(labels);
            }
            this.tabLabels = labels;
        }
        shortenTabLabels(labels) {
            // Gather duplicate titles, while filtering out invalid descriptions
            const mapNameToDuplicates = new Map();
            for (const label of labels) {
                if (typeof label.description === 'string') {
                    (0, map_1.getOrSet)(mapNameToDuplicates, label.name, []).push(label);
                }
                else {
                    label.description = '';
                }
            }
            // Identify duplicate names and shorten descriptions
            for (const [, duplicateLabels] of mapNameToDuplicates) {
                // Remove description if the title isn't duplicated
                // and we have no indication to enforce description
                if (duplicateLabels.length === 1 && !duplicateLabels[0].forceDescription) {
                    duplicateLabels[0].description = '';
                    continue;
                }
                // Identify duplicate descriptions
                const mapDescriptionToDuplicates = new Map();
                for (const duplicateLabel of duplicateLabels) {
                    (0, map_1.getOrSet)(mapDescriptionToDuplicates, duplicateLabel.description, []).push(duplicateLabel);
                }
                // For editors with duplicate descriptions, check whether any long descriptions differ
                let useLongDescriptions = false;
                for (const [, duplicateLabels] of mapDescriptionToDuplicates) {
                    if (!useLongDescriptions && duplicateLabels.length > 1) {
                        const [first, ...rest] = duplicateLabels.map(({ editor }) => editor.getDescription(2 /* Verbosity.LONG */));
                        useLongDescriptions = rest.some(description => description !== first);
                    }
                }
                // If so, replace all descriptions with long descriptions
                if (useLongDescriptions) {
                    mapDescriptionToDuplicates.clear();
                    for (const duplicateLabel of duplicateLabels) {
                        duplicateLabel.description = duplicateLabel.editor.getDescription(2 /* Verbosity.LONG */);
                        (0, map_1.getOrSet)(mapDescriptionToDuplicates, duplicateLabel.description, []).push(duplicateLabel);
                    }
                }
                // Obtain final set of descriptions
                const descriptions = [];
                for (const [description] of mapDescriptionToDuplicates) {
                    descriptions.push(description);
                }
                // Remove description if all descriptions are identical unless forced
                if (descriptions.length === 1) {
                    for (const label of mapDescriptionToDuplicates.get(descriptions[0]) || []) {
                        if (!label.forceDescription) {
                            label.description = '';
                        }
                    }
                    continue;
                }
                // Shorten descriptions
                const shortenedDescriptions = (0, labels_1.shorten)(descriptions, this.path.sep);
                descriptions.forEach((description, index) => {
                    for (const label of mapDescriptionToDuplicates.get(description) || []) {
                        label.description = shortenedDescriptions[index];
                    }
                });
            }
        }
        getLabelConfigFlags(value) {
            switch (value) {
                case 'short':
                    return { verbosity: 0 /* Verbosity.SHORT */, shortenDuplicates: false };
                case 'medium':
                    return { verbosity: 1 /* Verbosity.MEDIUM */, shortenDuplicates: false };
                case 'long':
                    return { verbosity: 2 /* Verbosity.LONG */, shortenDuplicates: false };
                default:
                    return { verbosity: 1 /* Verbosity.MEDIUM */, shortenDuplicates: true };
            }
        }
        redraw(options) {
            // Border below tabs if any
            const tabsContainerBorderColor = this.getColor(theme_1.EDITOR_GROUP_HEADER_TABS_BORDER);
            if (this.tabsAndActionsContainer) {
                if (tabsContainerBorderColor) {
                    this.tabsAndActionsContainer.classList.add('tabs-border-bottom');
                    this.tabsAndActionsContainer.style.setProperty('--tabs-border-bottom-color', tabsContainerBorderColor.toString());
                }
                else {
                    this.tabsAndActionsContainer.classList.remove('tabs-border-bottom');
                    this.tabsAndActionsContainer.style.removeProperty('--tabs-border-bottom-color');
                }
            }
            // For each tab
            this.forEachTab((editor, index, tabContainer, tabLabelWidget, tabLabel, tabActionBar) => {
                this.redrawTab(editor, index, tabContainer, tabLabelWidget, tabLabel, tabActionBar);
            });
            // Update Editor Actions Toolbar
            this.updateEditorActionsToolbar();
            // Ensure the active tab is always revealed
            this.layout(this.dimensions, options);
        }
        redrawTab(editor, index, tabContainer, tabLabelWidget, tabLabel, tabActionBar) {
            const isTabSticky = this.group.isSticky(index);
            const options = this.accessor.partOptions;
            // Label
            this.redrawTabLabel(editor, index, tabContainer, tabLabelWidget, tabLabel);
            // Action
            const tabAction = isTabSticky ? this.unpinEditorAction : this.closeEditorAction;
            if (!tabActionBar.hasAction(tabAction)) {
                if (!tabActionBar.isEmpty()) {
                    tabActionBar.clear();
                }
                tabActionBar.push(tabAction, { icon: true, label: false, keybinding: this.getKeybindingLabel(tabAction) });
            }
            // Settings
            const tabActionsVisibility = isTabSticky && options.pinnedTabSizing === 'compact' ? 'off' /* treat sticky compact tabs as tabCloseButton: 'off' */ : options.tabCloseButton;
            for (const option of ['off', 'left', 'right']) {
                tabContainer.classList.toggle(`tab-actions-${option}`, tabActionsVisibility === option);
            }
            const tabSizing = isTabSticky && options.pinnedTabSizing === 'shrink' ? 'shrink' /* treat sticky shrink tabs as tabSizing: 'shrink' */ : options.tabSizing;
            for (const option of ['fit', 'shrink']) {
                tabContainer.classList.toggle(`sizing-${option}`, tabSizing === option);
            }
            tabContainer.classList.toggle('has-icon', options.showIcons && options.hasIcons);
            tabContainer.classList.toggle('sticky', isTabSticky);
            for (const option of ['normal', 'compact', 'shrink']) {
                tabContainer.classList.toggle(`sticky-${option}`, isTabSticky && options.pinnedTabSizing === option);
            }
            // Sticky compact/shrink tabs need a position to remain at their location
            // when scrolling to stay in view (requirement for position: sticky)
            if (isTabSticky && options.pinnedTabSizing !== 'normal') {
                let stickyTabWidth = 0;
                switch (options.pinnedTabSizing) {
                    case 'compact':
                        stickyTabWidth = TabsTitleControl.TAB_WIDTH.compact;
                        break;
                    case 'shrink':
                        stickyTabWidth = TabsTitleControl.TAB_WIDTH.shrink;
                        break;
                }
                tabContainer.style.left = `${index * stickyTabWidth}px`;
            }
            else {
                tabContainer.style.left = 'auto';
            }
            // Borders / outline
            this.redrawTabBorders(index, tabContainer);
            // Active / dirty state
            this.redrawTabActiveAndDirty(this.accessor.activeGroup === this.group, editor, tabContainer, tabActionBar);
        }
        redrawTabLabel(editor, index, tabContainer, tabLabelWidget, tabLabel) {
            var _a, _b, _c;
            const options = this.accessor.partOptions;
            // Unless tabs are sticky compact, show the full label and description
            // Sticky compact tabs will only show an icon if icons are enabled
            // or their first character of the name otherwise
            let name;
            let forceLabel = false;
            let fileDecorationBadges = Boolean((_a = options.decorations) === null || _a === void 0 ? void 0 : _a.badges);
            let description;
            if (options.pinnedTabSizing === 'compact' && this.group.isSticky(index)) {
                const isShowingIcons = options.showIcons && options.hasIcons;
                name = isShowingIcons ? '' : (_b = tabLabel.name) === null || _b === void 0 ? void 0 : _b.charAt(0).toUpperCase();
                description = '';
                forceLabel = true;
                fileDecorationBadges = false; // not enough space when sticky tabs are compact
            }
            else {
                name = tabLabel.name;
                description = tabLabel.description || '';
            }
            if (tabLabel.ariaLabel) {
                tabContainer.setAttribute('aria-label', tabLabel.ariaLabel);
                // Set aria-description to empty string so that screen readers would not read the title as well
                // More details https://github.com/microsoft/vscode/issues/95378
                tabContainer.setAttribute('aria-description', '');
            }
            const title = tabLabel.title || '';
            tabContainer.title = title;
            // Label
            tabLabelWidget.setResource({ name, description, resource: editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH }) }, {
                title,
                extraClasses: (0, arrays_1.coalesce)(['tab-label', fileDecorationBadges ? 'tab-label-has-badge' : undefined].concat(editor.getLabelExtraClasses())),
                italic: !this.group.isPinned(editor),
                forceLabel,
                fileDecorations: {
                    colors: Boolean((_c = options.decorations) === null || _c === void 0 ? void 0 : _c.colors),
                    badges: fileDecorationBadges
                }
            });
            // Tests helper
            const resource = editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
            if (resource) {
                tabContainer.setAttribute('data-resource-name', (0, resources_1.basenameOrAuthority)(resource));
            }
            else {
                tabContainer.removeAttribute('data-resource-name');
            }
        }
        redrawTabActiveAndDirty(isGroupActive, editor, tabContainer, tabActionBar) {
            const isTabActive = this.group.isActive(editor);
            const hasModifiedBorderTop = this.doRedrawTabDirty(isGroupActive, isTabActive, editor, tabContainer);
            this.doRedrawTabActive(isGroupActive, !hasModifiedBorderTop, editor, tabContainer, tabActionBar);
        }
        doRedrawTabActive(isGroupActive, allowBorderTop, editor, tabContainer, tabActionBar) {
            // Tab is active
            if (this.group.isActive(editor)) {
                // Container
                tabContainer.classList.add('active');
                tabContainer.setAttribute('aria-selected', 'true');
                tabContainer.tabIndex = 0; // Only active tab can be focused into
                tabContainer.style.backgroundColor = this.getColor(isGroupActive ? theme_1.TAB_ACTIVE_BACKGROUND : theme_1.TAB_UNFOCUSED_ACTIVE_BACKGROUND) || '';
                const activeTabBorderColorBottom = this.getColor(isGroupActive ? theme_1.TAB_ACTIVE_BORDER : theme_1.TAB_UNFOCUSED_ACTIVE_BORDER);
                if (activeTabBorderColorBottom) {
                    tabContainer.classList.add('tab-border-bottom');
                    tabContainer.style.setProperty('--tab-border-bottom-color', activeTabBorderColorBottom.toString());
                }
                else {
                    tabContainer.classList.remove('tab-border-bottom');
                    tabContainer.style.removeProperty('--tab-border-bottom-color');
                }
                const activeTabBorderColorTop = allowBorderTop ? this.getColor(isGroupActive ? theme_1.TAB_ACTIVE_BORDER_TOP : theme_1.TAB_UNFOCUSED_ACTIVE_BORDER_TOP) : undefined;
                if (activeTabBorderColorTop) {
                    tabContainer.classList.add('tab-border-top');
                    tabContainer.style.setProperty('--tab-border-top-color', activeTabBorderColorTop.toString());
                }
                else {
                    tabContainer.classList.remove('tab-border-top');
                    tabContainer.style.removeProperty('--tab-border-top-color');
                }
                // Label
                tabContainer.style.color = this.getColor(isGroupActive ? theme_1.TAB_ACTIVE_FOREGROUND : theme_1.TAB_UNFOCUSED_ACTIVE_FOREGROUND) || '';
                // Actions
                tabActionBar.setFocusable(true);
            }
            // Tab is inactive
            else {
                // Container
                tabContainer.classList.remove('active');
                tabContainer.setAttribute('aria-selected', 'false');
                tabContainer.tabIndex = -1; // Only active tab can be focused into
                tabContainer.style.backgroundColor = this.getColor(isGroupActive ? theme_1.TAB_INACTIVE_BACKGROUND : theme_1.TAB_UNFOCUSED_INACTIVE_BACKGROUND) || '';
                tabContainer.style.boxShadow = '';
                // Label
                tabContainer.style.color = this.getColor(isGroupActive ? theme_1.TAB_INACTIVE_FOREGROUND : theme_1.TAB_UNFOCUSED_INACTIVE_FOREGROUND) || '';
                // Actions
                tabActionBar.setFocusable(false);
            }
        }
        doRedrawTabDirty(isGroupActive, isTabActive, editor, tabContainer) {
            let hasModifiedBorderColor = false;
            // Tab: dirty (unless saving)
            if (editor.isDirty() && !editor.isSaving()) {
                tabContainer.classList.add('dirty');
                // Highlight modified tabs with a border if configured
                if (this.accessor.partOptions.highlightModifiedTabs) {
                    let modifiedBorderColor;
                    if (isGroupActive && isTabActive) {
                        modifiedBorderColor = this.getColor(theme_1.TAB_ACTIVE_MODIFIED_BORDER);
                    }
                    else if (isGroupActive && !isTabActive) {
                        modifiedBorderColor = this.getColor(theme_1.TAB_INACTIVE_MODIFIED_BORDER);
                    }
                    else if (!isGroupActive && isTabActive) {
                        modifiedBorderColor = this.getColor(theme_1.TAB_UNFOCUSED_ACTIVE_MODIFIED_BORDER);
                    }
                    else {
                        modifiedBorderColor = this.getColor(theme_1.TAB_UNFOCUSED_INACTIVE_MODIFIED_BORDER);
                    }
                    if (modifiedBorderColor) {
                        hasModifiedBorderColor = true;
                        tabContainer.classList.add('dirty-border-top');
                        tabContainer.style.setProperty('--tab-dirty-border-top-color', modifiedBorderColor);
                    }
                }
                else {
                    tabContainer.classList.remove('dirty-border-top');
                    tabContainer.style.removeProperty('--tab-dirty-border-top-color');
                }
            }
            // Tab: not dirty
            else {
                tabContainer.classList.remove('dirty', 'dirty-border-top');
                tabContainer.style.removeProperty('--tab-dirty-border-top-color');
            }
            return hasModifiedBorderColor;
        }
        redrawTabBorders(index, tabContainer) {
            const isTabSticky = this.group.isSticky(index);
            const isTabLastSticky = isTabSticky && this.group.stickyCount === index + 1;
            // Borders / Outline
            const borderRightColor = ((isTabLastSticky ? this.getColor(theme_1.TAB_LAST_PINNED_BORDER) : undefined) || this.getColor(theme_1.TAB_BORDER) || this.getColor(colorRegistry_1.contrastBorder));
            tabContainer.style.borderRight = borderRightColor ? `1px solid ${borderRightColor}` : '';
            tabContainer.style.outlineColor = this.getColor(colorRegistry_1.activeContrastBorder) || '';
        }
        prepareEditorActions(editorActions) {
            const isGroupActive = this.accessor.activeGroup === this.group;
            // Active: allow all actions
            if (isGroupActive) {
                return editorActions;
            }
            // Inactive: only show "Unlock" and secondary actions
            else {
                return {
                    primary: editorActions.primary.filter(action => action.id === editorCommands_1.UNLOCK_GROUP_COMMAND_ID),
                    secondary: editorActions.secondary
                };
            }
        }
        getHeight() {
            const showsBreadcrumbs = this.breadcrumbsControl && !this.breadcrumbsControl.isHidden();
            // Return quickly if our used dimensions are known
            if (this.dimensions.used) {
                return {
                    total: this.dimensions.used.height,
                    offset: showsBreadcrumbs ? this.dimensions.used.height - breadcrumbsControl_1.BreadcrumbsControl.HEIGHT : this.dimensions.used.height
                };
            }
            // Otherwise compute via browser APIs
            else {
                return this.computeHeight();
            }
        }
        computeHeight() {
            var _a;
            let total;
            // Wrap: we need to ask `offsetHeight` to get
            // the real height of the title area with wrapping.
            if (this.accessor.partOptions.wrapTabs && ((_a = this.tabsAndActionsContainer) === null || _a === void 0 ? void 0 : _a.classList.contains('wrapping'))) {
                total = this.tabsAndActionsContainer.offsetHeight;
            }
            else {
                total = TabsTitleControl.TAB_HEIGHT;
            }
            const offset = total;
            // Account for breadcrumbs if visible
            if (this.breadcrumbsControl && !this.breadcrumbsControl.isHidden()) {
                total += breadcrumbsControl_1.BreadcrumbsControl.HEIGHT; // Account for breadcrumbs if visible
            }
            return { total, offset };
        }
        layout(dimensions, options) {
            // Remember dimensions that we get
            Object.assign(this.dimensions, dimensions);
            // The layout of tabs can be an expensive operation because we access DOM properties
            // that can result in the browser doing a full page layout to validate them. To buffer
            // this a little bit we try at least to schedule this work on the next animation frame.
            if (!this.layoutScheduler.value) {
                const scheduledLayout = (0, dom_1.scheduleAtNextAnimationFrame)(() => {
                    var _a;
                    this.doLayout(this.dimensions, (_a = this.layoutScheduler.value) === null || _a === void 0 ? void 0 : _a.options /* ensure to pick up latest options */);
                    this.layoutScheduler.clear();
                });
                this.layoutScheduler.value = { options, dispose: () => scheduledLayout.dispose() };
            }
            // Make sure to keep options updated
            if (options === null || options === void 0 ? void 0 : options.forceRevealActiveTab) {
                this.layoutScheduler.value.options = Object.assign(Object.assign({}, this.layoutScheduler.value.options), { forceRevealActiveTab: true });
            }
            // First time layout: compute the dimensions and store it
            if (!this.dimensions.used) {
                this.dimensions.used = new dom_1.Dimension(dimensions.container.width, this.computeHeight().total);
            }
            return this.dimensions.used;
        }
        doLayout(dimensions, options) {
            // Only layout if we have valid tab index and dimensions
            const activeTabAndIndex = this.group.activeEditor ? this.getTabAndIndex(this.group.activeEditor) : undefined;
            if (activeTabAndIndex && dimensions.container !== dom_1.Dimension.None && dimensions.available !== dom_1.Dimension.None) {
                // Breadcrumbs
                this.doLayoutBreadcrumbs(dimensions);
                // Tabs
                const [activeTab, activeIndex] = activeTabAndIndex;
                this.doLayoutTabs(activeTab, activeIndex, dimensions, options);
            }
            // Remember the dimensions used in the control so that we can
            // return it fast from the `layout` call without having to
            // compute it over and over again
            const oldDimension = this.dimensions.used;
            const newDimension = this.dimensions.used = new dom_1.Dimension(dimensions.container.width, this.computeHeight().total);
            // In case the height of the title control changed from before
            // (currently only possible if wrapping changed on/off), we need
            // to signal this to the outside via a `relayout` call so that
            // e.g. the editor control can be adjusted accordingly.
            if (oldDimension && oldDimension.height !== newDimension.height) {
                this.group.relayout();
            }
        }
        handleBreadcrumbsEnablementChange() {
            this.group.relayout(); // relayout when breadcrumbs are enable/disabled
        }
        doLayoutBreadcrumbs(dimensions) {
            if (this.breadcrumbsControl && !this.breadcrumbsControl.isHidden()) {
                this.breadcrumbsControl.layout(new dom_1.Dimension(dimensions.container.width, breadcrumbsControl_1.BreadcrumbsControl.HEIGHT));
            }
        }
        doLayoutTabs(activeTab, activeIndex, dimensions, options) {
            // Always first layout tabs with wrapping support even if wrapping
            // is disabled. The result indicates if tabs wrap and if not, we
            // need to proceed with the layout without wrapping because even
            // if wrapping is enabled in settings, there are cases where
            // wrapping is disabled (e.g. due to space constraints)
            const tabsWrapMultiLine = this.doLayoutTabsWrapping(dimensions);
            if (!tabsWrapMultiLine) {
                this.doLayoutTabsNonWrapping(activeTab, activeIndex, options);
            }
        }
        doLayoutTabsWrapping(dimensions) {
            const [tabsAndActionsContainer, tabsContainer, editorToolbarContainer, tabsScrollbar] = (0, types_1.assertAllDefined)(this.tabsAndActionsContainer, this.tabsContainer, this.editorToolbarContainer, this.tabsScrollbar);
            // Handle wrapping tabs according to setting:
            // - enabled: only add class if tabs wrap and don't exceed available dimensions
            // - disabled: remove class and margin-right variable
            const didTabsWrapMultiLine = tabsAndActionsContainer.classList.contains('wrapping');
            let tabsWrapMultiLine = didTabsWrapMultiLine;
            function updateTabsWrapping(enabled) {
                tabsWrapMultiLine = enabled;
                // Toggle the `wrapped` class to enable wrapping
                tabsAndActionsContainer.classList.toggle('wrapping', tabsWrapMultiLine);
                // Update `last-tab-margin-right` CSS variable to account for the absolute
                // positioned editor actions container when tabs wrap. The margin needs to
                // be the width of the editor actions container to avoid screen cheese.
                tabsContainer.style.setProperty('--last-tab-margin-right', tabsWrapMultiLine ? `${editorToolbarContainer.offsetWidth}px` : '0');
            }
            // Setting enabled: selectively enable wrapping if possible
            if (this.accessor.partOptions.wrapTabs) {
                const visibleTabsWidth = tabsContainer.offsetWidth;
                const allTabsWidth = tabsContainer.scrollWidth;
                const lastTabFitsWrapped = () => {
                    const lastTab = this.getLastTab();
                    if (!lastTab) {
                        return true; // no tab always fits
                    }
                    const lastTabOverlapWithToolbarWidth = lastTab.offsetWidth + editorToolbarContainer.offsetWidth - dimensions.available.width;
                    if (lastTabOverlapWithToolbarWidth > 1) {
                        // Allow for slight rounding errors related to zooming here
                        // https://github.com/microsoft/vscode/issues/116385
                        return false;
                    }
                    return true;
                };
                // If tabs wrap or should start to wrap (when width exceeds visible width)
                // we must trigger `updateWrapping` to set the `last-tab-margin-right`
                // accordingly based on the number of actions. The margin is important to
                // properly position the last tab apart from the actions
                //
                // We already check here if the last tab would fit when wrapped given the
                // editor toolbar will also show right next to it. This ensures we are not
                // enabling wrapping only to disable it again in the code below (this fixes
                // flickering issue https://github.com/microsoft/vscode/issues/115050)
                if (tabsWrapMultiLine || (allTabsWidth > visibleTabsWidth && lastTabFitsWrapped())) {
                    updateTabsWrapping(true);
                }
                // Tabs wrap multiline: remove wrapping under certain size constraint conditions
                if (tabsWrapMultiLine) {
                    if ((tabsContainer.offsetHeight > dimensions.available.height) || // if height exceeds available height
                        (allTabsWidth === visibleTabsWidth && tabsContainer.offsetHeight === TabsTitleControl.TAB_HEIGHT) || // if wrapping is not needed anymore
                        (!lastTabFitsWrapped()) // if last tab does not fit anymore
                    ) {
                        updateTabsWrapping(false);
                    }
                }
            }
            // Setting disabled: remove CSS traces only if tabs did wrap
            else if (didTabsWrapMultiLine) {
                updateTabsWrapping(false);
            }
            // If we transitioned from non-wrapping to wrapping, we need
            // to update the scrollbar to have an equal `width` and
            // `scrollWidth`. Otherwise a scrollbar would appear which is
            // never desired when wrapping.
            if (tabsWrapMultiLine && !didTabsWrapMultiLine) {
                const visibleTabsWidth = tabsContainer.offsetWidth;
                tabsScrollbar.setScrollDimensions({
                    width: visibleTabsWidth,
                    scrollWidth: visibleTabsWidth
                });
            }
            // Update the `last-in-row` class on tabs when wrapping
            // is enabled (it doesn't do any harm otherwise). This
            // class controls additional properties of tab when it is
            // the last tab in a row
            if (tabsWrapMultiLine) {
                // Using a map here to change classes after the for loop is
                // crucial for performance because changing the class on a
                // tab can result in layouts of the rendering engine.
                const tabs = new Map();
                let currentTabsPosY = undefined;
                let lastTab = undefined;
                for (const child of tabsContainer.children) {
                    const tab = child;
                    const tabPosY = tab.offsetTop;
                    // Marks a new or the first row of tabs
                    if (tabPosY !== currentTabsPosY) {
                        currentTabsPosY = tabPosY;
                        if (lastTab) {
                            tabs.set(lastTab, true); // previous tab must be last in row then
                        }
                    }
                    // Always remember last tab and ensure the
                    // last-in-row class is not present until
                    // we know the tab is last
                    lastTab = tab;
                    tabs.set(tab, false);
                }
                // Last tab overally is always last-in-row
                if (lastTab) {
                    tabs.set(lastTab, true);
                }
                for (const [tab, lastInRow] of tabs) {
                    tab.classList.toggle('last-in-row', lastInRow);
                }
            }
            return tabsWrapMultiLine;
        }
        doLayoutTabsNonWrapping(activeTab, activeIndex, options) {
            const [tabsContainer, tabsScrollbar] = (0, types_1.assertAllDefined)(this.tabsContainer, this.tabsScrollbar);
            //
            // Synopsis
            // - allTabsWidth:   			sum of all tab widths
            // - stickyTabsWidth:			sum of all sticky tab widths (unless `pinnedTabSizing: normal`)
            // - visibleContainerWidth: 	size of tab container
            // - availableContainerWidth: 	size of tab container minus size of sticky tabs
            //
            // [------------------------------ All tabs width ---------------------------------------]
            // [------------------- Visible container width -------------------]
            //                         [------ Available container width ------]
            // [ Sticky A ][ Sticky B ][ Tab C ][ Tab D ][ Tab E ][ Tab F ][ Tab G ][ Tab H ][ Tab I ]
            //                 Active Tab Width [-------]
            // [------- Active Tab Pos X -------]
            // [-- Sticky Tabs Width --]
            //
            const visibleTabsWidth = tabsContainer.offsetWidth;
            const allTabsWidth = tabsContainer.scrollWidth;
            // Compute width of sticky tabs depending on pinned tab sizing
            // - compact: sticky-tabs * TAB_SIZES.compact
            // -  shrink: sticky-tabs * TAB_SIZES.shrink
            // -  normal: 0 (sticky tabs inherit look and feel from non-sticky tabs)
            let stickyTabsWidth = 0;
            if (this.group.stickyCount > 0) {
                let stickyTabWidth = 0;
                switch (this.accessor.partOptions.pinnedTabSizing) {
                    case 'compact':
                        stickyTabWidth = TabsTitleControl.TAB_WIDTH.compact;
                        break;
                    case 'shrink':
                        stickyTabWidth = TabsTitleControl.TAB_WIDTH.shrink;
                        break;
                }
                stickyTabsWidth = this.group.stickyCount * stickyTabWidth;
            }
            // Figure out if active tab is positioned static which has an
            // impact on whether to reveal the tab or not later
            let activeTabPositionStatic = this.accessor.partOptions.pinnedTabSizing !== 'normal' && this.group.isSticky(activeIndex);
            // Special case: we have sticky tabs but the available space for showing tabs
            // is little enough that we need to disable sticky tabs sticky positioning
            // so that tabs can be scrolled at naturally.
            let availableTabsContainerWidth = visibleTabsWidth - stickyTabsWidth;
            if (this.group.stickyCount > 0 && availableTabsContainerWidth < TabsTitleControl.TAB_WIDTH.fit) {
                tabsContainer.classList.add('disable-sticky-tabs');
                availableTabsContainerWidth = visibleTabsWidth;
                stickyTabsWidth = 0;
                activeTabPositionStatic = false;
            }
            else {
                tabsContainer.classList.remove('disable-sticky-tabs');
            }
            let activeTabPosX;
            let activeTabWidth;
            if (!this.blockRevealActiveTab) {
                activeTabPosX = activeTab.offsetLeft;
                activeTabWidth = activeTab.offsetWidth;
            }
            // Update scrollbar
            const { width: oldVisibleTabsWidth, scrollWidth: oldAllTabsWidth } = tabsScrollbar.getScrollDimensions();
            tabsScrollbar.setScrollDimensions({
                width: visibleTabsWidth,
                scrollWidth: allTabsWidth
            });
            const dimensionsChanged = oldVisibleTabsWidth !== visibleTabsWidth || oldAllTabsWidth !== allTabsWidth;
            // Revealing the active tab is skipped under some conditions:
            if (this.blockRevealActiveTab || // explicitly disabled
                typeof activeTabPosX !== 'number' || // invalid dimension
                typeof activeTabWidth !== 'number' || // invalid dimension
                activeTabPositionStatic || // static tab (sticky)
                (!dimensionsChanged && !(options === null || options === void 0 ? void 0 : options.forceRevealActiveTab)) // dimensions did not change and we have low layout priority (https://github.com/microsoft/vscode/issues/133631)
            ) {
                this.blockRevealActiveTab = false;
                return;
            }
            // Reveal the active one
            const tabsContainerScrollPosX = tabsScrollbar.getScrollPosition().scrollLeft;
            const activeTabFits = activeTabWidth <= availableTabsContainerWidth;
            const adjustedActiveTabPosX = activeTabPosX - stickyTabsWidth;
            //
            // Synopsis
            // - adjustedActiveTabPosX: the adjusted tabPosX takes the width of sticky tabs into account
            //   conceptually the scrolling only begins after sticky tabs so in order to reveal a tab fully
            //   the actual position needs to be adjusted for sticky tabs.
            //
            // Tab is overflowing to the right: Scroll minimally until the element is fully visible to the right
            // Note: only try to do this if we actually have enough width to give to show the tab fully!
            //
            // Example: Tab G should be made active and needs to be fully revealed as such.
            //
            // [-------------------------------- All tabs width -----------------------------------------]
            // [-------------------- Visible container width --------------------]
            //                           [----- Available container width -------]
            //     [ Sticky A ][ Sticky B ][ Tab C ][ Tab D ][ Tab E ][ Tab F ][ Tab G ][ Tab H ][ Tab I ]
            //                     Active Tab Width [-------]
            //     [------- Active Tab Pos X -------]
            //                             [-------- Adjusted Tab Pos X -------]
            //     [-- Sticky Tabs Width --]
            //
            //
            if (activeTabFits && tabsContainerScrollPosX + availableTabsContainerWidth < adjustedActiveTabPosX + activeTabWidth) {
                tabsScrollbar.setScrollPosition({
                    scrollLeft: tabsContainerScrollPosX + ((adjustedActiveTabPosX + activeTabWidth) /* right corner of tab */ - (tabsContainerScrollPosX + availableTabsContainerWidth) /* right corner of view port */)
                });
            }
            //
            // Tab is overlflowing to the left or does not fit: Scroll it into view to the left
            //
            // Example: Tab C should be made active and needs to be fully revealed as such.
            //
            // [----------------------------- All tabs width ----------------------------------------]
            //     [------------------ Visible container width ------------------]
            //                           [----- Available container width -------]
            // [ Sticky A ][ Sticky B ][ Tab C ][ Tab D ][ Tab E ][ Tab F ][ Tab G ][ Tab H ][ Tab I ]
            //                 Active Tab Width [-------]
            // [------- Active Tab Pos X -------]
            //      Adjusted Tab Pos X []
            // [-- Sticky Tabs Width --]
            //
            //
            else if (tabsContainerScrollPosX > adjustedActiveTabPosX || !activeTabFits) {
                tabsScrollbar.setScrollPosition({
                    scrollLeft: adjustedActiveTabPosX
                });
            }
        }
        getTabAndIndex(editor) {
            const editorIndex = this.group.getIndexOfEditor(editor);
            const tab = this.getTabAtIndex(editorIndex);
            if (tab) {
                return [tab, editorIndex];
            }
            return undefined;
        }
        getTabAtIndex(editorIndex) {
            if (editorIndex >= 0) {
                const tabsContainer = (0, types_1.assertIsDefined)(this.tabsContainer);
                return tabsContainer.children[editorIndex];
            }
            return undefined;
        }
        getLastTab() {
            return this.getTabAtIndex(this.group.count - 1);
        }
        blockRevealActiveTabOnce() {
            // When closing tabs through the tab close button or gesture, the user
            // might want to rapidly close tabs in sequence and as such revealing
            // the active tab after each close would be annoying. As such we block
            // the automated revealing of the active tab once after the close is
            // triggered.
            this.blockRevealActiveTab = true;
        }
        originatesFromTabActionBar(e) {
            let element;
            if (e instanceof MouseEvent) {
                element = (e.target || e.srcElement);
            }
            else {
                element = e.initialTarget;
            }
            return !!(0, dom_1.findParentWithClass)(element, 'action-item', 'tab');
        }
        async onDrop(e, targetIndex, tabsContainer) {
            dom_1.EventHelper.stop(e, true);
            this.updateDropFeedback(tabsContainer, false);
            tabsContainer.classList.remove('scroll');
            // Check for group transfer
            if (this.groupTransfer.hasData(dnd_1.DraggedEditorGroupIdentifier.prototype)) {
                const data = this.groupTransfer.getData(dnd_1.DraggedEditorGroupIdentifier.prototype);
                if (Array.isArray(data)) {
                    const sourceGroup = this.accessor.getGroup(data[0].identifier);
                    if (sourceGroup) {
                        const mergeGroupOptions = { index: targetIndex };
                        if (!this.isMoveOperation(e, sourceGroup.id)) {
                            mergeGroupOptions.mode = 0 /* MergeGroupMode.COPY_EDITORS */;
                        }
                        this.accessor.mergeGroup(sourceGroup, this.group, mergeGroupOptions);
                    }
                    this.group.focus();
                    this.groupTransfer.clearData(dnd_1.DraggedEditorGroupIdentifier.prototype);
                }
            }
            // Check for editor transfer
            else if (this.editorTransfer.hasData(dnd_1.DraggedEditorIdentifier.prototype)) {
                const data = this.editorTransfer.getData(dnd_1.DraggedEditorIdentifier.prototype);
                if (Array.isArray(data)) {
                    const draggedEditor = data[0].identifier;
                    const sourceGroup = this.accessor.getGroup(draggedEditor.groupId);
                    if (sourceGroup) {
                        // Move editor to target position and index
                        if (this.isMoveOperation(e, draggedEditor.groupId, draggedEditor.editor)) {
                            sourceGroup.moveEditor(draggedEditor.editor, this.group, { index: targetIndex });
                        }
                        // Copy editor to target position and index
                        else {
                            sourceGroup.copyEditor(draggedEditor.editor, this.group, { index: targetIndex });
                        }
                    }
                    this.group.focus();
                    this.editorTransfer.clearData(dnd_1.DraggedEditorIdentifier.prototype);
                }
            }
            // Check for tree items
            else if (this.treeItemsTransfer.hasData(dnd_1.DraggedTreeItemsIdentifier.prototype)) {
                const data = this.treeItemsTransfer.getData(dnd_1.DraggedTreeItemsIdentifier.prototype);
                if (Array.isArray(data)) {
                    const editors = [];
                    for (const id of data) {
                        const dataTransferItem = await this.treeViewsDragAndDropService.removeDragOperationTransfer(id.identifier);
                        if (dataTransferItem) {
                            const treeDropData = await (0, dnd_1.extractTreeDropData)(dataTransferItem);
                            editors.push(...treeDropData.map(editor => (Object.assign(Object.assign({}, editor), { options: Object.assign(Object.assign({}, editor.options), { pinned: true, index: targetIndex }) }))));
                        }
                    }
                    this.editorService.openEditors(editors, this.group, { validateTrust: true });
                }
                this.treeItemsTransfer.clearData(dnd_1.DraggedTreeItemsIdentifier.prototype);
            }
            // Check for URI transfer
            else {
                const dropHandler = this.instantiationService.createInstance(dnd_1.ResourcesDropHandler, { allowWorkspaceOpen: false });
                dropHandler.handleDrop(e, () => this.group, () => this.group.focus(), targetIndex);
            }
        }
        isMoveOperation(e, sourceGroup, sourceEditor) {
            if (sourceEditor === null || sourceEditor === void 0 ? void 0 : sourceEditor.hasCapability(8 /* EditorInputCapabilities.Singleton */)) {
                return true; // Singleton editors cannot be split
            }
            const isCopy = (e.ctrlKey && !platform_1.isMacintosh) || (e.altKey && platform_1.isMacintosh);
            return !isCopy || sourceGroup === this.group.id;
        }
        dispose() {
            super.dispose();
            this.tabDisposables = (0, lifecycle_1.dispose)(this.tabDisposables);
        }
    };
    TabsTitleControl.SCROLLBAR_SIZES = {
        default: 3,
        large: 10
    };
    TabsTitleControl.TAB_WIDTH = {
        compact: 38,
        shrink: 80,
        fit: 120
    };
    TabsTitleControl.TAB_HEIGHT = 35;
    TabsTitleControl.MOUSE_WHEEL_EVENT_THRESHOLD = 150;
    TabsTitleControl.MOUSE_WHEEL_DISTANCE_THRESHOLD = 1.5;
    TabsTitleControl = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, notification_1.INotificationService),
        __param(9, actions_1.IMenuService),
        __param(10, quickInput_1.IQuickInputService),
        __param(11, themeService_1.IThemeService),
        __param(12, configuration_1.IConfigurationService),
        __param(13, files_1.IFileService),
        __param(14, editorService_1.IEditorService),
        __param(15, pathService_1.IPathService),
        __param(16, editorGroupsService_1.IEditorGroupsService),
        __param(17, treeViewsService_1.ITreeViewsService)
    ], TabsTitleControl);
    exports.TabsTitleControl = TabsTitleControl;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        // Add border between tabs and breadcrumbs in high contrast mode.
        if ((0, theme_2.isHighContrast)(theme.type)) {
            const borderColor = (theme.getColor(theme_1.TAB_BORDER) || theme.getColor(colorRegistry_1.contrastBorder));
            if (borderColor) {
                collector.addRule(`
				.monaco-workbench .part.editor > .content .editor-group-container > .title > .tabs-and-actions-container {
					border-bottom: 1px solid ${borderColor};
				}
			`);
            }
        }
        // Add bottom border to tabs when wrapping
        const borderColor = theme.getColor(theme_1.TAB_BORDER);
        if (borderColor) {
            collector.addRule(`
				.monaco-workbench .part.editor > .content .editor-group-container > .title > .tabs-and-actions-container.wrapping .tabs-container > .tab {
					border-bottom: 1px solid ${borderColor};
				}
			`);
        }
        // Styling with Outline color (e.g. high contrast theme)
        const activeContrastBorderColor = theme.getColor(colorRegistry_1.activeContrastBorder);
        if (activeContrastBorderColor) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active,
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active:hover  {
				outline: 1px solid;
				outline-offset: -5px;
			}

			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover  {
				outline: 1px dashed;
				outline-offset: -5px;
			}

			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active > .tab-actions .action-label,
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.active:hover > .tab-actions .action-label,
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.dirty > .tab-actions .action-label,
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab.sticky > .tab-actions .action-label,
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover > .tab-actions .action-label {
				opacity: 1 !important;
			}
		`);
        }
        // High Contrast Border Color for Editor Actions
        const contrastBorderColor = theme.getColor(colorRegistry_1.contrastBorder);
        if (contrastBorderColor) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .editor-actions {
				outline: 1px solid ${contrastBorderColor}
			}
		`);
        }
        // Hover Background
        const tabHoverBackground = theme.getColor(theme_1.TAB_HOVER_BACKGROUND);
        if (tabHoverBackground) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab:hover  {
				background-color: ${tabHoverBackground} !important;
			}
		`);
        }
        const tabUnfocusedHoverBackground = theme.getColor(theme_1.TAB_UNFOCUSED_HOVER_BACKGROUND);
        if (tabUnfocusedHoverBackground) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover  {
				background-color: ${tabUnfocusedHoverBackground} !important;
			}
		`);
        }
        // Hover Foreground
        const tabHoverForeground = theme.getColor(theme_1.TAB_HOVER_FOREGROUND);
        if (tabHoverForeground) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab:hover  {
				color: ${tabHoverForeground} !important;
			}
		`);
        }
        const tabUnfocusedHoverForeground = theme.getColor(theme_1.TAB_UNFOCUSED_HOVER_FOREGROUND);
        if (tabUnfocusedHoverForeground) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover  {
				color: ${tabUnfocusedHoverForeground} !important;
			}
		`);
        }
        // Hover Border
        //
        // Unfortunately we need to copy a lot of CSS over from the
        // tabsTitleControl.css because we want to reuse the same
        // styles we already have for the normal bottom-border.
        const tabHoverBorder = theme.getColor(theme_1.TAB_HOVER_BORDER);
        if (tabHoverBorder) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container.active > .title .tabs-container > .tab:hover > .tab-border-bottom-container {
				display: block;
				position: absolute;
				left: 0;
				pointer-events: none;
				width: 100%;
				z-index: 10;
				bottom: 0;
				height: 1px;
				background-color: ${tabHoverBorder};
			}
		`);
        }
        const tabUnfocusedHoverBorder = theme.getColor(theme_1.TAB_UNFOCUSED_HOVER_BORDER);
        if (tabUnfocusedHoverBorder) {
            collector.addRule(`
			.monaco-workbench .part.editor > .content .editor-group-container > .title .tabs-container > .tab:hover > .tab-border-bottom-container  {
				display: block;
				position: absolute;
				left: 0;
				pointer-events: none;
				width: 100%;
				z-index: 10;
				bottom: 0;
				height: 1px;
				background-color: ${tabUnfocusedHoverBorder};
			}
		`);
        }
        // Fade out styles via linear gradient (when tabs are set to shrink)
        // But not when:
        // - in high contrast theme
        // - if we have a contrast border (which draws an outline - https://github.com/microsoft/vscode/issues/109117)
        // - on Safari (https://github.com/microsoft/vscode/issues/108996)
        if ((0, theme_2.isHighContrast)(theme.type) && !browser_1.isSafari && !activeContrastBorderColor) {
            const workbenchBackground = (0, theme_1.WORKBENCH_BACKGROUND)(theme);
            const editorBackgroundColor = theme.getColor(colorRegistry_1.editorBackground);
            const editorGroupHeaderTabsBackground = theme.getColor(theme_1.EDITOR_GROUP_HEADER_TABS_BACKGROUND);
            const editorDragAndDropBackground = theme.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND);
            let adjustedTabBackground;
            if (editorGroupHeaderTabsBackground && editorBackgroundColor) {
                adjustedTabBackground = editorGroupHeaderTabsBackground.flatten(editorBackgroundColor, editorBackgroundColor, workbenchBackground);
            }
            let adjustedTabDragBackground;
            if (editorGroupHeaderTabsBackground && editorBackgroundColor && editorDragAndDropBackground && editorBackgroundColor) {
                adjustedTabDragBackground = editorGroupHeaderTabsBackground.flatten(editorBackgroundColor, editorDragAndDropBackground, editorBackgroundColor, workbenchBackground);
            }
            // Adjust gradient for focused and unfocused hover background
            const makeTabHoverBackgroundRule = (color, colorDrag, hasFocus = false) => `
			.monaco-workbench .part.editor > .content:not(.dragged-over) .editor-group-container${hasFocus ? '.active' : ''} > .title .tabs-container > .tab.sizing-shrink:not(.dragged):not(.sticky-compact):hover > .tab-label > .monaco-icon-label-container::after {
				background: linear-gradient(to left, ${color}, transparent) !important;
			}

			.monaco-workbench .part.editor > .content.dragged-over .editor-group-container${hasFocus ? '.active' : ''} > .title .tabs-container > .tab.sizing-shrink:not(.dragged):not(.sticky-compact):hover > .tab-label > .monaco-icon-label-container::after {
				background: linear-gradient(to left, ${colorDrag}, transparent) !important;
			}
		`;
            // Adjust gradient for (focused) hover background
            if (tabHoverBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabHoverBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabHoverBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabHoverBackgroundRule(adjustedColor, adjustedColorDrag, true));
            }
            // Adjust gradient for unfocused hover background
            if (tabUnfocusedHoverBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabUnfocusedHoverBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabUnfocusedHoverBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabHoverBackgroundRule(adjustedColor, adjustedColorDrag));
            }
            // Adjust gradient for drag and drop background
            if (editorDragAndDropBackground && adjustedTabDragBackground) {
                const adjustedColorDrag = editorDragAndDropBackground.flatten(adjustedTabDragBackground);
                collector.addRule(`
				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container.active > .title .tabs-container > .tab.sizing-shrink.dragged-over:not(.active):not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after,
				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container:not(.active) > .title .tabs-container > .tab.sizing-shrink.dragged-over:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after {
					background: linear-gradient(to left, ${adjustedColorDrag}, transparent) !important;
				}
		`);
            }
            const makeTabBackgroundRule = (color, colorDrag, focused, active) => `
				.monaco-workbench .part.editor > .content:not(.dragged-over) .editor-group-container${focused ? '.active' : ':not(.active)'} > .title .tabs-container > .tab.sizing-shrink${active ? '.active' : ''}:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after {
					background: linear-gradient(to left, ${color}, transparent);
				}

				.monaco-workbench .part.editor > .content.dragged-over .editor-group-container${focused ? '.active' : ':not(.active)'} > .title .tabs-container > .tab.sizing-shrink${active ? '.active' : ''}:not(.dragged):not(.sticky-compact) > .tab-label > .monaco-icon-label-container::after {
					background: linear-gradient(to left, ${colorDrag}, transparent);
				}
		`;
            // Adjust gradient for focused active tab background
            const tabActiveBackground = theme.getColor(theme_1.TAB_ACTIVE_BACKGROUND);
            if (tabActiveBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabActiveBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabActiveBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabBackgroundRule(adjustedColor, adjustedColorDrag, true, true));
            }
            // Adjust gradient for unfocused active tab background
            const tabUnfocusedActiveBackground = theme.getColor(theme_1.TAB_UNFOCUSED_ACTIVE_BACKGROUND);
            if (tabUnfocusedActiveBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabUnfocusedActiveBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabUnfocusedActiveBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabBackgroundRule(adjustedColor, adjustedColorDrag, false, true));
            }
            // Adjust gradient for focused inactive tab background
            const tabInactiveBackground = theme.getColor(theme_1.TAB_INACTIVE_BACKGROUND);
            if (tabInactiveBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabInactiveBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabInactiveBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabBackgroundRule(adjustedColor, adjustedColorDrag, true, false));
            }
            // Adjust gradient for unfocused inactive tab background
            const tabUnfocusedInactiveBackground = theme.getColor(theme_1.TAB_UNFOCUSED_INACTIVE_BACKGROUND);
            if (tabUnfocusedInactiveBackground && adjustedTabBackground && adjustedTabDragBackground) {
                const adjustedColor = tabUnfocusedInactiveBackground.flatten(adjustedTabBackground);
                const adjustedColorDrag = tabUnfocusedInactiveBackground.flatten(adjustedTabDragBackground);
                collector.addRule(makeTabBackgroundRule(adjustedColor, adjustedColorDrag, false, false));
            }
        }
    });
});
//# sourceMappingURL=tabsTitleControl.js.map