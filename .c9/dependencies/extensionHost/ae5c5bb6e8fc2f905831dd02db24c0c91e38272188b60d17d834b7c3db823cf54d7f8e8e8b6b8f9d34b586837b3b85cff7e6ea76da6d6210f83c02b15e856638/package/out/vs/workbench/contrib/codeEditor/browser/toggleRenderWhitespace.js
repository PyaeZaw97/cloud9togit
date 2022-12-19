/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/nls", "vs/platform/actions/common/actions", "vs/platform/configuration/common/configuration", "vs/platform/contextkey/common/contextkey", "vs/workbench/common/actions"], function (require, exports, nls_1, actions_1, configuration_1, contextkey_1, actions_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class ToggleRenderWhitespaceAction extends actions_1.Action2 {
        constructor() {
            super({
                id: ToggleRenderWhitespaceAction.ID,
                title: {
                    value: (0, nls_1.localize)('toggleRenderWhitespace', "Toggle Render Whitespace"),
                    mnemonicTitle: (0, nls_1.localize)({ key: 'miToggleRenderWhitespace', comment: ['&& denotes a mnemonic'] }, "&&Render Whitespace"),
                    original: 'Toggle Render Whitespace'
                },
                category: actions_2.CATEGORIES.View,
                f1: true,
                toggled: contextkey_1.ContextKeyExpr.notEquals('config.editor.renderWhitespace', 'none'),
                menu: {
                    id: actions_1.MenuId.MenubarViewMenu,
                    group: '5_editor',
                    order: 4
                }
            });
        }
        run(accessor) {
            const configurationService = accessor.get(configuration_1.IConfigurationService);
            const renderWhitespace = configurationService.getValue('editor.renderWhitespace');
            let newRenderWhitespace;
            if (renderWhitespace === 'none') {
                newRenderWhitespace = 'all';
            }
            else {
                newRenderWhitespace = 'none';
            }
            return configurationService.updateValue('editor.renderWhitespace', newRenderWhitespace);
        }
    }
    ToggleRenderWhitespaceAction.ID = 'editor.action.toggleRenderWhitespace';
    (0, actions_1.registerAction2)(ToggleRenderWhitespaceAction);
});
//# sourceMappingURL=toggleRenderWhitespace.js.map