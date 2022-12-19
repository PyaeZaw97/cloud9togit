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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/arrays", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/types", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/clipboard/common/clipboardService", "vs/platform/commands/common/commands", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/progress/common/progress", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/views", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/workbench/contrib/debug/browser/linkDetector", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/extensions/common/extensions"], function (require, exports, dom, highlightedLabel_1, arrays_1, async_1, codicons_1, filters_1, lifecycle_1, types_1, nls_1, menuEntryActionViewItem_1, actions_1, clipboardService_1, commands_1, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, listService_1, notification_1, opener_1, progress_1, telemetry_1, themeService_1, viewPane_1, views_1, baseDebugView_1, linkDetector_1, debug_1, debugModel_1, editorService_1, extensions_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ADD_TO_WATCH_ID = exports.COPY_EVALUATE_PATH_ID = exports.BREAK_WHEN_VALUE_IS_READ_ID = exports.BREAK_WHEN_VALUE_IS_ACCESSED_ID = exports.BREAK_WHEN_VALUE_CHANGES_ID = exports.VIEW_MEMORY_ID = exports.COPY_VALUE_ID = exports.SET_VARIABLE_ID = exports.VariablesRenderer = exports.VariablesDataSource = exports.VariablesView = void 0;
    const $ = dom.$;
    let forgetScopes = true;
    let variableInternalContext;
    let dataBreakpointInfoResponse;
    let VariablesView = class VariablesView extends viewPane_1.ViewPane {
        constructor(options, contextMenuService, debugService, keybindingService, configurationService, instantiationService, viewDescriptorService, contextKeyService, openerService, themeService, telemetryService, menuService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.debugService = debugService;
            this.menuService = menuService;
            this.needsRefresh = false;
            this.savedViewState = new Map();
            this.autoExpandedScopes = new Set();
            // Use scheduler to prevent unnecessary flashing
            this.updateTreeScheduler = new async_1.RunOnceScheduler(async () => {
                const stackFrame = this.debugService.getViewModel().focusedStackFrame;
                this.needsRefresh = false;
                const input = this.tree.getInput();
                if (input) {
                    this.savedViewState.set(input.getId(), this.tree.getViewState());
                }
                if (!stackFrame) {
                    await this.tree.setInput(null);
                    return;
                }
                const viewState = this.savedViewState.get(stackFrame.getId());
                await this.tree.setInput(stackFrame, viewState);
                // Automatically expand the first scope if it is not expensive and if all scopes are collapsed
                const scopes = await stackFrame.getScopes();
                const toExpand = scopes.find(s => !s.expensive);
                if (toExpand && (scopes.every(s => this.tree.isCollapsed(s)) || !this.autoExpandedScopes.has(toExpand.getId()))) {
                    this.autoExpandedScopes.add(toExpand.getId());
                    await this.tree.expand(toExpand);
                }
            }, 400);
        }
        renderBody(container) {
            super.renderBody(container);
            this.element.classList.add('debug-pane');
            container.classList.add('debug-variables');
            const treeContainer = (0, baseDebugView_1.renderViewTree)(container);
            const linkeDetector = this.instantiationService.createInstance(linkDetector_1.LinkDetector);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchAsyncDataTree, 'VariablesView', treeContainer, new VariablesDelegate(), [this.instantiationService.createInstance(VariablesRenderer, linkeDetector), new ScopesRenderer(), new ScopeErrorRenderer()], new VariablesDataSource(), {
                accessibilityProvider: new VariablesAccessibilityProvider(),
                identityProvider: { getId: (element) => element.getId() },
                keyboardNavigationLabelProvider: { getKeyboardNavigationLabel: (e) => e.name },
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            this.tree.setInput((0, types_1.withUndefinedAsNull)(this.debugService.getViewModel().focusedStackFrame));
            debug_1.CONTEXT_VARIABLES_FOCUSED.bindTo(this.tree.contextKeyService);
            this._register(this.debugService.getViewModel().onDidFocusStackFrame(sf => {
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                // Refresh the tree immediately if the user explictly changed stack frames.
                // Otherwise postpone the refresh until user stops stepping.
                const timeout = sf.explicit ? 0 : undefined;
                this.updateTreeScheduler.schedule(timeout);
            }));
            this._register(this.debugService.getViewModel().onWillUpdateViews(() => {
                const stackFrame = this.debugService.getViewModel().focusedStackFrame;
                if (stackFrame && forgetScopes) {
                    stackFrame.forgetScopes();
                }
                forgetScopes = true;
                this.tree.updateChildren();
            }));
            this._register(this.tree.onMouseDblClick(e => this.onMouseDblClick(e)));
            this._register(this.tree.onContextMenu(async (e) => await this.onContextMenu(e)));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.updateTreeScheduler.schedule();
                }
            }));
            let horizontalScrolling;
            this._register(this.debugService.getViewModel().onDidSelectExpression(e => {
                const variable = e === null || e === void 0 ? void 0 : e.expression;
                if (variable instanceof debugModel_1.Variable && !(e === null || e === void 0 ? void 0 : e.settingWatch)) {
                    horizontalScrolling = this.tree.options.horizontalScrolling;
                    if (horizontalScrolling) {
                        this.tree.updateOptions({ horizontalScrolling: false });
                    }
                    this.tree.rerender(variable);
                }
                else if (!e && horizontalScrolling !== undefined) {
                    this.tree.updateOptions({ horizontalScrolling: horizontalScrolling });
                    horizontalScrolling = undefined;
                }
            }));
            this._register(this.debugService.getViewModel().onDidEvaluateLazyExpression(async (e) => {
                if (e instanceof debugModel_1.Variable) {
                    await this.tree.updateChildren(e, false, true);
                    await this.tree.expand(e);
                }
            }));
            this._register(this.debugService.onDidEndSession(() => {
                this.savedViewState.clear();
                this.autoExpandedScopes.clear();
            }));
        }
        layoutBody(width, height) {
            super.layoutBody(height, width);
            this.tree.layout(width, height);
        }
        focus() {
            this.tree.domFocus();
        }
        collapseAll() {
            this.tree.collapseAll();
        }
        onMouseDblClick(e) {
            var _a, _b, _c;
            const session = this.debugService.getViewModel().focusedSession;
            if (session && e.element instanceof debugModel_1.Variable && session.capabilities.supportsSetVariable && !((_b = (_a = e.element.presentationHint) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b.includes('readOnly')) && !((_c = e.element.presentationHint) === null || _c === void 0 ? void 0 : _c.lazy)) {
                this.debugService.getViewModel().setSelectedExpression(e.element, false);
            }
        }
        async onContextMenu(e) {
            const variable = e.element;
            if (!(variable instanceof debugModel_1.Variable) || !variable.value) {
                return;
            }
            const toDispose = new lifecycle_1.DisposableStore();
            try {
                const contextKeyService = toDispose.add(await getContextForVariableMenuWithDataAccess(this.contextKeyService, variable));
                const menu = toDispose.add(this.menuService.createMenu(actions_1.MenuId.DebugVariablesContext, contextKeyService));
                const context = getVariablesContext(variable);
                const secondary = [];
                const actionsDisposable = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { arg: context, shouldForwardArgs: false }, { primary: [], secondary }, 'inline');
                this.contextMenuService.showContextMenu({
                    getAnchor: () => e.anchor,
                    getActions: () => secondary,
                    onHide: () => (0, lifecycle_1.dispose)(actionsDisposable)
                });
            }
            finally {
                toDispose.dispose();
            }
        }
    };
    VariablesView = __decorate([
        __param(1, contextView_1.IContextMenuService),
        __param(2, debug_1.IDebugService),
        __param(3, keybinding_1.IKeybindingService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, instantiation_1.IInstantiationService),
        __param(6, views_1.IViewDescriptorService),
        __param(7, contextkey_1.IContextKeyService),
        __param(8, opener_1.IOpenerService),
        __param(9, themeService_1.IThemeService),
        __param(10, telemetry_1.ITelemetryService),
        __param(11, actions_1.IMenuService)
    ], VariablesView);
    exports.VariablesView = VariablesView;
    const getVariablesContext = (variable) => {
        var _a;
        return ({
            sessionId: (_a = variable.getSession()) === null || _a === void 0 ? void 0 : _a.getId(),
            container: variable.parent instanceof debugModel_1.Expression
                ? { expression: variable.parent.name }
                : variable.parent.toDebugProtocolObject(),
            variable: variable.toDebugProtocolObject()
        });
    };
    /**
     * Gets a context key overlay that has context for the given variable, including data access info.
     */
    async function getContextForVariableMenuWithDataAccess(parentContext, variable) {
        const session = variable.getSession();
        if (!session || !session.capabilities.supportsDataBreakpoints) {
            return getContextForVariableMenu(parentContext, variable);
        }
        const contextKeys = [];
        dataBreakpointInfoResponse = await session.dataBreakpointInfo(variable.name, variable.parent.reference);
        const dataBreakpointId = dataBreakpointInfoResponse === null || dataBreakpointInfoResponse === void 0 ? void 0 : dataBreakpointInfoResponse.dataId;
        const dataBreakpointAccessTypes = dataBreakpointInfoResponse === null || dataBreakpointInfoResponse === void 0 ? void 0 : dataBreakpointInfoResponse.accessTypes;
        if (!dataBreakpointAccessTypes) {
            contextKeys.push([debug_1.CONTEXT_BREAK_WHEN_VALUE_CHANGES_SUPPORTED.key, !!dataBreakpointId]);
        }
        else {
            for (const accessType of dataBreakpointAccessTypes) {
                switch (accessType) {
                    case 'read':
                        contextKeys.push([debug_1.CONTEXT_BREAK_WHEN_VALUE_IS_READ_SUPPORTED.key, !!dataBreakpointId]);
                        break;
                    case 'write':
                        contextKeys.push([debug_1.CONTEXT_BREAK_WHEN_VALUE_CHANGES_SUPPORTED.key, !!dataBreakpointId]);
                        break;
                    case 'readWrite':
                        contextKeys.push([debug_1.CONTEXT_BREAK_WHEN_VALUE_IS_ACCESSED_SUPPORTED.key, !!dataBreakpointId]);
                        break;
                }
            }
        }
        return getContextForVariableMenu(parentContext, variable, contextKeys);
    }
    /**
     * Gets a context key overlay that has context for the given variable.
     */
    function getContextForVariableMenu(parentContext, variable, additionalContext = []) {
        var _a, _b, _c;
        const session = variable.getSession();
        const contextKeys = [
            [debug_1.CONTEXT_DEBUG_PROTOCOL_VARIABLE_MENU_CONTEXT.key, variable.variableMenuContext || ''],
            [debug_1.CONTEXT_VARIABLE_EVALUATE_NAME_PRESENT.key, !!variable.evaluateName],
            [debug_1.CONTEXT_CAN_VIEW_MEMORY.key, !!(session === null || session === void 0 ? void 0 : session.capabilities.supportsReadMemoryRequest) && variable.memoryReference !== undefined],
            [debug_1.CONTEXT_VARIABLE_IS_READONLY.key, !!((_b = (_a = variable.presentationHint) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b.includes('readOnly')) || ((_c = variable.presentationHint) === null || _c === void 0 ? void 0 : _c.lazy)],
            ...additionalContext,
        ];
        variableInternalContext = variable;
        return parentContext.createOverlay(contextKeys);
    }
    function isStackFrame(obj) {
        return obj instanceof debugModel_1.StackFrame;
    }
    class VariablesDataSource {
        hasChildren(element) {
            if (!element) {
                return false;
            }
            if (isStackFrame(element)) {
                return true;
            }
            return element.hasChildren;
        }
        getChildren(element) {
            if (isStackFrame(element)) {
                return element.getScopes();
            }
            return element.getChildren();
        }
    }
    exports.VariablesDataSource = VariablesDataSource;
    class VariablesDelegate {
        getHeight(element) {
            return 22;
        }
        getTemplateId(element) {
            if (element instanceof debugModel_1.ErrorScope) {
                return ScopeErrorRenderer.ID;
            }
            if (element instanceof debugModel_1.Scope) {
                return ScopesRenderer.ID;
            }
            return VariablesRenderer.ID;
        }
    }
    class ScopesRenderer {
        get templateId() {
            return ScopesRenderer.ID;
        }
        renderTemplate(container) {
            const name = dom.append(container, $('.scope'));
            const label = new highlightedLabel_1.HighlightedLabel(name);
            return { name, label };
        }
        renderElement(element, index, templateData) {
            templateData.label.set(element.element.name, (0, filters_1.createMatches)(element.filterData));
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    ScopesRenderer.ID = 'scope';
    class ScopeErrorRenderer {
        get templateId() {
            return ScopeErrorRenderer.ID;
        }
        renderTemplate(container) {
            const wrapper = dom.append(container, $('.scope'));
            const error = dom.append(wrapper, $('.error'));
            return { error };
        }
        renderElement(element, index, templateData) {
            templateData.error.innerText = element.element.name;
        }
        disposeTemplate() {
            // noop
        }
    }
    ScopeErrorRenderer.ID = 'scopeError';
    let VariablesRenderer = class VariablesRenderer extends baseDebugView_1.AbstractExpressionsRenderer {
        constructor(linkDetector, menuService, contextKeyService, debugService, contextViewService, themeService) {
            super(debugService, contextViewService, themeService);
            this.linkDetector = linkDetector;
            this.menuService = menuService;
            this.contextKeyService = contextKeyService;
        }
        get templateId() {
            return VariablesRenderer.ID;
        }
        renderExpression(expression, data, highlights) {
            (0, baseDebugView_1.renderVariable)(expression, data, true, highlights, this.linkDetector);
        }
        getInputBoxOptions(expression) {
            const variable = expression;
            return {
                initialValue: expression.value,
                ariaLabel: (0, nls_1.localize)('variableValueAriaLabel', "Type new variable value"),
                validationOptions: {
                    validation: () => variable.errorMessage ? ({ content: variable.errorMessage }) : null
                },
                onFinish: (value, success) => {
                    variable.errorMessage = undefined;
                    const focusedStackFrame = this.debugService.getViewModel().focusedStackFrame;
                    if (success && variable.value !== value && focusedStackFrame) {
                        variable.setVariable(value, focusedStackFrame)
                            // Need to force watch expressions and variables to update since a variable change can have an effect on both
                            .then(() => {
                            // Do not refresh scopes due to a node limitation #15520
                            forgetScopes = false;
                            this.debugService.getViewModel().updateViews();
                        });
                    }
                }
            };
        }
        renderActionBar(actionBar, expression, data) {
            const variable = expression;
            const contextKeyService = getContextForVariableMenu(this.contextKeyService, variable);
            const menu = this.menuService.createMenu(actions_1.MenuId.DebugVariablesContext, contextKeyService);
            const primary = [];
            const context = getVariablesContext(variable);
            data.elementDisposable.push((0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { arg: context, shouldForwardArgs: false }, { primary, secondary: [] }, 'inline'));
            actionBar.clear();
            actionBar.context = context;
            actionBar.push(primary, { icon: true, label: false });
        }
    };
    VariablesRenderer.ID = 'variable';
    VariablesRenderer = __decorate([
        __param(1, actions_1.IMenuService),
        __param(2, contextkey_1.IContextKeyService),
        __param(3, debug_1.IDebugService),
        __param(4, contextView_1.IContextViewService),
        __param(5, themeService_1.IThemeService)
    ], VariablesRenderer);
    exports.VariablesRenderer = VariablesRenderer;
    class VariablesAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)('variablesAriaTreeLabel', "Debug Variables");
        }
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Scope) {
                return (0, nls_1.localize)('variableScopeAriaLabel', "Scope {0}", element.name);
            }
            if (element instanceof debugModel_1.Variable) {
                return (0, nls_1.localize)({ key: 'variableAriaLabel', comment: ['Placeholders are variable name and variable value respectivly. They should not be translated.'] }, "{0}, value {1}", element.name, element.value);
            }
            return null;
        }
    }
    exports.SET_VARIABLE_ID = 'debug.setVariable';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.SET_VARIABLE_ID,
        handler: (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            debugService.getViewModel().setSelectedExpression(variableInternalContext, false);
        }
    });
    exports.COPY_VALUE_ID = 'workbench.debug.viewlet.action.copyValue';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.COPY_VALUE_ID,
        handler: async (accessor, arg, ctx) => {
            const debugService = accessor.get(debug_1.IDebugService);
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            let elementContext = '';
            let elements;
            if (arg instanceof debugModel_1.Variable || arg instanceof debugModel_1.Expression) {
                elementContext = 'watch';
                elements = ctx ? ctx : [];
            }
            else {
                elementContext = 'variables';
                elements = variableInternalContext ? [variableInternalContext] : [];
            }
            const stackFrame = debugService.getViewModel().focusedStackFrame;
            const session = debugService.getViewModel().focusedSession;
            if (!stackFrame || !session || elements.length === 0) {
                return;
            }
            const evalContext = session.capabilities.supportsClipboardContext ? 'clipboard' : elementContext;
            const toEvaluate = elements.map(element => element instanceof debugModel_1.Variable ? (element.evaluateName || element.value) : element.name);
            try {
                const evaluations = await Promise.all(toEvaluate.map(expr => session.evaluate(expr, stackFrame.frameId, evalContext)));
                const result = (0, arrays_1.coalesce)(evaluations).map(evaluation => evaluation.body.result);
                if (result.length) {
                    clipboardService.writeText(result.join('\n'));
                }
            }
            catch (e) {
                const result = elements.map(element => element.value);
                clipboardService.writeText(result.join('\n'));
            }
        }
    });
    exports.VIEW_MEMORY_ID = 'workbench.debug.viewlet.action.viewMemory';
    const HEX_EDITOR_EXTENSION_ID = 'ms-vscode.hexeditor';
    const HEX_EDITOR_EDITOR_ID = 'hexEditor.hexedit';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.VIEW_MEMORY_ID,
        handler: async (accessor, arg, ctx) => {
            var _a;
            if (!arg.sessionId || !arg.variable.memoryReference) {
                return;
            }
            const commandService = accessor.get(commands_1.ICommandService);
            const editorService = accessor.get(editorService_1.IEditorService);
            const notifications = accessor.get(notification_1.INotificationService);
            const progressService = accessor.get(progress_1.IProgressService);
            const extensionService = accessor.get(extensions_1.IExtensionService);
            const telemetryService = accessor.get(telemetry_1.ITelemetryService);
            const debugService = accessor.get(debug_1.IDebugService);
            const ext = await extensionService.getExtension(HEX_EDITOR_EXTENSION_ID);
            if (ext || await tryInstallHexEditor(notifications, progressService, extensionService, commandService)) {
                /* __GDPR__
                    "debug/didViewMemory" : {
                        "debugType" : { "classification": "SystemMetaData", "purpose": "FeatureInsight" }
                    }
                */
                telemetryService.publicLog('debug/didViewMemory', {
                    debugType: (_a = debugService.getModel().getSession(arg.sessionId)) === null || _a === void 0 ? void 0 : _a.configuration.type,
                });
                await editorService.openEditor({
                    resource: (0, debugModel_1.getUriForDebugMemory)(arg.sessionId, arg.variable.memoryReference),
                    options: {
                        revealIfOpened: true,
                        override: HEX_EDITOR_EDITOR_ID,
                    },
                }, editorService_1.SIDE_GROUP);
            }
        }
    });
    function tryInstallHexEditor(notifications, progressService, extensionService, commandService) {
        return new Promise(resolve => {
            let installing = false;
            const handle = notifications.prompt(notification_1.Severity.Info, (0, nls_1.localize)("viewMemory.prompt", "Inspecting binary data requires the Hex Editor extension. Would you like to install it now?"), [
                {
                    label: (0, nls_1.localize)("cancel", "Cancel"),
                    run: () => resolve(false),
                },
                {
                    label: (0, nls_1.localize)("install", "Install"),
                    run: async () => {
                        installing = true;
                        try {
                            await progressService.withProgress({
                                location: 15 /* ProgressLocation.Notification */,
                                title: (0, nls_1.localize)("viewMemory.install.progress", "Installing the Hex Editor..."),
                            }, async () => {
                                await commandService.executeCommand('workbench.extensions.installExtension', HEX_EDITOR_EXTENSION_ID);
                                // it seems like the extension is not registered immediately on install --
                                // wait for it to appear before returning.
                                while (!(await extensionService.getExtension(HEX_EDITOR_EXTENSION_ID))) {
                                    await (0, async_1.timeout)(30);
                                }
                            });
                            resolve(true);
                        }
                        catch (e) {
                            notifications.error(e);
                            resolve(false);
                        }
                    }
                },
            ], { sticky: true });
            handle.onDidClose(e => {
                if (!installing) {
                    resolve(false);
                }
            });
        });
    }
    exports.BREAK_WHEN_VALUE_CHANGES_ID = 'debug.breakWhenValueChanges';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.BREAK_WHEN_VALUE_CHANGES_ID,
        handler: async (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            if (dataBreakpointInfoResponse) {
                await debugService.addDataBreakpoint(dataBreakpointInfoResponse.description, dataBreakpointInfoResponse.dataId, !!dataBreakpointInfoResponse.canPersist, dataBreakpointInfoResponse.accessTypes, 'write');
            }
        }
    });
    exports.BREAK_WHEN_VALUE_IS_ACCESSED_ID = 'debug.breakWhenValueIsAccessed';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.BREAK_WHEN_VALUE_IS_ACCESSED_ID,
        handler: async (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            if (dataBreakpointInfoResponse) {
                await debugService.addDataBreakpoint(dataBreakpointInfoResponse.description, dataBreakpointInfoResponse.dataId, !!dataBreakpointInfoResponse.canPersist, dataBreakpointInfoResponse.accessTypes, 'readWrite');
            }
        }
    });
    exports.BREAK_WHEN_VALUE_IS_READ_ID = 'debug.breakWhenValueIsRead';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.BREAK_WHEN_VALUE_IS_READ_ID,
        handler: async (accessor) => {
            const debugService = accessor.get(debug_1.IDebugService);
            if (dataBreakpointInfoResponse) {
                await debugService.addDataBreakpoint(dataBreakpointInfoResponse.description, dataBreakpointInfoResponse.dataId, !!dataBreakpointInfoResponse.canPersist, dataBreakpointInfoResponse.accessTypes, 'read');
            }
        }
    });
    exports.COPY_EVALUATE_PATH_ID = 'debug.copyEvaluatePath';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.COPY_EVALUATE_PATH_ID,
        handler: async (accessor, context) => {
            const clipboardService = accessor.get(clipboardService_1.IClipboardService);
            await clipboardService.writeText(context.variable.evaluateName);
        }
    });
    exports.ADD_TO_WATCH_ID = 'debug.addToWatchExpressions';
    commands_1.CommandsRegistry.registerCommand({
        id: exports.ADD_TO_WATCH_ID,
        handler: async (accessor, context) => {
            const debugService = accessor.get(debug_1.IDebugService);
            debugService.addWatchExpression(context.variable.evaluateName);
        }
    });
    (0, actions_1.registerAction2)(class extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'variables.collapse',
                viewId: debug_1.VARIABLES_VIEW_ID,
                title: (0, nls_1.localize)('collapse', "Collapse All"),
                f1: false,
                icon: codicons_1.Codicon.collapseAll,
                menu: {
                    id: actions_1.MenuId.ViewTitle,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', debug_1.VARIABLES_VIEW_ID)
                }
            });
        }
        runInView(_accessor, view) {
            view.collapseAll();
        }
    });
});
//# sourceMappingURL=variablesView.js.map