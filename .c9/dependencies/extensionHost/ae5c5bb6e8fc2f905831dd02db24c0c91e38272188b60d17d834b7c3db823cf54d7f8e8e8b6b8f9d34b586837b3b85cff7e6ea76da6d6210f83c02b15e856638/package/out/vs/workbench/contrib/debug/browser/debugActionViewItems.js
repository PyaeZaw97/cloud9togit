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
define(["require", "exports", "vs/nls", "vs/base/browser/dom", "vs/base/browser/keyboardEvent", "vs/base/browser/ui/selectBox/selectBox", "vs/platform/configuration/common/configuration", "vs/platform/commands/common/commands", "vs/workbench/contrib/debug/common/debug", "vs/platform/theme/common/themeService", "vs/platform/theme/common/styler", "vs/platform/theme/common/colorRegistry", "vs/platform/contextview/browser/contextView", "vs/platform/workspace/common/workspace", "vs/base/common/lifecycle", "vs/workbench/contrib/debug/browser/debugCommands", "vs/base/browser/ui/actionbar/actionViewItems", "vs/workbench/contrib/debug/browser/debugIcons", "vs/platform/keybinding/common/keybinding"], function (require, exports, nls, dom, keyboardEvent_1, selectBox_1, configuration_1, commands_1, debug_1, themeService_1, styler_1, colorRegistry_1, contextView_1, workspace_1, lifecycle_1, debugCommands_1, actionViewItems_1, debugIcons_1, keybinding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FocusSessionActionViewItem = exports.StartDebugActionViewItem = void 0;
    const $ = dom.$;
    let StartDebugActionViewItem = class StartDebugActionViewItem extends actionViewItems_1.BaseActionViewItem {
        constructor(context, action, debugService, themeService, configurationService, commandService, contextService, contextViewService, keybindingService) {
            super(context, action);
            this.context = context;
            this.debugService = debugService;
            this.themeService = themeService;
            this.configurationService = configurationService;
            this.commandService = commandService;
            this.contextService = contextService;
            this.keybindingService = keybindingService;
            this.debugOptions = [];
            this.selected = 0;
            this.providers = [];
            this.toDispose = [];
            this.selectBox = new selectBox_1.SelectBox([], -1, contextViewService, undefined, { ariaLabel: nls.localize('debugLaunchConfigurations', 'Debug Launch Configurations') });
            this.selectBox.setFocusable(false);
            this.toDispose.push(this.selectBox);
            this.toDispose.push((0, styler_1.attachSelectBoxStyler)(this.selectBox, themeService));
            this.registerListeners();
        }
        registerListeners() {
            this.toDispose.push(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('launch')) {
                    this.updateOptions();
                }
            }));
            this.toDispose.push(this.debugService.getConfigurationManager().onDidSelectConfiguration(() => {
                this.updateOptions();
            }));
        }
        render(container) {
            var _a;
            this.container = container;
            container.classList.add('start-debug-action-item');
            this.start = dom.append(container, $(themeService_1.ThemeIcon.asCSSSelector(debugIcons_1.debugStart)));
            const keybinding = (_a = this.keybindingService.lookupKeybinding(this.action.id)) === null || _a === void 0 ? void 0 : _a.getLabel();
            const keybindingLabel = keybinding ? ` (${keybinding})` : '';
            this.start.title = this.action.label + keybindingLabel;
            this.start.setAttribute('role', 'button');
            this.toDispose.push(dom.addDisposableListener(this.start, dom.EventType.CLICK, () => {
                this.start.blur();
                if (this.debugService.state !== 1 /* State.Initializing */) {
                    this.actionRunner.run(this.action, this.context);
                }
            }));
            this.toDispose.push(dom.addDisposableListener(this.start, dom.EventType.MOUSE_DOWN, (e) => {
                if (this.action.enabled && e.button === 0) {
                    this.start.classList.add('active');
                }
            }));
            this.toDispose.push(dom.addDisposableListener(this.start, dom.EventType.MOUSE_UP, () => {
                this.start.classList.remove('active');
            }));
            this.toDispose.push(dom.addDisposableListener(this.start, dom.EventType.MOUSE_OUT, () => {
                this.start.classList.remove('active');
            }));
            this.toDispose.push(dom.addDisposableListener(this.start, dom.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(3 /* KeyCode.Enter */) && this.debugService.state !== 1 /* State.Initializing */) {
                    this.actionRunner.run(this.action, this.context);
                }
                if (event.equals(17 /* KeyCode.RightArrow */)) {
                    this.start.tabIndex = -1;
                    this.selectBox.focus();
                    event.stopPropagation();
                }
            }));
            this.toDispose.push(this.selectBox.onDidSelect(async (e) => {
                const target = this.debugOptions[e.index];
                const shouldBeSelected = target.handler ? await target.handler() : false;
                if (shouldBeSelected) {
                    this.selected = e.index;
                }
                else {
                    // Some select options should not remain selected https://github.com/microsoft/vscode/issues/31526
                    this.selectBox.select(this.selected);
                }
            }));
            const selectBoxContainer = $('.configuration');
            this.selectBox.render(dom.append(container, selectBoxContainer));
            this.toDispose.push(dom.addDisposableListener(selectBoxContainer, dom.EventType.KEY_DOWN, (e) => {
                const event = new keyboardEvent_1.StandardKeyboardEvent(e);
                if (event.equals(15 /* KeyCode.LeftArrow */)) {
                    this.selectBox.setFocusable(false);
                    this.start.tabIndex = 0;
                    this.start.focus();
                    event.stopPropagation();
                }
            }));
            this.toDispose.push((0, styler_1.attachStylerCallback)(this.themeService, { selectBorder: colorRegistry_1.selectBorder, selectBackground: colorRegistry_1.selectBackground }, colors => {
                this.container.style.border = colors.selectBorder ? `1px solid ${colors.selectBorder}` : '';
                selectBoxContainer.style.borderLeft = colors.selectBorder ? `1px solid ${colors.selectBorder}` : '';
                const selectBackgroundColor = colors.selectBackground ? `${colors.selectBackground}` : '';
                this.container.style.backgroundColor = selectBackgroundColor;
            }));
            this.debugService.getConfigurationManager().getDynamicProviders().then(providers => {
                this.providers = providers;
                if (this.providers.length > 0) {
                    this.updateOptions();
                }
            });
            this.updateOptions();
        }
        setActionContext(context) {
            this.context = context;
        }
        isEnabled() {
            return true;
        }
        focus(fromRight) {
            if (fromRight) {
                this.selectBox.focus();
            }
            else {
                this.start.tabIndex = 0;
                this.start.focus();
            }
        }
        blur() {
            this.start.tabIndex = -1;
            this.selectBox.blur();
            this.container.blur();
        }
        setFocusable(focusable) {
            if (focusable) {
                this.start.tabIndex = 0;
            }
            else {
                this.start.tabIndex = -1;
                this.selectBox.setFocusable(false);
            }
        }
        dispose() {
            this.toDispose = (0, lifecycle_1.dispose)(this.toDispose);
        }
        updateOptions() {
            this.selected = 0;
            this.debugOptions = [];
            const manager = this.debugService.getConfigurationManager();
            const inWorkspace = this.contextService.getWorkbenchState() === 3 /* WorkbenchState.WORKSPACE */;
            let lastGroup;
            const disabledIdxs = [];
            manager.getAllConfigurations().forEach(({ launch, name, presentation }) => {
                if (lastGroup !== (presentation === null || presentation === void 0 ? void 0 : presentation.group)) {
                    lastGroup = presentation === null || presentation === void 0 ? void 0 : presentation.group;
                    if (this.debugOptions.length) {
                        this.debugOptions.push({ label: StartDebugActionViewItem.SEPARATOR, handler: () => Promise.resolve(false) });
                        disabledIdxs.push(this.debugOptions.length - 1);
                    }
                }
                if (name === manager.selectedConfiguration.name && launch === manager.selectedConfiguration.launch) {
                    this.selected = this.debugOptions.length;
                }
                const label = inWorkspace ? `${name} (${launch.name})` : name;
                this.debugOptions.push({
                    label, handler: async () => {
                        await manager.selectConfiguration(launch, name);
                        return true;
                    }
                });
            });
            // Only take 3 elements from the recent dynamic configurations to not clutter the dropdown
            manager.getRecentDynamicConfigurations().slice(0, 3).forEach(({ name, type }) => {
                if (type === manager.selectedConfiguration.type && manager.selectedConfiguration.name === name) {
                    this.selected = this.debugOptions.length;
                }
                this.debugOptions.push({
                    label: name,
                    handler: async () => {
                        await manager.selectConfiguration(undefined, name, undefined, { type });
                        return true;
                    }
                });
            });
            if (this.debugOptions.length === 0) {
                this.debugOptions.push({ label: nls.localize('noConfigurations', "No Configurations"), handler: async () => false });
            }
            this.debugOptions.push({ label: StartDebugActionViewItem.SEPARATOR, handler: () => Promise.resolve(false) });
            disabledIdxs.push(this.debugOptions.length - 1);
            this.providers.forEach(p => {
                this.debugOptions.push({
                    label: `${p.label}...`,
                    handler: async () => {
                        const picked = await p.pick();
                        if (picked) {
                            await manager.selectConfiguration(picked.launch, picked.config.name, picked.config, { type: p.type });
                            return true;
                        }
                        return false;
                    }
                });
            });
            manager.getLaunches().filter(l => !l.hidden).forEach(l => {
                const label = inWorkspace ? nls.localize("addConfigTo", "Add Config ({0})...", l.name) : nls.localize('addConfiguration', "Add Configuration...");
                this.debugOptions.push({
                    label, handler: async () => {
                        await this.commandService.executeCommand(debugCommands_1.ADD_CONFIGURATION_ID, l.uri.toString());
                        return false;
                    }
                });
            });
            this.selectBox.setOptions(this.debugOptions.map((data, index) => ({ text: data.label, isDisabled: disabledIdxs.indexOf(index) !== -1 })), this.selected);
        }
    };
    StartDebugActionViewItem.SEPARATOR = '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500';
    StartDebugActionViewItem = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, themeService_1.IThemeService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, commands_1.ICommandService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, contextView_1.IContextViewService),
        __param(8, keybinding_1.IKeybindingService)
    ], StartDebugActionViewItem);
    exports.StartDebugActionViewItem = StartDebugActionViewItem;
    let FocusSessionActionViewItem = class FocusSessionActionViewItem extends actionViewItems_1.SelectActionViewItem {
        constructor(action, session, debugService, themeService, contextViewService, configurationService) {
            super(null, action, [], -1, contextViewService, { ariaLabel: nls.localize('debugSession', 'Debug Session') });
            this.debugService = debugService;
            this.configurationService = configurationService;
            this._register((0, styler_1.attachSelectBoxStyler)(this.selectBox, themeService));
            this._register(this.debugService.getViewModel().onDidFocusSession(() => {
                const session = this.getSelectedSession();
                if (session) {
                    const index = this.getSessions().indexOf(session);
                    this.select(index);
                }
            }));
            this._register(this.debugService.onDidNewSession(session => {
                const sessionListeners = [];
                sessionListeners.push(session.onDidChangeName(() => this.update()));
                sessionListeners.push(session.onDidEndAdapter(() => (0, lifecycle_1.dispose)(sessionListeners)));
                this.update();
            }));
            this.getSessions().forEach(session => {
                this._register(session.onDidChangeName(() => this.update()));
            });
            this._register(this.debugService.onDidEndSession(() => this.update()));
            const selectedSession = session ? this.mapFocusedSessionToSelected(session) : undefined;
            this.update(selectedSession);
        }
        getActionContext(_, index) {
            return this.getSessions()[index];
        }
        update(session) {
            if (!session) {
                session = this.getSelectedSession();
            }
            const sessions = this.getSessions();
            const names = sessions.map(s => {
                const label = s.getLabel();
                if (s.parentSession) {
                    // Indent child sessions so they look like children
                    return `\u00A0\u00A0${label}`;
                }
                return label;
            });
            this.setOptions(names.map(data => ({ text: data })), session ? sessions.indexOf(session) : undefined);
        }
        getSelectedSession() {
            const session = this.debugService.getViewModel().focusedSession;
            return session ? this.mapFocusedSessionToSelected(session) : undefined;
        }
        getSessions() {
            const showSubSessions = this.configurationService.getValue('debug').showSubSessionsInToolBar;
            const sessions = this.debugService.getModel().getSessions();
            return showSubSessions ? sessions : sessions.filter(s => !s.parentSession);
        }
        mapFocusedSessionToSelected(focusedSession) {
            const showSubSessions = this.configurationService.getValue('debug').showSubSessionsInToolBar;
            while (focusedSession.parentSession && !showSubSessions) {
                focusedSession = focusedSession.parentSession;
            }
            return focusedSession;
        }
    };
    FocusSessionActionViewItem = __decorate([
        __param(2, debug_1.IDebugService),
        __param(3, themeService_1.IThemeService),
        __param(4, contextView_1.IContextViewService),
        __param(5, configuration_1.IConfigurationService)
    ], FocusSessionActionViewItem);
    exports.FocusSessionActionViewItem = FocusSessionActionViewItem;
});
//# sourceMappingURL=debugActionViewItems.js.map