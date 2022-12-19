/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/actions"], function (require, exports, nls_1, actions_1, configuration_1, contextkey_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ToggleMinimapAction = void 0;
    class ToggleMinimapAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleMinimapAction.ID,
                title: {
                    value: (0, nls_1.localize)('toggleMinimap', "Toggle Minimap"),
                    original: 'Toggle Minimap',
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miShowMinimap', comment: ['&& denotes a mnemonic'] }, "Show &&Minimap")
                },
                category: actions_2.CATEGORIES.View,
                f1: true,
                toggled: contextkey_1.ContextKeyExpr.equals('config.editor.minimap.enabled', true),
                menu: {
                    id: actions_1.MenuId.MenubarViewMenu,
                    group: '5_editor',
                    order: 2
                }
            });
        }
        async run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const newValue = !configurationService.getValue('editor.minimap.enabled');
            return configurationService.updateValue('editor.minimap.enabled', newValue);
        }
    }
    exports.ToggleMinimapAction = ToggleMinimapAction;
    ToggleMinimapAction.ID = 'editor.action.toggleMinimap';
    (0, actions_1.registerAction2)(ToggleMinimapAction);
});
//# sourceMappingURL=toggleMinimap.js.map