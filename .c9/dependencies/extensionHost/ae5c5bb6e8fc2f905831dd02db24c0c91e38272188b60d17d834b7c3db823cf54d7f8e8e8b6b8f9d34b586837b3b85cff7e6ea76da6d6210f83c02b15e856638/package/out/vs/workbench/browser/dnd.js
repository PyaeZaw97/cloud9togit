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
define(["require", "exports", "vs/nls", "vs/platform/dialogs/common/dialogs", "vs/base/common/buffer", "vs/base/common/severity", "vs/platform/workspaces/common/workspaces", "vs/base/common/resources", "vs/platform/files/common/files", "vs/base/common/uri", "vs/workbench/services/textfile/common/textfiles", "vs/base/common/network", "vs/base/browser/dnd", "vs/base/common/mime", "vs/base/common/platform", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle", "vs/base/browser/dom", "vs/workbench/services/workspaces/common/workspaceEditing", "vs/workbench/services/host/browser/host", "vs/base/common/event", "vs/base/common/arrays", "vs/base/common/marshalling", "vs/platform/label/common/label", "vs/platform/workspace/common/workspace", "vs/base/common/types", "vs/platform/opener/common/opener", "vs/platform/files/browser/webFileSystemAccess", "vs/platform/files/browser/htmlFileSystemProvider", "vs/base/common/async", "vs/platform/registry/common/platform"], function (require, exports, nls_1, dialogs_1, buffer_1, severity_1, workspaces_1, resources_1, files_1, uri_1, textfiles_1, network_1, dnd_1, mime_1, platform_1, instantiation_1, editor_1, editorService_1, lifecycle_1, dom_1, workspaceEditing_1, host_1, event_1, arrays_1, marshalling_1, label_1, workspace_1, types_1, opener_1, webFileSystemAccess_1, htmlFileSystemProvider_1, async_1, platform_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ResourceListDnDHandler = exports.toggleDropEffect = exports.CompositeDragAndDropObserver = exports.DraggedViewIdentifier = exports.DraggedCompositeIdentifier = exports.CompositeDragAndDropData = exports.containsDragType = exports.LocalSelectionTransfer = exports.Extensions = exports.fillEditorsDragData = exports.ResourcesDropHandler = exports.extractFileListData = exports.convertResourceUrlsToUriList = exports.extractTreeDropData = exports.extractEditorsDropData = exports.CodeDataTransfers = exports.DraggedTreeItemsIdentifier = exports.DraggedEditorGroupIdentifier = exports.DraggedEditorIdentifier = void 0;
    //#region Editor / Resources DND
    class DraggedEditorIdentifier {
        constructor(identifier) {
            this.identifier = identifier;
        }
    }
    exports.DraggedEditorIdentifier = DraggedEditorIdentifier;
    class DraggedEditorGroupIdentifier {
        constructor(identifier) {
            this.identifier = identifier;
        }
    }
    exports.DraggedEditorGroupIdentifier = DraggedEditorGroupIdentifier;
    class DraggedTreeItemsIdentifier {
        constructor(identifier) {
            this.identifier = identifier;
        }
    }
    exports.DraggedTreeItemsIdentifier = DraggedTreeItemsIdentifier;
    exports.CodeDataTransfers = {
        EDITORS: 'CodeEditors',
        FILES: 'CodeFiles'
    };
    async function extractEditorsDropData(accessor, e) {
        var _a, _b;
        const editors = [];
        if (e.dataTransfer && e.dataTransfer.types.length > 0) {
            // Data Transfer: Code Editors
            const rawEditorsData = e.dataTransfer.getData(exports.CodeDataTransfers.EDITORS);
            if (rawEditorsData) {
                try {
                    editors.push(...(0, marshalling_1.parse)(rawEditorsData));
                }
                catch (error) {
                    // Invalid transfer
                }
            }
            // Data Transfer: Resources
            else {
                try {
                    const rawResourcesData = e.dataTransfer.getData(dnd_1.DataTransfers.RESOURCES);
                    editors.push(...createDraggedEditorInputFromRawResourcesData(rawResourcesData));
                }
                catch (error) {
                    // Invalid transfer
                }
            }
            // Check for native file transfer
            if ((_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.files) {
                for (let i = 0; i < e.dataTransfer.files.length; i++) {
                    const file = e.dataTransfer.files[i];
                    if (file === null || file === void 0 ? void 0 : file.path /* Electron only */) {
                        try {
                            editors.push({ resource: uri_1.URI.file(file.path), isExternal: true, allowWorkspaceOpen: true });
                        }
                        catch (error) {
                            // Invalid URI
                        }
                    }
                }
            }
            // Check for CodeFiles transfer
            const rawCodeFiles = e.dataTransfer.getData(exports.CodeDataTransfers.FILES);
            if (rawCodeFiles) {
                try {
                    const codeFiles = JSON.parse(rawCodeFiles);
                    for (const codeFile of codeFiles) {
                        editors.push({ resource: uri_1.URI.file(codeFile), isExternal: true, allowWorkspaceOpen: true });
                    }
                }
                catch (error) {
                    // Invalid transfer
                }
            }
            // Web: Check for file transfer
            if (platform_1.isWeb && containsDragType(e, dnd_1.DataTransfers.FILES)) {
                const files = e.dataTransfer.items;
                if (files) {
                    const instantiationService = accessor.get(instantiation_1.IInstantiationService);
                    const filesData = await instantiationService.invokeFunction(accessor => extractFilesDropData(accessor, e));
                    for (const fileData of filesData) {
                        editors.push({ resource: fileData.resource, contents: (_b = fileData.contents) === null || _b === void 0 ? void 0 : _b.toString(), isExternal: true, allowWorkspaceOpen: fileData.isDirectory });
                    }
                }
            }
            // Workbench contributions
            const contributions = platform_2.Registry.as(exports.Extensions.DragAndDropContribution).getAll();
            for (const contribution of contributions) {
                const data = e.dataTransfer.getData(contribution.dataFormatKey);
                if (data) {
                    try {
                        editors.push(...contribution.getEditorInputs(data));
                    }
                    catch (error) {
                        // Invalid transfer
                    }
                }
            }
        }
        return editors;
    }
    exports.extractEditorsDropData = extractEditorsDropData;
    function createDraggedEditorInputFromRawResourcesData(rawResourcesData) {
        const editors = [];
        if (rawResourcesData) {
            const resourcesRaw = JSON.parse(rawResourcesData);
            for (const resourceRaw of resourcesRaw) {
                if (resourceRaw.indexOf(':') > 0) { // mitigate https://github.com/microsoft/vscode/issues/124946
                    const { selection, uri } = (0, opener_1.extractSelection)(uri_1.URI.parse(resourceRaw));
                    editors.push({ resource: uri, options: { selection } });
                }
            }
        }
        return editors;
    }
    async function extractTreeDropData(dataTransfer) {
        var _a;
        const editors = [];
        const resourcesKey = mime_1.Mimes.uriList.toLowerCase();
        // Data Transfer: Resources
        if (dataTransfer.has(resourcesKey)) {
            try {
                const asString = await ((_a = dataTransfer.get(resourcesKey)) === null || _a === void 0 ? void 0 : _a.asString());
                const rawResourcesData = JSON.stringify(asString === null || asString === void 0 ? void 0 : asString.split('\\n').filter(value => !value.startsWith('#')));
                editors.push(...createDraggedEditorInputFromRawResourcesData(rawResourcesData));
            }
            catch (error) {
                // Invalid transfer
            }
        }
        return editors;
    }
    exports.extractTreeDropData = extractTreeDropData;
    function convertResourceUrlsToUriList(resourceUrls) {
        const asJson = JSON.parse(resourceUrls);
        return asJson.map(uri => uri.toString()).join('\n');
    }
    exports.convertResourceUrlsToUriList = convertResourceUrlsToUriList;
    async function extractFilesDropData(accessor, event) {
        var _a, _b;
        // Try to extract via `FileSystemHandle`
        if (webFileSystemAccess_1.WebFileSystemAccess.supported(window)) {
            const items = (_a = event.dataTransfer) === null || _a === void 0 ? void 0 : _a.items;
            if (items) {
                return extractFileTransferData(accessor, items);
            }
        }
        // Try to extract via `FileList`
        const files = (_b = event.dataTransfer) === null || _b === void 0 ? void 0 : _b.files;
        if (!files) {
            return [];
        }
        return extractFileListData(accessor, files);
    }
    async function extractFileTransferData(accessor, items) {
        const fileSystemProvider = accessor.get(files_1.IFileService).getProvider(network_1.Schemas.file);
        if (!(fileSystemProvider instanceof htmlFileSystemProvider_1.HTMLFileSystemProvider)) {
            return []; // only supported when running in web
        }
        const results = [];
        for (let i = 0; i < items.length; i++) {
            const file = items[i];
            if (file) {
                const result = new async_1.DeferredPromise();
                results.push(result);
                (async () => {
                    try {
                        const handle = await file.getAsFileSystemHandle();
                        if (!handle) {
                            result.complete(undefined);
                            return;
                        }
                        if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemFileHandle(handle)) {
                            result.complete({
                                resource: await fileSystemProvider.registerFileHandle(handle),
                                isDirectory: false
                            });
                        }
                        else if (webFileSystemAccess_1.WebFileSystemAccess.isFileSystemDirectoryHandle(handle)) {
                            result.complete({
                                resource: await fileSystemProvider.registerDirectoryHandle(handle),
                                isDirectory: true
                            });
                        }
                        else {
                            result.complete(undefined);
                        }
                    }
                    catch (error) {
                        result.complete(undefined);
                    }
                })();
            }
        }
        return (0, arrays_1.coalesce)(await Promise.all(results.map(result => result.p)));
    }
    async function extractFileListData(accessor, files) {
        const dialogService = accessor.get(dialogs_1.IDialogService);
        const results = [];
        for (let i = 0; i < files.length; i++) {
            const file = files.item(i);
            if (file) {
                // Skip for very large files because this operation is unbuffered
                if (file.size > 100 * files_1.ByteSize.MB) {
                    dialogService.show(severity_1.default.Warning, (0, nls_1.localize)('fileTooLarge', "File is too large to open as untitled editor. Please upload it first into the file explorer and then try again."));
                    continue;
                }
                const result = new async_1.DeferredPromise();
                results.push(result);
                const reader = new FileReader();
                reader.onerror = () => result.complete(undefined);
                reader.onabort = () => result.complete(undefined);
                reader.onload = async (event) => {
                    var _a;
                    const name = file.name;
                    const loadResult = (0, types_1.withNullAsUndefined)((_a = event.target) === null || _a === void 0 ? void 0 : _a.result);
                    if (typeof name !== 'string' || typeof loadResult === 'undefined') {
                        result.complete(undefined);
                        return;
                    }
                    result.complete({
                        resource: uri_1.URI.from({ scheme: network_1.Schemas.untitled, path: name }),
                        contents: typeof loadResult === 'string' ? buffer_1.VSBuffer.fromString(loadResult) : buffer_1.VSBuffer.wrap(new Uint8Array(loadResult))
                    });
                };
                // Start reading
                reader.readAsArrayBuffer(file);
            }
        }
        return (0, arrays_1.coalesce)(await Promise.all(results.map(result => result.p)));
    }
    exports.extractFileListData = extractFileListData;
    /**
     * Shared function across some components to handle drag & drop of resources.
     * E.g. of folders and workspace files to open them in the window instead of
     * the editor or to handle dirty editors being dropped between instances of Code.
     */
    let ResourcesDropHandler = class ResourcesDropHandler {
        constructor(options, fileService, workspacesService, editorService, workspaceEditingService, hostService, contextService, instantiationService) {
            this.options = options;
            this.fileService = fileService;
            this.workspacesService = workspacesService;
            this.editorService = editorService;
            this.workspaceEditingService = workspaceEditingService;
            this.hostService = hostService;
            this.contextService = contextService;
            this.instantiationService = instantiationService;
        }
        async handleDrop(event, resolveTargetGroup, afterDrop, targetIndex) {
            const editors = await this.instantiationService.invokeFunction(accessor => extractEditorsDropData(accessor, event));
            if (!editors.length) {
                return;
            }
            // Make the window active to handle the drop properly within
            await this.hostService.focus();
            // Check for workspace file / folder being dropped if we are allowed to do so
            if (this.options.allowWorkspaceOpen) {
                const localFilesAllowedToOpenAsWorkspace = (0, arrays_1.coalesce)(editors.filter(editor => { var _a; return editor.allowWorkspaceOpen && ((_a = editor.resource) === null || _a === void 0 ? void 0 : _a.scheme) === network_1.Schemas.file; }).map(editor => editor.resource));
                if (localFilesAllowedToOpenAsWorkspace.length > 0) {
                    const isWorkspaceOpening = await this.handleWorkspaceDrop(localFilesAllowedToOpenAsWorkspace);
                    if (isWorkspaceOpening) {
                        return; // return early if the drop operation resulted in this window changing to a workspace
                    }
                }
            }
            // Add external ones to recently open list unless dropped resource is a workspace
            // and only for resources that are outside of the currently opened workspace
            const externalLocalFiles = (0, arrays_1.coalesce)(editors.filter(editor => { var _a; return editor.isExternal && ((_a = editor.resource) === null || _a === void 0 ? void 0 : _a.scheme) === network_1.Schemas.file; }).map(editor => editor.resource));
            if (externalLocalFiles.length) {
                this.workspacesService.addRecentlyOpened(externalLocalFiles
                    .filter(resource => !this.contextService.isInsideWorkspace(resource))
                    .map(resource => ({ fileUri: resource })));
            }
            // Open in Editor
            const targetGroup = resolveTargetGroup();
            await this.editorService.openEditors(editors.map(editor => (Object.assign(Object.assign({}, editor), { resource: editor.resource, options: Object.assign(Object.assign({}, editor.options), { pinned: true, index: targetIndex }) }))), targetGroup, { validateTrust: true });
            // Finish with provided function
            afterDrop(targetGroup);
        }
        async handleWorkspaceDrop(resources) {
            const toOpen = [];
            const folderURIs = [];
            await Promise.all(resources.map(async (resource) => {
                // Check for Workspace
                if ((0, workspace_1.hasWorkspaceFileExtension)(resource)) {
                    toOpen.push({ workspaceUri: resource });
                    return;
                }
                // Check for Folder
                try {
                    const stat = await this.fileService.stat(resource);
                    if (stat.isDirectory) {
                        toOpen.push({ folderUri: stat.resource });
                        folderURIs.push({ uri: stat.resource });
                    }
                }
                catch (error) {
                    // Ignore error
                }
            }));
            // Return early if no external resource is a folder or workspace
            if (toOpen.length === 0) {
                return false;
            }
            // Pass focus to window
            this.hostService.focus();
            // Open in separate windows if we drop workspaces or just one folder
            if (toOpen.length > folderURIs.length || folderURIs.length === 1) {
                await this.hostService.openWindow(toOpen);
            }
            // Add to workspace if we are in a temporary workspace
            else if ((0, workspace_1.isTemporaryWorkspace)(this.contextService.getWorkspace())) {
                await this.workspaceEditingService.addFolders(folderURIs);
            }
            // Finaly, enter untitled workspace when dropping >1 folders
            else {
                await this.workspaceEditingService.createAndEnterWorkspace(folderURIs);
            }
            return true;
        }
    };
    ResourcesDropHandler = __decorate([
        __param(1, files_1.IFileService),
        __param(2, workspaces_1.IWorkspacesService),
        __param(3, editorService_1.IEditorService),
        __param(4, workspaceEditing_1.IWorkspaceEditingService),
        __param(5, host_1.IHostService),
        __param(6, workspace_1.IWorkspaceContextService),
        __param(7, instantiation_1.IInstantiationService)
    ], ResourcesDropHandler);
    exports.ResourcesDropHandler = ResourcesDropHandler;
    function fillEditorsDragData(accessor, resourcesOrEditors, event) {
        var _a;
        if (resourcesOrEditors.length === 0 || !event.dataTransfer) {
            return;
        }
        const textFileService = accessor.get(textfiles_1.ITextFileService);
        const editorService = accessor.get(editorService_1.IEditorService);
        const fileService = accessor.get(files_1.IFileService);
        const labelService = accessor.get(label_1.ILabelService);
        // Extract resources from URIs or Editors that
        // can be handled by the file service
        const resources = (0, arrays_1.coalesce)(resourcesOrEditors.map(resourceOrEditor => {
            if (uri_1.URI.isUri(resourceOrEditor)) {
                return { resource: resourceOrEditor };
            }
            if ((0, editor_1.isEditorIdentifier)(resourceOrEditor)) {
                if (uri_1.URI.isUri(resourceOrEditor.editor.resource)) {
                    return { resource: resourceOrEditor.editor.resource };
                }
                return undefined; // editor without resource
            }
            return resourceOrEditor;
        }));
        const fileSystemResources = resources.filter(({ resource }) => fileService.hasProvider(resource));
        // Text: allows to paste into text-capable areas
        const lineDelimiter = platform_1.isWindows ? '\r\n' : '\n';
        event.dataTransfer.setData(dnd_1.DataTransfers.TEXT, fileSystemResources.map(({ resource }) => labelService.getUriLabel(resource, { noPrefix: true })).join(lineDelimiter));
        // Download URL: enables support to drag a tab as file to desktop
        // Requirements:
        // - Chrome/Edge only
        // - only a single file is supported
        // - only file:/ resources are supported
        const firstFile = fileSystemResources.find(({ isDirectory }) => !isDirectory);
        if (firstFile) {
            const firstFileUri = network_1.FileAccess.asFileUri(firstFile.resource); // enforce `file:` URIs
            if (firstFileUri.scheme === network_1.Schemas.file) {
                event.dataTransfer.setData(dnd_1.DataTransfers.DOWNLOAD_URL, [mime_1.Mimes.binary, (0, resources_1.basename)(firstFile.resource), firstFileUri.toString()].join(':'));
            }
        }
        // Resource URLs: allows to drop multiple file resources to a target in VS Code
        const files = fileSystemResources.filter(({ isDirectory }) => !isDirectory);
        if (files.length) {
            event.dataTransfer.setData(dnd_1.DataTransfers.RESOURCES, JSON.stringify(files.map(({ resource }) => resource.toString())));
        }
        // Contributions
        const contributions = platform_2.Registry.as(exports.Extensions.DragAndDropContribution).getAll();
        for (const contribution of contributions) {
            contribution.setData(resources, event);
        }
        // Editors: enables cross window DND of editors
        // into the editor area while presering UI state
        const draggedEditors = [];
        for (const resourceOrEditor of resourcesOrEditors) {
            // Extract resource editor from provided object or URI
            let editor = undefined;
            if ((0, editor_1.isEditorIdentifier)(resourceOrEditor)) {
                const untypedEditor = resourceOrEditor.editor.toUntyped({ preserveViewState: resourceOrEditor.groupId });
                if (untypedEditor) {
                    editor = Object.assign(Object.assign({}, untypedEditor), { resource: editor_1.EditorResourceAccessor.getCanonicalUri(untypedEditor) });
                }
            }
            else if (uri_1.URI.isUri(resourceOrEditor)) {
                const { selection, uri } = (0, opener_1.extractSelection)(resourceOrEditor);
                editor = { resource: uri, options: selection ? { selection } : undefined };
            }
            else if (!resourceOrEditor.isDirectory) {
                editor = { resource: resourceOrEditor.resource };
            }
            if (!editor) {
                continue; // skip over editors that cannot be transferred via dnd
            }
            // Fill in some properties if they are not there already by accessing
            // some well known things from the text file universe.
            // This is not ideal for custom editors, but those have a chance to
            // provide everything from the `toUntyped` method.
            {
                const resource = editor.resource;
                if (resource) {
                    const textFileModel = textFileService.files.get(resource);
                    if (textFileModel) {
                        // language
                        if (typeof editor.languageId !== 'string') {
                            editor.languageId = textFileModel.getLanguageId();
                        }
                        // encoding
                        if (typeof editor.encoding !== 'string') {
                            editor.encoding = textFileModel.getEncoding();
                        }
                        // contents (only if dirty)
                        if (typeof editor.contents !== 'string' && textFileModel.isDirty()) {
                            editor.contents = textFileModel.textEditorModel.getValue();
                        }
                    }
                    // viewState
                    if (!((_a = editor.options) === null || _a === void 0 ? void 0 : _a.viewState)) {
                        editor.options = Object.assign(Object.assign({}, editor.options), { viewState: (() => {
                                for (const visibleEditorPane of editorService.visibleEditorPanes) {
                                    if ((0, resources_1.isEqual)(visibleEditorPane.input.resource, resource)) {
                                        const viewState = visibleEditorPane.getViewState();
                                        if (viewState) {
                                            return viewState;
                                        }
                                    }
                                }
                                return undefined;
                            })() });
                    }
                }
            }
            // Add as dragged editor
            draggedEditors.push(editor);
        }
        if (draggedEditors.length) {
            event.dataTransfer.setData(exports.CodeDataTransfers.EDITORS, (0, marshalling_1.stringify)(draggedEditors));
        }
    }
    exports.fillEditorsDragData = fillEditorsDragData;
    class DragAndDropContributionRegistry {
        constructor() {
            this._contributions = new Map();
        }
        register(contribution) {
            if (this._contributions.has(contribution.dataFormatKey)) {
                throw new Error(`A drag and drop contributiont with key '${contribution.dataFormatKey}' was already registered.`);
            }
            this._contributions.set(contribution.dataFormatKey, contribution);
        }
        getAll() {
            return this._contributions.values();
        }
    }
    exports.Extensions = {
        DragAndDropContribution: 'workbench.contributions.dragAndDrop'
    };
    platform_2.Registry.add(exports.Extensions.DragAndDropContribution, new DragAndDropContributionRegistry());
    //#endregion
    //#region DND Utilities
    /**
     * A singleton to store transfer data during drag & drop operations that are only valid within the application.
     */
    class LocalSelectionTransfer {
        constructor() {
            // protect against external instantiation
        }
        static getInstance() {
            return LocalSelectionTransfer.INSTANCE;
        }
        hasData(proto) {
            return proto && proto === this.proto;
        }
        clearData(proto) {
            if (this.hasData(proto)) {
                this.proto = undefined;
                this.data = undefined;
            }
        }
        getData(proto) {
            if (this.hasData(proto)) {
                return this.data;
            }
            return undefined;
        }
        setData(data, proto) {
            if (proto) {
                this.data = data;
                this.proto = proto;
            }
        }
    }
    exports.LocalSelectionTransfer = LocalSelectionTransfer;
    LocalSelectionTransfer.INSTANCE = new LocalSelectionTransfer();
    function containsDragType(event, ...dragTypesToFind) {
        if (!event.dataTransfer) {
            return false;
        }
        const dragTypes = event.dataTransfer.types;
        const lowercaseDragTypes = [];
        for (let i = 0; i < dragTypes.length; i++) {
            lowercaseDragTypes.push(dragTypes[i].toLowerCase()); // somehow the types are lowercase
        }
        for (const dragType of dragTypesToFind) {
            if (lowercaseDragTypes.indexOf(dragType.toLowerCase()) >= 0) {
                return true;
            }
        }
        return false;
    }
    exports.containsDragType = containsDragType;
    class CompositeDragAndDropData {
        constructor(type, id) {
            this.type = type;
            this.id = id;
        }
        update(dataTransfer) {
            // no-op
        }
        getData() {
            return { type: this.type, id: this.id };
        }
    }
    exports.CompositeDragAndDropData = CompositeDragAndDropData;
    class DraggedCompositeIdentifier {
        constructor(compositeId) {
            this.compositeId = compositeId;
        }
        get id() {
            return this.compositeId;
        }
    }
    exports.DraggedCompositeIdentifier = DraggedCompositeIdentifier;
    class DraggedViewIdentifier {
        constructor(viewId) {
            this.viewId = viewId;
        }
        get id() {
            return this.viewId;
        }
    }
    exports.DraggedViewIdentifier = DraggedViewIdentifier;
    class CompositeDragAndDropObserver extends lifecycle_1.Disposable {
        constructor() {
            super();
            this.transferData = LocalSelectionTransfer.getInstance();
            this.onDragStart = this._register(new event_1.Emitter());
            this.onDragEnd = this._register(new event_1.Emitter());
            this._register(this.onDragEnd.event(e => {
                const id = e.dragAndDropData.getData().id;
                const type = e.dragAndDropData.getData().type;
                const data = this.readDragData(type);
                if ((data === null || data === void 0 ? void 0 : data.getData().id) === id) {
                    this.transferData.clearData(type === 'view' ? DraggedViewIdentifier.prototype : DraggedCompositeIdentifier.prototype);
                }
            }));
        }
        static get INSTANCE() {
            if (!CompositeDragAndDropObserver.instance) {
                CompositeDragAndDropObserver.instance = new CompositeDragAndDropObserver();
            }
            return CompositeDragAndDropObserver.instance;
        }
        readDragData(type) {
            if (this.transferData.hasData(type === 'view' ? DraggedViewIdentifier.prototype : DraggedCompositeIdentifier.prototype)) {
                const data = this.transferData.getData(type === 'view' ? DraggedViewIdentifier.prototype : DraggedCompositeIdentifier.prototype);
                if (data && data[0]) {
                    return new CompositeDragAndDropData(type, data[0].id);
                }
            }
            return undefined;
        }
        writeDragData(id, type) {
            this.transferData.setData([type === 'view' ? new DraggedViewIdentifier(id) : new DraggedCompositeIdentifier(id)], type === 'view' ? DraggedViewIdentifier.prototype : DraggedCompositeIdentifier.prototype);
        }
        registerTarget(element, callbacks) {
            const disposableStore = new lifecycle_1.DisposableStore();
            disposableStore.add(new dom_1.DragAndDropObserver(element, {
                onDragEnd: e => {
                    // no-op
                },
                onDragEnter: e => {
                    e.preventDefault();
                    if (callbacks.onDragEnter) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (data) {
                            callbacks.onDragEnter({ eventData: e, dragAndDropData: data });
                        }
                    }
                },
                onDragLeave: e => {
                    const data = this.readDragData('composite') || this.readDragData('view');
                    if (callbacks.onDragLeave && data) {
                        callbacks.onDragLeave({ eventData: e, dragAndDropData: data });
                    }
                },
                onDrop: e => {
                    if (callbacks.onDrop) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        callbacks.onDrop({ eventData: e, dragAndDropData: data });
                        // Fire drag event in case drop handler destroys the dragged element
                        this.onDragEnd.fire({ eventData: e, dragAndDropData: data });
                    }
                },
                onDragOver: e => {
                    e.preventDefault();
                    if (callbacks.onDragOver) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        callbacks.onDragOver({ eventData: e, dragAndDropData: data });
                    }
                }
            }));
            if (callbacks.onDragStart) {
                this.onDragStart.event(e => {
                    callbacks.onDragStart(e);
                }, this, disposableStore);
            }
            if (callbacks.onDragEnd) {
                this.onDragEnd.event(e => {
                    callbacks.onDragEnd(e);
                });
            }
            return this._register(disposableStore);
        }
        registerDraggable(element, draggedItemProvider, callbacks) {
            element.draggable = true;
            const disposableStore = new lifecycle_1.DisposableStore();
            disposableStore.add((0, dom_1.addDisposableListener)(element, dom_1.EventType.DRAG_START, e => {
                var _a;
                const { id, type } = draggedItemProvider();
                this.writeDragData(id, type);
                (_a = e.dataTransfer) === null || _a === void 0 ? void 0 : _a.setDragImage(element, 0, 0);
                this.onDragStart.fire({ eventData: e, dragAndDropData: this.readDragData(type) });
            }));
            disposableStore.add(new dom_1.DragAndDropObserver(element, {
                onDragEnd: e => {
                    const { type } = draggedItemProvider();
                    const data = this.readDragData(type);
                    if (!data) {
                        return;
                    }
                    this.onDragEnd.fire({ eventData: e, dragAndDropData: data });
                },
                onDragEnter: e => {
                    if (callbacks.onDragEnter) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        if (data) {
                            callbacks.onDragEnter({ eventData: e, dragAndDropData: data });
                        }
                    }
                },
                onDragLeave: e => {
                    const data = this.readDragData('composite') || this.readDragData('view');
                    if (!data) {
                        return;
                    }
                    if (callbacks.onDragLeave) {
                        callbacks.onDragLeave({ eventData: e, dragAndDropData: data });
                    }
                },
                onDrop: e => {
                    if (callbacks.onDrop) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        callbacks.onDrop({ eventData: e, dragAndDropData: data });
                        // Fire drag event in case drop handler destroys the dragged element
                        this.onDragEnd.fire({ eventData: e, dragAndDropData: data });
                    }
                },
                onDragOver: e => {
                    if (callbacks.onDragOver) {
                        const data = this.readDragData('composite') || this.readDragData('view');
                        if (!data) {
                            return;
                        }
                        callbacks.onDragOver({ eventData: e, dragAndDropData: data });
                    }
                }
            }));
            if (callbacks.onDragStart) {
                this.onDragStart.event(e => {
                    callbacks.onDragStart(e);
                }, this, disposableStore);
            }
            if (callbacks.onDragEnd) {
                this.onDragEnd.event(e => {
                    callbacks.onDragEnd(e);
                }, this, disposableStore);
            }
            return this._register(disposableStore);
        }
    }
    exports.CompositeDragAndDropObserver = CompositeDragAndDropObserver;
    function toggleDropEffect(dataTransfer, dropEffect, shouldHaveIt) {
        if (!dataTransfer) {
            return;
        }
        dataTransfer.dropEffect = shouldHaveIt ? dropEffect : 'none';
    }
    exports.toggleDropEffect = toggleDropEffect;
    let ResourceListDnDHandler = class ResourceListDnDHandler {
        constructor(toResource, instantiationService) {
            this.toResource = toResource;
            this.instantiationService = instantiationService;
        }
        getDragURI(element) {
            const resource = this.toResource(element);
            return resource ? resource.toString() : null;
        }
        getDragLabel(elements) {
            const resources = (0, arrays_1.coalesce)(elements.map(this.toResource));
            return resources.length === 1 ? (0, resources_1.basename)(resources[0]) : resources.length > 1 ? String(resources.length) : undefined;
        }
        onDragStart(data, originalEvent) {
            const resources = [];
            for (const element of data.elements) {
                const resource = this.toResource(element);
                if (resource) {
                    resources.push(resource);
                }
            }
            if (resources.length) {
                // Apply some datatransfer types to allow for dragging the element outside of the application
                this.instantiationService.invokeFunction(accessor => fillEditorsDragData(accessor, resources, originalEvent));
            }
        }
        onDragOver(data, targetElement, targetIndex, originalEvent) {
            return false;
        }
        drop(data, targetElement, targetIndex, originalEvent) { }
    };
    ResourceListDnDHandler = __decorate([
        __param(1, instantiation_1.IInstantiationService)
    ], ResourceListDnDHandler);
    exports.ResourceListDnDHandler = ResourceListDnDHandler;
});
//#endregion
//# sourceMappingURL=dnd.js.map