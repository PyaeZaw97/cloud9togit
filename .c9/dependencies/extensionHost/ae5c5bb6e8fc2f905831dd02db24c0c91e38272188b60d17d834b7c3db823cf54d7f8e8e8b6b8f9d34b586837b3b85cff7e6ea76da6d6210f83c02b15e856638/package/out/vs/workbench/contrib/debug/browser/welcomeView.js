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
define(["require", "exports", "vs/platform/theme/common/themeService", "vs/platform/keybinding/common/keybinding", "vs/platform/contextview/browser/contextView", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/nls", "vs/workbench/contrib/debug/common/debug", "vs/workbench/services/editor/common/editorService", "vs/workbench/browser/parts/views/viewPane", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/views", "vs/platform/registry/common/platform", "vs/platform/opener/common/opener", "vs/workbench/common/contextkeys", "vs/workbench/browser/actions/workspaceActions", "vs/base/common/platform", "vs/editor/browser/editorBrowser", "vs/platform/storage/common/storage", "vs/platform/telemetry/common/telemetry", "vs/base/common/lifecycle", "vs/workbench/contrib/debug/browser/debugCommands"], function (require, exports, themeService_1, keybinding_1, contextView_1, configuration_1, contextkey_1, nls_1, debug_1, editorService_1, viewPane_1, instantiation_1, views_1, platform_1, opener_1, contextkeys_1, workspaceActions_1, platform_2, editorBrowser_1, storage_1, telemetry_1, lifecycle_1, debugCommands_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WelcomeView = void 0;
    const debugStartLanguageKey = 'debugStartLanguage';
    const CONTEXT_DEBUG_START_LANGUAGE = new contextkey_1.RawContextKey(debugStartLanguageKey, undefined);
    const CONTEXT_DEBUGGER_INTERESTED_IN_ACTIVE_EDITOR = new contextkey_1.RawContextKey('debuggerInterestedInActiveEditor', false);
    let WelcomeView = class WelcomeView extends viewPane_1.ViewPane {
        constructor(options, themeService, keybindingService, contextMenuService, configurationService, contextKeyService, debugService, editorService, instantiationService, viewDescriptorService, openerService, storageSevice, telemetryService) {
            super(options, keybindingService, contextMenuService, configurationService, contextKeyService, viewDescriptorService, instantiationService, openerService, themeService, telemetryService);
            this.debugService = debugService;
            this.editorService = editorService;
            this.debugStartLanguageContext = CONTEXT_DEBUG_START_LANGUAGE.bindTo(contextKeyService);
            this.debuggerInterestedContext = CONTEXT_DEBUGGER_INTERESTED_IN_ACTIVE_EDITOR.bindTo(contextKeyService);
            const lastSetLanguage = storageSevice.get(debugStartLanguageKey, 1 /* StorageScope.WORKSPACE */);
            this.debugStartLanguageContext.set(lastSetLanguage);
            const setContextKey = () => {
                const editorControl = this.editorService.activeTextEditorControl;
                if ((0, editorBrowser_1.isCodeEditor)(editorControl)) {
                    const model = editorControl.getModel();
                    const language = model ? model.getLanguageId() : undefined;
                    if (language && this.debugService.getAdapterManager().isDebuggerInterestedInLanguage(language)) {
                        this.debugStartLanguageContext.set(language);
                        this.debuggerInterestedContext.set(true);
                        storageSevice.store(debugStartLanguageKey, language, 1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */);
                        return;
                    }
                }
                this.debuggerInterestedContext.set(false);
            };
            const disposables = new lifecycle_1.DisposableStore();
            this._register(disposables);
            this._register(editorService.onDidActiveEditorChange(() => {
                disposables.clear();
                const editorControl = this.editorService.activeTextEditorControl;
                if ((0, editorBrowser_1.isCodeEditor)(editorControl)) {
                    disposables.add(editorControl.onDidChangeModelLanguage(setContextKey));
                }
                setContextKey();
            }));
            this._register(this.debugService.getAdapterManager().onDidRegisterDebugger(setContextKey));
            this._register(this.onDidChangeBodyVisibility(visible => {
                if (visible) {
                    setContextKey();
                }
            }));
            setContextKey();
            const debugKeybinding = this.keybindingService.lookupKeybinding(debugCommands_1.DEBUG_START_COMMAND_ID);
            debugKeybindingLabel = debugKeybinding ? ` (${debugKeybinding.getLabel()})` : '';
        }
        shouldShowWelcome() {
            return true;
        }
    };
    WelcomeView.ID = 'workbench.debug.welcome';
    WelcomeView.LABEL = (0, nls_1.localize)('run', "Run");
    WelcomeView = __decorate([
        __param(1, themeService_1.IThemeService),
        __param(2, keybinding_1.IKeybindingService),
        __param(3, contextView_1.IContextMenuService),
        __param(4, configuration_1.IConfigurationService),
        __param(5, contextkey_1.IContextKeyService),
        __param(6, debug_1.IDebugService),
        __param(7, editorService_1.IEditorService),
        __param(8, instantiation_1.IInstantiationService),
        __param(9, views_1.IViewDescriptorService),
        __param(10, opener_1.IOpenerService),
        __param(11, storage_1.IStorageService),
        __param(12, telemetry_1.ITelemetryService)
    ], WelcomeView);
    exports.WelcomeView = WelcomeView;
    const viewsRegistry = platform_1.Registry.as(views_1.Extensions.ViewsRegistry);
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: (0, nls_1.localize)({ key: 'openAFileWhichCanBeDebugged', comment: ['Please do not translate the word "commmand", it is part of our internal syntax which must not change'] }, "[Open a file](command:{0}) which can be debugged or run.", (platform_2.isMacintosh && !platform_2.isWeb) ? workspaceActions_1.OpenFileFolderAction.ID : workspaceActions_1.OpenFileAction.ID),
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, CONTEXT_DEBUGGER_INTERESTED_IN_ACTIVE_EDITOR.toNegated()),
        group: views_1.ViewContentGroups.Open
    });
    let debugKeybindingLabel = '';
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: (0, nls_1.localize)({ key: 'runAndDebugAction', comment: ['Please do not translate the word "commmand", it is part of our internal syntax which must not change'] }, "[Run and Debug{0}](command:{1})", debugKeybindingLabel, debugCommands_1.DEBUG_START_COMMAND_ID),
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
        group: views_1.ViewContentGroups.Debug
    });
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: (0, nls_1.localize)({ key: 'detectThenRunAndDebug', comment: ['Please do not translate the word "commmand", it is part of our internal syntax which must not change'] }, "[Show all automatic debug configurations](command:{0}).", debugCommands_1.SELECT_AND_START_ID),
        when: debug_1.CONTEXT_DEBUGGERS_AVAILABLE,
        group: views_1.ViewContentGroups.Debug,
        order: 10
    });
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: (0, nls_1.localize)({ key: 'customizeRunAndDebug', comment: ['Please do not translate the word "commmand", it is part of our internal syntax which must not change'] }, "To customize Run and Debug [create a launch.json file](command:{0}).", debugCommands_1.DEBUG_CONFIGURE_COMMAND_ID),
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, contextkeys_1.WorkbenchStateContext.notEqualsTo('empty')),
        group: views_1.ViewContentGroups.Debug
    });
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: (0, nls_1.localize)({ key: 'customizeRunAndDebugOpenFolder', comment: ['Please do not translate the word "commmand", it is part of our internal syntax which must not change'] }, "To customize Run and Debug, [open a folder](command:{0}) and create a launch.json file.", (platform_2.isMacintosh && !platform_2.isWeb) ? workspaceActions_1.OpenFileFolderAction.ID : workspaceActions_1.OpenFolderAction.ID),
        when: contextkey_1.ContextKeyExpr.and(debug_1.CONTEXT_DEBUGGERS_AVAILABLE, contextkeys_1.WorkbenchStateContext.isEqualTo('empty')),
        group: views_1.ViewContentGroups.Debug
    });
    viewsRegistry.registerViewWelcomeContent(WelcomeView.ID, {
        content: (0, nls_1.localize)('allDebuggersDisabled', "All debug extensions are disabled. Enable a debug extension or install a new one from the Marketplace."),
        when: debug_1.CONTEXT_DEBUG_EXTENSION_AVAILABLE.toNegated(),
        group: views_1.ViewContentGroups.Debug
    });
});
//# sourceMappingURL=welcomeView.js.map