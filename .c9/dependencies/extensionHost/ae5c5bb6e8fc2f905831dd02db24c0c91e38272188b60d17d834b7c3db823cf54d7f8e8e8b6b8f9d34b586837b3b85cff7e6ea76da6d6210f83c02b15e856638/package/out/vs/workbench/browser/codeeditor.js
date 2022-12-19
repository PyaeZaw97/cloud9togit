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
define(["require", "exports", "vs/base/browser/ui/widget", "vs/editor/browser/editorBrowser", "vs/base/common/event", "vs/platform/keybinding/common/keybinding", "vs/platform/theme/common/themeService", "vs/base/browser/dom", "vs/platform/theme/common/styler", "vs/platform/theme/common/colorRegistry", "vs/platform/instantiation/common/instantiation", "vs/workbench/services/host/browser/host", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/nls", "vs/base/common/resources", "vs/platform/files/common/files", "vs/workbench/services/editor/common/editorService", "vs/editor/common/model/textModel"], function (require, exports, widget_1, editorBrowser_1, event_1, keybinding_1, themeService_1, dom_1, styler_1, colorRegistry_1, instantiation_1, host_1, workspace_1, lifecycle_1, nls_1, resources_1, files_1, editorService_1, textModel_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.OpenWorkspaceButtonContribution = exports.FloatingClickWidget = exports.RangeHighlightDecorations = void 0;
    let RangeHighlightDecorations = class RangeHighlightDecorations extends lifecycle_1.Disposable {
        constructor(editorService) {
            super();
            this.editorService = editorService;
            this._onHighlightRemoved = this._register(new event_1.Emitter());
            this.onHighlightRemoved = this._onHighlightRemoved.event;
            this.rangeHighlightDecorationId = null;
            this.editor = null;
            this.editorDisposables = this._register(new lifecycle_1.DisposableStore());
        }
        removeHighlightRange() {
            var _a;
            if (((_a = this.editor) === null || _a === void 0 ? void 0 : _a.getModel()) && this.rangeHighlightDecorationId) {
                this.editor.deltaDecorations([this.rangeHighlightDecorationId], []);
                this._onHighlightRemoved.fire();
            }
            this.rangeHighlightDecorationId = null;
        }
        highlightRange(range, editor) {
            editor = editor !== null && editor !== void 0 ? editor : this.getEditor(range);
            if ((0, editorBrowser_1.isCodeEditor)(editor)) {
                this.doHighlightRange(editor, range);
            }
            else if ((0, editorBrowser_1.isCompositeEditor)(editor) && (0, editorBrowser_1.isCodeEditor)(editor.activeCodeEditor)) {
                this.doHighlightRange(editor.activeCodeEditor, range);
            }
        }
        doHighlightRange(editor, selectionRange) {
            this.removeHighlightRange();
            editor.changeDecorations((changeAccessor) => {
                this.rangeHighlightDecorationId = changeAccessor.addDecoration(selectionRange.range, this.createRangeHighlightDecoration(selectionRange.isWholeLine));
            });
            this.setEditor(editor);
        }
        getEditor(resourceRange) {
            var _a;
            const resource = (_a = this.editorService.activeEditor) === null || _a === void 0 ? void 0 : _a.resource;
            if (resource && (0, resources_1.isEqual)(resource, resourceRange.resource) && (0, editorBrowser_1.isCodeEditor)(this.editorService.activeTextEditorControl)) {
                return this.editorService.activeTextEditorControl;
            }
            return undefined;
        }
        setEditor(editor) {
            if (this.editor !== editor) {
                this.editorDisposables.clear();
                this.editor = editor;
                this.editorDisposables.add(this.editor.onDidChangeCursorPosition((e) => {
                    if (e.reason === 0 /* CursorChangeReason.NotSet */
                        || e.reason === 3 /* CursorChangeReason.Explicit */
                        || e.reason === 5 /* CursorChangeReason.Undo */
                        || e.reason === 6 /* CursorChangeReason.Redo */) {
                        this.removeHighlightRange();
                    }
                }));
                this.editorDisposables.add(this.editor.onDidChangeModel(() => { this.removeHighlightRange(); }));
                this.editorDisposables.add(this.editor.onDidDispose(() => {
                    this.removeHighlightRange();
                    this.editor = null;
                }));
            }
        }
        createRangeHighlightDecoration(isWholeLine = true) {
            return (isWholeLine ? RangeHighlightDecorations._WHOLE_LINE_RANGE_HIGHLIGHT : RangeHighlightDecorations._RANGE_HIGHLIGHT);
        }
        dispose() {
            var _a;
            super.dispose();
            if ((_a = this.editor) === null || _a === void 0 ? void 0 : _a.getModel()) {
                this.removeHighlightRange();
                this.editor = null;
            }
        }
    };
    RangeHighlightDecorations._WHOLE_LINE_RANGE_HIGHLIGHT = textModel_1.ModelDecorationOptions.register({
        description: 'codeeditor-range-highlight-whole',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        className: 'rangeHighlight',
        isWholeLine: true
    });
    RangeHighlightDecorations._RANGE_HIGHLIGHT = textModel_1.ModelDecorationOptions.register({
        description: 'codeeditor-range-highlight',
        stickiness: 1 /* TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges */,
        className: 'rangeHighlight'
    });
    RangeHighlightDecorations = __decorate([
        __param(0, editorService_1.IEditorService)
    ], RangeHighlightDecorations);
    exports.RangeHighlightDecorations = RangeHighlightDecorations;
    let FloatingClickWidget = class FloatingClickWidget extends widget_1.Widget {
        constructor(editor, label, keyBindingAction, keybindingService, themeService) {
            super();
            this.editor = editor;
            this.label = label;
            this.themeService = themeService;
            this._onClick = this._register(new event_1.Emitter());
            this.onClick = this._onClick.event;
            this._domNode = (0, dom_1.$)('.floating-click-widget');
            this._domNode.style.padding = '10px';
            this._domNode.style.cursor = 'pointer';
            if (keyBindingAction) {
                const keybinding = keybindingService.lookupKeybinding(keyBindingAction);
                if (keybinding) {
                    this.label += ` (${keybinding.getLabel()})`;
                }
            }
        }
        getId() {
            return 'editor.overlayWidget.floatingClickWidget';
        }
        getDomNode() {
            return this._domNode;
        }
        getPosition() {
            return {
                preference: 1 /* OverlayWidgetPositionPreference.BOTTOM_RIGHT_CORNER */
            };
        }
        render() {
            (0, dom_1.clearNode)(this._domNode);
            this._register((0, styler_1.attachStylerCallback)(this.themeService, { buttonBackground: colorRegistry_1.buttonBackground, buttonForeground: colorRegistry_1.buttonForeground, editorBackground: colorRegistry_1.editorBackground, editorForeground: colorRegistry_1.editorForeground, contrastBorder: colorRegistry_1.contrastBorder }, colors => {
                const backgroundColor = colors.buttonBackground ? colors.buttonBackground : colors.editorBackground;
                if (backgroundColor) {
                    this._domNode.style.backgroundColor = backgroundColor.toString();
                }
                const foregroundColor = colors.buttonForeground ? colors.buttonForeground : colors.editorForeground;
                if (foregroundColor) {
                    this._domNode.style.color = foregroundColor.toString();
                }
                const borderColor = colors.contrastBorder ? colors.contrastBorder.toString() : '';
                this._domNode.style.borderWidth = borderColor ? '1px' : '';
                this._domNode.style.borderStyle = borderColor ? 'solid' : '';
                this._domNode.style.borderColor = borderColor;
            }));
            (0, dom_1.append)(this._domNode, (0, dom_1.$)('')).textContent = this.label;
            this.onclick(this._domNode, e => this._onClick.fire());
            this.editor.addOverlayWidget(this);
        }
        dispose() {
            this.editor.removeOverlayWidget(this);
            super.dispose();
        }
    };
    FloatingClickWidget = __decorate([
        __param(3, keybinding_1.IKeybindingService),
        __param(4, themeService_1.IThemeService)
    ], FloatingClickWidget);
    exports.FloatingClickWidget = FloatingClickWidget;
    let OpenWorkspaceButtonContribution = class OpenWorkspaceButtonContribution extends lifecycle_1.Disposable {
        constructor(editor, instantiationService, hostService, contextService, fileService) {
            super();
            this.editor = editor;
            this.instantiationService = instantiationService;
            this.hostService = hostService;
            this.contextService = contextService;
            this.fileService = fileService;
            this.update();
            this.registerListeners();
        }
        static get(editor) {
            return editor.getContribution(OpenWorkspaceButtonContribution.ID);
        }
        registerListeners() {
            this._register(this.editor.onDidChangeModel(e => this.update()));
        }
        update() {
            if (!this.shouldShowButton(this.editor)) {
                this.disposeOpenWorkspaceWidgetRenderer();
                return;
            }
            this.createOpenWorkspaceWidgetRenderer();
        }
        shouldShowButton(editor) {
            const model = editor.getModel();
            if (!model) {
                return false; // we need a model
            }
            if (!(0, workspace_1.hasWorkspaceFileExtension)(model.uri)) {
                return false; // we need a workspace file
            }
            if (!this.fileService.hasProvider(model.uri)) {
                return false; // needs to be backed by a file service
            }
            if ((0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace())) {
                return false; // unsupported in temporary workspaces
            }
            if (this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */) {
                const workspaceConfiguration = this.contextService.getWorkspace().configuration;
                if (workspaceConfiguration && (0, resources_1.isEqual)(workspaceConfiguration, model.uri)) {
                    return false; // already inside workspace
                }
            }
            if (editor.getOption(54 /* EditorOption.inDiffEditor */)) {
                // in diff editor
                return false;
            }
            return true;
        }
        createOpenWorkspaceWidgetRenderer() {
            if (!this.openWorkspaceButton) {
                this.openWorkspaceButton = this.instantiationService.createInstance(FloatingClickWidget, this.editor, (0, nls_1.localize)('openWorkspace', "Open Workspace"), null);
                this._register(this.openWorkspaceButton.onClick(() => {
                    const model = this.editor.getModel();
                    if (model) {
                        this.hostService.openWindow([{ workspaceUri: model.uri }]);
                    }
                }));
                this.openWorkspaceButton.render();
            }
        }
        disposeOpenWorkspaceWidgetRenderer() {
            (0, lifecycle_1.dispose)(this.openWorkspaceButton);
            this.openWorkspaceButton = undefined;
        }
        dispose() {
            this.disposeOpenWorkspaceWidgetRenderer();
            super.dispose();
        }
    };
    OpenWorkspaceButtonContribution.ID = 'editor.contrib.openWorkspaceButton';
    OpenWorkspaceButtonContribution = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, host_1.IHostService),
        __param(3, workspace_1.IWorkspaceContextService),
        __param(4, files_1.IFileService)
    ], OpenWorkspaceButtonContribution);
    exports.OpenWorkspaceButtonContribution = OpenWorkspaceButtonContribution;
});
//# sourceMappingURL=codeeditor.js.map