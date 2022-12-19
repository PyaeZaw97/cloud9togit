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
define(["require", "exports", "vs/base/common/resources", "vs/base/common/uri", "vs/editor/contrib/find/browser/findModel", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/commands/common/commands", "vs/platform/contextkey/common/contextkey", "vs/platform/instantiation/common/descriptors", "vs/platform/instantiation/common/instantiation", "vs/platform/registry/common/platform", "vs/platform/telemetry/common/telemetry", "vs/workbench/browser/editor", "vs/workbench/common/contributions", "vs/workbench/common/editor", "vs/workbench/common/contextkeys", "vs/workbench/common/views", "vs/workbench/contrib/search/browser/searchActions", "vs/workbench/contrib/search/browser/searchIcons", "vs/workbench/contrib/search/common/constants", "vs/workbench/contrib/searchEditor/browser/constants", "vs/workbench/contrib/searchEditor/browser/searchEditor", "vs/workbench/contrib/searchEditor/browser/searchEditorActions", "vs/workbench/contrib/searchEditor/browser/searchEditorInput", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/search/common/search", "vs/workbench/services/editor/common/editorResolverService", "vs/workbench/services/workingCopy/common/workingCopyEditorService", "vs/base/common/lifecycle"], function (require, exports, resources_1, uri_1, findModel_1, nls_1, actions_1, commands_1, contextkey_1, descriptors_1, instantiation_1, platform_1, telemetry_1, editor_1, contributions_1, editor_2, contextkeys_1, views_1, searchActions_1, searchIcons_1, SearchConstants, SearchEditorConstants, searchEditor_1, searchEditorActions_1, searchEditorInput_1, editorService_1, search_1, editorResolverService_1, workingCopyEditorService_1, lifecycle_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const OpenInEditorCommandId = 'search.action.openInEditor';
    const OpenNewEditorToSideCommandId = 'search.action.openNewEditorToSide';
    const FocusQueryEditorWidgetCommandId = 'search.action.focusQueryEditorWidget';
    const ToggleSearchEditorCaseSensitiveCommandId = 'toggleSearchEditorCaseSensitive';
    const ToggleSearchEditorWholeWordCommandId = 'toggleSearchEditorWholeWord';
    const ToggleSearchEditorRegexCommandId = 'toggleSearchEditorRegex';
    const IncreaseSearchEditorContextLinesCommandId = 'increaseSearchEditorContextLines';
    const DecreaseSearchEditorContextLinesCommandId = 'decreaseSearchEditorContextLines';
    const RerunSearchEditorSearchCommandId = 'rerunSearchEditorSearch';
    const CleanSearchEditorStateCommandId = 'cleanSearchEditorState';
    const SelectAllSearchEditorMatchesCommandId = 'selectAllSearchEditorMatches';
    //#region Editor Descriptior
    platform_1.Registry.as(editor_2.EditorExtensions.EditorPane).registerEditorPane(editor_1.EditorPaneDescriptor.create(searchEditor_1.SearchEditor, searchEditor_1.SearchEditor.ID, (0, nls_1.localize)('searchEditor', "Search Editor")), [
        new descriptors_1.SyncDescriptor(searchEditorInput_1.SearchEditorInput)
    ]);
    //#endregion
    //#region Startup Contribution
    let SearchEditorContribution = class SearchEditorContribution {
        constructor(editorResolverService, instantiationService, telemetryService, contextKeyService) {
            this.editorResolverService = editorResolverService;
            this.instantiationService = instantiationService;
            this.telemetryService = telemetryService;
            this.contextKeyService = contextKeyService;
            this.editorResolverService.registerEditor('*' + searchEditorInput_1.SEARCH_EDITOR_EXT, {
                id: searchEditorInput_1.SearchEditorInput.ID,
                label: (0, nls_1.localize)('promptOpenWith.searchEditor.displayName', "Search Editor"),
                detail: editor_2.DEFAULT_EDITOR_ASSOCIATION.providerDisplayName,
                priority: editorResolverService_1.RegisteredEditorPriority.default,
            }, {
                singlePerResource: true,
                canHandleDiff: false,
                canSupportResource: resource => ((0, resources_1.extname)(resource) === searchEditorInput_1.SEARCH_EDITOR_EXT)
            }, ({ resource }) => {
                return { editor: instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { from: 'existingFile', fileUri: resource }) };
            });
        }
    };
    SearchEditorContribution = __decorate([
        __param(0, editorResolverService_1.IEditorResolverService),
        __param(1, instantiation_1.IInstantiationService),
        __param(2, telemetry_1.ITelemetryService),
        __param(3, contextkey_1.IContextKeyService)
    ], SearchEditorContribution);
    const workbenchContributionsRegistry = platform_1.Registry.as(contributions_1.Extensions.Workbench);
    workbenchContributionsRegistry.registerWorkbenchContribution(SearchEditorContribution, 1 /* LifecyclePhase.Starting */);
    class SearchEditorInputSerializer {
        canSerialize(input) {
            return !!input.tryReadConfigSync();
        }
        serialize(input) {
            var _a;
            if (input.isDisposed()) {
                return JSON.stringify({ modelUri: undefined, dirty: false, config: input.tryReadConfigSync(), name: input.getName(), matchRanges: [], backingUri: (_a = input.backingUri) === null || _a === void 0 ? void 0 : _a.toString() });
            }
            let modelUri = undefined;
            if (input.modelUri.path || input.modelUri.fragment && input.isDirty()) {
                modelUri = input.modelUri.toString();
            }
            const config = input.tryReadConfigSync();
            const dirty = input.isDirty();
            const matchRanges = dirty ? input.getMatchRanges() : [];
            const backingUri = input.backingUri;
            return JSON.stringify({ modelUri, dirty, config, name: input.getName(), matchRanges, backingUri: backingUri === null || backingUri === void 0 ? void 0 : backingUri.toString() });
        }
        deserialize(instantiationService, serializedEditorInput) {
            const { modelUri, dirty, config, matchRanges, backingUri } = JSON.parse(serializedEditorInput);
            if (config && (config.query !== undefined)) {
                if (modelUri) {
                    const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { from: 'model', modelUri: uri_1.URI.parse(modelUri), config, backupOf: backingUri ? uri_1.URI.parse(backingUri) : undefined });
                    input.setDirty(dirty);
                    input.setMatchRanges(matchRanges);
                    return input;
                }
                else {
                    if (backingUri) {
                        return instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { from: 'existingFile', fileUri: uri_1.URI.parse(backingUri) });
                    }
                    else {
                        return instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { from: 'rawData', resultsContents: '', config });
                    }
                }
            }
            return undefined;
        }
    }
    platform_1.Registry.as(editor_2.EditorExtensions.EditorFactory).registerEditorSerializer(searchEditorInput_1.SearchEditorInput.ID, SearchEditorInputSerializer);
    //#endregion
    //#region Commands
    commands_1.CommandsRegistry.registerCommand(CleanSearchEditorStateCommandId, (accessor) => {
        const activeEditorPane = accessor.get(editorService_1.IEditorService).activeEditorPane;
        if (activeEditorPane instanceof searchEditor_1.SearchEditor) {
            activeEditorPane.cleanState();
        }
    });
    //#endregion
    //#region Actions
    const category = { value: (0, nls_1.localize)('search', "Search Editor"), original: 'Search Editor' };
    const translateLegacyConfig = (legacyConfig = {}) => {
        const config = {};
        const overrides = {
            includes: 'filesToInclude',
            excludes: 'filesToExclude',
            wholeWord: 'matchWholeWord',
            caseSensitive: 'isCaseSensitive',
            regexp: 'isRegexp',
            useIgnores: 'useExcludeSettingsAndIgnoreFiles',
        };
        Object.entries(legacyConfig).forEach(([key, value]) => {
            var _a;
            config[(_a = overrides[key]) !== null && _a !== void 0 ? _a : key] = value;
        });
        return config;
    };
    const openArgDescription = {
        description: 'Open a new search editor. Arguments passed can include variables like ${relativeFileDirname}.',
        args: [{
                name: 'Open new Search Editor args',
                schema: {
                    properties: {
                        query: { type: 'string' },
                        filesToInclude: { type: 'string' },
                        filesToExclude: { type: 'string' },
                        contextLines: { type: 'number' },
                        matchWholeWord: { type: 'boolean' },
                        isCaseSensitive: { type: 'boolean' },
                        isRegexp: { type: 'boolean' },
                        useExcludeSettingsAndIgnoreFiles: { type: 'boolean' },
                        showIncludesExcludes: { type: 'boolean' },
                        triggerSearch: { type: 'boolean' },
                        focusResults: { type: 'boolean' },
                        onlyOpenEditors: { type: 'boolean' },
                    }
                }
            }]
    };
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: 'search.searchEditor.action.deleteFileResults',
                title: { value: (0, nls_1.localize)('searchEditor.deleteResultBlock', "Delete File Results"), original: 'Delete File Results' },
                keybinding: {
                    weight: 100 /* KeybindingWeight.EditorContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 1 /* KeyCode.Backspace */,
                },
                precondition: SearchEditorConstants.InSearchEditor,
                category,
                f1: true,
            });
        }
        async run(accessor) {
            const contextService = accessor.get(contextkey_1.IContextKeyService).getContext(document.activeElement);
            if (contextService.getValue(SearchEditorConstants.InSearchEditor.serialize())) {
                accessor.get(editorService_1.IEditorService).activeEditorPane.deleteResultBlock();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SearchEditorConstants.OpenNewEditorCommandId,
                title: { value: (0, nls_1.localize)('search.openNewSearchEditor', "New Search Editor"), original: 'New Search Editor' },
                category,
                f1: true,
                description: openArgDescription
            });
        }
        async run(accessor, args) {
            await accessor.get(instantiation_1.IInstantiationService).invokeFunction(searchEditorActions_1.openNewSearchEditor, translateLegacyConfig(Object.assign({ location: 'new' }, args)));
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SearchEditorConstants.OpenEditorCommandId,
                title: { value: (0, nls_1.localize)('search.openSearchEditor', "Open Search Editor"), original: 'Open Search Editor' },
                category,
                f1: true,
                description: openArgDescription
            });
        }
        async run(accessor, args) {
            await accessor.get(instantiation_1.IInstantiationService).invokeFunction(searchEditorActions_1.openNewSearchEditor, translateLegacyConfig(Object.assign({ location: 'reuse' }, args)));
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenNewEditorToSideCommandId,
                title: { value: (0, nls_1.localize)('search.openNewEditorToSide', "Open new Search Editor to the Side"), original: 'Open new Search Editor to the Side' },
                category,
                f1: true,
                description: openArgDescription
            });
        }
        async run(accessor, args) {
            await accessor.get(instantiation_1.IInstantiationService).invokeFunction(searchEditorActions_1.openNewSearchEditor, translateLegacyConfig(args), true);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: OpenInEditorCommandId,
                title: { value: (0, nls_1.localize)('search.openResultsInEditor', "Open Results in Editor"), original: 'Open Results in Editor' },
                category,
                f1: true,
                keybinding: {
                    primary: 512 /* KeyMod.Alt */ | 3 /* KeyCode.Enter */,
                    when: contextkey_1.ContextKeyExpr.and(SearchConstants.HasSearchResults, SearchConstants.SearchViewFocusedKey),
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    mac: {
                        primary: 2048 /* KeyMod.CtrlCmd */ | 3 /* KeyCode.Enter */
                    }
                },
            });
        }
        async run(accessor) {
            const viewsService = accessor.get(views_1.IViewsService);
            const instantiationService = accessor.get(instantiation_1.IInstantiationService);
            const searchView = (0, searchActions_1.getSearchView)(viewsService);
            if (searchView) {
                await instantiationService.invokeFunction(searchEditorActions_1.createEditorFromSearchResult, searchView.searchResult, searchView.searchIncludePattern.getValue(), searchView.searchExcludePattern.getValue(), searchView.searchIncludePattern.onlySearchInOpenEditors());
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: RerunSearchEditorSearchCommandId,
                title: { value: (0, nls_1.localize)('search.rerunSearchInEditor', "Search Again"), original: 'Search Again' },
                category,
                keybinding: {
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 48 /* KeyCode.KeyR */,
                    when: SearchEditorConstants.InSearchEditor,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                },
                icon: searchIcons_1.searchRefreshIcon,
                menu: [{
                        id: actions_1.MenuId.EditorTitle,
                        group: 'navigation',
                        when: contextkeys_1.ActiveEditorContext.isEqualTo(SearchEditorConstants.SearchEditorID)
                    },
                    {
                        id: actions_1.MenuId.CommandPalette,
                        when: contextkeys_1.ActiveEditorContext.isEqualTo(SearchEditorConstants.SearchEditorID)
                    }]
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const input = editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                editorService.activeEditorPane.triggerSearch({ resetCursor: false });
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: FocusQueryEditorWidgetCommandId,
                title: { value: (0, nls_1.localize)('search.action.focusQueryEditorWidget', "Focus Search Editor Input"), original: 'Focus Search Editor Input' },
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: {
                    primary: 9 /* KeyCode.Escape */,
                    weight: 100 /* KeybindingWeight.EditorContrib */
                }
            });
        }
        async run(accessor) {
            const editorService = accessor.get(editorService_1.IEditorService);
            const input = editorService.activeEditor;
            if (input instanceof searchEditorInput_1.SearchEditorInput) {
                editorService.activeEditorPane.focusSearchInput();
            }
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleSearchEditorCaseSensitiveCommandId,
                title: { value: (0, nls_1.localize)('searchEditor.action.toggleSearchEditorCaseSensitive', "Toggle Match Case"), original: 'Toggle Match Case' },
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: SearchConstants.SearchInputBoxFocusedKey,
                }, findModel_1.ToggleCaseSensitiveKeybinding)
            });
        }
        run(accessor) {
            (0, searchEditorActions_1.toggleSearchEditorCaseSensitiveCommand)(accessor);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleSearchEditorWholeWordCommandId,
                title: { value: (0, nls_1.localize)('searchEditor.action.toggleSearchEditorWholeWord', "Toggle Match Whole Word"), original: 'Toggle Match Whole Word' },
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: SearchConstants.SearchInputBoxFocusedKey,
                }, findModel_1.ToggleWholeWordKeybinding)
            });
        }
        run(accessor) {
            (0, searchEditorActions_1.toggleSearchEditorWholeWordCommand)(accessor);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleSearchEditorRegexCommandId,
                title: { value: (0, nls_1.localize)('searchEditor.action.toggleSearchEditorRegex', "Toggle Use Regular Expression"), original: 'Toggle Use Regular Expression"' },
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: Object.assign({
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    when: SearchConstants.SearchInputBoxFocusedKey,
                }, findModel_1.ToggleRegexKeybinding)
            });
        }
        run(accessor) {
            (0, searchEditorActions_1.toggleSearchEditorRegexCommand)(accessor);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SearchEditorConstants.ToggleSearchEditorContextLinesCommandId,
                title: { value: (0, nls_1.localize)('searchEditor.action.toggleSearchEditorContextLines', "Toggle Context Lines"), original: 'Toggle Context Lines"' },
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 512 /* KeyMod.Alt */ | 42 /* KeyCode.KeyL */,
                    mac: { primary: 2048 /* KeyMod.CtrlCmd */ | 512 /* KeyMod.Alt */ | 42 /* KeyCode.KeyL */ }
                }
            });
        }
        run(accessor) {
            (0, searchEditorActions_1.toggleSearchEditorContextLinesCommand)(accessor);
        }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: IncreaseSearchEditorContextLinesCommandId,
                title: { original: 'Increase Context Lines', value: (0, nls_1.localize)('searchEditor.action.increaseSearchEditorContextLines', "Increase Context Lines") },
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 512 /* KeyMod.Alt */ | 81 /* KeyCode.Equal */
                }
            });
        }
        run(accessor) { (0, searchEditorActions_1.modifySearchEditorContextLinesCommand)(accessor, true); }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: DecreaseSearchEditorContextLinesCommandId,
                title: { original: 'Decrease Context Lines', value: (0, nls_1.localize)('searchEditor.action.decreaseSearchEditorContextLines', "Decrease Context Lines") },
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 512 /* KeyMod.Alt */ | 83 /* KeyCode.Minus */
                }
            });
        }
        run(accessor) { (0, searchEditorActions_1.modifySearchEditorContextLinesCommand)(accessor, false); }
    });
    (0, actions_1.registerAction2)(class extends actions_1.Action2 {
        constructor() {
            super({
                id: SelectAllSearchEditorMatchesCommandId,
                title: { original: 'Select All Matches', value: (0, nls_1.localize)('searchEditor.action.selectAllSearchEditorMatches', "Select All Matches") },
                category,
                f1: true,
                precondition: SearchEditorConstants.InSearchEditor,
                keybinding: {
                    weight: 200 /* KeybindingWeight.WorkbenchContrib */,
                    primary: 2048 /* KeyMod.CtrlCmd */ | 1024 /* KeyMod.Shift */ | 42 /* KeyCode.KeyL */,
                }
            });
        }
        run(accessor) {
            (0, searchEditorActions_1.selectAllSearchEditorMatchesCommand)(accessor);
        }
    });
    (0, actions_1.registerAction2)(class OpenSearchEditorAction extends actions_1.Action2 {
        constructor() {
            super({
                id: 'search.action.openNewEditorFromView',
                title: (0, nls_1.localize)('search.openNewEditor', "Open New Search Editor"),
                category,
                icon: searchIcons_1.searchNewEditorIcon,
                menu: [{
                        id: actions_1.MenuId.ViewTitle,
                        group: 'navigation',
                        order: 2,
                        when: contextkey_1.ContextKeyExpr.equals('view', search_1.VIEW_ID),
                    }]
            });
        }
        run(accessor, ...args) {
            return (0, searchEditorActions_1.openSearchEditor)(accessor);
        }
    });
    //#endregion
    //#region Search Editor Working Copy Editor Handler
    let SearchEditorWorkingCopyEditorHandler = class SearchEditorWorkingCopyEditorHandler extends lifecycle_1.Disposable {
        constructor(instantiationService, workingCopyEditorService) {
            super();
            this.instantiationService = instantiationService;
            this.workingCopyEditorService = workingCopyEditorService;
            this.installHandler();
        }
        installHandler() {
            this._register(this.workingCopyEditorService.registerHandler({
                handles: workingCopy => workingCopy.resource.scheme === SearchEditorConstants.SearchEditorScheme,
                isOpen: (workingCopy, editor) => editor instanceof searchEditorInput_1.SearchEditorInput && (0, resources_1.isEqual)(workingCopy.resource, editor.modelUri),
                createEditor: workingCopy => {
                    const input = this.instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { from: 'model', modelUri: workingCopy.resource });
                    input.setDirty(true);
                    return input;
                }
            }));
        }
    };
    SearchEditorWorkingCopyEditorHandler = __decorate([
        __param(0, instantiation_1.IInstantiationService),
        __param(1, workingCopyEditorService_1.IWorkingCopyEditorService)
    ], SearchEditorWorkingCopyEditorHandler);
    workbenchContributionsRegistry.registerWorkbenchContribution(SearchEditorWorkingCopyEditorHandler, 2 /* LifecyclePhase.Ready */);
});
//#endregion
//# sourceMappingURL=searchEditor.contribution.js.map