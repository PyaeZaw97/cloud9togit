/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/codicons", "vs/nls", "vs/platform/theme/common/iconRegistry"], function (require, exports, codicons_1, nls_1, iconRegistry_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.searchNewEditorIcon = exports.searchViewIcon = exports.searchStopIcon = exports.searchClearIcon = exports.searchExpandAllIcon = exports.searchCollapseAllIcon = exports.searchRefreshIcon = exports.searchRemoveIcon = exports.searchReplaceIcon = exports.searchReplaceAllIcon = exports.searchShowReplaceIcon = exports.searchHideReplaceIcon = exports.searchShowContextIcon = exports.searchDetailsIcon = void 0;
    exports.searchDetailsIcon = (0, iconRegistry_1.registerIcon)('search-details', codicons_1.Codicon.ellipsis, (0, nls_1.localize)('searchDetailsIcon', 'Icon to make search details visible.'));
    exports.searchShowContextIcon = (0, iconRegistry_1.registerIcon)('search-show-context', codicons_1.Codicon.listSelection, (0, nls_1.localize)('searchShowContextIcon', 'Icon for toggle the context in the search editor.'));
    exports.searchHideReplaceIcon = (0, iconRegistry_1.registerIcon)('search-hide-replace', codicons_1.Codicon.chevronRight, (0, nls_1.localize)('searchHideReplaceIcon', 'Icon to collapse the replace section in the search view.'));
    exports.searchShowReplaceIcon = (0, iconRegistry_1.registerIcon)('search-show-replace', codicons_1.Codicon.chevronDown, (0, nls_1.localize)('searchShowReplaceIcon', 'Icon to expand the replace section in the search view.'));
    exports.searchReplaceAllIcon = (0, iconRegistry_1.registerIcon)('search-replace-all', codicons_1.Codicon.replaceAll, (0, nls_1.localize)('searchReplaceAllIcon', 'Icon for replace all in the search view.'));
    exports.searchReplaceIcon = (0, iconRegistry_1.registerIcon)('search-replace', codicons_1.Codicon.replace, (0, nls_1.localize)('searchReplaceIcon', 'Icon for replace in the search view.'));
    exports.searchRemoveIcon = (0, iconRegistry_1.registerIcon)('search-remove', codicons_1.Codicon.close, (0, nls_1.localize)('searchRemoveIcon', 'Icon to remove a search result.'));
    exports.searchRefreshIcon = (0, iconRegistry_1.registerIcon)('search-refresh', codicons_1.Codicon.refresh, (0, nls_1.localize)('searchRefreshIcon', 'Icon for refresh in the search view.'));
    exports.searchCollapseAllIcon = (0, iconRegistry_1.registerIcon)('search-collapse-results', codicons_1.Codicon.collapseAll, (0, nls_1.localize)('searchCollapseAllIcon', 'Icon for collapse results in the search view.'));
    exports.searchExpandAllIcon = (0, iconRegistry_1.registerIcon)('search-expand-results', codicons_1.Codicon.expandAll, (0, nls_1.localize)('searchExpandAllIcon', 'Icon for expand results in the search view.'));
    exports.searchClearIcon = (0, iconRegistry_1.registerIcon)('search-clear-results', codicons_1.Codicon.clearAll, (0, nls_1.localize)('searchClearIcon', 'Icon for clear results in the search view.'));
    exports.searchStopIcon = (0, iconRegistry_1.registerIcon)('search-stop', codicons_1.Codicon.searchStop, (0, nls_1.localize)('searchStopIcon', 'Icon for stop in the search view.'));
    exports.searchViewIcon = (0, iconRegistry_1.registerIcon)('search-view-icon', codicons_1.Codicon.search, (0, nls_1.localize)('searchViewIcon', 'View icon of the search view.'));
    exports.searchNewEditorIcon = (0, iconRegistry_1.registerIcon)('search-new-editor', codicons_1.Codicon.newFile, (0, nls_1.localize)('searchNewEditorIcon', 'Icon for the action to open a new search editor.'));
});
//# sourceMappingURL=searchIcons.js.map