/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/workbench/contrib/notebook/browser/controller/coreActions", "vs/workbench/contrib/notebook/common/notebookCommon"], function (require, exports, nls_1, actions_1, configuration_1, coreActions_1, notebookCommon_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleCellToolbarPositionAction = void 0;
    const TOGGLE_CELL_TOOLBAR_POSITION = 'notebook.toggleCellToolbarPosition';
    class ToggleCellToolbarPositionAction extends actions_1.Action2 {
        constructor() {
            super({
                id: TOGGLE_CELL_TOOLBAR_POSITION,
                title: { value: (0, nls_1.localize)('notebook.toggleCellToolbarPosition', "Toggle Cell Toolbar Position"), original: 'Toggle Cell Toolbar Position' },
                menu: [{
                        id: actions_1.MenuId.NotebookCellTitle,
                        group: 'View',
                        order: 1
                    }],
                category: coreActions_1.NOTEBOOK_ACTIONS_CATEGORY,
                f1: false
            });
        }
        async run(accessor, context) {
            const editor = context && context.ui ? context.notebookEditor : undefined;
            if (editor && editor.hasModel()) {
                // from toolbar
                const viewType = editor.textModel.viewType;
                const configurationService = accessor.get(configuration_1.IConfigurationService);
                const toolbarPosition = configurationService.getValue(notebookCommon_1.NotebookSetting.cellToolbarLocation);
                const newConfig = this.togglePosition(viewType, toolbarPosition);
                await configurationService.updateValue(notebookCommon_1.NotebookSetting.cellToolbarLocation, newConfig);
            }
        }
        togglePosition(viewType, toolbarPosition) {
            var _a, _b;
            if (typeof toolbarPosition === 'string') {
                // legacy
                if (['left', 'right', 'hidden'].indexOf(toolbarPosition) >= 0) {
                    // valid position
                    const newViewValue = toolbarPosition === 'right' ? 'left' : 'right';
                    const config = {
                        default: toolbarPosition
                    };
                    config[viewType] = newViewValue;
                    return config;
                }
                else {
                    // invalid position
                    const config = {
                        default: 'right',
                    };
                    config[viewType] = 'left';
                    return config;
                }
            }
            else {
                const oldValue = (_b = (_a = toolbarPosition[viewType]) !== null && _a !== void 0 ? _a : toolbarPosition['default']) !== null && _b !== void 0 ? _b : 'right';
                const newViewValue = oldValue === 'right' ? 'left' : 'right';
                const newConfig = Object.assign({}, toolbarPosition);
                newConfig[viewType] = newViewValue;
                return newConfig;
            }
        }
    }
    exports.ToggleCellToolbarPositionAction = ToggleCellToolbarPositionAction;
    (0, actions_1.registerAction2)(ToggleCellToolbarPositionAction);
});
//# sourceMappingURL=layoutActions.js.map