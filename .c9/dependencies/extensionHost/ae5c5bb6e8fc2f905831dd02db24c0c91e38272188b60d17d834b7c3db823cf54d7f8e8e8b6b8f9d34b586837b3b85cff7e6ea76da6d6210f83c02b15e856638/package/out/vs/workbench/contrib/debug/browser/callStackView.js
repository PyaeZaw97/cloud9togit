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
define(["require", "exports", "vs/base/browser/dom", "vs/base/browser/ui/actionbar/actionbar", "vs/base/browser/ui/highlightedlabel/highlightedLabel", "vs/base/common/actions", "vs/base/common/async", "vs/base/common/codicons", "vs/base/common/event", "vs/base/common/filters", "vs/base/common/lifecycle", "vs/base/common/path", "vs/base/common/strings", "vs/nls", "vs/platform/actions/browser/menuEntryActionViewItem", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/platform/contextview/browser/contextView", "vs/platform/instantiation/common/instantiation", "vs/platform/keybinding/common/keybinding", "vs/platform/label/common/label", "vs/platform/list/browser/listService", "vs/platform/notification/common/notification", "vs/platform/opener/common/opener", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/colorRegistry", "vs/platform/theme/common/styler", "vs/platform/theme/common/themeService", "vs/workbench/browser/parts/views/viewPane", "vs/workbench/common/views", "vs/workbench/contrib/debug/browser/baseDebugView", "vs/workbench/contrib/debug/browser/debugCommands", "vs/workbench/contrib/debug/browser/debugIcons", "vs/workbench/contrib/debug/browser/debugToolBar", "vs/workbench/contrib/debug/common/debug", "vs/workbench/contrib/debug/common/debugModel", "vs/workbench/contrib/debug/common/debugUtils"], function (require, exports, dom, actionbar_1, highlightedLabel_1, actions_1, async_1, codicons_1, event_1, filters_1, lifecycle_1, path_1, strings_1, nls_1, menuEntryActionViewItem_1, actions_2, configuration_1, contextkey_1, contextView_1, instantiation_1, keybinding_1, label_1, listService_1, notification_1, opener_1, telemetry_1, colorRegistry_1, styler_1, themeService_1, viewPane_1, views_1, baseDebugView_1, debugCommands_1, icons, debugToolBar_1, debug_1, debugModel_1, debugUtils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CallStackView = exports.getSpecificSourceName = exports.getContextForContributedActions = exports.getContext = void 0;
    const $ = dom.$;
    function assignSessionContext(element, context) {
        context.sessionId = element.getId();
        return context;
    }
    function assignThreadContext(element, context) {
        context.threadId = element.getId();
        assignSessionContext(element.session, context);
        return context;
    }
    function assignStackFrameContext(element, context) {
        context.frameId = element.getId();
        context.frameName = element.name;
        context.frameLocation = { range: element.range, source: element.source.raw };
        assignThreadContext(element.thread, context);
        return context;
    }
    function getContext(element) {
        if (element instanceof debugModel_1.StackFrame) {
            return assignStackFrameContext(element, {});
        }
        else if (element instanceof debugModel_1.Thread) {
            return assignThreadContext(element, {});
        }
        else if (isDebugSession(element)) {
            return assignSessionContext(element, {});
        }
        else {
            return undefined;
        }
    }
    exports.getContext = getContext;
    // Extensions depend on this context, should not be changed even though it is not fully deterministic
    function getContextForContributedActions(element) {
        if (element instanceof debugModel_1.StackFrame) {
            if (element.source.inMemory) {
                return element.source.raw.path || element.source.reference || element.source.name;
            }
            return element.source.uri.toString();
        }
        if (element instanceof debugModel_1.Thread) {
            return element.threadId;
        }
        if (isDebugSession(element)) {
            return element.getId();
        }
        return '';
    }
    exports.getContextForContributedActions = getContextForContributedActions;
    function getSpecificSourceName(stackFrame) {
        // To reduce flashing of the path name and the way we fetch stack frames
        // We need to compute the source name based on the other frames in the stale call stack
        let callStack = stackFrame.thread.getStaleCallStack();
        callStack = callStack.length > 0 ? callStack : stackFrame.thread.getCallStack();
        const otherSources = callStack.map(sf => sf.source).filter(s => s !== stackFrame.source);
        let suffixLength = 0;
        otherSources.forEach(s => {
            if (s.name === stackFrame.source.name) {
                suffixLength = Math.max(suffixLength, (0, strings_1.commonSuffixLength)(stackFrame.source.uri.path, s.uri.path));
            }
        });
        if (suffixLength === 0) {
            return stackFrame.source.name;
        }
        const from = Math.max(0, stackFrame.source.uri.path.lastIndexOf(path_1.posix.sep, stackFrame.source.uri.path.length - suffixLength - 1));
        return (from > 0 ? '...' : '') + stackFrame.source.uri.path.substring(from);
    }
    exports.getSpecificSourceName = getSpecificSourceName;
    async function expandTo(session, tree) {
        if (session.parentSession) {
            await expandTo(session.parentSession, tree);
        }
        await tree.expand(session);
    }
    let CallStackView = class CallStackView extends viewPane_1.ViewPane {
        constructor(options, contextMenuService, debugService, keybindingService, instantiationService, viewDescriptorService, configurationService, contextKeyService, openerService, themeService, telemetryService, menuService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.options = options;
            this.debugService = debugService;
            this.menuService = menuService;
            this.needsRefresh = false;
            this.ignoreSelectionChangedEvent = false;
            this.ignoreFocusStackFrameEvent = false;
            this.autoExpandedSessions = new Set();
            this.selectionNeedsUpdate = false;
            // Create scheduler to prevent unnecessary flashing of tree when reacting to changes
            this.onCallStackChangeScheduler = this._register(new async_1.RunOnceScheduler(async () => {
                // Only show the global pause message if we do not display threads.
                // Otherwise there will be a pause message per thread and there is no need for a global one.
                const sessions = this.debugService.getModel().getSessions();
                if (sessions.length === 0) {
                    this.autoExpandedSessions.clear();
                }
                const thread = sessions.length === 1 && sessions[0].getAllThreads().length === 1 ? sessions[0].getAllThreads()[0] : undefined;
                const stoppedDetails = sessions.length === 1 ? sessions[0].getStoppedDetails() : undefined;
                if (stoppedDetails && (thread || typeof stoppedDetails.threadId !== 'number')) {
                    this.stateMessageLabel.textContent = stoppedDescription(stoppedDetails);
                    this.stateMessageLabel.title = stoppedText(stoppedDetails);
                    this.stateMessageLabel.classList.toggle('exception', stoppedDetails.reason === 'exception');
                    this.stateMessage.hidden = false;
                }
                else if (sessions.length === 1 && sessions[0].state === 3 /* State.Running */) {
                    this.stateMessageLabel.textContent = (0, nls_1.localize)({ key: 'running', comment: ['indicates state'] }, "Running");
                    this.stateMessageLabel.title = sessions[0].getLabel();
                    this.stateMessageLabel.classList.remove('exception');
                    this.stateMessage.hidden = false;
                }
                else {
                    this.stateMessage.hidden = true;
                }
                this.updateActions();
                this.needsRefresh = false;
                this.dataSource.deemphasizedStackFramesToShow = [];
                await this.tree.updateChildren();
                try {
                    const toExpand = new Set();
                    sessions.forEach(s => {
                        // Automatically expand sessions that have children, but only do this once.
                        if (s.parentSession && !this.autoExpandedSessions.has(s.parentSession)) {
                            toExpand.add(s.parentSession);
                        }
                    });
                    for (const session of toExpand) {
                        await expandTo(session, this.tree);
                        this.autoExpandedSessions.add(session);
                    }
                }
                catch (e) {
                    // Ignore tree expand errors if element no longer present
                }
                if (this.selectionNeedsUpdate) {
                    this.selectionNeedsUpdate = false;
                    await this.updateTreeSelection();
                }
            }, 50));
        }
        renderHeaderTitle(container) {
            super.renderHeaderTitle(container, this.options.title);
            this.stateMessage = dom.append(container, $('span.call-stack-state-message'));
            this.stateMessage.hidden = true;
            this.stateMessageLabel = dom.append(this.stateMessage, $('span.label'));
        }
        renderBody(container) {
            super.renderBody(container);
            this.element.classList.add('debug-pane');
            container.classList.add('debug-call-stack');
            const treeContainer = (0, baseDebugView_1.renderViewTree)(container);
            this.dataSource = new CallStackDataSource(this.debugService);
            this.tree = this.instantiationService.createInstance(listService_1.WorkbenchCompressibleAsyncDataTree, 'CallStackView', treeContainer, new CallStackDelegate(), new CallStackCompressionDelegate(this.debugService), [
                this.instantiationService.createInstance(SessionsRenderer),
                this.instantiationService.createInstance(ThreadsRenderer),
                this.instantiationService.createInstance(StackFramesRenderer),
                new ErrorsRenderer(),
                new LoadAllRenderer(this.themeService),
                new ShowMoreRenderer(this.themeService)
            ], this.dataSource, {
                accessibilityProvider: new CallStackAccessibilityProvider(),
                compressionEnabled: true,
                autoExpandSingleChildren: true,
                identityProvider: {
                    getId: (element) => {
                        if (typeof element === 'string') {
                            return element;
                        }
                        if (element instanceof Array) {
                            return `showMore ${element[0].getId()}`;
                        }
                        return element.getId();
                    }
                },
                keyboardNavigationLabelProvider: {
                    getKeyboardNavigationLabel: (e) => {
                        if (isDebugSession(e)) {
                            return e.getLabel();
                        }
                        if (e instanceof debugModel_1.Thread) {
                            return `${e.name} ${e.stateLabel}`;
                        }
                        if (e instanceof debugModel_1.StackFrame || typeof e === 'string') {
                            return e;
                        }
                        if (e instanceof debugModel_1.ThreadAndSessionIds) {
                            return LoadAllRenderer.LABEL;
                        }
                        return (0, nls_1.localize)('showMoreStackFrames2', "Show More Stack Frames");
                    },
                    getCompressedNodeKeyboardNavigationLabel: (e) => {
                        const firstItem = e[0];
                        if (isDebugSession(firstItem)) {
                            return firstItem.getLabel();
                        }
                        return '';
                    }
                },
                expandOnlyOnTwistieClick: true,
                overrideStyles: {
                    listBackground: this.getBackgroundColor()
                }
            });
            this.tree.setInput(this.debugService.getModel());
            this._register(this.tree.onDidOpen(async (e) => {
                var _a;
                if (this.ignoreSelectionChangedEvent) {
                    return;
                }
                const focusStackFrame = (stackFrame, thread, session, options = {}) => {
                    this.ignoreFocusStackFrameEvent = true;
                    try {
                        this.debugService.focusStackFrame(stackFrame, thread, session, Object.assign(Object.assign({}, options), { explicit: true }));
                    }
                    finally {
                        this.ignoreFocusStackFrameEvent = false;
                    }
                };
                const element = e.element;
                if (element instanceof debugModel_1.StackFrame) {
                    const opts = {
                        preserveFocus: e.editorOptions.preserveFocus,
                        sideBySide: e.sideBySide,
                        pinned: e.editorOptions.pinned
                    };
                    focusStackFrame(element, element.thread, element.thread.session, opts);
                }
                if (element instanceof debugModel_1.Thread) {
                    focusStackFrame(undefined, element, element.session);
                }
                if (isDebugSession(element)) {
                    focusStackFrame(undefined, undefined, element);
                }
                if (element instanceof debugModel_1.ThreadAndSessionIds) {
                    const session = this.debugService.getModel().getSession(element.sessionId);
                    const thread = session && session.getThread(element.threadId);
                    if (thread) {
                        const totalFrames = (_a = thread.stoppedDetails) === null || _a === void 0 ? void 0 : _a.totalFrames;
                        const remainingFramesCount = typeof totalFrames === 'number' ? (totalFrames - thread.getCallStack().length) : undefined;
                        // Get all the remaining frames
                        await thread.fetchCallStack(remainingFramesCount);
                        await this.tree.updateChildren();
                    }
                }
                if (element instanceof Array) {
                    this.dataSource.deemphasizedStackFramesToShow.push(...element);
                    this.tree.updateChildren();
                }
            }));
            this._register(this.debugService.getModel().onDidChangeCallStack(() => {
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                if (!this.onCallStackChangeScheduler.isScheduled()) {
                    this.onCallStackChangeScheduler.schedule();
                }
            }));
            const onFocusChange = event_1.Event.any(this.debugService.getViewModel().onDidFocusStackFrame, this.debugService.getViewModel().onDidFocusSession);
            this._register(onFocusChange(async () => {
                if (this.ignoreFocusStackFrameEvent) {
                    return;
                }
                if (!this.isBodyVisible()) {
                    this.needsRefresh = true;
                    return;
                }
                if (this.onCallStackChangeScheduler.isScheduled()) {
                    this.selectionNeedsUpdate = true;
                    return;
                }
                await this.updateTreeSelection();
            }));
            this._register(this.tree.onContextMenu(e => this.onContextMenu(e)));
            // Schedule the update of the call stack tree if the viewlet is opened after a session started #14684
            if (this.debugService.state === 2 /* State.Stopped */) {
                this.onCallStackChangeScheduler.schedule(0);
            }
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible && this.needsRefresh) {
                    this.onCallStackChangeScheduler.schedule();
                }
            }));
            this._register(this.debugService.onDidNewSession(s => {
                const sessionListeners = [];
                sessionListeners.push(s.onDidChangeName(() => {
                    // this.tree.updateChildren is called on a delay after a session is added,
                    // so don't rerender if the tree doesn't have the node yet
                    if (this.tree.hasNode(s)) {
                        this.tree.rerender(s);
                    }
                }));
                sessionListeners.push(s.onDidEndAdapter(() => (0, lifecycle_1.dispose)(sessionListeners)));
                if (s.parentSession) {
                    // A session we already expanded has a new child session, allow to expand it again.
                    this.autoExpandedSessions.delete(s.parentSession);
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
        async updateTreeSelection() {
            if (!this.tree || !this.tree.getInput()) {
                // Tree not initialized yet
                return;
            }
            const updateSelectionAndReveal = (element) => {
                this.ignoreSelectionChangedEvent = true;
                try {
                    this.tree.setSelection([element]);
                    // If the element is outside of the screen bounds,
                    // position it in the middle
                    if (this.tree.getRelativeTop(element) === null) {
                        this.tree.reveal(element, 0.5);
                    }
                    else {
                        this.tree.reveal(element);
                    }
                }
                catch (e) { }
                finally {
                    this.ignoreSelectionChangedEvent = false;
                }
            };
            const thread = this.debugService.getViewModel().focusedThread;
            const session = this.debugService.getViewModel().focusedSession;
            const stackFrame = this.debugService.getViewModel().focusedStackFrame;
            if (!thread) {
                if (!session) {
                    this.tree.setSelection([]);
                }
                else {
                    updateSelectionAndReveal(session);
                }
            }
            else {
                // Ignore errors from this expansions because we are not aware if we rendered the threads and sessions or we hide them to declutter the view
                try {
                    await expandTo(thread.session, this.tree);
                }
                catch (e) { }
                try {
                    await this.tree.expand(thread);
                }
                catch (e) { }
                const toReveal = stackFrame || session;
                if (toReveal) {
                    updateSelectionAndReveal(toReveal);
                }
            }
        }
        onContextMenu(e) {
            const element = e.element;
            let overlay = [];
            if (isDebugSession(element)) {
                overlay = getSessionContextOverlay(element);
            }
            else if (element instanceof debugModel_1.Thread) {
                overlay = getThreadContextOverlay(element);
            }
            else if (element instanceof debugModel_1.StackFrame) {
                overlay = getStackFrameContextOverlay(element);
            }
            const primary = [];
            const secondary = [];
            const result = { primary, secondary };
            const contextKeyService = this.contextKeyService.createOverlay(overlay);
            const menu = this.menuService.createMenu(actions_2.MenuId.DebugCallStackContext, contextKeyService);
            const actionsDisposable = (0, menuEntryActionViewItem_1.createAndFillInContextMenuActions)(menu, { arg: getContextForContributedActions(element), shouldForwardArgs: true }, result, 'inline');
            this.contextMenuService.showContextMenu({
                getAnchor: () => e.anchor,
                getActions: () => result.secondary,
                getActionsContext: () => getContext(element),
                onHide: () => (0, lifecycle_1.dispose)(actionsDisposable)
            });
        }
    };
    CallStackView = __decorate([
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
        __param(11, actions_2.IMenuService)
    ], CallStackView);
    exports.CallStackView = CallStackView;
    function getSessionContextOverlay(session) {
        return [
            [debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.key, 'session'],
            [debug_1.CONTEXT_CALLSTACK_SESSION_IS_ATTACH.key, (0, debugUtils_1.isSessionAttach)(session)],
            [debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED.key, session.state === 2 /* State.Stopped */],
            [debug_1.CONTEXT_CALLSTACK_SESSION_HAS_ONE_THREAD.key, session.getAllThreads().length === 1],
        ];
    }
    let SessionsRenderer = class SessionsRenderer {
        constructor(instantiationService, contextKeyService, menuService) {
            this.instantiationService = instantiationService;
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
        }
        get templateId() {
            return SessionsRenderer.ID;
        }
        renderTemplate(container) {
            const session = dom.append(container, $('.session'));
            dom.append(session, $(themeService_1.ThemeIcon.asCSSSelector(icons.callstackViewSession)));
            const name = dom.append(session, $('.name'));
            const stateLabel = dom.append(session, $('span.state.label.monaco-count-badge.long'));
            const label = new highlightedLabel_1.HighlightedLabel(name);
            const templateDisposable = new lifecycle_1.DisposableStore();
            const stopActionViewItemDisposables = templateDisposable.add(new lifecycle_1.DisposableStore());
            const actionBar = templateDisposable.add(new actionbar_1.ActionBar(session, {
                actionViewItemProvider: action => {
                    if ((action.id === debugCommands_1.STOP_ID || action.id === debugCommands_1.DISCONNECT_ID) && action instanceof actions_2.MenuItemAction) {
                        stopActionViewItemDisposables.clear();
                        const item = this.instantiationService.invokeFunction(accessor => (0, debugToolBar_1.createDisconnectMenuItemAction)(action, stopActionViewItemDisposables, accessor));
                        if (item) {
                            return item;
                        }
                    }
                    if (action instanceof actions_2.MenuItemAction) {
                        return this.instantiationService.createInstance(menuEntryActionViewItem_1.MenuEntryActionViewItem, action, undefined);
                    }
                    else if (action instanceof actions_2.SubmenuItemAction) {
                        return this.instantiationService.createInstance(menuEntryActionViewItem_1.SubmenuEntryActionViewItem, action, undefined);
                    }
                    return undefined;
                }
            }));
            const elementDisposable = templateDisposable.add(new lifecycle_1.DisposableStore());
            return { session, name, stateLabel, label, actionBar, elementDisposable, templateDisposable };
        }
        renderElement(element, _, data) {
            this.doRenderElement(element.element, (0, filters_1.createMatches)(element.filterData), data);
        }
        renderCompressedElements(node, _index, templateData) {
            const lastElement = node.element.elements[node.element.elements.length - 1];
            const matches = (0, filters_1.createMatches)(node.filterData);
            this.doRenderElement(lastElement, matches, templateData);
        }
        doRenderElement(session, matches, data) {
            data.session.title = (0, nls_1.localize)({ key: 'session', comment: ['Session is a noun'] }, "Session");
            data.label.set(session.getLabel(), matches);
            const stoppedDetails = session.getStoppedDetails();
            const thread = session.getAllThreads().find(t => t.stopped);
            const contextKeyService = this.contextKeyService.createOverlay(getSessionContextOverlay(session));
            const menu = data.elementDisposable.add(this.menuService.createMenu(actions_2.MenuId.DebugCallStackContext, contextKeyService));
            const menuDisposables = data.elementDisposable.add(new lifecycle_1.DisposableStore());
            const setupActionBar = () => {
                menuDisposables.clear();
                data.actionBar.clear();
                const primary = [];
                const secondary = [];
                const result = { primary, secondary };
                menuDisposables.add((0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { arg: getContextForContributedActions(session), shouldForwardArgs: true }, result, 'inline'));
                data.actionBar.push(primary, { icon: true, label: false });
                // We need to set our internal context on the action bar, since our commands depend on that one
                // While the external context our extensions rely on
                data.actionBar.context = getContext(session);
            };
            data.elementDisposable.add(menu.onDidChange(() => setupActionBar()));
            setupActionBar();
            data.stateLabel.style.display = '';
            if (stoppedDetails) {
                data.stateLabel.textContent = stoppedDescription(stoppedDetails);
                data.session.title = `${session.getLabel()}: ${stoppedText(stoppedDetails)}`;
                data.stateLabel.classList.toggle('exception', stoppedDetails.reason === 'exception');
            }
            else if (thread && thread.stoppedDetails) {
                data.stateLabel.textContent = stoppedDescription(thread.stoppedDetails);
                data.session.title = `${session.getLabel()}: ${stoppedText(thread.stoppedDetails)}`;
                data.stateLabel.classList.toggle('exception', thread.stoppedDetails.reason === 'exception');
            }
            else {
                data.stateLabel.textContent = (0, nls_1.localize)({ key: 'running', comment: ['indicates state'] }, "Running");
                data.stateLabel.classList.remove('exception');
            }
        }
        disposeTemplate(templateData) {
            templateData.templateDisposable.dispose();
        }
        disposeElement(_element, _, templateData) {
            templateData.elementDisposable.clear();
        }
    };
    SessionsRenderer.ID = 'session';
    SessionsRenderer = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, contextkey_1.IContextKeyService),
        __param(2, actions_2.IMenuService)
    ], SessionsRenderer);
    function getThreadContextOverlay(thread) {
        return [
            [debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.key, 'thread'],
            [debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED.key, thread.stopped]
        ];
    }
    let ThreadsRenderer = class ThreadsRenderer {
        constructor(contextKeyService, menuService) {
            this.contextKeyService = contextKeyService;
            this.menuService = menuService;
        }
        get templateId() {
            return ThreadsRenderer.ID;
        }
        renderTemplate(container) {
            const thread = dom.append(container, $('.thread'));
            const name = dom.append(thread, $('.name'));
            const stateLabel = dom.append(thread, $('span.state.label.monaco-count-badge.long'));
            const label = new highlightedLabel_1.HighlightedLabel(name);
            const templateDisposable = new lifecycle_1.DisposableStore();
            const actionBar = templateDisposable.add(new actionbar_1.ActionBar(thread));
            const elementDisposable = templateDisposable.add(new lifecycle_1.DisposableStore());
            return { thread, name, stateLabel, label, actionBar, elementDisposable, templateDisposable };
        }
        renderElement(element, _index, data) {
            var _a;
            const thread = element.element;
            data.thread.title = thread.name;
            data.label.set(thread.name, (0, filters_1.createMatches)(element.filterData));
            data.stateLabel.textContent = thread.stateLabel;
            data.stateLabel.classList.toggle('exception', ((_a = thread.stoppedDetails) === null || _a === void 0 ? void 0 : _a.reason) === 'exception');
            const contextKeyService = this.contextKeyService.createOverlay(getThreadContextOverlay(thread));
            const menu = data.elementDisposable.add(this.menuService.createMenu(actions_2.MenuId.DebugCallStackContext, contextKeyService));
            const menuDisposables = data.elementDisposable.add(new lifecycle_1.DisposableStore());
            const setupActionBar = () => {
                menuDisposables.clear();
                data.actionBar.clear();
                const primary = [];
                const secondary = [];
                const result = { primary, secondary };
                menuDisposables.add((0, menuEntryActionViewItem_1.createAndFillInActionBarActions)(menu, { arg: getContextForContributedActions(thread), shouldForwardArgs: true }, result, 'inline'));
                data.actionBar.push(primary, { icon: true, label: false });
                // We need to set our internal context on the action bar, since our commands depend on that one
                // While the external context our extensions rely on
                data.actionBar.context = getContext(thread);
            };
            data.elementDisposable.add(menu.onDidChange(() => setupActionBar()));
            setupActionBar();
        }
        renderCompressedElements(_node, _index, _templateData, _height) {
            throw new Error('Method not implemented.');
        }
        disposeElement(_element, _index, templateData) {
            templateData.elementDisposable.clear();
        }
        disposeTemplate(templateData) {
            templateData.templateDisposable.dispose();
        }
    };
    ThreadsRenderer.ID = 'thread';
    ThreadsRenderer = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, actions_2.IMenuService)
    ], ThreadsRenderer);
    function getStackFrameContextOverlay(stackFrame) {
        return [
            [debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.key, 'stackFrame'],
            [debug_1.CONTEXT_STACK_FRAME_SUPPORTS_RESTART.key, stackFrame.canRestart]
        ];
    }
    let StackFramesRenderer = class StackFramesRenderer {
        constructor(labelService, notificationService) {
            this.labelService = labelService;
            this.notificationService = notificationService;
        }
        get templateId() {
            return StackFramesRenderer.ID;
        }
        renderTemplate(container) {
            const stackFrame = dom.append(container, $('.stack-frame'));
            const labelDiv = dom.append(stackFrame, $('span.label.expression'));
            const file = dom.append(stackFrame, $('.file'));
            const fileName = dom.append(file, $('span.file-name'));
            const wrapper = dom.append(file, $('span.line-number-wrapper'));
            const lineNumber = dom.append(wrapper, $('span.line-number.monaco-count-badge'));
            const label = new highlightedLabel_1.HighlightedLabel(labelDiv);
            const templateDisposable = new lifecycle_1.DisposableStore();
            const actionBar = templateDisposable.add(new actionbar_1.ActionBar(stackFrame));
            return { file, fileName, label, lineNumber, stackFrame, actionBar, templateDisposable };
        }
        renderElement(element, index, data) {
            const stackFrame = element.element;
            data.stackFrame.classList.toggle('disabled', !stackFrame.source || !stackFrame.source.available || isDeemphasized(stackFrame));
            data.stackFrame.classList.toggle('label', stackFrame.presentationHint === 'label');
            data.stackFrame.classList.toggle('subtle', stackFrame.presentationHint === 'subtle');
            const hasActions = !!stackFrame.thread.session.capabilities.supportsRestartFrame && stackFrame.presentationHint !== 'label' && stackFrame.presentationHint !== 'subtle' && stackFrame.canRestart;
            data.stackFrame.classList.toggle('has-actions', hasActions);
            data.file.title = stackFrame.source.inMemory ? stackFrame.source.uri.path : this.labelService.getUriLabel(stackFrame.source.uri);
            if (stackFrame.source.raw.origin) {
                data.file.title += `\n${stackFrame.source.raw.origin}`;
            }
            data.label.set(stackFrame.name, (0, filters_1.createMatches)(element.filterData), stackFrame.name);
            data.fileName.textContent = getSpecificSourceName(stackFrame);
            if (stackFrame.range.startLineNumber !== undefined) {
                data.lineNumber.textContent = `${stackFrame.range.startLineNumber}`;
                if (stackFrame.range.startColumn) {
                    data.lineNumber.textContent += `:${stackFrame.range.startColumn}`;
                }
                data.lineNumber.classList.remove('unavailable');
            }
            else {
                data.lineNumber.classList.add('unavailable');
            }
            data.actionBar.clear();
            if (hasActions) {
                const action = new actions_1.Action('debug.callStack.restartFrame', (0, nls_1.localize)('restartFrame', "Restart Frame"), themeService_1.ThemeIcon.asClassName(icons.debugRestartFrame), true, async () => {
                    try {
                        await stackFrame.restart();
                    }
                    catch (e) {
                        this.notificationService.error(e);
                    }
                });
                data.actionBar.push(action, { icon: true, label: false });
            }
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Method not implemented.');
        }
        disposeTemplate(templateData) {
            templateData.actionBar.dispose();
        }
    };
    StackFramesRenderer.ID = 'stackFrame';
    StackFramesRenderer = __decorate([
        __param(0, label_1.ILabelService),
        __param(1, notification_1.INotificationService)
    ], StackFramesRenderer);
    class ErrorsRenderer {
        get templateId() {
            return ErrorsRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.error'));
            return { label };
        }
        renderElement(element, index, data) {
            const error = element.element;
            data.label.textContent = error;
            data.label.title = error;
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Method not implemented.');
        }
        disposeTemplate(templateData) {
            // noop
        }
    }
    ErrorsRenderer.ID = 'error';
    class LoadAllRenderer {
        constructor(themeService) {
            this.themeService = themeService;
        }
        get templateId() {
            return LoadAllRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.load-all'));
            const toDispose = (0, styler_1.attachStylerCallback)(this.themeService, { textLinkForeground: colorRegistry_1.textLinkForeground }, colors => {
                if (colors.textLinkForeground) {
                    label.style.color = colors.textLinkForeground.toString();
                }
            });
            return { label, toDispose };
        }
        renderElement(element, index, data) {
            data.label.textContent = LoadAllRenderer.LABEL;
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Method not implemented.');
        }
        disposeTemplate(templateData) {
            templateData.toDispose.dispose();
        }
    }
    LoadAllRenderer.ID = 'loadAll';
    LoadAllRenderer.LABEL = (0, nls_1.localize)('loadAllStackFrames', "Load All Stack Frames");
    class ShowMoreRenderer {
        constructor(themeService) {
            this.themeService = themeService;
        }
        get templateId() {
            return ShowMoreRenderer.ID;
        }
        renderTemplate(container) {
            const label = dom.append(container, $('.show-more'));
            const toDispose = (0, styler_1.attachStylerCallback)(this.themeService, { textLinkForeground: colorRegistry_1.textLinkForeground }, colors => {
                if (colors.textLinkForeground) {
                    label.style.color = colors.textLinkForeground.toString();
                }
            });
            return { label, toDispose };
        }
        renderElement(element, index, data) {
            const stackFrames = element.element;
            if (stackFrames.every(sf => !!(sf.source && sf.source.origin && sf.source.origin === stackFrames[0].source.origin))) {
                data.label.textContent = (0, nls_1.localize)('showMoreAndOrigin', "Show {0} More: {1}", stackFrames.length, stackFrames[0].source.origin);
            }
            else {
                data.label.textContent = (0, nls_1.localize)('showMoreStackFrames', "Show {0} More Stack Frames", stackFrames.length);
            }
        }
        renderCompressedElements(node, index, templateData, height) {
            throw new Error('Method not implemented.');
        }
        disposeTemplate(templateData) {
            templateData.toDispose.dispose();
        }
    }
    ShowMoreRenderer.ID = 'showMore';
    class CallStackDelegate {
        getHeight(element) {
            if (element instanceof debugModel_1.StackFrame && element.presentationHint === 'label') {
                return 16;
            }
            if (element instanceof debugModel_1.ThreadAndSessionIds || element instanceof Array) {
                return 16;
            }
            return 22;
        }
        getTemplateId(element) {
            if (isDebugSession(element)) {
                return SessionsRenderer.ID;
            }
            if (element instanceof debugModel_1.Thread) {
                return ThreadsRenderer.ID;
            }
            if (element instanceof debugModel_1.StackFrame) {
                return StackFramesRenderer.ID;
            }
            if (typeof element === 'string') {
                return ErrorsRenderer.ID;
            }
            if (element instanceof debugModel_1.ThreadAndSessionIds) {
                return LoadAllRenderer.ID;
            }
            // element instanceof Array
            return ShowMoreRenderer.ID;
        }
    }
    function stoppedText(stoppedDetails) {
        var _a;
        return (_a = stoppedDetails.text) !== null && _a !== void 0 ? _a : stoppedDescription(stoppedDetails);
    }
    function stoppedDescription(stoppedDetails) {
        return stoppedDetails.description ||
            (stoppedDetails.reason ? (0, nls_1.localize)({ key: 'pausedOn', comment: ['indicates reason for program being paused'] }, "Paused on {0}", stoppedDetails.reason) : (0, nls_1.localize)('paused', "Paused"));
    }
    function isDebugModel(obj) {
        return typeof obj.getSessions === 'function';
    }
    function isDebugSession(obj) {
        return obj && typeof obj.getAllThreads === 'function';
    }
    function isDeemphasized(frame) {
        return frame.source.presentationHint === 'deemphasize' || frame.presentationHint === 'deemphasize';
    }
    class CallStackDataSource {
        constructor(debugService) {
            this.debugService = debugService;
            this.deemphasizedStackFramesToShow = [];
        }
        hasChildren(element) {
            if (isDebugSession(element)) {
                const threads = element.getAllThreads();
                return (threads.length > 1) || (threads.length === 1 && threads[0].stopped) || !!(this.debugService.getModel().getSessions().find(s => s.parentSession === element));
            }
            return isDebugModel(element) || (element instanceof debugModel_1.Thread && element.stopped);
        }
        async getChildren(element) {
            if (isDebugModel(element)) {
                const sessions = element.getSessions();
                if (sessions.length === 0) {
                    return Promise.resolve([]);
                }
                if (sessions.length > 1 || this.debugService.getViewModel().isMultiSessionView()) {
                    return Promise.resolve(sessions.filter(s => !s.parentSession));
                }
                const threads = sessions[0].getAllThreads();
                // Only show the threads in the call stack if there is more than 1 thread.
                return threads.length === 1 ? this.getThreadChildren(threads[0]) : Promise.resolve(threads);
            }
            else if (isDebugSession(element)) {
                const childSessions = this.debugService.getModel().getSessions().filter(s => s.parentSession === element);
                const threads = element.getAllThreads();
                if (threads.length === 1) {
                    // Do not show thread when there is only one to be compact.
                    const children = await this.getThreadChildren(threads[0]);
                    return children.concat(childSessions);
                }
                return Promise.resolve(threads.concat(childSessions));
            }
            else {
                return this.getThreadChildren(element);
            }
        }
        getThreadChildren(thread) {
            return this.getThreadCallstack(thread).then(children => {
                // Check if some stack frames should be hidden under a parent element since they are deemphasized
                const result = [];
                children.forEach((child, index) => {
                    if (child instanceof debugModel_1.StackFrame && child.source && isDeemphasized(child)) {
                        // Check if the user clicked to show the deemphasized source
                        if (this.deemphasizedStackFramesToShow.indexOf(child) === -1) {
                            if (result.length) {
                                const last = result[result.length - 1];
                                if (last instanceof Array) {
                                    // Collect all the stackframes that will be "collapsed"
                                    last.push(child);
                                    return;
                                }
                            }
                            const nextChild = index < children.length - 1 ? children[index + 1] : undefined;
                            if (nextChild instanceof debugModel_1.StackFrame && nextChild.source && isDeemphasized(nextChild)) {
                                // Start collecting stackframes that will be "collapsed"
                                result.push([child]);
                                return;
                            }
                        }
                    }
                    result.push(child);
                });
                return result;
            });
        }
        async getThreadCallstack(thread) {
            let callStack = thread.getCallStack();
            if (!callStack || !callStack.length) {
                await thread.fetchCallStack();
                callStack = thread.getCallStack();
            }
            if (callStack.length === 1 && thread.session.capabilities.supportsDelayedStackTraceLoading && thread.stoppedDetails && thread.stoppedDetails.totalFrames && thread.stoppedDetails.totalFrames > 1) {
                // To reduce flashing of the call stack view simply append the stale call stack
                // once we have the correct data the tree will refresh and we will no longer display it.
                callStack = callStack.concat(thread.getStaleCallStack().slice(1));
            }
            if (thread.stoppedDetails && thread.stoppedDetails.framesErrorMessage) {
                callStack = callStack.concat([thread.stoppedDetails.framesErrorMessage]);
            }
            if (!thread.reachedEndOfCallStack && thread.stoppedDetails) {
                callStack = callStack.concat([new debugModel_1.ThreadAndSessionIds(thread.session.getId(), thread.threadId)]);
            }
            return callStack;
        }
    }
    class CallStackAccessibilityProvider {
        getWidgetAriaLabel() {
            return (0, nls_1.localize)({ comment: ['Debug is a noun in this context, not a verb.'], key: 'callStackAriaLabel' }, "Debug Call Stack");
        }
        getAriaLabel(element) {
            if (element instanceof debugModel_1.Thread) {
                return (0, nls_1.localize)({ key: 'threadAriaLabel', comment: ['Placeholders stand for the thread name and the thread state.For example "Thread 1" and "Stopped'] }, "Thread {0} {1}", element.name, element.stateLabel);
            }
            if (element instanceof debugModel_1.StackFrame) {
                return (0, nls_1.localize)('stackFrameAriaLabel', "Stack Frame {0}, line {1}, {2}", element.name, element.range.startLineNumber, getSpecificSourceName(element));
            }
            if (isDebugSession(element)) {
                const thread = element.getAllThreads().find(t => t.stopped);
                const state = thread ? thread.stateLabel : (0, nls_1.localize)({ key: 'running', comment: ['indicates state'] }, "Running");
                return (0, nls_1.localize)({ key: 'sessionLabel', comment: ['Placeholders stand for the session name and the session state. For example "Launch Program" and "Running"'] }, "Session {0} {1}", element.getLabel(), state);
            }
            if (typeof element === 'string') {
                return element;
            }
            if (element instanceof Array) {
                return (0, nls_1.localize)('showMoreStackFrames', "Show {0} More Stack Frames", element.length);
            }
            // element instanceof ThreadAndSessionIds
            return LoadAllRenderer.LABEL;
        }
    }
    class CallStackCompressionDelegate {
        constructor(debugService) {
            this.debugService = debugService;
        }
        isIncompressible(stat) {
            if (isDebugSession(stat)) {
                if (stat.compact) {
                    return false;
                }
                const sessions = this.debugService.getModel().getSessions();
                if (sessions.some(s => s.parentSession === stat && s.compact)) {
                    return false;
                }
                return true;
            }
            return true;
        }
    }
    (0, actions_2.registerAction2)(class Collapse extends viewPane_1.ViewAction {
        constructor() {
            super({
                id: 'callStack.collapse',
                viewId: debug_1.CALLSTACK_VIEW_ID,
                title: (0, nls_1.localize)('collapse', "Collapse All"),
                f1: false,
                icon: codicons_1.Codicon.collapseAll,
                precondition: debug_1.CONTEXT_DEBUG_STATE.isEqualTo((0, debug_1.getStateLabel)(2 /* State.Stopped */)),
                menu: {
                    id: actions_2.MenuId.ViewTitle,
                    order: 10,
                    group: 'navigation',
                    when: contextkey_1.ContextKeyExpr.equals('view', debug_1.CALLSTACK_VIEW_ID)
                }
            });
        }
        runInView(_accessor, view) {
            view.collapseAll();
        }
    });
    function registerCallStackInlineMenuItem(id, title, icon, when, order, precondition) {
        actions_2.MenuRegistry.appendMenuItem(actions_2.MenuId.DebugCallStackContext, {
            group: 'inline',
            order,
            when,
            command: { id, title, icon, precondition }
        });
    }
    const threadOrSessionWithOneThread = contextkey_1.ContextKeyExpr.or(debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('thread'), contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session'), debug_1.CONTEXT_CALLSTACK_SESSION_HAS_ONE_THREAD));
    registerCallStackInlineMenuItem(debugCommands_1.PAUSE_ID, debugCommands_1.PAUSE_LABEL, icons.debugPause, contextkey_1.ContextKeyExpr.and(threadOrSessionWithOneThread, debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED.toNegated()), 10);
    registerCallStackInlineMenuItem(debugCommands_1.CONTINUE_ID, debugCommands_1.CONTINUE_LABEL, icons.debugContinue, contextkey_1.ContextKeyExpr.and(threadOrSessionWithOneThread, debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED), 10);
    registerCallStackInlineMenuItem(debugCommands_1.STEP_OVER_ID, debugCommands_1.STEP_OVER_LABEL, icons.debugStepOver, threadOrSessionWithOneThread, 20, debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED);
    registerCallStackInlineMenuItem(debugCommands_1.STEP_INTO_ID, debugCommands_1.STEP_INTO_LABEL, icons.debugStepInto, threadOrSessionWithOneThread, 30, debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED);
    registerCallStackInlineMenuItem(debugCommands_1.STEP_OUT_ID, debugCommands_1.STEP_OUT_LABEL, icons.debugStepOut, threadOrSessionWithOneThread, 40, debug_1.CONTEXT_CALLSTACK_ITEM_STOPPED);
    registerCallStackInlineMenuItem(debugCommands_1.RESTART_SESSION_ID, debugCommands_1.RESTART_LABEL, icons.debugRestart, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session'), 50);
    registerCallStackInlineMenuItem(debugCommands_1.STOP_ID, debugCommands_1.STOP_LABEL, icons.debugStop, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_CALLSTACK_SESSION_IS_ATTACH.toNegated(), debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session')), 60);
    registerCallStackInlineMenuItem(debugCommands_1.DISCONNECT_ID, debugCommands_1.DISCONNECT_LABEL, icons.debugDisconnect, contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_CALLSTACK_SESSION_IS_ATTACH, debug_1.CONTEXT_CALLSTACK_ITEM_TYPE.isEqualTo('session')), 60);
});
//# sourceMappingURL=callStackView.js.map