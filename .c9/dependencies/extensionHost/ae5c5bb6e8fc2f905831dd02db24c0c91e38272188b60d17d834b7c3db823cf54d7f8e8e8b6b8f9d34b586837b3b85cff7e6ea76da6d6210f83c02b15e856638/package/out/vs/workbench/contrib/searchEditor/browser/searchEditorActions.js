/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/network", "vs/base/common/types", "vs/editor/browser/editorBrowser", "vs/platform/configuration/common/configuration", "vs/platform/editor/common/editor", "vs/platform/instantiation/common/instantiation", "vs/platform/label/common/label", "vs/platform/telemetry/common/telemetry", "vs/platform/workspace/common/workspace", "vs/workbench/common/views", "vs/workbench/contrib/search/browser/searchActions", "vs/workbench/contrib/searchEditor/browser/searchEditorInput", "vs/workbench/contrib/searchEditor/browser/searchEditorSerialization", "vs/workbench/services/configurationResolver/common/configurationResolver", "vs/workbench/services/editor/common/editorService", "vs/workbench/services/history/common/history", "vs/css!./media/searchEditor"], function (require, exports, network_1, types_1, editorBrowser_1, configuration_1, editor_1, instantiation_1, label_1, telemetry_1, workspace_1, views_1, searchActions_1, searchEditorInput_1, searchEditorSerialization_1, configurationResolver_1, editorService_1, history_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createEditorFromSearchResult = exports.openNewSearchEditor = exports.openSearchEditor = exports.selectAllSearchEditorMatchesCommand = exports.modifySearchEditorContextLinesCommand = exports.toggleSearchEditorContextLinesCommand = exports.toggleSearchEditorRegexCommand = exports.toggleSearchEditorWholeWordCommand = exports.toggleSearchEditorCaseSensitiveCommand = void 0;
    const toggleSearchEditorCaseSensitiveCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleCaseSensitive();
        }
    };
    exports.toggleSearchEditorCaseSensitiveCommand = toggleSearchEditorCaseSensitiveCommand;
    const toggleSearchEditorWholeWordCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleWholeWords();
        }
    };
    exports.toggleSearchEditorWholeWordCommand = toggleSearchEditorWholeWordCommand;
    const toggleSearchEditorRegexCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleRegex();
        }
    };
    exports.toggleSearchEditorRegexCommand = toggleSearchEditorRegexCommand;
    const toggleSearchEditorContextLinesCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.toggleContextLines();
        }
    };
    exports.toggleSearchEditorContextLinesCommand = toggleSearchEditorContextLinesCommand;
    const modifySearchEditorContextLinesCommand = (accessor, increase) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.modifyContextLines(increase);
        }
    };
    exports.modifySearchEditorContextLinesCommand = modifySearchEditorContextLinesCommand;
    const selectAllSearchEditorMatchesCommand = (accessor) => {
        const editorService = accessor.get(editorService_1.IEditorService);
        const input = editorService.activeEditor;
        if (input instanceof searchEditorInput_1.SearchEditorInput) {
            editorService.activeEditorPane.focusAllResults();
        }
    };
    exports.selectAllSearchEditorMatchesCommand = selectAllSearchEditorMatchesCommand;
    async function openSearchEditor(accessor) {
        const viewsService = accessor.get(views_1.IViewsService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const searchView = (0, searchActions_1.getSearchView)(viewsService);
        if (searchView) {
            await instantiationService.invokeFunction(exports.openNewSearchEditor, {
                filesToInclude: searchView.searchIncludePattern.getValue(),
                onlyOpenEditors: searchView.searchIncludePattern.onlySearchInOpenEditors(),
                filesToExclude: searchView.searchExcludePattern.getValue(),
                isRegexp: searchView.searchAndReplaceWidget.searchInput.getRegex(),
                isCaseSensitive: searchView.searchAndReplaceWidget.searchInput.getCaseSensitive(),
                matchWholeWord: searchView.searchAndReplaceWidget.searchInput.getWholeWords(),
                useExcludeSettingsAndIgnoreFiles: searchView.searchExcludePattern.useExcludesAndIgnoreFiles(),
                showIncludesExcludes: !!(searchView.searchIncludePattern.getValue() || searchView.searchExcludePattern.getValue() || !searchView.searchExcludePattern.useExcludesAndIgnoreFiles())
            });
        }
        else {
            await instantiationService.invokeFunction(exports.openNewSearchEditor);
        }
    }
    exports.openSearchEditor = openSearchEditor;
    const openNewSearchEditor = async (accessor, _args = {}, toSide = false) => {
        var _a, _b, _c;
        const editorService = accessor.get(editorService_1.IEditorService);
        const telemetryService = accessor.get(telemetry_1.ITelemetryService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const configurationResolverService = accessor.get(configurationResolver_1.IConfigurationResolverService);
        const workspaceContextService = accessor.get(workspace_1.IWorkspaceContextService);
        const historyService = accessor.get(history_1.IHistoryService);
        const activeWorkspaceRootUri = historyService.getLastActiveWorkspaceRoot(network_1.Schemas.file);
        const lastActiveWorkspaceRoot = activeWorkspaceRootUri ? (0, types_1.withNullAsUndefined)(workspaceContextService.getWorkspaceFolder(activeWorkspaceRootUri)) : undefined;
        const activeEditorControl = editorService.activeTextEditorControl;
        let activeModel;
        let selected = '';
        if (activeEditorControl) {
            if ((0, editorBrowser_1.isDiffEditor)(activeEditorControl)) {
                if (activeEditorControl.getOriginalEditor().hasTextFocus()) {
                    activeModel = activeEditorControl.getOriginalEditor();
                }
                else {
                    activeModel = activeEditorControl.getModifiedEditor();
                }
            }
            else {
                activeModel = activeEditorControl;
            }
            const selection = activeModel === null || activeModel === void 0 ? void 0 : activeModel.getSelection();
            selected = (_b = (selection && ((_a = activeModel === null || activeModel === void 0 ? void 0 : activeModel.getModel()) === null || _a === void 0 ? void 0 : _a.getValueInRange(selection)))) !== null && _b !== void 0 ? _b : '';
            if ((selection === null || selection === void 0 ? void 0 : selection.isEmpty()) && configurationService.getValue('search').seedWithNearestWord) {
                const wordAtPosition = (_c = activeModel.getModel()) === null || _c === void 0 ? void 0 : _c.getWordAtPosition(selection.getStartPosition());
                if (wordAtPosition) {
                    selected = wordAtPosition.word;
                }
            }
        }
        else {
            if (editorService.activeEditor instanceof searchEditorInput_1.SearchEditorInput) {
                const active = editorService.activeEditorPane;
                selected = active.getSelected();
            }
        }
        telemetryService.publicLog2('searchEditor/openNewSearchEditor');
        const seedSearchStringFromSelection = _args.location === 'new' || configurationService.getValue('editor').find.seedSearchStringFromSelection;
        const args = { query: seedSearchStringFromSelection ? selected : undefined };
        for (const entry of Object.entries(_args)) {
            const name = entry[0];
            const value = entry[1];
            if (value !== undefined) {
                args[name] = (typeof value === 'string') ? await configurationResolverService.resolveAsync(lastActiveWorkspaceRoot, value) : value;
            }
        }
        const existing = editorService.getEditors(0 /* EditorsOrder.MOST_RECENTLY_ACTIVE */).find(id => id.editor.typeId === searchEditorInput_1.SearchEditorInput.ID);
        let editor;
        if (existing && args.location === 'reuse') {
            const input = existing.editor;
            editor = (await editorService.openEditor(input, { override: editor_1.EditorResolution.DISABLED }, existing.groupId));
            if (selected) {
                editor.setQuery(selected);
            }
            else {
                editor.selectQuery();
            }
            editor.setSearchConfig(args);
        }
        else {
            const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { config: args, resultsContents: '', from: 'rawData' });
            editor = await editorService.openEditor(input, { pinned: true }, toSide ? editorService_1.SIDE_GROUP : editorService_1.ACTIVE_GROUP);
        }
        const searchOnType = configurationService.getValue('search').searchOnType;
        if (args.triggerSearch === true ||
            args.triggerSearch !== false && searchOnType && args.query) {
            editor.triggerSearch({ focusResults: args.focusResults });
        }
        if (!args.focusResults) {
            editor.focusSearchInput();
        }
    };
    exports.openNewSearchEditor = openNewSearchEditor;
    const createEditorFromSearchResult = async (accessor, searchResult, rawIncludePattern, rawExcludePattern, onlySearchInOpenEditors) => {
        if (!searchResult.query) {
            console.error('Expected searchResult.query to be defined. Got', searchResult);
            return;
        }
        const editorService = accessor.get(editorService_1.IEditorService);
        const telemetryService = accessor.get(telemetry_1.ITelemetryService);
        const instantiationService = accessor.get(instantiation_1.IInstantiationService);
        const labelService = accessor.get(label_1.ILabelService);
        const configurationService = accessor.get(configuration_1.IConfigurationService);
        const sortOrder = configurationService.getValue('search').sortOrder;
        telemetryService.publicLog2('searchEditor/createEditorFromSearchResult');
        const labelFormatter = (uri) => labelService.getUriLabel(uri, { relative: true });
        const { text, matchRanges, config } = (0, searchEditorSerialization_1.serializeSearchResultForEditor)(searchResult, rawIncludePattern, rawExcludePattern, 0, labelFormatter, sortOrder);
        config.onlyOpenEditors = onlySearchInOpenEditors;
        const contextLines = configurationService.getValue('search').searchEditor.defaultNumberOfContextLines;
        if (searchResult.isDirty || contextLines === 0 || contextLines === null) {
            const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { resultsContents: text, config, from: 'rawData' });
            await editorService.openEditor(input, { pinned: true });
            input.setMatchRanges(matchRanges);
        }
        else {
            const input = instantiationService.invokeFunction(searchEditorInput_1.getOrMakeSearchEditorInput, { from: 'rawData', resultsContents: '', config: Object.assign(Object.assign({}, config), { contextLines }) });
            const editor = await editorService.openEditor(input, { pinned: true });
            editor.triggerSearch({ focusResults: true });
        }
    };
    exports.createEditorFromSearchResult = createEditorFromSearchResult;
});
//# sourceMappingURL=searchEditorActions.js.map