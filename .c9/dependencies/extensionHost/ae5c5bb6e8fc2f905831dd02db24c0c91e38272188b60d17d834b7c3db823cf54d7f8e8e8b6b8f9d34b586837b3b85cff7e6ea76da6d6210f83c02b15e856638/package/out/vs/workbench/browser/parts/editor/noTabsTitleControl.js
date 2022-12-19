/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/titleControl", "vs/workbench/browser/labels", "vs/workbench/common/theme", "vs/base/browser/touch", "vs/base/browser/dom", "vs/workbench/browser/parts/editor/editorCommands", "vs/base/common/color", "vs/base/common/types", "vs/base/common/objects", "vs/base/common/lifecycle", "vs/css!./media/notabstitlecontrol"], function (require, exports, editor_1, titleControl_1, labels_1, theme_1, touch_1, dom_1, editorCommands_1, color_1, types_1, objects_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NoTabsTitleControl = void 0;
    class NoTabsTitleControl extends titleControl_1.TitleControl {
        constructor() {
            super(...arguments);
            this.activeLabel = Object.create(null);
        }
        create(parent) {
            const titleContainer = this.titleContainer = parent;
            titleContainer.draggable = true;
            //Container listeners
            this.registerContainerListeners(titleContainer);
            // Gesture Support
            this._register(touch_1.Gesture.addTarget(titleContainer));
            const labelContainer = document.createElement('div');
            labelContainer.classList.add('label-container');
            titleContainer.appendChild(labelContainer);
            // Editor Label
            this.editorLabel = this._register(this.instantiationService.createInstance(labels_1.ResourceLabel, labelContainer, undefined)).element;
            this._register((0, dom_1.addDisposableListener)(this.editorLabel.element, dom_1.EventType.CLICK, e => this.onTitleLabelClick(e)));
            // Breadcrumbs
            this.createBreadcrumbsControl(labelContainer, { showFileIcons: false, showSymbolIcons: true, showDecorationColors: false, breadcrumbsBackground: color_1.Color.transparent.toString(), showPlaceholder: false });
            titleContainer.classList.toggle('breadcrumbs', Boolean(this.breadcrumbsControl));
            this._register((0, lifecycle_1.toDisposable)(() => titleContainer.classList.remove('breadcrumbs'))); // important to remove because the container is a shared dom node
            // Right Actions Container
            const actionsContainer = document.createElement('div');
            actionsContainer.classList.add('title-actions');
            titleContainer.appendChild(actionsContainer);
            // Editor actions toolbar
            this.createEditorActionsToolBar(actionsContainer);
        }
        registerContainerListeners(titleContainer) {
            // Group dragging
            this.enableGroupDragging(titleContainer);
            // Pin on double click
            this._register((0, dom_1.addDisposableListener)(titleContainer, dom_1.EventType.DBLCLICK, e => this.onTitleDoubleClick(e)));
            // Detect mouse click
            this._register((0, dom_1.addDisposableListener)(titleContainer, dom_1.EventType.AUXCLICK, e => this.onTitleAuxClick(e)));
            // Detect touch
            this._register((0, dom_1.addDisposableListener)(titleContainer, touch_1.EventType.Tap, (e) => this.onTitleTap(e)));
            // Context Menu
            for (const event of [dom_1.EventType.CONTEXT_MENU, touch_1.EventType.Contextmenu]) {
                this._register((0, dom_1.addDisposableListener)(titleContainer, event, e => {
                    if (this.group.activeEditor) {
                        this.onContextMenu(this.group.activeEditor, e, titleContainer);
                    }
                }));
            }
        }
        onTitleLabelClick(e) {
            dom_1.EventHelper.stop(e, false);
            // delayed to let the onTitleClick() come first which can cause a focus change which can close quick access
            setTimeout(() => this.quickInputService.quickAccess.show());
        }
        onTitleDoubleClick(e) {
            dom_1.EventHelper.stop(e);
            this.group.pinEditor();
        }
        onTitleAuxClick(e) {
            if (e.button === 1 /* Middle Button */ && this.group.activeEditor) {
                dom_1.EventHelper.stop(e, true /* for https://github.com/microsoft/vscode/issues/56715 */);
                this.group.closeEditor(this.group.activeEditor);
            }
        }
        onTitleTap(e) {
            // We only want to open the quick access picker when
            // the tap occurred over the editor label, so we need
            // to check on the target
            // (https://github.com/microsoft/vscode/issues/107543)
            const target = e.initialTarget;
            if (!(target instanceof HTMLElement) || !this.editorLabel || !(0, dom_1.isAncestor)(target, this.editorLabel.element)) {
                return;
            }
            // TODO@rebornix gesture tap should open the quick access
            // editorGroupView will focus on the editor again when there
            // are mouse/pointer/touch down events we need to wait a bit as
            // `GesureEvent.Tap` is generated from `touchstart` and then
            // `touchend` events, which are not an atom event.
            setTimeout(() => this.quickInputService.quickAccess.show(), 50);
        }
        openEditor(editor) {
            this.doHandleOpenEditor();
        }
        openEditors(editors) {
            this.doHandleOpenEditor();
        }
        doHandleOpenEditor() {
            const activeEditorChanged = this.ifActiveEditorChanged(() => this.redraw());
            if (!activeEditorChanged) {
                this.ifActiveEditorPropertiesChanged(() => this.redraw());
            }
        }
        closeEditor(editor, index) {
            this.ifActiveEditorChanged(() => this.redraw());
        }
        closeEditors(editors) {
            this.ifActiveEditorChanged(() => this.redraw());
        }
        moveEditor(editor, fromIndex, targetIndex) {
            this.ifActiveEditorChanged(() => this.redraw());
        }
        pinEditor(editor) {
            this.ifEditorIsActive(editor, () => this.redraw());
        }
        stickEditor(editor) {
            // Sticky editors are not presented any different with tabs disabled
        }
        unstickEditor(editor) {
            // Sticky editors are not presented any different with tabs disabled
        }
        setActive(isActive) {
            this.redraw();
        }
        updateEditorLabel(editor) {
            this.ifEditorIsActive(editor, () => this.redraw());
        }
        updateEditorDirty(editor) {
            this.ifEditorIsActive(editor, () => {
                const titleContainer = (0, types_1.assertIsDefined)(this.titleContainer);
                // Signal dirty (unless saving)
                if (editor.isDirty() && !editor.isSaving()) {
                    titleContainer.classList.add('dirty');
                }
                // Otherwise, clear dirty
                else {
                    titleContainer.classList.remove('dirty');
                }
            });
        }
        updateOptions(oldOptions, newOptions) {
            if (oldOptions.labelFormat !== newOptions.labelFormat || !(0, objects_1.equals)(oldOptions.decorations, newOptions.decorations)) {
                this.redraw();
            }
        }
        updateStyles() {
            this.redraw();
        }
        handleBreadcrumbsEnablementChange() {
            const titleContainer = (0, types_1.assertIsDefined)(this.titleContainer);
            titleContainer.classList.toggle('breadcrumbs', Boolean(this.breadcrumbsControl));
            this.redraw();
        }
        ifActiveEditorChanged(fn) {
            if (!this.activeLabel.editor && this.group.activeEditor || // active editor changed from null => editor
                this.activeLabel.editor && !this.group.activeEditor || // active editor changed from editor => null
                (!this.activeLabel.editor || !this.group.isActive(this.activeLabel.editor)) // active editor changed from editorA => editorB
            ) {
                fn();
                return true;
            }
            return false;
        }
        ifActiveEditorPropertiesChanged(fn) {
            if (!this.activeLabel.editor || !this.group.activeEditor) {
                return; // need an active editor to check for properties changed
            }
            if (this.activeLabel.pinned !== this.group.isPinned(this.group.activeEditor)) {
                fn(); // only run if pinned state has changed
            }
        }
        ifEditorIsActive(editor, fn) {
            if (this.group.isActive(editor)) {
                fn(); // only run if editor is current active
            }
        }
        redraw() {
            var _a, _b;
            const editor = (0, types_1.withNullAsUndefined)(this.group.activeEditor);
            const options = this.accessor.partOptions;
            const isEditorPinned = editor ? this.group.isPinned(editor) : false;
            const isGroupActive = this.accessor.activeGroup === this.group;
            this.activeLabel = { editor, pinned: isEditorPinned };
            // Update Breadcrumbs
            if (this.breadcrumbsControl) {
                if (isGroupActive) {
                    this.breadcrumbsControl.update();
                    this.breadcrumbsControl.domNode.classList.toggle('preview', !isEditorPinned);
                }
                else {
                    this.breadcrumbsControl.hide();
                }
            }
            // Clear if there is no editor
            const [titleContainer, editorLabel] = (0, types_1.assertAllDefined)(this.titleContainer, this.editorLabel);
            if (!editor) {
                titleContainer.classList.remove('dirty');
                editorLabel.clear();
                this.clearEditorActionsToolbar();
            }
            // Otherwise render it
            else {
                // Dirty state
                this.updateEditorDirty(editor);
                // Editor Label
                const { labelFormat } = this.accessor.partOptions;
                let description;
                if (this.breadcrumbsControl && !this.breadcrumbsControl.isHidden()) {
                    description = ''; // hide description when showing breadcrumbs
                }
                else if (labelFormat === 'default' && !isGroupActive) {
                    description = ''; // hide description when group is not active and style is 'default'
                }
                else {
                    description = editor.getDescription(this.getVerbosity(labelFormat)) || '';
                }
                let title = editor.getTitle(2 /* Verbosity.LONG */);
                if (description === title) {
                    title = ''; // dont repeat what is already shown
                }
                editorLabel.setResource({
                    resource: editor_1.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_1.SideBySideEditor.BOTH }),
                    name: editor.getName(),
                    description
                }, {
                    title,
                    italic: !isEditorPinned,
                    extraClasses: ['no-tabs', 'title-label'].concat(editor.getLabelExtraClasses()),
                    fileDecorations: {
                        colors: Boolean((_a = options.decorations) === null || _a === void 0 ? void 0 : _a.colors),
                        badges: Boolean((_b = options.decorations) === null || _b === void 0 ? void 0 : _b.badges)
                    },
                });
                if (isGroupActive) {
                    titleContainer.style.color = this.getColor(theme_1.TAB_ACTIVE_FOREGROUND) || '';
                }
                else {
                    titleContainer.style.color = this.getColor(theme_1.TAB_UNFOCUSED_ACTIVE_FOREGROUND) || '';
                }
                // Update Editor Actions Toolbar
                this.updateEditorActionsToolbar();
            }
        }
        getVerbosity(style) {
            switch (style) {
                case 'short': return 0 /* Verbosity.SHORT */;
                case 'long': return 2 /* Verbosity.LONG */;
                default: return 1 /* Verbosity.MEDIUM */;
            }
        }
        prepareEditorActions(editorActions) {
            const isGroupActive = this.accessor.activeGroup === this.group;
            // Active: allow all actions
            if (isGroupActive) {
                return editorActions;
            }
            // Inactive: only show "Close, "Unlock" and secondary actions
            else {
                return {
                    primary: editorActions.primary.filter(action => action.id === editorCommands_1.CLOSE_EDITOR_COMMAND_ID || action.id === editorCommands_1.UNLOCK_GROUP_COMMAND_ID),
                    secondary: editorActions.secondary
                };
            }
        }
        getHeight() {
            return {
                total: NoTabsTitleControl.HEIGHT,
                offset: 0
            };
        }
        layout(dimensions) {
            var _a;
            (_a = this.breadcrumbsControl) === null || _a === void 0 ? void 0 : _a.layout(undefined);
            return new dom_1.Dimension(dimensions.container.width, this.getHeight().total);
        }
    }
    exports.NoTabsTitleControl = NoTabsTitleControl;
    NoTabsTitleControl.HEIGHT = 35;
});
//# sourceMappingURL=noTabsTitleControl.js.map