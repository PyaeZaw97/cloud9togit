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
define(["require", "exports", "vs/nls", "vs/base/common/async", "vs/base/common/lifecycle", "vs/base/common/event", "vs/editor/browser/widget/codeEditorWidget", "vs/platform/instantiation/common/instantiation", "vs/editor/common/services/resolverService", "vs/workbench/services/editor/common/editorService", "vs/editor/common/services/editorWorker", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/scm/common/scm", "vs/editor/common/model/textModel", "vs/platform/theme/common/themeService", "vs/platform/theme/common/colorRegistry", "vs/editor/browser/editorExtensions", "vs/editor/contrib/peekView/browser/peekView", "vs/platform/contextkey/common/contextkey", "vs/editor/common/editorContextKeys", "vs/editor/common/core/position", "vs/base/common/numbers", "vs/platform/keybinding/common/keybindingsRegistry", "vs/editor/browser/widget/embeddedCodeEditorWidget", "vs/base/common/actions", "vs/platform/keybinding/common/keybinding", "vs/base/common/resources", "vs/platform/actions/common/actions", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/editor/common/model", "vs/base/common/arrays", "vs/editor/browser/services/codeEditorService", "vs/base/browser/dom", "vs/workbench/services/textfile/common/textfiles", "vs/platform/theme/common/iconRegistry", "vs/base/common/codicons", "vs/base/common/errors", "vs/workbench/common/contextkeys", "vs/platform/progress/common/progress", "vs/base/common/color", "vs/editor/common/core/editorColorRegistry", "vs/css!./media/dirtydiffDecorator"], function (require, exports, nls, async_1, lifecycle_1, event_1, codeEditorWidget_1, instantiation_1, resolverService_1, editorService_1, editorWorker_1, configuration_1, scm_1, textModel_1, themeService_1, colorRegistry_1, editorExtensions_1, peekView_1, contextkey_1, editorContextKeys_1, position_1, numbers_1, keybindingsRegistry_1, embeddedCodeEditorWidget_1, actions_1, keybinding_1, resources_1, actions_2, menuEntryActionViewItem_1, model_1, arrays_1, codeEditorService_1, dom_1, textfiles_1, iconRegistry_1, codicons_1, errors_1, contextkeys_1, progress_1, color_1, editorColorRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DirtyDiffWorkbenchController = exports.DirtyDiffModel = exports.getOriginalResource = exports.createProviderComparer = exports.overviewRulerDeletedForeground = exports.overviewRulerAddedForeground = exports.overviewRulerModifiedForeground = exports.minimapGutterDeletedBackground = exports.minimapGutterAddedBackground = exports.minimapGutterModifiedBackground = exports.editorGutterDeletedBackground = exports.editorGutterAddedBackground = exports.editorGutterModifiedBackground = exports.DirtyDiffController = exports.GotoNextChangeAction = exports.GotoPreviousChangeAction = exports.ShowNextChangeAction = exports.ShowPreviousChangeAction = exports.isDirtyDiffVisible = void 0;
    class DiffActionRunner extends actions_1.ActionRunner {
        runAction(action, context) {
            if (action instanceof actions_2.MenuItemAction) {
                return action.run(...context);
            }
            return super.runAction(action, context);
        }
    }
    exports.isDirtyDiffVisible = new contextkey_1.RawContextKey('dirtyDiffVisible', false);
    function getChangeHeight(change) {
        const modified = change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1;
        const original = change.originalEndLineNumber - change.originalStartLineNumber + 1;
        if (change.originalEndLineNumber === 0) {
            return modified;
        }
        else if (change.modifiedEndLineNumber === 0) {
            return original;
        }
        else {
            return modified + original;
        }
    }
    function getModifiedEndLineNumber(change) {
        if (change.modifiedEndLineNumber === 0) {
            return change.modifiedStartLineNumber === 0 ? 1 : change.modifiedStartLineNumber;
        }
        else {
            return change.modifiedEndLineNumber;
        }
    }
    function lineIntersectsChange(lineNumber, change) {
        // deletion at the beginning of the file
        if (lineNumber === 1 && change.modifiedStartLineNumber === 0 && change.modifiedEndLineNumber === 0) {
            return true;
        }
        return lineNumber >= change.modifiedStartLineNumber && lineNumber <= (change.modifiedEndLineNumber || change.modifiedStartLineNumber);
    }
    let UIEditorAction = class UIEditorAction extends actions_1.Action {
        constructor(editor, action, cssClass, keybindingService, instantiationService) {
            const keybinding = keybindingService.lookupKeybinding(action.id);
            const label = action.label + (keybinding ? ` (${keybinding.getLabel()})` : '');
            super(action.id, label, cssClass);
            this.instantiationService = instantiationService;
            this.action = action;
            this.editor = editor;
        }
        run() {
            return Promise.resolve(this.instantiationService.invokeFunction(accessor => this.action.run(accessor, this.editor, null)));
        }
    };
    UIEditorAction = __decorate([
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService)
    ], UIEditorAction);
    var ChangeType;
    (function (ChangeType) {
        ChangeType[ChangeType["Modify"] = 0] = "Modify";
        ChangeType[ChangeType["Add"] = 1] = "Add";
        ChangeType[ChangeType["Delete"] = 2] = "Delete";
    })(ChangeType || (ChangeType = {}));
    function getChangeType(change) {
        if (change.originalEndLineNumber === 0) {
            return ChangeType.Add;
        }
        else if (change.modifiedEndLineNumber === 0) {
            return ChangeType.Delete;
        }
        else {
            return ChangeType.Modify;
        }
    }
    function getChangeTypeColor(theme, changeType) {
        switch (changeType) {
            case ChangeType.Modify: return theme.getColor(exports.editorGutterModifiedBackground);
            case ChangeType.Add: return theme.getColor(exports.editorGutterAddedBackground);
            case ChangeType.Delete: return theme.getColor(exports.editorGutterDeletedBackground);
        }
    }
    function getOuterEditorFromDiffEditor(accessor) {
        const diffEditors = accessor.get(codeEditorService_1.ICodeEditorService).listDiffEditors();
        for (const diffEditor of diffEditors) {
            if (diffEditor.hasTextFocus() && diffEditor instanceof embeddedCodeEditorWidget_1.EmbeddedDiffEditorWidget) {
                return diffEditor.getParentEditor();
            }
        }
        return (0, peekView_1.getOuterEditor)(accessor);
    }
    let DirtyDiffWidget = class DirtyDiffWidget extends peekView_1.PeekViewWidget {
        constructor(editor, model, themeService, instantiationService, menuService, _contextKeyService) {
            super(editor, { isResizeable: true, frameWidth: 1, keepEditorSelection: true }, instantiationService);
            this.model = model;
            this.themeService = themeService;
            this.index = 0;
            this.height = undefined;
            this._disposables.add(themeService.onDidColorThemeChange(this._applyTheme, this));
            this._applyTheme(themeService.getColorTheme());
            const contextKeyService = _contextKeyService.createOverlay([
                ['originalResourceScheme', this.model.original.uri.scheme]
            ]);
            this.menu = menuService.createMenu(actions_2.MenuId.SCMChangeContext, contextKeyService);
            this._disposables.add(this.menu);
            this.create();
            if (editor.hasModel()) {
                this.title = (0, resources_1.basename)(editor.getModel().uri);
            }
            else {
                this.title = '';
            }
            this.setTitle(this.title);
            this._disposables.add(model.onDidChange(this.renderTitle, this));
        }
        showChange(index) {
            const change = this.model.changes[index];
            this.index = index;
            this.change = change;
            const originalModel = this.model.original;
            if (!originalModel) {
                return;
            }
            const onFirstDiffUpdate = event_1.Event.once(this.diffEditor.onDidUpdateDiff);
            // TODO@joao TODO@alex need this setTimeout probably because the
            // non-side-by-side diff still hasn't created the view zones
            onFirstDiffUpdate(() => setTimeout(() => this.revealChange(change), 0));
            this.diffEditor.setModel(this.model);
            const position = new position_1.Position(getModifiedEndLineNumber(change), 1);
            const lineHeight = this.editor.getOption(59 /* EditorOption.lineHeight */);
            const editorHeight = this.editor.getLayoutInfo().height;
            const editorHeightInLines = Math.floor(editorHeight / lineHeight);
            const height = Math.min(getChangeHeight(change) + /* padding */ 8, Math.floor(editorHeightInLines / 3));
            this.renderTitle();
            const changeType = getChangeType(change);
            const changeTypeColor = getChangeTypeColor(this.themeService.getColorTheme(), changeType);
            this.style({ frameColor: changeTypeColor, arrowColor: changeTypeColor });
            this._actionbarWidget.context = [this.model.modified.uri, this.model.changes, index];
            this.show(position, height);
            this.editor.focus();
        }
        renderTitle() {
            const detail = this.model.changes.length > 1
                ? nls.localize('changes', "{0} of {1} changes", this.index + 1, this.model.changes.length)
                : nls.localize('change', "{0} of {1} change", this.index + 1, this.model.changes.length);
            this.setTitle(this.title, detail);
        }
        _fillHead(container) {
            super._fillHead(container, true);
            const previous = this.instantiationService.createInstance(UIEditorAction, this.editor, new ShowPreviousChangeAction(), themeService_1.ThemeIcon.asClassName(iconRegistry_1.gotoPreviousLocation));
            const next = this.instantiationService.createInstance(UIEditorAction, this.editor, new ShowNextChangeAction(), themeService_1.ThemeIcon.asClassName(iconRegistry_1.gotoNextLocation));
            this._disposables.add(previous);
            this._disposables.add(next);
            const actions = [];
            this._disposables.add((0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(this.menu, { shouldForwardArgs: true }, actions));
            this._actionbarWidget.push(actions.reverse(), { label: false, icon: true });
            this._actionbarWidget.push([next, previous], { label: false, icon: true });
            this._actionbarWidget.push(new actions_1.Action('peekview.close', nls.localize('label.close', "Close"), codicons_1.Codicon.close.classNames, true, () => this.dispose()), { label: false, icon: true });
        }
        _getActionBarOptions() {
            const actionRunner = new DiffActionRunner();
            // close widget on successful action
            actionRunner.onDidRun(e => {
                if (!(e.action instanceof UIEditorAction) && !e.error) {
                    this.dispose();
                }
            });
            return Object.assign(Object.assign({}, super._getActionBarOptions()), { actionRunner });
        }
        _fillBody(container) {
            const options = {
                scrollBeyondLastLine: true,
                scrollbar: {
                    verticalScrollbarSize: 14,
                    horizontal: 'auto',
                    useShadows: true,
                    verticalHasArrows: false,
                    horizontalHasArrows: false
                },
                overviewRulerLanes: 2,
                fixedOverflowWidgets: true,
                minimap: { enabled: false },
                renderSideBySide: false,
                readOnly: false,
                renderIndicators: false
            };
            this.diffEditor = this.instantiationService.createInstance(embeddedCodeEditorWidget_1.EmbeddedDiffEditorWidget, container, options, this.editor);
            this._disposables.add(this.diffEditor);
        }
        _onWidth(width) {
            if (typeof this.height === 'undefined') {
                return;
            }
            this.diffEditor.layout({ height: this.height, width });
        }
        _doLayoutBody(height, width) {
            super._doLayoutBody(height, width);
            this.diffEditor.layout({ height, width });
            if (typeof this.height === 'undefined' && this.change) {
                this.revealChange(this.change);
            }
            this.height = height;
        }
        revealChange(change) {
            let start, end;
            if (change.modifiedEndLineNumber === 0) { // deletion
                start = change.modifiedStartLineNumber;
                end = change.modifiedStartLineNumber + 1;
            }
            else if (change.originalEndLineNumber > 0) { // modification
                start = change.modifiedStartLineNumber - 1;
                end = change.modifiedEndLineNumber + 1;
            }
            else { // insertion
                start = change.modifiedStartLineNumber;
                end = change.modifiedEndLineNumber;
            }
            this.diffEditor.revealLinesInCenter(start, end, 1 /* ScrollType.Immediate */);
        }
        _applyTheme(theme) {
            const borderColor = theme.getColor(peekView_1.peekViewBorder) || color_1.Color.transparent;
            this.style({
                arrowColor: borderColor,
                frameColor: borderColor,
                headerBackgroundColor: theme.getColor(peekView_1.peekViewTitleBackground) || color_1.Color.transparent,
                primaryHeadingColor: theme.getColor(peekView_1.peekViewTitleForeground),
                secondaryHeadingColor: theme.getColor(peekView_1.peekViewTitleInfoForeground)
            });
        }
        revealLine(lineNumber) {
            this.editor.revealLineInCenterIfOutsideViewport(lineNumber, 0 /* ScrollType.Smooth */);
        }
        hasFocus() {
            return this.diffEditor.hasTextFocus();
        }
    };
    DirtyDiffWidget = __decorate([
        __param(2, themeService_1.IThemeService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, actions_2.IMenuService),
        __param(5, contextkey_1.IContextKeyService)
    ], DirtyDiffWidget);
    class ShowPreviousChangeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.dirtydiff.previous',
                label: nls.localize('show previous change', "Show Previous Change"),
                alias: 'Show Previous Change',
                precondition: contextkeys_1.TextCompareEditorActiveContext.toNegated(),
                kbOpts: { kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus, primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 61 /* KeyCode.F3 */, weight: 100 /* KeybindingWeight.EditorContrib */ }
            });
        }
        run(accessor, editor) {
            const outerEditor = getOuterEditorFromDiffEditor(accessor);
            if (!outerEditor) {
                return;
            }
            const controller = DirtyDiffController.get(outerEditor);
            if (!controller) {
                return;
            }
            if (!controller.canNavigate()) {
                return;
            }
            controller.previous();
        }
    }
    exports.ShowPreviousChangeAction = ShowPreviousChangeAction;
    (0, editorExtensions_1.registerEditorAction)(ShowPreviousChangeAction);
    class ShowNextChangeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'editor.action.dirtydiff.next',
                label: nls.localize('show next change', "Show Next Change"),
                alias: 'Show Next Change',
                precondition: contextkeys_1.TextCompareEditorActiveContext.toNegated(),
                kbOpts: { kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus, primary: 512 /* KeyMod.Alt */ | 61 /* KeyCode.F3 */, weight: 100 /* KeybindingWeight.EditorContrib */ }
            });
        }
        run(accessor, editor) {
            const outerEditor = getOuterEditorFromDiffEditor(accessor);
            if (!outerEditor) {
                return;
            }
            const controller = DirtyDiffController.get(outerEditor);
            if (!controller) {
                return;
            }
            if (!controller.canNavigate()) {
                return;
            }
            controller.next();
        }
    }
    exports.ShowNextChangeAction = ShowNextChangeAction;
    (0, editorExtensions_1.registerEditorAction)(ShowNextChangeAction);
    // Go to menu
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '7_change_nav',
        command: {
            id: 'editor.action.dirtydiff.next',
            title: nls.localize({ key: 'miGotoNextChange', comment: ['&& denotes a mnemonic'] }, "Next &&Change")
        },
        order: 1
    });
    actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.MenubarGoMenu, {
        group: '7_change_nav',
        command: {
            id: 'editor.action.dirtydiff.previous',
            title: nls.localize({ key: 'miGotoPreviousChange', comment: ['&& denotes a mnemonic'] }, "Previous &&Change")
        },
        order: 2
    });
    class GotoPreviousChangeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'workbench.action.editor.previousChange',
                label: nls.localize('move to previous change', "Go to Previous Change"),
                alias: 'Go to Previous Change',
                precondition: contextkeys_1.TextCompareEditorActiveContext.toNegated(),
                kbOpts: { kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus, primary: 1024 /* KeyMod.Shift */ | 512 /* KeyMod.Alt */ | 63 /* KeyCode.F5 */, weight: 100 /* KeybindingWeight.EditorContrib */ }
            });
        }
        run(accessor, editor) {
            const outerEditor = getOuterEditorFromDiffEditor(accessor);
            if (!outerEditor || !outerEditor.hasModel()) {
                return;
            }
            const controller = DirtyDiffController.get(outerEditor);
            if (!controller || !controller.modelRegistry) {
                return;
            }
            const lineNumber = outerEditor.getPosition().lineNumber;
            const model = controller.modelRegistry.getModel(outerEditor.getModel());
            if (!model || model.changes.length === 0) {
                return;
            }
            const index = model.findPreviousClosestChange(lineNumber, false);
            const change = model.changes[index];
            const position = new position_1.Position(change.modifiedStartLineNumber, 1);
            outerEditor.setPosition(position);
            outerEditor.revealPositionInCenter(position);
        }
    }
    exports.GotoPreviousChangeAction = GotoPreviousChangeAction;
    (0, editorExtensions_1.registerEditorAction)(GotoPreviousChangeAction);
    class GotoNextChangeAction extends editorExtensions_1.EditorAction {
        constructor() {
            super({
                id: 'workbench.action.editor.nextChange',
                label: nls.localize('move to next change', "Go to Next Change"),
                alias: 'Go to Next Change',
                precondition: contextkeys_1.TextCompareEditorActiveContext.toNegated(),
                kbOpts: { kbExpr: editorContextKeys_1.EditorContextKeys.editorTextFocus, primary: 512 /* KeyMod.Alt */ | 63 /* KeyCode.F5 */, weight: 100 /* KeybindingWeight.EditorContrib */ }
            });
        }
        run(accessor, editor) {
            const outerEditor = getOuterEditorFromDiffEditor(accessor);
            if (!outerEditor || !outerEditor.hasModel()) {
                return;
            }
            const controller = DirtyDiffController.get(outerEditor);
            if (!controller || !controller.modelRegistry) {
                return;
            }
            const lineNumber = outerEditor.getPosition().lineNumber;
            const model = controller.modelRegistry.getModel(outerEditor.getModel());
            if (!model || model.changes.length === 0) {
                return;
            }
            const index = model.findNextClosestChange(lineNumber, false);
            const change = model.changes[index];
            const position = new position_1.Position(change.modifiedStartLineNumber, 1);
            outerEditor.setPosition(position);
            outerEditor.revealPositionInCenter(position);
        }
    }
    exports.GotoNextChangeAction = GotoNextChangeAction;
    (0, editorExtensions_1.registerEditorAction)(GotoNextChangeAction);
    keybindingsRegistry_1.KeybindingsRegistry.registerCommandAndKeybindingRule({
        id: 'closeDirtyDiff',
        weight: 100 /* KeybindingWeight.EditorContrib */ + 50,
        primary: 9 /* KeyCode.Escape */,
        secondary: [1024 /* KeyMod.Shift */ | 9 /* KeyCode.Escape */],
        when: contextkey_1.ContextKeyExpr.and(exports.isDirtyDiffVisible),
        handler: (accessor) => {
            const outerEditor = getOuterEditorFromDiffEditor(accessor);
            if (!outerEditor) {
                return;
            }
            const controller = DirtyDiffController.get(outerEditor);
            if (!controller) {
                return;
            }
            controller.close();
        }
    });
    let DirtyDiffController = class DirtyDiffController extends lifecycle_1.Disposable {
        constructor(editor, contextKeyService, configurationService, instantiationService) {
            super();
            this.editor = editor;
            this.configurationService = configurationService;
            this.instantiationService = instantiationService;
            this.modelRegistry = null;
            this.model = null;
            this.widget = null;
            this.currentIndex = -1;
            this.session = lifecycle_1.Disposable.None;
            this.mouseDownInfo = null;
            this.enabled = false;
            this.gutterActionDisposables = new lifecycle_1.DisposableStore();
            this.enabled = !contextKeyService.getContextKeyValue('isInDiffEditor');
            this.stylesheet = (0, dom_1.createStyleSheet)();
            this._register((0, lifecycle_1.toDisposable)(() => this.stylesheet.remove()));
            if (this.enabled) {
                this.isDirtyDiffVisible = exports.isDirtyDiffVisible.bindTo(contextKeyService);
                this._register(editor.onDidChangeModel(() => this.close()));
                const onDidChangeGutterAction = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.diffDecorationsGutterAction'));
                this._register(onDidChangeGutterAction(this.onDidChangeGutterAction, this));
                this.onDidChangeGutterAction();
            }
        }
        static get(editor) {
            return editor.getContribution(DirtyDiffController.ID);
        }
        onDidChangeGutterAction() {
            const gutterAction = this.configurationService.getValue('scm.diffDecorationsGutterAction');
            this.gutterActionDisposables.dispose();
            this.gutterActionDisposables = new lifecycle_1.DisposableStore();
            if (gutterAction === 'diff') {
                this.gutterActionDisposables.add(this.editor.onMouseDown(e => this.onEditorMouseDown(e)));
                this.gutterActionDisposables.add(this.editor.onMouseUp(e => this.onEditorMouseUp(e)));
                this.stylesheet.textContent = `
				.monaco-editor .dirty-diff-glyph {
					cursor: pointer;
				}

				.monaco-editor .margin-view-overlays .dirty-diff-glyph:hover::before {
					width: 9px;
					left: -6px;
				}

				.monaco-editor .margin-view-overlays .dirty-diff-deleted:hover::after {
					bottom: 0;
					border-top-width: 0;
					border-bottom-width: 0;
				}
			`;
            }
            else {
                this.stylesheet.textContent = ``;
            }
        }
        canNavigate() {
            return this.currentIndex === -1 || (!!this.model && this.model.changes.length > 1);
        }
        next(lineNumber) {
            if (!this.assertWidget()) {
                return;
            }
            if (!this.widget || !this.model) {
                return;
            }
            if (this.editor.hasModel() && (typeof lineNumber === 'number' || this.currentIndex === -1)) {
                this.currentIndex = this.model.findNextClosestChange(typeof lineNumber === 'number' ? lineNumber : this.editor.getPosition().lineNumber);
            }
            else {
                this.currentIndex = (0, numbers_1.rot)(this.currentIndex + 1, this.model.changes.length);
            }
            this.widget.showChange(this.currentIndex);
        }
        previous(lineNumber) {
            if (!this.assertWidget()) {
                return;
            }
            if (!this.widget || !this.model) {
                return;
            }
            if (this.editor.hasModel() && (typeof lineNumber === 'number' || this.currentIndex === -1)) {
                this.currentIndex = this.model.findPreviousClosestChange(typeof lineNumber === 'number' ? lineNumber : this.editor.getPosition().lineNumber);
            }
            else {
                this.currentIndex = (0, numbers_1.rot)(this.currentIndex - 1, this.model.changes.length);
            }
            this.widget.showChange(this.currentIndex);
        }
        close() {
            this.session.dispose();
            this.session = lifecycle_1.Disposable.None;
        }
        assertWidget() {
            if (!this.enabled) {
                return false;
            }
            if (this.widget) {
                if (!this.model || this.model.changes.length === 0) {
                    this.close();
                    return false;
                }
                return true;
            }
            if (!this.modelRegistry) {
                return false;
            }
            const editorModel = this.editor.getModel();
            if (!editorModel) {
                return false;
            }
            const model = this.modelRegistry.getModel(editorModel);
            if (!model) {
                return false;
            }
            if (model.changes.length === 0) {
                return false;
            }
            this.currentIndex = -1;
            this.model = model;
            this.widget = this.instantiationService.createInstance(DirtyDiffWidget, this.editor, model);
            this.isDirtyDiffVisible.set(true);
            const disposables = new lifecycle_1.DisposableStore();
            disposables.add(event_1.Event.once(this.widget.onDidClose)(this.close, this));
            event_1.Event.chain(model.onDidChange)
                .filter(e => e.diff.length > 0)
                .map(e => e.diff)
                .event(this.onDidModelChange, this, disposables);
            disposables.add(this.widget);
            disposables.add((0, lifecycle_1.toDisposable)(() => {
                this.model = null;
                this.widget = null;
                this.currentIndex = -1;
                this.isDirtyDiffVisible.set(false);
                this.editor.focus();
            }));
            this.session = disposables;
            return true;
        }
        onDidModelChange(splices) {
            if (!this.model || !this.widget || this.widget.hasFocus()) {
                return;
            }
            for (const splice of splices) {
                if (splice.start <= this.currentIndex) {
                    if (this.currentIndex < splice.start + splice.deleteCount) {
                        this.currentIndex = -1;
                        this.next();
                    }
                    else {
                        this.currentIndex = (0, numbers_1.rot)(this.currentIndex + splice.toInsert.length - splice.deleteCount - 1, this.model.changes.length);
                        this.next();
                    }
                }
            }
        }
        onEditorMouseDown(e) {
            this.mouseDownInfo = null;
            const range = e.target.range;
            if (!range) {
                return;
            }
            if (!e.event.leftButton) {
                return;
            }
            if (e.target.type !== 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */) {
                return;
            }
            if (!e.target.element) {
                return;
            }
            if (e.target.element.className.indexOf('dirty-diff-glyph') < 0) {
                return;
            }
            const data = e.target.detail;
            const offsetLeftInGutter = e.target.element.offsetLeft;
            const gutterOffsetX = data.offsetX - offsetLeftInGutter;
            // TODO@joao TODO@alex TODO@martin this is such that we don't collide with folding
            if (gutterOffsetX < -3 || gutterOffsetX > 6) { // dirty diff decoration on hover is 9px wide
                return;
            }
            this.mouseDownInfo = { lineNumber: range.startLineNumber };
        }
        onEditorMouseUp(e) {
            if (!this.mouseDownInfo) {
                return;
            }
            const { lineNumber } = this.mouseDownInfo;
            this.mouseDownInfo = null;
            const range = e.target.range;
            if (!range || range.startLineNumber !== lineNumber) {
                return;
            }
            if (e.target.type !== 4 /* MouseTargetType.GUTTER_LINE_DECORATIONS */) {
                return;
            }
            if (!this.modelRegistry) {
                return;
            }
            const editorModel = this.editor.getModel();
            if (!editorModel) {
                return;
            }
            const model = this.modelRegistry.getModel(editorModel);
            if (!model) {
                return;
            }
            const index = model.changes.findIndex(change => lineIntersectsChange(lineNumber, change));
            if (index < 0) {
                return;
            }
            if (index === this.currentIndex) {
                this.close();
            }
            else {
                this.next(lineNumber);
            }
        }
        getChanges() {
            if (!this.modelRegistry) {
                return [];
            }
            if (!this.editor.hasModel()) {
                return [];
            }
            const model = this.modelRegistry.getModel(this.editor.getModel());
            if (!model) {
                return [];
            }
            return model.changes;
        }
        dispose() {
            this.gutterActionDisposables.dispose();
            super.dispose();
        }
    };
    DirtyDiffController.ID = 'editor.contrib.dirtydiff';
    DirtyDiffController = __decorate([
        __param(1, contextkey_1.IContextKeyService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, instantiation_1.IInstantiationService)
    ], DirtyDiffController);
    exports.DirtyDiffController = DirtyDiffController;
    exports.editorGutterModifiedBackground = (0, colorRegistry_1.registerColor)('editorGutter.modifiedBackground', {
        dark: '#1B81A8',
        light: '#2090D3',
        hcDark: '#1B81A8',
        hcLight: '#2090D3'
    }, nls.localize('editorGutterModifiedBackground', "Editor gutter background color for lines that are modified."));
    exports.editorGutterAddedBackground = (0, colorRegistry_1.registerColor)('editorGutter.addedBackground', {
        dark: '#487E02',
        light: '#48985D',
        hcDark: '#487E02',
        hcLight: '#48985D'
    }, nls.localize('editorGutterAddedBackground', "Editor gutter background color for lines that are added."));
    exports.editorGutterDeletedBackground = (0, colorRegistry_1.registerColor)('editorGutter.deletedBackground', {
        dark: colorRegistry_1.editorErrorForeground,
        light: colorRegistry_1.editorErrorForeground,
        hcDark: colorRegistry_1.editorErrorForeground,
        hcLight: colorRegistry_1.editorErrorForeground
    }, nls.localize('editorGutterDeletedBackground', "Editor gutter background color for lines that are deleted."));
    exports.minimapGutterModifiedBackground = (0, colorRegistry_1.registerColor)('minimapGutter.modifiedBackground', {
        dark: exports.editorGutterModifiedBackground,
        light: exports.editorGutterModifiedBackground,
        hcDark: exports.editorGutterModifiedBackground,
        hcLight: exports.editorGutterModifiedBackground
    }, nls.localize('minimapGutterModifiedBackground', "Minimap gutter background color for lines that are modified."));
    exports.minimapGutterAddedBackground = (0, colorRegistry_1.registerColor)('minimapGutter.addedBackground', {
        dark: exports.editorGutterAddedBackground,
        light: exports.editorGutterAddedBackground,
        hcDark: exports.editorGutterAddedBackground,
        hcLight: exports.editorGutterAddedBackground
    }, nls.localize('minimapGutterAddedBackground', "Minimap gutter background color for lines that are added."));
    exports.minimapGutterDeletedBackground = (0, colorRegistry_1.registerColor)('minimapGutter.deletedBackground', {
        dark: exports.editorGutterDeletedBackground,
        light: exports.editorGutterDeletedBackground,
        hcDark: exports.editorGutterDeletedBackground,
        hcLight: exports.editorGutterDeletedBackground
    }, nls.localize('minimapGutterDeletedBackground', "Minimap gutter background color for lines that are deleted."));
    exports.overviewRulerModifiedForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.modifiedForeground', { dark: (0, colorRegistry_1.transparent)(exports.editorGutterModifiedBackground, 0.6), light: (0, colorRegistry_1.transparent)(exports.editorGutterModifiedBackground, 0.6), hcDark: (0, colorRegistry_1.transparent)(exports.editorGutterModifiedBackground, 0.6), hcLight: (0, colorRegistry_1.transparent)(exports.editorGutterModifiedBackground, 0.6) }, nls.localize('overviewRulerModifiedForeground', 'Overview ruler marker color for modified content.'));
    exports.overviewRulerAddedForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.addedForeground', { dark: (0, colorRegistry_1.transparent)(exports.editorGutterAddedBackground, 0.6), light: (0, colorRegistry_1.transparent)(exports.editorGutterAddedBackground, 0.6), hcDark: (0, colorRegistry_1.transparent)(exports.editorGutterAddedBackground, 0.6), hcLight: (0, colorRegistry_1.transparent)(exports.editorGutterAddedBackground, 0.6) }, nls.localize('overviewRulerAddedForeground', 'Overview ruler marker color for added content.'));
    exports.overviewRulerDeletedForeground = (0, colorRegistry_1.registerColor)('editorOverviewRuler.deletedForeground', { dark: (0, colorRegistry_1.transparent)(exports.editorGutterDeletedBackground, 0.6), light: (0, colorRegistry_1.transparent)(exports.editorGutterDeletedBackground, 0.6), hcDark: (0, colorRegistry_1.transparent)(exports.editorGutterDeletedBackground, 0.6), hcLight: (0, colorRegistry_1.transparent)(exports.editorGutterDeletedBackground, 0.6) }, nls.localize('overviewRulerDeletedForeground', 'Overview ruler marker color for deleted content.'));
    let DirtyDiffDecorator = class DirtyDiffDecorator extends lifecycle_1.Disposable {
        constructor(editorModel, model, configurationService) {
            super();
            this.model = model;
            this.configurationService = configurationService;
            this.decorations = [];
            this.editorModel = editorModel;
            const decorations = configurationService.getValue('scm.diffDecorations');
            const gutter = decorations === 'all' || decorations === 'gutter';
            const overview = decorations === 'all' || decorations === 'overview';
            const minimap = decorations === 'all' || decorations === 'minimap';
            this.addedOptions = DirtyDiffDecorator.createDecoration('dirty-diff-added', {
                gutter,
                overview: { active: overview, color: exports.overviewRulerAddedForeground },
                minimap: { active: minimap, color: exports.minimapGutterAddedBackground },
                isWholeLine: true
            });
            this.addedPatternOptions = DirtyDiffDecorator.createDecoration('dirty-diff-added-pattern', {
                gutter,
                overview: { active: overview, color: exports.overviewRulerAddedForeground },
                minimap: { active: minimap, color: exports.minimapGutterAddedBackground },
                isWholeLine: true
            });
            this.modifiedOptions = DirtyDiffDecorator.createDecoration('dirty-diff-modified', {
                gutter,
                overview: { active: overview, color: exports.overviewRulerModifiedForeground },
                minimap: { active: minimap, color: exports.minimapGutterModifiedBackground },
                isWholeLine: true
            });
            this.modifiedPatternOptions = DirtyDiffDecorator.createDecoration('dirty-diff-modified-pattern', {
                gutter,
                overview: { active: overview, color: exports.overviewRulerModifiedForeground },
                minimap: { active: minimap, color: exports.minimapGutterModifiedBackground },
                isWholeLine: true
            });
            this.deletedOptions = DirtyDiffDecorator.createDecoration('dirty-diff-deleted', {
                gutter,
                overview: { active: overview, color: exports.overviewRulerDeletedForeground },
                minimap: { active: minimap, color: exports.minimapGutterDeletedBackground },
                isWholeLine: false
            });
            this._register(configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('scm.diffDecorationsGutterPattern')) {
                    this.onDidChange();
                }
            }));
            this._register(model.onDidChange(this.onDidChange, this));
        }
        static createDecoration(className, options) {
            const decorationOptions = {
                description: 'dirty-diff-decoration',
                isWholeLine: options.isWholeLine,
            };
            if (options.gutter) {
                decorationOptions.linesDecorationsClassName = `dirty-diff-glyph ${className}`;
            }
            if (options.overview.active) {
                decorationOptions.overviewRuler = {
                    color: (0, themeService_1.themeColorFromId)(options.overview.color),
                    position: model_1.OverviewRulerLane.Left
                };
            }
            if (options.minimap.active) {
                decorationOptions.minimap = {
                    color: (0, themeService_1.themeColorFromId)(options.minimap.color),
                    position: model_1.MinimapPosition.Gutter
                };
            }
            return textModel_1.ModelDecorationOptions.createDynamic(decorationOptions);
        }
        onDidChange() {
            if (!this.editorModel) {
                return;
            }
            const pattern = this.configurationService.getValue('scm.diffDecorationsGutterPattern');
            const decorations = this.model.changes.map((change) => {
                const changeType = getChangeType(change);
                const startLineNumber = change.modifiedStartLineNumber;
                const endLineNumber = change.modifiedEndLineNumber || startLineNumber;
                switch (changeType) {
                    case ChangeType.Add:
                        return {
                            range: {
                                startLineNumber: startLineNumber, startColumn: 1,
                                endLineNumber: endLineNumber, endColumn: 1
                            },
                            options: pattern.added ? this.addedPatternOptions : this.addedOptions
                        };
                    case ChangeType.Delete:
                        return {
                            range: {
                                startLineNumber: startLineNumber, startColumn: Number.MAX_VALUE,
                                endLineNumber: startLineNumber, endColumn: Number.MAX_VALUE
                            },
                            options: this.deletedOptions
                        };
                    case ChangeType.Modify:
                        return {
                            range: {
                                startLineNumber: startLineNumber, startColumn: 1,
                                endLineNumber: endLineNumber, endColumn: 1
                            },
                            options: pattern.modified ? this.modifiedPatternOptions : this.modifiedOptions
                        };
                }
            });
            this.decorations = this.editorModel.deltaDecorations(this.decorations, decorations);
        }
        dispose() {
            super.dispose();
            if (this.editorModel && !this.editorModel.isDisposed()) {
                this.editorModel.deltaDecorations(this.decorations, []);
            }
            this.editorModel = null;
            this.decorations = [];
        }
    };
    DirtyDiffDecorator = __decorate([
        __param(2, configuration_1.IConfigurationService)
    ], DirtyDiffDecorator);
    function compareChanges(a, b) {
        let result = a.modifiedStartLineNumber - b.modifiedStartLineNumber;
        if (result !== 0) {
            return result;
        }
        result = a.modifiedEndLineNumber - b.modifiedEndLineNumber;
        if (result !== 0) {
            return result;
        }
        result = a.originalStartLineNumber - b.originalStartLineNumber;
        if (result !== 0) {
            return result;
        }
        return a.originalEndLineNumber - b.originalEndLineNumber;
    }
    function createProviderComparer(uri) {
        return (a, b) => {
            const aIsParent = (0, resources_1.isEqualOrParent)(uri, a.rootUri);
            const bIsParent = (0, resources_1.isEqualOrParent)(uri, b.rootUri);
            if (aIsParent && bIsParent) {
                return a.rootUri.fsPath.length - b.rootUri.fsPath.length;
            }
            else if (aIsParent) {
                return -1;
            }
            else if (bIsParent) {
                return 1;
            }
            else {
                return 0;
            }
        };
    }
    exports.createProviderComparer = createProviderComparer;
    async function getOriginalResource(scmService, uri) {
        const providers = scmService.repositories.map(r => r.provider);
        const rootedProviders = providers.filter(p => !!p.rootUri);
        rootedProviders.sort(createProviderComparer(uri));
        const result = await (0, async_1.first)(rootedProviders.map(p => () => p.getOriginalResource(uri)));
        if (result) {
            return result;
        }
        const nonRootedProviders = providers.filter(p => !p.rootUri);
        return (0, async_1.first)(nonRootedProviders.map(p => () => p.getOriginalResource(uri)));
    }
    exports.getOriginalResource = getOriginalResource;
    let DirtyDiffModel = class DirtyDiffModel extends lifecycle_1.Disposable {
        constructor(textFileModel, scmService, editorWorkerService, configurationService, textModelResolverService, progressService) {
            super();
            this.scmService = scmService;
            this.editorWorkerService = editorWorkerService;
            this.configurationService = configurationService;
            this.textModelResolverService = textModelResolverService;
            this.progressService = progressService;
            this._originalResource = null;
            this._originalModel = null;
            this.diffDelayer = new async_1.ThrottledDelayer(200);
            this.repositoryDisposables = new Set();
            this.originalModelDisposables = this._register(new lifecycle_1.DisposableStore());
            this._disposed = false;
            this._onDidChange = new event_1.Emitter();
            this.onDidChange = this._onDidChange.event;
            this._changes = [];
            this._model = textFileModel;
            this._register(textFileModel.textEditorModel.onDidChangeContent(() => this.triggerDiff()));
            this._register(event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.diffDecorationsIgnoreTrimWhitespace') || e.affectsConfiguration('diffEditor.ignoreTrimWhitespace'))(this.triggerDiff, this));
            this._register(scmService.onDidAddRepository(this.onDidAddRepository, this));
            scmService.repositories.forEach(r => this.onDidAddRepository(r));
            this._register(this._model.onDidChangeEncoding(() => {
                this.diffDelayer.cancel();
                this._originalResource = null;
                this._originalModel = null;
                this._originalURIPromise = undefined;
                this.setChanges([]);
                this.triggerDiff();
            }));
            this.triggerDiff();
        }
        get original() { var _a; return ((_a = this._originalModel) === null || _a === void 0 ? void 0 : _a.textEditorModel) || null; }
        get modified() { return this._model.textEditorModel || null; }
        get changes() { return this._changes; }
        onDidAddRepository(repository) {
            const disposables = new lifecycle_1.DisposableStore();
            this.repositoryDisposables.add(disposables);
            disposables.add((0, lifecycle_1.toDisposable)(() => this.repositoryDisposables.delete(disposables)));
            const onDidChange = event_1.Event.any(repository.provider.onDidChange, repository.provider.onDidChangeResources);
            disposables.add(onDidChange(this.triggerDiff, this));
            const onDidRemoveThis = event_1.Event.filter(this.scmService.onDidRemoveRepository, r => r === repository);
            disposables.add(onDidRemoveThis(() => (0, lifecycle_1.dispose)(disposables), null));
            this.triggerDiff();
        }
        triggerDiff() {
            if (!this.diffDelayer) {
                return Promise.resolve(null);
            }
            return this.diffDelayer
                .trigger(() => this.diff())
                .then((changes) => {
                if (this._disposed || this._model.isDisposed() || !this._originalModel || this._originalModel.isDisposed()) {
                    return; // disposed
                }
                if (this._originalModel.textEditorModel.getValueLength() === 0) {
                    changes = [];
                }
                if (!changes) {
                    changes = [];
                }
                this.setChanges(changes);
            }, (err) => (0, errors_1.onUnexpectedError)(err));
        }
        setChanges(changes) {
            const diff = (0, arrays_1.sortedDiff)(this._changes, changes, compareChanges);
            this._changes = changes;
            this._onDidChange.fire({ changes, diff });
        }
        diff() {
            return this.progressService.withProgress({ location: 3 /* ProgressLocation.Scm */, delay: 250 }, async () => {
                return this.getOriginalURIPromise().then(originalURI => {
                    if (this._disposed || this._model.isDisposed() || !originalURI) {
                        return Promise.resolve([]); // disposed
                    }
                    if (!this.editorWorkerService.canComputeDirtyDiff(originalURI, this._model.resource)) {
                        return Promise.resolve([]); // Files too large
                    }
                    const ignoreTrimWhitespaceSetting = this.configurationService.getValue('scm.diffDecorationsIgnoreTrimWhitespace');
                    const ignoreTrimWhitespace = ignoreTrimWhitespaceSetting === 'inherit'
                        ? this.configurationService.getValue('diffEditor.ignoreTrimWhitespace')
                        : ignoreTrimWhitespaceSetting !== 'false';
                    return this.editorWorkerService.computeDirtyDiff(originalURI, this._model.resource, ignoreTrimWhitespace);
                });
            });
        }
        getOriginalURIPromise() {
            if (this._originalURIPromise) {
                return this._originalURIPromise;
            }
            this._originalURIPromise = this.getOriginalResource().then(originalUri => {
                var _a;
                if (this._disposed) { // disposed
                    return null;
                }
                if (!originalUri) {
                    this._originalResource = null;
                    this._originalModel = null;
                    return null;
                }
                if (((_a = this._originalResource) === null || _a === void 0 ? void 0 : _a.toString()) === originalUri.toString()) {
                    return originalUri;
                }
                return this.textModelResolverService.createModelReference(originalUri).then(ref => {
                    if (this._disposed) { // disposed
                        ref.dispose();
                        return null;
                    }
                    this._originalResource = originalUri;
                    this._originalModel = ref.object;
                    if ((0, textfiles_1.isTextFileEditorModel)(this._originalModel)) {
                        const encoding = this._model.getEncoding();
                        if (encoding) {
                            this._originalModel.setEncoding(encoding, 1 /* EncodingMode.Decode */);
                        }
                    }
                    this.originalModelDisposables.clear();
                    this.originalModelDisposables.add(ref);
                    this.originalModelDisposables.add(ref.object.textEditorModel.onDidChangeContent(() => this.triggerDiff()));
                    return originalUri;
                }).catch(error => {
                    return null; // possibly invalid reference
                });
            });
            return this._originalURIPromise.finally(() => {
                this._originalURIPromise = undefined;
            });
        }
        async getOriginalResource() {
            if (this._disposed) {
                return Promise.resolve(null);
            }
            const uri = this._model.resource;
            return getOriginalResource(this.scmService, uri);
        }
        findNextClosestChange(lineNumber, inclusive = true) {
            for (let i = 0; i < this.changes.length; i++) {
                const change = this.changes[i];
                if (inclusive) {
                    if (getModifiedEndLineNumber(change) >= lineNumber) {
                        return i;
                    }
                }
                else {
                    if (change.modifiedStartLineNumber > lineNumber) {
                        return i;
                    }
                }
            }
            return 0;
        }
        findPreviousClosestChange(lineNumber, inclusive = true) {
            for (let i = this.changes.length - 1; i >= 0; i--) {
                const change = this.changes[i];
                if (inclusive) {
                    if (change.modifiedStartLineNumber <= lineNumber) {
                        return i;
                    }
                }
                else {
                    if (getModifiedEndLineNumber(change) < lineNumber) {
                        return i;
                    }
                }
            }
            return this.changes.length - 1;
        }
        dispose() {
            super.dispose();
            this._disposed = true;
            this._originalResource = null;
            this._originalModel = null;
            this.diffDelayer.cancel();
            this.repositoryDisposables.forEach(d => (0, lifecycle_1.dispose)(d));
            this.repositoryDisposables.clear();
        }
    };
    DirtyDiffModel = __decorate([
        __param(1, scm_1.ISCMService),
        __param(2, editorWorker_1.IEditorWorkerService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, resolverService_1.ITextModelService),
        __param(5, progress_1.IProgressService)
    ], DirtyDiffModel);
    exports.DirtyDiffModel = DirtyDiffModel;
    class DirtyDiffItem {
        constructor(model, decorator) {
            this.model = model;
            this.decorator = decorator;
        }
        dispose() {
            this.decorator.dispose();
            this.model.dispose();
        }
    }
    let DirtyDiffWorkbenchController = class DirtyDiffWorkbenchController extends lifecycle_1.Disposable {
        constructor(editorService, instantiationService, configurationService, textFileService) {
            super();
            this.editorService = editorService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.textFileService = textFileService;
            this.enabled = false;
            this.viewState = { width: 3, visibility: 'always' };
            this.items = new Map();
            this.transientDisposables = this._register(new lifecycle_1.DisposableStore());
            this.stylesheet = (0, dom_1.createStyleSheet)();
            this._register((0, lifecycle_1.toDisposable)(() => this.stylesheet.parentElement.removeChild(this.stylesheet)));
            const onDidChangeConfiguration = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.diffDecorations'));
            this._register(onDidChangeConfiguration(this.onDidChangeConfiguration, this));
            this.onDidChangeConfiguration();
            const onDidChangeDiffWidthConfiguration = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.diffDecorationsGutterWidth'));
            onDidChangeDiffWidthConfiguration(this.onDidChangeDiffWidthConfiguration, this);
            this.onDidChangeDiffWidthConfiguration();
            const onDidChangeDiffVisibilityConfiguration = event_1.Event.filter(configurationService.onDidChangeConfiguration, e => e.affectsConfiguration('scm.diffDecorationsGutterVisibility'));
            onDidChangeDiffVisibilityConfiguration(this.onDidChangeDiffVisibiltiyConfiguration, this);
            this.onDidChangeDiffVisibiltiyConfiguration();
        }
        onDidChangeConfiguration() {
            const enabled = this.configurationService.getValue('scm.diffDecorations') !== 'none';
            if (enabled) {
                this.enable();
            }
            else {
                this.disable();
            }
        }
        onDidChangeDiffWidthConfiguration() {
            let width = this.configurationService.getValue('scm.diffDecorationsGutterWidth');
            if (isNaN(width) || width <= 0 || width > 5) {
                width = 3;
            }
            this.setViewState(Object.assign(Object.assign({}, this.viewState), { width }));
        }
        onDidChangeDiffVisibiltiyConfiguration() {
            const visibility = this.configurationService.getValue('scm.diffDecorationsGutterVisibility');
            this.setViewState(Object.assign(Object.assign({}, this.viewState), { visibility }));
        }
        setViewState(state) {
            this.viewState = state;
            this.stylesheet.textContent = `
			.monaco-editor .dirty-diff-added,
			.monaco-editor .dirty-diff-modified {
				border-left-width:${state.width}px;
			}
			.monaco-editor .dirty-diff-added-pattern,
			.monaco-editor .dirty-diff-added-pattern:before,
			.monaco-editor .dirty-diff-modified-pattern,
			.monaco-editor .dirty-diff-modified-pattern:before {
				background-size: ${state.width}px ${state.width}px;
			}
			.monaco-editor .dirty-diff-added,
			.monaco-editor .dirty-diff-added-pattern,
			.monaco-editor .dirty-diff-modified,
			.monaco-editor .dirty-diff-modified-pattern,
			.monaco-editor .dirty-diff-deleted {
				opacity: ${state.visibility === 'always' ? 1 : 0};
			}
		`;
        }
        enable() {
            if (this.enabled) {
                this.disable();
            }
            this.transientDisposables.add(this.editorService.onDidVisibleEditorsChange(() => this.onEditorsChanged()));
            this.onEditorsChanged();
            this.enabled = true;
        }
        disable() {
            if (!this.enabled) {
                return;
            }
            this.transientDisposables.clear();
            for (const [, dirtyDiff] of this.items) {
                dirtyDiff.dispose();
            }
            this.items.clear();
            this.enabled = false;
        }
        // HACK: This is the best current way of figuring out whether to draw these decorations
        // or not. Needs context from the editor, to know whether it is a diff editor, in place editor
        // etc.
        onEditorsChanged() {
            const models = this.editorService.visibleTextEditorControls
                // only interested in code editor widgets
                .filter(c => c instanceof codeEditorWidget_1.CodeEditorWidget)
                // set model registry and map to models
                .map(editor => {
                const codeEditor = editor;
                const controller = DirtyDiffController.get(codeEditor);
                if (controller) {
                    controller.modelRegistry = this;
                }
                return codeEditor.getModel();
            })
                // remove nulls and duplicates
                .filter((m, i, a) => !!m && !!m.uri && a.indexOf(m, i + 1) === -1)
                // only want resolved text file service models
                .map(m => this.textFileService.files.get(m.uri))
                .filter(m => m === null || m === void 0 ? void 0 : m.isResolved());
            const set = new Set(models);
            const newModels = models.filter(o => !this.items.has(o));
            const oldModels = [...this.items.keys()].filter(m => !set.has(m));
            oldModels.forEach(m => this.onModelInvisible(m));
            newModels.forEach(m => this.onModelVisible(m));
        }
        onModelVisible(textFileModel) {
            const model = this.instantiationService.createInstance(DirtyDiffModel, textFileModel);
            const decorator = new DirtyDiffDecorator(textFileModel.textEditorModel, model, this.configurationService);
            this.items.set(textFileModel, new DirtyDiffItem(model, decorator));
        }
        onModelInvisible(textFileModel) {
            this.items.get(textFileModel).dispose();
            this.items.delete(textFileModel);
        }
        getModel(editorModel) {
            for (const [model, diff] of this.items) {
                if (model.textEditorModel.id === editorModel.id) {
                    return diff.model;
                }
            }
            return null;
        }
        dispose() {
            this.disable();
            super.dispose();
        }
    };
    DirtyDiffWorkbenchController = __decorate([
        __param(0, editorService_1.IEditorService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, textfiles_1.ITextFileService)
    ], DirtyDiffWorkbenchController);
    exports.DirtyDiffWorkbenchController = DirtyDiffWorkbenchController;
    (0, editorExtensions_1.registerEditorContribution)(DirtyDiffController.ID, DirtyDiffController);
    (0, themeService_1.registerThemingParticipant)((theme, collector) => {
        const editorGutterBackgroundColor = theme.getColor(editorColorRegistry_1.editorGutter);
        const editorGutterModifiedBackgroundColor = theme.getColor(exports.editorGutterModifiedBackground);
        const getLinearGradient = (color) => {
            return `-45deg, ${color} 25%, ${editorGutterBackgroundColor} 25%, ${editorGutterBackgroundColor} 50%, ${color} 50%, ${color} 75%, ${editorGutterBackgroundColor} 75%, ${editorGutterBackgroundColor}`;
        };
        if (editorGutterBackgroundColor && editorGutterModifiedBackgroundColor) {
            collector.addRule(`
			.monaco-editor .dirty-diff-modified {
				border-left-color: ${editorGutterModifiedBackgroundColor};
				border-left-style: solid;
				transition: opacity 0.5s;
			}
			.monaco-editor .dirty-diff-modified:before {
				background: ${editorGutterModifiedBackgroundColor};
			}
			.monaco-editor .dirty-diff-modified-pattern {
				background-image: linear-gradient(${getLinearGradient(editorGutterModifiedBackgroundColor)});
				background-repeat: repeat-y;
				transition: opacity 0.5s;
			}
			.monaco-editor .dirty-diff-modified-pattern:before {
				background-image: linear-gradient(${getLinearGradient(editorGutterModifiedBackgroundColor)});
				transform: translateX(3px);
			}
			.monaco-editor .margin:hover .dirty-diff-modified,
			.monaco-editor .margin:hover .dirty-diff-modified-pattern {
				opacity: 1;
			}
		`);
        }
        const editorGutterAddedBackgroundColor = theme.getColor(exports.editorGutterAddedBackground);
        if (editorGutterBackgroundColor && editorGutterAddedBackgroundColor) {
            collector.addRule(`
			.monaco-editor .dirty-diff-added {
				border-left-color: ${editorGutterAddedBackgroundColor};
				border-left-style: solid;
				transition: opacity 0.5s;
			}
			.monaco-editor .dirty-diff-added:before {
				background: ${editorGutterAddedBackgroundColor};
			}
			.monaco-editor .dirty-diff-added-pattern {
				background-image: linear-gradient(${getLinearGradient(editorGutterAddedBackgroundColor)});
				background-repeat: repeat-y;
				transition: opacity 0.5s;
			}
			.monaco-editor .dirty-diff-added-pattern:before {
				background-image: linear-gradient(${getLinearGradient(editorGutterAddedBackgroundColor)});
				transform: translateX(3px);
			}
			.monaco-editor .margin:hover .dirty-diff-added,
			.monaco-editor .margin:hover .dirty-diff-added-pattern {
				opacity: 1;
			}
		`);
        }
        const editorGutteDeletedBackgroundColor = theme.getColor(exports.editorGutterDeletedBackground);
        if (editorGutteDeletedBackgroundColor) {
            collector.addRule(`
			.monaco-editor .dirty-diff-deleted:after {
				border-left: 4px solid ${editorGutteDeletedBackgroundColor};
				transition: opacity 0.5s;
			}
			.monaco-editor .dirty-diff-deleted:before {
				background: ${editorGutteDeletedBackgroundColor};
			}
			.monaco-editor .margin:hover .dirty-diff-added {
				opacity: 1;
			}
		`);
        }
    });
});
//# sourceMappingURL=dirtydiffDecorator.js.map