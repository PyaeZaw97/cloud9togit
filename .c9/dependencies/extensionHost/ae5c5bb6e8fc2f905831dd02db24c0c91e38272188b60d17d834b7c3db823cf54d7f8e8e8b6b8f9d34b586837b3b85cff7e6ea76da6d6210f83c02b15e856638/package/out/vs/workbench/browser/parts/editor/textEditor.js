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
define(["require", "exports", "vs/nls", "vs/base/common/objects", "vs/base/common/event", "vs/base/common/types", "vs/editor/browser/widget/codeEditorWidget", "vs/workbench/common/editor/editorOptions", "vs/workbench/browser/editor", "vs/workbench/browser/parts/editor/editorWithViewState", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/editor/common/services/textResourceConfiguration", "vs/editor/browser/editorBrowser", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/contextkey/common/contextkey", "vs/base/common/resources"], function (require, exports, nls_1, objects_1, event_1, types_1, codeEditorWidget_1, editorOptions_1, editor_1, editorWithViewState_1, storage_1, instantiation_1, telemetry_1, themeService_1, textResourceConfiguration_1, editorBrowser_1, editorGroupsService_1, editorService_1, contextkey_1, resources_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextEditorPaneSelection = exports.BaseTextEditor = void 0;
    /**
     * The base class of editors that leverage the text editor for the editing experience. This class is only intended to
     * be subclassed and not instantiated.
     */
    let BaseTextEditor = class BaseTextEditor extends editorWithViewState_1.AbstractEditorWithViewState {
        constructor(id, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService) {
            super(id, BaseTextEditor.VIEW_STATE_PREFERENCE_KEY, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService);
            this._onDidChangeSelection = this._register(new event_1.Emitter());
            this.onDidChangeSelection = this._onDidChangeSelection.event;
            this._register(this.textResourceConfigurationService.onDidChangeConfiguration(() => {
                const resource = this.getActiveResource();
                const value = resource ? this.textResourceConfigurationService.getValue(resource) : undefined;
                return this.handleConfigurationChangeEvent(value);
            }));
            // ARIA: if a group is added or removed, update the editor's ARIA
            // label so that it appears in the label for when there are > 1 groups
            this._register(event_1.Event.any(this.editorGroupService.onDidAddGroup, this.editorGroupService.onDidRemoveGroup)(() => {
                var _a, _b;
                const ariaLabel = this.computeAriaLabel();
                (_a = this.editorContainer) === null || _a === void 0 ? void 0 : _a.setAttribute('aria-label', ariaLabel);
                (_b = this.editorControl) === null || _b === void 0 ? void 0 : _b.updateOptions({ ariaLabel });
            }));
        }
        get scopedContextKeyService() {
            return (0, editorBrowser_1.isCodeEditor)(this.editorControl) ? this.editorControl.invokeWithinContext(accessor => accessor.get(contextkey_1.IContextKeyService)) : undefined;
        }
        handleConfigurationChangeEvent(configuration) {
            if (this.isVisible()) {
                this.updateEditorConfiguration(configuration);
            }
            else {
                this.hasPendingConfigurationChange = true;
            }
        }
        consumePendingConfigurationChangeEvent() {
            if (this.hasPendingConfigurationChange) {
                this.updateEditorConfiguration();
                this.hasPendingConfigurationChange = false;
            }
        }
        computeConfiguration(configuration) {
            // Specific editor options always overwrite user configuration
            const editorConfiguration = (0, types_1.isObject)(configuration.editor) ? (0, objects_1.deepClone)(configuration.editor) : Object.create(null);
            Object.assign(editorConfiguration, this.getConfigurationOverrides());
            // ARIA label
            editorConfiguration.ariaLabel = this.computeAriaLabel();
            return editorConfiguration;
        }
        computeAriaLabel() {
            return this._input ? (0, editor_1.computeEditorAriaLabel)(this._input, undefined, this.group, this.editorGroupService.count) : (0, nls_1.localize)('editor', "Editor");
        }
        getConfigurationOverrides() {
            var _a;
            return {
                overviewRulerLanes: 3,
                lineNumbersMinChars: 3,
                fixedOverflowWidgets: true,
                readOnly: (_a = this.input) === null || _a === void 0 ? void 0 : _a.hasCapability(2 /* EditorInputCapabilities.Readonly */),
                // render problems even in readonly editors
                // https://github.com/microsoft/vscode/issues/89057
                renderValidationDecorations: 'on'
            };
        }
        createEditor(parent) {
            // Create editor control
            this.editorContainer = parent;
            this.editorControl = this._register(this.createEditorControl(parent, this.computeConfiguration(this.textResourceConfigurationService.getValue(this.getActiveResource()))));
            // Listeners
            this.registerCodeEditorListeners();
        }
        registerCodeEditorListeners() {
            const codeEditor = (0, editorBrowser_1.getCodeEditor)(this.editorControl);
            if (codeEditor) {
                this._register(codeEditor.onDidChangeModelLanguage(() => this.updateEditorConfiguration()));
                this._register(codeEditor.onDidChangeModel(() => this.updateEditorConfiguration()));
                this._register(codeEditor.onDidChangeCursorPosition(e => this._onDidChangeSelection.fire({ reason: this.toEditorPaneSelectionChangeReason(e) })));
                this._register(codeEditor.onDidChangeModelContent(() => this._onDidChangeSelection.fire({ reason: 3 /* EditorPaneSelectionChangeReason.EDIT */ })));
            }
        }
        toEditorPaneSelectionChangeReason(e) {
            switch (e.source) {
                case "api" /* TextEditorSelectionSource.PROGRAMMATIC */: return 1 /* EditorPaneSelectionChangeReason.PROGRAMMATIC */;
                case "code.navigation" /* TextEditorSelectionSource.NAVIGATION */: return 4 /* EditorPaneSelectionChangeReason.NAVIGATION */;
                case "code.jump" /* TextEditorSelectionSource.JUMP */: return 5 /* EditorPaneSelectionChangeReason.JUMP */;
                default: return 2 /* EditorPaneSelectionChangeReason.USER */;
            }
        }
        getSelection() {
            const codeEditor = (0, editorBrowser_1.getCodeEditor)(this.editorControl);
            if (codeEditor) {
                const selection = codeEditor.getSelection();
                if (selection) {
                    return new TextEditorPaneSelection(selection);
                }
            }
            return undefined;
        }
        /**
         * This method creates and returns the text editor control to be used. Subclasses can override to
         * provide their own editor control that should be used (e.g. a DiffEditor).
         *
         * The passed in configuration object should be passed to the editor control when creating it.
         */
        createEditorControl(parent, configuration) {
            // Use a getter for the instantiation service since some subclasses might use scoped instantiation services
            return this.instantiationService.createInstance(codeEditorWidget_1.CodeEditorWidget, parent, Object.assign({ enableDropIntoEditor: true }, configuration), {});
        }
        async setInput(input, options, context, token) {
            await super.setInput(input, options, context, token);
            // Update editor options after having set the input. We do this because there can be
            // editor input specific options (e.g. an ARIA label depending on the input showing)
            this.updateEditorConfiguration();
            // Update aria label on editor
            const editorContainer = (0, types_1.assertIsDefined)(this.editorContainer);
            editorContainer.setAttribute('aria-label', this.computeAriaLabel());
        }
        setOptions(options) {
            super.setOptions(options);
            if (options) {
                (0, editorOptions_1.applyTextEditorOptions)(options, (0, types_1.assertIsDefined)(this.getControl()), 0 /* ScrollType.Smooth */);
            }
        }
        setEditorVisible(visible, group) {
            // Pass on to Editor
            const editorControl = (0, types_1.assertIsDefined)(this.editorControl);
            if (visible) {
                this.consumePendingConfigurationChangeEvent();
                editorControl.onVisible();
            }
            else {
                editorControl.onHide();
            }
            super.setEditorVisible(visible, group);
        }
        focus() {
            // Pass on to Editor
            const editorControl = (0, types_1.assertIsDefined)(this.editorControl);
            editorControl.focus();
        }
        hasFocus() {
            var _a;
            if ((_a = this.editorControl) === null || _a === void 0 ? void 0 : _a.hasTextFocus()) {
                return true;
            }
            return super.hasFocus();
        }
        layout(dimension) {
            // Pass on to Editor
            const editorControl = (0, types_1.assertIsDefined)(this.editorControl);
            editorControl.layout(dimension);
        }
        getControl() {
            return this.editorControl;
        }
        toEditorViewStateResource(input) {
            return input.resource;
        }
        computeEditorViewState(resource) {
            const control = this.getControl();
            if (!(0, editorBrowser_1.isCodeEditor)(control)) {
                return undefined;
            }
            const model = control.getModel();
            if (!model) {
                return undefined; // view state always needs a model
            }
            const modelUri = model.uri;
            if (!modelUri) {
                return undefined; // model URI is needed to make sure we save the view state correctly
            }
            if (!(0, resources_1.isEqual)(modelUri, resource)) {
                return undefined; // prevent saving view state for a model that is not the expected one
            }
            return (0, types_1.withNullAsUndefined)(control.saveViewState());
        }
        updateEditorConfiguration(configuration) {
            if (!configuration) {
                const resource = this.getActiveResource();
                if (resource) {
                    configuration = this.textResourceConfigurationService.getValue(resource);
                }
            }
            if (!this.editorControl || !configuration) {
                return;
            }
            const editorConfiguration = this.computeConfiguration(configuration);
            // Try to figure out the actual editor options that changed from the last time we updated the editor.
            // We do this so that we are not overwriting some dynamic editor settings (e.g. word wrap) that might
            // have been applied to the editor directly.
            let editorSettingsToApply = editorConfiguration;
            if (this.lastAppliedEditorOptions) {
                editorSettingsToApply = (0, objects_1.distinct)(this.lastAppliedEditorOptions, editorSettingsToApply);
            }
            if (Object.keys(editorSettingsToApply).length > 0) {
                this.lastAppliedEditorOptions = editorConfiguration;
                this.editorControl.updateOptions(editorSettingsToApply);
            }
        }
        getActiveResource() {
            const codeEditor = (0, editorBrowser_1.getCodeEditor)(this.editorControl);
            if (codeEditor) {
                const model = codeEditor.getModel();
                if (model) {
                    return model.uri;
                }
            }
            if (this.input) {
                return this.input.resource;
            }
            return undefined;
        }
        dispose() {
            this.lastAppliedEditorOptions = undefined;
            super.dispose();
        }
    };
    BaseTextEditor.VIEW_STATE_PREFERENCE_KEY = 'textEditorViewState';
    BaseTextEditor = __decorate([
        __param(1, telemetry_1.ITelemetryService),
        __param(2, instantiation_1.IInstantiationService),
        __param(3, storage_1.IStorageService),
        __param(4, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(5, themeService_1.IThemeService),
        __param(6, editorService_1.IEditorService),
        __param(7, editorGroupsService_1.IEditorGroupsService)
    ], BaseTextEditor);
    exports.BaseTextEditor = BaseTextEditor;
    class TextEditorPaneSelection {
        constructor(textSelection) {
            this.textSelection = textSelection;
        }
        compare(other) {
            if (!(other instanceof TextEditorPaneSelection)) {
                return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
            }
            const thisLineNumber = Math.min(this.textSelection.selectionStartLineNumber, this.textSelection.positionLineNumber);
            const otherLineNumber = Math.min(other.textSelection.selectionStartLineNumber, other.textSelection.positionLineNumber);
            if (thisLineNumber === otherLineNumber) {
                return 1 /* EditorPaneSelectionCompareResult.IDENTICAL */;
            }
            if (Math.abs(thisLineNumber - otherLineNumber) < TextEditorPaneSelection.TEXT_EDITOR_SELECTION_THRESHOLD) {
                return 2 /* EditorPaneSelectionCompareResult.SIMILAR */; // when in close proximity, treat selection as being similar
            }
            return 3 /* EditorPaneSelectionCompareResult.DIFFERENT */;
        }
        restore(options) {
            const textEditorOptions = Object.assign(Object.assign({}, options), { selection: this.textSelection, selectionRevealType: 1 /* TextEditorSelectionRevealType.CenterIfOutsideViewport */ });
            return textEditorOptions;
        }
        log() {
            return `line: ${this.textSelection.startLineNumber}-${this.textSelection.endLineNumber}, col:  ${this.textSelection.startColumn}-${this.textSelection.endColumn}`;
        }
    }
    exports.TextEditorPaneSelection = TextEditorPaneSelection;
    TextEditorPaneSelection.TEXT_EDITOR_SELECTION_THRESHOLD = 10; // number of lines to move in editor to justify for significant change
});
//# sourceMappingURL=textEditor.js.map