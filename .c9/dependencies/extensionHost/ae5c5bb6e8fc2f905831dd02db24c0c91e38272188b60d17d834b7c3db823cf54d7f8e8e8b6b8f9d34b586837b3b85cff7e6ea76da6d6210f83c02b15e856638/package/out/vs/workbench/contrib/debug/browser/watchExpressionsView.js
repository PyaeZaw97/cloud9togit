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
define(["require", "exports", "vs/base/common/async", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/platform/configuration/common/configuration", "vs/workbench/browser/parts/views/viewPane", "vs/platform/list/browser/listService", "vs/base/browser/ui/list/listView", "vs/workbench/contrib/debug/browser/variablesView", "vs/platform/contextkey/common/contextkey", "vs/base/common/lifecycle", "vs/workbench/common/views", "vs/platform/opener/common/opener", "vs/platform/theme/common/themeService", "vs/platform/telemetry/common/telemetry", "vs/workbench/contrib/debug/browser/debugIcons", "vs/platform/actions/common/actions", "vs/nls", "vs/base/common/codicons", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/workbench/contrib/debug/browser/linkDetector"], function (require, exports, async_1, debug_1, debugModel_1, contextView_1, instantiation_1, keybinding_1, baseDebugView_1, configuration_1, viewPane_1, listService_1, listView_1, variablesView_1, contextkey_1, lifecycle_1, views_1, opener_1, themeService_1, telemetry_1, debugIcons_1, actions_1, nls_1, codicons_1, menuEntryActionViewItem_1, linkDetector_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.REMOVE_WATCH_EXPRESSIONS_LABEL = exports.REMOVE_WATCH_EXPRESSIONS_COMMAND_ID = exports.ADD_WATCH_LABEL = exports.ADD_WATCH_ID = exports.WatchExpressionsRenderer = exports.WatchExpressionsView = void 0;
    const MAX_VALUE_RENDER_LENGTH_IN_VIEWLET = 1024;
    let ignoreViewUpdates = false;
    let useCachedEvaluation = false;
    let WatchExpressionsView = class WatchExpressionsView extends viewPane_1.ViewPane {
        constructor(options, contextMenuService, debugService, keybindingService, instantiationService, viewDescriptorService, configurationService, contextKeyService, openerService, themeService, telemetryService, menuService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.debugService = debugService;
            this.needsRefresh = false;
            this.menu = menuService.createMenu(actions_1.MenuId.DebugWatchContext, contextKeyService);
            this._register(this.menu);
            this.watchExpressionsUpdatedScheduler = new async_1.RunOnceScheduler(() => {
                this.needsRefresh = false;
                this.tree.updateChildren();
            }, 50);
            this.watchExpressionsExist = debug_1.CONTEXT_WATCH_EXPRESSIONS_EXIST.bindTo(contextKeyService);
            this.variableReadonly = debug_1.CONTEXT_VARIABLE_IS_READONLY.bindTo(contextKeyService);
            this.watchExpressionsExist.set(this.debugService.getModel().getWatchExpressions().length > 0);
            this.watchItemType = debug_1.CONTEXT_WATCH_ITEM_TYPE.bindTo(contextKeyService);
        }
        renderBody(container) {
            super.renderBody(container);
            this.element.classList.add('debug-pane');
            container.classList.add('debug-watch');
            const treeContainer = (0, baseDebugView_1.renderViewTree)(container);
            const expressionsRenderer = this.instantiationService.createInstance(WatchExpressionsRenderer);
            const linkeDetector = this.instantiationService.createInstance(linkDetector_1.LinkDetector);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'WatchExpressions', treeContainer, new WatchExpressionsDelegate(), [expressionsRenderer, this.instantiationService.createInstance(variablesView_1.VariablesRenderer, linkeDetector)], new WatchExpressionsDataSource(), {
                accessibilityProvider: new WatchExpressionsAccessibilityProvider(),
                identityProvider: { getId: (element) => element.getId() },
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (e) => {
                        var _a;
                        if (e === ((_a = this.debugService.getViewModel().getSelectedExpression()) === null || _a === void 0 ? void 0 : _a.expression)) {
                            // Don't filter input box
                            return undefined;
                        }
                        return e.name;
                    }
                },
                dnd: new WatchExpressionsDragAndDrop(this.debugService),
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            this.tree.setInput(this.debugService);
            debug_1.CONTEXT_WATCH_EXPRESSIONS_FOCUSED.bindTo(this.tree.contextKeyService);
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            this._register(this.tree.onMouseDblClick(e => this.onMouseDblClick(e)));
            this._register(this.debugService.getModel().onDidChangeWatchExpressions(async (we) => {
                this.watchExpressionsExist.set(this.debugService.getModel().getWatchExpressions().length > 0);
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                }
                else {
                    if (we && !we.name) {
                        // We are adding a new input box, no need to re-evaluate watch expressions
                        useCachedEvaluation = true;
                    }
                    await this.tree.updateChildren();
                    useCachedEvaluation = false;
                    if (we instanceof debugModel_1.Expression) {
                        this.tree.reveal(we);
                    }
                }
            }));
            this._register(this.debugService.getViewModel().onDidFocusStackFrame(() => {
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                if (!this.watchExpressionsUpdatedScheduler.isScheduled()) {
                    this.watchExpressionsUpdatedScheduler.schedule();
                }
            }));
            this._register(this.debugService.getViewModel().onWillUpdateViews(() => {
                if (!ignoreViewUpdates) {
                    this.tree.updateChildren();
                }
            }));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.watchExpressionsUpdatedScheduler.schedule();
                }
            }));
            let horizontalScrolling;
            this._register(this.debugService.getViewModel().onDidSelectExpression(e => {
                const expression = e === null || e === void 0 ? void 0 : e.expression;
                if (expression instanceof debugModel_1.Expression || (expression instanceof debugModel_1.Variable && (e === null || e === void 0 ? void 0 : e.settingWatch))) {
                    horizontalScrolling = this.tree.options.horizontalScrolling;
                    if (horizontalScrolling) {
                        this.tree.updateOptions({ horizontalScrolling: false });
                    }
                    if (expression.name) {
                        // Only rerender if the input is already done since otherwise the tree is not yet aware of the new element
                        this.tree.rerender(expression);
                    }
                }
                else if (!expression && horizontalScrolling !== undefined) {
                    this.tree.updateOptions({ horizontalScrolling: horizontalScrolling });
                    horizontalScrolling = undefined;
                }
            }));
            this._register(this.debugService.getViewModel().onDidEvaluateLazyExpression(async (e) => {
                if (e instanceof debugModel_1.Variable && this.tree.hasNode(e)) {
                    await this.tree.updateChildren(e, false, true);
                    await this.tree.expand(e);
                }
            }));
        }
        layoutBody(height, width) {
            super.layoutBody(height, width);
            this.tree.layout(height, width);
        }
        focus() {
            this.tree.domFocus();
        }
        collapseAll() {
            this.tree.collapseAll();
        }
        onMouseDblClick(e) {
            if (e.browserEvent.target.className.indexOf('twistie') >= 0) {
                // Ignore double click events on twistie
                return;
            }
            const element = e.element;
            // double click on primitive value: open input box to be able to select and copy value.
            const selectedExpression = this.debugService.getViewModel().getSelectedExpression();
            if (element instanceof debugModel_1.Expression && element !== (selectedExpression === null || selectedExpression === void 0 ? void 0 : selectedExpression.expression)) {
                this.debugService.getViewModel().setSelectedExpression(element, false);
            }
            else if (!element) {
                // Double click in watch panel triggers to add a new watch expression
                this.debugService.addWatchExpression();
            }
        }
        onContextMenu(e) {
            var _a, _b;
            const element = e.element;
            const selection = this.tree.getSelection();
            this.watchItemType.set(element instanceof debugModel_1.Expression ? 'expression' : element instanceof debugModel_1.Variable ? 'variable' : undefined);
            const actions = [];
            const attributes = element instanceof debugModel_1.Variable ? (_a = element.presentationHint) === null || _a === void 0 ? void 0 : _a.attributes : undefined;
            this.variableReadonly.set(!!attributes && attributes.indexOf('readOnly') >= 0 || !!((_b = element === null || element === void 0 ? void 0 : element.presentationHint) === null || _b === void 0 ? void 0 : _b.lazy));
            const actionsDisposable = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(this.menu, { arg: element, shouldForwardArgs: true }, actions);
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => actions,
                getActionsContext: () => element && selection.includes(element) ? selection : element ? [element] : [],
                onHide: () => (0, lifecycle_1.dispose)(actionsDisposable)
            });
        }
    };
    WatchExpressionsView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, instantiation_1.IInstantiationService),
        __param(5, views_1.IViewDescriptorService),
        __param(6, configuration_1.IConfigurationService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, opener_1.IOpenerService),
        __param(9, themeService_1.IThemeService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, actions_1.IMenuService)
    ], WatchExpressionsView);
    exports.WatchExpressionsView = WatchExpressionsView;
    class WatchExpressionsDelegate {
        getHeight(_element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.Expression) {
                return WatchExpressionsRenderer.ID;
            }
            // Variable
            return variablesView_1.VariablesRenderer.ID;
        }
    }
    function isDebugService(element) {
        return typeof element.getConfigurationManager === 'function';
    }
    class WatchExpressionsDataSource {
        hasChildren(element) {
            return isDebugService(element) || element.hasChildren;
        }
        getChildren(element) {
            if (isDebugService(element)) {
                const debugService = element;
                const watchExpressions = debugService.getModel().getWatchExpressions();
                const viewModel = debugService.getViewModel();
                return Promise.all(watchExpressions.map(we => !!we.name && !useCachedEvaluation
                    ? we.evaluate(viewModel.focusedSession, viewModel.focusedStackFrame, 'watch').then(() => we)
                    : Promise.resolve(we)));
            }
            return element.getChildren();
        }
    }
    class WatchExpressionsRenderer extends baseDebugView_1.AbstractExpressionsRenderer {
        get templateId() {
            return WatchExpressionsRenderer.ID;
        }
        renderExpression(expression, data, highlights) {
            const text = typeof expression.value === 'string' ? `${expression.name}:` : expression.name;
            data.label.set(text, highlights, expression.type ? expression.type : expression.value);
            (0, baseDebugView_1.renderExpressionValue)(expression, data.value, {
                showChanged: true,
                maxValueLength: MAX_VALUE_RENDER_LENGTH_IN_VIEWLET,
                showHover: true,
                colorize: true
            });
        }
        getInputBoxOptions(expression, settingValue) {
            if (settingValue) {
                return {
                    initialValue: expression.value,
                    ariaLabel: (0, nls_1.localize)('typeNewValue', "Type new value"),
                    onFinish: async (value, success) => {
                        if (success && value) {
                            const focusedFrame = this.debugService.getViewModel().focusedStackFrame;
                            if (focusedFrame && (expression instanceof debugModel_1.Variable || expression instanceof debugModel_1.Expression)) {
                                await expression.setExpression(value, focusedFrame);
                                this.debugService.getViewModel().updateViews();
                            }
                        }
                    }
                };
            }
            return {
                initialValue: expression.name ? expression.name : '',
                ariaLabel: (0, nls_1.localize)('watchExpressionInputAriaLabel', "Type watch expression"),
                placeholder: (0, nls_1.localize)('watchExpressionPlaceholder', "Expression to watch"),
                onFinish: (value, success) => {
                    if (success && value) {
                        this.debugService.renameWatchExpression(expression.getId(), value);
                        ignoreViewUpdates = true;
                        this.debugService.getViewModel().updateViews();
                        ignoreViewUpdates = false;
                    }
                    else if (!expression.name) {
                        this.debugService.removeWatchExpressions(expression.getId());
                    }
                }
            };
        }
    }
    exports.WatchExpressionsRenderer = WatchExpressionsRenderer;
    WatchExpressionsRenderer.ID = 'watchexpression';
    class WatchExpressionsAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)({ comment: ['Debug is a noun in this context, not a verb.'], key: 'watchAriaTreeLabel' }, "Debug Watch Expressions");
        }
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Expression) {
                return (0, nls_1.localize)('watchExpressionAriaLabel', "{0}, value {1}", element.name, element.value);
            }
            // Variable
            return (0, nls_1.localize)('watchVariableAriaLabel', "{0}, value {1}", element.name, element.value);
        }
    }
    class WatchExpressionsDragAndDrop {
        constructor(debugService) {
            this.debugService = debugService;
        }
        onDragOver(data) {
            if (!(data instanceof listView_1.ElementsDragAndDropData)) {
                return false;
            }
            const expressions = data.elements;
            return expressions.length > 0 && expressions[0] instanceof debugModel_1.Expression;
        }
        getDragURI(element) {
            var _a;
            if (!(element instanceof debugModel_1.Expression) || element === ((_a = this.debugService.getViewModel().getSelectedExpression()) === null || _a === void 0 ? void 0 : _a.expression)) {
                return null;
            }
            return element.getId();
        }
        getDragLabel(elements) {
            if (elements.length === 1) {
                return elements[0].name;
            }
            return undefined;
        }
        drop(data, targetElement) {
            if (!(data instanceof listView_1.ElementsDragAndDropData)) {
                return;
            }
            const draggedElement = data.elements[0];
            const watches = this.debugService.getModel().getWatchExpressions();
            const position = targetElement instanceof debugModel_1.Expression ? watches.indexOf(targetElement) : watches.length - 1;
            this.debugService.moveWatchExpression(draggedElement.getId(), position);
        }
    }
    (0, actions_1.registerAction2)(class Collapse extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'watch.collapse',
                viewId: debug_1.WATCH_VIEW_ID,
                title: (0, nls_1.localize)('collapse', "Collapse All"),
                f1: false,
                icon: codicons_1.Codicon.collapseAll,
                precondition: debug_1.CONTEXT_WATCH_EXPRESSIONS_EXIST,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 30,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', debug_1.WATCH_VIEW_ID)
                }
            });
        }
        runInView(_accessor, view) {
            view.collapseAll();
        }
    });
    exports.ADD_WATCH_ID = 'workbench.debug.viewlet.action.addWatchExpression'; // Use old and long id for backwards compatibility
    exports.ADD_WATCH_LABEL = (0, nls_1.localize)('addWatchExpression', "Add Expression");
    (0, actions_1.registerAction2)(class AddWatchExpressionAction extends actions_1.Action2 {
        constructor() {
            super({
                id: exports.ADD_WATCH_ID,
                title: exports.ADD_WATCH_LABEL,
                f1: false,
                icon: debugIcons_1.watchExpressionsAdd,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', debug_1.WATCH_VIEW_ID)
                }
            });
        }
        run(accessor) {
            const debugService = accessor.get(debug_1.IDebugService);
            debugService.addWatchExpression();
        }
    });
    exports.REMOVE_WATCH_EXPRESSIONS_COMMAND_ID = 'workbench.debug.viewlet.action.removeAllWatchExpressions';
    exports.REMOVE_WATCH_EXPRESSIONS_LABEL = (0, nls_1.localize)('removeAllWatchExpressions', "Remove All Expressions");
    (0, actions_1.registerAction2)(class RemoveAllWatchExpressionsAction extends actions_1.Action2 {
        constructor() {
            super({
                id: exports.REMOVE_WATCH_EXPRESSIONS_COMMAND_ID,
                title: exports.REMOVE_WATCH_EXPRESSIONS_LABEL,
                f1: false,
                icon: debugIcons_1.watchExpressionsRemoveAll,
                precondition: debug_1.CONTEXT_WATCH_EXPRESSIONS_EXIST,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    order: 20,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', debug_1.WATCH_VIEW_ID)
                }
            });
        }
        run(accessor) {
            const debugService = accessor.get(debug_1.IDebugService);
            debugService.removeWatchExpressions();
        }
    });
});
//# sourceMappingURL=watchExpressionsView.js.map