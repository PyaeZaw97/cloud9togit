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
define(["require", "exports", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/formattedTextRenderer", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/platform", "vs/base/common/types", "vs/nls", "vs/platform/configuration/common/configuration", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/platform/workspace/common/workspace", "vs/workbench/browser/dnd", "vs/workbench/browser/parts/editor/editor", "vs/workbench/common/theme", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/views/browser/treeViewsService", "vs/css!./media/editordroptarget"], function (require, exports, dnd_1, dom_1, formattedTextRenderer_1, async_1, lifecycle_1, platform_1, types_1, nls_1, configuration_1, instantiation_1, platform_2, colorRegistry_1, themeService_1, workspace_1, dnd_2, editor_1, theme_1, editorGroupsService_1, editorService_1, treeViewsService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorDropTarget = void 0;
    function isDropIntoEditorEnabledGlobally(configurationService) {
        return configurationService.getValue('workbench.experimental.editor.dropIntoEditor.enabled');
    }
    function isDragIntoEditorEvent(e) {
        return e.shiftKey;
    }
    let DropOverlay = class DropOverlay extends themeService_1.Themable {
        constructor(accessor, groupView, themeService, configurationService, instantiationService, editorService, editorGroupService, treeViewsDragAndDropService, contextService) {
            super(themeService);
            this.accessor = accessor;
            this.groupView = groupView;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.treeViewsDragAndDropService = treeViewsDragAndDropService;
            this.contextService = contextService;
            this.editorTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.groupTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.treeItemsTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.cleanupOverlayScheduler = this._register(new async_1.RunOnceScheduler(() => this.dispose(), 300));
            this.enableDropIntoEditor = isDropIntoEditorEnabledGlobally(this.configurationService) && this.isDropIntoActiveEditorEnabled();
            this.create();
        }
        get disposed() { return !!this._disposed; }
        create() {
            const overlayOffsetHeight = this.getOverlayOffsetHeight();
            // Container
            const container = this.container = document.createElement('div');
            container.id = DropOverlay.OVERLAY_ID;
            container.style.top = `${overlayOffsetHeight}px`;
            // Parent
            this.groupView.element.appendChild(container);
            this.groupView.element.classList.add('dragged-over');
            this._register((0, lifecycle_1.toDisposable)(() => {
                this.groupView.element.removeChild(container);
                this.groupView.element.classList.remove('dragged-over');
            }));
            // Overlay
            this.overlay = document.createElement('div');
            this.overlay.classList.add('editor-group-overlay-indicator');
            container.appendChild(this.overlay);
            if (this.enableDropIntoEditor) {
                this.dropIntoPromptElement = (0, formattedTextRenderer_1.renderFormattedText)((0, nls_1.localize)('dropIntoEditorPrompt', "Hold __{0}__ to drop into editor", platform_1.isMacintosh ? '⇧' : 'Shift'), {});
                this.dropIntoPromptElement.classList.add('editor-group-overlay-drop-into-prompt');
                this.overlay.appendChild(this.dropIntoPromptElement);
            }
            // Overlay Event Handling
            this.registerListeners(container);
            // Styles
            this.updateStyles();
        }
        updateStyles() {
            var _a, _b;
            const overlay = (0, types_1.assertIsDefined)(this.overlay);
            // Overlay drop background
            overlay.style.backgroundColor = this.getColor(theme_1.EDITOR_DRAG_AND_DROP_BACKGROUND) || '';
            // Overlay contrast border (if any)
            const activeContrastBorderColor = this.getColor(colorRegistry_1.activeContrastBorder);
            overlay.style.outlineColor = activeContrastBorderColor || '';
            overlay.style.outlineOffset = activeContrastBorderColor ? '-2px' : '';
            overlay.style.outlineStyle = activeContrastBorderColor ? 'dashed' : '';
            overlay.style.outlineWidth = activeContrastBorderColor ? '2px' : '';
            if (this.dropIntoPromptElement) {
                this.dropIntoPromptElement.style.backgroundColor = (_a = this.getColor(theme_1.EDITOR_DROP_INTO_PROMPT_BACKGROUND)) !== null && _a !== void 0 ? _a : '';
                this.dropIntoPromptElement.style.color = (_b = this.getColor(theme_1.EDITOR_DROP_INTO_PROMPT_FOREGROUND)) !== null && _b !== void 0 ? _b : '';
                const borderColor = this.getColor(theme_1.EDITOR_DROP_INTO_PROMPT_BORDER);
                if (borderColor) {
                    this.dropIntoPromptElement.style.borderWidth = '1px';
                    this.dropIntoPromptElement.style.borderStyle = 'solid';
                    this.dropIntoPromptElement.style.borderColor = borderColor;
                }
                else {
                    this.dropIntoPromptElement.style.borderWidth = '0';
                }
            }
        }
        registerListeners(container) {
            this._register(new dom_1.DragAndDropObserver(container, {
                onDragEnter: e => undefined,
                onDragOver: e => {
                    if (this.enableDropIntoEditor && isDragIntoEditorEvent(e)) {
                        this.dispose();
                        return;
                    }
                    const isDraggingGroup = this.groupTransfer.hasData(dnd_2.DraggedEditorGroupIdentifier.prototype);
                    const isDraggingEditor = this.editorTransfer.hasData(dnd_2.DraggedEditorIdentifier.prototype);
                    // Update the dropEffect to "copy" if there is no local data to be dragged because
                    // in that case we can only copy the data into and not move it from its source
                    if (!isDraggingEditor && !isDraggingGroup && e.dataTransfer) {
                        e.dataTransfer.dropEffect = 'copy';
                    }
                    // Find out if operation is valid
                    let isCopy = true;
                    if (isDraggingGroup) {
                        isCopy = this.isCopyOperation(e);
                    }
                    else if (isDraggingEditor) {
                        const data = this.editorTransfer.getData(dnd_2.DraggedEditorIdentifier.prototype);
                        if (Array.isArray(data)) {
                            isCopy = this.isCopyOperation(e, data[0].identifier);
                        }
                    }
                    if (!isCopy) {
                        const sourceGroupView = this.findSourceGroupView();
                        if (sourceGroupView === this.groupView) {
                            if (isDraggingGroup || (isDraggingEditor && sourceGroupView.count < 2)) {
                                this.hideOverlay();
                                return; // do not allow to drop group/editor on itself if this results in an empty group
                            }
                        }
                    }
                    // Position overlay and conditionally enable or disable
                    // editor group splitting support based on setting and
                    // keymodifiers used.
                    let splitOnDragAndDrop = !!this.editorGroupService.partOptions.splitOnDragAndDrop;
                    if (this.isToggleSplitOperation(e)) {
                        splitOnDragAndDrop = !splitOnDragAndDrop;
                    }
                    this.positionOverlay(e.offsetX, e.offsetY, isDraggingGroup, splitOnDragAndDrop);
                    // Make sure to stop any running cleanup scheduler to remove the overlay
                    if (this.cleanupOverlayScheduler.isScheduled()) {
                        this.cleanupOverlayScheduler.cancel();
                    }
                },
                onDragLeave: e => this.dispose(),
                onDragEnd: e => this.dispose(),
                onDrop: e => {
                    dom_1.EventHelper.stop(e, true);
                    // Dispose overlay
                    this.dispose();
                    // Handle drop if we have a valid operation
                    if (this.currentDropOperation) {
                        this.handleDrop(e, this.currentDropOperation.splitDirection);
                    }
                }
            }));
            this._register((0, dom_1.addDisposableListener)(container, dom_1.EventType.MOUSE_OVER, () => {
                // Under some circumstances we have seen reports where the drop overlay is not being
                // cleaned up and as such the editor area remains under the overlay so that you cannot
                // type into the editor anymore. This seems related to using VMs and DND via host and
                // guest OS, though some users also saw it without VMs.
                // To protect against this issue we always destroy the overlay as soon as we detect a
                // mouse event over it. The delay is used to guarantee we are not interfering with the
                // actual DROP event that can also trigger a mouse over event.
                if (!this.cleanupOverlayScheduler.isScheduled()) {
                    this.cleanupOverlayScheduler.schedule();
                }
            }));
        }
        isDropIntoActiveEditorEnabled() {
            var _a;
            return !!((_a = this.groupView.activeEditor) === null || _a === void 0 ? void 0 : _a.hasCapability(128 /* EditorInputCapabilities.CanDropIntoEditor */));
        }
        findSourceGroupView() {
            // Check for group transfer
            if (this.groupTransfer.hasData(dnd_2.DraggedEditorGroupIdentifier.prototype)) {
                const data = this.groupTransfer.getData(dnd_2.DraggedEditorGroupIdentifier.prototype);
                if (Array.isArray(data)) {
                    return this.accessor.getGroup(data[0].identifier);
                }
            }
            // Check for editor transfer
            else if (this.editorTransfer.hasData(dnd_2.DraggedEditorIdentifier.prototype)) {
                const data = this.editorTransfer.getData(dnd_2.DraggedEditorIdentifier.prototype);
                if (Array.isArray(data)) {
                    return this.accessor.getGroup(data[0].identifier.groupId);
                }
            }
            return undefined;
        }
        async handleDrop(event, splitDirection) {
            // Determine target group
            const ensureTargetGroup = () => {
                let targetGroup;
                if (typeof splitDirection === 'number') {
                    targetGroup = this.accessor.addGroup(this.groupView, splitDirection);
                }
                else {
                    targetGroup = this.groupView;
                }
                return targetGroup;
            };
            // Check for group transfer
            if (this.groupTransfer.hasData(dnd_2.DraggedEditorGroupIdentifier.prototype)) {
                const data = this.groupTransfer.getData(dnd_2.DraggedEditorGroupIdentifier.prototype);
                if (Array.isArray(data)) {
                    const sourceGroup = this.accessor.getGroup(data[0].identifier);
                    if (sourceGroup) {
                        if (typeof splitDirection !== 'number' && sourceGroup === this.groupView) {
                            return;
                        }
                        // Split to new group
                        let targetGroup;
                        if (typeof splitDirection === 'number') {
                            if (this.isCopyOperation(event)) {
                                targetGroup = this.accessor.copyGroup(sourceGroup, this.groupView, splitDirection);
                            }
                            else {
                                targetGroup = this.accessor.moveGroup(sourceGroup, this.groupView, splitDirection);
                            }
                        }
                        // Merge into existing group
                        else {
                            let mergeGroupOptions = undefined;
                            if (this.isCopyOperation(event)) {
                                mergeGroupOptions = { mode: 0 /* MergeGroupMode.COPY_EDITORS */ };
                            }
                            this.accessor.mergeGroup(sourceGroup, this.groupView, mergeGroupOptions);
                        }
                        if (targetGroup) {
                            this.accessor.activateGroup(targetGroup);
                        }
                    }
                    this.groupTransfer.clearData(dnd_2.DraggedEditorGroupIdentifier.prototype);
                }
            }
            // Check for editor transfer
            else if (this.editorTransfer.hasData(dnd_2.DraggedEditorIdentifier.prototype)) {
                const data = this.editorTransfer.getData(dnd_2.DraggedEditorIdentifier.prototype);
                if (Array.isArray(data)) {
                    const draggedEditor = data[0].identifier;
                    const targetGroup = ensureTargetGroup();
                    const sourceGroup = this.accessor.getGroup(draggedEditor.groupId);
                    if (sourceGroup) {
                        if (sourceGroup === targetGroup) {
                            return;
                        }
                        // Open in target group
                        const options = (0, editor_1.fillActiveEditorViewState)(sourceGroup, draggedEditor.editor, {
                            pinned: true,
                            sticky: sourceGroup.isSticky(draggedEditor.editor), // preserve sticky state
                        });
                        const copyEditor = this.isCopyOperation(event, draggedEditor);
                        if (!copyEditor) {
                            sourceGroup.moveEditor(draggedEditor.editor, targetGroup, options);
                        }
                        else {
                            sourceGroup.copyEditor(draggedEditor.editor, targetGroup, options);
                        }
                        // Ensure target has focus
                        targetGroup.focus();
                    }
                    this.editorTransfer.clearData(dnd_2.DraggedEditorIdentifier.prototype);
                }
            }
            // Check for tree items
            else if (this.treeItemsTransfer.hasData(dnd_2.DraggedTreeItemsIdentifier.prototype)) {
                const data = this.treeItemsTransfer.getData(dnd_2.DraggedTreeItemsIdentifier.prototype);
                if (Array.isArray(data)) {
                    const editors = [];
                    for (const id of data) {
                        const dataTransferItem = await this.treeViewsDragAndDropService.removeDragOperationTransfer(id.identifier);
                        if (dataTransferItem) {
                            const treeDropData = await (0, dnd_2.extractTreeDropData)(dataTransferItem);
                            editors.push(...treeDropData.map(editor => (Object.assign(Object.assign({}, editor), { options: Object.assign(Object.assign({}, editor.options), { pinned: true }) }))));
                        }
                    }
                    this.editorService.openEditors(editors, ensureTargetGroup(), { validateTrust: true });
                }
                this.treeItemsTransfer.clearData(dnd_2.DraggedTreeItemsIdentifier.prototype);
            }
            // Check for URI transfer
            else {
                const dropHandler = this.instantiationService.createInstance(dnd_2.ResourcesDropHandler, { allowWorkspaceOpen: !platform_1.isWeb || (0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace()) });
                dropHandler.handleDrop(event, () => ensureTargetGroup(), targetGroup => targetGroup === null || targetGroup === void 0 ? void 0 : targetGroup.focus());
            }
        }
        isCopyOperation(e, draggedEditor) {
            if (draggedEditor === null || draggedEditor === void 0 ? void 0 : draggedEditor.editor.hasCapability(8 /* EditorInputCapabilities.Singleton */)) {
                return false; // Singleton editors cannot be split
            }
            return (e.ctrlKey && !platform_1.isMacintosh) || (e.altKey && platform_1.isMacintosh);
        }
        isToggleSplitOperation(e) {
            return (e.altKey && !platform_1.isMacintosh) || (e.shiftKey && platform_1.isMacintosh);
        }
        positionOverlay(mousePosX, mousePosY, isDraggingGroup, enableSplitting) {
            const preferSplitVertically = this.accessor.partOptions.openSideBySideDirection === 'right';
            const editorControlWidth = this.groupView.element.clientWidth;
            const editorControlHeight = this.groupView.element.clientHeight - this.getOverlayOffsetHeight();
            let edgeWidthThresholdFactor;
            let edgeHeightThresholdFactor;
            if (enableSplitting) {
                if (isDraggingGroup) {
                    edgeWidthThresholdFactor = preferSplitVertically ? 0.3 : 0.1; // give larger threshold when dragging group depending on preferred split direction
                }
                else {
                    edgeWidthThresholdFactor = 0.1; // 10% threshold to split if dragging editors
                }
                if (isDraggingGroup) {
                    edgeHeightThresholdFactor = preferSplitVertically ? 0.1 : 0.3; // give larger threshold when dragging group depending on preferred split direction
                }
                else {
                    edgeHeightThresholdFactor = 0.1; // 10% threshold to split if dragging editors
                }
            }
            else {
                edgeWidthThresholdFactor = 0;
                edgeHeightThresholdFactor = 0;
            }
            const edgeWidthThreshold = editorControlWidth * edgeWidthThresholdFactor;
            const edgeHeightThreshold = editorControlHeight * edgeHeightThresholdFactor;
            const splitWidthThreshold = editorControlWidth / 3; // offer to split left/right at 33%
            const splitHeightThreshold = editorControlHeight / 3; // offer to split up/down at 33%
            // Enable to debug the drop threshold square
            // let child = this.overlay.children.item(0) as HTMLElement || this.overlay.appendChild(document.createElement('div'));
            // child.style.backgroundColor = 'red';
            // child.style.position = 'absolute';
            // child.style.width = (groupViewWidth - (2 * edgeWidthThreshold)) + 'px';
            // child.style.height = (groupViewHeight - (2 * edgeHeightThreshold)) + 'px';
            // child.style.left = edgeWidthThreshold + 'px';
            // child.style.top = edgeHeightThreshold + 'px';
            // No split if mouse is above certain threshold in the center of the view
            let splitDirection;
            if (mousePosX > edgeWidthThreshold && mousePosX < editorControlWidth - edgeWidthThreshold &&
                mousePosY > edgeHeightThreshold && mousePosY < editorControlHeight - edgeHeightThreshold) {
                splitDirection = undefined;
            }
            // Offer to split otherwise
            else {
                // User prefers to split vertically: offer a larger hitzone
                // for this direction like so:
                // ----------------------------------------------
                // |		|		SPLIT UP		|			|
                // | SPLIT 	|-----------------------|	SPLIT	|
                // |		|		  MERGE			|			|
                // | LEFT	|-----------------------|	RIGHT	|
                // |		|		SPLIT DOWN		|			|
                // ----------------------------------------------
                if (preferSplitVertically) {
                    if (mousePosX < splitWidthThreshold) {
                        splitDirection = 2 /* GroupDirection.LEFT */;
                    }
                    else if (mousePosX > splitWidthThreshold * 2) {
                        splitDirection = 3 /* GroupDirection.RIGHT */;
                    }
                    else if (mousePosY < editorControlHeight / 2) {
                        splitDirection = 0 /* GroupDirection.UP */;
                    }
                    else {
                        splitDirection = 1 /* GroupDirection.DOWN */;
                    }
                }
                // User prefers to split horizontally: offer a larger hitzone
                // for this direction like so:
                // ----------------------------------------------
                // |				SPLIT UP					|
                // |--------------------------------------------|
                // |  SPLIT LEFT  |	   MERGE	|  SPLIT RIGHT  |
                // |--------------------------------------------|
                // |				SPLIT DOWN					|
                // ----------------------------------------------
                else {
                    if (mousePosY < splitHeightThreshold) {
                        splitDirection = 0 /* GroupDirection.UP */;
                    }
                    else if (mousePosY > splitHeightThreshold * 2) {
                        splitDirection = 1 /* GroupDirection.DOWN */;
                    }
                    else if (mousePosX < editorControlWidth / 2) {
                        splitDirection = 2 /* GroupDirection.LEFT */;
                    }
                    else {
                        splitDirection = 3 /* GroupDirection.RIGHT */;
                    }
                }
            }
            // Draw overlay based on split direction
            switch (splitDirection) {
                case 0 /* GroupDirection.UP */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '50%' });
                    this.toggleDropIntoPrompt(false);
                    break;
                case 1 /* GroupDirection.DOWN */:
                    this.doPositionOverlay({ top: '50%', left: '0', width: '100%', height: '50%' });
                    this.toggleDropIntoPrompt(false);
                    break;
                case 2 /* GroupDirection.LEFT */:
                    this.doPositionOverlay({ top: '0', left: '0', width: '50%', height: '100%' });
                    this.toggleDropIntoPrompt(false);
                    break;
                case 3 /* GroupDirection.RIGHT */:
                    this.doPositionOverlay({ top: '0', left: '50%', width: '50%', height: '100%' });
                    this.toggleDropIntoPrompt(false);
                    break;
                default:
                    this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '100%' });
                    this.toggleDropIntoPrompt(true);
            }
            // Make sure the overlay is visible now
            const overlay = (0, types_1.assertIsDefined)(this.overlay);
            overlay.style.opacity = '1';
            // Enable transition after a timeout to prevent initial animation
            setTimeout(() => overlay.classList.add('overlay-move-transition'), 0);
            // Remember as current split direction
            this.currentDropOperation = { splitDirection };
        }
        doPositionOverlay(options) {
            const [container, overlay] = (0, types_1.assertAllDefined)(this.container, this.overlay);
            // Container
            const offsetHeight = this.getOverlayOffsetHeight();
            if (offsetHeight) {
                container.style.height = `calc(100% - ${offsetHeight}px)`;
            }
            else {
                container.style.height = '100%';
            }
            // Overlay
            overlay.style.top = options.top;
            overlay.style.left = options.left;
            overlay.style.width = options.width;
            overlay.style.height = options.height;
        }
        getOverlayOffsetHeight() {
            // With tabs and opened editors: use the area below tabs as drop target
            if (!this.groupView.isEmpty && this.accessor.partOptions.showTabs) {
                return this.groupView.titleHeight.offset;
            }
            // Without tabs or empty group: use entire editor area as drop target
            return 0;
        }
        hideOverlay() {
            const overlay = (0, types_1.assertIsDefined)(this.overlay);
            // Reset overlay
            this.doPositionOverlay({ top: '0', left: '0', width: '100%', height: '100%' });
            overlay.style.opacity = '0';
            overlay.classList.remove('overlay-move-transition');
            // Reset current operation
            this.currentDropOperation = undefined;
        }
        toggleDropIntoPrompt(showing) {
            if (!this.dropIntoPromptElement) {
                return;
            }
            this.dropIntoPromptElement.style.opacity = showing ? '1' : '0';
        }
        contains(element) {
            return element === this.container || element === this.overlay;
        }
        dispose() {
            super.dispose();
            this._disposed = true;
        }
    };
    DropOverlay.OVERLAY_ID = 'monaco-workbench-editor-drop-overlay';
    DropOverlay = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, editorService_1.IEditorService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, treeViewsService_1.ITreeViewsService),
        __param(8, workspace_1.IWorkspaceContextService)
    ], DropOverlay);
    let EditorDropTarget = class EditorDropTarget extends themeService_1.Themable {
        constructor(accessor, container, delegate, themeService, configurationService, instantiationService) {
            super(themeService);
            this.accessor = accessor;
            this.container = container;
            this.delegate = delegate;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.counter = 0;
            this.editorTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.groupTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.registerListeners();
        }
        get overlay() {
            if (this._overlay && !this._overlay.disposed) {
                return this._overlay;
            }
            return undefined;
        }
        registerListeners() {
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.DRAG_ENTER, e => this.onDragEnter(e)));
            this._register((0, dom_1.addDisposableListener)(this.container, dom_1.EventType.DRAG_LEAVE, () => this.onDragLeave()));
            [this.container, window].forEach(node => this._register((0, dom_1.addDisposableListener)(node, dom_1.EventType.DRAG_END, () => this.onDragEnd())));
        }
        onDragEnter(event) {
            if (isDropIntoEditorEnabledGlobally(this.configurationService) && isDragIntoEditorEvent(event)) {
                return;
            }
            this.counter++;
            // Validate transfer
            if (!this.editorTransfer.hasData(dnd_2.DraggedEditorIdentifier.prototype) &&
                !this.groupTransfer.hasData(dnd_2.DraggedEditorGroupIdentifier.prototype) &&
                event.dataTransfer) {
                const dndContributions = platform_2.Registry.as(dnd_2.Extensions.DragAndDropContribution).getAll();
                const dndContributionKeys = Array.from(dndContributions).map(e => e.dataFormatKey);
                if (!(0, dnd_2.containsDragType)(event, dnd_1.DataTransfers.FILES, dnd_2.CodeDataTransfers.FILES, dnd_1.DataTransfers.RESOURCES, dnd_2.CodeDataTransfers.EDITORS, ...dndContributionKeys)) { // see https://github.com/microsoft/vscode/issues/25789
                    event.dataTransfer.dropEffect = 'none';
                    return; // unsupported transfer
                }
            }
            // Signal DND start
            this.updateContainer(true);
            const target = event.target;
            if (target) {
                // Somehow we managed to move the mouse quickly out of the current overlay, so destroy it
                if (this.overlay && !this.overlay.contains(target)) {
                    this.disposeOverlay();
                }
                // Create overlay over target
                if (!this.overlay) {
                    const targetGroupView = this.findTargetGroupView(target);
                    if (targetGroupView) {
                        this._overlay = this.instantiationService.createInstance(DropOverlay, this.accessor, targetGroupView);
                    }
                }
            }
        }
        onDragLeave() {
            this.counter--;
            if (this.counter === 0) {
                this.updateContainer(false);
            }
        }
        onDragEnd() {
            this.counter = 0;
            this.updateContainer(false);
            this.disposeOverlay();
        }
        findTargetGroupView(child) {
            const groups = this.accessor.groups;
            return groups.find(groupView => { var _a, _b; return (0, dom_1.isAncestor)(child, groupView.element) || ((_b = (_a = this.delegate).containsGroup) === null || _b === void 0 ? void 0 : _b.call(_a, groupView)); });
        }
        updateContainer(isDraggedOver) {
            this.container.classList.toggle('dragged-over', isDraggedOver);
        }
        dispose() {
            super.dispose();
            this.disposeOverlay();
        }
        disposeOverlay() {
            if (this.overlay) {
                this.overlay.dispose();
                this._overlay = undefined;
            }
        }
    };
    EditorDropTarget = __decorate([
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService)
    ], EditorDropTarget);
    exports.EditorDropTarget = EditorDropTarget;
});
//# sourceMappingURL=editorDropTarget.js.map