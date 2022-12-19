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
define(["require", "exports", "vs/platform/instantiation/common/instantiation", "vs/platform/editor/common/editor", "vs/workbench/common/editor", "vs/workbench/common/editor/editorInput", "vs/workbench/common/editor/sideBySideEditorInput", "vs/base/common/map", "vs/platform/files/common/files", "vs/base/common/event", "vs/base/common/uri", "vs/base/common/resources", "vs/workbench/common/editor/diffEditorInput", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/platform/configuration/common/configuration", "vs/base/common/lifecycle", "vs/base/common/arrays", "vs/editor/browser/editorBrowser", "vs/platform/instantiation/common/extensions", "vs/base/common/types", "vs/workbench/browser/parts/editor/editorsObserver", "vs/base/common/async", "vs/platform/workspace/common/workspace", "vs/base/common/extpath", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/platform/workspace/common/workspaceTrust", "vs/workbench/services/host/browser/host", "vs/workbench/services/editor/common/editorGroupFinder", "vs/workbench/services/textfile/common/textEditorService"], function (require, exports, instantiation_1, editor_1, editor_2, editorInput_1, sideBySideEditorInput_1, map_1, files_1, event_1, uri_1, resources_1, diffEditorInput_1, editorGroupsService_1, editorService_1, configuration_1, lifecycle_1, arrays_1, editorBrowser_1, extensions_1, types_1, editorsObserver_1, async_1, workspace_1, extpath_1, uriIdentity_1, editorResolverService_1, workingCopyService_1, workspaceTrust_1, host_1, editorGroupFinder_1, textEditorService_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorService = void 0;
    let EditorService = class EditorService extends lifecycle_1.Disposable {
        //#endregion
        constructor(editorGroupService, instantiationService, fileService, configurationService, contextService, uriIdentityService, editorResolverService, workingCopyService, workspaceTrustRequestService, hostService, textEditorService) {
            super();
            this.editorGroupService = editorGroupService;
            this.instantiationService = instantiationService;
            this.fileService = fileService;
            this.configurationService = configurationService;
            this.contextService = contextService;
            this.uriIdentityService = uriIdentityService;
            this.editorResolverService = editorResolverService;
            this.workingCopyService = workingCopyService;
            this.workspaceTrustRequestService = workspaceTrustRequestService;
            this.hostService = hostService;
            this.textEditorService = textEditorService;
            //#region events
            this._onDidActiveEditorChange = this._register(new event_1.Emitter());
            this.onDidActiveEditorChange = this._onDidActiveEditorChange.event;
            this._onDidVisibleEditorsChange = this._register(new event_1.Emitter());
            this.onDidVisibleEditorsChange = this._onDidVisibleEditorsChange.event;
            this._onDidEditorsChange = this._register(new event_1.Emitter());
            this.onDidEditorsChange = this._onDidEditorsChange.event;
            this._onDidCloseEditor = this._register(new event_1.Emitter());
            this.onDidCloseEditor = this._onDidCloseEditor.event;
            this._onDidOpenEditorFail = this._register(new event_1.Emitter());
            this.onDidOpenEditorFail = this._onDidOpenEditorFail.event;
            this._onDidMostRecentlyActiveEditorsChange = this._register(new event_1.Emitter());
            this.onDidMostRecentlyActiveEditorsChange = this._onDidMostRecentlyActiveEditorsChange.event;
            //#region Editor & group event handlers
            this.lastActiveEditor = undefined;
            //#endregion
            //#region Visible Editors Change: Install file watchers for out of workspace resources that became visible
            this.activeOutOfWorkspaceWatchers = new map_1.ResourceMap();
            this.closeOnFileDelete = false;
            //#endregion
            //#region Editor accessors
            this.editorsObserver = this._register(this.instantiationService.createInstance(editorsObserver_1.EditorsObserver));
            this.onConfigurationUpdated(configurationService.getValue());
            this.registerListeners();
        }
        registerListeners() {
            // Editor & group changes
            this.editorGroupService.whenReady.then(() => this.onEditorGroupsReady());
            this.editorGroupService.onDidChangeActiveGroup(group => this.handleActiveEditorChange(group));
            this.editorGroupService.onDidAddGroup(group => this.registerGroupListeners(group));
            this.editorsObserver.onDidMostRecentlyActiveEditorsChange(() => this._onDidMostRecentlyActiveEditorsChange.fire());
            // Out of workspace file watchers
            this._register(this.onDidVisibleEditorsChange(() => this.handleVisibleEditorsChange()));
            // File changes & operations
            // Note: there is some duplication with the two file event handlers- Since we cannot always rely on the disk events
            // carrying all necessary data in all environments, we also use the file operation events to make sure operations are handled.
            // In any case there is no guarantee if the local event is fired first or the disk one. Thus, code must handle the case
            // that the event ordering is random as well as might not carry all information needed.
            this._register(this.fileService.onDidRunOperation(e => this.onDidRunFileOperation(e)));
            this._register(this.fileService.onDidFilesChange(e => this.onDidFilesChange(e)));
            // Configuration
            this._register(this.configurationService.onDidChangeConfiguration(e => this.onConfigurationUpdated(this.configurationService.getValue())));
        }
        onEditorGroupsReady() {
            // Register listeners to each opened group
            for (const group of this.editorGroupService.groups) {
                this.registerGroupListeners(group);
            }
            // Fire initial set of editor events if there is an active editor
            if (this.activeEditor) {
                this.doHandleActiveEditorChangeEvent();
                this._onDidVisibleEditorsChange.fire();
            }
        }
        handleActiveEditorChange(group) {
            if (group !== this.editorGroupService.activeGroup) {
                return; // ignore if not the active group
            }
            if (!this.lastActiveEditor && !group.activeEditor) {
                return; // ignore if we still have no active editor
            }
            this.doHandleActiveEditorChangeEvent();
        }
        doHandleActiveEditorChangeEvent() {
            // Remember as last active
            const activeGroup = this.editorGroupService.activeGroup;
            this.lastActiveEditor = (0, types_1.withNullAsUndefined)(activeGroup.activeEditor);
            // Fire event to outside parties
            this._onDidActiveEditorChange.fire();
        }
        registerGroupListeners(group) {
            const groupDisposables = new lifecycle_1.DisposableStore();
            groupDisposables.add(group.onDidModelChange(e => {
                this._onDidEditorsChange.fire({ groupId: group.id, event: e });
            }));
            groupDisposables.add(group.onDidActiveEditorChange(() => {
                this.handleActiveEditorChange(group);
                this._onDidVisibleEditorsChange.fire();
            }));
            groupDisposables.add(group.onDidCloseEditor(e => {
                this._onDidCloseEditor.fire(e);
            }));
            groupDisposables.add(group.onDidOpenEditorFail(editor => {
                this._onDidOpenEditorFail.fire({ editor, groupId: group.id });
            }));
            event_1.Event.once(group.onWillDispose)(() => {
                (0, lifecycle_1.dispose)(groupDisposables);
            });
        }
        handleVisibleEditorsChange() {
            const visibleOutOfWorkspaceResources = new map_1.ResourceMap();
            for (const editor of this.visibleEditors) {
                const resources = (0, arrays_1.distinct)((0, arrays_1.coalesce)([
                    editor_2.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_2.SideBySideEditor.PRIMARY }),
                    editor_2.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_2.SideBySideEditor.SECONDARY })
                ]), resource => resource.toString());
                for (const resource of resources) {
                    if (this.fileService.hasProvider(resource) && !this.contextService.isInsideWorkspace(resource)) {
                        visibleOutOfWorkspaceResources.set(resource, resource);
                    }
                }
            }
            // Handle no longer visible out of workspace resources
            for (const resource of this.activeOutOfWorkspaceWatchers.keys()) {
                if (!visibleOutOfWorkspaceResources.get(resource)) {
                    (0, lifecycle_1.dispose)(this.activeOutOfWorkspaceWatchers.get(resource));
                    this.activeOutOfWorkspaceWatchers.delete(resource);
                }
            }
            // Handle newly visible out of workspace resources
            for (const resource of visibleOutOfWorkspaceResources.keys()) {
                if (!this.activeOutOfWorkspaceWatchers.get(resource)) {
                    const disposable = this.fileService.watch(resource);
                    this.activeOutOfWorkspaceWatchers.set(resource, disposable);
                }
            }
        }
        //#endregion
        //#region File Changes: Move & Deletes to move or close opend editors
        async onDidRunFileOperation(e) {
            // Handle moves specially when file is opened
            if (e.isOperation(2 /* FileOperation.MOVE */)) {
                this.handleMovedFile(e.resource, e.target.resource);
            }
            // Handle deletes
            if (e.isOperation(1 /* FileOperation.DELETE */) || e.isOperation(2 /* FileOperation.MOVE */)) {
                this.handleDeletedFile(e.resource, false, e.target ? e.target.resource : undefined);
            }
        }
        onDidFilesChange(e) {
            if (e.gotDeleted()) {
                this.handleDeletedFile(e, true);
            }
        }
        async handleMovedFile(source, target) {
            for (const group of this.editorGroupService.groups) {
                let replacements = [];
                for (const editor of group.editors) {
                    const resource = editor.resource;
                    if (!resource || !this.uriIdentityService.extUri.isEqualOrParent(resource, source)) {
                        continue; // not matching our resource
                    }
                    // Determine new resulting target resource
                    let targetResource;
                    if (this.uriIdentityService.extUri.isEqual(source, resource)) {
                        targetResource = target; // file got moved
                    }
                    else {
                        const index = (0, extpath_1.indexOfPath)(resource.path, source.path, this.uriIdentityService.extUri.ignorePathCasing(resource));
                        targetResource = (0, resources_1.joinPath)(target, resource.path.substr(index + source.path.length + 1)); // parent folder got moved
                    }
                    // Delegate rename() to editor instance
                    const moveResult = await editor.rename(group.id, targetResource);
                    if (!moveResult) {
                        return; // not target - ignore
                    }
                    const optionOverrides = {
                        preserveFocus: true,
                        pinned: group.isPinned(editor),
                        sticky: group.isSticky(editor),
                        index: group.getIndexOfEditor(editor),
                        inactive: !group.isActive(editor)
                    };
                    // Construct a replacement with our extra options mixed in
                    if ((0, editor_2.isEditorInput)(moveResult.editor)) {
                        replacements.push({
                            editor,
                            replacement: moveResult.editor,
                            options: Object.assign(Object.assign({}, moveResult.options), optionOverrides)
                        });
                    }
                    else {
                        replacements.push({
                            editor,
                            replacement: Object.assign(Object.assign({}, moveResult.editor), { options: Object.assign(Object.assign({}, moveResult.editor.options), optionOverrides) })
                        });
                    }
                }
                // Apply replacements
                if (replacements.length) {
                    this.replaceEditors(replacements, group);
                }
            }
        }
        onConfigurationUpdated(configuration) {
            var _a, _b;
            if (typeof ((_b = (_a = configuration.workbench) === null || _a === void 0 ? void 0 : _a.editor) === null || _b === void 0 ? void 0 : _b.closeOnFileDelete) === 'boolean') {
                this.closeOnFileDelete = configuration.workbench.editor.closeOnFileDelete;
            }
            else {
                this.closeOnFileDelete = false; // default
            }
        }
        handleDeletedFile(arg1, isExternal, movedTo) {
            for (const editor of this.getAllNonDirtyEditors({ includeUntitled: false, supportSideBySide: true })) {
                (async () => {
                    const resource = editor.resource;
                    if (!resource) {
                        return;
                    }
                    // Handle deletes in opened editors depending on:
                    // - we close any editor when `closeOnFileDelete: true`
                    // - we close any editor when the delete occurred from within VSCode
                    // - we close any editor without resolved working copy assuming that
                    //   this editor could not be opened after the file is gone
                    if (this.closeOnFileDelete || !isExternal || !this.workingCopyService.has(resource)) {
                        // Do NOT close any opened editor that matches the resource path (either equal or being parent) of the
                        // resource we move to (movedTo). Otherwise we would close a resource that has been renamed to the same
                        // path but different casing.
                        if (movedTo && this.uriIdentityService.extUri.isEqualOrParent(resource, movedTo)) {
                            return;
                        }
                        let matches = false;
                        if (arg1 instanceof files_1.FileChangesEvent) {
                            matches = arg1.contains(resource, 2 /* FileChangeType.DELETED */);
                        }
                        else {
                            matches = this.uriIdentityService.extUri.isEqualOrParent(resource, arg1);
                        }
                        if (!matches) {
                            return;
                        }
                        // We have received reports of users seeing delete events even though the file still
                        // exists (network shares issue: https://github.com/microsoft/vscode/issues/13665).
                        // Since we do not want to close an editor without reason, we have to check if the
                        // file is really gone and not just a faulty file event.
                        // This only applies to external file events, so we need to check for the isExternal
                        // flag.
                        let exists = false;
                        if (isExternal && this.fileService.hasProvider(resource)) {
                            await (0, async_1.timeout)(100);
                            exists = await this.fileService.exists(resource);
                        }
                        if (!exists && !editor.isDisposed()) {
                            editor.dispose();
                        }
                    }
                })();
            }
        }
        getAllNonDirtyEditors(options) {
            const editors = [];
            function conditionallyAddEditor(editor) {
                if (editor.hasCapability(4 /* EditorInputCapabilities.Untitled */) && !options.includeUntitled) {
                    return;
                }
                if (editor.isDirty()) {
                    return;
                }
                editors.push(editor);
            }
            for (const editor of this.editors) {
                if (options.supportSideBySide && editor instanceof sideBySideEditorInput_1.SideBySideEditorInput) {
                    conditionallyAddEditor(editor.primary);
                    conditionallyAddEditor(editor.secondary);
                }
                else {
                    conditionallyAddEditor(editor);
                }
            }
            return editors;
        }
        get activeEditorPane() {
            var _a;
            return (_a = this.editorGroupService.activeGroup) === null || _a === void 0 ? void 0 : _a.activeEditorPane;
        }
        get activeTextEditorControl() {
            const activeEditorPane = this.activeEditorPane;
            if (activeEditorPane) {
                const activeControl = activeEditorPane.getControl();
                if ((0, editorBrowser_1.isCodeEditor)(activeControl) || (0, editorBrowser_1.isDiffEditor)(activeControl)) {
                    return activeControl;
                }
                if ((0, editorBrowser_1.isCompositeEditor)(activeControl) && (0, editorBrowser_1.isCodeEditor)(activeControl.activeCodeEditor)) {
                    return activeControl.activeCodeEditor;
                }
            }
            return undefined;
        }
        get activeTextEditorLanguageId() {
            var _a;
            let activeCodeEditor = undefined;
            const activeTextEditorControl = this.activeTextEditorControl;
            if ((0, editorBrowser_1.isDiffEditor)(activeTextEditorControl)) {
                activeCodeEditor = activeTextEditorControl.getModifiedEditor();
            }
            else {
                activeCodeEditor = activeTextEditorControl;
            }
            return (_a = activeCodeEditor === null || activeCodeEditor === void 0 ? void 0 : activeCodeEditor.getModel()) === null || _a === void 0 ? void 0 : _a.getLanguageId();
        }
        get count() {
            return this.editorsObserver.count;
        }
        get editors() {
            return this.getEditors(1 /* EditorsOrder.SEQUENTIAL */).map(({ editor }) => editor);
        }
        getEditors(order, options) {
            switch (order) {
                // MRU
                case 0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */:
                    if (options === null || options === void 0 ? void 0 : options.excludeSticky) {
                        return this.editorsObserver.editors.filter(({ groupId, editor }) => { var _a; return !((_a = this.editorGroupService.getGroup(groupId)) === null || _a === void 0 ? void 0 : _a.isSticky(editor)); });
                    }
                    return this.editorsObserver.editors;
                // Sequential
                case 1 /* EditorsOrder.SEQUENTIAL */: {
                    const editors = [];
                    for (const group of this.editorGroupService.getGroups(2 /* GroupsOrder.GRID_APPEARANCE */)) {
                        editors.push(...group.getEditors(1 /* EditorsOrder.SEQUENTIAL */, options).map(editor => ({ editor, groupId: group.id })));
                    }
                    return editors;
                }
            }
        }
        get activeEditor() {
            const activeGroup = this.editorGroupService.activeGroup;
            return activeGroup ? (0, types_1.withNullAsUndefined)(activeGroup.activeEditor) : undefined;
        }
        get visibleEditorPanes() {
            return (0, arrays_1.coalesce)(this.editorGroupService.groups.map(group => group.activeEditorPane));
        }
        get visibleTextEditorControls() {
            const visibleTextEditorControls = [];
            for (const visibleEditorPane of this.visibleEditorPanes) {
                const control = visibleEditorPane.getControl();
                if ((0, editorBrowser_1.isCodeEditor)(control) || (0, editorBrowser_1.isDiffEditor)(control)) {
                    visibleTextEditorControls.push(control);
                }
            }
            return visibleTextEditorControls;
        }
        get visibleEditors() {
            return (0, arrays_1.coalesce)(this.editorGroupService.groups.map(group => group.activeEditor));
        }
        async openEditor(editor, optionsOrPreferredGroup, preferredGroup) {
            let typedEditor = undefined;
            let options = (0, editor_2.isEditorInput)(editor) ? optionsOrPreferredGroup : editor.options;
            let group = undefined;
            if ((0, editorService_1.isPreferredGroup)(optionsOrPreferredGroup)) {
                preferredGroup = optionsOrPreferredGroup;
            }
            // Resolve override unless disabled
            if ((options === null || options === void 0 ? void 0 : options.override) !== editor_1.EditorResolution.DISABLED) {
                const resolvedEditor = await this.editorResolverService.resolveEditor((0, editor_2.isEditorInput)(editor) ? { editor, options } : editor, preferredGroup);
                if (resolvedEditor === 1 /* ResolvedStatus.ABORT */) {
                    return; // skip editor if override is aborted
                }
                // We resolved an editor to use
                if ((0, editor_2.isEditorInputWithOptionsAndGroup)(resolvedEditor)) {
                    typedEditor = resolvedEditor.editor;
                    options = resolvedEditor.options;
                    group = resolvedEditor.group;
                }
            }
            // Override is disabled or did not apply: fallback to default
            if (!typedEditor) {
                typedEditor = (0, editor_2.isEditorInput)(editor) ? editor : this.textEditorService.createTextEditor(editor);
            }
            // If group still isn't defined because of a disabled override we resolve it
            if (!group) {
                let activation = undefined;
                ([group, activation] = this.instantiationService.invokeFunction(editorGroupFinder_1.findGroup, { editor: typedEditor, options }, preferredGroup));
                // Mixin editor group activation if returned
                if (activation) {
                    options = Object.assign(Object.assign({}, options), { activation });
                }
            }
            return group.openEditor(typedEditor, options);
        }
        async openEditors(editors, preferredGroup, options) {
            var _a;
            // Pass all editors to trust service to determine if
            // we should proceed with opening the editors if we
            // are asked to validate trust.
            if (options === null || options === void 0 ? void 0 : options.validateTrust) {
                const editorsTrusted = await this.handleWorkspaceTrust(editors);
                if (!editorsTrusted) {
                    return [];
                }
            }
            // Find target groups for editors to open
            const mapGroupToTypedEditors = new Map();
            for (const editor of editors) {
                let typedEditor = undefined;
                let group = undefined;
                // Resolve override unless disabled
                if (((_a = editor.options) === null || _a === void 0 ? void 0 : _a.override) !== editor_1.EditorResolution.DISABLED) {
                    const resolvedEditor = await this.editorResolverService.resolveEditor(editor, preferredGroup);
                    if (resolvedEditor === 1 /* ResolvedStatus.ABORT */) {
                        continue; // skip editor if override is aborted
                    }
                    // We resolved an editor to use
                    if ((0, editor_2.isEditorInputWithOptionsAndGroup)(resolvedEditor)) {
                        typedEditor = resolvedEditor;
                        group = resolvedEditor.group;
                    }
                }
                // Override is disabled or did not apply: fallback to default
                if (!typedEditor) {
                    typedEditor = (0, editor_2.isEditorInputWithOptions)(editor) ? editor : { editor: this.textEditorService.createTextEditor(editor), options: editor.options };
                }
                // If group still isn't defined because of a disabled override we resolve it
                if (!group) {
                    [group] = this.instantiationService.invokeFunction(editorGroupFinder_1.findGroup, typedEditor, preferredGroup);
                }
                // Update map of groups to editors
                let targetGroupEditors = mapGroupToTypedEditors.get(group);
                if (!targetGroupEditors) {
                    targetGroupEditors = [];
                    mapGroupToTypedEditors.set(group, targetGroupEditors);
                }
                targetGroupEditors.push(typedEditor);
            }
            // Open in target groups
            const result = [];
            for (const [group, editors] of mapGroupToTypedEditors) {
                result.push(group.openEditors(editors));
            }
            return (0, arrays_1.coalesce)(await async_1.Promises.settled(result));
        }
        async handleWorkspaceTrust(editors) {
            const { resources, diffMode } = this.extractEditorResources(editors);
            const trustResult = await this.workspaceTrustRequestService.requestOpenFilesTrust(resources);
            switch (trustResult) {
                case 1 /* WorkspaceTrustUriResponse.Open */:
                    return true;
                case 2 /* WorkspaceTrustUriResponse.OpenInNewWindow */:
                    await this.hostService.openWindow(resources.map(resource => ({ fileUri: resource })), { forceNewWindow: true, diffMode });
                    return false;
                case 3 /* WorkspaceTrustUriResponse.Cancel */:
                    return false;
            }
        }
        extractEditorResources(editors) {
            const resources = new map_1.ResourceMap();
            let diffMode = false;
            for (const editor of editors) {
                // Typed Editor
                if ((0, editor_2.isEditorInputWithOptions)(editor)) {
                    const resource = editor_2.EditorResourceAccessor.getOriginalUri(editor.editor, { supportSideBySide: editor_2.SideBySideEditor.BOTH });
                    if (uri_1.URI.isUri(resource)) {
                        resources.set(resource, true);
                    }
                    else if (resource) {
                        if (resource.primary) {
                            resources.set(resource.primary, true);
                        }
                        if (resource.secondary) {
                            resources.set(resource.secondary, true);
                        }
                        diffMode = editor.editor instanceof diffEditorInput_1.DiffEditorInput;
                    }
                }
                // Untyped editor
                else {
                    if ((0, editor_2.isResourceDiffEditorInput)(editor)) {
                        const originalResourceEditor = editor.original;
                        if (uri_1.URI.isUri(originalResourceEditor.resource)) {
                            resources.set(originalResourceEditor.resource, true);
                        }
                        const modifiedResourceEditor = editor.modified;
                        if (uri_1.URI.isUri(modifiedResourceEditor.resource)) {
                            resources.set(modifiedResourceEditor.resource, true);
                        }
                        diffMode = true;
                    }
                    else if ((0, editor_2.isResourceEditorInput)(editor)) {
                        resources.set(editor.resource, true);
                    }
                }
            }
            return {
                resources: Array.from(resources.keys()),
                diffMode
            };
        }
        //#endregion
        //#region isOpened()
        isOpened(editor) {
            return this.editorsObserver.hasEditor({
                resource: this.uriIdentityService.asCanonicalUri(editor.resource),
                typeId: editor.typeId,
                editorId: editor.editorId
            });
        }
        //#endregion
        //#region isOpened()
        isVisible(editor) {
            var _a;
            for (const group of this.editorGroupService.groups) {
                if ((_a = group.activeEditor) === null || _a === void 0 ? void 0 : _a.matches(editor)) {
                    return true;
                }
            }
            return false;
        }
        //#endregion
        //#region closeEditor()
        async closeEditor({ editor, groupId }, options) {
            const group = this.editorGroupService.getGroup(groupId);
            await (group === null || group === void 0 ? void 0 : group.closeEditor(editor, options));
        }
        //#endregion
        //#region closeEditors()
        async closeEditors(editors, options) {
            const mapGroupToEditors = new Map();
            for (const { editor, groupId } of editors) {
                const group = this.editorGroupService.getGroup(groupId);
                if (!group) {
                    continue;
                }
                let editors = mapGroupToEditors.get(group);
                if (!editors) {
                    editors = [];
                    mapGroupToEditors.set(group, editors);
                }
                editors.push(editor);
            }
            for (const [group, editors] of mapGroupToEditors) {
                await group.closeEditors(editors, options);
            }
        }
        findEditors(arg1, options, arg2) {
            const resource = uri_1.URI.isUri(arg1) ? arg1 : arg1.resource;
            const typeId = uri_1.URI.isUri(arg1) ? undefined : arg1.typeId;
            // Do a quick check for the resource via the editor observer
            // which is a very efficient way to find an editor by resource.
            // However, we can only do that unless we are asked to find an
            // editor on the secondary side of a side by side editor, because
            // the editor observer provides fast lookups only for primary
            // editors.
            if ((options === null || options === void 0 ? void 0 : options.supportSideBySide) !== editor_2.SideBySideEditor.ANY && (options === null || options === void 0 ? void 0 : options.supportSideBySide) !== editor_2.SideBySideEditor.SECONDARY) {
                if (!this.editorsObserver.hasEditors(resource)) {
                    if (uri_1.URI.isUri(arg1) || (0, types_1.isUndefined)(arg2)) {
                        return [];
                    }
                    return undefined;
                }
            }
            // Search only in specific group
            if (!(0, types_1.isUndefined)(arg2)) {
                const targetGroup = typeof arg2 === 'number' ? this.editorGroupService.getGroup(arg2) : arg2;
                // Resource provided: result is an array
                if (uri_1.URI.isUri(arg1)) {
                    if (!targetGroup) {
                        return [];
                    }
                    return targetGroup.findEditors(resource, options);
                }
                // Editor identifier provided, result is single
                else {
                    if (!targetGroup) {
                        return undefined;
                    }
                    const editors = targetGroup.findEditors(resource, options);
                    for (const editor of editors) {
                        if (editor.typeId === typeId) {
                            return editor;
                        }
                    }
                    return undefined;
                }
            }
            // Search across all groups in MRU order
            else {
                const result = [];
                for (const group of this.editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                    const editors = [];
                    // Resource provided: result is an array
                    if (uri_1.URI.isUri(arg1)) {
                        editors.push(...this.findEditors(arg1, options, group));
                    }
                    // Editor identifier provided, result is single
                    else {
                        const editor = this.findEditors(arg1, options, group);
                        if (editor) {
                            editors.push(editor);
                        }
                    }
                    result.push(...editors.map(editor => ({ editor, groupId: group.id })));
                }
                return result;
            }
        }
        async replaceEditors(replacements, group) {
            var _a, _b;
            const targetGroup = typeof group === 'number' ? this.editorGroupService.getGroup(group) : group;
            // Convert all replacements to typed editors unless already
            // typed and handle overrides properly.
            const typedReplacements = [];
            for (const replacement of replacements) {
                let typedReplacement = undefined;
                // Figure out the override rule based on options
                let override;
                if ((0, editorGroupsService_1.isEditorReplacement)(replacement)) {
                    override = (_a = replacement.options) === null || _a === void 0 ? void 0 : _a.override;
                }
                else {
                    override = (_b = replacement.replacement.options) === null || _b === void 0 ? void 0 : _b.override;
                }
                // Resolve override unless disabled
                if (override !== editor_1.EditorResolution.DISABLED) {
                    const resolvedEditor = await this.editorResolverService.resolveEditor((0, editorGroupsService_1.isEditorReplacement)(replacement) ? { editor: replacement.replacement, options: replacement.options } : replacement.replacement, targetGroup);
                    if (resolvedEditor === 1 /* ResolvedStatus.ABORT */) {
                        continue; // skip editor if override is aborted
                    }
                    // We resolved an editor to use
                    if ((0, editor_2.isEditorInputWithOptionsAndGroup)(resolvedEditor)) {
                        typedReplacement = {
                            editor: replacement.editor,
                            replacement: resolvedEditor.editor,
                            options: resolvedEditor.options,
                            forceReplaceDirty: replacement.forceReplaceDirty
                        };
                    }
                }
                // Override is disabled or did not apply: fallback to default
                if (!typedReplacement) {
                    typedReplacement = {
                        editor: replacement.editor,
                        replacement: (0, editorGroupsService_1.isEditorReplacement)(replacement) ? replacement.replacement : this.textEditorService.createTextEditor(replacement.replacement),
                        options: (0, editorGroupsService_1.isEditorReplacement)(replacement) ? replacement.options : replacement.replacement.options,
                        forceReplaceDirty: replacement.forceReplaceDirty
                    };
                }
                typedReplacements.push(typedReplacement);
            }
            return targetGroup === null || targetGroup === void 0 ? void 0 : targetGroup.replaceEditors(typedReplacements);
        }
        //#endregion
        //#region save/revert
        async save(editors, options) {
            // Convert to array
            if (!Array.isArray(editors)) {
                editors = [editors];
            }
            // Make sure to not save the same editor multiple times
            // by using the `matches()` method to find duplicates
            const uniqueEditors = this.getUniqueEditors(editors);
            // Split editors up into a bucket that is saved in parallel
            // and sequentially. Unless "Save As", all non-untitled editors
            // can be saved in parallel to speed up the operation. Remaining
            // editors are potentially bringing up some UI and thus run
            // sequentially.
            const editorsToSaveParallel = [];
            const editorsToSaveSequentially = [];
            if (options === null || options === void 0 ? void 0 : options.saveAs) {
                editorsToSaveSequentially.push(...uniqueEditors);
            }
            else {
                for (const { groupId, editor } of uniqueEditors) {
                    if (editor.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                        editorsToSaveSequentially.push({ groupId, editor });
                    }
                    else {
                        editorsToSaveParallel.push({ groupId, editor });
                    }
                }
            }
            // Editors to save in parallel
            const saveResults = await async_1.Promises.settled(editorsToSaveParallel.map(({ groupId, editor }) => {
                var _a;
                // Use save as a hint to pin the editor if used explicitly
                if ((options === null || options === void 0 ? void 0 : options.reason) === 1 /* SaveReason.EXPLICIT */) {
                    (_a = this.editorGroupService.getGroup(groupId)) === null || _a === void 0 ? void 0 : _a.pinEditor(editor);
                }
                // Save
                return editor.save(groupId, options);
            }));
            // Editors to save sequentially
            for (const { groupId, editor } of editorsToSaveSequentially) {
                if (editor.isDisposed()) {
                    continue; // might have been disposed from the save already
                }
                // Preserve view state by opening the editor first if the editor
                // is untitled or we "Save As". This also allows the user to review
                // the contents of the editor before making a decision.
                const editorPane = await this.openEditor(editor, groupId);
                const editorOptions = {
                    pinned: true,
                    viewState: editorPane === null || editorPane === void 0 ? void 0 : editorPane.getViewState()
                };
                const result = (options === null || options === void 0 ? void 0 : options.saveAs) ? await editor.saveAs(groupId, options) : await editor.save(groupId, options);
                saveResults.push(result);
                if (!result) {
                    break; // failed or cancelled, abort
                }
                // Replace editor preserving viewstate (either across all groups or
                // only selected group) if the resulting editor is different from the
                // current one.
                if (!editor.matches(result)) {
                    const targetGroups = editor.hasCapability(4 /* EditorInputCapabilities.Untitled */) ? this.editorGroupService.groups.map(group => group.id) /* untitled replaces across all groups */ : [groupId];
                    for (const targetGroup of targetGroups) {
                        if (result instanceof editorInput_1.EditorInput) {
                            await this.replaceEditors([{ editor, replacement: result, options: editorOptions }], targetGroup);
                        }
                        else {
                            await this.replaceEditors([{ editor, replacement: Object.assign(Object.assign({}, result), { options: editorOptions }) }], targetGroup);
                        }
                    }
                }
            }
            return saveResults.every(result => !!result);
        }
        saveAll(options) {
            return this.save(this.getAllDirtyEditors(options), options);
        }
        async revert(editors, options) {
            // Convert to array
            if (!Array.isArray(editors)) {
                editors = [editors];
            }
            // Make sure to not revert the same editor multiple times
            // by using the `matches()` method to find duplicates
            const uniqueEditors = this.getUniqueEditors(editors);
            await async_1.Promises.settled(uniqueEditors.map(async ({ groupId, editor }) => {
                var _a;
                // Use revert as a hint to pin the editor
                (_a = this.editorGroupService.getGroup(groupId)) === null || _a === void 0 ? void 0 : _a.pinEditor(editor);
                return editor.revert(groupId, options);
            }));
            return !uniqueEditors.some(({ editor }) => editor.isDirty());
        }
        async revertAll(options) {
            return this.revert(this.getAllDirtyEditors(options), options);
        }
        getAllDirtyEditors(options) {
            const editors = [];
            for (const group of this.editorGroupService.getGroups(1 /* GroupsOrder.MOST_RECENTLY_ACTIVE */)) {
                for (const editor of group.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */)) {
                    if (!editor.isDirty()) {
                        continue;
                    }
                    if (!(options === null || options === void 0 ? void 0 : options.includeUntitled) && editor.hasCapability(4 /* EditorInputCapabilities.Untitled */)) {
                        continue;
                    }
                    if ((options === null || options === void 0 ? void 0 : options.excludeSticky) && group.isSticky(editor)) {
                        continue;
                    }
                    editors.push({ groupId: group.id, editor });
                }
            }
            return editors;
        }
        getUniqueEditors(editors) {
            const uniqueEditors = [];
            for (const { editor, groupId } of editors) {
                if (uniqueEditors.some(uniqueEditor => uniqueEditor.editor.matches(editor))) {
                    continue;
                }
                uniqueEditors.push({ editor, groupId });
            }
            return uniqueEditors;
        }
        //#endregion
        dispose() {
            super.dispose();
            // Dispose remaining watchers if any
            this.activeOutOfWorkspaceWatchers.forEach(disposable => (0, lifecycle_1.dispose)(disposable));
            this.activeOutOfWorkspaceWatchers.clear();
        }
    };
    EditorService = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, files_1.IFileService),
        __param(3, configuration_1.IConfigurationService),
        __param(4, workspace_1.IWorkspaceContextService),
        __param(5, uriIdentity_1.IUriIdentityService),
        __param(6, editorResolverService_1.IEditorResolverService),
        __param(7, workingCopyService_1.IWorkingCopyService),
        __param(8, workspaceTrust_1.IWorkspaceTrustRequestService),
        __param(9, host_1.IHostService),
        __param(10, textEditorService_1.ITextEditorService)
    ], EditorService);
    exports.EditorService = EditorService;
    (0, extensions_1.registerSingleton)(editorService_1.IEditorService, EditorService);
});
//# sourceMappingURL=editorService.js.map