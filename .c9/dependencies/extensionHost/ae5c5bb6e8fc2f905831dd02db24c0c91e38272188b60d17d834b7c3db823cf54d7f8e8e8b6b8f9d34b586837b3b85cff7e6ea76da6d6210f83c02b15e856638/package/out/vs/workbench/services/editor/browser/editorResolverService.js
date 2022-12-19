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
define(["require", "exports", "vs/base/common/glob", "vs/base/common/arrays", "vs/base/common/lifecycle", "vs/base/common/resources", "vs/base/common/uri", "vs/platform/configuration/common/configuration", "vs/platform/editor/common/editor", "vs/workbench/common/editor", "vs/workbench/services/editor/common/editorGroupsService", "vs/base/common/network", "vs/workbench/services/editor/common/editorResolverService", "vs/platform/quickinput/common/quickInput", "vs/nls", "vs/platform/notification/common/notification", "vs/platform/telemetry/common/telemetry", "vs/platform/instantiation/common/extensions", "vs/platform/storage/common/storage", "vs/workbench/services/extensions/common/extensions", "vs/platform/log/common/log", "vs/workbench/services/editor/common/editorGroupFinder", "vs/platform/instantiation/common/instantiation", "vs/workbench/common/editor/sideBySideEditorInput", "vs/base/common/event"], function (require, exports, glob, arrays_1, lifecycle_1, resources_1, uri_1, configuration_1, editor_1, editor_2, editorGroupsService_1, network_1, editorResolverService_1, quickInput_1, nls_1, notification_1, telemetry_1, extensions_1, storage_1, extensions_2, log_1, editorGroupFinder_1, instantiation_1, sideBySideEditorInput_1, event_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EditorResolverService = void 0;
    let EditorResolverService = class EditorResolverService extends lifecycle_1.Disposable {
        constructor(editorGroupService, instantiationService, configurationService, quickInputService, notificationService, telemetryService, storageService, extensionService, logService) {
            super();
            this.editorGroupService = editorGroupService;
            this.instantiationService = instantiationService;
            this.configurationService = configurationService;
            this.quickInputService = quickInputService;
            this.notificationService = notificationService;
            this.telemetryService = telemetryService;
            this.storageService = storageService;
            this.extensionService = extensionService;
            this.logService = logService;
            // Events
            this._onDidChangeEditorRegistrations = this._register(new event_1.Emitter());
            this.onDidChangeEditorRegistrations = this._onDidChangeEditorRegistrations.event;
            // Data Stores
            this._editors = new Map();
            // Read in the cache on statup
            this.cache = new Set(JSON.parse(this.storageService.get(EditorResolverService.cacheStorageID, 0 /* StorageScope.GLOBAL */, JSON.stringify([]))));
            this.storageService.remove(EditorResolverService.cacheStorageID, 0 /* StorageScope.GLOBAL */);
            this.convertOldAssociationFormat();
            this._register(this.storageService.onWillSaveState(() => {
                // We want to store the glob patterns we would activate on, this allows us to know if we need to await the ext host on startup for opening a resource
                this.cacheEditors();
            }));
            // When extensions have registered we no longer need the cache
            this.extensionService.onDidRegisterExtensions(() => {
                this.cache = undefined;
            });
            // When the setting changes we want to ensure that it is properly converted
            this._register(this.configurationService.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration(editorResolverService_1.editorsAssociationsSettingId)) {
                    this.convertOldAssociationFormat();
                }
            }));
        }
        resolveUntypedInputAndGroup(editor, preferredGroup) {
            let untypedEditor = undefined;
            // Typed: convert to untyped to be able to resolve the editor as the service only uses untyped
            if ((0, editor_2.isEditorInputWithOptions)(editor)) {
                untypedEditor = editor.editor.toUntyped();
                if (untypedEditor) {
                    // Preserve original options: specifically it is
                    // possible that a `override` was defined from
                    // the outside and we do not want to lose it.
                    untypedEditor.options = Object.assign(Object.assign({}, untypedEditor.options), editor.options);
                }
            }
            // Untyped: take as is
            else {
                untypedEditor = editor;
            }
            // Typed editors that cannot convert to untyped will be returned as undefined
            if (!untypedEditor) {
                return undefined;
            }
            // Use the untyped editor to find a group
            const [group, activation] = this.instantiationService.invokeFunction(editorGroupFinder_1.findGroup, untypedEditor, preferredGroup);
            return [untypedEditor, group, activation];
        }
        async resolveEditor(editor, preferredGroup) {
            var _a, _b, _c, _d, _e, _f;
            // Special case: side by side editors requires us to
            // independently resolve both sides and then build
            // a side by side editor with the result
            if ((0, editor_2.isResourceSideBySideEditorInput)(editor)) {
                return this.doResolveSideBySideEditor(editor, preferredGroup);
            }
            const resolvedUntypedAndGroup = this.resolveUntypedInputAndGroup(editor, preferredGroup);
            if (!resolvedUntypedAndGroup) {
                return 2 /* ResolvedStatus.NONE */;
            }
            // Get the resolved untyped editor, group, and activation
            const [untypedEditor, group, activation] = resolvedUntypedAndGroup;
            if (activation) {
                untypedEditor.options = Object.assign(Object.assign({}, untypedEditor.options), { activation });
            }
            let resource = editor_2.EditorResourceAccessor.getCanonicalUri(untypedEditor, { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            let options = untypedEditor.options;
            // If it was resolved before we await for the extensions to activate and then proceed with resolution or else the backing extensions won't be registered
            if (this.cache && resource && this.resourceMatchesCache(resource)) {
                await this.extensionService.whenInstalledExtensionsRegistered();
            }
            // Undefined resource -> untilted. Other malformed URI's are unresolvable
            if (resource === undefined) {
                resource = uri_1.URI.from({ scheme: network_1.Schemas.untitled });
            }
            else if (resource.scheme === undefined || resource === null) {
                return 2 /* ResolvedStatus.NONE */;
            }
            if (((_a = untypedEditor.options) === null || _a === void 0 ? void 0 : _a.override) === editor_1.EditorResolution.DISABLED) {
                throw new Error(`Calling resolve editor when resolution is explicitly disabled!`);
            }
            if (((_b = untypedEditor.options) === null || _b === void 0 ? void 0 : _b.override) === editor_1.EditorResolution.PICK) {
                const picked = await this.doPickEditor(untypedEditor);
                // If the picker was cancelled we will stop resolving the editor
                if (!picked) {
                    return 1 /* ResolvedStatus.ABORT */;
                }
                // Populate the options with the new ones
                untypedEditor.options = picked;
            }
            // Resolved the editor ID as much as possible, now find a given editor (cast here is ok because we resolve down to a string above)
            let { editor: selectedEditor, conflictingDefault } = this.getEditor(resource, (_c = untypedEditor.options) === null || _c === void 0 ? void 0 : _c.override);
            if (!selectedEditor) {
                return 2 /* ResolvedStatus.NONE */;
            }
            // In the special case of diff editors we do some more work to determine the correct editor for both sides
            if ((0, editor_2.isResourceDiffEditorInput)(untypedEditor) && ((_d = untypedEditor.options) === null || _d === void 0 ? void 0 : _d.override) === undefined) {
                let resource2 = editor_2.EditorResourceAccessor.getCanonicalUri(untypedEditor, { supportSideBySide: editor_2.SideBySideEditor.SECONDARY });
                if (!resource2) {
                    resource2 = uri_1.URI.from({ scheme: network_1.Schemas.untitled });
                }
                const { editor: selectedEditor2 } = this.getEditor(resource2, undefined);
                if (!selectedEditor2 || selectedEditor.editorInfo.id !== selectedEditor2.editorInfo.id) {
                    const { editor: selectedDiff, conflictingDefault: conflictingDefaultDiff } = this.getEditor(resource, editor_2.DEFAULT_EDITOR_ASSOCIATION.id);
                    selectedEditor = selectedDiff;
                    conflictingDefault = conflictingDefaultDiff;
                }
                if (!selectedEditor) {
                    return 2 /* ResolvedStatus.NONE */;
                }
            }
            // If no override we take the selected editor id so that matches works with the isActive check
            untypedEditor.options = Object.assign({ override: selectedEditor.editorInfo.id }, untypedEditor.options);
            let handlesDiff = typeof ((_e = selectedEditor.options) === null || _e === void 0 ? void 0 : _e.canHandleDiff) === 'function' ? selectedEditor.options.canHandleDiff() : (_f = selectedEditor.options) === null || _f === void 0 ? void 0 : _f.canHandleDiff;
            // Also check that it has a factory function or else it doesn't matter
            handlesDiff = handlesDiff && selectedEditor.createDiffEditorInput !== undefined;
            if (handlesDiff === false && (0, editor_2.isResourceDiffEditorInput)(untypedEditor)) {
                return 2 /* ResolvedStatus.NONE */;
            }
            // If it's the currently active editor we shouldn't do anything
            const activeEditor = group.activeEditor;
            const isActive = activeEditor ? activeEditor.matches(untypedEditor) : false;
            if (activeEditor && isActive) {
                return { editor: activeEditor, options, group };
            }
            const input = await this.doResolveEditor(untypedEditor, group, selectedEditor);
            if (conflictingDefault && input) {
                // Show the conflicting default dialog
                await this.doHandleConflictingDefaults(resource, selectedEditor.editorInfo.label, untypedEditor, input.editor, group);
            }
            if (input) {
                this.sendEditorResolutionTelemetry(input.editor);
                if (input.editor.editorId !== selectedEditor.editorInfo.id) {
                    this.logService.warn(`Editor ID Mismatch: ${input.editor.editorId} !== ${selectedEditor.editorInfo.id}. This will cause bugs. Please ensure editorInput.editorId matches the registered id`);
                }
                return Object.assign(Object.assign({}, input), { group });
            }
            return 1 /* ResolvedStatus.ABORT */;
        }
        async doResolveSideBySideEditor(editor, preferredGroup) {
            var _a, _b;
            const primaryResolvedEditor = await this.resolveEditor(editor.primary, preferredGroup);
            if (!(0, editor_2.isEditorInputWithOptionsAndGroup)(primaryResolvedEditor)) {
                return 2 /* ResolvedStatus.NONE */;
            }
            const secondaryResolvedEditor = await this.resolveEditor(editor.secondary, (_a = primaryResolvedEditor.group) !== null && _a !== void 0 ? _a : preferredGroup);
            if (!(0, editor_2.isEditorInputWithOptionsAndGroup)(secondaryResolvedEditor)) {
                return 2 /* ResolvedStatus.NONE */;
            }
            return {
                group: (_b = primaryResolvedEditor.group) !== null && _b !== void 0 ? _b : secondaryResolvedEditor.group,
                editor: this.instantiationService.createInstance(sideBySideEditorInput_1.SideBySideEditorInput, editor.label, editor.description, secondaryResolvedEditor.editor, primaryResolvedEditor.editor),
                options: editor.options
            };
        }
        registerEditor(globPattern, editorInfo, options, createEditorInput, createUntitledEditorInput, createDiffEditorInput) {
            let registeredEditor = this._editors.get(globPattern);
            if (registeredEditor === undefined) {
                registeredEditor = [];
                this._editors.set(globPattern, registeredEditor);
            }
            const remove = (0, arrays_1.insert)(registeredEditor, {
                globPattern,
                editorInfo,
                options,
                createEditorInput,
                createUntitledEditorInput,
                createDiffEditorInput
            });
            this._onDidChangeEditorRegistrations.fire();
            return (0, lifecycle_1.toDisposable)(() => {
                remove();
                this._onDidChangeEditorRegistrations.fire();
            });
        }
        getAssociationsForResource(resource) {
            const associations = this.getAllUserAssociations();
            const matchingAssociations = associations.filter(association => association.filenamePattern && (0, editorResolverService_1.globMatchesResource)(association.filenamePattern, resource));
            const allEditors = this._registeredEditors;
            // Ensure that the settings are valid editors
            return matchingAssociations.filter(association => allEditors.find(c => c.editorInfo.id === association.viewType));
        }
        convertOldAssociationFormat() {
            const rawAssociations = this.configurationService.getValue(editorResolverService_1.editorsAssociationsSettingId) || [];
            // If it's not an array, then it's the new format
            if (!Array.isArray(rawAssociations)) {
                return;
            }
            let newSettingObject = Object.create(null);
            // Make the correctly formatted object from the array and then set that object
            for (const association of rawAssociations) {
                if (association.filenamePattern) {
                    newSettingObject[association.filenamePattern] = association.viewType;
                }
            }
            this.logService.info(`Migrating ${editorResolverService_1.editorsAssociationsSettingId}`);
            this.configurationService.updateValue(editorResolverService_1.editorsAssociationsSettingId, newSettingObject);
        }
        getAllUserAssociations() {
            var _a, _b;
            const inspectedEditorAssociations = this.configurationService.inspect(editorResolverService_1.editorsAssociationsSettingId) || {};
            const workspaceAssociations = (_a = inspectedEditorAssociations.workspaceValue) !== null && _a !== void 0 ? _a : {};
            const userAssociations = (_b = inspectedEditorAssociations.userValue) !== null && _b !== void 0 ? _b : {};
            const rawAssociations = Object.assign({}, workspaceAssociations);
            // We want to apply the user associations on top of the workspace associations but ignore duplicate keys.
            for (const [key, value] of Object.entries(userAssociations)) {
                if (rawAssociations[key] === undefined) {
                    rawAssociations[key] = value;
                }
            }
            let associations = [];
            for (const [key, value] of Object.entries(rawAssociations)) {
                const association = {
                    filenamePattern: key,
                    viewType: value
                };
                associations.push(association);
            }
            return associations;
        }
        /**
         * Returns all editors as an array. Possible to contain duplicates
         */
        get _registeredEditors() {
            return (0, arrays_1.flatten)(Array.from(this._editors.values()));
        }
        updateUserAssociations(globPattern, editorID) {
            const newAssociation = { viewType: editorID, filenamePattern: globPattern };
            const currentAssociations = this.getAllUserAssociations();
            const newSettingObject = Object.create(null);
            // Form the new setting object including the newest associations
            for (const association of [...currentAssociations, newAssociation]) {
                if (association.filenamePattern) {
                    newSettingObject[association.filenamePattern] = association.viewType;
                }
            }
            this.configurationService.updateValue(editorResolverService_1.editorsAssociationsSettingId, newSettingObject);
        }
        findMatchingEditors(resource) {
            // The user setting should be respected even if the editor doesn't specify that resource in package.json
            const userSettings = this.getAssociationsForResource(resource);
            let matchingEditors = [];
            // Then all glob patterns
            for (const [key, editors] of this._editors) {
                for (const editor of editors) {
                    const foundInSettings = userSettings.find(setting => setting.viewType === editor.editorInfo.id);
                    if ((foundInSettings && editor.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.exclusive) || (0, editorResolverService_1.globMatchesResource)(key, resource)) {
                        matchingEditors.push(editor);
                    }
                }
            }
            // Return the editors sorted by their priority
            return matchingEditors.sort((a, b) => {
                // Very crude if priorities match longer glob wins as longer globs are normally more specific
                if ((0, editorResolverService_1.priorityToRank)(b.editorInfo.priority) === (0, editorResolverService_1.priorityToRank)(a.editorInfo.priority) && typeof b.globPattern === 'string' && typeof a.globPattern === 'string') {
                    return b.globPattern.length - a.globPattern.length;
                }
                return (0, editorResolverService_1.priorityToRank)(b.editorInfo.priority) - (0, editorResolverService_1.priorityToRank)(a.editorInfo.priority);
            });
        }
        getEditors(resource) {
            // By resource
            if (uri_1.URI.isUri(resource)) {
                const editors = this.findMatchingEditors(resource);
                if (editors.find(e => e.editorInfo.priority === editorResolverService_1.RegisteredEditorPriority.exclusive)) {
                    return [];
                }
                return editors.map(editor => editor.editorInfo);
            }
            // All
            return (0, arrays_1.distinct)(this._registeredEditors.map(editor => editor.editorInfo), editor => editor.id);
        }
        /**
         * Given a resource and an editorId selects the best possible editor
         * @returns The editor and whether there was another default which conflicted with it
         */
        getEditor(resource, editorId) {
            var _a;
            const findMatchingEditor = (editors, viewType) => {
                return editors.find((editor) => {
                    if (editor.options && editor.options.canSupportResource !== undefined) {
                        return editor.editorInfo.id === viewType && editor.options.canSupportResource(resource);
                    }
                    return editor.editorInfo.id === viewType;
                });
            };
            if (editorId && editorId !== editor_1.EditorResolution.EXCLUSIVE_ONLY) {
                // Specific id passed in doesn't have to match the resource, it can be anything
                const registeredEditors = this._registeredEditors;
                return {
                    editor: findMatchingEditor(registeredEditors, editorId),
                    conflictingDefault: false
                };
            }
            let editors = this.findMatchingEditors(resource);
            const associationsFromSetting = this.getAssociationsForResource(resource);
            // We only want minPriority+ if no user defined setting is found, else we won't resolve an editor
            const minPriority = editorId === editor_1.EditorResolution.EXCLUSIVE_ONLY ? editorResolverService_1.RegisteredEditorPriority.exclusive : editorResolverService_1.RegisteredEditorPriority.builtin;
            let possibleEditors = editors.filter(editor => (0, editorResolverService_1.priorityToRank)(editor.editorInfo.priority) >= (0, editorResolverService_1.priorityToRank)(minPriority) && editor.editorInfo.id !== editor_2.DEFAULT_EDITOR_ASSOCIATION.id);
            if (possibleEditors.length === 0) {
                return {
                    editor: associationsFromSetting[0] && minPriority !== editorResolverService_1.RegisteredEditorPriority.exclusive ? findMatchingEditor(editors, associationsFromSetting[0].viewType) : undefined,
                    conflictingDefault: false
                };
            }
            // If the editor is exclusive we use that, else use the user setting, else use the built-in+ editor
            const selectedViewType = possibleEditors[0].editorInfo.priority === editorResolverService_1.RegisteredEditorPriority.exclusive ?
                possibleEditors[0].editorInfo.id :
                ((_a = associationsFromSetting[0]) === null || _a === void 0 ? void 0 : _a.viewType) || possibleEditors[0].editorInfo.id;
            let conflictingDefault = false;
            // Filter out exclusive before we check for conflicts as exclusive editors cannot be manually chosen
            possibleEditors = possibleEditors.filter(editor => editor.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.exclusive);
            if (associationsFromSetting.length === 0 && possibleEditors.length > 1) {
                conflictingDefault = true;
            }
            return {
                editor: findMatchingEditor(editors, selectedViewType),
                conflictingDefault
            };
        }
        async doResolveEditor(editor, group, selectedEditor) {
            var _a, _b, _c, _d, _e;
            let options = editor.options;
            const resource = editor_2.EditorResourceAccessor.getCanonicalUri(editor, { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            // If no activation option is provided, populate it.
            if (options && typeof options.activation === 'undefined') {
                options = Object.assign(Object.assign({}, options), { activation: options.preserveFocus ? editor_1.EditorActivation.RESTORE : undefined });
            }
            // If it's a diff editor we trigger the create diff editor input
            if ((0, editor_2.isResourceDiffEditorInput)(editor)) {
                if (!selectedEditor.createDiffEditorInput) {
                    return;
                }
                const inputWithOptions = await selectedEditor.createDiffEditorInput(editor, group);
                return { editor: inputWithOptions.editor, options: (_a = inputWithOptions.options) !== null && _a !== void 0 ? _a : options };
            }
            if ((0, editor_2.isResourceSideBySideEditorInput)(editor)) {
                throw new Error(`Untyped side by side editor input not supported here.`);
            }
            if ((0, editor_2.isUntitledResourceEditorInput)(editor)) {
                if (!selectedEditor.createUntitledEditorInput) {
                    return;
                }
                const inputWithOptions = await selectedEditor.createUntitledEditorInput(editor, group);
                return { editor: inputWithOptions.editor, options: (_b = inputWithOptions.options) !== null && _b !== void 0 ? _b : options };
            }
            // Should no longer have an undefined resource so lets throw an error if that's somehow the case
            if (resource === undefined) {
                throw new Error(`Undefined resource on non untitled editor input.`);
            }
            // If the editor states it can only be opened once per resource we must close all existing ones except one and move the new one into the group
            const singleEditorPerResource = typeof ((_c = selectedEditor.options) === null || _c === void 0 ? void 0 : _c.singlePerResource) === 'function' ? selectedEditor.options.singlePerResource() : (_d = selectedEditor.options) === null || _d === void 0 ? void 0 : _d.singlePerResource;
            if (singleEditorPerResource) {
                const foundInput = await this.moveExistingEditorForResource(resource, selectedEditor.editorInfo.id, group);
                if (foundInput) {
                    return { editor: foundInput, options };
                }
            }
            // Respect options passed back
            const inputWithOptions = await selectedEditor.createEditorInput(editor, group);
            options = (_e = inputWithOptions.options) !== null && _e !== void 0 ? _e : options;
            const input = inputWithOptions.editor;
            return { editor: input, options };
        }
        /**
         * Moves an editor with the resource and viewtype to target group if one exists
         * Additionally will close any other editors that are open for that resource and viewtype besides the first one found
         * @param resource The resource of the editor
         * @param viewType the viewtype of the editor
         * @param targetGroup The group to move it to
         * @returns An editor input if one exists, else undefined
         */
        async moveExistingEditorForResource(resource, viewType, targetGroup) {
            const editorInfoForResource = this.findExistingEditorsForResource(resource, viewType);
            if (!editorInfoForResource.length) {
                return;
            }
            const editorToUse = editorInfoForResource[0];
            // We should only have one editor but if there are multiple we close the others
            for (const { editor, group } of editorInfoForResource) {
                if (editor !== editorToUse.editor) {
                    const closed = await group.closeEditor(editor);
                    if (!closed) {
                        return;
                    }
                }
            }
            // Move the editor already opened to the target group
            if (targetGroup.id !== editorToUse.group.id) {
                editorToUse.group.moveEditor(editorToUse.editor, targetGroup);
                return editorToUse.editor;
            }
            return;
        }
        /**
         * Given a resource and an editorId, returns all editors open for that resouce and editorId.
         * @param resource The resource specified
         * @param editorId The editorID
         * @returns A list of editors
         */
        findExistingEditorsForResource(resource, editorId) {
            const out = [];
            const orderedGroups = (0, arrays_1.distinct)([
                ...this.editorGroupService.groups,
            ]);
            for (const group of orderedGroups) {
                for (const editor of group.editors) {
                    if ((0, resources_1.isEqual)(editor.resource, resource) && editor.editorId === editorId) {
                        out.push({ editor, group });
                    }
                }
            }
            return out;
        }
        async doHandleConflictingDefaults(resource, editorName, untypedInput, currentEditor, group) {
            const editors = this.findMatchingEditors(resource);
            const storedChoices = JSON.parse(this.storageService.get(EditorResolverService.conflictingDefaultsStorageID, 0 /* StorageScope.GLOBAL */, '{}'));
            const globForResource = `*${(0, resources_1.extname)(resource)}`;
            // Writes to the storage service that a choice has been made for the currently installed editors
            const writeCurrentEditorsToStorage = () => {
                storedChoices[globForResource] = [];
                editors.forEach(editor => storedChoices[globForResource].push(editor.editorInfo.id));
                this.storageService.store(EditorResolverService.conflictingDefaultsStorageID, JSON.stringify(storedChoices), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
            };
            // If the user has already made a choice for this editor we don't want to ask them again
            if (storedChoices[globForResource] && storedChoices[globForResource].find(editorID => editorID === currentEditor.editorId)) {
                return;
            }
            const handle = this.notificationService.prompt(notification_1.Severity.Warning, (0, nls_1.localize)('editorResolver.conflictingDefaults', 'There are multiple default editors available for the resource.'), [{
                    label: (0, nls_1.localize)('editorResolver.configureDefault', 'Configure Default'),
                    run: async () => {
                        var _a;
                        // Show the picker and tell it to update the setting to whatever the user selected
                        const picked = await this.doPickEditor(untypedInput, true);
                        if (!picked) {
                            return;
                        }
                        untypedInput.options = picked;
                        const replacementEditor = await this.resolveEditor(untypedInput, group);
                        if (replacementEditor === 1 /* ResolvedStatus.ABORT */ || replacementEditor === 2 /* ResolvedStatus.NONE */) {
                            return;
                        }
                        // Replace the current editor with the picked one
                        group.replaceEditors([
                            {
                                editor: currentEditor,
                                replacement: replacementEditor.editor,
                                options: (_a = replacementEditor.options) !== null && _a !== void 0 ? _a : picked,
                            }
                        ]);
                    }
                },
                {
                    label: (0, nls_1.localize)('editorResolver.keepDefault', 'Keep {0}', editorName),
                    run: writeCurrentEditorsToStorage
                }]);
            // If the user pressed X we assume they want to keep the current editor as default
            const onCloseListener = handle.onDidClose(() => {
                writeCurrentEditorsToStorage();
                onCloseListener.dispose();
            });
        }
        mapEditorsToQuickPickEntry(resource, showDefaultPicker) {
            var _a, _b, _c;
            const currentEditor = (0, arrays_1.firstOrDefault)(this.editorGroupService.activeGroup.findEditors(resource));
            // If untitled, we want all registered editors
            let registeredEditors = resource.scheme === network_1.Schemas.untitled ? this._registeredEditors.filter(e => e.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.exclusive) : this.findMatchingEditors(resource);
            // We don't want duplicate Id entries
            registeredEditors = (0, arrays_1.distinct)(registeredEditors, c => c.editorInfo.id);
            const defaultSetting = (_a = this.getAssociationsForResource(resource)[0]) === null || _a === void 0 ? void 0 : _a.viewType;
            // Not the most efficient way to do this, but we want to ensure the text editor is at the top of the quickpick
            registeredEditors = registeredEditors.sort((a, b) => {
                if (a.editorInfo.id === editor_2.DEFAULT_EDITOR_ASSOCIATION.id) {
                    return -1;
                }
                else if (b.editorInfo.id === editor_2.DEFAULT_EDITOR_ASSOCIATION.id) {
                    return 1;
                }
                else {
                    return (0, editorResolverService_1.priorityToRank)(b.editorInfo.priority) - (0, editorResolverService_1.priorityToRank)(a.editorInfo.priority);
                }
            });
            const quickPickEntries = [];
            const currentlyActiveLabel = (0, nls_1.localize)('promptOpenWith.currentlyActive', "Active");
            const currentDefaultLabel = (0, nls_1.localize)('promptOpenWith.currentDefault', "Default");
            const currentDefaultAndActiveLabel = (0, nls_1.localize)('promptOpenWith.currentDefaultAndActive', "Active and Default");
            // Default order = setting -> highest priority -> text
            let defaultViewType = defaultSetting;
            if (!defaultViewType && registeredEditors.length > 2 && ((_b = registeredEditors[1]) === null || _b === void 0 ? void 0 : _b.editorInfo.priority) !== editorResolverService_1.RegisteredEditorPriority.option) {
                defaultViewType = (_c = registeredEditors[1]) === null || _c === void 0 ? void 0 : _c.editorInfo.id;
            }
            if (!defaultViewType) {
                defaultViewType = editor_2.DEFAULT_EDITOR_ASSOCIATION.id;
            }
            // Map the editors to quickpick entries
            registeredEditors.forEach(editor => {
                var _a, _b;
                const currentViewType = (_a = currentEditor === null || currentEditor === void 0 ? void 0 : currentEditor.editorId) !== null && _a !== void 0 ? _a : editor_2.DEFAULT_EDITOR_ASSOCIATION.id;
                const isActive = currentEditor ? editor.editorInfo.id === currentViewType : false;
                const isDefault = editor.editorInfo.id === defaultViewType;
                const quickPickEntry = {
                    id: editor.editorInfo.id,
                    label: editor.editorInfo.label,
                    description: isActive && isDefault ? currentDefaultAndActiveLabel : isActive ? currentlyActiveLabel : isDefault ? currentDefaultLabel : undefined,
                    detail: (_b = editor.editorInfo.detail) !== null && _b !== void 0 ? _b : editor.editorInfo.priority,
                };
                quickPickEntries.push(quickPickEntry);
            });
            if (!showDefaultPicker && (0, resources_1.extname)(resource) !== '') {
                const separator = { type: 'separator' };
                quickPickEntries.push(separator);
                const configureDefaultEntry = {
                    id: EditorResolverService.configureDefaultID,
                    label: (0, nls_1.localize)('promptOpenWith.configureDefault', "Configure default editor for '{0}'...", `*${(0, resources_1.extname)(resource)}`),
                };
                quickPickEntries.push(configureDefaultEntry);
            }
            return quickPickEntries;
        }
        async doPickEditor(editor, showDefaultPicker) {
            var _a;
            let resource = editor_2.EditorResourceAccessor.getOriginalUri(editor, { supportSideBySide: editor_2.SideBySideEditor.PRIMARY });
            if (resource === undefined) {
                resource = uri_1.URI.from({ scheme: network_1.Schemas.untitled });
            }
            // Get all the editors for the resource as quickpick entries
            const editorPicks = this.mapEditorsToQuickPickEntry(resource, showDefaultPicker);
            // Create the editor picker
            const editorPicker = this.quickInputService.createQuickPick();
            const placeHolderMessage = showDefaultPicker ?
                (0, nls_1.localize)('prompOpenWith.updateDefaultPlaceHolder', "Select new default editor for '{0}'", `*${(0, resources_1.extname)(resource)}`) :
                (0, nls_1.localize)('promptOpenWith.placeHolder', "Select editor for '{0}'", (0, resources_1.basename)(resource));
            editorPicker.placeholder = placeHolderMessage;
            editorPicker.canAcceptInBackground = true;
            editorPicker.items = editorPicks;
            const firstItem = editorPicker.items.find(item => item.type === 'item');
            if (firstItem) {
                editorPicker.selectedItems = [firstItem];
            }
            // Prompt the user to select an editor
            const picked = await new Promise(resolve => {
                editorPicker.onDidAccept(e => {
                    let result = undefined;
                    if (editorPicker.selectedItems.length === 1) {
                        result = {
                            item: editorPicker.selectedItems[0],
                            keyMods: editorPicker.keyMods,
                            openInBackground: e.inBackground
                        };
                    }
                    // If asked to always update the setting then update it even if the gear isn't clicked
                    if (resource && showDefaultPicker && (result === null || result === void 0 ? void 0 : result.item.id)) {
                        this.updateUserAssociations(`*${(0, resources_1.extname)(resource)}`, result.item.id);
                    }
                    resolve(result);
                });
                editorPicker.onDidHide(() => resolve(undefined));
                editorPicker.onDidTriggerItemButton(e => {
                    // Trigger opening and close picker
                    resolve({ item: e.item, openInBackground: false });
                    // Persist setting
                    if (resource && e.item && e.item.id) {
                        this.updateUserAssociations(`*${(0, resources_1.extname)(resource)}`, e.item.id);
                    }
                });
                editorPicker.show();
            });
            // Close picker
            editorPicker.dispose();
            // If the user picked an editor, look at how the picker was
            // used (e.g. modifier keys, open in background) and create the
            // options and group to use accordingly
            if (picked) {
                // If the user selected to configure default we trigger this picker again and tell it to show the default picker
                if (picked.item.id === EditorResolverService.configureDefaultID) {
                    return this.doPickEditor(editor, true);
                }
                // Figure out options
                const targetOptions = Object.assign(Object.assign({}, editor.options), { override: picked.item.id, preserveFocus: picked.openInBackground || ((_a = editor.options) === null || _a === void 0 ? void 0 : _a.preserveFocus) });
                return targetOptions;
            }
            return undefined;
        }
        sendEditorResolutionTelemetry(chosenInput) {
            if (chosenInput.editorId) {
                this.telemetryService.publicLog2('override.viewType', { viewType: chosenInput.editorId });
            }
        }
        cacheEditors() {
            // Create a set to store glob patterns
            const cacheStorage = new Set();
            // Store just the relative pattern pieces without any path info
            for (const [globPattern, contribPoint] of this._editors) {
                const nonOptional = !!contribPoint.find(c => c.editorInfo.priority !== editorResolverService_1.RegisteredEditorPriority.option && c.editorInfo.id !== editor_2.DEFAULT_EDITOR_ASSOCIATION.id);
                // Don't keep a cache of the optional ones as those wouldn't be opened on start anyways
                if (!nonOptional) {
                    continue;
                }
                if (glob.isRelativePattern(globPattern)) {
                    cacheStorage.add(`${globPattern.pattern}`);
                }
                else {
                    cacheStorage.add(globPattern);
                }
            }
            // Also store the users settings as those would have to activate on startup as well
            const userAssociations = this.getAllUserAssociations();
            for (const association of userAssociations) {
                if (association.filenamePattern) {
                    cacheStorage.add(association.filenamePattern);
                }
            }
            this.storageService.store(EditorResolverService.cacheStorageID, JSON.stringify(Array.from(cacheStorage)), 0 /* StorageScope.GLOBAL */, 1 /* StorageTarget.MACHINE */);
        }
        resourceMatchesCache(resource) {
            if (!this.cache) {
                return false;
            }
            for (const cacheEntry of this.cache) {
                if ((0, editorResolverService_1.globMatchesResource)(cacheEntry, resource)) {
                    return true;
                }
            }
            return false;
        }
    };
    // Constants
    EditorResolverService.configureDefaultID = 'promptOpenWith.configureDefault';
    EditorResolverService.cacheStorageID = 'editorOverrideService.cache';
    EditorResolverService.conflictingDefaultsStorageID = 'editorOverrideService.conflictingDefaults';
    EditorResolverService = __decorate([
        __param(0, editorGroupsService_1.IEditorGroupsService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, configuration_1.IConfigurationService),
        __param(3, quickInput_1.IQuickInputService),
        __param(4, notification_1.INotificationService),
        __param(5, telemetry_1.ITelemetryService),
        __param(6, storage_1.IStorageService),
        __param(7, extensions_2.IExtensionService),
        __param(8, log_1.ILogService)
    ], EditorResolverService);
    exports.EditorResolverService = EditorResolverService;
    (0, extensions_1.registerSingleton)(editorResolverService_1.IEditorResolverService, EditorResolverService);
});
//# sourceMappingURL=editorResolverService.js.map