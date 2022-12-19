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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/actions", "vs/base/browser/dom", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/configuration/common/configuration", "vs/platform/keybinding/common/keybinding", "vs/workbench/common/editor", "vs/workbench/contrib/files/browser/fileActions", "vs/workbench/contrib/files/common/files", "vs/workbench/browser/parts/editor/editorActions", "vs/platform/contextkey/common/contextkey", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/platform/list/browser/listService", "vs/workbench/browser/labels", "vs/base/browser/ui/actionbar/actionbar", "vs/platform/telemetry/common/telemetry", "vs/base/common/lifecycle", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/workbench/contrib/files/browser/fileConstants", "vs/workbench/common/contextkeys", "vs/workbench/browser/dnd", "vs/workbench/browser/parts/views/viewPane", "vs/base/browser/dnd", "vs/base/common/decorators", "vs/base/browser/ui/list/listView", "vs/base/common/types", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/workbench/services/filesConfiguration/common/filesConfigurationService", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/base/common/comparers", "vs/base/common/codicons", "vs/platform/commands/common/commands", "vs/base/common/network", "vs/base/common/resources", "vs/css!./media/openeditors"], function (require, exports, nls, async_1, actions_1, dom, contextView_1, instantiation_1, editorGroupsService_1, configuration_1, keybinding_1, editor_1, fileActions_1, files_1, editorActions_1, contextkey_1, styler_1, themeService_1, colorRegistry_1, listService_1, labels_1, actionbar_1, telemetry_1, lifecycle_1, menuEntryActionViewItem_1, actions_2, fileConstants_1, contextkeys_1, dnd_1, viewPane_1, dnd_2, decorators_1, listView_1, types_1, workingCopyService_1, filesConfigurationService_1, views_1, opener_1, comparers_1, codicons_1, commands_1, network_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenEditorsView = void 0;
    const $ = dom.$;
    let OpenEditorsView = class OpenEditorsView extends viewPane_1.ViewPane {
        constructor(options, instantiationService, viewDescriptorService, contextMenuService, editorGroupService, configurationService, keybindingService, contextKeyService, themeService, telemetryService, menuService, workingCopyService, filesConfigurationService, openerService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.editorGroupService = editorGroupService;
            this.menuService = menuService;
            this.workingCopyService = workingCopyService;
            this.filesConfigurationService = filesConfigurationService;
            this.needsRefresh = false;
            this.elements = [];
            this.structuralRefreshDelay = 0;
            let labelChangeListeners = [];
            this.listRefreshScheduler = new async_1.RunOnceScheduler(() => {
                labelChangeListeners = (0, lifecycle_1.dispose)(labelChangeListeners);
                const previousLength = this.list.length;
                const elements = this.getElements();
                this.list.splice(0, this.list.length, elements);
                this.focusActiveEditor();
                if (previousLength !== this.list.length) {
                    this.updateSize();
                }
                this.needsRefresh = false;
                if (this.sortOrder === 'alphabetical' || this.sortOrder === 'fullPath') {
                    // We need to resort the list if the editor label changed
                    elements.forEach(e => {
                        if (e instanceof files_1.OpenEditor) {
                            labelChangeListeners.push(e.editor.onDidChangeLabel(() => this.listRefreshScheduler.schedule()));
                        }
                    });
                }
            }, this.structuralRefreshDelay);
            this.sortOrder = configurationService.getValue('explorer.openEditors.sortOrder');
            this.registerUpdateEvents();
            // Also handle configuration updates
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationChange(e)));
            // Handle dirty counter
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.updateDirtyIndicator(workingCopy)));
        }
        registerUpdateEvents() {
            const updateWholeList = () => {
                if (!this.isBodyVisible() || !this.list) {
                    this.needsRefresh = true;
                    return;
                }
                this.listRefreshScheduler.schedule(this.structuralRefreshDelay);
            };
            const groupDisposables = new Map();
            const addGroupListener = (group) => {
                const groupModelChangeListener = group.onDidModelChange(e => {
                    if (this.listRefreshScheduler.isScheduled()) {
                        return;
                    }
                    if (!this.isBodyVisible() || !this.list) {
                        this.needsRefresh = true;
                        return;
                    }
                    const index = this.getIndex(group, e.editor);
                    switch (e.kind) {
                        case 6 /* GroupModelChangeKind.EDITOR_ACTIVE */:
                        case 0 /* GroupModelChangeKind.GROUP_ACTIVE */:
                            this.focusActiveEditor();
                            break;
                        case 1 /* GroupModelChangeKind.GROUP_INDEX */:
                            if (index >= 0) {
                                this.list.splice(index, 1, [group]);
                            }
                            break;
                        case 11 /* GroupModelChangeKind.EDITOR_DIRTY */:
                        case 10 /* GroupModelChangeKind.EDITOR_STICKY */:
                        case 8 /* GroupModelChangeKind.EDITOR_CAPABILITIES */:
                        case 9 /* GroupModelChangeKind.EDITOR_PIN */:
                        case 7 /* GroupModelChangeKind.EDITOR_LABEL */:
                            this.list.splice(index, 1, [new files_1.OpenEditor(e.editor, group)]);
                            this.focusActiveEditor();
                            break;
                        case 3 /* GroupModelChangeKind.EDITOR_OPEN */:
                        case 5 /* GroupModelChangeKind.EDITOR_MOVE */:
                        case 4 /* GroupModelChangeKind.EDITOR_CLOSE */:
                            updateWholeList();
                            break;
                    }
                });
                groupDisposables.set(group.id, groupModelChangeListener);
                this._register(groupDisposables.get(group.id));
            };
            this.editorGroupService.groups.forEach(g => addGroupListener(g));
            this._register(this.editorGroupService.onDidAddGroup(group => {
                addGroupListener(group);
                updateWholeList();
            }));
            this._register(this.editorGroupService.onDidMoveGroup(() => updateWholeList()));
            this._register(this.editorGroupService.onDidRemoveGroup(group => {
                (0, lifecycle_1.dispose)(groupDisposables.get(group.id));
                updateWholeList();
            }));
        }
        renderHeaderTitle(container) {
            super.renderHeaderTitle(container, this.title);
            const count = dom.append(container, $('.count'));
            this.dirtyCountElement = dom.append(count, $('.dirty-count.monaco-count-badge.long'));
            this._register(((0, styler_1.attachStylerCallback)(this.themeService, { badgeBackground: colorRegistry_1.badgeBackground, badgeForeground: colorRegistry_1.badgeForeground, contrastBorder: colorRegistry_1.contrastBorder }, colors => {
                const background = colors.badgeBackground ? colors.badgeBackground.toString() : '';
                const foreground = colors.badgeForeground ? colors.badgeForeground.toString() : '';
                const border = colors.contrastBorder ? colors.contrastBorder.toString() : '';
                this.dirtyCountElement.style.backgroundColor = background;
                this.dirtyCountElement.style.color = foreground;
                this.dirtyCountElement.style.borderWidth = border ? '1px' : '';
                this.dirtyCountElement.style.borderStyle = border ? 'solid' : '';
                this.dirtyCountElement.style.borderColor = border;
            })));
            this.updateDirtyIndicator();
        }
        renderBody(container) {
            super.renderBody(container);
            container.classList.add('open-editors');
            container.classList.add('show-file-icons');
            const delegate = new OpenEditorsDelegate();
            if (this.list) {
                this.list.dispose();
            }
            if (this.listLabels) {
                this.listLabels.clear();
            }
            this.listLabels = this.instantiationService.createInstance(labels_1.ResourceLabels, { onDidChangeVisibility: this.onDidChangeBodyVisibility });
            this.list = this.instantiationService.createInstance(listService_1.WorkbenchList, 'OpenEditors', container, delegate, [
                new EditorGroupRenderer(this.keybindingService, this.instantiationService),
                new OpenEditorRenderer(this.listLabels, this.instantiationService, this.keybindingService, this.configurationService)
            ], {
                identityProvider: { getId: (element) => element instanceof files_1.OpenEditor ? element.getId() : element.id.toString() },
                dnd: new OpenEditorsDragAndDrop(this.instantiationService, this.editorGroupService),
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                },
                accessibilityProvider: new OpenEditorsAccessibilityProvider()
            });
            this._register(this.list);
            this._register(this.listLabels);
            this.contributedContextMenu = this.menuService.createMenu(actions_2.MenuId.OpenEditorsContext, this.list.contextKeyService);
            this._register(this.contributedContextMenu);
            this.updateSize();
            // Bind context keys
            files_1.OpenEditorsFocusedContext.bindTo(this.list.contextKeyService);
            files_1.ExplorerFocusedContext.bindTo(this.list.contextKeyService);
            this.resourceContext = this.instantiationService.createInstance(contextkeys_1.ResourceContextKey);
            this._register(this.resourceContext);
            this.groupFocusedContext = fileConstants_1.OpenEditorsGroupContext.bindTo(this.contextKeyService);
            this.dirtyEditorFocusedContext = fileConstants_1.OpenEditorsDirtyEditorContext.bindTo(this.contextKeyService);
            this.readonlyEditorFocusedContext = fileConstants_1.OpenEditorsReadonlyEditorContext.bindTo(this.contextKeyService);
            this._register(this.list.onContextMenu(e => this.onListContextMenu(e)));
            this.list.onDidChangeFocus(e => {
                this.resourceContext.reset();
                this.groupFocusedContext.reset();
                this.dirtyEditorFocusedContext.reset();
                this.readonlyEditorFocusedContext.reset();
                const element = e.elements.length ? e.elements[0] : undefined;
                if (element instanceof files_1.OpenEditor) {
                    const resource = element.getResource();
                    this.dirtyEditorFocusedContext.set(element.editor.isDirty() && !element.editor.isSaving());
                    this.readonlyEditorFocusedContext.set(element.editor.hasCapability(2 /* EditorInputCapabilities.Readonly */));
                    this.resourceContext.set((0, types_1.withUndefinedAsNull)(resource));
                }
                else if (!!element) {
                    this.groupFocusedContext.set(true);
                }
            });
            // Open when selecting via keyboard
            this._register(this.list.onMouseMiddleClick(e => {
                if (e && e.element instanceof files_1.OpenEditor) {
                    e.element.group.closeEditor(e.element.editor, { preserveFocus: true });
                }
            }));
            this._register(this.list.onDidOpen(e => {
                if (!e.element) {
                    return;
                }
                else if (e.element instanceof files_1.OpenEditor) {
                    if (e.browserEvent instanceof MouseEvent && e.browserEvent.button === 1) {
                        return; // middle click already handled above: closes the editor
                    }
                    this.openEditor(e.element, { preserveFocus: e.editorOptions.preserveFocus, pinned: e.editorOptions.pinned, sideBySide: e.sideBySide });
                }
                else {
                    this.editorGroupService.activateGroup(e.element);
                }
            }));
            this.listRefreshScheduler.schedule(0);
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.listRefreshScheduler.schedule(0);
                }
            }));
            const containerModel = this.viewDescriptorService.getViewContainerModel(this.viewDescriptorService.getViewContainerByViewId(this.id));
            this._register(containerModel.onDidChangeAllViewDescriptors(() => {
                this.updateSize();
            }));
        }
        focus() {
            super.focus();
            this.list.domFocus();
        }
        getList() {
            return this.list;
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            if (this.list) {
                this.list.layout(height, width);
            }
        }
        get showGroups() {
            return this.editorGroupService.groups.length > 1;
        }
        getElements() {
            this.elements = [];
            this.editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */).forEach(g => {
                if (this.showGroups) {
                    this.elements.push(g);
                }
                let editors = g.editors.map(ei => new files_1.OpenEditor(ei, g));
                if (this.sortOrder === 'alphabetical') {
                    editors = editors.sort((first, second) => (0, comparers_1.compareFileNamesDefault)(first.editor.getName(), second.editor.getName()));
                }
                else if (this.sortOrder === 'fullPath') {
                    editors = editors.sort((first, second) => {
                        const firstResource = first.editor.resource;
                        const secondResource = second.editor.resource;
                        //put 'system' editors before everything
                        if (firstResource === undefined && secondResource === undefined) {
                            return (0, comparers_1.compareFileNamesDefault)(first.editor.getName(), second.editor.getName());
                        }
                        else if (firstResource === undefined) {
                            return -1;
                        }
                        else if (secondResource === undefined) {
                            return 1;
                        }
                        else {
                            const firstScheme = firstResource.scheme;
                            const secondScheme = secondResource.scheme;
                            //put non-file editors before files
                            if (firstScheme !== network_1.Schemas.file && secondScheme !== network_1.Schemas.file) {
                                return resources_1.extUriIgnorePathCase.compare(firstResource, secondResource);
                            }
                            else if (firstScheme !== network_1.Schemas.file) {
                                return -1;
                            }
                            else if (secondScheme !== network_1.Schemas.file) {
                                return 1;
                            }
                            else {
                                return resources_1.extUriIgnorePathCase.compare(firstResource, secondResource);
                            }
                        }
                    });
                }
                this.elements.push(...editors);
            });
            return this.elements;
        }
        getIndex(group, editor) {
            if (!editor) {
                return this.elements.findIndex(e => !(e instanceof files_1.OpenEditor) && e.id === group.id);
            }
            return this.elements.findIndex(e => e instanceof files_1.OpenEditor && e.editor === editor && e.group.id === group.id);
        }
        openEditor(element, options) {
            if (element) {
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: 'workbench.files.openFile', from: 'openEditors' });
                const preserveActivateGroup = options.sideBySide && options.preserveFocus; // needed for https://github.com/microsoft/vscode/issues/42399
                if (!preserveActivateGroup) {
                    this.editorGroupService.activateGroup(element.group); // needed for https://github.com/microsoft/vscode/issues/6672
                }
                const targetGroup = options.sideBySide ? this.editorGroupService.sideGroup : this.editorGroupService.activeGroup;
                targetGroup.openEditor(element.editor, options);
            }
        }
        onListContextMenu(e) {
            if (!e.element) {
                return;
            }
            const element = e.element;
            const actions = [];
            const actionsDisposable = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(this.contributedContextMenu, { shouldForwardArgs: true, arg: element instanceof files_1.OpenEditor ? editor_1.EditorResourceAccessor.getOriginalUri(element.editor) : {} }, actions);
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => element instanceof files_1.OpenEditor ? { groupId: element.groupId, editorIndex: element.group.getIndexOfEditor(element.editor) } : { groupId: element.id },
                onHide: () => (0, lifecycle_1.dispose)(actionsDisposable)
            });
        }
        focusActiveEditor() {
            if (this.list.length && this.editorGroupService.activeGroup) {
                const index = this.getIndex(this.editorGroupService.activeGroup, this.editorGroupService.activeGroup.activeEditor);
                if (index >= 0) {
                    try {
                        this.list.setFocus([index]);
                        this.list.setSelection([index]);
                        this.list.reveal(index);
                    }
                    catch (e) {
                        // noop list updated in the meantime
                    }
                    return;
                }
            }
            this.list.setFocus([]);
            this.list.setSelection([]);
        }
        onConfigurationChange(event) {
            if (event.affectsConfiguration('explorer.openEditors')) {
                this.updateSize();
            }
            // Trigger a 'repaint' when decoration settings change or the sort order changed
            if (event.affectsConfiguration('explorer.decorations') || event.affectsConfiguration('explorer.openEditors.sortOrder')) {
                this.sortOrder = this.configurationService.getValue('explorer.openEditors.sortOrder');
                this.listRefreshScheduler.schedule();
            }
        }
        updateSize() {
            // Adjust expanded body size
            this.minimumBodySize = this.orientation === 0 /* Orientation.VERTICAL */ ? this.getMinExpandedBodySize() : 170;
            this.maximumBodySize = this.orientation === 0 /* Orientation.VERTICAL */ ? this.getMaxExpandedBodySize() : Number.POSITIVE_INFINITY;
        }
        updateDirtyIndicator(workingCopy) {
            if (workingCopy) {
                const gotDirty = workingCopy.isDirty();
                if (gotDirty && !(workingCopy.capabilities & 2 /* WorkingCopyCapabilities.Untitled */) && this.filesConfigurationService.getAutoSaveMode() === 1 /* AutoSaveMode.AFTER_SHORT_DELAY */) {
                    return; // do not indicate dirty of working copies that are auto saved after short delay
                }
            }
            let dirty = this.workingCopyService.dirtyCount;
            if (dirty === 0) {
                this.dirtyCountElement.classList.add('hidden');
            }
            else {
                this.dirtyCountElement.textContent = nls.localize('dirtyCounter', "{0} unsaved", dirty);
                this.dirtyCountElement.classList.remove('hidden');
            }
        }
        get elementCount() {
            return this.editorGroupService.groups.map(g => g.count)
                .reduce((first, second) => first + second, this.showGroups ? this.editorGroupService.groups.length : 0);
        }
        getMaxExpandedBodySize() {
            let minVisibleOpenEditors = this.configurationService.getValue('explorer.openEditors.minVisible');
            // If it's not a number setting it to 0 will result in dynamic resizing.
            if (typeof minVisibleOpenEditors !== 'number') {
                minVisibleOpenEditors = OpenEditorsView.DEFAULT_MIN_VISIBLE_OPEN_EDITORS;
            }
            const containerModel = this.viewDescriptorService.getViewContainerModel(this.viewDescriptorService.getViewContainerByViewId(this.id));
            if (containerModel.visibleViewDescriptors.length <= 1) {
                return Number.POSITIVE_INFINITY;
            }
            return (Math.max(this.elementCount, minVisibleOpenEditors)) * OpenEditorsDelegate.ITEM_HEIGHT;
        }
        getMinExpandedBodySize() {
            let visibleOpenEditors = this.configurationService.getValue('explorer.openEditors.visible');
            if (typeof visibleOpenEditors !== 'number') {
                visibleOpenEditors = OpenEditorsView.DEFAULT_VISIBLE_OPEN_EDITORS;
            }
            return this.computeMinExpandedBodySize(visibleOpenEditors);
        }
        computeMinExpandedBodySize(visibleOpenEditors = OpenEditorsView.DEFAULT_VISIBLE_OPEN_EDITORS) {
            const itemsToShow = Math.min(Math.max(visibleOpenEditors, 1), this.elementCount);
            return itemsToShow * OpenEditorsDelegate.ITEM_HEIGHT;
        }
        setStructuralRefreshDelay(delay) {
            this.structuralRefreshDelay = delay;
        }
        getOptimalWidth() {
            let parentNode = this.list.getHTMLElement();
            let childNodes = [].slice.call(parentNode.querySelectorAll('.open-editor > a'));
            return dom.getLargestChildWidth(parentNode, childNodes);
        }
    };
    OpenEditorsView.DEFAULT_VISIBLE_OPEN_EDITORS = 9;
    OpenEditorsView.DEFAULT_MIN_VISIBLE_OPEN_EDITORS = 0;
    OpenEditorsView.ID = 'workbench.explorer.openEditorsView';
    OpenEditorsView.NAME = nls.localize({ key: 'openEditors', comment: ['Open is an adjective'] }, "Open Editors");
    OpenEditorsView = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, views_1.IViewDescriptorService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, editorGroupsService_1.IEditorGroupsService),
        __param(5, configuration_1.IConfigurationService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, themeService_1.IThemeService),
        __param(9, telemetry_1.ITelemetryService),
        __param(10, actions_2.IMenuService),
        __param(11, workingCopyService_1.IWorkingCopyService),
        __param(12, filesConfigurationService_1.IFilesConfigurationService),
        __param(13, opener_1.IOpenerService)
    ], OpenEditorsView);
    exports.OpenEditorsView = OpenEditorsView;
    class OpenEditorActionRunner extends actions_1.ActionRunner {
        async run(action) {
            if (!this.editor) {
                return;
            }
            return super.run(action, { groupId: this.editor.groupId, editorIndex: this.editor.group.getIndexOfEditor(this.editor.editor) });
        }
    }
    class OpenEditorsDelegate {
        getHeight(_element) {
            return OpenEditorsDelegate.ITEM_HEIGHT;
        }
        getTemplateId(element) {
            if (element instanceof files_1.OpenEditor) {
                return OpenEditorRenderer.ID;
            }
            return EditorGroupRenderer.ID;
        }
    }
    OpenEditorsDelegate.ITEM_HEIGHT = 22;
    class EditorGroupRenderer {
        constructor(keybindingService, instantiationService) {
            this.keybindingService = keybindingService;
            this.instantiationService = instantiationService;
            // noop
        }
        get templateId() {
            return EditorGroupRenderer.ID;
        }
        renderTemplate(container) {
            const editorGroupTemplate = Object.create(null);
            editorGroupTemplate.root = dom.append(container, $('.editor-group'));
            editorGroupTemplate.name = dom.append(editorGroupTemplate.root, $('span.name'));
            editorGroupTemplate.actionBar = new actionbar_1.ActionBar(container);
            const saveAllInGroupAction = this.instantiationService.createInstance(fileActions_1.SaveAllInGroupAction, fileActions_1.SaveAllInGroupAction.ID, fileActions_1.SaveAllInGroupAction.LABEL);
            const saveAllInGroupKey = this.keybindingService.lookupKeybinding(saveAllInGroupAction.id);
            editorGroupTemplate.actionBar.push(saveAllInGroupAction, { icon: true, label: false, keybinding: saveAllInGroupKey ? saveAllInGroupKey.getLabel() : undefined });
            const closeGroupAction = this.instantiationService.createInstance(fileActions_1.CloseGroupAction, fileActions_1.CloseGroupAction.ID, fileActions_1.CloseGroupAction.LABEL);
            const closeGroupActionKey = this.keybindingService.lookupKeybinding(closeGroupAction.id);
            editorGroupTemplate.actionBar.push(closeGroupAction, { icon: true, label: false, keybinding: closeGroupActionKey ? closeGroupActionKey.getLabel() : undefined });
            return editorGroupTemplate;
        }
        renderElement(editorGroup, _index, templateData) {
            templateData.editorGroup = editorGroup;
            templateData.name.textContent = editorGroup.label;
            templateData.actionBar.context = { groupId: editorGroup.id };
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    }
    EditorGroupRenderer.ID = 'editorgroup';
    class OpenEditorRenderer {
        constructor(labels, instantiationService, keybindingService, configurationService) {
            this.labels = labels;
            this.instantiationService = instantiationService;
            this.keybindingService = keybindingService;
            this.configurationService = configurationService;
            this.closeEditorAction = this.instantiationService.createInstance(editorActions_1.CloseEditorAction, editorActions_1.CloseEditorAction.ID, editorActions_1.CloseEditorAction.LABEL);
            this.unpinEditorAction = this.instantiationService.createInstance(editorActions_1.UnpinEditorAction, editorActions_1.UnpinEditorAction.ID, editorActions_1.UnpinEditorAction.LABEL);
            // noop
        }
        get templateId() {
            return OpenEditorRenderer.ID;
        }
        renderTemplate(container) {
            const editorTemplate = Object.create(null);
            editorTemplate.container = container;
            editorTemplate.actionRunner = new OpenEditorActionRunner();
            editorTemplate.actionBar = new actionbar_1.ActionBar(container, { actionRunner: editorTemplate.actionRunner });
            editorTemplate.root = this.labels.create(container);
            return editorTemplate;
        }
        renderElement(openedEditor, _index, templateData) {
            var _a;
            const editor = openedEditor.editor;
            templateData.actionRunner.editor = openedEditor;
            templateData.container.classList.toggle('dirty', editor.isDirty() && !editor.isSaving());
            templateData.container.classList.toggle('sticky', openedEditor.isSticky());
            templateData.root.setResource({
                resource: editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH }),
                name: editor.getName(),
                description: editor.getDescription(1 /* Verbosity.MEDIUM */)
            }, {
                italic: openedEditor.isPreview(),
                extraClasses: ['open-editor'].concat(openedEditor.editor.getLabelExtraClasses()),
                fileDecorations: this.configurationService.getValue().explorer.decorations,
                title: editor.getTitle(2 /* Verbosity.LONG */)
            });
            const editorAction = openedEditor.isSticky() ? this.unpinEditorAction : this.closeEditorAction;
            if (!templateData.actionBar.hasAction(editorAction)) {
                if (!templateData.actionBar.isEmpty()) {
                    templateData.actionBar.clear();
                }
                templateData.actionBar.push(editorAction, { icon: true, label: false, keybinding: (_a = this.keybindingService.lookupKeybinding(editorAction.id)) === null || _a === void 0 ? void 0 : _a.getLabel() });
            }
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
            templateData.root.dispose();
            templateData.actionRunner.dispose();
        }
    }
    OpenEditorRenderer.ID = 'openeditor';
    class OpenEditorsDragAndDrop {
        constructor(instantiationService, editorGroupService) {
            this.instantiationService = instantiationService;
            this.editorGroupService = editorGroupService;
        }
        get dropHandler() {
            return this.instantiationService.createInstance(dnd_1.ResourcesDropHandler, { allowWorkspaceOpen: false });
        }
        getDragURI(element) {
            if (element instanceof files_1.OpenEditor) {
                const resource = element.getResource();
                if (resource) {
                    return resource.toString();
                }
            }
            return null;
        }
        getDragLabel(elements) {
            if (elements.length > 1) {
                return String(elements.length);
            }
            const element = elements[0];
            return element instanceof files_1.OpenEditor ? element.editor.getName() : element.label;
        }
        onDragStart(data, originalEvent) {
            const items = data.elements;
            const editors = [];
            if (items) {
                for (const item of items) {
                    if (item instanceof files_1.OpenEditor) {
                        editors.push(item);
                    }
                }
            }
            if (editors.length) {
                // Apply some datatransfer types to allow for dragging the element outside of the application
                this.instantiationService.invokeFunction(dnd_1.fillEditorsDragData, editors, originalEvent);
            }
        }
        onDragOver(data, _targetElement, _targetIndex, originalEvent) {
            if (data instanceof listView_1.NativeDragAndDropData) {
                return (0, dnd_1.containsDragType)(originalEvent, dnd_2.DataTransfers.FILES, dnd_1.CodeDataTransfers.FILES);
            }
            return true;
        }
        drop(data, targetElement, _targetIndex, originalEvent) {
            const group = targetElement instanceof files_1.OpenEditor ? targetElement.group : targetElement || this.editorGroupService.groups[this.editorGroupService.count - 1];
            const index = targetElement instanceof files_1.OpenEditor ? targetElement.group.getIndexOfEditor(targetElement.editor) : 0;
            if (data instanceof listView_1.ElementsDragAndDropData) {
                const elementsData = data.elements;
                elementsData.forEach((oe, offset) => {
                    oe.group.moveEditor(oe.editor, group, { index: index + offset, preserveFocus: true });
                });
                this.editorGroupService.activateGroup(group);
            }
            else {
                this.dropHandler.handleDrop(originalEvent, () => group, () => group.focus(), index);
            }
        }
    }
    __decorate([
        decorators_1.memoize
    ], OpenEditorsDragAndDrop.prototype, "dropHandler", null);
    class OpenEditorsAccessibilityProvider {
        getWidgetAriaLabel() {
            return nls.localize('openEditors', "Open Editors");
        }
        getAriaLabel(element) {
            if (element instanceof files_1.OpenEditor) {
                return `${element.editor.getName()}, ${element.editor.getDescription()}`;
            }
            return element.ariaLabel;
        }
    }
    const toggleEditorGroupLayoutId = 'workbench.action.toggleEditorGroupLayout';
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.toggleEditorGroupLayout',
                title: { value: nls.localize('flipLayout', "Toggle Vertical/Horizontal Editor Layout"), original: 'Toggle Vertical/Horizontal Editor Layout' },
                f1: true,
                keybinding: {
                    primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 21 /* KeyCode.Digit0 */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 21 /* KeyCode.Digit0 */ },
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */
                },
                icon: codicons_1.Codicon.editorLayout,
                menu: {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', OpenEditorsView.ID),
                    order: 10
                }
            });
        }
        async run(accessor) {
            const editorGroupService = accessor.get(editorGroupsService_1.IEditorGroupsService);
            const newOrientation = (editorGroupService.orientation === 1 /* GroupOrientation.VERTICAL */) ? 0 /* GroupOrientation.HORIZONTAL */ : 1 /* GroupOrientation.VERTICAL */;
            editorGroupService.setGroupOrientation(newOrientation);
        }
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarLayoutMenu, {
        group: '4_flip',
        command: {
            id: toggleEditorGroupLayoutId,
            title: {
                original: 'Flip Layout',
                value: nls.localize('miToggleEditorLayoutWithoutMnemonic', "Flip Layout"),
                mnemonicTitle: nls.localize({ key: 'miToggleEditorLayout', comment: ['&& denotes a mnemonic'] }, "Flip &&Layout")
            }
        },
        order: 1
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'workbench.action.files.saveAll',
                title: { value: fileConstants_1.SAVE_ALL_LABEL, original: 'Save All' },
                f1: true,
                icon: codicons_1.Codicon.saveAll,
                menu: {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', OpenEditorsView.ID),
                    order: 20
                }
            });
        }
        async run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            await commandService.executeCommand(fileConstants_1.SAVE_ALL_COMMAND_ID);
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'openEditors.closeAll',
                title: editorActions_1.CloseAllEditorsAction.LABEL,
                f1: false,
                icon: codicons_1.Codicon.closeAll,
                menu: {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', OpenEditorsView.ID),
                    order: 30
                }
            });
        }
        async run(accessor) {
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const closeAll = instantiationService.createInstance(editorActions_1.CloseAllEditorsAction, editorActions_1.CloseAllEditorsAction.ID, editorActions_1.CloseAllEditorsAction.LABEL);
            await closeAll.run();
        }
    });
    (0, actions_2.registerAction2)(class extends actions_2.Action2 {
        constructor() {
            super({
                id: 'openEditors.newUntitledFile',
                title: { value: nls.localize('newUntitledFile', "New Untitled File"), original: 'New Untitled File' },
                f1: false,
                icon: codicons_1.Codicon.newFile,
                menu: {
                    id: actions_2.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', OpenEditorsView.ID),
                    order: 5
                }
            });
        }
        async run(accessor) {
            const commandService = accessor.get(commands_1.ICommandService);
            await commandService.executeCommand(fileConstants_1.NEW_UNTITLED_FILE_COMMAND_ID);
        }
    });
});
//# sourceMappingURL=openEditorsView.js.map