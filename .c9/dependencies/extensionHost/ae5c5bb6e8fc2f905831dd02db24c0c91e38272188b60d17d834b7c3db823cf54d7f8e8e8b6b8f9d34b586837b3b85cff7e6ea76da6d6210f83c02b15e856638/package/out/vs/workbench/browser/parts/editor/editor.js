/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/browser/dom", "vs/base/common/types"], function (require, exports, dom_1, types_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fillActiveEditorViewState = exports.getEditorPartOptions = exports.impactsEditorPartOptions = exports.DEFAULT_EDITOR_PART_OPTIONS = exports.DEFAULT_EDITOR_MAX_DIMENSIONS = exports.DEFAULT_EDITOR_MIN_DIMENSIONS = void 0;
    exports.DEFAULT_EDITOR_MIN_DIMENSIONS = new dom_1.Dimension(220, 70);
    exports.DEFAULT_EDITOR_MAX_DIMENSIONS = new dom_1.Dimension(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    exports.DEFAULT_EDITOR_PART_OPTIONS = {
        showTabs: true,
        highlightModifiedTabs: false,
        tabCloseButton: 'right',
        tabSizing: 'fit',
        pinnedTabSizing: 'normal',
        titleScrollbarSizing: 'default',
        focusRecentEditorAfterClose: true,
        showIcons: true,
        hasIcons: true,
        enablePreview: true,
        openPositioning: 'right',
        openSideBySideDirection: 'right',
        closeEmptyGroups: true,
        labelFormat: 'default',
        splitSizing: 'distribute',
        splitOnDragAndDrop: true
    };
    function impactsEditorPartOptions(event) {
        return event.affectsConfiguration('workbench.editor') || event.affectsConfiguration('workbench.iconTheme');
    }
    exports.impactsEditorPartOptions = impactsEditorPartOptions;
    function getEditorPartOptions(configurationService, themeService) {
        var _a;
        const options = Object.assign(Object.assign({}, exports.DEFAULT_EDITOR_PART_OPTIONS), { hasIcons: themeService.getFileIconTheme().hasFileIcons });
        const config = configurationService.getValue();
        if ((_a = config === null || config === void 0 ? void 0 : config.workbench) === null || _a === void 0 ? void 0 : _a.editor) {
            // Assign all primitive configuration over
            Object.assign(options, config.workbench.editor);
            // Special handle array types and convert to Set
            if ((0, types_1.isObject)(config.workbench.editor.autoLockGroups)) {
                options.autoLockGroups = new Set();
                for (const [editorId, enablement] of Object.entries(config.workbench.editor.autoLockGroups)) {
                    if (enablement === true) {
                        options.autoLockGroups.add(editorId);
                    }
                }
            }
            else {
                options.autoLockGroups = undefined;
            }
        }
        return options;
    }
    exports.getEditorPartOptions = getEditorPartOptions;
    function fillActiveEditorViewState(group, expectedActiveEditor, presetOptions) {
        var _a;
        if (!expectedActiveEditor || !group.activeEditor || expectedActiveEditor.matches(group.activeEditor)) {
            const options = Object.assign(Object.assign({}, presetOptions), { viewState: (_a = group.activeEditorPane) === null || _a === void 0 ? void 0 : _a.getViewState() });
            return options;
        }
        return presetOptions || Object.create(null);
    }
    exports.fillActiveEditorViewState = fillActiveEditorViewState;
});
//# sourceMappingURL=editor.js.map