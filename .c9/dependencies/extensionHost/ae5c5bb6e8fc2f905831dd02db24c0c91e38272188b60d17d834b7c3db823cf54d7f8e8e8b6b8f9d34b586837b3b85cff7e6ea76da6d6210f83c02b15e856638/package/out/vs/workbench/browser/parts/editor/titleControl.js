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
define(["require", "exports", "vs/nls", "vs/base/browser/dnd", "vs/base/browser/dom", "vs/base/browser/mouseEvent", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/toolbar/toolbar", "vs/base/common/actions", "vs/base/common/lifecycle", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/notification/common/notification", "vs/platform/quickinput/common/quickInput", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/workbench/browser/dnd", "vs/workbench/browser/parts/editor/editorPane", "vs/workbench/browser/parts/editor/breadcrumbs", "vs/workbench/browser/parts/editor/breadcrumbsControl", "vs/workbench/common/editor", "vs/workbench/common/contextkeys", "vs/platform/files/common/files", "vs/base/common/types", "vs/base/browser/browser", "vs/base/common/errors", "vs/workbench/common/editor/sideBySideEditorInput", "vs/css!./media/titlecontrol"], function (require, exports, nls_1, dnd_1, dom_1, mouseEvent_1, actionbar_1, toolbar_1, actions_1, lifecycle_1, menuEntryActionViewItem_1, actions_2, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, notification_1, quickInput_1, telemetry_1, colorRegistry_1, themeService_1, dnd_2, editorPane_1, breadcrumbs_1, breadcrumbsControl_1, editor_1, contextkeys_1, files_1, types_1, browser_1, errors_1, sideBySideEditorInput_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TitleControl = exports.EditorCommandsContextActionRunner = void 0;
    class EditorCommandsContextActionRunner extends actions_1.ActionRunner {
        constructor(context) {
            super();
            this.context = context;
        }
        run(action, context) {
            // Even though we have a fixed context for editor commands,
            // allow to preserve the context that is given to us in case
            // it applies.
            let mergedContext = this.context;
            if (context === null || context === void 0 ? void 0 : context.preserveFocus) {
                mergedContext = Object.assign(Object.assign({}, this.context), { preserveFocus: true });
            }
            return super.run(action, mergedContext);
        }
    }
    exports.EditorCommandsContextActionRunner = EditorCommandsContextActionRunner;
    let TitleControl = class TitleControl extends themeService_1.Themable {
        constructor(parent, accessor, group, contextMenuService, instantiationService, contextKeyService, keybindingService, telemetryService, notificationService, menuService, quickInputService, themeService, configurationService, fileService) {
            super(themeService);
            this.accessor = accessor;
            this.group = group;
            this.contextMenuService = contextMenuService;
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.keybindingService = keybindingService;
            this.telemetryService = telemetryService;
            this.notificationService = notificationService;
            this.menuService = menuService;
            this.quickInputService = quickInputService;
            this.configurationService = configurationService;
            this.fileService = fileService;
            this.editorTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.groupTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.treeItemsTransfer = dnd_2.LocalSelectionTransfer.getInstance();
            this.breadcrumbsControl = undefined;
            this.editorToolBarMenuDisposables = this._register(new lifecycle_1.DisposableStore());
            this.resourceContext = this._register(instantiationService.createInstance(contextkeys_1.ResourceContextKey));
            this.editorPinnedContext = contextkeys_1.ActiveEditorPinnedContext.bindTo(contextKeyService);
            this.editorIsFirstContext = contextkeys_1.ActiveEditorFirstInGroupContext.bindTo(contextKeyService);
            this.editorIsLastContext = contextkeys_1.ActiveEditorLastInGroupContext.bindTo(contextKeyService);
            this.editorStickyContext = contextkeys_1.ActiveEditorStickyContext.bindTo(contextKeyService);
            this.editorCanSplitInGroupContext = contextkeys_1.ActiveEditorCanSplitInGroupContext.bindTo(contextKeyService);
            this.sideBySideEditorContext = contextkeys_1.SideBySideEditorActiveContext.bindTo(contextKeyService);
            this.groupLockedContext = contextkeys_1.ActiveEditorGroupLockedContext.bindTo(contextKeyService);
            this.contextMenu = this._register(this.menuService.createMenu(actions_2.MenuId.EditorTitleContext, this.contextKeyService));
            this.renderDropdownAsChildElement = false;
            this.create(parent);
        }
        createBreadcrumbsControl(container, options) {
            const config = this._register(breadcrumbs_1.BreadcrumbsConfig.IsEnabled.bindTo(this.configurationService));
            this._register(config.onDidChange(() => {
                const value = config.getValue();
                if (!value && this.breadcrumbsControl) {
                    this.breadcrumbsControl.dispose();
                    this.breadcrumbsControl = undefined;
                    this.handleBreadcrumbsEnablementChange();
                }
                else if (value && !this.breadcrumbsControl) {
                    this.breadcrumbsControl = this.instantiationService.createInstance(breadcrumbsControl_1.BreadcrumbsControl, container, options, this.group);
                    this.breadcrumbsControl.update();
                    this.handleBreadcrumbsEnablementChange();
                }
            }));
            if (config.getValue()) {
                this.breadcrumbsControl = this.instantiationService.createInstance(breadcrumbsControl_1.BreadcrumbsControl, container, options, this.group);
            }
            this._register(this.fileService.onDidChangeFileSystemProviderRegistrations(() => {
                var _a;
                if ((_a = this.breadcrumbsControl) === null || _a === void 0 ? void 0 : _a.update()) {
                    this.handleBreadcrumbsEnablementChange();
                }
            }));
        }
        createEditorActionsToolBar(container) {
            const context = { groupId: this.group.id };
            // Toolbar Widget
            this.editorActionsToolbar = this._register(new toolbar_1.ToolBar(container, this.contextMenuService, {
                actionViewItemProvider: action => this.actionViewItemProvider(action),
                orientation: 0 /* ActionsOrientation.HORIZONTAL */,
                ariaLabel: (0, nls_1.localize)('ariaLabelEditorActions', "Editor actions"),
                getKeyBinding: action => this.getKeybinding(action),
                actionRunner: this._register(new EditorCommandsContextActionRunner(context)),
                anchorAlignmentProvider: () => 1 /* AnchorAlignment.RIGHT */,
                renderDropdownAsChildElement: this.renderDropdownAsChildElement
            }));
            // Context
            this.editorActionsToolbar.context = context;
            // Action Run Handling
            this._register(this.editorActionsToolbar.actionRunner.onDidRun(e => {
                // Notify for Error
                if (e.error && !(0, errors_1.isCancellationError)(e.error)) {
                    this.notificationService.error(e.error);
                }
                // Log in telemetry
                this.telemetryService.publicLog2('workbenchActionExecuted', { id: e.action.id, from: 'editorPart' });
            }));
        }
        actionViewItemProvider(action) {
            const activeEditorPane = this.group.activeEditorPane;
            // Check Active Editor
            if (activeEditorPane instanceof editorPane_1.EditorPane) {
                const result = activeEditorPane.getActionViewItem(action);
                if (result) {
                    return result;
                }
            }
            // Check extensions
            return (0, menuEntryActionViewItem_1.createActionViewItem)(this.instantiationService, action, { menuAsChild: this.renderDropdownAsChildElement });
        }
        updateEditorActionsToolbar() {
            const { primary, secondary } = this.prepareEditorActions(this.getEditorActions());
            const editorActionsToolbar = (0, types_1.assertIsDefined)(this.editorActionsToolbar);
            editorActionsToolbar.setActions((0, actionbar_1.prepareActions)(primary), (0, actionbar_1.prepareActions)(secondary));
        }
        getEditorActions() {
            var _a;
            const primary = [];
            const secondary = [];
            // Dispose previous listeners
            this.editorToolBarMenuDisposables.clear();
            // Update contexts
            this.contextKeyService.bufferChangeEvents(() => {
                const activeEditor = this.group.activeEditor;
                this.resourceContext.set((0, types_1.withUndefinedAsNull)(editor_1.EditorResourceAccessor.getOriginalUri(activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY })));
                this.editorPinnedContext.set(activeEditor ? this.group.isPinned(activeEditor) : false);
                this.editorIsFirstContext.set(activeEditor ? this.group.isFirst(activeEditor) : false);
                this.editorIsLastContext.set(activeEditor ? this.group.isLast(activeEditor) : false);
                this.editorStickyContext.set(activeEditor ? this.group.isSticky(activeEditor) : false);
                this.editorCanSplitInGroupContext.set(activeEditor ? activeEditor.hasCapability(32 /* EditorInputCapabilities.CanSplitInGroup */) : false);
                this.sideBySideEditorContext.set((activeEditor === null || activeEditor === void 0 ? void 0 : activeEditor.typeId) === sideBySideEditorInput_1.SideBySideEditorInput.ID);
                this.groupLockedContext.set(this.group.isLocked);
            });
            // Editor actions require the editor control to be there, so we retrieve it via service
            const activeEditorPane = this.group.activeEditorPane;
            if (activeEditorPane instanceof editorPane_1.EditorPane) {
                const scopedContextKeyService = (_a = activeEditorPane.scopedContextKeyService) !== null && _a !== void 0 ? _a : this.contextKeyService;
                const titleBarMenu = this.menuService.createMenu(actions_2.MenuId.EditorTitle, scopedContextKeyService, { emitEventsForSubmenuChanges: true, eventDebounceDelay: 0 });
                this.editorToolBarMenuDisposables.add(titleBarMenu);
                this.editorToolBarMenuDisposables.add(titleBarMenu.onDidChange(() => {
                    this.updateEditorActionsToolbar(); // Update editor toolbar whenever contributed actions change
                }));
                const shouldInlineGroup = (action, group) => group === 'navigation' && action.actions.length <= 1;
                this.editorToolBarMenuDisposables.add((0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(titleBarMenu, { arg: this.resourceContext.get(), shouldForwardArgs: true }, { primary, secondary }, 'navigation', 9, shouldInlineGroup));
            }
            return { primary, secondary };
        }
        clearEditorActionsToolbar() {
            var _a;
            (_a = this.editorActionsToolbar) === null || _a === void 0 ? void 0 : _a.setActions([], []);
        }
        enableGroupDragging(element) {
            // Drag start
            this._register((0, dom_1.addDisposableListener)(element, dom_1.EventType.DRAG_START, e => {
                var _a;
                if (e.target !== element) {
                    return; // only if originating from tabs container
                }
                // Set editor group as transfer
                this.groupTransfer.setData([new dnd_2.DraggedEditorGroupIdentifier(this.group.id)], dnd_2.DraggedEditorGroupIdentifier.prototype);
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'copyMove';
                }
                // Drag all tabs of the group if tabs are enabled
                let hasDataTransfer = false;
                if (this.accessor.partOptions.showTabs) {
                    hasDataTransfer = this.doFillResourceDataTransfers(this.group.getEditors(1 /* EditorsOrder.SEQUENTIAL */), e);
                }
                // Otherwise only drag the active editor
                else {
                    if (this.group.activeEditor) {
                        hasDataTransfer = this.doFillResourceDataTransfers([this.group.activeEditor], e);
                    }
                }
                // Firefox: requires to set a text data transfer to get going
                if (!hasDataTransfer && browser_1.isFirefox) {
                    (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.setData(dnd_1.DataTransfers.TEXT, String(this.group.label));
                }
                // Drag Image
                if (this.group.activeEditor) {
                    let label = this.group.activeEditor.getName();
                    if (this.accessor.partOptions.showTabs && this.group.count > 1) {
                        label = (0, nls_1.localize)('draggedEditorGroup', "{0} (+{1})", label, this.group.count - 1);
                    }
                    (0, dnd_1.applyDragImage)(e, label, 'monaco-editor-group-drag-image');
                }
            }));
            // Drag end
            this._register((0, dom_1.addDisposableListener)(element, dom_1.EventType.DRAG_END, () => {
                this.groupTransfer.clearData(dnd_2.DraggedEditorGroupIdentifier.prototype);
            }));
        }
        doFillResourceDataTransfers(editors, e) {
            if (editors.length) {
                this.instantiationService.invokeFunction(dnd_2.fillEditorsDragData, editors.map(editor => ({ editor, groupId: this.group.id })), e);
                return true;
            }
            return false;
        }
        onContextMenu(editor, e, node) {
            // Update contexts based on editor picked and remember previous to restore
            const currentResourceContext = this.resourceContext.get();
            this.resourceContext.set((0, types_1.withUndefinedAsNull)(editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY })));
            const currentPinnedContext = !!this.editorPinnedContext.get();
            this.editorPinnedContext.set(this.group.isPinned(editor));
            const currentEditorIsFirstContext = !!this.editorIsFirstContext.get();
            this.editorIsFirstContext.set(this.group.isFirst(editor));
            const currentEditorIsLastContext = !!this.editorIsLastContext.get();
            this.editorIsLastContext.set(this.group.isLast(editor));
            const currentStickyContext = !!this.editorStickyContext.get();
            this.editorStickyContext.set(this.group.isSticky(editor));
            const currentGroupLockedContext = !!this.groupLockedContext.get();
            this.groupLockedContext.set(this.group.isLocked);
            const currentEditorCanSplitContext = !!this.editorCanSplitInGroupContext.get();
            this.editorCanSplitInGroupContext.set(editor.hasCapability(32 /* EditorInputCapabilities.CanSplitInGroup */));
            const currentSideBySideEditorContext = !!this.sideBySideEditorContext.get();
            this.sideBySideEditorContext.set(editor.typeId === sideBySideEditorInput_1.SideBySideEditorInput.ID);
            // Find target anchor
            let anchor = node;
            if (e instanceof MouseEvent) {
                const event = new mouseEvent_1.StandardMouseEvent(e);
                anchor = { x: event.posx, y: event.posy };
            }
            // Fill in contributed actions
            const actions = [];
            const actionsDisposable = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(this.contextMenu, { shouldForwardArgs: true, arg: this.resourceContext.get() }, actions);
            // Show it
            this.contextMenuService.showContextMenu({
                getAnchor: () => anchor,
                getActions: () => actions,
                getActionsContext: () => ({ groupId: this.group.id, editorIndex: this.group.getIndexOfEditor(editor) }),
                getKeyBinding: action => this.getKeybinding(action),
                onHide: () => {
                    // restore previous contexts
                    this.resourceContext.set(currentResourceContext || null);
                    this.editorPinnedContext.set(currentPinnedContext);
                    this.editorIsFirstContext.set(currentEditorIsFirstContext);
                    this.editorIsLastContext.set(currentEditorIsLastContext);
                    this.editorStickyContext.set(currentStickyContext);
                    this.groupLockedContext.set(currentGroupLockedContext);
                    this.editorCanSplitInGroupContext.set(currentEditorCanSplitContext);
                    this.sideBySideEditorContext.set(currentSideBySideEditorContext);
                    // restore focus to active group
                    this.accessor.activeGroup.focus();
                    // Cleanup
                    (0, lifecycle_1.dispose)(actionsDisposable);
                }
            });
        }
        getKeybinding(action) {
            return this.keybindingService.lookupKeybinding(action.id);
        }
        getKeybindingLabel(action) {
            const keybinding = this.getKeybinding(action);
            return keybinding ? (0, types_1.withNullAsUndefined)(keybinding.getLabel()) : undefined;
        }
        dispose() {
            (0, lifecycle_1.dispose)(this.breadcrumbsControl);
            this.breadcrumbsControl = undefined;
            super.dispose();
        }
    };
    TitleControl = __decorate([
        __param(3, contextView_1.IContextMenuService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, keybinding_1.IKeybindingService),
        __param(7, telemetry_1.ITelemetryService),
        __param(8, notification_1.INotificationService),
        __param(9, actions_2.IMenuService),
        __param(10, quickInput_1.IQuickInputService),
        __param(11, themeService_1.IThemeService),
        __param(12, configuration_1.IConfigurationService),
        __param(13, files_1.IFileService)
    ], TitleControl);
    exports.TitleControl = TitleControl;
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        // Drag Feedback
        const dragImageBackground = theme.getColor(colorRegistry_1.listActiveSelectionBackground);
        const dragImageForeground = theme.getColor(colorRegistry_1.listActiveSelectionForeground);
        collector.addRule(`
		.monaco-editor-group-drag-image {
			background: ${dragImageBackground};
			color: ${dragImageForeground};
		}
	`);
    });
});
//# sourceMappingURL=titleControl.js.map