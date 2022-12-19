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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/platform/registry/common/platform", "vs/workbench/common/editor", "vs/workbench/common/editor/sideBySideEditorInput", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/instantiation", "vs/platform/theme/common/themeService", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/browser/ui/splitview/splitview", "vs/base/common/event", "vs/platform/storage/common/storage", "vs/base/common/types", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/editor/editor", "vs/base/common/lifecycle", "vs/workbench/common/theme", "vs/workbench/browser/parts/editor/editorWithViewState", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/editorService", "vs/base/common/resources", "vs/base/common/uri", "vs/css!./media/sidebysideeditor"], function (require, exports, nls_1, dom_1, platform_1, editor_1, sideBySideEditorInput_1, telemetry_1, instantiation_1, themeService_1, editorGroupsService_1, splitview_1, event_1, storage_1, types_1, configuration_1, editor_2, lifecycle_1, theme_1, editorWithViewState_1, textResourceConfiguration_1, editorService_1, resources_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SideBySideEditor = void 0;
    function isSideBySideEditorViewState(thing) {
        const candidate = thing;
        return typeof (candidate === null || candidate === void 0 ? void 0 : candidate.primary) === 'object' && typeof candidate.secondary === 'object';
    }
    let SideBySideEditor = class SideBySideEditor extends editorWithViewState_1.AbstractEditorWithViewState {
        constructor(telemetryService, instantiationService, themeService, storageService, configurationService, textResourceConfigurationService, editorService, editorGroupService) {
            super(SideBySideEditor.ID, SideBySideEditor.VIEW_STATE_PREFERENCE_KEY, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService);
            this.configurationService = configurationService;
            //#endregion
            //#region Events
            this.onDidCreateEditors = this._register(new event_1.Emitter());
            this._onDidChangeSizeConstraints = this._register(new event_1.Relay());
            this.onDidChangeSizeConstraints = event_1.Event.any(this.onDidCreateEditors.event, this._onDidChangeSizeConstraints.event);
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            //#endregion
            this.primaryEditorPane = undefined;
            this.secondaryEditorPane = undefined;
            this.splitviewDisposables = this._register(new lifecycle_1.DisposableStore());
            this.editorDisposables = this._register(new lifecycle_1.DisposableStore());
            this.orientation = this.configurationService.getValue(SideBySideEditor.SIDE_BY_SIDE_LAYOUT_SETTING) === 'vertical' ? 0 /* Orientation.VERTICAL */ : 1 /* Orientation.HORIZONTAL */;
            this.dimension = new dom_1.Dimension(0, 0);
            this.lastFocusedSide = undefined;
            this.registerListeners();
        }
        //#region Layout Constraints
        get minimumPrimaryWidth() { return this.primaryEditorPane ? this.primaryEditorPane.minimumWidth : 0; }
        get maximumPrimaryWidth() { return this.primaryEditorPane ? this.primaryEditorPane.maximumWidth : Number.POSITIVE_INFINITY; }
        get minimumPrimaryHeight() { return this.primaryEditorPane ? this.primaryEditorPane.minimumHeight : 0; }
        get maximumPrimaryHeight() { return this.primaryEditorPane ? this.primaryEditorPane.maximumHeight : Number.POSITIVE_INFINITY; }
        get minimumSecondaryWidth() { return this.secondaryEditorPane ? this.secondaryEditorPane.minimumWidth : 0; }
        get maximumSecondaryWidth() { return this.secondaryEditorPane ? this.secondaryEditorPane.maximumWidth : Number.POSITIVE_INFINITY; }
        get minimumSecondaryHeight() { return this.secondaryEditorPane ? this.secondaryEditorPane.minimumHeight : 0; }
        get maximumSecondaryHeight() { return this.secondaryEditorPane ? this.secondaryEditorPane.maximumHeight : Number.POSITIVE_INFINITY; }
        set minimumWidth(value) { }
        set maximumWidth(value) { }
        set minimumHeight(value) { }
        set maximumHeight(value) { }
        get minimumWidth() { return this.minimumPrimaryWidth + this.minimumSecondaryWidth; }
        get maximumWidth() { return this.maximumPrimaryWidth + this.maximumSecondaryWidth; }
        get minimumHeight() { return this.minimumPrimaryHeight + this.minimumSecondaryHeight; }
        get maximumHeight() { return this.maximumPrimaryHeight + this.maximumSecondaryHeight; }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(e)));
        }
        onConfigurationUpdated(event) {
            if (event.affectsConfiguration(SideBySideEditor.SIDE_BY_SIDE_LAYOUT_SETTING)) {
                this.orientation = this.configurationService.getValue(SideBySideEditor.SIDE_BY_SIDE_LAYOUT_SETTING) === 'vertical' ? 0 /* Orientation.VERTICAL */ : 1 /* Orientation.HORIZONTAL */;
                // If config updated from event, re-create the split
                // editor using the new layout orientation if it was
                // already created.
                if (this.splitview) {
                    this.recreateSplitview();
                }
            }
        }
        recreateSplitview() {
            const container = (0, types_1.assertIsDefined)(this.getContainer());
            // Clear old (if any) but remember ratio
            const ratio = this.getSplitViewRatio();
            if (this.splitview) {
                container.removeChild(this.splitview.el);
                this.splitviewDisposables.clear();
            }
            // Create new
            this.createSplitView(container, ratio);
            this.layout(this.dimension);
        }
        getSplitViewRatio() {
            let ratio = undefined;
            if (this.splitview) {
                const leftViewSize = this.splitview.getViewSize(0);
                const rightViewSize = this.splitview.getViewSize(1);
                // Only return a ratio when the view size is significantly
                // enough different for left and right view sizes
                if (Math.abs(leftViewSize - rightViewSize) > 1) {
                    const totalSize = this.splitview.orientation === 1 /* Orientation.HORIZONTAL */ ? this.dimension.width : this.dimension.height;
                    ratio = leftViewSize / totalSize;
                }
            }
            return ratio;
        }
        createEditor(parent) {
            parent.classList.add('side-by-side-editor');
            // Editor pane containers
            this.secondaryEditorContainer = (0, dom_1.$)('.side-by-side-editor-container.editor-instance');
            this.primaryEditorContainer = (0, dom_1.$)('.side-by-side-editor-container.editor-instance');
            // Split view
            this.createSplitView(parent);
        }
        createSplitView(parent, ratio) {
            // Splitview widget
            this.splitview = this.splitviewDisposables.add(new splitview_1.SplitView(parent, { orientation: this.orientation }));
            this.splitviewDisposables.add(this.splitview.onDidSashReset(() => { var _a; return (_a = this.splitview) === null || _a === void 0 ? void 0 : _a.distributeViewSizes(); }));
            // Figure out sizing
            let leftSizing = splitview_1.Sizing.Distribute;
            let rightSizing = splitview_1.Sizing.Distribute;
            if (ratio) {
                const totalSize = this.splitview.orientation === 1 /* Orientation.HORIZONTAL */ ? this.dimension.width : this.dimension.height;
                leftSizing = Math.round(totalSize * ratio);
                rightSizing = totalSize - leftSizing;
                // We need to call `layout` for the `ratio` to have any effect
                this.splitview.layout(this.orientation === 1 /* Orientation.HORIZONTAL */ ? this.dimension.width : this.dimension.height);
            }
            // Secondary (left)
            const secondaryEditorContainer = (0, types_1.assertIsDefined)(this.secondaryEditorContainer);
            this.splitview.addView({
                element: secondaryEditorContainer,
                layout: size => this.layoutPane(this.secondaryEditorPane, size),
                minimumSize: this.orientation === 1 /* Orientation.HORIZONTAL */ ? editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width : editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height,
                maximumSize: Number.POSITIVE_INFINITY,
                onDidChange: event_1.Event.None
            }, leftSizing);
            // Primary (right)
            const primaryEditorContainer = (0, types_1.assertIsDefined)(this.primaryEditorContainer);
            this.splitview.addView({
                element: primaryEditorContainer,
                layout: size => this.layoutPane(this.primaryEditorPane, size),
                minimumSize: this.orientation === 1 /* Orientation.HORIZONTAL */ ? editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width : editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height,
                maximumSize: Number.POSITIVE_INFINITY,
                onDidChange: event_1.Event.None
            }, rightSizing);
            this.updateStyles();
        }
        getTitle() {
            if (this.input) {
                return this.input.getName();
            }
            return (0, nls_1.localize)('sideBySideEditor', "Side by Side Editor");
        }
        async setInput(input, options, context, token) {
            var _a, _b, _c;
            const oldInput = this.input;
            await super.setInput(input, options, context, token);
            // Create new side by side editors if either we have not
            // been created before or the input no longer matches.
            if (!oldInput || !input.matches(oldInput)) {
                if (oldInput) {
                    this.disposeEditors();
                }
                this.createEditors(input);
            }
            // Restore any previous view state
            const { primary, secondary, viewState } = this.loadViewState(input, options, context);
            this.lastFocusedSide = viewState === null || viewState === void 0 ? void 0 : viewState.focus;
            if (typeof (viewState === null || viewState === void 0 ? void 0 : viewState.ratio) === 'number' && this.splitview) {
                const totalSize = this.splitview.orientation === 1 /* Orientation.HORIZONTAL */ ? this.dimension.width : this.dimension.height;
                this.splitview.resizeView(0, Math.round(totalSize * viewState.ratio));
            }
            else {
                (_a = this.splitview) === null || _a === void 0 ? void 0 : _a.distributeViewSizes();
            }
            // Set input to both sides
            await Promise.all([
                (_b = this.secondaryEditorPane) === null || _b === void 0 ? void 0 : _b.setInput(input.secondary, secondary, context, token),
                (_c = this.primaryEditorPane) === null || _c === void 0 ? void 0 : _c.setInput(input.primary, primary, context, token)
            ]);
            // Update focus if target is provided
            if (typeof (options === null || options === void 0 ? void 0 : options.target) === 'number') {
                this.lastFocusedSide = options.target;
            }
        }
        loadViewState(input, options, context) {
            const viewState = isSideBySideEditorViewState(options === null || options === void 0 ? void 0 : options.viewState) ? options === null || options === void 0 ? void 0 : options.viewState : this.loadEditorViewState(input, context);
            let primaryOptions = Object.create(null);
            let secondaryOptions = undefined;
            // Depending on the optional `target` property, we apply
            // the provided options to either the primary or secondary
            // side
            if ((options === null || options === void 0 ? void 0 : options.target) === editor_1.SideBySideEditor.SECONDARY) {
                secondaryOptions = Object.assign({}, options);
            }
            else {
                primaryOptions = Object.assign({}, options);
            }
            primaryOptions.viewState = viewState === null || viewState === void 0 ? void 0 : viewState.primary;
            if (viewState === null || viewState === void 0 ? void 0 : viewState.secondary) {
                if (!secondaryOptions) {
                    secondaryOptions = { viewState: viewState.secondary };
                }
                else {
                    secondaryOptions.viewState = viewState === null || viewState === void 0 ? void 0 : viewState.secondary;
                }
            }
            return { primary: primaryOptions, secondary: secondaryOptions, viewState };
        }
        createEditors(newInput) {
            // Create editors
            this.secondaryEditorPane = this.doCreateEditor(newInput.secondary, (0, types_1.assertIsDefined)(this.secondaryEditorContainer));
            this.primaryEditorPane = this.doCreateEditor(newInput.primary, (0, types_1.assertIsDefined)(this.primaryEditorContainer));
            // Layout
            this.layout(this.dimension);
            // Eventing
            this._onDidChangeSizeConstraints.input = event_1.Event.any(event_1.Event.map(this.secondaryEditorPane.onDidChangeSizeConstraints, () => undefined), event_1.Event.map(this.primaryEditorPane.onDidChangeSizeConstraints, () => undefined));
            this.onDidCreateEditors.fire(undefined);
            // Track focus and signal active control change via event
            this.editorDisposables.add(this.primaryEditorPane.onDidFocus(() => this.onDidFocusChange(editor_1.SideBySideEditor.PRIMARY)));
            this.editorDisposables.add(this.secondaryEditorPane.onDidFocus(() => this.onDidFocusChange(editor_1.SideBySideEditor.SECONDARY)));
        }
        doCreateEditor(editorInput, container) {
            const editorPaneDescriptor = platform_1.Registry.as(editor_1.EditorExtensions.EditorPane).getEditorPane(editorInput);
            if (!editorPaneDescriptor) {
                throw new Error('No editor pane descriptor for editor found');
            }
            // Create editor pane and make visible
            const editorPane = editorPaneDescriptor.instantiate(this.instantiationService);
            editorPane.create(container);
            editorPane.setVisible(this.isVisible(), this.group);
            // Track selections if supported
            if ((0, editor_1.isEditorPaneWithSelection)(editorPane)) {
                this.editorDisposables.add(editorPane.onDidChangeSelection(e => this._onDidChangeSelection.fire(e)));
            }
            // Track for disposal
            this.editorDisposables.add(editorPane);
            return editorPane;
        }
        onDidFocusChange(side) {
            this.lastFocusedSide = side;
            // Signal to outside that our active control changed
            this._onDidChangeControl.fire();
        }
        getSelection() {
            const lastFocusedEditorPane = this.getLastFocusedEditorPane();
            if ((0, editor_1.isEditorPaneWithSelection)(lastFocusedEditorPane)) {
                const selection = lastFocusedEditorPane.getSelection();
                if (selection) {
                    return new SideBySideAwareEditorPaneSelection(selection, lastFocusedEditorPane === this.primaryEditorPane ? editor_1.SideBySideEditor.PRIMARY : editor_1.SideBySideEditor.SECONDARY);
                }
            }
            return undefined;
        }
        setOptions(options) {
            var _a;
            super.setOptions(options);
            // Update focus if target is provided
            if (typeof (options === null || options === void 0 ? void 0 : options.target) === 'number') {
                this.lastFocusedSide = options.target;
            }
            // Apply to focused side
            (_a = this.getLastFocusedEditorPane()) === null || _a === void 0 ? void 0 : _a.setOptions(options);
        }
        setEditorVisible(visible, group) {
            var _a, _b;
            // Forward to both sides
            (_a = this.primaryEditorPane) === null || _a === void 0 ? void 0 : _a.setVisible(visible, group);
            (_b = this.secondaryEditorPane) === null || _b === void 0 ? void 0 : _b.setVisible(visible, group);
            super.setEditorVisible(visible, group);
        }
        clearInput() {
            var _a, _b;
            super.clearInput();
            // Forward to both sides
            (_a = this.primaryEditorPane) === null || _a === void 0 ? void 0 : _a.clearInput();
            (_b = this.secondaryEditorPane) === null || _b === void 0 ? void 0 : _b.clearInput();
            // Since we do not keep side editors alive
            // we dispose any editor created for recreation
            this.disposeEditors();
        }
        focus() {
            var _a;
            (_a = this.getLastFocusedEditorPane()) === null || _a === void 0 ? void 0 : _a.focus();
        }
        getLastFocusedEditorPane() {
            if (this.lastFocusedSide === editor_1.SideBySideEditor.SECONDARY) {
                return this.secondaryEditorPane;
            }
            return this.primaryEditorPane;
        }
        layout(dimension) {
            this.dimension = dimension;
            const splitview = (0, types_1.assertIsDefined)(this.splitview);
            splitview.layout(this.orientation === 1 /* Orientation.HORIZONTAL */ ? dimension.width : dimension.height);
        }
        layoutPane(pane, size) {
            pane === null || pane === void 0 ? void 0 : pane.layout(this.orientation === 1 /* Orientation.HORIZONTAL */ ? new dom_1.Dimension(size, this.dimension.height) : new dom_1.Dimension(this.dimension.width, size));
        }
        getControl() {
            var _a;
            return (_a = this.getLastFocusedEditorPane()) === null || _a === void 0 ? void 0 : _a.getControl();
        }
        getPrimaryEditorPane() {
            return this.primaryEditorPane;
        }
        getSecondaryEditorPane() {
            return this.secondaryEditorPane;
        }
        tracksEditorViewState(input) {
            return input instanceof sideBySideEditorInput_1.SideBySideEditorInput;
        }
        computeEditorViewState(resource) {
            var _a, _b;
            if (!this.input || !(0, resources_1.isEqual)(resource, this.toEditorViewStateResource(this.input))) {
                return; // unexpected state
            }
            const primarViewState = (_a = this.primaryEditorPane) === null || _a === void 0 ? void 0 : _a.getViewState();
            const secondaryViewState = (_b = this.secondaryEditorPane) === null || _b === void 0 ? void 0 : _b.getViewState();
            if (!primarViewState || !secondaryViewState) {
                return; // we actually need view states
            }
            return {
                primary: primarViewState,
                secondary: secondaryViewState,
                focus: this.lastFocusedSide,
                ratio: this.getSplitViewRatio()
            };
        }
        toEditorViewStateResource(input) {
            let primary;
            let secondary;
            if (input instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                primary = input.primary.resource;
                secondary = input.secondary.resource;
            }
            if (!secondary || !primary) {
                return undefined;
            }
            // create a URI that is the Base64 concatenation of original + modified resource
            return uri_1.URI.from({ scheme: 'sideBySide', path: `${(0, dom_1.multibyteAwareBtoa)(secondary.toString())}${(0, dom_1.multibyteAwareBtoa)(primary.toString())}` });
        }
        updateStyles() {
            var _a, _b, _c, _d;
            super.updateStyles();
            if (this.primaryEditorContainer) {
                if (this.orientation === 1 /* Orientation.HORIZONTAL */) {
                    this.primaryEditorContainer.style.borderLeftWidth = '1px';
                    this.primaryEditorContainer.style.borderLeftStyle = 'solid';
                    this.primaryEditorContainer.style.borderLeftColor = (_b = (_a = this.getColor(theme_1.SIDE_BY_SIDE_EDITOR_VERTICAL_BORDER)) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : '';
                    this.primaryEditorContainer.style.borderTopWidth = '0';
                }
                else {
                    this.primaryEditorContainer.style.borderTopWidth = '1px';
                    this.primaryEditorContainer.style.borderTopStyle = 'solid';
                    this.primaryEditorContainer.style.borderTopColor = (_d = (_c = this.getColor(theme_1.SIDE_BY_SIDE_EDITOR_HORIZONTAL_BORDER)) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : '';
                    this.primaryEditorContainer.style.borderLeftWidth = '0';
                }
            }
        }
        dispose() {
            this.disposeEditors();
            super.dispose();
        }
        disposeEditors() {
            this.editorDisposables.clear();
            this.secondaryEditorPane = undefined;
            this.primaryEditorPane = undefined;
            this.lastFocusedSide = undefined;
            if (this.secondaryEditorContainer) {
                (0, dom_1.clearNode)(this.secondaryEditorContainer);
            }
            if (this.primaryEditorContainer) {
                (0, dom_1.clearNode)(this.primaryEditorContainer);
            }
        }
    };
    SideBySideEditor.ID = editor_1.SIDE_BY_SIDE_EDITOR_ID;
    SideBySideEditor.SIDE_BY_SIDE_LAYOUT_SETTING = 'workbench.editor.splitInGroupLayout';
    SideBySideEditor.VIEW_STATE_PREFERENCE_KEY = 'sideBySideEditorViewState';
    SideBySideEditor = __decorate([
        __param(0, telemetry_1.ITelemetryService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, themeService_1.IThemeService),
        __param(3, storage_1.IStorageService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorGroupsService_1.IEditorGroupsService)
    ], SideBySideEditor);
    exports.SideBySideEditor = SideBySideEditor;
    class SideBySideAwareEditorPaneSelection {
        constructor(selection, side) {
            this.selection = selection;
            this.side = side;
        }
        compare(other) {
            if (!(other instanceof SideBySideAwareEditorPaneSelection)) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            if (this.side !== other.side) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            return this.selection.compare(other.selection);
        }
        restore(options) {
            const sideBySideEditorOptions = Object.assign(Object.assign({}, options), { target: this.side });
            return this.selection.restore(sideBySideEditorOptions);
        }
    }
});
//# sourceMappingURL=sideBySideEditor.js.map