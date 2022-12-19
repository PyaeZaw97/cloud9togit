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
define(["require", "exports", "vs/base/common/event", "vs/base/common/lifecycle", "vs/platform/contextkey/common/contextkey", "vs/platform/contextkey/common/contextkeys", "vs/workbench/common/contextkeys", "vs/workbench/common/editor", "vs/base/browser/dom", "vs/workbench/services/editor/common/editorGroupsService", "vs/platform/configuration/common/configuration", "vs/workbench/services/environment/common/environmentService", "vs/workbench/services/editor/common/editorService", "vs/platform/workspace/common/workspace", "vs/workbench/services/layout/browser/layoutService", "vs/platform/remote/common/remoteHosts", "vs/platform/workspace/common/virtualWorkspace", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/platform", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/panecomposite/browser/panecomposite", "vs/base/common/network", "vs/platform/files/browser/webFileSystemAccess"], function (require, exports, event_1, lifecycle_1, contextkey_1, contextkeys_1, contextkeys_2, editor_1, dom_1, editorGroupsService_1, configuration_1, environmentService_1, editorService_1, workspace_1, layoutService_1, remoteHosts_1, virtualWorkspace_1, workingCopyService_1, platform_1, editorResolverService_1, panecomposite_1, network_1, webFileSystemAccess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WorkbenchContextKeysHandler = void 0;
    let WorkbenchContextKeysHandler = class WorkbenchContextKeysHandler extends lifecycle_1.Disposable {
        constructor(contextKeyService, contextService, configurationService, environmentService, editorService, editorResolverService, editorGroupService, layoutService, paneCompositeService, workingCopyService) {
            super();
            this.contextKeyService = contextKeyService;
            this.contextService = contextService;
            this.configurationService = configurationService;
            this.environmentService = environmentService;
            this.editorService = editorService;
            this.editorResolverService = editorResolverService;
            this.editorGroupService = editorGroupService;
            this.layoutService = layoutService;
            this.paneCompositeService = paneCompositeService;
            this.workingCopyService = workingCopyService;
            // Platform
            contextkeys_1.IsMacContext.bindTo(this.contextKeyService);
            contextkeys_1.IsLinuxContext.bindTo(this.contextKeyService);
            contextkeys_1.IsWindowsContext.bindTo(this.contextKeyService);
            contextkeys_1.IsWebContext.bindTo(this.contextKeyService);
            contextkeys_1.IsMacNativeContext.bindTo(this.contextKeyService);
            contextkeys_1.IsIOSContext.bindTo(this.contextKeyService);
            contextkeys_2.RemoteNameContext.bindTo(this.contextKeyService).set((0, remoteHosts_1.getRemoteName)(this.environmentService.remoteAuthority) || '');
            this.virtualWorkspaceContext = contextkeys_2.VirtualWorkspaceContext.bindTo(this.contextKeyService);
            this.updateVirtualWorkspaceContextKey();
            // Capabilities
            contextkeys_2.HasWebFileSystemAccess.bindTo(this.contextKeyService).set(webFileSystemAccess_1.WebFileSystemAccess.supported(window));
            // Development
            contextkeys_1.IsDevelopmentContext.bindTo(this.contextKeyService).set(!this.environmentService.isBuilt || this.environmentService.isExtensionDevelopment);
            // Editors
            this.activeEditorContext = contextkeys_2.ActiveEditorContext.bindTo(this.contextKeyService);
            this.activeEditorIsReadonly = contextkeys_2.ActiveEditorReadonlyContext.bindTo(this.contextKeyService);
            this.activeEditorCanRevert = contextkeys_2.ActiveEditorCanRevertContext.bindTo(this.contextKeyService);
            this.activeEditorCanSplitInGroup = contextkeys_2.ActiveEditorCanSplitInGroupContext.bindTo(this.contextKeyService);
            this.activeEditorAvailableEditorIds = contextkeys_2.ActiveEditorAvailableEditorIdsContext.bindTo(this.contextKeyService);
            this.editorsVisibleContext = contextkeys_2.EditorsVisibleContext.bindTo(this.contextKeyService);
            this.textCompareEditorVisibleContext = contextkeys_2.TextCompareEditorVisibleContext.bindTo(this.contextKeyService);
            this.textCompareEditorActiveContext = contextkeys_2.TextCompareEditorActiveContext.bindTo(this.contextKeyService);
            this.sideBySideEditorActiveContext = contextkeys_2.SideBySideEditorActiveContext.bindTo(this.contextKeyService);
            this.activeEditorGroupEmpty = contextkeys_2.ActiveEditorGroupEmptyContext.bindTo(this.contextKeyService);
            this.activeEditorGroupIndex = contextkeys_2.ActiveEditorGroupIndexContext.bindTo(this.contextKeyService);
            this.activeEditorGroupLast = contextkeys_2.ActiveEditorGroupLastContext.bindTo(this.contextKeyService);
            this.activeEditorGroupLocked = contextkeys_2.ActiveEditorGroupLockedContext.bindTo(this.contextKeyService);
            this.multipleEditorGroupsContext = contextkeys_2.MultipleEditorGroupsContext.bindTo(this.contextKeyService);
            // Working Copies
            this.dirtyWorkingCopiesContext = contextkeys_2.DirtyWorkingCopiesContext.bindTo(this.contextKeyService);
            this.dirtyWorkingCopiesContext.set(this.workingCopyService.hasDirty);
            // Inputs
            this.inputFocusedContext = contextkeys_1.InputFocusedContext.bindTo(this.contextKeyService);
            // Workbench State
            this.workbenchStateContext = contextkeys_2.WorkbenchStateContext.bindTo(this.contextKeyService);
            this.updateWorkbenchStateContextKey();
            // Workspace Folder Count
            this.workspaceFolderCountContext = contextkeys_2.WorkspaceFolderCountContext.bindTo(this.contextKeyService);
            this.updateWorkspaceFolderCountContextKey();
            // Opening folder support: support for opening a folder workspace
            // (e.g. "Open Folder...") is limited in web when not connected
            // to a remote.
            this.openFolderWorkspaceSupportContext = contextkeys_2.OpenFolderWorkspaceSupportContext.bindTo(this.contextKeyService);
            this.openFolderWorkspaceSupportContext.set(platform_1.isNative || typeof this.environmentService.remoteAuthority === 'string');
            // Empty workspace support: empty workspaces require built-in file system
            // providers to be available that allow to enter a workspace or open loose
            // files. This condition is met:
            // - desktop: always
            // -     web: only when connected to a remote
            this.emptyWorkspaceSupportContext = contextkeys_2.EmptyWorkspaceSupportContext.bindTo(this.contextKeyService);
            this.emptyWorkspaceSupportContext.set(platform_1.isNative || typeof this.environmentService.remoteAuthority === 'string');
            // Entering a multi root workspace support: support for entering a multi-root
            // workspace (e.g. "Open Workspace from File...", "Duplicate Workspace", "Save Workspace")
            // is driven by the ability to resolve a workspace configuration file (*.code-workspace)
            // with a built-in file system provider.
            // This condition is met:
            // - desktop: always
            // -     web: only when connected to a remote
            this.enterMultiRootWorkspaceSupportContext = contextkeys_2.EnterMultiRootWorkspaceSupportContext.bindTo(this.contextKeyService);
            this.enterMultiRootWorkspaceSupportContext.set(platform_1.isNative || typeof this.environmentService.remoteAuthority === 'string');
            // Editor Layout
            this.splitEditorsVerticallyContext = contextkeys_2.SplitEditorsVertically.bindTo(this.contextKeyService);
            this.updateSplitEditorsVerticallyContext();
            // Fullscreen
            this.isFullscreenContext = contextkeys_2.IsFullscreenContext.bindTo(this.contextKeyService);
            // Zen Mode
            this.inZenModeContext = contextkeys_2.InEditorZenModeContext.bindTo(this.contextKeyService);
            // Centered Layout
            this.isCenteredLayoutContext = contextkeys_2.IsCenteredLayoutContext.bindTo(this.contextKeyService);
            // Editor Area
            this.editorAreaVisibleContext = contextkeys_2.EditorAreaVisibleContext.bindTo(this.contextKeyService);
            this.editorTabsVisibleContext = contextkeys_2.EditorTabsVisibleContext.bindTo(this.contextKeyService);
            // Sidebar
            this.sideBarVisibleContext = contextkeys_2.SideBarVisibleContext.bindTo(this.contextKeyService);
            // Panel
            this.panelPositionContext = contextkeys_2.PanelPositionContext.bindTo(this.contextKeyService);
            this.panelPositionContext.set((0, layoutService_1.positionToString)(this.layoutService.getPanelPosition()));
            this.panelVisibleContext = contextkeys_2.PanelVisibleContext.bindTo(this.contextKeyService);
            this.panelVisibleContext.set(this.layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */));
            this.panelMaximizedContext = contextkeys_2.PanelMaximizedContext.bindTo(this.contextKeyService);
            this.panelMaximizedContext.set(this.layoutService.isPanelMaximized());
            this.panelAlignmentContext = contextkeys_2.PanelAlignmentContext.bindTo(this.contextKeyService);
            this.panelAlignmentContext.set(this.layoutService.getPanelAlignment());
            // Auxiliary Bar
            this.auxiliaryBarVisibleContext = contextkeys_2.AuxiliaryBarVisibleContext.bindTo(this.contextKeyService);
            this.auxiliaryBarVisibleContext.set(this.layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */));
            this.registerListeners();
        }
        registerListeners() {
            this.editorGroupService.whenReady.then(() => {
                this.updateEditorAreaContextKeys();
                this.updateEditorContextKeys();
            });
            this._register(this.editorService.onDidActiveEditorChange(() => this.updateEditorContextKeys()));
            this._register(this.editorService.onDidVisibleEditorsChange(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidAddGroup(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidRemoveGroup(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidChangeGroupIndex(() => this.updateEditorContextKeys()));
            this._register(this.editorGroupService.onDidChangeActiveGroup(() => this.updateEditorGroupContextKeys()));
            this._register(this.editorGroupService.onDidChangeGroupLocked(() => this.updateEditorGroupContextKeys()));
            this._register(this.editorGroupService.onDidChangeEditorPartOptions(() => this.updateEditorAreaContextKeys()));
            this._register((0, dom_1.addDisposableListener)(window, dom_1.EventType.FOCUS_IN, () => this.updateInputContextKeys(), true));
            this._register(this.contextService.onDidChangeWorkbenchState(() => this.updateWorkbenchStateContextKey()));
            this._register(this.contextService.onDidChangeWorkspaceFolders(() => {
                this.updateWorkspaceFolderCountContextKey();
                this.updateVirtualWorkspaceContextKey();
            }));
            this._register(this.configurationService.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.editor.openSideBySideDirection')) {
                    this.updateSplitEditorsVerticallyContext();
                }
            }));
            this._register(this.layoutService.onDidChangeZenMode(enabled => this.inZenModeContext.set(enabled)));
            this._register(this.layoutService.onDidChangeFullscreen(fullscreen => this.isFullscreenContext.set(fullscreen)));
            this._register(this.layoutService.onDidChangeCenteredLayout(centered => this.isCenteredLayoutContext.set(centered)));
            this._register(this.layoutService.onDidChangePanelPosition(position => this.panelPositionContext.set(position)));
            this._register(this.layoutService.onDidChangePanelAlignment(alignment => this.panelAlignmentContext.set(alignment)));
            this._register(this.paneCompositeService.onDidPaneCompositeClose(() => this.updateSideBarContextKeys()));
            this._register(this.paneCompositeService.onDidPaneCompositeOpen(() => this.updateSideBarContextKeys()));
            this._register(this.layoutService.onDidChangePartVisibility(() => {
                this.editorAreaVisibleContext.set(this.layoutService.isVisible("workbench.parts.editor" /* Parts.EDITOR_PART */));
                this.panelVisibleContext.set(this.layoutService.isVisible("workbench.parts.panel" /* Parts.PANEL_PART */));
                this.panelMaximizedContext.set(this.layoutService.isPanelMaximized());
                this.auxiliaryBarVisibleContext.set(this.layoutService.isVisible("workbench.parts.auxiliarybar" /* Parts.AUXILIARYBAR_PART */));
            }));
            this._register(this.workingCopyService.onDidChangeDirty(workingCopy => this.dirtyWorkingCopiesContext.set(workingCopy.isDirty() || this.workingCopyService.hasDirty)));
        }
        updateEditorAreaContextKeys() {
            this.editorTabsVisibleContext.set(!!this.editorGroupService.partOptions.showTabs);
        }
        updateEditorContextKeys() {
            const activeEditorPane = this.editorService.activeEditorPane;
            const visibleEditorPanes = this.editorService.visibleEditorPanes;
            this.textCompareEditorActiveContext.set((activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.getId()) === editor_1.TEXT_DIFF_EDITOR_ID);
            this.textCompareEditorVisibleContext.set(visibleEditorPanes.some(editorPane => editorPane.getId() === editor_1.TEXT_DIFF_EDITOR_ID));
            this.sideBySideEditorActiveContext.set((activeEditorPane === null || activeEditorPane === void 0 ? void 0 : activeEditorPane.getId()) === editor_1.SIDE_BY_SIDE_EDITOR_ID);
            if (visibleEditorPanes.length > 0) {
                this.editorsVisibleContext.set(true);
            }
            else {
                this.editorsVisibleContext.reset();
            }
            if (!this.editorService.activeEditor) {
                this.activeEditorGroupEmpty.set(true);
            }
            else {
                this.activeEditorGroupEmpty.reset();
            }
            this.updateEditorGroupContextKeys();
            if (activeEditorPane) {
                this.activeEditorContext.set(activeEditorPane.getId());
                this.activeEditorIsReadonly.set(activeEditorPane.input.hasCapability(2 /* EditorInputCapabilities.Readonly */));
                this.activeEditorCanRevert.set(!activeEditorPane.input.hasCapability(4 /* EditorInputCapabilities.Untitled */));
                this.activeEditorCanSplitInGroup.set(activeEditorPane.input.hasCapability(32 /* EditorInputCapabilities.CanSplitInGroup */));
                const activeEditorResource = activeEditorPane.input.resource;
                const editors = activeEditorResource ? this.editorResolverService.getEditors(activeEditorResource).map(editor => editor.id) : [];
                // Non text editor untitled files cannot be easily serialized between extensions
                // so instead we disable this context key to prevent common commands that act on the active editor
                if ((activeEditorResource === null || activeEditorResource === void 0 ? void 0 : activeEditorResource.scheme) === network_1.Schemas.untitled && activeEditorPane.input.editorId !== editor_1.DEFAULT_EDITOR_ASSOCIATION.id) {
                    this.activeEditorAvailableEditorIds.set('');
                }
                else {
                    this.activeEditorAvailableEditorIds.set(editors.join(','));
                }
            }
            else {
                this.activeEditorContext.reset();
                this.activeEditorIsReadonly.reset();
                this.activeEditorCanRevert.reset();
                this.activeEditorCanSplitInGroup.reset();
                this.activeEditorAvailableEditorIds.reset();
            }
        }
        updateEditorGroupContextKeys() {
            const groupCount = this.editorGroupService.count;
            if (groupCount > 1) {
                this.multipleEditorGroupsContext.set(true);
            }
            else {
                this.multipleEditorGroupsContext.reset();
            }
            const activeGroup = this.editorGroupService.activeGroup;
            this.activeEditorGroupIndex.set(activeGroup.index + 1); // not zero-indexed
            this.activeEditorGroupLast.set(activeGroup.index === groupCount - 1);
            this.activeEditorGroupLocked.set(activeGroup.isLocked);
        }
        updateInputContextKeys() {
            function activeElementIsInput() {
                return !!document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
            }
            const isInputFocused = activeElementIsInput();
            this.inputFocusedContext.set(isInputFocused);
            if (isInputFocused) {
                const tracker = (0, dom_1.trackFocus)(document.activeElement);
                event_1.Event.once(tracker.onDidBlur)(() => {
                    this.inputFocusedContext.set(activeElementIsInput());
                    tracker.dispose();
                });
            }
        }
        updateWorkbenchStateContextKey() {
            this.workbenchStateContext.set(this.getWorkbenchStateString());
        }
        updateWorkspaceFolderCountContextKey() {
            this.workspaceFolderCountContext.set(this.contextService.getWorkspace().folders.length);
        }
        updateSplitEditorsVerticallyContext() {
            const direction = (0, editorGroupsService_1.preferredSideBySideGroupDirection)(this.configurationService);
            this.splitEditorsVerticallyContext.set(direction === 1 /* GroupDirection.DOWN */);
        }
        getWorkbenchStateString() {
            switch (this.contextService.getWorkbenchState()) {
                case 1 /* WorkbenchState.EMPTY */: return 'empty';
                case 2 /* WorkbenchState.FOLDER */: return 'folder';
                case 3 /* WorkbenchState.WORKSPACE */: return 'workspace';
            }
        }
        updateSideBarContextKeys() {
            this.sideBarVisibleContext.set(this.layoutService.isVisible("workbench.parts.sidebar" /* Parts.SIDEBAR_PART */));
        }
        updateVirtualWorkspaceContextKey() {
            this.virtualWorkspaceContext.set((0, virtualWorkspace_1.getVirtualWorkspaceScheme)(this.contextService.getWorkspace()) || '');
        }
    };
    WorkbenchContextKeysHandler = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, workspace_1.IWorkspaceContextService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, environmentService_1.IWorkbenchEnvironmentService),
        __param(4, editorService_1.IEditorService),
        __param(5, editorResolverService_1.IEditorResolverService),
        __param(6, editorGroupsService_1.IEditorGroupsService),
        __param(7, layoutService_1.IWorkbenchLayoutService),
        __param(8, panecomposite_1.IPaneCompositePartService),
        __param(9, workingCopyService_1.IWorkingCopyService)
    ], WorkbenchContextKeysHandler);
    exports.WorkbenchContextKeysHandler = WorkbenchContextKeysHandler;
});
//# sourceMappingURL=contextkeys.js.map