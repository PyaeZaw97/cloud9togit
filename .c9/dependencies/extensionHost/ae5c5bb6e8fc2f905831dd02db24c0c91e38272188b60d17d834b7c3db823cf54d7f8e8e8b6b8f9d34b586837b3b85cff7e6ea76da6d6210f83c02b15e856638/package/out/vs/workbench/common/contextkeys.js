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
define(["require", "exports", "vs/base/common/lifecycle", "vs/nls", "vs/platform/contextkey/common/contextkey", "vs/base/common/resources", "vs/editor/common/languages/language", "vs/platform/files/common/files", "vs/editor/common/services/model"], function (require, exports, lifecycle_1, nls_1, contextkey_1, resources_1, language_1, files_1, model_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceContextKey = exports.getEnabledViewContainerContextKey = exports.getVisbileViewContextKey = exports.FocusedViewContext = exports.PanelMaximizedContext = exports.PanelVisibleContext = exports.PanelAlignmentContext = exports.PanelPositionContext = exports.PanelFocusContext = exports.ActivePanelContext = exports.AuxiliaryBarVisibleContext = exports.AuxiliaryBarFocusContext = exports.ActiveAuxiliaryContext = exports.NotificationsToastsVisibleContext = exports.NotificationsCenterVisibleContext = exports.NotificationFocusedContext = exports.BannerFocused = exports.StatusBarFocused = exports.ActiveViewletContext = exports.SidebarFocusContext = exports.SideBarVisibleContext = exports.EditorTabsVisibleContext = exports.EditorAreaVisibleContext = exports.SplitEditorsVertically = exports.IsCenteredLayoutContext = exports.InEditorZenModeContext = exports.EditorsVisibleContext = exports.SingleEditorGroupsContext = exports.MultipleEditorGroupsContext = exports.ActiveEditorGroupLockedContext = exports.ActiveEditorGroupLastContext = exports.ActiveEditorGroupIndexContext = exports.ActiveEditorGroupEmptyContext = exports.EditorGroupEditorsCountContext = exports.SideBySideEditorActiveContext = exports.TextCompareEditorActiveContext = exports.TextCompareEditorVisibleContext = exports.ActiveEditorAvailableEditorIdsContext = exports.ActiveEditorContext = exports.ActiveEditorCanSplitInGroupContext = exports.ActiveEditorCanRevertContext = exports.ActiveEditorReadonlyContext = exports.ActiveEditorStickyContext = exports.ActiveEditorLastInGroupContext = exports.ActiveEditorFirstInGroupContext = exports.ActiveEditorPinnedContext = exports.ActiveEditorDirtyContext = exports.HasWebFileSystemAccess = exports.IsFullscreenContext = exports.VirtualWorkspaceContext = exports.RemoteNameContext = exports.DirtyWorkingCopiesContext = exports.EmptyWorkspaceSupportContext = exports.EnterMultiRootWorkspaceSupportContext = exports.OpenFolderWorkspaceSupportContext = exports.WorkspaceFolderCountContext = exports.WorkbenchStateContext = void 0;
    //#region < --- Workbench --- >
    exports.WorkbenchStateContext = new contextkey_1.RawContextKey('workbenchState', undefined, { type: 'string', description: (0, nls_1.localize)('workbenchState', "The kind of workspace opened in the window, either 'empty' (no workspace), 'folder' (single folder) or 'workspace' (multi-root workspace)") });
    exports.WorkspaceFolderCountContext = new contextkey_1.RawContextKey('workspaceFolderCount', 0, (0, nls_1.localize)('workspaceFolderCount', "The number of root folders in the workspace"));
    exports.OpenFolderWorkspaceSupportContext = new contextkey_1.RawContextKey('openFolderWorkspaceSupport', true, true);
    exports.EnterMultiRootWorkspaceSupportContext = new contextkey_1.RawContextKey('enterMultiRootWorkspaceSupport', true, true);
    exports.EmptyWorkspaceSupportContext = new contextkey_1.RawContextKey('emptyWorkspaceSupport', true, true);
    exports.DirtyWorkingCopiesContext = new contextkey_1.RawContextKey('dirtyWorkingCopies', false, (0, nls_1.localize)('dirtyWorkingCopies', "Whether there are any working copies with unsaved changes"));
    exports.RemoteNameContext = new contextkey_1.RawContextKey('remoteName', '', (0, nls_1.localize)('remoteName', "The name of the remote the window is connected to or an empty string if not connected to any remote"));
    exports.VirtualWorkspaceContext = new contextkey_1.RawContextKey('virtualWorkspace', '', (0, nls_1.localize)('virtualWorkspace', "The scheme of the current workspace if is from a virtual file system or an empty string."));
    exports.IsFullscreenContext = new contextkey_1.RawContextKey('isFullscreen', false, (0, nls_1.localize)('isFullscreen', "Whether the window is in fullscreen mode"));
    exports.HasWebFileSystemAccess = new contextkey_1.RawContextKey('hasWebFileSystemAccess', false, true); // Support for FileSystemAccess web APIs (https://wicg.github.io/file-system-access)
    //#endregion
    //#region < --- Editor --- >
    // Editor State Context Keys
    exports.ActiveEditorDirtyContext = new contextkey_1.RawContextKey('activeEditorIsDirty', false, (0, nls_1.localize)('activeEditorIsDirty', "Whether the active editor has unsaved changes"));
    exports.ActiveEditorPinnedContext = new contextkey_1.RawContextKey('activeEditorIsNotPreview', false, (0, nls_1.localize)('activeEditorIsNotPreview', "Whether the active editor is not in preview mode"));
    exports.ActiveEditorFirstInGroupContext = new contextkey_1.RawContextKey('activeEditorIsFirstInGroup', false, (0, nls_1.localize)('activeEditorIsFirstInGroup', "Whether the active editor is the first one in its group"));
    exports.ActiveEditorLastInGroupContext = new contextkey_1.RawContextKey('activeEditorIsLastInGroup', false, (0, nls_1.localize)('activeEditorIsLastInGroup', "Whether the active editor is the last one in its group"));
    exports.ActiveEditorStickyContext = new contextkey_1.RawContextKey('activeEditorIsPinned', false, (0, nls_1.localize)('activeEditorIsPinned', "Whether the active editor is pinned"));
    exports.ActiveEditorReadonlyContext = new contextkey_1.RawContextKey('activeEditorIsReadonly', false, (0, nls_1.localize)('activeEditorIsReadonly', "Whether the active editor is readonly"));
    exports.ActiveEditorCanRevertContext = new contextkey_1.RawContextKey('activeEditorCanRevert', false, (0, nls_1.localize)('activeEditorCanRevert', "Whether the active editor can revert"));
    exports.ActiveEditorCanSplitInGroupContext = new contextkey_1.RawContextKey('activeEditorCanSplitInGroup', true);
    // Editor Kind Context Keys
    exports.ActiveEditorContext = new contextkey_1.RawContextKey('activeEditor', null, { type: 'string', description: (0, nls_1.localize)('activeEditor', "The identifier of the active editor") });
    exports.ActiveEditorAvailableEditorIdsContext = new contextkey_1.RawContextKey('activeEditorAvailableEditorIds', '', (0, nls_1.localize)('activeEditorAvailableEditorIds', "The available editor identifiers that are usable for the active editor"));
    exports.TextCompareEditorVisibleContext = new contextkey_1.RawContextKey('textCompareEditorVisible', false, (0, nls_1.localize)('textCompareEditorVisible', "Whether a text compare editor is visible"));
    exports.TextCompareEditorActiveContext = new contextkey_1.RawContextKey('textCompareEditorActive', false, (0, nls_1.localize)('textCompareEditorActive', "Whether a text compare editor is active"));
    exports.SideBySideEditorActiveContext = new contextkey_1.RawContextKey('sideBySideEditorActive', false, (0, nls_1.localize)('sideBySideEditorActive', "Whether a side by side editor is active"));
    // Editor Group Context Keys
    exports.EditorGroupEditorsCountContext = new contextkey_1.RawContextKey('groupEditorsCount', 0, (0, nls_1.localize)('groupEditorsCount', "The number of opened editor groups"));
    exports.ActiveEditorGroupEmptyContext = new contextkey_1.RawContextKey('activeEditorGroupEmpty', false, (0, nls_1.localize)('activeEditorGroupEmpty', "Whether the active editor group is empty"));
    exports.ActiveEditorGroupIndexContext = new contextkey_1.RawContextKey('activeEditorGroupIndex', 0, (0, nls_1.localize)('activeEditorGroupIndex', "The index of the active editor group"));
    exports.ActiveEditorGroupLastContext = new contextkey_1.RawContextKey('activeEditorGroupLast', false, (0, nls_1.localize)('activeEditorGroupLast', "Whether the active editor group is the last group"));
    exports.ActiveEditorGroupLockedContext = new contextkey_1.RawContextKey('activeEditorGroupLocked', false, (0, nls_1.localize)('activeEditorGroupLocked', "Whether the active editor group is locked"));
    exports.MultipleEditorGroupsContext = new contextkey_1.RawContextKey('multipleEditorGroups', false, (0, nls_1.localize)('multipleEditorGroups', "Whether there are multiple editor groups opened"));
    exports.SingleEditorGroupsContext = exports.MultipleEditorGroupsContext.toNegated();
    // Editor Layout Context Keys
    exports.EditorsVisibleContext = new contextkey_1.RawContextKey('editorIsOpen', false, (0, nls_1.localize)('editorIsOpen', "Whether an editor is open"));
    exports.InEditorZenModeContext = new contextkey_1.RawContextKey('inZenMode', false, (0, nls_1.localize)('inZenMode', "Whether Zen mode is enabled"));
    exports.IsCenteredLayoutContext = new contextkey_1.RawContextKey('isCenteredLayout', false, (0, nls_1.localize)('isCenteredLayout', "Whether centered layout is enabled"));
    exports.SplitEditorsVertically = new contextkey_1.RawContextKey('splitEditorsVertically', false, (0, nls_1.localize)('splitEditorsVertically', "Whether editors split vertically"));
    exports.EditorAreaVisibleContext = new contextkey_1.RawContextKey('editorAreaVisible', true, (0, nls_1.localize)('editorAreaVisible', "Whether the editor area is visible"));
    exports.EditorTabsVisibleContext = new contextkey_1.RawContextKey('editorTabsVisible', true, (0, nls_1.localize)('editorTabsVisible', "Whether editor tabs are visible"));
    //#endregion
    //#region < --- Side Bar --- >
    exports.SideBarVisibleContext = new contextkey_1.RawContextKey('sideBarVisible', false, (0, nls_1.localize)('sideBarVisible', "Whether the sidebar is visible"));
    exports.SidebarFocusContext = new contextkey_1.RawContextKey('sideBarFocus', false, (0, nls_1.localize)('sideBarFocus', "Whether the sidebar has keyboard focus"));
    exports.ActiveViewletContext = new contextkey_1.RawContextKey('activeViewlet', '', (0, nls_1.localize)('activeViewlet', "The identifier of the active viewlet"));
    //#endregion
    //#region < --- Status Bar --- >
    exports.StatusBarFocused = new contextkey_1.RawContextKey('statusBarFocused', false, (0, nls_1.localize)('statusBarFocused', "Whether the status bar has keyboard focus"));
    //#endregion
    //#region < --- Banner --- >
    exports.BannerFocused = new contextkey_1.RawContextKey('bannerFocused', false, (0, nls_1.localize)('bannerFocused', "Whether the banner has keyboard focus"));
    //#endregion
    //#region < --- Notifications --- >
    exports.NotificationFocusedContext = new contextkey_1.RawContextKey('notificationFocus', true, (0, nls_1.localize)('notificationFocus', "Whether a notification has keyboard focus"));
    exports.NotificationsCenterVisibleContext = new contextkey_1.RawContextKey('notificationCenterVisible', false, (0, nls_1.localize)('notificationCenterVisible', "Whether the notifications center is visible"));
    exports.NotificationsToastsVisibleContext = new contextkey_1.RawContextKey('notificationToastsVisible', false, (0, nls_1.localize)('notificationToastsVisible', "Whether a notification toast is visible"));
    //#endregion
    //#region < --- Auxiliary Bar --- >
    exports.ActiveAuxiliaryContext = new contextkey_1.RawContextKey('activeAuxiliary', '', (0, nls_1.localize)('activeAuxiliary', "The identifier of the active auxiliary panel"));
    exports.AuxiliaryBarFocusContext = new contextkey_1.RawContextKey('auxiliaryBarFocus', false, (0, nls_1.localize)('auxiliaryBarFocus', "Whether the auxiliary bar has keyboard focus"));
    exports.AuxiliaryBarVisibleContext = new contextkey_1.RawContextKey('auxiliaryBarVisible', false, (0, nls_1.localize)('auxiliaryBarVisible', "Whether the auxiliary bar is visible"));
    //#endregion
    //#region < --- Panel --- >
    exports.ActivePanelContext = new contextkey_1.RawContextKey('activePanel', '', (0, nls_1.localize)('activePanel', "The identifier of the active panel"));
    exports.PanelFocusContext = new contextkey_1.RawContextKey('panelFocus', false, (0, nls_1.localize)('panelFocus', "Whether the panel has keyboard focus"));
    exports.PanelPositionContext = new contextkey_1.RawContextKey('panelPosition', 'bottom', (0, nls_1.localize)('panelPosition', "The position of the panel, always 'bottom'"));
    exports.PanelAlignmentContext = new contextkey_1.RawContextKey('panelAlignment', 'center', (0, nls_1.localize)('panelAlignment', "The alignment of the panel, either 'center', 'left', 'right' or 'justify'"));
    exports.PanelVisibleContext = new contextkey_1.RawContextKey('panelVisible', false, (0, nls_1.localize)('panelVisible', "Whether the panel is visible"));
    exports.PanelMaximizedContext = new contextkey_1.RawContextKey('panelMaximized', false, (0, nls_1.localize)('panelMaximized', "Whether the panel is maximized"));
    //#endregion
    //#region < --- Views --- >
    exports.FocusedViewContext = new contextkey_1.RawContextKey('focusedView', '', (0, nls_1.localize)('focusedView', "The identifier of the view that has keyboard focus"));
    function getVisbileViewContextKey(viewId) { return `view.${viewId}.visible`; }
    exports.getVisbileViewContextKey = getVisbileViewContextKey;
    function getEnabledViewContainerContextKey(viewContainerId) { return `viewContainer.${viewContainerId}.enabled`; }
    exports.getEnabledViewContainerContextKey = getEnabledViewContainerContextKey;
    //#endregion
    //#region < --- Resources --- >
    let ResourceContextKey = class ResourceContextKey {
        constructor(_contextKeyService, _fileService, _languageService, _modelService) {
            this._contextKeyService = _contextKeyService;
            this._fileService = _fileService;
            this._languageService = _languageService;
            this._modelService = _modelService;
            this._disposables = new lifecycle_1.DisposableStore();
            this._schemeKey = ResourceContextKey.Scheme.bindTo(this._contextKeyService);
            this._filenameKey = ResourceContextKey.Filename.bindTo(this._contextKeyService);
            this._dirnameKey = ResourceContextKey.Dirname.bindTo(this._contextKeyService);
            this._pathKey = ResourceContextKey.Path.bindTo(this._contextKeyService);
            this._langIdKey = ResourceContextKey.LangId.bindTo(this._contextKeyService);
            this._resourceKey = ResourceContextKey.Resource.bindTo(this._contextKeyService);
            this._extensionKey = ResourceContextKey.Extension.bindTo(this._contextKeyService);
            this._hasResource = ResourceContextKey.HasResource.bindTo(this._contextKeyService);
            this._isFileSystemResource = ResourceContextKey.IsFileSystemResource.bindTo(this._contextKeyService);
            this._disposables.add(_fileService.onDidChangeFileSystemProviderRegistrations(() => {
                const resource = this.get();
                this._isFileSystemResource.set(Boolean(resource && _fileService.hasProvider(resource)));
            }));
            this._disposables.add(_modelService.onModelAdded(model => {
                if ((0, resources_1.isEqual)(model.uri, this.get())) {
                    this._setLangId();
                }
            }));
            this._disposables.add(_modelService.onModelLanguageChanged(e => {
                if ((0, resources_1.isEqual)(e.model.uri, this.get())) {
                    this._setLangId();
                }
            }));
        }
        dispose() {
            this._disposables.dispose();
        }
        _setLangId() {
            var _a, _b;
            const value = this.get();
            if (!value) {
                this._langIdKey.set(null);
                return;
            }
            const langId = (_b = (_a = this._modelService.getModel(value)) === null || _a === void 0 ? void 0 : _a.getLanguageId()) !== null && _b !== void 0 ? _b : this._languageService.guessLanguageIdByFilepathOrFirstLine(value);
            this._langIdKey.set(langId);
        }
        set(value) {
            if ((0, resources_1.isEqual)(this.get(), value !== null && value !== void 0 ? value : undefined)) {
                return;
            }
            this._contextKeyService.bufferChangeEvents(() => {
                this._resourceKey.set(value);
                this._schemeKey.set(value ? value.scheme : null);
                this._filenameKey.set(value ? (0, resources_1.basename)(value) : null);
                this._dirnameKey.set(value ? (0, resources_1.dirname)(value).fsPath : null);
                this._pathKey.set(value ? value.fsPath : null);
                this._setLangId();
                this._extensionKey.set(value ? (0, resources_1.extname)(value) : null);
                this._hasResource.set(Boolean(value));
                this._isFileSystemResource.set(value ? this._fileService.hasProvider(value) : false);
            });
        }
        reset() {
            this._contextKeyService.bufferChangeEvents(() => {
                this._resourceKey.reset();
                this._schemeKey.reset();
                this._filenameKey.reset();
                this._dirnameKey.reset();
                this._pathKey.reset();
                this._langIdKey.reset();
                this._extensionKey.reset();
                this._hasResource.reset();
                this._isFileSystemResource.reset();
            });
        }
        get() {
            var _a;
            return (_a = this._resourceKey.get()) !== null && _a !== void 0 ? _a : undefined;
        }
    };
    // NOTE: DO NOT CHANGE THE DEFAULT VALUE TO ANYTHING BUT
    // UNDEFINED! IT IS IMPORTANT THAT DEFAULTS ARE INHERITED
    // FROM THE PARENT CONTEXT AND ONLY UNDEFINED DOES THIS
    ResourceContextKey.Scheme = new contextkey_1.RawContextKey('resourceScheme', undefined, { type: 'string', description: (0, nls_1.localize)('resourceScheme', "The scheme of the rsource") });
    ResourceContextKey.Filename = new contextkey_1.RawContextKey('resourceFilename', undefined, { type: 'string', description: (0, nls_1.localize)('resourceFilename', "The file name of the resource") });
    ResourceContextKey.Dirname = new contextkey_1.RawContextKey('resourceDirname', undefined, { type: 'string', description: (0, nls_1.localize)('resourceDirname', "The folder name the resource is contained in") });
    ResourceContextKey.Path = new contextkey_1.RawContextKey('resourcePath', undefined, { type: 'string', description: (0, nls_1.localize)('resourcePath', "The full path of the resource") });
    ResourceContextKey.LangId = new contextkey_1.RawContextKey('resourceLangId', undefined, { type: 'string', description: (0, nls_1.localize)('resourceLangId', "The language identifier of the resource") });
    ResourceContextKey.Resource = new contextkey_1.RawContextKey('resource', undefined, { type: 'URI', description: (0, nls_1.localize)('resource', "The full value of the resource including scheme and path") });
    ResourceContextKey.Extension = new contextkey_1.RawContextKey('resourceExtname', undefined, { type: 'string', description: (0, nls_1.localize)('resourceExtname', "The extension name of the resource") });
    ResourceContextKey.HasResource = new contextkey_1.RawContextKey('resourceSet', undefined, { type: 'boolean', description: (0, nls_1.localize)('resourceSet', "Whether a resource is present or not") });
    ResourceContextKey.IsFileSystemResource = new contextkey_1.RawContextKey('isFileSystemResource', undefined, { type: 'boolean', description: (0, nls_1.localize)('isFileSystemResource', "Whether the resource is backed by a file system provider") });
    ResourceContextKey = __decorate([
        __param(0, contextkey_1.IContextKeyService),
        __param(1, files_1.IFileService),
        __param(2, language_1.ILanguageService),
        __param(3, model_1.IModelService)
    ], ResourceContextKey);
    exports.ResourceContextKey = ResourceContextKey;
});
//#endregion
//# sourceMappingURL=contextkeys.js.map