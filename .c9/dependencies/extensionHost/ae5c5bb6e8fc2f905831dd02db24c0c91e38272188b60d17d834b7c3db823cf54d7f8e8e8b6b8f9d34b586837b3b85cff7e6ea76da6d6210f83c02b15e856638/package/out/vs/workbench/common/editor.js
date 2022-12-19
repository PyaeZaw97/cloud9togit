/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/base/common/types", "vs/base/common/uri", "vs/base/common/lifecycle", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/files/common/files", "vs/base/common/arrays", "vs/base/common/network"], function (require, exports, nls_1, types_1, uri_1, lifecycle_1, instantiation_1, platform_1, files_1, arrays_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isTextEditorViewState = exports.EditorsOrder = exports.pathsToEditors = exports.CloseDirection = exports.EditorResourceAccessor = exports.SideBySideEditor = exports.GroupModelChangeKind = exports.EditorCloseContext = exports.isEditorIdentifier = exports.isEditorInputWithOptionsAndGroup = exports.isEditorInputWithOptions = exports.isDiffEditorInput = exports.isSideBySideEditorInput = exports.isEditorInput = exports.AbstractEditorInput = exports.EditorInputCapabilities = exports.SaveSourceRegistry = exports.SaveReason = exports.Verbosity = exports.isUntitledResourceEditorInput = exports.isResourceSideBySideEditorInput = exports.isResourceDiffEditorInput = exports.isResourceEditorInput = exports.findViewStateForEditor = exports.isEditorPaneWithSelection = exports.EditorPaneSelectionCompareResult = exports.EditorPaneSelectionChangeReason = exports.BINARY_DIFF_EDITOR_ID = exports.TEXT_DIFF_EDITOR_ID = exports.SIDE_BY_SIDE_EDITOR_ID = exports.DEFAULT_EDITOR_ASSOCIATION = exports.EditorExtensions = void 0;
    // Static values for editor contributions
    exports.EditorExtensions = {
        EditorPane: 'workbench.contributions.editors',
        EditorFactory: 'workbench.contributions.editor.inputFactories'
    };
    // Static information regarding the text editor
    exports.DEFAULT_EDITOR_ASSOCIATION = {
        id: 'default',
        displayName: (0, nls_1.localize)('promptOpenWith.defaultEditor.displayName', "Text Editor"),
        providerDisplayName: (0, nls_1.localize)('builtinProviderDisplayName', "Built-in")
    };
    /**
     * Side by side editor id.
     */
    exports.SIDE_BY_SIDE_EDITOR_ID = 'workbench.editor.sidebysideEditor';
    /**
     * Text diff editor id.
     */
    exports.TEXT_DIFF_EDITOR_ID = 'workbench.editors.textDiffEditor';
    /**
     * Binary diff editor id.
     */
    exports.BINARY_DIFF_EDITOR_ID = 'workbench.editors.binaryResourceDiffEditor';
    var EditorPaneSelectionChangeReason;
    (function (EditorPaneSelectionChangeReason) {
        /**
         * The selection was changed as a result of a programmatic
         * method invocation.
         *
         * For a text editor pane, this for example can be a selection
         * being restored from previous view state automatically.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["PROGRAMMATIC"] = 1] = "PROGRAMMATIC";
        /**
         * The selection was changed by the user.
         *
         * This typically means the user changed the selection
         * with mouse or keyboard.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["USER"] = 2] = "USER";
        /**
         * The selection was changed as a result of editing in
         * the editor pane.
         *
         * For a text editor pane, this for example can be typing
         * in the text of the editor pane.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["EDIT"] = 3] = "EDIT";
        /**
         * The selection was changed as a result of a navigation
         * action.
         *
         * For a text editor pane, this for example can be a result
         * of selecting an entry from a text outline view.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["NAVIGATION"] = 4] = "NAVIGATION";
        /**
         * The selection was changed as a result of a jump action
         * from within the editor pane.
         *
         * For a text editor pane, this for example can be a result
         * of invoking "Go to definition" from a symbol.
         */
        EditorPaneSelectionChangeReason[EditorPaneSelectionChangeReason["JUMP"] = 5] = "JUMP";
    })(EditorPaneSelectionChangeReason = exports.EditorPaneSelectionChangeReason || (exports.EditorPaneSelectionChangeReason = {}));
    var EditorPaneSelectionCompareResult;
    (function (EditorPaneSelectionCompareResult) {
        /**
         * The selections are identical.
         */
        EditorPaneSelectionCompareResult[EditorPaneSelectionCompareResult["IDENTICAL"] = 1] = "IDENTICAL";
        /**
         * The selections are similar.
         *
         * For a text editor this can mean that the one
         * selection is in close proximity to the other
         * selection.
         *
         * Upstream clients may decide in this case to
         * not treat the selection different from the
         * previous one because it is not distinct enough.
         */
        EditorPaneSelectionCompareResult[EditorPaneSelectionCompareResult["SIMILAR"] = 2] = "SIMILAR";
        /**
         * The selections are entirely different.
         */
        EditorPaneSelectionCompareResult[EditorPaneSelectionCompareResult["DIFFERENT"] = 3] = "DIFFERENT";
    })(EditorPaneSelectionCompareResult = exports.EditorPaneSelectionCompareResult || (exports.EditorPaneSelectionCompareResult = {}));
    function isEditorPaneWithSelection(editorPane) {
        const candidate = editorPane;
        return !!candidate && typeof candidate.getSelection === 'function' && !!candidate.onDidChangeSelection;
    }
    exports.isEditorPaneWithSelection = isEditorPaneWithSelection;
    /**
     * Try to retrieve the view state for the editor pane that
     * has the provided editor input opened, if at all.
     *
     * This method will return `undefined` if the editor input
     * is not visible in any of the opened editor panes.
     */
    function findViewStateForEditor(input, group, editorService) {
        for (const editorPane of editorService.visibleEditorPanes) {
            if (editorPane.group.id === group && input.matches(editorPane.input)) {
                return editorPane.getViewState();
            }
        }
        return undefined;
    }
    exports.findViewStateForEditor = findViewStateForEditor;
    function isResourceEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        const candidate = editor;
        return uri_1.URI.isUri(candidate === null || candidate === void 0 ? void 0 : candidate.resource);
    }
    exports.isResourceEditorInput = isResourceEditorInput;
    function isResourceDiffEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        const candidate = editor;
        return (candidate === null || candidate === void 0 ? void 0 : candidate.original) !== undefined && candidate.modified !== undefined;
    }
    exports.isResourceDiffEditorInput = isResourceDiffEditorInput;
    function isResourceSideBySideEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        if (isResourceDiffEditorInput(editor)) {
            return false; // make sure to not accidentally match on diff editors
        }
        const candidate = editor;
        return (candidate === null || candidate === void 0 ? void 0 : candidate.primary) !== undefined && candidate.secondary !== undefined;
    }
    exports.isResourceSideBySideEditorInput = isResourceSideBySideEditorInput;
    function isUntitledResourceEditorInput(editor) {
        if (isEditorInput(editor)) {
            return false; // make sure to not accidentally match on typed editor inputs
        }
        const candidate = editor;
        if (!candidate) {
            return false;
        }
        return candidate.resource === undefined || candidate.resource.scheme === network_1.Schemas.untitled || candidate.forceUntitled === true;
    }
    exports.isUntitledResourceEditorInput = isUntitledResourceEditorInput;
    var Verbosity;
    (function (Verbosity) {
        Verbosity[Verbosity["SHORT"] = 0] = "SHORT";
        Verbosity[Verbosity["MEDIUM"] = 1] = "MEDIUM";
        Verbosity[Verbosity["LONG"] = 2] = "LONG";
    })(Verbosity = exports.Verbosity || (exports.Verbosity = {}));
    var SaveReason;
    (function (SaveReason) {
        /**
         * Explicit user gesture.
         */
        SaveReason[SaveReason["EXPLICIT"] = 1] = "EXPLICIT";
        /**
         * Auto save after a timeout.
         */
        SaveReason[SaveReason["AUTO"] = 2] = "AUTO";
        /**
         * Auto save after editor focus change.
         */
        SaveReason[SaveReason["FOCUS_CHANGE"] = 3] = "FOCUS_CHANGE";
        /**
         * Auto save after window change.
         */
        SaveReason[SaveReason["WINDOW_CHANGE"] = 4] = "WINDOW_CHANGE";
    })(SaveReason = exports.SaveReason || (exports.SaveReason = {}));
    class SaveSourceFactory {
        constructor() {
            this.mapIdToSaveSource = new Map();
        }
        /**
         * Registers a `SaveSource` with an identifier and label
         * to the registry so that it can be used in save operations.
         */
        registerSource(id, label) {
            let sourceDescriptor = this.mapIdToSaveSource.get(id);
            if (!sourceDescriptor) {
                sourceDescriptor = { source: id, label };
                this.mapIdToSaveSource.set(id, sourceDescriptor);
            }
            return sourceDescriptor.source;
        }
        getSourceLabel(source) {
            var _a, _b;
            return (_b = (_a = this.mapIdToSaveSource.get(source)) === null || _a === void 0 ? void 0 : _a.label) !== null && _b !== void 0 ? _b : source;
        }
    }
    exports.SaveSourceRegistry = new SaveSourceFactory();
    var EditorInputCapabilities;
    (function (EditorInputCapabilities) {
        /**
         * Signals no specific capability for the input.
         */
        EditorInputCapabilities[EditorInputCapabilities["None"] = 0] = "None";
        /**
         * Signals that the input is readonly.
         */
        EditorInputCapabilities[EditorInputCapabilities["Readonly"] = 2] = "Readonly";
        /**
         * Signals that the input is untitled.
         */
        EditorInputCapabilities[EditorInputCapabilities["Untitled"] = 4] = "Untitled";
        /**
         * Signals that the input can only be shown in one group
         * and not be split into multiple groups.
         */
        EditorInputCapabilities[EditorInputCapabilities["Singleton"] = 8] = "Singleton";
        /**
         * Signals that the input requires workspace trust.
         */
        EditorInputCapabilities[EditorInputCapabilities["RequiresTrust"] = 16] = "RequiresTrust";
        /**
         * Signals that the editor can split into 2 in the same
         * editor group.
         */
        EditorInputCapabilities[EditorInputCapabilities["CanSplitInGroup"] = 32] = "CanSplitInGroup";
        /**
         * Signals that the editor wants it's description to be
         * visible when presented to the user. By default, a UI
         * component may decide to hide the description portion
         * for brevity.
         */
        EditorInputCapabilities[EditorInputCapabilities["ForceDescription"] = 64] = "ForceDescription";
        /**
         * Signals that the editor supports dropping into the
         * editor by holding shift.
         */
        EditorInputCapabilities[EditorInputCapabilities["CanDropIntoEditor"] = 128] = "CanDropIntoEditor";
    })(EditorInputCapabilities = exports.EditorInputCapabilities || (exports.EditorInputCapabilities = {}));
    class AbstractEditorInput extends lifecycle_1.Disposable {
    }
    exports.AbstractEditorInput = AbstractEditorInput;
    function isEditorInput(editor) {
        return editor instanceof AbstractEditorInput;
    }
    exports.isEditorInput = isEditorInput;
    function isEditorInputWithPreferredResource(editor) {
        const candidate = editor;
        return uri_1.URI.isUri(candidate === null || candidate === void 0 ? void 0 : candidate.preferredResource);
    }
    function isSideBySideEditorInput(editor) {
        const candidate = editor;
        return isEditorInput(candidate === null || candidate === void 0 ? void 0 : candidate.primary) && isEditorInput(candidate === null || candidate === void 0 ? void 0 : candidate.secondary);
    }
    exports.isSideBySideEditorInput = isSideBySideEditorInput;
    function isDiffEditorInput(editor) {
        const candidate = editor;
        return isEditorInput(candidate === null || candidate === void 0 ? void 0 : candidate.modified) && isEditorInput(candidate === null || candidate === void 0 ? void 0 : candidate.original);
    }
    exports.isDiffEditorInput = isDiffEditorInput;
    function isEditorInputWithOptions(editor) {
        const candidate = editor;
        return isEditorInput(candidate === null || candidate === void 0 ? void 0 : candidate.editor);
    }
    exports.isEditorInputWithOptions = isEditorInputWithOptions;
    function isEditorInputWithOptionsAndGroup(editor) {
        const candidate = editor;
        return isEditorInputWithOptions(editor) && (candidate === null || candidate === void 0 ? void 0 : candidate.group) !== undefined;
    }
    exports.isEditorInputWithOptionsAndGroup = isEditorInputWithOptionsAndGroup;
    function isEditorIdentifier(identifier) {
        const candidate = identifier;
        return typeof (candidate === null || candidate === void 0 ? void 0 : candidate.groupId) === 'number' && isEditorInput(candidate.editor);
    }
    exports.isEditorIdentifier = isEditorIdentifier;
    /**
     * More information around why an editor was closed in the model.
     */
    var EditorCloseContext;
    (function (EditorCloseContext) {
        /**
         * No specific context for closing (e.g. explicit user gesture).
         */
        EditorCloseContext[EditorCloseContext["UNKNOWN"] = 0] = "UNKNOWN";
        /**
         * The editor closed because it was replaced with another editor.
         * This can either happen via explicit replace call or when an
         * editor is in preview mode and another editor opens.
         */
        EditorCloseContext[EditorCloseContext["REPLACE"] = 1] = "REPLACE";
        /**
         * The editor closed as a result of moving it to another group.
         */
        EditorCloseContext[EditorCloseContext["MOVE"] = 2] = "MOVE";
        /**
         * The editor closed because another editor turned into preview
         * and this used to be the preview editor before.
         */
        EditorCloseContext[EditorCloseContext["UNPIN"] = 3] = "UNPIN";
    })(EditorCloseContext = exports.EditorCloseContext || (exports.EditorCloseContext = {}));
    var GroupModelChangeKind;
    (function (GroupModelChangeKind) {
        /* Group Changes */
        GroupModelChangeKind[GroupModelChangeKind["GROUP_ACTIVE"] = 0] = "GROUP_ACTIVE";
        GroupModelChangeKind[GroupModelChangeKind["GROUP_INDEX"] = 1] = "GROUP_INDEX";
        GroupModelChangeKind[GroupModelChangeKind["GROUP_LOCKED"] = 2] = "GROUP_LOCKED";
        /* Editor Changes */
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_OPEN"] = 3] = "EDITOR_OPEN";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_CLOSE"] = 4] = "EDITOR_CLOSE";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_MOVE"] = 5] = "EDITOR_MOVE";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_ACTIVE"] = 6] = "EDITOR_ACTIVE";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_LABEL"] = 7] = "EDITOR_LABEL";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_CAPABILITIES"] = 8] = "EDITOR_CAPABILITIES";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_PIN"] = 9] = "EDITOR_PIN";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_STICKY"] = 10] = "EDITOR_STICKY";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_DIRTY"] = 11] = "EDITOR_DIRTY";
        GroupModelChangeKind[GroupModelChangeKind["EDITOR_WILL_DISPOSE"] = 12] = "EDITOR_WILL_DISPOSE";
    })(GroupModelChangeKind = exports.GroupModelChangeKind || (exports.GroupModelChangeKind = {}));
    var SideBySideEditor;
    (function (SideBySideEditor) {
        SideBySideEditor[SideBySideEditor["PRIMARY"] = 1] = "PRIMARY";
        SideBySideEditor[SideBySideEditor["SECONDARY"] = 2] = "SECONDARY";
        SideBySideEditor[SideBySideEditor["BOTH"] = 3] = "BOTH";
        SideBySideEditor[SideBySideEditor["ANY"] = 4] = "ANY";
    })(SideBySideEditor = exports.SideBySideEditor || (exports.SideBySideEditor = {}));
    class EditorResourceAccessorImpl {
        getOriginalUri(editor, options) {
            var _a;
            if (!editor) {
                return undefined;
            }
            // Optionally support side-by-side editors
            if (options === null || options === void 0 ? void 0 : options.supportSideBySide) {
                const { primary, secondary } = this.getSideEditors(editor);
                if (primary && secondary) {
                    if ((options === null || options === void 0 ? void 0 : options.supportSideBySide) === SideBySideEditor.BOTH) {
                        return {
                            primary: this.getOriginalUri(primary, { filterByScheme: options.filterByScheme }),
                            secondary: this.getOriginalUri(secondary, { filterByScheme: options.filterByScheme })
                        };
                    }
                    else if ((options === null || options === void 0 ? void 0 : options.supportSideBySide) === SideBySideEditor.ANY) {
                        return (_a = this.getOriginalUri(primary, { filterByScheme: options.filterByScheme })) !== null && _a !== void 0 ? _a : this.getOriginalUri(secondary, { filterByScheme: options.filterByScheme });
                    }
                    editor = options.supportSideBySide === SideBySideEditor.PRIMARY ? primary : secondary;
                }
            }
            if (isResourceDiffEditorInput(editor) || isResourceSideBySideEditorInput(editor)) {
                return;
            }
            // Original URI is the `preferredResource` of an editor if any
            const originalResource = isEditorInputWithPreferredResource(editor) ? editor.preferredResource : editor.resource;
            if (!originalResource || !options || !options.filterByScheme) {
                return originalResource;
            }
            return this.filterUri(originalResource, options.filterByScheme);
        }
        getSideEditors(editor) {
            if (isSideBySideEditorInput(editor) || isResourceSideBySideEditorInput(editor)) {
                return { primary: editor.primary, secondary: editor.secondary };
            }
            if (isDiffEditorInput(editor) || isResourceDiffEditorInput(editor)) {
                return { primary: editor.modified, secondary: editor.original };
            }
            return { primary: undefined, secondary: undefined };
        }
        getCanonicalUri(editor, options) {
            var _a;
            if (!editor) {
                return undefined;
            }
            // Optionally support side-by-side editors
            if (options === null || options === void 0 ? void 0 : options.supportSideBySide) {
                const { primary, secondary } = this.getSideEditors(editor);
                if (primary && secondary) {
                    if ((options === null || options === void 0 ? void 0 : options.supportSideBySide) === SideBySideEditor.BOTH) {
                        return {
                            primary: this.getCanonicalUri(primary, { filterByScheme: options.filterByScheme }),
                            secondary: this.getCanonicalUri(secondary, { filterByScheme: options.filterByScheme })
                        };
                    }
                    else if ((options === null || options === void 0 ? void 0 : options.supportSideBySide) === SideBySideEditor.ANY) {
                        return (_a = this.getCanonicalUri(primary, { filterByScheme: options.filterByScheme })) !== null && _a !== void 0 ? _a : this.getCanonicalUri(secondary, { filterByScheme: options.filterByScheme });
                    }
                    editor = options.supportSideBySide === SideBySideEditor.PRIMARY ? primary : secondary;
                }
            }
            if (isResourceDiffEditorInput(editor) || isResourceSideBySideEditorInput(editor)) {
                return;
            }
            // Canonical URI is the `resource` of an editor
            const canonicalResource = editor.resource;
            if (!canonicalResource || !options || !options.filterByScheme) {
                return canonicalResource;
            }
            return this.filterUri(canonicalResource, options.filterByScheme);
        }
        filterUri(resource, filter) {
            // Multiple scheme filter
            if (Array.isArray(filter)) {
                if (filter.some(scheme => resource.scheme === scheme)) {
                    return resource;
                }
            }
            // Single scheme filter
            else {
                if (filter === resource.scheme) {
                    return resource;
                }
            }
            return undefined;
        }
    }
    exports.EditorResourceAccessor = new EditorResourceAccessorImpl();
    var CloseDirection;
    (function (CloseDirection) {
        CloseDirection[CloseDirection["LEFT"] = 0] = "LEFT";
        CloseDirection[CloseDirection["RIGHT"] = 1] = "RIGHT";
    })(CloseDirection = exports.CloseDirection || (exports.CloseDirection = {}));
    class EditorFactoryRegistry {
        constructor() {
            this.editorSerializerConstructors = new Map();
            this.editorSerializerInstances = new Map();
        }
        start(accessor) {
            const instantiationService = this.instantiationService = accessor.get(instantiation_1.IInstantiationService);
            for (const [key, ctor] of this.editorSerializerConstructors) {
                this.createEditorSerializer(key, ctor, instantiationService);
            }
            this.editorSerializerConstructors.clear();
        }
        createEditorSerializer(editorTypeId, ctor, instantiationService) {
            const instance = instantiationService.createInstance(ctor);
            this.editorSerializerInstances.set(editorTypeId, instance);
        }
        registerFileEditorFactory(factory) {
            if (this.fileEditorFactory) {
                throw new Error('Can only register one file editor factory.');
            }
            this.fileEditorFactory = factory;
        }
        getFileEditorFactory() {
            return (0, types_1.assertIsDefined)(this.fileEditorFactory);
        }
        registerEditorSerializer(editorTypeId, ctor) {
            if (this.editorSerializerConstructors.has(editorTypeId) || this.editorSerializerInstances.has(editorTypeId)) {
                throw new Error(`A editor serializer with type ID '${editorTypeId}' was already registered.`);
            }
            if (!this.instantiationService) {
                this.editorSerializerConstructors.set(editorTypeId, ctor);
            }
            else {
                this.createEditorSerializer(editorTypeId, ctor, this.instantiationService);
            }
            return (0, lifecycle_1.toDisposable)(() => {
                this.editorSerializerConstructors.delete(editorTypeId);
                this.editorSerializerInstances.delete(editorTypeId);
            });
        }
        getEditorSerializer(arg1) {
            return this.editorSerializerInstances.get(typeof arg1 === 'string' ? arg1 : arg1.typeId);
        }
    }
    platform_1.Registry.add(exports.EditorExtensions.EditorFactory, new EditorFactoryRegistry());
    async function pathsToEditors(paths, fileService) {
        if (!paths || !paths.length) {
            return [];
        }
        const editors = await Promise.all(paths.map(async (path) => {
            const resource = uri_1.URI.revive(path.fileUri);
            if (!resource) {
                return;
            }
            const canHandleResource = await fileService.canHandleResource(resource);
            if (!canHandleResource) {
                return;
            }
            let exists = path.exists;
            let type = path.type;
            if (typeof exists !== 'boolean' || typeof type !== 'number') {
                try {
                    type = (await fileService.stat(resource)).isDirectory ? files_1.FileType.Directory : files_1.FileType.Unknown;
                    exists = true;
                }
                catch (_a) {
                    exists = false;
                }
            }
            if (!exists && path.openOnlyIfExists) {
                return;
            }
            if (type === files_1.FileType.Directory) {
                return;
            }
            const options = Object.assign(Object.assign({}, path.options), { pinned: true });
            let input;
            if (!exists) {
                input = { resource, options, forceUntitled: true };
            }
            else {
                input = { resource, options };
            }
            return input;
        }));
        return (0, arrays_1.coalesce)(editors);
    }
    exports.pathsToEditors = pathsToEditors;
    var EditorsOrder;
    (function (EditorsOrder) {
        /**
         * Editors sorted by most recent activity (most recent active first)
         */
        EditorsOrder[EditorsOrder["MOST_RECENTLY_ACTIVE"] = 0] = "MOST_RECENTLY_ACTIVE";
        /**
         * Editors sorted by sequential order
         */
        EditorsOrder[EditorsOrder["SEQUENTIAL"] = 1] = "SEQUENTIAL";
    })(EditorsOrder = exports.EditorsOrder || (exports.EditorsOrder = {}));
    function isTextEditorViewState(candidate) {
        const viewState = candidate;
        if (!viewState) {
            return false;
        }
        const diffEditorViewState = viewState;
        if (diffEditorViewState.modified) {
            return isTextEditorViewState(diffEditorViewState.modified);
        }
        const codeEditorViewState = viewState;
        return !!(codeEditorViewState.contributionsState && codeEditorViewState.viewState && Array.isArray(codeEditorViewState.cursorState));
    }
    exports.isTextEditorViewState = isTextEditorViewState;
});
//# sourceMappingURL=editor.js.map