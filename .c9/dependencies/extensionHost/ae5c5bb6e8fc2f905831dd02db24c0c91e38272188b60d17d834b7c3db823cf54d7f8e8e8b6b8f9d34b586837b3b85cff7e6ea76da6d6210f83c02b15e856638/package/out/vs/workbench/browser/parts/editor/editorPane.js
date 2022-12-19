/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/workbench/browser/composite", "vs/workbench/common/editor", "vs/base/common/map", "vs/base/common/uri", "vs/base/common/event", "vs/base/common/types", "vs/workbench/browser/parts/editor/editor", "vs/base/common/resources", "vs/base/common/extpath", "vs/base/common/lifecycle"], function (require, exports, composite_1, editor_1, map_1, uri_1, event_1, types_1, editor_2, resources_1, extpath_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorMemento = exports.EditorPane = void 0;
    /**
     * The base class of editors in the workbench. Editors register themselves for specific editor inputs.
     * Editors are layed out in the editor part of the workbench in editor groups. Multiple editors can be
     * open at the same time. Each editor has a minimized representation that is good enough to provide some
     * information about the state of the editor data.
     *
     * The workbench will keep an editor alive after it has been created and show/hide it based on
     * user interaction. The lifecycle of a editor goes in the order:
     *
     * - `createEditor()`
     * - `setEditorVisible()`
     * - `layout()`
     * - `setInput()`
     * - `focus()`
     * - `dispose()`: when the editor group the editor is in closes
     *
     * During use of the workbench, a editor will often receive a `clearInput()`, `setEditorVisible()`, `layout()` and
     * `focus()` calls, but only one `create()` and `dispose()` call.
     *
     * This class is only intended to be subclassed and not instantiated.
     */
    class EditorPane extends composite_1.Composite {
        constructor(id, telemetryService, themeService, storageService) {
            super(id, telemetryService, themeService, storageService);
            //#region Events
            this.onDidChangeSizeConstraints = event_1.Event.None;
            this._onDidChangeControl = this._register(new event_1.Emitter());
            this.onDidChangeControl = this._onDidChangeControl.event;
        }
        get minimumWidth() { return editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.width; }
        get maximumWidth() { return editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.width; }
        get minimumHeight() { return editor_2.DEFAULT_EDITOR_MIN_DIMENSIONS.height; }
        get maximumHeight() { return editor_2.DEFAULT_EDITOR_MAX_DIMENSIONS.height; }
        get input() { return this._input; }
        get options() { return this._options; }
        get group() { return this._group; }
        /**
         * Should be overridden by editors that have their own ScopedContextKeyService
         */
        get scopedContextKeyService() { return undefined; }
        create(parent) {
            super.create(parent);
            // Create Editor
            this.createEditor(parent);
        }
        /**
         * Note: Clients should not call this method, the workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Sets the given input with the options to the editor. The input is guaranteed
         * to be different from the previous input that was set using the `input.matches()`
         * method.
         *
         * The provided context gives more information around how the editor was opened.
         *
         * The provided cancellation token should be used to test if the operation
         * was cancelled.
         */
        async setInput(input, options, context, token) {
            this._input = input;
            this._options = options;
        }
        /**
         * Called to indicate to the editor that the input should be cleared and
         * resources associated with the input should be freed.
         *
         * This method can be called based on different contexts, e.g. when opening
         * a different input or different editor control or when closing all editors
         * in a group.
         *
         * To monitor the lifecycle of editor inputs, you should not rely on this
         * method, rather refer to the listeners on `IEditorGroup` via `IEditorGroupService`.
         */
        clearInput() {
            this._input = undefined;
            this._options = undefined;
        }
        /**
         * Note: Clients should not call this method, the workbench calls this
         * method. Calling it otherwise may result in unexpected behavior.
         *
         * Sets the given options to the editor. Clients should apply the options
         * to the current input.
         */
        setOptions(options) {
            this._options = options;
        }
        setVisible(visible, group) {
            super.setVisible(visible);
            // Propagate to Editor
            this.setEditorVisible(visible, group);
        }
        /**
         * Indicates that the editor control got visible or hidden in a specific group. A
         * editor instance will only ever be visible in one editor group.
         *
         * @param visible the state of visibility of this editor
         * @param group the editor group this editor is in.
         */
        setEditorVisible(visible, group) {
            this._group = group;
        }
        getEditorMemento(editorGroupService, configurationService, key, limit = 10) {
            const mementoKey = `${this.getId()}${key}`;
            let editorMemento = EditorPane.EDITOR_MEMENTOS.get(mementoKey);
            if (!editorMemento) {
                editorMemento = this._register(new EditorMemento(this.getId(), key, this.getMemento(1 /* StorageScope.WORKSPACE */, 1 /* StorageTarget.MACHINE */), limit, editorGroupService, configurationService));
                EditorPane.EDITOR_MEMENTOS.set(mementoKey, editorMemento);
            }
            return editorMemento;
        }
        getViewState() {
            // Subclasses to override
            return undefined;
        }
        saveState() {
            // Save all editor memento for this editor type
            for (const [, editorMemento] of EditorPane.EDITOR_MEMENTOS) {
                if (editorMemento.id === this.getId()) {
                    editorMemento.saveState();
                }
            }
            super.saveState();
        }
        dispose() {
            this._input = undefined;
            this._options = undefined;
            super.dispose();
        }
    }
    exports.EditorPane = EditorPane;
    //#endregion
    EditorPane.EDITOR_MEMENTOS = new Map();
    class EditorMemento extends lifecycle_1.Disposable {
        constructor(id, key, memento, limit, editorGroupService, configurationService) {
            super();
            this.id = id;
            this.key = key;
            this.memento = memento;
            this.limit = limit;
            this.editorGroupService = editorGroupService;
            this.configurationService = configurationService;
            this.cleanedUp = false;
            this.shareEditorState = false;
            this.updateConfiguration();
            this.registerListeners();
        }
        registerListeners() {
            this._register(this.configurationService.onDidChangeConfiguration(() => this.updateConfiguration()));
        }
        updateConfiguration() {
            this.shareEditorState = this.configurationService.getValue(undefined, 'workbench.editor.sharedViewState') === true;
        }
        saveEditorState(group, resourceOrEditor, state) {
            const resource = this.doGetResource(resourceOrEditor);
            if (!resource || !group) {
                return; // we are not in a good state to save any state for a resource
            }
            const cache = this.doLoad();
            // Ensure mementos for resource map
            let mementosForResource = cache.get(resource.toString());
            if (!mementosForResource) {
                mementosForResource = Object.create(null);
                cache.set(resource.toString(), mementosForResource);
            }
            // Store state for group
            mementosForResource[group.id] = state;
            // Store state as most recent one based on settings
            if (this.shareEditorState) {
                mementosForResource[EditorMemento.SHARED_EDITOR_STATE] = state;
            }
            // Automatically clear when editor input gets disposed if any
            if ((0, editor_1.isEditorInput)(resourceOrEditor)) {
                this.clearEditorStateOnDispose(resource, resourceOrEditor);
            }
        }
        loadEditorState(group, resourceOrEditor) {
            const resource = this.doGetResource(resourceOrEditor);
            if (!resource || !group) {
                return; // we are not in a good state to load any state for a resource
            }
            const cache = this.doLoad();
            const mementosForResource = cache.get(resource.toString());
            if (mementosForResource) {
                let mementoForResourceAndGroup = mementosForResource[group.id];
                // Return state for group if present
                if (mementoForResourceAndGroup) {
                    return mementoForResourceAndGroup;
                }
                // Return most recent state based on settings otherwise
                if (this.shareEditorState) {
                    return mementosForResource[EditorMemento.SHARED_EDITOR_STATE];
                }
            }
            return undefined;
        }
        clearEditorState(resourceOrEditor, group) {
            var _a;
            if ((0, editor_1.isEditorInput)(resourceOrEditor)) {
                (_a = this.editorDisposables) === null || _a === void 0 ? void 0 : _a.delete(resourceOrEditor);
            }
            const resource = this.doGetResource(resourceOrEditor);
            if (resource) {
                const cache = this.doLoad();
                // Clear state for group
                if (group) {
                    const mementosForResource = cache.get(resource.toString());
                    if (mementosForResource) {
                        delete mementosForResource[group.id];
                        if ((0, types_1.isEmptyObject)(mementosForResource)) {
                            cache.delete(resource.toString());
                        }
                    }
                }
                // Clear state across all groups for resource
                else {
                    cache.delete(resource.toString());
                }
            }
        }
        clearEditorStateOnDispose(resource, editor) {
            if (!this.editorDisposables) {
                this.editorDisposables = new Map();
            }
            if (!this.editorDisposables.has(editor)) {
                this.editorDisposables.set(editor, event_1.Event.once(editor.onWillDispose)(() => {
                    var _a;
                    this.clearEditorState(resource);
                    (_a = this.editorDisposables) === null || _a === void 0 ? void 0 : _a.delete(editor);
                }));
            }
        }
        moveEditorState(source, target, comparer) {
            const cache = this.doLoad();
            // We need a copy of the keys to not iterate over
            // newly inserted elements.
            const cacheKeys = [...cache.keys()];
            for (const cacheKey of cacheKeys) {
                const resource = uri_1.URI.parse(cacheKey);
                if (!comparer.isEqualOrParent(resource, source)) {
                    continue; // not matching our resource
                }
                // Determine new resulting target resource
                let targetResource;
                if ((0, resources_1.isEqual)(source, resource)) {
                    targetResource = target; // file got moved
                }
                else {
                    const index = (0, extpath_1.indexOfPath)(resource.path, source.path);
                    targetResource = (0, resources_1.joinPath)(target, resource.path.substr(index + source.path.length + 1)); // parent folder got moved
                }
                // Don't modify LRU state
                const value = cache.get(cacheKey, 0 /* Touch.None */);
                if (value) {
                    cache.delete(cacheKey);
                    cache.set(targetResource.toString(), value);
                }
            }
        }
        doGetResource(resourceOrEditor) {
            if ((0, editor_1.isEditorInput)(resourceOrEditor)) {
                return resourceOrEditor.resource;
            }
            return resourceOrEditor;
        }
        doLoad() {
            if (!this.cache) {
                this.cache = new map_1.LRUCache(this.limit);
                // Restore from serialized map state
                const rawEditorMemento = this.memento[this.key];
                if (Array.isArray(rawEditorMemento)) {
                    this.cache.fromJSON(rawEditorMemento);
                }
            }
            return this.cache;
        }
        saveState() {
            const cache = this.doLoad();
            // Cleanup once during session
            if (!this.cleanedUp) {
                this.cleanUp();
                this.cleanedUp = true;
            }
            this.memento[this.key] = cache.toJSON();
        }
        cleanUp() {
            const cache = this.doLoad();
            // Remove groups from states that no longer exist. Since we modify the
            // cache and its is a LRU cache make a copy to ensure iteration succeeds
            const entries = [...cache.entries()];
            for (const [resource, mapGroupToMementos] of entries) {
                for (const group of Object.keys(mapGroupToMementos)) {
                    const groupId = Number(group);
                    if (groupId === EditorMemento.SHARED_EDITOR_STATE && this.shareEditorState) {
                        continue; // skip over shared entries if sharing is enabled
                    }
                    if (!this.editorGroupService.getGroup(groupId)) {
                        delete mapGroupToMementos[groupId];
                        if ((0, types_1.isEmptyObject)(mapGroupToMementos)) {
                            cache.delete(resource);
                        }
                    }
                }
            }
        }
    }
    exports.EditorMemento = EditorMemento;
    EditorMemento.SHARED_EDITOR_STATE = -1; // pick a number < 0 to be outside group id range
});
//# sourceMappingURL=editorPane.js.map