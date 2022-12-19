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
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/actions", "vs/platform/telemetry/common/telemetry", "vs/workbench/services/editor/common/editorService", "vs/workbench/contrib/markers/browser/constants", "vs/workbench/contrib/markers/browser/markersModel", "vs/platform/instantiation/common/instantiation", "vs/workbench/contrib/markers/browser/markersViewActions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/markers/browser/messages", "vs/workbench/browser/codeeditor", "vs/platform/theme/common/themeService", "vs/platform/storage/common/storage", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/base/common/iterator", "vs/base/common/event", "vs/platform/list/browser/listService", "vs/workbench/contrib/markers/browser/markersFilterOptions", "vs/base/common/objects", "vs/platform/workspace/common/workspace", "vs/workbench/contrib/markers/browser/markersTreeViewer", "vs/platform/contextview/browser/contextView", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/actions/common/actions", "vs/platform/keybinding/common/keybinding", "vs/base/browser/keyboardEvent", "vs/workbench/browser/labels", "vs/platform/markers/common/markers", "vs/base/common/types", "vs/workbench/common/memento", "vs/platform/accessibility/common/accessibility", "vs/platform/theme/common/colorRegistry", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/base/common/codicons", "vs/base/browser/ui/actionbar/actionViewItems", "vs/platform/uriIdentity/common/uriIdentity", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/base/common/map", "vs/workbench/common/editor", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/workbench/browser/dnd", "vs/css!./media/markers"], function (require, exports, dom, actions_1, telemetry_1, editorService_1, constants_1, markersModel_1, instantiation_1, markersViewActions_1, configuration_1, messages_1, codeeditor_1, themeService_1, storage_1, nls_1, contextkey_1, iterator_1, event_1, listService_1, markersFilterOptions_1, objects_1, workspace_1, markersTreeViewer_1, contextView_1, actionbar_1, actions_2, keybinding_1, keyboardEvent_1, labels_1, markers_1, types_1, memento_1, accessibility_1, colorRegistry_1, viewPane_1, views_1, opener_1, codicons_1, actionViewItems_1, uriIdentity_1, lifecycle_1, arrays_1, map_1, editor_1, menuEntryActionViewItem_1, dnd_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MarkersView = void 0;
    function createResourceMarkersIterator(resourceMarkers) {
        return iterator_1.Iterable.map(resourceMarkers.markers, m => {
            const relatedInformationIt = iterator_1.Iterable.from(m.relatedInformation);
            const children = iterator_1.Iterable.map(relatedInformationIt, r => ({ element: r }));
            return { element: m, children };
        });
    }
    let MarkersView = class MarkersView extends viewPane_1.ViewPane {
        constructor(options, instantiationService, viewDescriptorService, editorService, configurationService, telemetryService, markerService, contextKeyService, workspaceContextService, contextMenuService, menuService, uriIdentityService, keybindingService, storageService, openerService, themeService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.editorService = editorService;
            this.markerService = markerService;
            this.workspaceContextService = workspaceContextService;
            this.menuService = menuService;
            this.uriIdentityService = uriIdentityService;
            this.lastSelectedRelativeTop = 0;
            this.currentActiveResource = null;
            this.onVisibleDisposables = this._register(new lifecycle_1.DisposableStore());
            this._onDidChangeFilterStats = this._register(new event_1.Emitter());
            this.onDidChangeFilterStats = this._onDidChangeFilterStats.event;
            this.cachedFilterStats = undefined;
            this.currentResourceGotAddedToMarkersData = false;
            this.onDidChangeVisibility = this.onDidChangeBodyVisibility;
            this._onDidFocusFilter = this._register(new event_1.Emitter());
            this.onDidFocusFilter = this._onDidFocusFilter.event;
            this._onDidClearFilterText = this._register(new event_1.Emitter());
            this.onDidClearFilterText = this._onDidClearFilterText.event;
            this.smallLayoutContextKey = constants_1.default.MarkersViewSmallLayoutContextKey.bindTo(this.contextKeyService);
            this.panelState = new memento_1.Memento(constants_1.default.MARKERS_VIEW_STORAGE_ID, storageService).getMemento(1 /* StorageScope.WORKSPACE */, 0 /* StorageTarget.USER */);
            this.markersModel = this._register(instantiationService.createInstance(markersModel_1.MarkersModel));
            this.markersViewModel = this._register(instantiationService.createInstance(markersTreeViewer_1.MarkersViewModel, this.panelState['multiline']));
            this._register(this.onDidChangeVisibility(visible => this.onDidChangeMarkersViewVisibility(visible)));
            this.setCurrentActiveEditor();
            this.filter = new markersTreeViewer_1.Filter(markersFilterOptions_1.FilterOptions.EMPTY(uriIdentityService));
            this.rangeHighlightDecorations = this._register(this.instantiationService.createInstance(codeeditor_1.RangeHighlightDecorations));
            this.filters = this._register(new markersViewActions_1.MarkersFilters({
                filterText: this.panelState['filter'] || '',
                filterHistory: this.panelState['filterHistory'] || [],
                showErrors: this.panelState['showErrors'] !== false,
                showWarnings: this.panelState['showWarnings'] !== false,
                showInfos: this.panelState['showInfos'] !== false,
                excludedFiles: !!this.panelState['useFilesExclude'],
                activeFile: !!this.panelState['activeFile'],
                layout: new dom.Dimension(0, 0)
            }));
        }
        get smallLayout() { return !!this.smallLayoutContextKey.get(); }
        set smallLayout(smallLayout) { this.smallLayoutContextKey.set(smallLayout); }
        renderBody(parent) {
            super.renderBody(parent);
            parent.classList.add('markers-panel');
            const container = dom.append(parent, dom.$('.markers-panel-container'));
            this.createFilterActionBar(container);
            this.createArialLabelElement(container);
            this.createMessageBox(container);
            this.createTree(container);
            this.updateFilter();
            this.filterActionBar.push(new actions_1.Action(`workbench.actions.treeView.${this.id}.filter`));
            this.renderContent();
        }
        getTitle() {
            return messages_1.default.MARKERS_PANEL_TITLE_PROBLEMS;
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            const wasSmallLayout = this.smallLayout;
            this.smallLayout = width < 600 && height > 100;
            if (this.smallLayout !== wasSmallLayout) {
                if (this.filterActionBar) {
                    this.filterActionBar.getContainer().classList.toggle('hide', !this.smallLayout);
                }
            }
            const contentHeight = this.smallLayout ? height - 44 : height;
            if (this.tree) {
                this.tree.layout(contentHeight, width);
            }
            if (this.messageBoxContainer) {
                this.messageBoxContainer.style.height = `${contentHeight}px`;
            }
            this.filters.layout = new dom.Dimension(this.smallLayout ? width : width - 200, height);
        }
        focus() {
            if (this.tree && this.tree.getHTMLElement() === document.activeElement) {
                return;
            }
            if (this.hasNoProblems() && this.messageBoxContainer) {
                this.messageBoxContainer.focus();
            }
            else if (this.tree) {
                this.tree.domFocus();
                this.setTreeSelection();
            }
        }
        focusFilter() {
            this._onDidFocusFilter.fire();
        }
        clearFilterText() {
            this._onDidClearFilterText.fire();
        }
        showQuickFixes(marker) {
            const viewModel = this.markersViewModel.getViewModel(marker);
            if (viewModel) {
                viewModel.quickFixAction.run();
            }
        }
        openFileAtElement(element, preserveFocus, sideByside, pinned) {
            const { resource, selection } = element instanceof markersModel_1.Marker ? { resource: element.resource, selection: element.range } :
                element instanceof markersModel_1.RelatedInformation ? { resource: element.raw.resource, selection: element.raw } : { resource: null, selection: null };
            if (resource && selection) {
                this.editorService.openEditor({
                    resource,
                    options: {
                        selection,
                        preserveFocus,
                        pinned,
                        revealIfVisible: true
                    },
                }, sideByside ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP).then(editor => {
                    if (editor && preserveFocus) {
                        this.rangeHighlightDecorations.highlightRange({ resource, range: selection }, editor.getControl());
                    }
                    else {
                        this.rangeHighlightDecorations.removeHighlightRange();
                    }
                });
                return true;
            }
            else {
                this.rangeHighlightDecorations.removeHighlightRange();
            }
            return false;
        }
        refreshPanel(markerOrChange) {
            if (this.isVisible() && this.tree) {
                const hasSelection = this.tree.getSelection().length > 0;
                this.cachedFilterStats = undefined;
                if (markerOrChange) {
                    if (markerOrChange instanceof markersModel_1.Marker) {
                        this.tree.rerender(markerOrChange);
                    }
                    else {
                        if (markerOrChange.added.size || markerOrChange.removed.size) {
                            // Reset complete tree
                            this.resetTree();
                        }
                        else {
                            // Update resource
                            for (const updated of markerOrChange.updated) {
                                this.tree.setChildren(updated, createResourceMarkersIterator(updated), {
                                    /* Pass Identitiy Provider only when updating while the tree is visible */
                                    diffIdentityProvider: {
                                        getId(element) { return element.id; }
                                    }
                                });
                                this.tree.rerender(updated);
                            }
                        }
                    }
                }
                else {
                    // Reset complete tree
                    this.resetTree();
                }
                const { total, filtered } = this.getFilterStats();
                this.tree.toggleVisibility(total === 0 || filtered === 0);
                this.renderMessage();
                this._onDidChangeFilterStats.fire(this.getFilterStats());
                if (hasSelection) {
                    this.setTreeSelection();
                }
            }
        }
        setTreeSelection() {
            if (this.tree && this.tree.isVisible() && this.tree.getSelection().length === 0) {
                const firstVisibleElement = this.tree.firstVisibleElement;
                const marker = firstVisibleElement ?
                    firstVisibleElement instanceof markersModel_1.ResourceMarkers ? firstVisibleElement.markers[0] :
                        firstVisibleElement instanceof markersModel_1.Marker ? firstVisibleElement : undefined
                    : undefined;
                if (marker) {
                    this.tree.setFocus([marker]);
                    this.tree.setSelection([marker]);
                }
            }
        }
        onDidChangeViewState(marker) {
            this.refreshPanel(marker);
        }
        resetTree() {
            if (!this.tree) {
                return;
            }
            let resourceMarkers = [];
            if (this.filters.activeFile) {
                if (this.currentActiveResource) {
                    const activeResourceMarkers = this.markersModel.getResourceMarkers(this.currentActiveResource);
                    if (activeResourceMarkers) {
                        resourceMarkers = [activeResourceMarkers];
                    }
                }
            }
            else {
                resourceMarkers = this.markersModel.resourceMarkers;
            }
            this.tree.setChildren(null, iterator_1.Iterable.map(resourceMarkers, m => ({ element: m, children: createResourceMarkersIterator(m) })));
        }
        updateFilter() {
            this.cachedFilterStats = undefined;
            this.filter.options = new markersFilterOptions_1.FilterOptions(this.filters.filterText, this.getFilesExcludeExpressions(), this.filters.showWarnings, this.filters.showErrors, this.filters.showInfos, this.uriIdentityService);
            if (this.tree) {
                this.tree.refilter();
            }
            this._onDidChangeFilterStats.fire(this.getFilterStats());
            const { total, filtered } = this.getFilterStats();
            if (this.tree) {
                this.tree.toggleVisibility(total === 0 || filtered === 0);
            }
            this.renderMessage();
        }
        getFilesExcludeExpressions() {
            if (!this.filters.excludedFiles) {
                return [];
            }
            const workspaceFolders = this.workspaceContextService.getWorkspace().folders;
            return workspaceFolders.length
                ? workspaceFolders.map(workspaceFolder => ({ root: workspaceFolder.uri, expression: this.getFilesExclude(workspaceFolder.uri) }))
                : this.getFilesExclude();
        }
        getFilesExclude(resource) {
            return (0, objects_1.deepClone)(this.configurationService.getValue('files.exclude', { resource })) || {};
        }
        createFilterActionBar(parent) {
            this.filterActionBar = this._register(new actionbar_1.ActionBar(parent, { actionViewItemProvider: action => this.getActionViewItem(action) }));
            this.filterActionBar.getContainer().classList.add('markers-panel-filter-container');
            this.filterActionBar.getContainer().classList.toggle('hide', !this.smallLayout);
        }
        createMessageBox(parent) {
            this.messageBoxContainer = dom.append(parent, dom.$('.message-box-container'));
            this.messageBoxContainer.setAttribute('aria-labelledby', 'markers-panel-arialabel');
        }
        createArialLabelElement(parent) {
            this.ariaLabelElement = dom.append(parent, dom.$(''));
            this.ariaLabelElement.setAttribute('id', 'markers-panel-arialabel');
        }
        createTree(parent) {
            const onDidChangeRenderNodeCount = new event_1.Relay();
            const treeLabels = this._register(this.instantiationService.createInstance(labels_1.ResourceLabels, this));
            const virtualDelegate = new markersTreeViewer_1.VirtualDelegate(this.markersViewModel);
            const renderers = [
                this.instantiationService.createInstance(markersTreeViewer_1.ResourceMarkersRenderer, treeLabels, onDidChangeRenderNodeCount.event),
                this.instantiationService.createInstance(markersTreeViewer_1.MarkerRenderer, this.markersViewModel),
                this.instantiationService.createInstance(markersTreeViewer_1.RelatedInformationRenderer)
            ];
            const accessibilityProvider = this.instantiationService.createInstance(markersTreeViewer_1.MarkersTreeAccessibilityProvider);
            const identityProvider = {
                getId(element) {
                    return element.id;
                }
            };
            this.tree = this._register(this.instantiationService.createInstance(MarkersTree, 'MarkersView', dom.append(parent, dom.$('.tree-container.show-file-icons')), virtualDelegate, renderers, {
                filter: this.filter,
                accessibilityProvider,
                identityProvider,
                dnd: this.instantiationService.createInstance(dnd_1.ResourceListDnDHandler, (element) => {
                    if (element instanceof markersModel_1.ResourceMarkers) {
                        return element.resource;
                    }
                    if (element instanceof markersModel_1.Marker) {
                        return (0, opener_1.withSelection)(element.resource, element.range);
                    }
                    if (element instanceof markersModel_1.RelatedInformation) {
                        return (0, opener_1.withSelection)(element.raw.resource, element.raw);
                    }
                    return null;
                }),
                expandOnlyOnTwistieClick: (e) => e instanceof markersModel_1.Marker && e.relatedInformation.length > 0,
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                },
                selectionNavigation: true,
                multipleSelectionSupport: true,
            }));
            onDidChangeRenderNodeCount.input = this.tree.onDidChangeRenderNodeCount;
            const markerFocusContextKey = constants_1.default.MarkerFocusContextKey.bindTo(this.tree.contextKeyService);
            const relatedInformationFocusContextKey = constants_1.default.RelatedInformationFocusContextKey.bindTo(this.tree.contextKeyService);
            this._register(this.tree.onDidChangeFocus(focus => {
                markerFocusContextKey.set(focus.elements.some(e => e instanceof markersModel_1.Marker));
                relatedInformationFocusContextKey.set(focus.elements.some(e => e instanceof markersModel_1.RelatedInformation));
            }));
            this._register(event_1.Event.debounce(this.tree.onDidOpen, (last, event) => event, 75, true)(options => {
                this.openFileAtElement(options.element, !!options.editorOptions.preserveFocus, options.sideBySide, !!options.editorOptions.pinned);
            }));
            this._register(this.tree.onContextMenu(this.onContextMenu, this));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (this.filters.excludedFiles && e.affectsConfiguration('files.exclude')) {
                    this.updateFilter();
                }
            }));
            // move focus to input, whenever a key is pressed in the panel container
            this._register(dom.addDisposableListener(parent, 'keydown', e => {
                if (this.keybindingService.mightProducePrintableCharacter(new keyboardEvent_1.StandardKeyboardEvent(e))) {
                    this.focusFilter();
                }
            }));
            this._register(event_1.Event.any(this.tree.onDidChangeSelection, this.tree.onDidChangeFocus)(() => {
                const elements = [...this.tree.getSelection(), ...this.tree.getFocus()];
                for (const element of elements) {
                    if (element instanceof markersModel_1.Marker) {
                        const viewModel = this.markersViewModel.getViewModel(element);
                        if (viewModel) {
                            viewModel.showLightBulb();
                        }
                    }
                }
            }));
            this._register(this.tree.onDidChangeSelection(() => this.onSelected()));
        }
        collapseAll() {
            if (this.tree) {
                this.tree.collapseAll();
                this.tree.setSelection([]);
                this.tree.setFocus([]);
                this.tree.getHTMLElement().focus();
                this.tree.focusFirst();
            }
        }
        setMultiline(multiline) {
            this.markersViewModel.multiline = multiline;
        }
        onDidChangeMarkersViewVisibility(visible) {
            this.onVisibleDisposables.clear();
            if (visible) {
                for (const disposable of this.reInitialize()) {
                    this.onVisibleDisposables.add(disposable);
                }
                this.refreshPanel();
            }
            else if (this.tree) {
                this.tree.toggleVisibility(true);
            }
        }
        reInitialize() {
            const disposables = [];
            // Markers Model
            const readMarkers = (resource) => this.markerService.read({ resource, severities: markers_1.MarkerSeverity.Error | markers_1.MarkerSeverity.Warning | markers_1.MarkerSeverity.Info });
            this.markersModel.setResourceMarkers((0, arrays_1.groupBy)(readMarkers(), markersModel_1.compareMarkersByUri).map(group => [group[0].resource, group]));
            disposables.push(event_1.Event.debounce(this.markerService.onMarkerChanged, (resourcesMap, resources) => {
                resourcesMap = resourcesMap || new map_1.ResourceMap();
                resources.forEach(resource => resourcesMap.set(resource, resource));
                return resourcesMap;
            }, 64)(resourcesMap => {
                this.markersModel.setResourceMarkers([...resourcesMap.values()].map(resource => [resource, readMarkers(resource)]));
            }));
            disposables.push(event_1.Event.any(this.markersModel.onDidChange, this.editorService.onDidActiveEditorChange)(changes => {
                if (changes) {
                    this.onDidChangeModel(changes);
                }
                else {
                    this.onActiveEditorChanged();
                }
            }));
            disposables.push((0, lifecycle_1.toDisposable)(() => this.markersModel.reset()));
            // Markers View Model
            this.markersModel.resourceMarkers.forEach(resourceMarker => resourceMarker.markers.forEach(marker => this.markersViewModel.add(marker)));
            disposables.push(this.markersViewModel.onDidChange(marker => this.onDidChangeViewState(marker)));
            disposables.push((0, lifecycle_1.toDisposable)(() => this.markersModel.resourceMarkers.forEach(resourceMarker => this.markersViewModel.remove(resourceMarker.resource))));
            // Markers Filters
            disposables.push(this.filters.onDidChange((event) => {
                if (event.activeFile) {
                    this.refreshPanel();
                }
                else if (event.filterText || event.excludedFiles || event.showWarnings || event.showErrors || event.showInfos) {
                    this.updateFilter();
                }
            }));
            disposables.push((0, lifecycle_1.toDisposable)(() => { this.cachedFilterStats = undefined; }));
            disposables.push((0, lifecycle_1.toDisposable)(() => this.rangeHighlightDecorations.removeHighlightRange()));
            return disposables;
        }
        onDidChangeModel(change) {
            const resourceMarkers = [...change.added, ...change.removed, ...change.updated];
            const resources = [];
            for (const { resource } of resourceMarkers) {
                this.markersViewModel.remove(resource);
                const resourceMarkers = this.markersModel.getResourceMarkers(resource);
                if (resourceMarkers) {
                    for (const marker of resourceMarkers.markers) {
                        this.markersViewModel.add(marker);
                    }
                }
                resources.push(resource);
            }
            this.currentResourceGotAddedToMarkersData = this.currentResourceGotAddedToMarkersData || this.isCurrentResourceGotAddedToMarkersData(resources);
            this.refreshPanel(change);
            this.updateRangeHighlights();
            if (this.currentResourceGotAddedToMarkersData) {
                this.autoReveal();
                this.currentResourceGotAddedToMarkersData = false;
            }
        }
        isCurrentResourceGotAddedToMarkersData(changedResources) {
            const currentlyActiveResource = this.currentActiveResource;
            if (!currentlyActiveResource) {
                return false;
            }
            const resourceForCurrentActiveResource = this.getResourceForCurrentActiveResource();
            if (resourceForCurrentActiveResource) {
                return false;
            }
            return changedResources.some(r => r.toString() === currentlyActiveResource.toString());
        }
        onActiveEditorChanged() {
            this.setCurrentActiveEditor();
            if (this.filters.activeFile) {
                this.refreshPanel();
            }
            this.autoReveal();
        }
        setCurrentActiveEditor() {
            const activeEditor = this.editorService.activeEditor;
            this.currentActiveResource = activeEditor ? (0, types_1.withUndefinedAsNull)(editor_1.EditorResourceAccessor.getOriginalUri(activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY })) : null;
        }
        onSelected() {
            if (this.tree) {
                let selection = this.tree.getSelection();
                if (selection && selection.length > 0) {
                    this.lastSelectedRelativeTop = this.tree.getRelativeTop(selection[0]) || 0;
                }
            }
        }
        hasNoProblems() {
            const { total, filtered } = this.getFilterStats();
            return total === 0 || filtered === 0;
        }
        renderContent() {
            this.cachedFilterStats = undefined;
            this.resetTree();
            if (this.tree) {
                this.tree.toggleVisibility(this.hasNoProblems());
            }
            this.renderMessage();
        }
        renderMessage() {
            if (!this.messageBoxContainer || !this.ariaLabelElement) {
                return;
            }
            dom.clearNode(this.messageBoxContainer);
            const { total, filtered } = this.getFilterStats();
            if (filtered === 0) {
                this.messageBoxContainer.style.display = 'block';
                this.messageBoxContainer.setAttribute('tabIndex', '0');
                if (this.filters.activeFile) {
                    this.renderFilterMessageForActiveFile(this.messageBoxContainer);
                }
                else {
                    if (total > 0) {
                        this.renderFilteredByFilterMessage(this.messageBoxContainer);
                    }
                    else {
                        this.renderNoProblemsMessage(this.messageBoxContainer);
                    }
                }
            }
            else {
                this.messageBoxContainer.style.display = 'none';
                if (filtered === total) {
                    this.setAriaLabel((0, nls_1.localize)('No problems filtered', "Showing {0} problems", total));
                }
                else {
                    this.setAriaLabel((0, nls_1.localize)('problems filtered', "Showing {0} of {1} problems", filtered, total));
                }
                this.messageBoxContainer.removeAttribute('tabIndex');
            }
        }
        renderFilterMessageForActiveFile(container) {
            if (this.currentActiveResource && this.markersModel.getResourceMarkers(this.currentActiveResource)) {
                this.renderFilteredByFilterMessage(container);
            }
            else {
                this.renderNoProblemsMessageForActiveFile(container);
            }
        }
        renderFilteredByFilterMessage(container) {
            const span1 = dom.append(container, dom.$('span'));
            span1.textContent = messages_1.default.MARKERS_PANEL_NO_PROBLEMS_FILTERS;
            const link = dom.append(container, dom.$('a.messageAction'));
            link.textContent = (0, nls_1.localize)('clearFilter', "Clear Filters");
            link.setAttribute('tabIndex', '0');
            const span2 = dom.append(container, dom.$('span'));
            span2.textContent = '.';
            dom.addStandardDisposableListener(link, dom.EventType.CLICK, () => this.clearFilters());
            dom.addStandardDisposableListener(link, dom.EventType.KEY_DOWN, (e) => {
                if (e.equals(3 /* KeyCode.Enter */) || e.equals(10 /* KeyCode.Space */)) {
                    this.clearFilters();
                    e.stopPropagation();
                }
            });
            this.setAriaLabel(messages_1.default.MARKERS_PANEL_NO_PROBLEMS_FILTERS);
        }
        renderNoProblemsMessageForActiveFile(container) {
            const span = dom.append(container, dom.$('span'));
            span.textContent = messages_1.default.MARKERS_PANEL_NO_PROBLEMS_ACTIVE_FILE_BUILT;
            this.setAriaLabel(messages_1.default.MARKERS_PANEL_NO_PROBLEMS_ACTIVE_FILE_BUILT);
        }
        renderNoProblemsMessage(container) {
            const span = dom.append(container, dom.$('span'));
            span.textContent = messages_1.default.MARKERS_PANEL_NO_PROBLEMS_BUILT;
            this.setAriaLabel(messages_1.default.MARKERS_PANEL_NO_PROBLEMS_BUILT);
        }
        setAriaLabel(label) {
            if (this.tree) {
                this.tree.ariaLabel = label;
            }
            this.ariaLabelElement.setAttribute('aria-label', label);
        }
        clearFilters() {
            this.filters.filterText = '';
            this.filters.excludedFiles = false;
            this.filters.showErrors = true;
            this.filters.showWarnings = true;
            this.filters.showInfos = true;
        }
        autoReveal(focus = false) {
            // No need to auto reveal if active file filter is on
            if (this.filters.activeFile || !this.tree) {
                return;
            }
            let autoReveal = this.configurationService.getValue('problems.autoReveal');
            if (typeof autoReveal === 'boolean' && autoReveal) {
                let currentActiveResource = this.getResourceForCurrentActiveResource();
                if (currentActiveResource) {
                    if (this.tree.hasElement(currentActiveResource)) {
                        if (!this.tree.isCollapsed(currentActiveResource) && this.hasSelectedMarkerFor(currentActiveResource)) {
                            this.tree.reveal(this.tree.getSelection()[0], this.lastSelectedRelativeTop);
                            if (focus) {
                                this.tree.setFocus(this.tree.getSelection());
                            }
                        }
                        else {
                            this.tree.expand(currentActiveResource);
                            this.tree.reveal(currentActiveResource, 0);
                            if (focus) {
                                this.tree.setFocus([currentActiveResource]);
                                this.tree.setSelection([currentActiveResource]);
                            }
                        }
                    }
                }
                else if (focus) {
                    this.tree.setSelection([]);
                    this.tree.focusFirst();
                }
            }
        }
        getResourceForCurrentActiveResource() {
            return this.currentActiveResource ? this.markersModel.getResourceMarkers(this.currentActiveResource) : null;
        }
        hasSelectedMarkerFor(resource) {
            if (this.tree) {
                let selectedElement = this.tree.getSelection();
                if (selectedElement && selectedElement.length > 0) {
                    if (selectedElement[0] instanceof markersModel_1.Marker) {
                        if (resource.has(selectedElement[0].marker.resource)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        updateRangeHighlights() {
            this.rangeHighlightDecorations.removeHighlightRange();
            if (this.tree && this.tree.getHTMLElement() === document.activeElement) {
                this.highlightCurrentSelectedMarkerRange();
            }
        }
        highlightCurrentSelectedMarkerRange() {
            const selections = this.tree ? this.tree.getSelection() : [];
            if (selections.length !== 1) {
                return;
            }
            const selection = selections[0];
            if (!(selection instanceof markersModel_1.Marker)) {
                return;
            }
            this.rangeHighlightDecorations.highlightRange(selection);
        }
        onContextMenu(e) {
            e.browserEvent.preventDefault();
            e.browserEvent.stopPropagation();
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => this.getMenuActions(e.element),
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
                }
            });
        }
        getMenuActions(element) {
            const result = [];
            if (element instanceof markersModel_1.Marker) {
                const viewModel = this.markersViewModel.getViewModel(element);
                if (viewModel) {
                    const quickFixActions = viewModel.quickFixAction.quickFixes;
                    if (quickFixActions.length) {
                        result.push(...quickFixActions);
                        result.push(new actions_1.Separator());
                    }
                }
            }
            const menu = this.menuService.createMenu(actions_2.MenuId.ProblemsPanelContext, this.tree.contextKeyService);
            (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, undefined, result);
            menu.dispose();
            return result;
        }
        getFocusElement() {
            var _a;
            return ((_a = this.tree) === null || _a === void 0 ? void 0 : _a.getFocus()[0]) || undefined;
        }
        getFocusedSelectedElements() {
            const focus = this.getFocusElement();
            if (!focus) {
                return null;
            }
            const selection = this.tree.getSelection();
            if (selection.includes(focus)) {
                const result = [];
                for (const selected of selection) {
                    if (selected) {
                        result.push(selected);
                    }
                }
                return result;
            }
            else {
                return [focus];
            }
        }
        getAllResourceMarkers() {
            return this.markersModel.resourceMarkers;
        }
        getActionViewItem(action) {
            if (action.id === `workbench.actions.treeView.${this.id}.filter`) {
                return this.instantiationService.createInstance(markersViewActions_1.MarkersFilterActionViewItem, action, this);
            }
            return super.getActionViewItem(action);
        }
        getFilterStats() {
            if (!this.cachedFilterStats) {
                this.cachedFilterStats = this.computeFilterStats();
            }
            return this.cachedFilterStats;
        }
        computeFilterStats() {
            let filtered = 0;
            if (this.tree) {
                const root = this.tree.getNode();
                for (const resourceMarkerNode of root.children) {
                    for (const markerNode of resourceMarkerNode.children) {
                        if (resourceMarkerNode.visible && markerNode.visible) {
                            filtered++;
                        }
                    }
                }
            }
            return { total: this.markersModel.total, filtered };
        }
        saveState() {
            this.panelState['filter'] = this.filters.filterText;
            this.panelState['filterHistory'] = this.filters.filterHistory;
            this.panelState['showErrors'] = this.filters.showErrors;
            this.panelState['showWarnings'] = this.filters.showWarnings;
            this.panelState['showInfos'] = this.filters.showInfos;
            this.panelState['useFilesExclude'] = this.filters.excludedFiles;
            this.panelState['activeFile'] = this.filters.activeFile;
            this.panelState['multiline'] = this.markersViewModel.multiline;
            super.saveState();
        }
        dispose() {
            super.dispose();
        }
    };
    MarkersView = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, editorService_1.IEditorService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, markers_1.IMarkerService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, workspace_1.IWorkspaceContextService),
        __param(9, contextView_1.IContextMenuService),
        __param(10, actions_2.IMenuService),
        __param(11, uriIdentity_1.IUriIdentityService),
        __param(12, keybinding_1.IKeybindingService),
        __param(13, storage_1.IStorageService),
        __param(14, opener_1.IOpenerService),
        __param(15, themeService_1.IThemeService)
    ], MarkersView);
    exports.MarkersView = MarkersView;
    let MarkersTree = class MarkersTree extends listService_1.WorkbenchObjectTree {
        constructor(user, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService) {
            super(user, container, delegate, renderers, options, contextKeyService, listService, themeService, configurationService, keybindingService, accessibilityService);
            this.container = container;
            this.visibilityContextKey = constants_1.default.MarkersTreeVisibilityContextKey.bindTo(contextKeyService);
        }
        layout(height, width) {
            this.container.style.height = `${height}px`;
            super.layout(height, width);
        }
        toggleVisibility(hide) {
            this.visibilityContextKey.set(!hide);
            this.container.classList.toggle('hidden', hide);
        }
        isVisible() {
            return !this.container.classList.contains('hidden');
        }
    };
    MarkersTree = __decorate([
        __param(5, contextkey_1.IContextKeyService),
        __param(6, listService_1.IListService),
        __param(7, themeService_1.IThemeService),
        __param(8, configuration_1.IConfigurationService),
        __param(9, keybinding_1.IKeybindingService),
        __param(10, accessibility_1.IAccessibilityService)
    ], MarkersTree);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        // Lightbulb Icon
        const editorLightBulbForegroundColor = theme.getColor(colorRegistry_1.editorLightBulbForeground);
        if (editorLightBulbForegroundColor) {
            collector.addRule(`
		.monaco-workbench .markers-panel-container ${codicons_1.Codicon.lightBulb.cssSelector} {
			color: ${editorLightBulbForegroundColor};
		}`);
        }
        // Lightbulb Auto Fix Icon
        const editorLightBulbAutoFixForegroundColor = theme.getColor(colorRegistry_1.editorLightBulbAutoFixForeground);
        if (editorLightBulbAutoFixForegroundColor) {
            collector.addRule(`
		.monaco-workbench .markers-panel-container ${codicons_1.Codicon.lightbulbAutofix.cssSelector} {
			color: ${editorLightBulbAutoFixForegroundColor};
		}`);
        }
    });
});
//# sourceMappingURL=markersView.js.map