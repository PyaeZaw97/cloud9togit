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
define(["require", "exports", "vs/base/common/keyCodes", "vs/base/common/lifecycle", "vs/editor/browser/editorExtensions", "vs/editor/common/core/range", "vs/editor/common/editorContextKeys", "vs/editor/common/languages/language", "vs/editor/contrib/gotoSymbol/browser/link/goToDefinitionAtPosition", "vs/editor/contrib/hover/browser/contentHover", "vs/editor/contrib/hover/browser/marginHover", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/instantiation", "vs/platform/opener/common/opener", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/themeService", "vs/editor/contrib/hover/browser/hoverTypes", "vs/editor/contrib/hover/browser/markdownHoverParticipant", "vs/editor/contrib/hover/browser/markerHoverParticipant"], function (require, exports, keyCodes_1, lifecycle_1, editorExtensions_1, range_1, editorContextKeys_1, language_1, goToDefinitionAtPosition_1, contentHover_1, marginHover_1, nls, contextkey_1, instantiation_1, opener_1, colorRegistry_1, themeService_1, hoverTypes_1, markdownHoverParticipant_1, markerHoverParticipant_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ModesHoverController = void 0;
    let ModesHoverController = class ModesHoverController {
        constructor(_editor, _instantiationService, _openerService, _languageService, _contextKeyService) {
            this._editor = _editor;
            this._instantiationService = _instantiationService;
            this._openerService = _openerService;
            this._languageService = _languageService;
            this._toUnhook = new lifecycle_1.DisposableStore();
            this._isMouseDown = false;
            this._hoverClicked = false;
            this._contentWidget = null;
            this._glyphWidget = null;
            this._hookEvents();
            this._didChangeConfigurationHandler = this._editor.onDidChangeConfiguration((e) => {
                if (e.hasChanged(53 /* EditorOption.hover */)) {
                    this._unhookEvents();
                    this._hookEvents();
                }
            });
        }
        static get(editor) {
            return editor.getContribution(ModesHoverController.ID);
        }
        _hookEvents() {
            const hideWidgetsEventHandler = () => this._hideWidgets();
            const hoverOpts = this._editor.getOption(53 /* EditorOption.hover */);
            this._isHoverEnabled = hoverOpts.enabled;
            this._isHoverSticky = hoverOpts.sticky;
            if (this._isHoverEnabled) {
                this._toUnhook.add(this._editor.onMouseDown((e) => this._onEditorMouseDown(e)));
                this._toUnhook.add(this._editor.onMouseUp((e) => this._onEditorMouseUp(e)));
                this._toUnhook.add(this._editor.onMouseMove((e) => this._onEditorMouseMove(e)));
                this._toUnhook.add(this._editor.onKeyDown((e) => this._onKeyDown(e)));
            }
            else {
                this._toUnhook.add(this._editor.onMouseMove((e) => this._onEditorMouseMove(e)));
                this._toUnhook.add(this._editor.onKeyDown((e) => this._onKeyDown(e)));
            }
            this._toUnhook.add(this._editor.onMouseLeave((e) => this._onEditorMouseLeave(e)));
            this._toUnhook.add(this._editor.onDidChangeModel(hideWidgetsEventHandler));
            this._toUnhook.add(this._editor.onDidScrollChange((e) => this._onEditorScrollChanged(e)));
        }
        _unhookEvents() {
            this._toUnhook.clear();
        }
        _onEditorScrollChanged(e) {
            if (e.scrollTopChanged || e.scrollLeftChanged) {
                this._hideWidgets();
            }
        }
        _onEditorMouseDown(mouseEvent) {
            this._isMouseDown = true;
            const target = mouseEvent.target;
            if (target.type === 9 /* MouseTargetType.CONTENT_WIDGET */ && target.detail === contentHover_1.ContentHoverWidget.ID) {
                this._hoverClicked = true;
                // mouse down on top of content hover widget
                return;
            }
            if (target.type === 12 /* MouseTargetType.OVERLAY_WIDGET */ && target.detail === marginHover_1.MarginHoverWidget.ID) {
                // mouse down on top of overlay hover widget
                return;
            }
            if (target.type !== 12 /* MouseTargetType.OVERLAY_WIDGET */) {
                this._hoverClicked = false;
            }
            this._hideWidgets();
        }
        _onEditorMouseUp(mouseEvent) {
            this._isMouseDown = false;
        }
        _onEditorMouseLeave(mouseEvent) {
            var _a;
            const targetEm = (mouseEvent.event.browserEvent.relatedTarget);
            if ((_a = this._contentWidget) === null || _a === void 0 ? void 0 : _a.containsNode(targetEm)) {
                // when the mouse is inside hover widget
                return;
            }
            this._hideWidgets();
        }
        _onEditorMouseMove(mouseEvent) {
            var _a, _b, _c, _d, _e;
            const target = mouseEvent.target;
            if (this._isMouseDown && this._hoverClicked) {
                return;
            }
            if (this._isHoverSticky && target.type === 9 /* MouseTargetType.CONTENT_WIDGET */ && target.detail === contentHover_1.ContentHoverWidget.ID) {
                // mouse moved on top of content hover widget
                return;
            }
            if (this._isHoverSticky && !((_b = (_a = mouseEvent.event.browserEvent.view) === null || _a === void 0 ? void 0 : _a.getSelection()) === null || _b === void 0 ? void 0 : _b.isCollapsed)) {
                // selected text within content hover widget
                return;
            }
            if (!this._isHoverSticky && target.type === 9 /* MouseTargetType.CONTENT_WIDGET */ && target.detail === contentHover_1.ContentHoverWidget.ID
                && ((_c = this._contentWidget) === null || _c === void 0 ? void 0 : _c.isColorPickerVisible())) {
                // though the hover is not sticky, the color picker needs to.
                return;
            }
            if (this._isHoverSticky && target.type === 12 /* MouseTargetType.OVERLAY_WIDGET */ && target.detail === marginHover_1.MarginHoverWidget.ID) {
                // mouse moved on top of overlay hover widget
                return;
            }
            if (!this._isHoverEnabled) {
                this._hideWidgets();
                return;
            }
            const contentWidget = this._getOrCreateContentWidget();
            if (contentWidget.maybeShowAt(mouseEvent)) {
                (_d = this._glyphWidget) === null || _d === void 0 ? void 0 : _d.hide();
                return;
            }
            if (target.type === 2 /* MouseTargetType.GUTTER_GLYPH_MARGIN */ && target.position) {
                (_e = this._contentWidget) === null || _e === void 0 ? void 0 : _e.hide();
                if (!this._glyphWidget) {
                    this._glyphWidget = new marginHover_1.MarginHoverWidget(this._editor, this._languageService, this._openerService);
                }
                this._glyphWidget.startShowingAt(target.position.lineNumber);
                return;
            }
            this._hideWidgets();
        }
        _onKeyDown(e) {
            if (e.keyCode !== 5 /* KeyCode.Ctrl */ && e.keyCode !== 6 /* KeyCode.Alt */ && e.keyCode !== 57 /* KeyCode.Meta */ && e.keyCode !== 4 /* KeyCode.Shift */) {
                // Do not hide hover when a modifier key is pressed
                this._hideWidgets();
            }
        }
        _hideWidgets() {
            var _a, _b, _c;
            if ((this._isMouseDown && this._hoverClicked && ((_a = this._contentWidget) === null || _a === void 0 ? void 0 : _a.isColorPickerVisible()))) {
                return;
            }
            this._hoverClicked = false;
            (_b = this._glyphWidget) === null || _b === void 0 ? void 0 : _b.hide();
            (_c = this._contentWidget) === null || _c === void 0 ? void 0 : _c.hide();
        }
        _getOrCreateContentWidget() {
            if (!this._contentWidget) {
                this._contentWidget = this._instantiationService.createInstance(contentHover_1.ContentHoverController, this._editor);
            }
            return this._contentWidget;
        }
        isColorPickerVisible() {
            var _a;
            return ((_a = this._contentWidget) === null || _a === void 0 ? void 0 : _a.isColorPickerVisible()) || false;
        }
        showContentHover(range, mode, focus) {
            this._getOrCreateContentWidget().startShowingAtRange(range, mode, focus);
        }
        dispose() {
            var _a, _b;
            this._unhookEvents();
            this._toUnhook.dispose();
            this._didChangeConfigurationHandler.dispose();
            (_a = this._glyphWidget) === null || _a === void 0 ? void 0 : _a.dispose();
            (_b = this._contentWidget) === null || _b === void 0 ? void 0 : _b.dispose();
        }
    };
    ModesHoverController.ID = 'editor.contrib.hover';
    ModesHoverController = __decorate([
        __param(1, instantiation_1.IInstantiationService),
        __param(2, opener_1.IOpenerService),
        __param(3, language_1.ILanguageService),
        __param(4, contextkey_1.IContextKeyService)
    ], ModesHoverController);
    exports.ModesHoverController = ModesHoverController;
    class ShowHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.showHover',
                label: nls.localize({
                    key: 'showHover',
                    comment: [
                        'Label for action that will trigger the showing of a hover in the editor.',
                        'This allows for users to show the hover without using the mouse.'
                    ]
                }, "Show Hover"),
                alias: 'Show Hover',
                precondition: undefined,
                kbOpts: {
                    kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus,
                    primary: (0, keyCodes_1.KeyChord)(2048 /* KeyMod.CtrlCmd */ | 41 /* KeyCode.KeyK */, 2048 /* KeyMod.CtrlCmd */ | 39 /* KeyCode.KeyI */),
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        run(accessor, editor) {
            if (!editor.hasModel()) {
                return;
            }
            let controller = ModesHoverController.get(editor);
            if (!controller) {
                return;
            }
            const position = editor.getPosition();
            const range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
            const focus = editor.getOption(2 /* EditorOption.accessibilitySupport */) === 2 /* AccessibilitySupport.Enabled */;
            controller.showContentHover(range, 1 /* HoverStartMode.Immediate */, focus);
        }
    }
    class ShowDefinitionPreviewHoverAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.showDefinitionPreviewHover',
                label: nls.localize({
                    key: 'showDefinitionPreviewHover',
                    comment: [
                        'Label for action that will trigger the showing of definition preview hover in the editor.',
                        'This allows for users to show the definition preview hover without using the mouse.'
                    ]
                }, "Show Definition Preview Hover"),
                alias: 'Show Definition Preview Hover',
                precondition: undefined
            });
        }
        run(accessor, editor) {
            const controller = ModesHoverController.get(editor);
            if (!controller) {
                return;
            }
            const position = editor.getPosition();
            if (!position) {
                return;
            }
            const range = new range_1.Range(position.lineNumber, position.column, position.lineNumber, position.column);
            const goto = goToDefinitionAtPosition_1.GotoDefinitionAtPositionEditorContribution.get(editor);
            if (!goto) {
                return;
            }
            const promise = goto.startFindDefinitionFromCursor(position);
            promise.then(() => {
                controller.showContentHover(range, 1 /* HoverStartMode.Immediate */, true);
            });
        }
    }
    (0, editorExtensions_1.registerEditorContribution)(ModesHoverController.ID, ModesHoverController);
    (0, editorExtensions_1.registerEditorAction)(ShowHoverAction);
    (0, editorExtensions_1.registerEditorAction)(ShowDefinitionPreviewHoverAction);
    hoverTypes_1.HoverParticipantRegistry.register(markdownHoverParticipant_1.MarkdownHoverParticipant);
    hoverTypes_1.HoverParticipantRegistry.register(markerHoverParticipant_1.MarkerHoverParticipant);
    // theming
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const editorHoverHighlightColor = theme.getColor(colorRegistry_1.editorHoverHighlight);
        if (editorHoverHighlightColor) {
            collector.addRule(`.monaco-editor .hoverHighlight { background-color: ${editorHoverHighlightColor}; }`);
        }
        const hoverBackground = theme.getColor(colorRegistry_1.editorHoverBackground);
        if (hoverBackground) {
            collector.addRule(`.monaco-editor .monaco-hover { background-color: ${hoverBackground}; }`);
        }
        const hoverBorder = theme.getColor(colorRegistry_1.editorHoverBorder);
        if (hoverBorder) {
            collector.addRule(`.monaco-editor .monaco-hover { border: 1px solid ${hoverBorder}; }`);
            collector.addRule(`.monaco-editor .monaco-hover .hover-row:not(:first-child):not(:empty) { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-editor .monaco-hover hr { border-top: 1px solid ${hoverBorder.transparent(0.5)}; }`);
            collector.addRule(`.monaco-editor .monaco-hover hr { border-bottom: 0px solid ${hoverBorder.transparent(0.5)}; }`);
        }
        const link = theme.getColor(colorRegistry_1.textLinkForeground);
        if (link) {
            collector.addRule(`.monaco-editor .monaco-hover a { color: ${link}; }`);
        }
        const linkHover = theme.getColor(colorRegistry_1.textLinkActiveForeground);
        if (linkHover) {
            collector.addRule(`.monaco-editor .monaco-hover a:hover { color: ${linkHover}; }`);
        }
        const hoverForeground = theme.getColor(colorRegistry_1.editorHoverForeground);
        if (hoverForeground) {
            collector.addRule(`.monaco-editor .monaco-hover { color: ${hoverForeground}; }`);
        }
        const actionsBackground = theme.getColor(colorRegistry_1.editorHoverStatusBarBackground);
        if (actionsBackground) {
            collector.addRule(`.monaco-editor .monaco-hover .hover-row .actions { background-color: ${actionsBackground}; }`);
        }
        const codeBackground = theme.getColor(colorRegistry_1.textCodeBlockBackground);
        if (codeBackground) {
            collector.addRule(`.monaco-editor .monaco-hover code { background-color: ${codeBackground}; }`);
        }
    });
});
//# sourceMappingURL=hover.js.map