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
define(["require", "exports", "vs/base/common/event", "vs/workbench/common/editor", "vs/workbench/browser/parts/editor/editorPane", "vs/platform/storage/common/storage", "vs/platform/instantiation/common/instantiation", "vs/platform/telemetry/common/telemetry", "vs/platform/theme/common/themeService", "vs/editor/common/services/textResourceConfiguration", "vs/workbench/services/editor/common/editorGroupsService", "vs/workbench/services/editor/common/editorService", "vs/base/common/lifecycle"], function (require, exports, event_1, editor_1, editorPane_1, storage_1, instantiation_1, telemetry_1, themeService_1, textResourceConfiguration_1, editorGroupsService_1, editorService_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AbstractEditorWithViewState = void 0;
    /**
     * Base class of editors that want to store and restore view state.
     */
    let AbstractEditorWithViewState = class AbstractEditorWithViewState extends editorPane_1.EditorPane {
        constructor(id, viewStateStorageKey, telemetryService, instantiationService, storageService, textResourceConfigurationService, themeService, editorService, editorGroupService) {
            super(id, telemetryService, themeService, storageService);
            this.instantiationService = instantiationService;
            this.textResourceConfigurationService = textResourceConfigurationService;
            this.editorService = editorService;
            this.editorGroupService = editorGroupService;
            this.groupListener = this._register(new lifecycle_1.MutableDisposable());
            this.viewState = this.getEditorMemento(editorGroupService, textResourceConfigurationService, viewStateStorageKey, 100);
        }
        setEditorVisible(visible, group) {
            // Listen to close events to trigger `onWillCloseEditorInGroup`
            this.groupListener.value = group === null || group === void 0 ? void 0 : group.onWillCloseEditor(e => this.onWillCloseEditor(e));
            super.setEditorVisible(visible, group);
        }
        onWillCloseEditor(e) {
            const editor = e.editor;
            if (editor === this.input) {
                // React to editors closing to preserve or clear view state. This needs to happen
                // in the `onWillCloseEditor` because at that time the editor has not yet
                // been disposed and we can safely persist the view state.
                this.updateEditorViewState(editor);
            }
        }
        clearInput() {
            // Preserve current input view state before clearing
            this.updateEditorViewState(this.input);
            super.clearInput();
        }
        saveState() {
            // Preserve current input view state before shutting down
            this.updateEditorViewState(this.input);
            super.saveState();
        }
        updateEditorViewState(input) {
            if (!input || !this.tracksEditorViewState(input)) {
                return; // ensure we have an input to handle view state for
            }
            const resource = this.toEditorViewStateResource(input);
            if (!resource) {
                return; // we need a resource
            }
            // If we are not tracking disposed editor view state
            // make sure to clear the view state once the editor
            // is disposed.
            if (!this.tracksDisposedEditorViewState()) {
                if (!this.editorViewStateDisposables) {
                    this.editorViewStateDisposables = new Map();
                }
                if (!this.editorViewStateDisposables.has(input)) {
                    this.editorViewStateDisposables.set(input, event_1.Event.once(input.onWillDispose)(() => {
                        var _a;
                        this.clearEditorViewState(resource, this.group);
                        (_a = this.editorViewStateDisposables) === null || _a === void 0 ? void 0 : _a.delete(input);
                    }));
                }
            }
            // Clear the editor view state if:
            // - the editor view state should not be tracked for disposed editors
            // - the user configured to not restore view state unless the editor is still opened in the group
            if ((input.isDisposed() && !this.tracksDisposedEditorViewState()) ||
                (!this.shouldRestoreEditorViewState(input) && (!this.group || !this.group.contains(input)))) {
                this.clearEditorViewState(resource, this.group);
            }
            // Otherwise we save the view state
            else if (!input.isDisposed()) {
                this.saveEditorViewState(resource);
            }
        }
        shouldRestoreEditorViewState(input, context) {
            // new editor: check with workbench.editor.restoreViewState setting
            if (context === null || context === void 0 ? void 0 : context.newInGroup) {
                return this.textResourceConfigurationService.getValue(editor_1.EditorResourceAccessor.getOriginalUri(input, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY }), 'workbench.editor.restoreViewState') === false ? false : true /* restore by default */;
            }
            // existing editor: always restore viewstate
            return true;
        }
        getViewState() {
            const input = this.input;
            if (!input || !this.tracksEditorViewState(input)) {
                return; // need valid input for view state
            }
            const resource = this.toEditorViewStateResource(input);
            if (!resource) {
                return; // need a resource for finding view state
            }
            return this.computeEditorViewState(resource);
        }
        saveEditorViewState(resource) {
            if (!this.group) {
                return;
            }
            const editorViewState = this.computeEditorViewState(resource);
            if (!editorViewState) {
                return;
            }
            this.viewState.saveEditorState(this.group, resource, editorViewState);
        }
        loadEditorViewState(input, context) {
            if (!input || !this.group) {
                return undefined; // we need valid input
            }
            if (!this.tracksEditorViewState(input)) {
                return undefined; // not tracking for input
            }
            if (!this.shouldRestoreEditorViewState(input, context)) {
                return undefined; // not enabled for input
            }
            const resource = this.toEditorViewStateResource(input);
            if (!resource) {
                return; // need a resource for finding view state
            }
            return this.viewState.loadEditorState(this.group, resource);
        }
        moveEditorViewState(source, target, comparer) {
            return this.viewState.moveEditorState(source, target, comparer);
        }
        clearEditorViewState(resource, group) {
            this.viewState.clearEditorState(resource, group);
        }
        dispose() {
            super.dispose();
            if (this.editorViewStateDisposables) {
                for (const [, disposables] of this.editorViewStateDisposables) {
                    disposables.dispose();
                }
                this.editorViewStateDisposables = undefined;
            }
        }
        /**
         * Whether view state should be tracked even when the editor is
         * disposed.
         *
         * Subclasses should override this if the input can be restored
         * from the resource at a later point, e.g. if backed by files.
         */
        tracksDisposedEditorViewState() {
            return false;
        }
    };
    AbstractEditorWithViewState = __decorate([
        __param(2, telemetry_1.ITelemetryService),
        __param(3, instantiation_1.IInstantiationService),
        __param(4, storage_1.IStorageService),
        __param(5, textResourceConfiguration_1.ITextResourceConfigurationService),
        __param(6, themeService_1.IThemeService),
        __param(7, editorService_1.IEditorService),
        __param(8, editorGroupsService_1.IEditorGroupsService)
    ], AbstractEditorWithViewState);
    exports.AbstractEditorWithViewState = AbstractEditorWithViewState;
});
//# sourceMappingURL=editorWithViewState.js.map