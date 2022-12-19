/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/workbench/common/editor", "vs/platform/registry/common/platform", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/async", "vs/workbench/services/editor/common/editorService", "vs/platform/uriIdentity/common/uriIdentity", "vs/workbench/services/workingCopy/common/workingCopyService", "vs/base/common/network"], function (require, exports, nls_1, editor_1, platform_1, arrays_1, lifecycle_1, async_1, editorService_1, uriIdentity_1, workingCopyService_1, network_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.computeEditorAriaLabel = exports.whenEditorClosed = exports.EditorPaneRegistry = exports.EditorPaneDescriptor = void 0;
    /**
     * A lightweight descriptor of an editor pane. The descriptor is deferred so that heavy editor
     * panes can load lazily in the workbench.
     */
    class EditorPaneDescriptor {
        constructor(ctor, typeId, name) {
            this.ctor = ctor;
            this.typeId = typeId;
            this.name = name;
        }
        static create(ctor, typeId, name) {
            return new EditorPaneDescriptor(ctor, typeId, name);
        }
        instantiate(instantiationService) {
            return instantiationService.createInstance(this.ctor);
        }
        describes(editorPane) {
            return editorPane.getId() === this.typeId;
        }
    }
    exports.EditorPaneDescriptor = EditorPaneDescriptor;
    class EditorPaneRegistry {
        constructor() {
            this.editorPanes = [];
            this.mapEditorPanesToEditors = new Map();
            //#endregion
        }
        registerEditorPane(editorPaneDescriptor, editorDescriptors) {
            this.mapEditorPanesToEditors.set(editorPaneDescriptor, editorDescriptors);
            const remove = (0, arrays_1.insert)(this.editorPanes, editorPaneDescriptor);
            return (0, lifecycle_1.toDisposable)(() => {
                this.mapEditorPanesToEditors.delete(editorPaneDescriptor);
                remove();
            });
        }
        getEditorPane(editor) {
            const descriptors = this.findEditorPaneDescriptors(editor);
            if (descriptors.length === 0) {
                return undefined;
            }
            if (descriptors.length === 1) {
                return descriptors[0];
            }
            return editor.prefersEditorPane(descriptors);
        }
        findEditorPaneDescriptors(editor, byInstanceOf) {
            const matchingEditorPaneDescriptors = [];
            for (const editorPane of this.editorPanes) {
                const editorDescriptors = this.mapEditorPanesToEditors.get(editorPane) || [];
                for (const editorDescriptor of editorDescriptors) {
                    const editorClass = editorDescriptor.ctor;
                    // Direct check on constructor type (ignores prototype chain)
                    if (!byInstanceOf && editor.constructor === editorClass) {
                        matchingEditorPaneDescriptors.push(editorPane);
                        break;
                    }
                    // Normal instanceof check
                    else if (byInstanceOf && editor instanceof editorClass) {
                        matchingEditorPaneDescriptors.push(editorPane);
                        break;
                    }
                }
            }
            // If no descriptors found, continue search using instanceof and prototype chain
            if (!byInstanceOf && matchingEditorPaneDescriptors.length === 0) {
                return this.findEditorPaneDescriptors(editor, true);
            }
            return matchingEditorPaneDescriptors;
        }
        //#region Used for tests only
        getEditorPaneByType(typeId) {
            return this.editorPanes.find(editor => editor.typeId === typeId);
        }
        getEditorPanes() {
            return this.editorPanes.slice(0);
        }
        getEditors() {
            const editorClasses = [];
            for (const editorPane of this.editorPanes) {
                const editorDescriptors = this.mapEditorPanesToEditors.get(editorPane);
                if (editorDescriptors) {
                    editorClasses.push(...editorDescriptors.map(editorDescriptor => editorDescriptor.ctor));
                }
            }
            return editorClasses;
        }
    }
    exports.EditorPaneRegistry = EditorPaneRegistry;
    platform_1.Registry.add(editor_1.EditorExtensions.EditorPane, new EditorPaneRegistry());
    //#endregion
    //#region Editor Close Tracker
    function whenEditorClosed(accessor, resources) {
        const editorService = accessor.get(editorService_1.IEditorService);
        const uriIdentityService = accessor.get(uriIdentity_1.IUriIdentityService);
        const workingCopyService = accessor.get(workingCopyService_1.IWorkingCopyService);
        return new Promise(resolve => {
            let remainingResources = [...resources];
            // Observe any editor closing from this moment on
            const listener = editorService.onDidCloseEditor(async (event) => {
                if (event.context === editor_1.EditorCloseContext.MOVE) {
                    return; // ignore move events where the editor will open in another group
                }
                let primaryResource = editor_1.EditorResourceAccessor.getOriginalUri(event.editor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                let secondaryResource = editor_1.EditorResourceAccessor.getOriginalUri(event.editor, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY });
                // Specially handle an editor getting replaced: if the new active editor
                // matches any of the resources from the closed editor, ignore those
                // resources because they were actually not closed, but replaced.
                // (see https://github.com/microsoft/vscode/issues/134299)
                if (event.context === editor_1.EditorCloseContext.REPLACE) {
                    const newPrimaryResource = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.PRIMARY });
                    const newSecondaryResource = editor_1.EditorResourceAccessor.getOriginalUri(editorService.activeEditor, { supportSideBySide: editor_1.SideBySideEditor.SECONDARY });
                    if (uriIdentityService.extUri.isEqual(primaryResource, newPrimaryResource)) {
                        primaryResource = undefined;
                    }
                    if (uriIdentityService.extUri.isEqual(secondaryResource, newSecondaryResource)) {
                        secondaryResource = undefined;
                    }
                }
                // Remove from resources to wait for being closed based on the
                // resources from editors that got closed
                remainingResources = remainingResources.filter(resource => {
                    // Closing editor matches resource directly: remove from remaining
                    if (uriIdentityService.extUri.isEqual(resource, primaryResource) || uriIdentityService.extUri.isEqual(resource, secondaryResource)) {
                        return false;
                    }
                    // Closing editor is untitled with associated resource
                    // that matches resource directly: remove from remaining
                    // but only if the editor was not replaced, otherwise
                    // saving an untitled with associated resource would
                    // release the `--wait` call.
                    // (see https://github.com/microsoft/vscode/issues/141237)
                    if (event.context !== editor_1.EditorCloseContext.REPLACE) {
                        if (((primaryResource === null || primaryResource === void 0 ? void 0 : primaryResource.scheme) === network_1.Schemas.untitled && uriIdentityService.extUri.isEqual(resource, primaryResource.with({ scheme: resource.scheme }))) ||
                            ((secondaryResource === null || secondaryResource === void 0 ? void 0 : secondaryResource.scheme) === network_1.Schemas.untitled && uriIdentityService.extUri.isEqual(resource, secondaryResource.with({ scheme: resource.scheme })))) {
                            return false;
                        }
                    }
                    // Editor is not yet closed, so keep it in waiting mode
                    return true;
                });
                // All resources to wait for being closed are closed
                if (remainingResources.length === 0) {
                    // If auto save is configured with the default delay (1s) it is possible
                    // to close the editor while the save still continues in the background. As such
                    // we have to also check if the editors to track for are dirty and if so wait
                    // for them to get saved.
                    const dirtyResources = resources.filter(resource => workingCopyService.isDirty(resource));
                    if (dirtyResources.length > 0) {
                        await async_1.Promises.settled(dirtyResources.map(async (resource) => await new Promise(resolve => {
                            if (!workingCopyService.isDirty(resource)) {
                                return resolve(); // return early if resource is not dirty
                            }
                            // Otherwise resolve promise when resource is saved
                            const listener = workingCopyService.onDidChangeDirty(workingCopy => {
                                if (!workingCopy.isDirty() && uriIdentityService.extUri.isEqual(resource, workingCopy.resource)) {
                                    listener.dispose();
                                    return resolve();
                                }
                            });
                        })));
                    }
                    listener.dispose();
                    return resolve();
                }
            });
        });
    }
    exports.whenEditorClosed = whenEditorClosed;
    //#endregion
    //#region ARIA
    function computeEditorAriaLabel(input, index, group, groupCount) {
        let ariaLabel = input.getAriaLabel();
        if (group && !group.isPinned(input)) {
            ariaLabel = (0, nls_1.localize)('preview', "{0}, preview", ariaLabel);
        }
        if (group === null || group === void 0 ? void 0 : group.isSticky(index !== null && index !== void 0 ? index : input)) {
            ariaLabel = (0, nls_1.localize)('pinned', "{0}, pinned", ariaLabel);
        }
        // Apply group information to help identify in
        // which group we are (only if more than one group
        // is actually opened)
        if (group && typeof groupCount === 'number' && groupCount > 1) {
            ariaLabel = `${ariaLabel}, ${group.ariaLabel}`;
        }
        return ariaLabel;
    }
    exports.computeEditorAriaLabel = computeEditorAriaLabel;
});
//#endregion
//# sourceMappingURL=editor.js.map